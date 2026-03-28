"""
Webhook signature verification helpers.

- API Key: X-Webhook-Secret header (cart, shipping generic)
- Salla: X-Salla-Signature HMAC-SHA256
- Shopify: X-Shopify-Hmac-SHA256
- Twilio: X-Twilio-Signature (via twilio.request_validator)
"""

from __future__ import annotations

import hashlib
import hmac
import logging

logger = logging.getLogger("radd.webhooks.verify")


def verify_webhook_api_key(header_value: str | None, expected_key: str) -> bool:
    """
    Verify X-Webhook-Secret header matches configured webhook_api_key.
    If expected_key is empty, returns True (verification disabled).
    """
    if not expected_key:
        return True
    if not header_value:
        logger.warning("webhook_api_key_required_but_missing")
        return False
    return hmac.compare_digest(header_value.strip(), expected_key.strip())


def verify_salla_signature(payload: bytes, signature_header: str | None, secret: str) -> bool:
    """
    Verify Salla webhook HMAC-SHA256 signature (X-Salla-Signature).
    Format: sha256=<hex_digest> or raw hex.
    """
    if not secret:
        logger.warning("salla_webhook_secret_not_configured")
        return False
    if not signature_header:
        logger.warning("salla_missing_signature_header")
        return False

    if signature_header.startswith("sha256="):
        provided_sig = signature_header[7:]
    else:
        provided_sig = signature_header

    expected_sig = hmac.new(
        key=secret.encode("utf-8"),
        msg=payload,
        digestmod=hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected_sig, provided_sig)


def verify_shopify_signature(payload: bytes, signature_header: str | None, secret: str) -> bool:
    """
    Verify Shopify webhook HMAC-SHA256 signature (X-Shopify-Hmac-SHA256).
    Shopify sends base64-encoded HMAC-SHA256 of the raw body.
    """
    if not secret:
        logger.warning("shopify_webhook_secret_not_configured")
        return False
    if not signature_header:
        logger.warning("shopify_missing_signature_header")
        return False

    import base64

    expected = base64.b64encode(
        hmac.new(
            key=secret.encode("utf-8"),
            msg=payload,
            digestmod=hashlib.sha256,
        ).digest()
    ).decode("utf-8")

    return hmac.compare_digest(signature_header.strip(), expected)
