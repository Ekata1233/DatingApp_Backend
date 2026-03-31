import { z } from "zod";
import { QuestionCategory, QuestionScreen } from "@prisma/client";

export const createQuestionValidation = z.object({
  key: z.string().min(1),
  title: z.string().min(1),

  category: z.nativeEnum(QuestionCategory),
  screen: z.nativeEnum(QuestionScreen),

  isMulti: z.boolean().optional(),

  options: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
      })
    )
    .min(1),
});

export const getQuestionValidation = z.object({
  category: z.nativeEnum(QuestionCategory).optional(),
  screen: z.nativeEnum(QuestionScreen).optional(),
});