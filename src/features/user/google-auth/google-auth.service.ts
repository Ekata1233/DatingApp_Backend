import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "./google-auth.utils";
import { prisma } from "../../../prisma/prismaClient";

export const googleLoginService = async (idToken: string) => {
  const googleData = await verifyGoogleToken(idToken);

  const { sub, email, name } = googleData;

  const user = await prisma.user.upsert({
    where: { google_id: sub },
    update: { email, full_name: name },
    create: { google_id: sub, email, full_name: name },
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return { user, token };
};