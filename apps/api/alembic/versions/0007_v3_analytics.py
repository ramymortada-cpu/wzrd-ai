"""V3 Analytics: accepted_at on escalation_events, message_type on messages

Revision ID: 0007_v3_analytics
Revises: 0006_v2_features
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_v3_analytics"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Add accepted_at to escalation_events (idempotent)
    conn.execute(
        sa.text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'escalation_events' AND column_name = 'accepted_at'
                ) THEN
                    ALTER TABLE escalation_events ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
                END IF;
            END $$;
        """)
    )

    # Add message_type to messages (idempotent)
    conn.execute(
        sa.text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'messages' AND column_name = 'message_type'
                ) THEN
                    ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
                END IF;
            END $$;
        """)
    )

    # Index for agent performance query
    try:
        op.create_index(
            "ix_escalation_events_assigned_user",
            "escalation_events",
            ["assigned_user_id", "workspace_id", "created_at"],
        )
    except Exception:
        pass  # Index may already exist


def downgrade() -> None:
    try:
        op.drop_index("ix_escalation_events_assigned_user", "escalation_events")
    except Exception:
        pass
    op.drop_column("messages", "message_type")
    op.drop_column("escalation_events", "accepted_at")
