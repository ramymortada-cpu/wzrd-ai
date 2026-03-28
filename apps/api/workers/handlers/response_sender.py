"""
ResponseSender — إرسال الرد عبر WhatsApp/Instagram.

معالجة guardrails، تنبيه التصعيد، جدولة follow-up، وإرسال الرسالة النهائية.
"""
from __future__ import annotations

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from radd.config import settings
from radd.db.models import Channel, Conversation, Customer, Message

logger = structlog.get_logger()


class ResponseSender:
    """إرسال الرد النهائي عبر WhatsApp مع guardrails و follow-up."""

    async def send(
        self,
        workspace_id,
        sender_phone: str,
        text_body: str,
        pipeline_result,
        prevention_response: str | None,
        dialect,
        channel: Channel,
        new_stage,
        db: AsyncSession,
        conversation: Conversation,
        customer: Customer,
        escalation_event,
    ) -> None:
        """Broadcast escalation, apply guardrails, schedule follow-up, send response."""
        if escalation_event is not None:
            try:
                from radd.websocket.manager import ws_manager
                context = escalation_event.context_package or {}
                await ws_manager.broadcast_to_workspace(
                    str(workspace_id),
                    {
                        "type": "escalation.new",
                        "escalation_id": str(escalation_event.id),
                        "escalation_type": escalation_event.escalation_type,
                        "reason": escalation_event.reason,
                        "conversation_id": str(escalation_event.conversation_id),
                        "summary": context.get("summary", ""),
                        "confidence": float(escalation_event.confidence_at_escalation or 0),
                        "rag_draft": escalation_event.rag_draft,
                    },
                )
            except Exception as e:
                logger.warning("worker.ws_notify_failed", error=str(e))

        from radd.pipeline.guardrails import apply_guardrails
        guard = apply_guardrails(
            inbound_message=text_body,
            outbound_response=pipeline_result.response_text,
        )
        if guard.injection_detected:
            logger.warning("worker.injection_detected", workspace_id=str(workspace_id))
            final_response = "سأحولك لأحد فريقنا لمساعدتك."
        else:
            final_response = guard.redacted_text

        should_schedule_followup = (
            new_stage.value in ("consideration", "objection", "inquiry")
            if hasattr(new_stage, "value") else False
        )
        if should_schedule_followup and not pipeline_result.resolution_type.startswith("escalated"):
            try:
                from radd.followups.scheduler import schedule_abandoned_sale_followup
                await schedule_abandoned_sale_followup(
                    db_session=db,
                    workspace_id=str(workspace_id),
                    conversation_id=str(conversation.id),
                    customer_id=str(customer.id),
                    product_name="",
                    delay_minutes=120,
                )
                logger.info("worker.followup_scheduled", stage=str(new_stage))
            except Exception as e:
                logger.warning("worker.followup_schedule_failed", error=str(e))

        await self._send_final_response(
            sender_phone, final_response, channel, dialect, text_body,
            pipeline_result, prevention_response, workspace_id,
        )

    async def _send_final_response(
        self,
        sender_phone: str,
        final_response: str,
        channel: Channel,
        dialect,
        text_body: str,
        pipeline_result,
        prevention_response: str | None,
        workspace_id,
    ) -> None:
        """Send via WhatsApp or log in shadow mode."""
        from radd.utils.crypto import get_channel_config_decrypted
        from radd.whatsapp.client import send_text_message

        channel_config = get_channel_config_decrypted(channel)
        wa_phone_number_id = channel_config.get("wa_phone_number_id") or settings.wa_phone_number_id
        wa_token = settings.wa_api_token

        if settings.shadow_mode:
            logger.info(
                "worker.shadow_mode.suppressed",
                workspace_id=str(workspace_id),
                phone=sender_phone,
                response_preview=final_response[:120],
                resolution_type=pipeline_result.resolution_type,
                confidence=round(pipeline_result.confidence, 3),
            )
        else:
            try:
                if prevention_response and pipeline_result.resolution_type != "escalated_hard":
                    from radd.returns.prevention import detect_return_reason
                    from radd.whatsapp.interactive import (
                        build_return_prevention_message,
                        send_interactive_message,
                    )
                    return_reason = detect_return_reason(text_body)
                    interactive_payload = build_return_prevention_message(
                        reason=str(return_reason),
                        dialect=dialect.dialect if hasattr(dialect, "dialect") else "gulf",
                    )
                    sent = await send_interactive_message(
                        phone_number=sender_phone,
                        message_payload=interactive_payload,
                        phone_number_id=wa_phone_number_id,
                        api_token=wa_token,
                    )
                    if not sent:
                        await send_text_message(
                            phone_number=sender_phone,
                            message=final_response,
                            phone_number_id=wa_phone_number_id,
                            api_token=wa_token,
                        )
                else:
                    await send_text_message(
                        phone_number=sender_phone,
                        message=final_response,
                        phone_number_id=wa_phone_number_id,
                        api_token=wa_token,
                    )
            except Exception as e:
                logger.error("worker.send_failed", error=str(e), phone=sender_phone)
