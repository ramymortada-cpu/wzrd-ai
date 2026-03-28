"""
MessageHandler — معالجة رسالة واحدة (intent → RAG → rules → response).

يتولى: media handling، NLP، rules، orchestrator، تخزين النتائج.
يستدعي ResponseSender لإرسال الرد.
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from radd.alerts import alert_manager
from radd.config import settings
from radd.customers.context_builder import build_customer_context
from radd.customers.profile_updater import update_profile
from radd.db.models import (
    AuditLog,
    Channel,
    Conversation,
    Customer,
    Message,
    Workspace,
)
from radd.db.models import SmartRule as SmartRuleModel
from radd.db.session import get_db_session
from radd.deps import get_redis
from radd.personas.engine import PersonaType, build_persona_prompt, select_persona
from radd.pipeline.dialect import detect_dialect
from radd.pipeline.entity_extractor import entities_to_dict, extract_entities
from radd.pipeline.intent import IntentResult
from radd.pipeline.intent_v2 import classify_intent_llm
from radd.pipeline.normalizer import normalize
from radd.pipeline.orchestrator import run_pipeline_async
from radd.returns.prevention import detect_return_reason, generate_prevention_response
from radd.rules.engine import (
    DEFAULT_RULES,
    ActionType,
    TriggerType,
    apply_rule_action,
    evaluate_rules,
)
from radd.rules.engine import SmartRule as SmartRuleObj
from radd.sales.engine import determine_stage

if TYPE_CHECKING:
    from workers.handlers.response_sender import ResponseSender

logger = structlog.get_logger()
SESSION_WINDOW_SECONDS = 1800  # 30 minutes


class MessageHandler:
    """معالجة رسالة واحدة من البداية للنهاية."""

    def __init__(self, response_sender: "ResponseSender"):
        self._response_sender = response_sender

    async def process_message(self, msg_data: dict) -> None:
        """المدخل الرئيسي — معالجة رسالة كاملة."""
        workspace_id = uuid.UUID(msg_data["workspace_id"])
        sender_phone = msg_data["sender_phone"]
        external_id = msg_data["message_id"]
        message_type = msg_data.get("message_type", "text")

        logger.info("worker.processing", workspace_id=str(workspace_id), external_id=external_id, type=message_type)

        text_body = await self._handle_media_messages(msg_data, workspace_id)
        if text_body is None:
            return

        async with get_db_session(workspace_id) as db:
            result = await db.execute(
                select(Channel).where(Channel.workspace_id == workspace_id, Channel.type == "whatsapp")
            )
            channel = result.scalar_one_or_none()
            if not channel:
                logger.error("worker.no_channel", workspace_id=str(workspace_id))
                return

            customer = await self._get_or_create_customer(db, workspace_id, sender_phone)
            conversation = await self._get_or_create_conversation(db, workspace_id, customer, channel.id)

            nlp = await self._run_nlp_pipeline(text_body, workspace_id)
            normalized_text = nlp["normalized"]
            dialect = nlp["dialect"]
            intent_result = nlp["intent_result"]
            entities = nlp["entities"]

            dialect_val = dialect.dialect if hasattr(dialect, "dialect") else str(dialect)
            inbound_msg = Message(
                workspace_id=workspace_id,
                conversation_id=conversation.id,
                sender_type="customer",
                content=text_body,
                content_normalized=normalized_text,
                external_id=external_id,
                metadata_={"entities": entities, "dialect": dialect_val, "intent": intent_result.intent},
            )
            db.add(inbound_msg)
            await db.flush()

            context = await self._build_context(db, workspace_id, customer, conversation)
            customer_ctx = context["customer_context"]
            history = context["history"]

            rules_result = await self._apply_smart_rules(
                db, workspace_id, intent_result, customer, conversation, text_body, dialect, customer_ctx
            )
            rule_instructions = rules_result["rule_instructions"]
            persona = rules_result["persona"]
            persona_system_prompt = rules_result["persona_system_prompt"]
            is_pre_purchase = rules_result["is_pre_purchase"]
            current_stage = rules_result["current_stage"]

            prevention_response = await self._handle_return_prevention(
                intent_result, rule_instructions, text_body, dialect
            )

            new_stage = determine_stage(
                intent=intent_result.intent,
                is_pre_purchase=is_pre_purchase,
                message_text=text_body,
                conversation_turn=conversation.message_count or 0,
                previous_stage=current_stage,
            )

            pipeline_result = await self._run_orchestrator(
                db, workspace_id, normalized_text, intent_result, dialect,
                customer_ctx, persona_system_prompt, history, rule_instructions,
            )

            if prevention_response and pipeline_result.resolution_type.startswith("escalated"):
                pipeline_result.response_text = prevention_response
                pipeline_result.resolution_type = "auto_rag"
                pipeline_result.confidence = 0.75

            escalation_event = await self._store_outbound_and_update(
                db, workspace_id, conversation, customer, inbound_msg,
                pipeline_result, text_body, persona, new_stage,
            )

            await self._response_sender.send(
                workspace_id, sender_phone, text_body, pipeline_result, prevention_response,
                dialect, channel, new_stage, db, conversation, customer, escalation_event,
            )

    async def _handle_media_messages(self, msg_data: dict, workspace_id: uuid.UUID) -> str | None:
        """Handle voice and image messages. Returns None if handled (skip), else text to process."""
        sender_phone = msg_data["sender_phone"]
        text_body = msg_data["text"]
        external_id = msg_data["message_id"]
        message_type = msg_data.get("message_type", "text")
        media_id = msg_data.get("media_id", "")

        if message_type == "voice" and media_id:
            voice_enabled = True
            try:
                async with get_db_session(workspace_id) as _db:
                    from radd.db.models import Workspace as WsModel
                    _ws = await _db.get(WsModel, workspace_id)
                    if _ws:
                        _cfg = _ws.settings or {}
                        voice_enabled = _cfg.get("voice_transcription_enabled", True)
            except Exception:
                pass

            if voice_enabled:
                from radd.workers.voice_handler import process_voice_message as _process_voice
                transcribed = await _process_voice(
                    workspace_id, sender_phone, external_id, media_id,
                    self._get_or_create_customer,
                    self._get_or_create_conversation,
                )
                if transcribed:
                    await self.process_message({
                        "workspace_id": str(workspace_id),
                        "sender_phone": sender_phone,
                        "text": transcribed,
                        "message_id": external_id,
                        "message_type": "text",
                        "media_id": "",
                    })
                return None
            text_body = "[رسالة صوتية — التفريغ موقوف]"

        if message_type == "image" and media_id:
            from radd.workers.vision_handler import process_image_message as _process_image
            await _process_image(
                workspace_id, sender_phone, external_id, media_id, text_body,
                self._get_or_create_customer,
                self._get_or_create_conversation,
            )
            return None

        return text_body

    async def _get_or_create_customer(self, db, workspace_id: uuid.UUID, phone: str) -> Customer:
        phone_hash = hashlib.sha256(phone.encode()).hexdigest()
        result = await db.execute(
            select(Customer).where(
                Customer.workspace_id == workspace_id,
                Customer.channel_identifier_hash == phone_hash,
            )
        )
        customer = result.scalar_one_or_none()
        if not customer:
            customer = Customer(
                workspace_id=workspace_id,
                channel_identifier_hash=phone_hash,
                channel_type="whatsapp",
            )
            db.add(customer)
            await db.flush()
        else:
            customer.last_seen_at = datetime.now(UTC)
        return customer

    async def _get_or_create_conversation(
        self, db, workspace_id: uuid.UUID, customer: Customer, channel_id: uuid.UUID
    ) -> Conversation:
        cutoff = datetime.now(UTC).timestamp() - SESSION_WINDOW_SECONDS
        result = await db.execute(
            select(Conversation).where(
                Conversation.workspace_id == workspace_id,
                Conversation.customer_id == customer.id,
                Conversation.status == "active",
                Conversation.last_message_at >= datetime.fromtimestamp(cutoff, tz=UTC),
            ).order_by(Conversation.last_message_at.desc()).limit(1)
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            conversation = Conversation(
                workspace_id=workspace_id,
                customer_id=customer.id,
                channel_id=channel_id,
                status="active",
                first_message_at=datetime.now(UTC),
                last_message_at=datetime.now(UTC),
            )
            db.add(conversation)
            await db.flush()
        return conversation

    async def _run_nlp_pipeline(self, text_body: str, workspace_id: uuid.UUID) -> dict:
        normalized_text = normalize(text_body)
        dialect = detect_dialect(normalized_text)
        intent_dict = await classify_intent_llm(normalized_text, redis_client=get_redis())
        intent_name = intent_dict["intent_name"]
        if intent_name == "shipping_inquiry":
            intent_name = "shipping"
        intent_result = IntentResult(
            intent=intent_name,
            confidence=intent_dict.get("confidence", 0.95),
        )
        raw_entities = extract_entities(normalized_text)
        entities = entities_to_dict(raw_entities)
        return {
            "normalized": normalized_text,
            "dialect": dialect,
            "intent_result": intent_result,
            "entities": entities,
        }

    async def _build_context(self, db, workspace_id: uuid.UUID, customer: Customer, conversation: Conversation) -> dict:
        customer_ctx = build_customer_context(customer)
        from radd.db.models import Message as MessageModel
        history_result = await db.execute(
            select(MessageModel)
            .where(MessageModel.conversation_id == conversation.id)
            .order_by(MessageModel.created_at.desc())
            .limit(6)
        )
        history = [
            {"sender_type": m.sender_type, "content": m.content}
            for m in reversed(history_result.scalars().all())
        ]
        return {"customer_context": customer_ctx, "history": history}

    async def _apply_smart_rules(
        self, db, workspace_id: uuid.UUID, intent_result: IntentResult,
        customer: Customer, conversation: Conversation, text_body: str,
        dialect, customer_ctx: str,
    ) -> dict:
        current_hour = datetime.now(UTC).hour
        current_stage = getattr(conversation, "stage", "unknown") or "unknown"
        customer_sentiment = float(customer.avg_sentiment or 0.5)

        rules_result = await db.execute(
            select(SmartRuleModel).where(
                SmartRuleModel.workspace_id == workspace_id,
                SmartRuleModel.is_active == True,
            ).order_by(SmartRuleModel.priority.desc())
        )
        db_rules = rules_result.scalars().all()

        if db_rules:
            smart_rules = [
                SmartRuleObj(
                    id=str(r.id), name=r.name, description=r.description or "",
                    trigger_type=TriggerType(r.triggers[0]["type"]) if r.triggers else TriggerType.INTENT,
                    trigger_value=r.triggers[0]["value"] if r.triggers else "",
                    action_type=ActionType(r.actions[0]["type"]) if r.actions else ActionType.USE_PERSONA,
                    action_value=r.actions[0]["value"] if r.actions else "",
                    is_active=r.is_active, priority=r.priority,
                )
                for r in db_rules
            ]
        else:
            smart_rules = DEFAULT_RULES

        rule_match = evaluate_rules(
            rules=smart_rules,
            intent=intent_result.intent,
            customer_tier=customer.customer_tier or "new",
            conversation_stage=current_stage,
            message_text=text_body,
            current_hour=current_hour,
            sentiment=customer_sentiment,
        )
        rule_instructions = apply_rule_action(rule_match)
        if rule_match.matched:
            logger.info("worker.rule_matched", rule=rule_match.rule.name if rule_match.rule else "unknown", action=str(rule_match.action_type))

        is_pre_purchase = intent_result.intent in {"product_inquiry", "product_comparison", "purchase_hesitation"}
        forced_persona_name = rule_instructions.get("force_persona")

        if forced_persona_name:
            persona_map = {"sales": PersonaType.SALES, "support": PersonaType.SUPPORT, "receptionist": PersonaType.RECEPTIONIST}
            from radd.personas.engine import PERSONAS
            persona = PERSONAS.get(persona_map.get(forced_persona_name, PersonaType.RECEPTIONIST))
        else:
            persona = select_persona(
                intent=intent_result.intent,
                is_pre_purchase=is_pre_purchase,
                conversation_turn=conversation.message_count or 0,
                customer_tier=customer.customer_tier or "new",
            )

        persona_system_prompt = build_persona_prompt(
            persona=persona,
            store_name="متجرنا",
            dialect=dialect.dialect if hasattr(dialect, "dialect") else str(dialect),
            customer_context=customer_ctx,
        )

        return {
            "rule_match": rule_match,
            "rule_instructions": rule_instructions,
            "persona": persona,
            "persona_system_prompt": persona_system_prompt,
            "is_pre_purchase": is_pre_purchase,
            "current_stage": current_stage,
        }

    async def _handle_return_prevention(
        self, intent_result: IntentResult, rule_instructions: dict, text_body: str, dialect
    ) -> str | None:
        if intent_result.intent != "return_policy" and not rule_instructions.get("try_return_prevention"):
            return None
        try:
            return_reason = detect_return_reason(text_body)
            prevention_result = generate_prevention_response(
                reason=return_reason,
                dialect=dialect.dialect if hasattr(dialect, "dialect") else "gulf",
            )
            if prevention_result.confidence >= 0.65:
                logger.info("worker.return_prevention_applied", reason=str(return_reason), confidence=prevention_result.confidence)
                return prevention_result.response_text
        except Exception as e:
            logger.warning("worker.return_prevention_failed", error=str(e))
        return None

    async def _run_orchestrator(
        self, db, workspace_id: uuid.UUID, normalized_text: str, intent_result: IntentResult,
        dialect, customer_ctx: str, persona_system_prompt: str, history: list, rule_instructions: dict,
    ):
        if rule_instructions.get("force_escalation"):
            from radd.pipeline.orchestrator import PipelineResult
            from radd.pipeline.templates import get_escalation_message
            dial_str = dialect.dialect if hasattr(dialect, "dialect") else "gulf"
            return PipelineResult(
                response_text=get_escalation_message(dial_str),
                intent=intent_result.intent, dialect=dial_str, confidence=0.0,
                resolution_type="escalated_hard", intent_result=intent_result,
                confidence_breakdown={"intent": intent_result.confidence, "retrieval": 0.0, "verify": 0.0},
            )
        override_threshold = rule_instructions.get("override_auto_threshold")
        ws_result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
        ws = ws_result.scalar_one_or_none()
        ws_settings = (ws.settings or {}) if ws else {}
        if ws_settings.get("automation_paused"):
            from radd.pipeline.orchestrator import PipelineResult
            from radd.pipeline.templates import get_escalation_message
            dial_str = dialect.dialect if hasattr(dialect, "dialect") else "gulf"
            logger.info("worker.automation_paused", workspace_id=str(workspace_id), reason="automation_paused")
            return PipelineResult(
                response_text=get_escalation_message(dial_str),
                intent=intent_result.intent, dialect=dial_str, confidence=0.0,
                resolution_type="escalated_hard", intent_result=intent_result,
                confidence_breakdown={"intent": intent_result.confidence, "retrieval": 0.0, "verify": 0.0},
                escalation_reason_override="automation_paused",
            )
        use_intent_v2 = ws_settings.get("use_intent_v2") if "use_intent_v2" in ws_settings else settings.use_intent_v2
        use_verifier_v2 = ws_settings.get("use_verifier_v2") if "use_verifier_v2" in ws_settings else settings.use_verifier_v2
        from radd.deps import get_qdrant
        qdrant = get_qdrant()
        return await run_pipeline_async(
            message=normalized_text,
            workspace_id=workspace_id, db=db, qdrant=qdrant,
            conversation_context={
                "store_name": ws_settings.get("store_name", "متجرنا"),
                "customer_context": customer_ctx,
                "dialect": dialect.dialect if hasattr(dialect, "dialect") else str(dialect),
                "intent": intent_result.intent,
                "persona_system_prompt": persona_system_prompt,
                "override_auto_threshold": override_threshold,
                "use_intent_v2": use_intent_v2,
                "use_verifier_v2": use_verifier_v2,
                "workspace_config": ws_settings,
            },
            conversation_history=history,
        )

    async def _store_outbound_and_update(
        self, db, workspace_id: uuid.UUID, conversation: Conversation, customer: Customer,
        inbound_msg: Message, pipeline_result, text_body: str, persona, new_stage,
    ):
        response_msg = Message(
            workspace_id=workspace_id,
            conversation_id=conversation.id,
            sender_type="system",
            content=pipeline_result.response_text,
            confidence={
                "intent": pipeline_result.confidence_breakdown.get("intent", 0),
                "retrieval": pipeline_result.confidence_breakdown.get("retrieval", 0),
                "verify": pipeline_result.confidence_breakdown.get("verify", 0),
            },
            source_passages=pipeline_result.source_passages or [],
        )
        db.add(response_msg)

        conversation.intent = pipeline_result.intent
        conversation.dialect = pipeline_result.dialect
        conversation.confidence_score = pipeline_result.confidence
        conversation.resolution_type = pipeline_result.resolution_type
        conversation.last_message_at = datetime.now(UTC)
        conversation.message_count = (conversation.message_count or 0) + 2
        conversation.stage = new_stage.value if hasattr(new_stage, "value") else str(new_stage)
        conversation.ai_persona = persona.type.value if persona else None

        if pipeline_result.resolution_type.startswith("escalated"):
            conversation.status = "waiting_agent"

        await db.flush()

        try:
            await update_profile(db=db, customer=customer, resolution_type=pipeline_result.resolution_type, message_text=text_body)
        except Exception as e:
            logger.warning("worker.profile_update_failed", error=str(e))

        db.add(AuditLog(
            workspace_id=workspace_id,
            action="message.processed",
            entity_type="conversation",
            entity_id=conversation.id,
            details={
                "intent": pipeline_result.intent,
                "dialect": pipeline_result.dialect,
                "resolution_type": pipeline_result.resolution_type,
                "confidence": pipeline_result.confidence,
            },
        ))

        escalation_event = None
        ESCALATION_QUEUE_LIMIT = 50
        if pipeline_result.resolution_type in ("escalated_hard", "escalated_soft"):
            from radd.escalation.service import create_escalation, get_pending_escalations_count
            reason_override = getattr(pipeline_result, "escalation_reason_override", None)
            escalation_event = await create_escalation(
                db=db, workspace_id=workspace_id, conversation=conversation, customer=customer,
                pipeline_result=pipeline_result, trigger_message_id=inbound_msg.id, reason_override=reason_override,
            )
            try:
                pending_count = await get_pending_escalations_count(db, workspace_id)
                if pending_count > ESCALATION_QUEUE_LIMIT:
                    await alert_manager.warning(
                        event="escalation_queue_overflow",
                        message=f"Escalation queue has {pending_count} pending items",
                        context={"workspace_id": str(workspace_id), "pending_count": pending_count, "limit": ESCALATION_QUEUE_LIMIT},
                    )
            except Exception:
                pass

        return escalation_event
