import { Schema, model, models } from "mongoose";
import { IInterestHobbies } from "./interestHobbies.types";

const ItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true },
  },
  { _id: false }
);

const InterestHobbiesSchema = new Schema<IInterestHobbies>(
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
    subtitle: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [ItemSchema],
      required: true,
      validate: [
        (val: any[]) => val.length > 0,
        "At least one item is required",
      ],
    },
  },
  { timestamps: true }
);

export const InterestHobbies =
  models.InterestHobbies ||
  model<IInterestHobbies>("InterestHobbies", InterestHobbiesSchema);