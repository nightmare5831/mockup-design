from fastapi import APIRouter, Depends, Query
from typing import List
from prisma.models import User
from app.config.database import get_db
from app.config.settings import settings
from app.api.deps import get_current_user
from app.core.exceptions import ValidationError, PaymentError
from app.schemas.credit import (
    CreditPurchase,
    CreditPackage,
    CreditPackagesResponse,
    CreditResponse,
    CreditBalance,
    CreditTransaction,
    CreditHistoryResponse
)
from app.services.payment_service import PaymentService
from datetime import datetime, timedelta, timezone

router = APIRouter()


@router.get("/credits/packages", response_model=CreditPackagesResponse)
async def get_credit_packages():
    """Get available credit packages"""
    packages = []
    
    for amount, price in settings.CREDIT_PRICES.items():
        # Calculate savings percentage compared to smallest package
        base_price_per_credit = settings.CREDIT_PRICES[10] / 10
        current_price_per_credit = price / amount
        savings = (1 - current_price_per_credit / base_price_per_credit) * 100
        
        packages.append(
            CreditPackage(
                amount=amount,
                price=price,
                popular=(amount == 50),  # Mark 50 credits as popular
                savings_percentage=savings if savings > 0 else None
            )
        )
    
    return CreditPackagesResponse(packages=packages)

@router.post("/credits/purchase", response_model=dict)
async def purchase_credits(
    purchase_data: CreditPurchase,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Purchase credits"""
    # Validate credit amount
    if purchase_data.amount not in settings.CREDIT_PRICES:
        raise ValidationError("Invalid credit package")
    
    price = settings.CREDIT_PRICES[purchase_data.amount]
    
    try:
        # Process payment
        payment_service = PaymentService()
        idempotency_key = f"credit_purchase_{current_user.id}_{purchase_data.amount}_{int(datetime.utcnow().timestamp())}"
        payment_intent = await payment_service.create_payment_intent(
            amount=int(price * 100),  # Convert to cents
            currency="eur",
            customer_id=current_user.id,
            payment_method_id=purchase_data.payment_method_id,
            metadata={
                "type": "credit_purchase",
                "user_id": current_user.id,
                "credit_amount": purchase_data.amount
            },
            idempotency_key=idempotency_key
        )
        
        # Create payment record
        payment = await db.payment.create(
            data={
                "user_id": current_user.id,
                "amount": price,
                "currency": "EUR",
                "status": "PENDING",
                "stripe_payment_intent_id": payment_intent["id"],
                "payment_method": "stripe"
            }
        )
        
        return {
            "payment_intent_id": payment_intent["id"],
            "client_secret": payment_intent["client_secret"],
            "payment_id": payment.id
        }
        
    except Exception as e:
        raise PaymentError(f"Payment processing failed: {str(e)}")


@router.get("/credits/balance", response_model=CreditBalance)
async def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user's current credit balance"""
    credits = await db.credit.find_many(
        where={"user_id": current_user.id}
    )
    
    total_credits = sum(c.amount for c in credits)
    used_credits = sum(c.used for c in credits)
    remaining_credits = total_credits - used_credits
    
    # Calculate expiring credits (next 30 days)
    thirty_days_from_now = datetime.now(timezone.utc) + timedelta(days=30)
    current_time = datetime.now(timezone.utc)
    expiring_credits = [
        c for c in credits 
        if c.expires_at and c.expires_at <= thirty_days_from_now and c.amount > c.used
    ]
    expiring_soon = sum(c.amount - c.used for c in expiring_credits)
    
    # Next expiry date
    future_expiries = [
        c.expires_at for c in credits 
        if c.expires_at and c.expires_at > current_time and c.amount > c.used
    ]
    next_expiry_date = min(future_expiries) if future_expiries else None
    
    return CreditBalance(
        total_credits=total_credits,
        used_credits=used_credits,
        remaining_credits=remaining_credits,
        expiring_soon=expiring_soon,
        next_expiry_date=next_expiry_date
    )


@router.get("/credits", response_model=List[CreditResponse])
async def get_user_credits(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get user's credit history"""
    credits = await db.credit.find_many(
        where={"user_id": current_user.id},
        order={"created_at": "desc"}
    )
    
    credit_responses = []
    for credit in credits:
        credit_responses.append(
            CreditResponse(
                **credit.dict(),
                remaining=credit.amount - credit.used
            )
        )
    
    return credit_responses


@router.get("/credits/history", response_model=CreditHistoryResponse)
async def get_credit_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get detailed credit transaction history"""
    skip = (page - 1) * per_page
    
    # Get credit purchases
    payments = await db.payment.find_many(
        where={
            "user_id": current_user.id,
            "status": "COMPLETED"
        },
        order={"created_at": "desc"}
    )
    
    # Get credit usage (mockups)
    mockups = await db.mockup.find_many(
        where={"user_id": current_user.id},
        include={"credit": True},
        order={"created_at": "desc"}
    )
    
    # Combine into transactions
    transactions = []
    
    # Add purchases
    for payment in payments:
        # Estimate credits from payment amount
        credit_amount = None
        for amount, price in settings.CREDIT_PRICES.items():
            if abs(float(payment.amount) - price) < 0.01:
                credit_amount = amount
                break
        
        if credit_amount:
            transactions.append(
                CreditTransaction(
                    id=payment.id,
                    type="purchase",
                    amount=credit_amount,
                    description=f"Purchased {credit_amount} credits",
                    created_at=payment.created_at
                )
            )
    
    # Add usage
    for mockup in mockups:
        if mockup.credit:
            transactions.append(
                CreditTransaction(
                    id=mockup.id,
                    type="usage",
                    amount=-1,
                    description=f"Mockup generation: {mockup.marking_technique}",
                    mockup_id=mockup.id,
                    created_at=mockup.created_at
                )
            )
    
    # Sort by date and paginate
    transactions.sort(key=lambda x: x.created_at, reverse=True)
    total = len(transactions)
    transactions = transactions[skip:skip + per_page]
    total_pages = (total + per_page - 1) // per_page
    
    return CreditHistoryResponse(
        transactions=transactions,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )