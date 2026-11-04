import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

export interface SessionUser {
  userId: string;
  role: "TSF Central Admin" | "FPC Admin / Manager";
  username?: string;
  email?: string;
  name: string;
  fpcId?: string;
  fpcName?: string;
  onboardingCompleted?: boolean;
}

export interface TsfAccountRecord {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  name: string;
  email?: string;
  role: "TSF Central Admin";
  createdAt: string;
  lastLoginAt?: string;
}

export interface FpcAccountRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  adminName: string;
  adminMobile?: string;
  fpcId: string;
  fpcName: string;
  invitationId: string;
  role: "FPC Admin / Manager";
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// Cryptographically secure password hashing using PBKDF2 with salt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch {
    return false;
  }
}

// Session Token Generation & Verification with HMAC signature
const SESSION_SECRET = process.env.SESSION_SECRET || "tsf-fpc-enterprise-secret-key-2026-secure";

export function generateSessionToken(user: SessionUser): string {
  const payload = {
    ...user,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

export function verifySessionToken(tokenString: string): SessionUser | null {
  try {
    if (!tokenString || typeof tokenString !== "string") return null;
    const parts = tokenString.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired session
    }
    return {
      userId: payload.userId,
      role: payload.role,
      username: payload.username,
      email: payload.email,
      name: payload.name,
      fpcId: payload.fpcId,
      fpcName: payload.fpcName,
      onboardingCompleted: payload.onboardingCompleted,
    };
  } catch {
    return null;
  }
}

// Seed Initial Accounts Store
const defaultTsfUsername = (process.env.TSF_ADMIN_USERNAME || "tsfadmin").trim();
const defaultTsfPassword = process.env.TSF_ADMIN_PASSWORD || "TataSteel@2026";
const defaultTsfCreds = hashPassword(defaultTsfPassword);

export const tsfAccountsStore: TsfAccountRecord[] = [
  {
    id: "TSF-ACC-0001",
    username: defaultTsfUsername,
    passwordHash: defaultTsfCreds.hash,
    salt: defaultTsfCreds.salt,
    name: "TSF Central Admin",
    email: "central.admin@tatasteelfoundation.org",
    role: "TSF Central Admin",
    createdAt: new Date().toISOString(),
  },
];

const defaultFpcCreds = hashPassword("GreenValley@2026");
export const fpcAccountsStore: FpcAccountRecord[] = [
  {
    id: "FPC-ACC-0001",
    email: "bijay@greenvalleyfpc.in",
    passwordHash: defaultFpcCreds.hash,
    salt: defaultFpcCreds.salt,
    adminName: "Bijay Kumar Mohanty",
    adminMobile: "9876544412",
    fpcId: "FPC-ODI-001",
    fpcName: "Green Valley Farmer Producer Company",
    invitationId: "INV-SEED-0001",
    role: "FPC Admin / Manager",
    onboardingCompleted: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

// Extract Token Helper from Authorization Header or Cookies
export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as Record<string, string>);
    return cookies["tsf_token"] || cookies["fpc_token"] || cookies["auth_token"] || null;
  }
  return null;
}

// Authentication Middleware: TSF Admin Only
export function requireTsfAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractAuthToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized: TSF Admin session required.", code: "NO_SESSION" });
    return;
  }
  const session = verifySessionToken(token);
  if (!session || session.role !== "TSF Central Admin") {
    res.status(403).json({ error: "Forbidden: Access restricted to authorized TSF Central Admin.", code: "TSF_REQUIRED" });
    return;
  }
  (req as any).user = session;
  next();
}

// Authentication Middleware: FPC Admin Only
export function requireFpcAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractAuthToken(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized: FPC Admin session required.", code: "NO_SESSION" });
    return;
  }
  const session = verifySessionToken(token);
  if (!session || session.role !== "FPC Admin / Manager") {
    res.status(403).json({ error: "Forbidden: Access restricted to authorized FPC Administrators.", code: "FPC_REQUIRED" });
    return;
  }
  (req as any).user = session;
  next();
}

// Data Isolation Guard: Ensures FPC Admin cannot access another FPC's data
export function validateFpcDataIsolation(req: Request, targetFpcId: string): boolean {
  const user = (req as any).user as SessionUser | undefined;
  if (!user) return false;
  if (user.role === "TSF Central Admin") return true; // TSF Admin has multi-FPC portfolio oversight
  if (user.role === "FPC Admin / Manager") {
    return user.fpcId === targetFpcId;
  }
  return false;
}
