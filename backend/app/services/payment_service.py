import stripe
from typing import Dict, Any, List, Optional
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:
    """Service for handling payment operations with Stripe"""
    
    def __init__(self):
        self.stripe = stripe
    
    async def create_customer(self, user_id: str, email: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Create or get Stripe customer"""
        try:
            # Try to find existing customer
            customers = self.stripe.Customer.list(email=email, limit=1)
            
            if customers.data:
                return customers.data[0]
            
            # Create new customer
            customer = self.stripe.Customer.create(
                email=email,
                name=name,
                metadata={"user_id": user_id}
            )
            
            return customer
            
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            raise
    
    async def create_payment_intent(
        self,
        amount: int,
        currency: str,
        customer_id: str,
        payment_method_id: str,
        metadata: Optional[Dict[str, str]] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create payment intent for one-time payment"""
        try:
            # Get or create customer
            customer = await self.create_customer(customer_id, f"user_{customer_id}@temp.com")
            
            create_params = {
                "amount": amount,
                "currency": currency,
                "customer": customer["id"],
                "payment_method": payment_method_id,
                "metadata": metadata or {},
                "automatic_payment_methods": {
                    "enabled": True,
                    "allow_redirects": "never"
                }
            }
            
            if idempotency_key:
                payment_intent = self.stripe.PaymentIntent.create(
                    **create_params,
                    idempotency_key=idempotency_key
                )
            else:
                payment_intent = self.stripe.PaymentIntent.create(**create_params)
            
            return payment_intent
            
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            raise
    
    async def create_setup_intent(self, customer_id: str) -> Dict[str, Any]:
        """Create setup intent for saving payment methods"""
        try:
            customer = await self.create_customer(customer_id, f"user_{customer_id}@temp.com")
            
            setup_intent = self.stripe.SetupIntent.create(
                customer=customer["id"],
                payment_method_types=["card"],
                usage="off_session"
            )
            
            return setup_intent
            
        except Exception as e:
            logger.error(f"Error creating setup intent: {e}")
            raise
    
    async def get_payment_methods(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get customer's saved payment methods"""
        try:
            customer = await self.create_customer(customer_id, f"user_{customer_id}@temp.com")
            
            payment_methods = self.stripe.PaymentMethod.list(
                customer=customer["id"],
                type="card"
            )
            
            return payment_methods.data
            
        except Exception as e:
            logger.error(f"Error getting payment methods: {e}")
            raise
    
    async def delete_payment_method(self, payment_method_id: str) -> Dict[str, Any]:
        """Delete a payment method"""
        try:
            payment_method = self.stripe.PaymentMethod.detach(payment_method_id)
            return payment_method
            
        except Exception as e:
            logger.error(f"Error deleting payment method: {e}")
            raise
    
    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        payment_method_id: str
    ) -> Dict[str, Any]:
        """Create subscription"""
        try:
            customer = await self.create_customer(customer_id, f"user_{customer_id}@temp.com")
            
            # Attach payment method to customer
            self.stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer["id"]
            )
            
            # Set as default payment method
            self.stripe.Customer.modify(
                customer["id"],
                invoice_settings={"default_payment_method": payment_method_id}
            )
            # Create subscription
            subscription = self.stripe.Subscription.create(
                customer=customer["id"],
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                payment_settings={"save_default_payment_method": "on_subscription"},
                expand=["latest_invoice.payment_intent"]
            )
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            raise
    
    async def update_subscription(
        self,
        subscription_id: str,
        new_price_id: str
    ) -> Dict[str, Any]:
        """Update subscription plan"""
        try:
            subscription = self.stripe.Subscription.retrieve(subscription_id)
            
            self.stripe.Subscription.modify(
                subscription_id,
                items=[{
                    "id": subscription["items"]["data"][0]["id"],
                    "price": new_price_id
                }],
                proration_behavior="create_prorations"
            )
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            raise
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> Dict[str, Any]:
        """Cancel subscription"""
        try:
            if at_period_end:
                subscription = self.stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = self.stripe.Subscription.cancel(subscription_id)
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            raise
    
    async def reactivate_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Reactivate a cancelled subscription"""
        try:
            subscription = self.stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error reactivating subscription: {e}")
            raise
    
    async def get_customer_invoices(self, customer_id: str) -> List[Dict[str, Any]]:
        """Get customer's invoices"""
        try:
            customer = await self.create_customer(customer_id, f"user_{customer_id}@temp.com")
            
            invoices = self.stripe.Invoice.list(
                customer=customer["id"],
                limit=20
            )
            
            return invoices.data
            
        except Exception as e:
            logger.error(f"Error getting invoices: {e}")
            raise
    
    async def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[int] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create refund for a payment"""
        try:
            refund_data = {"payment_intent": payment_intent_id}
            
            if amount:
                refund_data["amount"] = amount
            
            if reason:
                refund_data["reason"] = reason
            
            refund = self.stripe.Refund.create(**refund_data)
            
            return refund
            
        except Exception as e:
            logger.error(f"Error creating refund: {e}")
            raise