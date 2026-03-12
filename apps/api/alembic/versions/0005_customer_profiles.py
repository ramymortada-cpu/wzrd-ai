"""Add customer intelligence fields + knowledge_gaps view

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Customer intelligence columns ────────────────────────────────────────
    op.add_column("customers", sa.Column("total_conversations", sa.Integer(), server_default="0", nullable=False))
    op.add_column("customers", sa.Column("total_escalations", sa.Integer(), server_default="0", nullable=False))
    op.add_column("customers", sa.Column("avg_sentiment", sa.Numeric(3, 2), nullable=True))
    op.add_column("customers", sa.Column("customer_tier", sa.String(20), server_default="new", nullable=False))
    op.add_column("customers", sa.Column("salla_customer_id", sa.String(100), nullable=True))
    op.add_column("customers", sa.Column("salla_total_orders", sa.Integer(), server_default="0", nullable=False))
    op.add_column("customers", sa.Column("salla_total_revenue", sa.Numeric(12, 2), server_default="0", nullable=False))
    op.add_column("customers", sa.Column("last_complaint_at", sa.DateTime(timezone=True), nullable=True))

    # ─── knowledge_gaps view ──────────────────────────────────────────────────
    op.execute("""
        CREATE OR REPLACE VIEW knowledge_gaps AS
        SELECT
            c.workspace_id,
            m.content_normalized AS question,
            c.intent,
            COUNT(*) AS occurrence_count,
            MAX(m.created_at) AS last_asked
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE m.sender_type = 'customer'
          AND c.resolution_type IN ('escalated_hard', 'escalated_soft')
          AND m.created_at > NOW() - INTERVAL '7 days'
        GROUP BY c.workspace_id, m.content_normalized, c.intent
        HAVING COUNT(*) >= 2
        ORDER BY occurrence_count DESC
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS knowledge_gaps")
    for col in [
        "total_conversations", "total_escalations", "avg_sentiment",
        "customer_tier", "salla_customer_id", "salla_total_orders",
        "salla_total_revenue", "last_complaint_at",
    ]:
        op.drop_column("customers", col)
