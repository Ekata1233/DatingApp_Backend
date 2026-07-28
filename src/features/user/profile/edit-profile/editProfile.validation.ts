import { EducationLevel } from "@prisma/client";
import { z } from "zod";

export const updateBasicInfoSchema = z.object({

  full_name: z.string().optional(),

  email: z.string().email().optional(),

  birth_date: z.string().optional(),

  height: z.number().optional(),

  gender: z.enum([
    "MEN",
    "WOMEN",
    "OTHER",
  ]).optional(),

  religionId: z.number().optional(),

  communityId: z.number().optional(),

  languageIds: z.array(z.number()).optional(),

  zodiac: z.enum([
    "ARIES",
    "TAURUS",
    "GEMINI",
    "CANCER",
    "LEO",
    "VIRGO",
    "LIBRA",
    "SCORPIO",
    "SAGITTARIUS",
    "CAPRICORN",
    "AQUARIUS",
    "PISCES",
  ]).optional(),

  loveLanguage: z.enum([
    "WORDS_OF_AFFIRMATION",
    "QUALITY_TIME",
    "ACTS_OF_SERVICE",
    "PHYSICAL_TOUCH",
    "RECEIVING_GIFTS",
  ]).optional(),

  communicationStyle: z.enum([
    "PHONE_CALLS_OVER_TEXTS",
    "TEXTS_OVER_CALLS",
    "VIDEO_CALLS",
    "VOICE_NOTES",
    "IN_PERSON_ALWAYS",
    "A_BIT_OF_EVERYTHING",
  ]).optional(),

});

export const updateBioSchema = z.object({
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
});

export const updateQuestionAnswerSchema =
  z.object({
    questionKey: z.string(),
    optionIds: z.array(z.string().uuid()),
     description: z.string().optional()
  });



export const updateEduWorkSchema = z.object({
  highestEdu: z.nativeEnum(EducationLevel).optional(),

  degree: z.string().max(100).optional(),
  collegeName: z.string().max(100).optional(),
  graduationYear: z.number().int().optional(),

  professionId: z.number().int().optional(),
  companyName: z.string().max(100).optional(),
  employmentTypeId: z.number().int().optional(),
  experienceId: z.number().int().optional(),
  ambitionId: z.number().int().optional(),
  salaryRangeId: z.number().int().optional(),

  bigDreams: z.string().max(100).optional(),
});



export const updateUserPromptSchema = z.object({
  categoryId: z.string().uuid(),
  promptId: z.string().uuid(),
  answer: z.string().min(1).max(300),
  displayOrder: z.number().optional()
});

export const updateLocationSchema = z.object({
  country: z.string().max(30).optional(),
  state: z.string().max(30).optional(),
  city: z.string().max(30).optional(),
  area: z.string().max(30).optional(),

  latitude: z.number().optional(),
  longitude: z.number().optional(),

  max_distance_km: z.number().int().positive().optional(),
});