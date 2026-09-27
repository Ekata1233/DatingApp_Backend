import axios from "axios";
import imagekit from "../../../utils/imagekit";

export type GovernmentIdPhoto = {
  buffer: Buffer;
  mimeType: string;
};

// export const getGovernmentIdPhoto = async (
//   photoKey: string,
//   userId: string
// ): Promise<GovernmentIdPhoto> => {

//   // 1. Validate ImageKit file ID

//   if (!photoKey || !userId) {
//     throw new Error(
//       "GOVERNMENT_ID_PHOTO_KEY_REQUIRED"
//     );
//   }

//   // 2. Get file details from ImageKit

//   const file = await imagekit.getFileDetails(
//     photoKey
//   );

//   if (
//     !file ||
//     !file.filePath ||
//     file.isPrivateFile !== true
//   ) {
//     throw new Error(
//       "GOVERNMENT_ID_PHOTO_NOT_AVAILABLE"
//     );
//   }

//   // 3. Verify that the image belongs
//   // to the authenticated user

//   const expectedFolder =
//     `/government-id/${userId}/`;

//   if (
//     !file.filePath.startsWith(
//       expectedFolder
//     )
//   ) {
//     throw new Error(
//       "GOVERNMENT_ID_PHOTO_ACCESS_DENIED"
//     );
//   }

//   // 4. Generate a short-lived signed URL

//   const signedUrl = imagekit.url({
//     path: file.filePath,
//     signed: true,
//     expireSeconds: 60,
//   });



//   // 5. Download the original image
//   // from private ImageKit storage
// console.log("ImageKit file details:", {
//   fileId: file.fileId,
//   name: file.name,
//   filePath: file.filePath,
//   url: file.url,
//   isPrivateFile: file.isPrivateFile,
// });

// console.log("Generated signed URL:", signedUrl);

//   const response = await axios.get<ArrayBuffer>(
//     signedUrl,
//     {
//       responseType: "arraybuffer",

//       timeout: 15000,

//       maxContentLength: 5 * 1024 * 1024,

//       maxRedirects: 0,
//     }
//   );

//   // 6. Convert downloaded image to Buffer

//   const buffer = Buffer.from(
//     response.data
//   );

//   if (buffer.length === 0) {
//     throw new Error(
//       "GOVERNMENT_ID_PHOTO_EMPTY"
//     );
//   }

//   // 7. Validate actual image format

//   let mimeType: string;

//   if (
//     buffer.length >= 3 &&
//     buffer.subarray(0, 3).equals(
//       Buffer.from([0xff, 0xd8, 0xff])
//     )
//   ) {
//     mimeType = "image/jpeg";

//   } else if (
//     buffer.length >= 8 &&
//     buffer.subarray(0, 8).equals(
//       Buffer.from([
//         0x89, 0x50, 0x4e, 0x47,
//         0x0d, 0x0a, 0x1a, 0x0a,
//       ])
//     )
//   ) {
//     mimeType = "image/png";

//   } else {
//     throw new Error(
//       "INVALID_GOVERNMENT_ID_IMAGE_FORMAT"
//     );
//   }

//   // 8. Return the actual image bytes

//   return {
//     buffer,
//     mimeType,
//   };
// };

export const getGovernmentIdPhoto = async (
  photoKey: string,
  userId: string
): Promise<GovernmentIdPhoto> => {
  if (!photoKey || !userId) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_KEY_REQUIRED"
    );
  }

  const file =
    await imagekit.getFileDetails(photoKey);

  console.log("ImageKit file details:", {
    fileId: file.fileId,
    name: file.name,
    filePath: file.filePath,
    url: file.url,
    isPrivateFile: file.isPrivateFile,
  });

  if (
    !file ||
    !file.filePath ||
    file.isPrivateFile !== true
  ) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_NOT_AVAILABLE"
    );
  }

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

  // Sign the clean ImageKit path.
  const signedUrl = imagekit.url({
    path: file.filePath,
    signed: true,
    expireSeconds: 300,
  });

  console.log(
    "Generated signed URL:",
    signedUrl
  );

  try {
    const response =
      await axios.get<ArrayBuffer>(
        signedUrl,
        {
          responseType: "arraybuffer",
          timeout: 15000,
          maxContentLength:
            5 * 1024 * 1024,
        }
      );

    const buffer = Buffer.from(
      response.data
    );

    if (buffer.length === 0) {
      throw new Error(
        "GOVERNMENT_ID_PHOTO_EMPTY"
      );
    }

    let mimeType: string;

    if (
      buffer.length >= 3 &&
      buffer
        .subarray(0, 3)
        .equals(
          Buffer.from([
            0xff,
            0xd8,
            0xff,
          ])
        )
    ) {
      mimeType = "image/jpeg";
    } else if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(
          Buffer.from([
            0x89,
            0x50,
            0x4e,
            0x47,
            0x0d,
            0x0a,
            0x1a,
            0x0a,
          ])
        )
    ) {
      mimeType = "image/png";
    } else {
      throw new Error(
        "INVALID_GOVERNMENT_ID_IMAGE_FORMAT"
      );
    }

    return {
      buffer,
      mimeType,
    };
  } catch (error: any) {
    console.error(
      "ImageKit private image download failed:",
      {
        status:
          error.response?.status,

        data: error.response?.data
          ? Buffer.from(
              error.response.data
            ).toString("utf8")
          : undefined,
      }
    );

    throw error;
  }
};