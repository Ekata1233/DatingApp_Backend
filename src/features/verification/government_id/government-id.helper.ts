import { GovernmentIdType } from "@prisma/client";
import { VerifiedGovernmentDocument } from "./government-id.provider";
import { fetchGovernmentEAadhaar } from "./government-id.service";

export const getVerifiedGovernmentDocument = async (
  attempt: {
    transactionId: string;
    referenceId: string;
    documentType: GovernmentIdType;
  }
): Promise<VerifiedGovernmentDocument> => {

  // =====================================
  // 1. AADHAAR VERIFICATION
  // =====================================

  if (
    attempt.documentType ===
    GovernmentIdType.AADHAAR
  ) {

    const aadhaar =
      await fetchGovernmentEAadhaar(
        attempt.transactionId,
        attempt.referenceId
      );

    // Gridlines may return:
    //
    // {
    //   code: "1011",
    //   eaadhaar_link: "..."
    // }
    //
    // Or an E-Aadhaar JSON object.
    //
    // We must obtain the actual identity
    // fields before verification.

    if (
      !aadhaar ||
      typeof aadhaar !== "object"
    ) {
      throw new Error(
        "EAADHAAR_DOCUMENT_NOT_AVAILABLE"
      );
    }

    // IMPORTANT:
    // The actual E-Aadhaar JSON field names
    // are not present in your documentation.
    //
    // Do not assume that name, DOB, portrait
    // or authenticity fields exist.
    //
    // Implement the provider-specific mapping
    // after obtaining the actual response.

    throw new Error(
      "EAADHAAR_IDENTITY_MAPPING_REQUIRED"
    );
  }

  // =====================================
  // 2. PAN VERIFICATION
  // =====================================

  if (
    attempt.documentType ===
    GovernmentIdType.PAN
  ) {
    throw new Error(
      "PAN_DOCUMENT_MAPPING_REQUIRED"
    );
  }

  // =====================================
  // 3. DRIVING LICENCE VERIFICATION
  // =====================================

  if (
    attempt.documentType ===
    GovernmentIdType.DRIVING_LICENSE
  ) {
    throw new Error(
      "DRIVING_LICENSE_MAPPING_REQUIRED"
    );
  }

  throw new Error(
    "UNSUPPORTED_GOVERNMENT_ID_TYPE"
  );
};

const normalizeGovernmentIdName = (
  name: string
): string => {
  return name
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

const isSameDateOfBirth = (
  first: Date,
  second: Date
): boolean => {
  return (
    first.getUTCFullYear() ===
      second.getUTCFullYear() &&

    first.getUTCMonth() ===
      second.getUTCMonth() &&

    first.getUTCDate() ===
      second.getUTCDate()
  );
};

const getAgeFromDateOfBirth = (
  dob: Date
): number => {
  const today = new Date();

  let age =
    today.getUTCFullYear() -
    dob.getUTCFullYear();

  const currentMonth =
    today.getUTCMonth();

  const birthMonth =
    dob.getUTCMonth();

  const currentDay =
    today.getUTCDate();

  const birthDay =
    dob.getUTCDate();

  if (
    currentMonth < birthMonth ||
    (
      currentMonth === birthMonth &&
      currentDay < birthDay
    )
  ) {
    age--;
  }

  return age;
};

export const validateGovernmentIdentity = (
  document: VerifiedGovernmentDocument,

  user: {
    full_name: string | null;
    birth_date: Date | null;
  },

  expectedDocumentType: GovernmentIdType
): void => {

  // =====================================
  // 1. Validate provider confirmation
  // =====================================

  if (
    !document.transactionConfirmed ||
    !document.documentAccessConfirmed ||
    !document.isAuthentic
  ) {
    throw new Error(
      "GOVERNMENT_DOCUMENT_NOT_VERIFIED"
    );
  }

  // =====================================
  // 2. Validate document type
  // =====================================

  if (
    document.documentType !==
    expectedDocumentType
  ) {
    throw new Error(
      "GOVERNMENT_DOCUMENT_TYPE_MISMATCH"
    );
  }

  // =====================================
  // 3. Validate document name
  // =====================================

  if (
    !document.verifiedName ||
    typeof document.verifiedName !== "string" ||
    !document.verifiedName.trim()
  ) {
    throw new Error(
      "GOVERNMENT_DOCUMENT_NAME_MISSING"
    );
  }

  // =====================================
  // 4. Validate date of birth
  // =====================================

  if (
    !(document.dateOfBirth instanceof Date) ||
    Number.isNaN(
      document.dateOfBirth.getTime()
    )
  ) {
    throw new Error(
      "GOVERNMENT_DOCUMENT_DOB_INVALID"
    );
  }

  if (
    document.dateOfBirth.getTime() >
    Date.now()
  ) {
    throw new Error(
      "GOVERNMENT_DOCUMENT_DOB_INVALID"
    );
  }

  // =====================================
  // 5. Validate minimum age
  // =====================================

  const age =
    getAgeFromDateOfBirth(
      document.dateOfBirth
    );

  if (age < 18) {
    throw new Error(
      "USER_BELOW_MINIMUM_AGE"
    );
  }

  // =====================================
  // 6. Validate registered user name
  // =====================================

  if (
    !user.full_name ||
    !user.full_name.trim()
  ) {
    throw new Error(
      "REGISTERED_USER_NAME_MISSING"
    );
  }

  const registeredName =
    normalizeGovernmentIdName(
      user.full_name
    );

  const governmentName =
    normalizeGovernmentIdName(
      document.verifiedName
    );

  if (
    registeredName !== governmentName
  ) {
    throw new Error(
      "GOVERNMENT_ID_NAME_MISMATCH"
    );
  }

  // =====================================
  // 7. Validate registered date of birth
  // =====================================

  if (
    !user.birth_date ||
    Number.isNaN(
      user.birth_date.getTime()
    )
  ) {
    throw new Error(
      "REGISTERED_USER_DOB_MISSING"
    );
  }

  if (
    !isSameDateOfBirth(
      document.dateOfBirth,
      user.birth_date
    )
  ) {
    throw new Error(
      "GOVERNMENT_ID_DOB_MISMATCH"
    );
  }

  // All validation checks passed.
};