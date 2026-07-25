import { z } from "zod";

export const registerPartnerSchema = z.object({
  businessName: z.string().min(2),
  legalEntity: z.string().min(2),

  businessType: z.enum([
    "INDIVIDUAL",
    "LLP",
    "PRIVATE_LIMITED",
    "PARTNERSHIP",
    "OPC",
    "NGO",
    "OTHER",
  ]),

  contactPerson: z.string().min(2),

  email: z.string().email(),

  phone: z.string().min(10).max(15),

  gstNumber: z.string().optional(),

  panNumber: z.string().optional(),

  experienceYears: z.number().optional(),

  description: z.string().optional(),

  monthlyEventsMin: z.number().optional(),

  monthlyEventsMax: z.number().optional(),

  teamSize: z.number().optional(),

  venueNames: z.array(z.string()).optional(),

  address: z.string().optional(),
  areaName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),

  coverageAreas: z.array(z.string()).optional(),

  references: z.array(z.string()).optional(),

  website: z.string().optional(),
  logo: z.string().optional(),

  gstCertificate: z.string().optional(),
  businessProof: z.string().optional(),
});