import { Server, Socket } from "socket.io";

interface OnlineUsers {
  [userId: string]: string;
}

const onlineUsers: OnlineUsers = {};

export default (io: Server, socket: Socket): void => {

  socket.on("user_online", (userId: string) => {

    onlineUsers[userId] = socket.id;

    io.emit("user_online", userId);

  });

  socket.on("disconnect", () => {

    for (const user in onlineUsers) {

      if (onlineUsers[user] === socket.id) {
        delete onlineUsers[user];
        io.emit("user_offline", user);
      }

    }

  });

};