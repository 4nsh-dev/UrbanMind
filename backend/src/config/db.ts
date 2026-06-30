import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("CRITICAL ERROR: MONGO_URI environment variable is missing in setup variables.");
    process.exit(1);
  }

  try {
    mongoose.connection.on("connected", () => {
      console.log("🟢 Successfully synchronized with MongoDB Cloud Database.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("🔴 MongoDB connection pipeline experienced an error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ Mongoose connection pipeline disconnected.");
    });

    await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
  } catch (error) {
    console.error("🔴 Failed to initialize database connection during startup process:", error);
    process.exit(1);
  }
}

// Support graceful termination of pending DB processes
export async function closeDatabase(): Promise<void> {
  await mongoose.connection.close();
  console.log("🔒 MongoDB connection pool shutdown completed.");
}
