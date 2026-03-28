#!/usr/bin/env python3
"""
Delayed Task Worker (#16)

يستهلك المهام المؤجلة من Redis Sorted Set عند الاستحقاق،
ويرسلها إلى الطوابير المناسبة (cod_shield_whatsapp، cod_shield_calls).

Usage:
    cd apps/api && uv run python -m workers.delayed_task_worker
"""
from __future__ import annotations

import asyncio
import json
import logging
import signal
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import redis.asyncio as aioredis

logger = logging.getLogger("radd.worker.delayed_task")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")

POLL_INTERVAL = 5


async def process_task(task_type: str, payload: dict, redis_client: aioredis.Redis) -> None:
    """معالجة مهمة مستحقة — دفعها للطابور المناسب."""
    # payload يحتوي على البيانات الكاملة للمهمة (نفس تنسيق الطابور الأصلي)
    task_json = json.dumps(payload, ensure_ascii=False)
    if task_type == "cod_whatsapp_fallback":
        await redis_client.lpush("cod_shield_whatsapp", task_json)
        logger.info("Pushed cod_whatsapp_fallback for order %s", payload.get("order_id"))
    elif task_type == "save_the_sale":
        await redis_client.lpush("cod_shield_whatsapp", task_json)
        logger.info("Pushed save_the_sale for order %s", payload.get("order_id"))
    elif task_type == "cod_shield_call":
        await redis_client.lpush("cod_shield_calls", json.dumps(payload, ensure_ascii=False))
        logger.info("Pushed cod_shield_call for order %s", payload.get("order_id"))
    else:
        logger.warning("Unknown task type: %s", task_type)


async def main_loop() -> None:
    from radd.config import settings
    from radd.scheduler.delayed_task import DelayedTaskScheduler, DELAYED_TASKS_KEY

    r = aioredis.from_url(settings.redis_url, decode_responses=True)
    scheduler = DelayedTaskScheduler(settings.redis_url)
    running = True

    def stop(_sig=None, _frame=None):
        nonlocal running
        running = False

    try:
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, stop)
    except (NotImplementedError, OSError):
        pass

    logger.info("DelayedTaskWorker started — polling %s every %ds", DELAYED_TASKS_KEY, POLL_INTERVAL)

    while running:
        try:
            tasks = await scheduler.pop_due_tasks(limit=20)
            for t in tasks:
                await process_task(t["type"], t["payload"], r)
        except Exception as e:
            logger.error("Error processing tasks: %s", e, exc_info=True)

        await asyncio.sleep(POLL_INTERVAL)

    await scheduler.close()
    await r.aclose()
    logger.info("DelayedTaskWorker stopped")


if __name__ == "__main__":
    asyncio.run(main_loop())
