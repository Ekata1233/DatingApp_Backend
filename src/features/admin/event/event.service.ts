import { Gender, Prisma, Type } from "@prisma/client";
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



export const getEventList = async (
  eventType?: Type,
  dateFilter?: "TODAY" | "THIS_WEEKEND" | "THIS_MONTH",
  freeOnly?: boolean,
  userGender?: Gender
) => {
  const now = new Date();

  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  // TODAY
  if (dateFilter === "TODAY") {
    dateFrom = new Date(now);
    dateFrom.setHours(0, 0, 0, 0);

    dateTo = new Date(now);
    dateTo.setHours(23, 59, 59, 999);
  }

  // THIS WEEKEND
  if (dateFilter === "THIS_WEEKEND") {
    const day = now.getDay();

    // Saturday
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + (6 - day));
    saturday.setHours(0, 0, 0, 0);

    // Sunday
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);

    dateFrom = saturday;
    dateTo = sunday;
  }

  // THIS MONTH
  if (dateFilter === "THIS_MONTH") {
    dateFrom = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    dateTo = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
  }
  let genderCapacityFilter = {};

  if (userGender === "MEN") {
    genderCapacityFilter = {
      menCapacity: {
        gt: 0,
      },
    };
  } else if (userGender === "WOMEN") {
    genderCapacityFilter = {
      womenCapacity: {
        gt: 0,
      },
    };
  } else if (
    userGender === "NON_BINARY" ||
    userGender === "TRANS_MAN" ||
    userGender === "TRANS_WOMAN" ||
    userGender === "OTHER" ||
    userGender === "PREFER_NOT_TO_SAY"
  ) {
    genderCapacityFilter = {
      otherCapacity: {
        gt: 0,
      },
    };
  }
  const events = await prisma.event.findMany({
    where: {
      // EXISTING LOGIC
      status: "LIVE",

      // EVENT TYPE FILTER
      ...(eventType && {
        eventType: eventType,
      }),

      // DATE FILTER
      ...(dateFrom &&
        dateTo && {
          eventDate: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),

      // FREE EVENT FILTER
      ...(freeOnly && {
        menDiscountedPrice: 0,
        womenDiscountedPrice: 0,
        otherDiscountedPrice: 0,
      }),
      ...genderCapacityFilter,
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
      const bookingStats = await getEventBookingStats(
        event.id,
        event.totalCapacity
      );

      return {
        ...event,
        ...bookingStats,
      };
    })
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
faqs: {
  orderBy: {
    
  },
  select: {
    id: true,
    question: true,
    answer: true,
   
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
    businessType: true,
    contactPerson: true,
    logo: true,
    city: true,
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





type CheckoutTicketType = "MEN" | "WOMEN" | "OTHER";

const getTicketTypeFromGender = (
  gender: Gender | null,
): CheckoutTicketType => {
  switch (gender) {
    case Gender.MEN:
      return "MEN";

    case Gender.WOMEN:
      return "WOMEN";

    default:
      return "OTHER";
  }
};





export const getEventCheckoutDetails = async (
  eventId: string,
  ticketCount: number = 1,
  ticketType?: "MEN" | "WOMEN" | "OTHER",
  couponCode?: string,
) => {
  // ==========================================
  // 1. GET EVENT
  // ==========================================

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },

    select: {
      id: true,
      title: true,
      eventType: true,
      eventTag: true,
      status: true,

      eventDate: true,
      startTime: true,
      endTime: true,

      venueName: true,
      fullAddress: true,

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
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status !== "LIVE") {
    throw new Error(
      "This event is not available for booking",
    );
  }

  // ==========================================
  // 2. GLOBAL AMOUNT
  // ==========================================

  const globalAmount =
    await prisma.globalAmount.findFirst({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        gst: true,
        eventPlatformFee: true,
      },
    });

  const gstPercentage =
    globalAmount?.gst ??
    new Prisma.Decimal(0);

  const eventPlatformFee =
    globalAmount?.eventPlatformFee ??
    new Prisma.Decimal(0);

  // ==========================================
  // 3. AVAILABLE TICKET OPTIONS
  // ==========================================

  const ticketOptions = [
    {
      ticketType: "MEN" as const,
      label: "Man",

      capacity: event.menCapacity ?? 0,

      entryPrice:
        event.menEntryPrice?.toFixed(2) ??
        "0.00",

      discountedPrice:
        event.menDiscountedPrice?.toFixed(2) ??
        event.menEntryPrice?.toFixed(2) ??
        "0.00",
    },

    {
      ticketType: "WOMEN" as const,
      label: "Woman",

      capacity: event.womenCapacity ?? 0,

      entryPrice:
        event.womenEntryPrice?.toFixed(2) ??
        "0.00",

      discountedPrice:
        event.womenDiscountedPrice?.toFixed(2) ??
        event.womenEntryPrice?.toFixed(2) ??
        "0.00",
    },

    {
      ticketType: "OTHER" as const,
      label: "Other",

      capacity: event.otherCapacity ?? 0,

      entryPrice:
        event.otherEntryPrice?.toFixed(2) ??
        "0.00",

      discountedPrice:
        event.otherDiscountedPrice?.toFixed(2) ??
        event.otherEntryPrice?.toFixed(2) ??
        "0.00",
    },
  ].filter((ticket) => ticket.capacity > 0);

  const availableTicketTypes =
    ticketOptions.map(
      (ticket) => ticket.ticketType,
    );

  // ==========================================
  // 4. DEFAULT / SELECTED TICKET
  // ==========================================

  const selectedTicket =
    ticketType
      ? ticketOptions.find(
          (item) =>
            item.ticketType === ticketType,
        )
      : ticketOptions[0];

  if (!selectedTicket) {
    throw new Error(
      "No ticket type is available for this event",
    );
  }

  // ==========================================
  // 5. VALIDATE TICKET COUNT
  // ==========================================

  if (
    !Number.isInteger(ticketCount) ||
    ticketCount < 1
  ) {
    throw new Error(
      "Ticket count must be at least 1",
    );
  }

  // ==========================================
  // 6. CALCULATE ORIGINAL AMOUNT
  // ==========================================

  const originalUnitPrice =
    new Prisma.Decimal(
      selectedTicket.entryPrice,
    );

  const discountedUnitPrice =
    new Prisma.Decimal(
      selectedTicket.discountedPrice,
    );

  const originalTicketAmount =
    originalUnitPrice.mul(ticketCount);

  // ==========================================
  // 7. TICKET AMOUNT
  // ==========================================

  const ticketAmount =
    discountedUnitPrice.mul(ticketCount);

  // ==========================================
  // 8. DISCOUNT AMOUNT
  // ==========================================

  const discountAmount =
    originalTicketAmount.minus(
      ticketAmount,
    );

  // ==========================================
  // 9. PLATFORM FEE
  // ==========================================

  const platformFee =
    new Prisma.Decimal(
      eventPlatformFee,
    );

  // ==========================================
  // 10. COUPON DISCOUNT
  // ==========================================

  /*
    Later when you create Coupon table,
    calculate actual coupon discount here.

    For now:
  */

  const couponDiscount =
    new Prisma.Decimal(0);

  // ==========================================
  // 11. TAXABLE AMOUNT
  // ==========================================

  const taxableAmount =
    ticketAmount
      .plus(platformFee)
      .minus(couponDiscount);

  // ==========================================
  // 12. GST
  // ==========================================

  const gstAmount =
    taxableAmount
      .mul(gstPercentage)
      .div(100);

  // ==========================================
  // 13. TOTAL AMOUNT
  // ==========================================

  const totalAmount =
    taxableAmount.plus(
      gstAmount,
    );

  // ==========================================
  // 14. RESPONSE
  // ==========================================

  return {
    event: {
      id: event.id,
      title: event.title,

      eventType: event.eventType,
      eventTag: event.eventTag,

      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,

      venueName: event.venueName,
      fullAddress: event.fullAddress,

      totalCapacity: event.totalCapacity,
    },

    pricing: {
      discountPercentage:
        event.discountPercentage?.toFixed(2) ??
        "0.00",

      gstPercentage:
        gstPercentage.toFixed(2),

      eventPlatformFee:
        eventPlatformFee.toFixed(2),
    },

    ticketOptions,

    availableTicketTypes,

    bookingPreview: {
      ticketType:
        selectedTicket.ticketType,

      ticketCount,

      originalTicketAmount:
        originalTicketAmount.toFixed(2),

      ticketAmount:
        ticketAmount.toFixed(2),

      platformFee:
        platformFee.toFixed(2),

      gstAmount:
        gstAmount.toFixed(2),

      discountAmount:
        discountAmount.toFixed(2),

      couponCode:
        couponCode ?? null,

      couponDiscount:
        couponDiscount.toFixed(2),

      totalAmount:
        totalAmount.toFixed(2),
    },
  };
};

type TicketInput = {
  ticketType: "MEN" | "WOMEN" | "OTHER";
  quantity: number;
};

export const calculateEventCheckout = async (
  eventId: string,
  tickets: TicketInput[],
  couponCode?: string,
) => {
  const event =
    await prisma.event.findUnique({
      where: {
        id: eventId,
      },

      select: {
        id: true,
        title: true,

        menCapacity: true,
        womenCapacity: true,
        otherCapacity: true,

        menEntryPrice: true,
        womenEntryPrice: true,
        otherEntryPrice: true,

        menDiscountedPrice: true,
        womenDiscountedPrice: true,
        otherDiscountedPrice: true,

        discountPercentage: true,
      },
    });

  if (!event) {
    throw new Error("Event not found");
  }

  const globalAmount =
    await prisma.globalAmount.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

  const gstPercentage =
    globalAmount?.gst ??
    new Prisma.Decimal(0);

  const platformFee =
    globalAmount?.eventPlatformFee ??
    new Prisma.Decimal(0);

  let originalTicketAmount =
    new Prisma.Decimal(0);

  let ticketAmount =
    new Prisma.Decimal(0);

  let ticketCount = 0;

  const ticketBreakdown = [];

  for (const ticket of tickets) {
    const quantity =
      Number(ticket.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(
        "Invalid ticket quantity",
      );
    }

    let capacity = 0;

    let originalPrice =
      new Prisma.Decimal(0);

    let finalPrice =
      new Prisma.Decimal(0);

    if (ticket.ticketType === "MEN") {
      capacity =
        event.menCapacity ?? 0;

      if (capacity <= 0) {
        throw new Error(
          "Men tickets are not available",
        );
      }

      originalPrice =
        event.menEntryPrice ??
        new Prisma.Decimal(0);

      finalPrice =
        event.menDiscountedPrice ??
        originalPrice;
    }

    if (ticket.ticketType === "WOMEN") {
      capacity =
        event.womenCapacity ?? 0;

      if (capacity <= 0) {
        throw new Error(
          "Women tickets are not available",
        );
      }

      originalPrice =
        event.womenEntryPrice ??
        new Prisma.Decimal(0);

      finalPrice =
        event.womenDiscountedPrice ??
        originalPrice;
    }

    if (ticket.ticketType === "OTHER") {
      capacity =
        event.otherCapacity ?? 0;

      if (capacity <= 0) {
        throw new Error(
          "Other tickets are not available",
        );
      }

      originalPrice =
        event.otherEntryPrice ??
        new Prisma.Decimal(0);

      finalPrice =
        event.otherDiscountedPrice ??
        originalPrice;
    }

    const originalAmount =
      originalPrice.mul(quantity);

    const amount =
      finalPrice.mul(quantity);

    originalTicketAmount =
      originalTicketAmount.plus(
        originalAmount,
      );

    ticketAmount =
      ticketAmount.plus(amount);

    ticketCount += quantity;

    ticketBreakdown.push({
      ticketType:
        ticket.ticketType,

      quantity,

      originalUnitPrice:
        originalPrice.toFixed(2),

      unitPrice:
        finalPrice.toFixed(2),

      originalAmount:
        originalAmount.toFixed(2),

      amount:
        amount.toFixed(2),
    });
  }

  const discountAmount =
    originalTicketAmount.minus(
      ticketAmount,
    );

  // For now
  const couponDiscount =
    couponCode
      ? new Prisma.Decimal(100)
      : new Prisma.Decimal(0);

  const subtotal =
    ticketAmount.plus(
      platformFee,
    );

  const gstAmount =
    subtotal
      .mul(gstPercentage)
      .div(100);

  const totalBeforeCoupon =
    subtotal.plus(
      gstAmount,
    );

  const totalAmount =
    totalBeforeCoupon.minus(
      couponDiscount,
    );

  return {
    eventId,

    ticketCount,

    ticketBreakdown,

    originalTicketAmount:
      originalTicketAmount.toFixed(2),

    ticketAmount:
      ticketAmount.toFixed(2),

    discountAmount:
      discountAmount.toFixed(2),

    platformFee:
      platformFee.toFixed(2),

    gstPercentage:
      gstPercentage.toFixed(2),

    gstAmount:
      gstAmount.toFixed(2),

    couponCode:
      couponCode ?? null,

    couponDiscount:
      couponDiscount.toFixed(2),

    totalAmount:
      totalAmount.toFixed(2),
  };
};