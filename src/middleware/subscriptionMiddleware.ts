// import { prisma } from "../prisma/prismaClient";
// import { getUserLimits, resetDailyCountsIfNeeded } from "../utils/subscription.util";

// export const checkSwipeLimit = async (req, res, next) => {
//   try {
//     // ✅ Get user with current subscription
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       include: {
//         currentSubscription: true,
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     let subscription = user.currentSubscription;

//     // ✅ Reset daily counts
//     if (subscription) {
//       subscription = await resetDailyCountsIfNeeded(subscription);
//     }

//     // ✅ Get limits
//     const limits = getUserLimits(subscription);

//     // ✅ Check swipe limit
//     const currentSwipes = subscription?.daily_swipe_count || 0;

//     if (currentSwipes >= limits.swipeLimit) {
//       return res.status(403).json({
//         message: "Swipe limit reached",
//       });
//     }

//     // ✅ Attach subscription to request (optional but useful)
//     req.subscription = subscription;

//     next();
//   } catch (error) {
//     console.error("Swipe Limit Error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const checkLikeLimit = async (req, res, next) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.user.id },
//       include: {
//         currentSubscription: true,
//       },
//     });

//     let subscription = user.currentSubscription;

//     if (subscription) {
//       subscription = await resetDailyCountsIfNeeded(subscription);
//     }

//     const limits = getUserLimits(subscription);

//     const currentLikes = subscription?.daily_like_count || 0;

//     if (currentLikes >= limits.likeLimit) {
//       return res.status(403).json({
//         message: "Like limit reached",
//       });
//     }

//     req.subscription = subscription;

//     next();
//   } catch (error) {
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/prismaClient";
import {
  getUserLimits,
  resetDailyCountsIfNeeded,
} from "../utils/subscription.util";

// ✅ Extend Request type to support custom fields
interface AuthRequest extends Request {
  user: {
    id: string;
  };
  subscription?: any;
}

export const checkSwipeLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ Get user with current subscription
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        currentSubscription: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let subscription = user.currentSubscription;

    // ✅ Reset daily counts
    if (subscription) {
      subscription = await resetDailyCountsIfNeeded(subscription);
    }

    // ✅ Get limits
    const limits = getUserLimits(subscription);

    // ✅ Check swipe limit
    const currentSwipes = subscription?.daily_swipe_count || 0;

    if (currentSwipes >= limits.swipeLimit) {
      return res.status(403).json({
        message: "Swipe limit reached",
      });
    }

    // ✅ Attach subscription to request
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error("Swipe Limit Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const checkLikeLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        currentSubscription: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let subscription = user.currentSubscription;

    if (subscription) {
      subscription = await resetDailyCountsIfNeeded(subscription);
    }

    const limits = getUserLimits(subscription);

    const currentLikes = subscription?.daily_like_count || 0;

    if (currentLikes >= limits.likeLimit) {
      return res.status(403).json({
        message: "Like limit reached",
      });
    }

    req.subscription = subscription;

    next();
  } catch (error) {
    console.error("Like Limit Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
