"""RADD AI — Control Center (#14) + KB Management (#15) + Template Editor (#18)
من RADD_Complete_Implementation_v2."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel

from radd.auth.middleware import CurrentUser, require_reviewer
from radd.config import settings
from radd.limiter import limiter

logger = logging.getLogger("radd.admin.control_center")

# === #14: CONTROL CENTER ===
control_router = APIRouter(prefix="/control-center", tags=["Control Center"])


class AutomationStatus(BaseModel):
    is_active: bool
    paused_at: datetime | None = None
    paused_by: str | None = None


@control_router.get("/decisions")
@limiter.limit(settings.default_rate_limit)
async def get_ai_decisions(request: Request, current: Annotated[CurrentUser, Depends(require_reviewer)], limit: int = 50):
    """سجل قرارات الـ AI — integrate with audit_log."""
    return {"message": "AI decisions log - integrate with audit_log", "limit": limit}


@control_router.post("/pause-automation")
@limiter.limit(settings.default_rate_limit)
async def pause_automation(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    reason: str = "manual",
    duration_minutes: int = 0,
):
    """إيقاف الأتمتة مؤقتاً."""
    return {
        "status": "paused",
        "reason": reason,
        "auto_resume": f"{duration_minutes}m" if duration_minutes else "manual",
    }


@control_router.post("/resume-automation")
@limiter.limit(settings.default_rate_limit)
async def resume_automation(request: Request, current: Annotated[CurrentUser, Depends(require_reviewer)]):
    """استئناف الأتمتة."""
    return {"status": "active"}


@control_router.get("/pending-reviews")
@limiter.limit(settings.default_rate_limit)
async def get_pending_reviews(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    limit: int = 20,
):
    """الردود المعلقة للمراجعة — integrate with escalated_soft."""
    return {"message": "Pending reviews - integrate", "limit": limit}


@control_router.post("/approve-review/{message_id}")
@limiter.limit(settings.default_rate_limit)
async def approve_review(
    request: Request,
    message_id: str,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    modified_text: str | None = None,
):
    return {"approved": message_id, "modified": modified_text is not None}


@control_router.post("/reject-review/{message_id}")
@limiter.limit(settings.default_rate_limit)
async def reject_review(
    request: Request,
    message_id: str,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
):
    return {"rejected": message_id}


# === #15: KB MANAGEMENT ===
kb_manage_router = APIRouter(prefix="/knowledge/manage", tags=["KB Management"])


@kb_manage_router.get("/gaps")
@limiter.limit(settings.default_rate_limit)
async def get_kb_gaps(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    days: int = Query(7, ge=1, le=90),
):
    """فجوات قاعدة المعرفة — أسئلة متكررة بدون إجابة."""
    return {"message": "KB gaps - integrate", "days": days}


@kb_manage_router.post("/suggest-content")
@limiter.limit(settings.default_rate_limit)
async def suggest_content(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    topic: str = "",
):
    """اقتراح محتوى من AI لموضوع معين."""
    return {"message": f"AI suggestion for '{topic}' - integrate with OpenAI"}


@kb_manage_router.get("/health")
@limiter.limit(settings.default_rate_limit)
async def kb_health(request: Request, current: Annotated[CurrentUser, Depends(require_reviewer)]):
    """فحص صحة قاعدة المعرفة."""
    return {"message": "KB health check - integrate"}


# === #18: TEMPLATE EDITOR ===
templates_router = APIRouter(prefix="/templates", tags=["Template Editor"])


class TemplateCreate(BaseModel):
    intent: str
    dialect: str = "gulf"
    content: str
    variables: list[str] = []


@templates_router.get("/")
@limiter.limit(settings.default_rate_limit)
async def list_templates(request: Request, current: Annotated[CurrentUser, Depends(require_reviewer)]):
    """قائمة القوالب — من radd.pipeline.templates."""
    from radd.pipeline.templates import TEMPLATES

    items = []
    for intent, dialects in TEMPLATES.items():
        for dialect, content in dialects.items():
            items.append({"intent": intent, "dialect": dialect, "content": content})
    return {"templates": items}


@templates_router.post("/")
@limiter.limit(settings.default_rate_limit)
async def create_template(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    t: TemplateCreate,
):
    """إنشاء قالب — integrate with DB أو config."""
    return {"created": t.model_dump()}


class TemplatePreview(BaseModel):
    content: str = ""
    variables: dict = {}


@templates_router.post("/preview")
@limiter.limit(settings.default_rate_limit)
async def preview_template(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
    body: TemplatePreview,
):
    """معاينة القالب مع متغيرات."""
    result = body.content
    for k, v in body.variables.items():
        result = result.replace(f"{{{k}}}", str(v))
    return {"preview": result}
