from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from radd.db.models import (
    Conversation,
    EscalationEvent,
    Message,
    Workspace,
)


async def get_platform_kpis(db: AsyncSession) -> dict:
    """Platform-wide KPIs — runs without RLS (no workspace_id set)."""
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)

    # Total workspaces
    total_ws = (await db.execute(select(func.count()).select_from(Workspace))).scalar_one()

    # Active workspaces
    active_ws = (
        await db.execute(select(func.count()).select_from(Workspace).where(Workspace.status == "active"))
    ).scalar_one()

    # Total messages today (all workspaces)
    total_msg_today = (
        await db.execute(
            select(func.count()).select_from(Message).where(Message.created_at >= today_start)
        )
    ).scalar_one()

    # Total messages this week
    total_msg_week = (
        await db.execute(
            select(func.count()).select_from(Message).where(Message.created_at >= week_start)
        )
    ).scalar_one()

    # Platform automation rate (non-escalated / total resolved conversations last 7 days)
    total_resolved = (
        await db.execute(
            select(func.count())
            .select_from(Conversation)
            .where(
                Conversation.status == "resolved",
                Conversation.resolved_at >= week_start,
            )
        )
    ).scalar_one()

    auto_resolved = (
        await db.execute(
            select(func.count())
            .select_from(Conversation)
            .where(
                Conversation.status == "resolved",
                Conversation.resolved_at >= week_start,
                Conversation.resolution_type.in_(["auto_template", "auto_rag"]),
            )
        )
    ).scalar_one()

    automation_rate = round(auto_resolved / total_resolved, 4) if total_resolved > 0 else 0.0

    # Active conversations (all workspaces)
    active_convs = (
        await db.execute(
            select(func.count())
            .select_from(Conversation)
            .where(Conversation.status == "active")
        )
    ).scalar_one()

    # Pending escalations (all workspaces)
    pending_esc = (
        await db.execute(
            select(func.count())
            .select_from(EscalationEvent)
            .where(EscalationEvent.status == "pending")
        )
    ).scalar_one()

    # Top 5 workspaces by messages today
    top_ws_result = await db.execute(
        text("""
            SELECT w.id, w.name, w.slug, w.plan, w.status,
                   COUNT(m.id) as msg_count
            FROM workspaces w
            LEFT JOIN messages m ON m.workspace_id = w.id
                AND m.created_at >= :today_start
            GROUP BY w.id, w.name, w.slug, w.plan, w.status
            ORDER BY msg_count DESC
            LIMIT 5
        """),
        {"today_start": today_start},
    )
    top_workspaces = [
        {
            "id": str(row.id),
            "name": row.name,
            "slug": row.slug,
            "plan": row.plan,
            "status": row.status,
            "messages_today": row.msg_count,
        }
        for row in top_ws_result.fetchall()
    ]

    return {
        "total_workspaces": total_ws,
        "active_workspaces": active_ws,
        "total_messages_today": total_msg_today,
        "total_messages_week": total_msg_week,
        "platform_automation_rate": automation_rate,
        "total_active_conversations": active_convs,
        "total_pending_escalations": pending_esc,
        "top_workspaces": top_workspaces,
        "computed_at": now.isoformat(),
    }


async def get_workspace_detail_stats(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Per-workspace stats for the detail page (no RLS needed — superadmin)."""
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    msg_total = (
        await db.execute(
            select(func.count())
            .select_from(Message)
            .where(Message.workspace_id == workspace_id)
        )
    ).scalar_one()

    conv_count = (
        await db.execute(
            select(func.count())
            .select_from(Conversation)
            .where(Conversation.workspace_id == workspace_id)
        )
    ).scalar_one()

    pending_esc = (
        await db.execute(
            select(func.count())
            .select_from(EscalationEvent)
            .where(
                EscalationEvent.workspace_id == workspace_id,
                EscalationEvent.status == "pending",
            )
        )
    ).scalar_one()

    return {
        "message_count_total": msg_total,
        "conversation_count": conv_count,
        "pending_escalations": pending_esc,
    }
