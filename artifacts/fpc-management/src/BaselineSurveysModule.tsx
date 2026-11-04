import React, { useState, useMemo, useEffect } from "react";
import {
  ClipboardCheck, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle,
  Clock, Plus, Download, Search, Filter, Eye, Check, X,
  FileSpreadsheet, Printer, ArrowLeft, ArrowRight, ShieldCheck,
  Building2, Users, MapPin, Calendar, RefreshCw, AlertCircle, Edit3,
  HelpCircle, Trash2, ChevronRight, Layers, FileText, Droplets, Sprout,
  Trees, Milk, Mountain, BarChart3, PieChart as PieIcon, Activity, Compass
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend, CartesianGrid
} from "recharts";
import * as XLSX from "xlsx";
import type { Role } from "@/lib/config";
import {
  type RecordRow, type State, money,
  type FpcBaselineAssessment, type FpcBaselineIndicator,
  type FpcSurvey, type FpcSurveyResponse,
  type FarmerCropRecord, type FarmerLivestockRecord
} from "@/lib/store";
import RegistrationSuccessModal from "./RegistrationSuccessModal";
import { isDemoMode } from "@/lib/moduleConfig";
import "./baseline-surveys.css";

interface Props {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  role: Role;
  screen?: string;
  fpcId?: string;
  setToast: (msg: string) => void;
  go?: (dest: string) => void;
}

export default function BaselineSurveysModule({
  state,
  setState,
  role,
  screen,
  fpcId: initialFpcId,
  setToast,
  go
}: Props) {
  const isTsf = role === "TSF Central Admin";
  const isFpcAdmin = role === "FPC Admin / Manager" || role?.includes("FPC Admin") || role === "Field Staff";
  const canConductSurvey = !isTsf && isFpcAdmin;

  // All FPCs
  const allFpcs: RecordRow[] = useMemo(() => state.records?.fpcs || [], [state.records?.fpcs]);

  // Logged-in user's assigned FPC ID (defaults to initialFpcId if provided, or matching user record, or "FPC-ODI-001")
  const userFpcId = useMemo(() => {
    if (initialFpcId && initialFpcId !== "ALL") return initialFpcId;
    const userRecord = (state.records?.users || []).find(
      (u: any) => u.role === role || u.name === state.memberId
    );
    return userRecord?.fpcId || "FPC-ODI-001";
  }, [initialFpcId, state.records?.users, role, state.memberId]);

  // Selected FPC Scope (defaults to initialFpcId, or userFpcId for FPC Admin, or "ALL" for TSF)
  const [selectedFpcId, setSelectedFpcId] = useState<string>(
    initialFpcId || (isTsf ? "ALL" : userFpcId)
  );

  useEffect(() => {
    if (initialFpcId) {
      setSelectedFpcId(initialFpcId);
    }
  }, [initialFpcId]);

  // Current selected FPC object
  const currentFpc = useMemo(() => {
    if (selectedFpcId === "ALL") return null;
    return allFpcs.find(f => f.id === selectedFpcId) || allFpcs[0] || null;
  }, [allFpcs, selectedFpcId]);

  // Active Main Tab: "baseline" | "surveys"
  const [activeTab, setActiveTab] = useState<"overview" | "baseline" | "surveys">("overview");

  // Assessments & Surveys from state
  const assessments: FpcBaselineAssessment[] = useMemo(
    () => (state.records?.baselineAssessments as unknown as FpcBaselineAssessment[]) || [],
    [state.records?.baselineAssessments]
  );

  const surveys: FpcSurvey[] = useMemo(
    () => (state.records?.surveys as unknown as FpcSurvey[]) || [],
    [state.records?.surveys]
  );

  const surveyResponses: FpcSurveyResponse[] = useMemo(
    () => (state.records?.surveyResponses as unknown as FpcSurveyResponse[]) || [],
    [state.records?.surveyResponses]
  );

  // Filtered baseline assessment for current FPC
  const currentBaseline = useMemo(() => {
    const fpcTarget = selectedFpcId === "ALL" ? "FPC-ODI-001" : selectedFpcId;
    return assessments.find(b => b.fpcId === fpcTarget) || assessments[0] || null;
  }, [assessments, selectedFpcId]);

  // Filtered Surveys based on FPC Scope
  const filteredSurveys = useMemo(() => {
    if (selectedFpcId === "ALL") return surveys;
    return surveys.filter(s => s.fpcId === selectedFpcId);
  }, [surveys, selectedFpcId]);

  // Filtered Responses based on FPC Scope
  const filteredResponses = useMemo(() => {
    if (selectedFpcId === "ALL") return surveyResponses;
    return surveyResponses.filter(r => r.fpcId === selectedFpcId);
  }, [surveyResponses, selectedFpcId]);

  // Surveys Tab Filters
  const [surveyStatusFilter, setSurveyStatusFilter] = useState<string>("ALL");
  const [surveyCategoryFilter, setSurveyCategoryFilter] = useState<string>("ALL");
  const [surveySearchQuery, setSurveySearchQuery] = useState<string>("");

  const displayedSurveys = useMemo(() => {
    return filteredSurveys.filter(s => {
      const matchStatus = surveyStatusFilter === "ALL" || s.status === surveyStatusFilter;
      const matchCat = surveyCategoryFilter === "ALL" || s.category === surveyCategoryFilter;
      const matchQuery =
        !surveySearchQuery.trim() ||
        `${s.title} ${s.id} ${s.leadInvestigator || ""} ${s.fpcName || ""}`
          .toLowerCase()
          .includes(surveySearchQuery.toLowerCase());
      return matchStatus && matchCat && matchQuery;
    });
  }, [filteredSurveys, surveyStatusFilter, surveyCategoryFilter, surveySearchQuery]);

  // Selected Survey for Response Ledger inspection
  const [selectedSurveyForLedger, setSelectedSurveyForLedger] = useState<FpcSurvey | null>(null);

  // Selected Response for Full 28-field Drawer Inspection
  const [selectedResponseForView, setSelectedResponseForView] = useState<FpcSurveyResponse | null>(null);

  // Indicator Editing Modal
  const [editingIndicator, setEditingIndicator] = useState<FpcBaselineIndicator | null>(null);
  const [newActualValue, setNewActualValue] = useState<string>("");
  const [editRemarks, setEditRemarks] = useState<string>("");

  // Farmer Baseline Survey Form Modal (All 28 Fields)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formSurveyId, setFormSurveyId] = useState<string>("SRV-2026-000");
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    record: FpcSurveyResponse;
  } | null>(null);

  // Form State initialized with defaults
  const [formData, setFormData] = useState<FpcSurveyResponse>({
    id: "",
    surveyId: "SRV-2026-000",
    fpcId: selectedFpcId === "ALL" ? "FPC-ODI-001" : selectedFpcId,
    slNo: 1,
    state: "Jharkhand",
    district: "Seraikela Kharsawan",
    unit: "Jamshedpur",
    block: "Seraikela",
    gp: "Mohitpur",
    village: "Panarol",
    shareIssueDate: new Date().toISOString().slice(0, 10),
    category: "ST",
    gender: "Male",
    farmerName: "",
    mobileNo: "",
    typeOfFarmer: "Small",
    totalLandAcre: 0,
    irrigatedAcre: 0,
    nonIrrigatedAcre: 0,
    sourceOfIrrigation: ["Well"],
    crops: [
      { id: "crp-1", season: "Kharif", cropName: "Paddy (Swarna)", areaAcre: 1.0, expectedProductionQtl: 18 }
    ],
    livestock: [
      { id: "lst-1", livestockName: "Cow", number: 2, purpose: "Mixed purpose" }
    ],
    plantation: "No",
    plantationAreaAcre: 0,
    pond: "No",
    pondSize: "—",
    fishFarming: "No",
    allied: "Backyard poultry, vermicompost",
    alliedActivities: ["Poultry", "Vermicompost"],
    agroforestry: "Mango and neem",
    ntfp: "Sal leaf collection",
    ntfpActivities: ["Sal Leaf"],
    dairy: "1 cow · 4 litres/day",
    dairyDailyLiters: 4,
    verificationStatus: "Submitted",
    submissionDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    enumeratorName: role === "TSF Central Admin" ? "TSF Field M&E Lead" : "FPC Field Mobilizer",
    isSampleData: false
  });

  // Reports and Exports Dialog
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [selectedReportType, setSelectedReportType] = useState<string>("Farmer Baseline Survey Report (28 Fields)");

  // -------------------------------------------------------------
  // OPEN SURVEY FORM (NEW OR FOR A GIVEN SURVEY)
  // -------------------------------------------------------------
  const handleOpenNewSurveyForm = (surveyId?: string) => {
    // Role check: Strictly forbidden for TSF Central Admin (Read-Only)
    if (isTsf) {
      setToast("Access Restricted: TSF Central Admin has read-only monitoring access. Surveys can only be conducted by FPC Admins.");
      return;
    }

    const targetSurvId = surveyId || (surveys[0]?.id || "SRV-2026-000");
    // FPC Admin is strictly bound to their own assigned FPC (userFpcId)
    const targetFpcId = !isTsf ? userFpcId : (selectedFpcId === "ALL" ? "FPC-ODI-001" : selectedFpcId);
    const nextSl = filteredResponses.length + 1;

    setFormSurveyId(targetSurvId);
    setFormData({
      id: `RSP-${Date.now().toString().slice(-4)}`,
      surveyId: targetSurvId,
      fpcId: targetFpcId,
      farmerId: "",
      respondentId: "",
      slNo: nextSl,
      state: targetFpcId.includes("JHK") ? "Jharkhand" : "Odisha",
      district: targetFpcId.includes("JHK") ? "Seraikela Kharsawan" : "Keonjhar",
      unit: targetFpcId.includes("JHK") ? "Jamshedpur" : "Keonjhar Cluster",
      block: targetFpcId.includes("JHK") ? "Seraikela" : "Keonjhar Sadar",
      gp: targetFpcId.includes("JHK") ? "Mohitpur" : "Dimbo",
      village: targetFpcId.includes("JHK") ? "Panarol" : "Green Valley",
      shareIssueDate: new Date().toISOString().slice(0, 10),
      category: "ST",
      gender: "Male",
      farmerName: "",
      mobileNo: "",
      typeOfFarmer: "Small",
      totalLandAcre: 2.0,
      irrigatedAcre: 1.0,
      nonIrrigatedAcre: 1.0,
      sourceOfIrrigation: ["Well"],
      crops: [
        { id: `c-${Date.now()}-1`, season: "Kharif", cropName: "Paddy", areaAcre: 1.5, expectedProductionQtl: 25 }
      ],
      livestock: [
        { id: `l-${Date.now()}-1`, livestockName: "Cow", number: 2, purpose: "Self" }
      ],
      plantation: "No",
      plantationAreaAcre: 0,
      pond: "No",
      pondSize: "—",
      fishFarming: "No",
      allied: targetFpcId.includes("ODI-005") ? "Cold-press oil extraction, poultry" : "Backyard poultry, vermicompost",
      alliedActivities: targetFpcId.includes("ODI-005") ? ["Poultry"] : ["Poultry", "Vermicompost"],
      agroforestry: targetFpcId.includes("ODI-005") ? "Mango (4), neem (5)" : "Mango and neem",
      ntfp: targetFpcId.includes("ODI-005") ? "Sal leaf collection" : "Sal leaves and mahua flowers",
      ntfpActivities: targetFpcId.includes("ODI-005") ? ["Sal Leaf"] : ["Sal Leaf", "Mahua"],
      dairy: targetFpcId.includes("ODI-005") ? "2 cows · 6 litres/day" : "1 cow · 4 litres/day",
      dairyDailyLiters: targetFpcId.includes("ODI-005") ? 6 : 4,
      verificationStatus: "Submitted",
      submissionDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      enumeratorName: "FPC Field Mobilizer",
      isSampleData: false
    });
    setIsFormOpen(true);
  };

  // -------------------------------------------------------------
  // ONE-CLICK DEMO LOADER (KRISHNA MUNDA - JHARKHAND SPREADSHEET)
  // -------------------------------------------------------------
  const handleLoadDemoRecord = () => {
    setFormData({
      id: `RSP-DEMO-${Date.now().toString().slice(-4)}`,
      surveyId: formSurveyId || "SRV-2026-000",
      fpcId: selectedFpcId === "ALL" ? "FPC-ODI-001" : selectedFpcId,
      slNo: 1,
      farmerId: "F-DEMO-01",
      respondentId: "F-DEMO-01",
      state: "Jharkhand",
      district: "Seraikela Kharsawan",
      unit: "Jamshedpur",
      block: "Seraikela",
      gp: "Mohitpur",
      village: "Panarol",
      shareIssueDate: "2023-04-18",
      category: "ST",
      gender: "Male",
      farmerName: "Krishna Munda",
      mobileNo: "9876543210",
      typeOfFarmer: "Small",
      totalLandAcre: 3.0,
      irrigatedAcre: 1.0,
      nonIrrigatedAcre: 2.0,
      sourceOfIrrigation: ["Pond", "Well", "Boring", "River", "Nala", "Other"],
      crops: [
        { id: "crp-k1", season: "Kharif", cropName: "Paddy", areaAcre: 1.5, expectedProductionQtl: 28 },
        { id: "crp-k2", season: "Rabi", cropName: "Wheat", areaAcre: 1.0, expectedProductionQtl: 14 },
        { id: "crp-k3", season: "Rabi", cropName: "Mustard", areaAcre: 0.5, expectedProductionQtl: 5 }
      ],
      livestock: [
        { id: "lst-k1", livestockName: "Cow", number: 2, purpose: "Self" },
        { id: "lst-k2", livestockName: "Goat", number: 4, purpose: "Sale" },
        { id: "lst-k3", livestockName: "Hen", number: 10, purpose: "Self" }
      ],
      plantation: "Yes",
      plantationAreaAcre: 0.5,
      pond: "Yes",
      pondSize: "0.2 Acre",
      fishFarming: "Yes",
      allied: "Backyard poultry, vermicompost",
      alliedActivities: ["Poultry", "Vermicompost"],
      agroforestry: "Mango (4), neem (6), bamboo (12 clumps)",
      ntfp: "Sal leaves and mahua flowers",
      ntfpActivities: ["Sal Leaf", "Mahua"],
      dairy: "1 cow · 4 litres/day",
      dairyDailyLiters: 4,
      respondentName: "Krishna Munda",
      respondentVillage: "Panarol",
      submissionDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      keyFindings: "Small tribal farmer with 3.0 acres. Multi-season crop rotation (Paddy, Wheat, Mustard), livestock husbandry, and freshwater pond aquaculture. Illustrative demonstration record based on actual field baseline Excel format.",
      enumeratorName: "Arun Hansda (Field Surveyor)",
      verificationStatus: "Verified",
      verifiedBy: "TSF State M&E Lead",
      verifiedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      isSampleData: true
    });
    setToast("Loaded illustrative demonstration record for Krishna Munda (Jharkhand Excel Format).");
  };

  // -------------------------------------------------------------
  // SELECT REGISTERED FARMER (AUTO-FETCH IDENTITY & LANDHOLDING)
  // -------------------------------------------------------------
  const registeredFarmers = useMemo(() => {
    const list = [...(state.records?.farmers || []), ...(state.records?.farmerApplications || [])];
    if (selectedFpcId === "ALL") return list;
    const fpcSpecific = list.filter((f: any) => !f.fpcId || f.fpcId === selectedFpcId);
    return fpcSpecific.length > 0 ? fpcSpecific : list;
  }, [state.records?.farmers, state.records?.farmerApplications, selectedFpcId]);

  const handleFarmerIdSelect = (farmerId: string) => {
    if (!farmerId) {
      setFormData(prev => ({
        ...prev,
        farmerId: "",
        respondentId: "",
        farmerName: "",
        mobileNo: "",
        respondentName: ""
      }));
      return;
    }

    const allFarmers = [...(state.records?.farmers || []), ...(state.records?.farmerApplications || [])];
    const f = allFarmers.find(rf => rf.id === farmerId || rf.farmerId === farmerId);
    if (!f) return;

    const land = Number(f.landArea) || Number(String(f.land || "").replace(/[^\d.]/g, "")) || 2.5;
    const irrigated = Number(f.irrigatedLand) || Number((land * 0.6).toFixed(1));
    const nonIrr = Math.max(0, Number((land - irrigated).toFixed(1)));

    const cropsList: FarmerCropRecord[] = (Array.isArray(f.crops) && f.crops.length > 0)
      ? f.crops.map((c: any, i: number) => ({
          id: c.id || `c-pre-${i}`,
          season: c.season === "Rabi" ? "Rabi" : "Kharif",
          cropName: c.cropName || c.crop || "Paddy",
          areaAcre: Number(c.areaAcre) || Number(f.cropArea) || 1.0,
          expectedProductionQtl: Number(c.expectedProductionQtl) || 15
        }))
      : [{
          id: `c-pre-0`,
          season: f.season === "Rabi" ? "Rabi" : "Kharif",
          cropName: String(f.crop || "Paddy").split(",")[0].trim() || "Paddy",
          areaAcre: Number(f.cropArea) || Math.min(land, 1.8),
          expectedProductionQtl: 18
        }];

    setFormData(prev => ({
      ...prev,
      farmerId: f.id,
      respondentId: f.id,
      farmerName: f.name || f.farmerName || "",
      mobileNo: f.mobile || f.phone || "",
      village: f.village || prev.village,
      block: f.block || prev.block,
      district: f.district || prev.district,
      state: f.state || prev.state,
      gp: f.panchayat || f.gp || prev.gp,
      category: (f.category as any) || prev.category,
      gender: (f.gender as any) || prev.gender,
      totalLandAcre: land,
      irrigatedAcre: irrigated,
      nonIrrigatedAcre: nonIrr,
      typeOfFarmer: land < 2.5 ? "Marginal" : land <= 5.0 ? "Small" : "Big",
      crops: cropsList,
      livestock: f.livestock && f.livestock !== "—" ? [
        { id: `lst-pre-1`, livestockName: "Cow", number: 2, purpose: "Self" }
      ] : prev.livestock,
      allied: f.allied || prev.allied,
      agroforestry: f.agroforestry || prev.agroforestry,
      plantation: (f.agroforestry && f.agroforestry !== "—") ? "Yes" : prev.plantation,
      plantationAreaAcre: Number(f.plantationAreaAcre) || (f.agroforestry ? 0.4 : 0),
      ntfp: f.ntfp || prev.ntfp,
      dairy: f.dairy || prev.dairy,
      dairyDailyLiters: Number(f.dairyDailyLiters) || (f.dairy ? parseInt(f.dairy.replace(/[^\d]/g, "")) || 0 : 0),
      respondentName: f.name || f.farmerName,
      respondentVillage: f.village || prev.village
    }));
    setToast(`Linked ${f.name} (${f.id}) — Name and mobile fetched automatically.`);
  };

  const handlePrefillFromFarmer = handleFarmerIdSelect;

  // -------------------------------------------------------------
  // FORM SAVE / SUBMIT / DRAFT
  // -------------------------------------------------------------
  const handleSaveForm = async (asDraft = false) => {
    // 1. Role enforcement: Strictly forbidden for TSF Central Admin
    if (!isDemoMode()) {
      if (isTsf) {
        setToast("Access Restricted: TSF Central Admin has read-only access and cannot submit field surveys.");
        return;
      }

      const selectedFarmerId = formData.farmerId || formData.respondentId;
      if (!selectedFarmerId) {
        setToast("Farmer ID is required. Please select a registered farmer.");
        return;
      }

      if (!formData.farmerName?.trim()) {
        setToast("Farmer Name could not be loaded. Please choose a valid registered farmer.");
        return;
      }

      const totalLand = formData.totalLandAcre ?? 0;
      const irrLand = formData.irrigatedAcre ?? 0;
      const nonIrrLand = formData.nonIrrigatedAcre ?? 0;

      if (totalLand < 0 || irrLand < 0 || nonIrrLand < 0) {
        setToast("Landholding values must be non-negative.");
        return;
      }

      if (irrLand + nonIrrLand > totalLand) {
        setToast("Warning: Irrigated + Non-irrigated land cannot exceed Total Land.");
        return;
      }

      if (!formData.crops || formData.crops.length === 0) {
        setToast("Please add at least one crop record.");
        return;
      }

      for (const c of formData.crops) {
        if (!c.cropName?.trim()) {
          setToast("Please specify a valid crop name for each crop row.");
          return;
        }
        if (c.areaAcre <= 0) {
          setToast(`Please specify a positive cultivated area for crop ${c.cropName}.`);
          return;
        }
      }

      if ((formData.plantation === "Yes" || formData.plantation === true) && (formData.plantationAreaAcre ?? 0) <= 0) {
        setToast("Please enter a valid Plantation Area in acres.");
        return;
      }
    }

    const selectedFarmerId = formData.farmerId || formData.respondentId || (isDemoMode() ? "F-001" : "");
    const selectedFarmerName = formData.farmerName?.trim() || (isDemoMode() ? "Mohan Munda" : "");

    // Auto-associate new survey strictly with logged-in user's assigned FPC
    const enforcedFpcId = !isTsf ? userFpcId : formData.fpcId;

    const newRec: FpcSurveyResponse = {
      ...formData,
      farmerId: selectedFarmerId,
      respondentId: selectedFarmerId,
      fpcId: enforcedFpcId,
      id: formData.id || `RSP-${Date.now().toString().slice(-4)}`,
      verificationStatus: asDraft ? "Draft" : "Submitted",
      submissionDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      respondentName: selectedFarmerName,
      respondentVillage: formData.village || "Sanapatna"
    };

    // 2. Backend API authorization sync (/api/surveys/responses)
    try {
      const apiRes = await fetch("/api/surveys/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": role,
          "x-user-fpc-id": userFpcId
        },
        body: JSON.stringify({
          ...newRec,
          role,
          assignedFpcId: userFpcId
        })
      });

      if (!apiRes.ok) {
        const errorData = await apiRes.json().catch(() => ({}));
        if (apiRes.status === 403) {
          setToast(`Submission Rejected (403): ${errorData.message || "Unauthorized to submit field survey."}`);
          return;
        }
      }
    } catch {
      // Offline / client mock tolerance
    }

    // Update state.records.surveyResponses
    const existingIndex = surveyResponses.findIndex(r => r.id === newRec.id);
    let updatedResponses = [...surveyResponses];
    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = newRec;
    } else {
      updatedResponses = [newRec, ...updatedResponses];
    }

    // Update parent survey response count and completion rate
    const updatedSurveys = surveys.map(srv => {
      if (srv.id === newRec.surveyId) {
        const matchingResponses = updatedResponses.filter(r => r.surveyId === srv.id && r.verificationStatus !== "Draft");
        const count = matchingResponses.length;
        const rate = srv.targetSample > 0 ? Number(((count / srv.targetSample) * 100).toFixed(1)) : 0;
        return {
          ...srv,
          responsesReceived: count,
          completionRate: rate
        };
      }
      return srv;
    });

    // Also update state.records.farmers to link baselineSurveyId
    const updatedFarmers = (state.records?.farmers || []).map(f => {
      if (f.id === selectedFarmerId || f.farmerId === selectedFarmerId) {
        return {
          ...f,
          baselineSurveyId: newRec.id,
          baselineCompleted: true,
          landArea: newRec.totalLandAcre ?? f.landArea,
          land: newRec.totalLandAcre ? `${newRec.totalLandAcre} acres` : f.land,
          irrigatedLand: newRec.irrigatedAcre ?? f.irrigatedLand,
          crops: newRec.crops || f.crops
        };
      }
      return f;
    });

    setState(prev => ({
      ...prev,
      records: {
        ...prev.records,
        surveyResponses: updatedResponses as any,
        surveys: updatedSurveys as any,
        farmers: updatedFarmers as any
      }
    }));

    const isEditMode = existingIndex >= 0;
    setIsFormOpen(false);
    setToast(asDraft ? "Survey saved as Draft successfully." : (isEditMode ? "Field survey response updated successfully." : "Farmer baseline survey submitted successfully."));
    setSuccessModal({
      isOpen: true,
      isEdit: isEditMode,
      record: newRec
    });
  };

  // -------------------------------------------------------------
  // VERIFY / APPROVE / RETURN RESPONSE WORKFLOW
  // -------------------------------------------------------------
  const handleUpdateResponseStatus = (
    responseId: string,
    newStatus: "Verified" | "Approved" | "Returned",
    remarks?: string
  ) => {
    const updated = surveyResponses.map(r => {
      if (r.id === responseId) {
        return {
          ...r,
          verificationStatus: newStatus,
          verifiedBy: role === "TSF Central Admin" ? "TSF Central Lead M&E" : "FPC Manager",
          verifiedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          approvalRemarks: remarks || r.approvalRemarks || `Status updated to ${newStatus}`
        };
      }
      return r;
    });

    setState(prev => ({
      ...prev,
      records: {
        ...prev.records,
        surveyResponses: updated as any
      }
    }));

    if (selectedResponseForView && selectedResponseForView.id === responseId) {
      setSelectedResponseForView(prev => prev ? {
        ...prev,
        verificationStatus: newStatus,
        verifiedBy: role === "TSF Central Admin" ? "TSF Central Lead M&E" : "FPC Manager",
        verifiedAt: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        approvalRemarks: remarks || prev.approvalRemarks || `Status updated to ${newStatus}`
      } : null);
    }

    setToast(`Survey submission ${responseId} marked as ${newStatus}.`);
  };

  // -------------------------------------------------------------
  // UPDATE INDICATOR ACTUAL VALUE
  // -------------------------------------------------------------
  const handleSaveIndicatorActual = () => {
    if (!editingIndicator || !currentBaseline) return;
    const num = parseFloat(newActualValue);
    if (isNaN(num)) {
      setToast("Enter a valid numeric actual value.");
      return;
    }

    const baselineVal = editingIndicator.baselineValue;
    const diff = num - baselineVal;
    const pct = baselineVal > 0 ? Number(((diff / baselineVal) * 100).toFixed(1)) : 0;
    const newStatus: "Achieved" | "On Track" | "Needs Attention" =
      diff < 0 ? "Needs Attention" : pct >= 100 ? "Achieved" : "On Track";

    const updatedIndicators = currentBaseline.indicators.map(ind => {
      if (ind.id === editingIndicator.id) {
        return {
          ...ind,
          currentValue: num,
          changePercent: pct,
          status: newStatus,
          lastUpdated: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          remarks: editRemarks || ind.remarks
        };
      }
      return ind;
    });

    const updatedAssessments = assessments.map(b => {
      if (b.id === currentBaseline.id) {
        return {
          ...b,
          indicators: updatedIndicators,
          auditHistory: [
            {
              date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
              action: `Updated actual value of ${editingIndicator.name} to ${num} ${editingIndicator.unit}`,
              user: role,
              notes: editRemarks || "Routine M&E progress update"
            },
            ...(b.auditHistory || [])
          ]
        };
      }
      return b;
    });

    setState(prev => ({
      ...prev,
      records: {
        ...prev.records,
        baselineAssessments: updatedAssessments as any
      }
    }));

    setEditingIndicator(null);
    setToast(`Updated ${editingIndicator.name} current actual value.`);
  };

  // -------------------------------------------------------------
  // EXPORT EXCEL WITH EXACT 28 SPREADSHEET FIELDS
  // -------------------------------------------------------------
  const handleExport28FieldsExcel = (surveyIdFilter?: string) => {
    const recordsToExport = surveyIdFilter
      ? filteredResponses.filter(r => r.surveyId === surveyIdFilter)
      : filteredResponses;

    if (!recordsToExport.length) {
      setToast("No survey responses available to export.");
      return;
    }

    const exportRows = recordsToExport.map((r, idx) => {
      // Primary crop representation
      const crop1 = r.crops?.[0];
      const crop2 = r.crops?.[1];
      const crop3 = r.crops?.[2];
      const cropSummary = (r.crops || []).map(c => `${c.season}: ${c.cropName} (${c.areaAcre} Ac)`).join(" | ");

      // Primary livestock representation
      const livestockSummary = (r.livestock || []).map(l => `${l.livestockName} (${l.number} - ${l.purpose})`).join(" | ");

      return {
        "Sl No": r.slNo || idx + 1,
        "Farmer ID": r.farmerId || r.respondentId || "—",
        "State": r.state || "Odisha",
        "District": r.district || "Keonjhar",
        "Unit": r.unit || "Keonjhar Cluster",
        "Block": r.block || "Keonjhar Sadar",
        "GP": r.gp || "Dimbo",
        "Village": r.village || "Green Valley",
        "Share Issue Date": r.shareIssueDate || "2021-06-15",
        "Category": r.category || "General",
        "Gender": r.gender || "Male",
        "Farmer Name": r.farmerName || r.respondentName || "—",
        "Mobile No.": r.mobileNo || "—",
        "Type of Farmer": r.typeOfFarmer || "Small",
        "Total Land (Acre)": r.totalLandAcre ?? 0,
        "Irrigated": r.irrigatedAcre ?? 0,
        "Non-Irrigated": r.nonIrrigatedAcre ?? 0,
        "Source of Irrigation": (r.sourceOfIrrigation || []).join(", ") || "Well",
        "Season": crop1 ? crop1.season : "Kharif",
        "Crop Name": crop1 ? crop1.cropName : "Paddy",
        "Area (Acre)": crop1 ? crop1.areaAcre : (r.totalLandAcre || 0),
        "Livestock Name": r.livestock?.[0]?.livestockName || "None",
        "Number": r.livestock?.[0]?.number || 0,
        "Purpose": r.livestock?.[0]?.purpose || "—",
        "Plantation": r.plantation === "Yes" || r.plantation === true ? "Yes" : "No",
        "Area (Acre)_Plantation": r.plantationAreaAcre || 0,
        "Pond": r.pond === "Yes" || r.pond === true ? "Yes" : "No",
        "Size/Area": r.pondSize || "—",
        "Fish Farming": r.fishFarming === "Yes" || r.fishFarming === true ? "Yes" : "No",
        "Allied Activities": r.allied || "None",
        "Agroforestry Details": r.agroforestry || "None",
        "NTFP Collection": r.ntfp || "None",
        "Dairy Production": r.dairy || "None",
        "Daily Milk Liters": r.dairyDailyLiters || 0,
        // Additional M&E Auditing columns
        "Verification Status": r.verificationStatus,
        "Survey Code": r.surveyId,
        "Submission Date": r.submissionDate || "—",
        "Verified By": r.verifiedBy || "—",
        "Additional Crops Detail": cropSummary || "None",
        "All Livestock Detail": livestockSummary || "None",
        "Sample Data": r.isSampleData ? "Demo Sample Record" : "Field Survey Entry"
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farmer Baseline Survey");
    const filename = `Farmer_Baseline_Survey_28Fields_${selectedFpcId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    setToast(`Exported ${exportRows.length} farmer baseline records to Excel (28 Fields).`);
  };

  // -------------------------------------------------------------
  // REPEATABLE CROP AND LIVESTOCK FORM ROW ACTIONS
  // -------------------------------------------------------------
  const handleAddCropRow = () => {
    setFormData(prev => ({
      ...prev,
      crops: [
        ...(prev.crops || []),
        {
          id: `crp-${Date.now()}-${(prev.crops?.length || 0) + 1}`,
          season: "Rabi",
          cropName: "Wheat",
          areaAcre: 0.5,
          expectedProductionQtl: 8
        }
      ]
    }));
  };

  const handleRemoveCropRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      crops: (prev.crops || []).filter((_, i) => i !== index)
    }));
  };

  const handleCropRowChange = (index: number, field: keyof FarmerCropRecord, value: any) => {
    setFormData(prev => {
      const updated = [...(prev.crops || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, crops: updated };
    });
  };

  const handleAddLivestockRow = () => {
    setFormData(prev => ({
      ...prev,
      livestock: [
        ...(prev.livestock || []),
        {
          id: `lst-${Date.now()}-${(prev.livestock?.length || 0) + 1}`,
          livestockName: "Goat",
          number: 4,
          purpose: "Sale"
        }
      ]
    }));
  };

  const handleRemoveLivestockRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      livestock: (prev.livestock || []).filter((_, i) => i !== index)
    }));
  };

  const handleLivestockRowChange = (index: number, field: keyof FarmerLivestockRecord, value: any) => {
    setFormData(prev => {
      const updated = [...(prev.livestock || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, livestock: updated };
    });
  };

  const toggleIrrigationSource = (src: string) => {
    setFormData(prev => {
      const current = prev.sourceOfIrrigation || [];
      if (current.includes(src)) {
        return { ...prev, sourceOfIrrigation: current.filter(s => s !== src) };
      } else {
        return { ...prev, sourceOfIrrigation: [...current, src] };
      }
    });
  };


  // =========================================================
  // DEDUPLICATED FPC FARMER & AGRICULTURAL TELEMETRY POOL
  // =========================================================
  const regFarmersForFpc = useMemo(() => {
    const target = selectedFpcId;
    return (state.records?.farmers || []).filter(
      (f: any) => target === "ALL" || f.fpcId === target
    );
  }, [state.records?.farmers, selectedFpcId]);

  const fpcSurveys = useMemo(() => {
    const target = selectedFpcId;
    return surveys.filter(s => target === "ALL" || s.fpcId === target);
  }, [surveys, selectedFpcId]);

  const fpcSurveyResponses = useMemo(() => {
    const target = selectedFpcId;
    return surveyResponses.filter(r => target === "ALL" || r.fpcId === target);
  }, [surveyResponses, selectedFpcId]);

  // Unified deduplicated producer profile pool (U_fpc)
  const unifiedFarmers = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Ingest registered farmers
    regFarmersForFpc.forEach((f: any) => {
      const key = f.id || f.farmerId || f.mobile || f.name;
      const rawLand = Number(f.landArea) || Number(String(f.land || "").replace(/[^\d.]/g, "")) || 2.4;
      const rawCropArea = Number(f.cropArea) || Math.min(rawLand, 1.8);

      map.set(key, {
        id: f.id,
        name: f.name,
        mobile: f.mobile,
        village: f.village || "Green Valley",
        block: f.block || "Keonjhar Sadar",
        category: f.category || "General",
        gender: f.gender || "Male",
        landArea: rawLand,
        irrigatedAcre: Number(f.irrigatedLand) || Number((rawLand * 0.6).toFixed(1)),
        nonIrrigatedAcre: Number((rawLand * 0.4).toFixed(1)),
        crop: f.crop || "Paddy",
        season: f.season || "Kharif",
        cropArea: rawCropArea,
        crops: (Array.isArray(f.crops) && f.crops.length > 0) ? f.crops : [
          { id: `c-${f.id}`, cropName: f.crop || "Paddy", season: f.season || "Kharif", areaAcre: rawCropArea }
        ],
        livestock: f.livestock || "—",
        hasLivestock: Boolean(f.livestock && f.livestock !== "—" && f.livestock !== "None"),
        allied: f.allied || "—",
        hasAllied: Boolean(f.allied && f.allied !== "—" && f.allied !== "None"),
        agroforestry: f.agroforestry || "—",
        hasAgroforestry: Boolean(f.agroforestry && f.agroforestry !== "—" && f.agroforestry !== "None"),
        plantationAreaAcre: Number(f.plantationAreaAcre) || (f.agroforestry && f.agroforestry !== "—" ? 0.4 : 0),
        ntfp: f.ntfp || "—",
        hasNtfp: Boolean(f.ntfp && f.ntfp !== "—" && f.ntfp !== "None"),
        dairy: f.dairy || "—",
        hasDairy: Boolean(f.dairy && f.dairy !== "—" && f.dairy !== "None"),
        dairyDailyLiters: Number(f.dairyDailyLiters) || (f.dairy ? parseInt(f.dairy.replace(/[^\d]/g, "")) || 0 : 0),
        source: "Registry",
        hasSurvey: false
      });
    });

    // 2. Overlay / Merge verified survey responses (Strict deduplication!)
    fpcSurveyResponses.forEach((r: FpcSurveyResponse) => {
      const matchKey = r.respondentId || (r.mobileNo && Array.from(map.keys()).find(k => map.get(k)?.mobile === r.mobileNo));
      const key = matchKey || r.id;

      const existing = map.get(key);
      const verifiedLand = r.totalLandAcre ?? existing?.landArea ?? 2.5;
      const verifiedIrr = r.irrigatedAcre ?? existing?.irrigatedAcre ?? Number((verifiedLand * 0.6).toFixed(1));
      const verifiedNonIrr = r.nonIrrigatedAcre ?? existing?.nonIrrigatedAcre ?? Math.max(0, verifiedLand - verifiedIrr);

      const cropList = (r.crops && r.crops.length > 0) ? r.crops : (existing?.crops || []);
      const totalCropAcres = cropList.reduce((acc: number, c: any) => acc + (Number(c.areaAcre) || 0), 0) || existing?.cropArea || 1.8;

      const hasLst = Boolean((r.livestock && r.livestock.length > 0) || (existing?.hasLivestock));
      const hasAllied = Boolean(r.allied || r.fishFarming === "Yes" || existing?.hasAllied);
      const hasAgro = Boolean(r.agroforestry || r.plantation === "Yes" || existing?.hasAgroforestry);
      const hasNtfp = Boolean(r.ntfp || existing?.hasNtfp);
      const hasDairy = Boolean(r.dairy || existing?.hasDairy);

      const dailyLtrs = r.dairyDailyLiters ?? (r.dairy ? parseInt(r.dairy.replace(/[^\d]/g, "")) || 0 : (existing?.dairyDailyLiters || 0));

      map.set(key, {
        id: existing?.id || r.id,
        name: r.farmerName || existing?.name || r.respondentName || "Surveyed Farmer",
        mobile: r.mobileNo || existing?.mobile || "—",
        village: r.village || existing?.village || "—",
        block: r.block || existing?.block || "—",
        category: r.category || existing?.category || "General",
        gender: r.gender || existing?.gender || "Male",
        landArea: verifiedLand,
        irrigatedAcre: verifiedIrr,
        nonIrrigatedAcre: verifiedNonIrr,
        crop: cropList.map((c: any) => c.cropName).join(", ") || existing?.crop || "Paddy",
        season: cropList[0]?.season || existing?.season || "Kharif",
        cropArea: totalCropAcres,
        crops: cropList,
        livestock: (r.livestock && r.livestock.length > 0) ? r.livestock.map(l => `${l.number} ${l.livestockName}`).join(", ") : (existing?.livestock || "—"),
        hasLivestock: hasLst,
        allied: r.allied || (r.fishFarming === "Yes" ? "Freshwater aquaculture" : (existing?.allied || "—")),
        hasAllied: hasAllied,
        agroforestry: r.agroforestry || (r.plantation === "Yes" ? `Plantation (${r.plantationAreaAcre || 0.4} Ac)` : (existing?.agroforestry || "—")),
        hasAgroforestry: hasAgro,
        plantationAreaAcre: r.plantationAreaAcre ?? existing?.plantationAreaAcre ?? 0,
        ntfp: r.ntfp || existing?.ntfp || "—",
        hasNtfp: hasNtfp,
        dairy: r.dairy || existing?.dairy || "—",
        hasDairy: hasDairy,
        dairyDailyLiters: dailyLtrs,
        source: existing ? "Registered & Surveyed" : "Surveyed",
        hasSurvey: true,
        surveyId: r.surveyId,
        responseId: r.id
      });
    });

    return Array.from(map.values());
  }, [regFarmersForFpc, fpcSurveyResponses]);

  // -------------------------------------------------------------
  // GROUP 1: FARMER & LAND STATISTICS (Cards 1-6)
  // -------------------------------------------------------------
  const stat1TotalRegisteredFarmers = regFarmersForFpc.length;
  const stat2TotalLandholding = Number(unifiedFarmers.reduce((acc, u) => acc + (u.landArea || 0), 0).toFixed(1));
  const stat3TotalCropArea = Number(unifiedFarmers.reduce((acc, u) => acc + (u.cropArea || 0), 0).toFixed(1));
  const stat4TotalIrrigatedLand = Number(unifiedFarmers.reduce((acc, u) => acc + (u.irrigatedAcre || 0), 0).toFixed(1));
  const stat5TotalNonIrrigatedLand = Number(unifiedFarmers.reduce((acc, u) => acc + (u.nonIrrigatedAcre || 0), 0).toFixed(1));
  const stat6FarmersWithCropInfo = unifiedFarmers.filter(u => u.crops && u.crops.length > 0 && u.crop !== "—").length;

  // -------------------------------------------------------------
  // GROUP 2: AGRICULTURE & LIVELIHOOD STATISTICS (Cards 7-12)
  // -------------------------------------------------------------
  const cropAcreageMap: Record<string, { acres: number; farmers: number }> = {};
  unifiedFarmers.forEach(u => {
    (u.crops || []).forEach((c: any) => {
      const name = c.cropName?.trim() || "Paddy";
      if (!cropAcreageMap[name]) cropAcreageMap[name] = { acres: 0, farmers: 0 };
      cropAcreageMap[name].acres += Number(c.areaAcre) || 0;
      cropAcreageMap[name].farmers += 1;
    });
  });
  const sortedCrops = Object.entries(cropAcreageMap)
    .map(([name, data]) => ({ name, acres: Number(data.acres.toFixed(1)), farmers: data.farmers }))
    .sort((a, b) => b.acres - a.acres);

  const stat7PrimaryCropsSummary = sortedCrops.slice(0, 3).map(c => `${c.name} (${c.acres} Ac)`).join(", ") || "Paddy, Mustard";

  const stat8LivestockFarmers = unifiedFarmers.filter(u => u.hasLivestock).length;
  const stat8LivestockPct = unifiedFarmers.length > 0 ? Number(((stat8LivestockFarmers / unifiedFarmers.length) * 100).toFixed(1)) : 0;

  const stat9AlliedFarmers = unifiedFarmers.filter(u => u.hasAllied).length;
  const stat9AlliedPct = unifiedFarmers.length > 0 ? Number(((stat9AlliedFarmers / unifiedFarmers.length) * 100).toFixed(1)) : 0;

  const stat10AgroFarmers = unifiedFarmers.filter(u => u.hasAgroforestry).length;
  const stat10AgroAcres = Number(unifiedFarmers.reduce((acc, u) => acc + (u.plantationAreaAcre || 0), 0).toFixed(1));

  const stat11NtfpFarmers = unifiedFarmers.filter(u => u.hasNtfp).length;
  const stat11NtfpPct = unifiedFarmers.length > 0 ? Number(((stat11NtfpFarmers / unifiedFarmers.length) * 100).toFixed(1)) : 0;

  const stat12DairyFarmers = unifiedFarmers.filter(u => u.hasDairy).length;
  const stat12TotalDailyLiters = unifiedFarmers.reduce((acc, u) => acc + (u.dairyDailyLiters || 0), 0);

  // -------------------------------------------------------------
  // GROUP 3: SURVEY STATISTICS (Cards 13-18)
  // -------------------------------------------------------------
  const stat13TotalSurveys = fpcSurveys.length;
  const stat14ActiveSurveys = fpcSurveys.filter(s => s.status === "Active").length;
  const stat15CompletedSurveys = fpcSurveys.filter(s => s.status === "Completed" || s.status === "Closed").length;
  const stat16TotalResponses = fpcSurveys.reduce((acc, s) => acc + (Number(s.responsesReceived) || 0), 0);
  const totalTargetSample = fpcSurveys.reduce((acc, s) => acc + (Number(s.targetSample) || 0), 0);
  const stat17PendingResponses = Math.max(0, totalTargetSample - stat16TotalResponses);
  const stat18OverallCompletionRate = totalTargetSample > 0 ? Number(((stat16TotalResponses / totalTargetSample) * 100).toFixed(1)) : 0;

  // Chart 2: Landholding classification
  const landDistributionData = useMemo(() => {
    let marginal = 0, small = 0, medium = 0, large = 0;
    unifiedFarmers.forEach(u => {
      const l = u.landArea || 0;
      if (l < 2.5) marginal++;
      else if (l <= 5.0) small++;
      else if (l <= 10.0) medium++;
      else large++;
    });
    return [
      { name: "Marginal (<2.5 Ac)", count: marginal, color: "#059669" },
      { name: "Small (2.5–5 Ac)", count: small, color: "#0284c7" },
      { name: "Medium (5–10 Ac)", count: medium, color: "#f59e0b" },
      { name: "Large (>10 Ac)", count: large, color: "#9333ea" }
    ];
  }, [unifiedFarmers]);

  // Chart 3: Irrigation distribution
  const irrigationPieData = useMemo(() => [
    { name: "Irrigated", value: stat4TotalIrrigatedLand },
    { name: "Non-Irrigated", value: stat5TotalNonIrrigatedLand }
  ], [stat4TotalIrrigatedLand, stat5TotalNonIrrigatedLand]);

  // Chart 4: Livelihood adoption
  const livelihoodAdoptionData = useMemo(() => [
    { domain: "Livestock", pct: stat8LivestockPct, count: stat8LivestockFarmers },
    { domain: "Allied", pct: stat9AlliedPct, count: stat9AlliedFarmers },
    { domain: "Agroforestry", pct: unifiedFarmers.length > 0 ? Number(((stat10AgroFarmers / unifiedFarmers.length) * 100).toFixed(1)) : 0, count: stat10AgroFarmers },
    { domain: "NTFP", pct: stat11NtfpPct, count: stat11NtfpFarmers },
    { domain: "Dairy", pct: unifiedFarmers.length > 0 ? Number(((stat12DairyFarmers / unifiedFarmers.length) * 100).toFixed(1)) : 0, count: stat12DairyFarmers }
  ], [unifiedFarmers.length, stat8LivestockPct, stat8LivestockFarmers, stat9AlliedPct, stat9AlliedFarmers, stat10AgroFarmers, stat11NtfpPct, stat11NtfpFarmers, stat12DairyFarmers]);

  // Land calculation validation flag
  const isLandInconsistent = (formData.irrigatedAcre ?? 0) + (formData.nonIrrigatedAcre ?? 0) > (formData.totalLandAcre ?? 0);

  return (
    <div className="bsm-container" data-testid="baseline-surveys-module">
      {/* ========================================================= */}
      {/* 1. MODULE EXECUTIVE HEADER */}
      {/* ========================================================= */}
      <header className="bsm-header-bar">
        <div className="bsm-header-left">
          <div className="bsm-header-icon">
            <ClipboardCheck size={24} />
          </div>
          <div className="bsm-header-titles">
            <h1>
              Baseline Assessment, Field Surveys &amp; Impact Indicators
              {currentFpc && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  {currentFpc.name}
                </span>
              )}
            </h1>
            <p>
              Official onboarding reference benchmarks, longitudinal performance tracking, and rural field response ledger across partner FPCs in Odisha and Jharkhand.
            </p>
          </div>
        </div>

        <div className="bsm-header-actions">
          {/* FPC Scope Selector for TSF Central Admin */}
          {isTsf && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
              <Building2 size={14} className="text-slate-500" />
              <label htmlFor="bsm-fpc-scope-select" className="sr-only">Select FPC Portfolio Scope</label>
              <select
                id="bsm-fpc-scope-select"
                aria-label="Select FPC Portfolio Scope"
                value={selectedFpcId}
                onChange={(e) => setSelectedFpcId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">🌐 All 8 Partner FPCs (Consolidated)</option>
                {allFpcs.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.state})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Read-Only Access Pill for TSF Central Admin */}
          {isTsf && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold shadow-xs"
              title="TSF Central Admin has read-only monitoring access"
            >
              <ShieldCheck size={14} className="text-emerald-700" />
              <span>Read-Only Monitoring Access</span>
            </div>
          )}

          {/* Action 1: Conduct Field Baseline Survey (Restricted to FPC Admin Only; Hidden for TSF Central Admin) */}
          {canConductSurvey && (
            <button
              type="button"
              onClick={() => handleOpenNewSurveyForm()}
              className="bsm-btn primary"
              title="Launch comprehensive 28-field farmer baseline survey"
            >
              <Plus size={14} /> Conduct Field Survey
            </button>
          )}

          {/* Action 2: Export Reports (Available to both TSF Central Admin and FPC Admin) */}
          <button
            type="button"
            onClick={() => setIsReportsModalOpen(true)}
            className="bsm-btn secondary"
            title="Export baseline indicators and 28-field survey datasets"
          >
            <Download size={14} /> Export Reports
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. TAB SWITCHER (Image 1 and Image 2) */}
      {/* ========================================================= */}
      <nav className="bsm-tab-nav" aria-label="Baseline and Survey Navigation">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`bsm-tab-btn ${activeTab === "overview" ? "active" : ""}`}
        >
          <BarChart3 size={15} /> 1. Overall FPC Baseline Statistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("baseline")}
          className={`bsm-tab-btn ${activeTab === "baseline" ? "active" : ""}`}
        >
          <Layers size={15} /> 2. Strategic Baseline Growth Tracking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("surveys")}
          className={`bsm-tab-btn ${activeTab === "surveys" ? "active" : ""}`}
        >
          <FileText size={15} /> 3. Field Surveys &amp; Response Ledger
          <span className="bsm-badge-count">{filteredResponses.length}</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* TAB 1: OVERALL FPC BASELINE STATISTICS (18 Cards + Groups)*/}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <section className="bsm-stats-section" aria-label="Overall FPC Baseline Statistics">
          {currentFpc && (
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  Consolidated Agricultural &amp; Livelihood Baseline Statistics: <u>{currentFpc.name}</u>
                </span>
                <span className="text-[11px] bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
                  {currentFpc.location || `${currentFpc.district}, ${currentFpc.state}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-emerald-800 flex-wrap">
                <span>Deduplicated Producers: <strong>{unifiedFarmers.length}</strong></span>
                <span>•</span>
                <span>Verified Field Surveys: <strong>{fpcSurveyResponses.length}</strong></span>
              </div>
            </div>
          )}

          {/* GROUP 1: FARMER & LAND STATISTICS (Cards 1-6) */}
          <div className="bsm-stats-group">
            <div className="bsm-stats-group-header">
              <div className="bsm-stats-group-title">
                <Users size={16} className="text-emerald-700" />
                <span>Farmer &amp; Land Statistics</span>
              </div>
              <span className="bsm-stats-group-badge">Official Register &amp; Verified Farmland</span>
            </div>
            <div className="bsm-stats-grid">
              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">1. Total Reg. Farmers</span>
                  <div className="bsm-stat-card-icon emerald"><Users size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat1TotalRegisteredFarmers.toLocaleString()} <span className="bsm-stat-card-unit">Producers</span></div>
                  <div className="bsm-stat-card-detail">Active FPC Member Base</div>
                </div>
                <div className="bsm-stat-card-badge green">Official Register</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">2. Total Landholding</span>
                  <div className="bsm-stat-card-icon emerald"><Mountain size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat2TotalLandholding.toLocaleString()} <span className="bsm-stat-card-unit">Acres</span></div>
                  <div className="bsm-stat-card-detail">Avg {(stat2TotalLandholding / Math.max(1, unifiedFarmers.length)).toFixed(2)} Ac / Producer</div>
                </div>
                <div className="bsm-stat-card-badge green">Operational Area</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">3. Total Crop Area</span>
                  <div className="bsm-stat-card-icon amber"><Sprout size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat3TotalCropArea.toLocaleString()} <span className="bsm-stat-card-unit">Acres</span></div>
                  <div className="bsm-stat-card-detail">Intensity: {stat2TotalLandholding > 0 ? ((stat3TotalCropArea / stat2TotalLandholding) * 100).toFixed(0) : 0}%</div>
                </div>
                <div className="bsm-stat-card-badge amber">Kharif/Rabi/Jayad</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">4. Total Irrigated Land</span>
                  <div className="bsm-stat-card-icon blue"><Droplets size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat4TotalIrrigatedLand.toLocaleString()} <span className="bsm-stat-card-unit">Acres</span></div>
                  <div className="bsm-stat-card-detail">{stat2TotalLandholding > 0 ? ((stat4TotalIrrigatedLand / stat2TotalLandholding) * 100).toFixed(1) : 0}% Assured Water</div>
                </div>
                <div className="bsm-stat-card-badge blue">Borewell/Pond/River</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">5. Non-Irrigated Land</span>
                  <div className="bsm-stat-card-icon amber"><Compass size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat5TotalNonIrrigatedLand.toLocaleString()} <span className="bsm-stat-card-unit">Acres</span></div>
                  <div className="bsm-stat-card-detail">{stat2TotalLandholding > 0 ? ((stat5TotalNonIrrigatedLand / stat2TotalLandholding) * 100).toFixed(1) : 0}% Rainfed</div>
                </div>
                <div className="bsm-stat-card-badge amber">Monsoon Dependent</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">6. Farmers with Crops</span>
                  <div className="bsm-stat-card-icon emerald"><CheckCircle2 size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat6FarmersWithCropInfo.toLocaleString()} <span className="bsm-stat-card-unit">Producers</span></div>
                  <div className="bsm-stat-card-detail">{unifiedFarmers.length > 0 ? ((stat6FarmersWithCropInfo / unifiedFarmers.length) * 100).toFixed(1) : 0}% Profiled</div>
                </div>
                <div className="bsm-stat-card-badge green">Cropping Verified</div>
              </div>
            </div>
          </div>

          {/* GROUP 2: AGRICULTURE & LIVELIHOOD STATISTICS (Cards 7-12) */}
          <div className="bsm-stats-group">
            <div className="bsm-stats-group-header">
              <div className="bsm-stats-group-title">
                <Sprout size={16} className="text-emerald-700" />
                <span>Agriculture &amp; Livelihood Statistics</span>
              </div>
              <span className="bsm-stats-group-badge">Cropping, Livestock, Agroforestry, NTFP &amp; Dairy</span>
            </div>
            <div className="bsm-stats-grid">
              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">7. Primary Crops</span>
                  <div className="bsm-stat-card-icon amber"><Sprout size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val text-[1.05rem]" title={stat7PrimaryCropsSummary}>
                    {sortedCrops[0]?.name || "Paddy"} <span className="bsm-stat-card-unit">({sortedCrops[0]?.acres || 0} Ac)</span>
                  </div>
                  <div className="bsm-stat-card-detail">2nd: {sortedCrops[1] ? `${sortedCrops[1].name} (${sortedCrops[1].acres} Ac)` : "None"}</div>
                </div>
                <div className="bsm-stat-card-badge green">Top Commodities</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">8. Livestock Coverage</span>
                  <div className="bsm-stat-card-icon emerald"><Activity size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat8LivestockFarmers.toLocaleString()} <span className="bsm-stat-card-unit">Producers</span></div>
                  <div className="bsm-stat-card-detail">{stat8LivestockPct}% Adoption</div>
                </div>
                <div className="bsm-stat-card-badge green">Goat / Cattle / Poultry</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">9. Allied Activities</span>
                  <div className="bsm-stat-card-icon purple"><Layers size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat9AlliedFarmers.toLocaleString()} <span className="bsm-stat-card-unit">Producers</span></div>
                  <div className="bsm-stat-card-detail">{stat9AlliedPct}% Participation</div>
                </div>
                <div className="bsm-stat-card-badge blue">Aquaculture / Vermi</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">10. Agroforestry Area</span>
                  <div className="bsm-stat-card-icon emerald"><Trees size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat10AgroAcres} <span className="bsm-stat-card-unit">Acres</span></div>
                  <div className="bsm-stat-card-detail">{stat10AgroFarmers} Farmers Participating</div>
                </div>
                <div className="bsm-stat-card-badge green">Mango / Neem / Bamboo</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">11. NTFP Activities</span>
                  <div className="bsm-stat-card-icon amber"><Mountain size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat11NtfpFarmers.toLocaleString()} <span className="bsm-stat-card-unit">Producers</span></div>
                  <div className="bsm-stat-card-detail">{stat11NtfpPct}% Forest Collection</div>
                </div>
                <div className="bsm-stat-card-badge amber">Sal Leaf / Mahua / Lac</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">12. Dairy Activities</span>
                  <div className="bsm-stat-card-icon blue"><Milk size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat12TotalDailyLiters} <span className="bsm-stat-card-unit">L / Day</span></div>
                  <div className="bsm-stat-card-detail">{stat12DairyFarmers} Dairy Producers</div>
                </div>
                <div className="bsm-stat-card-badge blue">Milk Aggregation</div>
              </div>
            </div>
          </div>

          {/* GROUP 3: SURVEY STATISTICS (Cards 13-18) */}
          <div className="bsm-stats-group">
            <div className="bsm-stats-group-header">
              <div className="bsm-stats-group-title">
                <ClipboardCheck size={16} className="text-emerald-700" />
                <span>Survey Statistics</span>
              </div>
              <span className="bsm-stats-group-badge">Campaign Monitoring &amp; Telemetry Completion</span>
            </div>
            <div className="bsm-stats-grid">
              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">13. Total Surveys</span>
                  <div className="bsm-stat-card-icon emerald"><FileText size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat13TotalSurveys} <span className="bsm-stat-card-unit">Campaigns</span></div>
                  <div className="bsm-stat-card-detail">Baseline &amp; M&amp;E Rosters</div>
                </div>
                <div className="bsm-stat-card-badge green">Campaign Count</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">14. Active Surveys</span>
                  <div className="bsm-stat-card-icon blue"><Clock size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat14ActiveSurveys} <span className="bsm-stat-card-unit">Active</span></div>
                  <div className="bsm-stat-card-detail">Live Field Enumeration</div>
                </div>
                <div className="bsm-stat-card-badge blue">In Progress</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">15. Completed Surveys</span>
                  <div className="bsm-stat-card-icon emerald"><CheckCircle2 size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat15CompletedSurveys} <span className="bsm-stat-card-unit">Completed</span></div>
                  <div className="bsm-stat-card-detail">Audited &amp; Archived</div>
                </div>
                <div className="bsm-stat-card-badge green">Closed Cycles</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">16. Total Responses</span>
                  <div className="bsm-stat-card-icon emerald"><Users size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat16TotalResponses.toLocaleString()} <span className="bsm-stat-card-unit">Entries</span></div>
                  <div className="bsm-stat-card-detail">Target: {totalTargetSample.toLocaleString()} Sample</div>
                </div>
                <div className="bsm-stat-card-badge green">Submissions</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">17. Pending Responses</span>
                  <div className="bsm-stat-card-icon amber"><AlertCircle size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat17PendingResponses.toLocaleString()} <span className="bsm-stat-card-unit">Due</span></div>
                  <div className="bsm-stat-card-detail">Awaiting Field Input</div>
                </div>
                <div className="bsm-stat-card-badge amber">Gap To Target</div>
              </div>

              <div className="bsm-stat-card">
                <div className="bsm-stat-card-top">
                  <span className="bsm-stat-card-label">18. Overall Comp. Rate</span>
                  <div className="bsm-stat-card-icon emerald"><TrendingUp size={14} /></div>
                </div>
                <div>
                  <div className="bsm-stat-card-val">{stat18OverallCompletionRate}%</div>
                  <div className="bsm-stat-card-detail">Across all campaigns</div>
                </div>
                <div className="bsm-stat-card-badge green">Completion Index</div>
              </div>
            </div>
          </div>

          {/* VISUALIZATIONS SECTION */}
          <div className="bsm-charts-grid">
            <div className="bsm-chart-card">
              <div className="bsm-chart-header">
                <h4>Major Crops Cultivation Breakdown (Acres)</h4>
                <p>Top agricultural commodities ranked by consolidated acreage across surveyed producers</p>
              </div>
              <div className="bsm-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedCrops.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit=" Ac" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <RechartsTooltip formatter={(val: any) => [`${val} Acres`, "Acreage"]} />
                    <Bar dataKey="acres" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bsm-chart-card">
              <div className="bsm-chart-header">
                <h4>Operational Landholding Distribution</h4>
                <p>Farmer classification by land size (Marginal, Small, Medium, Large)</p>
              </div>
              <div className="bsm-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={landDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {landDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => [`${val} Farmers`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bsm-chart-card">
              <div className="bsm-chart-header">
                <h4>Irrigated vs. Non-Irrigated Land</h4>
                <p>Proportion of assured irrigation infrastructure vs. rainfed dryland</p>
              </div>
              <div className="bsm-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={irrigationPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }: any) => `${name}: ${value} Ac`}
                    >
                      <Cell fill="#0284c7" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => [`${val} Acres`, "Area"]} />
                    <RechartsLegend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bsm-chart-card">
              <div className="bsm-chart-header">
                <h4>Household Livelihood Diversification</h4>
                <p>Adoption percentage across allied sectors and rural enterprise domains</p>
              </div>
              <div className="bsm-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={livelihoodAdoptionData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(val: any) => [`${val}%`, "Adoption Rate"]} />
                    <Bar dataKey="pct" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Strip */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-700" />
              <div>
                <strong className="text-xs text-slate-900 block">Want to explore verified survey responses or track strategic indicators?</strong>
                <span className="text-[11px] text-slate-500">Switch tabs to drill down into the rural response ledger or inspect baseline trajectory indicators.</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("baseline")}
                className="bsm-btn compact secondary"
              >
                View Strategic Indicators →
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("surveys")}
                className="bsm-btn compact primary"
              >
                Open Survey Ledger ({fpcSurveyResponses.length}) →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BASELINE ASSESSMENT & GROWTH TRACKING */}
      {/* ========================================================= */}
      {activeTab === "baseline" && (
        <>
          {currentBaseline ? (
            <>
              {/* Section A: Official Baseline Assessment Metadata Banner (Image 2) */}
              <section className="bsm-signoff-card" aria-label="Official Onboarding Baseline Assessment">
                <div className="bsm-signoff-meta">
                  <span className="bsm-signoff-kicker">
                    <ShieldCheck size={14} /> Official Onboarding Baseline Assessment
                  </span>
                  <h2 className="bsm-signoff-title">
                    Reference Assessment Signed-Off: {currentBaseline.signedOffDate || currentBaseline.assessmentDate}
                  </h2>
                  <p className="bsm-signoff-desc">
                    {currentBaseline.remarks}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-emerald-800 font-medium mt-1 flex-wrap">
                    <span><strong>Ref No:</strong> {currentBaseline.assessmentReference || "BL-ASM-2021-001"}</span>
                    <span>•</span>
                    <span><strong>Period:</strong> {currentBaseline.financialYear || "FY 2021–22 Kickoff Benchmark"}</span>
                    <span>•</span>
                    <span><strong>Location:</strong> {currentBaseline.assessmentLocation || "Keonjhar District HQ, Odisha"}</span>
                  </div>
                </div>

                <div className="bsm-signoff-stamp">
                  <small>Signed off by</small>
                  <strong>{currentBaseline.signedOffBy}</strong>
                  <span>{currentBaseline.assessorName} ({currentBaseline.assessorRole})</span>
                  <div className="mt-2 pt-1 border-t border-emerald-100 flex items-center justify-end gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 size={12} /> Signed Off &amp; Verified
                  </div>
                </div>
              </section>

              {/* Section B: Baseline Indicator Summary Cards (Image 2) */}
              {/* Correctly distinguishes Growth from Decline! */}
              <section className="bsm-cards-grid" aria-label="Baseline Indicator Trajectory Cards">
                {/* Card 1: Farmer Member Base (Baseline 150, Current 60 -> Decline) */}
                {(() => {
                  const ind = currentBaseline.indicators[0] || { baselineValue: 150, currentValue: 60, unit: "Producers" };
                  const diff = ind.currentValue - ind.baselineValue;
                  const pct = ind.baselineValue > 0 ? Number(((diff / ind.baselineValue) * 100).toFixed(1)) : 0;
                  const isGrowth = diff >= 0;

                  return (
                    <article className={`bsm-metric-card ${isGrowth ? "growth" : "decline"}`}>
                      <div className="bsm-metric-header">
                        <span className="bsm-metric-label">Farmer Member Base</span>
                        <span className="bsm-metric-icon">
                          {isGrowth ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </span>
                      </div>
                      <div className="bsm-metric-vals">
                        <span className="bsm-metric-current">{ind.currentValue.toLocaleString()}</span>
                        <span className="bsm-metric-baseline">from {ind.baselineValue.toLocaleString()} {ind.unit}</span>
                      </div>
                      <div className={`bsm-metric-badge ${isGrowth ? "growth" : "decline"}`}>
                        {isGrowth ? `+${pct}% Producers Growth` : `${pct}% Producers (Decline)`}
                      </div>
                    </article>
                  );
                })()}

                {/* Card 2: Annual Audited Turnover (Baseline 14 Lakhs, Current 21.1 Lakhs -> Growth) */}
                {(() => {
                  const ind = currentBaseline.indicators[1] || { baselineValue: 1400000, currentValue: 2110000, unit: "₹" };
                  const diff = ind.currentValue - ind.baselineValue;
                  const pct = ind.baselineValue > 0 ? Number(((diff / ind.baselineValue) * 100).toFixed(1)) : 0;
                  const isGrowth = diff >= 0;

                  return (
                    <article className={`bsm-metric-card ${isGrowth ? "growth" : "decline"}`}>
                      <div className="bsm-metric-header">
                        <span className="bsm-metric-label">Audited Annual Turnover</span>
                        <span className="bsm-metric-icon">
                          {isGrowth ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </span>
                      </div>
                      <div className="bsm-metric-vals">
                        <span className="bsm-metric-current">{money(ind.currentValue)}</span>
                        <span className="bsm-metric-baseline">from {money(ind.baselineValue)}</span>
                      </div>
                      <div className={`bsm-metric-badge ${isGrowth ? "growth" : "decline"}`}>
                        {isGrowth ? `+${pct}% Turnover Growth` : `${pct}% Turnover (Decline)`}
                      </div>
                    </article>
                  );
                })()}

                {/* Card 3: Aggregated Storage Capacity (Baseline 120 MT, Current 800 MT -> Growth) */}
                {(() => {
                  const ind = currentBaseline.indicators[2] || { baselineValue: 120, currentValue: 800, unit: "MT" };
                  const diff = ind.currentValue - ind.baselineValue;
                  const pct = ind.baselineValue > 0 ? Number(((diff / ind.baselineValue) * 100).toFixed(1)) : 0;
                  const isGrowth = diff >= 0;

                  return (
                    <article className={`bsm-metric-card ${isGrowth ? "growth" : "decline"}`}>
                      <div className="bsm-metric-header">
                        <span className="bsm-metric-label">Aggregated Storage Capacity</span>
                        <span className="bsm-metric-icon">
                          {isGrowth ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </span>
                      </div>
                      <div className="bsm-metric-vals">
                        <span className="bsm-metric-current">{ind.currentValue.toLocaleString()} {ind.unit}</span>
                        <span className="bsm-metric-baseline">from {ind.baselineValue.toLocaleString()} {ind.unit}</span>
                      </div>
                      <div className={`bsm-metric-badge ${isGrowth ? "growth" : "decline"}`}>
                        {isGrowth ? `+${pct}% Storage Growth` : `${pct}% Storage (Decline)`}
                      </div>
                    </article>
                  );
                })()}

                {/* Card 4: Institutional Off-takers / Buyers (Baseline 1, Current 4 -> Growth) */}
                {(() => {
                  const ind = currentBaseline.indicators[3] || { baselineValue: 1, currentValue: 4, unit: "Off-takers" };
                  const diff = ind.currentValue - ind.baselineValue;
                  const pct = ind.baselineValue > 0 ? Number(((diff / ind.baselineValue) * 100).toFixed(1)) : 0;
                  const isGrowth = diff >= 0;

                  return (
                    <article className={`bsm-metric-card ${isGrowth ? "growth" : "decline"}`}>
                      <div className="bsm-metric-header">
                        <span className="bsm-metric-label">Institutional Off-takers</span>
                        <span className="bsm-metric-icon">
                          {isGrowth ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </span>
                      </div>
                      <div className="bsm-metric-vals">
                        <span className="bsm-metric-current">{ind.currentValue} Commercial Buyers</span>
                        <span className="bsm-metric-baseline">from {ind.baselineValue} Buyer</span>
                      </div>
                      <div className={`bsm-metric-badge ${isGrowth ? "growth" : "decline"}`}>
                        {isGrowth ? `+${diff} Buyers (+${pct}%)` : `${diff} Buyers (${pct}%)`}
                      </div>
                    </article>
                  );
                })()}
              </section>

              {/* Section C: Comprehensive Indicator Comparison Table (Image 2) */}
              <section className="bsm-panel" aria-label="Comprehensive Indicator Comparison Table">
                <div className="bsm-panel-head">
                  <div>
                    <h3><ClipboardCheck size={16} className="text-emerald-700" /> Longitudinal Indicator Comparison &amp; Audit Trail</h3>
                    <p>Verified reference benchmarks versus verified current actual performance with absolute change &amp; percentage growth</p>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    {currentBaseline.indicators.length} Tracked Strategic Indicators
                  </span>
                </div>

                <div className="bsm-table-wrap">
                  <table className="bsm-table">
                    <thead>
                      <tr>
                        <th>Indicator Name</th>
                        <th>Category</th>
                        <th>Baseline Reference</th>
                        <th>Current Actual</th>
                        <th>Absolute Change</th>
                        <th>Growth %</th>
                        <th>Sign-off Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBaseline.indicators.map((ind) => {
                        const diff = ind.currentValue - ind.baselineValue;
                        const pct = ind.baselineValue > 0 ? Number(((diff / ind.baselineValue) * 100).toFixed(1)) : 0;
                        const isGrowth = diff >= 0;

                        return (
                          <tr key={ind.id}>
                            <td>
                              <div>
                                <strong className="text-slate-900 block text-xs">{ind.name}</strong>
                                {ind.remarks && <small className="text-slate-500 text-[11px]">{ind.remarks}</small>}
                              </div>
                            </td>
                            <td>
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {ind.category}
                              </span>
                            </td>
                            <td>
                              <span className="font-mono font-semibold text-slate-800">
                                {ind.unit === "₹" ? money(ind.baselineValue) : `${ind.baselineValue.toLocaleString()} ${ind.unit}`}
                              </span>
                            </td>
                            <td>
                              <strong className="font-mono text-emerald-800">
                                {ind.unit === "₹" ? money(ind.currentValue) : `${ind.currentValue.toLocaleString()} ${ind.unit}`}
                              </strong>
                            </td>
                            <td>
                              <span className={`font-mono text-xs font-semibold ${isGrowth ? "text-emerald-800" : "text-red-700"}`}>
                                {isGrowth ? "+" : ""}{ind.unit === "₹" ? money(diff) : `${diff.toLocaleString()} ${ind.unit}`}
                              </span>
                            </td>
                            <td>
                              <span className={`font-bold text-xs inline-flex items-center gap-1 ${isGrowth ? "text-emerald-700" : "text-red-600"}`}>
                                {isGrowth ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {isGrowth ? `+${pct}%` : `${pct}%`}
                              </span>
                            </td>
                            <td className="text-xs text-slate-500 whitespace-nowrap">
                              {ind.signOffDate}
                            </td>
                            <td>
                              <span className={`bsm-chip ${ind.status === "Achieved" ? "achieved" : ind.status === "On Track" ? "ontrack" : "needs-attention"}`}>
                                ● {ind.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIndicator(ind);
                                  setNewActualValue(String(ind.currentValue));
                                  setEditRemarks(ind.remarks || "");
                                }}
                                className="bsm-btn compact secondary"
                                title="Update Current Actual Value"
                              >
                                <Edit3 size={11} /> Update
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <ClipboardCheck size={36} className="text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-base">No Baseline Assessment Recorded</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                This FPC has not yet completed its initial onboarding baseline assessment.
              </p>
            </div>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FIELD SURVEYS & RESPONSE LEDGER (Image 1) */}
      {/* ========================================================= */}
      {activeTab === "surveys" && (
        <>
          {/* Survey Campaigns & Status Filter Bar */}
          <section className="bsm-panel" aria-label="Field Surveys Campaign Roster">
            <div className="bsm-toolbar">
              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
                {["ALL", "Active", "Completed", "Draft", "Closed"].map(st => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setSurveyStatusFilter(st)}
                    className={`bsm-btn compact ${surveyStatusFilter === st ? "primary" : "secondary"}`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Category Filter and Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="bsm-category-filter-select" className="sr-only">Filter by Category</label>
                <select
                  id="bsm-category-filter-select"
                  aria-label="Filter by Category"
                  value={surveyCategoryFilter}
                  onChange={(e) => setSurveyCategoryFilter(e.target.value)}
                  className="bsm-select-control"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Crop Baseline">Crop Baseline</option>
                  <option value="Farmer Income">Farmer Income</option>
                  <option value="Input Demand">Input Demand</option>
                  <option value="Buyer Satisfaction">Buyer Satisfaction</option>
                  <option value="Governance">Governance</option>
                </select>

                <div className="bsm-search-wrap">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={surveySearchQuery}
                    onChange={(e) => setSurveySearchQuery(e.target.value)}
                    placeholder="Search surveys or investigators..."
                    className="bsm-search-input"
                  />
                  {surveySearchQuery && (
                    <button type="button" onClick={() => setSurveySearchQuery("")} className="text-slate-400 hover:text-slate-600">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Survey Campaigns Table (Image 1) */}
            <div className="bsm-table-wrap">
              <table className="bsm-table">
                <thead>
                  <tr>
                    <th>Survey Title &amp; ID</th>
                    <th>Category</th>
                    <th>Target Group</th>
                    <th>Sample / Responses</th>
                    <th>Completion Rate</th>
                    <th>Season / Period</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedSurveys.map((srv) => (
                    <tr
                      key={srv.id}
                      className={`clickable ${selectedSurveyForLedger?.id === srv.id ? "bg-emerald-50/60" : ""}`}
                      onClick={() => setSelectedSurveyForLedger(srv)}
                      title="Click to view responses collected under this survey"
                    >
                      <td>
                        <div>
                          <strong className="text-slate-900 block text-xs">{srv.title}</strong>
                          <span className="font-mono text-[11px] text-slate-500">{srv.id}</span>
                          {srv.fpcName && selectedFpcId === "ALL" && (
                            <span className="text-[10px] text-emerald-800 font-semibold block">{srv.fpcName}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {srv.category}
                        </span>
                      </td>
                      <td className="text-xs text-slate-700">{srv.targetGroup}</td>
                      <td>
                        <span className="font-mono font-bold text-xs text-slate-800">
                          {srv.responsesReceived} / {srv.targetSample}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="bsm-progress-bar-wrap">
                            <div
                              className="bsm-progress-bar-fill"
                              style={{ width: `${Math.min(100, srv.completionRate)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{srv.completionRate}%</span>
                        </div>
                      </td>
                      <td className="text-xs text-slate-600">{srv.season}</td>
                      <td className="text-xs text-slate-600">{srv.dueDate}</td>
                      <td>
                        <span className={`bsm-chip ${srv.status === "Active" ? "active" : srv.status === "Completed" ? "achieved" : "draft"}`}>
                          ● {srv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {canConductSurvey && (
                            <button
                              type="button"
                              onClick={() => handleOpenNewSurveyForm(srv.id)}
                              className="bsm-btn compact outline-green"
                              title="Conduct new survey entry for this campaign"
                            >
                              <Plus size={11} /> Response
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleExport28FieldsExcel(srv.id)}
                            className="bsm-btn compact secondary"
                            title="Download 28-field Excel dataset for this survey"
                          >
                            <FileSpreadsheet size={11} /> Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section B: Field Responses Ledger Table */}
          <section className="bsm-panel" aria-label="Field Survey Response Ledger">
            <div className="bsm-panel-head">
              <div>
                <h3>
                  <FileText size={16} className="text-emerald-700" />
                  Rural Respondent Ledger
                  {selectedSurveyForLedger && (
                    <span className="text-xs font-normal text-emerald-800 ml-2">
                      Filtered to: <strong>{selectedSurveyForLedger.title} ({selectedSurveyForLedger.id})</strong>
                    </span>
                  )}
                </h3>
                <p>
                  Verified farmer submissions containing complete 28-field geographic, landholding, irrigation, crop, and livestock telemetry
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedSurveyForLedger && (
                  <button
                    type="button"
                    onClick={() => setSelectedSurveyForLedger(null)}
                    className="bsm-btn compact secondary"
                  >
                    Clear Survey Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExport28FieldsExcel(selectedSurveyForLedger?.id)}
                  className="bsm-btn compact secondary"
                  title="Export all visible responses to Excel (28 Fields)"
                >
                  <Download size={12} /> Export Ledger Excel
                </button>
              </div>
            </div>

            <div className="bsm-table-wrap">
              <table className="bsm-table">
                <thead>
                  <tr>
                    <th>Sl / ID</th>
                    <th>Farmer Name</th>
                    <th>State &amp; District</th>
                    <th>Village &amp; GP</th>
                    <th>Category</th>
                    <th>Total Land (Ac)</th>
                    <th>Irrigated / Non</th>
                    <th>Primary Crop</th>
                    <th>Livestock</th>
                    <th>Plantation / Pond</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses
                    .filter(r => !selectedSurveyForLedger || r.surveyId === selectedSurveyForLedger.id)
                    .map((resp, idx) => {
                      const crop = resp.crops?.[0];
                      const livestock = resp.livestock?.[0];

                      return (
                        <tr
                          key={resp.id}
                          className="clickable"
                          onClick={() => setSelectedResponseForView(resp)}
                          title="Click to view all 28 fields in detail"
                        >
                          <td>
                            <strong className="text-slate-900 block text-xs">{resp.slNo || idx + 1}</strong>
                            <small className="font-mono text-[10px] text-slate-500">{resp.id}</small>
                          </td>
                          <td>
                            <div>
                              <strong className="text-slate-900 text-xs block">
                                {resp.farmerName || resp.respondentName || "—"}
                                {resp.isSampleData && (
                                  <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 font-semibold px-1 py-0.2 rounded border border-amber-200">
                                    Sample
                                  </span>
                                )}
                              </strong>
                              <span className="text-[11px] text-slate-500 font-mono">{resp.mobileNo || "—"}</span>
                            </div>
                          </td>
                          <td className="text-xs text-slate-700">
                            {resp.state || "Odisha"}, {resp.district || "Keonjhar"}
                          </td>
                          <td className="text-xs text-slate-700">
                            {resp.village || resp.respondentVillage || "—"} ({resp.gp || "—"})
                          </td>
                          <td>
                            <span className="text-[11px] font-semibold text-slate-700">
                              {resp.category || "General"} · {resp.gender || "M"}
                            </span>
                          </td>
                          <td>
                            <strong className="font-mono text-xs text-slate-800">
                              {resp.totalLandAcre ?? "—"} Ac
                            </strong>
                          </td>
                          <td className="text-xs text-slate-600 font-mono">
                            {resp.irrigatedAcre ?? 0} / {resp.nonIrrigatedAcre ?? 0} Ac
                          </td>
                          <td className="text-xs text-slate-800">
                            {crop ? `${crop.season}: ${crop.cropName} (${crop.areaAcre} Ac)` : "—"}
                          </td>
                          <td className="text-xs text-slate-800">
                            {livestock ? `${livestock.livestockName} (${livestock.number})` : "—"}
                          </td>
                          <td className="text-xs text-slate-700">
                            {resp.plantation === "Yes" || resp.plantation === true ? `Plantation: ${resp.plantationAreaAcre || 0} Ac` : "No plant."}
                            {" · "}
                            {resp.pond === "Yes" || resp.pond === true ? `Pond (${resp.pondSize || "Yes"})` : "No pond"}
                          </td>
                          <td>
                            <span className={`bsm-chip ${
                              resp.verificationStatus === "Approved" || resp.verificationStatus === "Verified" ? "verified" :
                              resp.verificationStatus === "Submitted" ? "submitted" :
                              resp.verificationStatus === "Returned" ? "returned" : "draft"
                            }`}>
                              ● {resp.verificationStatus}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setSelectedResponseForView(resp)}
                                className="bsm-btn compact secondary"
                                title="Inspect all 28 fields"
                              >
                                <Eye size={11} /> View
                              </button>

                              {/* Quick verification buttons for TSF Central Admin or FPC Admin */}
                              {resp.verificationStatus === "Submitted" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateResponseStatus(resp.id, "Verified")}
                                  className="bsm-btn compact outline-green"
                                  title="Verify this farmer baseline response"
                                >
                                  <Check size={11} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ========================================================= */}
      {/* 3. FARMER BASELINE SURVEY FORM MODAL (All 28 Fields)      */}
      {/* ========================================================= */}
      {isFormOpen && (
        <div className="bsm-modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div className="bsm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="bsm-modal-header">
              <div>
                <h2>Farmer Baseline Survey Data Collection (28 Fields)</h2>
                <span className="text-xs text-emerald-100 block mt-0.5">
                  Standardized multi-tier agricultural livelihood and baseline questionnaire
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-white hover:text-emerald-200"
                aria-label="Close Form"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bsm-modal-body">
              {/* Form Quick Action Toolbar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Quick Tools:</span>
                  <button
                    type="button"
                    onClick={handleLoadDemoRecord}
                    className="bsm-btn compact outline-green"
                    title="Load exact demonstration record for Krishna Munda (Seraikela, Jharkhand)"
                  >
                    ★ Load Excel Demo (Krishna Munda, Jharkhand)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Quick Select:</span>
                  <label htmlFor="bsm-prefill-member-select" className="sr-only">Choose member to link farmer identity</label>
                  <select
                    id="bsm-prefill-member-select"
                    aria-label="Choose member to link farmer identity"
                    onChange={(e) => handleFarmerIdSelect(e.target.value)}
                    className="bsm-select-control"
                    value={formData.respondentId || formData.farmerId || ""}
                  >
                    <option value="" disabled>Select farmer...</option>
                    {registeredFarmers.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.id}) · {f.village}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.isSampleData && (
                <div className="bsm-info-banner">
                  <AlertCircle size={16} />
                  <span>
                    <strong>Illustrative Demonstration Record:</strong> Loaded reference spreadsheet data for Krishna Munda (Jharkhand). Clearly marked as sample data.
                  </span>
                </div>
              )}

              {/* SECTION A: Geographic & Farmer Identification (Fields 1-13) */}
              <div className="bsm-form-section">
                <h3 className="bsm-form-section-title">
                  <span>Section A: Geographic &amp; Farmer Identification</span>
                  <span className="text-xs font-normal text-slate-500">Fields 1–13</span>
                </h3>
                <div className="bsm-grid-form">
                  <div className="bsm-form-group col-span-full">
                    <label className="bsm-form-label">Target FPC Organization (Assigned Scope)</label>
                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
                      <Building2 size={16} className="text-emerald-700 flex-shrink-0" />
                      <span className="font-bold text-slate-800">
                        {allFpcs.find(f => f.id === formData.fpcId)?.name || currentFpc?.name || formData.fpcId}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        ({formData.fpcId})
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded ml-auto border border-emerald-200">
                        Assigned FPC · Locked
                      </span>
                    </div>
                  </div>

                  {/* Primary Farmer ID Selector */}
                  <div className="bsm-form-group col-span-full">
                    <label htmlFor="bsm-form-farmer-id" className="bsm-form-label font-bold text-slate-800 flex items-center justify-between">
                      <span>Select Registered Farmer (Farmer ID) *</span>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Auto-fetches Farmer Name &amp; Mobile Number (Read-Only)
                      </span>
                    </label>
                    <select
                      id="bsm-form-farmer-id"
                      className="bsm-form-input font-medium"
                      value={formData.respondentId || formData.farmerId || ""}
                      onChange={(e) => handleFarmerIdSelect(e.target.value)}
                    >
                      <option value="">-- Choose Registered Farmer by ID --</option>
                      {registeredFarmers.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.id} — {f.name} ({f.village ? `${f.village}, ` : ""}{f.block || "Registered Member"})
                        </option>
                      ))}
                    </select>
                    {!formData.respondentId && !formData.farmerId && (
                      <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> Please select a registered Farmer ID to link the farmer identity.
                      </p>
                    )}
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-slno" className="bsm-form-label">1. Sl No</label>
                    <input
                      id="bsm-form-slno"
                      type="text"
                      className="bsm-form-input bg-slate-50 font-mono"
                      value={formData.slNo || 1}
                      readOnly
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-state" className="bsm-form-label">2. State *</label>
                    <select
                      id="bsm-form-state"
                      className="bsm-form-input"
                      value={formData.state || "Odisha"}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    >
                      <option value="Odisha">Odisha</option>
                      <option value="Jharkhand">Jharkhand</option>
                    </select>
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-district" className="bsm-form-label">3. District *</label>
                    <input
                      id="bsm-form-district"
                      type="text"
                      className="bsm-form-input"
                      value={formData.district || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      placeholder="e.g. Seraikela Kharsawan or Keonjhar"
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-unit" className="bsm-form-label">4. Unit *</label>
                    <input
                      id="bsm-form-unit"
                      type="text"
                      className="bsm-form-input"
                      value={formData.unit || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g. Jamshedpur or Keonjhar Cluster"
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-block" className="bsm-form-label">5. Block *</label>
                    <input
                      id="bsm-form-block"
                      type="text"
                      className="bsm-form-input"
                      value={formData.block || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, block: e.target.value }))}
                      placeholder="e.g. Seraikela or Keonjhar Sadar"
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-gp" className="bsm-form-label">6. GP (Gram Panchayat) *</label>
                    <input
                      id="bsm-form-gp"
                      type="text"
                      className="bsm-form-input"
                      value={formData.gp || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, gp: e.target.value }))}
                      placeholder="e.g. Mohitpur or Dimbo"
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-village" className="bsm-form-label">7. Village *</label>
                    <input
                      id="bsm-form-village"
                      type="text"
                      className="bsm-form-input"
                      value={formData.village || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                      placeholder="e.g. Panarol or Green Valley"
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-share-date" className="bsm-form-label">8. Share Issue Date</label>
                    <input
                      id="bsm-form-share-date"
                      type="date"
                      className="bsm-form-input"
                      value={formData.shareIssueDate || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, shareIssueDate: e.target.value }))}
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-category" className="bsm-form-label">9. Category *</label>
                    <select
                      id="bsm-form-category"
                      className="bsm-form-input"
                      value={formData.category || "General"}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    >
                      <option value="ST">ST</option>
                      <option value="SC">SC</option>
                      <option value="OBC">OBC</option>
                      <option value="General">General</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-gender" className="bsm-form-label">10. Gender *</label>
                    <select
                      id="bsm-form-gender"
                      className="bsm-form-input"
                      value={formData.gender || "Male"}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Read-Only Farmer Name (Captured in Farmer Registration) */}
                  <div className="bsm-form-group">
                    <label className="bsm-form-label flex items-center justify-between">
                      <span>11. Farmer Name (Read-Only)</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">From Farmer Registry</span>
                    </label>
                    <div className="bsm-form-input bg-slate-100 text-slate-900 font-bold flex items-center justify-between">
                      <span>{formData.farmerName || "— Select Farmer ID above —"}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">Read-Only</span>
                    </div>
                  </div>

                  {/* Read-Only Mobile Number (Captured in Farmer Registration) */}
                  <div className="bsm-form-group">
                    <label className="bsm-form-label flex items-center justify-between">
                      <span>12. Mobile No. (Read-Only)</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">From Farmer Registry</span>
                    </label>
                    <div className="bsm-form-input bg-slate-100 text-slate-900 font-mono flex items-center justify-between">
                      <span>{formData.mobileNo || "—"}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">Read-Only</span>
                    </div>
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-farmer-type" className="bsm-form-label">13. Type of Farmer *</label>
                    <select
                      id="bsm-form-farmer-type"
                      className="bsm-form-input font-medium"
                      value={formData.typeOfFarmer || "Small"}
                      onChange={(e) => setFormData(prev => ({ ...prev, typeOfFarmer: e.target.value }))}
                    >
                      <option value="Small">Small</option>
                      <option value="Marginal">Marginal</option>
                      <option value="Big">Big</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: Landholding & Irrigation Details (Fields 14-17) */}
              <div className="bsm-form-section">
                <h3 className="bsm-form-section-title">
                  <span>Section B: Landholding &amp; Irrigation Details</span>
                  <span className="text-xs font-normal text-slate-500">Fields 14–17</span>
                </h3>

                {isLandInconsistent && (
                  <div className="bsm-warn-banner">
                    <AlertTriangle size={16} />
                    <span>
                      Validation Warning: Irrigated Land ({formData.irrigatedAcre} Ac) + Non-Irrigated Land ({formData.nonIrrigatedAcre} Ac) exceeds Total Land ({formData.totalLandAcre} Ac). Please reconcile.
                    </span>
                  </div>
                )}

                <div className="bsm-grid-form">
                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-total-land" className="bsm-form-label">14. Total Land (Acre) *</label>
                    <input
                      id="bsm-form-total-land"
                      type="number"
                      step="0.1"
                      min="0"
                      className="bsm-form-input font-bold"
                      value={formData.totalLandAcre}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalLandAcre: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-irrigated-land" className="bsm-form-label">15. Irrigated (Acre) *</label>
                    <input
                      id="bsm-form-irrigated-land"
                      type="number"
                      step="0.1"
                      min="0"
                      className="bsm-form-input"
                      value={formData.irrigatedAcre}
                      onChange={(e) => setFormData(prev => ({ ...prev, irrigatedAcre: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-non-irrigated-land" className="bsm-form-label">16. Non-Irrigated (Acre) *</label>
                    <input
                      id="bsm-form-non-irrigated-land"
                      type="number"
                      step="0.1"
                      min="0"
                      className="bsm-form-input"
                      value={formData.nonIrrigatedAcre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nonIrrigatedAcre: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <span className="bsm-form-label block mb-1.5">17. Source of Irrigation (Select all that apply)</span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {["Pond", "Well", "Boring", "River", "Nala", "Other"].map(src => {
                      const isChecked = (formData.sourceOfIrrigation || []).includes(src);
                      return (
                        <label key={src} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleIrrigationSource(src)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{src}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION C: Crop and Seasonal Details (Fields 18-20, Repeatable Rows) */}
              <div className="bsm-form-section">
                <div className="bsm-form-section-title">
                  <span>Section C: Crop and Seasonal Details (Repeatable)</span>
                  <button
                    type="button"
                    onClick={handleAddCropRow}
                    className="bsm-btn compact outline-green"
                  >
                    <Plus size={11} /> Add Crop Record
                  </button>
                </div>

                <div className="bsm-table-wrap">
                  <table className="bsm-table">
                    <thead>
                      <tr>
                        <th>18. Season</th>
                        <th>19. Crop Name</th>
                        <th>20. Area (Acre)</th>
                        <th>Est. Yield (Qtl)</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.crops || []).map((crop, idx) => {
                        const standardCrops = ["Paddy", "Wheat", "Mustard", "Maize", "Potato", "Pea", "Tomato", "Brinjal"];
                        const isCustom = crop.cropName && !standardCrops.includes(crop.cropName);
                        return (
                          <tr key={crop.id || idx}>
                            <td>
                              <label htmlFor={`bsm-crop-season-${idx}`} className="sr-only">Season for crop {idx + 1}</label>
                              <select
                                id={`bsm-crop-season-${idx}`}
                                className="bsm-form-input font-medium"
                                value={crop.season === "Rabi" ? "Rabi" : "Kharif"}
                                onChange={(e) => handleCropRowChange(idx, "season", e.target.value)}
                              >
                                <option value="Kharif">Kharif</option>
                                <option value="Rabi">Rabi</option>
                              </select>
                            </td>
                            <td>
                              <label htmlFor={`bsm-crop-name-${idx}`} className="sr-only">Crop Name for crop {idx + 1}</label>
                              <select
                                id={`bsm-crop-name-${idx}`}
                                className="bsm-form-input font-medium"
                                value={isCustom ? "Other" : (crop.cropName || "Paddy")}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "Other") {
                                    handleCropRowChange(idx, "cropName", "");
                                  } else {
                                    handleCropRowChange(idx, "cropName", val);
                                  }
                                }}
                              >
                                <option value="Paddy">Paddy</option>
                                <option value="Wheat">Wheat</option>
                                <option value="Mustard">Mustard</option>
                                <option value="Maize">Maize</option>
                                <option value="Potato">Potato</option>
                                <option value="Pea">Pea</option>
                                <option value="Tomato">Tomato</option>
                                <option value="Brinjal">Brinjal</option>
                                <option value="Other">Other (Custom Crop)</option>
                              </select>
                              {(isCustom || crop.cropName === "") && (
                                <input
                                  type="text"
                                  className="bsm-form-input mt-1.5"
                                  value={crop.cropName}
                                  onChange={(e) => handleCropRowChange(idx, "cropName", e.target.value)}
                                  placeholder="Type custom crop name..."
                                />
                              )}
                            </td>
                            <td>
                              <label htmlFor={`bsm-crop-area-${idx}`} className="sr-only">Area in acres for crop {idx + 1}</label>
                              <input
                                id={`bsm-crop-area-${idx}`}
                                type="number"
                                step="0.1"
                                min="0"
                                className="bsm-form-input font-mono font-bold"
                                value={crop.areaAcre}
                                onChange={(e) => handleCropRowChange(idx, "areaAcre", parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td>
                              <label htmlFor={`bsm-crop-yield-${idx}`} className="sr-only">Estimated production in quintals for crop {idx + 1}</label>
                              <input
                                id={`bsm-crop-yield-${idx}`}
                                type="number"
                                step="0.5"
                                min="0"
                                className="bsm-form-input font-mono"
                                value={crop.expectedProductionQtl || ""}
                                onChange={(e) => handleCropRowChange(idx, "expectedProductionQtl", parseFloat(e.target.value) || 0)}
                                placeholder="Optional"
                              />
                            </td>
                            <td>
                              {(formData.crops || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCropRow(idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Remove Crop"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION D: Livestock Details (Fields 21-23, Repeatable Rows) */}
              <div className="bsm-form-section">
                <div className="bsm-form-section-title">
                  <span>Section D: Livestock Details (Repeatable)</span>
                  <button
                    type="button"
                    onClick={handleAddLivestockRow}
                    className="bsm-btn compact outline-green"
                  >
                    <Plus size={11} /> Add Livestock Record
                  </button>
                </div>

                <div className="bsm-table-wrap">
                  <table className="bsm-table">
                    <thead>
                      <tr>
                        <th>21. Livestock Name</th>
                        <th>22. Number</th>
                        <th>23. Purpose</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.livestock || []).map((lst, idx) => {
                        const standardLivestock = ["Cow", "Goat", "Pig", "Hen"];
                        const isCustomLivestock = lst.livestockName && !standardLivestock.includes(lst.livestockName);
                        const purposeVal = lst.purpose === "Sale" || lst.purpose === "Commercial" ? "Sale" : "Self";
                        return (
                          <tr key={lst.id || idx}>
                            <td>
                              <label htmlFor={`bsm-livestock-name-${idx}`} className="sr-only">Livestock Name for entry {idx + 1}</label>
                              <select
                                id={`bsm-livestock-name-${idx}`}
                                className="bsm-form-input font-medium"
                                value={isCustomLivestock ? "Other" : (lst.livestockName || "Cow")}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "Other") {
                                    handleLivestockRowChange(idx, "livestockName", "");
                                  } else {
                                    handleLivestockRowChange(idx, "livestockName", val);
                                  }
                                }}
                              >
                                <option value="Cow">Cow</option>
                                <option value="Goat">Goat</option>
                                <option value="Pig">Pig</option>
                                <option value="Hen">Hen</option>
                                <option value="Other">Other</option>
                              </select>
                              {(isCustomLivestock || lst.livestockName === "") && (
                                <input
                                  type="text"
                                  className="bsm-form-input mt-1.5"
                                  value={lst.livestockName}
                                  onChange={(e) => handleLivestockRowChange(idx, "livestockName", e.target.value)}
                                  placeholder="Type livestock name..."
                                />
                              )}
                            </td>
                            <td>
                              <label htmlFor={`bsm-livestock-count-${idx}`} className="sr-only">Livestock Count for entry {idx + 1}</label>
                              <input
                                id={`bsm-livestock-count-${idx}`}
                                type="number"
                                min="0"
                                className="bsm-form-input font-mono font-bold"
                                value={lst.number}
                                onChange={(e) => handleLivestockRowChange(idx, "number", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td>
                              <label htmlFor={`bsm-livestock-purpose-${idx}`} className="sr-only">Livestock Purpose for entry {idx + 1}</label>
                              <select
                                id={`bsm-livestock-purpose-${idx}`}
                                className="bsm-form-input font-medium"
                                value={purposeVal}
                                onChange={(e) => handleLivestockRowChange(idx, "purpose", e.target.value)}
                              >
                                <option value="Self">Self</option>
                                <option value="Sale">Sale</option>
                              </select>
                            </td>
                            <td>
                              {(formData.livestock || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLivestockRow(idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Remove Livestock"
                                >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION E: Plantation Details (Fields 24-25) */}
              <div className="bsm-form-section">
                <h3 className="bsm-form-section-title">
                  <span>Section E: Plantation Details</span>
                  <span className="text-xs font-normal text-slate-500">Fields 24–25</span>
                </h3>
                <div className="bsm-grid-form">
                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-plantation-toggle" className="bsm-form-label">24. Plantation (Yes / No) *</label>
                    <select
                      id="bsm-form-plantation-toggle"
                      className="bsm-form-input"
                      value={formData.plantation === "Yes" || formData.plantation === true ? "Yes" : "No"}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        plantation: e.target.value,
                        plantationAreaAcre: e.target.value === "No" ? 0 : prev.plantationAreaAcre || 0.5
                      }))}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {(formData.plantation === "Yes" || formData.plantation === true) && (
                    <div className="bsm-form-group">
                      <label htmlFor="bsm-form-plantation-area" className="bsm-form-label">25. Plantation Area (Acre) *</label>
                      <input
                        id="bsm-form-plantation-area"
                        type="number"
                        step="0.1"
                        min="0"
                        className="bsm-form-input font-bold"
                        value={formData.plantationAreaAcre}
                        onChange={(e) => setFormData(prev => ({ ...prev, plantationAreaAcre: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION F: Pond and Fish Farming Details (Fields 26-28) */}
              <div className="bsm-form-section">
                <h3 className="bsm-form-section-title">
                  <span>Section F: Pond and Fish Farming Details</span>
                  <span className="text-xs font-normal text-slate-500">Fields 26–28</span>
                </h3>
                <div className="bsm-grid-form">
                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-pond-toggle" className="bsm-form-label">26. Pond (Yes / No) *</label>
                    <select
                      id="bsm-form-pond-toggle"
                      className="bsm-form-input"
                      value={formData.pond === "Yes" || formData.pond === true ? "Yes" : "No"}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pond: e.target.value,
                        pondSize: e.target.value === "No" ? "—" : prev.pondSize === "—" ? "0.2 Acre" : prev.pondSize
                      }))}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {(formData.pond === "Yes" || formData.pond === true) && (
                    <div className="bsm-form-group">
                      <label htmlFor="bsm-form-pond-size" className="bsm-form-label">27. Size / Area (Acre)</label>
                      <input
                        id="bsm-form-pond-size"
                        type="text"
                        className="bsm-form-input"
                        value={formData.pondSize}
                        onChange={(e) => setFormData(prev => ({ ...prev, pondSize: e.target.value }))}
                        placeholder="e.g. 0.2 Acre"
                      />
                    </div>
                  )}

                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-fish-farming-toggle" className="bsm-form-label">28. Fish Farming (Yes / No) *</label>
                    <select
                      id="bsm-form-fish-farming-toggle"
                      className="bsm-form-input"
                      value={formData.fishFarming === "Yes" || formData.fishFarming === true ? "Yes" : "No"}
                      onChange={(e) => setFormData(prev => ({ ...prev, fishFarming: e.target.value }))}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION G: Allied Livelihood Activities */}
              <div className="bsm-form-section">
                <h3 className="bsm-form-section-title">
                  <span>Section G: Allied Livelihood Activities</span>
                  <span className="text-xs font-normal text-slate-500">Poultry, Fisheries, Vermicompost, Mushroom</span>
                </h3>
                <div className="bsm-grid-form">
                  <div className="bsm-form-group" style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="bsm-form-allied" className="bsm-form-label">Allied Activities Description</label>
                    <input
                      id="bsm-form-allied"
                      type="text"
                      className="bsm-form-input"
                      value={formData.allied || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, allied: e.target.value }))}
                      placeholder="e.g. Backyard poultry, vermicompost, mushroom cultivation"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION H: Agroforestry & NTFP Activities */}
              <div className="bsm-form-section">
                <h3 className="bsm-form-section-title">
                  <span>Section H: Agroforestry &amp; Forest Produce (NTFP)</span>
                  <span className="text-xs font-normal text-slate-500">Plantation species and forest harvest</span>
                </h3>
                <div className="bsm-grid-form">
                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-agroforestry" className="bsm-form-label">Agroforestry Tree Species</label>
                    <input
                      id="bsm-form-agroforestry"
                      type="text"
                      className="bsm-form-input"
                      value={formData.agroforestry || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, agroforestry: e.target.value }))}
                      placeholder="e.g. Mango (4), neem (6), bamboo (12 clumps)"
                    />
                  </div>
                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-ntfp" className="bsm-form-label">NTFP Collection Activities</label>
                    <input
                      id="bsm-form-ntfp"
                      type="text"
                      className="bsm-form-input"
                      value={formData.ntfp || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, ntfp: e.target.value }))}
                      placeholder="e.g. Sal leaf collection, mahua flowers, lac"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION I: Dairy & Milk Output */}
              <div className="bsm-form-section">
                <h3 className="bsm-form-section-title">
                  <span>Section I: Dairy &amp; Milk Production</span>
                  <span className="text-xs font-normal text-slate-500">Commercial &amp; household dairy output</span>
                </h3>
                <div className="bsm-grid-form">
                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-dairy-desc" className="bsm-form-label">Dairy Details</label>
                    <input
                      id="bsm-form-dairy-desc"
                      type="text"
                      className="bsm-form-input"
                      value={formData.dairy || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, dairy: e.target.value }))}
                      placeholder="e.g. 1 cow · approximately 4 litres/day"
                    />
                  </div>
                  <div className="bsm-form-group">
                    <label htmlFor="bsm-form-dairy-liters" className="bsm-form-label">Estimated Output (Litres / Day)</label>
                    <input
                      id="bsm-form-dairy-liters"
                      type="number"
                      step="0.5"
                      min="0"
                      className="bsm-form-input font-bold"
                      value={formData.dairyDailyLiters || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, dairyDailyLiters: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g. 4.0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bsm-modal-footer">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bsm-btn secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveForm(true)}
                className="bsm-btn secondary"
                title="Save progress as draft"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveForm(false)}
                className="bsm-btn primary"
              >
                <Check size={14} /> Submit Verified Survey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SLIDE-OVER SURVEY RESPONSE INSPECTION DRAWER            */}
      {/* ========================================================= */}
      {selectedResponseForView && (
        <div className="bsm-drawer-backdrop" onClick={() => setSelectedResponseForView(null)}>
          <aside className="bsm-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="bsm-drawer-header">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                  Farmer Baseline Submission Record (28 Fields)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedResponseForView.farmerName || selectedResponseForView.respondentName}
                  {selectedResponseForView.isSampleData && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded border border-amber-200">
                      Sample Data
                    </span>
                  )}
                </h3>
                <small className="text-slate-500 font-mono">{selectedResponseForView.id} · Survey: {selectedResponseForView.surveyId}</small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponseForView(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Close Inspection Drawer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bsm-drawer-body">
              {/* Status Header */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Verification Status</span>
                  <span className={`bsm-chip ${selectedResponseForView.verificationStatus === "Approved" || selectedResponseForView.verificationStatus === "Verified" ? "verified" : "submitted"} mt-1`}>
                    ● {selectedResponseForView.verificationStatus}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Submitted On</span>
                  <strong className="text-xs text-slate-800 block">{selectedResponseForView.submissionDate || "—"}</strong>
                </div>
              </div>

              {/* Section A: Geographic & Farmer ID */}
              <div className="mb-4">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block mb-2 border-b border-slate-200 pb-1">
                  1–13. Geographic &amp; Identification Details
                </span>
                <div className="bsm-kv-item"><small>Linked Farmer ID</small><strong className="font-mono text-emerald-800 font-bold">{selectedResponseForView.farmerId || selectedResponseForView.respondentId || "—"}</strong></div>
                <div className="bsm-kv-item"><small>1. Sl No</small><strong>{selectedResponseForView.slNo || 1}</strong></div>
                <div className="bsm-kv-item"><small>2. State</small><strong>{selectedResponseForView.state || "Odisha"}</strong></div>
                <div className="bsm-kv-item"><small>3. District</small><strong>{selectedResponseForView.district || "Keonjhar"}</strong></div>
                <div className="bsm-kv-item"><small>4. Unit</small><strong>{selectedResponseForView.unit || "Keonjhar Cluster"}</strong></div>
                <div className="bsm-kv-item"><small>5. Block</small><strong>{selectedResponseForView.block || "Keonjhar Sadar"}</strong></div>
                <div className="bsm-kv-item"><small>6. GP (Gram Panchayat)</small><strong>{selectedResponseForView.gp || "Dimbo"}</strong></div>
                <div className="bsm-kv-item"><small>7. Village</small><strong>{selectedResponseForView.village || selectedResponseForView.respondentVillage || "—"}</strong></div>
                <div className="bsm-kv-item"><small>8. Share Issue Date</small><strong>{selectedResponseForView.shareIssueDate || "2021-06-15"}</strong></div>
                <div className="bsm-kv-item"><small>9. Social Category</small><strong>{selectedResponseForView.category || "General"}</strong></div>
                <div className="bsm-kv-item"><small>10. Gender</small><strong>{selectedResponseForView.gender || "Male"}</strong></div>
                <div className="bsm-kv-item"><small>11. Farmer Name</small><div><strong>{selectedResponseForView.farmerName || selectedResponseForView.respondentName}</strong><span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded ml-1.5 border border-emerald-200 font-medium">Read-Only</span></div></div>
                <div className="bsm-kv-item"><small>12. Mobile No.</small><strong className="font-mono">{selectedResponseForView.mobileNo || "—"}</strong></div>
                <div className="bsm-kv-item"><small>13. Type of Farmer</small><strong>{selectedResponseForView.typeOfFarmer || "Small"}</strong></div>
              </div>

              {/* Section B: Landholding & Irrigation Details */}
              <div className="mb-4">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block mb-2 border-b border-slate-200 pb-1">
                  14–17. Landholding &amp; Irrigation
                </span>
                <div className="bsm-kv-item"><small>14. Total Land (Acre)</small><strong>{selectedResponseForView.totalLandAcre ?? "—"} Acres</strong></div>
                <div className="bsm-kv-item"><small>15. Irrigated Land (Acre)</small><strong>{selectedResponseForView.irrigatedAcre ?? "—"} Acres</strong></div>
                <div className="bsm-kv-item"><small>16. Non-Irrigated Land (Acre)</small><strong>{selectedResponseForView.nonIrrigatedAcre ?? "—"} Acres</strong></div>
                <div className="bsm-kv-item"><small>17. Source of Irrigation</small><strong>{(selectedResponseForView.sourceOfIrrigation || []).join(", ") || "Well"}</strong></div>
              </div>

              {/* Section C: Seasonal Crops */}
              <div className="mb-4">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block mb-2 border-b border-slate-200 pb-1">
                  18–20. Crop and Seasonal Details
                </span>
                {(selectedResponseForView.crops || []).map((c, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200 mb-1.5 text-xs flex justify-between items-center">
                    <div>
                      <strong>{c.season}: {c.cropName}</strong>
                      <span className="text-slate-500 block text-[11px]">Cultivated Area: {c.areaAcre} Acres</span>
                    </div>
                    {c.expectedProductionQtl && (
                      <span className="font-mono text-emerald-800 font-bold">{c.expectedProductionQtl} Qtl</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Section D: Livestock */}
              <div className="mb-4">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block mb-2 border-b border-slate-200 pb-1">
                  21–23. Livestock Details
                </span>
                {(selectedResponseForView.livestock || []).map((l, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200 mb-1.5 text-xs flex justify-between items-center">
                    <div>
                      <strong>{l.livestockName}</strong>
                      <span className="text-slate-500 block text-[11px]">Purpose: {l.purpose}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{l.number} Head</span>
                  </div>
                ))}
              </div>

              {/* Section E & F: Plantation & Fish Farming */}
              <div className="mb-4">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block mb-2 border-b border-slate-200 pb-1">
                  24–28. Plantation, Pond &amp; Aquaculture
                </span>
                <div className="bsm-kv-item"><small>24. Plantation</small><strong>{selectedResponseForView.plantation === "Yes" || selectedResponseForView.plantation === true ? "Yes" : "No"}</strong></div>
                <div className="bsm-kv-item"><small>25. Plantation Area</small><strong>{selectedResponseForView.plantationAreaAcre || 0} Acres</strong></div>
                <div className="bsm-kv-item"><small>26. Pond</small><strong>{selectedResponseForView.pond === "Yes" || selectedResponseForView.pond === true ? "Yes" : "No"}</strong></div>
                <div className="bsm-kv-item"><small>27. Size / Area of Pond</small><strong>{selectedResponseForView.pondSize || "—"}</strong></div>
                <div className="bsm-kv-item"><small>28. Fish Farming</small><strong>{selectedResponseForView.fishFarming === "Yes" || selectedResponseForView.fishFarming === true ? "Yes" : "No"}</strong></div>
                <div className="bsm-kv-item"><small>Allied Activities</small><strong>{selectedResponseForView.allied || "None"}</strong></div>
                <div className="bsm-kv-item"><small>Agroforestry Details</small><strong>{selectedResponseForView.agroforestry || "None"}</strong></div>
                <div className="bsm-kv-item"><small>NTFP Activities</small><strong>{selectedResponseForView.ntfp || "None"}</strong></div>
                <div className="bsm-kv-item"><small>Dairy Output</small><strong>{selectedResponseForView.dairy || "None"}</strong></div>
              </div>

              {/* Key Observations */}
              {selectedResponseForView.keyFindings && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 mb-3">
                  <strong>Survey Enumerator Remarks:</strong>
                  <p className="mt-1 mb-0 leading-relaxed">{selectedResponseForView.keyFindings}</p>
                </div>
              )}
            </div>

            <div className="bsm-drawer-footer">
              {selectedResponseForView.verificationStatus === "Submitted" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateResponseStatus(selectedResponseForView.id, "Returned", "Missing land record document")}
                    className="bsm-btn compact secondary"
                  >
                    Return for Correction
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateResponseStatus(selectedResponseForView.id, "Verified")}
                    className="bsm-btn compact primary"
                  >
                    <Check size={12} /> Verify Submission
                  </button>
                </>
              )}
              {selectedResponseForView.verificationStatus === "Verified" && (
                <button
                  type="button"
                  onClick={() => handleUpdateResponseStatus(selectedResponseForView.id, "Approved")}
                  className="bsm-btn compact primary"
                >
                  <ShieldCheck size={12} /> Final Approval
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedResponseForView(null)}
                className="bsm-btn compact secondary"
              >
                Close Drawer
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. INDICATOR UPDATE MODAL                                  */}
      {/* ========================================================= */}
      {editingIndicator && (
        <div className="bsm-modal-backdrop" onClick={() => setEditingIndicator(null)}>
          <div className="bsm-modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="bsm-modal-header">
              <h2>Update Current Actual Value</h2>
              <button type="button" onClick={() => setEditingIndicator(null)} className="text-white hover:text-emerald-200">
                <X size={18} />
              </button>
            </div>
            <div className="bsm-modal-body">
              <div className="mb-3">
                <span className="text-xs text-slate-500 block">Strategic Indicator</span>
                <strong className="text-sm text-slate-900">{editingIndicator.name}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Baseline Reference:</span>
                  <strong className="font-mono">{editingIndicator.unit === "₹" ? money(editingIndicator.baselineValue) : `${editingIndicator.baselineValue} ${editingIndicator.unit}`}</strong>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Previous Actual:</span>
                  <strong className="font-mono text-emerald-800">{editingIndicator.unit === "₹" ? money(editingIndicator.currentValue) : `${editingIndicator.currentValue} ${editingIndicator.unit}`}</strong>
                </div>
              </div>
              <div className="bsm-form-group mb-3">
                <label htmlFor="bsm-modal-new-actual" className="bsm-form-label">New Verified Actual Value ({editingIndicator.unit}) *</label>
                <input
                  id="bsm-modal-new-actual"
                  type="number"
                  step="any"
                  className="bsm-form-input font-bold"
                  value={newActualValue}
                  onChange={(e) => setNewActualValue(e.target.value)}
                  placeholder="Enter new actual"
                />
              </div>
              <div className="bsm-form-group">
                <label htmlFor="bsm-modal-verification-remarks" className="bsm-form-label">Verification Remarks &amp; Audit Notes</label>
                <textarea
                  id="bsm-modal-verification-remarks"
                  className="bsm-form-input"
                  rows={3}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="e.g. Verified via audited FY26 balance sheet and member registry"
                />
              </div>
            </div>
            <div className="bsm-modal-footer">
              <button type="button" onClick={() => setEditingIndicator(null)} className="bsm-btn secondary">
                Cancel
              </button>
              <button type="button" onClick={handleSaveIndicatorActual} className="bsm-btn primary">
                <Check size={14} /> Commit &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. REPORTS & EXPORTS DIALOG (Section 9)                   */}
      {/* ========================================================= */}
      {isReportsModalOpen && (
        <div className="bsm-modal-backdrop" onClick={() => setIsReportsModalOpen(false)}>
          <div className="bsm-modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="bsm-modal-header">
              <div>
                <h2>Export Baseline &amp; Field Survey Reports</h2>
                <span className="text-xs text-emerald-100 block mt-0.5">
                  Consolidated reporting, spreadsheet exports, and printable M&amp;E dossiers
                </span>
              </div>
              <button type="button" onClick={() => setIsReportsModalOpen(false)} className="text-white hover:text-emerald-200">
                <X size={20} />
              </button>
            </div>

            <div className="bsm-modal-body">
              <span className="text-xs font-bold text-slate-700 block mb-2">Select Export Report Format:</span>
              <div className="space-y-2 mb-4">
                {[
                  { id: "Farmer Baseline Survey Report (28 Fields)", desc: "All 28 spreadsheet fields matching actual farmer baseline Excel format", icon: FileSpreadsheet },
                  { id: "FPC Baseline vs Current Impact Report", desc: "Longitudinal performance comparison across all 7 strategic benchmarks", icon: TrendingUp },
                  { id: "Village-wise Farmer Aggregation Report", desc: "Farmer base, demographic categorisation, and village outreach summary", icon: MapPin },
                  { id: "Landholding & Irrigation Audit Report", desc: "Irrigated vs non-irrigated land and irrigation infrastructure roster", icon: Layers },
                  { id: "Seasonal Crop Distribution Report", desc: "Kharif, Rabi, and Jayad acreage and commodity diversification audit", icon: FileText },
                  { id: "Livestock & Animal Husbandry Report", desc: "Ruminant & poultry headcount, commercial intent, and livestock notes", icon: Users }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = selectedReportType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedReportType(item.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected ? "bg-emerald-50 border-emerald-500 shadow-xs" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">{item.id}</strong>
                        <span className="text-[11px] text-slate-500">{item.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bsm-modal-footer">
              <button type="button" onClick={() => setIsReportsModalOpen(false)} className="bsm-btn secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="bsm-btn secondary"
              >
                <Printer size={13} /> PDF / Print View
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExport28FieldsExcel();
                  setIsReportsModalOpen(false);
                }}
                className="bsm-btn primary"
              >
                <Download size={13} /> Download Excel Spreadsheet
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal?.isOpen && (
        <RegistrationSuccessModal
          isOpen={successModal.isOpen}
          isEdit={successModal.isEdit}
          registrationType="Baseline Survey Registration"
          registrationId={successModal.record.id}
          statusText={successModal.record.verificationStatus || "Submitted"}
          statusBadgeVariant={successModal.record.verificationStatus === "Approved" ? "green" : "blue"}
          summaryDetails={[
            { label: "Respondent / Farmer", value: successModal.record.farmerName || successModal.record.respondentName },
            { label: "Village & GP", value: `${successModal.record.village || "—"}, ${successModal.record.gp || "—"}` },
            { label: "Total Landholding", value: `${successModal.record.totalLandAcre || 0} Acres`, highlight: true },
            { label: "Primary Crop", value: successModal.record.crops?.[0]?.cropName || "Paddy" },
            { label: "Social Category", value: successModal.record.category || "General" }
          ]}
          onViewDetails={() => {
            const rec = successModal.record;
            setSuccessModal(null);
            setSelectedResponseForView(rec);
          }}
          onDone={() => {
            setSuccessModal(null);
          }}
          onRegisterAnother={!successModal.isEdit ? () => {
            setSuccessModal(null);
            handleOpenNewSurveyForm();
          } : undefined}
        />
      )}
    </div>
  );
}
