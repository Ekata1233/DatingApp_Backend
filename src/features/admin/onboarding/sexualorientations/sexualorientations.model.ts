import { Schema, model, models } from "mongoose";
import { ISexualOrientation } from "./sexualorientations.types";

const OptionSchema = new Schema(
  {
    label: { type: String, required: true },

    description: {
      type: String,
      required: true,        // ✅ required field
      minlength: 10,         // ✅ minimum length
      maxlength: 200,        // ✅ maximum length
      trim: true,            // ✅ clean spaces
    },
  },
  { _id: false }
);

const SexualOrientationSchema = new Schema<ISexualOrientation>(
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
    },
    options: {
      type: [OptionSchema],
      required: true,
    },
  },
  { timestamps: true }
);

export const SexualOrientation =
  models.SexualOrientation ||
  model<ISexualOrientation>("SexualOrientation", SexualOrientationSchema);
