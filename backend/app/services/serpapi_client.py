"""SerpAPI supplier & ingredient price search service for DabbaIQ.
Provides real-time market pricing via Google Shopping with Google Search fallback.
Enforces strict credential privacy, timeouts, caching, and robust price extraction.
"""

import re
import time
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory search cache: query_key -> (timestamp, results)
_CACHE: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}
_CACHE_TTL_SECONDS = 1800  # 30 minutes


def _parse_numeric_price(price_text: Optional[str]) -> Optional[float]:
    """Deterministically extracts numeric price from strings like '₹240', 'Rs. 1,250.50', '₹ 80/kg'.
    Returns None if no unambiguous price is present.
    """
    if not price_text:
        return None

    # Remove currency symbols and extraneous characters, keep digits, decimal and commas
    cleaned = price_text.replace(",", "").strip()
    match = re.search(r"(\d+(?:\.\d{1,2})?)", cleaned)
    if match:
        try:
            val = float(match.group(1))
            return round(val, 2) if val > 0 else None
        except (ValueError, TypeError):
            return None
    return None


def _detect_currency(price_text: Optional[str], default_currency: str = "INR") -> str:
    """Detects currency symbol/code or falls back to default."""
    if not price_text:
        return default_currency
    text = price_text.upper()
    if "₹" in text or "RS" in text or "INR" in text:
        return "INR"
    if "$" in text or "USD" in text:
        return "USD"
    if "€" in text or "EUR" in text:
        return "EUR"
    if "£" in text or "GBP" in text:
        return "GBP"
    return default_currency


class SerpAPIClient:
    """Async client for SerpAPI Google Shopping & Search."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout_seconds: float = 8.0,
        max_retries: int = 2,
    ):
        self.api_key = api_key if api_key is not None else settings.SERPAPI_API_KEY
        self.base_url = base_url if base_url is not None else settings.SERPAPI_BASE_URL
        self.timeout = timeout_seconds
        self.max_retries = max_retries

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def search_ingredient_prices(
        self,
        ingredient_name: str,
        package_quantity: Optional[float] = None,
        package_unit: Optional[str] = None,
        location: Optional[str] = None,
        gl: Optional[str] = None,
        hl: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Search for ingredient suppliers and live prices.
        Tries Google Shopping first, falling back to Google Search if needed.
        """
        if not self.is_configured:
            return {
                "configured": False,
                "query": ingredient_name,
                "results": [],
                "error": "SERPAPI_API_KEY is not configured. Live market price search is disabled.",
                "cached": False,
            }

        # Build sanitized search query (bounded length, no PII)
        clean_name = ingredient_name.strip()[:80]
        query_parts = [clean_name]
        if package_quantity and package_unit:
            query_parts.append(f"{package_quantity}{package_unit}")
        query_parts.append("wholesale supplier price")
        full_query = " ".join(query_parts)

        target_location = location or settings.SERPAPI_LOCATION or "India"
        target_gl = gl or settings.SERPAPI_GL or "in"
        target_hl = hl or settings.SERPAPI_HL or "en"

        cache_key = f"{full_query.lower()}:{target_location.lower()}:{target_gl}"
        now = time.time()
        if cache_key in _CACHE:
            cached_time, cached_results = _CACHE[cache_key]
            if now - cached_time < _CACHE_TTL_SECONDS:
                logger.info("Serving SerpAPI results from cache for '%s'", clean_name)
                return {
                    "configured": True,
                    "query": full_query,
                    "location": target_location,
                    "results": cached_results,
                    "cached": True,
                    "retrieved_at": datetime.fromtimestamp(cached_time, timezone.utc).isoformat(),
                }

        # Attempt 1: Google Shopping
        results, err = await self._query_serpapi(
            engine="google_shopping",
            query=full_query,
            location=target_location,
            gl=target_gl,
            hl=target_hl,
        )

        # Attempt 2: Fallback to regular Google Search if shopping gave 0 results
        if not results and not err:
            logger.info("Shopping returned 0 results for '%s', trying fallback organic search", clean_name)
            fallback_query = f"{clean_name} buy price {target_location}"
            results, err = await self._query_serpapi(
                engine="google",
                query=fallback_query,
                location=target_location,
                gl=target_gl,
                hl=target_hl,
            )

        if err:
            return {
                "configured": True,
                "query": full_query,
                "location": target_location,
                "results": [],
                "error": err,
                "cached": False,
            }

        _CACHE[cache_key] = (now, results)

        return {
            "configured": True,
            "query": full_query,
            "location": target_location,
            "results": results,
            "cached": False,
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _query_serpapi(
        self,
        engine: str,
        query: str,
        location: str,
        gl: str,
        hl: str,
    ) -> tuple[List[Dict[str, Any]], Optional[str]]:
        """Executes HTTP request to SerpAPI with bounded retries and sanitized logging."""
        params = {
            "api_key": self.api_key,
            "engine": engine,
            "q": query,
            "gl": gl,
            "hl": hl,
        }
        if location and location.lower() != "india":
            params["location"] = location

        # Safe logging without API key
        logger.info("Executing SerpAPI query (engine=%s, query='%s', gl=%s)", engine, query, gl)

        last_error = None
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(1, self.max_retries + 1):
                try:
                    resp = await client.get(self.base_url, params=params)
                    if resp.status_code == 401 or resp.status_code == 403:
                        return [], "SerpAPI authentication failed. Verify SERPAPI_API_KEY in backend/.env."
                    if resp.status_code == 429:
                        return [], "SerpAPI rate limit or monthly search quota exhausted."
                    if resp.status_code != 200:
                        last_error = f"SerpAPI returned HTTP {resp.status_code}: {resp.text[:150]}"
                        continue

                    data = resp.json()
                    results = self._normalize_results(data, engine)
                    return results, None

                except httpx.TimeoutException:
                    last_error = f"SerpAPI request timed out (attempt {attempt}/{self.max_retries})"
                    logger.warning(last_error)
                except httpx.RequestError as exc:
                    last_error = f"Network error connecting to SerpAPI: {type(exc).__name__}"
                    logger.warning(last_error)
                except Exception as exc:
                    last_error = f"Unexpected error processing SerpAPI response: {type(exc).__name__}"
                    logger.error(last_error)
                    break

        return [], last_error

    def _normalize_results(self, data: Dict[str, Any], engine: str) -> List[Dict[str, Any]]:
        """Normalize raw SerpAPI results into uniform schema."""
        normalized = []
        now_iso = datetime.now(timezone.utc).isoformat()

        if engine == "google_shopping":
            items = data.get("shopping_results", [])
            for item in items[:15]:
                title = item.get("title") or "Unnamed Product"
                source = item.get("source") or item.get("merchant", {}).get("name") or "Online Supplier"
                url = item.get("link") or item.get("product_link") or ""
                price_text = item.get("price")
                extracted_price = item.get("extracted_price")
                
                # Use extracted_price if provided and numeric, otherwise parse price string
                numeric_price = None
                if isinstance(extracted_price, (int, float)):
                    numeric_price = float(extracted_price)
                elif price_text:
                    numeric_price = _parse_numeric_price(str(price_text))

                currency = _detect_currency(price_text)

                normalized.append({
                    "title": title[:200],
                    "source_name": source[:100],
                    "url": url,
                    "price_text": price_text,
                    "price_numeric": numeric_price,
                    "currency": currency,
                    "thumbnail": item.get("thumbnail"),
                    "retrieved_at": now_iso,
                    "rating": item.get("rating"),
                    "reviews": item.get("reviews"),
                })

        else:  # engine == "google"
            items = data.get("organic_results", [])
            for item in items[:10]:
                title = item.get("title") or "Unnamed Result"
                source = item.get("displayed_link") or "Web Search"
                url = item.get("link") or ""
                snippet = item.get("snippet", "")
                numeric_price = _parse_numeric_price(snippet)
                currency = _detect_currency(snippet)

                normalized.append({
                    "title": title[:200],
                    "source_name": source[:100],
                    "url": url,
                    "price_text": f"Found in snippet: {snippet[:60]}" if numeric_price else None,
                    "price_numeric": numeric_price,
                    "currency": currency,
                    "thumbnail": None,
                    "retrieved_at": now_iso,
                    "rating": None,
                    "reviews": None,
                })

        return normalized


serpapi_client = SerpAPIClient()
