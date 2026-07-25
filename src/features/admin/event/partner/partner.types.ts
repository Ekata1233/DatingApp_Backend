import { BusinessType } from "@prisma/client";

export interface RegisterPartnerDto {
  businessName: string;
  legalEntity: string;
  businessType: BusinessType;

  contactPerson: string;
  email: string;
  phone: string;

  gstNumber?: string;
  panNumber?: string;

  experienceYears?: number;
  description?: string;

  monthlyEventsMin?: number;
  monthlyEventsMax?: number;
  teamSize?: number;

  venueNames?: string[];

  address?: string;
  areaName?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  coverageAreas?: string[];

  references?: string[];

  website?: string;
  logo?: string;

  gstCertificate?: string;
  businessProof?: string;
}