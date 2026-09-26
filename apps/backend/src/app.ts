import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error.ts";
import { adminRouter } from "./routes/admin.routes.ts";
import { authRouter } from "./routes/auth.ts";
import { bankRouter } from "./routes/bank.routes.ts";
import { donorRouter } from "./routes/donor.routes.ts";
import { hospitalRouter } from "./routes/hospital.routes.ts";
import { mapRouter } from "./routes/map.routes.ts";
import { respondRouter } from "./routes/respond.ts";
import { searchRouter } from "./routes/search.routes.ts";

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/donor", respondRouter);
  app.use("/donor", donorRouter);
  app.use("/hospital", hospitalRouter);
  app.use("/bank", bankRouter);
  app.use("/admin", adminRouter);
  app.use("/search", searchRouter);
  app.use("/map", mapRouter);

  app.use(express.static(path.join(here, "../public")));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
