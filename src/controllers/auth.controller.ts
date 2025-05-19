import bcrypt from "bcryptjs";
import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { User } from "../models/user.model";
import {
  createOrUpdateGoogleUser,
  getGoogleAuthURL,
  getGoogleUser,
} from "../services/google-auth.service";

export const register: RequestHandler = async (req, res, next) => {
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

export const login: RequestHandler = async (req, res, next) => {
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

export const getMe: RequestHandler = async (req, res, next) => {
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
export const googleAuth = (req: Request, res: Response): void => {
  const url = getGoogleAuthURL();
  res.redirect(url);
};

export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res
        .status(400)
        .json({ success: false, message: "Authorization code missing" });
      return;
    }

    const googleUser = await getGoogleUser(code);
    const user = await createOrUpdateGoogleUser(googleUser);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiresIn,
      }
    );

    // Redirect to frontend with token
    res.redirect(`${config.clientUrl}?token=${token}`);
  } catch (error) {
    next(error);
  }
};
