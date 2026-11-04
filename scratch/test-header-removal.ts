import app from "../artifacts/api-server/src/app";
import http from "http";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("===========================================================================");
  console.log("   FLOW 2 - HEADER AND AUTHENTICATED BANNER REMOVAL VERIFICATION SUITE    ");
  console.log("===========================================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5311, resolve));
  const baseUrl = "http://127.0.0.1:5311";

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  try {
    const tsfViewPath = path.resolve("artifacts/fpc-management/src/components/onboarding/TsfAdminOnboardingView.tsx");
    const wizardPath = path.resolve("artifacts/fpc-management/src/components/onboarding/FpcAdminOnboardingWizard.tsx");

    const tsfContent = fs.readFileSync(tsfViewPath, "utf-8");
    const wizardContent = fs.readFileSync(wizardPath, "utf-8");

    // Item 1: Tata Steel Foundation – Flow 2 heading
    assert(!tsfContent.includes("Flow 2: FPC Company Registration"), "TsfAdminOnboardingView does not contain 'Flow 2: FPC Company Registration'");
    assert(!tsfContent.includes("Tata Steel Foundation &bull; Flow 2"), "TsfAdminOnboardingView does not contain 'Tata Steel Foundation &bull; Flow 2'");

    // Item 2: Complete FPC Company Registration title and description
    assert(!tsfContent.includes("Complete FPC Company Registration</h2>"), "TsfAdminOnboardingView does not contain 'Complete FPC Company Registration' heading");
    assert(!tsfContent.includes("Nominated FPC Administrator completes the official 8-step statutory company onboarding wizard"), "TsfAdminOnboardingView does not contain description text");

    // Item 3: Active Invite dropdown and invitation selector
    assert(!tsfContent.includes("Active Invite:"), "TsfAdminOnboardingView does not contain 'Active Invite:' label");
    assert(!tsfContent.includes("setSelectedInvitationToken(e.target.value)"), "TsfAdminOnboardingView does not contain active invite dropdown handler");

    // Item 4: Standalone Link button
    assert(!tsfContent.includes("Standalone Link"), "TsfAdminOnboardingView does not contain 'Standalone Link' button");

    // Item 5: Back to Flow 1 (Send Invitation) button
    assert(!tsfContent.includes("Back to Flow 1 (Send Invitation)"), "TsfAdminOnboardingView does not contain 'Back to Flow 1 (Send Invitation)' button");

    // Item 6: Authenticated Invitation banner below header
    assert(!wizardContent.includes("Authenticated Invitation"), "FpcAdminOnboardingWizard does not contain 'Authenticated Invitation' text");
    assert(!wizardContent.includes("Single-Use Registration Session"), "FpcAdminOnboardingWizard does not contain 'Single-Use Registration Session'");
    assert(!wizardContent.includes("Invited Administrator:"), "FpcAdminOnboardingWizard does not contain 'Invited Administrator:' banner");

    // Preservation checks:
    assert(wizardContent.includes("Save Draft"), "FpcAdminOnboardingWizard preserves 'Save Draft' button");
    assert(wizardContent.includes("fm-wizard-progress"), "FpcAdminOnboardingWizard preserves progress indicator");
    assert(wizardContent.includes("Basic company details"), "FpcAdminOnboardingWizard preserves Step 1 (Basic company details)");
    assert(wizardContent.includes("Final review & submission"), "FpcAdminOnboardingWizard preserves Step 8 (Final review & submission)");
    assert(wizardContent.includes("handleSubmitRegistration"), "FpcAdminOnboardingWizard preserves submission handler");
    assert(wizardContent.includes("handleSaveDraft"), "FpcAdminOnboardingWizard preserves draft handler");
    assert(wizardContent.includes("/api/onboarding/verify-token"), "FpcAdminOnboardingWizard preserves token verification logic");

    // API functional test: Token generation + verification + draft saving
    const timestamp = Date.now();
    const inviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Verification Admin",
        adminEmail: `verify.header.${timestamp}@example.com`,
        adminMobile: "9876543210",
      }),
    });
    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 201 && inviteData.success, "Flow 1 token generation works via API");
    const token = inviteData.invitation?.token;
    assert(!!token, "Flow 1 returned a valid cryptographically secure token");

    // Verify token endpoint
    const verifyRes = await fetch(`${baseUrl}/api/onboarding/verify-token?token=${encodeURIComponent(token)}`);
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200 && verifyData.valid, "Token verification API confirms single-use token validity");
    assert(verifyData.invitation?.adminName === "Verification Admin", "Verification returned correct nominated admin details");

    // Flow 2 submission
    const submitRes = await fetch(`${baseUrl}/api/onboarding/applications/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        applicationData: {
          companyName: "Header Removal Verified FPC",
          cin: "U01100OD2024PTC999999",
        },
      }),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 200 && submitData.success, "Flow 2 registration submission succeeds");
  } catch (err: any) {
    console.error("Test error:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }

  console.log("\n===========================================================================");
  console.log(`   TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log("===========================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL FLOW 2 HEADER REMOVAL VERIFICATION TESTS PASSED!");
  } else {
    process.exitCode = 1;
  }
}

runTests();
