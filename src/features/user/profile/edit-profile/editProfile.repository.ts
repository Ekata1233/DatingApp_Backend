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

export const findQuestionByKey = async (
  key: string
) => {
  return prisma.question.findUnique({
    where: { key },
    include: {
      options: true
    }
  });
};

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