"""
StreamConsumer — قراءة من Redis Stream وتوزيع الرسائل.

يكتشف streams، ينشئ consumer groups، يقرأ الرسائل، ويستدعي MessageHandler.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

import structlog

from radd.alerts import alert_manager, init_alert_manager
from radd.config import settings
from radd.deps import get_redis

logger = structlog.get_logger()

CONSUMER_NAME_PREFIX = "radd-worker"
BLOCK_MS = 5000
HEARTBEAT_KEY = "worker:heartbeat:message"
HEARTBEAT_TTL = 90
HEARTBEAT_INTERVAL = 30


class StreamConsumer:
    """قراءة الرسائل من Redis Streams messages:{workspace_id}."""

    def __init__(self, message_handler):
        self._message_handler = message_handler
        self._redis = None

    async def run(self) -> None:
        """الحلقة الرئيسية — اكتشاف streams وقراءة الرسائل."""
        init_alert_manager(
            slack_webhook_url=settings.slack_alert_webhook_url,
            app_env=settings.app_env,
        )
        self._redis = get_redis()
        consumer_name = f"{CONSUMER_NAME_PREFIX}-{uuid.uuid4().hex[:8]}"
        logger.info("worker.started", consumer=consumer_name)

        last_heartbeat = 0.0
        while True:
            try:
                # Heartbeat every HEARTBEAT_INTERVAL seconds for health monitoring
                now = asyncio.get_event_loop().time()
                if now - last_heartbeat > HEARTBEAT_INTERVAL:
                    await self._heartbeat()
                    last_heartbeat = now

                keys = await self._redis.keys("messages:*")
                if not keys:
                    await asyncio.sleep(1)
                    continue

                for stream_key in keys:
                    stream_key_str = stream_key.decode("utf-8") if isinstance(stream_key, bytes) else stream_key
                    workspace_id_str = stream_key_str.split(":", 1)[1] if ":" in stream_key_str else "default"
                    consumer_group = f"group:{workspace_id_str}"

                    try:
                        await self._redis.xgroup_create(stream_key, consumer_group, id="0", mkstream=True)
                    except Exception as e:
                        if "BUSYGROUP" not in str(e):
                            logger.warning("worker.xgroup_create_failed", group=consumer_group, error=str(e))

                    messages = await self._redis.xreadgroup(
                        consumer_group,
                        consumer_name,
                        {stream_key: ">"},
                        count=10,
                        block=BLOCK_MS,
                    )

                    if not messages:
                        continue

                    for _, msg_list in messages:
                        for msg_id, msg_data in msg_list:
                            try:
                                await self._process_one(stream_key, consumer_group, msg_id, msg_data)
                            except Exception as e:
                                await self._handle_message_error(msg_id, msg_data, e)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("worker.loop_error", error=str(e))
                try:
                    await alert_manager.fatal(
                        event="worker_crashed",
                        message="Message worker stopped processing — requires immediate restart",
                        context={"error": str(e)[:200], "error_type": type(e).__name__},
                    )
                except Exception:
                    pass
                await asyncio.sleep(2)

    async def _heartbeat(self) -> None:
        """Write heartbeat to Redis for /health/business monitoring."""
        try:
            await self._redis.set(
                HEARTBEAT_KEY,
                datetime.now(timezone.utc).isoformat(),
                ex=HEARTBEAT_TTL,
            )
        except Exception as e:
            logger.warning("worker.heartbeat_failed", error=str(e))

    def _normalize_msg_data(self, msg_data) -> dict:
        """Convert Redis stream msg_data to dict with string keys/values."""
        if isinstance(msg_data, dict):
            return {str(k) if isinstance(k, bytes) else k: str(v) if isinstance(v, bytes) else v for k, v in msg_data.items()}
        if msg_data:
            return {str(k) if isinstance(k, bytes) else k: str(v) if isinstance(v, bytes) else v for k, v in msg_data.items()}
        return {}

    async def _process_one(self, stream_key, consumer_group, msg_id, msg_data) -> None:
        """معالجة رسالة واحدة واعتمادها."""
        _data = self._normalize_msg_data(msg_data)
        await self._message_handler.process_message(_data)
        await self._redis.xack(stream_key, consumer_group, msg_id)

    async def _handle_message_error(self, msg_id, msg_data, e: Exception) -> None:
        """معالجة فشل الرسالة — تسجيل وتنبيه."""
        logger.error("worker.message_failed", error=str(e), msg_id=msg_id)
        _data = self._normalize_msg_data(msg_data)
        _ws_id = _data.get("workspace_id", "")
        try:
            from radd.monitoring.sentry_and_logging import capture_pipeline_error
            capture_pipeline_error(e, str(_ws_id), "")
        except Exception:
            pass
        try:
            await alert_manager.critical(
                event="message_processing_failed",
                message="Failed to process customer message",
                context={
                    "workspace_id": str(_ws_id) if _ws_id else "unknown",
                    "error": str(e)[:200],
                    "error_type": type(e).__name__,
                },
            )
        except Exception:
            pass
