import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./config/db";

connectDB()
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
  });

export default app; // ✅ VERY IMPORTANT for Vercel
