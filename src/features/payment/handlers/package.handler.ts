import { processPackageActivation } from "../../package/package.service";

export async function activatePackage(tx: any, payment: any) {
  if (!tx || typeof tx.packagePrice?.findUnique !== 'function') {
    console.error("Invalid transaction object:", tx);
    throw new Error("Invalid transaction object provided. Transaction client missing required methods.");
  }
  
  return await processPackageActivation(tx, payment);
}