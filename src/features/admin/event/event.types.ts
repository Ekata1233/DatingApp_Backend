import { EventStatus, Type } from "@prisma/client";


export interface EventFeatureTagInput {
  label: string;
  displayOrder?: number;
}

export interface CreateEventInput {
  eventType: Type;
  title: string;
  status: EventStatus;
  featureTags?: EventFeatureTagInput[];
}
export interface UpdateEventHostInput {
  city: string;
  eventPartnerId: string;
  eventTag?: "BRAND" | "PROMOTED" | "FEATURED"| null;
}
export interface UpdateEventVenueInput {
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}
export interface UpdateEventTicketsInput {
  totalCapacity: number;

  menCapacity: number;
  womenCapacity: number;
  otherCapacity: number;

  menEntryPrice: number;
  womenEntryPrice: number;
  otherEntryPrice: number;

  discountPercentage: number;

  minAge: number;
  maxAge: number;

  eventIntent: "MIXED" | "SERIOUS" | "CASUAL";
}

export interface EventGalleryInput {
  imageUrl: string;
  sortOrder?: number;
}

export interface EventAmenityInput {
  name: string;
  icon?: string;
  sortOrder?: number;
}

export interface EventItineraryInput {
  date?: string;
  dayNumber?: number;

  time: string;
  title: string;
  description?: string;
  icon?: string;

  location?: string;
  elevation?: string;
  distance?: string;

  accommodation?: string;
  meals?: string;

  sortOrder?: number;
}

export interface EventWhyComeInput {
  title: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateEventExperienceInput {
  heroImage?: string;
  aboutEvent?: string;

  galleryImages: EventGalleryInput[];

  amenities: EventAmenityInput[];

  itinerary: EventItineraryInput[];

  whyShouldCome: EventWhyComeInput[];
}
export interface EventSafetyInput {
  title: string;
}

export interface EventFAQInput {
  question: string;
  answer: string;
  displayOrder?: number;
}

export interface UpdateEventSafetyInput {
  safetyFeatures: EventSafetyInput[];

  dressCode?:
    | "CASUAL"
    | "SMART_CASUAL"
    | "SEMI_FORMAL"
    | "FORMAL"
    | "COCKTAIL"
    | "TRADITIONAL";

  refundWindow?: number;
  termsConditions?: string;

  faqs?: EventFAQInput[];
}