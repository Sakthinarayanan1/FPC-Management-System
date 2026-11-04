import React from "react";
import {
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Leaf,
  Printer,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { money, type RecordRow } from "@/lib/store";

export interface PurchaseReceiptItem {
  commodity?: string;
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;
  discount?: number;
  tax?: number;
}

export interface PurchaseReceiptModalProps {
  receipt: RecordRow;
  farmer?: RecordRow;
  supplier?: RecordRow;
  onClose: () => void;
  onViewFarmerProfile?: (farmerId: string) => void;
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

export default function PurchaseReceiptModal({
  receipt,
  farmer,
  supplier,
  onClose,
  onViewFarmerProfile,
}: PurchaseReceiptModalProps) {
  const isApproved = receipt.status === "Approved";
  const isRejected = receipt.status === "Rejected";

  // Deterministic Receipt Number & Voucher Number
  const receiptNumber =
    receipt.receiptNumber ||
    (receipt.id
      ? receipt.id.replace("PUR-IN-", "PUR-IN-RCP-").replace("PUR-", "PUR-RCP-")
      : "PUR-RCP-2026-0001");
  const voucherNumber = receipt.voucher || receipt.id || "PUR-2026-0001";

  // Transaction Date & Time
  const transactionDate =
    receipt.receiptGeneratedAt ||
    receipt.created ||
    receipt.date ||
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const godown = receipt.godown || receipt.storeName || "Main Godown Keonjhar";
  const cashier = receipt.createdBy || receipt.approvedBy || "FPC Admin / Purchase Officer";

  // Farmer resolution
  const isSupplierPurchase = receipt.flow === "Input Purchase" || Boolean(receipt.supplierId && !receipt.farmerId);
  const farmerName =
    farmer?.name ||
    (receipt.party ? receipt.party.split(" · ")[0].trim() : "Ravi Kumar");
  const farmerId =
    receipt.farmerId ||
    farmer?.id ||
    (receipt.party && receipt.party.includes("F-")
      ? receipt.party.substring(receipt.party.indexOf("F-")).split(" ")[0].trim()
      : "F-001");
  const mobile = farmer?.mobile || "9876543210";
  const village = farmer?.village || "Green Valley";
  const block = farmer?.block || "Keonjhar Sadar";
  const district = farmer?.district || "Keonjhar";
  const stateName = farmer?.state || "Odisha";

  // Supplier resolution for Input Purchase
  const supplierName = supplier?.name || receipt.party || "Kisan Agro Supply";
  const supplierId = receipt.supplierId || supplier?.id || "SUP-001";
  const supplierGstin = supplier?.gstin || "21AAAFK9812K1Z8";
  const supplierMobile = supplier?.mobile || supplier?.phone || "9437012345";

  // Normalized line items
  const items: PurchaseReceiptItem[] =
    Array.isArray(receipt.items) && receipt.items.length > 0
      ? receipt.items
      : [
        {
          commodity: receipt.commodity || receipt.item || "Paddy (common)",
          category:
            receipt.category ||
            (receipt.flow === "Produce Purchase" ? "Agricultural Produce" : "Farm Inputs"),
          quantity: Number(receipt.quantity) || 1,
          unit: receipt.unit || "kg",
          rate: Number(receipt.rate) || 0,
          amount: Number(receipt.amount) || 0,
          discount: Number(receipt.discount || 0),
          tax: Number(receipt.tax || 0),
        },
      ];

  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.amount) || (Number(it.quantity) || 0) * (Number(it.rate) || 0)),
    0
  );
  const discount = Number(receipt.discount || 0);
  const tax = Number(receipt.tax || 0);
  const totalAmount = Number(receipt.amount || subtotal - discount + tax);

  // Payment & Wallet Calculations
  const paymentMethod = receipt.paymentMethod || "Farmer Wallet";
  const isWalletPayment = paymentMethod === "Farmer Wallet" || paymentMethod === "Wallet";

  const openingBalance =
    receipt.openingWalletBalance !== undefined
      ? Number(receipt.openingWalletBalance)
      : isWalletPayment
        ? totalAmount + (receipt.closingWalletBalance !== undefined ? Number(receipt.closingWalletBalance) : 0)
        : Number(receipt.previousWalletBalance ?? 0);

  const walletDebit =
    receipt.walletDebit !== undefined
      ? Number(receipt.walletDebit)
      : isWalletPayment
        ? totalAmount
        : 0;

  const closingBalance =
    receipt.closingWalletBalance !== undefined
      ? Number(receipt.closingWalletBalance)
      : isWalletPayment
        ? Math.max(0, openingBalance - walletDebit)
        : openingBalance;

  // Print & PDF Export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `${receiptNumber}_Purchase_Receipt.pdf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div
      className="modal-backdrop purchase-receipt-backdrop"
      onClick={onClose}
      style={{
        zIndex: 9999,
        background: "rgba(18, 30, 22, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <style>{`
        @media print {
          @page { size: portrait; margin: 8mm; }
          body * { visibility: hidden !important; }
          .purchase-receipt-paper, .purchase-receipt-paper * { visibility: visible !important; }
          .purchase-receipt-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          .em-no-print { display: none !important; }
        }
      `}</style>

      <div
        className="modal-card purchase-receipt-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(860px, 98%)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "14px",
          background: "#ffffff",
          boxShadow: "0 24px 64px rgba(18, 48, 28, 0.28)",
          overflow: "hidden",
          border: "1px solid #d4e3d5",
        }}
      >
        {/* Top Control Bar (Screen only, hidden in print) */}
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
              PURCHASE RECEIPT · {receiptNumber}
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
              {isApproved ? "Approved · Recorded" : isRejected ? "Rejected" : "Recorded · Valid Transaction"}
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
              onClick={handlePrint}
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
          <div
            className="purchase-receipt-paper"
            style={{ padding: "26px 34px", color: "#1d3224", background: "#ffffff" }}
          >
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
              <div
                style={{
                  fontSize: 10.5,
                  color: "#546859",
                  lineHeight: 1.5,
                  maxWidth: 680,
                  margin: "0 auto",
                }}
              >
                <span><b>CIN:</b> {fpcCompanyDetails.cin}</span> · <span><b>Registration No:</b> {fpcCompanyDetails.registrationNumber}</span> · <span><b>PAN:</b> {fpcCompanyDetails.pan}</span> · <span><b>GSTIN:</b> {fpcCompanyDetails.gstin}</span>
                <div style={{ marginTop: 2 }}>{fpcCompanyDetails.registeredAddress}</div>
                <div style={{ marginTop: 2, fontSize: 10, color: "#687c6e" }}>
                  <span>Email: {fpcCompanyDetails.email}</span> · <span>Contact: {fpcCompanyDetails.mobile}</span> · <span>Jurisdiction: {fpcCompanyDetails.rocName}</span>
                </div>
              </div>
            </div>

            {/* 2. Receipt Title & Metadata Banner */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                background: "#f4f8f4",
                border: "1px solid #dbe8dc",
                borderRadius: 8,
                padding: "10px 16px",
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    margin: 0,
                    color: "#144225",
                    letterSpacing: "-0.2px",
                  }}
                >
                  Purchase Receipt
                </h3>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "#286442",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{isSupplierPurchase ? "FPC Input Procurement" : "Farmer-to-FPC Produce Procurement"}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 750,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: "#edf7ee",
                      color: "#286442",
                      border: "1px solid #cae2ce",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={10} /> Validated Transaction
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9.5, color: "#66786c" }}>
                  <span>Receipt No: </span>
                  <strong
                    style={{
                      fontFamily: "monospace",
                      color: "#185e2b",
                      fontSize: 13,
                    }}
                  >
                    {receiptNumber}
                  </strong>
                </div>
                <div style={{ fontSize: 9, color: "#66786c", marginTop: 2 }}>
                  <span>Transaction Ref: </span>
                  <code style={{ fontFamily: "monospace", fontWeight: 600 }}>{voucherNumber}</code>
                  <span> · Date &amp; Time: </span>
                  <strong style={{ color: "#223f2b" }}>{transactionDate}</strong>
                </div>
              </div>
            </div>

            {/* 3. Counterparties: Farmer / Seller vs FPC */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
                fontSize: 11,
              }}
            >
              {/* Card A: Farmer / Supplier Details */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #d8e5d9",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
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
                    <User size={13} color="#286442" />
                    {isSupplierPurchase ? "SUPPLIER DETAILS" : "FARMER DETAILS"}
                  </span>
                  <span
                    style={{
                      fontSize: 8.5,
                      background: "#edf5ee",
                      color: "#286442",
                      padding: "1px 6px",
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    {isSupplierPurchase ? "Supplier" : "Producer Member"}
                  </span>
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  <div>
                    <span style={{ color: "#65766a", width: 105, display: "inline-block" }}>
                      {isSupplierPurchase ? "Supplier Name:" : "Farmer Name:"}
                    </span>
                    <strong style={{ color: "#143a22", fontSize: 12 }}>
                      {isSupplierPurchase ? supplierName : farmerName}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 105, display: "inline-block" }}>
                      {isSupplierPurchase ? "Supplier ID:" : "Farmer ID:"}
                    </span>
                    <code
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#286442",
                      }}
                    >
                      {isSupplierPurchase ? supplierId : farmerId}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 105, display: "inline-block" }}>Mobile Number:</span>
                    <span style={{ fontWeight: 600 }}>{isSupplierPurchase ? supplierMobile : mobile}</span>
                  </div>
                  {!isSupplierPurchase ? (
                    <div>
                      <span style={{ color: "#65766a", width: 105, display: "inline-block" }}>Location:</span>
                      <span style={{ color: "#314436" }}>{village}, {block}, {district} ({stateName})</span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ color: "#65766a", width: 105, display: "inline-block" }}>GSTIN:</span>
                      <span className="mono" style={{ color: "#314436" }}>{supplierGstin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card B: FPC Purchaser Details */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #d8e5d9",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
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
                    <Building2 size={13} color="#286442" /> PURCHASER (FPC) DETAILS
                  </span>
                  <span
                    style={{
                      fontSize: 8.5,
                      background: "#edf5ee",
                      color: "#286442",
                      padding: "1px 6px",
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    Purchaser
                  </span>
                </div>
                <div style={{ display: "grid", gap: 5 }}>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Purchaser:</span>
                    <strong style={{ color: "#143a22", fontSize: 12 }}>{fpcCompanyDetails.companyName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Receiving Godown:</span>
                    <strong style={{ color: "#193f26" }}>{godown}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Processed By:</span>
                    <span style={{ color: "#314436" }}>{cashier}</span>
                  </div>
                  <div>
                    <span style={{ color: "#65766a", width: 110, display: "inline-block" }}>Transaction Flow:</span>
                    <span style={{ color: "#286442", fontWeight: 700 }}>
                      {isSupplierPurchase ? "Supplier → FPC (Input Intake)" : "Farmer → FPC (Procurement · INWARD)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Purchase Details Table */}
            <div
              style={{
                border: "1px solid #d8e4d9",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f1f6f1", borderBottom: "1px solid #d8e4d9" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 44 }}>
                      S. No.
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#4d6655", textTransform: "uppercase" }}>
                      Item / Product Name
                    </th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 120 }}>
                      Category
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 90 }}>
                      Quantity
                    </th>
                    <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 65 }}>
                      Unit
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 95 }}>
                      Unit Price
                    </th>
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: "#4d6655", textTransform: "uppercase", width: 110 }}>
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const itemAmount =
                      Number(it.amount) ||
                      (Number(it.quantity) || 0) * (Number(it.rate) || 0);
                    return (
                      <tr key={`${it.commodity || it.name}-${idx}`} style={{ borderBottom: "1px solid #edf2ed" }}>
                        <td style={{ padding: "9px 10px", textAlign: "center", color: "#66786c" }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: "9px 12px" }}>
                          <strong style={{ color: "#193f26", display: "block" }}>
                            {it.commodity || it.name || "Produce"}
                          </strong>
                          <small style={{ color: "#748679", fontSize: 9 }}>
                            Verified purchase procurement entry
                          </small>
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "center" }}>
                          <span
                            style={{
                              background: "#edf4ed",
                              padding: "2px 7px",
                              borderRadius: 4,
                              fontSize: 9.5,
                              color: "#286442",
                              fontWeight: 600,
                            }}
                          >
                            {it.category || "Agricultural Produce"}
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
                          {money(itemAmount)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Financial Breakdown Rows */}
                  <tr style={{ background: "#fafdfa", borderTop: "1px solid #d8e4d9" }}>
                    <td colSpan={5} style={{ padding: "8px 12px", textAlign: "right", color: "#4f6a57", fontWeight: 600 }}>
                      Subtotal:
                    </td>
                    <td colSpan={2} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1b4429" }}>
                      {money(subtotal)}
                    </td>
                  </tr>

                  {discount > 0 && (
                    <tr style={{ background: "#fafdfa" }}>
                      <td colSpan={5} style={{ padding: "6px 12px", textAlign: "right", color: "#4f6a57" }}>
                        Discount:
                      </td>
                      <td colSpan={2} style={{ padding: "6px 12px", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>
                        −{money(discount)}
                      </td>
                    </tr>
                  )}

                  {tax > 0 && (
                    <tr style={{ background: "#fafdfa" }}>
                      <td colSpan={5} style={{ padding: "6px 12px", textAlign: "right", color: "#4f6a57" }}>
                        Tax / GST:
                      </td>
                      <td colSpan={2} style={{ padding: "6px 12px", textAlign: "right", color: "#374151", fontWeight: 600 }}>
                        +{money(tax)}
                      </td>
                    </tr>
                  )}

                  <tr style={{ background: "#f1f8f2", borderTop: "2px solid #286442" }}>
                    <td colSpan={5} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#163f25", fontSize: 12 }}>
                      Total Purchase Amount:
                    </td>
                    <td colSpan={2} style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#156734", fontSize: 15 }}>
                      {money(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Wallet & Payment Details Card */}
            <div
              style={{
                background: "#f7faf7",
                border: "1.5px solid #c9decb",
                borderRadius: 8,
                padding: "14px 16px",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #e1ede3",
                  paddingBottom: 8,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 750, color: "#184528", fontSize: 12 }}>
                  <Wallet size={16} color="#286442" />
                  <span>WALLET &amp; PAYMENT DETAILS</span>
                </div>
                <span
                  style={{
                    background: "#e8f5e9",
                    color: "#1b5e20",
                    border: "1px solid #a5d6a7",
                    borderRadius: 4,
                    padding: "3px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Payment Mode: {paymentMethod}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  textAlign: "center",
                  background: "#ffffff",
                  border: "1px solid #dce8dd",
                  borderRadius: 6,
                  padding: "10px 12px",
                }}
              >
                <div>
                  <small style={{ color: "#66786c", fontSize: 10, display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                    Previous Wallet Balance
                  </small>
                  <strong style={{ fontSize: 14, color: "#1e3b2b" }}>{money(openingBalance)}</strong>
                </div>

                <div>
                  <small style={{ color: "#66786c", fontSize: 10, display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                    Purchase Amount Deducted
                  </small>
                  <strong style={{ fontSize: 14, color: isWalletPayment && walletDebit > 0 ? "#dc2626" : "#64748b" }}>
                    {isWalletPayment && walletDebit > 0 ? `−${money(walletDebit)}` : "₹0 (Non-wallet)"}
                  </strong>
                </div>

                <div>
                  <small style={{ color: "#66786c", fontSize: 10, display: "block", textTransform: "uppercase", fontWeight: 600 }}>
                    Remaining Wallet Balance
                  </small>
                  <strong style={{ fontSize: 15, color: "#15803d" }}>{money(closingBalance)}</strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 10.5,
                  color: "#4f6a57",
                }}
              >
                <span>
                  <b>Calculation Formula:</b> Remaining Balance ({money(closingBalance)}) = Previous Balance ({money(openingBalance)}) − Amount Deducted ({money(walletDebit)})
                </span>
                <span style={{ fontWeight: 600, color: "#286442" }}>
                  Status: {isApproved ? "Approved & Settled" : "Recorded & Validated"}
                </span>
              </div>
            </div>

            {/* 6. Statutory Signatures & Authorizations */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                marginTop: 18,
                paddingTop: 12,
                borderTop: "1px dashed #cfdecf",
                textAlign: "center",
                fontSize: 10,
              }}
            >
              <div>
                <div style={{ height: 32, display: "grid", placeItems: "center" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "#edf5ee",
                      color: "#286442",
                      fontSize: 9,
                      fontWeight: 700,
                      border: "1px solid #cce1d1",
                    }}
                  >
                    <ShieldCheck size={11} /> Digitally Verified
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #9bb5a1", paddingTop: 4, fontWeight: 700, color: "#1b4429" }}>
                  Procurement / Purchase Officer
                </div>
                <div style={{ fontSize: 8.5, color: "#6b7d70" }}>{cashier}</div>
              </div>

              <div>
                <div style={{ height: 32, display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: 9.5, fontStyle: "italic", color: "#607466" }}>
                    Weighment Recorded · Stock Inward
                  </span>
                </div>
                <div style={{ borderTop: "1px solid #9bb5a1", paddingTop: 4, fontWeight: 700, color: "#1b4429" }}>
                  Godown Keeper / Store In-Charge
                </div>
                <div style={{ fontSize: 8.5, color: "#6b7d70" }}>{godown}</div>
              </div>

              <div>
                <div style={{ height: 32, display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: 9.5, fontStyle: "italic", color: "#607466" }}>
                    Supplied &amp; Confirmed
                  </span>
                </div>
                <div style={{ borderTop: "1px solid #9bb5a1", paddingTop: 4, fontWeight: 700, color: "#1b4429" }}>
                  {isSupplierPurchase ? "Supplier Signature" : "Farmer / Seller Signature"}
                </div>
                <div style={{ fontSize: 8.5, color: "#6b7d70" }}>
                  {isSupplierPurchase ? `${supplierName}` : `${farmerName} (${farmerId})`}
                </div>
              </div>
            </div>

            {/* 7. Statutory Governance Footer */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 8,
                borderTop: "1px solid #e2ede3",
                textAlign: "center",
                fontSize: 8.5,
                color: "#74887a",
                lineHeight: 1.4,
              }}
            >
              This is an official computer-generated Purchase Receipt issued by {fpcCompanyDetails.companyName} pursuant to the Companies Act, 2013 and cooperative procurement bylaws.
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
            padding: "12px 24px",
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
            {!isSupplierPurchase && onViewFarmerProfile && (
              <button
                type="button"
                className="em-btn"
                style={{
                  padding: "8px 16px",
                  fontSize: 11,
                  background: "#ffffff",
                  color: "#1b5e20",
                  borderColor: "#2e7d32",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 650,
                }}
                onClick={() => onViewFarmerProfile(farmerId)}
                title="View Farmer Details and History"
              >
                <User size={13} /> View Farmer Profile
              </button>
            )}

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
              onClick={handlePrint}
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

