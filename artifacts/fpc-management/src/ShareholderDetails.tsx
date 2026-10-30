import { useState } from "react";
import {
  ArrowLeft, Check, CheckCircle2, Clock, Download, Eye, EyeOff, FileText, HandCoins,
  Landmark, MapPin, Printer, ShieldCheck, User, Users, X
} from "lucide-react";
import {
  money, type RecordRow, type State, type SharePurchaseRecord,
  initialSharePurchases, formatDateTime, isCertificateEligible, getRemainingTimeText
} from "@/lib/store";
import { Certificate, mask } from "./EnhancedModules";
import SharePurchaseReceipt from "./SharePurchaseReceipt";

type ShareholderDetailsProps = {
  shareholderId: string;
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  role: string;
  setToast: (s: string) => void;
  go: (route: string) => void;
};

const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const stamp = () => new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const notice = (title: string) => ({ id: `NT-${Date.now()}`, title, date: "Just now", status: "Unread", fpcId: "FPC-ODI-001" });
const audit = (s: State, role: string, action: string, module: string, id: string, before?: unknown, after?: unknown) => [
  { id: `AUD-${Date.now()}`, actor: role || "FPC Admin", role, action, module, record: id, oldValue: before ? JSON.stringify(before) : "", newValue: after ? JSON.stringify(after) : "", date: stamp(), fpcId: "FPC-ODI-001" },
  ...(s.audit || [])
];

export default function ShareholderDetails({
  shareholderId,
  state,
  setState,
  role,
  setToast,
  go
}: ShareholderDetailsProps) {
  const [showMobile, setShowMobile] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [previewCert, setPreviewCert] = useState<RecordRow | null>(null);
  const [sharesModal, setSharesModal] = useState(false);
  const [shareCount, setShareCount] = useState("10");
  const [paymentMode, setPaymentMode] = useState("Bank transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [activeReceipt, setActiveReceipt] = useState<SharePurchaseRecord | null>(null);
  const [pendingCertNotice, setPendingCertNotice] = useState<SharePurchaseRecord | null>(null);
  const [accelerateTime, setAccelerateTime] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<"receipts" | "certificates">("receipts");

  const shareholders: RecordRow[] = Array.isArray(state.records?.shareholders) ? state.records.shareholders : [];
  const certificates: RecordRow[] = state.certificates || [];
  const shareRequests: RecordRow[] = Array.isArray(state.records?.shareRequests) ? state.records.shareRequests : [];

  const member = shareholders.find(x => x.id === shareholderId);
  const cert = certificates.find(c => c.uniqueId === shareholderId || c.certificate === member?.certificate || c.folio === member?.folio);

  const isAdmin = role === "FPC Admin / Manager" || role === "TSF Central Admin";

  if (!member) {
    return (
      <section className="em" style={{ padding: "10px 0" }}>
        <div className="em-head">
          <div>
            <span className="em-kicker">SHAREHOLDER REGISTER</span>
            <h2>Shareholder Not Found</h2>
            <p>No shareholder record matches identifier <code>{shareholderId}</code> in this cooperative workspace.</p>
          </div>
          <div className="em-actions">
            <button type="button" className="em-btn primary" onClick={() => go("/shareholders")}>
              <ArrowLeft size={14} /> Back to All Shareholders
            </button>
          </div>
        </div>
      </section>
    );
  }

  const memberCert: RecordRow = cert || {
    id: member.certificate || `SC-${member.id}`,
    certificate: member.certificate || `SC-${member.id}`,
    folio: member.folio || "FL-001",
    uniqueId: member.id,
    name: member.name,
    farmerId: member.farmerId,
    shares: member.shares,
    faceValue: member.faceValue || 100,
    capital: member.capital || Number(member.shares) * 100,
    distinctiveFrom: member.distinctiveFrom || 1,
    distinctiveTo: member.distinctiveTo || member.shares,
    allotted: member.allotmentDate || member.admitted || "02 Aug 2021",
    status: member.status === "Active" ? "Issued" : "Pending",
    address: member.address || `${member.village || "Green Valley"}, Keonjhar, Odisha`,
    fpcId: "FPC-ODI-001"
  };

  const name = String(member.name || "Shareholder");
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "SH";

  const memberRequests = shareRequests.filter(r => r.memberId === member.id);

  const pendingShares = memberRequests.filter(r => r.status === "Submitted").reduce((a, r) => a + Number(r.shares || 0), 0);
  const currentShares = Number(member.shares || memberCert.shares || 0);
  const nominalValue = Number(member.faceValue || memberCert.faceValue || 100);
  const totalAmountPaid = Number(member.capital ?? memberCert.capital ?? (currentShares * nominalValue));

  // 1. Share purchase receipts mapped strictly to member.id
  const allPurchases = (Array.isArray(state.records?.sharePurchases) && state.records.sharePurchases.length > 0)
    ? (state.records.sharePurchases as unknown as SharePurchaseRecord[])
    : ((initialSharePurchases || []) as unknown as SharePurchaseRecord[]);

  const memberPurchases = allPurchases.filter(p => p.shareholderId === member.id);

  const syntheticInitialPurchase: SharePurchaseRecord = {
    id: `PUR-SH-${member.id.replace(/\D/g, "").padStart(4, "0")}`,
    receiptNumber: `RCP-SH-${member.id.replace(/\D/g, "").padStart(4, "0")}`,
    shareholderId: member.id,
    shareholderName: member.name,
    farmerId: member.farmerId,
    folio: member.folio || memberCert.folio || "FL-001",
    folioNumber: member.folio || memberCert.folio || "FL-001",
    purchaseType: "Initial Allotment",
    sharesPurchased: Number(member.shares || 10),
    shares: Number(member.shares || 10),
    faceValue: nominalValue,
    totalAmount: totalAmountPaid,
    paymentMode: member.payment || "Bank transfer",
    paymentReference: `UTIB202108${member.id.replace(/\D/g, "").padStart(4, "0")}`,
    paymentStatus: "Confirmed",
    purchaseConfirmedAt: "2021-08-02T10:00:00.000Z",
    purchaseConfirmedAtFormatted: `${member.allotmentDate || member.admitted || "02 Aug 2021"} · 10:00`,
    certificateEligibleAt: "2021-08-04T10:00:00.000Z",
    certificateEligibleAtFormatted: "04 Aug 2021 · 10:00",
    certificateId: memberCert.certificate || memberCert.id,
    distinctiveFrom: Number(memberCert.distinctiveFrom || 1),
    distinctiveTo: Number(memberCert.distinctiveTo || member.shares),
    address: member.address || [member.village, member.block, "Keonjhar, Odisha"].filter(Boolean).join(", "),
    fpcId: "FPC-ODI-001",
    notes: "Initial statutory Table-B allotment record."
  };

  const effectivePurchases: SharePurchaseRecord[] = memberPurchases.length > 0
    ? memberPurchases
    : (member.status === "Active" ? [syntheticInitialPurchase] : []);

  const latestPurchase = effectivePurchases[0] || null;

  // 2. Share certificates mapped strictly to member.id
  const memberCertificates = certificates.filter(
    c => c.uniqueId === member.id || c.certificate === member.certificate
  );
  const effectiveCertificates = memberCertificates.length > 0
    ? memberCertificates
    : (member.status === "Active" ? [memberCert] : []);

  // Certificate eligibility verification
  const handleViewCertificate = (purchaseRecord?: SharePurchaseRecord | RecordRow) => {
    const targetPurchase = (purchaseRecord && "certificateEligibleAt" in purchaseRecord)
      ? (purchaseRecord as SharePurchaseRecord)
      : latestPurchase;

    const eligible = targetPurchase ? isCertificateEligible(targetPurchase, accelerateTime ? 48 : 0) : true;
    if (!eligible && targetPurchase) {
      setPendingCertNotice(targetPurchase);
    } else {
      const certIdToFind = targetPurchase?.certificateId || memberCert.certificate || memberCert.id;
      const targetCert = certificates.find(c => c.certificate === certIdToFind || c.id === certIdToFind) || memberCert;
      setPreviewCert(targetCert);
    }
  };

  // Scenario B: Handle Additional Share Purchase
  const handleConfirmPurchase = () => {
    const amount = Number(shareCount);
    if (!Number.isInteger(amount) || amount < 1 || currentShares + amount > 500) {
      setToast(`Additional shares must be whole shares; max holding limit is 500. Available: ${Math.max(0, 500 - currentShares)}.`);
      return;
    }

    const from = certificates.reduce((m, c) => Math.max(m, Number(c.distinctiveTo) || 0), 6000) + 1;
    const to = from + amount - 1;
    const now = new Date();
    const confirmedAt = now.toISOString();
    const eligibleAtDate = new Date(now.getTime() + 48 * 3600 * 1000);
    const eligibleAt = eligibleAtDate.toISOString();

    const purId = `PUR-SH-${Date.now().toString().slice(-6)}`;
    const rcpId = `RCP-SH-${Date.now().toString().slice(-6)}`;
    const certId = `SC-${Date.now().toString().slice(-6)}`;
    const refCode = paymentRef.trim() || `TXN-${Date.now().toString().slice(-6)}`;

    const newPurchase: SharePurchaseRecord = {
      id: purId,
      receiptNumber: rcpId,
      shareholderId: member.id,
      shareholderName: member.name,
      farmerId: member.farmerId,
      folio: member.folio || memberCert.folio || "FL-001",
      folioNumber: member.folio || memberCert.folio || "FL-001",
      purchaseType: "Additional Shares",
      sharesPurchased: amount,
      shares: amount,
      faceValue: nominalValue,
      totalAmount: amount * nominalValue,
      paymentMode: paymentMode,
      paymentReference: refCode,
      paymentStatus: "Confirmed",
      purchaseConfirmedAt: confirmedAt,
      purchaseConfirmedAtFormatted: formatDateTime(confirmedAt),
      certificateEligibleAt: eligibleAt,
      certificateEligibleAtFormatted: formatDateTime(eligibleAt),
      certificateId: certId,
      distinctiveFrom: from,
      distinctiveTo: to,
      address: member.address || [member.village, member.block, "Keonjhar, Odisha"].filter(Boolean).join(", "),
      mobile: member.mobile,
      fpcId: "FPC-ODI-001",
      notes: "Additional share subscription purchased via shareholder portal."
    };

    const newCertRecord: RecordRow = {
      id: certId,
      certificate: certId,
      folio: member.folio || memberCert.folio || "FL-001",
      uniqueId: member.id,
      name: member.name,
      farmerId: member.farmerId,
      shares: amount,
      faceValue: nominalValue,
      capital: amount * nominalValue,
      distinctiveFrom: from,
      distinctiveTo: to,
      allotted: today(),
      status: "Pending", // 48h pending
      certificateEligibleAt: eligibleAt,
      type: "Additional allotment",
      address: member.address,
      village: member.village,
      block: member.block,
      aadhaar: member.aadhaar,
      account: member.account,
      fpcId: "FPC-ODI-001"
    };

    const updatedMember = {
      ...member,
      shares: currentShares + amount,
      capital: totalAmountPaid + (amount * nominalValue),
      distinctiveTo: to
    };

    setState(st => ({
      ...st,
      records: {
        ...(st.records || {}),
        shareholders: (st.records?.shareholders || []).map((x: RecordRow) => x.id === member.id ? updatedMember : x),
        sharePurchases: [newPurchase as unknown as RecordRow, ...((st.records?.sharePurchases || []) as RecordRow[])]
      },
      certificates: [newCertRecord, ...(st.certificates || [])],
      audit: audit(st, role, "purchased additional shares and confirmed payment", "Shareholders", member.id, member, updatedMember),
      notifications: [notice(`${amount} additional shares purchased by ${member.name} · Receipt ${rcpId} generated`), ...(st.notifications || [])]
    }));

    setSharesModal(false);
    setActiveReceipt(newPurchase);
    setToast(`Payment confirmed! Share purchase receipt ${rcpId} generated immediately. Share certificate pending (available after 48h).`);
  };

  const handleApproveMember = () => {
    if (!isAdmin) {
      setToast("Only FPC Admin can approve shareholder registrations.");
      return;
    }
    const updatedCert = { ...memberCert, status: "Issued" };
    setState(st => ({
      ...st,
      records: {
        ...(st.records || {}),
        shareholders: (st.records?.shareholders || []).map((x: RecordRow) => x.id === member.id ? { ...x, status: "Active" } : x)
      },
      certificates: (st.certificates || []).some(c => c.uniqueId === member.id)
        ? (st.certificates || []).map(c => c.uniqueId === member.id ? updatedCert : c)
        : [updatedCert, ...(st.certificates || [])],
      audit: audit(st, role, "approved shareholder membership", "Shareholders", member.id, member.status, "Active"),
      notifications: [notice(`${member.name} shareholder membership approved`), ...(st.notifications || [])]
    }));
    setToast(`${member.id} membership approved and share certificate activated.`);
  };

  return (
    <section className="em sh-details-page">
      {/* Page Header and Action Toolbar */}
      <div className="em-head">
        <div>
          <span className="em-kicker">SHAREHOLDER MANAGEMENT · STATUTORY REGISTER (TABLE-B)</span>
          <h2>{name}</h2>
          <p>Official shareholder details, statutory allotment parameters, distinctive share registers, and documents.</p>
        </div>
        <div className="sh-details-actions">
          <button type="button" className="em-btn" data-testid="sh-back-btn" onClick={() => go("/shareholders")}>
            <ArrowLeft size={14} /> Back to All Shareholders
          </button>
          <button
            type="button"
            className="em-btn"
            data-testid="sh-view-receipt-btn"
            onClick={() => latestPurchase ? setActiveReceipt(latestPurchase) : setToast("No receipts on record for this shareholder.")}
            style={{ borderColor: "#286442", color: "#1b5e20", fontWeight: 600 }}
          >
            <FileText size={14} /> View Latest Receipt
          </button>
          <button
            type="button"
            className="em-btn"
            data-testid="sh-view-cert-btn"
            onClick={() => handleViewCertificate(latestPurchase)}
          >
            <ShieldCheck size={14} /> View Certificate
          </button>
          <button type="button" className="em-btn primary" data-testid="sh-request-shares-btn" onClick={() => setSharesModal(true)}>
            <HandCoins size={14} /> Request Additional Shares
          </button>
          {member.status === "Submitted" && isAdmin && (
            <button type="button" className="em-btn primary" data-testid="sh-approve-member-btn" onClick={handleApproveMember} style={{ background: "#286442" }}>
              <Check size={14} /> Approve Membership
            </button>
          )}
          <button
            type="button"
            className="em-btn"
            style={{
              background: accelerateTime ? "#e6f4ea" : "#f5fbf6",
              color: accelerateTime ? "#137333" : "#2d5e3c",
              borderColor: accelerateTime ? "#34a853" : "#bed4c2",
              fontSize: 11,
              fontWeight: 700
            }}
            title="Fast-forward 48 hours to test certificate availability after payment confirmation"
            onClick={() => setAccelerateTime(!accelerateTime)}
          >
            ⚡ 48h Demo: {accelerateTime ? "+48h (Active)" : "Real-time"}
          </button>
          <button type="button" className="em-btn" data-testid="sh-print-btn" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="sh-details-hero">
        <div className="sh-hero-main">
          <div className="sh-avatar">{initials}</div>
          <div className="sh-hero-info">
            <div className="sh-hero-title-row">
              <h2>{name}</h2>
              <span className={`em-status ${member.status === "Active" ? "" : "pending"}`}>
                <Check size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                {member.status || "Active"}
              </span>
              <span className="sh-meta-pill em-mono" title="Folio Number">
                Folio: {member.folio || memberCert.folio || "FL-001"}
              </span>
              <span className="sh-meta-pill" style={{ background: "#eef4fa", color: "#285b84", borderColor: "#d1e1f0" }}>
                {member.classOfSecurity || memberCert.classOfSecurity || "Equity Shares"}
              </span>
              {latestPurchase && (
                <span
                  className={`sh-meta-pill ${isCertificateEligible(latestPurchase, accelerateTime ? 48 : 0) ? "" : "pending"}`}
                  style={{
                    background: isCertificateEligible(latestPurchase, accelerateTime ? 48 : 0) ? "#edf7ed" : "#fff8e6",
                    color: isCertificateEligible(latestPurchase, accelerateTime ? 48 : 0) ? "#1e4620" : "#8c5600",
                    borderColor: isCertificateEligible(latestPurchase, accelerateTime ? 48 : 0) ? "#c8e6c9" : "#fae29f"
                  }}
                >
                  <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                  {isCertificateEligible(latestPurchase, accelerateTime ? 48 : 0)
                    ? "Certificate Available"
                    : `Certificate Pending (${getRemainingTimeText(latestPurchase, accelerateTime ? 48 : 0)})`}
                </span>
              )}
            </div>
            <div className="sh-hero-meta">
              <span><b>Shareholder ID:</b> <code className="em-mono">{member.id}</code></span>
              <span>•</span>
              <span><b>Allotment Date:</b> {member.allotmentDate || member.admitted || memberCert.allotted || "Not recorded"}</span>
              <span>•</span>
              <span>
                <MapPin size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                {member.address || [member.village, member.block, "Keonjhar, Odisha"].filter(Boolean).join(", ") || "Keonjhar, Odisha"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="em-stats">
        <div className="em-stat">
          <small>Shares Allotted</small>
          <b>{currentShares.toLocaleString()}</b>
          <span>Face value {money(nominalValue)} per share</span>
        </div>
        <div className="em-stat">
          <small>Total Amount Paid</small>
          <b style={{ color: "#166534" }}>{money(totalAmountPaid)}</b>
          <span>Fully paid-up equity capital</span>
        </div>
        <div className="em-stat">
          <small>Distinctive Numbers</small>
          <b className="em-mono" style={{ fontSize: 16 }}>{memberCert.distinctiveFrom} – {memberCert.distinctiveTo}</b>
          <span>Range of {currentShares} distinctive shares</span>
        </div>
        <div className="em-stat">
          <small>Folio &amp; Certificate</small>
          <b className="em-mono" style={{ fontSize: 16 }}>{member.folio || memberCert.folio || "FL-001"}</b>
          <span>Certificate {memberCert.certificate || memberCert.id}</span>
        </div>
      </div>

      {/* Section A — Shareholder Information */}
      <div className="em-panel pad">
        <div className="em-panel-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <User size={15} color="#2d653f" /> Section A — Shareholder Information
            </h3>
            <p>Official legal identity and demographic classification on the cooperative register</p>
          </div>
        </div>
        <div className="em-grid cols3">
          <div className="em-field">
            <label>Shareholder ID</label>
            <div className="em-readonly em-mono" style={{ fontWeight: 600 }}>{member.id}</div>
          </div>
          <div className="em-field">
            <label>Full Legal Name</label>
            <div className="em-readonly" style={{ fontWeight: 600, color: "#1a3324" }}>{member.name}</div>
          </div>
          <div className="em-field">
            <label>Linked Farmer ID</label>
            <div className="em-readonly">
              {member.farmerId ? (
                <button
                  type="button"
                  onClick={() => go(`/farmers/${member.farmerId}`)}
                  style={{ background: "none", border: 0, padding: 0, color: "#1b5e20", textDecoration: "underline", cursor: "pointer", fontWeight: 600, fontFamily: "monospace" }}
                  title="View linked farmer profile"
                >
                  {member.farmerId} →
                </button>
              ) : (
                <span style={{ color: "#8a968d" }}>Not linked</span>
              )}
            </div>
          </div>
          <div className="em-field">
            <label>Social Category</label>
            <div className="em-readonly">{member.category || "General"}</div>
          </div>
          <div className="em-field">
            <label>Gender</label>
            <div className="em-readonly">{member.gender || "Not specified"}</div>
          </div>
          <div className="em-field">
            <label>Membership Status</label>
            <div className="em-readonly">
              <span className={`em-status ${member.status === "Active" ? "" : "pending"}`}>
                {member.status || "Active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Address and Contact Details */}
      <div className="em-panel pad">
        <div className="em-panel-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <MapPin size={15} color="#2d653f" /> Address &amp; Contact Details
            </h3>
            <p>Recorded residential address and privacy-protected contact information</p>
          </div>
        </div>
        <div className="em-grid cols3">
          <div className="em-field em-wide">
            <label>Address of the Allottee</label>
            <div className="em-readonly" style={{ lineHeight: 1.4 }}>
              {member.address || [member.village, member.panchayat, member.block, "Keonjhar, Odisha"].filter(Boolean).join(", ") || "Keonjhar, Odisha"}
            </div>
          </div>
          <div className="em-field">
            <label>Village / Panchayat</label>
            <div className="em-readonly">{member.village || "Green Valley"} {member.panchayat ? `· ${member.panchayat}` : ""}</div>
          </div>
          <div className="em-field">
            <label>Block / District</label>
            <div className="em-readonly">{member.block || "Keonjhar Sadar"}, Keonjhar</div>
          </div>
          <div className="em-field">
            <label>State &amp; PIN</label>
            <div className="em-readonly">Odisha · {member.pin || "758001"}</div>
          </div>
          <div className="em-field">
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Mobile Number</span>
              <button
                type="button"
                className="sh-mask-btn"
                onClick={() => setShowMobile(!showMobile)}
                title={showMobile ? "Mask mobile number" : "Reveal full mobile number"}
              >
                {showMobile ? <EyeOff size={12} /> : <Eye size={12} />}
                <span style={{ fontSize: 9, marginLeft: 3 }}>{showMobile ? "Mask" : "Reveal"}</span>
              </button>
            </label>
            <div className="em-readonly em-mono">
              {showMobile ? (member.mobile || "9876543210") : mask(member.mobile || "9876543210")}
            </div>
          </div>
          <div className="em-field">
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Aadhaar Number</span>
              <button
                type="button"
                className="sh-mask-btn"
                onClick={() => setShowAadhaar(!showAadhaar)}
                title={showAadhaar ? "Mask Aadhaar" : "Reveal full Aadhaar"}
              >
                {showAadhaar ? <EyeOff size={12} /> : <Eye size={12} />}
                <span style={{ fontSize: 9, marginLeft: 3 }}>{showAadhaar ? "Mask" : "Reveal"}</span>
              </button>
            </label>
            <div className="em-readonly em-mono">
              {showAadhaar ? (member.aadhaar || "421763856037") : mask(member.aadhaar || "421763856037")}
            </div>
          </div>
          <div className="em-field">
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Registered Bank Account</span>
              <button
                type="button"
                className="sh-mask-btn"
                onClick={() => setShowAccount(!showAccount)}
                title={showAccount ? "Mask bank account" : "Reveal account number"}
              >
                {showAccount ? <EyeOff size={12} /> : <Eye size={12} />}
                <span style={{ fontSize: 9, marginLeft: 3 }}>{showAccount ? "Mask" : "Reveal"}</span>
              </button>
            </label>
            <div className="em-readonly em-mono">
              {member.account ? (
                showAccount ? `${member.account} (${member.bank || "SBI"})` : `${mask(member.account)} (${member.bank || "SBI"})`
              ) : (
                <span style={{ color: "#8a968d" }}>Not recorded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section C — Share Allotment Information */}
      <div className="em-panel pad">
        <div className="em-panel-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Landmark size={15} color="#2d653f" /> Statutory Allotment &amp; Register Identifiers
            </h3>
            <p>Official statutory allotment record under Table-B and company register of members</p>
          </div>
        </div>
        <div className="em-grid cols3">
          <div className="em-field">
            <label>Class of Security</label>
            <div className="em-readonly">
              <span className="em-status blue">{member.classOfSecurity || memberCert.classOfSecurity || "Equity Shares"}</span>
            </div>
          </div>
          <div className="em-field">
            <label>Date of Allotment</label>
            <div className="em-readonly" style={{ fontWeight: 600 }}>
              {member.allotmentDate || member.admitted || memberCert.allotted || "Not recorded"}
            </div>
          </div>
          <div className="em-field">
            <label>Number of Shares Allotted</label>
            <div className="em-readonly" style={{ fontWeight: 700, color: "#1a3324" }}>
              {currentShares.toLocaleString()}
            </div>
          </div>
          <div className="em-field">
            <label>Nominal / Face Value per Share</label>
            <div className="em-readonly em-mono">{money(nominalValue)}</div>
          </div>
          <div className="em-field">
            <label>Total Amount Paid on Such Security</label>
            <div className="em-readonly" style={{ fontWeight: 700, color: "#166534" }}>
              {money(totalAmountPaid)}
            </div>
          </div>
          <div className="em-field">
            <label>Folio Number</label>
            <div className="em-readonly em-mono" style={{ fontWeight: 600 }}>
              {member.folio || memberCert.folio || "FL-001"}
            </div>
          </div>
          <div className="em-field">
            <label>Distinctive Number (From)</label>
            <div className="em-readonly em-mono">{memberCert.distinctiveFrom}</div>
          </div>
          <div className="em-field">
            <label>Distinctive Number (To)</label>
            <div className="em-readonly em-mono">{memberCert.distinctiveTo}</div>
          </div>
          <div className="em-field">
            <label>Certificate Number</label>
            <div className="em-readonly em-mono" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{memberCert.certificate || memberCert.id}</span>
              <button
                type="button"
                className="em-smallbtn"
                onClick={() => handleViewCertificate(latestPurchase)}
                title="Preview Certificate"
              >
                View →
              </button>
            </div>
          </div>
          <div className="em-field">
            <label>Payment Mode</label>
            <div className="em-readonly">{member.payment || latestPurchase?.paymentMode || "Bank transfer"}</div>
          </div>
          <div className="em-field">
            <label>Payment Status</label>
            <div className="em-readonly">
              <span className="em-status">Paid / Accounted</span>
            </div>
          </div>
          <div className="em-field">
            <label>Additional Shares Allowed</label>
            <div className="em-readonly" style={{ color: "#365c40" }}>
              {Math.max(0, 500 - currentShares - pendingShares)} available (500 cap)
            </div>
          </div>
        </div>
      </div>

      {/* Section D — Allotment History & Share Purchase Receipts */}
      <div className="em-panel pad">
        <div className="em-panel-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <ShieldCheck size={15} color="#2d653f" /> Section D — Allotment History &amp; Share Purchase Receipts
            </h3>
            <p>Chronological audit log of share purchases, payment receipts, and 48-hour certificate availability status</p>
          </div>
          <span className="sh-count-badge">
            {effectivePurchases.length + memberRequests.length} transaction record{effectivePurchases.length + memberRequests.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="em-tablewrap">
          <table className="em-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: 140 }}>Transaction Date</th>
                <th style={{ width: 150 }}>Transaction / Receipt</th>
                <th style={{ width: 130 }}>Purchase Type</th>
                <th style={{ width: 90, textAlign: "right" }}>Shares</th>
                <th style={{ width: 110, textAlign: "right" }}>Total Amount</th>
                <th style={{ width: 130, textAlign: "center" }}>Distinctive Numbers</th>
                <th style={{ width: 120, textAlign: "center" }}>Purchase Receipt</th>
                <th style={{ width: 170 }}>Certificate Status (48h)</th>
              </tr>
            </thead>
            <tbody>
              {effectivePurchases.map(p => {
                const eligible = isCertificateEligible(p, accelerateTime ? 48 : 0);
                const remainingText = getRemainingTimeText(p, accelerateTime ? 48 : 0);
                return (
                  <tr key={p.id}>
                    <td style={{ color: "#3b5042", fontSize: 11 }}>
                      {formatDateTime(p.purchaseConfirmedAt)}
                    </td>
                    <td>
                      <strong className="em-mono" style={{ display: "block", fontSize: 11 }}>{p.id}</strong>
                      <span className="em-mono" style={{ color: "#166534", fontSize: 10 }}>{p.receiptNumber}</span>
                    </td>
                    <td>
                      <span className="em-status blue" style={{ fontSize: 9.5, padding: "2px 7px" }}>
                        {p.purchaseType}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      +{(p.sharesPurchased ?? p.shares ?? 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#166534" }}>
                      {money(p.totalAmount)}
                    </td>
                    <td style={{ textAlign: "center", fontFamily: "monospace", fontSize: 11 }}>
                      {p.distinctiveFrom} – {p.distinctiveTo}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="em-smallbtn"
                        onClick={() => setActiveReceipt(p)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <FileText size={12} color="#1b5e20" /> View Receipt
                      </button>
                    </td>
                    <td>
                      {eligible ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="em-status" style={{ fontSize: 9.5 }}>Available</span>
                          <button
                            type="button"
                            className="em-smallbtn"
                            onClick={() => handleViewCertificate(p)}
                          >
                            View Cert →
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="em-status pending" style={{ fontSize: 9.5, display: "inline-block" }}>
                            <Clock size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                            Pending (48h)
                          </span>
                          <div style={{ fontSize: 9.5, color: "#8a580c", marginTop: 2 }}>
                            {remainingText}
                          </div>
                          <button
                            type="button"
                            className="em-smallbtn"
                            onClick={() => setPendingCertNotice(p)}
                            style={{ marginTop: 3, fontSize: 9.5, padding: "2px 6px" }}
                          >
                            Pending Info
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {memberRequests.map(req => (
                <tr key={req.id}>
                  <td style={{ color: "#3b5042", fontSize: 11 }}>{req.date || "Pending"}</td>
                  <td>
                    <strong className="em-mono" style={{ display: "block", fontSize: 11 }}>{req.id}</strong>
                    <span style={{ color: "#7a8a7f", fontSize: 10 }}>Awaiting Approval</span>
                  </td>
                  <td>Additional Share Subscription</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>+{req.shares}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#166534" }}>{money(Number(req.capital || req.shares * nominalValue))}</td>
                  <td style={{ textAlign: "center", color: "#8a968d" }}>Pending issue</td>
                  <td style={{ textAlign: "center", color: "#7a8a7f", fontSize: 10 }}>Generated upon approval</td>
                  <td>
                    <span className={`em-status ${req.status === "Approved" ? "" : req.status === "Rejected" ? "rejected" : "pending"}`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section E — Documents (Receipts | Share Certificates) */}
      <div className="em-panel pad" style={{ marginTop: 20 }}>
        <div className="em-panel-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <FileText size={16} color="#2d653f" /> Documents
            </h3>
            <p>Official payment receipts and statutory share certificates associated with {name}</p>
          </div>
          <div className="sh-doc-tabs">
            <button
              type="button"
              className={`sh-doc-tab ${activeDocTab === "receipts" ? "active" : ""}`}
              onClick={() => setActiveDocTab("receipts")}
              data-testid="tab-receipts"
            >
              <FileText size={13} />
              <span>Receipts</span>
              <span className="sh-doc-count">{effectivePurchases.length}</span>
            </button>
            <button
              type="button"
              className={`sh-doc-tab ${activeDocTab === "certificates" ? "active" : ""}`}
              onClick={() => setActiveDocTab("certificates")}
              data-testid="tab-certificates"
            >
              <ShieldCheck size={13} />
              <span>Share Certificates</span>
              <span className="sh-doc-count">{effectiveCertificates.length}</span>
            </button>
          </div>
        </div>

        {activeDocTab === "receipts" ? (
          effectivePurchases.length === 0 ? (
            <div className="em-empty" data-testid="empty-receipts">
              No receipts available for this shareholder.
            </div>
          ) : (
            <div className="em-tablewrap">
              <table className="em-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: 150 }}>Receipt Number</th>
                    <th style={{ width: 140 }}>Payment Date</th>
                    <th style={{ width: 120 }}>Purchase Type</th>
                    <th style={{ width: 90, textAlign: "right" }}>Shares</th>
                    <th style={{ width: 120, textAlign: "right" }}>Amount Paid</th>
                    <th style={{ width: 180 }}>Payment / Reference</th>
                    <th style={{ width: 100 }}>Status</th>
                    <th style={{ width: 160, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {effectivePurchases.map(r => (
                    <tr key={r.id}>
                      <td>
                        <strong className="em-mono" style={{ color: "#166534", fontSize: 11, display: "block" }}>
                          {r.receiptNumber}
                        </strong>
                        <small className="em-mono" style={{ color: "#7a8a7f", fontSize: 9.5 }}>
                          Ref: {r.id}
                        </small>
                      </td>
                      <td style={{ color: "#3b5042", fontSize: 11 }}>
                        {formatDateTime(r.purchaseConfirmedAt)}
                      </td>
                      <td>
                        <span className="em-status blue" style={{ fontSize: 9.5, padding: "2px 7px" }}>
                          {r.purchaseType}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        +{(r.sharesPurchased ?? r.shares ?? 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#166534" }}>
                        {money(r.totalAmount)}
                      </td>
                      <td style={{ fontSize: 11, color: "#3c4e42" }}>
                        <div style={{ fontWeight: 600 }}>{r.paymentMode || "Bank transfer"}</div>
                        <code style={{ fontSize: 9.5, color: "#6b7a70" }}>{r.paymentReference || "—"}</code>
                      </td>
                      <td>
                        <span className="em-status">
                          <CheckCircle2 size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                          {r.paymentStatus || "Confirmed"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="sh-doc-actions">
                          <button
                            type="button"
                            className="sh-doc-action-btn"
                            onClick={() => setActiveReceipt(r)}
                            title="View official share purchase receipt"
                            data-testid={`view-receipt-${r.receiptNumber}`}
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            type="button"
                            className="sh-doc-action-btn primary"
                            onClick={() => setActiveReceipt(r)}
                            title="Print or download receipt"
                            data-testid={`download-receipt-${r.receiptNumber}`}
                          >
                            <Download size={12} /> Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          effectiveCertificates.length === 0 ? (
            <div className="em-empty" data-testid="empty-certificates">
              No share certificates available for this shareholder.
            </div>
          ) : (
            <div className="em-tablewrap">
              <table className="em-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Certificate Number</th>
                    <th style={{ width: 100 }}>Folio</th>
                    <th style={{ width: 120 }}>Issue Date</th>
                    <th style={{ width: 110, textAlign: "right" }}>Shares Allotted</th>
                    <th style={{ width: 140, textAlign: "center" }}>Distinctive Numbers</th>
                    <th style={{ width: 120 }}>Class of Security</th>
                    <th style={{ width: 140 }}>Status</th>
                    <th style={{ width: 160, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {effectiveCertificates.map(c => {
                    const eligible = isCertificateEligible(c, accelerateTime ? 48 : 0);
                    const remainingText = getRemainingTimeText(c, accelerateTime ? 48 : 0);
                    return (
                      <tr key={c.id || c.certificate}>
                        <td>
                          <strong className="em-mono" style={{ color: "#166534", fontSize: 11 }}>
                            {c.certificate || c.id}
                          </strong>
                        </td>
                        <td className="em-mono">{c.folio || member.folio || "FL-001"}</td>
                        <td style={{ color: "#3b5042", fontSize: 11 }}>
                          {c.allotted || member.allotmentDate || member.admitted || "Not recorded"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {Number(c.shares || 0).toLocaleString()}
                        </td>
                        <td style={{ textAlign: "center", fontFamily: "monospace", fontSize: 11 }}>
                          {c.distinctiveFrom || "—"} – {c.distinctiveTo || "—"}
                        </td>
                        <td>
                          <span className="em-status blue" style={{ fontSize: 9.5, padding: "2px 7px" }}>
                            {c.classOfSecurity || "Equity Shares"}
                          </span>
                        </td>
                        <td>
                          {eligible ? (
                            <span className="em-status">
                              <ShieldCheck size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                              Available
                            </span>
                          ) : (
                            <div>
                              <span className="em-status pending">
                                <Clock size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                                Pending (48h)
                              </span>
                              <small style={{ display: "block", color: "#8a580c", fontSize: 9.5, marginTop: 2 }}>
                                {remainingText}
                              </small>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {eligible ? (
                            <div className="sh-doc-actions">
                              <button
                                type="button"
                                className="sh-doc-action-btn"
                                onClick={() => setPreviewCert(c)}
                                title="View official share certificate"
                                data-testid={`view-cert-${c.certificate || c.id}`}
                              >
                                <Eye size={12} /> View
                              </button>
                              <button
                                type="button"
                                className="sh-doc-action-btn primary"
                                onClick={() => setPreviewCert(c)}
                                title="Print or download share certificate"
                                data-testid={`download-cert-${c.certificate || c.id}`}
                              >
                                <Download size={12} /> Download
                              </button>
                            </div>
                          ) : (
                            <div className="sh-doc-actions">
                              <button
                                type="button"
                                className="sh-doc-action-btn"
                                onClick={() => {
                                  const matchingReceipt = effectivePurchases.find(r => r.certificateId === c.certificate || r.certificateId === c.id) || latestPurchase;
                                  if (matchingReceipt) {
                                    setPendingCertNotice(matchingReceipt);
                                  } else {
                                    setToast(`Certificate pending: Available on ${formatDateTime(c.certificateEligibleAt)}`);
                                  }
                                }}
                                style={{ color: "#8a580c", borderColor: "#fae29f", background: "#fffdf8" }}
                                title="View 48-hour allotment policy details"
                              >
                                <Clock size={12} /> Pending Notice
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Share Purchase Receipt Modal */}
      {activeReceipt && (
        <SharePurchaseReceipt receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}

      {/* 48-Hour Pending Certificate Notice Modal */}
      {pendingCertNotice && (
        <div className="em-modalback" onClick={() => setPendingCertNotice(null)}>
          <div className="em-modal" style={{ width: "min(560px, 96%)" }} onClick={e => e.stopPropagation()}>
            <div className="em-modalhead">
              <h3 style={{ display: "flex", alignItems: "center", gap: 7, color: "#8a580c" }}>
                <Clock size={18} color="#b47818" /> Shareholder Certificate Pending Verification
              </h3>
              <button className="em-close" onClick={() => setPendingCertNotice(null)} aria-label="Close notice">
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{
                background: "#fffaf0",
                border: "1px solid #fae29f",
                borderRadius: 8,
                padding: "14px 16px",
                fontSize: 12,
                color: "#6b4a08",
                lineHeight: 1.5
              }}>
                <strong>Cooperative Allotment Policy (48-Hour Issuance Rule)</strong>
                <p style={{ margin: "6px 0 0" }}>
                  In accordance with the cooperative’s standard share allocation and reconciliation procedures, official share certificates are generated and made available <b>48 hours after payment confirmation</b>.
                </p>
                <p style={{ margin: "6px 0 0" }}>
                  Your official <b>Share Purchase Receipt</b> was generated immediately upon payment confirmation and serves as full proof of purchase and equity entitlement.
                </p>
              </div>

              <div style={{ background: "#f8faf8", border: "1px solid #e2ede2", borderRadius: 8, padding: "12px 16px", fontSize: 11, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#627568" }}>Purchase Reference:</span>
                  <code style={{ fontFamily: "monospace", fontWeight: 700 }}>{pendingCertNotice.id}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#627568" }}>Payment Confirmed At:</span>
                  <span style={{ fontWeight: 600 }}>{formatDateTime(pendingCertNotice.purchaseConfirmedAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#627568" }}>Certificate Available At:</span>
                  <strong style={{ color: "#166534" }}>{formatDateTime(pendingCertNotice.certificateEligibleAt)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#627568" }}>Time Remaining:</span>
                  <span style={{ fontWeight: 700, color: "#92400e" }}>
                    {getRemainingTimeText(pendingCertNotice, accelerateTime ? 48 : 0)}
                  </span>
                </div>
              </div>

              <div className="em-actions" style={{ justifyContent: "space-between", marginTop: 8 }}>
                <button
                  type="button"
                  className="em-btn"
                  onClick={() => {
                    setAccelerateTime(true);
                    setPendingCertNotice(null);
                    handleViewCertificate(pendingCertNotice);
                    setToast("Demo fast-forward applied (+48 hours). Share certificate is now available!");
                  }}
                  style={{ background: "#f0fdf4", color: "#166534", borderColor: "#86efac", fontSize: 11 }}
                >
                  ⚡ Fast-Forward 48h (Test Preview)
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="em-btn primary"
                    onClick={() => {
                      setActiveReceipt(pendingCertNotice);
                      setPendingCertNotice(null);
                    }}
                  >
                    <FileText size={13} /> View Receipt
                  </button>
                  <button type="button" className="em-btn" onClick={() => setPendingCertNotice(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="em-modalback" onClick={() => setPreviewCert(null)}>
          <div className="em-modal" style={{ width: "min(780px, 98%)" }} onClick={e => e.stopPropagation()}>
            <div className="em-modalhead">
              <h3>Share Certificate Preview · {previewCert.certificate || previewCert.id}</h3>
              <button className="em-close" onClick={() => setPreviewCert(null)} aria-label="Close certificate preview">
                <X size={16} />
              </button>
            </div>
            <Certificate cert={previewCert} />
            <div className="em-actions" style={{ marginTop: 14, justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="em-btn primary" onClick={() => window.print()}>
                <Printer size={14} /> Print Certificate
              </button>
              <button
                type="button"
                className="em-btn"
                onClick={() => setToast(`Certificate ${previewCert.certificate || previewCert.id} downloaded.`)}
              >
                <Download size={14} /> Download PDF
              </button>
              <button type="button" className="em-btn" onClick={() => setPreviewCert(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario B — Request / Purchase Additional Shares Modal */}
      {sharesModal && (
        <div className="em-modalback" onClick={() => setSharesModal(false)}>
          <div className="em-modal" style={{ width: "min(560px, 96%)" }} onClick={e => e.stopPropagation()}>
            <div className="em-modalhead">
              <h3>Purchase Additional Shares · {name}</h3>
              <button className="em-close" onClick={() => setSharesModal(false)} aria-label="Close modal">
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div className="em-note">
                Member currently holds <b>{currentShares} shares</b> ({money(totalAmountPaid)} capital).
                Maximum statutory member holding limit is 500 shares.
              </div>

              <div className="em-field">
                <label>Additional Shares to Purchase (Available: {Math.max(0, 500 - currentShares)}) *</label>
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, 500 - currentShares)}
                  value={shareCount}
                  onChange={e => setShareCount(e.target.value)}
                  placeholder="Enter number of shares"
                />
              </div>

              <div className="em-grid cols2">
                <div className="em-field">
                  <label>Class of Security</label>
                  <div className="em-readonly">Equity Shares</div>
                </div>
                <div className="em-field">
                  <label>Face Value per Share</label>
                  <div className="em-readonly em-mono">{money(nominalValue)}</div>
                </div>
              </div>

              <div className="em-stat" style={{ padding: "10px 14px" }}>
                <small>Total Share Capital Payable</small>
                <b style={{ color: "#166534" }}>{money((Number(shareCount) || 0) * nominalValue)}</b>
                <span>Calculated at Rs 100 per equity share</span>
              </div>

              <div className="em-grid cols2">
                <div className="em-field">
                  <label>Payment Mode *</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                    <option value="Bank transfer">Bank transfer (NEFT/RTGS/IMPS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="em-field">
                  <label>Payment Reference / UTR Number</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="e.g. UTIB20261029..."
                  />
                </div>
              </div>

              {/* Informative Workflow Banner */}
              <div style={{
                background: "#f0f7f2",
                border: "1px solid #d0e8d5",
                borderRadius: 6,
                padding: "10px 14px",
                fontSize: 11,
                color: "#285c36",
                lineHeight: 1.5
              }}>
                <div><b>✓ Share Purchase Receipt:</b> Generated immediately upon payment confirmation.</div>
                <div style={{ marginTop: 2 }}><b>⏳ Share Certificate:</b> Issued and available after 48 hours according to cooperative allotment policy.</div>
              </div>

              <div className="em-actions" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="em-btn" onClick={() => setSharesModal(false)}>Cancel</button>
                <button type="button" className="em-btn primary" onClick={handleConfirmPurchase}>
                  <Check size={14} /> Confirm Purchase &amp; Generate Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
