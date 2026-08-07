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
              name: true,
            },
          },

          ambition: {
            select: {
              id: true,
              name: true,
            },
          },

          salaryRange: {
            select: {
              id: true,
              name: true,
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