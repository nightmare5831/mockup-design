from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from prisma import Prisma
from prisma.models import Mockup as PrismaMockup
from prisma.enums import MockupStatus, MarkingTechnique
from app.core.exceptions import InsufficientCreditsError, ValidationError


class MockupModel:
    """Mockup model with business logic"""
    
    def __init__(self, db: Prisma):
        self.db = db
    
    async def create_mockup(
        self,
        user_id: str,
        product_image_url: str,
        logo_image_url: str,
        marking_technique: MarkingTechnique,
        marking_zone_x: float,
        marking_zone_y: float,
        marking_zone_w: float,
        marking_zone_h: float,
        product_id: Optional[str] = None,
        name: Optional[str] = None,
        logo_scale: float = 1.0,
        logo_rotation: float = 0.0,
        logo_color: Optional[str] = None
    ) -> PrismaMockup:
        """Create a new mockup and deduct credits"""
        
        # Check if user has available credits
        credit = await self._get_available_credit(user_id)
        if not credit:
            raise InsufficientCreditsError("No available credits")
        
        # Create mockup
        mockup = await self.db.mockup.create(
            data={
                "user_id": user_id,
                "product_id": product_id,
                "credit_id": credit.id,
                "name": name,
                "marking_technique": marking_technique,
                "product_image_url": product_image_url,
                "logo_image_url": logo_image_url,
                "marking_zone_x": marking_zone_x,
                "marking_zone_y": marking_zone_y,
                "marking_zone_w": marking_zone_w,
                "marking_zone_h": marking_zone_h,
                "logo_scale": logo_scale,
                "logo_rotation": logo_rotation,
                "logo_color": logo_color,
                "status": MockupStatus.PENDING
            }
        )
        
        # Deduct credit
        await self.db.credit.update(
            where={"id": credit.id},
            data={"used": credit.used + 1}
        )
        
        return mockup
    
    async def _get_available_credit(self, user_id: str):
        """Get first available credit for user"""
        credits = await self.db.credit.find_many(
            where={
                "user_id": user_id,
                "used": {"lt": self.db.credit.fields.amount}
            },
            order={"expires_at": "asc"}  # Use oldest credits first
        )
        
        for credit in credits:
            if credit.amount > credit.used:
                # Check if credit is expired
                if credit.expires_at and credit.expires_at < datetime.utcnow():
                    continue
                return credit
        
        return None
    
    async def update_mockup_status(
        self,
        mockup_id: str,
        status: MockupStatus,
        result_image_url: Optional[str] = None,
        error_message: Optional[str] = None,
        processing_time: Optional[int] = None
    ) -> Optional[PrismaMockup]:
        """Update mockup status and result"""
        update_data = {"status": status}
        
        if result_image_url:
            update_data["result_image_url"] = result_image_url
        
        if error_message:
            update_data["error_message"] = error_message
        
        if processing_time:
            update_data["processing_time"] = processing_time
        
        return await self.db.mockup.update(
            where={"id": mockup_id},
            data=update_data
        )
    
    async def get_user_mockups(
        self,
        user_id: str,
        status: Optional[MockupStatus] = None,
        skip: int = 0,
        take: int = 20
    ) -> Tuple[List[PrismaMockup], int]:
        """Get user's mockups with pagination"""
        where = {"user_id": user_id}
        
        if status:
            where["status"] = status
        
        mockups = await self.db.mockup.find_many(
            where=where,
            skip=skip,
            take=take,
            order={"created_at": "desc"},
            include={
                "product": True,
                "credit": True
            }
        )
        
        total = await self.db.mockup.count(where=where)
        
        return mockups, total
    
    async def get_mockup_by_id(
        self,
        mockup_id: str,
        user_id: Optional[str] = None
    ) -> Optional[PrismaMockup]:
        """Get mockup by ID, optionally filtered by user"""
        where = {"id": mockup_id}
        
        if user_id:
            where["user_id"] = user_id
        
        return await self.db.mockup.find_unique(
            where=where,
            include={
                "product": True,
                "credit": True,
                "user": True
            }
        )
    
    async def retry_failed_mockup(self, mockup_id: str, user_id: str) -> bool:
        """Retry a failed mockup generation"""
        mockup = await self.get_mockup_by_id(mockup_id, user_id)
        
        if not mockup or mockup.status != MockupStatus.FAILED:
            return False
        
        # Check if user has available credits
        credit = await self._get_available_credit(user_id)
        if not credit:
            raise InsufficientCreditsError("No available credits for retry")
        
        # Deduct new credit
        await self.db.credit.update(
            where={"id": credit.id},
            data={"used": credit.used + 1}
        )
        
        # Update mockup
        await self.db.mockup.update(
            where={"id": mockup_id},
            data={
                "status": MockupStatus.PENDING,
                "credit_id": credit.id,
                "error_message": None,
                "result_image_url": None,
                "processing_time": None
            }
        )
        
        return True
    
    async def refund_mockup(self, mockup_id: str) -> bool:
        """Refund credit for a failed mockup"""
        mockup = await self.get_mockup_by_id(mockup_id)
        
        if not mockup or not mockup.credit_id:
            return False
        
        credit = await self.db.credit.find_unique(where={"id": mockup.credit_id})
        if not credit or credit.used <= 0:
            return False
        
        # Refund credit
        await self.db.credit.update(
            where={"id": credit.id},
            data={"used": credit.used - 1}
        )
        
        return True
    
    async def get_mockup_statistics(self, user_id: Optional[str] = None) -> dict:
        """Get mockup statistics"""
        where = {}
        if user_id:
            where["user_id"] = user_id
        
        total_mockups = await self.db.mockup.count(where=where)
        
        # Status breakdown
        status_counts = {}
        for status in MockupStatus:
            count = await self.db.mockup.count(
                where={**where, "status": status}
            )
            status_counts[status.value] = count
        
        # Technique popularity
        technique_counts = await self.db.mockup.group_by(
            by=["marking_technique"],
            where=where,
            count=True,
            order={"_count": "desc"}
        )
        
        # Average processing time
        completed_mockups = await self.db.mockup.find_many(
            where={
                **where,
                "status": MockupStatus.COMPLETED,
                "processing_time": {"not": None}
            }
        )
        
        avg_processing_time = 0
        if completed_mockups:
            total_time = sum(m.processing_time for m in completed_mockups if m.processing_time)
            avg_processing_time = total_time / len(completed_mockups)
        
        return {
            "total_mockups": total_mockups,
            "status_breakdown": status_counts,
            "popular_techniques": [
                {
                    "technique": item["marking_technique"],
                    "count": item["_count"]
                }
                for item in technique_counts[:10]
            ],
            "average_processing_time": avg_processing_time,
            "success_rate": (
                status_counts.get("COMPLETED", 0) / total_mockups
                if total_mockups > 0 else 0
            )
        }
    
    async def cleanup_old_mockups(self, days_old: int = 90) -> int:
        """Clean up old mockups"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        old_mockups = await self.db.mockup.find_many(
            where={"created_at": {"lt": cutoff_date}}
        )
        
        count = 0
        for mockup in old_mockups:
            try:
                # Delete files from storage if needed
                # This would be handled by the storage service
                
                await self.db.mockup.delete(where={"id": mockup.id})
                count += 1
            except Exception:
                continue
        
        return count
    
    async def get_stuck_mockups(self, minutes: int = 10) -> List[PrismaMockup]:
        """Get mockups stuck in processing status"""
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
        
        return await self.db.mockup.find_many(
            where={
                "status": MockupStatus.PROCESSING,
                "updated_at": {"lt": cutoff_time}
            }
        )
    
    async def reset_stuck_mockups(self) -> int:
        """Reset stuck mockups and refund credits"""
        stuck_mockups = await self.get_stuck_mockups()
        
        count = 0
        for mockup in stuck_mockups:
            try:
                # Reset status
                await self.update_mockup_status(
                    mockup.id,
                    MockupStatus.FAILED,
                    error_message="Processing timeout"
                )
                
                # Refund credit
                await self.refund_mockup(mockup.id)
                count += 1
            except Exception:
                continue
        
        return count