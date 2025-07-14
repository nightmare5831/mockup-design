from fastapi import APIRouter, Depends
from typing import Optional
from prisma.models import User
from prisma.enums import SubscriptionPlan, SubscriptionStatus
from app.config.database import get_db
from app.config.settings import settings
from app.api.deps import get_current_user
from app.core.exceptions import ValidationError, NotFoundError, PaymentError
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    SubscriptionPlanInfo,
    SubscriptionPlansResponse,
    SubscriptionUsage,
    CancelSubscriptionRequest,
    CancelSubscriptionResponse
)
from app.services.payment_service import PaymentService
from datetime import datetime, timedelta

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/subscriptions/plans", response_model=SubscriptionPlansResponse)
async def get_subscription_plans():
    """Get available subscription plans"""
    plans = []
    
    for plan_key, plan_info in settings.SUBSCRIPTION_PLANS.items():
        plans.append(
            SubscriptionPlanInfo(
                plan=getattr(SubscriptionPlan, plan_key),
                name=plan_info["name"],
                price=plan_info["price"],
                credits_per_month=plan_info["credits_per_month"],
                features=plan_info["features"],
                is_popular=(plan_key == "PRO")
            )
        )
    
    return SubscriptionPlansResponse(plans=plans)


@router.post("/subscriptions", response_model=SubscriptionResponse)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create new subscription"""
    # Check if user already has an active subscription
    existing = await db.subscription.find_first(
        where={
            "user_id": current_user.id,
            "status": SubscriptionStatus.ACTIVE
        }
    )
    
    if existing:
        raise ValidationError("User already has an active subscription")
    
    # Validate plan
    plan_key = subscription_data.plan.value
    if plan_key not in settings.SUBSCRIPTION_PLANS:
        raise ValidationError("Invalid subscription plan")
    
    plan_info = settings.SUBSCRIPTION_PLANS[plan_key]
    
    try:
        # Get the correct Stripe price ID for the plan
        price_id_map = {
            SubscriptionPlan.BASIC: settings.STRIPE_PRICE_ID_BASIC,
            SubscriptionPlan.PRO: settings.STRIPE_PRICE_ID_PRO,
            SubscriptionPlan.PREMIUM: settings.STRIPE_PRICE_ID_PREMIUM
        }
        price_id = price_id_map.get(subscription_data.plan)
        
        if not price_id:
            raise ValidationError(f"Invalid subscription plan: {subscription_data.plan}")
        
        # Create Stripe subscription
        payment_service = PaymentService()
        stripe_subscription = await payment_service.create_subscription(
            customer_id=current_user.id,
            price_id=price_id,
            payment_method_id=subscription_data.payment_method_id
        )
        
        # Create subscription record
        subscription_status = SubscriptionStatus.ACTIVE if stripe_subscription.get("status") == "active" else SubscriptionStatus.INACTIVE
        
        # Handle period dates - use current time as default for incomplete subscriptions
        current_time = datetime.utcnow()
        if stripe_subscription.get("current_period_start"):
            period_start = datetime.fromtimestamp(stripe_subscription["current_period_start"])
        else:
            period_start = current_time
            
        if stripe_subscription.get("current_period_end"):
            period_end = datetime.fromtimestamp(stripe_subscription["current_period_end"])
        else:
            # Set end date to 1 month from now as default
            period_end = current_time + timedelta(days=30)
        
        subscription = await db.subscription.create(
            data={
                "user_id": current_user.id,
                "plan": subscription_data.plan,
                "status": subscription_status,
                "stripe_id": stripe_subscription["id"],
                "current_period_start": period_start,
                "current_period_end": period_end
            }
        )
        
        # Add initial monthly credits only if subscription is active
        if subscription_status == SubscriptionStatus.ACTIVE:
            await db.credit.create(
                data={
                    "user_id": current_user.id,
                    "amount": plan_info["credits_per_month"],
                    "used": 0,
                    "expires_at": period_end
                }
            )
            
            # Update user role
            await db.user.update(
                where={"id": current_user.id},
                data={"role": "SUBSCRIBED"}
            )
        
        # Return subscription with payment intent if needed
        response_data = SubscriptionResponse.from_orm(subscription)
        
        # If subscription needs payment confirmation, include payment intent
        if stripe_subscription.get("latest_invoice", {}).get("payment_intent"):
            response_data.client_secret = stripe_subscription["latest_invoice"]["payment_intent"]["client_secret"]
        
        return response_data
        
    except Exception as e:
        raise PaymentError(f"Failed to create subscription: {str(e)}")


@router.get("/subscriptions/current", response_model=Optional[SubscriptionUsage])
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user's current subscription"""
    subscription = await db.subscription.find_first(
        where={
            "user_id": current_user.id,
            "status": SubscriptionStatus.ACTIVE
        }
    )
    
    if not subscription:
        return None
    
    # Calculate usage for current period
    credits_in_period = await db.credit.find_many(
        where={
            "user_id": current_user.id,
            "created_at": {
                "gte": subscription.current_period_start,
                "lte": subscription.current_period_end
            }
        }
    )
    
    credits_used_this_period = sum(c.used for c in credits_in_period)
    plan_credits = settings.SUBSCRIPTION_PLANS[subscription.plan.value]["credits_per_month"]
    credits_remaining = max(0, plan_credits - credits_used_this_period)
    
    # Calculate days remaining
    days_remaining = (subscription.current_period_end - datetime.utcnow()).days
    
    return SubscriptionUsage(
        subscription=SubscriptionResponse.from_orm(subscription),
        credits_used_this_period=credits_used_this_period,
        credits_remaining=credits_remaining,
        days_remaining=max(0, days_remaining),
        auto_renew=True  # Assuming auto-renew is default
    )


@router.put("/subscriptions/current", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_update: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update current subscription"""
    subscription = await db.subscription.find_first(
        where={
            "user_id": current_user.id,
            "status": SubscriptionStatus.ACTIVE
        }
    )
    
    if not subscription:
        raise NotFoundError("No active subscription found")
    
    if subscription_update.plan:
        # Validate new plan
        new_plan_key = subscription_update.plan.value
        if new_plan_key not in settings.SUBSCRIPTION_PLANS:
            raise ValidationError("Invalid subscription plan")
        
        try:
            # Get the correct Stripe price ID for the new plan
            price_id_map = {
                "BASIC": settings.STRIPE_PRICE_ID_BASIC,
                "PRO": settings.STRIPE_PRICE_ID_PRO,
                "PREMIUM": settings.STRIPE_PRICE_ID_PREMIUM
            }
            new_price_id = price_id_map.get(new_plan_key)
            
            if not new_price_id:
                raise ValidationError(f"Invalid subscription plan: {new_plan_key}")
            
            # Update Stripe subscription
            payment_service = PaymentService()
            await payment_service.update_subscription(
                subscription.stripe_id,
                new_price_id=new_price_id
            )
            
            # Update database
            updated_subscription = await db.subscription.update(
                where={"id": subscription.id},
                data={"plan": subscription_update.plan}
            )
            
            return SubscriptionResponse.from_orm(updated_subscription)
            
        except Exception as e:
            raise PaymentError(f"Failed to update subscription: {str(e)}")
    
    return SubscriptionResponse.from_orm(subscription)


@router.post("/subscriptions/cancel", response_model=CancelSubscriptionResponse)
async def cancel_subscription(
    cancel_request: CancelSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Cancel current subscription"""
    subscription = await db.subscription.find_first(
        where={
            "user_id": current_user.id,
            "status": SubscriptionStatus.ACTIVE
        }
    )
    
    if not subscription:
        raise NotFoundError("No active subscription found")
    
    try:
        # Cancel Stripe subscription at period end
        payment_service = PaymentService()
        cancelled_subscription = await payment_service.cancel_subscription(
            subscription.stripe_id,
            at_period_end=True
        )
        
        # Update subscription status
        await db.subscription.update(
            where={"id": subscription.id},
            data={"status": SubscriptionStatus.CANCELLED}
        )
        
        # Update user role if no other active subscriptions
        await db.user.update(
            where={"id": current_user.id},
            data={"role": "REGISTERED"}
        )
        
        return CancelSubscriptionResponse(
            message="Subscription cancelled successfully. You'll retain access until the end of your billing period.",
            cancellation_date=subscription.current_period_end,
            refund_amount=None
        )
        
    except Exception as e:
        raise PaymentError(f"Failed to cancel subscription: {str(e)}")


@router.post("/subscriptions/reactivate", response_model=SubscriptionResponse)
async def reactivate_subscription(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Reactivate a cancelled subscription"""
    subscription = await db.subscription.find_first(
        where={
            "user_id": current_user.id,
            "status": SubscriptionStatus.CANCELLED
        }
    )
    
    if not subscription:
        raise NotFoundError("No cancelled subscription found")
    
    # Check if subscription is still within the current period
    if datetime.utcnow() > subscription.current_period_end:
        raise ValidationError("Subscription period has ended. Please create a new subscription.")
    
    try:
        # Reactivate Stripe subscription
        payment_service = PaymentService()
        await payment_service.reactivate_subscription(subscription.stripe_id)
        
        # Update subscription status
        updated_subscription = await db.subscription.update(
            where={"id": subscription.id},
            data={"status": SubscriptionStatus.ACTIVE}
        )
        
        # Update user role
        await db.user.update(
            where={"id": current_user.id},
            data={"role": "SUBSCRIBED"}
        )
        
        return SubscriptionResponse.from_orm(updated_subscription)
        
    except Exception as e:
        raise PaymentError(f"Failed to reactivate subscription: {str(e)}")


@router.get("/subscriptions/invoices")
async def get_subscription_invoices(
    current_user: User = Depends(get_current_user)
):
    """Get subscription invoices"""
    try:
        payment_service = PaymentService()
        invoices = await payment_service.get_customer_invoices(current_user.id)
        
        return {"invoices": invoices}
        
    except Exception as e:
        raise PaymentError(f"Failed to get invoices: {str(e)}")