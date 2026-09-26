import { Role } from "@repo/db";
import jwt from "jsonwebtoken";
import { env } from "../env.ts";
import { HttpError } from "./http-error.ts";

export type AuthTokenPayload = { id: string; phone: string; role: Role };

export function signToken(user: AuthTokenPayload): string {
  return jwt.sign({ phone: user.phone, role: user.role }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  if (typeof decoded === "string") {
    throw new HttpError(401, "INVALID_TOKEN", "Invalid token");
  }
  const { sub, phone, role } = decoded;
  if (
    typeof sub !== "string" ||
    typeof phone !== "string" ||
    typeof role !== "string" ||
    !Object.values(Role).includes(role as Role)
  ) {
    throw new HttpError(401, "INVALID_TOKEN", "Invalid token payload");
  }
  return { id: sub, phone, role: role as Role };
}
