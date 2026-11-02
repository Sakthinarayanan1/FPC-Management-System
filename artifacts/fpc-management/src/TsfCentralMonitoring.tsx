import React, { useState, useMemo, useEffect } from "react";
import {
  Building2, Users, Landmark, ShieldCheck, BarChart3,
  Search, Download, Printer, ArrowLeft, ArrowRight,
  TrendingUp, TrendingDown, Clock, AlertTriangle, AlertCircle,
  FileText, Eye, Check, X, Award, DollarSign,
  Package, ShoppingCart, Warehouse, ArrowUpRight, ArrowDownLeft,
  ExternalLink, ClipboardCheck, CheckCircle2
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  CartesianGrid
} from "recharts";
import * as XLSX from "xlsx";
import type { Role } from "@/lib/config";
import {
  type RecordRow, type State, money, initialLicences,
  initialDirectors
} from "@/lib/store";
import FpcManagement from "./FpcManagement";
import NetworkAnalytics from "./NetworkAnalytics";
import FpcWorkspace from "./FpcWorkspace";
import NetworkSurveysView from "./NetworkSurveysView";
import BaselineSurveysModule from "./BaselineSurveysModule";
import FpcReports from "./FpcReports";
import "./tsf-monitoring.css";

interface Props {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  role: Role;
  screen: string;
  path?: string;
  setToast: (msg: string) => void;
  go: (dest: string) => void;
}

export default function TsfCentralMonitoring({
  state,
  setState,
  role,
  screen,
  path,
  setToast,
  go
}: Props) {
  // Global Filters
  const [selectedFpcId, setSelectedFpcId] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<"Today" | "This Month" | "Quarter" | "FY 2026–27">("FY 2026–27");
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [districtFilter, setDistrictFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Directory Pagination & Sorting
  const [dirPage, setDirPage] = useState<number>(1);
  const [dirSortBy, setDirSortBy] = useState<string>("name");
  const [dirSortDir, setDirSortDir] = useState<"asc" | "desc">("asc");

  // Chart Controls
  const [chartTimeframe, setChartTimeframe] = useState<"Weekly" | "Monthly" | "Yearly" | "Financial Year">("Monthly");
  const [chartFpcId, setChartFpcId] = useState<string>("ALL");

  // Leaderboard Controls
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<"profit" | "revenue" | "farmers" | "growth">("profit");
  const [leaderboardSortDir, setLeaderboardSortDir] = useState<"asc" | "desc">("desc");
  const [showAllLeaderboard, setShowAllLeaderboard] = useState<boolean>(false);

  // Individual FPC Details View (Opened via "View Details" action)
  const [monitoredFpc, setMonitoredFpc] = useState<RecordRow | null>(null);

  // All FPCs list from store
  const allFpcs: RecordRow[] = useMemo(() => state.records?.fpcs || [], [state.records?.fpcs]);

  // Sync selected monitored FPC if ID changes
  useEffect(() => {
    if (selectedFpcId && selectedFpcId !== "ALL") {
      const found = allFpcs.find(f => f.id === selectedFpcId || f.fpcId === selectedFpcId);
      if (found) setMonitoredFpc(found);
    }
  }, [selectedFpcId, allFpcs]);

  // -------------------------------------------------------------
  // 1. TOP 8 DYNAMIC NETWORK KPIS (Calculated Dynamically)
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const totalFpcs = allFpcs.length;
    const activeFpcs = allFpcs.filter(f => (f.status || "").toLowerCase().startsWith("active")).length;
    const inactiveFpcs = allFpcs.filter(f => (f.status || "").toLowerCase().includes("inactive")).length;
    const onboardingFpcs = allFpcs.filter(f =>
      (f.status || "").toLowerCase().includes("onboarding") ||
      (f.status || "").toLowerCase().includes("draft") ||
      (f.status || "").toLowerCase().includes("submitted")
    ).length;

    const totalFarmers = allFpcs.reduce((acc, f) => {
      const num = parseInt(String(f.farmers || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + num;
    }, 0);

    const totalShareholders = allFpcs.reduce((acc, f) => {
      const num = parseInt(String(f.shareholders || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + (num > 0 ? num : 148); // Baseline fallback across network
    }, 0);

    const totalBuyers = state.records?.buyers?.length || 4;
    const totalSuppliers = state.records?.suppliers?.length || 3;
    const totalGodowns = allFpcs.reduce((acc, f, idx) => {
      if (idx === 0) {
        return acc + ((state.records?.godowns?.length || 2) + 2);
      }
      return acc + (Number(f.godownCount) || (f.id === "FPC-ODI-002" ? 6 : f.id === "FPC-JHK-002" || f.id === "FPC-JHK-003" ? 3 : 4));
    }, 0);

    const totalEmployees = allFpcs.reduce((acc, f) => {
      return acc + (Number(f.employeeCount) || 8);
    }, 0);

    const totalTurnover = allFpcs.reduce((acc, f) => {
      return acc + (Number(f.turnover) || 0);
    }, 0);

    return {
      totalFpcs,
      activeFpcs,
      inactiveFpcs,
      onboardingFpcs,
      totalFarmers,
      totalShareholders,
      totalBuyers,
      totalSuppliers,
      totalGodowns,
      totalEmployees,
      totalTurnover
    };
  }, [allFpcs, state.records?.buyers, state.records?.suppliers, state.records?.godowns]);

  // -------------------------------------------------------------
  // 2. CONSOLIDATED FINANCIAL PERFORMANCE (Profit & Loss Metrics)
  // -------------------------------------------------------------
  const financialMetrics = useMemo(() => {
    let profitSum = 0;
    let lossSum = 0;

    allFpcs.forEach(f => {
      const rev = Number(f.turnover || 0);
      let exp = 0;
      if (f.id === "FPC-ODI-002") exp = 14800000;
      else if (f.id === "FPC-JHK-001") exp = 7430000;
      else if (f.id === "FPC-ODI-004") exp = 6710000;
      else if (f.id === "FPC-ODI-001") exp = 6460000;
      else if (f.id === "FPC-ODI-005") exp = 5180000;
      else if (f.id === "FPC-ODI-003") exp = 3620000;
      else if (f.id === "FPC-JHK-003") exp = 2450000;
      else exp = 0;

      const diff = rev - exp;
      if (diff > 0) {
        profitSum += diff;
      } else if (diff < 0) {
        lossSum += Math.abs(diff);
      }
    });

    return {
      totalProfit: profitSum, // 4,370,000 (₹43.70 Lakhs)
      totalLoss: lossSum      // 340,000 (₹3.40 Lakhs from Chaibasa)
    };
  }, [allFpcs]);

  const baselineMetrics = useMemo(() => {
    const assessments = state.records?.baselineAssessments || [];
    const surveys = state.records?.surveys || [];
    const completedBaselines = assessments.filter(a => a.status === "Completed").length;
    const totalBaselines = assessments.length || allFpcs.length;
    const activeSurveys = surveys.filter(s => s.status === "Active" || s.status === "In Progress").length;
    const totalResponses = surveys.reduce((sum, s) => sum + (s.responsesCount || 0), 0);
    const avgCompletion = surveys.length ? Math.round(surveys.reduce((sum, s) => sum + (s.completionRate || 0), 0) / surveys.length) : 0;
    return {
      completedBaselines,
      totalBaselines,
      activeSurveys,
      totalSurveys: surveys.length,
      totalResponses,
      avgCompletion
    };
  }, [state.records?.baselineAssessments, state.records?.surveys, allFpcs.length]);

  // -------------------------------------------------------------
  // 3. FPC PERFORMANCE LEADERBOARD DATA
  // -------------------------------------------------------------
  const leaderboardData = useMemo(() => {
    return allFpcs.map((f) => {
      const rev = Number(f.turnover || 0);
      let expenses = 0;
      let profit = 0;
      let growth = 0;

      if (f.id === "FPC-ODI-002") { // Kalinganagar
        expenses = 14800000;
        profit = rev - expenses; // +14.4L
        growth = 22.4;
      } else if (f.id === "FPC-JHK-001") { // Noamundi
        expenses = 7430000;
        profit = rev - expenses; // +8.3L
        growth = 18.2;
      } else if (f.id === "FPC-ODI-004") { // Joda Pulse
        expenses = 6710000;
        profit = rev - expenses; // +7.2L
        growth = 14.5;
      } else if (f.id === "FPC-ODI-001") { // Green Valley
        expenses = 6460000;
        profit = rev - expenses; // +7.2L
        growth = 12.8;
      } else if (f.id === "FPC-ODI-005") { // Barbil
        expenses = 5180000;
        profit = rev - expenses; // +3.9L
        growth = 8.6;
      } else if (f.id === "FPC-ODI-003") { // Gonda
        expenses = 3620000;
        profit = rev - expenses; // +2.7L
        growth = 6.1;
      } else if (f.id === "FPC-JHK-003") { // Chaibasa (Loss maker)
        expenses = 2450000;
        profit = rev - expenses; // -3.4L
        growth = -11.5;
      } else { // Seraikela (Onboarding)
        expenses = 0;
        profit = 0;
        growth = 0;
      }

      const farmers = parseInt(String(f.farmers || "0").replace(/[^0-9]/g, "")) || 0;

      return {
        fpc: f,
        id: f.id,
        name: f.name,
        district: f.district || "Keonjhar",
        state: f.state || "Odisha",
        farmers,
        revenue: rev,
        expenses,
        profit,
        growth,
        status: f.status || "Active"
      };
    });
  }, [allFpcs]);

  const sortedLeaderboard = useMemo(() => {
    const list = [...leaderboardData];
    list.sort((a, b) => {
      let diff = 0;
      if (leaderboardSortBy === "profit") diff = b.profit - a.profit;
      else if (leaderboardSortBy === "revenue") diff = b.revenue - a.revenue;
      else if (leaderboardSortBy === "farmers") diff = b.farmers - a.farmers;
      else if (leaderboardSortBy === "growth") diff = b.growth - a.growth;
      return leaderboardSortDir === "desc" ? diff : -diff;
    });
    return list;
  }, [leaderboardData, leaderboardSortBy, leaderboardSortDir]);

  const displayedLeaderboard = showAllLeaderboard ? sortedLeaderboard : sortedLeaderboard.slice(0, 5);

  // -------------------------------------------------------------
  // 4. REVENUE & FINANCIAL PERFORMANCE CHART DATA
  // -------------------------------------------------------------
  const chartData = useMemo(() => {
    const isAll = chartFpcId === "ALL";
    const selectedFpc = allFpcs.find(f => f.id === chartFpcId);
    const factor = isAll ? 1 : selectedFpc ? Math.max(0.05, Number(selectedFpc.turnover || 0) / 50700000) : 0.2;

    if (chartTimeframe === "Weekly") {
      return [
        { period: "W38 (Sep 15-21)", revenue: Math.round(1840000 * factor), expenses: Math.round(1620000 * factor), profit: Math.round(220000 * factor) },
        { period: "W39 (Sep 22-28)", revenue: Math.round(2120000 * factor), expenses: Math.round(1880000 * factor), profit: Math.round(240000 * factor) },
        { period: "W40 (Sep 29-Oct 5)", revenue: Math.round(2450000 * factor), expenses: Math.round(2160000 * factor), profit: Math.round(290000 * factor) },
        { period: "W41 (Oct 6-12)", revenue: Math.round(2780000 * factor), expenses: Math.round(2420000 * factor), profit: Math.round(360000 * factor) },
        { period: "W42 (Oct 13-19)", revenue: Math.round(2910000 * factor), expenses: Math.round(2550000 * factor), profit: Math.round(360000 * factor) },
        { period: "W43 (Oct 20-26)", revenue: Math.round(3160000 * factor), expenses: Math.round(2740000 * factor), profit: Math.round(420000 * factor) },
      ];
    } else if (chartTimeframe === "Monthly") {
      return [
        { period: "May 2026", revenue: Math.round(3420000 * factor), expenses: Math.round(3110000 * factor), profit: Math.round(310000 * factor) },
        { period: "Jun 2026", revenue: Math.round(3860000 * factor), expenses: Math.round(3490000 * factor), profit: Math.round(370000 * factor) },
        { period: "Jul 2026", revenue: Math.round(4140000 * factor), expenses: Math.round(3750000 * factor), profit: Math.round(390000 * factor) },
        { period: "Aug 2026", revenue: Math.round(4680000 * factor), expenses: Math.round(4210000 * factor), profit: Math.round(470000 * factor) },
        { period: "Sep 2026", revenue: Math.round(5210000 * factor), expenses: Math.round(4680000 * factor), profit: Math.round(530000 * factor) },
        { period: "Oct 2026", revenue: Math.round(5840000 * factor), expenses: Math.round(5160000 * factor), profit: Math.round(680000 * factor) },
      ];
    } else if (chartTimeframe === "Yearly") {
      return [
        { period: "FY 2022-23", revenue: Math.round(18200000 * factor), expenses: Math.round(17100000 * factor), profit: Math.round(1100000 * factor) },
        { period: "FY 2023-24", revenue: Math.round(26500000 * factor), expenses: Math.round(24600000 * factor), profit: Math.round(1900000 * factor) },
        { period: "FY 2024-25", revenue: Math.round(40700000 * factor), expenses: Math.round(37500000 * factor), profit: Math.round(3200000 * factor) },
        { period: "FY 2025-26", revenue: Math.round(50700000 * factor), expenses: Math.round(46330000 * factor), profit: Math.round(4370000 * factor) },
        { period: "FY 2026-27 (Proj)", revenue: Math.round(65000000 * factor), expenses: Math.round(58500000 * factor), profit: Math.round(6500000 * factor) },
      ];
    } else {
      // Financial Year Quarters
      return [
        { period: "Q1 FY26 (Apr-Jun)", revenue: Math.round(11420000 * factor), expenses: Math.round(10350000 * factor), profit: Math.round(1070000 * factor) },
        { period: "Q2 FY26 (Jul-Sep)", revenue: Math.round(14030000 * factor), expenses: Math.round(12640000 * factor), profit: Math.round(1390000 * factor) },
        { period: "Q3 FY26 (Oct-Dec)", revenue: Math.round(13250000 * factor), expenses: Math.round(12040000 * factor), profit: Math.round(1210000 * factor) },
        { period: "Q4 FY26 (Jan-Mar)", revenue: Math.round(12000000 * factor), expenses: Math.round(11300000 * factor), profit: Math.round(700000 * factor) },
      ];
    }
  }, [chartTimeframe, chartFpcId, allFpcs]);

  const chartSummary = useMemo(() => {
    const totalRev = chartData.reduce((s, d) => s + d.revenue, 0);
    const totalExp = chartData.reduce((s, d) => s + d.expenses, 0);
    const totalProf = totalRev - totalExp;
    const margin = totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : "0.0";
    return {
      totalRev,
      totalExp,
      totalProf,
      margin
    };
  }, [chartData]);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rev = payload.find((p: any) => p.dataKey === "revenue")?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === "expenses")?.value || 0;
      const profit = payload.find((p: any) => p.dataKey === "profit")?.value || 0;
      const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : "0";

      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-slate-200 text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</div>
          <div className="flex justify-between items-center text-emerald-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2e7d32]" /> Revenue:
            </span>
            <strong>{money(rev)}</strong>
          </div>
          <div className="flex justify-between items-center text-amber-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" /> Expenses:
            </span>
            <strong>{money(exp)}</strong>
          </div>
          <div className={`flex justify-between items-center pt-1 border-t border-slate-100 ${profit >= 0 ? "text-blue-700" : "text-red-700"}`}>
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1565c0]" /> Net Profit:
            </span>
            <strong>{money(profit)} ({margin}%)</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // -------------------------------------------------------------
  // 5. FILTERED FPCS FOR NETWORK OVERVIEW TABLE
  // -------------------------------------------------------------
  const filteredFpcs = useMemo(() => {
    return allFpcs.filter(f => {
      if (stateFilter !== "ALL" && f.state !== stateFilter) return false;
      if (districtFilter !== "ALL" && f.district !== districtFilter) return false;
      if (statusFilter !== "ALL") {
        if (statusFilter === "Active" && !(f.status || "").toLowerCase().startsWith("active")) return false;
        if (statusFilter === "Onboarding" && !(f.status || "").toLowerCase().includes("onboarding")) return false;
        if (statusFilter === "Inactive" && !(f.status || "").toLowerCase().includes("inactive")) return false;
        if (statusFilter === "Overdue" && !(f.status || "").toLowerCase().includes("overdue")) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (f.name || "").toLowerCase().includes(q) ||
          (f.id || "").toLowerCase().includes(q) ||
          (f.location || "").toLowerCase().includes(q) ||
          (f.district || "").toLowerCase().includes(q) ||
          (f.state || "").toLowerCase().includes(q) ||
          (f.details?.basic?.cin || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => {
      let va = a[dirSortBy] ?? "";
      let vb = b[dirSortBy] ?? "";
      if (dirSortBy === "turnover") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      }
      if (va < vb) return dirSortDir === "asc" ? -1 : 1;
      if (va > vb) return dirSortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [allFpcs, stateFilter, districtFilter, statusFilter, searchQuery, dirSortBy, dirSortDir]);

  const pagedFpcs = useMemo(() => {
    const start = (dirPage - 1) * 8;
    return filteredFpcs.slice(start, start + 8);
  }, [filteredFpcs, dirPage]);

  const totalPages = Math.max(1, Math.ceil(filteredFpcs.length / 8));

  // -------------------------------------------------------------
  // Open / Close FPC Details View
  // -------------------------------------------------------------
  const handleOpenFpc = (fpc: RecordRow) => {
    setMonitoredFpc(fpc);
    setSelectedFpcId(fpc.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToOverview = () => {
    setMonitoredFpc(null);
    setSelectedFpcId("ALL");
  };

  // -------------------------------------------------------------
  // Excel & CSV Exports
  // -------------------------------------------------------------
  const exportFpcDirectoryExcel = () => {
    const rows = filteredFpcs.map((f, i) => ({
      "Sl No": i + 1,
      "FPC ID": f.id || f.fpcId,
      "FPC Name": f.name,
      "CIN": f.details?.basic?.cin || "U01100OD2021PTC035612",
      "State": f.state || "Odisha",
      "District": f.district || "Keonjhar",
      "Block": f.block || "Keonjhar Sadar",
      "Registered Farmers": f.farmers || 0,
      "Shareholders": f.shareholders === "-" ? 148 : f.shareholders,
      "Employees": f.employeeCount || 8,
      "Registered Buyers": state.records?.buyers?.length || 4,
      "Registered Suppliers": state.records?.suppliers?.length || 3,
      "Total Godowns": f.id === "FPC-ODI-001" ? ((state.records?.godowns?.length || 2) + 2) : (Number(f.godownCount) || (f.id === "FPC-ODI-002" ? 6 : f.id === "FPC-JHK-002" || f.id === "FPC-JHK-003" ? 3 : 4)),
      "Annual Turnover (INR)": f.turnover || 0,
      "Compliance Status": (f.status || "").includes("overdue") ? "Compliance Overdue" : "Compliant",
      "Operational Status": f.status || "Active",
      "Baseline Status": (state.records?.baselineAssessments || []).find(b => b.fpcId === f.id)?.status || "Completed",
      "Total Surveys": (state.records?.surveys || []).filter(s => s.fpcId === f.id).length
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TSF FPC Network Directory");
    XLSX.writeFile(wb, `TSF_FPC_Network_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setToast("Consolidated FPC Network Directory exported to Excel");
  };

  const exportFpcDirectoryCsv = () => {
    const headers = [
      "FPC ID", "FPC Name", "State", "District", "Block", "Farmers", "Shareholders",
      "Employees", "Turnover", "Status", "Baseline", "Surveys"
    ];
    const data = filteredFpcs.map(f => {
      const bStatus = (state.records?.baselineAssessments || []).find(b => b.fpcId === f.id)?.status || "Completed";
      const sCount = (state.records?.surveys || []).filter(s => s.fpcId === f.id).length;
      return [
        `"${f.id}"`, `"${f.name}"`, `"${f.state}"`, `"${f.district}"`, `"${f.block}"`,
        f.farmers, f.shareholders, f.employeeCount || 8, f.turnover || 0, `"${f.status}"`,
        `"${bStatus}"`, sCount
      ];
    });
    const csvContent = "\ufeff" + [headers.join(","), ...data.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TSF_FPC_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("FPC Directory exported to CSV");
  };

  // If sub-screen is Onboarding or Approvals, delegate directly to existing FpcManagement
  if (screen === "FPC onboarding" || screen === "Onboard New FPC") {
    return (
      <div className="tsf-monitoring-shell">
        <div className="tsf-header-bar">
          <div className="tsf-header-top">
            <div className="tsf-header-title-area">
              <div className="tsf-logo-mark"><Building2 size={24} /></div>
              <div className="tsf-header-titles">
                <h1>FPC Onboarding Desk <span className="tsf-badge-network">TSF Central Admin</span></h1>
                <p>Register, verify, and activate new Farmer Producer Companies on the national TSF network.</p>
              </div>
            </div>
            <div className="tsf-header-actions">
              <button className="btn-outline compact" onClick={() => go("/fpc-management")}>
                <ArrowLeft size={14} /> Back to Network Overview
              </button>
            </div>
          </div>
        </div>
        <FpcManagement
          state={state}
          setState={setState}
          role={role}
          screen="FPC onboarding"
          setToast={setToast}
          go={go}
        />
      </div>
    );
  }

  if (screen === "FPC pending approvals" || screen === "Pending Approvals") {
    return (
      <div className="tsf-monitoring-shell">
        <div className="tsf-header-bar">
          <div className="tsf-header-top">
            <div className="tsf-header-title-area">
              <div className="tsf-logo-mark"><ShieldCheck size={24} /></div>
              <div className="tsf-header-titles">
                <h1>State-Level FPC Approvals Queue <span className="tsf-badge-network">Central Verification</span></h1>
                <p>Review statutory documents, capital credentials, and activate submitted FPC entities.</p>
              </div>
            </div>
            <div className="tsf-header-actions">
              <button className="btn-outline compact" onClick={() => go("/fpc-management")}>
                <ArrowLeft size={14} /> Back to Network Overview
              </button>
            </div>
          </div>
        </div>
        <FpcManagement
          state={state}
          setState={setState}
          role={role}
          screen="FPC pending approvals"
          setToast={setToast}
          go={go}
        />
      </div>
    );
  }

  // If sub-screen is Network Analytics, render the central analytics module
  if (
    screen === "Analytics" ||
    screen === "Network Analytics" ||
    screen === "network-analytics" ||
    (path && path.includes("/analytics"))
  ) {
    return (
      <NetworkAnalytics
        state={state}
        setState={setState}
        role={role}
        setToast={setToast}
        go={go}
      />
    );
  }

  // If sub-screen is Network Surveys, render the centralized surveys view
  if (
    screen === "Surveys" ||
    screen === "Surveys & Field Assessments" ||
    screen === "survey-monitoring" ||
    screen === "Surveys & Monitoring" ||
    (path && path.includes("/surveys"))
  ) {
    return (
      <NetworkSurveysView
        state={state}
        setState={setState}
        role={role}
        setToast={setToast}
        go={go}
        onOpenFpc={(fpc) => handleOpenFpc(fpc)}
      />
    );
  }

  // If sub-screen is Baseline or Baseline and Surveys, render BaselineSurveysModule
  if (
    screen === "Baseline" ||
    screen === "Baseline and Surveys" ||
    screen === "Baseline survey" ||
    (path && path.includes("/baseline") && !path.includes("/reports"))
  ) {
    return (
      <div className="tsf-monitoring-shell">
        <BaselineSurveysModule
          state={state}
          setState={setState}
          role={role}
          setToast={setToast}
          go={go}
        />
      </div>
    );
  }

  // If sub-screen is Baseline & Impact Reports or MIS Reports, render FpcReports
  if (
    screen === "Baseline & Impact Reports" ||
    screen === "baseline-reports-mon" ||
    screen === "Consolidated MIS" ||
    screen === "Reports & gallery" ||
    (path && path.includes("/reports"))
  ) {
    return (
      <div className="tsf-monitoring-shell">
        <div className="tsf-header-bar">
          <div className="tsf-header-top">
            <div className="tsf-header-title-area">
              <div className="tsf-logo-mark"><FileText size={24} /></div>
              <div className="tsf-header-titles">
                <h1>TSF Central Network MIS & Baseline Reports <span className="tsf-badge-network">Network Reporting</span></h1>
                <p>Consolidated statutory filings, baseline assessment trajectories, and field survey intelligence across all 8 partner FPCs.</p>
              </div>
            </div>
            <div className="tsf-header-actions">
              <button className="btn-outline compact" onClick={() => go("/fpc-management")}>
                <ArrowLeft size={14} /> Back to Network Overview
              </button>
            </div>
          </div>
        </div>
        <FpcReports
          state={state}
          role={role}
          initialReport={path && path.includes("/baseline") ? "FPC Baseline Assessment Report" : undefined}
        />
      </div>
    );
  }

  return (
    <div className="tsf-monitoring-shell" data-testid="tsf-central-monitoring-container">
      {/* ========================================================= */}
      {/* 1. GLOBAL EXECUTIVE HEADER */}
      {/* ========================================================= */}
      <header className="tsf-header-bar">
        <div className="tsf-header-top">
          <div className="tsf-header-title-area">
            <div className="tsf-logo-mark">
              <Building2 size={22} />
            </div>
            <div className="tsf-header-titles">
              <h1>
                TSF Central FPC Network Monitoring System
                <span className="tsf-badge-network">Centralized Portfolio</span>
              </h1>
              <p>
                Multi-tier centralized oversight across 8 partner FPCs · Odisha & Jharkhand · Real-time operational, financial, and compliance surveillance.
              </p>
            </div>
          </div>

          <div className="tsf-header-actions">
            {monitoredFpc ? (
              <button
                type="button"
                className="btn-outline compact"
                onClick={handleBackToOverview}
                title="Return to Network Overview"
              >
                <ArrowLeft size={14} /> Back to Network Overview
              </button>
            ) : null}

            <button
              type="button"
              className="btn-outline compact"
              onClick={() => go("/tsf/analytics")}
              title="View Comprehensive Network Analytics"
              style={{ borderColor: "#2e7d32", color: "#1b5e20", background: "#f0fdf4", fontWeight: 600 }}
            >
              <BarChart3 size={14} /> Network Analytics
            </button>

            <button
              type="button"
              className="btn-outline compact"
              onClick={() => go("/tsf/monitoring/surveys")}
              title="View Centralized Surveys & Field Assessments"
              style={{ borderColor: "#059669", color: "#065f46", background: "#ecfdf5", fontWeight: 600 }}
            >
              <ClipboardCheck size={14} /> Surveys & M&E
            </button>

            <button
              type="button"
              className="btn-outline compact"
              onClick={exportFpcDirectoryExcel}
              title="Export Central Directory"
            >
              <Download size={14} /> Export Network Excel
            </button>

            <button
              type="button"
              className="btn-primary compact"
              onClick={() => go("/fpc-management/onboard")}
            >
              <Building2 size={14} /> Onboard New FPC
            </button>
          </div>
        </div>

        {/* Global Filter Controls Strip */}
        <div className="tsf-controls-strip">
          <div className="tsf-filter-group">
            <label className="text-xs font-semibold text-slate-500">Scope:</label>
            <select
              aria-label="Filter FPC Scope"
              className="tsf-select-control"
              value={monitoredFpc ? monitoredFpc.id : selectedFpcId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedFpcId(val);
                if (val === "ALL") {
                  setMonitoredFpc(null);
                } else {
                  const f = allFpcs.find(x => x.id === val);
                  if (f) setMonitoredFpc(f);
                }
              }}
            >
              <option value="ALL">🌐 All Partner FPCs (Network-wide)</option>
              {allFpcs.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.district}, {f.state})
                </option>
              ))}
            </select>

            <label className="text-xs font-semibold text-slate-500 ml-2">State:</label>
            <select
              aria-label="Filter State"
              className="tsf-select-control"
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setDirPage(1); }}
            >
              <option value="ALL">All States</option>
              <option value="Odisha">Odisha</option>
              <option value="Jharkhand">Jharkhand</option>
            </select>

            <label className="text-xs font-semibold text-slate-500 ml-2">Status:</label>
            <select
              aria-label="Filter Status"
              className="tsf-select-control"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setDirPage(1); }}
            >
              <option value="ALL">All Operational Statuses</option>
              <option value="Active">Active FPCs</option>
              <option value="Onboarding">Under Onboarding</option>
              <option value="Overdue">Compliance / Sync Overdue</option>
              <option value="Inactive">Inactive FPCs</option>
            </select>
          </div>

          <div className="tsf-filter-group">
            <div className="tsf-search-box">
              <Search size={14} className="text-slate-400" />
              <input
                aria-label="Search network"
                placeholder="Search FPC, district, CIN..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setDirPage(1); }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="tsf-period-chips" role="radiogroup" aria-label="Select Period">
              {(["Today", "This Month", "Quarter", "FY 2026–27"] as const).map(p => (
                <button
                  type="button"
                  key={p}
                  className={`tsf-period-chip ${dateRange === p ? "active" : ""}`}
                  onClick={() => setDateRange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. EXACT 8 KEY STATISTICS CARDS (2x4 CLEAN GRID) */}
      {/* ========================================================= */}
      <section className="tsf-kpis-grid" aria-label="TSF Network 8 Key Statistics">
        {/* KPI 1: Total FPCs */}
        <article
          className="tsf-kpi-card"
          onClick={() => { setStatusFilter("ALL"); setStateFilter("ALL"); setDistrictFilter("ALL"); setMonitoredFpc(null); }}
          title="Click to view all registered FPCs"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon green"><Building2 size={18} /></span>
            <span className="tsf-kpi-trend up">
              <ArrowUpRight size={12} /> +25.0%
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total FPCs</div>
            <div className="tsf-kpi-val">{kpis.totalFpcs}</div>
            <div className="tsf-kpi-sub">
              <span>5 Odisha · 3 Jharkhand</span>
              <span className="tsf-kpi-compare">+2 vs prev year</span>
            </div>
          </div>
        </article>

        {/* KPI 2: Total Farmers */}
        <article
          className="tsf-kpi-card"
          onClick={() => go("/tsf/monitoring/farmers")}
          title="Click to view farmer monitoring across network"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon green"><Users size={18} /></span>
            <span className="tsf-kpi-trend up">
              <ArrowUpRight size={12} /> +18.5%
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total Farmers</div>
            <div className="tsf-kpi-val">{kpis.totalFarmers.toLocaleString("en-IN")}</div>
            <div className="tsf-kpi-sub">
              <span>Across 48 villages</span>
              <span className="tsf-kpi-compare">+18.5% YoY</span>
            </div>
          </div>
        </article>

        {/* KPI 3: Total Shareholders */}
        <article
          className="tsf-kpi-card"
          onClick={() => go("/tsf/monitoring/shareholders")}
          title="Click to view shareholder equity across network"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon gold"><Award size={18} /></span>
            <span className="tsf-kpi-trend up">
              <ArrowUpRight size={12} /> +12.4%
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total Shareholders</div>
            <div className="tsf-kpi-val">{kpis.totalShareholders.toLocaleString("en-IN")}</div>
            <div className="tsf-kpi-sub">
              <span>Paid-up equity members</span>
              <span className="tsf-kpi-compare">+12.4% YoY</span>
            </div>
          </div>
        </article>

        {/* KPI 4: Total Buyers */}
        <article
          className="tsf-kpi-card"
          onClick={() => go("/tsf/monitoring/buyers")}
          title="Click to view institutional buyers"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon blue"><ShoppingCart size={18} /></span>
            <span className="tsf-kpi-trend up">
              <ArrowUpRight size={12} /> +33.3%
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total Buyers</div>
            <div className="tsf-kpi-val">{kpis.totalBuyers}</div>
            <div className="tsf-kpi-sub">
              <span>OSCSC, BigBasket, Balaji</span>
              <span className="tsf-kpi-compare">+1 this quarter</span>
            </div>
          </div>
        </article>

        {/* KPI 5: Total Suppliers */}
        <article
          className="tsf-kpi-card"
          onClick={() => go("/tsf/monitoring/suppliers")}
          title="Click to view registered input suppliers"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon gold"><Package size={18} /></span>
            <span className="tsf-kpi-trend up">
              <ArrowUpRight size={12} /> +50.0%
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total Suppliers</div>
            <div className="tsf-kpi-val">{kpis.totalSuppliers}</div>
            <div className="tsf-kpi-sub">
              <span>IFFCO, Syngenta, Bayer</span>
              <span className="tsf-kpi-compare">+1 this season</span>
            </div>
          </div>
        </article>

        {/* KPI 6: Total Godowns */}
        <article
          className="tsf-kpi-card"
          onClick={() => go("/tsf/inventory/overview")}
          title="Click to view network godowns and warehouse inventory"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon slate"><Warehouse size={18} /></span>
            <span className="tsf-kpi-trend neutral">
              ● Stable
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total Godowns</div>
            <div className="tsf-kpi-val">{kpis.totalGodowns}</div>
            <div className="tsf-kpi-sub">
              <span>Across 8 partner FPCs</span>
              <span className="tsf-kpi-compare">100% operational</span>
            </div>
          </div>
        </article>

        {/* KPI 7: Total Profit */}
        <article
          className="tsf-kpi-card profit-card"
          onClick={() => go("/tsf/finance/performance")}
          title="Click to view financial P&L performance"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon green"><TrendingUp size={18} /></span>
            <span className="tsf-kpi-trend up">
              <ArrowUpRight size={12} /> +14.2%
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total Profit</div>
            <div className="tsf-kpi-val profit">₹{(financialMetrics.totalProfit / 100000).toFixed(2)} L</div>
            <div className="tsf-kpi-sub">
              <span>Across 6 viable FPCs</span>
              <span className="tsf-kpi-compare">+14.2% YoY</span>
            </div>
          </div>
        </article>

        {/* KPI 8: Total Loss */}
        <article
          className="tsf-kpi-card loss-card"
          onClick={() => { setStatusFilter("Inactive"); setMonitoredFpc(null); }}
          title="Click to inspect loss-making and inactive entities"
        >
          <div className="tsf-kpi-top">
            <span className="tsf-kpi-icon red"><TrendingDown size={18} /></span>
            <span className="tsf-kpi-trend down">
              <ArrowDownLeft size={12} /> Needs Action
            </span>
          </div>
          <div>
            <div className="tsf-kpi-label">Total Loss</div>
            <div className="tsf-kpi-val loss">₹{(financialMetrics.totalLoss / 100000).toFixed(2)} L</div>
            <div className="tsf-kpi-sub">
              <span>Chaibasa Organic deficit</span>
              <span className="tsf-kpi-compare">-11.5% margin</span>
            </div>
          </div>
        </article>
      </section>

      {/* Network Baseline Assessments & Field M&E Surveillance Status Bar */}
      {!monitoredFpc && (
        <section
          className="tsf-baseline-survey-summary"
          aria-label="Baseline Assessments and Field Surveys Status"
          style={{
            marginBottom: "1.5rem",
            background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClipboardCheck size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#065f46" }}>
                  Network Baseline Assessments & Field M&E Surveillance
                </h3>
                <span style={{ fontSize: "0.76rem", color: "#475569" }}>
                  Consolidated impact benchmarks, seasonal field surveys, and verified rural respondent telemetry across Odisha & Jharkhand
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => go("/tsf/monitoring/surveys")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#059669",
                  background: "#fff",
                  border: "1px solid #a7f3d0",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                <ClipboardCheck size={13} /> Manage Network Surveys <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => go("/tsf/reports/baseline")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#1e40af",
                  background: "#fff",
                  border: "1px solid #bfdbfe",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer"
                }}
              >
                <FileText size={13} /> Baseline & Impact Reports <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>
                Baseline Assessments
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>
                  {baselineMetrics.completedBaselines} / {baselineMetrics.totalBaselines}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 600 }}>FPCs Signed Off</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                {baselineMetrics.totalBaselines - baselineMetrics.completedBaselines === 0 ? "100% network benchmarked" : `${baselineMetrics.totalBaselines - baselineMetrics.completedBaselines} FPC in onboarding assessment`}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>
                Active Field Surveys
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0284c7" }}>
                  {baselineMetrics.activeSurveys}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 600 }}>of {baselineMetrics.totalSurveys} total</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                Active across Kharif 2024 & Rabi 2024-25
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>
                Verified Respondents
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "#166534" }}>
                  {baselineMetrics.totalResponses.toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 600 }}>Field submissions</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                GPS & Aadhaar-verified farmer entries
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>
                Network Survey Completion
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "#7c3aed" }}>
                  {baselineMetrics.avgCompletion}%
                </span>
                <span style={{ fontSize: "0.72rem", color: "#7c3aed", fontWeight: 600 }}>Avg Sampling</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: 2 }}>
                Across Odisha & Jharkhand clusters
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. REVENUE & FINANCIAL PERFORMANCE CHART */}
      {/* ========================================================= */}
      {!monitoredFpc && (
        <section className="tsf-chart-panel" aria-label="Revenue and Financial Performance Chart">
          <div className="tsf-chart-header">
            <div>
              <h2><BarChart3 size={18} className="text-emerald-700" /> Revenue & Financial Performance</h2>
              <p>Consolidated business volume, operating expenditure, and net margin trajectory</p>
            </div>

            <div className="tsf-chart-controls">
              {/* FPC Scope Dropdown */}
              <select
                aria-label="Select FPC for chart"
                className="tsf-select-control"
                value={chartFpcId}
                onChange={(e) => setChartFpcId(e.target.value)}
              >
                <option value="ALL">🌐 Network Consolidated (All 8 FPCs)</option>
                {allFpcs.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              {/* Timeframe Filter Pills */}
              <div className="tsf-period-chips" role="radiogroup" aria-label="Chart Timeframe">
                {(["Weekly", "Monthly", "Yearly", "Financial Year"] as const).map(tf => (
                  <button
                    type="button"
                    key={tf}
                    className={`tsf-period-chip ${chartTimeframe === tf ? "active" : ""}`}
                    onClick={() => setChartTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Summary Strip */}
          <div className="tsf-chart-summary-bar">
            <div className="tsf-chart-summary-item">
              <small>Scope Focus</small>
              <b className="text-slate-800">
                {chartFpcId === "ALL" ? "All 8 Network FPCs" : allFpcs.find(f => f.id === chartFpcId)?.name || chartFpcId}
              </b>
            </div>
            <div className="tsf-chart-summary-item">
              <small>Period Revenue</small>
              <b className="text-emerald-700">{money(chartSummary.totalRev)}</b>
            </div>
            <div className="tsf-chart-summary-item">
              <small>Operating Expenses</small>
              <b className="text-amber-700">{money(chartSummary.totalExp)}</b>
            </div>
            <div className="tsf-chart-summary-item">
              <small>Net Profit Margin</small>
              <b className={chartSummary.totalProf >= 0 ? "text-blue-700" : "text-red-700"}>
                {money(chartSummary.totalProf)} ({chartSummary.margin}%)
              </b>
            </div>
            <div className="tsf-chart-summary-item ml-auto">
              <small>Comparison vs Prev Period</small>
              <b className="text-emerald-700 flex items-center gap-1">
                <ArrowUpRight size={13} /> +14.2% YoY Growth
              </b>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <RechartsTooltip content={<CustomChartTooltip />} />
                <RechartsLegend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#2e7d32" radius={[4, 4, 0, 0]} maxBarSize={44} />
                <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={44} />
                <Bar dataKey="profit" name="Net Profit" fill="#1565c0" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. TOP PERFORMING FPCS LEADERBOARD (FULL-WIDTH CLEAN PANEL) */}
      {/* ========================================================= */}
      {!monitoredFpc && (
        <section className="tsf-leaderboard-panel" aria-label="Performance Leaderboard">
          <div className="tsf-leaderboard-header">
            <div>
              <h2><Award size={18} className="text-amber-600" /> Top Performing FPCs</h2>
              <p>Rankings across business turnover, profitability, membership, and YoY growth</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-outline compact"
                style={{ fontSize: "11px", padding: "4px 8px" }}
                onClick={() => setShowAllLeaderboard(prev => !prev)}
              >
                {showAllLeaderboard ? "Show Top 5" : `View All (${allFpcs.length})`}
              </button>
            </div>
          </div>

          <div className="tsf-table-container">
            <table className="tsf-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>FPC Name</th>
                  <th>District</th>
                  <th
                    className="cursor-pointer hover:text-emerald-700"
                    onClick={() => {
                      setLeaderboardSortBy("farmers");
                      setLeaderboardSortDir(d => d === "asc" ? "desc" : "asc");
                    }}
                  >
                    Farmers {leaderboardSortBy === "farmers" ? (leaderboardSortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    className="cursor-pointer hover:text-emerald-700"
                    onClick={() => {
                      setLeaderboardSortBy("revenue");
                      setLeaderboardSortDir(d => d === "asc" ? "desc" : "asc");
                    }}
                  >
                    Revenue {leaderboardSortBy === "revenue" ? (leaderboardSortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>Expenses</th>
                  <th
                    className="cursor-pointer hover:text-emerald-700"
                    onClick={() => {
                      setLeaderboardSortBy("profit");
                      setLeaderboardSortDir(d => d === "asc" ? "desc" : "asc");
                    }}
                  >
                    Net Profit {leaderboardSortBy === "profit" ? (leaderboardSortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    className="cursor-pointer hover:text-emerald-700"
                    onClick={() => {
                      setLeaderboardSortBy("growth");
                      setLeaderboardSortDir(d => d === "asc" ? "desc" : "asc");
                    }}
                  >
                    Growth {leaderboardSortBy === "growth" ? (leaderboardSortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedLeaderboard.map((item, idx) => {
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer hover:bg-emerald-50/40 transition"
                      onClick={() => handleOpenFpc(item.fpc)}
                      title="Click to view FPC details"
                    >
                      <td>
                        {medal ? (
                          <span className="tsf-rank-badge" title={`Rank ${idx + 1}`}>{medal}</span>
                        ) : (
                          <span className="tsf-rank-num">#{idx + 1}</span>
                        )}
                      </td>
                      <td>
                        <div className="font-bold text-slate-800 text-xs hover:text-emerald-800 flex items-center gap-1.5">
                          {item.name}
                          <ArrowRight size={11} className="text-slate-400" />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{item.id}</span>
                      </td>
                      <td className="text-slate-600 text-xs">{item.district}</td>
                      <td className="font-semibold text-slate-800 text-xs">{item.farmers}</td>
                      <td className="font-semibold text-slate-900 text-xs">
                        {item.revenue > 0 ? `₹${(item.revenue / 100000).toFixed(1)} L` : "₹0 (Pre-op)"}
                      </td>
                      <td className="text-slate-500 text-xs">
                        {item.expenses > 0 ? `₹${(item.expenses / 100000).toFixed(1)} L` : "₹0"}
                      </td>
                      <td>
                        <strong className={`text-xs ${item.profit > 0 ? "text-emerald-700 font-bold" : item.profit < 0 ? "text-red-700 font-bold" : "text-slate-500"}`}>
                          {item.profit > 0 ? `+₹${(item.profit / 100000).toFixed(1)} L` : item.profit < 0 ? `-₹${(Math.abs(item.profit) / 100000).toFixed(1)} L` : "₹0"}
                        </strong>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${item.growth > 0 ? "text-emerald-700" : item.growth < 0 ? "text-red-700" : "text-slate-500"}`}>
                          {item.growth > 0 ? <ArrowUpRight size={12} /> : item.growth < 0 ? <ArrowDownLeft size={12} /> : null}
                          {item.growth > 0 ? `+${item.growth}%` : `${item.growth}%`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. COMPACT IMPORTANT NETWORK ALERTS */}
      {/* ========================================================= */}
      {!monitoredFpc && (
        <section className="tsf-important-alerts-section" aria-label="Important Network Alerts">
          <div className="tsf-important-alerts-header">
            <h3>
              <AlertTriangle size={15} className="text-amber-600" /> Important Compliance & Operations Alerts
            </h3>
            <span className="text-xs text-slate-500">4 items requiring central attention</span>
          </div>

          <div className="tsf-alerts-banner-grid">
            {/* Alert 1 */}
            <div className="tsf-compact-alert-card critical">
              <div className="tsf-compact-alert-top">
                <h4>
                  <AlertCircle size={13} className="text-red-600" /> Overdue RoC Filings
                </h4>
                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono">Barbil FPC</span>
              </div>
              <p>Form AOC-4 and MGT-7 overdue by 11 days. Statutory penalty risk at RoC Cuttack.</p>
              <button
                type="button"
                className="tsf-alert-action-btn"
                onClick={() => setToast("Urgent notice dispatched to CEO Barbil FPC & Company Secretary")}
              >
                Escalate
              </button>
            </div>

            {/* Alert 2 */}
            <div className="tsf-compact-alert-card warning">
              <div className="tsf-compact-alert-top">
                <h4>
                  <Clock size={13} className="text-amber-600" /> GST GSTR-3B Due
                </h4>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">Green Valley</span>
              </div>
              <p>Monthly GST return overdue since 20 Oct 2026. Input tax credit reconciliation needed.</p>
              <button
                type="button"
                className="tsf-alert-action-btn"
                onClick={() => setToast("Compliance reminder SMS sent to Green Valley Accountant")}
              >
                Remind CEO
              </button>
            </div>

            {/* Alert 3 */}
            <div className="tsf-compact-alert-card warning">
              <div className="tsf-compact-alert-top">
                <h4>
                  <Clock size={13} className="text-amber-600" /> Fertilizer License Expiring
                </h4>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">Keonjhar DAO</span>
              </div>
              <p>FL/KEO/2023/041 expiring in 44 days (14 Dec 2026). Renewal application ready.</p>
              <button
                type="button"
                className="tsf-alert-action-btn"
                onClick={() => setToast("Renewal workflow initiated with DAO Keonjhar")}
              >
                Renew
              </button>
            </div>

            {/* Alert 4 */}
            <div className="tsf-compact-alert-card critical">
              <div className="tsf-compact-alert-top">
                <h4>
                  <AlertCircle size={13} className="text-red-600" /> Net Deficit Intervention
                </h4>
                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono">Chaibasa</span>
              </div>
              <p>Net loss of ₹3.40 Lakhs recorded. Vegetable spoilage and dormant off-takers.</p>
              <button
                type="button"
                className="tsf-alert-action-btn"
                onClick={() => setToast("Turnaround review meeting scheduled with Chaibasa Board")}
              >
                Review Plan
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 6. FPC NETWORK OVERVIEW TABLE */}
      {/* ========================================================= */}
      {!monitoredFpc && (
        <section className="tsf-overview-panel" aria-label="Centralized FPC Network Directory">
          <div className="tsf-overview-header">
            <div>
              <h2><Building2 size={18} className="text-emerald-800" /> FPC Network Overview</h2>
              <p>Complete multi-entity portfolio overview across Odisha and Jharkhand</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Showing {filteredFpcs.length} of {allFpcs.length} FPCs
              </span>
              <button
                type="button"
                className="btn-outline compact"
                onClick={exportFpcDirectoryCsv}
                title="Download CSV"
              >
                CSV
              </button>
              <button
                type="button"
                className="btn-outline compact"
                onClick={exportFpcDirectoryExcel}
                title="Download Excel"
              >
                Excel
              </button>
            </div>
          </div>

          <div className="tsf-table-container">
            <table className="tsf-table">
              <thead>
                <tr>
                  <th onClick={() => { setDirSortBy("name"); setDirSortDir(d => d === "asc" ? "desc" : "asc"); }} className="cursor-pointer">
                    FPC Name & Registration {dirSortBy === "name" ? (dirSortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>State</th>
                  <th>District</th>
                  <th onClick={() => { setDirSortBy("farmers"); setDirSortDir(d => d === "asc" ? "desc" : "asc"); }} className="cursor-pointer">
                    Farmers {dirSortBy === "farmers" ? (dirSortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>Shareholders</th>
                  <th>Buyers</th>
                  <th>Suppliers</th>
                  <th>Godowns</th>
                  <th onClick={() => { setDirSortBy("turnover"); setDirSortDir(d => d === "asc" ? "desc" : "asc"); }} className="cursor-pointer">
                    Revenue {dirSortBy === "turnover" ? (dirSortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th>Operational Status</th>
                  <th>Baseline</th>
                  <th>Surveys</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedFpcs.map((fpc) => {
                  const isGreenValley = fpc.id === "FPC-ODI-001";
                  const logoUrl = isGreenValley ? "/ual-baha-logo.png" : "";
                  const complianceOverdue = (fpc.status || "").toLowerCase().includes("overdue");
                  const isInactive = (fpc.status || "").toLowerCase().includes("inactive");
                  const isOnboarding = (fpc.status || "").toLowerCase().includes("onboarding");

                  return (
                    <tr
                      key={fpc.id}
                      className="cursor-pointer hover:bg-emerald-50/30 transition"
                      onClick={() => handleOpenFpc(fpc)}
                    >
                      <td>
                        <div className="tsf-fpc-name-cell">
                          <div className="tsf-fpc-logo-avatar">
                            {logoUrl ? (
                              <img src={logoUrl} alt={fpc.name} />
                            ) : (
                              <span>{fpc.name.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="tsf-fpc-info">
                            <b>{fpc.name}</b>
                            <small>CIN: {fpc.details?.basic?.cin || "U01100OD2021PTC035612"}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-700">{fpc.state || "Odisha"}</td>
                      <td className="text-slate-700">{fpc.district || "Keonjhar"}</td>
                      <td>
                        <strong className="text-slate-900">{fpc.farmers || 0}</strong>
                      </td>
                      <td>
                        <strong className="text-slate-800">{fpc.shareholders === "-" ? 148 : fpc.shareholders}</strong>
                      </td>
                      <td>{state.records?.buyers?.length || 4}</td>
                      <td>{state.records?.suppliers?.length || 3}</td>
                      <td>{fpc.id === "FPC-ODI-001" ? ((state.records?.godowns?.length || 2) + 2) : (Number(fpc.godownCount) || (fpc.id === "FPC-ODI-002" ? 6 : fpc.id === "FPC-JHK-002" || fpc.id === "FPC-JHK-003" ? 3 : 4))}</td>
                      <td>
                        <strong className="text-emerald-800">
                          {Number(fpc.turnover || 0) > 0 ? `₹${(Number(fpc.turnover || 0) / 100000).toFixed(1)} L` : "₹0"}
                        </strong>
                      </td>
                      <td>
                        <span className={`tsf-chip ${complianceOverdue ? "danger" : isInactive ? "inactive" : isOnboarding ? "onboarding" : "active"}`}>
                          <i /> {fpc.status || "Active"}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const baselineRec = (state.records?.baselineAssessments || []).find(b => b.fpcId === fpc.id);
                          const isCompleted = baselineRec?.status === "Completed";
                          return (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: 12,
                              background: isCompleted ? "#ecfdf5" : "#fef3c7",
                              color: isCompleted ? "#065f46" : "#92400e",
                              border: `1px solid ${isCompleted ? "#a7f3d0" : "#fde68a"}`,
                              whiteSpace: "nowrap"
                            }}>
                              <CheckCircle2 size={11} /> {baselineRec?.status || "Completed"}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        {(() => {
                          const fpcSurveys = (state.records?.surveys || []).filter(s => s.fpcId === fpc.id);
                          return (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: 12,
                              background: "#f1f5f9",
                              color: "#334155",
                              border: "1px solid #cbd5e1",
                              whiteSpace: "nowrap"
                            }}>
                              <ClipboardCheck size={11} style={{ color: "#059669" }} /> {fpcSurveys.length} {fpcSurveys.length === 1 ? "Survey" : "Surveys"}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-primary compact"
                          style={{ padding: "4px 9px", fontSize: "11px" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFpc(fpc);
                          }}
                          title="View complete FPC details"
                        >
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination */}
          <div className="flex justify-between items-center mt-3 text-xs text-slate-500">
            <span>
              Showing {(dirPage - 1) * 8 + 1} to {Math.min(dirPage * 8, filteredFpcs.length)} of {filteredFpcs.length} FPCs
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline compact"
                disabled={dirPage === 1}
                onClick={() => setDirPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="px-2 py-1 font-semibold">{dirPage} / {totalPages}</span>
              <button
                type="button"
                className="btn-outline compact"
                disabled={dirPage === totalPages}
                onClick={() => setDirPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 7. DEDICATED INDIVIDUAL FPC MANAGEMENT WORKSPACE */}
      {/* ========================================================= */}
      {monitoredFpc ? (
        <FpcWorkspace
          fpc={monitoredFpc}
          allFpcs={allFpcs}
          state={state}
          setState={setState}
          role={role}
          onBack={handleBackToOverview}
          onSelectFpc={(newFpc) => {
            setMonitoredFpc(newFpc);
            setSelectedFpcId(newFpc.id);
          }}
          setToast={setToast}
          go={go}
        />
      ) : null}
    </div>
  );
}
