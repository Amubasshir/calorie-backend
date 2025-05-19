import { Router } from "express";
import {
  getMe,
  googleAuth,
  googleCallback,
  login,
  register,
} from "../controllers/auth.controller";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateJWT, getMe);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
