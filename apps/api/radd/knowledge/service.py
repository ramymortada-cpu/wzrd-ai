from __future__ import annotations
"""
KB service — document CRUD + approval workflow + chunk management.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from radd.db.models import KBChunk, KBDocument, ResponseTemplate
from radd.knowledge.schemas import KBDocumentCreate, KBDocumentUpdate, TemplateCreate, TemplateUpdate


# ─── Documents ────────────────────────────────────────────────────────────────

async def list_documents(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[KBDocument], int]:
    q = (
        select(KBDocument)
        .where(KBDocument.workspace_id == workspace_id, KBDocument.deleted_at.is_(None))
    )
    if status:
        q = q.where(KBDocument.status == status)

    total_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_result.scalar_one()

    q = q.order_by(KBDocument.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(q)
    return result.scalars().all(), total


async def get_document(db: AsyncSession, workspace_id: uuid.UUID, doc_id: uuid.UUID) -> KBDocument | None:
    result = await db.execute(
        select(KBDocument).where(
            KBDocument.id == doc_id,
            KBDocument.workspace_id == workspace_id,
            KBDocument.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def create_document(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    data: KBDocumentCreate,
) -> KBDocument:
    doc = KBDocument(
        workspace_id=workspace_id,
        title=data.title,
        content=data.content,
        content_type=data.content_type,
        language=data.language,
        status="draft",
        uploaded_by_user_id=user_id,
        version=1,
    )
    db.add(doc)
    await db.flush()
    return doc


async def update_document(
    db: AsyncSession,
    doc: KBDocument,
    data: KBDocumentUpdate,
) -> KBDocument:
    if data.title is not None:
        doc.title = data.title
    if data.content is not None:
        doc.content = data.content
        # Reset to draft when content changes — requires re-approval
        doc.status = "draft"
        doc.approved_by_user_id = None
        # Deactivate old chunks (re-indexing will happen on next approval)
        doc.version = (doc.version or 1) + 1
    if data.content_type is not None:
        doc.content_type = data.content_type
    if data.status is not None:
        doc.status = data.status
    await db.flush()
    return doc


async def soft_delete_document(db: AsyncSession, doc: KBDocument) -> None:
    doc.deleted_at = datetime.now(timezone.utc)
    doc.status = "archived"
    # Deactivate all chunks
    await db.execute(
        update(KBChunk)
        .where(KBChunk.document_id == doc.id)
        .values(is_active=False)
    )
    await db.flush()


async def approve_document(
    db: AsyncSession,
    doc: KBDocument,
    approver_id: uuid.UUID,
) -> KBDocument:
    doc.status = "approved"
    doc.approved_by_user_id = approver_id
    await db.flush()
    return doc


async def get_chunk_count(db: AsyncSession, document_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count()).where(KBChunk.document_id == document_id, KBChunk.is_active.is_(True))
    )
    return result.scalar_one()


# ─── Templates ────────────────────────────────────────────────────────────────

async def list_templates(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    intent_id: str | None = None,
) -> list[ResponseTemplate]:
    q = select(ResponseTemplate).where(ResponseTemplate.workspace_id == workspace_id)
    if intent_id:
        q = q.where(ResponseTemplate.intent_id == intent_id)
    result = await db.execute(q.order_by(ResponseTemplate.intent_id, ResponseTemplate.dialect))
    return result.scalars().all()


async def create_template(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    data: TemplateCreate,
) -> ResponseTemplate:
    template = ResponseTemplate(
        workspace_id=workspace_id,
        intent_id=data.intent_id,
        dialect=data.dialect,
        content=data.content,
        parameters=data.parameters,
        is_active=True,
    )
    db.add(template)
    await db.flush()
    return template


async def update_template(
    db: AsyncSession,
    template: ResponseTemplate,
    data: TemplateUpdate,
) -> ResponseTemplate:
    if data.content is not None:
        template.content = data.content
    if data.is_active is not None:
        template.is_active = data.is_active
    await db.flush()
    return template


# ─── KBService class — used by V2 modules (salla_sync, sales/engine) ──────────

class KBService:
    """
    Class-based wrapper around the KB service functions.
    Used by V2 modules (salla_sync, sales/engine) that expect an object interface.
    A system user_id is used for all operations (first owner user in workspace).
    """

    def __init__(self, db: AsyncSession, workspace_id: uuid.UUID, system_user_id: uuid.UUID | None = None):
        self.db = db
        self.workspace_id = workspace_id
        self._system_user_id = system_user_id

    async def _get_system_user_id(self) -> uuid.UUID:
        if self._system_user_id:
            return self._system_user_id
        from radd.db.models import User
        result = await self.db.execute(
            select(User)
            .where(User.workspace_id == self.workspace_id, User.role == "owner")
            .limit(1)
        )
        user = result.scalar_one_or_none()
        if user:
            self._system_user_id = user.id
            return user.id
        # Fallback: use a nil UUID (won't FK to a real user, safe for auto-generated docs)
        return uuid.UUID("00000000-0000-0000-0000-000000000000")

    async def create_document(
        self,
        title: str,
        content: str,
        content_type: str = "product_info",
        metadata: dict | None = None,
    ) -> KBDocument:
        from radd.knowledge.schemas import KBDocumentCreate
        user_id = await self._get_system_user_id()
        doc = KBDocument(
            workspace_id=self.workspace_id,
            title=title,
            content=content,
            content_type=content_type,
            language="ar",
            status="approved",
            uploaded_by_user_id=user_id,
            version=1,
            metadata_=metadata or {},
        )
        self.db.add(doc)
        await self.db.flush()
        return doc

    async def update_document(self, doc_id: uuid.UUID, content: str | None = None, title: str | None = None) -> KBDocument | None:
        result = await self.db.execute(
            select(KBDocument).where(
                KBDocument.id == doc_id,
                KBDocument.workspace_id == self.workspace_id,
            )
        )
        doc = result.scalar_one_or_none()
        if doc:
            if content is not None:
                doc.content = content
            if title is not None:
                doc.title = title
            await self.db.flush()
        return doc

    async def find_by_salla_id(self, workspace_id: str, salla_id: str) -> KBDocument | None:
        result = await self.db.execute(
            select(KBDocument).where(
                KBDocument.workspace_id == self.workspace_id,
                KBDocument.metadata_["salla_id"].astext == salla_id,
                KBDocument.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def find_by_title(self, workspace_id: str, title: str) -> KBDocument | None:
        result = await self.db.execute(
            select(KBDocument).where(
                KBDocument.workspace_id == self.workspace_id,
                KBDocument.title == title,
                KBDocument.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def archive_document(self, doc_id: uuid.UUID) -> None:
        from datetime import datetime, timezone
        result = await self.db.execute(
            select(KBDocument).where(
                KBDocument.id == doc_id,
                KBDocument.workspace_id == self.workspace_id,
            )
        )
        doc = result.scalar_one_or_none()
        if doc:
            doc.deleted_at = datetime.now(timezone.utc)
            await self.db.flush()
