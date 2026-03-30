import { Schema, model, models } from "mongoose";
import { IDreamsFuture } from "./dreamsFuture.types";

const ItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true },
  },
  { _id: false }
);

const DreamsFutureSchema = new Schema<IDreamsFuture>(
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
        "At least one dream is required",
      ],
    },
  },
  { timestamps: true }
);

export const DreamsFuture =
  models.DreamsFuture ||
  model<IDreamsFuture>("DreamsFuture", DreamsFutureSchema);