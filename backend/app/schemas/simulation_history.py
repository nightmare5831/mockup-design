from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class SimulationHistoryBase(BaseModel):
    step_name: str
    step_data: Optional[Dict[str, Any]] = None
    duration_ms: Optional[int] = None
    success: bool = True
    error_info: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SimulationHistoryCreate(SimulationHistoryBase):
    mockup_id: str
    user_id: str


class SimulationHistoryUpdate(BaseModel):
    duration_ms: Optional[int] = None
    success: Optional[bool] = None
    error_info: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SimulationHistoryResponse(SimulationHistoryBase):
    id: str
    mockup_id: str
    user_id: str
    timestamp: datetime

    class Config:
        from_attributes = True


class SimulationStepAnalytics(BaseModel):
    step_name: str
    total_executions: int
    success_rate: float
    avg_duration_ms: float
    common_errors: list[str]


class UserSimulationStats(BaseModel):
    user_id: str
    total_simulations: int
    completed_simulations: int
    failed_simulations: int
    avg_completion_time: float
    most_used_techniques: list[str]
    recent_activity: list[SimulationHistoryResponse]