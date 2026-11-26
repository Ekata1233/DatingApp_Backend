import { createCipheriv, randomBytes, randomUUID } from "crypto";
import { PartnerVerificationStatus, Prisma } from "@prisma/client";
import axios from "axios";
import { prisma } from "../../../prisma/prismaClient";
import imagekit from "../../../utils/imagekit";
import { BankAccountInput, EditBankAccountInput } from "./bank-account.validation";

export class BankAccountError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}

type BankDocument = {
  field: "cancelledChequeKey" | "bankStatementKey";
  bytes: Buffer;
  extension: "pdf" | "jpg" | "png";
};

const bankAccountSelect = {
  id: true,
  accountHolderName: true,
  accountNumberLastFour: true,
  ifscCode: true,
  bankName: true,
  branchName: true,
  payoutCycle: true,
  verificationStatus: true,
  payoutHoldUntil: true,
} as const satisfies Prisma.BankDetailsSelect;

const encryptAccountNumber = (accountNumber: string) => {
  const key = process.env.BANK_ACCOUNT_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) {
    throw new Error("BANK_ACCOUNT_ENCRYPTION_KEY must be a 32-byte hex key");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(accountNumber, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("hex")).join(":");
};

export const findBankBranch = async (ifscCode: string) => {
  const { data } = await axios.get<{ BANK?: string; BRANCH?: string }>(
    `https://ifsc.razorpay.com/${ifscCode}`,
    { timeout: 5000, maxRedirects: 0 },
  ).catch((error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new BankAccountError(404, "No branch found for this IFSC code");
    }
    throw new BankAccountError(502, "Branch lookup is temporarily unavailable");
  });

  if (typeof data?.BANK !== "string" || typeof data?.BRANCH !== "string") {
    throw new BankAccountError(502, "Branch lookup returned an invalid response");
  }
  return { ifscCode, bankName: data.BANK, branchName: data.BRANCH };
};

const formatBankAccountStatus = (
  account: Prisma.BankDetailsGetPayload<{ select: typeof bankAccountSelect }> | null,
) => ({
  account,
  payoutsOnHold: account?.verificationStatus !== PartnerVerificationStatus.VERIFIED ||
    (account.payoutHoldUntil !== null && account.payoutHoldUntil > new Date()),
});

export const getBankAccount = async (businessId: string) => {
  const account = await prisma.bankDetails.findFirst({
    where: { businessId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: bankAccountSelect,
  });
  return formatBankAccountStatus(account);
};

const uploadBankDocument = async (businessId: string, document?: BankDocument) => {
  if (!document) return undefined;

  const uploaded = await imagekit.upload({
    file: document.bytes,
    fileName: `${randomUUID()}.${document.extension}`,
    folder: `/event-partner/bank-documents/${businessId}`,
    isPrivateFile: true,
  }).catch(() => {
    throw new BankAccountError(502, "Unable to store the bank document");
  });
  if (!uploaded.fileId) throw new BankAccountError(502, "Unable to store the bank document");
  return uploaded.fileId;
};

const deleteBankDocument = async (key: string) => {
  await imagekit.deleteFile(key).catch(() => {
    console.error("Unable to delete a detached bank document");
  });
};

const handleBankAccountWriteFailure = async (error: unknown, documentKey?: string): Promise<never> => {
  if (documentKey) await deleteBankDocument(documentKey);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    throw new BankAccountError(409, "Bank account state changed. Refresh and try again.");
  }
  throw error;
};

export const addBankAccount = async (
  businessId: string,
  input: BankAccountInput,
  document?: BankDocument,
) => {
  const where = { businessId };
  const existing = await prisma.bankDetails.findFirst({ where, select: { id: true } });
  if (existing) {
    throw new BankAccountError(409, "This business already has an active bank account");
  }

  const accountNumberEncrypted = encryptAccountNumber(input.accountNumber);
  const branch = await findBankBranch(input.ifscCode);
  const documentKey = await uploadBankDocument(businessId, document);

  try {
    const account = await prisma.$transaction(async (tx) => {
      const current = await tx.bankDetails.findFirst({ where, select: { id: true } });
      if (current) {
        throw new BankAccountError(409, "This business already has an active bank account");
      }

      return tx.bankDetails.create({
        data: {
          businessId,
          accountHolderName: input.accountHolderName,
          accountNumberEncrypted,
          accountNumberLastFour: input.accountNumber.slice(-4),
          ...branch,
          payoutCycle: input.payoutCycle,
          isPrimary: true,
          ...(document && documentKey ? { [document.field]: documentKey } : {}),
        },
        select: bankAccountSelect,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return formatBankAccountStatus(account);
  } catch (error) {
    return handleBankAccountWriteFailure(error, documentKey);
  }
};

export const editBankAccount = async (
  businessId: string,
  input: EditBankAccountInput,
  document?: BankDocument,
) => {
  const { accountHolderName, accountNumber, ifscCode, payoutCycle } = input;
  if (!accountHolderName && !accountNumber && !ifscCode && !payoutCycle && !document) {
    throw new BankAccountError(400, "Provide at least one bank account field or document to update");
  }

  const where = { businessId, isActive: true };
  const current = await prisma.bankDetails.findFirst({
    where,
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: { ...bankAccountSelect, updatedAt: true, cancelledChequeKey: true, bankStatementKey: true },
  });
  if (!current) throw new BankAccountError(404, "No active bank account found for this business");

  const branch = ifscCode && ifscCode !== current.ifscCode ? await findBankBranch(ifscCode) : undefined;
  const accountUpdate = accountNumber ? {
    accountNumberEncrypted: encryptAccountNumber(accountNumber),
    accountNumberLastFour: accountNumber.slice(-4),
  } : undefined;
  const bankDetailsChanged = Boolean(
    accountUpdate || branch || (accountHolderName && accountHolderName !== current.accountHolderName),
  );
  const documentKey = await uploadBankDocument(businessId, document);
  const documentUpdate = {
    ...(bankDetailsChanged ? { cancelledChequeKey: null, bankStatementKey: null } : {}),
    ...(document && documentKey ? { [document.field]: documentKey } : {}),
  };

  const account = await prisma.bankDetails.update({
    where: { id: current.id, ...where, updatedAt: current.updatedAt },
    data: {
      accountHolderName,
      payoutCycle,
      ...branch,
      ...accountUpdate,
      ...documentUpdate,
      ...(bankDetailsChanged || documentKey ? {
        verificationStatus: PartnerVerificationStatus.NOT_STARTED,
        isNameMatched: null,
        providerReferenceId: null,
        pennyDropVerifiedAt: null,
        verifiedAt: null,
        failureReason: null,
      } : {}),
    },
    select: bankAccountSelect,
  }).catch((error: unknown) => handleBankAccountWriteFailure(
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
      ? new BankAccountError(409, "Bank account state changed. Refresh and try again.")
      : error,
    documentKey,
  ));

  const detachedKeys = new Set<string>();
  for (const field of ["cancelledChequeKey", "bankStatementKey"] as const) {
    const previousKey = current[field];
    if (previousKey && (bankDetailsChanged || document?.field === field)) detachedKeys.add(previousKey);
  }
  await Promise.all([...detachedKeys].map(deleteBankDocument));
  return formatBankAccountStatus(account);
};
