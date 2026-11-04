import { useState } from "react";
import { Check, Copy, ExternalLink, Mail, ShieldAlert, X } from "lucide-react";

export type EmailPreviewType = "invitation" | "approval" | "correction";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EmailPreviewType;
  recipientName: string;
  recipientEmail: string;
  registrationUrl?: string;
  companyName?: string;
  fpcId?: string;
  expiresAt?: string;
  remarks?: string;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  type,
  recipientName,
  recipientEmail,
  registrationUrl = window.location.origin + "/onboard/register?token=sample",
  companyName = "New Farmer Producer Company Ltd.",
  fpcId = "FPC-ODI-006",
  expiresAt,
  remarks,
}: EmailPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "7 days from dispatch";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-emerald-900/10 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-600/30 text-emerald-400">
              <Mail size={16} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                TSF Secure Email Dispatcher
              </span>
              <h3 className="text-sm font-semibold text-slate-100">
                {type === "invitation" && "Onboarding Registration Invitation Email"}
                {type === "approval" && "Approval Confirmation & Permanent FPC ID Email"}
                {type === "correction" && "Clarification / Correction Request Email"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Email Header Metadata */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 text-xs text-slate-600 grid gap-1 font-mono">
          <div className="flex">
            <span className="w-16 font-semibold text-slate-400">TO:</span>
            <span className="text-slate-900 font-medium">
              {recipientName} &lt;{recipientEmail}&gt;
            </span>
          </div>
          <div className="flex">
            <span className="w-16 font-semibold text-slate-400">FROM:</span>
            <span>TSF Central Operations &lt;onboarding@tatasteelfoundation.org&gt;</span>
          </div>
          <div className="flex">
            <span className="w-16 font-semibold text-slate-400">SUBJECT:</span>
            <span className="font-sans font-semibold text-slate-800">
              {type === "invitation" && "Invitation to Register Your Farmer Producer Company | TSF FPC Network"}
              {type === "approval" && `Registration Approved: Welcome to TSF FPC Network (${fpcId})`}
              {type === "correction" && `Clarification Required: FPC Registration for ${companyName}`}
            </span>
          </div>
        </div>

        {/* Rendered Email Body Simulation */}
        <div className="p-6 max-h-[60vh] overflow-y-auto bg-[#f8faf8]">
          <div className="max-w-xl mx-auto bg-white rounded-lg border border-emerald-900/10 shadow-sm overflow-hidden">
            {/* Branded Banner */}
            <div className="bg-gradient-to-r from-[#176b49] to-[#0e4c33] p-6 text-white text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-emerald-100 border border-white/25 mb-2">
                Tata Steel Foundation
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight m-0">
                FPC Development &amp; Management Portal
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1 mb-0">
                Empowering Rural Producer Companies Across Odisha &amp; Jharkhand
              </p>
            </div>

            {/* Email Core Content */}
            <div className="p-6 text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-base text-[#176b49] mb-3">Dear {recipientName},</p>

              {type === "invitation" && (
                <>
                  <p>
                    You have been formally nominated as the Lead Administrator to register your{" "}
                    <strong>Farmer Producer Company</strong> on the centralized{" "}
                    <strong>TSF FPC Management Network</strong>.
                  </p>
                  <p>
                    This secure invitation gives you direct access to complete your company&apos;s registration,
                    statutory compliance details, board of directors, and operational records.
                  </p>

                  <div className="my-5 p-4 rounded-lg bg-emerald-50/70 border-l-4 border-emerald-600 text-xs text-slate-700">
                    <strong className="text-emerald-900 block mb-1 font-semibold">
                      Required information for registration:
                    </strong>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>Company Basic Details &amp; Registered Address</li>
                      <li>Certificate of Incorporation, CIN, PAN, TAN &amp; GSTIN</li>
                      <li>Board of Directors list (Minimum 5 directors with DIN/PAN)</li>
                      <li>Operational activities and target farmer membership</li>
                      <li>Primary settlement bank account details</li>
                    </ul>
                  </div>

                  <div className="text-center my-6">
                    <a
                      href={registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#176b49] hover:bg-[#12583b] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md shadow-emerald-900/10 transition-all no-underline"
                    >
                      Complete FPC Registration <ExternalLink size={15} />
                    </a>
                    <div className="text-xs text-amber-800 font-medium mt-3">
                      ⏰ Single-use registration link expires on <strong>{formattedExpiry}</strong>.
                    </div>
                  </div>
                </>
              )}

              {type === "approval" && (
                <>
                  <p>
                    Congratulations! We are delighted to inform you that the registration application for{" "}
                    <strong>{companyName}</strong> has been officially verified and approved by Tata Steel
                    Foundation Central Administration.
                  </p>

                  <div className="my-6 p-5 rounded-xl bg-emerald-50 border-2 border-emerald-600 text-center">
                    <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-800 block">
                      Permanent Assigned FPC Unique Identifier
                    </span>
                    <b className="text-2xl font-mono text-emerald-950 tracking-wider block my-2">
                      {fpcId}
                    </b>
                    <span className="text-xs text-emerald-700 font-medium">
                      Active Network Node · Fully Verified
                    </span>
                  </div>

                  <p>
                    Your company is now active on the national TSF network. You can access your operations desk
                    to mobilize farmers, issue share certificates, and conduct agri-business activities.
                  </p>

                  <div className="text-center my-6">
                    <a
                      href="/"
                      className="inline-flex items-center justify-center gap-2 bg-[#176b49] hover:bg-[#12583b] text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md transition-all no-underline"
                    >
                      Access FPC Workspace <ExternalLink size={15} />
                    </a>
                  </div>
                </>
              )}

              {type === "correction" && (
                <>
                  <p>
                    Thank you for submitting your company registration for <strong>{companyName}</strong>. Our
                    review team noted the following points that require your clarification:
                  </p>

                  <div className="my-5 p-4 rounded-lg bg-amber-50 border-l-4 border-amber-500 text-xs text-amber-900">
                    <strong className="block mb-1 font-semibold text-amber-950">Reviewer Feedback:</strong>
                    {remarks || "Please review your directors list and upload a legible bank proof."}
                  </div>

                  <p>
                    Your application has been unlocked for editing. Please revise the flagged sections and
                    re-submit.
                  </p>

                  <div className="text-center my-6">
                    <a
                      href={registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md transition-all no-underline"
                    >
                      Revise Application <ExternalLink size={15} />
                    </a>
                  </div>
                </>
              )}

              <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
                This notification is confidential and intended solely for {recipientEmail}. For assistance,
                contact the TSF Onboarding Helpdesk at <strong>onboarding@tatasteelfoundation.org</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Registration Link:</span>
            <code className="bg-white px-2.5 py-1 rounded border border-slate-300 font-mono text-[11px] max-w-[280px] truncate">
              {registrationUrl}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" /> Copied Link
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Registration Link
                </>
              )}
            </button>
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-sm no-underline"
            >
              Open Onboarding Page <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

