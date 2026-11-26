import {
  Prisma,
  EventVisibility,
  PackageType,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

import {
  UserEventMembership,
  UserMembershipType,
} from "./userEvent.types";

// ======================================================
// GET USER ACTIVE MEMBERSHIP
// ======================================================

export const getUserEventMembership = async (
  userId: string,
  now: Date
): Promise<UserEventMembership> => {
  const activePackages = await prisma.userPackage.findMany({
    where: {
      user_id: userId,

      status: "ACTIVE",

      startDate: {
        lte: now,
      },

      OR: [
        {
          endDate: null,
        },
        {
          endDate: {
            gt: now,
          },
        },
      ],
    },

    select: {
      package: {
        select: {
          name: true,
        },
      },
    },
  });

  // Handle multiple active packages safely
  const packageNames = activePackages.map(
    (item) => item.package.name
  );

  let packageType: UserMembershipType = "FREE";

  if (packageNames.includes(PackageType.VIP_ELITE)) {
    packageType = PackageType.VIP_ELITE;

  } else if (packageNames.includes(PackageType.VIP)) {
    packageType = PackageType.VIP;

  } else if (packageNames.includes(PackageType.PREMIUM)) {
    packageType = PackageType.PREMIUM;
  }

  // Determine event visibility
  const visibility =
    packageType === PackageType.VIP ||
    packageType === PackageType.VIP_ELITE
      ? EventVisibility.VIP_AND_VIP_ELITE
      : EventVisibility.FREE_AND_PREMIUM;

  return {
    packageType,
    visibility,
  };
};

// ======================================================
// EVENT CARD SELECT
// ======================================================

export const getUserEventCardSelect = (
  now: Date
) => ({
  id: true,

  title: true,

  eventDurationType: true,

  tripType: true,

  visibility: true,

  // CATEGORY
  category: {
    select: {
      id: true,
      label: true,
      value: true,
      icon: true,
    },
  },

  // EVENT COVER PHOTO
  photos: {
    where: {
      photoType: "EVENT",
    },

    select: {
      photoUrl: true,
      sortOrder: true,
    },

    orderBy: {
      sortOrder: "asc",
    },

    take: 1,
  },

  // UPCOMING EVENT DATES
  dates: {
    where: {
      status: "SCHEDULED",

      startDateTime: {
        gt: now,
      },
    },

    select: {
      id: true,
      startDateTime: true,
      endDateTime: true,
      timezone: true,
      isPrimary: true,
      isMoreDate: true,
    },

    orderBy: {
      startDateTime: "asc",
    },
  },

  // SINGLE DAY VENUE
  venue: {
    select: {
      venueName: true,
      fullAddress: true,
    },
  },

  // PRICING TYPE
  priceType: true,

  // CAPACITY
  totalCapacity: true,
  menCapacity: true,
  womenCapacity: true,
  otherCapacity: true,
  coupleCapacity: true,

  // ENTRY PRICES
  menEntryPrice: true,
  womenEntryPrice: true,
  otherEntryPrice: true,
  coupleEntryPrice: true,

  // DISCOUNT PERCENTAGES
  menDiscountPercentage: true,
  womenDiscountPercentage: true,
  otherDiscountPercentage: true,
  coupleDiscountPercentage: true,

  // DISCOUNTED PRICES
  menDiscountedPrice: true,
  womenDiscountedPrice: true,
  otherDiscountedPrice: true,
  coupleDiscountedPrice: true,

  // AGE AND GROUP
  minAge: true,
  maxAge: true,
  groupSize: true,

  // MULTI DAY TRIP
  tripDetails: {
    select: {
      totalDays: true,

      journeyThere: true,
      journeyBack: true,

      pickupCity: true,
      pickupPoint: true,
      exactPickupSpot: true,

      destinationPlace: true,
      destinationArea: true,

      // TRIP DAYS
      days: {
        select: {
          dayNumber: true,

          stay: {
            select: {
              amenities: true,
            },
          },
        },

        orderBy: {
          dayNumber: "asc",
        },
      },

      // ALL STAY AMENITIES
      stays: {
        select: {
          amenities: true,
        },
      },
    },
  },

} satisfies Prisma.EventSelect);

// ======================================================
// GET PUBLISHED EVENTS BY USER VISIBILITY
// ======================================================

export const findUserPublishedEvents = async (
  visibility: EventVisibility,
  page: number,
  limit: number,
  now: Date
) => {
  const skip = (page - 1) * limit;

  // Common event filters
  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",

    isDeleted: false,

    deletedAt: null,

    visibility,

    dates: {
      some: {
        status: "SCHEDULED",

        startDateTime: {
          gt: now,
        },
      },
    },
  };

  return prisma.$transaction(
    async (tx) => {
      // Find event IDs ordered by nearest upcoming date
      const eventDates = await tx.eventDate.groupBy({
        by: ["eventId"],

        where: {
          status: "SCHEDULED",

          startDateTime: {
            gt: now,
          },

          event: {
            is: where,
          },
        },

        _min: {
          startDateTime: true,
        },

        orderBy: [
          {
            _min: {
              startDateTime: "asc",
            },
          },
          {
            eventId: "asc",
          },
        ],

        skip,
        take: limit,
      });

      const eventIds = eventDates.map(
        (item) => item.eventId
      );

      // Fetch only required card fields
      const events = await tx.event.findMany({
        where: {
          ...where,

          id: {
            in: eventIds,
          },
        },

        select: getUserEventCardSelect(now),
      });

      // Maintain upcoming event order
      const eventMap = new Map(
        events.map((event) => [event.id, event])
      );

      const sortedEvents = eventIds.flatMap((id) => {
        const event = eventMap.get(id);

        return event ? [event] : [];
      });

      // Total matching events
      const total = await tx.event.count({
        where,
      });

      return {
        events: sortedEvents,
        total,
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.RepeatableRead,

      maxWait: 5000,
      timeout: 15000,
    }
  );
};