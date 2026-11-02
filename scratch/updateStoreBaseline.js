const fs = require('fs');
const path = 'artifacts/fpc-management/src/lib/store.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Update BL-ASM-001 in initialBaselineAssessments
const targetBL = `  {
    id: "BL-ASM-001",
    fpcId: "FPC-ODI-001",
    fpcName: "Green Valley Farmer Producer Company Ltd.",
    assessmentDate: "14 Jun 2021",
    status: "Completed",
    assessorName: "TSF Agri Monitoring Division",
    assessorRole: "Lead M&E Specialist",
    signedOffBy: "Dr. R. K. Mohapatra (TSF Portfolio Lead)",
    remarks: "Baseline assessment completed during company incorporation and operational kickoff. Key benchmarks verified with field surveys and DAO records.",
    indicators: [
      { id: "IND-01", name: "Registered Farmer Member Base", category: "Institutional", baselineValue: 250, currentValue: 1240, unit: "Producers", changePercent: 396, signOffDate: "14 Jun 2021", status: "Achieved" },
      { id: "IND-02", name: "Annual Audited Turnover", category: "Financial", baselineValue: 1850000, currentValue: 7180000, unit: "₹", changePercent: 288, signOffDate: "14 Jun 2021", status: "Achieved" },
      { id: "IND-03", name: "Commercial Institutional Buyers", category: "Institutional", baselineValue: 1, currentValue: 4, unit: "Off-takers", changePercent: 300, signOffDate: "14 Jun 2021", status: "Achieved" },
      { id: "IND-04", name: "Aggregated Storage Capacity", category: "Infrastructure", baselineValue: 120, currentValue: 800, unit: "MT", changePercent: 566, signOffDate: "14 Jun 2021", status: "Achieved" },
      { id: "IND-05", name: "Average Paddy Yield per Acre", category: "Agronomic", baselineValue: 14.2, currentValue: 19.4, unit: "Qtl/Acre", changePercent: 36.6, signOffDate: "14 Jun 2021", status: "Achieved" },
      { id: "IND-06", name: "Paid-up Member Share Capital", category: "Financial", baselineValue: 125000, currentValue: 620000, unit: "₹", changePercent: 396, signOffDate: "14 Jun 2021", status: "Achieved" }
    ]
  },`;

const replacementBL = `  {
    id: "BL-ASM-001",
    fpcId: "FPC-ODI-001",
    fpcName: "Green Valley Farmer Producer Company Ltd.",
    assessmentReference: "BL-ASM-2021-001",
    financialYear: "FY 2021–22 Onboarding Baseline",
    assessmentLocation: "Keonjhar District HQ, Odisha",
    assessmentDate: "14 Jun 2021",
    signedOffDate: "14 Jun 2021",
    status: "Completed",
    assessorName: "TSF Agri Monitoring Division",
    assessorRole: "Lead M&E Specialist",
    signedOffBy: "Dr. R. K. Mohapatra (TSF Portfolio Lead)",
    remarks: "Baseline assessment completed during company incorporation and operational kickoff. Reference benchmarks established for producer member mobilization, audited turnover trajectory, godown capacity aggregation, and commercial buyer linkages. Key benchmarks verified with field surveys and DAO records.",
    indicators: [
      { id: "IND-01", name: "Registered Farmer Member Base", category: "Institutional", baselineValue: 150, currentValue: 60, unit: "Producers", changePercent: -60.0, signOffDate: "14 Jun 2021", status: "Needs Attention", remarks: "Decline from onboarding reference target. Active mobilization campaign initiated in Pitamahal and Telkoi clusters." },
      { id: "IND-02", name: "Annual Audited Turnover", category: "Financial", baselineValue: 1400000, currentValue: 2110000, unit: "₹", changePercent: 50.7, signOffDate: "14 Jun 2021", status: "Achieved", remarks: "Solid top-line expansion exceeding initial Rs 14 Lakhs benchmark through institutional paddy procurement." },
      { id: "IND-03", name: "Aggregated Storage Capacity", category: "Infrastructure", baselineValue: 120, currentValue: 800, unit: "MT", changePercent: 566.7, signOffDate: "14 Jun 2021", status: "Achieved", remarks: "Expansion of 2 central godowns plus auxiliary village collection centers." },
      { id: "IND-04", name: "Institutional Off-takers / Buyers", category: "Institutional", baselineValue: 1, currentValue: 4, unit: "Off-takers", changePercent: 300.0, signOffDate: "14 Jun 2021", status: "Achieved", remarks: "Long-term formal agreements with OSCSC, Shree Balaji, and regional poultry feed millers." },
      { id: "IND-05", name: "Average Paddy Yield per Acre", category: "Agronomic", baselineValue: 14.2, currentValue: 19.4, unit: "Qtl/Acre", changePercent: 36.6, signOffDate: "14 Jun 2021", status: "On Track", remarks: "Certified Swarna seed adoption and micro-irrigation interventions." },
      { id: "IND-06", name: "Paid-up Member Share Capital", category: "Financial", baselineValue: 125000, currentValue: 620000, unit: "₹", changePercent: 396.0, signOffDate: "14 Jun 2021", status: "Achieved", remarks: "Share capital expansion through regular AGM share allotment rounds." }
    ]
  },`;

if (content.includes(targetBL)) {
  content = content.replace(targetBL, replacementBL);
  console.log("BL-ASM-001 updated.");
} else {
  console.log("Warning: targetBL not found");
}

// 2. Add SRV-2026-000 to initialSurveys
const targetSurveys = `export const initialSurveys: FpcSurvey[] = [`;
const replacementSurveys = `export const initialSurveys: FpcSurvey[] = [
  {
    id: "SRV-2026-000",
    fpcId: "FPC-ODI-001",
    fpcName: "Green Valley Farmer Producer Company Ltd.",
    title: "Farmer Baseline and Agricultural Livelihood Assessment",
    category: "Farmer Income",
    season: "Kharif 2026 - Rabi 2026-27",
    targetGroup: "Farmers",
    targetSample: 150,
    responsesReceived: 88,
    completionRate: 58.7,
    startDate: "15 May 2026",
    dueDate: "30 Nov 2026",
    status: "Active",
    leadInvestigator: "TSF Field M&E Survey Unit"
  },
  {
    id: "SRV-JHK-001",
    fpcId: "FPC-JHK-002",
    fpcName: "Seraikela Tribal Organic Producers Co.",
    title: "Farmer Baseline and Agricultural Livelihood Assessment",
    category: "Farmer Income",
    season: "Kharif 2026 - Rabi 2026-27",
    targetGroup: "Farmers",
    targetSample: 100,
    responsesReceived: 42,
    completionRate: 42.0,
    startDate: "01 Jun 2026",
    dueDate: "15 Dec 2026",
    status: "Active",
    leadInvestigator: "Arun Hansda (Field Surveyor)"
  },`;

if (content.includes(targetSurveys)) {
  content = content.replace(targetSurveys, replacementSurveys);
  console.log("initialSurveys updated.");
} else {
  console.log("Warning: targetSurveys not found");
}

// 3. Update initialSurveyResponses with rich 28-field records
const targetResponses = `export const initialSurveyResponses: FpcSurveyResponse[] = [`;
const replacementResponses = `export const initialSurveyResponses: FpcSurveyResponse[] = [
  {
    id: "RSP-DEMO-001",
    surveyId: "SRV-2026-000",
    fpcId: "FPC-ODI-001",
    slNo: 1,
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
    sourceOfIrrigation: ["Pond", "Well", "Boring", "River", "Canal", "Other"],
    crops: [
      { id: "crp-1", season: "Kharif", cropName: "Paddy (Swarna)", areaAcre: 1.5, expectedProductionQtl: 28 },
      { id: "crp-2", season: "Rabi", cropName: "Wheat (Sonalika)", areaAcre: 1.0, expectedProductionQtl: 14 },
      { id: "crp-3", season: "Jayad", cropName: "Mustard", areaAcre: 0.5, expectedProductionQtl: 5 }
    ],
    livestock: [
      { id: "lst-1", livestockName: "Cow", number: 2, purpose: "Mixed purpose" },
      { id: "lst-2", livestockName: "Goat", number: 4, purpose: "Commercial" },
      { id: "lst-3", livestockName: "Hen", number: 10, purpose: "Self-consumption" }
    ],
    plantation: "Yes",
    plantationAreaAcre: 0.5,
    pond: "Yes",
    pondSize: "0.2 Acre",
    fishFarming: "Yes",
    respondentId: "F-DEMO-01",
    respondentName: "Krishna Munda",
    respondentVillage: "Panarol",
    submissionDate: "20 May 2026",
    keyFindings: "Small tribal farmer with 3.0 acres. Active multi-season crop rotation (Paddy, Wheat, Mustard), livestock husbandry, and freshwater pond aquaculture. Illustrative demonstration record based on actual field baseline Excel format.",
    enumeratorName: "Arun Hansda (Field Surveyor)",
    verificationStatus: "Verified",
    verifiedBy: "TSF State M&E Lead",
    verifiedAt: "24 May 2026",
    isSampleData: true
  },
  {
    id: "RSP-001",
    surveyId: "SRV-2026-000",
    fpcId: "FPC-ODI-001",
    slNo: 2,
    state: "Odisha",
    district: "Keonjhar",
    unit: "Keonjhar Cluster",
    block: "Keonjhar Sadar",
    gp: "Dimbo",
    village: "Green Valley",
    shareIssueDate: "2021-06-15",
    category: "OBC",
    gender: "Male",
    farmerName: "Ravi Kumar",
    mobileNo: "9437123456",
    typeOfFarmer: "Small",
    totalLandAcre: 2.5,
    irrigatedAcre: 1.5,
    nonIrrigatedAcre: 1.0,
    sourceOfIrrigation: ["Boring", "Well"],
    crops: [
      { id: "crp-101", season: "Kharif", cropName: "Paddy (Swarna)", areaAcre: 2.1, expectedProductionQtl: 38 },
      { id: "crp-102", season: "Rabi", cropName: "Vegetables (Tomato, Brinjal)", areaAcre: 0.4, expectedProductionQtl: 16 }
    ],
    livestock: [
      { id: "lst-101", livestockName: "Cow", number: 2, purpose: "Mixed purpose" }
    ],
    plantation: "No",
    plantationAreaAcre: 0,
    pond: "No",
    pondSize: "—",
    fishFarming: "No",
    respondentId: "F-001",
    respondentName: "Ravi Kumar",
    respondentVillage: "Green Valley",
    submissionDate: "12 Jun 2026",
    keyFindings: "Sown Paddy (Swarna) on 2.1 acres. Requires 2 bags DAP and 3 bags Urea. Expected market surplus 32 Quintals.",
    enumeratorName: "Suman Naik (Field Mobilizer)",
    verificationStatus: "Verified",
    verifiedBy: "Anita Das (MIS Lead)",
    verifiedAt: "16 Jun 2026"
  },
  {
    id: "RSP-002",
    surveyId: "SRV-2026-000",
    fpcId: "FPC-ODI-001",
    slNo: 3,
    state: "Odisha",
    district: "Keonjhar",
    unit: "Keonjhar Cluster",
    block: "Keonjhar Sadar",
    gp: "Pitamahal",
    village: "Pitamahal",
    shareIssueDate: "2022-03-10",
    category: "ST",
    gender: "Female",
    farmerName: "Sita Devi",
    mobileNo: "9438987654",
    typeOfFarmer: "Marginal",
    totalLandAcre: 1.8,
    irrigatedAcre: 0.8,
    nonIrrigatedAcre: 1.0,
    sourceOfIrrigation: ["Pond", "River"],
    crops: [
      { id: "crp-201", season: "Kharif", cropName: "Hybrid Maize", areaAcre: 1.4, expectedProductionQtl: 24 }
    ],
    livestock: [
      { id: "lst-201", livestockName: "Goat", number: 6, purpose: "Commercial" },
      { id: "lst-202", livestockName: "Hen", number: 12, purpose: "Self-consumption" }
    ],
    plantation: "Yes",
    plantationAreaAcre: 0.3,
    pond: "Yes",
    pondSize: "0.1 Acre",
    fishFarming: "No",
    respondentId: "F-002",
    respondentName: "Sita Devi",
    respondentVillage: "Pitamahal",
    submissionDate: "14 Jun 2026",
    keyFindings: "Cultivating Hybrid Maize on 1.4 acres. Organic bio-fertilizer required. Expected harvest 22 Quintals.",
    enumeratorName: "Suman Naik (Field Mobilizer)",
    verificationStatus: "Verified",
    verifiedBy: "Anita Das (MIS Lead)",
    verifiedAt: "17 Jun 2026"
  },
  {
    id: "RSP-003",
    surveyId: "SRV-2026-000",
    fpcId: "FPC-ODI-001",
    slNo: 4,
    state: "Odisha",
    district: "Keonjhar",
    unit: "Keonjhar Cluster",
    block: "Telkoi",
    gp: "Telkoi",
    village: "Telkoi",
    shareIssueDate: "2022-08-22",
    category: "OBC",
    gender: "Male",
    farmerName: "Ganesh Mahato",
    mobileNo: "9437234567",
    typeOfFarmer: "Small",
    totalLandAcre: 2.2,
    irrigatedAcre: 1.0,
    nonIrrigatedAcre: 1.2,
    sourceOfIrrigation: ["Boring", "Well"],
    crops: [
      { id: "crp-301", season: "Kharif", cropName: "Arhar (Pigeon Pea)", areaAcre: 1.8, expectedProductionQtl: 16 }
    ],
    livestock: [
      { id: "lst-301", livestockName: "Cow", number: 3, purpose: "Mixed purpose" }
    ],
    plantation: "No",
    plantationAreaAcre: 0,
    pond: "No",
    pondSize: "—",
    fishFarming: "No",
    respondentId: "F-003",
    respondentName: "Ganesh Mahato",
    respondentVillage: "Telkoi",
    submissionDate: "16 Jun 2026",
    keyFindings: "Sown Arhar (Pigeon Pea) on 1.8 acres. Requested bio-pesticide spray schedule. Expected surplus 16 Quintals.",
    enumeratorName: "Suman Naik (Field Mobilizer)",
    verificationStatus: "Submitted"
  },
  {
    id: "RSP-004",
    surveyId: "SRV-2026-000",
    fpcId: "FPC-ODI-001",
    slNo: 5,
    state: "Odisha",
    district: "Keonjhar",
    unit: "Keonjhar Cluster",
    block: "Harichandanpur",
    gp: "Harichandanpur",
    village: "Harichandanpur",
    shareIssueDate: "2023-01-15",
    category: "ST",
    gender: "Male",
    farmerName: "Budhram Soren",
    mobileNo: "9439345678",
    typeOfFarmer: "Small",
    totalLandAcre: 3.5,
    irrigatedAcre: 2.0,
    nonIrrigatedAcre: 1.5,
    sourceOfIrrigation: ["Boring", "River"],
    crops: [
      { id: "crp-401", season: "Kharif", cropName: "Paddy (Swarna)", areaAcre: 2.5, expectedProductionQtl: 45 },
      { id: "crp-402", season: "Rabi", cropName: "Mustard", areaAcre: 0.8, expectedProductionQtl: 8 }
    ],
    livestock: [
      { id: "lst-401", livestockName: "Cow", number: 4, purpose: "Commercial" },
      { id: "lst-402", livestockName: "Goat", number: 8, purpose: "Commercial" }
    ],
    plantation: "Yes",
    plantationAreaAcre: 0.4,
    pond: "Yes",
    pondSize: "0.25 Acre",
    fishFarming: "Yes",
    respondentId: "F-004",
    respondentName: "Budhram Soren",
    respondentVillage: "Harichandanpur",
    submissionDate: "18 Jun 2026",
    keyFindings: "Paddy crop on 2.5 acres. Uses solar pump irrigation. Estimated surplus 38 Quintals.",
    enumeratorName: "Suman Naik (Field Mobilizer)",
    verificationStatus: "Approved",
    verifiedBy: "Dr. R. K. Mohapatra (TSF Lead)",
    verifiedAt: "22 Jun 2026",
    approvalRemarks: "Complete verified baseline dataset with land revenue plot records."
  },`;

if (content.includes(targetResponses)) {
  content = content.replace(targetResponses, replacementResponses);
  console.log("initialSurveyResponses updated.");
} else {
  console.log("Warning: targetResponses not found");
}

fs.writeFileSync(path, content, 'utf8');
console.log("store.ts update complete!");

