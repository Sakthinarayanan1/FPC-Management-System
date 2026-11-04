import React, { useState } from "react";
import {
  Users, Handshake, Store, Factory, ArrowDownLeft, ArrowUpRight,
  PackageOpen, Package, Sprout, Plus, Eye, ChevronRight,
  ShieldCheck, CheckCircle2, Clock, MapPin, Phone, FileText,
  BadgeCheck, ArrowRight
} from "lucide-react";
import { money, type State } from "@/lib/store";

interface Props {
  state: State;
  role: string;
  onNavigate: (route: string) => void;
  setToast: (msg: string) => void;
}

export default function RegistrationDashboard({ state, role, onNavigate, setToast }: Props) {
  const [activeTab, setActiveTab] = useState<"all" | "farmers" | "purchases" | "sales" | "surveys">("all");

  const farmers = state.records.farmers || [];
  const shareholders = state.records.shareholders || [];
  const buyers = state.records.buyers || [];
  const suppliers = state.records.suppliers || [];
  const purchases = state.records.purchases || [];
  const sales = state.records.sales || [];
  const surveys = state.records.baseline || [];

  // Derived statistics
  const verifiedFarmers = farmers.filter(f => f.kyc === "Verified" || f.status === "Active").length;
  const totalShareCapital = shareholders.reduce((sum, s) => sum + Number(s.capital || s.amount || 1000), 0);
  const activeBuyers = buyers.filter(b => b.status === "Active").length;
  const activeSuppliers = suppliers.filter(s => s.status === "Active").length;

  // 9 Modules definition
  const registrationModules = [
    {
      id: "farmer-reg",
      title: "Farmer Registration",
      category: "Primary Membership",
      icon: Users,
      badge: `${farmers.length} Registered`,
      description: "Enroll member & non-member farmers with landholding plots, crop livelihood, and Aadhaar/KYC verification.",
      primaryAction: "Register Farmer",
      primaryRoute: "/farmers/new",
      secondaryAction: "View Farmers",
      secondaryRoute: "/farmers",
      tone: "green",
    },
    {
      id: "shareholder-reg",
      title: "Shareholder Registration",
      category: "Equity & Ownership",
      icon: Handshake,
      badge: `${shareholders.length} Members`,
      description: "Issue shares, record equity folios, distinctive certificate numbers, and legal member particulars.",
      primaryAction: "Register Shareholder",
      primaryRoute: "/shareholders/new",
      secondaryAction: "View Shareholders",
      secondaryRoute: "/shareholders",
      tone: "emerald",
    },
    {
      id: "buyer-reg",
      title: "Buyer Registration",
      category: "Market Counterparty",
      icon: Store,
      badge: `${buyers.length} Buyers`,
      description: "Register institutional buyers, millers, and retail traders with GSTIN, PAN, and commercial credit limits.",
      primaryAction: "Add Buyer",
      primaryRoute: "/agri-business/buyers-suppliers",
      secondaryAction: "Buyer Master",
      secondaryRoute: "/agri-business/buyers-suppliers",
      tone: "blue",
    },
    {
      id: "supplier-reg",
      title: "Supplier Registration",
      category: "Input Vendors",
      icon: Factory,
      badge: `${suppliers.length} Suppliers`,
      description: "Register certified fertiliser, seed, pesticide, and equipment vendors with bank account particulars.",
      primaryAction: "Add Supplier",
      primaryRoute: "/agri-business/suppliers",
      secondaryAction: "Supplier Master",
      secondaryRoute: "/agri-business/suppliers",
      tone: "amber",
    },
    {
      id: "produce-purchase-reg",
      title: "Produce Purchase",
      category: "Farmer Procurement",
      icon: ArrowDownLeft,
      badge: `${purchases.length} Purchases`,
      description: "Record farmer produce arrival, electronic weighment, moisture analysis, quality grading, and purchase vouchers.",
      primaryAction: "New Purchase",
      primaryRoute: "/agri-business/produce-purchase",
      secondaryAction: "Purchase Register",
      secondaryRoute: "/agri-business/produce-purchase",
      tone: "green",
    },
    {
      id: "produce-sale-reg",
      title: "Produce Sale",
      category: "Commercial Dispatches",
      icon: ArrowUpRight,
      badge: `${sales.length} Sales`,
      description: "Register buyer sales orders, commodity lot allocation, vehicle dispatches, and tax invoices.",
      primaryAction: "New Sale",
      primaryRoute: "/agri-business/produce-sale",
      secondaryAction: "Sales Register",
      secondaryRoute: "/agri-business/produce-sale",
      tone: "teal",
    },
    {
      id: "input-purchase-reg",
      title: "Input Purchase",
      category: "Inventory Intake",
      icon: PackageOpen,
      badge: "Inward Consignments",
      description: "Register incoming farm input consignments from certified suppliers, vendor bills, and batch entries.",
      primaryAction: "Procure Inputs",
      primaryRoute: "/agri-business/input-purchase",
      secondaryAction: "Intake Register",
      secondaryRoute: "/agri-business/input-purchase",
      tone: "purple",
    },
    {
      id: "input-sale-reg",
      title: "Input Sale",
      category: "Farmer Distribution",
      icon: Package,
      badge: "Distribution",
      description: "Register retail input distribution to member farmers with package size, price, GST billing, and payment mode.",
      primaryAction: "Distribute Inputs",
      primaryRoute: "/agri-business/input-sale",
      secondaryAction: "Disbursement Log",
      secondaryRoute: "/agri-business/input-sale",
      tone: "indigo",
    },
    {
      id: "baseline-survey-reg",
      title: "Baseline Survey",
      category: "Field Assessment & M&E",
      icon: Sprout,
      badge: `${surveys.length} Surveys`,
      description: "Conduct field surveys, capture household baselines, cropping patterns, land irrigation, and economic impact metrics.",
      primaryAction: "Conduct Survey",
      primaryRoute: "/farmers/baseline",
      secondaryAction: "Survey Ledger",
      secondaryRoute: "/farmers/baseline",
      tone: "forest",
    },
  ];

  return (
    <div className="registration-dashboard" style={{ padding: "8px 0 24px" }}>
      {/* 1. EXECUTIVE WELCOME BANNER */}
      <section
        style={{
          background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)",
          borderRadius: "16px",
          padding: "26px 30px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(27, 94, 32, 0.25)",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(4px)",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase"
              }}
            >
              <ShieldCheck size={13} /> Client Demonstration Configuration
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#fef08a",
                color: "#854d0e",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700
              }}
            >
              9 Modules Active
            </span>
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
            FPC Operations Desk · Registration Suite
          </h2>
          <p style={{ fontSize: "14px", margin: 0, opacity: 0.92, lineHeight: 1.5 }}>
            Centralized stakeholder enrollment, commercial entity directories, agricultural transaction registers, and field baseline data collection for <b>Green Valley Farmer Producer Company Ltd.</b>
          </p>
        </div>
      </section>

      {/* 2. REGISTRATION KPI SUMMARY CARDS */}
      <section style={{ marginBottom: "26px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px"
          }}
        >
          {/* Card 1: Farmers */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}
            onClick={() => onNavigate("/farmers")}
            title="Click to view all registered farmers"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                Registered Farmers
              </span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={17} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
              {farmers.length}
            </div>
            <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
              <BadgeCheck size={14} /> {verifiedFarmers} KYC verified members
            </div>
          </div>

          {/* Card 2: Shareholders */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              cursor: "pointer"
            }}
            onClick={() => onNavigate("/shareholders")}
            title="Click to view all shareholders"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                Shareholders
              </span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Handshake size={17} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
              {shareholders.length}
            </div>
            <div style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>
              Paid-up equity: {money(totalShareCapital)}
            </div>
          </div>

          {/* Card 3: Commercial Masters (Buyers & Suppliers) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              cursor: "pointer"
            }}
            onClick={() => onNavigate("/agri-business/buyers-suppliers")}
            title="Click to view buyers and suppliers master"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                Trade Counterparties
              </span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Store size={17} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
              {buyers.length + suppliers.length}
            </div>
            <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 600 }}>
              {activeBuyers} Buyers · {activeSuppliers} Certified Suppliers
            </div>
          </div>

          {/* Card 4: Logged Transactions */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              cursor: "pointer"
            }}
            onClick={() => onNavigate("/agri-business/produce-purchase")}
            title="Click to view produce purchases"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                Registered Operations
              </span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileText size={17} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
              {purchases.length + sales.length + surveys.length}
            </div>
            <div style={{ fontSize: "12px", color: "#7c3aed", fontWeight: 600 }}>
              {purchases.length} Purchases · {sales.length} Sales · {surveys.length} Surveys
            </div>
          </div>
        </div>
      </section>

      {/* 3. 9-MODULE QUICK-ACTION LAUNCHPAD */}
      <section style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>
              Registration Modules Launchpad
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              Direct access to all 9 enabled registration workflows, data entry forms, and verification tables.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: "16px"
          }}
        >
          {registrationModules.map(mod => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  position: "relative",
                  transition: "all 0.15s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "#ecfdf5",
                          color: "#166534",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {mod.category}
                        </span>
                        <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b", margin: "1px 0 0" }}>
                          {mod.title}
                        </h4>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: "#f1f5f9",
                        color: "#475569"
                      }}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
                    {mod.description}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                  <button
                    type="button"
                    onClick={() => onNavigate(mod.primaryRoute)}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "#1b5e20",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(27,94,32,0.15)"
                    }}
                  >
                    <Plus size={14} /> {mod.primaryAction}
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate(mod.secondaryRoute)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "#f8fafc",
                      color: "#334155",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid #cbd5e1",
                      cursor: "pointer"
                    }}
                    title={mod.secondaryAction}
                  >
                    <Eye size={13} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. RECENT REGISTRATION ACTIVITY FEED */}
      <section
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 2px" }}>
              Recent Registration Activity
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              Live registration records across farmers, shareholders, commercial counterparties, transactions, and baseline surveys.
            </p>
          </div>

          <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
            {[
              ["all", "All Records"],
              ["farmers", "Farmers"],
              ["purchases", "Purchases"],
              ["sales", "Sales"],
              ["surveys", "Surveys"]
            ].map(([tabKey, tabLabel]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey as any)}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: activeTab === tabKey ? 700 : 500,
                  borderRadius: "6px",
                  border: "none",
                  background: activeTab === tabKey ? "#ffffff" : "transparent",
                  color: activeTab === tabKey ? "#0f172a" : "#64748b",
                  boxShadow: activeTab === tabKey ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  cursor: "pointer"
                }}
              >
                {tabLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Tables */}
        {activeTab === "farmers" || activeTab === "all" ? (
          <div style={{ marginBottom: activeTab === "all" ? "20px" : 0 }}>
            {activeTab === "all" && (
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                <Users size={14} /> Recent Farmer Enrollments
              </div>
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "8px 12px" }}>Farmer ID</th>
                    <th style={{ padding: "8px 12px" }}>Full Name</th>
                    <th style={{ padding: "8px 12px" }}>Village / Block</th>
                    <th style={{ padding: "8px 12px" }}>Landholding</th>
                    <th style={{ padding: "8px 12px" }}>KYC Status</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers.slice(0, activeTab === "all" ? 4 : 8).map(f => (
                    <tr
                      key={f.id}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onClick={() => onNavigate(`/farmers/${f.id}`)}
                      title="Click to view farmer details"
                    >
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "#166534" }}>{f.id}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{f.name}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{f.village || "Green Valley"}, {f.block || "Keonjhar"}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{f.land || f.acres || "2.5"} acres</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#dcfce7", color: "#166534" }}>
                          ● {f.kyc || "Verified"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onNavigate(`/farmers/${f.id}`); }}
                          style={{ padding: "3px 8px", fontSize: "11px", borderRadius: "5px", background: "#f1f5f9", border: "1px solid #cbd5e1", cursor: "pointer" }}
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "purchases" || activeTab === "all" ? (
          <div style={{ marginBottom: activeTab === "all" ? "20px" : 0 }}>
            {activeTab === "all" && (
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#166534", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                <ArrowDownLeft size={14} /> Recent Produce Purchase Registrations
              </div>
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "8px 12px" }}>Voucher ID</th>
                    <th style={{ padding: "8px 12px" }}>Farmer</th>
                    <th style={{ padding: "8px 12px" }}>Commodity</th>
                    <th style={{ padding: "8px 12px" }}>Quantity</th>
                    <th style={{ padding: "8px 12px" }}>Amount</th>
                    <th style={{ padding: "8px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.slice(0, activeTab === "all" ? 4 : 8).map(p => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                      onClick={() => onNavigate("/agri-business/produce-purchase")}
                    >
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "#166534" }}>{p.id}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{p.farmer || "Ravi Kumar"}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{p.commodity || "Mustard"}</td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{p.quantity} {p.unit || "kg"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{money(Number(p.amount || 0))}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#fef3c7", color: "#92400e" }}>
                          ● {p.status || "Approved"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeTab === "sales" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "8px 12px" }}>Invoice / Lot</th>
                  <th style={{ padding: "8px 12px" }}>Buyer</th>
                  <th style={{ padding: "8px 12px" }}>Commodity</th>
                  <th style={{ padding: "8px 12px" }}>Quantity</th>
                  <th style={{ padding: "8px 12px" }}>Total Value</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 8).map(s => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    onClick={() => onNavigate("/agri-business/produce-sale")}
                  >
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "#166534" }}>{s.id}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{s.buyer || "Shree Agro Mills"}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{s.commodity || "Mustard"}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{s.quantity} {s.unit || "kg"}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{money(Number(s.amount || 0))}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#dcfce7", color: "#166534" }}>
                        ● {s.status || "Approved"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === "surveys" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "8px 12px" }}>Survey ID</th>
                  <th style={{ padding: "8px 12px" }}>Respondent Farmer</th>
                  <th style={{ padding: "8px 12px" }}>Village</th>
                  <th style={{ padding: "8px 12px" }}>Cropping Pattern</th>
                  <th style={{ padding: "8px 12px" }}>Surveyor</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {surveys.slice(0, 8).map(sv => (
                  <tr
                    key={sv.id}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    onClick={() => onNavigate("/farmers/baseline")}
                  >
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "#166534" }}>{sv.id}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0f172a" }}>{sv.farmer || sv.respondent || "Jaba Murmu"}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{sv.village || "Barbil"}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{sv.crops || sv.croppingPattern || "Paddy, Mustard"}</td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{sv.assessor || "Suman Naik"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#dcfce7", color: "#166534" }}>
                        ● {sv.status || "Submitted"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

