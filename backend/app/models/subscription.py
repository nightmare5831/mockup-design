from typing import Optional, List
from datetime import datetime, timedelta
from prisma import Prisma
from prisma.models import Subscription as PrismaSubscription
from prisma.enums import SubscriptionStatus, SubscriptionPlan
from app.config.settings import settings


class SubscriptionModel:
    """Subscription model with business logic"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_subscription(
        self,
        user_id: str,
        plan: SubscriptionPlan,
        stripe_id: str,
        current_period_start: datetime,
        current_period_end: datetime
    ) -> PrismaSubscription:
        """Create a new subscription"""
        subscription = await self.db.subscription.create(
            data={
                "user_id": user_id,
                "plan": plan,
                "status": SubscriptionStatus.ACTIVE,
                "stripe_id": stripe_id,
                "current_period_start": current_period_start,
                "current_period_end": current_period_end
            }
        )
        
        # Add initial monthly credits
        plan_info = settings.SUBSCRIPTION_PLANS[plan.value]
        await self.db.credit.create(
            data={
                "user_id": user_id,
                "amount": plan_info["credits_per_month"],
                "used": 0,
                "expires_at": current_period_end
            }
        )
        
        # Update user role
        await self.db.user.update(
            where={"id": user_id},
            data={"role": "SUBSCRIBED"}
        )
        
        return subscription
    
    async def get_user_subscription(self, user_id: str) -> Optional[PrismaSubscription]:
        """Get user's active subscription"""
        return await self.db.subscription.find_first(
            where={
                "user_id": user_id,
                "status": SubscriptionStatus.ACTIVE
            }
        )
    
    async def get_subscription_by_stripe_id(self, stripe_id: str) -> Optional[PrismaSubscription]:
        """Get subscription by Stripe ID"""
        return await self.db.subscription.find_unique(
            where={"stripe_id": stripe_id}
        )
    
    async def update_subscription(
        self,
        subscription_id: str,
        update_data: dict
    ) -> Optional[PrismaSubscription]:
        """Update subscription"""
        return await self.db.subscription.update(
            where={"id": subscription_id},
            data=update_data
        )
    
    async def cancel_subscription(
        self,
        user_id: str,
        immediate: bool = False
    ) -> bool:
        """Cancel user's subscription"""
        subscription = await self.get_user_subscription(user_id)
        
        if not subscription:
            return False
        
        # Update subscription status
        new_status = SubscriptionStatus.CANCELLED
        update_data = {"status": new_status}
        
        if immediate:
            update_data["current_period_end"] = datetime.utcnow()
        
        await self.update_subscription(subscription.id, update_data)
        
        # Update user role if no other active subscriptions
        other_active = await self.db.subscription.find_first(
            where={
                "user_id": user_id,
                "status": SubscriptionStatus.ACTIVE,
                "id": {"not": subscription.id}
            }
        )
        
        if not other_active:
            await self.db.user.update(
                where={"id": user_id},
                data={"role": "REGISTERED"}
            )
        
        return True
    
    async def reactivate_subscription(self, user_id: str) -> bool:
        """Reactivate a cancelled subscription"""
        subscription = await self.db.subscription.find_first(
            where={
                "user_id": user_id,
                "status": SubscriptionStatus.CANCELLED
            }
        )
        
        if not subscription:
            return False
        
        # Check if still within current period
        if datetime.utcnow() > subscription.current_period_end:
            return False
        
        # Reactivate
        await self.update_subscription(
            subscription.id,
            {"status": SubscriptionStatus.ACTIVE}
        )
        
        # Update user role
        await self.db.user.update(
            where={"id": user_id},
            data={"role": "SUBSCRIBED"}
        )
        
        return True
    
    async def renew_subscription(self, subscription_id: str) -> bool:
        """Renew subscription for next period"""
        subscription = await self.db.subscription.find_unique(
            where={"id": subscription_id}
        )
        
        if not subscription:
            return False
        
        # Calculate new period
        new_start = subscription.current_period_end
        new_end = new_start + timedelta(days=30)  # Monthly billing
        
        # Update subscription period
        await self.update_subscription(
            subscription_id,
            {
                "current_period_start": new_start,
                "current_period_end": new_end
            }
        )
        
        # Add monthly credits
        plan_info = settings.SUBSCRIPTION_PLANS[subscription.plan.value]
        await self.db.credit.create(
            data={
                "user_id": subscription.user_id,
                "amount": plan_info["credits_per_month"],
                "used": 0,
                "expires_at": new_end
            }
        )
        
        return True
    
    async def get_subscription_usage(self, user_id: str) -> dict:
        """Get subscription usage for current period"""
        subscription = await self.get_user_subscription(user_id)
        
        if not subscription:
            return {}
        
        # Get credits for current period
        period_credits = await self.db.credit.find_many(
            where={
                "user_id": user_id,
                "created_at": {
                    "gte": subscription.current_period_start,
                    "lte": subscription.current_period_end
                }
            }
        )
        
        plan_info = settings.SUBSCRIPTION_PLANS[subscription.plan.value]
        credits_allocated = plan_info["credits_per_month"]
        credits_used = sum(c.used for c in period_credits)
        
        # Calculate days remaining
        days_remaining = (subscription.current_period_end - datetime.utcnow()).days
        
        return {
            "subscription": subscription,
            "credits_allocated": credits_allocated,
            "credits_used": credits_used,
            "credits_remaining": max(0, credits_allocated - credits_used),
            "days_remaining": max(0, days_remaining),
            "usage_percentage": (credits_used / credits_allocated * 100) if credits_allocated > 0 else 0
        }
    
    async def get_expiring_subscriptions(self, days: int = 7) -> List[PrismaSubscription]:
        """Get subscriptions expiring within specified days"""
        cutoff_date = datetime.utcnow() + timedelta(days=days)
        
        return await self.db.subscription.find_many(
            where={
                "status": SubscriptionStatus.ACTIVE,
                "current_period_end": {"lte": cutoff_date}
            },
            include={"user": True}
        )
    
    async def get_subscription_stats(self) -> dict:
        """Get subscription statistics"""
        total_subscriptions = await self.db.subscription.count()
        active_subscriptions = await self.db.subscription.count(
            where={"status": SubscriptionStatus.ACTIVE}
        )
        
        # Plan distribution
        plan_stats = {}
        for plan in SubscriptionPlan:
            count = await self.db.subscription.count(
                where={
                    "plan": plan,
                    "status": SubscriptionStatus.ACTIVE
                }
            )
            plan_stats[plan.value] = count
        
        # Monthly recurring revenue
        mrr = 0
        for plan, count in plan_stats.items():
            plan_price = settings.SUBSCRIPTION_PLANS[plan]["price"]
            mrr += plan_price * count
        
        # Churn rate (cancelled in last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        cancelled_recently = await self.db.subscription.count(
            where={
                "status": SubscriptionStatus.CANCELLED,
                "updated_at": {"gte": thirty_days_ago}
            }
        )
        
        churn_rate = (cancelled_recently / active_subscriptions * 100) if active_subscriptions > 0 else 0
        
        return {
            "total_subscriptions": total_subscriptions,
            "active_subscriptions": active_subscriptions,
            "plan_distribution": plan_stats,
            "monthly_recurring_revenue": mrr,
            "churn_rate": churn_rate,
            "retention_rate": 100 - churn_rate
        }