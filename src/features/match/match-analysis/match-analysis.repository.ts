import { prisma } from "../../../prisma/prismaClient";

export const getUserForMatchAnalysis = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      full_name: true,
      birth_date: true,
      height: true,
      gender: true,
      looking_for: true,
      looking_for_option: true,
      intentionId: true,

      intention: {
        select: {
          id: true,
          option: true,
          optDescription: true,

          intention: {
            select: {
              id: true,
              title: true,
              description: true,
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

      about: true,

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

      answer: {
        include: {
          question: true,
          option: true,
        },
      },

      photos: {
        where: {
          media_type: "IMAGE",
        },
        orderBy: [
          {
            is_primary: "desc",
          },
          {
            order: "asc",
          },
        ],
      },

      bio: true,

      userPrompts: {
        include: {
          prompt: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });
};