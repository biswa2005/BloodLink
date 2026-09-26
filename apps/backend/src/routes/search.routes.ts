import type { Component } from "@repo/db";
import { Router } from "express";
import { HttpError } from "../lib/http-error.ts";
import { searchBanks } from "../services/searchService.ts";
import {
  isBloodGroup,
  isComponent,
  isValidCoordinates,
} from "../utils/enums.ts";

export const searchRouter = Router();

function readNumber(name: string, value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, "INVALID_QUERY", `${name} must be a number`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, "INVALID_QUERY", `${name} must be a number`);
  }
  return parsed;
}

searchRouter.get("/", async (req, res) => {
  const bloodGroup = req.query.blood_group ?? req.query.bloodGroup;
  if (!isBloodGroup(bloodGroup)) {
    throw new HttpError(
      400,
      "INVALID_BLOOD_GROUP",
      "blood_group is required (e.g. O_POS)",
    );
  }

  const componentRaw = req.query.component;
  let component: Component | undefined;
  if (componentRaw !== undefined) {
    if (!isComponent(componentRaw)) {
      throw new HttpError(
        400,
        "INVALID_COMPONENT",
        `Unknown component: ${String(componentRaw)}`,
      );
    }
    component = componentRaw;
  }

  const lat = readNumber("lat", req.query.lat ?? req.query.latitude);
  const lng = readNumber("lng", req.query.lng ?? req.query.longitude);
  let from: { latitude: number; longitude: number } | null = null;
  if (lat !== undefined || lng !== undefined) {
    if (
      lat === undefined ||
      lng === undefined ||
      !isValidCoordinates(lat, lng)
    ) {
      throw new HttpError(
        400,
        "INVALID_LOCATION",
        "lat and lng must be provided together as valid coordinates",
      );
    }
    from = { latitude: lat, longitude: lng };
  }

  const radiusKm =
    readNumber("radius_km", req.query.radius_km ?? req.query.radiusKm) ?? 25;
  if (radiusKm <= 0 || radiusKm > 500) {
    throw new HttpError(
      400,
      "INVALID_RADIUS",
      "radius_km must be between 0 and 500",
    );
  }

  const inStockRaw = req.query.in_stock ?? req.query.inStock;
  const inStockOnly =
    inStockRaw === undefined
      ? true
      : inStockRaw === "true" || inStockRaw === "1";

  const banks = await searchBanks({
    bloodGroup,
    ...(component ? { component } : {}),
    from,
    radiusKm,
    inStockOnly,
  });

  res.json({
    query: {
      bloodGroup,
      component: component ?? null,
      latitude: from?.latitude ?? null,
      longitude: from?.longitude ?? null,
      radiusKm,
      inStockOnly,
    },
    count: banks.length,
    banks,
  });
});
