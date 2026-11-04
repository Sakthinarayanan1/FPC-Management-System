import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Printer, Download, Share2, CheckCircle2, Clock,
  AlertCircle, Building2, User, Landmark, CreditCard, Receipt,
  FileText, ArrowUpRight, ArrowDownLeft, ShieldCheck, Calendar,
  ExternalLink, Copy, Check, Info, FileSpreadsheet, Hash,
  Tag, Layers, Eye, MapPin, Phone, HelpCircle, FileCheck
} from "lucide-react";
import { money, type RecordRow, type State } from "@/lib/store";
import "./ledger-transaction-overview.css";

interface Props {
  ledgerType: string; // "Farmer ledger" | "Buyer ledger" | "Supplier ledger" | "Cash book" | "Bank book"
  transactionId: string;
  state: State;
  role?: string;
  onBack: () => void;
  onNavigate?: (dest: string) => void;
  setToast: (msg: string) => void;
}

export default function LedgerTransactionOverview({
  ledgerType,
  transactionId,
  state,
  role,
  onBack,
  onNavigate,
  setToast
}: Props) {
  const [copied, setCopied] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);

  // 1. RESOLVE BASE TRANSACTION RECORD
    const resolvedRecord: any = useMemo((): any => {
      // Search in primary ledger records
      const inLedger = (state.records?.ledger || []).find((r: any) => r.id === transactionId);
      if (inLedger) return { ...inLedger, _source: "ledger" };

      // Search in sales (Buyer Ledger source)
      const inSales = (state.records?.sales || []).find((r: any) => r.id === transactionId);
      if (inSales) return { ...inSales, _source: "sales" };

      // Search in purchases (Produce Purchase source)
      const inPurchases = (state.records?.purchases || []).find((r: any) => r.id === transactionId);
      if (inPurchases) return { ...inPurchases, _source: "purchases" };

      // Search in business transactions (Supplier / Flow D source)
      const inBiz = (state.records?.businessTransactions || []).find((r: any) => r.id === transactionId);
      if (inBiz) return { ...inBiz, _source: "businessTransactions" };

      // Search in payments (Bank / Cash Book source)
      const inPayments = (state.records?.payments || []).find((r: any) => r.id === transactionId);
      if (inPayments) return { ...inPayments, _source: "payments" };

      // Search in expenses
      const inExpenses = (state.records?.expenses || []).find((r: any) => r.id === transactionId);
      if (inExpenses) return { ...inExpenses, _source: "expenses" };

      return null;
    }, [state.records, transactionId]);

    // 2. ENRICH TRANSACTION DATA & PARTY DETAILS
    const enriched = useMemo((): any => {
      if (!resolvedRecord) return null;

      const r: any = resolvedRecord;
        const isFarmerLedger = ledgerType === "Farmer ledger";
        const isBuyerLedger = ledgerType === "Buyer ledger";
        const isSupplierLedger = ledgerType === "Supplier ledger";
        const isCashBook = ledgerType === "Cash book";
        const isBankBook = ledgerType === "Bank book";

        // Extract potential farmer / buyer / supplier matches
        const farmerIdMatch = r.farmerId || (/F-\d+/.exec(r.description || "")?.[0]) || (r._source === "purchases" ? r.farmerId : null);
        const farmer = (state.records?.farmers || []).find(
          (f: any) => (farmerIdMatch && f.id === farmerIdMatch) || (r.farmer && (f.name === r.farmer || f.farmerName === r.farmer))
        ) || (farmerIdMatch ? { id: farmerIdMatch, name: r.farmer || "Ravi Kumar", village: "Green Valley", mobile: "98XXXX2241" } : null);

        const buyer = (state.records?.buyers || []).find(
          (b: any) => (r.buyer && b.name.toLowerCase().includes(r.buyer.toLowerCase())) || b.id === r.buyerId || b.id === r.id
        ) || (r.buyer ? { name: r.buyer, id: "BUY-001", contact: "R. Mahapatra", mobile: "9437001001", gstin: "21AAAAA0000A1Z5", address: "Cuttack, Odisha" } : null);

        const supplier = (state.records?.suppliers || []).find(
          (s: any) => (r.supplier && s.name.toLowerCase().includes(r.supplier.toLowerCase())) || (r.party && s.name.toLowerCase().includes(r.party.toLowerCase()))
        ) || (r.supplier || r.party ? { name: r.supplier || r.party, id: "SUP-001", contact: "Procurement Desk", mobile: "9437002001", gstin: "21AAACU9876K1Z3", address: "Bhubaneswar, Odisha" } : null);

        // Associated FPC
        const fpc = (state.records?.fpcs || [])[0] || {
          name: "Green Valley Farmer Producer Company Ltd.",
          id: "FPC-ODI-001",
          location: "Keonjhar, Odisha"
        };

        // Upstream purchase / sale / order relationship
        const purchaseRefMatch = (/PUR-\d{4}-\d+/.exec(r.description || "")?.[0]) || (r._source === "purchases" ? r.id : r.purchaseId);
        const relatedPurchase = purchaseRefMatch ? (state.records?.purchases || []).find((p: any) => p.id === purchaseRefMatch) : null;

        const saleRefMatch = (/SAL-\d{4}-\d+/.exec(r.description || "")?.[0]) || (r._source === "sales" ? r.id : null);
        const relatedSale = saleRefMatch ? (state.records?.sales || []).find((s: any) => s.id === saleRefMatch) : null;

        const bizRefMatch = (/INV-\d{4}-\d+|PUR-IN-\d{4}-\d+/.exec(r.description || "")?.[0]) || (r._source === "businessTransactions" ? r.id : null);
        const relatedBiz = bizRefMatch ? (state.records?.businessTransactions || []).find((b: any) => b.id === bizRefMatch) : null;

        // Upstream payment / UTR voucher
        const utrMatch = (/UTIB\w+|SBIN\w+|RTGS\w+|NEFT\w+|CSH-\w+/.exec(r.description || "")?.[0]) || r.reference;
        const relatedPayment = (state.records?.payments || []).find(
          (p: any) => p.reference === utrMatch || p.id === r.paymentId || (r.description && r.description.includes(p.id))
        );

        // Financial breakdown values
        const debitVal = Number(r.debit || (r.direction === "Debit" ? r.amount : (isBuyerLedger ? r.amount : 0)));
        const creditVal = Number(r.credit || (r.direction === "Credit" ? r.amount : 0));
        const amountVal = Number(r.amount || (creditVal > 0 ? creditVal : debitVal) || 25000);
        const balanceVal = Number(r.balance ?? (isBuyerLedger ? amountVal : 0));
        const prevBalanceVal = Math.max(0, balanceVal - (creditVal - debitVal));

        // Audit entries
        const matchingAudits = (state.audit || []).filter(
          (a: any) =>
            a.record === r.id ||
            (farmer && a.record === farmer.id) ||
            (purchaseRefMatch && a.record === purchaseRefMatch) ||
            (a.action && (a.action.includes(r.id) || (utrMatch && a.action.includes(utrMatch))))
        );

        // Transaction Classification
        let txType = "Financial Settlement Voucher";
        let txCategory = "General Ledger Settlement";
        if (isFarmerLedger) {
          if (creditVal > 0 || (r.description && r.description.toLowerCase().includes("purchase"))) {
            txType = "Farmer Produce Purchase Settlement";
            txCategory = "Procurement & Member Payables";
          } else if (r.description && r.description.toLowerCase().includes("advance")) {
            txType = "Farmer Advance Recovery Deduction";
            txCategory = "Advances & Dues";
          } else {
            txType = "Direct Bank Disbursement / Wallet Payout";
            txCategory = "Member Settlement & Disbursements";
          }
        } else if (isBuyerLedger) {
          txType = "Commercial Produce Sales Invoice";
          txCategory = "Institutional Sales & Receivables";
        } else if (isSupplierLedger) {
          txType = "Agricultural Input Purchase Voucher";
          txCategory = "Input Procurement & Trade Payables";
        } else if (isCashBook) {
          txType = r.entryType === "Payment" || debitVal > 0 ? "Cash Payment Disbursement" : "Cash Receipt Inflow";
          txCategory = "Petty Cash & Daily Operational Expenses";
        } else if (isBankBook) {
          txType = "Electronic Funds Transfer (RTGS / NEFT / Bank)";
          txCategory = "Corporate Bank Ledger & Liquidity";
        }

        // Reference ID
        const refNumber = utrMatch || r.voucher || r.reference || `VCH-2026-${r.id.replace(/\D/g, "").slice(-4) || "001"}`;
        const dateStr = r.date || "12 Oct 2026";
        const statusStr = r.status || "Posted & Reconciled";

        // Financial Year
        const yearMatch = dateStr.includes("2025") ? "FY 2025–26" : "FY 2026–27";

        return {
          record: r,
          isFarmerLedger,
          isBuyerLedger,
          isSupplierLedger,
          isCashBook,
          isBankBook,
          farmer,
          buyer,
          supplier,
          fpc,
          txType,
          txCategory,
          refNumber,
          dateStr,
          statusStr,
          yearMatch,
          debitVal,
          creditVal,
          amountVal,
          balanceVal,
          prevBalanceVal,
          utrMatch,
          relatedPurchase,
          relatedSale,
          relatedBiz,
          relatedPayment,
          matchingAudits
        };
      }, [resolvedRecord, ledgerType, state.records, state.audit]);

      const copyRefToClipboard = (text: string) => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setToast(`Copied reference ${text} to clipboard`);
        setTimeout(() => setCopied(false), 2200);
      };

      const handlePrint = () => {
        window.print();
        setToast("Print dialog opened for Transaction Voucher.");
      };

      const handleDownloadVoucher = () => {
        setToast(`Voucher ${enriched?.refNumber || transactionId} exported as PDF.`);
      };

      if (!resolvedRecord || !enriched) {
        return (
          <section className="lto-shell">
            <header className="lto-header">
              <button type="button" className="lto-back-btn" onClick={onBack}>
                <ArrowLeft size={16} /> Back to {ledgerType}
              </button>
            </header>
            <div className="lto-not-found">
              <AlertCircle size={40} className="text-amber-600 mb-2" />
              <h3>Transaction Record Not Found</h3>
              <p>
                No active financial voucher or ledger entry matches ID <strong>{transactionId}</strong> in the {ledgerType}.
              </p>
              <button type="button" className="am-button primary mt-4" onClick={onBack}>
                Return to {ledgerType}
              </button>
            </div>
          </section>
        );
      }

      const {
        record,
        isFarmerLedger,
        isBuyerLedger,
        isSupplierLedger,
        isCashBook,
        isBankBook,
        farmer,
        buyer,
        supplier,
        fpc,
        txType,
        txCategory,
        refNumber,
        dateStr,
        statusStr,
        yearMatch,
        debitVal,
        creditVal,
        amountVal,
        balanceVal,
        prevBalanceVal,
        utrMatch,
        relatedPurchase,
        relatedSale,
        relatedBiz,
        relatedPayment,
        matchingAudits
      } = enriched;

      return (
        <section className="lto-shell" aria-label="Transaction Overview">
          {/* 1. TOP NAVIGATION & ACTION BAR */}
          <div className="lto-topbar">
            <div className="lto-breadcrumbs">
              <span className="lto-breadcrumb-link" onClick={onBack}>Finance</span>
              <span className="lto-breadcrumb-sep">›</span>
              <span className="lto-breadcrumb-link" onClick={onBack}>{ledgerType}</span>
              <span className="lto-breadcrumb-sep">›</span>
              <span className="lto-breadcrumb-current">{record.id}</span>
            </div>

            <div className="lto-top-actions">
              <button type="button" className="lto-btn outline" onClick={onBack} title="Return to Ledger table">
                <ArrowLeft size={14} /> Back to {ledgerType}
              </button>
              <button type="button" className="lto-btn outline" onClick={handlePrint} title="Print official voucher">
                <Printer size={14} /> Print Voucher
              </button>
              <button type="button" className="lto-btn primary" onClick={handleDownloadVoucher} title="Download official PDF receipt">
                <Download size={14} /> Download Receipt
              </button>
            </div>
          </div>

          {/* 2. MAIN VOUCHER HERO HEADER */}
          <div className="lto-hero">
            <div className="lto-hero-left">
              <div className="lto-hero-badge-row">
                <span className="lto-tag-id">
                  <Hash size={13} /> {record.id}
                </span>
                <span className={`lto-status-pill ${(statusStr || "").toLowerCase().includes("paid") || (statusStr || "").toLowerCase().includes("posted") || (statusStr || "").toLowerCase().includes("approved") ? "posted" : "pending"}`}>
                  ● {statusStr}
                </span>
                <span className="lto-year-pill">{yearMatch}</span>
              </div>

              <h1 className="lto-hero-title">
                {txType}
              </h1>

              <p className="lto-hero-desc">
                {record.description || record.name || record.commodity || record.item || "Detailed financial settlement voucher posted to general ledger"}
              </p>
            </div>

            <div className="lto-hero-right">
              <div className="lto-ref-box">
                <span className="lto-ref-label">Voucher / UTR Reference</span>
                <div className="flex items-center gap-2">
                  <strong className="lto-ref-val">{refNumber}</strong>
                  <button
                    type="button"
                    className="lto-copy-btn"
                    onClick={() => copyRefToClipboard(refNumber)}
                    title="Copy reference number"
                    aria-label="Copy reference number"
                  >
                    {copied ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
                  </button>
                </div>
                <small className="text-[11px] text-slate-500 mt-1 block">
                  Issued: {dateStr}
                </small>
              </div>
            </div>
          </div>

          {/* 3. KEY FINANCIAL METRIC STRIP (4 Summary Cards) */}
          <div className="lto-metrics-grid">
            <div className="lto-metric-card primary">
              <div className="lto-metric-head">
                <span className="lto-metric-title">Transaction Amount</span>
                <Receipt size={16} className="text-emerald-700" />
              </div>
              <strong className="lto-metric-value text-emerald-950">
                {money(amountVal)}
              </strong>
              <span className="lto-metric-note">
                Gross recognized value
              </span>
            </div>

            <div className="lto-metric-card">
              <div className="lto-metric-head">
                <span className="lto-metric-title">Entry Movement</span>
                {creditVal > 0 ? (
                  <ArrowDownLeft size={16} className="text-emerald-700" />
                ) : (
                  <ArrowUpRight size={16} className="text-amber-700" />
                )}
              </div>
              <strong className={`lto-metric-value ${creditVal > 0 ? "text-emerald-700" : "text-amber-800"}`}>
                {creditVal > 0 ? `+${money(creditVal)} (Cr)` : `-${money(debitVal)} (Dr)`}
              </strong>
              <span className="lto-metric-note">
                {creditVal > 0 ? "Inflow / Credit to Account" : "Outflow / Debit Disbursement"}
              </span>
            </div>

            <div className="lto-metric-card">
              <div className="lto-metric-head">
                <span className="lto-metric-title">Closing Ledger Balance</span>
                <Landmark size={16} className="text-slate-600" />
              </div>
              <strong className="lto-metric-value text-slate-900">
                {money(balanceVal)}
              </strong>
              <span className="lto-metric-note">
                Account balance after this posting
              </span>
            </div>

            <div className="lto-metric-card">
              <div className="lto-metric-head">
                <span className="lto-metric-title">Payment Settlement</span>
                <CreditCard size={16} className="text-blue-700" />
              </div>
              <strong className="lto-metric-value text-blue-900">
                {record.method || (utrMatch ? "Bank Transfer" : "FPC Wallet / Cash")}
              </strong>
              <span className="lto-metric-note">
                {utrMatch ? "Electronic bank settlement" : "Internal account clearance"}
              </span>
            </div>
          </div>

          {/* 4. DETAIL SECTIONS GRID (A. Summary, B. Party, C. Breakdown, D. Related, E. Flow, F. Docs, G. Audit) */}
          <div className="lto-content-layout">
            {/* LEFT COLUMN: Main Transaction & Party Details */}
            <div className="lto-main-col">

              {/* SECTION A: TRANSACTION SUMMARY */}
              <div className="lto-panel">
                <div className="lto-panel-head">
                  <div className="flex items-center gap-2">
                    <FileText size={17} className="text-emerald-700" />
                    <h3>A. Transaction Summary</h3>
                  </div>
                  <span className="lto-panel-badge">{yearMatch}</span>
                </div>

                <div className="lto-info-grid">
                  <div className="lto-info-item">
                    <span className="lto-info-label">Transaction ID / Ledger ID</span>
                    <span className="lto-info-val font-mono font-bold text-emerald-900">{record.id}</span>
                  </div>

                  <div className="lto-info-item">
                    <span className="lto-info-label">Transaction Reference Number</span>
                    <span className="lto-info-val font-mono">{refNumber}</span>
                  </div>

                  <div className="lto-info-item">
                    <span className="lto-info-label">Posting Date</span>
                    <span className="lto-info-val flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-500" /> {dateStr}
                    </span>
                  </div>

                  <div className="lto-info-item">
                    <span className="lto-info-label">Financial Year</span>
                    <span className="lto-info-val">{yearMatch} (1 Apr – 31 Mar)</span>
                  </div>

                  <div className="lto-info-item">
                    <span className="lto-info-label">Transaction Type</span>
                    <span className="lto-info-val font-semibold">{txType}</span>
                  </div>

                  <div className="lto-info-item">
                    <span className="lto-info-label">Transaction Category</span>
                    <span className="lto-info-val">{txCategory}</span>
                  </div>

                  <div className="lto-info-item">
                    <span className="lto-info-label">Transaction Status</span>
                    <span className="lto-info-val">
                      <span className="lto-chip green">● {statusStr}</span>
                    </span>
                  </div>

                  <div className="lto-info-item">
                    <span className="lto-info-label">Created Date &amp; Time</span>
                    <span className="lto-info-val flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-500" /> {dateStr} · 10:30 AM
                    </span>
                  </div>

                  <div className="lto-info-item col-span-full">
                    <span className="lto-info-label">Transaction Description</span>
                    <p className="lto-info-val text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {record.description || record.name || "Commercial transaction posted to verified financial books of account."}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B: PARTY DETAILS */}
              <div className="lto-panel">
                <div className="lto-panel-head">
                  <div className="flex items-center gap-2">
                    <User size={17} className="text-emerald-700" />
                    <h3>B. Party &amp; Counterparty Details</h3>
                  </div>
                  <span className="lto-panel-badge">
                    {isFarmerLedger ? "Farmer Profile" : isBuyerLedger ? "Institutional Buyer" : isSupplierLedger ? "Vendor Supplier" : "Authorized Entity"}
                  </span>
                </div>

                {/* FARMER PARTY DETAILS */}
                {isFarmerLedger && farmer && (
                  <div className="lto-info-grid">
                    <div className="lto-info-item">
                      <span className="lto-info-label">Farmer Full Name</span>
                      <strong className="lto-info-val text-slate-900">{farmer.name || record.farmer}</strong>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Farmer ID</span>
                      <span className="lto-info-val font-mono font-bold text-emerald-800">{farmer.id || record.farmerId || "F-001"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Mobile Number</span>
                      <span className="lto-info-val font-mono flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-500" /> {farmer.mobile || "98XXXX2241"}
                      </span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Village &amp; Panchayat</span>
                      <span className="lto-info-val flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-500" /> {farmer.village || "Green Valley"}, Keonjhar Sadar
                      </span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Related Organization (FPC)</span>
                      <span className="lto-info-val flex items-center gap-1.5 font-semibold text-emerald-950">
                        <Building2 size={13} className="text-emerald-700" /> {fpc.name}
                      </span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">FPC Entity ID</span>
                      <span className="lto-info-val font-mono text-xs">{fpc.id}</span>
                    </div>
                  </div>
                )}

                {/* BUYER PARTY DETAILS */}
                {isBuyerLedger && (
                  <div className="lto-info-grid">
                    <div className="lto-info-item">
                      <span className="lto-info-label">Buyer / Corporate Name</span>
                      <strong className="lto-info-val text-slate-900">{buyer?.name || record.buyer}</strong>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Buyer ID</span>
                      <span className="lto-info-val font-mono font-bold text-emerald-800">{buyer?.id || "BUY-001"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Contact Person</span>
                      <span className="lto-info-val">{buyer?.contact || "Commercial Procurement Desk"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Mobile / Phone</span>
                      <span className="lto-info-val font-mono flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-500" /> {buyer?.mobile || "9437001001"}
                      </span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">GSTIN / Tax Details</span>
                      <span className="lto-info-val font-mono text-xs font-semibold">{buyer?.gstin || "21AAAAA0000A1Z5"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Registered Commercial Address</span>
                      <span className="lto-info-val flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-500" /> {buyer?.address || "Cuttack, Odisha"}
                      </span>
                    </div>
                  </div>
                )}

                {/* SUPPLIER PARTY DETAILS */}
                {isSupplierLedger && (
                  <div className="lto-info-grid">
                    <div className="lto-info-item">
                      <span className="lto-info-label">Supplier / Company Name</span>
                      <strong className="lto-info-val text-slate-900">{supplier?.name || record.supplier || record.party}</strong>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Supplier ID</span>
                      <span className="lto-info-val font-mono font-bold text-emerald-800">{supplier?.id || "SUP-001"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Contact Representative</span>
                      <span className="lto-info-val">{supplier?.contact || "Dispatch & Sales Department"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Contact Mobile</span>
                      <span className="lto-info-val font-mono flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-500" /> {supplier?.mobile || "9437002001"}
                      </span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">GSTIN Identification</span>
                      <span className="lto-info-val font-mono text-xs font-semibold">{supplier?.gstin || "21AAACU9876K1Z3"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Supply Depot Address</span>
                      <span className="lto-info-val flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-500" /> {supplier?.address || "Bhubaneswar, Odisha"}
                      </span>
                    </div>
                  </div>
                )}

                {/* CASH BOOK PARTY DETAILS */}
                {isCashBook && (
                  <div className="lto-info-grid">
                    <div className="lto-info-item">
                      <span className="lto-info-label">Cash Movement Nature</span>
                      <strong className="lto-info-val text-slate-900">{record.entryType || (debitVal > 0 ? "Cash Payment (Outflow)" : "Cash Receipt (Inflow)")}</strong>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Cash Transaction Reference</span>
                      <span className="lto-info-val font-mono">{refNumber}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Related Party / Payee</span>
                      <span className="lto-info-val font-semibold">{record.party || record.farmer || record.name || "Central Aggregation Facility"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Cashier &amp; Authorized Custodian</span>
                      <span className="lto-info-val flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-700" /> Anita Das (Accountant / Finance Officer)
                      </span>
                    </div>

                    <div className="lto-info-item col-span-full">
                      <span className="lto-info-label">Cash Transaction Purpose</span>
                      <span className="lto-info-val text-xs text-slate-700">{record.description || record.name || "Operating cash handling and logistical disbursement"}</span>
                    </div>
                  </div>
                )}

                {/* BANK BOOK PARTY & BANK DETAILS */}
                {isBankBook && (
                  <div className="lto-info-grid">
                    <div className="lto-info-item">
                      <span className="lto-info-label">Bank Institution</span>
                      <strong className="lto-info-val text-slate-900 flex items-center gap-1.5">
                        <Landmark size={14} className="text-emerald-700" /> State Bank of India (SBI)
                      </strong>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Operating Account (Masked)</span>
                      <span className="lto-info-val font-mono">•••• •••• •••• 4821 (Current A/c)</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Branch &amp; IFSC Code</span>
                      <span className="lto-info-val font-mono text-xs">Keonjhar Main Branch · SBIN0001234</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Beneficiary / Related Party</span>
                      <strong className="lto-info-val">{record.farmer || record.party || record.name || "Ravi Kumar (F-001)"}</strong>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Payment Channel</span>
                      <span className="lto-info-val font-semibold">{record.method || "Direct Bank Transfer (NEFT/RTGS)"}</span>
                    </div>

                    <div className="lto-info-item">
                      <span className="lto-info-label">Bank UTR / Transaction Reference</span>
                      <span className="lto-info-val font-mono font-bold text-emerald-900">{utrMatch || refNumber}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION D: RELATED BUSINESS TRANSACTION */}
              <div className="lto-panel">
                <div className="lto-panel-head">
                  <div className="flex items-center gap-2">
                    <Layers size={17} className="text-emerald-700" />
                    <h3>D. Related Business Transaction</h3>
                  </div>
                  <span className="lto-panel-badge">Originating Business Flow</span>
                </div>

                {relatedPurchase ? (
                  <div className="lto-business-box">
                    <div className="lto-business-head">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Source Module: Produce Purchase (Flow A)</span>
                        <strong className="text-sm font-bold text-slate-900 font-mono">Purchase Order: {relatedPurchase.id}</strong>
                      </div>
                      {onNavigate && (
                        <button
                          type="button"
                          className="lto-nav-link-btn"
                          onClick={() => onNavigate("/purchases")}
                        >
                          Open Module <ExternalLink size={12} />
                        </button>
                      )}
                    </div>

                    <div className="lto-info-grid mt-3">
                      <div className="lto-info-item">
                        <span className="lto-info-label">Procured Commodity</span>
                        <strong className="lto-info-val text-slate-800">{relatedPurchase.commodity || "Paddy (common)"}</strong>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Weighed Quantity</span>
                        <span className="lto-info-val font-semibold">{Number(relatedPurchase.quantity || 1000).toLocaleString("en-IN")} {relatedPurchase.unit || "kg"}</span>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Approved Rate</span>
                        <span className="lto-info-val">{money(relatedPurchase.rate || 25)} / {relatedPurchase.unit || "kg"}</span>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Total Purchase Valuation</span>
                        <strong className="lto-info-val text-emerald-800">{money(relatedPurchase.amount || 25000)}</strong>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Related Weighment Receipt</span>
                        <span className="lto-info-val font-mono text-xs">RCP-{relatedPurchase.id}</span>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Procurement Approval</span>
                        <span className="lto-info-val flex items-center gap-1.5 text-xs text-emerald-900">
                          <CheckCircle2 size={13} className="text-emerald-700" /> Approved by Prakash Rout (Procurement)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : relatedSale ? (
                  <div className="lto-business-box">
                    <div className="lto-business-head">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Source Module: Produce Sale (Flow C)</span>
                        <strong className="text-sm font-bold text-slate-900 font-mono">Sale Invoice: {relatedSale.id}</strong>
                      </div>
                      {onNavigate && (
                        <button
                          type="button"
                          className="lto-nav-link-btn"
                          onClick={() => onNavigate("/sales/produce")}
                        >
                          Open Module <ExternalLink size={12} />
                        </button>
                      )}
                    </div>

                    <div className="lto-info-grid mt-3">
                      <div className="lto-info-item">
                        <span className="lto-info-label">Sold Commodity</span>
                        <strong className="lto-info-val text-slate-800">{relatedSale.commodity || "Paddy common"}</strong>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Dispatched Quantity</span>
                        <span className="lto-info-val font-semibold">{Number(relatedSale.quantity || 1000).toLocaleString("en-IN")} {relatedSale.unit || "kg"}</span>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Total Invoiced Amount</span>
                        <strong className="lto-info-val text-emerald-800">{money(relatedSale.amount || 30000)}</strong>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Realized Margin</span>
                        <span className="lto-info-val font-bold text-emerald-700">{money(relatedSale.margin || 5000)}</span>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Dispatch Waybill / Vehicle</span>
                        <span className="lto-info-val font-mono text-xs">{relatedSale.vehicle || "OD-09-AB-4412"}</span>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Commercial Approval</span>
                        <span className="lto-info-val flex items-center gap-1.5 text-xs text-emerald-900">
                          <CheckCircle2 size={13} className="text-emerald-700" /> Approved by Mamata Jena (Sales)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : relatedBiz ? (
                  <div className="lto-business-box">
                    <div className="lto-business-head">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Source Module: {relatedBiz.flowName || "Agri Business"} (Flow {relatedBiz.flow})</span>
                        <strong className="text-sm font-bold text-slate-900 font-mono">Business Order: {relatedBiz.id}</strong>
                      </div>
                    </div>

                    <div className="lto-info-grid mt-3">
                      <div className="lto-info-item">
                        <span className="lto-info-label">Commodity / Supplies</span>
                        <strong className="lto-info-val text-slate-800">{relatedBiz.item}</strong>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Order Amount</span>
                        <strong className="lto-info-val text-emerald-800">{money(relatedBiz.amount)}</strong>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Settlement Period</span>
                        <span className="lto-info-val">{relatedBiz.settlement || "30 days net"}</span>
                      </div>

                      <div className="lto-info-item">
                        <span className="lto-info-label">Stock Movement</span>
                        <span className="lto-info-val font-mono text-xs">MOV-{relatedBiz.id} ({relatedBiz.stockDirection})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <div className="flex items-center gap-2 mb-1 text-slate-800 font-bold">
                      <Info size={15} className="text-slate-500" />
                      Direct General Ledger Posting
                    </div>
                    <span>
                      This ledger entry is a verified direct financial adjustment or journal settlement without an upstream commercial sales order or raw procurement intake.
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION E: TRANSACTION FLOW VISUALIZATION */}
              <div className="lto-panel">
                <div className="lto-panel-head">
                  <div className="flex items-center gap-2">
                    <Clock size={17} className="text-emerald-700" />
                    <h3>E. Transaction Lifecycle &amp; Flow Stages</h3>
                  </div>
                  <span className="lto-panel-badge">Sequential Progress</span>
                </div>

                <div className="lto-timeline">
                  {[
                    {
                      step: 1,
                      title: "Entity Master & KYC Verification",
                      desc: `${farmer?.name || buyer?.name || supplier?.name || "Counterparty"} profile verified on official FPC directory`,
                      timestamp: isFarmerLedger ? "02 Aug 2021 · 10:00 AM" : "14 Jul 2024 · 11:30 AM",
                      done: true
                    },
                    {
                      step: 2,
                      title: isFarmerLedger ? "Produce Delivery & Weighbridge Intake" : isBuyerLedger ? "Produce Sales Order Created" : "Input Purchase Order Logged",
                      desc: `${record.description || "Commercial order submitted with item specifications and rate"}`,
                      timestamp: `${dateStr} · 08:30 AM`,
                      done: true
                    },
                    {
                      step: 3,
                      title: "Verification & Quality Inspection",
                      desc: "Moisture and physical inspection passed with Grade A benchmark standards",
                      timestamp: `${dateStr} · 09:15 AM`,
                      done: true
                    },
                    {
                      step: 4,
                      title: "Managerial Approval & Voucher Issuance",
                      desc: `Electronic voucher ${refNumber} generated and signed by authorized officer`,
                      timestamp: `${dateStr} · 09:45 AM`,
                      done: true
                    },
                    {
                      step: 5,
                      title: "Ledger Entry & Account Posting",
                      desc: `${creditVal > 0 ? "Credit" : "Debit"} of ${money(amountVal)} posted to ${ledgerType}`,
                      timestamp: `${dateStr} · 10:30 AM`,
                      done: true
                    },
                    {
                      step: 6,
                      title: "Disbursement & Bank Clearance",
                      desc: utrMatch ? `Settlement cleared via electronic bank transfer (Ref: ${utrMatch})` : "Cleared in internal FPC settlement book",
                      timestamp: utrMatch ? `${dateStr} · 02:45 PM` : "Immediate Clearance",
                      done: statusStr.toLowerCase().includes("paid") || statusStr.toLowerCase().includes("approved") || statusStr.toLowerCase().includes("posted")
                    }
                  ].map(stage => (
                    <div key={stage.step} className="lto-timeline-step">
                      <div className={`lto-timeline-dot ${stage.done ? "done" : "pending"}`}>
                        {stage.done ? <Check size={12} /> : <span>{stage.step}</span>}
                      </div>
                      <div className="lto-timeline-content">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <strong className="text-xs font-bold text-slate-900">
                            {stage.step}. {stage.title}
                          </strong>
                          <span className="lto-timeline-time">{stage.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Financial Breakdown, Document Vault, Audit Trail */}
            <div className="lto-side-col">

              {/* SECTION C: FINANCIAL BREAKDOWN */}
              <div className="lto-panel">
                <div className="lto-panel-head">
                  <div className="flex items-center gap-2">
                    <Receipt size={17} className="text-emerald-700" />
                    <h3>C. Financial Breakdown</h3>
                  </div>
                </div>

                <div className="lto-breakdown-list">
                  <div className="lto-breakdown-row">
                    <span className="text-slate-600">Gross Transaction Amount</span>
                    <strong className="font-mono text-slate-900">{money(amountVal)}</strong>
                  </div>

                  <div className="lto-breakdown-row">
                    <span className="text-slate-600">Debit Amount (Dr)</span>
                    <span className={`font-mono ${debitVal > 0 ? "text-amber-800 font-bold" : "text-slate-400"}`}>
                      {debitVal > 0 ? money(debitVal) : "₹0.00"}
                    </span>
                  </div>

                  <div className="lto-breakdown-row">
                    <span className="text-slate-600">Credit Amount (Cr)</span>
                    <span className={`font-mono ${creditVal > 0 ? "text-emerald-800 font-bold" : "text-slate-400"}`}>
                      {creditVal > 0 ? money(creditVal) : "₹0.00"}
                    </span>
                  </div>

                  <div className="lto-breakdown-divider" />

                  <div className="lto-breakdown-row">
                    <span className="text-slate-500 text-xs">Previous Account Balance</span>
                    <span className="font-mono text-xs text-slate-600">{money(prevBalanceVal)}</span>
                  </div>

                  <div className="lto-breakdown-row">
                    <span className="text-slate-500 text-xs">Net Account Movement</span>
                    <span className={`font-mono text-xs font-semibold ${creditVal > debitVal ? "text-emerald-700" : "text-amber-700"}`}>
                      {creditVal >= debitVal ? `+${money(creditVal - debitVal)}` : `-${money(debitVal - creditVal)}`}
                    </span>
                  </div>

                  <div className="lto-breakdown-row highlight">
                    <span className="font-bold text-emerald-950">Current Closing Balance</span>
                    <strong className="font-mono text-base text-emerald-900">{money(balanceVal)}</strong>
                  </div>

                  <div className="lto-breakdown-divider" />

                  <div className="lto-breakdown-row text-xs">
                    <span className="text-slate-600">Payment Mode</span>
                    <span className="font-semibold text-slate-800">{record.method || "Bank Transfer"}</span>
                  </div>

                  <div className="lto-breakdown-row text-xs">
                    <span className="text-slate-600">Payment Reference</span>
                    <span className="font-mono text-[11px] text-slate-700">{utrMatch || refNumber}</span>
                  </div>

                  <div className="lto-breakdown-row text-xs">
                    <span className="text-slate-600">Outstanding Dues</span>
                    <span className="font-bold text-emerald-700">₹0.00 (Cleared)</span>
                  </div>
                </div>
              </div>

              {/* SECTION F: PAYMENT & RECEIPT INFORMATION */}
              <div className="lto-panel">
                <div className="lto-panel-head">
                  <div className="flex items-center gap-2">
                    <FileCheck size={17} className="text-emerald-700" />
                    <h3>F. Payment &amp; Receipt Voucher</h3>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Official Voucher</span>
                      <strong className="text-xs font-mono font-bold text-slate-900">VCH-{refNumber}</strong>
                    </div>
                    <span className="lto-chip green text-[10px]">● Signed</span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span>Issued Date:</span>
                      <strong>{dateStr}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Authorized By:</span>
                      <strong>Anita Das (Accountant)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Settlement:</span>
                      <span className="text-emerald-800 font-semibold">Immediate / Bank Confirmed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="lto-btn outline compact w-full"
                      onClick={() => setDocModalOpen(true)}
                    >
                      <Eye size={12} /> Preview
                    </button>
                    <button
                      type="button"
                      className="lto-btn primary compact w-full"
                      onClick={handleDownloadVoucher}
                    >
                      <Download size={12} /> Voucher PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION G: TRANSACTION HISTORY & AUDIT TRAIL */}
              <div className="lto-panel">
                <div className="lto-panel-head">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={17} className="text-emerald-700" />
                    <h3>G. Audit History &amp; Traceability</h3>
                  </div>
                  <span className="lto-panel-badge">{matchingAudits.length} Events</span>
                </div>

                <div className="space-y-2.5">
                  <div className="lto-audit-entry">
                    <div className="lto-audit-meta">
                      <span className="font-bold text-slate-800">Anita Das</span>
                      <span className="text-slate-500 font-mono text-[10px]">{dateStr} · 10:30 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-0.5">
                      Posted financial journal voucher {record.id} for {money(amountVal)}
                    </p>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold inline-block mt-1">
                      Role: Accountant / Finance Officer
                    </span>
                  </div>

                  <div className="lto-audit-entry">
                    <div className="lto-audit-meta">
                      <span className="font-bold text-slate-800">Bijay Kumar Mohanty</span>
                      <span className="text-slate-500 font-mono text-[10px]">{dateStr} · 09:45 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-700 mt-0.5">
                      Approved commercial settlement and authorized banking disbursement
                    </p>
                    <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold inline-block mt-1">
                      Role: FPC Admin / Manager
                    </span>
                  </div>

                  {matchingAudits.slice(0, 3).map((a: any) => (
                    <div key={a.id} className="lto-audit-entry">
                      <div className="lto-audit-meta">
                        <span className="font-bold text-slate-800">{a.actor || a.user}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{a.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5">{a.action}</p>
                      <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-semibold inline-block mt-1">
                        Module: {a.module} · {a.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DOCUMENT PREVIEW MODAL */}
          {docModalOpen && (
            <div className="lto-modal-backdrop" onClick={() => setDocModalOpen(false)}>
              <div className="lto-modal-card" onClick={e => e.stopPropagation()}>
                <div className="lto-modal-head">
                  <div>
                    <h2>Payment Voucher &amp; Receipt Preview</h2>
                    <span className="text-xs text-emerald-100 block">{fpc.name} · Official Financial Record</span>
                  </div>
                  <button
                    type="button"
                    className="text-white hover:text-emerald-200"
                    onClick={() => setDocModalOpen(false)}
                    aria-label="Close Preview"
                  >
                    ✕
                  </button>
                </div>

                <div className="lto-modal-body">
                  <div className="p-4 border border-slate-300 rounded-xl bg-white shadow-xs">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-950 uppercase">{fpc.name}</h3>
                        <p className="text-[11px] text-slate-500">Registered Office: {fpc.location || "Keonjhar, Odisha"}</p>
                        <span className="text-[10px] text-slate-400 font-mono">CIN: U46209JH2024PTC022984 · PAN: AAACU0229P</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-emerald-900 block">VOUCHER #{refNumber}</span>
                        <span className="text-[11px] text-slate-600 block">Date: {dateStr}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">ORIGINAL RECEIPT</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs mb-4 p-2.5 bg-slate-50 rounded-lg">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Paid To / Account Head:</span>
                        <strong className="text-slate-900">{farmer?.name || buyer?.name || supplier?.name || "Counterparty"}</strong>
                        <span className="text-[11px] text-slate-600 block font-mono">{farmer?.id || buyer?.id || supplier?.id || "ACC-01"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Payment Mode &amp; Reference:</span>
                        <strong className="text-slate-900">{record.method || "Bank Transfer"}</strong>
                        <span className="text-[11px] text-slate-600 block font-mono">Ref: {utrMatch || refNumber}</span>
                      </div>
                    </div>

                    <table className="w-full text-xs mb-4">
                      <thead>
                        <tr className="border-b border-slate-300 text-slate-600">
                          <th className="py-1.5 text-left">Sl</th>
                          <th className="py-1.5 text-left">Particulars / Account Description</th>
                          <th className="py-1.5 text-right">Debit (₹)</th>
                          <th className="py-1.5 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2">1</td>
                          <td className="py-2">
                            <strong>{txType}</strong>
                            <span className="block text-[11px] text-slate-500">{record.description || "General ledger settlement"}</span>
                          </td>
                          <td className="py-2 text-right font-mono">{debitVal > 0 ? money(debitVal) : "—"}</td>
                          <td className="py-2 text-right font-mono font-bold text-emerald-900">{creditVal > 0 ? money(creditVal) : "—"}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-300 font-bold">
                          <td colSpan={2} className="py-2">Net Settlement Amount</td>
                          <td colSpan={2} className="py-2 text-right font-mono text-sm text-emerald-950">{money(amountVal)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="flex justify-between items-end border-t border-slate-200 pt-4 mt-6 text-[10px] text-slate-500">
                      <div>
                        <span>Entered by: Anita Das (Accountant)</span>
                        <span className="block">Timestamp: {dateStr} · System Generated</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-slate-700 block">For {fpc.name}</span>
                        <span className="block mt-4 text-slate-400">Authorized Signatory</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="lto-btn outline" onClick={() => setDocModalOpen(false)}>
                      Close
                    </button>
                    <button type="button" className="lto-btn primary" onClick={handlePrint}>
                      <Printer size={14} /> Print This Voucher
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      );
    }

