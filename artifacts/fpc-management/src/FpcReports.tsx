import { useMemo, useState } from "react";
import { Download, Printer, Search, X } from "lucide-react";
import * as XLSX from "xlsx";
import { money, type RecordRow, type State } from "@/lib/store";
import "./fpc-reports.css";

const reportNames = [
  "FPC Master Report",
  "FPC Registration Details",
  "License and Compliance Report",
  "Turnover Summary",
  "Member Statistics",
  "Board of Directors and Employee Reports",
  "Geographic Presence Report",
];

const records = (state: State, key: string): RecordRow[] => state.records?.[key] || [];
const currentFpcId = "FPC-ODI-001";

function downloadExcel(name: string, data: RecordRow[]) {
  if (!data.length) return;
  const exported = data.map(({ fpcId: _fpcId, ...row }) => row);
  const sheet = XLSX.utils.json_to_sheet(exported);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "FPC Report");
  XLSX.writeFile(workbook, `${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.xlsx`);
}

function moneyValue(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? money(number) : "—";
}

export default function FpcReports({ state, role }: { state: State; role: string }) {
  const isTsf = role === "TSF Central Admin";
  const allFpcs = records(state, "fpcs");
  const availableFpcs = isTsf ? allFpcs : allFpcs.filter(fpc => fpc.id === currentFpcId || fpc.fpcId === currentFpcId);
  const [report, setReport] = useState(reportNames[0]);
  const [fpcFilter, setFpcFilter] = useState(isTsf ? "All FPCs" : currentFpcId);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RecordRow | null>(null);

  const visibleFpcs = useMemo(() => {
    const filtered = availableFpcs.filter(fpc => fpcFilter === "All FPCs" || fpc.id === fpcFilter || fpc.fpcId === fpcFilter);
    return filtered.filter(fpc => `${fpc.id} ${fpc.name} ${fpc.location || ""}`.toLowerCase().includes(query.toLowerCase()));
  }, [availableFpcs, fpcFilter, query]);

  const rows = useMemo((): RecordRow[] => {
    if (report === "FPC Master Report") return visibleFpcs.map(fpc => ({
      id: fpc.id, code: fpc.fpcId || fpc.id, name: fpc.name, cin: fpc.details?.basic?.cin || fpc.cin || "—",
      state: fpc.details?.location?.state || fpc.state || String(fpc.location || "").split(",").pop()?.trim() || "—",
      district: fpc.details?.location?.district || fpc.district || String(fpc.location || "").split(",")[0]?.trim() || "—",
      block: fpc.details?.location?.block || fpc.block || "—", status: fpc.status,
      onboardingDate: fpc.onboardingDate || fpc.details?.onboardingDate || "—",
      farmers: fpc.farmers || records(state, "farmers").filter(farmer => farmer.fpcId === fpc.id).length || 0,
      shareholders: fpc.shareholders || records(state, "shareholders").filter(member => member.fpcId === fpc.id).length || 0,
      paidUpCapital: fpc.details?.capital?.paidUpCapital ?? fpc.details?.capital?.paidUp ?? fpc.paidUpCapital ?? 0,
      turnover: latestTurnover(fpc), lastUpdate: fpc.details?.lastUpdated || "—", fpcId: fpc.id,
    }));

    if (report === "FPC Registration Details") return visibleFpcs.flatMap(fpc => {
      const details = fpc.details || {};
      const basic = details.basic || {};
      const roc = details.roc || {};
      const capital = details.capital || {};
      const location = details.location || {};
      const turnover = details.turnovers || [];
      const licences = (details.licenses || []) as RecordRow[];
      const documents = [
        ...licences.map(license => `${license.name || license.type}: ${license.documentName || license.document || "No document listed"}`),
        ...(details.documents || []).map((doc: RecordRow) => `${doc.name}: ${doc.filename || doc.documentName || "—"}`),
      ];
      return [
        { id: `${fpc.id}-company`, field: "FPC name", value: fpc.name, fpcId: fpc.id },
        { id: `${fpc.id}-code`, field: "FPC code", value: fpc.fpcId || fpc.id, fpcId: fpc.id },
        { id: `${fpc.id}-cin`, field: "CIN", value: basic.cin || fpc.cin || "—", fpcId: fpc.id },
        { id: `${fpc.id}-pan`, field: "PAN", value: basic.pan || fpc.pan || "—", fpcId: fpc.id },
        { id: `${fpc.id}-tan`, field: "TAN", value: basic.tan || fpc.tan || "—", fpcId: fpc.id },
        { id: `${fpc.id}-gstin`, field: "GST number", value: basic.gstin || fpc.gstin || "—", fpcId: fpc.id },
        { id: `${fpc.id}-email`, field: "Contact email", value: basic.contactEmail || "—", fpcId: fpc.id },
        { id: `${fpc.id}-mobile`, field: "Contact mobile", value: basic.mobile || "—", fpcId: fpc.id },
        { id: `${fpc.id}-logo`, field: "Company mark", value: basic.logo || basic.logoName || "—", fpcId: fpc.id },
        { id: `${fpc.id}-roc`, field: "ROC office", value: roc.office || "—", fpcId: fpc.id },
        { id: `${fpc.id}-incorporation`, field: "Date of incorporation", value: roc.incorporationDate || fpc.onboardingDate || "—", fpcId: fpc.id },
        { id: `${fpc.id}-address`, field: "Registered office", value: roc.registeredAddress || location.address || fpc.location || "—", fpcId: fpc.id },
        { id: `${fpc.id}-fy`, field: "Financial year end", value: roc.financialYearEnd || "—", fpcId: fpc.id },
        { id: `${fpc.id}-agm`, field: "Last AGM date", value: roc.lastAgmDate || roc.agmDate || "—", fpcId: fpc.id },
        { id: `${fpc.id}-return`, field: "Last annual return filed", value: roc.lastAnnualReturnDate || roc.annualReturn || "—", fpcId: fpc.id },
        { id: `${fpc.id}-audit`, field: "Statutory audit", value: roc.statutoryAudit || roc.auditStatus || "—", fpcId: fpc.id },
        { id: `${fpc.id}-authorised`, field: "Authorised capital", value: moneyValue(capital.authorisedCapital ?? capital.authorised ?? fpc.authorisedCapital), fpcId: fpc.id },
        { id: `${fpc.id}-paidup`, field: "Paid-up capital", value: moneyValue(capital.paidUpCapital ?? capital.paidUp ?? fpc.paidUpCapital), fpcId: fpc.id },
        ...turnover.map((item: RecordRow, index: number) => ({ id: `${fpc.id}-turnover-${index}`, field: `Turnover ${item.year || item.financialYear || ""}`, value: moneyValue(item.amount || item.turnover), fpcId: fpc.id })),
        ...licences.map((license, index) => ({ id: `${fpc.id}-licence-${index}`, field: `${license.name || license.type} licence`, value: `${license.number || "—"} · ${license.authority || "—"} · expires ${license.expiryDate || "—"}`, fpcId: fpc.id })),
        { id: `${fpc.id}-documents`, field: "Documents", value: documents.join(" · ") || "No document names recorded", fpcId: fpc.id },
      ];
    });

    if (report === "License and Compliance Report") return visibleFpcs.flatMap(fpc => {
      const licenses = (fpc.details?.licenses || (fpc.id === currentFpcId ? records(state, "licenseRecords") : [])) as RecordRow[];
      const filings = records(state, "filings").filter(item => item.fpcId === fpc.id);
      const overdueCount = filings.filter(item => item.status === "Overdue").length;
      const licenseRows = licenses.length ? licenses.map((license, index) => ({
        id: `${fpc.id}-license-${index}`, fpc: fpc.name, licence: license.name || license.type,
        reference: license.number || "—", expiry: license.expiryDate || license.expiry || "—",
        expiryStatus: expiryLabel(license.expiryDate || license.expiry, license.status), filingStatus: filingSummary(filings),
        overdueCount, fpcId: fpc.id,
      })) : [{ id: `${fpc.id}-no-license`, fpc: fpc.name, licence: "No licence details", reference: "—", expiry: "—", expiryStatus: "Not recorded", filingStatus: filingSummary(filings), overdueCount, fpcId: fpc.id }];
      return [...licenseRows, ...filings.map((filing, index) => ({
        id: `${fpc.id}-filing-${index}`, fpc: fpc.name, licence: `Filing · ${filing.name}`,
        reference: filing.id, expiry: filing.due || "—", expiryStatus: filing.status === "Overdue" ? "Overdue" : filing.status,
        filingStatus: filing.adminStatus || filing.status || "—", overdueCount, fpcId: fpc.id,
      }))];
    });

    if (report === "Turnover Summary") return visibleFpcs.map(fpc => {
      const values = turnoverValues(fpc);
      const current = values[2];
      const previous = values[1];
      const first = values[0];
      return { id: fpc.id, fpc: fpc.name, state: fpc.details?.location?.state || fpc.state || "—", district: fpc.details?.location?.district || fpc.district || "—", fy2023: first, fy2024: values[1], fy2025: values[2], growthPercent: previous ? `${Math.round((current - previous) / previous * 100)}%` : "—", threeYearChangePercent: first ? `${Math.round((current - first) / first * 100)}%` : "—", fpcId: fpc.id };
    });

    if (report === "Member Statistics") return visibleFpcs.map(fpc => {
      const farmers = records(state, "farmers").filter(item => item.fpcId === fpc.id && item.status !== "Deleted");
      const stats = fpc.details?.memberStats || {};
      const total = Number(fpc.farmers || farmers.length || 0);
      const women = stats.womenPercent ?? (farmers.length ? Math.round(farmers.filter(item => item.gender === "Female").length / farmers.length * 100) : 42);
      return { id: fpc.id, fpc: fpc.name, farmers: total, shareholders: Number(fpc.shareholders === "—" ? 0 : fpc.shareholders || 0), womenPercent: `${women}%`, scPercent: `${stats.scPercent ?? 18}%`, stPercent: `${stats.stPercent ?? 42}%`, smallMarginalPercent: `${stats.smallMarginalPercent ?? 76}%`, fpcId: fpc.id };
    });

    if (report === "Board of Directors and Employee Reports") return visibleFpcs.flatMap(fpc => {
      const directors = (fpc.details?.directors || []) as RecordRow[];
      const employees = (fpc.details?.employees || []) as RecordRow[];
      const womenCount = directors.filter(member => member.gender === "Female").length;
      const vacancy = directors.length ? directors.length < 5 ? "Board needs 5 directors" : "No vacancy flagged" : "Director details not recorded";
      if (!directors.length && !employees.length) return [{ id: fpc.id, fpc: fpc.name, recordType: "Summary", name: "Staff and board summary", din: "—", designation: `${fpc.directorCount || 0} directors`, appointmentDate: "—", gender: "—", category: "—", mobile: "—", womenDirectors: womenCount, employees: fpc.employeeCount || 0, vacancyFlags: vacancy, fpcId: fpc.id }];
      return [
        ...directors.map((member, index) => ({ id: `${fpc.id}-director-${index}`, fpc: fpc.name, recordType: "Director", name: member.name, din: member.din || "—", designation: member.designation || "Director", appointmentDate: member.appointmentDate || "—", gender: member.gender || "—", category: member.category || "—", mobile: member.mobile || "—", womenDirectors: womenCount, employees: employees.length, vacancyFlags: vacancy, fpcId: fpc.id })),
        ...employees.map((employee, index) => ({ id: `${fpc.id}-employee-${index}`, fpc: fpc.name, recordType: "Employee", name: employee.name, din: "—", designation: employee.designation || "—", appointmentDate: employee.dateOfJoining || "—", gender: employee.gender || "—", category: "—", mobile: employee.mobile || "—", womenDirectors: womenCount, employees: employees.length, vacancyFlags: vacancy, fpcId: fpc.id })),
      ];
    });

    const groups = new Map<string, { state: string; district: string; block: string; fpcCount: number; farmers: number; turnover: number; fpcId: string }>();
    for (const fpc of visibleFpcs) {
      const stateName = fpc.details?.location?.state || fpc.state || String(fpc.location || "").split(",").pop()?.trim() || "—";
      const district = fpc.details?.location?.district || fpc.district || String(fpc.location || "").split(",")[0]?.trim() || "—";
      const block = fpc.details?.location?.block || fpc.block || "—";
      const key = `${stateName}|${district}|${block}`;
      const existing = groups.get(key) || { state: stateName, district, block, fpcCount: 0, farmers: 0, turnover: 0, fpcId: fpc.id };
      existing.fpcCount += 1;
      existing.farmers += Number(fpc.farmers || 0);
      existing.turnover += latestTurnover(fpc);
      groups.set(key, existing);
    }
    return [...groups.values()].map((item, index) => ({ id: `${item.state}-${item.district}-${item.block}-${index}`, ...item }));
  }, [report, visibleFpcs, state]);

  const filteredRows = rows.filter(row => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()));
  const totalFarmers = filteredRows.reduce((sum, row) => sum + Number(row.farmers || 0), 0);
  const totalTurnover = filteredRows.reduce((sum, row) => sum + Number(row.turnover || 0), 0);
  const tableHeaders = filteredRows.length ? Object.keys(filteredRows[0]).filter(field => field !== "fpcId" && field !== "id") : [];

  return <section className="fpc-reports">
    <header className="fr-header">
      <div><span className="fr-eyebrow">{isTsf ? "TSF · Network reporting" : "FPC administration · Reports"}</span><h2>{isTsf ? "FPC network reports" : "FPC reports"}</h2><p>Seven operational views, filtered to your access and ready to export.</p></div>
      <div className="fr-actions"><button onClick={() => downloadExcel(report, filteredRows)}><Download size={15}/> Export Excel</button><button onClick={() => window.print()}><Printer size={15}/> PDF / Print</button></div>
    </header>
    <div className="fr-toolbar">
      <div className="fr-search"><Search size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search this report"/></div>
      <select aria-label="Choose report" value={report} onChange={event => setReport(event.target.value)}>{reportNames.map(name => <option key={name}>{name}</option>)}</select>
      {isTsf && <select aria-label="Filter by FPC" value={fpcFilter} onChange={event => setFpcFilter(event.target.value)}><option>All FPCs</option>{allFpcs.map(fpc => <option key={fpc.id} value={fpc.id}>{fpc.name}</option>)}</select>}
    </div>
    {report === "Turnover Summary" && <div className="fr-chart" aria-label="Turnover summary chart">{filteredRows.map((row, index) => { const value = Number(row.fy2025 || 0); const max = Math.max(1, ...filteredRows.map(item => Number(item.fy2025 || 0))); return <div className="fr-chart-item" key={row.id}><div className="fr-bar" style={{ height: `${Math.max(8, value / max * 100)}%` }} title={money(value)}/><small>{String(row.fpc).replace(" Farmer Producer Company Ltd.", "").slice(0, 19)}</small></div>; })}</div>}
    {report === "Member Statistics" && <div className="fr-chart fr-members-chart" aria-label="Member statistics chart">{filteredRows.map(row => <div className="fr-member-chart-item" key={row.id}><div className="fr-stacked"><i style={{ width: row.womenPercent }}/><i style={{ width: row.scPercent }}/><i style={{ width: row.stPercent }}/></div><small>{row.fpc}</small><b>{row.farmers} farmers</b></div>)}</div>}
    {report === "Geographic Presence Report" && <div className="fr-tiles">{filteredRows.map(row => <button key={row.id} onClick={() => setSelected(row)}><small>{row.state}</small><b>{row.district}</b><span>{row.block}</span><strong>{row.farmers} farmers</strong><i>{row.fpcCount} FPC · {money(Number(row.turnover || 0))}</i></button>)}</div>}
    <div className="fr-card">
      <div className="fr-card-heading"><div><h3>{report}</h3><span>{filteredRows.length} rows · {isTsf ? "FPC filter applied" : "Green Valley FPC only"}</span></div>{report === "FPC Master Report" && <span>{totalFarmers.toLocaleString("en-IN")} farmers · {money(totalTurnover)} turnover</span>}</div>
      {filteredRows.length ? <div className="fr-table-wrap"><table><thead><tr>{tableHeaders.map(header => <th key={header}>{header.replaceAll(/([A-Z])/g, " $1")}</th>)}<th>Details</th></tr></thead><tbody>{filteredRows.map(row => <tr key={row.id} onClick={() => setSelected(row)}>{tableHeaders.map(header => <td key={header}>{/capital|turnover|income|expenditure/i.test(header) && typeof row[header] === "number" ? money(Number(row[header])) : String(row[header] ?? "—")}</td>)}<td><button className="fr-detail-button">Open</button></td></tr>)}</tbody></table></div> : <div className="fr-empty">No records match this report and filter.</div>}
    </div>
    {selected && <div className="fr-backdrop" onClick={() => setSelected(null)}><aside className="fr-drawer" onClick={event => event.stopPropagation()}><button className="fr-close" onClick={() => setSelected(null)} aria-label="Close report detail"><X size={18}/></button><span className="fr-eyebrow">Report detail</span><h3>{selected.name || selected.fpc || selected.field || selected.id}</h3>{Object.entries(selected).filter(([key]) => key !== "fpcId" && key !== "id").map(([key, value]) => <div className="fr-detail-row" key={key}><small>{key.replaceAll(/([A-Z])/g, " $1")}</small><b>{String(value ?? "—")}</b></div>)}</aside></div>}
  </section>;
}

function latestTurnover(fpc: RecordRow) {
  return turnoverValues(fpc)[2];
}
function turnoverValues(fpc: RecordRow): number[] {
  const entries = (fpc.details?.turnovers || []) as RecordRow[];
  if (entries.length) return entries.slice(-3).map(item => Number(item.amount || item.turnover || 0));
  const value = Number(fpc.turnover || fpc.latestTurnover || 0);
  return [0, 0, value];
}
function filingSummary(filings: RecordRow[]) {
  if (filings.some(item => item.status === "Overdue")) return "Overdue";
  return `${filings.filter(item => String(item.status).startsWith("Filed")).length} filed`;
}
function expiryLabel(expiry: unknown, fallback: unknown) {
  const date = new Date(String(expiry || ""));
  if (Number.isNaN(date.getTime())) return String(fallback || "Not recorded");
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Expired";
  if (days <= 60) return `Expiring in ${days} days`;
  return "Valid";
}
