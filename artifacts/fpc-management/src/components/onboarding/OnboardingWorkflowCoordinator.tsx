import React, { useState, useEffect } from "react";
import type { RecordRow, State } from "@/lib/store";
import Screen1TsfAdminLogin from "./Screen1TsfAdminLogin";
import Screen2TsfAdminInvite, { type InviteFormData } from "./Screen2TsfAdminInvite";
import Screen3EmailPreview from "./Screen3EmailPreview";
import Screen4FpcAdminLogin from "./Screen4FpcAdminLogin";
import Screen6OnboardingSuccess, { type OnboardingSuccessData } from "./Screen6OnboardingSuccess";
import FpcAdminOnboardingWizard from "./FpcAdminOnboardingWizard";

interface OnboardingWorkflowCoordinatorProps {
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  setToast: (msg: string) => void;
}

export type OnboardingScreenStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface WorkflowSessionState {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  district: string;
  state: string;
  token: string;
  referenceNumber: string;
  submittedAt: string;
  status: string;
}

export default function OnboardingWorkflowCoordinator({
  state,
  setState,
  setToast,
}: OnboardingWorkflowCoordinatorProps) {
  // Determine initial screen based on URL token or route
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreenStep>(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get("token");
      const path = window.location.pathname;
      if (token || path.includes("/onboard/register") || path.includes("/onboard/activate")) {
        return 4;
      }
    }
    return 1;
  });

  // Shared session data preserved across all screens
  const [session, setSession] = useState<WorkflowSessionState>(() => {
    let initialToken = "fpc_inv_sec_kalinganagar_98a72b";
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get("token");
      if (urlToken) initialToken = urlToken;
    }
    return {
      companyName: "Kalinganagar Farmer Producer Company Ltd.",
      adminName: "Subhashree Jena",
      adminEmail: "admin@kalinganagarfpc.in",
      adminMobile: "9437890123",
      district: "Jajpur",
      state: "Odisha",
      token: initialToken,
      referenceNumber: "TSF-FPC-2026-4819",
      submittedAt: "",
      status: "Pending",
    };
  });

  // Listen to popstate or direct link activations
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUrlChange = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get("token");
      const path = window.location.pathname;
      if (urlToken) {
        setSession((prev) => ({ ...prev, token: urlToken }));
        setCurrentScreen(4);
      } else if (path.includes("/onboard/register") || path.includes("/onboard/activate")) {
        setCurrentScreen(4);
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Handler for Screen 1 -> Screen 2
  const handleScreen1Success = () => {
    setState((s) => ({
      ...s,
      role: "TSF Central Admin",
      currentUser: {
        id: "tsf-01",
        name: "TSF Central Admin",
        username: "admin@tatasteelfoundation.org",
        role: "TSF Central Admin",
      },
    }));
    setCurrentScreen(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for saving session & records from Screen 2 without forced screen jump
  const handleScreen2SaveSession = (data: InviteFormData, token?: string) => {
    const activeToken = token || session.token || `fpc_token_${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString(36)}`;
    const newRef = session.referenceNumber || `TSF-FPC-2026-${Date.now().toString().slice(-4)}`;

    const updatedSession: WorkflowSessionState = {
      ...session,
      ...data,
      token: activeToken,
      referenceNumber: newRef,
      status: "Invitation Sent",
    };

    setSession(updatedSession);

    // Also persist an invitation record into Zustand state
    const newInv = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      token: activeToken,
      fpcName: data.companyName,
      adminName: data.adminName,
      adminEmail: data.adminEmail,
      adminMobile: data.adminMobile,
      clusterDistrict: `${data.district}, ${data.state}`,
      status: "Invitation Sent",
      invitedBy: "TSF Central Admin",
      invitedAt: new Date().toISOString(),
      dispatchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      resendCount: 0,
      createdBy: "TSF Central Admin",
    };

    setState((s) => ({
      ...s,
      records: {
        ...s.records,
        fpcInvitations: [newInv as unknown as RecordRow, ...(s.records.fpcInvitations || []).filter((r: any) => r.id !== newInv.id)],
      },
    }));
  };

  const handleNavigateToPreview = () => {
    setCurrentScreen(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for Screen 2 -> Screen 3 (Explicit navigation)
  const handleScreen2Submit = (data: InviteFormData) => {
    handleScreen2SaveSession(data);
    handleNavigateToPreview();
  };

  // Handler for Screen 3 Accept -> Screen 4 (FPC Admin Login)
  const handleScreen3Accept = () => {
    setCurrentScreen(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for Screen 3 Back -> Screen 2
  const handleScreen3Back = () => {
    setCurrentScreen(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for Screen 4 Success -> Screen 5 (Flow 2: Complete FPC Company Registration)
  const handleScreen4Success = (loginEmail?: string) => {
    const activeEmail = loginEmail || session.adminEmail || "admin@kalinganagarfpc.in";
    setSession((prev) => ({
      ...prev,
      adminEmail: activeEmail,
    }));
    setState((s) => ({
      ...s,
      role: "FPC Admin / Manager",
      currentUser: {
        id: "fpc-admin-01",
        name: session.adminName || "FPC Administrator",
        username: activeEmail,
        role: "FPC Admin / Manager",
        invitationToken: session.token,
      },
    }));
    setCurrentScreen(5);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for Screen 4 Back -> Screen 3
  const handleScreen4Back = () => {
    setCurrentScreen(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for Screen 5 Back -> Screen 4 (FPC Admin Login)
  const handleScreen5Back = () => {
    setCurrentScreen(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for Screen 5 Submit -> Screen 6
  const handleScreen5Submitted = (summary: {
    fpcId: string;
    companyName: string;
    adminName: string;
    adminEmail: string;
    submittedAt: string;
  }) => {
    setSession((prev) => ({
      ...prev,
      companyName: summary.companyName || prev.companyName,
      adminName: summary.adminName || prev.adminName,
      adminEmail: summary.adminEmail || prev.adminEmail,
      referenceNumber: summary.fpcId || prev.referenceNumber,
      submittedAt: summary.submittedAt || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      status: "Submitted & Verified",
    }));

    setCurrentScreen(6);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for Screen 6 -> Screen 1 (Return to Login)
  const handleReturnToLogin = () => {
    setState((s) => ({
      ...s,
      role: "" as any,
      currentUser: undefined,
    }));
    setCurrentScreen(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. SCREEN 1: TSF Admin Login
  if (currentScreen === 1) {
    return (
      <Screen1TsfAdminLogin
        onSuccess={handleScreen1Success}
        setToast={setToast}
      />
    );
  }

  // 2. SCREEN 2: TSF Admin Invites FPC Admin
  if (currentScreen === 2) {
    return (
      <Screen2TsfAdminInvite
        initialData={{
          companyName: session.companyName,
          adminName: session.adminName,
          adminEmail: session.adminEmail,
          adminMobile: session.adminMobile,
          district: session.district,
          state: session.state,
        }}
        onSaveSession={handleScreen2SaveSession}
        onNavigateToPreview={handleNavigateToPreview}
        onSubmit={handleScreen2Submit}
        setToast={setToast}
      />
    );
  }

  // 3. SCREEN 3: Preview Email Template
  if (currentScreen === 3) {
    return (
      <Screen3EmailPreview
        inviteData={{
          companyName: session.companyName,
          adminName: session.adminName,
          adminEmail: session.adminEmail,
          adminMobile: session.adminMobile,
          district: session.district,
          state: session.state,
        }}
        token={session.token}
        onAcceptInvitation={handleScreen3Accept}
        onProceedToLogin={handleScreen3Accept}
        onBack={handleScreen3Back}
        setToast={setToast}
      />
    );
  }

  // 4. SCREEN 4: FPC Admin Login
  if (currentScreen === 4) {
    return (
      <Screen4FpcAdminLogin
        initialEmail={session.adminEmail}
        companyName={session.companyName}
        onSuccess={handleScreen4Success}
        onBack={handleScreen4Back}
        setToast={setToast}
      />
    );
  }

  // 5. SCREEN 5: FPC Company Onboarding (8-Step Wizard)
  if (currentScreen === 5) {
    // Guard: Prevent unauthorized users from accessing the invitation-specific registration page before authentication
    if (state.role !== "FPC Admin / Manager") {
      return (
        <Screen4FpcAdminLogin
          initialEmail={session.adminEmail}
          companyName={session.companyName}
          onSuccess={handleScreen4Success}
          onBack={handleScreen4Back}
          setToast={setToast}
        />
      );
    }

    return (
      <FpcAdminOnboardingWizard
        token={session.token}
        state={state}
        setState={setState}
        setToast={setToast}
        onExit={handleScreen5Back}
        onSubmitted={handleScreen5Submitted}
        initialSessionData={{
          companyName: session.companyName,
          adminName: session.adminName,
          adminEmail: session.adminEmail,
          adminMobile: session.adminMobile,
          district: session.district,
          state: session.state,
        }}
        onboardingOnly={true}
      />
    );
  }

  // 6. SCREEN 6: Successfully Onboarded
  return (
    <Screen6OnboardingSuccess
      data={{
        companyName: session.companyName,
        adminName: session.adminName,
        adminEmail: session.adminEmail,
        adminMobile: session.adminMobile,
        district: session.district,
        state: session.state,
        referenceNumber: session.referenceNumber,
        status: session.status,
        submittedAt: session.submittedAt,
      }}
      onReturnToLogin={handleReturnToLogin}
    />
  );
}

