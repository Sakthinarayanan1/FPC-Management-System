import React, { useState, useEffect } from "react";
import { KeyRound, ShieldCheck, Lock, Mail, Building2, User, Phone, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { isDemoMode } from "@/lib/moduleConfig";
import { useDemoStore } from "@/lib/store";

interface FpcAccountActivationProps {
  initialToken?: string;
  onSuccess: (user: any, token: string) => void;
  onNavigate: (path: string) => void;
  setToast: (msg: string) => void;
}

export default function FpcAccountActivation({
  initialToken = "",
  onSuccess,
  onNavigate,
  setToast,
}: FpcAccountActivationProps) {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [invitationData, setInvitationData] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Password fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [activatedSession, setActivatedSession] = useState<{ user: any; token: string } | null>(null);

  const state = useDemoStore((s) => s.state);
  const invitations = (state.records.fpcInvitations || []) as any[];
  const fallbackInv = invitations[0];

  // Auto-verify if initialToken provided or fallback in demo mode
  useEffect(() => {
    if (initialToken) {
      verifyToken(initialToken);
    } else if (isDemoMode()) {
      const demoData = fallbackInv || {
        token: "demo-invitation-token",
        fpcName: "Green Valley Farmer Producer Company Ltd.",
        adminName: "Bijay Mohanty",
        adminEmail: "bijay@greenvalleyfpc.in",
        adminMobile: "9437004412",
        clusterDistrict: "Keonjhar, Odisha",
      };
      setInvitationData(demoData);
      setTokenVerified(true);
    }
  }, [initialToken, fallbackInv]);

  const verifyToken = async (tok: string) => {
    if (!tok.trim()) {
      if (isDemoMode()) {
        const demoData = fallbackInv || {
          token: "demo-invitation-token",
          fpcName: "Green Valley Farmer Producer Company Ltd.",
          adminName: "Bijay Mohanty",
          adminEmail: "bijay@greenvalleyfpc.in",
          adminMobile: "9437004412",
          clusterDistrict: "Keonjhar, Odisha",
        };
        setInvitationData(demoData);
        setTokenVerified(true);
        return;
      }
      setVerifyError("Please enter your invitation token.");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/auth/fpc/verify-invitation?token=${encodeURIComponent(tok.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        if (isDemoMode()) {
          const demoData = fallbackInv || {
            token: tok.trim(),
            fpcName: "Green Valley Farmer Producer Company Ltd.",
            adminName: "Bijay Mohanty",
            adminEmail: "bijay@greenvalleyfpc.in",
            adminMobile: "9437004412",
            clusterDistrict: "Keonjhar, Odisha",
          };
          setInvitationData(demoData);
          setTokenVerified(true);
          return;
        }
        throw new Error(data.error || "Invalid invitation token.");
      }

      setInvitationData(data.invitation);
      setTokenVerified(true);
      setToast("Invitation verified successfully. Please set your password.");
    } catch (err: any) {
      if (isDemoMode()) {
        const demoData = fallbackInv || {
          token: tok.trim(),
          fpcName: "Green Valley Farmer Producer Company Ltd.",
          adminName: "Bijay Mohanty",
          adminEmail: "bijay@greenvalleyfpc.in",
          adminMobile: "9437004412",
          clusterDistrict: "Keonjhar, Odisha",
        };
        setInvitationData(demoData);
        setTokenVerified(true);
        return;
      }
      setVerifyError(err.message || "Failed to verify invitation token.");
      setTokenVerified(false);
      setInvitationData(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(tokenInput);
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    if (isDemoMode()) {
      // In Demo Mode: Allow activation without password validation
      const activatedUser = {
        userId: "fpc-01",
        id: "fpc-01",
        role: "FPC Admin / Manager",
        email: invitationData?.adminEmail || "bijay@greenvalleyfpc.in",
        name: invitationData?.adminName || "Bijay Mohanty",
        fpcId: invitationData?.fpcId || "FPC-ODI-001",
        fpcName: invitationData?.fpcName || "Green Valley Farmer Producer Company Ltd.",
        onboardingCompleted: false,
        invitationToken: invitationData?.token || "demo-token",
      };
      setIsActivated(true);
      setActivatedSession({ user: activatedUser, token: "demo-fpc-token" });
      setToast("FPC Admin account successfully activated! (Demo Mode: Direct Access)");
      return;
    }

    if (password.length < 8) {
      setActivationError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setActivationError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsActivating(true);
    try {
      const res = await fetch("/api/auth/fpc/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: invitationData.token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to activate account. Please check your token.");
      }

      setIsActivated(true);
      setActivatedSession({ user: data.user, token: data.token });
      setToast("FPC Admin account successfully activated!");
    } catch (err: any) {
      setActivationError(err.message || "Account activation failed.");
      setToast(err.message || "Activation failed");
    } finally {
      setIsActivating(false);
    }
  };

  const handleContinueToOnboarding = () => {
    if (activatedSession) {
      onSuccess(activatedSession.user, activatedSession.token);
    } else {
      onNavigate("/fpc/login");
    }
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
        <div className="bg-[#176b49] text-white rounded-2xl p-6 shadow-md text-center relative overflow-hidden">
          <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-3 text-emerald-200 border border-white/20">
            <KeyRound size={24} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 block mb-1">
            FPC Onboarding &bull; Flow 3
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white m-0">Activate FPC Account</h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto leading-relaxed">
            Validate your official invitation link and create your secure password to access your company workspace.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 rounded-2xl sm:px-10 border border-slate-200/80">
          {/* STEP 1: If Token Not Yet Verified */}
          {!tokenVerified && !isActivated && (
            <div>
              {verifyError && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1 font-medium leading-relaxed">{verifyError}</div>
                </div>
              )}

              <form onSubmit={handleManualTokenSubmit} className="space-y-4" noValidate={isDemoMode()}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Invitation Token
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Enter the unique invitation token from the email sent to you by Tata Steel Foundation.
                  </p>
                  <div className="relative rounded-xl shadow-xs">
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="e.g. inv_sec_..."
                      required={!isDemoMode()}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#176b49] hover:bg-[#12583b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#176b49] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {isVerifying ? "Verifying Token..." : "Validate Token & Continue"}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Token Verified - Set Password & Activate */}
          {tokenVerified && !isActivated && invitationData && (
            <div>
              <div className="mb-5 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>Invitation Verified</span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    <span>Company: <strong>{invitationData.fpcName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    <span>Nominated Admin: <strong>{invitationData.adminName}</strong></span>
                  </div>
                </div>
              </div>

              {activationError && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1 font-medium leading-relaxed">{activationError}</div>
                </div>
              )}

              <form onSubmit={handleActivationSubmit} className="space-y-4">
                {/* LOCKED EMAIL FIELD - Cannot be modified */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Invited Email Address
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                      <Lock size={10} /> Locked
                    </span>
                  </div>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      value={invitationData.adminEmail}
                      readOnly
                      disabled
                      aria-label="Invited Email Address (Locked)"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    This email was specified by TSF Central Admin and cannot be changed during activation.
                  </p>
                </div>

                {/* Password Fields */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Create New Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isDemoMode() ? "Minimum 8 characters (Optional in Demo Mode)" : "Minimum 8 characters"}
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isDemoMode() ? "Re-enter password (Optional in Demo Mode)" : "Re-enter password"}
                      required={!isDemoMode()}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176b49] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isActivating}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#176b49] hover:bg-[#12583b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#176b49] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {isActivating ? "Activating Account..." : "Set Password & Activate Account"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Successfully Activated */}
          {isActivated && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Account Activated Successfully!</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Your FPC Admin account is now active. You can now complete your company registration or log in anytime with your email and password.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1">
                <div>FPC: <strong>{invitationData?.fpcName}</strong></div>
                <div>Login Email: <strong>{invitationData?.adminEmail}</strong></div>
                <div>Status: <span className="text-emerald-700 font-bold">Active &bull; Verified</span></div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinueToOnboarding}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-[#176b49] hover:bg-[#12583b] transition-colors cursor-pointer"
                >
                  Proceed to FPC Company Onboarding (Flow 4) <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs">
            <button
              type="button"
              onClick={() => onNavigate("/fpc/login")}
              className="text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer font-medium"
            >
              Already activated? <strong>Sign in to FPC Portal &rarr;</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

