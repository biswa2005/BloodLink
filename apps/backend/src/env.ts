import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(here, "../.env") });
config({ path: path.join(here, "../../../packages/db/.env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing required env var ${name}. See apps/backend/.env.example`,
    );
    process.exit(1);
  }
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    console.error(`Invalid ${name}: ${raw}`);
    process.exit(1);
  }
  return value;
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 16) {
  console.error(
    "JWT_SECRET must be at least 16 characters. See apps/backend/.env.example",
  );
  process.exit(1);
}

const qrSecret = required("QR_SECRET");
if (qrSecret.length < 16) {
  console.error(
    "QR_SECRET must be at least 16 characters. See apps/backend/.env.example",
  );
  process.exit(1);
}

const portRaw = process.env.PORT ?? "3000";
const port = Number(portRaw);
if (!Number.isInteger(port) || port <= 0) {
  console.error(`Invalid PORT: ${portRaw}`);
  process.exit(1);
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "24h",
  QR_SECRET: qrSecret,
  PORT: port,
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`,
  WAVE_FALLBACK_DELAY_MINUTES: numberEnv("WAVE_FALLBACK_DELAY_MINUTES", 5),
  WAVE_SIZE: numberEnv("WAVE_SIZE", 10),
  NO_SHOW_GRACE_MINUTES: numberEnv("NO_SHOW_GRACE_MINUTES", 120),
  STALE_PING_SECONDS: numberEnv("STALE_PING_SECONDS", 90),
  DONATION_COOLDOWN_DAYS: numberEnv("DONATION_COOLDOWN_DAYS", 84),
  ACTION_LINK_TTL_MINUTES: numberEnv("ACTION_LINK_TTL_MINUTES", 720),
  WHATSAPP_ENABLED: boolEnv("WHATSAPP_ENABLED", true),
};
