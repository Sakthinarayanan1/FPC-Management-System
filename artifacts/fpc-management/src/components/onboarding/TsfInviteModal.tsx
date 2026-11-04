import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import type { FpcInvitation, RecordRow, State } from "@/lib/store";
import EmailPreviewModal from "./EmailPreviewModal";

interface TsfInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  setToast: (msg: string) => void;
  onInvitationSent?: (invitation: FpcInvitation) => void;
}

export default function TsfInviteModal({
  isOpen,
  onClose,
  state,
  setState,
  setToast,
  onInvitationSent,
}: TsfInviteModalProps) {
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<FpcInvitation | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Success state
  const [sentInvitation, setSentInvitation] = useState<FpcInvitation | null>(null);
  const [previewEmailOpen, setPreviewEmailOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const currentInvitations: FpcInvitation[] = (state.records.fpcInvitations || []) as unknown as FpcInvitation[];

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};

    if (!adminName.trim()) {
      errs.adminName = "FPC Admin Name is required.";
    } else if (adminName.trim().length < 3) {
      errs.adminName = "Name must be at least 3 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim()) {
      errs.adminEmail = "FPC Admin Email is required.";
    } else if (!emailRegex.test(adminEmail.trim())) {
      errs.adminEmail = "Please enter a valid email address.";
    }

    const cleanMobile = adminMobile.replace(/\D/g, "");
    if (!cleanMobile) {
      errs.adminMobile = "FPC Admin Mobile Number is required.";
    } else if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errs.adminMobile = "Enter a valid 10-digit Indian mobile number (starting with 6-9).";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const checkDuplicate = (email: string, mobile: string): FpcInvitation | null => {
    const cleanM = mobile.replace(/\D/g, "");
    const cleanE = email.trim().toLowerCase();

    return (
      currentInvitations.find(
        (inv) =>
          inv.status !== "Rejected" &&
          inv.status !== "Expired" &&
          (inv.adminEmail.toLowerCase() === cleanE || inv.adminMobile.replace(/\D/g, "") === cleanM)
      ) || null
    );
  };

  const handleInputChange = (field: "name" | "email" | "mobile", value: string) => {
    setDuplicateWarning(null);
    setDeliveryError(null);
    if (field === "name") {
      setAdminName(value);
      if (errors.adminName) setErrors((e) => ({ ...e, adminName: "" }));
    } else if (field === "email") {
      setAdminEmail(value);
      if (errors.adminEmail) setErrors((e) => ({ ...e, adminEmail: "" }));
      if (value.includes("@") && adminMobile) {
        const dup = checkDuplicate(value, adminMobile);
        if (dup) setDuplicateWarning(dup);
      }
    } else if (field === "mobile") {
      const clean = value.replace(/\D/g, "").slice(0, 10);
      setAdminMobile(clean);
      if (errors.adminMobile) setErrors((e) => ({ ...e, adminMobile: "" }));
      if (clean.length === 10 && adminEmail) {
        const dup = checkDuplicate(adminEmail, clean);
        if (dup) setDuplicateWarning(dup);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check duplicate
    const dup = checkDuplicate(adminEmail, adminMobile);
    if (dup) {
      setDuplicateWarning(dup);
      return;
    }

    setIsSubmitting(true);
    setDeliveryError(null);

    try {
      // Real backend email dispatch
      const response = await fetch("/api/onboarding/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim().toLowerCase(),
          adminMobile: adminMobile.replace(/\D/g, ""),
          notes: notes.trim() || undefined,
        }),
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
        let errorMsg = data?.error || data?.message;
        if (!errorMsg) {
          if (response.status === 504 || response.status === 502) {
            errorMsg = "Backend API server (port 5000) is unreachable. Please verify that 'pnpm run dev:api' is running.";
          } else if (response.status === 404) {
            errorMsg = "Backend API route '/api/onboarding/invitations' was not found (404).";
          } else {
            errorMsg = `Email dispatch failed with status ${response.status}. Please check backend logs.`;
          }
        }
        setDeliveryError(errorMsg);
        setToast(errorMsg);
        return;
      }

      const newInvitation: FpcInvitation = data.invitation;

      // Update Zustand state with verified invitation
      setState((s) => ({
        ...s,
        records: {
          ...s.records,
          fpcInvitations: [newInvitation as unknown as RecordRow, ...(s.records.fpcInvitations || []).filter(r => r.id !== newInvitation.id)],
        },
        audit: [
          {
            id: `AUD-${Date.now().toString().slice(-4)}`,
            actor: "TSF Central Admin",
            role: "TSF Central Admin",
            action: `Dispatched FPC onboarding invitation to ${newInvitation.adminEmail}`,
            module: "FPC Onboarding",
            record: newInvitation.id,
            oldValue: "None",
            newValue: `Invitation Sent (${newInvitation.adminName})`,
            date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            fpcId: "FPC-ODI-001",
          },
          ...s.audit,
        ],
        notifications: [
          {
            id: `NT-${Date.now().toString().slice(-4)}`,
            title: `Onboarding invitation sent to ${newInvitation.adminName}`,
            date: "Just now",
            status: "Unread",
            fpcId: "FPC-ODI-001",
          },
          ...s.notifications,
        ],
      }));

      setToast(`Registration invitation dispatched to ${newInvitation.adminEmail}`);
      setSentInvitation(newInvitation);
      onInvitationSent?.(newInvitation);
    } catch (err: any) {
      const msg = err.message || "Network error connecting to email service.";
      setDeliveryError(msg);
      setToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendExisting = async (inv: FpcInvitation) => {
    setIsSubmitting(true);
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

      const updatedInvitation: FpcInvitation = data.invitation;

      setState((s) => ({
        ...s,
        records: {
          ...s.records,
          fpcInvitations: (s.records.fpcInvitations || []).map((row) =>
            row.id === inv.id ? (updatedInvitation as unknown as RecordRow) : row
          ),
        },
      }));

      setDuplicateWarning(null);
      setToast(`Invitation resent to ${inv.adminEmail}. Expiration extended by 7 days.`);
      setSentInvitation(updatedInvitation);
    } catch (err: any) {
      const msg = err.message || "Network error while resending email.";
      setDeliveryError(msg);
      setToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const registrationLink = sentInvitation
    ? `${window.location.origin}/onboard/register?token=${sentInvitation.token}`
    : "";

  const handleCopyLink = () => {
    if (!registrationLink) return;
    navigator.clipboard.writeText(registrationLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-emerald-950/10 overflow-hidden my-6">
          {/* Header */}
          <div className="bg-[#176b49] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <Send size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block">
                  TSF Central Operations
                </span>
                <h3 className="text-base font-bold text-white m-0">Initiate FPC Onboarding</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form or Sent Confirmation */}
          {sentInvitation ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Registration Link Sent!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  We have dispatched the onboarding invitation to <strong>{sentInvitation.adminEmail}</strong>.
                </p>
              </div>

              {/* Recipient Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominated Admin:</span>
                  <span className="font-semibold text-slate-800">{sentInvitation.adminName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile Number:</span>
                  <span className="font-semibold text-slate-800">+91 {sentInvitation.adminMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invitation ID:</span>
                  <span className="font-mono text-slate-700">{sentInvitation.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validity:</span>
                  <span className="text-amber-700 font-semibold">7 Days (Single-use token)</span>
                </div>
              </div>

              {/* Action Link & Preview */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition-colors"
                >
                  <Copy size={14} />
                  {linkCopied ? "Invitation Link Copied!" : "Copy Onboarding Link"}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewEmailOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs hover:bg-slate-200 transition-colors"
                  >
                    <Mail size={14} /> Preview Email
                  </button>
                  <a
                    href={registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#176b49] text-white font-semibold text-xs hover:bg-[#12583b] transition-colors no-underline"
                  >
                    Test Link Now <ExternalLink size={13} />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                >
                  Close and Return to Onboarding Pipeline
                </button>
              </div>
            </div>
          ) : (
            /* INITIATION FORM - STRICTLY 3 REQUIRED FIELDS */
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Decoupled Registration Workflow:</strong> Enter the FPC Admin&apos;s contact details.
                  The administrator will complete company legal, financial, and operational details through their
                  secure onboarding portal.
                </div>
              </div>

              {/* Delivery Error Banner */}
              {deliveryError && (
                <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 text-xs text-rose-900 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-rose-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Email Dispatch Failed</strong>
                    <span>{deliveryError}</span>
                    <p className="mt-1 text-[11px] text-rose-700">
                      Please verify your SMTP credentials in the backend environment configuration. No false delivery confirmation was issued.
                    </p>
                  </div>
                </div>
              )}

              {/* Duplicate Detection Banner */}
              {duplicateWarning && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-semibold">Active Invitation Already Exists</strong>
                    An invitation was already issued to this email/mobile for{" "}
                    <strong>{duplicateWarning.adminName}</strong>. Current status:{" "}
                    <span className="font-semibold text-amber-800">{duplicateWarning.status}</span>.
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => handleResendExisting(duplicateWarning)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-700 text-white font-semibold text-[11px] hover:bg-amber-800 transition-colors shadow-xs"
                      >
                        <RefreshCw size={12} /> Resend Existing Invitation Instead
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Field 1: FPC Admin Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. FPC Admin Full Name <span className="text-rose-600">*</span>
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
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all ${
                      errors.adminName ? "border-rose-400 bg-rose-50/30" : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
                {errors.adminName && <p className="text-[11px] text-rose-600 mt-1">{errors.adminName}</p>}
                <p className="text-[10px] text-slate-500 mt-0.5">
                  The primary representative or managing director authorized to complete company records.
                </p>
              </div>

              {/* Field 2: FPC Admin Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. FPC Admin Email Address <span className="text-rose-600">*</span>
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
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all ${
                      errors.adminEmail ? "border-rose-400 bg-rose-50/30" : "border-slate-300 bg-white"
                    }`}
                  />
                </div>
                {errors.adminEmail && <p className="text-[11px] text-rose-600 mt-1">{errors.adminEmail}</p>}
                <p className="text-[10px] text-slate-500 mt-0.5">
                  The official registration link and statutory communications will be dispatched here.
                </p>
              </div>

              {/* Field 3: FPC Admin Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. FPC Admin Mobile Number <span className="text-rose-600">*</span>
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
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full pl-3 pr-3 py-2 text-xs border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono transition-all ${
                        errors.adminMobile ? "border-rose-400 bg-rose-50/30" : "border-slate-300 bg-white"
                      }`}
                    />
                  </div>
                </div>
                {errors.adminMobile && <p className="text-[11px] text-rose-600 mt-1">{errors.adminMobile}</p>}
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Used for verified login and critical compliance SMS notifications.
                </p>
              </div>

              {/* Optional Administrative Note */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Administrative Note (Internal Reference Only — Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cluster development for Keonjhar Sadar"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>

              {/* Primary Action Button */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#176b49] hover:bg-[#12583b] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      Send Registration Link <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
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
  );
}

