from fastapi import APIRouter, Depends, Query
from typing import Optional
from prisma.models import User
from app.config.database import get_db
from app.api.deps import get_current_user, get_admin_user
from app.core.auth import verify_password, get_password_hash
from app.core.exceptions import ValidationError, NotFoundError
from app.schemas.user import (
    UserResponse, 
    UserUpdate, 
    UserChangePassword,
    UserProfile,
    UserListResponse
)
from app.schemas.credit import CreditBalance

router = APIRouter()

@router.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": "Welcome", "user": current_user}

@router.get("/users/me", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get current user profile with additional stats"""
    # Get credit balance
    credits = await db.credit.find_many(
        where={"user_id": current_user.id}
    )
    total_credits = sum(c.amount for c in credits)
    used_credits = sum(c.used for c in credits)
    
    # Get mockup count
    total_mockups = await db.mockup.count(
        where={"user_id": current_user.id}
    )
    
    # Check for active subscription
    active_subscription = await db.subscription.find_first(
        where={
            "user_id": current_user.id,
            "status": "ACTIVE"
        }
    )
    
    return UserProfile(
        **current_user.dict(),
        total_credits=total_credits,
        used_credits=used_credits,
        total_mockups=total_mockups,
        has_active_subscription=active_subscription is not None
    )


@router.put("/users/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update current user profile"""
    update_data = user_update.dict(exclude_unset=True)
    
    if not update_data:
        return UserResponse.from_orm(current_user)
    
    # Check if email is being changed and if it's already taken
    if "email" in update_data:
        existing_user = await db.user.find_unique(
            where={"email": update_data["email"]}
        )
        if existing_user and existing_user.id != current_user.id:
            raise ValidationError("Email already in use")
    
    updated_user = await db.user.update(
        where={"id": current_user.id},
        data=update_data
    )
    
    return UserResponse.from_orm(updated_user)


@router.post("/users/me/change-password")
async def change_password(
    password_data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Change user password"""
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise ValidationError("Current password is incorrect")
    
    # Hash new password
    new_password_hash = get_password_hash(password_data.new_password)
    
    # Update password
    await db.user.update(
        where={"id": current_user.id},
        data={"password_hash": new_password_hash}
    )
    
    return {"message": "Password changed successfully"}


@router.get("/users/me/credits", response_model=CreditBalance)
async def get_user_credits(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user's credit balance"""
    from datetime import datetime, timedelta
    
    credits = await db.credit.find_many(
        where={"user_id": current_user.id}
    )
    
    total_credits = sum(c.amount for c in credits)
    used_credits = sum(c.used for c in credits)
    remaining_credits = total_credits - used_credits
    
    # Calculate expiring credits (next 30 days)
    thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
    expiring_credits = await db.credit.find_many(
        where={
            "user_id": current_user.id,
            "expires_at": {
                "lte": thirty_days_from_now,
                "gte": datetime.utcnow()
            }
        }
    )
    
    expiring_soon = sum(c.amount - c.used for c in expiring_credits if c.amount > c.used)
    
    # Next expiry date
    next_expiry = await db.credit.find_first(
        where={
            "user_id": current_user.id,
            "expires_at": {"gte": datetime.utcnow()}
        },
        order={"expires_at": "asc"}
    )
    
    return CreditBalance(
        total_credits=total_credits,
        used_credits=used_credits,
        remaining_credits=remaining_credits,
        expiring_soon=expiring_soon,
        next_expiry_date=next_expiry.expires_at if next_expiry else None
    )


@router.delete("/users/me")
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Delete user account (soft delete)"""
    await db.user.update(
        where={"id": current_user.id},
        data={"is_active": False}
    )
    
    return {"message": "Account deactivated successfully"}


# Admin endpoints
@router.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """List all users (admin only)"""
    skip = (page - 1) * per_page
    
    # Build where clause
    where = {}
    if search:
        where["OR"] = [
            {"email": {"contains": search, "mode": "insensitive"}},
            {"first_name": {"contains": search, "mode": "insensitive"}},
            {"last_name": {"contains": search, "mode": "insensitive"}}
        ]
    if role:
        where["role"] = role
    
    # Get users and total count
    users = await db.user.find_many(
        where=where,
        skip=skip,
        take=per_page,
        order={"created_at": "desc"}
    )
    
    total = await db.user.count(where=where)
    total_pages = (total + per_page - 1) // per_page
    
    return UserListResponse(
        users=[UserResponse.from_orm(user) for user in users],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Activate user account (admin only)"""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise NotFoundError("User not found")
    
    await db.user.update(
        where={"id": user_id},
        data={"is_active": True}
    )
    
    return {"message": "User activated successfully"}


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Deactivate user account (admin only)"""
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise NotFoundError("User not found")
    
    await db.user.update(
        where={"id": user_id},
        data={"is_active": False}
    )
    
    return {"message": "User deactivated successfully"}