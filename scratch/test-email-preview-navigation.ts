import fs from "fs";
import path from "path";

function runTests() {
  console.log("=== Testing FPC Email Invitation Preview Navigation Flow ===\n");

  const coordinatorPath = path.resolve("artifacts/fpc-management/src/components/onboarding/OnboardingWorkflowCoordinator.tsx");
  const screen3Path = path.resolve("artifacts/fpc-management/src/components/onboarding/Screen3EmailPreview.tsx");
  const screen4Path = path.resolve("artifacts/fpc-management/src/components/onboarding/Screen4FpcAdminLogin.tsx");

  const coordinatorSrc = fs.readFileSync(coordinatorPath, "utf-8");
  const screen3Src = fs.readFileSync(screen3Path, "utf-8");
  const screen4Src = fs.readFileSync(screen4Path, "utf-8");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
    }
  }

  // 1. Screen 3 buttons
  assert(
    screen3Src.includes("Accept Invitation & Complete Registration") ||
    screen3Src.includes("Accept Invitation &amp; Complete Registration"),
    "Screen 3 has 'Accept Invitation & Complete Registration' button"
  );
  assert(
    screen3Src.includes("Back to Edit"),
    "Screen 3 has 'Back to Edit' button"
  );
  assert(
    !screen3Src.includes("Copy Registration Link") && !screen3Src.includes("Confirm & Continue"),
    "Screen 3 removed 'Copy Registration Link' and 'Confirm & Continue' buttons"
  );

  // 2. Navigation from Screen 3 to Screen 4 (not Screen 5)
  assert(
    coordinatorSrc.includes("handleScreen3Accept") &&
    coordinatorSrc.includes("setCurrentScreen(4)"),
    "Accept Invitation triggers navigation to Screen 4 (FPC Admin Login), not Screen 5"
  );

  // 3. Screen 4 receives and pre-populates nominated admin email
  assert(
    coordinatorSrc.includes("initialEmail={session.adminEmail}") &&
    coordinatorSrc.includes("companyName={session.companyName}"),
    "Screen 4 receives nominated administrator's email and company name from session"
  );
  assert(
    screen4Src.includes("initialEmail") &&
    screen4Src.includes("setEmail(initialEmail)"),
    "Screen 4 syncs and pre-populates email state from session initialEmail"
  );

  // 4. Successful login in Screen 4 redirects to Screen 5 with FPC Admin role & permissions
  assert(
    coordinatorSrc.includes('role: "FPC Admin / Manager"') &&
    coordinatorSrc.includes('invitationToken: session.token') &&
    coordinatorSrc.includes("setCurrentScreen(5)"),
    "Screen 4 login success assigns 'FPC Admin / Manager' role, sets currentUser with invitationToken, and redirects to Screen 5"
  );

  // 5. Screen 5 receives preserved session and token
  assert(
    coordinatorSrc.includes("token={session.token}") &&
    coordinatorSrc.includes("initialSessionData={{") &&
    coordinatorSrc.includes("companyName: session.companyName,") &&
    coordinatorSrc.includes("adminEmail: session.adminEmail,"),
    "Screen 5 (Wizard) receives preserved session data (company, admin details, token)"
  );

  // 6. Security guard prevents unauthorized access to Screen 5
  assert(
    coordinatorSrc.includes('if (currentScreen === 5)') &&
    coordinatorSrc.includes('if (state.role !== "FPC Admin / Manager")') &&
    coordinatorSrc.includes("<Screen4FpcAdminLogin"),
    "Guard prevents unauthorized access to Screen 5 without FPC Admin authentication"
  );

  // 7. Initial URL / token route directs to Screen 4 for authentication
  assert(
    coordinatorSrc.includes('if (token || path.includes("/onboard/register") || path.includes("/onboard/activate"))') &&
    coordinatorSrc.includes("return 4;"),
    "Direct token link or /onboard/register URL directs to Screen 4 (Login) first"
  );

  console.log(`\nResults: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();

