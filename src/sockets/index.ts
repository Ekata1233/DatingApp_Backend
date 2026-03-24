import { Server, Socket } from "socket.io";
import messageSocket from "./message.socket";
import presenceSocket from "./presence.socket";

export default function registerSockets(io: Server): void {

  io.on("connection", (socket: Socket) => {

    messageSocket(io, socket);
    presenceSocket(io, socket);

  });

}