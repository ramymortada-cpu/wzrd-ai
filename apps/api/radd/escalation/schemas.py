from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class EscalationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    conversation_id: uuid.UUID
    escalation_type: str
    reason: str | None
    confidence_at_escalation: float | None
    context_package: dict
    assigned_user_id: uuid.UUID | None
    status: str
    rag_draft: str | None
    accepted_at: datetime | None
    resolved_at: datetime | None
    resolution_notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class EscalationAccept(BaseModel):
    pass


class EscalationResolve(BaseModel):
    notes: str | None = None
    send_message: str | None = None   # Optional final message to customer


class EscalationQueue(BaseModel):
    items: list[EscalationResponse]
    total: int
