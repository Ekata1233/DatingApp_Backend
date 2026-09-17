// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";

// interface JwtPayload {
//   userId: string;
// }

// const authMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({
//         success: false,
//         message: "Authorization token missing",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token format",
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

//     // attach userId correctly
//     (req as any).user = {
//       id: decoded.userId,
//     };

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token",
//     });
//   }
// };

// export default authMiddleware;


import {
  Request,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/prismaClient";

// change path according to your project

interface JwtPayload {
  userId: string;
  sessionId: string;
}

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    /* =====================================================
       AUTHORIZATION HEADER
    ===================================================== */

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "Authorization token missing",
      });
    }

    /* =====================================================
       TOKEN FORMAT
    ===================================================== */

    const [scheme, token] =
      authHeader.split(" ");

    if (
      scheme !== "Bearer" ||
      !token
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    /* =====================================================
       JWT SECRET
    ===================================================== */

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message:
          "JWT secret is not configured",
      });
    }

    /* =====================================================
       VERIFY JWT
    ===================================================== */

    const decoded = jwt.verify(
      token,
      jwtSecret,
    ) as JwtPayload;

    if (
      !decoded.userId ||
      !decoded.sessionId
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    /* =====================================================
       CHECK SESSION
    ===================================================== */

    const session =
      await prisma.userSession.findFirst({
        where: {
          id: decoded.sessionId,
          userId: decoded.userId,
          isActive: true,

          expiresAt: {
            gt: new Date(),
          },
        },

        select: {
          id: true,
          userId: true,
          isActive: true,
          expiresAt: true,
        },
      });

    if (!session) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired or logged out",
      });
    }

    /* =====================================================
       CHECK USER ACCOUNT STATUS
    ===================================================== */

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        account_status: true,
        deleted_at: true,
      },
    });

    /* =====================================================
       USER NOT FOUND
    ===================================================== */

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    /* =====================================================
       BLOCK DELETED ACCOUNT
    ===================================================== */

    if (
      user.account_status === "DELETED" ||
      user.deleted_at !== null
    ) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DELETED",
        message:
          "This account has been deleted. You cannot access this account.",
      });
    }

    /* =====================================================
       IMPORTANT - DO NOT BLOCK PAUSED ACCOUNT
    ===================================================== */

    // PAUSED users are allowed through authentication.
    //
    // This is required because the paused user needs
    // authentication to call:
    //
    // PATCH /api/user/account/resume
    //
    // Therefore:
    //
    // ACTIVE  -> allowed
    // PAUSED  -> allowed
    // DELETED -> blocked

    /* =====================================================
       ATTACH AUTH USER
    ===================================================== */

    (req as any).user = {
      id: decoded.userId,
      sessionId: decoded.sessionId,
    };

    next();

  } catch (error: any) {

    if (
      error?.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    if (
      error?.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    console.error(
      "Auth Middleware Error:",
      error,
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
};

export default authMiddleware;