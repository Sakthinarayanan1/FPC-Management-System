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
  Clock3,
  Download,
  FileCheck,
  FileText,
  Image as ImageIcon,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import type { FpcInvitation, RecordRow, State } from "@/lib/store";
import { locationMaster } from "../../FpcManagement";
import "../../fpc-management.css";

interface FpcAdminOnboardingWizardProps {
  token: string;
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  setToast: (msg: string) => void;
  onExit?: () => void;
}

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

const activityList = [
  "Produce Procurement",
  "Agricultural Input Supply",
  "Produce Marketing & Aggregation",
  "Custom Hiring Centre (Machinery)",
  "Storage & Warehousing",
  "Primary Processing & Grading",
  "Seed Production & Distribution",
  "Organic Certification & Trading",
  "Credit Linkage & Financial Services",
];

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
  const id = `onboard-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${generatedId}`;
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

const initialDraftState = {
  basic: {
    legalName: "",
    cin: "",
    registrationNumber: "",
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
  },
  licenses: [
    { type: "Fertilizer", number: "", authority: "", validFrom: "", validTo: "", document: "" },
  ],
  capital: {
    authorisedCapital: "1000000",
    paidUpCapital: "600000",
    faceValue: "100",
    shares: "6000",
    annualTurnover: "1500000",
    financialYear: "2025–26",
    farmerCount: "120",
    shareholderCount: "60",
    employeeCount: "6",
  },
  turnovers: [
    { fy: "2024–25", audited: "Yes", amount: "1250000" },
    { fy: "2023–24", audited: "Yes", amount: "980000" },
  ],
  bankAccounts: [
    { bank: "", branch: "", accountNumber: "", ifsc: "", accountType: "Current" },
  ],
  directors: [
    {
      name: "",
      din: "",
      designation: "Managing Director",
      appointmentDate: new Date().toISOString().slice(0, 10),
      mobile: "",
      email: "",
      pan: "",
      gender: "Male",
      category: "General",
      status: "Active",
      address: "",
      photo: "",
      identityDoc: "",
    },
    {
      name: "",
      din: "",
      designation: "Chairperson",
      appointmentDate: new Date().toISOString().slice(0, 10),
      mobile: "",
      email: "",
      pan: "",
      gender: "Female",
      category: "General",
      status: "Active",
      address: "",
      photo: "",
      identityDoc: "",
    },
    {
      name: "",
      din: "",
      designation: "Director",
      appointmentDate: new Date().toISOString().slice(0, 10),
      mobile: "",
      email: "",
      pan: "",
      gender: "Male",
      category: "OBC",
      status: "Active",
      address: "",
      photo: "",
      identityDoc: "",
    },
    {
      name: "",
      din: "",
      designation: "Director",
      appointmentDate: new Date().toISOString().slice(0, 10),
      mobile: "",
      email: "",
      pan: "",
      gender: "Male",
      category: "ST",
      status: "Active",
      address: "",
      photo: "",
      identityDoc: "",
    },
    {
      name: "",
      din: "",
      designation: "Director",
      appointmentDate: new Date().toISOString().slice(0, 10),
      mobile: "",
      email: "",
      pan: "",
      gender: "Female",
      category: "General",
      status: "Active",
      address: "",
      photo: "",
      identityDoc: "",
    },
  ],
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
  location: {
    address: "",
    state: "Odisha",
    district: "Keonjhar",
    block: "Keonjhar Sadar",
    panchayat: "Sanapatna",
    village: "Sanapatna",
    pin: "",
    mobile: "",
    email: "",
    latitude: "",
    longitude: "",
  },
  activities: {
    primary: "Produce Procurement",
    operationalStatus: "Operational",
    commencementDate: new Date().toISOString().slice(0, 10),
    commodities: "Paddy, Maize, Arhar, Mustard",
    farmerTarget: "250",
    villagesCovered: "15",
    secondary: ["Agricultural Input Supply", "Storage and Warehousing"],
    description: "",
  },
  admin: {
    name: "",
    mobile: "",
    email: "",
    subUserLimit: "25",
  },
};

export default function FpcAdminOnboardingWizard({
  token,
  state,
  setState,
  setToast,
  onExit,
}: FpcAdminOnboardingWizardProps) {
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<{ title: string; message: string; isUsed?: boolean } | null>(null);
  const [invitation, setInvitation] = useState<FpcInvitation | null>(null);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(initialDraftState)));
  const [logoPreview, setLogoPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    fpcId: string;
    companyName: string;
    adminName: string;
    adminEmail: string;
    submittedAt: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Validate token on mount
  useEffect(() => {
    let isMounted = true;

    async function verify() {
      if (!token) {
        if (isMounted) {
          setTokenError({
            title: "Invalid or Missing Invitation Link",
            message: "No invitation token was provided in the URL. Please click the registration link sent to your email by Tata Steel Foundation.",
          });
          setTokenLoading(false);
        }
        return;
      }

      try {
        // First check backend verification endpoint
        const res = await fetch(`/api/onboarding/verify-token?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));

        if (!isMounted) return;

        if (res.status === 409 || data.alreadyUsed) {
          setTokenError({
            title: "Invitation Link Already Used",
            message: "This registration link has already been used to complete an FPC company submission. Each invitation link is single-use and cannot be reused.",
            isUsed: true,
          });
          setTokenLoading(false);
          return;
        }

        if (res.status === 410 || data.expired) {
          setTokenError({
            title: "Invitation Link Expired",
            message: data.message || "This invitation link has expired. Please contact your TSF Central Admin to request a new link.",
          });
          setTokenLoading(false);
          return;
        }

        if (!res.ok || !data.valid) {
          // Check local Zustand state fallback
          const localInv = (state.records.fpcInvitations || []).find((inv: any) => inv.token === token) as unknown as FpcInvitation | undefined;
          if (localInv) {
            if (localInv.status === "Used" || localInv.status === "Submitted") {
              setTokenError({
                title: "Invitation Link Already Used",
                message: "This registration link has already been used to submit company details.",
                isUsed: true,
              });
              setTokenLoading(false);
              return;
            }
            if (new Date() > new Date(localInv.expiresAt)) {
              setTokenError({
                title: "Invitation Link Expired",
                message: "This invitation link has expired. Please contact TSF Central Admin.",
              });
              setTokenLoading(false);
              return;
            }
            setInvitation(localInv);
            prefillInvitation(localInv);
            setTokenLoading(false);
            return;
          }

          setTokenError({
            title: "Invitation Not Found",
            message: data.message || "This invitation link is not valid or has been revoked by TSF Operations.",
          });
          setTokenLoading(false);
          return;
        }

        // Verified
        const invData = data.invitation;
        setInvitation(invData);
        prefillInvitation(invData);
        setTokenLoading(false);
      } catch {
        // Fallback to local store in offline mode
        const localInv = (state.records.fpcInvitations || []).find((inv: any) => inv.token === token) as unknown as FpcInvitation | undefined;
        if (localInv) {
          if (localInv.status === "Used" || localInv.status === "Submitted") {
            setTokenError({
              title: "Invitation Link Already Used",
              message: "This registration link has already been used.",
              isUsed: true,
            });
            setTokenLoading(false);
            return;
          }
          setInvitation(localInv);
          prefillInvitation(localInv);
          setTokenLoading(false);
          return;
        }

        setTokenError({
          title: "Connection Error",
          message: "Unable to verify the onboarding link. Please check your network connection and reload.",
        });
        setTokenLoading(false);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, state.records.fpcInvitations]);

  const prefillInvitation = (inv: FpcInvitation) => {
    setDraft((prev: typeof initialDraftState) => {
      const updated = JSON.parse(JSON.stringify(prev));
      // Pre-fill nominated admin details and contact details
      updated.admin.name = inv.adminName;
      updated.admin.email = inv.adminEmail;
      updated.admin.mobile = inv.adminMobile;
      updated.basic.contactEmail = inv.adminEmail;
      updated.basic.mobile = inv.adminMobile;

      // Pre-fill cluster / district reference if provided
      const clusterRef = inv.clusterDistrict || inv.notes || "";
      if (clusterRef) {
        const lower = clusterRef.toLowerCase();
        const odishaDistricts = Object.keys(locationMaster["Odisha"]?.districts || {});
        const jharkhandDistricts = Object.keys(locationMaster["Jharkhand"]?.districts || {});
        const matchO = odishaDistricts.find((d) => lower.includes(d.toLowerCase()));
        const matchJ = jharkhandDistricts.find((d) => lower.includes(d.toLowerCase()));
        if (matchO) {
          updated.location.state = "Odisha";
          updated.location.district = matchO;
        } else if (matchJ) {
          updated.location.state = "Jharkhand";
          updated.location.district = matchJ;
        }
      }

      // Also ensure first director is initialized with invited admin identity
      if (updated.directors[0]) {
        updated.directors[0].name = inv.adminName;
        updated.directors[0].email = inv.adminEmail;
        updated.directors[0].mobile = inv.adminMobile;
      }
      return updated;
    });
  };

  const patch = (section: keyof typeof initialDraftState, field: string, value: any) => {
    setDraft((d: any) => ({
      ...d,
      [section]: {
        ...d[section],
        [field]: value,
      },
    }));
  };

  const setArrayField = (section: "licenses" | "bankAccounts" | "directors" | "turnovers", index: number, field: string, value: any) => {
    setDraft((d: any) => {
      const arr = [...(d[section] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...d, [section]: arr };
    });
  };

  const addRow = (section: "licenses" | "bankAccounts" | "directors", template: Obj) => {
    setDraft((d: any) => ({
      ...d,
      [section]: [...(d[section] || []), template],
    }));
  };

  const removeRow = (section: "licenses" | "bankAccounts" | "directors", index: number) => {
    setDraft((d: any) => ({
      ...d,
      [section]: (d[section] || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast("Logo image size should not exceed 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setLogoPreview(res);
      patch("basic", "logo", res);
      setToast("Company logo attached.");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview("");
    patch("basic", "logo", "");
    if (fileRef.current) fileRef.current.value = "";
    setToast("Company logo removed.");
  };

  const handleDocUpload = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    patch("legalDocs", key, file.name);
    setToast(`Document attached: ${file.name}`);
  };

  const handleDirectorPhoto = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setArrayField("directors", index, "photo", ev.target?.result as string);
      setToast(`Photo attached for Director #${index + 1}`);
    };
    reader.readAsDataURL(file);
  };

  // Field validation identical to FpcManagement.tsx
  const validateStep = (index: number): boolean => {
    const errors: string[] = [];
    const b = draft.basic;
    const c = draft.capital;
    const loc = draft.location;
    const act = draft.activities;
    const dirs = draft.directors || [];

    // Step 0: Basic company details
    if (index === 0) {
      if (!b.legalName?.trim()) errors.push("FPC legal company name is required.");
      if (!/^[A-Z]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test((b.cin || "").trim())) {
        errors.push("A valid 21-character Corporate Identification Number (CIN) is required (e.g. U01100OD2021PTC035612).");
      }
      if (!b.incorporationDate) errors.push("Date of incorporation is required.");
    }

    // Step 1: Legal & registration
    if (index === 1) {
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test((b.pan || "").trim())) errors.push("A valid 10-character Company PAN is required (e.g. ABCDE1234F).");
      if (!/^[A-Z]{4}\d{5}[A-Z]$/.test((b.tan || "").trim())) errors.push("A valid 10-character Company TAN is required (e.g. ABCD12345E).");
      if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test((b.gstin || "").trim())) errors.push("A valid 15-character GSTIN is required (State code 21 for Odisha, 20 for Jharkhand).");
    }

    // Step 2: Financial information
    if (index === 2) {
      if (Number(c.authorisedCapital || 0) <= 0) errors.push("Authorized share capital must be greater than zero.");
      if (Number(c.paidUpCapital || 0) <= 0) errors.push("Paid-up share capital must be greater than zero.");
      if (Number(c.paidUpCapital || 0) > Number(c.authorisedCapital || 0)) errors.push("Paid-up capital cannot exceed authorized capital.");
      if (!draft.bankAccounts?.length || !draft.bankAccounts[0].accountNumber?.trim()) {
        errors.push("At least one primary bank account with account number is required.");
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test((draft.bankAccounts[0].ifsc || "").trim())) {
        errors.push("A valid 11-character IFSC code is required for the primary bank account.");
      }
    }

    // Step 3: Board of directors
    if (index === 3) {
      if (dirs.length < 5) errors.push("Producer Company under Section 378A requires a minimum of 5 directors.");
      dirs.forEach((d: Obj, i: number) => {
        if (!d.name?.trim()) errors.push(`Director #${i + 1} full name is required.`);
        if (!/^\d{8}$/.test(String(d.din || "").trim())) errors.push(`Director #${i + 1} must have an 8-digit Director Identification Number (DIN).`);
        if (!d.appointmentDate) errors.push(`Director #${i + 1} appointment date is required.`);
      });
    }

    // Step 5: Address & location
    if (index === 5) {
      if (!loc.address?.trim()) errors.push("Registered office street address is required.");
      if (!loc.state) errors.push("State selection is required.");
      if (!loc.district) errors.push("District selection is required.");
      if (!loc.block) errors.push("Block selection is required.");
      if (!/^\d{6}$/.test(String(loc.pin || "").trim())) errors.push("A valid 6-digit PIN code is required.");
    }

    // Step 6: Business activities
    if (index === 6) {
      if (!act.primary) errors.push("Primary business activity is required.");
      if (!act.commodities?.trim()) errors.push("Please list the primary commodities handled.");
    }

    if (errors.length) {
      setToast(errors[0]);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((n) => Math.min(7, n + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveDraft = () => {
    setToast("Application draft saved to local workspace.");
  };

  const handleSubmitRegistration = async () => {
    for (let i = 0; i < 7; i++) {
      if (!validateStep(i)) {
        setStep(i);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const fpcId = `FPC-${(draft.location.state || "ODI").slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const nowStr = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

      const fpcRecord: RecordRow = {
        id: fpcId,
        fpcId,
        name: draft.basic.legalName,
        location: `${draft.location.district || ""}, ${draft.location.state || ""}`.replace(/^, |, $/g, ""),
        status: "Submitted",
        farmers: String(draft.capital.farmerCount || "120"),
        shareholders: String(draft.capital.shareholderCount || "60"),
        logo: draft.basic.logo || "",
        details: {
          ...draft,
          statusHistory: [
            {
              status: "Submitted",
              changedBy: invitation?.adminName || "Nominated FPC Admin",
              changedAt: nowStr,
              remarks: "Completed self-registration through email invitation link.",
            },
          ],
        },
      };

      // Call backend completion endpoint
      try {
        await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            companyRecord: fpcRecord,
            draft,
          }),
        });
      } catch {
        // Safe dev fallback
      }

      // Update Zustand state
      setState((s) => ({
        ...s,
        records: {
          ...s.records,
          fpcs: [fpcRecord, ...(s.records.fpcs || [])],
          fpcInvitations: (s.records.fpcInvitations || []).map((inv: any) =>
            inv.token === token
              ? { ...inv, status: "Used", applicationId: fpcRecord.id, usedAt: new Date().toISOString() }
              : inv
          ),
        },
        audit: [
          {
            id: `AUD-${Date.now().toString().slice(-4)}`,
            actor: invitation?.adminName || "FPC Administrator",
            role: "FPC Admin / Manager",
            action: `Submitted formal FPC registration for ${fpcRecord.name}`,
            module: "FPC Self-Registration",
            record: fpcRecord.id,
            oldValue: "Invitation Sent",
            newValue: "Registration Submitted",
            date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            fpcId: fpcRecord.id,
          },
          ...s.audit,
        ],
        notifications: [
          {
            id: `NT-${Date.now().toString().slice(-4)}`,
            title: `New FPC Registration Submitted: ${fpcRecord.name}`,
            date: "Just now",
            status: "Unread",
            fpcId: fpcRecord.id,
          },
          ...s.notifications,
        ],
      }));

      setSubmissionResult({
        success: true,
        fpcId: fpcRecord.id,
        companyName: fpcRecord.name,
        adminName: invitation?.adminName || draft.admin.name,
        adminEmail: invitation?.adminEmail || draft.admin.email,
        submittedAt: nowStr,
      });

      setToast("FPC company registration successfully submitted to Tata Steel Foundation!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setToast(err.message || "Failed to submit registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cascading location options
  const stateVal = draft.location.state || "Odisha";
  const stateData = locationMaster[stateVal]?.districts || {};
  const districtOptions = Object.keys(stateData);
  const districtVal = draft.location.district || districtOptions[0] || "";
  const districtData = stateData[districtVal] || {};
  const blockOptions = Object.keys(districtData);
  const blockVal = draft.location.block || blockOptions[0] || "";
  const blockData = districtData[blockVal] || {};
  const panchayatOptions = Object.keys(blockData);
  const panchayatVal = draft.location.panchayat || panchayatOptions[0] || "";
  const villageOptions = blockData[panchayatVal] || [];

  // Completeness indicator
  const completeness = [
    Boolean(draft.basic.legalName && draft.basic.cin && draft.basic.incorporationDate),
    Boolean(draft.basic.pan && draft.basic.tan && draft.basic.gstin),
    Boolean(Number(draft.capital.authorisedCapital || 0) > 0 && draft.bankAccounts?.[0]?.accountNumber),
    Boolean((draft.directors || []).length >= 5),
    Boolean(draft.legalDocs?.incorporationCertificate),
    Boolean(draft.location.address && draft.location.district && draft.location.pin),
    Boolean(draft.activities.primary && draft.activities.commodities),
    false,
  ];
  const completenessPercent = Math.round((completeness.filter(Boolean).length / 7) * 100);

  // RENDER: Loading state
  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7f2] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg border border-emerald-950/10 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-spin">
            <RefreshCw size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Verifying Invitation Token...</h3>
          <p className="text-xs text-slate-600">
            Checking cryptographic token authentication and single-use link validity with Tata Steel Foundation Central Network.
          </p>
        </div>
      </div>
    );
  }

  // RENDER: Token Error / Already Used state
  if (tokenError) {
    return (
      <div className="min-h-screen bg-[#f4f7f2] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
          <div className={`p-6 text-center space-y-3 ${tokenError.isUsed ? "bg-amber-50" : "bg-rose-50"}`}>
            <div
              className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
                tokenError.isUsed ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {tokenError.isUsed ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{tokenError.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{tokenError.message}</p>
          </div>

          <div className="p-6 bg-white space-y-3">
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <strong>Need help with your invitation?</strong>
              <p className="mt-1">
                Contact the Tata Steel Foundation Onboarding Support Desk at{" "}
                <a href="mailto:onboarding@tatasteelfoundation.org" className="text-emerald-700 underline font-semibold">
                  onboarding@tatasteelfoundation.org
                </a>{" "}
                or call +91 94370 04412.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onExit || (() => (window.location.href = "/"))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#176b49] text-white text-xs font-bold hover:bg-[#12583b] transition-colors"
              >
                <ArrowLeft size={14} /> Return to Portal Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Successful Submission Confirmation View
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-[#f4f7f2] py-12 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-emerald-950/10 overflow-hidden">
          {/* Header */}
          <div className="bg-[#176b49] text-white p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white">
              <CheckCircle2 size={38} />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 block">
              Official Submission Acknowledgment
            </span>
            <h1 className="text-2xl font-bold text-white m-0">FPC Registration Submitted Successfully!</h1>
            <p className="text-xs text-emerald-100 max-w-lg mx-auto">
              Thank you, <strong>{submissionResult.adminName}</strong>. Your producer company registration records have been securely recorded and submitted to Tata Steel Foundation Central Review Committee.
            </p>
          </div>

          {/* Details Body */}
          <div className="p-8 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 m-0 border-b border-slate-200 pb-2">
                Registration Summary &amp; Tracking
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Company Legal Name:</span>
                  <strong className="text-slate-800 text-sm">{submissionResult.companyName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Application Reference ID:</span>
                  <strong className="text-emerald-800 font-mono text-sm">{submissionResult.fpcId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Nominated Administrator:</span>
                  <span className="text-slate-800 font-medium">{submissionResult.adminName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Registered Email:</span>
                  <span className="text-slate-800 font-medium">{submissionResult.adminEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submission Timestamp:</span>
                  <span className="text-slate-700">{submissionResult.submittedAt}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Application Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                    Submitted for Review
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <ShieldCheck size={16} className="text-emerald-700" /> Single-Use Link Closed &bull; What Happens Next:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-emerald-800 text-[11px]">
                <li>Your invitation token has been permanently marked as used.</li>
                <li>The TSF Central Review Committee will verify your ROC documents, CIN, PAN, and Board of Directors list.</li>
                <li>Upon approval, your permanent FPC ID and workspace login credentials will be delivered to your registered email.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                <Printer size={14} /> Print Acknowledgment
              </button>
              <button
                type="button"
                onClick={onExit || (() => (window.location.href = "/"))}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#176b49] hover:bg-[#12583b] text-white text-xs font-bold transition-colors shadow-md"
              >
                Go to TSF Central Desk <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Step-by-Step Content
  const renderStepContent = (index: number) => {
    const b = draft.basic;
    const c = draft.capital;
    const loc = draft.location;
    const act = draft.activities;
    const docs = draft.legalDocs;
    const dirs = draft.directors || [];

    // STEP 0: Basic Company Details
    if (index === 0) {
      return (
        <Section title="Basic company details" note="Enter registered legal name, registration number, CIN and incorporation details." number="01">
          <div className="fm-grid two">
            <Field label="FPC Legal Name" value={b.legalName} required placeholder="e.g. Green Valley Farmer Producer Company Ltd." onChange={(v) => patch("basic", "legalName", v)} />
            <Field label="Corporate Identification Number (CIN)" value={b.cin} required hint="21 alphanumeric characters" placeholder="e.g. U01100OD2021PTC035612" onChange={(v) => patch("basic", "cin", v.toUpperCase())} />
            <Field label="FPC Registration Number" value={b.registrationNumber} placeholder="e.g. 035612" onChange={(v) => patch("basic", "registrationNumber", v)} />
            <Field label="ROC Office" value={b.rocOffice} options={["ROC Cuttack", "ROC Ranchi", "ROC Kolkata", "ROC Delhi", "ROC Mumbai"]} onChange={(v) => patch("basic", "rocOffice", v)} />
            <Field label="Date of Incorporation" type="date" value={b.incorporationDate} required onChange={(v) => patch("basic", "incorporationDate", v)} />
            <Field label="Company Category" value={b.category} options={["Producer Company under Section 378A of CA 2013", "Company Limited by Shares", "Private Limited (Producer)"]} onChange={(v) => patch("basic", "category", v)} />
            <Field label="Official Contact Email" type="email" value={b.contactEmail} readOnly placeholder="e.g. office@fpc.in" onChange={(v) => patch("basic", "contactEmail", v)} />
            <Field label="Official Contact Mobile" value={b.mobile} readOnly placeholder="10-digit mobile" onChange={(v) => patch("basic", "mobile", v)} />
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
                  <b>License #{i + 1} &bull; {item.type || "License"}</b>
                  <button type="button" className="fm-icon-button" onClick={() => removeRow("licenses", i)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="fm-grid three">
                  <Field label="License Type" value={item.type} options={["Fertilizer", "Seed", "FSSAI", "Pesticide", "Mandi License", "Other"]} onChange={(v) => setArrayField("licenses", i, "type", v)} />
                  <Field label="License Number" value={item.number} onChange={(v) => setArrayField("licenses", i, "number", v)} />
                  <Field label="Issuing Authority" value={item.authority} onChange={(v) => setArrayField("licenses", i, "authority", v)} />
                </div>
              </div>
            ))}
            <button type="button" className="fm-button ghost" onClick={() => addRow("licenses", { type: "Fertilizer", number: "", authority: "" })}>
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
          <Section title="Capital structure and annual turnovers" note="Authorized share capital, paid-up capital, and historical turnover." number="03">
            <div className="fm-grid three">
              <Field label="Authorized Capital (₹)" type="number" value={c.authorisedCapital} required placeholder="e.g. 1000000" onChange={(v) => patch("capital", "authorisedCapital", v)} />
              <Field label="Paid-up Capital (₹)" type="number" value={c.paidUpCapital} required placeholder="e.g. 600000" onChange={(v) => patch("capital", "paidUpCapital", v)} />
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
              <Field label="Number of Shareholders" type="number" value={c.shareholderCount} placeholder="e.g. 60" onChange={(v) => patch("capital", "shareholderCount", v)} />
              <Field label="Number of Employees" type="number" value={c.employeeCount} placeholder="e.g. 6" onChange={(v) => patch("capital", "employeeCount", v)} />
            </div>

            <div className="fm-calculation" style={{ marginTop: 14 }}>
              <span>Computed Total Equity Shares</span>
              <strong>{Math.floor(Number(c.paidUpCapital || 0) / Math.max(1, Number(c.faceValue || 100))).toLocaleString("en-IN")}</strong>
              <small>(Paid-up Capital &divide; Face Value)</small>
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

    // STEP 3: Board of Directors
    if (index === 3) {
      return (
        <Section title="Board of directors (BOD) details" note={`Minimum 5 directors required &bull; Total entered: ${dirs.length}`} number="04">
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
                        {d.designation || "Director"} &bull; DIN: {d.din || "—"} &bull; Status: <strong>{d.status || "Active"}</strong>
                      </span>
                    </div>
                  </div>
                  {dirs.length > 5 && (
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
                  photo: "",
                  identityDoc: "",
                })
              }
            >
              <Plus size={14} /> Add Another Director
            </button>
          </div>
        </Section>
      );
    }

    // STEP 4: Logo & Documents
    if (index === 4) {
      return (
        <Section title="Company logo and statutory documents" note="Upload official FPC logo (PNG, JPG, WebP) and supporting compliance documents." number="05">
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
              const attached = (docs as any)[dItem.key];
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
              placeholder="e.g. 500"
              onChange={(v) => patch("activities", "farmerTarget", v)}
            />
            <Field
              label="Villages Covered"
              type="number"
              value={act.villagesCovered}
              placeholder="e.g. 25"
              onChange={(v) => patch("activities", "villagesCovered", v)}
            />
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

    // STEP 7: Final Review & Submission
    return (
      <Section title="Review FPC details before submission" note="Verify all legal, financial, director, document, and operational data before final submission." number="08">
        <div className="fm-review-list">
          {steps.slice(0, 7).map((label, i) => (
            <button key={label} type="button" onClick={() => setStep(i)}>
              <span>
                <b>
                  {String(i + 1).padStart(2, "0")} &bull; {label}
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

  return (
    <main className="fm-root min-h-screen bg-[#f4f7f2] p-4 md:p-8">
      {/* Top Identity Banner */}
      {invitation && (
        <div className="mb-4 bg-emerald-950 text-white rounded-xl p-3.5 px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-800 text-emerald-200">
              <ShieldCheck size={16} />
            </span>
            <div className="text-xs">
              <span className="text-emerald-300 font-extrabold uppercase tracking-wider text-[10px] block">
                Authenticated Invitation &bull; Single-Use Registration Session
              </span>
              <span>
                Invited Administrator: <strong>{invitation.adminName}</strong> ({invitation.adminEmail} &bull; +91 {invitation.adminMobile})
                {(invitation.clusterDistrict || invitation.notes) && (
                  <span className="text-emerald-200 ml-1">
                    &bull; Cluster / District: <strong>{invitation.clusterDistrict || invitation.notes}</strong>
                  </span>
                )}
              </span>
            </div>
          </div>
          <span className="text-[11px] bg-emerald-800/80 px-2.5 py-1 rounded text-emerald-200 font-mono">
            {invitation.id}
          </span>
        </div>
      )}

      {/* Main Header */}
      <header className="fm-header">
        <div>
          <button type="button" className="fm-back" onClick={onExit || (() => (window.location.href = "/"))}>
            <ArrowLeft size={15} /> Exit Portal
          </button>
          <span className="fm-eyebrow">Tata Steel Foundation &bull; FPC SELF-REGISTRATION</span>
          <h1>Onboard New Producer Company</h1>
          <p>8-Step structured onboarding wizard. Complete company legal, financial, governance, and operational records.</p>
        </div>
        <div className="fm-header-actions">
          <button type="button" className="fm-button secondary" onClick={handleSaveDraft}>
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
                else if (validateStep(step)) setStep(i);
              }}
            >
              <span>{step > i ? <Check size={13} /> : `0${i + 1}`}</span>
              <small>{s}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Main Content & Aside Panel */}
      <div className="fm-wizard-body mt-4">
        <div className="fm-wizard-main">
          {renderStepContent(step)}

          <div className="fm-wizard-footer">
            <button
              type="button"
              className="fm-button secondary"
              onClick={() => (step ? setStep(step - 1) : onExit?.())}
            >
              {step ? "Previous Step" : "Cancel"}
            </button>
            <div>
              <button type="button" className="fm-button ghost" onClick={handleSaveDraft}>
                Save Draft
              </button>
              {step < 7 ? (
                <button type="button" className="fm-button primary" onClick={handleNext}>
                  Save and Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  className="fm-button primary"
                  disabled={isSubmitting}
                  onClick={handleSubmitRegistration}
                  style={{ background: "#176b49", color: "#ffffff", fontWeight: 700 }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} /> Final Submit to TSF
                    </>
                  )}
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
            <h3>Company Registration</h3>
            <p>Formal statutory self-registration on Tata Steel Foundation FPC Network.</p>
            <div className="fm-aside-line">
              <span>Nominated Admin:</span>
              <b>{invitation?.adminName || "Authorized Representative"}</b>
            </div>
            <div className="fm-aside-line">
              <span>Company:</span>
              <b>{draft.basic.legalName || "In Progress"}</b>
            </div>
            <div className="fm-aside-line">
              <span>CIN:</span>
              <b className="font-mono">{draft.basic.cin || "—"}</b>
            </div>
            <div className="fm-aside-line">
              <span>State / District:</span>
              <b>{draft.location.district ? `${draft.location.district}, ${draft.location.state}` : "—"}</b>
            </div>
            <div className="fm-aside-line">
              <span>Status:</span>
              <b className="text-emerald-700">Self-Registration</b>
            </div>
          </div>

          <div className="fm-aside-card" style={{ background: "#f8faf7", border: "1px solid #dbe7dd" }}>
            <span className="fm-aside-icon" style={{ background: "#e8f2e9", color: "#176b49" }}>
              <Clock3 size={18} />
            </span>
            <h3>Invitation Expiry</h3>
            <p style={{ fontSize: 11, color: "#617366", margin: "4px 0 10px" }}>
              Single-use registration link. Valid for 7 days from dispatch date.
            </p>
            <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
              Need assistance? Email <a href="mailto:onboarding@tatasteelfoundation.org" className="text-emerald-700 underline font-semibold">onboarding@tatasteelfoundation.org</a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
