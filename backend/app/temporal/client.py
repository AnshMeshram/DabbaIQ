"""Client helper for launching and querying Temporal workflows in DabbaIQ.
Falls back safely to direct execution when Temporal server is offline.
"""

import uuid
import logging
from typing import Dict, Any, Optional
from temporalio.client import Client, WorkflowFailureError

from app.core.config import settings
from app.temporal.workflows import KitchenPlanningWorkflow

logger = logging.getLogger(__name__)


async def get_temporal_client() -> Optional[Client]:
    """Connect to Temporal client, returning None if server is unavailable."""
    if not settings.temporal_available:
        return None
    try:
        return await Client.connect(
            settings.TEMPORAL_ADDRESS,
            namespace=settings.TEMPORAL_NAMESPACE,
        )
    except Exception as exc:
        logger.debug("Temporal server unreachable at %s: %s", settings.TEMPORAL_ADDRESS, exc)
        return None


async def trigger_planning_workflow(target_date: str, meal_period: str = "lunch") -> Dict[str, Any]:
    """Initiates KitchenPlanningWorkflow if Temporal is online; otherwise indicates fallback."""
    client = await get_temporal_client()
    workflow_id = f"kitchen-plan-{target_date}-{uuid.uuid4().hex[:6]}"

    if client is None:
        return {
            "orchestrator": "direct_fallback",
            "temporal_active": False,
            "workflow_id": workflow_id,
            "message": (
                "Temporal server is not running on localhost:7233. "
                "Run 'temporal server start-dev' to enable distributed workflows. "
                "Direct local planning API remains active."
            ),
        }

    try:
        handle = await client.start_workflow(
            KitchenPlanningWorkflow.run,
            {"target_date": target_date, "meal_period": meal_period},
            id=workflow_id,
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )
        return {
            "orchestrator": "temporal",
            "temporal_active": True,
            "workflow_id": handle.id,
            "run_id": handle.run_id,
            "status": "RUNNING",
            "message": f"Temporal workflow '{workflow_id}' dispatched to queue '{settings.TEMPORAL_TASK_QUEUE}'",
        }
    except Exception as exc:
        logger.error("Failed to start Temporal workflow: %s", exc)
        return {
            "orchestrator": "error",
            "temporal_active": False,
            "error": str(exc),
            "workflow_id": workflow_id,
        }


async def get_workflow_result(workflow_id: str) -> Dict[str, Any]:
    """Check status and output of a running or finished workflow."""
    client = await get_temporal_client()
    if not client:
        return {
            "temporal_active": False,
            "workflow_id": workflow_id,
            "status": "UNAVAILABLE",
            "message": "Temporal server offline",
        }

    try:
        handle = client.get_workflow_handle(workflow_id)
        desc = await handle.describe()
        status_name = desc.status.name if hasattr(desc.status, "name") else str(desc.status)

        result = None
        if status_name == "COMPLETED":
            result = await handle.result()

        return {
            "temporal_active": True,
            "workflow_id": workflow_id,
            "status": status_name,
            "result": result,
        }
    except Exception as exc:
        return {
            "temporal_active": True,
            "workflow_id": workflow_id,
            "status": "ERROR",
            "error": str(exc),
        }
