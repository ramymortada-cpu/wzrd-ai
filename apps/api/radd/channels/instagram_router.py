from __future__ import annotations
"""Instagram DM Webhook Router."""
import hashlib
import hmac
import json

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response, status
from radd.limiter import limiter
from radd.config import settings
from radd.deps import get_redis

import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/webhooks/instagram", tags=["instagram"])

DEDUP_TTL_SECONDS = 300


@router.get("")
@limiter.limit(settings.auth_rate_limit)
async def verify_instagram_webhook(request: Request):
    """Meta webhook verification for Instagram."""
    params = dict(request.query_params)
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    # Reuse the same verify token as WhatsApp
    if mode == "subscribe" and token == settings.meta_verify_token:
        logger.info("instagram.webhook_verified")
        return Response(content=challenge, media_type="text/plain")

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")


@router.post("", status_code=status.HTTP_200_OK)
@limiter.limit(settings.default_rate_limit)
async def receive_instagram_message(request: Request, background_tasks: BackgroundTasks):
    """Receive Instagram DM via Meta webhook."""
    body_bytes = await request.body()

    # HMAC verification (same app secret as WhatsApp)
    if settings.meta_app_secret:
        signature_header = request.headers.get("x-hub-signature-256", "")
        expected = "sha256=" + hmac.new(
            settings.meta_app_secret.encode(),
            body_bytes,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature_header, expected):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    try:
        payload = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    # Must be instagram object type
    if payload.get("object") != "instagram":
        return {"status": "ok"}

    background_tasks.add_task(_process_instagram_payload, payload)
    return {"status": "ok"}


async def _process_instagram_payload(payload: dict) -> None:
    from radd.channels.instagram import parse_instagram_webhook, resolve_workspace_by_page_id
    from radd.db.session import get_db_session

    r = get_redis()
    messages = parse_instagram_webhook(payload)

    for msg in messages:
        msg_id = msg["message_id"]
        page_id = msg["page_id"]
        sender_id = msg["sender_id"]

        # Deduplicate
        dedup_key = f"dedup:ig:{msg_id}"
        already_seen = await r.set(dedup_key, "1", nx=True, ex=DEDUP_TTL_SECONDS)
        if not already_seen:
            continue

        # Resolve workspace
        async with get_db_session() as db:
            workspace_id = await resolve_workspace_by_page_id(page_id, db)

        if not workspace_id:
            logger.warning("instagram.unknown_page_id", page_id=page_id)
            continue

        # Enqueue to Redis Stream (same format as WhatsApp)
        stream_key = f"messages:{workspace_id}"
        await r.xadd(stream_key, {
            "message_id": msg_id,
            "sender_phone": sender_id,    # Instagram uses sender_id (not phone)
            "text": msg["text"],
            "phone_number_id": page_id,   # Reuse field for page_id
            "workspace_id": str(workspace_id),
            "timestamp": msg["timestamp"],
            "message_type": msg.get("attachment_type") or "text",
            "media_id": "",
            "platform": "instagram",
        })
        logger.info("instagram.message_enqueued", workspace_id=str(workspace_id))
