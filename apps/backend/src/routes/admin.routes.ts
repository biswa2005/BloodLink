import { Role, VerificationStatus } from "@repo/db";
import { Router } from "express";
import { HttpError } from "../lib/http-error.ts";
import { prisma } from "../lib/prisma.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";

type VerifyInput = { status: VerificationStatus; documentUrl?: string };

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

adminRouter.get("/hospitals/pending", async (_req, res) => {
  const verifications = await prisma.hospitalVerification.findMany({
    where: { status: VerificationStatus.PENDING },
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          address: true,
          contact: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ verifications });
});

adminRouter.post("/hospitals/:id/verify", async (req, res) => {
  const hospitalId = req.params.id;
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: { id: true, name: true },
  });
  if (!hospital) {
    throw new HttpError(404, "HOSPITAL_NOT_FOUND", "Hospital not found");
  }

  const body = req.body as VerifyInput;
  const now = new Date();
  const verification = await prisma.hospitalVerification.upsert({
    where: { hospitalId },
    create: {
      hospitalId,
      documentUrl: body.documentUrl ?? "",
      status: body.status,
      reviewedBy: req.user!.id,
      reviewedAt: now,
    },
    update: {
      status: body.status,
      reviewedBy: req.user!.id,
      reviewedAt: now,
    },
    include: { hospital: { select: { id: true, name: true } } },
  });

  res.json({ verification });
});
