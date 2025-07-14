from prisma import Prisma
from prisma.errors import PrismaError
from app.config.settings import settings
import logging
logger = logging.getLogger(__name__)

# Global database instance
db = Prisma()


async def init_db():
    """Initialize database connection"""
    try:
        await db.connect()
        logger.info("Database connected successfully")
    except PrismaError as e:
        logger.error(f"Failed to connect to database: {e}")
        raise


async def close_db():
    """Close database connection"""
    try:
        await db.disconnect()
        logger.info("Database disconnected")
    except PrismaError as e:
        logger.error(f"Error disconnecting from database: {e}")


async def get_db():
    """Get database instance for dependency injection"""
    return db


class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.db = None
        self.connected = False
    
    async def connect(self):
        """Connect to database"""
        if not self.connected:
            self.db = Prisma()
            await self.db.connect()
            self.connected = True
            logger.info("Database connection established")
    
    async def disconnect(self):
        """Disconnect from database"""
        if self.connected and self.db:
            await self.db.disconnect()
            self.connected = False
            self.db = None
            logger.info("Database connection closed")
    
    async def health_check(self):
        """Check database health"""
        try:
            if not self.connected:
                await self.connect()
            
            # Simple query to test connection
            await self.db.user.count()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def reset_connection(self):
        """Reset database connection"""
        await self.disconnect()
        await self.connect()


# Global database manager instance
db_manager = DatabaseManager()


async def get_database_info():
    """Get database information and statistics"""
    try:
        db = await get_db()
        
        # Get table counts
        user_count = await db.user.count()
        mockup_count = await db.mockup.count()
        credit_count = await db.credit.count()
        payment_count = await db.payment.count()
        subscription_count = await db.subscription.count()
        product_count = await db.product.count()
        
        return {
            "status": "connected",
            "database_url": settings.DATABASE_URL.split("@")[1] if "@" in settings.DATABASE_URL else "hidden",
            "table_counts": {
                "users": user_count,
                "mockups": mockup_count,
                "credits": credit_count,
                "payments": payment_count,
                "subscriptions": subscription_count,
                "products": product_count
            }
        }
    except Exception as e:
        logger.error(f"Error getting database info: {e}")
        return {
            "status": "error",
            "error": str(e)
        }


async def seed_database():
    """Seed database with initial data"""
    try:
        # Connect to database
        await db.connect()
        
        # Check if we need to seed
        product_count = await db.product.count()
        if product_count > 0:
            logger.info("Database already seeded")
            return
        
        # Seed products
        sample_products = [
            {
                "name": "T-Shirt Cotton",
                "description": "100% cotton t-shirt, perfect for screen printing and embroidery",
                "category": "Apparel",
                "image_url": "https://example.com/tshirt.jpg"
            },
            {
                "name": "Ceramic Mug",
                "description": "White ceramic mug, ideal for sublimation printing",
                "category": "Drinkware",
                "image_url": "https://example.com/mug.jpg"
            },
            {
                "name": "Canvas Tote Bag",
                "description": "Natural canvas tote bag, great for various marking techniques",
                "category": "Bags",
                "image_url": "https://example.com/tote.jpg"
            },
            {
                "name": "Baseball Cap",
                "description": "Adjustable baseball cap, suitable for embroidery",
                "category": "Headwear",
                "image_url": "https://example.com/cap.jpg"
            },
            {
                "name": "Stainless Steel Bottle",
                "description": "Double-wall stainless steel water bottle",
                "category": "Drinkware",
                "image_url": "https://example.com/bottle.jpg"
            }
        ]
        
        for product_data in sample_products:
            await db.product.create(data=product_data)
        
        logger.info(f"Database seeded with {len(sample_products)} products")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        await db.disconnect()


async def cleanup_database():
    """Clean up old data from database"""
    try:
        from datetime import datetime, timedelta
        db = await get_db()
        
        # Clean up old failed mockups (older than 7 days)
        cutoff_date = datetime.utcnow() - timedelta(days=7)
        
        old_failed_mockups = await db.mockup.find_many(
            where={
                "status": "FAILED",
                "created_at": {"lt": cutoff_date}
            }
        )
        
        for mockup in old_failed_mockups:
            await db.mockup.delete(where={"id": mockup.id})
        
        # Clean up expired credits
        expired_credits = await db.credit.find_many(
            where={
                "expires_at": {"lt": datetime.utcnow()},
                "used": {"lt": db.credit.fields.amount}
            }
        )
        
        for credit in expired_credits:
            await db.credit.update(
                where={"id": credit.id},
                data={"used": credit.amount}
            )
        
        logger.info(f"Cleaned up {len(old_failed_mockups)} failed mockups and {len(expired_credits)} expired credits")
        
    except Exception as e:
        logger.error(f"Error cleaning up database: {e}")


class TransactionManager:
    """Database transaction manager"""
    
    def __init__(self, db_instance):
        self.db = db_instance
        self.transaction = None
    
    async def __aenter__(self):
        """Start transaction"""
        self.transaction = self.db.tx()
        await self.transaction.__aenter__()
        return self.transaction
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """End transaction"""
        if self.transaction:
            await self.transaction.__aexit__(exc_type, exc_val, exc_tb)


async def execute_in_transaction(func, *args, **kwargs):
    """Execute function within a database transaction"""
    db = await get_db()
    async with TransactionManager(db) as tx:
        return await func(tx, *args, **kwargs)