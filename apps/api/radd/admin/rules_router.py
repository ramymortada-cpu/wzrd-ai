"""Admin smart rules endpoints."""
from __future__ import annotations

import uuid
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select

from radd.auth.middleware import CurrentUser, require_admin, require_reviewer
from radd.config import settings
from radd.db.models import SmartRule as SmartRuleModel
from radd.db.session import get_db_session
from radd.limiter import limiter

router = APIRouter(tags=["admin-rules"])


class SmartRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    priority: int = 0
    triggers: list[dict] = []
    actions: list[dict] = []


@router.get("/rules")
@limiter.limit(settings.default_rate_limit)
async def list_smart_rules(
    request: Request,
    current: Annotated[CurrentUser, Depends(require_reviewer)],
):
    """List all smart rules for this workspace."""
    async with get_db_session(current.workspace_id) as db:
        result = await db.execute(
            select(SmartRuleModel)
            .where(SmartRuleModel.workspace_id == current.workspace_id)
            .order_by(SmartRuleModel.priority.desc())
        )
        rules = result.scalars().all()
    return {
        "items": [
            {
                "id": str(r.id),
                "name": r.name,
                "description": r.description,
                "is_active": r.is_active,
                "priority": r.priority,
                "triggers": r.triggers,
                "actions": r.actions,
                "created_at": r.created_at.isoformat(),
            }
            for r in rules
        ]
    }


@router.post("/rules", status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.default_rate_limit)
async def create_smart_rule(
    request: Request,
    body: SmartRuleCreate,
    current: Annotated[CurrentUser, Depends(require_admin)],
):
    """Create a new smart rule."""
    async with get_db_session(current.workspace_id) as db:
        rule = SmartRuleModel(
            workspace_id=current.workspace_id,
            name=body.name,
            description=body.description,
            is_active=body.is_active,
            priority=body.priority,
            triggers=body.triggers,
            actions=body.actions,
        )
        db.add(rule)
        await db.flush()
    return {"id": str(rule.id), "name": rule.name, "created": True}


@router.patch("/rules/{rule_id}")
@limiter.limit(settings.default_rate_limit)
async def update_smart_rule(
    request: Request,
    rule_id: uuid.UUID,
    body: dict,
    current: Annotated[CurrentUser, Depends(require_admin)],
):
    """Update an existing smart rule (name, is_active, priority, triggers, actions)."""
    allowed = {"name", "description", "is_active", "priority", "triggers", "actions"}
    updates = {k: v for k, v in body.items() if k in allowed}
    async with get_db_session(current.workspace_id) as db:
        result = await db.execute(
            select(SmartRuleModel).where(
                SmartRuleModel.id == rule_id,
                SmartRuleModel.workspace_id == current.workspace_id,
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        for k, v in updates.items():
            setattr(rule, k, v)
    return {"updated": True}


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.default_rate_limit)
async def delete_smart_rule(
    request: Request,
    rule_id: uuid.UUID,
    current: Annotated[CurrentUser, Depends(require_admin)],
):
    """Delete a smart rule."""
    async with get_db_session(current.workspace_id) as db:
        result = await db.execute(
            select(SmartRuleModel).where(
                SmartRuleModel.id == rule_id,
                SmartRuleModel.workspace_id == current.workspace_id,
            )
        )
        rule = result.scalar_one_or_none()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        await db.delete(rule)
