#!/usr/bin/env bash
# Writes ~/Desktop/FULL_CODE_AUDIT.md — from repo root: bash scripts/full-code-audit-desktop.sh
set +e
OUT="${FULL_CODE_AUDIT_OUT:-$HOME/Desktop/FULL_CODE_AUDIT.md}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

rm -f "$OUT"
touch "$OUT"

{
  echo "## 1. TypeScript Check"
  pnpm exec tsc --noEmit 2>&1
  echo ""
} >>"$OUT"

{
  echo "## 2. Tests"
  pnpm vitest run 2>&1 | tail -20
  echo ""
} >>"$OUT"

{
  echo "## 3. Security Audit"
  pnpm audit --prod 2>&1
  echo ""
} >>"$OUT"

{
  echo "## 4. File Counts"
  find . \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | wc -l
  wc -l client/src/App.tsx client/src/routes/ClientRoutes.tsx client/src/routes/AgencyRoutes.tsx client/src/routes/AdminRoutes.tsx client/src/components/ClientLayout.tsx client/src/components/AgencyLayout.tsx client/src/components/AdminLayout.tsx client/src/components/RoleSwitcher.tsx 2>&1
  echo ""
} >>"$OUT"

{
  echo "## 5. Dangerous Patterns"
  echo "### dangerouslySetInnerHTML:"
  grep -rn "dangerouslySetInnerHTML" client/src/ --include="*.tsx" 2>&1
  echo "### ctx.user! in public procedures:"
  grep -rn "publicProcedure" server/routers/*.ts 2>/dev/null | grep "ctx.user!" 2>&1 || true
  echo "### JSON.parse without try/catch (heuristic):"
  grep -rn "JSON.parse" server/ --include="*.ts" 2>/dev/null | grep -vE "try|catch|\.test\.|node_modules|__tests__" 2>&1 || true
  echo "### DB update/delete without .where() (heuristic):"
  grep -rnE '\.(update|delete)\(' server/ --include="*.ts" 2>/dev/null | grep -vE '\.where\(|test|node_modules|migration|__tests__' 2>&1 || true
  echo ""
} >>"$OUT"

{
  echo "## 6. Route Structure"
  echo "### App.tsx routes:"
  grep -n "Route path\|Redirect\|ClientRoutes\|AgencyRoutes\|AdminRoutes" client/src/App.tsx 2>&1
  echo "### ClientRoutes:"
  grep -n "Route path\|import.*lazy" client/src/routes/ClientRoutes.tsx 2>&1
  echo "### AgencyRoutes:"
  grep -n "Route path\|import.*lazy" client/src/routes/AgencyRoutes.tsx 2>&1
  echo "### AdminRoutes:"
  grep -n "Route path\|import.*lazy" client/src/routes/AdminRoutes.tsx 2>&1
  echo ""
} >>"$OUT"

{
  echo "## 7. Auth & RBAC"
  grep -rn "protectedProcedure\|publicProcedure\|checkOwner\|checkEditor\|isOwnerAdmin\|canAccessCommandCenter" server/routers/*.ts client/src/components/*Layout.tsx 2>/dev/null | head -50
  echo ""
} >>"$OUT"

{
  echo "## 8. Full Audit Backend"
  grep -n "run:\|myAudits:\|getAudit:\|generatePdf:\|generateStrategyPack:\|buildActionPlan\|calculateConfidence\|buildLimitations\|clampScores\|detectInflation\|getSourceForPillar\|getLanguageInstruction\|getToneExamples" server/routers/fullAudit.ts 2>&1
  echo ""
} >>"$OUT"

{
  echo "## 9. Pricing & Credits"
  cat shared/const.ts 2>&1
  echo "### TOOL_COSTS:"
  grep -A20 "TOOL_COSTS" server/db/credits.ts 2>&1
  echo ""
} >>"$OUT"

{
  echo "## 10. Security Layers"
  echo "### Rate limiting:"
  grep -n "app.use.*rateLimit\|rateLimiters" server/_core/middleware.ts 2>&1
  echo "### CORS:"
  grep -n "ALLOWED_ORIGINS\|cors\|Access-Control" server/_core/security.ts 2>&1
  echo "### Headers:"
  grep -n "X-Frame\|nosniff\|Strict-Transport\|Referrer-Policy" server/_core/security.ts 2>&1
  echo "### Session:"
  grep -n "SESSION_MAX_AGE\|httpOnly\|secure\|sameSite" server/_core/cookies.ts 2>&1
  echo ""
} >>"$OUT"

{
  echo "## 11. Old Routes Check (should be 0)"
  grep -rnE "navigate\('/dashboard'|navigate\('/clients'|navigate\('/tools'" client/src/ --include="*.tsx" 2>/dev/null | grep -vE "/app/|/cc/|/admin/" 2>&1 || true
  echo ""
} >>"$OUT"

{
  echo "## 12. Schema"
  grep -n "mysqlTable\|export const" drizzle/schema.ts 2>/dev/null | head -60
  echo ""
} >>"$OUT"

{
  echo "## 13. PDF Generator"
  wc -l server/fullAuditPdf.ts server/pdfGenerator.ts 2>&1
  grep -n "Amiri\|puppeteer\|buildRadarSvg\|escapeHtml\|BRAND" server/fullAuditPdf.ts 2>/dev/null | head -15
  echo ""
} >>"$OUT"

{
  echo "## 14. Environment"
  grep -n "validateCriticalEnv\|process.env\." server/_core/env.ts 2>/dev/null | head -20
  echo ""
} >>"$OUT"

echo "AUDIT COMPLETE" >>"$OUT"
echo "Wrote $OUT"
