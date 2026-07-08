// import dotenv from "dotenv";
// dotenv.config();

// import app from "./app";
// import connectPostgres, { connectDB } from "./config/db";
// import { initSocket } from "./config/socket";
// import http from "http";

// const PORT = process.env.PORT || 4000;

// const startServer = async () => {
//   try {
//     await connectDB(); // ✅ wait for DB
//     await connectPostgres();
//     console.log("✅ MongoDB Connected");

//     // create HTTP server
//     const server = http.createServer(app);

//     // initialize socket
//     initSocket(server);

//     server.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });

//   } catch (error) {
//     console.error("❌ Database connection failed:", error);
//     process.exit(1); // ❌ stop server if DB fails
//   }
// };

// startServer();

import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectPostgres, { connectDB } from "./config/db";
import { initSocket } from "./config/socket";
import http from "http";

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    // ✅ Connect to databases
    await connectDB(); // MongoDB
    await connectPostgres(); // PostgreSQL
    console.log("✅ Databases Connected Successfully");

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize socket
    initSocket(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 Swagger UI available at: http://localhost:${PORT}/api-docs`);
      
      // ✅ Log production URL if available
      if (process.env.PRODUCTION_URL) {
        console.log(`📚 Production Swagger: ${process.env.PRODUCTION_URL}/api-docs`);
      }
      
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✅ Server ready to accept requests`);
    });

    // ✅ Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// ✅ Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, log and continue
});

// ✅ Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit immediately, log and continue
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();