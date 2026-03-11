from __future__ import annotations
import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr


# ─── Workspace schemas ────────────────────────────────────────────────────────

class WorkspaceSummary(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    status: str
    user_count: int
    message_count_today: int
    conversation_count: int
    created_at: str


class WorkspaceDetail(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    status: str
    settings: dict
    created_at: str
    updated_at: str
    user_count: int
    message_count_total: int
    conversation_count: int
    kb_document_count: int
    channel_count: int
    pending_escalations: int


class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    plan: str = "pilot"
    owner_name: str
    owner_email: EmailStr
    owner_password: str


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[dict] = None


# ─── User schemas ─────────────────────────────────────────────────────────────

class PlatformUser(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    is_superadmin: bool
    workspace_id: str
    workspace_name: str
    workspace_slug: str
    last_login_at: Optional[str] = None
    created_at: str


class ResetPasswordBody(BaseModel):
    new_password: str


# ─── Platform analytics ───────────────────────────────────────────────────────

class PlatformKPIs(BaseModel):
    total_workspaces: int
    active_workspaces: int
    total_messages_today: int
    total_messages_week: int
    platform_automation_rate: float
    total_active_conversations: int
    total_pending_escalations: int
    top_workspaces: list[dict]
    computed_at: str


# ─── Pipeline config schemas ──────────────────────────────────────────────────

class PipelineConfig(BaseModel):
    confidence_auto_threshold: float
    confidence_soft_escalation_threshold: float
    openai_chat_model: str
    openai_embedding_model: str
    intents: list[dict]


class PipelineConfigUpdate(BaseModel):
    confidence_auto_threshold: Optional[float] = None
    confidence_soft_escalation_threshold: Optional[float] = None


# ─── System health schemas ────────────────────────────────────────────────────

class ServiceStatus(BaseModel):
    name: str
    status: str       # ok | degraded | down
    latency_ms: Optional[float] = None
    detail: Optional[str] = None


class SystemHealth(BaseModel):
    overall: str
    services: list[ServiceStatus]
    checked_at: str
