from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageResponse(BaseModel):
    id: uuid.UUID
    sender_type: str
    content: str
    confidence: dict | None
    source_passages: list | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerSummary(BaseModel):
    id: uuid.UUID
    display_name: str | None
    language: str | None
    channel_type: str

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    id: uuid.UUID
    status: str
    intent: str | None
    dialect: str | None
    confidence_score: float | None
    resolution_type: str | None
    message_count: int
    first_message_at: datetime | None
    last_message_at: datetime | None
    customer: CustomerSummary | None = None

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationSummary):
    messages: list[MessageResponse] = []
    assigned_user_id: uuid.UUID | None


class ConversationList(BaseModel):
    items: list[ConversationSummary]
    total: int
    page: int
    page_size: int


class AgentReply(BaseModel):
    content: str
    resolve: bool = False   # If True, mark conversation resolved after sending
