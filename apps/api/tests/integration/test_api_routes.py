"""
Integration tests — API routes with real DB/Redis.
Uses TestClient against FastAPI app with testcontainers.
"""
from __future__ import annotations

import pytest


@pytest.mark.integration
@pytest.mark.asyncio
async def test_health_endpoint(integration_app_client):
    """Health endpoint works without auth."""
    client = integration_app_client
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_ready_endpoint(integration_app_client):
    """Ready endpoint reports DB and Redis status."""
    client = integration_app_client
    r = await client.get("/ready")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert "checks" in data
    assert "database" in data["checks"]
    assert "redis" in data["checks"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_admin_customers_requires_auth(integration_app_client):
    """Admin /customers returns 401 without token."""
    client = integration_app_client
    r = await client.get("/api/v1/admin/customers")
    assert r.status_code == 401
