import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

const MAX_REPLY_SAMPLES = 20;
export const MIN_REPLY_SAMPLES = 3;
const MAX_REPLY_TIME_MINUTES = 24 * 60;
export interface UserReplyStatsResult {
    replyMinutes: number | null;
    label: string | null;
    sampleCount: number;
}
/**
 * Calculate median.
 */
const calculateMedian = (
    values: number[],
): number => {
    if (values.length === 0) {
        return 0;
    }

    const sorted = [...values].sort(
        (a, b) => a - b,
    );

    const middle = Math.floor(
        sorted.length / 2,
    );

    if (sorted.length % 2 === 0) {
        return Math.round(
            (
                sorted[middle - 1] +
                sorted[middle]
            ) / 2,
        );
    }

    return sorted[middle];
};

/**
 * Convert reply time into feed label.
 */
export const getReplyTimeLabel = (
    minutes: number | null,
): string | null => {
    if (minutes === null) {
        return null;
    }

    if (minutes <= 5) {
        return "5m reply";
    }

    if (minutes <= 15) {
        return "15m reply";
    }

    if (minutes <= 30) {
        return "30m reply";
    }

    if (minutes <= 60) {
        return "1h reply";
    }

    if (minutes <= 180) {
        return "3h reply";
    }

    if (minutes <= 360) {
        return "6h reply";
    }

    if (minutes <= 720) {
        return "12h reply";
    }

    return "1d reply";
};

/**
 * Update user's reply statistics.
 *
 * Called only when:
 *
 * Other User -> User
 * User -> Other User
 *
 * Example:
 *
 * C sends B message at 10:00
 * B replies at 10:05
 *
 * replyMinutes = 5
 */
export const updateUserReplyStats = async (
        userId: string,
        incomingMessageAt: Date,
        replyMessageAt: Date,
    ): Promise<void> => {
        try {
            /**
             * Calculate reply duration.
             */

            console.log("user : ", userId + " reply time : ", replyMessageAt.getTime() - incomingMessageAt.getTime())
            const differenceMs =
                replyMessageAt.getTime() -
                incomingMessageAt.getTime();

            if (differenceMs < 0) {
                return;
            }

            const replyMinutes = Math.max(
                1,
                Math.ceil(
                    differenceMs /
                    (1000 * 60),
                ),
            );

            /**
             * Ignore extremely late replies.
             *
             * Example:
             *
             * C sends Monday
             * B replies Wednesday
             *
             * We don't want that affecting
             * typical reply time.
             */
            if (
                replyMinutes >
                MAX_REPLY_TIME_MINUTES
            ) {
                return;
            }

            /**
             * Get existing stats.
             */
            const existing =
                await prisma.userReplyStats.findUnique({
                    where: {
                        userId,
                    },

                    select: {
                        recentSamples: true,
                    },
                });

            /**
             * Convert Json into number[].
             */
            let samples: number[] = [];

            if (
                existing?.recentSamples &&
                Array.isArray(
                    existing.recentSamples,
                )
            ) {
                samples =
                    existing.recentSamples.filter(
                        (
                            value,
                        ): value is number =>
                            typeof value === "number",
                    );
            }

            /**
             * Add latest reply.
             */
            samples.push(replyMinutes);

            /**
             * Keep only latest 20 samples.
             *
             * If:
             *
             * 21 samples
             *
             * remove oldest one.
             */
            if (
                samples.length >
                MAX_REPLY_SAMPLES
            ) {
                samples = samples.slice(
                    -MAX_REPLY_SAMPLES,
                );
            }

            /**
             * Calculate median from
             * latest samples.
             */
            const median =
                calculateMedian(samples);

            /**
             * Save stats.
             */
            await prisma.userReplyStats.upsert({
                where: {
                    userId,
                },

                create: {
                    userId,

                    medianReplyMinutes:
                        median,

                    sampleCount:
                        samples.length,

                    recentSamples:
                        samples as Prisma.InputJsonValue,

                    calculatedAt:
                        new Date(),
                },

                update: {
                    medianReplyMinutes:
                        median,

                    sampleCount:
                        samples.length,

                    recentSamples:
                        samples as Prisma.InputJsonValue,

                    calculatedAt:
                        new Date(),
                },
            });

            console.log(
                "✅ USER REPLY STATS UPDATED:",
                {
                    userId,
                    replyMinutes,
                    samples,
                    median,
                },
            );
        } catch (error) {
            /**
             * Stats should NEVER break chat.
             */
            console.error(
                "❌ UPDATE USER REPLY STATS ERROR:",
                error,
            );
        }
    };

export const getUserReplyStats = async (
    userId: string,
): Promise<UserReplyStatsResult> => {
    const stats =
        await prisma.userReplyStats.findUnique({
            where: {
                userId,
            },

            select: {
                medianReplyMinutes: true,
                sampleCount: true,
            },
        });

    if (
        !stats ||
        stats.medianReplyMinutes === null ||
        stats.sampleCount <
        MIN_REPLY_SAMPLES
    ) {
        return {
            replyMinutes: null,
            label: null,
            sampleCount:
                stats?.sampleCount ?? 0,
        };
    }

    return {
        replyMinutes:
            stats.medianReplyMinutes,

        label: getReplyTimeLabel(
            stats.medianReplyMinutes,
        ),

        sampleCount:
            stats.sampleCount,
    };
};



