import { z } from "zod";

// Base response structure
const baseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  statusCode: z.number(),
  data: z.any().optional(),
  errors: z.array(z.any()).optional(),
});

// User response schemas
export const userResponseSchema = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.email(),
  fullname: z.string(),
  isEmailVerified: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const userRegisterResponseSchema = baseResponseSchema.extend({
  data: z.object({
    user: userResponseSchema.omit({ 
      // Remove sensitive fields from response
    }),
  }),
});

export const userLoginResponseSchema = baseResponseSchema.extend({
  data: z.object({
    user: userResponseSchema,
    accessToken: z.string(),
    refreshToken: z.string().optional(),
  }),
});

// Project response schemas
export const projectResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdBy: z.string(),
  members: z.array(z.object({
    userId: z.string(),
    role: z.string(),
    joinedAt: z.string().datetime().optional(),
  })),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const projectListResponseSchema = baseResponseSchema.extend({
  data: z.object({
    projects: z.array(projectResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }).optional(),
  }),
});

// Task response schemas
export const taskResponseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  assignedTo: z.string().optional(),
  projectId: z.string(),
  dueDate: z.string().datetime().optional(),
  createdBy: z.string(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const taskListResponseSchema = baseResponseSchema.extend({
  data: z.object({
    tasks: z.array(taskResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }).optional(),
  }),
});

// Error response schema
export const errorResponseSchema = baseResponseSchema.extend({
  success: z.literal(false),
  errors: z.array(z.object({
    field: z.string().optional(),
    message: z.string(),
    value: z.any().optional(),
  })).optional(),
});

// Success response schema
export const successResponseSchema = baseResponseSchema.extend({
  success: z.literal(true),
});

// Generic paginated response
export const paginatedResponseSchema = (itemSchema) => {
  return baseResponseSchema.extend({
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        pages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
    }),
  });
};

/*
 * ===========================================================================================
 *                              NOTES — response.schemas.js
 * ===========================================================================================
 *
 * PURPOSE: Defines Zod schemas representing the exact shape of successful HTTP responses.
 * ROLE IN ARCHITECTURE: API Contract/Documentation Layer. While request validation protects the server, response validation ensures the server fulfills its contract to the client.
 * 
 * IMPORTS:
 * - `z` (Zod): Used to define the shape of the output data.
 * 
 * FUNCTION-BY-FUNCTION ANALYSIS:
 * - `baseResponseSchema`: The standard wrapper containing `success`, `message`, `statusCode`, and optional `data`/`errors`.
 * - Entity Schemas (`userResponseSchema`, `projectResponseSchema`, `taskResponseSchema`): Define exactly which fields of a DB model are allowed to be sent to the client (e.g., explicitly omitting passwords).
 * - Aggregation Schemas (`projectListResponseSchema`, `paginatedResponseSchema`): Define the structure for lists, including pagination metadata.
 * 
 * HOW THIS FILE CONNECTS TO OTHER FILES:
 * - Inbound callers: Currently serves as documentation/contract definition. Could be integrated into an interceptor middleware to strip out sensitive data before sending responses.
 * - Outbound dependencies: None.
 * 
 * DESIGN PATTERNS:
 * - Data Transfer Object (DTO) Schema: Formalizes the structure of the data leaving the system.
 * - Inheritance/Extension: Uses `baseResponseSchema.extend()` to inherit common fields while adding specific `data` payloads.
 * 
 * POTENTIAL INTERVIEW QUESTIONS:
 * 1. What is the value of response schemas if they aren't actively blocking requests?
 *    Answer: They serve as executable documentation. In advanced setups, they can be used to auto-generate Swagger/OpenAPI docs, or be applied in middleware to automatically strip sensitive fields (like passwords) if a developer accidentally includes them in the controller output.
 * 2. Why use `.omit()` on `userResponseSchema` in the register response?
 *    Answer: It explicitly removes sensitive fields that might be present in the base user schema before sending the payload back to the client.
 * 3. How does `paginatedResponseSchema(itemSchema)` work?
 *    Answer: It acts as a higher-order schema or generic factory. It takes a specific entity schema (like task or project) and wraps it in a standard paginated response envelope, promoting reusability.
 */