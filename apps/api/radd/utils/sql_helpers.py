from __future__ import annotations

"""
SQL safety helpers.
Never interpolate user input into raw SQL — use these validators.
"""
from fastapi import HTTPException, status


def safe_period_days(value: int, min_val: int = 1, max_val: int = 365) -> int:
    """
    Validate an integer period_days value before interpolating into INTERVAL.
    PostgreSQL INTERVAL syntax doesn't support bind parameters, so we validate
    strictly to prevent injection via the days value.
    """
    if not isinstance(value, int):
        raise HTTPException(
            status_code=422,
            detail=f"period_days must be an integer, got {type(value).__name__}",
        )
    if value < min_val or value > max_val:
        raise HTTPException(
            status_code=422,
            detail=f"period_days must be between {min_val} and {max_val}, got {value}",
        )
    return value


def safe_limit(value: int, max_val: int = 500) -> int:
    """Validate a LIMIT value."""
    if not isinstance(value, int) or value < 1 or value > max_val:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"limit must be between 1 and {max_val}",
        )
    return value
