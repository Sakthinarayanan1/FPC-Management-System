import React from "react";
import { Building2, Sprout, LogOut, Mail } from "lucide-react";
import type { Role } from "@/lib/config";
import { FEATURE_FLAGS } from "@/lib/moduleConfig";

interface Props {
  currentRole: Role;
  onSelectRole: (role: Role) => void;
  onSignOut?: () => void;
  activeFlow?: "flow1" | "flow2";
  onSelectFlow?: (flow: "flow1" | "flow2") => void;
}

export default function DemoRoleSwitcher({
  currentRole,
  onSelectRole,
  onSignOut,
  activeFlow = "flow2",
  onSelectFlow,
}: Props) {
  const isTsf = currentRole === "TSF Central Admin";
  const isFpc = currentRole === "FPC Admin / Manager";

  return (
    <div className="demo-role-switcher-container">
      {/* TWO-TAB SEGMENTED SWITCHER */}
      <div
        className="demo-role-tabs"
        role="tablist"
        aria-label="Demo Flow & Role Switcher"
      >
        {/* TAB 1: FLOW 1 (DIRECT REGISTRATION) OR TSF CENTRAL ADMIN */}
        <button
          type="button"
          role="tab"
          aria-selected={FEATURE_FLAGS.twoFlowModeOnly ? activeFlow === "flow1" : isTsf}
          onClick={() => {
            if (FEATURE_FLAGS.twoFlowModeOnly) {
              onSelectFlow?.("flow1");
            } else {
              onSelectRole("TSF Central Admin");
            }
          }}
          className={`demo-role-tab ${
            FEATURE_FLAGS.twoFlowModeOnly
              ? activeFlow === "flow1"
                ? "active"
                : ""
              : isTsf
              ? "active"
              : ""
          }`}
          title={
            FEATURE_FLAGS.twoFlowModeOnly
              ? "Flow 1: TSF Admin initiates onboarding (Name, Email, Mobile, Cluster/District)"
              : "Switch to TSF Central Admin (Central Monitoring & FPC Oversight · Neha Sharma)"
          }
          data-testid="role-tab-tsf"
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: (FEATURE_FLAGS.twoFlowModeOnly ? activeFlow === "flow1" : isTsf)
                ? "rgba(255, 255, 255, 0.24)"
                : "#dbe9dc",
              color: (FEATURE_FLAGS.twoFlowModeOnly ? activeFlow === "flow1" : isTsf)
                ? "#ffffff"
                : "#1b5e20",
              fontSize: "9px",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {FEATURE_FLAGS.twoFlowModeOnly ? "01" : isTsf ? <Building2 size={11} /> : "TSF"}
          </span>

          <span className="demo-role-tab-label">
            <span className="demo-role-full">
              {FEATURE_FLAGS.twoFlowModeOnly ? "Flow 1: Send Invitation" : "TSF Central Admin"}
            </span>
            <span className="demo-role-short">
              {FEATURE_FLAGS.twoFlowModeOnly ? "Flow 1: Invite" : "TSF Admin"}
            </span>
          </span>

          {(FEATURE_FLAGS.twoFlowModeOnly ? activeFlow === "flow1" : isTsf) && (
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#86efac",
                marginLeft: "2px",
                flexShrink: 0,
              }}
            />
          )}
        </button>

        {/* TAB 2: FLOW 2 (FPC ADMIN COMPLETE REGISTRATION) OR FPC ADMIN / MANAGER */}
        {FEATURE_FLAGS.twoFlowModeOnly ? (
          <button
            type="button"
            role="tab"
            aria-selected={activeFlow === "flow2"}
            onClick={() => onSelectFlow?.("flow2")}
            className={`demo-role-tab ${activeFlow === "flow2" ? "active" : ""}`}
            style={{
              cursor: "pointer",
            }}
            title="Flow 2: FPC Admin completes 8-step official company registration"
            data-testid="role-tab-flow2"
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: activeFlow === "flow2" ? "rgba(255, 255, 255, 0.24)" : "#e2ece4",
                color: activeFlow === "flow2" ? "#ffffff" : "#1b5e20",
                fontSize: "9px",
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {activeFlow === "flow2" ? <Building2 size={11} /> : "02"}
            </span>
            <span className="demo-role-tab-label">
              <span className="demo-role-full">Flow 2: Complete Registration</span>
              <span className="demo-role-short">Flow 2: FPC Admin</span>
            </span>
            {activeFlow === "flow2" && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#86efac",
                  marginLeft: "2px",
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        ) : (
          <button
            type="button"
            role="tab"
            aria-selected={isFpc}
            onClick={() => onSelectRole("FPC Admin / Manager")}
            className={`demo-role-tab ${isFpc ? "active" : ""}`}
            title="Switch to FPC Admin / Manager (Green Valley Operations Desk · Bijay Mohanty)"
            data-testid="role-tab-fpc"
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: isFpc ? "rgba(255, 255, 255, 0.24)" : "#dbe9dc",
                color: isFpc ? "#ffffff" : "#1b5e20",
                fontSize: "9px",
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              {isFpc ? <Sprout size={11} /> : "FPC"}
            </span>

            <span className="demo-role-tab-label">
              <span className="demo-role-full">FPC Admin / Manager</span>
              <span className="demo-role-short">FPC Admin</span>
            </span>

            {isFpc && (
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#86efac",
                  marginLeft: "2px",
                  flexShrink: 0
                }}
              />
            )}
          </button>
        )}
      </div>

      {/* OPTIONAL SIGN-OUT TO ROLE PICKER */}
      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          className="demo-role-signout"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "#ffffff",
            border: "1px solid #d4e3d5",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.15s ease",
            flexShrink: 0
          }}
          title="Exit to role picker"
          aria-label="Exit to role picker"
        >
          <LogOut size={13} />
        </button>
      )}
    </div>
  );
}
