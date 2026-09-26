import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  RequestStatus,
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
  {
    phone: "+919800000004",
    name: "Kiran Shetty",
    bloodGroup: "O_NEG",
    dateOfBirth: new Date("1997-01-09"),
    weightKg: 71,
    latitude: 12.9809,
    longitude: 77.6412,
    score: 88,
    completedCount: 3,
    noShowCount: 0,
  },
  {
    phone: "+919800000005",
    name: "Farhan Ali",
    bloodGroup: "A_NEG",
    dateOfBirth: new Date("1993-05-30"),
    weightKg: 68,
    latitude: 12.9,
    longitude: 77.75,
    score: 92,
    completedCount: 7,
    noShowCount: 1,
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

const admins = [
  {
    phone: "+919890000000",
    name: "BloodLink Admin",
  },
] as const;

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

const HISTORY_DAYS = 90;

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const allPhones = [...donors, ...hospitals, ...banks, ...admins].map(
  (row) => row.phone,
);

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
  const bankRows = await prisma.bloodBank.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const bankIds = bankRows.map((row) => row.id);

  await prisma.$transaction([
    prisma.inventory.deleteMany({ where: { bankId: { in: bankIds } } }),
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
    prisma.qRToken.deleteMany({
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

  const createdHospitalIds: string[] = [];
  const createdBankIds: string[] = [];
  let historyRequests = 0;

  await prisma.$transaction(
    async (tx) => {
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
        const user = await tx.user.create({
          data: {
            phone: hospital.phone,
            passwordHash,
            role: Role.HOSPITAL,
          },
        });
        const row = await tx.hospital.create({
          data: {
            userId: user.id,
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
        });
        createdHospitalIds.push(row.id);
      }

      for (const bank of banks) {
        const user = await tx.user.create({
          data: {
            phone: bank.phone,
            passwordHash,
            role: Role.BANK,
          },
        });
        const row = await tx.bloodBank.create({
          data: {
            userId: user.id,
            name: bank.name,
            address: bank.address,
            latitude: bank.latitude,
            longitude: bank.longitude,
            contact: bank.contact,
            verified: true,
          },
        });
        createdBankIds.push(row.id);
      }

      for (const admin of admins) {
        await tx.user.create({
          data: { phone: admin.phone, passwordHash, role: Role.ADMIN },
        });
      }

      for (let b = 0; b < createdBankIds.length; b++) {
        const bankId = createdBankIds[b]!;
        for (let g = 0; g < BLOOD_GROUPS.length; g++) {
          for (let c = 0; c < COMPONENTS.length; c++) {
            await tx.inventory.create({
              data: {
                bankId,
                bloodGroup: BLOOD_GROUPS[g],
                component: COMPONENTS[c],
                unitsAvailable: ((g + b * 2 + c * 3) % 7) * 2,
              },
            });
          }
        }
      }

      const rand = mulberry32(20260926);
      const now = Date.now();

      for (let day = HISTORY_DAYS; day >= 1; day--) {
        const requestCount = Math.floor(rand() * 4);
        for (let r = 0; r < requestCount; r++) {
          const hospitalId =
            createdHospitalIds[Math.floor(rand() * createdHospitalIds.length)]!;
          const createdAt = new Date(
            now - day * 86_400_000 + Math.floor(rand() * 86_400_000),
          );
          const fulfilled = rand() > 0.15;
          const itemCount = 1 + Math.floor(rand() * 2);
          const used = new Set<number>();
          const items: {
            bloodGroup: (typeof BLOOD_GROUPS)[number];
            component: (typeof COMPONENTS)[number];
            unitsNeeded: number;
            unitsFulfilled: number;
          }[] = [];

          while (items.length < itemCount) {
            const g = Math.floor(rand() * BLOOD_GROUPS.length);
            if (used.has(g)) continue;
            used.add(g);
            const unitsNeeded = 2 + Math.floor(rand() * 4);
            items.push({
              bloodGroup: BLOOD_GROUPS[g]!,
              component: COMPONENTS[Math.floor(rand() * COMPONENTS.length)]!,
              unitsNeeded,
              unitsFulfilled: fulfilled
                ? unitsNeeded
                : Math.max(0, unitsNeeded - 1 - Math.floor(rand() * 2)),
            });
          }

          await tx.emergencyRequest.create({
            data: {
              hospitalId,
              urgency: URGENCIES[Math.floor(rand() * URGENCIES.length)],
              radiusKm: 5,
              status: fulfilled
                ? RequestStatus.FULFILLED
                : RequestStatus.CLOSED,
              createdAt,
              updatedAt: createdAt,
              items: { create: items },
            },
          });
          historyRequests++;
        }
      }
    },
    { timeout: 60_000 },
  );

  console.log(
    `Seeded ${donors.length} donors, ${hospitals.length} hospitals (verified), ${banks.length} blood banks, ${admins.length} admin`,
  );
  console.log(
    `Seeded ${createdBankIds.length * BLOOD_GROUPS.length * COMPONENTS.length} inventory rows and ${historyRequests} historical requests over ${HISTORY_DAYS} days`,
  );
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
  console.log("Admin:");
  for (const admin of admins) {
    console.log(`  ${admin.phone}  ${admin.name}`);
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
