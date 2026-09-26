import type { BloodGroup, Prisma, Role, VerificationStatus } from "@repo/db";

export const userInclude = {
  donor: true,
  hospital: { include: { verification: true } },
  bloodBank: true,
} satisfies Prisma.UserInclude;

export type UserWithProfile = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

export type PublicUser = {
  id: string;
  phone: string;
  email: string | null;
  role: Role;
  donor: {
    id: string;
    name: string;
    bloodGroup: BloodGroup;
    eligible: boolean;
    lastDonationDate: Date | null;
    isOnline: boolean;
  } | null;
  hospital: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    contact: string;
    verificationStatus: VerificationStatus;
  } | null;
  bloodBank: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    contact: string;
    verified: boolean;
  } | null;
};

export function toPublicUser(user: UserWithProfile): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
    donor: user.donor
      ? {
          id: user.donor.id,
          name: user.donor.name,
          bloodGroup: user.donor.bloodGroup,
          eligible: user.donor.eligible,
          lastDonationDate: user.donor.lastDonationDate,
          isOnline: user.donor.isOnline,
        }
      : null,
    hospital: user.hospital
      ? {
          id: user.hospital.id,
          name: user.hospital.name,
          address: user.hospital.address,
          latitude: user.hospital.latitude,
          longitude: user.hospital.longitude,
          contact: user.hospital.contact,
          verificationStatus: user.hospital.verification?.status ?? "PENDING",
        }
      : null,
    bloodBank: user.bloodBank
      ? {
          id: user.bloodBank.id,
          name: user.bloodBank.name,
          address: user.bloodBank.address,
          latitude: user.bloodBank.latitude,
          longitude: user.bloodBank.longitude,
          contact: user.bloodBank.contact,
          verified: user.bloodBank.verified,
        }
      : null,
  };
}
