"""
RADD AI — Save The Sale Tests (#15)

13 اختبار لوحدة handle_cancellation_request.
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch

from radd.actions.save_the_sale import (
    handle_cancellation_request,
    CancellationCheckResult,
    _format_save_options,
    _format_not_cancellable,
    _format_save_the_sale,
    _format_not_found,
    NON_CANCELLABLE_STATUSES,
)


# ─── Unit: helpers ───────────────────────────────────────────────────────────

def test_format_save_options_gulf():
    opts = _format_save_options("gulf")
    assert len(opts) == 3
    assert "خصم" in opts[0]
    assert "تأجيل" in opts[1]
    assert "استبدال" in opts[2]


def test_format_save_options_egyptian():
    opts = _format_save_options("egyptian")
    assert len(opts) == 3
    assert "خصم" in opts[0]
    assert "تأجيل" in opts[1]
    assert "استبدال" in opts[2]


def test_format_save_options_msa():
    opts = _format_save_options("msa")
    assert len(opts) == 3


def test_format_not_cancellable_gulf():
    msg = _format_not_cancellable("123", "تم التسليم", "gulf")
    assert "123" in msg
    assert "تم التسليم" in msg
    assert "ما نقدر" in msg or "نلغي" in msg


def test_format_not_found_egyptian():
    msg = _format_not_found("456", "egyptian")
    assert "456" in msg
    assert "مش لاقي" in msg or "لاقي" in msg


def test_format_save_the_sale_includes_options():
    opts = ["خصم", "تأجيل", "استبدال"]
    msg = _format_save_the_sale("789", opts, "gulf")
    assert "789" in msg
    assert "خصم" in msg
    assert "تأجيل" in msg
    assert "استبدال" in msg
    assert "أكد الإلغاء" in msg or "أكد" in msg


def test_non_cancellable_statuses():
    assert "delivered" in NON_CANCELLABLE_STATUSES
    assert "canceled" in NON_CANCELLABLE_STATUSES
    assert "refunded" in NON_CANCELLABLE_STATUSES
    assert "cancelled" in NON_CANCELLABLE_STATUSES
    assert "closed" in NON_CANCELLABLE_STATUSES
    assert "pending" not in NON_CANCELLABLE_STATUSES


# ─── Integration: handle_cancellation_request ────────────────────────────────

@pytest.mark.asyncio
async def test_no_order_number_requests_it():
    """لا رقم طلب — يطلب من العميل الرقم."""
    result = await handle_cancellation_request(message="أبي ألغي", dialect="gulf", workspace_config={})
    assert result.cancellable is False
    assert "رقم الطلب" in result.response_text or "الطلب" in result.response_text
    assert result.order_reference == ""


@pytest.mark.asyncio
async def test_salla_not_found():
    """Salla — طلب غير موجود."""
    with patch("radd.actions.salla.get_order_status", new_callable=AsyncMock) as mock:
        mock.return_value = {"found": False, "reference": "12345"}
        result = await handle_cancellation_request(
            message="ألغي طلبي رقم 12345",
            dialect="gulf",
            workspace_config={"platform": "salla", "salla_access_token": "fake"},
        )
        assert result.cancellable is False
        assert "12345" in result.response_text


@pytest.mark.asyncio
async def test_salla_not_cancellable_delivered():
    """Salla — طلب تم تسليمه، لا يمكن الإلغاء."""
    with patch("radd.actions.salla.get_order_status", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "found": True,
            "reference": "12345",
            "status": "delivered",
            "status_ar": "تم التسليم",
        }
        result = await handle_cancellation_request(
            message="ألغي طلبي رقم 12345",
            dialect="gulf",
            workspace_config={"platform": "salla", "salla_access_token": "fake"},
        )
        assert result.cancellable is False
        assert "12345" in result.response_text
        assert "تم التسليم" in result.response_text or "التسليم" in result.response_text


@pytest.mark.asyncio
async def test_salla_cancellable_offers_options():
    """Salla — طلب قابلاً للإلغاء، يعرض خيارات إنقاذ البيع."""
    with patch("radd.actions.salla.get_order_status", new_callable=AsyncMock) as mock:
        mock.return_value = {
            "found": True,
            "reference": "12345",
            "status": "pending",
            "status_ar": "قيد الانتظار",
        }
        result = await handle_cancellation_request(
            message="ألغي طلبي رقم 12345",
            dialect="gulf",
            workspace_config={"platform": "salla", "salla_access_token": "fake"},
        )
        assert result.cancellable is True
        assert len(result.options) == 3
        assert "خصم" in result.response_text or "تأجيل" in result.response_text or "استبدال" in result.response_text
        assert "أكد" in result.response_text or "الإلغاء" in result.response_text


@pytest.mark.asyncio
async def test_no_token_returns_config_error():
    """بدون توكن — رسالة لا يمكن الاستعلام."""
    result = await handle_cancellation_request(
        message="ألغي طلبي ORD-300",
        dialect="gulf",
        workspace_config={"platform": "salla"},  # no salla_access_token
    )
    assert result.cancellable is False
    assert "كلمنا" in result.response_text or "تواصل" in result.response_text or "نساعدك" in result.response_text or "مساعدتك" in result.response_text


@pytest.mark.asyncio
async def test_unknown_platform():
    """منصة غير معروفة."""
    result = await handle_cancellation_request(
        message="ألغي طلبي رقم 12345",
        dialect="gulf",
        workspace_config={"platform": "unknown"},
    )
    assert result.cancellable is False
    assert result.order_reference == "12345"
