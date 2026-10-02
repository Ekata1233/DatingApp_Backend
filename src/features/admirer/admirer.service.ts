
import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

type AdmirerDirection = "RECEIVED" | "SENT";

interface GetAdmirersParams {
    userId: string;
    direction: AdmirerDirection;
    page?: number;
    limit?: number;
}

// ==========================================
// CALCULATE AGE
// ==========================================

const calculateAge = (
    birthDate: Date | null
): number | null => {
    if (!birthDate) {
        return null;
    }

    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() <
            birthDate.getDate()
        )
    ) {
        age--;
    }

    return age;
};

// ==========================================
// GET TIME AGO
// ==========================================

const getTimeAgo = (
    date: Date
): string => {
    const now = new Date();

    const createdAt =
        new Date(date);

    const diffMs =
        now.getTime() -
        createdAt.getTime();

    const diffSeconds =
        Math.floor(
            diffMs / 1000
        );

    const diffMinutes =
        Math.floor(
            diffSeconds / 60
        );

    const diffHours =
        Math.floor(
            diffMinutes / 60
        );

    const diffDays =
        Math.floor(
            diffHours / 24
        );

    const diffWeeks =
        Math.floor(
            diffDays / 7
        );

    const diffMonths =
        Math.floor(
            diffDays / 30
        );

    const diffYears =
        Math.floor(
            diffDays / 365
        );

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
        return `${diffWeeks} week${diffWeeks > 1
            ? "s"
            : ""
            } ago`;
    }

    if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths > 1
            ? "s"
            : ""
            } ago`;
    }

    return `${diffYears} year${diffYears > 1
        ? "s"
        : ""
        } ago`;
};

// ==========================================
// GET ADMIRERS / LIKES
// ==========================================

export const getAdmirers = async ({
    userId,
    direction,
    page = 1,
    limit = 20,
}: GetAdmirersParams) => {

    const skip =
        (page - 1) * limit;

    // ==========================================
    // CHECK ACTIVE PACKAGE
    // ==========================================

    const now =
        new Date();

    const activePackage =
        await prisma.userPackage.findFirst({
            where: {
                user_id: userId,

                status: "ACTIVE",

                startDate: {
                    lte: now,
                },

                OR: [
                    {
                        endDate: null,
                    },
                    {
                        endDate: {
                            gte: now,
                        },
                    },
                ],
            },

            select: {
                id: true,
                packageId: true,
                startDate: true,
                endDate: true,
                status: true,
            },

            orderBy: {
                endDate: "desc",
            },
        });

    const hasActivePackage =
        !!activePackage;

    // ==========================================
    // CURRENT USER LOCATION
    // ==========================================

    const currentUser =
        await prisma.userProfile.findUnique({
            where: {
                user_id: userId,
            },

            select: {
                latitude: true,
                longitude: true,
            },
        });

    // ==========================================
    // CREATE CURRENT USER POSTGIS POINT
    // ==========================================

    const me =
        currentUser?.latitude !== null &&
            currentUser?.latitude !== undefined &&
            currentUser?.longitude !== null &&
            currentUser?.longitude !== undefined

            ? Prisma.sql`
                ST_SetSRID(
                    ST_MakePoint(
                        ${Number(
                currentUser.longitude
            )},
                        ${Number(
                currentUser.latitude
            )}
                    ),
                    4326
                )::geography
            `

            : null;

    // ==========================================
    // RECEIVED LIKES COUNT
    // ==========================================

    const receivedLikesCount =
        await prisma.userSwipe.count({
            where: {
                targetUserId: userId,

                action: "LIKE",
                isMutual: false,
                swiper: {
                    deleted_at: null,
                },
            },
        });

    // ==========================================
    // WHERE CONDITION
    // ==========================================

    const where:
        Prisma.UserSwipeWhereInput = {

        action: "LIKE",
        isMutual: false,
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

    // ==========================================
    // LOCK RECEIVED LIKES WITHOUT PACKAGE
    // ==========================================

    if (
        direction === "RECEIVED" &&
        !hasActivePackage
    ) {
        const total =
            await prisma.userSwipe.count({
                where,
            });

        return {
            receivedLikesCount,

            isPackageActive: false,

            isLocked: true,

            data: [],

            pagination: {
                page,
                limit,
                total,

                hasNext:
                    page * limit <
                    total,
            },
        };
    }

    // ==========================================
    // FETCH LIKES
    // ==========================================

    const [
        swipes,
        total,
    ] = await Promise.all([

        prisma.userSwipe.findMany({
            where,

            include: {
                swiper: {
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

                targetUser: {
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
                created_at: "desc",
            },

            skip,

            take: limit,
        }),

        prisma.userSwipe.count({
            where,
        }),
    ]);

    // ==========================================
    // GET OTHER USER IDS
    // ==========================================

    const userIds =
        swipes.map((swipe) =>
            direction === "RECEIVED"
                ? swipe.swiper.id
                : swipe.targetUser.id
        );

    // ==========================================
    // FETCH COMPATIBILITY SCORES
    // ==========================================

    let compatibilityMap =
        new Map<
            string,
            {
                score: number;
                percentage: number;
            }
        >();

    if (userIds.length > 0) {
        const compatibilityScores =
            await prisma.userCompatibility.findMany({
                where: {
                    userId,

                    targetUserId: {
                        in: userIds,
                    },
                },

                select: {
                    targetUserId: true,
                    score: true,
                    percentage: true,
                },
            });

        compatibilityMap =
            new Map(
                compatibilityScores.map(
                    (compatibility) => [
                        compatibility.targetUserId,
                        {
                            score:
                                compatibility.score,

                            percentage:
                                compatibility.percentage,
                        },
                    ]
                )
            );
    }

    // ==========================================
    // FETCH MATCHES
    // ==========================================

    const matches =
        userIds.length > 0
            ? await prisma.userMatch.findMany({
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
                    matched_at: true,
                },
            })
            : [];

    // ==========================================
    // CREATE MATCH MAP
    // ==========================================

    const matchMap =
        new Map<
            string,
            {
                isMatch: boolean;
                matchedAt: Date | null;
            }
        >();

    matches.forEach((match) => {

        const matchedUserId =
            match.user1Id === userId
                ? match.user2Id
                : match.user1Id;

        matchMap.set(
            matchedUserId,
            {
                isMatch: true,
                matchedAt:
                    match.matched_at,
            }
        );
    });

    // ==========================================
    // DISTANCE MAP
    // ==========================================

    let distanceMap =
        new Map<
            string,
            number | null
        >();

    if (
        me &&
        userIds.length > 0
    ) {
        const distances =
            await prisma.$queryRaw<
                {
                    user_id: string;
                    distance_km:
                    number | null;
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
                userIds.map(
                    (id) =>
                        Prisma.sql`${id}::uuid`
                )
            )}
                )
            `;

        distanceMap =
            new Map(
                distances.map(
                    (item) => [
                        item.user_id,
                        item.distance_km,
                    ]
                )
            );
    }

    // ==========================================
    // FORMAT DATA
    // ==========================================

    const data =
        swipes.map((swipe) => {

            const user =
                direction === "RECEIVED"
                    ? swipe.swiper
                    : swipe.targetUser;

            const compatibility =
                compatibilityMap.get(
                    user.id
                );

            const match =
                matchMap.get(
                    user.id
                );

            const isMatch =
                match?.isMatch ??
                false;

            const matchedAt =
                match?.matchedAt ??
                null;

            return {
                interactionId:
                    swipe.id,

                type: "LIKE",

                user: {
                    id:
                        user.id,

                    name:
                        user.full_name,

                    age:
                        calculateAge(
                            user.birth_date
                        ),

                    profileImage:
                        user.photos[0]
                            ?.media_url ??
                        null,

                    distanceKm:
                        distanceMap.get(
                            user.id
                        ) ??
                        null,

                    matchScore:
                        compatibility
                            ?.percentage ??
                        0,
                },

                // ==========================================
                // LIKE INFO
                // ==========================================

                createdAt:
                    swipe.created_at,

                timeAgo:
                    getTimeAgo(
                        swipe.created_at
                    ),

                // ==========================================
                // MATCH INFO
                // ==========================================

                isMatch,

                matchedAt,

                // ==========================================
                // SENT / SEEN / MATCHED STATUS
                // ==========================================

                likeStatus: {
                    sent: true,

                    // STATIC FOR NOW
                    // No database field required
                    seen: true,

                    // Dynamic from UserMatch
                    matched:
                        isMatch,
                },
            };
        });

    // ==========================================
    // FINAL RESPONSE
    // ==========================================

    return {
        receivedLikesCount,

        isPackageActive:
            hasActivePackage,

        isLocked: false,

        data,

        pagination: {
            page,
            limit,
            total,

            hasNext:
                page * limit <
                total,
        },
    };
};




/**
 * ============================================
 * CALCULATE AGE
 * ============================================
 */


/**
 * ============================================
 * FORMAT HEIGHT
 * ============================================
 *
 * DB:
 * 180 cm
 *
 * Response:
 * 5'11"
 */
const formatHeight = (
  heightCm: number | null,
): string | null => {
  if (
    heightCm === null ||
    heightCm === undefined
  ) {
    return null;
  }

  const totalInches =
    heightCm / 2.54;

  let feet =
    Math.floor(totalInches / 12);

  let inches =
    Math.round(
      totalInches - feet * 12,
    );

  if (inches === 12) {
    feet++;
    inches = 0;
  }

  return `${feet}'${inches}"`;
};

/**
 * ============================================
 * FORMAT DISTANCE
 * ============================================
 *
 * Example:
 * 8.2 -> "8 km"
 * 0.7 -> "< 1 km"
 */
const formatDistance = (
  distanceKm: number | null,
): string | null => {
  if (distanceKm === null) {
    return null;
  }

  if (distanceKm < 1) {
    return "< 1 km";
  }

  return `${Math.round(distanceKm)} km`;
};

/**
 * ============================================
 * ADMIRER DETAILS SERVICE
 * ============================================
 */
export const getAdmirerDetailsService =
  async (
    userId: string,
    admirerId: string,
  ) => {
    /**
     * userId
     * = logged-in user
     *
     * admirerId
     * = person who liked / complimented
     *   logged-in user
     */

    if (!userId) {
      throw new Error(
        "User id is required",
      );
    }

    if (!admirerId) {
      throw new Error(
        "Admirer id is required",
      );
    }

    if (userId === admirerId) {
      throw new Error(
        "Invalid admirer",
      );
    }

    // ==========================================
    // 1. CURRENT USER
    // ==========================================

    const currentUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,

          profile: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      });

    if (!currentUser) {
      throw new Error(
        "Current user not found",
      );
    }

    // ==========================================
    // 2. ADMIRER
    // ==========================================

    const admirer =
      await prisma.user.findFirst({
        where: {
          id: admirerId,

          account_status: "ACTIVE",

          deleted_at: null,
        },

        select: {
          // ====================================
          // USER
          // ====================================

          id: true,

          full_name: true,

          birth_date: true,

          height: true,

          trust_score: true,

          looking_for: true,

          // ====================================
          // PROFILE
          // ====================================

          profile: {
            select: {
              country: true,

              state: true,

              city: true,

              area: true,

              max_distance_km: true,

              latitude: true,

              longitude: true,
            },
          },

          // ====================================
          // EDUCATION + WORK
          // ====================================

          eduWork: {
            select: {
              collegeName: true,

              highestEdu: true,

              professionId: true,

              profession: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          // ====================================
          // FIRST / PRIMARY PHOTO
          // ====================================

          photos: {
            select: {
              id: true,

              media_url: true,

              media_type: true,

              is_primary: true,

              order: true,
            },

            orderBy: [
              {
                is_primary: "desc",
              },

              {
                order: "asc",
              },

              {
                created_at: "asc",
              },
            ],

            take: 1,
          },

          // ====================================
          // USER ANSWERS
          //
          // LIFESTYLE = THE BASICS
          // THINGS_U_LOVE = INTERESTS
          // ====================================

          answer: {
            where: {
              question: {
                screen: {
                  in: [
                    "LIFESTYLE",
                    "THINGS_U_LOVE",
                  ],
                },
              },
            },

            select: {
              id: true,

              question_id: true,

              option_id: true,

              description: true,

              question: {
                select: {
                  id: true,
                  screen: true,
                },
              },

              option: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

    if (!admirer) {
      throw new Error(
        "Admirer not found",
      );
    }

    // ==========================================
    // 3. WHY THEY LIKED YOU
    // ==========================================
    //
    // admirer = sender
    // logged-in user = receiver
    //
    // Example:
    //
    // Marcus -> compliment -> Me
    //
    // senderId   = Marcus
    // receiverId = Me
    // ==========================================

    const compliment =
      await prisma.userCompliment.findFirst({
        where: {
          senderId: admirerId,

          receiverId: userId,

          /**
           * Don't force PENDING here.
           *
           * If compliment status changes later
           * to accepted/sent/etc., we should
           * still be able to show the message.
           */
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,

          message: true,

          targetType: true,

          targetId: true,

          status: true,

          createdAt: true,

          ideaId: true,

          idea: true,
        },
      });

    // ==========================================
    // 4. CALCULATE DISTANCE
    // ==========================================

    let distanceKm:
      number | null = null;

    const myLatitude =
      currentUser.profile?.latitude;

    const myLongitude =
      currentUser.profile?.longitude;

    const admirerLatitude =
      admirer.profile?.latitude;

    const admirerLongitude =
      admirer.profile?.longitude;

    const hasMyCoordinates =
      myLatitude !== null &&
      myLatitude !== undefined &&
      myLongitude !== null &&
      myLongitude !== undefined;

    const hasAdmirerCoordinates =
      admirerLatitude !== null &&
      admirerLatitude !== undefined &&
      admirerLongitude !== null &&
      admirerLongitude !== undefined;

    if (
      hasMyCoordinates &&
      hasAdmirerCoordinates
    ) {
      const myLat =
        Number(myLatitude);

      const myLng =
        Number(myLongitude);

      const admirerLat =
        Number(admirerLatitude);

      const admirerLng =
        Number(admirerLongitude);

      const validCoordinates =
        Number.isFinite(myLat) &&
        Number.isFinite(myLng) &&
        Number.isFinite(admirerLat) &&
        Number.isFinite(admirerLng);

      if (validCoordinates) {
        const distanceResult =
          await prisma.$queryRaw<
            {
              distance_meters:
                number | null;
            }[]
          >(
            Prisma.sql`
              SELECT
                ST_Distance(
                  ST_SetSRID(
                    ST_MakePoint(
                      ${myLng},
                      ${myLat}
                    ),
                    4326
                  )::geography,

                  ST_SetSRID(
                    ST_MakePoint(
                      ${admirerLng},
                      ${admirerLat}
                    ),
                    4326
                  )::geography
                )::float8
                AS distance_meters
            `,
          );

        const meters =
          distanceResult[0]
            ?.distance_meters;

        if (
          meters !== null &&
          meters !== undefined &&
          Number.isFinite(
            Number(meters),
          )
        ) {
          distanceKm =
            Math.round(
              (Number(meters) /
                1000) *
                100,
            ) / 100;
        }
      }
    }

    // ==========================================
    // 5. SEPARATE LIFESTYLE
    // ==========================================

    const lifestyleAnswers =
      admirer.answer
        .filter(
          (answer) =>
            answer.question.screen ===
            "LIFESTYLE",
        )
        .map((answer) => ({
          id: answer.id,

          questionId:
            answer.question_id,

          optionId:
            answer.option_id,

          description:
            answer.description,
        }));

    // ==========================================
    // 6. SEPARATE INTERESTS
    // ==========================================

    const interests =
      admirer.answer
        .filter(
          (answer) =>
            answer.question.screen ===
            "THINGS_U_LOVE",
        )
        .map((answer) => ({
          id: answer.id,

          questionId:
            answer.question_id,

          optionId:
            answer.option_id,

          description:
            answer.description,
        }));

    // ==========================================
    // 7. PHOTO
    // ==========================================

    const firstPhoto =
      admirer.photos[0] ?? null;

    // ==========================================
    // 8. WHY THEY LIKED YOU
    // ==========================================

    const whyTheyLikedYou =
      compliment?.message ?? null;

    // ==========================================
    // 9. FINAL RESPONSE
    // ==========================================

    return {
  // ========================================
  // 1. USER NAME + AGE
  // ========================================

  full_name:
    admirer.full_name,

  birth_date:
    admirer.birth_date,

  age:
    calculateAge(
      admirer.birth_date,
    ),

  // ========================================
  // 2. PHOTO
  // ========================================

  photo: firstPhoto
    ? {
        id:
          firstPhoto.id,

        media_url:
          firstPhoto.media_url,

        media_type:
          firstPhoto.media_type,

        is_primary:
          firstPhoto.is_primary,

        order:
          firstPhoto.order,
      }
    : null,

  // ========================================
  // 3. PROFESSION
  // ========================================

  profession:
    admirer.eduWork
      ?.profession ?? null,

  // ========================================
  // 4. TRUST
  // ========================================

  trust_score:
    admirer.trust_score ?? 0,

  // ========================================
  // 5. MATCH - STATIC
  // ========================================

  matchScore: 75,

  // ========================================
  // 6. DISTANCE
  // ========================================

  distanceKm,

  distanceLabel:
    formatDistance(
      distanceKm,
    ),

  // ========================================
  // 7. WHY THEY LIKED YOU
  // UserCompliment.message
  // ========================================

  whyTheyLikedYou:
    compliment?.message ??
    null,

  // ========================================
  // 8. BASICS
  // ========================================

  basics: {
    lookingFor:
      admirer.looking_for ??
      null,

    height:
      admirer.height,

    heightFormatted:
      formatHeight(
        admirer.height,
      ),

    collegeName:
      admirer.eduWork
        ?.collegeName ?? null,

    highestEdu:
      admirer.eduWork
        ?.highestEdu ?? null,

    lifestyle:
      lifestyleAnswers,
  },

  // ========================================
  // 9. INTERESTS
  // ========================================

  interests,
};
  };