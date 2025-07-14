from typing import Optional, List, Tuple
from prisma import Prisma
from prisma.models import Product as PrismaProduct


class ProductModel:
    """Product model with business logic"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_product(
        self,
        name: str,
        category: str,
        image_url: str,
        description: Optional[str] = None
    ) -> PrismaProduct:
        """Create a new product"""
        return await self.db.product.create(
            data={
                "name": name,
                "description": description,
                "category": category,
                "image_url": image_url,
                "is_active": True
            }
        )
    
    async def get_product_by_id(self, product_id: str) -> Optional[PrismaProduct]:
        """Get product by ID"""
        return await self.db.product.find_unique(where={"id": product_id})
    
    async def get_products(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
        active_only: bool = True,
        skip: int = 0,
        take: int = 20
    ) -> Tuple[List[PrismaProduct], int]:
        """Get products with filters and pagination"""
        where = {}
        
        if active_only:
            where["is_active"] = True
        
        if category:
            where["category"] = category
        
        if search:
            where["OR"] = [
                {"name": {"contains": search, "mode": "insensitive"}},
                {"description": {"contains": search, "mode": "insensitive"}}
            ]
        
        products = await self.db.product.find_many(
            where=where,
            skip=skip,
            take=take,
            order={"created_at": "desc"}
        )
        
        total = await self.db.product.count(where=where)
        
        return products, total
    
    async def update_product(
        self,
        product_id: str,
        update_data: dict
    ) -> Optional[PrismaProduct]:
        """Update product"""
        return await self.db.product.update(
            where={"id": product_id},
            data=update_data
        )
    
    async def delete_product(self, product_id: str) -> bool:
        """Delete or deactivate product"""
        # Check if product is used in mockups
        mockup_count = await self.db.mockup.count(
            where={"product_id": product_id}
        )
        
        if mockup_count > 0:
            # Soft delete by deactivating
            await self.db.product.update(
                where={"id": product_id},
                data={"is_active": False}
            )
            return False  # Indicates soft delete
        else:
            # Hard delete
            await self.db.product.delete(where={"id": product_id})
            return True  # Indicates hard delete
    
    async def get_categories(self) -> List[dict]:
        """Get all product categories with counts"""
        categories = await self.db.product.group_by(
            by=["category"],
            where={"is_active": True},
            count=True,
            order={"_count": "desc"}
        )
        
        return [
            {
                "name": cat["category"],
                "count": cat["_count"]
            }
            for cat in categories
        ]
    
    async def get_popular_products(self, limit: int = 10) -> List[dict]:
        """Get most popular products based on mockup count"""
        # Get products with mockup counts
        products_with_counts = await self.db.product.find_many(
            where={"is_active": True},
            include={
                "_count": {
                    "select": {"mockups": True}
                }
            },
            order={"mockups": {"_count": "desc"}},
            take=limit
        )
        
        return [
            {
                "product": product,
                "mockup_count": product._count.mockups if hasattr(product, '_count') else 0
            }
            for product in products_with_counts
        ]
    
    async def search_products_by_name(self, query: str, limit: int = 10) -> List[PrismaProduct]:
        """Search products by name (for autocomplete)"""
        return await self.db.product.find_many(
            where={
                "name": {"contains": query, "mode": "insensitive"},
                "is_active": True
            },
            take=limit,
            order={"name": "asc"}
        )