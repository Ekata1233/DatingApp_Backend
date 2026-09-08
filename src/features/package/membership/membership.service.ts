import {
  findCurrentMembership,
  findMembershipHistory,
  findMembershipInvoiceById,
  getTotalMembershipPaid,
} from "./membership.repository";

import {
  MembershipPaymentMethod,
} from "./membership.types";

const toNumber = (value: any): number => {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
};

/**
 * Extract payment method from gatewayResponse.
 *
 * Supports common gateway response structures.
 * You can adjust this based on your PayU/Razorpay response.
 */
const extractPaymentMethod = (
  gatewayResponse: any,
): MembershipPaymentMethod => {
  if (!gatewayResponse) {
    return {
      type: null,
      displayValue: null,
    };
  }

  const response =
    typeof gatewayResponse === "string"
      ? safelyParseJson(gatewayResponse)
      : gatewayResponse;

  if (!response) {
    return {
      type: null,
      displayValue: null,
    };
  }

  /*
   * --------------------------------------------
   * UPI
   * --------------------------------------------
   */

  const upiId =
    response?.vpa ||
    response?.upiId ||
    response?.upi_id ||
    response?.payment?.vpa ||
    response?.payment?.upiId ||
    response?.result?.vpa ||
    null;

  if (upiId) {
    return {
      type: "UPI",
      displayValue: maskUpiId(upiId),
    };
  }

  /*
   * --------------------------------------------
   * CARD
   * --------------------------------------------
   */

  const last4 =
    response?.card?.last4 ||
    response?.cardLast4 ||
    response?.card_last4 ||
    response?.payment?.card?.last4 ||
    response?.result?.card?.last4 ||
    null;

  if (last4) {
    return {
      type: "CARD",
      displayValue: `····${last4}`,
    };
  }

  /*
   * --------------------------------------------
   * WALLET
   * --------------------------------------------
   */

  const method =
    response?.method ||
    response?.paymentMethod ||
    response?.payment_method ||
    response?.mode ||
    response?.payment?.method ||
    null;

  if (
    method &&
    String(method).toUpperCase().includes("WALLET")
  ) {
    return {
      type: "WALLET",
      displayValue: "Wallet",
    };
  }

  /*
   * Detect UPI from mode
   */

  if (
    method &&
    String(method).toUpperCase().includes("UPI")
  ) {
    return {
      type: "UPI",
      displayValue: "UPI",
    };
  }

  /*
   * Detect Card
   */

  if (
    method &&
    ["CARD", "CC", "DC", "CREDIT_CARD", "DEBIT_CARD"].includes(
      String(method).toUpperCase(),
    )
  ) {
    return {
      type: "CARD",
      displayValue: "Card",
    };
  }

  return {
    type: "OTHER",
    displayValue: method ? String(method) : "Online payment",
  };
};

const safelyParseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * Example:
 *
 * aniket@oksbi
 *
 * ->
 *
 * ····@oksbi
 */
const maskUpiId = (upiId: string) => {
  const value = String(upiId);

  if (!value.includes("@")) {
    return "UPI";
  }

  const [, provider] = value.split("@");

  return `····@${provider}`;
};

/**
 * Transform PackageStatus into UI-friendly value.
 */
const getMembershipStatus = (
  packageStatus: string,
  endDate?: Date | null,
) => {
  const now = new Date();

  if (packageStatus === "ACTIVE") {
    if (endDate && new Date(endDate) < now) {
      return "EXPIRED";
    }

    return "ACTIVE";
  }

  if (packageStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (packageStatus === "EXPIRED") {
    return "EXPIRED";
  }

  if (packageStatus === "REFUNDED") {
    return "REFUNDED";
  }

  return packageStatus;
};

const getInvoiceUrl = (
  userPackageId: string,
  paymentId: string | null,
) => {
  if (!paymentId) {
    return null;
  }

  /*
   * This will be your future invoice endpoint.
   *
   * Example:
   *
   * GET /api/user/membership-plan/history/:userPackageId/invoice
   */

  return `/api/user/membership-plan/history/${userPackageId}/invoice`;
};

export const getMembershipPlanService = async (
  userId: string,
) => {
  const [currentMembership, membershipHistory, totalPaidResult] =
    await Promise.all([
      findCurrentMembership(userId),
      findMembershipHistory(userId),
      getTotalMembershipPaid(userId),
    ]);

  /*
   * --------------------------------------------------
   * Current Plan
   * --------------------------------------------------
   */

  let currentPlan = null;

  if (currentMembership) {
    const selectedPackage =
      currentMembership.currentPackage ||
      currentMembership.package;

    currentPlan = {
      userPackageId: currentMembership.id,

      packageId: selectedPackage.id,

      name: selectedPackage.name,
      slug: selectedPackage.slug,
      tagline: selectedPackage.tagline,

      billingCycle: currentMembership.price.billingCycle,

      months: currentMembership.price.months,

      status: getMembershipStatus(
        currentMembership.status,
        currentMembership.endDate,
      ),

      startDate: currentMembership.startDate,

      endDate: currentMembership.endDate,

      renewsOn: currentMembership.autoRenew
        ? currentMembership.endDate
        : null,

      autoRenew: currentMembership.autoRenew,

      amount: toNumber(
        currentMembership.purchasePrice,
      ),

      paymentMethod: extractPaymentMethod(
        currentMembership.payment?.gatewayResponse,
      ),
    };
  }

  /*
   * --------------------------------------------------
   * Plan History
   * --------------------------------------------------
   */

  const history = membershipHistory.map((item) => {
    const selectedPackage =
      item.currentPackage || item.package;

    const paymentMethod = extractPaymentMethod(
      item.payment?.gatewayResponse,
    );

    const paymentId = item.payment?.id ?? null;

    return {
      userPackageId: item.id,

      packageId: selectedPackage.id,

      name: selectedPackage.name,
      slug: selectedPackage.slug,

      billingCycle: item.price.billingCycle,

      months: item.price.months,

      purchasedAt:
        item.payment?.paidAt ||
        item.payment?.created_at ||
        item.createdAt,

      startDate: item.startDate,
      endDate: item.endDate,

      status: getMembershipStatus(
        item.status,
        item.endDate,
      ),

      amount: toNumber(item.purchasePrice),

      originalPrice: item.purchaseOriginalPrice
        ? toNumber(item.purchaseOriginalPrice)
        : null,

      discountPercent:
        item.purchaseDiscount ?? null,

      paymentMethod,

      paymentId,

      transactionId:
        item.payment?.transactionId ?? null,

      invoiceAvailable: !!paymentId,

      invoiceUrl: getInvoiceUrl(
        item.id,
        paymentId,
      ),
    };
  });

  /*
   * --------------------------------------------------
   * Total paid
   * --------------------------------------------------
   */

  const totalPaid = toNumber(
    totalPaidResult._sum.amount,
  );

  return {
    currentPlan,

    history,

    summary: {
      totalPaid,
      totalPlans: history.length,
    },
  };
};


const GST_PERCENTAGE = 18;

const COMPANY_DETAILS = {
  name: "Welvors",
  legalName: "INFYNOD TECH PRIVATE LIMITED",

  gstin: process.env.COMPANY_GSTIN || null,

  sacCode: "998439",

  registeredOffice:
    process.env.COMPANY_REGISTERED_OFFICE ||
    "Office No. 243, The Capital, Hadapsar, Pune, 411028",
};


const maskUpi = (upiId: string) => {
  if (!upiId.includes("@")) {
    return "UPI";
  }

  const [, bank] = upiId.split("@");

  return `····@${bank}`;
};



/**
 * Generates invoice number without storing it.
 *
 * Example:
 * INV-2026-0512-A8C129
 */
const generateInvoiceNumber = (
  userPackageId: string,
  paidAt: Date,
) => {
  const date = new Date(paidAt);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const shortId = userPackageId
  .replace(/-/g, "")
  .slice(0, 6)
  .toUpperCase();

  return `INV-${year}-${month}${day}-${shortId}`;
};

const getPlanDisplayName = (name: string) => {
  if (name === "PREMIUM") {
    return "Premium+";
  }

  if (name === "VIP_ELITE") {
    return "VIP Elite";
  }

  if (name === "VIP") {
    return "VIP";
  }

  return name;
};

const getBillingCycleLabel = (
  billingCycle: string,
  months: number | null,
) => {
  if (months) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  switch (billingCycle) {
    case "MONTHLY":
      return "1 month";

    case "QUARTERLY":
      return "3 months";

    case "HALF_YEARLY":
      return "6 months";

    case "YEARLY":
      return "12 months";

    case "LIFETIME":
      return "Lifetime";

    default:
      return billingCycle;
  }
};

export const getMembershipInvoiceService = async (
  userId: string,
  userPackageId: string,
) => {
  const membership = await findMembershipInvoiceById(
    userId,
    userPackageId,
  );

  if (!membership) {
    throw new Error("Membership purchase not found");
  }

  if (!membership.payment) {
    throw new Error("Payment information not found");
  }

  const payment = membership.payment;

  const selectedPackage =
    membership.currentPackage || membership.package;

  const totalPaid = Number(
    payment.amount || membership.purchasePrice,
  );

  /*
   * Your Payment.amount should represent final amount paid.
   *
   * We calculate base amount + GST only for invoice display.
   */

  const taxableAmount = Number(
    (totalPaid / (1 + GST_PERCENTAGE / 100)).toFixed(2),
  );

  const gstAmount = Number(
    (totalPaid - taxableAmount).toFixed(2),
  );

  const paidAt =
    payment.paidAt ||
    payment.created_at ||
    membership.createdAt;

  const paymentMethod = extractPaymentMethod(
    payment.gatewayResponse,
  );

  return {
    invoice: {
      invoiceNumber: generateInvoiceNumber(
        membership.id,
        paidAt,
      ),

      date: paidAt,

      status:
        payment.status === "COMPLETED"
          ? "PAID"
          : payment.status,

      currency: payment.currency || "INR",
    },

    company: {
      brandName: COMPANY_DETAILS.name,

      legalName: COMPANY_DETAILS.legalName,

      gstin: COMPANY_DETAILS.gstin,

      sacCode: COMPANY_DETAILS.sacCode,

      registeredOffice:
        COMPANY_DETAILS.registeredOffice,
    },

    billedTo: {
      userId: membership.user.id,

      name:
        membership.user.full_name ||
        "Welvors User",

      email: membership.user.email,

      phone: membership.user.phone_number,

      /*
       * You currently don't store user's GSTIN.
       */
      gstin: null,
    },

    membership: {
      userPackageId: membership.id,

      packageId: selectedPackage.id,

      packageName: getPlanDisplayName(
        selectedPackage.name,
      ),

      packageCode: selectedPackage.name,

      billingCycle:
        membership.price.billingCycle,

      months: membership.price.months,

      durationLabel: getBillingCycleLabel(
        membership.price.billingCycle,
        membership.price.months,
      ),

      startDate: membership.startDate,

      endDate: membership.endDate,
    },

    amount: {
      taxableAmount,

      gstPercentage: GST_PERCENTAGE,

      gstAmount,

      totalPaid,
    },

    payment: {
      paymentId: payment.id,

      gatewayPaymentId:
        payment.payment_id,

      transactionId:
        payment.transactionId,

      method: paymentMethod.type,

      displayMethod: paymentMethod.displayValue,

      paidAt,
    },

    note: `Digital service · SAC ${COMPANY_DETAILS.sacCode} · This is a computer-generated invoice.`,

    actions: {
      pdfAvailable: true,

      pdfUrl:
        `/api/user/membership-plan/invoice/${membership.id}/pdf`,
    },
  };
};