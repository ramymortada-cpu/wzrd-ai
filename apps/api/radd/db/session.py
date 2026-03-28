from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from radd.db.base import AsyncSessionLocal


@asynccontextmanager
async def get_db_session(workspace_id: uuid.UUID | None = None) -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager for database sessions with RLS tenant isolation.
    Sets app.current_workspace_id for every session so RLS policies apply.
    """
    async with AsyncSessionLocal() as session:
        if workspace_id is not None:
            # Use set_config with bind param to avoid string interpolation
            await session.execute(
                text("SELECT set_config('app.current_workspace_id', :wid, true)"),
                {"wid": str(workspace_id)},
            )
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db(workspace_id: uuid.UUID | None = None) -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for injecting a DB session."""
    async with get_db_session(workspace_id) as session:
        yield session
