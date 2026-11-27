






export interface GuestInvoiceDetailsQuery {
  page: number;
  limit: number;
}

export interface GuestInvoiceDetailsResponse {
  eventId: string;
  eventDateId: string;
  eventTitle: string | null;
  eventPhotoUrl: string | null;
  eventDate: Date;

  invoiceCount: number;
  refundedBookingCount: number;
  remainingCount: number;

  invoices: GuestInvoiceItem[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}


export type InvoiceType =
  | "guest"
  | "welvors"
  | "tax-report";

// ==========================================
// GUEST INVOICES
// ==========================================

export interface GuestInvoiceQuery {
  page: number;
  limit: number;
  invoiceLimit: number;
  search?: string;
}

export interface GuestInvoiceItem {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  bookingDate: Date;

  totalAmount: number;
  gstAmount: number;
  paidAmount: number;
  refundAmount: number;

  refundStatus: string;
  isRefunded: boolean;
}

export interface GuestInvoiceGroup {
  eventId: string;
  eventDateId: string;
  eventTitle: string | null;
  eventPhotoUrl: string | null;
  eventDate: Date;

  invoiceCount: number;
  refundedBookingCount: number;
  remainingCount: number;

  invoices: GuestInvoiceItem[];
}

// ==========================================
// WELVORS INVOICES
// ==========================================

export interface WelvorsInvoiceQuery {
  month?: number;
  year: number;
}

export interface WelvorsInvoiceItem {
  month: number;
  year: number;
  monthLabel: string;

  invoiceNumber: string | null;
  issuedAt: Date | null;
  expectedIssueDate: string;

  status: "ESTIMATED" | "UPCOMING" | "ISSUED";

  eventCount: number;

  commissionPercentage: number | null;
  commissionAmount: number | null;

  gstPercentage: number | null;
  gstAmount: number | null;

  invoiceTotal: number | null;
}

// ==========================================
// TAX REPORT
// ==========================================

export interface OrganizerTaxReportQuery {
  month: number;
  year: number;
}

export interface OrganizerTaxReportSummary {
  grossTicketSales: number;
  refundAmount: number;
  netTicketSales: number;

  taxableValue: number | null;
  salesGstPercentage: number | null;
  salesGstAmount: number | null;

  gstTcsDeducted: number | null;
  tdsDeducted: number | null;

  commissionAmount: number | null;
  commissionGstAmount: number | null;
}

// ==========================================
// COMMON INVOICE QUERY
// ==========================================

export type InvoiceQuery =
  | ({
      type: "guest";
    } & GuestInvoiceQuery)

  | ({
      type: "welvors";
    } & WelvorsInvoiceQuery)

  | ({
      type: "tax-report";
    } & OrganizerTaxReportQuery);