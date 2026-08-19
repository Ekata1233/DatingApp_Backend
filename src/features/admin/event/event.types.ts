import { EventStatus, Type } from "@prisma/client";

export interface CreateEventInput {
  eventType: Type;
  title: string;
  status: EventStatus;
}
export interface UpdateEventHostInput {
  city: string;
  eventPartnerId: string;
  officialPartner?: boolean;
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
  entryPrice: number;
  capacity: number;
  minAge: number;
  maxAge: number;
  genderMix: "FIFTY_FIFTY" | "WOMEN_LED" | "MEN_LED" | "OPEN";
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
  time: string;
  title: string;
  description?: string;
  icon?: string;
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
}