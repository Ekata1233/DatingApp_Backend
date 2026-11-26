import { z } from "zod";

import {
  EventVisibility,
  PackageType,
} from "@prisma/client";

import {
  getUserEventsQuerySchema,
} from "./userEvent.validation";

export type GetUserEventsQuery = z.infer<
  typeof getUserEventsQuerySchema
>;

export type UserMembershipType =
  | PackageType
  | "FREE";

export interface UserEventMembership {
  packageType: UserMembershipType;
  visibility: EventVisibility;
}

export class UserEventServiceError extends Error {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 400
  ) {
    super(message);

    this.name = "UserEventServiceError";
    this.statusCode = statusCode;
  }
}