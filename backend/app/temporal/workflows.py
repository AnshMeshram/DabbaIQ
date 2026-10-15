"""Deterministic Temporal Workflow for DabbaIQ Kitchen Planning.
Orchestrates context retrieval, demand forecasting, price search, AI recommendations, and draft plan creation.
"""

from datetime import timedelta
from typing import Dict, Any
from temporalio import workflow
from temporalio.common import RetryPolicy

# Import activity definitions for type hints & registration
with workflow.unsafe.imports_passed_through():
    from app.temporal.activities import (
        fetch_kitchen_context,
        compute_baseline_demand,
        enrich_ingredient_prices,
        generate_grounded_menu,
        save_draft_plan,
    )


@workflow.defn
class KitchenPlanningWorkflow:
    """End-to-end robust kitchen planning workflow."""

    @workflow.run
    async def run(self, input_params: Dict[str, Any]) -> Dict[str, Any]:
        workflow_id = workflow.info().workflow_id
        target_date = input_params.get("target_date")
        meal_period = input_params.get("meal_period", "lunch")

        standard_retry = RetryPolicy(
            initial_interval=timedelta(seconds=1),
            backoff_coefficient=2.0,
            maximum_interval=timedelta(seconds=10),
            maximum_attempts=3,
        )

        # Step 1: Fetch kitchen context from MongoDB
        context = await workflow.execute_activity(
            fetch_kitchen_context,
            {"target_date": target_date, "meal_period": meal_period},
            start_to_close_timeout=timedelta(seconds=15),
            retry_policy=standard_retry,
        )

        # Step 2: Compute baseline demand deterministically
        demand = await workflow.execute_activity(
            compute_baseline_demand,
            context,
            start_to_close_timeout=timedelta(seconds=10),
            retry_policy=standard_retry,
        )

        # Step 3 & 4: Live supplier price search via SerpAPI & Tiger Data recording
        price_data = await workflow.execute_activity(
            enrich_ingredient_prices,
            context,
            start_to_close_timeout=timedelta(seconds=25),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )

        # Step 5: Grounded menu suggestions from Gemma
        ai_payload = {
            "target_date": target_date,
            "meal_period": meal_period,
            "recipes": context.get("recipes", []),
            "ingredients": context.get("ingredients", []),
            "forecasts": demand.get("forecasts", []),
        }
        ai_menu = await workflow.execute_activity(
            generate_grounded_menu,
            ai_payload,
            start_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )

        # Step 6: Persist validated draft plan into MongoDB
        plan_payload = {
            "target_date": target_date,
            "meal_period": meal_period,
            "recipes": context.get("recipes", []),
            "baseline_portions": demand.get("baseline_portions", {}),
            "workflow_id": workflow_id,
        }
        plan_result = await workflow.execute_activity(
            save_draft_plan,
            plan_payload,
            start_to_close_timeout=timedelta(seconds=15),
            retry_policy=standard_retry,
        )

        return {
            "workflow_id": workflow_id,
            "status": "COMPLETED",
            "target_date": target_date,
            "meal_period": meal_period,
            "plan_id": plan_result.get("plan_id"),
            "forecast_count": len(demand.get("forecasts", [])),
            "price_observations": price_data.get("price_observations", []),
            "ai_provider": ai_menu.get("provider"),
        }
