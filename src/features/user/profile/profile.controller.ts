import { Request, Response } from "express";
import { answerValidation, bioValidation, familyProfileValidation, locationValidation, profileValidation, promptValidation } from "./profile.validation";
import {
  updateProfileService,
  updateInterestedInService,
  updateReligionService,
  updateLookingForService,
  updateLocationService,
  updateAddressService,
  // updateAboutYourselfService,
  updateUserAnswerService,
  uploadUserPhotosService,
  updateUserPhotoService,
  setPrimaryPhotoService,
  deleteUserPhotoService,
  updateUserBioService,
  updateEducationService,
  updateWorkService,
  updateFamilyProfileService,
  updateLanguageService,
  updateUserPromptService,
  completeOnboardingService,
  deleteUserMediaService,
  updateUserMediaService,
  uploadUserMediaService,
  updateUserVideoService
} from "./profile.service";
import { LookingFor } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "../../../prisma/prismaClient";

//Basic Info
export const profileController = async (req: Request, res: Response) => {
  try {
    // now user.id is available
    const userId = (req as any).user.id;

    const { fullName, email, birth_date, height, gender, gender_option } =
      profileValidation.parse(req.body);

    const user = await updateProfileService(
      userId,
      fullName,
      email,
      birth_date,
      height,
      gender,
      gender_option
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      onboarding_step: user.onboarding_step,
      next_step: user.next_step,
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Interested In
export const InterestedInController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const { interested_in, sexual_orientation } = req.body;

    const user = await updateInterestedInService(userId, interested_in, sexual_orientation);

    return res.status(200).json({
      success: true,
      message: "Interested in preference saved successfully",
      interested_in: user.updatedProfile.interested_in,
      sexual_orientation: user.updatedProfile.sexual_orientation,
      onboarding_step: user.updatedUser.onboarding_step,
      next_step: user.updatedUser.next_step,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Religion
export const ReligionController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { religionId, communityId } = req.body;

    const profile = await updateReligionService(
      userId,
      Number(religionId),
      Number(communityId)
    );

    return res.status(200).json({
      success: true,
      message: "Religion saved successfully",
      data: profile,
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Looking for
export const updateLookingForController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { optionId } = req.body;

    // Basic validation
    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: "optionId is required",
      });
    }

    // Find selected option
    const option = await prisma.intentionOption.findUnique({
      where: {
        id: optionId,
      },
    });

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "Invalid option",
      });
    }

    const user = await updateLookingForService(userId, optionId);

    return res.status(200).json({
      success: true,
      message: "Relationship preference saved successfully",
      intention: user.intention,
      onboarding_step: user.onboarding_step,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

//Address
export const addressController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { country, state, city } = req.body;

    const user = await updateAddressService(
      userId,
      country,
      state,
      city
    );

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      onboarding_step: user.onboarding.onboarding_step,
      data: user.profile,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Location
export const updateLocationController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { latitude, longitude } = locationValidation.parse(req.body);

    const profile = await updateLocationService(
      userId,
      latitude,
      longitude
    );

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        latitude: Number(profile.latitude),
        longitude: Number(profile.longitude),
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//About Yourself
// export const aboutYourselfController = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user.id;

//     const {
//       maritalStatus,
//       childStatus,
//       numberOfChildren,
//       childLivingArrangement,
//       livingSituation,
//     } = req.body;

//     const user = await updateAboutYourselfService(userId, {
//       maritalStatus,
//       childStatus,
//       numberOfChildren,
//       childLivingArrangement,
//       livingSituation,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "About yourself updated successfully",
//       onboarding_step: user.onboarding.onboarding_step,
//       next_step: user.onboarding.next_step,
//       data: user.profile,
//     });
//   } catch (error: any) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }

// };

//Save answer
export const saveUserAnswerController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const payload = answerValidation.parse(req.body);

    const result = await updateUserAnswerService(userId, payload);

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

//Education 
export const educatioController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const {
      highestEdu,
      collegeName,
      degree,
      graduationYear,
    } = req.body;

    const user = await updateEducationService(userId, {
      highestEdu,
      collegeName,
      degree,
      graduationYear,
    });

    return res.status(200).json({
      success: true,
      message: "Education updated successfully",
      onboarding_step: user.onboarding.onboarding_step,
      data: user.eduWork,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//work
export const workController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const {
      professionId,
      companyName,
      employmentTypeId,
      experienceId,
      ambitionId,
      salaryRangeId,
      bigDreams,
    } = req.body;

    const result = await updateWorkService(userId, {
      professionId,
      companyName,
      employmentTypeId,
      experienceId,
      ambitionId,
      salaryRangeId,
      bigDreams,
    });

    return res.status(200).json({
      success: true,
      message: "Work details updated successfully",
      onboarding_step: result.onboarding.onboarding_step,
      data: result.eduWork,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Family Profile
export const FamilyProfileController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const body = familyProfileValidation.parse(req.body);

    const user = await updateFamilyProfileService(userId, body);

    return res.status(200).json({
      success: true,
      message: "Family profile updated successfully.",
      data: user.updatedProfile,
      onboarding_step: user.updatedUser.onboarding_step,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Languages
export const LanguageController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { languageIds } = req.body;

    const languages = await updateLanguageService(
      userId,
      languageIds
    );

    return res.status(200).json({
      success: true,
      message: "Languages saved successfully",
      data: languages,
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Photos
export const uploadPhotoController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: "Images are required",
      });
    }

    let images: any = req.files.images;

    if (!Array.isArray(images)) {
      images = [images];
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    for (const image of images) {
      if (!image.mimetype.startsWith("image")) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed.",
        });
      }

      if (image.size > MAX_FILE_SIZE) {
        return res.status(413).json({
          success: false,
          message: "Each image must be smaller than 5 MB.",
        });
      }
    }

    const result = await uploadUserMediaService(
      userId,
      images,
      "IMAGE",
    );

    return res.status(200).json({
      success: true,
      message: "Photos uploaded successfully",
      onboarding_step: result.onboarding.onboarding_step,
      next_step: result.onboarding.next_step,
      data: result.media,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePhotoController = async (
  req: Request<{ photoId: string }>,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;
    const { photoId } = req.params;

    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const image = req.files.image;

    if (!image.mimetype.startsWith("image")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed.",
      });
    }

    const photo = await updateUserMediaService(
      userId,
      photoId,
      image,
      "IMAGE",
    );

    return res.status(200).json({
      success: true,
      message: "Photo updated successfully",
      data: photo,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const setPrimaryPhotoController = async (
  req: Request<{ photoId: string }>,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;
    const { photoId } = req.params;

    const photo = await setPrimaryPhotoService(userId, photoId);

    return res.status(200).json({
      success: true,
      message: "Primary photo updated",
      data: photo,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePhotoController = async (
  req: Request<{ photoId: string }>,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;
    const { photoId } = req.params;

    const result = await deleteUserMediaService(
      userId,
      photoId,
      "IMAGE",
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const deleteVideoController = async (
  req: Request<{ videoId: string }>,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;
    const { videoId } = req.params;

    const result = await deleteUserMediaService(
      userId,
      videoId,
      "VIDEO",
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateVideoController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: "Video is required",
      });
    }

    const video = req.files.video;

    if (!video.mimetype.startsWith("video")) {
      return res.status(400).json({
        success: false,
        message: "Only video files are allowed.",
      });
    }

    const updatedVideo = await updateUserVideoService(
      userId,
      video,
    );

    return res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: updatedVideo,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserBioController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { bio } = bioValidation.parse(req.body);

    const result = await updateUserBioService(userId, bio);

    return res.status(200).json({
      success: true,
      message: "Bio updated successfully",
      onboarding_step: result.onboarding.onboarding_step,
      next_step: result.onboarding.next_step,
      data: result.bio,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message, // ✅ FIXED
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

//prompt
export const UserPromptController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { prompts } = promptValidation.parse(req.body);

    const data = await updateUserPromptService(userId, prompts);

    return res.status(200).json({
      success: true,
      message: "Prompts saved successfully",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const completeOnboardingController = async (
  req: any,
  res: any
) => {
  try {
    const userId = req.user.id;

    const user = await completeOnboardingService(userId);

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully.",
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};