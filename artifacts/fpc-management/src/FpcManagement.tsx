import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  History,
  Image as ImageIcon,
  Landmark,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { RecordRow, State } from "@/lib/store";
import "./fpc-management.css";

type Props = {
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  role: string;
  screen: string;
  setToast: (message: string) => void;
  go: (screen: string) => void;
};

type Obj = Record<string, any>;

export const steps = [
  "Basic company details",
  "Legal & registration",
  "Financial information",
  "Board of directors",
  "Logo & documents",
  "Address & location",
  "Business activities",
  "Final review & submission",
];

const protectedKeys = [
  "cin",
  "pan",
  "tan",
  "gstin",
  "authorisedCapital",
  "paidUpCapital",
  "faceValue",
  "licences",
];

export const locationMaster: Record<string, { code: string; districts: Record<string, Record<string, Record<string, string[]>>> }> = {
  Odisha: {
    code: "21",
    districts: {
      Keonjhar: {
        "Keonjhar Sadar": {
          Sanapatna: ["Green Valley", "Sanapatna", "Rugudi", "Dhanurjaypur"],
          Raisuan: ["Raisuan", "Kadalibadi", "Mandua"],
          Banspal: ["Banspal", "Dhanurjaypur", "Nayagarh"],
          Ranki: ["Ranki", "Bodapal", "Dimbo"],
        },
        Harichandanpur: {
          Rugudi: ["Rugudi", "Kantipal", "Pitagola"],
          Janghira: ["Janghira", "Harichandanpur", "Kendujiani"],
          Harichandanpur: ["Harichandanpur", "Kendujiani", "Bhairabpur"],
        },
        Telkoi: {
          Telkoi: ["Telkoi", "Pitamahal", "Gourangpur"],
          Jharabeda: ["Jharabeda", "Nayakote", "Bimala"],
          Kaliapani: ["Kaliapani", "Gandhamardan", "Purunapani"],
        },
        Patna: {
          Patna: ["Patna", "Badajamuposi", "Rajabasa"],
          Turumunga: ["Turumunga", "Brahmaniposi", "Chakradharpur"],
          Kantipal: ["Kantipal", "Machhagarh"],
        },
        Ghasipura: {
          Ghasipura: ["Ghasipura", "Keshudurapal", "Salapada"],
          Sainkul: ["Sainkul", "Kolimati"],
          Badamasinabilla: ["Badamasinabilla", "Brahmaniposi", "Taramakant"],
        },
      },
      Jajpur: {
        "Jajpur Sadar": {
          "Jajpur Town": ["Jajpur Town", "Bikrampur", "Debidwar"],
          Biri: ["Biri", "Barundei", "Nathasahi"],
        },
        Korei: {
          Korei: ["Korei", "Panikoili", "Tahirpur"],
          Vyasanagar: ["Vyasanagar", "Jajpur Road", "Sobra"],
        },
        Dharmasala: {
          Dharmasala: ["Dharmasala", "Jaraka", "Deoda"],
          Jenapur: ["Jenapur", "Aruha", "Brahmabarada"],
        },
      },
      Mayurbhanj: {
        Baripada: {
          Baripada: ["Baripada", "Prafulla Nagar", "Baghra Road"],
          Shamakhunta: ["Shamakhunta", "Balidiha", "Sindurgoura"],
        },
        Rairangpur: {
          Rairangpur: ["Rairangpur", "Gorumahisani", "Badampahar"],
        },
      },
    },
  },
  Jharkhand: {
    code: "20",
    districts: {
      "West Singhbhum": {
        Noamundi: {
          Noamundi: ["Noamundi", "Gua", "Bada Jamda", "Kiriburu"],
          Kotgarh: ["Kotgarh", "Baraiburu", "Dukurdia"],
        },
        Chaibasa: {
          Chaibasa: ["Chaibasa", "Nimdih", "Tamarbandh"],
          Jhinkpani: ["Jhinkpani", "Mahulsai", "Kera"],
        },
        Manoharpur: {
          Manoharpur: ["Manoharpur", "Chiria", "Anandpur"],
        },
      },
      "Seraikela-Kharsawan": {
        Seraikela: {
          Seraikela: ["Seraikela", "Govindpur", "Sini", "Tablapur"],
          Kandra: ["Kandra", "Gamharia", "Dugni"],
        },
        Chandil: {
          Chandil: ["Chandil", "Chowka", "Ichagarh"],
        },
      },
      Ranchi: {
        Ranchi: {
          Kanke: ["Kanke", "Arsande", "Pithoria"],
          Namkum: ["Namkum", "Tatisilwai", "Rajaulatu"],
        },
      },
    },
  },
};

const activityList = [
  "Agriculture and Farming",
  "Seed Production and Distribution",
  "Fertilizer Distribution",
  "Agricultural Input Supply",
  "Produce Procurement",
  "Produce Marketing",
  "Processing and Value Addition",
  "Storage and Warehousing",
  "Organic Farming",
  "Dairy and Livestock",
  "Other Activities",
];

const seedDetails: Obj = {
  basic: {
    legalName: "Green Valley Farmer Producer Company Ltd.",
    registrationNumber: "035612",
    cin: "U01100OD2021PTC035612",
    rocOffice: "ROC Cuttack",
    incorporationDate: "2021-06-14",
    category: "Producer Company under Section 378A of CA 2013",
    pan: "AAACG1234F",
    tan: "BBNG01234A",
    gstin: "21AAACG1234F1Z5",
    contactEmail: "office@greenvalleyfpc.in",
    mobile: "9437004412",
    website: "https://greenvalleyfpc.in",
    logo: "/ual-baha-logo.png",
    fssaiLicense: "21426012345678",
    seedLicense: "SL/KEO/2024/118",
    fertilizerLicense: "FL/KEO/2023/041",
    registrationCert: "incorporation-cert.pdf",
  },
  legalDocs: {
    incorporationCertificate: "incorporation-cert.pdf",
    panCertificate: "pan-card.pdf",
    gstCertificate: "gst-registration.pdf",
    fssaiCertificate: "fssai-license.pdf",
    seedLicenseDoc: "seed-license.pdf",
    fertilizerLicenseDoc: "fertilizer-license.pdf",
    rocDocuments: "moa-aoa-documents.pdf",
    otherDocuments: "board-resolution.pdf",
  },
  licenses: [
    { type: "Fertilizer", number: "FL/KEO/2023/041", authority: "District Agriculture Office, Keonjhar", issueDate: "2023-12-15", expiryDate: "2026-12-14", document: "fertilizer-license.pdf" },
    { type: "FSSAI", number: "21426012345678", authority: "Food Safety and Standards Authority of India", issueDate: "2021-06-14", expiryDate: "2027-06-14", document: "fssai-certificate.pdf" },
    { type: "Seed", number: "SL/KEO/2024/118", authority: "District Agriculture Office, Keonjhar", issueDate: "2024-04-01", expiryDate: "2027-03-31", document: "seed-license.pdf" },
  ],
  roc: { office: "ROC Cuttack", incorporationDate: "2021-06-14", registeredAddress: "Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha 758001", financialYearEnd: "31 March", agmDate: "2026-09-21", annualReturn: "Filed", auditStatus: "Completed" },
  capital: {
    authorisedCapital: "1000000",
    paidUpCapital: "620000",
    faceValue: "100",
    shares: "6200",
    annualTurnover: "7180000",
    financialYear: "2025–26",
    employeeCount: "10",
    farmerCount: "100",
    shareholderCount: "62",
  },
  turnovers: [
    { year: "2023–24", amount: "4150000" },
    { year: "2024–25", amount: "5820000" },
    { year: "2025–26", amount: "7180000" },
  ],
  bankAccounts: [
    { bank: "State Bank of India", branch: "Keonjhar Main", accountNumber: "389201004821", ifsc: "SBIN0000123", accountType: "Current" },
  ],
  directors: [
    { name: "Sunita Behera", din: "01234567", designation: "Chairperson", appointmentDate: "2021-06-14", mobile: "9876501001", email: "sunita@greenvalleyfpc.in", pan: "ABCDE1234F", gender: "Female", category: "OBC", status: "Active", address: "Keonjhar, Odisha" },
    { name: "Bijay Kumar Mohanty", din: "12345678", designation: "Managing Director", appointmentDate: "2021-06-14", mobile: "9876501002", email: "bijay@greenvalleyfpc.in", pan: "BCDEF2345G", gender: "Male", category: "General", status: "Active", address: "Keonjhar, Odisha" },
    { name: "Ramesh Chandra Nayak", din: "23456781", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501003", email: "ramesh@greenvalleyfpc.in", pan: "CDEFG3456H", gender: "Male", category: "General", status: "Active", address: "Keonjhar, Odisha" },
    { name: "Laxmi Patra", din: "34567812", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501004", email: "laxmi@greenvalleyfpc.in", pan: "DEFGH4567I", gender: "Female", category: "SC", status: "Active", address: "Keonjhar, Odisha" },
    { name: "Dillip Sahoo", din: "45678123", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501005", email: "dillip@greenvalleyfpc.in", pan: "EFGHI5678J", gender: "Male", category: "OBC", status: "Active", address: "Keonjhar, Odisha" },
    { name: "Kanchan Munda", din: "56781234", designation: "Director", appointmentDate: "2021-06-14", mobile: "9876501006", email: "kanchan@greenvalleyfpc.in", pan: "FGHIJ6789K", gender: "Female", category: "ST", status: "Active", address: "Keonjhar, Odisha" },
  ],
  location: {
    address: "Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha 758001",
    state: "Odisha",
    district: "Keonjhar",
    block: "Keonjhar Sadar",
    panchayat: "Sanapatna",
    village: "Green Valley",
    pin: "758001",
    mobile: "9437004412",
    email: "office@greenvalleyfpc.in",
    latitude: "21.6289",
    longitude: "85.5817",
  },
  activities: {
    primary: "Produce Procurement",
    secondary: ["Agricultural Input Supply", "Produce Marketing", "Storage and Warehousing"],
    description: "Aggregation and procurement of paddy, pulses, and oilseeds from tribal smallholders, with retail supply of seeds, fertilizers, and tools.",
    operationalStatus: "Operational",
    commencementDate: "2021-07-01",
    commodities: "Paddy, Maize, Arhar, Ragi, Mustard",
    farmerTarget: "120",
    villagesCovered: "24",
  },
  admin: { name: "Bijay Kumar Mohanty", mobile: "9876544412", email: "bijay@greenvalleyfpc.in", subUserLimit: "25" },
  statusHistory: [
    { status: "Draft", changedBy: "TSF Onboarding Desk", changedAt: "10 Jun 2021 · 10:00", remarks: "Initial onboarding draft prepared" },
    { status: "Submitted", changedBy: "TSF Onboarding Desk", changedAt: "12 Jun 2021 · 14:30", remarks: "Submitted for TSF Central Admin verification" },
    { status: "Approved", changedBy: "TSF Central Admin", changedAt: "14 Jun 2021 · 11:15", remarks: "All statutory documents, capital, and director credentials verified" },
    { status: "Active", changedBy: "TSF Central Admin", changedAt: "14 Jun 2021 · 11:15", remarks: "FPC activated on national network" },
  ],
};

const blankDetails: Obj = {
  basic: {
    legalName: "",
    registrationNumber: "",
    cin: "",
    rocOffice: "ROC Cuttack",
    incorporationDate: "",
    category: "Producer Company under Section 378A of CA 2013",
    pan: "",
    tan: "",
    gstin: "",
    contactEmail: "",
    mobile: "",
    website: "",
    logo: "",
    fssaiLicense: "",
    seedLicense: "",
    fertilizerLicense: "",
    registrationCert: "",
  },
  legalDocs: {
    incorporationCertificate: "",
    panCertificate: "",
    gstCertificate: "",
    fssaiCertificate: "",
    seedLicenseDoc: "",
    fertilizerLicenseDoc: "",
    rocDocuments: "",
    otherDocuments: "",
  },
  licenses: [
    { type: "Fertilizer", number: "", authority: "", issueDate: "", expiryDate: "", document: "" },
    { type: "Seed", number: "", authority: "", issueDate: "", expiryDate: "", document: "" },
    { type: "FSSAI", number: "", authority: "", issueDate: "", expiryDate: "", document: "" },
  ],
  roc: { office: "ROC Cuttack", incorporationDate: "", registeredAddress: "", financialYearEnd: "31 March", agmDate: "", annualReturn: "Not filed", auditStatus: "Not started" },
  capital: {
    authorisedCapital: "",
    paidUpCapital: "",
    faceValue: "100",
    shares: "0",
    annualTurnover: "",
    financialYear: "2025–26",
    employeeCount: "",
    farmerCount: "",
    shareholderCount: "",
  },
  turnovers: [
    { year: "2023–24", amount: "" },
    { year: "2024–25", amount: "" },
    { year: "2025–26", amount: "" },
  ],
  bankAccounts: [
    { bank: "", branch: "", accountNumber: "", ifsc: "", accountType: "Current" },
  ],
  directors: [
    { name: "", din: "", designation: "Chairperson", appointmentDate: "", mobile: "", email: "", pan: "", gender: "Female", category: "General", status: "Active", address: "" },
    { name: "", din: "", designation: "Managing Director", appointmentDate: "", mobile: "", email: "", pan: "", gender: "Male", category: "General", status: "Active", address: "" },
    { name: "", din: "", designation: "Director", appointmentDate: "", mobile: "", email: "", pan: "", gender: "Male", category: "OBC", status: "Active", address: "" },
    { name: "", din: "", designation: "Director", appointmentDate: "", mobile: "", email: "", pan: "", gender: "Female", category: "SC", status: "Active", address: "" },
    { name: "", din: "", designation: "Director", appointmentDate: "", mobile: "", email: "", pan: "", gender: "Male", category: "ST", status: "Active", address: "" },
  ],
  location: {
    address: "",
    village: "Green Valley",
    state: "Odisha",
    district: "Keonjhar",
    block: "Keonjhar Sadar",
    panchayat: "Sanapatna",
    pin: "",
    mobile: "",
    email: "",
    latitude: "",
    longitude: "",
  },
  activities: {
    primary: "Produce Procurement",
    secondary: ["Agricultural Input Supply"],
    description: "",
    operationalStatus: "Operational",
    commencementDate: "",
    commodities: "",
    farmerTarget: "",
    villagesCovered: "",
  },
  admin: { name: "", mobile: "", email: "", subUserLimit: "15" },
  statusHistory: [],
};

const makeId = (prefix = "FPC-") => `${prefix}${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
const stamp = () =>
  new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fpcRows = (s: State) => s.records?.fpcs || [];
const gv = (s: State) => fpcRows(s).find((r) => r.id === "FPC-ODI-001") || fpcRows(s)[0];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const withDetails = (row?: RecordRow): Obj => {
  if (!row) return clone(blankDetails);
  const source = row.details || {};
  const base = row.id === "FPC-ODI-001" ? seedDetails : blankDetails;
  const capital = source.capital || {};
  const location = source.location || {};
  const basic = source.basic || {};
  const activities = source.activities || {};
  const legalDocs = source.legalDocs || {};

  return {
    ...base,
    ...source,
    basic: {
      ...base.basic,
      ...basic,
      legalName: basic.legalName || row.name || base.basic.legalName,
      pan: basic.pan || source.pan || "",
      cin: basic.cin || source.cin || "",
      logo: basic.logo || row.logo || base.basic.logo || "",
    },
    legalDocs: {
      ...base.legalDocs,
      ...legalDocs,
    },
    roc: {
      ...base.roc,
      ...(source.roc || {}),
      agmDate: source.roc?.agmDate || source.roc?.lastAgmDate || base.roc.agmDate,
      annualReturn: source.roc?.annualReturn || source.roc?.lastAnnualReturnDate || base.roc.annualReturn,
      auditStatus: source.roc?.auditStatus || source.roc?.statutoryAudit || base.roc.auditStatus,
    },
    capital: {
      ...base.capital,
      ...capital,
      authorisedCapital: capital.authorisedCapital ?? capital.authorised ?? base.capital.authorisedCapital,
      paidUpCapital: capital.paidUpCapital ?? capital.paidUp ?? base.capital.paidUpCapital,
      faceValue: capital.faceValue ?? base.capital.faceValue,
      annualTurnover: capital.annualTurnover ?? source.turnover ?? base.capital.annualTurnover,
      employeeCount: capital.employeeCount ?? row.employeeCount ?? base.capital.employeeCount,
      farmerCount: capital.farmerCount ?? row.farmers ?? base.capital.farmerCount,
      shareholderCount: capital.shareholderCount ?? row.shareholders ?? base.capital.shareholderCount,
    },
    location: {
      ...base.location,
      ...location,
      state: location.state || row.state || "Odisha",
      district: location.district || row.district || "Keonjhar",
      block: location.block || row.block || "Keonjhar Sadar",
      panchayat: location.panchayat || "Sanapatna",
      village: location.village || "Green Valley",
      address: location.address || row.location || base.location.address,
    },
    activities: {
      ...base.activities,
      ...activities,
      primary: activities.primary || base.activities.primary,
      secondary: Array.isArray(activities.secondary) ? activities.secondary : base.activities.secondary,
      commodities: activities.commodities || base.activities.commodities,
    },
    admin: { ...base.admin, ...(source.admin || {}) },
    licenses:
      source.licenses?.map((license: Obj) => ({
        ...license,
        type: license.type || license.name || "",
        document: license.document || license.documentName || "",
      })) || base.licenses,
    turnovers: source.turnovers || base.turnovers,
    directors: source.directors || base.directors,
    bankAccounts:
      source.bankAccounts?.map((bank: Obj) => ({
        ...bank,
        accountType: bank.accountType || bank.type || "Current",
      })) || base.bankAccounts,
    statusHistory: source.statusHistory || row.statusHistory || base.statusHistory || [],
  };
};

function Field({
  label,
  value,
  onChange = () => {},
  type = "text",
  hint,
  required = false,
  readOnly = false,
  multiline = false,
  options,
  placeholder,
}: {
  label: string;
  value: any;
  onChange?: (v: string) => void;
  type?: string;
  hint?: string;
  required?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  options?: string[];
  placeholder?: string;
}) {
  const generatedId = useId();
  const id = `fpc-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${generatedId}`;
  return (
    <label className="fm-field" htmlFor={id}>
      <span>
        {label}
        {required && <i>Required</i>}
      </span>
      {options ? (
        <select
          id={id}
          value={value ?? ""}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          id={id}
          value={value ?? ""}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value ?? ""}
          readOnly={readOnly}
          placeholder={placeholder}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Section({
  title,
  note,
  children,
  number,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  number?: string;
}) {
  return (
    <section className="fm-section">
      <div className="fm-section-head">
        {number && <span className="fm-section-number">{number}</span>}
        <div>
          <h3>{title}</h3>
          {note && <p>{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function Status({ value }: { value: string }) {
  const v = (value || "").toLowerCase();
  const tone =
    v.includes("active") || v.includes("approved") || v.includes("complete")
      ? "good"
      : v.includes("submitted")
      ? "wait"
      : v.includes("review")
      ? "info"
      : v.includes("clarification")
      ? "warn"
      : v.includes("reject") || v.includes("inactive") || v.includes("expired")
      ? "bad"
      : "neutral";

  return <span className={`fm-status ${tone}`}>{value || "Draft"}</span>;
}

export default function FpcManagement({
  state,
  setState,
  role,
  screen,
  setToast,
  go,
}: Props) {
  const isTsf = role === "TSF Central Admin" || role === "FPC Admin / Manager";
  const isProfile = /profile|company/i.test(screen) && !/onboard/i.test(screen);
  const isPendingQueue = /pending/i.test(screen);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "pending" | "clarification" | "draft" | "inactive">("all");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Obj>(() => withDetails(gv(state)));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sectionMode, setSectionMode] = useState<"edit" | "view">("edit");
  const [profileTab, setProfileTab] = useState<"details" | "history" | "statusHistory">("details");
  const [historyFilter, setHistoryFilter] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [report, setReport] = useState<string[]>([]);
  const [pendingSave, setPendingSave] = useState(false);
  const [viewDocsFpc, setViewDocsFpc] = useState<RecordRow | null>(null);
  const [activeProfileFpc, setActiveProfileFpc] = useState<RecordRow | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const current = useMemo(
    () => fpcRows(state).find((r) => r.id === (selectedId || editingId)) || gv(state),
    [state.records?.fpcs, selectedId, editingId]
  );

  useEffect(() => {
    const target = gv(state);
    if (target && !target.details) {
      setState((s) => ({
        ...s,
        records: {
          ...s.records,
          fpcs: fpcRows(s).map((r) =>
            r.id === target.id ? { ...r, details: clone(seedDetails) } : r
          ),
        },
      }));
    }
  }, []);

  useEffect(() => {
    if (isProfile && !isEditing) setDraft(withDetails(current));
  }, [current?.id, isProfile, isEditing]);

  // Autosave Draft every 10 seconds while editing
  useEffect(() => {
    if (!isEditing) return;
    const timer = window.setInterval(() => {
      if (!editingId && !draft.basic?.legalName && !draft.basic?.cin) return;
      if (!editingId) {
        const row: RecordRow = {
          id: makeId("FPC-NEW-"),
          fpcId: "",
          name: draft.basic?.legalName || "New producer company",
          location: `${draft.location?.district || ""}, ${draft.location?.state || ""}`.replace(/^, |, $/g, ""),
          status: "Draft",
          farmers: String(draft.capital?.farmerCount || "0"),
          shareholders: String(draft.capital?.shareholderCount || "—"),
          logo: draft.basic?.logo || "",
          details: clone(draft),
          draftSavedAt: stamp(),
        };
        setState((s) => ({
          ...s,
          records: { ...s.records, fpcs: [row, ...fpcRows(s)] },
          audit: [audit("FPC onboarding", row.id, "autosaved onboarding draft", undefined, row, row.id), ...s.audit],
          ...(s.offline
            ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC onboarding", record: row.id, status: "Pending sync", fpcId: row.id }, ...s.syncQueue] }
            : {}),
        }));
        setEditingId(row.id);
        setSelectedId(row.id);
      } else {
        setState((s) => {
          const prior = fpcRows(s).find((r) => r.id === editingId);
          const changed = JSON.stringify(prior?.details || {}) !== JSON.stringify(draft);
          return {
            ...s,
            records: {
              ...s.records,
              fpcs: fpcRows(s).map((r) =>
                r.id === editingId
                  ? {
                      ...r,
                      name: draft.basic?.legalName || r.name,
                      location: `${draft.location?.district || ""}, ${draft.location?.state || ""}`.replace(/^, |, $/g, ""),
                      farmers: String(draft.capital?.farmerCount || r.farmers || "0"),
                      shareholders: String(draft.capital?.shareholderCount || r.shareholders || "—"),
                      logo: draft.basic?.logo || r.logo || "",
                      details: clone(draft),
                      draftSavedAt: stamp(),
                    }
                  : r
              ),
            },
            ...(changed && prior
              ? { audit: [audit("FPC onboarding", editingId, "autosaved onboarding draft", prior.details, draft, prior.fpcId || editingId), ...s.audit] }
              : {}),
            ...(s.offline && !s.syncQueue.some((item) => item.record === editingId && item.status === "Pending sync")
              ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC onboarding", record: editingId, status: "Pending sync", fpcId: prior?.fpcId || editingId }, ...s.syncQueue] }
              : {}),
          };
        });
      }
      setPendingSave(false);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isEditing, editingId, draft, state.offline]);

  const patch = (section: string, key: string, value: any) => {
    setDraft((d) => ({ ...d, [section]: { ...(d[section] || {}), [key]: value } }));
    setPendingSave(true);
  };

  const patchRoot = (key: string, value: any) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setPendingSave(true);
  };

  const openEditor = (row?: RecordRow) => {
    const target = row || null;
    setEditingId(target?.id || null);
    setSelectedId(target?.id || null);
    const populated = withDetails(target || undefined);
    setDraft(populated);
    setStep(0);
    setIsEditing(true);
    setSectionMode("edit");
    setLogoPreview(populated.basic?.logo || "");
  };

  const audit = (
    module: string,
    record: string,
    action: string,
    oldValue: unknown,
    newValue: unknown,
    fpcId: string
  ) => ({
    id: makeId("AUD-"),
    actor: role === "FPC Admin / Manager" ? "Bijay Kumar Mohanty" : role || "TSF Central Admin",
    role,
    module,
    record,
    action,
    oldValue: JSON.stringify(oldValue ?? ""),
    newValue: JSON.stringify(newValue ?? ""),
    date: stamp(),
    fpcId,
  });

  const notify = (title: string, fpcId: string) => ({
    id: makeId("NT-"),
    title,
    recipient: role === "TSF Central Admin" ? "FPC Admin / Manager" : "TSF Central Admin",
    date: "Just now",
    status: "Unread",
    fpcId,
  });

  const updateRow = (
    id: string,
    transform: (r: RecordRow) => RecordRow,
    action: string,
    oldValue?: unknown,
    newValue?: unknown
  ) =>
    setState((s) => {
      const row = fpcRows(s).find((r) => r.id === id);
      const next = row ? transform(row) : undefined;
      return {
        ...s,
        records: {
          ...s.records,
          fpcs: fpcRows(s).map((r) => (r.id === id && next ? next : r)),
        },
        audit: [audit("FPC management", id, action, oldValue ?? row, newValue ?? next, row?.fpcId || id), ...s.audit],
        notifications: [notify(`${row?.name || id}: ${action}`, row?.fpcId || id), ...s.notifications],
        ...(s.offline && !s.syncQueue.some((item) => item.record === id && item.status === "Pending sync")
          ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC management", record: id, status: "Pending sync", fpcId: row?.fpcId || id }, ...s.syncQueue] }
          : {}),
      };
    });

  // Step Validation Logic
  const validate = (index: number): boolean => {
    const errors: string[] = [];
    const b = draft.basic || {};
    const c = draft.capital || {};
    const l = draft.location || {};
    const act = draft.activities || {};
    const directors = draft.directors || [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Step 0: Basic company details
    if (index === 0) {
      if (!b.legalName?.trim()) errors.push("Registered FPC Name is required.");
      if (!/^[A-Z0-9]{21}$/.test(b.cin || "")) errors.push("CIN must contain exactly 21 letters or numbers (e.g., U01100OD2021PTC035612).");
      if (!b.incorporationDate) errors.push("Date of Incorporation is required.");
      if (b.contactEmail && !emailPattern.test(b.contactEmail)) errors.push("Enter a valid official contact email address.");
      if (b.mobile && !/^\d{10}$/.test(String(b.mobile).replace(/\D/g, ""))) errors.push("Contact mobile must contain 10 digits.");
      if (fpcRows(state).some((row) => row.id !== editingId && row.details?.basic?.cin?.toUpperCase() === String(b.cin || "").toUpperCase())) {
        errors.push("An FPC with this CIN is already registered.");
      }
    }

    // Step 1: Legal & registration
    if (index === 1) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(b.pan || "")) errors.push("Valid 10-character PAN is required (e.g. AAACG1234F).");
      if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(b.tan || "")) errors.push("Valid 10-character TAN is required (e.g. BBNG01234A).");
      if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(b.gstin || "")) errors.push("Valid 15-character GSTIN is required.");
      if (l.state === "Odisha" && b.gstin && !b.gstin.startsWith("21")) errors.push("GSTIN for Odisha must begin with state code 21.");
      if (l.state === "Jharkhand" && b.gstin && !b.gstin.startsWith("20")) errors.push("GSTIN for Jharkhand must begin with state code 20.");
    }

    // Step 2: Financial information
    if (index === 2) {
      if (!Number(c.authorisedCapital) || Number(c.authorisedCapital) <= 0) errors.push("Authorized Capital must be a positive amount in ₹.");
      if (!Number(c.paidUpCapital) || Number(c.paidUpCapital) <= 0) errors.push("Paid-up Capital must be a positive amount in ₹.");
      if (Number(c.paidUpCapital) > Number(c.authorisedCapital)) errors.push("Paid-up capital cannot exceed authorized capital.");
      if (!Number(c.faceValue) || Number(c.faceValue) <= 0) errors.push("Enter a valid Face Value per share.");
      const primaryBank = (draft.bankAccounts || [])[0];
      if (!primaryBank?.bank || !primaryBank?.accountNumber || !primaryBank?.ifsc) {
        errors.push("Primary bank name, account number, and IFSC code are required.");
      }
    }

    // Step 3: Board of directors
    if (index === 3) {
      if (directors.length < 5) errors.push("At least five directors are required on the Board.");
      if (!directors.some((d: Obj) => d.gender === "Female")) errors.push("At least one woman director is required on the Board.");
      if (directors.some((d: Obj) => !d.name?.trim())) errors.push("Director full name is required for all entries.");
      if (directors.some((d: Obj) => !/^\d{8}$/.test(String(d.din || "").trim()))) errors.push("Every director requires an 8-digit Director Identification Number (DIN).");
      if (directors.some((d: Obj) => !d.designation)) errors.push("Designation is required for all directors.");
      if (directors.some((d: Obj) => !d.appointmentDate)) errors.push("Appointment date is required for all directors.");
      if (directors.some((d: Obj) => !/^\d{10}$/.test(String(d.mobile || "").replace(/\D/g, "")))) errors.push("Every director requires a valid 10-digit mobile number.");
    }

    // Step 4: Logo & documents
    if (index === 4) {
      // Optional check, warn if no incorporation certificate
      if (!draft.legalDocs?.incorporationCertificate && !b.registrationCert) {
        // Warning only, don't hard block
      }
    }

    // Step 5: Address & location
    if (index === 5) {
      if (!l.address?.trim()) errors.push("Registered office address is required.");
      if (!l.state) errors.push("State selection is required.");
      if (!l.district) errors.push("District selection is required.");
      if (!l.block) errors.push("Block selection is required.");
      if (!/^\d{6}$/.test(String(l.pin || "").trim())) errors.push("A valid 6-digit PIN code is required.");
    }

    // Step 6: Business activities
    if (index === 6) {
      if (!act.primary) errors.push("Primary business activity is required.");
      if (!act.commodities?.trim()) errors.push("Please list the primary commodities handled.");
    }

    if (errors.length) setToast(errors[0]);
    return errors.length === 0;
  };

  const saveDraft = (status = "Draft") => {
    const old = editingId ? fpcRows(state).find((r) => r.id === editingId) : undefined;
    const isNew = !old;
    const newStatus = status;

    const historyEntry = {
      status: newStatus,
      changedBy: role || "TSF Central Admin",
      changedAt: stamp(),
      remarks: newStatus === "Submitted" ? "Submitted for TSF Onboarding Review" : "Draft saved",
    };

    const statusHistory = [historyEntry, ...(old?.details?.statusHistory || old?.statusHistory || [])];

    const row: RecordRow = {
      ...(old || {}),
      id: old?.id || makeId("FPC-NEW-"),
      fpcId: old?.fpcId || (newStatus === "Active" ? makeId("FPC-") : ""),
      name: draft.basic?.legalName || "New producer company",
      location: `${draft.location?.district || ""}, ${draft.location?.state || ""}`.replace(/^, |, $/g, ""),
      status: newStatus,
      farmers: String(draft.capital?.farmerCount || old?.farmers || "0"),
      shareholders: String(draft.capital?.shareholderCount || old?.shareholders || "—"),
      logo: draft.basic?.logo || old?.logo || "",
      details: { ...clone(draft), statusHistory },
      statusHistory,
    };

    setState((s) => ({
      ...s,
      records: {
        ...s.records,
        fpcs: old ? fpcRows(s).map((r) => (r.id === old.id ? row : r)) : [row, ...fpcRows(s)],
      },
      audit: [
        audit(
          "FPC onboarding",
          row.id,
          isNew ? "created onboarding draft" : `saved onboarding ${newStatus.toLowerCase()}`,
          old,
          row,
          row.id
        ),
        ...s.audit,
      ],
      ...(newStatus === "Submitted"
        ? { notifications: [notify(`${row.name} submitted for TSF onboarding review`, row.fpcId || row.id), ...s.notifications] }
        : {}),
      ...(s.offline && !s.syncQueue.some((item) => item.record === row.id && item.status === "Pending sync")
        ? { syncQueue: [{ id: makeId("SYNC-"), type: "FPC onboarding", record: row.id, status: "Pending sync", fpcId: row.fpcId }, ...s.syncQueue] }
        : {}),
    }));

    setEditingId(row.id);
    setSelectedId(row.id);
    setPendingSave(false);
    setToast(newStatus === "Submitted" ? "FPC successfully submitted for TSF review." : "Draft saved to local workspace.");
    if (newStatus === "Submitted") {
      setIsEditing(false);
      setSelectedId(row.id);
      go("/fpc-management");
    }
  };

  const submitWizard = () => {
    if (state.offline) {
      setToast("A network connection is required to submit an FPC to TSF. You can save your draft offline.");
      return;
    }
    for (let i = 0; i < 7; i++) {
      if (!validate(i)) {
        setStep(i);
        return;
      }
    }
    saveDraft("Submitted");
  };

  const stepNext = () => {
    if (validate(step)) {
      setStep((n) => Math.min(7, n + 1));
    }
  };

  const sample = () => {
    setDraft(clone(seedDetails));
    setLogoPreview(seedDetails.basic.logo || "");
    setPendingSave(true);
    setToast("Sample FPC record loaded. You can verify and navigate through all 8 steps.");
  };

  // Logo Upload with preview, validation & persistence
  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate format
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type) && !/\.(png|jpe?g|webp|svg)$/i.test(file.name)) {
      setToast("Invalid file format. Please upload a PNG, JPG, JPEG, or WebP logo.");
      return;
    }

    // Validate size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast("Logo file size must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setLogoPreview(dataUrl);
      patch("basic", "logo", dataUrl);
      setToast("FPC logo uploaded and preview updated.");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeLogo = () => {
    setLogoPreview("");
    patch("basic", "logo", "");
    setToast("FPC logo removed.");
  };

  // Document Upload Handler
  const handleDocUpload = (docKey: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast("Document must be 10 MB or smaller.");
      return;
    }
    patch("legalDocs", docKey, file.name);
    setToast(`${file.name} attached to ${docKey}.`);
    event.target.value = "";
  };

  // Director photo upload handler
  const handleDirectorPhoto = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast("Director photo must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setArrayField("directors", index, "photo", dataUrl);
      setToast(`Photo attached for Director ${index + 1}.`);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const addRow = (key: string, value: Obj) => patchRoot(key, [...(draft[key] || []), value]);
  const removeRow = (key: string, index: number) =>
    patchRoot(
      key,
      (draft[key] || []).filter((_: any, i: number) => i !== index)
    );
  const setArrayField = (key: string, index: number, field: string, value: any) =>
    patchRoot(
      key,
      (draft[key] || []).map((row: Obj, i: number) => (i === index ? { ...row, [field]: value } : row))
    );

  // Review & Approval Workflow Actions
  const reviewAction = (
    row: RecordRow,
    action: "approve" | "reject" | "clarification" | "under_review"
  ) => {
    if (state.offline) {
      setToast("A connection is required to perform review actions on an FPC.");
      return;
    }

    let remarks = "";
    let nextStatus = row.status || "Submitted";

    if (action === "approve") {
      remarks = window.prompt("Approval remarks (optional):", "All statutory and governance checks verified.") || "";
      nextStatus = "Active";
    } else if (action === "reject") {
      remarks = window.prompt("Mandatory reason for rejection:") || "";
      if (!remarks.trim()) {
        setToast("A rejection reason is required.");
        return;
      }
      nextStatus = "Rejected";
    } else if (action === "clarification") {
      remarks = window.prompt("Clarification required from FPC admin:") || "";
      if (!remarks.trim()) {
        setToast("Clarification remarks are required.");
        return;
      }
      nextStatus = "Clarification Required";
    } else if (action === "under_review") {
      remarks = "FPC application placed under formal review";
      nextStatus = "Under Review";
    }

    const historyEntry = {
      status: nextStatus,
      changedBy: role || "TSF Central Admin",
      changedAt: stamp(),
      remarks: remarks.trim(),
    };

    const statusHistory = [historyEntry, ...(row.details?.statusHistory || row.statusHistory || [])];

    const nextRow: RecordRow = {
      ...row,
      status: nextStatus,
      ...(action === "approve"
        ? {
            fpcId: row.fpcId || makeId("FPC-"),
            onboardingDate: new Date().toISOString().slice(0, 10),
            defaultMastersCopied: true,
          }
        : {}),
      rejectionReason: action === "reject" ? remarks.trim() : row.rejectionReason,
      clarificationRemarks: action === "clarification" ? remarks.trim() : row.clarificationRemarks,
      details: {
        ...(row.details || {}),
        statusHistory,
      },
      statusHistory,
    };

    updateRow(
      row.id,
      () => nextRow,
      `${action} FPC onboarding: ${nextStatus} (${remarks.trim()})`,
      row.status,
      nextRow
    );

    setSelectedId(null);
    setToast(
      action === "approve"
        ? "FPC approved successfully and activated on the network."
        : action === "reject"
        ? "FPC marked as Rejected."
        : action === "clarification"
        ? "Clarification request recorded and dispatched to FPC."
        : "FPC marked as Under Review."
    );
  };

  const rowAction = (row: RecordRow, action: string) => {
    if (action === "Edit") {
      openEditor(row);
      return;
    }
    if (action === "ViewProfile") {
      setActiveProfileFpc(row);
      return;
    }
    if (action === "ViewDocs") {
      setViewDocsFpc(row);
      return;
    }
    if (action === "Download") {
      downloadFpcProfile(row);
      return;
    }
    if (action === "Deactivate") {
      const reason = window.prompt("Reason for deactivation:");
      if (!reason?.trim()) {
        setToast("A reason is required to deactivate an FPC.");
        return;
      }
      updateRow(row.id, (r) => ({ ...r, status: "Inactive", deactivationReason: reason.trim() }), `deactivated: ${reason.trim()}`);
    }
    if (action === "Reactivate") {
      updateRow(row.id, (r) => ({ ...r, status: "Active", reactivatedAt: stamp() }), "reactivated FPC");
    }
    if (action === "Delete") {
      const confirmName = window.prompt(`Type the exact company name to delete:\n${row.name}`);
      if (confirmName !== row.name) {
        setToast("Company name did not match. No record was deleted.");
        return;
      }
      updateRow(row.id, (r) => ({ ...r, status: "Deleted", deletedAt: stamp() }), "deleted draft or rejected FPC");
    }
  };

  const downloadFpcProfile = (row: RecordRow) => {
    const d = withDetails(row);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(d, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${row.id || "FPC"}_profile_summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToast(`Downloaded profile summary for ${row.name}.`);
  };

  const downloadTemplate = () => {
    const headers = [
      "company_name",
      "cin",
      "pan",
      "tan",
      "gstin",
      "state",
      "district",
      "block",
      "office_address",
      "pin",
      "contact_email",
      "contact_mobile",
    ];
    const example = [
      "New Hills Farmer Producer Company Ltd.",
      "U01100OD2026PTC123456",
      "AAACN1234F",
      "BBNG01235A",
      "21AAACN1234F1Z5",
      "Odisha",
      "Keonjhar",
      "Patna",
      "New Hills, Keonjhar, Odisha",
      "758001",
      "onboarding@newhillsfpc.demo",
      "9876543210",
    ];
    const sheet = XLSX.utils.aoa_to_sheet([headers, example]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "FPC Onboarding");
    XLSX.writeFile(workbook, "fpc-onboarding-template.xlsx");
  };

  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const isSpreadsheet = /\.(xlsx|xls)$/i.test(file.name);
        const workbook = isSpreadsheet
          ? XLSX.read(reader.result as ArrayBuffer, { type: "array" })
          : XLSX.read(String(reader.result || ""), { type: "string", ...(file.name.toLowerCase().endsWith(".tsv") ? { FS: "\t" } : {}) });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) {
          setReport(["The spreadsheet contains no worksheet."]);
          return;
        }
        const data = XLSX.utils.sheet_to_json<Obj>(firstSheet, { defval: "", raw: false });
        if (!data.length) {
          setReport(["No data rows found. Upload a filled Excel, CSV or TSV template."]);
          return;
        }
        const good: RecordRow[] = [];
        const results: string[] = [];
        const importedCins = new Set<string>();
        const keyName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

        data.forEach((rawRow, i) => {
          const record = Object.fromEntries(
            Object.entries(rawRow).map(([key, value]) => [keyName(key), String(value ?? "").trim()])
          );
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
          if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(gstin)) errors.push("GSTIN is invalid");
          if (!["Odisha", "Jharkhand"].includes(stateName)) errors.push("state must be Odisha or Jharkhand");
          if (!record.district || !record.block || !record.officeaddress) errors.push("district, block and office address are required");
          if (!/^\d{6}$/.test(record.pin || "")) errors.push("PIN must contain six digits");

          if (importedCins.has(cin) || fpcRows(state).some((row) => row.details?.basic?.cin?.toUpperCase() === cin)) {
            errors.push("CIN is already in the register");
          }

          if (errors.length) {
            results.push(`Row ${i + 2}: invalid — ${errors.join("; ")}.`);
            return;
          }

          importedCins.add(cin);
          const d = clone(blankDetails);
          d.basic.legalName = name;
          d.basic.cin = cin;
          d.basic.pan = pan;
          d.basic.tan = tan;
          d.basic.gstin = gstin;
          d.basic.contactEmail = record.contactemail;
          d.basic.mobile = mobile;
          d.location.state = stateName;
          d.location.district = record.district;
          d.location.block = record.block;
          d.location.address = record.officeaddress;
          d.location.pin = record.pin;

          good.push({
            id: makeId("FPC-IMP-"),
            fpcId: makeId("FPC-"),
            name,
            location: `${d.location.district}, ${d.location.state}`,
            status: "Draft",
            farmers: "0",
            shareholders: "—",
            details: d,
          });
          results.push(`Row ${i + 2}: valid — saved as Draft.`);
        });

        setState((s) => ({
          ...s,
          records: { ...s.records, fpcs: [...good, ...fpcRows(s)] },
          audit: [...good.map((r) => audit("FPC import", r.id, "imported as draft", undefined, r, r.fpcId || r.id)), ...s.audit],
          ...(s.offline && good.length
            ? { syncQueue: [...good.map((r) => ({ id: makeId("SYNC-"), type: "FPC bulk import", record: r.id, status: "Pending sync", fpcId: r.fpcId || r.id })), ...s.syncQueue] }
            : {}),
        }));
        setReport(results.length ? results : ["No valid rows found."]);
        setToast(`${good.length} valid row${good.length === 1 ? "" : "s"} imported as Draft.`);
      } catch {
        setReport(["Could not read this file. Use the provided Excel template or a CSV/TSV file with the required headers."]);
      }
    };
    if (/\.(xlsx|xls)$/i.test(file.name)) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
    event.target.value = "";
  };

  // Filter Table Records
  const allRows = fpcRows(state).filter((r) => r.status !== "Deleted");

  const filtered = allRows.filter((r) => {
    const s = (r.status || "Draft").toLowerCase();
    const matchQuery = `${r.name} ${r.id} ${r.fpcId || ""} ${r.location || ""} ${r.status || ""} ${r.details?.basic?.cin || ""} ${r.details?.basic?.pan || ""}`
      .toLowerCase()
      .includes(query.toLowerCase());

    if (!matchQuery) return false;

    if (filterTab === "active") return s === "active" || s.includes("active");
    if (filterTab === "pending") return s === "submitted" || isPendingQueue;
    if (filterTab === "clarification") return s.includes("review") || s.includes("clarification");
    if (filterTab === "draft") return s === "draft";
    if (filterTab === "inactive") return s === "inactive" || s === "rejected";
    return true;
  });

  // Calculate completeness for progress indicator
  const completeness = [
    !!draft.basic?.legalName && /^[A-Z0-9]{21}$/.test(draft.basic?.cin || "") && !!draft.basic?.incorporationDate,
    /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(draft.basic?.pan || "") && /^[A-Z]{4}[0-9]{5}[A-Z]$/.test(draft.basic?.tan || ""),
    Number(draft.capital?.authorisedCapital) > 0 && Number(draft.capital?.paidUpCapital) > 0 && !!(draft.bankAccounts || [])[0]?.bank,
    (draft.directors || []).length >= 5 && (draft.directors || []).some((d: Obj) => d.gender === "Female"),
    !!draft.basic?.logo || !!draft.legalDocs?.incorporationCertificate,
    !!draft.location?.address && !!draft.location?.state && !!draft.location?.district && !!draft.location?.block && /^\d{6}$/.test(draft.location?.pin || ""),
    !!draft.activities?.primary && !!draft.activities?.commodities,
    true,
  ];

  const completenessPercent = Math.round((completeness.filter(Boolean).length / 8) * 100);

  // Cascading Location Selectors
  const selectedState = draft.location?.state || "Odisha";
  const stateData = locationMaster[selectedState] || locationMaster["Odisha"];
  const districtOptions = Object.keys(stateData.districts);

  const selectedDistrict = draft.location?.district || districtOptions[0] || "Keonjhar";
  const districtData = stateData.districts[selectedDistrict] || stateData.districts[districtOptions[0]] || {};
  const blockOptions = Object.keys(districtData);

  const selectedBlock = draft.location?.block || blockOptions[0] || "Keonjhar Sadar";
  const blockData = districtData[selectedBlock] || districtData[blockOptions[0]] || {};
  const panchayatOptions = Object.keys(blockData);

  const selectedPanchayat = draft.location?.panchayat || panchayatOptions[0] || "Sanapatna";
  const villageOptions = blockData[selectedPanchayat] || ["Green Valley", "Sanapatna", "Rugudi"];

  // Render Step Form Content
  const renderStep = (index: number) => {
    const b = draft.basic || {};
    const c = draft.capital || {};
    const loc = draft.location || {};
    const act = draft.activities || {};
    const docs = draft.legalDocs || {};
    const dirs = draft.directors || [];

    // STEP 0: Basic Company Details
    if (index === 0) {
      return (
        <Section title="Basic company details" note="Enter registered name, registration number, CIN and incorporation details." number="01">
          <div className="fm-grid two">
            <Field label="FPC Legal Name" value={b.legalName} required placeholder="e.g. Green Valley Farmer Producer Company Ltd." onChange={(v) => patch("basic", "legalName", v)} />
            <Field label="Corporate Identification Number (CIN)" value={b.cin} required hint="21 alphanumeric characters" placeholder="e.g. U01100OD2021PTC035612" onChange={(v) => patch("basic", "cin", v.toUpperCase())} />
            <Field label="FPC Registration Number" value={b.registrationNumber} placeholder="e.g. 035612" onChange={(v) => patch("basic", "registrationNumber", v)} />
            <Field label="ROC Office" value={b.rocOffice} options={["ROC Cuttack", "ROC Ranchi", "ROC Kolkata", "ROC Delhi", "ROC Mumbai"]} onChange={(v) => { patch("basic", "rocOffice", v); patch("roc", "office", v); }} />
            <Field label="Date of Incorporation" type="date" value={b.incorporationDate} required onChange={(v) => { patch("basic", "incorporationDate", v); patch("roc", "incorporationDate", v); }} />
            <Field label="Company Category" value={b.category} options={["Producer Company under Section 378A of CA 2013", "Company Limited by Shares", "Private Limited (Producer)"]} onChange={(v) => patch("basic", "category", v)} />
            <Field label="Official Contact Email" type="email" value={b.contactEmail} placeholder="e.g. office@greenvalleyfpc.in" onChange={(v) => patch("basic", "contactEmail", v)} />
            <Field label="Official Contact Mobile" value={b.mobile} placeholder="10-digit mobile" onChange={(v) => patch("basic", "mobile", v)} />
            <Field label="Official Website (Optional)" value={b.website} placeholder="e.g. https://greenvalleyfpc.in" onChange={(v) => patch("basic", "website", v)} />
          </div>
        </Section>
      );
    }

    // STEP 1: Legal and Registration Details
    if (index === 1) {
      return (
        <Section title="Legal and registration details" note="Tax registrations (PAN, TAN, GSTIN) and operating licenses." number="02">
          <div className="fm-grid two">
            <Field label="Company PAN" value={b.pan} required hint="10 characters (e.g. AAACG1234F)" onChange={(v) => patch("basic", "pan", v.toUpperCase())} />
            <Field label="Company TAN" value={b.tan} required hint="10 characters (e.g. BBNG01234A)" onChange={(v) => patch("basic", "tan", v.toUpperCase())} />
            <Field label="GSTIN" value={b.gstin} required hint="15 characters (State code 21 for Odisha, 20 for Jharkhand)" onChange={(v) => patch("basic", "gstin", v.toUpperCase())} />
            <Field label="FSSAI License Number" value={b.fssaiLicense} placeholder="14-digit FSSAI Number" onChange={(v) => patch("basic", "fssaiLicense", v)} />
            <Field label="Seed License Number" value={b.seedLicense} placeholder="e.g. SL/KEO/2024/118" onChange={(v) => patch("basic", "seedLicense", v)} />
            <Field label="Fertilizer License Number" value={b.fertilizerLicense} placeholder="e.g. FL/KEO/2023/041" onChange={(v) => patch("basic", "fertilizerLicense", v)} />
          </div>

          <div style={{ marginTop: 18 }}>
            <h4 style={{ fontSize: 13, color: "#284a37", margin: "0 0 10px 0" }}>Additional Operating Licenses</h4>
            {(draft.licenses || []).map((item: Obj, i: number) => (
              <div className="fm-row-card" key={i}>
                <div className="fm-row-title">
                  <b>License #{i + 1} • {item.type || "License"}</b>
                  <button type="button" className="fm-icon-button" onClick={() => removeRow("licenses", i)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="fm-grid three">
                  <Field label="License Type" value={item.type} options={["Fertilizer", "Seed", "FSSAI", "Pesticide", "Mandi License", "Other"]} onChange={(v) => setArrayField("licenses", i, "type", v)} />
                  <Field label="License Number" value={item.number} onChange={(v) => setArrayField("licenses", i, "number", v)} />
                  <Field label="Issuing Authority" value={item.authority} onChange={(v) => setArrayField("licenses", i, "authority", v)} />
                  <Field label="Issue Date" type="date" value={item.issueDate} onChange={(v) => setArrayField("licenses", i, "issueDate", v)} />
                  <Field label="Expiry Date" type="date" value={item.expiryDate} onChange={(v) => setArrayField("licenses", i, "expiryDate", v)} />
                  <Field label="Document File Name" value={item.document} placeholder="e.g. license.pdf" onChange={(v) => setArrayField("licenses", i, "document", v)} />
                </div>
              </div>
            ))}
            <button type="button" className="fm-button ghost" onClick={() => addRow("licenses", { type: "Fertilizer", number: "", authority: "", issueDate: "", expiryDate: "", document: "" })}>
              <Plus size={14} /> Add Another License
            </button>
          </div>
        </Section>
      );
    }

    // STEP 2: Financial Information
    if (index === 2) {
      return (
        <>
          <Section title="Capital structure and turnover" note="Authorized capital, paid-up capital and member metrics." number="03">
            <div className="fm-grid three">
              <Field label="Authorized Capital (₹)" type="number" value={c.authorisedCapital} required placeholder="e.g. 1000000" onChange={(v) => patch("capital", "authorisedCapital", v)} />
              <Field label="Paid-up Capital (₹)" type="number" value={c.paidUpCapital} required placeholder="e.g. 620000" onChange={(v) => patch("capital", "paidUpCapital", v)} />
              <Field
                label="Face Value per Share (₹)"
                type="number"
                value={c.faceValue}
                onChange={(v) => {
                  patch("capital", "faceValue", v);
                  const shares = Math.floor(Number(c.paidUpCapital || 0) / Math.max(1, Number(v || 1)));
                  patch("capital", "shares", String(shares));
                }}
              />
              <Field label="Annual Turnover (₹)" type="number" value={c.annualTurnover} required placeholder="e.g. 7180000" onChange={(v) => patch("capital", "annualTurnover", v)} />
              <Field label="Financial Year" value={c.financialYear || "2025–26"} options={["2025–26", "2024–25", "2023–24"]} onChange={(v) => patch("capital", "financialYear", v)} />
              <Field label="Number of Farmers" type="number" value={c.farmerCount} placeholder="e.g. 100" onChange={(v) => patch("capital", "farmerCount", v)} />
              <Field label="Number of Shareholders" type="number" value={c.shareholderCount} placeholder="e.g. 62" onChange={(v) => patch("capital", "shareholderCount", v)} />
              <Field label="Number of Employees" type="number" value={c.employeeCount} placeholder="e.g. 10" onChange={(v) => patch("capital", "employeeCount", v)} />
            </div>

            <div className="fm-calculation" style={{ marginTop: 14 }}>
              <span>Computed Total Equity Shares</span>
              <strong>{Math.floor(Number(c.paidUpCapital || 0) / Math.max(1, Number(c.faceValue || 100))).toLocaleString("en-IN")}</strong>
              <small>(Paid-up Capital ÷ Face Value)</small>
            </div>
          </Section>

          <Section title="Primary bank account details" note="Official bank account used for member transactions and ROC filings.">
            {(draft.bankAccounts || []).map((bAcc: Obj, i: number) => (
              <div className="fm-row-card" key={i}>
                <div className="fm-row-title">
                  <b>{i === 0 ? "Primary Bank Account" : `Bank Account #${i + 1}`}</b>
                  {i > 0 && (
                    <button type="button" className="fm-icon-button" onClick={() => removeRow("bankAccounts", i)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="fm-grid three">
                  <Field label="Bank Name" value={bAcc.bank} required placeholder="e.g. State Bank of India" onChange={(v) => setArrayField("bankAccounts", i, "bank", v)} />
                  <Field label="Account Number" value={bAcc.accountNumber} required placeholder="Account number" onChange={(v) => setArrayField("bankAccounts", i, "accountNumber", v)} />
                  <Field label="IFSC Code" value={bAcc.ifsc} required placeholder="e.g. SBIN0000123" onChange={(v) => setArrayField("bankAccounts", i, "ifsc", v.toUpperCase())} />
                  <Field label="Branch Name" value={bAcc.branch} placeholder="e.g. Keonjhar Main Branch" onChange={(v) => setArrayField("bankAccounts", i, "branch", v)} />
                  <Field label="Account Type" value={bAcc.accountType} options={["Current", "Savings", "Cash Credit"]} onChange={(v) => setArrayField("bankAccounts", i, "accountType", v)} />
                </div>
              </div>
            ))}
            <button type="button" className="fm-button ghost" onClick={() => addRow("bankAccounts", { bank: "", branch: "", accountNumber: "", ifsc: "", accountType: "Current" })}>
              <Plus size={14} /> Add Bank Account
            </button>
          </Section>
        </>
      );
    }

    // STEP 3: Board of Directors (BOD) Details
    if (index === 3) {
      return (
        <Section title="Board of directors (BOD) details" note={`Minimum 5 directors required • At least 1 female director mandatory • Total entered: ${dirs.length}`} number="04">
          <div className="fm-director-list">
            {dirs.map((d: Obj, i: number) => (
              <div className="fm-row-card" key={i} style={{ borderLeft: "4px solid #176b49" }}>
                <div className="fm-row-title" style={{ borderBottom: "1px solid #edf2ee", paddingBottom: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="fm-director-photo">
                      {d.photo ? (
                        <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 7 }} />
                      ) : (
                        <User size={22} />
                      )}
                    </div>
                    <div>
                      <b style={{ fontSize: 13, color: "#1e3a2b" }}>{d.name || `Director #${i + 1}`}</b>
                      <span style={{ display: "block", fontSize: 10, color: "#627568" }}>
                        {d.designation || "Director"} • DIN: {d.din || "—"} • Status: <strong>{d.status || "Active"}</strong>
                      </span>
                    </div>
                  </div>
                  {dirs.length > 1 && (
                    <button type="button" className="fm-icon-button" style={{ color: "#b91c1c" }} onClick={() => removeRow("directors", i)} title="Remove Director">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="fm-grid three">
                  <Field label="Director Full Name" value={d.name} required placeholder="Full Name" onChange={(v) => setArrayField("directors", i, "name", v)} />
                  <Field label="DIN (8 digits)" value={d.din} required placeholder="e.g. 01234567" onChange={(v) => setArrayField("directors", i, "din", v)} />
                  <Field label="Designation" value={d.designation} options={["Chairperson", "Managing Director", "Director", "CEO", "Nominee Director", "Alternate Director"]} onChange={(v) => setArrayField("directors", i, "designation", v)} />
                  <Field label="Gender" value={d.gender} options={["Female", "Male", "Other"]} onChange={(v) => setArrayField("directors", i, "gender", v)} />
                  <Field label="Appointment Date" type="date" value={d.appointmentDate} required onChange={(v) => setArrayField("directors", i, "appointmentDate", v)} />
                  <Field label="Mobile Number" value={d.mobile} required placeholder="10-digit mobile" onChange={(v) => setArrayField("directors", i, "mobile", v)} />
                  <Field label="Email Address" type="email" value={d.email} placeholder="director@fpc.demo" onChange={(v) => setArrayField("directors", i, "email", v)} />
                  <Field label="Director PAN" value={d.pan} placeholder="e.g. ABCDE1234F" onChange={(v) => setArrayField("directors", i, "pan", v.toUpperCase())} />
                  <Field label="Social Category" value={d.category} options={["General", "OBC", "SC", "ST", "Other"]} onChange={(v) => setArrayField("directors", i, "category", v)} />
                  <Field label="Active Status" value={d.status || "Active"} options={["Active", "Inactive"]} onChange={(v) => setArrayField("directors", i, "status", v)} />
                  
                  {/* Photo Upload */}
                  <div className="fm-field">
                    <span>Photograph</span>
                    <label className="fm-doc-upload" style={{ margin: 0 }}>
                      <Upload size={13} />
                      <span>{d.photo ? "Change Photo" : "Upload Photo (PNG/JPG)"}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleDirectorPhoto(i, e)} />
                    </label>
                  </div>

                  {/* Identity Document */}
                  <Field label="Identity Document (Aadhaar/PAN)" value={d.identityDoc} placeholder="e.g. aadhaar_front.pdf" onChange={(v) => setArrayField("directors", i, "identityDoc", v)} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="fm-button ghost"
              onClick={() =>
                addRow("directors", {
                  name: "",
                  din: "",
                  designation: "Director",
                  appointmentDate: new Date().toISOString().slice(0, 10),
                  mobile: "",
                  email: "",
                  pan: "",
                  gender: "Male",
                  category: "General",
                  status: "Active",
                  address: "",
                })
              }
            >
              <Plus size={14} /> Add Another Director
            </button>
          </div>
        </Section>
      );
    }

    // STEP 4: Logo and Document Uploads
    if (index === 4) {
      return (
        <Section title="Company logo and statutory documents" note="Upload official FPC logo (PNG, JPG, WebP) and supporting compliance documents." number="05">
          {/* FPC Logo Upload Area */}
          <div
            style={{
              background: "#f8faf7",
              border: "1.5px dashed #bed4c1",
              borderRadius: 10,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <h4 style={{ margin: "0 0 6px 0", fontSize: 13, color: "#1e3b2b" }}>Official FPC Company Logo</h4>
            <p style={{ margin: "0 0 12px 0", fontSize: 11, color: "#617366" }}>
              The uploaded logo will be displayed on the FPC profile, reports, receipts, and invoices. Max file size: 2 MB.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1px solid #c9dacb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {logoPreview || b.logo ? (
                  <img src={logoPreview || b.logo} alt="FPC Logo Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <div style={{ textAlign: "center", color: "#839587" }}>
                    <ImageIcon size={26} style={{ margin: "0 auto 4px" }} />
                    <span style={{ fontSize: 9 }}>No logo</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={handleLogoUpload} />
                <button type="button" className="fm-button primary" onClick={() => fileRef.current?.click()}>
                  <Upload size={14} /> {b.logo || logoPreview ? "Change Company Logo" : "Upload Logo (PNG, JPG, WebP)"}
                </button>
                {(b.logo || logoPreview) && (
                  <button type="button" className="fm-button secondary" onClick={removeLogo} style={{ color: "#dc2626" }}>
                    <Trash2 size={13} /> Remove Logo
                  </button>
                )}
                <span style={{ fontSize: 10, color: "#748678" }}>Supported formats: PNG, JPG, JPEG, WebP, SVG</span>
              </div>
            </div>
          </div>

          {/* Statutory Documents Grid */}
          <h4 style={{ margin: "16px 0 8px 0", fontSize: 13, color: "#1e3b2b" }}>Statutory Document Attachments</h4>
          <div className="fm-doc-grid">
            {[
              { key: "incorporationCertificate", label: "Certificate of Incorporation", req: true },
              { key: "panCertificate", label: "Company PAN Certificate", req: true },
              { key: "gstCertificate", label: "GSTIN Certificate", req: false },
              { key: "fssaiCertificate", label: "FSSAI Food Safety License", req: false },
              { key: "seedLicenseDoc", label: "Seed Production/Distribution License", req: false },
              { key: "fertilizerLicenseDoc", label: "Fertilizer Retail/Wholesale License", req: false },
              { key: "rocDocuments", label: "ROC MOA & AOA Documents", req: true },
              { key: "otherDocuments", label: "Board Resolution / Supporting Documents", req: false },
            ].map((dItem) => {
              const attached = docs[dItem.key];
              return (
                <div className="fm-doc-card" key={dItem.key}>
                  <div className="fm-doc-card-head">
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#234030" }}>
                      {dItem.label} {dItem.req && <i style={{ color: "#b45309", fontStyle: "normal" }}>*</i>}
                    </span>
                    <span className={`fm-doc-badge ${attached ? "attached" : "pending"}`}>
                      {attached ? "✓ Attached" : "Pending"}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#54685a" }}>
                    {attached ? `File: ${attached}` : "No document file uploaded yet."}
                  </span>
                  <label className="fm-doc-upload" style={{ margin: 0 }}>
                    <Upload size={12} />
                    <span>{attached ? "Replace File (PDF/Image)" : "Attach File"}</span>
                    <input type="file" accept=".pdf,image/*" onChange={(e) => handleDocUpload(dItem.key, e)} />
                  </label>
                </div>
              );
            })}
          </div>
        </Section>
      );
    }

    // STEP 5: Address and Location
    if (index === 5) {
      return (
        <Section title="Registered office and operating location" note="Dependent administrative hierarchy: State → District → Block → Gram Panchayat → Village." number="06">
          <div className="fm-grid three">
            <Field label="Registered Office Street Address" value={loc.address} required placeholder="Village, Landmark, Street" onChange={(v) => patch("location", "address", v)} />
            
            {/* Dependent Dropdowns */}
            <Field
              label="State"
              value={loc.state || "Odisha"}
              required
              options={["Odisha", "Jharkhand"]}
              onChange={(v) => {
                patch("location", "state", v);
                const firstDist = Object.keys(locationMaster[v]?.districts || {})[0] || "";
                const firstBlk = Object.keys(locationMaster[v]?.districts?.[firstDist] || {})[0] || "";
                const firstPanch = Object.keys(locationMaster[v]?.districts?.[firstDist]?.[firstBlk] || {})[0] || "";
                const firstVil = (locationMaster[v]?.districts?.[firstDist]?.[firstBlk]?.[firstPanch] || [])[0] || "";
                patch("location", "district", firstDist);
                patch("location", "block", firstBlk);
                patch("location", "panchayat", firstPanch);
                patch("location", "village", firstVil);
              }}
            />

            <Field
              label="District"
              value={loc.district || districtOptions[0]}
              required
              options={districtOptions}
              onChange={(v) => {
                patch("location", "district", v);
                const firstBlk = Object.keys(districtData || {})[0] || "";
                const firstPanch = Object.keys(districtData?.[firstBlk] || {})[0] || "";
                const firstVil = (districtData?.[firstBlk]?.[firstPanch] || [])[0] || "";
                patch("location", "block", firstBlk);
                patch("location", "panchayat", firstPanch);
                patch("location", "village", firstVil);
              }}
            />

            <Field
              label="Block"
              value={loc.block || blockOptions[0]}
              required
              options={blockOptions}
              onChange={(v) => {
                patch("location", "block", v);
                const firstPanch = Object.keys(blockData || {})[0] || "";
                const firstVil = (blockData?.[firstPanch] || [])[0] || "";
                patch("location", "panchayat", firstPanch);
                patch("location", "village", firstVil);
              }}
            />

            <Field
              label="Gram Panchayat"
              value={loc.panchayat || panchayatOptions[0]}
              required
              options={panchayatOptions}
              onChange={(v) => {
                patch("location", "panchayat", v);
                const firstVil = (blockData?.[v] || [])[0] || "";
                patch("location", "village", firstVil);
              }}
            />

            <Field
              label="Village"
              value={loc.village || villageOptions[0]}
              required
              options={villageOptions}
              onChange={(v) => patch("location", "village", v)}
            />

            <Field label="PIN Code" value={loc.pin} required placeholder="6-digit PIN code" onChange={(v) => patch("location", "pin", v)} />
            <Field label="Office Mobile Number" value={loc.mobile} placeholder="10-digit phone" onChange={(v) => patch("location", "mobile", v)} />
            <Field label="Official Email Address" value={loc.email} placeholder="office@fpc.demo" onChange={(v) => patch("location", "email", v)} />
            <Field label="Latitude (Optional)" value={loc.latitude} placeholder="e.g. 21.6289" onChange={(v) => patch("location", "latitude", v)} />
            <Field label="Longitude (Optional)" value={loc.longitude} placeholder="e.g. 85.5817" onChange={(v) => patch("location", "longitude", v)} />
          </div>
        </Section>
      );
    }

    // STEP 6: Business Activities
    if (index === 6) {
      const selectedSecondary: string[] = Array.isArray(act.secondary) ? act.secondary : [];

      return (
        <Section title="Business activities and commodities" note="Select primary and allied business activities carried out by the FPC." number="07">
          <div className="fm-grid two">
            <Field
              label="Primary Business Activity"
              value={act.primary || "Produce Procurement"}
              required
              options={activityList}
              onChange={(v) => patch("activities", "primary", v)}
            />
            <Field
              label="Operational Status"
              value={act.operationalStatus || "Operational"}
              options={["Operational", "Planning / Pre-operative", "Seasonally Active"]}
              onChange={(v) => patch("activities", "operationalStatus", v)}
            />
            <Field
              label="Date of Commencement"
              type="date"
              value={act.commencementDate}
              onChange={(v) => patch("activities", "commencementDate", v)}
            />
            <Field
              label="Commodities Handled"
              value={act.commodities}
              required
              placeholder="e.g. Paddy, Maize, Arhar, Ragi, Mustard"
              onChange={(v) => patch("activities", "commodities", v)}
            />
            <Field
              label="Target Farmers Enrolment"
              type="number"
              value={act.farmerTarget}
              placeholder="e.g. 150"
              onChange={(v) => patch("activities", "farmerTarget", v)}
            />
            <Field
              label="Number of Villages Covered"
              type="number"
              value={act.villagesCovered}
              placeholder="e.g. 20"
              onChange={(v) => patch("activities", "villagesCovered", v)}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#223d2e", display: "block", marginBottom: 6 }}>
              Secondary / Allied Business Activities
            </span>
            <div className="fm-activity-grid">
              {activityList.map((a) => (
                <label key={a}>
                  <input
                    type="checkbox"
                    checked={selectedSecondary.includes(a)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedSecondary, a]
                        : selectedSecondary.filter((item) => item !== a);
                      patch("activities", "secondary", next);
                    }}
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field
              label="Activity Scope & Operational Description"
              multiline
              value={act.description}
              placeholder="Provide a brief summary of the FPC's aggregation, procurement, marketing, and processing activities."
              onChange={(v) => patch("activities", "description", v)}
            />
          </div>
        </Section>
      );
    }

    // STEP 7: Final Review and Submission
    return (
      <Section title="Review FPC details before submission" note="Verify all legal, financial, director, document, and operational data before final submission." number="08">
        <div className="fm-review-list">
          {steps.slice(0, 7).map((label, i) => (
            <button key={label} type="button" onClick={() => setStep(i)}>
              <span>
                <b>
                  {String(i + 1).padStart(2, "0")} • {label}
                </b>
                <small>
                  {i === 0
                    ? b.legalName || "Legal identity details"
                    : i === 1
                    ? `PAN: ${b.pan || "—"} • GSTIN: ${b.gstin || "—"}`
                    : i === 2
                    ? `Auth Capital: ₹${Number(c.authorisedCapital || 0).toLocaleString("en-IN")} • Turnover: ₹${Number(c.annualTurnover || 0).toLocaleString("en-IN")}`
                    : i === 3
                    ? `${dirs.length} Directors added • ${dirs.filter((d: Obj) => d.gender === "Female").length} Female`
                    : i === 4
                    ? `${b.logo ? "Logo attached" : "No logo"} • ${Object.values(docs).filter(Boolean).length} documents`
                    : i === 5
                    ? `${loc.village}, ${loc.block}, ${loc.district}, ${loc.state} - ${loc.pin}`
                    : `${act.primary || "Produce Procurement"} • ${act.commodities || "Commodities"}`}
                </small>
              </span>
              <span className="fm-review-link">
                Edit <ArrowRight size={13} />
              </span>
            </button>
          ))}
        </div>

        <div className="fm-completeness" style={{ marginTop: 18 }}>
          <span>Onboarding Readiness</span>
          <b>{completenessPercent}%</b>
          <i>
            <span style={{ width: `${completenessPercent}%` }} />
          </i>
          <small>{completeness.filter(Boolean).length} of 8 sections verified</small>
        </div>
      </Section>
    );
  };

  // Full Profile View Mode
  if (activeProfileFpc || (isProfile && !isEditing)) {
    const profRow = activeProfileFpc || current;
    const prof = withDetails(profRow);
    const pBasic = prof.basic || {};
    const pCapital = prof.capital || {};
    const pLoc = prof.location || {};
    const pAct = prof.activities || {};
    const pDirs = prof.directors || [];
    const pBank = (prof.bankAccounts || [])[0] || {};
    const pDocs = prof.legalDocs || {};
    const pHistory = prof.statusHistory || profRow?.statusHistory || [];

    return (
      <main className="fm-root">
        <header className="fm-header">
          <div>
            <button
              type="button"
              className="fm-back"
              onClick={() => {
                setActiveProfileFpc(null);
                if (isProfile) go("/fpc-management");
              }}
            >
              <ArrowLeft size={15} /> Back to FPC Network
            </button>
            <span className="fm-eyebrow">Company Profile • {profRow?.fpcId || profRow?.id}</span>
            <h1>{pBasic.legalName || profRow?.name}</h1>
            <p>Complete corporate record, board governance, statutory licenses, and operational footprint.</p>
          </div>
          <div className="fm-header-actions">
            <Status value={profRow?.status || "Active"} />
            {isTsf && (
              <button
                type="button"
                className="fm-button secondary"
                onClick={() => {
                  setActiveProfileFpc(null);
                  openEditor(profRow);
                }}
              >
                <Edit size={14} /> Edit FPC Profile
              </button>
            )}
            <button type="button" className="fm-button secondary" onClick={() => downloadFpcProfile(profRow)}>
              <Download size={14} /> Download Profile
            </button>
          </div>
        </header>

        {/* Company Identity Hero Banner */}
        <div className="fm-profile-top">
          <div className="fm-company-mark">
            {pBasic.logo ? (
              <img src={pBasic.logo} alt="Company logo" />
            ) : (
              String(profRow?.name || "FPC")
                .split(/\s+/)
                .slice(0, 2)
                .map((w: string) => w[0])
                .join("")
                .toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <span className="fm-eyebrow">Producer Company Limited</span>
            <h2>{pBasic.legalName || profRow?.name}</h2>
            <p>
              <span>{pLoc.address || profRow?.location}</span>
              <span className="fm-dot" />
              <span>CIN: <strong>{pBasic.cin || "—"}</strong></span>
              <span className="fm-dot" />
              <span>Onboarded: {profRow?.onboardingDate || "14 Jun 2021"}</span>
            </p>
          </div>
        </div>

        {/* Profile Tabs */}
        <nav className="fm-tabs">
          <button
            type="button"
            className={profileTab === "details" ? "active" : ""}
            onClick={() => setProfileTab("details")}
          >
            FPC Information & Records
          </button>
          <button
            type="button"
            className={profileTab === "statusHistory" ? "active" : ""}
            onClick={() => setProfileTab("statusHistory")}
          >
            <History size={14} /> Approval & Status History ({pHistory.length})
          </button>
        </nav>

        {profileTab === "statusHistory" ? (
          <section className="fm-section" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 15, color: "#1e392b" }}>Chronological Status & Approval History</h3>
            {pHistory.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {pHistory.map((h: Obj, idx: number) => (
                  <div key={idx} className="fm-timeline-item">
                    <div className="fm-timeline-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Status value={h.status} />
                        <span style={{ fontSize: 10, color: "#748679" }}>{h.changedAt}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: "#284233", marginTop: 4 }}>
                        Action by: {h.changedBy || "TSF Central Admin"}
                      </div>
                      {h.remarks && (
                        <p style={{ margin: "3px 0 0 0", color: "#54685b", fontSize: 11 }}>
                          Remarks: {h.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="fm-empty">
                <History size={24} />
                <b>No status history recorded yet</b>
              </div>
            )}
          </section>
        ) : (
          <div className="fm-profile-sections">
            {/* Section 1: Basic Company Details */}
            <div className="fm-profile-card">
              <div className="fm-profile-card-head">
                <div>
                  <span className="fm-eyebrow">SECTION 01</span>
                  <h3>Basic Company Details</h3>
                </div>
              </div>
              <div className="fm-grid three" style={{ fontSize: 12 }}>
                <div><span style={{ color: "#617366" }}>Company Name:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.legalName}</strong></div>
                <div><span style={{ color: "#617366" }}>CIN:</span> <strong className="em-mono" style={{ display: "block", color: "#1e392b" }}>{pBasic.cin}</strong></div>
                <div><span style={{ color: "#617366" }}>Registration No:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.registrationNumber || "—"}</strong></div>
                <div><span style={{ color: "#617366" }}>ROC Office:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.rocOffice}</strong></div>
                <div><span style={{ color: "#617366" }}>Incorporation Date:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.incorporationDate}</strong></div>
                <div><span style={{ color: "#617366" }}>Category:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.category}</strong></div>
                <div><span style={{ color: "#617366" }}>Official Email:</span> <span style={{ display: "block", color: "#1e392b" }}>{pBasic.contactEmail || "—"}</span></div>
                <div><span style={{ color: "#617366" }}>Official Mobile:</span> <span style={{ display: "block", color: "#1e392b" }}>{pBasic.mobile || "—"}</span></div>
                <div><span style={{ color: "#617366" }}>Official Website:</span> <span style={{ display: "block", color: "#1e392b" }}>{pBasic.website || "—"}</span></div>
              </div>
            </div>

            {/* Section 2: Legal and Registration Details */}
            <div className="fm-profile-card">
              <div className="fm-profile-card-head">
                <div>
                  <span className="fm-eyebrow">SECTION 02</span>
                  <h3>Legal & Tax Registrations</h3>
                </div>
              </div>
              <div className="fm-grid three" style={{ fontSize: 12 }}>
                <div><span style={{ color: "#617366" }}>PAN:</span> <strong className="em-mono" style={{ display: "block", color: "#1e392b" }}>{pBasic.pan}</strong></div>
                <div><span style={{ color: "#617366" }}>TAN:</span> <strong className="em-mono" style={{ display: "block", color: "#1e392b" }}>{pBasic.tan}</strong></div>
                <div><span style={{ color: "#617366" }}>GSTIN:</span> <strong className="em-mono" style={{ display: "block", color: "#1e392b" }}>{pBasic.gstin}</strong></div>
                <div><span style={{ color: "#617366" }}>FSSAI License:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.fssaiLicense || "—"}</strong></div>
                <div><span style={{ color: "#617366" }}>Seed License:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.seedLicense || "—"}</strong></div>
                <div><span style={{ color: "#617366" }}>Fertilizer License:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBasic.fertilizerLicense || "—"}</strong></div>
              </div>
            </div>

            {/* Section 3: Financial Information */}
            <div className="fm-profile-card">
              <div className="fm-profile-card-head">
                <div>
                  <span className="fm-eyebrow">SECTION 03</span>
                  <h3>Financial Information & Capital Structure</h3>
                </div>
              </div>
              <div className="fm-grid three" style={{ fontSize: 12 }}>
                <div><span style={{ color: "#617366" }}>Authorized Capital:</span> <strong style={{ display: "block", fontSize: 14, color: "#15803d" }}>₹{Number(pCapital.authorisedCapital || 0).toLocaleString("en-IN")}</strong></div>
                <div><span style={{ color: "#617366" }}>Paid-up Capital:</span> <strong style={{ display: "block", fontSize: 14, color: "#1e392b" }}>₹{Number(pCapital.paidUpCapital || 0).toLocaleString("en-IN")}</strong></div>
                <div><span style={{ color: "#617366" }}>Face Value per Share:</span> <strong style={{ display: "block", color: "#1e392b" }}>₹{pCapital.faceValue || 100}</strong></div>
                <div><span style={{ color: "#617366" }}>Total Equity Shares:</span> <strong style={{ display: "block", color: "#1e392b" }}>{Math.floor(Number(pCapital.paidUpCapital || 0) / Math.max(1, Number(pCapital.faceValue || 100))).toLocaleString("en-IN")}</strong></div>
                <div><span style={{ color: "#617366" }}>Annual Turnover ({pCapital.financialYear || "FY 25–26"}):</span> <strong style={{ display: "block", color: "#15803d" }}>₹{Number(pCapital.annualTurnover || 0).toLocaleString("en-IN")}</strong></div>
                <div><span style={{ color: "#617366" }}>Farmers Enrolled:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pCapital.farmerCount || profRow?.farmers || "100"}</strong></div>
                <div><span style={{ color: "#617366" }}>Shareholders:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pCapital.shareholderCount || profRow?.shareholders || "62"}</strong></div>
                <div><span style={{ color: "#617366" }}>Primary Bank:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pBank.bank || "State Bank of India"} ({pBank.accountType || "Current"})</strong></div>
                <div><span style={{ color: "#617366" }}>Account & IFSC:</span> <span className="em-mono" style={{ display: "block", color: "#1e392b" }}>{pBank.accountNumber || "—"} • {pBank.ifsc || "—"}</span></div>
              </div>
            </div>

            {/* Section 4: Board of Directors */}
            <div className="fm-profile-card">
              <div className="fm-profile-card-head">
                <div>
                  <span className="fm-eyebrow">SECTION 04</span>
                  <h3>Board of Directors ({pDirs.length} members)</h3>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="fm-table" style={{ minWidth: 650 }}>
                  <thead>
                    <tr>
                      <th>Director</th>
                      <th>DIN</th>
                      <th>Designation</th>
                      <th>Gender / Category</th>
                      <th>Mobile & Email</th>
                      <th>Appointment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pDirs.map((d: Obj, i: number) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="fm-director-photo" style={{ width: 32, height: 32 }}>
                              {d.photo ? <img src={d.photo} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} /> : <User size={16} />}
                            </div>
                            <strong>{d.name}</strong>
                          </div>
                        </td>
                        <td className="em-mono">{d.din}</td>
                        <td>{d.designation}</td>
                        <td>{d.gender} • {d.category}</td>
                        <td>{d.mobile}<small style={{ display: "block", color: "#76867a" }}>{d.email}</small></td>
                        <td>{d.appointmentDate}</td>
                        <td><Status value={d.status || "Active"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5: Documents & Licences */}
            <div className="fm-profile-card">
              <div className="fm-profile-card-head">
                <div>
                  <span className="fm-eyebrow">SECTION 05</span>
                  <h3>Statutory Documents & Licences</h3>
                </div>
                <button type="button" className="fm-button secondary" onClick={() => setViewDocsFpc(profRow)}>
                  <FileText size={13} /> View Attached Documents
                </button>
              </div>
              <div className="fm-grid four" style={{ fontSize: 11 }}>
                <div><span>Incorporation Cert:</span> <strong style={{ color: pDocs.incorporationCertificate ? "#15803d" : "#94a3b8" }}>{pDocs.incorporationCertificate || "Attached"}</strong></div>
                <div><span>PAN Certificate:</span> <strong style={{ color: pDocs.panCertificate ? "#15803d" : "#94a3b8" }}>{pDocs.panCertificate || "Attached"}</strong></div>
                <div><span>GSTIN Certificate:</span> <strong style={{ color: pDocs.gstCertificate ? "#15803d" : "#94a3b8" }}>{pDocs.gstCertificate || "Attached"}</strong></div>
                <div><span>FSSAI License Doc:</span> <strong style={{ color: pDocs.fssaiCertificate ? "#15803d" : "#94a3b8" }}>{pDocs.fssaiCertificate || "Attached"}</strong></div>
              </div>
            </div>

            {/* Section 6: Address & Location */}
            <div className="fm-profile-card">
              <div className="fm-profile-card-head">
                <div>
                  <span className="fm-eyebrow">SECTION 06</span>
                  <h3>Registered Address & Operating Territory</h3>
                </div>
              </div>
              <div className="fm-grid three" style={{ fontSize: 12 }}>
                <div><span style={{ color: "#617366" }}>Registered Office:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pLoc.address}</strong></div>
                <div><span style={{ color: "#617366" }}>State:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pLoc.state}</strong></div>
                <div><span style={{ color: "#617366" }}>District:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pLoc.district}</strong></div>
                <div><span style={{ color: "#617366" }}>Block:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pLoc.block}</strong></div>
                <div><span style={{ color: "#617366" }}>Gram Panchayat:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pLoc.panchayat}</strong></div>
                <div><span style={{ color: "#617366" }}>Village:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pLoc.village}</strong></div>
                <div><span style={{ color: "#617366" }}>PIN Code:</span> <strong className="em-mono" style={{ display: "block", color: "#1e392b" }}>{pLoc.pin}</strong></div>
                <div><span style={{ color: "#617366" }}>Coordinates:</span> <span className="em-mono" style={{ display: "block", color: "#1e392b" }}>{pLoc.latitude || "21.6289"}° N, {pLoc.longitude || "85.5817"}° E</span></div>
              </div>
            </div>

            {/* Section 7: Business Activities */}
            <div className="fm-profile-card">
              <div className="fm-profile-card-head">
                <div>
                  <span className="fm-eyebrow">SECTION 07</span>
                  <h3>Business Activities & Commercial Footprint</h3>
                </div>
              </div>
              <div className="fm-grid two" style={{ fontSize: 12 }}>
                <div><span style={{ color: "#617366" }}>Primary Activity:</span> <strong style={{ display: "block", fontSize: 13, color: "#15803d" }}>{pAct.primary || "Produce Procurement"}</strong></div>
                <div><span style={{ color: "#617366" }}>Commodities Handled:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pAct.commodities || "Paddy, Maize, Pulses"}</strong></div>
                <div><span style={{ color: "#617366" }}>Operational Status:</span> <strong style={{ display: "block", color: "#1e392b" }}>{pAct.operationalStatus || "Operational"}</strong></div>
                <div><span style={{ color: "#617366" }}>Commencement Date:</span> <span style={{ display: "block", color: "#1e392b" }}>{pAct.commencementDate || "2021-07-01"}</span></div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "#617366" }}>Secondary / Allied Activities:</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {(Array.isArray(pAct.secondary) ? pAct.secondary : []).map((sec: string) => (
                      <span key={sec} style={{ background: "#edf5ee", color: "#286442", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // WIZARD EDITING MODE (8-STEP WIZARD)
  if (isEditing || (isTsf && /onboard|new fpc|add fpc/i.test(screen))) {
    return (
      <main className="fm-root">
        <header className="fm-header">
          <div>
            <button
              type="button"
              className="fm-back"
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                go("/fpc-management");
              }}
            >
              <ArrowLeft size={15} /> Exit Onboarding
            </button>
            <span className="fm-eyebrow">TSF Central Operations • FPC ONBOARDING WIZARD</span>
            <h1>{editingId ? "Edit Producer Company" : "Onboard New Producer Company"}</h1>
            <p>8-Step structured workflow. Complete legal, financial, governance and document records.</p>
          </div>
          <div className="fm-header-actions">
            <span className="fm-save-state">
              <i className={pendingSave ? "unsaved" : ""} />
              {pendingSave ? "Changes not saved" : "Autosave active"}
            </span>
            <button type="button" className="fm-button secondary" onClick={sample}>
              Fill Sample
            </button>
            <button type="button" className="fm-button secondary" onClick={() => saveDraft("Draft")}>
              <Save size={14} /> Save Draft
            </button>
          </div>
        </header>

        {/* 8-Step Stepper Progress Bar */}
        <div className="fm-wizard-progress">
          <div className="fm-progress-top">
            <span>Step {step + 1} of 8</span>
            <b>{steps[step]}</b>
            <span>{Math.round(((step + 1) / 8) * 100)}% complete</span>
          </div>
          <div className="fm-progress-line">
            <i style={{ width: `${((step + 1) / 8) * 100}%` }} />
          </div>
          <div className="fm-stepper">
            {steps.map((s, i) => (
              <button
                type="button"
                className={`${step === i ? "current" : ""} ${step > i ? "complete" : ""}`}
                key={s}
                onClick={() => {
                  if (i <= step) setStep(i);
                  else if (validate(step)) setStep(i);
                }}
              >
                <span>{step > i ? <Check size={13} /> : `0${i + 1}`}</span>
                <small>{s}</small>
              </button>
            ))}
          </div>
        </div>

        {/* Wizard Main Content & Aside Panel */}
        <div className="fm-wizard-body">
          <div className="fm-wizard-main">
            {renderStep(step)}

            <div className="fm-wizard-footer">
              <button
                type="button"
                className="fm-button secondary"
                onClick={() => (step ? setStep(step - 1) : setIsEditing(false))}
              >
                {step ? "Previous Step" : "Cancel"}
              </button>
              <div>
                <button type="button" className="fm-button ghost" onClick={() => saveDraft("Draft")}>
                  Save Draft
                </button>
                {step < 7 ? (
                  <button type="button" className="fm-button primary" onClick={stepNext}>
                    Save and Continue <ArrowRight size={15} />
                  </button>
                ) : (
                  <button type="button" className="fm-button primary" onClick={submitWizard}>
                    <ShieldCheck size={15} /> Final Submit to TSF
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="fm-wizard-aside">
            <div className="fm-aside-card">
              <span className="fm-aside-icon">
                <Building2 size={18} />
              </span>
              <h3>Onboarding Company</h3>
              <p>State-isolated registration for national FPC network.</p>
              <div className="fm-aside-line">
                <span>FPC Name</span>
                <b>{draft.basic?.legalName || "Not entered"}</b>
              </div>
              <div className="fm-aside-line">
                <span>CIN</span>
                <b className="em-mono">{draft.basic?.cin || "Pending"}</b>
              </div>
              <div className="fm-aside-line">
                <span>FPC Code</span>
                <b className="em-mono">{editingId || "Assigned on approval"}</b>
              </div>
              <div className="fm-aside-line">
                <span>Workflow State</span>
                <Status value={editingId ? current?.status || "Draft" : "Draft"} />
              </div>
            </div>

            <div className="fm-aside-note">
              <CircleHelp size={16} />
              <span>
                <b>Need reference data?</b>
                <small>Click "Fill Sample" at the top to load a verified example record and explore all 8 steps.</small>
              </span>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  // MANAGEMENT / DIRECTORY VIEW (Listing Table, Review Drawer, Document Modal)
  const detailRow = selectedId ? fpcRows(state).find((r) => r.id === selectedId) : null;

  return (
    <main className="fm-root">
      <header className="fm-header">
        <div>
          <span className="fm-eyebrow">TSF CENTRAL • PRODUCER COMPANY NETWORK</span>
          <h1>{isPendingQueue ? "Pending FPC Approvals" : "FPC Management & Directory"}</h1>
          <p>
            {isPendingQueue
              ? "Verify submitted FPC registrations, review compliance records, and approve or request clarification."
              : "Register, onboard, review, approve, edit, and manage all partner Farmer Producer Companies."}
          </p>
        </div>
        <div className="fm-header-actions">
          {!isPendingQueue && (
            <>
              <button type="button" className="fm-button secondary" onClick={downloadTemplate}>
                <Download size={14} /> Excel Template
              </button>
              <label className="fm-button secondary fm-upload-btn">
                <Upload size={14} /> Import Excel / CSV
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv"
                  onChange={importFile}
                />
              </label>
              <button type="button" className="fm-button primary" onClick={() => openEditor()}>
                <Plus size={15} /> Onboard New FPC
              </button>
            </>
          )}
        </div>
      </header>

      {/* Network Overview Metric Strip */}
      <div className="fm-network-strip">
        <div>
          <span>NETWORK REGISTER</span>
          <b>
            {allRows.length} <small>Producer Companies</small>
          </b>
        </div>
        <div className="fm-network-stat">
          <span>Active</span>
          <b>{allRows.filter((r) => (r.status || "").toLowerCase() === "active").length}</b>
        </div>
        <div className="fm-network-stat">
          <span>Pending Review</span>
          <b>{allRows.filter((r) => (r.status || "").toLowerCase() === "submitted").length}</b>
        </div>
        <div className="fm-network-stat">
          <span>Under Review / Clarification</span>
          <b>
            {allRows.filter((r) =>
              (r.status || "").toLowerCase().includes("review") || (r.status || "").toLowerCase().includes("clarification")
            ).length}
          </b>
        </div>
        <div className="fm-network-stat">
          <span>Drafts</span>
          <b>{allRows.filter((r) => (r.status || "").toLowerCase() === "draft").length}</b>
        </div>
        <span className="fm-network-mark">
          <Landmark size={22} />
        </span>
      </div>

      {/* Filter Tabs & Search Bar */}
      <section className="fm-list-card">
        <div className="fm-tabs-filter">
          {[
            { id: "all", label: `All FPCs (${allRows.length})` },
            { id: "active", label: `Active (${allRows.filter((r) => (r.status || "").toLowerCase() === "active").length})` },
            { id: "pending", label: `Pending Review (${allRows.filter((r) => (r.status || "").toLowerCase() === "submitted").length})` },
            { id: "clarification", label: "Under Review / Clarification" },
            { id: "draft", label: `Drafts (${allRows.filter((r) => (r.status || "").toLowerCase() === "draft").length})` },
            { id: "inactive", label: "Inactive / Rejected" },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={filterTab === tab.id ? "active" : ""}
              onClick={() => setFilterTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="fm-list-toolbar">
          <div>
            <h2>FPC Register & Directory</h2>
            <p>Showing {filtered.length} producer companies across Odisha & Jharkhand.</p>
          </div>
          <input
            aria-label="Search companies"
            placeholder="Search FPC name, ID, CIN, PAN, state..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* FPC Management Table with All Required Columns */}
        <div className="fm-table-scroll">
          <table className="fm-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>FPC ID</th>
                <th>FPC Name</th>
                <th>CIN</th>
                <th>PAN</th>
                <th>State & District</th>
                <th>Farmers</th>
                <th>Shareholders</th>
                <th>Directors</th>
                <th>Status</th>
                <th>Onboarding Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const rDetails = withDetails(row);
                const b = rDetails.basic || {};
                const loc = rDetails.location || {};
                const dirs = rDetails.directors || [];
                const logoSrc = b.logo || row.logo;
                const statusStr = row.status || "Draft";

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="fm-table-logo">
                        {logoSrc ? (
                          <img src={logoSrc} alt={row.name} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 5 }} />
                        ) : (
                          String(row.name || "FP").slice(0, 2).toUpperCase()
                        )}
                      </div>
                    </td>
                    <td className="fm-code" style={{ fontWeight: 700 }}>
                      {row.fpcId || (["Draft", "Submitted"].includes(statusStr) ? "Pending" : row.id)}
                    </td>
                    <td>
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          textAlign: "left",
                          cursor: "pointer",
                          color: "#1b5e20",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                        onClick={() => setActiveProfileFpc(row)}
                        title="View Full Profile"
                      >
                        {row.name}
                      </button>
                      <small style={{ display: "block", color: "#6c7d71" }}>
                        {row.details?.activities?.primary || "Produce Aggregation"}
                      </small>
                    </td>
                    <td className="fm-code">{b.cin || "—"}</td>
                    <td className="fm-code">{b.pan || "—"}</td>
                    <td>
                      {loc.state || "Odisha"}
                      <small style={{ display: "block", color: "#748679" }}>{loc.district || "Keonjhar"}</small>
                    </td>
                    <td>{row.farmers || b.farmerCount || "—"}</td>
                    <td>{row.shareholders || "—"}</td>
                    <td>{dirs.length || row.directorCount || "6"}</td>
                    <td>
                      <Status value={statusStr} />
                    </td>
                    <td>{row.onboardingDate || "14 Jun 2021"}</td>
                    <td>
                      <div className="fm-row-actions">
                        <button type="button" onClick={() => setActiveProfileFpc(row)} title="View Profile">
                          Profile
                        </button>
                        <button type="button" onClick={() => rowAction(row, "Edit")} title="Edit Details">
                          Edit
                        </button>
                        {statusStr === "Submitted" || statusStr.includes("Review") || statusStr.includes("Clarification") ? (
                          <>
                            <button
                              type="button"
                              className="accept"
                              onClick={() => setSelectedId(row.id)}
                              title="Review Application"
                            >
                              Review
                            </button>
                            {isTsf && (
                              <button
                                type="button"
                                className="accept"
                                onClick={() => reviewAction(row, "approve")}
                                title="Approve FPC"
                              >
                                Approve
                              </button>
                            )}
                          </>
                        ) : null}
                        <button type="button" onClick={() => setViewDocsFpc(row)} title="View Attached Documents">
                          Docs
                        </button>
                        <button type="button" onClick={() => downloadFpcProfile(row)} title="Download Profile">
                          <Download size={11} />
                        </button>
                        {statusStr === "Active" ? (
                          <button type="button" className="reject" onClick={() => rowAction(row, "Deactivate")}>
                            Deactivate
                          </button>
                        ) : statusStr === "Inactive" ? (
                          <button type="button" className="accept" onClick={() => rowAction(row, "Reactivate")}>
                            Reactivate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filtered.length && (
          <div className="fm-empty">
            <Landmark size={24} />
            <b>No producer companies found</b>
            <span>Try searching by another term or click below to onboard an FPC.</span>
            <button type="button" className="fm-button primary" onClick={() => openEditor()} style={{ marginTop: 8 }}>
              <Plus size={14} /> Onboard New FPC
            </button>
          </div>
        )}
      </section>

      {/* REVIEW DRAWER FOR TSF ADMIN */}
      {detailRow && (
        <div className="fm-modal-backdrop" onClick={() => setSelectedId(null)}>
          <section className="fm-review-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fm-drawer-head">
              <div>
                <span className="fm-eyebrow">TSF ONBOARDING REVIEW • {detailRow.fpcId || detailRow.id}</span>
                <h2>{detailRow.name}</h2>
                <Status value={detailRow.status || "Draft"} />
              </div>
              <button
                type="button"
                className="fm-icon-button"
                aria-label="Close review"
                onClick={() => setSelectedId(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <h4 style={{ fontSize: 13, color: "#1e392b", margin: "0 0 8px 0" }}>8-Step Section Summary</h4>
              <div className="fm-review-summary">
                {steps.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      openEditor(detailRow);
                      setStep(i);
                    }}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <b>{s}</b>
                    <small>
                      {i === 0
                        ? detailRow.details?.basic?.legalName || detailRow.name
                        : i === 1
                        ? `CIN: ${detailRow.details?.basic?.cin || "Recorded"}`
                        : i === 2
                        ? `Auth Capital: ₹${Number(detailRow.details?.capital?.authorisedCapital || 0).toLocaleString("en-IN")}`
                        : i === 3
                        ? `${detailRow.details?.directors?.length || 6} Directors Verified`
                        : i === 4
                        ? "Logo & Documents Attached"
                        : i === 5
                        ? detailRow.location || "Location recorded"
                        : i === 6
                        ? detailRow.details?.activities?.primary || "Activities recorded"
                        : "Ready for Approval"}
                    </small>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Approval Workflow Actions */}
            <div className="fm-drawer-foot" style={{ marginTop: 20 }}>
              <button type="button" className="fm-button secondary" onClick={() => rowAction(detailRow, "Edit")}>
                Edit Application
              </button>
              <button
                type="button"
                className="fm-button secondary"
                style={{ color: "#c2410c" }}
                onClick={() => reviewAction(detailRow, "clarification")}
              >
                Request Clarification
              </button>
              <button
                type="button"
                className="fm-button reject-outline"
                onClick={() => reviewAction(detailRow, "reject")}
              >
                Reject
              </button>
              <button
                type="button"
                className="fm-button primary"
                onClick={() => reviewAction(detailRow, "approve")}
              >
                <Check size={15} /> Approve & Activate
              </button>
            </div>

            <div className="fm-default-copy" style={{ marginTop: 14 }}>
              <Check size={15} /> Approval activates this FPC, generates an official FPC ID, and initializes standard masters.
            </div>
          </section>
        </div>
      )}

      {/* VIEW DOCUMENTS MODAL */}
      {viewDocsFpc && (
        <div className="fm-modal-backdrop" onClick={() => setViewDocsFpc(null)}>
          <div
            className="fm-section"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 720,
              width: "100%",
              margin: "auto",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5ede3", paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span className="fm-eyebrow">STATUTORY DOCUMENTS VAULT</span>
                <h3 style={{ margin: "4px 0 0", fontSize: 16, color: "#1e392b" }}>
                  {viewDocsFpc.name} ({viewDocsFpc.fpcId || viewDocsFpc.id})
                </h3>
              </div>
              <button type="button" className="fm-icon-button" onClick={() => setViewDocsFpc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="fm-doc-grid">
              {[
                { title: "Certificate of Incorporation", filename: "incorporation-cert.pdf", status: "Verified" },
                { title: "Company PAN Certificate", filename: "pan-card.pdf", status: "Verified" },
                { title: "GSTIN Certificate", filename: "gst-registration.pdf", status: "Verified" },
                { title: "FSSAI Food Safety License", filename: "fssai-certificate.pdf", status: "Verified" },
                { title: "Seed Production/Distribution License", filename: "seed-license.pdf", status: "Verified" },
                { title: "Fertilizer Retail License", filename: "fertilizer-license.pdf", status: "Verified" },
                { title: "ROC Memorandum & Articles (MOA/AOA)", filename: "moa-aoa-documents.pdf", status: "Verified" },
                { title: "Board Resolution / Supporting Docs", filename: "board-resolution.pdf", status: "Verified" },
              ].map((doc, idx) => (
                <div className="fm-doc-card" key={idx}>
                  <div className="fm-doc-card-head">
                    <strong style={{ fontSize: 12, color: "#1f3829" }}>{doc.title}</strong>
                    <span className="fm-doc-badge attached">✓ {doc.status}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "#54685a" }}>File: {doc.filename}</span>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      className="em-smallbtn"
                      style={{ background: "#edf5ee", color: "#286442", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}
                      onClick={() => setToast(`Simulated download of ${doc.filename}`)}
                    >
                      <Download size={11} /> Download
                    </button>
                    <button
                      type="button"
                      className="em-smallbtn"
                      style={{ background: "#f8faf7", color: "#54685a", padding: "3px 8px", borderRadius: 4 }}
                      onClick={() => setToast(`Previewing ${doc.title}`)}
                    >
                      <Eye size={11} /> Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button type="button" className="fm-button secondary" onClick={() => setViewDocsFpc(null)}>
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
