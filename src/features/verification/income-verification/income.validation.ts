import {
  IncomeProofType,
} from "@prisma/client";

import {
  IncomeFile,
} from "./income.type";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const validateIncomeProofType = (
  value: string
): IncomeProofType => {
  const allowedTypes =
    Object.values(
      IncomeProofType
    );

  if (
    !allowedTypes.includes(
      value as IncomeProofType
    )
  ) {
    throw new Error(
      "INVALID_INCOME_PROOF_TYPE"
    );
  }

  return value as IncomeProofType;
};

export const validateAnnualIncome = (
  value?: number
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  const annualIncome =
    Number(value);

  if (
    !Number.isFinite(
      annualIncome
    ) ||
    annualIncome < 0
  ) {
    throw new Error(
      "INVALID_ANNUAL_INCOME"
    );
  }

  return annualIncome;
};

export const validateCurrency = (
  value?: string
) => {
  if (!value) {
    return "INR";
  }

  const currency =
    value
      .trim()
      .toUpperCase();

  if (
    currency.length < 3 ||
    currency.length > 10
  ) {
    throw new Error(
      "INVALID_CURRENCY"
    );
  }

  return currency;
};

export const validateFinancialYear = (
  value?: string
) => {
  if (!value) {
    return undefined;
  }

  const financialYear =
    value.trim();

  if (
    financialYear.length >
    20
  ) {
    throw new Error(
      "INVALID_FINANCIAL_YEAR"
    );
  }

  return financialYear;
};

export const validateIncomeFile = (
  file: IncomeFile,
  type:
    | "PRIMARY"
    | "SECONDARY"
) => {
  if (!file) {
    throw new Error(
      `INCOME_${type}_DOCUMENT_REQUIRED`
    );
  }

  if (
    file.size &&
    file.size >
      MAX_FILE_SIZE
  ) {
    throw new Error(
      `INCOME_${type}_DOCUMENT_TOO_LARGE`
    );
  }

  if (
    file.mimetype &&
    !ALLOWED_FILE_TYPES.includes(
      file.mimetype
    )
  ) {
    throw new Error(
      `INCOME_${type}_DOCUMENT_INVALID_FILE_TYPE`
    );
  }

  const buffer =
    file.buffer ||
    file.data;

  if (!buffer) {
    throw new Error(
      `INCOME_${type}_DOCUMENT_BUFFER_MISSING`
    );
  }

  return buffer;
};
