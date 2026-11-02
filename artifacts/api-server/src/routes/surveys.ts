import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

// In-memory response buffer for active session persistence
const surveyResponsesStore: Array<Record<string, any>> = [];

/**
 * Helper to extract user role and assigned FPC from headers or body
 */
function extractAuthContext(req: Request) {
  const headerRole = req.headers["x-user-role"] as string | undefined;
  const authHeader = req.headers.authorization;
  const bearerRole = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const bodyRole = req.body?.role;
  const role = headerRole || bearerRole || bodyRole || "";

  const headerFpcId = req.headers["x-user-fpc-id"] as string | undefined;
  const bodyAssignedFpcId = req.body?.assignedFpcId;
  const assignedFpcId = headerFpcId || bodyAssignedFpcId || "";

  return { role: role.trim(), assignedFpcId: assignedFpcId.trim() };
}

/**
 * POST /surveys/responses
 * Endpoint to record a new 28-field farmer baseline survey response.
 * Strictly forbidden for TSF Central Admin (Read-Only access).
 * FPC Admin is restricted to their assigned FPC only.
 */
router.post("/surveys/responses", (req: Request, res: Response) => {
  const { role, assignedFpcId } = extractAuthContext(req);
  const targetFpcId = req.body?.fpcId || req.body?.fpc;

  // 1. TSF Central Admin role restriction check
  if (role === "TSF Central Admin") {
    return res.status(403).json({
      error: "Forbidden",
      code: "TSF_CENTRAL_ADMIN_READ_ONLY",
      message: "TSF Central Admin has read-only monitoring access and is strictly restricted from conducting or submitting field surveys."
    });
  }

  // 2. FPC Admin cross-FPC validation check
  if (role === "FPC Admin / Manager" || role.includes("FPC Admin")) {
    if (assignedFpcId && targetFpcId && assignedFpcId !== targetFpcId) {
      return res.status(403).json({
        error: "Forbidden",
        code: "FPC_SCOPE_MISMATCH",
        message: `FPC Admin is assigned to ${assignedFpcId} and cannot conduct surveys for another FPC (${targetFpcId}).`
      });
    }
  }

  const responsePayload = {
    id: req.body?.id || `RSP-${Date.now().toString().slice(-4)}`,
    surveyId: req.body?.surveyId || "SRV-2026-000",
    fpcId: targetFpcId || assignedFpcId || "FPC-ODI-001",
    farmerName: req.body?.farmerName || "Unnamed Farmer",
    village: req.body?.village || "",
    totalLandAcre: req.body?.totalLandAcre ?? 0,
    verificationStatus: req.body?.verificationStatus || "Submitted",
    submissionDate: req.body?.submissionDate || new Date().toISOString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  surveyResponsesStore.unshift(responsePayload);

  return res.status(201).json({
    success: true,
    message: "Field survey response recorded successfully.",
    data: responsePayload
  });
});

/**
 * POST /surveys
 * Endpoint to launch/create a survey campaign.
 * Strictly forbidden for TSF Central Admin.
 */
router.post("/surveys", (req: Request, res: Response) => {
  const { role, assignedFpcId } = extractAuthContext(req);
  const targetFpcId = req.body?.fpcId;

  if (role === "TSF Central Admin") {
    return res.status(403).json({
      error: "Forbidden",
      code: "TSF_CENTRAL_ADMIN_READ_ONLY",
      message: "TSF Central Admin has read-only monitoring access and is strictly restricted from creating or conducting field surveys."
    });
  }

  if ((role === "FPC Admin / Manager" || role.includes("FPC Admin")) && assignedFpcId && targetFpcId && assignedFpcId !== targetFpcId) {
    return res.status(403).json({
      error: "Forbidden",
      code: "FPC_SCOPE_MISMATCH",
      message: `FPC Admin is assigned to ${assignedFpcId} and cannot conduct surveys for another FPC (${targetFpcId}).`
    });
  }

  return res.status(201).json({
    success: true,
    message: "Survey campaign created successfully.",
    surveyId: req.body?.id || `SRV-${Date.now().toString().slice(-4)}`,
    fpcId: targetFpcId || assignedFpcId || "FPC-ODI-001"
  });
});

/**
 * GET /surveys
 * List surveys (Accessible to TSF Central Admin and FPC Admin for monitoring)
 */
router.get("/surveys", (req: Request, res: Response) => {
  const fpcFilter = req.query.fpcId as string | undefined;
  res.json({
    success: true,
    filter: fpcFilter || "ALL",
    count: 3,
    data: [
      {
        id: "SRV-2026-001",
        title: "Kharif 2026 Paddy & Oilseed Baseline Assessment",
        fpcId: fpcFilter || "FPC-ODI-001",
        category: "Baseline",
        targetGroup: "Small & Marginal Producers",
        targetSample: 120,
        responsesReceived: 98,
        completionRate: 81.7,
        season: "Kharif 2026",
        dueDate: "30 Nov 2026",
        status: "Active"
      },
      {
        id: "SRV-2026-002",
        title: "Micro-Irrigation Infrastructure & Water Roster",
        fpcId: fpcFilter || "FPC-ODI-001",
        category: "Irrigation",
        targetGroup: "All Landholding Members",
        targetSample: 85,
        responsesReceived: 85,
        completionRate: 100.0,
        season: "Annual 2026",
        dueDate: "15 Oct 2026",
        status: "Completed"
      },
      {
        id: "SRV-2026-003",
        title: "Tribal NTFP & Backyard Livelihood Audit",
        fpcId: fpcFilter || "FPC-ODI-001",
        category: "Livelihood",
        targetGroup: "ST / Women Farmers",
        targetSample: 60,
        responsesReceived: 42,
        completionRate: 70.0,
        season: "Annual 2026",
        dueDate: "15 Dec 2026",
        status: "Active"
      }
    ]
  });
});

/**
 * GET /surveys/responses
 * Read-only response ledger (Accessible to TSF Central Admin and FPC Admin)
 */
router.get("/surveys/responses", (req: Request, res: Response) => {
  const fpcFilter = req.query.fpcId as string | undefined;
  const surveyIdFilter = req.query.surveyId as string | undefined;

  let results = surveyResponsesStore;
  if (fpcFilter && fpcFilter !== "ALL") {
    results = results.filter(r => r.fpcId === fpcFilter);
  }
  if (surveyIdFilter) {
    results = results.filter(r => r.surveyId === surveyIdFilter);
  }

  res.json({
    success: true,
    total: results.length,
    data: results
  });
});

export default router;

