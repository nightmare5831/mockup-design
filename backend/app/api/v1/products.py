from fastapi import APIRouter, Depends, Query
from typing import Optional
from prisma.models import User
from app.config.database import get_db
from app.api.deps import get_admin_user, optional_current_user
from app.core.exceptions import NotFoundError, ValidationError
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductCategoriesResponse,
    ProductCategory
)

router = APIRouter()


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: Optional[User] = Depends(optional_current_user),
    db = Depends(get_db)
):
    """List all products"""
    skip = (page - 1) * per_page
    
    # Build where clause
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
    
    products = await db.product.find_many(
        where=where,
        skip=skip,
        take=per_page,
        order={"created_at": "desc"}
    )
    
    total = await db.product.count(where=where)
    total_pages = (total + per_page - 1) // per_page
    
    return ProductListResponse(
        products=[ProductResponse.from_orm(p) for p in products],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@router.get("/products/categories", response_model=ProductCategoriesResponse)
async def get_product_categories(
    db = Depends(get_db)
):
    """Get all product categories with counts"""
    # Get unique categories with product counts
    categories = await db.product.group_by(
        by=["category"],
        where={"is_active": True},
        count=True
    )
    
    category_list = []
    total_products = 0
    
    for cat in categories:
        count = cat["_count"]
        total_products += count
        category_list.append(
            ProductCategory(
                name=cat["category"],
                count=count
            )
        )
    
    # Sort by count descending
    category_list.sort(key=lambda x: x.count, reverse=True)
    
    return ProductCategoriesResponse(
        categories=category_list,
        total_products=total_products
    )


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db = Depends(get_db)
):
    """Get specific product"""
    product = await db.product.find_unique(
        where={"id": product_id}
    )
    
    if not product:
        raise NotFoundError("Product not found")
    
    return ProductResponse.from_orm(product)


# Admin endpoints
@router.post("/products", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Create new product (admin only)"""
    product = await db.product.create(data=product_data.dict())
    return ProductResponse.from_orm(product)


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Update product (admin only)"""
    product = await db.product.find_unique(where={"id": product_id})
    if not product:
        raise NotFoundError("Product not found")
    
    update_data = product_update.dict(exclude_unset=True)
    if not update_data:
        return ProductResponse.from_orm(product)
    
    updated_product = await db.product.update(
        where={"id": product_id},
        data=update_data
    )
    
    return ProductResponse.from_orm(updated_product)


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    admin_user: User = Depends(get_admin_user),
    db = Depends(get_db)
):
    """Delete product (admin only)"""
    product = await db.product.find_unique(where={"id": product_id})
    if not product:
        raise NotFoundError("Product not found")
    
    # Check if product is used in any mockups
    mockup_count = await db.mockup.count(
        where={"product_id": product_id}
    )
    
    if mockup_count > 0:
        # Soft delete by deactivating
        await db.product.update(
            where={"id": product_id},
            data={"is_active": False}
        )
        return {"message": "Product deactivated (used in existing mockups)"}
    else:
        # Hard delete if not used
        await db.product.delete(where={"id": product_id})
        return {"message": "Product deleted successfully"}