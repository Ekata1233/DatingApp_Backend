import { prisma } from "../../../../prisma/prismaClient";

export const registerPartner = async (data: any) => {
  const existingPartner = await prisma.eventPartner.findFirst({
    where: {
      OR: [
        { email: data.email },
        ...(data.gstNumber ? [{ gstNumber: data.gstNumber }] : []),
      ],
    },
  });

  if (existingPartner) {
    throw new Error("Partner already registered.");
  }

  if (
    data.monthlyEventsMin &&
    data.monthlyEventsMax &&
    Number(data.monthlyEventsMin) > Number(data.monthlyEventsMax)
  ) {
    throw new Error(
      "monthlyEventsMin cannot be greater than monthlyEventsMax."
    );
  }

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

      experienceYears: data.experienceYears
        ? Number(data.experienceYears)
        : null,

      description: data.description,

      monthlyEventsMin: data.monthlyEventsMin
        ? Number(data.monthlyEventsMin)
        : null,

      monthlyEventsMax: data.monthlyEventsMax
        ? Number(data.monthlyEventsMax)
        : null,

      teamSize: data.teamSize ? Number(data.teamSize) : null,

      venueNames: data.venueNames || [],

      address: data.address,
      areaName: data.areaName,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,

      coverageAreas: data.coverageAreas || [],

      references: data.references || [],

      website: data.website,

      logo: data.logo,
      gstCertificate: data.gstCertificate,
      businessProof: data.businessProof,
    },
  });

  return partner;
};