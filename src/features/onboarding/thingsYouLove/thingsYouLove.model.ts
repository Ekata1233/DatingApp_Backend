import { Schema, model, models } from "mongoose";
import { IThingsYouLove } from "./thingsYouLove.types";

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

const ThingsYouLoveSchema = new Schema<IThingsYouLove>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    sections: { type: [SectionSchema], required: true },
  },
  { timestamps: true }
);

export const ThingsYouLove =
  models.ThingsYouLove || model<IThingsYouLove>("ThingsYouLove", ThingsYouLoveSchema);
