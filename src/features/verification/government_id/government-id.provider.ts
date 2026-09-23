import {
  GovernmentIdType,
} from "@prisma/client";
import imagekit from "../../../utils/imagekit";

export interface GovernmentDocumentAddress {
  country?: string;
  state?: string;
  city?: string;
  area?: string;
}

export interface VerifiedGovernmentDocument {

  transactionConfirmed: boolean;

  documentAccessConfirmed: boolean;

  isAuthentic: boolean;

  documentType: GovernmentIdType;

  verifiedName: string;

  dateOfBirth: Date;
  portraitBuffer: Buffer | null;
  address?: GovernmentDocumentAddress;

}

// ------------------------------------------
// Fetch verified document from Gridlines
// ------------------------------------------

export const fetchAndVerifyGovernmentDocument = async (
  transactionId: string,
  documentType: GovernmentIdType
): Promise<VerifiedGovernmentDocument> => {

  if (!transactionId) {
    throw new Error(
      "GRIDLINES_TRANSACTION_ID_REQUIRED"
    );
  }

  switch (documentType) {

    case GovernmentIdType.AADHAAR:
      // TODO:
      // Call the documented Gridlines
      // E-Aadhaar retrieval API.
      //
      // Verify the authorized transaction,
      // document issuer and document type.
      //
      // Extract verified identity fields
      // and portrait if supplied.
      break;

    case GovernmentIdType.PAN:
      // TODO:
      // Call the documented Gridlines
      // PAN document retrieval API.
      //
      // Validate the document and
      // extract the available identity data.
      break;

    case GovernmentIdType.DRIVING_LICENSE:
      // TODO:
      // Call the documented Gridlines
      // Driving Licence retrieval API.
      //
      // Validate the issuer and document.
      break;

    default:
      throw new Error(
        "UNSUPPORTED_GOVERNMENT_ID_TYPE"
      );
  }

  // Do not return fabricated identity data
  // or mark verification successful.

  throw new Error(
    `GRIDLINES_DOCUMENT_API_NOT_CONFIGURED: ${documentType}`
  );
};

// ------------------------------------------
// Delete Government ID photo from ImageKit
// ------------------------------------------

export const deleteGovernmentIdPhoto = async (
  photoKey: string
): Promise<void> => {
  if (!photoKey) {
    throw new Error(
      "GOVERNMENT_ID_PHOTO_KEY_REQUIRED"
    );
  }

  try {
    await imagekit.deleteFile(photoKey);

  } catch (error: any) {
    console.error(
      "Government ID photo deletion failed:",
      error.message
    );

    throw new Error(
      "GOVERNMENT_ID_PHOTO_DELETE_FAILED"
    );
  }
};