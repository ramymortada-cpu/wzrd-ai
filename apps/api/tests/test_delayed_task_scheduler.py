"""
RADD AI — Delayed Task Scheduler Tests (#16)
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import time

from radd.scheduler.delayed_task import DelayedTaskScheduler, DELAYED_TASKS_KEY


@pytest.mark.asyncio
async def test_schedule_adds_to_sorted_set():
    """schedule يضيف مهمة إلى Redis Sorted Set."""
    mock_redis = AsyncMock()
    mock_redis.zadd = AsyncMock(return_value=1)

    with patch("radd.scheduler.delayed_task.aioredis.from_url", return_value=mock_redis):
        scheduler = DelayedTaskScheduler("redis://localhost:6379")
        ok = await scheduler.schedule("cod_whatsapp_fallback", {"order_id": "123"}, delay_seconds=60)
        await scheduler.close()

    assert ok is True
    mock_redis.zadd.assert_called_once()
    call_args = mock_redis.zadd.call_args
    assert call_args[0][0] == DELAYED_TASKS_KEY
    # member is JSON with type and payload
    member = list(call_args[0][1].keys())[0]
    assert "cod_whatsapp_fallback" in member
    assert "123" in member


@pytest.mark.asyncio
async def test_pop_due_tasks_returns_empty_when_none_due():
    """pop_due_tasks يرجع [] عندما لا توجد مهام مستحقة."""
    mock_redis = AsyncMock()
    mock_redis.zrangebyscore = AsyncMock(return_value=[])

    with patch("radd.scheduler.delayed_task.aioredis.from_url", return_value=mock_redis):
        scheduler = DelayedTaskScheduler("redis://localhost:6379")
        tasks = await scheduler.pop_due_tasks()
        await scheduler.close()

    assert tasks == []


@pytest.mark.asyncio
async def test_pop_due_tasks_removes_and_returns_due_tasks():
    """pop_due_tasks يستخرج المهام المستحقة ويزيلها."""
    import json
    task_data = '{"type": "save_the_sale", "payload": {"order_id": "456"}}'
    mock_redis = AsyncMock()
    mock_redis.zrangebyscore = AsyncMock(return_value=[task_data])
    mock_redis.zrem = AsyncMock(return_value=1)

    with patch("radd.scheduler.delayed_task.aioredis.from_url", return_value=mock_redis):
        scheduler = DelayedTaskScheduler("redis://localhost:6379")
        tasks = await scheduler.pop_due_tasks()
        await scheduler.close()

    assert len(tasks) == 1
    assert tasks[0]["type"] == "save_the_sale"
    assert tasks[0]["payload"]["order_id"] == "456"
    mock_redis.zrem.assert_called_once_with(DELAYED_TASKS_KEY, task_data)
