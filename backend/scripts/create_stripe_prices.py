#!/usr/bin/env python3
"""
Script to create Stripe products and prices for subscription plans.
Run this once to set up your Stripe account with the necessary prices.
"""

import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def create_subscription_products():
    """Create products and prices for subscription plans"""
    
    plans = {
        "basic": {
            "name": "Basic Plan",
            "description": "10 credits per month with standard features",
            "price": 999,  # $9.99 in cents
            "metadata": {"plan": "basic", "credits": "10"}
        },
        "pro": {
            "name": "Pro Plan",
            "description": "30 credits per month with advanced features",
            "price": 2499,  # $24.99 in cents
            "metadata": {"plan": "pro", "credits": "30"}
        },
        "premium": {
            "name": "Premium Plan",
            "description": "100 credits per month with all features",
            "price": 7999,  # $79.99 in cents
            "metadata": {"plan": "premium", "credits": "100"}
        }
    }
    
    created_prices = {}
    
    for plan_id, plan_info in plans.items():
        try:
            # Create or retrieve product
            products = stripe.Product.list(limit=100)
            product = None
            
            # Check if product already exists
            for p in products.data:
                if p.metadata.get("plan") == plan_id:
                    product = p
                    print(f"Found existing product for {plan_id}: {product.id}")
                    break
            
            # Create product if it doesn't exist
            if not product:
                product = stripe.Product.create(
                    name=plan_info["name"],
                    description=plan_info["description"],
                    metadata=plan_info["metadata"]
                )
                print(f"Created product for {plan_id}: {product.id}")
            
            # Check if price already exists
            prices = stripe.Price.list(product=product.id, limit=100)
            price = None
            
            for p in prices.data:
                if p.unit_amount == plan_info["price"] and p.recurring and p.currency == "eur":
                    price = p
                    print(f"Found existing price for {plan_id}: {price.id}")
                    break
            
            # Create price if it doesn't exist
            if not price:
                # Try to create with specific ID first
                try:
                    price = stripe.Price.create(
                        id=f"price_{plan_id}",
                        product=product.id,
                        unit_amount=plan_info["price"],
                        currency="eur",
                        recurring={"interval": "month"}
                    )
                    print(f"Created price for {plan_id} with ID: {price.id}")
                except stripe.error.InvalidRequestError:
                    # If ID already exists or can't use custom ID, create without ID
                    price = stripe.Price.create(
                        product=product.id,
                        unit_amount=plan_info["price"],
                        currency="eur",
                        recurring={"interval": "month"}
                    )
                    print(f"Created price for {plan_id}: {price.id}")
            
            created_prices[plan_id] = price.id
            
        except Exception as e:
            print(f"Error creating {plan_id}: {str(e)}")
    
    return created_prices

if __name__ == "__main__":
    print("Creating Stripe subscription products and prices...")
    print("=" * 50)
    
    prices = create_subscription_products()
    
    print("\n" + "=" * 50)
    print("Setup complete! Add these to your .env file:")
    print("=" * 50)
    
    for plan_id, price_id in prices.items():
        env_var = f"STRIPE_PRICE_ID_{plan_id.upper()}"
        print(f"{env_var}={price_id}")
    
    print("\nYou can now use these price IDs for subscriptions.")