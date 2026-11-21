export interface VerifyPanInput {
  partnerId: string;
  businessId: string;
  panNumber: string;
  consent: boolean;
}

export interface GridlinesPanData {
  document_type?: string;
  document_id?: string;
  name?: string;
  last_name?: string;
  category?: string;
  date_of_birth?: string;
  masked_aadhaar_number?: string;
  address_data?: {
    line_1?: string;
    line_2?: string;
    street?: string;
    city?: string;
    line_5?: string;
    state?: string;
    pincode?: string;
  };
  email?: string;
  phone?: string;
  gender?: string;
  aadhaar_linked?: boolean;
}

export interface GridlinesPanResponse {
  status?: number;
  message?: string;
  pan_data?: GridlinesPanData;
  data?: {
    message?: string;
    pan_data?: GridlinesPanData;
  };
}