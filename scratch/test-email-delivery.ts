import app from "../artifacts/api-server/src/app";
import {
  dispatchEmail,
  getSmtpStatus,
  verifySmtpConnection,
  resetTransporter,
  getOutbox,
} from "../artifacts/api-server/src/lib/emailService";
import { loadEnv } from "../artifacts/api-server/src/lib/env";
import type { Server } from "http";

async function runTests() {
  console.log("=================================================================");
  console.log("   COMPREHENSIVE EMAIL DELIVERY & SMTP FIX TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`, detail || "");
      failed++;
    }
  }

  // TEST 1: Environment Loader Verification
  console.log("--- TEST GROUP 1: Environment Variable Loader ---");
  const envResult = loadEnv();
  assert(typeof envResult === "object", "loadEnv() returns diagnostic result object");
  console.log(`Environment loader status: loaded=${envResult.loaded}, path=${envResult.envPath || "none"}`);

  // TEST 2: Gmail SMTP Configuration & Password Sanitization
  console.log("\n--- TEST GROUP 2: Gmail SMTP App Password Sanitization ---");
  // Test password with spaces (typical Google App Password format: "abcd efgh ijkl mnop")
  process.env.SMTP_HOST = "smtp.gmail.com";
  process.env.SMTP_PORT = "465";
  process.env.SMTP_USER = "test.fpc.admin@gmail.com";
  process.env.SMTP_PASS = "abcd efgh ijkl mnop";
  resetTransporter();

  const gmailStatus = getSmtpStatus();
  assert(gmailStatus.provider === "gmail", "Provider correctly identified as 'gmail'");
  assert(gmailStatus.port === 465, "Gmail port correctly set to 465");
  assert(gmailStatus.secure === true, "Gmail on port 465 has secure=true");
  assert(gmailStatus.senderAddress.includes("test.fpc.admin@gmail.com"), `Smart sender address uses authenticated Gmail address: ${gmailStatus.senderAddress}`);
  assert(gmailStatus.userConfigured === true, "userConfigured is true");
  assert(gmailStatus.passConfigured === true, "passConfigured is true");

  // TEST 3: Gmail Port 587 Mode
  console.log("\n--- TEST GROUP 3: Gmail Port 587 STARTTLS Mode ---");
  process.env.SMTP_PORT = "587";
  delete process.env.SMTP_SECURE;
  resetTransporter();
  const gmail587Status = getSmtpStatus();
  assert(gmail587Status.port === 587, "Port set to 587");
  assert(gmail587Status.secure === false, "Port 587 defaults to secure=false (STARTTLS)");

  // TEST 4: Generic SMTP Provider (Resend / SendGrid / Custom)
  console.log("\n--- TEST GROUP 4: Generic SMTP Provider Configuration ---");
  process.env.SMTP_HOST = "smtp.resend.com";
  process.env.SMTP_PORT = "465";
  process.env.SMTP_USER = "resend";
  process.env.SMTP_PASS = "re_test_key_12345";
  process.env.EMAIL_FROM = "Tata Steel Foundation <onboarding@verifieddomain.org>";
  resetTransporter();

  const resendStatus = getSmtpStatus();
  assert(resendStatus.provider === "smtp", "Provider correctly identified as 'smtp'");
  assert(resendStatus.host === "smtp.resend.com", "Host correctly set to 'smtp.resend.com'");
  assert(resendStatus.senderAddress === "Tata Steel Foundation <onboarding@verifieddomain.org>", "Explicit EMAIL_FROM honored for custom SMTP");

  // TEST 5: Ethereal Test SMTP Fallback (Local Development Mode)
  console.log("\n--- TEST GROUP 5: Ethereal Test SMTP Real Local Transport ---");
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.EMAIL_FROM;
  resetTransporter();

  const etherealStatus = getSmtpStatus();
  assert(etherealStatus.provider === "ethereal", "Defaults to 'ethereal' when no credentials in environment");
  assert(etherealStatus.configured === false, "configured flag is false (indicates development fallback)");

  // TEST 6: Real Live SMTP Dispatch via Ethereal Provider
  console.log("\n--- TEST GROUP 6: Live SMTP Provider Verification ---");
  const testRecipient = `fpc.verifier.${Date.now()}@example.com`;
  const dispatchResult = await dispatchEmail({
    to: testRecipient,
    subject: "SMTP Verification Test | TSF FPC System",
    html: "<p>Real SMTP transport verification email.</p>",
    text: "Real SMTP transport verification email.",
    category: "invitation",
  });

  assert(dispatchResult.status === "Sent", "Email dispatch status is 'Sent'");
  assert(Boolean(dispatchResult.providerMessageId), `Real message ID issued: ${dispatchResult.providerMessageId}`);
  assert(Boolean(dispatchResult.previewUrl), `Real preview URL issued: ${dispatchResult.previewUrl}`);
  console.log(`[INFO] Live Email Preview URL: ${dispatchResult.previewUrl}`);

  // TEST 7: Start Server and Test Diagnostics & Delivery APIs
  console.log("\n--- TEST GROUP 7: HTTP API Endpoints with Real Transport ---");
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 5000;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 7A: GET /api/onboarding/smtp-status
    const statusRes = await fetch(`${baseUrl}/api/onboarding/smtp-status`);
    const statusJson = await statusRes.json();
    assert(statusRes.status === 200, "GET /api/onboarding/smtp-status returns HTTP 200");
    assert(statusJson.success === true, "smtp-status response has success: true");
    assert(Boolean(statusJson.status?.provider), `smtp-status reports active provider: ${statusJson.status?.provider}`);

    // 7B: POST /api/onboarding/invitations (Flow 1 with real dispatch)
    const uniqueMobile = `98${String(Date.now()).slice(-8)}`;
    const inviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Subhashree Pradhan",
        adminEmail: `subhashree.${Date.now()}@tatasteelfoundation.org`,
        adminMobile: uniqueMobile,
        notes: "Real SMTP integration verification",
      }),
    });
    const inviteJson = await inviteRes.json();
    assert(inviteRes.status === 201, `POST /api/onboarding/invitations returns HTTP 201 (got ${inviteRes.status})`);
    assert(inviteJson.success === true, "Response reports success: true");
    assert(Boolean(inviteJson.invitation?.token), "Invitation contains secure single-use token");
    assert(Boolean(inviteJson.emailMessageId), `Returned emailMessageId: ${inviteJson.emailMessageId}`);

    const invitationId = inviteJson.invitation.id;

    // 7C: POST /api/onboarding/invitations/:id/resend (Controlled Resend)
    const resendRes = await fetch(`${baseUrl}/api/onboarding/invitations/${encodeURIComponent(invitationId)}/resend`, {
      method: "POST",
    });
    const resendJson = await resendRes.json();
    assert(resendRes.status === 200, `POST resend returns HTTP 200 (got ${resendRes.status})`);
    assert(resendJson.success === true, "Resend reports success: true");
    assert(resendJson.invitation.resendCount === 1, "resendCount incremented to 1");

    // 7D: Error Handling & No False Delivery Confirmation
    console.log("\n--- TEST GROUP 8: Error Transparency & No False Success ---");
    // Configure invalid SMTP credentials to simulate delivery failure
    process.env.SMTP_HOST = "smtp.invalid-domain-that-does-not-exist-12345.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "fake-user";
    process.env.SMTP_PASS = "fake-pass";
    resetTransporter();

    const uniqueFailMobile = `96${String(Date.now()).slice(-8)}`;
    const failInviteRes = await fetch(`${baseUrl}/api/onboarding/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminName: "Manoj Soren",
        adminEmail: `manoj.fail.${Date.now()}@tatasteelfoundation.org`,
        adminMobile: uniqueFailMobile,
      }),
    });
    const failInviteJson = await failInviteRes.json();
    assert(failInviteRes.status === 502, `Delivery failure returns HTTP 502 Bad Gateway (got ${failInviteRes.status})`);
    assert(failInviteJson.success === false, "Response strictly reports success: false on transport failure");
    assert(failInviteJson.error.includes("SMTP Host Not Found") || failInviteJson.error.includes("Failed to deliver"), `Detailed diagnostic error returned: ${failInviteJson.error}`);
    assert(!failInviteJson.invitation, "No invitation or false confirmation returned when transport fails");

    // Reset back to Ethereal
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    resetTransporter();

    console.log("\n=================================================================");
    console.log(`ALL EMAIL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
