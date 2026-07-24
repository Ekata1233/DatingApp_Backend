import { EventStatus, Type } from "@prisma/client";

export interface CreateEventInput {
  eventType: Type;
  title: string;
  status: EventStatus;
}