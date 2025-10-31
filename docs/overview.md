# 🧠 Project Overview

This repository contains the backend server for our project.
It’s built with **Node.js**, **Express**, and **TypeScript**, using a **MySQL** database and supporting **OAuth2 or Email/Password authentication**.

The backend provides the core API, authentication system, and database models that the frontend interacts with.

---

## 🚀 Tech Stack

| Tool                        | Purpose                                         |
| --------------------------- | ----------------------------------------------- |
| **Node.js + Express**       | Web framework / server                          |
| **TypeScript**              | Type safety and better tooling                  |
| **MySQL2**                  | SQL database driver for Node.js                 |
| **dotenv**                  | Loads environment variables                     |
| **express-session**         | Session handling and authentication persistence |
| **OAuth2 + Email/Password** | User authentication methods                     |

---

## 🏗️ Project Structure

```
src/
├── config/         # Configuration interfaces & dotenv loading
├── controllers/    # Logic functions (email verification, CSRF, sessions)
├── databases/      # MySQL connection & table initialization
├── models/         # Data models & CRUD methods for each table
├── routes/         # API endpoints grouped by feature or scope
│   ├── api/        # REST API endpoints
│   └── frontend/   # Routes serving frontend-related endpoints
├── types/          # TypeScript interfaces (e.g., extending express-session)
├── utils/          # Common helpers (HTTP errors, responses, enums)
├── app.ts          # Main Express app setup (routes, middleware)
└── server.ts       # Entry point – starts the server
```

---

## ⚙️ How It Works

### **1. Configuration**

Environment variables (like database credentials, API keys, etc.) are stored in a `.env` file and loaded through `dotenv`.
The `/config` folder defines TypeScript interfaces for these configs to ensure type safety.

### **2. Database Layer**

The `/databases` folder:

- Initializes the MySQL connection pool.
- Creates tables if they don’t already exist.
- Ensures a stable connection before the app starts.

Each table has a corresponding file in `/models`, which includes:

- TypeScript interfaces for **new records** and **database rows**.
- CRUD functions (`create`, `read`, `update`, `delete`) for easy data access.

### **3. Controllers (Helpers)**

These files handle logic that supports routes — e.g.:

- Generating and validating email verification tokens.
- Creating and verifying CSRF tokens.
- Managing user sessions and login states.

They can be used directly inside route handlers.

### **4. Routes**

Routes are divided into:

- `/api` — [`endpoints`](./endpoints.md) for API calls (JSON responses).
- `/frontend` — [`routes`](./frontend.md) that serve or interact with frontend pages.

Each route imports the required controller functions to process requests and responses cleanly.

### **5. Utils**

Houses common utilities and shared constants:

- Custom error classes.
- HTTP status enums.
- Functions for standard API responses (`badRequest()`, `internalServerError()`, etc.).

This helps keep routes and controllers cleaner and more consistent.

### **6. App & Server**

- **`app.ts`** imports all routes, middleware, and configures the main Express app.
- **`server.ts`** runs the app by calling `app.listen(...)`.

---

## 🔐 Authentication Flow

Two authentication paths are supported:

1. **OAuth2 (Google or others)**
   - Uses redirect-based login.
   - Sessions are persisted with `express-session`.
   - CSRF protection and `SameSite` handling are configured.

2. **Email/Password**
   - Simple credential-based authentication.
   - Includes email verification and password reset flows.

Session management and token validation helpers live in `/controllers`.

---

## 🧩 Development Commands

| Command       | Description                                      |
| ------------- | ------------------------------------------------ |
| `npm install` | Install dependencies                             |
| `npm start`   | Run in development mode (with ts-node / nodemon) |

---

## 🌐 Environment Variables

You’ll need a `.env` file at the root.
Example:

```
DB_HOST=localhost
DB_USER=user
DB_PASS=ab12cd34
DB_NAME=test_db
SERVER_PORT=3000
SERVER_ADDR=localhost:3000
EMAIL_USER=
JWT_SECRET=
APP_PASSWORD=
REQUIRE_EMAIL_VERIFICATION=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
