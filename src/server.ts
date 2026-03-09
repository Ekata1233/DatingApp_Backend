import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectPostgres, { connectDB } from "./config/db";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB(); // ✅ wait for DB
    await connectPostgres();
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // ❌ stop server if DB fails
  }
};

startServer();
