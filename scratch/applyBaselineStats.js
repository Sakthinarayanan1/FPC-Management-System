const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../artifacts/fpc-management/src/BaselineSurveysModule.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('Original length:', content.length);

// 1. Update activeTab type and default state
content = content.replace(
  'const [activeTab, setActiveTab] = useState<"baseline" | "surveys">("baseline");',
  'const [activeTab, setActiveTab] = useState<"overview" | "baseline" | "surveys">("overview");'
);

// 2. Update default formData to include livelihood fields
const oldFormDataDefault = `    plantation: "No",
    plantationAreaAcre: 0,
    pond: "No",
    pondSize: "—",
    fishFarming: "No",
    verificationStatus: "Submitted",`;

const newFormDataDefault = `    plantation: "No",
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
    verificationStatus: "Submitted",`;

content = content.replace(oldFormDataDefault, newFormDataDefault);

// 3. Update handleOpenNewSurveyForm to include livelihood defaults
const oldFormOpenLivelihood = `      plantation: "No",
      plantationAreaAcre: 0,
      pond: "No",
      pondSize: "—",
      fishFarming: "No",
      verificationStatus: "Submitted",`;

const newFormOpenLivelihood = `      plantation: "No",
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
      verificationStatus: "Submitted",`;

content = content.replace(oldFormOpenLivelihood, newFormOpenLivelihood);

// 4. Update handleLoadDemoRecord to include livelihood defaults
const oldDemoLivelihood = `      plantation: "Yes",
      plantationAreaAcre: 0.5,
      pond: "Yes",
      pondSize: "0.2 Acre",
      fishFarming: "Yes",
      respondentId: "F-DEMO-01",`;

const newDemoLivelihood = `      plantation: "Yes",
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
      respondentId: "F-DEMO-01",`;

content = content.replace(oldDemoLivelihood, newDemoLivelihood);

// 5. Update handlePrefillFromFarmer
const oldPrefill = `  const handlePrefillFromFarmer = (farmerId: string) => {
    const f = registeredFarmers.find(rf => rf.id === farmerId || rf.farmerId === farmerId);
    if (!f) return;

    const land = Number(f.totalLand) || Number(f.landHolding) || 2.5;
    const irrigated = Number(f.irrigatedLand) || (land > 1 ? 1.0 : 0.5);
    const nonIrr = Math.max(0, land - irrigated);

    setFormData(prev => ({
      ...prev,
      farmerName: f.name || f.farmerName || prev.farmerName,
      mobileNo: f.mobile || f.phone || prev.mobileNo,
      village: f.village || prev.village,
      block: f.block || prev.block,
      district: f.district || prev.district,
      state: f.state || prev.state,
      category: (f.category as any) || prev.category,
      gender: (f.gender as any) || prev.gender,
      totalLandAcre: land,
      irrigatedAcre: irrigated,
      nonIrrigatedAcre: nonIrr,
      typeOfFarmer: land < 2.5 ? "Marginal" : land <= 5.0 ? "Small" : "Medium",
      respondentId: f.id,
      respondentName: f.name || f.farmerName
    }));
    setToast(\`Prefilled profile and landholding details for \${f.name} (\${f.id}).\`);
  };`;

const newPrefill = `  const handlePrefillFromFarmer = (farmerId: string) => {
    const f = registeredFarmers.find(rf => rf.id === farmerId || rf.farmerId === farmerId);
    if (!f) return;

    const land = Number(f.landArea) || Number(String(f.land || "").replace(/[^\\d.]/g, "")) || 2.5;
    const irrigated = Number(f.irrigatedLand) || Number((land * 0.6).toFixed(1));
    const nonIrr = Math.max(0, Number((land - irrigated).toFixed(1)));

    const cropsList: FarmerCropRecord[] = (Array.isArray(f.crops) && f.crops.length > 0)
      ? f.crops.map((c: any, i: number) => ({
          id: c.id || \`c-pre-\${i}\`,
          season: c.season || f.season || "Kharif",
          cropName: c.cropName || c.crop || "Paddy",
          areaAcre: Number(c.areaAcre) || Number(f.cropArea) || 1.0,
          expectedProductionQtl: Number(c.expectedProductionQtl) || 15
        }))
      : [{
          id: \`c-pre-0\`,
          season: String(f.season || "Kharif"),
          cropName: String(f.crop || "Paddy"),
          areaAcre: Number(f.cropArea) || Math.min(land, 1.8),
          expectedProductionQtl: 18
        }];

    setFormData(prev => ({
      ...prev,
      farmerName: f.name || f.farmerName || prev.farmerName,
      mobileNo: f.mobile || f.phone || prev.mobileNo,
      village: f.village || prev.village,
      block: f.block || prev.block,
      district: f.district || prev.district,
      state: f.state || prev.state,
      category: (f.category as any) || prev.category,
      gender: (f.gender as any) || prev.gender,
      totalLandAcre: land,
      irrigatedAcre: irrigated,
      nonIrrigatedAcre: nonIrr,
      typeOfFarmer: land < 2.5 ? "Marginal" : land <= 5.0 ? "Small" : "Medium",
      crops: cropsList,
      livestock: f.livestock && f.livestock !== "—" ? [
        { id: \`lst-pre-1\`, livestockName: "Cow", number: 2, purpose: "Mixed purpose" }
      ] : prev.livestock,
      allied: f.allied || prev.allied,
      agroforestry: f.agroforestry || prev.agroforestry,
      plantation: (f.agroforestry && f.agroforestry !== "—") ? "Yes" : prev.plantation,
      plantationAreaAcre: Number(f.plantationAreaAcre) || (f.agroforestry ? 0.4 : 0),
      ntfp: f.ntfp || prev.ntfp,
      dairy: f.dairy || prev.dairy,
      dairyDailyLiters: Number(f.dairyDailyLiters) || (f.dairy ? parseInt(f.dairy.replace(/[^\\d]/g, "")) || 0 : 0),
      respondentId: f.id,
      respondentName: f.name || f.farmerName
    }));
    setToast(\`Prefilled profile, crops, and livelihood details for \${f.name} (\${f.id}).\`);
  };`;

content = content.replace(oldPrefill, newPrefill);

// 6. Add Deduplication and Statistics calculation block right before return
const statsEngineCode = `
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
      const rawLand = Number(f.landArea) || Number(String(f.land || "").replace(/[^\\d.]/g, "")) || 2.4;
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
          { id: \`c-\${f.id}\`, cropName: f.crop || "Paddy", season: f.season || "Kharif", areaAcre: rawCropArea }
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
        dairyDailyLiters: Number(f.dairyDailyLiters) || (f.dairy ? parseInt(f.dairy.replace(/[^\\d]/g, "")) || 0 : 0),
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

      const dailyLtrs = r.dairyDailyLiters ?? (r.dairy ? parseInt(r.dairy.replace(/[^\\d]/g, "")) || 0 : (existing?.dairyDailyLiters || 0));

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
        livestock: (r.livestock && r.livestock.length > 0) ? r.livestock.map(l => \`\${l.number} \${l.livestockName}\`).join(", ") : (existing?.livestock || "—"),
        hasLivestock: hasLst,
        allied: r.allied || (r.fishFarming === "Yes" ? "Freshwater aquaculture" : (existing?.allied || "—")),
        hasAllied: hasAllied,
        agroforestry: r.agroforestry || (r.plantation === "Yes" ? \`Plantation (\${r.plantationAreaAcre || 0.4} Ac)\` : (existing?.agroforestry || "—")),
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

  const stat7PrimaryCropsSummary = sortedCrops.slice(0, 3).map(c => \`\${c.name} (\${c.acres} Ac)\`).join(", ") || "Paddy, Mustard";

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
`;

// Insert statsEngineCode right before "  // Land calculation validation flag"
content = content.replace(
  '  // Land calculation validation flag',
  statsEngineCode + '\n  // Land calculation validation flag'
);

// 7. Update Tab buttons
const oldTabNav = `      <nav className="bsm-tab-nav" aria-label="Baseline and Survey Navigation">
        <button
          type="button"
          onClick={() => setActiveTab("baseline")}
          className={\`bsm-tab-btn \${activeTab === "baseline" ? "active" : ""}\`}
        >
          <Layers size={15} /> 1. Baseline Assessment &amp; Growth Tracking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("surveys")}
          className={\`bsm-tab-btn \${activeTab === "surveys" ? "active" : ""}\`}
        >
          <FileText size={15} /> 2. Field Surveys &amp; Response Ledger
          <span className="bsm-badge-count">{filteredResponses.length}</span>
        </button>
      </nav>`;

const newTabNav = `      <nav className="bsm-tab-nav" aria-label="Baseline and Survey Navigation">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={\`bsm-tab-btn \${activeTab === "overview" ? "active" : ""}\`}
        >
          <BarChart3 size={15} /> 1. Overall FPC Baseline Statistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("baseline")}
          className={\`bsm-tab-btn \${activeTab === "baseline" ? "active" : ""}\`}
        >
          <Layers size={15} /> 2. Strategic Baseline Growth Tracking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("surveys")}
          className={\`bsm-tab-btn \${activeTab === "surveys" ? "active" : ""}\`}
        >
          <FileText size={15} /> 3. Field Surveys &amp; Response Ledger
          <span className="bsm-badge-count">{filteredResponses.length}</span>
        </button>
      </nav>`;

content = content.replace(oldTabNav, newTabNav);

// 8. Render activeTab === "overview" block right before activeTab === "baseline"
const overviewTabJSX = `      {/* ========================================================= */}
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
                  {currentFpc.location || \`\${currentFpc.district}, \${currentFpc.state}\`}
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
                  <div className="bsm-stat-card-detail">2nd: {sortedCrops[1] ? \`\${sortedCrops[1].name} (\${sortedCrops[1].acres} Ac)\` : "None"}</div>
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
                    <RechartsTooltip formatter={(val: any) => [\`\${val} Acres\`, "Acreage"]} />
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
                      label={({ name, percent }: any) => \`\${name} (\${(percent * 100).toFixed(0)}%)\`}
                    >
                      {landDistributionData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => [\`\${val} Farmers\`, "Count"]} />
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
                      label={({ name, value }: any) => \`\${name}: \${value} Ac\`}
                    >
                      <Cell fill="#0284c7" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => [\`\${val} Acres\`, "Area"]} />
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
                    <RechartsTooltip formatter={(val: any) => [\`\${val}%\`, "Adoption Rate"]} />
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

`;

content = content.replace(
  '      {/* ========================================================= */}\n      {/* TAB 1: BASELINE ASSESSMENT & GROWTH TRACKING */}',
  overviewTabJSX + '      {/* ========================================================= */}\n      {/* TAB 2: BASELINE ASSESSMENT & GROWTH TRACKING */}'
);

// 9. Add Sections G, H, I into the "Conduct Field Survey" modal form (after Section F)
const oldModalSectionFEnd = `                  <div className="bsm-form-group">
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
              </div>`;

const newModalLivelihoodSections = `                  <div className="bsm-form-group">
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
              </div>`;

content = content.replace(oldModalSectionFEnd, newModalLivelihoodSections);

// 10. Add livelihood fields to the drawer inspection
const oldDrawerFEnd = `<div className="bsm-kv-item"><small>28. Fish Farming</small><strong>{selectedResponseForView.fishFarming === "Yes" || selectedResponseForView.fishFarming === true ? "Yes" : "No"}</strong></div>
              </div>`;

const newDrawerFEnd = `<div className="bsm-kv-item"><small>28. Fish Farming</small><strong>{selectedResponseForView.fishFarming === "Yes" || selectedResponseForView.fishFarming === true ? "Yes" : "No"}</strong></div>
                <div className="bsm-kv-item"><small>Allied Activities</small><strong>{selectedResponseForView.allied || "None"}</strong></div>
                <div className="bsm-kv-item"><small>Agroforestry Details</small><strong>{selectedResponseForView.agroforestry || "None"}</strong></div>
                <div className="bsm-kv-item"><small>NTFP Activities</small><strong>{selectedResponseForView.ntfp || "None"}</strong></div>
                <div className="bsm-kv-item"><small>Dairy Output</small><strong>{selectedResponseForView.dairy || "None"}</strong></div>
              </div>`;

content = content.replace(oldDrawerFEnd, newDrawerFEnd);

// 11. Add livelihood fields to Excel Export
const oldExportFEnd = `        "Fish Farming": r.fishFarming === "Yes" || r.fishFarming === true ? "Yes" : "No",
        // Additional M&E Auditing columns`;

const newExportFEnd = `        "Fish Farming": r.fishFarming === "Yes" || r.fishFarming === true ? "Yes" : "No",
        "Allied Activities": r.allied || "None",
        "Agroforestry Details": r.agroforestry || "None",
        "NTFP Collection": r.ntfp || "None",
        "Dairy Production": r.dairy || "None",
        "Daily Milk Liters": r.dairyDailyLiters || 0,
        // Additional M&E Auditing columns`;

content = content.replace(oldExportFEnd, newExportFEnd);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated BaselineSurveysModule.tsx. New length:', content.length);
