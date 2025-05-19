import config from "../config/config";
import { IUser, User } from "../models/user.model";
import { sendEmail } from "../utils/email";
import { createError } from "../utils/error";

export class AuthService {
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: IUser; token: string }> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError("User already exists with this email", 400);
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const token = user.generateAuthToken();

    // Send verification email
    const verificationUrl = `${config.clientUrl}/verify-email?token=${token}`;
    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      template: "emailVerification",
      data: {
        name: user.name,
        verificationUrl,
      },
    });

    return { user, token };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw createError("Invalid credentials", 401);
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw createError("Invalid credentials", 401);
    }

    const token = user.generateAuthToken();

    return { user, token };
  }

  async googleAuth(profile: any): Promise<{ user: IUser; token: string }> {
    const { id, emails, displayName } = profile;

    const email = emails[0].value;
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        googleId: id,
        email,
        name: displayName,
        password: Math.random().toString(36).slice(-8),
        isEmailVerified: true,
      });
    } else if (!user.googleId) {
      user.googleId = id;
      await user.save();
    }

    const token = user.generateAuthToken();

    return { user, token };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw createError("User not found with this email", 404);
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        template: "passwordReset",
        data: {
          name: user.name,
          resetUrl,
        },
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      throw createError("Email could not be sent", 500);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw createError("Invalid or expired reset token", 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        throw createError("Invalid verification token", 400);
      }

      user.isEmailVerified = true;
      await user.save();
    } catch (error) {
      throw createError("Invalid verification token", 400);
    }
  }
}
