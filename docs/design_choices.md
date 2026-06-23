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

| Goal | Recommended DB |
|---|---|
| MCP + Agent features are the primary bet | Stay on MongoDB |
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

| Client Type | Auth Method |
|---|---|
| Browser (human users) | `httpOnly` cookie-based JWT (already implemented) |
| AI Agents / MCP clients | `Authorization: Bearer <api_key>` header |

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

**Why:** The roadmap calls for SOC2 audit logs, CRDT history replay, and cascading delete protection. All of these require knowing *when* and *what* was deleted, not just that it's gone. Hard deletes make these features impossible to add later.

**Affected models:** `User`, `Project`, `Task`, `Subtask`, `Note`, `ProjectMember`, `ProjectInvitation`.

---

### C. TypeScript on the Backend

**Decision:** Add TypeScript to `project-base` before the codebase grows further.

**Why:** The frontend (`project-camp-web`) will be TypeScript by default. Without TypeScript on the backend, sharing types between the two repos requires a manually-maintained `shared-types/` package. Adding TypeScript to the backend now while the schema is small is a one-time cost with permanent payoff.

---

## 5. Rate Limiting Strategy

### Phase 1 — In-Memory (Now)

**Package:** `express-rate-limit` (not yet installed)  
**File:** `src/middlewares/rateLimiter.middleware.js`

**Two tiers:**

| Tier | Routes | Limit |
|---|---|---|
| **Strict** | `/login`, `/register`, `/forgot-password`, `/reset-password` | 10 requests / 15 min / IP |
| **General** | All `/api/` routes | 100 requests / min / IP |

**Wiring:** Mount `globalRateLimiter` in `app.js` before all routes. Mount `authRateLimiter` on individual auth routes in `auth.routes.js`.

### Phase 3 — Redis Store (When BullMQ is introduced)

**Upgrade:** Swap the default `MemoryStore` for `rate-limit-redis`. This is a **single config change** — no route or controller changes required.

```js
// The only change needed in Phase 3:
store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
})
```

> **Do not introduce Redis now.** It adds infrastructure complexity for near-zero traffic gain. The in-memory store is sufficient until BullMQ forces Redis into the stack anyway.

---

## 6. Execution Order

### Before Writing Any New Feature

```
1. Fix all P0 bugs (2 days)
       ↓
2. Write 5 core integration tests — Jest + Supertest (2–3 days)
       ↓
3. Set up GitHub Actions CI (run tests on every push) (1 day)
       ↓
4. Deploy backend to Railway (staging environment)
       ↓
5. Start Next.js frontend (project-camp-web)
       ↓
6. Wire frontend to staging API
       ↓
7. Frontend complete → Deploy to Vercel
       ↓
8. Rate limiter + Winston logger + Notes CRUD (parallel with frontend)
```

**Why tests before frontend:** Without tests, every backend change during frontend development risks silently breaking auth flows, token rotation, or RBAC. The frontend will surface API bugs in confusing ways. Tests catch them at the source.

**Why deploy to staging before frontend is done:** CORS over HTTPS with `credentials: true`, environment variable issues, and cookie behavior across domains always have surprises. Find them in staging, not at launch.

---

## 7. Deployment Targets

| Layer | Platform | Rationale |
|---|---|---|
| **Backend (Express)** | [Railway](https://railway.app) | Native Node.js + MongoDB support, one-click Redis addon for Phase 3, deploys from GitHub, no cold starts on paid tier |
| **Frontend (Next.js)** | [Vercel](https://vercel.com) | Made by the Next.js team, zero-config deploys, edge CDN, free SSL |
| **Database** | MongoDB Atlas (free tier → M10) | Already implied by Mongoose; Atlas has a generous free tier and scales without migration |
| **Redis (Phase 3)** | Railway Redis addon | Co-located with backend, no separate infra to manage |

**When to deploy:** Immediately after P0 fixes and basic tests pass. Do not wait for the backend to be "complete."

---

## 8. Deferred Decisions (Must Revisit Before Phase 2)

| Decision | Options | Deadline |
|---|---|---|
| MongoDB vs. PostgreSQL | Stay on MongoDB OR migrate now | Before Notes module is built |
| TypeScript on backend | Add now OR use shared-types package | Before monorepo migration |
| Organization model | Add as optional field now OR defer to post-launch | Before first external user |
| Soft deletes | Add `deletedAt` now OR hard delete | Before Notes/Attachments are implemented |

---

*Last updated: 2026-06-23. Source: architecture discussions in project planning session.*
