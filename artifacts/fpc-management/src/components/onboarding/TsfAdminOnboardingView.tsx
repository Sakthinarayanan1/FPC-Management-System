import { useState, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import type { FpcInvitation, RecordRow, State } from "@/lib/store";
import { isDemoMode } from "@/lib/moduleConfig";
import EmailPreviewModal from "./EmailPreviewModal";
import FpcAdminOnboardingWizard from "./FpcAdminOnboardingWizard";

interface TsfAdminOnboardingViewProps {
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  setToast: (msg: string) => void;
  role?: string;
  go?: (dest: string) => void;
  activeFlow?: "flow1" | "flow2";
  onSelectFlow?: (flow: "flow1" | "flow2") => void;
}

export default function TsfAdminOnboardingView({
  state,
  setState,
  setToast,
  role = "TSF Central Admin",
  go,
  activeFlow: externalFlow,
  onSelectFlow,
}: TsfAdminOnboardingViewProps) {
  const [internalFlow, setInternalFlow] = useState<"flow1" | "flow2">("flow1");
  const activeFlow = externalFlow || internalFlow;

  const handleFlowSwitch = (flow: "flow1" | "flow2") => {
    setInternalFlow(flow);
    onSelectFlow?.(flow);
  };

  const [fpcName, setFpcName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [clusterDistrict, setClusterDistrict] = useState("");
  const [selectedInvitationToken, setSelectedInvitationToken] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Accepted" | "Expired">("All");
  const [pipelineInvitations, setPipelineInvitations] = useState<any[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<FpcInvitation | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Success confirmation state
  const [sentInvitation, setSentInvitation] = useState<(FpcInvitation & { previewUrl?: string; emailMessageId?: string; emailDispatched?: boolean; emailError?: string }) | null>(null);
  const [previewEmailOpen, setPreviewEmailOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    provider: "gmail" | "smtp" | "ethereal";
    host: string;
    port: number;
    secure: boolean;
    userMasked?: string;
    senderAddress: string;
  } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const loadInvitations = () => {
    fetch("/api/onboarding/invitations")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && Array.isArray(res.invitations)) {
          setPipelineInvitations(res.invitations);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadInvitations();
    fetch("/api/onboarding/smtp-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (res?.success && res.status) {
          setSmtpStatus(res.status);
        }
      })
      .catch(() => {
        // backend might not be online yet
      });
  }, []);

  const handleTestSmtp = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch("/api/onboarding/smtp-verify", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setToast(`✅ ${data.message}`);
        setDeliveryError(null);
      } else {
        const err = data.error || data.message || "SMTP connection verification failed.";
        setDeliveryError(err);
        setToast(`❌ ${err}`);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to reach backend verification endpoint.";
      setDeliveryError(msg);
      setToast(`❌ ${msg}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const invitations: FpcInvitation[] = (state.records.fpcInvitations || []) as unknown as FpcInvitation[];

  // Validation for FPC invitation fields
  const validate = () => {
    // In Prototype Mode, all form validations are completely disabled
    setErrors({});
    return true;
  };

  const checkDuplicate = (targetFpc: string, email: string, mobile: string): FpcInvitation | null => {
    const cleanM = mobile.replace(/\D/g, "");
    const cleanE = email.trim().toLowerCase();
    const cleanF = targetFpc.trim().toLowerCase();

    const pool = pipelineInvitations.length > 0 ? pipelineInvitations : invitations;
    return (
      pool.find(
        (inv) =>
          inv.status !== "Rejected" &&
          inv.status !== "Expired" &&
          ((cleanF && inv.fpcName?.toLowerCase() === cleanF) ||
            inv.adminEmail.toLowerCase() === cleanE ||
            inv.adminMobile.replace(/\D/g, "") === cleanM)
      ) || null
    );
  };

  const handleInputChange = (field: "fpcName" | "name" | "email" | "mobile", value: string) => {
    setDuplicateWarning(null);
    setDeliveryError(null);
    if (field === "fpcName") {
      setFpcName(value);
      if (errors.fpcName) setErrors((e) => ({ ...e, fpcName: "" }));
      if (value.length >= 3 && !isDemoMode()) {
        const dup = checkDuplicate(value, adminEmail, adminMobile);
        if (dup) setDuplicateWarning(dup);
      }
    } else if (field === "name") {
      setAdminName(value);
      if (errors.adminName) setErrors((e) => ({ ...e, adminName: "" }));
    } else if (field === "email") {
      setAdminEmail(value);
      if (errors.adminEmail) setErrors((e) => ({ ...e, adminEmail: "" }));
      if (value.includes("@") && !isDemoMode()) {
        const dup = checkDuplicate(fpcName, value, adminMobile);
        if (dup) setDuplicateWarning(dup);
      }
    } else if (field === "mobile") {
      const clean = value.replace(/\D/g, "").slice(0, 10);
      setAdminMobile(clean);
      if (errors.adminMobile) setErrors((e) => ({ ...e, adminMobile: "" }));
      if (clean.length === 10 && !isDemoMode()) {
        const dup = checkDuplicate(fpcName, adminEmail, clean);
        if (dup) setDuplicateWarning(dup);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalFpcName = fpcName.trim() || "Kalinganagar Farmer Producer Company Ltd.";
    const finalAdminName = adminName.trim() || "Subhashree Jena";
    const finalAdminEmail = adminEmail.trim().toLowerCase() || "admin@kalinganagarfpc.in";
    const finalAdminMobile = adminMobile.replace(/\D/g, "") || "9437890123";
    const finalCluster = clusterDistrict.trim() || "Jajpur Cluster";

    setIsSubmitting(false);
    setDeliveryError(null);
    setDuplicateWarning(null);

    const demoToken = `fpc_inv_demo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const demoInv: FpcInvitation & { previewUrl?: string; emailMessageId?: string; emailDispatched?: boolean; emailError?: string } = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      fpcName: finalFpcName,
      adminName: finalAdminName,
      adminEmail: finalAdminEmail,
      adminMobile: finalAdminMobile,
      clusterDistrict: finalCluster,
      notes: finalCluster,
      token: demoToken,
      url: `${window.location.origin}/onboard/register?token=${demoToken}`,
      status: "Invitation Sent",
      invitedBy: role || "TSF Central Admin",
      invitedAt: new Date().toISOString(),
      dispatchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      resendCount: 0,
      emailDispatched: true,
      createdBy: role || "TSF Central Admin",
    };

    setState((s) => ({
      ...s,
      records: {
        ...s.records,
        fpcInvitations: [demoInv as unknown as RecordRow, ...(s.records.fpcInvitations || []).filter((r) => r.id !== demoInv.id)],
      },
      audit: [
        {
          id: `AUD-${Date.now().toString().slice(-4)}`,
          actor: "TSF Central Admin",
          role: "TSF Central Admin",
          action: `Generated FPC onboarding invitation for ${demoInv.adminEmail} (Prototype Mode)`,
          module: "FPC Onboarding",
          record: demoInv.id,
          oldValue: "None",
          newValue: `${demoInv.status} (${demoInv.adminName})`,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          fpcId: "FPC-ODI-001",
        },
        ...s.audit,
      ],
    }));

    setSentInvitation(demoInv);
    setSelectedInvitationToken(demoInv.token);
    setToast(`Registration invitation prepared for ${demoInv.adminEmail} (Prototype Mode)`);
    setFpcName("");
    setAdminName("");
    setAdminEmail("");
    setAdminMobile("");
    setClusterDistrict("");
    loadInvitations();
  };

  const handleResend = async (inv: FpcInvitation) => {
    setResendingId(inv.id);
    setDeliveryError(null);

    try {
      const response = await fetch(`/api/onboarding/invitations/${encodeURIComponent(inv.id)}/resend`, {
        method: "POST",
      });

      let data: any = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        const text = await response.text().catch(() => "");
        data = { error: text ? `Server returned HTTP ${response.status} with non-JSON content.` : undefined };
      }

      if (!response.ok || !data?.success) {
        const errorMsg = data?.error || data?.message || `Failed to resend invitation email (HTTP ${response.status}).`;
        setDeliveryError(errorMsg);
        setToast(errorMsg);
        return;
      }

      const updated: FpcInvitation & { previewUrl?: string; emailMessageId?: string } = {
        ...data.invitation,
        previewUrl: data.previewUrl,
        emailMessageId: data.emailMessageId,
      };

      setState((s) => ({
        ...s,
        records: {
          ...s.records,
          fpcInvitations: (s.records.fpcInvitations || []).map((row) =>
            row.id === inv.id ? (updated as unknown as RecordRow) : row
          ),
        },
      }));

      setDuplicateWarning(null);
      setToast(`Invitation email successfully resent to ${inv.adminEmail}. Expiration extended by 7 days.`);
      setSentInvitation(updated);
      loadInvitations();
    } catch (err: any) {
      let msg = err.message || "Network error while resending email.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        msg = "Cannot connect to backend API server. Please ensure the backend is running on port 5000 (run 'pnpm run dev:api').";
      }
      setDeliveryError(msg);
      setToast(msg);
    } finally {
      setResendingId(null);
    }
  };

  const registrationLink = sentInvitation
    ? `${window.location.origin}/onboard/register?token=${sentInvitation.token}`
    : "";

  const handleCopyLink = (linkToCopy?: string) => {
    const target = linkToCopy || registrationLink;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setLinkCopied(true);
    setToast("Registration link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleOpenInFlow2 = (token: string) => {
    setSelectedInvitationToken(token);
    handleFlowSwitch("flow2");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeToken =
    selectedInvitationToken ||
    invitations.find((i) => i.status !== "Used" && i.status !== "Submitted")?.token ||
    invitations[0]?.token ||
    "inv_sec_demo_sundargarh_4f8a9e2b1c";

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto p-3 sm:p-4 md:p-6 min-w-0 box-border">
      {/* FLOW SWITCHER TAB BAR */}
      <div
        className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex flex-col sm:flex-row gap-2"
        role="tablist"
        aria-label="Onboarding Flow Switcher"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeFlow === "flow1"}
          onClick={() => handleFlowSwitch("flow1")}
          className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
            activeFlow === "flow1"
              ? "bg-emerald-50/80 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20"
              : "bg-slate-50/70 hover:bg-slate-100 border-slate-200/60 text-slate-600"
          }`}
          data-testid="flow-tab-1"
        >
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
              activeFlow === "flow1"
                ? "bg-[#176b49] text-white shadow-xs"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            01
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <strong className={`text-xs font-bold ${activeFlow === "flow1" ? "text-emerald-950" : "text-slate-800"}`}>
                Flow 1: Send Registration Invitation
              </strong>
              {activeFlow === "flow1" && (
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block truncate">
              TSF Admin enters nominated admin details &bull; Dispatches invitation
            </span>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeFlow === "flow2"}
          onClick={() => handleFlowSwitch("flow2")}
          className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
            activeFlow === "flow2"
              ? "bg-emerald-50/80 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20"
              : "bg-slate-50/70 hover:bg-slate-100 border-slate-200/60 text-slate-600"
          }`}
          data-testid="flow-tab-2"
        >
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
              activeFlow === "flow2"
                ? "bg-[#176b49] text-white shadow-xs"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            02
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <strong className={`text-xs font-bold ${activeFlow === "flow2" ? "text-emerald-950" : "text-slate-800"}`}>
                Flow 2: Complete Company Registration
              </strong>
              {activeFlow === "flow2" && (
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block truncate">
              FPC Admin 8-step official company onboarding wizard
            </span>
          </div>
        </button>
      </div>

      {activeFlow === "flow1" ? (
        /* FLOW 1 WORKFLOW: TSF ADMIN SENDS REGISTRATION INVITATION */
        <>
          {/* Top Banner */}
          <div className="bg-[#176b49] text-white rounded-2xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-200 block mb-1">
                Tata Steel Foundation &bull; Flow 1: Initiate Onboarding
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white m-0">Send FPC Registration Invitation</h1>
              <p className="text-xs md:text-sm text-emerald-100 mt-2 max-w-2xl leading-relaxed">
                TSF Central Operations initiates FPC company registration by inviting the nominated FPC Administrator.
                TSF Admin enters only the administrator&apos;s contact details and optional cluster/district reference.
                The FPC Admin completes the official 8-step company registration in Flow 2.
              </p>
            </div>
            <div className="shrink-0 bg-white/10 border border-white/20 rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Active Flow</span>
              <strong className="text-sm text-white block mt-0.5">Flow 1: Send Invitation</strong>
              <small className="text-[10px] text-emerald-200">TSF Central Admin</small>
            </div>
          </div>

          {/* Live Mail Transport Status Bar */}
          <div className="bg-white rounded-xl p-3.5 px-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">Mail Transport:</span>
              {smtpStatus?.provider === "gmail" ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                  <Mail size={12} className="text-emerald-700" /> Gmail SMTP ({smtpStatus.userMasked || "Configured"})
                </span>
              ) : smtpStatus?.provider === "smtp" ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
                  <Mail size={12} className="text-blue-700" /> {smtpStatus.host}:{smtpStatus.port}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-700" /> Ethereal Test SMTP (Local Development)
                </span>
              )}
              {smtpStatus?.senderAddress && (
                <span className="text-slate-500 hidden sm:inline">&bull; Sender: <code className="text-[11px] font-mono text-slate-700">{smtpStatus.senderAddress}</code></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingConnection}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                title="Perform a live handshake with the configured SMTP server"
              >
                <RefreshCw size={12} className={testingConnection ? "animate-spin text-emerald-700" : ""} />
                {testingConnection ? "Verifying..." : "Verify Connection"}
              </button>
            </div>
          </div>

          {/* Initiate Registration Invitation Card - Expanded Full Width */}
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#176b49] text-white">
                    <Send size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 m-0">Initiate Registration Invitation</h3>
                    <span className="text-[11px] text-slate-500">
                      Enter nominated administrator credentials &bull; Dispatches invitation
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                  Flow 1 Action
                </span>
              </div>

              {sentInvitation ? (
                /* Success Confirmation Card */
                <div className="p-6 md:p-8 space-y-5">
                  {sentInvitation.emailDispatched === false ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Clock size={28} />
                      </div>
                      <h4 className="text-base font-bold text-amber-950 m-0">Registration Link Generated Successfully!</h4>
                      <p className="text-xs text-amber-800">
                        The onboarding link is valid and ready. Note: Real email delivery via SMTP could not be completed:
                      </p>
                      <span className="text-[11px] font-mono text-amber-900 block bg-white/90 p-2 rounded border border-amber-200">
                        {sentInvitation.emailError || "SMTP provider unreachable or unconfigured"}
                      </span>
                      <p className="text-[11px] text-amber-800 mt-1 font-medium">
                        You can use <strong>Copy Onboarding Link</strong> or <strong>Complete in Flow 2</strong> below to proceed with onboarding.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={28} />
                      </div>
                      <h4 className="text-base font-bold text-emerald-950 m-0">Registration Link Sent Successfully!</h4>
                      <p className="text-xs text-emerald-800">
                        A real invitation email with secure onboarding credentials has been delivered to:
                      </p>
                      <strong className="text-sm font-mono text-emerald-950 block bg-white/80 p-2 rounded border border-emerald-200">
                        {sentInvitation.adminEmail}
                      </strong>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Nominated Admin:</span>
                        <strong className="text-slate-800 text-xs">{sentInvitation.adminName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Admin Mobile:</span>
                        <strong className="text-slate-800 text-xs">+91 {sentInvitation.adminMobile}</strong>
                      </div>
                      {(sentInvitation.clusterDistrict || sentInvitation.notes) && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Cluster / District:</span>
                          <strong className="text-slate-800 text-xs">{sentInvitation.clusterDistrict || sentInvitation.notes}</strong>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block text-[11px]">Invitation ID:</span>
                        <span className="font-mono text-slate-700 text-xs">{sentInvitation.id}</span>
                      </div>
                      {sentInvitation.emailMessageId && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">Provider Message-ID:</span>
                          <span className="font-mono text-slate-600 truncate block text-xs" title={sentInvitation.emailMessageId}>
                            {sentInvitation.emailMessageId}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block text-[11px]">Link Validity:</span>
                        <span className="text-amber-800 font-semibold text-xs">7 Days (Single-use token)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 pt-2">
                    {sentInvitation.previewUrl && (
                      <a
                        href={sentInvitation.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-semibold text-xs hover:bg-indigo-100 transition-colors no-underline"
                      >
                        <ExternalLink size={14} /> View Dispatched Email in Web Browser (Ethereal)
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyLink()}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <Copy size={14} />
                      {linkCopied ? "Link Copied to Clipboard!" : "Copy Onboarding Link"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewEmailOpen(true)}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      <Mail size={14} /> Preview Email
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInFlow2(sentInvitation.token)}
                      className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#176b49] text-white font-semibold text-xs hover:bg-[#12583b] transition-colors cursor-pointer"
                    >
                      Complete in Flow 2 &rarr;
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setSentInvitation(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
                    >
                      &larr; Send another invitation
                    </button>
                  </div>
                </div>
              ) : (
                /* Invitation Form - Exactly 4 Fields */
                <form onSubmit={handleSubmit} noValidate={isDemoMode()} className="p-6 md:p-8 space-y-5">
                  {isDemoMode() && (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-900 flex items-center justify-between">
                      <span>
                        <strong>Client Demo Mode Active:</strong> Form fields and credentials are non-blocking. Click <strong>Send Registration Link</strong> to proceed immediately.
                      </span>
                      <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Demo Mode</span>
                    </div>
                  )}

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <strong>TSF Admin Responsibility:</strong> Enter the nominated FPC Administrator&apos;s contact details.
                      Do not enter company registration numbers, bank accounts, or directors. The FPC Admin will
                      complete their own official company records in Flow 2.
                    </div>
                  </div>

                  {/* Delivery Error Banner */}
                  {deliveryError && !isDemoMode() && (
                    <div className="bg-rose-50 border border-rose-300 rounded-lg p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block font-semibold">Email Delivery Failed</strong>
                        <span>{deliveryError}</span>
                        <p className="mt-1 text-[11px] text-rose-700">
                          Please check your SMTP backend settings. No false delivery confirmation was issued.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Warning */}
                  {duplicateWarning && !isDemoMode() && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block font-semibold">Active Invitation Already Exists</strong>
                        An invitation was already dispatched to this email/mobile for{" "}
                        <strong>{duplicateWarning.adminName}</strong>. Current status:{" "}
                        <span className="font-semibold text-amber-800">{duplicateWarning.status}</span>.
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => handleResend(duplicateWarning)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-700 text-white font-semibold text-[11px] hover:bg-amber-800 transition-colors shadow-xs"
                          >
                            <RefreshCw size={12} className={resendingId === duplicateWarning.id ? "animate-spin" : ""} /> Resend to this Administrator
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Field 1: FPC Company Name */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        1. FPC Company Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Building2 size={15} />
                        </div>
                        <input
                          type="text"
                          value={fpcName}
                          onChange={(e) => handleInputChange("fpcName", e.target.value)}
                          placeholder="e.g. Sunrise Agro Farmer Producer Company Ltd."
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        The registered or proposed legal entity name of the Producer Company.
                      </p>
                    </div>

                    {/* Field 2: FPC Admin Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        2. Nominated FPC Admin Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User size={15} />
                        </div>
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="e.g. Ramesh Chandra Nayak"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        The primary representative or managing director authorized to complete company records.
                      </p>
                    </div>

                    {/* Field 3: FPC Admin Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        3. FPC Admin Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail size={15} />
                        </div>
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="e.g. ramesh.nayak@kalingafpc.in"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Real email where the secure invitation link will be dispatched.
                      </p>
                    </div>

                    {/* Field 4: FPC Admin Mobile Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        4. FPC Admin Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone size={15} />
                        </div>
                        <div className="flex">
                          <span className="inline-flex items-center px-2.5 py-2 border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs rounded-l-lg font-mono">
                            +91
                          </span>
                          <input
                            type="tel"
                            value={adminMobile}
                            onChange={(e) => handleInputChange("mobile", e.target.value)}
                            placeholder="9437012345"
                            maxLength={10}
                            className="w-full pl-3 pr-3 py-2 text-xs border rounded-r-lg border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        10-digit Indian mobile number for administrative contact.
                      </p>
                    </div>

                    {/* Field 5: FPC Registration Details & Cluster Reference */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        5. Registration Details / Cluster Reference <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <MapPin size={15} />
                        </div>
                        <input
                          type="text"
                          value={clusterDistrict}
                          onChange={(e) => setClusterDistrict(e.target.value)}
                          placeholder="e.g. Bonai Tribal Cluster, Sundargarh"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        District or cluster reference to pre-populate geographical jurisdiction in Flow 2.
                      </p>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500">
                      Generating this link issues a prototype single-use token.
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto min-w-[220px] inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg bg-[#176b49] hover:bg-[#12583b] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Send size={14} /> Send Registration Invitation
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* FLOW 2: FPC INVITATION PIPELINE TRACKING */}
          <div className="w-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 m-0">FPC Invitation Tracking</h3>
                <span className="text-[11px] text-slate-500">
                  Track expiration, acceptance status, and dispatched activation links
                </span>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs">
                {(["All", "Pending", "Accepted", "Expired"] as const).map((filter) => {
                  const pool = pipelineInvitations.length > 0 ? pipelineInvitations : invitations;
                  const count =
                    filter === "All"
                      ? pool.length
                      : pool.filter((inv) => {
                          const s = inv.status;
                          if (filter === "Accepted") return s === "Accepted";
                          if (filter === "Expired") return s === "Expired";
                          return s === "Pending" || s === "Invitation Sent" || s === "Link Generated";
                        }).length;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                        statusFilter === filter
                          ? "bg-white text-emerald-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {filter} <span className="opacity-75 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {(() => {
                const pool = pipelineInvitations.length > 0 ? pipelineInvitations : invitations;
                const filtered = pool.filter((inv) => {
                  if (statusFilter === "All") return true;
                  if (statusFilter === "Accepted") return inv.status === "Accepted";
                  if (statusFilter === "Expired") return inv.status === "Expired";
                  return inv.status === "Pending" || inv.status === "Invitation Sent" || inv.status === "Link Generated";
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-10 px-4 text-xs text-slate-500">
                      No {statusFilter.toLowerCase()} FPC invitations found.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">FPC Company Name</th>
                        <th className="py-3 px-4">Nominated Administrator</th>
                        <th className="py-3 px-4">Cluster / District</th>
                        <th className="py-3 px-4">Invitation Status</th>
                        <th className="py-3 px-4">Expiration</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((inv) => {
                        const isExpired = inv.status === "Expired";
                        const isAccepted = inv.status === "Accepted";
                        const link = inv.activationUrl || `${window.location.origin}/onboard/activate?token=${inv.token}`;

                        return (
                          <tr key={inv.id || inv.token} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-slate-900">
                              <div className="font-bold text-slate-900">
                                {inv.fpcName || inv.companyName || "Farmer Producer Company"}
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">{inv.id}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{inv.adminName}</div>
                              <div className="text-[11px] text-slate-500">{inv.adminEmail}</div>
                              <div className="text-[10px] font-mono text-slate-400">+91 {inv.adminMobile}</div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">
                              {inv.clusterDistrict || inv.notes || "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              {isAccepted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 size={12} className="text-emerald-700" /> Accepted
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertCircle size={12} className="text-rose-700" /> Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock size={12} className="text-amber-700" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-slate-600">
                              {inv.expiresAt
                                ? new Date(inv.expiresAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "7 Days"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(link);
                                    setToast("Activation link copied to clipboard!");
                                  }}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Copy activation link"
                                >
                                  <Copy size={11} /> Copy Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResend(inv)}
                                  disabled={resendingId === inv.id}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#176b49] border border-emerald-200 transition-colors inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                  title="Resend invitation email"
                                >
                                  <RefreshCw size={11} className={resendingId === inv.id ? "animate-spin" : ""} /> Resend
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>

      {/* Render Email Preview Modal if triggered */}
      {sentInvitation && (
        <EmailPreviewModal
          isOpen={previewEmailOpen}
          onClose={() => setPreviewEmailOpen(false)}
          type="invitation"
          recipientName={sentInvitation.adminName}
          recipientEmail={sentInvitation.adminEmail}
          registrationUrl={registrationLink}
          expiresAt={sentInvitation.expiresAt}
        />
      )}
        </>
      ) : (
        /* FLOW 2 WORKFLOW: FPC ADMIN COMPLETES COMPANY REGISTRATION */
        <div className="pt-0 w-full max-w-full min-w-0">
          <FpcAdminOnboardingWizard
            token={activeToken}
            state={state}
            setState={setState}
            setToast={setToast}
            onExit={() => handleFlowSwitch("flow1")}
          />
        </div>
      )}
    </div>
  );
}

