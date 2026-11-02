import app from "../artifacts/api-server/src/app";
import http from "http";

const server = http.createServer(app);

server.listen(0, async () => {
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. TSF Central Admin should be rejected with 403 Forbidden
  await test("Reject survey response submission for TSF Central Admin with 403", async () => {
    const res = await fetch(`${baseUrl}/surveys/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "TSF Central Admin",
        "x-user-fpc-id": "ALL"
      },
      body: JSON.stringify({
        farmerName: "Test Farmer",
        fpcId: "FPC-ODI-001"
      })
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
    if (data.code !== "TSF_CENTRAL_ADMIN_READ_ONLY") throw new Error(`Unexpected error code ${data.code}`);
  });

  // 2. TSF Central Admin should be rejected when creating surveys with 403
  await test("Reject survey creation for TSF Central Admin with 403", async () => {
    const res = await fetch(`${baseUrl}/surveys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "TSF Central Admin"
      },
      body: JSON.stringify({
        title: "Test Survey Campaign",
        fpcId: "FPC-ODI-001"
      })
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
  });

  // 3. FPC Admin cross-FPC submission should be rejected with 403
  await test("Reject cross-FPC submission for FPC Admin with 403", async () => {
    const res = await fetch(`${baseUrl}/surveys/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "FPC Admin / Manager",
        "x-user-fpc-id": "FPC-ODI-001"
      },
      body: JSON.stringify({
        farmerName: "Cross-FPC Farmer",
        fpcId: "FPC-JHK-002"
      })
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected status 403, got ${res.status}`);
    if (data.code !== "FPC_SCOPE_MISMATCH") throw new Error(`Unexpected error code: ${data.code}`);
  });

  // 4. FPC Admin submission for assigned FPC should succeed with 201
  await test("Accept survey submission for FPC Admin on assigned FPC with 201", async () => {
    const res = await fetch(`${baseUrl}/surveys/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "FPC Admin / Manager",
        "x-user-fpc-id": "FPC-ODI-001"
      },
      body: JSON.stringify({
        farmerName: "Birsa Soren",
        fpcId: "FPC-ODI-001",
        totalLandAcre: 2.6
      })
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}`);
    if (!data.success) throw new Error(`Expected success true`);
  });

  // 5. GET /surveys should succeed with 200 (Read-Only monitoring access)
  await test("Allow read-only GET /surveys with 200", async () => {
    const res = await fetch(`${baseUrl}/surveys`);
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!Array.isArray(data.data)) throw new Error(`Expected array of surveys`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  server.close(() => {
    process.exit(failed > 0 ? 1 : 0);
  });
});

