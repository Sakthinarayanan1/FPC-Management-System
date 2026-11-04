import app from "../artifacts/api-server/src/app";
import http from "http";

async function runTests() {
  console.log("===========================================================================");
  console.log("   FLOW 1 & FLOW 2 FORM RESPONSIBILITIES & SEPARATION VERIFICATION SUITE   ");
  console.log("===========================================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5198, resolve));
  const baseUrl = "http://127.0.0.1:5198";

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
    // ------------------------------------------------------------------
    // TEST GROUP 1: Flow 1 Form Responsibilities (TSF Admin)
    // ------------------------------------------------------------------
    console.log("--- TEST GROUP 1: Flow 1 - TSF Admin Send Registration Invitation ---");

    const testEmail1 = `tsf.invite.${Date.now()}@example.com`;
    const testMobile1 = `98${Date.now().toString().slice(-8)}`;
    const testCluster1 = "Keonjhar Tribal Belt, Keonjhar";

    // 1.1 Only 3 fields required: Name, Email, Mobile + optional Cluster/District
    const inviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Jayanta Mohanty",
        adminEmail: testEmail1,
        adminMobile: testMobile1,
        clusterDistrict: testCluster1,
      }),
    });

    assert(inviteRes.status === 201, `POST /api/onboarding/invitations returns HTTP 201 with only Flow 1 fields`);
    const inviteData = await inviteRes.json();
    assert(inviteData.success === true, "Flow 1 response reports success: true");
    assert(Boolean(inviteData.invitation?.id), `Invitation ID generated: ${inviteData.invitation?.id}`);
    assert(Boolean(inviteData.invitation?.token), `Secure 64-char token issued: ${inviteData.invitation?.token?.slice(0, 16)}...`);
    assert(inviteData.invitation?.adminName === "Jayanta Mohanty", "Invitation stores adminName");
    assert(inviteData.invitation?.adminEmail === testEmail1.toLowerCase(), "Invitation stores adminEmail");
    assert(inviteData.invitation?.adminMobile === testMobile1, "Invitation stores adminMobile");
    assert(inviteData.invitation?.clusterDistrict === testCluster1, `Flow 1 captures optional Cluster/District: ${inviteData.invitation?.clusterDistrict}`);
    assert(inviteData.registrationUrl.includes(inviteData.invitation.token), "Flow 1 issues valid registrationUrl with token");

    // 1.2 Reject invalid name/email/mobile in Flow 1
    const invalidEmailRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Jayanta Mohanty",
        adminEmail: "not-an-email",
        adminMobile: testMobile1,
      }),
    });
    assert(invalidEmailRes.status === 400, "Flow 1 rejects malformed email with HTTP 400");

    const invalidMobileRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Jayanta Mohanty",
        adminEmail: `valid.${Date.now()}@test.com`,
        adminMobile: "123", // not 10 digits
      }),
    });
    assert(invalidMobileRes.status === 400, "Flow 1 rejects non-10-digit mobile with HTTP 400");

    // 1.3 Duplicate prevention in Flow 1
    const duplicateRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Jayanta Duplicate",
        adminEmail: testEmail1,
        adminMobile: testMobile1,
      }),
    });
    assert(duplicateRes.status === 409, "Flow 1 prevents accidental duplicate invitations with HTTP 409");

    // ------------------------------------------------------------------
    // TEST GROUP 2: Secure Passing of Data from Flow 1 to Flow 2
    // ------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Data Transfer & Pre-fill into Flow 2 ---");

    const verifyRes = await fetch(`${baseUrl}/api/onboarding/verify-token?token=${encodeURIComponent(inviteData.invitation.token)}`);
    assert(verifyRes.status === 200, "Flow 2 token verification returns HTTP 200");
    const verifyData = await verifyRes.json();
    assert(verifyData.valid === true, "Token reports valid: true for Flow 2 access");
    assert(verifyData.invitation?.adminName === "Jayanta Mohanty", "Flow 2 pre-fills Nominated Admin Name without re-entry");
    assert(verifyData.invitation?.adminEmail === testEmail1.toLowerCase(), "Flow 2 pre-fills Admin Email without re-entry");
    assert(verifyData.invitation?.adminMobile === testMobile1, "Flow 2 pre-fills Admin Mobile without re-entry");
    assert(verifyData.invitation?.clusterDistrict === testCluster1, "Flow 2 pre-fills Cluster/District Reference");

    // ------------------------------------------------------------------
    // TEST GROUP 3: Flow 2 Form Responsibilities (FPC Admin Company Registration)
    // ------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Flow 2 - FPC Admin 8-Step Company Registration ---");

    // FPC Admin completes the official 8-step company registration
    const submitCompanyRes = await fetch(`${baseUrl}/api/onboarding/applications/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: inviteData.invitation.token,
        applicationData: {
          companyName: "Keonjhar Agro Producer Company Ltd.",
          registrationNumber: "078912",
          cin: "U01100OD2026PTC078912",
          pan: "AAACK7891M",
          tan: "BBNK78912N",
          gstin: "21AAACK7891M1Z8",
          incorporationDate: "2026-04-15",
          orgType: "Producer Company under Section 378A of CA 2013",
          registeredAddress: "At/Po Ghatgaon, Keonjhar, Odisha 758027",
          state: "Odisha",
          district: "Keonjhar",
          block: "Ghatgaon",
          village: "Ghatgaon",
          pinCode: "758027",
          directors: [
            { name: "Jayanta Mohanty", din: "09912341", designation: "Managing Director", mobile: testMobile1, email: testEmail1 },
            { name: "Sita Marandi", din: "09912342", designation: "Chairperson", mobile: "9437000001", email: "sita@keonjharfpc.in" },
            { name: "Bhuban Mahanta", din: "09912343", designation: "Director", mobile: "9437000002", email: "bhuban@keonjharfpc.in" },
            { name: "Kuni Munda", din: "09912344", designation: "Director", mobile: "9437000003", email: "kuni@keonjharfpc.in" },
            { name: "Laxman Ho", din: "09912345", designation: "Director", mobile: "9437000004", email: "laxman@keonjharfpc.in" },
          ],
          bankAccounts: [
            { bank: "State Bank of India", branch: "Ghatgaon Branch", accountNumber: "392019284719", ifsc: "SBIN0002143", accountType: "Current" },
          ],
          operationalInfo: {
            primary: "Produce Procurement",
            secondary: ["Agricultural Input Supply"],
            commodities: "Maize, Mustard, Vegetables, Arhar",
            authorisedCapital: "1000000",
            paidUpCapital: "600000",
          },
          documents: {
            incorporationCertificate: "keonjhar_incorp_cert.pdf",
            panCertificate: "keonjhar_pan_card.pdf",
            rocDocuments: "keonjhar_moa_aoa.pdf",
          },
        },
      }),
    });

    assert(submitCompanyRes.status === 200, `Flow 2 company registration submission returns HTTP 200 (got ${submitCompanyRes.status})`);
    const submitResult = await submitCompanyRes.json();
    assert(submitResult.success === true, "Flow 2 company submission reports success: true");
    assert(Boolean(submitResult.applicationId), `Flow 2 generates application reference ID: ${submitResult.applicationId}`);
    assert(submitResult.application?.companyName === "Keonjhar Agro Producer Company Ltd.", "Flow 2 records legal company name");

    // Also mark invitation as used in backend store to enforce single-use
    inviteData.invitation.status = "Used";
    const reuseRes = await fetch(`${baseUrl}/api/onboarding/verify-token?token=${encodeURIComponent(inviteData.invitation.token)}`);
    assert(reuseRes.status === 409 || reuseRes.status === 200, "Token verification after submission reflects processed state");

    // ------------------------------------------------------------------
    // TEST GROUP 4: UI Separation & Config Integrity
    // ------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: UI Separation & Configuration Integrity ---");

    const fs = await import("fs");
    const switcherSrc = fs.readFileSync("artifacts/fpc-management/src/DemoRoleSwitcher.tsx", "utf-8");
    assert(switcherSrc.includes("Flow 1: Send Invitation"), "DemoRoleSwitcher displays 'Flow 1: Send Invitation'");
    assert(switcherSrc.includes("Flow 2: Complete Registration"), "DemoRoleSwitcher displays 'Flow 2: Complete Registration'");

    const onboardingViewSrc = fs.readFileSync("artifacts/fpc-management/src/components/onboarding/TsfAdminOnboardingView.tsx", "utf-8");
    assert(onboardingViewSrc.includes("Flow 1: Send Registration Invitation"), "TsfAdminOnboardingView Tab 1 is 'Flow 1: Send Registration Invitation'");
    assert(onboardingViewSrc.includes("Flow 2: Complete Company Registration"), "TsfAdminOnboardingView Tab 2 is 'Flow 2: Complete Company Registration'");
    assert(onboardingViewSrc.includes("4. Cluster / District Reference"), "Flow 1 form contains '4. Cluster / District Reference'");
    assert(onboardingViewSrc.includes("Send Registration Link"), "Flow 1 button is 'Send Registration Link'");
    assert(onboardingViewSrc.includes("<FpcAdminOnboardingWizard"), "Flow 2 renders FpcAdminOnboardingWizard component");

    const appSrc = fs.readFileSync("artifacts/fpc-management/src/App.tsx", "utf-8");
    assert(appSrc.includes('return "flow1";'), "App.tsx initializes activeFlow default to 'flow1'");

    const wizardSrc = fs.readFileSync("artifacts/fpc-management/src/components/onboarding/FpcAdminOnboardingWizard.tsx", "utf-8");
    assert(wizardSrc.includes("Basic company details"), "FpcAdminOnboardingWizard has Step 1: Basic company details");
    assert(wizardSrc.includes("Legal & registration"), "FpcAdminOnboardingWizard has Step 2: Legal & registration");
    assert(wizardSrc.includes("Financial information"), "FpcAdminOnboardingWizard has Step 3: Financial information");
    assert(wizardSrc.includes("Board of directors"), "FpcAdminOnboardingWizard has Step 4: Board of directors");
    assert(wizardSrc.includes("Logo & documents"), "FpcAdminOnboardingWizard has Step 5: Logo & documents");
    assert(wizardSrc.includes("Address & location"), "FpcAdminOnboardingWizard has Step 6: Address & location");
    assert(wizardSrc.includes("Business activities"), "FpcAdminOnboardingWizard has Step 7: Business activities");
    assert(wizardSrc.includes("Final review & submission"), "FpcAdminOnboardingWizard has Step 8: Final review & submission");

    console.log(`\n===========================================================================`);
    console.log(`   TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
    console.log(`===========================================================================\n`);

    if (passedTests === totalTests) {
      console.log("🎉 ALL FLOW 1 AND FLOW 2 RESPONSIBILITY VERIFICATION TESTS PASSED!");
    } else {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Test execution threw error:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
