from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma

from app.api.deps import get_current_user
from app.config.database import get_db
from app.schemas.simulation_history import (
    SimulationHistoryCreate,
    SimulationHistoryResponse,
    SimulationStepAnalytics,
    UserSimulationStats
)
from prisma.models import User

router = APIRouter()


@router.post("/", response_model=SimulationHistoryResponse)
async def create_simulation_history_entry(
    entry: SimulationHistoryCreate,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new simulation history entry."""
    try:
        # Verify the mockup belongs to the user
        mockup = await db.mockup.find_unique(
            where={"id": entry.mockup_id}
        )
        if not mockup:
            raise HTTPException(status_code=404, detail="Mockup not found")
        
        if mockup.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        history_entry = await db.simulationhistory.create(
            data={
                "mockup_id": entry.mockup_id,
                "user_id": entry.user_id,
                "step_name": entry.step_name,
                "step_data": entry.step_data,
                "duration_ms": entry.duration_ms,
                "success": entry.success,
                "error_info": entry.error_info,
                "metadata": entry.metadata
            }
        )
        return history_entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mockup/{mockup_id}", response_model=List[SimulationHistoryResponse])
async def get_mockup_simulation_history(
    mockup_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, description="Maximum number of entries to return"),
    offset: int = Query(0, description="Number of entries to skip")
):
    """Get simulation history for a specific mockup."""
    try:
        # Verify the mockup belongs to the user
        mockup = await db.mockup.find_unique(
            where={"id": mockup_id}
        )
        if not mockup:
            raise HTTPException(status_code=404, detail="Mockup not found")
        
        if mockup.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        history = await db.simulationhistory.find_many(
            where={"mockup_id": mockup_id},
            order={"timestamp": "desc"},
            take=limit,
            skip=offset
        )
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}", response_model=List[SimulationHistoryResponse])
async def get_user_simulation_history(
    user_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(100, description="Maximum number of entries to return"),
    offset: int = Query(0, description="Number of entries to skip"),
    days: Optional[int] = Query(None, description="Number of days to look back")
):
    """Get simulation history for a user."""
    try:
        # Users can only access their own history unless they're admin
        if user_id != current_user.id and current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Access denied")
        
        where_clause = {"user_id": user_id}
        
        if days:
            since_date = datetime.utcnow() - timedelta(days=days)
            where_clause["timestamp"] = {"gte": since_date}
        
        history = await db.simulationhistory.find_many(
            where=where_clause,
            order={"timestamp": "desc"},
            take=limit,
            skip=offset
        )
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/steps", response_model=List[SimulationStepAnalytics])
async def get_step_analytics(
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30, description="Number of days to analyze")
):
    """Get analytics for simulation steps (admin only)."""
    try:
        if current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        since_date = datetime.utcnow() - timedelta(days=days)
        
        # This would need to be implemented with raw SQL or aggregation
        # For now, return a placeholder response
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/user/{user_id}", response_model=UserSimulationStats)
async def get_user_simulation_stats(
    user_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user),
    days: int = Query(30, description="Number of days to analyze")
):
    """Get simulation statistics for a user."""
    try:
        # Users can only access their own stats unless they're admin
        if user_id != current_user.id and current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Access denied")
        
        since_date = datetime.utcnow() - timedelta(days=days)
        
        # Get total simulations
        total_simulations = await db.simulationhistory.count(
            where={
                "user_id": user_id,
                "timestamp": {"gte": since_date}
            }
        )
        
        # Get success/failure counts
        completed_simulations = await db.simulationhistory.count(
            where={
                "user_id": user_id,
                "success": True,
                "timestamp": {"gte": since_date}
            }
        )
        
        failed_simulations = total_simulations - completed_simulations
        
        # Get recent activity
        recent_activity = await db.simulationhistory.find_many(
            where={
                "user_id": user_id,
                "timestamp": {"gte": since_date}
            },
            order={"timestamp": "desc"},
            take=10
        )
        
        return UserSimulationStats(
            user_id=user_id,
            total_simulations=total_simulations,
            completed_simulations=completed_simulations,
            failed_simulations=failed_simulations,
            avg_completion_time=0.0,  # Would need aggregation
            most_used_techniques=[],  # Would need aggregation
            recent_activity=recent_activity
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{entry_id}")
async def delete_simulation_history_entry(
    entry_id: str,
    db: Prisma = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a simulation history entry."""
    try:
        # Verify the entry belongs to the user
        entry = await db.simulationhistory.find_unique(
            where={"id": entry_id}
        )
        if not entry:
            raise HTTPException(status_code=404, detail="History entry not found")
        
        if entry.user_id != current_user.id and current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Access denied")
        
        await db.simulationhistory.delete(
            where={"id": entry_id}
        )
        return {"message": "History entry deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))