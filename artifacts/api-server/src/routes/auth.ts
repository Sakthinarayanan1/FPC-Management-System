import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
  extractAuthToken,
  tsfAccountsStore,
  fpcAccountsStore,
  type SessionUser,
} from "../lib/authService";
import { invitationsStore } from "./onboarding";

const router: IRouter = Router();

// ============================================================================
// FLOW 1: TSF ADMIN AUTHENTICATION
// ============================================================================

/**
 * POST /api/auth/tsf/login
 * TSF Admin Login with username and password
 */
router.post("/auth/tsf/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ success: false, error: "Username is required." });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ success: false, error: "Password is required." });
  }

  const cleanUsername = username.trim().toLowerCase();
  const account = tsfAccountsStore.find((acc) => acc.username.toLowerCase() === cleanUsername);

  if (!account) {
    return res.status(401).json({ success: false, error: "Invalid TSF Admin username or password." });
  }

  const isValidPassword = verifyPassword(password, account.passwordHash, account.salt);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, error: "Invalid TSF Admin username or password." });
  }

  // Update last login
  account.lastLoginAt = new Date().toISOString();

  const user: SessionUser = {
    userId: account.id,
    role: "TSF Central Admin",
    username: account.username,
    name: account.name,
    email: account.email,
  };

  const sessionToken = generateSessionToken(user);

  res.cookie("tsf_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "TSF Admin login successful.",
    token: sessionToken,
    user,
    redirectTo: "/tsf/dashboard",
  });
});

/**
 * GET /api/auth/tsf/me
 * Validate current TSF Admin session
 */
router.get("/auth/tsf/me", (req: Request, res: Response) => {
  const token = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({ authenticated: false, error: "No active TSF session." });
  }

  const session = verifySessionToken(token);
  if (!session || session.role !== "TSF Central Admin") {
    return res.status(401).json({ authenticated: false, error: "Invalid or expired TSF session." });
  }

  return res.status(200).json({
    authenticated: true,
    user: session,
  });
});

/**
 * POST /api/auth/tsf/logout
 */
router.post("/auth/tsf/logout", (req: Request, res: Response) => {
  res.clearCookie("tsf_token");
  return res.status(200).json({ success: true, message: "Logged out from TSF Central Admin." });
});

// ============================================================================
// FLOW 3: FPC ADMIN INVITATION VERIFICATION & ACCOUNT ACTIVATION
// ============================================================================

/**
 * GET /api/auth/fpc/verify-invitation
 * Validates invitation token, returns locked invited email and FPC details
 */
router.get("/auth/fpc/verify-invitation", (req: Request, res: Response) => {
  const token = String(req.query.token || "").trim();

  if (!token) {
    return res.status(400).json({ valid: false, error: "Invitation token is required." });
  }

  const invitation = invitationsStore.find((inv) => inv.token === token);
  if (!invitation) {
    return res.status(404).json({ valid: false, error: "Invalid invitation token. Please check your email link." });
  }

  const isExpired = new Date(invitation.expiresAt).getTime() < Date.now();
  if (isExpired && invitation.status !== "Accepted") {
    invitation.status = "Expired";
    return res.status(410).json({
      valid: false,
      error: "This invitation link has expired. Please contact Tata Steel Foundation to request a new invitation.",
      isExpired: true,
    });
  }

  if (invitation.status === "Accepted") {
    return res.status(409).json({
      valid: false,
      error: "This invitation has already been accepted and the FPC Admin account is active. Please log in directly with your email and password.",
      isAccepted: true,
      email: invitation.adminEmail,
    });
  }

  // Check if an account already exists for this email
  const existingAccount = fpcAccountsStore.find(
    (acc) => acc.email.toLowerCase() === invitation.adminEmail.toLowerCase()
  );

  return res.status(200).json({
    valid: true,
    invitation: {
      id: invitation.id,
      token: invitation.token,
      fpcName: invitation.fpcName || "Farmer Producer Company",
      adminName: invitation.adminName,
      adminEmail: invitation.adminEmail, // LOCKED: Non-editable on client
      adminMobile: invitation.adminMobile,
      clusterDistrict: invitation.clusterDistrict || invitation.notes,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
      hasExistingAccount: Boolean(existingAccount),
    },
  });
});

/**
 * POST /api/auth/fpc/activate
 * FPC Admin sets password and activates their account
 * Email CANNOT be changed; it is strictly retrieved from the verified invitation record.
 */
router.post("/auth/fpc/activate", (req: Request, res: Response) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Valid invitation token is required for activation." });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  const invitation = invitationsStore.find((inv) => inv.token === token.trim());
  if (!invitation) {
    return res.status(404).json({ error: "Invitation record not found." });
  }

  if (invitation.status === "Accepted") {
    return res.status(409).json({ error: "This invitation has already been activated. Please log in with your email and password." });
  }

  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    invitation.status = "Expired";
    return res.status(410).json({ error: "This invitation has expired. Please contact TSF to request a new link." });
  }

  // Mandatory: Email is locked to invitation record
  const lockedEmail = invitation.adminEmail.trim().toLowerCase();
  const fpcName = invitation.fpcName?.trim() || "Farmer Producer Company";
  const fpcId = invitation.fpcId || `FPC-${Date.now().toString().slice(-4)}`;

  // Hash password securely with salt
  const { hash, salt } = hashPassword(password);

  // Check if account already exists
  let account = fpcAccountsStore.find((acc) => acc.email.toLowerCase() === lockedEmail);
  if (account) {
    account.passwordHash = hash;
    account.salt = salt;
    account.fpcId = fpcId;
    account.fpcName = fpcName;
    account.adminName = invitation.adminName;
    account.adminMobile = invitation.adminMobile;
    account.invitationId = invitation.id;
    account.lastLoginAt = new Date().toISOString();
  } else {
    account = {
      id: `FPC-ACC-${Date.now().toString().slice(-4)}`,
      email: lockedEmail,
      passwordHash: hash,
      salt,
      adminName: invitation.adminName,
      adminMobile: invitation.adminMobile,
      fpcId,
      fpcName,
      invitationId: invitation.id,
      role: "FPC Admin / Manager",
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    fpcAccountsStore.push(account);
  }

  // Update invitation record
  invitation.status = "Accepted";
  invitation.fpcId = fpcId;

  // Create session for immediate seamless onboarding
  const user: SessionUser = {
    userId: account.id,
    role: "FPC Admin / Manager",
    email: account.email,
    name: account.adminName,
    fpcId: account.fpcId,
    fpcName: account.fpcName,
    onboardingCompleted: account.onboardingCompleted,
  };

  const sessionToken = generateSessionToken(user);

  res.cookie("fpc_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "FPC Admin account activated successfully. Welcome to the FPC Management System!",
    token: sessionToken,
    user,
    redirectTo: "/onboard/register",
  });
});

// ============================================================================
// FLOW 3 (CONT.): FPC ADMIN LOGIN
// ============================================================================

/**
 * POST /api/auth/fpc/login
 * FPC Admin Login with Email and Password
 */
router.post("/auth/fpc/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ success: false, error: "Email address is required." });
  }

  if (!password || typeof password !== "string") {
    return res.status(400).json({ success: false, error: "Password is required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const account = fpcAccountsStore.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (!account) {
    return res.status(401).json({
      success: false,
      error: "Invalid email or password. If you received an invitation link, please activate your account first.",
    });
  }

  const isValidPassword = verifyPassword(password, account.passwordHash, account.salt);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, error: "Invalid email or password." });
  }

  account.lastLoginAt = new Date().toISOString();

  const user: SessionUser = {
    userId: account.id,
    role: "FPC Admin / Manager",
    email: account.email,
    name: account.adminName,
    fpcId: account.fpcId,
    fpcName: account.fpcName,
    onboardingCompleted: account.onboardingCompleted,
  };

  const sessionToken = generateSessionToken(user);

  res.cookie("fpc_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "FPC Admin login successful.",
    token: sessionToken,
    user,
    // If onboarding not completed, route to onboarding wizard; else route to FPC dashboard
    redirectTo: account.onboardingCompleted ? "/overview" : "/onboard/register",
  });
});

/**
 * GET /api/auth/fpc/me
 * Validate current FPC Admin session and enforce tenant isolation
 */
router.get("/auth/fpc/me", (req: Request, res: Response) => {
  const token = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({ authenticated: false, error: "No active FPC session." });
  }

  const session = verifySessionToken(token);
  if (!session || session.role !== "FPC Admin / Manager") {
    return res.status(401).json({ authenticated: false, error: "Invalid or expired FPC session." });
  }

  // Fetch freshest onboarding status from store
  const account = fpcAccountsStore.find((acc) => acc.id === session.userId);
  if (account) {
    session.onboardingCompleted = account.onboardingCompleted;
  }

  return res.status(200).json({
    authenticated: true,
    user: session,
  });
});

/**
 * POST /api/auth/fpc/logout
 */
router.post("/auth/fpc/logout", (req: Request, res: Response) => {
  res.clearCookie("fpc_token");
  return res.status(200).json({ success: true, message: "Logged out from FPC Admin portal." });
});

// ============================================================================
// DATA ISOLATION VERIFICATION API
// ============================================================================

/**
 * GET /api/auth/verify-access/:fpcId
 * Enforces that an FPC Admin can NEVER access another FPC's data
 */
router.get("/auth/verify-access/:fpcId", (req: Request, res: Response) => {
  const token = extractAuthToken(req);
  if (!token) {
    return res.status(401).json({ allowed: false, error: "Authentication required." });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ allowed: false, error: "Invalid session." });
  }

  // TSF Admin has multi-FPC oversight
  if (session.role === "TSF Central Admin") {
    return res.status(200).json({ allowed: true, role: session.role, fpcId: req.params.fpcId });
  }

  // FPC Admin is strictly isolated to their own FPC
  if (session.role === "FPC Admin / Manager") {
    if (session.fpcId === req.params.fpcId) {
      return res.status(200).json({ allowed: true, role: session.role, fpcId: session.fpcId });
    }
    return res.status(403).json({
      allowed: false,
      error: "Access Denied: You are not authorized to access this FPC's data. Access is strictly restricted to your assigned FPC.",
      userFpcId: session.fpcId,
      requestedFpcId: req.params.fpcId,
    });
  }

  return res.status(403).json({ allowed: false, error: "Unauthorized role." });
});

export default router;
