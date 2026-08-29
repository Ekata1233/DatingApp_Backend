import { prisma } from "../../../prisma/prismaClient";
import {
  CreateEventInput,
  UpdateEventExperienceInput,
  UpdateEventHostInput,
  UpdateEventSafetyInput,
  UpdateEventTicketsInput,
  UpdateEventVenueInput,
} from "./event.types";

//firsr step - basic
export const createEvent = async (payload: CreateEventInput) => {
  const event = await prisma.event.create({
    data: {
      eventType: payload.eventType,
      title: payload.title,
      status: payload.status,

      currentStep: 1,
      basicsDone: true,

      featureTags: payload.featureTags?.length
        ? {
            create: payload.featureTags.map((tag, index) => ({
              label: tag.label,
              displayOrder: tag.displayOrder ?? index,
            })),
          }
        : undefined,
    },

    include: {
      featureTags: {
        orderBy: {
          displayOrder: "asc",
        },
      },
    },
  });

  return {
    ...event,
    nextStep: 2,
  };
};

// second step-host
export const updateEventHost = async (
  eventId: string,
  payload: UpdateEventHostInput,
) => {
  // 1. Check event
  const existingEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found");
  }

  // 2. Don't allow editing LIVE event
  if (existingEvent.status === "LIVE") {
    throw new Error("Published event cannot be edited");
  }

  // 3. Check Event Partner
  const eventPartner = await prisma.eventPartner.findFirst({
    where: {
      id: payload.eventPartnerId,
      isActive: true,
      isDeleted: false,
    },
    select: {
      id: true,
      businessName: true,
      city: true,
      status: true,
    },
  });

  if (!eventPartner) {
    throw new Error("Event partner not found or inactive");
  }

  // 4. Update Event
  const event = await prisma.event.update({
    where: {
      id: eventId,
    },

    data: {
      city: payload.city,

      eventPartnerId: payload.eventPartnerId,

      eventTag: payload.eventTag,

      hostDone: true,
      currentStep: 2,
    },

    select: {
      id: true,
      city: true,
      eventPartnerId: true,
      eventTag: true,
      currentStep: true,
      hostDone: true,

      eventPartner: {
        select: {
          id: true,
          businessName: true,
          legalEntity: true,
          contactPerson: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          logo: true,
        },
      },
    },
  });

  return {
    ...event,
    nextStep: 3,
  };
};

//third step- venue
export const updateEventVenue = async (
  eventId: string,
  payload: UpdateEventVenueInput,
) => {
  // 1. Check event
  const existingEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found");
  }

  // 2. Don't allow editing LIVE event
  if (existingEvent.status === "LIVE") {
    throw new Error("Published event cannot be edited");
  }

  // 3. Validate event date
  const eventDate = new Date(payload.eventDate);

  if (Number.isNaN(eventDate.getTime())) {
    throw new Error("Invalid event date");
  }

  // 4. Validate time
  if (payload.startTime >= payload.endTime) {
    throw new Error("End time must be greater than start time");
  }

  // 5. Update event
  const event = await prisma.event.update({
    where: {
      id: eventId,
    },

    data: {
      eventDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      venueName: payload.venueName,
      fullAddress: payload.fullAddress,
      latitude: payload.latitude,
      longitude: payload.longitude,

      venueDone: true,
      currentStep: 3,
    },

    select: {
      id: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      venueName: true,
      fullAddress: true,
      latitude: true,
      longitude: true,
      venueDone: true,
      currentStep: true,
    },
  });

  return {
    ...event,
    nextStep: 4,
  };
};

//fourth step - ticket

export const updateEventTickets = async (
  eventId: string,
  payload: UpdateEventTicketsInput,
) => {
  const existingEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found");
  }

  if (existingEvent.status === "LIVE") {
    throw new Error("Published event cannot be edited");
  }

  // Calculate discounted prices
  const discountMultiplier =
    1 - payload.discountPercentage / 100;

  const menDiscountedPrice =
    payload.menEntryPrice * discountMultiplier;

  const womenDiscountedPrice =
    payload.womenEntryPrice * discountMultiplier;

  const otherDiscountedPrice =
    payload.otherEntryPrice * discountMultiplier;

  const event = await prisma.event.update({
    where: {
      id: eventId,
    },

    data: {
      totalCapacity: payload.totalCapacity,

      menCapacity: payload.menCapacity,
      womenCapacity: payload.womenCapacity,
      otherCapacity: payload.otherCapacity,

      menEntryPrice: payload.menEntryPrice,
      womenEntryPrice: payload.womenEntryPrice,
      otherEntryPrice: payload.otherEntryPrice,

      discountPercentage: payload.discountPercentage,

      menDiscountedPrice,
      womenDiscountedPrice,
      otherDiscountedPrice,

      minAge: payload.minAge,
      maxAge: payload.maxAge,
      eventIntent: payload.eventIntent,

      ticketDone: true,
      currentStep: 4,
    },

    select: {
      id: true,

      totalCapacity: true,

      menCapacity: true,
      womenCapacity: true,
      otherCapacity: true,

      menEntryPrice: true,
      womenEntryPrice: true,
      otherEntryPrice: true,

      discountPercentage: true,

      menDiscountedPrice: true,
      womenDiscountedPrice: true,
      otherDiscountedPrice: true,

      minAge: true,
      maxAge: true,
      eventIntent: true,

      ticketDone: true,
      currentStep: true,
    },
  });

  return {
    ...event,
    nextStep: 5,
  };
};

//fifth step-experience
export const updateEventExperience = async (
  eventId: string,
  payload: UpdateEventExperienceInput,
) => {
  // ==========================================
  // 1. CHECK EVENT EXISTS
  // ==========================================

  const existingEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found");
  }

  // ==========================================
  // 2. DON'T ALLOW LIVE EVENT EDIT
  // ==========================================

  if (existingEvent.status === "LIVE") {
    throw new Error("Published event cannot be edited");
  }

  // ==========================================
  // 3. UPDATE EVERYTHING IN ONE TRANSACTION
  // ==========================================

  const event = await prisma.$transaction(async (tx) => {
    // ----------------------------------------
    // UPDATE MAIN EVENT
    // ----------------------------------------

    const updatedEvent = await tx.event.update({
      where: {
        id: eventId,
      },

      data: {
        // Only update heroImage if a new image
        // was uploaded
        ...(payload.heroImage !== undefined && {
          heroImage: payload.heroImage,
        }),

        aboutEvent: payload.aboutEvent,

        experienceDone: true,

        currentStep: 5,
      },

      select: {
        id: true,
        heroImage: true,
        aboutEvent: true,
        experienceDone: true,
        currentStep: true,
      },
    });

    // ----------------------------------------
    // GALLERY IMAGES
    // ----------------------------------------

    await tx.eventGallery.deleteMany({
      where: {
        eventId,
      },
    });

    if (payload.galleryImages.length > 0) {
      await tx.eventGallery.createMany({
        data: payload.galleryImages.map((image) => ({
          eventId,
          imageUrl: image.imageUrl,
          sortOrder: image.sortOrder,
        })),
      });
    }

    // ----------------------------------------
    // AMENITIES
    // ----------------------------------------

    await tx.eventAmenity.deleteMany({
      where: {
        eventId,
      },
    });

    if (payload.amenities.length > 0) {
      await tx.eventAmenity.createMany({
        data: payload.amenities.map((amenity, index) => ({
          eventId,

          name: amenity.name,

          icon: amenity.icon,

          sortOrder: amenity.sortOrder ?? index,
        })),
      });
    }

    // ----------------------------------------
    // ITINERARY
    // ----------------------------------------

    await tx.eventItinerary.deleteMany({
      where: {
        eventId,
      },
    });

   if (payload.itinerary.length > 0) {
  await tx.eventItinerary.createMany({
    data: payload.itinerary.map((item, index) => ({
      eventId,

      date: item.date,
      dayNumber: item.dayNumber,

      time: item.time,
      title: item.title,
      description: item.description,
      icon: item.icon,

      location: item.location,
      elevation: item.elevation,
      distance: item.distance,

      accommodation: item.accommodation,
      meals: item.meals,

      sortOrder: item.sortOrder ?? index,
    })),
  });
}

    // ----------------------------------------
    // WHY SHOULD COME
    // ----------------------------------------

    await tx.eventWhyCome.deleteMany({
      where: {
        eventId,
      },
    });

    if (payload.whyShouldCome.length > 0) {
      await tx.eventWhyCome.createMany({
        data: payload.whyShouldCome.map((item, index) => ({
          eventId,

          title: item.title,

          description: item.description,

          icon: item.icon,

          sortOrder: item.sortOrder ?? index,
        })),
      });
    }

    // ----------------------------------------
    // GET FINAL EVENT
    // ----------------------------------------

    return tx.event.findUnique({
      where: {
        id: eventId,
      },

      select: {
        id: true,

        heroImage: true,

        aboutEvent: true,

        experienceDone: true,

        currentStep: true,

        galleryImages: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        amenities: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        itinerary: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        whyShouldCome: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  });

  // ==========================================
  // 4. SAFETY CHECK
  // ==========================================

  if (!event) {
    throw new Error("Failed to update event experience");
  }

  // ==========================================
  // 5. RETURN RESPONSE
  // ==========================================

  return {
    ...event,
    nextStep: 6,
  };
};

//sixth step- safety
export const updateEventSafety = async (
  eventId: string,
  payload: UpdateEventSafetyInput,
) => {
  // ==========================================
  // 1. CHECK EVENT
  // ==========================================

  const existingEvent = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found");
  }

  // ==========================================
  // 2. DON'T ALLOW LIVE EVENT EDIT
  // ==========================================

  if (existingEvent.status === "LIVE") {
    throw new Error("Published event cannot be edited");
  }

  // ==========================================
  // 3. TRANSACTION
  // ==========================================

  const event = await prisma.$transaction(async (tx) => {
    // ----------------------------------------
    // UPDATE MAIN EVENT
    // ----------------------------------------

    await tx.event.update({
      where: {
        id: eventId,
      },

      data: {
        dressCode: payload.dressCode,

        refundWindow: payload.refundWindow,

        termsConditions: payload.termsConditions,

        safetyDone: true,

        currentStep: 6,
      },
    });

    // ----------------------------------------
    // DELETE OLD SAFETY FEATURES
    // ----------------------------------------

    await tx.eventSafety.deleteMany({
      where: {
        eventId,
      },
    });

    // ----------------------------------------
    // CREATE NEW SAFETY FEATURES
    // ----------------------------------------

    if (payload.safetyFeatures.length > 0) {
      await tx.eventSafety.createMany({
        data: payload.safetyFeatures.map((safety) => ({
          eventId,
          title: safety.title,
        })),
      });
    }

    // ----------------------------------------
// DELETE OLD FAQs
// ----------------------------------------

await tx.eventFAQ.deleteMany({
  where: {
    eventId,
  },
});

// ----------------------------------------
// CREATE NEW FAQs
// ----------------------------------------

if (payload.faqs && payload.faqs.length > 0) {
  await tx.eventFAQ.createMany({
    data: payload.faqs.map((faq, index) => ({
      eventId,
      question: faq.question,
      answer: faq.answer,
      displayOrder: faq.displayOrder ?? index,
    })),
  });
}
    // ----------------------------------------
    // GET UPDATED EVENT
    // ----------------------------------------

    return tx.event.findUnique({
      where: {
        id: eventId,
      },

      select: {
        id: true,

        dressCode: true,

        refundWindow: true,

        termsConditions: true,

        safetyDone: true,

        currentStep: true,

        safetyFeatures: true,
        faqs: {
      orderBy: {
        displayOrder: "asc",
      },
    },
      },
    });
  });

  // ==========================================
  // 4. CHECK RESULT
  // ==========================================

  if (!event) {
    throw new Error("Failed to update event safety");
  }

  // ==========================================
  // 5. RESPONSE
  // ==========================================

  return {
    ...event,
    nextStep: 7,
  };
};

//seventh step-review & publish
export const publishEvent = async (eventId: string) => {
  // ==========================================
  // 1. GET EVENT WITH ALL REQUIRED DATA
  // ==========================================

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },

    include: {
      galleryImages: true,
      amenities: true,
      itinerary: true,
      whyShouldCome: true,
      safetyFeatures: true,
    },
  });

  // ==========================================
  // 2. EVENT NOT FOUND
  // ==========================================

  if (!event) {
    throw new Error("Event not found");
  }

  // ==========================================
  // 3. ALREADY PUBLISHED
  // ==========================================

  if (event.status === "LIVE") {
    throw new Error("Event is already published");
  }

  // ==========================================
  // 4. CHECK BASIC DETAILS
  // ==========================================

  const missingFields: string[] = [];

  if (!event.eventType) {
    missingFields.push("eventType");
  }

  if (!event.title) {
    missingFields.push("title");
  }

  // ==========================================
  // 5. CHECK HOST DETAILS
  // ==========================================

  if (!event.city) {
    missingFields.push("city");
  }

  if (!event.eventPartnerId) {
    missingFields.push("eventPartner");
  }

  // ==========================================
  // 6. CHECK VENUE DETAILS
  // ==========================================

  if (!event.eventDate) {
    missingFields.push("eventDate");
  }

  if (!event.startTime) {
    missingFields.push("startTime");
  }

  if (!event.endTime) {
    missingFields.push("endTime");
  }

  if (!event.venueName) {
    missingFields.push("venueName");
  }

  if (!event.fullAddress) {
    missingFields.push("fullAddress");
  }

  // ==========================================
  // 7. CHECK TICKET DETAILS
  // ==========================================

 if (event.totalCapacity === null) {
  missingFields.push("totalCapacity");
}

if (event.menCapacity === null) {
  missingFields.push("menCapacity");
}

if (event.womenCapacity === null) {
  missingFields.push("womenCapacity");
}

if (event.otherCapacity === null) {
  missingFields.push("otherCapacity");
}

if (event.menEntryPrice === null) {
  missingFields.push("menEntryPrice");
}

if (event.womenEntryPrice === null) {
  missingFields.push("womenEntryPrice");
}

if (event.otherEntryPrice === null) {
  missingFields.push("otherEntryPrice");
}

if (event.discountPercentage === null) {
  missingFields.push("discountPercentage");
}

if (event.menDiscountedPrice === null) {
  missingFields.push("menDiscountedPrice");
}

if (event.womenDiscountedPrice === null) {
  missingFields.push("womenDiscountedPrice");
}

if (event.otherDiscountedPrice === null) {
  missingFields.push("otherDiscountedPrice");
}

if (event.minAge === null) {
  missingFields.push("minAge");
}

if (event.maxAge === null) {
  missingFields.push("maxAge");
}

if (!event.eventIntent) {
  missingFields.push("eventIntent");
}

  if (event.minAge === null) {
    missingFields.push("minAge");
  }

  if (event.maxAge === null) {
    missingFields.push("maxAge");
  }

  

  if (!event.eventIntent) {
    missingFields.push("eventIntent");
  }

  // ==========================================
  // 8. CHECK EXPERIENCE
  // ==========================================

  if (!event.heroImage) {
    missingFields.push("heroImage");
  }

  if (!event.aboutEvent) {
    missingFields.push("aboutEvent");
  }

  if (event.galleryImages.length === 0) {
    missingFields.push("galleryImages");
  }

  if (event.amenities.length === 0) {
    missingFields.push("amenities");
  }

  if (event.itinerary.length === 0) {
    missingFields.push("itinerary");
  }

  if (event.whyShouldCome.length === 0) {
    missingFields.push("whyShouldCome");
  }

  // ==========================================
  // 9. CHECK SAFETY
  // ==========================================

  if (event.safetyFeatures.length === 0) {
    missingFields.push("safetyFeatures");
  }

  if (!event.dressCode) {
    missingFields.push("dressCode");
  }

  if (!event.termsConditions) {
    missingFields.push("termsConditions");
  }

  // ==========================================
  // 10. CHECK STEP FLAGS
  // ==========================================

  if (!event.basicsDone) {
    missingFields.push("Step 1 - Basics");
  }

  if (!event.hostDone) {
    missingFields.push("Step 2 - Host");
  }

  if (!event.venueDone) {
    missingFields.push("Step 3 - Venue");
  }

  if (!event.ticketDone) {
    missingFields.push("Step 4 - Tickets");
  }

  if (!event.experienceDone) {
    missingFields.push("Step 5 - Experience");
  }

  if (!event.safetyDone) {
    missingFields.push("Step 6 - Safety");
  }

  // ==========================================
  // 11. VALIDATION FAILED
  // ==========================================

  if (missingFields.length > 0) {
    throw new Error(
      `Event cannot be published. Missing: ${missingFields.join(", ")}`,
    );
  }

  // ==========================================
  // 12. PUBLISH EVENT
  // ==========================================

  const publishedEvent = await prisma.event.update({
    where: {
      id: eventId,
    },

    data: {
      status: "LIVE",

      publishedAt: new Date(),

      currentStep: 7,
    },

    select: {
      id: true,
      eventType: true,
      title: true,
      status: true,
      eventTag: true,
      city: true,
      eventPartner: true,

      eventDate: true,
      startTime: true,
      endTime: true,
      venueName: true,
      fullAddress: true,

      // ========================================
// TICKETS
// ========================================

totalCapacity: true,

menCapacity: true,
womenCapacity: true,
otherCapacity: true,

menEntryPrice: true,
womenEntryPrice: true,
otherEntryPrice: true,

discountPercentage: true,

menDiscountedPrice: true,
womenDiscountedPrice: true,
otherDiscountedPrice: true,

minAge: true,
maxAge: true,
eventIntent: true,

      heroImage: true,
      aboutEvent: true,

      dressCode: true,
      refundWindow: true,
      termsConditions: true,

      currentStep: true,

      basicsDone: true,
      hostDone: true,
      venueDone: true,
      ticketDone: true,
      experienceDone: true,
      safetyDone: true,

      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // ==========================================
  // 13. RETURN
  // ==========================================

  return {
    ...publishedEvent,
    nextStep: null,
  };
};
const getEventBookingStats = async (
  eventId: string,
  totalCapacity: number | null,
) => {
  if (!totalCapacity || totalCapacity <= 0) {
    return {
      totalCapacity: 0,
      bookedCount: 0,
      spotsLeft: 0,
      bookedLast24Hours: 0,
      bookingPercentage: 0,
      fillingFast: false,
      fillingFastText: null,
      bookingSummary: "0 of 0 spots booked",
      last24HoursText: "0 people booked in the last 24 hours",
    };
  }

  const now = new Date();

  const last24Hours = new Date(
    now.getTime() - 24 * 60 * 60 * 1000,
  );

  // ========================================
  // CONFIRMED BOOKED TICKETS
  // ========================================

  const confirmedBookings =
    await prisma.eventBooking.aggregate({
      where: {
        eventId,
        status: "CONFIRMED",
      },

      _sum: {
        ticketCount: true,
      },
    });

  const bookedCount =
    confirmedBookings._sum.ticketCount ?? 0;

  // ========================================
  // CONFIRMED TICKETS BOOKED IN LAST 24 HOURS
  // ========================================

  const confirmedLast24Hours =
    await prisma.eventBooking.aggregate({
      where: {
        eventId,
        status: "CONFIRMED",
        createdAt: {
          gte: last24Hours,
        },
      },

      _sum: {
        ticketCount: true,
      },
    });

  const bookedLast24Hours =
    confirmedLast24Hours._sum.ticketCount ?? 0;

  // ========================================
  // SPOTS LEFT
  // ========================================

  const spotsLeft = Math.max(
    totalCapacity - bookedCount,
    0,
  );

  // ========================================
  // BOOKING PERCENTAGE
  // ========================================

  const bookingPercentage = Math.min(
    Math.round(
      (bookedCount / totalCapacity) * 100,
    ),
    100,
  );

  // ========================================
  // FILLING FAST
  // ========================================

  const fillingFast =
    spotsLeft <= Math.ceil(totalCapacity * 0.15);

  // ========================================
  // RESPONSE
  // ========================================

  return {
    totalCapacity,

    bookedCount,

    spotsLeft,

    bookedLast24Hours,

    bookingPercentage,

    fillingFast,

    fillingFastText: fillingFast
      ? `Only ${spotsLeft} spots left`
      : null,

    bookingSummary:
      `${bookedCount} of ${totalCapacity} spots booked`,

    last24HoursText:
      `${bookedLast24Hours} people booked in the last 24 hours`,
  };
};
//get apis
//get all
export const getAllEvents = async () => {
  const events = await prisma.event.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      // ========================================
      // EVENT PARTNER
      // ========================================

      eventPartner: {
        select: {
          id: true,
          businessName: true,
          legalEntity: true,
          businessType: true,
          contactPerson: true,
          email: true,
          phone: true,
          gstNumber: true,
          panNumber: true,
          experienceYears: true,
          description: true,
          monthlyEventsMin: true,
          monthlyEventsMax: true,
          teamSize: true,
          venueNames: true,
          address: true,
          areaName: true,
          city: true,
          state: true,
          country: true,
          pincode: true,
          coverageAreas: true,
          references: true,
          website: true,
          logo: true,
          gstCertificate: true,
          businessProof: true,
          status: true,
          isActive: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      // ========================================
      // STEP 5 - GALLERY
      // ========================================

      galleryImages: {
        orderBy: {
          sortOrder: "asc",
        },

        select: {
          id: true,
          imageUrl: true,
          sortOrder: true,
          createdAt: true,
        },
      },

      // ========================================
      // STEP 5 - AMENITIES
      // ========================================

      amenities: {
        orderBy: {
          sortOrder: "asc",
        },

        select: {
          id: true,
          name: true,
          icon: true,
          sortOrder: true,
        },
      },

      // ========================================
      // STEP 5 - ITINERARY
      // ========================================

      itinerary: {
  orderBy: [
    {
      dayNumber: "asc",
    },
    {
      sortOrder: "asc",
    },
  ],

  select: {
    id: true,

    date: true,
    dayNumber: true,

    time: true,
    title: true,
    description: true,
    icon: true,

    location: true,
    elevation: true,
    distance: true,

    accommodation: true,
    meals: true,

    sortOrder: true,
  },
},

      // ========================================
      // STEP 5 - WHY SHOULD COME
      // ========================================

      whyShouldCome: {
        orderBy: {
          sortOrder: "asc",
        },

        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          sortOrder: true,
        },
      },

      // ========================================
      // STEP 6 - SAFETY
      // ========================================

      safetyFeatures: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return events;
};

// ========================================
// GET EVENT LIST - MOBILE
// ========================================

export const getEventList = async () => {
  const events = await prisma.event.findMany({
    where: {
      status: "LIVE",
    },

    orderBy: {
      eventDate: "asc",
    },

    select: {
      id: true,
      eventType: true,
      title: true,

      eventDate: true,
      startTime: true,
      endTime: true,

      fullAddress: true,

      // NEW TICKET FIELDS
      totalCapacity: true,

      menCapacity: true,
      womenCapacity: true,
      otherCapacity: true,

      menEntryPrice: true,
      womenEntryPrice: true,
      otherEntryPrice: true,

      discountPercentage: true,

      menDiscountedPrice: true,
      womenDiscountedPrice: true,
      otherDiscountedPrice: true,

      minAge: true,
      maxAge: true,
      eventIntent: true,

      heroImage: true,

      eventTag: true,

      // NEW FEATURE TAGS
      featureTags: {
        orderBy: {
          displayOrder: "asc",
        },

        select: {
          id: true,
          label: true,
          displayOrder: true,
        },
      },
    },
  });

  const eventsWithBookingStats = await Promise.all(
    events.map(async (event) => {
      const bookingStats =
        await getEventBookingStats(
          event.id,
          event.totalCapacity,
        );

      return {
        ...event,

       
      };
    }),
  );

  return eventsWithBookingStats;
};

//get details
export const getEventDetails = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },

    select: {
      // ========================================
      // EVENT BASIC
      // ========================================

      id: true,
      title: true,
      eventType: true,

      // ========================================
      // PARTNER
      // ========================================

      eventPartnerId: true,

      eventTag: true,

      // ========================================
      // DATE / TIME
      // ========================================

      eventDate: true,
      startTime: true,
      endTime: true,

      // ========================================
      // TICKETS
      // ========================================

      totalCapacity: true,

menCapacity: true,
womenCapacity: true,
otherCapacity: true,

menEntryPrice: true,
womenEntryPrice: true,
otherEntryPrice: true,

discountPercentage: true,

menDiscountedPrice: true,
womenDiscountedPrice: true,
otherDiscountedPrice: true,

      // ========================================
      // LOCATION
      // ========================================

      fullAddress: true,
      latitude: true,
      longitude: true,

      // ========================================
      // EXPERIENCE
      // ========================================

      heroImage: true,
      aboutEvent: true,

      galleryImages: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          imageUrl: true,
          sortOrder: true,
        },
      },

      whyShouldCome: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          sortOrder: true,
        },
      },

      amenities: {
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          name: true,
          icon: true,
          sortOrder: true,
        },
      },

     itinerary: {
  orderBy: [
    {
      dayNumber: "asc",
    },
    {
      sortOrder: "asc",
    },
  ],

  select: {
    id: true,

    date: true,
    dayNumber: true,

    time: true,
    title: true,
    description: true,
    icon: true,

    location: true,
    elevation: true,
    distance: true,

    accommodation: true,
    meals: true,

    sortOrder: true,
  },
},

      // ========================================
      // SAFETY
      // ========================================

      safetyFeatures: {
        select: {
          id: true,
          title: true,
        },
      },

      // ========================================
      // TERMS
      // ========================================

      termsConditions: true,

      // ========================================
      // PARTNER DETAILS
      // ========================================

      eventPartner: {
        select: {
          id: true,
          businessName: true,
          address: true,
          logo: true,
        },
      },
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // ==========================================
  // STATIC VALUES FOR NOW
  // ==========================================

  const bookingStats =
  await getEventBookingStats(
    event.id,
    event.totalCapacity,
  );

return {
  ...event,

  bookingStats,
};
};
