import {
  getUserForMatchAnalysis,
} from "./match-analysis.repository";

import {
  SignalResult,
  DimensionKey,
  calculateAge,
  calculateDistanceKm,
  exactMatchScore,
  ageCompatibilityScore,
  distanceCompatibilityScore,
  screenToDimension,
  average,
  normalize,
} from "./match-analysis.utils";

const DIMENSION_CONFIG: Record<
  DimensionKey,
  {
    title: string;
    weight: number;
    icon: string;
  }
> = {
  RELATIONSHIP_INTENT: {
    title: "Relationship intent",
    weight: 20,
    icon: "🎯",
  },

  VALUES: {
    title: "Values & love language",
    weight: 15,
    icon: "💞",
  },

  AGE_LIFE_STAGE: {
    title: "Age & life stage",
    weight: 10,
    icon: "🎂",
  },

  FAMILY_ROOTS: {
    title: "Family & roots",
    weight: 10,
    icon: "🏡",
  },

  COMMUNICATION: {
    title: "Communication style",
    weight: 10,
    icon: "📞",
  },

  LIFESTYLE: {
    title: "Lifestyle",
    weight: 15,
    icon: "🌿",
  },

  INTERESTS: {
    title: "Interests & hobbies",
    weight: 8,
    icon: "🥾",
  },

  EDUCATION_AMBITION: {
    title: "Education & ambition",
    weight: 7,
    icon: "🎓",
  },

  LOCATION: {
    title: "Location",
    weight: 5,
    icon: "📍",
  },
};

const addSignal = (
  signals: SignalResult[],
  data: Omit<SignalResult, "matched">
) => {
  signals.push({
    ...data,
    matched: data.score >= 80,
  });
};

const getMasterValue = (relation: any) =>
  relation?.value ?? null;

const getRelationTitle = (relation: any) =>
  relation?.title ??
  relation?.name ??
  relation?.value ??
  null;

const compareDynamicAnswers = (
  userA: any,
  userB: any,
  signals: SignalResult[]
) => {
  const answersA = new Map<string, any[]>();
  const answersB = new Map<string, any[]>();

  // ================================
  // GROUP USER A ANSWERS
  // ================================

  for (const answer of userA.answer ?? []) {
    const existing =
      answersA.get(answer.question_id) ?? [];

    existing.push(answer);

    answersA.set(
      answer.question_id,
      existing
    );
  }

  // ================================
  // GROUP USER B ANSWERS
  // ================================

  for (const answer of userB.answer ?? []) {
    const existing =
      answersB.get(answer.question_id) ?? [];

    existing.push(answer);

    answersB.set(
      answer.question_id,
      existing
    );
  }

  // ================================
  // COMPARE
  // ================================

  for (const [questionId, userAnswers] of answersA) {
    const targetAnswers =
      answersB.get(questionId);

    if (!targetAnswers?.length) {
      continue;
    }

    const question =
      userAnswers[0]?.question;

    if (!question) {
      continue;
    }

    const dimension =
      screenToDimension(question.screen);

    if (!dimension) {
      continue;
    }

    // ================================
    // OPTION IDs
    // ================================

    const userOptionIds = new Set<string>(
      userAnswers.map(
        (answer) => answer.option_id
      )
    );

    const targetOptionIds = new Set<string>(
      targetAnswers.map(
        (answer) => answer.option_id
      )
    );

    // ================================
    // FIND COMMON OPTIONS
    // ================================

    const commonOptionIds =
      [...userOptionIds].filter(
        (optionId) =>
          targetOptionIds.has(optionId)
      );

    // ================================
    // GET COMMON OPTION LABELS
    // ================================

    const sharedValues =
      userAnswers
        .filter((answer) =>
          commonOptionIds.includes(
            answer.option_id
          )
        )
        .map(
          (answer) =>
            answer.option?.label ??
            answer.option?.value
        )
        .filter(
          (value): value is string =>
            Boolean(value)
        );

    // ================================
    // SCORE
    // ================================

    let score = 0;

    if (question.isMulti) {
      const union = new Set([
        ...userOptionIds,
        ...targetOptionIds,
      ]);

      score =
        union.size > 0
          ? Math.round(
              (commonOptionIds.length /
                union.size) *
                100
            )
          : 0;
    } else {
      score =
        commonOptionIds.length > 0
          ? 100
          : 0;
    }

    // ================================
    // ADD SIGNAL
    // ================================

    addSignal(signals, {
      key: `QUESTION_${question.key}`,

      title: question.title,

      dimension,

      score,

      userValue: userAnswers
        .map(
          (answer) =>
            answer.option?.label ??
            answer.option?.value
        )
        .filter(Boolean)
        .join(", "),

      targetValue: targetAnswers
        .map(
          (answer) =>
            answer.option?.label ??
            answer.option?.value
        )
        .filter(Boolean)
        .join(", "),

      sharedValues,

      source: "DYNAMIC",
    });
  }
};

export const getMatchAnalysisService = async (
  currentUserId: string,
  targetUserId: string
) => {
  if (currentUserId === targetUserId) {
    throw new Error(
      "CANNOT_ANALYZE_OWN_PROFILE"
    );
  }

  const [user, target] =
    await Promise.all([
      getUserForMatchAnalysis(currentUserId),
      getUserForMatchAnalysis(targetUserId),
    ]);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (!target) {
    throw new Error(
      "TARGET_USER_NOT_FOUND"
    );
  }

  const signals: SignalResult[] = [];

  // =====================================================
  // 1. RELATIONSHIP INTENT
  // =====================================================

  const intentionScore =
    exactMatchScore(
      user.intentionId,
      target.intentionId
    );

  if (intentionScore !== null) {
    addSignal(signals, {
      key: "RELATIONSHIP_INTENT",
      title: "Relationship intent",
      dimension: "RELATIONSHIP_INTENT",
      score: intentionScore,

      userValue:
        getRelationTitle(user.intention) ??
        user.looking_for ??
        null,

      targetValue:
        getRelationTitle(target.intention) ??
        target.looking_for ??
        null,

      source: "STATIC",
    });
  }

  // =====================================================
  // 2. VALUES / LOVE LANGUAGE
  // =====================================================

  const loveLanguageScore =
    exactMatchScore(
      user.about?.loveLanguage,
      target.about?.loveLanguage
    );

  if (loveLanguageScore !== null) {
    addSignal(signals, {
      key: "LOVE_LANGUAGE",
      title: "Love language",
      dimension: "VALUES",
      score: loveLanguageScore,
      userValue:
        user.about?.loveLanguage ?? null,
      targetValue:
        target.about?.loveLanguage ?? null,
      source: "STATIC",
    });
  }

  // =====================================================
  // 3. AGE / LIFE STAGE
  // =====================================================

  const userAge =
    calculateAge(user.birth_date);

  const targetAge =
    calculateAge(target.birth_date);

  const ageScore =
    ageCompatibilityScore(
      userAge,
      targetAge
    );

  if (ageScore !== null) {
    addSignal(signals, {
      key: "AGE",
      title: "Age",
      dimension: "AGE_LIFE_STAGE",
      score: ageScore,
      userValue:
        userAge?.toString() ?? null,
      targetValue:
        targetAge?.toString() ?? null,
      source: "STATIC",
    });
  }

  const maritalScore =
    exactMatchScore(
      user.about?.maritalStatus,
      target.about?.maritalStatus
    );

  if (maritalScore !== null) {
    addSignal(signals, {
      key: "MARITAL_STATUS",
      title: "Marital status",
      dimension: "AGE_LIFE_STAGE",
      score: maritalScore,
      userValue:
        user.about?.maritalStatus ?? null,
      targetValue:
        target.about?.maritalStatus ?? null,
      source: "STATIC",
    });
  }

  const childStatusScore =
    exactMatchScore(
      user.about?.childStatus,
      target.about?.childStatus
    );

  if (childStatusScore !== null) {
    addSignal(signals, {
      key: "CHILD_STATUS",
      title: "Children",
      dimension: "AGE_LIFE_STAGE",
      score: childStatusScore,
      userValue:
        user.about?.childStatus ?? null,
      targetValue:
        target.about?.childStatus ?? null,
      source: "STATIC",
    });
  }

  const livingScore =
    exactMatchScore(
      user.about?.livingSituation,
      target.about?.livingSituation
    );

  if (livingScore !== null) {
    addSignal(signals, {
      key: "LIVING_SITUATION",
      title: "Living situation",
      dimension: "AGE_LIFE_STAGE",
      score: livingScore,
      userValue:
        user.about?.livingSituation ?? null,
      targetValue:
        target.about?.livingSituation ?? null,
      source: "STATIC",
    });
  }

  // =====================================================
  // 4. FAMILY / ROOTS
  // =====================================================

  const religionScore =
    exactMatchScore(
      user.profile?.religionId,
      target.profile?.religionId
    );

  if (religionScore !== null) {
    addSignal(signals, {
      key: "RELIGION",
      title: "Religion",
      dimension: "FAMILY_ROOTS",
      score: religionScore,
      userValue:
        getRelationTitle(
          user.profile?.religion
        ),
      targetValue:
        getRelationTitle(
          target.profile?.religion
        ),
      source: "STATIC",
    });
  }

  const communityScore =
    exactMatchScore(
      user.profile?.communityId,
      target.profile?.communityId
    );

  if (communityScore !== null) {
    addSignal(signals, {
      key: "COMMUNITY",
      title: "Community",
      dimension: "FAMILY_ROOTS",
      score: communityScore,
      userValue:
        getRelationTitle(
          user.profile?.community
        ),
      targetValue:
        getRelationTitle(
          target.profile?.community
        ),
      source: "STATIC",
    });
  }

  const familyTypeScore =
    exactMatchScore(
      user.familyProfile?.familyTypeId,
      target.familyProfile?.familyTypeId
    );

  if (familyTypeScore !== null) {
    addSignal(signals, {
      key: "FAMILY_TYPE",
      title: "Family type",
      dimension: "FAMILY_ROOTS",
      score: familyTypeScore,
      userValue:
        getMasterValue(
          user.familyProfile?.familyType
        ),
      targetValue:
        getMasterValue(
          target.familyProfile?.familyType
        ),
      source: "STATIC",
    });
  }

  const familyStatusScore =
    exactMatchScore(
      user.familyProfile?.familyStatusId,
      target.familyProfile?.familyStatusId
    );

  if (familyStatusScore !== null) {
    addSignal(signals, {
      key: "FAMILY_STATUS",
      title: "Family status",
      dimension: "FAMILY_ROOTS",
      score: familyStatusScore,
      userValue:
        getMasterValue(
          user.familyProfile?.familyStatus
        ),
      targetValue:
        getMasterValue(
          target.familyProfile?.familyStatus
        ),
      source: "STATIC",
    });
  }

  const nativePlaceScore =
    exactMatchScore(
      user.familyProfile?.nativePlaceId,
      target.familyProfile?.nativePlaceId
    );

  if (nativePlaceScore !== null) {
    addSignal(signals, {
      key: "NATIVE_PLACE",
      title: "Native place",
      dimension: "FAMILY_ROOTS",
      score: nativePlaceScore,
      userValue:
        getMasterValue(
          user.familyProfile?.nativePlace
        ),
      targetValue:
        getMasterValue(
          target.familyProfile?.nativePlace
        ),
      source: "STATIC",
    });
  }

  // =====================================================
  // 5. COMMUNICATION
  // =====================================================

  const communicationScore =
    exactMatchScore(
      user.about?.communicationStyle,
      target.about?.communicationStyle
    );

  if (communicationScore !== null) {
    addSignal(signals, {
      key: "COMMUNICATION_STYLE",
      title: "Communication style",
      dimension: "COMMUNICATION",
      score: communicationScore,
      userValue:
        user.about?.communicationStyle ??
        null,
      targetValue:
        target.about?.communicationStyle ??
        null,
      source: "STATIC",
    });
  }

  // =====================================================
  // 6 + 7 + Dynamic values
  // =====================================================

  compareDynamicAnswers(
    user,
    target,
    signals
  );

  // =====================================================
  // 8. EDUCATION / AMBITION
  // =====================================================

  const educationScore =
    exactMatchScore(
      user.eduWork?.highestEdu,
      target.eduWork?.highestEdu
    );

  if (educationScore !== null) {
    addSignal(signals, {
      key: "EDUCATION",
      title: "Education",
      dimension: "EDUCATION_AMBITION",
      score: educationScore,
      userValue:
        user.eduWork?.highestEdu ?? null,
      targetValue:
        target.eduWork?.highestEdu ?? null,
      source: "STATIC",
    });
  }

  const ambitionScore =
    exactMatchScore(
      user.eduWork?.ambitionId,
      target.eduWork?.ambitionId
    );

  if (ambitionScore !== null) {
    addSignal(signals, {
      key: "AMBITION",
      title: "Ambition",
      dimension: "EDUCATION_AMBITION",
      score: ambitionScore,
      userValue:
        user.eduWork?.ambition?.title ??
        null,
      targetValue:
        target.eduWork?.ambition?.title ??
        null,
      source: "STATIC",
    });
  }

  const professionScore =
    exactMatchScore(
      user.eduWork?.professionId,
      target.eduWork?.professionId
    );

  if (professionScore !== null) {
    addSignal(signals, {
      key: "PROFESSION",
      title: "Profession",
      dimension: "EDUCATION_AMBITION",
      score: professionScore,
      userValue:
        user.eduWork?.profession?.name ??
        null,
      targetValue:
        target.eduWork?.profession?.name ??
        null,
      source: "STATIC",
    });
  }

  // =====================================================
  // 9. LOCATION
  // =====================================================

  const distance =
    calculateDistanceKm(
      user.profile?.latitude,
      user.profile?.longitude,
      target.profile?.latitude,
      target.profile?.longitude
    );

  const locationScore =
    distanceCompatibilityScore(distance);

  if (locationScore !== null) {
    addSignal(signals, {
      key: "LOCATION",
      title: "Location",
      dimension: "LOCATION",
      score: locationScore,
      userValue:
        user.profile?.city ?? null,
      targetValue:
        target.profile?.city ?? null,
      source: "STATIC",
    });
  } else {
    /*
     * Fallback when coordinates aren't available.
     */
    const cityScore =
      exactMatchScore(
        user.profile?.city,
        target.profile?.city
      );

    if (cityScore !== null) {
      addSignal(signals, {
        key: "CITY",
        title: "City",
        dimension: "LOCATION",
        score: cityScore,
        userValue:
          user.profile?.city ?? null,
        targetValue:
          target.profile?.city ?? null,
        source: "STATIC",
      });
    }
  }

  // =====================================================
  // DIMENSION SCORES
  // =====================================================

  const dimensionEntries = (
    Object.keys(
      DIMENSION_CONFIG
    ) as DimensionKey[]
  ).map((key) => {
    const config =
      DIMENSION_CONFIG[key];

    const dimensionSignals =
      signals.filter(
        (signal) =>
          signal.dimension === key
      );

    const score = average(
      dimensionSignals.map(
        (signal) => signal.score
      )
    );

    return {
      key,
      title: config.title,
      icon: config.icon,
      weight: config.weight,
      score,
      signalsCompared:
        dimensionSignals.length,
    };
  });

  // =====================================================
  // OVERALL MATCH SCORE
  // =====================================================

  /*
   * IMPORTANT:
   * Only dimensions having actual comparable data
   * participate in the denominator.
   *
   * Missing information therefore does NOT become zero.
   */

  const availableDimensions =
    dimensionEntries.filter(
      (dimension) =>
        dimension.score !== null
    );

  const totalAvailableWeight =
    availableDimensions.reduce(
      (sum, dimension) =>
        sum + dimension.weight,
      0
    );

  const overallScore =
    totalAvailableWeight > 0
      ? Math.round(
          availableDimensions.reduce(
            (sum, dimension) =>
              sum +
              (dimension.score as number) *
                dimension.weight,
            0
          ) / totalAvailableWeight
        )
      : 0;

  // =====================================================
  // STRONGEST DIMENSION
  // =====================================================

  const strongestDimension =
    [...availableDimensions].sort(
      (a, b) =>
        (b.score ?? 0) -
        (a.score ?? 0)
    )[0];

  const dimensions =
    dimensionEntries.map(
      (dimension) => ({
        key: dimension.key,
        title: dimension.title,
        icon: dimension.icon,
        score: dimension.score,
        signalsCompared:
          dimension.signalsCompared,
        strongest:
          dimension.key ===
          strongestDimension?.key,
      })
    );

  // =====================================================
  // SHARED INTERESTS
  // =====================================================

  const sharedInterests =
  signals
    .filter(
      (signal) =>
        signal.dimension === "INTERESTS" &&
        signal.sharedValues &&
        signal.sharedValues.length > 0
    )
    .flatMap((signal) =>
      signal.sharedValues!.map((value) => ({
        name: value,
        both: true,
      }))
    );

  // =====================================================
  // DIFFERENCES
  // =====================================================

  const differences =
    signals
      .filter(
        (signal) =>
          signal.score < 60
      )
      .sort(
        (a, b) =>
          a.score - b.score
      )
      .slice(0, 5)
      .map((signal) => ({
        key: signal.key,
        title: signal.title,
        you: signal.userValue,
        them: signal.targetValue,
        score: signal.score,
      }));

  // =====================================================
  // HIGHLIGHTS
  // =====================================================

  const highlights: string[] = [];

  const intent =
    signals.find(
      (signal) =>
        signal.key ===
        "RELATIONSHIP_INTENT"
    );

  if (intent?.score === 100) {
    highlights.push("Same intent");
  }

  const loveLanguage =
    signals.find(
      (signal) =>
        signal.key ===
        "LOVE_LANGUAGE"
    );

  if (loveLanguage?.score === 100) {
    highlights.push(
      "Same love language"
    );
  }

  if (distance !== null) {
    highlights.push(
      `${Math.round(distance)} km apart`
    );
  }

  const drinking =
    signals.find(
      (signal) =>
        signal.key.toLowerCase() ===
        "question_drinking"
    );

  if (drinking?.score === 100) {
    highlights.push(
      `Both ${drinking.userValue}`
    );
  }

  // =====================================================
  // SIDE BY SIDE
  // =====================================================

  const sideBySide =
    signals.map((signal) => ({
      key: signal.key,
      attribute: signal.title,
      you: signal.userValue,
      them: signal.targetValue,
      matched: signal.matched,
      score: signal.score,
    }));

  // =====================================================
  // BASIC HEADLINE
  // =====================================================

  let matchLabel = "Potential match";

  if (overallScore >= 90) {
    matchLabel = "Exceptional match";
  } else if (overallScore >= 80) {
    matchLabel = "Strong match";
  } else if (overallScore >= 70) {
    matchLabel = "Good match";
  } else if (overallScore >= 60) {
    matchLabel = "Moderate match";
  }

  const targetFirstName =
    target.full_name
      ?.trim()
      .split(/\s+/)[0] ??
    "this person";

  const strongestNames =
    availableDimensions
      .filter(
        (dimension) =>
          (dimension.score ?? 0) >= 80
      )
      .sort(
        (a, b) =>
          (b.score ?? 0) -
          (a.score ?? 0)
      )
      .slice(0, 3)
      .map(
        (dimension) =>
          dimension.title.toLowerCase()
      );

  let insight = `I compared ${signals.length} available profile signals between you and ${targetFirstName}.`;

  if (strongestNames.length) {
    insight += ` Your strongest alignment is across ${strongestNames.join(
      ", "
    )}.`;
  }

  if (differences.length) {
    insight += ` You also have a few differences, including ${differences
      .slice(0, 2)
      .map(
        (difference) =>
          difference.title.toLowerCase()
      )
      .join(" and ")}.`;
  }

  // =====================================================
  // FINAL RESPONSE
  // =====================================================

  return {
    users: {
      you: {
        id: user.id,
        name: user.full_name,
        age: userAge,
        photo:
          user.photos?.[0]?.media_url ??
          null,
      },

      target: {
        id: target.id,
        name: target.full_name,
        age: targetAge,
        photo:
          target.photos?.[0]?.media_url ??
          null,
      },
    },

    match: {
      score: overallScore,
      label: matchLabel,
      headline: `You & ${targetFirstName} are a ${matchLabel.toLowerCase()}`,
    },

    summary: {
      signalsCompared: signals.length,
      dimensionsCompared:
        availableDimensions.length,
      totalDimensions: 9,
    },

    insight: {
      title:
        "Welvors AI · Match Insight",
      basedOn:
        "Both available profiles",
      text: insight,
    },

    highlights:
      highlights.slice(0, 4),

    dimensions,

    sharedInterests,

    differences,

    sideBySide,

    meta: {
      distanceKm: distance,
      generatedAt:
        new Date().toISOString(),
    },
  };
};