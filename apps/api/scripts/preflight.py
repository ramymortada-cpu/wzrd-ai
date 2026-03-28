#!/usr/bin/env python3
"""
RADD AI — Pre-Flight Validation Script (#20)

يفحص البيئة قبل النشر:
- متغيرات البيئة المطلوبة (بدون طباعة قيم حساسة)
- اتصال DB، Redis، Qdrant
- إعدادات الأمان (CORS، SECRET_KEY)

Usage:
    cd apps/api && uv run python scripts/preflight.py

Exit: 0 = كل شيء OK، 1 = فشل
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

# Ensure apps/api is on path
_script_dir = Path(__file__).resolve().parent
_api_dir = _script_dir.parent
sys.path.insert(0, str(_api_dir))

# Load .env from apps/api/ if present (before os.getenv checks)
_env_file = _api_dir / ".env"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v

_WEAK_SECRETS = frozenset({"change-me", "radd-default-secret", "change-me-jwt", ""})
_MIN_SECRET_LEN = 32


def _mask(value: str) -> str:
    """لا تطبع القيم الحساسة — فقط طول أو ***"""
    if not value:
        return "(empty)"
    if len(value) < 8:
        return "***"
    return f"{value[:2]}...{value[-2:]}(len={len(value)})"


def check_env_vars() -> list[tuple[str, bool, str]]:
    """فحص المتغيرات المطلوبة."""
    results = []
    app_env = os.getenv("APP_ENV", "development")
    is_prod = app_env == "production"

    # Required always
    db_url = os.getenv("DATABASE_URL", "")
    redis_url = os.getenv("REDIS_URL", "")
    secret = (os.getenv("SECRET_KEY") or "").strip()
    jwt_secret = (os.getenv("JWT_SECRET_KEY") or "").strip()

    results.append((
        "DATABASE_URL",
        "postgresql" in db_url and len(db_url) > 20,
        "يجب أن يحتوي على postgresql" if "postgresql" not in db_url else "ok",
    ))
    results.append((
        "REDIS_URL",
        "redis" in redis_url and len(redis_url) > 10,
        "يجب أن يحتوي على redis" if "redis" not in redis_url else "ok",
    ))

    # SECRET_KEY
    sk_ok = secret not in _WEAK_SECRETS and len(secret) >= _MIN_SECRET_LEN
    if is_prod and not sk_ok:
        results.append(("SECRET_KEY", False, f"في الإنتاج: ≥{_MIN_SECRET_LEN} حرف، وليس قيمة ضعيفة"))
    else:
        results.append(("SECRET_KEY", sk_ok or not is_prod, "ok" if sk_ok else "dev: weak ok"))

    # JWT_SECRET_KEY
    jsk_ok = jwt_secret not in _WEAK_SECRETS and len(jwt_secret) >= _MIN_SECRET_LEN
    if is_prod and not jsk_ok:
        results.append(("JWT_SECRET_KEY", False, f"في الإنتاج: ≥{_MIN_SECRET_LEN} حرف"))
    else:
        results.append(("JWT_SECRET_KEY", jsk_ok or not is_prod, "ok" if jsk_ok else "dev: weak ok"))

    # CORS
    cors = os.getenv("CORS_ORIGINS", "")
    cors_ok = cors != "*" if is_prod else True
    results.append((
        "CORS_ORIGINS",
        cors_ok,
        "لا تستخدم * في الإنتاج" if not cors_ok else "ok",
    ))

    # Unique secrets
    results.append((
        "SECRET_KEY ≠ JWT_SECRET_KEY",
        secret != jwt_secret,
        "يجب أن يكونا مختلفين" if secret == jwt_secret else "ok",
    ))

    return results


async def check_connections() -> list[tuple[str, bool, str]]:
    """فحص اتصال DB، Redis، Qdrant."""
    results = []

    # DB
    try:
        from sqlalchemy import text
        from radd.db.base import engine
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        results.append(("Database", True, "ok"))
    except Exception as e:
        results.append(("Database", False, str(e)[:80]))

    # Redis
    try:
        from radd.deps import check_redis_health
        ok = await check_redis_health()
        results.append(("Redis", ok, "ok" if ok else "ping failed"))
    except Exception as e:
        results.append(("Redis", False, str(e)[:80]))

    # Qdrant
    try:
        from radd.deps import check_qdrant_health
        ok = await check_qdrant_health()
        results.append(("Qdrant", ok, "ok" if ok else "connection failed"))
    except Exception as e:
        results.append(("Qdrant", False, str(e)[:80]))

    return results


def main() -> int:
    print("RADD AI — Pre-Flight Validation")
    print("=" * 50)

    failed = 0

    # Env vars
    print("\n[1] Environment Variables")
    for name, ok, msg in check_env_vars():
        icon = "✅" if ok else "❌"
        if not ok:
            failed += 1
        print(f"  {icon} {name}: {msg}")

    # Connections (async)
    print("\n[2] Connections")
    conn_results = asyncio.run(check_connections())
    for name, ok, msg in conn_results:
        icon = "✅" if ok else "❌"
        if not ok:
            failed += 1
        print(f"  {icon} {name}: {msg}")

    print("\n" + "=" * 50)
    if failed == 0:
        print("✅ Pre-flight passed — ready for deployment")
        return 0
    print(f"❌ Pre-flight failed — {failed} check(s) failed")
    return 1


if __name__ == "__main__":
    sys.exit(main())
