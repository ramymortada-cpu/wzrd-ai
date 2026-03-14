"""RADD AI — Sentry Integration (#10) + Structured Logging (#11)
PII filtering, pipeline error capture, optional structured formatter."""
from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("radd.monitoring")


def _filter_pii(event: dict, hint: dict) -> dict | None:
    """إزالة PII من أحداث Sentry قبل الإرسال."""
    if "request" in event:
        headers = event["request"].get("headers", {})
        for k in list(headers.keys()):
            if k.lower() in ("authorization", "cookie", "x-api-key"):
                headers[k] = "[FILTERED]"
    return event


def capture_pipeline_error(error: BaseException, workspace_id: str = "", intent: str = "") -> None:
    """تسجيل خطأ الـ pipeline في Sentry مع سياق workspace و intent."""
    try:
        import sentry_sdk

        with sentry_sdk.push_scope() as scope:
            scope.set_tag("workspace_id", workspace_id)
            scope.set_tag("intent", intent)
            scope.set_tag("component", "pipeline")
            sentry_sdk.capture_exception(error)
    except ImportError:
        logger.error("pipeline_error", extra={"error": str(error), "workspace_id": workspace_id})


class StructuredFormatter(logging.Formatter):
    """Formatter ينتج JSON structured logs."""

    def format(self, record: logging.LogRecord) -> str:
        data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
        }
        skip = {
            "name", "msg", "args", "created", "relativeCreated", "exc_info", "exc_text",
            "stack_info", "lineno", "funcName", "pathname", "filename", "module",
            "levelname", "levelno", "msecs", "thread", "threadName", "process",
            "processName", "taskName", "message",
        }
        for k, v in record.__dict__.items():
            if k not in skip:
                try:
                    json.dumps(v)
                    data[k] = v
                except (TypeError, ValueError):
                    data[k] = str(v)
        if record.exc_info and record.exc_info[1]:
            data["exception"] = {
                "type": type(record.exc_info[1]).__name__,
                "message": str(record.exc_info[1]),
            }
        return json.dumps(data, ensure_ascii=False, default=str)


def configure_logging(level: str = "INFO", structured: bool = True) -> None:
    """إعداد logging مع StructuredFormatter اختيارياً."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    root.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    if structured:
        handler.setFormatter(StructuredFormatter())
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s|%(levelname)-8s|%(name)s|%(message)s"))
    root.addHandler(handler)
    for noisy in ("httpx", "httpcore", "urllib3", "asyncio", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
