import { Request, Response } from "express";
import { answerValidation, locationValidation, profileValidation } from "./profile.validation";
import {
  updateProfileService,
  updateInterestedInService,
  updateReligionService,
  updateLookingForService,
  updateLocationService,
  updateAddressService,
  updateAboutYourselfService,
  updateUserAnswerService,
  uploadUserPhotosService,
  updateUserPhotoService,
  setPrimaryPhotoService,
  deleteUserPhotoService,
  updateUserBioService,
  updateEducationService,
  updateWorkService
} from "./profile.service";
import { LookingFor } from "@prisma/client";

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
export const ReligionController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { religion, community } = req.body;

    const profile = await updateReligionService(userId, religion, community);

    return res.status(200).json({
      success: true,
      message: "Religion saved successfully",
      religion: profile.religion,
      community: profile.community
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

    const { intentionId } = req.body;

    // Basic validation
    if (!intentionId) {
      return res.status(400).json({
        success: false,
        message: "intentionId is required",
      });
    }
    const intention = await prisma.intention.findUnique({
      where: {
        id: intentionId,
      },
    });

    if (!intention) {
      return res.status(404).json({
        success: false,
        message: "Invalid intention",
      });
    }

    const user = await updateLookingForService(userId, intentionId);

    return res.status(200).json({
      success: true,
      message: "Relationship preference saved successfully",
      intention: user.intention,
      onboarding_step: user.onboarding_step,
      next_step: user.next_step,
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
export const aboutYourselfController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const {
      maritalStatus,
      childStatus,
      numberOfChildren,
      childLivingArrangement,
      livingSituation,
    } = req.body;

    const user = await updateAboutYourselfService(userId, {
      maritalStatus,
      childStatus,
      numberOfChildren,
      childLivingArrangement,
      livingSituation,
    });

    return res.status(200).json({
      success: true,
      message: "About yourself updated successfully",
      onboarding_step: user.onboarding.onboarding_step,
      next_step: user.onboarding.next_step,
      data: user.profile,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

};

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
      employmentTypeId,
      experienceId,
      ambitionId,
      salaryRangeId,
    } = req.body;

    const result = await updateWorkService(userId, {
      professionId,
      employmentTypeId,
      experienceId,
      ambitionId,
      salaryRangeId,
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

export const uploadPhotosController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if (!req.files || !req.files.images) {
      return res.status(400).json({
        success: false,
        message: "Images are required",
      });
    }

    let images = req.files.images;

    if (!Array.isArray(images)) {
      images = [images];
    }

    const result = await uploadUserPhotosService(userId, images);

    return res.status(200).json({
      success: true,
      message: "Photos uploaded successfully",
      onboarding_step: result.onboarding.onboarding_step,
      next_step: result.onboarding.next_step,
      data: result.photos,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePhotoController = async (req: Request<{ photoId: string }>, res: Response) => {
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

    const photo = await updateUserPhotoService(userId, photoId, image);

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
  res: Response
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
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const { photoId } = req.params;

    const result = await deleteUserPhotoService(userId, photoId);

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

//Bio
import { bioValidation } from "./profile.validation";
import { ZodError } from "zod";
import { prisma } from "../../../prisma/prismaClient";

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