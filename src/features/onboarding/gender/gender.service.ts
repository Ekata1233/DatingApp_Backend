import { GenderModel } from "./gender.model";
import { IGender } from "./gender.types";

export const createGender = async (payload: Partial<IGender>) => {
  return await GenderModel.create(payload);
};

export const getAllGenders = async () => {
  return await GenderModel.find().sort({ createdAt: -1 });
};

export const getGenderById = async (id: string) => {
  return await GenderModel.findById(id);
};

export const updateGender = async (
  id: string,
  payload: Partial<IGender>
) => {
  return await GenderModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const deleteGender = async (id: string) => {
  return await GenderModel.findByIdAndDelete(id);
};
