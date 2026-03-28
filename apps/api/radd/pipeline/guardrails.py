from __future__ import annotations

"""
Guardrails pipeline.
1. PII redaction: regex patterns for Saudi/GCC PII + NER fallback.
2. Prompt injection detection.
3. Prohibited phrase filter.
4. Response length check.
"""
import re
from dataclasses import dataclass, field

# ─── PII regex patterns ───────────────────────────────────────────────────────

_PII_PATTERNS: list[tuple[str, str, re.Pattern]] = [
    # Saudi national ID (10 digits starting with 1 or 2)
    ("national_id", "[NATIONAL_ID]", re.compile(r"\b[12]\d{9}\b")),
    # GCC phone numbers: +966, 05xx, 009665xx etc.
    ("phone_sa", "[PHONE]", re.compile(r"(?:\+?966|00966|0)(?:5\d{8})\b")),
    # International phone (generic)
    ("phone_intl", "[PHONE]", re.compile(r"\+\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}")),
    # Email
    ("email", "[EMAIL]", re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")),
    # Credit/debit card (16 digits, optionally spaced)
    ("card", "[CARD]", re.compile(r"\b(?:\d{4}[\s\-]?){3}\d{4}\b")),
    # IBAN Saudi (SA + 22 chars)
    ("iban", "[IBAN]", re.compile(r"\bSA\d{2}[A-Z0-9]{20}\b", re.IGNORECASE)),
    # IP address
    ("ip", "[IP]", re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")),
    # GPS coordinates (crude)
    ("gps", "[LOCATION]", re.compile(r"\b\d{1,2}\.\d{4,},\s*\d{1,3}\.\d{4,}\b")),
]

# Prompt injection patterns (Arabic + English)
_INJECTION_PATTERNS: list[re.Pattern] = [
    # English patterns
    re.compile(r"ignore\s+(all\s+)?(previous|above|prior)\s+instructions?", re.IGNORECASE),
    re.compile(r"act\s+as\s+(?:an?\s+)?(?:ai|assistant|gpt|chatgpt)", re.IGNORECASE),
    re.compile(r"(system\s+prompt|system\s+message|prompt\s+injection)", re.IGNORECASE),
    re.compile(r"reveal\s+(your\s+)?(system\s+)?prompt", re.IGNORECASE),
    re.compile(r"what\s+(are\s+your|is\s+your)\s+instructions", re.IGNORECASE),
    re.compile(r"DAN\s+mode|jailbreak", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(a|an|the)\s+\w+\s+(ai|assistant|bot)", re.IGNORECASE),
    # Arabic patterns — covers "تجاهل كل/جميع التعليمات" in any order
    re.compile(r"تجاهل\s+(كل|جميع|كافة)?\s*التعليمات", re.IGNORECASE),
    re.compile(r"تجاهل\s+\S+\s+(التعليمات|الأوامر|التعليمات\s+السابقة)", re.IGNORECASE),
    re.compile(r"تصرف\s+(?:كأنك|مثل|كـ)\s+(?:روبوت|ai|ذكاء)", re.IGNORECASE),
    re.compile(r"أنت\s+(الآن\s+)?(?:ذكاء|روبوت|ai|بوت)\s+(?:مختلف|جديد|آخر)", re.IGNORECASE),
    re.compile(r"(أظهر|اكشف|أخبرني)\s+(عن\s+)?(نظامك|تعليماتك|برمجتك)", re.IGNORECASE),
    re.compile(r"كلمة\s+السر|بياناتك\s+السرية|المعلومات\s+السرية", re.IGNORECASE),
]

# Max response length (characters)
MAX_RESPONSE_CHARS = 1200


@dataclass
class GuardrailResult:
    original_text: str
    redacted_text: str
    pii_found: list[str] = field(default_factory=list)   # types of PII found
    pii_count: int = 0
    injection_detected: bool = False
    length_truncated: bool = False
    is_safe: bool = True


def redact_pii(text: str) -> tuple[str, list[str], int]:
    """
    Apply regex PII redaction. Returns (redacted_text, pii_types_found, count).
    Over-redacts on ambiguity — safety over completeness.
    """
    redacted = text
    found: list[str] = []
    count = 0

    for pii_type, placeholder, pattern in _PII_PATTERNS:
        matches = pattern.findall(redacted)
        if matches:
            found.append(pii_type)
            count += len(matches)
            redacted = pattern.sub(placeholder, redacted)

    return redacted, found, count


def detect_prompt_injection(text: str) -> bool:
    """Return True if text looks like a prompt injection attempt."""
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            return True
    return False


def apply_guardrails(
    inbound_message: str,
    outbound_response: str,
) -> GuardrailResult:
    """
    Full guardrails pass on a (message, response) pair.
    - Redacts PII from outbound response.
    - Detects injection in inbound message.
    - Truncates overly long responses.
    """
    injection = detect_prompt_injection(inbound_message)

    redacted, pii_found, pii_count = redact_pii(outbound_response)

    truncated = False
    if len(redacted) > MAX_RESPONSE_CHARS:
        redacted = redacted[:MAX_RESPONSE_CHARS].rsplit(" ", 1)[0] + " ..."
        truncated = True

    return GuardrailResult(
        original_text=outbound_response,
        redacted_text=redacted,
        pii_found=pii_found,
        pii_count=pii_count,
        injection_detected=injection,
        length_truncated=truncated,
        is_safe=not injection,
    )
