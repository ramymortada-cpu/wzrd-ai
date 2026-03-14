"""
Integration test fixtures — real Postgres + Redis via testcontainers.
Requires Docker. Run with: uv run pytest tests/integration/ -v
Skip if Docker unavailable: pytest tests/integration/ -v --ignore-glob='*integration*'
"""
from __future__ import annotations

import os
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Mark all tests in this directory as integration (requires Docker)
pytestmark = pytest.mark.integration


def _pg_url_to_asyncpg(url: str) -> str:
    """Convert postgresql URL to postgresql+asyncpg:// for SQLAlchemy async driver."""
    # Handle postgresql://, postgresql+psycopg2://, etc.
    if "postgresql" in url and "asyncpg" not in url:
        idx = url.find("://")
        if idx >= 0:
            return "postgresql+asyncpg" + url[idx:]
    return url


@pytest.fixture(scope="session")
def postgres_container():
    """Start a Postgres container for the test session."""
    try:
        from testcontainers.postgres import PostgresContainer
    except ImportError:
        pytest.skip("testcontainers not installed — run: uv sync --group dev")
    # driver=None gives postgresql:// which we convert to postgresql+asyncpg://
    with PostgresContainer("postgres:16", driver=None) as postgres:
        yield postgres


@pytest.fixture(scope="session")
def redis_container():
    """Start a Redis container for the test session."""
    try:
        from testcontainers.redis import RedisContainer
    except ImportError:
        pytest.skip("testcontainers not installed")
    with RedisContainer("redis:7-alpine") as redis:
        yield redis


@pytest.fixture(scope="session")
def integration_db_url(postgres_container):
    """Async Postgres URL for integration tests (asyncpg driver)."""
    url = postgres_container.get_connection_url()
    return _pg_url_to_asyncpg(url)


@pytest.fixture(scope="session")
def integration_redis_url(redis_container):
    """Redis URL for integration tests."""
    host = redis_container.get_container_host_ip()
    port = redis_container.get_exposed_port(6379)
    return f"redis://{host}:{port}/0"


@pytest.fixture
def integration_engine(integration_db_url):
    """Create async engine (function-scoped for event loop compatibility)."""
    return create_async_engine(
        integration_db_url,
        echo=False,
        pool_size=2,
        max_overflow=0,
    )


@pytest.fixture
def integration_session_factory(integration_engine):
    """Session factory for integration tests."""
    return async_sessionmaker(
        integration_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )


@pytest.fixture
async def integration_db(integration_engine, integration_session_factory):
    """
    Provide an isolated DB session for integration tests.
    Creates schema (tables) on first use. Each test gets a fresh session.
    """
    from radd.db.base import Base
    import radd.db.models  # noqa: F401 — register models

    async with integration_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with integration_session_factory() as session:
        try:
            yield session
        finally:
            await session.rollback()


@pytest.fixture
async def integration_db_with_workspace(integration_db):
    """
    DB session with a test workspace pre-created.
    """
    from radd.db.models import Workspace

    workspace_id = uuid.UUID("00000000-1111-2222-3333-444444444444")
    ws = Workspace(
        id=workspace_id,
        name="Integration Test Workspace",
        slug="integration-test",
        plan="growth",
        status="active",
    )
    integration_db.add(ws)
    await integration_db.flush()
    yield integration_db, workspace_id


# ─── API App Client (overrides DB/Redis with testcontainers) ────────────────────────────────────────────────

@pytest.fixture
async def integration_app(
    integration_db_url,
    integration_redis_url,
    postgres_container,
    redis_container,
):
    """
    FastAPI app with DB and Redis overridden to use testcontainers.
    Patches radd.db.base and radd.deps before importing the app.
    Async to ensure engine/session use the same event loop as tests.
    """
    import radd.db.base as db_base
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    engine = create_async_engine(
        integration_db_url,
        echo=False,
        pool_size=2,
        max_overflow=0,
    )
    session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    db_base.engine = engine
    db_base.AsyncSessionLocal = session_factory

    # Patch Redis before any module imports it
    import redis.asyncio as aioredis
    from radd import deps
    _redis = aioredis.from_url(integration_redis_url, decode_responses=True)
    deps.get_redis = lambda: _redis

    # Create tables before importing app
    from radd.db.base import Base
    import radd.db.models  # noqa: F401 — register models

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from radd.main import app
    return app


@pytest.fixture
async def integration_app_client(integration_app):
    """Async HTTP client for the integration app."""
    from httpx import ASGITransport, AsyncClient
    transport = ASGITransport(app=integration_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
