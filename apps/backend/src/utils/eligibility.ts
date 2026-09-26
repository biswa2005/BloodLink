import { env } from "../env.ts";

const DAY_MS = 86_400_000;

export function cooldownCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - env.DONATION_COOLDOWN_DAYS * DAY_MS);
}

export function isEligible(
  lastDonationDate: Date | null,
  now: Date = new Date(),
): boolean {
  if (!lastDonationDate) return true;
  return lastDonationDate.getTime() <= cooldownCutoff(now).getTime();
}

export function nextEligibleAt(lastDonationDate: Date | null): Date | null {
  if (!lastDonationDate) return null;
  return new Date(
    lastDonationDate.getTime() + env.DONATION_COOLDOWN_DAYS * DAY_MS,
  );
}

export function daysSinceDonation(
  lastDonationDate: Date,
  now: Date = new Date(),
): number {
  return Math.floor((now.getTime() - lastDonationDate.getTime()) / DAY_MS);
}
