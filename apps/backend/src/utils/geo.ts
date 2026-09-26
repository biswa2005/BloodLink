import type { BloodGroup } from "@repo/db";
import { prisma } from "../lib/prisma.ts";
import { env } from "../env.ts";
import { cooldownCutoff } from "./eligibility.ts";

export type Coordinates = { latitude: number; longitude: number };

export function haversineKm(from: Coordinates, to: Coordinates): number {
  const R = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function boundingBox(from: Coordinates, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta =
    radiusKm / (111.32 * Math.cos((from.latitude * Math.PI) / 180));
  return {
    minLat: from.latitude - latDelta,
    maxLat: from.latitude + latDelta,
    minLng: from.longitude - lngDelta,
    maxLng: from.longitude + lngDelta,
  };
}

export type CandidateDonor = {
  donorId: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  latitude: number;
  longitude: number;
  distanceKm: number;
  reliabilityScore: number;
  lastDonationDate: Date | null;
};

export async function findCandidateDonors(params: {
  bloodGroups: BloodGroup[];
  from: Coordinates;
  radiusKm: number;
}): Promise<CandidateDonor[]> {
  if (params.bloodGroups.length === 0) return [];

  const box = boundingBox(params.from, params.radiusKm);
  const pingCutoff = new Date(Date.now() - env.STALE_PING_SECONDS * 1000);
  const cutoff = cooldownCutoff();

  const donors = await prisma.donor.findMany({
    where: {
      isOnline: true,
      bloodGroup: { in: params.bloodGroups },
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
      lastPingAt: { gte: pingCutoff },
      OR: [{ lastDonationDate: null }, { lastDonationDate: { lte: cutoff } }],
    },
    include: { user: { select: { phone: true } }, reliability: true },
  });

  return donors.flatMap((donor) => {
    if (donor.latitude === null || donor.longitude === null) return [];
    const distanceKm = haversineKm(params.from, {
      latitude: donor.latitude,
      longitude: donor.longitude,
    });
    if (distanceKm > params.radiusKm) return [];
    return [
      {
        donorId: donor.id,
        name: donor.name,
        phone: donor.user.phone,
        bloodGroup: donor.bloodGroup,
        latitude: donor.latitude,
        longitude: donor.longitude,
        distanceKm: Number(distanceKm.toFixed(2)),
        reliabilityScore: donor.reliability?.score ?? 100,
        lastDonationDate: donor.lastDonationDate,
      },
    ];
  });
}
