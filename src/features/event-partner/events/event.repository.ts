
import { Prisma } from "@prisma/client";



import {
  SaveEventInput,
  TripDetailsInput,
  EventServiceError,
} from "./event.types";
import { prisma } from "../../../prisma/prismaClient";

// Complete Event Response
export const eventDetailsInclude = {
  category: true,

  // Avoid returning private host account information
  host: {
    select: {
      id: true,
    },
  },

  photos: {
    orderBy: [
      { photoType: "asc" },
      { sortOrder: "asc" },
    ],
  },

  dates: {
    orderBy: {
      startDateTime: "asc",
    },
  },

  venue: true,

  experience: {
    orderBy: {
      sortOrder: "asc",
    },
  },

  tripDetails: {
    include: {
      days: {
        orderBy: {
          dayNumber: "asc",
        },

        include: {
          stops: {
            orderBy: {
              sortOrder: "asc",
            },
          },

          games: {
            orderBy: {
              sortOrder: "asc",
            },
          },

          stay: true,
        },
      },

      stays: true,

      places: {
        orderBy: {
          sortOrder: "asc",
        },
      },

      roomOptions: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  },

  faqs: {
    orderBy: {
      sortOrder: "asc",
    },
  },

  _count: {
    select: {
      bookings: true,
      reviews: true,
    },
  },
} satisfies Prisma.EventInclude;

// Find event by organizer ownership
export const findOwnedEvent = async (
  eventId: string,
  businessId: string
) => {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      businessDetailsId: businessId,
      deletedAt: null,
    },

    include: eventDetailsInclude,
  });
};

// Save complete trip details
export const saveTripDetails = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  input: TripDetailsInput
) => {
  const {
    days,
    stays,
    places,
    roomOptions,
    ...tripData
  } = input;

  const existingTrip = await tx.tripDetails.findUnique({
    where: {
      eventId,
    },

    select: {
      id: true,
    },
  });

  // Replace the complete trip structure when supplied.
  // Remove days first because they reference TripStay.
  if (existingTrip) {
    await tx.tripDay.deleteMany({
      where: {
        tripDetailsId: existingTrip.id,
      },
    });

    await tx.tripDetails.delete({
      where: {
        id: existingTrip.id,
      },
    });
  }

  // Create parent trip
  const trip = await tx.tripDetails.create({
    data: {
      ...tripData,
      eventId,
    },
  });

  // Map frontend stay references to database UUIDs
  const stayMap = new Map<string, string>();

  for (const stayInput of stays ?? []) {
    const {
      clientRef,
      ...stayData
    } = stayInput;

    const stay = await tx.tripStay.create({
      data: {
        ...stayData,
        tripDetailsId: trip.id,
      },
    });

    stayMap.set(clientRef, stay.id);
  }

  // Create trip days, stops and games
  for (const dayInput of days ?? []) {
    const {
      stops,
      games,
      stayRef,
      ...dayData
    } = dayInput;

    const stayId = stayRef
      ? stayMap.get(stayRef)
      : null;

    if (stayRef && !stayId) {
      throw new EventServiceError(
        `Invalid stay reference: ${stayRef}`
      );
    }

    await tx.tripDay.create({
      data: {
        ...dayData,

        tripDetailsId: trip.id,

        stayId: stayId ?? null,

        ...(stops?.length
          ? {
              stops: {
                create: stops,
              },
            }
          : {}),

        ...(games?.length
          ? {
              games: {
                create: games,
              },
            }
          : {}),
      },
    });
  }

 // Create places
if (places?.length) {
  await tx.tripPlace.createMany({
    data: places.map((place) => {
      const { whySpecial, ...placeData } = place;

      return {
        ...placeData,

        whySpecial: whySpecial?.length
          ? whySpecial.join(", ")
          : null,

        tripDetailsId: trip.id,
      };
    }),
  });
}

  // Create room options
  if (roomOptions?.length) {
    await tx.tripRoomOption.createMany({
      data: roomOptions.map((room) => ({
        ...room,
        tripDetailsId: trip.id,
      })),
    });
  }

  return trip;
};

// Delete trip details safely
const removeTripDetails = async (
  tx: Prisma.TransactionClient,
  eventId: string
) => {
  const trip = await tx.tripDetails.findUnique({
    where: {
      eventId,
    },
  });

  if (!trip) return;

  await tx.tripDay.deleteMany({
    where: {
      tripDetailsId: trip.id,
    },
  });

  await tx.tripDetails.delete({
    where: {
      id: trip.id,
    },
  });
};

// Save all nested event relations
export const saveEventRelations = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  input: SaveEventInput
) => {
  // PHOTOS
  if (input.photos !== undefined) {
    await tx.eventPhoto.deleteMany({
      where: {
        eventId,
      },
    });

    if (input.photos.length > 0) {
      await tx.eventPhoto.createMany({
        data: input.photos.map((photo) => ({
          ...photo,
          eventId,
        })),
      });
    }
  }

  // EVENT DATES
  if (input.dates !== undefined) {
    await tx.eventDate.deleteMany({
      where: {
        eventId,
      },
    });

    if (input.dates.length > 0) {
      await tx.eventDate.createMany({
        data: input.dates.map((date) => ({
          ...date,
          eventId,
        })),
      });
    }
  }

  // EVENT VENUE
  if (input.venue !== undefined) {
    if (input.venue === null) {
      await tx.eventVenue.deleteMany({
        where: {
          eventId,
        },
      });
    } else {
      await tx.eventVenue.upsert({
        where: {
          eventId,
        },

        create: {
          ...input.venue,
          eventId,
        },

        update: input.venue,
      });
    }
  }

  // EVENT EXPERIENCE
  if (input.experience !== undefined) {
    await tx.eventExperience.deleteMany({
      where: {
        eventId,
      },
    });

    if (input.experience.length > 0) {
      await tx.eventExperience.createMany({
        data: input.experience.map((experience) => ({
          ...experience,
          eventId,
        })),
      });
    }
  }

  // TRIP DETAILS
  if (input.tripDetails !== undefined) {
    if (input.tripDetails === null) {
      await removeTripDetails(tx, eventId);
    } else {
      await saveTripDetails(
        tx,
        eventId,
        input.tripDetails
      );
    }
  }

  // FAQs
  if (input.faqs !== undefined) {
    await tx.eventFAQ.deleteMany({
      where: {
        eventId,
      },
    });

    if (input.faqs.length > 0) {
      await tx.eventFAQ.createMany({
        data: input.faqs.map((faq) => ({
          ...faq,
          eventId,
        })),
      });
    }
  }
};
