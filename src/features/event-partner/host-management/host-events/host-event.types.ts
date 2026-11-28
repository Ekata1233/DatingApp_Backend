import {
  EventDurationType,
  EventStatus,
  EventDateStatus,
  TripType,
} from "@prisma/client";

export type HostEventListType =
  | "all"
  | "ongoing"
  | "upcoming"
  | "past";

export type HostEventGroup =
  | "ongoing"
  | "upcoming"
  | "past";

export type HostEventDisplayStatus =
  | "TODAY"
  | "ONGOING"
  | "ON_SALE"
  | "UPCOMING"
  | "SOLD_OUT"
  | "BOOKING_CLOSED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "PAUSED";

export interface GetHostEventsParams {
  partnerId: string;
  businessId: string;

  type: HostEventListType;
  search?: string;

  eventDurationType?: EventDurationType;

  page: number;
  limit: number;
}

export interface HostEventPermissions {
  canViewGuestList: boolean;
  canCheckInGuests: boolean;
  canUpdateRunSheetProgress: boolean;
  canViewRoomList: boolean;
  canReportIncidentSOS: boolean;
  canMessageGuests: boolean;
  canReplyToReviews: boolean;
  canCreateSubmitEvent: boolean;
  canEditEvent: boolean;
  canCancelEventRefund: boolean;
  canManagePayouts: boolean;
}

export interface HostEventCounts {
  ongoing: number;
  upcoming: number;
  past: number;
  total: number;
}

export interface HostEventListItem {
  id: string;
  cardId: string;

  eventDateId: string;
  reactivationId: string | null;

  title: string | null;
  tagline: string | null;
  photoUrl: string | null;

  eventDurationType: EventDurationType | null;
  tripType: TripType | null;

  status: EventStatus;
  eventDateStatus: EventDateStatus;

  displayStatus: HostEventDisplayStatus;
  statusLabel: string;

  assignmentLabel: string;
  isPrimaryHost: boolean;

  startDateTime: Date;
  endDateTime: Date | null;
  gateOpensAt: Date | null;

  timezone: string;
  dateLabel: string;

  totalDays: number | null;
  totalNights: number | null;
  durationLabel: string | null;

  venueName: string | null;
  locationLabel: string | null;

  bookedGuests: number;
  guestLabel: string;

  daysUntilEvent: number;
  relativeDateLabel: string;

  isToday: boolean;
  isOngoing: boolean;
  isOnSale: boolean;
  isReactivated: boolean;
}

export interface HostEventCard {
  group: HostEventGroup;
  item: HostEventListItem;
}