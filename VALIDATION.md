# Zod Validation System Documentation

This project now uses **Zod** for comprehensive validation with multiple layers of security and data integrity checks.

## Overview

The validation system consists of several components:

1. **Zod Schemas** - Type-safe validation schemas
2. **Validation Middleware** - Request/response validation
3. **Sanitization Middleware** - Input cleaning and security
4. **Response Validation** - Output validation for development

## Key Features

### 🔒 Security Features
- **XSS Protection** - Prevents cross-site scripting attacks
- **SQL Injection Protection** - Blocks SQL injection attempts  
- **Input Sanitization** - Cleans and normalizes user input
- **Rate Limiting Validation** - Validates client information
- **File Upload Security** - Validates file types, sizes, and names

### ✅ Validation Features
- **Type Safety** - Strong typing with Zod schemas
- **Custom Transformations** - Auto-transform data (lowercase, trim, etc.)
- **Complex Validation** - Cross-field validation and custom rules
- **Detailed Error Messages** - Clear, actionable error responses
- **Response Validation** - Ensures API responses match schemas

## Usage Examples

### Basic Validation
```javascript
import { validate } from "../middlewares/validation.middleware.js";
import { userRegisterSchema } from "../validators/index.js";

router.post("/register", 
  validate(userRegisterSchema),
  registerUser
);
```

### Multi-Layer Validation
```javascript
import { createValidationLayer } from "../middlewares/validation.middleware.js";

router.post("/create-project",
  ...createValidationLayer({
    schema: createProjectSchema,
    sanitize: true,
    validateSecurity: true
  }),
  createProject
);
```

### Advanced Sanitization
```javascript
import { sanitizeAndValidateInput } from "../middlewares/sanitization.middleware.js";

router.post("/sensitive-endpoint",
  ...sanitizeAndValidateInput({
    enableXSSProtection: true,
    enableSQLProtection: true,
    maxRequestSize: 2 * 1024 * 1024,
    customSanitizers: {
      name: (value) => value?.trim().replace(/[^\w\s\-_]/g, ''),
      email: (value) => value?.toLowerCase().trim()
    }
  }),
  validate(schema),
  controller
);
```

## Available Validation Schemas

### Authentication Schemas
- `userRegisterSchema` - User registration with strong password requirements
- `userLoginSchema` - Login with email/username flexibility  
- `userChangeCurrentPasswordSchema` - Password change with confirmation
- `userForgotPasswordSchema` - Password reset request
- `userResetForgotPasswordSchema` - Password reset completion
- `userEmailVerificationSchema` - Email verification token

### Project Schemas
- `createProjectSchema` - Project creation with name validation
- `updateProjectSchema` - Project updates with optional fields
- `addMemberToProjectSchema` - Add team members with role validation
- `removeMemberFromProjectSchema` - Remove team members
- `updateMemberRoleSchema` - Change member permissions

### Task Schemas
- `createTaskSchema` - Task creation with priority and status
- `updateTaskSchema` - Task updates with field validation
- `deleteTaskSchema` - Task deletion with ID validation
- `taskFilterSchema` - Advanced task filtering and search

### Common Schemas  
- `mongoIdParamSchema` - MongoDB ObjectId validation
- `paginationSchema` - Pagination parameters with limits
- `fileUploadSchema` - File upload validation

## Validation Layers

### Layer 1: Input Sanitization
```javascript
// Automatic sanitization based on field names
req.body.email → automatically lowercased and trimmed
req.body.username → lowercased, special characters removed
req.body.fullname → normalized whitespace, invalid characters removed
```

### Layer 2: Security Validation
```javascript
// XSS Protection
- Removes <script> tags
- Blocks javascript: protocols  
- Sanitizes HTML/XML patterns

// SQL Injection Protection
- Blocks SQL keywords
- Removes comment patterns
- Validates query structures
```

### Layer 3: Schema Validation
```javascript
// Zod schema validation with:
- Type checking
- Format validation (email, dates, etc.)
- Length constraints
- Pattern matching (regex)
- Custom business rules
- Cross-field validation
```

### Layer 4: Response Validation (Development)
```javascript
// Ensures API responses match expected schemas
// Only active in development mode
// Logs validation errors without breaking responses
```

## Error Handling

Validation errors return structured responses:

```javascript
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    {
      "field": "body.email",
      "message": "Email must be a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

## Configuration

### Environment-Based Behavior
- **Development**: Full validation, response validation enabled
- **Production**: Optimized validation, security focused

### Validation Constants
Located in `src/utils/constants.js`:
```javascript
export const ValidationConstants = {
  PASSWORD_MIN_LENGTH: 6,
  STRONG_PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  EMAIL_MAX_LENGTH: 254,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  PAGINATION_MAX_LIMIT: 100,
  // ... more constants
};
```

## Custom Validators

Create custom validation schemas:

```javascript
import { z } from "zod";

const customSchema = z.object({
  body: z.object({
    customField: z.string()
      .min(1, "Field is required")
      .max(50, "Field too long")
      .regex(/^[A-Z]/, "Must start with capital letter")
      .refine(val => !val.includes('banned'), "Contains banned word")
  })
});

// Use with validation middleware
router.post("/endpoint", validate(customSchema), controller);
```

## File Upload Validation

```javascript
import { validateFileUpload } from "../middlewares/sanitization.middleware.js";

router.post("/upload",
  validateFileUpload({
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }),
  uploadController
);
```

## Best Practices

1. **Always use validation layers** for user-facing endpoints
2. **Apply sanitization** before validation  
3. **Use response validation** in development
4. **Customize sanitizers** for specific field types
5. **Set appropriate limits** for file uploads and request sizes
6. **Log security violations** for monitoring
7. **Keep schemas focused** - separate concerns
8. **Use constants** for reusable validation rules

## Migration from express-validator

Old express-validator patterns:
```javascript
// OLD
body("email").isEmail().withMessage("Invalid email")

// NEW  
z.string().email("Invalid email")
```

The new system provides:
- Better TypeScript support
- More comprehensive validation options
- Built-in sanitization
- Enhanced security features
- Clearer error messages
- Better performance

## Performance Considerations

- Validation middleware is optimized for production
- Response validation only runs in development  
- Large file validation uses streaming
- Rate limiting prevents abuse
- Efficient schema compilation

This validation system provides enterprise-grade security and data integrity while maintaining developer productivity and clear error reporting.