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
          childStatus : true,
          numberOfChildren : true,
          childLivingArrangement : true,
          livingSituation : true,
        },
      },

      eduWork: {
        select: {
          highestEdu: true,
          collegeName: true,
          incomeRange: true,
          workingWith: true,
          workingAs: true,
          companyName: true,
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
          image_url: true,
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