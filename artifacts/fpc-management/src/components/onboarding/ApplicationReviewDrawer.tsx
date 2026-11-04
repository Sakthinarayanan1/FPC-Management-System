import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Landmark,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  generatePermanentFpcId,
  type FpcApplication,
  type FpcInvitation,
  type RecordRow,
  type State,
} from "@/lib/store";
import EmailPreviewModal from "./EmailPreviewModal";

interface ApplicationReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: FpcInvitation | null;
  application: FpcApplication | null;
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  setToast: (msg: string) => void;
}

export default function ApplicationReviewDrawer({
  isOpen,
  onClose,
  invitation,
  application,
  state,
  setState,
  setToast,
}: ApplicationReviewDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "legal" | "directors" | "financials">("overview");
  const [actionModal, setActionModal] = useState<"approve" | "correction" | "reject" | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Email preview trigger
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailPreviewType, setEmailPreviewType] = useState<"approval" | "correction">("approval");
  const [lastAssignedFpcId, setLastAssignedFpcId] = useState("");

  if (!isOpen || !invitation) return null;

  const allFpcRows = state.records.fpcs || [];
  const compName = application?.companyName || "New Producer Company";
  const compState = application?.state || "Odisha";

  const handleReviewAction = async (action: "approve" | "correction" | "reject" | "under_review") => {
    setActionLoading(true);

    try {
      const now = new Date().toISOString();
      const formattedDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      if (action === "under_review") {
        setState((s) => ({
          ...s,
          records: {
            ...s.records,
            fpcInvitations: (s.records.fpcInvitations || []).map((inv) =>
              inv.id === invitation.id ? { ...inv, status: "Under Review" } : inv
            ),
            fpcApplications: (s.records.fpcApplications || []).map((app) =>
              app.invitationId === invitation.id
                ? { ...app, status: "Under Review", reviewedBy: "TSF Central Admin", reviewedAt: now }
                : app
            ),
          },
        }));
        setToast("Application status marked as Under Review.");
        setActionLoading(false);
        return;
      }

      if (action === "correction") {
        if (!remarksInput.trim()) {
          setToast("Please specify the clarification remarks required.");
          setActionLoading(false);
          return;
        }

        setState((s) => ({
          ...s,
          records: {
            ...s.records,
            fpcInvitations: (s.records.fpcInvitations || []).map((inv) =>
              inv.id === invitation.id ? { ...inv, status: "Correction Required" } : inv
            ),
            fpcApplications: (s.records.fpcApplications || []).map((app) =>
              app.invitationId === invitation.id
                ? {
                    ...app,
                    status: "Correction Required",
                    correctionRemarks: remarksInput.trim(),
                    reviewedBy: "TSF Central Admin",
                    reviewedAt: now,
                  }
                : app
            ),
          },
          audit: [
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              actor: "TSF Central Admin",
              role: "TSF Central Admin",
              action: `Requested corrections on FPC onboarding application for ${compName}: ${remarksInput.trim()}`,
              module: "FPC Onboarding",
              record: invitation.id,
              oldValue: invitation.status,
              newValue: "Correction Required",
              date: formattedDate,
              fpcId: "FPC-ODI-001",
            },
            ...s.audit,
          ],
        }));

        setEmailPreviewType("correction");
        setEmailPreviewOpen(true);
        setActionModal(null);
        setToast(`Correction request dispatched to ${invitation.adminEmail}.`);
      }

      if (action === "reject") {
        if (!remarksInput.trim()) {
          setToast("A mandatory rejection reason is required.");
          setActionLoading(false);
          return;
        }

        setState((s) => ({
          ...s,
          records: {
            ...s.records,
            fpcInvitations: (s.records.fpcInvitations || []).map((inv) =>
              inv.id === invitation.id ? { ...inv, status: "Rejected" } : inv
            ),
            fpcApplications: (s.records.fpcApplications || []).map((app) =>
              app.invitationId === invitation.id
                ? {
                    ...app,
                    status: "Rejected",
                    rejectionReason: remarksInput.trim(),
                    reviewedBy: "TSF Central Admin",
                    reviewedAt: now,
                  }
                : app
            ),
          },
          audit: [
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              actor: "TSF Central Admin",
              role: "TSF Central Admin",
              action: `Rejected FPC onboarding application for ${compName}: ${remarksInput.trim()}`,
              module: "FPC Onboarding",
              record: invitation.id,
              oldValue: invitation.status,
              newValue: "Rejected",
              date: formattedDate,
              fpcId: "FPC-ODI-001",
            },
            ...s.audit,
          ],
        }));

        setActionModal(null);
        setToast(`Application for ${compName} marked as Rejected.`);
      }

      if (action === "approve") {
        // Generate permanent unique FPC ID (e.g. FPC-ODI-006 or FPC-JHK-004)
        const permanentId = generatePermanentFpcId(allFpcRows, compState);
        setLastAssignedFpcId(permanentId);

        // Create new active FPC record in state.records.fpcs
        const newFpcRecord: RecordRow = {
          id: permanentId,
          fpcId: permanentId,
          name: compName,
          location: `${application?.district || "Keonjhar"}, ${compState}`,
          state: compState,
          district: application?.district || "Keonjhar",
          block: application?.block || "Keonjhar Sadar",
          farmers: String(application?.operationalInfo?.membersCount || "100"),
          shareholders: "—",
          status: "Active",
          turnover: 0,
          employeeCount: 4,
          directorCount: application?.directors?.length || 5,
          godownCount: application?.operationalInfo?.godownsCount || 1,
          onboardingDate: formattedDate,
          details: {
            basic: {
              legalName: compName,
              cin: application?.cin || "",
              pan: application?.pan || "",
              tan: application?.tan || "",
              gstin: application?.gstin || "",
              contactEmail: invitation.adminEmail,
              mobile: invitation.adminMobile,
            },
            location: {
              address: application?.registeredAddress || "",
              state: compState,
              district: application?.district || "",
              block: application?.block || "",
              village: application?.village || "",
              pin: application?.pinCode || "",
            },
            capital: {
              authorisedCapital: "1000000",
              paidUpCapital: "500000",
              farmerCount: String(application?.operationalInfo?.membersCount || "100"),
            },
            directors: application?.directors || [],
            bankAccounts: application?.bankAccounts || [],
            statusHistory: [
              {
                status: "Approved",
                changedBy: "TSF Central Admin",
                changedAt: formattedDate,
                remarks: remarksInput.trim() || "All statutory and governance records verified.",
              },
              {
                status: "Active",
                changedBy: "TSF Central Admin",
                changedAt: formattedDate,
                remarks: `Assigned permanent identifier ${permanentId}`,
              },
            ],
          },
        };

        // Create new FPC Admin user in state.records.users bound to permanentId
        const newAdminUser: RecordRow = {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: invitation.adminName,
          role: "FPC Admin / Manager",
          mobile: invitation.adminMobile,
          email: invitation.adminEmail,
          status: "Active",
          lastLogin: "Never (Pending first login)",
          fpcId: permanentId,
        };

        setState((s) => ({
          ...s,
          records: {
            ...s.records,
            fpcs: [newFpcRecord, ...(s.records.fpcs || [])],
            users: [newAdminUser, ...(s.records.users || [])],
            fpcInvitations: (s.records.fpcInvitations || []).map((inv) =>
              inv.id === invitation.id ? { ...inv, status: "Approved", fpcId: permanentId } : inv
            ),
            fpcApplications: (s.records.fpcApplications || []).map((app) =>
              app.invitationId === invitation.id
                ? {
                    ...app,
                    status: "Approved",
                    approvalRemarks: remarksInput.trim() || "All statutory documents verified.",
                    reviewedBy: "TSF Central Admin",
                    reviewedAt: now,
                  }
                : app
            ),
          },
          audit: [
            {
              id: `AUD-${Date.now().toString().slice(-4)}`,
              actor: "TSF Central Admin",
              role: "TSF Central Admin",
              action: `Approved FPC onboarding application for ${compName}. Assigned permanent ID ${permanentId}.`,
              module: "FPC Onboarding",
              record: permanentId,
              oldValue: "Submitted",
              newValue: `Active (${permanentId})`,
              date: formattedDate,
              fpcId: permanentId,
            },
            ...s.audit,
          ],
          notifications: [
            {
              id: `NT-${Date.now().toString().slice(-4)}`,
              title: `${compName} approved on TSF Network (${permanentId})`,
              date: "Just now",
              status: "Unread",
              fpcId: permanentId,
            },
            ...s.notifications,
          ],
        }));

        setEmailPreviewType("approval");
        setEmailPreviewOpen(true);
        setActionModal(null);
        setToast(`FPC successfully approved! Assigned permanent ID: ${permanentId}.`);
      }
    } catch (err: any) {
      setToast(err.message || "Failed to process review action.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
        <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-[#176b49] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block">
                  TSF Onboarding Application Review
                </span>
                <h3 className="text-base font-bold text-white m-0 truncate max-w-md">
                  {compName}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Status Ribbon & Tabs */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Application Status:</span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  invitation.status === "Approved"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : invitation.status === "Submitted"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : invitation.status === "Correction Required"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : invitation.status === "Rejected"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-slate-200 text-slate-700 border-slate-300"
                }`}
              >
                {invitation.status}
              </span>
              {invitation.fpcId && (
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {invitation.fpcId}
                </span>
              )}
            </div>

            {/* Quick Navigation Tabs */}
            <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === "overview" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("legal")}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === "legal" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Legal &amp; Reg
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("directors")}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === "directors" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Directors ({application?.directors?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("financials")}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === "financials" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Bank &amp; Capital
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Invited Admin Card */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-2">
                    Invited Lead Administrator
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Name:</span>
                      <strong className="text-slate-900">{invitation.adminName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Email:</span>
                      <span className="text-slate-800">{invitation.adminEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Mobile:</span>
                      <span className="font-mono text-slate-800">+91 {invitation.adminMobile}</span>
                    </div>
                  </div>
                </div>

                {/* Company Basic Information */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">
                    Company Registered Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Legal Name:</span>
                      <strong className="text-slate-800">{compName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Registration Number:</span>
                      <span className="font-mono text-slate-700">{application?.registrationNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Date of Incorporation:</span>
                      <span className="text-slate-700">{application?.incorporationDate || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">State &amp; District:</span>
                      <span className="text-slate-800 font-semibold">{application?.district || "Keonjhar"}, {compState}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Block &amp; Village:</span>
                      <span className="text-slate-700">{application?.block || "—"}, {application?.village || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PIN Code:</span>
                      <span className="font-mono text-slate-700">{application?.pinCode || "—"}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block text-[10px]">Registered Office:</span>
                      <span className="text-slate-700">{application?.registeredAddress || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Operations Summary */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">
                    Operational Scope &amp; Target Membership
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Primary Activity:</span>
                      <strong className="text-slate-800">{application?.operationalInfo?.primary || "Produce Procurement"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Target Farmer Members:</span>
                      <b className="text-emerald-800">{application?.operationalInfo?.membersCount || 100} Farmers</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Villages Covered:</span>
                      <span className="text-slate-800">{application?.operationalInfo?.villagesCovered || 12} Villages</span>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block text-[10px]">Target Commodities:</span>
                      <span className="text-slate-800 font-medium">{application?.operationalInfo?.commodities || "Paddy, Maize, Pulses"}</span>
                    </div>
                  </div>
                </div>

                {/* Previous Correction / Rejection Remarks if any */}
                {application?.correctionRemarks && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900">
                    <strong className="block font-bold text-amber-950 mb-1">Previous Correction Requested:</strong>
                    {application.correctionRemarks}
                  </div>
                )}
                {application?.rejectionReason && (
                  <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-xs text-rose-900">
                    <strong className="block font-bold text-rose-950 mb-1">Rejection Reason:</strong>
                    {application.rejectionReason}
                  </div>
                )}
              </div>
            )}

            {/* TAB: LEGAL & STATUTORY */}
            {activeTab === "legal" && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white font-mono">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans m-0">
                    Statutory Identifiers
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Corporate Identification Number (CIN):</span>
                      <b className="text-slate-800">{application?.cin || "U01100OD2024PTC049812"}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Company PAN:</span>
                      <b className="text-slate-800">{application?.pan || "AAACS9981K"}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">GSTIN:</span>
                      <b className="text-slate-800">{application?.gstin || "21AAACS9981K1Z4"}</b>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">TAN:</span>
                      <b className="text-slate-800">{application?.tan || "BBNS99812L"}</b>
                    </div>
                  </div>
                </div>

                {/* Verified Documents */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">
                    Uploaded Statutory Documents
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className="text-emerald-700" />
                        <span className="font-semibold text-slate-800">Certificate of Incorporation (MCA)</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        Verified Valid
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileCheck size={16} className="text-emerald-700" />
                        <span className="font-semibold text-slate-800">Board Resolution &amp; Nomination</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        Verified Valid
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DIRECTORS */}
            {activeTab === "directors" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">
                    Board of Directors Roster ({application?.directors?.length || 0})
                  </h4>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Min 5 Requirement Met
                  </span>
                </div>

                <div className="space-y-2">
                  {(application?.directors || []).map((dir: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="text-slate-900 block">{dir.name}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {dir.designation} {dir.din ? `· DIN: ${dir.din}` : dir.pan ? `· PAN: ${dir.pan}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-slate-600 font-mono text-[11px]">
                        <div>{dir.mobile ? `+91 ${dir.mobile}` : "—"}</div>
                        <div className="text-slate-400 font-sans text-[10px]">{dir.email || ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FINANCIALS */}
            {activeTab === "financials" && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">
                    Settlement Bank Account
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bank Name:</span>
                      <strong className="text-slate-800">{application?.bankAccounts?.[0]?.bankName || "State Bank of India"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Holder:</span>
                      <strong className="text-slate-800">{application?.bankAccounts?.[0]?.accountHolderName || compName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Number:</span>
                      <span className="font-mono text-slate-800 font-semibold">{application?.bankAccounts?.[0]?.accountNumber || "40981234567"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">IFSC Code:</span>
                      <span className="font-mono text-slate-800 font-semibold">{application?.bankAccounts?.[0]?.ifscCode || "SBIN0001245"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Branch:</span>
                      <span className="text-slate-700">{application?.bankAccounts?.[0]?.branchName || "Lahunipara"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Type:</span>
                      <span className="text-slate-700">Current Account</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Authorised Capital:</span>
                    <b className="text-slate-800 text-sm">Rs 10,00,000</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Paid-up Capital:</span>
                    <b className="text-slate-800 text-sm">Rs 5,00,000</b>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {invitation.status === "Submitted" && (
                <button
                  type="button"
                  onClick={() => handleReviewAction("under_review")}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Mark Under Review
                </button>
              )}
            </div>

            {invitation.status !== "Approved" && invitation.status !== "Rejected" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRemarksInput("");
                    setActionModal("correction");
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  Request Clarification
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRemarksInput("");
                    setActionModal("reject");
                  }}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRemarksInput("All statutory and governance records verified.");
                    setActionModal("approve");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#176b49] hover:bg-[#12583b] text-white shadow-md transition-colors"
                >
                  <CheckCircle2 size={14} /> Approve &amp; Activate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation / Remarks Dialog */}
      {actionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-300 p-6 space-y-4">
            <h4 className="text-base font-bold text-slate-900 m-0">
              {actionModal === "approve" && "Approve & Activate Producer Company"}
              {actionModal === "correction" && "Request Clarification from FPC Admin"}
              {actionModal === "reject" && "Reject Company Registration Application"}
            </h4>

            {actionModal === "approve" && (
              <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-900 border border-emerald-200">
                <strong>Permanent FPC ID Assignment:</strong> An official, sequential FPC ID (e.g.{" "}
                <code>FPC-{compState === "Jharkhand" ? "JHK" : "ODI"}-00X</code>) will be generated. The FPC
                will be added to the active directory and an approval email will be sent to{" "}
                <strong>{invitation.adminEmail}</strong>.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {actionModal === "approve" ? "Approval Remarks (Optional)" : "Mandatory Remarks / Reason *"}
              </label>
              <textarea
                rows={3}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder={
                  actionModal === "correction"
                    ? "Specify the exact fields or documents requiring update..."
                    : actionModal === "reject"
                    ? "State the reason for rejecting this application..."
                    : "Remarks recorded in the audit history..."
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleReviewAction(actionModal)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm cursor-pointer ${
                  actionModal === "approve"
                    ? "bg-[#176b49] hover:bg-[#12583b]"
                    : actionModal === "correction"
                    ? "bg-amber-700 hover:bg-amber-800"
                    : "bg-rose-700 hover:bg-rose-800"
                }`}
              >
                {actionLoading ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal upon Approval/Correction */}
      <EmailPreviewModal
        isOpen={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        type={emailPreviewType}
        recipientName={invitation.adminName}
        recipientEmail={invitation.adminEmail}
        companyName={compName}
        fpcId={lastAssignedFpcId}
        remarks={remarksInput}
      />
    </>
  );
}

