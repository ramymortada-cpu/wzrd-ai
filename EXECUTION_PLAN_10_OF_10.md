# Primo Command Center — خطة الوصول لـ 10/10

**التاريخ:** 19 مارس 2026
**الهدف:** رفع التقييم من 5.7/10 → 10/10
**المنهجية:** إصلاح كل بُعد بالترتيب حسب التأثير

---

## المرحلة 1: Database Architecture (5 → 10)

### 1.1 Foreign Key Constraints ⚡ حرج
```
- projects.clientId → clients.id
- deliverables.projectId → projects.id
- clientNotes.clientId → clients.id
- clientNotes.projectId → projects.id
- payments.projectId → projects.id
- payments.clientId → clients.id
- aiConversations.projectId → projects.id
- aiConversations.clientId → clients.id
- proposals.clientId → clients.id
- onboardingSessions.clientId → clients.id
- clientPortalTokens.projectId → projects.id
- clientPortalTokens.clientId → clients.id
- researchReports.clientId → clients.id
- researchReports.projectId → projects.id
- knowledgeEntries.clientId → clients.id
- knowledgeEntries.projectId → projects.id
- pipelineRuns.clientId → clients.id
- pipelineRuns.projectId → projects.id
- brandHealthSnapshots.clientId → clients.id
- brandAlerts.clientId → clients.id
- brandAlerts.snapshotId → brandHealthSnapshots.id
- brandMetrics.clientId → clients.id
- brandMetrics.snapshotId → brandHealthSnapshots.id
- leads.clientId → clients.id
- leads.proposalId → proposals.id
- proposalAcceptances.proposalId → proposals.id
- proposalAcceptances.clientId → clients.id
- deliverableFeedback.deliverableId → deliverables.id
- deliverableRevisions.deliverableId → deliverables.id
- deliverableComments.deliverableId → deliverables.id
- deliverableComments.parentId → deliverableComments.id
- deliverableApprovals.deliverableId → deliverables.id
```

### 1.2 Database Indexes ⚡ حرج
```
- clients(status)
- projects(clientId, status)
- projects(stage)
- deliverables(projectId, status)
- deliverables(stage)
- payments(projectId, status)
- payments(clientId, status)
- aiConversations(projectId)
- aiConversations(clientId)
- proposals(clientId, status)
- clientPortalTokens(token)  — already unique
- clientPortalTokens(projectId)
- researchCache(cacheKey)
- researchReports(clientId)
- knowledgeEntries(category, isActive)
- pipelineRuns(clientId, status)
- brandHealthSnapshots(clientId)
- brandAlerts(clientId, status)
- brandMetrics(clientId)
- leads(scoreLabel, status)
- leads(email)
- deliverableRevisions(deliverableId, version)
- deliverableComments(deliverableId)
- deliverableApprovals(deliverableId)
```

### 1.3 Soft Delete
- إضافة `deletedAt` column لـ: clients, projects, deliverables, proposals, knowledgeEntries

### 1.4 Audit Trail
- إنشاء `audit_log` table مع: entity, entityId, action, userId, changes (JSON), createdAt

### 1.5 Drizzle Relations
- ملء `relations.ts` بكل العلاقات

---

## المرحلة 2: Backend Architecture (6 → 10)

### 2.1 تقسيم routers.ts (3,200 سطر → ~15 ملف × ~200 سطر)
```
server/routers/
├── index.ts          (main router composition)
├── auth.ts           
├── clients.ts        
├── projects.ts       
├── deliverables.ts   
├── notes.ts          
├── payments.ts       
├── ai.ts             
├── conversations.ts  
├── proposals.ts      
├── portal.ts         
├── research.ts       
├── knowledge.ts      
├── pipeline.ts       
├── brandTwin.ts      
├── leads.ts          
├── onboarding.ts     
└── feedback.ts       
```

### 2.2 تقسيم db.ts (1,174 سطر → ~12 ملف)
```
server/db/
├── index.ts          (getDb + re-exports)
├── users.ts          
├── clients.ts        
├── projects.ts       
├── deliverables.ts   
├── notes.ts          
├── payments.ts       
├── conversations.ts  
├── proposals.ts      
├── portal.ts         
├── research.ts       
├── knowledge.ts      
├── pipeline.ts       
├── brand.ts          
├── leads.ts          
└── feedback.ts       
```

### 2.3 Rate Limiting Middleware
- express-rate-limit على كل public endpoint
- AI endpoints: 5 req/min
- Quick-check: 3 req/min
- Portal: 30 req/min
- General: 100 req/min

### 2.4 Input Validation Enhancement
- `.max(255)` على كل string field
- `.max(5000)` على text/content fields
- `.max(50000)` على AI conversation messages

### 2.5 Database Transactions
- createProject + createDeliverables → transaction
- Pipeline operations → transaction
- Approval + status update → transaction

---

## المرحلة 3: Security (4 → 10)

### 3.1 XSS Protection
- DOMPurify للـ user-generated content قبل العرض
- Server-side sanitization middleware

### 3.2 CSRF Protection
- csurf middleware أو double-submit cookie pattern

### 3.3 Portal Token Security
- SHA-256 hashing للـ stored tokens
- Constant-time comparison

### 3.4 Security Headers
- helmet.js middleware
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options

### 3.5 CORS Configuration
- Explicit origin whitelist
- Credentials handling

---

## المرحلة 4: Performance & Scalability (4 → 10)

### 4.1 Pagination
- Cursor-based pagination لكل list endpoint
- Default page size: 20
- Max page size: 100

### 4.2 Lazy Loading
- React.lazy() لكل page component
- Suspense wrapper مع loading fallback

### 4.3 Caching Layer
- In-memory cache (node-cache) للـ frequently accessed data
- Cache invalidation strategy
- Dashboard stats caching (5 min TTL)

### 4.4 Connection Pool
- Explicit MySQL2 pool configuration
- Pool size tuning

### 4.5 RAG Pipeline (AI Brain optimization)
- Smart context window management
- Selective knowledge injection
- Token budget system

---

## المرحلة 5: Frontend UI/UX (5 → 10)

### 5.1 Optimistic Updates
- كل CRUD mutation → onMutate + rollback
- Instant UI feedback

### 5.2 Empty States
- Custom empty state لكل page
- Illustration + CTA + guidance

### 5.3 Loading Skeletons
- Skeleton components لكل page
- Shimmer animation

### 5.4 Responsive Design
- ClientPortal → full responsive
- QuickCheck → mobile-first
- ProposalView → responsive

### 5.5 Accessibility
- aria-labels لكل interactive element
- Keyboard navigation
- Screen reader support
- Focus management

### 5.6 Debounce
- useDebounce hook
- Search inputs → 300ms debounce
- Filter inputs → 200ms debounce

---

## المرحلة 6: Testing (7 → 10)

### 6.1 Integration Tests
- Full flow tests: client → project → deliverables → review
- Pipeline execution flow
- Proposal generation flow

### 6.2 Frontend Tests
- React Testing Library
- Key component tests
- Form validation tests

### 6.3 Coverage Reporting
- vitest coverage configuration
- Coverage thresholds

### 6.4 E2E Tests (structure)
- Playwright setup
- Critical path tests

---

## المرحلة 7: Code Quality (5 → 10)

### 7.1 Structured Logging
- pino logger setup
- Request/response logging
- Error tracking

### 7.2 JSDoc Documentation
- All exported functions
- API documentation

### 7.3 DRY Knowledge Modules
- Merge overlapping modules
- Shared academic constants

### 7.4 Shared Constants Enhancement
- Complete status enums
- Service configuration centralized
- Price consistency fix

---

## المرحلة 8: Feature Completeness (8 → 10)

### 8.1 Notification System
- Email notification service (Resend/SendGrid ready)
- WhatsApp integration structure
- In-app notification table + UI

### 8.2 File Upload
- S3 upload endpoint in portal
- File type validation

### 8.3 Multi-user Foundation
- User-project assignments table
- Role-based access

### 8.4 Export/Reporting
- PDF export for analytics
- CSV export for data

---

## المرحلة 9: Business Value (6 → 10)

### 9.1 Guided Onboarding
- First-use tour
- Sample data seed

### 9.2 Portal Analytics
- View tracking
- Time-on-page
- Click tracking

### 9.3 Dynamic Pricing
- Pricing from database
- Admin pricing editor
