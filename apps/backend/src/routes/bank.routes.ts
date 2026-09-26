import type { BloodGroup, Component } from "@repo/db";
import { Role } from "@repo/db";
import { Router } from "express";
import { HttpError } from "../lib/http-error.ts";
import { prisma } from "../lib/prisma.ts";
import { assertSession } from "../lib/session.ts";
import { requireAuth, requireRole } from "../middleware/auth.ts";

type InventoryInput = {
  bloodGroup?: BloodGroup;
  blood_group?: BloodGroup;
  component?: Component;
  unitsAvailable?: number;
  units?: number;
};

export const bankRouter = Router();

bankRouter.use(requireAuth, requireRole(Role.BANK));

async function bankFor(userId: string) {
  const bank = await prisma.bloodBank.findUnique({ where: { userId } });
  if (!bank) {
    await assertSession(userId);
    throw new HttpError(
      403,
      "BANK_PROFILE_MISSING",
      "This account has no blood bank profile",
    );
  }
  return bank;
}

bankRouter.post("/inventory", async (req, res) => {
  const bank = await bankFor(req.user!.id);
  const body = req.body as InventoryInput;
  const bloodGroup = (body.bloodGroup ?? body.blood_group) as BloodGroup;
  const component = body.component ?? "WHOLE_BLOOD";
  const unitsAvailable = (body.unitsAvailable ?? body.units) as number;

  const item = await prisma.inventory.upsert({
    where: {
      bankId_bloodGroup_component: {
        bankId: bank.id,
        bloodGroup,
        component,
      },
    },
    create: {
      bankId: bank.id,
      bloodGroup,
      component,
      unitsAvailable,
    },
    update: { unitsAvailable },
    include: { bank: { select: { id: true, name: true } } },
  });

  res.status(201).json({ item });
});

bankRouter.get("/inventory", async (req, res) => {
  const bank = await bankFor(req.user!.id);
  const filter = req.query.blood_group ?? req.query.bloodGroup;
  const items = await prisma.inventory.findMany({
    where: {
      bankId: bank.id,
      ...(typeof filter === "string"
        ? { bloodGroup: filter as BloodGroup }
        : {}),
    },
    orderBy: [{ bloodGroup: "asc" }, { component: "asc" }],
  });
  res.json({ items });
});
