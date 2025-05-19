import { OAuth2Client } from "google-auth-library";
import request from "supertest";
import config from "../../config/config";
import { User } from "../../models/user.model";
import { app } from "../../server";

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl: jest.fn().mockReturnValue("https://google.com/auth"),
    getToken: jest.fn().mockResolvedValue({
      tokens: { id_token: "mock_id_token" },
    }),
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: "123456789",
        name: "Google User",
        email: "google@example.com",
        picture: "https://example.com/photo.jpg",
      }),
    }),
  })),
}));

describe("Auth API", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.token).toBeDefined();

      const user = await User.findOne({ email: testUser.email });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(testUser.name);
    });

    it("should not register user with existing email", async () => {
      await User.create(testUser);

      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email already in use");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.token).toBeDefined();
    });

    it("should not login with incorrect password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/me", () => {
    let token: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);
      token = res.body.data.token;
    });

    it("should get authenticated user profile", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.name).toBe(testUser.name);
    });

    it("should not get profile without auth token", async () => {
      const res = await request(app).get("/api/auth/me").expect(401);

      expect(res.body.success).toBe(false);
    });
  });
  describe("Google OAuth", () => {
    const mockGoogleUser = {
      sub: "123456789",
      name: "Google User",
      email: "google@example.com",
      picture: "https://example.com/photo.jpg",
    };

    beforeEach(() => {
      // The mock is already set up in the jest.mock call above
      jest.clearAllMocks();
    });

    it("should redirect to Google auth URL", async () => {
      const res = await request(app).get("/api/auth/google").expect(302);

      expect(res.header.location).toContain("https://google.com/auth");
    });

    it("should handle Google callback and create user", async () => {
      const res = await request(app)
        .get("/api/auth/google/callback")
        .query({ code: "mock_auth_code" })
        .expect(302);

      expect(res.header.location).toContain(config.clientUrl);
      expect(res.header.location).toContain("token=");

      const user = await User.findOne({ email: mockGoogleUser.email });
      expect(user).toBeTruthy();
      expect(user?.googleId).toBe(mockGoogleUser.sub);
    });
  });
});
