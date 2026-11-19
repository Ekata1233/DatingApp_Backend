import crypto from "crypto";

import {
  Prisma,
  HostStatus,
  HostStep,
  BusinessStatus,
  PartnerStatus,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

import {
  InviteHostInput,
  UpdateHostPermissionsInput,
  GetHostsInput,
} from "./host.types";

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

const INVITATION_VALIDITY_DAYS = 7;

const DEFAULT_PERMISSIONS = {
  canViewGuestList: true,
  canCheckInGuests: true,
  canUpdateRunSheetProgress: true,
  canViewRoomList: true,
  canReportIncidentSOS: true,
  canMessageGuests: true,
  canReplyToReviews: false,

  canCreateSubmitEvent: false,
  canEditEvent: false,
  canCancelEventRefund: false,
  canManagePayouts: false,
};

/* -------------------------------------------------------------------------- */
/*                               SERVICE ERROR                                */
/* -------------------------------------------------------------------------- */

export class HostServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HostServiceError";
  }
}

/* -------------------------------------------------------------------------- */
/*                                HOST SELECT                                 */
/* -------------------------------------------------------------------------- */

const hostSelect = {
  id: true,
  businessId: true,
  partnerId: true,

  fullName: true,
  phoneNumber: true,
  email: true,
  gender: true,
  languages: true,

  status: true,
  invitedAt: true,
  invitationExpiresAt: true,
  acceptedAt: true,
  declinedAt: true,

  canViewGuestList: true,
  canCheckInGuests: true,
  canUpdateRunSheetProgress: true,
  canViewRoomList: true,
  canReportIncidentSOS: true,
  canMessageGuests: true,
  canReplyToReviews: true,

  canCreateSubmitEvent: true,
  canEditEvent: true,
  canCancelEventRefund: true,
  canManagePayouts: true,

  onboardingStep: true,
  onboardingCompleted: true,

  joinedAt: true,
  pausedAt: true,
  removedAt: true,

  createdAt: true,
  updatedAt: true,
} satisfies Prisma.HostSelect;

/* -------------------------------------------------------------------------- */
/*                            VALIDATE BUSINESS                               */
/* -------------------------------------------------------------------------- */

const validateBusiness = async (
  partnerId: string,
  businessId: string,
) => {
  const business = await prisma.businessDetails.findFirst({
    where: {
      id: businessId,
      partnerId,

      partner: {
        accountStatus: PartnerStatus.ACTIVE,
      },
    },

    select: {
      id: true,
      brandName: true,
      legalName: true,
      status: true,
      onboardingCompleted: true,

      partner: {
        select: {
          phoneNumber: true,
        },
      },
    },
  });

  if (!business) {
    throw new HostServiceError(
      404,
      "Business not found or access denied",
    );
  }

  if (
    business.status !== BusinessStatus.ACTIVE ||
    !business.onboardingCompleted
  ) {
    throw new HostServiceError(
      403,
      "Complete business onboarding before managing hosts",
    );
  }

  return business;
};

/* -------------------------------------------------------------------------- */
/*                             GENERATE INVITATION                            */
/* -------------------------------------------------------------------------- */

const generateInvitation = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(
    Date.now() +
      INVITATION_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
  );

  const baseUrl = process.env.HOST_INVITATION_BASE_URL;

  if (!baseUrl) {
    throw new HostServiceError(
      500,
      "Host invitation URL is not configured",
    );
  }

  const invitationUrl = new URL(baseUrl);

  invitationUrl.searchParams.set("token", token);

  return {
    tokenHash,
    expiresAt,
    invitationLink: invitationUrl.toString(),
  };
};

/* -------------------------------------------------------------------------- */
/*                             EXPIRE INVITATIONS                             */
/* -------------------------------------------------------------------------- */

const expireInvitations = async (businessId: string) => {
  await prisma.host.updateMany({
    where: {
      businessId,
      status: HostStatus.INVITED,
      invitationExpiresAt: {
        lte: new Date(),
      },
    },

    data: {
      status: HostStatus.EXPIRED,
      invitationTokenHash: null,
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                              FIND OWNED HOST                               */
/* -------------------------------------------------------------------------- */

const findOwnedHost = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  await validateBusiness(partnerId, businessId);

  await expireInvitations(businessId);

  const host = await prisma.host.findFirst({
    where: {
      id: hostId,
      businessId,

      business: {
        partnerId,
      },
    },
  });

  if (!host) {
    throw new HostServiceError(404, "Host not found");
  }

  return host;
};

/* -------------------------------------------------------------------------- */
/*                               GET PERMISSIONS                              */
/* -------------------------------------------------------------------------- */

export const getHostPermissionsService = () => {
  return {
    role: "CO_HOST",

    title: "Co-host",

    description:
      "Runs assigned events without access to money or event settings.",

    permissions: [
      {
        key: "canViewGuestList",
        title: "See the guest list",
        description: "First name, age and ticket ID only",
        enabled: true,
        editable: true,
      },
      {
        key: "canCheckInGuests",
        title: "Check guests in",
        description: "Scan tickets and mark guest arrivals",
        enabled: true,
        editable: true,
      },
      {
        key: "canUpdateRunSheetProgress",
        title: "Run sheet & itinerary",
        description: "View the plan and mark each step done",
        enabled: true,
        editable: true,
      },
      {
        key: "canViewRoomList",
        title: "Stay & room list",
        description: "View guest room and tent assignments",
        enabled: true,
        editable: true,
      },
      {
        key: "canReportIncidentSOS",
        title: "Report incidents & SOS",
        description: "Always enabled for guest safety",
        enabled: true,
        editable: false,
      },
      {
        key: "canMessageGuests",
        title: "Message guests",
        description: "Event chat and guest updates",
        enabled: true,
        editable: true,
      },
      {
        key: "canReplyToReviews",
        title: "Reply to reviews",
        description: "Public replies under the business brand",
        enabled: false,
        editable: true,
      },
      {
        key: "canCreateSubmitEvent",
        title: "Create & submit events",
        enabled: false,
        editable: false,
        ownerOnly: true,
      },
      {
        key: "canEditEvent",
        title: "Edit event details & itinerary",
        enabled: false,
        editable: false,
        ownerOnly: true,
      },
      {
        key: "canCancelEventRefund",
        title: "Cancel events & refunds",
        enabled: false,
        editable: false,
        ownerOnly: true,
      },
      {
        key: "canManagePayouts",
        title: "Payouts, bank & invoices",
        enabled: false,
        editable: false,
        ownerOnly: true,
      },
    ],

    enabledPermissionsCount: 6,
  };
};

/* -------------------------------------------------------------------------- */
/*                                 INVITE HOST                                */
/* -------------------------------------------------------------------------- */

export const inviteHostService = async (
  partnerId: string,
  businessId: string,
  payload: InviteHostInput,
) => {
  const business = await validateBusiness(
    partnerId,
    businessId,
  );

  // Owner cannot add themselves as a co-host
  if (business.partner.phoneNumber === payload.phoneNumber) {
    throw new HostServiceError(
      400,
      "You cannot invite yourself as a co-host",
    );
  }

  await expireInvitations(businessId);

  const existingHost = await prisma.host.findUnique({
    where: {
      businessId_phoneNumber: {
        businessId,
        phoneNumber: payload.phoneNumber,
      },
    },
  });

  if (existingHost) {
    throw new HostServiceError(
      409,
      existingHost.status === HostStatus.REMOVED
        ? "This host was previously removed"
        : "A host with this mobile number already exists",
    );
  }

  const invitation = generateInvitation();

  const permissions = {
    ...DEFAULT_PERMISSIONS,
    ...payload.permissions,

    // Always enabled
    canReportIncidentSOS: true,

    // Owner-only permissions
    canCreateSubmitEvent: false,
    canEditEvent: false,
    canCancelEventRefund: false,
    canManagePayouts: false,
  };

  const host = await prisma.host.create({
    data: {
      businessId,

      // Linked only after host phone verification
      partnerId: null,

      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber,
      email: payload.email ?? null,
      gender: payload.gender ?? null,
      languages: payload.languages ?? [],

      invitationTokenHash: invitation.tokenHash,
      invitationExpiresAt: invitation.expiresAt,
      invitedAt: new Date(),

      ...permissions,

      status: HostStatus.INVITED,
      onboardingStep: HostStep.INVITE_ACCEPTANCE,
      onboardingCompleted: false,
    },

    select: hostSelect,
  });

  return {
    host,

    role: "CO_HOST",

    businessName:
      business.brandName || business.legalName,

    invitationLink: invitation.invitationLink,

    invitationExpiresAt: invitation.expiresAt,

    deliveryStatus: "NOT_SENT",
  };
};

/* -------------------------------------------------------------------------- */
/*                                  GET HOSTS                                 */
/* -------------------------------------------------------------------------- */

export const getHostsService = async (
  partnerId: string,
  businessId: string,
  filters: GetHostsInput,
) => {
  await validateBusiness(partnerId, businessId);

  await expireInvitations(businessId);

  const { page, limit, search, status } = filters;

  const where: Prisma.HostWhereInput = {
    businessId,

    business: {
      partnerId,
    },

    status: status ?? {
      not: HostStatus.REMOVED,
    },

    ...(search && {
      OR: [
        {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phoneNumber: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [hosts, total] = await prisma.$transaction([
    prisma.host.findMany({
      where,

      select: {
        ...hostSelect,

        _count: {
          select: {
            assignedEvents: true,
          },
        },
      },

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      skip: (page - 1) * limit,
      take: limit,
    }),

    prisma.host.count({
      where,
    }),
  ]);

  return {
    items: hosts.map(({ _count, ...host }) => ({
      ...host,
      role: "CO_HOST",
      assignedEventsCount: _count.assignedEvents,
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                              GET HOST DETAILS                              */
/* -------------------------------------------------------------------------- */

export const getHostDetailsService = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  await findOwnedHost(
    partnerId,
    businessId,
    hostId,
  );

  return prisma.host.findFirst({
    where: {
      id: hostId,
      businessId,

      business: {
        partnerId,
      },
    },

    select: {
      ...hostSelect,

      _count: {
        select: {
          assignedEvents: true,
        },
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           UPDATE HOST PERMISSIONS                          */
/* -------------------------------------------------------------------------- */

export const updateHostPermissionsService = async (
  partnerId: string,
  businessId: string,
  hostId: string,
  payload: UpdateHostPermissionsInput,
) => {
  const host = await findOwnedHost(
    partnerId,
    businessId,
    hostId,
  );

  const allowedStatuses: HostStatus[] = [
    HostStatus.INVITED,
    HostStatus.ONBOARDING,
    HostStatus.ACTIVE,
    HostStatus.PAUSED,
  ];

  if (!allowedStatuses.includes(host.status)) {
    throw new HostServiceError(
      400,
      "Permissions cannot be updated for this host",
    );
  }

  return prisma.host.update({
    where: {
      id: host.id,
      status: {
        in: allowedStatuses,
      },
    },

    data: {
      ...payload,

      canReportIncidentSOS: true,

      canCreateSubmitEvent: false,
      canEditEvent: false,
      canCancelEventRefund: false,
      canManagePayouts: false,
    },

    select: hostSelect,
  });
};

/* -------------------------------------------------------------------------- */
/*                             RESEND INVITATION                              */
/* -------------------------------------------------------------------------- */

export const resendHostInvitationService = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  const host = await findOwnedHost(
    partnerId,
    businessId,
    hostId,
  );

  const allowedStatuses: HostStatus[] = [
    HostStatus.INVITED,
    HostStatus.EXPIRED,
    HostStatus.DECLINED,
  ];

  if (!allowedStatuses.includes(host.status)) {
    throw new HostServiceError(
      400,
      "Invitation cannot be resent to this host",
    );
  }

  // Prevent repeated resend requests within 60 seconds
  if (
    host.status === HostStatus.INVITED &&
    Date.now() - host.invitedAt.getTime() < 60_000
  ) {
    throw new HostServiceError(
      429,
      "Please wait 60 seconds before resending",
    );
  }

  const invitation = generateInvitation();

  const updatedHost = await prisma.host.update({
    where: {
      id: host.id,
      status: host.status,
      updatedAt: host.updatedAt,
    },

    data: {
      invitationTokenHash: invitation.tokenHash,
      invitationExpiresAt: invitation.expiresAt,

      invitedAt: new Date(),
      acceptedAt: null,
      declinedAt: null,

      onboardingStep: HostStep.INVITE_ACCEPTANCE,
      onboardingCompleted: false,

      status: HostStatus.INVITED,
    },

    select: hostSelect,
  });

  return {
    host: updatedHost,
    invitationLink: invitation.invitationLink,
    invitationExpiresAt: invitation.expiresAt,
    deliveryStatus: "NOT_SENT",
  };
};

/* -------------------------------------------------------------------------- */
/*                                 PAUSE HOST                                 */
/* -------------------------------------------------------------------------- */

export const pauseHostService = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  const host = await findOwnedHost(
    partnerId,
    businessId,
    hostId,
  );

  if (host.status !== HostStatus.ACTIVE) {
    throw new HostServiceError(
      400,
      "Only active hosts can be paused",
    );
  }

  // Check for active event assignments
  const activeAssignments = await prisma.eventHost.count({
    where: {
      hostId: host.id,
      status: "ACTIVE",
    },
  });

  if (activeAssignments > 0) {
    throw new HostServiceError(
      409,
      "Reassign active events before pausing this host",
    );
  }

  return prisma.host.update({
    where: {
      id: host.id,
      status: HostStatus.ACTIVE,
    },

    data: {
      status: HostStatus.PAUSED,
      pausedAt: new Date(),
    },

    select: hostSelect,
  });
};

/* -------------------------------------------------------------------------- */
/*                                RESUME HOST                                 */
/* -------------------------------------------------------------------------- */

export const resumeHostService = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  const host = await findOwnedHost(
    partnerId,
    businessId,
    hostId,
  );

  if (host.status !== HostStatus.PAUSED) {
    throw new HostServiceError(
      400,
      "Only paused hosts can be resumed",
    );
  }

  if (!host.onboardingCompleted || !host.partnerId) {
    throw new HostServiceError(
      400,
      "Host onboarding is not completed",
    );
  }

  return prisma.host.update({
    where: {
      id: host.id,
      status: HostStatus.PAUSED,
    },

    data: {
      status: HostStatus.ACTIVE,
      pausedAt: null,
    },

    select: hostSelect,
  });
};

/* -------------------------------------------------------------------------- */
/*                                REMOVE HOST                                 */
/* -------------------------------------------------------------------------- */

export const removeHostService = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  const host = await findOwnedHost(
    partnerId,
    businessId,
    hostId,
  );

  if (host.status === HostStatus.REMOVED) {
    throw new HostServiceError(
      400,
      "Host is already removed",
    );
  }

  const activeAssignments = await prisma.eventHost.count({
    where: {
      hostId: host.id,
      status: "ACTIVE",
    },
  });

  if (activeAssignments > 0) {
    throw new HostServiceError(
      409,
      "Reassign active events before removing this host",
    );
  }

  return prisma.host.update({
    where: {
      id: host.id,
      status: {
        not: HostStatus.REMOVED,
      },
    },

    data: {
      status: HostStatus.REMOVED,
      removedAt: new Date(),
      invitationTokenHash: null,
    },

    select: hostSelect,
  });
};