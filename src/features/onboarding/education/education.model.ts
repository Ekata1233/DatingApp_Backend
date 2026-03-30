import { Schema, model, models } from "mongoose";
import { IEducation } from "./education.types";

const EducationSchema = new Schema<IEducation>(
  {
    flowType: {
      type: String,
      enum: ["dating", "marriage", "mature"],
      required: true,
      unique: true, // ✅ only one record per flowType
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    educations: {
      type: [String],
      required: true,
      default: [],
      validate: [
        (val: string[]) => val.length > 0,
        "At least one education is required",
      ],
    },
  },
  { timestamps: true }
);

export const Education =
  models.Education || model<IEducation>("Education", EducationSchema);