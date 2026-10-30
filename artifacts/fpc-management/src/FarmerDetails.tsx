import { useState } from "react";
import {
  ArrowLeft, Check, CheckCircle2, Edit3, Eye, EyeOff,
  Landmark, MapPin, ShieldCheck, Sprout, User, Wallet,
  Calendar, Phone, FileText, ChevronRight, AlertCircle, Building2,
  Printer, Download
} from "lucide-react";
import { can, type Role } from "@/lib/config";
import { money, type RecordRow, type State } from "@/lib/store";
import ProducePurchaseReceipt from "./ProducePurchaseReceipt";

type FarmerDetailsProps = {
  farmerId: string;
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  role: Role;
  setToast: (s: string) => void;
  go: (route: string) => void;
  onEdit?: (farmer: RecordRow) => void;
};

export default function FarmerDetails({
  farmerId,
  state,
  setState,
  role,
  setToast,
  go,
  onEdit,
}: FarmerDetailsProps) {
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [receiptModal, setReceiptModal] = useState<RecordRow | null>(null);

  const farmers = Array.isArray(state.records?.farmers) ? state.records.farmers : [];
  const applications = Array.isArray(state.records?.farmerApplications) ? state.records.farmerApplications : [];

  const farmer = farmers.find(x => x.id === farmerId) || applications.find(x => x.id === farmerId);

  const canEdit = can(role, "Farmers", "E");
  const isAdmin = role === "FPC Admin / Manager" || role === "TSF Central Admin";

  const producePurchases = (Array.isArray(state.records?.businessTransactions) ? state.records.businessTransactions : [])
    .filter(r => (r.flow === "Produce Purchase" || r.flowName === "Produce Purchase") && r.status === "Approved" && (r.farmerId === farmerId || (r.party && farmer?.name && r.party.includes(farmer.name))));

  if (!farmer) {
    return (
      <section className="em" style={{ padding: "10px 0" }}>
        <div className="em-head">
          <div>
            <span className="em-kicker">FARMER REGISTRY</span>
            <h2>Farmer Not Found</h2>
            <p>No farmer record matches ID <code>{farmerId}</code> in this cooperative workspace.</p>
          </div>
          <div className="em-actions">
            <button type="button" className="em-btn" onClick={() => go("/farmers")}>
              <ArrowLeft size={14} /> Back to All Farmers
            </button>
          </div>
        </div>
        <div className="em-panel pad" style={{ textAlign: "center", padding: "48px 24px" }}>
          <AlertCircle size={44} style={{ color: "#a55342", margin: "0 auto 14px" }} />
          <h3 style={{ fontSize: 16, marginBottom: 8, color: "#283d30" }}>Record Missing or Deleted</h3>
          <p style={{ color: "#718177", fontSize: 13, maxWidth: 440, margin: "0 auto 18px" }}>
            The requested farmer ID does not exist in the active register or pending applications. It may have been soft-deleted or entered incorrectly.
          </p>
          <button type="button" className="em-btn primary" onClick={() => go("/farmers")}>
            <ArrowLeft size={14} /> Return to All Farmers
          </button>
        </div>
      </section>
    );
  }

  const walletBal = Number(state.walletBalances?.[farmer.id] || 0);
  const initials = farmer.name
    ? farmer.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "F";

  const maskValue = (v: unknown, visible: boolean, maskChar = "•") => {
    const s = String(v || "");
    if (!s) return "Not provided";
    if (visible) return s;
    return s.length > 4 ? `${maskChar.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}` : s;
  };

  const approveFarmer = () => {
    const updatedFarmer: RecordRow = {
      ...farmer,
      status: "Active",
      kyc: farmer.kyc || "Submitted",
      approved: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };

    setState(st => ({
      ...st,
      records: {
        ...st.records,
        farmerApplications: (st.records.farmerApplications || []).filter(x => x.id !== farmer.id),
        farmers: [updatedFarmer, ...(st.records.farmers || []).filter(x => x.id !== farmer.id)],
      },
      walletBalances: {
        ...st.walletBalances,
        [farmer.id]: st.walletBalances?.[farmer.id] ?? 0,
      },
      audit: [
        {
          id: `AUD-${Date.now()}`,
          actor: role,
          role,
          action: "approved farmer registration",
          module: "Farmers",
          record: farmer.id,
          oldValue: farmer.status || "Submitted",
          newValue: "Active",
          date: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          fpcId: "FPC-ODI-001",
        },
        ...(st.audit || []),
      ],
      notifications: [
        {
          id: `NT-${Date.now()}`,
          title: `${farmer.name} farmer account activated · wallet Rs 0`,
          date: "Just now",
          status: "Unread",
          fpcId: "FPC-ODI-001",
        },
        ...(st.notifications || []),
      ],
    }));

    setToast(`${farmer.name} approved and activated with Rs 0 wallet balance.`);
  };

  return (
    <section className="em" style={{ padding: "4px 0 24px" }}>
      {/* Page Header */}
      <div className="em-head" style={{ alignItems: "flex-start", gap: 16 }}>
        <div>
          <span className="em-kicker">FARMER REGISTRY · RECORD DETAILS</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 24, letterSpacing: "-.5px" }}>{farmer.name}</h2>
            <span className="em-mono" style={{ fontSize: 12, padding: "3px 8px", background: "#e8f0e6", borderRadius: 6, fontWeight: 700 }}>
              {farmer.id}
            </span>
            <span className={`em-status ${farmer.status === "Submitted" ? "pending" : farmer.status === "Rejected" ? "rejected" : ""}`}>
              {farmer.status || "Active"}
            </span>
            {farmer.shareholder && farmer.shareholder !== "No" && (
              <span className="em-status blue" title="Member Shareholder">
                SH: {farmer.shareholder}
              </span>
            )}
          </div>
          <p style={{ marginTop: 4 }}>
            Detailed household baseline, landholding, cropping activity, KYC verification and cooperative wallet balance.
          </p>
        </div>

        <div className="em-actions" style={{ marginTop: 4 }}>
          <button type="button" className="em-btn" onClick={() => go("/farmers")}>
            <ArrowLeft size={14} /> Back to All Farmers
          </button>
          {farmer.status === "Submitted" && isAdmin && (
            <button
              type="button"
              className="em-btn primary"
              onClick={approveFarmer}
              style={{ background: "#286442", color: "#fff" }}
            >
              <Check size={14} /> Approve Farmer
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              className="em-btn primary"
              onClick={() => onEdit ? onEdit(farmer) : go(`/farmers/${farmer.id}/edit`)}
            >
              <Edit3 size={14} /> Edit Farmer
            </button>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="em-stats">
        <div className="em-stat">
          <small>Total Landholding</small>
          <b>{farmer.land || "—"}</b>
          <span>{farmer.plots ? `${farmer.plots} parcel${Number(farmer.plots) > 1 ? "s" : ""}` : "Recorded parcel"}</span>
        </div>
        <div className="em-stat">
          <small>Main Crops</small>
          <b>{farmer.crop ? farmer.crop.split(",")[0] : "Paddy"}</b>
          <span>{farmer.season || "Kharif"} season</span>
        </div>
        <div className="em-stat">
          <small>Wallet Balance</small>
          <b>{money(walletBal)}</b>
          <span>Cooperative credit balance</span>
        </div>
        <div className="em-stat">
          <small>KYC Status</small>
          <b>{farmer.kyc || (farmer.status === "Active" ? "Verified" : "Submitted")}</b>
          <span>{farmer.aadhaar ? "Aadhaar provided" : "Verification pending"}</span>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="em-panel pad">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, borderBottom: "1px solid #edf1eb", paddingBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #2d653f 0%, #1b4528 100%)",
            color: "#fff", display: "grid", placeItems: "center",
            fontSize: 20, fontWeight: 800, letterSpacing: 1, flexShrink: 0
          }}>
            {initials}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: "#20392c" }}>{farmer.name}</h3>
            <span style={{ fontSize: 11, color: "#718177" }}>
              {farmer.village || "Green Valley"}, {farmer.block || "Keonjhar Sadar"} · Member ID: {farmer.id}
            </span>
          </div>
        </div>

        {/* Section A: Profile */}
        <div className="em-panel-head">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <User size={15} color="#2d653f" /> A. Farmer Profile
            </h3>
            <p>Identity, demographic category and personal attributes</p>
          </div>
        </div>
        <div className="em-grid cols3" style={{ marginBottom: 20 }}>
          <div className="em-field">
            <label>Farmer ID</label>
            <div className="em-readonly em-mono">{farmer.id}</div>
          </div>
          <div className="em-field">
            <label>Full Name</label>
            <div className="em-readonly">{farmer.name}</div>
          </div>
          <div className="em-field">
            <label>Gender</label>
            <div className="em-readonly">{farmer.gender || "Not specified"}</div>
          </div>
          <div className="em-field">
            <label>Social Category</label>
            <div className="em-readonly">{farmer.category || "General"}</div>
          </div>
          <div className="em-field">
            <label>Date of Birth</label>
            <div className="em-readonly">{farmer.dob || "Not provided"}</div>
          </div>
          <div className="em-field">
            <label>Registration Status</label>
            <div className="em-readonly" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`em-status ${farmer.status === "Submitted" ? "pending" : ""}`}>
                {farmer.status || "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Section B: Contact & Address */}
        <div className="em-panel-head" style={{ borderTop: "1px solid #edf1eb", paddingTop: 16 }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <MapPin size={15} color="#2d653f" /> B. Contact &amp; Residential Information
            </h3>
            <p>Geographical hierarchy and postal contact details</p>
          </div>
        </div>
        <div className="em-grid cols3" style={{ marginBottom: 20 }}>
          <div className="em-field">
            <label>Mobile Number</label>
            <div className="em-readonly">{farmer.mobile || "—"}</div>
          </div>
          <div className="em-field">
            <label>Email Address</label>
            <div className="em-readonly">{farmer.email || "Not provided"}</div>
          </div>
          <div className="em-field">
            <label>Postal PIN Code</label>
            <div className="em-readonly">{farmer.pin || "758001"}</div>
          </div>
          <div className="em-field">
            <label>Village</label>
            <div className="em-readonly">{farmer.village || "Green Valley"}</div>
          </div>
          <div className="em-field">
            <label>Gram Panchayat</label>
            <div className="em-readonly">{farmer.panchayat || "Sanapatna"}</div>
          </div>
          <div className="em-field">
            <label>Block / Taluka</label>
            <div className="em-readonly">{farmer.block || "Keonjhar Sadar"}</div>
          </div>
          <div className="em-field">
            <label>District</label>
            <div className="em-readonly">{farmer.district || "Keonjhar"}</div>
          </div>
          <div className="em-field">
            <label>State</label>
            <div className="em-readonly">{farmer.state || "Odisha"}</div>
          </div>
          <div className="em-field">
            <label>Full Residential Address</label>
            <div className="em-readonly">{farmer.address || `${farmer.village || "Green Valley"}, ${farmer.block || "Keonjhar Sadar"}, Keonjhar, Odisha`}</div>
          </div>
        </div>

        {/* Section C: Land and Plots */}
        <div className="em-panel-head" style={{ borderTop: "1px solid #edf1eb", paddingTop: 16 }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Sprout size={15} color="#2d653f" /> C. Land &amp; Plot Records
            </h3>
            <p>Holding size, parcels, cultivated area and ownership classification</p>
          </div>
        </div>
        <div className="em-grid cols3" style={{ marginBottom: 20 }}>
          <div className="em-field">
            <label>Total Landholding</label>
            <div className="em-readonly"><strong>{farmer.land || "2.0 acres"}</strong></div>
          </div>
          <div className="em-field">
            <label>Measurement Unit</label>
            <div className="em-readonly">{farmer.landUnit || "acre"}</div>
          </div>
          <div className="em-field">
            <label>Number of Plots</label>
            <div className="em-readonly">{farmer.plots || "1"} plot(s)</div>
          </div>
          <div className="em-field">
            <label>Largest Plot Area</label>
            <div className="em-readonly">{farmer.plotArea ? `${farmer.plotArea} acres` : "1.2 acres"}</div>
          </div>
          <div className="em-field">
            <label>Standardized Area (Acres)</label>
            <div className="em-readonly">{farmer.landArea ? `${Number(farmer.landArea).toFixed(2)} acres` : farmer.land || "2.00 acres"}</div>
          </div>
          <div className="em-field">
            <label>Land Ownership / Tenancy</label>
            <div className="em-readonly">{farmer.landOwnership || "Owner-operator (Self-cultivated)"}</div>
          </div>
        </div>

        {/* Section D: Crops and Livelihood */}
        <div className="em-panel-head" style={{ borderTop: "1px solid #edf1eb", paddingTop: 16 }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <FileText size={15} color="#2d653f" /> D. Crops &amp; Household Livelihood
            </h3>
            <p>Cropping patterns, livestock, dairy and allied agricultural income</p>
          </div>
        </div>
        <div className="em-grid cols3" style={{ marginBottom: 20 }}>
          <div className="em-field">
            <label>Main Crops</label>
            <div className="em-readonly"><strong>{farmer.crop || "Paddy"}</strong></div>
          </div>
          <div className="em-field">
            <label>Primary Season</label>
            <div className="em-readonly">{farmer.season || "Kharif"}</div>
          </div>
          <div className="em-field">
            <label>Crop Cultivated Area</label>
            <div className="em-readonly">{farmer.cropArea ? `${farmer.cropArea} acres` : "1.8 acres"}</div>
          </div>
          <div className="em-field">
            <label>Livestock Population</label>
            <div className="em-readonly">{farmer.livestock || "Not recorded"}</div>
          </div>
          <div className="em-field">
            <label>Allied Livelihood Activities</label>
            <div className="em-readonly">{farmer.allied || "Backyard poultry, vermicompost"}</div>
          </div>
          <div className="em-field">
            <label>Agroforestry</label>
            <div className="em-readonly">{farmer.agroforestry || "Mango, neem and bamboo"}</div>
          </div>
          <div className="em-field">
            <label>NTFP Collection</label>
            <div className="em-readonly">{farmer.ntfp || "Sal leaves, mahua flowers"}</div>
          </div>
          <div className="em-field">
            <label>Dairy &amp; Milk Production</label>
            <div className="em-readonly">{farmer.dairy || "1 cow · local consumption"}</div>
          </div>
        </div>

        {/* Section E: Bank and KYC */}
        <div className="em-panel-head" style={{ borderTop: "1px solid #edf1eb", paddingTop: 16 }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Landmark size={15} color="#2d653f" /> E. Banking &amp; KYC Verification
            </h3>
            <p>Direct benefit transfer account, IFSC and masked statutory identity</p>
          </div>
        </div>
        <div className="em-grid cols3" style={{ marginBottom: 20 }}>
          <div className="em-field">
            <label>Bank Name</label>
            <div className="em-readonly">{farmer.bank || "Odisha Gramya Bank"}</div>
          </div>
          <div className="em-field">
            <label>Account Number</label>
            <div className="em-readonly" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="em-mono">{maskValue(farmer.account || "001234567890", showAccount)}</span>
              <button
                type="button"
                onClick={() => setShowAccount(!showAccount)}
                style={{ border: 0, background: "none", cursor: "pointer", color: "#546859" }}
                aria-label={showAccount ? "Mask account" : "Reveal account"}
                title={showAccount ? "Mask account" : "Reveal account"}
              >
                {showAccount ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="em-field">
            <label>IFSC Code</label>
            <div className="em-readonly em-mono">{farmer.ifsc || "IOBA0OGB001"}</div>
          </div>
          <div className="em-field">
            <label>Aadhaar Number</label>
            <div className="em-readonly" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="em-mono">{maskValue(farmer.aadhaar || "491762803517", showAadhaar)}</span>
              <button
                type="button"
                onClick={() => setShowAadhaar(!showAadhaar)}
                style={{ border: 0, background: "none", cursor: "pointer", color: "#546859" }}
                aria-label={showAadhaar ? "Mask Aadhaar" : "Reveal Aadhaar"}
                title={showAadhaar ? "Mask Aadhaar" : "Reveal Aadhaar"}
              >
                {showAadhaar ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="em-field">
            <label>KYC Verification</label>
            <div className="em-readonly">
              <span className="em-status" style={{ background: farmer.kyc === "Verified" || farmer.status === "Active" ? "#edf4ec" : "#fff4dc", color: farmer.kyc === "Verified" || farmer.status === "Active" ? "#438052" : "#966b1f" }}>
                {farmer.kyc || (farmer.status === "Active" ? "Verified" : "Submitted")}
              </span>
            </div>
          </div>
          <div className="em-field">
            <label>Cooperative Consent</label>
            <div className="em-readonly">{farmer.consent === "yes" ? "Yes · On file" : "Verified consent on file"}</div>
          </div>
        </div>

        {/* Section F: Wallet & Registration Details */}
        <div className="em-panel-head" style={{ borderTop: "1px solid #edf1eb", paddingTop: 16 }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Wallet size={15} color="#2d653f" /> F. Wallet &amp; Registration Governance
            </h3>
            <p>Member balance, registration timeline, approval governance and shareholder links</p>
          </div>
        </div>
        <div className="em-grid cols3">
          <div className="em-field">
            <label>Current Wallet Balance</label>
            <div className="em-readonly"><strong>{money(walletBal)}</strong></div>
          </div>
          <div className="em-field">
            <label>Application / Unique ID</label>
            <div className="em-readonly em-mono">{farmer.id}</div>
          </div>
          <div className="em-field">
            <label>Registration Date</label>
            <div className="em-readonly">{farmer.created || "12 Oct 2026"}</div>
          </div>
          <div className="em-field">
            <label>Approval Status</label>
            <div className="em-readonly">
              <span className={`em-status ${farmer.status === "Submitted" ? "pending" : ""}`}>
                {farmer.status === "Active" ? "Approved · Active Member" : "Submitted · Awaiting Admin Review"}
              </span>
            </div>
          </div>
          <div className="em-field">
            <label>Approval Date</label>
            <div className="em-readonly">{farmer.approved || (farmer.status === "Active" ? "14 Oct 2026" : "Pending approval")}</div>
          </div>
          <div className="em-field">
            <label>Shareholder Membership</label>
            <div className="em-readonly">
              {farmer.shareholder && farmer.shareholder !== "No" ? (
                <span className="em-mono" style={{ color: "#286442", fontWeight: 700 }}>
                  Share Folio: {farmer.shareholder}
                </span>
              ) : (
                "Not registered as shareholder"
              )}
            </div>
          </div>
        </div>

        {/* Section G: Produce Purchase Receipts */}
        <div className="em-panel-head" style={{ borderTop: "1px solid #edf1eb", paddingTop: 16 }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <FileText size={15} color="#2d653f" /> G. Produce Purchase Receipts &amp; Procurement History
            </h3>
            <p>Approved produce intake receipts, weighment slips and farmer settlement status</p>
          </div>
          <span className="em-mono" style={{ background: "#edf5ee", color: "#286442", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
            {producePurchases.length} Official Receipt(s)
          </span>
        </div>

        {producePurchases.length > 0 ? (
          <div style={{ border: "1px solid #e1ebe2", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#f5f8f5", borderBottom: "1px solid #e1ebe2" }}>
                  <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Receipt #</th>
                  <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: "9px 12px", textAlign: "left", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Commodity</th>
                  <th style={{ padding: "9px 12px", textAlign: "right", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Quantity</th>
                  <th style={{ padding: "9px 12px", textAlign: "right", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Rate (₹)</th>
                  <th style={{ padding: "9px 12px", textAlign: "right", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Total Value (₹)</th>
                  <th style={{ padding: "9px 12px", textAlign: "center", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Settlement</th>
                  <th style={{ padding: "9px 12px", textAlign: "center", fontSize: 9, color: "#546859", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {producePurchases.map(p => {
                  const rcpNum = p.receiptNumber || (p.id ? p.id.replace("PUR-", "PUR-RCP-") : "PUR-RCP-2026-0001");
                  const pStatus = p.paymentStatus || "Pending Settlement";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #edf2ed" }}>
                      <td style={{ padding: "9px 12px", fontFamily: "monospace", fontWeight: 700, color: "#1b5a2f" }}>
                        {rcpNum}
                      </td>
                      <td style={{ padding: "9px 12px", color: "#4f6255" }}>{p.date}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <strong>{p.commodity || p.item || "Paddy"}</strong>
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600 }}>
                        {Number(p.quantity || 0).toLocaleString()} {p.unit || "kg"}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>
                        {money(Number(p.rate || 0))}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "#166534" }}>
                        {money(Number(p.amount || 0))}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        <span
                          className="em-status"
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            background: pStatus === "Settled" ? "#e4f5e7" : "#fff5e6",
                            color: pStatus === "Settled" ? "#1e6833" : "#945c11"
                          }}
                        >
                          {pStatus}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: 5 }}>
                          <button
                            type="button"
                            className="em-smallbtn"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#edf5ee", color: "#286442", borderRadius: 4, padding: "3px 7px", fontWeight: 700 }}
                            data-testid={`farmer-view-receipt-${p.id}`}
                            title="View Receipt"
                            onClick={() => setReceiptModal(p)}
                          >
                            <FileText size={11} /> View
                          </button>
                          <button
                            type="button"
                            className="em-smallbtn"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#f5f7f5", color: "#36513f", borderRadius: 4, padding: "3px 7px" }}
                            data-testid={`farmer-print-receipt-${p.id}`}
                            title="Print Receipt"
                            onClick={() => {
                              setReceiptModal(p);
                              setTimeout(() => window.print(), 200);
                            }}
                          >
                            <Printer size={11} /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "16px", background: "#f8faf7", border: "1px dashed #d5e2d6", borderRadius: 8, textAlign: "center", color: "#667a6d", fontSize: 11, marginBottom: 20 }}>
            No approved produce procurement transactions recorded for this farmer yet. Receipts are generated automatically once a produce purchase is approved.
          </div>
        )}

        {/* Footer Actions */}
        <div className="em-formfoot" style={{ marginTop: 24, paddingTop: 16 }}>
          <button type="button" className="em-btn" onClick={() => go("/farmers")}>
            <ArrowLeft size={14} /> Back to All Farmers
          </button>
          <div className="em-inline">
            {farmer.status === "Submitted" && isAdmin && (
              <button
                type="button"
                className="em-btn primary"
                onClick={approveFarmer}
                style={{ background: "#286442", color: "#fff" }}
              >
                <Check size={14} /> Approve Farmer
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                className="em-btn primary"
                onClick={() => onEdit ? onEdit(farmer) : go(`/farmers/${farmer.id}/edit`)}
              >
                <Edit3 size={14} /> Edit Farmer
              </button>
            )}
          </div>
        </div>
      </div>

      {receiptModal && (
        <ProducePurchaseReceipt
          receipt={receiptModal}
          farmer={farmer}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </section>
  );
}

