export const roles = [
  "TSF Central Admin", "FPC Admin / Manager", "Accountant / Finance Officer",
  "Procurement / Purchase Officer", "Sales / Marketing Officer", "Inventory / Stock Manager",
  "Data Entry Operator", "Compliance / Documentation Officer", "Field Staff",
  "Director / Board Member / Auditor", "Farmer", "Shareholder",
] as const;
export type Role = typeof roles[number];
export const roleUsers: Record<Role, { name: string; mobile: string; initials: string }> = {
  "TSF Central Admin": { name: "Neha Sharma", mobile: "99XXXX6600", initials: "NS" },
  "FPC Admin / Manager": { name: "Bijay Kumar Mohanty", mobile: "98XXXX4412", initials: "BM" },
  "Accountant / Finance Officer": { name: "Anita Das", mobile: "97XXXX2210", initials: "AD" },
  "Procurement / Purchase Officer": { name: "Prakash Rout", mobile: "99XXXX7781", initials: "PR" },
  "Sales / Marketing Officer": { name: "Mamata Jena", mobile: "94XXXX5503", initials: "MJ" },
  "Inventory / Stock Manager": { name: "Sanjay Tudu", mobile: "91XXXX6094", initials: "ST" },
  "Data Entry Operator": { name: "Pooja Nayak", mobile: "93XXXX1187", initials: "PN" },
  "Compliance / Documentation Officer": { name: "Rakesh Hembram", mobile: "98XXXX3329", initials: "RH" },
  "Field Staff": { name: "Suman Naik", mobile: "90XXXX8845", initials: "SN" },
  "Director / Board Member / Auditor": { name: "Dr. Ashok Panda", mobile: "98XXXX1002", initials: "AP" },
  Farmer: { name: "Ravi Kumar", mobile: "98XXXX2241", initials: "RK" },
  Shareholder: { name: "Ravi Kumar", mobile: "98XXXX2241", initials: "RK" },
};
export const navByRole: Record<Role, string[]> = {
  "TSF Central Admin": ["National dashboard", "Monitoring", "Network view", "Journey view", "FPC onboarding", "FPC pending approvals", "FPC directory", "Analytics", "Consolidated MIS", "Shareholder reports", "Users & settings", "Audit & support"],
  "FPC Admin / Manager": ["Overview", "Analytics", "Setup checklist", "Approvals", "FPC profile", "Farmers", "Multi-FPC links", "Deleted farmers", "Register farmer", "Shareholders", "Register shareholder", "Certificates", "Produce Purchase", "Input Sale", "Produce Sale", "Input Purchase", "Farmer Settlement", "Advances & Dues", "Inventory", "Stock register", "Movements", "Adjustments", "Commodity & unit master", "Unit converter", "Baseline", "Commodity Baseline reports", "Buyer master", "Supplier master", "Finance", "Farmer ledger", "Buyer ledger", "Supplier ledger", "Cash book", "Bank book", "Receipts and payments", "Expense register", "Income & expenditure", "Profit & loss", "FPC rates", "Compliance", "Statutory calendar", "Filing tracker", "Meeting records", "Document vault", "User management", "Bank accounts", "Reports & gallery", "Messages", "Audit trail", "Sync centre", "Settings"],
  "Accountant / Finance Officer": ["Finance dashboard", "Approvals", "Farmer ledger", "Buyer ledger", "Payments", "Wallet transactions", "Expenses", "Share capital", "Dividends", "Shareholder register", "Certificates", "Produce Purchase", "Input Sale", "Produce Sale", "Input Purchase", "Farmer Settlement", "Advances & Dues", "Shareholder reports", "Reports"],
  "Procurement / Purchase Officer": ["Procurement dashboard", "Produce Purchase", "Input Purchase", "Purchase entries", "Farmers", "Input supply", "Stock register", "FPC rates", "Update rates", "Market rates"],
  "Sales / Marketing Officer": ["Sales dashboard", "Produce Sale", "Input Sale", "Sales entries", "Buyers", "Input supply", "Stock register", "FPC rates", "Market intelligence"],
  "Inventory / Stock Manager": ["Stock dashboard", "Inventory", "Stock register", "Movements", "Godowns", "Adjustments", "Unit converter"],
  "Data Entry Operator": ["Data entry home", "Farmers", "Register farmer", "Shareholders", "Register shareholder", "Purchases", "Sales", "Bulk upload", "Sync centre", "Rejected entries"],
  "Compliance / Documentation Officer": ["Compliance dashboard", "Filing calendar", "Meetings", "Document vault", "Shareholder register", "Certificates", "Shareholder reports", "Gallery", "Reports"],
  "Field Staff": ["Field home", "Register farmer", "Baseline survey", "Purchase draft", "My farmers", "Gallery upload", "Sync centre"],
  "Director / Board Member / Auditor": ["Oversight dashboard", "Farmers", "Shareholders", "Purchases", "Sales", "Inventory", "Stock", "Finance", "Compliance", "Shareholder reports", "Commodity Baseline reports", "Audit trail", "Board pack"],
  Farmer: ["Home", "Sell produce", "Buy inputs", "Wallet", "Transaction history", "FPC rates", "My profile", "My sales", "Ledger & payments", "My inputs", "Messages & support"],
  Shareholder: ["Home", "My shares", "FPC", "Meetings", "Profile", "My shareholding", "Dividend & benefits", "Company information", "Messages & support"],
};
const full = "VCEDA XU".replaceAll(" ", "");
const readExport = "VX";
export const permissions: Record<string, Record<string, string>> = {
  "TSF Central Admin": { "*": readExport, "FPC onboarding":full, "Monitoring":"VCEA", "Journey view":"VX", "Users & settings":full, "Audit & support":"VCEA", "Consolidated MIS":"VCX", "Shareholder reports":"VX", "Commodity Baseline reports":"VX", "Inventory":"VX", "Stock register":"VX", "Movements":"VX" },
  "FPC Admin / Manager": { "*": full },
  "Accountant / Finance Officer": {
    "Finance dashboard": full, "Farmer ledger": full, "Buyer ledger": full, Payments: full,
    Expenses: full, "Share capital": full, Dividends: full, Reports: readExport, Purchases: "V", Sales: "V", "Wallet transactions":"VAX", "Shareholder reports":"VX", "Shareholder register":"VX", "Certificates":"VX", "Produce Purchase":full, "Input Purchase":full, "Produce Sale":full, "Input Sale":full, "Approvals":full, "Farmer Settlement":"VX", "Advances & Dues":full,
  },
  "Procurement / Purchase Officer": { "Procurement dashboard":"V", "Purchase entries":"VCE", "Produce Purchase":"VCE", "Input Purchase":"VCE", Farmers:"V", "Input supply":"VCE", "Stock register":"V", "Market rates":"V", "FPC rates":"V", "Update rates":"VCE" },
  "Sales / Marketing Officer": { "Sales dashboard":"V", "Sales entries":"VCE", "Produce Sale":"VCE", "Input Sale":"VCE", Buyers:"VCE", "Input supply":"VCE", "Stock register":"V", "Market intelligence":"V", "FPC rates":"V" },
  "Inventory / Stock Manager": { "Stock dashboard":"V", Inventory:full, "Stock register":full, Movements:full, Godowns:full, Adjustments:full, "Unit converter":"V", Commodities:"VE", "Purchase entries":"V", "Sales entries":"V" },
  "Data Entry Operator": { "Data entry home":"V", Farmers:"VCE", "Register farmer":"VCE", Shareholders:"VCE", "Register shareholder":"VCE", Purchases:"VCE", Sales:"VCE", "Bulk upload":"VC", "Sync centre":"VCE", "Rejected entries":"VCE" },
  "Compliance / Documentation Officer": { "Compliance dashboard":"V", "Filing calendar":full, Meetings:full, "Document vault":full, "Shareholder register":"VX", Certificates:"VX", "Shareholder reports":"VX", Gallery:full, Reports:readExport },
  "Field Staff": { "Field home":"V", "Register farmer":"VCEU", "Baseline survey":"VCEU", "Purchase draft":"VCE", "My farmers":"V", "Gallery upload":"VU", "Sync centre":"VCE" },
  "Director / Board Member / Auditor": { "*":readExport, "Shareholder reports":"VX", "Commodity Baseline reports":"VX", Inventory:"VX", "Stock register":"VX", Movements:"VX" },
  Farmer: { "*":"V", "Sell produce":"VC", "Buy inputs":"VC", Wallet:"VC", "Transaction history":"V", "FPC rates":"V" },
  Shareholder: { "*":"V", "FPC rates":"V", "Shareholder reports":"V" },
};
export const can = (role: Role, module: string, action: "V"|"C"|"E"|"D"|"A"|"X"|"U" = "V") => {
  const access = permissions[role];
  const moduleActions = access?.[module] || access?.["*"] || "";
  return moduleActions.includes(action);
};
export const labels: Record<string, Record<string, string>> = {
  Hindi: { "Overview": "अवलोकन", "Approvals": "अनुमोदन", "Farmers": "किसान", "Shareholders": "शेयरधारक", "Purchases": "खरीद", "Sales": "बिक्री", "Inventory": "भंडार", "Finance": "वित्त", "Settings": "सेटिंग्स", "Home": "होम" },
  Odia: { "Overview": "ସମୀକ୍ଷା", "Approvals": "ଅନୁମୋଦନ", "Farmers": "ଚାଷୀ", "Shareholders": "ଅଂଶୀଦାର", "Purchases": "କ୍ରୟ", "Sales": "ବିକ୍ରୟ", "Inventory": "ଭଣ୍ଡାର", "Finance": "ଅର୍ଥ", "Home": "ମୂଳପୃଷ୍ଠା" },
};
