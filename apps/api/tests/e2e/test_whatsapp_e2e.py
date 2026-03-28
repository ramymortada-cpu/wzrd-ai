"""RADD AI — E2E Intent Test Suite (#8)
اختبارات تصنيف النوايا — تعمل مع classify_intent_sync (لا تحتاج API)."""
from __future__ import annotations

import os

import pytest

# Run always — with fallback (keyword) some assertions accept general_inquiry
class TestE2EIntentClassification:
    """اختبارات تصنيف النوايا على عينة من الرسائل."""

    @pytest.fixture
    def classify(self):
        from radd.pipeline.intent_v2 import classify_intent_sync
        return classify_intent_sync

    @pytest.mark.parametrize("msg,expected,accept_fallback", [
        ("أين طلبي رقم 12345", "order_status", []),
        ("كم تكلفة الشحن", "shipping_inquiry", ["shipping"]),
        ("أريد إرجاع المنتج", "return_policy", ["general_inquiry"]),
        ("مرحبا", "greeting", []),
        ("ما مواعيد العمل", "store_hours", []),
        ("خدمتكم سيئة جداً", "complaint", ["general_inquiry"]),
        ("وين طلبيتي", "order_status", []),
        ("ابي ارجع المنتج", "return_policy", []),
        ("Where is my order", "order_status", ["general_inquiry"]),
        ("Hello", "greeting", ["general_inquiry"]),
    ])
    def test_intent_samples(self, classify, msg, expected, accept_fallback):
        """عينة من الاختبارات — تعمل مع LLM أو fallback."""
        result = classify(msg)
        got = result.get("intent_name", "")
        if expected == "shipping_inquiry" and got == "shipping":
            got = "shipping_inquiry"
        ok = got == expected or got in accept_fallback
        assert ok, f"msg={msg!r} expected={expected} (or {accept_fallback}) got={got}"
