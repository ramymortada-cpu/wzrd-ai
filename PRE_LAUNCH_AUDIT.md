# WZZRD AI — Pre-Launch Audit Report

This report provides a comprehensive, critical analysis of the WZZRD AI codebase, infrastructure, and user experience prior to production launch. The findings are categorized by severity to guide immediate action versus post-launch improvements.

## 1. Critical Blockers (Must Fix Before Launch)

These issues directly impact core functionality, user trust, or system stability and must be resolved before directing real traffic to the application.

### Missing Critical Pages
Several pages linked from the main navigation or core user flows do not exist, resulting in a broken user experience.
- **`/pricing`**: Linked from the `Welcome` page and `Tools` page, but the route and component are missing. Users cannot view pricing tiers.
- **`/services-info`**: Linked from multiple places, but the page does not exist.
- **`/reports`**: The public reports library is linked but missing. The current `Reports.tsx` relies on hardcoded `PLACEHOLDER_REPORTS` and broken API endpoints (`reportsLib.download`).

### Hardcoded Placeholders in Production Paths
Several areas of the application still rely on placeholder data that will confuse or block users.
- **WhatsApp Number**: `server/siteConfig.ts` uses `201XXXXXXXXX` as a placeholder. If the environment variable `VITE_WHATSAPP_E164` is not set correctly, users will be directed to an invalid number.
- **Onboarding Form**: `client/src/pages/Onboarding.tsx` has hardcoded placeholders like `+966 5XX XXX XXXX` and `email@example.com` which may be submitted if validation is weak.
- **Research Engine**: `server/researchEngine.ts` contains `TODO: Implement real Google Custom Search API here` and `TODO: Implement real Academic Search API`. The research engine is currently non-functional or returning mocked data.

### Duplicate Migration Numbers
The database migration folder (`drizzle/`) contains duplicate prefixes, which will cause the migration runner to fail or execute out of order.
- `0011_add_fk_indexes_softdelete_audit.sql`
- `0011_cynical_vance_astro.sql`
- `0022_acquisition_engine.sql`
- `0022_blog_posts.sql`

## 2. High Priority (Should Fix Before Launch)

These issues affect brand consistency, security, or operational visibility.

### Brand Inconsistencies (Primo Marca vs. WZZRD AI)
The application is transitioning from "Primo Command Center" to "WZZRD AI", but numerous legacy references remain.
- **`package.json`**: The project name is still `primo-command-center`.
- **`server/siteConfig.ts`**: Contains `companyName: 'Primo Marca'` and `email: 'hello@primomarca.com'`.
- **Client UI**: Multiple references to "Primo Marca" exist in `DashboardLayout.tsx`, `OnboardingTour.tsx`, and `i18n.tsx` (e.g., "Why Wzrd AI" vs "Talk to Primo Marca").

### Missing SEO and Open Graph Tags
The application lacks basic SEO metadata.
- There are zero instances of `og:title`, `og:image`, or `twitter:card` in the client codebase.
- `react-helmet-async` is not utilized to set dynamic titles or meta descriptions per page, which will severely impact social sharing and search engine visibility.

### Unprotected Public Routes
Several TRPC routes are exposed publicly without adequate rate limiting or protection.
- `feedback.publicCreate` and `feedback.publicSubmit`
- `leads.submitQuickCheck` and `leads.subscribeToLeadMagnet`
- `onboarding.submit`

## 3. Medium Priority (Post-Launch Polish)

These items represent technical debt or UX improvements that can be addressed after the initial launch.

### Error Handling and Boundaries
While an `ErrorBoundary` component exists, it is only applied at the top level of `App.tsx`. Granular error boundaries around specific tools or dashboard sections would prevent a single component failure from crashing the entire application.

### Logging and Monitoring
The codebase contains 28 instances of raw `console.log`, `console.error`, or `console.warn`. These should be replaced with the structured logger to ensure errors are properly captured in Sentry and the server logs.

### Docker Healthcheck Configuration
The `Dockerfile` defines a healthcheck pointing to `/healthz`. However, the server binds to `localhost` by default in some configurations, which may cause the Docker healthcheck to fail if not explicitly bound to `0.0.0.0`.

## Summary Recommendations

To proceed with the launch, the immediate focus must be on resolving the **Critical Blockers**. The missing pages (`/pricing`, `/services-info`) must be created or their links removed. The duplicate migration numbers must be resolved to ensure database stability. Finally, all hardcoded placeholders, especially in the research engine and contact information, must be replaced with functional code or correct environment variables.
