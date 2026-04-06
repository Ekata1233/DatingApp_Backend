import { Schema, model, models } from "mongoose";
import { ILookingFor } from "./lookingFor.types";

const ItemSchema = new Schema(
  {
    image: { type: String, required: true },
    description: { type: String, required: true },
    options: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const LookingForSchema = new Schema<ILookingFor>(
  {
    flowType: {
      type: String,
      enum: ["dating", "marriage", "mature"], // ✅ same as Lifestyle
      required: true,
      index: true,
      unique: true, // ✅ one document per flowType
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    items: {
      type: [ItemSchema],
      required: true,
    },
  },
  { timestamps: true }
);

export const LookingFor =
  models.LookingFor ||
  model<ILookingFor>("LookingFor", LookingForSchema);