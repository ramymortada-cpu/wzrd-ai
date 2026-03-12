"""Intelligence API router — knowledge gaps endpoint."""
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from datetime import datetime

from radd.auth.middleware import CurrentUser, get_current_user
from radd.db.session import AsyncSession, get_db

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


class KnowledgeGapResponse(BaseModel):
    question_pattern: str
    sample_question: str
    occurrence_count: int
    intent: str
    last_asked: datetime


@router.get("/knowledge-gaps", response_model=list[KnowledgeGapResponse])
async def list_knowledge_gaps(
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
    current: Annotated[CurrentUser, Depends(get_current_user)] = ...,
    db: AsyncSession = Depends(get_db),
):
    from radd.intelligence.knowledge_gaps import get_knowledge_gaps
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
