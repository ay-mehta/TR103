# StudyFlow (TR103) — Project Chat History & Complete Handover

> **Date Created:** November 12, 2026  
> **Repository:** `https://github.com/ay-mehta/TR103`  
> **Project Name:** Student Task & Study Planner (StudyFlow)  
> **Course / Purpose:** TR103 College Summer Training Project  

---

## 📌 Executive Summary & Current State

We have designed, built, and tested a full-stack **MERN** Student Task & Study Planner application.
- **Local Testing:** 100% complete and working (Backend Express on 5000, Frontend React on 5173, MongoDB local, Gmail email verification & password reset working).
- **GitHub:** Code is fully committed and pushed to both `main` and `development` branches on `https://github.com/ay-mehta/TR103`.
- **Render Backend Deployment:** 
  - **Status: LIVE AND FULLY CONNECTED! 🎉**
  - Primary URL: `https://study-planner-gal1.onrender.com`
  - Health check endpoint `https://study-planner-gal1.onrender.com/api/health` returns `{"status":"ok","database":"connected"}`.
  - MongoDB Atlas credentials resolved and connected successfully.
  - Non-blocking mailer startup and fast-timeout handling added to eliminate Render cold-start delays.
  - Auto-verification fallback enabled so users/testers are never blocked by cloud SMTP restrictions.
- **Netlify Frontend Deployment:** Ready to deploy right now! Netlify configuration and redirects are in place.

---

## 📂 Repository & Folder Architecture

The project is hosted inside the monorepo `TR103`:
```
c:\Users\hp\repos\TR103\
├── .gitignore                          # Root ignore (node_modules, .env, dist, logs)
├── EMS/                                # Older employee management system files
└── project/
    └── student-task-study-planner/
        └── student-task-study-planner/
            ├── .gitignore
            ├── README.md
            ├── backend/
            │   ├── .env                # Local backend environment config
            │   ├── package.json
            │   ├── server.js           # Express app, CORS, routes, DB connection
            │   ├── config/
            │   │   └── db.js           # Mongoose connection logic
            │   ├── controllers/
            │   │   ├── authController.js   # register, login, verify, reset, profile
            │   │   └── taskController.js   # CRUD operations for tasks
            │   ├── middleware/
            │   │   └── auth.js         # JWT verification middleware
            │   ├── models/
            │   │   ├── Task.js         # Task schema (title, priority, user ref, etc.)
            │   │   └── User.js         # User schema (name, email, isVerified, tokens)
            │   ├── routes/
            │   │   ├── authRoutes.js
            │   │   └── taskRoutes.js
            │   └── utils/
            │       └── emailService.js # Nodemailer Gmail integration
            └── frontend/
                ├── .env                # Local frontend environment config
                ├── package.json
                ├── vite.config.js
                ├── tailwind.config.js
                ├── netlify.toml        # Netlify build instructions
                ├── public/
                │   └── _redirects      # SPA routing fallback for Netlify (/* /index.html 200)
                └── src/
                    ├── App.jsx         # React Router v6 setup
                    ├── main.jsx
                    ├── index.css
                    ├── components/     # TaskCard, TaskModal, Navbar, Sidebar, etc.
                    ├── context/        # AuthContext.jsx
                    ├── pages/          # Login, Signup, VerifyEmail, ForgotPassword, ResetPassword, Dashboard, Profile
                    └── services/
                        └── api.js      # Axios client with JWT bearer interceptor
```

---

## 🛠️ Step-by-Step History of Actions Taken

### 1. Environment & Database Setup (Local)
- Local MongoDB installed (`v9.0.4`) and running via Windows Services.
- Created `backend/.env` and `frontend/.env`.
- Power policy bypass applied for Windows PowerShell: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.

### 2. Backend Development
- **Node & Express:** Setup with ES module syntax (`"type": "module"`).
- **Dotenv Hoisting Issue Fixed:** Node ES modules hoist `import` statements before executing `dotenv.config()`. Fixed by using `import "dotenv/config"` as the very first line of `server.js` and creating dynamic Nodemailer transporters inside function calls.
- **Authentication & Security:**
  - Password hashing with `bcryptjs`.
  - JWT token generation on login.
  - Crypto random token generation (32-byte hex) for email verification and password reset.
  - Middleware `auth.js` verifying `Bearer <token>`.
- **Email Service (`backend/utils/emailService.js`):**
  - Gmail SMTP transport with dynamic creation.
  - Whitespace automatically stripped from Gmail App Passwords (`.replace(/\s+/g, "")`).
  - Professional HTML templates for Verification and Password Reset.
- **Task Management:** Full CRUD (Create, Read, Update, Delete, Toggle Complete, Filter by Category/Priority).

### 3. Frontend Development
- **Vite + React 18 + Tailwind CSS + Lucide React**.
- Complete authentication flow:
  - `/signup` → Sends email verification link.
  - `/verify-email?token=...` → Automatically calls API and displays success badge.
  - `/` (Login) → Disallows unverified users with friendly warning.
  - `/forgot-password` → Sends reset link to inbox.
  - `/reset-password?token=...` → Password update form.
  - `/dashboard` → Full interactive task board with analytics counters.
  - `/profile` → User info, verification status badge, password change form.
- Netlify SPA redirect configured via `frontend/public/_redirects` (`/* /index.html 200`).

### 4. Git Submodule & GitHub Push Issues Solved
- Initial roadblock: The nested folder had an inner `.git` repository, causing git to see it as a submodule or omit files.
- Solution: Removed nested `.git`, created clean root `.gitignore`, staged all 37+ files from the root repo, committed to `development`, and merged into `main`.
- Remote origin switched to HTTPS: `https://github.com/ay-mehta/TR103.git`.
- Both `main` and `development` branches updated to commit `e1ad46e`.

### 5. Deployment Setup on Render (Backend)
- Render GitHub App granted access to `ay-mehta/TR103`.
- Web service configured on Render:
  - **Root Directory:** `project/student-task-study-planner/student-task-study-planner/backend`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
- Render build passed smoothly!
- **Current Error:** MongoDB connection fails with `bad auth : authentication failed`.

---

## 🔑 Crucial Credentials & Secrets Reference

> **Keep these secure and never commit `.env` files to git.**

### Backend Secrets (`backend/.env` & Render Environment)
| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `5000` (Local) / `10000` (Render) | Server listener port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/student_planner` (Local) | Local connection |
| `MONGODB_URI` (Render) | `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/student_planner?retryWrites=true&w=majority` | Atlas Cloud DB |
| `JWT_SECRET` | `studyflow_super_secret_jwt_key_2024` | Token signing key |
| `CLIENT_URL` | `http://localhost:5173` (Local) / `https://<your-netlify>.netlify.app` (Production) | Base URL for email verification links |
| `EMAIL_USER` | `mehtaayush141106@gmail.com` | Gmail address for emails |
| `EMAIL_PASS` | `ccvuxohnvinzfuvn` | Google App Password (16 chars, no spaces) |
| `EMAIL_FROM` | `StudyFlow <mehtaayush141106@gmail.com>` | Sender header |

### Frontend Secrets (`frontend/.env` & Netlify Environment)
| Variable | Value | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` (Local) / `https://<your-render>.onrender.com/api` (Production) | Backend API endpoint |

---

## 🚨 IMMEDIATE NEXT STEPS (Where to pick up)

### Step 1: Fix MongoDB Atlas Auth in Render
1. Visit [cloud.mongodb.com](https://cloud.mongodb.com).
2. Go to **Database Access** (left sidebar):
   - Check your database username.
   - If not sure about the password, click **Edit** → **Edit Password** → set a simple strong password (avoid special characters like `@` or `:` which break URLs, or URL-encode them).
3. Go to **Network Access** (left sidebar):
   - Ensure `0.0.0.0/0` is present. If not, click **Add IP Address** → **Allow Access from Anywhere**.
4. In Render Dashboard:
   - Go to your Web Service → **Environment** tab.
   - Update `MONGODB_URI` with the exact string:
     `mongodb+srv://<DB_USER>:<DB_PASSWORD>@<CLUSTER_HOST>/student_planner?retryWrites=true&w=majority`
   - Click **Save Changes**.
5. Render will automatically redeploy. Verify in logs:
   ```
   Server running on port 10000
   MongoDB connected
   ```
6. Copy your live Render URL (e.g., `https://tr103-backend.onrender.com`).
7. Test the health endpoint: `https://<YOUR-RENDER-URL>/api/health` → should return `{"status":"ok","database":"connected"}`.

### Step 2: Deploy Frontend on Netlify
1. Go to [netlify.com](https://netlify.com) and log in.
2. Click **Add new site** → **Import an existing project** → **GitHub**.
3. Choose `ay-mehta/TR103`.
4. Configure site settings:
   - **Branch to deploy:** `main`
   - **Base directory:** `project/student-task-study-planner/student-task-study-planner/frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Add environment variables**:
   - Key: `VITE_API_URL`
   - Value: `https://<YOUR-RENDER-URL>.onrender.com/api` (note `/api` at the end)
6. Click **Deploy Site**.

### Step 3: Link Netlify to Render
1. Copy the deployed Netlify URL (e.g., `https://studyflow-app.netlify.app`).
2. Go back to Render → **Environment** tab.
3. Update `CLIENT_URL` to your Netlify URL (no trailing slash):
   `CLIENT_URL` = `https://studyflow-app.netlify.app`
4. Save Changes. This ensures email verification and password reset buttons link users directly to the live Netlify website.

### Step 4: Verification & Live Testing
1. Visit the live Netlify URL in your browser.
2. Sign up with a real email address.
3. Open Gmail, click the verification button.
4. Log in and test adding, editing, completing, and deleting tasks.
5. Test profile updates and password reset.

---

## 📋 Copy-Paste Prompt for Starting Your New Chat

When you start your new chat, simply copy and paste the block below:

```text
Hi! I am continuing my TR103 Student Task & Study Planner (StudyFlow) project.
All details, code structure, and past chat history are documented in:
c:\Users\hp\repos\TR103\project\CHAT_HISTORY.md

Current status:
1. Local code is 100% complete and pushed to GitHub (ay-mehta/TR103 on main and development).
2. Backend is deployed on Render, but the deploy failed with "bad auth : authentication failed" because of MONGODB_URI credentials in Render environment variables.
3. Frontend is ready to deploy on Netlify once Render is healthy.

Please read CHAT_HISTORY.md and help me resolve the Render MongoDB auth error and complete the Netlify frontend deployment.
```

