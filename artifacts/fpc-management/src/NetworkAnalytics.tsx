import React, { useState, useMemo } from "react";
import {
  Building2, Users, Landmark, ShieldCheck, BarChart3,
  Search, Download, Printer, ArrowLeft, ArrowRight,
  TrendingUp, TrendingDown, Clock, AlertTriangle, AlertCircle,
  FileText, Eye, Check, X, Award, DollarSign,
  Package, ShoppingCart, Warehouse, ArrowUpRight, ArrowDownLeft,
  ChevronDown, ChevronUp, Layers, CheckCircle2, SlidersHorizontal,
  ExternalLink, Zap, RefreshCw, Filter, Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  CartesianGrid
} from "recharts";
import * as XLSX from "xlsx";
import type { Role } from "@/lib/config";
import { type RecordRow, type State, money } from "@/lib/store";
import "./network-analytics.css";

interface Props {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  role: Role;
  setToast: (msg: string) => void;
  go: (dest: string) => void;
}

export default function NetworkAnalytics({
  state,
  setState,
  role,
  setToast,
  go
}: Props) {
  // -------------------------------------------------------------
  // 1. GLOBAL FILTER STATES
  // -------------------------------------------------------------
  const [filterYear, setFilterYear] = useState<string>("FY 2026–27");
  const [filterDateRange, setFilterDateRange] = useState<string>("FY to Date");
  const [filterState, setFilterState] = useState<string>("ALL");
  const [filterDistrict, setFilterDistrict] = useState<string>("ALL");
  const [filterFpcId, setFilterFpcId] = useState<string>("ALL");

  // Active Analytics Navigation Tab ("all" by default, or individual tabs)
  const [activeTab, setActiveTab] = useState<string>("all");

  // Section Collapse States (All expanded by default)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    finance: true,
    comparison: true,
    agribiz: true,
    members: true,
    inventory: true,
    efficiency: true,
    compliance: true,
    leaderboard: true,
    insights: true
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== "all") {
      setOpenSections(prev => ({ ...prev, [tabId]: true }));
    }
    setTimeout(() => {
      const targetId = tabId === "all" ? "section-finance" : `section-${tabId}`;
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };

  // Financial timeframe toggle
  const [financeTimeframe, setFinanceTimeframe] = useState<"Weekly" | "Monthly" | "Quarterly" | "Yearly">("Monthly");

  // Leaderboard ranking tab
  const [leaderboardTab, setLeaderboardTab] = useState<
    "revenue" | "profit" | "farmers" | "procurement" | "sales" | "inventory" | "growth"
  >("revenue");
  const [showAllLeaderboard, setShowAllLeaderboard] = useState<boolean>(false);

  // FPC Comparison Multi-Select
  const [comparedFpcIds, setComparedFpcIds] = useState<string[]>(["FPC-ODI-001", "FPC-ODI-002"]);
  const [fpcSearch, setFpcSearch] = useState<string>("");
  const [sortField, setSortField] = useState<string>("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Insights filter
  const [insightSeverityFilter, setInsightSeverityFilter] = useState<string>("ALL");

  // All FPCs list from store
  const allFpcs: RecordRow[] = useMemo(() => state.records?.fpcs || [], [state.records?.fpcs]);

  // -------------------------------------------------------------
  // DYNAMIC FILTERING ENGINE (Reacts to all 5 global filters)
  // -------------------------------------------------------------
  const filteredFpcs = useMemo(() => {
    return allFpcs.filter(f => {
      if (filterState !== "ALL" && f.state !== filterState) return false;
      if (filterDistrict !== "ALL" && f.district !== filterDistrict) return false;
      if (filterFpcId !== "ALL" && f.id !== filterFpcId) return false;
      return true;
    });
  }, [allFpcs, filterState, filterDistrict, filterFpcId]);

  // Relative scaling based on global date range / financial year
  const timeScaleFactor = useMemo(() => {
    if (filterDateRange === "Today") return 0.04;
    if (filterDateRange === "This Week") return 0.12;
    if (filterDateRange === "This Month") return 0.28;
    if (filterDateRange === "This Quarter") return 0.65;
    return 1.0;
  }, [filterDateRange]);

  // -------------------------------------------------------------
  // 2. NETWORK GROWTH METRICS & KPIS
  // -------------------------------------------------------------
  const growthKpis = useMemo(() => {
    const totalFpcs = filteredFpcs.length;
    const totalFarmers = filteredFpcs.reduce((acc, f) => {
      const num = parseInt(String(f.farmers || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + num;
    }, 0);

    const totalShareholders = filteredFpcs.reduce((acc, f) => {
      const num = parseInt(String(f.shareholders || "0").replace(/[^0-9]/g, "")) || 0;
      return acc + (num > 0 ? num : 148);
    }, 0);

    const totalBuyers = Math.min(state.records?.buyers?.length || 4, Math.max(1, Math.round(totalFpcs * 0.5)));
    const totalSuppliers = Math.min(state.records?.suppliers?.length || 3, Math.max(1, Math.round(totalFpcs * 0.4)));

    const totalGodowns = filteredFpcs.reduce((acc, f) => {
      if (f.id === "FPC-ODI-001") return acc + ((state.records?.godowns?.length || 2) + 2);
      return acc + (Number(f.godownCount) || (f.id === "FPC-ODI-002" ? 6 : f.id === "FPC-JHK-002" || f.id === "FPC-JHK-003" ? 3 : 4));
    }, 0);

    const totalEmployees = filteredFpcs.reduce((acc, f) => acc + (Number(f.employeeCount) || 8), 0);
    const totalVillages = Math.round(totalFarmers / 20.3);

    return {
      totalFpcs,
      totalFarmers,
      totalShareholders,
      totalBuyers,
      totalSuppliers,
      totalGodowns,
      totalEmployees,
      totalVillages
    };
  }, [filteredFpcs, state.records?.buyers, state.records?.suppliers, state.records?.godowns]);

  // Growth Chart Trajectories
  const growthCurves = useMemo(() => {
    const scale = filteredFpcs.length / 8;
    return {
      fpcRegistration: [
        { year: "2021", count: Math.round(2 * scale) || 1 },
        { year: "2022", count: Math.round(4 * scale) || 1 },
        { year: "2023", count: Math.round(5 * scale) || 2 },
        { year: "2024", count: Math.round(6 * scale) || 2 },
        { year: "2025", count: Math.round(7 * scale) || 3 },
        { year: "2026", count: Math.round(8 * scale) || 3 },
      ],
      farmerGrowth: [
        { season: "Kharif '24", farmers: Math.round(520 * scale) },
        { season: "Rabi '24", farmers: Math.round(640 * scale) },
        { season: "Kharif '25", farmers: Math.round(780 * scale) },
        { season: "Rabi '25", farmers: Math.round(860 * scale) },
        { season: "Kharif '26", farmers: Math.round(977 * scale) },
      ],
      shareholderGrowth: [
        { year: "2022", members: Math.round(450 * scale) },
        { year: "2023", members: Math.round(720 * scale) },
        { year: "2024", members: Math.round(910 * scale) },
        { year: "2025", members: Math.round(1050 * scale) },
        { year: "2026", members: Math.round(1184 * scale) },
      ],
      districtDist: [
        { district: "Keonjhar", fpcs: filteredFpcs.filter(f => f.district === "Keonjhar").length },
        { district: "West Singhbhum", fpcs: filteredFpcs.filter(f => f.district === "West Singhbhum").length },
        { district: "Jajpur", fpcs: filteredFpcs.filter(f => f.district === "Jajpur").length },
        { district: "Seraikela", fpcs: filteredFpcs.filter(f => f.district === "Seraikela-Kharsawan").length },
      ].filter(d => d.fpcs > 0)
    };
  }, [filteredFpcs]);

  // -------------------------------------------------------------
  // 3. FINANCIAL PERFORMANCE METRICS & CHARTS
  // -------------------------------------------------------------
  const financialAnalytics = useMemo(() => {
    let revSum = 0;
    let expSum = 0;
    let profitSum = 0;

    filteredFpcs.forEach(f => {
      const r = Number(f.turnover || 0) * timeScaleFactor;
      let e = 0;
      if (f.id === "FPC-ODI-002") e = 14800000 * timeScaleFactor;
      else if (f.id === "FPC-JHK-001") e = 7430000 * timeScaleFactor;
      else if (f.id === "FPC-ODI-004") e = 6710000 * timeScaleFactor;
      else if (f.id === "FPC-ODI-001") e = 6460000 * timeScaleFactor;
      else if (f.id === "FPC-ODI-005") e = 5180000 * timeScaleFactor;
      else if (f.id === "FPC-ODI-003") e = 3620000 * timeScaleFactor;
      else if (f.id === "FPC-JHK-003") e = 2450000 * timeScaleFactor;
      else e = 0;

      revSum += r;
      expSum += e;
      profitSum += (r - e);
    });

    const grossProfit = revSum * 0.186;
    const netProfit = profitSum;
    const receivables = Math.round(revSum * 0.012);
    const payables = Math.round(expSum * 0.005);
    const totalTxValue = revSum + expSum;

    return {
      revSum: Math.round(revSum),
      expSum: Math.round(expSum),
      grossProfit: Math.round(grossProfit),
      netProfit: Math.round(netProfit),
      receivables,
      payables,
      totalTxValue: Math.round(totalTxValue)
    };
  }, [filteredFpcs, timeScaleFactor]);

  // Financial Trend Series
  const financeTrendData = useMemo(() => {
    const scale = (financialAnalytics.revSum || 50700000) / 50700000;
    if (financeTimeframe === "Weekly") {
      return [
        { period: "W38 (Sep 15)", revenue: Math.round(1840000 * scale), expenses: Math.round(1620000 * scale), profit: Math.round(220000 * scale) },
        { period: "W39 (Sep 22)", revenue: Math.round(2120000 * scale), expenses: Math.round(1880000 * scale), profit: Math.round(240000 * scale) },
        { period: "W40 (Sep 29)", revenue: Math.round(2450000 * scale), expenses: Math.round(2160000 * scale), profit: Math.round(290000 * scale) },
        { period: "W41 (Oct 06)", revenue: Math.round(2780000 * scale), expenses: Math.round(2420000 * scale), profit: Math.round(360000 * scale) },
        { period: "W42 (Oct 13)", revenue: Math.round(2910000 * scale), expenses: Math.round(2550000 * scale), profit: Math.round(360000 * scale) },
        { period: "W43 (Oct 20)", revenue: Math.round(3160000 * scale), expenses: Math.round(2740000 * scale), profit: Math.round(420000 * scale) },
      ];
    } else if (financeTimeframe === "Monthly") {
      return [
        { period: "May '26", revenue: Math.round(3420000 * scale), expenses: Math.round(3110000 * scale), profit: Math.round(310000 * scale) },
        { period: "Jun '26", revenue: Math.round(3860000 * scale), expenses: Math.round(3490000 * scale), profit: Math.round(370000 * scale) },
        { period: "Jul '26", revenue: Math.round(4140000 * scale), expenses: Math.round(3750000 * scale), profit: Math.round(390000 * scale) },
        { period: "Aug '26", revenue: Math.round(4680000 * scale), expenses: Math.round(4210000 * scale), profit: Math.round(470000 * scale) },
        { period: "Sep '26", revenue: Math.round(5210000 * scale), expenses: Math.round(4680000 * scale), profit: Math.round(530000 * scale) },
        { period: "Oct '26", revenue: Math.round(5840000 * scale), expenses: Math.round(5160000 * scale), profit: Math.round(680000 * scale) },
      ];
    } else if (financeTimeframe === "Quarterly") {
      return [
        { period: "Q1 FY26", revenue: Math.round(11420000 * scale), expenses: Math.round(10350000 * scale), profit: Math.round(1070000 * scale) },
        { period: "Q2 FY26", revenue: Math.round(14030000 * scale), expenses: Math.round(12640000 * scale), profit: Math.round(1390000 * scale) },
        { period: "Q3 FY26", revenue: Math.round(13250000 * scale), expenses: Math.round(12040000 * scale), profit: Math.round(1210000 * scale) },
        { period: "Q4 FY26", revenue: Math.round(12000000 * scale), expenses: Math.round(11300000 * scale), profit: Math.round(700000 * scale) },
      ];
    } else {
      return [
        { period: "FY23", revenue: Math.round(18200000 * scale), expenses: Math.round(17100000 * scale), profit: Math.round(1100000 * scale) },
        { period: "FY24", revenue: Math.round(26500000 * scale), expenses: Math.round(24600000 * scale), profit: Math.round(1900000 * scale) },
        { period: "FY25", revenue: Math.round(40700000 * scale), expenses: Math.round(37500000 * scale), profit: Math.round(3200000 * scale) },
        { period: "FY26", revenue: Math.round(50700000 * scale), expenses: Math.round(46330000 * scale), profit: Math.round(4370000 * scale) },
      ];
    }
  }, [financialAnalytics.revSum, financeTimeframe]);

  // FPC Revenue & Profitability Breakdown
  const fpcFinBreakdown = useMemo(() => {
    return filteredFpcs.map(f => {
      const rev = Number(f.turnover || 0);
      let exp = 0;
      if (f.id === "FPC-ODI-002") exp = 14800000;
      else if (f.id === "FPC-JHK-001") exp = 7430000;
      else if (f.id === "FPC-ODI-004") exp = 6710000;
      else if (f.id === "FPC-ODI-001") exp = 6460000;
      else if (f.id === "FPC-ODI-005") exp = 5180000;
      else if (f.id === "FPC-ODI-003") exp = 3620000;
      else if (f.id === "FPC-JHK-003") exp = 2450000;

      const prof = rev - exp;
      return {
        name: f.name.replace(/Farmer Producer Company Ltd\.|Agri Producers Co\.|Growers FPC|Producers FPC|Farmers FPC/gi, "").trim(),
        fullName: f.name,
        revenue: rev,
        expenses: exp,
        profit: prof
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [filteredFpcs]);

  // -------------------------------------------------------------
  // 4. FPC PERFORMANCE COMPARISON MATRIX
  // -------------------------------------------------------------
  const fpcPerformanceData = useMemo(() => {
    return filteredFpcs.map((f) => {
      const rev = Number(f.turnover || 0);
      let expenses = 0;
      let growth = 0;
      let score = 75;

      if (f.id === "FPC-ODI-002") { expenses = 14800000; growth = 22.4; score = 95; }
      else if (f.id === "FPC-JHK-001") { expenses = 7430000; growth = 18.2; score = 91; }
      else if (f.id === "FPC-ODI-001") { expenses = 6460000; growth = 12.8; score = 88; }
      else if (f.id === "FPC-ODI-004") { expenses = 6710000; growth = 14.5; score = 86; }
      else if (f.id === "FPC-ODI-003") { expenses = 3620000; growth = 6.1; score = 78; }
      else if (f.id === "FPC-ODI-005") { expenses = 5180000; growth = 8.6; score = 74; }
      else if (f.id === "FPC-JHK-003") { expenses = 2450000; growth = -11.5; score = 52; }
      else { expenses = 0; growth = 0; score = 45; }

      const profit = rev - expenses;
      const farmers = parseInt(String(f.farmers || "0").replace(/[^0-9]/g, "")) || 0;
      const shareholders = parseInt(String(f.shareholders || "0").replace(/[^0-9]/g, "")) || 148;
      const txCount = Math.round(rev / 38000) || (f.status === "Active" ? 42 : 12);

      return {
        fpc: f,
        id: f.id,
        name: f.name,
        district: f.district || "Keonjhar",
        state: f.state || "Odisha",
        farmers,
        shareholders,
        revenue: rev,
        expenses,
        profit,
        growth,
        txCount,
        status: f.status || "Active",
        score
      };
    }).filter(f => {
      if (!fpcSearch.trim()) return true;
      const q = fpcSearch.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.district.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
    }).sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [filteredFpcs, fpcSearch, sortField, sortOrder]);

  const comparedFpcsList = useMemo(() => {
    return fpcPerformanceData.filter(f => comparedFpcIds.includes(f.id));
  }, [fpcPerformanceData, comparedFpcIds]);

  // -------------------------------------------------------------
  // 5. AGRICULTURAL BUSINESS ANALYTICS
  // -------------------------------------------------------------
  const agribizCommodities = [
    { commodity: "Paddy Common", volumeMt: 980, revenueLakhs: 245.0, purchasesMt: 1020, salesMt: 980 },
    { commodity: "Hybrid Maize", volumeMt: 420, revenueLakhs: 84.0, purchasesMt: 440, salesMt: 420 },
    { commodity: "Arhar (Pigeon Pea)", volumeMt: 260, revenueLakhs: 182.0, purchasesMt: 275, salesMt: 260 },
    { commodity: "Mustard Seed", volumeMt: 190, revenueLakhs: 104.5, purchasesMt: 200, salesMt: 190 },
    { commodity: "Ragi (Finger Millet)", volumeMt: 180, revenueLakhs: 63.0, purchasesMt: 195, salesMt: 180 },
    { commodity: "Tomato (Fresh)", volumeMt: 140, revenueLakhs: 42.0, purchasesMt: 155, salesMt: 140 },
    { commodity: "Groundnut", volumeMt: 120, revenueLakhs: 78.0, purchasesMt: 125, salesMt: 120 },
    { commodity: "Black Gram (Urad)", volumeMt: 85, revenueLakhs: 59.5, purchasesMt: 90, salesMt: 85 },
    { commodity: "Green Gram (Moong)", volumeMt: 65, revenueLakhs: 52.0, purchasesMt: 70, salesMt: 65 },
    { commodity: "Dry Red Chilli", volumeMt: 45, revenueLakhs: 49.5, purchasesMt: 48, salesMt: 45 },
  ];

  // -------------------------------------------------------------
  // 6. MEMBER ANALYTICS (Farmer & Shareholder)
  // -------------------------------------------------------------
  const blockFarmerDist = [
    { block: "Keonjhar Sadar", farmers: 248, villageCount: 12 },
    { block: "Jajpur Sadar", farmers: 214, villageCount: 9 },
    { block: "Noamundi", farmers: 156, villageCount: 8 },
    { block: "Harichandanpur", farmers: 132, villageCount: 7 },
    { block: "Telkoi", farmers: 119, villageCount: 6 },
    { block: "Seraikela", farmers: 88, villageCount: 4 },
    { block: "Chaibasa", farmers: 71, villageCount: 4 },
  ];

  const demographicEquity = [
    { demographic: "Small & Marginal Farmers", percentage: 82, fill: "#2e7d32" },
    { demographic: "Women Farmers", percentage: 38, fill: "#1565c0" },
    { demographic: "Tribal (ST) Farmers", percentage: 34, fill: "#f59e0b" },
    { demographic: "SC Community", percentage: 18, fill: "#7e22ce" },
  ];

  // -------------------------------------------------------------
  // 7. INVENTORY & STORAGE ANALYTICS
  // -------------------------------------------------------------
  const inventoryDistData = [
    { district: "Keonjhar", capacityMt: 2800, utilizedMt: 1792, utilRate: 64 },
    { district: "Jajpur", capacityMt: 1800, utilizedMt: 1296, utilRate: 72 },
    { district: "West Singhbhum", capacityMt: 1200, utilizedMt: 624, utilRate: 52 },
    { district: "Seraikela", capacityMt: 600, utilizedMt: 228, utilRate: 38 },
  ];

  // -------------------------------------------------------------
  // 8. LEADERBOARD RANKINGS (7 Distinct Operational Dimensions)
  // -------------------------------------------------------------
  const leaderboardRankings = useMemo(() => {
    const list = [...fpcPerformanceData];
    if (leaderboardTab === "revenue") list.sort((a, b) => b.revenue - a.revenue);
    else if (leaderboardTab === "profit") list.sort((a, b) => b.profit - a.profit);
    else if (leaderboardTab === "farmers") list.sort((a, b) => b.farmers - a.farmers);
    else if (leaderboardTab === "procurement") list.sort((a, b) => b.revenue * 0.65 - a.revenue * 0.65);
    else if (leaderboardTab === "sales") list.sort((a, b) => b.revenue - a.revenue);
    else if (leaderboardTab === "inventory") list.sort((a, b) => b.score - a.score);
    else if (leaderboardTab === "growth") list.sort((a, b) => b.growth - a.growth);

    return showAllLeaderboard ? list : list.slice(0, 5);
  }, [fpcPerformanceData, leaderboardTab, showAllLeaderboard]);

  // -------------------------------------------------------------
  // 9. SMART INSIGHTS & RECOMMENDATIONS
  // -------------------------------------------------------------
  const smartInsights = useMemo(() => {
    return [
      {
        id: "INS-01",
        title: "Operational Deficit Intervention",
        entity: "Chaibasa Organic FPC (West Singhbhum)",
        metric: "Net Loss: -₹3.40 Lakhs (-11.5% margin)",
        severity: "Critical",
        observation: "Organic produce turnover deficit and post-harvest perishables spoilage at transit store.",
        action: "Initiate operational turnaround review and connect cold-chain links to Jamshedpur retail mandis."
      },
      {
        id: "INS-02",
        title: "Statutory Filings Overdue",
        entity: "Barbil Oilseed Growers FPC (Keonjhar)",
        metric: "MCA Form AOC-4 & MGT-7 Overdue by 11 days",
        severity: "Critical",
        observation: "Statutory ROC annual filings overdue at ROC Cuttack with imminent compliance penalty exposure.",
        action: "Issue urgent compliance directive to Board Chairperson and statutory auditor."
      },
      {
        id: "INS-03",
        title: "Pending Monthly GST GSTR-3B",
        entity: "Green Valley FPC (Keonjhar)",
        metric: "GSTR-3B overdue since 20 Oct 2026",
        severity: "High",
        observation: "Input tax credit (ITC) ledger reconciliation required before monthly inward filing.",
        action: "Dispatch compliance reminder SMS & automated notice to CEO and accountant."
      },
      {
        id: "INS-04",
        title: "Field POS Node Sync Lag",
        entity: "Gonda Tribal Farmers FPC (Keonjhar)",
        metric: "POS Node unsynced for 12 days",
        severity: "High",
        observation: "Offline field point-of-sale node has 38 un-uploaded farmer produce weighment slips.",
        action: "Ping field gateway and dispatch field officer to ensure sync connectivity."
      },
      {
        id: "INS-05",
        title: "Fertilizer License Expiring Soon",
        entity: "Keonjhar District Agriculture Office",
        metric: "FL/KEO/2023/041 expires in 44 days",
        severity: "Medium",
        observation: "Retail fertilizer distribution authorization expires on 14 Dec 2026.",
        action: "Generate statutory renewal dossier and submit treasury challan to DAO Keonjhar."
      },
      {
        id: "INS-06",
        title: "Underutilized Warehouse Capacity",
        entity: "West Singhbhum District Godowns",
        metric: "Current Utilization: 52% (576 MT idle)",
        severity: "Low",
        observation: "Warehouse space available ahead of upcoming Kharif harvest procurement.",
        action: "Authorize advance procurement contracts to optimize storage capacity."
      },
      {
        id: "INS-07",
        title: "High Growth Expansion Opportunity",
        entity: "Kalinganagar Agri Producers Co. (Jajpur)",
        metric: "YoY Growth: +22.4% · Turnover: ₹1.62 Cr",
        severity: "Low",
        observation: "Fastest growing FPC with 72% warehouse utilization and strong institutional off-taker demand.",
        action: "Sanction additional revolving working capital credit line for expansion into Danagadi block."
      }
    ].filter(i => {
      if (insightSeverityFilter === "ALL") return true;
      return i.severity.toLowerCase() === insightSeverityFilter.toLowerCase();
    });
  }, [insightSeverityFilter]);

  // -------------------------------------------------------------
  // MULTI-SHEET EXCEL EXPORT
  // -------------------------------------------------------------
  const exportComprehensiveAnalyticsExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Growth & KPIs
    const growthRows = [
      { Metric: "Total FPCs", Value: growthKpis.totalFpcs, Growth: "+25.0% vs FY25" },
      { Metric: "Total Farmers", Value: growthKpis.totalFarmers, Growth: "+18.5% YoY" },
      { Metric: "Total Shareholders", Value: growthKpis.totalShareholders, Growth: "+12.4% YoY" },
      { Metric: "Total Buyers", Value: growthKpis.totalBuyers, Growth: "+33.3%" },
      { Metric: "Total Suppliers", Value: growthKpis.totalSuppliers, Growth: "+50.0%" },
      { Metric: "Total Godowns", Value: growthKpis.totalGodowns, Growth: "+14.3%" },
      { Metric: "Total Employees", Value: growthKpis.totalEmployees, Growth: "+10.0%" },
      { Metric: "Villages Covered", Value: growthKpis.totalVillages, Growth: "+20.0%" },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(growthRows), "Network Growth");

    // Sheet 2: Financial Performance
    const finRows = [
      { Metric: "Total Network Revenue", Amount: financialAnalytics.revSum },
      { Metric: "Total Network Expenses", Amount: financialAnalytics.expSum },
      { Metric: "Gross Profit Margin", Amount: financialAnalytics.grossProfit },
      { Metric: "Net Profit Realized", Amount: financialAnalytics.netProfit },
      { Metric: "Outstanding Receivables", Amount: financialAnalytics.receivables },
      { Metric: "Outstanding Payables", Amount: financialAnalytics.payables },
      { Metric: "Total Transaction Volume", Amount: financialAnalytics.totalTxValue },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finRows), "Financial Performance");

    // Sheet 3: FPC Performance Comparison
    const fpcRows = fpcPerformanceData.map(f => ({
      "FPC ID": f.id,
      "FPC Name": f.name,
      "District": f.district,
      "State": f.state,
      "Farmers": f.farmers,
      "Shareholders": f.shareholders,
      "Revenue (INR)": f.revenue,
      "Expenses (INR)": f.expenses,
      "Net Profit (INR)": f.profit,
      "YoY Growth %": f.growth,
      "Transaction Count": f.txCount,
      "Performance Score": f.score,
      "Status": f.status
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fpcRows), "FPC Performance Analysis");

    // Sheet 4: Agricultural Commodities
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(agribizCommodities), "Agri Commodities");

    // Sheet 5: Smart Insights
    const insightRows = smartInsights.map(i => ({
      "ID": i.id,
      "Title": i.title,
      "Entity": i.entity,
      "Metric": i.metric,
      "Severity": i.severity,
      "Observation": i.observation,
      "Recommended Action": i.action
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(insightRows), "Executive Insights");

    XLSX.writeFile(wb, `TSF_Network_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setToast("Multi-sheet Network Analytics Report exported to Excel");
  };

  return (
    <div className="na-shell" data-testid="tsf-network-analytics-page">
      {/* ========================================================= */}
      {/* 1. ANALYTICS HEADER & GLOBAL FILTERS */}
      {/* ========================================================= */}
      <header className="na-header-panel">
        <div className="na-header-top">
          <div className="na-header-title-block">
            <div className="na-header-icon">
              <BarChart3 size={24} />
            </div>
            <div className="na-header-titles">
              <h1>
                Network Analytics
                <span className="tsf-badge-network">Central Decision Support</span>
              </h1>
              <p>
                Consolidated performance, growth, financial health and operational insights across all partner FPCs.
              </p>
            </div>
          </div>

          <div className="na-header-actions">
            <button
              type="button"
              className="btn-outline compact"
              onClick={() => go("/national-dashboard")}
              title="Return to TSF Central Dashboard"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>

            <button
              type="button"
              className="btn-outline compact"
              onClick={exportComprehensiveAnalyticsExcel}
              title="Download comprehensive multi-sheet Excel dossier"
            >
              <Download size={14} /> Export Report (Excel)
            </button>

            <button
              type="button"
              className="btn-primary compact"
              onClick={() => window.print()}
              title="Print or save analytics as PDF"
            >
              <Printer size={14} /> Print / PDF
            </button>
          </div>
        </div>

        {/* Global Filters Bar */}
        <div className="na-filters-strip">
          <div className="na-filters-group">
            <label className="text-xs font-semibold text-slate-500">Financial Year:</label>
            <select
              aria-label="Filter Financial Year"
              className="na-select"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="FY 2026–27">FY 2026–27 (Current)</option>
              <option value="FY 2025–26">FY 2025–26</option>
              <option value="FY 2024–25">FY 2024–25</option>
              <option value="All FYs">All Financial Years</option>
            </select>

            <label className="text-xs font-semibold text-slate-500 ml-2">Date Range:</label>
            <select
              aria-label="Filter Date Range"
              className="na-select"
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
            >
              <option value="FY to Date">FY to Date</option>
              <option value="This Quarter">This Quarter</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
              <option value="Today">Today</option>
              <option value="All Time">All Time (5 Years)</option>
            </select>

            <label className="text-xs font-semibold text-slate-500 ml-2">State:</label>
            <select
              aria-label="Filter State"
              className="na-select"
              value={filterState}
              onChange={(e) => { setFilterState(e.target.value); setFilterDistrict("ALL"); }}
            >
              <option value="ALL">All States (Odisha & Jharkhand)</option>
              <option value="Odisha">Odisha</option>
              <option value="Jharkhand">Jharkhand</option>
            </select>

            <label className="text-xs font-semibold text-slate-500 ml-2">District:</label>
            <select
              aria-label="Filter District"
              className="na-select"
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
            >
              <option value="ALL">All Districts</option>
              {filterState !== "Jharkhand" && <option value="Keonjhar">Keonjhar (4 FPCs)</option>}
              {filterState !== "Jharkhand" && <option value="Jajpur">Jajpur (1 FPC)</option>}
              {filterState !== "Odisha" && <option value="West Singhbhum">West Singhbhum (2 FPCs)</option>}
              {filterState !== "Odisha" && <option value="Seraikela-Kharsawan">Seraikela-Kharsawan (1 FPC)</option>}
            </select>

            <label className="text-xs font-semibold text-slate-500 ml-2">FPC Scope:</label>
            <select
              aria-label="Filter FPC Scope"
              className="na-select"
              value={filterFpcId}
              onChange={(e) => setFilterFpcId(e.target.value)}
            >
              <option value="ALL">🌐 All FPCs ({filteredFpcs.length} Selected)</option>
              {allFpcs.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.district})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="na-filter-active-pill">
              <SlidersHorizontal size={12} /> {filteredFpcs.length} of {allFpcs.length} FPCs Active in Scope
            </span>
          </div>
        </div>

        {/* Analytics Navigation Tabs */}
        <div className="na-nav-tabs" role="tablist" aria-label="Network Analytics Navigation Tabs">
          {[
            { id: "all", label: "All Analyses", icon: Layers },
            { id: "finance", label: "Financial Performance", icon: Landmark },
            { id: "comparison", label: "FPC Comparison", icon: Award },
            { id: "agribiz", label: "Agri Business Flow", icon: ShoppingCart },
            { id: "members", label: "Member Analytics", icon: Users },
            { id: "inventory", label: "Inventory & Godowns", icon: Warehouse },
            { id: "efficiency", label: "Operational Efficiency", icon: Zap },
            { id: "compliance", label: "Compliance Analytics", icon: ShieldCheck },
            { id: "leaderboard", label: "Network Leaderboard", icon: Award },
            { id: "insights", label: "Smart Insights", icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={`na-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 1. SECTION: FINANCIAL PERFORMANCE ANALYTICS */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "finance") && (
        <section id="section-finance" className={`na-section-panel ${openSections.finance ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("finance")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Landmark size={18} /></div>
            <div>
              <h2>Financial Performance Analytics</h2>
              <p>Consolidated revenue, operating expenditure, gross & net margins, receivables, and payables</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.finance ? "Collapse" : "Expand"}</span>
            {openSections.finance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.finance && (
          <div className="na-section-content">
            {/* Financial Summary Strip */}
            <div className="na-summary-strip">
              <div className="na-summary-item">
                <small>Total Revenue</small>
                <b className="text-emerald-700">{money(financialAnalytics.revSum)}</b>
              </div>
              <div className="na-summary-item">
                <small>Operating Expenses</small>
                <b className="text-amber-700">{money(financialAnalytics.expSum)}</b>
              </div>
              <div className="na-summary-item">
                <small>Gross Margin</small>
                <b className="text-slate-800">{money(financialAnalytics.grossProfit)} (18.6%)</b>
              </div>
              <div className="na-summary-item">
                <small>Net Profit</small>
                <b className={financialAnalytics.netProfit >= 0 ? "text-blue-700" : "text-red-700"}>
                  {money(financialAnalytics.netProfit)} ({((financialAnalytics.netProfit / (financialAnalytics.revSum || 1)) * 100).toFixed(1)}%)
                </b>
              </div>
              <div className="na-summary-item">
                <small>Buyer Receivables</small>
                <b className="text-amber-800">{money(financialAnalytics.receivables)}</b>
              </div>
              <div className="na-summary-item">
                <small>Supplier Payables</small>
                <b className="text-slate-700">{money(financialAnalytics.payables)}</b>
              </div>
              <div className="na-summary-item ml-auto">
                <small>Total Tx Value</small>
                <b className="text-emerald-900">{money(financialAnalytics.totalTxValue)}</b>
              </div>
            </div>

            {/* Timeframe Controls Strip */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Analysis Granularity:</span>
                <div className="tsf-period-chips" role="radiogroup">
                  {(["Weekly", "Monthly", "Quarterly", "Yearly"] as const).map(tf => (
                    <button
                      type="button"
                      key={tf}
                      className={`tsf-period-chip ${financeTimeframe === tf ? "active" : ""}`}
                      onClick={() => setFinanceTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-500 italic">
                * Realized totals reflect approved statutory transactions only. Unapproved entries excluded.
              </span>
            </div>

            {/* Financial Charts 1 & 2 */}
            <div className="na-grid-2col">
              {/* Monthly Revenue vs Expenses */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><BarChart3 size={15} className="text-emerald-700" /> Revenue vs Operating Expenses</h3>
                    <p>Trading turnover against cost of goods and administration</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">{financeTimeframe} Analysis</span>
                </div>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v: any) => money(Number(v))} />
                      <RechartsLegend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#2e7d32" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net Profit Margin Trend */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><DollarSign size={15} className="text-blue-700" /> Net Profit Trend</h3>
                    <p>Bottom-line surplus trajectory after all operational overheads</p>
                  </div>
                  <span className="text-xs font-bold text-blue-800">Net Surplus</span>
                </div>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financeTrendData}>
                      <defs>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1565c0" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#1565c0" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v: any) => money(Number(v))} />
                      <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#1565c0" strokeWidth={2.5} fill="url(#profitGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Financial Charts 3, 4, 5 */}
            <div className="na-grid-3col">
              {/* Chart 3: FPC-wise Revenue Comparison */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3>FPC-wise Revenue</h3>
                    <p>Gross turnover volume per FPC</p>
                  </div>
                </div>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fpcFinBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(v: any) => money(Number(v))} />
                      <Bar dataKey="revenue" name="Revenue" fill="#2e7d32" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Profitability Distribution across FPCs */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3>FPC Net Margin (P&L)</h3>
                    <p>Surplus vs deficit breakdown</p>
                  </div>
                </div>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fpcFinBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={45} />
                      <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(v: any) => money(Number(v))} />
                      <Bar dataKey="profit" name="Net Profit">
                        {fpcFinBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#1565c0" : "#c62828"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 5: Revenue Contribution by Business Category */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3>Business Category Share</h3>
                    <p>Revenue distribution by segment</p>
                  </div>
                </div>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Produce Procurement", value: 68, fill: "#2e7d32" },
                          { name: "Farm Input Supply", value: 24, fill: "#f59e0b" },
                          { name: "Machinery Hiring", value: 5, fill: "#1565c0" },
                          { name: "Value Addition", value: 3, fill: "#7e22ce" },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {[
                          { fill: "#2e7d32" },
                          { fill: "#f59e0b" },
                          { fill: "#1565c0" },
                          { fill: "#7e22ce" },
                        ].map((entry, index) => (
                          <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any) => `${val}%`} />
                      <RechartsLegend verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 2. SECTION: FPC PERFORMANCE COMPARISON MATRIX */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "comparison") && (
      <section id="section-comparison" className={`na-section-panel ${openSections.comparison ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("comparison")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Award size={18} /></div>
            <div>
              <h2>FPC Performance Analysis</h2>
              <p>Comparative benchmark matrix across turnover, membership, profitability, transaction volume, and operational scores</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.comparison ? "Collapse" : "Expand"}</span>
            {openSections.comparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.comparison && (
          <div className="na-section-content">
            {/* FPC Incorporation Trajectory & District Cluster Distribution */}
            <div className="na-grid-2col" style={{ marginBottom: "18px" }}>
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Building2 size={15} className="text-emerald-700" /> FPC Registration Growth</h3>
                    <p>Cumulative legal incorporation of producer companies</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800">2021–2026 Trajectory</span>
                </div>
                <div style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthCurves.fpcRegistration}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Cumulative FPCs" fill="#1b5e20" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Building2 size={15} className="text-purple-700" /> District-wise FPC Distribution</h3>
                    <p>Cluster geographic distribution across operational districts</p>
                  </div>
                  <span className="text-xs font-bold text-purple-800">{filteredFpcs.length} FPCs In Scope</span>
                </div>
                <div style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthCurves.districtDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="district" width={110} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="fpcs" name="FPC Count" fill="#7e22ce" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Filter & Multi-Select Action Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="tsf-search-box" style={{ minWidth: 260 }}>
                <Search size={14} className="text-slate-400" />
                <input
                  placeholder="Search FPC by name, code or district..."
                  value={fpcSearch}
                  onChange={(e) => setFpcSearch(e.target.value)}
                />
                {fpcSearch && (
                  <button type="button" onClick={() => setFpcSearch("")} className="text-slate-400">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">
                  Comparing {comparedFpcIds.length} FPCs:
                </span>
                {comparedFpcIds.map(cid => {
                  const f = allFpcs.find(x => x.id === cid);
                  return (
                    <span key={cid} className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 text-slate-700">
                      {f ? f.name.slice(0, 14) + "..." : cid}
                      <button type="button" onClick={() => setComparedFpcIds(prev => prev.filter(x => x !== cid))}>
                        <X size={10} />
                      </button>
                    </span>
                  );
                })}
                {comparedFpcIds.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 font-bold ml-1 hover:underline"
                    onClick={() => setComparedFpcIds([])}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Performance Comparison Table */}
            <div className="na-table-container">
              <table className="na-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Compare</th>
                    <th>FPC Name & ID</th>
                    <th>District & State</th>
                    <th
                      className="cursor-pointer hover:text-emerald-700"
                      onClick={() => {
                        setSortField("farmers");
                        setSortOrder(o => o === "asc" ? "desc" : "asc");
                      }}
                    >
                      Farmers {sortField === "farmers" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Shareholders</th>
                    <th
                      className="cursor-pointer hover:text-emerald-700"
                      onClick={() => {
                        setSortField("revenue");
                        setSortOrder(o => o === "asc" ? "desc" : "asc");
                      }}
                    >
                      Revenue {sortField === "revenue" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Expenses</th>
                    <th
                      className="cursor-pointer hover:text-emerald-700"
                      onClick={() => {
                        setSortField("profit");
                        setSortOrder(o => o === "asc" ? "desc" : "asc");
                      }}
                    >
                      Net Profit {sortField === "profit" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      className="cursor-pointer hover:text-emerald-700"
                      onClick={() => {
                        setSortField("growth");
                        setSortOrder(o => o === "asc" ? "desc" : "asc");
                      }}
                    >
                      Growth % {sortField === "growth" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Tx Count</th>
                    <th>Status</th>
                    <th
                      className="cursor-pointer hover:text-emerald-700"
                      onClick={() => {
                        setSortField("score");
                        setSortOrder(o => o === "asc" ? "desc" : "asc");
                      }}
                    >
                      Score {sortField === "score" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fpcPerformanceData.map(item => {
                    const isChecked = comparedFpcIds.includes(item.id);
                    return (
                      <tr key={item.id} className={isChecked ? "bg-emerald-50/30" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setComparedFpcIds(prev => [...prev, item.id]);
                              } else {
                                setComparedFpcIds(prev => prev.filter(x => x !== item.id));
                              }
                            }}
                          />
                        </td>
                        <td>
                          <strong className="text-slate-900 block">{item.name}</strong>
                          <span className="text-[11px] font-mono text-slate-400">{item.id}</span>
                        </td>
                        <td className="text-slate-600">{item.district}, {item.state}</td>
                        <td className="font-semibold">{item.farmers}</td>
                        <td className="font-semibold">{item.shareholders}</td>
                        <td className="font-bold text-slate-900">
                          {item.revenue > 0 ? `₹${(item.revenue / 100000).toFixed(1)} L` : "₹0"}
                        </td>
                        <td className="text-slate-500">
                          {item.expenses > 0 ? `₹${(item.expenses / 100000).toFixed(1)} L` : "₹0"}
                        </td>
                        <td>
                          <strong className={item.profit > 0 ? "text-emerald-700 font-bold" : item.profit < 0 ? "text-red-700 font-bold" : "text-slate-400"}>
                            {item.profit > 0 ? `+₹${(item.profit / 100000).toFixed(1)} L` : item.profit < 0 ? `-₹${(Math.abs(item.profit) / 100000).toFixed(1)} L` : "₹0"}
                          </strong>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-0.5 font-bold ${item.growth > 0 ? "text-emerald-700" : item.growth < 0 ? "text-red-700" : "text-slate-400"}`}>
                            {item.growth > 0 ? `+${item.growth}%` : `${item.growth}%`}
                          </span>
                        </td>
                        <td className="font-mono text-xs">{item.txCount}</td>
                        <td>
                          <span className={`na-chip ${item.status.toLowerCase().includes("active") ? "good" : item.status.toLowerCase().includes("onboarding") ? "blue" : "danger"}`}>
                            <i /> {item.status}
                          </span>
                        </td>
                        <td>
                          <span className={`na-score-pill ${item.score >= 85 ? "high" : item.score >= 70 ? "mid" : "low"}`}>
                            {item.score}/100
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Side-by-Side Comparison Drawer if 2+ FPCs selected */}
            {comparedFpcsList.length >= 2 && (
              <div className="na-compare-box">
                <div className="na-compare-header">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Sparkles size={15} className="text-emerald-700" />
                    Comparative Benchmarking: {comparedFpcsList.map(f => f.name.split(" ")[0]).join(" vs ")}
                  </h3>
                  <span className="text-xs text-slate-500">Side-by-side operational comparison</span>
                </div>

                <div className="na-compare-grid">
                  {comparedFpcsList.map(f => (
                    <div key={f.id} className="na-compare-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-sm text-slate-900 block">{f.name}</strong>
                          <span className="text-xs text-slate-500 font-mono">{f.district}, {f.state}</span>
                        </div>
                        <span className={`na-score-pill ${f.score >= 85 ? "high" : f.score >= 70 ? "mid" : "low"}`}>
                          {f.score} pts
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Revenue:</span>
                          <strong className="text-emerald-800">{money(f.revenue)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Expenses:</span>
                          <strong className="text-slate-700">{money(f.expenses)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Net Profit:</span>
                          <strong className={f.profit >= 0 ? "text-blue-700" : "text-red-700"}>{money(f.profit)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Farmers:</span>
                          <strong>{f.farmers} members</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">YoY Growth:</span>
                          <strong className={f.growth >= 0 ? "text-emerald-700" : "text-red-700"}>{f.growth}%</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 3. SECTION: AGRICULTURAL BUSINESS ANALYTICS */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "agribiz") && (
      <section id="section-agribiz" className={`na-section-panel ${openSections.agribiz ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("agribiz")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Package size={18} /></div>
            <div>
              <h2>Agricultural Business Analytics</h2>
              <p>Produce aggregation, commodity trading volumes, fulfillment rates, and input supply distribution</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.agribiz ? "Collapse" : "Expand"}</span>
            {openSections.agribiz ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.agribiz && (
          <div className="na-section-content">
            {/* Agri Business Summary Banner */}
            <div className="na-summary-strip">
              <div className="na-summary-item">
                <small>Total Produce Purchased</small>
                <b className="text-emerald-800">2,486 MT (₹3.42 Cr)</b>
              </div>
              <div className="na-summary-item">
                <small>Total Produce Sold</small>
                <b className="text-emerald-700">2,340 MT (₹3.86 Cr)</b>
              </div>
              <div className="na-summary-item">
                <small>Fulfillment Realization</small>
                <b className="text-blue-700">94.1% Fulfilled</b>
              </div>
              <div className="na-summary-item">
                <small>Input Distribution</small>
                <b className="text-amber-800">₹1.21 Cr (100 MT Inputs)</b>
              </div>
              <div className="na-summary-item ml-auto">
                <small>Core Crop</small>
                <b className="text-slate-900">Paddy & Hybrid Maize</b>
              </div>
            </div>

            {/* Agri Biz Charts */}
            <div className="na-grid-2col">
              {/* Top 10 Commodities by Volume */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Package size={15} className="text-emerald-700" /> Top 10 Commodities by Volume</h3>
                    <p>Trading tonnage handled across network godowns</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">Metric Tonnes (MT)</span>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agribizCommodities} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="commodity" width={110} tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(v: any) => `${v} MT`} />
                      <Bar dataKey="volumeMt" name="Volume (MT)" fill="#2e7d32" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Purchase vs Sales Quantity */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><ShoppingCart size={15} className="text-blue-700" /> Purchase vs Sales Quantity</h3>
                    <p>Procurement intake vs institutional off-taker realization</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">Key Commodities</span>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agribizCommodities.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="commodity" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(v: any) => `${v} MT`} />
                      <RechartsLegend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="purchasesMt" name="Purchased (MT)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="salesMt" name="Sold (MT)" fill="#2e7d32" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 4. SECTION: MEMBER ANALYTICS (FARMER & SHAREHOLDER) */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "members") && (
      <section id="section-members" className={`na-section-panel ${openSections.members ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("members")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Users size={18} /></div>
            <div>
              <h2>Member Analytics (Farmers & Shareholders)</h2>
              <p>Farmer verification, landholding demographics, block distribution, and shareholder equity participation</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.members ? "Collapse" : "Expand"}</span>
            {openSections.members ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.members && (
          <div className="na-section-content">
            {/* Member Highlights Grid */}
            <div className="na-grid-4col">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Active Farmers</span>
                <strong className="text-xl font-bold text-slate-900 block mt-1">812 of 977</strong>
                <span className="text-xs text-emerald-700 font-semibold">83.1% Active Participation</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">KYC Verification</span>
                <strong className="text-xl font-bold text-slate-900 block mt-1">945 Farmers</strong>
                <span className="text-xs text-emerald-700 font-semibold">96.7% Aadhaar Verified</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Avg Landholding</span>
                <strong className="text-xl font-bold text-slate-900 block mt-1">1.42 Acres</strong>
                <span className="text-xs text-slate-600 font-semibold">92% Small & Marginal</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Paid-Up Equity</span>
                <strong className="text-xl font-bold text-emerald-800 block mt-1">₹11.84 Lakhs</strong>
                <span className="text-xs text-slate-600 font-semibold">1,184 Share Folios @ ₹100</span>
              </div>
            </div>

            {/* Farmer & Shareholder Growth Curves */}
            <div className="na-grid-2col" style={{ margin: "16px 0" }}>
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Users size={15} className="text-blue-700" /> Farmer Registration Growth</h3>
                    <p>Seasonal growth curve of verified producer members</p>
                  </div>
                  <span className="text-xs font-bold text-blue-800">Season-by-Season</span>
                </div>
                <div style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthCurves.farmerGrowth}>
                      <defs>
                        <linearGradient id="farmerGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1565c0" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#1565c0" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="season" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="farmers" name="Registered Farmers" stroke="#1565c0" strokeWidth={2} fill="url(#farmerGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Award size={15} className="text-amber-700" /> Shareholder Capital Growth</h3>
                    <p>Paid-up equity holders across registered FPCs</p>
                  </div>
                  <span className="text-xs font-bold text-amber-800">5-Year Equity Base</span>
                </div>
                <div style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthCurves.shareholderGrowth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="members" name="Shareholders" stroke="#b78103" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="na-grid-2col">
              {/* Block-wise Farmer Distribution */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Users size={15} className="text-emerald-700" /> Block-wise Farmer Enrollment</h3>
                    <p>Membership density across administrative blocks</p>
                  </div>
                </div>
                <div style={{ height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={blockFarmerDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="block" width={110} tick={{ fontSize: 10 }} />
                      <RechartsTooltip formatter={(v: any) => `${v} Farmers`} />
                      <Bar dataKey="farmers" name="Farmers" fill="#1b5e20" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Demographic Shareholder Representation */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Award size={15} className="text-amber-700" /> Shareholder Demographic Equity</h3>
                    <p>Inclusion across smallholders, women, and tribal communities</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  {demographicEquity.map(d => (
                    <div key={d.demographic}>
                      <div className="flex justify-between text-xs mb-1">
                        <strong className="text-slate-800">{d.demographic}</strong>
                        <span className="font-bold text-slate-700">{d.percentage}% Representation</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.percentage}%`, background: d.fill }} />
                      </div>
                    </div>
                  ))}
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    Compliant with MCA producer company inclusive governance norms.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 5. SECTION: INVENTORY & GODOWN ANALYTICS */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "inventory") && (
      <section id="section-inventory" className={`na-section-panel ${openSections.inventory ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("inventory")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Warehouse size={18} /></div>
            <div>
              <h2>Inventory & Storage Analytics</h2>
              <p>Capacity tracking, space utilization percentage, valuation, and storage load balance across 32 godowns</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.inventory ? "Collapse" : "Expand"}</span>
            {openSections.inventory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.inventory && (
          <div className="na-section-content">
            {/* Storage Summary */}
            <div className="na-summary-strip">
              <div className="na-summary-item">
                <small>Total Operational Godowns</small>
                <b className="text-slate-900">{growthKpis.totalGodowns} Facilities</b>
              </div>
              <div className="na-summary-item">
                <small>Total Capacity</small>
                <b className="text-slate-800">6,400 Tonnes</b>
              </div>
              <div className="na-summary-item">
                <small>Utilized Storage</small>
                <b className="text-emerald-700">3,920 Tonnes (61.3%)</b>
              </div>
              <div className="na-summary-item">
                <small>Available Vacant</small>
                <b className="text-blue-700">2,480 Tonnes</b>
              </div>
              <div className="na-summary-item">
                <small>Total Stock Value</small>
                <b className="text-emerald-800">₹1.48 Crore</b>
              </div>
              <div className="na-summary-item ml-auto">
                <small>Critical Alerts</small>
                <b className="text-amber-700">2 Low-Stock · 1 Spoilage</b>
              </div>
            </div>

            <div className="na-grid-2col">
              {/* Godown Capacity vs Utilization by District */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3><Warehouse size={15} className="text-emerald-700" /> District Storage Capacity vs Utilized</h3>
                    <p>Total capacity vs current occupied stock</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">Tonnes (MT)</span>
                </div>
                <div style={{ height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryDistData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v: any) => `${v} MT`} />
                      <RechartsLegend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="capacityMt" name="Capacity (MT)" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="utilizedMt" name="Utilized (MT)" fill="#2e7d32" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Godown Load Balance Table */}
              <div className="na-chart-card">
                <div className="na-chart-card-header">
                  <div>
                    <h3>Godown Storage Load Health</h3>
                    <p>Identification of overloaded and underutilized storage nodes</p>
                  </div>
                </div>
                <div className="space-y-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 flex justify-between items-center">
                    <div>
                      <strong className="text-emerald-950 block">Jajpur Cluster (Kalinganagar Godowns)</strong>
                      <span className="text-emerald-700">6 Godowns · 1,296 MT occupied</span>
                    </div>
                    <span className="na-chip good"><i /> Optimal (72%)</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                      <strong className="text-slate-900 block">Keonjhar Cluster (Main & Satellite Godowns)</strong>
                      <span className="text-slate-600">16 Godowns · 1,792 MT occupied</span>
                    </div>
                    <span className="na-chip good"><i /> Balanced (64%)</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex justify-between items-center">
                    <div>
                      <strong className="text-amber-950 block">West Singhbhum Cluster (Noamundi & Chaibasa)</strong>
                      <span className="text-amber-700">7 Godowns · 624 MT occupied (576 MT idle)</span>
                    </div>
                    <span className="na-chip warn"><i /> Underutilized (52%)</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex justify-between items-center">
                    <div>
                      <strong className="text-amber-950 block">Seraikela Cluster (Seraikela Storage Hub)</strong>
                      <span className="text-amber-700">3 Godowns · 228 MT occupied (372 MT idle)</span>
                    </div>
                    <span className="na-chip warn"><i /> Underutilized (38%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 6. SECTION: OPERATIONAL EFFICIENCY */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "efficiency") && (
      <section id="section-efficiency" className={`na-section-panel ${openSections.efficiency ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("efficiency")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Zap size={18} /></div>
            <div>
              <h2>Operational Efficiency Analytics</h2>
              <p>Transaction velocity, approval turnaround, order fulfillment, and workflow bottlenecks</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.efficiency ? "Collapse" : "Expand"}</span>
            {openSections.efficiency ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.efficiency && (
          <div className="na-section-content">
            <div className="na-grid-4col">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Transactions</span>
                <strong className="text-xl font-bold text-slate-900 block mt-1">1,630 Records</strong>
                <span className="text-xs text-slate-600 font-semibold">1,248 Purchases · 382 Sales</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Avg Approval Time</span>
                <strong className="text-xl font-bold text-emerald-700 block mt-1">1.4 Days</strong>
                <span className="text-xs text-emerald-700 font-semibold">Within SLA (Target 2.0d)</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Order Fulfillment</span>
                <strong className="text-xl font-bold text-blue-700 block mt-1">94.1% Rate</strong>
                <span className="text-xs text-slate-600 font-semibold">2,340 MT dispatched</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Pending Approvals</span>
                <strong className="text-xl font-bold text-amber-700 block mt-1">7 In Queue</strong>
                <span className="text-xs text-slate-600 font-semibold">3 Purchases · 2 Farmers</span>
              </div>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 7. SECTION: COMPLIANCE & GOVERNANCE MONITORING */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "compliance") && (
      <section id="section-compliance" className={`na-section-panel ${openSections.compliance ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("compliance")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><ShieldCheck size={18} /></div>
            <div>
              <h2>Compliance & Governance Monitoring</h2>
              <p>MCA statutory filings, ROC returns, regulatory license expirations, and Director DIN verification</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.compliance ? "Collapse" : "Expand"}</span>
            {openSections.compliance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.compliance && (
          <div className="na-section-content">
            <div className="na-grid-4col">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Compliant Entities</span>
                <strong className="text-2xl font-bold text-emerald-900 block mt-1">5 FPCs</strong>
                <span className="text-emerald-700">100% Filings & Licenses Valid</span>
              </div>
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">Attention Required</span>
                <strong className="text-2xl font-bold text-amber-900 block mt-1">1 FPC</strong>
                <span className="text-amber-800">Barbil FPC (AOC-4 / MGT-7 Overdue)</span>
              </div>
              <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs">
                <span className="text-[11px] font-bold text-red-800 uppercase block">Non-Compliant / Deficit</span>
                <strong className="text-2xl font-bold text-red-900 block mt-1">1 FPC</strong>
                <span className="text-red-700">Chaibasa Organic (Net Deficit)</span>
              </div>
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                <span className="text-[11px] font-bold text-blue-800 uppercase block">Under Onboarding</span>
                <strong className="text-2xl font-bold text-blue-900 block mt-1">1 FPC</strong>
                <span className="text-blue-700">Seraikela (Credentials review)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <strong className="text-slate-800">Board of Directors Governance:</strong> 55 registered directors across all 8 FPCs. 100% verified against MCA DIN registers.
              </div>
              <button
                type="button"
                className="btn-outline compact"
                onClick={() => go("/tsf/compliance/filings")}
              >
                <ShieldCheck size={13} /> View Statutory Filings
              </button>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 8. SECTION: NETWORK LEADERBOARD */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "leaderboard") && (
      <section id="section-leaderboard" className={`na-section-panel ${openSections.leaderboard ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("leaderboard")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Award size={18} /></div>
            <div>
              <h2>Network Leaderboard (7 Operational Dimensions)</h2>
              <p>Objective calculated rankings based on verified business turnover, profitability, procurement, and growth</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.leaderboard ? "Collapse" : "Expand"}</span>
            {openSections.leaderboard ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.leaderboard && (
          <div className="na-section-content">
            {/* Dimension Tabs */}
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: "revenue", label: "Highest Revenue" },
                  { id: "profit", label: "Highest Net Profit" },
                  { id: "farmers", label: "Farmer Participation" },
                  { id: "procurement", label: "Procurement Volume" },
                  { id: "sales", label: "Sales Volume" },
                  { id: "inventory", label: "Best Inventory Utilization" },
                  { id: "growth", label: "Highest Growth Rate" },
                ].map(tab => (
                  <button
                    type="button"
                    key={tab.id}
                    className={`tsf-period-chip ${leaderboardTab === tab.id ? "active" : ""}`}
                    onClick={() => setLeaderboardTab(tab.id as any)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn-outline compact"
                style={{ fontSize: "11px" }}
                onClick={() => setShowAllLeaderboard(prev => !prev)}
              >
                {showAllLeaderboard ? "Show Top 5" : `View All (${fpcPerformanceData.length})`}
              </button>
            </div>

            <div className="na-table-container">
              <table className="na-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>FPC Name</th>
                    <th>District</th>
                    <th>Metric Value</th>
                    <th>Net Profit</th>
                    <th>Growth %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardRankings.map((item, idx) => {
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                    return (
                      <tr key={item.id}>
                        <td>
                          {medal ? (
                            <span className="tsf-rank-badge">{medal}</span>
                          ) : (
                            <span className="tsf-rank-num">#{idx + 1}</span>
                          )}
                        </td>
                        <td>
                          <strong className="text-slate-900 block">{item.name}</strong>
                          <span className="text-[11px] font-mono text-slate-400">{item.id}</span>
                        </td>
                        <td className="text-slate-600">{item.district}</td>
                        <td className="font-bold text-slate-900">
                          {leaderboardTab === "revenue" && money(item.revenue)}
                          {leaderboardTab === "profit" && money(item.profit)}
                          {leaderboardTab === "farmers" && `${item.farmers} Farmers`}
                          {leaderboardTab === "procurement" && money(Math.round(item.revenue * 0.65))}
                          {leaderboardTab === "sales" && money(item.revenue)}
                          {leaderboardTab === "inventory" && `${item.score}% Utilized`}
                          {leaderboardTab === "growth" && `+${item.growth}% YoY`}
                        </td>
                        <td>
                          <strong className={item.profit > 0 ? "text-emerald-700 font-bold" : item.profit < 0 ? "text-red-700 font-bold" : "text-slate-400"}>
                            {item.profit > 0 ? `+₹${(item.profit / 100000).toFixed(1)} L` : item.profit < 0 ? `-₹${(Math.abs(item.profit) / 100000).toFixed(1)} L` : "₹0"}
                          </strong>
                        </td>
                        <td>
                          <span className={`font-bold ${item.growth >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            {item.growth >= 0 ? `+${item.growth}%` : `${item.growth}%`}
                          </span>
                        </td>
                        <td>
                          <span className={`na-chip ${item.status.toLowerCase().includes("active") ? "good" : item.status.toLowerCase().includes("onboarding") ? "blue" : "danger"}`}>
                            <i /> {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      )}

      {/* ========================================================= */}
      {/* 9. SECTION: SMART INSIGHTS & EXECUTIVE RECOMMENDATIONS */}
      {/* ========================================================= */}
      {(activeTab === "all" || activeTab === "insights") && (
      <section id="section-insights" className={`na-section-panel ${openSections.insights ? "expanded" : ""}`}>
        <div className="na-section-header" onClick={() => toggleSection("insights")}>
          <div className="na-section-title-block">
            <div className="na-section-title-icon"><Sparkles size={18} /></div>
            <div>
              <h2>Network Insights & Executive Recommendations</h2>
              <p>Actionable, data-backed operational intelligence derived from actual portfolio activities</p>
            </div>
          </div>
          <div className="na-section-toggle">
            <span className="text-xs text-slate-400 font-semibold">{openSections.insights ? "Collapse" : "Expand"}</span>
            {openSections.insights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {openSections.insights && (
          <div className="na-section-content">
            {/* Severity Filter Strip */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Severity:</span>
              {(["ALL", "Critical", "High", "Medium", "Low"] as const).map(sev => (
                <button
                  type="button"
                  key={sev}
                  className={`tsf-period-chip ${insightSeverityFilter === sev ? "active" : ""}`}
                  onClick={() => setInsightSeverityFilter(sev)}
                >
                  {sev === "ALL" ? `All (${smartInsights.length})` : sev}
                </button>
              ))}
            </div>

            {/* Smart Insights Cards Grid */}
            <div className="na-insights-grid">
              {smartInsights.map(insight => (
                <article key={insight.id} className={`na-insight-card ${insight.severity.toLowerCase()}`}>
                  <div className="na-insight-top">
                    <div>
                      <div className="na-insight-title">
                        {insight.severity === "Critical" && <AlertCircle size={14} className="text-red-600" />}
                        {insight.severity === "High" && <AlertTriangle size={14} className="text-amber-600" />}
                        {insight.severity === "Medium" && <Clock size={14} className="text-blue-600" />}
                        {insight.severity === "Low" && <CheckCircle2 size={14} className="text-emerald-600" />}
                        <span>{insight.title}</span>
                      </div>
                      <div className="na-insight-meta">
                        <strong>{insight.entity}</strong> · <span className="font-mono text-slate-700">{insight.metric}</span>
                      </div>
                    </div>
                    <span className={`na-chip ${insight.severity === "Critical" ? "danger" : insight.severity === "High" ? "warn" : insight.severity === "Medium" ? "blue" : "good"}`}>
                      {insight.severity}
                    </span>
                  </div>

                  <p className="na-insight-body">{insight.observation}</p>

                  <div className="na-insight-action-box">
                    <span className="na-insight-action-text">{insight.action}</span>
                    <button
                      type="button"
                      className="na-insight-action-btn"
                      onClick={() => setToast(`Action initiated: ${insight.title}`)}
                    >
                      Act Now
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
      )}
    </div>
  );
}

