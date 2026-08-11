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
import { prisma } from "./prisma/prismaClient";
import http from "http";
import { initializeSocket } from "./config/socket";

const PORT = process.env.PORT || 4000;


const startServer = async () => {
  try {

    // MongoDB
    await connectDB();
    console.log("✅ MongoDB Connected");
    await connectPostgres();
    await prisma.$connect();
    console.log("✅ Prisma Connected");

    const server = http.createServer(app);
    /**
     * Initialize Socket.IO
     */
    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });


  } catch (error) {

    console.error("❌ Database connection failed:", error);

    await prisma.$disconnect();

    process.exit(1);
  }
};


startServer();