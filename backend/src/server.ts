import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase, closeDatabase } from "./config/db.js";
import apiRouter from "./routes/api.js";

// Load local environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Standard security and transmission settings
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Basic server diagnostic tracer
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request received on: ${req.url}`);
  next();
});

// Base API healthcheck
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "online",
    activeContext: "Community Hero Backend Core",
    timezone: "UTC",
    nodeVersion: process.version,
    databaseStatus: express.response ? "connected" : "idle"
  });
});

// Mount the API Router bundle
app.use("/api/v1", apiRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔴 Express uncaught exception event detected:", err);
  return res.status(err.status || 500).json({
    error: err.message || "A internal system error interrupted backend data pipelines.",
    stack: NODE_ENV === "development" ? err.stack : undefined
  });
});

// Initialize database & turn on listening loops
async function bootstrapServer() {
  // Connect to the Mongoose cluster database in appropriate environments
  if (process.env.MONGO_URI) {
    await connectDatabase();
  } else {
    console.warn("⚠️ Warning: MONGO_URI missing from .env settings profiles. Cloud database requests will execute fallback simulation cycles.");
  }

  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`======================================================`);
    console.log(`🚀 COMMUNITY HERO AI BACKEND CORE STATUS: STABLE`);
    console.log(`📍 Operating Environment: ${NODE_ENV}`);
    console.log(`🔗 Interface port: http://localhost:${PORT}`);
    console.log(`📜 APIs Root Pointer: http://localhost:${PORT}/api/v1`);
    console.log(`======================================================`);
  });

  // Graceful termination processes for container clouds (Cloud Run / Docker)
  const shutdown = async () => {
    console.log("⚠️ SIGTERM/SIGINT signal intercepted. Commencing graceful database connection shutdowns.");
    server.close(async () => {
      await closeDatabase();
      console.log("👋 Closed Express network socket services. Exit complete.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrapServer().catch((error) => {
  console.error("Failed to bootstrap primary backend services:", error);
  process.exit(1);
});
