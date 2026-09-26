import type { Role } from "@repo/db";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.ts";
import { verifyToken } from "../lib/jwt.ts";

export type AuthenticatedUser = { id: string; phone: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new HttpError(401, "UNAUTHORIZED", "Missing bearer token"));
    return;
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(new HttpError(401, "INVALID_TOKEN", "Invalid or expired token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, "UNAUTHORIZED", "Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, "FORBIDDEN", "Insufficient permissions"));
      return;
    }
    next();
  };
}
