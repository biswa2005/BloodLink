import { schedule } from "node-cron";
import { recoverStuckRequests } from "./dispatchRecoveryCron.ts";
import { refreshEligibility } from "./eligibilityCron.ts";
import { sweepNoShows } from "./noShowCron.ts";
import { sweepStalePings } from "./stalePingCron.ts";

export function startJobs(): void {
  schedule("*/10 * * * *", () => {
    void sweepNoShows()
      .then((count) => {
        if (count > 0)
          console.log(`[jobs] no-show sweep penalized ${count} donor(s)`);
      })
      .catch((err: unknown) => {
        console.error("[jobs] no-show sweep failed:", err);
      });
  });

  schedule("* * * * *", () => {
    void sweepStalePings()
      .then((count) => {
        if (count > 0)
          console.log(`[jobs] stale-ping sweep took ${count} donor(s) offline`);
      })
      .catch((err: unknown) => {
        console.error("[jobs] stale-ping sweep failed:", err);
      });
  });

  schedule("* * * * *", () => {
    void recoverStuckRequests()
      .then((count) => {
        if (count > 0)
          console.log(
            `[jobs] dispatch recovery re-matched ${count} request(s)`,
          );
      })
      .catch((err: unknown) => {
        console.error("[jobs] dispatch recovery failed:", err);
      });
  });

  setTimeout(() => {
    void recoverStuckRequests()
      .then((count) => {
        if (count > 0)
          console.log(`[jobs] startup recovery re-matched ${count} request(s)`);
      })
      .catch((err: unknown) => {
        console.error("[jobs] startup recovery failed:", err);
      });
  }, 3_000);

  schedule("0 * * * *", () => {
    void refreshEligibility()
      .then((count) => {
        if (count > 0)
          console.log(`[jobs] eligibility refresher flipped ${count} donor(s)`);
      })
      .catch((err: unknown) => {
        console.error("[jobs] eligibility refresher failed:", err);
      });
  });

  setTimeout(() => {
    void refreshEligibility()
      .then((count) => {
        if (count > 0)
          console.log(
            `[jobs] startup eligibility refresher flipped ${count} donor(s)`,
          );
      })
      .catch((err: unknown) => {
        console.error("[jobs] startup eligibility refresher failed:", err);
      });
  }, 1_000);

  console.log(
    "[jobs] scheduled: no-show every 10m, stale-ping every 1m, dispatch recovery every 1m, eligibility hourly",
  );
}
