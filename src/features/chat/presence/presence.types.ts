// src/modules/chat/presence/presence.types.ts

/**
 * User presence status.
 */
export type PresenceStatus =
  | "ONLINE"
  | "OFFLINE";

/**
 * Presence information stored/returned
 * for a user.
 */
export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: Date | null;
  socketIds: string[];
}

/**
 * Presence event sent through Socket.IO.
 */
export interface PresenceEvent {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: Date | null;
}

/**
 * Presence response.
 */
export interface PresenceResponse {
  userId: string;
  isOnline: boolean;
  lastSeenAt: Date | null;
}

/**
 * Multiple user presence request.
 */
export interface GetUsersPresenceInput {
  userIds: string[];
}