import { RequestStatus, ResponseStatus, Role } from "@repo/db";
import type { BloodGroup, Component, Urgency } from "@repo/db";
import { Router } from "express";
import {
  emitDonorLocation,
  emitNewRequest,
  emitRequestStatus,
} from "../lib/socket.ts";
import { HttpError } from "../lib/http-error.ts";
import { prisma } from "../lib/prisma.ts";
import { assertSession } from "../lib/session.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";
import { clearFallbackTimer, dispatch } from "../services/matchingEngine.ts";
import { generate, verify } from "../services/qrService.ts";
import { syncRequestStatus } from "../services/requestService.ts";
import { isBloodGroup, isComponent, isUrgency } from "../utils/enums.ts";

type CreateRequestInput = {
  urgency?: Urgency;
  radiusKm?: number;
  radius_km?: number;
  items: {
    bloodGroup?: BloodGroup;
    blood_group?: BloodGroup;
    component?: Component;
    units?: number;
    unitsNeeded?: number;
  }[];
};

export const hospitalRouter = Router();

hospitalRouter.use(requireAuth, requireRole(Role.HOSPITAL));

async function hospitalFor(userId: string) {
  const hospital = await prisma.hospital.findUnique({
    where: { userId },
    include: { verification: true },
  });
  if (!hospital) {
    await assertSession(userId);
    throw new HttpError(
      403,
      "HOSPITAL_PROFILE_MISSING",
      "This account has no hospital profile",
    );
  }
  return hospital;
}

hospitalRouter.get("/requests", async (req, res) => {
  const hospital = await hospitalFor(req.user!.id);
  const requests = await prisma.emergencyRequest.findMany({
    where: { hospitalId: hospital.id },
    include: {
      items: true,
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  res.json({ requests });
});

function parseRequestInput(body: CreateRequestInput) {
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError(
      400,
      "ITEMS_REQUIRED",
      "Add at least one blood group with units",
    );
  }

  const urgency = body.urgency ?? "MEDIUM";
  if (!isUrgency(urgency)) {
    throw new HttpError(400, "INVALID_URGENCY", `Unknown urgency: ${urgency}`);
  }

  const radiusKm = body.radiusKm ?? body.radius_km ?? 5;
  if (
    typeof radiusKm !== "number" ||
    !Number.isFinite(radiusKm) ||
    radiusKm <= 0 ||
    radiusKm > 100
  ) {
    throw new HttpError(
      400,
      "INVALID_RADIUS",
      "Radius must be a number between 0 and 100 km",
    );
  }

  const merged = new Map<
    string,
    { bloodGroup: BloodGroup; component: Component; unitsNeeded: number }
  >();
  for (const item of body.items) {
    const bloodGroup = (item.bloodGroup ?? item.blood_group) as BloodGroup;
    if (!isBloodGroup(bloodGroup)) {
      throw new HttpError(
        400,
        "INVALID_BLOOD_GROUP",
        `Unknown blood group: ${String(item.bloodGroup ?? item.blood_group)}`,
      );
    }
    const component = item.component ?? "WHOLE_BLOOD";
    if (!isComponent(component)) {
      throw new HttpError(
        400,
        "INVALID_COMPONENT",
        `Unknown component: ${String(component)}`,
      );
    }
    const unitsNeeded = item.units ?? item.unitsNeeded;
    if (
      typeof unitsNeeded !== "number" ||
      !Number.isInteger(unitsNeeded) ||
      unitsNeeded < 1 ||
      unitsNeeded > 50
    ) {
      throw new HttpError(
        400,
        "INVALID_UNITS",
        "Units must be an integer between 1 and 50",
      );
    }
    const key = `${bloodGroup}:${component}`;
    const existing = merged.get(key);
    if (existing) existing.unitsNeeded += unitsNeeded;
    else merged.set(key, { bloodGroup, component, unitsNeeded });
  }

  return { urgency, radiusKm, items: [...merged.values()] };
}

hospitalRouter.post("/request", async (req, res) => {
  const hospital = await hospitalFor(req.user!.id);
  if (hospital.verification?.status !== "VERIFIED") {
    throw new HttpError(
      403,
      "HOSPITAL_NOT_VERIFIED",
      "Hospital must be admin-verified before raising requests",
    );
  }

  const input = parseRequestInput(req.body as CreateRequestInput);
  const request = await prisma.emergencyRequest.create({
    data: {
      hospitalId: hospital.id,
      urgency: input.urgency,
      radiusKm: input.radiusKm,
      items: { create: input.items },
    },
    include: { items: true },
  });

  emitNewRequest({
    requestId: request.id,
    urgency: request.urgency,
    status: request.status,
    radiusKm: request.radiusKm,
    createdAt: request.createdAt,
    items: request.items.map((item) => ({
      bloodGroup: item.bloodGroup,
      component: item.component,
      unitsNeeded: item.unitsNeeded,
      unitsFulfilled: item.unitsFulfilled,
    })),
    hospital: {
      id: hospital.id,
      name: hospital.name,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    },
  });

  let matching: { candidates: number; notified: number; failed?: boolean };
  try {
    matching = await dispatch(request.id);
  } catch (err) {
    console.error("[matching] dispatch failed:", err);
    matching = { candidates: 0, notified: 0, failed: true };
  }

  res.status(201).json({ request, matching });
});

hospitalRouter.get("/request/:id", async (req, res) => {
  const hospital = await hospitalFor(req.user!.id);
  const request = await prisma.emergencyRequest.findFirst({
    where: { id: req.params.id, hospitalId: hospital.id },
    include: {
      items: true,
      responses: {
        include: {
          donor: {
            select: {
              id: true,
              name: true,
              bloodGroup: true,
              latitude: true,
              longitude: true,
              lastDonationDate: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!request) {
    throw new HttpError(
      404,
      "REQUEST_NOT_FOUND",
      "Emergency request not found",
    );
  }
  res.json({ request });
});

hospitalRouter.post("/request/:id/verify-arrival", async (req, res) => {
  const hospital = await hospitalFor(req.user!.id);
  const requestId = req.params.id;

  const request = await prisma.emergencyRequest.findFirst({
    where: { id: requestId, hospitalId: hospital.id },
    select: { id: true, status: true },
  });
  if (!request) {
    throw new HttpError(
      404,
      "REQUEST_NOT_FOUND",
      "Emergency request not found",
    );
  }

  const verified = await verify((req.body as { token: string }).token);
  if (verified.requestId !== requestId) {
    throw new HttpError(
      400,
      "TOKEN_REQUEST_MISMATCH",
      "QR token was issued for a different request",
    );
  }

  const arrival = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM request_items WHERE "requestId" = ${requestId} FOR UPDATE`;

    const consumed = await tx.qRToken.updateMany({
      where: { id: verified.tokenId, used: false },
      data: { used: true, usedAt: new Date() },
    });
    if (consumed.count === 0) {
      throw new HttpError(
        409,
        "TOKEN_ALREADY_USED",
        "QR token has already been used",
      );
    }

    const response = await tx.requestResponse.findUnique({
      where: { requestId_donorId: { requestId, donorId: verified.donorId } },
    });
    if (!response) {
      throw new HttpError(
        409,
        "RESPONSE_NOT_FOUND",
        "Donor has no response recorded for this request",
      );
    }
    if (response.status === ResponseStatus.ARRIVED) {
      throw new HttpError(
        409,
        "ALREADY_ARRIVED",
        "Donor already arrived for this request",
      );
    }

    const donor = await tx.donor.findUnique({
      where: { id: verified.donorId },
    });
    if (!donor) {
      throw new HttpError(404, "DONOR_NOT_FOUND", "Donor no longer exists");
    }

    await tx.requestResponse.update({
      where: { id: response.id },
      data: { status: ResponseStatus.ARRIVED, respondedAt: new Date() },
    });

    const items = await tx.requestItem.findMany({ where: { requestId } });
    const exact = items.findIndex(
      (item) =>
        item.bloodGroup === donor.bloodGroup &&
        item.unitsFulfilled < item.unitsNeeded,
    );
    const target =
      exact >= 0
        ? exact
        : items.findIndex((item) => item.unitsFulfilled < item.unitsNeeded);
    if (target >= 0) {
      await tx.requestItem.update({
        where: { id: items[target]!.id },
        data: { unitsFulfilled: { increment: 1 } },
      });
    }

    await tx.donor.update({
      where: { id: donor.id },
      data: { lastDonationDate: new Date(), eligible: false, isOnline: false },
    });

    await tx.donorReliability.upsert({
      where: { donorId: donor.id },
      create: { donorId: donor.id, completedCount: 1, score: 110 },
      update: { completedCount: { increment: 1 }, score: { increment: 10 } },
    });

    return donor;
  });

  emitDonorLocation(requestId, {
    donorId: arrival.id,
    name: arrival.name,
    bloodGroup: arrival.bloodGroup,
    status: "arrived",
    latitude: arrival.latitude,
    longitude: arrival.longitude,
  });

  const requestStatus = await syncRequestStatus(requestId);
  const state = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    include: { items: true },
  });

  res.json({
    status: ResponseStatus.ARRIVED,
    requestStatus,
    request: state,
  });
});

hospitalRouter.post("/request/:id/complete", async (req, res) => {
  const hospital = await hospitalFor(req.user!.id);
  const requestId = req.params.id;

  const request = await prisma.emergencyRequest.findFirst({
    where: { id: requestId, hospitalId: hospital.id },
    select: { id: true, status: true },
  });
  if (!request) {
    throw new HttpError(
      404,
      "REQUEST_NOT_FOUND",
      "Emergency request not found",
    );
  }
  if (
    request.status !== RequestStatus.OPEN &&
    request.status !== RequestStatus.MATCHED
  ) {
    throw new HttpError(
      409,
      "REQUEST_ALREADY_CLOSED",
      `Request is already ${request.status}`,
    );
  }

  const updated = await prisma.emergencyRequest.update({
    where: { id: requestId },
    data: { status: RequestStatus.FULFILLED },
    include: { items: true },
  });

  clearFallbackTimer(requestId);
  emitRequestStatus(requestId, {
    requestId,
    status: updated.status,
    items: updated.items.map((item) => ({
      bloodGroup: item.bloodGroup,
      unitsNeeded: item.unitsNeeded,
      unitsFulfilled: item.unitsFulfilled,
    })),
  });

  res.json({ request: updated });
});

hospitalRouter.post("/request/:id/close", async (req, res) => {
  const hospital = await hospitalFor(req.user!.id);
  const requestId = req.params.id;

  const request = await prisma.emergencyRequest.findFirst({
    where: { id: requestId, hospitalId: hospital.id },
    select: { id: true, status: true },
  });
  if (!request) {
    throw new HttpError(
      404,
      "REQUEST_NOT_FOUND",
      "Emergency request not found",
    );
  }
  if (
    request.status === RequestStatus.CLOSED ||
    request.status === RequestStatus.FULFILLED
  ) {
    throw new HttpError(
      409,
      "REQUEST_ALREADY_CLOSED",
      `Request is already ${request.status}`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.requestResponse.updateMany({
      where: {
        requestId,
        status: { in: [ResponseStatus.NOTIFIED, ResponseStatus.VIEWED] },
      },
      data: { status: ResponseStatus.EXPIRED },
    });
    return tx.emergencyRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CLOSED },
      include: { items: true },
    });
  });

  clearFallbackTimer(requestId);
  emitRequestStatus(requestId, {
    requestId,
    status: updated.status,
    items: updated.items.map((item) => ({
      bloodGroup: item.bloodGroup,
      unitsNeeded: item.unitsNeeded,
      unitsFulfilled: item.unitsFulfilled,
    })),
  });

  res.json({ request: updated });
});
