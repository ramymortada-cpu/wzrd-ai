"""
Migration: أضف Shopify config إلى workspace settings schema
الملف: apps/api/alembic/versions/0009_shopify_support.py

لا نحتاج جدول جديد — workspace.settings هو JSONB بالفعل.
نضيف فقط index وتوثيق البنية المتوقعة.
"""

from alembic import op
import sqlalchemy as sa

revision = "0009_shopify_support"
down_revision = "0008_v4_features"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # workspace.settings JSONB بالفعل — فقط نضيف index للأداء
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_workspaces_settings_platform
        ON workspaces ((settings->>'platform'));
    """)

    # توثيق: البنية المتوقعة لـ settings JSONB
    # {
    #   "platform": "salla" | "shopify",
    #
    #   -- Salla fields
    #   "salla_store_id": "...",
    #   "salla_access_token": "...",
    #
    #   -- Shopify fields
    #   "shopify_domain": "mystore.myshopify.com",
    #   "shopify_access_token": "shpat_...",
    # }

    # seed: اجعل كل workspace موجود platform=salla للتوافق
    op.execute("""
        UPDATE workspaces
        SET settings = COALESCE(settings, '{}'::jsonb) || '{"platform": "salla"}'::jsonb
        WHERE settings->>'platform' IS NULL;
    """)


def downgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS ix_workspaces_settings_platform;
    """)
