export interface HostInvitationLookupInput {
  phoneNumber: string;
}

export interface HostInvitationCard {
  hostId: string;
  isInvitationAccepted: boolean;
  businessId: string;

  organizationName: string;
  organizerName: string | null;

  city: string | null;
  logoUrl: string | null;
  initial: string;

  role: "CO_HOST";
  roleLabel: string;
}

export interface HostInvitationLookupResponse {
  invitations: HostInvitationCard[];
  totalInvitations: number;
}
