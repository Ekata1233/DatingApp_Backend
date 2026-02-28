import connectPostgres from "../../../config/db";
import { User } from "./users.types";

export async function fetchAllUsers(): Promise<User[]> {
  try {
    const pool = connectPostgres();

    const result = await pool.query(
      "SELECT * FROM users ORDER BY id ASC"
    );

    return result.rows;

  } catch (error) {
    console.error("Service Error (fetchAllUsers):", error);
    throw error;
  }
}