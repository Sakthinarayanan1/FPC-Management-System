import React, { useId, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Globe,
  Landmark,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { money, type RecordRow, type State } from "@/lib/store";
import type { Role } from "@/lib/config";

interface CompanyProfileViewProps {
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  role: Role;
  search: string;
  setToast: (msg: string) => void;
  log: (action: string, module: string, record: string, oldValue?: unknown, newValue?: unknown) => void;
}

export default function CompanyProfileView({
  state,
  setState,
  role,
  search,
  setToast,
  log,
}: CompanyProfileViewProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedCin, setCopiedCin] = useState(false);

  // Find the active FPC row
  const fpc = state.records.fpcs?.find((f) => f.id === "FPC-ODI-001") || state.records.fpcs?.[0];
  const fpcDetails = fpc?.details || {};
  const basic = fpcDetails.basic || {};
  const roc = fpcDetails.roc || {};
  const capital = fpcDetails.capital || {};
  const location = fpcDetails.location || {};

  // Find primary bank account
  const primaryBank =
    state.records.companyBankAccounts?.find((b) => b.isPrimary) ||
    state.records.companyBankAccounts?.[0] ||
    fpcDetails.bankAccounts?.[0];

  // Derive display values with robust fallbacks
  const legalName = basic.legalName || fpc?.name || "Green Valley Farmer Producer Company Ltd.";
  const fpcId = fpc?.fpcId || fpc?.id || "FPC-ODI-001";
  const cin = basic.cin || "U01100OD2021PTC035612";
  const pan = basic.pan || "AAACG1234F";
  const tan = basic.tan || "BBNG01234A";
  const gstin = basic.gstin || "21AAACG1234F1Z5";
  const registrationNumber = roc.registrationNumber || "035612";
  const rocOffice = roc.office || "ROC Cuttack, Odisha";
  const incorporationDate = roc.incorporationDate || "14 Jun 2021";
  const registeredAddress =
    roc.registeredAddress ||
    location.address ||
    "Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha 758001";
  const block = location.block || fpc?.block || "Keonjhar Sadar";
  const district = location.district || fpc?.district || "Keonjhar";
  const stateName = location.state || fpc?.state || "Odisha";
  const pin = location.pin || "758001";
  const contactEmail = basic.contactEmail || "office@greenvalleyfpc.in";
  const mobile = basic.mobile || "9437004412";

  const authorisedCap = Number(capital.authorisedCapital ?? capital.authorised ?? 1000000);
  const paidUpCap = Number(capital.paidUpCapital ?? capital.paidUp ?? 620000);
  const capitalRatio = authorisedCap > 0 ? ((paidUpCap / authorisedCap) * 100).toFixed(1) : "0.0";

  const bankName = primaryBank?.bankName || primaryBank?.bank || "State Bank of India";
  const branchName = primaryBank?.branchName || primaryBank?.branch || "Keonjhar";
  const rawAccountNumber = String(primaryBank?.accountNumber || "389201004821");
  const ifscCode = primaryBank?.ifscCode || primaryBank?.ifsc || "SBIN0001234";
  const accountType = primaryBank?.accountType || primaryBank?.type || "Current";

  // Permissions
  const isFpcAdmin = role === "FPC Admin / Manager";
  const canEdit = isFpcAdmin;
  const canViewSensitiveBank = isFpcAdmin || role === "Accountant / Finance Officer";

  const maskedAccount =
    rawAccountNumber.length > 4
      ? `XXXX-XXXX-${rawAccountNumber.slice(-4)}`
      : rawAccountNumber;

  // Directors list resolution & search filtering
  const rawDirectors =
    state.records.companyDirectors && state.records.companyDirectors.length > 0
      ? state.records.companyDirectors
      : (fpcDetails.directors && fpcDetails.directors.length > 0
          ? fpcDetails.directors
          : [
              { id: "BOD-001", name: "Sunita Behera", designation: "Chairperson", din: "01234567", appointmentDate: "14 Jun 2021", status: "Active" },
              { id: "BOD-002", name: "Bijay Kumar Mohanty", designation: "CEO", din: "12345678", appointmentDate: "14 Jun 2021", status: "Active" },
              { id: "BOD-003", name: "Ramesh Chandra Nayak", designation: "Director", din: "23456781", appointmentDate: "14 Jun 2021", status: "Active" },
              { id: "BOD-004", name: "Laxmi Patra", designation: "Director", din: "34567812", appointmentDate: "14 Jun 2021", status: "Active" },
              { id: "BOD-005", name: "Dillip Sahoo", designation: "Director", din: "45678123", appointmentDate: "14 Jun 2021", status: "Active" },
              { id: "BOD-006", name: "Kanchan Munda", designation: "Director", din: "56781234", appointmentDate: "14 Jun 2021", status: "Active" },
            ]);

  const filteredDirectors = rawDirectors.filter((d: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.designation && d.designation.toLowerCase().includes(q)) ||
      (d.din && d.din.toLowerCase().includes(q)) ||
      (d.dinPan && d.dinPan.toLowerCase().includes(q))
    );
  });

  const handleCopyCin = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cin);
      setCopiedCin(true);
      setTimeout(() => setCopiedCin(false), 2000);
      setToast("CIN copied to clipboard: " + cin);
    } else {
      setToast("CIN: " + cin);
    }
  };

  // Form State for editing
  const [formData, setFormData] = useState({
    legalName,
    cin,
    pan,
    tan,
    gstin,
    registrationNumber,
    rocOffice,
    incorporationDate,
    registeredAddress,
    block,
    district,
    stateName,
    pin,
    contactEmail,
    mobile,
    authorisedCapital: String(authorisedCap),
    paidUpCapital: String(paidUpCap),
    bankName,
    branchName,
    accountNumber: rawAccountNumber,
    accountType,
    ifscCode,
  });

  const [formError, setFormError] = useState("");

  const handleOpenEdit = () => {
    if (!canEdit) {
      setToast("Editing restricted: Only FPC Admin can modify company details");
      return;
    }
    setFormData({
      legalName,
      cin,
      pan,
      tan,
      gstin,
      registrationNumber,
      rocOffice,
      incorporationDate,
      registeredAddress,
      block,
      district,
      stateName,
      pin,
      contactEmail,
      mobile,
      authorisedCapital: String(authorisedCap),
      paidUpCapital: String(paidUpCap),
      bankName,
      branchName,
      accountNumber: rawAccountNumber,
      accountType,
      ifscCode,
    });
    setFormError("");
    setShowEditModal(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFpcAdmin) {
      setFormError("Unauthorized: Only FPC Admin can update company profile.");
      return;
    }

    // Validation
    if (!formData.legalName.trim()) {
      setFormError("Company name is required.");
      return;
    }
    if (!formData.cin.trim()) {
      setFormError("CIN is required.");
      return;
    }
    if (formData.cin.trim().length < 15) {
      setFormError("Please enter a valid CIN (e.g. U01100OD2021PTC035612).");
      return;
    }
    if (!formData.registeredAddress.trim()) {
      setFormError("Registered office address is required.");
      return;
    }

    const authNum = Number(formData.authorisedCapital);
    const paidNum = Number(formData.paidUpCapital);

    if (isNaN(authNum) || authNum <= 0) {
      setFormError("Authorised capital must be a positive number.");
      return;
    }
    if (isNaN(paidNum) || paidNum < 0) {
      setFormError("Paid-up capital must be a non-negative number.");
      return;
    }
    if (paidNum > authNum) {
      setFormError("Paid-up capital cannot exceed Authorised capital.");
      return;
    }

    if (formData.ifscCode.trim() && formData.ifscCode.trim().length !== 11) {
      setFormError("IFSC Code must be exactly 11 characters.");
      return;
    }

    if (formData.accountNumber.trim() && (formData.accountNumber.trim().length < 9 || formData.accountNumber.trim().length > 18)) {
      setFormError("Account number must be between 9 and 18 digits.");
      return;
    }

    // Save changes into state (persisted to localStorage automatically)
    setState((prev) => {
      const prevFpcs = prev.records?.fpcs || [];
      const targetId = fpc?.id || "FPC-ODI-001";

      const updatedFpcs = prevFpcs.map((item) => {
        if (item.id === targetId) {
          return {
            ...item,
            name: formData.legalName.trim(),
            details: {
              ...(item.details || {}),
              basic: {
                ...(item.details?.basic || {}),
                legalName: formData.legalName.trim(),
                cin: formData.cin.trim().toUpperCase(),
                pan: formData.pan.trim().toUpperCase(),
                tan: formData.tan.trim().toUpperCase(),
                gstin: formData.gstin.trim().toUpperCase(),
                contactEmail: formData.contactEmail.trim(),
                mobile: formData.mobile.trim(),
                logoName: "ual-baha-logo.png",
              },
              roc: {
                ...(item.details?.roc || {}),
                registeredAddress: formData.registeredAddress.trim(),
                office: formData.rocOffice.trim(),
                incorporationDate: formData.incorporationDate.trim(),
                registrationNumber: formData.registrationNumber.trim(),
              },
              location: {
                ...(item.details?.location || {}),
                address: formData.registeredAddress.trim(),
                block: formData.block.trim(),
                district: formData.district.trim(),
                state: formData.stateName.trim(),
                pin: formData.pin.trim(),
              },
              capital: {
                ...(item.details?.capital || {}),
                authorisedCapital: authNum,
                authorised: authNum,
                paidUpCapital: paidNum,
                paidUp: paidNum,
              },
              bankAccounts: [
                {
                  id: primaryBank?.id || "BANK-001",
                  bank: formData.bankName.trim(),
                  bankName: formData.bankName.trim(),
                  branch: formData.branchName.trim(),
                  branchName: formData.branchName.trim(),
                  accountNumber: formData.accountNumber.trim(),
                  accountType: formData.accountType,
                  ifsc: formData.ifscCode.trim().toUpperCase(),
                  ifscCode: formData.ifscCode.trim().toUpperCase(),
                  isPrimary: true,
                },
              ],
            },
          };
        }
        return item;
      });

      // Synchronize companyBankAccounts
      const prevBankAccounts = prev.records?.companyBankAccounts || [];
      const updatedBankAccounts = prevBankAccounts.map((b) => {
        if (b.isPrimary || b.id === (primaryBank?.id || "BANK-001")) {
          return {
            ...b,
            bankName: formData.bankName.trim(),
            branchName: formData.branchName.trim(),
            accountNumber: formData.accountNumber.trim(),
            accountType: formData.accountType as any,
            ifscCode: formData.ifscCode.trim().toUpperCase(),
          };
        }
        return b;
      });

      return {
        ...prev,
        records: {
          ...prev.records,
          fpcs: updatedFpcs,
          companyBankAccounts: updatedBankAccounts,
        },
      };
    });

    log("edited", "FPC profile", fpc?.id || "FPC-ODI-001", "Company Profile", {
      name: formData.legalName,
      cin: formData.cin,
      address: formData.registeredAddress,
    });

    setToast("Company profile updated successfully");
    setShowEditModal(false);
  };

  return (
    <div className="profile-grid" style={{ alignItems: "start" }}>
      {/* Left Card: Company Profile Card */}
      <section className="surface company-profile" style={{ display: "flex", flexDirection: "column" }}>
        {/* Banner with Official Logo, Company Name, and Edit Profile Button */}
        <div
          className="profile-banner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "20px 24px",
            background: "#f4f8f4",
            borderBottom: "1px solid #dce8dd",
            position: "relative",
          }}
        >
          {/* Official Company Logo */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "12px",
              background: "#ffffff",
              border: "1px solid #c8d9ca",
              padding: "4px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <img
              src="/ual-baha-logo.png"
              alt="Ujal Baha / Green Valley FPC Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* Company Name & Metadata */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "#3d6347",
                  background: "#e4efe5",
                  padding: "2px 7px",
                  borderRadius: "4px",
                }}
              >
                FARMER PRODUCER COMPANY
              </span>
              <span className="status-chip green" style={{ fontSize: "9px", padding: "2px 6px" }}>
                <i /> Active
              </span>
            </div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#183020",
                margin: "2px 0 4px",
                lineHeight: 1.25,
                wordBreak: "break-word",
              }}
            >
              {legalName}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: "#617366", flexWrap: "wrap" }}>
              <span className="mono" style={{ fontWeight: 600, color: "#2c4533" }}>{fpcId}</span>
              <span>•</span>
              <span>Active since {incorporationDate}</span>
            </div>
          </div>

          {/* Edit Profile Action */}
          <div style={{ flexShrink: 0 }}>
            {canEdit ? (
              <button
                type="button"
                className="btn-outline"
                onClick={handleOpenEdit}
                title="Edit company profile information"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#1b5e20",
                  borderColor: "#3d7348",
                  background: "#ffffff",
                }}
              >
                <Edit3 size={13} /> Edit profile
              </button>
            ) : (
              <span
                className="status-chip slate"
                title="Profile editing is reserved for FPC Admin"
                style={{ fontSize: "10px", padding: "5px 9px", display: "inline-flex", alignItems: "center", gap: "5px" }}
              >
                <ShieldCheck size={12} /> Read-only
              </span>
            )}
          </div>
        </div>

        {/* Structured Company Details Grid */}
        <div
          className="company-details"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px 24px",
            padding: "24px",
          }}
        >
          {/* Registered Office */}
          <div style={{ gridColumn: "1 / -1" }}>
            <small style={{ fontSize: "9px", letterSpacing: "0.8px", color: "#748679", fontWeight: 700, textTransform: "uppercase" }}>
              REGISTERED OFFICE & JURISDICTION
            </small>
            <b style={{ fontSize: "12px", color: "#1e3325", marginTop: "4px", display: "block" }}>
              {registeredAddress}
            </b>
            <span style={{ fontSize: "10px", color: "#5d6f62", marginTop: "2px", display: "block" }}>
              {block}, Dist. {district}, {stateName} – {pin} • ROC Jurisdiction: {rocOffice}
            </span>
          </div>

          {/* CIN */}
          <div>
            <small style={{ fontSize: "9px", letterSpacing: "0.8px", color: "#748679", fontWeight: 700, textTransform: "uppercase" }}>
              CORPORATE IDENTIFICATION NUMBER (CIN)
            </small>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <b className="mono" style={{ fontSize: "12px", color: "#1b3323", fontWeight: 700 }}>
                {cin}
              </b>
              <button
                type="button"
                onClick={handleCopyCin}
                title="Copy CIN"
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#4e7756",
                  cursor: "pointer",
                  padding: "2px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {copiedCin ? <Check size={12} style={{ color: "#2e7d32" }} /> : <Copy size={12} />}
              </button>
            </div>
            <span style={{ fontSize: "10px", color: "#6c7d71", marginTop: "2px", display: "block" }}>
              Reg. No: <strong>{registrationNumber}</strong>
            </span>
          </div>

          {/* PAN, TAN & GSTIN */}
          <div>
            <small style={{ fontSize: "9px", letterSpacing: "0.8px", color: "#748679", fontWeight: 700, textTransform: "uppercase" }}>
              TAX IDENTIFIERS
            </small>
            <b style={{ fontSize: "11px", color: "#1e3325", marginTop: "4px", display: "block" }}>
              PAN: <span className="mono">{pan}</span> • TAN: <span className="mono">{tan}</span>
            </b>
            <span style={{ fontSize: "10px", color: "#6c7d71", marginTop: "2px", display: "block" }}>
              GSTIN: <strong className="mono">{gstin}</strong>
            </span>
          </div>

          {/* Primary Bank */}
          <div>
            <small style={{ fontSize: "9px", letterSpacing: "0.8px", color: "#748679", fontWeight: 700, textTransform: "uppercase" }}>
              PRIMARY SETTLEMENT BANK
            </small>
            <b style={{ fontSize: "12px", color: "#1e3325", marginTop: "4px", display: "block" }}>
              {bankName} • {branchName}
            </b>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", fontSize: "10px", color: "#6c7d71" }}>
              <span>A/C: <strong className="mono">{showFullAccount && canViewSensitiveBank ? rawAccountNumber : maskedAccount}</strong></span>
              {canViewSensitiveBank && (
                <button
                  type="button"
                  onClick={() => setShowFullAccount(!showFullAccount)}
                  title={showFullAccount ? "Mask account" : "Reveal account"}
                  style={{ border: 0, background: "none", color: "#5f7365", cursor: "pointer", padding: 0 }}
                >
                  {showFullAccount ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              )}
              <span>•</span>
              <span>IFSC: <strong className="mono">{ifscCode}</strong></span>
            </div>
          </div>

          {/* Capital Structure */}
          <div>
            <small style={{ fontSize: "9px", letterSpacing: "0.8px", color: "#748679", fontWeight: 700, textTransform: "uppercase" }}>
              SHARE CAPITAL STRUCTURE
            </small>
            <b style={{ fontSize: "12px", color: "#1e3325", marginTop: "4px", display: "block" }}>
              Paid-up: {money(paidUpCap)}
            </b>
            <span style={{ fontSize: "10px", color: "#6c7d71", marginTop: "2px", display: "block" }}>
              Authorised: <strong>{money(authorisedCap)}</strong> (Ratio: {capitalRatio}%)
            </span>
          </div>

          {/* Official Contact */}
          <div>
            <small style={{ fontSize: "9px", letterSpacing: "0.8px", color: "#748679", fontWeight: 700, textTransform: "uppercase" }}>
              OFFICIAL CONTACT
            </small>
            <b style={{ fontSize: "11px", color: "#1e3325", marginTop: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Mail size={12} style={{ color: "#42764d" }} />
              <a href={`mailto:${contactEmail}`} style={{ color: "#1b5e20", textDecoration: "none" }}>
                {contactEmail}
              </a>
            </b>
            <span style={{ fontSize: "10px", color: "#6c7d71", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px" }}>
              <Phone size={11} style={{ color: "#42764d" }} />
              <span>+91 {mobile}</span>
            </span>
          </div>

          {/* Incorporation & Class */}
          <div>
            <small style={{ fontSize: "9px", letterSpacing: "0.8px", color: "#748679", fontWeight: 700, textTransform: "uppercase" }}>
              INCORPORATION & ENTITY CLASS
            </small>
            <b style={{ fontSize: "11px", color: "#1e3325", marginTop: "4px", display: "block" }}>
              Private Limited Producer Company
            </b>
            <span style={{ fontSize: "10px", color: "#6c7d71", marginTop: "2px", display: "block" }}>
              Incorporated on {incorporationDate}
            </span>
          </div>
        </div>
      </section>

      {/* Right Card: Board of Directors Card */}
      <section className="surface" style={{ display: "flex", flexDirection: "column" }}>
        <div className="panel-head" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #edf2ed" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1a3222", margin: 0 }}>
              Board of Directors
            </h2>
            <p style={{ fontSize: "10px", color: "#708174", margin: "2px 0 0" }}>
              {filteredDirectors.length} of {rawDirectors.length} directors on official record
            </p>
          </div>
        </div>

        <div style={{ padding: "6px 16px 16px", flex: 1 }}>
          {filteredDirectors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "#7a8a7f" }}>
              <p style={{ fontSize: "11px", margin: 0 }}>No directors match your search query.</p>
            </div>
          ) : (
            filteredDirectors.map((d: any, i: number) => {
              const dinValue = d.din || d.dinPan || "—";
              const initials = (d.name || "Director")
                .split(" ")
                .filter(Boolean)
                .map((x: string) => x[0])
                .slice(0, 2)
                .join("");

              return (
                <div
                  className="director-line"
                  key={d.id || d.name || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "11px 0",
                    borderTop: i === 0 ? "none" : "1px solid #f0f4f0",
                  }}
                >
                  <span
                    className="avatar"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: i === 0 ? "#1b5e20" : "#e2ede3",
                      color: i === 0 ? "#ffffff" : "#244e2c",
                      fontWeight: 700,
                      fontSize: "10px",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ fontSize: "11px", color: "#1d3324" }}>{d.name}</strong>
                      {d.designation && (
                        <span
                          style={{
                            fontSize: "9px",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            background: d.designation.toLowerCase().includes("chair")
                              ? "#fdf3e7"
                              : d.designation.toLowerCase().includes("ceo")
                              ? "#eef4fa"
                              : "#edf5ed",
                            color: d.designation.toLowerCase().includes("chair")
                              ? "#9c6014"
                              : d.designation.toLowerCase().includes("ceo")
                              ? "#2b5687"
                              : "#31693c",
                            fontWeight: 600,
                          }}
                        >
                          {d.designation}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", fontSize: "9px", color: "#748577" }}>
                      <span>DIN: <span className="mono" style={{ fontWeight: 600 }}>{dinValue}</span></span>
                      {d.appointmentDate && <span>• Appointed: {d.appointmentDate}</span>}
                    </div>
                  </div>
                  <span className="status-chip green" style={{ fontSize: "8px", padding: "2px 5px", flexShrink: 0 }}>
                    <i /> Active
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Edit Profile Modal for FPC Admin */}
      {showEditModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowEditModal(false)}
          style={{ zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "780px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="modal-head" style={{ padding: "16px 20px", borderBottom: "1px solid #e1ebe2" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#1c3222" }}>
                  Edit Company Profile
                </h2>
                <p style={{ fontSize: "10px", color: "#6a7d70", margin: "2px 0 0" }}>
                  Update official corporate identity, statutory identifiers, capital, and primary bank details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ border: 0, background: "none", color: "#617366", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}
            >
              <div
                className="modal-content"
                style={{
                  overflowY: "auto",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  flex: 1,
                }}
              >
                {formError && (
                  <div
                    style={{
                      background: "#fef1f0",
                      border: "1px solid #f8c9c6",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      color: "#b72f23",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Legal Identity */}
                <div style={{ background: "#f9fbf9", border: "1px solid #e2ebe3", borderRadius: "10px", padding: "14px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#25422d", display: "block", marginBottom: "10px" }}>
                    1. Company Legal Identity & Incorporation
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ gridColumn: "1 / -1", display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Company Legal Name *
                      <input
                        type="text"
                        required
                        value={formData.legalName}
                        onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                        placeholder="e.g. Green Valley Farmer Producer Company Ltd."
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Date of Incorporation *
                      <input
                        type="text"
                        required
                        value={formData.incorporationDate}
                        onChange={(e) => setFormData({ ...formData, incorporationDate: e.target.value })}
                        placeholder="DD/MM/YYYY or 14 Jun 2021"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Registrar of Companies (ROC) *
                      <input
                        type="text"
                        required
                        value={formData.rocOffice}
                        onChange={(e) => setFormData({ ...formData, rocOffice: e.target.value })}
                        placeholder="e.g. ROC Cuttack, Odisha"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 2: Statutory Identifiers */}
                <div style={{ background: "#f9fbf9", border: "1px solid #e2ebe3", borderRadius: "10px", padding: "14px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#25422d", display: "block", marginBottom: "10px" }}>
                    2. Statutory & Tax Registration Numbers
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Corporate Identity Number (CIN) *
                      <input
                        type="text"
                        required
                        value={formData.cin}
                        onChange={(e) => setFormData({ ...formData, cin: e.target.value.toUpperCase() })}
                        placeholder="21-digit CIN"
                        maxLength={21}
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Registration Number
                      <input
                        type="text"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        placeholder="e.g. 035612"
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Permanent Account Number (PAN)
                      <input
                        type="text"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                        placeholder="10-digit PAN"
                        maxLength={10}
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Tax Deduction Account Number (TAN)
                      <input
                        type="text"
                        value={formData.tan}
                        onChange={(e) => setFormData({ ...formData, tan: e.target.value.toUpperCase() })}
                        placeholder="10-digit TAN"
                        maxLength={10}
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ gridColumn: "1 / -1", display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Goods & Services Tax (GSTIN)
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        placeholder="15-character GSTIN"
                        maxLength={15}
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Registered Office & Contact */}
                <div style={{ background: "#f9fbf9", border: "1px solid #e2ebe3", borderRadius: "10px", padding: "14px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#25422d", display: "block", marginBottom: "10px" }}>
                    3. Registered Office & Communication
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ gridColumn: "1 / -1", display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Registered Office Address *
                      <input
                        type="text"
                        required
                        value={formData.registeredAddress}
                        onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                        placeholder="Full registered office address"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Block
                      <input
                        type="text"
                        value={formData.block}
                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                        placeholder="e.g. Keonjhar Sadar"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      District
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        placeholder="e.g. Keonjhar"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      State
                      <input
                        type="text"
                        value={formData.stateName}
                        onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                        placeholder="e.g. Odisha"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      PIN Code
                      <input
                        type="text"
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })}
                        placeholder="e.g. 758001"
                        maxLength={6}
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Official Email
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="e.g. office@greenvalleyfpc.in"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Contact Mobile
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 4: Capital Structure */}
                <div style={{ background: "#f9fbf9", border: "1px solid #e2ebe3", borderRadius: "10px", padding: "14px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#25422d", display: "block", marginBottom: "10px" }}>
                    4. Capital Structure (INR)
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Authorised Share Capital (₹) *
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.authorisedCapital}
                        onChange={(e) => setFormData({ ...formData, authorisedCapital: e.target.value })}
                        placeholder="e.g. 1000000"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Paid-up Share Capital (₹) *
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.paidUpCapital}
                        onChange={(e) => setFormData({ ...formData, paidUpCapital: e.target.value })}
                        placeholder="e.g. 620000"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>
                  </div>
                </div>

                {/* Section 5: Primary Bank Account */}
                <div style={{ background: "#f9fbf9", border: "1px solid #e2ebe3", borderRadius: "10px", padding: "14px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#25422d", display: "block", marginBottom: "10px" }}>
                    5. Primary Company Settlement Bank
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Bank Name *
                      <input
                        type="text"
                        required
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Branch Name *
                      <input
                        type="text"
                        required
                        value={formData.branchName}
                        onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                        placeholder="e.g. Keonjhar"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Account Number *
                      <input
                        type="text"
                        required
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, "") })}
                        placeholder="9 to 18 digits"
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>

                    <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      Account Type *
                      <select
                        value={formData.accountType}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      >
                        <option value="Current">Current</option>
                        <option value="Savings">Savings</option>
                        <option value="Cash Credit">Cash Credit</option>
                        <option value="Overdraft">Overdraft</option>
                      </select>
                    </label>

                    <label style={{ gridColumn: "1 / -1", display: "block", fontSize: "10px", fontWeight: 600, color: "#324939" }}>
                      IFSC Code *
                      <input
                        type="text"
                        required
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. SBIN0001234"
                        maxLength={11}
                        className="mono"
                        style={{ width: "100%", marginTop: "4px", padding: "7px 10px", fontSize: "12px" }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div
                className="modal-buttons"
                style={{
                  padding: "16px 20px",
                  borderTop: "1px solid #e1ebe2",
                  background: "#ffffff",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: "8px 16px", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "8px 18px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Check size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

