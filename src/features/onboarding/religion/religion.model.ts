import { Schema, model, models } from "mongoose";
import { IReligionData } from "./religion.types";

const ReligionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    communities: {
      type: [String], // ✅ string array
      required: true,
      default: [],
      validate: [
        (val: string[]) => val.length > 0,
        "At least one community is required",
      ],
    },
  },
  { _id: false }
);

const ReligionDataSchema = new Schema<IReligionData>(
  {
    flowType: {
      type: String,
      enum: ["dating", "marriage", "mature"],
        unique: true,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    religions: {
      type: [ReligionSchema],
      required: true,
      validate: [
        (val: any[]) => val.length > 0,
        "At least one religion is required",
      ],
    },
  },
  { timestamps: true }
);

// ✅ prevent duplicate per flowType 
ReligionDataSchema.index({ flowType: 1 }, { unique: true });

export const ReligionData =
  models.ReligionData ||
  model<IReligionData>("ReligionData", ReligionDataSchema);