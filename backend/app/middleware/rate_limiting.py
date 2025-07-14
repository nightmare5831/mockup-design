import time
import asyncio
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import redis.asyncio as redis
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """Rate limiting middleware using Redis for distributed rate limiting"""
    
    def __init__(self):
        self.redis_client = None
        self.memory_store: Dict[str, Tuple[int, float]] = {}  # Fallback for when Redis is unavailable
        
    async def get_redis_client(self):
        if self.redis_client is None and settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL)
                await self.redis_client.ping()
            except Exception as e:
                logger.warning(f"Redis unavailable, falling back to memory store: {e}")
                self.redis_client = None
        return self.redis_client
    
    async def is_rate_limited(self, key: str, limit: int, window: int) -> bool:
        """Check if request should be rate limited"""
        redis_client = await self.get_redis_client()
        
        if redis_client:
            return await self._redis_rate_limit(redis_client, key, limit, window)
        else:
            return await self._memory_rate_limit(key, limit, window)
    
    async def _redis_rate_limit(self, redis_client, key: str, limit: int, window: int) -> bool:
        """Redis-based rate limiting"""
        try:
            current_time = int(time.time())
            pipeline = redis_client.pipeline()
            
            # Remove expired entries
            pipeline.zremrangebyscore(key, 0, current_time - window)
            
            # Count current requests
            pipeline.zcard(key)
            
            # Add current request
            pipeline.zadd(key, {str(current_time): current_time})
            
            # Set expiry
            pipeline.expire(key, window)
            
            results = await pipeline.execute()
            request_count = results[1]
            
            return request_count >= limit
            
        except Exception as e:
            logger.error(f"Redis rate limiting error: {e}")
            # Fallback to memory store
            return await self._memory_rate_limit(key, limit, window)
    
    async def _memory_rate_limit(self, key: str, limit: int, window: int) -> bool:
        """Memory-based rate limiting (fallback)"""
        current_time = time.time()
        
        if key in self.memory_store:
            count, first_request_time = self.memory_store[key]
            
            # Reset if outside window
            if current_time - first_request_time > window:
                self.memory_store[key] = (1, current_time)
                return False
            
            # Check if limit exceeded
            if count >= limit:
                return True
            
            # Increment counter
            self.memory_store[key] = (count + 1, first_request_time)
            return False
        else:
            # First request
            self.memory_store[key] = (1, current_time)
            return False
    
    def get_rate_limit_config(self, path: str) -> Tuple[int, int]:
        """Get rate limit configuration for a given path"""
        # API-specific rate limits
        if path.startswith("/api/v1/auth/login"):
            return settings.RATE_LIMIT_LOGIN_PER_MINUTE, 60
        elif path.startswith("/api/v1/auth/register"):
            return settings.RATE_LIMIT_REGISTER_PER_HOUR, 3600
        elif path.startswith("/api/v1/mockups") and "POST" in path:
            return settings.RATE_LIMIT_MOCKUP_GENERATION_PER_HOUR, 3600
        elif path.startswith("/api/v1/payments"):
            return settings.RATE_LIMIT_PAYMENTS_PER_HOUR, 3600
        else:
            # General API rate limit
            return settings.RATE_LIMIT_GENERAL_PER_MINUTE, 60
    
    def get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for the client"""
        # Try to get user ID from auth headers
        auth_header = request.headers.get("authorization")
        if auth_header:
            try:
                # Extract user info from token (simplified)
                from app.core.auth import verify_token
                token = auth_header.replace("Bearer ", "")
                payload = verify_token(token)
                if payload:
                    return f"user:{payload.get('sub')}"
            except:
                pass
        
        # Fallback to IP address
        client_ip = request.client.host
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        return f"ip:{client_ip}"


# Global rate limiter instance
rate_limiter = RateLimitMiddleware()


async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware function"""
    # Skip rate limiting for health checks, static files, and webhooks
    if (request.url.path in ["/health", "/"] or 
        request.url.path.startswith("/uploads") or
        request.url.path.startswith("/api/v1/payments/webhook") or
        request.url.path.startswith("/api/v1/payments/setup-intent")):
        return await call_next(request)
    
    # Get rate limit configuration
    limit, window = rate_limiter.get_rate_limit_config(request.url.path)
    
    # Get client identifier
    client_id = rate_limiter.get_client_identifier(request)
    
    # Create rate limit key
    rate_limit_key = f"rate_limit:{client_id}:{request.url.path}:{request.method}"
    
    # Check rate limit
    is_limited = await rate_limiter.is_rate_limited(rate_limit_key, limit, window)
    
    if is_limited:
        logger.warning(f"Rate limit exceeded for {client_id} on {request.url.path}")
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": "Rate limit exceeded. Please try again later.",
                "limit": limit,
                "window": window
            },
            headers={
                "Retry-After": str(window),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Window": str(window)
            }
        )
    
    # Add rate limit headers to response
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Window"] = str(window)
    
    return response