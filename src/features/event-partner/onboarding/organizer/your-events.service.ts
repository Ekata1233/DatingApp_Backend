import {
  ApprovalStatus,
  BusinessStatus,
  EventAudience,
  EventDurationType,
  OrganizerStep,
  Prisma,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../../../prisma/prismaClient";
import { normalizeIndianMobile, OrganizerOnboardingError } from "./organizer.types";

const city = z.string().trim().min(1).max(100);

export const yourEventsInputSchema = z.object({
  businessId: z.string().uuid(),
  action: z.enum(["SAVE", "SUBMIT"]),
  eventDurationType: z.nativeEnum(EventDurationType).nullable().optional(),
  categoryValues: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  baseCity: city.nullable().optional(),
  hostingCities: z.array(city).max(50).optional(),
  targetAudience: z.nativeEnum(EventAudience).nullable().optional(),
  emergencyContactName: z.string().trim().min(1).max(100).nullable().optional(),
  emergencyContactPhone: z.string().trim().min(1).max(30).nullable().optional(),
  hasAgreedToHostRules: z.boolean().optional(),
}).strict();

const categorySelect = {
  value: true,
  label: true,
  icon: true,
} satisfies Prisma.EventCategorySelect;

const eventsInclude = {
  categories: { select: categorySelect, orderBy: [{ sortOrder: "asc" }, { value: "asc" }] },
} satisfies Prisma.YourEventsInclude;

const businessSelect = {
  id: true,
  status: true,
  onboardingStep: true,
  submittedAt: true,
} satisfies Prisma.BusinessDetailsSelect;

export const getYourEvents = async (partnerId: string, businessId: string) => {
  const business = await prisma.businessDetails.findFirst({
    where: { id: businessId, partnerId },
    select: { ...businessSelect, yourEvents: { include: eventsInclude } },
  });

  if (!business) {
    throw new OrganizerOnboardingError(404, "Business not found or access denied");
  }

  const categories = await prisma.eventCategory.findMany({
    where: { isActive: true },
    ...eventsInclude.categories,
  });

  const { yourEvents, ...details } = business;
  return { business: details, yourEvents, categories };
};

const normalizeContactPhone = (phone: string) => {
  try {
    return normalizeIndianMobile(phone);
  } catch {
    throw new OrganizerOnboardingError(400, "Enter a valid emergency contact mobile number");
  }
};

export const saveYourEvents = async (
  partnerId: string,
  input: z.infer<typeof yourEventsInputSchema>,
) => {
  const { businessId, action, categoryValues, ...fields } = input;
  const submitting = action === "SUBMIT";

  try {
    return await prisma.$transaction(async (tx) => {
      const business = await tx.businessDetails.findFirst({
        where: { id: businessId, partnerId },
        select: {
          ...businessSelect,
          partner: { select: { phoneNumber: true } },
          yourEvents: { include: eventsInclude },
        },
      });

      if (!business) {
        throw new OrganizerOnboardingError(404, "Business not found or access denied");
      }
      if (business.status !== BusinessStatus.DRAFT && business.status !== BusinessStatus.CHANGES_REQUIRED) {
        throw new OrganizerOnboardingError(409, "Your Events can only be edited during onboarding or when changes are requested");
      }

      const { yourEvents: current, partner, ...details } = business;
      const values = [...new Set(categoryValues ?? current?.categories.map(({ value }) => value))];
      const categories = await tx.eventCategory.findMany({
        where: { value: { in: values }, isActive: true },
        select: { id: true },
      });
      if ((submitting || categoryValues !== undefined) && categories.length !== values.length) {
        throw new OrganizerOnboardingError(400, "Select active event categories from the list");
      }

      const cities = fields.hostingCities ?? current?.hostingCities ?? [];
      const hostingCities = [...new Map(cities.map((name) => [name.toLowerCase(), name])).values()];
      const contactPhone = fields.emergencyContactPhone === undefined
        ? current?.emergencyContactPhone ?? null
        : fields.emergencyContactPhone && normalizeContactPhone(fields.emergencyContactPhone);

      const data = {
        eventDurationType: fields.eventDurationType === undefined ? current?.eventDurationType ?? null : fields.eventDurationType,
        baseCity: fields.baseCity === undefined ? current?.baseCity ?? null : fields.baseCity,
        targetAudience: fields.targetAudience === undefined ? current?.targetAudience ?? null : fields.targetAudience,
        emergencyContactName: fields.emergencyContactName === undefined
          ? current?.emergencyContactName ?? null
          : fields.emergencyContactName,
        emergencyContactPhone: contactPhone,
        hostingCities,
        hasAgreedToHostRules: fields.hasAgreedToHostRules ?? current?.hasAgreedToHostRules ?? false,
      };

      if (contactPhone && contactPhone === partner.phoneNumber.replace(/\D/g, "").slice(-10)) {
        throw new OrganizerOnboardingError(400, "Emergency contact must use a different mobile number");
      }

      if (submitting && (
        !data.eventDurationType || !values.length || !data.baseCity || !hostingCities.length ||
        !data.targetAudience || !data.emergencyContactName || !contactPhone || !data.hasAgreedToHostRules
      )) {
        throw new OrganizerOnboardingError(400, "Complete all Your Events fields and accept the host rules before submitting");
      }

      const vipReview = submitting && data.targetAudience !== EventAudience.FREE_PREMIUM;
      const vipStatus = vipReview && current?.vipApprovalStatus !== ApprovalStatus.APPROVED
        ? { vipApprovalStatus: ApprovalStatus.PENDING, vipApprovedAt: null, vipRejectionReason: null }
        : submitting && !vipReview
          ? { vipApprovalStatus: ApprovalStatus.NOT_REQUESTED, vipApprovedAt: null, vipRejectionReason: null }
          : {};

      const yourEvents = await tx.yourEvents.upsert({
        where: { businessId },
        create: { businessId, ...data, ...vipStatus, categories: { connect: categories } },
        update: {
          ...data,
          ...vipStatus,
          ...(categoryValues !== undefined ? { categories: { set: categories } } : {}),
        },
        include: eventsInclude,
      });

      const updatedBusiness = submitting
        ? await tx.businessDetails.update({
            where: { id: businessId, partnerId },
            data: {
              status: BusinessStatus.UNDER_REVIEW,
              onboardingStep: OrganizerStep.UNDER_REVIEW,
              submittedAt: new Date(),
            },
            select: businessSelect,
          })
        : details;

      return { business: updatedBusiness, yourEvents };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
      throw new OrganizerOnboardingError(409, "Your Events changed. Reload and try again");
    }
    throw error;
  }
};
