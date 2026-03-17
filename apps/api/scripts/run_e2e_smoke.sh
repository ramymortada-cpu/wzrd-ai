#!/usr/bin/env bash
# Run E2E smoke tests. Runs each test in isolation to avoid event loop/Redis issues.
set -e
cd "$(dirname "$0")/.."
failed=0
for t in test_e2e_webhook_to_stream_to_worker_to_db test_e2e_webhook_unknown_phone_number_id_skipped test_e2e_escalation_path test_e2e_unknown_intent_path; do
  echo ">>> $t"
  uv run pytest "tests/integration/test_e2e_smoke.py::$t" -v || failed=1
done
[ $failed -eq 0 ] && echo "All E2E smoke tests passed." || exit 1
