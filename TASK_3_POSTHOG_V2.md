# Sprint 4 / Task 3: Deepen PostHog Funnels & User Identification

## Context

PostHog is initialized in `client/src/main.tsx` with `VITE_POSTHOG_KEY`. Currently, only **3 events** are tracked across the entire app:

| Event | File | Line | Properties |
|---|---|---|---|
| `$pageview` | `App.tsx` | 145 | `{ path }` |
| `quick_check_submitted` | `QuickCheck.tsx` | 71 | `{ industry }` |
| `premium_report_purchased` | `ToolPage.tsx` | 545 | `{ toolId, source }` |

There is **no `posthog.identify()`** call anywhere. This means all events are anonymous — we cannot build user-level funnels, cohorts, or retention analysis. This task adds user identification and a comprehensive event layer across the full user journey.

## Objectives

1. Add `posthog.identify()` on signup and login so all events are attributed to the correct user.
2. Add `posthog.capture()` calls at every key conversion point to enable full-funnel analysis.
3. Guard every `posthog` call with `if (import.meta.env.VITE_POSTHOG_KEY)` to avoid errors when the key is not set (same pattern already used in `QuickCheck.tsx` and `ToolPage.tsx`).

## Step-by-Step Implementation

### 1. User Identification — `Signup.tsx` and `Login.tsx`

**File: `client/src/pages/Signup.tsx`**
- Add `import posthog from 'posthog-js';` at the top.
- Inside `handleSubmit`, after the `if (result?.success)` check (line ~69), before `navigate('/tools/brand-diagnosis')`, add:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.identify(String(result.user?.id), {
    email: form.email,
    name: form.name,
    industry: form.industry || undefined,
    company: form.company || undefined,
  });
  posthog.capture('user_signed_up', {
    method: 'email',
    industry: form.industry || undefined,
    hasReferral: Boolean(refCode),
  });
}
```

**File: `client/src/pages/Login.tsx`**
- Add `import posthog from 'posthog-js';` at the top.
- Inside `verifyCode`, after the `if (result?.success)` check (line ~78), before `navigate('/tools')`, add:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.identify(String(result.user?.id ?? email), {
    email,
  });
  posthog.capture('user_logged_in', { method: 'magic_link' });
}
```

> **Note:** The login response (`auth.verifyLogin`) may or may not return a `user` object. If it does, use `result.user.id`. If it only returns `{ success: true }`, use the `email` variable as the distinct ID — PostHog will merge it with the numeric ID once `identify` is called again on the next page load.

### 2. Identify on App Load — `useAuth.ts` or `App.tsx`

When a user returns to the app (already logged in), we need to re-identify them. The best place is in `client/src/_core/hooks/useAuth.ts`, inside the `useMemo` block where `meQuery.data` is available.

**File: `client/src/_core/hooks/useAuth.ts`**
- Add `import posthog from 'posthog-js';` at the top.
- Inside the `useMemo` callback, after `localStorage.setItem(...)`, add:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY && meQuery.data?.id) {
  posthog.identify(String(meQuery.data.id), {
    email: meQuery.data.email || undefined,
    name: meQuery.data.name || undefined,
    credits: meQuery.data.credits ?? undefined,
  });
}
```

This ensures that even if the user refreshes the page, PostHog knows who they are.

### 3. Tool Selection — `Tools.tsx`

**File: `client/src/pages/Tools.tsx`**
- Add `import posthog from 'posthog-js';` at the top.
- On the tool card's `onClick` handler (the `<button>` that navigates to the tool page), add before `navigate(tool.route)`:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('tool_selected', { toolId: tool.id, toolName: tool.name });
}
```

### 4. Tool Execution — `ToolPage.tsx`

**File: `client/src/pages/tools/ToolPage.tsx`**
PostHog is already imported. Add the following events:

**a) Tool execution started** — Inside `onSubmit`, right after `setLoading(true)` and before the fetch call:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('tool_execution_started', { toolId: config.id });
}
```

**b) Tool execution completed** — After `setResult(toolResult)` (in the non-paywall branch, line ~512):

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('tool_execution_completed', {
    toolId: config.id,
    score: toolResult.score,
    creditsUsed: toolResult.creditsUsed,
  });
}
```

**c) Tool execution failed** — In the `catch` block of `onSubmit` (line ~519):

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('tool_execution_failed', { toolId: config.id });
}
```

**d) Free preview shown** — After `setFreePreview(preview)` (line ~491):

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('free_preview_shown', {
    toolId: config.id,
    score: preview.score,
  });
}
```

**e) Full diagnosis unlocked** — After `setResult(toolResult)` inside `handleUnlockFullDiagnosis` (line ~543):
The `premium_report_purchased` event is already tracked here. No change needed.

### 5. Credits Purchase — `Pricing.tsx`

**File: `client/src/pages/Pricing.tsx`**
- Add `import posthog from 'posthog-js';` at the top.
- Inside `purchasePlan`, after the redirect check `if (result?.success && result?.redirectUrl)`, before `window.location.href = result.redirectUrl`:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('credits_purchase_initiated', {
    planId,
    hasPromo: Boolean(promoCode.trim()),
  });
}
```

### 6. Copilot Message — `Copilot.tsx`

**File: `client/src/pages/Copilot.tsx`**
- Add `import posthog from 'posthog-js';` at the top.
- After a successful copilot message send (wherever the response is received and displayed), add:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('copilot_message_sent');
}
```

### 7. Review Submitted — `ReviewModal.tsx`

**File: `client/src/components/ReviewModal.tsx`**
- Add `import posthog from 'posthog-js';` at the top.
- After the review is successfully submitted (the success callback), add:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('review_submitted', {
    rating: selectedRating,
    toolId,
  });
}
```

### 8. Competitive Benchmark — `CompetitiveBenchmark.tsx`

**File: `client/src/pages/CompetitiveBenchmark.tsx`**
- Add `import posthog from 'posthog-js';` at the top.
- On form submit (start), add:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('competitive_benchmark_started');
}
```

- On result received, add:

```typescript
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.capture('competitive_benchmark_completed');
}
```

## Complete Event Catalog (After This Task)

| Event | Properties | Funnel Stage |
|---|---|---|
| `$pageview` | `path` | Awareness |
| `quick_check_submitted` | `industry` | Activation |
| `user_signed_up` | `method, industry, hasReferral` | Activation |
| `user_logged_in` | `method` | Activation |
| `tool_selected` | `toolId, toolName` | Engagement |
| `tool_execution_started` | `toolId` | Engagement |
| `free_preview_shown` | `toolId, score` | Engagement |
| `tool_execution_completed` | `toolId, score, creditsUsed` | Engagement |
| `tool_execution_failed` | `toolId` | Engagement |
| `premium_report_purchased` | `toolId, source` | Revenue |
| `credits_purchase_initiated` | `planId, hasPromo` | Revenue |
| `copilot_message_sent` | — | Engagement |
| `competitive_benchmark_started` | — | Engagement |
| `competitive_benchmark_completed` | — | Engagement |
| `review_submitted` | `rating, toolId` | Retention |

## Funnels You Can Build in PostHog After This

1. **Signup → First Tool → Premium Upgrade:** `user_signed_up` → `tool_execution_completed` → `premium_report_purchased`
2. **Quick Check → Signup → Tool:** `quick_check_submitted` → `user_signed_up` → `tool_execution_started`
3. **Tool → Purchase:** `tool_execution_completed` → `credits_purchase_initiated`
4. **Free Preview → Unlock:** `free_preview_shown` → `premium_report_purchased`

## Verification

1. Run `pnpm run dev` with `VITE_POSTHOG_KEY` set.
2. Open browser DevTools → Network tab → filter by `posthog` or `/e/`.
3. Sign up a new user → verify `user_signed_up` event with `identify` call.
4. Run a tool → verify `tool_execution_started` and `tool_execution_completed` events.
5. Go to Pricing → click Buy → verify `credits_purchase_initiated` event.
6. In PostHog dashboard → Events → verify all new events appear with correct properties.
