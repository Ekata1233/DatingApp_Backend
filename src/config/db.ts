import mongoose from "mongoose";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB(): Promise<mongoose.Mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/* =====================================================
   PostgreSQL Connection (NEW CODE ADDED)
===================================================== */

let pgCached = (global as any).pg;

if (!pgCached) {
  pgCached = (global as any).pg = {
    pool: null,
  };
}

// export function connectPostgres(): Pool {
//   if (pgCached.pool) {
//     return pgCached.pool;
//   }

//   const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
// });
//   pool.connect()
//     .then(() => {
//       console.log("PostgreSQL Connected Successfully");
//     })
//     .catch((err) => {
//       console.error("PostgreSQL Connection Error:", err);
//     });

//   pgCached.pool = pool;

//   return pool;
// }

// export default connectPostgres;

export function connectPostgres(): Pool {
  if (pgCached.pool) {
    return pgCached.pool;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  pool
    .query("SELECT 1")
    .then(() => {
      console.log("✅ PostgreSQL Connected Successfully");
    })
    .catch((err) => {
      console.error("❌ PostgreSQL Connection Error:", err);
    });

  pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL error:", err);
  });

  pgCached.pool = pool;

  return pool;
}

export default connectPostgres;
