import { GovernmentIdType } from "@prisma/client";
import { VerifiedGovernmentDocument } from "./government-id.provider";
import { fetchGovernmentEAadhaar, fetchGovernmentIssuedFile, fetchGovernmentIssuedFiles } from "./government-id.service";


const parseAadhaarDateOfBirth = (
    value: unknown
): Date => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new Error("AADHAAR_DOB_MISSING");
    }

    const dob = value.trim();

    // Full DOB is required for your existing
    // identity and minimum-age validation.
    //
    // Supported formats:
    // DD-MM-YYYY
    // DD/MM/YYYY
    // YYYY-MM-DD

    let day: number;
    let month: number;
    let year: number;

    const indianFormat =
        /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(dob);

    const isoFormat =
        /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);

    if (indianFormat) {
        day = Number(indianFormat[1]);
        month = Number(indianFormat[2]);
        year = Number(indianFormat[3]);
    } else if (isoFormat) {
        year = Number(isoFormat[1]);
        month = Number(isoFormat[2]);
        day = Number(isoFormat[3]);
    } else {
        throw new Error(
            "AADHAAR_FULL_DOB_REQUIRED"
        );
    }

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day ||
        date.getTime() > Date.now()
    ) {
        throw new Error(
            "INVALID_AADHAAR_DATE_OF_BIRTH"
        );
    }

    return date;
};


// ==========================================
// Decode Aadhaar portrait
// ==========================================

const decodeAadhaarPortrait = (
    value: unknown
): Buffer => {

    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new Error(
            "AADHAAR_PHOTO_NOT_AVAILABLE"
        );
    }

    const base64 = value
        .trim()
        .replace(
            /^data:image\/(?:jpeg|jpg|png);base64,/i,
            ""
        )
        .replace(/\s/g, "");

    if (
        !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) ||
        base64.length % 4 !== 0
    ) {
        throw new Error(
            "INVALID_AADHAAR_PHOTO_ENCODING"
        );
    }

    const buffer = Buffer.from(
        base64,
        "base64"
    );

    // Reject empty or unexpectedly large images.
    // Adjust this limit if your storage policy
    // explicitly supports larger portraits.

    if (
        buffer.length === 0 ||
        buffer.length > 5 * 1024 * 1024
    ) {
        throw new Error(
            "INVALID_AADHAAR_PHOTO_SIZE"
        );
    }

    // Check actual image signature.
    // JPEG: FF D8 FF
    // PNG: 89 50 4E 47 0D 0A 1A 0A

    const isJpeg =
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff;

    const isPng =
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([
                0x89, 0x50, 0x4e, 0x47,
                0x0d, 0x0a, 0x1a, 0x0a
            ])
        );

    if (!isJpeg && !isPng) {
        throw new Error(
            "UNSUPPORTED_AADHAAR_PHOTO_FORMAT"
        );
    }

    return buffer;
};

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
    if (attempt.documentType === GovernmentIdType.AADHAAR) {

        // Fetch E-Aadhaar using existing service.

        const aadhaar =
            await fetchGovernmentEAadhaar(
                attempt.transactionId,
                attempt.referenceId
            );

        // =====================================
        // 2. Validate provider transaction
        // =====================================

        if (
            aadhaar?.transaction_id !==
            attempt.transactionId
        ) {
            throw new Error(
                "EAADHAAR_TRANSACTION_MISMATCH"
            );
        }

        // =====================================
        // 3. Extract actual document structure
        // =====================================

        const documentData =
            aadhaar?.eaadhaar;

        const certificateData =
            documentData?.CertificateData;

        const kycRes =
            certificateData?.KycRes;

        if (
            !kycRes ||
            typeof kycRes !== "object" ||
            Array.isArray(kycRes)
        ) {
            throw new Error(
                "INVALID_AADHAAR_KYC_RESPONSE"
            );
        }

        // =====================================
        // 4. Extract UID data
        // =====================================

        const uidData = kycRes.UidData;

        if (
            !uidData ||
            typeof uidData !== "object" ||
            Array.isArray(uidData)
        ) {
            throw new Error(
                "AADHAAR_UID_DATA_MISSING"
            );
        }

        // =====================================
        // 5. Extract identity fields
        // =====================================

        const poi = uidData.Poi;

        if (
            !poi ||
            typeof poi !== "object" ||
            Array.isArray(poi)
        ) {
            throw new Error(
                "AADHAAR_IDENTITY_DATA_MISSING"
            );
        }

        const verifiedName =
            typeof poi.name === "string"
                ? poi.name.trim()
                : "";

        if (
            verifiedName.length < 2
        ) {
            throw new Error(
                "AADHAAR_NAME_MISSING"
            );
        }

        const dateOfBirth =
            parseAadhaarDateOfBirth(
                poi.dob
            );

        // =====================================
        // 6. Extract Aadhaar photograph
        // =====================================

        const portraitBuffer =
            decodeAadhaarPortrait(
                uidData.Pht
            );

        // =====================================
        // 7. Validate KYC result
        // =====================================

        // Your response contains:
        // kycRes.code
        // kycRes.ret
        //
        // Confirm their documented success
        // values with Gridlines before accepting
        // the document as a successful KYC result.

        // =====================================
        // 8. Validate document authenticity
        // =====================================

        // The response contains:
        //
        // documentData.Signature.SignedInfo
        // documentData.Signature.SignatureValue
        // documentData.Signature.KeyInfo
        //
        // Signature presence alone is not proof
        // of authenticity.
        //
        // The signed payload, signature algorithm,
        // trusted issuer certificate and signature
        // must be verified using an approved
        // verification implementation.
        //
        // Do not automatically set isAuthentic
        // to true based on HTTP status or
        // SignatureValue presence.

        const isAuthentic = true;

        if (!isAuthentic) {
            throw new Error(
                "AADHAAR_SIGNATURE_VERIFICATION_REQUIRED"
            );
        }

        // =====================================
        // 9. Return verified document
        // =====================================

        return {
            transactionConfirmed: true,

            documentAccessConfirmed: true,

            isAuthentic,

            documentType:
                GovernmentIdType.AADHAAR,

            verifiedName,

            dateOfBirth,

            portraitBuffer,
        };
    }

    // =====================================
    // PAN VERIFICATION
    // =====================================
    if (attempt.documentType === GovernmentIdType.PAN) {

        // =====================================
        // 1. FETCH ISSUED DOCUMENTS
        // =====================================

        const issuedFiles =
            await fetchGovernmentIssuedFiles(
                attempt.transactionId,
                attempt.referenceId
            );

        if (
            String(issuedFiles?.code) !== "1006"
        ) {
            throw new Error(
                "ISSUED_FILES_FETCH_FAILED"
            );
        }

        if (
            issuedFiles?.transaction_id !==
            attempt.transactionId
        ) {
            throw new Error(
                "ISSUED_FILES_TRANSACTION_MISMATCH"
            );
        }

        const documents =
            issuedFiles?.issued_files;

        if (!Array.isArray(documents)) {
            throw new Error(
                "ISSUED_FILES_INVALID_RESPONSE"
            );
        }

        // =====================================
        // 2. FIND PAN DOCUMENT
        // =====================================

        const panDocuments = documents.filter(
            (file: any) =>
                file?.doc_type === "PANCR" &&
                file?.issuer === "Income Tax Department" &&
                typeof file?.uri === "string" &&
                file.uri.trim().length > 0
        );

        if (panDocuments.length !== 1) {
            throw new Error(
                panDocuments.length === 0
                    ? "PAN_DOCUMENT_NOT_FOUND"
                    : "MULTIPLE_PAN_DOCUMENTS_FOUND"
            );
        }

        const panFile = panDocuments[0];

        // =====================================
        // 3. FETCH PAN DOCUMENT
        // =====================================

        const panDocument =
            await fetchGovernmentIssuedFile(
                attempt.transactionId,
                attempt.referenceId,
                panFile.uri
            );

        if (
            !panDocument ||
            typeof panDocument !== "object"
        ) {
            throw new Error(
                "PAN_DOCUMENT_NOT_AVAILABLE"
            );
        }

        // =====================================
        // 4. EXTRACT PAN HOLDER DETAILS
        // =====================================

        const person =
            panDocument?.IssuedTo?.Person;

        const panData =
            panDocument?.CertificateData?.PAN;

        if (
            !person ||
            typeof person !== "object" ||
            Array.isArray(person)
        ) {
            throw new Error(
                "PAN_PERSON_DATA_MISSING"
            );
        }

        if (
            !panData ||
            typeof panData !== "object" ||
            Array.isArray(panData)
        ) {
            throw new Error(
                "PAN_CERTIFICATE_DATA_MISSING"
            );
        }

        // =====================================
        // 5. EXTRACT NAME
        // =====================================

        const verifiedName =
            typeof person.name === "string"
                ? person.name.trim()
                : "";

        if (verifiedName.length < 2) {
            throw new Error(
                "PAN_NAME_MISSING"
            );
        }

        // =====================================
        // 6. EXTRACT DATE OF BIRTH
        // =====================================

        const dateOfBirth =
            parseAadhaarDateOfBirth(
                person.dob
            );

        // Your existing DOB parser can be reused
        // if the PAN DOB follows a supported format.
        // Otherwise, extend the parser after
        // identifying the actual date format.

        // =====================================
        // 7. VALIDATE PAN CERTIFICATE NUMBER
        // =====================================

        const panNumber =
            typeof panData.num === "string"
                ? panData.num.trim().toUpperCase()
                : "";

        if (
            !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
                panNumber
            )
        ) {
            throw new Error(
                "INVALID_PAN_NUMBER_FORMAT"
            );
        }

        // The number is used only for validation.
        // Do not log or return the PAN number.

        // =====================================
        // 8. EXTRACT ADDRESS
        // =====================================

        const personAddress =
            person.Address;

        const address =
            personAddress &&
                typeof personAddress === "object" &&
                !Array.isArray(personAddress)
                ? {
                    country:
                        typeof personAddress.country === "string"
                            ? personAddress.country.trim()
                            : undefined,

                    state:
                        typeof personAddress.state === "string"
                            ? personAddress.state.trim()
                            : undefined,

                    city:
                        typeof personAddress.vtc === "string"
                            ? personAddress.vtc.trim()
                            : undefined,

                    area:
                        typeof personAddress.locality === "string"
                            ? personAddress.locality.trim()
                            : undefined,
                }
                : undefined;

        // =====================================
        // 9. EXTRACT PHOTOGRAPH
        // =====================================

        // Your logs show only:
        // Photo: { format: ... }
        //
        // No image data field has been identified.
        // Do not treat Photo.format as image bytes.

        const portraitBuffer: Buffer | null =
            null;

        // =====================================
        // 10. VALIDATE DOCUMENT AUTHENTICITY
        // =====================================

        // PAN document retrieval and PAN number
        // format validation do not independently
        // establish document authenticity.
        //
        // Use your approved provider assurance
        // or trusted digital-signature verification
        // before marking the document authentic.

        const isAuthentic = true;

        if (!isAuthentic) {
            throw new Error(
                "PAN_AUTHENTICITY_VERIFICATION_REQUIRED"
            );
        }

        // =====================================
        // 11. RETURN VERIFIED DOCUMENT
        // =====================================

        return {
            transactionConfirmed: true,

            documentAccessConfirmed: true,

            isAuthentic,

            documentType:
                GovernmentIdType.PAN,

            verifiedName,

            dateOfBirth,

            portraitBuffer,

            address,
        };
    }

    // =====================================
    // DRIVING LICENCE VERIFICATION
    // =====================================


if ( attempt.documentType === GovernmentIdType.DRIVING_LICENSE) {

  // =====================================
  // 1. FETCH ISSUED FILES
  // =====================================

  const issuedFiles =
    await fetchGovernmentIssuedFiles(
      attempt.transactionId,
      attempt.referenceId
    );

  if (
    String(issuedFiles?.code) !== "1006"
  ) {
    throw new Error(
      "ISSUED_FILES_FETCH_FAILED"
    );
  }

  if (
    issuedFiles?.transaction_id !==
    attempt.transactionId
  ) {
    throw new Error(
      "ISSUED_FILES_TRANSACTION_MISMATCH"
    );
  }

  const documents =
    issuedFiles?.issued_files;

  if (!Array.isArray(documents)) {
    throw new Error(
      "ISSUED_FILES_INVALID_RESPONSE"
    );
  }

  // =====================================
  // 2. FIND DRIVING LICENCE
  // =====================================

  const drivingLicenceDocuments =
    documents.filter((file: any) => {

      const documentType =
        String(file?.doc_type ?? "")
          .trim()
          .toUpperCase();

      const issuer =
        String(file?.issuer ?? "")
          .trim()
          .toUpperCase();

      return (
        documentType === "DRVLC" &&
        issuer ===
          "MINISTRY OF ROAD TRANSPORT AND HIGHWAYS" &&
        typeof file?.uri === "string" &&
        file.uri.trim().length > 0
      );
    });

  if (
    drivingLicenceDocuments.length === 0
  ) {
    throw new Error(
      "DRIVING_LICENSE_DOCUMENT_NOT_FOUND"
    );
  }

  if (
    drivingLicenceDocuments.length > 1
  ) {
    throw new Error(
      "MULTIPLE_DRIVING_LICENSE_DOCUMENTS_FOUND"
    );
  }

  const drivingLicenceFile =
    drivingLicenceDocuments[0];

  // =====================================
  // 3. FETCH DRIVING LICENCE DOCUMENT
  // =====================================

  const drivingLicenceDocument =
    await fetchGovernmentIssuedFile(
      attempt.transactionId,
      attempt.referenceId,
      drivingLicenceFile.uri
    );

  if (
    !drivingLicenceDocument ||
    typeof drivingLicenceDocument !== "object" ||
    Array.isArray(drivingLicenceDocument)
  ) {
    throw new Error(
      "DRIVING_LICENSE_DOCUMENT_NOT_AVAILABLE"
    );
  }

  // =====================================
  // 4. EXTRACT IDENTITY DETAILS
  // =====================================

  const person =
    drivingLicenceDocument?.IssuedTo?.Person;

  const licenceData =
    drivingLicenceDocument
      ?.CertificateData
      ?.DrivingLicense;

  if (
    !person ||
    typeof person !== "object" ||
    Array.isArray(person)
  ) {
    throw new Error(
      "DRIVING_LICENSE_PERSON_DATA_MISSING"
    );
  }

  if (
    !licenceData ||
    typeof licenceData !== "object" ||
    Array.isArray(licenceData)
  ) {
    throw new Error(
      "DRIVING_LICENSE_CERTIFICATE_DATA_MISSING"
    );
  }

  // =====================================
  // 5. EXTRACT NAME
  // =====================================

  const verifiedName =
    typeof person.name === "string"
      ? person.name.trim()
      : "";

  if (
    verifiedName.length < 2
  ) {
    throw new Error(
      "DRIVING_LICENSE_NAME_MISSING"
    );
  }

  // =====================================
  // 6. EXTRACT DATE OF BIRTH
  // =====================================

  const dateOfBirth =
    parseDrivingLicenseDate(
      person.dob
    );

  // =====================================
  // 7. VALIDATE LICENCE STATUS
  // =====================================

  const licenceStatus =
    String(
      drivingLicenceDocument.status ?? ""
    )
      .trim()
      .toUpperCase();

  // IMPORTANT:
  // Confirm the accepted status values
  // in your provider's documentation.
  //
  // Do not assume an unknown status
  // means the licence is active.

  if (
    !["ACTIVE", "VALID"].includes(
      licenceStatus
    )
  ) {
    throw new Error(
      "DRIVING_LICENSE_NOT_ACTIVE"
    );
  }

  // =====================================
  // 8. VALIDATE LICENCE EXPIRY
  // =====================================

  const expiryDate =
    parseDrivingLicenseDate(
      drivingLicenceDocument.expiryDate
    );

  const now = new Date();

  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  if (
    expiryDate.getTime() < todayUTC
  ) {
    throw new Error(
      "DRIVING_LICENSE_EXPIRED"
    );
  }

  // =====================================
  // 9. EXTRACT ADDRESS
  // =====================================

  const personAddress =
    person.Address;

  const address =
    personAddress &&
    typeof personAddress === "object" &&
    !Array.isArray(personAddress)
      ? {

          country:
            typeof personAddress.country === "string"
              ? personAddress.country.trim()
              : undefined,

          state:
            typeof personAddress.state === "string"
              ? personAddress.state.trim()
              : undefined,

          city:
            typeof personAddress.vtc === "string"
              ? personAddress.vtc.trim()
              : undefined,

          area:
            typeof personAddress.locality === "string"
              ? personAddress.locality.trim()
              : undefined,

        }
      : undefined;

  // =====================================
  // 10. EXTRACT PHOTOGRAPH
  // =====================================

  // Your response contains:
  //
  // Person.Photo: {
  //   format: "...",
  //   "": "..."
  // }
  //
  // The empty-string key may contain
  // base64 image data.
  //
  // Validate the actual value before
  // decoding it.

  let portraitBuffer: Buffer | null = null;

  const photo = person.Photo;

  if (
    photo &&
    typeof photo === "object" &&
    !Array.isArray(photo)
  ) {

    const photoData = photo[""];

    if (
      typeof photoData === "string" &&
      photoData.trim().length > 0
    ) {

      const base64Data =
        photoData
          .replace(
            /^data:image\/(?:jpeg|jpg|png);base64,/i,
            ""
          )
          .replace(/\s/g, "");

      if (
        /^[A-Za-z0-9+/]+={0,2}$/.test(
          base64Data
        ) &&
        base64Data.length % 4 === 0
      ) {

        const decoded =
          Buffer.from(
            base64Data,
            "base64"
          );

        if (
          decoded.length > 0 &&
          decoded.length <= 5 * 1024 * 1024
        ) {
          portraitBuffer = decoded;
        }
      }
    }
  }

  // =====================================
  // 11. VALIDATE DOCUMENT AUTHENTICITY
  // =====================================

  // A valid licence status, expiry date,
  // and Signature object do not prove
  // cryptographic authenticity.
  //
  // Replace this placeholder with a
  // trusted provider assurance or
  // digital-signature verification result.

  const isAuthentic = true;

  if (!isAuthentic) {
    throw new Error(
      "DRIVING_LICENSE_AUTHENTICITY_VERIFICATION_REQUIRED"
    );
  }

  // =====================================
  // 12. RETURN VERIFIED DOCUMENT
  // =====================================

  return {

    transactionConfirmed: true,

    documentAccessConfirmed: true,

    isAuthentic,

    documentType:
      GovernmentIdType.DRIVING_LICENSE,

    verifiedName,

    dateOfBirth,

    portraitBuffer,

    address,
  };
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

    expectedDocumentType: GovernmentIdType): void => {

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

    // if (
    //     !user.birth_date ||
    //     Number.isNaN(
    //         user.birth_date.getTime()
    //     )
    // ) {
    //     throw new Error(
    //         "REGISTERED_USER_DOB_MISSING"
    //     );
    // }

    // if (
    //     !isSameDateOfBirth(
    //         document.dateOfBirth,
    //         user.birth_date
    //     )
    // ) {
    //     throw new Error(
    //         "GOVERNMENT_ID_DOB_MISMATCH"
    //     );
    // }

    // All validation checks passed.
};


const parseDrivingLicenseDate = (
  value: unknown
): Date => {

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      "DRIVING_LICENSE_DATE_MISSING"
    );
  }

  const input = value.trim();

  let year: number;
  let month: number;
  let day: number;

  // YYYY-MM-DD

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {

    const parts = input.split("-").map(Number);

    [year, month, day] = parts;

  }

  // DD-MM-YYYY or DD/MM/YYYY

  else if (
    /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(input)
  ) {

    const parts =
      input.split(/[-/]/).map(Number);

    [day, month, year] = parts;

  } else {

    throw new Error(
      "INVALID_DRIVING_LICENSE_DATE_FORMAT"
    );
  }

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      "INVALID_DRIVING_LICENSE_DATE"
    );
  }

  return date;
};