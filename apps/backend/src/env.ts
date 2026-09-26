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

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 16) {
  console.error(
    "JWT_SECRET must be at least 16 characters. See apps/backend/.env.example",
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
  PORT: port,
};
