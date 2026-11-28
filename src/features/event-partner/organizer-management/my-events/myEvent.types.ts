import {
  EventDurationType,
  EventStatus,
  EventDateStatus,
  EventReactiveStatus,
  TripType,
} from "@prisma/client";

export type OrganizerEventListType =
  | "all"
  | "upcoming"
  | "in_review"
  | "drafts"
  | "past"
  | "on_sale"
  | "rejected"
  | "paused"
  | "approved";

export type OrganizerEventCardType =
  | "EVENT"
  | "EVENT_DATE"
  | "REACTIVATION";

export type OrganizerEventDisplayStatus =
  | "TODAY"
  | "ONGOING"
  | "ON_SALE"
  | "SOLD_OUT"
  | "BOOKING_CLOSED"
  | "UPCOMING"
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export interface GetAllOrganizerEventsParams {
  businessId: string;

  type: OrganizerEventListType;

  search?: string;

  eventDurationType?: EventDurationType;
  tripType?: TripType;
  categoryId?: string;

  status?: EventStatus;
  eventReactiveStatus?: EventReactiveStatus;
  eventDateStatus?: EventDateStatus;

  page: number;
  limit: number;
}

export interface OrganizerEventCounts {
  all: number;
  upcoming: number;
  inReview: number;
  drafts: number;
  past: number;
  onSale: number;
  rejected: number;
  paused: number;
  approved: number;
}

export interface OrganizerEventListItem {
  id: string;

  cardId: string;
  cardType: OrganizerEventCardType;

  eventDateId: string | null;
  reactivationId: string | null;

  title: string | null;
  tagline: string | null;

  photoUrl: string | null;

  eventDurationType: EventDurationType | null;
  tripType: TripType | null;

  status: EventStatus;
  eventDateStatus: EventDateStatus | null;
  eventReactiveStatus: EventReactiveStatus | null;

  displayStatus: OrganizerEventDisplayStatus;
  statusLabel: string;

  categoryId: string | null;

  startDateTime: Date | null;
  endDateTime: Date | null;
  gateOpensAt: Date | null;

  timezone: string;
  dateLabel: string | null;

  totalDays: number | null;
  totalNights: number | null;
  durationLabel: string | null;

  venueName: string | null;
  locationLabel: string | null;

  totalCapacity: number | null;
  bookedGuests: number;
  remainingCapacity: number | null;

  soldPercentage: number | null;
  soldLabel: string;

  grossTicketSales: string;
  currency: "INR";

  isToday: boolean;
  isOngoing: boolean;
  isOnSale: boolean;
  isReactivated: boolean;

  currentStep: number;
  completedSteps: number[];

  createdAt: Date;
  updatedAt: Date;
}


