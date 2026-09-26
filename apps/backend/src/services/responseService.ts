import { RequestStatus, ResponseStatus } from "@repo/db";
import { HttpError } from "../lib/http-error.ts";
import { prisma } from "../lib/prisma.ts";
import { emitDonorLocation } from "../lib/socket.ts";
import { isEligible, nextEligibleAt } from "../utils/eligibility.ts";
import { syncRequestStatus } from "./requestService.ts";

export type RespondAction = "accept" | "decline";

export type RespondResult = { status: ResponseStatus; accepted: boolean };

export async function respondToRequest(
  donorId: string,
  requestId: string,
  action: RespondAction,
): Promise<RespondResult> {
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
  if (
    request.status !== RequestStatus.OPEN &&
    request.status !== RequestStatus.MATCHED
  ) {
    throw new HttpError(
      409,
      "REQUEST_CLOSED",
      "This request is no longer open for responses",
    );
  }

  const donor = await prisma.donor.findUnique({
    where: { id: donorId },
    select: {
      id: true,
      name: true,
      bloodGroup: true,
      latitude: true,
      longitude: true,
      lastDonationDate: true,
    },
  });
  if (!donor) {
    throw new HttpError(404, "DONOR_NOT_FOUND", "Donor not found");
  }

  const emit = (status: string) =>
    emitDonorLocation(requestId, {
      donorId,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      status,
      latitude: donor.latitude,
      longitude: donor.longitude,
    });

  if (action === "decline") {
    const response = await prisma.$transaction(async (tx) => {
      const existing = await tx.requestResponse.findUnique({
        where: { requestId_donorId: { requestId, donorId } },
      });
      if (existing?.status === ResponseStatus.ARRIVED) {
        throw new HttpError(
          409,
          "ALREADY_ARRIVED",
          "Donor already arrived for this request",
        );
      }
      return tx.requestResponse.upsert({
        where: { requestId_donorId: { requestId, donorId } },
        create: { requestId, donorId, status: ResponseStatus.DECLINED },
        update: { status: ResponseStatus.DECLINED, respondedAt: new Date() },
      });
    });
    emit("declined");
    await syncRequestStatus(requestId);
    return { status: response.status, accepted: false };
  }

  if (!isEligible(donor.lastDonationDate)) {
    const until = nextEligibleAt(donor.lastDonationDate);
    throw new HttpError(
      409,
      "DONOR_INELIGIBLE",
      `Donation cooldown: you last donated on ${donor.lastDonationDate?.toDateString()} — eligible again ${until ? until.toDateString() : "later"}`,
    );
  }

  const response = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM request_items WHERE "requestId" = ${requestId} FOR UPDATE`;

    const existing = await tx.requestResponse.findUnique({
      where: { requestId_donorId: { requestId, donorId } },
    });
    if (existing?.status === ResponseStatus.ARRIVED) {
      throw new HttpError(
        409,
        "ALREADY_ARRIVED",
        "Donor already arrived for this request",
      );
    }
    if (existing?.status === ResponseStatus.ACCEPTED) return existing;

    const acceptedCount = await tx.requestResponse.count({
      where: {
        requestId,
        status: { in: [ResponseStatus.ACCEPTED, ResponseStatus.ARRIVED] },
      },
    });
    const totals = await tx.requestItem.aggregate({
      where: { requestId },
      _sum: { unitsNeeded: true },
    });
    const unitsNeeded = totals._sum.unitsNeeded ?? 0;
    if (acceptedCount >= unitsNeeded) {
      throw new HttpError(
        409,
        "ALREADY_FULFILLED",
        "All units already have an accepted donor",
      );
    }

    return tx.requestResponse.upsert({
      where: { requestId_donorId: { requestId, donorId } },
      create: {
        requestId,
        donorId,
        status: ResponseStatus.ACCEPTED,
        respondedAt: new Date(),
      },
      update: { status: ResponseStatus.ACCEPTED, respondedAt: new Date() },
    });
  });

  emit("accepted");
  await syncRequestStatus(requestId);
  return { status: response.status, accepted: true };
}
