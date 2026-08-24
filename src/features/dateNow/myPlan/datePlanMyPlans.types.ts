import { DatePlanAttendanceStatus } from "@prisma/client";

export interface SubmitAttendanceInput {
  userId: string;
  planId: string;
  attendanceStatus: DatePlanAttendanceStatus;
}

export interface GetMyPlansParams {
  userId: string;
  period?: "TODAY" | "TOMORROW" | "WEEKEND";
  activity?: string;
  page: number;
  limit: number;
}

export interface UpdateMetUserInput {
  userId: string;
  planId: string;
  metUserId: string;
}

export interface SubmitExperienceFeedbackInput {
  userId: string;
  planId: string;
  overallRating: number;
  personRating: number;
  experienceTags?: (
    | "RESPECTFUL"
    | "GREAT_CONVERSATION"
    | "ON_TIME"
    | "GENUINE"
    | "FUN"
    | "WOULD_MEET_AGAIN"
  )[];
  comment?: string;
}

export interface SubmitNoShowFeedbackInput {
  userId: string;
  planId: string;
  overallRating: number;
  noShowReason?: 
    | "TIMING_WAS_OFF"
    | "VENUE_TOO_FAR"
    | "SHORT_NOTICE"
    | "APPROVED_TOO_LATE"
    | "NOT_SURE";
}

export interface SubmitDatePlanReportInput {
  userId: string;
  planId: string;
  reason:
    | "DID_NOT_SHOW_AS_DESCRIBED"
    | "MADE_ME_UNCOMFORTABLE"
    | "INAPPROPRIATE_BEHAVIOUR"
    | "FAKE_PROFILE"
    | "SAFETY_CONCERN";
  comment?: string;
}