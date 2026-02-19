import { LatestPhotos } from "./latestPhotos.model";
import { ILatestPhotos } from "./latestPhotos.types";

// Replace existing document
export const createLatestPhotos = async (
  payload: ILatestPhotos
): Promise<ILatestPhotos> => {
  await LatestPhotos.deleteMany({});
  return LatestPhotos.create(payload);
};

export const getLatestPhotos = async (): Promise<ILatestPhotos | null> => {
  return LatestPhotos.findOne().lean();
};

export const deleteLatestPhotos = async (): Promise<void> => {
  await LatestPhotos.deleteMany({});
};

// Update specific photo
export const updateSinglePhoto = async (
  photoId: string,
  imageUrl: string
) => {
  return LatestPhotos.findOneAndUpdate(
    { "photos._id": photoId },
    {
      $set: {
        "photos.$.image": imageUrl,
      },
    },
    { new: true }
  );
};
