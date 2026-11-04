import type { Role } from "./config";

/**
 * Master Client Demo Mode Configuration
 *
 * SET DEMO_MODE to true to temporarily disable all form validations,
 * required-field blocking errors, and credential checks across all four flows
 * and registration screens so the client can demonstrate the complete application smoothly.
 *
 * SET DEMO_MODE to false to restore normal strict authentication and field validation.
 */
export const DEMO_MODE: boolean = true;

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

/**
 * STRICT 6-SCREEN ONBOARDING WORKFLOW MODE
 *
 * When ONBOARDING_ONLY_MODE = true, the entire application strictly exposes ONLY:
 * Screen 1: TSF Admin Login
 * Screen 2: TSF Admin Invites FPC Admin
 * Screen 3: Preview Email Template
 * Screen 4: FPC Admin Login
 * Screen 5: FPC Company Onboarding
 * Screen 6: Successfully Onboarded
 *
 * All sidebars, dashboards, role switchers, and unrelated screens are completely disabled.
 * Set to false to restore normal full enterprise navigation and modules.
 */
export const ONBOARDING_ONLY_MODE: boolean = true;

export function isOnboardingOnlyMode(): boolean {
  return ONBOARDING_ONLY_MODE;
}

/**
 * Centralized Module & Feature Configuration
 *
 * Use this configuration to control feature availability across the FPC Management System.
 * To exit demonstration mode and restore full enterprise functionality, set `demoMode: false`.
 */

/**
 * Master Feature Configuration for Two-Flow-Only Demonstration Mode
 *
 * SET twoFlowModeOnly to false to INSTANTLY restore full enterprise functionality
 * across all modules (TSF Central Dashboard, Farmers, Shareholders, Agri-Business,
 * Inventory, Finance, Compliance, Reports & Analytics, Administration).
 */
export interface FeatureFlags {
  /** Master toggle for Two-Flow Onboarding Demonstration Mode */
  twoFlowModeOnly: boolean;

  // Active Demonstration Flows
  fpcInvitation: boolean;          // Flow 1: TSF Admin invites FPC Admin
  fpcCompanyOnboarding: boolean;   // Flow 2: FPC Admin self-registration

  // Temporarily Disabled Modules (Preserved for Future Reactivation)
  dashboardAnalytics: boolean;
  farmerManagement: boolean;
  shareholderManagement: boolean;
  agriBusiness: boolean;
  inventory: boolean;
  finance: boolean;
  compliance: boolean;
  reportsAnalytics: boolean;
  administration: boolean;
  networkMonitoring: boolean;
  businessMonitoring: boolean;
  financialMonitoring: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  // SET TO false TO INSTANTLY RESTORE ALL MODULES
  twoFlowModeOnly: false,

  // Two Active Flows
  fpcInvitation: true,
  fpcCompanyOnboarding: true,

  // Active Modules for Enterprise Architecture
  dashboardAnalytics: true,
  farmerManagement: true,
  shareholderManagement: true,
  agriBusiness: true,
  inventory: true,
  finance: true,
  compliance: true,
  reportsAnalytics: true,
  administration: true,
  networkMonitoring: true,
  businessMonitoring: true,
  financialMonitoring: true,
};

/**
 * Feature Toggles for Finance and Ledgers
 * 
 * Centralized feature configuration to control Finance module visibility and access.
 * To activate or deactivate individual features, toggle the boolean values below:
 */
export const MODULE_FEATURES = {
  finance: false,
  buyerLedger: false,
  supplierLedger: false,
};

export interface ModuleConfiguration {
  /** Master toggle for client demonstration mode */
  demoMode: boolean;

  // 1. ENABLED REGISTRATION MODULES
  farmerRegistration: boolean;
  shareholderRegistration: boolean;
  buyerRegistration: boolean;
  supplierRegistration: boolean;
  produceSaleRegistration: boolean;
  producePurchaseRegistration: boolean;
  inputSaleRegistration: boolean;
  inputPurchaseRegistration: boolean;
  baselineSurveyRegistration: boolean;

  // 2. FINANCE MODULE & SUB-MODULE TOGGLES
  finance: boolean;
  buyerLedger: boolean;
  supplierLedger: boolean;

  // 3. TEMPORARILY DISABLED MODULES IN DEMO MODE
  dashboardAnalytics: boolean;
  inventory: boolean;
  compliance: boolean;
  reportsGallery: boolean;
  administration: boolean;
  advancedApprovals: boolean;
  farmerSettlement: boolean;
  advancesDues: boolean;
  services: boolean;
  fpcProfile: boolean;
  multiFpcLinks: boolean;
  deletedFarmers: boolean;
}

export const moduleConfig: ModuleConfiguration = {
  // Set to false to immediately restore all enterprise modules
  demoMode: false,

  // Enabled registration modules
  farmerRegistration: true,
  shareholderRegistration: true,
  buyerRegistration: true,
  supplierRegistration: true,
  produceSaleRegistration: true,
  producePurchaseRegistration: true,
  inputSaleRegistration: true,
  inputPurchaseRegistration: true,
  baselineSurveyRegistration: true,

  // Finance features
  finance: true,
  buyerLedger: true,
  supplierLedger: true,

  // Operational & enterprise modules
  dashboardAnalytics: true,
  inventory: true,
  compliance: true,
  reportsGallery: true,
  administration: true,
  advancedApprovals: true,
  farmerSettlement: true,
  advancesDues: true,
  services: true,
  fpcProfile: true,
  multiFpcLinks: true,
  deletedFarmers: true,
};

/**
 * Enabled roles for demonstration mode.
 * To reactivate all roles, set demoMode to false.
 */
export const enabledDemoRoles: readonly Role[] = [
  "TSF Central Admin",
  "FPC Admin / Manager",
] as const;

/** Check whether a role is enabled under demo configuration */
export function isRoleEnabled(role: Role): boolean {
  if (!moduleConfig.demoMode) return true;
  return (enabledDemoRoles as readonly string[]).includes(role);
}

/** Filter role list for demo mode */
export function getActiveDemoRoles(allRoles: readonly Role[]): readonly Role[] {
  if (!moduleConfig.demoMode) return allRoles;
  if (FEATURE_FLAGS.twoFlowModeOnly) {
    return allRoles.filter(r => r === "TSF Central Admin");
  }
  return allRoles.filter(r => (enabledDemoRoles as readonly string[]).includes(r));
}

/** Normalize URL path for consistent route comparison */
export function cleanPath(path: string): string {
  const p = decodeURIComponent(path.split("?")[0] || "/").replace(/\/+$/, "");
  return p || "/";
}

/** Check whether Finance module is enabled */
export function isFinanceEnabled(): boolean {
  if (!moduleConfig.demoMode) return true;
  return Boolean(MODULE_FEATURES.finance);
}

/** Check whether Buyer Ledger sub-module is enabled */
export function isBuyerLedgerEnabled(): boolean {
  if (!moduleConfig.demoMode) return true;
  return Boolean(MODULE_FEATURES.finance && MODULE_FEATURES.buyerLedger);
}

/** Check whether Supplier Ledger sub-module is enabled */
export function isSupplierLedgerEnabled(): boolean {
  if (!moduleConfig.demoMode) return true;
  return Boolean(MODULE_FEATURES.finance && MODULE_FEATURES.supplierLedger);
}

/** Check if a route path is a Finance or Ledger route */
export function isFinanceRoute(rawPath: string): boolean {
  const path = cleanPath(rawPath).toLowerCase();
  if (path === "/finance" || path.startsWith("/finance/") || path === "/finance-dashboard") {
    return true;
  }
  if (path === "/tsf/finance" || path.startsWith("/tsf/finance/")) {
    return true;
  }
  if (path === "/member/ledger") {
    return true;
  }
  return false;
}

/** Check if a route path is specifically the Buyer Ledger */
export function isBuyerLedgerRoute(rawPath: string): boolean {
  const path = cleanPath(rawPath).toLowerCase();
  return path === "/finance/buyer-ledger" || path === "/tsf/finance/buyer-receivables";
}

/** Check if a route path is specifically the Supplier Ledger */
export function isSupplierLedgerRoute(rawPath: string): boolean {
  const path = cleanPath(rawPath).toLowerCase();
  return path === "/finance/supplier-ledger" || path === "/tsf/finance/supplier-payables";
}

/** Check if an individual navigation node is enabled under current configuration */
export function isNavigationNodeEnabled(node: { id?: string; label?: string; route?: string; detailRoute?: string }): boolean {
  if (!moduleConfig.demoMode) return true;

  const id = (node.id || "").toLowerCase();
  const label = (node.label || "").toLowerCase();
  const route = (node.route || "").toLowerCase();

  // TWO-FLOW DEMONSTRATION MODE:
  // Strictly enable ONLY the FPC Onboarding / Invitation flow.
  // All other modules (Dashboard, Farmers, Shareholders, Agri-Business, Finance, Inventory, Monitoring, Compliance, Reports, Admin)
  // are disabled and hidden from navigation.
  if (FEATURE_FLAGS.twoFlowModeOnly) {
    if (
      id === "onboard-fpc" ||
      label === "onboard new fpc" ||
      route === "/fpc-management/onboard" ||
      id === "fpc-onboarding" ||
      label === "fpc onboarding" ||
      id === "fpc-management" ||
      label === "fpc management"
    ) {
      return true;
    }
    return false;
  }

  // Root Overview / Dashboard is always enabled (renders registration dashboard in demo mode)
  if ((id === "dashboard" && route !== "/finance-dashboard") || label === "overview" || (label === "dashboard" && route !== "/finance-dashboard") || route === "/overview" || route === "/") {
    return true;
  }

  // 0. FINANCE & LEDGERS (Controlled via MODULE_FEATURES)
  const isFinanceNode =
    id === "finance" ||
    id === "financial-monitoring" ||
    id.includes("ledger") ||
    route === "/finance" ||
    route.startsWith("/finance/") ||
    route === "/finance-dashboard" ||
    route === "/tsf/finance" ||
    route.startsWith("/tsf/finance/") ||
    route === "/member/ledger" ||
    id === "consolidated-finance" ||
    id === "farmer-settlements-mon" ||
    id === "buyer-receivables-mon" ||
    id === "supplier-payables-mon" ||
    id === "financial-performance" ||
    id === "cash-book" ||
    id === "bank-book" ||
    id === "receipts-payments" ||
    id === "expenses" ||
    id === "income-expenditure" ||
    id === "profit-loss" ||
    id === "ledgers" ||
    id === "payments" ||
    id === "receipts";

  if (isFinanceNode) {
    if (!MODULE_FEATURES.finance) return false;
    if (id === "buyer-ledger" || id === "buyer-receivables-mon" || route.includes("buyer-ledger") || route.includes("buyer-receivables")) {
      return Boolean(MODULE_FEATURES.buyerLedger);
    }
    if (id === "supplier-ledger" || id === "supplier-payables-mon" || route.includes("supplier-ledger") || route.includes("supplier-payables")) {
      return Boolean(MODULE_FEATURES.supplierLedger);
    }
    return true;
  }

  // TSF Central Admin navigation nodes (Finance nodes handled above)
  if (
    id.startsWith("tsf-") || id.startsWith("fpc-") || id.startsWith("network-") ||
    route.startsWith("/tsf/") || route.startsWith("/fpc-management") || route === "/national-dashboard" ||
    route === "/mis-reports"
  ) {
    return true;
  }

  // 1. Farmer Registration & Farmer List/Detail
  if (
    id === "farmers-new" || id === "farmers-all" || id === "register-farmer" ||
    label === "register farmer" || label === "all farmers" || label === "farmers" ||
    route === "/farmers/new" || route === "/farmers" || route.startsWith("/farmers/") && !route.includes("multi-fpc") && !route.includes("deleted")
  ) {
    if (id === "farmers-multi-fpc" || label.includes("multi-fpc") || route.includes("multi-fpc")) {
      return moduleConfig.multiFpcLinks;
    }
    if (id === "farmers-deleted" || label.includes("deleted") || route.includes("deleted")) {
      return moduleConfig.deletedFarmers;
    }
    return moduleConfig.farmerRegistration;
  }

  // 2. Shareholder Registration & Shareholder List/Detail
  if (
    id === "shareholders-new" || id === "shareholders-all" ||
    label === "register shareholder" || label === "all shareholders" || label === "shareholders" ||
    route === "/shareholders/new" || route === "/shareholders" || route.startsWith("/shareholders/") && !route.includes("certificates") && !route.includes("dividend") && !route.includes("reports")
  ) {
    return moduleConfig.shareholderRegistration;
  }

  // 3. Buyer Registration (Buyer Master)
  if (
    id === "buyers-suppliers" || id === "buyers" || id === "buyer-master" ||
    label.includes("buyer") || route === "/agri-business/buyers-suppliers" || route === "/buyers"
  ) {
    return moduleConfig.buyerRegistration;
  }

  // 4. Supplier Registration (Supplier Master)
  if (
    id === "supplier-master" || id === "suppliers" ||
    label.includes("supplier") || route === "/agri-business/suppliers"
  ) {
    return moduleConfig.supplierRegistration;
  }

  // 5. Produce Sale Registration
  if (
    id === "produce-sale" || label === "produce sale" ||
    route === "/agri-business/produce-sale" || route === "/sales/produce"
  ) {
    return moduleConfig.produceSaleRegistration;
  }

  // 6. Produce Purchase Registration
  if (
    id === "produce-purchase" || id === "new-purchase" || label === "produce purchase" || label === "new purchase" ||
    route === "/agri-business/produce-purchase" || route === "/purchases/new"
  ) {
    return moduleConfig.producePurchaseRegistration;
  }

  // 7. Input Sale Registration
  if (
    id === "input-sale" || label === "input sale" ||
    route === "/agri-business/input-sale" || route === "/sales/inputs"
  ) {
    return moduleConfig.inputSaleRegistration;
  }

  // 8. Input Purchase Registration
  if (
    id === "input-purchase" || label === "input purchase" ||
    route === "/agri-business/input-purchase" || route === "/purchases/inputs"
  ) {
    return moduleConfig.inputPurchaseRegistration;
  }

  // 9. Baseline Survey Registration
  if (
    id === "farmers-baseline" || id === "baseline-survey" || id === "survey-monitoring" ||
    label.includes("baseline") || label.includes("survey") ||
    route === "/farmers/baseline" || route === "/field/baseline" || route === "/tsf/monitoring/surveys"
  ) {
    return moduleConfig.baselineSurveyRegistration;
  }

  // Specifically disabled in demo mode
  if (
    id.includes("approval") || label.includes("approval") ||
    id.includes("settlement") || label.includes("settlement") ||
    id.includes("advances") || label.includes("advances") ||
    id.includes("service") || label.includes("service") ||
    id.includes("fpc-profile") || label.includes("profile") ||
    id.includes("licence") || label.includes("licence") ||
    id.includes("bank-account") || label.includes("bank account") ||
    id.includes("certificate") || label.includes("certificate") ||
    id.includes("dividend") || label.includes("dividend") ||
    id.includes("inventory") || label.includes("inventory") ||
    id.includes("stock") || label.includes("stock") ||
    id.includes("movement") || label.includes("movement") ||
    id.includes("adjustment") || label.includes("adjustment") ||
    id.includes("godown") || label.includes("godown") ||
    id.includes("unit-converter") || label.includes("converter") ||
    id.includes("commodity") || label.includes("commodity") ||
    id.includes("finance") || label.includes("finance") ||
    id.includes("ledger") || label.includes("ledger") ||
    id.includes("cash-book") || label.includes("cash book") ||
    id.includes("bank-book") || label.includes("bank book") ||
    id.includes("payment") || label.includes("payment") ||
    id.includes("expense") || label.includes("expense") ||
    id.includes("profit-loss") || label.includes("profit") ||
    id.includes("compliance") || label.includes("compliance") ||
    id.includes("calendar") || label.includes("calendar") ||
    id.includes("filing") || label.includes("filing") ||
    id.includes("meeting") || label.includes("meeting") ||
    id.includes("document") || label.includes("document") ||
    id.includes("report") || label.includes("report") ||
    id.includes("analytics") || label.includes("analytics") ||
    id.includes("gallery") || label.includes("gallery") ||
    id.includes("audit") || label.includes("audit") ||
    id.includes("sync") || label.includes("sync") ||
    id.includes("message") || label.includes("message") ||
    id.includes("setting") || label.includes("setting") ||
    id.includes("support") || label.includes("support")
  ) {
    return false;
  }

  // By default in demo mode, do not display unclassified non-registration nodes
  return false;
}

/** Check if a route path is allowed under current configuration */
export function isRouteAllowed(rawPath: string): boolean {
  if (!moduleConfig.demoMode) return true;

  const path = cleanPath(rawPath);

  // TWO-FLOW DEMONSTRATION MODE:
  // Strictly allow ONLY the onboarding invitation and public registration routes.
  // All other module routes are restricted in demonstration mode.
  if (FEATURE_FLAGS.twoFlowModeOnly) {
    if (
      path === "/" ||
      path === "/overview" ||
      path === "/fpc-management/onboard" ||
      path === "/fpc-management" ||
      path.startsWith("/onboard")
    ) {
      return true;
    }
    return false;
  }

  // Overview / Landing
  if (path === "/" || path === "/overview") return true;

  // Finance route checks - must evaluate BEFORE generic /tsf/ wildcard
  if (isFinanceRoute(path)) {
    if (!MODULE_FEATURES.finance) return false;
    if (isBuyerLedgerRoute(path)) return Boolean(MODULE_FEATURES.buyerLedger);
    if (isSupplierLedgerRoute(path)) return Boolean(MODULE_FEATURES.supplierLedger);
    return true;
  }

  // TSF Central Admin workspace routes (Finance routes handled above)
  if (
    path === "/national-dashboard" ||
    path === "/mis-reports" ||
    path.startsWith("/fpc-management") ||
    path.startsWith("/tsf/") ||
    path.startsWith("/onboard")
  ) {
    return true;
  }

  // 1. Farmer Registration & Farmer Overview
  if (path === "/farmers" || path === "/farmers/new") return moduleConfig.farmerRegistration;
  if (path.startsWith("/farmers/")) {
    if (path === "/farmers/multi-fpc") return moduleConfig.multiFpcLinks;
    if (path === "/farmers/deleted") return moduleConfig.deletedFarmers;
    if (path === "/farmers/baseline") return moduleConfig.baselineSurveyRegistration;
    // Specific farmer view or edit: /farmers/:id or /farmers/:id/edit
    return moduleConfig.farmerRegistration;
  }

  // 2. Shareholder Registration & Shareholder Overview
  if (path === "/shareholders" || path === "/shareholders/new") return moduleConfig.shareholderRegistration;
  if (path.startsWith("/shareholders/")) {
    if (path === "/shareholders/certificates" || path === "/shareholders/dividend" || path === "/shareholders/reports") {
      return false;
    }
    // Specific shareholder view: /shareholders/:id
    return moduleConfig.shareholderRegistration;
  }

  // 3. Buyer Registration
  if (path === "/agri-business/buyers-suppliers" || path === "/buyers" || path === "/agri-business/buyers") {
    return moduleConfig.buyerRegistration;
  }

  // 4. Supplier Registration
  if (path === "/agri-business/suppliers" || path === "/suppliers") {
    return moduleConfig.supplierRegistration;
  }

  // 5. Produce Sale Registration
  if (path === "/agri-business/produce-sale" || path === "/sales/produce" || path === "/member/sell-produce") {
    return moduleConfig.produceSaleRegistration;
  }

  // 6. Produce Purchase Registration
  if (path === "/agri-business/produce-purchase" || path === "/purchases/new" || path === "/purchases") {
    return moduleConfig.producePurchaseRegistration;
  }

  // 7. Input Sale Registration
  if (path === "/agri-business/input-sale" || path === "/sales/inputs" || path === "/member/buy-inputs") {
    return moduleConfig.inputSaleRegistration;
  }

  // 8. Input Purchase Registration
  if (path === "/agri-business/input-purchase" || path === "/purchases/inputs") {
    return moduleConfig.inputPurchaseRegistration;
  }

  // 9. Baseline Survey Registration
  if (path === "/farmers/baseline" || path === "/field/baseline" || path === "/baseline") {
    return moduleConfig.baselineSurveyRegistration;
  }

  // All other routes are non-registration and disabled in demo mode
  return false;
}

/** Check if a screen label / alias is allowed under current configuration */
export function isScreenAllowed(screen: string): boolean {
  if (!moduleConfig.demoMode) return true;

  // Finance & Ledger screens check (Controlled via MODULE_FEATURES)
  const isFinanceScreen =
    screen === "Consolidated Finance" ||
    screen === "Farmer Settlements" ||
    screen === "Buyer Receivables" ||
    screen === "Supplier Payables" ||
    screen === "Financial Performance" ||
    screen === "Farmer ledger" ||
    screen === "Buyer ledger" ||
    screen === "Supplier ledger" ||
    screen === "Cash book" ||
    screen === "Bank book" ||
    screen === "Receipts and payments" ||
    screen === "Expense register" ||
    screen === "Income & expenditure" ||
    screen === "Profit & loss" ||
    screen === "Finance" ||
    screen === "Finance dashboard" ||
    screen === "Ledger & payments";

  if (isFinanceScreen) {
    if (!MODULE_FEATURES.finance) return false;
    if (screen === "Buyer ledger" || screen === "Buyer Receivables") return Boolean(MODULE_FEATURES.buyerLedger);
    if (screen === "Supplier ledger" || screen === "Supplier Payables") return Boolean(MODULE_FEATURES.supplierLedger);
    return true;
  }

  const allowedScreens = new Set([
    "Overview",
    "Home",
    // TSF Screens & Oversight
    "National dashboard",
    "Network Dashboard",
    "Analytics",
    "Network Analytics",
    "FPC List",
    "FPC directory",
    "FPC onboarding",
    "FPC Management",
    "Farmer Monitoring",
    "Shareholder Monitoring",
    "Buyer Monitoring",
    "Supplier Monitoring",
    "Employee & User Monitoring",
    "Surveys",
    "Surveys & Field Assessments",
    "Produce Purchase & Sale",
    "Input Purchase & Sale",
    "Services Monitoring",
    "Inventory Monitoring",
    "Warehouse Monitoring",
    "FPC Compliance",
    "Licenses & Documents",
    "Board of Directors",
    "ROC Monitoring",
    "Audit & Activity Logs",
    "Consolidated MIS",
    "MIS Reports",
    "FPC-wise Reports",
    "Network Reports",
    "Baseline reports",
    "Baseline & Impact Reports",
    "Data Quality Reports",
    "Export Centre",
    "User Management",
    // 1. Farmer Registration
    "Register farmer", "Farmers", "My farmers",
    // 2. Shareholder Registration
    "Register shareholder", "Shareholders",
    // 3. Buyer Registration
    "Buyer master", "Buyers",
    // 4. Supplier Registration
    "Supplier master", "Suppliers",
    // 5. Produce Sale Registration
    "Produce Sale", "Sell produce",
    // 6. Produce Purchase Registration
    "Produce Purchase", "Purchase draft", "Purchases",
    // 7. Input Sale Registration
    "Input Sale", "Buy inputs",
    // 8. Input Purchase Registration
    "Input Purchase",
    // 9. Baseline Survey Registration
    "Baseline", "Baseline survey",
  ]);

  return allowedScreens.has(screen);
}
