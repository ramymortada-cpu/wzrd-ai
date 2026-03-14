from __future__ import annotations

"""
RADD AI — Developer API
Public API for developers to integrate RADD into their systems.
Includes API key management + public endpoints.
"""
import hashlib
import secrets
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import text

from radd.auth.middleware import CurrentUser, require_owner
from radd.config import settings
from radd.db.session import get_db_session
from radd.limiter import limiter

router = APIRouter(prefix="/developer", tags=["developer"])


# ─── API Key Model (stored in workspace settings) ─────────────────────────────

def _generate_api_key() -> str:
    """Generate a secure API key with radd_ prefix."""
    return f"radd_{secrets.token_urlsafe(32)}"


def _hash_key(key: str) -> str:
    """Hash the API key for storage (never store plaintext)."""
    return hashlib.sha256(key.encode()).hexdigest()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class CreateApiKeyRequest(BaseModel):
    name: str
    scopes: list[str] = ["conversations:read", "messages:read"]
    expires_days: int = 365


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str     # First 12 chars for identification
    scopes: list[str]
    created_at: str
    expires_at: str | None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/api-keys")
@limiter.limit(settings.default_rate_limit)
async def list_api_keys(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_owner)],
):
    """List all API keys for this workspace."""
    async with get_db_session(current.workspace_id) as db:
        result = await db.execute(
            text("""
                SELECT id, name, key_prefix, scopes, created_at, expires_at, is_active
                FROM developer_api_keys
                WHERE workspace_id = :wid AND is_active = true
                ORDER BY created_at DESC
            """),
            {"wid": str(current.workspace_id)},
        )
        rows = result.fetchall()

    keys = [
        {
            "id": str(r.id),
            "name": r.name,
            "key_prefix": r.key_prefix,
            "scopes": r.scopes,
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "expires_at": r.expires_at.isoformat() if r.expires_at else None,
        }
        for r in rows
    ]
    return {"keys": keys, "total": len(keys)}


@router.post("/api-keys", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_api_key(
    request: Request,
    body: CreateApiKeyRequest,
    current: Annotated[CurrentUser, Depends(require_owner)],
):
    """Create a new API key. The full key is shown ONCE — save it."""
    if len(body.name) > 100:
        raise HTTPException(status_code=400, detail="Name too long")

    valid_scopes = {
        "conversations:read", "messages:read", "customers:read",
        "knowledge:read", "knowledge:write", "analytics:read",
        "escalations:read", "webhooks:write",
    }
    invalid = set(body.scopes) - valid_scopes
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid scopes: {invalid}")

    full_key = _generate_api_key()
    key_hash = _hash_key(full_key)
    key_prefix = full_key[:16]

    from datetime import timedelta
    expires_at = datetime.now(UTC) + timedelta(days=body.expires_days)

    async with get_db_session(current.workspace_id) as db:
        key_id = str(uuid.uuid4())
        await db.execute(
            text("""
                INSERT INTO developer_api_keys
                    (id, workspace_id, name, key_hash, key_prefix, scopes, expires_at, is_active, created_at)
                VALUES
                    (:id, :wid, :name, :hash, :prefix, :scopes, :expires, true, NOW())
            """),
            {
                "id": key_id,
                "wid": str(current.workspace_id),
                "name": body.name,
                "hash": key_hash,
                "prefix": key_prefix,
                "scopes": body.scopes,
                "expires": expires_at,
            },
        )

    return {
        "id": key_id,
        "name": body.name,
        "key": full_key,   # Shown ONCE
        "key_prefix": key_prefix,
        "scopes": body.scopes,
        "expires_at": expires_at.isoformat(),
        "warning": "احفظ هذا المفتاح الآن — لن يُعرض مجدداً",
    }


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute")
async def revoke_api_key(
    request: Request,
    key_id: str,
    current: Annotated[CurrentUser, Depends(require_owner)],
):
    """Revoke an API key immediately."""
    async with get_db_session(current.workspace_id) as db:
        await db.execute(
            text("""
                UPDATE developer_api_keys
                SET is_active = false
                WHERE id = :kid AND workspace_id = :wid
            """),
            {"kid": key_id, "wid": str(current.workspace_id)},
        )


# ─── Public API Endpoints (authenticated with API key) ──────────────────────

async def _verify_api_key(request: Request) -> dict:
    """Dependency: verify Authorization: Bearer radd_xxx API key."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer radd_"):
        raise HTTPException(status_code=401, detail="API key required. Use: Authorization: Bearer radd_xxx")

    api_key = auth_header[7:]  # Remove "Bearer "
    key_hash = _hash_key(api_key)

    from radd.db.session import get_db_session as _get_db
    async with _get_db() as db:
        result = await db.execute(
            text("""
                SELECT id, workspace_id, scopes, expires_at, name
                FROM developer_api_keys
                WHERE key_hash = :hash AND is_active = true
            """),
            {"hash": key_hash},
        )
        row = result.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")

    if row.expires_at and row.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="API key expired")

    key_id = str(row.id)
    workspace_id = str(row.workspace_id)
    scopes = row.scopes or []

    # Update last_used_at asynchronously (fire-and-forget style via background)
    async with _get_db() as db:
        try:
            await db.execute(
                text("""
                    UPDATE developer_api_keys
                    SET last_used_at = NOW()
                    WHERE id = :kid
                """),
                {"kid": key_id},
            )
        except Exception:
            pass  # Non-critical — don't fail the request

    return {
        "workspace_id": workspace_id,
        "scopes": scopes,
        "key_name": row.name,
    }


@router.get("/v1/conversations")
@limiter.limit("100/minute")
async def public_list_conversations(
    request: Request,
    page: int = 1,
    limit: int = 50,
    auth: dict = Depends(_verify_api_key),
):
    """[Public API] List conversations for this workspace."""
    if "conversations:read" not in auth["scopes"]:
        raise HTTPException(status_code=403, detail="Missing scope: conversations:read")

    workspace_id = auth["workspace_id"]
    offset = (page - 1) * min(limit, 100)

    async with get_db_session(uuid.UUID(workspace_id)) as db:
        result = await db.execute(
            text("""
                SELECT id, intent, dialect, resolution_type, confidence_score,
                       message_count, created_at, last_message_at
                FROM conversations
                WHERE workspace_id = :wid
                ORDER BY created_at DESC
                LIMIT :lim OFFSET :off
            """),
            {"wid": workspace_id, "lim": min(limit, 100), "off": offset},
        )
        rows = result.fetchall()

    return {
        "conversations": [
            {
                "id": str(r.id),
                "intent": r.intent,
                "dialect": r.dialect,
                "resolution_type": r.resolution_type,
                "confidence_score": float(r.confidence_score or 0),
                "message_count": r.message_count,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rows
        ],
        "page": page,
    }


@router.get("/v1/analytics")
@limiter.limit("30/minute")
async def public_analytics(
    request: Request,
    period_days: int = 30,
    auth: dict = Depends(_verify_api_key),
):
    """[Public API] Get KPI analytics for this workspace."""
    if "analytics:read" not in auth["scopes"]:
        raise HTTPException(status_code=403, detail="Missing scope: analytics:read")

    from radd.utils.sql_helpers import safe_period_days
    period_days = safe_period_days(period_days, min_val=1, max_val=365)

    workspace_id = auth["workspace_id"]
    async with get_db_session(uuid.UUID(workspace_id)) as db:
        result = await db.execute(
            text(f"""
                SELECT
                    COUNT(*) total,
                    COUNT(*) FILTER(WHERE resolution_type IN ('auto_template','auto_rag')) auto_resolved,
                    COUNT(*) FILTER(WHERE resolution_type LIKE 'escalated%%') escalated,
                    AVG(confidence_score) avg_confidence
                FROM conversations
                WHERE workspace_id = :wid
                  AND created_at >= NOW() - INTERVAL '{period_days} days'
            """),
            {"wid": workspace_id},
        )
        row = result.fetchone()

    total = row.total or 0
    return {
        "period_days": period_days,
        "total_conversations": total,
        "auto_resolved": row.auto_resolved or 0,
        "escalated": row.escalated or 0,
        "automation_rate": round((row.auto_resolved or 0) / max(total, 1) * 100, 1),
        "avg_confidence": round(float(row.avg_confidence or 0), 3),
    }


@router.get("/v1/customers")
@limiter.limit("100/minute")
async def public_list_customers(
    request: Request,
    page: int = 1,
    tier: str | None = None,
    auth: dict = Depends(_verify_api_key),
):
    """[Public API] List customers for this workspace."""
    if "customers:read" not in auth["scopes"]:
        raise HTTPException(status_code=403, detail="Missing scope: customers:read")

    workspace_id = auth["workspace_id"]
    tier_filter = "AND customer_tier = :tier" if tier else ""

    async with get_db_session(uuid.UUID(workspace_id)) as db:
        params: dict = {"wid": workspace_id, "off": (page - 1) * 50}
        if tier:
            params["tier"] = tier
        result = await db.execute(
            text(f"""
                SELECT id, customer_tier, total_conversations, total_escalations,
                       avg_sentiment, salla_total_orders, salla_total_revenue, last_seen_at
                FROM customers
                WHERE workspace_id = :wid {tier_filter}
                ORDER BY last_seen_at DESC NULLS LAST
                LIMIT 50 OFFSET :off
            """),
            params,
        )
        rows = result.fetchall()

    return {
        "customers": [
            {
                "id": str(r.id),
                "tier": r.customer_tier,
                "total_conversations": r.total_conversations,
                "total_escalations": r.total_escalations,
                "avg_sentiment": float(r.avg_sentiment or 0),
                "salla_orders": r.salla_total_orders,
            }
            for r in rows
        ],
        "page": page,
    }


@router.get("/docs/openapi")
async def developer_openapi_info():
    """Information about available API endpoints and scopes."""
    return {
        "version": "v1",
        "base_url": "/api/v1/developer/v1",
        "authentication": "Bearer radd_xxx (create API key in Settings → Developer)",
        "scopes": [
            {"scope": "conversations:read", "description": "قراءة بيانات المحادثات"},
            {"scope": "messages:read", "description": "قراءة الرسائل"},
            {"scope": "customers:read", "description": "قراءة بيانات العملاء"},
            {"scope": "knowledge:read", "description": "قراءة قاعدة المعرفة"},
            {"scope": "knowledge:write", "description": "إضافة وتحديث قاعدة المعرفة"},
            {"scope": "analytics:read", "description": "قراءة التحليلات والإحصاءات"},
            {"scope": "escalations:read", "description": "قراءة بيانات التصعيدات"},
            {"scope": "webhooks:write", "description": "إعداد webhooks للإشعارات"},
        ],
        "endpoints": [
            "GET /api/v1/developer/v1/conversations",
            "GET /api/v1/developer/v1/analytics",
            "GET /api/v1/developer/v1/customers",
        ],
        "rate_limits": "100 requests/minute per key",
        "support": "developer@radd.ai",
    }
