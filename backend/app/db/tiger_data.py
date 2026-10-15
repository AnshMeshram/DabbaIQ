"""Tiger Data (TimescaleDB / PostgreSQL) time-series manager for DabbaIQ.
Stores append-only ingredient-price snapshots and generates time-series market price analytics.
Gracefully degrades with clear status if unconfigured. Zero credential leakage.
"""

import time
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import asyncpg
from app.core.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None
_connected: bool = False
_last_error: Optional[str] = None
_last_latency_ms: Optional[float] = None


async def connect_tiger_db() -> bool:
    """Initialize asyncpg connection pool and run idempotent table/hypertable migration."""
    global _pool, _connected, _last_error, _last_latency_ms

    if not settings.tiger_data_available:
        _connected = False
        _last_error = "TIGER_DATA_DATABASE_URL is not configured. Price history analytics are inactive."
        return False

    try:
        start_time = time.perf_counter()
        _pool = await asyncpg.create_pool(
            settings.TIGER_DATA_DATABASE_URL,
            min_size=1,
            max_size=5,
            timeout=5.0,
            command_timeout=5.0,
        )
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        _last_latency_ms = round(elapsed_ms, 2)
        _connected = True
        _last_error = None
        logger.info("Connected to Tiger Data PostgreSQL/TimescaleDB (ping: %.1fms)", elapsed_ms)

        # Run migration
        await run_tiger_migrations()
        return True

    except Exception as exc:
        _connected = False
        _pool = None
        _last_error = f"Failed connecting to Tiger Data: {type(exc).__name__}"
        logger.warning("Tiger Data connection unavailable: %s", _last_error)
        return False


async def disconnect_tiger_db():
    """Close connection pool."""
    global _pool, _connected
    if _pool:
        await _pool.close()
        _pool = None
        _connected = False
        logger.info("Closed Tiger Data connection pool")


async def run_tiger_migrations():
    """Idempotently create DabbaIQ price snapshot table and Timescale hypertable."""
    if not _pool:
        return

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS dabbaiq_price_snapshots (
        captured_at TIMESTAMPTZ NOT NULL,
        ingredient_key VARCHAR(100) NOT NULL,
        ingredient_id VARCHAR(100),
        source_name VARCHAR(255) NOT NULL,
        product_title TEXT NOT NULL,
        price_numeric NUMERIC(10, 2),
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        original_price_text VARCHAR(100),
        source_url TEXT,
        query_text VARCHAR(255),
        provenance JSONB DEFAULT '{}'::jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_dabbaiq_price_key_time 
        ON dabbaiq_price_snapshots (ingredient_key, captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_dabbaiq_price_time 
        ON dabbaiq_price_snapshots (captured_at DESC);
    """

    async with _pool.acquire() as conn:
        await conn.execute(create_table_sql)

        # Convert to Timescale hypertable if extension is available
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;")
            await conn.execute(
                "SELECT create_hypertable('dabbaiq_price_snapshots', 'captured_at', if_not_exists => TRUE);"
            )
            logger.info("Tiger Data hypertable 'dabbaiq_price_snapshots' ready.")
        except Exception as e:
            logger.info("Standard indexed PostgreSQL table active (Timescale extension note: %s)", type(e).__name__)


async def check_tiger_health() -> Dict[str, Any]:
    """Safe status endpoint for Tiger Data connection."""
    if not settings.tiger_data_available:
        return {
            "configured": False,
            "connected": False,
            "status": "unconfigured",
            "message": "TIGER_DATA_DATABASE_URL is not set. Ingredient price snapshots are not stored in PostgreSQL.",
            "latency_ms": None,
        }

    if _pool is not None and _connected:
        try:
            start_time = time.perf_counter()
            async with _pool.acquire() as conn:
                await conn.fetchval("SELECT 1;")
            latency = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "configured": True,
                "connected": True,
                "status": "healthy",
                "message": f"Connected to Tiger Data TimescaleDB (latency: {latency}ms)",
                "latency_ms": latency,
            }
        except Exception as exc:
            return {
                "configured": True,
                "connected": False,
                "status": "degraded",
                "message": f"Ping failed: {type(exc).__name__}",
                "latency_ms": None,
            }

    return {
        "configured": True,
        "connected": False,
        "status": "disconnected",
        "message": _last_error or "Not connected to Tiger Data",
        "latency_ms": None,
    }


async def save_price_snapshot(
    ingredient_name: str,
    source_name: str,
    product_title: str,
    price_numeric: Optional[float],
    currency: str = "INR",
    original_price_text: Optional[str] = None,
    source_url: Optional[str] = None,
    query_text: Optional[str] = None,
    ingredient_id: Optional[str] = None,
    captured_at: Optional[datetime] = None,
) -> bool:
    """Save an observed price snapshot into Tiger Data hypertable."""
    if not _pool or not _connected:
        logger.debug("Skipping Tiger Data price snapshot: database not connected")
        return False

    cap_time = captured_at or datetime.now(timezone.utc)
    key = ingredient_name.strip().lower()

    sql = """
    INSERT INTO dabbaiq_price_snapshots (
        captured_at, ingredient_key, ingredient_id, source_name, product_title,
        price_numeric, currency, original_price_text, source_url, query_text
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
    """
    try:
        async with _pool.acquire() as conn:
            await conn.execute(
                sql,
                cap_time,
                key,
                ingredient_id,
                source_name[:255],
                product_title,
                price_numeric,
                currency[:10],
                original_price_text[:100] if original_price_text else None,
                source_url,
                query_text[:255] if query_text else None,
            )
        logger.info("Saved price snapshot in Tiger Data for '%s' (%.2f %s)", key, price_numeric or 0.0, currency)
        return True
    except Exception as exc:
        logger.error("Failed to insert price snapshot into Tiger Data: %s", exc)
        return False


async def get_historical_prices(ingredient_name: str, days: int = 60) -> List[Dict[str, Any]]:
    """Retrieve time-series price snapshots for an ingredient."""
    if not _pool or not _connected:
        return []

    key = ingredient_name.strip().lower()
    sql = """
    SELECT 
        captured_at,
        source_name,
        product_title,
        price_numeric,
        currency,
        original_price_text,
        source_url
    FROM dabbaiq_price_snapshots
    WHERE ingredient_key = $1
      AND captured_at >= NOW() - ($2 || ' days')::INTERVAL
    ORDER BY captured_at ASC;
    """
    try:
        async with _pool.acquire() as conn:
            rows = await conn.fetch(sql, key, str(days))
            return [
                {
                    "captured_at": row["captured_at"].isoformat(),
                    "source_name": row["source_name"],
                    "product_title": row["product_title"],
                    "price_numeric": float(row["price_numeric"]) if row["price_numeric"] is not None else None,
                    "currency": row["currency"],
                    "original_price_text": row["original_price_text"],
                    "source_url": row["source_url"],
                }
                for row in rows
            ]
    except Exception as exc:
        logger.error("Error fetching historical prices from Tiger Data: %s", exc)
        return []


async def get_price_analytics_summary() -> Dict[str, Any]:
    """Calculate aggregated price metrics per ingredient across Tiger Data hypertable."""
    if not _pool or not _connected:
        return {"configured": False, "items": []}

    sql = """
    SELECT 
        ingredient_key,
        COUNT(*) as snapshot_count,
        MIN(price_numeric) as min_price,
        AVG(price_numeric)::NUMERIC(10,2) as avg_price,
        MAX(price_numeric) as max_price,
        MAX(captured_at) as latest_captured_at
    FROM dabbaiq_price_snapshots
    WHERE price_numeric IS NOT NULL
    GROUP BY ingredient_key
    ORDER BY snapshot_count DESC;
    """
    try:
        async with _pool.acquire() as conn:
            rows = await conn.fetch(sql)
            return {
                "configured": True,
                "items": [
                    {
                        "ingredient_key": row["ingredient_key"],
                        "snapshot_count": row["snapshot_count"],
                        "min_price": float(row["min_price"]) if row["min_price"] is not None else None,
                        "avg_price": float(row["avg_price"]) if row["avg_price"] is not None else None,
                        "max_price": float(row["max_price"]) if row["max_price"] is not None else None,
                        "latest_captured_at": row["latest_captured_at"].isoformat() if row["latest_captured_at"] else None,
                    }
                    for row in rows
                ],
            }
    except Exception as exc:
        logger.error("Error generating Tiger Data price summary: %s", exc)
        return {"configured": True, "items": [], "error": str(exc)}
