import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controllers.js";

const router = Router();

router.route("/").get(healthCheck);

export default router;

/*
 * ===========================================================================================
 *                              NOTES — healthcheck.routes.js
 * ===========================================================================================
 *
 * PURPOSE: Provides a simple endpoint for load balancers and orchestrators to verify the API is running.
 * ROLE IN ARCHITECTURE: DevOps/Infrastructure monitoring layer.
 * 
 * IMPORTS:
 * - `healthCheck` controller function.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `GET /`: Triggers the healthcheck controller. No authentication required.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Mounted in `src/app.js` under `/api/v1/healthcheck`.
 * - Outbound dependencies: `healthcheck.controllers.js`.
 * 
 * DESIGN PATTERNS:
 * - Liveness/Readiness Probe Pattern: Standard practice in cloud-native applications (like Kubernetes or AWS ALB) to determine if a container is healthy and ready to receive traffic.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. Why is this route not protected by `verifyJWT`?
 *    Answer: It is used by automated infrastructure (like AWS Route53 or K8s kubelet) which do not have user credentials. Its only job is to answer "Is the Node process alive?".
 * 2. What would happen if this route was accidentally removed?
 *    Answer: Cloud infrastructure relying on health checks might assume the server is dead and continuously restart the container, leading to an outage.
 */
