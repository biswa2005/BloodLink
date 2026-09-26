import { env } from "../env.ts";
import { prisma } from "../lib/prisma.ts";

export async function sweepStalePings(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - env.STALE_PING_SECONDS * 1000);
  const result = await prisma.donor.updateMany({
    where: {
      isOnline: true,
      OR: [{ lastPingAt: null }, { lastPingAt: { lt: cutoff } }],
    },
    data: { isOnline: false },
  });
  return result.count;
}
