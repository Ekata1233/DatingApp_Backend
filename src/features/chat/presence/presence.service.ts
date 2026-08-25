// src/modules/chat/presence/presence.service.ts

import { redis } from "../../../lib/redis";

import {
  GetUsersPresenceInput,
  PresenceEvent,
  PresenceResponse,
  PresenceStatus,
  UserPresence,
} from "./presence.types";

/**
 * Redis key prefix.
 */
const PRESENCE_KEY = "presence";

/**
 * Presence TTL.
 *
 * We don't want a user to remain ONLINE forever
 * if their application crashes without sending
 * a disconnect event.
 *
 * 120 seconds = 2 minutes.
 */
const PRESENCE_TTL = 120;

/**
 * Generate Redis key.
 */
const getPresenceKey = (
  userId: string
): string => {
  return `${PRESENCE_KEY}:${userId}`;
};

export const presenceService = {
  /**
   * Mark user online.
   *
   * Called when Socket.IO connection succeeds.
   */
  async setOnline(
    userId: string,
    socketId: string
  ): Promise<PresenceEvent> {
    const key = getPresenceKey(userId);

    const data = await redis.get<string>(key);

    let presence: UserPresence;

    if (data) {
      presence =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      if (!presence.socketIds) {
        presence.socketIds = [];
      }

      if (!presence.socketIds.includes(socketId)) {
        presence.socketIds.push(socketId);
      }

      presence.status = "ONLINE";
      presence.lastSeenAt = null;
    } else {
      presence = {
        userId,
        status: "ONLINE",
        lastSeenAt: null,
        socketIds: [socketId],
      };
    }

    await redis.set(
      key,
      JSON.stringify(presence),
      {
        ex: PRESENCE_TTL,
      }
    );

    return {
      userId,
      status: "ONLINE",
      lastSeenAt: null,
    };
  },

  /**
   * Mark user offline.
   *
   * Called when Socket.IO disconnects.
   */
  async setOffline(
    userId: string,
    socketId: string
  ): Promise<PresenceEvent | null> {
    const key = getPresenceKey(userId);

    const data = await redis.get<string>(key);

    if (!data) {
      return null;
    }

    const presence: UserPresence =
      typeof data === "string"
        ? JSON.parse(data)
        : data;

    if (!presence.socketIds) {
      return null;
    }

    /**
     * Remove only the disconnected socket.
     */
    presence.socketIds =
      presence.socketIds.filter(
        (id) => id !== socketId
      );

    /**
     * Other sockets still connected.
     */
    if (presence.socketIds.length > 0) {
      await redis.set(
        key,
        JSON.stringify(presence),
        {
          ex: PRESENCE_TTL,
        }
      );

      return null;
    }

    /**
     * No sockets remaining.
     * User is now offline.
     */
    const now = new Date();

    const offlinePresence: UserPresence = {
      userId,
      status: "OFFLINE",
      lastSeenAt: now,
      socketIds: [],
    };

    await redis.set(
      key,
      JSON.stringify(offlinePresence),
      {
        ex: 60 * 60 * 24 * 30,
      }
    );

    return {
      userId,
      status: "OFFLINE",
      lastSeenAt: now,
    };
  },

  /**
   * Get one user's presence.
   */
  async getPresence(
    userId: string
  ): Promise<PresenceResponse> {
    const key = getPresenceKey(userId);

    const data =
      await redis.get<string>(key);

    /**
     * If Redis has no record,
     * consider user offline.
     */
    if (!data) {
      return {
        userId,

        isOnline: false,

        lastSeenAt: null,
      };
    }

    const presence =
      typeof data === "string"
        ? JSON.parse(data) as UserPresence
        : data as UserPresence;

    /**
     * Check current status.
     */
    return {
      userId,

      isOnline:
        presence.status === "ONLINE",

      lastSeenAt:
        presence.lastSeenAt
          ? new Date(
            presence.lastSeenAt
          )
          : null,
    };
  },

  /**
   * Get presence of multiple users.
   *
   * Useful for:
   *
   * Feed
   * Matches
   * Conversation list
   */
  async getUsersPresence(
    data: GetUsersPresenceInput
  ): Promise<PresenceResponse[]> {
    if (!data.userIds.length) {
      return [];
    }

    /**
     * Remove duplicate user IDs.
     */
    const uniqueUserIds = [
      ...new Set(data.userIds),
    ];

    /**
     * Redis REST clients don't always expose
     * the same multi-get API, so use Promise.all.
     *
     * For a very large list, use Redis MGET
     * or pipelining instead.
     */
    const results =
      await Promise.all(
        uniqueUserIds.map(
          (userId) =>
            this.getPresence(userId)
        )
      );

    return results;
  },

  /**
   * Refresh online user's TTL.
   *
   * Useful for long-running connections.
   */
  async heartbeat(
    userId: string,
    socketId: string
  ): Promise<void> {
    const key = getPresenceKey(userId);

    const data =
      await redis.get<string>(key);

    if (!data) {
      /**
       * Presence expired.
       *
       * Re-create it as online.
       */
      await this.setOnline(userId, socketId)

      return;
    }

    const presence =
      typeof data === "string"
        ? JSON.parse(data) as UserPresence
        : data as UserPresence;

    /**
     * Only refresh if currently online.
     */
    if (presence.status !== "ONLINE") {
      return;
    }

    await redis.expire(
      key,
      PRESENCE_TTL
    );
  },

  /**
   * Remove presence completely.
   *
   * Usually not needed.
   *
   * Useful when:
   * - user logs out everywhere
   * - account deleted
   * - testing
   */
  async clearPresence(
    userId: string
  ): Promise<void> {
    const key = getPresenceKey(userId);

    await redis.del(key);
  },
};