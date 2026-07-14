import { PromptVisibility } from "@prisma/client";

export interface CreatePromptCategoryDto {
  name: string;
  description?: string;
  priority?: number;
  active?: boolean;
}

export interface UpdatePromptCategoryDto {
  name?: string;
  description?: string;
  priority?: number;
  active?: boolean;
}

export interface CreatePromptDto {
  categoryId: string;
  question: string;
  priority?: number;
  active?: boolean;
  maxLength?: number;
  visibility?: PromptVisibility;
}

export interface UpdatePromptDto {
  categoryId?: string;
  question?: string;
  priority?: number;
  active?: boolean;
  maxLength?: number;
  visibility?: PromptVisibility;
}