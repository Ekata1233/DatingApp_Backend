import { Request, Response, NextFunction } from "express";
import authMiddleware from "./auth.middleware";

export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  // No token provided: allow guest access
  if (authorization === undefined) {
    return next();
  }

  // Token provided: validate using existing middleware
  return authMiddleware(req, res, next);
};