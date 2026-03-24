import mongoose, { Schema, Document, Model } from "mongoose";
import { IMessage } from "./message.type";

const messageSchema: Schema<IMessage> = new Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },

    content: { type: String },

    type: {
      type: String,
      enum: ["text", "image", "video", "emoji"],
      default: "text",
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  { timestamps: true }
);

const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);

export default Message;