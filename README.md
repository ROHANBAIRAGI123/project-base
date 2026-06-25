# Project Camp Backend

A robust, scalable RESTful API service for collaborative project management. Project Camp Backend enables teams to organize projects, manage tasks with subtasks, maintain project notes, and handle user authentication with role-based access control.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [API Architecture](#api-architecture)
- [Permission Matrix](#permission-matrix)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [Security Overview](#security-overview)
- [File Management](#file-management)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

### 🔐 Authentication & Authorization

- **User Registration** with email verification
- **Secure Login** with JWT-based authentication (access + refresh tokens)
- **Password Management** — change password, forgot/reset functionality
- **Token Refresh Mechanism** for seamless session management
- **Role-Based Access Control (RBAC)** with three-tier permission system

### 📁 Project Management

- Create, read, update, and delete projects
- View all projects with member count
- Project-level access control

### 👥 Team Collaboration

- Invite users to projects via email
- Manage member roles within projects
- View and remove team members

### ✅ Task Management

- Full CRUD operations on tasks
- **Hierarchical Subtasks** with completion tracking
- **File Attachments** support (multiple files per task)
- Task assignment to team members
- Three-state status tracking: `Todo`, `In Progress`, `Done`

### 📝 Project Notes

- Create and manage project-level notes
- Role-restricted note management (Admin only)

### 🏥 System Health

- Health check endpoint for monitoring and uptime verification

---

## Tech Stack

| Layer                | Technology                |
| -------------------- | ------------------------- |
| **Runtime**          | Node.js                   |
| **Framework**        | Express.js 5              |
| **Database**         | MongoDB with Mongoose ODM |
| **Authentication**   | JWT (jsonwebtoken)        |
| **Password Hashing** | bcryptjs                  |
| **Validation**       | Zod                       |
| **Email Service**    | Nodemailer + Mailgen      |
| **File Uploads**     | Multer (local filesystem) |

---

## API Architecture

The API follows RESTful conventions with versioned endpoints under `/api/v1/`.

### Authentication Routes — `/api/v1/auth/`

| Method | Endpoint                           | Description               | Auth   |
| ------ | ---------------------------------- | ------------------------- | ------ |
| `POST` | `/register`                        | User registration         | Public |
| `POST` | `/login`                           | User authentication       | Public |
| `POST` | `/logout`                          | User logout               | 🔒     |
| `GET`  | `/current-user`                    | Get current user info     | 🔒     |
| `POST` | `/change-password`                 | Change user password      | 🔒     |
| `POST` | `/refresh-token`                   | Refresh access token      | Public |
| `GET`  | `/verify-email/:verificationToken` | Email verification        | Public |
| `POST` | `/forgot-password`                 | Request password reset    | Public |
| `POST` | `/reset-password/:resetToken`      | Reset forgotten password  | Public |
| `POST` | `/resend-email-verification`       | Resend verification email | 🔒     |

### Project Routes — `/api/v1/projects/`

| Method   | Endpoint                      | Description          | Auth | Role       |
| -------- | ----------------------------- | -------------------- | ---- | ---------- |
| `GET`    | `/`                           | List user projects   | 🔒   | Any        |
| `POST`   | `/`                           | Create project       | 🔒   | Any        |
| `GET`    | `/:projectId`                 | Get project details  | 🔒   | Role-based |
| `PUT`    | `/:projectId`                 | Update project       | 🔒   | Admin      |
| `DELETE` | `/:projectId`                 | Delete project       | 🔒   | Admin      |
| `GET`    | `/:projectId/members`         | List project members | 🔒   | Role-based |
| `POST`   | `/:projectId/members`         | Add project member   | 🔒   | Admin      |
| `PUT`    | `/:projectId/members/:userId` | Update member role   | 🔒   | Admin      |
| `DELETE` | `/:projectId/members/:userId` | Remove member        | 🔒   | Admin      |

### Task Routes — `/api/v1/tasks/`

| Method   | Endpoint                         | Description        | Auth | Role                |
| -------- | -------------------------------- | ------------------ | ---- | ------------------- |
| `GET`    | `/:projectId`                    | List project tasks | 🔒   | Role-based          |
| `POST`   | `/:projectId`                    | Create task        | 🔒   | Admin/Project Admin |
| `GET`    | `/:projectId/t/:taskId`          | Get task details   | 🔒   | Role-based          |
| `PUT`    | `/:projectId/t/:taskId`          | Update task        | 🔒   | Admin/Project Admin |
| `DELETE` | `/:projectId/t/:taskId`          | Delete task        | 🔒   | Admin/Project Admin |
| `POST`   | `/:projectId/t/:taskId/subtasks` | Create subtask     | 🔒   | Admin/Project Admin |
| `PUT`    | `/:projectId/st/:subTaskId`      | Update subtask     | 🔒   | Role-based          |
| `DELETE` | `/:projectId/st/:subTaskId`      | Delete subtask     | 🔒   | Admin/Project Admin |

### Note Routes — `/api/v1/notes/`

| Method   | Endpoint                | Description        | Auth | Role       |
| -------- | ----------------------- | ------------------ | ---- | ---------- |
| `GET`    | `/:projectId`           | List project notes | 🔒   | Role-based |
| `POST`   | `/:projectId`           | Create note        | 🔒   | Admin      |
| `GET`    | `/:projectId/n/:noteId` | Get note details   | 🔒   | Role-based |
| `PUT`    | `/:projectId/n/:noteId` | Update note        | 🔒   | Admin      |
| `DELETE` | `/:projectId/n/:noteId` | Delete note        | 🔒   | Admin      |

### Health Check — `/api/v1/healthcheck/`

| Method | Endpoint | Description          | Auth   |
| ------ | -------- | -------------------- | ------ |
| `GET`  | `/`      | System health status | Public |

---

## Permission Matrix

| Feature                    | Admin | Project Admin | Member |
| -------------------------- | :---: | :-----------: | :----: |
| Create Project             |  ✅   |      ❌       |   ❌   |
| Update/Delete Project      |  ✅   |      ❌       |   ❌   |
| Manage Project Members     |  ✅   |      ❌       |   ❌   |
| Create/Update/Delete Tasks |  ✅   |      ✅       |   ❌   |
| View Tasks                 |  ✅   |      ✅       |   ✅   |
| Update Subtask Status      |  ✅   |      ✅       |   ✅   |
| Create/Delete Subtasks     |  ✅   |      ✅       |   ❌   |
| Create/Update/Delete Notes |  ✅   |      ❌       |   ❌   |
| View Notes                 |  ✅   |      ✅       |   ✅   |

### Role Definitions

- **Admin** — Full system access; can manage all project resources and members
- **Project Admin** — Project-level administrative access; can manage tasks and subtasks
- **Member** — Basic access; can view resources and update subtask completion status

---

## Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **MongoDB** (local instance or MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ROHANBAIRAGI123/project-base.git
   cd project-base
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables** (see below)

4. **Start the server**

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/project-camp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Email Service (Nodemailer)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@projectcamp.com
```

| Variable               | Description                               | Required |
| ---------------------- | ----------------------------------------- | :------: |
| `PORT`                 | Server port number                        |    ✅    |
| `NODE_ENV`             | Environment (`development`, `production`) |    ✅    |
| `MONGO_URI`            | MongoDB connection string                 |    ✅    |
| `JWT_SECRET`           | Secret key for JWT signing                |    ✅    |
| `ACCESS_TOKEN_SECRET`  | Secret for access tokens                  |    ✅    |
| `ACCESS_TOKEN_EXPIRY`  | Access token expiration time              |    ✅    |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens                 |    ✅    |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiration time             |    ✅    |
| `CORS_ORIGIN`          | Allowed origins (comma-separated)         |    ❌    |
| `EMAIL_HOST`           | SMTP server hostname                      |    ✅    |
| `EMAIL_PORT`           | SMTP server port                          |    ✅    |
| `EMAIL_USER`           | SMTP authentication username              |    ✅    |
| `EMAIL_PASS`           | SMTP authentication password              |    ✅    |
| `EMAIL_FROM`           | Default sender email address              |    ✅    |

### Running the Server

**Development mode** (with hot reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server will start at `http://localhost:3000` (or your configured `PORT`).

**Verify the server is running**:

```bash
curl http://localhost:3000/api/v1/healthcheck
```

---

## Security Overview

Project Camp Backend implements multiple layers of security:

### Authentication

- **Dual-token JWT strategy** — Short-lived access tokens with long-lived refresh tokens
- **Secure cookie storage** — Tokens stored with `httpOnly` and `secure` flags
- **Password hashing** — bcryptjs with salt rounds for secure password storage

### Authorization

- **Role-based access control (RBAC)** — Three-tier permission system
- **Route-level middleware** — Authorization checks on protected endpoints
- **Project-scoped permissions** — Users can only access projects they belong to

### Input Validation & Sanitization

- **Zod schema validation** — Strict input validation on all endpoints
- **Request sanitization** — Prevention of injection attacks
- **File upload restrictions** — Size limits (5MB) and file count limits (5 files per upload)

### Additional Measures

- **CORS configuration** — Configurable cross-origin request handling
- **Email verification** — Account verification via secure tokens
- **Password reset tokens** — Time-limited tokens for secure password recovery

---

## File Management

- **Storage Location**: `public/images/`
- **Max File Size**: 5MB per file
- **Max Files per Upload**: 5 files
- **Supported Operations**: Upload, metadata tracking (URL, MIME type, size)
- **Middleware**: Multer for secure multipart/form-data handling

---

## Project Structure

```
project-base/
├── docs/                      # Documentation files
│   ├── AUTH.md               # Authentication system docs
│   ├── PRD.md                # Product Requirements Document
│   └── VALIDATION.md         # Validation schemas docs
├── public/
│   └── images/               # File upload storage
├── src/
│   ├── app.js                # Express app configuration
│   ├── index.js              # Server entry point
│   ├── controllers/          # Route handlers
│   │   ├── auth.controllers.js
│   │   └── healthcheck.controllers.js
│   ├── db/
│   │   └── index.js          # Database connection
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── sanitization.middleware.js
│   │   └── validation.middleware.js
│   ├── models/               # Mongoose schemas
│   │   └── user.model.js
│   ├── routers/              # Route definitions
│   │   ├── auth.routes.js
│   │   ├── healthcheck.routes.js
│   │   ├── project.routes.js
│   │   └── task.routes.js
│   ├── utils/                # Utility functions
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── AsyncHandler.js
│   │   ├── constants.js
│   │   └── mail.js
│   └── validators/           # Zod validation schemas
│       ├── index.js
│       └── response.schemas.js
└── package.json
```

---

## License

This project is licensed under the **ISC License**.

---

## Author

**Rohan Bairagi**

- GitHub: [@ROHANBAIRAGI123](https://github.com/ROHANBAIRAGI123)

---

<p align="center">
  <b>Project Camp Backend</b> — Built with ❤️ for seamless project collaboration
</p>
