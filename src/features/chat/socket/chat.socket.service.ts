// src/modules/chat/sockets/chat.socket.service.ts

import { Server } from "socket.io";

import { chatService } from "../chat.service";
import { messageService } from "../message/message.service";

import {
    JoinConversationSocketPayload,
    LeaveConversationSocketPayload,
    MessageDeliveredSocketPayload,
    MessageReadSocketPayload,
    SendMessageSocketPayload,
    TypingSocketPayload,
} from "./chat.socket.types";

export const chatSocketService = {
    /**
     * Send a message.
     *
     * Flow:
     *
     * Socket
     *   ↓
     * messageService
     *   ↓
     * PostgreSQL
     *   ↓
     * Receiver socket
     */
    async sendMessage(
        io: Server,
        userId: string,
        payload: SendMessageSocketPayload
    ) {

        /**
        * 1. Verify participant
        */
        await chatService.verifyConversationParticipant(
            payload.conversationId,
            userId
        );
        /**
         * Save message to database.
         */
        const message =
            await messageService.createMessage({
                userId,

                conversationId:
                    payload.conversationId,

                content:
                    payload.content,

                messageType:
                    payload.messageType,

                mediaUrl:
                    payload.mediaUrl,
            });

        /**
         * Send message to conversation room.
         *
         * Every participant who joined this room
         * will receive the message.
         *
         * Example:
         *
         * conversation:123
         */
        io.to(
            `conversation:${payload.conversationId}`
        ).emit("message:receive", message);

        /**
         * Return saved message to event handler.
         */
        return message;
    },

    /**
     * Join a conversation room.
     */
    async joinConversation(
        socket: any,
        userId: string,
        payload: JoinConversationSocketPayload
    ) {
        /**
         * Verify that user belongs to conversation.
         */
        console.log("JOIN REQUEST");
        console.log("userId:", userId);
        console.log("conversationId:", payload.conversationId);

        await chatService.getMessages({
            userId,

            conversationId:
                payload.conversationId,

            limit: 1,
        });

        /**
         * Join room.
         */
        await socket.join(
            `conversation:${payload.conversationId}`
        );

        return {
            conversationId:
                payload.conversationId,

            joined: true,
        };
    },

    /**
     * Leave conversation room.
     */
    async leaveConversation(
        socket: any,
        payload: LeaveConversationSocketPayload
    ) {
        await socket.leave(
            `conversation:${payload.conversationId}`
        );

        return {
            conversationId:
                payload.conversationId,

            left: true,
        };
    },

    /**
     * Start typing.
     */
    async startTyping(
        io: Server,
        userId: string,
        payload: TypingSocketPayload
    ) {
        /**
         * Don't need DB query for every keystroke.
         *
         * The socket user is already authenticated.
         */

        io.to(
            `conversation:${payload.conversationId}`
        )
            .except(
            /**
             * We need socket.id here if we want to
             * exclude sender.
             *
             * This method receives only io currently,
             * so this implementation can broadcast
             * to the room.
             */
        )
            .emit("typing:start", {
                conversationId:
                    payload.conversationId,

                userId,
            });

        return {
            success: true,
        };
    },

    /**
     * Stop typing.
     */
    async stopTyping(
        io: Server,
        userId: string,
        payload: TypingSocketPayload
    ) {
        io.to(
            `conversation:${payload.conversationId}`
        ).emit("typing:stop", {
            conversationId:
                payload.conversationId,

            userId,
        });

        return {
            success: true,
        };
    },

    /**
     * Mark message as delivered.
     */
    async markMessageDelivered(
        io: Server,
        userId: string,
        payload: MessageDeliveredSocketPayload
    ) {
        const message =
            await messageService.markDelivered({
                userId,

                messageId:
                    payload.messageId,
            });

        /**
         * Notify conversation participants.
         */
        io.to(
            `conversation:${message.conversationId}`
        ).emit("message:delivered", {
            messageId: message.id,

            conversationId:
                message.conversationId,

            deliveredAt:
                message.deliveredAt,
        });

        return message;
    },

    /**
     * Mark message as read.
     */
    async markMessageRead(
        io: Server,
        userId: string,
        payload: MessageReadSocketPayload
    ) {
        const message =
            await messageService.markRead({
                userId,

                messageId:
                    payload.messageId,
            });

        /**
         * Notify participants.
         */
        io.to(
            `conversation:${message.conversationId}`
        ).emit("message:read", {
            messageId: message.id,

            conversationId:
                message.conversationId,

            readAt:
                message.readAt,
        });

        return message;
    },

    /**
     * Mark complete conversation as read.
     */
    async markConversationRead(
        io: Server,
        userId: string,
        conversationId: string
    ) {
        const result =
            await messageService.markConversationRead({
                userId,

                conversationId,
            });

        /**
         * Notify the conversation room.
         */
        io.to(
            `conversation:${conversationId}`
        ).emit("conversation:read", {
            conversationId,

            userId,

            readAt: new Date(),
        });

        return result;
    },
};