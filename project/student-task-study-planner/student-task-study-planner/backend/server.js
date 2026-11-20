import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { verifyMailer, sendVerificationEmail } from "./utils/emailService.js";

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((u) => u.trim().replace(/\/+$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const clean = origin.replace(/\/+$/, "");
      if (
        allowedOrigins.includes(clean) ||
        clean.endsWith(".netlify.app") ||
        clean.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json());

// Friendly root landing for the API
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>StudyFlow API · Online</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f1117; color: #e2e8f0; }
          .card { background: #1a1d27; border: 1px solid #2d3343; border-radius: 16px; padding: 36px 44px; text-align: center; max-width: 520px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(76, 170, 132, 0.15); color: #4caa84; font-weight: 600; font-size: 13px; padding: 6px 14px; border-radius: 999px; margin-bottom: 20px; }
          .dot { width: 8px; height: 8px; background: #4caa84; border-radius: 50%; box-shadow: 0 0 8px #4caa84; }
          h1 { margin: 0 0 8px; font-size: 26px; color: #fff; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
          .btn { display: inline-block; background: #6366f1; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 22px; border-radius: 8px; transition: background .2s; }
          .btn:hover { background: #4f46e5; }
          .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge"><span class="dot"></span> Backend API Live & Connected</div>
          <h1>📚 StudyFlow Backend</h1>
          <p>The Express.js REST API is fully operational and connected to MongoDB Atlas. The client user interface is served from Netlify.</p>
          <a class="btn" href="/api/health" target="_blank">View Health JSON</a>
          <div class="footer">TR103 Summer Training Project · StudyFlow API v1.0</div>
        </div>
      </body>
    </html>
  `);
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

// Diagnostic endpoint to check mail service status
app.get("/api/debug-mail", async (req, res) => {
  const to = (req.query.to || "mehtaayush141106@gmail.com").trim();

  try {
    const result = await sendVerificationEmail({ name: "StudyFlow Tester", email: to }, "test-token-12345");
    return res.json({
      success: true,
      target: to,
      result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      target: to,
      error: err.message,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasGoogleScript: !!process.env.GOOGLE_SCRIPT_URL,
      hasBrevoKey: !!process.env.BREVO_API_KEY
    });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
try {
  await connectDB();
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
  // Run mailer check in background without blocking server port binding
  verifyMailer().catch((err) => console.warn("Mailer background check:", err.message));
} catch (error) {
  console.error("Could not start server.", error.message);
  process.exit(1);
}
