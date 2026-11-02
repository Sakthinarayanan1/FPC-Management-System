import React, { useState, useMemo } from "react";
import {
  ClipboardCheck, Users, Search, Download, Eye, X, Check,
  Building2, ArrowRight, Filter, AlertCircle, FileText, CheckCircle2
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Role } from "@/lib/config";
import type { RecordRow, State, FpcSurvey, FpcSurveyResponse } from "@/lib/store";

interface Props {
  state: State;
  setState?: React.Dispatch<React.SetStateAction<State>>;
  role: Role;
  setToast: (msg: string) => void;
  go: (dest: string) => void;
  onOpenFpc?: (fpc: RecordRow) => void;
}

export default function NetworkSurveysView({
  state,
  setState,
  role,
  setToast,
  go,
  onOpenFpc
}: Props) {
  const allSurveys: FpcSurvey[] = useMemo(() => (state.records?.surveys as unknown as FpcSurvey[]) || [], [state.records?.surveys]);
  const allResponses: FpcSurveyResponse[] = useMemo(() => (state.records?.surveyResponses as unknown as FpcSurveyResponse[]) || [], [state.records?.surveyResponses]);
  const allFpcs: RecordRow[] = useMemo(() => state.records?.fpcs || [], [state.records?.fpcs]);

  // Filters
  const [fpcFilter, setFpcFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Drawer inspection
  const [selectedSurvey, setSelectedSurvey] = useState<FpcSurvey | null>(null);

  // Filtered surveys
  const filteredSurveys = useMemo(() => {
    return allSurveys.filter(s => {
      if (fpcFilter !== "ALL" && s.fpcId !== fpcFilter && s.fpcId !== "ALL") return false;
      if (categoryFilter !== "ALL" && s.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.fpcName.toLowerCase().includes(q) ||
          s.leadInvestigator.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allSurveys, fpcFilter, categoryFilter, statusFilter, searchQuery]);

  // Metrics
  const activeCount = useMemo(() => allSurveys.filter(s => s.status === "Active").length, [allSurveys]);
  const totalResponses = useMemo(() => allSurveys.reduce((acc, s) => acc + (s.responsesReceived || 0), 0), [allSurveys]);
  const avgCompletion = useMemo(() => {
    if (!allSurveys.length) return 0;
    return Math.round(allSurveys.reduce((acc, s) => acc + s.completionRate, 0) / allSurveys.length);
  }, [allSurveys]);

  const exportExcel = () => {
    const data = filteredSurveys.map(s => ({
      "Survey ID": s.id,
      "FPC Name": s.fpcName,
      "Survey Title": s.title,
      "Category": s.category,
      "Season": s.season,
      "Target Group": s.targetGroup,
      "Target Sample": s.targetSample,
      "Responses Received": s.responsesReceived,
      "Completion Rate (%)": s.completionRate,
      "Start Date": s.startDate,
      "Due Date": s.dueDate,
      "Status": s.status,
      "Lead Investigator": s.leadInvestigator
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Network Surveys");
    XLSX.writeFile(wb, `TSF_Network_Surveys_${new Date().toISOString().split("T")[0]}.xlsx`);
    setToast("Exported surveys report to Excel.");
  };

  return (
    <div className="tsf-monitoring-shell" style={{ padding: "0 4px 60px" }}>
      {/* 1. Header Bar */}
      <header className="tsf-header-bar" style={{ marginBottom: 16 }}>
        <div className="tsf-header-top">
          <div className="tsf-header-title-area">
            <div className="tsf-logo-mark" style={{ background: "#ecfdf5", color: "#166534" }}>
              <ClipboardCheck size={22} />
            </div>
            <div className="tsf-header-titles">
              <h1>
                Network Surveys &amp; Field Assessments
                <span className="tsf-badge-network">Centralized M&amp;E</span>
              </h1>
              <p>
                Multi-entity survey coordination, verified respondent tracking, and longitudinal impact assessments across 8 partner FPCs
              </p>
            </div>
          </div>

          <div className="tsf-header-actions">
            <button
              type="button"
              onClick={exportExcel}
              className="btn-outline compact"
              title="Download Excel Report"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Download size={13} /> Export Surveys (.xlsx)
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="tsf-filter-toolbar" style={{ marginTop: 12 }}>
          <div className="tsf-filter-group" style={{ flexWrap: "wrap", gap: 8 }}>
            <div className="tsf-select-wrapper">
              <select
                aria-label="Filter FPC"
                className="tsf-select-control"
                value={fpcFilter}
                onChange={(e) => setFpcFilter(e.target.value)}
              >
                <option value="ALL">🌐 All Partner FPCs (Consolidated)</option>
                {allFpcs.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="tsf-select-wrapper">
              <select
                aria-label="Filter Category"
                className="tsf-select-control"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Crop Baseline">Crop Baseline</option>
                <option value="Input Demand">Input Demand</option>
                <option value="Farmer Income">Farmer Income</option>
                <option value="Buyer Satisfaction">Buyer Satisfaction</option>
                <option value="Governance">Governance</option>
              </select>
            </div>

            <div className="tsf-select-wrapper">
              <select
                aria-label="Filter Status"
                className="tsf-select-control"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="tsf-filter-group">
            <div className="tsf-search-box">
              <Search size={14} className="text-slate-400" />
              <input
                aria-label="Search surveys"
                placeholder="Search survey title, FPC, enumerator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </div>
      </header>

      {/* 2. KPI Summary Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Surveys</span>
          <strong className="text-2xl font-bold text-slate-900 block mt-1">{allSurveys.length} Surveys</strong>
          <span className="text-xs text-slate-600">Across 8 partner FPCs</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Active Field Surveys</span>
          <strong className="text-2xl font-bold text-emerald-800 block mt-1">{activeCount} In Progress</strong>
          <span className="text-xs text-emerald-700">Currently gathering responses</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Verified Responses</span>
          <strong className="text-2xl font-bold text-slate-900 block mt-1">{totalResponses.toLocaleString()} Submissions</strong>
          <span className="text-xs text-slate-600">Farmers, Buyers &amp; Members</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Network Completion</span>
          <strong className="text-2xl font-bold text-emerald-800 block mt-1">{avgCompletion}% Complete</strong>
          <span className="text-xs text-emerald-700 font-semibold">Weighted sample progress</span>
        </div>
      </section>

      {/* 3. Central Surveys Table */}
      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-emerald-700" />
              Centralized Survey Register
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredSurveys.length} of {allSurveys.length} surveys
            </p>
          </div>
        </div>

        <div className="fpc-ws-table-wrap">
          <table className="fpc-ws-table">
            <thead>
              <tr>
                <th>Survey Title &amp; ID</th>
                <th>Target FPC</th>
                <th>Category</th>
                <th>Cohort</th>
                <th>Responses / Target</th>
                <th>Progress</th>
                <th>Season</th>
                <th>Deadline</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.map((srv) => {
                const targetFpc = allFpcs.find(f => f.id === srv.fpcId);
                return (
                  <tr
                    key={srv.id}
                    className="fpc-clickable-row"
                    onClick={() => setSelectedSurvey(srv)}
                    title="Click to view survey overview and verified responses"
                  >
                    <td>
                      <div>
                        <strong className="text-slate-900 block text-xs">{srv.title}</strong>
                        <span className="font-mono text-[11px] text-slate-500">{srv.id}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong className="text-slate-800 block text-xs">{srv.fpcName}</strong>
                        <span className="font-mono text-[11px] text-emerald-700">{srv.fpcId}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                        {srv.category}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700">{srv.targetGroup}</td>
                    <td>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {srv.responsesReceived} / {srv.targetSample}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, srv.completionRate)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{srv.completionRate}%</span>
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">{srv.season}</td>
                    <td className="text-xs text-slate-600">{srv.dueDate}</td>
                    <td>
                      <span className={`fpc-chip ${srv.status === "Active" ? "active" : srv.status === "Completed" ? "neutral" : "pending"}`}>
                        ● {srv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="em-btn compact"
                          style={{ padding: "3px 8px", fontSize: 11 }}
                          onClick={() => setSelectedSurvey(srv)}
                          title="Inspect survey specs & responses"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                        {targetFpc && onOpenFpc && (
                          <button
                            type="button"
                            className="em-btn compact primary"
                            style={{ padding: "3px 8px", fontSize: 11, background: "#166534", color: "#fff" }}
                            onClick={() => onOpenFpc(targetFpc)}
                            title={`Open ${targetFpc.name} Workspace`}
                          >
                            <Building2 size={12} /> FPC
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSurveys.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 text-xs">
                    No surveys match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Slide-over Survey Inspection Drawer */}
      {selectedSurvey && (
        <div className="fpc-drawer-backdrop" onClick={() => setSelectedSurvey(null)}>
          <aside className="fpc-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="fpc-drawer-head">
              <div>
                <span className="fpc-drawer-eyebrow">{selectedSurvey.fpcName} • FIELD SURVEY &amp; AUDIT</span>
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
                <span className="fpc-badge-readonly"><Eye size={12} /> TSF Central Monitoring</span>
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
                    Verified Respondent Records ({allResponses.filter(r => r.surveyId === selectedSurvey.id).length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Sample verified by enumerator</span>
                </div>

                <div className="space-y-2">
                  {allResponses
                    .filter(r => r.surveyId === selectedSurvey.id)
                    .map((resp) => (
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
                  {allResponses.filter(r => r.surveyId === selectedSurvey.id).length === 0 && (
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
    </div>
  );
}
