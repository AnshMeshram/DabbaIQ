"""Tinker by Thinking Machines Integration for DabbaIQ (Optional).

Provides training dataset preparation and fine-tuning utilities for open-weight models
based on confirmed kitchen preparation plans and historical dish waste ratios.
Does NOT run at startup and does NOT block core application workflow.
"""

import json
import logging
from typing import Dict, Any, List
from app.core.config import settings
from app.db.operations import get_sales, get_plans

logger = logging.getLogger(__name__)


class TinkerTrainingProvider:
    """Manages optional model fine-tuning utilities with Tinker."""

    @property
    def is_configured(self) -> bool:
        return settings.tinker_available

    def get_status(self) -> Dict[str, Any]:
        return {
            "configured": self.is_configured,
            "provider": "Tinker by Thinking Machines",
            "feature": "Domain Fine-Tuning for Kitchen Planning Models",
            "message": (
                "Tinker API is configured. Fine-tuning dataset generation available."
                if self.is_configured
                else "TINKER_API_KEY not configured. Training features disabled gracefully."
            ),
        }

    async def generate_training_dataset(self) -> List[Dict[str, Any]]:
        """Export confirmed plans and sales history into instruction-tuning dataset format."""
        sales = await get_sales()
        plans = await get_plans(confirmed_only=True)

        examples = []
        for p in plans:
            examples.append({
                "instruction": f"Generate kitchen prep portion recommendations for {p.get('meal_period')} service.",
                "input": f"Target date: {p.get('target_date')}, Recipes: {[r.get('recipe_name') for r in p.get('recipes', [])]}",
                "output": json.dumps({
                    "portions": {r.get('recipe_name'): r.get('total_portions') for r in p.get('recipes', [])},
                    "estimated_cost": p.get('estimated_total_cost'),
                }),
            })
        return examples


tinker_provider = TinkerTrainingProvider()
