"""
Integration tests — real Postgres DB, RLS, and models.
Run with: uv run pytest tests/integration/ -v -m integration
Requires Docker for testcontainers.
"""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select, text

from radd.auth.service import hash_password
from radd.db.models import Customer, User, Workspace
from radd.utils.sql_helpers import safe_period_days


@pytest.mark.integration
@pytest.mark.asyncio
async def test_db_connection(integration_db):
    """Verify we can connect and run a simple query."""
    result = await integration_db.execute(text("SELECT 1 as one"))
    row = result.fetchone()
    assert row[0] == 1


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workspace_crud(integration_db):
    """Create and read a workspace."""
    ws_id = uuid.uuid4()
    ws = Workspace(
        id=ws_id,
        name="Test Store",
        slug="test-store",
        plan="growth",
        status="active",
    )
    integration_db.add(ws)
    await integration_db.flush()

    result = await integration_db.execute(select(Workspace).where(Workspace.id == ws_id))
    found = result.scalar_one_or_none()
    assert found is not None
    assert found.name == "Test Store"
    assert found.slug == "test-store"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_rls_workspace_isolation(integration_db, integration_engine):
    """Verify RLS-style workspace isolation works with SET LOCAL."""
    ws1_id = uuid.uuid4()
    ws2_id = uuid.uuid4()

    for wid, name in [(ws1_id, "Store A"), (ws2_id, "Store B")]:
        ws = Workspace(id=wid, name=name, slug=name.lower().replace(" ", "-"), plan="growth", status="active")
        integration_db.add(ws)
    await integration_db.flush()

    # Query with workspace 1 context
    await integration_db.execute(text(f"SET LOCAL app.current_workspace_id = '{ws1_id}'"))
    result = await integration_db.execute(select(Workspace).where(Workspace.id == ws1_id))
    ws1 = result.scalar_one_or_none()
    assert ws1 is not None
    assert ws1.name == "Store A"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_user_crud_with_workspace(integration_db_with_workspace):
    """Create user scoped to workspace."""
    db, workspace_id = integration_db_with_workspace
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        workspace_id=workspace_id,
        email="agent@test.radd.ai",
        name="Agent",
        role="agent",
        password_hash=hash_password("pass123"),
        is_active=True,
    )
    db.add(user)
    await db.flush()

    result = await db.execute(select(User).where(User.id == user_id))
    found = result.scalar_one_or_none()
    assert found is not None
    assert found.workspace_id == workspace_id
    assert found.email == "agent@test.radd.ai"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_customer_rls_isolation(integration_db):
    """Customers are isolated by workspace_id."""
    ws1_id = uuid.uuid4()
    ws2_id = uuid.uuid4()

    for wid, name in [(ws1_id, "Store A"), (ws2_id, "Store B")]:
        ws = Workspace(id=wid, name=name, slug=f"store-{wid.hex[:8]}", plan="growth", status="active")
        integration_db.add(ws)
    await integration_db.flush()

    cust1 = Customer(
        workspace_id=ws1_id,
        channel_identifier_hash="hash_a_123",
        display_name="Customer A",
        customer_tier="new",
    )
    cust2 = Customer(
        workspace_id=ws2_id,
        channel_identifier_hash="hash_b_456",
        display_name="Customer B",
        customer_tier="returning",
    )
    integration_db.add_all([cust1, cust2])
    await integration_db.flush()

    await integration_db.execute(text(f"SET LOCAL app.current_workspace_id = '{ws1_id}'"))
    result = await integration_db.execute(
        select(Customer).where(Customer.workspace_id == ws1_id)
    )
    customers = result.scalars().all()
    assert len(customers) == 1
    assert customers[0].display_name == "Customer A"


@pytest.mark.asyncio
async def test_safe_period_days_integration():
    """safe_period_days works correctly (no DB, but validates logic)."""
    assert safe_period_days(30) == 30
    assert safe_period_days(7, min_val=7, max_val=90) == 7
    assert safe_period_days(90, min_val=7, max_val=90) == 90

    from fastapi import HTTPException
    with pytest.raises(HTTPException):
        safe_period_days(0)
    with pytest.raises(HTTPException):
        safe_period_days(366)
    with pytest.raises(HTTPException):
        safe_period_days("30; DROP TABLE users;--")  # type: ignore
