"""RADD AI — Hybrid Search Verification (#7)
يتأكد من أن PostgreSQL FTS مفعل ويختبر BM25."""
from __future__ import annotations

import asyncio
import logging
import time

from sqlalchemy import text

logger = logging.getLogger("radd.scripts.verify_hybrid_search")


async def verify_fts_setup(db_session) -> dict:
    """التحقق من وجود عمود tsv و GIN index."""
    checks = []
    for name, sql, fix in [
        (
            "tsv_column",
            "SELECT 1 FROM information_schema.columns WHERE table_name='kb_chunks' AND column_name='tsv'",
            "ALTER TABLE kb_chunks ADD COLUMN tsv tsvector;",
        ),
        (
            "gin_index",
            "SELECT 1 FROM pg_indexes WHERE tablename='kb_chunks' AND indexdef LIKE '%gin%tsv%'",
            "CREATE INDEX idx_kb_chunks_tsv ON kb_chunks USING GIN(tsv);",
        ),
    ]:
        try:
            r = await db_session.execute(text(sql))
            checks.append({"name": name, "status": "pass" if r.fetchone() else "FAIL", "fix": fix})
        except Exception as e:
            checks.append({"name": name, "status": "ERROR", "error": str(e)})
    return {"status": "ready" if all(c["status"] == "pass" for c in checks) else "needs_fix", "checks": checks}


async def apply_fts_fixes(db_session) -> list[str]:
    """تطبيق إصلاحات FTS: tsv, trigger, backfill."""
    applied = []
    steps = [
        ("add_tsv", "ALTER TABLE kb_chunks ADD COLUMN IF NOT EXISTS tsv tsvector"),
        ("gin_idx", "CREATE INDEX IF NOT EXISTS idx_kb_chunks_tsv ON kb_chunks USING GIN(tsv)"),
        (
            "trigger_fn",
            """CREATE OR REPLACE FUNCTION kb_chunks_tsv_trigger() RETURNS trigger AS $$
            BEGIN
                NEW.tsv := to_tsvector('simple', COALESCE(NEW.content_normalized, NEW.content, ''));
                RETURN NEW;
            END $$ LANGUAGE plpgsql""",
        ),
        ("trigger_drop", "DROP TRIGGER IF EXISTS tsvectorupdate ON kb_chunks"),
        (
            "trigger_create",
            "CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON kb_chunks "
            "FOR EACH ROW EXECUTE FUNCTION kb_chunks_tsv_trigger()",
        ),
        (
            "backfill",
            "UPDATE kb_chunks SET tsv = to_tsvector('simple', COALESCE(content_normalized, content, '')) WHERE tsv IS NULL",
        ),
    ]
    for name, sql in steps:
        try:
            await db_session.execute(text(sql))
            await db_session.commit()
            applied.append(f"✅ {name}")
        except Exception as e:
            applied.append(f"❌ {name}: {e}")
    return applied


async def test_hybrid_search(db_session, workspace_id: str, queries: list[str] | None = None) -> dict:
    """اختبار البحث النصي BM25."""
    if not queries:
        queries = ["كم سعر الشحن", "هل يمكن إرجاع المنتج", "طلب رقم 12345", "مواعيد العمل"]
    results = []
    for q in queries:
        start = time.monotonic()
        try:
            r = await db_session.execute(
                text("""
                SELECT id, LEFT(content, 80), ts_rank(tsv, plainto_tsquery('simple', :q)) as rank
                FROM kb_chunks
                WHERE workspace_id = :ws AND is_active = true AND tsv @@ plainto_tsquery('simple', :q)
                ORDER BY rank DESC LIMIT 5
            """),
                {"q": q, "ws": str(workspace_id)},
            )
            rows = [{"id": str(row[0]), "preview": row[1], "score": float(row[2])} for row in r.fetchall()]
        except Exception:
            rows = []
        results.append({"query": q, "bm25_results": rows, "latency_ms": round((time.monotonic() - start) * 1000, 1)})
    return {"queries_tested": len(queries), "results": results}


async def _main():
    """تشغيل التحقق من سطر الأوامر."""
    import sys
    import uuid

    from radd.db.session import get_db_session

    workspace_id_str = __import__("os").getenv("WORKSPACE_ID", "")
    workspace_id = uuid.UUID(workspace_id_str) if workspace_id_str else None
    async with get_db_session(workspace_id) as db:
        print("=== FTS Setup ===")
        setup = await verify_fts_setup(db)
        print(setup)
        if setup["status"] != "ready" and "--apply-fixes" in sys.argv:
            print("\n=== Applying fixes ===")
            fixes = await apply_fts_fixes(db)
            for f in fixes:
                print(f)
        print("\n=== Hybrid Search Test ===")
        ws_id = str(workspace_id) if workspace_id else "00000000-0000-0000-0000-000000000000"
        test = await test_hybrid_search(db, ws_id)
        print(test)


if __name__ == "__main__":
    asyncio.run(_main())
