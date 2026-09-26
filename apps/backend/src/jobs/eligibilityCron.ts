import { prisma } from "../lib/prisma.ts";
import { cooldownCutoff } from "../utils/eligibility.ts";

export async function refreshEligibility(
  now: Date = new Date(),
): Promise<number> {
  const cutoff = cooldownCutoff(now);
  const [reactivated, deactivated] = await prisma.$transaction([
    prisma.donor.updateMany({
      where: {
        eligible: false,
        OR: [{ lastDonationDate: null }, { lastDonationDate: { lte: cutoff } }],
      },
      data: { eligible: true },
    }),
    prisma.donor.updateMany({
      where: { eligible: true, lastDonationDate: { gt: cutoff } },
      data: { eligible: false },
    }),
  ]);
  return reactivated.count + deactivated.count;
}
