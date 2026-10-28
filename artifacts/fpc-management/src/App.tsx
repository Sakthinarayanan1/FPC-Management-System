import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, ArrowDownLeft, ArrowUpRight, BadgeCheck, Bell, Boxes, Building2, CalendarDays, Check, ChevronDown, CircleHelp, ClipboardCheck, Copy, Download, Edit3, ExternalLink, Eye, EyeOff, FileCheck, FileText, Grid2X2, HandCoins, Landmark, Leaf, Mail, MapPin, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sprout, Star, Trash2, Truck, Users, Wallet, Wifi, WifiOff, X } from "lucide-react";
import { can, labels, navByRole, roleUsers, roles, type Role } from "@/lib/config";
import { FpcNavigation, NavigationBreadcrumbs, getActiveNavigationModule, getRoleNavigation, type NavigationNode } from "@/components/navigation";
import { convert, money, type CompanyBankAccount, type DirectorRecord, type LicenseRecord, type OfficialCompanyRegistration, initialBankAccounts, initialDirectors, initialLicences, officialCompanyRegistration, type RecordRow, type State, useDemoStore } from "@/lib/store";
import FeatureScreens from "./FeatureScreens";
import EnhancedModules from "./EnhancedModules";
import AdminModules, { SetupDashboardCard } from "./AdminModules";
import "./index.css";

const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const normalizePath=(value:string)=>decodeURIComponent(value.split("?")[0]||"/").replace(/\/+$/,"")||"/";
const matchesRoute=(route:string|undefined,path:string)=>{
 if(!route)return false;
 const routeParts=normalizePath(route).split("/").filter(Boolean),pathParts=normalizePath(path).split("/").filter(Boolean);
 return routeParts.length===pathParts.length&&routeParts.every((part,index)=>part.startsWith(":")||part===pathParts[index]);
};
const flattenedNavigation=(nodes:readonly NavigationNode[]):NavigationNode[]=>nodes.flatMap(node=>[node,...(node.children?flattenedNavigation(node.children):[])]);
const screenAliases:Record<string,string>={
 "Onboard New FPC":"FPC onboarding","Pending Approvals":"FPC pending approvals","MIS Reports":"Consolidated MIS",
  "Input Inventory":"Inventory","Cash Book":"Cash book","Bank Book":"Bank book","Receipts and Payments":"Receipts and payments","Expense Register":"Expense register","Income and Expenditure":"Income & expenditure","Statutory Calendar":"Statutory calendar","Unit Converter":"Unit converter","Commodity and Unit Master":"Commodity & unit master","Supplier Master":"Supplier master",
 "All Farmers":"Farmers","Register Farmer":"Register farmer","Baseline and Surveys":"Baseline","Multi-FPC Links":"Multi-FPC links","Deleted Farmers":"Deleted farmers",
 "All Shareholders":"Shareholders","Register Shareholder":"Register shareholder","Share Certificates":"Certificates","Dividend and Patronage":"Dividends","Share Capital Reports":"Shareholder reports",
 "Company Details":"FPC profile","Licences and Documents":"Licences","Directors and Staff":"User management","Bank Accounts":"Bank accounts","Change History":"Audit trail",
  "Advances and Dues":"Advances & Dues","Buyers and Suppliers":"Buyer master","Services":"Input supply","Produce Inventory":"Inventory",
 "Stock Movement":"Movements","Transfers and Adjustments":"Adjustments","Godowns and Units":"Godowns","Cash and Bank":"Cash book","Filing Tracker":"Filing tracker",
 "Report Library":"Reports & gallery","Users and Roles":"User management","Sync Centre":"Sync centre","Support":"Audit & support",
 "National Dashboard":"National dashboard","Finance Dashboard":"Finance dashboard","Procurement Dashboard":"Procurement dashboard","Sales Dashboard":"Sales dashboard",
 "Stock Dashboard":"Stock dashboard","Compliance Dashboard":"Compliance dashboard","Oversight Dashboard":"Oversight dashboard","Checklist Matrix":"Monitoring","FPC Journey":"Journey view",
 "My Drafts":"Data entry home","My Profile":"My profile","My Shares":"My shares","My Shareholding":"My shareholding","Dividend and Benefits":"Dividend & benefits",
 "Ledger and Payments":"Ledger & payments","Messages and Support":"Messages & support","Purchase Draft":"Purchase draft","Baseline Survey":"Baseline survey",
 "Adjustments and Transfers":"Adjustments","Units and Godowns":"Godowns","Produce":"Produce Purchase","Profile and Benefits":"Profile",
};
const screenForNode=(role:Role,node:NavigationNode|undefined)=>{
 if(!node)return undefined;
 const preferred=screenAliases[node.label]||node.label;
 return navByRole[role]?.find(label=>slug(label)===slug(preferred))||preferred;
};
const activeNavigationNode=(role:Role,path:string)=>{
 const resolvedPath=normalizePath(path)==="/fpc-profile/change-history"?"/reports/change-history":path;
 const nodes=flattenedNavigation(getRoleNavigation(role));
 return nodes.filter(node=>node.route&&!node.route.includes(":")&&matchesRoute(node.route,resolvedPath))[0]
   ||nodes.find(node=>node.route&&matchesRoute(node.route,resolvedPath))
   ||nodes.find(node=>node.detailRoute&&matchesRoute(node.detailRoute,resolvedPath));
};
const firstNavigationRoute=(role:Role)=>{
 const first=getRoleNavigation(role)[0];
 return first?.route||first?.children?.[0]?.route||"/overview";
};
const dataMap:Record<string,string>={"Farmers":"farmers","My farmers":"farmers","My profile":"farmers","Register farmer":"farmers","Shareholders":"shareholders","My shareholding":"shareholders","Shareholder register":"shareholders","Purchases":"purchases","Purchase entries":"purchases","Purchase draft":"purchases","Sales":"sales","My sales":"purchases","Sales entries":"sales","Inventory":"commodities","Stock register":"commodities","Stock":"commodities","Commodities":"commodities","Commodity & unit master":"commodities","Buyers":"buyers","Expenses":"expenses","Payments":"payments","Farmer ledger":"ledger","Ledger & payments":"ledger","Filing calendar":"filings","Compliance":"filings","Documents":"documents","My inputs":"documents","Document vault":"documents","Licences":"licenseRecords","Meetings":"meetings","FPC directory":"fpcs","FPC onboarding":"fpcs","Company information":"fpcs","Godowns":"godowns","Baseline":"baseline","Baseline survey":"baseline","Gallery":"documents","Audit trail":"audit","Audit & support":"audit","Dividend & benefits":"payments","User management":"users","Bank accounts":"companyBankAccounts"};
const enhancedScreens=new Set(["Home","Approvals","Farmers","My farmers","Register farmer","Baseline","Baseline survey","Commodity Baseline reports","Shareholders","Register shareholder","Shareholder register","Certificates","Shareholder reports","My shares","My shareholding","FPC","Meetings","Profile","Company information","Produce Purchase","Input Sale","Produce Sale","Input Purchase","Farmer Settlement","Advances & Dues","Dues","Bank statement upload","Payments and Receipts","Inventory","Stock dashboard","Stock register","Movements","Adjustments","Commodity-wise Inventory Report","Stock Movement Report","Current Stock Position","Stock Valuation Report","Network view","Reports"]);
const adminScreens=new Set(["Setup checklist","Journey view","Approvals","FPC onboarding","FPC pending approvals","FPC profile","Reports & gallery","Consolidated MIS","Finance","Buyer master","Supplier master","Farmers","Multi-FPC links","Deleted farmers","Farmer ledger","Buyer ledger","Supplier ledger","Cash book","Bank book","Receipts and payments","Expense register","Income & expenditure","Profit & loss","Compliance","Statutory calendar","Filing tracker","Meeting records","Document vault","Licences","Audit trail","Sync centre","Analytics","Unit converter","Commodity & unit master"]);
const iconFor=(label:string)=>{
 if(/farmer|member|shareholder|user/i.test(label)) return Users;
 if(/purchase|procure/i.test(label)) return ArrowDownLeft;
 if(/sales|buyer/i.test(label)) return ArrowUpRight;
 if(/stock|inventory|godown|unit/i.test(label)) return Boxes;
 if(/finance|ledger|payment|expense|dividend/i.test(label)) return Wallet;
 if(/filing|compliance|document|meeting/i.test(label)) return FileText;
 if(/report|analytics|mis/i.test(label)) return Activity;
 if(/setting|user/i.test(label)) return Settings;
 if(/audit/i.test(label)) return ShieldCheck;
 if(/field|baseline/i.test(label)) return Sprout;
 if(/approval/i.test(label)) return ClipboardCheck;
 return Grid2X2;
};

function App() {
 const state=useDemoStore(s=>s.state);
 const setState=useDemoStore(s=>s.setState);
 const resetDemo=useDemoStore(s=>s.resetDemo);
 const [path,setPath]=useLocation();
 const [search,setSearch]=useState("");
 const [modal,setModal]=useState("");
 const [toast,setToast]=useState("");
 const [menu,setMenu]=useState(false);
 const [language,setLanguage]=useState(state.language);
 const [filter,setFilter]=useState("All");
 const [page,setPage]=useState(1);
 const [staffTab,setStaffTab]=useState<"all"|"directors">("all");
 const [newRow,setNewRow]=useState<Record<string,string>>({});
 const [loginMobile,setLoginMobile]=useState("9876543210");
 const [loginOtp,setLoginOtp]=useState("123456");
 const [quantity,setQuantity]=useState("1");
 const [fromUnit,setFromUnit]=useState("tonne");
 const [toUnit,setToUnit]=useState("kg");
 const [undo,setUndo]=useState<{key:string;row:RecordRow}|null>(null);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),3000);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{
  if(normalizePath(path)==="/fpc-profile/change-history"){
   setPath("/reports/change-history",{replace:true});
  }
 },[path,setPath]);
 const role=state.role??"FPC Admin / Manager", user=roleUsers[role], nav=navByRole[role];
 const activeNode=activeNavigationNode(role,path);
 const current=decodeURIComponent(path.split("/").pop()||"overview").replace(/-/g," ");
 const currentLabel=screenForNode(role,activeNode)||nav.find(n=>slug(n)===path.split("/").pop())||nav[0];
 const title=activeNode?.label||currentLabel;
 const recordName=path.startsWith("/farmers/")&&!["/farmers/new","/farmers/deleted","/farmers/multi-fpc","/farmers/baseline"].includes(normalizePath(path))
   ? state.records.farmers.find(row=>row.id===decodeURIComponent(path.split("/").pop()||""))?.name
   : undefined;
 const isMember=role==="Farmer"||role==="Shareholder";
 const isTsf=role==="TSF Central Admin";
 const isDirectorsStaff=normalizePath(path)==="/fpc-profile/directors-staff"||activeNode?.id==="directors-staff"||title==="Directors and Staff";
 const fpcShortName=state.records.fpcs?.[0]?.name?state.records.fpcs[0].name.replace(/ Farmer Producer Company.*/," FPC"):"Green Valley FPC";
 const directorItems:DirectorRecord[]=((state.records.companyDirectors&&state.records.companyDirectors.length>0)?state.records.companyDirectors:initialDirectors) as DirectorRecord[];
 const filteredDirectors=useMemo(()=>{
  if(!search.trim())return directorItems;
  const q=search.toLowerCase();
  return directorItems.filter(d=>String(d.srNo).includes(q)||d.dinPan.toLowerCase().includes(q)||d.name.toLowerCase().includes(q)||d.designation.toLowerCase().includes(q)||d.appointmentDate.toLowerCase().includes(q)||d.cessationDate.toLowerCase().includes(q)||d.signatory.toLowerCase().includes(q));
 },[directorItems,search]);
 const exportDirectorsCsv=()=>{
  const headers=["Sr. No.","DIN/PAN","Name","Designation","Date of Appointment","Cessation Date","Signatory"];
  const rows=filteredDirectors.map(d=>[d.srNo,`"${d.dinPan}"`,`"${d.name.replaceAll('"','""')}"`,`"${d.designation}"`,`"${d.appointmentDate}"`,`"${d.cessationDate}"`,`"${d.signatory}"`]);
  const content=[headers.join(","),...rows.map(r=>r.join(","))].join("\r\n");
  const blob=new Blob(["\ufeff",content],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="green-valley-directors.csv";link.click();URL.revokeObjectURL(url);
  setToast("Director details exported as CSV");
 };
 const isBankAccounts=normalizePath(path)==="/fpc-profile/bank-accounts"||activeNode?.id==="bank-accounts"||title==="Bank Accounts";
 const bankAccountItems:CompanyBankAccount[]=((state.records.companyBankAccounts&&state.records.companyBankAccounts.length>0)?state.records.companyBankAccounts:initialBankAccounts) as CompanyBankAccount[];
 const [unmaskedAccounts,setUnmaskedAccounts]=useState<Record<string,boolean>>({});
 const filteredBankAccounts=useMemo(()=>{
  let list=bankAccountItems;
  if(filter==="Primary") list=list.filter(b=>b.isPrimary);
  else if(filter==="Active") list=list.filter(b=>b.status==="Active");
  else if(filter==="Inactive") list=list.filter(b=>b.status==="Inactive");

  if(!search.trim()) return list;
  const q=search.toLowerCase();
  return list.filter(b=>
   b.bankName.toLowerCase().includes(q)||
   b.accountHolderName.toLowerCase().includes(q)||
   b.accountNumber.includes(q)||
   b.ifscCode.toLowerCase().includes(q)||
   b.branchName.toLowerCase().includes(q)||
   (b.branchAddress&&b.branchAddress.toLowerCase().includes(q))||
   b.accountType.toLowerCase().includes(q)
  );
 },[bankAccountItems,search,filter]);
 const exportBankAccountsCsv=()=>{
  const headers=["Bank Name","Account Holder Name","Account Number","Account Type","IFSC Code","Branch Name","Branch Address","Primary","Status"];
  const rows=filteredBankAccounts.map(b=>[
   `"${b.bankName}"`,
   `"${b.accountHolderName}"`,
   `"${b.accountNumber}"`,
   `"${b.accountType}"`,
   `"${b.ifscCode}"`,
   `"${b.branchName}"`,
   `"${(b.branchAddress||"").replaceAll('"','""')}"`,
   b.isPrimary?"Yes":"No",
   b.status
  ]);
  const content=[headers.join(","),...rows.map(r=>r.join(","))].join("\r\n");
  const blob=new Blob(["\ufeff",content],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="green-valley-bank-accounts.csv";link.click();URL.revokeObjectURL(url);
  setToast("Bank account details exported as CSV");
 };
 const setPrimaryAccount=(account:CompanyBankAccount)=>{
  setState(s=>({
   ...s,
   records:{
    ...s.records,
    companyBankAccounts:bankAccountItems.map(b=>({...b,isPrimary:b.id===account.id}))
   }
  }));
  log("updated","Bank accounts",account.id,{isPrimary:false},{isPrimary:true});
  setToast(`${account.bankName} (${account.accountNumber.slice(-4)}) set as primary account`);
 };
 const deleteBankAccount=(account:CompanyBankAccount)=>{
  if(account.isPrimary&&bankAccountItems.length>1){
   setToast("Cannot delete the primary bank account. Please set another account as primary first.");
   return;
  }
  if(!confirm(`Are you sure you want to delete ${account.bankName} account ending in ${account.accountNumber.slice(-4)}?`)) return;
  setState(s=>({
   ...s,
   records:{
    ...s.records,
    companyBankAccounts:bankAccountItems.filter(b=>b.id!==account.id)
   }
  }));
  log("deleted","Bank accounts",account.id,account,null);
  setToast(`Bank account ${account.bankName} deleted`);
 };
 const editBankAccount=(account:CompanyBankAccount)=>{
  setNewRow({
   id:account.id,
   bankName:account.bankName,
   accountHolderName:account.accountHolderName,
   accountNumber:account.accountNumber,
   confirmAccountNumber:account.accountNumber,
   accountType:account.accountType,
   ifscCode:account.ifscCode,
   branchName:account.branchName,
   branchAddress:account.branchAddress||"",
   isPrimary:account.isPrimary?"Yes":"No",
   status:account.status
  });
  setModal("Edit bank account");
 };
 const isLicencesPage=normalizePath(path)==="/fpc-profile/licences"||activeNode?.id==="licences-documents"||title==="Licences and Documents"||title==="Licences";
 const licenceItems:LicenseRecord[]=((state.records.licenseRecords&&state.records.licenseRecords.length>0)?state.records.licenseRecords:initialLicences) as LicenseRecord[];
 const [copiedCin,setCopiedCin]=useState(false);
 const filteredLicences=useMemo(()=>{
  let list=licenceItems;
  if(filter==="Statutory") list=list.filter(l=>l.category==="Statutory");
  else if(filter==="Operational") list=list.filter(l=>l.category==="Operational");
  else if(filter==="Tax & Compliance") list=list.filter(l=>l.category==="Tax & Compliance");
  else if(filter==="Active") list=list.filter(l=>l.status==="Active");
  else if(filter==="Expiring soon") list=list.filter(l=>l.status==="Expiring soon");

  if(!search.trim()) return list;
  const q=search.toLowerCase();
  return list.filter(l=>
   l.name.toLowerCase().includes(q)||
   l.number.toLowerCase().includes(q)||
   l.authority.toLowerCase().includes(q)||
   (l.category&&l.category.toLowerCase().includes(q))||
   l.status.toLowerCase().includes(q)||
   l.issueDate.toLowerCase().includes(q)||
   l.expiry.toLowerCase().includes(q)
  );
 },[licenceItems,search,filter]);
 const exportLicencesCsv=()=>{
  const headers=["Sr. No.","Document / Licence Name","Category","Registration / Licence Number","Issuing Authority","Issue Date","Validity / Expiry","Status"];
  const rows=filteredLicences.map((l,idx)=>[
   idx+1,
   `"${l.name.replaceAll('"','""')}"`,
   `"${l.category||"Statutory"}"`,
   `"${l.number}"`,
   `"${l.authority.replaceAll('"','""')}"`,
   `"${l.issueDate}"`,
   `"${l.expiry}"`,
   `"${l.status}"`
  ]);
  const content=[headers.join(","),...rows.map(r=>r.join(","))].join("\r\n");
  const blob=new Blob(["\ufeff",content],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="ual-baha-fpc-licences-documents.csv";link.click();URL.revokeObjectURL(url);
  setToast("Licence and document records exported as CSV");
 };
 const deleteLicence=(licence:LicenseRecord)=>{
  if(!confirm(`Are you sure you want to delete ${licence.name}?`)) return;
  setState(s=>({
   ...s,
   records:{
    ...s.records,
    licenseRecords:licenceItems.filter(l=>l.id!==licence.id)
   }
  }));
  log("deleted","Licences",licence.id,licence,null);
  setToast(`Document record ${licence.name} deleted`);
 };
 const editLicence=(licence:LicenseRecord)=>{
  setNewRow({
   id:licence.id,
   name:licence.name,
   category:licence.category||"Statutory",
   number:licence.number,
   authority:licence.authority,
   issueDate:licence.issueDate,
   expiry:licence.expiry,
   status:licence.status,
   documentName:licence.documentName||""
  });
  setModal("Edit licence / document");
 };
 const copyCinToClipboard=()=>{
  if(navigator?.clipboard?.writeText){
   navigator.clipboard.writeText(officialCompanyRegistration.cin);
   setCopiedCin(true);
   setTimeout(()=>setCopiedCin(false),2000);
   setToast("CIN copied to clipboard: " + officialCompanyRegistration.cin);
  } else {
   setToast("CIN: " + officialCompanyRegistration.cin);
  }
 };
 const recordKey=dataMap[currentLabel]||dataMap[current]||"";
 const items=recordKey==="audit"?state.audit:state.records[recordKey]||[];
 const filtered=useMemo(()=>items.filter(row=>row.status!=="Deleted").filter(row=>Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase())).filter(row=>filter==="All"||row.status===filter),[items,search,filter]);
 const setRole=(next:Role)=>{setState(s=>({...s,role:next}));setPath(firstNavigationRoute(next));setPage(1);setSearch("");setFilter("All");setStaffTab("all");setMenu(false);setToast(`Demo role changed to ${next}`)};
 useEffect(()=>{
  if(!state.role)return;
  if(activeNavigationNode(role,path))return;
  const oldSlug=slug(normalizePath(path).split("/").pop()||"");
  const nodes=flattenedNavigation(getRoleNavigation(role));
  const legacy=nodes.find(node=>slug(node.label)===oldSlug||slug(screenForNode(role,node)||"")===oldSlug);
  if(legacy?.route){setPath(legacy.route);return}
  const oldScreen=navByRole[role].find(label=>slug(label)===oldSlug);
  const matching=oldScreen?nodes.find(node=>slug(screenForNode(role,node)||"")===slug(oldScreen)):undefined;
  setPath(matching?.route||firstNavigationRoute(role));
 },[role,path,state.role,setPath]);
 const log=(action:string,module:string,record:string,oldValue?:unknown,newValue?:unknown)=>{
  setState(s=>({...s,audit:[{id:`AUD-${Date.now()}`,actor:user.name,role,action,module,record,oldValue:oldValue?JSON.stringify(oldValue):"",newValue:newValue?JSON.stringify(newValue):"",date:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})},...s.audit]}));
 };
 const editRecord=(row:RecordRow)=>{
  const key=recordKey;if(!key)return;
  const field=typeof row.quantity==="number"?"quantity":"name";
  const next=prompt(`Update ${field}`,String(row[field]??""));if(next===null||!next.trim())return;
  const value=field==="quantity"?Number(next):next;
  setState(s=>({...s,records:{...s.records,[key]:s.records[key].map(r=>r.id===row.id?{...r,[field]:value}:r)}}));
  log("edited",currentLabel,row.id,row[field],value);setToast(`${row.id} updated`);
 };
 const softDelete=(row:RecordRow)=>{
  const key=recordKey;if(!key)return;
  if(row.status==="Approved"&&!prompt("Type a reason for removing this approved record"))return;
  if(row.status!=="Approved"&&!confirm(`Remove ${row.id} from this list?`))return;
  setUndo({key,row});setState(s=>({...s,records:{...s.records,[key]:s.records[key].map(r=>r.id===row.id?{...r,status:"Deleted"}:r)}}));log("soft-deleted",currentLabel,row.id,row.status,"Deleted");setToast(`${row.id} moved to deleted · Undo`);
 };
 const undoDelete=()=>{if(!undo)return;setState(s=>({...s,records:{...s.records,[undo.key]:s.records[undo.key].map(r=>r.id===undo.row.id?undo.row:r)}}));log("restored",currentLabel,undo.row.id,"Deleted",undo.row.status);setUndo(null);setToast("Record restored")};
  const updateStatus=(row:RecordRow,status:string,reason?:string)=>{
  const key=dataMap[currentLabel]||recordKey||(row.id.startsWith("PUR-")?"purchases":row.id.startsWith("SAL-")?"sales":row.id.startsWith("F-")?"farmers":row.id.startsWith("SH-")?"shareholders":row.id.startsWith("EXP-")?"expenses":row.id.startsWith("FIL-")?"filings":row.id.startsWith("ADJ-")?"adjustments":"");
  if(!key)return;
  setState(s=>{const list=s.records[key]||[];const exists=list.some(r=>r.id===row.id);return {...s,records:{...s.records,[key]:exists?list.map(r=>r.id===row.id?{...r,status}:r):[{...row,status},...list]},notifications:[{id:`NT-${Date.now()}`,title:`${row.id} ${status.toLowerCase()}`,date:"Just now",status:"Unread"},...s.notifications]}});
  log(status.toLowerCase(),currentLabel,row.id,row.status,reason?{status,reason}:status);
  if(key==="purchases"&&status==="Approved"){
   const kg=convert(Number(row.quantity),row.unit||"kg","kg");
   setState(s=>({...s,records:{...s.records,commodities:s.records.commodities.map(c=>c.name===row.commodity?{...c,stock:Number(c.stock)+kg}:c)}}));
   setToast(`Purchase approved · ${kg.toLocaleString("en-IN")} kg added to stock`);
  } else if(key==="sales"&&status==="Approved"){
   const kg=convert(Number(row.quantity),row.unit||"kg","kg");
   setState(s=>({...s,records:{...s.records,commodities:s.records.commodities.map(c=>c.name===row.commodity?{...c,stock:Math.max(0,Number(c.stock)-kg)}:c)}}));
   setToast(`Sale approved · ${kg.toLocaleString("en-IN")} kg deducted from stock`);
  } else setToast(`${row.id} marked ${status.toLowerCase()}`);
 };
 const openCreate=(kind:string,initialRow:Record<string,string>={})=>{setNewRow(initialRow);setModal(kind)};
 const saveNew=()=>{
    if(modal==="Add bank account"||modal==="Edit bank account"){
      const isEdit=modal==="Edit bank account";
      if(!newRow.bankName?.trim()||!newRow.accountHolderName?.trim()||!newRow.accountNumber?.trim()||!newRow.ifscCode?.trim()||!newRow.branchName?.trim()){
        setToast("Complete all required fields before saving");
        return;
      }
      const accNum=newRow.accountNumber.trim();
      if(!/^\d{9,18}$/.test(accNum)){
        setToast("Account number must be 9 to 18 digits");
        return;
      }
      if(!isEdit){
        if(!newRow.confirmAccountNumber?.trim()||newRow.confirmAccountNumber.trim()!==accNum){
          setToast("Account numbers do not match");
          return;
        }
      }
      const ifsc=newRow.ifscCode.trim().toUpperCase();
      if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)){
        setToast("Invalid IFSC format (e.g. SBIN0001234)");
        return;
      }
      const duplicate=bankAccountItems.some(b=>(!isEdit||b.id!==newRow.id)&&b.accountNumber===accNum);
      if(duplicate){
        setToast(`Bank account with number ${accNum} already exists`);
        return;
      }
      const isPrimary=newRow.isPrimary==="Yes"||bankAccountItems.length===0;
      const accountId=isEdit&&newRow.id?newRow.id:`BANK-${String(Date.now()).slice(-4)}`;
      const savedAccount:CompanyBankAccount={
        id:accountId,
        bankName:newRow.bankName.trim(),
        accountHolderName:newRow.accountHolderName.trim(),
        accountNumber:accNum,
        accountType:(newRow.accountType as any)||"Current",
        ifscCode:ifsc,
        branchName:newRow.branchName.trim(),
        branchAddress:newRow.branchAddress?.trim()||undefined,
        isPrimary,
        status:(newRow.status as any)||"Active",
        fpcId:"FPC-ODI-001",
        createdAt:isEdit?(bankAccountItems.find(b=>b.id===accountId)?.createdAt||"14 Jun 2021"):"Today",
      };
      setState(s=>{
        let list=bankAccountItems;
        if(isEdit){
          list=list.map(b=>b.id===accountId?savedAccount:b);
        } else {
          list=[savedAccount,...list];
        }
        if(isPrimary){
          list=list.map(b=>b.id===accountId?{...b,isPrimary:true}:{...b,isPrimary:false});
        }
        return {
          ...s,
          records:{
            ...s.records,
            companyBankAccounts:list
          }
        };
      });
      log(isEdit?"updated":"created","Bank accounts",savedAccount.id,null,savedAccount);
      if(state.offline) setState(s=>({...s,syncQueue:[{id:`SYNC-${Date.now()}`,type:modal,record:savedAccount.id,status:"Pending sync"},...s.syncQueue]}));
      setModal("");
      setToast(state.offline?"Saved offline · Pending sync":`Bank account ${isEdit?"updated":"added"} successfully · ${savedAccount.bankName}`);
      return;
    }
    if(modal.toLowerCase().includes("licence")||modal.toLowerCase().includes("document")){
      if(!newRow.name?.trim()||!newRow.number?.trim()||!newRow.authority?.trim()){
        setToast("Complete the required document details before saving");
        return;
      }
      const isEdit=Boolean(newRow.id);
      const licenceId=newRow.id||`LIC-${Date.now().toString().slice(-4)}`;
      const savedLicence:LicenseRecord={
        id:licenceId,
        name:newRow.name.trim(),
        category:(newRow.category as any)||"Statutory",
        number:newRow.number.trim(),
        authority:newRow.authority.trim(),
        issueDate:newRow.issueDate?.trim()||"17/07/2024",
        expiry:newRow.expiry?.trim()||"Permanent",
        status:(newRow.status as any)||"Active",
        documentName:newRow.documentName?.trim()||`${newRow.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.pdf`,
        fpcId:"FPC-ODI-001",
      };
      setState(s=>({
        ...s,
        records:{
          ...s.records,
          licenseRecords:isEdit?licenceItems.map(l=>l.id===licenceId?savedLicence:l):[savedLicence,...licenceItems]
        }
      }));
      log(isEdit?"updated":"created","Licences",savedLicence.id,null,savedLicence);
      if(state.offline) setState(s=>({...s,syncQueue:[{id:`SYNC-${Date.now()}`,type:modal,record:savedLicence.id,status:"Pending sync"},...s.syncQueue]}));
      setModal("");
      setToast(state.offline?"Saved offline · Pending sync":`Document ${isEdit?"updated":"added"} successfully · ${savedLicence.name}`);
      return;
    }
    if(modal.toLowerCase().includes("user")){
      if(newRow.role==="Director"){
        if(!newRow.name?.trim()||!newRow.dinPan?.trim()||!newRow.appointmentDate?.trim()){
          setToast("Complete the required fields before saving");
          return;
        }
        const dinPanClean=newRow.dinPan.trim();
        if(directorItems.some(d=>d.dinPan.trim().toLowerCase()===dinPanClean.toLowerCase())){
          setToast(`Director with DIN/PAN ${dinPanClean} already exists`);
          return;
        }
        const nextSrNo=directorItems.reduce((max,d)=>Math.max(max,Number(d.srNo)||0),0)+1;
        const formatAppt=newRow.appointmentDate.includes("-")?newRow.appointmentDate.split("-").reverse().join("/"):newRow.appointmentDate;
        const formatCess=newRow.cessationDate?(newRow.cessationDate.includes("-")?newRow.cessationDate.split("-").reverse().join("/"):newRow.cessationDate):"-";
        const newDirector:DirectorRecord={
          id:`DIR-${Date.now().toString().slice(-4)}`,
          srNo:nextSrNo,
          dinPan:dinPanClean,
          name:newRow.name.trim().toUpperCase(),
          designation:"Director",
          appointmentDate:formatAppt,
          cessationDate:formatCess||"-",
          signatory:newRow.signatory==="No"?"No":"Yes",
          fpcId:"FPC-ODI-001"
        };
        setState(s=>({...s,records:{...s.records,companyDirectors:[...directorItems,newDirector]}}));
        setStaffTab("directors");
        log("created","Directors and Staff",newDirector.id,null,newDirector);
        if(state.offline) setState(s=>({...s,syncQueue:[{id:`SYNC-${Date.now()}`,type:"Add director",record:newDirector.id,status:"Pending sync"},...s.syncQueue]}));
        setModal("");
        setToast(state.offline?"Saved offline · Pending sync":`Director added successfully · ${newDirector.name}`);
        return;
      }
      if(!newRow.name?.trim()||!newRow.mobile?.trim()||!newRow.role?.trim()){
        setToast("Complete the required fields before saving");
        return;
      }
    }
   const type=modal.toLowerCase().includes("message")?"messages":modal.toLowerCase().includes("user")?"users":modal.toLowerCase().includes("purchase")?"purchases":modal.toLowerCase().includes("sale")?"sales":modal.toLowerCase().includes("farmer")?"farmers":modal.toLowerCase().includes("share")?"shareholders":modal.toLowerCase().includes("fil")?"filings":modal.toLowerCase().includes("expense")?"expenses":modal.toLowerCase().includes("payment")?"payments":modal.toLowerCase().includes("buyer")?"buyers":modal.toLowerCase().includes("godown")?"godowns":modal.toLowerCase().includes("baseline")?"baseline":modal.toLowerCase().includes("commodity")?"commodities":"documents";
   const required=type==="purchases"?["farmer","commodity","quantity","rate"]:type==="sales"?["buyer","commodity","quantity","rate"]:type==="farmers"?["name","mobile"]:type==="shareholders"?["name","shares"]:type==="payments"?["amount"]:[];
   if(required.some(field=>!newRow[field]?.trim())){setToast("Complete the required fields before saving");return}
    if((type==="purchases"||type==="sales")&&!["kg","quintal","tonne","bag"].includes(newRow.unit||"kg")){setToast("Choose kg, quintal, tonne or bag for quantity");return}
    if(type==="purchases"||type==="sales"){
     const enteredQuantity=Number(newRow.quantity||0);
     const unit=newRow.unit||"kg";
     if(!Number.isFinite(enteredQuantity)||enteredQuantity<=0){setToast("Quantity must be greater than zero");return}
     if(!Number.isFinite(Number(newRow.rate))||Number(newRow.rate)<=0){setToast("Rate must be greater than zero");return}
     if(type==="sales"){
      const kg=convert(enteredQuantity,unit,"kg");
      const commodity=state.records.commodities.find(c=>c.name===newRow.commodity);
      if(!commodity){setToast("Choose a commodity from the list");return}
      if(kg>Number(commodity.stock)){setToast(`Not enough stock. Available: ${Number(commodity.stock).toLocaleString("en-IN")} kg`);return}
     }
    }
  const idPrefix=type==="purchases"?"PUR-2026-":type==="sales"?"SAL-2026-":type==="farmers"?"F-":type==="shareholders"?"SH-":type==="payments"?"PAY-":type==="expenses"?"EXP-":type==="filings"?"FIL-":type==="users"?"USR-":"REC-";
   const targetStatus=type==="payments"?"Paid":type==="users"?"Active":"Submitted";
   const row:RecordRow={id:`${idPrefix}${String(Date.now()).slice(-4)}`,fpcId:"FPC-ODI-001",status:state.offline?"Draft":targetStatus,...(state.offline?{pendingStatus:targetStatus}:{}),date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),...(type==="users"?{lastLogin:"Just now"}:{}),...newRow};
   if(type==="purchases"||type==="sales"){row.quantity=Number(newRow.quantity||0);row.rate=Number(newRow.rate||0);row.unit=newRow.unit||"kg";row.quantityKg=convert(row.quantity,row.unit,"kg");row.amount=row.quantityKg*row.rate}
  if(type==="shareholders"){row.shares=Number(newRow.shares||0);row.faceValue=100;row.capital=row.shares*100;row.certificate=`SC-${row.id.slice(-3)}`;row.folio=`FL-${row.id.slice(-3)}`}
   if(type==="sales"){const commodity=state.records.commodities.find(c=>c.name===row.commodity);row.cost=Number(row.quantityKg||0)*Number(commodity?.purchaseRate||0);row.margin=row.amount-row.cost;}
  setState(s=>({...s,records:{...s.records,[type]:[row,...(s.records[type]||[])]}}));if(type==="users")setStaffTab("all");
  if(type==="payments"){
   const amount=Number(newRow.amount||0);const farmer=newRow.farmer||"Ravi Kumar";
    setState(s=>({...s,records:{...s.records,ledger:[{id:`LED-${Date.now()}`,farmer,farmerId:farmer==="Ravi Kumar"?"F-001":"",date:row.date,description:`Payment · ${row.id}`,debit:amount,credit:0,balance:0},...s.records.ledger]}}));
  }
  log("created",type==="users"?"Directors and Staff":type,row.id,null,row);
  if(state.offline) setState(s=>({...s,syncQueue:[{id:`SYNC-${Date.now()}`,type:modal,record:row.id,status:"Pending sync"},...s.syncQueue]}));
  setModal("");setToast(state.offline?"Saved offline · Pending sync":type==="users"?`User added successfully · ${row.name}`:"Draft saved successfully");
 };
 const reset=()=>{resetDemo();setPath("/overview");setModal("");setToast("Demo data reset to original seed")};

 if(!state.role){
   return <div className="login-page"><div className="login-panel"><div className="brand-mark"><Leaf size={21}/></div><div className="eyebrow">FIELD OPERATIONS · DEMO ENVIRONMENT</div><h1>Good work<br/><em>starts here.</em></h1><p className="login-intro">A practical operations desk for Green Valley Farmer Producer Company.</p><div className="login-form"><label>Mobile number</label><input placeholder="Enter your mobile number" value={loginMobile} onChange={e=>setLoginMobile(e.target.value)}/><label>One-time password</label><div className="otp-row"><input aria-label="One-time password" placeholder="6-digit OTP" maxLength={6} value={loginOtp} onChange={e=>setLoginOtp(e.target.value.replace(/\D/g,"").slice(0,6))}/><span>Demo OTP<br/><b>123456</b></span></div><button className="btn-primary" onClick={()=>{if(loginMobile.trim()&&/^\d{6}$/.test(loginOtp))setRole("FPC Admin / Manager");else setToast("Enter a mobile number and any 6-digit OTP")}}>Continue with OTP</button><p className="hint">Any 6-digit OTP works in this prototype.</p></div></div><div className="role-panel"><div className="eyebrow">DEMO ROLE PICKER <span>12 profiles</span></div><h2>Choose a workspace</h2><p>Jump straight into a role-specific view. No password needed.</p><div className="role-grid">{roles.map((r,i)=>{const Icon=iconFor(r);return <button className="role-card" key={r} onClick={()=>setRole(r)} data-testid={`role-${slug(r)}`}><span className={`role-icon role-tone-${i%6}`}><Icon size={18}/></span><span><b>{r}</b><small>{roleUsers[r].name} · {roleUsers[r].mobile}</small></span><span className="role-arrow">↗</span></button>})}</div><footer>FPC Development Project, supported by Citibank. Implemented with Tata Steel Foundation.</footer></div></div>
 }

 const routeFor=(name:string)=>{
  const nodes=flattenedNavigation(getRoleNavigation(role));
  const target=nodes.find(node=>slug(node.label)===slug(name)||slug(screenForNode(role,node)||"")===slug(name));
  if(target?.route)return target.route;
  const group=nodes.find(node=>node.children&&slug(node.label)===slug(name));
  return group?.children?.[0]?.route||`/${slug(name)}`;
 };
 const totals={
 farmers:state.records.farmers.length, shareholders:state.records.shareholders.length,
 purchaseTotal:state.records.purchases.reduce((a,r)=>a+Number(r.amount||0),0),
 salesTotal:state.records.sales.reduce((a,r)=>a+Number(r.amount||0),0),
 stock:state.records.commodities.reduce((a,r)=>a+Number(r.stock||0),0),
 };
 const dashboard=["Overview","Finance dashboard","Procurement dashboard","Sales dashboard","Stock dashboard","Data entry home","Field home","Compliance dashboard","Oversight dashboard","National dashboard","Home"].includes(currentLabel);
   const featureScreen=(screen:string)=>{
    const go=(name:string)=>setPath(routeFor(name));
    if((role==="FPC Admin / Manager"||role==="TSF Central Admin")&&adminScreens.has(screen)){
     const adminModule=<AdminModules state={state} setState={setState} role={role} screen={screen} setToast={setToast} go={go}/>;
     if(adminModule)return adminModule;
    }
    return enhancedScreens.has(screen)?<EnhancedModules state={state} setState={setState} role={role} screen={screen} setToast={setToast} go={go}/>:<FeatureScreens state={state} setState={setState} role={role} screen={screen} setToast={setToast} go={go}/>;
   };
 const renderDash=()=>{
   if(isMember)return featureScreen(currentLabel);
   if(role==="Procurement / Purchase Officer")return featureScreen("Procurement dashboard");
   const kpis=isTsf
    ? [["FPCs onboarded","8","Across Odisha & Jharkhand"],["Active farmers","977","Across all FPCs"],["Shareholders","1,184","Members served"],["Procurement this year","2,486 t","Across 8 FPCs"]]
    : role==="Accountant / Finance Officer"
    ? [["Bank balance",money(842000),"SBI · Keonjhar"],["Farmer payables",money(235000),"Across 18 members"],["Buyer receivables",money(610000),"Across 4 buyers"],["Purchases · FY to date",money(4180000),"1,248 purchase entries"]]
    : role==="Inventory / Stock Manager"
    ? [["Stock value",money(1480000),"Across 2 godowns"],["Available stock",`${totals.stock.toLocaleString("en-IN")} kg`,"5 commodities"],["Low-stock items","1","Arhar · threshold 2,500 kg"],["Godown capacity","61%","Main Godown"]]
    : role==="Sales / Marketing Officer"
    ? [["Sales this month","18",money(1265000)],["Buyer receivables",money(610000),"4 buyers"],["Gross margin",money(50000),"Core sale"],["Active buyers","4","Across Odisha"]]
    : role==="Field Staff"
    ? [["Visits today","6","3 villages"],["Pending sync",`${state.syncQueue.filter(r=>r.status==="Pending sync").length}`,"Local records"],["Farmers visited","14","This week"],["Baseline surveys","3","Kharif 2026"]]
    : role==="Data Entry Operator"
    ? [["My drafts","12","4 farmers · 5 purchase"],["Submitted today","8","Awaiting review"],["Rejected entries","2","Need your attention"],["Pending sync",`${state.syncQueue.filter(r=>r.status==="Pending sync").length}`,"Offline queue"]]
    : role==="Compliance / Documentation Officer"
    ? [["Compliance health","78%","2 items need attention"],["Filed","18","This financial year"],["Due soon","3","Within 30 days"],["Overdue","1","GSTR-3B · September"]]
    : role==="Director / Board Member / Auditor"
    ? [["Paid-up capital",money(620000),"62 shareholders"],["Turnover",money(4965000),"FY 2026–27 to date"],["Surplus",money(145000),"Before tax"],["Compliance health","78%","View source"]]
    : [["Farmers",`${totals.farmers}`,"100 active in Green Valley"],["Shareholders",`${totals.shareholders}`,`Paid-up capital ${money(620000)}`],["Purchases this month",money(986500),"42 entries this month"],["Sales this month",money(1265000),"18 buyer transactions"],["Stock value",money(1480000),"Across 2 godowns"],["Farmer payables",money(235000),"Outstanding balance"],["Buyer receivables",money(610000),"Across 4 buyers"],["Pending approvals","7","3 purchases · 2 farmers"]];
   return <><div className="metric-grid">{kpis.map(([label,value,sub],i)=><div className={`metric-card metric-${i}`} key={label}><div className="metric-label">{label}</div><strong>{value}</strong><small>{sub}</small><span className="metric-spark">{[34,58,44,76,52,83,64].map((v,j)=><i key={j} style={{height:`${v}%`}}/>)}</span></div>)}</div>
   {role==="FPC Admin / Manager"&&<SetupDashboardCard state={state} go={(name)=>setPath(routeFor(name))}/>}
  {isTsf?<div className="dashboard-columns"><section className="surface chart-panel"><PanelHead title="FPC monitoring" sub="Activity across 8 partner FPCs" action="View all" onClick={()=>setPath(routeFor("Monitoring"))}/><div className="mini-table">{state.records.fpcs.slice(0,5).map((f,i)=><div className="monitor-row" key={f.id}><span className={`monitor-dot dot-${i<3?"good":i===3?"warn":"bad"}`}/><b>{f.name}</b><small>{f.location}</small><span className="status-text">{f.status}</span></div>)}</div></section><section className="surface action-panel"><PanelHead title="Needs attention" sub="Follow up with your FPC partners"/><Attention title="Gonda FPC has not synced" detail="12 days since last data sync"/><Attention title="Barbil · 2 filings overdue" detail="Compliance follow-up required"/><Attention title="Seraikela onboarding" detail="60% complete · 3 steps remain"/><button className="btn-outline full" onClick={()=>setToast("Reminder sent to FPC admin")}>Send reminder</button></section></div>:<div className="dashboard-columns"><section className="surface chart-panel"><PanelHead title={isMember?"Your season so far":"Procurement & sales"} sub={isMember?"Your produce and payment history":"Monthly activity · FY 2026–27"} action="View report" onClick={()=>setPath(routeFor(nav.find(x=>/report/i.test(x))||"Reports"))}/><div className="chart-legend"><span><i className="legend-green"/> Purchases</span><span><i className="legend-amber"/> Sales</span></div><div className="bar-chart">{Array.from({length:12},(_,i)=><div className="bar-group" key={i}><div className="bars"><i style={{height:`${28+((i*19)%54)}%`}}/><i style={{height:`${22+((i*31)%61)}%`}}/></div><small>{["Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"][i]}</small></div>)}</div><div className="chart-caption"><span><strong>{money(totals.purchaseTotal)}</strong> purchases recorded</span><span><strong>{money(totals.salesTotal)}</strong> sales recorded</span></div></section><section className="surface action-panel"><PanelHead title={role==="Field Staff"?"Today’s field visits":"Needs your action"} sub={role==="Field Staff"?"3 villages · 14 member visits":"Items waiting for your review"}/>{role==="Field Staff"?["Green Valley · 6 farmers","Pitamahal · 5 farmers","Telkoi · 3 farmers"].map(x=><Attention key={x} title={x} detail="Visit planned · Kharif season"/>):[["3 purchase entries", "Rs 84,750 · Procurement"],["2 farmer registrations","KYC review needed"],["1 stock adjustment","Arhar · Main Godown"],["1 expense claim","Transport · Rs 8,400"]].map(([a,b])=><Attention key={a} title={a} detail={b} onClick={()=>setPath(routeFor("Approvals"))}/>)}<button className="btn-outline full" onClick={()=>setPath(routeFor(role==="Field Staff"?"Register farmer":"Approvals"))}>{role==="Field Staff"?"Start a field visit":"Open approval inbox"} <span>→</span></button></section></div>}
  <div className="dashboard-columns lower"><section className="surface"><PanelHead title="Stock at a glance" sub="Main Godown · Keonjhar" action="Stock register" onClick={()=>setPath(routeFor("Stock register"))}/><div className="stock-list">{state.records.commodities.slice(0,5).map(c=><div className="stock-row" key={c.id}><span className="commodity-dot"/><b>{c.name}</b><div className="stock-meter"><i style={{width:`${Math.min(100,Number(c.stock)/600)}%`}}/></div><strong>{Number(c.stock).toLocaleString("en-IN")} kg</strong>{Number(c.stock)<Number(c.threshold)&&<small className="alert-tag">Low</small>}</div>)}</div></section><section className="surface"><PanelHead title="Compliance calendar" sub="Upcoming statutory deadlines" action="View calendar" onClick={()=>setPath(routeFor("Filing calendar"))}/>{state.records.filings.slice(2,5).map(f=><div className="filing-line" key={f.id}><span className={`filing-icon ${(f.status??"").includes("Overdue")?"overdue":""}`}><CalendarDays size={16}/></span><span><b>{f.name}</b><small>Due {f.due}</small></span><Status status={f.status}/></div>)}</section></div></>;
 };
 const listView=()=>{
    const dedicated=["Sell produce","Buy inputs","Wallet","Transaction history","FPC rates","Market rates","Market intelligence","Update rates","My sales","Register farmer","Farmers","My farmers","Multi-FPC links","Deleted farmers","Baseline","Baseline survey","Commodity Baseline reports","Register shareholder","Shareholders","Shareholder register","Certificates","My shares","My shareholding","Dividend & benefits","FPC","Meetings","Profile","Company information","Shareholder reports","Reports","Reports & gallery","Consolidated MIS","Input supply","Wallet transactions","Farmer ledger","Buyer ledger","Supplier ledger","Cash book","Bank book","Receipts and payments","Expense register","Income & expenditure","Profit & loss","Analytics","Setup checklist","Journey view","Buyer master","Supplier master","Compliance","Statutory calendar","Filing tracker","Meeting records","Document vault","Audit trail","Sync centre","Finance","Ledger & payments","Purchase entries","Sales entries","Produce Purchase","Input Sale","Produce Sale","Input Purchase","Farmer Settlement","Advances & Dues","Dues","Bank statement upload","Payments and Receipts","Inventory","Stock dashboard","Stock register","Movements","Adjustments","Commodity-wise Inventory Report","Stock Movement Report","Current Stock Position","Stock Valuation Report","Network view","Approvals"];
   if(dedicated.includes(currentLabel)){const content=featureScreen(currentLabel);if(content)return content;}
  if(currentLabel==="Approvals")return <ApprovalInbox rows={state.records.purchases.filter(r=>r.status==="Submitted").slice(0,3).concat(state.records.farmers.filter(r=>r.status==="Submitted").slice(0,2),[{id:"ADJ-009",farmer:"Main Godown",commodity:"Arhar stock adjustment",amount:280,status:"Submitted",date:"Today"},{id:"EXP-009",name:"Transport expense",amount:8400,status:"Submitted",date:"Today"}])} onAction={updateStatus}/>;
  if(currentLabel==="Unit converter")return <section className="surface converter"><div><span className="eyebrow">QUANTITY CONVERSION</span><h2>One stock ledger. Every unit.</h2><p>Conversions use the FPC unit master. Weight conversion: kg base.</p><div className="converter-controls"><input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)}/><select value={fromUnit} onChange={e=>setFromUnit(e.target.value)}>{["g","kg","quintal","tonne","bag"].map(u=><option key={u}>{u}</option>)}</select><span>to</span><select value={toUnit} onChange={e=>setToUnit(e.target.value)}>{["g","kg","quintal","tonne","bag"].map(u=><option key={u}>{u}</option>)}</select></div><div className="convert-result">{Number(convert(Number(quantity||0),fromUnit,toUnit).toFixed(2)).toLocaleString("en-IN")} <span>{toUnit}</span></div><p className="helper">1 bag = 50 kg · 1 quintal = 100 kg · 1 tonne = 1,000 kg</p></div></section>;
  const isAudit=currentLabel==="Audit trail"||currentLabel==="Audit & support";
  const columns=filtered.length?Object.keys(filtered[0]).filter(k=>!["fpcId","oldValue","newValue"].includes(k)).slice(0,6):[];
   const createLabel=["Farmers","Register farmer","My farmers"].includes(currentLabel)?"Register farmer":currentLabel.includes("Purchase")?"New purchase":currentLabel.includes("Sales")?"New sale":currentLabel.includes("Shareholder")?"Register shareholder":currentLabel.includes("Expense")?"Add expense":currentLabel.includes("Payment")?"Record payment":currentLabel.includes("Filing")?"Add filing":currentLabel.includes("Buyer")?"Add buyer":currentLabel.includes("Godown")?"Add godown":currentLabel.toLowerCase().includes("user")?"Add user":currentLabel.toLowerCase().includes("commodity")?"Add commodity":currentLabel.toLowerCase().includes("baseline")?"Add baseline survey":"Add record";
  const canCreate=can(role,currentLabel,"C")&&!["Director / Board Member / Auditor","Farmer","Shareholder"].includes(role);
  const displayRows=role==="Farmer"||role==="Shareholder"?filtered.filter(r=>r.farmerId==="F-001"||r.id==="PUR-2026-0001"):filtered;
  const pageRows=displayRows.slice((page-1)*14,page*14);
  const pageCount=Math.max(1,Math.ceil(displayRows.length/14));
  const isDirectorsTab=isDirectorsStaff&&staffTab==="directors";
  const pageDirectorRows=filteredDirectors.slice((page-1)*14,page*14);
  const directorPageCount=Math.max(1,Math.ceil(filteredDirectors.length/14));
  return <section className="surface table-surface">
  {isDirectorsStaff&&<div className="table-tabs">
    <button type="button" className={staffTab==="all"?"selected":""} onClick={()=>{setStaffTab("all");setPage(1)}}>All Users</button>
    <button type="button" className={staffTab==="directors"?"selected":""} onClick={()=>{setStaffTab("directors");setPage(1)}}>Directors</button>
  </div>}
  <div className="table-toolbar">
    <div>
      <h2>{isBankAccounts?"Bank Accounts":isDirectorsTab?"Company Directors":currentLabel}</h2>
      <p>{isAudit?"A complete, tamper-evident record of actions":isBankAccounts?"Manage registered bank account details for Green Valley Farmer Producer Company.":isDirectorsTab?`${filteredDirectors.length} directors · ${fpcShortName}`:`${displayRows.length} records · ${fpcShortName}`}</p>
    </div>
    <div className="toolbar-actions">
      <div className="searchbox"><Search size={15}/><input aria-label={isBankAccounts?"Search bank accounts":isDirectorsTab?"Search directors":"Search records"} placeholder={isBankAccounts?"Search bank, account, IFSC, branch":isDirectorsTab?"Search directors":"Search records"} value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} /></div>
      {isBankAccounts?<select className="filter-select" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}><option>All</option><option>Active</option><option>Inactive</option><option>Primary</option></select>:!isDirectorsTab&&<select className="filter-select" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}><option>All</option>{["Approved","Submitted","Pending","Active","Verified","Rejected","Paid"].map(x=><option key={x}>{x}</option>)}</select>}
      {canCreate&&(isBankAccounts?<button className="btn-primary compact" onClick={()=>openCreate("Add bank account",{accountHolderName:"Green Valley Farmer Producer Company Ltd.",accountType:"Current",isPrimary:bankAccountItems.length===0?"Yes":"No",status:"Active"})}><Plus size={16}/>Add bank account</button>:<button className="btn-primary compact" onClick={()=>openCreate(createLabel,isDirectorsTab?{role:"Director",signatory:"Yes"}:{})}><Plus size={16}/>{isDirectorsTab?"Add director":createLabel}</button>)}
      <button className="icon-button" aria-label="Export" onClick={isBankAccounts?exportBankAccountsCsv:isDirectorsTab?exportDirectorsCsv:()=>setToast("Report exported as a mock Excel workbook")}><Download size={17}/></button>
    </div>
  </div>
  {isDirectorsTab?(
    <>{!filteredDirectors.length?<div className="empty-state"><span className="empty-mark"><Search size={22}/></span><h3>No records found</h3><p>Try adjusting your search query.</p></div>:<div className="table-scroll"><table><thead><tr><th style={{width:"70px"}}>Sr. No.</th><th style={{minWidth:"120px"}}>DIN/PAN</th><th style={{minWidth:"220px"}}>Name</th><th style={{minWidth:"120px"}}>Designation</th><th style={{minWidth:"150px"}}>Date of Appointment</th><th style={{minWidth:"130px"}}>Cessation Date</th><th style={{minWidth:"100px"}}>Signatory</th></tr></thead><tbody>{pageDirectorRows.map(row=><tr key={row.id}><td>{row.srNo}</td><td><span className="mono">{row.dinPan}</span></td><td><strong style={{color:"#2c4237"}}>{row.name}</strong></td><td>{row.designation}</td><td>{row.appointmentDate}</td><td>{row.cessationDate}</td><td><span className="status-chip green"><i/>{row.signatory}</span></td></tr>)}</tbody></table></div>}<div className="table-footer"><span>Showing {filteredDirectors.length?(page-1)*14+1:0}–{Math.min(page*14,filteredDirectors.length)} of {filteredDirectors.length} directors</span><div><button disabled={page===1} onClick={()=>setPage(v=>Math.max(1,v-1))}>Previous</button><span className="page-indicator">{page} / {directorPageCount}</span><button disabled={page===directorPageCount} onClick={()=>setPage(v=>Math.min(directorPageCount,v+1))}>Next</button></div></div></>
  ):isBankAccounts?(
    <>{!filteredBankAccounts.length?<div className="empty-state"><span className="empty-mark"><Landmark size={22}/></span><h3>No bank accounts found</h3><p>Try adjusting your search or add a registered bank account for the company.</p>{canCreate&&<button className="btn-primary" onClick={()=>openCreate("Add bank account",{accountHolderName:"Green Valley Farmer Producer Company Ltd.",accountType:"Current",isPrimary:bankAccountItems.length===0?"Yes":"No",status:"Active"})}><Plus size={16}/>Add bank account</button>}</div>:<div className="table-scroll"><table><thead><tr><th style={{minWidth:"180px"}}>Bank Name</th><th style={{minWidth:"220px"}}>Account Holder Name</th><th style={{minWidth:"160px"}}>Account Number</th><th style={{minWidth:"110px"}}>Account Type</th><th style={{minWidth:"130px"}}>IFSC Code</th><th style={{minWidth:"180px"}}>Branch</th><th style={{minWidth:"110px"}}>Primary</th><th style={{minWidth:"90px"}}>Status</th><th style={{minWidth:"110px"}}>Actions</th></tr></thead><tbody>{filteredBankAccounts.map(b=>{const isRevealed=unmaskedAccounts[b.id];const masked=b.accountNumber.length>4?`XXXXXX${b.accountNumber.slice(-4)}`:b.accountNumber;return <tr key={b.id}><td><strong style={{color:"#2c4237"}}>{b.bankName}</strong></td><td>{b.accountHolderName}</td><td><div style={{display:"inline-flex",alignItems:"center",gap:"7px"}}><span className="mono">{isRevealed?b.accountNumber:masked}</span><button type="button" onClick={()=>setUnmaskedAccounts(v=>({...v,[b.id]:!v[b.id]}))} title={isRevealed?"Mask account number":"Show full account number"} style={{border:0,background:"none",padding:0,color:"#627267",cursor:"pointer",display:"grid",placeItems:"center"}}>{isRevealed?<EyeOff size={13}/>:<Eye size={13}/>}</button></div></td><td>{b.accountType}</td><td><span className="mono">{b.ifscCode}</span></td><td><div><b>{b.branchName}</b>{b.branchAddress&&<small className="sub-cell">{b.branchAddress}</small>}</div></td><td>{b.isPrimary?<span className="status-chip green"><i/>Primary</span>:<button type="button" className="btn-outline" style={{padding:"3px 8px",fontSize:"9px",borderRadius:"6px"}} onClick={()=>setPrimaryAccount(b)} title="Set as primary company account">Set primary</button>}</td><td><Status status={b.status}/></td><td><div className="row-actions"><button className="icon-button row-more" onClick={()=>editBankAccount(b)} title="Edit bank account"><Edit3 size={14}/></button><button className="icon-button row-more" onClick={()=>deleteBankAccount(b)} title="Delete bank account"><Trash2 size={14}/></button><button className="icon-button row-more" onClick={()=>setModal(`detail:bank:${b.id}`)} title="View details"><MoreHorizontal size={17}/></button></div></td></tr>})}</tbody></table></div>}<div className="table-footer"><span>Showing {filteredBankAccounts.length} of {filteredBankAccounts.length} account{filteredBankAccounts.length===1?"":"s"}</span></div></>
  ):isLicencesPage?(
    <div className="licences-page-container">
      <div className="mca-registration-shell">
        <section className="mca-hero-card">
          <div className="mca-hero-header">
            <div className="mca-hero-title-area">
              <span className="mca-legal-badge">
                <BadgeCheck size={13}/> Statutory MCA Registration · Government of India
              </span>
              <h2 className="mca-company-name">{officialCompanyRegistration.companyName}</h2>
              <div className="mca-cin-row">
                <span className="mca-cin-badge">
                  <span>CIN:</span> {officialCompanyRegistration.cin}
                </span>
                <button type="button" className="mca-copy-btn" onClick={copyCinToClipboard} title="Copy CIN to clipboard">
                  {copiedCin ? <Check size={12}/> : <Copy size={12}/>}
                  {copiedCin ? "Copied" : "Copy CIN"}
                </button>
                <span className="status-chip green" style={{padding:"5px 9px",fontSize:"10px"}}>
                  <i/>{officialCompanyRegistration.companyStatus}
                </span>
              </div>
            </div>
          </div>
          <div className="mca-grid-6">
            <div className="mca-grid-item">
              <small>Registration Number</small>
              <strong>{officialCompanyRegistration.registrationNumber}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Date of Incorporation</small>
              <strong>{officialCompanyRegistration.dateOfIncorporation}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Registrar of Companies</small>
              <strong>{officialCompanyRegistration.rocName}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Class of Company</small>
              <strong>{officialCompanyRegistration.companyClass}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Company Category</small>
              <strong>{officialCompanyRegistration.companyCategory}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Subcategory</small>
              <strong>{officialCompanyRegistration.companySubcategory}</strong>
            </div>
          </div>
        </section>

        <div className="mca-two-cols">
          <section className="mca-card">
            <div className="mca-card-head">
              <div className="mca-card-icon"><Landmark size={18}/></div>
              <div>
                <h3>Capital Information</h3>
                <p>Statutory share capital registered with Ministry of Corporate Affairs</p>
              </div>
            </div>
            <div className="capital-stat-row">
              <div className="capital-stat-box">
                <small>Authorised Capital</small>
                <strong>₹{officialCompanyRegistration.authorisedCapital.toLocaleString("en-IN")}</strong>
                <span style={{fontSize:"9px",color:"#728377",marginTop:"4px",display:"block"}}>INR 10.00 Lakh</span>
              </div>
              <div className="capital-stat-box">
                <small>Paid-up Capital</small>
                <strong>₹{officialCompanyRegistration.paidUpCapital.toLocaleString("en-IN")}</strong>
                <span style={{fontSize:"9px",color:"#728377",marginTop:"4px",display:"block"}}>INR 10.00 Thousand</span>
              </div>
            </div>
            <div className="capital-bar-wrap">
              <div className="capital-bar-label">
                <span>Paid-up vs Authorised Capital Ratio</span>
                <b>{((officialCompanyRegistration.paidUpCapital / officialCompanyRegistration.authorisedCapital) * 100).toFixed(1)}%</b>
              </div>
              <div className="capital-progress-track">
                <div className="capital-progress-fill" style={{width: `${Math.max(2, (officialCompanyRegistration.paidUpCapital / officialCompanyRegistration.authorisedCapital) * 100)}%`}} />
              </div>
            </div>
          </section>

          <section className="mca-card">
            <div className="mca-card-head">
              <div className="mca-card-icon"><MapPin size={18}/></div>
              <div>
                <h3>Registered Office & Communication</h3>
                <p>Official legal communication address & statutory details</p>
              </div>
            </div>
            <div className="office-details-list">
              <div className="office-detail-row">
                <MapPin size={15} className="office-detail-icon" />
                <div>
                  <strong style={{display:"block",fontSize:"9.5px",color:"#7d8c80",textTransform:"uppercase",letterSpacing:"0.6px"}}>Registered Office Address</strong>
                  <span style={{color:"#223729",fontSize:"11px",fontWeight:500}}>{officialCompanyRegistration.registeredAddress}</span>
                </div>
              </div>
              <div className="office-detail-row">
                <Mail size={15} className="office-detail-icon" />
                <div>
                  <strong style={{display:"block",fontSize:"9.5px",color:"#7d8c80",textTransform:"uppercase",letterSpacing:"0.6px"}}>Official Email ID</strong>
                  <a href={`mailto:${officialCompanyRegistration.email}`} style={{color:"#1b5e20",fontWeight:600,textDecoration:"none"}}>{officialCompanyRegistration.email}</a>
                </div>
              </div>
              <div className="office-detail-row">
                <Building2 size={15} className="office-detail-icon" />
                <div>
                  <strong style={{display:"block",fontSize:"9.5px",color:"#7d8c80",textTransform:"uppercase",letterSpacing:"0.6px"}}>Stock Exchange Listing Status</strong>
                  <span style={{color:"#223729",fontWeight:600}}>{officialCompanyRegistration.isStockExchangeListed ? "Yes · Listed" : "No · Unlisted Private FPC"}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mca-card">
          <div className="mca-card-head">
            <div className="mca-card-icon"><FileCheck size={18}/></div>
            <div>
              <h3>Statutory Compliance & Jurisdictional Office</h3>
              <p>Statutory regulatory oversight and ROC jurisdiction details</p>
            </div>
          </div>
          <div className="mca-compliance-grid">
            <div className="mca-grid-item">
              <small>Jurisdiction ROC</small>
              <strong>{officialCompanyRegistration.jurisdictionRoc}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Regional Director</small>
              <strong>{officialCompanyRegistration.regionalDirector}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Address Where Books of Account Kept</small>
              <strong>{officialCompanyRegistration.booksOfAccountAddress === "-" ? "Maintained at Registered Office (-)" : officialCompanyRegistration.booksOfAccountAddress}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Date of Last AGM</small>
              <strong>{officialCompanyRegistration.dateOfLastAgm === "-" ? "Not applicable / First AGM in progress (-)" : officialCompanyRegistration.dateOfLastAgm}</strong>
            </div>
            <div className="mca-grid-item">
              <small>Date of Balance Sheet</small>
              <strong>{officialCompanyRegistration.dateOfBalanceSheet === "-" ? "Not applicable / First fiscal year ending (-)" : officialCompanyRegistration.dateOfBalanceSheet}</strong>
            </div>
            <div className="mca-grid-item">
              <small>ACTIVE Compliance</small>
              <strong>{officialCompanyRegistration.activeCompliance === "-" ? "Not applicable (-)" : officialCompanyRegistration.activeCompliance}</strong>
            </div>
          </div>
          <div className="mca-source-banner">
            <span className="mca-source-tag">
              <ShieldCheck size={15} style={{color:"#1b5e20"}}/>
              Official Ministry of Corporate Affairs (MCA) Record Verification
            </span>
            <span className="mca-source-timestamp">
              MCA Services Extraction: {officialCompanyRegistration.mcaSourceTimestamp}
            </span>
          </div>
        </section>
      </div>

      <div className="surface table-surface">
        <div className="table-toolbar">
          <div>
            <h2>Licences and Compliance Documents</h2>
            <p>{filteredLicences.length} documents on record · {officialCompanyRegistration.companyName}</p>
          </div>
          <div className="toolbar-actions">
            <div className="searchbox">
              <Search size={15}/>
              <input
                aria-label="Search licences and documents"
                placeholder="Search document, number, authority..."
                value={search}
                onChange={e=>{setSearch(e.target.value);setPage(1)}}
              />
            </div>
            <select className="filter-select" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}>
              <option>All</option>
              <option>Statutory</option>
              <option>Operational</option>
              <option>Tax & Compliance</option>
              <option>Active</option>
              <option>Expiring soon</option>
            </select>
            {canCreate && (
              <button
                className="btn-primary compact"
                onClick={()=>openCreate("Add licence / document", {
                  category: "Statutory",
                  status: "Active",
                  issueDate: "17/07/2024",
                  expiry: "Permanent"
                })}
              >
                <Plus size={16}/> Add document
              </button>
            )}
            <button className="icon-button" aria-label="Export Licences" onClick={exportLicencesCsv} title="Export CSV">
              <Download size={17}/>
            </button>
          </div>
        </div>

        {!filteredLicences.length ? (
          <div className="empty-state">
            <span className="empty-mark"><Search size={22}/></span>
            <h3>No documents found</h3>
            <p>Try adjusting your search or filter parameters.</p>
            {canCreate && (
              <button
                className="btn-primary"
                onClick={()=>openCreate("Add licence / document", {
                  category: "Statutory",
                  status: "Active",
                  issueDate: "17/07/2024",
                  expiry: "Permanent"
                })}
              >
                <Plus size={16}/> Add document
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{width:"60px"}}>Sr. No.</th>
                  <th style={{minWidth:"220px"}}>Document / Licence Name</th>
                  <th style={{minWidth:"120px"}}>Category</th>
                  <th style={{minWidth:"180px"}}>Registration / Licence No.</th>
                  <th style={{minWidth:"200px"}}>Issuing Authority</th>
                  <th style={{minWidth:"105px"}}>Issue Date</th>
                  <th style={{minWidth:"105px"}}>Validity</th>
                  <th style={{minWidth:"90px"}}>Status</th>
                  <th style={{minWidth:"110px"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicences.slice((page-1)*14, page*14).map((row, idx) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * 14 + idx + 1}</td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <FileText size={15} style={{color:"#487b55",flex:"none"}}/>
                        <div>
                          <strong style={{color:"#223929"}}>{row.name}</strong>
                          {row.documentName && <small className="sub-cell" style={{display:"block",color:"#849287"}}>{row.documentName}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize:"9px",
                        fontWeight:600,
                        padding:"3px 7px",
                        borderRadius:"6px",
                        background: row.category==="Statutory" ? "#edf5ee" : row.category==="Tax & Compliance" ? "#eef3fa" : "#f7f4ec",
                        color: row.category==="Statutory" ? "#2a6238" : row.category==="Tax & Compliance" ? "#2f5c92" : "#896426"
                      }}>
                        {row.category || "Statutory"}
                      </span>
                    </td>
                    <td><span className="mono" style={{fontWeight:600}}>{row.number}</span></td>
                    <td><span style={{color:"#425647"}}>{row.authority}</span></td>
                    <td>{row.issueDate}</td>
                    <td>
                      <span style={{fontWeight: row.expiry==="Permanent" ? 600 : 400, color: row.expiry==="Permanent" ? "#1b5e20" : "#46594b"}}>
                        {row.expiry}
                      </span>
                    </td>
                    <td><Status status={row.status}/></td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button row-more"
                          onClick={()=>setToast(`Downloading ${row.documentName || row.name}...`)}
                          title="Download document"
                        >
                          <Download size={14}/>
                        </button>
                        {can(role, currentLabel, "E") && (
                          <button
                            className="icon-button row-more"
                            onClick={()=>editLicence(row)}
                            title="Edit document"
                          >
                            <Edit3 size={14}/>
                          </button>
                        )}
                        {can(role, currentLabel, "D") && (
                          <button
                            className="icon-button row-more"
                            onClick={()=>deleteLicence(row)}
                            title="Delete document"
                          >
                            <Trash2 size={14}/></button>
                        )}
                        <button
                          className="icon-button row-more"
                          onClick={()=>setModal(`detail:licence:${row.id}`)}
                          title="View document details"
                        >
                          <MoreHorizontal size={17}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span>
            Showing {filteredLicences.length ? (page - 1) * 14 + 1 : 0}–{Math.min(page * 14, filteredLicences.length)} of {filteredLicences.length} document{filteredLicences.length===1?"":"s"}
          </span>
          <div>
            <button disabled={page===1} onClick={()=>setPage(v=>Math.max(1, v - 1))}>Previous</button>
            <span className="page-indicator">{page} / {Math.max(1, Math.ceil(filteredLicences.length / 14))}</span>
            <button disabled={page===Math.max(1, Math.ceil(filteredLicences.length / 14))} onClick={()=>setPage(v=>Math.min(Math.max(1, Math.ceil(filteredLicences.length / 14)), v + 1))}>Next</button>
          </div>
        </div>
      </div>
    </div>
  ):currentLabel.includes("Reports")?<ReportLibrary setToast={setToast}/>:currentLabel.includes("Settings")||currentLabel==="Users & settings"?<SettingsView state={state} setState={setState} onReset={()=>setModal("reset")} setToast={setToast}/>:currentLabel.includes("Sync centre")?<SyncView state={state} setState={setState} setToast={setToast}/>:currentLabel.includes("Bulk upload")?<BulkUpload setToast={setToast}/>:currentLabel.includes("Messages")||currentLabel.includes("support")?<Messages state={state} setToast={setToast} onCreate={()=>openCreate("Message")}/>:currentLabel.includes("FPC profile")?<Profile setToast={setToast}/>:currentLabel.includes("Monitoring")?<Monitoring state={state} setToast={setToast}/>:<>{!displayRows.length?<div className="empty-state"><span className="empty-mark"><Search size={22}/></span><h3>No records found</h3><p>Try adjusting your search or filters. New records will appear here.</p>{canCreate&&<button className="btn-primary" onClick={()=>openCreate(createLabel)}><Plus size={16}/>{createLabel}</button>}</div>:<div className="table-scroll"><table><thead><tr>{columns.map(c=><th key={c}>{c.replace(/([A-Z])/g," $1")}</th>)}<th>Actions</th></tr></thead><tbody>{pageRows.map(row=><tr key={row.id}>{columns.map(col=><td key={col}>{col==="status"||col==="kyc"?<Status status={String(row[col])}/>:col==="amount"||col==="capital"||col==="rate"||col==="margin"||col==="debit"||col==="credit"?money(Number(row[col]||0)):col==="quantity"?<>{Number(row[col]).toLocaleString("en-IN")} {row.unit||"kg"}{row.unit&&row.unit!=="kg"&&<small className="sub-cell"> · {convert(Number(row[col]),row.unit,"kg").toLocaleString("en-IN")} kg</small>}</>:col==="mobile"&&role!=="FPC Admin / Manager"?String(row[col]).replace(/\d{4}$/,"XXXX"):<span className={col==="id"?"mono":""}>{String(row[col]??"—")}</span>}</td>)}<td><div className="row-actions">{row.status==="Submitted"&&can(role,currentLabel,"A")&&<button className="approve-mini" onClick={()=>updateStatus(row,"Approved")} title="Approve"><Check size={15}/></button>}{can(role,currentLabel,"E")&&<button className="icon-button row-more" onClick={()=>editRecord(row)} title="Edit record"><Edit3 size={14}/></button>}{can(role,currentLabel,"D")&&<button className="icon-button row-more" onClick={()=>softDelete(row)} title="Delete record"><Trash2 size={14}/></button>}<button className="icon-button row-more" onClick={()=>setModal(`detail:${row.id}`)} title="View details"><MoreHorizontal size={17}/></button></div></td></tr>)}</tbody></table></div>}<div className="table-footer"><span>Showing {displayRows.length?(page-1)*14+1:0}–{Math.min(page*14,displayRows.length)} of {displayRows.length} records</span><div><button disabled={page===1} onClick={()=>setPage(v=>Math.max(1,v-1))}>Previous</button><span className="page-indicator">{page} / {pageCount}</span><button disabled={page===pageCount} onClick={()=>setPage(v=>Math.min(pageCount,v+1))}>Next</button></div></div></>}</section>;
 };
 return <div className={`app-shell ${isTsf?"tsf-shell":""} ${isMember?"member-shell":""}`}>
 <FpcNavigation role={role} currentPath={path} onNavigate={setPath} username={user.name} initials={user.initials} offline={state.offline} onOfflineToggle={()=>setState(s=>({...s,offline:!s.offline}))} badges={{approvals:7}} recordName={recordName} showBreadcrumbs={false}/>
 <main className="main-area"><header className="topbar"><NavigationBreadcrumbs role={role} currentPath={path} onNavigate={setPath} recordName={recordName}/><div className="top-actions"><span className="secure-pill"><ShieldCheck size={14}/> Demo mode</span><select aria-label="Select language" value={language} onChange={e=>{setLanguage(e.target.value);setState(s=>({...s,language:e.target.value}))}}><option>English</option><option>Hindi</option><option>Odia</option></select><button className="top-icon" title="Notifications" onClick={()=>setModal("notifications")}><Bell size={18}/><i/></button><div className="role-menu-wrap"><button className="role-switch" onClick={()=>setMenu(!menu)}><span className="avatar small-avatar">{user.initials}</span><span>{user.name}</span><ChevronDown size={14}/></button>{menu&&<div className="role-menu"><div className="role-menu-label">Switch demo role</div>{roles.map(r=><button key={r} className={role===r?"selected":""} onClick={()=>setRole(r)}><span>{roleUsers[r].initials}</span>{r}</button>)}<button className="sign-out" onClick={()=>{setState(s=>({...s,role:null as any}));setMenu(false)}}>Return to role picker</button></div>}</div></div></header>
 <div className="page-wrap"><div className="page-heading"><div><div className="eyebrow">{getActiveNavigationModule(role,path)||(isTsf?"PORTFOLIO VIEW":isMember?"YOUR MEMBERSHIP":"OPERATIONS · FY 2026–27")}</div><h1>{isLicencesPage?"Company Registration & Licences":(labels[language]?.[title]||title)}</h1><p>{isLicencesPage?"View and manage official company registration details, statutory registrations, and compliance documents.":isTsf?"A clearer view of delivery across partner FPCs.":isMember?"Your produce, benefits and company updates in one place.":title==="Overview"?"Good morning, Bijay. Here is the picture across your FPC.":`Manage ${title.toLowerCase()} for Green Valley Farmer Producer Company.`}</p></div><div className="heading-right">{role==="Director / Board Member / Auditor"&&<span className="readonly-pill"><ShieldCheck size={14}/> Read-only access</span>}<span className={`network-pill ${state.offline?"network-offline":""}`}><span/>{state.offline?"Offline · queued":"Online"}</span><button className="help-button" onClick={()=>setToast("Help centre · Contact the Green Valley FPC office")}><CircleHelp size={17}/> Help</button></div></div>{dashboard?renderDash():listView()}</div>
 <footer className="app-footer"><span>FPC Development Project, supported by Citibank. Implemented with Tata Steel Foundation.</span><span>Prototype · Browser data only</span></footer></main>
  {modal&&<Modal title={modal.startsWith("detail:bank:")?"Bank account details":modal.startsWith("detail:licence:")?"Document details":modal.startsWith("detail:")?`Record details · ${modal.slice(7)}`:modal==="reset"?"Reset demo data":modal==="notifications"?"Notifications":modal==="Add bank account"?"Add bank account":modal==="Edit bank account"?"Edit bank account":modal==="Add licence / document"?"Add licence / document":modal==="Edit licence / document"?"Edit licence / document":modal.toLowerCase().includes("user")&&newRow.role==="Director"?"Add director":modal} onClose={()=>setModal("")}>{modal==="reset"?<div className="modal-content"><p>This restores the original Green Valley demo dataset. Any records created during this session will be removed.</p><button className="btn-danger" onClick={reset}>Reset demo data</button></div>:modal==="notifications"?<div className="notification-list">{state.notifications.map(n=><div key={n.id}><span className="unread-dot"/><span><b>{n.title}</b><small>{n.date}</small></span></div>)}</div>:modal.startsWith("detail:bank:")?<div className="detail-modal" style={{display:"block"}}>{(()=>{const acc=bankAccountItems.find(b=>b.id===modal.slice(12));if(!acc)return <p>Account record not found.</p>;return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 18px",width:"100%"}}><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Bank Name</small><p style={{fontSize:"13px",fontWeight:600,margin:"4px 0 0",color:"#2c4237"}}>{acc.bankName}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Status & Primary</small><div style={{display:"flex",gap:"6px",alignItems:"center",marginTop:"4px"}}><Status status={acc.status}/>{acc.isPrimary&&<span className="status-chip green" style={{marginLeft:"6px"}}><i/>Primary</span>}</div></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Account Holder</small><p style={{fontSize:"11px",margin:"4px 0 0",color:"#34483a"}}>{acc.accountHolderName}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Account Type</small><p style={{fontSize:"11px",margin:"4px 0 0",color:"#34483a"}}>{acc.accountType}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Account Number</small><p style={{fontSize:"12px",fontFamily:"monospace",margin:"4px 0 0",color:"#2c4237"}}>{acc.accountNumber}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>IFSC Code</small><p style={{fontSize:"12px",fontFamily:"monospace",margin:"4px 0 0",color:"#2c4237"}}>{acc.ifscCode}</p></div><div style={{gridColumn:"1/-1"}}><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Branch Name & Address</small><p style={{fontSize:"11px",margin:"4px 0 0",color:"#34483a"}}><b>{acc.branchName}</b>{acc.branchAddress?` · ${acc.branchAddress}`:""}</p></div></div>;})()}<div className="modal-buttons" style={{marginTop:"20px"}}><button className="btn-outline" onClick={()=>setModal("")}>Close</button></div></div>:modal.startsWith("detail:licence:")?<div className="detail-modal" style={{display:"block"}}>{(()=>{const lic=licenceItems.find(l=>l.id===modal.slice(15));if(!lic)return <p>Document record not found.</p>;return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px 18px",width:"100%"}}><div style={{gridColumn:"1/-1"}}><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Document Name</small><p style={{fontSize:"14px",fontWeight:700,margin:"4px 0 0",color:"#223929"}}>{lic.name}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Category & Status</small><div style={{display:"flex",gap:"6px",alignItems:"center",marginTop:"4px"}}><span className="status-chip slate">{lic.category||"Statutory"}</span><Status status={lic.status}/></div></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Registration / Licence Number</small><p style={{fontSize:"12px",fontFamily:"monospace",fontWeight:600,margin:"4px 0 0",color:"#223929"}}>{lic.number}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Issuing Authority</small><p style={{fontSize:"11px",margin:"4px 0 0",color:"#34483a"}}>{lic.authority}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Issue Date</small><p style={{fontSize:"11px",margin:"4px 0 0",color:"#34483a"}}>{lic.issueDate}</p></div><div><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Validity / Expiry</small><p style={{fontSize:"11px",fontWeight:600,margin:"4px 0 0",color:"#223929"}}>{lic.expiry}</p></div><div style={{gridColumn:"1/-1"}}><small style={{fontSize:"9px",color:"#89958d",textTransform:"uppercase",display:"block"}}>Attached Document File</small><p style={{fontSize:"11px",margin:"4px 0 0",color:"#1b5e20",display:"flex",alignItems:"center",gap:"5px"}}><FileText size={14}/> {lic.documentName||"Not attached"}</p></div></div>;})()}<div className="modal-buttons" style={{marginTop:"20px"}}><button className="btn-outline" onClick={()=>setModal("")}>Close</button><button className="btn-primary" onClick={()=>{setToast("Document certificate downloaded");setModal("");}}><Download size={15}/> Download document</button></div></div>:modal.startsWith("detail:")?<div className="detail-modal"><p>Record information from the local demo workspace.</p><Status status={items.find(x=>x.id===modal.slice(7))?.status||"Approved"}/><button className="btn-outline" onClick={()=>setToast("Record detail copied to clipboard")}>Copy record reference</button></div>:<div className="modal-content"><div className="form-grid">{modal==="Add bank account"||modal==="Edit bank account"?<>
<label>Bank name *<input required placeholder="e.g. State Bank of India" value={newRow.bankName||""} onChange={e=>setNewRow(v=>({...v,bankName:e.target.value}))}/></label>
<label>Account holder name *<input required placeholder="Legal entity name" value={newRow.accountHolderName||""} onChange={e=>setNewRow(v=>({...v,accountHolderName:e.target.value}))}/></label>
<label>Account number *<input required placeholder="9 to 18 digits" value={newRow.accountNumber||""} onChange={e=>setNewRow(v=>({...v,accountNumber:e.target.value.replace(/\D/g,"")}))}/></label>
{modal==="Add bank account"&&<label>Confirm account number *<input required placeholder="Re-enter account number" value={newRow.confirmAccountNumber||""} onChange={e=>setNewRow(v=>({...v,confirmAccountNumber:e.target.value.replace(/\D/g,"")}))}/></label>}
<label>Account type *<select value={newRow.accountType||"Current"} onChange={e=>setNewRow(v=>({...v,accountType:e.target.value}))}>{["Current","Savings","Cash Credit","Overdraft","Other"].map(t=><option key={t} value={t}>{t}</option>)}</select></label>
<label>IFSC code *<input required placeholder="e.g. SBIN0001234" maxLength={11} value={newRow.ifscCode||""} onChange={e=>setNewRow(v=>({...v,ifscCode:e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"")}))}/></label>
<label>Branch name *<input required placeholder="e.g. Keonjhar" value={newRow.branchName||""} onChange={e=>setNewRow(v=>({...v,branchName:e.target.value}))}/></label>
<label>Branch address (Optional)<input placeholder="e.g. Main Road, Keonjhar Sadar" value={newRow.branchAddress||""} onChange={e=>setNewRow(v=>({...v,branchAddress:e.target.value}))}/></label>
<label>Account status<select value={newRow.status||"Active"} onChange={e=>setNewRow(v=>({...v,status:e.target.value}))}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label>
<label style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"6px",gridColumn:"1/-1"}}><input type="checkbox" checked={newRow.isPrimary==="Yes"} onChange={e=>setNewRow(v=>({...v,isPrimary:e.target.checked?"Yes":"No"}))} style={{width:"16px",height:"16px",margin:0}}/><span style={{fontSize:"11px",color:"#34483a",textTransform:"none"}}>Set as primary account for company transactions</span></label>
</>:modal==="Add licence / document"||modal==="Edit licence / document"?<>
<label style={{gridColumn:"1/-1"}}>Document / Licence Name *<input required placeholder="e.g. Certificate of Incorporation" value={newRow.name||""} onChange={e=>setNewRow(v=>({...v,name:e.target.value}))}/></label>
<label>Category *<select value={newRow.category||"Statutory"} onChange={e=>setNewRow(v=>({...v,category:e.target.value}))}><option value="Statutory">Statutory</option><option value="Operational">Operational</option><option value="Tax & Compliance">Tax & Compliance</option></select></label>
<label>Registration / Licence No. *<input required placeholder="e.g. 022984 or FL/SER/2024/051" value={newRow.number||""} onChange={e=>setNewRow(v=>({...v,number:e.target.value}))}/></label>
<label style={{gridColumn:"1/-1"}}>Issuing Authority *<input required placeholder="e.g. Ministry of Corporate Affairs, ROC Jharkhand" value={newRow.authority||""} onChange={e=>setNewRow(v=>({...v,authority:e.target.value}))}/></label>
<label>Issue Date *<input placeholder="DD/MM/YYYY" value={newRow.issueDate||""} onChange={e=>setNewRow(v=>({...v,issueDate:e.target.value}))}/></label>
<label>Validity / Expiry Date *<input placeholder="Permanent or DD/MM/YYYY" value={newRow.expiry||""} onChange={e=>setNewRow(v=>({...v,expiry:e.target.value}))}/></label>
<label>Status *<select value={newRow.status||"Active"} onChange={e=>setNewRow(v=>({...v,status:e.target.value}))}><option value="Active">Active</option><option value="Expiring soon">Expiring soon</option><option value="Under Renewal">Under Renewal</option><option value="Expired">Expired</option></select></label>
<label>Attachment File Name<input placeholder="e.g. certificate.pdf" value={newRow.documentName||""} onChange={e=>setNewRow(v=>({...v,documentName:e.target.value}))}/></label>
</>:modal.toLowerCase().includes("user")?(newRow.role==="Director"?<>
<label>Full name *<input required placeholder="e.g. ARJUN MARDI" value={newRow.name||""} onChange={e=>setNewRow(v=>({...v,name:e.target.value}))}/></label>
<label>DIN / PAN *<input required placeholder="e.g. 10615206" value={newRow.dinPan||""} onChange={e=>setNewRow(v=>({...v,dinPan:e.target.value}))}/></label>
<label>Role *<select required value={newRow.role||"Director"} onChange={e=>{const r=e.target.value;if(r==="Director")setNewRow(v=>({...v,role:r}));else setNewRow(v=>({name:v.name||"",role:r}))}}><option value="Director">Director</option>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
<label>Date of Appointment *<input type="date" required value={newRow.appointmentDate||""} onChange={e=>setNewRow(v=>({...v,appointmentDate:e.target.value}))}/></label>
<label>Cessation Date (Optional)<input type="date" value={newRow.cessationDate||""} onChange={e=>setNewRow(v=>({...v,cessationDate:e.target.value}))}/></label>
<label>Signatory *<select value={newRow.signatory||"Yes"} onChange={e=>setNewRow(v=>({...v,signatory:e.target.value}))}><option value="Yes">Yes</option><option value="No">No</option></select></label>
</>:<>
<label>Name *<input required placeholder="Enter name" value={newRow.name||""} onChange={e=>setNewRow(v=>({...v,name:e.target.value}))}/></label>
<label>Mobile *<input required placeholder="Enter mobile" value={newRow.mobile||""} onChange={e=>setNewRow(v=>({...v,mobile:e.target.value}))}/></label>
<label>Role *<select required value={newRow.role||""} onChange={e=>{const r=e.target.value;if(r==="Director")setNewRow(v=>({name:v.name||"",role:"Director",signatory:"Yes"}));else setNewRow(v=>({...v,role:r}))}}><option value="" disabled>Select role</option><option value="Director">Director</option>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
<label>Email<input type="email" placeholder="Enter email" value={newRow.email||""} onChange={e=>setNewRow(v=>({...v,email:e.target.value}))}/></label>
</>):(modal.toLowerCase().includes("purchase")?["farmer","commodity","quantity","unit","rate"]:modal.toLowerCase().includes("sale")?["buyer","commodity","quantity","unit","rate"]:modal.toLowerCase().includes("farmer")?["name","mobile","village","land","crop"]:modal.toLowerCase().includes("share")?["name","farmerId","shares"]:modal.toLowerCase().includes("payment")?["farmer","amount","method","reference"]:modal.toLowerCase().includes("expense")?["name","amount","category"]:modal.toLowerCase().includes("fil")?["name","due","owner"]:modal.toLowerCase().includes("message")?["title","audience","message"]:modal.toLowerCase().includes("commodity")?["name","hsn","baseUnit","purchaseRate","saleRate","threshold"]:modal.toLowerCase().includes("baseline")?["village","season","crop","area","expectedYield"]:["name","description","amount"]).map(field=><label key={field}>{field.replace(/([A-Z])/g," $1")}<input required placeholder={field==="unit"?"kg / quintal / tonne / bag":`Enter ${field}`} value={newRow[field]||""} onChange={e=>setNewRow(v=>({...v,[field]:e.target.value}))}/></label>)}</div>{modal.toLowerCase().includes("purchase")&&<div className="inline-callout"><Truck size={16}/> Purchase will be submitted for approval. Stock increases after approval.</div>}{modal.toLowerCase().includes("sale")&&<div className="inline-callout"><Activity size={16}/> Sale margin is calculated as selling price minus weighted cost.</div>}<div className="modal-buttons"><button className="btn-outline" onClick={()=>setModal("")}>Cancel</button><button className="btn-primary" onClick={saveNew}>{modal.includes("bank account")?(modal==="Edit bank account"?"Update bank account":"Save bank account"):modal.includes("licence")||modal.includes("document")?(modal.startsWith("Edit")?"Update document":"Save document"):modal.toLowerCase().includes("user")&&newRow.role==="Director"?"Save director":"Save as draft"} <Check size={15}/></button></div></div>}</Modal>}
  {toast&&<div className="toast"><span><Check size={15}/></span>{toast}{undo&&toast.includes("Undo")&&<button className="undo-button" onClick={undoDelete}>Undo</button>}<button onClick={()=>setToast("")}><X size={14}/></button></div>}
 </div>;
}

function Status({status}:{status?:string}){const current=status??"Unknown";const s=current.toLowerCase();const type=s.includes("approv")||s.includes("paid")||s.includes("filed")||s.includes("active")||s.includes("verified")?"green":s.includes("reject")||s.includes("overdue")||s.includes("fail")?"red":s.includes("submit")||s.includes("review")?"blue":s.includes("pending")||s.includes("due")||s.includes("sync")?"amber":"slate";return <span className={`status-chip ${type}`}><i/>{current}</span>}
function PanelHead({title,sub,action,onClick}:{title:string;sub:string;action?:string;onClick?:()=>void}){return <div className="panel-head"><div><h2>{title}</h2><p>{sub}</p></div>{action&&<button onClick={onClick}>{action} <span>→</span></button>}</div>}
function Attention({title,detail,onClick}:{title:string;detail:string;onClick?:()=>void}){return <button className="attention-row" onClick={onClick}><span className="attention-mark"><i/></span><span><b>{title}</b><small>{detail}</small></span><span className="attention-arrow">→</span></button>}
function ApprovalInbox({rows,onAction}:{rows:RecordRow[];onAction:(r:RecordRow,s:string,reason?:string)=>void}){const[active,setActive]=useState("All");const[selected,setSelected]=useState<string[]>([]);const[detail,setDetail]=useState<RecordRow|null>(null);const categories=["All","Farmers","Shareholders","Purchases","Sales","Expenses","Stock adjustments","Filings"];const filtered=rows.filter(r=>active==="All"||(active==="Farmers"&&r.id.startsWith("F-"))||(active==="Purchases"&&r.id.startsWith("PUR-"))||(active==="Expenses"&&r.id.startsWith("EXP-"))||(active==="Stock adjustments"&&r.id.startsWith("ADJ-"))||(active==="Shareholders"&&r.id.startsWith("SH-"))||(active==="Sales"&&r.id.startsWith("SAL-"))||(active==="Filings"&&r.id.startsWith("FIL-")));return <section className="surface table-surface"><div className="table-toolbar"><div><h2>One inbox. Every decision.</h2><p>Review submitted records and keep the operation moving.</p></div><span className="approval-count">{filtered.length} waiting</span></div><div className="approval-tabs">{categories.map(t=><button key={t} className={t===active?"selected":""} onClick={()=>setActive(t)}>{t}</button>)}</div>{selected.length>0&&<div className="bulk-action-bar"><span>{selected.length} selected</span><button className="btn-primary compact" onClick={()=>{filtered.filter(r=>selected.includes(r.id)).forEach(r=>onAction(r,"Approved"));setSelected([])}}>Approve selected</button></div>}<div className="approval-list">{filtered.map((r,i)=><div className="approval-row" key={r.id}><input type="checkbox" checked={selected.includes(r.id)} onChange={e=>setSelected(a=>e.target.checked?[...a,r.id]:a.filter(x=>x!==r.id))} aria-label={`Select ${r.id}`}/><span className="approval-avatar">{["PR","PN","ST","AD"][i%4]}</span><button className="approval-name approval-detail" onClick={()=>setDetail(r)}><b>{r.farmer||r.name||r.commodity||r.id}</b><small>{r.id} · Submitted by {i<3?"Prakash Rout":"Pooja Nayak"}</small></button><span className="approval-amount">{r.amount?money(Number(r.amount)):"Farmer registration"}</span><span className="approval-date">{r.date||"Today"}</span><Status status={r.status||"Submitted"}/><div className="approval-buttons"><button className="btn-outline" onClick={()=>{const why=prompt("Enter a rejection reason");if(why?.trim())onAction(r,"Rejected",why.trim())}}>Reject</button><button className="btn-primary compact" onClick={()=>onAction(r,"Approved")}>Approve</button></div></div>)}</div><div className="approval-note"><ShieldCheck size={15}/> Every approval and rejection is recorded in the audit trail.</div>{detail&&<Modal title={`Review · ${detail.id}`} onClose={()=>setDetail(null)}><div className="modal-content"><p><b>{detail.farmer||detail.name||detail.commodity}</b></p><p>Submitted by {detail.id.startsWith("PUR")?"Prakash Rout":"Pooja Nayak"} · {detail.date||"Today"}</p><Status status={detail.status||"Submitted"}/><div className="modal-buttons"><button className="btn-outline" onClick={()=>setDetail(null)}>Close</button><button className="btn-primary" onClick={()=>{onAction(detail,"Approved");setDetail(null)}}>Approve record</button></div></div></Modal>}</section>}
function MemberHome({role,state,setToast,setPath}:{role:Role;state:State;setToast:(s:string)=>void;setPath:(p:string)=>void}){const sh=role==="Shareholder";return <><div className="member-welcome"><div><div className="eyebrow">GREEN VALLEY FPC · MEMBER ID {sh?"SH-001":"F-001"}</div><h2>Namaste, Ravi</h2><p>{sh?"Your membership and benefits, clearly accounted for.":"Your produce, payments and farm records—together."}</p></div><span className="member-role-toggle"><button className={!sh?"selected":""} onClick={()=>setPath("/home")}>As Farmer</button><button className={sh?"selected":""} onClick={()=>setPath("/my-shareholding")}>As Shareholder</button></span></div>{sh?<div className="member-stat-grid"><div className="member-highlight"><small>SHARES HELD</small><strong>10 shares</strong><p>Share capital · Rs 1,000</p><span>Member since 02 Aug 2021</span></div><div className="member-benefit"><span className="benefit-icon"><HandCoins size={19}/></span><small>FY 2025–26 BENEFIT</small><strong>Rs 550</strong><p>Rs 50 dividend + Rs 500 patronage bonus</p><Status status="Paid"/></div><div className="member-info"><h3>Three different money flows</h3><p><b>Rs 25,000</b> sale proceeds are for your produce.</p><p><b>Rs 1,000</b> is your share capital in the company.</p><p><b>Rs 550</b> is a dividend and patronage bonus.</p></div></div>:<div className="member-stat-grid"><div className="member-highlight"><small>PAYMENT DUE</small><strong>Rs 0</strong><p>All purchase payments are up to date.</p><span>Last payment · 12 Oct 2026</span></div><div className="member-benefit"><span className="benefit-icon"><Sprout size={19}/></span><small>LAST PRODUCE SALE</small><strong>1,000 kg</strong><p>Paddy · Rs 25/kg · Rs 25,000</p><Status status="Paid"/></div><div className="member-info rate-card"><small>TODAY'S FPC RATE</small><h3>Paddy · Rs 25/kg</h3><p>Current procurement rate · common grade</p><button onClick={()=>setToast("Rate board refreshed")}>Updated today <span>↻</span></button></div></div>}
 <div className="dashboard-columns member-lower"><section className="surface"><PanelHead title={sh?"Dividend statement":"Recent activity"} sub={sh?"Your FY 2025–26 member benefit":"Latest sales and payments"} action={sh?"View statement":"View all sales"} onClick={()=>setPath(sh?"/dividend-benefits":"/my-sales")}/>{sh?<div className="dividend-breakdown"><div><span>Share capital</span><b>Rs 1,000</b></div><div><span>Declared dividend · 5%</span><b>Rs 50</b></div><div><span>Patronage · 1,000 kg × Rs 0.50</span><b>Rs 500</b></div><div className="total"><span>Total benefit</span><b>Rs 550</b></div><p>Dividend is not guaranteed and is declared by the general meeting.</p></div>:<div className="recent-transaction"><span className="transaction-mark"><ArrowDownLeft size={18}/></span><span><b>Paddy delivered to Green Valley FPC</b><small>12 Oct 2026 · 1,000 kg at Rs 25/kg</small></span><b>{money(25000)}</b><Status status="Paid"/></div>}</section><section className="surface"><PanelHead title="Notices & updates" sub="Important information from your FPC"/><div className="notice-row"><span className="notice-icon"><CalendarDays size={17}/></span><span><b>Annual General Meeting</b><small>21 Sep 2026 · Community Hall Green Valley</small></span><span className="notice-tag">Notice</span></div><div className="notice-row"><span className="notice-icon gold"><Bell size={17}/></span><span><b>Payment credited to your account</b><small>Rs 25,000 · Bank transfer</small></span><span className="notice-tag">Payment</span></div></section></div><div className="member-quick"><button onClick={()=>setPath("/my-profile")}><Users/> My profile</button><button onClick={()=>setPath(sh?"/meetings":"/my-inputs")}><Boxes/> {sh?"Meetings":"Request farm inputs"}</button><button onClick={()=>setToast("Contact Green Valley FPC office · +91 06766 255 400")}><CircleHelp/> Contact support</button></div></>}
function Modal({title,children,onClose}:{title:string;children:any;onClose:()=>void}){return <div className="modal-backdrop" onClick={onClose}><section className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button onClick={onClose}><X size={18}/></button></div>{children}</section></div>}
function SettingsView({state,setState,onReset,setToast}:{state:State;setState:(fn:(s:State)=>State)=>void;onReset:()=>void;setToast:(s:string)=>void}){return <div className="settings-grid"><section className="surface setting-card"><PanelHead title="Workspace preferences" sub="Language and the way this demo behaves"/><label className="setting-line"><span><b>Simulate offline</b><small>Queue new records locally until you sync</small></span><input type="checkbox" checked={state.offline} onChange={e=>setState(s=>({...s,offline:e.target.checked}))}/></label><label className="setting-line"><span><b>Allow same farmer in multiple FPCs</b><small>TSF-controlled demo rule · currently enabled</small></span><input type="checkbox" defaultChecked/></label><label className="setting-line"><span><b>Push notifications</b><small>Updates about approvals and payments</small></span><input type="checkbox" defaultChecked/></label><div className="secure-info"><ShieldCheck size={17}/> HTTPS protected · Demo data stays in this browser</div></section><section className="surface setting-card"><PanelHead title="Backup & restore" sub="Mock daily recovery points · no real server data"/>{Array.from({length:4},(_,i)=><div className="backup-row" key={i}><span><b>{i===0?"Today · 09:15":`${i} day${i>1?"s":""} ago`}</b><small>Green Valley demo snapshot · 2.4 MB</small></span><button className="btn-outline" onClick={()=>setToast("Snapshot restored · demo data reloaded")}>Restore</button></div>)}</section><section className="surface reset-card"><div><span className="eyebrow">DEMO DATA</span><h3>Start with a clean slate</h3><p>Reset created records, audit events and settings to the seeded prototype dataset.</p></div><button className="btn-danger" onClick={onReset}>Reset demo data</button></section></div>}
function SyncView({state,setState,setToast}:{state:State;setState:(fn:(s:State)=>State)=>void;setToast:(s:string)=>void}){const sync=()=>{setState(s=>({...s,syncQueue:s.syncQueue.map(r=>r.status==="Pending sync"?{...r,status:"Synced"}:r),offline:false}));setToast("4 records synced, 1 needs attention")};return <section className="surface table-surface"><div className="table-toolbar"><div><h2>Sync centre</h2><p>Field records safely stored on this device while connectivity is limited.</p></div><button className="btn-primary" onClick={sync}><Wifi size={16}/> Sync now</button></div><div className="sync-progress"><i style={{width:"64%"}}/></div>{state.syncQueue.map(r=><div className="sync-row" key={r.id}><span className="sync-mark"><FileText size={17}/></span><span><b>{r.type}</b><small>{r.record} {r.reason?`· ${r.reason}`:"· Created just now"}</small></span><Status status={r.status}/>{r.status==="Failed"&&<button className="btn-outline" onClick={()=>setToast("Resolve conflict · Keep mine, Keep server, or Edit and retry")}>Resolve</button>}</div>)}<div className="inline-callout"><WifiOff size={16}/> Offline simulation is local only. No information leaves this browser.</div></section>}
function BulkUpload({setToast}:{setToast:(s:string)=>void}){return <div className="bulk-layout"><section className="surface upload-drop"><span className="upload-icon"><Download size={23}/></span><h2>Bring in a spreadsheet</h2><p>Upload farmer, shareholder or procurement records. We’ll check every row before import.</p><button className="btn-outline" onClick={()=>setToast("Template downloaded · farmer-register-template.xlsx")}><Download size={15}/> Download Excel template</button><label className="file-pick">Choose a file<input type="file" accept=".csv,.xlsx,.xls" onChange={()=>setToast("48 rows read · 44 valid · 4 need your attention")}/></label></section><section className="surface validation-report"><span className="eyebrow">SAMPLE VALIDATION</span><h3>48 rows read <span className="valid-count">44 valid</span></h3><div className="validation-error">Row 12 <span>Mobile must be 10 digits</span></div><div className="validation-error">Row 19 <span>Unknown village</span></div><div className="validation-error">Row 27 <span>Land cannot be zero</span></div><div className="validation-error">Row 33 <span>Unit “qntl” not recognised · use “quintal”</span></div><button className="btn-primary" onClick={()=>setToast("44 valid rows imported as drafts")}>Import valid rows as drafts <ArrowDownLeft size={15}/></button></section></div>}
function ReportLibrary({setToast}:{setToast:(s:string)=>void}){const reports=["Farmer register","Farmer-wise supply","Shareholder register","Share capital report","Purchase register","Sales by buyer","Stock position by godown","Farmer ledger","Buyer ledger","Payables ageing","Profit & loss","Dividend statement","Filing status","Audit trail"];return <div className="report-grid">{reports.map((r,i)=><button className="report-card" key={r} onClick={()=>setToast(`${r} report preview ready · Excel, PDF or print`)}><span className="report-icon"><FileText size={18}/></span><span><b>{r}</b><small>{["Farmers","Shareholders","Purchases","Sales","Stock","Finance","Compliance","Audit"][i%8]} · Updated today</small></span><Download size={16}/></button>)}</div>}
function Messages({state,setToast,onCreate}:{state:State;setToast:(s:string)=>void;onCreate:()=>void}){return <div className="messages-grid"><section className="surface"><PanelHead title="Inbox" sub="Updates and notices from the FPC"/>{state.records.messages.map(m=><div className="message-row" key={m.id}><span className="notice-icon"><Bell size={16}/></span><span><b>{m.title}</b><small>{m.date} · {m.status}</small></span><Status status={m.status}/></div>)}</section><section className="surface compose-card"><span className="eyebrow">MESSAGE CENTRE</span><h2>Reach your community</h2><p>Compose a demo notice for all farmers, a village or a specific member group.</p><button className="btn-primary" onClick={onCreate}>Compose a message <Plus size={16}/></button><button className="btn-outline" onClick={()=>setToast("Support ticket created · TKT-2026-0012")}>Raise a support ticket</button><small>Delivery is simulated. No SMS or email is sent.</small></section></div>}
function Profile({setToast}:{setToast:(s:string)=>void}){return <div className="profile-grid"><section className="surface company-profile"><div className="profile-banner"><span className="company-seal"><Building2 size={24}/></span><span><small>FARMER PRODUCER COMPANY</small><h2>Green Valley Farmer Producer Company Ltd.</h2><p>FPC-ODI-001 · Active since 14 Jun 2021</p></span><button className="btn-outline" onClick={()=>setToast("Company profile editing enabled")}>Edit profile</button></div><div className="company-details"><div><small>REGISTERED OFFICE</small><b>Village Green Valley, Block Keonjhar Sadar</b><span>Dist. Keonjhar, Odisha 758001</span></div><div><small>CIN</small><b>U01100OD2021PTC035612</b></div><div><small>PAN</small><b>AAACG1234F</b></div><div><small>GSTIN</small><b>21AAACG1234F1Z5</b></div><div><small>BANK</small><b>State Bank of India · Keonjhar</b><span>Account ending 4821 · IFSC SBIN0001234</span></div><div><small>CAPITAL</small><b>Paid-up {money(620000)}</b><span>Authorised {money(1000000)}</span></div></div></section><section className="surface"><PanelHead title="Board of directors" sub="Six directors on record"/>{["Sunita Behera · Chairperson","Bijay Kumar Mohanty · CEO","Ramesh Chandra Nayak","Laxmi Patra","Dillip Sahoo","Kanchan Munda"].map((n,i)=><div className="director-line" key={n}><span className="avatar">{n.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><b>{n}</b>{i===0&&<Status status="Active"/>}</div>)}</section></div>}
function Monitoring({state,setToast}:{state:State;setToast:(s:string)=>void}){const checkpoints=["Profile","Farmers","Members","Baseline","Procurement","Sales","Stock","Ledgers","Filings","Sync"];return <section className="surface table-surface"><div className="table-toolbar"><div><h2>Delivery, at a glance</h2><p>Checkpoint status across every partner FPC.</p></div><button className="btn-outline" onClick={()=>setToast("Reminder sent to selected FPC administrators")}>Send reminder</button></div><div className="monitoring-grid"><div className="monitoring-row header"><b>FPC</b>{checkpoints.map(x=><span key={x}>{x}</span>)}</div>{state.records.fpcs.map((f,fi)=><div className="monitoring-row" key={f.id}><b>{f.name}</b>{checkpoints.map((x,i)=><button key={x} className={`matrix-cell matrix-${(fi+i)%7===5?"bad":(fi+i)%5===3?"warn":"good"}`} title={`${x} · ${f.name}`} onClick={()=>setToast(`${x} · ${f.name} · Updated 12 Oct 2026`)}><i/></button>)}</div>)}</div><div className="monitor-legend"><span><i className="matrix-cell matrix-good"><i/></i> Done</span><span><i className="matrix-cell matrix-warn"><i/></i> In progress</span><span><i className="matrix-cell matrix-bad"><i/></i> Not done</span></div></section>}

export default App;
