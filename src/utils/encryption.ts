import crypto from "crypto";

const algorithm = "aes-256-cbc";

const secretKey = Buffer.from(
  process.env.BANK_ENCRYPTION_KEY as string,
  "hex"
);

export const encryptText = (text: string): string => {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    algorithm,
    secretKey,
    iv
  );

  let encrypted = cipher.update(
    text,
    "utf8",
    "hex"
  );

  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptText = (
  encryptedText: string
): string => {
  const [ivHex, encrypted] =
    encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    iv
  );

  let decrypted = decipher.update(
    encrypted,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
};