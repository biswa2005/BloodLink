import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  Role,
  VerificationStatus,
} from "../generated/prisma/client.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set (packages/db/.env)");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PASSWORD = "Test@1234";

const donors = [
  {
    phone: "+919800000001",
    name: "Asha Rao",
    bloodGroup: "O_POS",
    dateOfBirth: new Date("1996-03-14"),
    weightKg: 62,
    latitude: 12.9716,
    longitude: 77.639,
    score: 100,
    completedCount: 6,
    noShowCount: 0,
  },
  {
    phone: "+919800000002",
    name: "Ravi Kumar",
    bloodGroup: "A_POS",
    dateOfBirth: new Date("1994-11-02"),
    weightKg: 74,
    latitude: 12.9716,
    longitude: 77.639,
    score: 82,
    completedCount: 4,
    noShowCount: 1,
  },
  {
    phone: "+919800000003",
    name: "Meera Iyer",
    bloodGroup: "B_NEG",
    dateOfBirth: new Date("1998-07-21"),
    weightKg: 58,
    latitude: 12.9352,
    longitude: 77.6245,
    score: 95,
    completedCount: 5,
    noShowCount: 0,
  },
] as const;

const hospitals = [
  {
    phone: "+919810000001",
    name: "City Care Hospital",
    address: "100 Feet Rd, Indiranagar, Bengaluru",
    latitude: 12.9719,
    longitude: 77.6412,
    contact: "+918012345001",
  },
  {
    phone: "+919810000002",
    name: "Sunrise Multispeciality",
    address: "80 Ft Rd, Koramangala, Bengaluru",
    latitude: 12.9352,
    longitude: 77.6245,
    contact: "+918012345002",
  },
  {
    phone: "+919810000003",
    name: "Lakeview Hospital",
    address: "24th Main, Jayanagar, Bengaluru",
    latitude: 12.925,
    longitude: 77.5938,
    contact: "+918012345003",
  },
] as const;

const banks = [
  {
    phone: "+919820000001",
    name: "Red Cross Blood Centre",
    address: "Kasturba Rd, Bengaluru",
    latitude: 12.9762,
    longitude: 77.6033,
    contact: "+918012346001",
  },
  {
    phone: "+919820000002",
    name: "Rotary Blood Bank",
    address: "4th Block, Jayanagar, Bengaluru",
    latitude: 12.9539,
    longitude: 77.615,
    contact: "+918012346002",
  },
  {
    phone: "+919820000003",
    name: "HSR Blood Care",
    address: "Sector 2, HSR Layout, Bengaluru",
    latitude: 12.91,
    longitude: 77.64,
    contact: "+918012346003",
  },
] as const;

const allPhones = [...donors, ...hospitals, ...banks].map((row) => row.phone);

async function clearExisting() {
  const users = await prisma.user.findMany({
    where: { phone: { in: allPhones } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) return;

  const donorRows = await prisma.donor.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const donorIds = donorRows.map((row) => row.id);
  const hospitalRows = await prisma.hospital.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const hospitalIds = hospitalRows.map((row) => row.id);

  await prisma.$transaction([
    prisma.requestItem.deleteMany({
      where: { request: { hospitalId: { in: hospitalIds } } },
    }),
    prisma.requestResponse.deleteMany({
      where: {
        OR: [
          { donorId: { in: donorIds } },
          { request: { hospitalId: { in: hospitalIds } } },
        ],
      },
    }),
    prisma.qrToken.deleteMany({
      where: {
        OR: [
          { donorId: { in: donorIds } },
          { request: { hospitalId: { in: hospitalIds } } },
        ],
      },
    }),
    prisma.emergencyRequest.deleteMany({
      where: { hospitalId: { in: hospitalIds } },
    }),
    prisma.hospitalVerification.deleteMany({
      where: { hospitalId: { in: hospitalIds } },
    }),
    prisma.donorReliability.deleteMany({
      where: { donorId: { in: donorIds } },
    }),
    prisma.hospital.deleteMany({ where: { id: { in: hospitalIds } } }),
    prisma.donor.deleteMany({ where: { id: { in: donorIds } } }),
    prisma.bloodBank.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);
}

async function main() {
  await clearExisting();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    for (const donor of donors) {
      await tx.user.create({
        data: {
          phone: donor.phone,
          passwordHash,
          role: Role.DONOR,
          donor: {
            create: {
              name: donor.name,
              bloodGroup: donor.bloodGroup,
              dateOfBirth: donor.dateOfBirth,
              weightKg: donor.weightKg,
              eligible: true,
              isOnline: true,
              latitude: donor.latitude,
              longitude: donor.longitude,
              lastPingAt: new Date(),
              reliability: {
                create: {
                  score: donor.score,
                  completedCount: donor.completedCount,
                  noShowCount: donor.noShowCount,
                },
              },
            },
          },
        },
      });
    }

    for (const hospital of hospitals) {
      await tx.user.create({
        data: {
          phone: hospital.phone,
          passwordHash,
          role: Role.HOSPITAL,
          hospital: {
            create: {
              name: hospital.name,
              address: hospital.address,
              latitude: hospital.latitude,
              longitude: hospital.longitude,
              contact: hospital.contact,
              verification: {
                create: {
                  documentUrl: "https://example.com/registration.pdf",
                  status: VerificationStatus.VERIFIED,
                  reviewedBy: "seed",
                  reviewedAt: new Date(),
                },
              },
            },
          },
        },
      });
    }

    for (const bank of banks) {
      await tx.user.create({
        data: {
          phone: bank.phone,
          passwordHash,
          role: Role.BANK,
          bloodBank: {
            create: {
              name: bank.name,
              address: bank.address,
              latitude: bank.latitude,
              longitude: bank.longitude,
              contact: bank.contact,
              verified: true,
            },
          },
        },
      });
    }
  });

  console.log("Seeded 3 donors, 3 hospitals (verified), 3 blood banks");
  console.log(`Login password for every seeded account: ${PASSWORD}`);
  console.log("\nDonors (first two share a location):");
  for (const donor of donors) {
    console.log(
      `  ${donor.phone}  ${donor.name.padEnd(12)} ${donor.bloodGroup.padEnd(6)} ${donor.latitude}, ${donor.longitude}`,
    );
  }
  console.log("Hospitals:");
  for (const hospital of hospitals) {
    console.log(
      `  ${hospital.phone}  ${hospital.name.padEnd(24)} ${hospital.latitude}, ${hospital.longitude}`,
    );
  }
  console.log("Blood banks:");
  for (const bank of banks) {
    console.log(
      `  ${bank.phone}  ${bank.name.padEnd(24)} ${bank.latitude}, ${bank.longitude}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
