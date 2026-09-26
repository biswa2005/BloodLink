import { RequestStatus, ResponseStatus } from "@repo/db";
import { prisma } from "../lib/prisma.ts";
import { emitRequestStatus } from "../lib/socket.ts";
import { clearFallbackTimer } from "./matchingEngine.ts";

const IN_PROGRESS = [ResponseStatus.ACCEPTED, ResponseStatus.ARRIVED];
const NOTIFIED = [ResponseStatus.NOTIFIED, ResponseStatus.VIEWED];

export async function syncRequestStatus(
  requestId: string,
): Promise<RequestStatus> {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    include: { items: true },
  });
  if (!request) return RequestStatus.CLOSED;
  if (
    request.status === RequestStatus.FULFILLED ||
    request.status === RequestStatus.CLOSED
  ) {
    return request.status;
  }

  const needed = request.items.reduce((sum, item) => sum + item.unitsNeeded, 0);
  const fulfilled = request.items.reduce(
    (sum, item) => sum + item.unitsFulfilled,
    0,
  );
  const matched = await prisma.requestResponse.count({
    where: { requestId, status: { in: IN_PROGRESS } },
  });

  let next: RequestStatus = RequestStatus.OPEN;
  if (needed > 0 && fulfilled >= needed) next = RequestStatus.FULFILLED;
  else if (fulfilled > 0 || matched > 0) next = RequestStatus.MATCHED;

  if (next !== request.status) {
    await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: { status: next },
    });
    emitRequestStatus(requestId, {
      requestId,
      status: next,
      items: request.items.map((item) => ({
        bloodGroup: item.bloodGroup,
        unitsNeeded: item.unitsNeeded,
        unitsFulfilled: item.unitsFulfilled,
      })),
    });
  }

  if (next === RequestStatus.FULFILLED) {
    clearFallbackTimer(requestId);
    await prisma.requestResponse.updateMany({
      where: { requestId, status: { in: NOTIFIED } },
      data: { status: ResponseStatus.EXPIRED },
    });
  }

  return next;
}
