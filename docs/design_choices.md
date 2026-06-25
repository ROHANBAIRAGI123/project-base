# Design Choices: Project Camp

This document captures architectural decisions, rationale, and deferred decisions discussed during the planning phase of Project Camp. Use this as a living reference before committing to any new feature work.

---

## 1. Stack Decisions

### Backend — Keep Express.js (Do NOT migrate to Next.js API Routes)

**Decision:** The Express backend (`project-base`) stays as a standalone Node.js server. It will never be folded into Next.js API routes.

**Rationale:**

- The layered middleware chain (`verifyJWT → checkProjectPermission → validate → controller`) cannot be cleanly replicated in Next.js route handlers
- The MCP server (Phase 2) must run as a standalone `stdio`/HTTP process — Next.js serverless functions cannot host it
- BullMQ workers (Phase 3) require a persistent long-running process — Next.js serverless kills idle processes
- WebSocket support (real-time cursor presence, future feature) requires a persistent server

**Rule:** Any backend logic, background jobs, or protocol servers go into `project-base` or a dedicated package. Never into Next.js.

---

### Frontend — Next.js (App Router) in a Separate Repo

**Decision:** Build the frontend as a new repository named `project-camp-web` using Next.js with the App Router.

**Rationale:**

- SSR/SSG is required for future marketing/landing pages (Linear alternative, Jira alternative comparison pages)
- App Router's RSC + Client Component split maps cleanly to the future local-first model (server fetches seed state, client runs SQLite WASM)
- Next.js API Routes can proxy or cache backend responses if needed
- Target users (AI startup engineers) expect a modern, TypeScript-first frontend stack

**Not Vite + React** — would require a separate Express server for SSR and has no path to marketing pages.  
**Not Remix** — smaller ecosystem, no meaningful advantage over Next.js here.

---

### Repo Structure

**Now:** Two separate repos.

```
project-base/           ← Express backend (this repo)
project-camp-web/       ← Next.js frontend (new repo)
```

**Phase 2 (when MCP work begins):** Migrate to a monorepo.

```
project-camp/
├── apps/
│   ├── api/            ← Express backend
│   └── web/            ← Next.js frontend
├── packages/
│   ├── mcp-server/     ← MCP server (Phase 2)
│   ├── shared-types/   ← TypeScript interfaces shared across apps
│   └── ui/             ← Shared design system
└── turbo.json          ← Turborepo for build orchestration
```

---

## 2. Database Decision (Critical Fork)

### MongoDB vs. PostgreSQL

**Current state:** MongoDB (Mongoose).

**The fork:**

| Goal                                              | Recommended DB            |
| ------------------------------------------------- | ------------------------- |
| MCP + Agent features are the primary bet          | Stay on MongoDB           |
| Local-First OPFS SQLite sync (Phase 4) is serious | Migrate to PostgreSQL now |

**Reasoning:** MongoDB ↔ SQLite replication is non-standard and painful. PostgreSQL → SQLite sync is a solved problem via PGLite, Electric SQL, and Zero Sync. If Phase 4 is a real goal, migrating the schema while it is still small (now) is far cheaper than migrating after launch.

> ⚠️ **This decision must be made before writing any more Mongoose models.** Once the Notes module, Agent profiles, and Organization models are added, migration cost grows significantly.

**Deferred decision — owner must decide:**

- [ ] Is Local-First (Phase 4) a core product bet or a stretch goal?
- [ ] If core → migrate to PostgreSQL now
- [ ] If stretch → stay on MongoDB, revisit in Phase 3

---

## 3. Authentication Architecture

### Two Parallel Auth Paths (Must Design Now)

**Decision:** Design two authentication mechanisms from the start.

| Client Type             | Auth Method                                       |
| ----------------------- | ------------------------------------------------- |
| Browser (human users)   | `httpOnly` cookie-based JWT (already implemented) |
| AI Agents / MCP clients | `Authorization: Bearer <api_key>` header          |

**Why now:** AI agents do not have cookie jars. The MCP server (Phase 2) needs agents to authenticate via API keys. Bolting this on later means touching the `verifyJWT` middleware and all protected routes. Designing the dual-path now keeps the change surgical.

**Implementation note:** Add an `ApiKey` model to the database. A single middleware checks for cookies first, then falls back to the `Authorization` header — controllers never need to know which path was used.

---

## 4. Data Model Decisions

### A. Add an Organization Layer (Before Launch)

**Decision:** Introduce an `Organization` model as a wrapper above `Project`.

```
Organization → Projects → Tasks → Subtasks
```

**Why now:** The current model ties projects directly to users. Multi-tenant enterprise features (SSO, team billing, org-wide RBAC) require an Org layer. Adding it after launch means migrating all existing data. Adding it now (even as an optional/nullable field) costs almost nothing.

---

### B. Soft Deletes on All Models

**Decision:** Add `deletedAt: Date` (nullable) to all Mongoose models instead of using hard `deleteOne()`.

**Why:** The roadmap calls for SOC2 audit logs, CRDT history replay, and cascading delete protection. All of these require knowing _when_ and _what_ was deleted, not just that it's gone. Hard deletes make these features impossible to add later.

**Affected models:** `User`, `Project`, `Task`, `Subtask`, `Note`, `ProjectMember`, `ProjectInvitation`.

---

### C. TypeScript on the Backend — Migrate After Tests Pass

**Decision:** Migrate `project-base` from JavaScript to TypeScript **after the initial test suite passes, before building the frontend.**

**Timing rationale:**

| Timing option                  | Risk                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Migrate now (before tests)     | A TS migration touches every file. Without tests, you have no safety net to catch regressions.                                |
| Migrate after tests            | Tests act as a regression guard during the rename + type annotation phase. Safe.                                              |
| Migrate after Notes/MCP/Agents | Each new feature adds more files to migrate. Cost compounds. Don't wait this long.                                            |
| Never migrate (stay JS)        | Shared types with Next.js frontend require a manually-maintained `shared-types/` package — a guaranteed source of drift bugs. |

**The concrete sequence:**

```
Write tests (Vitest) → tests pass → npm install typescript → migrate files to .ts → tests still pass → start frontend
```

**Why this timing is the sweet spot:**

- The backend has ~15 source files right now. That is a 1–2 day migration.
- After Notes CRUD, MCP server, and Agent models land, that number triples. Migration becomes a week-long project.
- From day 1 of frontend development, the backend exports real TypeScript types that Next.js can import directly — no drift, no manual sync.

**What the migration involves:**

- `npm install -D typescript @types/node @types/express @types/mongoose @types/bcryptjs @types/jsonwebtoken @types/nodemailer @types/cookie-parser`
- Add `tsconfig.json` (target: ESNext, module: NodeNext, strict: true)
- Rename `.js` → `.ts`, fix type errors
- Update `package.json` scripts: `"dev": "tsx watch src/index.ts"`
- Vitest has native TypeScript support — zero test changes needed

---

## 5. Rate Limiting Strategy

### Phase 1 — In-Memory (Implemented ✅)

**Package:** `express-rate-limit`
**File:** `src/middlewares/rateLimiter.middleware.js`
**Algorithm:** Fixed Window Counter

**Two tiers:**

| Tier                              | Routes                                                                                               | Limit                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| **Strict** (`authRateLimiter`)    | `/login`, `/register`, `/forgot-password`, `/reset-password` — applied per-route in `auth.routes.js` | 10 req / 15 min / IP |
| **General** (`globalRateLimiter`) | All `/api/` routes — mounted in `app.js` before all route handlers                                   | 100 req / min / IP   |

**Known limitation of Fixed Window:** A determined client can double-burst at window boundaries (end of window N + start of window N+1). Acceptable at current traffic. Upgrade to Sliding Window via `rate-limiter-flexible` + Redis in Phase 3 if needed.

### Phase 3 — Redis Store (When BullMQ is introduced)

**Upgrade:** Swap the default `MemoryStore` for `rate-limit-redis`. This is a **single config change** — no route or controller changes required.

```js
// The only change needed in Phase 3:
store: new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(args),
});
```

> **Do not introduce Redis now.** It adds infrastructure complexity for near-zero traffic gain. The in-memory store is sufficient until BullMQ forces Redis into the stack anyway.

---

## 6. Testing Infrastructure

### Stack Decision: Vitest + Supertest + MongoDB Memory Server

**Why Vitest over Jest:**

| Factor                                   | Vitest                                    | Jest                                              |
| ---------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| **ESM support**                          | Native, zero config                       | Requires `--experimental-vm-modules` flag + Babel |
| **This project uses `"type": "module"`** | Works out of the box                      | Painful; multiple workarounds needed              |
| **Speed**                                | ~2× faster (Vite-powered)                 | Slower cold start                                 |
| **API compatibility**                    | Same `describe` / `it` / `expect` as Jest | N/A                                               |
| **TypeScript**                           | Native (important for later migration)    | Requires `ts-jest` or Babel                       |

**The `"type": "module"` in `package.json` is the deciding factor.** Jest + ESM is a known pain point with no clean solution. Vitest was built for modern ESM-first projects.

**Why MongoDB Memory Server:**

- Tests must never touch the real database
- Spins up an actual MongoDB instance in-process — tests use real Mongoose queries, not mocks
- Fast (~200ms startup), zero external dependency, disposable after each test suite

---

### Test File Structure

```
project-base/
└── tests/
    ├── setup/
    │   ├── globalSetup.js          ← Start MongoMemoryServer once before all suites
    │   ├── testSetup.js            ← beforeEach/afterEach: clear all collections
    │   └── fixtures/               ← Reusable data factories (not hardcoded objects)
    │       ├── user.fixture.js      ← createUser(), createAdmin()
    │       ├── project.fixture.js   ← createProject(ownerId)
    │       └── task.fixture.js      ← createTask(projectId, assigneeId)
    ├── integration/                ← API route tests via Supertest (most of your tests)
    │   ├── auth/
    │   │   ├── register.test.js
    │   │   ├── login.test.js
    │   │   ├── logout.test.js
    │   │   ├── refreshToken.test.js
    │   │   ├── changePassword.test.js
    │   │   └── forgotPassword.test.js
    │   ├── projects/
    │   │   ├── createProject.test.js
    │   │   ├── listProjects.test.js
    │   │   ├── updateProject.test.js
    │   │   ├── deleteProject.test.js
    │   │   └── memberManagement.test.js
    │   └── tasks/
    │       ├── createTask.test.js
    │       ├── updateTask.test.js
    │       └── subtasks.test.js
    └── unit/                       ← Pure function tests (no DB, no HTTP)
        ├── validators/
        │   ├── userRegisterSchema.test.js
        │   └── userLoginSchema.test.js
        └── utils/
            ├── ApiError.test.js
            └── asyncHandler.test.js
```

**Rule:** Integration tests cover ~80% of cases. Unit tests only for pure utility functions and validators — not controllers, not middlewares.

---

### Test Categories Explained

| Type            | What it tests                                                | Uses DB?            | Uses HTTP?      |
| --------------- | ------------------------------------------------------------ | ------------------- | --------------- |
| **Integration** | Full request → middleware → controller → DB → response cycle | Yes (Memory Server) | Yes (Supertest) |
| **Unit**        | Single function in isolation (Zod schema, ApiError shape)    | No                  | No              |

**Do not write unit tests for controllers.** Controllers are orchestration code — they only make sense tested as a full HTTP round-trip. Mocking Mongoose inside a controller test gives you false confidence.

---

### Minimum Test Suite to Pass Before Frontend Work

Write these 8 tests first. Everything else can be added incrementally.

```
✔ POST /auth/register          → 201, user created in DB
✔ POST /auth/login             → 200, access+refresh cookies set
✔ POST /auth/login (wrong pw)  → 401
✔ POST /auth/refresh-access-token → 200, new access token
✔ GET  /api/v1/projects        → 200, authenticated user sees their projects
✔ GET  /api/v1/projects        → 401, unauthenticated request
✔ POST /api/v1/projects        → 201, project created and linked to user
✔ DELETE /api/v1/projects/:id  → 403, non-admin member cannot delete
```

---

### `vitest.config.js` (root level)

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // no need to import describe/it/expect
    environment: "node",
    globalSetup: "./tests/setup/globalSetup.js",
    setupFiles: ["./tests/setup/testSetup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**"],
      exclude: ["src/index.js"],
    },
  },
});
```

---

### GitHub Actions CI (`.github/workflows/test.yml`)

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npm test
```

No external MongoDB needed — the Memory Server handles it in-process.

---

## 7. Execution Order

### Revised (Post-P0)

```
✔ Fix all P0 bugs
✔ Implement rate limiter
       ↓
Write Vitest + Supertest tests (8 core tests) — 2-3 days
       ↓
Set up GitHub Actions CI (tests on every push) — 1 day
       ↓
Deploy backend to Railway (staging)
       ↓
Migrate backend to TypeScript — 1-2 days (tests are the safety net)
       ↓
Start Next.js frontend (project-camp-web)
       ↓
Notes CRUD + DB indexes + Winston logger (parallel with frontend)
       ↓
Frontend complete → Deploy to Vercel + Railway production
```

---

## 8. Deployment Targets

| Layer                  | Platform                        | Rationale                                                                                                             |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Backend (Express)**  | [Railway](https://railway.app)  | Native Node.js + MongoDB support, one-click Redis addon for Phase 3, deploys from GitHub, no cold starts on paid tier |
| **Frontend (Next.js)** | [Vercel](https://vercel.com)    | Made by the Next.js team, zero-config deploys, edge CDN, free SSL                                                     |
| **Database**           | MongoDB Atlas (free tier → M10) | Already implied by Mongoose; Atlas has a generous free tier and scales without migration                              |
| **Redis (Phase 3)**    | Railway Redis addon             | Co-located with backend, no separate infra to manage                                                                  |

**When to deploy:** Immediately after P0 fixes and basic tests pass. Do not wait for the backend to be "complete."

---

## 9. Deferred Decisions (Must Revisit Before Phase 2)

| Decision               | Options                                           | Deadline                                 |
| ---------------------- | ------------------------------------------------- | ---------------------------------------- |
| MongoDB vs. PostgreSQL | Stay on MongoDB OR migrate now                    | Before Notes module is built             |
| Organization model     | Add as optional field now OR defer to post-launch | Before first external user               |
| Soft deletes           | Add `deletedAt` now OR hard delete                | Before Notes/Attachments are implemented |

---

_Last updated: 2026-06-24. Source: architecture discussions in project planning session._
