import { Server, Socket } from "socket.io";
import { messageService } from "../features/chat/message/message.service";
import { MessageType } from "@prisma/client";

interface UsersMap {
  [userId: string]: string;
}

interface SendMessageData {
  userId: string;
  receiverId: string;
  conversationId: string;
  content?: string | null;
  messageType: MessageType;
  mediaUrl?: string | null;
}

interface TypingData {
  senderId: string;
  receiverId: string;
}

const users: UsersMap = {};

export default (io: Server, socket: Socket): void => {

  socket.on("join", (userId: string) => {
    users[userId] = socket.id;
  });

  socket.on("send_message", async (data: SendMessageData) => {

    const message = await messageService.createMessage(data);

    const receiverSocket = users[data.receiverId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message", message);
    }

  });

  socket.on("typing", (data: TypingData) => {

    const receiverSocket = users[data.receiverId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", data.senderId);
    }

  });

};