from __future__ import annotations
import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from radd.config import settings
from radd.db.models import User

# ─── Token Blacklist (Redis) ──────────────────────────────────────────────────
# Revoked tokens are stored as SHA-256(token) to avoid storing the token itself.

def _token_blacklist_key(token: str) -> str:
    return f"token:blacklist:{hashlib.sha256(token.encode()).hexdigest()}"


async def blacklist_token(token: str, expires_in_seconds: int) -> None:
    """Add a token to the Redis blacklist. Used on logout / forced revocation."""
    from radd.deps import get_redis
    r = get_redis()
    key = _token_blacklist_key(token)
    await r.set(key, "1", ex=expires_in_seconds)


async def is_token_blacklisted(token: str) -> bool:
    """Check if a token has been explicitly revoked."""
    from radd.deps import get_redis
    r = get_redis()
    key = _token_blacklist_key(token)
    return bool(await r.exists(key))


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly (passlib is incompatible with bcrypt>=4.1)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    role: str,
    is_superadmin: bool = False,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "workspace_id": str(workspace_id),
        "role": role,
        "is_superadmin": is_superadmin,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: uuid.UUID, workspace_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
    payload = {
        "sub": str(user_id),
        "workspace_id": str(workspace_id),
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}") from e


async def authenticate_user(db: AsyncSession, workspace_id: uuid.UUID, email: str, password: str) -> User | None:
    result = await db.execute(
        select(User).where(User.workspace_id == workspace_id, User.email == email, User.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user
