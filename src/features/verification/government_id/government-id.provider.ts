import { GovernmentIdType } from "@prisma/client";

export type VerifiedGovernmentDocument = {
  documentType: GovernmentIdType;

  verifiedName: string;

  dateOfBirth: Date;

  // Provider-confirmed, issuer-backed document
  isAuthentic: boolean;

  // Result of provider-side transaction validation
  transactionConfirmed: boolean;

  // Whether the selected document was retrieved
  // through the authorized DigiLocker transaction
  documentAccessConfirmed: boolean;
};

export const fetchAndVerifyGovernmentDocument = async (
  transactionId: string,
  documentType: GovernmentIdType
): Promise<VerifiedGovernmentDocument> => {

  // TODO: Integrate the corresponding Gridlines
  // document API using the saved transactionId.
  //
  // AADHAAR:
  //   Fetch E-Aadhaar
  //
  // PAN:
  //   Pull PAN or Fetch Issued File
  //
  // DRIVING_LICENSE:
  //   Fetch Issued Files and Fetch Issued File
  //
  // Confirm transaction authorization server-side.
  // Validate the document's issuer and document type.
  // Extract verified name and date of birth.
  //
  // Never accept these fields from the Flutter app.

  throw new Error(
    `GRIDLINES_DOCUMENT_API_NOT_CONFIGURED: ${documentType}`
  );
};