import cron from "node-cron";
import { endExpiredBoostsService } from "../features/boost/boost.expiry.service";

export const startBoostExpiryJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const result = await endExpiredBoostsService();

      if (result.endedCount > 0) {
        console.log(
          `Boost expiry job: ${result.endedCount} boost(s) ended`
        );
      }
    } catch (error) {
      console.error(
        "Boost expiry job error:",
        error
      );
    }
  });

  console.log("Boost expiry job started");
};