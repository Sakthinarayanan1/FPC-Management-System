/**
 * Verification Test Suite: Optional Fields across all 8 Steps in Flow 2
 */
import app from "../artifacts/api-server/src/app";
import http from "http";
import fs from "fs";

async function runTests() {
  console.log("===========================================================================");
  console.log("   FLOW 2 - ALL FIELDS OPTIONAL ACROSS 8 STEPS VERIFICATION SUITE   ");
  console.log("===========================================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5299, resolve));
  const baseUrl = "http://127.0.0.1:5299";

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, msg: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Create a Flow 1 invitation to obtain a token
    const inviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Optional Test Admin",
        adminEmail: `test.optional.${Date.now()}@example.com`,
        adminMobile: "9876543210",
      }),
    });
    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 201, "Invitation generated successfully");
    const token = inviteData.invitation?.token;
    assert(Boolean(token), "Token issued");

    // 2. Test POST /api/onboarding/applications/submit with completely EMPTY applicationData
    const emptySubmitRes = await fetch(`${baseUrl}/api/onboarding/applications/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        applicationData: {}, // Completely empty!
      }),
    });
    const emptySubmitData = await emptySubmitRes.json();
    assert(emptySubmitRes.status === 200, "POST /applications/submit accepts completely empty applicationData");
    assert(emptySubmitData.success === true, "Empty submission reports success: true");
    assert(Boolean(emptySubmitData.applicationId), "Generated application ID for empty submission");
    assert(emptySubmitData.application?.companyName === "Registered Producer Company", "Empty companyName defaults cleanly to 'Registered Producer Company'");

    // 3. Test with another token for POST /api/onboarding/complete with empty draft
    const inviteRes2 = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Optional Test Admin 2",
        adminEmail: `test.optional2.${Date.now()}@example.com`,
        adminMobile: "9876543211",
      }),
    });
    const inviteData2 = await inviteRes2.json();
    const token2 = inviteData2.invitation?.token;

    const completeRes = await fetch(`${baseUrl}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: token2,
        companyRecord: {},
        draft: {
          basic: {},
          capital: {},
          location: {},
          activities: {},
          directors: [],
          bankAccounts: [],
          legalDocs: {},
        },
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200, "POST /onboarding/complete accepts empty draft and empty companyRecord");
    assert(completeData.success === true, "Complete endpoint reports success");

    // 4. Verify FpcAdminOnboardingWizard.tsx frontend code
    const wizardSrc = fs.readFileSync("artifacts/fpc-management/src/components/onboarding/FpcAdminOnboardingWizard.tsx", "utf-8");

    // Check that validateStep returns true
    assert(
      wizardSrc.includes("validateStep = (_index: number): boolean => {\n    return true;\n  };") ||
      wizardSrc.includes("validateStep = (_index: number): boolean => {\r\n    return true;\r\n  };"),
      "validateStep unconditionally returns true"
    );

    // Check that no red asterisk exists on labels
    assert(!wizardSrc.includes('style={{ color: "#b45309", fontStyle: "normal" }}>*'), "No document red asterisks (*)");
    assert(!wizardSrc.includes('<span className="text-rose-600">*</span>'), "No rose asterisks in wizard");

    // Check that Required badge is not rendered in Field
    assert(!wizardSrc.includes("<i>Required</i>"), "No <i>Required</i> label rendered in wizard Field");

    // Check that required is not passed to Field in step 0, 1, 2, 3, 5, 6
    assert(!wizardSrc.includes('label="FPC Legal Name" value={b.legalName} required'), "FPC Legal Name has no required prop");
    assert(!wizardSrc.includes('label="Corporate Identification Number (CIN)" value={b.cin} required'), "CIN has no required prop");
    assert(!wizardSrc.includes('label="Company PAN" value={b.pan} required'), "PAN has no required prop");
    assert(!wizardSrc.includes('label="Authorized Capital (₹)" type="number" value={c.authorisedCapital} required'), "Authorized Capital has no required prop");
    assert(!wizardSrc.includes('label="Director Full Name" value={d.name} required'), "Director Full Name has no required prop");
    assert(!wizardSrc.includes('label="Registered Office Street Address" value={loc.address} required'), "Street Address has no required prop");
    assert(!wizardSrc.includes('label="Primary Business Activity"\n              value={act.primary || "Produce Procurement"}\n              required'), "Primary Activity has no required prop");

    // Check that FpcManagement.tsx also has required removed
    const fpcMgmtSrc = fs.readFileSync("artifacts/fpc-management/src/FpcManagement.tsx", "utf-8");
    assert(!fpcMgmtSrc.includes("<i>Required</i>"), "FpcManagement.tsx does not render <i>Required</i>");
    assert(
      fpcMgmtSrc.includes("validate = (_index: number): boolean => {\n    return true;\n  };") ||
      fpcMgmtSrc.includes("validate = (_index: number): boolean => {\r\n    return true;\r\n  };"),
      "FpcManagement validate returns true unconditionally"
    );

    // Check database schema in lib/db/src/schema/onboarding.ts
    const schemaSrc = fs.readFileSync("lib/db/src/schema/onboarding.ts", "utf-8");
    assert(!schemaSrc.includes('companyName: varchar("company_name", { length: 255 }).notNull()'), "Schema companyName is nullable (optional)");
    assert(!schemaSrc.includes('state: varchar("state", { length: 100 }).notNull()'), "Schema state is nullable (optional)");
    assert(!schemaSrc.includes('district: varchar("district", { length: 100 }).notNull()'), "Schema district is nullable (optional)");

    console.log("\n===========================================================================");
    console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
    console.log("===========================================================================");
    if (totalTests === passedTests) {
      console.log("\n🎉 ALL OPTIONAL FIELDS VERIFICATION TESTS PASSED!");
    }
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
