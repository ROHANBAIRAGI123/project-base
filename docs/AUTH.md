# Authentication System Documentation

## Overview

This document provides comprehensive documentation for the authentication system implemented in `project-base`. The system uses JWT (JSON Web Tokens) with a dual-token strategy (access + refresh tokens) for secure, stateless authentication.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Security Features](#security-features)
5. [Token Management](#token-management)
6. [Validation](#validation)
7. [Error Handling](#error-handling)
8. [Environment Variables](#environment-variables)
9. [Usage Examples](#usage-examples)

---

## Architecture

### File Structure

```
src/
├── controllers/
│   └── auth.controllers.js    # Authentication business logic
├── middlewares/
│   ├── auth.middleware.js     # JWT verification middleware
│   ├── validation.middleware.js # Zod validation middleware
│   └── sanitization.middleware.js # Input sanitization
├── models/
│   └── user.model.js          # User schema with auth methods
├── routers/
│   └── auth.routes.js         # Authentication routes
├── validators/
│   └── index.js               # Zod validation schemas
└── utils/
    ├── ApiError.js            # Custom error class
    ├── ApiResponse.js         # Standardized response wrapper
    ├── AsyncHandler.js        # Async error handler
    ├── constants.js           # App constants & cookie options
    └── mail.js                # Email utilities
```

### Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Database | MongoDB with Mongoose |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Validation | Zod |
| Email | Nodemailer + Mailgen |

---

## Authentication Flow

### Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      REGISTRATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

    Client                    Server                    Database
       │                         │                          │
       │  POST /register         │                          │
       │  {email, username,      │                          │
       │   password, fullname}   │                          │
       │────────────────────────>│                          │
       │                         │                          │
       │                         │  1. Validate input (Zod) │
       │                         │  2. Check existing user  │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │  3. Hash password        │
       │                         │  4. Generate verify token│
       │                         │  5. Save user            │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │  6. Send verification    │
       │                         │     email                │
       │                         │                          │
       │  201 Created            │                          │
       │  {user data}            │                          │
       │<────────────────────────│                          │
       │                         │                          │
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────┘

    Client                    Server                    Database
       │                         │                          │
       │  POST /login            │                          │
       │  {email, password}      │                          │
       │────────────────────────>│                          │
       │                         │                          │
       │                         │  1. Find user by email   │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │  2. Compare password     │
       │                         │  3. Generate tokens      │
       │                         │  4. Store refresh token  │
       │                         │─────────────────────────>│
       │                         │                          │
       │  200 OK                 │                          │
       │  Set-Cookie: accessToken│                          │
       │  Set-Cookie: refreshToken                          │
       │  {user, tokens}         │                          │
       │<────────────────────────│                          │
       │                         │                          │
```

### Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH FLOW                           │
└─────────────────────────────────────────────────────────────────┘

    Client                    Server                    Database
       │                         │                          │
       │  POST /refresh-access-token                        │
       │  Cookie: refreshToken   │                          │
       │────────────────────────>│                          │
       │                         │                          │
       │                         │  1. Verify refresh token │
       │                         │  2. Find user            │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │  3. Validate stored token│
       │                         │  4. Generate new tokens  │
       │                         │  5. Update refresh token │
       │                         │─────────────────────────>│
       │                         │                          │
       │  200 OK                 │                          │
       │  Set-Cookie: new tokens │                          │
       │<────────────────────────│                          │
       │                         │                          │
```

### Password Reset Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   PASSWORD RESET FLOW                           │
└─────────────────────────────────────────────────────────────────┘

    Client                    Server                    Database
       │                         │                          │
       │  POST /forgot-password  │                          │
       │  {email}                │                          │
       │────────────────────────>│                          │
       │                         │                          │
       │                         │  1. Find user            │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │  2. Generate reset token │
       │                         │  3. Hash & store token   │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │  4. Send reset email     │
       │  200 OK                 │                          │
       │<────────────────────────│                          │
       │                         │                          │
       │  ═══════════════════════════════════════════════   │
       │                         │                          │
       │  POST /reset-password/:token                       │
       │  {newPassword}          │                          │
       │────────────────────────>│                          │
       │                         │                          │
       │                         │  1. Hash incoming token  │
       │                         │  2. Find user with token │
       │                         │─────────────────────────>│
       │                         │                          │
       │                         │  3. Update password      │
       │                         │  4. Clear reset token    │
       │                         │─────────────────────────>│
       │                         │                          │
       │  200 OK                 │                          │
       │<────────────────────────│                          │
       │                         │                          │
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Authenticate user |
| `GET` | `/api/v1/auth/verify-email/:token` | Verify email address |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset |
| `POST` | `/api/v1/auth/reset-password/:token` | Reset password |
| `POST` | `/api/v1/auth/refresh-access-token` | Refresh access token |
| `GET` | `/api/v1/auth/get-all-users` | Get all users (should be protected) |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/logout` | Logout user |
| `POST` | `/api/v1/auth/delete-user` | Delete user account |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `PATCH` | `/api/v1/auth/me` | Update user profile |
| `PATCH` | `/api/v1/auth/change-password` | Change password |
| `POST` | `/api/v1/auth/send-verification-email` | Resend verification email |

---

## API Reference

### POST /api/v1/auth/register

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullname": "John Doe"
}
```

**Validation Rules:**
- `username`: 3-30 chars, lowercase, alphanumeric with `-` and `_`
- `email`: Valid email format, max 254 chars
- `password`: Min 8 chars, must include uppercase, lowercase, number, special char
- `fullname`: 2-100 chars, letters and spaces only

**Success Response (201):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "isEmailVerified": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Responses:**
- `400` - Username or email already in use
- `400` - Validation failed

---

### POST /api/v1/auth/login

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully.",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "isEmailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Cookies Set:**
- `accessToken` - HTTP-only, Secure
- `refreshToken` - HTTP-only, Secure

**Error Responses:**
- `401` - Invalid email
- `401` - Invalid password

---

### POST /api/v1/auth/logout

Logout and invalidate tokens.

**Headers:**
```
Authorization: Bearer <accessToken>
```
*Or use cookie-based authentication*

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged out successfully.",
  "data": null
}
```

**Cookies Cleared:**
- `accessToken`
- `refreshToken`

---

### GET /api/v1/auth/me

Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User fetched successfully.",
  "data": {
    "user": {
      "_id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "isEmailVerified": true,
      "avatar": {
        "url": "https://...",
        "localPath": ""
      }
    }
  }
}
```

---

### PATCH /api/v1/auth/change-password

Change password for authenticated user.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
  "oldPassword": "CurrentPass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully.",
  "data": null
}
```

**Error Responses:**
- `401` - Invalid current password
- `400` - Password confirmation doesn't match

---

### POST /api/v1/auth/forgot-password

Initiate password reset process.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset email sent successfully.",
  "data": null
}
```

---

### POST /api/v1/auth/reset-password/:resetToken

Reset password using token from email.

**URL Parameters:**
- `resetToken` - Token received in email

**Request Body:**
```json
{
  "newPassword": "NewSecurePass789!",
  "confirmPassword": "NewSecurePass789!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully.",
  "data": null
}
```

**Error Responses:**
- `400` - Invalid or expired reset token

---

### POST /api/v1/auth/refresh-access-token

Get new access token using refresh token.

**Request:**
Send refresh token via cookie or Authorization header.

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access token refreshed successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Security Features

### Password Security

| Feature | Implementation |
|---------|----------------|
| Hashing | bcrypt with 10 salt rounds |
| Minimum Length | 8 characters |
| Complexity | Uppercase, lowercase, number, special char required |
| Storage | Never stored in plain text |

### Token Security

| Feature | Implementation |
|---------|----------------|
| Access Token | Short-lived (configured via env) |
| Refresh Token | Long-lived, stored in DB |
| Token Rotation | New refresh token on each refresh |
| Storage | HTTP-only, Secure cookies |

### Email Verification

| Feature | Implementation |
|---------|----------------|
| Token Generation | crypto.randomBytes(20) |
| Token Storage | SHA-256 hashed |
| Expiry | 20 minutes |
| Single Use | Cleared after verification |

### Password Reset

| Feature | Implementation |
|---------|----------------|
| Token Generation | crypto.randomBytes(20) |
| Token Storage | SHA-256 hashed |
| Expiry | 20 minutes |
| Single Use | Cleared after reset |

### Input Validation & Sanitization

| Feature | Implementation |
|---------|----------------|
| Schema Validation | Zod |
| XSS Protection | Input sanitization middleware |
| SQL Injection | Pattern detection |
| Content Type | Validated |

---

## Token Management

### Access Token

```javascript
// Payload
{
  _id: "user_id",
  username: "johndoe",
  email: "john@example.com"
}

// Configuration
{
  expiresIn: process.env.ACCESS_TOKEN_EXPIRY  // e.g., "15m"
}
```

### Refresh Token

```javascript
// Payload
{
  _id: "user_id"
}

// Configuration
{
  expiresIn: process.env.REFRESH_TOKEN_EXPIRY  // e.g., "7d"
}
```

### Cookie Configuration

```javascript
const options = {
  httpOnly: true,  // Prevents XSS attacks
  secure: true     // HTTPS only
};
```

---

## Validation

### Registration Schema

```javascript
userRegisterSchema = {
  body: {
    email: z.string().email().toLowerCase(),
    username: z.string().min(3).max(30).toLowerCase()
              .regex(/^[a-z0-9_-]+$/),
    password: z.string().min(8).max(128)
              .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
    fullname: z.string().min(2).max(100)
              .regex(/^[a-zA-Z\s'-]+$/)
  }
}
```

### Login Schema

```javascript
userLoginSchema = {
  body: {
    email: z.string().email().optional(),
    username: z.string().optional(),
    password: z.string().min(1)
  }
}
// Requires either email OR username
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address"
    }
  ],
  "data": null
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Validation failed |
| `401` | Unauthorized - Invalid credentials or token |
| `404` | Not Found - User not found |
| `500` | Internal Server Error |

---

## Environment Variables

```env
# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=7d

# Database
MONGODB_URI=mongodb://localhost:27017/your_db

# Email (Nodemailer)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password

# Server
PORT=8080
CORS_ORIGIN=http://localhost:3000
```

---

## Usage Examples

### Using with Fetch API

```javascript
// Register
const register = async (userData) => {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Login
const login = async (credentials) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(credentials)
  });
  return response.json();
};

// Protected Request
const getProfile = async () => {
  const response = await fetch('/api/v1/auth/me', {
    method: 'GET',
    credentials: 'include' // Include cookies
  });
  return response.json();
};

// OR with Authorization header
const getProfileWithToken = async (accessToken) => {
  const response = await fetch('/api/v1/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response.json();
};
```

### Using with Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/auth',
  withCredentials: true // Important for cookies
});

// Register
const register = (userData) => api.post('/register', userData);

// Login
const login = (credentials) => api.post('/login', credentials);

// Protected Request
const getProfile = () => api.get('/me');

// Refresh Token
const refreshToken = () => api.post('/refresh-access-token');
```

### Handling Token Expiry (Axios Interceptor)

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await api.post('/refresh-access-token');
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## Middleware Usage

### Protecting Routes

```javascript
import { verifyJWT } from '../middlewares/auth.middleware.js';

// Single protected route
router.get('/profile', verifyJWT, getProfile);

// Multiple protected routes
router.use(verifyJWT); // All routes below are protected
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
```

### Adding Validation

```javascript
import { validate, createValidationLayer } from '../middlewares/validation.middleware.js';
import { userRegisterSchema } from '../validators/index.js';

// Simple validation
router.post('/register', validate(userRegisterSchema), registerUser);

// Multi-layer validation
router.post('/register',
  ...createValidationLayer({
    schema: userRegisterSchema,
    sanitize: true,
    validateSecurity: true
  }),
  registerUser
);
```

---

## Best Practices

### Security Recommendations

1. **Always use HTTPS** in production
2. **Set secure cookie options** properly
3. **Implement rate limiting** for auth endpoints
4. **Log authentication events** for monitoring
5. **Use strong secrets** for JWT signing
6. **Rotate secrets periodically**
7. **Implement account lockout** after failed attempts

### Frontend Recommendations

1. **Store tokens in HTTP-only cookies** (preferred)
2. **Never store tokens in localStorage** (XSS vulnerable)
3. **Implement automatic token refresh**
4. **Clear tokens on logout**
5. **Handle 401 errors globally**

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Token expired" | Implement token refresh logic |
| "Invalid token" | Check secret key matches |
| "User not found" | Verify user exists in database |
| "Validation failed" | Check request body format |
| Cookies not sent | Set `credentials: 'include'` |
| CORS errors | Configure CORS origin properly |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial implementation |
| 1.1.0 | Dec 2025 | Migrated to Zod validation |
| 1.2.0 | Dec 2025 | Added comprehensive documentation |

---

## Contributors

- Rohan Bairagi

## License

ISC
