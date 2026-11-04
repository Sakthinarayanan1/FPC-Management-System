import React, { useState, useEffect } from "react";
import { Sprout, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck, KeyRound, Sparkles } from "lucide-react";
import { isDemoMode } from "@/lib/moduleConfig";
import { useDemoStore } from "@/lib/store";

interface FpcAdminLoginProps {
  onSuccess: (user: any, token: string) => void;
  onNavigate: (path: string) => void;
  setToast: (msg: string) => void;
}

export default function FpcAdminLogin({ onSuccess, onNavigate, setToast }: FpcAdminLoginProps) {
  const state = useDemoStore((s) => s.state);
  const invitations = (state.records.fpcInvitations || []) as any[];
  const latestInvitation = invitations.length > 0 ? invitations[0] : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically populate FPC email from TSF invitation when available
  useEffect(() => {
    if (latestInvitation?.adminEmail && !email) {
      setEmail(latestInvitation.adminEmail);
    } else if (isDemoMode() && !email) {
      setEmail("bijay@greenvalleyfpc.in");
    }
  }, [latestInvitation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isDemoMode()) {
      // In Demo Mode: Allow login without email or password validation.
      // Automatically populate FPC email from TSF invitation when available.
      // Allow direct navigation to the FPC onboarding flow.
      const resolvedEmail = email.trim() || latestInvitation?.adminEmail || "bijay@greenvalleyfpc.in";
      const resolvedName = latestInvitation?.adminName || "Bijay Mohanty";
      const resolvedFpcName = latestInvitation?.fpcName || "Green Valley Farmer Producer Company Ltd.";
      const resolvedFpcId = latestInvitation?.fpcId || "FPC-ODI-001";
      const isCompleted = Boolean(latestInvitation?.status === "Used");

      const demoUser = {
        userId: "fpc-01",
        id: "fpc-01",
        role: "FPC Admin / Manager",
        email: resolvedEmail,
        name: resolvedName,
        fpcId: resolvedFpcId,
        fpcName: resolvedFpcName,
        onboardingCompleted: isCompleted,
        invitationToken: latestInvitation?.token,
      };

      setToast(`Welcome back, ${demoUser.name}! (Demo Mode: Direct Access)`);
      onSuccess(demoUser, "demo-fpc-token");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/fpc/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please check your email and password.");
      }

      setToast(`Welcome back, ${data.user.name || "FPC Administrator"}!`);
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server.");
      setToast(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail("bijay@greenvalleyfpc.in");
    setPassword("GreenValley@2026");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Portal Gateway
        </button>

        {/* Brand Header */}
        <div className="bg-[#12583b] text-white rounded-2xl p-6 shadow-md text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-3 text-emerald-200 border border-white/20">
            <Sprout size={24} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block mb-1">
            FPC Network &bull; Flow 3
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white m-0">FPC Administrator Portal</h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto leading-relaxed">
            Sign in with your activated FPC Admin credentials to manage statutory registration, farmers, and business operations.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 rounded-2xl sm:px-10 border border-slate-200/80">
          {isDemoMode() && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/90 rounded-xl space-y-1.5 text-xs text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Sparkles size={15} className="text-emerald-700 shrink-0" />
                <span>Client Demo Mode Active</span>
              </div>
              <p className="text-[11px] text-emerald-800 m-0 leading-relaxed">
                {latestInvitation?.adminEmail ? (
                  <>Auto-populated invited email: <strong>{latestInvitation.adminEmail}</strong>. Click <em>Sign In</em> to proceed directly without password verification.</>
                ) : (
                  <>Click <em>Sign In to FPC Portal</em> to directly enter without credentials, or jump straight to the onboarding wizard.</>
                )}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate={isDemoMode()}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourfpc.org"
                  autoComplete="email"
                  required={!isDemoMode()}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  autoComplete="current-password"
                  required={!isDemoMode()}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#176b49] hover:bg-[#12583b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#176b49] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    Sign In to FPC Portal <ArrowRight size={16} />
                  </>
                )}
              </button>

              {isDemoMode() && (
                <button
                  type="button"
                  onClick={() => onNavigate("/onboard/register")}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-emerald-300 rounded-xl shadow-xs text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Sprout size={14} className="text-emerald-700" /> Direct Navigation: Open Flow 4 Onboarding Wizard &rarr;
                </button>
              )}
            </div>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" /> Active Demo FPC Account:
              </span>
              <button
                type="button"
                onClick={handleUseDemo}
                className="font-bold text-[#176b49] hover:text-[#12583b] hover:underline cursor-pointer"
              >
                Auto-fill Green Valley Admin
              </button>
            </div>
            <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-[11px] text-emerald-900 font-mono flex flex-col gap-1">
              <div>email: <strong>bijay@greenvalleyfpc.in</strong></div>
              <div>pass: <strong>GreenValley@2026</strong></div>
            </div>
          </div>

          {/* Activation Notice */}
          <div className="mt-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-center text-xs text-amber-900">
            <div className="font-bold flex items-center justify-center gap-1.5 mb-1 text-amber-950">
              <KeyRound size={14} className="text-amber-700" /> Received an invitation email from TSF?
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed mb-2">
              You must activate your account and set your password before logging in.
            </p>
            <button
              type="button"
              onClick={() => onNavigate("/onboard/activate")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Activate Invited Account &rarr;
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs">
            <button
              type="button"
              onClick={() => onNavigate("/tsf/login")}
              className="text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer font-medium"
            >
              Are you from TSF Central Desk? <strong>Sign in to TSF Admin &rarr;</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

