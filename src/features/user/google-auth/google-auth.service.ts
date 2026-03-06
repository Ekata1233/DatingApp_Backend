import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "./google-auth.utils";
import { prisma } from "../../../prisma/prismaClient";

export const googleLoginService = async (idToken: string) => {
  const googleData = await verifyGoogleToken(idToken);

  console.log("Google Data:", googleData); // Debugging log

  const { sub, email, name } = googleData;

  const user = await prisma.user.upsert({
    where: { google_id: sub },
    update: { email, name },
    create: { google_id: sub, email, name },
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  return { user, token };
};