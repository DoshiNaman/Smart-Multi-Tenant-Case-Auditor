# Smart Multi-Tenant Case Auditor

A legal-tech prototype for AI-assisted case auditing across multiple law firms with strict tenant isolation, role-gated overrides, async classification, and an immutable audit trail.

> **Status:** feature-complete prototype. Backend + frontend boot, all flows verified end-to-end.

---

## What it does

Law firms (tenants) submit legal case summaries. The system:

1. **Classifies** each case via an LLM (risk level, jurisdiction, reasoning).
2. **Isolates** every read/write by tenant — Firm A can never see Firm B data, even with tampered IDs.
3. **Gates** classification overrides to **Partners** only; Associates can submit and view.
4. **Logs** every state change to an append-only audit trail with denormalized actor info.
5. **Recovers** gracefully from AI failures (timeouts, malformed JSON, schema violations) — case stays `FAILED` with the error, never crashes the app.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 16** (App Router) + **TypeScript** | Spec requirement; modern React |
| UI | **Shadcn UI** (base-nova / Base UI primitives) | Spec requirement; accessible + owned source |
| Styling | **Tailwind CSS v4** | Bundled with shadcn |
| State | **React Context API** | Spec requirement; no Redux for prototype |
| Motion | **GSAP** (with `@gsap/react`) + **Lenis** | Premium fade-in animations + smooth scroll |
| Backend | **NestJS 11** (standalone) | Spec requirement |
| Database | **MongoDB** via **Mongoose** | Spec choice |
| Auth | **Custom JWT** in httpOnly cookies (no Passport) | Spec requirement: "custom JWT-based middleware" |
| AI | **OpenRouter** (`openai/gpt-4o-mini`) via **OpenAI SDK** + **Zod** validation | Direct SDK + prompt engineering — LangChain was overkill for one classifier call |
| Rate limit | **@nestjs/throttler** | Login brute-force protection + AI cost cap |
| Queue | In-process bounded queue (custom, ~30 LOC) | No Redis required for prototype |

---

## High-level architecture

```
┌──────────────────────────┐         ┌──────────────────────────────────┐
│   Next.js Frontend       │         │      NestJS Backend (REST)       │
│   :3000                  │ cookies │   :4000  /api/v1                 │
│                          │ ───────►│                                  │
│   AuthContext            │         │   ┌─────────────────────────┐    │
│   Lenis + GSAP           │         │   │ JwtAuthGuard            │    │
│   Shadcn UI              │         │   │ RolesGuard              │    │
│   /login                 │         │   │ TenantScope (in service)│    │
│   /cases   /cases/new    │         │   └─────────────────────────┘    │
│   /cases/:id /audit      │         │   AuthModule  CasesModule        │
│                          │         │   AiModule    AuditModule        │
└──────────────────────────┘         │   QueueModule (in-proc)          │
                                     └────────┬──────────────┬──────────┘
                                              │              │
                                       ┌──────▼────┐   ┌─────▼──────────┐
                                       │ MongoDB   │   │ OpenRouter     │
                                       │ Atlas     │   │ gpt-4o-mini    │
                                       └───────────┘   └────────────────┘
```

---

## Multi-tenant security model (the centerpiece)

This is what the assignment evaluates most. Three defensive layers:

**1. Signed JWT carries the tenant.** On login, a JWT is signed with `{ sub: userId, tenantId, role, email, name }` and stored in an `HttpOnly; SameSite=Lax` cookie (`cas_session`). The token is the only source of tenant context — clients can't impersonate.

**2. Service-layer tenant scoping.** Every Mongoose query in `CasesService` and `AuditService` filters by `tenantId: user.tenantId` extracted from the verified JWT. There is **no** code path that touches `caseModel.find({ _id })` without a tenant predicate. Reviewer can grep:

```bash
grep -rn "tenantId" backend/src/cases backend/src/audit
```

**3. Object-level (IDOR) check.** Even with a guessed valid ObjectId from another tenant, the `findOwnedOrThrow()` helper returns **404 Not Found** (not 403) — preventing enumeration:

```ts
private async findOwnedOrThrow(user: AuthUser, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException();
  const doc = await this.caseModel
    .findOne({ _id: id, tenantId: user.tenantId })
    .lean()
    .exec();
  if (!doc) throw new NotFoundException("Case not found");
  return doc;
}
```

**Verified cross-tenant attempts (curl tests during development):**
- Acme Associate tries `GET /cases/{Brightline-case-id}` → `404 Not Found`
- Brightline Partner tries `PATCH /cases/{Acme-case-id}` → `404 Not Found`
- Brightline Partner tries `GET /cases/{Acme-case-id}/audit` → `404 Not Found`

---

## Roles & permissions

| Capability | Associate | Partner |
|---|:---:|:---:|
| Submit a case | ✅ | ✅ |
| View case list (own tenant) | ✅ | ✅ |
| View case detail | ✅ | ✅ |
| Edit case title/summary | ✅ | ✅ |
| Retry failed AI classification | ✅ | ✅ |
| **Override AI classification** | ❌ (403) | ✅ |
| View audit log | ✅ | ✅ |

Role check is done at the **server** via `@Roles(UserRole.Partner)` + `RolesGuard`. The frontend role-gates the UI as a courtesy only.

---

## AI integration

- **Provider:** OpenRouter (OpenAI-compatible)
- **Model:** `openai/gpt-4o-mini` (configurable in `.env`)
- **Output contract:** strict JSON via `response_format: { type: 'json_object' }` + Zod schema validation
- **Resilience:**
  - 30s timeout per request
  - 2 attempts (second with a stricter "JSON-only" reminder prompt)
  - Markdown-fence stripping before parse
  - Zod schema rejects bad shapes (wrong enum, missing fields, empty strings)
  - All failures caught — case marked `aiStatus: FAILED` with `aiError` message; app never crashes
- **Async flow:** case is created as `PENDING` and returned immediately. An in-process queue (concurrency limit 3) dispatches the AI job. Frontend polls `GET /cases/:id` every 2 seconds while status is `PENDING`.

---

## Audit trail

Every case state transition is recorded in `audit_logs` (append-only):

| Action | Triggered when | Actor |
|---|---|---|
| `CASE_CREATED` | New case submitted | user |
| `CASE_UPDATED` | Title or summary edited | user |
| `CASE_DELETED` | Case removed | user |
| `AI_GENERATED` | AI returned a valid classification | system |
| `AI_FAILED` | AI errored / malformed / timed out | system |
| `AI_RETRIED` | Partner/Associate clicked retry | user |
| `AI_OVERRIDDEN` | Partner overrode AI fields | user (Partner) |

**Design notes:**
- `actorName` and `actorRole` are **denormalized** at write time → logs remain a faithful historical record even if a user is renamed/deleted.
- The original `case.ai.*` values are **never** mutated by overrides — overrides land in `case.override.*` and the original AI output stays traceable forever.
- Audit writes use try/catch — if Mongo audit insert fails, the primary write still succeeds (logged via Logger, never throws to the client). This is correct legal/compliance behavior: not blocking the user when the trail can't be written.

---

## Rate limiting

- **Global default:** 100 req/min per IP (`@nestjs/throttler`, in-memory store)
- **`POST /auth/login`:** 5/min per IP (brute-force protection)
- **`POST /cases/:id/retry-ai`:** 10/min per IP (AI cost cap)

For production, swap the in-memory store for `@nestjs/throttler-storage-redis` to share state across replicas.

---

## Getting started

### Prerequisites
- Node.js **20.9+**
- MongoDB connection string (Atlas free tier works)
- OpenRouter API key — get one at [openrouter.ai](https://openrouter.ai)

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env — set MONGODB_URI, OPENROUTER_API_KEY, JWT_SECRET
npm install
npm run seed         # creates 2 firms × 2 users (idempotent)
npm run start:dev    # → http://localhost:4000/api/v1
```

Verify: `curl http://localhost:4000/api/v1/health` returns `{"status":"ok","services":{"mongodb":"connected"}}`.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev          # → http://localhost:3000
```

Open `http://localhost:3000` and you'll be redirected to `/login`.

### 3. Demo accounts

Password for all four: **`password123`**

| Email | Firm | Role |
|---|---|---|
| `partner@acme.test` | Acme Legal | PARTNER |
| `associate@acme.test` | Acme Legal | ASSOCIATE |
| `partner@brightline.test` | Brightline LLP | PARTNER |
| `associate@brightline.test` | Brightline LLP | ASSOCIATE |

Click any row in the demo-accounts list on the login page to auto-fill the email.

### 4. Walkthrough

1. Log in as **`associate@acme.test`**.
2. Click **New case** → paste a summary like:
   > *"A class of 12,000 California consumers alleges MegaCorp Inc engaged in deceptive billing practices, seeking $50M in damages under the California Consumers Legal Remedies Act. The case was filed in Los Angeles Superior Court."*
3. Watch the case go **PENDING → COMPLETED** in ~3s on the detail page (auto-polls).
4. Try clicking **Override** → see the role-gating message ("available to Partners only").
5. Log out, log in as **`partner@acme.test`**.
6. Open the same case → the **Override classification** button is now visible. Change Risk → HIGH and add reasoning. Save.
7. Click the **Audit** tab → see the full chronological trail (`CASE_CREATED` → `AI_GENERATED` → `AI_OVERRIDDEN`).
8. Visit **`/audit`** → see firm-wide activity with linked case titles.
9. Log out, log in as **`partner@brightline.test`** → notice the tenant in the header changed, none of Acme's cases are visible.

---

## API reference (backend)

All endpoints prefixed with `/api/v1`. Auth-protected routes require the `cas_session` cookie.

### Auth
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Email/password → sets cookie. Rate-limited 5/min. |
| POST | `/auth/logout` | any | Clears cookie. |
| GET | `/auth/me` | authed | Current user + tenant. |

### Cases
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/cases` | Associate+ | Create case, enqueue AI classification. |
| GET | `/cases?status=&page=&limit=` | Associate+ | List, tenant-scoped, paginated. |
| GET | `/cases/:id` | Associate+ | Detail. Returns 404 if not in tenant. |
| PATCH | `/cases/:id` | Associate+ | Edit title/summary. |
| DELETE | `/cases/:id` | Associate+ | Delete case. |
| POST | `/cases/:id/retry-ai` | Associate+ | Re-run classification on FAILED case. 409 if PENDING. Rate-limited 10/min. |
| PATCH | `/cases/:id/classification` | **Partner** | Override AI fields. 403 if not Partner. |
| GET | `/cases/:id/audit` | Associate+ | Per-case audit trail (chronological, newest first). |

### Audit
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/audit?page=&limit=` | Associate+ | Firm-wide audit feed with `caseTitle` joined via aggregation. |

### Health
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/health` | public | `{ status, services: { mongodb } }` |

---

## Folder structure

```
.
├── backend/
│   ├── src/
│   │   ├── ai/                # OpenRouter client + classification service + Zod schema
│   │   ├── audit/             # AuditLog schema, service, controller
│   │   ├── auth/              # Login, JWT signing, cookie strategy
│   │   ├── cases/             # Case schema, service (tenant-scoped), controller
│   │   ├── common/            # Guards (JwtAuth, Roles), decorators (CurrentUser, Roles), filters, types
│   │   ├── config/            # Zod env validation + AppConfigService
│   │   ├── database/          # Mongoose async config
│   │   ├── health/            # /health endpoint
│   │   ├── queue/             # In-process bounded queue
│   │   ├── seed/              # npm run seed → 2 firms × 2 users
│   │   ├── tenants/           # Tenant schema + service
│   │   ├── users/             # User schema + service (bcrypt)
│   │   ├── app.module.ts      # Root module + global ThrottlerGuard
│   │   └── main.ts            # CORS, cookie-parser, validation pipe, global prefix
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/      # Login page (GSAP entrance, password toggle, demo picker)
│   │   │   ├── (dashboard)/       # Auth-guarded route group with sticky glass header
│   │   │   │   ├── cases/
│   │   │   │   │   ├── page.tsx       # List with filter tabs + list-level polling
│   │   │   │   │   ├── new/page.tsx   # Submit form
│   │   │   │   │   └── [id]/page.tsx  # Detail with 3 tabs; lazy-loads OverrideDialog + AuditTimeline
│   │   │   │   └── audit/page.tsx     # Firm-wide audit feed with load-more
│   │   │   ├── error.tsx              # Segment-level error boundary
│   │   │   ├── global-error.tsx       # Root-level catastrophic error
│   │   │   ├── not-found.tsx          # 404 page
│   │   │   ├── globals.css            # Premium dark theme + utilities (.glass, .heading-display)
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── cases/                 # ai-status-badge, risk-badge, override-dialog, audit-timeline,
│   │   │   │                          # case-status-cards, classification-card
│   │   │   ├── providers/             # AppProviders, SmoothScroll (Lenis)
│   │   │   └── ui/                    # shadcn primitives (base-ui under the hood)
│   │   ├── context/auth-context.tsx   # React Context: user/loading/login/logout/refresh
│   │   └── lib/
│   │       ├── api.ts                 # Typed fetch wrapper, credentials: 'include'
│   │       ├── case-helpers.ts        # effectiveRisk/Jurisdiction/Reasoning, isFieldOverridden, formatRelative
│   │       └── types.ts               # Shared TS types matching backend
│   ├── .env.local.example
│   └── package.json
│
├── README.md            # this file
├── PROMPTS.md           # chronological list of AI prompts used during development
└── task.md              # original assignment
```

---

## Code-splitting / bundle hygiene

The case-detail page lazy-loads two heavy components via `next/dynamic`:
- **`OverrideDialog`** (~32KB) — only Partners ever fetch this chunk
- **`AuditTimeline`** (~12KB) — only fetched when the user clicks the Audit tab (guarded by `auditOpenedOnce` state)

Verified by inspecting `.next/static/chunks` after `npm run build` — both bundles live in separate chunks from the main detail-page bundle.

---

## Resilience features summary

| Layer | What | Why |
|---|---|---|
| AI | 30s timeout, 2 attempts, Zod validation | OpenRouter can be slow or return malformed JSON |
| AI | Try/catch swallows all errors → case marked FAILED with `aiError` | App must never crash on AI failure |
| Audit | Writes wrapped in try/catch with `.error()` log | Audit insert failure must not block the primary operation |
| Cross-tenant | 404 (not 403) for unauthorized object access | Prevents enumeration |
| Auth | httpOnly + SameSite=Lax cookie, signed JWT, 24h expiry | XSS-resistant session |
| Rate limit | Per-route stricter limits on login + retry-ai | Brute-force + cost abuse |
| Frontend | `app/error.tsx`, `not-found.tsx`, `global-error.tsx` | Graceful render-error fallbacks |

---

## What would change for production

This is a prototype. For a real deployment, I'd:

- Swap the in-process AI queue for **BullMQ + Redis** so jobs survive backend restarts.
- Swap the in-memory throttler store for **`@nestjs/throttler-storage-redis`** so rate-limits work across replicas.
- Add **structured logging** (pino or Winston) with correlation IDs.
- Add **observability** (OpenTelemetry → Grafana) — especially for AI latency + token costs per tenant.
- Move **JWT to refresh-token rotation** with short access tokens.
- Set **`cookie.secure: true`** + **`SameSite=Strict`** in production.
- Add **request-level audit logging** (who hit which endpoint, IP, user-agent) as a separate stream from the case audit trail.
- Add **CSP**, **HSTS**, **X-Frame-Options** headers via `helmet`.
- Add a **soft-delete** pattern for cases (legal records often can't be hard-deleted).
- Add **PDF/text-file upload** parsing if real summaries come in as attachments.
- Add **per-tenant AI cost tracking** and quotas.

---

## Decisions, tradeoffs, things I deliberately didn't do

- **No tests.** Per user instruction during planning.
- **No LangChain.** A single classification call doesn't justify the abstraction; direct SDK + Zod is leaner and easier to debug.
- **No self-signup flow.** Seed-only tenant creation, per user decision. Self-signup would require email verification, slug uniqueness UX, etc. — outside scope.
- **No `OmitType` usage in DTOs.** I refactored to `PartialType` where it fit (`UpdateCaseDto`, `OverrideClassificationDto`) but didn't fabricate parent DTOs just to use `OmitType`.
- **No three.js hero.** Considered for premium-feel but decided against — a 3D scene on a legal/audit dashboard reads as gimmicky. Premium feel comes from the dark warm palette, GSAP fade-ups, glass cards, and Lenis smooth scroll.
- **Tabs unmount-vs-mount.** Audit tab content is guarded by `auditOpenedOnce` so the lazy chunk doesn't preload — small but real bundle win for users who never open it.

---

## Credits

Built end-to-end with Claude Code (Anthropic) as pair-programmer. See `PROMPTS.md` for the full chronological list of prompts used during development.
