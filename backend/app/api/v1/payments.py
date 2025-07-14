from fastapi import APIRouter, Depends, Request, HTTPException, Header
from typing import Optional
from prisma.models import User
from app.config.database import get_db
from app.config.settings import settings
from app.api.deps import get_current_user
from app.core.exceptions import PaymentError, NotFoundError
from app.services.payment_service import PaymentService
import stripe
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/payments/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db = Depends(get_db)
):
    """Handle Stripe webhooks"""
    payload = await request.body()
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    event_type = event["type"]
    logger.info(f"Processing webhook event: {event_type}")
    
    # Process webhook immediately (no background tasks)
    if event_type == "payment_intent.succeeded":
        await handle_payment_success(event["data"]["object"], db)
    elif event_type == "payment_intent.payment_failed":
        await handle_payment_failure(event["data"]["object"], db)
    elif event_type == "invoice.payment_succeeded":
        await handle_subscription_payment_success(event["data"]["object"], db)
    elif event_type == "customer.subscription.deleted":
        await handle_subscription_cancelled(event["data"]["object"], db)
    else:
        logger.info(f"Unhandled event type: {event_type}")
    
    return {"status": "success"}


async def handle_payment_success(payment_intent, db):
    """Handle successful payment"""
    try:
        # Find payment record
        payment = await db.payment.find_unique(
            where={"stripe_payment_intent_id": payment_intent["id"]}
        )
        
        if not payment:
            logger.error(f"Payment not found for intent: {payment_intent['id']}")
            return
        
        # Update payment status
        await db.payment.update(
            where={"id": payment.id},
            data={"status": "COMPLETED"}
        )
        
        # Check if this is a credit purchase
        metadata = payment_intent.get("metadata", {})
        if metadata.get("type") == "credit_purchase":
            credit_amount = int(metadata.get("credit_amount", 0))
            user_id = metadata.get("user_id")
            
            if credit_amount and user_id:
                # Add credits to user account
                from datetime import datetime, timedelta
                expires_at = datetime.utcnow() + timedelta(days=365)  # Credits expire in 1 year
                
                await db.credit.create(
                    data={
                        "user_id": user_id,
                        "amount": credit_amount,
                        "used": 0,
                        "expires_at": expires_at
                    }
                )
                
                logger.info(f"Added {credit_amount} credits to user {user_id}")
        
    except Exception as e:
        logger.error(f"Error handling payment success: {e}")


async def handle_payment_failure(payment_intent, db):
    """Handle failed payment"""
    try:
        # Find payment record
        payment = await db.payment.find_unique(
            where={"stripe_payment_intent_id": payment_intent["id"]}
        )
        
        if payment:
            await db.payment.update(
                where={"id": payment.id},
                data={"status": "FAILED"}
            )
            
            logger.info(f"Payment failed for intent: {payment_intent['id']}")
        
    except Exception as e:
        logger.error(f"Error handling payment failure: {e}")


async def handle_subscription_payment_success(invoice, db):
    """Handle successful subscription payment"""
    try:
        subscription_id = invoice["subscription"]
        
        # Find subscription
        subscription = await db.subscription.find_unique(
            where={"stripe_id": subscription_id}
        )
        
        if subscription:
            from prisma.enums import SubscriptionStatus
            from datetime import datetime, timedelta
            
            # Update subscription to ACTIVE status
            await db.subscription.update(
                where={"id": subscription.id},
                data={"status": SubscriptionStatus.ACTIVE}
            )
            
            # Update user role to SUBSCRIBED
            await db.user.update(
                where={"id": subscription.user_id},
                data={"role": "SUBSCRIBED"}
            )
            
            # Add monthly credits based on plan (only if this is the first payment)
            plan_credits = settings.SUBSCRIPTION_PLANS[subscription.plan]["credits_per_month"]
            expires_at = datetime.utcnow() + timedelta(days=30)
            
            # Check if we already added initial credits for this subscription
            existing_credits = await db.credit.find_first(
                where={
                    "user_id": subscription.user_id,
                    "created_at": {"gte": subscription.created_at}
                }
            )
            
            if not existing_credits:
                await db.credit.create(
                    data={
                        "user_id": subscription.user_id,
                        "amount": plan_credits,
                        "used": 0,
                        "expires_at": expires_at
                    }
                )
                
                logger.info(f"Added {plan_credits} initial subscription credits to user {subscription.user_id}")
            
            logger.info(f"Activated subscription {subscription.id} for user {subscription.user_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription payment: {e}")


async def handle_subscription_cancelled(subscription_data, db):
    """Handle subscription cancellation"""
    try:
        subscription_id = subscription_data["id"]
        
        # Update subscription status
        await db.subscription.update_many(
            where={"stripe_id": subscription_id},
            data={"status": "CANCELLED"}
        )
        
        logger.info(f"Subscription cancelled: {subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {e}")


@router.post("/payments/setup-intent")
async def create_setup_intent(
    current_user: User = Depends(get_current_user)
):
    """Create setup intent for saving payment methods"""
    try:
        payment_service = PaymentService()
        setup_intent = await payment_service.create_setup_intent(current_user.id)
        
        return {
            "client_secret": setup_intent["client_secret"]
        }
        
    except Exception as e:
        raise PaymentError(f"Failed to create setup intent: {str(e)}")


@router.get("/payments/methods")
async def get_payment_methods(
    current_user: User = Depends(get_current_user)
):
    """Get user's saved payment methods"""
    try:
        payment_service = PaymentService()
        methods = await payment_service.get_payment_methods(current_user.id)
        
        return {"payment_methods": methods}
        
    except Exception as e:
        raise PaymentError(f"Failed to get payment methods: {str(e)}")


@router.delete("/payments/methods/{payment_method_id}")
async def delete_payment_method(
    payment_method_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a saved payment method"""
    try:
        payment_service = PaymentService()
        await payment_service.delete_payment_method(payment_method_id)
        
        return {"message": "Payment method deleted successfully"}
        
    except Exception as e:
        raise PaymentError(f"Failed to delete payment method: {str(e)}")


@router.get("/payments/history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user's payment history"""
    payments = await db.payment.find_many(
        where={"user_id": current_user.id},
        order={"created_at": "desc"}
    )
    
    return {"payments": payments}