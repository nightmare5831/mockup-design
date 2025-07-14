from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from enum import Enum


class TooltipPosition(str, Enum):
    TOP = "TOP"
    BOTTOM = "BOTTOM"
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    TOP_LEFT = "TOP_LEFT"
    TOP_RIGHT = "TOP_RIGHT"
    BOTTOM_LEFT = "BOTTOM_LEFT"
    BOTTOM_RIGHT = "BOTTOM_RIGHT"


class TooltipTrigger(str, Enum):
    HOVER = "HOVER"
    CLICK = "CLICK"
    FOCUS = "FOCUS"
    MANUAL = "MANUAL"


class TooltipBase(BaseModel):
    element_id: str
    title: str
    content: str
    position: TooltipPosition = TooltipPosition.TOP
    trigger: TooltipTrigger = TooltipTrigger.HOVER
    is_active: bool = True
    step_order: Optional[int] = None


class TooltipCreate(TooltipBase):
    pass


class TooltipUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    position: Optional[TooltipPosition] = None
    trigger: Optional[TooltipTrigger] = None
    is_active: Optional[bool] = None
    step_order: Optional[int] = None


class TooltipResponse(TooltipBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TooltipBulkCreate(BaseModel):
    tooltips: list[TooltipCreate]


class TooltipBulkResponse(BaseModel):
    created: list[TooltipResponse]
    errors: list[str]


class OnboardingStep(BaseModel):
    element_id: str
    title: str
    content: str
    position: TooltipPosition
    step_order: int
    is_final_step: bool = False