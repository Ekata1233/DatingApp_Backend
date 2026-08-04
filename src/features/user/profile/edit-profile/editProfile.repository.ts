import { prisma } from "../../../../prisma/prismaClient";

export const findUserById = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId }
  });
};

export const updateUserData = async (
  userId: string,
  data: any
) => {
  return prisma.user.update({
    where: { id: userId },
    data
  });
};

export const upsertUserProfile = async (
  userId: string,
  data: any
) => {
  return prisma.userProfile.upsert({
    where: {
      user_id: userId
    },
    update: data,
    create: {
      user_id: userId,
      ...data
    }
  });
};

// export const findQuestionByKey = async (
//   key: string
// ) => {
//   return prisma.question.findUnique({
//     where: { key },
//     include: {
//       options: true
//     }
//   });
// };

export const deleteExistingAnswers = async (
  userId: string,
  questionId: string
) => {
  return prisma.userAnswer.deleteMany({
    where: {
      user_id: userId,
      question_id: questionId
    }
  });
};

export const createUserAnswers = async (
  answers: any[]
) => {
  return prisma.userAnswer.createMany({
    data: answers
  });
};


//aboutme 
export const upsertUserBio = async (
  userId: string,
  bio: string
) => {
  return prisma.userBio.upsert({
    where: {
      user_id: userId
    },
    update: {
      bio
    },
    create: {
      user_id: userId,
      bio
    }
  });
};

//--------------------------------USER EDUCATION AND WORK UPDATE-------------------------------
export const updateUserEduWork = async (
  userId: string,
  data: any
) => {
  return prisma.userEduWork.upsert({
    where: {
      userId,
    },
    update: {
      ...data,
    },
    create: {
      userId,
      ...data,
    },
  });
};

export const deleteUserSkills = async (
  userId: string
) => {
  return prisma.userSkill.deleteMany({
    where: {
      userId,
    },
  });
};

export const createUserSkill = async (data: {
  userId: string;
  skillId: string;
}) => {
  return prisma.userSkill.create({
    data,
  });
};

export const getUserEduWorkByUserId = async (
  userId: string
) => {
  return prisma.userEduWork.findUnique({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
    },
  });
};

export const findQuestionByKey =
  async (key: string) => {

    return prisma.question.findUnique({
      where: {
        key
      },
      include: {
        options: true
      }
    });

  };
export const validateQuestionOptions =
  async (
    questionId: string,
    optionIds: string[]
  ) => {

    return prisma.questionOption.findMany({
      where: {
        question_id: questionId,
        id: {
          in: optionIds
        }
      }
    });

  };

export const replaceUserAnswers =
  async (
    userId: string,
    questionId: string,
    optionIds: string[]
  ) => {

    return prisma.$transaction(
      async (tx) => {

        //-----------------------------------
        // DELETE OLD ANSWERS
        //-----------------------------------

        await tx.userAnswer.deleteMany({
          where: {
            user_id: userId,
            question_id: questionId
          }
        });

        //-----------------------------------
        // INSERT NEW ANSWERS
        //-----------------------------------

        if (optionIds.length > 0) {

          await tx.userAnswer.createMany({
            data: optionIds.map(
              (optionId) => ({
                user_id: userId,
                question_id: questionId,
                option_id: optionId
              })
            )
          });

        }

        return true;

      }
    );

  };

export async function getEditProfileRepository(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone_number: true,
      birth_date: true,
      height: true,
      gender: true,
      gender_option: true,
      looking_for: true,
      looking_for_option: true,
      profile_completion: true,
      intention: {
        select: {
          id: true,
          title: true,
          description: true,
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
          media_type: true,
          order: true,
          is_primary: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      profile: {
        select: {
          interested_in: true,
          sexual_orientation: true,
          country: true,
          state: true,
          city: true,
          area: true,
          latitude: true,
          longitude: true,
          max_distance_km: true,
          religion: {
            select: {
              id: true,
              name: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
            },
          },
          languages: {
            select: {
              language: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      about: {
        select: {
          zodiac: true,
          loveLanguage: true,
          communicationStyle: true
        }
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
          companyName: true,
          bigDreams: true,
        },
      },
      familyProfile: {
        select: {
          familyStatus: {
            select: {
              id: true,
              value: true,
            },
          },
          familyType: {
            select: {
              id: true,
              value: true,
            },
          },
          fatherOccupation: {
            select: {
              id: true,
              value: true,
            },
          },
          fatherOrganisation: {
            select: {
              id: true,
              value: true,
            },
          },
          motherOccupation: {
            select: {
              id: true,
              value: true,
            },
          },
          motherOrganisation: {
            select: {
              id: true,
              value: true,
            },
          },
          familyHome: {
            select: {
              id: true,
              value: true,
            },
          },
          nativePlace: {
            select: {
              id: true,
              value: true,
            },
          },
          familyIncome: {
            select: {
              id: true,
              title: true,
            },
          },
          siblings: {
            select: {
              relation: {
                select: {
                  id: true,
                  value: true,
                },
              },
              occupation: {
                select: {
                  id: true,
                  value: true,
                },
              },
              marital: {
                select: {
                  id: true,
                  value: true,
                },
              },
            },
          },
        },
      },
      answer: {
        select: {
          question: {
            select: {
              id: true,
              title: true,
              category: true,
              screen: true,
            },
          },
          option: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      },
      userPrompts: {
        select: {
          id: true,
          answer: true,
          displayOrder: true,
          prompt: {
            select: {
              id: true,
              question: true,
            },
          },
        },
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  });
}