import { z } from "zod";

export const createEventSchema = z.object({
  body: z.object({
    eventType: z.enum([
      "SIGNATURE_MIXER",
      "SPEED_DATING",
      "WINE_TASTING",
      "SUPPER_CLUB",
      "BRUNCH_SOCIAL",
      "ROOFTOP_MIXER",
    ]),

    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),

    status: z.enum([
      "DRAFT",
      "LIVE",
      "SOLD_OUT",
      "CANCELLED",
    ])
    .nullable()
    .optional(),

    featureTags: z
      .array(
        z.object({
          label: z
            .string()
            .trim()
            .min(1, "Feature tag is required")
            .max(100, "Feature tag cannot exceed 100 characters"),

          displayOrder: z
            .number()
            .int()
            .min(0)
            .optional(),
        })
      )
      .optional(),
  }),
});


export const updateEventHostSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid event ID"),
  }),

  body: z.object({
    city: z
      .string()
      .trim()
      .min(2, "City is required")
      .max(100, "City cannot exceed 100 characters"),

    eventPartnerId: z
      .string()
      .uuid("Invalid event partner ID"),

   eventTag: z
  .enum([
    "BRAND",
    "PROMOTED",
    "FEATURED",
  ])
  .nullable()
  .optional(),
  }),
});


export const updateEventVenueSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid event ID"),
  }),

  body: z.object({
    eventDate: z
      .string()
      .min(1, "Event date is required"),

    startTime: z
      .string()
      .regex(
        /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        "Start time must be in HH:mm format"
      ),

    endTime: z
      .string()
      .regex(
        /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        "End time must be in HH:mm format"
      ),

    venueName: z
      .string()
      .trim()
      .min(2, "Venue name is required")
      .max(200),

    fullAddress: z
      .string()
      .trim()
      .min(5, "Full address is required")
      .max(1000),

    latitude: z
      .number()
      .min(-90)
      .max(90),

    longitude: z
      .number()
      .min(-180)
      .max(180),
  }),
});


export const updateEventTicketsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid event ID"),
  }),

  body: z
    .object({
      totalCapacity: z
        .number()
        .int("Total capacity must be an integer")
        .min(1, "Total capacity must be at least 1"),

      menCapacity: z
        .number()
        .int("Men capacity must be an integer")
        .min(0, "Men capacity cannot be negative"),

      womenCapacity: z
        .number()
        .int("Women capacity must be an integer")
        .min(0, "Women capacity cannot be negative"),

      otherCapacity: z
        .number()
        .int("Other capacity must be an integer")
        .min(0, "Other capacity cannot be negative"),

      menEntryPrice: z
        .number()
        .min(0, "Men entry price cannot be negative"),

      womenEntryPrice: z
        .number()
        .min(0, "Women entry price cannot be negative"),

      otherEntryPrice: z
        .number()
        .min(0, "Other entry price cannot be negative"),

      discountPercentage: z
        .number()
        .min(0)
        .max(100),

      minAge: z
        .number()
        .int("Minimum age must be an integer")
        .min(18, "Minimum age must be at least 18")
        .max(100),

      maxAge: z
        .number()
        .int("Maximum age must be an integer")
        .min(18)
        .max(100),

      eventIntent: z.enum([
        "MIXED",
        "SERIOUS",
        "CASUAL",
      ]),
    })
    .refine(
      (data) =>
        data.menCapacity +
          data.womenCapacity +
          data.otherCapacity ===
        data.totalCapacity,
      {
        message:
          "Total capacity must equal men capacity + women capacity + other capacity",
        path: ["totalCapacity"],
      }
    )
    .refine(
      (data) => data.maxAge >= data.minAge,
      {
        message:
          "Maximum age must be greater than or equal to minimum age",
        path: ["maxAge"],
      }
    ),
});

export const updateEventExperienceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid event ID"),
  }),

  body: z.object({
    aboutEvent: z
      .string()
      .trim()
      .max(5000, "About event cannot exceed 5000 characters")
      .optional(),

    amenities: z.array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Amenity name is required")
          .max(100),

        icon: z.string().max(100).optional(),

        sortOrder: z
          .number()
          .int()
          .min(0)
          .optional(),
      })
    ),

   itinerary: z.array(
  z.object({
    date: z
      .string()
      .trim()
      .max(50)
      .optional(),

    dayNumber: z
      .number()
      .int("Day number must be an integer")
      .min(1)
      .optional(),

    time: z
      .string()
      .min(1, "Time is required"),

    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200),

    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    icon: z
      .string()
      .max(100)
      .optional(),

    location: z
      .string()
      .trim()
      .max(300)
      .optional(),

    elevation: z
      .string()
      .trim()
      .max(100)
      .optional(),

    distance: z
      .string()
      .trim()
      .max(100)
      .optional(),

    accommodation: z
      .string()
      .trim()
      .max(200)
      .optional(),

    meals: z
      .string()
      .trim()
      .max(200)
      .optional(),

    sortOrder: z
      .number()
      .int()
      .min(0)
      .optional(),
  })
),

    whyShouldCome: z.array(
      z.object({
        title: z
          .string()
          .trim()
          .min(1, "Title is required")
          .max(200),

        description: z
          .string()
          .trim()
          .max(1000)
          .optional(),

        icon: z.string().max(100).optional(),

        sortOrder: z
          .number()
          .int()
          .min(0)
          .optional(),
      })
    ),
    
  }),
});

export const updateEventSafetySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid event ID"),
  }),

  body: z.object({
    safetyFeatures: z
      .array(
        z.object({
          title: z
            .string()
            .trim()
            .min(1, "Safety feature title is required")
            .max(200, "Safety feature title is too long"),
        })
      )
      .min(1, "At least one safety feature is required"),

    dressCode: z
      .enum([
        "CASUAL",
        "SMART_CASUAL",
        "SEMI_FORMAL",
        "FORMAL",
        "COCKTAIL",
        "TRADITIONAL",
      ])
      .optional(),

    refundWindow: z
      .number()
      .int("Refund window must be an integer")
      .min(0, "Refund window cannot be negative")
      .optional(),

    termsConditions: z
      .string()
      .trim()
      .max(
        10000,
        "Terms and conditions cannot exceed 10000 characters"
      )
      .optional(),
      faqs: z
  .array(
    z.object({
      question: z
        .string()
        .trim()
        .min(1, "FAQ question is required")
        .max(500, "FAQ question cannot exceed 500 characters"),

      answer: z
        .string()
        .trim()
        .min(1, "FAQ answer is required")
        .max(5000, "FAQ answer cannot exceed 5000 characters"),

      displayOrder: z
        .number()
        .int()
        .min(0)
        .optional(),
    })
  )
  .optional(),
  }),
});

export const publishEventSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid event ID"),
  }),
});

export const getEventListSchema = z.object({
  query: z.object({
    eventType: z
      .enum([
        "ALL",
        "SINGLES_MIXER",
        "SPEED_DATES",
        "SINGLES_NIGHT",
        "DINNER_DATES",
        "LEARN_AND_MATCH",
        "PLAY_AND_MATCH",
        "FIT_DATES",
        "TREK_DATES",
        "THE_RESERVE",
        "PROFESSIONALS_MEET",
        "MATCHED_FOR_YOU",
      ])
      .optional(),

    dateFilter: z
      .enum([
        "TODAY",
        "THIS_WEEKEND",
        "THIS_MONTH",
      ])
      .optional(),

    freeOnly: z
      .enum(["true", "false"])
      .optional(),
  }),
});