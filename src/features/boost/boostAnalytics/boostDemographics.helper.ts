import { BoostDemographicType, Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const incrementDemographic = async (
  tx: Prisma.TransactionClient,
  boostUsageId: string,
  type: BoostDemographicType,
  label: string | null | undefined
) => {

  console.log("boost use id : ", boostUsageId);
  console.log("boost type : ", type);
  console.log("boost label : ", label);

  if (label === null || label === undefined) {
    return;
  }

  const cleanLabel = String(label).trim();

  if (!cleanLabel) {
    return;
  }

  await tx.boostDemographicStats.upsert({
    where: {
      boost_usage_id_type_label: {
        boost_usage_id: boostUsageId,
        type,
        label: cleanLabel,
      },
    },

    update: {
      count: {
        increment: 1,
      },
    },

    create: {
      boost_usage_id: boostUsageId,
      type,
      label: cleanLabel,
      count: 1,
    },
  });
};

export const getActorDemographics = async (
  actorId: string
) => {
  return prisma.user.findUnique({
    where: {
      id: actorId,
    },

    select: {
      id: true,
      birth_date: true,
      gender: true,

      profile: {
        select: {
          city: true,
          religion: true,
          community: true,
        },
      },

      eduWork: {
        select: {
          profession: true,
        },
      },
    },
  });
};

export const getAgeGroup = (
  birthDate: Date | null
): string | null => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();

  let age =
    today.getUTCFullYear() -
    birthDate.getUTCFullYear();

  const month =
    today.getUTCMonth() -
    birthDate.getUTCMonth();

  if (
    month < 0 ||
    (
      month === 0 &&
      today.getUTCDate() <
      birthDate.getUTCDate()
    )
  ) {
    age--;
  }

  if (age < 18) return "<18";
  if (age <= 23) return "18-23";
  if (age <= 32) return "24-32";
  if (age <= 40) return "33-40";
  if (age <= 50) return "41-50";

  return "51+";
};

export const saveActorDemographics = async (
  tx: Prisma.TransactionClient,
  boostUsageId: string,
  actor: any
) => {
  if (!actor) {
    return;
  }

  const ageGroup =
    getAgeGroup(actor.birth_date);

  await Promise.all([
    incrementDemographic(
      tx,
      boostUsageId,
      BoostDemographicType.LOCATION,
      actor.profile?.city
    ),

    incrementDemographic(
      tx,
      boostUsageId,
      BoostDemographicType.PROFESSION,
      actor.eduWork?.profession?.name
    ),

    incrementDemographic(
      tx,
      boostUsageId,
      BoostDemographicType.RELIGION,
      actor.profile?.religion?.name
    ),

    incrementDemographic(
      tx,
      boostUsageId,
      BoostDemographicType.COMMUNITY,
      actor.profile?.community?.name
    ),

    incrementDemographic(
      tx,
      boostUsageId,
      BoostDemographicType.AGE_GROUP,
      ageGroup
    ),

    incrementDemographic(
      tx,
      boostUsageId,
      BoostDemographicType.GENDER,
      actor.gender
        ? String(actor.gender)
        : null
    ),
  ]);
};

// =====================================================
// 5. CALCULATE DEMOGRAPHIC PERCENTAGES
// =====================================================

type DemographicRecord = {
  type: BoostDemographicType;
  label: string;
  count: number;
};

export const calculateDemographicPercentages = (
  demographics: DemographicRecord[]
) => {
  // Total count for each demographic type
  const totals: Record<string, number> = {};

  for (const item of demographics) {
    totals[item.type] =
      (totals[item.type] || 0) + item.count;
  }

  // Calculate percentage for every label
  return demographics.map((item) => {
    const total = totals[item.type] || 0;

    const percentage =
      total > 0
        ? Number(
          (
            (item.count / total) *
            100
          ).toFixed(2)
        )
        : 0;

    return {
      type: item.type,
      label: item.label,
      count: item.count,
      percentage,
    };
  });
};

// =====================================================
// 6. GET FORMATTED BOOST DEMOGRAPHICS
// =====================================================

export const getFormattedBoostDemographics = async (
  boostUsageId: string
) => {
  // Fetch demographic counts from database
  const demographics =
    await prisma.boostDemographicStats.findMany({
      where: {
        boost_usage_id: boostUsageId,
      },

      select: {
        type: true,
        label: true,
        count: true,
      },

      orderBy: [
        {
          type: "asc",
        },
        {
          count: "desc",
        },
        {
          label: "asc",
        },
      ],
    });

  // Calculate percentages
  const calculated =
    calculateDemographicPercentages(
      demographics
    );

  type DemographicItem =
    (typeof calculated)[number];

  type DemographicGroup = {
    total: number;
    top: DemographicItem | null;
    items: DemographicItem[];
  };

  const result: Record<
    string,
    DemographicGroup
  > = {};

  // Initialize all demographic types
  for (
    const type of Object.values(
      BoostDemographicType
    )
  ) {
    result[type.toLowerCase()] = {
      total: 0,
      top: null,
      items: [],
    };
  }

  // Group records by demographic type
  for (const item of calculated) {
    const key = item.type.toLowerCase();

    result[key].total += item.count;

    result[key].items.push(item);
  }

  // Sort each category and select top value
  for (const group of Object.values(result)) {
    group.items.sort(
      (a, b) =>
        b.count - a.count ||
        a.label.localeCompare(b.label)
    );

    group.top = group.items[0] || null;
  }

  return result;
};