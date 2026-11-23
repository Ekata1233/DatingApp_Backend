import { EventDurationType } from "@prisma/client";

export interface CreateEventCategoryInput {
  label: string;
  value: string;
  eventDurationType: EventDurationType;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateEventCategoryInput {
  label?: string;
  value?: string;
  eventDurationType?: EventDurationType;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface EventCategoryQuery {
  page?: string;
  limit?: string;
  search?: string;
  eventDurationType?: EventDurationType;
  isActive?: string;
}