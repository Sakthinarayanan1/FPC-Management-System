import app from "../artifacts/api-server/src/app";
import { dispatchEmail, getOutbox } from "../artifacts/api-server/src/lib/emailService";
import type { Server } from "http";

async function runTests() {
  console.log("=================================================");
  console.log("TWO-FLOW FPC ONBOARDING WITH REAL EMAIL TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`, detail || "");
      failed++;
    }
  }

  // Start temporary server
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 5000;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Real Nodemailer Transport Delivery Verification
    // -------------------------------------------------------------
    console.log("--- TEST 1: Real Email Provider Transport ---");
    const testLog = await dispatchEmail({
      to: "test.admin@tatasteelfoundation.org",
      subject: "Test Real Email Delivery | TSF FPC System",
      html: "<p>Real email integration test</p>",
      text: "Real email integration test",
      category: "invitation",
    });

    assert(testLog.status === "Sent", "Email transport status is 'Sent'", testLog);
    assert(Boolean(testLog.providerMessageId), `Real message ID issued: ${testLog.providerMessageId}`);
    if (testLog.previewUrl) {
      console.log(`[INFO] Mail Preview URL: ${testLog.previewUrl}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Flow 1 — TSF Admin Sends Email Invitation (3 Fields)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Flow 1 — Initiate Invitation API ---");
    const testEmail = `new.fpc.admin.${Date.now()}@tatasteelfoundation.org`;
    const testMobile = "9876543210";

    const inviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Jayanta Mohapatra",
        adminEmail: testEmail,
        adminMobile: testMobile,
      }),
    });

    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 201, "POST /api/onboarding/invitations returned 201 Created", inviteData);
    assert(inviteData.success === true, "Response indicated success: true");
    assert(Boolean(inviteData.invitation?.token), `Invitation token generated: ${inviteData.invitation?.token}`);
    assert(inviteData.invitation?.adminName === "Jayanta Mohapatra", "FPC Admin Name saved correctly");
    assert(inviteData.invitation?.adminEmail === testEmail, "FPC Admin Email saved correctly");
    assert(Boolean(inviteData.registrationUrl), `Registration link returned: ${inviteData.registrationUrl}`);

    const issuedToken = inviteData.invitation.token;
    const invitationId = inviteData.invitation.id;

    // -------------------------------------------------------------
    // TEST 3: Duplicate Invitation Protection
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Duplicate Invitation Protection ---");
    const dupRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Jayanta Mohapatra",
        adminEmail: testEmail,
        adminMobile: testMobile,
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, "Duplicate email rejected with 409 Conflict", dupData);
    assert(dupData.canResend === true, "Provides controlled canResend flag");

    // -------------------------------------------------------------
    // TEST 4: Controlled Invitation Resend
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Controlled Invitation Resend ---");
    const resendRes = await fetch(`${baseUrl}/api/onboarding/invitations/${encodeURIComponent(invitationId)}/resend`, {
      method: "POST",
    });
    const resendData = await resendRes.json();
    assert(resendRes.status === 200, "Resend returned 200 OK", resendData);
    assert(resendData.invitation.resendCount === 1, "resendCount incremented to 1");

    // -------------------------------------------------------------
    // TEST 5: Flow 2 — Validate Token on Link Access
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Flow 2 — Token Verification ---");
    const verifyRes = await fetch(`${baseUrl}/api/onboarding/verify-token?token=${encodeURIComponent(issuedToken)}`);
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, "Verify token returned 200 OK", verifyData);
    assert(verifyData.valid === true, "Token validity is true");
    assert(verifyData.invitation.adminName === "Jayanta Mohapatra", "Pre-fills Admin Name");
    assert(verifyData.invitation.adminEmail === testEmail, "Pre-fills Admin Email");

    // -------------------------------------------------------------
    // TEST 6: Flow 2 — Registration Completion & Single-Use Lock
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Flow 2 — Complete Registration ---");
    const completeRes = await fetch(`${baseUrl}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: issuedToken,
        companyRecord: {
          name: "Maa Tarini Agro Farmer Producer Company Ltd.",
        },
        draft: {
          basic: {
            legalName: "Maa Tarini Agro Farmer Producer Company Ltd.",
            cin: "U01100OD2026PTC049999",
            incorporationDate: "2026-01-15",
          },
          location: {
            state: "Odisha",
            district: "Keonjhar",
          },
        },
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 200, "Registration complete returned 200 OK", completeData);
    assert(completeData.success === true, "Completion reported success: true");

    // -------------------------------------------------------------
    // TEST 7: Single-Use Validation (Re-accessing Used Token)
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Single-Use Validation ---");
    const reVerifyRes = await fetch(`${baseUrl}/api/onboarding/verify-token?token=${encodeURIComponent(issuedToken)}`);
    const reVerifyData = await reVerifyRes.json();
    assert(reVerifyRes.status === 409, "Used invitation blocked with 409 Conflict", reVerifyData);
    assert(reVerifyData.alreadyUsed === true, "Indicates alreadyUsed: true");

  } finally {
    server.close();
  }

  console.log("\n=================================================");
  console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Unhandled test runner exception:", err);
  process.exit(1);
});

