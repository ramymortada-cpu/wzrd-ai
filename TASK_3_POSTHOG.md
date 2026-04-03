# Task Brief 3: Deepen PostHog Funnels

## Context
Currently, PostHog is initialized in `client/src/main.tsx` and tracks pageviews (`$pageview`) in `client/src/App.tsx`. It also tracks `quick_check_submitted` and `premium_report_purchased`. We need to deepen this tracking to build complete funnels for:
1. Signup & Login
2. Tool Selection & Execution
3. Report Download & Dashboards

## Target Files
- `client/src/pages/auth/Login.tsx` (or similar)
- `client/src/pages/auth/Signup.tsx` (or similar)
- `client/src/pages/Tools.tsx`
- `client/src/pages/tools/ToolPage.tsx`
- `client/src/pages/Dashboard.tsx` (or similar)
- `client/src/components/ReportDownload.tsx` (or similar)

## Step-by-Step Instructions

1.  **Signup & Login Tracking:**
    In the signup and login components, add `posthog.capture` calls upon successful authentication.
    - `posthog.capture('user_signed_up', { method: 'email' })`
    - `posthog.capture('user_logged_in', { method: 'email' })`
    - Also, call `posthog.identify(user.id, { email: user.email, name: user.name })` to link events to the specific user.

2.  **Tool Selection & Execution:**
    In `client/src/pages/Tools.tsx`, track when a user clicks on a specific tool card.
    - `posthog.capture('tool_selected', { toolId: tool.id, toolName: tool.name })`
    In `client/src/pages/tools/ToolPage.tsx`, track when the user submits the form to run the tool.
    - `posthog.capture('tool_execution_started', { toolId: config.id })`
    And when the result is returned successfully:
    - `posthog.capture('tool_execution_completed', { toolId: config.id, score: result.score })`

3.  **Report Download & Dashboards:**
    Track when a user views their dashboard or downloads a report.
    - In the dashboard component: `posthog.capture('dashboard_viewed')`
    - When clicking the "Download PDF" or "Send to Email" buttons in the report view:
      - `posthog.capture('report_downloaded', { toolId: config.id, format: 'pdf' })`
      - `posthog.capture('report_emailed', { toolId: config.id })`

4.  **Premium Upgrades:**
    Ensure the `premium_report_purchased` event is fired correctly when a user upgrades from a free preview to a full report.

## Expected Outcome
- PostHog captures a comprehensive set of events.
- Funnels can be built in the PostHog dashboard to track conversion rates from signup -> tool selection -> execution -> premium upgrade -> download.
- User identification is properly set up.

## Verification
- Run `pnpm run dev`.
- Open the browser console and check the network tab for PostHog requests (`/e/` or `/capture/`).
- Perform a full flow: Signup -> Select Tool -> Run Tool -> Upgrade -> Download.
- Verify all events are sent with the correct properties.
