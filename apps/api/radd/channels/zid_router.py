from __future__ import annotations
"""Zid Order Webhook Router."""
import hashlib
import hmac
import json

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response, status
from radd.limiter import limiter
from radd.config import settings

import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/webhooks/zid", tags=["zid"])


@router.post("", status_code=status.HTTP_200_OK)
@limiter.limit(settings.default_rate_limit)
async def receive_zid_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive Zid order webhooks for revenue attribution."""
    body_bytes = await request.body()

    try:
        payload = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = payload.get("event", payload.get("type", ""))
    if not event_type:
        return {"status": "ok"}

    background_tasks.add_task(_process_zid_webhook, event_type, payload)
    return {"status": "ok"}


async def _process_zid_webhook(event_type: str, payload: dict) -> None:
    from radd.db.session import get_db_session
    from radd.db.models import Channel
    from sqlalchemy import select

    # Find workspace by Zid store_id in channel config
    order_data = payload.get("order", payload.get("data", {}))
    store_id = str(payload.get("store_id", payload.get("merchant_id", "")))

    async with get_db_session() as db:
        result = await db.execute(
            select(Channel).where(
                Channel.type == "zid",
                Channel.is_active.is_(True),
            )
        )
        channels = result.scalars().all()
        workspace_id = None
        for ch in channels:
            cfg = ch.config or {}
            if cfg.get("store_id") == store_id or not store_id:
                workspace_id = str(ch.workspace_id)
                break

    if not workspace_id:
        logger.warning("zid.webhook_unknown_store", store_id=store_id)
        return

    async with get_db_session() as db:
        from radd.onboarding.zid_sync import handle_zid_order_webhook
        await handle_zid_order_webhook(event_type, order_data, workspace_id, db)
