import React from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Package,
  Printer,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  Wallet,
  X,
} from "lucide-react";
import { money, type RecordRow } from "@/lib/store";

export interface InputSaleItem {
  commodity?: string;
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;
  baseQuantity?: number;
  baseUnit?: string;
}

interface InputSaleReceiptProps {
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
  email: "store@greenvalleyfpc.in",
  mobile: "+91 9437004412",
  bankName: "State Bank of India",
  bankBranch: "Keonjhar",
  accountNo: "389201004821",
  ifsc: "SBIN0001234",
};

export default function InputSaleReceipt({
  receipt,
  farmer,
  onClose,
}: InputSaleReceiptProps) {
  const isApproved = receipt.status === "Approved";
  const isRejected = receipt.status === "Rejected";
  const isSubmitted = receipt.status === "Submitted" || !receipt.status;

  // Derive unique deterministic receipt number and voucher number
  const receiptNumber =
    receipt.receiptNumber ||
    (receipt.id
      ? receipt.id.replace("SAL-IN-", "SAL-IN-RCP-").replace("INV-", "INV-RCP-")
      : "SAL-IN-RCP-2026-0001");
  const voucherNumber = receipt.voucher || receipt.id || "SAL-IN-2026-0001";
  const transactionDate = receipt.date || "30 Oct 2026";
  const generationTime = receipt.created || receipt.receiptGeneratedAt || transactionDate;
  const storeName =
    receipt.storeName ||
    receipt.godown ||
    "Main FPC Store & Agro Centre (Keonjhar)";
  const storeId = receipt.storeId || "STR-01";
  const cashier = receipt.createdBy || receipt.approvedBy || "Mamata Jena (Sales Officer)";

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
  const mobile = farmer?.mobile || "9876544412";

  // Normalized line items
  const items: InputSaleItem[] =
    Array.isArray(receipt.items) && receipt.items.length > 0
      ? receipt.items
      : [
          {
            commodity: receipt.commodity || receipt.item || "Farm Inputs",
            category: receipt.category || "Inputs",
            quantity: Number(receipt.quantity) || 1,
            unit: receipt.unit || "unit",
            rate: Number(receipt.rate) || Number(receipt.amount) || 0,
            amount: Number(receipt.amount) || 0,
          },
        ];

  const totalAmount =
    Number(receipt.amount) ||
    items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  // Payment & Wallet Calculations
  const paymentMethod = receipt.paymentMethod || "Farmer Wallet";
  const isWalletPayment = paymentMethod === "Farmer Wallet" || paymentMethod === "Wallet";

  const openingBalance =
    receipt.openingWalletBalance !== undefined
      ? Number(receipt.openingWalletBalance)
      : isWalletPayment
      ? totalAmount + (receipt.closingWalletBalance !== undefined ? Number(receipt.closingWalletBalance) : 0)
      : 0;

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
      : 0;

  const walletTxnId = receipt.walletTxnId || receipt.reference || `TXN-2026-${voucherNumber.slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `${receiptNumber}_Store_Purchase_Receipt.pdf`;
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
            <ShoppingBag size={18} color="#a4e5b2" />
            <span style={{ fontWeight: 600, fontSize: "14px", letterSpacing: "0.2px" }}>
              Store Purchase Receipt & Tax Invoice • {receiptNumber}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#2e563e",
                color: "#ffffff",
                border: "1px solid #3d6f51",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Printer size={14} /> Print Receipt
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#2e563e",
                color: "#ffffff",
                border: "1px solid #3d6f51",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#c2d6c9",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          className="em-printable-receipt"
          style={{
            padding: "28px 32px",
            overflowY: "auto",
            color: "#1c2a22",
            fontSize: "13px",
            lineHeight: 1.5,
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Header Section: Company Branding & Legal Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #234934",
              paddingBottom: "16px",
              marginBottom: "18px",
              gap: "20px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#234934",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "16px",
                  }}
                >
                  <Store size={20} />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#1c3829",
                      margin: 0,
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {fpcCompanyDetails.companyName}
                  </h1>
                  <span style={{ fontSize: "11px", color: "#4f6556", fontWeight: 500 }}>
                    Registered under the Companies Act, 2013 • CIN: {fpcCompanyDetails.cin}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#5a7061", marginTop: "6px", lineHeight: 1.4 }}>
                <div>{fpcCompanyDetails.registeredAddress}</div>
                <div>
                  GSTIN: <strong style={{ color: "#223929" }}>{fpcCompanyDetails.gstin}</strong> • PAN:{" "}
                  <strong style={{ color: "#223929" }}>{fpcCompanyDetails.pan}</strong> • Phone:{" "}
                  {fpcCompanyDetails.mobile}
                </div>
              </div>
            </div>

            {/* Document Title & Status Badge */}
            <div style={{ textAlign: "right", minWidth: "220px" }}>
              <div
                style={{
                  display: "inline-block",
                  background: "#edf5ee",
                  color: "#1b5e20",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                  border: "1px solid #c7e0cd",
                }}
              >
                FPC Store Counter Sale
              </div>
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#1c3829",
                  margin: "0 0 4px 0",
                  letterSpacing: "0.3px",
                }}
              >
                STORE PURCHASE RECEIPT
              </h2>
              <div style={{ fontSize: "11px", color: "#546a5c", fontWeight: 600 }}>
                TAX INVOICE • INPUT SUPPLY
              </div>
              <div style={{ fontSize: "11px", color: "#166534", fontWeight: 700, marginTop: "2px" }}>
                ✓ {isWalletPayment ? "Paid via Member Wallet" : "Paid at Counter"}
              </div>
            </div>
          </div>

          {/* Metadata Cards: Store/Transaction Info & Farmer Profile */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            {/* Store & Transaction Card */}
            <div
              style={{
                background: "#f8faf9",
                border: "1px solid #d9e6dc",
                borderRadius: "8px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#286442",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Store size={13} /> FPC Store & Sale Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 10px", fontSize: "12px" }}>
                <span style={{ color: "#617468" }}>Store Location:</span>
                <strong style={{ color: "#1c3829" }}>{storeName}</strong>

                <span style={{ color: "#617468" }}>Receipt Number:</span>
                <strong className="em-mono" style={{ color: "#1c3829" }}>{receiptNumber}</strong>

                <span style={{ color: "#617468" }}>Order / Voucher:</span>
                <strong className="em-mono" style={{ color: "#1c3829" }}>{voucherNumber}</strong>

                <span style={{ color: "#617468" }}>Date & Time:</span>
                <span style={{ color: "#1c3829" }}>{transactionDate} • {generationTime}</span>

                <span style={{ color: "#617468" }}>Store Attendant:</span>
                <span style={{ color: "#1c3829" }}>{cashier}</span>
              </div>
            </div>

            {/* Farmer (Customer) Profile Card */}
            <div
              style={{
                background: "#f8faf9",
                border: "1px solid #d9e6dc",
                borderRadius: "8px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#286442",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <User size={13} /> Farmer / Member Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 10px", fontSize: "12px" }}>
                <span style={{ color: "#617468" }}>Farmer Name:</span>
                <strong style={{ color: "#1c3829", fontSize: "13px" }}>{farmerName}</strong>

                <span style={{ color: "#617468" }}>Farmer ID:</span>
                <strong className="em-mono" style={{ color: "#1c3829" }}>{farmerId}</strong>

                <span style={{ color: "#617468" }}>Mobile:</span>
                <span style={{ color: "#1c3829" }}>{mobile}</span>

                <span style={{ color: "#617468" }}>Village / Block:</span>
                <span style={{ color: "#1c3829" }}>{village}, {block}</span>

                <span style={{ color: "#617468" }}>District / State:</span>
                <span style={{ color: "#1c3829" }}>{district}, Odisha</span>
              </div>
            </div>
          </div>

          {/* Itemized Purchased Products Table */}
          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#286442",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Package size={13} /> Purchased Products / Items
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                border: "1px solid #d9e6dc",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#eef5f0", borderBottom: "1px solid #d9e6dc", color: "#1c3829" }}>
                  <th style={{ padding: "8px 10px", textAlign: "left", width: "40px" }}>#</th>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Product / Commodity Description</th>
                  <th style={{ padding: "8px 10px", textAlign: "left", width: "100px" }}>Category</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", width: "90px" }}>Quantity</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", width: "110px" }}>Unit Rate (₹)</th>
                  <th style={{ padding: "8px 10px", textAlign: "right", width: "120px" }}>Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #edf2ee",
                      background: idx % 2 === 0 ? "#ffffff" : "#fbfdfc",
                    }}
                  >
                    <td style={{ padding: "9px 10px", color: "#687a70" }}>{idx + 1}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <strong style={{ color: "#1c3829" }}>{it.commodity || it.name}</strong>
                    </td>
                    <td style={{ padding: "9px 10px", color: "#546a5c" }}>
                      <span
                        style={{
                          background: "#edf5ee",
                          color: "#286442",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 600,
                        }}
                      >
                        {it.category || "Farm Input"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "#1c3829", fontWeight: 600 }}>
                      {it.quantity} {it.unit}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "#1c3829" }}>
                      {money(Number(it.rate || 0))}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "#1c3829", fontWeight: 700 }}>
                      {money(Number(it.amount || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8faf9", borderTop: "2px solid #d9e6dc", fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: "10px", textAlign: "right", color: "#4f6556" }}>
                    Gross Purchase Amount:
                  </td>
                  <td colSpan={2} style={{ padding: "10px", textAlign: "right", fontSize: "14px", color: "#15803d" }}>
                    {money(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* DEDICATED WALLET TRANSACTION BREAKDOWN SECTION */}
          <div
            data-testid="receipt-wallet-breakdown"
            style={{
              background: "#f0fdf4",
              border: "1.5px solid #86efac",
              borderRadius: "8px",
              padding: "14px 16px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #bbf7d0",
                paddingBottom: "8px",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wallet size={16} color="#15803d" />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#166534",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Farmer Wallet Settlement Breakdown
                </span>
              </div>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#15803d",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid #86efac",
                }}
              >
                Payment Method: {paymentMethod}
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "10px",
                textAlign: "center",
              }}
            >
              {/* Opening Balance */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                  Opening Wallet Balance
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                  {money(openingBalance)}
                </div>
              </div>

              {/* Purchase Amount */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                  Purchase Amount
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#b45309", marginTop: "4px" }}>
                  {money(totalAmount)}
                </div>
              </div>

              {/* Wallet Debit */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #fca5a5",
                }}
              >
                <div style={{ fontSize: "10px", color: "#991b1b", textTransform: "uppercase", fontWeight: 700 }}>
                  Wallet Debit
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#dc2626", marginTop: "4px" }}>
                  −{money(walletDebit)}
                </div>
              </div>

              {/* Closing Wallet Balance */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1.5px solid #22c55e",
                }}
              >
                <div style={{ fontSize: "10px", color: "#15803d", textTransform: "uppercase", fontWeight: 800 }}>
                  Closing Wallet Balance
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#166534", marginTop: "4px" }}>
                  {money(closingBalance)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "10px",
                paddingTop: "8px",
                borderTop: "1px dashed #bbf7d0",
                fontSize: "11px",
                color: "#166534",
              }}
            >
              <span>
                <strong>Wallet Ledger Ref:</strong> <code className="em-mono">{walletTxnId}</code>
              </span>
              <span>
                <strong>Settlement Status:</strong>{" "}
                <span style={{ fontWeight: 700 }}>
                  {isWalletPayment ? "Debited from Member Wallet · Full Settlement" : "Paid at Counter"}
                </span>
              </span>
            </div>
          </div>

          {/* Terms, Conditions & Signatures */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "20px",
              borderTop: "1px solid #d9e6dc",
              paddingTop: "14px",
              marginTop: "10px",
              fontSize: "11px",
              color: "#546a5c",
            }}
          >
            <div>
              <strong style={{ color: "#223929", display: "block", marginBottom: "4px" }}>
                Declaration & Terms of Supply:
              </strong>
              <p style={{ margin: "0 0 4px 0", lineHeight: 1.4 }}>
                1. Inputs supplied through Green Valley FPC store outlets are certified for quality and authenticity.
              </p>
              <p style={{ margin: "0 0 4px 0", lineHeight: 1.4 }}>
                2. Wallet debits are instantaneously recorded in the member's financial ledger and available for audit.
              </p>
              <p style={{ margin: 0, lineHeight: 1.4 }}>
                3. This is a computer-generated tax invoice and store procurement receipt.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", textAlign: "right" }}>
              <div style={{ height: "36px" }}></div>
              <div
                style={{
                  borderTop: "1px dashed #9cb5a3",
                  paddingTop: "4px",
                  fontWeight: 600,
                  color: "#223929",
                }}
              >
                For {fpcCompanyDetails.companyName}
                <div style={{ fontSize: "10px", color: "#687a70", fontWeight: 400 }}>
                  Store Attendant / Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

