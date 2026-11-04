import React from "react";
import { ArrowRight, ArrowLeft, ShieldCheck, Building2, MapPin } from "lucide-react";
import type { InviteFormData } from "./Screen2TsfAdminInvite";

interface Screen3EmailPreviewProps {
  inviteData: InviteFormData;
  token?: string;
  onAcceptInvitation?: () => void;
  onProceedToLogin?: () => void;
  onBack: () => void;
  setToast?: (msg: string) => void;
}

export default function Screen3EmailPreview({
  inviteData,
  token,
  onAcceptInvitation,
  onProceedToLogin,
  onBack,
  setToast,
}: Screen3EmailPreviewProps) {
  const handleAccept = onAcceptInvitation || onProceedToLogin;

  // Prototype Fallback Placeholders when user leaves fields empty
  const companyName = inviteData.companyName?.trim() || "Kalinganagar Farmer Producer Company Ltd.";
  const adminName = inviteData.adminName?.trim() || "Subhashree Jena";
  const adminEmail = inviteData.adminEmail?.trim() || "admin@kalinganagarfpc.in";
  const adminMobile = inviteData.adminMobile?.trim() || "9437890123";
  const district = inviteData.district?.trim() || "Jajpur";
  const state = inviteData.state?.trim() || "Odisha";

  const demoToken = token || `inv_demo_${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString(36)}`;
  const registrationUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/onboard/register?token=${demoToken}`;

  const emailSubject = `Official Invitation: Complete Company Registration for ${companyName}`;

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#f4f7f2] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Workflow Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176b49] text-white flex items-center justify-center font-bold text-sm shrink-0">
              03
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Step 3 of 6
                </span>
                <span className="text-xs text-slate-400 font-medium">&bull; Email Preview Screen</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 mt-0.5">
                Preview Invitation Email
              </h1>
            </div>
          </div>

          {/* Action Button: Back to Edit */}
          <div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>Back to Edit</span>
            </button>
          </div>
        </div>

        {/* Professional Email Preview Client Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Email Envelope Metadata Header (From, To, Subject, Date) */}
          <div className="bg-slate-50 border-b border-slate-200 p-5 text-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-bold text-slate-500 w-20 uppercase tracking-wider text-[10px]">From:</span>
              <span className="font-medium text-slate-900">
                Tata Steel Foundation Central Operations &lt;<span className="text-[#176b49] font-mono">fpc-onboarding@tatasteelfoundation.org</span>&gt;
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-bold text-slate-500 w-20 uppercase tracking-wider text-[10px]">To:</span>
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <span>{adminName}</span>
                <code className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                  {adminEmail}
                </code>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-bold text-slate-500 w-20 uppercase tracking-wider text-[10px]">Subject:</span>
              <span className="font-bold text-slate-900">{emailSubject}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-bold text-slate-500 w-20 uppercase tracking-wider text-[10px]">Date:</span>
              <span className="text-slate-600 font-medium">{formattedDate}</span>
            </div>
          </div>

          {/* Email Body Content Stationery */}
          <div className="p-6 sm:p-10 space-y-6 font-sans text-slate-700 leading-relaxed text-sm bg-white">
            {/* Header Brand Banner */}
            <div className="border-b border-emerald-800/10 pb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#176b49] block">
                  Tata Steel Foundation
                </span>
                <span className="text-base font-bold text-slate-900">
                  FPC Management &amp; Enterprise Governance System
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>Official MCA &amp; NABARD Partner</span>
              </div>
            </div>

            {/* Salutation */}
            <p>
              Dear <strong>{adminName}</strong>,
            </p>

            {/* Body Description */}
            <p>
              You have been nominated by Tata Steel Foundation Central Administration to act as the primary
              administrator and chief promoter for the onboarding, statutory setup, and commercial operation of:
            </p>

            {/* Highlighted Company Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
                <Building2 size={18} className="text-[#176b49]" />
                <span>{companyName}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  <span><strong>District:</strong> {district}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  <span><strong>State Jurisdiction:</strong> {state}</span>
                </div>
                <div>
                  <span><strong>Contact Mobile:</strong> +91 {adminMobile}</span>
                </div>
                <div>
                  <span><strong>Nominated Email:</strong> {adminEmail}</span>
                </div>
              </div>
            </div>

            <p>
              To initiate your company profile, statutory filings, shareholder management, and agricultural value-chain operations,
              please click the button below to accept this invitation and complete the official 8-step company registration wizard.
            </p>

            {/* Embedded Action Button in Email */}
            <div className="py-2 text-center sm:text-left">
              <button
                type="button"
                onClick={handleAccept}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#176b49] hover:bg-[#12583b] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Accept Invitation &amp; Complete Registration</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Direct Activation Link Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">
                Direct Single-Use Activation Link (Prototype):
              </span>
              <div className="bg-white border border-slate-200 p-2.5 rounded-lg overflow-x-auto">
                <code className="text-[11px] font-mono text-emerald-900 select-all block break-all">
                  {registrationUrl}
                </code>
              </div>
              <span className="text-[10px] text-slate-500 block">
                This prototype registration link connects directly to the FPC Admin Registration Flow without requiring email delivery.
              </span>
            </div>

            {/* Official Sign-off */}
            <div className="border-t border-slate-100 pt-5 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Warm regards,</p>
              <p className="font-medium text-slate-600">FPC Central Governance &amp; Monitoring Program</p>
              <p>Tata Steel Foundation &bull; Jamshedpur &amp; Bhubaneswar, India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
