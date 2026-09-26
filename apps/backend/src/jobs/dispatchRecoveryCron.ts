import { RequestStatus } from "@repo/db";
import { env } from "../env.ts";
import { prisma } from "../lib/prisma.ts";
import {
  dispatch,
  hasFallbackTimer,
  runFallbackWave,
  scheduleFallbackWave,
} from "../services/matchingEngine.ts";

const MIN_AGE_MS = 60_000;
const BATCH = 100;

export async function recoverStuckRequests(
  now: Date = new Date(),
): Promise<number> {
  const requests = await prisma.emergencyRequest.findMany({
    where: {
      status: { in: [RequestStatus.OPEN, RequestStatus.MATCHED] },
      createdAt: { lte: new Date(now.getTime() - MIN_AGE_MS) },
    },
    select: {
      id: true,
      createdAt: true,
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH,
  });

  let recovered = 0;

  for (const request of requests) {
    if (hasFallbackTimer(request.id)) continue;

    const age = now.getTime() - request.createdAt.getTime();
    const fallbackDue = age >= env.WAVE_FALLBACK_DELAY_MINUTES * 60_000;

    if (request._count.responses === 0) {
      await dispatch(request.id);
      recovered++;
    } else if (fallbackDue) {
      await runFallbackWave(request.id);
      recovered++;
    } else {
      scheduleFallbackWave(request.id);
    }
  }

  return recovered;
}
