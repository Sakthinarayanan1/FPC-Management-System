import React from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import { money, type RecordRow } from "@/lib/store";

export interface ProduceSaleItem {
  commodity?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;
  baseQuantity?: number;
  baseUnit?: string;
}

interface ProduceSaleReceiptProps {
  receipt: RecordRow;
  buyer?: RecordRow;
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
  bankName: "State Bank of India",
  bankBranch: "Keonjhar",
  accountNo: "389201004821",
  ifsc: "SBIN0001234",
};

export default function ProduceSaleReceipt({
  receipt,
  buyer,
  onClose,
}: ProduceSaleReceiptProps) {
  const isApproved = receipt.status === "Approved";
  const isRejected = receipt.status === "Rejected";
  const isSubmitted = receipt.status === "Submitted" || !receipt.status;

  // Derive unique deterministic receipt number and voucher number
  const receiptNumber =
    receipt.receiptNumber ||
    (receipt.id ? receipt.id.replace("SAL-", "SAL-RCP-") : "SAL-RCP-2026-0001");
  const voucherNumber = receipt.voucher || receipt.id || "SAL-2026-0001";
  const transactionDate = receipt.date || "20 Oct 2026";
  const approvalDate = receipt.approvedAt || receipt.receiptGeneratedAt || transactionDate;
  const approvedBy = receipt.approvedBy || "FPC Admin / Manager";
  const godown = receipt.godown || "Main Godown Keonjhar";

  // Buyer resolution
  const buyerName =
    buyer?.name ||
    receipt.party ||
    "Shree Balaji Rice Mills";
  const buyerId =
    buyer?.id ||
    receipt.buyerId ||
    "BUY-001";
  const buyerType = buyer?.type || "Mill / Commercial Buyer";
  const buyerGstin = buyer?.gstin || receipt.buyerGstin || "21AAAAA0000A1Z5";
  const buyerPan = buyer?.pan || "AAAAA0000A";
  const contactPerson = buyer?.contact || receipt.buyerContact || "R. Mahapatra";
  const mobile = buyer?.mobile || receipt.buyerMobile || "+91 9437001001";
  const address = buyer?.address || receipt.buyerAddress || "Cuttack, Odisha";
  const paymentTerms = buyer?.paymentTerms || 15;
  const creditLimit = buyer?.creditLimit ? money(Number(buyer.creditLimit)) : "₹5,00,000";

  // Normalized line items
  const items: ProduceSaleItem[] =
    Array.isArray(receipt.items) && receipt.items.length > 0
      ? receipt.items
      : [
          {
            commodity: receipt.commodity || receipt.item || "Paddy (common)",
            quantity: Number(receipt.quantity) || 0,
            unit: receipt.unit || "kg",
            rate: Number(receipt.rate) || 0,
            amount:
              Number(receipt.amount) ||
              (Number(receipt.quantity) || 0) * (Number(receipt.rate) || 0),
          },
        ];

  const totalAmount =
    Number(receipt.amount) ||
    items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  // Multi-unit aggregation
  const quantityByUnit: Record<string, number> = {};
  items.forEach((it) => {
    const u = it.unit || "kg";
    const q = Number(it.quantity) || 0;
    quantityByUnit[u] = (quantityByUnit[u] || 0) + q;
  });
  const totalQuantitySummary = Object.entries(quantityByUnit)
    .map(([u, q]) => `${q.toLocaleString("en-IN")} ${u}`)
    .join(", ");

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `${receiptNumber}_Produce_Sale_Invoice.pdf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div
      className="modal-backdrop em-receipt-backdrop"
      onClick={onClose}
      style={{
        zIndex: 9999,
        background: "rgba(18, 30, 22, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="modal-card em-receipt-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "840px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "0 20px 40px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Top Control Bar (Hidden during Print) */}
        <div
          className="em-no-print"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            background: "#1e3b2b",
            color: "#ffffff",
            borderBottom: "1px solid #142a1e",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={18} color="#a4e5b2" />
            <span style={{ fontWeight: 600, fontSize: "14px", letterSpacing: "0.2px" }}>
              Produce Sale Invoice & Receipt • {receiptNumber}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "6px",
                background: "#2f5c42",
                color: "#ffffff",
                border: "1px solid #417d5a",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              <Printer size={14} /> Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "6px",
                background: "#ffffff",
                color: "#1e3b2b",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                color: "#d0e3d5",
                cursor: "pointer",
                padding: "4px",
                marginLeft: "6px",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Receipt Content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <div
            id="printable-sale-receipt"
            style={{
              padding: "28px 36px",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: "#1c2e22",
              background: "#ffffff",
            }}
          >
            {/* Header: Seller (FPC Details) & Official Logo */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                paddingBottom: "16px",
                borderBottom: "2px solid #285437",
              }}
            >
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <img
                  src="/ual-baha-logo.png"
                  alt="FPC Logo"
                  style={{
                    width: "56px",
                    height: "56px",
                    objectFit: "contain",
                    borderRadius: "10px",
                    border: "1px solid #cce0d0",
                    padding: "3px",
                    background: "#ffffff",
                  }}
                />
                <div>
                  <h1
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "17px",
                      fontWeight: 800,
                      color: "#1b4d2a",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {fpcCompanyDetails.companyName}
                  </h1>
                  <p style={{ margin: "0 0 2px 0", fontSize: "11px", color: "#4f6354" }}>
                    {fpcCompanyDetails.registeredAddress}
                  </p>
                  <p style={{ margin: 0, fontSize: "10px", color: "#6a7d6e" }}>
                    <span style={{ fontWeight: 600 }}>CIN:</span> {fpcCompanyDetails.cin} •{" "}
                    <span style={{ fontWeight: 600 }}>PAN:</span> {fpcCompanyDetails.pan} •{" "}
                    <span style={{ fontWeight: 600 }}>GSTIN:</span> {fpcCompanyDetails.gstin}
                  </p>
                </div>
              </div>

              {/* Status Chip */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background: isApproved ? "#e8f5e9" : isRejected ? "#fde8e8" : "#e3f2fd",
                    color: isApproved ? "#1b5e20" : isRejected ? "#b71c1c" : "#0d47a1",
                    border: `1px solid ${isApproved ? "#a5d6a7" : isRejected ? "#ef9a9a" : "#90caf9"}`,
                  }}
                >
                  {isApproved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  {isApproved ? "Approved · Invoiced" : isRejected ? "Sale Rejected" : "Submitted · Pending Approval"}
                </span>
                <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#6c8071" }}>
                  Flow: <strong>FPC → Registered Buyer</strong>
                </p>
              </div>
            </div>

            {/* Title Banner */}
            <div
              style={{
                margin: "14px 0",
                padding: "8px 14px",
                background: "#f3f8f4",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeft: "4px solid #285437",
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 800,
                    letterSpacing: "0.8px",
                    color: "#1b4d2a",
                    textTransform: "uppercase",
                  }}
                >
                  PRODUCE SALE INVOICE & RECEIPT
                </span>
                <span style={{ fontSize: "10px", color: "#546e5a" }}>
                  Commercial Produce Dispatch & Settlement Register
                </span>
              </div>
              <div style={{ textAlign: "right", fontSize: "11px" }}>
                <span style={{ color: "#546e5a" }}>Invoice / Receipt No: </span>
                <strong style={{ color: "#1c2e22", fontFamily: "monospace" }}>{receiptNumber}</strong>
              </div>
            </div>

            {/* Voucher & Transaction Metadata Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
                padding: "10px 14px",
                background: "#fafcfa",
                border: "1px solid #e1ebe2",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "11px",
              }}
            >
              <div>
                <span style={{ color: "#6c8071", display: "block", fontSize: "10px" }}>Sale Voucher No:</span>
                <strong style={{ fontFamily: "monospace", color: "#1b4d2a" }}>{voucherNumber}</strong>
              </div>
              <div>
                <span style={{ color: "#6c8071", display: "block", fontSize: "10px" }}>Transaction Date:</span>
                <strong>{transactionDate}</strong>
              </div>
              <div>
                <span style={{ color: "#6c8071", display: "block", fontSize: "10px" }}>Dispatch Godown:</span>
                <strong>{godown}</strong>
              </div>
              <div>
                <span style={{ color: "#6c8071", display: "block", fontSize: "10px" }}>Payment Terms:</span>
                <strong>{paymentTerms} Days Credit</strong>
              </div>
            </div>

            {/* Counterparty Cards: Seller (FPC) vs Buyer (Commercial Company) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              {/* Card A: Seller / Supplier (FPC Details) */}
              <div
                style={{
                  border: "1px solid #d4e4d6",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#1b5e20",
                    borderBottom: "1px solid #eef4ef",
                    paddingBottom: "6px",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Building2 size={13} color="#286442" /> SELLER / SUPPLIER (FPC)
                </div>
                <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "#1c2e22" }}>
                    {fpcCompanyDetails.companyName}
                  </p>
                  <p style={{ margin: 0, color: "#546b5a" }}>
                    {fpcCompanyDetails.registeredAddress}
                  </p>
                  <div style={{ marginTop: "6px", fontSize: "10px", color: "#4f6656" }}>
                    <div><span style={{ color: "#778c7c", width: 85, display: "inline-block" }}>CIN:</span> <strong>{fpcCompanyDetails.cin}</strong></div>
                    <div><span style={{ color: "#778c7c", width: 85, display: "inline-block" }}>GSTIN:</span> <strong>{fpcCompanyDetails.gstin}</strong></div>
                    <div><span style={{ color: "#778c7c", width: 85, display: "inline-block" }}>Contact:</span> {fpcCompanyDetails.email} • {fpcCompanyDetails.mobile}</div>
                    <div><span style={{ color: "#778c7c", width: 85, display: "inline-block" }}>Direction:</span> <span style={{ color: "#2e7d32", fontWeight: 700 }}>Dispatch · OUTWARD</span></div>
                  </div>
                </div>
              </div>

              {/* Card B: Buyer / Customer (Registered Company) */}
              <div
                style={{
                  border: "1px solid #d4e4d6",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#1b5e20",
                    borderBottom: "1px solid #eef4ef",
                    paddingBottom: "6px",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <Store size={13} color="#286442" /> BUYER / CUSTOMER (REGISTERED BUYER)
                </div>
                <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#1c2e22", fontSize: "12px" }}>
                      {buyerName}
                    </p>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        fontWeight: 600,
                        background: "#eef5ef",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        color: "#235032",
                      }}
                    >
                      {buyerId}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", color: "#546b5a" }}>
                    {address}
                  </p>
                  <div style={{ marginTop: "6px", fontSize: "10px", color: "#4f6656" }}>
                    <div><span style={{ color: "#778c7c", width: 95, display: "inline-block" }}>Business Type:</span> <strong>{buyerType}</strong></div>
                    <div><span style={{ color: "#778c7c", width: 95, display: "inline-block" }}>GSTIN:</span> <strong className="mono">{buyerGstin}</strong></div>
                    <div><span style={{ color: "#778c7c", width: 95, display: "inline-block" }}>Contact Person:</span> {contactPerson} ({mobile})</div>
                    <div><span style={{ color: "#778c7c", width: 95, display: "inline-block" }}>Credit Limit:</span> {creditLimit} (Payment: {paymentTerms} days)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Produce Sale Line Items Table */}
            <div style={{ border: "1px solid #d8e4d9", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#285437", color: "#ffffff", fontWeight: 700, fontSize: "10px", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                    <th style={{ padding: "8px 10px", width: "45px", textAlign: "center" }}>S. No.</th>
                    <th style={{ padding: "8px 12px" }}>Produce / Commodity</th>
                    <th style={{ padding: "8px 10px", textAlign: "center" }}>Grade</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Quantity</th>
                    <th style={{ padding: "8px 10px" }}>Unit</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Sale Rate (₹)</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #edf2ee", background: idx % 2 === 0 ? "#ffffff" : "#fbfdfb" }}>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#6a7d6e" }}>{idx + 1}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1c2e22" }}>{it.commodity}</td>
                      <td style={{ padding: "8px 10px", textAlign: "center", color: "#546e5a" }}>FAQ Grade-A</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontFamily: "monospace" }}>{Number(it.quantity || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "8px 10px", color: "#546e5a" }}>{it.unit || "kg"}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>₹{Number(it.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1b4d2a", fontFamily: "monospace" }}>₹{Number(it.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f0f6f1", borderTop: "2px solid #285437", fontWeight: 700, fontSize: "11px" }}>
                    <td colSpan={3} style={{ padding: "10px 12px", color: "#1b4d2a", textAlign: "right", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.5px" }}>
                      Total Dispatch & Invoice Summary:
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontFamily: "monospace", color: "#1b4d2a" }}>
                      {totalQuantitySummary}
                    </td>
                    <td style={{ padding: "10px 10px" }}></td>
                    <td style={{ padding: "10px 10px", textAlign: "right", fontSize: "10px", textTransform: "uppercase", color: "#546e5a" }}>Total Value:</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "13px", color: "#1b4d2a", fontFamily: "monospace" }}>
                      ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Commercial Terms & Settlement Advice */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: "16px",
                marginBottom: "22px",
                background: "#fafcfa",
                border: "1px solid #e1ede3",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "10.5px",
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: "#1b4d2a", display: "block", marginBottom: "4px" }}>
                  COMMERCIAL TERMS & INVOICE ADVISORY
                </span>
                <p style={{ margin: "0 0 4px 0", color: "#4f6354", lineHeight: "1.5" }}>
                  1. Payment terms: <strong>{paymentTerms} days credit</strong> from dispatch date.
                </p>
                <p style={{ margin: "0 0 4px 0", color: "#4f6354", lineHeight: "1.5" }}>
                  2. Goods once inspected and accepted at godown cannot be returned.
                </p>
                <p style={{ margin: 0, color: "#4f6354", lineHeight: "1.5" }}>
                  3. Please remit payments directly to FPC primary settlement bank account.
                </p>
              </div>
              <div style={{ borderLeft: "1px dashed #c8dbcc", paddingLeft: "14px" }}>
                <span style={{ fontWeight: 700, color: "#1b4d2a", display: "block", marginBottom: "4px" }}>
                  REMITTANCE BANK DETAILS
                </span>
                <div style={{ color: "#4f6354", lineHeight: "1.6" }}>
                  <div>Bank: <strong>{fpcCompanyDetails.bankName}</strong></div>
                  <div>Branch: {fpcCompanyDetails.bankBranch}</div>
                  <div>A/C No: <strong className="mono">{fpcCompanyDetails.accountNo}</strong></div>
                  <div>IFSC: <strong className="mono">{fpcCompanyDetails.ifsc}</strong></div>
                </div>
              </div>
            </div>

            {/* Official Signatures */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginTop: "28px",
                paddingTop: "14px",
                borderTop: "1px solid #e2ebe4",
                textAlign: "center",
                fontSize: "10px",
                color: "#546e5a",
              }}
            >
              <div>
                <div style={{ height: "36px", borderBottom: "1px dashed #b5ceb9", margin: "0 15px 6px" }}></div>
                <strong style={{ display: "block", color: "#1c2e22" }}>Sales Officer / Admin</strong>
                <span>{fpcCompanyDetails.companyName}</span>
              </div>
              <div>
                <div style={{ height: "36px", borderBottom: "1px dashed #b5ceb9", margin: "0 15px 6px" }}></div>
                <strong style={{ display: "block", color: "#1c2e22" }}>Godown Dispatcher</strong>
                <span>{godown}</span>
              </div>
              <div>
                <div style={{ height: "36px", borderBottom: "1px dashed #b5ceb9", margin: "0 15px 6px" }}></div>
                <strong style={{ display: "block", color: "#1c2e22" }}>Buyer Representative</strong>
                <span>{buyerName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

