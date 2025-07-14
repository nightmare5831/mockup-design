from typing import Optional, List
from datetime import datetime
from prisma import Prisma
from prisma.models import User as PrismaUser
from prisma.enums import UserRole
from app.core.auth import get_password_hash, verify_password


class UserModel:
    """User model with business logic"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_user(
        self,
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        role: UserRole = UserRole.REGISTERED
    ) -> PrismaUser:
        """Create a new user"""
        hashed_password = get_password_hash(password)
        
        user = await self.db.user.create(
            data={
                "email": email,
                "password_hash": hashed_password,
                "first_name": first_name,
                "last_name": last_name,
                "role": role
            }
        )
        
        # Give free credits to new users
        from app.config.settings import settings
        await self.db.credit.create(
            data={
                "user_id": user.id,
                "amount": settings.FREE_CREDITS_ON_SIGNUP,
                "used": 0
            }
        )
        
        return user
    
    async def get_user_by_email(self, email: str) -> Optional[PrismaUser]:
        """Get user by email"""
        return await self.db.user.find_unique(where={"email": email})
    
    async def get_user_by_id(self, user_id: str) -> Optional[PrismaUser]:
        """Get user by ID"""
        return await self.db.user.find_unique(where={"id": user_id})
    
    async def authenticate_user(self, email: str, password: str) -> Optional[PrismaUser]:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email)
        
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            return None
        
        # Update last login
        await self.db.user.update(
            where={"id": user.id},
            data={"last_login": datetime.utcnow()}
        )
        
        return user
    
    async def update_user(
        self,
        user_id: str,
        update_data: dict
    ) -> Optional[PrismaUser]:
        """Update user information"""
        return await self.db.user.update(
            where={"id": user_id},
            data=update_data
        )
    
    async def change_password(
        self,
        user_id: str,
        new_password: str
    ) -> bool:
        """Change user password"""
        try:
            hashed_password = get_password_hash(new_password)
            await self.db.user.update(
                where={"id": user_id},
                data={"password_hash": hashed_password}
            )
            return True
        except Exception:
            return False
    
    async def deactivate_user(self, user_id: str) -> bool:
        """Deactivate user account"""
        try:
            await self.db.user.update(
                where={"id": user_id},
                data={"is_active": False}
            )
            return True
        except Exception:
            return False
    
    async def get_user_stats(self, user_id: str) -> dict:
        """Get comprehensive user statistics"""
        # Get credit information
        credits = await self.db.credit.find_many(
            where={"user_id": user_id}
        )
        
        total_credits = sum(c.amount for c in credits)
        used_credits = sum(c.used for c in credits)
        
        # Get mockup statistics
        total_mockups = await self.db.mockup.count(
            where={"user_id": user_id}
        )
        
        completed_mockups = await self.db.mockup.count(
            where={
                "user_id": user_id,
                "status": "COMPLETED"
            }
        )
        
        # Get subscription info
        active_subscription = await self.db.subscription.find_first(
            where={
                "user_id": user_id,
                "status": "ACTIVE"
            }
        )
        
        # Get payment history
        total_spent = await self.db.payment.aggregate(
            where={
                "user_id": user_id,
                "status": "COMPLETED"
            },
            sum={"amount": True}
        )
        
        return {
            "credits": {
                "total": total_credits,
                "used": used_credits,
                "remaining": total_credits - used_credits
            },
            "mockups": {
                "total": total_mockups,
                "completed": completed_mockups,
                "success_rate": completed_mockups / total_mockups if total_mockups > 0 else 0
            },
            "subscription": {
                "active": active_subscription is not None,
                "plan": active_subscription.plan if active_subscription else None
            },
            "payments": {
                "total_spent": float(total_spent.get("sum", {}).get("amount", 0))
            }
        }
    
    async def search_users(
        self,
        query: str,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        take: int = 20
    ) -> tuple[List[PrismaUser], int]:
        """Search users with filters"""
        where = {}
        
        if query:
            where["OR"] = [
                {"email": {"contains": query, "mode": "insensitive"}},
                {"first_name": {"contains": query, "mode": "insensitive"}},
                {"last_name": {"contains": query, "mode": "insensitive"}}
            ]
        
        if role:
            where["role"] = role
        
        if is_active is not None:
            where["is_active"] = is_active
        
        users = await self.db.user.find_many(
            where=where,
            skip=skip,
            take=take,
            order={"created_at": "desc"}
        )
        
        total = await self.db.user.count(where=where)
        
        return users, total