import React from "react";
import { CheckCircle2, RotateCcw, Building2, Mail, ShieldCheck, Calendar, FileCheck, MapPin, Download, Check } from "lucide-react";

export interface OnboardingSuccessData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminMobile?: string;
  district?: string;
  state?: string;
  referenceNumber: string;
  status: string;
  submittedAt: string;
}

interface Screen6OnboardingSuccessProps {
  data: OnboardingSuccessData;
  onReturnToLogin: () => void;
}

export default function Screen6OnboardingSuccess({
  data,
  onReturnToLogin,
}: Screen6OnboardingSuccessProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f4f7f2] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Step Indicator Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <span>Workflow Step 6 of 6</span> &bull; <span>Onboarding Complete</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tata Steel Foundation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Farmer Producer Company Central Governance &amp; Monitoring Network
          </p>
        </div>

        {/* Main Success Confirmation Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          {/* Top Green Banner with Success Icon */}
          <div className="bg-gradient-to-b from-[#176b49] to-[#12583b] p-8 text-white text-center space-y-3">
            <div className="w-20 h-20 bg-white text-[#176b49] rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/20 transform transition-transform hover:scale-105 duration-300">
              <CheckCircle2 size={48} strokeWidth={2.2} />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-200">
                Official Submission Acknowledgment
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                FPC Company Successfully Onboarded!
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
              Your formal company onboarding application has been successfully submitted and permanently recorded
              in the Tata Steel Foundation central database.
            </p>
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Primary Details Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#176b49]" /> Application Summary
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {data.status || "Submitted & Verified"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">FPC Registered Company Name</span>
                  <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                    {data.companyName}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Onboarding Reference Number</span>
                  <strong className="text-sm font-mono font-bold text-[#176b49] block mt-0.5">
                    {data.referenceNumber}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">FPC Admin Email</span>
                  <span className="font-mono text-slate-800 font-semibold block mt-0.5">
                    {data.adminEmail}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Authorized Representative</span>
                  <span className="text-slate-900 font-semibold block mt-0.5">
                    {data.adminName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Onboarding Submission Date</span>
                  <span className="text-slate-800 font-semibold block mt-0.5">
                    {data.submittedAt || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Operating Jurisdiction</span>
                  <span className="text-slate-800 font-semibold block mt-0.5">
                    {[data.district, data.state].filter(Boolean).join(", ") || "Jajpur, Odisha"}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist of Completed Onboarding Modules */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck size={16} className="text-emerald-700" /> Completed Registration Steps
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Basic Company Identity &amp; Legal Details</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Share Capital &amp; Financial Structure</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Board of Directors Governance Setup</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Statutory Document &amp; License Vault</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Registered Office &amp; Block Mapping</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Business Activities &amp; Target Commodities</span>
                </div>
              </div>
            </div>

            {/* Next Steps Advisory */}
            <div className="text-xs text-slate-500 leading-relaxed border-l-2 border-emerald-600 pl-3.5 py-1">
              <strong>Next Steps:</strong> Tata Steel Foundation Central Administration will verify your legal
              registration certificate and statutory documents. You will receive an official notification
              upon completion of the verification review.
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Download size={15} /> Print / Save Acknowledgment
              </button>

              <button
                type="button"
                onClick={onReturnToLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#176b49] hover:bg-[#12583b] text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                <RotateCcw size={16} /> Return to Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-400">
          Tata Steel Foundation &bull; FPC Onboarding Workflow Mode &bull; Screen 6 of 6
        </p>
      </div>
    </div>
  );
}

