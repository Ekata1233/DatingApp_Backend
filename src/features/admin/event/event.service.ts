import { prisma } from "../../../prisma/prismaClient";
import { CreateEventInput } from "./event.types";

export const createEvent = async (payload: CreateEventInput) => {
  const event = await prisma.event.create({
    data: {
      eventType: payload.eventType,
      title: payload.title,
      status: payload.status,
      currentStep: 2,
      basicsDone: true,
    },
    select: {
      id: true,
      eventType: true,
      title: true,
      status: true,
      currentStep: true,
    },
  });

  return event;
};