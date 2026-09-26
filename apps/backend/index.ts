import { createApp } from "./src/app.ts";
import { env } from "./src/env.ts";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`BloodLink API listening on http://localhost:${env.PORT}`);
});
