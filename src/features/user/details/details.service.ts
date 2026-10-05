import { prisma } from "../../../prisma/prismaClient";

export const getUserDetailsService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },

    // ⚡ Select only required fields (avoid over-fetching)
    select: {
      id: true,
      full_name: true,
      birth_date: true,
      height: true,
      gender: true,
      looking_for: true,
      last_active_at: true,

      profile: {
        select: {
          religion: true,
          community: true,
          city: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
          interested_in: true,
        },
      },

      about: {
        select: {
          maritalStatus: true,
          childStatus: true,
          numberOfChildren: true,
          childLivingArrangement: true,
          livingSituation: true,
        },
      },

      eduWork: {
        select: {
          highestEdu: true,
          degree: true,
          collegeName: true,
          graduationYear: true,

          profession: {
            select: {
              id: true,
              name: true,
            },
          },

          companyName: true,

          employmentType: {
            select: {
              id: true,
              name: true,
            },
          },

          experience: {
            select: {
              id: true,
              title: true,
            },
          },

          ambition: {
            select: {
              id: true,
              title: true,
            },
          },

          salaryRange: {
            select: {
              id: true,
              title: true,
            },
          },

          bigDreams: true,
        },
      },

      bio: {
        select: {
          bio: true,
        },
      },

      photos: {
        select: {
          id: true,
          media_url: true,
          is_primary: true,
        },
        orderBy: {
          is_primary: "desc", // primary photo first
        },
      },

    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 🎯 Optional: derive age from birth_date
  const age = user.birth_date
    ? new Date().getFullYear() - new Date(user.birth_date).getFullYear()
    : null;

  return {
    ...user,
    age,
  };
};

// profileSummary.service.ts

const getAge = (birthDate: Date | null): number | null => {
  if (!birthDate) return null;

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDiff =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() <
      birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

/**
 * Reverse geocode latitude / longitude.
 *
 * IMPORTANT:
 * For production, replace this with your existing
 * Google Maps / Google Places / Geocoding helper.
 */
const getLocationFromLatLng = async (
  latitude: number | null,
  longitude: number | null,
): Promise<{
  city: string | null;
  state: string | null;
  country: string | null;
  displayLocation: string | null;
}> => {
  if (
    latitude === null ||
    longitude === null
  ) {
    return {
      city: null,
      state: null,
      country: null,
      displayLocation: null,
    };
  }

  /**
   * Call your reverse-geocoding provider here.
   *
   * Example final result:
   *
   * {
   *   city: "Mumbai",
   *   state: "Maharashtra",
   *   country: "India",
   *   displayLocation: "Mumbai, India"
   * }
   */

  return {
    city: null,
    state: null,
    country: null,
    displayLocation: null,
  };
};

export const getProfileSummaryService = async (
  userId: string,
) => {
  const now = new Date();

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        full_name: true,
        birth_date: true,
        trust_score: true,
        profile_completion: true,

        profile: {
          select: {
            latitude: true,
            longitude: true,
            city: true,
            state: true,
            country: true,
          },
        },

        photos: {
          where: {
            is_primary: true,
          },

          select: {
            id: true,
            media_url: true,
            media_type: true,
            is_primary: true,
          },

          take: 1,
        },

        userPackages: {
          where: {
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

          orderBy: {
            startDate: "desc",
          },

          take: 1,

          select: {
            id: true,
            startDate: true,
            endDate: true,

            currentPackage: {
              select: {
                id: true,
                name: true,
              },
            },

            package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const age = getAge(user.birth_date);

  /**
   * Convert Prisma Decimal to number
   */
  const latitude =
    user.profile?.latitude !== null &&
      user.profile?.latitude !== undefined
      ? Number(user.profile.latitude)
      : null;

  const longitude =
    user.profile?.longitude !== null &&
      user.profile?.longitude !== undefined
      ? Number(user.profile.longitude)
      : null;

  /**
   * First try lat/lng reverse geocoding.
   */
  const reverseLocation =
    await getLocationFromLatLng(
      latitude,
      longitude,
    );

  /**
   * If reverse geocoding is unavailable/fails,
   * use the stored profile location.
   */
  const city =
    reverseLocation.city ??
    user.profile?.city ??
    null;

  const state =
    reverseLocation.state ??
    user.profile?.state ??
    null;

  const country =
    reverseLocation.country ??
    user.profile?.country ??
    null;

  const displayLocation =
    reverseLocation.displayLocation ??
    ([city, country]
      .filter(Boolean)
      .join(", ") || null);

  /**
   * Active membership
   */
  const activeMembership =
    user.userPackages[0] ?? null;

  const membershipPackage =
    activeMembership?.currentPackage ??
    activeMembership?.package ??
    null;

  const membership = membershipPackage
    ? {
      id: membershipPackage.id,
      name: membershipPackage.name,
    }
    : null;

  return {
    id: user.id,

    photo:
      user.photos[0]?.media_url ?? null,

    fullName:
      user.full_name ?? null,

    age,

    displayName: user.full_name
      ? `${user.full_name}${age !== null ? `, ${age}` : ""
      }`
      : null,

    location: {
      latitude,
      longitude,
      display: displayLocation,
    },

    membership,

    trustScore: user.trust_score,

    profileCompletion:
      user.profile_completion,
  };
};