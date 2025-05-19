import { RequestHandler, Router } from "express";
import {
  getMe,
  googleAuth,
  googleCallback,
  login,
  register,
} from "../controllers/auth.controller";
import { authenticateJWT } from "../middlewares/auth";
import { validateLogin, validateRegister } from "../middlewares/validators";

const router = Router();

// Local auth routes
router.post("/register", validateRegister as RequestHandler[], register as RequestHandler);
router.post("/login", validateLogin as RequestHandler[], login as RequestHandler);
router.get("/me", authenticateJWT as RequestHandler, getMe as RequestHandler);

// Google OAuth routes
router.get("/google", googleAuth as RequestHandler);
router.get("/google/callback", googleCallback as RequestHandler);

export default router;
