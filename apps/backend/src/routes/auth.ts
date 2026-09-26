import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { getMe, login, register } from "../services/auth.ts";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  res.status(201).json(await register(req.body));
});

authRouter.post("/login", async (req, res) => {
  res.json(await login(req.body));
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: await getMe(req.user!.id) });
});
