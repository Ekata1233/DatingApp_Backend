// // import { Server as SocketIOServer } from "socket.io";
// // import { Server as HTTPServer } from "http";
// // import registerSockets from "../sockets";

// // export default function setupSocket(server: HTTPServer) {

// //   const io = new SocketIOServer(server, {
// //     cors: {
// //       origin: "*",
// //     },
// //   });

// //    io.on("connection", (socket) => {
// //     console.log("User connected:", socket.id);
// //   });

// //   registerSockets(io);
// // }

// import { Server } from "socket.io";
// import http from "http";

// export const initSocket = (server: http.Server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//     },
//   });

//   console.log("try to connect web socket")

//   io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);

//     socket.on("disconnect", () => {
//       console.log("User disconnected");
//     });
//   });

//   return io;
// };


import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  console.log("try to connect web socket");

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId); // user room
      console.log("User joined room:", userId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};
