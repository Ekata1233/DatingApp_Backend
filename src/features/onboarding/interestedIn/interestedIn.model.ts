import { Schema, model, models } from "mongoose";
import { IInterestedIn } from "./interestedIn.types";

const GenderImageSchema = new Schema(
  {
    gender: { type: String, required: true },
    image: { type: String, required: true },
  },
  { _id: false }
);

const InterestedInSchema = new Schema<IInterestedIn>(
  {
    flowType: {
      type: String,
      enum: ["dating", "marriage", "mature"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, unique: true },
    genderImages: { type: [GenderImageSchema], required: true },
  },
  { timestamps: true }
);

export const InterestedIn =
  models.InterestedIn ||
  model<IInterestedIn>("InterestedIn", InterestedInSchema);
