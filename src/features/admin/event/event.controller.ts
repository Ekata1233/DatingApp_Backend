import { Request, Response, NextFunction } from "express";
import * as EventService from "./event.service";
import { UpdateEventExperienceInput } from "./event.types";
import imagekit from "../../../utils/imagekit";
interface EventParams {
  id: string;
}
//first step - basic
export const createEventController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await EventService.createEvent(req.body);

    return res.status(201).json({
      success: true,
      message: "Event draft created successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

//second step -host
export const updateEventHostController = async (
  req: Request<EventParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await EventService.updateEventHost(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Host details updated successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

//third step-venue
export const updateEventVenueController = async (
  req: Request<EventParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await EventService.updateEventVenue(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Venue details updated successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

//fourth step-ticket
export const updateEventTicketsController = async (
  req: Request<EventParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const event =
      await EventService.updateEventTickets(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Ticket details updated successfully",
      data: event,
    });
  } catch (error) {
    next(error);
  }
};


//fifth step-experience
export const updateEventExperienceController = async (
  req: Request<EventParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    // ==========================================
    // FILES
    // ==========================================

    const files = req.files as any;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    // ==========================================
    // HERO IMAGE
    // ==========================================

    let heroImageUrl: string | undefined;

    if (files?.heroImage) {
      const heroFile = Array.isArray(files.heroImage)
        ? files.heroImage[0]
        : files.heroImage;

      // 5 MB validation
      if (heroFile.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: "Hero image size must be less than 5 MB.",
        });
      }

      // Image type validation
      if (!allowedTypes.includes(heroFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Hero image must be JPG, PNG or WEBP.",
        });
      }

      // Upload Hero Image
      const uploadResponse = await imagekit.upload({
        file: heroFile.buffer || heroFile.data,

        fileName: `${Date.now()}-${heroFile.originalname}`,

        folder: "/events/hero",
      });

      heroImageUrl = uploadResponse.url;
    }

    // ==========================================
    // GALLERY IMAGES
    // ==========================================

    const galleryImageUrls: {
      imageUrl: string;
      sortOrder: number;
    }[] = [];

    if (files?.galleryImages) {
      const galleryFiles = Array.isArray(
        files.galleryImages
      )
        ? files.galleryImages
        : [files.galleryImages];

      // Maximum 20 images
      if (galleryFiles.length > 20) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 20 gallery images are allowed.",
        });
      }

      // Upload images one by one
      for (
        let index = 0;
        index < galleryFiles.length;
        index++
      ) {
        const galleryFile = galleryFiles[index];

        // 5 MB validation
        if (
          galleryFile.size >
          5 * 1024 * 1024
        ) {
          return res.status(400).json({
            success: false,
            message: `Gallery image ${
              index + 1
            } must be less than 5 MB.`,
          });
        }

        // Image type validation
        if (
          !allowedTypes.includes(
            galleryFile.mimetype
          )
        ) {
          return res.status(400).json({
            success: false,
            message: `Gallery image ${
              index + 1
            } must be JPG, PNG or WEBP.`,
          });
        }

        // Upload to ImageKit
        const uploadResponse =
          await imagekit.upload({
            file:
              galleryFile.buffer ||
              galleryFile.data,

            fileName: `${Date.now()}-${index}-${galleryFile.originalname}`,

            folder: "/events/gallery",
          });

        // Save URL + index
        galleryImageUrls.push({
          imageUrl: uploadResponse.url,
          sortOrder: index,
        });
      }
    }

    // ==========================================
    // BODY
    // ==========================================

    const body = req.body;

    // ==========================================
    // PARSE AMENITIES
    // ==========================================

    let amenities = [];

    try {
      amenities =
        typeof body.amenities === "string"
          ? JSON.parse(body.amenities)
          : body.amenities || [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid amenities JSON.",
      });
    }

    // ==========================================
    // PARSE ITINERARY
    // ==========================================

    let itinerary = [];

    try {
      itinerary =
        typeof body.itinerary === "string"
          ? JSON.parse(body.itinerary)
          : body.itinerary || [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid itinerary JSON.",
      });
    }

    // ==========================================
    // PARSE WHY SHOULD COME
    // ==========================================

    let whyShouldCome = [];

    try {
      whyShouldCome =
        typeof body.whyShouldCome === "string"
          ? JSON.parse(body.whyShouldCome)
          : body.whyShouldCome || [];
    } catch {
      return res.status(400).json({
        success: false,
        message:
          "Invalid whyShouldCome JSON.",
      });
    }

    // ==========================================
    // PAYLOAD
    // ==========================================

    const payload: UpdateEventExperienceInput = {
      heroImage: heroImageUrl,

      aboutEvent: body.aboutEvent,

      galleryImages: galleryImageUrls,

      amenities,

      itinerary,

      whyShouldCome,
    };

    // ==========================================
    // SERVICE
    // ==========================================

    const event =
      await EventService.updateEventExperience(
        req.params.id,
        payload
      );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message:
        "Event experience updated successfully",
      data: event,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error?.errors?.[0]?.message ||
        error?.message ||
        "Something went wrong",
    });
  }
};

//sixth step-safety
export const updateEventSafetyController = async (
  req: Request<EventParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const event =
      await EventService.updateEventSafety(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Event safety details updated successfully",
      data: event,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error?.errors?.[0]?.message ||
        error?.message ||
        "Something went wrong",
    });
  }
};

//seventh step-review & publish 
export const publishEventController = async (
  req: Request<EventParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const event =
      await EventService.publishEvent(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message: "Event published successfully",
      data: event,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error?.message ||
        "Failed to publish event",
    });
  }
};

//get apis
//get all
export const getAllEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await EventService.getAllEvents();

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

//get for mobile card
export const getEventListController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await EventService.getEventList();

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

//get details
export const getEventDetailsController = async (
  req: Request<EventParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const event =
      await EventService.getEventDetails(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message: "Event details fetched successfully",
      data: event,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message:
        error?.message ||
        "Failed to fetch event details",
    });
  }
};