import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

export type DonorLocationUpdate = {
  donorId: string;
  name: string;
  bloodGroup: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number;
  reliabilityScore?: number;
};

export type RequestStatusUpdate = {
  requestId: string;
  status: string;
  items: { bloodGroup: string; unitsNeeded: number; unitsFulfilled: number }[];
};

export type NewRequestUpdate = {
  requestId: string;
  urgency: string;
  status: string;
  radiusKm: number;
  createdAt: Date;
  items: {
    bloodGroup: string;
    component: string;
    unitsNeeded: number;
    unitsFulfilled: number;
  }[];
  hospital: { id: string; name: string; latitude: number; longitude: number };
};

let io: Server | undefined;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("join_request_room", (requestId: unknown) => {
      if (typeof requestId === "string" && requestId) {
        socket.join(`request:${requestId}`);
      }
    });
  });

  return io;
}

export function emitDonorLocation(
  requestId: string,
  payload: DonorLocationUpdate,
): void {
  io?.to(`request:${requestId}`).emit("donor_location_update", payload);
}

export function emitRequestStatus(
  requestId: string,
  payload: RequestStatusUpdate,
): void {
  io?.to(`request:${requestId}`).emit("request_status_update", payload);
}

export function emitNewRequest(payload: NewRequestUpdate): void {
  io?.emit("new_request", payload);
}
