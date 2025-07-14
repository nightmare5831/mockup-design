from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from prisma.models import User
from prisma.enums import MockupStatus, PaymentStatus, SubscriptionStatus
from app.config.database import get_db
from app.api.deps import get_admin_user

router = APIRouter()


@router.get("/dashboard")
async def admin_dashboard(
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Get admin dashboard statistics"""
    # User statistics
    total_users = await db.user.count()
    active_users = await db.user.count(where={"is_active": True})
    
    # Users registered in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users_30d = await db.user.count(
        where={"created_at": {"gte": thirty_days_ago}}
    )
    
    # Subscription statistics
    active_subscriptions = await db.subscription.count(
        where={"status": SubscriptionStatus.ACTIVE}
    )
    
    # Revenue statistics
    completed_payments = await db.payment.find_many(
        where={"status": PaymentStatus.COMPLETED}
    )
    total_revenue = sum(float(p.amount) for p in completed_payments)
    
    # Revenue in last 30 days
    recent_payments = [
        p for p in completed_payments 
        if p.created_at >= thirty_days_ago
    ]
    revenue_30d = sum(float(p.amount) for p in recent_payments)
    
    # Mockup statistics
    total_mockups = await db.mockup.count()
    completed_mockups = await db.mockup.count(
        where={"status": MockupStatus.COMPLETED}
    )
    processing_mockups = await db.mockup.count(
        where={"status": MockupStatus.PROCESSING}
    )
    failed_mockups = await db.mockup.count(
        where={"status": MockupStatus.FAILED}
    )
    
    # Credit statistics
    total_credits_issued = await db.credit.aggregate(
        sum={"amount": True}
    )
    total_credits_used = await db.credit.aggregate(
        sum={"used": True}
    )
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "new_30d": new_users_30d
        },
        "subscriptions": {
            "active": active_subscriptions
        },
        "revenue": {
            "total": total_revenue,
            "last_30d": revenue_30d,
            "currency": "EUR"
        },
        "mockups": {
            "total": total_mockups,
            "completed": completed_mockups,
            "processing": processing_mockups,
            "failed": failed_mockups,
            "success_rate": completed_mockups / total_mockups if total_mockups > 0 else 0
        },
        "credits": {
            "issued": total_credits_issued.get("sum", {}).get("amount", 0),
            "used": total_credits_used.get("sum", {}).get("used", 0)
        }
    }


@router.get("/users/analytics")
async def user_analytics(
    days: int = Query(30, ge=1, le=365),
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Get user analytics"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily user registrations
    users_by_day = await db.user.group_by(
        by=["created_at"],
        where={"created_at": {"gte": start_date}},
        count=True
    )
    
    # User roles distribution
    users_by_role = await db.user.group_by(
        by=["role"],
        count=True
    )
    
    # Most active users (by mockup count)
    active_users = await db.user.find_many(
        include={
            "mockups": {"select": {"id": True}},
            "_count": {"select": {"mockups": True}}
        },
        order={"mockups": {"_count": "desc"}},
        take=10
    )
    
    return {
        "registrations_by_day": users_by_day,
        "users_by_role": users_by_role,
        "most_active_users": [
            {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name
                },
                "mockup_count": len(user.mockups)
            }
            for user in active_users
        ]
    }


@router.get("/mockups/analytics")
async def mockup_analytics(
    days: int = Query(30, ge=1, le=365),
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Get mockup analytics"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Mockups by status over time
    mockups_by_status = await db.mockup.group_by(
        by=["status", "created_at"],
        where={"created_at": {"gte": start_date}},
        count=True
    )
    
    # Most popular marking techniques
    techniques = await db.mockup.group_by(
        by=["marking_technique"],
        count=True,
        order={"_count": "desc"}
    )
    
    # Average processing time
    completed_mockups = await db.mockup.find_many(
        where={
            "status": MockupStatus.COMPLETED,
            "processing_time": {"not": None},
            "created_at": {"gte": start_date}
        }
    )
    
    avg_processing_time = (
        sum(m.processing_time for m in completed_mockups) / len(completed_mockups)
        if completed_mockups else 0
    )
    
    # Error analysis
    failed_mockups = await db.mockup.find_many(
        where={
            "status": MockupStatus.FAILED,
            "created_at": {"gte": start_date}
        },
        select={"error_message": True}
    )
    
    error_types = {}
    for mockup in failed_mockups:
        error = mockup.error_message or "Unknown error"
        error_types[error] = error_types.get(error, 0) + 1
    
    return {
        "mockups_by_status": mockups_by_status,
        "popular_techniques": techniques,
        "average_processing_time": avg_processing_time,
        "error_types": error_types,
        "total_failed": len(failed_mockups)
    }


@router.get("/revenue/analytics")
async def revenue_analytics(
    days: int = Query(30, ge=1, le=365),
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Get revenue analytics"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Revenue by day
    payments = await db.payment.find_many(
        where={
            "status": PaymentStatus.COMPLETED,
            "created_at": {"gte": start_date}
        }
    )
    
    revenue_by_day = {}
    for payment in payments:
        day = payment.created_at.date().isoformat()
        revenue_by_day[day] = revenue_by_day.get(day, 0) + float(payment.amount)
    
    # Revenue by subscription plan
    subscriptions = await db.subscription.find_many(
        where={"status": SubscriptionStatus.ACTIVE}
    )
    
    revenue_by_plan = {}
    for sub in subscriptions:
        plan = sub.plan.value
        revenue_by_plan[plan] = revenue_by_plan.get(plan, 0) + 1
    
    # Average revenue per user
    total_revenue = sum(float(p.amount) for p in payments)
    unique_paying_users = len(set(p.user_id for p in payments))
    arpu = total_revenue / unique_paying_users if unique_paying_users > 0 else 0
    
    return {
        "revenue_by_day": revenue_by_day,
        "revenue_by_plan": revenue_by_plan,
        "total_revenue": total_revenue,
        "paying_users": unique_paying_users,
        "arpu": arpu,
        "currency": "EUR"
    }


@router.get("/system/health")
async def system_health(
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Get system health status"""
    # Check database connectivity
    try:
        await db.user.count()
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Check recent processing errors
    recent_errors = await db.mockup.count(
        where={
            "status": MockupStatus.FAILED,
            "created_at": {"gte": datetime.utcnow() - timedelta(hours=1)}
        }
    )
    
    # Check queue status (mockups waiting to be processed)
    pending_mockups = await db.mockup.count(
        where={"status": MockupStatus.PENDING}
    )
    
    processing_mockups = await db.mockup.count(
        where={"status": MockupStatus.PROCESSING}
    )
    
    return {
        "database": db_status,
        "recent_errors": recent_errors,
        "queue": {
            "pending": pending_mockups,
            "processing": processing_mockups
        },
        "timestamp": datetime.utcnow().isoformat()
    }