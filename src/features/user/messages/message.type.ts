export interface IMessage extends Document {
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "image" | "video" | "emoji";
  status: "sent" | "delivered" | "seen";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageData {
  senderId: string;
  receiverId: string;
  content: string;
  type?: "text" | "image" | "video" | "emoji";
  status?: "sent" | "delivered" | "seen";
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}