
import { z } from "zod";
import {
  EventVisibility,
  EventPhotoType,
  EventPriceType,
  VenueType,
  CrowdMix,
  EventIntent,
  EventDressCode,
  EventCancellationPolicy,
  EventSafetyOption,
  TravelType,
  RoomSharing,
  MealType,
  TripLevel,
  TripNightType,
  TripStopTag,
  TripType,
  EventStatus,
   EventDateStatus,
  EventReactiveStatus,
} from "@prisma/client";

// Common validators
const uuid = z.string().uuid();

const text = z.string().trim().min(1);

const optionalText = z.string().trim().nullable().optional();

const dateTime = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const optionalDateTime = dateTime.nullable().optional();

const capacity = z.number().int().min(0).nullable().optional();

const price = z
  .number()
  .finite()
  .min(0)
  .max(99999999.99)
  .nullable()
  .optional();

const percentage = z
  .number()
  .finite()
  .min(0)
  .max(100)
  .nullable()
  .optional();

const stringArray = z.array(z.string().trim());

const sortOrder = z.number().int().min(0);

// Only actual event duration types.
// BOTH is allowed for categories, not events.
export const eventDurationSchema = z.enum([
  "SINGLE_DAY",
  "MULTI_DAY",
]);

// Event Photos
const eventPhotoSchema = z.object({
  photoUrl: z.string().url(),
  fileId: optionalText,
  photoType: z.nativeEnum(EventPhotoType),
  sortOrder,
}).strict();

// Event Dates
const eventDateSchema = z.object({
  startDateTime: dateTime,
  endDateTime: optionalDateTime,
  gateOpensAt: optionalDateTime,
  timezone: z.string().default("Asia/Kolkata"),
  isPrimary: z.boolean().default(false),
  isMoreDate: z.boolean().default(false),
}).strict().superRefine((data, ctx) => {
  if (
    data.endDateTime &&
    data.endDateTime <= data.startDateTime
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["endDateTime"],
      message: "End date must be after start date",
    });
  }

  if (
    data.gateOpensAt &&
    data.gateOpensAt > data.startDateTime
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["gateOpensAt"],
      message: "Gate opening must be before event start",
    });
  }

  try {
    new Intl.DateTimeFormat("en-IN", {
      timeZone: data.timezone,
    });
  } catch {
    ctx.addIssue({
      code: "custom",
      path: ["timezone"],
      message: "Invalid timezone",
    });
  }
});

// Event Venue
const eventVenueSchema = z.object({
  venueName: optionalText,
  fullAddress: optionalText,
  venueType: z.nativeEnum(VenueType).nullable().optional(),
  venueCapacity: capacity,

  whySpecial: optionalText,
  tags: stringArray.optional(),
  photoUrl: optionalText,

  exactMeetingPoint: optionalText,
  distanceFromCity: optionalText,
  landmark: optionalText,
  parking: optionalText,
  publicTransport: optionalText,
  googleMapsLink: optionalText,

  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}).strict();

const eventExperienceSchema = z.object({
  icon: optionalText,
  time: optionalText,
  title: optionalText,
  description: optionalText,
  photoUrl: optionalText,
  tags: stringArray.optional(),
  location: optionalText,
  sortOrder,
}).strict();

// Trip Stop
const tripStopSchema = z.object({
  title: optionalText,
  description: optionalText,
  timeLabel: optionalText,
  icon: optionalText,
  tag: z.nativeEnum(TripStopTag).default("NONE"),
  photoUrl: optionalText,
  sortOrder,
}).strict();

// Trip Game
const tripGameSchema = z.object({
  icon: optionalText,
  name: optionalText,
  howItPlays: optionalText,
  whyItWorks: optionalText,
  sortOrder,
}).strict();

// Trip Day
const tripDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  headline: optionalText,
  photoUrl: optionalText,

  highlightPhotos: stringArray.optional(),

  mealsIncluded: z.array(
    z.nativeEnum(MealType)
  ).optional(),

  level: z.nativeEnum(TripLevel).nullable().optional(),

  nightType: z.nativeEnum(
    TripNightType
  ).nullable().optional(),

  // API-only reference used to connect TripStay
  stayRef: z.string().min(1).nullable().optional(),

  stops: z.array(tripStopSchema).optional(),
  games: z.array(tripGameSchema).optional(),
}).strict();

// Trip Stay
const tripStaySchema = z.object({
  // API-only temporary reference
  clientRef: z.string().min(1),

  stayName: optionalText,
  area: optionalText,
  tagline: optionalText,

  photos: stringArray.optional(),
  amenities: stringArray.optional(),

  checkIn: optionalText,
  checkOut: optionalText,

  address: optionalText,
  contact: optionalText,
}).strict();

// Trip Place
const tripPlaceSchema = z.object({
  icon: optionalText,
  name: optionalText,
  when: optionalText,
  whySpecial: optionalText,
  tags: stringArray.optional(),
  photoUrl: optionalText,
  sortOrder,
}).strict();

// Trip Room Option
const tripRoomOptionSchema = z.object({
  name: optionalText,
  shortNote: optionalText,

  upgradePrice: z.number()
    .min(0)
    .max(9999999999.99)
    .default(0),

  isIncluded: z.boolean().default(false),
  sortOrder,
}).strict();

// Complete Trip Details
const tripDetailsSchema = z.object({
  totalDays: z.number().int().min(2).default(2),

  travelBy: z.nativeEnum(TravelType).nullable().optional(),

  // Pickup
  pickupCity: optionalText,
  pickupPoint: optionalText,
  exactPickupSpot: optionalText,
  pickupMapsLink: optionalText,

  pickupLatitude: z.number()
    .min(-90).max(90).nullable().optional(),

  pickupLongitude: z.number()
    .min(-180).max(180).nullable().optional(),

  // Destination
  destinationPlace: optionalText,
  destinationArea: optionalText,
  journeyThere: optionalText,
  journeyBack: optionalText,
  destinationIcon: optionalText,

  // Drop
  dropCity: optionalText,
  dropPoint: optionalText,

  // Rooms
  roomSharing: z.nativeEnum(RoomSharing).nullable().optional(),
  stayTile: optionalText,
  mealsTile: optionalText,

  // Transport
  vehiclePhotos: stringArray.optional(),

  // Required according to your existing Prisma model
  vehicle: text,

  vehicleOperator: optionalText,
  vehicleModel: optionalText,
  vehicleCapacity: capacity,

  vehicleSpecs: stringArray.optional(),
  onBoard: stringArray.optional(),

  safetyNoteTitle: optionalText,
  safetyNote: optionalText,

  // Nested relations
  days: z.array(tripDaySchema).optional(),
  stays: z.array(tripStaySchema).optional(),
  places: z.array(tripPlaceSchema).optional(),
  roomOptions: z.array(tripRoomOptionSchema).optional(),
}).strict().superRefine((data, ctx) => {
  const refs = (data.stays ?? []).map(
    (stay) => stay.clientRef
  );

  if (new Set(refs).size !== refs.length) {
    ctx.addIssue({
      code: "custom",
      path: ["stays"],
      message: "Duplicate stay references",
    });
  }

  const dayNumbers = (data.days ?? []).map(
    (day) => day.dayNumber
  );

  if (new Set(dayNumbers).size !== dayNumbers.length) {
    ctx.addIssue({
      code: "custom",
      path: ["days"],
      message: "Duplicate trip day numbers",
    });
  }

  for (const day of data.days ?? []) {
    if (day.dayNumber > data.totalDays) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: "Day number exceeds total trip days",
      });
    }

    if (day.stayRef && !refs.includes(day.stayRef)) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: `Invalid stay reference: ${day.stayRef}`,
      });
    }
  }
});

// Event FAQ
const eventFAQSchema = z.object({
  question: optionalText,
  answer: optionalText,
  sortOrder,
}).strict();

// Main Create / Update Event Schema
export const saveEventSchema = z.object({
  // If provided: UPDATE
  // If not provided: CREATE
  eventId: uuid.optional(),

  // Basics
  eventDurationType: eventDurationSchema.optional(),
  tripType: z.nativeEnum(TripType).nullable().optional(),
  categoryId: uuid.nullable().optional(),

  title: optionalText,
  tagline: optionalText,
  about: optionalText,

  visibility: z.nativeEnum(
    EventVisibility
  ).nullable().optional(),

  // Photos
  photos: z.array(eventPhotoSchema).optional(),
  highlightsCaption: optionalText,

  // Dates
  dates: z.array(eventDateSchema).optional(),

  // Single-day relations
  venue: eventVenueSchema.nullable().optional(),
  experienceSubtitle: optionalText,
  experience: z.array(eventExperienceSchema).optional(),

  // Multi-day relations
  tripDetails: tripDetailsSchema.nullable().optional(),

  // Pricing
  priceType: z.nativeEnum(EventPriceType).optional(),
  totalCapacity: capacity,

  // Individual pricing
  menCapacity: capacity,
  womenCapacity: capacity,
  otherCapacity: capacity,

  menEntryPrice: price,
  womenEntryPrice: price,
  otherEntryPrice: price,

  menDiscountPercentage: percentage,
  womenDiscountPercentage: percentage,
  otherDiscountPercentage: percentage,

  // Couple pricing
  coupleCapacity: capacity,
  coupleEntryPrice: price,
  coupleDiscountPercentage: percentage,

  // Booking restrictions
  maxTicketsPerPerson: z.number().int().min(1).optional(),
  waitlistEnabled: z.boolean().optional(),

  // Crowd
  crowdMix: z.nativeEnum(CrowdMix).nullable().optional(),

  minAge: z.number().int().min(18).max(100).nullable().optional(),
  maxAge: z.number().int().min(18).max(100).nullable().optional(),

  groupSize: capacity,

  intent: z.nativeEnum(EventIntent).nullable().optional(),

  // Included and packing
  included: stringArray.optional(),
  notIncluded: stringArray.optional(),
  whatToBring: stringArray.optional(),

  dressCode: z.nativeEnum(EventDressCode).optional(),

  // Group chat
  groupChatTitle: optionalText,
  groupChatDescription: optionalText,
  groupChatOpensAt: optionalDateTime,

  // Reminders
  reminderTitle: optionalText,
  reminderDescription: optionalText,
  reminderTimes: z.array(dateTime).optional(),

  // Host
  hostId: uuid.nullable().optional(),
  hostPhotoUrl: optionalText,
  hostTitle: optionalText,
  hostSpeciality: optionalText,
  hostLanguages: stringArray.optional(),
  hostMessage: optionalText,
  afterEventLine: optionalText,

  // Cancellation
  cancellationPolicy: z.nativeEnum(
    EventCancellationPolicy
  ).nullable().optional(),

  cancellationDescription: optionalText,
  refundPolicy: optionalText,
  reschedulingPolicy: optionalText,

  // Rules and Safety
  rules: stringArray.optional(),

  safetyOptions: z.array(
    z.nativeEnum(EventSafetyOption)
  ).optional(),

  // FAQs
  faqs: z.array(eventFAQSchema).optional(),

  // Draft progress
  currentStep: z.number().int().min(1).optional(),

  completedSteps: z.array(
    z.number().int().min(1)
  ).optional(),

}).strict();

// GET all events query validation
// GET all events query validation
export const getEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number()
    .int().min(1).max(100).default(20),

  eventDurationType: eventDurationSchema.optional(),

  tripType: z.nativeEnum(TripType).optional(),

  categoryId: uuid.optional(),

  // Event status filter
  status: z.nativeEnum(EventStatus).optional(),

  // Event date status filter - NEW
  eventDateStatus: z.nativeEnum(EventDateStatus).optional(),

  eventReactiveStatus: z
    .nativeEnum(EventReactiveStatus)
    .optional(),

  search: z.string().trim().optional(),
}).strict();

export const eventIdSchema = uuid;


// ======================================================
// PAUSE EVENT VALIDATION
// ======================================================

export const pauseEventSchema = z.object({
  pauseReason: z
    .string()
    .trim()
    .min(1, "Pause reason is required")
    .max(1000, "Pause reason cannot exceed 1000 characters"),
}).strict();

// ======================================================
// COMPLETE EVENT VALIDATION
// ======================================================

export const completeEventSchema = z.object({
  eventDateId: z
    .string()
    .uuid("Invalid event date ID"),
}).strict();