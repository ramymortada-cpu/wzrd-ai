"""Admin customers endpoints."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select, func

from radd.auth.middleware import CurrentUser, require_reviewer
from radd.config import settings
from radd.db.models import Customer
from radd.db.session import get_db_session
from radd.limiter import limiter

router = APIRouter(tags=["admin-customers"])


@router.get("/customers")
@limiter.limit(settings.default_rate_limit)
async def list_customers(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    tier: Optional[str] = Query(None, description="Filter by tier: new, standard, returning, vip, at_risk"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List customers with their profiles — for the Merchant Memory dashboard."""
    async with get_db_session(current.workspace_id) as db:
        q = select(Customer).where(Customer.workspace_id == current.workspace_id)
        if tier:
            q = q.where(Customer.customer_tier == tier)

        total_result = await db.execute(select(func.count()).select_from(q.subquery()))
        total = total_result.scalar_one()

        q = q.order_by(Customer.total_conversations.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(q)
        customers = result.scalars().all()

    return {
        "items": [
            {
                "id": str(c.id),
                "display_name": c.display_name,
                "phone_hash": c.phone_hash,
                "customer_tier": c.customer_tier,
                "total_conversations": c.total_conversations,
                "total_escalations": c.total_escalations,
                "avg_sentiment": float(c.avg_sentiment) if c.avg_sentiment is not None else None,
                "salla_total_orders": c.salla_total_orders,
                "salla_total_revenue": float(c.salla_total_revenue) if c.salla_total_revenue else 0,
                "last_seen_at": c.last_seen_at.isoformat() if c.last_seen_at else None,
                "last_complaint_at": c.last_complaint_at.isoformat() if c.last_complaint_at else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in customers
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
