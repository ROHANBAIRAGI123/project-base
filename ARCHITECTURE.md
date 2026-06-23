# Project Camp Backend — Architecture Document

## High-Level Overview

Project Camp is a robust, monolithic backend service built on the **Express.js / Node.js** ecosystem, designed for managing multi-tenant project collaboration. It acts as the central data hub for user authentication, role-based access control (RBAC), and hierarchical project management (Projects -> Tasks -> Subtasks).

The architecture heavily emphasizes **Security**, **Validation**, and **Data Integrity** over rapid prototyping, implementing defense-in-depth strategies at every layer.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: Stateless JSON Web Tokens (JWT)
- **Validation Engine**: Zod
- **Email Service**: Nodemailer & Mailgen

## Directory Structure & Component Roles

The application follows a strictly layered architecture pattern:

```text
src/
├── index.js          # Entry point. Connects DB and starts server (Fail-Fast pattern).
├── app.js            # Express configuration. Mounts global middleware and routers.
├── constants.js      # Single source of truth for Enums, limits, and magic strings.
├── db/               # Database initialization and connection logic.
├── models/           # Data Layer. Mongoose schemas, hooks, and instance methods.
├── controllers/      # Business Logic Layer. Handles requests and orchestrates models.
├── routers/          # Routing Layer. Maps HTTP endpoints to controllers & applies local middleware.
├── middlewares/      # Security Layer. JWT verification, RBAC checks, sanitization.
├── validators/       # Contract Layer. Zod schemas defining expected input/output shapes.
└── utils/            # Shared utilities (ApiError, ApiResponse, Mailer).
```

## Core Architectural Patterns

### 1. Request Lifecycle (Defense-in-Depth)

Every incoming request passes through a rigorous gauntlet before reaching business logic:
1. **Global Middleware**: CORS, Rate Limiting, JSON parsing limit (`16kb`), URL encoding.
2. **Sanitization Middleware (`sanitizeAndValidateInput`)**: Recursively strips XSS vectors and SQLi patterns.
3. **Authentication Middleware (`verifyJWT`)**: Extracts and verifies user identity via stateless tokens.
4. **Authorization Middleware (`checkProjectPermission`)**: Queries DB to ensure the user holds the correct role for the target resource.
5. **Schema Validation (`validate`)**: Zod enforces strict type-checking and structural validation on `req.body`, `req.query`, and `req.params`.
6. **Controller**: Business logic executes.
7. **Response Validation (`validateResponse`)**: (Dev Mode Only) Ensures the outgoing payload matches the defined API contract.

### 2. Multi-Tenant Role-Based Access Control (RBAC)

The system is "multi-tenant" meaning users interact within the bounded context of a specific `Project`.
- **Global Identity**: Managed by the `User` model.
- **Contextual Role**: Managed by the `ProjectMember` pivot table. A user can be an `ADMIN` in Project A, but a `MEMBER` in Project B.
- **Middleware Integration**: `permission.middleware.js` intercepts routes containing `/:projectId/` to dynamically verify access rights.

### 3. Data Modeling Strategy

- **Normalized Relationships**: To avoid MongoDB's 16MB document limit, large arrays (like Tasks in a Project, or Subtasks in a Task) are normalized into separate collections.
- **Virtual Populate**: The `Project` model uses virtuals to link to the `Task` collection, allowing relational-style querying without data duplication.
- **Fat Models, Thin Controllers**: Data manipulation (like password hashing `pre-save`, or token generation) is encapsulated within the Model instances.

### 4. Unified Error Handling

The application eschews `try/catch` boilerplate in favor of the `asyncHandler` Higher-Order Function. All expected errors are thrown as instances of `ApiError`, which are caught and standardized into JSON responses by the global error-handling middleware in `app.js`.

### 5. Testing Strategy

The application asserts system behavior via automated testing driven by **Vitest** paired with **Supertest**. Tests run against an isolated **MongoDB Memory Server** (`mongodb-memory-server`), ensuring state runs reliably and offline for each run.
