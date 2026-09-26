import type { BloodGroup, Component } from "@repo/db";
import { prisma } from "../lib/prisma.ts";
import { boundingBox, haversineKm, type Coordinates } from "../utils/geo.ts";

export type BankStockItem = {
  bloodGroup: BloodGroup;
  component: Component;
  unitsAvailable: number;
};

export type BankSearchResult = {
  id: string;
  name: string;
  address: string;
  contact: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  distanceKm: number | null;
  stock: BankStockItem[];
};

export async function searchBanks(params: {
  bloodGroup: BloodGroup;
  component?: Component;
  from?: Coordinates | null;
  radiusKm: number;
  inStockOnly: boolean;
}): Promise<BankSearchResult[]> {
  const box = params.from ? boundingBox(params.from, params.radiusKm) : null;
  const stockFilter = {
    bloodGroup: params.bloodGroup,
    ...(params.component ? { component: params.component } : {}),
    ...(params.inStockOnly ? { unitsAvailable: { gt: 0 } } : {}),
  };

  const banks = await prisma.bloodBank.findMany({
    where: {
      ...(box
        ? {
            latitude: { gte: box.minLat, lte: box.maxLat },
            longitude: { gte: box.minLng, lte: box.maxLng },
          }
        : {}),
      inventory: { some: stockFilter },
    },
    include: {
      inventory: {
        where: stockFilter,
        select: { bloodGroup: true, component: true, unitsAvailable: true },
        orderBy: [{ bloodGroup: "asc" }, { component: "asc" }],
      },
    },
  });

  const results: BankSearchResult[] = banks.flatMap((bank) => {
    const distanceKm = params.from
      ? haversineKm(params.from, {
          latitude: bank.latitude,
          longitude: bank.longitude,
        })
      : null;
    if (distanceKm !== null && distanceKm > params.radiusKm) return [];
    return [
      {
        id: bank.id,
        name: bank.name,
        address: bank.address,
        contact: bank.contact,
        latitude: bank.latitude,
        longitude: bank.longitude,
        verified: bank.verified,
        distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(2)),
        stock: bank.inventory,
      },
    ];
  });

  results.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null)
      return a.name.localeCompare(b.name);
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  return results;
}
