import React from "react";
import { ShieldAlert, Home, Building2, Lock } from "lucide-react";
import type { Role } from "@/lib/config";
import "./access-denied.css";

interface AccessDeniedProps {
  role: Role;
  attemptedPath?: string;
  onGoHome?: () => void;
  onGoProfile?: () => void;
}

export default function AccessDenied({
  role,
  attemptedPath = "/fpc-management",
  onGoHome,
  onGoProfile,
}: AccessDeniedProps) {
  return (
    <section className="access-denied-wrapper" data-testid="access-denied-view">
      <div className="access-denied-card">
        <div className="access-denied-icon-badge">
          <ShieldAlert size={36} strokeWidth={2} />
        </div>

        <span className="access-denied-status-chip">
          <Lock size={12} /> HTTP 403 · Access Restricted
        </span>

        <h1 className="access-denied-title">Access Denied</h1>

        <p className="access-denied-lead">
          You do not have permission to access <strong>FPC Management</strong> or multi-FPC onboarding records.
        </p>

        <div className="access-denied-box">
          <div className="access-denied-rule">
            <strong>Role-Based Policy:</strong>
            <span>Multi-FPC management, directory review, and onboarding approvals are exclusively reserved for <strong>TSF Central Admin</strong>.</span>
          </div>

          <div className="access-denied-rule">
            <strong>Your Role Scoping:</strong>
            <span>You are currently authenticated as <strong>{role}</strong>. Administrative rights for this role are scoped exclusively to your assigned organization: <strong>Green Valley Farmer Producer Company Ltd.</strong></span>
          </div>

          {attemptedPath && (
            <div className="access-denied-rule meta">
              <span className="mono-label">Attempted Route:</span>
              <code className="route-badge">{attemptedPath}</code>
            </div>
          )}
        </div>

        <div className="access-denied-actions">
          {onGoHome && (
            <button
              type="button"
              className="btn-primary"
              onClick={onGoHome}
              data-testid="access-denied-home-btn"
            >
              <Home size={15} /> Return to Dashboard
            </button>
          )}
          {onGoProfile && (
            <button
              type="button"
              className="btn-outline"
              onClick={onGoProfile}
              data-testid="access-denied-profile-btn"
            >
              <Building2 size={15} /> Manage Your FPC Profile
            </button>
          )}
        </div>

        <p className="access-denied-footer-note">
          If you believe you require multi-FPC network access, please contact the Tata Steel Foundation (TSF) Central Administration Desk.
        </p>
      </div>
    </section>
  );
}

