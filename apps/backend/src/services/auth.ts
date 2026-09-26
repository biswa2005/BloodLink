import { Role } from "@repo/db";
import type { BloodGroup } from "@repo/db";
import bcrypt from "bcryptjs";
import { HttpError } from "../lib/http-error.ts";
import { signToken } from "../lib/jwt.ts";
import { isUniqueViolation, prisma } from "../lib/prisma.ts";
import { toPublicUser, userInclude, type PublicUser } from "../users.ts";

type DonorProfile = {
  name: string;
  bloodGroup: BloodGroup;
  dateOfBirth?: string;
  weightKg?: number;
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

  let createdId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { phone: input.phone, passwordHash, role: input.role },
      });
      if (input.role === Role.DONOR) {
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
