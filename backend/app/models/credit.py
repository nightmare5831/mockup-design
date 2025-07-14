from typing import Optional, List
from datetime import datetime, timedelta
from prisma import Prisma
from prisma.models import Credit as PrismaCredit


class CreditModel:
    """Credit model with business logic"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def add_credits(
        self,
        user_id: str,
        amount: int,
        expires_at: Optional[datetime] = None,
        source: str = "purchase"
    ) -> PrismaCredit:
        """Add credits to user account"""
        if not expires_at:
            # Default expiry: 1 year from now
            expires_at = datetime.utcnow() + timedelta(days=365)
        
        return await self.db.credit.create(
            data={
                "user_id": user_id,
                "amount": amount,
                "used": 0,
                "expires_at": expires_at
            }
        )
    
    async def get_user_credits(self, user_id: str) -> List[PrismaCredit]:
        """Get all user credits"""
        return await self.db.credit.find_many(
            where={"user_id": user_id},
            order={"expires_at": "asc"}
        )
    
    async def get_available_credits(self, user_id: str) -> List[PrismaCredit]:
        """Get available (non-expired, non-fully-used) credits"""
        return await self.db.credit.find_many(
            where={
                "user_id": user_id,
                "used": {"lt": self.db.credit.fields.amount},
                "OR": [
                    {"expires_at": None},
                    {"expires_at": {"gt": datetime.utcnow()}}
                ]
            },
            order={"expires_at": "asc"}
        )
    
    async def get_credit_balance(self, user_id: str) -> dict:
        """Get detailed credit balance information"""
        credits = await self.get_user_credits(user_id)
        
        total_credits = sum(c.amount for c in credits)
        used_credits = sum(c.used for c in credits)
        remaining_credits = total_credits - used_credits
        
        # Get available (non-expired) credits
        available_credits = await self.get_available_credits(user_id)
        available_amount = sum(c.amount - c.used for c in available_credits)
        
        # Credits expiring soon (next 30 days)
        thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
        expiring_credits = [
            c for c in available_credits
            if c.expires_at and c.expires_at <= thirty_days_from_now
        ]
        expiring_amount = sum(c.amount - c.used for c in expiring_credits)
        
        # Next expiry date
        next_expiry = None
        if available_credits:
            future_expiries = [
                c.expires_at for c in available_credits
                if c.expires_at and c.expires_at > datetime.utcnow()
            ]
            if future_expiries:
                next_expiry = min(future_expiries)
        
        return {
            "total_credits": total_credits,
            "used_credits": used_credits,
            "remaining_credits": remaining_credits,
            "available_credits": available_amount,
            "expiring_soon": expiring_amount,
            "next_expiry_date": next_expiry
        }
    
    async def use_credit(self, user_id: str) -> Optional[PrismaCredit]:
        """Use one credit (FIFO - first expiring first)"""
        available_credits = await self.get_available_credits(user_id)
        
        for credit in available_credits:
            if credit.amount > credit.used:
                # Use this credit
                await self.db.credit.update(
                    where={"id": credit.id},
                    data={"used": credit.used + 1}
                )
                return credit
        
        return None
    
    async def refund_credit(self, credit_id: str) -> bool:
        """Refund one credit"""
        credit = await self.db.credit.find_unique(where={"id": credit_id})
        
        if not credit or credit.used <= 0:
            return False
        
        await self.db.credit.update(
            where={"id": credit_id},
            data={"used": credit.used - 1}
        )
        
        return True
    
    async def expire_old_credits(self) -> int:
        """Mark expired credits as fully used"""
        expired_credits = await self.db.credit.find_many(
            where={
                "expires_at": {"lt": datetime.utcnow()},
                "used": {"lt": self.db.credit.fields.amount}
            }
        )
        
        count = 0
        for credit in expired_credits:
            await self.db.credit.update(
                where={"id": credit.id},
                data={"used": credit.amount}
            )
            count += 1
        
        return count
    
    async def get_credit_history(
        self,
        user_id: str,
        skip: int = 0,
        take: int = 20
    ) -> List[dict]:
        """Get credit transaction history"""
        # Get credit additions (purchases, bonuses)
        credits = await self.db.credit.find_many(
            where={"user_id": user_id},
            skip=skip,
            take=take,
            order={"created_at": "desc"}
        )
        
        transactions = []
        for credit in credits:
            transactions.append({
                "id": credit.id,
                "type": "addition",
                "amount": credit.amount,
                "description": f"Credits added",
                "created_at": credit.created_at,
                "expires_at": credit.expires_at
            })
        
        return transactions
    
    async def get_expiring_credits(self, days: int = 30) -> List[PrismaCredit]:
        """Get credits expiring within specified days"""
        cutoff_date = datetime.utcnow() + timedelta(days=days)
        
        return await self.db.credit.find_many(
            where={
                "expires_at": {
                    "gte": datetime.utcnow(),
                    "lte": cutoff_date
                },
                "used": {"lt": self.db.credit.fields.amount}
            },
            include={"user": True},
            order={"expires_at": "asc"}
        )
    
    async def get_credit_stats(self) -> dict:
        """Get credit system statistics"""
        # Total credits issued
        total_issued = await self.db.credit.aggregate(
            sum={"amount": True}
        )
        
        # Total credits used
        total_used = await self.db.credit.aggregate(
            sum={"used": True}
        )
        
        # Active users with credits
        users_with_credits = await self.db.credit.group_by(
            by=["user_id"],
            where={
                "used": {"lt": self.db.credit.fields.amount}
            }
        )
        
        # Credits by expiry status
        now = datetime.utcnow()
        active_credits = await self.db.credit.count(
            where={
                "OR": [
                    {"expires_at": None},
                    {"expires_at": {"gt": now}}
                ],
                "used": {"lt": self.db.credit.fields.amount}
            }
        )
        
        expired_credits = await self.db.credit.count(
            where={
                "expires_at": {"lte": now},
                "used": {"lt": self.db.credit.fields.amount}
            }
        )
        
        return {
            "total_issued": total_issued.get("sum", {}).get("amount", 0),
            "total_used": total_used.get("sum", {}).get("used", 0),
            "users_with_credits": len(users_with_credits),
            "active_credits": active_credits,
            "expired_credits": expired_credits,
            "utilization_rate": (
                total_used.get("sum", {}).get("used", 0) /
                total_issued.get("sum", {}).get("amount", 1) * 100
            )
        }