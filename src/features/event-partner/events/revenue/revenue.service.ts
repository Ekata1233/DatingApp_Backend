import { Prisma } from "@prisma/client";
import { CalculateRevenueInput } from "./revenue.types";

// ======================================================
// STATIC TAX & COMMISSION CONFIGURATION
// ======================================================

const TICKET_GST_PERCENTAGE = 18;
const TDS_PERCENTAGE = 0.1;
const GST_TCS_PERCENTAGE = 0.5;
const WELVORS_COMMISSION_PERCENTAGE = 20;
const COMMISSION_GST_PERCENTAGE = 18;

const Decimal = Prisma.Decimal;

// ======================================================
// HELPERS
// ======================================================

const roundMoney = (value: Prisma.Decimal) => {
  return value.toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP
  );
};

const toAmount = (value: Prisma.Decimal) => {
  return roundMoney(value).toNumber();
};

const calculatePercentage = (
  amount: Prisma.Decimal,
  percentage: number
) => {
  return roundMoney(
    amount.mul(percentage).div(100)
  );
};

const calculateTicketRevenue = (
  capacity: number,
  entryPrice: number,
  discountPercentage: number
) => {
  const originalPrice = roundMoney(
    new Decimal(entryPrice)
  );

  const discountAmount = calculatePercentage(
    originalPrice,
    discountPercentage
  );

  const finalPrice = originalPrice.minus(discountAmount);

  const revenue = roundMoney(
    finalPrice.mul(capacity)
  );

  return {
    capacity,
    entryPrice: toAmount(originalPrice),
    discountPercentage,
    discountAmount: toAmount(discountAmount),
    discountedPrice: toAmount(finalPrice),
    revenue: toAmount(revenue),
  };
};

// ======================================================
// CALCULATE EVENT REVENUE
// ======================================================

export const calculateRevenueService = (
  input: CalculateRevenueInput
) => {
  const isCouple = input.priceType === "PER_COUPLE";

  // Individual tickets
  const men = calculateTicketRevenue(
    isCouple ? 0 : input.menCapacity,
    input.menEntryPrice,
    input.menDiscountPercentage
  );

  const women = calculateTicketRevenue(
    isCouple ? 0 : input.womenCapacity,
    input.womenEntryPrice,
    input.womenDiscountPercentage
  );

  const other = calculateTicketRevenue(
    isCouple ? 0 : input.otherCapacity,
    input.otherEntryPrice,
    input.otherDiscountPercentage
  );

  // Couple tickets
  const couple = calculateTicketRevenue(
    isCouple ? input.coupleCapacity : 0,
    input.coupleEntryPrice,
    input.coupleDiscountPercentage
  );

  // Total sellable tickets
  const totalTickets = isCouple
    ? input.coupleCapacity
    : input.menCapacity +
      input.womenCapacity +
      input.otherCapacity;

  // Total ticket sales (GST inclusive)
  const ticketSales = new Decimal(men.revenue)
    .plus(women.revenue)
    .plus(other.revenue)
    .plus(couple.revenue);

  // GST included in ticket sales
  const ticketGst = roundMoney(
    ticketSales
      .mul(TICKET_GST_PERCENTAGE)
      .div(100 + TICKET_GST_PERCENTAGE)
  );

  // Ticket sales excluding GST
  const taxableTicketSales = ticketSales.minus(ticketGst);

  // TDS
  const tds = calculatePercentage(
    ticketSales,
    TDS_PERCENTAGE
  );

  // GST TCS
  const gstTcs = calculatePercentage(
    taxableTicketSales,
    GST_TCS_PERCENTAGE
  );

  // Welvors commission
  const welvorsCommission = calculatePercentage(
    ticketSales,
    WELVORS_COMMISSION_PERCENTAGE
  );

  // GST on Welvors commission
  const commissionGst = calculatePercentage(
    welvorsCommission,
    COMMISSION_GST_PERCENTAGE
  );

  // Total deductions
  const totalDeductions = tds
    .plus(gstTcs)
    .plus(welvorsCommission)
    .plus(commissionGst);

  // Final organizer payout
  const organizerPayout = ticketSales.minus(
    totalDeductions
  );

  return {
    currency: "INR",
    isEstimate: true,

    priceType: input.priceType,
    totalCapacity: input.totalCapacity,
    totalTickets,

    ticketBreakdown: isCouple
      ? { couple }
      : { men, women, other },

    ticketSales: toAmount(ticketSales),

    taxableTicketSales: toAmount(taxableTicketSales),

    ticketGst: {
      percentage: TICKET_GST_PERCENTAGE,
      amount: toAmount(ticketGst),
      isIncludedInTicketPrice: true,
    },

    deductions: {
      tds: {
        percentage: TDS_PERCENTAGE,
        amount: toAmount(tds),
      },

      gstTcs: {
        percentage: GST_TCS_PERCENTAGE,
        amount: toAmount(gstTcs),
      },

      welvorsCommission: {
        percentage: WELVORS_COMMISSION_PERCENTAGE,
        amount: toAmount(welvorsCommission),
      },

      commissionGst: {
        percentage: COMMISSION_GST_PERCENTAGE,
        amount: toAmount(commissionGst),
      },
    },

    totalDeductions: toAmount(totalDeductions),

    organizerPayout: toAmount(organizerPayout),

    note:
      "Estimated payout assuming all tickets are sold. " +
      "Ticket GST is included in ticket sales and is not " +
      "separately deducted from the organizer payout.",
  };
};