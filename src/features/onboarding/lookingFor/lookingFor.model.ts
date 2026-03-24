import { Schema, model, models } from "mongoose";
import { ILookingFor } from "./lookingFor.types";

const ItemSchema = new Schema(
  {
    image: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const LookingForSchema = new Schema<ILookingFor>(
  {
    flowType: {
      type: String,
      enum: ["dating", "marriage", "mature"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
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
