import type { BloodGroup, Component, Urgency } from "@repo/db";

const BLOOD_GROUPS = [
  "O_NEG",
  "O_POS",
  "A_NEG",
  "A_POS",
  "B_NEG",
  "B_POS",
  "AB_NEG",
  "AB_POS",
] as const;

const COMPONENTS = ["WHOLE_BLOOD", "PLATELETS", "PLASMA"] as const;

const URGENCIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export function isBloodGroup(value: unknown): value is BloodGroup {
  return BLOOD_GROUPS.includes(value as BloodGroup);
}

export function isComponent(value: unknown): value is Component {
  return COMPONENTS.includes(value as Component);
}

export function isUrgency(value: unknown): value is Urgency {
  return URGENCIES.includes(value as Urgency);
}

export function isValidCoordinates(
  latitude: unknown,
  longitude: unknown,
): boolean {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}
