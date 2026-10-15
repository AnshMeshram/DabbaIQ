"""MongoDB connection manager for DabbaIQ.
Handles persistent storage with detailed failure diagnostics and zero credential leakage.
"""

import time
import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import (
    ServerSelectionTimeoutError,
    OperationFailure,
    ConfigurationError,
    PyMongoError,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None
_connected: bool = False
_last_error: Optional[str] = None
_last_check_ms: Optional[float] = None


async def connect_db() -> bool:
    """Attempt to connect to MongoDB with comprehensive error diagnosis.
    Returns True if connected and ping succeeds; False otherwise.
    """
    global _client, _db, _connected, _last_error, _last_check_ms

    if not settings.db_available:
        _connected = False
        _last_error = (
            "MONGODB_URI is not set. Persistent database is disabled. "
            "Set MONGODB_URI in backend/.env to connect to MongoDB Atlas."
        )
        logger.warning(_last_error)
        return False

    db_name = settings.database_name

    try:
        start_time = time.perf_counter()

        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
        )

        # Execute ping command to verify connectivity & authentication
        await _client.admin.command("ping")
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        _db = _client[db_name]
        _connected = True
        _last_error = None
        _last_check_ms = round(elapsed_ms, 2)

        logger.info(
            "Connected successfully to MongoDB database: '%s' (ping: %.1fms)",
            db_name,
            elapsed_ms,
        )

        await _ensure_indexes()
        return True

    except ServerSelectionTimeoutError as e:
        _connected = False
        _client = None
        _db = None
        err_msg = str(e)
        if "getaddrinfo" in err_msg or "nodename" in err_msg or "dns" in err_msg.lower():
            _last_error = (
                "DNS lookup failed for MongoDB host. Check your network connection "
                "or cluster hostname in MONGODB_URI."
            )
        else:
            _last_error = (
                "Connection timed out. Check that your current IP address is whitelisted "
                "in MongoDB Atlas Network Access (0.0.0.0/0 for testing)."
            )
        logger.error("MongoDB ServerSelectionTimeoutError: %s", _last_error)
        return False

    except OperationFailure as e:
        _connected = False
        _client = None
        _db = None
        _last_error = (
            "MongoDB Authentication failed. Verify the database username, "
            "password, and database user privileges in MONGODB_URI."
        )
        logger.error("MongoDB Authentication failure (code %s)", getattr(e, "code", "unknown"))
        return False

    except ConfigurationError as e:
        _connected = False
        _client = None
        _db = None
        _last_error = (
            "Invalid MongoDB URI format. Ensure MONGODB_URI begins with "
            "'mongodb+srv://' or 'mongodb://' and contains a valid connection string."
        )
        logger.error("MongoDB Configuration error: %s", _last_error)
        return False

    except PyMongoError as e:
        _connected = False
        _client = None
        _db = None
        _last_error = f"Database driver error: {type(e).__name__}"
        logger.error("MongoDB generic driver error: %s", e)
        return False

    except Exception as e:
        _connected = False
        _client = None
        _db = None
        _last_error = f"Unexpected connection error: {type(e).__name__}"
        logger.error("Unexpected error connecting to MongoDB: %s", e)
        return False


async def disconnect_db():
    """Disconnect from MongoDB."""
    global _client, _db, _connected, _last_error
    if _client:
        _client.close()
        _client = None
        _db = None
        _connected = False
        logger.info("Disconnected from MongoDB client")


def get_db() -> Optional[AsyncIOMotorDatabase]:
    """Get the active database instance. Returns None if not connected."""
    return _db


def is_connected() -> bool:
    """Check if database is connected."""
    return _connected


async def check_db_health() -> Dict[str, Any]:
    """Live database health check. Safe to return in API without leaking credentials."""
    global _connected, _last_check_ms, _last_error

    if not settings.db_available:
        return {
            "connected": False,
            "status": "unconfigured",
            "database": settings.database_name,
            "latency_ms": None,
            "message": "MONGODB_URI not configured. Data is not permanently saved.",
        }

    if _client is not None and _db is not None:
        try:
            start_time = time.perf_counter()
            await _client.admin.command("ping")
            latency = (time.perf_counter() - start_time) * 1000
            _connected = True
            _last_check_ms = round(latency, 2)
            _last_error = None
            return {
                "connected": True,
                "status": "healthy",
                "database": settings.database_name,
                "latency_ms": _last_check_ms,
                "message": f"Connected to MongoDB Atlas (latency: {_last_check_ms}ms)",
            }
        except Exception as e:
            _connected = False
            _last_error = f"Ping failed: {type(e).__name__}"

    # Try reconnecting
    reconnected = await connect_db()
    return {
        "connected": reconnected,
        "status": "healthy" if reconnected else "unhealthy",
        "database": settings.database_name,
        "latency_ms": _last_check_ms if reconnected else None,
        "message": (
            f"Connected to MongoDB Atlas (latency: {_last_check_ms}ms)"
            if reconnected
            else (_last_error or "Unable to reach MongoDB")
        ),
    }


async def _ensure_indexes():
    """Create indexes for performance and query optimization."""
    if _db is None:
        return

    try:
        # Sales indexes
        await _db.sales.create_index([("date", 1), ("meal_period", 1)])
        await _db.sales.create_index([("recipe_id", 1)])
        await _db.sales.create_index([("is_demo", 1)])

        # Inventory indexes
        await _db.ingredients.create_index([("name", 1)], unique=True)
        await _db.ingredients.create_index([("expiry_date", 1)])
        await _db.ingredients.create_index([("is_demo", 1)])

        # Recipes indexes
        await _db.recipes.create_index([("name", 1)], unique=True)
        await _db.recipes.create_index([("is_demo", 1)])

        # Plans indexes
        await _db.plans.create_index([("target_date", 1), ("meal_period", 1)])
        await _db.plans.create_index([("is_confirmed", 1)])

        # Waste indexes
        await _db.waste.create_index([("date", 1)])
        await _db.waste.create_index([("recipe_id", 1)])
        await _db.waste.create_index([("is_demo", 1)])

        logger.info("Database indexes ensured")
    except Exception as e:
        logger.error("Error creating indexes: %s", e)
