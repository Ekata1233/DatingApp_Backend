import { HostGender, HostStatus } from "@prisma/client";

export interface HostPermissions {
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

export interface InviteHostInput {
  fullName: string;
  phoneNumber: string;
  email?: string;
  gender?: HostGender;
  languages?: string[];
  permissions?: Partial<HostPermissions>;
}

export interface UpdateHostPermissionsInput {
  canViewGuestList?: boolean;
  canCheckInGuests?: boolean;
  canUpdateRunSheetProgress?: boolean;
  canViewRoomList?: boolean;
  canMessageGuests?: boolean;
  canReplyToReviews?: boolean;
  canCreateSubmitEvent?: boolean;
  canEditEvent?: boolean;
  canCancelEventRefund?: boolean;
  canManagePayouts?: boolean;
}

export interface GetHostsInput {
  page: number;
  limit: number;
  search?: string;
  status?: HostStatus;
}
