import {
  Request,
  Response,
  NextFunction,
} from "express";
import authMiddleware from "./auth.middleware";


export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  // STEP 1 - No token: allow guest access

  if (authorization === undefined) {
    console.log(
      "[OPTIONAL AUTH] No token provided - Guest access",
    );

    return next();
  }

  // STEP 2 - Validate authorization format

  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return res.status(401).json({
      success: false,
      message: "Invalid authorization header",
    });
  }

  // STEP 3 - Token provided: validate using existing middleware

  console.log(
    "[OPTIONAL AUTH] Token provided - Validating user",
  );

  return authMiddleware(req, res, next);
};