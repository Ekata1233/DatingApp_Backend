
import { z } from "zod";

import {
  saveEventSchema,
  getEventsQuerySchema,
} from "./event.validation";

export type SaveEventInput = z.infer<
  typeof saveEventSchema
>;

export type GetEventsQuery = z.infer<
  typeof getEventsQuerySchema
>;

export type EventDuration =
  | "SINGLE_DAY"
  | "MULTI_DAY";

export type EventFormat =
  | "SINGLE_DAY"
  | "GROUP_TRIP"
  | "COUPLES_TRIP";

export type TripDetailsInput = NonNullable<
  SaveEventInput["tripDetails"]
>;

export interface OrganizerContext {
  id: string;
  role: string;
  businessId: string;
}

export class EventServiceError extends Error {
  public statusCode: number;

  constructor(
    message: string,
    statusCode: number = 400
  ) {
    super(message);

    this.name = "EventServiceError";
    this.statusCode = statusCode;
  }
}
