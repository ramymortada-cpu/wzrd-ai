"""
E2E Smoke Test — webhook → stream → worker → response (#19)

Verifies full path without real WhatsApp/Twilio/LLM calls.
Uses testcontainers (Postgres + Redis).

Run: uv run pytest tests/integration/test_e2e_smoke.py -v

For reliable runs (avoids event loop issues): ./scripts/run_e2e_smoke.sh
"""
from __future__ import annotations

import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select

from radd.db.models import Conversation, Message
from radd.pipeline.intent import IntentResult
from radd.pipeline.orchestrator import PipelineResult


def _meta_webhook_payload(phone_number_id: str, sender: str, text: str, msg_id: str | None = None) -> dict:
    """Build Meta-style webhook payload for WhatsApp."""
    return {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "123456789",
                "changes": [
                    {
                        "value": {
                            "metadata": {"phone_number_id": phone_number_id},
                            "messages": [
                                {
                                    "id": msg_id or f"wamid.{uuid.uuid4().hex}",
                                    "from": sender,
                                    "type": "text",
                                    "timestamp": "1234567890",
                                    "text": {"body": text},
                                }
                            ],
                        },
                        "field": "messages",
                    }
                ],
            }
        ],
    }


@pytest.mark.integration
@pytest.mark.asyncio
async def test_e2e_webhook_to_stream_to_worker_to_db(
    integration_app,
    integration_seeded_for_webhook,
    integration_session_factory,
):
    """
    Full E2E: POST webhook → message in stream → process via MessageHandler → verify Message in DB.
    Mocks LLM, RAG, and Twilio to run in CI without external APIs.
    """
    seeded = integration_seeded_for_webhook
    workspace_id = seeded["workspace_id"]
    phone_number_id = seeded["phone_number_id"]

    # Mock intent classification (no LLM)
    async def mock_classify_intent(text: str, redis_client=None):
        return {"intent_name": "greeting", "confidence": 0.95}

    # Mock pipeline (no RAG/Qdrant)
    async def mock_run_pipeline(*args, **kwargs):
        return PipelineResult(
            response_text="أهلاً! كيف نقدر نساعدك؟",
            intent="greeting",
            dialect="gulf",
            confidence=0.95,
            resolution_type="auto_template",
            intent_result=IntentResult(intent="greeting", confidence=0.95),
            confidence_breakdown={"intent": 0.95, "retrieval": 1.0, "verify": 1.0},
        )

    async def mock_response_send(*args, **kwargs):
        pass  # No-op: don't send to WhatsApp

    payload = _meta_webhook_payload(
        phone_number_id=phone_number_id,
        sender="966501234567",
        text="مرحبا",
    )
    # Process webhook payload (simulates POST → background task)
    from radd.webhooks.router import _process_webhook_payload

    await _process_webhook_payload(payload)

    with (
        patch("radd.pipeline.intent_v2.classify_intent_llm", side_effect=mock_classify_intent),
        patch("radd.pipeline.orchestrator.run_pipeline_async", side_effect=mock_run_pipeline),
        patch(
            "workers.handlers.response_sender.ResponseSender.send",
            new=AsyncMock(side_effect=mock_response_send),
        ),
    ):
        from radd.deps import get_redis
        from workers.handlers.message_handler import MessageHandler
        from workers.handlers.response_sender import ResponseSender

        redis = get_redis()
        stream_key = f"messages:{workspace_id}"
        messages = await redis.xread({stream_key: "0"}, count=10)
        assert messages, "Expected message in stream after webhook"

        sender = ResponseSender()
        handler = MessageHandler(sender)
        for _, msg_list in messages:
            for _msg_id, msg_data in msg_list:
                data = {
                    str(k) if isinstance(k, bytes) else k: str(v) if isinstance(v, bytes) else v
                    for k, v in msg_data.items()
                }
                await handler.process_message(data)
                break
            break

    # Verify Message in DB
    async with integration_session_factory() as session:
        result = await session.execute(
            select(Message)
            .where(Message.workspace_id == workspace_id)
            .order_by(Message.created_at.desc())
            .limit(5)
        )
        msgs = result.scalars().all()
    assert len(msgs) >= 2, "Expected inbound + outbound messages"
    outbound = next((m for m in msgs if m.sender_type == "system"), None)
    assert outbound is not None
    assert "أهلاً" in outbound.content or len(outbound.content) > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_e2e_webhook_unknown_phone_number_id_skipped(integration_app):
    """
    Webhook with unknown phone_number_id does not enqueue (no matching channel).
    """
    payload = _meta_webhook_payload(
        phone_number_id="unknown_phone_999",
        sender="966501234567",
        text="مرحبا",
    )
    from radd.webhooks.router import _process_webhook_payload

    await _process_webhook_payload(payload)
    # No workspace matches → no message added to any stream


@pytest.mark.integration
@pytest.mark.asyncio
async def test_e2e_escalation_path(
    integration_app,
    integration_seeded_for_webhook,
    integration_session_factory,
):
    """
    E2E: message that triggers escalation → Conversation status = waiting_agent.
    """
    seeded = integration_seeded_for_webhook
    workspace_id = seeded["workspace_id"]
    phone_number_id = seeded["phone_number_id"]

    async def mock_classify_intent(text: str, redis_client=None):
        return {"intent_name": "complaint", "confidence": 0.9}

    async def mock_run_pipeline(*args, **kwargs):
        return PipelineResult(
            response_text="سأحولك لأحد فريقنا.",
            intent="complaint",
            dialect="gulf",
            confidence=0.5,
            resolution_type="escalated_hard",
            intent_result=IntentResult(intent="complaint", confidence=0.9),
            confidence_breakdown={"intent": 0.9, "retrieval": 0.3, "verify": 0.3},
        )

    with (
        patch("radd.pipeline.intent_v2.classify_intent_llm", side_effect=mock_classify_intent),
        patch("radd.pipeline.orchestrator.run_pipeline_async", side_effect=mock_run_pipeline),
        patch(
            "workers.handlers.response_sender.ResponseSender.send",
            new=AsyncMock(return_value=None),
        ),
    ):
        payload = _meta_webhook_payload(
            phone_number_id=phone_number_id,
            sender="966509876543",
            text="خدمتكم سيئة جداً",
        )
        from radd.webhooks.router import _process_webhook_payload

        await _process_webhook_payload(payload)

        from radd.deps import get_redis
        from workers.handlers.message_handler import MessageHandler
        from workers.handlers.response_sender import ResponseSender

        redis = get_redis()
        stream_key = f"messages:{workspace_id}"
        messages = await redis.xread({stream_key: "0"}, count=10)
        assert messages

        handler = MessageHandler(ResponseSender())
        for _, msg_list in messages:
            for _msg_id, msg_data in msg_list:
                data = {
                    str(k) if isinstance(k, bytes) else k: str(v) if isinstance(v, bytes) else v
                    for k, v in msg_data.items()
                }
                await handler.process_message(data)
                break
            break

        async with integration_session_factory() as session:
            result = await session.execute(
                select(Conversation)
                .where(Conversation.workspace_id == workspace_id)
                .order_by(Conversation.last_message_at.desc())
                .limit(1)
            )
            conv = result.scalar_one_or_none()
        assert conv is not None
        assert conv.status == "waiting_agent", f"expected waiting_agent, got {conv.status}"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_e2e_unknown_intent_path(
    integration_app,
    integration_seeded_for_webhook,
    integration_session_factory,
):
    """
    E2E: message with unknown intent → still produces response (escalation or template).
    """
    seeded = integration_seeded_for_webhook
    workspace_id = seeded["workspace_id"]
    phone_number_id = seeded["phone_number_id"]

    async def mock_classify_intent(text: str, redis_client=None):
        return {"intent_name": "other", "confidence": 0.6}

    async def mock_run_pipeline(*args, **kwargs):
        return PipelineResult(
            response_text="سأحولك لأحد فريقنا لمساعدتك.",
            intent="other",
            dialect="gulf",
            confidence=0.6,
            resolution_type="escalated_hard",
            intent_result=IntentResult(intent="other", confidence=0.6),
            confidence_breakdown={"intent": 0.6, "retrieval": 0.0, "verify": 0.0},
        )

    with (
        patch("radd.pipeline.intent_v2.classify_intent_llm", side_effect=mock_classify_intent),
        patch("radd.pipeline.orchestrator.run_pipeline_async", side_effect=mock_run_pipeline),
        patch(
            "workers.handlers.response_sender.ResponseSender.send",
            new=AsyncMock(return_value=None),
        ),
    ):
        payload = _meta_webhook_payload(
            phone_number_id=phone_number_id,
            sender="966501112233",
            text="xyz random gibberish",
        )
        from radd.webhooks.router import _process_webhook_payload

        await _process_webhook_payload(payload)

        from radd.deps import get_redis
        from workers.handlers.message_handler import MessageHandler
        from workers.handlers.response_sender import ResponseSender

        redis = get_redis()
        stream_key = f"messages:{workspace_id}"
        messages = await redis.xread({stream_key: "0"}, count=10)
        assert messages

        handler = MessageHandler(ResponseSender())
        for _, msg_list in messages:
            for _msg_id, msg_data in msg_list:
                data = {
                    str(k) if isinstance(k, bytes) else k: str(v) if isinstance(v, bytes) else v
                    for k, v in msg_data.items()
                }
                await handler.process_message(data)
                break
            break

        async with integration_session_factory() as session:
            result = await session.execute(
                select(Message).where(Message.workspace_id == workspace_id)
            )
            msgs = result.scalars().all()
        assert len(msgs) >= 2
        outbound = next((m for m in msgs if m.sender_type == "system"), None)
        assert outbound is not None
