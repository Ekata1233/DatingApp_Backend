export type GuestListType =
  | "all"
  | "checked_in"
  | "not_arrived"
  | "cancelled";

export type GuestAttendanceStatus =
  | "CHECKED_IN"
  | "NOT_ARRIVED"
  | "CANCELLED"
  | "NO_SHOW";

export interface GetGuestListParams {
  businessId: string;
  eventId: string;
  eventDateId: string;
  type: GuestListType;
  search?: string;
  page: number;
  limit: number;
}

export interface GuestListCounts {
  all: number;
  booked: number;
  checkedIn: number;
  notArrived: number;
  cancelled: number;
  noShow: number;
}

export interface GuestListItem {
  id: string;
  userId: string | null;
  bookingId: string;
  bookingNumber: string;
  bookingTicketId: string;
  ticketId: string;
  ticketType: string;

  fullName: string;
  age: number | null;
  gender: string | null;
  initials: string;

  bookedAt: Date;
  bookedLabel: string;

  status: GuestAttendanceStatus;

  isPrimaryGuest: boolean;
  isCheckedIn: boolean;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;

  canCheckIn: boolean;
}