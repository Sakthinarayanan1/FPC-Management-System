import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import {
  dispatchEmail,
  buildInvitationEmailHtml,
  buildApprovalEmailHtml,
  buildCorrectionEmailHtml,
  getOutbox,
  getSmtpStatus,
  verifySmtpConnection,
} from "../lib/emailService";

const router: IRouter = Router();

// In-memory data store for onboarding invitations and applications
interface ServerInvitation {
  id: string;
  token: string;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  clusterDistrict?: string;
  status:
    | "Invitation Sent"
    | "Link Generated"
    | "Link Generated (Demo Mode)"
    | "Invitation Opened"
    | "Draft"
    | "Submitted"
    | "Under Review"
    | "Correction Required"
    | "Approved"
    | "Rejected"
    | "Expired"
    | "Used";
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  lastResentAt?: string;
  resendCount: number;
  applicationId?: string;
  fpcId?: string;
  notes?: string;
}

interface ServerApplication {
  id: string;
  invitationId: string;
  token: string;
  companyName: string;
  registrationNumber?: string;
  cin?: string;
  pan?: string;
  tan?: string;
  gstin?: string;
  incorporationDate?: string;
  orgType?: string;
  registeredAddress?: string;
  state: string;
  district: string;
  block?: string;
  village?: string;
  pinCode?: string;
  directors: any[];
  operationalInfo: Record<string, any>;
  bankAccounts: any[];
  documents: Record<string, string>;
  status: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  correctionRemarks?: string;
  rejectionReason?: string;
  approvalRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

// Seed initial pipeline records for realistic demo and testing
const invitationsStore: ServerInvitation[] = [
  {
    id: "INV-2026-0001",
    token: "inv_sec_demo_sundargarh_4f8a9e2b1c",
    adminName: "Subhashree Pradhan",
    adminEmail: "subhashree.pradhan@sundargarhfpc.in",
    adminMobile: "9437118822",
    clusterDistrict: "Bonai Tribal Cluster, Sundargarh",
    status: "Submitted",
    invitedBy: "TSF Central Admin",
    invitedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    resendCount: 0,
    applicationId: "APP-FPC-2026-0001",
  },
  {
    id: "INV-2026-0002",
    token: "inv_sec_demo_ranchi_9a7b6c5d4e",
    adminName: "Manoj Soren",
    adminEmail: "manoj.soren@ranchiorganic.in",
    adminMobile: "9835227744",
    clusterDistrict: "Ormanjhi Organic Cluster, Ranchi",
    status: "Invitation Sent",
    invitedBy: "TSF Central Admin",
    invitedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    resendCount: 0,
  },
  {
    id: "INV-2026-0003",
    token: "inv_sec_demo_dhenkanal_3c4d5e6f7a",
    adminName: "Priyabrata Sahoo",
    adminEmail: "priyabrata@dhenkanalagri.in",
    adminMobile: "9438001199",
    clusterDistrict: "Kamakshyanagar Agri Belt, Dhenkanal",
    status: "Correction Required",
    invitedBy: "TSF Central Admin",
    invitedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    resendCount: 1,
    lastResentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    applicationId: "APP-FPC-2026-0002",
  },
];

const applicationsStore: ServerApplication[] = [
  {
    id: "APP-FPC-2026-0001",
    invitationId: "INV-2026-0001",
    token: "inv_sec_demo_sundargarh_4f8a9e2b1c",
    companyName: "Sundargarh Tribal Agro Producer Company Ltd.",
    registrationNumber: "049812",
    cin: "U01100OD2024PTC049812",
    pan: "AAACS9981K",
    tan: "BBNS99812L",
    gstin: "21AAACS9981K1Z4",
    incorporationDate: "2024-03-12",
    orgType: "Producer Company under Section 378A of Companies Act 2013",
    registeredAddress: "At/Po Lahunipara, Bonai Subdivision, Sundargarh, Odisha 770040",
    state: "Odisha",
    district: "Sundargarh",
    block: "Lahunipara",
    village: "Lahunipara",
    pinCode: "770040",
    directors: [
      { name: "Subhashree Pradhan", din: "09823411", designation: "Managing Director", mobile: "9437118822", email: "subhashree@sundargarhfpc.in" },
      { name: "Birsa Oram", din: "09823412", designation: "Chairperson", mobile: "9437118823", email: "birsa@sundargarhfpc.in" },
      { name: "Mangal Munda", din: "09823413", designation: "Director", mobile: "9437118824", email: "mangal@sundargarhfpc.in" },
      { name: "Sukanti Minz", din: "09823414", designation: "Director", mobile: "9437118825", email: "sukanti@sundargarhfpc.in" },
      { name: "Dharanidhar Kisan", din: "09823415", designation: "Director", mobile: "9437118826", email: "dharani@sundargarhfpc.in" },
    ],
    operationalInfo: {
      primary: "Produce Procurement",
      secondary: ["Agricultural Input Supply", "Storage and Warehousing"],
      commodities: "Millets (Ragi, Kodo), Forest Produce, Pulses",
      membersCount: 160,
      villagesCovered: 18,
    },
    bankAccounts: [
      { bankName: "State Bank of India", accountHolderName: "Sundargarh Tribal Agro Producer Company Ltd.", accountNumber: "40981234567", ifscCode: "SBIN0001245", branchName: "Lahunipara" }
    ],
    documents: {
      incorporationCert: "incorporation-cert.pdf",
      panCard: "pan-card.pdf",
      cancelledCheque: "cancelled-cheque.pdf",
    },
    status: "Submitted",
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "APP-FPC-2026-0002",
    invitationId: "INV-2026-0003",
    token: "inv_sec_demo_dhenkanal_3c4d5e6f7a",
    companyName: "Dhenkanal Mango & Vegetable Growers FPC Ltd.",
    registrationNumber: "048123",
    cin: "U01100OD2023PTC048123",
    pan: "AAACD8876P",
    tan: "BBND88761M",
    gstin: "21AAACD8876P1Z8",
    incorporationDate: "2023-08-15",
    orgType: "Producer Company under Section 378A of Companies Act 2013",
    registeredAddress: "Gondia Block, Dhenkanal, Odisha 759016",
    state: "Odisha",
    district: "Dhenkanal",
    block: "Gondia",
    village: "Karamul",
    pinCode: "759016",
    directors: [
      { name: "Priyabrata Sahoo", din: "08761234", designation: "Managing Director", mobile: "9438001199", email: "priyabrata@dhenkanalagri.in" },
      { name: "Rabindra Samal", din: "08761235", designation: "Chairperson", mobile: "9438001198", email: "rabindra@dhenkanalagri.in" },
    ],
    operationalInfo: {
      primary: "Produce Marketing",
      commodities: "Amrapali Mango, Okra, Brinjal, Chilli",
      membersCount: 110,
    },
    bankAccounts: [],
    documents: {},
    status: "Correction Required",
    correctionRemarks: "Please provide a minimum of 5 directors as required for a Producer Company, and upload the cancelled bank cheque.",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

// Helper to determine base URL
function getBaseUrl(req: Request) {
  if (process.env.APP_URL?.trim()) {
    return process.env.APP_URL.trim().replace(/\/+$/, "");
  }
  const host = req.get("host") || "localhost:3000";
  // If api-server runs on port 5000, map to frontend port 3000
  const clientHost = host.replace(/:5000$/, ":3000");
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${protocol}://${clientHost}`;
}

/**
 * POST /onboarding/invitations
 * Phase 1: TSF Admin initiates FPC Onboarding with 3 required fields ONLY
 */
router.post("/onboarding/invitations", async (req: Request, res: Response) => {
  const { adminName, adminEmail, adminMobile, clusterDistrict, cluster, district, notes, demoMode } = req.body;
  const isDemo = Boolean(demoMode || req.query.demo === "true" || process.env.DEMO_MODE === "true");
  const assignedClusterDistrict = (clusterDistrict || cluster || district || notes || "").trim() || undefined;

  // Validation: Required 3 fields
  if (!adminName || typeof adminName !== "string" || adminName.trim().length < 3) {
    return res.status(400).json({ error: "FPC Admin Name is required and must have at least 3 characters." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!adminEmail || !emailRegex.test(adminEmail.trim())) {
    return res.status(400).json({ error: "A valid FPC Admin Email address is required." });
  }

  const mobileClean = String(adminMobile || "").replace(/\D/g, "");
  if (mobileClean.length !== 10) {
    return res.status(400).json({ error: "A valid 10-digit Indian Mobile Number is required." });
  }

  const trimmedEmail = adminEmail.trim().toLowerCase();

  // Duplicate Check against active invitations
  const existingActive = invitationsStore.find(
    (inv) =>
      (inv.adminEmail.toLowerCase() === trimmedEmail || inv.adminMobile.replace(/\D/g, "") === mobileClean) &&
      inv.status !== "Rejected" &&
      inv.status !== "Expired"
  );

  if (existingActive) {
    return res.status(409).json({
      error: "Duplicate Invitation Detected",
      message: `An active onboarding invitation already exists for this email/mobile (Sent on ${new Date(existingActive.invitedAt).toLocaleDateString("en-IN")}). Current Status: ${existingActive.status}.`,
      existingInvitation: existingActive,
      canResend: true,
    });
  }

  // Generate secure 64-char token
  const token = `inv_sec_${crypto.randomBytes(24).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 86400000).toISOString(); // 7-day expiration
  const baseUrl = getBaseUrl(req);
  const registrationUrl = `${baseUrl}/onboard/register?token=${token}`;

  const newInvitation: ServerInvitation = {
    id: `INV-${now.getFullYear()}-${Date.now().toString().slice(-4)}`,
    token,
    adminName: adminName.trim(),
    adminEmail: trimmedEmail,
    adminMobile: mobileClean,
    clusterDistrict: assignedClusterDistrict,
    status: isDemo ? "Link Generated (Demo Mode)" : "Invitation Sent",
    invitedBy: (req.headers["x-user-name"] as string) || "TSF Central Admin",
    invitedAt: now.toISOString(),
    expiresAt,
    resendCount: 0,
    notes: notes?.trim() || undefined,
  };

  // If explicitly demo mode without SMTP requested, generate link directly
  if (isDemo && (req.query.skipSmtp === "true" || req.body.skipSmtp === true)) {
    invitationsStore.unshift(newInvitation);
    return res.status(201).json({
      success: true,
      emailDispatched: false,
      demoMode: true,
      message: `Demo Mode: Registration invitation link generated successfully without SMTP dispatch.`,
      invitation: newInvitation,
      registrationUrl,
    });
  }

  // Dispatch branded email
  const emailPayload = buildInvitationEmailHtml({
    adminName: newInvitation.adminName,
    token: newInvitation.token,
    expiresAt: newInvitation.expiresAt,
    baseUrl,
  });

  try {
    const emailResult = await dispatchEmail({
      to: newInvitation.adminEmail,
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
      category: "invitation",
      metadata: { invitationId: newInvitation.id, adminMobile: newInvitation.adminMobile },
    });

    newInvitation.status = "Invitation Sent";
    invitationsStore.unshift(newInvitation);

    return res.status(201).json({
      success: true,
      emailDispatched: true,
      message: `Invitation successfully dispatched to ${newInvitation.adminEmail}.`,
      invitation: newInvitation,
      registrationUrl,
      emailMessageId: emailResult.providerMessageId,
      previewUrl: emailResult.previewUrl,
    });
  } catch (err: any) {
    const errorMsg = err.message || "Failed to dispatch email via mail provider";
    // Always preserve invitation record so Copy Link and Open Link work independently
    newInvitation.status = "Link Generated";
    invitationsStore.unshift(newInvitation);

    return res.status(201).json({
      success: true,
      emailDispatched: false,
      emailError: errorMsg,
      message: `Registration link generated successfully. Note: Email delivery could not be completed via mail provider (${errorMsg}). You can use Copy Link or Open Link directly.`,
      invitation: newInvitation,
      registrationUrl,
    });
  }
});

/**
 * GET /onboarding/invitations
 * TSF Admin: List all invitations and linked application progress
 */
router.get("/onboarding/invitations", (req: Request, res: Response) => {
  const combined = invitationsStore.map((inv) => {
    const linkedApp = applicationsStore.find((app) => app.invitationId === inv.id);
    return {
      ...inv,
      application: linkedApp || null,
    };
  });

  return res.json({
    success: true,
    count: combined.length,
    data: combined,
  });
});

/**
 * GET /onboarding/smtp-status
 * Diagnostics: Returns current mail provider configuration status without revealing secrets
 */
router.get("/onboarding/smtp-status", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    status: getSmtpStatus(),
  });
});

/**
 * POST /onboarding/smtp-verify
 * Diagnostics: Live test of SMTP connection against configured mail provider
 */
router.post("/onboarding/smtp-verify", async (_req: Request, res: Response) => {
  const result = await verifySmtpConnection();
  if (result.ok) {
    return res.json({ success: true, message: result.message });
  }
  return res.status(502).json({ success: false, error: result.message });
});

/**
 * POST /onboarding/invitations/:id/resend
 * TSF Admin: Controlled resend of invitation link
 */
router.post("/onboarding/invitations/:id/resend", async (req: Request, res: Response) => {
  const { id } = req.params;
  const invitation = invitationsStore.find((inv) => inv.id === id);

  if (!invitation) {
    return res.status(404).json({ error: "Invitation record not found." });
  }

  // Extend expiration by 7 days
  const now = new Date();
  invitation.expiresAt = new Date(now.getTime() + 7 * 86400000).toISOString();
  invitation.lastResentAt = now.toISOString();
  invitation.resendCount += 1;
  if (invitation.status === "Expired") {
    invitation.status = "Invitation Sent";
  }

  // Dispatch fresh email
  const baseUrl = getBaseUrl(req);
  const emailPayload = buildInvitationEmailHtml({
    adminName: invitation.adminName,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    baseUrl,
  });

  try {
    const emailResult = await dispatchEmail({
      to: invitation.adminEmail,
      subject: `(Reminder) ${emailPayload.subject}`,
      html: emailPayload.html,
      text: emailPayload.text,
      category: "invitation",
      metadata: { invitationId: invitation.id, resendCount: invitation.resendCount },
    });

    return res.json({
      success: true,
      message: `Invitation successfully resent to ${invitation.adminEmail}. Link expiration extended by 7 days.`,
      invitation,
      registrationUrl: `${baseUrl}/onboard/register?token=${invitation.token}`,
      emailMessageId: emailResult.providerMessageId,
      previewUrl: emailResult.previewUrl,
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: `Failed to resend invitation email: ${err.message || "Email provider rejected"}`,
    });
  }
});

/**
 * GET /onboarding/verify-token
 * Public endpoint: Validates token for FPC Admin
 */
router.get("/onboarding/verify-token", (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(400).json({ error: "Invitation token parameter is required." });
  }

  const invitation = invitationsStore.find((inv) => inv.token === token);
  if (!invitation) {
    return res.status(404).json({
      error: "Invalid or Revoked Link",
      message: "This invitation link was not found. Please contact TSF Central Operations.",
    });
  }

  // Check expiration
  if (new Date() > new Date(invitation.expiresAt)) {
    return res.status(410).json({
      error: "Invitation Expired",
      message: "This invitation link expired on " + new Date(invitation.expiresAt).toLocaleDateString("en-IN") + ". Please request a fresh invitation link from TSF Central Admin.",
      expired: true,
    });
  }

  // Check if already used
  if (invitation.status === "Used") {
    return res.status(409).json({
      error: "Invitation Already Used",
      message: "This invitation link has already been used to complete company registration. Each invitation link is single-use.",
      alreadyUsed: true,
      invitation: {
        id: invitation.id,
        adminName: invitation.adminName,
        adminEmail: invitation.adminEmail,
        status: invitation.status,
      },
    });
  }

  // Check if already approved
  if (invitation.status === "Approved") {
    return res.json({
      success: true,
      alreadyApproved: true,
      message: "This company registration has already been approved and activated.",
      fpcId: invitation.fpcId,
    });
  }

  // If status is "Invitation Sent", transition to "Invitation Opened"
  if (invitation.status === "Invitation Sent") {
    invitation.status = "Invitation Opened";
  }

  const existingApp = applicationsStore.find((app) => app.invitationId === invitation.id);

  return res.json({
    success: true,
    valid: true,
    invitation: {
      id: invitation.id,
      adminName: invitation.adminName,
      adminEmail: invitation.adminEmail,
      adminMobile: invitation.adminMobile,
      clusterDistrict: invitation.clusterDistrict || invitation.notes,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    },
    application: existingApp || null,
  });
});

/**
 * POST /onboarding/applications/draft
 * FPC Admin: Save draft application
 */
router.post("/onboarding/applications/draft", (req: Request, res: Response) => {
  const { token, companyData } = req.body;
  if (!token) return res.status(400).json({ error: "Invitation token is required." });

  const invitation = invitationsStore.find((inv) => inv.token === token);
  if (!invitation) return res.status(404).json({ error: "Invalid invitation token." });

  let app = applicationsStore.find((a) => a.invitationId === invitation.id);
  const now = new Date().toISOString();

  if (!app) {
    const newApp: ServerApplication = {
      id: `APP-FPC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      invitationId: invitation.id,
      token,
      companyName: companyData?.companyName || "New Producer Company",
      directors: companyData?.directors || [],
      operationalInfo: companyData?.operationalInfo || {},
      bankAccounts: companyData?.bankAccounts || [],
      documents: companyData?.documents || {},
      state: companyData?.state || "Odisha",
      district: companyData?.district || "",
      block: companyData?.block || "",
      village: companyData?.village || "",
      pinCode: companyData?.pinCode || "",
      status: "Draft",
      createdAt: now,
      updatedAt: now,
      ...companyData,
    };
    applicationsStore.unshift(newApp);
    invitation.applicationId = newApp.id;
    if (invitation.status === "Invitation Opened") invitation.status = "Draft";
    app = newApp;
  } else {
    Object.assign(app, companyData, { updatedAt: now });
  }

  return res.json({
    success: true,
    message: "Application draft autosaved.",
    application: app,
  });
});

/**
 * POST /onboarding/applications/submit
 * FPC Admin: Complete and submit 6-step registration
 */
router.post("/onboarding/applications/submit", (req: Request, res: Response) => {
  const { token, applicationData } = req.body;
  if (!token) return res.status(400).json({ error: "Invitation token is required." });

  const invitation = invitationsStore.find((inv) => inv.token === token);
  if (!invitation) return res.status(404).json({ error: "Invalid invitation token." });

  // Basic validation of mandatory fields
  if (!applicationData?.companyName || applicationData.companyName.trim().length < 3) {
    return res.status(400).json({ error: "Company Legal Name is required." });
  }
  if (!applicationData?.state || !applicationData?.district) {
    return res.status(400).json({ error: "Registered State and District are mandatory." });
  }

  const now = new Date().toISOString();
  let app = applicationsStore.find((a) => a.invitationId === invitation.id);

  if (!app) {
    const newApp: ServerApplication = {
      id: `APP-FPC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      invitationId: invitation.id,
      token,
      companyName: applicationData.companyName.trim(),
      state: applicationData.state,
      district: applicationData.district,
      directors: applicationData.directors || [],
      operationalInfo: applicationData.operationalInfo || {},
      bankAccounts: applicationData.bankAccounts || [],
      documents: applicationData.documents || {},
      status: "Submitted",
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      ...applicationData,
    };
    applicationsStore.unshift(newApp);
    invitation.applicationId = newApp.id;
    app = newApp;
  } else {
    Object.assign(app, applicationData, {
      status: "Submitted",
      submittedAt: now,
      updatedAt: now,
    });
  }

  invitation.status = "Submitted";

  return res.json({
    success: true,
    message: "Application successfully submitted for TSF Central Admin verification.",
    applicationId: app.id,
    application: app,
  });
});

/**
 * POST /onboarding/complete
 * Flow 2: FPC Admin completes and submits the 8-step registration
 */
router.post("/onboarding/complete", (req: Request, res: Response) => {
  const { token, companyRecord, draft } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Invitation token parameter is required." });
  }

  const invitation = invitationsStore.find((inv) => inv.token === token);
  if (!invitation) {
    return res.status(404).json({ error: "Invalid invitation link." });
  }

  if (invitation.status === "Used") {
    return res.status(409).json({ error: "This invitation link has already been completed." });
  }

  const now = new Date().toISOString();
  const companyName = companyRecord?.name || draft?.basic?.legalName || "New Producer Company";
  const stateVal = draft?.location?.state || "Odisha";
  const districtVal = draft?.location?.district || "";

  let app = applicationsStore.find((a) => a.invitationId === invitation.id);
  if (!app) {
    const newApp: ServerApplication = {
      id: `APP-FPC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      invitationId: invitation.id,
      token,
      companyName,
      state: stateVal,
      district: districtVal,
      directors: draft?.directors || [],
      operationalInfo: draft?.activities || {},
      bankAccounts: draft?.bankAccounts || [],
      documents: draft?.legalDocs || {},
      status: "Submitted",
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      cin: draft?.basic?.cin,
      pan: draft?.basic?.pan,
      tan: draft?.basic?.tan,
      gstin: draft?.basic?.gstin,
      incorporationDate: draft?.basic?.incorporationDate,
      registeredAddress: draft?.location?.address,
      block: draft?.location?.block,
      village: draft?.location?.village,
      pinCode: draft?.location?.pin,
    };
    applicationsStore.unshift(newApp);
    invitation.applicationId = newApp.id;
    app = newApp;
  } else {
    Object.assign(app, {
      companyName,
      state: stateVal,
      district: districtVal,
      directors: draft?.directors || app.directors,
      operationalInfo: draft?.activities || app.operationalInfo,
      bankAccounts: draft?.bankAccounts || app.bankAccounts,
      status: "Submitted",
      submittedAt: now,
      updatedAt: now,
    });
  }

  // Mark invitation as permanently Used
  invitation.status = "Used";

  return res.json({
    success: true,
    message: "Company registration completed and submitted to Tata Steel Foundation.",
    applicationId: app.id,
    companyName,
    invitationId: invitation.id,
    submittedAt: now,
  });
});

/**
 * POST /onboarding/applications/:id/review
 * TSF Admin: Review actions (Under Review, Correction Required, Reject, Approve)
 */
router.post("/onboarding/applications/:id/review", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, remarks, permanentFpcId } = req.body;

  const app = applicationsStore.find((a) => a.id === id);
  if (!app) return res.status(404).json({ error: "Application not found." });

  const invitation = invitationsStore.find((inv) => inv.id === app.invitationId);
  const now = new Date().toISOString();
  const baseUrl = getBaseUrl(req);

  if (action === "under_review") {
    app.status = "Under Review";
    if (invitation) invitation.status = "Under Review";
    app.updatedAt = now;
    return res.json({ success: true, message: "Application placed Under Review.", application: app });
  }

  if (action === "correction") {
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ error: "Correction remarks are required." });
    }
    app.status = "Correction Required";
    app.correctionRemarks = remarks.trim();
    app.updatedAt = now;
    if (invitation) invitation.status = "Correction Required";

    // Dispatch correction email
    if (invitation) {
      const emailPayload = buildCorrectionEmailHtml({
        adminName: invitation.adminName,
        companyName: app.companyName,
        token: invitation.token,
        remarks: remarks.trim(),
        baseUrl,
      });
      await dispatchEmail({
        to: invitation.adminEmail,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
        category: "correction",
      });
    }

    return res.json({ success: true, message: "Clarification request sent to FPC Admin.", application: app });
  }

  if (action === "reject") {
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ error: "A mandatory rejection reason is required." });
    }
    app.status = "Rejected";
    app.rejectionReason = remarks.trim();
    app.updatedAt = now;
    if (invitation) invitation.status = "Rejected";
    return res.json({ success: true, message: "Application marked as Rejected.", application: app });
  }

  if (action === "approve") {
    // Generate or verify permanent FPC ID
    const assignedId = permanentFpcId || `FPC-${app.state === "Jharkhand" ? "JHK" : "ODI"}-${Date.now().toString().slice(-3)}`;
    app.status = "Approved";
    app.approvalRemarks = remarks || "All statutory and governance records verified.";
    app.updatedAt = now;

    if (invitation) {
      invitation.status = "Approved";
      invitation.fpcId = assignedId;

      // Dispatch approval confirmation email
      const emailPayload = buildApprovalEmailHtml({
        adminName: invitation.adminName,
        companyName: app.companyName,
        fpcId: assignedId,
        baseUrl,
      });

      await dispatchEmail({
        to: invitation.adminEmail,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
        category: "approval",
        metadata: { fpcId: assignedId },
      });
    }

    return res.json({
      success: true,
      message: `FPC approved and assigned permanent ID ${assignedId}. Confirmation email dispatched.`,
      fpcId: assignedId,
      application: app,
    });
  }

  return res.status(400).json({ error: "Invalid action specified." });
});

/**
 * GET /onboarding/email-outbox
 * Read-only recent email audit ledger
 */
router.get("/onboarding/email-outbox", (_req: Request, res: Response) => {
  res.json({
    success: true,
    outbox: getOutbox(),
  });
});

export default router;
