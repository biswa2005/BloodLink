import { RequestStatus, ResponseStatus } from "@repo/db";
import type { BloodGroup, EmergencyRequest, RequestItem } from "@repo/db";
import { env } from "../env.ts";
import { emitDonorLocation } from "../lib/socket.ts";
import { prisma } from "../lib/prisma.ts";
import { compatibleDonorGroups } from "../utils/compatibility.ts";
import { isEligible } from "../utils/eligibility.ts";
import {
  findCandidateDonors,
  haversineKm,
  type CandidateDonor,
} from "../utils/geo.ts";
import { notifyDonor } from "./notificationService.ts";
import { issueActionToken } from "./qrService.ts";

type RequestWithItems = EmergencyRequest & { items: RequestItem[] };

const fallbackTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function rankDonors(candidates: CandidateDonor[]): CandidateDonor[] {
  return [...candidates].sort(
    (a, b) =>
      a.distanceKm - b.distanceKm ||
      b.reliabilityScore - a.reliabilityScore ||
      (a.lastDonationDate?.getTime() ?? 0) -
        (b.lastDonationDate?.getTime() ?? 0),
  );
}

export type DispatchResult = { candidates: number; notified: number };

async function needsMoreDonors(
  requestId: string,
  items: RequestItem[],
): Promise<boolean> {
  const needed = items.reduce((sum, item) => sum + item.unitsNeeded, 0);
  const engaged = await prisma.requestResponse.count({
    where: {
      requestId,
      status: { in: [ResponseStatus.ACCEPTED, ResponseStatus.ARRIVED] },
    },
  });
  return engaged < needed;
}

export async function dispatch(requestId: string): Promise<DispatchResult> {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    include: { items: true, hospital: true },
  });
  if (
    !request ||
    (request.status !== RequestStatus.OPEN &&
      request.status !== RequestStatus.MATCHED)
  ) {
    return { candidates: 0, notified: 0 };
  }
  if (!(await needsMoreDonors(request.id, request.items))) {
    return { candidates: 0, notified: 0 };
  }

  const exactGroups = [
    ...new Set(request.items.map((item) => item.bloodGroup)),
  ];
  const candidates = await findCandidateDonors({
    bloodGroups: exactGroups,
    from: {
      latitude: request.hospital.latitude,
      longitude: request.hospital.longitude,
    },
    radiusKm: request.radiusKm,
  });

  if (candidates.length === 0) {
    console.log(
      `[matching] request ${requestId}: no online donors for ${exactGroups.join(", ")} within ${request.radiusKm} km — donors can still see it in their open feed`,
    );
  }

  const notified = await notifyWave(
    request,
    rankDonors(candidates).slice(0, env.WAVE_SIZE),
  );
  scheduleFallbackWave(requestId);
  return { candidates: candidates.length, notified };
}

async function notifyWave(
  request: RequestWithItems & {
    hospital: { name: string; latitude: number; longitude: number };
  },
  candidates: CandidateDonor[],
): Promise<number> {
  if (candidates.length === 0) return 0;

  const existing = await prisma.requestResponse.findMany({
    where: {
      requestId: request.id,
      donorId: { in: candidates.map((c) => c.donorId) },
    },
    select: { donorId: true, status: true },
  });
  const statusByDonor = new Map(
    existing.map((row) => [row.donorId, row.status]),
  );

  let notified = 0;

  await Promise.all(
    candidates.map(async (candidate) => {
      const prior = statusByDonor.get(candidate.donorId);
      if (prior && prior !== ResponseStatus.NOTIFIED) return;

      await prisma.requestResponse.upsert({
        where: {
          requestId_donorId: {
            requestId: request.id,
            donorId: candidate.donorId,
          },
        },
        create: {
          requestId: request.id,
          donorId: candidate.donorId,
          status: ResponseStatus.NOTIFIED,
        },
        update: {},
      });
      if (!prior) notified++;

      emitDonorLocation(request.id, {
        donorId: candidate.donorId,
        name: candidate.name,
        bloodGroup: candidate.bloodGroup,
        status: "notified",
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        distanceKm: candidate.distanceKm,
        reliabilityScore: candidate.reliabilityScore,
      });

      if (prior === ResponseStatus.NOTIFIED) return;

      const token = issueActionToken(candidate.donorId, request.id);
      await notifyDonor({
        donorName: candidate.name,
        phone: candidate.phone,
        hospitalName: request.hospital.name,
        items: request.items.map((item) => ({
          bloodGroup: item.bloodGroup,
          unitsNeeded: item.unitsNeeded - item.unitsFulfilled,
        })),
        urgency: request.urgency,
        distanceKm: candidate.distanceKm,
        acceptUrl: `${env.PUBLIC_BASE_URL}/donor/respond/${token}?action=accept`,
        denyUrl: `${env.PUBLIC_BASE_URL}/donor/respond/${token}?action=deny`,
      }).catch((err: unknown) => {
        console.error("[matching] notification failed:", err);
      });
    }),
  );

  return notified;
}

export async function matchDonor(donorId: string): Promise<void> {
  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
    include: { user: { select: { phone: true } }, reliability: true },
  });
  if (!donor || !donor.isOnline) return;
  if (!isEligible(donor.lastDonationDate)) return;
  if (donor.latitude === null || donor.longitude === null) return;
  const pingCutoff = new Date(Date.now() - env.STALE_PING_SECONDS * 1000);
  if (!donor.lastPingAt || donor.lastPingAt < pingCutoff) return;

  const requests = await prisma.emergencyRequest.findMany({
    where: { status: { in: [RequestStatus.OPEN, RequestStatus.MATCHED] } },
    include: { items: true, hospital: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  if (requests.length === 0) return;

  const fallbackAfter = env.WAVE_FALLBACK_DELAY_MINUTES * 60_000;

  for (const request of requests) {
    const distanceKm = haversineKm(
      {
        latitude: request.hospital.latitude,
        longitude: request.hospital.longitude,
      },
      { latitude: donor.latitude, longitude: donor.longitude },
    );
    if (distanceKm > request.radiusKm) continue;

    const unfilled = request.items.filter(
      (item) => item.unitsFulfilled < item.unitsNeeded,
    );
    if (unfilled.length === 0) continue;

    const exact = unfilled.some((item) => item.bloodGroup === donor.bloodGroup);
    const substitute = unfilled.some((item) =>
      compatibleDonorGroups(item.bloodGroup).includes(donor.bloodGroup),
    );
    const fallbackDue =
      Date.now() - request.createdAt.getTime() > fallbackAfter;
    if (!exact && !(substitute && fallbackDue)) continue;

    await notifyWave(request, [
      {
        donorId: donor.id,
        name: donor.name,
        phone: donor.user.phone,
        bloodGroup: donor.bloodGroup,
        latitude: donor.latitude,
        longitude: donor.longitude,
        distanceKm: Number(distanceKm.toFixed(2)),
        reliabilityScore: donor.reliability?.score ?? 100,
        lastDonationDate: donor.lastDonationDate,
      },
    ]);
  }
}

export function scheduleFallbackWave(requestId: string): void {
  if (fallbackTimers.has(requestId)) return;
  const timer = setTimeout(() => {
    fallbackTimers.delete(requestId);
    void fallbackWave(requestId).catch((err: unknown) => {
      console.error("[matching] fallback wave failed:", err);
    });
  }, env.WAVE_FALLBACK_DELAY_MINUTES * 60_000);
  fallbackTimers.set(requestId, timer);
}

export function hasFallbackTimer(requestId: string): boolean {
  return fallbackTimers.has(requestId);
}

export async function runFallbackWave(requestId: string): Promise<void> {
  await fallbackWave(requestId);
}

export function clearFallbackTimer(requestId: string): void {
  const timer = fallbackTimers.get(requestId);
  if (timer) {
    clearTimeout(timer);
    fallbackTimers.delete(requestId);
  }
}

async function fallbackWave(requestId: string): Promise<void> {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    include: { items: true, hospital: true },
  });
  if (
    !request ||
    (request.status !== RequestStatus.OPEN &&
      request.status !== RequestStatus.MATCHED)
  ) {
    return;
  }
  if (!(await needsMoreDonors(request.id, request.items))) return;

  const unfilled = request.items.filter(
    (item) => item.unitsFulfilled < item.unitsNeeded,
  );
  if (unfilled.length === 0) return;

  const substituteGroups: BloodGroup[] = [
    ...new Set(
      unfilled.flatMap((item) => compatibleDonorGroups(item.bloodGroup)),
    ),
  ];
  const candidates = await findCandidateDonors({
    bloodGroups: substituteGroups,
    from: {
      latitude: request.hospital.latitude,
      longitude: request.hospital.longitude,
    },
    radiusKm: request.radiusKm,
  });

  const responses = await prisma.requestResponse.findMany({
    where: { requestId },
    select: { donorId: true },
  });
  const alreadyEngaged = new Set(responses.map((row) => row.donorId));
  const fresh = rankDonors(
    candidates.filter((c) => !alreadyEngaged.has(c.donorId)),
  );

  await notifyWave(request, fresh.slice(0, env.WAVE_SIZE));
  scheduleFallbackWave(requestId);
}
