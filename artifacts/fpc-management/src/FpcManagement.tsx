import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleHelp, Clock3, Download, FileSpreadsheet, FileText, History, Landmark, Plus, Save, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";
import type { RecordRow, State } from "@/lib/store";
import "./fpc-management.css";

type Props = { state: State; setState: (updater: State | ((s: State) => State)) => void; role: string; screen: string; setToast: (message: string) => void; go: (screen: string) => void };
type Obj = Record<string, any>;
const steps = ["Legal identity", "Licences", "ROC & filings", "Capital & turnover", "People & board", "Location & work", "Admin & review"];
const protectedKeys = ["cin", "pan", "tan", "gstin", "authorisedCapital", "paidUpCapital", "faceValue", "licences"];
const seedDetails: Obj = {
  basic: { legalName: "Green Valley Farmer Producer Company Ltd.", cin: "U01100OD2021PTC035612", pan: "AAACG1234F", tan: "BBNG01234A", gstin: "21AAACG1234F1Z5", contactEmail: "office@greenvalleyfpc.demo", mobile: "9876544412", website: "", logo: "" },
  licenses: [
    { type: "Fertilizer", number: "FL/KEO/2023/041", authority: "District Agriculture Office, Keonjhar", issueDate: "2023-12-15", expiryDate: "2026-12-14", document: "fertilizer-license.pdf" },
    { type: "FSSAI", number: "21426012345678", authority: "Food Safety and Standards Authority of India", issueDate: "2021-06-14", expiryDate: "2027-06-14", document: "fssai-certificate.pdf" },
    { type: "Seed", number: "SL/KEO/2024/118", authority: "District Agriculture Office, Keonjhar", issueDate: "2024-04-01", expiryDate: "2027-03-31", document: "seed-license.pdf" },
  ],
  roc: { office: "ROC Cuttack", incorporationDate: "2021-06-14", registeredAddress: "Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha 758001", financialYearEnd: "31 March", agmDate: "2026-09-21", annualReturn: "Filed", auditStatus: "Completed" },
  capital: { authorisedCapital: "1000000", paidUpCapital: "620000", faceValue: "100", shares: "6200" },
  turnovers: [{ year: "2023–24", amount: "4150000" }, { year: "2024–25", amount: "5820000" }, { year: "2025–26", amount: "7180000" }],
  employees: [
    { name: "Bijay Kumar Mohanty", role: "CEO", mobile: "9876501002", dateOfJoining: "2022-07-01", gender: "Male", employmentType: "Full-time" },
    { name: "Anita Das", role: "Accountant", mobile: "9876501003", dateOfJoining: "2022-07-01", gender: "Female", employmentType: "Full-time" },
    { name: "Prakash Rout", role: "Procurement Officer", mobile: "9876501004", dateOfJoining: "2022-07-01", gender: "Male", employmentType: "Full-time" },
    { name: "Mamata Jena", role: "Sales Officer", mobile: "9876501005", dateOfJoining: "2022-07-01", gender: "Female", employmentType: "Full-time" },
    { name: "Sanjay Tudu", role: "Stock Manager", mobile: "9876501006", dateOfJoining: "2022-07-01", gender: "Male", employmentType: "Full-time" },
    { name: "Pooja Nayak", role: "Data Entry Operator", mobile: "9876501007", dateOfJoining: "2022-07-01", gender: "Female", employmentType: "Full-time" },
    { name: "Rakesh Hembram", role: "Compliance Officer", mobile: "9876501008", dateOfJoining: "2022-07-01", gender: "Male", employmentType: "Full-time" },
    { name: "Suman Naik", role: "Field Staff", mobile: "9876501009", dateOfJoining: "2022-07-01", gender: "Male", employmentType: "Part-time" },
    { name: "Dillip Sahoo", role: "Operations Assistant", mobile: "9876501010", dateOfJoining: "2022-07-01", gender: "Male", employmentType: "Full-time" },
    { name: "Laxmi Patra", role: "Community Mobiliser", mobile: "9876501011", dateOfJoining: "2022-07-01", gender: "Female", employmentType: "Full-time" },
  ],
  directors: [
    { name: "Sunita Behera", din: "01234567", gender: "Female", designation: "Chairperson", appointmentDate: "2021-06-14", mobile: "9876501001", email: "sunita@greenvalleyfpc.demo", address: "Keonjhar, Odisha", category: "OBC" },
    { name: "Bijay Kumar Mohanty", din: "12345678", gender: "Male", designation: "CEO", appointmentDate: "2021-06-14", mobile: "9876501002", email: "bijay@greenvalleyfpc.demo", address: "Keonjhar, Odisha", category: "General" },
    { name: "Ramesh Chandra Nayak", din: "23456781", gender: "Male", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501003", email: "ramesh@greenvalleyfpc.demo", address: "Keonjhar, Odisha", category: "General" },
    { name: "Laxmi Patra", din: "34567812", gender: "Female", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501004", email: "laxmi@greenvalleyfpc.demo", address: "Keonjhar, Odisha", category: "SC" },
    { name: "Dillip Sahoo", din: "45678123", gender: "Male", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501005", email: "dillip@greenvalleyfpc.demo", address: "Keonjhar, Odisha", category: "OBC" },
    { name: "Kanchan Munda", din: "56781234", gender: "Female", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501006", email: "kanchan@greenvalleyfpc.demo", address: "Keonjhar, Odisha", category: "ST" },
  ],
  location: { address: "Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha 758001", state: "Odisha", district: "Keonjhar", block: "Keonjhar Sadar", pin: "758001", latitude: "21.6289", longitude: "85.5817", activities: ["Produce aggregation", "Input supply", "Marketing", "Soil Testing"], commodities: "Paddy, Maize, Arhar, Ragi", villages: "24", farmerTarget: "120" },
  admin: { name: "Bijay Kumar Mohanty", mobile: "9876544412", email: "bijay@greenvalleyfpc.demo", subUserLimit: "25" },
  bankAccounts: [{ bank: "State Bank of India", branch: "Keonjhar Main", accountNumber: "XXXXXX7342", ifsc: "SBIN0000123", accountType: "Current" }],
};
const blankDetails: Obj = {
  basic: { legalName: "", cin: "", pan: "", tan: "", gstin: "", contactEmail: "", mobile: "", website: "", logo: "" },
  licenses: [], roc: { office: "", incorporationDate: "", registeredAddress: "", financialYearEnd: "", agmDate: "", annualReturn: "Not filed", auditStatus: "Not started" },
  capital: { authorisedCapital: "", paidUpCapital: "", faceValue: "10", shares: "0" },
  turnovers: [{ year: "2023–24", amount: "" }, { year: "2024–25", amount: "" }, { year: "2025–26", amount: "" }],
  employees: [], directors: Array.from({ length: 5 }, () => ({ name: "", din: "", gender: "", designation: "", appointmentDate: "", mobile: "", email: "", address: "", category: "" })),
  location: { address: "", state: "", district: "", block: "", pin: "", latitude: "", longitude: "", activities: [], commodities: "", villages: "", farmerTarget: "" },
  admin: { name: "", mobile: "", email: "", subUserLimit: "10" }, bankAccounts: [],
};
const makeId = (prefix = "FPC-") => `${prefix}${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const stamp = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fpcRows = (s: State) => s.records?.fpcs || [];
const gv = (s: State) => fpcRows(s).find((r) => r.id === "FPC-ODI-001") || fpcRows(s)[0];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const withDetails = (row?: RecordRow): Obj => {
  if (!row) return clone(blankDetails);
  const source = row.details || {};
  const base = row.id === "FPC-ODI-001" ? seedDetails : blankDetails;
  const capital = source.capital || {};
  const location = source.location || {};
  return {
    ...base, ...source,
    basic: { ...base.basic, ...(source.basic || {}), legalName: source.basic?.legalName || row.name || base.basic.legalName },
    roc: { ...base.roc, ...(source.roc || {}), agmDate: source.roc?.agmDate || source.roc?.lastAgmDate || base.roc.agmDate, annualReturn: source.roc?.annualReturn || source.roc?.lastAnnualReturnDate || base.roc.annualReturn, auditStatus: source.roc?.auditStatus || source.roc?.statutoryAudit || base.roc.auditStatus },
    capital: { ...base.capital, ...capital, authorisedCapital: capital.authorisedCapital ?? capital.authorised ?? base.capital.authorisedCapital, paidUpCapital: capital.paidUpCapital ?? capital.paidUp ?? base.capital.paidUpCapital, faceValue: capital.faceValue ?? base.capital.faceValue },
    location: { ...base.location, ...location, activities: Array.isArray(location.activities) ? location.activities : base.location.activities, commodities: Array.isArray(location.commodities) ? location.commodities.join(", ") : location.commodities ?? base.location.commodities, villages: location.villages ?? location.villagesCovered ?? base.location.villages, farmerTarget: location.farmerTarget ?? location.targetFarmers ?? base.location.farmerTarget },
    admin: { ...base.admin, ...(source.admin || {}) },
    licenses: source.licenses?.map((license: Obj) => ({ ...license, type: license.type || license.name || "", document: license.document || license.documentName || "" })) || base.licenses,
    turnovers: source.turnovers || base.turnovers,
    employees: source.employees?.map((employee: Obj) => ({ ...employee, role: employee.role || employee.designation || "" })) || base.employees,
    directors: source.directors || base.directors,
    bankAccounts: source.bankAccounts?.map((bank: Obj) => ({ ...bank, accountType: bank.accountType || bank.type || "" })) || base.bankAccounts,
  };
};

function Field({ label, value, onChange = () => {}, type = "text", hint, required = false, readOnly = false, multiline = false, options }: { label: string; value: any; onChange?: (v: string) => void; type?: string; hint?: string; required?: boolean; readOnly?: boolean; multiline?: boolean; options?: string[] }) {
  const generatedId = useId();
  const id = `fpc-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${generatedId}`;
  return <label className="fm-field" htmlFor={id}><span>{label}{required && <i>Required</i>}</span>{options ? <select id={id} value={value ?? ""} disabled={readOnly} onChange={(e) => onChange(e.target.value)}>{options.map((x) => <option key={x}>{x}</option>)}</select> : multiline ? <textarea id={id} value={value ?? ""} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} rows={3}/> : <input id={id} type={type} value={value ?? ""} readOnly={readOnly} required={required} onChange={(e) => onChange(e.target.value)} />}{hint && <small>{hint}</small>}</label>;
}
function Section({ title, note, children, number }: { title: string; note?: string; children: ReactNode; number?: string }) { return <section className="fm-section"><div className="fm-section-head">{number && <span className="fm-section-number">{number}</span>}<div><h3>{title}</h3>{note && <p>{note}</p>}</div></div>{children}</section>; }
function Status({ value }: { value: string }) { const tone = /active|approved|complete/i.test(value) ? "good" : /reject|inactive|expired/i.test(value) ? "bad" : /draft/i.test(value) ? "neutral" : "wait"; return <span className={`fm-status ${tone}`}>{value}</span>; }

export default function FpcManagement({ state, setState, role, screen, setToast }: Props) {
  const isTsf = role === "TSF Central Admin";
  const isProfile = /profile|company/i.test(screen) && !/onboard/i.test(screen);
  const isPendingQueue = isTsf && /pending/i.test(screen);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Obj>(() => withDetails(gv(state)));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sectionMode, setSectionMode] = useState<"edit" | "view">("edit");
  const [tab, setTab] = useState<"details" | "history">("details");
  const [historyFilter, setHistoryFilter] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [report, setReport] = useState<string[]>([]);
  const [pendingSave, setPendingSave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const current = useMemo(() => fpcRows(state).find((r) => r.id === (selectedId || editingId)) || gv(state), [state.records?.fpcs, selectedId, editingId]);

  useEffect(() => {
    const target = gv(state);
    if (target && !target.details) setState((s) => ({ ...s, records: { ...s.records, fpcs: fpcRows(s).map((r) => r.id === target.id ? { ...r, details: clone(seedDetails) } : r) } }));
  }, []);
  useEffect(() => { if (isProfile && !isEditing) setDraft(withDetails(current)); }, [current?.id, isProfile]);
  useEffect(() => {
    if (!isTsf || !isEditing) return;
    const timer = window.setInterval(() => {
      if (!editingId && !draft.basic?.legalName && !draft.basic?.cin) return;
      if (!editingId) {
        const row: RecordRow = { id: makeId("FPC-NEW-"), fpcId: "", name: draft.basic?.legalName || "New producer company", location: `${draft.location?.district || ""}, ${draft.location?.state || ""}`.replace(/^, |, $/g, ""), status: "Draft", farmers: "0", shareholders: "—", details: clone(draft), draftSavedAt: stamp() };
        setState((s) => ({
          ...s, records: { ...s.records, fpcs: [row, ...fpcRows(s)] },
          audit: [audit("FPC onboarding", row.id, "autosaved onboarding draft", undefined, row, row.id), ...s.audit],
          ...(s.offline ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC onboarding", record: row.id, status: "Pending sync", fpcId: row.id }, ...s.syncQueue] } : {}),
        }));
        setEditingId(row.id); setSelectedId(row.id);
      } else {
        setState((s) => {
          const prior = fpcRows(s).find((r) => r.id === editingId);
          const changed = JSON.stringify(prior?.details || {}) !== JSON.stringify(draft);
          return {
            ...s, records: { ...s.records, fpcs: fpcRows(s).map((r) => r.id === editingId ? { ...r, name: draft.basic?.legalName || r.name, location: `${draft.location?.district || ""}, ${draft.location?.state || ""}`.replace(/^, |, $/g, ""), details: clone(draft), draftSavedAt: stamp() } : r) },
            ...(changed && prior ? { audit: [audit("FPC onboarding", editingId, "autosaved onboarding draft", prior.details, draft, prior.fpcId || editingId), ...s.audit] } : {}),
            ...(s.offline && !s.syncQueue.some((item) => item.record === editingId && item.status === "Pending sync") ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC onboarding", record: editingId, status: "Pending sync", fpcId: prior?.fpcId || editingId }, ...s.syncQueue] } : {}),
          };
        });
      }
      setPendingSave(false);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isTsf, isEditing, editingId, draft, state.offline]);
  const patch = (section: string, key: string, value: any) => {
    setDraft((d) => ({ ...d, [section]: { ...(d[section] || {}), [key]: value } }));
    setPendingSave(true);
  };
  const patchRoot = (key: string, value: any) => { setDraft((d) => ({ ...d, [key]: value })); setPendingSave(true); };
  const openEditor = (row?: RecordRow) => {
    const target = row || null;
    setEditingId(target?.id || null); setSelectedId(target?.id || null); setDraft(withDetails(target || undefined)); setStep(0); setIsEditing(true); setSectionMode("edit"); setLogoPreview("");
  };
  const audit = (module: string, record: string, action: string, oldValue: unknown, newValue: unknown, fpcId: string) => ({ id: makeId("AUD-"), actor: role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role, role, module, record, action, oldValue: JSON.stringify(oldValue ?? ""), newValue: JSON.stringify(newValue ?? ""), date: stamp(), fpcId });
  const notify = (title: string, fpcId: string) => ({ id: makeId("NT-"), title, recipient: isTsf ? "FPC Admin / Manager" : "TSF Central Admin", date: "Just now", status: "Unread", fpcId });
  const sendRenewalReminder = () => {
    const expiring = (draft.licenses || []).find((item: Obj) => item.number === "FL/KEO/2023/041");
    if (!expiring) return;
    setState((s) => ({
      ...s,
      audit: [audit("Company profile", current.id, "sent fertilizer licence renewal reminder", undefined, expiring, current.fpcId || current.id), ...s.audit],
      notifications: [notify(`Renew fertilizer licence ${expiring.number} before ${expiring.expiryDate}`, current.fpcId || current.id), ...s.notifications],
      ...(s.offline && !s.syncQueue.some((item) => item.record === current.id && item.status === "Pending sync") ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC licence reminder", record: current.id, status: "Pending sync", fpcId: current.fpcId || current.id }, ...s.syncQueue] } : {}),
    }));
    setToast("Renewal reminder recorded and TSF notified.");
  };
  const updateRow = (id: string, transform: (r: RecordRow) => RecordRow, action: string, oldValue?: unknown, newValue?: unknown) => setState((s) => {
    const row = fpcRows(s).find((r) => r.id === id);
    const next = row ? transform(row) : undefined;
    return {
      ...s,
      records: { ...s.records, fpcs: fpcRows(s).map((r) => r.id === id && next ? next : r) },
      audit: [audit("FPC management", id, action, oldValue ?? row, newValue ?? next, row?.fpcId || id), ...s.audit],
      notifications: [notify(`${row?.name || id}: ${action}`, row?.fpcId || id), ...s.notifications],
      ...(s.offline && !s.syncQueue.some((item) => item.record === id && item.status === "Pending sync") ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC management", record: id, status: "Pending sync", fpcId: row?.fpcId || id }, ...s.syncQueue] } : {}),
    };
  });
  const validate = (index: number) => {
    const errors: string[] = [];
    const b = draft.basic || {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (index === 0) {
      if (!b.legalName?.trim()) errors.push("Registered legal name is required.");
      if (!/^[A-Z0-9]{21}$/.test(b.cin || "")) errors.push("CIN must contain exactly 21 letters or numbers.");
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(b.pan || "")) errors.push("Enter a valid PAN.");
      if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(b.tan || "")) errors.push("Enter a valid TAN.");
      if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(b.gstin || "") || (draft.location?.state === "Odisha" && !b.gstin.startsWith("21")) || (draft.location?.state === "Jharkhand" && !b.gstin.startsWith("20"))) errors.push("GSTIN must be 15 characters and match the selected state code (Odisha 21, Jharkhand 20).");
      if (!emailPattern.test(b.contactEmail || "")) errors.push("Enter a valid company contact email.");
      if (!/^\d{10}$/.test(String(b.mobile || "").replace(/\D/g, ""))) errors.push("Enter a 10-digit company contact mobile.");
      if (fpcRows(state).some((row) => row.id !== editingId && row.details?.basic?.cin?.toUpperCase() === String(b.cin || "").toUpperCase())) errors.push("This CIN is already registered.");
    }
    if (index === 1) {
      const licenses = draft.licenses || [];
      if (!licenses.length) errors.push("Add at least one operating licence.");
      if (licenses.some((l: Obj) => !l.type || !l.number || !l.authority || !l.issueDate || !l.expiryDate || !l.document)) errors.push("Complete the type, number, authority, dates and document for every licence.");
      if (licenses.some((l: Obj) => l.issueDate && l.expiryDate && l.issueDate > l.expiryDate)) errors.push("A licence expiry date cannot precede its issue date.");
    }
    if (index === 2) {
      const roc = draft.roc || {};
      if (!roc.office || !roc.incorporationDate || !roc.registeredAddress || !roc.financialYearEnd || !roc.agmDate || !roc.annualReturn || !roc.auditStatus) errors.push("Complete the ROC, incorporation, address and statutory filing details.");
    }
    if (index === 3) {
      const capital = draft.capital || {};
      if (!Number(capital.authorisedCapital) || !Number(capital.paidUpCapital) || !Number(capital.faceValue) || Number(capital.authorisedCapital) < 0 || Number(capital.paidUpCapital) < 0) errors.push("Enter valid authorised capital, paid-up capital and face value.");
      if (Number(capital.paidUpCapital) > Number(capital.authorisedCapital)) errors.push("Paid-up capital cannot exceed authorised capital.");
      if ((draft.turnovers || []).some((turnover: Obj) => !turnover.year || turnover.amount === "" || Number(turnover.amount) < 0)) errors.push("Enter the financial year and non-negative turnover for each of the last three years.");
    }
    if (index === 4) {
      const directors = draft.directors || [];
      const employees = draft.employees || [];
      if (directors.length < 5) errors.push("At least five directors are required.");
      if (directors.some((d: Obj) => !d.name || !/^\d{8}$/.test(d.din || "") || !d.designation || !d.appointmentDate || !/^\d{10}$/.test(String(d.mobile || "").replace(/\D/g, "")) || !emailPattern.test(d.email || "") || !d.address || !d.category)) errors.push("Each director needs a name, 8-digit DIN, designation, appointment date, mobile, email, address and category.");
      if (!directors.some((d: Obj) => d.gender === "Female")) errors.push("At least one woman director is required.");
      if (!employees.length || employees.some((employee: Obj) => !employee.name || !employee.role || !/^\d{10}$/.test(String(employee.mobile || "").replace(/\D/g, "")) || !employee.dateOfJoining || !employee.gender || !employee.employmentType)) errors.push("Enter each employee's name, role, mobile, start date, gender and employment type.");
    }
    if (index === 5) {
      const l = draft.location || {};
      if (!l.address || !l.state || !l.district || !l.block || !/^\d{6}$/.test(l.pin || "")) errors.push("Address, state, district, block and a six-digit PIN are required.");
      if (!Array.isArray(l.activities) || !l.activities.length || !l.commodities?.trim()) errors.push("Select at least one activity and enter the commodities handled.");
    }
    if (index === 6 && (!draft.admin?.name || !/^\d{10}$/.test(String(draft.admin?.mobile || "").replace(/\D/g, "")) || !emailPattern.test(draft.admin?.email || "") || Number(draft.admin?.subUserLimit) < 1)) errors.push("Admin name, valid 10-digit mobile, email and a positive sub-user limit are required.");
    if (errors.length) setToast(errors[0]);
    return errors.length === 0;
  };
  const saveDraft = (status = "Draft") => {
    const old = editingId ? fpcRows(state).find((r) => r.id === editingId) : undefined;
    const savedStatus = old && status === "Draft" && !["Draft","Rejected"].includes(old.status || "") ? old.status : status;
    const row: RecordRow = { ...(old || {}), id: old?.id || makeId("FPC-NEW-"), fpcId: old?.fpcId || (status === "Active" ? makeId("FPC-") : ""), name: draft.basic?.legalName || "New producer company", location: `${draft.location?.district || ""}, ${draft.location?.state || ""}`.replace(/^, |, $/g, ""), status: savedStatus, details: clone(draft), farmers: old?.farmers || "0", shareholders: old?.shareholders || "—" };
    setState((s) => ({
      ...s,
      records: { ...s.records, fpcs: old ? fpcRows(s).map((r) => r.id === old.id ? row : r) : [row, ...fpcRows(s)] },
      audit: [audit("FPC onboarding", row.id, old ? "saved onboarding draft" : "created onboarding draft", old, row, row.id), ...s.audit],
      ...(status === "Submitted" ? { notifications: [notify(`${row.name} submitted for TSF onboarding review`, row.fpcId || row.id), ...s.notifications] } : {}),
      ...(s.offline && !s.syncQueue.some((item) => item.record === row.id && item.status === "Pending sync") ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC onboarding", record: row.id, status: "Pending sync", fpcId: row.fpcId }, ...s.syncQueue] } : {}),
    }));
    setEditingId(row.id); setSelectedId(row.id); setPendingSave(false); setToast(status === "Submitted" ? "FPC submitted to TSF for review." : "Draft saved to this device.");
    if (status === "Submitted") { setIsEditing(false); setSelectedId(row.id); }
  };
  const submitWizard = () => {
    if (state.offline) { setToast("Connect to submit an FPC to TSF. You can save the draft offline."); return; }
    for (let i = 0; i < 7; i++) if (!validate(i)) { setStep(i); return; }
    saveDraft("Submitted");
  };
  const stepNext = () => { if (validate(step)) setStep((n) => Math.min(6, n + 1)); };
  const sample = () => { setDraft(clone(seedDetails)); setPendingSave(true); setToast("Green Valley example loaded. Review each section before submitting."); };
  const fileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setToast("Logo must be 2 MB or smaller."); return; }
    const reader = new FileReader(); reader.onload = () => setLogoPreview(String(reader.result || "")); reader.readAsDataURL(file);
    patch("basic", "logo", file.name);
  };
  const addRow = (key: string, value: Obj) => patchRoot(key, [...(draft[key] || []), value]);
  const removeRow = (key: string, index: number) => patchRoot(key, (draft[key] || []).filter((_: any, i: number) => i !== index));
  const setArrayField = (key: string, index: number, field: string, value: string) => patchRoot(key, (draft[key] || []).map((row: Obj, i: number) => i === index ? { ...row, [field]: value } : row));
  const uploadLicence = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setToast("Licence documents must be 10 MB or smaller."); event.target.value = ""; return; }
    setArrayField("licenses", index, "document", file.name);
    setToast(`${file.name} attached to the licence record.`);
    event.target.value = "";
  };
  const profileSave = () => {
    const original = withDetails(current);
    const protectedChanges: Obj = {};
    const live = clone(draft);
    for (const key of protectedKeys) {
      const section = key === "licences" ? "licenses" : key === "authorisedCapital" || key === "paidUpCapital" || key === "faceValue" ? "capital" : "basic";
      const field = key === "licences" ? null : key;
      if (field && JSON.stringify(original[section]?.[field] ?? "") !== JSON.stringify(draft[section]?.[field] ?? "")) {
        protectedChanges[key] = { oldValue: original[section]?.[field] ?? "", newValue: draft[section]?.[field] ?? "" };
        live[section][field] = original[section]?.[field] ?? "";
      }
    }
    if (JSON.stringify(original.licenses) !== JSON.stringify(draft.licenses)) {
      protectedChanges.licenses = { oldValue: original.licenses, newValue: draft.licenses };
      live.licenses = original.licenses;
    }
    const id = current.id;
    const requests: RecordRow[] = Object.entries(protectedChanges).map(([key, change]) => ({
      id: makeId("PCR-"), name: `${current.name} · ${key}`, entityType: "FPC", recordType: "FPC", recordId: id,
      field: key, pendingKey: key,
      path: key === "licenses" ? "licenses" : ["authorisedCapital", "paidUpCapital", "faceValue"].includes(key) ? `capital.${key}` : `basic.${key}`,
      oldValue: change.oldValue, newValue: change.newValue, status: "Submitted", requestedBy: role, date: stamp(), fpcId: current.fpcId || id,
    }));
    setState((s) => {
      const pendingChanges = { ...((current.details?.pendingChanges as Obj | undefined) || {}), ...protectedChanges };
      const updatedDetails = { ...live, ...(Object.keys(pendingChanges).length ? { pendingChanges } : {}) };
      const updatedRows = fpcRows(s).map((r) => r.id === id ? { ...r, details: updatedDetails, location: `${live.location.district}, ${live.location.state}`, lastUpdated: stamp() } : r);
      let next: State = { ...s, records: { ...s.records, fpcs: updatedRows }, audit: [audit("Company profile", id, "saved company profile update", original, draft, id), ...s.audit], notifications: [notify(`Company profile update received for ${current.name}`, id), ...s.notifications] };
      if (requests.length) next.records = { ...next.records, profileChangeRequests: [...requests, ...(next.records.profileChangeRequests || [])] };
      if (s.offline && !s.syncQueue.some((item) => item.record === id && item.status === "Pending sync")) next.syncQueue = [{ id: makeId("SYNC-"), type: "FPC company profile", record: id, status: "Pending sync", fpcId: current.fpcId || id }, ...s.syncQueue];
      return next;
    });
    setDraft(withDetails({ ...current, details: { ...live, pendingChanges: { ...((current.details?.pendingChanges as Obj | undefined) || {}), ...protectedChanges } } }));
    setPendingSave(false); setSectionMode("view"); setToast(state.offline ? "Company profile saved offline and queued to sync." : Object.keys(protectedChanges).length ? "Profile saved. Protected changes are awaiting TSF approval." : "Company profile saved and TSF notified.");
  };
  const reviewAction = (row: RecordRow, approve: boolean) => {
    if (state.offline) { setToast("Connect to review an FPC onboarding request."); return; }
    let reason = "";
    if (!approve) { reason = window.prompt("Reason for rejection (required):") || ""; if (!reason.trim()) { setToast("A rejection reason is required."); return; } }
    const old = row.status;
    const nextRow = { ...row, status: approve ? "Active" : "Rejected", ...(approve ? { fpcId: row.fpcId || makeId("FPC-"), onboardingDate: new Date().toISOString().slice(0, 10), defaultMastersCopied: true, invitePreview: { recipient: row.details?.admin?.mobile || row.details?.basic?.mobile, email: row.details?.admin?.email, status: "Prepared after approval" } } : { rejectionReason: reason.trim() }) };
    updateRow(row.id, () => nextRow, approve ? "approved FPC onboarding; default masters copied" : `rejected FPC onboarding: ${reason.trim()}`, old, nextRow);
    setSelectedId(null); setToast(approve ? "FPC approved. Default masters copied to the company workspace." : "FPC rejected with reason recorded.");
  };
  const rowAction = (row: RecordRow, action: string) => {
    if (action === "Edit") { openEditor(row); return; }
    if (action === "Deactivate") { const reason = window.prompt("Reason for deactivation:"); if (!reason?.trim()) { setToast("A reason is required to deactivate an FPC."); return; } updateRow(row.id, (r) => ({ ...r, status: "Inactive", deactivationReason: reason.trim() }), `deactivated: ${reason.trim()}`); }
    if (action === "Reactivate") updateRow(row.id, (r) => ({ ...r, status: "Active", reactivatedAt: stamp() }), "reactivated FPC");
    if (action === "Delete") { const confirmName = window.prompt(`Type the exact company name to delete:\n${row.name}`); if (confirmName !== row.name) { setToast("Company name did not match. No record was deleted."); return; } updateRow(row.id, (r) => ({ ...r, status: "Deleted", deletedAt: stamp() }), "deleted draft or rejected FPC"); }
  };
  const downloadTemplate = () => {
    const headers = ["company_name", "cin", "pan", "tan", "gstin", "state", "district", "block", "office_address", "pin", "contact_email", "contact_mobile"];
    const example = ["New Hills Farmer Producer Company Ltd.", "U01100OD2026PTC123456", "AAACN1234F", "BBNG01235A", "21AAACN1234F1Z5", "Odisha", "Keonjhar", "Patna", "New Hills, Keonjhar, Odisha", "758001", "onboarding@newhillsfpc.demo", "9876543210"];
    const sheet = XLSX.utils.aoa_to_sheet([headers, example]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "FPC Onboarding");
    XLSX.writeFile(workbook, "fpc-onboarding-template.xlsx");
  };
  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
      const isSpreadsheet = /\.(xlsx|xls)$/i.test(file.name);
      const workbook = isSpreadsheet
        ? XLSX.read(reader.result as ArrayBuffer, { type: "array" })
        : XLSX.read(String(reader.result || ""), { type: "string", ...(file.name.toLowerCase().endsWith(".tsv") ? { FS: "\t" } : {}) });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) { setReport(["The spreadsheet contains no worksheet."]); return; }
      const data = XLSX.utils.sheet_to_json<Obj>(firstSheet, { defval: "", raw: false });
      if (!data.length) { setReport(["No data rows found. Upload a filled Excel, CSV or TSV template."]); return; }
      const good: RecordRow[] = []; const results: string[] = [];
      const importedCins = new Set<string>();
      const keyName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
      data.forEach((rawRow, i) => {
        const record = Object.fromEntries(Object.entries(rawRow).map(([key, value]) => [keyName(key), String(value ?? "").trim()]));
        const name = record.companyname || record.name || "";
        const cin = (record.cin || "").toUpperCase();
        const pan = (record.pan || "").toUpperCase();
        const tan = (record.tan || "").toUpperCase();
        const gstin = (record.gstin || "").toUpperCase();
        const stateName = record.state || "";
        const mobile = (record.contactmobile || record.mobile || "").replace(/\D/g, "");
        const errors: string[] = [];
        if (!name) errors.push("company name is required");
        if (!/^[A-Z0-9]{21}$/.test(cin)) errors.push("CIN must be 21 letters or numbers");
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) errors.push("PAN is invalid");
        if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(tan)) errors.push("TAN is invalid");
        if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(gstin) || (stateName === "Odisha" && !gstin.startsWith("21")) || (stateName === "Jharkhand" && !gstin.startsWith("20"))) errors.push("GSTIN is invalid or does not match the state");
        if (!["Odisha", "Jharkhand"].includes(stateName)) errors.push("state must be Odisha or Jharkhand");
        if (!record.district || !record.block || !record.officeaddress) errors.push("district, block and office address are required");
        if (!/^\d{6}$/.test(record.pin || "")) errors.push("PIN must contain six digits");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contactemail || "")) errors.push("contact email is invalid");
        if (!/^\d{10}$/.test(mobile)) errors.push("contact mobile must contain ten digits");
        if (importedCins.has(cin) || fpcRows(state).some((row) => row.details?.basic?.cin?.toUpperCase() === cin)) errors.push("CIN is already in the register");
        if (errors.length) { results.push(`Row ${i + 2}: invalid — ${errors.join("; ")}.`); return; }
        importedCins.add(cin);
        const d = clone(blankDetails);
        d.basic.legalName = name; d.basic.cin = cin; d.basic.pan = pan; d.basic.tan = tan; d.basic.gstin = gstin; d.basic.contactEmail = record.contactemail; d.basic.mobile = mobile;
        d.location.state = stateName; d.location.district = record.district; d.location.block = record.block; d.location.address = record.officeaddress; d.location.pin = record.pin;
        good.push({ id: makeId("FPC-IMP-"), fpcId: makeId("FPC-"), name, location: `${d.location.district}, ${d.location.state}`, status: "Draft", farmers: "0", shareholders: "—", details: d });
        results.push(`Row ${i + 2}: valid — saved as Draft.`);
      });
      setState((s) => ({
        ...s, records: { ...s.records, fpcs: [...good, ...fpcRows(s)] },
        audit: [...good.map((r) => audit("FPC import", r.id, "imported as draft", undefined, r, r.fpcId || r.id)), ...s.audit],
        ...(s.offline && good.length ? { syncQueue: [...good.map((r) => ({ id: makeId("SYNC-"), type: "FPC bulk import", record: r.id, status: "Pending sync", fpcId: r.fpcId || r.id })), ...s.syncQueue] } : {}),
      }));
      setReport(results.length ? results : ["No valid rows found."]); setToast(`${good.length} valid row${good.length === 1 ? "" : "s"} imported as Draft.`);
      } catch {
        setReport(["Could not read this file. Use the provided Excel template or a CSV/TSV file with the required headers."]);
      }
    };
    if (/\.(xlsx|xls)$/i.test(file.name)) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
    event.target.value = "";
  };
  const filtered = fpcRows(state).filter((r) => r.status !== "Deleted" && (!isPendingQueue || r.status === "Submitted") && `${r.name} ${r.id} ${r.location} ${r.status}`.toLowerCase().includes(query.toLowerCase()));
  const currentStatus = current?.status || "Active";
  const license = (draft.licenses || []).find((x: Obj) => x.type === "Fertilizer" || x.number === "FL/KEO/2023/041");
  const expiryBanner = isProfile && license?.expiryDate;
  const licenseDaysRemaining = license?.expiryDate ? Math.ceil((new Date(`${license.expiryDate}T00:00:00`).getTime() - Date.now()) / 86400000) : null;
  const licenseExpiryLabel = license?.expiryDate ? new Date(`${license.expiryDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const history = (state.audit || []).filter((a) => (a.fpcId === current?.fpcId || a.fpcId === current?.id) && /company profile|profile/i.test(`${a.module} ${a.action}`) && `${a.actor} ${a.action} ${a.record}`.toLowerCase().includes(historyFilter.toLowerCase()));
  const baselineDetails = withDetails(current);
  const profileDiff = [...new Set([...Object.keys(baselineDetails), ...Object.keys(draft)])].flatMap((section) => {
    const before = baselineDetails[section]; const after = draft[section];
    if (JSON.stringify(before) === JSON.stringify(after)) return [];
    if (Array.isArray(before) || Array.isArray(after) || typeof before !== "object" || typeof after !== "object" || !before || !after) return [{ label: section, before, after }];
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((key) => JSON.stringify(before[key] ?? "") !== JSON.stringify(after[key] ?? "")).map((key) => ({ label: `${section} · ${key}`, before: before[key], after: after[key] }));
  });
  const completeness = [
    !!draft.basic?.legalName && /^[A-Z0-9]{21}$/.test(draft.basic?.cin || "") && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(draft.basic?.pan || "") && /^[A-Z]{4}[0-9]{5}[A-Z]$/.test(draft.basic?.tan || "") && /^[0-9]{2}[A-Z0-9]{13}$/.test(draft.basic?.gstin || ""),
    !!draft.licenses?.length && draft.licenses.every((license: Obj) => license.type && license.number && license.authority && license.issueDate && license.expiryDate && license.document),
    !!draft.roc?.office && !!draft.roc?.incorporationDate && !!draft.roc?.registeredAddress && !!draft.roc?.financialYearEnd && !!draft.roc?.agmDate,
    Number(draft.capital?.authorisedCapital) > 0 && Number(draft.capital?.paidUpCapital) > 0 && Number(draft.capital?.paidUpCapital) <= Number(draft.capital?.authorisedCapital) && (draft.turnovers || []).every((turnover: Obj) => turnover.year && turnover.amount !== ""),
    (draft.directors || []).length >= 5 && draft.directors.some((director: Obj) => director.gender === "Female") && draft.directors.every((director: Obj) => director.name && /^\d{8}$/.test(director.din || "") && director.designation && director.appointmentDate && director.mobile && director.email && director.address && director.category) && (draft.employees || []).length > 0 && draft.employees.every((employee: Obj) => employee.name && employee.role && employee.mobile && employee.dateOfJoining && employee.gender && employee.employmentType),
    !!draft.location?.address && !!draft.location?.state && !!draft.location?.district && !!draft.location?.block && /^\d{6}$/.test(draft.location?.pin || "") && !!draft.location?.activities?.length && !!draft.location?.commodities,
    !!draft.admin?.name && /^\d{10}$/.test(String(draft.admin?.mobile || "").replace(/\D/g, "")) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.admin?.email || "") && Number(draft.admin?.subUserLimit) > 0,
  ];
  const completenessPercent = Math.round(completeness.filter(Boolean).length / 7 * 100);
  const renderStep = (index: number) => {
    const b = draft.basic || {}; const c = draft.capital || {}; const loc = draft.location || {}; const admin = draft.admin || {};
    if (index === 0) return <Section title="Registered identity" note="Use the legal name and identifiers shown on the incorporation certificate." number="01">
      <div className="fm-grid two"><Field label="Registered company name" value={b.legalName} required onChange={(v) => patch("basic", "legalName", v)}/><Field label="CIN" value={b.cin} required hint="Exactly 21 characters" onChange={(v) => patch("basic", "cin", v.toUpperCase())}/><Field label="PAN" value={b.pan} required onChange={(v) => patch("basic", "pan", v.toUpperCase())}/><Field label="TAN" value={b.tan} required onChange={(v) => patch("basic", "tan", v.toUpperCase())}/><Field label="GSTIN" value={b.gstin} required hint="State code 21 for Odisha · 20 for Jharkhand" onChange={(v) => patch("basic", "gstin", v.toUpperCase())}/><Field label="Contact email" type="email" value={b.contactEmail} required onChange={(v) => patch("basic", "contactEmail", v)}/><Field label="Contact mobile" value={b.mobile} required onChange={(v) => patch("basic", "mobile", v)}/><div className="fm-logo"><span>Company mark</span>{logoPreview || b.logo?.startsWith("data:") ? <img src={logoPreview || b.logo} alt="Company logo preview"/> : <div className="fm-logo-placeholder">{String(b.legalName || "FPC").slice(0, 2).toUpperCase()}</div>}<input ref={fileRef} type="file" accept="image/*" aria-label="Upload company logo" onChange={fileUpload}/><button className="fm-button ghost" type="button" onClick={() => fileRef.current?.click()}><Upload size={14}/> Upload logo · max 2 MB</button>{b.logo && <small>{b.logo}</small>}</div></div>
    </Section>;
    if (index === 1) return <Section title="Operating licences" note="Track validity and attach a supporting licence file." number="02">
      {(draft.licenses || []).map((item: Obj, i: number) => {
        const days = item.expiryDate ? Math.ceil((new Date(`${item.expiryDate}T00:00:00`).getTime() - Date.now()) / 86400000) : null;
        return <div className="fm-row-card" key={i}><div className="fm-row-title"><b>Licence {String(i + 1).padStart(2, "0")}</b><button className="fm-icon-button" type="button" aria-label={`Remove licence ${i + 1}`} onClick={() => removeRow("licenses", i)}><Trash2 size={15}/></button></div><div className="fm-grid three">{[["type","Licence type"],["number","Licence number"],["authority","Issuing authority"],["issueDate","Issue date"],["expiryDate","Expiry date"],["document","Document filename"]].map(([key,label]) => <Field key={key} label={label} type={key.toLowerCase().includes("date") ? "date" : "text"} value={item[key]} onChange={(v) => setArrayField("licenses", i, key, v)}/>)}</div><label className="fm-doc-upload"><Upload size={14}/><span>Attach PDF or image · up to 10 MB</span><input type="file" accept=".pdf,image/*" onChange={(event) => uploadLicence(i, event)}/></label>{item.document && <small className="fm-document-name">Attached filename: {item.document}</small>}{days !== null && <span className={`fm-expiry-chip ${days < 0 ? "expired" : days <= 60 ? "current" : "valid"}`}><Clock3 size={13}/>{days < 0 ? `Expired ${Math.abs(days)} days ago` : days <= 60 ? `Expiring in ${days} days` : "Valid"} · {new Date(`${item.expiryDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}</div>;
      })}<button className="fm-button ghost" onClick={() => addRow("licenses", { type: "FSSAI", number: "", authority: "", issueDate: "", expiryDate: "", document: "" })}><Plus size={15}/> Add licence</button>
    </Section>;
    if (index === 2) return <Section title="ROC & statutory calendar" note="Company registry and annual compliance information." number="03"><div className="fm-grid two">{[["office","ROC office"],["incorporationDate","Date of incorporation"],["registeredAddress","Registered address"],["financialYearEnd","Financial year end"],["agmDate","Last AGM date"],["annualReturn","Annual return status"],["auditStatus","Audit status"]].map(([key,label]) => <Field key={key} label={label} type={key.toLowerCase().includes("date") ? "date" : "text"} value={draft.roc?.[key]} options={key === "annualReturn" ? ["Not filed","In progress","Filed"] : key === "auditStatus" ? ["Not started","In progress","Completed"] : undefined} onChange={(v) => patch("roc", key, v)}/>)}</div></Section>;
    if (index === 3) return <><Section title="Share capital" note="Shares are calculated from paid-up capital divided by face value." number="04"><div className="fm-grid three"><Field label="Authorised capital (₹)" type="number" value={c.authorisedCapital} onChange={(v) => patch("capital","authorisedCapital",v)}/><Field label="Paid-up capital (₹)" type="number" value={c.paidUpCapital} onChange={(v) => patch("capital","paidUpCapital",v)}/><Field label="Face value per share (₹)" type="number" value={c.faceValue} onChange={(v) => { patch("capital","faceValue",v); patch("capital","shares",String(Number(c.paidUpCapital || 0) / Math.max(1,Number(v || 1)))); }}/></div><div className="fm-calculation"><span>Computed shares</span><strong>{Math.floor(Number(c.paidUpCapital || 0) / Math.max(1, Number(c.faceValue || 1))).toLocaleString("en-IN")}</strong><small>Paid-up capital ÷ face value</small></div></Section><Section title="Three-year turnover" note="Enter audited or provisional annual turnover in rupees."><div className="fm-grid three">{(draft.turnovers || []).map((r: Obj, i: number) => <div className="fm-turnover" key={i}><Field label={`Financial year ${i + 1}`} value={r.year} onChange={(v) => setArrayField("turnovers", i, "year", v)}/><Field label="Turnover (₹)" type="number" value={r.amount} onChange={(v) => setArrayField("turnovers", i, "amount", v)}/></div>)}</div></Section></>;
    if (index === 4) return <>
      <Section title="Employees" note="Name, role, contact, joining date, gender and employment type." number="05">
        <div className="fm-grid two">{(draft.employees || []).map((r: Obj, i: number) => <div className="fm-row-card" key={i}>
          <div className="fm-row-title"><b>Employee {String(i + 1).padStart(2, "0")}</b><button className="fm-icon-button" type="button" aria-label={`Remove employee ${i + 1}`} onClick={() => removeRow("employees", i)}><Trash2 size={14}/></button></div>
          <div className="fm-grid two"><Field label="Name" value={r.name} onChange={(v) => setArrayField("employees", i, "name", v)}/><Field label="Role or designation" value={r.role} onChange={(v) => setArrayField("employees", i, "role", v)}/><Field label="Mobile" value={r.mobile} onChange={(v) => setArrayField("employees", i, "mobile", v)}/><Field label="Date of joining" type="date" value={r.dateOfJoining} onChange={(v) => setArrayField("employees", i, "dateOfJoining", v)}/><Field label="Gender" value={r.gender} options={["Female","Male","Other"]} onChange={(v) => setArrayField("employees", i, "gender", v)}/><Field label="Employment type" value={r.employmentType} options={["Full-time","Part-time","Contract"]} onChange={(v) => setArrayField("employees", i, "employmentType", v)}/></div>
        </div>)}</div>
        <button className="fm-button ghost" onClick={() => addRow("employees", { name: "", role: "", mobile: "", dateOfJoining: "", gender: "", employmentType: "Full-time" })}><Plus size={14}/> Add employee</button>
      </Section>
      <Section title="Board of directors" note={`${draft.directors?.length || 0} directors · minimum five · at least one woman`}>
        <div className="fm-director-list">{(draft.directors || []).map((r: Obj, i: number) => <div className="fm-row-card" key={i}>
          <div className="fm-row-title"><b>Director {String(i + 1).padStart(2, "0")}</b><button className="fm-icon-button" type="button" aria-label={`Remove director ${i + 1}`} onClick={() => removeRow("directors", i)}><Trash2 size={14}/></button></div>
          <div className="fm-grid three"><Field label="Full name" value={r.name} onChange={(v) => setArrayField("directors", i, "name", v)}/><Field label="DIN · 8 digits" value={r.din} onChange={(v) => setArrayField("directors", i, "din", v)}/><Field label="Designation" value={r.designation} onChange={(v) => setArrayField("directors", i, "designation", v)}/><Field label="Appointment date" type="date" value={r.appointmentDate} onChange={(v) => setArrayField("directors", i, "appointmentDate", v)}/><Field label="Mobile" value={r.mobile} onChange={(v) => setArrayField("directors", i, "mobile", v)}/><Field label="Email" type="email" value={r.email} onChange={(v) => setArrayField("directors", i, "email", v)}/><Field label="Address" value={r.address} onChange={(v) => setArrayField("directors", i, "address", v)}/><Field label="Social category" value={r.category} options={["General","SC","ST","OBC","Other"]} onChange={(v) => setArrayField("directors", i, "category", v)}/><Field label="Gender" value={r.gender} options={["Female","Male","Other"]} onChange={(v) => setArrayField("directors", i, "gender", v)}/></div>
        </div>)}</div>
        <button className="fm-button ghost" onClick={() => addRow("directors", { name: "", din: "", gender: "", designation: "", appointmentDate: "", mobile: "", email: "", address: "", category: "" })}><Plus size={14}/> Add director</button>
      </Section>
    </>;
    if (index === 5) {
      const districts = loc.state === "Jharkhand" ? ["West Singhbhum","Seraikela-Kharsawan","East Singhbhum"] : ["Keonjhar","Jajpur","Balasore","Mayurbhanj"];
      const blocks = loc.district === "Keonjhar" ? ["Keonjhar Sadar","Telkoi","Harichandanpur","Patna"] : loc.district === "West Singhbhum" ? ["Noamundi","Chaibasa","Manoharpur"] : loc.district === "Seraikela-Kharsawan" ? ["Seraikela","Chandil","Gamharia"] : loc.district === "Jajpur" ? ["Jajpur Sadar","Korei","Dharmasala"] : ["Central","North","South"];
      const activities = ["Produce aggregation","Input supply","Marketing","Primary processing","Soil testing","Other"];
      return <>
        <Section title="Registered & operating location" number="06">
          <div className="fm-grid three"><Field label="Office address" value={loc.address} required onChange={(v) => patch("location","address",v)}/><Field label="State" value={loc.state} options={["Odisha","Jharkhand"]} required onChange={(v) => { patch("location","state",v); patch("location","district",""); patch("location","block",""); }}/><Field label="District" value={loc.district} options={districts} required onChange={(v) => { patch("location","district",v); patch("location","block",""); }}/><Field label="Block" value={loc.block} options={blocks} required onChange={(v) => patch("location","block",v)}/><Field label="PIN code" value={loc.pin} required onChange={(v) => patch("location","pin",v)}/><Field label="Latitude" value={loc.latitude} onChange={(v) => patch("location","latitude",v)}/><Field label="Longitude" value={loc.longitude} onChange={(v) => patch("location","longitude",v)}/></div>
        </Section>
        <Section title="Activities & commodities" note="Select all business activities and list the commodities handled.">
          <div className="fm-grid two"><div className="fm-field"><span>Activities</span><div className="fm-activity-grid">{activities.map((activity) => <label key={activity}><input type="checkbox" checked={(Array.isArray(loc.activities) ? loc.activities : []).includes(activity)} onChange={(event) => patch("location","activities",event.target.checked ? [...(loc.activities || []), activity] : (loc.activities || []).filter((item: string) => item !== activity))}/>{activity}</label>)}</div></div><Field label="Commodities" multiline value={loc.commodities} onChange={(v) => patch("location","commodities",v)}/><Field label="Villages covered" type="number" value={loc.villages} onChange={(v) => patch("location","villages",v)}/><Field label="Farmer enrolment target" type="number" value={loc.farmerTarget} onChange={(v) => patch("location","farmerTarget",v)}/></div>
        </Section>
      </>;
    }
    return <>
      <Section title="FPC administrator invite" note="An invite preview is prepared for SMS. No message is sent from this demo." number="07">
        <div className="fm-grid two"><Field label="Admin full name" value={admin.name} required onChange={(v) => patch("admin","name",v)}/><Field label="Mobile number" value={admin.mobile} required onChange={(v) => patch("admin","mobile",v)}/><Field label="Email address" type="email" value={admin.email} required onChange={(v) => patch("admin","email",v)}/><Field label="Sub-user limit" type="number" value={admin.subUserLimit} onChange={(v) => patch("admin","subUserLimit",v)}/><Field label="Multi-FPC sharing rule" value={admin.multiFpcRule || "Inherited from TSF"} readOnly/></div>
        <div className="fm-sms"><span className="fm-sms-icon"><Check size={16}/></span><div><b>SMS invite preview · sent after approval</b><p>Hello {admin.name || "[admin name]"}, you are invited to manage {b.legalName || "[company name]"} on the TSF FPC platform. Your access link will be shared after approval.</p></div></div>
      </Section>
      <Section title="Review before submission" note="Open any step to review or correct its information.">
        <div className="fm-review-list">{steps.map((label,i)=><button key={label} onClick={() => setStep(i)}><span><b>{String(i+1).padStart(2,"0")} · {label}</b><small>{i === 0 ? b.legalName || "Legal company details" : i === 5 ? `${loc.district || "District"}, ${loc.state || "State"}` : i === 6 ? `${admin.name || "Admin contact"} · limit ${admin.subUserLimit || "—"}` : "Review saved information"}</small></span><span className="fm-review-link">Edit <ArrowRight size={14}/></span></button>)}</div>
        <div className="fm-completeness"><span>Wizard completeness</span><b>{completenessPercent}%</b><i><span style={{ width: `${completenessPercent}%` }}/></i><small>{completeness.filter(Boolean).length} of 7 sections complete</small></div>
      </Section>
    </>;
  };

  if (isProfile) return <main className={`fm-root ${sectionMode === "view" ? "fm-profile-readonly" : ""}`}>
    <header className="fm-header"><div><span className="fm-eyebrow">Company record · {current?.fpcId || current?.id}</span><h1>Company profile</h1><p>One reliable record for company identity, governance and compliance.</p></div><div className="fm-header-actions"><Status value={currentStatus}/><button className="fm-button secondary" onClick={() => { setSectionMode(sectionMode === "edit" ? "view" : "edit"); setDraft(withDetails(current)); }}><span>{sectionMode === "edit" ? "Discard edits" : "Edit profile"}</span></button>{sectionMode === "edit" && <button className="fm-button primary" onClick={profileSave}><Save size={15}/> Save changes</button>}</div></header>
     {expiryBanner && <div className="fm-alert"><AlertTriangle size={18}/><div><b>{licenseDaysRemaining !== null && licenseDaysRemaining < 0 ? "Fertilizer licence expired" : "Fertilizer licence renewal coming up"}</b><p>{license?.number || "FL/KEO/2023/041"} expires {licenseExpiryLabel} · {licenseDaysRemaining !== null && licenseDaysRemaining < 0 ? `${Math.abs(licenseDaysRemaining)} days overdue` : `${licenseDaysRemaining} days left`}. Start renewal preparation now.</p></div><button onClick={sendRenewalReminder}>Renew reminder</button><button onClick={() => document.getElementById("profile-section-1")?.scrollIntoView({ behavior: "smooth" })}>Review licence</button></div>}
    {!!Object.keys(current?.details?.pendingChanges || {}).length && <div className="fm-pending-banner"><Clock3 size={15}/><span><b>Protected changes awaiting TSF</b>{Object.keys(current.details.pendingChanges).map((name) => <em key={name}>{name}</em>)}</span></div>}
     <div className="fm-profile-top"><div className="fm-company-mark">{logoPreview || draft.basic?.logo?.startsWith("data:") ? <img src={logoPreview || draft.basic.logo} alt="Company logo"/> : String(current?.name || "FPC").split(/\s+/).slice(0,2).map((word: string) => word[0]).join("").toUpperCase()}</div><div><span className="fm-eyebrow">Producer company</span><h2>{current?.name}</h2><p><span>{current?.location}</span><span className="fm-dot"/> <span>Onboarded {current?.onboardingDate || "14 Jun 2021"}</span><span className="fm-dot"/><span>Code {current?.fpcId || current?.id}</span></p></div></div>
    <nav className="fm-tabs" aria-label="Company profile tabs"><button className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>Company record</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><History size={15}/> Change history <span>{history.length}</span></button></nav>
     {tab === "history" ? <section className="fm-history"><div className="fm-history-head"><div><h3>Company profile history</h3><p>Every change is recorded with its actor and previous value.</p></div><input aria-label="Filter history" placeholder="Filter history" value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}/></div>{history.length ? history.map((item) => <article className="fm-history-row" key={item.id}><span className="fm-history-dot"/><div><b>{item.action}</b><p>{item.actor} · {item.role} · {item.date}</p><details><summary>View recorded values</summary><pre>Previous: {item.oldValue}<br/>Updated: {item.newValue}</pre></details></div></article>) : <div className="fm-empty"><History size={22}/><b>No profile changes yet</b><span>Saved company profile changes will appear here.</span></div>}</section> : <div className="fm-profile-layout"><aside className="fm-profile-nav"><b>PROFILE SECTIONS</b>{steps.map((s,i)=><button key={s} onClick={() => document.getElementById(`profile-section-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{String(i+1).padStart(2,"0")}</span>{s}</button>)}<button onClick={() => document.getElementById("profile-banks")?.scrollIntoView({ behavior: "smooth" })}><span>08</span>Bank accounts</button></aside><div className="fm-profile-sections">{steps.map((s,i)=><div id={`profile-section-${i}`} key={s} className="fm-profile-card"><div className="fm-profile-card-head"><div><span className="fm-eyebrow">SECTION {String(i+1).padStart(2,"0")}</span><h3>{s}</h3></div>{([0,1,3].includes(i)) && <span className="fm-protected"><ShieldCheck size={13}/> TSF approval for protected fields</span>}</div>{renderStep(i)}</div>)}<div className="fm-profile-card" id="profile-banks"><div className="fm-profile-card-head"><div><span className="fm-eyebrow">SECTION 08</span><h3>Bank accounts</h3></div></div>{(draft.bankAccounts || []).map((r: Obj,i:number)=><div className="fm-row-card" key={i}><div className="fm-grid three">{[["bank","Bank name"],["branch","Branch"],["accountNumber","Account number"],["ifsc","IFSC"],["accountType","Account type"]].map(([key,label])=><Field key={key} label={label} value={r[key]} onChange={(v)=>setArrayField("bankAccounts",i,key,v)}/>)}</div><button className="fm-icon-button" aria-label="Remove bank account" onClick={()=>removeRow("bankAccounts",i)}><Trash2 size={14}/></button></div>)}<button className="fm-button ghost" onClick={()=>addRow("bankAccounts",{bank:"",branch:"",accountNumber:"",ifsc:"",accountType:"Current"})}><Plus size={14}/> Add bank account</button><div className="fm-locked-fields"><ShieldCheck size={16}/><span><b>Locked identifiers</b><small>FPC code and onboarding date are system controlled and cannot be edited.</small></span><span>{current?.fpcId || current?.id} · {current?.onboardingDate || "14 Jun 2021"}</span></div></div>{sectionMode === "edit" && !!profileDiff.length && <div className="fm-diff-card"><div><b>Review changes before save</b><small>{profileDiff.length} field{profileDiff.length === 1 ? "" : "s"} changed · protected items are sent for TSF approval</small></div>{profileDiff.map((change) => <div className="fm-diff-row" key={change.label}><span>{change.label}</span><del>{typeof change.before === "object" ? JSON.stringify(change.before) : String(change.before ?? "—")}</del><b>{typeof change.after === "object" ? JSON.stringify(change.after) : String(change.after ?? "—")}</b></div>)}</div>}<div className="fm-save-bar"><span>{pendingSave ? "Unsaved profile changes" : "Changes save to the local company record"}</span><button className="fm-button primary" onClick={profileSave}><Save size={15}/> Save profile</button></div></div></div>}
  </main>;

  if (isEditing || (isTsf && /onboard|new fpc|add fpc/i.test(screen))) return <main className="fm-root">
    <header className="fm-header"><div><button className="fm-back" onClick={() => { setIsEditing(false); setEditingId(null); }}><ArrowLeft size={15}/> FPC workflow</button><span className="fm-eyebrow">TSF central operations · ONBOARDING</span><h1>{editingId ? "Edit producer company" : "Onboard a producer company"}</h1><p>Seven checks. One dependable company record.</p></div><div className="fm-header-actions"><span className="fm-save-state"><i className={pendingSave ? "unsaved" : ""}/>{pendingSave ? "Changes not saved" : "Autosave every 10 seconds"}</span><button className="fm-button secondary" onClick={sample}>Fill sample</button><button className="fm-button secondary" onClick={() => saveDraft("Draft")}><Save size={14}/> Save draft</button></div></header>
    <div className="fm-wizard-progress"><div className="fm-progress-top"><span>Step {step + 1} of 7</span><b>{steps[step]}</b><span>{Math.round((step / 6) * 100)}% complete</span></div><div className="fm-progress-line"><i style={{ width: `${((step + 1) / 7) * 100}%` }}/></div><div className="fm-stepper">{steps.map((s,i)=><button className={`${step === i ? "current" : ""} ${step > i ? "complete" : ""}`} key={s} onClick={() => { if (i <= step) setStep(i); else if (validate(step)) setStep(i); }}><span>{step > i ? <Check size={13}/> : `0${i+1}`}</span><small>{s}</small></button>)}</div></div>
    <div className="fm-wizard-body"><div className="fm-wizard-main">{renderStep(step)}<div className="fm-wizard-footer"><button className="fm-button secondary" onClick={() => step ? setStep(step-1) : setIsEditing(false)}>{step ? "Previous step" : "Cancel"}</button><div><button className="fm-button ghost" onClick={() => saveDraft("Draft")}>Save draft</button>{step < 6 ? <button className="fm-button primary" onClick={stepNext}>Continue <ArrowRight size={15}/></button> : <button className="fm-button primary" onClick={submitWizard}><ShieldCheck size={15}/> Submit to TSF</button>}</div></div></div><aside className="fm-wizard-aside"><div className="fm-aside-card"><span className="fm-aside-icon"><FileText size={18}/></span><h3>Company record</h3><p>Keep legal documents close. Licence filenames are saved with the record; image bytes stay in this session preview.</p><div className="fm-aside-line"><span>Company</span><b>{draft.basic?.legalName || "Not entered"}</b></div><div className="fm-aside-line"><span>FPC code</span><b>{editingId || "Assigned on draft save"}</b></div><div className="fm-aside-line"><span>Workflow</span><Status value={editingId ? currentStatus : "Draft"}/></div></div><div className="fm-aside-note"><CircleHelp size={16}/><span><b>Need a starting point?</b><small>Fill sample adds Green Valley's example details so you can see the complete record structure.</small></span></div></aside></div>
  </main>;

  const detailRow = selectedId && fpcRows(state).find((r) => r.id === selectedId);
  return <main className="fm-root">
    <header className="fm-header"><div><span className="fm-eyebrow">TSF CENTRAL · PRODUCER NETWORK</span><h1>{isPendingQueue ? "Pending FPC approvals" : "FPC management"}</h1><p>{isPendingQueue ? "Review submitted company records and record an approval or rejection reason." : "Onboard, review and maintain the producer company network."}</p></div><div className="fm-header-actions">{!isPendingQueue && <><button className="fm-button secondary" onClick={downloadTemplate}><Download size={15}/> Excel template</button><label className="fm-button secondary fm-upload-btn"><Upload size={14}/> Import Excel / CSV<input type="file" accept=".xlsx,.xls,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/tab-separated-values" onChange={importFile}/></label><button className="fm-button primary" onClick={() => openEditor()}><Plus size={16}/> Onboard FPC</button></>}</div></header>
    <div className="fm-network-strip"><div><span>{isPendingQueue ? "PENDING REVIEW" : "NETWORK REGISTER"}</span><b>{isPendingQueue ? filtered.length : fpcRows(state).filter((r) => r.status !== "Deleted").length} <small>{isPendingQueue ? "requests to review" : "producer companies"}</small></b></div><div className="fm-network-stat"><span>Active</span><b>{fpcRows(state).filter((r)=>r.status==="Active").length}</b></div><div className="fm-network-stat"><span>Awaiting review</span><b>{fpcRows(state).filter((r)=>r.status==="Submitted").length}</b></div><div className="fm-network-stat"><span>Drafts</span><b>{fpcRows(state).filter((r)=>r.status==="Draft").length}</b></div><span className="fm-network-mark"><Landmark size={20}/></span></div>
    {report.length > 0 && <div className="fm-import-report"><div><FileSpreadsheet size={17}/><b>Import validation report</b></div><button className="fm-icon-button" aria-label="Close report" onClick={() => setReport([])}><X size={16}/></button><ul>{report.map((line,i)=><li key={i}>{line}</li>)}</ul></div>}
    <section className="fm-list-card"><div className="fm-list-toolbar"><div><h2>{isPendingQueue ? "Company review queue" : "Company register"}</h2><p>{isPendingQueue ? "Open a submitted record to review each of its seven sections." : "Review status and open a company record to take action."}</p></div><input aria-label="Search companies" placeholder="Search name, code or location" value={query} onChange={(e)=>setQuery(e.target.value)}/></div>
      <div className="fm-table-scroll"><table className="fm-table"><thead><tr><th>Producer company</th><th>FPC code</th><th>Location</th><th>Farmers</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((row)=><tr key={row.id}><td><b>{row.name}</b><small>{row.shareholders || "—"} shareholders</small></td><td className="fm-code">{row.fpcId || (["Draft","Submitted"].includes(row.status || "") ? "Assigned after approval" : row.id)}</td><td>{row.location || "—"}</td><td>{row.farmers || "—"}</td><td><Status value={row.status || "Draft"}/></td><td><div className="fm-row-actions">{row.status === "Submitted" ? <><button onClick={()=>setSelectedId(row.id)}>Review</button><button className="accept" disabled={state.offline} onClick={()=>reviewAction(row,true)}>Approve</button><button className="reject" disabled={state.offline} onClick={()=>reviewAction(row,false)}>Reject</button></> : <><button onClick={()=>rowAction(row,"Edit")}>Edit</button>{row.status === "Active" ? <button className="reject" onClick={()=>rowAction(row,"Deactivate")}>Deactivate</button> : row.status === "Inactive" ? <button className="accept" onClick={()=>rowAction(row,"Reactivate")}>Reactivate</button> : null}{["Draft","Rejected"].includes(row.status || "") && <button className="reject" onClick={()=>rowAction(row,"Delete")}>Delete</button>}</>}</div></td></tr>)}</tbody></table></div>
      {!filtered.length && <div className="fm-empty"><Landmark size={24}/><b>{isPendingQueue ? "No FPCs are waiting for review" : "No producer companies found"}</b><span>{isPendingQueue ? "Submitted company records will appear here." : "Try another search, or start an onboarding record."}</span>{!isPendingQueue && <button className="fm-button primary" onClick={() => openEditor()}><Plus size={14}/> Onboard FPC</button>}</div>}
    </section>
    {detailRow && <div className="fm-modal-backdrop" onClick={()=>setSelectedId(null)}><section className="fm-review-drawer" onClick={(e)=>e.stopPropagation()}><div className="fm-drawer-head"><div><span className="fm-eyebrow">ONBOARDING REVIEW · {detailRow.fpcId || detailRow.id}</span><h2>{detailRow.name}</h2><Status value={detailRow.status || "Draft"}/></div><button className="fm-icon-button" aria-label="Close review" onClick={()=>setSelectedId(null)}><X size={18}/></button></div><div className="fm-review-summary">{steps.slice(0,6).map((s,i)=><button key={s} onClick={()=>{setSelectedId(null);openEditor(detailRow);setStep(i);}}><span>{String(i+1).padStart(2,"0")}</span><b>{s}</b><small>{i===0?detailRow.details?.basic?.legalName || detailRow.name:i===5?detailRow.location:"Information recorded"}</small><ArrowRight size={14}/></button>)}</div><div className="fm-drawer-foot"><button className="fm-button secondary" onClick={()=>rowAction(detailRow,"Edit")}>Edit record</button><button className="fm-button reject-outline" onClick={()=>reviewAction(detailRow,false)}>Reject</button><button className="fm-button primary" onClick={()=>reviewAction(detailRow,true)}><Check size={15}/> Approve & activate</button></div><div className="fm-default-copy"><Check size={15}/> Approval provisions default farmer, commodity and transaction masters.</div></section></div>}
  </main>;
}
