import { prisma } from "../../../../prisma/prismaClient";

interface GlobalAmountInput {
  gst: number;
  eventPlatformFee: number;
}

export const createGlobalAmountService = async (
  data: GlobalAmountInput,
) => {
  const existing =
    await prisma.globalAmount.findFirst();

  if (existing) {
    const updated =
      await prisma.globalAmount.update({
        where: {
          id: existing.id,
        },
        data: {
          gst: data.gst,
          eventPlatformFee:
            data.eventPlatformFee,
        },
      });

    return {
      message:
        "Global amount updated successfully",
      data: {
        ...updated,
        gst: Number(updated.gst),
        eventPlatformFee: Number(
          updated.eventPlatformFee,
        ),
      },
    };
  }

  const created =
    await prisma.globalAmount.create({
      data: {
        gst: data.gst,
        eventPlatformFee:
          data.eventPlatformFee,
      },
    });

  return {
    message:
      "Global amount created successfully",
    data: {
      ...created,
      gst: Number(created.gst),
      eventPlatformFee: Number(
        created.eventPlatformFee,
      ),
    },
  };
};

export const getGlobalAmountService =
  async () => {
    const data =
      await prisma.globalAmount.findFirst();

    if (!data) {
      throw new Error(
        "Global amount not configured",
      );
    }

    return {
      ...data,
      gst: Number(data.gst),
      eventPlatformFee: Number(
        data.eventPlatformFee,
      ),
    };
  };