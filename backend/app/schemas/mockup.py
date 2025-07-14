from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from prisma.enums import MockupStatus, MarkingTechnique

class MockupCreateRequest(BaseModel):
    name: str
    technique: str

class MockupUpdate(BaseModel):
    name: Optional[str] = None
    marking_zone_x: Optional[float] = Field(None)
    marking_zone_y: Optional[float] = Field(None)
    marking_zone_w: Optional[float] = Field(None)
    marking_zone_h: Optional[float] = Field(None)
    marking_technique: Optional[MarkingTechnique] = Field(None)
    logo_scale: Optional[float] = Field(None)
    logo_rotation: Optional[float] = Field(None, ge=-360, le=360)
    logo_color: Optional[str] = None


class MockupResponse(BaseModel):
    id: str
    user_id: str
    product_id: Optional[str]
    name: Optional[str]
    status: MockupStatus
    marking_technique: MarkingTechnique
    product_image_url: Optional[str] = Field(None)
    logo_image_url: Optional[str] = Field(None)
    result_image_url: Optional[str]
    marking_zone_x: float
    marking_zone_y: float
    marking_zone_w: float
    marking_zone_h: float
    logo_scale: float
    logo_rotation: float
    logo_color: Optional[str]
    processing_time: Optional[int]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MockupListResponse(BaseModel):
    mockups: list[MockupResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class MockupGenerationRequest(BaseModel):
    """Request to generate a new mockup"""
    mockup_id: str


class MockupGenerationStatus(BaseModel):
    """Status of mockup generation"""
    mockup_id: str
    status: MockupStatus
    progress: Optional[int] = None  # Percentage 0-100
    estimated_time: Optional[int] = None  # Seconds remaining
    error_message: Optional[str] = None


class MockupTechniqueInfo(BaseModel):
    """Information about marking techniques"""
    name: str
    display_name: str
    description: str
    texture_preview_url: Optional[str] = None
    premium_only: bool = False


class MockupStats(BaseModel):
    """User mockup statistics"""
    total_mockups: int
    completed_mockups: int
    failed_mockups: int
    processing_mockups: int
    total_processing_time: int  # in seconds
    average_processing_time: Optional[float] = None  # in seconds