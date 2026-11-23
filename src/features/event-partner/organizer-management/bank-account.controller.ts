import { NextFunction, Response } from "express";
import { PartnerRequest } from "../../../types/partnerAuth.types";
import { addBankAccount, BankAccountError, findBankBranch, getBankAccount } from "./bank-account.service";
import { bankAccountSchema, getDocumentExtension, ifscSchema } from "./bank-account.validation";

const handleError = (error: unknown, res: Response, next: NextFunction) => {
  if (error instanceof BankAccountError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  return next(error);
};

export const findBankBranchController = async (req: PartnerRequest, res: Response, next: NextFunction) => {
  const ifsc = ifscSchema.safeParse(req.params.ifscCode);
  if (!ifsc.success) {
    return res.status(400).json({ success: false, message: "Enter a valid IFSC code" });
  }

  try {
    const data = await findBankBranch(ifsc.data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const getBankAccountController = async (req: PartnerRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getBankAccount(req.partner!.businessId!);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const addBankAccountController = async (req: PartnerRequest, res: Response, next: NextFunction) => {
  const input = bankAccountSchema.safeParse(req.body);
  if (!input.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid bank account details",
      errors: input.error.flatten().fieldErrors,
    });
  }

  try {
    const cheque = req.files?.cancelledCheque;
    const statement = req.files?.bankStatement;
    const file = cheque ?? statement;
    if (Object.keys(req.files ?? {}).length > 1 || Array.isArray(file) || (req.files && !file)) {
      throw new BankAccountError(400, "Upload one cancelledCheque or bankStatement file");
    }

    let document: Parameters<typeof addBankAccount>[2];
    if (file) {
      const extension = getDocumentExtension(file);
      if (!extension) {
        throw new BankAccountError(400, "Bank document must be a PDF, JPEG, or PNG up to 5 MB");
      }
      document = {
        field: cheque ? "cancelledChequeKey" : "bankStatementKey",
        bytes: file.data,
        extension,
      };
    }

    const data = await addBankAccount(req.partner!.businessId!, input.data, document);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};
