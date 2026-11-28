import { GlobalAmount } from "@prisma/client";
import { prisma } from "../../../../prisma/prismaClient";
import { GlobalAmountInput } from "./globalAmount.validation";


// export const createGlobalAmountService = async (
//   data: GlobalAmountInput,
// ) => {
//   const existing =
//     await prisma.globalAmount.findFirst();

//   if (existing) {
//     const updated =
//       await prisma.globalAmount.update({
//         where: {
//           id: existing.id,
//         },
//         data: {
//           gst: data.gst,
//           eventPlatformFee:
//             data.eventPlatformFee,
//         },
//       });

//     return {
//       message:
//         "Global amount updated successfully",
//       data: {
//         ...updated,
//         gst: Number(updated.gst),
//         eventPlatformFee: Number(
//           updated.eventPlatformFee,
//         ),
//       },
//     };
//   }

//   const created =
//     await prisma.globalAmount.create({
//       data: {
//         gst: data.gst,
//         eventPlatformFee:
//           data.eventPlatformFee,
//           freeProfileLimit: data.freeProfileLimit,
// premiumProfileLimit: data.premiumProfileLimit,
// vipProfileLimit: data.vipProfileLimit,
// vipEliteProfileLimit: data.vipEliteProfileLimit,
//       },
//     });

//   return {
//     message:
//       "Global amount created successfully",
//     data: {
//       ...created,
//       gst: Number(created.gst),
//       eventPlatformFee: Number(
//         created.eventPlatformFee,
//       ),
//     },
//   };
// };

// export const getGlobalAmountService =
//   async () => {
//     const data =
//       await prisma.globalAmount.findFirst();

//     if (!data) {
//       throw new Error(
//         "Global amount not configured",
//       );
//     }

//     return {
//       ...data,
//       gst: Number(data.gst),
//       eventPlatformFee: Number(
//         data.eventPlatformFee,
//       ),
//     };
//   };


// ==========================================
// FORMAT GLOBAL AMOUNT RESPONSE
// ==========================================

const formatGlobalAmount = (
  data: GlobalAmount,
) => {
  return {
    ...data,

    gst: Number(data.gst),

    gstTCS: Number(data.gstTCS),

    tds: Number(data.tds),

    eventPlatformFee: Number(
      data.eventPlatformFee,
    ),

    welvorsCommission: Number(
      data.welvorsCommission,
    ),
  };
};


// ==========================================
// CREATE OR UPDATE GLOBAL AMOUNT
// ==========================================

export const createGlobalAmountService = async (
  data: GlobalAmountInput,
) => {

  // STEP 1 - Check existing configuration

  const existing =
    await prisma.globalAmount.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });


  // STEP 2 - Prepare global amount data

  const globalAmountData = {
    gst: data.gst,

    gstTCS: data.gstTCS,

    tds: data.tds,

    eventPlatformFee: data.eventPlatformFee,

    welvorsCommission: data.welvorsCommission,

    freeProfileLimit: data.freeProfileLimit,

    premiumProfileLimit: data.premiumProfileLimit,

    vipProfileLimit: data.vipProfileLimit,

    vipEliteProfileLimit: data.vipEliteProfileLimit,
  };


  // STEP 3 - Update existing configuration

  if (existing) {

    const updated =
      await prisma.globalAmount.update({
        where: {
          id: existing.id,
        },

        data: globalAmountData,
      });

    return {
      message:
        "Global amount updated successfully",

      data: formatGlobalAmount(updated),
    };
  }


  // STEP 4 - Create new configuration

  const created =
    await prisma.globalAmount.create({
      data: globalAmountData,
    });

  return {
    message:
      "Global amount created successfully",

    data: formatGlobalAmount(created),
  };
};


// ==========================================
// GET GLOBAL AMOUNT
// ==========================================

export const getGlobalAmountService =
  async () => {

    const data =
      await prisma.globalAmount.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

    if (!data) {
      return null;
    }

    return formatGlobalAmount(data);
  };