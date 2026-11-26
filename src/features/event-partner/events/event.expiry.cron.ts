import cron from "node-cron";

import {
  expireEventsService,
} from "./event.service";

let isRunning = false;
let isStarted = false;

// ======================================================
// EXECUTE EVENT EXPIRY JOB
// ======================================================

const runEventExpiryJob = async () => {
  if (isRunning) {
    console.log(
      "[EVENT EXPIRY CRON] Previous job is still running"
    );

    return;
  }

  isRunning = true;

  try {
    const result = await expireEventsService();

    if (
      result.expiredDateCount > 0 ||
      result.expiredEventCount > 0 ||
      result.failedEventCount > 0
    ) {
      console.log(
        "[EVENT EXPIRY CRON] Result:",
        {
          executedAt: new Date().toISOString(),
          expiredDates: result.expiredDateCount,
          expiredEvents: result.expiredEventCount,
          failedEvents: result.failedEventCount,
        }
      );
    }

  } catch (error) {
    console.error(
      "[EVENT EXPIRY CRON] Error:",
      error
    );

  } finally {
    isRunning = false;
  }
};

// ======================================================
// START EVENT EXPIRY CRON
// ======================================================

export const startEventExpiryCron = () => {
  if (isStarted) {
    return;
  }

  isStarted = true;

  // Execute every minute

  cron.schedule(
    "* * * * *",
    () => {
      void runEventExpiryJob();
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log(
    "[EVENT EXPIRY CRON] Started successfully"
  );

  // Run immediately when server starts
  // to recover events missed during downtime

  void runEventExpiryJob();
};