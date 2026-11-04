import { FEATURE_FLAGS, moduleConfig, getActiveDemoRoles, isRouteAllowed, isNavigationNodeEnabled } from "../artifacts/fpc-management/src/lib/moduleConfig";
import { getRoleNavigation, navigationConfig } from "../artifacts/fpc-management/src/components/navigation/navConfig";
import { roles } from "../artifacts/fpc-management/src/lib/config";
import fs from "fs";
import path from "path";

async function runTests() {
  console.log("=================================================================");
  console.log("   TWO-FLOW TEMPORARY MODE & FUTURE REACTIVATION TEST SUITE");
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

  // TEST 1: Feature Flag Configuration
  console.log("--- TEST GROUP 1: Centralized Feature Configuration ---");
  assert(FEATURE_FLAGS.twoFlowModeOnly === true, "FEATURE_FLAGS.twoFlowModeOnly is set to true");
  assert(FEATURE_FLAGS.fpcInvitation === true, "FEATURE_FLAGS.fpcInvitation is true (Flow 1 Active)");
  assert(FEATURE_FLAGS.fpcCompanyOnboarding === true, "FEATURE_FLAGS.fpcCompanyOnboarding is true (Flow 2 Active)");
  assert(FEATURE_FLAGS.farmerManagement === false, "FEATURE_FLAGS.farmerManagement is false (temporarily disabled)");
  assert(FEATURE_FLAGS.shareholderManagement === false, "FEATURE_FLAGS.shareholderManagement is false (temporarily disabled)");
  assert(FEATURE_FLAGS.agriBusiness === false, "FEATURE_FLAGS.agriBusiness is false (temporarily disabled)");
  assert(FEATURE_FLAGS.inventory === false, "FEATURE_FLAGS.inventory is false (temporarily disabled)");
  assert(FEATURE_FLAGS.finance === false, "FEATURE_FLAGS.finance is false (temporarily disabled)");
  assert(FEATURE_FLAGS.compliance === false, "FEATURE_FLAGS.compliance is false (temporarily disabled)");
  assert(FEATURE_FLAGS.reportsAnalytics === false, "FEATURE_FLAGS.reportsAnalytics is false (temporarily disabled)");
  assert(FEATURE_FLAGS.administration === false, "FEATURE_FLAGS.administration is false (temporarily disabled)");

  // TEST 2: Demo Role Filter
  console.log("\n--- TEST GROUP 2: Demo Role Filter ---");
  const activeRoles = getActiveDemoRoles(roles);
  console.log(`Active roles in Two-Flow mode: ${JSON.stringify(activeRoles)}`);
  assert(activeRoles.length === 1 && activeRoles[0] === "TSF Central Admin", "getActiveDemoRoles returns ONLY ['TSF Central Admin']");

  // TEST 3: Navigation Tree Trimming
  console.log("\n--- TEST GROUP 3: TSF Admin Navigation Tree Trimming ---");
  const tsfNav = getRoleNavigation("TSF Central Admin");
  console.log(`TSF Admin top-level groups: ${tsfNav.map(n => `${n.label} (${n.id})`).join(", ")}`);
  assert(tsfNav.length === 1, `TSF Admin navigation has strictly 1 top-level group (got ${tsfNav.length})`);
  assert(tsfNav[0].id === "fpc-management", "Active group is 'fpc-management'");
  
  const children = tsfNav[0].children || [];
  console.log(`Children in 'fpc-management': ${children.map(c => `${c.label} -> ${c.route}`).join(", ")}`);
  assert(children.length === 1, `Exactly 1 child in fpc-management group (got ${children.length})`);
  assert(children[0].label === "Onboard New FPC", "Child label is 'Onboard New FPC'");
  assert(children[0].route === "/fpc-management/onboard", "Child route is '/fpc-management/onboard'");

  // Verify all disabled modules are omitted from navigation
  const omittedIds = [
    "tsf-dashboard", "network-dashboard", "network-analytics", "fpc-list",
    "network-monitoring", "farmer-monitoring", "shareholder-monitoring",
    "buyer-monitoring", "supplier-monitoring", "user-monitoring", "survey-monitoring",
    "business-monitoring", "procurement-monitoring", "sales-monitoring",
    "stock-monitoring", "monitoring-checklist", "financial-monitoring",
    "consolidated-finance", "farmer-settlements-mon", "buyer-receivables-mon",
    "supplier-payables-mon", "financial-performance", "mis-reports"
  ];
  const allFlattenedIds: string[] = [];
  function gatherIds(nodes: readonly any[]) {
    for (const n of nodes) {
      allFlattenedIds.push(n.id);
      if (n.children) gatherIds(n.children);
    }
  }
  gatherIds(tsfNav);
  const foundOmitted = omittedIds.filter(id => allFlattenedIds.includes(id));
  assert(foundOmitted.length === 0, `Zero disabled modules in navigation tree (found: ${foundOmitted.join(", ") || "none"})`);

  // TEST 4: Navigation Node Guards
  console.log("\n--- TEST GROUP 4: Navigation Node Enabled Checks ---");
  assert(isNavigationNodeEnabled({ id: "onboard-fpc", label: "Onboard New FPC", route: "/fpc-management/onboard" }) === true, "Onboard New FPC node is ENABLED");
  assert(isNavigationNodeEnabled({ id: "farmers-all", label: "All Farmers", route: "/farmers" }) === false, "All Farmers node is DISABLED");
  assert(isNavigationNodeEnabled({ id: "finance", label: "Finance", route: "/finance" }) === false, "Finance node is DISABLED");
  assert(isNavigationNodeEnabled({ id: "network-dashboard", label: "Network Dashboard", route: "/national-dashboard" }) === false, "Dashboard node is DISABLED");
  assert(isNavigationNodeEnabled({ id: "fpc-list", label: "FPC List", route: "/fpc-management" }) === false, "FPC List node is DISABLED");

  // TEST 5: Route Authorization Guards
  console.log("\n--- TEST GROUP 5: Route Authorization Guards ---");
  assert(isRouteAllowed("/fpc-management/onboard") === true, "Route /fpc-management/onboard is ALLOWED");
  assert(isRouteAllowed("/onboard/register") === true, "Route /onboard/register is ALLOWED");
  assert(isRouteAllowed("/") === true, "Route / is ALLOWED (redirects to /fpc-management/onboard)");
  assert(isRouteAllowed("/overview") === true, "Route /overview is ALLOWED (redirects to /fpc-management/onboard)");

  const disabledRoutes = [
    "/farmers", "/farmers/new", "/farmers/F-001",
    "/shareholders", "/shareholders/new",
    "/finance", "/finance/cash-book", "/finance/bank-book",
    "/national-dashboard", "/tsf/analytics",
    "/agri-business/produce-purchase", "/agri-business/produce-sale",
    "/inventory", "/reports", "/administration/users"
  ];
  for (const r of disabledRoutes) {
    assert(isRouteAllowed(r) === false, `Route ${r} is RESTRICTED`);
  }

  // TEST 6: Code Preservation Verification
  console.log("\n--- TEST GROUP 6: Source Code & Module Preservation ---");
  const preservedFiles = [
    "artifacts/fpc-management/src/FarmerDetails.tsx",
    "artifacts/fpc-management/src/ShareholderDetails.tsx",
    "artifacts/fpc-management/src/AdminModules.tsx",
    "artifacts/fpc-management/src/EnhancedModules.tsx",
    "artifacts/fpc-management/src/FeatureScreens.tsx",
    "artifacts/fpc-management/src/ServicesModule.tsx",
    "artifacts/fpc-management/src/TsfCentralMonitoring.tsx",
    "artifacts/fpc-management/src/RegistrationDashboard.tsx",
    "artifacts/fpc-management/src/FpcManagement.tsx",
    "artifacts/fpc-management/src/components/onboarding/TsfAdminOnboardingView.tsx",
    "artifacts/fpc-management/src/components/onboarding/FpcAdminOnboardingWizard.tsx",
    "artifacts/fpc-management/src/components/onboarding/EmailPreviewModal.tsx"
  ];
  for (const f of preservedFiles) {
    const fullPath = path.resolve(__dirname, "..", f);
    assert(fs.existsSync(fullPath), `Preserved module file exists: ${f}`);
  }

  // TEST 7: Future Reactivation Simulation
  console.log("\n--- TEST GROUP 7: Future Reactivation Simulation ---");
  // Temporarily switch toggle to false
  FEATURE_FLAGS.twoFlowModeOnly = false;
  const restoredRoles = getActiveDemoRoles(roles);
  assert(restoredRoles.length > 1, `Instant reactivation restores multiple demo roles (count: ${restoredRoles.length})`);
  assert(isRouteAllowed("/farmers") === true, "Restored mode allows /farmers route");
  assert(isRouteAllowed("/shareholders") === true, "Restored mode allows /shareholders route");
  assert(isNavigationNodeEnabled({ id: "farmers-all", label: "All Farmers", route: "/farmers" }) === true, "Restored mode enables All Farmers navigation node");
  
  const restoredTsfNav = getRoleNavigation("TSF Central Admin");
  console.log(`Restored TSF navigation groups: ${restoredTsfNav.map(n => n.label).join(", ")}`);
  assert(restoredTsfNav.length > 1, `Restored TSF Admin navigation returns full suite of modules (groups count: ${restoredTsfNav.length})`);

  // Switch back to true for demonstration mode
  FEATURE_FLAGS.twoFlowModeOnly = true;
  assert(FEATURE_FLAGS.twoFlowModeOnly === true, "Re-enabled Two-Flow demonstration mode successfully");

  console.log("\n=================================================================");
  console.log(`UI MODE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});

