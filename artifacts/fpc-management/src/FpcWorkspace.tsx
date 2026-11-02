import React, { useState, useMemo, useEffect } from "react";
import {
  Building2, Users, Landmark, ShieldCheck, BarChart3, ClipboardCheck,
  Search, Download, Printer, ArrowLeft, ArrowRight,
  TrendingUp, TrendingDown, Clock, AlertTriangle, AlertCircle,
  FileText, Eye, Check, X, Award, DollarSign,
  Package, ShoppingCart, Warehouse, Briefcase, FileCheck,
  Layers, Calendar, MapPin, Phone, Mail, ExternalLink,
  ChevronRight, RefreshCw, CheckCircle2, UserCheck, ShieldAlert,
  HandCoins
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend as RechartsLegend, CartesianGrid
} from "recharts";
import * as XLSX from "xlsx";
import type { RecordRow, State } from "@/lib/store";
import { money, initialDirectors, initialLicences } from "@/lib/store";
import FarmerDetails from "./FarmerDetails";
import ShareholderDetails from "./ShareholderDetails";
import BaselineSurveysModule from "./BaselineSurveysModule";
import "./fpc-workspace.css";

interface Props {
  fpc: RecordRow;
  allFpcs: RecordRow[];
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  role: string;
  onBack: () => void;
  onSelectFpc: (fpc: RecordRow) => void;
  setToast: (msg: string) => void;
  go?: (dest: string) => void;
}

type WorkspaceTab =
  | "profile"
  | "farmers"
  | "shareholders"
  | "buyers_suppliers"
  | "agribiz"
  | "inventory"
  | "finance"
  | "staff"
  | "compliance"
  | "analytics"
  | "baseline_surveys";

const TABS: { id: WorkspaceTab; label: string; icon: any }[] = [
  { id: "profile", label: "A. FPC Profile", icon: Building2 },
  { id: "farmers", label: "B. Farmer Management", icon: Users },
  { id: "shareholders", label: "C. Shareholder Management", icon: Award },
  { id: "buyers_suppliers", label: "D. Buyers & Suppliers", icon: ShoppingCart },
  { id: "agribiz", label: "E. Agri Business", icon: Package },
  { id: "inventory", label: "F. Inventory & Godowns", icon: Warehouse },
  { id: "finance", label: "G. Financial Management", icon: Landmark },
  { id: "staff", label: "H. Employee & Staff", icon: Briefcase },
  { id: "compliance", label: "I. Compliance & Governance", icon: ShieldCheck },
  { id: "analytics", label: "J. Reports & Analytics", icon: BarChart3 },
  { id: "baseline_surveys", label: "K. Baseline & Surveys", icon: ClipboardCheck },
];

export default function FpcWorkspace({
  fpc,
  allFpcs,
  state,
  setState,
  role,
  onBack,
  onSelectFpc,
  setToast,
  go
}: Props) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("profile");
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [fpc.id]);

  // Tab internal search/filters
  const [farmerSearch, setFarmerSearch] = useState("");
  const [farmerKycFilter, setFarmerKycFilter] = useState("ALL");
  const [shareholderSearch, setShareholderSearch] = useState("");
  const [commoditySearch, setCommoditySearch] = useState("");

  // Dedicated Drilldown Inspection State
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [selectedFarmerProp, setSelectedFarmerProp] = useState<RecordRow | null>(null);
  const [selectedShareholderId, setSelectedShareholderId] = useState<string | null>(null);
  const [selectedShareholderProp, setSelectedShareholderProp] = useState<RecordRow | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<any | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);

  // Read-only Drawer Inspection States (Module Detail Views)
  const [selectedDirector, setSelectedDirector] = useState<any | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<any | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [selectedGodown, setSelectedGodown] = useState<any | null>(null);
  const [selectedStockBatch, setSelectedStockBatch] = useState<any | null>(null);
  const [selectedFinancialRecord, setSelectedFinancialRecord] = useState<any | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [selectedCompliance, setSelectedCompliance] = useState<any | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<any | null>(null);
  const [surveyFilter, setSurveyFilter] = useState<string>("ALL");
  const [baselineSubTab, setBaselineSubTab] = useState<"indicators" | "surveys">("indicators");

  const handleTabChange = (newTab: WorkspaceTab) => {
    setActiveTab(newTab);
    setSelectedFarmerId(null);
    setSelectedFarmerProp(null);
    setSelectedShareholderId(null);
    setSelectedShareholderProp(null);
    setSelectedBuyer(null);
    setSelectedSupplier(null);
  };

  const fpcId = fpc.id || fpc.fpcId || "FPC-ODI-001";
  const fpcName = fpc.name || "Green Valley Farmer Producer Company Ltd.";
  const fpcLocation = fpc.location || `${fpc.district || "Keonjhar"}, ${fpc.state || "Odisha"}`;
  const fpcCin = fpc.details?.basic?.cin || "U01100OD2021PTC035612";

  // Contextual Baseline Assessment & Field Surveys
  const fpcBaseline = useMemo(() => {
    const allBaselines = state.records?.baselineAssessments || [];
    return allBaselines.find((b: any) => b.fpcId === fpc.id || b.fpcId === fpc.fpcId);
  }, [state.records?.baselineAssessments, fpc.id, fpc.fpcId]);

  const fpcSurveys = useMemo(() => {
    const allSurveys = state.records?.surveys || [];
    return allSurveys.filter((s: any) => s.fpcId === fpc.id || s.fpcId === fpc.fpcId || s.fpcId === "ALL");
  }, [state.records?.surveys, fpc.id, fpc.fpcId]);

  const fpcSurveyResponses = useMemo(() => {
    const allResponses = state.records?.surveyResponses || [];
    return allResponses.filter((r: any) => r.fpcId === fpc.id || r.fpcId === fpc.fpcId);
  }, [state.records?.surveyResponses, fpc.id, fpc.fpcId]);

  // -------------------------------------------------------------
  // CONTEXTUAL DATA ENGINE FOR THE SELECTED FPC
  // -------------------------------------------------------------
  const isGreenValley = fpc.id === "FPC-ODI-001";

  // Contextual Farmers
  const farmersList = useMemo(() => {
    const rawFarmers = state.records?.farmers || [];
    if (isGreenValley) {
      return rawFarmers;
    }
    const targetCount = Number(fpc.farmers) || 90;
    const villages = [
      `${fpc.block || "Central"} Village A`,
      `${fpc.block || "Central"} Village B`,
      `${fpc.district || "Keonjhar"} East`,
      `${fpc.district || "Keonjhar"} South`,
      `${fpc.block || "Central"} G.P.`
    ];
    const crops = ["Paddy", "Maize", "Arhar", "Mustard", "Ragi", "Tomato"];

    return Array.from({ length: Math.min(targetCount, 60) }, (_, i) => {
      const idNum = String(i + 1).padStart(3, "0");
      const name = ["Suresh Mahato", "Budhram Soren", "Jaba Murmu", "Binod Nayak", "Sabita Munda", "Prafulla Behera", "Lalita Ho", "Mangal Hansda"][i % 8];
      return {
        id: `F-${fpc.id.slice(-3)}-${idNum}`,
        farmerId: `F-${fpc.id.slice(-3)}-${idNum}`,
        name: `${name} ${i + 1}`,
        mobile: `98${String(40000000 + i * 9131).slice(0, 8)}`,
        village: villages[i % villages.length],
        land: `${(1.2 + (i % 7) * 0.4).toFixed(1)} acres`,
        crop: crops[i % crops.length],
        kyc: i % 10 === 0 ? "Pending" : "Verified",
        shareholder: i % 2 === 0 ? "Yes" : "No",
        fpcId: fpc.id,
        fpcName: fpc.name,
        status: "Active",
        fatherName: ["Gopinath Mahato", "Ramesh Soren", "Babulal Murmu", "Chandra Nayak"][i % 4],
        gender: i % 5 === 2 ? "Female" : "Male",
        dob: "1984-06-12",
        address: `Village ${villages[i % villages.length]}, ${fpc.block || "Keonjhar Sadar"}, ${fpc.district || "Keonjhar"}`,
        aadhaar: `XXXXXXXX${String(1234 + i).slice(-4)}`,
        bankAccount: `XXXXXX${String(9876 + i).slice(-4)}`,
        ifsc: "SBIN0001234",
        bankName: "State Bank of India",
        primaryCrop: crops[i % crops.length],
        surveyNo: `Plot ${100 + i * 3} / Khata ${40 + i}`,
        ownedLand: `${(1.0 + (i % 5) * 0.3).toFixed(1)} acres`,
        leasedLand: i % 3 === 0 ? "0.8 acres" : "0.0 acres"
      };
    });
  }, [fpc.id, fpc.farmers, fpc.block, fpc.district, fpc.name, isGreenValley, state.records?.farmers]);

  const filteredFarmers = useMemo(() => {
    return farmersList.filter(f => {
      if (farmerKycFilter !== "ALL" && f.kyc !== farmerKycFilter) return false;
      if (farmerSearch.trim()) {
        const q = farmerSearch.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          f.village.toLowerCase().includes(q) ||
          f.crop.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [farmersList, farmerKycFilter, farmerSearch]);

  // Contextual Shareholders
  const shareholdersList = useMemo(() => {
    if (isGreenValley && state.records?.shareholders && state.records.shareholders.length > 0) {
      return state.records.shareholders;
    }
    const count = Number(fpc.shareholders) || 62;
    return Array.from({ length: Math.min(count, 45) }, (_, i) => ({
      id: `SH-${fpc.id.slice(-3)}-${String(i + 1).padStart(3, "0")}`,
      farmerId: `F-${fpc.id.slice(-3)}-${String(i + 1).padStart(3, "0")}`,
      name: ["Ravi Kumar", "Laxmi Soren", "Gouranga Naik", "Parbati Munda", "Sanjay Behera", "Mina Kisku"][i % 6] + ` ${i + 1}`,
      shares: [10, 20, 15, 25, 10, 50][i % 6],
      faceValue: 100,
      capital: [10, 20, 15, 25, 10, 50][i % 6] * 100,
      certificate: `SC-${fpc.id.slice(-3)}-${String(i + 1).padStart(3, "0")}`,
      folio: `FL-${fpc.id.slice(-3)}-${String(i + 1).padStart(3, "0")}`,
      admitted: ["14 Jun 2021", "08 Oct 2022", "19 Jan 2023", "22 Jul 2024"][i % 4],
      status: "Active",
      fpcId: fpc.id,
      fpcName: fpc.name,
      mobile: `98${String(71000000 + i * 8321).slice(0, 8)}`,
      aadhaar: `XXXXXXXX${String(3344 + i).slice(-4)}`,
      bankAccount: `XXXXXX${String(5566 + i).slice(-4)}`,
      dividendPaid: [1000, 2000, 1500, 2500, 1000, 5000][i % 6]
    }));
  }, [fpc.id, fpc.shareholders, fpc.name, isGreenValley, state.records?.shareholders]);

  const filteredShareholders = useMemo(() => {
    return shareholdersList.filter(s => {
      if (shareholderSearch.trim()) {
        const q = shareholderSearch.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.folio.toLowerCase().includes(q) ||
          s.certificate.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shareholdersList, shareholderSearch]);

  // Contextual Institutional Buyers
  const buyersList = useMemo(() => {
    return [
      {
        id: "BUY-001",
        name: "ITC Agri Business Division",
        type: "Institutional Corporate Off-taker",
        contactPerson: "Rajeev Sharma",
        mobile: "+91 9845012390",
        email: "procurement@itc-agri.example.in",
        address: "Plot 42, Agro-Processing Industrial Park, Keonjhar District, Odisha 758001",
        gstin: "21AAACI1234F1Z8",
        commoditiesPurchased: "Paddy Grade A, Hybrid Maize",
        annualVolumeMt: 420,
        totalInvoiced: 10500000,
        receivables: 610000,
        creditLimit: 2500000,
        terms: "15 Days Post Delivery",
        status: "Active"
      },
      {
        id: "BUY-002",
        name: "Keonjhar Agro Fresh Mart",
        type: "Regional Supermarket Chain",
        contactPerson: "Debendra Sahu",
        mobile: "+91 9437128901",
        email: "orders@keonjharfresh.example.in",
        address: "Main Market Commercial Complex, Keonjhar Town, Odisha 758002",
        gstin: "21AABCK5678G1Z2",
        commoditiesPurchased: "Fresh Vegetables, Mustard Seed",
        annualVolumeMt: 180,
        totalInvoiced: 4500000,
        receivables: 180000,
        creditLimit: 1000000,
        terms: "7 Days Net",
        status: "Active"
      },
      {
        id: "BUY-003",
        name: "Omfed Cattle Feed Plant",
        type: "State Cooperative Agency",
        contactPerson: "Dr. P. K. Jena",
        mobile: "+91 9438091122",
        email: "feedplant@omfed.example.in",
        address: "Feed Processing Unit 4, Jajpur Road, Odisha 755019",
        gstin: "21AAABO9012K1Z4",
        commoditiesPurchased: "Maize, Broken Rice",
        annualVolumeMt: 320,
        totalInvoiced: 6400000,
        receivables: 0,
        creditLimit: 3000000,
        terms: "Prompt Payment (Net 5 Days)",
        status: "Active"
      },
      {
        id: "BUY-004",
        name: "Tata Steel Foundation Canteen Supply",
        type: "Institutional Foundation Buyer",
        contactPerson: "Sunil Marandi",
        mobile: "+91 9937014499",
        email: "canteen-supply@tsf.example.in",
        address: "TSF Central Logistics Hub, Jamshedpur / Noamundi Office, Jharkhand 833217",
        gstin: "20AAACT0022M1Z9",
        commoditiesPurchased: "Pulses (Arhar Dal), Common Rice",
        annualVolumeMt: 160,
        totalInvoiced: 3840000,
        receivables: 120000,
        creditLimit: 1500000,
        terms: "30 Days Monthly Settlement",
        status: "Active"
      }
    ];
  }, [fpc.details?.location?.commodities]);

  // Contextual Certified Input Suppliers
  const suppliersList = useMemo(() => {
    return [
      {
        id: "SUP-001",
        name: "National Seeds Corporation Ltd.",
        type: "Certified Public Sector Seed Producer",
        contactPerson: "Manoranjan Tripathy",
        mobile: "+91 9437019822",
        email: "odisha.sales@nsc.example.in",
        address: "Central Seed Depot, Cuttack Road, Bhubaneswar, Odisha 751006",
        gstin: "21AAACN1234F1Z5",
        licenseNo: "SL/OD/2023/041 (Certified Breeder Seed)",
        productCategory: "Certified Paddy & Maize Seeds",
        annualPurchases: 4200000,
        outstandingPayables: 240000,
        rating: "4.9 / 5.0",
        status: "Active"
      },
      {
        id: "SUP-002",
        name: "IFFCO Fertilizer Depot",
        type: "Cooperative Fertilizer Manufacturer",
        contactPerson: "Siddharth Patnaik",
        mobile: "+91 9437881123",
        email: "depot.keonjhar@iffco.example.in",
        address: "Rail Siding Warehouse Complex, Jajpur Road, Odisha 755019",
        gstin: "21AAACI9988G1Z7",
        licenseNo: "FL/KEO/2024/092 (Urea, DAP, NPK)",
        productCategory: "Urea, DAP, Water Soluble NPK",
        annualPurchases: 6800000,
        outstandingPayables: 450000,
        rating: "4.8 / 5.0",
        status: "Active"
      },
      {
        id: "SUP-003",
        name: "Dhanuka Agritech Ltd.",
        type: "Registered Crop Protection Vendor",
        contactPerson: "Ashish Mohanty",
        mobile: "+91 9861044556",
        email: "sales.east@dhanuka.example.in",
        address: "Agro-Chemical Logistics Park, Cuttack, Odisha 753010",
        gstin: "21AAACD4433H1Z1",
        licenseNo: "PL/OD/2024/118 (Bio-Pesticides)",
        productCategory: "Bio-Pesticides & Fungicides",
        annualPurchases: 1950000,
        outstandingPayables: 0,
        rating: "4.7 / 5.0",
        status: "Active"
      }
    ];
  }, []);

  // Contextual Godowns
  const godownsList = useMemo(() => {
    const isOdd = fpc.id.endsWith("2") || fpc.id.endsWith("4");
    return [
      {
        id: "GDN-001",
        name: `${fpc.name.slice(0, 16)} Central Hub`,
        capacity: "350 MT",
        capacityMt: 350,
        used: isOdd ? 68 : 54,
        utilizedMt: isOdd ? 238 : 189,
        availableMt: isOdd ? 112 : 161,
        manager: "Bijay Mohanty (Supervisor)",
        phone: "+91 9437004412",
        address: `Plot 14, Aggregation Yard, ${fpc.block || "Keonjhar Sadar"}`,
        commodities: "Paddy (Common), Hybrid Maize",
        temperature: "24°C (Optimal Aeration)",
        license: "WDRA Certified · Insured till 31 Dec 2026"
      },
      {
        id: "GDN-002",
        name: "Panchayat Aggregation Depot",
        capacity: "250 MT",
        capacityMt: 250,
        used: isOdd ? 45 : 62,
        utilizedMt: isOdd ? 112 : 155,
        availableMt: isOdd ? 138 : 95,
        manager: "Ramesh Nayak",
        phone: "+91 9437118833",
        address: `Village Aggregation Point, Block ${fpc.block || "Central"}`,
        commodities: "Pulses (Arhar), Oilseeds",
        temperature: "Ambient (Dry Storage)",
        license: "State APMC Registered Storage"
      },
      {
        id: "GDN-003",
        name: "Input & Certified Seed Store",
        capacity: "200 MT",
        capacityMt: 200,
        used: 72,
        utilizedMt: 144,
        availableMt: 56,
        manager: "Anita Das (Store In-Charge)",
        phone: "+91 9437229944",
        address: `Main Road Godown, ${fpc.district || "Keonjhar"}`,
        commodities: "Certified Seeds (Paddy/Maize), Bio-Fertilizers",
        temperature: "Dehumidified Storage Unit",
        license: "DAO Keonjhar Seed/Fertilizer License"
      }
    ];
  }, [fpc.id, fpc.name, fpc.block, fpc.district]);

  // Contextual Board of Directors
  const directorsList = useMemo(() => {
    if (fpc.details?.directors && fpc.details.directors.length > 0) {
      return fpc.details.directors;
    }
    return initialDirectors || [];
  }, [fpc.details?.directors]);

  // Contextual Employees / Staff
  const employeesList = useMemo(() => {
    if (fpc.details?.employees && fpc.details.employees.length > 0) {
      return fpc.details.employees;
    }
    const roles = [
      "Chief Executive Officer (CEO)",
      "Senior Accountant",
      "Procurement & Quality Manager",
      "Sales & Marketing Officer",
      "Godown & Stock Manager",
      "Data Entry Operator",
      "Compliance & MIS Officer",
      "Field Mobilizer (Gram Panchayat)"
    ];
    const names = [
      "Bijay Kumar Mohanty", "Anita Das", "Prakash Rout", "Mamata Jena",
      "Sanjay Tudu", "Pooja Nayak", "Rakesh Hembram", "Laxmi Patra"
    ];
    return names.map((name, i) => ({
      id: `EMP-${fpc.id.slice(-3)}-${String(i + 1).padStart(3, "0")}`,
      name,
      designation: roles[i],
      role: roles[i],
      department: i === 0 ? "Executive" : i === 1 ? "Accounts" : i < 4 ? "Agri Business" : "Field Operations",
      mobile: `+91 9${String(870000000 + i * 1421).slice(0, 9)}`,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@fpc.demo`,
      dateOfJoining: "01 Jul 2022",
      employmentType: "Full-Time Permanent",
      status: "Active"
    }));
  }, [fpc.id, fpc.details?.employees]);

  // Financial Metrics
  const turnoverNum = Number(fpc.turnover) || (isGreenValley ? 7180000 : 5400000);
  const grossProfitNum = Math.round(turnoverNum * 0.186);
  const netProfitNum = Math.round(turnoverNum * 0.082);
  const expensesNum = Math.round(turnoverNum * 0.918);

  const monthlyFinanceData = [
    { month: "Apr", revenue: Math.round(turnoverNum * 0.06), expenses: Math.round(expensesNum * 0.07) },
    { month: "May", revenue: Math.round(turnoverNum * 0.07), expenses: Math.round(expensesNum * 0.075) },
    { month: "Jun", revenue: Math.round(turnoverNum * 0.08), expenses: Math.round(expensesNum * 0.08) },
    { month: "Jul", revenue: Math.round(turnoverNum * 0.075), expenses: Math.round(expensesNum * 0.078) },
    { month: "Aug", revenue: Math.round(turnoverNum * 0.09), expenses: Math.round(expensesNum * 0.085) },
    { month: "Sep", revenue: Math.round(turnoverNum * 0.11), expenses: Math.round(expensesNum * 0.095) },
    { month: "Oct", revenue: Math.round(turnoverNum * 0.14), expenses: Math.round(expensesNum * 0.12) },
    { month: "Nov", revenue: Math.round(turnoverNum * 0.13), expenses: Math.round(expensesNum * 0.11) },
    { month: "Dec", revenue: Math.round(turnoverNum * 0.10), expenses: Math.round(expensesNum * 0.09) },
    { month: "Jan", revenue: Math.round(turnoverNum * 0.05), expenses: Math.round(expensesNum * 0.06) },
    { month: "Feb", revenue: Math.round(turnoverNum * 0.045), expenses: Math.round(expensesNum * 0.055) },
    { month: "Mar", revenue: Math.round(turnoverNum * 0.05), expenses: Math.round(expensesNum * 0.062) }
  ];

  // Excel Dossier Export
  const exportDossierExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summary = [
      ["Farmer Producer Company Dossier", fpcName],
      ["Company ID", fpcId],
      ["CIN", fpcCin],
      ["Registered Location", fpcLocation],
      ["Operational Status", fpc.status || "Active"],
      ["Annual Turnover (INR)", turnoverNum],
      ["Total Registered Farmers", farmersList.length],
      ["Total Shareholders", shareholdersList.length],
      ["Operating Godowns", godownsList.length],
      ["Export Date", new Date().toLocaleDateString("en-GB")]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "FPC Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(farmersList), "Farmers");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shareholdersList), "Shareholders");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buyersList), "Commercial Buyers");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliersList), "Input Suppliers");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(godownsList), "Godowns & Units");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(directorsList), "Board of Directors");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employeesList), "Employees & Staff");

    XLSX.writeFile(wb, `${fpcId}_Comprehensive_Dossier_${new Date().toISOString().split("T")[0]}.xlsx`);
    setToast(`Exported comprehensive operational dossier for ${fpcName}.`);
  };

  // PDF Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fpc-ws-root">
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 1. TOP BREADCRUMB & NAVIGATION BAR */}
      {/* ========================================================= */}
      <div className="fpc-ws-top-bar">
        <nav className="fpc-ws-breadcrumb-nav" aria-label="Breadcrumb">
          <ol className="fpc-ws-breadcrumb-list">
            <li className="fpc-ws-breadcrumb-crumb">
              <button
                type="button"
                onClick={() => (go ? go("/fpc-management") : onBack())}
                className="fpc-ws-breadcrumb-btn"
              >
                FPC Management
              </button>
            </li>
            <li className="fpc-ws-breadcrumb-sep">
              <ChevronRight size={13} />
            </li>
            <li className="fpc-ws-breadcrumb-crumb">
              <button
                type="button"
                onClick={onBack}
                className="fpc-ws-breadcrumb-btn"
              >
                FPC List
              </button>
            </li>
            <li className="fpc-ws-breadcrumb-sep">
              <ChevronRight size={13} />
            </li>
            <li className="fpc-ws-breadcrumb-crumb">
              <span className="fpc-ws-breadcrumb-fpc" title={fpcName}>
                {fpcName}
              </span>
            </li>
            <li className="fpc-ws-breadcrumb-sep">
              <ChevronRight size={13} />
            </li>
            <li className="fpc-ws-breadcrumb-crumb">
              <span className="fpc-ws-breadcrumb-active">
                {selectedFarmerId
                  ? "Farmer Overview"
                  : selectedShareholderId
                  ? "Shareholder Overview"
                  : selectedBuyer
                  ? "Buyer Overview"
                  : selectedSupplier
                  ? "Supplier Overview"
                  : "Management Workspace"}
              </span>
            </li>
          </ol>
        </nav>

        <div className="fpc-ws-top-actions">
          <button
            type="button"
            onClick={onBack}
            className="fpc-ws-back-btn"
            title="Return to FPC List"
          >
            <ArrowLeft size={14} />
            <span>Back to FPC List</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FPC SWITCHER & EXPORT/PRINT ACTION TOOLBAR */}
      {/* ========================================================= */}
      <div className="fpc-ws-action-bar">
        <div className="fpc-ws-switcher-wrap">
          <label htmlFor="quick-fpc-switcher" className="fpc-ws-switcher-label">
            Switch FPC:
          </label>
          <select
            id="quick-fpc-switcher"
            value={fpc.id}
            onChange={(e) => {
              const target = allFpcs.find((x) => x.id === e.target.value);
              if (target) {
                onSelectFpc(target);
                setSelectedFarmerId(null);
                setSelectedFarmerProp(null);
                setSelectedShareholderId(null);
                setSelectedShareholderProp(null);
                setSelectedBuyer(null);
                setSelectedSupplier(null);
              }
            }}
            className="fpc-ws-select"
          >
            {allFpcs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.id})
              </option>
            ))}
          </select>
        </div>

        <div className="fpc-ws-toolbar-buttons">
          <button
            type="button"
            onClick={exportDossierExcel}
            className="fpc-ws-toolbar-btn"
            title="Export complete operational dossier as multi-sheet Excel"
          >
            <Download size={14} className="text-emerald-700" />
            <span>Export FPC Dossier</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="fpc-ws-toolbar-btn"
            title="Print or save as PDF"
          >
            <Printer size={14} className="text-slate-600" />
            <span>Print / Download PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. FPC PROFILE HEADER CARD */}
      {/* ========================================================= */}
      <div className="fpc-ws-profile-card">
        <div className="fpc-ws-profile-main">
          <div className="fpc-ws-profile-logo-box">
            {!logoError ? (
              <img
                src={
                  fpc.id === "FPC-ODI-001"
                    ? "/ual-baha-logo.png"
                    : fpc.details?.basic?.logo || fpc.logo || "/ual-baha-logo.png"
                }
                alt={fpcName}
                onError={() => setLogoError(true)}
                className="fpc-ws-profile-logo-img"
              />
            ) : (
              <div className="fpc-ws-profile-logo-placeholder">
                <Building2 size={28} className="text-emerald-700" />
              </div>
            )}
          </div>

          <div className="fpc-ws-profile-info">
            <div className="fpc-ws-profile-title-row">
              <h1 className="fpc-ws-profile-name">{fpcName}</h1>
              <span className="fpc-ws-id-badge">{fpcId}</span>
              <span className="fpc-ws-chip active">
                <Check size={12} /> {fpc.status || "Active Operations"}
              </span>
              <span className="fpc-ws-chip compliant">
                <ShieldCheck size={12} /> 94% Compliant
              </span>
            </div>

            <div className="fpc-ws-profile-meta-grid">
              <div className="fpc-ws-meta-item">
                <span className="fpc-ws-meta-label">CIN:</span>
                <span className="fpc-ws-meta-val font-mono">{fpcCin}</span>
              </div>
              <div className="fpc-ws-meta-item">
                <MapPin size={13} className="text-emerald-600" />
                <span className="fpc-ws-meta-val">{fpcLocation}</span>
              </div>
              <div className="fpc-ws-meta-item">
                <Building2 size={13} className="text-emerald-600" />
                <span className="fpc-ws-meta-val">
                  Block: {fpc.block || "Keonjhar Sadar"}
                </span>
              </div>
              <div className="fpc-ws-meta-item">
                <Calendar size={13} className="text-emerald-600" />
                <span className="fpc-ws-meta-val">
                  Inc: 14 Jun 2021 (RoC Cuttack)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. KPI SUMMARY CARDS GRID (8 INDIVIDUAL CARDS) */}
      {/* ========================================================= */}
      <div className="fpc-ws-kpi-grid">
        {/* 1. Annual Turnover */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Annual Turnover</span>
            <div className="fpc-ws-kpi-icon-box emerald">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value text-emerald-700">
            {money(turnoverNum)}
          </div>
          <div className="fpc-ws-kpi-sub">FY 2025–26 Audited</div>
        </div>

        {/* 2. Registered Farmers */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Registered Farmers</span>
            <div className="fpc-ws-kpi-icon-box blue">
              <Users size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value">{farmersList.length}</div>
          <div className="fpc-ws-kpi-sub">Active primary producers</div>
        </div>

        {/* 3. Total Shareholders */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Total Shareholders</span>
            <div className="fpc-ws-kpi-icon-box amber">
              <Award size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value">{shareholdersList.length}</div>
          <div className="fpc-ws-kpi-sub">Voting equity members</div>
        </div>

        {/* 4. Commercial Buyers */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Commercial Buyers</span>
            <div className="fpc-ws-kpi-icon-box indigo">
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value">{buyersList.length}</div>
          <div className="fpc-ws-kpi-sub">Institutional off-takers</div>
        </div>

        {/* 5. Input Suppliers */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Input Suppliers</span>
            <div className="fpc-ws-kpi-icon-box teal">
              <Package size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value">{suppliersList.length}</div>
          <div className="fpc-ws-kpi-sub">Certified input vendors</div>
        </div>

        {/* 6. Operating Godowns */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Operating Godowns</span>
            <div className="fpc-ws-kpi-icon-box purple">
              <Warehouse size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value">{godownsList.length}</div>
          <div className="fpc-ws-kpi-sub">
            {godownsList.reduce((acc, g) => acc + (g.capacityMt || 0), 0)} MT total storage
          </div>
        </div>

        {/* 7. Staff & Employees */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Staff & Employees</span>
            <div className="fpc-ws-kpi-icon-box cyan">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value">{employeesList.length}</div>
          <div className="fpc-ws-kpi-sub">Core operations personnel</div>
        </div>

        {/* 8. Board of Directors */}
        <div className="fpc-ws-kpi-card">
          <div className="fpc-ws-kpi-head">
            <span className="fpc-ws-kpi-label">Board of Directors</span>
            <div className="fpc-ws-kpi-icon-box rose">
              <Landmark size={16} />
            </div>
          </div>
          <div className="fpc-ws-kpi-value">{directorsList.length}</div>
          <div className="fpc-ws-kpi-sub">Governance board members</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TAB NAVIGATION (A through J) */}
      {/* ========================================================= */}
      {!selectedFarmerId && !selectedShareholderId && !selectedBuyer && !selectedSupplier && (
        <nav className="fpc-ws-tab-bar" role="tablist" aria-label="FPC Management Workspace Tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={`fpc-ws-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* ========================================================= */}
      {/* 3. DEDICATED OVERVIEW VIEWS & TAB CONTENT MODULES */}
      {/* ========================================================= */}

      {/* --- A. DEDICATED FARMER OVERVIEW (VIEW-ONLY) --- */}
      {selectedFarmerId ? (
        <div className="fpc-ws-overview-container" style={{ padding: "16px 20px" }}>
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              className="em-btn"
              onClick={() => {
                setSelectedFarmerId(null);
                setSelectedFarmerProp(null);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ArrowLeft size={14} /> Back to Farmer List ({fpcName})
            </button>
          </div>
          <FarmerDetails
            farmerId={selectedFarmerId}
            farmerProp={selectedFarmerProp || undefined}
            state={state}
            setState={setState as any}
            role={role as any}
            setToast={setToast}
            go={go || (() => {})}
            onBack={() => {
              setSelectedFarmerId(null);
              setSelectedFarmerProp(null);
            }}
            fpcName={fpcName}
          />
        </div>
      ) : selectedShareholderId ? (
        /* --- B. DEDICATED SHAREHOLDER OVERVIEW (VIEW-ONLY) --- */
        <div className="fpc-ws-overview-container" style={{ padding: "16px 20px" }}>
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              className="em-btn"
              onClick={() => {
                setSelectedShareholderId(null);
                setSelectedShareholderProp(null);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <ArrowLeft size={14} /> Back to Shareholder List ({fpcName})
            </button>
          </div>
          <ShareholderDetails
            shareholderId={selectedShareholderId}
            shareholderProp={selectedShareholderProp || undefined}
            state={state}
            setState={setState as any}
            role={role}
            setToast={setToast}
            go={go || (() => {})}
            onBack={() => {
              setSelectedShareholderId(null);
              setSelectedShareholderProp(null);
            }}
            fpcName={fpcName}
          />
        </div>
      ) : selectedBuyer ? (
        /* --- C. DEDICATED BUYER OVERVIEW (VIEW-ONLY) --- */
        <div className="fpc-ws-overview-container" style={{ padding: "16px 20px" }}>
          <div className="fpc-overview-header">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <button
                  type="button"
                  className="em-btn"
                  onClick={() => setSelectedBuyer(null)}
                  style={{ marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <ArrowLeft size={14} /> Back to Buyers & Suppliers List
                </button>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {fpcName} • COMMERCIAL BUYER OVERVIEW
                  </span>
                  <span className="fpc-badge-readonly">
                    <Eye size={12} /> TSF Read-Only Monitoring
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 750, color: "#0f172a" }}>{selectedBuyer.name}</h2>
                  <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 rounded-md font-bold text-slate-700">
                    {selectedBuyer.id}
                  </span>
                  <span className="fpc-chip active">
                    <CheckCircle2 size={12} /> {selectedBuyer.status || "Active Institutional Off-taker"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <small className="text-xs text-slate-500 uppercase block font-semibold">Total Purchases from {fpcName}</small>
                <strong className="text-2xl font-bold text-emerald-800 block">
                  {money(selectedBuyer.totalInvoiced || 10500000)}
                </strong>
                <span className="text-xs text-slate-600 font-medium">Contracted Volume: {selectedBuyer.annualVolumeMt || 420} Metric Tonnes</span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="fpc-ws-cards-2col" style={{ marginBottom: 20 }}>
            {/* Legal & Contact Profile Card */}
            <div className="fpc-detail-card">
              <div className="fpc-detail-card-title">
                <Building2 size={16} className="text-emerald-700" /> Buyer Organization & Contact Details
              </div>
              <div className="fpc-kv-grid">
                <div className="fpc-kv-item">
                  <small>Buyer Entity Name</small>
                  <strong>{selectedBuyer.name}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Buyer Classification</small>
                  <strong>{selectedBuyer.type || "Institutional Corporate Off-taker"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>GSTIN</small>
                  <strong className="font-mono">{selectedBuyer.gstin || "21AAACI1234F1Z8"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>PAN / Registration</small>
                  <strong className="font-mono">{selectedBuyer.gstin ? selectedBuyer.gstin.slice(2, 12) : "AAACI1234F"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Contact Person</small>
                  <strong>{selectedBuyer.contactPerson || "Rajeev Sharma"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Designation</small>
                  <strong>General Manager – Agri Procurement</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Mobile Number</small>
                  <strong className="font-mono">{selectedBuyer.mobile || "+91 9845012390"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Official Email</small>
                  <strong>{selectedBuyer.email || "procurement@itc-agri.example.in"}</strong>
                </div>
                <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}>
                  <small>Registered Delivery & Billing Address</small>
                  <span>{selectedBuyer.address || "Plot 42, Agro-Processing Industrial Park, Keonjhar District, Odisha 758001"}</span>
                </div>
              </div>
            </div>

            {/* Credit & Trade Terms Card */}
            <div className="fpc-detail-card">
              <div className="fpc-detail-card-title">
                <DollarSign size={16} className="text-emerald-700" /> Credit Limit & Trade Settlement Terms
              </div>
              <div className="fpc-kv-grid">
                <div className="fpc-kv-item">
                  <small>Approved Credit Limit</small>
                  <strong className="text-emerald-800">{money(selectedBuyer.creditLimit || 2500000)}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Agreed Payment Terms</small>
                  <strong>{selectedBuyer.terms || "15 Days Post Delivery"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Current Outstanding Receivables</small>
                  <strong className={Number(selectedBuyer.receivables || 0) > 0 ? "text-amber-700 text-lg" : "text-emerald-700 text-lg"}>
                    {money(selectedBuyer.receivables || 0)}
                  </strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Payment Track Record</small>
                  <span className="fpc-chip active">100% On-Time Settled</span>
                </div>
                <div className="fpc-kv-item">
                  <small>Contracted Commodities</small>
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                    {selectedBuyer.commoditiesPurchased || "Paddy Grade A, Hybrid Maize"}
                  </span>
                </div>
                <div className="fpc-kv-item">
                  <small>Annual Contracted Quota</small>
                  <strong>{selectedBuyer.annualVolumeMt || 420} Metric Tonnes / Year</strong>
                </div>
                <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}>
                  <small>Outstanding Dues Aging Summary</small>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-200">
                      0–15 Days: {money(Number(selectedBuyer.receivables || 0) * 0.7)}
                    </span>
                    <span className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">
                      15–30 Days: {money(Number(selectedBuyer.receivables || 0) * 0.3)}
                    </span>
                    <span className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200">
                      &gt;30 Days: ₹0 (No Defaults)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Order & Invoice History */}
          <div className="fpc-detail-card" style={{ marginBottom: 20 }}>
            <div className="fpc-detail-card-title">
              <Package size={16} className="text-blue-700" /> Sales Orders & Invoicing History ({selectedBuyer.name})
            </div>
            <div className="fpc-ws-table-wrap">
              <table className="fpc-ws-table">
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Produce Purchased</th>
                    <th>Quantity (MT)</th>
                    <th>Agreed Rate</th>
                    <th>Total Invoiced</th>
                    <th>Payment Settlement</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ord: `SO-${fpc.id.slice(-3)}-041`, inv: "INV-2026-089", date: "16 Oct 2026", item: "Paddy Grade A (Common)", qty: "140 MT", rate: "₹28,500 / MT", amt: 3990000, status: "Partially Settled" },
                    { ord: `SO-${fpc.id.slice(-3)}-038`, inv: "INV-2026-074", date: "24 Sep 2026", item: "Hybrid Maize (Feed Grade)", qty: "120 MT", rate: "₹24,500 / MT", amt: 2940000, status: "Paid · Bank NEFT" },
                    { ord: `SO-${fpc.id.slice(-3)}-032`, inv: "INV-2026-061", date: "15 Aug 2026", item: "Paddy Grade A", qty: "100 MT", rate: "₹28,000 / MT", amt: 2800000, status: "Paid · Bank RTGS" },
                    { ord: `SO-${fpc.id.slice(-3)}-027`, inv: "INV-2026-048", date: "11 Jul 2026", item: "Pulses (Arhar Dal)", qty: "20 MT", rate: "₹88,000 / MT", amt: 1760000, status: "Paid · Bank RTGS" },
                  ].map(ord => (
                    <tr key={ord.ord}>
                      <td><span className="font-mono text-slate-700 font-bold">{ord.ord}</span></td>
                      <td><span className="font-mono text-slate-600">{ord.inv}</span></td>
                      <td>{ord.date}</td>
                      <td><strong>{ord.item}</strong></td>
                      <td>{ord.qty}</td>
                      <td>{ord.rate}</td>
                      <td><strong className="text-slate-900">{money(ord.amt)}</strong></td>
                      <td>
                        <span className={`fpc-chip ${ord.status.includes("Paid") ? "active" : "pending"}`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : selectedSupplier ? (
        /* --- D. DEDICATED SUPPLIER OVERVIEW (VIEW-ONLY) --- */
        <div className="fpc-ws-overview-container" style={{ padding: "16px 20px" }}>
          <div className="fpc-overview-header">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <button
                  type="button"
                  className="em-btn"
                  onClick={() => setSelectedSupplier(null)}
                  style={{ marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <ArrowLeft size={14} /> Back to Buyers & Suppliers List
                </button>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {fpcName} • CERTIFIED INPUT SUPPLIER OVERVIEW
                  </span>
                  <span className="fpc-badge-readonly">
                    <Eye size={12} /> TSF Read-Only Monitoring
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 750, color: "#0f172a" }}>{selectedSupplier.name}</h2>
                  <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 rounded-md font-bold text-slate-700">
                    {selectedSupplier.id}
                  </span>
                  <span className="fpc-chip active">
                    <CheckCircle2 size={12} /> Certified Input Vendor
                  </span>
                </div>
              </div>
              <div className="text-right">
                <small className="text-xs text-slate-500 uppercase block font-semibold">Total Procurement from Vendor</small>
                <strong className="text-2xl font-bold text-slate-900 block">
                  {money(selectedSupplier.annualPurchases || 4200000)}
                </strong>
                <span className="text-xs text-amber-700 font-semibold">
                  Outstanding Payables: {money(selectedSupplier.outstandingPayables || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="fpc-ws-cards-2col" style={{ marginBottom: 20 }}>
            {/* Vendor Profile & Statutory Licenses */}
            <div className="fpc-detail-card">
              <div className="fpc-detail-card-title">
                <Building2 size={16} className="text-emerald-700" /> Supplier Credentials & Regulatory Licenses
              </div>
              <div className="fpc-kv-grid">
                <div className="fpc-kv-item">
                  <small>Manufacturer / Vendor</small>
                  <strong>{selectedSupplier.name}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Supplier Category</small>
                  <strong>{selectedSupplier.type || "Certified Seed & Input Manufacturer"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>GSTIN</small>
                  <strong className="font-mono">{selectedSupplier.gstin || "21AAACN1234F1Z5"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Fertilizer / Seed License</small>
                  <strong className="font-mono">{selectedSupplier.licenseNo || "FL/KEO/2024/092"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>License Authority</small>
                  <strong>District Agriculture Office, Keonjhar</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>License Validity</small>
                  <strong className="text-emerald-700">Valid till 31 Mar 2027</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Representative / Contact</small>
                  <strong>{selectedSupplier.contactPerson || "Manoranjan Tripathy"}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Contact Phone</small>
                  <strong className="font-mono">{selectedSupplier.mobile || "+91 9437019822"}</strong>
                </div>
                <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}>
                  <small>Depot / Plant Address</small>
                  <span>{selectedSupplier.address || "Industrial Estate, Phase II, Cuttack Road, Keonjhar Sadar, Odisha 758001"}</span>
                </div>
              </div>
            </div>

            {/* Commercial Terms & Supply Performance */}
            <div className="fpc-detail-card">
              <div className="fpc-detail-card-title">
                <Award size={16} className="text-amber-700" /> Procurement Terms & Performance Rating
              </div>
              <div className="fpc-kv-grid">
                <div className="fpc-kv-item">
                  <small>Certified Products Supplied</small>
                  <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                    {selectedSupplier.productCategory || "High-Yield Certified Seeds, Bio-Fertilizers"}
                  </span>
                </div>
                <div className="fpc-kv-item">
                  <small>Agreed Payment Terms</small>
                  <strong>Net 30 Days (Direct Bank Transfer)</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Annual Procured Volume</small>
                  <strong className="text-slate-900">{money(selectedSupplier.annualPurchases || 4200000)}</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>Current Outstanding Payables</small>
                  <strong className={Number(selectedSupplier.outstandingPayables || 0) > 0 ? "text-amber-700 text-lg" : "text-emerald-700 text-lg"}>
                    {money(selectedSupplier.outstandingPayables || 0)}
                  </strong>
                </div>
                <div className="fpc-kv-item">
                  <small>QC Batch Acceptance Rate</small>
                  <strong className="text-emerald-700">99.8% Passed Testing</strong>
                </div>
                <div className="fpc-kv-item">
                  <small>On-Time Delivery Score</small>
                  <strong className="text-emerald-700">98.4% Fulfillment</strong>
                </div>
                <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}>
                  <small>Overall Vendor Rating</small>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span className="text-amber-600 font-bold text-sm">★★★★★ 4.9 / 5.0</span>
                    <span className="fpc-chip active">TSF Grade-A Preferred Partner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase Order History Table */}
          <div className="fpc-detail-card" style={{ marginBottom: 20 }}>
            <div className="fpc-detail-card-title">
              <Package size={16} className="text-emerald-700" /> Purchase Orders & Delivery Receipts ({selectedSupplier.name})
            </div>
            <div className="fpc-ws-table-wrap">
              <table className="fpc-ws-table">
                <thead>
                  <tr>
                    <th>PO Ref</th>
                    <th>Date</th>
                    <th>Item & Variety Description</th>
                    <th>Quantity Delivered</th>
                    <th>Unit Rate</th>
                    <th>Total PO Value</th>
                    <th>Delivery Godown</th>
                    <th>QC & Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { po: `PO-${fpc.id.slice(-3)}-094`, date: "04 Sep 2026", item: "Certified Paddy Seed MTU-7029", qty: "350 Bags (50kg)", rate: "₹1,850 / bag", amt: 647500, godown: "Godown 1 (Central Hub)", status: "Pending Settlement" },
                    { po: `PO-${fpc.id.slice(-3)}-082`, date: "18 Aug 2026", item: "Urea & DAP Fertilizer Lots", qty: "400 Bags (45kg)", rate: "₹1,350 / bag", amt: 540000, godown: "Godown 2 (Sadar Unit)", status: "Paid · UTR Settled" },
                    { po: `PO-${fpc.id.slice(-3)}-071`, date: "02 Jun 2026", item: "Hybrid Maize Seed NK-6240", qty: "200 Bags (10kg)", rate: "₹2,100 / bag", amt: 420000, godown: "Godown 1 (Central Hub)", status: "Paid · UTR Settled" },
                    { po: `PO-${fpc.id.slice(-3)}-059`, date: "15 Apr 2026", item: "Bio-NPK & Micronutrient Packs", qty: "500 Litres", rate: "₹450 / Litre", amt: 225000, godown: "Godown 3 (Storage Unit)", status: "Paid · UTR Settled" },
                  ].map(po => (
                    <tr key={po.po}>
                      <td><span className="font-mono text-slate-700 font-bold">{po.po}</span></td>
                      <td>{po.date}</td>
                      <td><strong>{po.item}</strong></td>
                      <td>{po.qty}</td>
                      <td>{po.rate}</td>
                      <td><strong className="text-slate-900">{money(po.amt)}</strong></td>
                      <td><span className="text-xs text-slate-600">{po.godown}</span></td>
                      <td>
                        <span className={`fpc-chip ${po.status.includes("Paid") ? "active" : "pending"}`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* --- STANDARD 10 WORKSPACE TABS --- */
        <>
          {/* TAB A: FPC PROFILE */}
          {activeTab === "profile" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><Building2 size={20} className="text-emerald-700" /> FPC Company Profile & Governance</h2>
                  <p>Corporate legal identity, incorporation filings, authorized capital structure, and management</p>
                </div>
                <span className="fpc-chip active text-xs">
                  <CheckCircle2 size={12} /> Verified Producer Company
                </span>
              </div>

              {/* 3-Column Profile Cards */}
              <div className="fpc-ws-cards-3col">
                <div className="fpc-ws-info-card">
                  <div className="fpc-ws-info-card-header">
                    <Building2 size={16} className="text-emerald-700" />
                    Statutory Registration
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Corporate CIN</span>
                    <span className="fpc-ws-info-val font-mono text-xs">{fpcCin}</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Company PAN</span>
                    <span className="fpc-ws-info-val font-mono">{fpc.details?.basic?.pan || "AAACG1234F"}</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">GSTIN</span>
                    <span className="fpc-ws-info-val font-mono text-xs">{fpc.details?.basic?.gstin || "21AAACG1234F1Z5"}</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Registrar of Companies</span>
                    <span className="fpc-ws-info-val">RoC Cuttack, Odisha</span>
                  </div>
                </div>

                <div className="fpc-ws-info-card">
                  <div className="fpc-ws-info-card-header">
                    <Landmark size={16} className="text-emerald-700" />
                    Capital Structure & Members
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Authorised Capital</span>
                    <span className="fpc-ws-info-val font-bold">₹10,00,000</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Paid-up Capital</span>
                    <span className="fpc-ws-info-val font-bold text-emerald-800">₹6,20,000 (62.0%)</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Nominal Face Value</span>
                    <span className="fpc-ws-info-val">₹100 per Equity Share</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Shareholders Enrolled</span>
                    <span className="fpc-ws-info-val">{shareholdersList.length} Members</span>
                  </div>
                </div>

                <div className="fpc-ws-info-card">
                  <div className="fpc-ws-info-card-header">
                    <MapPin size={16} className="text-emerald-700" />
                    Registered Office & Contact
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Registered Office</span>
                    <span className="fpc-ws-info-val">{fpc.details?.roc?.registeredAddress || `Main Office, ${fpcLocation}`}</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Contact Official</span>
                    <span className="fpc-ws-info-val font-mono">{fpc.details?.basic?.mobile || "+91 9437004412"}</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Official Email</span>
                    <span className="fpc-ws-info-val">{fpc.details?.basic?.contactEmail || "office@fpc.demo"}</span>
                  </div>
                  <div className="fpc-ws-info-row">
                    <span className="fpc-ws-info-label">Primary Commodities</span>
                    <span className="fpc-ws-info-val">{fpc.details?.location?.commodities || "Paddy, Maize, Pulses, Mustard"}</span>
                  </div>
                </div>
              </div>

              {/* Baseline Assessment & Surveys Reference Card */}
              <div className="fpc-ws-info-card" style={{ marginTop: 16, background: "#f8fdf9", borderColor: "#bbf7d0" }}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={17} className="text-emerald-700" />
                    <span className="font-bold text-slate-900 text-sm">Baseline Assessment & Field M&amp;E Overview</span>
                    <span className={`fpc-chip ${fpcBaseline?.status === "Completed" ? "active" : "pending"}`}>
                      ● ${fpcBaseline ? fpcBaseline.status : "Pending Baseline Assessment"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("baseline_surveys")}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    Open Tab K: Full Baseline &amp; Surveys (${fpcSurveys.length}) <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block">Assessment Sign-Off</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {fpcBaseline ? fpcBaseline.assessmentDate : "Pending Sign-off"}
                    </strong>
                    <span className="text-[11px] text-emerald-700">
                      {fpcBaseline ? fpcBaseline.assessorName : "TSF Onboarding Evaluation"}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block">Farmer Base Progress</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {fpcBaseline?.indicators?.[0]?.baselineValue || 250} → {farmersList.length} Farmers
                    </strong>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      +{Math.round(((farmersList.length - (fpcBaseline?.indicators?.[0]?.baselineValue || 250)) / (fpcBaseline?.indicators?.[0]?.baselineValue || 250)) * 100)}% Growth from Baseline
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block">Turnover Trajectory</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {money(fpcBaseline?.indicators?.[1]?.baselineValue || 1850000)} → {money(turnoverNum)}
                    </strong>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      +{Math.round(((turnoverNum - (fpcBaseline?.indicators?.[1]?.baselineValue || 1850000)) / (fpcBaseline?.indicators?.[1]?.baselineValue || 1850000)) * 100)}% Revenue Expansion
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block">Field Surveys</span>
                    <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                      {fpcSurveys.filter((s: any) => s.status === "Active").length} Active · {fpcSurveys.length} Total
                    </strong>
                    <span className="text-[11px] text-emerald-700">
                      {fpcSurveyResponses.length} Verified Field Responses
                    </span>
                  </div>
                </div>
              </div>

              {/* Board of Directors Table */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Users size={16} className="text-emerald-700" /> Board of Directors (BOD) Details
                  </h3>
                  <span className="text-xs text-slate-500">Click any director row to inspect statutory profile</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>Director Name</th>
                        <th>DIN / PAN</th>
                        <th>Designation</th>
                        <th>Appointment Date</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {directorsList.map((d: any) => (
                        <tr
                          key={d.id}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedDirector(d)}
                          title="Click to inspect Director profile"
                        >
                          <td><strong className="text-slate-900">{d.name}</strong></td>
                          <td><span className="font-mono text-slate-600">{d.din || d.dinPan || "01234567"}</span></td>
                          <td><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{d.designation}</span></td>
                          <td>{d.appointmentDate || "14 Jun 2021"}</td>
                          <td><span className="font-mono">{d.mobile || "+91 9876501001"}</span></td>
                          <td>{d.email || "director@fpc.demo"}</td>
                          <td><span className="fpc-chip active"><Check size={10} /> Active</span></td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedDirector(d); }}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Statutory Regulatory Licenses */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck size={16} className="text-emerald-700" /> Statutory Regulatory Licenses & Permits
                  </h3>
                  <span className="text-xs text-slate-500">Click any license row to view regulatory parameters</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>License Category</th>
                        <th>License Number</th>
                        <th>Issuing Authority</th>
                        <th>Issue Date</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(initialLicences || []).slice(0, 4).map(lic => (
                        <tr
                          key={lic.id}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedLicense(lic)}
                          title="Click to inspect License details"
                        >
                          <td><strong className="text-slate-900">{lic.name}</strong></td>
                          <td><span className="font-mono text-slate-700">{lic.number}</span></td>
                          <td>{lic.authority}</td>
                          <td>{lic.issueDate}</td>
                          <td><strong>{lic.expiry}</strong></td>
                          <td>
                            <span className={`fpc-chip ${lic.status === "Active" || lic.status === "Valid" ? "active" : "pending"}`}>
                              {lic.status || "Valid"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedLicense(lic); }}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB B: FARMER MANAGEMENT */}
          {activeTab === "farmers" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><Users size={20} className="text-emerald-700" /> Farmer Member Management</h2>
                  <p>Registered farmer producers, landholding tiers, KYC verification, and crop participation for {fpcName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    {farmersList.length} Total Registered Farmers
                  </span>
                </div>
              </div>

              {/* Metric Highlights */}
              <div className="fpc-ws-metrics-strip">
                <div className="fpc-ws-metric-box">
                  <small>Total Farmers</small>
                  <strong>{farmersList.length}</strong>
                  <span className="text-slate-500">100% Onboarded</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Aadhaar / KYC Verified</small>
                  <strong className="text-emerald-700">{farmersList.filter(f => f.kyc === "Verified").length}</strong>
                  <span className="text-emerald-700 font-semibold">{((farmersList.filter(f => f.kyc === "Verified").length / farmersList.length) * 100).toFixed(0)}% Verified</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Shareholder Members</small>
                  <strong className="text-blue-700">{farmersList.filter(f => f.shareholder === "Yes").length}</strong>
                  <span className="text-blue-700">Equity Contributors</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Village Coverage</small>
                  <strong className="text-purple-700">18 Villages</strong>
                  <span className="text-purple-700">{fpc.block || "Keonjhar Sadar"} Block</span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <div className="tsf-search-box" style={{ minWidth: 260 }}>
                  <Search size={14} className="text-slate-400" />
                  <input
                    placeholder="Search farmers by name, ID, village or crop..."
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                  />
                  {farmerSearch && (
                    <button type="button" onClick={() => setFarmerSearch("")} className="text-slate-400">
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-500">KYC Status:</label>
                  <select
                    className="tsf-select-control text-xs"
                    value={farmerKycFilter}
                    onChange={(e) => setFarmerKycFilter(e.target.value)}
                  >
                    <option value="ALL">All KYC Statuses</option>
                    <option value="Verified">Verified Only</option>
                    <option value="Pending">Pending KYC</option>
                  </select>
                </div>
              </div>

              {/* Farmer Directory Table */}
              <div className="fpc-ws-table-wrap">
                <table className="fpc-ws-table">
                  <thead>
                    <tr>
                      <th>Farmer ID</th>
                      <th>Farmer Name</th>
                      <th>Contact Mobile</th>
                      <th>Village / Panchayat</th>
                      <th>Landholding</th>
                      <th>Primary Crop</th>
                      <th>KYC Status</th>
                      <th>Shareholder</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFarmers.slice(0, 20).map(f => (
                      <tr
                        key={f.id}
                        className="fpc-clickable-row"
                        onClick={() => {
                          setSelectedFarmerId(f.id);
                          setSelectedFarmerProp(f);
                        }}
                        title={`Click to open full overview for ${f.name}`}
                      >
                        <td><span className="font-mono text-slate-600 font-bold">{f.id}</span></td>
                        <td><strong className="text-slate-900">{f.name}</strong></td>
                        <td><span className="font-mono">{f.mobile}</span></td>
                        <td>{f.village}</td>
                        <td>{f.land}</td>
                        <td><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs">{f.crop}</span></td>
                        <td>
                          <span className={`fpc-chip ${f.kyc === "Verified" ? "active" : "pending"}`}>
                            {f.kyc === "Verified" ? "✓ Verified" : "⏳ Pending"}
                          </span>
                        </td>
                        <td>
                          <span className={`text-xs font-bold ${f.shareholder === "Yes" ? "text-emerald-700" : "text-slate-400"}`}>
                            {f.shareholder}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="em-btn compact"
                            style={{ padding: "4px 9px", fontSize: 11, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 4, cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFarmerId(f.id);
                              setSelectedFarmerProp(f);
                            }}
                          >
                            <Eye size={12} /> View Overview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-500 text-right mt-2">
                Showing {Math.min(20, filteredFarmers.length)} of {filteredFarmers.length} farmers in {fpcName} • Click any row for comprehensive farmer profile
              </div>
            </section>
          )}

          {/* TAB C: SHAREHOLDER MANAGEMENT */}
          {activeTab === "shareholders" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><Award size={20} className="text-emerald-700" /> Shareholder Registry & Capital Holdings</h2>
                  <p>Statutory share allotments, distinctive certificate numbers, capital contributions and dividend tracking</p>
                </div>
                <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                  {shareholdersList.length} Total Shareholders
                </span>
              </div>

              {/* Metric Highlights */}
              <div className="fpc-ws-metrics-strip">
                <div className="fpc-ws-metric-box">
                  <small>Total Share Capital</small>
                  <strong className="text-emerald-800">₹6,20,000</strong>
                  <span className="text-slate-500">6,200 Equity Shares</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Face Value</small>
                  <strong className="text-slate-900">₹100 / Share</strong>
                  <span className="text-slate-500">Statutory Nominal Value</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Share Certificates</small>
                  <strong className="text-emerald-700">100% Issued</strong>
                  <span className="text-emerald-700 font-semibold">Form SH-1 Compliant</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Avg Shareholding</small>
                  <strong className="text-slate-900">22.4 Shares</strong>
                  <span className="text-slate-500">Democratically Distributed</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="tsf-search-box mb-3" style={{ maxWidth: 360 }}>
                <Search size={14} className="text-slate-400" />
                <input
                  placeholder="Search shareholders by name, folio or certificate..."
                  value={shareholderSearch}
                  onChange={(e) => setShareholderSearch(e.target.value)}
                />
              </div>

              {/* Shareholder Table */}
              <div className="fpc-ws-table-wrap">
                <table className="fpc-ws-table">
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Shareholder Name</th>
                      <th>Folio Number</th>
                      <th>Certificate No</th>
                      <th>Shares Held</th>
                      <th>Paid Capital</th>
                      <th>Admitted Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShareholders.slice(0, 15).map(s => (
                      <tr
                        key={s.id}
                        className="fpc-clickable-row"
                        onClick={() => {
                          setSelectedShareholderId(s.id);
                          setSelectedShareholderProp(s);
                        }}
                        title={`Click to view ${s.name} shareholder overview`}
                      >
                        <td><span className="font-mono text-slate-600 font-bold">{s.id}</span></td>
                        <td><strong className="text-slate-900">{s.name}</strong></td>
                        <td><span className="font-mono">{s.folio}</span></td>
                        <td><span className="font-mono text-xs">{s.certificate}</span></td>
                        <td><strong>{s.shares}</strong></td>
                        <td>{money(s.capital)}</td>
                        <td>{s.admitted}</td>
                        <td><span className="fpc-chip active">● Active</span></td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="em-btn compact"
                            style={{ padding: "4px 9px", fontSize: 11, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 4, cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShareholderId(s.id);
                              setSelectedShareholderProp(s);
                            }}
                          >
                            <Eye size={12} /> View Overview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-500 text-right mt-2">
                Showing {Math.min(15, filteredShareholders.length)} of {filteredShareholders.length} shareholders • Click any row to view complete statutory equity profile
              </div>
            </section>
          )}

          {/* TAB D: BUYERS & SUPPLIERS */}
          {activeTab === "buyers_suppliers" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><ShoppingCart size={20} className="text-emerald-700" /> Commercial Buyers & Input Suppliers</h2>
                  <p>Off-taker agreements, corporate buyer relationships, certified input vendor network and trade balances</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ShoppingCart size={16} className="text-blue-700" /> Institutional Off-Takers & Commercial Buyers
                  </h3>
                  <span className="text-xs text-slate-500">Click any buyer row to view sales orders, invoices & payment terms</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>Buyer Entity</th>
                        <th>Contact Person</th>
                        <th>Phone</th>
                        <th>GSTIN</th>
                        <th>Commodities Contracted</th>
                        <th>Annual Invoiced</th>
                        <th>Receivables Due</th>
                        <th>Terms</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyersList.map(b => (
                        <tr
                          key={b.id}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedBuyer(b)}
                          title={`Click to inspect ${b.name} buyer profile`}
                        >
                          <td><strong className="text-slate-900">{b.name}</strong></td>
                          <td>{b.contactPerson}</td>
                          <td><span className="font-mono">{b.mobile}</span></td>
                          <td><span className="font-mono text-xs">{b.gstin}</span></td>
                          <td><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs">{b.commoditiesPurchased}</span></td>
                          <td><strong className="text-slate-800">{money(b.totalInvoiced)}</strong></td>
                          <td>
                            <strong className={b.receivables > 0 ? "text-amber-700" : "text-emerald-700"}>
                              {money(b.receivables)}
                            </strong>
                          </td>
                          <td><span className="text-xs text-slate-500">{b.terms}</span></td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "4px 8px", fontSize: 11, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 4, cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBuyer(b);
                              }}
                            >
                              <Eye size={12} /> View Overview
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Package size={16} className="text-amber-700" /> Certified Input Suppliers & Seed / Fertilizer Vendors
                  </h3>
                  <span className="text-xs text-slate-500">Click any supplier row to view purchase orders & payables</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>Supplier / Manufacturer</th>
                        <th>Contact Representative</th>
                        <th>Phone</th>
                        <th>GSTIN</th>
                        <th>Certified Product Categories</th>
                        <th>Annual Procured</th>
                        <th>Outstanding Payables</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliersList.map(s => (
                        <tr
                          key={s.id}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedSupplier(s)}
                          title={`Click to inspect ${s.name} supplier profile`}
                        >
                          <td><strong className="text-slate-900">{s.name}</strong></td>
                          <td>{s.contactPerson}</td>
                          <td><span className="font-mono">{s.mobile}</span></td>
                          <td><span className="font-mono text-xs">{s.gstin}</span></td>
                          <td><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs">{s.productCategory}</span></td>
                          <td><strong className="text-slate-800">{money(s.annualPurchases)}</strong></td>
                          <td>
                            <strong className={s.outstandingPayables > 0 ? "text-amber-700" : "text-emerald-700"}>
                              {money(s.outstandingPayables)}
                            </strong>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "4px 8px", fontSize: 11, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", borderRadius: 4, cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSupplier(s);
                              }}
                            >
                              <Eye size={12} /> View Overview
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB E: AGRI BUSINESS FLOW */}
          {activeTab === "agribiz" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><Package size={20} className="text-emerald-700" /> Agri Business Flow & Trading Performance</h2>
                  <p>Member produce aggregation, input distribution, value realization, and commercial commodity contracts</p>
                </div>
              </div>

              <div className="fpc-ws-metrics-strip">
                <div className="fpc-ws-metric-box">
                  <small>Total Produce Procured</small>
                  <strong className="text-emerald-800">420 Metric Tonnes</strong>
                  <span className="text-slate-500">From 100+ Member Farmers</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Produce Dispatched / Sold</small>
                  <strong className="text-blue-800">395 Metric Tonnes</strong>
                  <span className="text-emerald-700 font-semibold">94.0% Fulfillment Rate</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Input Supply Dispatched</small>
                  <strong className="text-amber-800">₹14.8 Lakhs</strong>
                  <span className="text-slate-500">Seeds & Fertilizers</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Average Gross Margin</small>
                  <strong className="text-emerald-700">18.6% Realized</strong>
                  <span className="text-slate-500">Direct Farm-to-Buyer</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800">Commodity Trading Volumes & Realized Value</h3>
                  <span className="text-xs text-slate-500">Click any commodity row to inspect trading & voucher details</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>Commodity Name</th>
                        <th>Category</th>
                        <th>Procurement Intake</th>
                        <th>Avg Purchase Rate</th>
                        <th>Sales Quantity</th>
                        <th>Avg Realized Sale Rate</th>
                        <th>Gross Trading Margin</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Paddy (Common)", category: "Grains", procured: "240 MT", pRate: "₹25/kg", sold: "230 MT", sRate: "₹28/kg", margin: "₹7.20 L (12.0%)", status: "Active" },
                        { name: "Hybrid Maize", category: "Grains", procured: "95 MT", pRate: "₹21/kg", sold: "90 MT", sRate: "₹24.5/kg", margin: "₹3.32 L (16.6%)", status: "Active" },
                        { name: "Arhar (Tur)", category: "Pulses", procured: "35 MT", pRate: "₹72/kg", sold: "32 MT", sRate: "₹88/kg", margin: "₹5.60 L (22.2%)", status: "Active" },
                        { name: "Mustard Seed", category: "Oilseeds", procured: "28 MT", pRate: "₹58/kg", sold: "25 MT", sRate: "₹69/kg", margin: "₹3.08 L (19.0%)", status: "Active" },
                        { name: "Finger Millet (Ragi)", category: "Millets", procured: "22 MT", pRate: "₹38/kg", sold: "18 MT", sRate: "₹46/kg", margin: "₹1.76 L (21.0%)", status: "Active" }
                      ].map(c => (
                        <tr
                          key={c.name}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedTransaction(c)}
                          title="Click to inspect commodity trading parameters"
                        >
                          <td><strong className="text-slate-900">{c.name}</strong></td>
                          <td><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{c.category}</span></td>
                          <td>{c.procured}</td>
                          <td>{c.pRate}</td>
                          <td>{c.sold}</td>
                          <td><strong className="text-slate-800">{c.sRate}</strong></td>
                          <td><strong className="text-emerald-800">{c.margin}</strong></td>
                          <td><span className="fpc-chip active">Fulfilling</span></td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedTransaction(c); }}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB F: INVENTORY & GODOWNS */}
          {activeTab === "inventory" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><Warehouse size={20} className="text-emerald-700" /> Inventory & Godown Storage Infrastructure</h2>
                  <p>Licensed godowns, storage capacities, space utilization, batch monitoring, and current commodity stock</p>
                </div>
              </div>

              <div className="fpc-ws-metrics-strip">
                <div className="fpc-ws-metric-box">
                  <small>Operating Godowns</small>
                  <strong>{godownsList.length} Facilities</strong>
                  <span className="text-slate-500">{fpcLocation}</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Total Storage Capacity</small>
                  <strong className="text-slate-900">800 MT Total</strong>
                  <span className="text-slate-500">Licensed Facilities</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Current Occupancy</small>
                  <strong className="text-emerald-700">470 MT (58.8%)</strong>
                  <span className="text-emerald-700 font-semibold">Optimal Load Balance</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Total Stock Valuation</small>
                  <strong className="text-emerald-800">₹85.6 Lakhs</strong>
                  <span className="text-slate-500">At Current Mandi Rates</span>
                </div>
              </div>

              {/* Godown Facility Cards */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800">Licensed Storage Facilities</h3>
                <span className="text-xs text-slate-500">Click any godown card to inspect storage logs & utilization</span>
              </div>
              <div className="fpc-ws-cards-3col">
                {godownsList.map(g => (
                  <div
                    key={g.id}
                    className="fpc-ws-info-card fpc-clickable-row"
                    onClick={() => setSelectedGodown(g)}
                    title="Click to inspect Godown facility details"
                    style={{ cursor: "pointer" }}
                  >
                    <div className="fpc-ws-info-card-header flex justify-between items-center">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Warehouse size={16} className="text-emerald-700" />
                        {g.name}
                      </span>
                      <button
                        type="button"
                        className="em-btn compact"
                        style={{ padding: "2px 6px", fontSize: 10 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedGodown(g); }}
                      >
                        <Eye size={10} /> Inspect
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">📍 {g.address}</div>
                    <div className="fpc-ws-info-row">
                      <span className="fpc-ws-info-label">Total Capacity</span>
                      <span className="fpc-ws-info-val">{g.capacity}</span>
                    </div>
                    <div className="fpc-ws-info-row">
                      <span className="fpc-ws-info-label">Facility In-Charge</span>
                      <span className="fpc-ws-info-val">{g.manager}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">Utilization</span>
                        <strong className="text-emerald-800">{g.used}% Occupied</strong>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${g.used}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stock Batch & Commodity Inventory */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800">Current Stock Lots & Inward Batches</h3>
                  <span className="text-xs text-slate-500">Click any batch to inspect QC and lot movement logs</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>Batch Code</th>
                        <th>Commodity & Variety</th>
                        <th>Location Unit</th>
                        <th>Current Quantity</th>
                        <th>Inward Date</th>
                        <th>QC Test Grade</th>
                        <th>Storage Condition</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { code: "LOT-2026-P01", item: "Paddy (Common - Swarna)", unit: "Godown 1 (Central)", qty: "180 MT", date: "14 Oct 2026", qc: "Grade A (Moisture 13%)", cond: "Aerated & Fumigated" },
                        { code: "LOT-2026-M02", item: "Hybrid Maize (NK-6240)", unit: "Godown 1 (Central)", qty: "85 MT", date: "28 Sep 2026", qc: "Grade A (Moisture 12.5%)", cond: "Dry Storage" },
                        { code: "LOT-2026-A01", item: "Arhar Dal (Pigeon Pea)", unit: "Godown 2 (Sadar)", qty: "32 MT", date: "10 Sep 2026", qc: "Grade A (Purity 99%)", cond: "Airtight Sealed" },
                        { code: "LOT-2026-S03", item: "Certified Paddy Seed MTU-7029", unit: "Godown 3 (Seed Store)", qty: "350 Bags (17.5 MT)", date: "04 Sep 2026", qc: "Germination 96%", cond: "Dehumidified Unit" }
                      ].map(item => (
                        <tr
                          key={item.code}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedStockBatch(item)}
                          title="Click to view Batch & QC record"
                        >
                          <td><span className="font-mono text-slate-700 font-bold">{item.code}</span></td>
                          <td><strong>{item.item}</strong></td>
                          <td><span className="text-xs text-slate-600">{item.unit}</span></td>
                          <td><strong className="text-emerald-800">{item.qty}</strong></td>
                          <td>{item.date}</td>
                          <td><span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-xs font-semibold">{item.qc}</span></td>
                          <td><span className="text-xs text-slate-500">{item.cond}</span></td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedStockBatch(item); }}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB G: FINANCIAL MANAGEMENT */}
          {activeTab === "finance" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><Landmark size={20} className="text-emerald-700" /> Financial Management & Profit & Loss</h2>
                  <p>Income, operating expenditure, gross margin, farmer settlements, outstanding dues, and cash flow</p>
                </div>
              </div>

              <div className="fpc-ws-metrics-strip">
                <div className="fpc-ws-metric-box">
                  <small>Total Revenue</small>
                  <strong className="text-emerald-800">{money(turnoverNum)}</strong>
                  <span className="text-emerald-700">FY 2026–27 Realized</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Operating Expenses</small>
                  <strong className="text-amber-800">{money(expensesNum)}</strong>
                  <span className="text-slate-500">Procurement & Overheads</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Gross Margin</small>
                  <strong className="text-slate-900">{money(grossProfitNum)}</strong>
                  <span className="text-slate-600 font-semibold">{((grossProfitNum / turnoverNum) * 100).toFixed(1)}% Margin</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Net Operating Surplus</small>
                  <strong className="text-blue-800">{money(netProfitNum)}</strong>
                  <span className="text-blue-700 font-semibold">{((netProfitNum / turnoverNum) * 100).toFixed(1)}% Net Margin</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Buyer Receivables</small>
                  <strong className="text-amber-700">₹6.10 Lakhs</strong>
                  <span className="text-slate-500">Across 4 Institutional Buyers</span>
                </div>
                <div className="fpc-ws-metric-box">
                  <small>Farmer Payables</small>
                  <strong className="text-slate-800">₹2.35 Lakhs</strong>
                  <span className="text-slate-500">Settlements In Process</span>
                </div>
              </div>

              {/* Monthly Financial Performance Chart */}
              <div className="fpc-ws-info-card mb-4">
                <div className="fpc-ws-info-card-header">
                  <BarChart3 size={16} className="text-emerald-700" />
                  Monthly Revenue vs Operating Expenditure (FY 2026–27)
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyFinanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(v: any) => money(Number(v))} />
                      <RechartsLegend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name="Revenue (₹)" fill="#1b5e20" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="expenses" name="Expenditure (₹)" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Financial Ledger Vouchers Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800">Recent Bank Book & Settlement Vouchers</h3>
                  <span className="text-xs text-slate-500">Click any financial voucher to view audit trail</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>Voucher ID</th>
                        <th>Date</th>
                        <th>Account Head</th>
                        <th>Party / Entity</th>
                        <th>Debit / Credit</th>
                        <th>Amount</th>
                        <th>Payment Mode & Reference</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: "VCH-2026-041", date: "16 Oct 2026", head: "Produce Sales Revenue", party: "ITC Agri Business Division", type: "Credit (Inflow)", amt: 3990000, mode: "RTGS · UTR2026101600812" },
                        { id: "VCH-2026-039", date: "14 Oct 2026", head: "Farmer Produce Procurement", party: "Ravi Kumar & 18 Farmers", type: "Debit (Disbursement)", amt: 642000, mode: "Direct Bank Transfer" },
                        { id: "VCH-2026-035", date: "04 Sep 2026", head: "Certified Seed Intake", party: "National Seeds Corporation Ltd.", type: "Debit (Input Cost)", amt: 647500, mode: "NEFT · Pending Clearance" },
                        { id: "VCH-2026-028", date: "18 Aug 2026", head: "Godown Maintenance & Rent", party: "Central Aggregation Yard", type: "Debit (Operating Overhead)", amt: 45000, mode: "Bank Transfer" }
                      ].map(row => (
                        <tr
                          key={row.id}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedFinancialRecord(row)}
                          title="Click to inspect Voucher details"
                        >
                          <td><span className="font-mono text-slate-700 font-bold">{row.id}</span></td>
                          <td>{row.date}</td>
                          <td><strong>{row.head}</strong></td>
                          <td>{row.party}</td>
                          <td>
                            <span className={`fpc-chip ${row.type.includes("Credit") ? "active" : "pending"}`}>
                              {row.type}
                            </span>
                          </td>
                          <td><strong className="text-slate-900">{money(row.amt)}</strong></td>
                          <td><span className="font-mono text-xs text-slate-600">{row.mode}</span></td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedFinancialRecord(row); }}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* TAB H: EMPLOYEE & STAFF */}
          {activeTab === "staff" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><Briefcase size={20} className="text-emerald-700" /> Employee & Staff Management</h2>
                  <p>Organizational human resources, roles, deployed field personnel, and key managerial staff</p>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                  {employeesList.length} Active Staff Members
                </span>
              </div>

              <div className="fpc-ws-table-wrap">
                <table className="fpc-ws-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Full Name</th>
                      <th>Designation</th>
                      <th>Department / Role</th>
                      <th>Mobile Number</th>
                      <th>Joining Date</th>
                      <th>Employment</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeesList.map((emp: any) => (
                      <tr
                        key={emp.id}
                        className="fpc-clickable-row"
                        onClick={() => setSelectedStaff(emp)}
                        title="Click to inspect Employee profile"
                      >
                        <td><span className="font-mono text-slate-600 font-bold">{emp.id}</span></td>
                        <td><strong className="text-slate-900">{emp.name}</strong></td>
                        <td><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">{emp.designation}</span></td>
                        <td>{emp.role}</td>
                        <td><span className="font-mono">{emp.mobile}</span></td>
                        <td>{emp.dateOfJoining}</td>
                        <td>{emp.employmentType}</td>
                        <td><span className="fpc-chip active">Active</span></td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="em-btn compact"
                            style={{ padding: "3px 8px", fontSize: 11 }}
                            onClick={(e) => { e.stopPropagation(); setSelectedStaff(emp); }}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB I: COMPLIANCE & GOVERNANCE */}
          {activeTab === "compliance" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><ShieldCheck size={20} className="text-emerald-700" /> Compliance, Statutory Filings & Governance</h2>
                  <p>ROC filing tracker, MCA annual returns, regulatory license expirations, and board meeting minutes</p>
                </div>
                <span className="fpc-chip active text-xs">
                  ✓ Overall Governance Grade A (94%)
                </span>
              </div>

              <div className="fpc-ws-cards-3col">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">Annual Return (MGT-7)</span>
                  <strong className="text-lg font-bold text-emerald-950 block mt-1">Filed Successfully</strong>
                  <span className="text-xs text-emerald-700">SRN: R89201948 · Date: 20 Oct 2025</span>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">Financial Statements (AOC-4)</span>
                  <strong className="text-lg font-bold text-emerald-950 block mt-1">Completed & Audited</strong>
                  <span className="text-xs text-emerald-700">SRN: R89201949 · Date: 21 Sep 2026</span>
                </div>
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 uppercase block">Fertilizer License Renewal</span>
                  <strong className="text-lg font-bold text-amber-950 block mt-1">Expiring in 45 Days</strong>
                  <span className="text-xs text-amber-800">Renewal application submitted</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800">Statutory ROC Compliance Calendar</h3>
                  <span className="text-xs text-slate-500">Click any filing row to view SRN & MCA acknowledgement</span>
                </div>
                <div className="fpc-ws-table-wrap">
                  <table className="fpc-ws-table">
                    <thead>
                      <tr>
                        <th>Form Name</th>
                        <th>Statutory Description</th>
                        <th>Due Date</th>
                        <th>Filing Date</th>
                        <th>SRN Number</th>
                        <th>Compliance Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { form: "AOC-4", desc: "Filing of Financial Statements & Balance Sheet", due: "30 Oct 2026", filed: "21 Sep 2026", srn: "R89201949", status: "Filed" },
                        { form: "MGT-7", desc: "Annual Return of Producer Company", due: "29 Nov 2026", filed: "20 Oct 2025", srn: "R89201948", status: "Filed" },
                        { form: "DIR-3 KYC", desc: "Annual KYC of all Board Directors", due: "30 Sep 2026", filed: "18 Sep 2026", srn: "K10928374", status: "Compliant" },
                        { form: "GSTR-3B", desc: "Monthly GST Summary Return", due: "20 Nov 2026", filed: "—", srn: "Pending Filing", status: "Due Soon" }
                      ].map(f => (
                        <tr
                          key={f.form}
                          className="fpc-clickable-row"
                          onClick={() => setSelectedCompliance(f)}
                          title="Click to view statutory filing details"
                        >
                          <td><strong className="text-slate-900 font-mono">{f.form}</strong></td>
                          <td>{f.desc}</td>
                          <td>{f.due}</td>
                          <td>{f.filed}</td>
                          <td><span className="font-mono text-xs">{f.srn}</span></td>
                          <td>
                            <span className={`fpc-chip ${f.status === "Filed" || f.status === "Compliant" ? "active" : "pending"}`}>
                              ● {f.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="em-btn compact"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedCompliance(f); }}
                            >
                              <Eye size={12} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}


          {/* TAB K: BASELINE & SURVEYS */}
          {/* TAB K: BASELINE ASSESSMENT, FIELD SURVEYS & IMPACT INDICATORS */}
          {activeTab === "baseline_surveys" && (
            <div style={{ marginTop: "0.25rem" }}>
              <BaselineSurveysModule
                state={state}
                setState={setState}
                role={role as any}
                fpcId={fpc.id}
                setToast={setToast}
                go={go}
              />
            </div>
          )}

          {/* TAB J: REPORTS & ANALYTICS */}
          {activeTab === "analytics" && (
            <section className="fpc-ws-panel">
              <div className="fpc-ws-section-head">
                <div className="fpc-ws-section-titles">
                  <h2><BarChart3 size={20} className="text-emerald-700" /> Operational Analytics & Dossier Reports</h2>
                  <p>Comprehensive performance indexes, member participation, commodity aggregation, and exportable reports</p>
                </div>
              </div>

              <div className="fpc-ws-cards-3col">
                <div className="fpc-ws-info-card">
                  <div className="fpc-ws-info-card-header">
                    <FileText size={16} className="text-emerald-700" />
                    Complete Operational Dossier
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Multi-tab Excel workbook containing full company master, complete farmer roster, share certificates, buyer contracts, supplier accounts, and financial performance.
                  </p>
                  <button type="button" onClick={exportDossierExcel} className="fpc-ws-btn primary" style={{ width: "100%", justifyContent: "center" }}>
                    <Download size={14} /> Download Comprehensive Excel (.xlsx)
                  </button>
                </div>

                <div className="fpc-ws-info-card">
                  <div className="fpc-ws-info-card-header">
                    <Printer size={16} className="text-emerald-700" />
                    Printable Executive Summary
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    Formatted print document optimized for board reviews, TSF central monitoring audits, and state nodal agency submissions.
                  </p>
                  <button type="button" onClick={handlePrint} className="fpc-ws-btn secondary" style={{ width: "100%", justifyContent: "center" }}>
                    <Printer size={14} /> Print / Save as PDF
                  </button>
                </div>

                <div className="fpc-ws-info-card">
                  <div className="fpc-ws-info-card-header">
                    <Award size={16} className="text-emerald-700" />
                    Overall Health Score
                  </div>
                  <div className="text-center py-2">
                    <span className="text-3xl font-extrabold text-emerald-800 block">Grade A</span>
                    <span className="text-xs font-semibold text-emerald-700">92 / 100 Operational Index</span>
                    <span className="text-[11px] text-slate-500 block mt-1">Based on Governance, Turnover & Farmer Onboarding</span>
                  </div>
                </div>
              </div>

              <div className="fpc-ws-cards-4col mt-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Farmer Participation</span>
                  <strong className="text-xl font-bold text-emerald-800 block mt-1">82.4%</strong>
                  <span className="text-xs text-emerald-700">Above target benchmark</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Storage Occupancy</span>
                  <strong className="text-xl font-bold text-slate-900 block mt-1">58.8%</strong>
                  <span className="text-xs text-slate-600">Optimal utilization</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Fulfillment SLA</span>
                  <strong className="text-xl font-bold text-blue-700 block mt-1">94.0%</strong>
                  <span className="text-xs text-blue-700">SLA Met on time</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Member Retention</span>
                  <strong className="text-xl font-bold text-purple-700 block mt-1">96.8%</strong>
                  <span className="text-xs text-purple-700">Active participation</span>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* 4. READ-ONLY SLIDE-OVER INSPECTION DRAWERS */}
      {/* ========================================================= */}

      {/* Director Drawer */}
      {selectedDirector && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedDirector(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • BOARD OF DIRECTORS</span>
                <h3>{selectedDirector.name}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedDirector(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className="fpc-chip active font-semibold">Active Director</span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Building2 size={15} /> Statutory Board Profile</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Director Name</small><strong>{selectedDirector.name}</strong></div>
                  <div className="fpc-kv-item"><small>DIN (Director ID)</small><strong className="font-mono">{selectedDirector.din || selectedDirector.dinPan || "01234567"}</strong></div>
                  <div className="fpc-kv-item"><small>Designation</small><strong>{selectedDirector.designation || "Director"}</strong></div>
                  <div className="fpc-kv-item"><small>Appointment Date</small><strong>{selectedDirector.appointmentDate || "14 Jun 2021"}</strong></div>
                  <div className="fpc-kv-item"><small>DIN Status</small><strong className="text-emerald-700">Active · Approved by MCA</strong></div>
                  <div className="fpc-kv-item"><small>Gender / Category</small><strong>{selectedDirector.gender || "General"} ({selectedDirector.category || "Farmer Representative"})</strong></div>
                  <div className="fpc-kv-item"><small>Mobile Number</small><strong className="font-mono">{selectedDirector.mobile || "+91 9876501001"}</strong></div>
                  <div className="fpc-kv-item"><small>Email Address</small><strong>{selectedDirector.email || "director@fpc.demo"}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}><small>Residential Address</small><span>{selectedDirector.address || "Keonjhar District, Odisha 758001"}</span></div>
                </div>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Award size={15} /> Committee Roles & Board Attendance</div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <strong>Procurement Sub-Committee:</strong> Member overseeing seasonal mandi procurement rates and farmer aggregation centers.
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <strong>Audit & Finance Committee:</strong> Regular quarterly attendance recorded for statutory books and internal controls.
                  </div>
                </div>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Statutory record verified under Companies Act, 2013</span>
              <button type="button" className="em-btn" onClick={() => setSelectedDirector(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

      {/* License Drawer */}
      {selectedLicense && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedLicense(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • REGULATORY LICENSE RECORD</span>
                <h3>{selectedLicense.name}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedLicense(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className={`fpc-chip ${selectedLicense.status === "Valid" || selectedLicense.status === "Active" ? "active" : "pending"}`}>
                  {selectedLicense.status || "Valid"}
                </span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><FileCheck size={15} /> License Specifications</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Category Name</small><strong>{selectedLicense.name}</strong></div>
                  <div className="fpc-kv-item"><small>Registration Number</small><strong className="font-mono">{selectedLicense.number}</strong></div>
                  <div className="fpc-kv-item"><small>Issuing Authority</small><strong>{selectedLicense.authority}</strong></div>
                  <div className="fpc-kv-item"><small>Date of Issue</small><strong>{selectedLicense.issueDate}</strong></div>
                  <div className="fpc-kv-item"><small>Expiry Date</small><strong className="text-amber-700">{selectedLicense.expiry}</strong></div>
                  <div className="fpc-kv-item"><small>Document on Record</small><strong>{selectedLicense.document || "Digital Copy Attached"}</strong></div>
                </div>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><ShieldCheck size={15} /> Regulatory Compliance Notice</div>
                <p className="text-xs text-slate-600 m-0 leading-relaxed">
                  Issued under state regulatory agricultural guidelines. Requires mandatory renewal documentation submission 60 days prior to expiry date. Physical inspection completed by district authorities.
                </p>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">License compliance verified with district portal</span>
              <button type="button" className="em-btn" onClick={() => setSelectedLicense(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

      {/* Transaction / Commodity Drawer */}
      {selectedTransaction && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedTransaction(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • AGRI BUSINESS TRADING VOUCHER</span>
                <h3>{selectedTransaction.name} Trading Flow</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedTransaction(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className="fpc-chip active font-semibold">Active Trade Flow</span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Package size={15} /> Commodity Trading Parameters</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Commodity</small><strong>{selectedTransaction.name}</strong></div>
                  <div className="fpc-kv-item"><small>Category</small><strong>{selectedTransaction.category}</strong></div>
                  <div className="fpc-kv-item"><small>Total Intake Procured</small><strong className="text-emerald-800">{selectedTransaction.procured}</strong></div>
                  <div className="fpc-kv-item"><small>Average Procurement Rate</small><strong>{selectedTransaction.pRate}</strong></div>
                  <div className="fpc-kv-item"><small>Dispatched & Sold</small><strong className="text-blue-800">{selectedTransaction.sold}</strong></div>
                  <div className="fpc-kv-item"><small>Average Realized Sale Rate</small><strong>{selectedTransaction.sRate}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}>
                    <small>Realized Trading Margin</small>
                    <strong className="text-emerald-800 text-base">{selectedTransaction.margin}</strong>
                  </div>
                </div>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><ShieldCheck size={15} /> Quality Specifications</div>
                <p className="text-xs text-slate-600 m-0 leading-relaxed">
                  Aggregated from registered member farmers in {fpc.block || "Keonjhar Sadar"}. Moisture content standardized at &lt;14%. Verified against institutional off-taker contract standards with zero deductions.
                </p>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Trade records audited for FY 2026–27</span>
              <button type="button" className="em-btn" onClick={() => setSelectedTransaction(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

      {/* Godown Facility Drawer */}
      {selectedGodown && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedGodown(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • STORAGE FACILITY SPECIFICATIONS</span>
                <h3>{selectedGodown.name}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedGodown(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className="fpc-chip active font-semibold">Active Licensed Godown</span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Warehouse size={15} /> Capacity & Utilization</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Total Capacity</small><strong>{selectedGodown.capacity} ({selectedGodown.capacityMt} MT)</strong></div>
                  <div className="fpc-kv-item"><small>Occupancy Percentage</small><strong className="text-emerald-700">{selectedGodown.used}% Occupied</strong></div>
                  <div className="fpc-kv-item"><small>Utilized Space</small><strong>{selectedGodown.utilizedMt} MT</strong></div>
                  <div className="fpc-kv-item"><small>Available Free Space</small><strong className="text-blue-700">{selectedGodown.availableMt} MT Available</strong></div>
                  <div className="fpc-kv-item"><small>Facility Manager</small><strong>{selectedGodown.manager}</strong></div>
                  <div className="fpc-kv-item"><small>Contact Phone</small><strong className="font-mono">{selectedGodown.phone}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}><small>Facility Location Address</small><span>{selectedGodown.address}</span></div>
                </div>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Package size={15} /> Storage Environment & License</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Commodities Stored</small><strong>{selectedGodown.commodities}</strong></div>
                  <div className="fpc-kv-item"><small>Aeration / Temperature</small><strong>{selectedGodown.temperature}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}><small>Warehouse Accreditation</small><span>{selectedGodown.license}</span></div>
                </div>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Warehouse inventory verified with monthly physical count</span>
              <button type="button" className="em-btn" onClick={() => setSelectedGodown(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

      {/* Stock Batch Drawer */}
      {selectedStockBatch && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedStockBatch(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • STOCK BATCH & LOT RECORD</span>
                <h3>{selectedStockBatch.code}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedStockBatch(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className="fpc-chip active font-semibold">Verified Lot</span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Package size={15} /> Batch Details</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Batch Code</small><strong className="font-mono">{selectedStockBatch.code}</strong></div>
                  <div className="fpc-kv-item"><small>Commodity & Variety</small><strong>{selectedStockBatch.item}</strong></div>
                  <div className="fpc-kv-item"><small>Storage Facility</small><strong>{selectedStockBatch.unit}</strong></div>
                  <div className="fpc-kv-item"><small>Current Quantity</small><strong className="text-emerald-800">{selectedStockBatch.qty}</strong></div>
                  <div className="fpc-kv-item"><small>Inward Date</small><strong>{selectedStockBatch.date}</strong></div>
                  <div className="fpc-kv-item"><small>Quality Test Result</small><strong className="text-emerald-700">{selectedStockBatch.qc}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}><small>Storage Treatment Condition</small><span>{selectedStockBatch.cond}</span></div>
                </div>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Inward batch registered in godown ledger</span>
              <button type="button" className="em-btn" onClick={() => setSelectedStockBatch(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

      {/* Financial Record Drawer */}
      {selectedFinancialRecord && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedFinancialRecord(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • FINANCIAL BOOK VOUCHER</span>
                <h3>{selectedFinancialRecord.id}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedFinancialRecord(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className="fpc-chip active font-semibold">Audited Ledger Entry</span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Landmark size={15} /> Voucher Parameters</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Voucher Reference</small><strong className="font-mono">{selectedFinancialRecord.id}</strong></div>
                  <div className="fpc-kv-item"><small>Transaction Date</small><strong>{selectedFinancialRecord.date}</strong></div>
                  <div className="fpc-kv-item"><small>Account Head</small><strong>{selectedFinancialRecord.head}</strong></div>
                  <div className="fpc-kv-item"><small>Party / Counterparty</small><strong>{selectedFinancialRecord.party}</strong></div>
                  <div className="fpc-kv-item"><small>Entry Classification</small><strong>{selectedFinancialRecord.type}</strong></div>
                  <div className="fpc-kv-item"><small>Total Amount</small><strong className="text-emerald-800 text-base">{money(selectedFinancialRecord.amt)}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}><small>Settlement Mode & Bank UTR</small><span className="font-mono text-xs">{selectedFinancialRecord.mode}</span></div>
                </div>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Audited under Double-Entry Bookkeeping System</span>
              <button type="button" className="em-btn" onClick={() => setSelectedFinancialRecord(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

      {/* Staff Profile Drawer */}
      {selectedStaff && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedStaff(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • STAFF PERSONNEL PROFILE</span>
                <h3>{selectedStaff.name}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedStaff(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className="fpc-chip active font-semibold">Active Personnel</span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><Briefcase size={15} /> Organizational Role</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Employee ID</small><strong className="font-mono">{selectedStaff.id}</strong></div>
                  <div className="fpc-kv-item"><small>Full Name</small><strong>{selectedStaff.name}</strong></div>
                  <div className="fpc-kv-item"><small>Designation</small><strong>{selectedStaff.designation}</strong></div>
                  <div className="fpc-kv-item"><small>Department</small><strong>{selectedStaff.department || "Operations"}</strong></div>
                  <div className="fpc-kv-item"><small>Date of Joining</small><strong>{selectedStaff.dateOfJoining}</strong></div>
                  <div className="fpc-kv-item"><small>Employment Contract</small><strong>{selectedStaff.employmentType}</strong></div>
                  <div className="fpc-kv-item"><small>Mobile Number</small><strong className="font-mono">{selectedStaff.mobile}</strong></div>
                  <div className="fpc-kv-item"><small>Official Email</small><strong>{selectedStaff.email}</strong></div>
                </div>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Human Resources verified under FPC Service Rules</span>
              <button type="button" className="em-btn" onClick={() => setSelectedStaff(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

      
      {/* Survey Inspection Drawer */}
      {selectedSurvey && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedSurvey(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • FIELD SURVEY &amp; AUDIT</span>
                <h3>{selectedSurvey.title}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedSurvey(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`fpc-chip ${selectedSurvey.status === "Active" ? "active" : "neutral"}`}>
                  ● {selectedSurvey.status}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedSurvey.category}
                </span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>

              {/* Survey Overview Card */}
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><ClipboardCheck size={15} /> Survey Specifications &amp; Timeline</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Survey Reference Code</small><strong className="font-mono text-slate-900">{selectedSurvey.id}</strong></div>
                  <div className="fpc-kv-item"><small>Operational Season</small><strong>{selectedSurvey.season}</strong></div>
                  <div className="fpc-kv-item"><small>Target Respondent Cohort</small><strong>{selectedSurvey.targetGroup}</strong></div>
                  <div className="fpc-kv-item"><small>Lead Enumerator / Facilitator</small><strong>{selectedSurvey.leadInvestigator}</strong></div>
                  <div className="fpc-kv-item"><small>Survey Commencement Date</small><strong>{selectedSurvey.startDate}</strong></div>
                  <div className="fpc-kv-item"><small>Statutory Submission Deadline</small><strong>{selectedSurvey.dueDate}</strong></div>
                </div>
              </div>

              {/* Sample Progress */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-950 uppercase">Sampling &amp; Completion Status</span>
                  <span className="text-xs font-extrabold text-emerald-800">{selectedSurvey.responsesReceived} / {selectedSurvey.targetSample} Responses ({selectedSurvey.completionRate}%)</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-700 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, selectedSurvey.completionRate)}%` }} />
                </div>
              </div>

              {/* Verified Respondent Records */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Verified Respondent Records ({fpcSurveyResponses.filter((r: any) => r.surveyId === selectedSurvey.id).length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Sample verified by enumerator</span>
                </div>

                <div className="space-y-2">
                  {fpcSurveyResponses
                    .filter((r: any) => r.surveyId === selectedSurvey.id)
                    .map((resp: any) => (
                      <div key={resp.id} className="p-3 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-xs text-slate-900 font-bold">{resp.respondentName} ({resp.respondentId})</strong>
                          <span className="text-[11px] text-slate-500">{resp.submissionDate}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mb-1.5">
                          📍 {resp.respondentVillage} · Enumerator: {resp.enumeratorName}
                        </div>
                        <p className="text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-150 mb-1">
                          "{resp.keyFindings}"
                        </p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ {resp.verificationStatus}
                        </span>
                      </div>
                    ))}
                  {fpcSurveyResponses.filter((r: any) => r.surveyId === selectedSurvey.id).length === 0 && (
                    <div className="p-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500">
                      No individual response records uploaded yet for this survey.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Audited under TSF Monitoring &amp; Evaluation Framework</span>
              <button type="button" className="em-btn" onClick={() => setSelectedSurvey(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}

{/* Compliance Filing Drawer */}
      {selectedCompliance && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedCompliance(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{fpcName} • STATUTORY ROC FILING</span>
                <h3>Form {selectedCompliance.form}</h3>
              </div>
              <button type="button" className="em-btn compact" onClick={() => setSelectedCompliance(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="fpc-drawer-body">
              <div className="flex items-center gap-2">
                <span className={`fpc-chip ${selectedCompliance.status === "Filed" || selectedCompliance.status === "Compliant" ? "active" : "pending"}`}>
                  ● {selectedCompliance.status}
                </span>
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Read-Only Inspection</span>
              </div>
              <div className="fpc-detail-card">
                <div className="fpc-detail-card-title"><ShieldCheck size={15} /> MCA Regulatory Filing Details</div>
                <div className="fpc-kv-grid">
                  <div className="fpc-kv-item"><small>Form Code</small><strong className="font-mono font-bold text-base">{selectedCompliance.form}</strong></div>
                  <div className="fpc-kv-item"><small>Compliance Status</small><strong className="text-emerald-700">{selectedCompliance.status}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}><small>Statutory Purpose</small><span>{selectedCompliance.desc}</span></div>
                  <div className="fpc-kv-item"><small>Statutory Due Date</small><strong>{selectedCompliance.due}</strong></div>
                  <div className="fpc-kv-item"><small>Actual Filing Date</small><strong>{selectedCompliance.filed}</strong></div>
                  <div className="fpc-kv-item" style={{ gridColumn: "span 2" }}>
                    <small>MCA Service Request Number (SRN)</small>
                    <strong className="font-mono text-emerald-800 text-sm">{selectedCompliance.srn}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="fpc-drawer-foot">
              <span className="text-xs text-slate-500">Statutory acknowledgement recorded with RoC Cuttack</span>
              <button type="button" className="em-btn" onClick={() => setSelectedCompliance(null)}>Close</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
