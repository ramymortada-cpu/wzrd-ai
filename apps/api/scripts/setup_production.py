"""RADD AI — Production Setup Checker (#13)
يفحص متغيرات البيئة والأمان، ويولد .env.production و nginx config."""
from __future__ import annotations

import os
import secrets
import sys


def check_env() -> list[dict]:
    """فحص متغيرات البيئة المطلوبة للإنتاج."""
    checks = []
    rules_map = {
        "SECRET_KEY": {"min": 32},
        "JWT_SECRET_KEY": {"min": 32},
        "DATABASE_URL": {"contains": "postgresql"},
        "REDIS_URL": {"contains": "redis"},
        "OPENAI_API_KEY": {"starts": "sk-"},
        "META_APP_SECRET": {"min": 10},
        "WA_PHONE_NUMBER_ID": {"min": 5},
        "WA_API_TOKEN": {"min": 10},
    }
    for var, rules in rules_map.items():
        v = os.getenv(var, "")
        status = "pass"
        if not v or rules.get("min") and len(v) < rules["min"] or rules.get("contains") and rules["contains"] not in v:
            status = "FAIL"
        elif rules.get("starts") and not v.startswith(rules["starts"]):
            status = "WARN"
        checks.append({"var": var, "status": status})
    return checks


def check_security() -> list[dict]:
    """فحص إعدادات الأمان."""
    checks = []
    if os.getenv("CORS_ORIGINS", "*") == "*":
        checks.append({"check": "CORS", "status": "FAIL", "issue": "لا تستخدم * في الإنتاج"})
    else:
        checks.append({"check": "CORS", "status": "pass"})
    if os.getenv("SECRET_KEY") == os.getenv("JWT_SECRET_KEY"):
        checks.append({"check": "unique_secrets", "status": "FAIL", "issue": "SECRET_KEY و JWT_SECRET_KEY يجب أن يكونا مختلفين"})
    else:
        checks.append({"check": "unique_secrets", "status": "pass"})
    return checks


def generate_env() -> str:
    """توليد قالب .env للإنتاج."""
    return f"""APP_ENV=production
SECRET_KEY={secrets.token_hex(32)}
JWT_SECRET_KEY={secrets.token_hex(32)}
DATABASE_URL=postgresql+asyncpg://radd:CHANGE@host/radd?sslmode=require
REDIS_URL=redis://host:6379
OPENAI_API_KEY=sk-CHANGE
CORS_ORIGINS=https://your-domain.com
META_APP_SECRET=CHANGE
META_VERIFY_TOKEN={secrets.token_urlsafe(16)}
WA_PHONE_NUMBER_ID=CHANGE
WA_API_TOKEN=CHANGE
CONFIDENCE_AUTO_THRESHOLD=0.85
CONFIDENCE_SOFT_ESCALATION_THRESHOLD=0.60
USE_INTENT_V2=false
USE_VERIFIER_V2=false
"""


def generate_nginx(domain: str) -> str:
    """توليد تكوين nginx للإنتاج."""
    return f"""server {{ listen 80; server_name {domain}; return 301 https://$server_name$request_uri; }}
server {{ listen 443 ssl http2; server_name {domain};
  ssl_certificate /etc/letsencrypt/live/{domain}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;
  add_header X-Frame-Options DENY; add_header X-Content-Type-Options nosniff;
  add_header Strict-Transport-Security "max-age=31536000" always;
  location /api/ {{ proxy_pass http://api:8000; proxy_set_header Host $host; }}
  location /ws/ {{ proxy_pass http://api:8000; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }}
  location / {{ proxy_pass http://web:3000; proxy_set_header Host $host; }} }}
"""


if __name__ == "__main__":
    print("RADD AI — Production Setup Checker")
    for c in check_env():
        print(f"  {'✅' if c['status'] == 'pass' else '❌'} {c['var']}")
    for c in check_security():
        print(f"  {'✅' if c['status'] == 'pass' else '❌'} {c['check']}")
    if "--generate-env" in sys.argv:
        out_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
        with open(out_path, "w") as f:
            f.write(generate_env())
        print("📄 .env.production created")
    if "--generate-nginx" in sys.argv:
        domain = "radd.ai" if sys.argv[-1] == "--generate-nginx" else sys.argv[sys.argv.index("--generate-nginx") + 1]
        with open("nginx.prod.conf", "w") as f:
            f.write(generate_nginx(domain))
        print(f"📄 nginx.prod.conf created for {domain}")
