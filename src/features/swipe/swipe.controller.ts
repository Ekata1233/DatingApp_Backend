// // modules/swipe/swipe.controller.ts

// import { Request, Response } from "express";
// import { swipeService } from "./swipe.service";
// import { swipeSchema } from "./swipe.validation";

// export const swipeController = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user.id;

//     const parsed = swipeSchema.parse(req.body);

//     const result = await swipeService({
//       userId,
//       targetUserId: parsed.targetUserId,
//       action: parsed.action,
//     });

//     res.json({
//       success: true,
//       ...result,
//     });
//   } catch (error: any) {
//     console.error("Swipe Error:", error);

//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

import { Request, Response } from "express";
import { handleSwipe } from "./swipe.service";

export const swipeUser = async (req: Request, res: Response) => {
  try {
    const { targetUserId, action } = req.body;
    const swiperId = (req as any).user.id;

    const result = await handleSwipe({
      swiperId,
      targetUserId,
      action,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
