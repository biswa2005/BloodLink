import { Role } from "@repo/db";
import type { BloodGroup } from "@repo/db";
import bcrypt from "bcryptjs";
import { HttpError } from "../lib/http-error.ts";
import { signToken } from "../lib/jwt.ts";
import { isUniqueViolation, prisma } from "../lib/prisma.ts";
import { toPublicUser, userInclude, type PublicUser } from "../users.ts";
import { isEligible } from "../utils/eligibility.ts";
import { isBloodGroup, isValidCoordinates } from "../utils/enums.ts";

type DonorProfile = {
  name: string;
  bloodGroup: BloodGroup;
  dateOfBirth?: string;
  weightKg?: number;
  latitude?: number;
  longitude?: number;
  lastDonationDate?: string;
};

type LocationProfile = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact: string;
};

export type RegisterInput =
  | { role: "DONOR"; phone: string; password: string; profile: DonorProfile }
  | {
      role: "HOSPITAL";
      phone: string;
      password: string;
      profile: LocationProfile & { documentUrl: string };
    }
  | { role: "BANK"; phone: string; password: string; profile: LocationProfile }
  | { role: "ADMIN"; phone: string; password: string };

export type LoginInput = { phone: string; password: string };

export type AuthResult = { token: string; user: PublicUser };

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (input.role === Role.ADMIN) {
    throw new HttpError(
      403,
      "ADMIN_NOT_SELF_SERVE",
      "Admin accounts cannot self-register",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
    select: { id: true },
  });
  if (existing) {
    throw new HttpError(
      409,
      "PHONE_TAKEN",
      "An account with this phone number already exists",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  if (input.role === Role.DONOR) {
    if (!isBloodGroup(input.profile.bloodGroup)) {
      throw new HttpError(
        400,
        "INVALID_BLOOD_GROUP",
        `Unknown blood group: ${String(input.profile.bloodGroup)}`,
      );
    }
    if (
      input.profile.dateOfBirth !== undefined &&
      Number.isNaN(new Date(input.profile.dateOfBirth).getTime())
    ) {
      throw new HttpError(
        400,
        "INVALID_DATE_OF_BIRTH",
        "dateOfBirth must be a valid date (YYYY-MM-DD)",
      );
    }
    const { latitude, longitude, lastDonationDate } = input.profile;
    if (latitude !== undefined || longitude !== undefined) {
      if (!isValidCoordinates(latitude, longitude)) {
        throw new HttpError(
          400,
          "INVALID_LOCATION",
          "latitude/longitude must be valid coordinates — use your device location",
        );
      }
    }
    if (lastDonationDate !== undefined) {
      const parsed = new Date(lastDonationDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new HttpError(
          400,
          "INVALID_LAST_DONATION_DATE",
          "lastDonationDate must be a valid date (YYYY-MM-DD)",
        );
      }
      if (parsed.getTime() > Date.now()) {
        throw new HttpError(
          400,
          "LAST_DONATION_IN_FUTURE",
          "lastDonationDate cannot be in the future",
        );
      }
    }
  } else {
    const { address, latitude, longitude, contact } = input.profile;
    if (!address?.trim() || !contact?.trim()) {
      throw new HttpError(
        400,
        "PROFILE_INCOMPLETE",
        "address and contact are required",
      );
    }
    if (!isValidCoordinates(latitude, longitude)) {
      throw new HttpError(
        400,
        "INVALID_LOCATION",
        "latitude/longitude must be valid coordinates — use your device location",
      );
    }
  }

  let createdId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { phone: input.phone, passwordHash, role: input.role },
      });
      if (input.role === Role.DONOR) {
        const lastDonation = input.profile.lastDonationDate
          ? new Date(input.profile.lastDonationDate)
          : undefined;
        await tx.donor.create({
          data: {
            userId: user.id,
            name: input.profile.name,
            bloodGroup: input.profile.bloodGroup,
            ...(input.profile.dateOfBirth
              ? { dateOfBirth: new Date(input.profile.dateOfBirth) }
              : {}),
            ...(input.profile.weightKg !== undefined
              ? { weightKg: input.profile.weightKg }
              : {}),
            ...(input.profile.latitude !== undefined &&
            input.profile.longitude !== undefined
              ? {
                  latitude: input.profile.latitude,
                  longitude: input.profile.longitude,
                }
              : {}),
            ...(lastDonation
              ? {
                  lastDonationDate: lastDonation,
                  eligible: isEligible(lastDonation),
                }
              : {}),
          },
        });
      } else if (input.role === Role.HOSPITAL) {
        const hospital = await tx.hospital.create({
          data: {
            userId: user.id,
            name: input.profile.name,
            address: input.profile.address,
            latitude: input.profile.latitude,
            longitude: input.profile.longitude,
            contact: input.profile.contact,
          },
        });
        await tx.hospitalVerification.create({
          data: {
            hospitalId: hospital.id,
            documentUrl: input.profile.documentUrl,
          },
        });
      } else if (input.role === Role.BANK) {
        await tx.bloodBank.create({
          data: {
            userId: user.id,
            name: input.profile.name,
            address: input.profile.address,
            latitude: input.profile.latitude,
            longitude: input.profile.longitude,
            contact: input.profile.contact,
          },
        });
      }
      return user;
    });
    createdId = created.id;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(
        409,
        "PHONE_TAKEN",
        "An account with this phone number already exists",
      );
    }
    throw err;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: createdId },
    include: userInclude,
  });
  return { token: signToken(user), user: toPublicUser(user) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { phone: input.phone },
    include: userInclude,
  });
  if (!user) {
    throw new HttpError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid phone or password",
    );
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid phone or password",
    );
  }
  return { token: signToken(user), user: toPublicUser(user) };
}

export async function getMe(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "Account no longer exists");
  }
  return toPublicUser(user);
}
