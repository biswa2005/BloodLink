import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.ts";
import { isUniqueViolation } from "../lib/prisma.ts";

export function notFoundHandler(_req: Request, res: Response): void {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (isUniqueViolation(err)) {
    res.status(409).json({
      error: { code: "CONFLICT", message: "Resource already exists" },
    });
    return;
  }
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status?: number }).status === 400
  ) {
    res
      .status(400)
      .json({ error: { code: "BAD_JSON", message: "Malformed JSON body" } });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
}
