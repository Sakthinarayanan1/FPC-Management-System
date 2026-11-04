import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, ExternalLink, Calendar, Tag, ShieldCheck, X, Plus, ArrowRight } from "lucide-react";

export interface RegistrationDetailItem {
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
  highlight?: boolean;
}

export interface RegistrationSuccessModalProps {
  isOpen: boolean;
  isEdit?: boolean;
  title?: string;
  message?: string;
  registrationType: string;
  registrationId: string;
  dateTime?: string;
  statusText?: string;
  statusBadgeVariant?: "green" | "blue" | "amber" | "slate";
  summaryDetails?: RegistrationDetailItem[];
  onViewDetails?: () => void;
  onDone: () => void;
  onRegisterAnother?: () => void;
  viewDetailsLabel?: string;
  doneLabel?: string;
  registerAnotherLabel?: string;
}

export default function RegistrationSuccessModal({
  isOpen,
  isEdit = false,
  title,
  message,
  registrationType,
  registrationId,
  dateTime,
  statusText,
  statusBadgeVariant = "green",
  summaryDetails = [],
  onViewDetails,
  onDone,
  onRegisterAnother,
  viewDetailsLabel,
  doneLabel,
  registerAnotherLabel
}: RegistrationSuccessModalProps) {
  const [copied, setCopied] = React.useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-generate date/time if not supplied
  const formattedDateTime = React.useMemo(() => {
    if (dateTime) return dateTime;
    const now = new Date();
    const datePart = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    const timePart = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    return `${datePart} · ${timePart}`;
  }, [dateTime]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDone();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onDone]);

  // Copy registration ID to clipboard
  const handleCopyId = () => {
    if (!registrationId) return;
    navigator.clipboard?.writeText(registrationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const defaultTitle = isEdit
    ? "Changes Saved Successfully!"
    : (registrationType.includes("Farmer") ? "Farmer Registered Successfully!" : "Registration Successful!");
  const defaultMessage = isEdit
    ? "The updated information has been successfully saved to the register."
    : (registrationType.includes("Farmer") ? "The farmer's registration has been completed successfully." : "Your information has been successfully submitted and recorded in the system.");

  const modalTitle = title || defaultTitle;
  const modalMessage = message || defaultMessage;
  const currentStatus = statusText || (isEdit ? "Updated" : "Submitted");

  const idLabel = registrationType.includes("Farmer")
    ? "Farmer ID"
    : (registrationType.includes("Shareholder") ? "Folio / Member ID" : "Registration ID");

  const badgeBg =
    statusBadgeVariant === "green"
      ? "#ecfdf5"
      : statusBadgeVariant === "amber"
      ? "#fffbeb"
      : statusBadgeVariant === "blue"
      ? "#eff6ff"
      : "#f1f5f9";

  const badgeColor =
    statusBadgeVariant === "green"
      ? "#065f46"
      : statusBadgeVariant === "amber"
      ? "#92400e"
      : statusBadgeVariant === "blue"
      ? "#1e40af"
      : "#334155";

  const badgeBorder =
    statusBadgeVariant === "green"
      ? "#a7f3d0"
      : statusBadgeVariant === "amber"
      ? "#fde68a"
      : statusBadgeVariant === "blue"
      ? "#bfdbfe"
      : "#cbd5e1";

  const modalBackdrop = (
    <div
      className="reg-success-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-success-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 18, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 999999,
        animation: "regModalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
      onClick={onDone}
    >
      <div
        ref={modalRef}
        className="reg-success-card"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "490px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(27, 94, 32, 0.08)",
          border: "1px solid #d4e3d5",
          overflow: "hidden",
          animation: "regModalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative"
        }}
      >
        {/* TOP ACCENT BAR */}
        <div
          style={{
            height: "5px",
            background: "linear-gradient(90deg, #1b5e20 0%, #2e7d32 60%, #43a047 100%)",
            width: "100%"
          }}
        />

        {/* CLOSE ICON BUTTON */}
        <button
          type="button"
          onClick={onDone}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "1px solid #e2e8e2",
            backgroundColor: "#f7faf7",
            color: "#607164",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "#eaf2eb";
            e.currentTarget.style.color = "#1b5e20";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "#f7faf7";
            e.currentTarget.style.color = "#607164";
          }}
        >
          <X size={15} />
        </button>

        <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
          {/* GREEN SUCCESS ICON WITH CHECKMARK ANIMATION */}
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#e8f5e9",
              border: "2px solid #a5d6a7",
              color: "#1b5e20",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 4px 14px rgba(46, 125, 50, 0.18)",
              animation: "regCheckmarkBounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}
          >
            <Check size={30} strokeWidth={2.8} />
          </div>

          {/* HEADING */}
          <h2
            id="reg-success-title"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#14281a",
              margin: "0 0 6px",
              letterSpacing: "-0.3px"
            }}
          >
            {modalTitle}
          </h2>

          {/* MESSAGE */}
          <p
            style={{
              fontSize: "13px",
              color: "#5b6b60",
              margin: "0 0 20px",
              lineHeight: 1.45
            }}
          >
            {modalMessage}
          </p>

          {/* REGISTRATION METADATA BOX */}
          <div
            style={{
              backgroundColor: "#f7faf7",
              border: "1px solid #dce8dd",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "18px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            {/* ROW 1: REGISTRATION TYPE & STATUS */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px"
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#1b5e20",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                <Tag size={12} />
                {registrationType}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeBorder}`,
                  padding: "2px 8px",
                  borderRadius: "12px"
                }}
              >
                <ShieldCheck size={11} />
                {currentStatus}
              </span>
            </div>

            {/* ROW 2: REGISTRATION ID */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                backgroundColor: "#ffffff",
                border: "1px dashed #b7d1bb",
                borderRadius: "8px"
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#728477",
                    textTransform: "uppercase",
                    display: "block"
                  }}
                >
                  {idLabel}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    color: "#143a1e"
                  }}
                >
                  {registrationId}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: copied ? "#1b5e20" : "#4a5d4f",
                  backgroundColor: copied ? "#dcfce7" : "#edf3ee",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                title="Copy ID to clipboard"
              >
                <Copy size={12} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* ROW 3: DATE & TIME */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: "#66786a",
                paddingTop: "2px"
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Calendar size={12} />
                Registration Date &amp; Time
              </span>
              <strong style={{ color: "#2d4233", fontWeight: 600 }}>{formattedDateTime}</strong>
            </div>

            {/* OPTIONAL SUMMARY ATTRIBUTES */}
            {summaryDetails.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid #e3ede4",
                  paddingTop: "10px",
                  marginTop: "2px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px"
                }}
              >
                {summaryDetails.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px"
                    }}
                  >
                    <span style={{ color: "#66786a" }}>{item.label}</span>
                    <span
                      style={{
                        fontWeight: item.highlight ? 700 : 600,
                        color: item.highlight ? "#1b5e20" : "#213626",
                        fontFamily: item.isMono ? "monospace" : "inherit"
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS (THREE MODAL ACTIONS) */}
          {onRegisterAnother ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "20px"
              }}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {/* ACTION 1: VIEW PROFILE / DETAILS */}
                {onViewDetails && (
                  <button
                    type="button"
                    onClick={onViewDetails}
                    data-testid="success-modal-view-details"
                    style={{
                      flex: "1 1 calc(50% - 5px)",
                      minWidth: "150px",
                      padding: "11px 16px",
                      backgroundColor: "#1b5e20",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 94, 32, 0.28)",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#144818")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1b5e20")}
                  >
                    <ExternalLink size={14} />
                    {viewDetailsLabel || "View Farmer Profile"}
                  </button>
                )}

                {/* ACTION 2: REGISTER ANOTHER */}
                <button
                  type="button"
                  onClick={onRegisterAnother}
                  data-testid="success-modal-register-another"
                  style={{
                    flex: "1 1 calc(50% - 5px)",
                    minWidth: "150px",
                    padding: "11px 16px",
                    backgroundColor: "#ffffff",
                    color: "#1b5e20",
                    border: "1.5px solid #2e7d32",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#f0f8f1";
                    e.currentTarget.style.borderColor = "#1b5e20";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#2e7d32";
                  }}
                >
                  <Plus size={14} />
                  {registerAnotherLabel || "Register Another Farmer"}
                </button>
              </div>

              {/* ACTION 3: GO TO ALL / DONE */}
              <button
                type="button"
                onClick={onDone}
                data-testid="success-modal-done"
                style={{
                  width: "100%",
                  padding: "9px 16px",
                  backgroundColor: "#f7faf7",
                  color: "#374c3d",
                  border: "1px solid #cad9cd",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#eaf2eb";
                  e.currentTarget.style.borderColor = "#b5c9b9";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#f7faf7";
                  e.currentTarget.style.borderColor = "#cad9cd";
                }}
              >
                <ArrowRight size={13} />
                {doneLabel || "Go to All Farmers"}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: "20px"
              }}
            >
              {onViewDetails && (
                <button
                  type="button"
                  onClick={onViewDetails}
                  data-testid="success-modal-view-details"
                  style={{
                    flex: "1 1 160px",
                    minWidth: "140px",
                    padding: "10px 18px",
                    backgroundColor: "#1b5e20",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(27, 94, 32, 0.28)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#144818")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#1b5e20")}
                >
                  <ExternalLink size={14} />
                  {viewDetailsLabel || "View Details"}
                </button>
              )}

              <button
                type="button"
                onClick={onDone}
                data-testid="success-modal-done"
                style={{
                  flex: "1 1 120px",
                  minWidth: "110px",
                  padding: "10px 18px",
                  backgroundColor: "#ffffff",
                  color: "#273b2d",
                  border: "1px solid #cad9cd",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#f3f8f4";
                  e.currentTarget.style.borderColor = "#b5c9b9";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#cad9cd";
                }}
              >
                {doneLabel || "Done"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalBackdrop;
  return createPortal(modalBackdrop, document.body);
}

