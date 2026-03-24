import Message from "./message.model";
import { CreateMessageData, IMessage } from "./message.type";

export const createMessage = async (data: CreateMessageData): Promise<IMessage> => {
  return Message.create(data);
};

export const getMessages = async (user1: string, user2: string): Promise<IMessage[]> => {
  return Message.find({
    $or: [
      { senderId: user1, receiverId: user2 },
      { senderId: user2, receiverId: user1 }
    ]
  }).sort({ createdAt: 1 });
};

export default {
  createMessage,
  getMessages
};