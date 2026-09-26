import { RequestStatus, Role } from "@repo/db";
import type { Donor } from "@repo/db";
import { Router } from "express";
import { env } from "../env.ts";
import { HttpError } from "../lib/http-error.ts";
import { prisma } from "../lib/prisma.ts";
import { assertSession } from "../lib/session.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import { matchDonor } from "../services/matchingEngine.ts";
import { generate } from "../services/qrService.ts";
import { respondToRequest } from "../services/responseService.ts";
import { compatibleDonorGroups } from "../utils/compatibility.ts";
import { isValidCoordinates } from "../utils/enums.ts";
import {
  daysSinceDonation,
  isEligible,
  nextEligibleAt,
} from "../utils/eligibility.ts";
import { haversineKm } from "../utils/geo.ts";

function scheduleLateMatch(donorId: string): void {
  void matchDonor(donorId).catch((err: unknown) => {
    console.error("[matching] late match failed:", err);
  });
}

type AvailabilityInput = { status: "online" | "offline" };
type LocationInput = {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};
type RespondInput = { action: "accept" | "decline" };

export const donorRouter = Router();

donorRouter.use(requireAuth, requireRole(Role.DONOR));

async function donorFor(userId: string) {
  const donor = await prisma.donor.findUnique({ where: { userId } });
  if (!donor) {
    await assertSession(userId);
    throw new HttpError(
      403,
      "DONOR_PROFILE_MISSING",
      "This account has no donor profile",
    );
  }
  return donor;
}

async function openRequestsFor(donor: Donor) {
  const requests = await prisma.emergencyRequest.findMany({
    where: { status: { in: [RequestStatus.OPEN, RequestStatus.MATCHED] } },
    include: {
      items: true,
      hospital: {
        select: {
          id: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      },
      responses: { where: { donorId: donor.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const substituteDue = Date.now() - env.WAVE_FALLBACK_DELAY_MINUTES * 60_000;
  const open = [];

  for (const request of requests) {
    if (request.responses.length > 0) continue;
    const unfilled = request.items.filter(
      (item) => item.unitsFulfilled < item.unitsNeeded,
    );
    if (unfilled.length === 0) continue;

    const exact = unfilled.some((item) => item.bloodGroup === donor.bloodGroup);
    const substitute = unfilled.some((item) =>
      compatibleDonorGroups(item.bloodGroup).includes(donor.bloodGroup),
    );
    if (!exact && !(substitute && request.createdAt.getTime() <= substituteDue))
      continue;

    let distanceKm: number | null = null;
    if (donor.latitude !== null && donor.longitude !== null) {
      const km = haversineKm(
        {
          latitude: donor.latitude,
          longitude: donor.longitude,
        },
        {
          latitude: request.hospital.latitude,
          longitude: request.hospital.longitude,
        },
      );
      if (km > request.radiusKm) continue;
      distanceKm = Number(km.toFixed(2));
    }

    open.push({
      id: request.id,
      urgency: request.urgency,
      status: request.status,
      radiusKm: request.radiusKm,
      createdAt: request.createdAt,
      items: request.items,
      hospital: request.hospital,
      distanceKm,
    });
    if (open.length >= 25) break;
  }

  return open;
}

donorRouter.get("/requests", async (req, res) => {
  const donor = await donorFor(req.user!.id);
  const [responses, openRequests] = await Promise.all([
    prisma.requestResponse.findMany({
      where: { donorId: donor.id },
      include: {
        request: {
          include: {
            items: true,
            hospital: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    openRequestsFor(donor),
  ]);
  res.json({ responses, openRequests });
});

donorRouter.patch("/availability", async (req, res) => {
  const donor = await donorFor(req.user!.id);
  const online = (req.body as AvailabilityInput).status === "online";
  const eligibleNow = isEligible(donor.lastDonationDate);
  if (online && !eligibleNow) {
    const since = donor.lastDonationDate
      ? daysSinceDonation(donor.lastDonationDate)
      : 0;
    const until = nextEligibleAt(donor.lastDonationDate);
    throw new HttpError(
      409,
      "DONOR_INELIGIBLE",
      `Donation cooldown: you last donated ${since} day(s) ago — you can go online again on ${until ? until.toDateString() : "later"}`,
    );
  }
  const updated = await prisma.donor.update({
    where: { id: donor.id },
    data: {
      isOnline: online,
      eligible: eligibleNow,
      ...(online ? { lastPingAt: new Date() } : {}),
    },
  });
  if (online) scheduleLateMatch(updated.id);
  res.json({
    donor: {
      id: updated.id,
      isOnline: updated.isOnline,
      eligible: eligibleNow,
      lastDonationDate: updated.lastDonationDate,
      eligibleAt: nextEligibleAt(updated.lastDonationDate),
      latitude: updated.latitude,
      longitude: updated.longitude,
      lastPingAt: updated.lastPingAt,
    },
  });
});

donorRouter.post("/location", async (req, res) => {
  const donor = await donorFor(req.user!.id);
  const body = req.body as LocationInput;
  const latitude = body.lat ?? body.latitude;
  const longitude = body.lng ?? body.longitude;
  if (!isValidCoordinates(latitude, longitude)) {
    throw new HttpError(
      400,
      "INVALID_LOCATION",
      "lat/lng must be valid coordinates",
    );
  }
  if (!donor.isOnline) {
    throw new HttpError(
      409,
      "DONOR_OFFLINE",
      "Turn on availability before sending location",
    );
  }
  const updated = await prisma.donor.update({
    where: { id: donor.id },
    data: {
      latitude,
      longitude,
      lastPingAt: new Date(),
    },
  });
  scheduleLateMatch(updated.id);
  res.json({
    donor: {
      id: updated.id,
      latitude: updated.latitude,
      longitude: updated.longitude,
      lastPingAt: updated.lastPingAt,
    },
  });
});

donorRouter.post("/request/:id/respond", async (req, res) => {
  const donor = await donorFor(req.user!.id);
  const requestId = req.params.id;
  const { action } = req.body as RespondInput;

  const result = await respondToRequest(donor.id, requestId, action);
  const qr = result.accepted ? await generate(donor.id, requestId) : null;
  res.json({ ...result, qr });
});

donorRouter.get("/request/:id/qr-token", async (req, res) => {
  const donor = await donorFor(req.user!.id);
  const requestId = req.params.id;
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });
  if (!request) {
    throw new HttpError(
      404,
      "REQUEST_NOT_FOUND",
      "Emergency request not found",
    );
  }
  res.json(await generate(donor.id, requestId));
});
