"""V4 Features: developer_api_keys table, platform field on messages/channels

Revision ID: 0008_v4_features
Revises: 0007_v3_analytics
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0008_v4_features"
down_revision = "0007_v3_analytics"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Developer API Keys ──────────────────────────────────────────────────
    op.create_table(
        "developer_api_keys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("key_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("key_prefix", sa.String(20), nullable=False),
        sa.Column("scopes", JSONB, server_default="[]"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_developer_api_keys_workspace", "developer_api_keys", ["workspace_id"])
    op.create_index("ix_developer_api_keys_hash", "developer_api_keys", ["key_hash"])

    # ── Platform field on channels (for instagram, zid, etc.) ─────────────
    try:
        op.add_column(
            "channels",
            sa.Column("platform", sa.String(30), server_default="whatsapp"),
        )
    except Exception:
        pass  # Column may already exist

    # ── Voice/audio support: media_id on messages ─────────────────────────
    try:
        op.add_column(
            "messages",
            sa.Column("media_id", sa.String(255), nullable=True),
        )
    except Exception:
        pass

    # ── Zid sector for workspaces (extends existing sector field) ─────────
    # sector field already added in 0006 — no new column needed


def downgrade() -> None:
    try:
        op.drop_index("ix_developer_api_keys_hash", "developer_api_keys")
        op.drop_index("ix_developer_api_keys_workspace", "developer_api_keys")
        op.drop_table("developer_api_keys")
    except Exception:
        pass
    try:
        op.drop_column("channels", "platform")
    except Exception:
        pass
    try:
        op.drop_column("messages", "media_id")
    except Exception:
        pass
