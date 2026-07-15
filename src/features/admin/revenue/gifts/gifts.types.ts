import { z } from "zod";
import {
  createGiftCategorySchema,
  updateGiftCategorySchema,
} from "./gifts.validation";


export type CreateGiftCategoryDto =
  z.infer<typeof createGiftCategorySchema>["body"];

export type UpdateGiftCategoryDto =
  z.infer<typeof updateGiftCategorySchema>["body"];
  
  export interface CreateGiftDto {
  categoryId: number;
  image: string;
  name: string;
  coinCost: number;
  triggerLine?: string;
  receiverLine?: string;
   isLive?: boolean;
}

export interface UpdateGiftDto {
  categoryId?: number;
  image?: string;
  name?: string;
  coinCost?: number;
  triggerLine?: string;
  receiverLine?: string;
  isLive?: boolean;
}