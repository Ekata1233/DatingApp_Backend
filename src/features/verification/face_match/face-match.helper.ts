import axios from "axios";

export const getUserProfilePhoto = async (
  mediaUrl: string
): Promise<Buffer> => {
  if (!mediaUrl) {
    throw new Error(
      "USER_PROFILE_PHOTO_URL_REQUIRED"
    );
  }

  try {
    const response =
      await axios.get<ArrayBuffer>(
        mediaUrl,
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
        "USER_PROFILE_PHOTO_EMPTY"
      );
    }

    // JPEG
    const isJpeg =
      buffer.length >= 3 &&
      buffer
        .subarray(0, 3)
        .equals(
          Buffer.from([
            0xff,
            0xd8,
            0xff,
          ])
        );

    // PNG
    const isPng =
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
        );

    if (!isJpeg && !isPng) {
      throw new Error(
        "INVALID_USER_PROFILE_PHOTO_FORMAT"
      );
    }

    return buffer;
  } catch (error: any) {
    if (
      error.message ===
        "USER_PROFILE_PHOTO_EMPTY" ||
      error.message ===
        "INVALID_USER_PROFILE_PHOTO_FORMAT"
    ) {
      throw error;
    }

    console.error(
      "User profile photo download failed:",
      {
        status: error.response?.status,
        message: error.message,
      }
    );

    throw new Error(
      "USER_PROFILE_PHOTO_DOWNLOAD_FAILED"
    );
  }
};