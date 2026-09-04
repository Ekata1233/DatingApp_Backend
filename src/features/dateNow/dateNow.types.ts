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

export interface UpdateDatePlanActivityDTO {
  activityId: string;
}

export interface UpdateDatePlanActivityResponse {
  id: string;
  activityId: string;
  activity: {
    id: string;
    type: string;
    label: string;
    value: string;
    icon: string | null;
  };
  updatedAt: Date;
}

export interface RequestToJoinDatePlanInput {
  message?: string;
  billSuggestionId?: string;
}