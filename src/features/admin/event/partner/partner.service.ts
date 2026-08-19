
import { BusinessType } from "@prisma/client";
import { prisma } from "../../../../prisma/prismaClient";

interface RegisterEventPartnerData {
  businessName: string;
  legalEntity: string;
  businessType: BusinessType;

  contactPerson: string;
  email: string;
  phone: string;

  gstNumber?: string | null;
  panNumber?: string | null;

  experienceYears?: number | null;
  description?: string | null;

  monthlyEventsMin?: number | null;
  monthlyEventsMax?: number | null;
  teamSize?: number | null;

  venueNames: string[];

  address?: string | null;
  areaName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  coverageAreas: string[];
  references: string[];

  website?: string | null;

  logo?: string | null;
  gstCertificate?: string | null;
  businessProof?: string | null;
}

export const registerPartnerService = async (
  data: RegisterEventPartnerData
) => {
  // ============================================
  // CHECK EMAIL
  // ============================================

  const existingEmail = await prisma.eventPartner.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingEmail) {
    throw new Error(
      "A partner with this email already exists."
    );
  }

  // ============================================
  // CHECK GST
  // ============================================

  if (data.gstNumber) {
    const existingGst = await prisma.eventPartner.findUnique({
      where: {
        gstNumber: data.gstNumber,
      },
    });

    if (existingGst) {
      throw new Error(
        "A partner with this GST number already exists."
      );
    }
  }

  // ============================================
  // CREATE EVENT PARTNER
  // ============================================

  const partner = await prisma.eventPartner.create({
    data: {
      businessName: data.businessName,
      legalEntity: data.legalEntity,
      businessType: data.businessType,

      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,

      gstNumber: data.gstNumber,
      panNumber: data.panNumber,

      experienceYears: data.experienceYears,
      description: data.description,

      monthlyEventsMin: data.monthlyEventsMin,
      monthlyEventsMax: data.monthlyEventsMax,

      teamSize: data.teamSize,

      venueNames: data.venueNames,

      address: data.address,
      areaName: data.areaName,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,

      coverageAreas: data.coverageAreas,
      references: data.references,

      website: data.website,

      // ImageKit URLs
      logo: data.logo,
      gstCertificate: data.gstCertificate,
      businessProof: data.businessProof,

      // status automatically PENDING
      // isActive automatically true
      // isDeleted automatically false
    },
  });

  return partner;
};

export const getAllPartnersService = async () => {
  const partners = await prisma.eventPartner.findMany({
    where: {
      isDeleted: false,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return partners;
};