
import { Prisma } from "@prisma/client";

import {
  EventFormat,
  EventServiceError,
} from "./event.types";

type DecimalValue =
  | Prisma.Decimal
  | number
  | string
  | null
  | undefined;

interface PricingInput {
  priceType?: string | null;

  totalCapacity?: number | null;

  menCapacity?: number | null;
  womenCapacity?: number | null;
  otherCapacity?: number | null;

  menEntryPrice?: DecimalValue;
  womenEntryPrice?: DecimalValue;
  otherEntryPrice?: DecimalValue;

  menDiscountPercentage?: DecimalValue;
  womenDiscountPercentage?: DecimalValue;
  otherDiscountPercentage?: DecimalValue;

  coupleCapacity?: number | null;
  coupleEntryPrice?: DecimalValue;
  coupleDiscountPercentage?: DecimalValue;
}

// Calculate discounted price
export const calculateDiscountedPrice = (
  entryPrice: DecimalValue,
  discountPercentage: DecimalValue
): Prisma.Decimal | null => {
  if (entryPrice === null || entryPrice === undefined) {
    return null;
  }

  const amount = new Prisma.Decimal(entryPrice);

  const discount = new Prisma.Decimal(
    discountPercentage ?? 0
  );

  if (amount.lessThan(0)) {
    throw new EventServiceError(
      "Entry price cannot be negative"
    );
  }

  if (
    discount.lessThan(0) ||
    discount.greaterThan(100)
  ) {
    throw new EventServiceError(
      "Discount must be between 0 and 100"
    );
  }

  return amount
    .minus(
      amount.mul(discount).div(100)
    )
    .toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
};

// Prepare pricing according to event format
export const prepareEventPricing = (
  format: EventFormat,
  data: PricingInput
) => {
  // COUPLES TRIP
  if (format === "COUPLES_TRIP") {
    const coupleCapacity = data.coupleCapacity ?? null;

    return {
      priceType: "PER_COUPLE" as const,

      totalCapacity:
        coupleCapacity === null
          ? null
          : coupleCapacity * 2,

      coupleCapacity,

      coupleEntryPrice:
        data.coupleEntryPrice ?? null,

      coupleDiscountPercentage:
        data.coupleDiscountPercentage ?? null,

      coupleDiscountedPrice:
        calculateDiscountedPrice(
          data.coupleEntryPrice,
          data.coupleDiscountPercentage
        ),

      // Clear individual pricing
      menCapacity: null,
      womenCapacity: null,
      otherCapacity: null,

      menEntryPrice: null,
      womenEntryPrice: null,
      otherEntryPrice: null,

      menDiscountPercentage: null,
      womenDiscountPercentage: null,
      otherDiscountPercentage: null,

      menDiscountedPrice: null,
      womenDiscountedPrice: null,
      otherDiscountedPrice: null,
    };
  }

  // SINGLE DAY and GROUP TRIP
  const menCapacity = data.menCapacity ?? null;
  const womenCapacity = data.womenCapacity ?? null;
  const otherCapacity = data.otherCapacity ?? null;

  const hasCapacity =
    menCapacity !== null ||
    womenCapacity !== null ||
    otherCapacity !== null;

  const totalCapacity = hasCapacity
    ? (menCapacity ?? 0) +
      (womenCapacity ?? 0) +
      (otherCapacity ?? 0)
    : null;

  return {
    priceType: "PER_PERSON" as const,

    totalCapacity,

    menCapacity,
    womenCapacity,
    otherCapacity,

    menEntryPrice: data.menEntryPrice ?? null,
    womenEntryPrice: data.womenEntryPrice ?? null,
    otherEntryPrice: data.otherEntryPrice ?? null,

    menDiscountPercentage:
      data.menDiscountPercentage ?? null,

    womenDiscountPercentage:
      data.womenDiscountPercentage ?? null,

    otherDiscountPercentage:
      data.otherDiscountPercentage ?? null,

    menDiscountedPrice: calculateDiscountedPrice(
      data.menEntryPrice,
      data.menDiscountPercentage
    ),

    womenDiscountedPrice: calculateDiscountedPrice(
      data.womenEntryPrice,
      data.womenDiscountPercentage
    ),

    otherDiscountedPrice: calculateDiscountedPrice(
      data.otherEntryPrice,
      data.otherDiscountPercentage
    ),

    // Clear couple pricing
    coupleCapacity: null,
    coupleEntryPrice: null,
    coupleDiscountPercentage: null,
    coupleDiscountedPrice: null,
  };
};
