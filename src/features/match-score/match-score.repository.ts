import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { calculateAge, getGenderFromInterest, getOrientationCompatibility } from "../user/feed/feed.service";

const ALL_INTEREST_VALUES = ["MEN", "WOMEN", "NON_BINARY", "PREFER_NOT_TO_SAY", "EVERYONE"];
const ALL_ORIENTATIONS = [
    "STRAIGHT", "GAY", "LESBIAN", "BISEXUAL", "PANSEXUAL",
    "DEMISEXUAL", "QUEER", "ASEXUAL", "AROMATIC", "NOT_LISTED",
];

const NEW_USER_BOOST_HOURS = 48;
const DEFAULT_PAGE_LIMIT = 20;
const OVERFETCH = 1.5;
const MAX_ROUNDS = 5;
const STATIC_MATCH_SCORE = 78;
const STATIC_TRUST = 75;
const STATIC_REPLY_TIME = "5 m reply";

// VERIFY which column stores orientation. Unified on profile.sexual_orientation.
const ORIENTATION_TABLE = "p"; // "p" = user_profiles, "u" = users
const ORIENTATION_COL = "sexual_orientation";

export const matchScoreRepository = {
    // --------------------------------
    // Get complete data needed by your
    // calculateMatchScore() function
    // --------------------------------

    async getUserForMatchScore(userId: string) {
        return prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                // Correct model names based on your schema
                eduWork: {
                    include: {
                        profession: true,
                        employmentType: true,
                        experience: true,
                        ambition: true,
                        salaryRange: true,
                    },
                },
                familyProfile: {
                    include: {
                        familyStatus: true,
                        familyType: true,
                        fatherOccupation: true,
                        fatherOrganisation: true,
                        motherOccupation: true,
                        motherOrganisation: true,
                        familyHome: true,
                        nativePlace: true,
                        familyIncome: true,
                        siblings: {
                            include: {
                                siblingType: true,
                                marital: true,
                                occupation: true,
                            },
                        },
                    },
                },
                profile: {
                    include: {
                        religion: true,
                        community: true,
                        languages: {
                            include: {
                                language: true,
                            },
                        },
                    },
                },
                answer: {
                    include: {
                        question: true,
                        option: true,
                    },
                },
                photos: true,
                // Additional useful includes for match scoring
                bio: true,
                about: true,
                skills: {
                    include: {
                        skill: true,
                    },
                },
                userPrompts: {
                    include: {
                        prompt: true,
                    },
                },
                intention: true,
            },
        });
    },

    // --------------------------------
    // Find eligible candidates
    // --------------------------------

    async getCandidates(userId: string) {
        // -------------------------
        // 1. FETCH CURRENT USER FOR FILTERING
        // -------------------------
        console.log("userid : ", userId)
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                gender: true,
                profile: {
                    select: {
                        interested_in: true,
                        sexual_orientation: true,
                        latitude: true,
                        longitude: true,
                        max_distance_km: true,
                        city: true,
                        state: true,
                        country: true,
                    },
                },
            },
        });

        console.log("currentUser : ", currentUser)


        if (!currentUser || !currentUser.profile) {
            throw new Error("User profile not found");
        }

        const { interested_in, sexual_orientation, latitude, longitude, max_distance_km } = currentUser.profile;
        const { gender } = currentUser;

        if (!gender || !interested_in) {
            throw new Error("Required fields missing");
        }

        const myGender = gender.toUpperCase();
        const myInterest = interested_in.toUpperCase();
        const myOrientation = (sexual_orientation ?? "").toUpperCase();

        const myLatitude = Number(latitude);
        const myLongitude = Number(longitude);
        const maxDistance = max_distance_km ?? 50;

        // -------------------------
        // 2. PRECOMPUTE MATCH FILTERS (same as feed service)
        // -------------------------
        const genderFilter = getGenderFromInterest(myInterest);
        const interestedInFilter = ALL_INTEREST_VALUES.filter((v) =>
            getGenderFromInterest(v).includes(myGender),
        );

        const orientationForward = getOrientationCompatibility(myOrientation);
        const orientationReverse = ALL_ORIENTATIONS.filter((o) =>
            getOrientationCompatibility(o).includes(myOrientation),
        );

        if (orientationForward.length === 0 || orientationReverse.length === 0) {
            return { users: [], totalCount: 0 };
        }

        // -------------------------
        // 3. BUILD FILTERS FOR CANDIDATES
        // -------------------------
        const orientCol = Prisma.raw(`${ORIENTATION_TABLE}.${ORIENTATION_COL}`);
        const me = Prisma.sql`ST_SetSRID(ST_MakePoint(${myLongitude}, ${myLatitude}), 4326)::geography`;

        // -------------------------
        // 4. GET CANDIDATES WITH FILTERS (minimal data)
        // -------------------------
        const distanceLimit = maxDistance;

        // Use raw SQL for efficient filtering with distance
        const candidates = await prisma.$queryRaw<Array<{ id: string; distance: number; created_at: Date; last_active_at: Date | null }>>`
    SELECT 
      u.id,
      (p.location::geography <-> ${me})::float8 AS distance,
      u.created_at,
      u.last_active_at,
      u.gender,
      u.birth_date,
      p.interested_in,
      p.sexual_orientation
    FROM users u
    JOIN user_profiles p ON p.user_id = u.id
    WHERE 
      u.deleted_at IS NULL
      AND u.id <> ${userId}::uuid
      AND NOT EXISTS (
        SELECT 1 FROM swipes s
        WHERE s."swiperId" = ${userId}::uuid 
        AND s."targetUserId" = u.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM "UserBlock" b
        WHERE (b."blockerId"::uuid = ${userId}::uuid AND b."blockedId"::uuid = u.id)
          OR (b."blockedId"::uuid = ${userId}::uuid AND b."blockerId"::uuid = u.id)
      )
      AND u.gender::text = ANY(ARRAY[${Prisma.join(genderFilter)}]::text[])
      AND p.interested_in::text = ANY(ARRAY[${Prisma.join(interestedInFilter)}]::text[])
      AND ${orientCol}::text = ANY(ARRAY[${Prisma.join(orientationForward)}]::text[])
      AND ${orientCol}::text = ANY(ARRAY[${Prisma.join(orientationReverse)}]::text[])
      AND ST_DWithin(p.location::geography, ${me}, ${distanceLimit * 1000})
    ORDER BY p.location::geography <-> ${me} ASC
    LIMIT 500;
  `;

        // -------------------------
        // 5. GET ADDITIONAL DATA FOR MATCH SCORING
        // -------------------------
        if (candidates.length === 0) {
            return { users: [], totalCount: 0 };
        }

        const candidateIds = candidates.map(c => c.id);

        console.log("candidateIds : ", candidateIds)


        // Fetch additional data needed for match scoring in bulk
        const additionalData = await prisma.user.findMany({
            where: {
                id: { in: candidateIds },
            },
            select: {
                id: true,
                full_name: true,
                birth_date: true,
                height: true,
                gender: true,
                is_phone_verified: true,
                profile_completion: true,
                last_active_at: true,
                created_at: true,

                profile: {
                    select: {
                        religionId: true,
                        communityId: true,
                        interested_in: true,
                        sexual_orientation: true,
                        city: true,
                        state: true,
                        country: true,
                        max_distance_km: true,
                    },
                },

                eduWork: {
                    select: {
                        highestEdu: true,
                        professionId: true,
                        profession: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        companyName: true,
                        ambitionId: true,
                        ambition: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },

                about: {
                    select: {
                        maritalStatus: true,
                        childStatus: true,
                        zodiac: true,
                        loveLanguage: true,
                    },
                },

                photos: {
                    select: {
                        id: true,
                        media_url: true,
                        is_primary: true,
                        order: true,
                    },
                    orderBy: {
                        order: 'asc',
                    },
                    take: 1,
                },

                bio: {
                    select: {
                        bio: true,
                    },
                },

                answer: {
                    select: {
                        question_id: true,
                        option_id: true,
                    },
                    take: 10,
                },

                userPrompts: {
                    select: {
                        promptId: true,
                        answer: true,
                    },
                    take: 3,
                },

                skills: {
                    select: {
                        skillId: true,
                        skill: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    take: 5,
                },

                familyProfile: {
                    select: {
                        familyStatusId: true,
                        familyTypeId: true,
                        familyIncomeId: true,
                    },
                },

                intention: {
                    select: {
                        id: true,
                        option: true,        // Use 'option' instead of 'title'
                        optDescription: true, // Optional: include description if needed
                    },
                },
            },
        });

        console.log("addtional data : ", additionalData)

        // -------------------------
        // 6. COMBINE DISTANCE AND ADDITIONAL DATA
        // -------------------------
        const distanceMap = new Map(candidates.map(c => [c.id, c.distance]));
        const enrichedCandidates = additionalData.map(user => ({
            ...user,
            distanceKm: distanceMap.get(user.id) || 0,
            // Calculate derived fields
            age: calculateAge(user.birth_date),
            hasPhotos: user.photos.length > 0,
            hasBio: !!user.bio,
            hasEduWork: !!user.eduWork,
            hasAbout: !!user.about,
            isVerified: user.is_phone_verified || false,
        }));

        console.log("enriched candidates : ", enrichedCandidates)

        return {
            users: enrichedCandidates,
            totalCount: candidates.length,
        };
    },

    // --------------------------------
    // Save / update score
    // --------------------------------

    async upsertScore(
        userId: string,
        targetUserId: string,
        score: number,
        percentage: number,
    ) {

        console.log("before user compability")
        return prisma.userCompatibility.upsert({
            where: {
                userId_targetUserId: {
                    userId,
                    targetUserId,
                },
            },

            update: {
                score,
                percentage,
            },

            create: {
                userId,
                targetUserId,
                score,
                percentage,
            },
        });

        console.log("after user compability")
    },

    // --------------------------------
    // Get one stored score
    // --------------------------------

    async getScore(
        userId: string,
        targetUserId: string,
    ) {
        console.log("before user score")

        return prisma.userCompatibility.findUnique({
            where: {
                userId_targetUserId: {
                    userId,
                    targetUserId,
                },
            },

            select: {
                score: true,
                percentage: true,
            },
        });

        console.log("before user score")

    },
};