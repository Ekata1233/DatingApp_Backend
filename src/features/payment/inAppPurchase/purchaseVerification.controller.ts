import { Request, Response } from "express";

import { verifyPurchaseSchema } from
  "./purchaseVerification.schema";

import { verifyPurchaseService } from
  "./purchaseVerification.service";

export const verifyPurchaseController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const parsed = verifyPurchaseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase verification data",
        errors: parsed.error.flatten(),
      });
    }

    const result = await verifyPurchaseService(
      userId,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      message:
        "Membership successfully verified and activated.",
      data: result,
    });
  } catch (error) {
    console.error("Verify purchase error:", error);

    // Do not expose raw store-provider or database errors
    // to mobile clients in production.
    return res.status(400).json({
      success: false,
      message:
        "Purchase verification could not be completed.",
    });
  }
};