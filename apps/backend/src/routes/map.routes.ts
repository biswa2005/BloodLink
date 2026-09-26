import { RequestStatus } from "@repo/db";
import { Router } from "express";
import { prisma } from "../lib/prisma.ts";

export const mapRouter = Router();

mapRouter.get("/overview", async (_req, res) => {
  const [banks, requests] = await Promise.all([
    prisma.bloodBank.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        contact: true,
        verified: true,
        inventory: {
          where: { unitsAvailable: { gt: 0 } },
          select: { bloodGroup: true, component: true, unitsAvailable: true },
          orderBy: [{ bloodGroup: "asc" }, { component: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.emergencyRequest.findMany({
      where: {
        OR: [
          { status: { in: [RequestStatus.OPEN, RequestStatus.MATCHED] } },
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        items: true,
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            contact: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  res.json({ banks, requests });
});
