import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";
import { env } from "../env.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const sessionPath = path.join(here, "../../.whatsapp-session");
const qrPath = path.join(here, "../../whatsapp-qr.png");

export type WhatsAppState = "disabled" | "starting" | "ready" | "fallback";

let state: WhatsAppState = "disabled";
let client: Client | null = null;

function resolveBrowserPath(): string | undefined {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

export function whatsappState(): WhatsAppState {
  return state;
}

export function startWhatsApp(): void {
  if (!env.WHATSAPP_ENABLED) {
    state = "disabled";
    return;
  }

  state = "starting";
  try {
    const executablePath = resolveBrowserPath();
    client = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionPath }),
      puppeteer: {
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    client.on("qr", (qr) => {
      QRCode.toFile(qrPath, qr).catch(() => undefined);
      console.log(
        `[whatsapp] scan the QR to link WhatsApp (image saved to ${qrPath})`,
      );
    });
    client.on("ready", () => {
      state = "ready";
      console.log("[whatsapp] client ready");
    });
    client.on("auth_failure", (message) => {
      state = "fallback";
      console.error(`[whatsapp] auth failure: ${message}`);
    });
    client.on("disconnected", (reason) => {
      state = "fallback";
      console.error(`[whatsapp] disconnected: ${reason}`);
    });
    void client.initialize().catch((err: unknown) => {
      state = "fallback";
      console.error("[whatsapp] failed to start, using console fallback:", err);
    });
  } catch (err) {
    state = "fallback";
    console.error("[whatsapp] failed to start, using console fallback:", err);
  }
}

export async function sendDonorWhatsApp(
  phone: string,
  message: string,
): Promise<void> {
  const digits = phone.replace(/\D/g, "");
  if (state === "ready" && client) {
    try {
      await client.sendMessage(`${digits}@c.us`, message);
      return;
    } catch (err) {
      console.error("[whatsapp] send failed, using console fallback:", err);
    }
  }
  console.log(`[WHATSAPP FALLBACK → ${phone}]\n${message}\n`);
}
