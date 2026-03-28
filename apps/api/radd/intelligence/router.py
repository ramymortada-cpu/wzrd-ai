"""Intelligence API router — knowledge gaps + on-demand morning briefing."""
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select

from radd.auth.middleware import CurrentUser, get_current_user
from radd.db.models import Workspace
from radd.db.session import get_db_session

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


class KnowledgeGapResponse(BaseModel):
    question_pattern: str
    sample_question: str
    occurrence_count: int
    intent: str
    last_asked: datetime


@router.get("/briefing/today")
async def today_briefing(
    current: Annotated[CurrentUser, Depends(get_current_user)],
):
    """نص إحاطة الصباح نفس منطق الـ scheduler — لويسمح المستخدم يعرضه في الموبايل."""
    from radd.intelligence.morning_briefing import generate_morning_briefing

    async with get_db_session(current.workspace_id) as db:
        w = await db.execute(select(Workspace).where(Workspace.id == current.workspace_id))
        ws = w.scalar_one_or_none()
        name = (ws.name or "") if ws else ""
        summary = await generate_morning_briefing(db, str(current.workspace_id), name)
    return {"summary": summary}


@router.get("/knowledge-gaps", response_model=list[KnowledgeGapResponse])
async def list_knowledge_gaps(
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
    current: Annotated[CurrentUser, Depends(get_current_user)] = ...,
):
    from radd.intelligence.knowledge_gaps import get_knowledge_gaps

    async with get_db_session(current.workspace_id) as db:
        gaps = await get_knowledge_gaps(db, str(current.workspace_id), days=days, limit=limit)
    return [
        KnowledgeGapResponse(
            question_pattern=g.question_pattern,
            sample_question=g.sample_question,
            occurrence_count=g.occurrence_count,
            intent=g.intent,
            last_asked=g.last_asked,
        )
        for g in gaps
    ]
