// import { Request, Response, NextFunction } from "express";
// import { prisma } from "../prisma/prismaClient";
// import { getUserLimits } from "../utils/subscription.util";

// interface AuthRequest extends Request {
//   user: {
//     id: string;
//   };
//   userPackage?: any;
// }

// export const checkSwipeLimit = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userPackage = await prisma.userPackage.findFirst({
//       where: {
//         user_id: req.user.id,
//         status: "ACTIVE",
//         OR: [
//           {
//             endDate: null,
//           },
//           {
//             endDate: {
//               gt: new Date(),
//             },
//           },
//         ],
//       },
//       include: {
//         package: {
//           include: {
//             limits: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     if (!userPackage) {
//       // Free user
//       const limits = getUserLimits(null);

//       // Your free-user swipe usage should be handled here
//       // if it is stored in UserPlanUsage.

//       req.userPackage = undefined;

//       return next();
//     }

//     const limits = getUserLimits(userPackage.package);

//     // Find swipe usage
//     const swipeUsage = await prisma.userPlanUsage.findFirst({
//       where: {
//         userId: req.user.id,
//         feature: {
//           // IMPORTANT:
//           // Replace this with your actual PackageFeature
//           // identifier/code for SWIPE.
//           code: "SWIPE",
//         },
//       },
//       include: {
//         feature: true,
//       },
//     });

//     const currentSwipes = swipeUsage?.used ?? 0;

//     if (
//       limits.swipeLimit !== Infinity &&
//       currentSwipes >= limits.swipeLimit
//     ) {
//       return res.status(403).json({
//         message: "Swipe limit reached",
//       });
//     }

//     req.userPackage = userPackage;

//     next();
//   } catch (error) {
//     console.error("Swipe Limit Error:", error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// export const checkLikeLimit = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userPackage = await prisma.userPackage.findFirst({
//       where: {
//         user_id: req.user.id,
//         status: "ACTIVE",
//         OR: [
//           {
//             endDate: null,
//           },
//           {
//             endDate: {
//               gt: new Date(),
//             },
//           },
//         ],
//       },
//       include: {
//         package: {
//           include: {
//             limits: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     if (!userPackage) {
//       const limits = getUserLimits(null);

//       req.userPackage = undefined;

//       return next();
//     }

//     const limits = getUserLimits(userPackage.package);

//     // Find like usage
//     const likeUsage = await prisma.userPlanUsage.findFirst({
//       where: {
//         userId: req.user.id,
//         feature: {
//           // IMPORTANT:
//           // Replace this with your actual PackageFeature
//           // identifier/code for LIKE.
//           code: "LIKE",
//         },
//       },
//       include: {
//         feature: true,
//       },
//     });

//     const currentLikes = likeUsage?.used ?? 0;

//     if (
//       limits.likeLimit !== Infinity &&
//       currentLikes >= limits.likeLimit
//     ) {
//       return res.status(403).json({
//         message: "Like limit reached",
//       });
//     }

//     req.userPackage = userPackage;

//     next();
//   } catch (error) {
//     console.error("Like Limit Error:", error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };