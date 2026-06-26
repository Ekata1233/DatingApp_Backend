// Date Now Types
import { PlanStatus } from "@prisma/client";

export interface CreateDraftDatePlanInput {
  title?: string;
}

export interface UpdateDatePlanInput {
  activityId?: string;

  title?: string;

  note?: string;

  photoUrl?: string;

  venueName?: string;

  venueAddress?: string;

  venueLat?: number;

  venueLng?: number;

  eventDate?: string; 

  eventTime?: string;

  duration?: string;

  whoPaysId?: string;

  participantLimit?: number;

  joinRequestGenderId?: string;

  visibilityId?: string;

  vibeIds?: string[];

  status?: PlanStatus;
}