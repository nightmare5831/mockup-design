from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from prisma.models import User
from prisma.enums import UserRole
from app.config.database import get_db
from app.core.auth import verify_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from datetime import datetime


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    
    token = credentials.credentials
    payload = verify_token(token, "access")
    
    if payload is None:
        raise AuthenticationError("Invalid or expired token")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")
    
    user = await db.user.find_unique(where={"id": user_id})
    if user is None:
        raise AuthenticationError("User not found")
    
    if not user.is_active:
        raise AuthenticationError("Account is deactivated")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise AuthenticationError("Account is deactivated")
    return current_user


async def get_current_subscribed_user(
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_db)
) -> User:
    """Get current user with active subscription"""
    if current_user.role not in [UserRole.SUBSCRIBED, UserRole.ADMIN]:
        # Check if user has active subscription
        subscription = await db.subscription.find_first(
            where={
                "user_id": current_user.id,
                "status": "ACTIVE"
            }
        )
        if subscription is None:
            raise AuthorizationError("Active subscription required")
    
    return current_user


async def get_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current admin user"""
    if current_user.role != UserRole.ADMIN:
        raise AuthorizationError("Admin access required")
    return current_user


async def optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db = Depends(get_db)
) -> Optional[User]:
    """Get current user if token is provided (optional authentication)"""
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_token(token, "access")
        
        if payload is None:
            return None
        
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        user = await db.user.find_unique(where={"id": user_id})
        if user is None or not user.is_active:
            return None
        
        return user
    except Exception:
        return None


class RateLimiter:
    """Simple rate limiter dependency"""
    def __init__(self, requests: int = 100, window: int = 3600):
        self.requests = requests
        self.window = window
        self.clients = {}
    
    async def __call__(self, current_user: Optional[User] = Depends(optional_current_user)):
        # For now, just return - implement Redis-based rate limiting later
        return True