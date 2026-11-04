import React, { useState } from "react";
import { Building2, User, Mail, Phone, MapPin, Send, ShieldCheck, ArrowRight } from "lucide-react";

export interface InviteFormData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  district: string;
  state: string;
}

interface Screen2TsfAdminInviteProps {
  initialData: InviteFormData;
  onSubmit?: (data: InviteFormData) => void;
  onSaveSession?: (data: InviteFormData, token?: string) => void;
  onNavigateToPreview?: () => void;
  setToast?: (msg: string) => void;
}

const DISTRICT_OPTIONS = [
  "Jajpur",
  "Keonjhar",
  "Sundargarh",
  "Mayurbhanj",
  "Angul",
  "East Singhbhum",
  "West Singhbhum",
  "Saraikela Kharsawan",
  "Ranchi",
  "Bokaro",
];

const STATE_OPTIONS = ["Odisha", "Jharkhand"];

export default function Screen2TsfAdminInvite({
  initialData,
  onSubmit,
  onSaveSession,
  onNavigateToPreview,
  setToast,
}: Screen2TsfAdminInviteProps) {
  const [formData, setFormData] = useState<InviteFormData>({
    companyName: initialData.companyName ?? "Kalinganagar Farmer Producer Company Ltd.",
    adminName: initialData.adminName ?? "Subhashree Jena",
    adminEmail: initialData.adminEmail ?? "admin@kalinganagarfpc.in",
    adminMobile: initialData.adminMobile ?? "9437890123",
    district: initialData.district || "Jajpur",
    state: initialData.state || "Odisha",
  });

  const handleChange = (field: keyof InviteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalizedData: InviteFormData = {
      companyName: formData.companyName.trim(),
      adminName: formData.adminName.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      adminMobile: formData.adminMobile.trim(),
      district: formData.district || "Jajpur",
      state: formData.state || "Odisha",
    };

    setFormData(finalizedData);

    const demoToken = `inv_demo_${(finalizedData.companyName || "fpc").toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString(36)}`;

    // Save session in coordinator
    onSaveSession?.(finalizedData, demoToken);

    setToast?.("Registration invitation prepared. Navigating to email preview...");

    // Directly navigate to Email Preview Screen
    if (onNavigateToPreview) {
      onNavigateToPreview();
    } else if (onSubmit) {
      onSubmit(finalizedData);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f2] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Workflow Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176b49] text-white flex items-center justify-center font-bold text-sm shrink-0">
              02
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Step 2 of 6
                </span>
                <span className="text-xs text-slate-400 font-medium">&bull; TSF Admin Action</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 mt-0.5">
                TSF Admin Invites FPC Admin
              </h1>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 self-start sm:self-auto bg-slate-100 px-3 py-1 rounded-lg">
            Role: TSF Central Admin
          </span>
        </div>

        {/* Main Invitation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-emerald-900 to-[#176b49] px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
                <Send size={20} className="text-emerald-200" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Initiate FPC Admin Registration Invitation</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Enter proposed producer company details and nominated representative contact information (prototype mode).
                </p>
              </div>
            </div>
          </div>

          {/* Form Content - Prototype Mode: Zero validation & all fields optional */}
          <form onSubmit={handleFormSubmit} noValidate className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Field 1: FPC Company Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Proposed FPC Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 size={16} />
                  </div>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="e.g. Kalinganagar Farmer Producer Company Ltd."
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Official name as intended for MCA / ROC incorporation.
                </span>
              </div>

              {/* Field 2: FPC Admin Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Nominated FPC Admin Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => handleChange("adminName", e.target.value)}
                    placeholder="e.g. Subhashree Jena"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Designated company manager or chief promoter.
                </span>
              </div>

              {/* Field 3: FPC Admin Email */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  FPC Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange("adminEmail", e.target.value)}
                    placeholder="e.g. admin@kalinganagarfpc.in"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  The official invitation will be addressed to this recipient.
                </span>
              </div>

              {/* Field 4: Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={formData.adminMobile}
                    onChange={(e) => handleChange("adminMobile", e.target.value)}
                    placeholder="e.g. 9437890123"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Primary contact number for communications and records.
                </span>
              </div>

              {/* Field 5: District */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  District Reference
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <select
                    value={formData.district}
                    onChange={(e) => handleChange("district", e.target.value)}
                    className="block w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium appearance-none cursor-pointer"
                  >
                    {DISTRICT_OPTIONS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Operating district cluster for TSF field monitoring.
                </span>
              </div>

              {/* Field 6: State */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  State Jurisdiction
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin size={16} />
                  </div>
                  <select
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="block w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium appearance-none cursor-pointer"
                  >
                    {STATE_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  State of incorporation / registration.
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Click Send Registration Invitation to preview the official invitation email.
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#176b49] hover:bg-[#12583b] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Send size={15} />
                <span>Send Registration Invitation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
