import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

type AdmirerType = "LIKE" | "ROSE";
type AdmirerDirection = "RECEIVED" | "SENT";

interface GetAdmirersParams {
    userId: string;
    type: AdmirerType;
    direction: AdmirerDirection;
    page?: number;
    limit?: number;
}

const calculateAge = (birthDate: Date | null): number | null => {
    if (!birthDate) return null;

    const today = new Date();

    let age =
        today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
        today.getMonth() - birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
};

const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const createdAt = new Date(date);

    const diffMs = now.getTime() - createdAt.getTime();

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
        return "Just now";
    }

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    if (diffDays === 1) {
        return "Yesterday";
    }

    if (diffDays < 7) {
        return `${diffDays} days ago`;
    }

    if (diffWeeks < 4) {
        return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    }

    if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    }

    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
};

export const getAdmirers = async ({
    userId,
    type,
    direction,
    page = 1,
    limit = 20,
}: GetAdmirersParams) => {

    const skip = (page - 1) * limit;

    // ==========================================
    // CURRENT USER LOCATION
    // ==========================================

    const currentUser = await prisma.userProfile.findUnique({
        where: {
            user_id: userId,
        },
        select: {
            latitude: true,
            longitude: true,
        },
    });

    /**
     * Create PostGIS point for current user.
     *
     * ST_MakePoint takes:
     * longitude, latitude
     */
    const me =
        currentUser?.latitude !== null &&
            currentUser?.latitude !== undefined &&
            currentUser?.longitude !== null &&
            currentUser?.longitude !== undefined
            ? Prisma.sql`
                ST_SetSRID(
                    ST_MakePoint(
                        ${Number(currentUser.longitude)},
                        ${Number(currentUser.latitude)}
                    ),
                    4326
                )::geography
            `
            : null;

    // ==========================================
    // RECEIVED COUNTS
    // ==========================================
    const [receivedLikesCount, receivedRosesCount] = await Promise.all([
        prisma.userSwipe.count({
            where: {
                targetUserId: userId,
                action: "LIKE",
                swiper: {
                    deleted_at: null,
                },
            },
        }),

        prisma.userRose.count({
            where: {
                receiverId: userId,
                sender: {
                    deleted_at: null,
                },
            },
        }),
    ]);

    /**
     * ==========================================
     * LIKES
     * ==========================================
     */
    if (type === "LIKE") {

        const where: Prisma.UserSwipeWhereInput = {
            action: "LIKE",

            ...(direction === "RECEIVED"
                ? {
                    targetUserId: userId,
                    swiper: {
                        deleted_at: null,
                    },
                }
                : {
                    swiperId: userId,
                    targetUser: {
                        deleted_at: null,
                    },
                }),
        };

        const [swipes, total] = await Promise.all([
            prisma.userSwipe.findMany({
                where,

                include: {
                    swiper: {
                        select: {
                            id: true,
                            full_name: true,
                            birth_date: true,
                            //   profile: {
                            //     select: {
                            //       // change this according to your UserProfile fields
                            //     },
                            //   },
                            photos: {
                                where: {
                                    is_primary: true,
                                },
                                select: {
                                    id: true,
                                    media_url: true,
                                    media_type: true,
                                },
                                take: 1,
                            },
                        },
                    },

                    targetUser: {
                        select: {
                            id: true,
                            full_name: true,
                            birth_date: true,
                            //   profile: {
                            //     select: {
                            //       // change this according to your UserProfile fields
                            //     },
                            //   },
                            photos: {
                                where: {
                                    is_primary: true,
                                },
                                select: {
                                    id: true,
                                    media_url: true,
                                    media_type: true,
                                },
                                take: 1,
                            },
                        },
                    },
                },

                orderBy: {
                    created_at: "desc",
                },

                skip,
                take: limit,
            }),

            prisma.userSwipe.count({
                where,
            }),
        ]);

        /**
        * ==========================================
        * DISTANCE CALCULATION
        * ==========================================
        *
        * Since the users are already fetched by Prisma,
        * we now get their profile locations in one query
        * and calculate distance using PostGIS.
        */

        const userIds = swipes.map((swipe) =>
            direction === "RECEIVED"
                ? swipe.swiper.id
                : swipe.targetUser.id
        );

        // ==========================================
        // 🚀 FETCH MATCH SCORES FOR ALL CANDIDATES
        // ==========================================
        let compatibilityMap = new Map<string, { score: number; percentage: number }>();

        if (userIds.length > 0) {
            const compatibilityScores = await prisma.userCompatibility.findMany({
                where: {
                    userId: userId,
                    targetUserId: { in: userIds },
                },
                select: {
                    targetUserId: true,
                    score: true,
                    percentage: true,
                },
            });

            compatibilityMap = new Map(
                compatibilityScores.map((c) => [
                    c.targetUserId,
                    { score: c.score, percentage: c.percentage }
                ])
            );
        }

        const matches = await prisma.userMatch.findMany({
            where: {
                is_active: true,
                is_deleted: false,
                OR: [
                    {
                        user1Id: userId,
                        user2Id: {
                            in: userIds,
                        },
                    },
                    {
                        user2Id: userId,
                        user1Id: {
                            in: userIds,
                        },
                    },
                ],
            },
            select: {
                user1Id: true,
                user2Id: true,
            },
        });

        const matchedUserIds = new Set(
            matches.map((match) =>
                match.user1Id === userId
                    ? match.user2Id
                    : match.user1Id
            )
        );

        let distanceMap = new Map<string, number | null>();

        if (me && userIds.length > 0) {

            const distances = await prisma.$queryRaw<
                {
                    user_id: string;
                    distance_km: number | null;
                }[]
            >`
    SELECT
        p.user_id::text AS user_id,
        ROUND(
            (
                ST_Distance(
                    p.location,
                    ${me}
                ) / 1000
            )::numeric,
            2
        )::float8 AS distance_km
    FROM user_profiles p
    WHERE p.user_id IN (
        ${Prisma.join(
                userIds.map((id) => Prisma.sql`${id}::uuid`)
            )}
    )
`;

            distanceMap = new Map(
                distances.map((item) => [
                    item.user_id,
                    item.distance_km,
                ])
            );
        }

        const data = swipes.map((swipe) => {

            const user =
                direction === "RECEIVED"
                    ? swipe.swiper
                    : swipe.targetUser;

            const compatibility = compatibilityMap.get(user.id);

            return {
                interactionId: swipe.id,

                type: "LIKE",

                user: {
                    id: user.id,
                    name: user.full_name,
                    age: calculateAge(user.birth_date),
                    profileImage: user.photos[0]?.media_url ?? null,
                    distanceKm: distanceMap.get(user.id) ?? null,
                    matchScore: compatibility?.percentage ?? 0,
                },

                createdAt: swipe.created_at,
                timeAgo: getTimeAgo(swipe.created_at),
                isMatch: matchedUserIds.has(user.id),
            };
        });

        return {
            receivedLikesCount,
            receivedRosesCount,
            data,
            pagination: {
                page,
                limit,
                total,
                hasNext: page * limit < total,
            },
        };
    }

    /**
     * ==========================================
     * ROSES
     * ==========================================
     */

    const where: Prisma.UserRoseWhereInput =
        direction === "RECEIVED"
            ? {
                receiverId: userId,
                sender: {
                    deleted_at: null,
                },
            }
            : {
                senderId: userId,
                receiver: {
                    deleted_at: null,
                },
            };

    const [roses, total] = await Promise.all([
        prisma.userRose.findMany({
            where,

            include: {
                sender: {
                    select: {
                        id: true,
                        full_name: true,
                        birth_date: true,
                        photos: {
                            where: {
                                is_primary: true,
                            },
                            select: {
                                id: true,
                                media_url: true,
                                media_type: true,
                            },
                            take: 1,
                        },
                    },
                },

                receiver: {
                    select: {
                        id: true,
                        full_name: true,
                        birth_date: true,
                        photos: {
                            where: {
                                is_primary: true,
                            },
                            select: {
                                id: true,
                                media_url: true,
                                media_type: true,
                            },
                            take: 1,
                        },
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },

            skip,
            take: limit,
        }),

        prisma.userRose.count({
            where,
        }),
    ]);

    // ==========================================
    // ROSE DISTANCES
    // ==========================================

    const roseUserIds = roses.map((rose) =>
        direction === "RECEIVED"
            ? rose.sender.id
            : rose.receiver.id
    );

    // 🆕 Fetch match scores for rose users
    let roseCompatibilityMap = new Map<string, { score: number; percentage: number }>();

    if (roseUserIds.length > 0) {
        const compatibilityScores = await prisma.userCompatibility.findMany({
            where: {
                userId: userId,
                targetUserId: { in: roseUserIds },
            },
            select: {
                targetUserId: true,
                score: true,
                percentage: true,
            },
        });

        roseCompatibilityMap = new Map(
            compatibilityScores.map((c) => [
                c.targetUserId,
                { score: c.score, percentage: c.percentage }
            ])
        );
    }

    const matches = await prisma.userMatch.findMany({
        where: {
            is_active: true,
            is_deleted: false,
            OR: [
                {
                    user1Id: userId,
                    user2Id: {
                        in: roseUserIds,
                    },
                },
                {
                    user2Id: userId,
                    user1Id: {
                        in: roseUserIds,
                    },
                },
            ],
        },
        select: {
            user1Id: true,
            user2Id: true,
        },
    });

    const matchedUserIds = new Set(
        matches.map((match) =>
            match.user1Id === userId
                ? match.user2Id
                : match.user1Id
        )
    );

    let roseDistanceMap = new Map<string, number | null>();

    if (me && roseUserIds.length > 0) {

        const distances = await prisma.$queryRaw<
            {
                user_id: string;
                distance_km: number | null;
            }[]
        >`
    SELECT
        p.user_id::text AS user_id,
        ROUND(
            (
                ST_Distance(
                    p.location,
                    ${me}
                ) / 1000
            )::numeric,
            2
        )::float8 AS distance_km
    FROM user_profiles p
    WHERE p.user_id IN (
        ${Prisma.join(
            roseUserIds.map((id) => Prisma.sql`${id}::uuid`)
        )}
    )
`;

        roseDistanceMap = new Map(
            distances.map((item) => [
                item.user_id,
                item.distance_km,
            ])
        );
    }

    const data = roses.map((rose) => {

        const user =
            direction === "RECEIVED"
                ? rose.sender
                : rose.receiver;

        const compatibility = roseCompatibilityMap.get(user.id);

        return {
            interactionId: rose.id,

            type: "ROSE",

            user: {
                id: user.id,
                name: user.full_name,
                age: calculateAge(user.birth_date),
                profileImage: user.photos[0]?.media_url ?? null,
                distanceKm: roseDistanceMap.get(user.id) ?? null,
                isMatch: matchedUserIds.has(user.id),
                matchScore: compatibility?.percentage ?? 0,
            },

            createdAt: rose.createdAt,
            timeAgo: getTimeAgo(rose.createdAt),
        };
    });

    return {
        receivedLikesCount,
        receivedRosesCount,
        data,
        pagination: {
            page,
            limit,
            total,
            hasNext: page * limit < total,
        },
    };
};