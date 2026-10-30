import React, { useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Landmark,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  Sprout,
  User,
  Wallet,
} from "lucide-react";
import { money, type RecordRow, type State } from "@/lib/store";
import ProducePurchaseReceipt from "./ProducePurchaseReceipt";
import InputSaleReceipt from "./InputSaleReceipt";

interface FarmerFinancialOverviewProps {
  farmerId: string;
  state: State;
  setState: (updater: State | ((s: State) => State)) => void;
  role: string;
  setToast: (s: string) => void;
  go: (s: string) => void;
  onBack: () => void;
}

export default function FarmerFinancialOverview({
  farmerId,
  state,
  setState,
  role,
  setToast,
  go,
  onBack,
}: FarmerFinancialOverviewProps) {
  const [receiptModal, setReceiptModal] = useState<RecordRow | null>(null);

  // Helper for consistent INR currency formatting with ₹
  const formatInr = (n: number | string | undefined): string => {
    const num = Math.round(Number(n) || 0);
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // 1. Resolve Farmer Record
  const farmer =
    state.records.farmers?.find((f) => f.id === farmerId) ||
    state.records.farmerApplications?.find((f) => f.id === farmerId);

  if (!farmer) {
    return (
      <section className="em" style={{ padding: "20px 24px" }}>
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="em-btn"
            onClick={onBack}
            data-testid="farmer-overview-back"
          >
            <ArrowLeft size={14} /> Back to Farmer Settlement
          </button>
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5ede7",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
          }}
        >
          <AlertCircle size={36} color="#d97706" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 18, color: "#1f2937", marginBottom: 6 }}>
            Farmer Record Not Found
          </h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>
            No registered farmer with identifier <code>{farmerId}</code> exists in the FPC system.
          </p>
          <button type="button" className="em-btn primary" onClick={onBack}>
            Return to Settlement List
          </button>
        </div>
      </section>
    );
  }

  // 2. Financial Metrics Calculations from Source of Truth
  // Wallet balance
  const walletBalance = Number(state.walletBalances?.[farmer.id] ?? 0);

  // Purchases for this farmer (from purchases master and approved businessTransactions)
  const seedPurchases: RecordRow[] = Array.isArray(state.records?.purchases)
    ? state.records.purchases.filter((p) => p.farmerId === farmer.id)
    : [];
  const appTransactions: RecordRow[] = Array.isArray(state.records?.businessTransactions)
    ? state.records.businessTransactions.filter(
        (b) =>
          (b.flow === "Produce Purchase" || b.flowName === "Produce Purchase") &&
          (b.farmerId === farmer.id ||
            (b.party && farmer.name && b.party.includes(farmer.name))) &&
          !seedPurchases.some((p) => p.id === b.id)
      )
    : [];
  const allPurchases = [...seedPurchases, ...appTransactions].sort((a, b) =>
    String(b.date || b.created).localeCompare(String(a.date || a.created))
  );

  // Payment history for this farmer
  const payments: RecordRow[] = Array.isArray(state.records?.payments)
    ? state.records.payments.filter((p) => p.farmerId === farmer.id)
    : [];

  const paidPurchaseIds = new Set<string>([
    ...allPurchases
      .filter((p) => p.status === "Paid" || p.paymentStatus === "Paid")
      .map((p) => p.id),
    ...payments
      .filter((pay) => pay.purchaseId && pay.status === "Paid")
      .map((pay) => pay.purchaseId),
  ]);

  // Outstanding/due produce purchases (status not paid, not rejected)
  const duePurchases = allPurchases.filter(
    (p) => !paidPurchaseIds.has(p.id) && p.status !== "Rejected"
  );
  const outstandingAmount = duePurchases.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );
  const totalDues = outstandingAmount;

  // Advance balance (matching AdminModules.tsx logic)
  const advances: RecordRow[] = Array.isArray(state.records?.advances)
    ? state.records.advances.filter((a) => a.farmerId === farmer.id)
    : [];
  const advanceBalance = advances
    .filter((a) => Number(a.balance || 0) > 0)
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  // Wallet transactions for this farmer
  const walletTxns = Array.isArray(state.walletTransactions)
    ? state.walletTransactions
        .filter((w) => w.farmerId === farmer.id)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    : [];

  // Farmer avatar initials
  const initials = farmer.name
    ? farmer.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "FR";

  return (
    <section className="em" style={{ padding: "16px 24px" }} data-testid="farmer-financial-overview">
      {/* Top Navigation & Actions Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <button
          type="button"
          className="em-btn"
          onClick={onBack}
          data-testid="farmer-overview-back-btn"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={14} /> Back to Farmer Settlement
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="em-btn"
            onClick={() => window.print()}
            data-testid="farmer-overview-print-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Printer size={14} /> Print Overview
          </button>
        </div>
      </div>

      {/* Farmer Identity Hero Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #f7faf8 0%, #edf5f0 100%)",
          border: "1px solid #d8e5dc",
          borderRadius: 12,
          padding: "18px 22px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2d653f 0%, #1e452a 100%)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 0.5,
                boxShadow: "0 2px 6px rgba(45,101,63,0.25)",
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="em-kicker" style={{ margin: 0 }}>
                  Farmer Overview
                </span>
                <span
                  className="em-mono"
                  style={{
                    background: "#e3ede6",
                    color: "#205034",
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  data-testid="farmer-overview-id"
                >
                  {farmer.id}
                </span>
                <span
                  className="em-status"
                  style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4 }}
                >
                  {farmer.status || "Active"}
                </span>
                {farmer.kyc === "Verified" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: "#e8f5e9",
                      color: "#2e7d32",
                      padding: "2px 7px",
                      borderRadius: 4,
                    }}
                  >
                    <BadgeCheck size={12} /> KYC Verified
                  </span>
                )}
                {farmer.shareholder && farmer.shareholder !== "No" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: "#e0f2fe",
                      color: "#0369a1",
                      padding: "2px 7px",
                      borderRadius: 4,
                    }}
                  >
                    Shareholder: {farmer.shareholder}
                  </span>
                )}
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#183324",
                  margin: "4px 0 2px",
                }}
                data-testid="farmer-overview-name"
              >
                {farmer.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  color: "#546859",
                  fontSize: 12,
                  flexWrap: "wrap",
                  marginTop: 4,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Phone size={12} color="#2d653f" /> {farmer.mobile || "No phone on record"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={12} color="#2d653f" />{" "}
                  {farmer.village || "Green Valley"},{" "}
                  {farmer.block || "Keonjhar Sadar"},{" "}
                  {farmer.district || "Keonjhar"}
                </span>
                {farmer.land && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Sprout size={12} color="#2d653f" /> {farmer.land} · {farmer.crop || "Paddy"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              background: "#ffffff",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #d8e5dc",
            }}
          >
            <div style={{ fontSize: 10, color: "#657d6b", textTransform: "uppercase", fontWeight: 700 }}>
              Primary Settlement Account
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1c3829", marginTop: 2 }}>
              State Bank of India
            </div>
            <div className="em-mono" style={{ fontSize: 11, color: "#506956" }}>
              A/C: XXXXXX4821 · SBIN0001234
            </div>
          </div>
        </div>
      </div>

      {/* 4 Financial Summary Cards */}
      <div
        className="em-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Wallet Balance */}
        <div
          className="em-stat"
          data-testid="stat-wallet-balance"
          style={{
            background: "#ffffff",
            border: "1px solid #dbe6df",
            borderLeft: "4px solid #16a34a",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <small style={{ color: "#546859", fontWeight: 700, fontSize: 11 }}>WALLET BALANCE</small>
            <Wallet size={16} color="#16a34a" />
          </div>
          <b
            style={{
              fontSize: 24,
              color: "#166534",
              display: "block",
              margin: "6px 0 4px",
              fontWeight: 800,
            }}
          >
            {formatInr(walletBalance)}
          </b>
          <span style={{ fontSize: 11, color: "#617767" }}>Available cooperative wallet</span>
        </div>

        {/* Card 2: Outstanding Amount */}
        <div
          className="em-stat"
          data-testid="stat-outstanding-amount"
          style={{
            background: "#ffffff",
            border: "1px solid #dbe6df",
            borderLeft: "4px solid #d97706",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <small style={{ color: "#546859", fontWeight: 700, fontSize: 11 }}>OUTSTANDING AMOUNT</small>
            <Clock size={16} color="#d97706" />
          </div>
          <b
            style={{
              fontSize: 24,
              color: outstandingAmount > 0 ? "#b45309" : "#166534",
              display: "block",
              margin: "6px 0 4px",
              fontWeight: 800,
            }}
          >
            {formatInr(outstandingAmount)}
          </b>
          <span style={{ fontSize: 11, color: "#617767" }}>Pending procurement disbursement</span>
        </div>

        {/* Card 3: Total Dues */}
        <div
          className="em-stat"
          data-testid="stat-total-dues"
          style={{
            background: "#ffffff",
            border: "1px solid #dbe6df",
            borderLeft: "4px solid #2563eb",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <small style={{ color: "#546859", fontWeight: 700, fontSize: 11 }}>TOTAL DUES</small>
            <FileText size={16} color="#2563eb" />
          </div>
          <b
            style={{
              fontSize: 24,
              color: "#1d4ed8",
              display: "block",
              margin: "6px 0 4px",
              fontWeight: 800,
            }}
          >
            {formatInr(totalDues)}
          </b>
          <span style={{ fontSize: 11, color: "#617767" }}>
            {duePurchases.length} unsettled purchase intake(s)
          </span>
        </div>

        {/* Card 4: Advance Balance */}
        <div
          className="em-stat"
          data-testid="stat-advance-balance"
          style={{
            background: "#ffffff",
            border: "1px solid #dbe6df",
            borderLeft: "4px solid #64748b",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <small style={{ color: "#546859", fontWeight: 700, fontSize: 11 }}>ADVANCE BALANCE</small>
            <CreditCard size={16} color="#64748b" />
          </div>
          <b
            style={{
              fontSize: 24,
              color: advanceBalance > 0 ? "#b45309" : "#334155",
              display: "block",
              margin: "6px 0 4px",
              fontWeight: 800,
            }}
          >
            {formatInr(advanceBalance)}
          </b>
          <span style={{ fontSize: 11, color: "#617767" }}>
            {advanceBalance > 0 ? "Recoverable from next intake" : "No open crop advances"}
          </span>
        </div>
      </div>

      {/* SECTION 1: Outstanding Dues & Procurement Intakes */}
      <div className="em-panel" style={{ marginBottom: 24 }} data-testid="section-outstanding-dues">
        <div
          className="em-panel-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
          }}
        >
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15 }}>
              <FileText size={16} color="#2d653f" /> 1. Outstanding Dues &amp; Procurement Intakes
            </h3>
            <p style={{ margin: "3px 0 0", color: "#657d6b", fontSize: 12 }}>
              Intake records contributing to the farmer's outstanding amount. Click Receipt to view official procurement documentation.
            </p>
          </div>
          <span
            className="em-mono"
            style={{
              background: duePurchases.length ? "#fff3dc" : "#edf5ee",
              color: duePurchases.length ? "#92400e" : "#286442",
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {duePurchases.length} Unpaid / {allPurchases.length} Total
          </span>
        </div>

        {allPurchases.length > 0 ? (
          <div className="em-tablewrap">
            <table className="em-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Voucher ID</th>
                  <th>Date</th>
                  <th>Commodity / Produce</th>
                  <th>Intake Qty</th>
                  <th style={{ textAlign: "right" }}>Rate per Unit</th>
                  <th style={{ textAlign: "right" }}>Gross Value</th>
                  <th style={{ textAlign: "right" }}>Outstanding Due</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center" }}>Receipt</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allPurchases.map((p) => {
                  const isPaid = paidPurchaseIds.has(p.id);
                  const isDue = !isPaid && p.status !== "Rejected";
                  const grossVal = Number(p.amount) || (Number(p.quantity) || 0) * (Number(p.rate) || 0);
                  const dueVal = isPaid ? 0 : grossVal;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        background: isDue ? "#ffffff" : "#fbfdfc",
                      }}
                    >
                      <td className="em-mono" style={{ fontWeight: 600 }}>
                        {p.id}
                      </td>
                      <td>{p.date || "12 Oct 2026"}</td>
                      <td>
                        <strong>{p.commodity || p.item || "Paddy (common)"}</strong>
                      </td>
                      <td>
                        {p.quantity} {p.unit || "kg"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {p.rate ? `₹${p.rate} / ${p.unit || "kg"}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatInr(grossVal)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: isDue ? "#b45309" : "#166534",
                        }}
                      >
                        {formatInr(dueVal)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`em-status ${
                            isPaid
                              ? "active"
                              : p.status === "Approved"
                              ? "pending"
                              : p.status?.toLowerCase().includes("reject")
                              ? "rejected"
                              : "pending"
                          }`}
                        >
                          {isPaid ? "Paid" : p.paymentStatus || p.status || "Unsettled"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="em-smallbtn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            background: "#edf5ee",
                            color: "#286442",
                            padding: "3px 8px",
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                          data-testid={`receipt-btn-${p.id}`}
                          onClick={() => setReceiptModal(p)}
                          title="View Produce Purchase Receipt"
                        >
                          <FileText size={11} /> Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8faf9", fontWeight: 700 }}>
                  <td colSpan={5} style={{ textAlign: "right" }}>
                    Total Outstanding Dues:
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatInr(allPurchases.reduce((sum, p) => sum + Number(p.amount || 0), 0))}
                  </td>
                  <td style={{ textAlign: "right", color: "#b45309", fontSize: 13 }}>
                    {formatInr(outstandingAmount)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="em-empty">
            No produce purchase records found for this farmer.
          </div>
        )}
      </div>

      {/* SECTION 2: Wallet & Advance Activity */}
      <div className="em-panel" style={{ marginBottom: 24 }} data-testid="section-wallet-activity">
        <div
          className="em-panel-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
          }}
        >
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15 }}>
              <Wallet size={16} color="#2d653f" /> 2. Wallet &amp; Advance Activity
            </h3>
            <p style={{ margin: "3px 0 0", color: "#657d6b", fontSize: 12 }}>
              Cooperative wallet transactions, produce sale credits, input debits, and crop advances.
            </p>
          </div>
          <span
            className="em-mono"
            style={{
              background: "#edf5ee",
              color: "#286442",
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {walletTxns.length} Transaction(s)
          </span>
        </div>

        {walletTxns.length > 0 ? (
          <div className="em-tablewrap">
            <table className="em-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Date &amp; Time</th>
                  <th>Activity Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th style={{ textAlign: "right" }}>Credit (+)</th>
                  <th style={{ textAlign: "right" }}>Debit (-)</th>
                  <th style={{ textAlign: "right" }}>Wallet Balance</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {walletTxns.map((w) => {
                  const isCredit = w.direction === "Credit" || Number(w.walletEffect || 0) > 0;
                  const isDebit = w.direction === "Debit" || Number(w.walletEffect || 0) < 0;

                  return (
                    <tr key={w.id}>
                      <td className="em-mono">{w.id}</td>
                      <td>{w.date}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              w.type === "Sale credit"
                                ? "#166534"
                                : w.type === "Input purchase"
                                ? "#1e40af"
                                : "#475569",
                          }}
                        >
                          {w.type}
                        </span>
                      </td>
                      <td style={{ color: "#334155" }}>{w.description}</td>
                      <td className="em-mono" style={{ fontSize: 11 }}>
                        {w.reference || "—"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: isCredit ? "#15803d" : "#94a3b8",
                        }}
                      >
                        {isCredit ? `+${formatInr(w.amount)}` : "—"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: isDebit ? "#b91c1c" : "#94a3b8",
                        }}
                      >
                        {isDebit ? `-${formatInr(w.amount)}` : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                        {formatInr(w.walletBalanceAfter ?? walletBalance)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`em-status ${
                            w.status === "Credited" || w.status === "Paid"
                              ? "active"
                              : w.status === "Scheduled"
                              ? "pending"
                              : ""
                          }`}
                        >
                          {w.status || "Posted"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {(w.reference || w.type?.includes("purchase") || w.type?.includes("Purchase")) ? (
                          <button
                            type="button"
                            className="em-smallbtn"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              background: "#edf5ee",
                              color: "#286442",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 600,
                              fontSize: 11
                            }}
                            onClick={() => {
                              const found = (state.records?.businessTransactions || []).find(b => b.id === w.reference || b.voucher === w.reference);
                              if (found) {
                                setReceiptModal(found);
                              } else {
                                setReceiptModal({
                                  id: w.reference || w.id,
                                  voucher: w.reference || w.id,
                                  flow: "Input Sale",
                                  party: farmer.name,
                                  farmerId: farmer.id,
                                  commodity: w.description || "Farm Inputs",
                                  quantity: 1,
                                  unit: "lot",
                                  amount: w.amount,
                                  date: w.date?.split(" · ")[0] || "30 Oct 2026",
                                  paymentMethod: "Farmer Wallet",
                                  openingWalletBalance: Number(w.walletBalanceAfter || 0) + Number(w.amount || 0),
                                  walletDebit: Number(w.amount || 0),
                                  closingWalletBalance: Number(w.walletBalanceAfter || 0),
                                  status: "Approved",
                                  storeName: "Main FPC Store & Agro Centre (Keonjhar)"
                                });
                              }
                            }}
                            title="View Receipt"
                          >
                            <FileText size={10} /> Receipt
                          </button>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="em-empty">
            No wallet activity or ledger adjustments recorded for this farmer yet.
          </div>
        )}
      </div>

      {/* SECTION 3: Payment & Settlement History */}
      <div className="em-panel" style={{ marginBottom: 24 }} data-testid="section-payment-history">
        <div
          className="em-panel-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
          }}
        >
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 15 }}>
              <Landmark size={16} color="#2d653f" /> 3. Payment &amp; Settlement History
            </h3>
            <p style={{ margin: "3px 0 0", color: "#657d6b", fontSize: 12 }}>
              Bank transfers, settlement disbursements, and cleared payout vouchers for this farmer.
            </p>
          </div>
          <span
            className="em-mono"
            style={{
              background: "#edf5ee",
              color: "#286442",
              padding: "3px 10px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {payments.length} Recorded Payment(s)
          </span>
        </div>

        {payments.length > 0 ? (
          <div className="em-tablewrap">
            <table className="em-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Linked Purchase</th>
                  <th>Method</th>
                  <th>Bank UTR / Reference</th>
                  <th style={{ textAlign: "right" }}>Amount Settled</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="em-mono" style={{ fontWeight: 600 }}>
                      {pay.id}
                    </td>
                    <td>{pay.date}</td>
                    <td className="em-mono">
                      {pay.purchaseId || "PUR-2026-0001"}
                    </td>
                    <td>{pay.method || "Bank transfer"}</td>
                    <td className="em-mono" style={{ fontSize: 11 }}>
                      {pay.reference || "UTIB2026101200451"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#166534" }}>
                      {formatInr(pay.amount)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="em-status active">{pay.status || "Paid"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="em-empty">
            No previous payment settlements recorded for this farmer.
          </div>
        )}
      </div>

      {/* Receipt Modal Integration */}
      {receiptModal && (
        (receiptModal.flow === "Input Sale" || receiptModal.flowName === "Input Sale" || receiptModal.id?.startsWith("SAL-IN-") || receiptModal.id?.startsWith("INV-") || receiptModal.type === "Store purchase" || receiptModal.type === "Input purchase") ? (
          <InputSaleReceipt
            receipt={receiptModal}
            farmer={farmer}
            onClose={() => setReceiptModal(null)}
          />
        ) : (
          <ProducePurchaseReceipt
            receipt={receiptModal}
            farmer={farmer}
            onClose={() => setReceiptModal(null)}
          />
        )
      )}
    </section>
  );
}

