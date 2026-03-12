"""
Scheduler worker — daily morning briefings + weekly knowledge gap summaries.

Runs independently from the message worker.
Schedule (Asia/Riyadh):
  • 08:00 daily  → morning briefing for each active workspace (via WhatsApp)
  • 09:00 Sunday → knowledge gap summary for each active workspace (via WhatsApp)

No Celery needed — uses APScheduler with an asyncio event loop.
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from radd.config import settings
from radd.db.models import Workspace, User
from radd.db.session import get_db_session
from radd.intelligence.morning_briefing import generate_morning_briefing
from radd.intelligence.knowledge_gaps import get_gap_summary
from radd.whatsapp.client import send_text_message

logger = structlog.get_logger()

RIYADH_TZ = "Asia/Riyadh"


async def get_active_workspaces() -> list[dict]:
    """Return list of active workspaces with owner phone numbers."""
    async with get_db_session() as db:
        result = await db.execute(
            select(Workspace, User)
            .join(User, (User.workspace_id == Workspace.id) & (User.role == "owner"))
            .where(Workspace.is_active == True)
        )
        rows = result.fetchall()
        return [
            {
                "workspace_id": str(row.Workspace.id),
                "workspace_name": row.Workspace.name,
                "owner_phone": (row.Workspace.settings or {}).get("owner_phone"),
                "channel_config": (row.Workspace.settings or {}),
            }
            for row in rows
            if (row.Workspace.settings or {}).get("owner_phone")
        ]


async def send_morning_briefings() -> None:
    """Send daily morning briefing to all active workspace owners."""
    logger.info("scheduler.morning_briefing.start")
    workspaces = await get_active_workspaces()
    logger.info("scheduler.morning_briefing.workspaces", count=len(workspaces))

    for ws in workspaces:
        try:
            async with get_db_session(ws["workspace_id"]) as db:
                briefing = await generate_morning_briefing(
                    db, ws["workspace_id"], ws["workspace_name"]
                )

            if briefing:
                await send_text_message(
                    phone_number=ws["owner_phone"],
                    message=briefing,
                    phone_number_id=ws["channel_config"].get("wa_phone_number_id") or settings.wa_phone_number_id,
                    api_token=settings.wa_api_token,
                )
                logger.info(
                    "scheduler.morning_briefing.sent",
                    workspace=ws["workspace_name"],
                )
        except Exception as e:
            logger.error(
                "scheduler.morning_briefing.failed",
                workspace=ws["workspace_name"],
                error=str(e),
            )


async def send_knowledge_gap_summaries() -> None:
    """Send weekly knowledge gap summary to all active workspace owners."""
    logger.info("scheduler.knowledge_gaps.start")
    workspaces = await get_active_workspaces()

    for ws in workspaces:
        try:
            async with get_db_session(ws["workspace_id"]) as db:
                summary = await get_gap_summary(db, ws["workspace_id"])

            if summary:
                await send_text_message(
                    phone_number=ws["owner_phone"],
                    message=summary,
                    phone_number_id=ws["channel_config"].get("wa_phone_number_id") or settings.wa_phone_number_id,
                    api_token=settings.wa_api_token,
                )
                logger.info(
                    "scheduler.knowledge_gaps.sent",
                    workspace=ws["workspace_name"],
                )
        except Exception as e:
            logger.error(
                "scheduler.knowledge_gaps.failed",
                workspace=ws["workspace_name"],
                error=str(e),
            )


async def run_scheduler() -> None:
    scheduler = AsyncIOScheduler(timezone=RIYADH_TZ)

    # Morning briefing — every day at 08:00 Riyadh time
    scheduler.add_job(
        send_morning_briefings,
        CronTrigger(hour=8, minute=0, timezone=RIYADH_TZ),
        id="morning_briefing",
        replace_existing=True,
    )

    # Knowledge gap summary — every Sunday at 09:00 Riyadh time (day_of_week=6)
    scheduler.add_job(
        send_knowledge_gap_summaries,
        CronTrigger(day_of_week="sun", hour=9, minute=0, timezone=RIYADH_TZ),
        id="knowledge_gaps_weekly",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        "scheduler.started",
        jobs=len(scheduler.get_jobs()),
        timezone=RIYADH_TZ,
    )

    try:
        # Keep running
        while True:
            await asyncio.sleep(60)
    except (KeyboardInterrupt, SystemExit, asyncio.CancelledError):
        scheduler.shutdown()
        logger.info("scheduler.stopped")


if __name__ == "__main__":
    asyncio.run(run_scheduler())
