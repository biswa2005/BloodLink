import { BloodGroup } from "@repo/db";

const ALL: BloodGroup[] = [
  BloodGroup.O_NEG,
  BloodGroup.O_POS,
  BloodGroup.A_NEG,
  BloodGroup.A_POS,
  BloodGroup.B_NEG,
  BloodGroup.B_POS,
  BloodGroup.AB_NEG,
  BloodGroup.AB_POS,
];

const O_AND_A: BloodGroup[] = [
  BloodGroup.O_NEG,
  BloodGroup.O_POS,
  BloodGroup.A_NEG,
  BloodGroup.A_POS,
];

const O_AND_B: BloodGroup[] = [
  BloodGroup.O_NEG,
  BloodGroup.O_POS,
  BloodGroup.B_NEG,
  BloodGroup.B_POS,
];

const AB_RH_NEG: BloodGroup[] = [
  BloodGroup.O_NEG,
  BloodGroup.A_NEG,
  BloodGroup.B_NEG,
  BloodGroup.AB_NEG,
];

const COMPATIBLE: Record<BloodGroup, BloodGroup[]> = {
  O_NEG: [BloodGroup.O_NEG],
  O_POS: [BloodGroup.O_NEG, BloodGroup.O_POS],
  A_NEG: [BloodGroup.O_NEG, BloodGroup.A_NEG],
  A_POS: O_AND_A,
  B_NEG: [BloodGroup.O_NEG, BloodGroup.B_NEG],
  B_POS: O_AND_B,
  AB_NEG: AB_RH_NEG,
  AB_POS: ALL,
};

export function compatibleDonorGroups(recipient: BloodGroup): BloodGroup[] {
  return COMPATIBLE[recipient];
}
