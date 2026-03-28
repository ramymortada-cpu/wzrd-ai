"""V2 Schema: Revenue events, conversation stages, radar alerts, smart rules

Revision ID: 0006
Create Date: 2026-03-12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # ──── Revenue Events Table ────
    op.create_table(
        'revenue_events',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', UUID(as_uuid=True), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('customer_id', UUID(as_uuid=True), sa.ForeignKey('customers.id'), nullable=True),
        sa.Column('conversation_id', UUID(as_uuid=True), sa.ForeignKey('conversations.id'), nullable=True),
        sa.Column('event_type', sa.String(30), nullable=False),
        sa.Column('amount_sar', sa.Numeric(12, 2), server_default='0'),
        sa.Column('product_name', sa.String(255), nullable=True),
        sa.Column('order_id', sa.String(100), nullable=True),
        sa.Column('metadata', JSONB, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_revenue_events_workspace', 'revenue_events', ['workspace_id', 'created_at'])

    # ──── Conversation Stage Field ────
    op.add_column('conversations', sa.Column(
        'stage', sa.String(30), server_default='unknown'
    ))
    # Values: unknown, inquiry, consideration, objection, purchase_intent, converted,
    #         post_purchase, complaint, return_request, resolved

    # ──── AI Persona Field ────
    op.add_column('conversations', sa.Column(
        'ai_persona', sa.String(20), server_default='receptionist'
    ))
    # Values: receptionist, sales, support

    # ──── Radar Alerts Table ────
    op.create_table(
        'radar_alerts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', UUID(as_uuid=True), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('alert_type', sa.String(30), nullable=False),
        sa.Column('severity', sa.String(10), server_default='medium'),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('suggested_action', sa.Text, nullable=True),
        sa.Column('metadata', JSONB, server_default='{}'),
        sa.Column('is_read', sa.Boolean, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_radar_alerts_workspace', 'radar_alerts', ['workspace_id', 'created_at'])

    # ──── Smart Rules Table ────
    op.create_table(
        'smart_rules',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', UUID(as_uuid=True), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('priority', sa.Integer, server_default='0'),
        sa.Column('triggers', JSONB, server_default='[]'),
        sa.Column('actions', JSONB, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # ──── Follow-up Queue Table ────
    op.create_table(
        'follow_up_queue',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('workspace_id', UUID(as_uuid=True), sa.ForeignKey('workspaces.id'), nullable=False),
        sa.Column('conversation_id', UUID(as_uuid=True), sa.ForeignKey('conversations.id'), nullable=False),
        sa.Column('customer_id', UUID(as_uuid=True), sa.ForeignKey('customers.id'), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('message_template', sa.Text, nullable=False),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_follow_up_scheduled', 'follow_up_queue', ['status', 'scheduled_at'])

    # ──── Workspace: sector field for starter packs ────
    op.add_column('workspaces', sa.Column(
        'sector', sa.String(50)
    ))

    # ──── Workspace: subscription tier for revenue tracking ────
    op.add_column('workspaces', sa.Column(
        'subscription_price_sar', sa.Numeric(8, 2), server_default='499'
    ))


def downgrade() -> None:
    op.drop_table('follow_up_queue')
    op.drop_table('smart_rules')
    op.drop_table('radar_alerts')
    op.drop_table('revenue_events')
    op.drop_column('conversations', 'stage')
    op.drop_column('conversations', 'ai_persona')
    op.drop_column('workspaces', 'sector')
    op.drop_column('workspaces', 'subscription_price_sar')
