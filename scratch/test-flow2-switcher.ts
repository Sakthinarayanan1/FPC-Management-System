import app from "../artifacts/api-server/src/app";
import http from "http";

async function runTests() {
  console.log("=================================================================");
  console.log("   COMPREHENSIVE FLOW 1 & FLOW 2 ONBOARDING VERIFICATION SUITE   ");
  console.log("=================================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5199, resolve));
  const baseUrl = "http://127.0.0.1:5199";

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
    // 1. SMTP Status Endpoint
    console.log("--- TEST GROUP 1: Mail Transport Status Endpoint ---");
    const statusRes = await fetch(`${baseUrl}/api/onboarding/smtp-status`);
    assert(statusRes.status === 200, "GET /api/onboarding/smtp-status returns HTTP 200");
    const statusJson = await statusRes.json();
    assert(statusJson.success === true, "smtp-status response success is true");
    assert(typeof statusJson.status?.provider === "string", `Active provider identified: ${statusJson.status?.provider}`);

    // 2. Flow 2 Invitation with Real / Ethereal Transport
    console.log("\n--- TEST GROUP 2: Flow 2 Invitation Creation & Transport Dispatch ---");
    const testEmail1 = `fpc.flow2.test.${Date.now()}@example.com`;
    const testMobile1 = `98${Date.now().toString().slice(-8)}`;
    const inviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Bishnu Charan Das",
        adminEmail: testEmail1,
        adminMobile: testMobile1,
        notes: "Barbil Agro Cluster"
      })
    });

    assert(inviteRes.status === 201, `POST /api/onboarding/invitations returns HTTP 201 (got ${inviteRes.status})`);
    const inviteData = await inviteRes.json();
    assert(inviteData.success === true, "Invite response reports success: true");
    assert(Boolean(inviteData.invitation?.id), `Invitation generated with ID: ${inviteData.invitation?.id}`);
    assert(Boolean(inviteData.invitation?.token), `Secure 64-char token issued: ${inviteData.invitation?.token?.slice(0, 16)}...`);
    assert(Boolean(inviteData.registrationUrl), `Valid registration URL issued: ${inviteData.registrationUrl}`);
    assert(inviteData.registrationUrl.includes(inviteData.invitation?.token), "Registration URL contains unique token");

    // 3. Independent Copy Link & Open Link Capability
    console.log("\n--- TEST GROUP 3: Independent Link Generation (Demo Mode / Offline SMTP) ---");
    const testEmailDemo = `fpc.demo.${Date.now()}@example.com`;
    const testMobileDemo = `97${Date.now().toString().slice(-8)}`;
    const demoInviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Prakash Tudu",
        adminEmail: testEmailDemo,
        adminMobile: testMobileDemo,
        demoMode: true,
        skipSmtp: true,
      })
    });

    assert(demoInviteRes.status === 201, `Demo invite returns HTTP 201 without requiring SMTP`);
    const demoData = await demoInviteRes.json();
    assert(demoData.success === true, "Demo invite success is true");
    assert(demoData.emailDispatched === false, "Demo invite reports emailDispatched: false (honest status)");
    assert(demoData.invitation?.status === "Link Generated (Demo Mode)", `Demo invitation has status: ${demoData.invitation?.status}`);
    assert(Boolean(demoData.registrationUrl), "Registration URL generated and ready for Copy/Open Link");

    // 4. Token Verification Endpoint (Flow 2 Self-Registration)
    console.log("\n--- TEST GROUP 4: Public Token Verification ---");
    const verifyRes = await fetch(`${baseUrl}/api/onboarding/verify-token?token=${encodeURIComponent(inviteData.invitation.token)}`);
    assert(verifyRes.status === 200, "GET /api/onboarding/verify-token returns HTTP 200 for valid token");
    const verifyData = await verifyRes.json();
    assert(verifyData.valid === true, "verify-token response returns valid: true");
    assert(verifyData.invitation?.adminName === "Bishnu Charan Das", "verify-token correctly pre-fills admin name");
    assert(verifyData.invitation?.adminEmail === testEmail1, "verify-token correctly pre-fills admin email");
    assert(verifyData.invitation?.adminMobile === testMobile1, "verify-token correctly pre-fills admin mobile");

    // 5. Duplicate Invitation Prevention
    console.log("\n--- TEST GROUP 5: Duplicate Invitation Detection ---");
    const dupRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Bishnu Duplicate",
        adminEmail: testEmail1,
        adminMobile: testMobile1,
      })
    });
    assert(dupRes.status === 409, `Duplicate invitation is rejected with HTTP 409 Conflict (got ${dupRes.status})`);
    const dupData = await dupRes.json();
    assert(dupData.canResend === true, "Duplicate response provides canResend: true");

    // 6. Resend Email Endpoint
    console.log("\n--- TEST GROUP 6: Resend Invitation Endpoint ---");
    const resendRes = await fetch(`${baseUrl}/api/onboarding/invitations/${inviteData.invitation.id}/resend`, {
      method: "POST"
    });
    assert(resendRes.status === 200, `Resend invitation returns HTTP 200 (got ${resendRes.status})`);
    const resendData = await resendRes.json();
    assert(resendData.success === true, "Resend returns success: true");
    assert(resendData.invitation?.resendCount >= 1, `Resend count incremented: ${resendData.invitation?.resendCount}`);

    // 7. Complete Registration Submission (Flow 2 Completion)
    console.log("\n--- TEST GROUP 7: FPC Admin Self-Registration Completion ---");
    const completeRes = await fetch(`${baseUrl}/api/onboarding/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: inviteData.invitation.token,
        draft: {
          basic: {
            legalName: "Barbil Agro Producer Company Limited",
            cin: "U01100OR2026PTC049988",
          },
          location: {
            state: "Odisha",
            district: "Keonjhar",
            block: "Barbil",
            village: "Barbil",
          },
          directors: [
            { name: "Bishnu Charan Das", designation: "Managing Director" }
          ]
        }
      })
    });
    assert(completeRes.status === 200, `Complete registration returns HTTP 200 (got ${completeRes.status})`);
    const completeData = await completeRes.json();
    assert(completeData.success === true, "Registration completion reported success: true");

    // 8. Single-Use Token Invalidation
    console.log("\n--- TEST GROUP 8: Single-Use Token Invalidation ---");
    const reusedVerifyRes = await fetch(`${baseUrl}/api/onboarding/verify-token?token=${encodeURIComponent(inviteData.invitation.token)}`);
    assert(reusedVerifyRes.status === 409, `Reusing completed token returns HTTP 409 Conflict (got ${reusedVerifyRes.status})`);
    const reusedData = await reusedVerifyRes.json();
    assert(reusedData.alreadyUsed === true, "verify-token confirms token is alreadyUsed");

    console.log("\n=================================================================");
    console.log(`ALL VERIFICATION TESTS COMPLETED: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
    console.log("=================================================================");

  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
