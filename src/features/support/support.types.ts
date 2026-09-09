import { CallbackStatus } from "@prisma/client";

export interface CreateCallbackDto {
  callbackDate: string;
  timeWindow: string;
  topic?: string;
}

export interface UpdateCallbackStatusDto {
  status: CallbackStatus;
  agentName?: string;
  callDuration?: number;
  resolutionNote?: string;
}

export interface CreateFaqDto {
  question: string;
  answer: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateFaqDto {
  question?: string;
  answer?: string;
  isActive?: boolean;
  sortOrder?: number;
}