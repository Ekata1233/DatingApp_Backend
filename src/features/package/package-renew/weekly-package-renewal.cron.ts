import cron from "node-cron";
import { renewWeeklyPackageBenefits } from "./weekly-package-renewal.service";

let isRunning = false;
let isStarted = false;

export const startWeeklyPackageRenewalCron = () => {
  if (isStarted) {
    return;
  }

  isStarted = true;

  cron.schedule(
    "15 0 * * *",
    async () => {
      try {
        const result = await renewWeeklyPackageBenefits();

        console.log("Weekly package renewal completed:", result);
      } catch (error) {
        console.error("Weekly package renewal cron failed:", error);
      }
    },
    {
      timezone: "Asia/Kolkata",
      noOverlap: true,
    },
  );

  console.log("Weekly package renewal cron started");
};
