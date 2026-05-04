import { Request, Response } from "express";
import { createBoostSchema } from "./boost.validation";
import { createBoostService, getBoostsService } from "./boost.service";



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
