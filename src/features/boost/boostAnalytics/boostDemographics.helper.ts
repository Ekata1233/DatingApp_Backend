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
      actor.profile?.community
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