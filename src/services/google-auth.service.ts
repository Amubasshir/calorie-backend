import { OAuth2Client } from "google-auth-library";
import config from "../config/config";
import { User } from "../models/user.model";

const client = new OAuth2Client({
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  redirectUri: config.google.callbackUrl,
});

export const getGoogleAuthURL = () => {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
};

export const getGoogleUser = async (code: string) => {
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("No user payload");

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
};

export const createOrUpdateGoogleUser = async (googleUserData: {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}) => {
  const { googleId, email, name } = googleUserData;

  let user = await User.findOne({ googleId });
  if (!user) {
    user = await User.findOne({ email });
  }

  if (user) {
    // Update existing user
    user.googleId = googleId;
    user.name = name;
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      googleId,
      email,
      name,
      password: Math.random().toString(36).slice(-16), // Random password for Google users
      isEmailVerified: true, // Google emails are verified
      role: "user",
    });
  }

  return user;
};
