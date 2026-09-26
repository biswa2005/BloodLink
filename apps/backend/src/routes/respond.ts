import { Router } from "express";
import { HttpError } from "../lib/http-error.ts";
import { prisma } from "../lib/prisma.ts";
import { generate, verifyActionToken } from "../services/qrService.ts";
import { respondToRequest } from "../services/responseService.ts";

export const respondRouter = Router();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — BloodLink</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #fef2f2; color: #1f2937; }
  main { max-width: 480px; margin: 0 auto; padding: 32px 20px; text-align: center; }
  h1 { font-size: 22px; margin: 0 0 8px; color: #b91c1c; }
  p { line-height: 1.5; margin: 8px 0; }
  .card { background: #fff; border: 1px solid #fecaca; border-radius: 14px; padding: 24px; margin-top: 16px; }
  .muted { color: #6b7280; font-size: 14px; }
  img.qr { width: 260px; height: 260px; margin-top: 12px; border-radius: 8px; }
  .badge { display: inline-block; background: #dc2626; color: #fff; border-radius: 999px; padding: 4px 12px; font-size: 13px; }
</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

respondRouter.get("/respond/:token", async (req, res) => {
  const token = req.params.token ?? "";
  try {
    const { donorId, requestId } = verifyActionToken(token);
    const action = req.query.action === "deny" ? "decline" : "accept";
    const result = await respondToRequest(donorId, requestId, action);

    const request = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
      include: { items: true, hospital: true },
    });
    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: { name: true, bloodGroup: true },
    });
    const need = (request?.items ?? [])
      .map(
        (item) =>
          `${item.unitsNeeded - item.unitsFulfilled} unit(s) ${item.bloodGroup}`,
      )
      .join(", ");

    if (!result.accepted) {
      res
        .status(200)
        .type("html")
        .send(
          page(
            "Response recorded",
            `<div class="card">
              <h1>Thanks for letting us know</h1>
              <p>You declined the request from <strong>${escapeHtml(request?.hospital.name ?? "the hospital")}</strong>.</p>
              <p class="muted">You will not be contacted again for this request.</p>
            </div>`,
          ),
        );
      return;
    }

    const qr = await generate(donorId, requestId);
    res
      .status(200)
      .type("html")
      .send(
        page(
          "You are matched",
          `<div class="card">
            <span class="badge">ACCEPTED</span>
            <h1 style="margin-top:12px">${escapeHtml(donor?.name ?? "Donor")} — you are matched</h1>
            <p>Heading to <strong>${escapeHtml(request?.hospital.name ?? "the hospital")}</strong></p>
            <p class="muted">Needed: ${escapeHtml(need)}</p>
            <p>Show this QR at reception. It is single-use and expires in 15 minutes.</p>
            <img class="qr" src="${qr.qrDataUrl}" alt="Arrival QR code" />
            <p class="muted">No scan needed on your side — just keep this screen open.</p>
          </div>`,
        ),
      );
  } catch (err) {
    if (err instanceof HttpError) {
      res
        .status(err.status)
        .type("html")
        .send(
          page(
            "Link problem",
            `<div class="card">
              <h1>${escapeHtml(err.code)}</h1>
              <p>${escapeHtml(err.message)}</p>
              <p class="muted">Ask the hospital to send a fresh link.</p>
            </div>`,
          ),
        );
      return;
    }
    throw err;
  }
});
