import React, { useState, useEffect } from "react";
import { Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, Building2 } from "lucide-react";
import { isDemoMode } from "@/lib/moduleConfig";

interface Screen4FpcAdminLoginProps {
  initialEmail: string;
  companyName: string;
  onSuccess: (email?: string) => void;
  onBack: () => void;
  setToast?: (msg: string) => void;
}

export default function Screen4FpcAdminLogin({
  initialEmail,
  companyName,
  onSuccess,
  onBack,
  setToast,
}: Screen4FpcAdminLoginProps) {
  const [email, setEmail] = useState(initialEmail || "admin@kalinganagarfpc.in");
  const [password, setPassword] = useState("FpcAdmin@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setToast?.(`Signed in successfully as FPC Administrator (${email})`);
      onSuccess(email);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Workflow Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
          <span>Workflow Step 4 of 6</span> &bull; <span>FPC Admin Login</span>
        </div>

        <div className="mx-auto w-14 h-14 bg-[#176b49] rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-900/10 mb-3">
          <Building2 size={28} />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {companyName || "Producer Company"}
        </h1>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          FPC Administrator Portal &bull; Company Onboarding
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-bold text-slate-900">FPC Admin Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sign in with your invited administrator credentials to complete company onboarding.
            </p>
          </div>

          {/* Auto-populated Notice */}
          <div className="mb-5 bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="block text-emerald-950">Email Auto-Populated</strong>
              <span>
                Your email was received from the TSF invitation. Click <strong>Sign In as FPC Admin</strong> to proceed to the onboarding form.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  FPC Admin Email Address
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  From Invitation
                </span>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kalinganagarfpc.in"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isDemoMode() ? "Credentials bypass active in demo mode." : "Minimum 8 characters."}
              </span>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#176b49] hover:bg-[#12583b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#176b49] transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as FPC Admin</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Email Preview
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <ShieldCheck size={14} className="text-emerald-700" /> Authenticated Invitation Link
            </span>
            <span className="text-slate-400">Step 4 of 6</span>
          </div>
        </div>
      </div>
    </div>
  );
}

