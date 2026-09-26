import { env } from "../env.ts";
import { sendDonorWhatsApp } from "./whatsapp.ts";

export type DonorAlert = {
  donorName: string;
  phone: string;
  hospitalName: string;
  items: { bloodGroup: string; unitsNeeded: number }[];
  urgency: string;
  distanceKm: number;
  acceptUrl: string;
  denyUrl: string;
};

export function buildDonorAlert(alert: DonorAlert): string {
  const items = alert.items
    .map((item) => `${item.unitsNeeded} unit(s) ${item.bloodGroup}`)
    .join(", ");
  return [
    "BloodLink emergency blood request",
    `Hospital: ${alert.hospitalName}`,
    `Needed: ${items}`,
    `Urgency: ${alert.urgency}`,
    `Your distance: ${alert.distanceKm} km`,
    "",
    `Accept: ${alert.acceptUrl}`,
    `Deny: ${alert.denyUrl}`,
    "",
    `Open a link to respond - no login needed. Valid for ${env.ACTION_LINK_TTL_MINUTES} minutes or until the request closes.`,
  ].join("\n");
}

export async function notifyDonor(alert: DonorAlert): Promise<void> {
  await sendDonorWhatsApp(alert.phone, buildDonorAlert(alert));
}
