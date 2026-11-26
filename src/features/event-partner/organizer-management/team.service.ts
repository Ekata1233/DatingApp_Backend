import {
  EventHostStatus,
  EventStatus,
  HostActivityAction,
  HostRemovalReason,
  HostStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import {
  getHostPermissionsService,
  HostServiceError,
} from "../host-management/host.service";
import {
  HOST_STEP_NUMBER,
  HOST_TOTAL_STEPS,
} from "../onboarding/host-onboarding/host-onboarding.types";

const SEAT_LIMIT = 10;
const VERIFICATION_STEPS = HOST_TOTAL_STEPS - 1;

const pendingStatuses = new Set<HostStatus>([
  HostStatus.INVITED,
  HostStatus.ONBOARDING,
  HostStatus.EXPIRED,
]);

const teamMemberStatuses = [
  HostStatus.ACTIVE,
  HostStatus.PAUSED,
  ...pendingStatuses,
];

const getTeamMemberStatus = (
  status: HostStatus,
  invitationExpiresAt: Date,
  now: Date,
) =>
  status === HostStatus.INVITED && invitationExpiresAt <= now
    ? HostStatus.EXPIRED
    : status;

export const getOrganizerTeam = async (
  partnerId: string,
  businessId: string,
) => {
  const business = await prisma.businessDetails.findFirst({
    where: {
      id: businessId,
      partnerId,
      status: "ACTIVE",
      onboardingCompleted: true,
    },
    select: {
      id: true,
      brandName: true,
      legalName: true,
      partner: { select: { fullName: true, profilePhoto: true } },
    },
  });

  if (!business) {
    return null;
  }

  const hosts = await prisma.host.findMany({
    where: {
      businessId: business.id,
      status: { in: teamMemberStatuses },
    },
    select: {
      id: true,
      fullName: true,
      status: true,
      invitedAt: true,
      invitationExpiresAt: true,
      acceptedAt: true,
      onboardingStep: true,
      onboardingCompleted: true,
      partner: { select: { profilePhoto: true } },
      primaryHostedEvents: {
        where: { businessDetailsId: business.id },
        select: { id: true },
      },
      assignedEvents: {
        where: {
          status: EventHostStatus.ACTIVE,
          event: { businessDetailsId: business.id },
        },
        select: { eventId: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const now = new Date();
  const coHosts = hosts.map((host) => {
    const status = getTeamMemberStatus(
      host.status,
      host.invitationExpiresAt,
      now,
    );

    const eventIds = new Set([
      ...host.primaryHostedEvents.map(({ id }) => id),
      ...host.assignedEvents.map(({ eventId }) => eventId),
    ]);

    return {
      id: host.id,
      fullName: host.fullName,
      profilePhoto: host.partner?.profilePhoto ?? null,
      role: "CO_HOST",
      isCurrentUser: false,
      status,
      allEvents: false,
      assignedEventsCount: eventIds.size,
      invitedAt: host.invitedAt,
      invitationExpiresAt: host.invitationExpiresAt,
      acceptedAt: host.acceptedAt,
      onboardingProgress:
        status === HostStatus.ONBOARDING
          ? {
              currentStep: host.onboardingStep,
              completedSteps: host.onboardingCompleted
                ? VERIFICATION_STEPS
                : Math.max(0, HOST_STEP_NUMBER[host.onboardingStep] - 2),
              totalSteps: VERIFICATION_STEPS,
            }
          : null,
    };
  });

  const pending = coHosts.filter(({ status }) => pendingStatuses.has(status));
  const team = [
    {
      id: partnerId,
      fullName:
        business.partner.fullName ??
        business.brandName ??
        business.legalName ??
        "Owner",
      profilePhoto: business.partner.profilePhoto,
      role: "OWNER",
      isCurrentUser: true,
      status: HostStatus.ACTIVE,
      allEvents: true,
      assignedEventsCount: null,
    },
    ...coHosts.filter(({ status }) => !pendingStatuses.has(status)),
  ];

  return {
    businessId: business.id,
    summary: {
      seatsUsed: team.length + pending.length,
      seatLimit: SEAT_LIMIT,
      activeCount: team.filter(({ status }) => status === HostStatus.ACTIVE)
        .length,
      pendingCount: pending.length,
    },
    team,
    pending,
  };
};

export const getOrganizerTeamMember = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  const eventWhere = {
    businessDetailsId: businessId,
    isDeleted: false,
    deletedAt: null,
  };
  const eventSelect = { id: true, title: true, status: true } as const;
  const host = await prisma.host.findFirst({
    where: {
      id: hostId,
      businessId,
      status: { in: teamMemberStatuses },
      business: { partnerId, status: "ACTIVE", onboardingCompleted: true },
    },
    include: {
      partner: { select: { profilePhoto: true, lastActiveAt: true } },
      primaryHostedEvents: { where: eventWhere, select: eventSelect },
      assignedEvents: {
        where: {
          status: { in: [EventHostStatus.ACTIVE, EventHostStatus.COMPLETED] },
          event: eventWhere,
        },
        select: { status: true, event: { select: eventSelect } },
      },
    },
  });
  if (!host) return null;

  const events = new Map(
    host.primaryHostedEvents.map((event) => [event.id, event]),
  );
  const completedEventIds = new Set<string>();
  for (const assignment of host.assignedEvents) {
    events.set(assignment.event.id, assignment.event);
    if (
      assignment.status === EventHostStatus.COMPLETED &&
      assignment.event.status !== EventStatus.CANCELLED
    ) {
      completedEventIds.add(assignment.event.id);
    }
  }

  const assignedEvents = [];
  for (const event of events.values()) {
    if (event.status === EventStatus.CANCELLED) continue;
    if (event.status === EventStatus.COMPLETED) completedEventIds.add(event.id);
    if (!completedEventIds.has(event.id)) assignedEvents.push(event);
  }

  const permissions = getHostPermissionsService().permissions.map(
    ({ key, title, editable }) => ({
      key,
      title,
      editable,
      enabled: host[key as keyof typeof host] === true,
    }),
  );

  return {
    id: host.id,
    fullName: host.fullName,
    phoneNumber: host.phoneNumber,
    gender: host.gender,
    role: "CO_HOST",
    status: getTeamMemberStatus(
      host.status,
      host.invitationExpiresAt,
      new Date(),
    ),
    invitedAt: host.invitedAt,
    invitationExpiresAt: host.invitationExpiresAt,
    acceptedAt: host.acceptedAt,
    profile: {
      photoUrl: host.partner?.profilePhoto ?? null,
      bio: null,
      portfolio: null,
    },
    assignedEvents,
    assignedEventsCount: assignedEvents.length,
    permissions,
    activity: {
      coHostedEventsCount: completedEventIds.size,
      lastActiveAt: host.partner?.lastActiveAt ?? null,
    },
  };
};

const loadManagedHost = async (
  db: Prisma.TransactionClient,
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  const host = await db.host.findFirst({
    where: {
      id: hostId,
      businessId,
      status: { in: teamMemberStatuses },
      business: { partnerId, status: "ACTIVE", onboardingCompleted: true },
    },
    select: {
      id: true,
      status: true,
      partnerId: true,
      onboardingCompleted: true,
      pausedAt: true,
      resumedAt: true,
    },
  });

  if (!host) throw new HostServiceError(404, "Team member not found");
  return host;
};

const eligibleReplacements = (
  businessId: string,
  hostId: string,
): Prisma.HostWhereInput => ({
  id: { not: hostId },
  businessId,
  status: HostStatus.ACTIVE,
  onboardingCompleted: true,
  acceptedAt: { not: null },
  partner: { accountStatus: "ACTIVE" },
});

const loadEventsForHandover = (
  db: Prisma.TransactionClient,
  businessId: string,
  hostId: string,
  now: Date,
) =>
  db.event.findMany({
    where: {
      businessDetailsId: businessId,
      deletedAt: null,
      isDeleted: false,
      status: { notIn: [EventStatus.COMPLETED, EventStatus.CANCELLED] },
      AND: [
        {
          OR: [
            { hostId },
            { hosts: { some: { hostId, status: EventHostStatus.ACTIVE } } },
          ],
        },
        {
          OR: [
            { dates: { none: {} } },
            {
              dates: {
                some: {
                  status: "SCHEDULED",
                  OR: [
                    { endDateTime: { gte: now } },
                    { endDateTime: null, startDateTime: { gte: now } },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      hostId: true,
      bookings: {
        where: { status: "CONFIRMED" },
        select: { userId: true },
        distinct: ["userId"],
      },
    },
    orderBy: [{ title: "asc" }, { id: "asc" }],
  });

const teamWriteOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

export const changeTeamMemberAccess = (
  partnerId: string,
  businessId: string,
  hostId: string,
  status: typeof HostStatus.PAUSED | typeof HostStatus.ACTIVE,
) =>
  prisma.$transaction(async (tx) => {
    const host = await loadManagedHost(tx, partnerId, businessId, hostId);
    const pausing = status === HostStatus.PAUSED;

    if (host.status === status) {
      return {
        id: host.id,
        status,
        pausedAt: host.pausedAt,
        resumedAt: host.resumedAt,
      };
    }
    if (
      pausing
        ? host.status !== HostStatus.ACTIVE
        : host.status !== HostStatus.PAUSED ||
          !host.partnerId ||
          !host.onboardingCompleted
    ) {
      throw new HostServiceError(
        409,
        pausing
          ? "Only active co-hosts can be paused"
          : "This co-host cannot be resumed",
      );
    }

    const now = new Date();
    const updated = await tx.host.update({
      where: { id: hostId },
      data: pausing
        ? { status, pausedAt: now }
        : { status, pausedAt: null, resumedAt: now },
      select: { id: true, status: true, pausedAt: true, resumedAt: true },
    });

    await tx.hostActivityLog.create({
      data: {
        hostId,
        businessId,
        performedById: partnerId,
        action: pausing
          ? HostActivityAction.PAUSED
          : HostActivityAction.RESUMED,
        previousStatus: host.status,
        newStatus: status,
      },
    });

    return updated;
  }, teamWriteOptions);

export const previewTeamMemberRemoval = async (
  partnerId: string,
  businessId: string,
  hostId: string,
) => {
  await loadManagedHost(prisma, partnerId, businessId, hostId);
  const [events, replacements] = await Promise.all([
    loadEventsForHandover(prisma, businessId, hostId, new Date()),
    prisma.host.findMany({
      where: eligibleReplacements(businessId, hostId),
      select: { id: true, fullName: true },
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
    }),
  ]);
  return {
    hostId,
    replacementRequired: events.length > 0,
    affectedEvents: events.map(({ id, title }) => ({ id, title })),
    replacements: replacements.map((replacement) => ({
      ...replacement,
      type: "CO_HOST",
    })),
  };
};

export const removeTeamMember = (
  partnerId: string,
  businessId: string,
  hostId: string,
  reason: HostRemovalReason,
  note?: string,
  replacementHostId?: string,
) =>
  prisma.$transaction(async (tx) => {
    const host = await loadManagedHost(tx, partnerId, businessId, hostId);
    const now = new Date();
    const events = await loadEventsForHandover(tx, businessId, hostId, now);

    console.log("Host ID:", hostId);
    console.log("Events count:", events.length);
    console.log("Events:", JSON.stringify(events, null, 2));
    console.log("Replacement Host ID:", replacementHostId);

    const replacement =
      replacementHostId &&
      (await tx.host.findFirst({
        where: {
          AND: [
            eligibleReplacements(businessId, hostId),
            { id: replacementHostId },
          ],
        },
        select: { id: true, fullName: true },
      }));

    console.log("replacement : ", replacement);

    if (replacementHostId && !replacement) {
      throw new HostServiceError(
        400,
        "Select an eligible co-host from this business",
      );
    }
    if (events.length && !replacement) {
      throw new HostServiceError(
        409,
        "Select a replacement for this co-host's events",
      );
    }

    const notifications = replacement
      ? events.flatMap((event) =>
          event.bookings.map(({ userId }) => ({
            receiver_id: userId,
            type: "EVENT_HOST_CHANGED" as const,
            title: "Your event host changed",
            message: `${replacement.fullName} is now hosting ${event.title ?? "your event"}.`,
            data: { eventId: event.id },
          })),
        )
      : [];

    if (notifications.length) {
      const senderId = process.env.EVENT_NOTIFICATION_SENDER_USER_ID;
      if (
        !senderId ||
        !(await tx.user.findUnique({
          where: { id: senderId },
          select: { id: true },
        }))
      ) {
        throw new HostServiceError(503, "Event notifications are unavailable");
      }
      await tx.notification.createMany({
        data: notifications.map((notification) => ({
          ...notification,
          sender_id: senderId,
        })),
      });
    }

    if (replacement) {
      for (const event of events) {
        const assignmentData = {
          status: EventHostStatus.ACTIVE,
          assignedAt: now,
          removedAt: null,
          completedAt: null,
          replacedByHostId: null,
          replacementReason: null,
        };
        const existing = await tx.eventHost.findUnique({
          where: {
            eventId_hostId: { eventId: event.id, hostId: replacement.id },
          },
          select: { id: true, status: true },
        });
        if (!existing) {
          await tx.eventHost.create({
            data: {
              eventId: event.id,
              hostId: replacement.id,
              ...assignmentData,
            },
          });
        } else if (existing.status !== EventHostStatus.ACTIVE) {
          await tx.eventHost.update({
            where: { id: existing.id },
            data: assignmentData,
          });
        }

        if (event.hostId === hostId) {
          await tx.event.update({
            where: { id: event.id },
            data: {
              hostId: replacement.id,
              hostPhotoUrl: null,
              hostTitle: null,
              hostSpeciality: null,
              hostLanguages: [],
              hostMessage: null,
            },
          });
        }
      }
    }

    const eventIds = events.map(({ id }) => id);
    await tx.eventHost.updateMany({
      where: {
        hostId,
        status: EventHostStatus.ACTIVE,
        eventId: { in: eventIds },
      },
      data: {
        status: EventHostStatus.REMOVED,
        removedAt: now,
        replacedByHostId: replacementHostId,
        replacementReason: reason,
      },
    });
    const updated = await tx.host.update({
      where: { id: hostId },
      data: {
        status: HostStatus.REMOVED,
        removedAt: now,
        removalReason: reason,
        removalNote: note,
        invitationTokenHash: null,
      },
      select: { id: true, status: true, removedAt: true },
    });
    await tx.hostActivityLog.create({
      data: {
        hostId,
        businessId,
        performedById: partnerId,
        action: HostActivityAction.REMOVED,
        previousStatus: host.status,
        newStatus: HostStatus.REMOVED,
        removalReason: reason,
        note,
        metadata: { eventIds, replacementHostId: replacementHostId ?? null },
      },
    });

    return {
      ...updated,
      reassignedEventIds: eventIds,
      notificationsCreated: notifications.length,
    };
  }, teamWriteOptions);
