import crypto from "node:crypto";
import QRCode from "qrcode";
import { env } from "../env.ts";
import { HttpError } from "../lib/http-error.ts";
import { prisma } from "../lib/prisma.ts";

const QR_TTL_MS = 15 * 60_000;

function hmac(data: string): string {
  return crypto
    .createHmac("sha256", env.QR_SECRET)
    .update(data)
    .digest("base64url");
}

function signPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

function openSigned(signed: string): Record<string, unknown> {
  const dot = signed.lastIndexOf(".");
  if (dot < 0)
    throw new HttpError(400, "INVALID_SIGNATURE", "Token is malformed");
  const body = signed.slice(0, dot);
  const signature = signed.slice(dot + 1);
  const expected = hmac(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(400, "INVALID_SIGNATURE", "Token signature is invalid");
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as Record<
      string,
      unknown
    >;
  } catch {
    throw new HttpError(400, "INVALID_SIGNATURE", "Token payload is malformed");
  }
}

export type GeneratedQr = { token: string; qrDataUrl: string; expiresAt: Date };

export async function generate(
  donorId: string,
  requestId: string,
): Promise<GeneratedQr> {
  const existing = await prisma.qRToken.findFirst({
    where: {
      donorId,
      requestId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    const qrDataUrl = await QRCode.toDataURL(existing.signedPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
    });
    return {
      token: existing.signedPayload,
      qrDataUrl,
      expiresAt: existing.expiresAt,
    };
  }

  const expiresAt = new Date(Date.now() + QR_TTL_MS);
  const token = signPayload({
    donorId,
    requestId,
    nonce: crypto.randomUUID(),
    exp: expiresAt.getTime(),
  });

  await prisma.qRToken.create({
    data: { donorId, requestId, signedPayload: token, expiresAt },
  });

  const qrDataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 2,
  });
  return { token, qrDataUrl, expiresAt };
}

export type VerifiedQr = {
  tokenId: string;
  donorId: string;
  requestId: string;
};

export async function verify(token: string): Promise<VerifiedQr> {
  const payload = openSigned(token);
  const { donorId, requestId, exp } = payload;
  if (
    typeof donorId !== "string" ||
    typeof requestId !== "string" ||
    typeof exp !== "number"
  ) {
    throw new HttpError(400, "INVALID_SIGNATURE", "Token payload is malformed");
  }
  if (Date.now() > exp) {
    throw new HttpError(400, "TOKEN_EXPIRED", "QR token has expired");
  }

  const record = await prisma.qRToken.findFirst({
    where: { signedPayload: token },
  });
  if (!record) {
    throw new HttpError(
      400,
      "TOKEN_NOT_FOUND",
      "QR token was not issued by this server",
    );
  }
  if (record.used) {
    throw new HttpError(
      409,
      "TOKEN_ALREADY_USED",
      "QR token has already been used",
    );
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new HttpError(400, "TOKEN_EXPIRED", "QR token has expired");
  }
  if (record.donorId !== donorId || record.requestId !== requestId) {
    throw new HttpError(
      400,
      "INVALID_SIGNATURE",
      "Token payload does not match the stored token",
    );
  }
  return { tokenId: record.id, donorId, requestId };
}

export function issueActionToken(donorId: string, requestId: string): string {
  return signPayload({
    donorId,
    requestId,
    purpose: "response",
    exp: Date.now() + env.ACTION_LINK_TTL_MINUTES * 60_000,
  });
}

export function verifyActionToken(token: string): {
  donorId: string;
  requestId: string;
} {
  const payload = openSigned(token);
  const { donorId, requestId, purpose, exp } = payload;
  if (
    purpose !== "response" ||
    typeof donorId !== "string" ||
    typeof requestId !== "string" ||
    typeof exp !== "number"
  ) {
    throw new HttpError(400, "INVALID_ACTION_TOKEN", "Link is not valid");
  }
  if (Date.now() > exp) {
    throw new HttpError(410, "ACTION_LINK_EXPIRED", "This link has expired");
  }
  return { donorId, requestId };
}
