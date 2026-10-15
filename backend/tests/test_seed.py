"""Test duplicate-safe demo data seeding."""

import sys
from pathlib import Path

# Add project root to sys.path so scripts can be imported
project_root = Path(__file__).resolve().parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import pytest
from unittest.mock import patch, AsyncMock
from scripts.seed_demo import seed, DEMO_INGREDIENTS


@pytest.mark.asyncio
async def test_seed_skips_when_demo_data_exists():
    """Verify that seed() exits early without duplicating records if demo data already exists."""
    mock_db = AsyncMock()
    mock_db.ingredients.find_one.return_value = {"_id": "existing_demo", "is_demo": True}

    with patch("scripts.seed_demo.settings.MONGODB_URI", "mongodb+srv://user:pass@cluster.mongodb.net"), \
         patch("scripts.seed_demo.connect_db", AsyncMock(return_value=True)), \
         patch("scripts.seed_demo.get_db", return_value=mock_db), \
         patch("scripts.seed_demo.disconnect_db", AsyncMock()) as mock_disc:

        result = await seed()
        assert result is True
        mock_disc.assert_called_once()
        mock_db.ingredients.insert_one.assert_not_called()


@pytest.mark.asyncio
async def test_seed_aborts_gracefully_when_no_db():
    """Verify that seed() exits gracefully with False if MONGODB_URI is None."""
    with patch("scripts.seed_demo.settings.MONGODB_URI", None):
        result = await seed()
        assert result is False
