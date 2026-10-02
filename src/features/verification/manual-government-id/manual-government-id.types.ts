import {
  GovernmentIdType,
} from "@prisma/client";

export interface GovernmentIdFile {
  name?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  data?: Buffer;
}

export interface GovernmentIdFiles {
  frontPhoto?: GovernmentIdFile;
  backPhoto?: GovernmentIdFile;
}

export interface SubmitManualGovernmentIdInput {
  documentType: GovernmentIdType;

  documentNumber: string;

  fullName: string;

  dateOfBirth?: string;
}