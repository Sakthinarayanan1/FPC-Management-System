import {
  generatePermanentFpcId,
  type FpcApplication,
  type FpcInvitation,
  type RecordRow,
  initialFpcInvitations,
  initialFpcApplications,
} from "../artifacts/fpc-management/src/lib/store";
import {
  buildInvitationEmailHtml,
  buildApprovalEmailHtml,
  buildCorrectionEmailHtml,
  dispatchEmail,
  getOutbox,
} from "../artifacts/api-server/src/lib/emailService";

async function runOnboardingTests() {
  console.log("=================================================");
  console.log("FPC ONBOARDING SYSTEM — AUTOMATED VERIFICATION");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Permanent FPC ID Generation (Odisha & Jharkhand sequential numbering)
  console.log("\n--- TEST SUITE 1: Permanent FPC ID Generation ---");
  const sampleFpcs: RecordRow[] = [
    { id: "FPC-ODI-001", fpcId: "FPC-ODI-001", name: "Green Valley" },
    { id: "FPC-ODI-002", fpcId: "FPC-ODI-002", name: "Kalinganagar" },
    { id: "FPC-ODI-003", fpcId: "FPC-ODI-003", name: "Gonda" },
    { id: "FPC-ODI-004", fpcId: "FPC-ODI-004", name: "Joda" },
    { id: "FPC-ODI-005", fpcId: "FPC-ODI-005", name: "Barbil" },
    { id: "FPC-JHK-001", fpcId: "FPC-JHK-001", name: "Noamundi" },
    { id: "FPC-JHK-002", fpcId: "FPC-JHK-002", name: "Seraikela" },
    { id: "FPC-JHK-003", fpcId: "FPC-JHK-003", name: "Chaibasa" },
  ];

  const nextOdiId = generatePermanentFpcId(sampleFpcs, "Odisha");
  assert(nextOdiId === "FPC-ODI-006", `Odisha sequential ID generation: expected FPC-ODI-006, got ${nextOdiId}`);

  const nextJhkId = generatePermanentFpcId(sampleFpcs, "Jharkhand");
  assert(nextJhkId === "FPC-JHK-004", `Jharkhand sequential ID generation: expected FPC-JHK-004, got ${nextJhkId}`);

  // TEST 2: Email Templates & Content
  console.log("\n--- TEST SUITE 2: Email Templates & Content ---");
  const testToken = "inv_sec_test_token_8899aabbcc";
  const inviteEmail = buildInvitationEmailHtml({
    adminName: "Ramesh Chandra Nayak",
    token: testToken,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    baseUrl: "http://localhost:3000",
  });
  assert(inviteEmail.html.includes("Tata Steel Foundation"), "Email contains TSF branding");
  assert(inviteEmail.html.includes("Ramesh Chandra Nayak"), "Email personalized to admin name");
  assert(inviteEmail.html.includes(encodeURIComponent(testToken)), "Email contains registration URL with secure token");
  assert(inviteEmail.html.includes("Complete FPC Registration"), "Email contains primary CTA button");
  assert(inviteEmail.html.includes("single-use"), "Email contains single-use security rule");

  const approvalEmail = buildApprovalEmailHtml({
    adminName: "Ramesh Chandra Nayak",
    companyName: "Kalinga Agro Producer Company Ltd.",
    fpcId: "FPC-ODI-006",
    baseUrl: "http://localhost:3000",
  });
  assert(approvalEmail.html.includes("FPC-ODI-006"), "Approval email displays permanent FPC ID");
  assert(approvalEmail.html.includes("Kalinga Agro Producer Company Ltd."), "Approval email contains company name");

  // TEST 3: Email Dispatcher Outbox
  console.log("\n--- TEST SUITE 3: Email Dispatcher Outbox ---");
  await dispatchEmail({
    to: "ramesh.nayak@kalingafpc.in",
    subject: inviteEmail.subject,
    html: inviteEmail.html,
    text: inviteEmail.text,
    category: "invitation",
  });
  const outbox = getOutbox();
  assert(outbox.length > 0, "Dispatched email logged in outbox");
  assert(outbox[0].to === "ramesh.nayak@kalingafpc.in", "Outbox recipient matches");

  // TEST 4: Initial Seed Data Integrity
  console.log("\n--- TEST SUITE 4: Initial Seed Data Integrity ---");
  assert(initialFpcInvitations.length >= 3, `Initial invitations seeded: ${initialFpcInvitations.length}`);
  assert(initialFpcApplications.length >= 2, `Initial applications seeded: ${initialFpcApplications.length}`);

  const submittedInv = initialFpcInvitations.find((i) => i.status === "Submitted");
  assert(submittedInv !== undefined, "Pipeline contains 'Submitted' application for review");

  const sentInv = initialFpcInvitations.find((i) => i.status === "Invitation Sent");
  assert(sentInv !== undefined, "Pipeline contains 'Invitation Sent' record");

  const correctionInv = initialFpcInvitations.find((i) => i.status === "Correction Required");
  assert(correctionInv !== undefined, "Pipeline contains 'Correction Required' record");

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) process.exit(1);
}

runOnboardingTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

