import { Request, Response } from "express";
import { boostFeaturesSchema, boostInfoSchema, createBoostSchema } from "./boost.validation";
import { createBoostService, createOrUpdateBoostFeaturesService, createOrUpdateBoostInfoService, deleteBoostInfoService, getBoostFeaturesService, getBoostInfoService, getBoostsService, resetBoostFeaturesService } from "./boost.service";
import { BoostType } from "@prisma/client";



// ✅ CREATE BOOST
export const createBoostController = async (req: Request, res: Response) => {
  try {
    const parsed = createBoostSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
      });
    }

    const result = await createBoostService(parsed.data); // ✅ FIXED

    return res.status(201).json({
      success: true,
      message: "Boost created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



// ✅ GET ALL BOOSTS
export const getBoostsController = async (req: Request, res: Response) => {
  try {
    const result = await getBoostsService(); // ✅ FIXED

    return res.status(200).json({
      success: true,
      message: "Boosts fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// CREATE / UPDATE BOOST INFO
// ============================================================

export const createOrUpdateBoostInfoController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = boostInfoSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
      });
    }

    const result = await createOrUpdateBoostInfoService(parsed.data);

    return res.status(200).json({
      success: true,
      message: "Boost info saved successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message.includes("does not exist")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET BOOST INFO
// ============================================================

export const getBoostInfoController = async (
  req: Request,
  res: Response
) => {
  try {
   const { name } = req.params;

if (typeof name !== "string") {
  return res.status(400).json({
    success: false,
    message: "Invalid boost name",
  });
}

if (!["BOOST", "PRIMETIME", "SUPER"].includes(name)) {
  return res.status(400).json({
    success: false,
    message: "Invalid boost type",
  });
}

    const result = await getBoostInfoService(
      name as "BOOST" | "PRIMETIME" | "SUPER"
    );

    return res.status(200).json({
      success: true,
      message: "Boost info fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "Boost not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Boost not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// DELETE BOOST INFO
// ============================================================

export const deleteBoostInfoController = async (
  req: Request,
  res: Response
) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Boost name is required",
      });
    }

   

if (typeof name !== "string") {
  return res.status(400).json({
    success: false,
    message: "Invalid boost name",
  });
}

if (!["BOOST", "PRIMETIME", "SUPER"].includes(name)) {
  return res.status(400).json({
    success: false,
    message: "Invalid boost type",
  });
}

    const result = await deleteBoostInfoService(
      name as "BOOST" | "PRIMETIME" | "SUPER"
    );

    return res.status(200).json({
      success: true,
      message: "Boost info deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "Boost not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Boost not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// ============================================================
// CREATE / UPDATE BOOST FEATURES
// ============================================================

export const createOrUpdateBoostFeaturesController = async (
  req: Request,
  res: Response
) => {
  try {
    const parsed = boostFeaturesSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
      });
    }

    const result =
      await createOrUpdateBoostFeaturesService(parsed.data);

    return res.status(200).json({
      success: true,
      message: "Boost features saved successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message.includes("does not exist")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET BOOST FEATURES
// ============================================================

export const getBoostFeaturesController = async (
  req: Request,
  res: Response
) => {
  try {
    const { name } = req.params;

    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid boost name",
      });
    }

    if (!["BOOST", "PRIMETIME", "SUPER"].includes(name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid boost type",
      });
    }

    const result = await getBoostFeaturesService(
      name as BoostType
    );

    return res.status(200).json({
      success: true,
      message: "Boost features fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "Boost not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Boost not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// RESET BOOST FEATURES
// ============================================================

export const resetBoostFeaturesController = async (
  req: Request,
  res: Response
) => {
  try {
    const { name } = req.params;

    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid boost name",
      });
    }

    if (!["BOOST", "PRIMETIME", "SUPER"].includes(name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid boost type",
      });
    }

    const result = await resetBoostFeaturesService(
      name as BoostType
    );

    return res.status(200).json({
      success: true,
      message: "Boost features reset successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "Boost not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Boost not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};