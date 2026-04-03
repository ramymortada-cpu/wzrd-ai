# Task Brief 7: Catch-all / Polish

## Context
This is the final task of Sprint 4. It serves as a catch-all for any remaining polish, bug fixes, or minor enhancements identified during the sprint. The primary goal is to ensure the entire Sprint 4 feature set (RAG, Credits, PostHog, Design Health Check, PDF Export, Email Notifications) is stable, integrated, and ready for production deployment.

## Target Files
- `server/_core/index.ts` (startup checks)
- `client/src/App.tsx` (global state/UI polish)
- `package.json` (dependency cleanup)
- Any files modified in Tasks 1-6 that require final adjustments.

## Step-by-Step Instructions

1.  **Smoke Testing & QA:**
    - Run a full end-to-end test of the user journey: Signup -> Free Tool -> Premium Upgrade -> PDF Download -> Email Receipt.
    - Verify PostHog events are firing correctly at each step.
    - Verify credit balances are updating accurately and no race conditions exist.
    - Verify the Design Health Check tool captures screenshots and returns valid AI responses.

2.  **Code Cleanup:**
    - Remove any `console.log` or temporary debugging statements added during development.
    - Ensure all new functions and endpoints have appropriate TypeScript types and JSDoc comments.
    - Run `pnpm lint` and `pnpm typecheck` to ensure no new warnings or errors were introduced.

3.  **UI/UX Polish:**
    - Check the loading states for the new Design Health Check tool and Premium PDF generation. Ensure they provide clear feedback to the user.
    - Verify the Arabic translations for all new UI elements (tool names, buttons, email subjects).

4.  **Deployment Prep:**
    - Update `DEPLOYMENT.md` or the ops checklist with any new environment variables required (e.g., `OPENAI_API_KEY` for embeddings, `PAYMOB_*` keys, `RESEND_API_KEY`).
    - Ensure the database schema changes (e.g., vector embeddings) are documented and ready for migration.

## Expected Outcome
- The codebase is clean, typed, and linted.
- All Sprint 4 features work seamlessly together.
- The application is ready for deployment to the staging/production environment.

## Verification
- Run `pnpm run dev`.
- Perform the end-to-end smoke test.
- Verify all CI checks pass locally.
