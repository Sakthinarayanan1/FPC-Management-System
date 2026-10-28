import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronRight, Download, FileText, Plus, Printer, RefreshCw, Search, ShieldCheck, Wifi, WifiOff, X } from "lucide-react";
import { convert, money, type RecordRow, type State } from "@/lib/store";
import FpcReports from "./FpcReports";
import FpcManagement from "./FpcManagement";
import "./admin-modules.css";

type Props = {
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  role: string;
  screen: string;
  setToast: (message: string) => void;
  go: (screen: string) => void;
};

const rows = (state: State, key: string): RecordRow[] => state.records?.[key] || [];
const now = () => new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
let idCounter = 0;
const id = (prefix: string) => `${prefix}${Date.now().toString().slice(-7)}-${++idCounter}`;
const notice = (title: string, recipient = "FPC Admin / Manager"): RecordRow => ({ id: id("NT-"), title, recipient, date: "Just now", status: "Unread", fpcId: "FPC-ODI-001" });
const auditEntry = (role: string, module: string, record: string, action: string, oldValue?: unknown, newValue?: unknown): RecordRow => ({
  id: id("AUD-"), actor: role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role, role, module, record, action,
  oldValue: oldValue === undefined ? "" : JSON.stringify(oldValue), newValue: newValue === undefined ? "" : JSON.stringify(newValue), date: now(), fpcId: "FPC-ODI-001",
});
const stampCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
function exportCsv(filename: string, data: RecordRow[]) {
  if (!data.length) return;
  const columns = [...new Set(data.flatMap((row) => Object.keys(row).filter((key) => key !== "fpcId")))];
  const content = [columns.map(stampCsv).join(","), ...data.map((row) => columns.map((column) => stampCsv(row[column])).join(","))].join("\r\n");
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Header({ kicker, title, description, right }: { kicker: string; title: string; description: string; right?: ReactNode }) {
  return <header className="am-header"><div><span className="am-kicker">{kicker}</span><h2>{title}</h2><p>{description}</p></div><div className="am-head-right">{right}</div></header>;
}
function Pill({ children, tone = "" }: { children: ReactNode; tone?: string }) { return <span className={`am-pill ${tone}`}>{children}</span>; }
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="am-metric"><small>{label}</small><b>{value}</b><span>{note}</span></div>; }
function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="am-table-wrap"><table className="am-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
const empty = (text: string) => <div className="am-empty">{text}</div>;

type ChecklistItem = { group: string; name: string; target: string; test: (state: State) => boolean; incomplete?: "Partly" | "Not started" };
const setupItems: ChecklistItem[] = [
  { group: "Company & governance", name: "FPC legal profile", target: "FPC profile", test: s => rows(s, "fpcs").length > 0 },
  { group: "Company & governance", name: "Company documents", target: "Document vault", test: s => rows(s, "documents").length > 0 },
  { group: "Company & governance", name: "Bank account details", target: "Bank book", test: s => rows(s, "payments").length > 0 },
  { group: "Company & governance", name: "Board and user roster", target: "User management", test: s => rows(s, "users").length > 0 },
  { group: "Company & governance", name: "Annual meeting calendar", target: "Meeting records", test: s => rows(s, "meetings").length > 0 },
  { group: "Membership & farmers", name: "Farmer register", target: "Farmers", test: s => rows(s, "farmers").length >= 100 },
  { group: "Membership & farmers", name: "Farmer unique IDs", target: "Farmers", test: s => rows(s, "farmers").every(f => Boolean(f.id)) },
  { group: "Membership & farmers", name: "Farmer KYC records", target: "Farmers", test: s => rows(s, "farmers").some(f => f.kyc === "Verified") },
  { group: "Membership & farmers", name: "Shareholder register", target: "Shareholders", test: s => rows(s, "shareholders").length > 0 },
  { group: "Membership & farmers", name: "Paid-up share capital", target: "Shareholders", test: s => rows(s, "shareholders").reduce((n, x) => n + Number(x.capital || 0), 0) > 0 },
  { group: "Membership & farmers", name: "Share certificate register", target: "Certificates", test: s => (s.certificates || []).length > 0 },
  { group: "Membership & farmers", name: "Farmer baseline", target: "Baseline", test: s => rows(s, "baseline").length > 0 },
  { group: "Agri business", name: "Commodity master", target: "Commodity & unit master", test: s => rows(s, "commodities").length > 0 },
  { group: "Agri business", name: "Unit and pack-size master", target: "Unit converter", test: s => rows(s, "commodities").some(c => c.baseUnit) },
  { group: "Agri business", name: "Buyer master", target: "Buyer master", test: s => rows(s, "buyers").length >= 6 },
  { group: "Agri business", name: "Supplier master", target: "Supplier master", test: s => rows(s, "suppliers").length >= 5 },
  { group: "Agri business", name: "Produce purchase register", target: "Produce Purchase", test: s => rows(s, "purchases").length > 0 },
  { group: "Agri business", name: "Input purchase workflow", target: "Input Purchase", test: s => rows(s, "inputPurchaseApprovals").length > 0 },
  { group: "Agri business", name: "Produce sales register", target: "Produce Sale", test: s => rows(s, "sales").length > 0 },
  { group: "Agri business", name: "Input sales workflow", target: "Input Sale", test: s => rows(s, "inputSaleApprovals").length > 0 },
  { group: "Agri business", name: "Produce inventory", target: "Inventory", test: s => rows(s, "commodities").some(c => Number(c.stock) > 0) },
  { group: "Agri business", name: "Input inventory", target: "Inventory", test: s => (s.inputCatalog || []).length > 0 },
  { group: "Agri business", name: "Godown register", target: "Godowns", test: s => rows(s, "godowns").length > 0 },
  { group: "Agri business", name: "Stock movement register", target: "Movements", test: s => rows(s, "inventoryEvents").length > 0 },
  { group: "Finance & controls", name: "Farmer ledger", target: "Farmer ledger", test: s => rows(s, "ledger").length > 0 },
  { group: "Finance & controls", name: "Buyer ledger", target: "Buyer ledger", test: s => rows(s, "sales").length > 0 },
  { group: "Finance & controls", name: "Supplier ledger", target: "Supplier ledger", test: s => rows(s, "suppliers").length > 0 },
  { group: "Finance & controls", name: "Cash book", target: "Cash book", test: s => rows(s, "payments").length > 0 },
  { group: "Finance & controls", name: "Bank book", target: "Bank book", test: s => rows(s, "payments").length > 0 },
  { group: "Finance & controls", name: "Expense register", target: "Expense register", test: s => rows(s, "expenses").length > 0 },
  { group: "Finance & controls", name: "FPC audit trail", target: "Audit trail", test: s => s.audit.length >= 80 },
  { group: "Finance & controls", name: "Receipts and payment reconciliation", target: "Receipts and payments", test: s => rows(s, "payments").some(x => x.status === "Reconciled"), incomplete: "Partly" },
  { group: "Finance & controls", name: "Income and expenditure review", target: "Income & expenditure", test: s => rows(s, "periodCloses").some(x => x.statement === "Income & expenditure"), incomplete: "Partly" },
  { group: "Compliance & network", name: "Filing tracker", target: "Filing tracker", test: s => rows(s, "filings").length > 0 && !rows(s, "filings").some(x => x.status === "Overdue"), incomplete: "Partly" },
  { group: "Compliance & network", name: "Admin filing approvals", target: "Filing tracker", test: s => rows(s, "filings").some(x => x.adminStatus === "Approved"), incomplete: "Partly" },
  { group: "Compliance & network", name: "Licence renewals", target: "Licences", test: s => rows(s, "licenseRecords").every(x => x.status === "Active"), incomplete: "Partly" },
  { group: "Compliance & network", name: "Multi-FPC link review", target: "Multi-FPC links", test: s => rows(s, "farmerLinkRequests").every(x => x.status !== "Submitted"), incomplete: "Partly" },
  { group: "Compliance & network", name: "Profile and sub-user changes", target: "Approvals", test: s => [...rows(s, "profileChangeRequests"), ...rows(s, "userChangeRequests")].every(x => x.status !== "Submitted"), incomplete: "Partly" },
  { group: "Compliance & network", name: "Dividend and patronage approval", target: "Approvals", test: s => rows(s, "dividendRuns").some(x => x.status === "Approved"), incomplete: "Partly" },
  { group: "Compliance & network", name: "Budget and target review", target: "Analytics", test: s => rows(s, "periodTargets").some(x => x.status === "Approved"), incomplete: "Not started" },
  { group: "Compliance & network", name: "Offline draft sync queue", target: "Sync centre", test: s => s.syncQueue.some(x => x.type === "FPC onboarding" || x.type === "FPC company profile" || x.type === "FPC bulk import"), incomplete: "Partly" },
];
function checklistStatus(item: ChecklistItem, state: State): "Done" | "Partly" | "Not started" {
  if (item.test(state)) return "Done";
  return item.incomplete || "Not started";
}
function checklistCounts(state: State) {
  const statuses = setupItems.map(item => checklistStatus(item, state));
  return { done: statuses.filter(status => status === "Done").length, partly: statuses.filter(status => status === "Partly").length, total: setupItems.length };
}

export function SetupDashboardCard({ state, go }: { state: State; go: (screen: string) => void }) {
  const summary = checklistCounts(state);
  const percentage = Math.round(summary.done / summary.total * 100);
  return <button className="am-setup-card" onClick={() => go("Setup checklist")} data-testid="setup-checklist-dashboard">
    <span className="am-setup-icon"><ShieldCheck size={19}/></span>
    <span className="am-setup-copy"><b>FPC setup checklist: {summary.done} of {summary.total} done ({percentage}%)</b><small>{summary.partly} partly complete · Continue setup</small><i><span style={{ width: `${percentage}%` }} /></i></span>
    <ChevronRight size={19}/>
  </button>;
}

function SetupChecklist({ state, role, go }: Pick<Props, "state" | "role" | "go">) {
  const summary = checklistCounts(state);
  const isTsf = role === "TSF Central Admin";
  const grouped = [...new Set(setupItems.map(item => item.group))];
  return <section className="am-module">
    <Header kicker={isTsf ? "TSF · read-only journey" : "FPC administration"} title={isTsf ? "FPC setup journey" : "FPC setup checklist"} description={isTsf ? "Read-only completion view across the partner network. Select Green Valley to see the same live checklist as the FPC Admin." : "41 setup checks grouped by module. Status is calculated from this FPC’s saved records; open any row to complete it."} right={!isTsf && <Pill tone="green">{summary.done} / {summary.total} done · {Math.round(summary.done / summary.total * 100)}%</Pill>}/>
    {isTsf && <div className="am-network-summary"><div><b>Green Valley FPC</b><small>Same live FPC checklist</small></div><Pill tone="green">{summary.done}/{summary.total} · {Math.round(summary.done / summary.total * 100)}%</Pill><div><b>Gonda Tribal Farmers FPC</b><small>Last sync 12 days ago</small></div><Pill tone="warn">Stale · 12 days</Pill></div>}
    <div className="am-checklist-summary"><Metric label="Done" value={String(summary.done)} note="Verified from saved records"/><Metric label="Partly complete" value={String(summary.partly)} note="Action or review is pending"/><Metric label="Not started" value={String(summary.total - summary.done - summary.partly)} note="No setup record yet"/></div>
    <div className="am-checklist-groups">{grouped.map(group => <section className="am-card" key={group}><div className="am-card-heading"><h3>{group}</h3><span>{setupItems.filter(item => item.group === group).filter(item => checklistStatus(item, state) === "Done").length}/{setupItems.filter(item => item.group === group).length} complete</span></div><div className="am-checklist-list">{setupItems.filter(item => item.group === group).map((item, index) => { const status = checklistStatus(item, state); return <button key={item.name} className="am-checklist-row" onClick={() => go(item.target)} data-testid={`setup-item-${item.name.toLowerCase().replaceAll(" ", "-")}`}><span className={`am-check ${status === "Done" ? "done" : status === "Partly" ? "partial" : ""}`}>{status === "Done" ? <Check size={13}/> : status === "Partly" ? "–" : ""}</span><span><b>{item.name}</b><small>{group} · {item.target}</small></span><Pill tone={status === "Done" ? "green" : status === "Partly" ? "warn" : ""}>{status}</Pill><ChevronRight size={15}/></button>; })}</div></section>)}</div>
    {isTsf && <div className="am-callout"><WifiOff size={16}/><span><b>Gonda sync follow-up</b><small>Gonda Tribal Farmers FPC has not synced for 12 days. This journey screen is view-only.</small></span></div>}
  </section>;
}

const inboxTabs = [
  ["Produce purchases", "purchases"], ["Farmer registrations", "farmerApplications"], ["Stock adjustments", "adjustments"], ["Expense claims", "expenses"],
  ["Input Purchases (Flow D)", "inputPurchaseApprovals"], ["Input Sales (Flow B)", "inputSaleApprovals"], ["Dividends and patronage runs", "dividendRuns"],
  ["Farmer link requests", "farmerLinkRequests"], ["Profile changes", "profileChangeRequests"], ["Sub-user changes", "userChangeRequests"],
] as const;
function Approvals({ state, setState, role, setToast }: Props) {
  const [tab, setTab] = useState<string>(inboxTabs[0][0]);
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const key = inboxTabs.find(item => item[0] === tab)?.[1] || "inputPurchaseApprovals";
  const pending = rows(state, key).filter(item => item.status === "Submitted" || item.status === "Pending");
  const decide = (record: RecordRow, approved: boolean, reason = "", splitWallet = false) => {
    if (state.offline) { setToast("Approvals need a connection"); return; }
    if (!approved && !reason.trim()) { setToast("A reason is required to reject this item."); return; }
    const inputLines = (record.items || []) as RecordRow[];
    if (approved && key === "inputSaleApprovals") {
      const balance = Number(state.walletBalances[record.farmerId] || 0);
      const item = inputLines[0] && (state.inputCatalog || []).find(row => row.name === inputLines[0].name);
      if (Number(record.amount || 0) > balance && !splitWallet) { setToast(`Wallet shortfall for ${record.farmer || record.party}: available ${money(balance)}, voucher ${money(Number(record.amount || 0))}. Reduce the items, reject, or choose wallet + due.`); return; }
      if (Number(record.amount || 0) > balance && splitWallet && balance <= 0) { setToast("No wallet balance is available; reduce the items or reject this sale."); return; }
      if (inputLines.some(line => Number(line.quantity || 0) > Number((state.inputCatalog || []).find(row => row.name === line.name)?.stock || 0))) { setToast(`Insufficient input stock for ${item?.name || record.item}.`); return; }
    }
    const status = approved ? "Approved" : "Rejected";
    const updated = { ...record, status, decidedBy: role, decidedAt: now(), ...(reason ? { rejectionReason: reason.trim() } : {}) };
    setState(s => {
      let next: State = { ...s, records: { ...s.records, [key]: (s.records[key] || []).map(item => item.id === record.id ? updated : item) } };
      if (key === "farmerApplications" && approved) {
        next.records = { ...next.records, farmers: [{ ...record, status: "Active", kyc: record.kyc || "Submitted" }, ...rows(next, "farmers").filter(item => item.id !== record.id)] };
        next.walletBalances = { ...next.walletBalances, [record.id]: 0 };
      }
      if (key === "purchases" && approved) {
        const quantityKg = convert(Number(record.quantity || 0), String(record.unit || "kg"), "kg");
        const commodity = rows(next, "commodities").find(item => item.name === record.commodity);
        if (commodity) next.records = { ...next.records, commodities: rows(next, "commodities").map(item => item.id === commodity.id ? { ...item, stock: Number(item.stock || 0) + quantityKg } : item) };
        next.records = { ...next.records, inventoryEvents: [{ id: id("MOV-"), date: record.date || now(), inventory: "Produce", item: record.commodity, type: "Purchase in", voucher: record.id, party: record.farmer, quantityIn: quantityKg, quantityOut: 0, unit: "kg", status: "Posted", fpcId: "FPC-ODI-001" }, ...rows(next, "inventoryEvents")] };
      }
      if (key === "adjustments" && approved) {
        const currentItem = rows(next, "commodities").find(item => item.name === record.item || String(record.item).includes(String(item.name).split(" ")[0]));
        if (currentItem) next.records = { ...next.records, commodities: rows(next, "commodities").map(item => item.id === currentItem.id ? { ...item, stock: Math.max(0, Number(item.stock || 0) + Number(record.quantity || 0)) } : item) };
        else next.inputCatalog = (next.inputCatalog || []).map(item => item.name === record.item ? { ...item, stock: Math.max(0, Number(item.stock || 0) + Number(record.quantity || 0)) } : item);
      }
      if ((key === "inputPurchaseApprovals" || key === "inputSaleApprovals") && approved) {
        const direction = key === "inputPurchaseApprovals" ? 1 : -1;
        const changed = (next.inputCatalog || []).map(stock => {
          const line = inputLines.find(candidate => candidate.name === stock.name);
          return line ? { ...stock, stock: Math.max(0, Number(stock.stock || 0) + direction * Number(line.quantity || 0)) } : stock;
        });
        next.inputCatalog = changed;
        next.records = {
          ...next.records,
          businessTransactions: [{ id: record.id, flow: key === "inputPurchaseApprovals" ? "D" : "B", flowName: record.flowName, party: record.party, item: record.item, items: record.items, quantity: record.quantity, unit: record.unit, amount: record.amount, date: record.date, status: "Approved", stockDirection: direction > 0 ? "IN" : "OUT", fpcId: "FPC-ODI-001" }, ...rows(next, "businessTransactions")],
          inventoryEvents: [...inputLines.map(line => ({ id: id("MOV-"), date: record.date || now(), inventory: "Input", item: line.name, type: direction > 0 ? "Purchase in" : "Sale out", voucher: record.id, party: record.party, quantityIn: direction > 0 ? Number(line.quantity || 0) : 0, quantityOut: direction < 0 ? Number(line.quantity || 0) : 0, unit: line.unit, status: "Posted", fpcId: "FPC-ODI-001" })), ...rows(next, "inventoryEvents")],
        };
        if (key === "inputSaleApprovals") {
          const available = Number(next.walletBalances[record.farmerId] || 0);
          const debit = Math.min(available, Number(record.amount || 0));
          const due = Math.max(0, Number(record.amount || 0) - debit);
          next.walletBalances = { ...next.walletBalances, [record.farmerId]: available - debit };
          if (due) next.records = { ...next.records, farmerDues: [{ id: id("DUE-"), farmerId: record.farmerId, farmer: record.party, source: record.id, amount: due, status: "Open", date: record.date, fpcId: "FPC-ODI-001" }, ...rows(next, "farmerDues")] };
        }
      }
      if (key === "profileChangeRequests") {
        const field = String(record.field || "");
        if (record.entityType === "FPC" || record.recordType === "FPC") {
          const path = String(record.path || record.fieldPath || field).split(".").filter(Boolean);
          const fpcs = rows(next, "fpcs").map(item => {
            if (item.id !== record.recordId && item.fpcId !== record.recordId) return item;
            const details = { ...(item.details || {}) };
            if (approved && path.length) {
              let cursor: Record<string, unknown> = details;
              path.slice(0, -1).forEach(part => {
                cursor[part] = { ...((cursor[part] as Record<string, unknown> | undefined) || {}) };
                cursor = cursor[part] as Record<string, unknown>;
              });
              cursor[path[path.length - 1]] = record.newValue;
            }
            const pendingChanges = { ...((details.pendingChanges as Record<string, unknown> | undefined) || {}) };
            delete pendingChanges[String(record.pendingKey || field)];
            if (Object.keys(pendingChanges).length) details.pendingChanges = pendingChanges;
            else delete details.pendingChanges;
            return { ...item, details, lastUpdated: now() };
          });
          next.records = { ...next.records, fpcs };
        } else {
          if (approved) {
            const property = field.toLowerCase().includes("bank") ? "account" : field.toLowerCase().includes("mobile") ? "mobile" : field.toLowerCase().replaceAll(" ", "");
            next.records = { ...next.records, farmers: rows(next, "farmers").map(item => item.id === record.recordId ? { ...item, [property]: record.newValue } : item), shareholders: rows(next, "shareholders").map(item => item.farmerId === record.recordId || item.id === record.recordId ? { ...item, [property]: record.newValue } : item) };
          }
        }
      }
      if (key === "userChangeRequests" && approved) {
        const users = rows(next, "users");
        if (record.field === "New sub-user") next.records = { ...next.records, users: [{ id: record.recordId, name: record.newUserName, role: record.newRole, mobile: record.mobile, status: "Active", lastLogin: "Never", fpcId: "FPC-ODI-001" }, ...users] };
        else next.records = { ...next.records, users: users.map(user => user.id === record.recordId ? { ...user, role: record.newValue } : user) };
      }
      if (key === "farmerLinkRequests" && approved) next.records = { ...next.records, multiFpcLinks: [{ ...updated, linkStatus: "Linked" }, ...rows(next, "multiFpcLinks")] };
      if (key === "dividendRuns" && approved) {
        const memberCapital = (record.breakdown || []).reduce((sum: number, line: RecordRow) => sum + Number(line.capital || 0), 0);
        const disbursements: RecordRow[] = (record.breakdown || []).map((line: RecordRow) => ({ id: id("DIV-"), runId: record.id, farmerId: line.memberId, member: line.member, amount: Number(line.amount || 0), patronageBonus: Number(record.patronageBonus || 0) * (Number(line.capital || 0) / Math.max(1, memberCapital)), status: "Approved", date: now(), fpcId: "FPC-ODI-001" }));
        next.records = { ...next.records, dividendDisbursements: [...disbursements, ...rows(next, "dividendDisbursements")] };
        next.notifications = [...disbursements.map(item => notice(`Dividend approved for ${item.member}: ${money(item.amount)} · patronage ${money(item.patronageBonus)}`, String(item.member))), ...next.notifications];
      }
      next.audit = [auditEntry(role, record.entityType === "FPC" || record.recordType === "FPC" ? "Company profile" : "Approvals", record.recordId || record.id, approved ? "approved" : "rejected", record.status, reason ? { status, reason } : status), ...s.audit];
      next.notifications = [notice(`${record.id} ${status.toLowerCase()}`, String(record.submittedBy || record.requestedBy || "FPC Admin / Manager")), ...s.notifications];
      return next;
    });
    setSelected(null);
    setSelectedIds(current => current.filter(item => item !== record.id));
    setToast(`${record.id} ${status.toLowerCase()} · submitter notified`);
  };
  const reject = (record: RecordRow) => { const reason = prompt(`Reason for rejecting ${record.id}:`); if (reason?.trim()) decide(record, false, reason); else setToast("A rejection reason is required."); };
  const bulkApprove = () => {
    if (state.offline) { setToast("Approvals need a connection"); return; }
    const chosen = pending.filter(item => selectedIds.includes(item.id));
    chosen.forEach(item => decide(item, true));
    setToast(`${chosen.length} selected item${chosen.length === 1 ? "" : "s"} approved; submitters notified.`);
  };
  const tabCount = (itemKey: string) => rows(state, itemKey).filter(item => item.status === "Submitted" || item.status === "Pending").length;
  return <section className="am-module">
    <Header kicker="Review queue" title="Approval inbox" description="Review and decide submitted FPC actions. Approvals are disabled while the device is offline." right={<Pill tone={state.offline ? "warn" : "green"}>{state.offline ? "Approvals need a connection" : `${inboxTabs.reduce((sum, item) => sum + tabCount(item[1]), 0)} awaiting review`}</Pill>}/>
    <div className="am-tabs">{inboxTabs.map(([label, itemKey]) => <button key={itemKey} className={tab === label ? "active" : ""} onClick={() => { setTab(label); setSelected(null); setSelectedIds([]); }}>{label}<i>{tabCount(itemKey)}</i></button>)}</div>
    <div className="am-card">
      <div className="am-toolbar"><div><b>{tab}</b><small>{pending.length} pending · select items for bulk approval</small></div><div className="am-actions"><button className="am-button secondary" onClick={() => exportCsv(`approval-${tab.toLowerCase().replaceAll(" ", "-")}`, pending)}><Download size={15}/> Export CSV</button><button className="am-button primary" disabled={state.offline || !selectedIds.length} onClick={bulkApprove}><Check size={15}/> Approve selected ({selectedIds.length})</button></div></div>
      {pending.length ? <Table headers={["", "Reference", "Item / member", "Submitted by", "Date", "Amount", "Status", ""]}>{pending.map(item => <tr key={item.id}><td><input aria-label={`Select ${item.id}`} type="checkbox" checked={selectedIds.includes(item.id)} onChange={e => setSelectedIds(current => e.target.checked ? [...current, item.id] : current.filter(value => value !== item.id))}/></td><td className="am-mono">{item.id}</td><td><b>{item.name || item.party || item.flowName}</b><small>{item.item || item.field || item.reason || item.period || item.farmer || "Review details"}</small></td><td>{item.submittedBy || item.requestedBy || "—"}</td><td>{item.date || item.submittedAt || "—"}</td><td>{item.totalPayout !== undefined ? money(Number(item.totalPayout) + Number(item.patronageBonus || 0)) : item.amount === undefined ? "—" : money(Number(item.amount))}</td><td><Pill tone="warn">{item.status}</Pill></td><td><button className="am-button small" onClick={() => setSelected(item)}>Review</button></td></tr>)}</Table> : empty("No items are waiting in this approval tab.")}
    </div>
    {selected && <div className="am-backdrop" onClick={() => setSelected(null)}><aside className="am-drawer" onClick={event => event.stopPropagation()}><div className="am-drawer-head"><div><span className="am-kicker">{tab}</span><h3>{selected.id}</h3></div><button className="am-icon-button" aria-label="Close details" onClick={() => setSelected(null)}><X size={17}/></button></div>
      {selected.breakdown ? <><div className="am-detail-grid"><div><small>Run</small><b>{selected.name}</b></div><div><small>Submitter</small><b>{selected.submittedBy}</b></div><div><small>Dividend total</small><b>{money(Number(selected.totalPayout || 0))}</b></div><div><small>Patronage bonus</small><b>{money(Number(selected.patronageBonus || 0))}</b></div></div><Table headers={["Shareholder", "Share capital × rate = dividend"]}>{selected.breakdown.map((line: RecordRow) => <tr key={line.memberId}><td>{line.member}<small>{line.memberId}</small></td><td>{money(Number(line.capital))} × {line.rate}% = <b>{money(Number(line.amount))}</b></td></tr>)}</Table><div className="am-notice">Dividend is not guaranteed; declared by the general meeting.</div></> : <div className="am-detail-grid">{Object.entries(selected).filter(([keyName]) => !["fpcId", "breakdown"].includes(keyName)).map(([keyName, value]) => <div key={keyName}><small>{keyName.replaceAll(/([A-Z])/g, " $1")}</small><b>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</b></div>)}</div>}
       <div className="am-drawer-actions"><button className="am-button secondary" onClick={() => setSelected(null)}>Close</button><button className="am-button danger" disabled={state.offline} onClick={() => reject(selected)}>Reject</button>{key === "inputSaleApprovals" && Number(state.walletBalances[selected.farmerId] || 0) > 0 && Number(selected.amount || 0) > Number(state.walletBalances[selected.farmerId] || 0) && <button className="am-button secondary" disabled={state.offline} onClick={() => decide(selected, true, "", true)}>Approve wallet + due</button>}<button className="am-button primary" disabled={state.offline} onClick={() => decide(selected, true)}><Check size={15}/> Approve</button></div>
      {state.offline && <p className="am-offline-note"><WifiOff size={14}/> Approvals need a connection.</p>}
    </aside></div>}
  </section>;
}

const buyerFields = [
  ["name", "Buyer name"], ["type", "Buyer type", ["Mill", "Trader", "Government agency", "Retail"]], ["gstin", "GSTIN"], ["pan", "PAN"], ["contact", "Contact person"], ["mobile", "Mobile"], ["address", "Address"], ["creditLimit", "Credit limit (Rs)", "number"], ["paymentTerms", "Payment terms (days)", "number"], ["status", "Status", ["Active", "Inactive"]],
] as const;
const supplierFields = [
  ["name", "Supplier name"], ["category", "Category", ["Fertiliser", "Pesticide", "Seed", "Equipment"]], ["gstin", "GSTIN"], ["contact", "Contact"], ["address", "Address"], ["paymentTerms", "Payment terms (days)", "number"], ["bankAccount", "Bank account"], ["status", "Status", ["Active", "Inactive"]],
] as const;
function PartyMaster({ state, setState, role, screen, setToast, go }: Props) {
  const isBuyer = screen === "Buyer master";
  const key = isBuyer ? "buyers" : "suppliers";
  const label = isBuyer ? "Buyer" : "Supplier";
  const fields = isBuyer ? buyerFields : supplierFields;
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [profile, setProfile] = useState<RecordRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const parties = rows(state, key).filter(item => item.status !== "Deleted" && `${Object.values(item).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const open = (row?: RecordRow) => { setEditing(row || null); setForm(Object.fromEntries(fields.map(([field]) => [field, String(row?.[field] ?? "")]))); setModal(true); };
  const save = () => {
    if (!form.name?.trim()) { setToast(`${label} name is required.`); return; }
    const finalStatus = form.status || editing?.status || "Active";
    const record: RecordRow = { ...(editing || {}), ...form, id: editing?.id || id(isBuyer ? "BUY-" : "SUP-"), status: state.offline ? "Draft" : finalStatus, ...(state.offline ? { pendingStatus: finalStatus } : {}), fpcId: "FPC-ODI-001", paymentTerms: Number(form.paymentTerms || 0), ...(isBuyer ? { creditLimit: Number(form.creditLimit || 0), openBalance: Number(editing?.openBalance || 0) } : { openBalance: Number(editing?.openBalance || 0) }) };
    setState(s => {
      const current = rows(s, key);
      const next = editing ? current.map(item => item.id === record.id ? record : item) : [record, ...current];
      return { ...s, records: { ...s.records, [key]: next }, audit: [auditEntry(role, "Agri Business · Masters", record.id, editing ? "edited party master" : "created party master", editing || undefined, record), ...s.audit], notifications: [notice(`${label} ${record.name} ${editing ? "updated" : "added"}`), ...s.notifications], ...(s.offline ? { syncQueue: [{ id: id("SYNC-"), type: `${label} master`, record: record.id, status: "Pending sync" }, ...s.syncQueue] } : {}) };
    });
    setModal(false); setToast(state.offline ? `${label} saved offline · queued to sync` : `${label} ${editing ? "updated" : "created"}`);
  };
  const remove = (party: RecordRow) => {
    if (Number(party.openBalance || 0) > 0) { setToast(`${party.name} has ${money(Number(party.openBalance))} outstanding`); return; }
    const reason = prompt(`Reason for soft deleting ${party.name}:`);
    if (!reason?.trim()) { setToast("A deletion reason is required."); return; }
    const updated = { ...party, status: "Deleted", deletedAt: now(), deleteReason: reason.trim() };
    setState(s => ({ ...s, records: { ...s.records, [key]: rows(s, key).map(item => item.id === party.id ? updated : item) }, audit: [auditEntry(role, "Agri Business · Masters", party.id, "soft-deleted party", party, updated), ...s.audit], notifications: [notice(`${label} ${party.name} was soft deleted`), ...s.notifications] }));
    setToast(`${label} soft deleted.`);
  };
  const transactions = (party: RecordRow) => isBuyer
    ? rows(state, "sales").filter(item => String(item.buyer || "").toLowerCase().includes(String(party.name).toLowerCase()))
    : rows(state, "businessTransactions").filter(item => item.flow === "D" && String(item.party || "").toLowerCase().includes(String(party.name).toLowerCase()));
  return <section className="am-module">
    <Header kicker="Agri Business · Masters" title={`${label} master`} description={`Create, edit, export and review ${label.toLowerCase()} records. Deletion is soft and blocked while an open balance remains.`} right={<div className="am-actions"><button className="am-button secondary" onClick={() => go("Farmers")}>View farmers</button><button className="am-button secondary" onClick={() => go(isBuyer ? "Supplier master" : "Buyer master")}>View {isBuyer ? "suppliers" : "buyers"}</button><button className="am-button primary" onClick={() => open()}><Plus size={15}/> Add {label.toLowerCase()}</button></div>}/>
    <div className="am-card">
      <div className="am-toolbar"><div className="am-search"><Search size={15}/><input aria-label={`Search ${label}s`} value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}, GSTIN, contact`}/></div><button className="am-button secondary" onClick={() => exportCsv(`${label.toLowerCase()}-master`, parties)}><Download size={15}/> Export Excel CSV</button></div>
      <Table headers={isBuyer ? ["Buyer", "Type", "GSTIN", "Contact", "Mobile", "Credit limit", "Terms", "Open balance", "Status", "Actions"] : ["Supplier", "Category", "GSTIN", "Contact", "Payment terms", "Bank account", "Open balance", "Status", "Actions"]}>
        {parties.map(party => <tr key={party.id}>{isBuyer ? <><td><b>{party.name}</b><small>{party.address}</small></td><td>{party.type}</td><td>{party.gstin || "—"}</td><td>{party.contact || "—"}</td><td>{party.mobile || "—"}</td><td>{money(Number(party.creditLimit || 0))}</td><td>{party.paymentTerms} days</td></> : <><td><b>{party.name}</b><small>{party.address}</small></td><td>{party.category}</td><td>{party.gstin || "—"}</td><td>{party.contact || "—"}</td><td>{party.paymentTerms} days</td><td>{party.bankAccount || "—"}</td></>}<td className={Number(party.openBalance) ? "am-balance" : ""}>{money(Number(party.openBalance || 0))}</td><td><Pill tone="green">{party.status}</Pill></td><td><div className="am-row-actions"><button className="am-button small" onClick={() => setProfile(party)}>Profile</button><button className="am-button small" onClick={() => open(party)}>Edit</button><button className="am-button small danger-text" onClick={() => remove(party)}>Delete</button></div></td></tr>)}
      </Table>
      {!parties.length && empty(`No ${label.toLowerCase()} records match this search.`)}
    </div>
    {modal && <div className="am-backdrop" onClick={() => setModal(false)}><section className="am-dialog" onClick={event => event.stopPropagation()}><div className="am-drawer-head"><div><span className="am-kicker">{editing ? "Edit" : "New"} master record</span><h3>{editing ? editing.name : `Add ${label.toLowerCase()}`}</h3></div><button className="am-icon-button" onClick={() => setModal(false)} aria-label="Close"><X size={17}/></button></div><div className="am-form-grid">{fields.map(([field, caption, kind]) => <label key={field}>{caption}{Array.isArray(kind) ? <select value={form[field] || kind[0]} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))}>{kind.map(option => <option key={option}>{option}</option>)}</select> : <input type={kind === "number" ? "number" : "text"} value={form[field] || ""} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))}/>}</label>)}</div><div className="am-drawer-actions"><button className="am-button secondary" onClick={() => setModal(false)}>Cancel</button><button className="am-button primary" onClick={save}>Save {label.toLowerCase()}</button></div></section></div>}
    {profile && <div className="am-backdrop" onClick={() => setProfile(null)}><aside className="am-drawer" onClick={event => event.stopPropagation()}><div className="am-drawer-head"><div><span className="am-kicker">{label} profile</span><h3>{profile.name}</h3></div><button className="am-icon-button" onClick={() => setProfile(null)} aria-label="Close"><X size={17}/></button></div><div className="am-detail-grid">{Object.entries(profile).filter(([field]) => field !== "fpcId").map(([field, value]) => <div key={field}><small>{field.replaceAll(/([A-Z])/g, " $1")}</small><b>{field.toLowerCase().includes("balance") || field.toLowerCase().includes("limit") ? money(Number(value || 0)) : String(value || "—")}</b></div>)}</div><h4>Transaction history</h4><Table headers={["Reference", "Date", "Commodity", "Amount", "Status"]}>{transactions(profile).slice(0, 12).map(transaction => <tr key={transaction.id}><td>{transaction.id}</td><td>{transaction.date}</td><td>{transaction.commodity || transaction.item || "—"}</td><td>{money(Number(transaction.amount || 0))}</td><td>{transaction.status}</td></tr>)}</Table>{!transactions(profile).length && empty("No transactions found for this party.")}<p className="am-notice">Outstanding dues: <b>{money(Number(profile.openBalance || 0))}</b></p></aside></div>}
  </section>;
}

function AdminFarmers({ state, setState, role, screen, setToast, go }: Props) {
  const [tab, setTab] = useState(screen === "Multi-FPC links" ? "Multi-FPC" : screen === "Deleted farmers" ? "Deleted" : "Farmers");
  useEffect(() => setTab(screen === "Multi-FPC links" ? "Multi-FPC" : screen === "Deleted farmers" ? "Deleted" : "Farmers"), [screen]);
  const [search, setSearch] = useState("");
  const active = rows(state, "farmers").filter(item => item.status !== "Deleted" && `${Object.values(item).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const deleted = rows(state, "deletedFarmers").filter(item => `${Object.values(item).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const deleteFarmer = (farmer: RecordRow) => {
    const wallet = Number(state.walletBalances[farmer.id] || 0);
    const advance = rows(state, "advances").filter(item => item.farmerId === farmer.id && Number(item.balance || 0) > 0).reduce((sum, item) => sum + Number(item.balance || 0), 0);
    const voucher = rows(state, "purchases").find(item => item.farmerId === farmer.id && ["Submitted", "Pending"].includes(String(item.status)));
    if (wallet > 0 || advance > 0 || voucher) { setToast(`Cannot delete ${farmer.name}: wallet ${money(wallet)}, advance ${money(advance)}${voucher ? `, and open voucher ${voucher.id}` : ""} must be cleared first.`); return; }
    const reason = prompt(`Reason for soft deleting ${farmer.name}:`);
    if (!reason?.trim()) { setToast("A deletion reason is required."); return; }
    const removed = { ...farmer, status: "Deleted", deletedAt: now(), deleteReason: reason.trim(), restoreUntil: new Date(Date.now() + 30 * 86400000).toISOString() };
    setState(s => ({ ...s, records: { ...s.records, farmers: rows(s, "farmers").map(item => item.id === farmer.id ? removed : item), deletedFarmers: [removed, ...rows(s, "deletedFarmers")] }, audit: [auditEntry(role, "Farmers", farmer.id, "soft-deleted farmer", farmer, removed), ...s.audit], notifications: [notice(`Farmer ${farmer.name} moved to Deleted farmers`), ...s.notifications] }));
    setToast(`${farmer.name} moved to Deleted for 30 days.`);
  };
  const restore = (farmer: RecordRow) => {
    if (new Date(farmer.restoreUntil || 0).getTime() < Date.now()) { setToast("The 30-day restore period has expired."); return; }
    const restored = { ...farmer, status: "Active" };
    setState(s => ({ ...s, records: { ...s.records, deletedFarmers: rows(s, "deletedFarmers").filter(item => item.id !== farmer.id), farmers: rows(s, "farmers").map(item => item.id === farmer.id ? restored : item) }, audit: [auditEntry(role, "Farmers", farmer.id, "restored farmer record", "Deleted", "Active"), ...s.audit], notifications: [notice(`Farmer ${farmer.name} record restored`), ...s.notifications] }));
    setToast(`${farmer.name} restored.`);
  };
  const decideLink = (request: RecordRow, approved: boolean) => {
    if (state.offline) { setToast("Approvals need a connection"); return; }
    const reason = approved ? "" : prompt(`Reason for rejecting link ${request.id}:`) || "";
    if (!approved && !reason.trim()) { setToast("A rejection reason is required."); return; }
    const updated = { ...request, status: approved ? "Approved" : "Rejected", rejectionReason: reason || undefined, decidedAt: now() };
    setState(s => ({ ...s, records: { ...s.records, farmerLinkRequests: rows(s, "farmerLinkRequests").map(item => item.id === request.id ? updated : item), ...(approved ? { multiFpcLinks: [{ ...updated, linkStatus: "Linked" }, ...rows(s, "multiFpcLinks")] } : {}) }, audit: [auditEntry(role, "Farmers · Multi-FPC", request.id, approved ? "approved farmer link" : "rejected farmer link", request.status, updated), ...s.audit], notifications: [notice(`Multi-FPC link ${request.id} ${updated.status.toLowerCase()}`, String(request.requestedBy || "FPC Admin / Manager")), ...s.notifications] }));
    setToast(`Link ${request.id} ${updated.status.toLowerCase()}; requester notified.`);
  };
  const decideFarmer = (application: RecordRow, approved: boolean) => {
    if (state.offline) { setToast("Approvals need a connection"); return; }
    const reason = approved ? "" : prompt(`Reason for rejecting ${application.id}:`) || "";
    if (!approved && !reason.trim()) { setToast("A rejection reason is required."); return; }
    const updated = { ...application, status: approved ? "Approved" : "Rejected", rejectionReason: reason };
    setState(s => ({ ...s, records: { ...s.records, farmerApplications: rows(s, "farmerApplications").map(item => item.id === application.id ? updated : item), ...(approved ? { farmers: [{ ...application, status: "Active", kyc: "Submitted" }, ...rows(s, "farmers").filter(item => item.id !== application.id)] } : {}) }, walletBalances: approved ? { ...s.walletBalances, [application.id]: 0 } : s.walletBalances, audit: [auditEntry(role, "Farmers", application.id, approved ? "approved farmer registration" : "rejected farmer registration", application.status, updated), ...s.audit], notifications: [notice(`Farmer application ${application.id} ${updated.status.toLowerCase()}`), ...s.notifications] }));
    setToast(`${application.id} ${updated.status.toLowerCase()}.`);
  };
  const pendingApplications = rows(state, "farmerApplications").filter(item => item.status === "Submitted");
  const incomingLinks = rows(state, "farmerLinkRequests").filter(item => item.status === "Submitted");
  return <section className="am-module">
    <Header kicker="Farmer records · FPC Admin" title="Farmers" description="Review registrations, view multi-FPC links and soft-delete or restore eligible records." right={<button className="am-button primary" onClick={() => go("Register farmer")}><Plus size={15}/> Register farmer</button>}/>
    <div className="am-tabs">{["Farmers", "Multi-FPC", "Deleted"].map(name => <button key={name} className={tab === name ? "active" : ""} onClick={() => { setTab(name); setSearch(""); }}>{name}{name === "Multi-FPC" && <i>{incomingLinks.length}</i>}</button>)}</div>
    <div className="am-card">
      <div className="am-toolbar"><div className="am-search"><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search farmer name, ID or village"/></div><button className="am-button secondary" onClick={() => exportCsv(`farmers-${tab.toLowerCase()}`, tab === "Deleted" ? deleted : active)}><Download size={15}/> Export CSV</button></div>
      {tab === "Farmers" && <><Table headers={["Farmer ID", "Farmer", "Village", "Mobile", "KYC", "Wallet", "Registration", "Actions"]}>{active.map(farmer => <tr key={farmer.id}><td className="am-mono">{farmer.id}</td><td><b>{farmer.name}</b><small>{farmer.gender} · {farmer.category}</small></td><td>{farmer.village || "—"}</td><td>{farmer.mobile}</td><td>{farmer.kyc || "—"}</td><td>{money(Number(state.walletBalances[farmer.id] || 0))}</td><td>{farmer.status}</td><td><button className="am-button small danger-text" onClick={() => deleteFarmer(farmer)}>Delete</button></td></tr>)}</Table>{!active.length && empty("No farmer records match this search.")}<h3 className="am-section-title">Registration applications</h3><Table headers={["Application", "Farmer", "Village", "Submitted", "Actions"]}>{pendingApplications.map(application => <tr key={application.id}><td>{application.id}</td><td>{application.name}</td><td>{application.village || "—"}</td><td>{application.created || "—"}</td><td><button className="am-button small" onClick={() => decideFarmer(application, false)}>Reject</button> <button className="am-button small primary" onClick={() => decideFarmer(application, true)}>Approve</button></td></tr>)}</Table>{!pendingApplications.length && empty("No registration applications are waiting.")}</>}
      {tab === "Multi-FPC" && <><div className="am-network-summary"><div><b>Linked farmer profiles</b><small>View-only across the partner network</small></div><Pill>{rows(state, "multiFpcLinks").length} active links</Pill><div><b>Incoming link requests</b><small>Requesting FPC and reason shown below</small></div><Pill tone="warn">{incomingLinks.length} pending</Pill></div><h3 className="am-section-title">Incoming link requests</h3><Table headers={["Farmer", "Farmer ID", "Requesting FPC", "Reason", "Date", "Actions"]}>{incomingLinks.map(request => <tr key={request.id}><td>{request.farmer}</td><td>{request.farmerId}</td><td>{request.requestingFpc}</td><td>{request.reason}</td><td>{request.date}</td><td><div className="am-row-actions"><button className="am-button small danger-text" disabled={state.offline} onClick={() => decideLink(request, false)}>Reject</button><button className="am-button small primary" disabled={state.offline} onClick={() => decideLink(request, true)}>Approve</button></div></td></tr>)}</Table>{!incomingLinks.length && empty("No incoming link requests.")}<h3 className="am-section-title">Farmers linked to multiple FPCs · view only</h3><Table headers={["Farmer", "Farmer ID", "Other FPC", "Link status"]}>{rows(state, "multiFpcLinks").map(link => <tr key={link.id}><td>{link.farmer}</td><td>{link.farmerId}</td><td>{link.requestingFpc}</td><td><Pill tone="green">{link.linkStatus || link.status}</Pill></td></tr>)}</Table></>}
      {tab === "Deleted" && <><div className="am-notice">Soft-deleted farmers can be restored within 30 days. Wallet balance, advances and open vouchers must be cleared before deletion.</div><Table headers={["Farmer", "Farmer ID", "Deleted", "Reason", "Restore until", "Actions"]}>{deleted.map(farmer => <tr key={farmer.id}><td>{farmer.name}</td><td>{farmer.id}</td><td>{farmer.deletedAt}</td><td>{farmer.deleteReason}</td><td>{farmer.restoreUntil ? new Date(farmer.restoreUntil).toLocaleDateString("en-GB") : "—"}</td><td><button className="am-button small primary" onClick={() => restore(farmer)}>Restore</button></td></tr>)}</Table>{!deleted.length && empty("No deleted farmers. Eligible records can be restored here for 30 days.")}</>}
    </div>
  </section>;
}

const financeScreens = ["Finance", "Farmer ledger", "Buyer ledger", "Supplier ledger", "Cash book", "Bank book", "Receipts and payments", "Expense register", "Income & expenditure", "Profit & loss"];
function Finance({ state, screen, setToast, go }: Props) {
  const [period, setPeriod] = useState("FY 2026–27");
  const periodRows = (input: RecordRow[]) => {
    if (period === "All periods") return input;
    const start = period === "FY 2025–26" ? new Date(2025, 3, 1) : new Date(2026, 3, 1);
    const end = period === "FY 2025–26" ? new Date(2026, 3, 1) : new Date(2027, 3, 1);
    return input.filter(item => { const parsed = new Date(String(item.date || "")); return Number.isNaN(parsed.getTime()) || (parsed >= start && parsed < end); });
  };
  const sales = periodRows(rows(state, "sales"));
  const purchases = periodRows(rows(state, "purchases"));
  const expenses = periodRows(rows(state, "expenses"));
  const payments = periodRows(rows(state, "payments"));
  const grossMargin = sales.reduce((sum, item) => sum + Number(item.margin || 0), 0);
  const mapped: Record<string, RecordRow[]> = {
    "Farmer ledger": periodRows(rows(state, "ledger")),
    "Buyer ledger": sales.map(item => ({ id: item.id, buyer: item.buyer, date: item.date, description: item.commodity, debit: item.amount, credit: 0, balance: Number(item.amount || 0), status: item.status })),
    "Supplier ledger": rows(state, "businessTransactions").filter(item => item.flow === "D").map(item => ({ id: item.id, supplier: item.party, date: item.date, description: item.item, debit: item.amount, credit: 0, balance: item.amount, status: item.status })),
    "Cash book": [...payments.map(item => ({ ...item, entryType: "Payment" })), ...expenses.map(item => ({ ...item, entryType: "Expense" }))],
    "Bank book": payments.filter(item => /bank|transfer|cheque/i.test(String(item.method || ""))),
    "Receipts and payments": [...sales.map(item => ({ ...item, entryType: "Receipt", credit: item.amount })), ...payments.map(item => ({ ...item, entryType: "Payment", debit: item.amount }))],
    "Expense register": expenses,
    "Income & expenditure": [{ id: "FY-2026-27", period, income: sales.reduce((sum, item) => sum + Number(item.amount || 0), 0), expenditure: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), surplus: sales.reduce((sum, item) => sum + Number(item.amount || 0), 0) - expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), status: "Management view" }],
    "Profit & loss": [{ id: "FY-2026-27", period, sales: sales.reduce((sum, item) => sum + Number(item.amount || 0), 0), purchaseCost: purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0), grossMargin, operatingExpenses: expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), status: "Period-to-date" }],
  };
  const current = screen === "Finance" ? "Profit & loss" : screen;
  const data = mapped[current] || mapped["Profit & loss"];
  const exportRows = data.length ? data : [];
  const columns = exportRows.length ? Object.keys(exportRows[0]).filter(field => field !== "fpcId") : [];
  const income = sales.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expensesTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return <section className="am-module"><Header kicker="Finance · read and export" title={current === "Profit & loss" ? "Profit & loss" : current} description="Accountant-owned financial records shown read-only to the Admin. Use the period filter to review FPC totals; no ledger entries can be created or edited here." right={<div className="am-actions"><select className="am-select" value={period} onChange={event => setPeriod(event.target.value)}><option>FY 2026–27</option><option>All periods</option><option>FY 2025–26</option></select><button className="am-button secondary" onClick={() => exportCsv(`fpc-${current.toLowerCase().replaceAll(" ", "-")}`, exportRows)}><Download size={15}/> Export Excel CSV</button><button className="am-button secondary" onClick={() => { window.print(); setToast("Print dialog opened for PDF export."); }}><Printer size={15}/> Print / PDF</button><button className="am-button secondary" onClick={() => go("Approvals")}>Review approvals</button></div>}/>
    <div className="am-finance-nav">{financeScreens.slice(1).map(name => <button key={name} className={name === current ? "active" : ""} onClick={() => go(name)}>{name}</button>)}</div>
    <div className="am-metrics"><Metric label="Turnover" value={money(income)} note={period}/><Metric label="Operating expenses" value={money(expensesTotal)} note="Approved expense register"/><Metric label="Gross margin" value={money(grossMargin)} note="Before operating expenses; not net profit"/></div>
    {current === "Profit & loss" && <div className="am-notice"><b>Gross margin is before operating expenses; it is not net profit.</b> This is a read-only management view of the selected period.</div>}
    <div className="am-card"><div className="am-toolbar"><div><b>{current}</b><small>{data.length} rows · read only</small></div><Pill>Accountant data</Pill></div>{data.length ? <Table headers={columns}>{data.map(record => <tr key={record.id}>{columns.map(column => <td key={column}>{["income", "expenditure", "surplus", "amount", "debit", "credit", "balance", "sales", "purchaseCost", "grossMargin", "operatingExpenses"].includes(column) && typeof record[column] === "number" ? money(Number(record[column])) : String(record[column] ?? "—")}</td>)}</tr>)}</Table> : empty("No financial records for this period.")}</div>
  </section>;
}

const complianceTabs = ["Statutory calendar", "Filing tracker", "Meeting records", "Document vault"];
function Compliance({ state, setState, role, screen, setToast }: Props) {
  const [tab, setTab] = useState(complianceTabs.includes(screen) ? screen : "Statutory calendar");
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const filings = rows(state, "filings");
  const expiringLicense = rows(state, "licenseRecords").find(item => item.status !== "Active");
  const licenseDaysLeft = expiringLicense ? Math.ceil((new Date(String(expiringLicense.expiry || "")).getTime() - Date.now()) / 86400000) : 0;
  const remindLicense = () => {
    if (!expiringLicense) return;
    setState(s => ({ ...s, audit: [auditEntry(role, "Compliance", expiringLicense.id, "sent licence renewal reminder", expiringLicense.status, "Reminder sent to TSF"), ...s.audit], notifications: [notice(`Renewal reminder: ${expiringLicense.name} ${expiringLicense.number} expires ${expiringLicense.expiry}`, "TSF Central Admin"), ...s.notifications] }));
    setToast("Renewal reminder recorded and TSF notified.");
  };
  const approve = (filing: RecordRow, approved: boolean) => {
    if (state.offline) { setToast("Approvals need a connection"); return; }
    const reason = approved ? "" : prompt(`Reason for rejecting ${filing.name}:`) || "";
    if (!approved && !reason.trim()) { setToast("A rejection reason is required."); return; }
    const updated = { ...filing, adminStatus: approved ? "Approved" : "Rejected", decisionReason: reason, reviewedAt: now() };
    setState(s => ({ ...s, records: { ...s.records, filings: rows(s, "filings").map(item => item.id === filing.id ? updated : item) }, audit: [auditEntry(role, "Compliance", filing.id, approved ? "approved filing" : "rejected filing", filing.adminStatus || filing.status, updated.adminStatus), ...s.audit], notifications: [notice(`${filing.name} filing ${updated.adminStatus.toLowerCase()}`, String(filing.filedBy || "Compliance Officer")), ...s.notifications] }));
    setToast(`${filing.name} ${updated.adminStatus.toLowerCase()}; Compliance Officer notified.`);
    setSelected(null);
  };
  const exportRows = tab === "Meeting records" ? rows(state, "meetings") : tab === "Document vault" ? rows(state, "documents") : tab === "Licences" ? rows(state, "licenseRecords") : filings;
  return <section className="am-module"><Header kicker="Compliance · FPC Admin" title="Compliance" description="Review statutory deadlines, filings, meeting records and the document vault. Export the current compliance view." right={<button className="am-button secondary" onClick={() => exportCsv("fpc-compliance-report", exportRows)}><Download size={15}/> Export compliance CSV</button>}/>
    {filings.some(item => item.status === "Overdue") && <div className="am-overdue"><b>Overdue filing</b><span>GSTR-3B for September is overdue.</span><button onClick={() => { setTab("Filing tracker"); setToast("Opened the filing tracker."); }}>Review filing</button></div>}
     {expiringLicense && <div className="am-overdue license"><b>Licence expiry alert</b><span>{expiringLicense.name} {expiringLicense.number} expires {expiringLicense.expiry} ({Number.isFinite(licenseDaysLeft) ? `${licenseDaysLeft} days left` : "date not recorded"}).</span><button onClick={remindLicense}>Renew reminder</button><button onClick={() => setTab("Licences")}>View licence</button></div>}
    <div className="am-tabs">{[...complianceTabs, "Licences"].map(name => <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name}</button>)}</div>
    <div className="am-card">
      {tab === "Meeting records" ? <Table headers={["Meeting", "Date", "Venue", "Status", "Minutes"]}>{rows(state, "meetings").map(meeting => <tr key={meeting.id}><td>{meeting.name}</td><td>{meeting.date}</td><td>{meeting.venue}</td><td><Pill>{meeting.status}</Pill></td><td>{meeting.note || "Minutes in document vault"}</td></tr>)}</Table>
        : tab === "Document vault" ? <Table headers={["Document", "Category", "Updated", "Expiry", "Status"]}>{rows(state, "documents").map(document => <tr key={document.id}><td>{document.name}</td><td>{document.category}</td><td>{document.updated}</td><td>{document.expiry || "—"}</td><td>{document.status || "Available"}</td></tr>)}</Table>
        : tab === "Licences" ? <Table headers={["Licence", "Reference", "Expiry", "Status"]}>{rows(state, "licenseRecords").map(item => <tr key={item.id}><td>{item.name}</td><td>{item.number}</td><td>{item.expiry}</td><td><Pill tone={item.status === "Active" ? "green" : "warn"}>{item.status}</Pill></td></tr>)}</Table>
          : <Table headers={["Filing / event", "Due date", "Filed by", "Filing status", "Admin review", "Action"]}>{filings.map(filing => <tr key={filing.id}><td><b>{filing.name}</b><small>{filing.id}</small></td><td>{filing.due}</td><td>{filing.filedBy || "—"}</td><td><Pill tone={filing.status === "Overdue" ? "danger" : filing.status === "Filed" || String(filing.status).startsWith("Filed") ? "green" : "warn"}>{filing.status}</Pill></td><td>{filing.adminStatus || "—"}</td><td>{String(filing.status).includes("Filed") && filing.adminStatus !== "Approved" ? <button className="am-button small" onClick={() => setSelected(filing)}>Review</button> : "—"}</td></tr>)}</Table>}
    </div>
    {selected && <div className="am-backdrop" onClick={() => setSelected(null)}><aside className="am-drawer" onClick={event => event.stopPropagation()}><div className="am-drawer-head"><div><span className="am-kicker">Filing review</span><h3>{selected.name}</h3></div><button className="am-icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={17}/></button></div><div className="am-detail-grid"><div><small>Due date</small><b>{selected.due}</b></div><div><small>Filed by</small><b>{selected.filedBy}</b></div><div><small>Filing status</small><b>{selected.status}</b></div><div><small>Admin review</small><b>{selected.adminStatus || "Pending review"}</b></div></div><div className="am-drawer-actions"><button className="am-button danger" onClick={() => approve(selected, false)}>Reject</button><button className="am-button primary" onClick={() => approve(selected, true)}><Check size={15}/> Approve filing</button></div></aside></div>}
  </section>;
}

function AuditTrail({ state, role }: Props) {
  const [user, setUser] = useState("All users");
  const [module, setModule] = useState("All modules");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const users = [...new Set(state.audit.map(item => String(item.actor || item.user || "Unknown")))];
  const modules = [...new Set(state.audit.map(item => String(item.module || "General")))];
  const filtered = state.audit.filter(item => item.fpcId === "FPC-ODI-001" && (user === "All users" || (item.actor || item.user) === user) && (module === "All modules" || item.module === module) && (!date || new Date(String(item.date)).toLocaleDateString("en-CA") === date));
  return <section className="am-module"><Header kicker="Settings · own FPC only" title="Audit trail" description="Filter, inspect before-and-after values and export Green Valley FPC activity. This view never includes another FPC’s audit data." right={<button className="am-button secondary" onClick={() => exportCsv("fpc-audit-trail", filtered)}><Download size={15}/> Export Excel CSV</button>}/>
    <div className="am-filters"><select value={user} onChange={event => setUser(event.target.value)}><option>All users</option>{users.map(value => <option key={value}>{value}</option>)}</select><select value={module} onChange={event => setModule(event.target.value)}><option>All modules</option>{modules.map(value => <option key={value}>{value}</option>)}</select><label>Date <input type="date" value={date} onChange={event => setDate(event.target.value)}/></label><Pill>{filtered.length} entries · {role}</Pill></div>
    <div className="am-card"><Table headers={["Time", "User", "Role", "Module", "Record", "Action", "Before / after"]}>{filtered.map(item => <tr key={item.id} onClick={() => setSelected(item)} className="am-click-row"><td>{item.date}</td><td>{item.actor || item.user}</td><td>{item.role}</td><td>{item.module}</td><td className="am-mono">{item.record || item.id}</td><td>{item.action}</td><td><button className="am-button small">Diff</button></td></tr>)}</Table>{!filtered.length && empty("No audit entries match these filters.")}</div>
    {selected && <div className="am-backdrop" onClick={() => setSelected(null)}><aside className="am-drawer" onClick={event => event.stopPropagation()}><div className="am-drawer-head"><div><span className="am-kicker">Audit detail · {selected.id}</span><h3>{selected.action}</h3></div><button className="am-icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={17}/></button></div><div className="am-detail-grid"><div><small>Time</small><b>{selected.date}</b></div><div><small>User / role</small><b>{selected.actor} · {selected.role}</b></div><div><small>Module / record</small><b>{selected.module} · {selected.record || "—"}</b></div></div><div className="am-diff"><div><small>Before</small><pre>{selected.oldValue || "No previous value"}</pre></div><div><small>After</small><pre>{selected.newValue || "No new value"}</pre></div></div></aside></div>}
  </section>;
}

function SyncCentre({ state, setState, role, setToast }: Props) {
  const toggle = () => {
    const offline = !state.offline;
    setState(s => ({ ...s, offline, audit: [auditEntry(role, "Offline mode", "FPC-ODI-001", offline ? "simulated offline" : "restored connection", s.offline, offline), ...s.audit], notifications: [notice(offline ? "Device is offline · new drafts will be queued" : "Connection restored · sync is available"), ...s.notifications] }));
    setToast(offline ? "Offline simulation enabled." : "Connection restored.");
  };
  const syncNow = () => {
    if (state.offline) { setToast("Connect to the internet before syncing."); return; }
    const pending = state.syncQueue.filter(item => item.status === "Pending sync");
    setState(s => {
      const queuedIds = new Set(pending.map(item => item.record));
      const promotedRecords = Object.fromEntries(Object.entries(s.records).map(([recordKey, list]) => [recordKey, list.map(record => {
        if (!queuedIds.has(record.id) || record.status !== "Draft") return record;
        const { pendingStatus, ...saved } = record;
        return { ...saved, status: pendingStatus || "Submitted", syncedAt: now() };
      })]));
      return { ...s, records: promotedRecords, syncQueue: s.syncQueue.map(item => item.status === "Pending sync" ? { ...item, status: "Synced", syncedAt: now() } : item), audit: [auditEntry(role, "Sync centre", "local queue", "synced queued drafts", pending.length, 0), ...s.audit], notifications: [notice(`${pending.length} queued draft${pending.length === 1 ? "" : "s"} synced`), ...s.notifications] };
    });
    setToast(`${pending.length} queued record${pending.length === 1 ? "" : "s"} synced.`);
  };
  const retry = (item: RecordRow) => {
    setState(s => ({ ...s, syncQueue: s.syncQueue.map(row => row.id === item.id ? { ...row, status: "Pending sync", retryCount: Number(row.retryCount || 0) + 1 } : row), audit: [auditEntry(role, "Sync centre", item.id, "queued retry", item.status, "Pending sync"), ...s.audit] }));
    setToast(`${item.id} moved to the pending queue.`);
  };
  return <section className="am-module"><Header kicker="Offline mode · local drafts" title="Sync centre" description="Review locally queued drafts and retry failed records. Synchronization is available only when online." right={<button className={`am-button ${state.offline ? "secondary" : "primary"}`} onClick={toggle}>{state.offline ? <WifiOff size={15}/> : <Wifi size={15}/>} Simulate {state.offline ? "online" : "offline"}</button>}/>
    <div className={`am-connectivity ${state.offline ? "offline" : ""}`}><span>{state.offline ? <WifiOff size={17}/> : <Wifi size={17}/>} {state.offline ? "Offline · approvals disabled" : "Online · ready to sync"}</span><button className="am-button primary" disabled={state.offline || !state.syncQueue.some(item => item.status === "Pending sync")} onClick={syncNow}><RefreshCw size={15}/> Sync now</button></div>
    <div className="am-card"><div className="am-toolbar"><div><b>Queued records</b><small>{state.syncQueue.filter(item => item.status === "Pending sync").length} pending · {state.syncQueue.filter(item => item.status === "Failed").length} failed</small></div><button className="am-button secondary" onClick={() => exportCsv("sync-queue", state.syncQueue)}><Download size={15}/> Export CSV</button></div><Table headers={["Queue ID", "Type", "Record", "Status", "Attempts", "Last error", "Action"]}>{state.syncQueue.map(item => <tr key={item.id}><td className="am-mono">{item.id}</td><td>{item.type}</td><td>{item.record}</td><td><Pill tone={item.status === "Synced" ? "green" : item.status === "Failed" ? "danger" : "warn"}>{item.status}</Pill></td><td>{item.retryCount || 0}</td><td>{item.reason || "—"}</td><td>{item.status === "Failed" ? <button className="am-button small" onClick={() => retry(item)}>Retry</button> : "—"}</td></tr>)}</Table>{!state.syncQueue.length && empty("The sync queue is empty.")}</div>
  </section>;
}

function Analytics({ state, setToast }: Props) {
  const farmers = rows(state, "farmers").filter(item => item.status !== "Deleted");
  const women = farmers.length ? Math.round(farmers.filter(item => item.gender === "Female").length / farmers.length * 100) : 0;
  const sales = rows(state, "sales").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const procureT = rows(state, "purchases").reduce((sum, item) => sum + Number(item.quantity || 0) * (item.unit === "tonne" ? 1 : item.unit === "quintal" ? .1 : item.unit === "kg" ? .001 : .05), 0);
  const values = [
    ["Farmer coverage", `${farmers.length} / 120`, "Target: 120 farmers"],
    ["Procurement vs plan", `${procureT.toFixed(1)} t`, "Plan: 3,000 tonnes · FY 2026–27"],
    ["Turnover trend", money(4965000), "FY 2026–27 · demo baseline"],
    ["Women farmers", `${women}%`, `${farmers.filter(item => item.gender === "Female").length} registered women farmers`],
    ["Input sales per member", money(Math.round(412000 / Math.max(1, farmers.length))), "FPC input turnover divided by members"],
    ["Paddy price realised", "Rs 25.0 / kg", "Mandi benchmark: Rs 22.5 / kg"],
    ["Compliance score", "78%", "Network average: 72% · read-only benchmark"],
  ];
  const exportRows = values.map(([metric, value, detail], index) => ({ id: `KPI-${String(index + 1).padStart(2, "0")}`, metric, value, detail, fpcId: "FPC-ODI-001" }));
  return <section className="am-module"><Header kicker="Dashboard · analytics" title="FPC performance" description="Green Valley performance against targets with a read-only TSF network benchmark. Export a spreadsheet-compatible CSV or print this page to PDF." right={<div className="am-actions"><button className="am-button secondary" onClick={() => exportCsv("fpc-performance-analytics", exportRows)}><Download size={15}/> Export Excel CSV</button><button className="am-button secondary" onClick={() => { window.print(); setToast("Print dialog opened for PDF export."); }}><Printer size={15}/> Export PDF</button></div>}/>
    <div className="am-analytics-grid">{values.map(([label, value, detail], index) => <article className="am-analytics-card" key={label}><small>{label}</small><strong>{value}</strong><span>{detail}</span><div className="am-analytics-bar"><i style={{ width: `${[83, 76, 72, women, 68, 100, 78][index]}%` }}/></div>{index === 6 && <Pill>TSF network average 72%</Pill>}</article>)}</div>
    <div className="am-card"><div className="am-card-heading"><h3>Turnover trend · FY 2026–27</h3><span>Local demo series</span></div><div className="am-trend">{["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month, index) => <div key={month}><i style={{ height: `${26 + (index * 17 % 66)}%` }}/><small>{month}</small></div>)}</div></div>
    <div className="am-callout"><FileText size={16}/><span><b>Benchmark is read-only.</b><small>Network averages are sample values for this demo; no other FPC’s farmer or transaction records are exposed.</small></span></div>
  </section>;
}

export default function AdminModules(props: Props) {
  const { screen, state, role } = props;
  if (screen === "Setup checklist" || screen === "Journey view") return <SetupChecklist state={state} role={role} go={props.go}/>;
  if (screen === "Approvals") return <Approvals {...props}/>;
  if (screen === "Buyer master" || screen === "Supplier master") return <PartyMaster {...props}/>;
  if (screen === "Farmers" || screen === "Multi-FPC links" || screen === "Deleted farmers") return <AdminFarmers {...props}/>;
  if (financeScreens.includes(screen)) return <Finance {...props}/>;
  if (["Compliance", ...complianceTabs, "Licences"].includes(screen)) return <Compliance {...props}/>;
  if (screen === "Audit trail") return <AuditTrail {...props}/>;
  if (screen === "Sync centre") return <SyncCentre {...props}/>;
  if (screen === "Analytics") return <Analytics {...props}/>;
  if (["FPC onboarding", "FPC pending approvals", "FPC profile"].includes(screen)) return <FpcManagement {...props}/>;
  if (["Reports & gallery", "Consolidated MIS"].includes(screen)) return <FpcReports state={props.state} role={props.role}/>;
  return null;
}
