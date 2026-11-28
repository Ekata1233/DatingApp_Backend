export interface GetEventPayoutInput {
  businessId: string;
  eventId: string;
  eventDateId: string;
}

export interface PayoutDeduction {
  label: string;
  percentage: number;
  amount: number;
}

export interface EventPayoutSummary {
  ticketSales: {
    ticketCount: number;
    guestCount: number;
    grossAmount: number;
    refundAmount: number;
    amount: number;
  };

  ticketGST: PayoutDeduction;

  tds: PayoutDeduction;

  gstTCS: PayoutDeduction;

  welvorsCommission: PayoutDeduction;

  gstOnCommission: PayoutDeduction;

  totalDeductions: number;

  organizerReceivable: number;

  currency: string;

  isEstimated: boolean;
}

export class EventPayoutServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);

    this.name = "EventPayoutServiceError";
  }
}