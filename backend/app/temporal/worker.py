"""Temporal Worker process for DabbaIQ.
Listens on TEMPORAL_TASK_QUEUE to execute KitchenPlanningWorkflow and activities.

Run via PowerShell:
    python -m app.temporal.worker
"""

import sys
import asyncio
import logging
from pathlib import Path

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from temporalio.client import Client
from temporalio.worker import Worker

from app.core.config import settings
from app.temporal.workflows import KitchenPlanningWorkflow
from app.temporal.activities import (
    fetch_kitchen_context,
    compute_baseline_demand,
    enrich_ingredient_prices,
    generate_grounded_menu,
    save_draft_plan,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("dabbaiq.worker")


async def run_worker():
    print("=" * 60)
    print("DabbaIQ Temporal Worker")
    print(f"Address:    {settings.TEMPORAL_ADDRESS}")
    print(f"Namespace:  {settings.TEMPORAL_NAMESPACE}")
    print(f"Task Queue: {settings.TEMPORAL_TASK_QUEUE}")
    print("=" * 60)

    try:
        client = await Client.connect(
            settings.TEMPORAL_ADDRESS,
            namespace=settings.TEMPORAL_NAMESPACE,
        )
        print("[+] Successfully connected to Temporal server.")
    except Exception as exc:
        print(f"\n[!] Cannot connect to Temporal server at '{settings.TEMPORAL_ADDRESS}':")
        print(f"    {exc}")
        print("\nTo start a local Temporal development server, run:")
        print("    temporal server start-dev")
        print("or run with Docker:")
        print("    docker run --rm -d -p 7233:7233 -p 8233:8233 temporalio/dev-server:latest")
        return

    worker = Worker(
        client,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        workflows=[KitchenPlanningWorkflow],
        activities=[
            fetch_kitchen_context,
            compute_baseline_demand,
            enrich_ingredient_prices,
            generate_grounded_menu,
            save_draft_plan,
        ],
    )

    print(f"[*] Worker is listening on queue '{settings.TEMPORAL_TASK_QUEUE}'... Press Ctrl+C to stop.")
    await worker.run()


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        print("\n[*] Temporal worker shut down.")
