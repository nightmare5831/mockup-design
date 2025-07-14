from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from prisma.enums import SubscriptionPlan, SubscriptionStatus


class SubscriptionCreate(BaseModel):
    plan: SubscriptionPlan
    payment_method_id: str


class SubscriptionUpdate(BaseModel):
    plan: Optional[SubscriptionPlan] = None


class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan: SubscriptionPlan
    status: SubscriptionStatus
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    client_secret: Optional[str] = None
    
    class Config:
        from_attributes = True


class SubscriptionPlanInfo(BaseModel):
    """Information about subscription plans"""
    plan: SubscriptionPlan
    name: str
    price: float
    credits_per_month: int
    features: list[str]
    is_popular: bool = False


class SubscriptionPlansResponse(BaseModel):
    plans: list[SubscriptionPlanInfo]


class SubscriptionUsage(BaseModel):
    """Current subscription usage"""
    subscription: SubscriptionResponse
    credits_used_this_period: int
    credits_remaining: int
    days_remaining: int
    auto_renew: bool


class CancelSubscriptionRequest(BaseModel):
    reason: Optional[str] = None
    feedback: Optional[str] = None


class CancelSubscriptionResponse(BaseModel):
    message: str
    cancellation_date: datetime
    refund_amount: Optional[float] = None