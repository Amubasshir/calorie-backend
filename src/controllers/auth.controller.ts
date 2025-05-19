import bcrypt from "bcryptjs";
import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import { User } from "../models/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "All fields required" });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      role: "user",
    });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(400).json({ success: false, message: "Invalid credentials" });
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Google OAuth handlers
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
}) as unknown as RequestHandler;

export const googleCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  })(req, res, (err: any) => {
    if (err) {
      return next(err);
    }
    // Send success response
    res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
  });
};
