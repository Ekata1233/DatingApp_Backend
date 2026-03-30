import { Schema, model, models } from "mongoose";
import { IWorkDetails } from "./workDetails.types";

const WorkingWithSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    workingAs: {
      type: [String],
      required: true,
      default: [],
      validate: [
        (val: string[]) => val.length > 0,
        "At least one 'working as' is required",
      ],
    },
  },
  { _id: false }
);

const WorkDetailsSchema = new Schema<IWorkDetails>(
  {
    flowType: {
      type: String,
      enum: ["dating", "marriage", "mature"],
      required: true,
      unique: true, // ✅ one per flowType
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    annualIncome: {
      type: [String],
      required: true,
      default: [],
      validate: [
        (val: string[]) => val.length > 0,
        "At least one income option is required",
      ],
    },
    workingWith: {
      type: [WorkingWithSchema],
      required: true,
      validate: [
        (val: any[]) => val.length > 0,
        "At least one workingWith entry is required",
      ],
    },
  },
  { timestamps: true }
);

export const WorkDetails =
  models.WorkDetails ||
  model<IWorkDetails>("WorkDetails", WorkDetailsSchema);