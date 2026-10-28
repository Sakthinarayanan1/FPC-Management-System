import {
  ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Banknote, BarChart3,
  Boxes, BriefcaseBusiness, Building2, CalendarDays, ClipboardCheck,
  ClipboardList, FileBarChart, FileCheck2, FileClock, Gauge, HandCoins,
  Handshake, HardDrive, History, Home, Image, Landmark, Leaf, Map, Package,
  PackageOpen, Receipt, Settings, ShieldCheck, Sprout, Store, UserRound, Users,
  Wallet, Warehouse, type LucideIcon,
} from "lucide-react";
import { can, roles, type Role } from "@/lib/config";

export type NavigationPermission = {
  module: string;
  action: "V" | "C" | "E" | "D" | "A" | "X" | "U";
};

export type NavigationNode = {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  /** A route for an individual record, not an additional menu entry. */
  detailRoute?: string;
  permission?: NavigationPermission;
  roles: readonly Role[];
  badgeKey?: string;
  caption?: string;
  /** True only when a group itself is also a real page. */
  parentPage?: boolean;
  children?: readonly NavigationNode[];
};

const allRoles: readonly Role[] = roles;
const admin: Role = "FPC Admin / Manager";
const tsf: Role = "TSF Central Admin";
const accountant: Role = "Accountant / Finance Officer";
const procurement: Role = "Procurement / Purchase Officer";
const sales: Role = "Sales / Marketing Officer";
const inventory: Role = "Inventory / Stock Manager";
const dataEntry: Role = "Data Entry Operator";
const compliance: Role = "Compliance / Documentation Officer";
const field: Role = "Field Staff";
const director: Role = "Director / Board Member / Auditor";
const farmer: Role = "Farmer";
const shareholder: Role = "Shareholder";

const leaf = (
  id: string,
  label: string,
  route: string,
  permissionModule: string,
  options: Partial<Pick<NavigationNode, "roles" | "badgeKey" | "caption" | "detailRoute" | "icon">> = {},
): NavigationNode => ({
  id,
  label,
  route,
  icon: options.icon ?? Home,
  permission: { module: permissionModule, action: "V" },
  roles: options.roles ?? allRoles,
  ...(options.badgeKey ? { badgeKey: options.badgeKey } : {}),
  ...(options.caption ? { caption: options.caption } : {}),
  ...(options.detailRoute ? { detailRoute: options.detailRoute } : {}),
});

const single = (id: string, label: string, route: string, permissionModule: string, icon: LucideIcon) =>
  leaf(id, label, route, permissionModule, { icon });

const group = (
  id: string,
  label: string,
  icon: LucideIcon,
  children: NavigationNode[],
  options: Partial<Pick<NavigationNode, "roles" | "route" | "permission">> = {},
): NavigationNode => ({
  id, label, icon, children, roles: options.roles ?? allRoles,
  ...(options.route ? { route: options.route, parentPage: true } : {}),
  ...(options.permission ? { permission: options.permission } : {}),
});

const overview = (route = "/overview", label = "Overview", permission = "Overview") =>
  leaf("dashboard", label, route, permission);

const fpcAdminTree: NavigationNode[] = [
  group("dashboard", "Dashboard", Gauge, [
    overview(),
    leaf("approvals", "Approvals", "/approvals", "Approvals", { badgeKey: "approvals" }),
    leaf("analytics", "Analytics", "/analytics", "Analytics"),
    leaf("setup-checklist", "Setup Checklist", "/setup-checklist", "Setup checklist"),
  ]),
  group("fpc-profile", "FPC Profile", Building2, [
    leaf("company-details", "Company Details", "/fpc-profile", "FPC profile"),
    leaf("licences-documents", "Licences and Documents", "/fpc-profile/licences", "Document vault"),
    leaf("directors-staff", "Directors and Staff", "/fpc-profile/directors-staff", "User management"),
    leaf("bank-accounts", "Bank Accounts", "/fpc-profile/bank-accounts", "Bank accounts"),
  ]),
  group("farmer-management", "Farmer Management", Users, [
    leaf("farmers-all", "All Farmers", "/farmers", "Farmers", { detailRoute: "/farmers/:id" }),
    leaf("farmers-new", "Register Farmer", "/farmers/new", "Register farmer"),
    leaf("farmers-baseline", "Baseline and Surveys", "/farmers/baseline", "Baseline"),
    leaf("farmers-multi-fpc", "Multi-FPC Links", "/farmers/multi-fpc", "Multi-FPC links"),
    leaf("farmers-deleted", "Deleted Farmers", "/farmers/deleted", "Deleted farmers"),
  ]),
  group("shareholder-management", "Shareholder Management", Handshake, [
    leaf("shareholders-all", "All Shareholders", "/shareholders", "Shareholders"),
    leaf("shareholders-new", "Register Shareholder", "/shareholders/new", "Register shareholder"),
    leaf("share-certificates", "Share Certificates", "/shareholders/certificates", "Certificates"),
    leaf("dividend-patronage", "Dividend and Patronage", "/shareholders/dividend", "Dividends"),
    leaf("share-capital-reports", "Share Capital Reports", "/shareholders/reports", "Shareholder reports"),
  ]),
  group("agri-business", "Agri Business", BriefcaseBusiness, [
    leaf("produce-purchase", "Produce Purchase", "/agri-business/produce-purchase", "Produce Purchase", { caption: "Farmer Produce" }),
    leaf("produce-sale", "Produce Sale", "/agri-business/produce-sale", "Produce Sale", { caption: "Farmer Produce" }),
    leaf("input-purchase", "Input Purchase", "/agri-business/input-purchase", "Input Purchase", { caption: "Farm Inputs" }),
    leaf("input-sale", "Input Sale", "/agri-business/input-sale", "Input Sale", { caption: "Farm Inputs" }),
    leaf("farmer-settlement", "Farmer Settlement", "/agri-business/farmer-settlement", "Farmer Settlement", { caption: "Accounts" }),
    leaf("advances-dues", "Advances and Dues", "/agri-business/advances-dues", "Advances & Dues", { caption: "Accounts" }),
    leaf("buyers-suppliers", "Buyers and Suppliers", "/agri-business/buyers-suppliers", "Buyer master", { caption: "Accounts" }),
    leaf("supplier-master", "Supplier Master", "/agri-business/suppliers", "Supplier master", { caption: "Accounts" }),
    leaf("services", "Services", "/agri-business/services", "Input supply", { caption: "Accounts" }),
  ]),
  group("inventory", "Inventory", Boxes, [
    leaf("produce-inventory", "Produce Inventory", "/inventory/produce", "Inventory"),
    leaf("input-inventory", "Input Inventory", "/inventory/inputs", "Inventory"),
    leaf("stock-register", "Stock Register", "/inventory/stock-register", "Stock register"),
    leaf("stock-movement", "Stock Movement", "/inventory/movements", "Movements"),
    leaf("transfers-adjustments", "Transfers and Adjustments", "/inventory/adjustments", "Adjustments"),
    leaf("godowns-units", "Godowns and Units", "/inventory/godowns-units", "Godowns"),
    leaf("unit-converter", "Unit Converter", "/inventory/unit-converter", "Unit converter"),
    leaf("commodity-master", "Commodity and Unit Master", "/agri-business/commodity-master", "Commodity & unit master"),
  ]),
  group("finance", "Finance", Landmark, [
    leaf("farmer-ledger", "Farmer Ledger", "/finance/farmer-ledger", "Farmer ledger"),
    leaf("buyer-ledger", "Buyer Ledger", "/finance/buyer-ledger", "Buyer ledger"),
    leaf("supplier-ledger", "Supplier Ledger", "/finance/supplier-ledger", "Supplier ledger"),
    leaf("cash-book", "Cash Book", "/finance/cash-book", "Cash book"),
    leaf("bank-book", "Bank Book", "/finance/bank-book", "Bank book"),
    leaf("receipts-payments", "Receipts and Payments", "/finance/receipts-payments", "Receipts and payments"),
    leaf("expenses", "Expense Register", "/finance/expense-register", "Expense register"),
    leaf("income-expenditure", "Income and Expenditure", "/finance/income-expenditure", "Income & expenditure"),
    leaf("profit-loss", "Profit and Loss", "/finance/profit-loss", "Profit & loss"),
  ]),
  group("compliance", "Compliance", FileCheck2, [
    leaf("statutory-calendar", "Statutory Calendar", "/compliance/calendar", "Statutory calendar"),
    leaf("filing-tracker", "Filing Tracker", "/compliance/filings", "Filing tracker"),
    leaf("meetings", "Meetings", "/compliance/meetings", "Meeting records"),
    leaf("document-vault", "Document Vault", "/compliance/documents", "Document vault"),
  ]),
  group("reports-gallery", "Reports and Gallery", FileBarChart, [
    leaf("report-library", "Report Library", "/reports", "Reports & gallery"),
    leaf("gallery", "Gallery", "/gallery", "Gallery"),
    leaf("change-history", "Change History", "/reports/change-history", "Audit trail"),
  ]),
  group("administration", "Administration", Settings, [
    leaf("users-roles", "Users and Roles", "/administration/users", "User management"),
    leaf("messages", "Messages", "/administration/messages", "Messages"),
    leaf("audit-trail", "Audit Trail", "/administration/audit", "Audit trail"),
    leaf("sync-centre", "Sync Centre", "/administration/sync", "Sync centre"),
    leaf("support", "Support", "/administration/support", "Audit & support"),
    leaf("settings", "Settings", "/administration/settings", "Settings"),
  ]),
];

const tsfTree: NavigationNode[] = [
  group("dashboard", "Dashboard", Gauge, [overview("/national-dashboard", "National Dashboard", "National dashboard")]),
  group("monitoring", "Monitoring", ClipboardCheck, [
    leaf("checklist-matrix", "Checklist Matrix", "/monitoring", "Monitoring"),
    leaf("fpc-journey", "FPC Journey", "/monitoring/journey", "Journey view"),
    leaf("pending-items", "Pending Items", "/monitoring/pending", "Monitoring"),
  ]),
  group("fpc-management", "FPC Management", Building2, [
    leaf("all-fpcs", "All FPCs", "/fpc-management", "FPC directory"),
    leaf("onboard-fpc", "Onboard New FPC", "/fpc-management/onboard", "FPC onboarding"),
    leaf("fpc-pending-approvals", "Pending Approvals", "/fpc-management/approvals", "FPC pending approvals"),
  ]),
  group("network-data", "Network Data", Map, [
    leaf("network-farmers", "Farmers", "/network/farmers", "Farmers"),
    leaf("network-shareholders", "Shareholders", "/network/shareholders", "Shareholders"),
    leaf("network-business", "Business", "/network/business", "Monitoring"),
    leaf("network-inventory", "Inventory", "/network/inventory", "Inventory"),
    leaf("network-finance", "Finance", "/network/finance", "Monitoring"),
    leaf("network-compliance", "Compliance", "/network/compliance", "Monitoring"),
  ]),
  group("analytics-mis", "Analytics and MIS", BarChart3, [
    leaf("analytics", "Analytics", "/analytics", "Analytics"),
    leaf("mis-reports", "MIS Reports", "/mis-reports", "Consolidated MIS"),
    leaf("report-builder", "Report Builder", "/report-builder", "Consolidated MIS"),
  ]),
  single("gallery", "Gallery", "/gallery", "Gallery", Image),
  group("administration", "Administration", Settings, [
    leaf("users-roles", "Users and Roles", "/administration/users", "Users & settings"),
    leaf("announcements", "Announcements", "/administration/announcements", "Users & settings"),
    leaf("audit-trail", "Audit Trail", "/administration/audit", "Audit & support"),
    leaf("support", "Support", "/administration/support", "Audit & support"),
    leaf("settings", "Settings", "/administration/settings", "Users & settings"),
  ]),
];

const accountantTree: NavigationNode[] = [
  overview("/finance-dashboard", "Finance Dashboard", "Finance dashboard"),
  group("finance", "Finance", Landmark, [
    leaf("ledgers", "Ledgers", "/finance/ledgers", "Farmer ledger"),
    leaf("payments", "Payments", "/finance/payments", "Payments"),
    leaf("receipts", "Receipts", "/finance/receipts", "Payments"),
    leaf("expenses", "Expenses", "/finance/expenses", "Expenses"),
    leaf("profit-loss", "Profit and Loss", "/finance/profit-loss", "Reports"),
  ]),
  group("share-capital", "Share Capital", HandCoins, [
    leaf("share-register", "Register", "/share-capital/register", "Share capital"),
    leaf("dividend-run", "Dividend Run", "/share-capital/dividend", "Dividends"),
  ]),
  single("reports", "Reports", "/reports", "Reports", FileBarChart),
];

const procurementTree: NavigationNode[] = [
  overview("/procurement-dashboard", "Procurement Dashboard", "Procurement dashboard"),
  group("produce-purchase", "Produce Purchase", ArrowDownToLine, [
    leaf("new-purchase", "New Purchase", "/purchases/new", "Produce Purchase"),
    leaf("all-purchases", "All Purchases", "/purchases", "Purchase entries"),
  ]),
  single("input-purchase", "Input Purchase", "/purchases/inputs", "Input Purchase", PackageOpen),
  single("reports", "Reports", "/reports", "Purchase entries", FileBarChart),
];

const salesTree: NavigationNode[] = [
  overview("/sales-dashboard", "Sales Dashboard", "Sales dashboard"),
  single("produce-sale", "Produce Sale", "/sales/produce", "Produce Sale", ArrowUpFromLine),
  single("input-sale", "Input Sale", "/sales/inputs", "Input Sale", Package),
  single("buyers", "Buyers", "/buyers", "Buyers", Store),
  single("reports", "Reports", "/reports", "Sales entries", FileBarChart),
];

const inventoryTree: NavigationNode[] = [
  overview("/stock-dashboard", "Stock Dashboard", "Stock dashboard"),
  single("produce-inventory", "Produce Inventory", "/inventory/produce", "Inventory", Boxes),
  single("input-inventory", "Input Inventory", "/inventory/inputs", "Input supply", PackageOpen),
  single("stock-movement", "Stock Movement", "/inventory/movements", "Movements", ArrowLeftRight),
  single("adjustments-transfers", "Adjustments and Transfers", "/inventory/adjustments", "Adjustments", ClipboardList),
  single("units-godowns", "Units and Godowns", "/inventory/godowns-units", "Godowns", Warehouse),
];

const dataEntryTree: NavigationNode[] = [
  overview("/data-entry-home", "My Drafts", "Data entry home"),
  group("data-entry", "Data Entry", ClipboardList, [
    leaf("data-farmers", "Farmers", "/data-entry/farmers", "Farmers"),
    leaf("data-shareholders", "Shareholders", "/data-entry/shareholders", "Shareholders"),
    leaf("data-purchases", "Purchases", "/data-entry/purchases", "Purchases"),
    leaf("data-sales", "Sales", "/data-entry/sales", "Sales"),
  ]),
  single("bulk-upload", "Bulk Upload", "/bulk-upload", "Bulk upload", ArrowDownToLine),
  single("sync-centre", "Sync Centre", "/sync-centre", "Sync centre", HardDrive),
];

const fieldTree: NavigationNode[] = [
  overview("/field-home", "Home", "Field home"),
  single("register-farmer", "Register Farmer", "/farmers/new", "Register farmer", UserRound),
  single("baseline-survey", "Baseline Survey", "/field/baseline", "Baseline survey", Sprout),
  single("purchase-draft", "Purchase Draft", "/purchases/draft", "Purchase draft", Receipt),
  single("gallery", "Gallery", "/gallery", "Gallery upload", Image),
  single("sync", "Sync", "/sync-centre", "Sync centre", HardDrive),
];

const complianceTree: NavigationNode[] = [
  overview("/compliance-dashboard", "Compliance Dashboard", "Compliance dashboard"),
  group("compliance", "Compliance", ShieldCheck, [
    leaf("filing-tracker", "Filing Tracker", "/compliance/filings", "Filing calendar"),
    leaf("meetings", "Meetings", "/compliance/meetings", "Meetings"),
    leaf("document-vault", "Document Vault", "/compliance/documents", "Document vault"),
  ]),
  single("gallery", "Gallery", "/gallery", "Gallery", Image),
  single("reports", "Reports", "/reports", "Reports", FileBarChart),
];

const directorTree: NavigationNode[] = [
  overview("/oversight-dashboard", "Overview", "Oversight dashboard"),
  group("business", "Business", BriefcaseBusiness, [
    leaf("business-farmers", "Farmers", "/business/farmers", "Farmers"),
    leaf("business-shareholders", "Shareholders", "/business/shareholders", "Shareholders"),
    leaf("business-purchases", "Purchases", "/business/purchases", "Purchases"),
    leaf("business-sales", "Sales", "/business/sales", "Sales"),
    leaf("business-inventory", "Inventory", "/business/inventory", "Inventory"),
  ]),
  single("finance", "Finance", "/finance", "Finance", Landmark),
  single("compliance", "Compliance", "/compliance", "Compliance", FileCheck2),
  single("audit-trail", "Audit Trail", "/audit-trail", "Audit trail", History),
  group("reports", "Reports", FileBarChart, [
    leaf("reports", "Reports", "/reports", "Shareholder reports"),
    leaf("baseline-reports", "Baseline Reports", "/reports/baseline", "Commodity Baseline reports"),
  ]),
];

const farmerTree: NavigationNode[] = [
  overview("/home", "Home", "Home"),
  single("sell-produce", "Sell Produce", "/member/sell-produce", "Sell produce", Leaf),
  single("buy-inputs", "Buy Inputs", "/member/buy-inputs", "Buy inputs", Package),
  group("wallet", "Wallet", Wallet, [
    leaf("wallet", "Wallet", "/member/wallet", "Wallet"),
    leaf("transactions", "Transaction History", "/member/transactions", "Transaction history"),
  ]),
  single("fpc-rates", "FPC Rates", "/member/fpc-rates", "FPC rates", Banknote),
  group("profile-support", "Profile and Support", UserRound, [
    leaf("profile", "My Profile", "/member/profile", "My profile"),
    leaf("my-sales", "My Sales", "/member/my-sales", "My sales"),
    leaf("ledger-payments", "Ledger and Payments", "/member/ledger", "Ledger & payments"),
    leaf("my-inputs", "My Inputs", "/member/my-inputs", "My inputs"),
    leaf("messages-support", "Messages and Support", "/member/messages", "Messages & support"),
  ]),
];

const shareholderTree: NavigationNode[] = [
  overview("/home", "Home", "Home"),
  single("my-shares", "My Shares", "/member/my-shares", "My shares", HandCoins),
  group("fpc", "FPC", Building2, [
    leaf("fpc", "FPC", "/member/fpc", "FPC"),
    leaf("company-information", "Company Information", "/member/company", "Company information"),
  ]),
  single("meetings", "Meetings", "/member/meetings", "Meetings", CalendarDays),
  group("profile-benefits", "Profile and Benefits", UserRound, [
    leaf("profile", "Profile", "/member/profile", "Profile"),
    leaf("shareholding", "My Shareholding", "/member/shareholding", "My shareholding"),
    leaf("dividend-benefits", "Dividend and Benefits", "/member/dividend-benefits", "Dividend & benefits"),
    leaf("messages-support", "Messages and Support", "/member/messages", "Messages & support"),
  ]),
];

export const navigationConfig: Record<Role, readonly NavigationNode[]> = {
  "TSF Central Admin": tsfTree,
  "FPC Admin / Manager": fpcAdminTree,
  "Accountant / Finance Officer": accountantTree,
  "Procurement / Purchase Officer": procurementTree,
  "Sales / Marketing Officer": salesTree,
  "Inventory / Stock Manager": inventoryTree,
  "Data Entry Operator": dataEntryTree,
  "Compliance / Documentation Officer": complianceTree,
  "Field Staff": fieldTree,
  "Director / Board Member / Auditor": directorTree,
  Farmer: farmerTree,
  Shareholder: shareholderTree,
};

export function isNavigationNodeAllowed(role: Role, node: NavigationNode): boolean {
  return node.roles.includes(role) && (!node.permission || can(role, node.permission.module, node.permission.action));
}

export function getRoleNavigation(role: Role): NavigationNode[] {
  const filter = (nodes: readonly NavigationNode[]): NavigationNode[] => nodes.flatMap((node) => {
    if (!isNavigationNodeAllowed(role, node)) return [];
    const children = node.children ? filter(node.children) : undefined;
    if (node.children && !children?.length) return [];
    return [{ ...node, ...(children ? { children } : {}) }];
  });
  return filter(navigationConfig[role] ?? []);
}

export type NavigationCrumb = { id: string; label: string; route: string; current: boolean };

function normalizePath(path: string): string {
  const decoded = decodeURIComponent(path.split("?")[0] || "/").replace(/\/+$/, "");
  return decoded || "/";
}

function matchRoute(route: string, path: string): boolean {
  const routeParts = normalizePath(route).split("/").filter(Boolean);
  const pathParts = normalizePath(path).split("/").filter(Boolean);
  return routeParts.length === pathParts.length && routeParts.every((part, index) =>
    part.startsWith(":") || part === pathParts[index]);
}

export function getNavigationBreadcrumbs(role: Role, currentPath: string, recordName?: string): NavigationCrumb[] {
  const normalized = normalizePath(currentPath);
  const path = normalized === "/fpc-profile/change-history" ? "/reports/change-history" : normalized;
  for (const parent of getRoleNavigation(role)) {
    const children = parent.children ?? [];
    const child = children.find((node) => node.route && !node.route.includes(":") && matchRoute(node.route, path))
      ?? children.find((node) => node.route && matchRoute(node.route, path));
    if (child?.route) {
      return [
        { id: parent.id, label: parent.label, route: parent.route ?? parent.children?.[0]?.route ?? child.route, current: false },
        { id: child.id, label: child.label, route: child.route, current: true },
      ];
    }
    const detail = children.find((node) => node.detailRoute && matchRoute(node.detailRoute, path));
    if (detail?.detailRoute && detail.route) {
      return [
        { id: parent.id, label: parent.label, route: parent.route ?? parent.children?.[0]?.route ?? detail.route, current: false },
        { id: detail.id, label: recordName || "Farmer Details", route: detail.route, current: true },
      ];
    }
    if (parent.route && matchRoute(parent.route, path)) {
      return [{ id: parent.id, label: parent.label, route: parent.route, current: true }];
    }
  }
  const matching = getRoleNavigation(role).find((node) => node.route && matchRoute(node.route, path));
  return matching?.route ? [{ id: matching.id, label: matching.label, route: matching.route, current: true }] : [];
}

export function getActiveNavigationModule(role: Role, currentPath: string): string | undefined {
  return getNavigationBreadcrumbs(role, currentPath).at(-1)?.label;
}
