# PROMPTS.md

A chronological list of every prompt I used with **Claude Code (Anthropic)** as my pair-programmer while building this project. Prompts are quoted verbatim or lightly paraphrased where they were essentially the same instruction repeated.

The development was run as **nine sequential phases** with a verification gate after each — I did not move to the next phase until I had personally confirmed the previous one worked.

---

## Pre-development

**Prompt 1 — Understand and plan**

> understand deeply about task.md file. prepare proper execution plan
>
> use shadcn UI, use React context API, use mongoDB (i will provide connection string), use Langchain if need else use prompt engineering along with openrouter API and free gpt models, use custom JWT based middleware for Authentication Simulation..
>
> okay so prepare plan .. you have any questions or concern let's clarify that before plan.

Claude responded with five clarifying questions about ambiguities in the spec (Nest.js + Server Actions wording, sync vs async AI, tenant provisioning, audit scope, OpenRouter model). I answered:
- Use a **separate NestJS backend** (literal reading of spec)
- **Async with polling** for AI
- **Seed-only** tenant provisioning
- **All case edits** in the audit trail
- (deferred model choice — switched to gpt-4o-mini later)

Claude then produced a 9-phase build plan.

---

## Phase 1 — Backend foundation

**Prompt 2**
> confirmed. you can begin. what you can do maintain high quality code standards and clean architecture.

**Prompt 3 (interrupt during scaffold)**
> i stopped the tool then i manully run the command of frontend and backend folder kindly look and starts next progress. let's complete phase one by one.. we can move the next phase until i get my verification.

**Prompt 4**
> okay start keep in mind we dont need to write any test cases.

What Claude built in Phase 1:
- Backend dependencies installed
- `.env` + Zod env validation
- `AppConfigModule` (global, typed config service)
- `DatabaseModule` (Mongoose async with lifecycle logs)
- Global `ValidationPipe`, CORS, cookie-parser, `/api/v1` prefix
- `GlobalExceptionFilter` (structured error responses)
- `HealthModule` with `/health` endpoint reporting Mongo state

Verified `curl http://localhost:4000/api/v1/health` → `{"status":"ok","services":{"mongodb":"connected"}}`.

---

## Phase 2 — Auth + Tenants/Users + Seed

**Prompt 5**
> let's gooooo

What Claude built:
- `Tenant` and `User` Mongoose schemas
- bcrypt password hashing in `UsersService`
- `AuthService` + `AuthController` (login, logout, `/me`)
- **Custom JWT** in httpOnly cookie (`cas_session`)
- `JwtAuthGuard` (reads cookie, verifies via `@nestjs/jwt`)
- `RolesGuard` + `@Roles()` decorator
- `@CurrentUser()` param decorator
- Seed script — 2 firms × 2 users (Acme + Brightline; Partner + Associate)

Verified end-to-end with curl: login sets cookie, `/auth/me` returns user, wrong password → 401, cross-tenant login works, logout clears cookie.

---

## Phase 3 — Tenant scoping + Cases CRUD

**Prompt 6**
> okay go with phase 3...
>
> do smart work to reduce token usuage of cluade.

What Claude built:
- `Case` Mongoose schema with `ai` and `override` sub-documents
- `CreateCaseDto`, `UpdateCaseDto`, `ListCasesQuery` with class-validator
- `CasesService` — every query forced through `findOwnedOrThrow(user, id)` which filters by `tenantId`
- `CasesController` with full CRUD behind `JwtAuthGuard`

**Key security verification:** Acme tries `GET /cases/{Brightline-case-id}` → **404** (not 403, to prevent enumeration). Brightline tries `PATCH /cases/{Acme-case-id}` → **404**. Owner GET own case → 200.

---

## Phase 4 — AI integration

**Prompt 7**
> okay go with phase 4...
>
> i have some credits left on openrouter wallet so use gpt model like gpt 4o something.

What Claude built:
- Switched default model to `openai/gpt-4o-mini`
- `AiClassificationService` using OpenAI SDK pointed at OpenRouter
- Zod schema for AI response (`riskLevel`, `jurisdiction`, `reasoning`)
- Retry logic: 2 attempts, second with stricter "JSON-only" reminder
- Markdown-fence stripping, 30s timeout
- In-process `QueueService` with concurrency limit (3 jobs)
- Case create now returns 202-style flow: case saved as PENDING, AI runs in background
- `POST /cases/:id/retry-ai` endpoint (409 if already PENDING)

Verified against real OpenRouter API: created a $50M class-action summary, polled status, got `riskLevel: HIGH`, `jurisdiction: California state court`, coherent reasoning — all correct.

---

## Phase 5 — Audit trail + Partner override

**Prompt 8**
> okay go with phase 5...
>
> do smart work to reduce token usuage of cluade.

What Claude built:
- `AuditLog` schema with `AuditChange[]` sub-documents
- `AuditAction` enum (`CASE_CREATED`, `CASE_UPDATED`, `AI_GENERATED`, `AI_FAILED`, `AI_RETRIED`, `AI_OVERRIDDEN`, `CASE_DELETED`)
- `AuditService.record()` — denormalizes `actorName` + `actorRole` at write time
- Audit hooks in every `CasesService` method (create/update/delete/retry + the AI worker on success/fail)
- `PATCH /cases/:id/classification` — Partner-only via `@Roles(UserRole.Partner)`
- Override-on-top model: `case.ai.*` never mutated; overrides land in `case.override.*`
- `GET /cases/:id/audit` and `GET /audit` endpoints

Verified full workflow: Associate creates → AI classifies → Associate edits title → Associate tries override → 403 → Partner overrides → audit trail shows all 4 events chronologically with correct actor names. Brightline Partner reading Acme's audit → 404.

---

## Backend enhancements (mid-stream request)

**Prompt 9**
> okay before to move forward with frontend... let's enhance backend...
>
> in backend dto use omit type and partial type some places needed...
>
> in backend we can add rate limitter ?

What Claude built:
- `UpdateCaseDto extends PartialType(CreateCaseDto)` via `@nestjs/mapped-types`
- New `ClassificationFieldsDto` (required all 3) + `OverrideClassificationDto extends PartialType(...)`
- Honest pushback: no clean `OmitType` fit in current DTOs without fabricating a parent type — left it open for later
- `@nestjs/throttler` wired globally via `APP_GUARD`
- Default: 100/min/IP
- `/auth/login`: 5/min (brute-force)
- `/cases/:id/retry-ai`: 10/min (AI cost cap)

Verified: 6th rapid login → `429 ThrottlerException`. PartialType DTOs reject empty body, accept partial, reject unknown fields.

---

## Phase 6 — Frontend foundation

**Prompt 10**
> okay let's gp with phase 6/...
>
> this is all about user experience.. we have to feel luxury primium like apple and other more..
>
> clean UI, smooth scroll and transition if ... for that you can use skills of threejs and lenis scroll..

Claude proposed a stack table (Shadcn + GSAP + Lenis + dark default + warm-gold accent) and recommended skipping three.js as gimmicky for a legal app.

**Prompt 11 (interrupt during scaffold)**
> i stopped the tool then i manully run the command of frontend and backend folder

**Prompt 12**
> i manully intializw shadcn with defaults kindly check and resume after that...

What Claude built:
- Premium dark theme (oklch warm-tinted neutrals, gold accent at `oklch(0.78 0.13 70)`, glass utility, radial gradient body overlay)
- Shadcn components: button, card, input, label, textarea, badge, dialog, dropdown-menu, skeleton, separator, sonner, tabs, avatar
- `SmoothScroll` component (Lenis, respects `prefers-reduced-motion`)
- `AuthContext` via React Context API (login/logout/me/refresh)
- Typed `api()` fetch wrapper with `credentials: 'include'` and `ApiError` class
- `/login` page with GSAP staggered fade-up entrance, demo-account picker, two-pane layout

Verified: type-check clean, all routes 200, full login → cookie → `/auth/me` round-trip works.

---

## Phase 7 — Frontend cases

**Prompt 13**
> okay go with phase 7...
>
> do smart work to reduce token usuage of cluade.

What Claude built:
- Dashboard route group `(dashboard)/` with auth-guarded sticky glass header
- `/cases` list with filter tabs (All / Classifying / Classified / Failed), GSAP stagger, empty state, list-level polling every 2.5s if any case is PENDING
- `/cases/new` submit form with live character counts
- `/cases/[id]` detail page with three tabs (Overview / Summary / Audit)
- Polling every 2s while case is PENDING; stops on COMPLETED/FAILED
- `RotateCcwIcon` retry button only on FAILED cases
- `AiStatusBadge`, `RiskBadge` reusable components
- `OverrideDialog` (Partner-only, with risk tabs + jurisdiction + reasoning inputs)
- `AuditTimeline` (vertical timeline with per-action icons, actor chips, old/new diff cards)
- `case-helpers.ts` — `effectiveRisk`, `effectiveJurisdiction`, `effectiveReasoning`, `isFieldOverridden`, `formatRelative`

Discovered mid-build that shadcn `base-nova` uses Base UI (not Radix) → no `asChild`. Refactored to `<Link className={buttonVariants(...)}>` for navigation buttons and `render={<Component/>}` for triggers.

Verified: 5 routes 200, full role-gated flow works end-to-end.

---

## Phase 8 — Tenant audit feed + bug fixes

**Prompt 14**
> okay go with phase 8...
>
> do smart work to reduce token usuage of cluade.
>
> when i click on top right header AA Alice getting error [browser] Uncaught Error: Base UI: MenuGroupRootContext is missing.
>
> one more thing add password show hide icon functionlaity during login

What Claude built:
- **Bug fix:** wrapped `DropdownMenuLabel` and items in `DropdownMenuGroup` (Base UI requires the context)
- **Bug fix:** password show/hide toggle on login (`EyeIcon`/`EyeOffIcon` button, `aria-pressed`, `aria-label`)
- **Backend:** enriched `GET /audit` with `caseTitle` via Mongo `$lookup` aggregation pipeline (single round-trip; per-case audit endpoint unchanged)
- **Frontend:** `AuditTimeline` extended with optional `showCase` prop (renders a "on case → *Title*" link)
- New `/audit` page with load-more pagination (25/page)

Verified: tenant audit returns `caseTitle`; per-case audit unchanged; 5 routes 200.

---

## Error boundaries (mid-stream request)

**Prompt 15**
> i just want to know FE we implemented Error Boundry ?

Claude answered honestly: **no**. Explained current coverage (API errors → toasts) and what was missing (render-error fallback). Listed the three Next.js file conventions (`error.tsx`, `global-error.tsx`, `not-found.tsx`) and recommended adding them before shipping.

**Prompt 16**
> okay as of now let;s add once done let me know.. then i will tell to starts phase 9

What Claude built:
- `app/error.tsx` — premium-styled segment-level boundary with GSAP entry, "Try again" calling `reset()`, "Back to cases" link, error message + digest in dev only
- `app/not-found.tsx` — premium 404 page with gold-tinted icon, links to `/cases` and `/login`
- `app/global-error.tsx` — minimal self-contained root-level fallback with inline styles (theme might not be loaded yet)

Verified: `GET /this-route-does-not-exist` → 404 with not-found markup. Existing routes still 200.

---

## Code splitting (mid-stream request)

**Prompt 17**
> @frontend/src/app/(dashboard)/cases/[id]/page.tsx
>
> i think we can do code spliting here.. first

What Claude built:
- Extracted `PendingCard` + `FailedCard` into `components/cases/case-status-cards.tsx`
- Extracted `ClassificationCard` + `RiskField` + `TextField` into `components/cases/classification-card.tsx` (also cleaned up the `as never` type hack)
- Dynamic `import()` for `OverrideDialog` (~32KB chunk) via `next/dynamic` with `{ ssr: false, loading: <Skeleton/> }` — only Partners on COMPLETED cases hit this chunk
- Dynamic `import()` for `AuditTimeline` (~12KB chunk) with an `auditOpenedOnce` state gate — chunk doesn't even start downloading until the user clicks the Audit tab
- `cases/[id]/page.tsx` shrunk from 408 lines → ~245 lines

Verified by inspecting `.next/static/chunks` after production build: both lazy components live in their own chunks separate from the main page bundle.

---

## Phase 9 — Docs + final QA

**Prompt 18**
> let's go phase 9

This phase produced:
- `README.md` — full project documentation, architecture, multi-tenant security writeup, API reference, walkthrough, decisions/tradeoffs
- `PROMPTS.md` — this file
- Final QA: backend build clean, frontend build clean, both boot

---

## Notes on how I used the AI

A few patterns I leaned on heavily:

**Phase gates.** I never moved to the next phase until I'd personally verified the previous one — by reading the diff, running curl tests, and clicking through the UI. This caught bugs early (dropdown crash on Phase 8, the `as never` hack, the base-ui `asChild` mismatch).

**Honesty over agreement.** Whenever I asked "did we do X?" I expected a direct yes/no, not handwaving. When I asked about Error Boundaries on Phase 8, the answer was a clear "no" with what's missing and what to add — not a soft "well, we kind of have...".

**Token discipline.** I asked Claude to "do smart work to reduce token usage" before several phases. In practice this meant: write each file once and well, batch related edits, run parallel tool calls where possible, and not re-read files unnecessarily.

**Manual interventions.** Twice I stopped Claude's automatic project scaffolding (`npx @nestjs/cli`, `npx shadcn init`) because I preferred to run them myself in my terminal. Claude resumed cleanly from the resulting state both times.

**Pushback when warranted.** When I asked for `OmitType` usage, Claude pushed back honestly that there wasn't a clean fit and proposed `PartialType` where it did fit instead of fabricating a parent type. When I mentioned three.js for the premium feel, Claude proposed skipping it as gimmicky for a legal app. Both were the right calls.
