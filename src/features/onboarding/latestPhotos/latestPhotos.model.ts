import { Schema, model, models } from "mongoose";
import { ILatestPhotos } from "./latestPhotos.types";

const PhotoSchema = new Schema(
  {
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const LatestPhotosSchema = new Schema<ILatestPhotos>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    photos: { type: [PhotoSchema], required: true },
  },
  { timestamps: true }
);

export const LatestPhotos =
  models.LatestPhotos ||
  model<ILatestPhotos>("LatestPhotos", LatestPhotosSchema);
