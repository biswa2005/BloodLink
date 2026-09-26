import { ResponseStatus } from "@repo/db";
import { env } from "../env.ts";
import { prisma } from "../lib/prisma.ts";

export async function sweepNoShows(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - env.NO_SHOW_GRACE_MINUTES * 60_000);
  const stale = await prisma.requestResponse.findMany({
    where: { status: ResponseStatus.ACCEPTED, respondedAt: { lt: cutoff } },
    select: { id: true, donorId: true },
  });
  if (stale.length === 0) return 0;

  const ids = stale.map((row) => row.id);
  await prisma.$transaction(async (tx) => {
    const updated = await tx.requestResponse.updateMany({
      where: { id: { in: ids }, status: ResponseStatus.ACCEPTED },
      data: { status: ResponseStatus.NO_SHOW },
    });
    if (updated.count === 0) return;

    const donorIds = new Set(stale.map((row) => row.donorId));
    for (const donorId of donorIds) {
      await tx.donorReliability.upsert({
        where: { donorId },
        create: { donorId, noShowCount: 1, score: 90 },
        update: { noShowCount: { increment: 1 }, score: { increment: -10 } },
      });
    }
  });

  return stale.length;
}
