import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error.ts";
import { authRouter } from "./routes/auth.ts";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
