// purchaseStore.repository.ts

import { prisma } from "../../prisma/prismaClient";

export async function findStoreItem(id: string) {

    return prisma.storePack.findUnique({
        where: {
            id,
            isActive: true
        },
        include: {
            features: true
        }
    });

}