from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreditPurchase(BaseModel):
    amount: int = Field(..., gt=0, description="Number of credits to purchase")
    payment_method_id: str


class CreditPackage(BaseModel):
    """Available credit packages"""
    amount: int
    price: float
    bonus_credits: int = 0
    popular: bool = False
    savings_percentage: Optional[float] = None


class CreditPackagesResponse(BaseModel):
    packages: list[CreditPackage]


class CreditResponse(BaseModel):
    id: str
    user_id: str
    amount: int
    used: int
    remaining: int
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CreditBalance(BaseModel):
    """User's credit balance summary"""
    total_credits: int
    used_credits: int
    remaining_credits: int
    expiring_soon: int  # Credits expiring in next 30 days
    next_expiry_date: Optional[datetime]


class CreditTransaction(BaseModel):
    """Credit transaction history"""
    id: str
    type: str  # "purchase", "usage", "bonus", "refund"
    amount: int
    description: str
    mockup_id: Optional[str]
    created_at: datetime


class CreditHistoryResponse(BaseModel):
    transactions: list[CreditTransaction]
    total: int
    page: int
    per_page: int
    total_pages: int