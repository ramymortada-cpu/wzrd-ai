"""
RADD AI — Delayed Task Scheduler (#16)

استخدام Redis Sorted Set لجدولة مهام مؤجلة.
score = Unix timestamp عند الاستحقاق.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

import redis.asyncio as aioredis

logger = logging.getLogger("radd.scheduler.delayed_task")

DELAYED_TASKS_KEY = "delayed_tasks"
POLL_INTERVAL = 5  # seconds — لا polling مكثف


class DelayedTaskScheduler:
    """
    جدولة مهام مؤجلة باستخدام Redis Sorted Set.
    score = Unix timestamp — المهمة تُستحق عندما now >= score.
    """

    def __init__(self, redis_url: str):
        self._redis_url = redis_url
        self._redis: aioredis.Redis | None = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(self._redis_url, decode_responses=True)
        return self._redis

    async def schedule(
        self,
        task_type: str,
        payload: dict[str, Any],
        delay_seconds: int,
    ) -> bool:
        """
        إضافة مهمة مؤجلة.
        task_type: "cod_whatsapp_fallback" | "save_the_sale" | "cod_shield_call"
        payload: بيانات المهمة (JSON-serializable)
        delay_seconds: التأخير بالثواني
        """
        try:
            r = await self._get_redis()
            score = time.time() + delay_seconds
            member = json.dumps({"type": task_type, "payload": payload}, ensure_ascii=False)
            await r.zadd(DELAYED_TASKS_KEY, {member: score})
            logger.info("Scheduled %s in %ds", task_type, delay_seconds)
            return True
        except Exception as e:
            logger.error("Failed to schedule task: %s", e)
            return False

    async def pop_due_tasks(self, limit: int = 10) -> list[dict]:
        """
        استخراج المهام المستحقة (score <= now).
        يُرجع قائمة من {type, payload}.
        """
        try:
            r = await self._get_redis()
            now = time.time()
            # ZRANGEBYSCORE ... LIMIT 0 N
            members = await r.zrangebyscore(DELAYED_TASKS_KEY, "-inf", now, start=0, num=limit)
            if not members:
                return []

            results = []
            for m in members:
                await r.zrem(DELAYED_TASKS_KEY, m)
                try:
                    data = json.loads(m)
                    results.append({"type": data.get("type", ""), "payload": data.get("payload", {})})
                except json.JSONDecodeError:
                    logger.warning("Invalid task JSON: %s", m[:80])
            return results
        except Exception as e:
            logger.error("Failed to pop due tasks: %s", e)
            return []

    async def close(self) -> None:
        if self._redis:
            await self._redis.aclose()
            self._redis = None
