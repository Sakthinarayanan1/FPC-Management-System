import React from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Leaf,
  Printer,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { money, type RecordRow } from "@/lib/store";

export interface ProduceReceiptItem {
  commodity?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;
  baseQuantity?: number;
  baseUnit?: string;
}

interface ProducePurchaseReceiptProps {
  receipt: RecordRow;
  farmer?: RecordRow;
  onClose: () => void;
}

const fpcCompanyDetails = {
  companyName: "Green Valley Farmer Producer Company Ltd.",
  cin: "U01100OD2021PTC035612",
  registrationNumber: "035612",
  pan: "AAACG1234F",
  tan: "BBNG01234A",
  gstin: "21AAACG1234F1Z5",
  rocName: "ROC Cuttack, Odisha",
  registeredAddress: "Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha - 758001",
  email: "office@greenvalleyfpc.in",
  mobile: "+91 9437004412",
};

export default function ProducePurchaseReceipt({
  receipt,
  farmer,
  onClose,
}: ProducePurchaseReceiptProps) {
  const isApproved = receipt.status === "Approved";
  const isRejected = receipt.status === "Rejected";
  const isSubmitted = receipt.status === "Submitted" || !receipt.status;

  // Derive unique deterministic receipt number and voucher number
  const receiptNumber =
    receipt.receiptNumber ||
    (receipt.id ? receipt.id.replace("PUR-", "PUR-RCP-") : "PUR-RCP-2026-0001");
  const voucherNumber = receipt.voucher || receipt.id || "PUR-2026-0001";
  const transactionDate = receipt.date || "12 Oct 2026";
  const approvalDate = receipt.approvedAt || receipt.receiptGeneratedAt || transactionDate;
  const approvedBy = receipt.approvedBy || "FPC Admin / Manager";
  const godown = receipt.godown || "Main Godown Keonjhar";

  // Farmer resolution
  const farmerName =
    farmer?.name ||
    (receipt.party ? receipt.party.split(" · ")[0].trim() : "Ravi Kumar");
  const farmerId =
    receipt.farmerId ||
    farmer?.id ||
    (receipt.party && receipt.party.includes("F-")
      ? receipt.party.substring(receipt.party.indexOf("F-")).split(" ")[0].trim()
      : "F-001");
  const village = farmer?.village || "Green Valley";
  const block = farmer?.block || "Keonjhar Sadar";
  const district = farmer?.district || "Keonjhar";
  const stateName = farmer?.state || "Odisha";
  const mobile = farmer?.mobile || "98XXXX2241";
  const bankName = farmer?.bank || "Odisha Gramya Bank";
  const rawAccount = farmer?.account || "XXXX-XXXX-4812";
  const accountNo = rawAccount.length > 4 ? `XXXX-XXXX-${rawAccount.slice(-4)}` : rawAccount;
  const ifsc = farmer?.ifsc || "IOBA0OGB001";

  // Normalized line items
  const items: ProduceReceiptItem[] = Array.isArray(receipt.items) && receipt.items.length > 0
    ? receipt.items
    : [
        {
          commodity: receipt.commodity || receipt.item || "Paddy (common)",
          quantity: Number(receipt.quantity) || 0,
          unit: receipt.unit || "kg",
          rate: Number(receipt.rate) || 0,
          amount: Number(receipt.amount) || (Number(receipt.quantity) || 0) * (Number(receipt.rate) || 0),
        },
      ];

  const totalAmount = Number(receipt.amount) || items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  // Multi-unit aggregation: supports multiple units without mixing incompatible unit quantities
  const quantitiesByUnit = items.reduce<Record<string, number>>((acc, it) => {
    const u = it.unit || "kg";
    acc[u] = (acc[u] || 0) + (Number(it.quantity) || 0);
    return acc;
  }, {});
  const totalQuantitySummary = Object.entries(quantitiesByUnit)
    .map(([unit, qty]) => `${qty.toLocaleString()} ${unit}`)
    .join(", ");

  // Payment status resolution
  const paymentStatus =
    receipt.paymentStatus ||
    (isRejected
      ? "Rejected"
      : isApproved
      ? (receipt.payment || receipt.paymentStatus === "Paid" ? "Paid / Settled" : "Pending Settlement")
      : "Pending Approval");

  // PDF Export Trigger
  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `${receiptNumber}_Produce_Purchase_Receipt.pdf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="em-modalback" onClick={onClose} style={{ zIndex: 90 }}>
      <style>{`
        @media print {
          @page { size: portrait; margin: 10mm; }
          body * { visibility: hidden !important; }
          .produce-receipt-paper, .produce-receipt-paper * { visibility: visible !important; }
          .produce-receipt-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .em-no-print { display: none !important; }
        }
      `}</style>
      <div
        className="em-modal produce-receipt-modal"
        style={{
          width: "min(860px, 98%)",
          padding: 0,
          overflow: "hidden",
          background: "#fffdfa",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          boxShadow: "0 24px 64px rgba(18, 48, 28, 0.28)",
          borderRadius: 14,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Control Bar (Screen only, hidden in print) */}
        <div
          className="em-no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            background: "#183b25",
            color: "#ffffff",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={16} color="#9ec4a5" />
            <span style={{ fontSize: 13, fontWeight: 750, letterSpacing: "-0.2px" }}>
              PRODUCE PURCHASE RECEIPT · {receiptNumber}
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 750,
                padding: "2px 9px",
                borderRadius: 12,
                background: isApproved ? "#edf7ee" : isRejected ? "#fdf0ed" : "#fff4dc",
                color: isApproved ? "#286442" : isRejected ? "#a83525" : "#966b1f",
                border: `1px solid ${isApproved ? "#c3e4c8" : isRejected ? "#f7c7bf" : "#fae0ad"}`,
              }}
            >
              {isApproved ? "Approved · Recorded" : isRejected ? "Rejected" : "Submitted · Pending Approval"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="em-btn primary"
              style={{
                padding: "6px 12px",
                fontSize: 11,
                background: "#2a623e",
                borderColor: "#3a7a51",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              onClick={handleDownloadPdf}
              title="Download Receipt as PDF"
            >
              <Download size={13} /> Download PDF
            </button>
            <button
              type="button"
              className="em-btn primary"
              style={{
                padding: "6px 12px",
                fontSize: 11,
                background: "#204d30",
                borderColor: "#2e6842",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
              onClick={() => window.print()}
              title="Print Receipt"
            >
              <Printer size={13} /> Print
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: 0,
                borderRadius: 6,
                color: "#ffffff",
                width: 28,
                height: 28,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                marginLeft: 4,
              }}
              aria-label="Close receipt modal"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body Container */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Printable Receipt Paper */}
          <div className="produce-receipt-paper sh-receipt-paper" style={{ padding: "26px 34px", color: "#1d3224" }}>
            {/* 1. Official FPC Header */}
            <div
              style={{
                textAlign: "center",
                borderBottom: "2px solid #235232",
                paddingBottom: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#edf5ee",
                  color: "#286442",
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                <Leaf size={13} /> Registered Farmer Producer Company
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#163e26",
                  margin: "4px 0 5px",
                  letterSpacing: "-0.3px",
                }}
              >
                {fpcCompanyDetails.companyName}
              </h2>
              <div style={{ fontSize: 10.5, color: "#546859", lineHeight: 1.5, maxWidth: 680, margin: "0 auto" }}>
                <span><b>CIN:</b> {fpcCompanyDetails.cin}</span> · <span><b>Registration No:</b> {fpcCompanyDetails.registrationNumber}</span> · <span><b>PAN:</b> {fpcCompanyDetails.pan}</span> · <span><b>GSTIN:</b> {fpcCompanyDetails.gstin}</span>
                <div style={{ marginTop: 2 }}>{fpcCompanyDetails.registeredAddress}</div>
                <div style={{ marginTop: 2, fontSize: 10, color: "#687c6e" }}>
                  <span>Email: {fpcCompanyDetails.email}</span> · <span>Contact: {fpcCompanyDetails.mobile}</span> · <span>Jurisdiction: {fpcCompanyDetails.rocName}</span>
                </div>
              </div>
            </div>

            {/* 2. Receipt Title & Subtitle Banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                background: isApproved ? "#f4f8f4" : isRejected ? "#fdf4f4" : "#fffbf2",
                border: `1px solid ${isApproved ? "#dbe8dc" : isRejected ? "#f5cfcf" : "#fae5b8"}`,
                borderRadius: 8,
                padding: "10px 16px",
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    margin: 0,
                    color: isApproved ? "#144225" : isRejected ? "#8f2222" : "#7c5211",
                    letterSpacing: "-0.2px",
                  }}
                >
                  PRODUCE PURCHASE RECEIPT
                </h3>
                <div
                  style={{
                    fontSize: 10.5,
                    color: isApproved ? "#286442" : isRejected ? "#8f2222" : "#8c5b16",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>Farmer-to-FPC Produce Procurement</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 750,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: isApproved ? "#edf7ee" : isRejected ? "#ffeaea" : "#fff4dc",
                      color: isApproved ? "#286442" : isRejected ? "#a82020" : "#966b1f",
                      border: `1px solid ${isApproved ? "#cae2ce" : isRejected ? "#f3bcbc" : "#fad594"}`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 size={10} /> Approved · Recorded
                      </>
                    ) : isRejected ? (
                      <>
                        <X size={10} /> Rejected
                      </>
                    ) : (
                      <>
                        <Clock size={10} /> Submitted · Pending Approval
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9.5, color: "#66786c" }}>
                  <span>Receipt No: </span>
                  <strong style={{ fontFamily: "monospace", color: isApproved ? "#185e2b" : "#88580f", fontSize: 13 }}>
                    {receiptNumber}
                  </strong>
                </div>
                <div style={{ fontSize: 9, color: "#66786c", marginTop: 2 }}>
                  <span>Purchase Voucher: </span>
                  <code style={{ fontFamily: "monospace", fontWeight: 600 }}>{voucherNumber}</code>
                  <span> · Date: </span>
                  <strong style={{ color: "#223f2b" }}>{transactionDate}</strong>
                </div>
              </div>
            </div>

            {/* 3. Clearly Separated Counterparties: Seller (Farmer) vs Buyer (FPC) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
                fontSize: 11,
              }}
            >
              {/* Card A: Seller / Farmer Details */}
              <div style={{ background: "#ffffff", border: "1px solid #d8e5d9", borderRadius: 8, padding: "12px 14px" }}>
                <div
                  style={{
                    fontSize: 9.5,
                    textTransform: "uppercase",
                    fontWeight: 800,
                    color: "#286442",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #edf3ed",
                    paddingBottom: 6,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <User size={13} color="#286442" /> SELLER / FARMER DETAILS
                  </span>
                  <span style={{ fontSize: 8.5, background: "#edf5ee", color: "#286442", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
                    Supplier
                  </span>
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  <div>
                    <span style={{ color: "#65766a", width: 100, display: "inline-block" }}>Farmer Name:</span>
                    <strong style={{ color: "#143a22", fontSize: 12 }}>{farmerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 100, display: "inline-block" }}>Farmer ID:</span>
                    <code style={{ fontFamily: "monospace", fontWeight: 700, color: "#286442" }}>{farmerId}</code>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 100, display: "inline-block" }}>Address:</span>
                    <span style={{ color: "#314436" }}>{village}, {block}, {district} ({stateName})</span>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 100, display: "inline-block" }}>Contact No:</span>
                    <span>{mobile}</span>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 100, display: "inline-block" }}>Bank &amp; DBT:</span>
                    <span style={{ color: "#314436", fontSize: 10.5 }}>{bankName} · A/C {accountNo} (IFSC: {ifsc})</span>
                  </div>
                </div>
              </div>

              {/* Card B: Buyer / Purchaser (FPC) Details */}
              <div style={{ background: "#ffffff", border: "1px solid #d8e5d9", borderRadius: 8, padding: "12px 14px" }}>
                <div
                  style={{
                    fontSize: 9.5,
                    textTransform: "uppercase",
                    fontWeight: 800,
                    color: "#286442",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #edf3ed",
                    paddingBottom: 6,
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Building2 size={13} color="#286442" /> BUYER / PURCHASER (FPC) DETAILS
                  </span>
                  <span style={{ fontSize: 8.5, background: "#edf5ee", color: "#286442", padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>
                    Purchaser
                  </span>
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Purchaser:</span>
                    <strong style={{ color: "#143a22", fontSize: 12 }}>{fpcCompanyDetails.companyName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>CIN / Reg No:</span>
                    <code style={{ fontFamily: "monospace", fontWeight: 700, color: "#286442" }}>{fpcCompanyDetails.cin}</code>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Office Address:</span>
                    <span style={{ color: "#314436" }}>{fpcCompanyDetails.registeredAddress}</span>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Receiving Godown:</span>
                    <strong style={{ color: "#193f26" }}>{godown}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Business Flow:</span>
                    <span style={{ color: "#286442", fontWeight: 700 }}>Farmer → FPC (Procurement · INWARD)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Produce Purchase Table */}
            <div style={{ border: "1px solid #d8e4d9", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f1f6f1", borderBottom: "1px solid #d8e4d9" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 44 }}>
                      S. No.
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#4d6655", textTransform: "uppercase" }}>
                      Produce / Input
                    </th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 90 }}>
                      Grade
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 90 }}>
                      Quantity
                    </th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 65 }}>
                      Unit
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 95 }}>
                      Rate
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 110 }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={`${it.commodity}-${idx}`} style={{ borderBottom: "1px solid #edf2ed" }}>
                      <td style={{ padding: "9px 10px", textAlign: "center", color: "#66786c" }}>{idx + 1}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <strong style={{ color: "#193f26", display: "block" }}>{it.commodity || "Produce"}</strong>
                        <small style={{ color: "#748679", fontSize: 9 }}>Procurement item · Agricultural produce</small>
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                        <span style={{ background: "#edf4ed", padding: "2px 7px", borderRadius: 4, fontSize: 9.5, color: "#286442", fontWeight: 600 }}>
                          FAQ Grade-A
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, fontSize: 11.5 }}>
                        {(Number(it.quantity) || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "center", color: "#4d6655" }}>
                        {it.unit || "kg"}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace" }}>
                        {money(Number(it.rate) || 0)}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "#1b5a2f" }}>
                        {money(Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.rate) || 0))}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr style={{ background: "#f8fbf8", borderTop: "2px solid #286442" }}>
                    <td colSpan={3} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#284a34", fontSize: 11 }}>
                      Total Procurement Quantity &amp; Total Purchase Amount:
                    </td>
                    <td colSpan={2} style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, color: "#163f25", fontSize: 11.5 }}>
                      {totalQuantitySummary}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#65766a", fontSize: 10, textTransform: "uppercase", fontWeight: 600 }}>
                      Total:
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#156734", fontSize: 14 }}>
                      {money(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Payment and Settlement Status Advisory */}
            <div
              style={{
                background: isApproved ? "#f4f8f4" : isRejected ? "#fdf4f4" : "#fffcf5",
                border: `1px solid ${isApproved ? "#dce8dd" : isRejected ? "#f5cfcf" : "#fae6bd"}`,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                fontSize: 11,
              }}
            >
              <div>
                <div style={{ fontSize: 9.5, textTransform: "uppercase", fontWeight: 700, color: isApproved ? "#4f6a57" : isRejected ? "#8f2222" : "#8c5b16" }}>
                  Payment &amp; Settlement Status
                </div>
                <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: isApproved
                        ? (paymentStatus.includes("Paid") || paymentStatus.includes("Settled") ? "#e4f5e7" : "#fff5e6")
                        : isRejected
                        ? "#ffeaea"
                        : "#fff4dc",
                      color: isApproved
                        ? (paymentStatus.includes("Paid") || paymentStatus.includes("Settled") ? "#1e6833" : "#945c11")
                        : isRejected
                        ? "#a82020"
                        : "#966b1f",
                      border: `1px solid ${
                        isApproved
                          ? (paymentStatus.includes("Paid") || paymentStatus.includes("Settled") ? "#bce4c3" : "#f0d5a8")
                          : isRejected
                          ? "#f3bcbc"
                          : "#fae0ad"
                      }`,
                    }}
                  >
                    {isApproved ? <CheckCircle2 size={11} /> : isRejected ? <X size={11} /> : <Clock size={11} />} {paymentStatus}
                  </span>
                  <span style={{ color: "#546859", fontSize: 10.5 }}>
                    {isRejected
                      ? `Procurement entry was rejected (${receipt.rejectionReason || "Criteria not met"}). No payment liability posted.`
                      : isApproved
                      ? paymentStatus.includes("Paid") || paymentStatus.includes("Settled")
                        ? "Full purchase settlement confirmed and disbursed to farmer bank account."
                        : "Procurement liability recorded in Farmer Payable Ledger. Payable per cooperative payment schedule."
                      : "Produce purchase entry submitted for intake review. Payment scheduled upon administrative approval."}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9.5, color: "#66786c" }}>Total Farmer Amount</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#176735" }}>{money(totalAmount)}</div>
              </div>
            </div>

            {/* 6. Statutory Signatures & Authorizations */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                marginTop: 20,
                paddingTop: 14,
                borderTop: "1px dashed #cfdecf",
                textAlign: "center",
                fontSize: 10,
              }}
            >
              <div>
                <div style={{ height: 38, display: "grid", placeItems: "center" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: isApproved ? "#edf5ee" : isRejected ? "#fdf2f2" : "#fff8ed",
                      color: isApproved ? "#286442" : isRejected ? "#8f2222" : "#966b1f",
                      fontSize: 9.5,
                      fontWeight: 700,
                      border: `1px solid ${isApproved ? "#cce1d1" : isRejected ? "#f2c7c7" : "#f5dcad"}`,
                    }}
                  >
                    {isApproved ? (
                      <>
                        <ShieldCheck size={12} /> Digitally Verified
                      </>
                    ) : isRejected ? (
                      <>
                        <X size={12} /> Rejected
                      </>
                    ) : (
                      <>
                        <Clock size={12} /> Pending Review
                      </>
                    )}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #9bb5a1", paddingTop: 4, fontWeight: 700, color: "#1b4429" }}>
                  Procurement / Purchase Officer
                </div>
                <div style={{ fontSize: 9, color: "#6b7d70" }}>
                  {isApproved ? `${approvedBy} on ${approvalDate}` : "Awaiting Sign-off"}
                </div>
              </div>

              <div>
                <div style={{ height: 38, display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: 10, fontStyle: "italic", color: "#607466" }}>
                    {isApproved ? "Weighment Recorded · Stock Inward" : isRejected ? "Intake Voided" : "Intake Verified"}
                  </span>
                </div>
                <div style={{ borderTop: "1px solid #9bb5a1", paddingTop: 4, fontWeight: 700, color: "#1b4429" }}>
                  Godown Keeper / Weighment In-Charge
                </div>
                <div style={{ fontSize: 9, color: "#6b7d70" }}>{godown}</div>
              </div>

              <div>
                <div style={{ height: 38, display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: 10, fontStyle: "italic", color: "#607466" }}>Acknowledged &amp; Supplied</span>
                </div>
                <div style={{ borderTop: "1px solid #9bb5a1", paddingTop: 4, fontWeight: 700, color: "#1b4429" }}>
                  Farmer / Seller Signature
                </div>
                <div style={{ fontSize: 9, color: "#6b7d70" }}>{farmerName} ({farmerId})</div>
              </div>
            </div>

            {/* 7. Statutory Governance Footer */}
            <div
              style={{
                marginTop: 18,
                paddingTop: 10,
                borderTop: "1px solid #e2ede3",
                textAlign: "center",
                fontSize: 9,
                color: "#74887a",
                lineHeight: 1.4,
              }}
            >
              This is a computer-generated Produce Purchase Receipt issued by {fpcCompanyDetails.companyName} pursuant to Section 378 of the Companies Act, 2013 and cooperative procurement bylaws. No alteration is permitted.
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar (Screen only, hidden in print) */}
        <div
          className="em-no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "13px 24px",
            background: "#f4f8f4",
            borderTop: "1px solid #dce8dd",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="em-btn"
            style={{ padding: "8px 18px", fontSize: 11 }}
            onClick={onClose}
          >
            Close
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="em-btn primary"
              style={{
                padding: "8px 16px",
                fontSize: 11,
                background: "#2a623e",
                borderColor: "#3a7a51",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={handleDownloadPdf}
              title="Download Receipt as PDF"
            >
              <Download size={13} /> Download PDF
            </button>
            <button
              type="button"
              className="em-btn primary"
              style={{
                padding: "8px 18px",
                fontSize: 11,
                background: "#1e4d2f",
                borderColor: "#2a633d",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              onClick={() => window.print()}
              title="Print Receipt"
            >
              <Printer size={13} /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
