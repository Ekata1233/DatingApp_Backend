export const canShowLastSeen = (
  viewerId: string,
  targetUser: any,
  isMatch: boolean
) => {
  switch (targetUser.lastSeenVisibility) {
    case "EVERYONE":
      return true;

    case "MATCHES":
      return isMatch;

    case "NOBODY":
      return false;

    default:
      return false;
  }
};
