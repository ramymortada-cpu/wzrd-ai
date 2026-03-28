"""
Super Admin — Full control over any workspace.

All endpoints require superadmin. workspace_id is taken from path.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select

from radd.auth.middleware import CurrentUser, require_superadmin
from radd.config import settings
from radd.db.models import (
    Channel,
    Conversation,
    Customer,
    EscalationEvent,
    OutboundCall,
    RevenueEvent,
    SmartRule as SmartRuleModel,
    User,
    Workspace,
)
from radd.db.session import get_db_session
from radd.limiter import limiter

router = APIRouter(tags=["superadmin-workspace"])


# ─── Channels ─────────────────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/channels")
@limiter.limit(settings.default_rate_limit)
async def sa_list_channels(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """List all channels for a workspace."""
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(Channel).where(Channel.workspace_id == workspace_id)
        )
        channels = result.scalars().all()
    return {
        "channels": [
            {
                "id": str(c.id),
                "type": c.type,
                "name": c.name,
                "is_active": c.is_active,
                "config": {k: "***" if "token" in k.lower() else v for k, v in (c.config or {}).items()},
                "created_at": c.created_at.isoformat() if c.created_at else "",
            }
            for c in channels
        ]
    }


class ChannelUpdate(BaseModel):
    is_active: bool | None = None
    name: str | None = None


@router.patch("/workspaces/{workspace_id}/channels/{channel_id}")
@limiter.limit(settings.default_rate_limit)
async def sa_update_channel(
    request: Request,
    workspace_id: uuid.UUID,
    channel_id: uuid.UUID,
    body: ChannelUpdate,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Update channel (toggle active, rename)."""
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(Channel).where(
                Channel.id == channel_id,
                Channel.workspace_id == workspace_id,
            )
        )
        ch = result.scalar_one_or_none()
        if not ch:
            raise HTTPException(status_code=404, detail="Channel not found")
        if body.is_active is not None:
            ch.is_active = body.is_active
        if body.name is not None:
            ch.name = body.name
    return {"updated": True}


@router.delete("/workspaces/{workspace_id}/channels/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.default_rate_limit)
async def sa_delete_channel(
    request: Request,
    workspace_id: uuid.UUID,
    channel_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Delete a channel."""
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(Channel).where(
                Channel.id == channel_id,
                Channel.workspace_id == workspace_id,
            )
        )
        ch = result.scalar_one_or_none()
        if not ch:
            raise HTTPException(status_code=404, detail="Channel not found")
        await db.delete(ch)


# ─── Rules ────────────────────────────────────────────────────────────────────

class SmartRuleCreate(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True
    priority: int = 0
    triggers: list[dict] = []
    actions: list[dict] = []


@router.get("/workspaces/{workspace_id}/rules")
@limiter.limit(settings.default_rate_limit)
async def sa_list_rules(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """List all smart rules for a workspace."""
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(SmartRuleModel)
            .where(SmartRuleModel.workspace_id == workspace_id)
            .order_by(SmartRuleModel.priority.desc())
        )
        rules = result.scalars().all()
    return {
        "items": [
            {
                "id": str(r.id),
                "name": r.name,
                "description": r.description,
                "is_active": r.is_active,
                "priority": r.priority,
                "triggers": r.triggers,
                "actions": r.actions,
                "created_at": r.created_at.isoformat(),
            }
            for r in rules
        ]
    }


@router.post("/workspaces/{workspace_id}/rules", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.default_rate_limit)
async def sa_create_rule(
    request: Request,
    workspace_id: uuid.UUID,
    body: SmartRuleCreate,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Create a smart rule for a workspace."""
    async with get_db_session(workspace_id) as db:
        rule = SmartRuleModel(
            workspace_id=workspace_id,
            name=body.name,
            description=body.description,
            is_active=body.is_active,
            priority=body.priority,
            triggers=body.triggers,
            actions=body.actions,
        )
        db.add(rule)
        await db.flush()
    return {"id": str(rule.id), "name": rule.name, "created": True}


@router.patch("/workspaces/{workspace_id}/rules/{rule_id}")
@limiter.limit(settings.default_rate_limit)
async def sa_update_rule(
    request: Request,
    workspace_id: uuid.UUID,
    rule_id: uuid.UUID,
    body: dict,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Update a smart rule."""
    allowed = {"name", "description", "is_active", "priority", "triggers", "actions"}
    updates = {k: v for k, v in body.items() if k in allowed}
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(SmartRuleModel).where(
                SmartRuleModel.id == rule_id,
                SmartRuleModel.workspace_id == workspace_id,
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        for k, v in updates.items():
            setattr(rule, k, v)
    return {"updated": True}


@router.delete("/workspaces/{workspace_id}/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.default_rate_limit)
async def sa_delete_rule(
    request: Request,
    workspace_id: uuid.UUID,
    rule_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Delete a smart rule."""
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(SmartRuleModel).where(
                SmartRuleModel.id == rule_id,
                SmartRuleModel.workspace_id == workspace_id,
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        await db.delete(rule)


# ─── Integrations (Salla, Zid, Starter Pack) ──────────────────────────────────

class SallaSyncRequest(BaseModel):
    salla_api_url: str = "https://api.salla.dev/admin/v2"
    salla_token: str


class StarterPackRequest(BaseModel):
    sector: str


class ZidSyncRequest(BaseModel):
    zid_token: str
    store_id: str = ""


@router.post("/workspaces/{workspace_id}/integrations/salla/sync")
@limiter.limit("10/minute")
async def sa_salla_sync(
    request: Request,
    workspace_id: uuid.UUID,
    body: SallaSyncRequest,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Trigger Salla sync for a workspace."""
    from radd.knowledge.service import KBService
    from radd.onboarding.salla_sync import run_full_sync
    async with get_db_session(workspace_id) as db:
        kb_service = KBService(db=db, workspace_id=workspace_id)
        result = await run_full_sync(
            workspace_id=str(workspace_id),
            salla_api_url=body.salla_api_url,
            salla_token=body.salla_token,
            db_session=db,
            kb_service=kb_service,
        )
    return {
        "synced": True,
        "products_synced": getattr(result, "products_synced", 0),
        "documents_created": getattr(result, "documents_created", 0),
    }


@router.post("/workspaces/{workspace_id}/integrations/starter-pack")
@limiter.limit("5/minute")
async def sa_starter_pack(
    request: Request,
    workspace_id: uuid.UUID,
    body: StarterPackRequest,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Apply starter pack to a workspace."""
    from radd.knowledge.service import KBService
    from radd.sales.engine import apply_starter_pack
    async with get_db_session(workspace_id) as db:
        kb_service = KBService(db=db, workspace_id=workspace_id)
        result = await apply_starter_pack(
            workspace_id=str(workspace_id),
            sector=body.sector,
            kb_service=kb_service,
        )
        ws_result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = ws_result.scalar_one_or_none()
        if ws:
            ws.sector = body.sector
    return result


@router.post("/workspaces/{workspace_id}/integrations/zid/sync")
@limiter.limit("10/minute")
async def sa_zid_sync(
    request: Request,
    workspace_id: uuid.UUID,
    body: ZidSyncRequest,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Trigger Zid sync for a workspace."""
    from radd.knowledge.service import KBService
    from radd.onboarding.zid_sync import sync_zid_store
    async with get_db_session(workspace_id) as db:
        kb = KBService(db=db, workspace_id=workspace_id)
        result = await sync_zid_store(
            workspace_id=str(workspace_id),
            access_token=body.zid_token,
            store_id=body.store_id,
            kb_service=kb,
        )
    return result


# ─── Knowledge Base ───────────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/kb/documents")
@limiter.limit(settings.default_rate_limit)
async def sa_list_kb_documents(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(None, alias="status"),
):
    """List KB documents for a workspace."""
    from radd.knowledge import service
    async with get_db_session(workspace_id) as db:
        docs, total = await service.list_documents(
            db, workspace_id, status=status_filter, page=page, page_size=page_size
        )
    return {
        "items": [
            {
                "id": str(d.id),
                "title": d.title,
                "content_type": d.content_type,
                "status": d.status,
                "created_at": d.created_at.isoformat() if d.created_at else "",
            }
            for d in docs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


class KBDocumentCreate(BaseModel):
    title: str
    content: str
    content_type: str = "general"
    language: str = "ar"


class KBDocumentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    content_type: str | None = None
    status: str | None = None


@router.post("/workspaces/{workspace_id}/kb/documents", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.default_rate_limit)
async def sa_create_kb_document(
    request: Request,
    workspace_id: uuid.UUID,
    body: KBDocumentCreate,
    current: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Create a KB document. Uses superadmin user_id or first workspace owner."""
    from radd.knowledge import service
    from radd.knowledge.schemas import KBDocumentCreate as KBDocCreate

    async with get_db_session(workspace_id) as db:
        owner_result = await db.execute(
            select(User).where(User.workspace_id == workspace_id, User.role == "owner").limit(1)
        )
        owner = owner_result.scalar_one_or_none()
        user_id = owner.id if owner else current.user.id

        doc = await service.create_document(
            db, workspace_id, user_id,
            KBDocCreate(title=body.title, content=body.content, content_type=body.content_type, language=body.language),
        )
    return {"id": str(doc.id), "title": doc.title, "created": True}


@router.patch("/workspaces/{workspace_id}/kb/documents/{doc_id}")
@limiter.limit(settings.default_rate_limit)
async def sa_update_kb_document(
    request: Request,
    workspace_id: uuid.UUID,
    doc_id: uuid.UUID,
    body: KBDocumentUpdate,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Update a KB document."""
    from radd.knowledge import service
    from radd.knowledge.schemas import KBDocumentUpdate as KBDocUpdate

    async with get_db_session(workspace_id) as db:
        doc = await service.get_document(db, workspace_id, doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
        if updates:
            await service.update_document(db, doc, KBDocUpdate(**updates))
    return {"updated": True}


@router.delete("/workspaces/{workspace_id}/kb/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.default_rate_limit)
async def sa_delete_kb_document(
    request: Request,
    workspace_id: uuid.UUID,
    doc_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Soft-delete a KB document."""
    from radd.knowledge import service

    async with get_db_session(workspace_id) as db:
        doc = await service.get_document(db, workspace_id, doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        await service.soft_delete_document(db, doc)
    return None


# ─── Revenue ───────────────────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/revenue")
@limiter.limit(settings.default_rate_limit)
async def sa_list_revenue(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    days: int = Query(30, ge=1, le=365),
):
    """Get revenue attribution for a workspace."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(RevenueEvent)
            .where(
                RevenueEvent.workspace_id == workspace_id,
                RevenueEvent.created_at >= since,
            )
            .order_by(RevenueEvent.created_at.desc())
            .limit(100)
        )
        events = result.scalars().all()
    total = sum(float(e.amount_sar) for e in events)
    return {
        "total_attributed_sar": round(total, 2),
        "events_count": len(events),
        "events": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "amount_sar": float(e.amount_sar),
                "order_id": e.order_id,
                "created_at": e.created_at.isoformat() if e.created_at else "",
            }
            for e in events
        ],
    }


# ─── Escalations ──────────────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/escalations")
@limiter.limit(settings.default_rate_limit)
async def sa_list_escalations(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    status_filter: str = Query("pending", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List escalations for a workspace."""
    async with get_db_session(workspace_id) as db:
        q = (
            select(EscalationEvent)
            .where(
                EscalationEvent.workspace_id == workspace_id,
                EscalationEvent.status == status_filter,
            )
            .order_by(EscalationEvent.created_at.asc())
        )
        total_result = await db.execute(select(func.count()).select_from(q.subquery()))
        total = total_result.scalar_one()
        items_result = await db.execute(q.offset((page - 1) * page_size).limit(page_size))
        items = items_result.scalars().all()
    return {
        "items": [
            {
                "id": str(e.id),
                "conversation_id": str(e.conversation_id),
                "status": e.status,
                "reason": e.reason,
                "created_at": e.created_at.isoformat() if e.created_at else "",
            }
            for e in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


class EscalationResolveBody(BaseModel):
    notes: str | None = None


@router.post("/workspaces/{workspace_id}/escalations/{escalation_id}/accept")
@limiter.limit(settings.default_rate_limit)
async def sa_accept_escalation(
    request: Request,
    workspace_id: uuid.UUID,
    escalation_id: uuid.UUID,
    current: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Accept an escalation. Uses first workspace owner as assignee if superadmin not in workspace."""
    from radd.escalation import service

    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(EscalationEvent).where(
                EscalationEvent.id == escalation_id,
                EscalationEvent.workspace_id == workspace_id,
            )
        )
        event = result.scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Escalation not found")
        if event.status != "pending":
            raise HTTPException(status_code=400, detail=f"Escalation already {event.status}")

        owner_result = await db.execute(
            select(User).where(User.workspace_id == workspace_id, User.role == "owner").limit(1)
        )
        owner = owner_result.scalar_one_or_none()
        agent_id = owner.id if owner else current.user.id

        event = await service.accept_escalation(db, event, agent_id, workspace_id)
    return {"id": str(event.id), "status": event.status}


@router.post("/workspaces/{workspace_id}/escalations/{escalation_id}/resolve")
@limiter.limit(settings.default_rate_limit)
async def sa_resolve_escalation(
    request: Request,
    workspace_id: uuid.UUID,
    escalation_id: uuid.UUID,
    body: EscalationResolveBody,
    current: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Resolve an escalation."""
    from radd.escalation import service

    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(EscalationEvent).where(
                EscalationEvent.id == escalation_id,
                EscalationEvent.workspace_id == workspace_id,
            )
        )
        event = result.scalar_one_or_none()
        if not event:
            raise HTTPException(status_code=404, detail="Escalation not found")
        if event.status not in ("pending", "accepted"):
            raise HTTPException(status_code=400, detail=f"Cannot resolve escalation with status {event.status}")

        owner_result = await db.execute(
            select(User).where(User.workspace_id == workspace_id, User.role == "owner").limit(1)
        )
        owner = owner_result.scalar_one_or_none()
        agent_id = owner.id if owner else current.user.id

        event = await service.resolve_escalation(db, event, agent_id, workspace_id, notes=body.notes)
    return {"id": str(event.id), "status": event.status}


# ─── COD Shield ────────────────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/cod-shield")
@limiter.limit(settings.default_rate_limit)
async def sa_cod_shield(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    days: int = Query(7, ge=1, le=90),
):
    """Get COD Shield summary for a workspace."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            select(OutboundCall)
            .where(OutboundCall.workspace_id == workspace_id, OutboundCall.created_at >= since)
            .order_by(OutboundCall.created_at.desc())
            .limit(100)
        )
        calls = result.scalars().all()
    total = len(calls)
    confirmed = sum(1 for c in calls if c.status == "confirmed")
    cancelled = sum(1 for c in calls if c.status == "cancelled")
    no_answer = sum(1 for c in calls if c.status == "no_answer")
    pending = sum(1 for c in calls if c.status in ("pending", "calling"))
    answered = confirmed + cancelled
    rate = (confirmed / answered * 100) if answered > 0 else 0.0
    return {
        "stats": {
            "total_calls": total,
            "confirmed": confirmed,
            "cancelled": cancelled,
            "no_answer": no_answer,
            "pending": pending,
            "confirmation_rate": round(rate, 1),
        },
        "calls": [
            {
                "id": str(c.id),
                "order_id": c.order_id,
                "status": c.status,
                "created_at": c.created_at.isoformat() if c.created_at else "",
            }
            for c in calls[:20]
        ],
    }


# ─── Developer API Keys ───────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/api-keys")
@limiter.limit(settings.default_rate_limit)
async def sa_list_api_keys(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """List API keys for a workspace (read-only)."""
    from sqlalchemy import text
    async with get_db_session(workspace_id) as db:
        result = await db.execute(
            text("""
                SELECT id, name, key_prefix, scopes, created_at, expires_at, is_active
                FROM developer_api_keys
                WHERE workspace_id = :wid AND is_active = true
                ORDER BY created_at DESC
            """),
            {"wid": str(workspace_id)},
        )
        rows = result.fetchall()
    return {
        "keys": [
            {
                "id": str(r.id),
                "name": r.name,
                "key_prefix": r.key_prefix,
                "scopes": r.scopes,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            }
            for r in rows
        ],
        "total": len(rows),
    }


# ─── Conversations ────────────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/conversations")
@limiter.limit(settings.default_rate_limit)
async def sa_list_conversations(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
):
    """List conversations for a workspace."""
    async with get_db_session(workspace_id) as db:
        q = select(Conversation).where(Conversation.workspace_id == workspace_id)
        if status_filter:
            q = q.where(Conversation.status == status_filter)
        total_result = await db.execute(select(func.count()).select_from(q.subquery()))
        total = total_result.scalar_one()
        q = q.order_by(Conversation.last_message_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(q)
        conversations = result.scalars().all()
    return {
        "items": [
            {
                "id": str(c.id),
                "intent": c.intent,
                "status": c.status,
                "resolution_type": c.resolution_type,
                "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
            }
            for c in conversations
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ─── Customers ────────────────────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/customers")
@limiter.limit(settings.default_rate_limit)
async def sa_list_customers(
    request: Request,
    workspace_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List customers for a workspace."""
    async with get_db_session(workspace_id) as db:
        q = select(Customer).where(Customer.workspace_id == workspace_id)
        total_result = await db.execute(select(func.count()).select_from(q.subquery()))
        total = total_result.scalar_one()
        result = await db.execute(
            q.order_by(Customer.last_seen_at.desc().nullslast())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        customers = result.scalars().all()
    return {
        "items": [
            {
                "id": str(c.id),
                "customer_tier": c.customer_tier,
                "total_conversations": c.total_conversations,
                "total_escalations": c.total_escalations,
                "salla_total_orders": c.salla_total_orders,
                "last_seen_at": c.last_seen_at.isoformat() if c.last_seen_at else None,
            }
            for c in customers
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# ─── Promote User to Super Admin ──────────────────────────────────────────────

@router.post("/users/{user_id}/promote-superadmin", status_code=status.HTTP_204_NO_CONTENT)
async def promote_to_superadmin(
    user_id: uuid.UUID,
    _: Annotated[CurrentUser, Depends(require_superadmin)],
):
    """Promote a user to superadmin.
    Cannot demote yourself if you are the only superadmin."""
    from radd.db.models import User
    async with get_db_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_superadmin = True
    return None
