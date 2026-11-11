# Student Task & Study Planner

A full-stack MERN application for managing academic work. Students can create, edit, delete, categorise, complete, and track tasks. Tasks are stored in MongoDB.

## Features
- Add, edit, and delete tasks
- Set a title, description, category, and deadline
- Categories: Assignments, Exams, Projects, Personal
- Mark tasks as complete or pending
- View all, pending, and completed tasks
- Dashboard statistics and category breakdown
- Responsive layout for desktop and mobile
- MongoDB persistence through an Express REST API

## Tech stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Styling: plain CSS

## Requirements
Install Node.js (LTS) and npm. You also need either:
- MongoDB Community Server running locally, or
- A MongoDB Atlas database.

## 1. Configure the backend

Open a terminal in the project folder:

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and update the connection string:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/student_planner
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string. Keep your `.env` file private; it is ignored by Git.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Visit `http://localhost:5000/api/health` to check that it is running and connected to MongoDB.

## 2. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` (or copy `.env.example`) with:

```env
VITE_API_URL=http://localhost:5000/api
```

Start React:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## 3. Run both parts
Keep the backend and frontend terminals running at the same time:
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/tasks` | List tasks; optional `?status=pending` or `?status=completed` |
| GET | `/api/tasks/stats` | Dashboard statistics |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| PATCH | `/api/tasks/:id/toggle` | Toggle completion |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/health` | API/database health check |

## Suggested GitHub workflow

From the project root:

```bash
git init
git add .
git commit -m "Build student task and study planner"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/student-task-study-planner.git
git push -u origin main
```

Create an empty repository on GitHub first, then replace the example remote URL with your repository URL.

## Deployment notes
- Deploy the backend to a Node-compatible host and set `MONGODB_URI`, `CLIENT_URL`, and `PORT` in its environment settings.
- Deploy the frontend to a static hosting provider and set `VITE_API_URL` to your deployed backend's `/api` URL.
- Add your deployed frontend origin to the backend's `CLIENT_URL`.
- Never commit `.env` files or expose database credentials.

## Project structure

```text
student-task-study-planner/
├── backend/
│   ├── config/db.js
│   ├── controllers/taskController.js
│   ├── middleware/errorHandler.js
│   ├── models/Task.js
│   ├── routes/taskRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

This is an educational starter project. It does not include user accounts or authentication, so run it locally for personal coursework unless you add authentication before making it publicly usable.
