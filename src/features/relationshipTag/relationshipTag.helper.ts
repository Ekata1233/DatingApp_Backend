type RelationshipEndedInput = {
  relationshipId: string;
  endedById: string;
  endedByName: string;
  tag: string;
  startedAt: Date;
  endedAt: Date;
  reachedLevel: number | null;
};

export const buildRelationshipEndedPayload = (
  data: RelationshipEndedInput
) => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const daysTogether = Math.max(
    0,
    Math.floor(
      (data.endedAt.getTime() -
        data.startedAt.getTime()) / MS_PER_DAY
    )
  );

  const relationshipLabels: Record<string, string> = {
    IN_RELATIONSHIP: "In a Relationship",
    OPEN_RELATIONSHIP: "Open Relationship",
    ENGAGED: "Engaged",
    DATE_TO_MARRY: "Date to Marry",
  };

  const relationshipLabel =
    relationshipLabels[data.tag] ?? data.tag;

  return {
    eventType: "RELATIONSHIP_ENDED",

    relationshipId: data.relationshipId,

    endedBy: {
      id: data.endedById,
      fullName: data.endedByName,
    },

    relationshipTag: data.tag,
    relationshipLabel,

    startedAt: data.startedAt,
    endedAt: data.endedAt,

    daysTogether,

    reachedLevel: data.reachedLevel,

    title:
      `${data.endedByName} ended your ${relationshipLabel} status`,

    message: {
      from: "WELVORS",

      body:
        "Every real connection teaches you what you truly deserve. " +
        "You showed up with honesty — that’s exactly who the right person is looking for.",

      footer:
        "Your next chapter is already on its way.",
    },
  };
};