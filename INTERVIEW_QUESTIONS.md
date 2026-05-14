# Technical Interview Guide — Project Camp Backend

This document contains potential technical interview questions based directly on the architectural and implementation decisions made in this specific codebase.

## 1. Authentication & Security

**Q: Explain how the JWT authentication flow works in this application.**
> **A:** When a user logs in, the `user.model` generates both an Access Token (short-lived) and a Refresh Token (long-lived). Both are sent to the client via `httpOnly` secure cookies AND in the JSON body. The `verifyJWT` middleware checks the cookies or `Authorization` header for the Access Token on protected routes. If the Access Token expires, the client calls `/refresh-access-token` with the Refresh Token to get a new pair. The Refresh Token is stored hashed in the DB to allow for remote session invalidation (logging out).

**Q: Why do you sanitize inputs *before* running Zod validation?**
> **A:** Zod validation is strict. If we validate first, slightly messy but benign input (like accidental leading whitespace) might be rejected, harming UX. By sanitizing first, we normalize the data (trimming, removing dangerous characters), neutralizing threats *before* the validation engine processes them.

**Q: Why does the password hashing happen in a Mongoose `pre("save")` hook instead of the registration controller?**
> **A:** It centralizes the business rule. Whether a user is created via the API, an admin dashboard, or a database seed script, the password will always be hashed. This eliminates the risk of a developer forgetting to call the hashing function in a new controller.

## 2. Architecture & Data Modeling

**Q: Explain the Role-Based Access Control (RBAC) implementation.**
> **A:** Roles are scoped to projects, not users globally. We use a pivot collection called `ProjectMember` that links a `userId` to a `projectId` along with an enum `role` (Admin, Project_Admin, Member). The `checkProjectPermission` middleware intercepts requests, extracts the `projectId` from the URL, looks up the user's role in the pivot table, and checks it against an array of allowed roles passed to the middleware factory.

**Q: Why are Tasks stored in a separate collection rather than as an array inside the Project document?**
> **A:** MongoDB has a hard 16MB limit per document. If a project lasts years and accrues 50,000 tasks, an embedded array (`[ObjectId, ObjectId]`) would eventually break the application (the unbounded array anti-pattern). Normalizing them into a separate collection allows infinite scaling. We use Mongoose `virtuals` to link them back for easy querying.

**Q: Why use `aggregate` pipelines in `project.controllers.js` instead of `.populate()`?**
> **A:** Mongoose `.populate()` runs multiple separate database queries and stitches the data together in Node.js memory. For complex queries (like joining a Project, its Members, and the Users associated with those Members), memory consumption spikes. Aggregation pipelines push the processing down to the MongoDB engine via `$lookup`, which is vastly more performant.

## 3. Advanced Implementation Details

**Q: What is the purpose of the `validateResponse` middleware?**
> **A:** It acts as an API contract enforcer. It hooks into `res.json()` and checks the outbound payload against a Zod schema. If a developer accidentally queries a user and returns the `password` hash in the response, this middleware catches it. It is only active in `development` mode to prevent performance hits in production.

**Q: How does the application implement "Fail-Fast" initialization?**
> **A:** In `index.js`, the application explicitly connects to MongoDB *before* starting the Express `app.listen()` server. If the database connection fails, the process crashes immediately. This prevents the server from accepting incoming HTTP requests that it has no ability to fulfill, allowing a container orchestrator (like Kubernetes) to cleanly restart it.
