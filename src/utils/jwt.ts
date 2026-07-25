import jwt from "jsonwebtoken";

export const generateAccessToken = (
  employeeId: string,
  roleId: string
) => {
  return jwt.sign(
    {
      employeeId,
      roleId,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};