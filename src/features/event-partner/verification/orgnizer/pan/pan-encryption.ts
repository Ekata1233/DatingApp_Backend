
import {
  createCipheriv,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";

export const encryptPan = (panNumber: string): string => {
  const keyHex = process.env.PAN_ENCRYPTION_KEY;

  if (!keyHex || !/^[a-fA-F0-9]{64}$/.test(keyHex)) {
    throw new Error("Valid PAN_ENCRYPTION_KEY is required");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(12);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(panNumber, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};
