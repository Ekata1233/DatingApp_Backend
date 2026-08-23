const calculateAge = (birthDate: Date) => {
  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const month =
    today.getMonth() -
    birthDate.getMonth();

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

export const getStaticHistoryReview = (
  status: string
) => {
  switch (status) {
    case "COMPLETED":
      return {
        show: true,
        rating: 4,
        maxRating: 5,
        text: "Walked, then coffee after. Good conversation, no spark for a second date.",
      };

    case "NO_SHOW":
    case "EXPIRED":
    case "CANCELLED":
    default:
      return {
        show: false,
        rating: null,
        maxRating: 5,
        text: null,
      };
  }
};

export const getHistoryStatus = (
  planStatus: string,
  confirmedStatus?: string | null,
  eventDateTime?: Date | null
) => {
  /**
   * DateConfirmed has highest priority
   */
  if (confirmedStatus === "NO_SHOW") {
    return "NO_SHOW";
  }

  if (confirmedStatus === "COMPLETED") {
    return "COMPLETED";
  }

  if (confirmedStatus === "CANCELLED") {
    return "CANCELLED";
  }
if (confirmedStatus === "UPCOMING") {
  return "BOOKED";
}
  /**
   * DatePlan status
   */
  if (planStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (planStatus === "EXPIRED") {
    return "EXPIRED";
  }

  if (planStatus === "COMPLETED") {
    return "COMPLETED";
  }

  /**
   * If ACTIVE/BOOKED event time has passed,
   * consider it expired for history.
   */
  if (
    (planStatus === "ACTIVE" || planStatus === "BOOKED") &&
    eventDateTime &&
    new Date(eventDateTime).getTime() < Date.now()
  ) {
    return "EXPIRED";
  }

  return planStatus;
};

export const getHistoryStatusLabel = (
  status: string
) => {
  switch (status) {
    case "COMPLETED":
      return "MET";

    case "NO_SHOW":
      return "NO-SHOW";

    case "EXPIRED":
      return "EXPIRED";

    case "CANCELLED":
      return "CANCELLED";

    case "BOOKED":
      return "BOOKED";

    default:
      return status;
  }
};
export const getHistoryMessage = (
  status: string,
  participantName?: string | null,
  requestCount: number = 0
) => {
  switch (status) {
    case "COMPLETED":
      return "Walked, then coffee after. Good conversation, no spark for a second date.";

    case "NO_SHOW":
      return participantName
        ? `You approved ${participantName} and waited 40 min. ${participantName} didn’t arrive.`
        : "You approved the participant and waited 40 min. They didn’t arrive.";

    case "EXPIRED":
      return `${requestCount} ${
        requestCount === 1 ? "request came" : "requests came"
      } in but you didn’t approve anyone before the time passed.`;

    case "CANCELLED":
      if (requestCount === 0) {
        return "You cancelled this date plan before anyone joined.";
      }

      return `You cancelled 4 hours before. All ${requestCount} ${
        requestCount === 1 ? "requester was" : "requesters were"
      } notified automatically.`;

    default:
      return null;
  }
};
export { calculateAge };