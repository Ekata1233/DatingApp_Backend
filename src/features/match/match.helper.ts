export const normalizeUserPair = (
  userAId: string,
  userBId: string,
) => {
  if (userAId === userBId) {
    throw new Error("Cannot create match with same user");
  }

  return userAId < userBId
    ? {
        user1Id: userAId,
        user2Id: userBId,
      }
    : {
        user1Id: userBId,
        user2Id: userAId,
      };
};