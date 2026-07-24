// rose.service.ts
import { PrismaClient, RoseType } from '@prisma/client';
import { RoseRepository } from './rose.repository';
import { ROSE_CONSTANTS } from './rose.constants';
import {
  SendRoseDTO,
  SendRoseResponse,
  RoseBalanceResponse,
  RoseHistoryQuery,
  PaginatedRoseHistory,
} from './rose.types';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

export class RoseService {
  private repository: RoseRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new RoseRepository(prisma);
  }

  async sendRose(
    senderId: string,
    data: SendRoseDTO
  ): Promise<SendRoseResponse> {
    const { receiverId, roseType, message } = data;

    // Validate not sending to self
    if (senderId === receiverId) {
      throw new AppError(400, ROSE_CONSTANTS.ERRORS.SELF_SEND);
    }

    // Check if users are blocked
    const isBlocked = await this.repository.checkBlockedStatus(
      senderId,
      receiverId
    );
    if (isBlocked) {
      throw new AppError(403, ROSE_CONSTANTS.ERRORS.BLOCKED_USER);
    }

    // Check if already matched
    const isMatched = await this.repository.checkMatch(senderId, receiverId);
    if (isMatched) {
      throw new AppError(400, ROSE_CONSTANTS.ERRORS.ALREADY_MATCHED);
    }

    // Check daily limits
    const todayRoses = await this.repository.countTodayRoses(senderId);
    if (todayRoses >= ROSE_CONSTANTS.MAX_ROSES_PER_DAY) {
      throw new AppError(429, ROSE_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED);
    }

    // Check same user daily limit
    const rosesToUser = await this.repository.countTodayRosesToUser(
      senderId,
      receiverId
    );
    if (rosesToUser >= ROSE_CONSTANTS.MAX_ROSES_TO_SAME_USER_PER_DAY) {
      throw new AppError(429, ROSE_CONSTANTS.ERRORS.SAME_USER_LIMIT);
    }

    // Check cooldown period
    const cooldownTime = new Date(
      Date.now() - ROSE_CONSTANTS.ROSE_COOLDOWN_PERIOD
    );
    const lastRose = await this.repository.checkExistingRose(
      senderId,
      receiverId,
      cooldownTime
    );
    if (lastRose) {
      throw new AppError(429, ROSE_CONSTANTS.ERRORS.COOLDOWN_ACTIVE);
    }

    // Get user balance
    const balance = await this.repository.getOrCreateBalance(senderId);

    // Validate rose availability
    if (roseType === 'FREE') {
      if (balance.freeRoses <= 0) {
        throw new AppError(400, ROSE_CONSTANTS.ERRORS.INSUFFICIENT_ROSES);
      }
    } else {
      if (balance.purchasedRoses <= 0) {
        throw new AppError(
          400,
          ROSE_CONSTANTS.ERRORS.PURCHASED_ROSES_UNAVAILABLE
        );
      }
    }

    // Execute transaction
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Deduct rose from balance
        await this.repository.deductRose(senderId, roseType, tx);

        // Create rose transaction
        const rose = await this.repository.createRoseTransaction(
          {
            senderId,
            receiverId,
            type: roseType,
            message,
          },
          tx
        );

        // Get updated balance
        const updatedBalance = await this.repository.getUserBalance(senderId);

        if (!updatedBalance) {
          throw new AppError(500, 'Failed to retrieve updated balance');
        }

        return { rose, updatedBalance };
      });

      // Log success
      logger.info('Rose sent successfully', {
        senderId,
        receiverId,
        roseType,
        roseId: result.rose.id,
      });

      // Format response
      const roseResponse = {
        id: result.rose.id,
        senderId: result.rose.senderId,
        receiverId: result.rose.receiverId,
        type: result.rose.type,
        message: result.rose.message || undefined,
        createdAt: result.rose.createdAt,
        sender: {
          id: result.rose.sender.id,
          name: result.rose.sender.name,
          photos: result.rose.sender.photos.map((p) => p.url),
        },
      };

      const balanceResponse: RoseBalanceResponse = {
        freeRoses: result.updatedBalance.freeRoses,
        purchasedRoses: result.updatedBalance.purchasedRoses,
        totalRoses:
          result.updatedBalance.freeRoses +
          result.updatedBalance.purchasedRoses,
        lastResetAt: result.updatedBalance.lastResetAt,
      };

      return {
        success: true,
        message:
          roseType === 'FREE'
            ? ROSE_CONSTANTS.SUCCESS.FREE_ROSE_USED
            : ROSE_CONSTANTS.SUCCESS.PURCHASED_ROSE_USED,
        data: {
          rose: roseResponse,
          remainingBalance: balanceResponse,
        },
      };
    } catch (error) {
      logger.error('Failed to send rose', error as Error, {
        senderId,
        receiverId,
        roseType,
      });
      throw error;
    }
  }

  async getBalance(userId: string): Promise<RoseBalanceResponse> {
    const balance = await this.repository.getOrCreateBalance(userId);

    return {
      freeRoses: balance.freeRoses,
      purchasedRoses: balance.purchasedRoses,
      totalRoses: balance.freeRoses + balance.purchasedRoses,
      lastResetAt: balance.lastResetAt,
    };
  }

  async getHistory(
    userId: string,
    query: RoseHistoryQuery
  ): Promise<PaginatedRoseHistory> {
    return this.repository.getRoseHistory(userId, query);
  }

  async addPurchasedRoses(
    userId: string,
    amount: number
  ): Promise<RoseBalanceResponse> {
    if (amount <= 0) {
      throw new AppError(400, 'Amount must be positive');
    }

    const updatedBalance = await this.repository.addPurchasedRoses(
      userId,
      amount
    );

    logger.info('Purchased roses added', { userId, amount });

    return {
      freeRoses: updatedBalance.freeRoses,
      purchasedRoses: updatedBalance.purchasedRoses,
      totalRoses:
        updatedBalance.freeRoses + updatedBalance.purchasedRoses,
      lastResetAt: updatedBalance.lastResetAt,
    };
  }
}