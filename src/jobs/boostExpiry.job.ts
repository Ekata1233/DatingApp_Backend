import cron from "node-cron";
import { endExpiredBoostsService } from "../features/boost/boost.expiry.service";

export const startBoostExpiryJob = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    try {
      const result = await endExpiredBoostsService();

      if (result.endedCount > 0) {
        
      }
    } catch (error) {
      console.error(
        "Boost expiry job error:",
        error
      );
    }
  });

};