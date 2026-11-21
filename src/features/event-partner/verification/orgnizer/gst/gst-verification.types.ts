
export interface VerifyGstInput {
  partnerId: string;
  businessId: string;
  gstNumber: string;
}

export interface GstTaxpayerDetails {
  gstin?: string;
  lgnm?: string;
  tradeNam?: string;
  sts?: string;
  ctb?: string;
  rgdt?: string;
  cxdt?: string;
  dty?: string;
  contacted?: {
    name?: string;
    mobNum?: string | number;
    email?: string;
  };
  [key: string]: unknown;
}

export interface GstAdvancedDetails {
  taxpayerDetails?: GstTaxpayerDetails;
  taxpayerReturnDetails?: Record<string, unknown>;
  business_places?: {
    pradr?: {
      adr?: string;
      ntr?: string;
      [key: string]: unknown;
    };
    adadr?: unknown[];
  };
  goods_service?: Record<string, unknown>;
}

export interface LpFintechGstResponse {
  code?: string | number;
  status?: string;
  message?: string;
  data?: {
    status?: string;
    clientTransactionId?: string;
    responseMessage?: string;
    gatewayId?: string;
    details?: GstAdvancedDetails;
  };
}

export interface GstVerificationResult {
  verified: boolean;
  verificationMessage: string;
  businessId: string;
  gstNumber: string;
  gstStatus: string | null;
  gstDetails: {
    legalName: string | null;
    tradeName: string | null;
    constitution: string | null;
    registrationDate: string | null;
    cancellationDate: string | null;
    taxpayerType: string | null;
    contact: GstTaxpayerDetails["contacted"] | null;
    principalAddress: string | null;
    additionalPlaces: unknown[];
    taxpayerReturnDetails: Record<string, unknown> | null;
    goodsAndServices: Record<string, unknown> | null;
  };
  provider: {
    name: "LPFINTECH";
    clientTransactionId: string;
    gatewayId: string | null;
  };
}
