from __future__ import annotations

"""
RADD AI — Instagram DM Support
Handles Instagram Direct Messages via Meta Webhooks.
Instagram uses the same Meta platform API as WhatsApp but different endpoints.
"""
import uuid

import httpx
import structlog

logger = structlog.get_logger()

IG_API_BASE = "https://graph.facebook.com/v20.0"


# ─── Webhook Parsing ──────────────────────────────────────────────────────────

def parse_instagram_webhook(payload: dict) -> list[dict]:
    """
    Parse Instagram webhook payload into normalized message dicts.
    Returns list of messages with sender_id, text, message_id, page_id.
    """
    messages = []

    for entry in payload.get("entry", []):
        # Instagram uses "messaging" not "messages"
        for event in entry.get("messaging", []):
            sender = event.get("sender", {}).get("id", "")
            recipient = event.get("recipient", {}).get("id", "")  # Page/IG account ID
            timestamp = event.get("timestamp", "")

            message = event.get("message", {})
            if not message:
                continue

            msg_id = message.get("mid", "")
            text = message.get("text", "")

            # Handle attachments (images, audio)
            attachments = message.get("attachments", [])
            attachment_type = ""
            attachment_url = ""
            if attachments:
                att = attachments[0]
                attachment_type = att.get("type", "")
                attachment_url = att.get("payload", {}).get("url", "")

            if not text and not attachments:
                continue

            messages.append({
                "platform": "instagram",
                "sender_id": sender,
                "page_id": recipient,
                "message_id": msg_id,
                "text": text or f"[{attachment_type}]",
                "timestamp": timestamp,
                "attachment_type": attachment_type,
                "attachment_url": attachment_url,
            })

    return messages


# ─── Sending Messages ────────────────────────────────────────────────────────

async def send_instagram_message(
    recipient_id: str,
    text: str,
    page_access_token: str,
    page_id: str,
) -> bool:
    """Send a text message via Instagram DM."""
    url = f"{IG_API_BASE}/{page_id}/messages"
    headers = {
        "Authorization": f"Bearer {page_access_token}",
        "Content-Type": "application/json",
    }
    body = {
        "recipient": {"id": recipient_id},
        "message": {"text": text[:1000]},  # IG limit
        "messaging_type": "RESPONSE",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            logger.info("instagram.message_sent", recipient=recipient_id[:8] + "***")
            return True
        except Exception as e:
            logger.error("instagram.send_failed", error=str(e))
            return False


async def send_instagram_quick_replies(
    recipient_id: str,
    text: str,
    quick_replies: list[str],
    page_access_token: str,
    page_id: str,
) -> bool:
    """Send a message with quick reply buttons on Instagram."""
    url = f"{IG_API_BASE}/{page_id}/messages"
    headers = {
        "Authorization": f"Bearer {page_access_token}",
        "Content-Type": "application/json",
    }
    body = {
        "recipient": {"id": recipient_id},
        "message": {
            "text": text,
            "quick_replies": [
                {"content_type": "text", "title": r[:20], "payload": r}
                for r in quick_replies[:3]  # IG limit
            ],
        },
        "messaging_type": "RESPONSE",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            return True
        except Exception as e:
            logger.error("instagram.quick_reply_failed", error=str(e))
            return False


# ─── Channel Resolution ───────────────────────────────────────────────────────

async def resolve_workspace_by_page_id(
    page_id: str,
    db_session,
) -> uuid.UUID | None:
    """Find workspace by Instagram Page ID in channel config."""
    from sqlalchemy import select

    from radd.db.models import Channel

    result = await db_session.execute(
        select(Channel).where(
            Channel.type == "instagram",
            Channel.is_active.is_(True),
        )
    )
    channels = result.scalars().all()

    for channel in channels:
        config = channel.config or {}
        if config.get("ig_page_id") == page_id:
            return channel.workspace_id

    return None
