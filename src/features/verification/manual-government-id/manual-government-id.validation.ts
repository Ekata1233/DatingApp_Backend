import {
  GovernmentIdType,
} from "@prisma/client";

export const validateGovernmentIdType = (
  value: string
): GovernmentIdType => {
  const allowedTypes = [
    GovernmentIdType.AADHAAR,
    GovernmentIdType.PAN,
    GovernmentIdType.DRIVING_LICENSE,
  ];

  if (
    !allowedTypes.includes(
      value as GovernmentIdType
    )
  ) {
    throw new Error(
      "INVALID_GOVERNMENT_ID_TYPE"
    );
  }

  return value as GovernmentIdType;
};

// ======================================================
// DOCUMENT NUMBER
// ======================================================

export const normalizeDocumentNumber = (
  value: string
) => {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .toUpperCase();
};

// ======================================================
// VALIDATE NUMBER
// ======================================================

export const validateDocumentNumber = (
  documentType: GovernmentIdType,
  documentNumber: string
) => {
  const normalized =
    normalizeDocumentNumber(
      documentNumber
    );

  switch (documentType) {
    // Aadhaar = exactly 12 digits
    case GovernmentIdType.AADHAAR: {
      if (
        !/^\d{12}$/.test(normalized)
      ) {
        throw new Error(
          "INVALID_AADHAAR_NUMBER"
        );
      }

      break;
    }

    // PAN = ABCDE1234F
    case GovernmentIdType.PAN: {
      if (
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
          normalized
        )
      ) {
        throw new Error(
          "INVALID_PAN_NUMBER"
        );
      }

      break;
    }

    // Driving licence formats differ by state,
    // so avoid overly strict validation.
    case GovernmentIdType.DRIVING_LICENSE: {
      if (
        normalized.length < 6 ||
        normalized.length > 20
      ) {
        throw new Error(
          "INVALID_DRIVING_LICENSE_NUMBER"
        );
      }

      break;
    }

    default:
      throw new Error(
        "INVALID_GOVERNMENT_ID_TYPE"
      );
  }

  return normalized;
};

// ======================================================
// DATE
// ======================================================

export const parseGovernmentIdDob = (
  value?: string
) => {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "INVALID_DATE_OF_BIRTH"
    );
  }

  return date;
};