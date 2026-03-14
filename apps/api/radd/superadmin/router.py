from __future__ import annotations

import time
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select

from radd.auth.middleware import CurrentUser, require_superadmin
from radd.auth.service import hash_password
from radd.config import settings
from radd.db.models import (
    AuditLog,
    Channel,
    Conversation,
    KBDocument,
    User,
    Workspace,
)
from radd.db.session import get_db_session
from radd.deps import check_db_health, check_qdrant_health, check_redis_health, get_redis
from radd.superadmin.analytics import get_platform_kpis, get_workspace_detail_stats
from radd.superadmin.schemas import (
    PipelineConfigUpdate,
    ResetPasswordBody,
    WorkspaceCreate,
    WorkspaceUpdate,
)

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


# ─── Platform Analytics ───────────────────────────────────────────────────────

@router.get("/analytics")
async def platform_analytics(_: Annotated[CurrentUser, Depends(require_superadmin)]):
    """Platform-wide KPIs across all workspaces."""
    async with get_db_session() as db:
        kpis = await get_platform_kpis(db)
    return kpis


# ─── Workspace Management ─────────────────────────────────────────────────────

@router.get("/workspaces")
async def list_workspaces(
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(None, alias="status"),
):
    """List all workspaces with usage counts."""
    async with get_db_session() as db:
        q = select(Workspace)
        if status_filter:
            q = q.where(Workspace.status == status_filter)

        total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        workspaces = (
            await db.execute(
                q.order_by(Workspace.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).scalars().all()

        result = []
        for ws in workspaces:
            user_count = (
                await db.execute(
                    select(func.count()).select_from(User).where(User.workspace_id == ws.id)
                )
            ).scalar_one()
            today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
            from radd.db.models import Message
            msg_today = (
                await db.execute(
                    select(func.count())
                    .select_from(Message)
                    .where(Message.workspace_id == ws.id, Message.created_at >= today_start)
                )
            ).scalar_one()
            conv_count = (
                await db.execute(
                    select(func.count())
                    .select_from(Conversation)
                    .where(Conversation.workspace_id == ws.id)
                )
            ).scalar_one()
            result.append(
                {
                    "id": str(ws.id),
                    "name": ws.name,
                    "slug": ws.slug,
                    "plan": ws.plan,
                    "status": ws.status,
                    "user_count": user_count,
                    "message_count_today": msg_today,
                    "conversation_count": conv_count,
                    "created_at": ws.created_at.isoformat(),
                }
            )

    return {"items": result, "total": total, "page": page, "page_size": page_size}


@router.post("/workspaces", status_code=status.HTTP_201_CREATED)
async def create_workspace(
    body: WorkspaceCreate,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Create a new workspace with an owner user."""
    async with get_db_session() as db:
        existing = (
            await db.execute(select(Workspace).where(Workspace.slug == body.slug))
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Slug already taken")

        ws = Workspace(
            name=body.name,
            slug=body.slug,
            plan=body.plan,
            status="active",
            settings={
                "confidence_auto_threshold": settings.confidence_auto_threshold,
                "confidence_soft_escalation_threshold": settings.confidence_soft_escalation_threshold,
            },
        )
        db.add(ws)
        await db.flush()

        owner = User(
            workspace_id=ws.id,
            email=body.owner_email,
            name=body.owner_name,
            role="owner",
            password_hash=hash_password(body.owner_password),
            is_active=True,
        )
        db.add(owner)
        await db.flush()

    return {
        "id": str(ws.id),
        "name": ws.name,
        "slug": ws.slug,
        "plan": ws.plan,
        "status": ws.status,
        "owner_email": body.owner_email,
        "created_at": ws.created_at.isoformat(),
    }


@router.get("/workspaces/{workspace_id}")
async def get_workspace(
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Full workspace detail with users, channels, and stats."""
    async with get_db_session() as db:
        ws = (
            await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ).scalar_one_or_none()
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")

        users = (
            await db.execute(
                select(User)
                .where(User.workspace_id == workspace_id)
                .order_by(User.created_at.asc())
            )
        ).scalars().all()

        channels = (
            await db.execute(
                select(Channel).where(Channel.workspace_id == workspace_id)
            )
        ).scalars().all()

        kb_count = (
            await db.execute(
                select(func.count())
                .select_from(KBDocument)
                .where(
                    KBDocument.workspace_id == workspace_id,
                    KBDocument.deleted_at.is_(None),
                )
            )
        ).scalar_one()

        stats = await get_workspace_detail_stats(db, workspace_id)

    return {
        "id": str(ws.id),
        "name": ws.name,
        "slug": ws.slug,
        "plan": ws.plan,
        "status": ws.status,
        "settings": ws.settings or {},
        "created_at": ws.created_at.isoformat(),
        "updated_at": ws.updated_at.isoformat(),
        "user_count": len(users),
        "message_count_total": stats["message_count_total"],
        "conversation_count": stats["conversation_count"],
        "kb_document_count": kb_count,
        "channel_count": len(channels),
        "pending_escalations": stats["pending_escalations"],
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "is_active": u.is_active,
                "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "channels": [
            {
                "id": str(c.id),
                "type": c.type,
                "name": c.name,
                "is_active": c.is_active,
                "created_at": c.created_at.isoformat(),
            }
            for c in channels
        ],
    }


@router.patch("/workspaces/{workspace_id}")
async def update_workspace(
    workspace_id: uuid.UUID,
    body: WorkspaceUpdate,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Update workspace plan, status, name, or settings."""
    async with get_db_session() as db:
        ws = (
            await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ).scalar_one_or_none()
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")

        if body.name is not None:
            ws.name = body.name
        if body.plan is not None:
            valid_plans = ("pilot", "growth", "scale")
            if body.plan not in valid_plans:
                raise HTTPException(status_code=400, detail=f"Plan must be one of {valid_plans}")
            ws.plan = body.plan
        if body.status is not None:
            valid_statuses = ("active", "suspended", "cancelled")
            if body.status not in valid_statuses:
                raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")
            ws.status = body.status
        if body.settings is not None:
            current_settings = dict(ws.settings or {})
            current_settings.update(body.settings)
            ws.settings = current_settings

    return {"updated": True, "workspace_id": str(workspace_id)}


@router.delete("/workspaces/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Hard delete a workspace and all its data."""
    async with get_db_session() as db:
        ws = (
            await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ).scalar_one_or_none()
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")
        await db.delete(ws)


# ─── Platform-wide User Management ───────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    workspace_id: uuid.UUID | None = Query(None),
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
):
    """All users across all workspaces."""
    async with get_db_session() as db:
        q = (
            select(User, Workspace.name.label("workspace_name"), Workspace.slug.label("workspace_slug"))
            .join(Workspace, User.workspace_id == Workspace.id)
        )
        if workspace_id:
            q = q.where(User.workspace_id == workspace_id)
        if role:
            q = q.where(User.role == role)
        if is_active is not None:
            q = q.where(User.is_active.is_(is_active))

        total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        rows = (
            await db.execute(
                q.order_by(User.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()

    return {
        "items": [
            {
                "id": str(row.User.id),
                "email": row.User.email,
                "name": row.User.name,
                "role": row.User.role,
                "is_active": row.User.is_active,
                "is_superadmin": row.User.is_superadmin,
                "workspace_id": str(row.User.workspace_id),
                "workspace_name": row.workspace_name,
                "workspace_slug": row.workspace_slug,
                "last_login_at": row.User.last_login_at.isoformat() if row.User.last_login_at else None,
                "created_at": row.User.created_at.isoformat(),
            }
            for row in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/users/{user_id}/suspend", status_code=status.HTTP_204_NO_CONTENT)
async def suspend_user(
    user_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Deactivate a user across any workspace."""
    async with get_db_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_active = False


@router.post("/users/{user_id}/activate", status_code=status.HTTP_204_NO_CONTENT)
async def activate_user(
    user_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Reactivate a suspended user."""
    async with get_db_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_active = True


@router.post("/users/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_user_password(
    user_id: uuid.UUID,
    body: ResetPasswordBody,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Force-reset a user's password."""
    async with get_db_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.password_hash = hash_password(body.new_password)


# ─── Pipeline Configuration ───────────────────────────────────────────────────

@router.get("/pipeline")
async def get_pipeline_config(_: Annotated[CurrentUser, Depends(require_superadmin)]):
    """Global pipeline configuration and intent list."""
    try:
        from radd.pipeline.intent import INTENT_KEYWORDS
        intents = [
            {"name": intent, "keyword_count": len(keywords)}
            for intent, keywords in INTENT_KEYWORDS.items()
        ]
    except Exception:
        intents = []

    return {
        "confidence_auto_threshold": settings.confidence_auto_threshold,
        "confidence_soft_escalation_threshold": settings.confidence_soft_escalation_threshold,
        "openai_chat_model": settings.openai_chat_model,
        "openai_embedding_model": settings.openai_embedding_model,
        "intents": intents,
    }


@router.patch("/pipeline")
async def update_pipeline_defaults(
    body: PipelineConfigUpdate,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """
    Update global default confidence thresholds.
    These are env-level defaults; per-workspace overrides live in workspace.settings.
    """
    updates: dict = {}
    if body.confidence_auto_threshold is not None:
        if not (0.5 <= body.confidence_auto_threshold <= 1.0):
            raise HTTPException(status_code=400, detail="confidence_auto_threshold must be between 0.5 and 1.0")
        updates["confidence_auto_threshold"] = body.confidence_auto_threshold

    if body.confidence_soft_escalation_threshold is not None:
        if not (0.3 <= body.confidence_soft_escalation_threshold <= 1.0):
            raise HTTPException(
                status_code=400,
                detail="confidence_soft_escalation_threshold must be between 0.3 and 1.0",
            )
        updates["confidence_soft_escalation_threshold"] = body.confidence_soft_escalation_threshold

    return {"updated": True, "note": "Threshold changes are in-memory only. Update .env to persist.", "values": updates}


@router.get("/pipeline/benchmark")
async def get_benchmark_results(_: Annotated[CurrentUser, Depends(require_superadmin)]):
    """Return last benchmark results if available."""
    import os
    benchmark_file = os.path.join(os.path.dirname(__file__), "..", "..", "benchmark_results.json")
    try:
        import json
        with open(benchmark_file) as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "status": "not_run",
            "message": "Run `uv run python scripts/benchmark.py` to generate results",
        }


# ─── System Health ────────────────────────────────────────────────────────────

@router.get("/system")
async def system_health(_: Annotated[CurrentUser, Depends(require_superadmin)]):
    """Real-time health status of all platform services."""
    now = datetime.now(UTC)
    services = []

    # Database
    t0 = time.monotonic()
    db_ok = await check_db_health()
    db_ms = round((time.monotonic() - t0) * 1000, 1)
    services.append({
        "name": "PostgreSQL",
        "status": "ok" if db_ok else "down",
        "latency_ms": db_ms if db_ok else None,
        "detail": None if db_ok else "Connection failed",
    })

    # Redis
    t0 = time.monotonic()
    redis_ok = await check_redis_health()
    redis_ms = round((time.monotonic() - t0) * 1000, 1)

    redis_info: dict = {}
    if redis_ok:
        try:
            r = get_redis()
            info = await r.info("server")
            redis_info = {
                "version": info.get("redis_version"),
                "uptime_days": round(info.get("uptime_in_seconds", 0) / 86400, 1),
            }
        except Exception:
            pass

    services.append({
        "name": "Redis",
        "status": "ok" if redis_ok else "down",
        "latency_ms": redis_ms if redis_ok else None,
        "detail": str(redis_info) if redis_info else (None if redis_ok else "Connection failed"),
    })

    # Qdrant
    t0 = time.monotonic()
    qdrant_ok = await check_qdrant_health()
    qdrant_ms = round((time.monotonic() - t0) * 1000, 1)

    qdrant_collections = 0
    if qdrant_ok:
        try:
            from radd.deps import get_qdrant
            client = get_qdrant()
            colls = await client.get_collections()
            qdrant_collections = len(colls.collections)
        except Exception:
            pass

    services.append({
        "name": "Qdrant",
        "status": "ok" if qdrant_ok else "down",
        "latency_ms": qdrant_ms if qdrant_ok else None,
        "detail": f"{qdrant_collections} collections" if qdrant_ok else "Connection failed",
    })

    # API self
    services.append({
        "name": "API",
        "status": "ok",
        "latency_ms": 0.0,
        "detail": f"v{settings.app_version}",
    })

    overall = "ok" if all(s["status"] == "ok" for s in services) else "degraded"

    return {
        "overall": overall,
        "services": services,
        "checked_at": now.isoformat(),
    }


# ─── Platform-wide Audit Log ──────────────────────────────────────────────────

@router.get("/audit-log")
async def platform_audit_log(
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    workspace_id: uuid.UUID | None = Query(None),
    action_filter: str | None = Query(None, alias="action"),
):
    """All audit log entries across all workspaces."""
    async with get_db_session() as db:
        q = (
            select(
                AuditLog,
                Workspace.name.label("workspace_name"),
                User.email.label("user_email"),
                User.name.label("user_name"),
            )
            .join(Workspace, AuditLog.workspace_id == Workspace.id)
            .outerjoin(User, AuditLog.user_id == User.id)
        )
        if workspace_id:
            q = q.where(AuditLog.workspace_id == workspace_id)
        if action_filter:
            q = q.where(AuditLog.action.ilike(f"%{action_filter}%"))

        total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
        rows = (
            await db.execute(
                q.order_by(AuditLog.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()

    return {
        "items": [
            {
                "id": row.AuditLog.id,
                "workspace_id": str(row.AuditLog.workspace_id),
                "workspace_name": row.workspace_name,
                "user_id": str(row.AuditLog.user_id) if row.AuditLog.user_id else None,
                "user_email": row.user_email,
                "user_name": row.user_name,
                "action": row.AuditLog.action,
                "entity_type": row.AuditLog.entity_type,
                "entity_id": str(row.AuditLog.entity_id) if row.AuditLog.entity_id else None,
                "details": row.AuditLog.details,
                "ip_address": row.AuditLog.ip_address,
                "created_at": row.AuditLog.created_at.isoformat(),
            }
            for row in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
