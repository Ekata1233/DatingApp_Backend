import { Request, Response } from "express";
import * as service from "./message.service";
import { getIO } from "../../../config/socket";

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  params: {
    receiverId: string;
  };
}

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {

  const { receiverId } = req.params;

  const messages = await service.getMessages(
    req.user!.id,
    receiverId
  );

  res.json(messages);

};


export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {

  const senderId = "user1";
  const { receiverId, message } = req.body;

  console.log("msage : ", message);

  const newMessage = await service.createMessage({
    senderId,
    receiverId,
    content: message
  });

  const io = getIO();

  // emit message to receiver
  io.to(receiverId).emit("receiveMessage", newMessage);

  res.json(newMessage);
};

