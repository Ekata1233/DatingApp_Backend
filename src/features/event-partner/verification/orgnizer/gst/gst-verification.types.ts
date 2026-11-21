export interface VerifyGstInput {
  partnerId: string;
  businessId: string;
  gstNumber: string;
}

export interface GstTaxpayerDetails {
  lgnm?: string;
  gstin?: string;
  tradeNam?: string;
  ctb?: string;
  sts?: string;
  rgdt?: string;
  cxdt?: string;
  dty?: string;
  mbr?: string[];

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
      em?: string;
      mb?: string | number;

      [key: string]: unknown;
    };

    adadr?: unknown[];
    compDetl?: unknown;
  };

  goods_service?: Record<string, unknown>;
}

export interface ApiBankingGstResponse {
  code?: string;
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