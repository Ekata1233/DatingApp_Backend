import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "./google-auth.utils";
import connectPostgres from "../../../config/db";

export const googleLoginService = async (idToken: string) => {
  const googleData = await verifyGoogleToken(idToken);

  const { sub, email, name } = googleData;

  const pool = connectPostgres(); // ✅ Get pool

  // ✅ Check if user exists
  const existingUser = await pool.query(
    "SELECT * FROM users WHERE google_id = $1",
    [sub]
  );

  let user;

  if (existingUser.rows.length === 0) {
    // ✅ Insert user
    const insertUser = await pool.query(
      `INSERT INTO users (name, google_id)
       VALUES ($1, $2)
       RETURNING *`,
      [name, sub]
    );

    user = insertUser.rows[0];
  } else {
    user = existingUser.rows[0];
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "30d" }
  );

  return { user, token };
};
