import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export interface AuthenticatedSocket extends Socket {
  userId: string;
}

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    if (!decoded.userId) {
      return next(new Error("Invalid authentication token"));
    }

    (socket as AuthenticatedSocket).userId = decoded.userId;

    next();
  } catch (error) {
    console.error("Socket authentication failed:", error);

    next(new Error("Unauthorized"));
  }
};