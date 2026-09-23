import axios from "axios";
import imagekit from "../../../utils/imagekit";

export type GovernmentIdPhoto = {
  buffer: Buffer;
  mimeType: string;
};

export const getGovernmentIdPhoto = async (
  photoKey: string,
  userId: string
): Promise<GovernmentIdPhoto> => {

  // 1. Validate ImageKit file ID

  if (!photoKey || !userId) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_KEY_REQUIRED"
    );
  }

  // 2. Get file details from ImageKit

  const file = await imagekit.getFileDetails(
    photoKey
  );

  if (
    !file ||
    !file.filePath ||
    file.isPrivateFile !== true
  ) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_NOT_AVAILABLE"
    );
  }

  // 3. Verify that the image belongs
  // to the authenticated user

  const expectedFolder =
    `/government-id/${userId}/`;

  if (
    !file.filePath.startsWith(
      expectedFolder
    )
  ) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_ACCESS_DENIED"
    );
  }

  // 4. Generate a short-lived signed URL

  const signedUrl = imagekit.url({
    path: file.filePath,
    signed: true,
    expireSeconds: 60,
  });

  // 5. Download the original image
  // from private ImageKit storage

  const response = await axios.get<ArrayBuffer>(
    signedUrl,
    {
      responseType: "arraybuffer",

      timeout: 15000,

      maxContentLength: 5 * 1024 * 1024,

      maxRedirects: 0,
    }
  );

  // 6. Convert downloaded image to Buffer

  const buffer = Buffer.from(
    response.data
  );

  if (buffer.length === 0) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_EMPTY"
    );
  }

  // 7. Validate actual image format

  let mimeType: string;

  if (
    buffer.length >= 3 &&
    buffer.subarray(0, 3).equals(
      Buffer.from([0xff, 0xd8, 0xff])
    )
  ) {
    mimeType = "image/jpeg";

  } else if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ])
    )
  ) {
    mimeType = "image/png";

  } else {
    throw new Error(
      "INVALID_GOVERNMENT_ID_IMAGE_FORMAT"
    );
  }

  // 8. Return the actual image bytes

  return {
    buffer,
    mimeType,
  };
};