import { Schema, model, models } from "mongoose";
import { IInterestedIn } from "./interestedIn.types";

const InterestedInSchema = new Schema<IInterestedIn>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    options: [
      {
        label: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

InterestedInSchema.index({ title: 1 });

export const InterestedIn =
  models.InterestedIn ||
  model<IInterestedIn>("InterestedIn", InterestedInSchema);
