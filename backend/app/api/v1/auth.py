from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from datetime import datetime
from prisma.models import User
from app.config.database import get_db
from app.config.settings import settings
import logging
from app.core.auth import (
    verify_password, 
    get_password_hash, 
    create_token_pair,
    verify_token,
    create_reset_token
)
from app.core.exceptions import (
    AuthenticationError, 
    ConflictError, 
    NotFoundError,
    ValidationError
)
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse
)
from app.schemas.user import UserResponse
from app.api.deps import get_current_user, verify_token

router = APIRouter()
security = HTTPBearer()


@router.post("/auth/register", response_model=RegisterResponse)
async def register(
    user_data: RegisterRequest,
    db = Depends(get_db)
):
    """Register a new user"""
    existing_user = await db.user.find_unique(
        where={"email": user_data.email}
    )
    # Check if user already exists
    if existing_user:
        raise ConflictError("User with this email already exists")
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user = await db.user.create(
        data={
            "email": user_data.email,
            "password_hash": hashed_password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
        }
    )
    
    # Give free credits to new user
    await db.credit.create(
        data={
            "user_id": user.id,
            "amount": settings.FREE_CREDITS_ON_SIGNUP,
            "used": 0
        }
    )
    
    return RegisterResponse(
        message="User registered successfully",
        user={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    )


@router.post("/auth/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db = Depends(get_db)
):
    """Authenticate user and return tokens"""
    # Find user
    user = await db.user.find_unique(
        where={"email": login_data.email}
    )
    
    if not user:
        raise AuthenticationError("Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise AuthenticationError("Invalid email or password")
    
    # Check if user is active
    if not user.is_active:
        raise AuthenticationError("Account is deactivated")
    
    # Update last login
    await db.user.update(
        where={"id": user.id},
        data={"last_login": datetime.utcnow()}
    )
    
    # Get user's credit balance
    credits = await db.credit.find_many(
        where={"user_id": user.id}
    )
    
    total_credits = sum(c.amount for c in credits)
    used_credits = sum(c.used for c in credits)
    available_credits = total_credits - used_credits
    
    # Create tokens
    tokens = create_token_pair(user.id, user.email)
    
    return LoginResponse(
        **tokens,
        user={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "credits": available_credits
        }
    )


@router.post("/auth/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db = Depends(get_db)
):
    """Refresh access token using refresh token"""
    payload = verify_token(refresh_data.refresh_token, "refresh")
    
    if payload is None:
        raise AuthenticationError("Invalid or expired refresh token")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")
    
    # Verify user still exists and is active
    user = await db.user.find_unique(where={"id": user_id})
    if not user or not user.is_active:
        raise AuthenticationError("User not found or deactivated")
    
    # Create new access token
    from app.core.auth import create_access_token
    access_token = create_access_token({"sub": user.id, "email": user.email})
    
    return RefreshTokenResponse(
        access_token=access_token,
        token_type="bearer"
    )


@router.post("/auth/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db = Depends(get_db)
):
    """Send password reset email"""
    user = await db.user.find_unique(
        where={"email": request.email}
    )
    
    # Always return success for security reasons
    # (don't reveal whether email exists)
    if user:
        # Generate reset token
        reset_token = create_reset_token(user.id, user.email)
        
        # TODO: Send email with reset token (email service disabled for now)
        # For now, just log the reset token
        logger.info(f"Password reset token for {user.email}: {reset_token}")
        logger.info(f"Reset URL: {settings.FRONTEND_URL}/reset-password?token={reset_token}")
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Password reset requested for {request.email}")
    
    return ForgotPasswordResponse(
        message="If the email exists, a password reset link has been sent"
    )


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db = Depends(get_db)
):
    """Reset user password using reset token"""
    # Verify reset token
    payload = verify_token(request.token, "reset")
    
    if payload is None:
        raise AuthenticationError("Invalid or expired reset token")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")
    
    # Find user
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise NotFoundError("User not found")
    
    # Update password
    hashed_password = get_password_hash(request.new_password)
    await db.user.update(
        where={"id": user_id},
        data={"password_hash": hashed_password}
    )
    
    return ResetPasswordResponse(
        message="Password has been reset successfully"
    )


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.get("/auth/verify", response_model=UserResponse)
async def verify(
    current_user: User = Depends(get_current_user)
):
    """Get current user verify"""
    return UserResponse.from_orm(current_user)


@router.post("/auth/logout")
async def logout():
    """Logout user (client should delete tokens)"""
    return {"message": "Logged out successfully"}