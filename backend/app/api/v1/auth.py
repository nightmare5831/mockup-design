from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from datetime import datetime
from prisma.models import User
from app.config.database import get_db
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

from app.core.auth import (
    verify_password, 
    get_password_hash, 
    create_token_pair,
    verify_token,
    create_password_reset_token,
    verify_password_reset_token
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
    
    # Send welcome email
    try:
        from app.services.email_service import EmailService
        email_service = EmailService()
        user_name = f"{user_data.first_name or ''} {user_data.last_name or ''}".strip() or user.email
        await email_service.send_welcome_email(user.email, user_name)
        logger.info(f"Welcome email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {e}")
    
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
        # Generate JWT-based reset token (no database storage needed)
        reset_token = create_password_reset_token(user.id, user.email)
        
        # Send password reset email
        try:
            from app.services.email_service import EmailService
            email_service = EmailService()
            await email_service.send_password_reset_email(user.email, reset_token)
            logger.info(f"Password reset email sent to {user.email}")
        except Exception as e:
            # Log error but don't reveal it to user for security
            logger.error(f"Failed to send password reset email to {user.email}: {e}")
            # For development, also log the reset token
            if settings.DEBUG:
                logger.info(f"Password reset token for {user.email}: {reset_token}")
                logger.info(f"Reset URL: {settings.FRONTEND_URL}/reset-password/{reset_token}")
    
    return ForgotPasswordResponse(
        message="Password reset email sent."
    )


@router.post("/auth/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db = Depends(get_db)
):
    """Reset user password using reset token"""
    # Verify JWT-based reset token
    payload = verify_password_reset_token(request.token)
    
    if not payload:
        raise AuthenticationError("Password reset token is invalid or has expired.")
    
    user_id = payload.get("sub")
    user_email = payload.get("email")
    
    if not user_id or not user_email:
        raise AuthenticationError("Invalid token payload")
    
    # Find user
    user = await db.user.find_unique(where={"id": user_id})
    if not user or user.email != user_email:
        raise AuthenticationError("User not found or email mismatch")
    
    # Update password
    hashed_password = get_password_hash(request.new_password)
    await db.user.update(
        where={"id": user_id},
        data={"password_hash": hashed_password}
    )
    
    # Send confirmation email
    try:
        from app.services.email_service import EmailService
        email_service = EmailService()
        await email_service.send_password_reset_confirmation(user.email)
        logger.info(f"Password reset confirmation email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send password reset confirmation email to {user.email}: {e}")
    
    return ResetPasswordResponse(
        message="Password has been reset."
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


@router.get("/auth/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if reset token is valid"""
    payload = verify_password_reset_token(token)
    
    if not payload:
        raise AuthenticationError("Password reset token is invalid or has expired.")
    
    return {"message": "Token is valid."}


@router.post("/auth/logout")
async def logout():
    """Logout user (client should delete tokens)"""
    return {"message": "Logged out successfully"}