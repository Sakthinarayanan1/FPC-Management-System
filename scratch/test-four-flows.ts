import assert from "node:assert";
import http from "node:http";
import app from "../artifacts/api-server/src/app";

function makeRequest(
  server: http.Server,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<{ status: number; headers: http.IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === "string") {
      return reject(new Error("Server address not available"));
    }

    const payload = options.body ? JSON.stringify(options.body) : undefined;
    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        host: "127.0.0.1",
        port: addr.port,
        path: options.path,
        method: options.method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode || 500, headers: res.headers, data });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log("==========================================================");
  console.log("  FOUR-FLOW ARCHITECTURE VERIFICATION TEST SUITE");
  console.log("==========================================================");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as any).port;
  console.log(`[TEST-RUNNER] In-memory test server listening on 127.0.0.1:${port}\n`);

  try {
    // -------------------------------------------------------------
    // FLOW 1: TSF ADMIN LOGIN
    // -------------------------------------------------------------
    console.log(">>> FLOW 1: Testing TSF Admin Login...");

    // Test 1.1: Invalid credentials
    const badLogin = await makeRequest(server, {
      method: "POST",
      path: "/api/auth/tsf/login",
      body: { username: "tsfadmin", password: "WrongPassword!999" },
    });
    assert.strictEqual(badLogin.status, 401, "Invalid password should return 401");
    assert.strictEqual(badLogin.data.success, false);
    console.log("  ✓ 1.1: Rejected invalid TSF credentials with 401");

    // Test 1.2: Valid TSF login
    const goodLogin = await makeRequest(server, {
      method: "POST",
      path: "/api/auth/tsf/login",
      body: { username: "tsfadmin", password: process.env.TSF_ADMIN_PASSWORD || "TataSteel@2026" },
    });
    assert.strictEqual(goodLogin.status, 200, "Valid TSF credentials should return 200");
    assert.strictEqual(goodLogin.data.success, true);
    assert.strictEqual(goodLogin.data.user.role, "TSF Central Admin");
    const tsfToken = goodLogin.data.token;
    assert.ok(tsfToken, "Session token must be issued");
    console.log(`  ✓ 1.2: Successful TSF Admin login, issued token (${tsfToken.slice(0, 16)}...)`);

    // Test 1.3: Verify TSF session via /api/auth/tsf/me
    const meTsf = await makeRequest(server, {
      method: "GET",
      path: "/api/auth/tsf/me",
      headers: { Authorization: `Bearer ${tsfToken}` },
    });
    assert.strictEqual(meTsf.status, 200);
    assert.strictEqual(meTsf.data.user.username, "tsfadmin");
    console.log("  ✓ 1.3: Authenticated TSF session verified via /api/auth/tsf/me");

    // -------------------------------------------------------------
    // FLOW 2: FPC INVITATION MANAGEMENT
    // -------------------------------------------------------------
    console.log("\n>>> FLOW 2: Testing FPC Invitation Management...");

    const testFpcName = `Kalinganagar Agro FPC ${Date.now().toString().slice(-4)}`;
    const testAdminEmail = `admin.${Date.now().toString().slice(-4)}@kalinganagar-fpc.in`;

    // Test 2.1: Missing required fields
    const invalidInv = await makeRequest(server, {
      method: "POST",
      path: "/api/onboarding/invitations",
      body: { adminName: "Test" },
    });
    assert.strictEqual(invalidInv.status, 400, "Missing fields must return 400");
    console.log("  ✓ 2.1: Missing invitation fields rejected with 400");

    // Test 2.2: Create new valid invitation
    const createInv = await makeRequest(server, {
      method: "POST",
      path: "/api/onboarding/invitations",
      body: {
        fpcName: testFpcName,
        adminName: "Subhashree Jena",
        adminEmail: testAdminEmail,
        adminMobile: "9437890123",
        notes: "Jajpur Cluster · Organic Veg",
      },
    });
    assert.strictEqual(createInv.status, 201, "Valid invitation creation should return 201");
    assert.strictEqual(createInv.data.success, true);
    assert.strictEqual(createInv.data.invitation.fpcName, testFpcName);
    assert.strictEqual(createInv.data.invitation.status, "Pending");
    const invitationToken = createInv.data.invitation.token;
    assert.ok(invitationToken, "Invitation token must be present");
    assert.ok(createInv.data.activationUrl.includes(invitationToken), "Activation URL must contain token");
    console.log(`  ✓ 2.2: Created invitation for '${testFpcName}' with token (${invitationToken.slice(0, 16)}...)`);

    // Test 2.3: Prevent duplicate invitation for same FPC
    const duplicateInv = await makeRequest(server, {
      method: "POST",
      path: "/api/onboarding/invitations",
      body: {
        fpcName: testFpcName,
        adminName: "Different Admin",
        adminEmail: "different@kalinganagar-fpc.in",
        adminMobile: "9437999999",
      },
    });
    assert.strictEqual(duplicateInv.status, 409, "Duplicate FPC invitation must return 409 Conflict");
    console.log("  ✓ 2.3: Duplicate invitation for existing FPC prevented with 409 Conflict");

    // Test 2.4: Query invitations and track statuses
    const listInvs = await makeRequest(server, {
      method: "GET",
      path: "/api/onboarding/invitations",
    });
    assert.strictEqual(listInvs.status, 200);
    assert.ok(Array.isArray(listInvs.data.invitations), "Invitations must be an array");
    const foundInv = listInvs.data.invitations.find((i: any) => i.token === invitationToken);
    assert.ok(foundInv, "Newly created invitation must appear in invitation list");
    assert.strictEqual(foundInv.status, "Pending");
    console.log(`  ✓ 2.4: Invitation list retrieved, total ${listInvs.data.invitations.length} invitations tracked with Pending status`);

    // -------------------------------------------------------------
    // FLOW 3: FPC ADMIN LOGIN & ACCOUNT ACTIVATION
    // -------------------------------------------------------------
    console.log("\n>>> FLOW 3: Testing FPC Admin Activation & Login...");

    // Test 3.1: Verify invitation and lock invited email
    const verifyInv = await makeRequest(server, {
      method: "GET",
      path: `/api/auth/fpc/verify-invitation?token=${encodeURIComponent(invitationToken)}`,
    });
    assert.strictEqual(verifyInv.status, 200, "Token verification should return 200");
    assert.strictEqual(verifyInv.data.valid, true);
    assert.strictEqual(verifyInv.data.invitation.adminEmail, testAdminEmail, "Invited email must match exactly and be locked");
    assert.strictEqual(verifyInv.data.invitation.fpcName, testFpcName);
    console.log(`  ✓ 3.1: Token verified. Retrieved locked email: '${testAdminEmail}'`);

    // Test 3.2: Password length validation
    const shortPw = await makeRequest(server, {
      method: "POST",
      path: "/api/auth/fpc/activate",
      body: {
        token: invitationToken,
        password: "short",
        confirmPassword: "short",
      },
    });
    assert.strictEqual(shortPw.status, 400, "Password under 8 characters must return 400");
    console.log("  ✓ 3.2: Password under 8 characters rejected with 400");

    // Test 3.3: Activate account with secure password
    const newPassword = "SecureFpcPassword@2026";
    const activateRes = await makeRequest(server, {
      method: "POST",
      path: "/api/auth/fpc/activate",
      body: {
        token: invitationToken,
        password: newPassword,
        confirmPassword: newPassword,
      },
    });
    assert.strictEqual(activateRes.status, 200, "Activation must return 200");
    assert.strictEqual(activateRes.data.success, true);
    assert.strictEqual(activateRes.data.user.role, "FPC Admin / Manager");
    assert.strictEqual(activateRes.data.user.email, testAdminEmail);
    const assignedFpcId = activateRes.data.user.fpcId;
    const fpcSessionToken = activateRes.data.token;
    assert.ok(assignedFpcId, "FPC ID must be assigned");
    assert.ok(fpcSessionToken, "Session token must be issued upon activation");
    console.log(`  ✓ 3.3: Account successfully activated! Assigned FPC ID: '${assignedFpcId}', session token issued`);

    // Test 3.4: Verify invitation status transitioned to Accepted
    const recheckInv = await makeRequest(server, {
      method: "GET",
      path: "/api/onboarding/invitations",
    });
    const updatedInv = recheckInv.data.invitations.find((i: any) => i.token === invitationToken);
    assert.strictEqual(updatedInv?.status, "Accepted", "Invitation status must update to Accepted");
    console.log("  ✓ 3.4: Invitation status dynamically transitioned to 'Accepted'");

    // Test 3.5: Subsequent login via /api/auth/fpc/login
    const fpcLogin = await makeRequest(server, {
      method: "POST",
      path: "/api/auth/fpc/login",
      body: {
        email: testAdminEmail,
        password: newPassword,
      },
    });
    assert.strictEqual(fpcLogin.status, 200, "Subsequent FPC login must return 200");
    assert.strictEqual(fpcLogin.data.success, true);
    assert.strictEqual(fpcLogin.data.user.email, testAdminEmail);
    console.log("  ✓ 3.5: Subsequent FPC login with email and password verified");

    // Test 3.6: Multi-tenant data isolation verification
    // Accessing own FPC ID should be permitted (200)
    const ownAccess = await makeRequest(server, {
      method: "GET",
      path: `/api/auth/verify-access/${assignedFpcId}`,
      headers: { Authorization: `Bearer ${fpcSessionToken}` },
    });
    assert.strictEqual(ownAccess.status, 200, "FPC Admin must have access to their own FPC");
    console.log(`  ✓ 3.6a: Access granted to own tenant '${assignedFpcId}'`);

    // Accessing another FPC ID (e.g. FPC-OTHER-999) must be blocked (403 Forbidden)
    const foreignAccess = await makeRequest(server, {
      method: "GET",
      path: "/api/auth/verify-access/FPC-OTHER-999",
      headers: { Authorization: `Bearer ${fpcSessionToken}` },
    });
    assert.strictEqual(foreignAccess.status, 403, "FPC Admin MUST NOT access another FPC's tenant data");
    console.log("  ✓ 3.6b: Strict data isolation enforced: access to foreign tenant blocked with 403 Forbidden");

    // -------------------------------------------------------------
    // FLOW 4: EXISTING FPC ONBOARDING
    // -------------------------------------------------------------
    console.log("\n>>> FLOW 4: Testing FPC Onboarding Completion...");

    // Test 4.1: Verify onboarding token
    const verifyOnboardToken = await makeRequest(server, {
      method: "GET",
      path: `/api/onboarding/verify-token?token=${encodeURIComponent(invitationToken)}`,
    });
    assert.strictEqual(verifyOnboardToken.status, 200);
    assert.strictEqual(verifyOnboardToken.data.valid, true);
    console.log("  ✓ 4.1: Onboarding wizard token verification confirmed");

    // Test 4.2: Complete registration submission
    const completeRes = await makeRequest(server, {
      method: "POST",
      path: "/api/onboarding/complete",
      body: {
        token: invitationToken,
        companyRecord: {
          id: assignedFpcId,
          fpcId: assignedFpcId,
          name: testFpcName,
          status: "Submitted",
        },
        draft: {
          basic: { legalName: testFpcName },
          admin: { email: testAdminEmail },
        },
      },
    });
    assert.strictEqual(completeRes.status, 200, "Registration submission should return 200");
    assert.strictEqual(completeRes.data.success, true);
    console.log("  ✓ 4.2: 8-Step company onboarding submitted successfully");

    // Test 4.3: Single-use link protection: token cannot be reused
    const reuseAttempt = await makeRequest(server, {
      method: "GET",
      path: `/api/onboarding/verify-token?token=${encodeURIComponent(invitationToken)}`,
    });
    assert.strictEqual(reuseAttempt.status, 409, "Used invitation link must return 409 Conflict");
    assert.strictEqual(reuseAttempt.data.alreadyUsed, true);
    console.log("  ✓ 4.3: Single-use invitation link protection confirmed (re-attempt returned 409 already used)");

    console.log("\n==========================================================");
    console.log("  ALL FOUR FLOWS SUCCESSFULLY VERIFIED! (15/15 tests passed)");
    console.log("==========================================================");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});

