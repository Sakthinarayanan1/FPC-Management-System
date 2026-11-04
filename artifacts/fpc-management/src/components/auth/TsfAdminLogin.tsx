import React, { useState } from "react";
import { Building2, ShieldCheck, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { isDemoMode } from "@/lib/moduleConfig";

interface TsfAdminLoginProps {
  onSuccess: (user: any, token: string) => void;
  onNavigate: (path: string) => void;
  setToast: (msg: string) => void;
}

export default function TsfAdminLogin({ onSuccess, onNavigate, setToast }: TsfAdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isDemoMode()) {
      // In Demo Mode: Allow login without validating username or password.
      // Directly open the TSF Admin dashboard without required-field errors or credential mismatch messages.
      setToast("Welcome, TSF Central Administrator! (Demo Mode: Direct Access)");
      const demoUser = {
        userId: "tsf-01",
        id: "tsf-01",
        role: "TSF Central Admin",
        username: username.trim() || "tsfadmin",
        name: "TSF Central Operations",
        email: "tsfadmin@tatasteelfoundation.org",
      };
      onSuccess(demoUser, "demo-tsf-token");
      return;
    }

    if (!username.trim()) {
      setError("Please enter your TSF Admin username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/tsf/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please verify your credentials.");
      }

      setToast("Welcome, TSF Central Administrator!");
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server.");
      setToast(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemo = () => {
    setUsername("tsfadmin");
    setPassword("TataSteel@2026");
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

        {/* Brand Card Header */}
        <div className="bg-[#176b49] text-white rounded-2xl p-6 shadow-md text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-3 text-emerald-200 border border-white/20">
            <Building2 size={24} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block mb-1">
            Tata Steel Foundation &bull; Flow 1
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white m-0">TSF Central Administration</h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto leading-relaxed">
            Authorized administration desk for FPC network oversight, company invitations, and statutory compliance.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 rounded-2xl sm:px-10 border border-slate-200/80">
          {isDemoMode() && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs">
              <Sparkles size={16} className="text-emerald-700 shrink-0" />
              <span><strong>Client Demo Mode Active:</strong> Click <em>Sign In as TSF Admin</em> to open the TSF Admin dashboard directly without credentials.</span>
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
                Admin Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tsfadmin"
                  autoComplete="username"
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
                  placeholder="Enter administrator password"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#176b49] hover:bg-[#12583b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#176b49] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    Sign In as TSF Admin <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Fill */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" /> Default Credentials:
              </span>
              <button
                type="button"
                onClick={handleUseDemo}
                className="font-bold text-[#176b49] hover:text-[#12583b] hover:underline cursor-pointer"
              >
                Auto-fill Demo Admin
              </button>
            </div>
            <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-[11px] text-emerald-900 font-mono flex justify-between">
              <span>user: <strong>tsfadmin</strong></span>
              <span>pass: <strong>TataSteel@2026</strong></span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => onNavigate("/fpc/login")}
              className="text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer font-medium"
            >
              Are you an FPC Admin? <strong>Sign in to FPC Portal &rarr;</strong>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("/onboard/activate")}
              className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Received an invitation email? Activate Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

