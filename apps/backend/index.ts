import { createServer } from "node:http";
import { createApp } from "./src/app.ts";
import { env } from "./src/env.ts";
import { startJobs } from "./src/jobs/index.ts";
import { initSocket } from "./src/lib/socket.ts";
import { startWhatsApp } from "./src/services/whatsapp.ts";

const server = createServer(createApp());
initSocket(server);
startJobs();
startWhatsApp();

server.listen(env.PORT, () => {
  console.log(`BloodLink API listening on http://localhost:${env.PORT}`);
});
