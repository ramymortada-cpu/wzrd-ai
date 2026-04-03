# Sprint 5 — Cursor Prompts for Remaining Tasks

These are ready-to-paste Cursor prompts for Tasks 8, 9, and 10. Each prompt is self-contained and can be executed independently.

---

## Task 8: Enhanced Upsell Flow

### Cursor Prompt:

```
In ToolPage.tsx, after the user unlocks a diagnosis (the "full result" view), there's currently a blurred preview → unlock flow. I need to enhance the upsell by adding a comparison table between the 3 tiers:

1. **Free Preview** (what they already got) — Score + 2-3 blurred findings
2. **Full Diagnosis** (what they just unlocked) — All findings + action items + service recommendation
3. **Premium Report** (the upsell) — Claude-powered deep analysis + executive summary + priority matrix + action plan

Add a visually appealing comparison table component AFTER the unlock section in the result view. Use the existing design system (Tailwind, zinc/indigo colors, rounded-2xl cards). The table should:
- Show 3 columns: Free / Full / Premium
- Use checkmarks (✓) and crosses (✗) for features
- Highlight the Premium column with a "Recommended" badge
- The Premium column CTA should trigger the existing `handleGeneratePremium` function
- Support both English and Arabic (use the `locale` variable, isAr pattern)
- Be responsive (stack on mobile)

Reference files:
- client/src/pages/tools/ToolPage.tsx (main file to edit)
- client/src/lib/i18n.tsx (for translations pattern)
```

---

## Task 9: Re-engagement Emails (Email Template Seeding)

### Cursor Prompt:

```
The email automation system exists in server/emailTrigger.ts but the `automation_rules` and `email_templates` tables in the database are EMPTY — no emails are actually being sent.

I need you to:

1. Create a seed file at `server/seeds/emailTemplates.ts` that inserts the following email templates and automation rules:

**Templates to create:**
- `welcome_email` — Sent after signup. Subject: "Welcome to WZZRD AI — Your brand diagnosis awaits". Body: Welcome message + CTA to run first diagnosis.
- `low_credits` — Sent when credits drop below 20. Subject: "You're running low on credits". Body: Reminder + link to pricing page.
- `diagnosis_complete` — Sent after a diagnosis is completed. Subject: "Your {toolName} diagnosis is ready". Body: Score summary + CTA to view results.
- `inactive_3d` — Sent 3 days after last activity. Subject: "Your brand is waiting for you". Body: Reminder + what they can do.
- `inactive_7d` — Sent 7 days after last activity. Subject: "Don't let your brand fall behind". Body: New features + CTA.
- `inactive_30d` — Sent 30 days after last activity. Subject: "We miss you at WZZRD AI". Body: Special offer or new tools.

**Automation rules to create:**
- `on_signup` → trigger `welcome_email`
- `on_low_credits` → trigger `low_credits`
- `on_diagnosis_complete` → trigger `diagnosis_complete`
- `on_inactive_3d` → trigger `inactive_3d`
- `on_inactive_7d` → trigger `inactive_7d`
- `on_inactive_30d` → trigger `inactive_30d`

2. Add a `seedEmailTemplates()` function that can be called from the server startup or manually.

3. In `server/emailTrigger.ts`, make sure `fireEmailTrigger()` actually sends emails via the existing email service (check if there's a Resend or SendGrid integration).

Reference files:
- server/emailTrigger.ts (the trigger system)
- drizzle/schema.ts (search for automation_rules and email_templates tables)
- server/_core/index.ts (server startup)

IMPORTANT: Check if there's already an email sending service configured (Resend, SendGrid, etc.) before implementing. If not, use console.log as a placeholder and add a TODO comment.
```

---

## Task 10: Final Hardening

### Cursor Prompt:

```
Final hardening tasks for Sprint 5:

1. **Sentry Environment Variables**: In `client/src/lib/sentry.ts`, the Sentry DSN is currently set to an empty string placeholder `VITE_SENTRY_DSN`. Make sure it reads from `import.meta.env.VITE_SENTRY_DSN` and gracefully handles the case where it's not set (don't initialize Sentry if DSN is empty/undefined).

2. **Mobile Viewport Check**: In `client/index.html`, verify the viewport meta tag is correct:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

3. **Console Cleanup**: Search for any `console.log` statements in production code (server/ and client/src/) that should be removed or replaced with the logger. Keep only intentional debug logs that use the `logger` utility.

4. **TypeScript Check**: Run `npx tsc --noEmit` and fix any type errors in the files we modified:
   - client/src/pages/tools/ToolPage.tsx
   - client/src/pages/MyReports.tsx
   - client/src/pages/Profile.tsx
   - client/src/pages/Referrals.tsx
   - client/src/pages/Copilot.tsx
   - client/src/components/WzrdPublicHeader.tsx
   - server/routers/auth.ts
   - server/routers/premium.ts
   - server/routers/copilot.ts

Reference files:
- client/src/lib/sentry.ts
- client/index.html
- server/_core/logger.ts
```

---

## How to Use These Prompts

1. Open Cursor
2. Select the relevant files mentioned in "Reference files"
3. Paste the prompt
4. Review the generated code
5. Test locally with `npm run dev`
6. Commit with the message format: `Sprint 5 Task X: [description]`
