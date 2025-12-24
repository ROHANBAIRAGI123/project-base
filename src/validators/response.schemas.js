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