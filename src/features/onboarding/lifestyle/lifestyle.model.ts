import { Schema, model, models } from "mongoose";
import { ILifestyle } from "./lifestyle.types";

const PointSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const SectionSchema = new Schema(
  {
    subtitle: { type: String, required: true, trim: true },
    points: { type: [PointSchema], required: true },
  },
  { _id: false }
);

const LifestyleSchema = new Schema<ILifestyle>(
  {
    flowType: {
      type: String,
      enum: ["dating", "marriage", "mature"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    sections: { type: [SectionSchema], required: true },
  },
  { timestamps: true }
);

export const Lifestyle =
  models.Lifestyle || model<ILifestyle>("Lifestyle", LifestyleSchema);
