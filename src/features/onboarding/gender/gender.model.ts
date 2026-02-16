import { model, Schema } from "mongoose";
import { IGender, IGenderOption } from "./gender.types";

const GenderOptionSchema = new Schema<IGenderOption>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false } // optional but recommended for subdocuments
);

const GenderSchema = new Schema<IGender>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [GenderOptionSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const GenderModel = model<IGender>("Gender", GenderSchema);