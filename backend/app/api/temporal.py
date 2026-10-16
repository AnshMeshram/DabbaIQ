"""Temporal workflow endpoints for distributed kitchen planning orchestration."""

import logging
from fastapi import APIRouter
from app.schemas.schemas import WorkflowTriggerRequest
from app.temporal.client import (
    trigger_planning_workflow,
    get_workflow_result,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Temporal Workflow Orchestration"])


@router.post("/workflows/plan")
async def trigger_workflow_plan(req: WorkflowTriggerRequest):
    """Start an end-to-end distributed kitchen planning workflow via Temporal.
    Falls back gracefully to direct planning API if Temporal server is offline.
    """
    return await trigger_planning_workflow(target_date=req.target_date, meal_period=req.meal_period)


@router.get("/workflows/{workflow_id}")
async def get_workflow_status_endpoint(workflow_id: str):
    """Inspect the status and result of a Temporal planning workflow."""
    return await get_workflow_result(workflow_id)
