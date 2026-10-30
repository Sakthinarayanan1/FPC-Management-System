import { useEffect, useState } from "react";
import { ArrowDownToLine, ShoppingBag, Store, Wallet, ArrowUpFromLine, Check, ChevronLeft, ChevronRight, Clock, FileText, Plus, Printer, Search, X } from "lucide-react";
import { convert, money, type RecordRow, type State, type SharePurchaseRecord, formatDateTime, isCertificateEligible, getRemainingTimeText } from "@/lib/store";
import SharePurchaseReceipt from "./SharePurchaseReceipt";
import ProducePurchaseReceipt from "./ProducePurchaseReceipt";
import ProduceSaleReceipt from "./ProduceSaleReceipt";
import InputSaleReceipt from "./InputSaleReceipt";
import { fpcStores } from "@/lib/store";
import "./enhanced-modules.css";

type Props={state:State;setState:(updater:State|((s:State)=>State))=>void;role:string;screen:string;setToast:(s:string)=>void;go:(s:string)=>void;editFarmerId?:string};
const today=()=>new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const stamp=()=>new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const records=(s:State,key:string):RecordRow[]=>Array.isArray(s.records?.[key])?s.records[key]:[];
const actor=(role:string)=>role||"FPC Admin";
const serial=(rows:RecordRow[],prefix:string,width=4)=>`${prefix}${String(rows.reduce((n,r)=>{const id=String(r.id||"");const suffix=id.startsWith(prefix)?id.slice(prefix.length):"";return Math.max(n,Number(suffix.replace(/\D/g,""))||0);},0)+1).padStart(width,"0")}`;
const withRows=(s:State,key:string,rows:RecordRow[])=>({...s,records:{...(s.records||{}),[key]:rows}});
const notice=(title:string)=>({id:`NT-${Date.now()}`,title,date:"Just now",status:"Unread",fpcId:"FPC-ODI-001"});
const audit=(s:State,role:string,action:string,module:string,id:string,before?:unknown,after?:unknown)=>[{id:`AUD-${Date.now()}`,actor:actor(role),role,action,module,record:id,oldValue:before?JSON.stringify(before):"",newValue:after?JSON.stringify(after):"",date:stamp(),fpcId:"FPC-ODI-001"},...(s.audit||[])];
const Button=({children,onClick,kind="",testid,disabled=false}:{children:any;onClick:()=>void;kind?:string;testid:string;disabled?:boolean})=><button className={`em-btn ${kind}`} data-testid={testid} onClick={onClick} disabled={disabled}>{children}</button>;
const Field=({label,value,onChange,type="text",options,placeholder,testid,required=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;options?:(string|{value:string;label:string})[];placeholder?:string;testid:string;required?:boolean})=><div className="em-field"><label>{label}{required?" *":""}</label>{options?<select data-testid={testid} value={value} onChange={e=>onChange(e.target.value)}>{options.map((o,idx)=>{const val=typeof o==="string"?o:o.value;const lab=typeof o==="string"?o:o.label;return <option key={`${val}-${idx}`} value={val}>{lab}</option>;})}</select>:<input data-testid={testid} type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} />}</div>;
const Header=({kicker,title,description,actions}:{kicker:string;title:string;description:string;actions?:any})=><header className="em-head"><div><span className="em-kicker">{kicker}</span><h2>{title}</h2><p>{description}</p></div><div className="em-actions">{actions}</div></header>;
const Status=({value=""}:{value?:string})=><span className={`em-status ${value.toLowerCase().includes("reject")?"rejected":value.toLowerCase().includes("pending")||value.toLowerCase().includes("submitted")?"pending":""}`}>{value||"Active"}</span>;
const Table=({headers,children}:{headers:string[];children:any})=><div className="em-tablewrap" data-testid={`table-${headers[0].toLowerCase().replaceAll(" ","-").replaceAll("/","-")}`}><table className="em-table"><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
const Empty=({children="No records yet. New entries will appear here."}:{children?:any})=><div className="em-empty">{children}</div>;
const geography={Block:["Keonjhar Sadar","Harichandanpur","Telkoi","Patna","Ghasipura"]};
const panchayatsByBlock:Record<string,string[]>={"Keonjhar Sadar":["Sanapatna","Raisuan","Banspal"],Harichandanpur:["Rugudi","Janghira","Harichandanpur"],Telkoi:["Telkoi","Jharabeda","Kaliapani"],Patna:["Patna","Turumunga","Kantipal"],Ghasipura:["Ghasipura","Sainkul","Badamasinabilla"]};
const villagesByPanchayat:Record<string,string[]>={Sanapatna:["Green Valley","Sanapatna","Rugudi"],Raisuan:["Raisuan","Kadalibadi"],Banspal:["Banspal","Dhanurjaypur"],Rugudi:["Rugudi","Kantipal"],Janghira:["Janghira","Harichandanpur"],Harichandanpur:["Harichandanpur","Kendujiani"],Telkoi:["Telkoi","Pitamahal","Gourangpur"],Jharabeda:["Jharabeda","Nayakote"],Kaliapani:["Kaliapani","Gandhamardan"],Patna:["Patna","Badajamuposi"],Turumunga:["Turumunga","Brahmaniposi"],Kantipal:["Kantipal","Kantipal"],Ghasipura:["Ghasipura","Keshudurapal"],Sainkul:["Sainkul","Sainkul"],Badamasinabilla:["Badamasinabilla","Brahmaniposi"]};
const panchayatOptions=(block:string)=>panchayatsByBlock[block]||panchayatsByBlock["Keonjhar Sadar"];
const villageOptions=(panchayat:string)=>villagesByPanchayat[panchayat]||villagesByPanchayat.Sanapatna;
const searchText=(r:RecordRow)=>Object.values(r).filter(v=>typeof v==="string"||typeof v==="number").join(" ").toLowerCase();
function queueShareRequest(state:State,setState:Props["setState"],role:string,member:RecordRow,amount:number,setToast:(s:string)=>void){
 const pending=records(state,"shareRequests").filter(r=>r.memberId===member.id&&r.status==="Submitted").reduce((a,r)=>a+Number(r.shares||0),0);
 if(!Number.isInteger(amount)||amount<1||Number(member.shares||0)+pending+amount>500){setToast(`Additional shares must be whole shares; including pending requests the limit is 500. Available: ${Math.max(0,500-Number(member.shares||0)-pending)}.`);return}
 const request:RecordRow={id:`SHR-${Date.now()}`,memberId:member.id,farmerId:member.farmerId,name:member.name,folio:member.folio,shares:amount,capital:amount*100,status:"Submitted",date:stamp(),requestedBy:role,fpcId:"FPC-ODI-001"};
 setState(s=>({...withRows(s,"shareRequests",[request,...records(s,"shareRequests")]),audit:audit(s,role,"submitted additional share request","Shareholders",request.id,null,request),notifications:[notice(`${amount} additional shares requested for ${member.name}`),...(s.notifications||[])]}));
 setToast("Additional-share request submitted; holdings and certificates remain unchanged until approval.");
}

export default function EnhancedModules({state,setState,role,screen,setToast,go,editFarmerId}:Props){
 const s=state;
 const shareScreens=["Register shareholder","Shareholders","Shareholder register","Certificates","My shares","My shareholding","Dividend & benefits","Home","FPC","Meetings","Profile","Shareholder reports","Reports"];
  const farmerScreens=["Register farmer","Farmers","My farmers","Baseline","Baseline survey","Commodity Baseline report","Commodity Baseline reports"];
  const flowScreens=["Produce Purchase","Input Sale","Produce Sale","Input Purchase","Farmer Settlement","Bank statement matching","Advances & Dues","Dues","Payments and Receipts","Bank statement upload"];
  const inventoryScreens=["Inventory","Stock register","Stock dashboard","Movements","Adjustments","Stock","Godowns","Inventory report","Inventory reports","Stock report","Stock reports","Stock valuation report"];
  if(screen==="Network"||screen==="Network view")return role==="TSF Central Admin"?<NetworkModule {...{state,setToast}}/>:null;
 if(shareScreens.includes(screen))return <ShareModule {...{state,setState,role,screen,setToast,go}}/>;
 if(farmerScreens.includes(screen))return <FarmerModule {...{state,setState,role,screen,setToast,go,editFarmerId}}/>;
 if(flowScreens.includes(screen))return <BusinessModule {...{state,setState,role,screen,setToast,go}}/>;
 if(inventoryScreens.includes(screen))return <InventoryModule {...{state,setState,role,screen,setToast}}/>;
 return null;
}

function ShareModule({state,setState,role,screen,setToast,go}:Props){
 const [q,setQ]=useState(""),[step,setStep]=useState(0),[member,setMember]=useState<RecordRow|null>(null),[cert,setCert]=useState<RecordRow|null>(null),[draftId,setDraftId]=useState("");
 const [receiptToShow, setReceiptToShow] = useState<SharePurchaseRecord | null>(null);
 const [f,setF]=useState<Record<string,string>>({name:"",gender:"Female",category:"ST",mobile:"",aadhaar:"",farmerId:"",block:"Keonjhar Sadar",panchayat:"Sanapatna",village:"Green Valley",address:"",pin:"758001",bank:"",account:"",ifsc:"",shares:"50",payment:"Bank transfer",dob:"",occupation:"Farmer"});
 const shareholders=records(state,"shareholders"),certificates=state.certificates||[],isAdmin=role==="FPC Admin / Manager";
 const patch=(key:string,val:string)=>setF(prev=>({...prev,[key]:val}));
 
 const getCert=(m:RecordRow)=>certificates.find(c=>c.uniqueId===m.id||c.certificate===m.certificate||c.folio===m.folio);

 const viewMemberReceipt = (m: RecordRow) => {
  const purchases = records(state, "sharePurchases") as unknown as SharePurchaseRecord[];
  const p = purchases.find(x => x.shareholderId === m.id);
  if (p) {
   setReceiptToShow(p);
  } else {
   const c = getCert(m);
   const sh = Number(m.sharesAllotted ?? c?.shares ?? m.shares ?? 10);
   const face = Number(m.faceValue ?? c?.faceValue ?? 100);
   const synthetic: SharePurchaseRecord = {
    id: `PUR-SH-${String(m.id).replace(/\D/g, "").padStart(4, "0")}`,
    receiptNumber: `RCP-SH-${String(m.id).replace(/\D/g, "").padStart(4, "0")}`,
    shareholderId: m.id,
    shareholderName: m.name,
    farmerId: m.farmerId,
    folio: m.folio || c?.folio || "FL-001",
    folioNumber: m.folio || c?.folio || "FL-001",
    purchaseType: "Initial Allotment",
    sharesPurchased: sh,
    shares: sh,
    faceValue: face,
    totalAmount: sh * face,
    paymentMode: m.payment || "Bank transfer",
    paymentReference: `UTIB202108${String(m.id).replace(/\D/g, "").padStart(4, "0")}`,
    paymentStatus: "Confirmed",
    purchaseConfirmedAt: "2021-08-02T10:00:00.000Z",
    purchaseConfirmedAtFormatted: `${m.allotmentDate || m.admitted || "02 Aug 2021"} · 10:00`,
    certificateEligibleAt: "2021-08-04T10:00:00.000Z",
    certificateEligibleAtFormatted: "04 Aug 2021 · 10:00",
    certificateId: c?.certificate || m.certificate || `SC-${m.id}`,
    distinctiveFrom: Number(c?.distinctiveFrom ?? m.distinctiveFrom ?? 1),
    distinctiveTo: Number(c?.distinctiveTo ?? m.distinctiveTo ?? sh),
    address: m.address || [m.village, m.block, "Keonjhar, Odisha"].filter(Boolean).join(", "),
    fpcId: "FPC-ODI-001"
   };
   setReceiptToShow(synthetic);
  }
 };

 const searchShareholder=(m:RecordRow)=>{
  const c=getCert(m);
  const text=[
   m.name,
   m.id,
   m.farmerId,
   m.folio,
   c?.folio,
   m.address,
   m.village,
   m.block,
   m.mobile,
   c?.distinctiveFrom,
   c?.distinctiveTo,
   c?.certificate
  ].filter(Boolean).join(" ").toLowerCase();
  return text.includes(q.toLowerCase());
 };

 const found=shareholders.filter(searchShareholder);

 const exportShareholderCsv=()=>{
  const headers=[
   "S.No.",
   "Share Holder Name",
   "Address of the Allottee",
   "Class of Security",
   "Date of Allotment",
   "Number of Shares Allotted",
   "Nominal Value",
   "Total Amount Paid on Such Security",
   "Folio Number",
   "Distinctive Number - From",
   "Distinctive Number - To"
  ];
  const rows=found.map((m,idx)=>{
   const c=getCert(m);
   const addr=m.address||[m.village,m.panchayat,m.block,"Keonjhar, Odisha"].filter(Boolean).join(", ")||"Not recorded";
   const secClass=m.classOfSecurity||c?.classOfSecurity||"Equity Shares";
   const allotmentDate=m.allotmentDate||c?.allotted||m.admitted||"Not recorded";
   const shares=Number(m.sharesAllotted??c?.shares??m.shares??0);
   const nominal=Number(m.faceValue??c?.faceValue??100);
   const totalPaid=Number(m.amountPaid??c?.capital??m.capital??(shares*nominal));
   const folio=m.folio||c?.folio||"Not recorded";
   const from=c?.distinctiveFrom??m.distinctiveFrom??"Not recorded";
   const to=c?.distinctiveTo??m.distinctiveTo??"Not recorded";

   return [
    idx+1,
    `"${String(m.name).replaceAll('"','""')}"`,
    `"${String(addr).replaceAll('"','""')}"`,
    `"${secClass}"`,
    `"${allotmentDate}"`,
    shares,
    nominal,
    totalPaid,
    `"${folio}"`,
    from,
    to
   ];
  });

  const content=[headers.join(","),...rows.map(r=>r.join(","))].join("\r\n");
  const blob=new Blob(["\ufeff",content],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="green-valley-shareholder-register.csv";
  link.click();
  URL.revokeObjectURL(url);
  setToast("Shareholder register (Table-B) exported as CSV");
 };

 const prefill=()=>{setF({...f,name:"Pramod Kumar Sahoo",gender:"Male",category:"OBC",mobile:"9876542145",aadhaar:"421763856037",farmerId:"",block:"Harichandanpur",panchayat:"Rugudi",village:"Rugudi",address:"Rugudi, Keonjhar",pin:"758031",bank:"State Bank of India",account:"001234567342",ifsc:"SBIN0004567",shares:"50",payment:"Bank transfer",dob:"1984-06-17",occupation:"Farmer"});setStep(0);setToast("Prompt sample details filled. Review before saving.");};
 useEffect(()=>{if(!f.name.trim()||!["Register shareholder","Shareholders"].includes(screen))return;const timer=setTimeout(()=>{const id=draftId||`SHD-${(f.mobile||f.name.replaceAll(" ","-")).replace(/\W/g,"")}`;setState(st=>{const drafts=records(st,"shareholderDrafts"),row={id,...f,shares:Number(f.shares)||0,capital:(Number(f.shares)||0)*100,status:"Draft",updated:stamp()};return withRows(st,"shareholderDrafts",[row,...drafts.filter(x=>x.id!==id)]);});setDraftId(id);},750);return()=>clearTimeout(timer);},[f,screen]);
 const submit=()=>{
  const sh=Number(f.shares),mobile=f.mobile.replace(/\D/g,""),aad=f.aadhaar.replace(/\D/g,"");
  if(!f.name.trim()||!/^\d{10}$/.test(f.mobile)||!/^\d{12}$/.test(f.aadhaar)||!Number.isInteger(sh)||sh<1||sh>500){setToast("Check required fields: name, unique 10-digit mobile, 12-digit Aadhaar and 1–500 shares.");return}
  if(shareholders.some(x=>String(x.mobile||"").replace(/\D/g,"")===mobile||String(x.aadhaar||"").replace(/\D/g,"")===aad)){setToast("Mobile or Aadhaar already belongs to a shareholder.");return}
  const id=serial(shareholders,"SH-"),certId=serial(certificates,"SC-"),folio=serial(shareholders,"FL-"),max=certificates.reduce((n,c)=>Math.max(n,Number(c.distinctiveTo)||0),6000)+1;
  const row:RecordRow={id,farmerId:f.farmerId,name:f.name,gender:f.gender,category:f.category,mobile:f.mobile,aadhaar:f.aadhaar,address:f.address,pin:f.pin,block:f.block,panchayat:f.panchayat,village:f.village,bank:f.bank,account:f.account,ifsc:f.ifsc,shares:sh,faceValue:100,capital:sh*100,certificate:certId,folio,distinctiveFrom:max,distinctiveTo:max+sh-1,allotmentDate:today(),admitted:today(),classOfSecurity:"Equity Shares",fpcId:"FPC-ODI-001",status:isAdmin?"Active":"Submitted"};
  const now = new Date();
  const confirmedAt = now.toISOString();
  const eligibleAtDate = new Date(now.getTime() + 48 * 3600 * 1000);
  const eligibleAt = eligibleAtDate.toISOString();
  const purchases = records(state, "sharePurchases") as unknown as SharePurchaseRecord[];
  const purId = serial(purchases as unknown as RecordRow[], "PUR-SH-2026-", 4);
  const rcpId = serial(purchases as unknown as RecordRow[], "RCP-SH-2026-", 4);
  const purchaseRec: SharePurchaseRecord = {
    id: purId,
    receiptNumber: rcpId,
    shareholderId: id,
    shareholderName: f.name,
    farmerId: f.farmerId,
    folio,
    folioNumber: folio,
    purchaseType: "Initial Allotment",
    sharesPurchased: sh,
    shares: sh,
    faceValue: 100,
    totalAmount: sh * 100,
    paymentMode: f.payment || "Bank transfer",
    paymentReference: `TXN-${Date.now().toString().slice(-6)}`,
    paymentStatus: "Confirmed",
    purchaseConfirmedAt: confirmedAt,
    purchaseConfirmedAtFormatted: formatDateTime(confirmedAt),
    certificateEligibleAt: eligibleAt,
    certificateEligibleAtFormatted: formatDateTime(eligibleAt),
    certificateId: certId,
    distinctiveFrom: max,
    distinctiveTo: max + sh - 1,
    address: f.address || [f.village, f.block, "Keonjhar, Odisha"].filter(Boolean).join(", "),
    mobile: f.mobile,
    fpcId: "FPC-ODI-001",
    notes: "Table-B share allotment upon shareholder onboarding."
  };
  const c:RecordRow={id:certId,certificate:certId,folio,uniqueId:id,name:f.name,farmerId:f.farmerId,shares:sh,faceValue:100,capital:sh*100,distinctiveFrom:max,distinctiveTo:max+sh-1,allotted:today(),classOfSecurity:"Equity Shares",status:"Pending",certificateEligibleAt:eligibleAt,address:f.address,village:f.village,block:f.block,aadhaar:f.aadhaar,account:f.account,fpcId:"FPC-ODI-001"};
  setState(st=>({
    ...withRows(st,"shareholders",[row,...records(st,"shareholders")]),
    ...withRows(st,"sharePurchases",[purchaseRec as unknown as RecordRow,...records(st,"sharePurchases")]),
    certificates:isAdmin?[c,...(st.certificates||[])]:st.certificates||[],
    audit:audit(st,role,isAdmin?"registered shareholder and confirmed share purchase":"submitted shareholder registration","Shareholders",id,null,row),
    notifications:[notice(`${row.name} share purchase confirmed · Receipt ${rcpId} issued`),...(st.notifications||[])]
  }));
  setState(st=>withRows(st,"shareholderDrafts",records(st,"shareholderDrafts").filter(x=>x.id!==draftId)));
  setDraftId("");setStep(0);
  setReceiptToShow(purchaseRec);
  setToast(isAdmin?`Member ${id} registered! Share purchase receipt ${rcpId} generated immediately. Share certificate pending (available after 48h).`:`${id} submitted for Admin approval. Receipt ${rcpId} generated.`);
 };
  const approve=(m:RecordRow)=>{
    if(!isAdmin){setToast("Only the FPC Admin can approve shareholder registrations.");return}
    const existing=(state.certificates||[]).find(c=>c.uniqueId===m.id);
    const from=(state.certificates||[]).reduce((n,c)=>Math.max(n,Number(c.distinctiveTo)||0),6000)+1;
    const now = new Date();
    const confirmedAt = now.toISOString();
    const eligibleAtDate = new Date(now.getTime() + 48 * 3600 * 1000);
    const eligibleAt = eligibleAtDate.toISOString();
    const existingPurchases = records(state, "sharePurchases") as unknown as SharePurchaseRecord[];
    let purchaseRec = existingPurchases.find(p => p.shareholderId === m.id);
    const purId = serial(existingPurchases as unknown as RecordRow[], "PUR-SH-2026-", 4);
    const rcpId = serial(existingPurchases as unknown as RecordRow[], "RCP-SH-2026-", 4);
    const certId = m.certificate || serial(state.certificates || [], "SC-");
    if (!purchaseRec) {
      purchaseRec = {
        id: purId,
        receiptNumber: rcpId,
        shareholderId: m.id,
        shareholderName: m.name,
        farmerId: m.farmerId,
        folio: m.folio || "FL-001",
        folioNumber: m.folio || "FL-001",
        purchaseType: "Initial Allotment",
        sharesPurchased: Number(m.shares || 0),
        shares: Number(m.shares || 0),
        faceValue: 100,
        totalAmount: Number(m.capital || Number(m.shares) * 100),
        paymentMode: m.payment || "Bank transfer",
        paymentReference: `TXN-${Date.now().toString().slice(-6)}`,
        paymentStatus: "Confirmed",
        purchaseConfirmedAt: confirmedAt,
        purchaseConfirmedAtFormatted: formatDateTime(confirmedAt),
        certificateEligibleAt: eligibleAt,
        certificateEligibleAtFormatted: formatDateTime(eligibleAt),
        certificateId: certId,
        distinctiveFrom: Number(m.distinctiveFrom || from),
        distinctiveTo: Number(m.distinctiveTo || (from + Number(m.shares) - 1)),
        address: m.address,
        mobile: m.mobile,
        fpcId: "FPC-ODI-001"
      };
    }
    const c = existing || {id:certId,certificate:certId,folio:m.folio,uniqueId:m.id,name:m.name,farmerId:m.farmerId,shares:m.shares,faceValue:100,capital:m.capital,distinctiveFrom:m.distinctiveFrom||from,distinctiveTo:m.distinctiveTo||(from+Number(m.shares)-1),allotted:m.allotmentDate||m.admitted||today(),classOfSecurity:"Equity Shares",status:"Pending",certificateEligibleAt:eligibleAt,address:m.address,village:m.village,block:m.block,aadhaar:m.aadhaar,account:m.account,fpcId:"FPC-ODI-001"};
    setState(st=>({
      ...withRows(st,"shareholders",records(st,"shareholders").map(x=>x.id===m.id?{...x,status:"Active",certificate:c.certificate}:x)),
      ...withRows(st,"sharePurchases",[purchaseRec as unknown as RecordRow, ...(records(st,"sharePurchases").filter(p=>p.id!==purchaseRec.id))]),
      certificates:existing?st.certificates:[c,...(st.certificates||[])],
      audit:audit(st,role,"approved registration and issued share receipt","Shareholders",m.id,m.status,"Active"),
      notifications:[notice(`${m.name} membership approved · Receipt ${purchaseRec.receiptNumber} generated`),...(st.notifications||[])]
    }));
    setReceiptToShow(purchaseRec);
    setToast(`${m.id} approved; Share purchase receipt ${purchaseRec.receiptNumber} issued. Certificate available in 48 hours.`);
  };
  const addShares=(m:RecordRow)=>{const n=Number(prompt(`Current ${m.shares} shares. Enter the additional shares to request (maximum holding 500):`,"10"));queueShareRequest(state,setState,role,m,n,setToast);};
  const decideShareRequest=(request:RecordRow,approveIt:boolean)=>{
    if(!["FPC Admin / Manager","Accountant / Finance Officer"].includes(role)){setToast("Only Admin or Accountant can approve additional-share requests.");return}
    const memberRow=shareholders.find(x=>x.id===request.memberId);
    if(!memberRow){setToast("Member record not found; request cannot be approved.");return}
    if(!approveIt){
      const reason=prompt("Reason for rejecting this share request:");
      if(!reason?.trim()){setToast("A rejection reason is required.");return}
      const rejected={...request,status:"Rejected",rejectionReason:reason};
      setState(st=>({...withRows(st,"shareRequests",records(st,"shareRequests").map(x=>x.id===request.id?rejected:x)),audit:audit(st,role,"rejected additional share request","Shareholders",request.id,request.status,reason),notifications:[notice(`${request.id} rejected: ${reason}`),...(st.notifications||[])]}));
      setToast("Request rejected; member holdings were not changed.");
      return;
    }
    const otherPending=records(state,"shareRequests").filter(x=>x.memberId===request.memberId&&x.id!==request.id&&x.status==="Submitted").reduce((a,x)=>a+Number(x.shares||0),0);
    if(Number(memberRow.shares)+otherPending+Number(request.shares)>500){setToast("Approval would exceed the 500-share member limit.");return}
    const cs=state.certificates||[],cid=serial(cs,"SC-"),from=cs.reduce((a,c)=>Math.max(a,Number(c.distinctiveTo)||0),6000)+1;
    const now = new Date();
    const confirmedAt = now.toISOString();
    const eligibleAtDate = new Date(now.getTime() + 48 * 3600 * 1000);
    const eligibleAt = eligibleAtDate.toISOString();
    const existingPurchases = records(state, "sharePurchases") as unknown as SharePurchaseRecord[];
    const purId = serial(existingPurchases as unknown as RecordRow[], "PUR-SH-2026-", 4);
    const rcpId = serial(existingPurchases as unknown as RecordRow[], "RCP-SH-2026-", 4);
    const purchaseRec: SharePurchaseRecord = {
      id: purId,
      receiptNumber: rcpId,
      shareholderId: memberRow.id,
      shareholderName: memberRow.name,
      farmerId: memberRow.farmerId,
      folio: memberRow.folio,
      folioNumber: memberRow.folio,
      purchaseType: "Additional Shares",
      sharesPurchased: Number(request.shares),
      shares: Number(request.shares),
      faceValue: 100,
      totalAmount: Number(request.shares) * 100,
      paymentMode: "Bank transfer",
      paymentReference: `TXN-${Date.now().toString().slice(-6)}`,
      paymentStatus: "Confirmed",
      purchaseConfirmedAt: confirmedAt,
      purchaseConfirmedAtFormatted: formatDateTime(confirmedAt),
      certificateEligibleAt: eligibleAt,
      certificateEligibleAtFormatted: formatDateTime(eligibleAt),
      certificateId: cid,
      distinctiveFrom: from,
      distinctiveTo: from + Number(request.shares) - 1,
      address: memberRow.address,
      mobile: memberRow.mobile,
      fpcId: "FPC-ODI-001"
    };
    const certificate:RecordRow={id:cid,certificate:cid,folio:memberRow.folio,uniqueId:memberRow.id,name:memberRow.name,farmerId:memberRow.farmerId,shares:Number(request.shares),faceValue:100,capital:Number(request.shares)*100,distinctiveFrom:from,distinctiveTo:from+Number(request.shares)-1,allotted:today(),status:"Pending",certificateEligibleAt:eligibleAt,type:"Additional allotment",aadhaar:memberRow.aadhaar,account:memberRow.account,fpcId:"FPC-ODI-001"};
    const approved={...request,status:"Approved",approvedBy:role,approvedAt:stamp(),certificate:cid};
    setState(st=>({
      ...withRows(st,"shareholders",records(st,"shareholders").map(x=>x.id===memberRow.id?{...x,shares:Number(x.shares)+Number(request.shares),capital:(Number(x.shares)+Number(request.shares))*100}:x)),
      ...withRows(st,"shareRequests",records(st,"shareRequests").map(x=>x.id===request.id?approved:x)),
      ...withRows(st,"sharePurchases",[purchaseRec as unknown as RecordRow,...records(st,"sharePurchases")]),
      certificates:[certificate,...(st.certificates||[])],
      audit:audit(st,role,"approved additional-share allotment and issued receipt","Shareholders",request.id,request.status,approved),
      notifications:[notice(`${request.shares} shares approved for ${memberRow.name}; Receipt ${rcpId} generated`),...(st.notifications||[])]
    }));
    setReceiptToShow(purchaseRec);
    setToast(`Request approved · Share purchase receipt ${rcpId} generated immediately! Certificate available in 48 hours.`);
  };
 const reissue=(c:RecordRow)=>{const reason=prompt("Reason for duplicate certificate reissue (required):");if(!reason?.trim()){setToast("A reissue reason is required.");return}const updated={...c,reissueReason:reason.trim(),reissued:today(),duplicate:true};setState(st=>({...st,certificates:(st.certificates||[]).map(x=>x.id===c.id?updated:x),audit:audit(st,role,"duplicate certificate reissued","Certificates",c.id,c,updated),notifications:[notice(`Duplicate certificate reissued: ${c.certificate}`),...(st.notifications||[])]}));setCert(updated);setToast("Duplicate marked for reissue; this is a local demo record.");};
 const print=()=>{if(!cert){setToast("Choose a certificate to preview first.");return}window.print();};
 if(screen==="Shareholder reports"||screen==="Reports")return <ShareReports state={state} setToast={setToast}/>;
 if(["Home","My shares","My shareholding","Dividend & benefits","FPC","Meetings","Profile"].includes(screen))return <Portal {...{state,setState,screen,setToast,go}}/>;
 if(screen==="Certificates")return <section className="em"><Header kicker="Share capital · documentation" title="Share certificates" description="Search issued certificates, preview the A4 landscape mock certificate, or print this browser page. PDF output is a mock and is not an official certificate." actions={<Button testid="cert-print" onClick={print}><Printer size={14}/> Print selected</Button>}/><div className="em-panel"><div className="em-toolbar"><div className="em-search"><Search size={14}/><input data-testid="certificate-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, certificate, folio, member ID"/></div><Button testid="cert-pdf" onClick={()=>setToast("Mock PDF prepared. No official PDF file was created.")}><FileText size={14}/> Mock PDF</Button></div><Table headers={["Certificate","Member","Member ID","Folio","Shares","Capital","Distinctive numbers","Issued","Actions"]}>{certificates.filter(c=>searchText(c).includes(q.toLowerCase())).map(c=><tr key={c.id}><td className="em-mono">{c.certificate||c.id}</td><td><strong>{c.name}</strong></td><td>{c.uniqueId}</td><td>{c.folio}</td><td>{c.shares}</td><td>{money(Number(c.capital)||Number(c.shares)*100)}</td><td>{c.distinctiveFrom||"—"}–{c.distinctiveTo||"—"}</td><td>{c.allotted}</td><td><span className="em-actions-cell"><button data-testid={`preview-${c.id}`} className="em-smallbtn" onClick={()=>setCert(c)}>Preview</button><button data-testid={`reissue-${c.id}`} className="em-smallbtn" onClick={()=>reissue(c)}>Reissue</button></span></td></tr>)}</Table>{!certificates.length&&<Empty>No issued certificates yet.</Empty>}</div>{cert&&<div className="em-modalback" onClick={()=>setCert(null)}><div className="em-modal" onClick={e=>e.stopPropagation()}><div className="em-modalhead"><h3>Certificate preview · mock</h3><button className="em-close" onClick={()=>setCert(null)} aria-label="Close certificate preview"><X size={16}/></button></div><Certificate cert={cert}/><div className="em-actions" style={{marginTop:12}}><Button testid="certificate-print-preview" kind="primary" onClick={()=>window.print()}><Printer size={14}/> Print certificate</Button><Button testid="certificate-mock-export" onClick={()=>setToast("Mock PDF prepared. Print dialog is the only document output.")}>Mock PDF export</Button></div></div></div>}</section>;
 const showForm=screen==="Register shareholder";
 const steps=["Personal data","Address & geography","Bank","Share capital & payment","Review"];
 return <section className="em"><Header kicker="Member-owned · share capital" title={showForm?"Register shareholder":"Shareholder register"} description="Persisted browser demo. Search before creating a member, then capture verified identity and share capital." actions={!showForm&&<Button kind="primary" testid="new-shareholder" onClick={()=>go("Register shareholder")}><Plus size={14}/> Register shareholder</Button>}/>
 {showForm?<><div className="em-panel pad"><div className="em-panel-head"><div><h3>Find an existing member</h3><p>Matches name, mobile, Aadhaar last-four, Farmer ID and shareholder ID.</p></div><span className="em-status blue">Identity check first</span></div><div className="em-search"><Search size={14}/><input data-testid="shareholder-match-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search member name, mobile, Aadhaar last four, Farmer ID or SH ID"/></div>{q&&<div style={{marginTop:10}}>{found.length?found.slice(0,4).map(m=><div key={m.id} className="em-inline" style={{padding:"7px 0",borderBottom:"1px solid #edf1eb"}}><strong>{m.name}</strong><span className="em-mono">{m.id} · {m.mobile}</span><Button testid={`match-profile-${m.id}`} onClick={()=>go(`/shareholders/${m.id}`)}>Profile</Button><Button testid={`match-add-shares-${m.id}`} onClick={()=>addShares(m)}>Additional shares</Button></div>):<small>No existing member match found.</small>}</div>}</div>
 <div className="em-stepbar">{steps.map((x,i)=><button key={x} data-testid={`share-step-${i+1}`} className={`em-step ${step===i?"active":""}`} onClick={()=>setStep(i)}>{String(i+1).padStart(2,"0")} · {x}</button>)}</div>
 <div className="em-panel pad"><div className="em-panel-head"><div><h3>{steps[step]}</h3><p>All data remains in this browser's local demo store.</p></div><span className="em-mono">{draftId||"Draft autosaves while editing"}</span></div>
 {step===0&&<div className="em-grid cols3"><Field label="Full name" value={f.name} onChange={v=>patch("name",v)} testid="sh-name" required/><Field label="Gender" value={f.gender} onChange={v=>patch("gender",v)} options={["Female","Male","Other"]} testid="sh-gender"/><Field label="Social category" value={f.category} onChange={v=>patch("category",v)} options={["ST","SC","OBC","General","Other"]} testid="sh-category"/><Field label="Mobile (10 digits)" value={f.mobile} onChange={v=>patch("mobile",v)} testid="sh-mobile" required/><Field label="Aadhaar (12 digits)" value={f.aadhaar} onChange={v=>patch("aadhaar",v)} testid="sh-aadhaar" required/><Field label="Date of birth" type="date" value={f.dob} onChange={v=>patch("dob",v)} testid="sh-dob"/><Field label="Farmer ID (optional)" value={f.farmerId} onChange={v=>patch("farmerId",v)} testid="sh-farmer-id"/><Field label="Occupation" value={f.occupation} onChange={v=>patch("occupation",v)} testid="sh-occupation"/></div>}
 {step===1&&<div className="em-grid cols3"><Field label="District" value="Keonjhar" onChange={()=>{}} options={["Keonjhar"]} testid="sh-district"/><Field label="State" value="Odisha" onChange={()=>{}} options={["Odisha"]} testid="sh-state"/><Field label="Block" value={f.block} onChange={v=>{const p=panchayatOptions(v)[0];patch("block",v);patch("panchayat",p);patch("village",villageOptions(p)[0]);}} options={geography.Block} testid="sh-block"/><Field label="Panchayat" value={f.panchayat} onChange={v=>{patch("panchayat",v);patch("village",villageOptions(v)[0]);}} options={panchayatOptions(f.block)} testid="sh-panchayat"/><Field label="Village" value={f.village} onChange={v=>patch("village",v)} options={villageOptions(f.panchayat)} testid="sh-village"/><Field label="PIN code" value={f.pin} onChange={v=>patch("pin",v)} testid="sh-pin"/><Field label="Postal address" value={f.address} onChange={v=>patch("address",v)} testid="sh-address"/></div>}
 {step===2&&<div className="em-grid cols3"><Field label="Bank name" value={f.bank} onChange={v=>patch("bank",v)} testid="sh-bank"/><Field label="Account number" value={f.account} onChange={v=>patch("account",v)} testid="sh-account"/><Field label="IFSC" value={f.ifsc} onChange={v=>patch("ifsc",v.toUpperCase())} testid="sh-ifsc"/></div>}
 {step===3&&<div className="em-grid cols3"><Field label="Shares (1–500)" type="number" value={f.shares} onChange={v=>patch("shares",v)} testid="sh-shares" required/><Field label="Face value per share" value="Rs 100" onChange={()=>{}} testid="sh-face-value"/><Field label="Payment mode" value={f.payment} onChange={v=>patch("payment",v)} options={["Bank transfer","Cash","Cheque","UPI"]} testid="sh-payment"/><div className="em-stat"><small>Share capital</small><b>{money((Number(f.shares)||0)*100)}</b><span>Automatically synchronised · Rs 100 per share</span></div></div>}
 {step===4&&<div className="em-grid cols3">{[["Member",f.name],["Mobile",f.mobile],["Identity",f.aadhaar],["Location",`${f.village}, ${f.block}`],["Bank",f.bank],["Share capital",`${f.shares} shares · ${money((Number(f.shares)||0)*100)}`]].map(([a,b])=><div className="em-field" key={a}><label>{a}</label><div className="em-readonly">{b||"Not provided"}</div></div>)}<div className="em-note em-wide">Membership approval is subject to cooperative review. Admin users activate directly; Data Entry submissions remain pending approval.</div></div>}
 <div className="em-formfoot"><div className="em-inline"><Button testid="share-sample" onClick={prefill}>Fill sample · Pramod Kumar Sahoo</Button><Button testid="share-save-draft" onClick={()=>{const id=draftId||`SHD-${(f.mobile||f.name.replaceAll(" ","-")).replace(/\W/g,"")}`;setDraftId(id);setState(st=>{const draft={id,...f,shares:Number(f.shares)||0,capital:(Number(f.shares)||0)*100,status:"Draft",updated:stamp()};return withRows(st,"shareholderDrafts",[draft,...records(st,"shareholderDrafts").filter(x=>x.id!==id)]);});setToast("Shareholder draft saved in this browser.");}}>Save Draft</Button></div><div className="em-inline">{step>0&&<Button testid="share-prev" onClick={()=>setStep(step-1)}><ChevronLeft size={14}/> Back</Button>}{step<4?<Button kind="primary" testid="share-next" onClick={()=>setStep(step+1)}>Continue <ChevronRight size={14}/></Button>:<Button kind="primary" testid="share-submit" onClick={submit}><Check size={14}/> {isAdmin?"Create active member":"Submit for approval"}</Button>}</div></div></div>
 </>:<><div className="em-stats"><Stat label="Shareholders" value={shareholders.length.toLocaleString()} detail="Current register"/><Stat label="Issued capital" value={money(shareholders.reduce((a,x)=>a+Number(x.capital||Number(x.shares)*100),0))} detail="Derived from holdings"/><Stat label="Total shares" value={shareholders.reduce((a,x)=>a+Number(x.shares||0),0).toLocaleString()} detail="Rs 100 face value"/><Stat label="Pending review" value={shareholders.filter(x=>x.status==="Submitted").length.toString()} detail="Awaiting Admin action"/></div><div className="em-panel">
  <div className="sh-table-header">
   <div className="sh-table-title-group">
    <span className="sh-table-kicker">TABLE-B · LIST OF ALLOTTEES IN CASE OF ISSUE OF SHARES FOR CASH</span>
    <h3 className="sh-table-title">LIST OF ALLOTTEES</h3>
   </div>
  </div>
  <div className="sh-table-toolbar">
   <div className="sh-table-toolbar-left">
    <div className="em-search" style={{flex:1,maxWidth:380}}>
     <Search size={14}/>
     <input data-testid="shareholder-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, folio, distinctive number, ID or mobile"/>
    </div>
   </div>
   <div className="sh-table-toolbar-right">
    <span className="sh-count-badge">
     {found.length} allottee record{found.length===1?"":"s"}
    </span>
    <Button testid="shareholder-export" onClick={exportShareholderCsv}>
     <ArrowDownToLine size={13}/> Export CSV
    </Button>
   </div>
  </div>
  <div className="em-tablewrap">
   <table className="sh-table" data-testid="table-shareholders-allottees">
    <thead>
     <tr>
      <th rowSpan={2} className="sh-col-sno">S.No.</th>
      <th rowSpan={2} className="sh-col-name">Share Holder Name</th>
      <th rowSpan={2} className="sh-col-address">Address of the Allottee</th>
      <th rowSpan={2} className="sh-col-class">Class of Security</th>
      <th rowSpan={2} className="sh-col-date">Date of Allotment</th>
      <th rowSpan={2} className="sh-col-shares">Number of Shares Allotted</th>
      <th rowSpan={2} className="sh-col-nominal">Nominal Value</th>
      <th rowSpan={2} className="sh-col-total">Total Amount Paid on Such Security</th>
      <th rowSpan={2} className="sh-col-folio">Folio Number</th>
      <th colSpan={2} style={{textAlign:"center",borderBottom:"1px solid #dbe4dc"}}>Distinctive Number</th>
      <th rowSpan={2} className="sh-col-actions">Actions</th>
     </tr>
     <tr>
      <th className="sh-col-distinctive">From</th>
      <th className="sh-col-distinctive">To</th>
     </tr>
    </thead>
    <tbody>
     {found.map((m,idx)=>{
      const c=getCert(m);
      const addr=m.address||[m.village,m.panchayat,m.block,"Keonjhar, Odisha"].filter(Boolean).join(", ")||"Not recorded";
      const secClass=m.classOfSecurity||c?.classOfSecurity||"Equity Shares";
      const allotmentDate=m.allotmentDate||c?.allotted||m.admitted||"Not recorded";
      const shares=Number(m.sharesAllotted??c?.shares??m.shares??0);
      const nominal=Number(m.faceValue??c?.faceValue??100);
      const totalPaid=Number(m.amountPaid??c?.capital??m.capital??(shares*nominal));
      const folio=m.folio||c?.folio||"Not recorded";
      const from=c?.distinctiveFrom??m.distinctiveFrom??"Not recorded";
      const to=c?.distinctiveTo??m.distinctiveTo??"Not recorded";

      return (
       <tr key={m.id} onClick={()=>go("/shareholders/"+m.id)} style={{cursor:"pointer"}} className="em-click-row">
        <td className="sh-col-sno" style={{color:"#6b7280"}}>{idx+1}</td>
        <td className="sh-col-name">
         <strong style={{color:"#166534",display:"block"}}>{m.name}</strong>
         <small style={{display:"block",color:"#7a8a7f",fontSize:10,marginTop:2}}>
          {m.id}{m.farmerId?` · ${m.farmerId}`:""}
         </small>
        </td>
        <td className="sh-col-address">{addr}</td>
        <td className="sh-col-class">
         <span className="em-status blue" style={{fontSize:9.5,padding:"2px 7px"}}>{secClass}</span>
        </td>
        <td className="sh-col-date" style={{color:"#4f6255"}}>{allotmentDate}</td>
        <td className="sh-col-shares" style={{fontWeight:700,color:"#1f3327"}}>{shares.toLocaleString()}</td>
        <td className="sh-col-nominal" style={{fontFamily:"monospace"}}>{money(nominal)}</td>
        <td className="sh-col-total" style={{fontWeight:700,color:"#166534"}}>{money(totalPaid)}</td>
        <td className="sh-col-folio em-mono">{folio}</td>
        <td className="sh-col-distinctive em-mono">{from}</td>
        <td className="sh-col-distinctive em-mono">{to}</td>
        <td className="sh-col-actions" onClick={e=>e.stopPropagation()}>
         <div className="em-actions-cell" style={{justifyContent:"center"}}>
          <button className="em-smallbtn" data-testid={`member-view-${m.id}`} onClick={(e)=>{e.stopPropagation();go("/shareholders/"+m.id);}}>View</button>
          <button className="em-smallbtn" data-testid={`member-receipt-${m.id}`} onClick={(e)=>{e.stopPropagation();viewMemberReceipt(m);}}>Receipt</button>
          {m.status==="Submitted"&&<button className="em-smallbtn" data-testid={`member-approve-${m.id}`} onClick={(e)=>{e.stopPropagation();approve(m);}}>Approve</button>}
          <button className="em-smallbtn" data-testid={`member-add-${m.id}`} onClick={(e)=>{e.stopPropagation();addShares(m);}}>+ Shares</button>
         </div>
        </td>
       </tr>
      );
     })}
    </tbody>
   </table>
   {!found.length&&<Empty>No matching shareholder allottees found.</Empty>}
  </div>
 </div></>}
  {!showForm&&["FPC Admin / Manager","Accountant / Finance Officer"].includes(role)&&<div className="em-panel"><div className="em-panel-head" style={{padding:"15px 15px 0"}}><div><h3>Additional-share approval queue</h3><p>Approving an entry updates holdings and issues a new certificate; requests do not change member balances before approval.</p></div><span className="em-status pending">{records(state,"shareRequests").filter(r=>r.status==="Submitted").length} pending</span></div><Table headers={["Request","Member","Unique ID","Folio","Shares requested","Capital","Requested","Status","Actions"]}>{records(state,"shareRequests").filter(r=>r.status==="Submitted"||r.status==="Rejected").map(r=><tr key={r.id}><td className="em-mono">{r.id}</td><td><strong>{r.name}</strong></td><td>{r.memberId}</td><td>{r.folio}</td><td>{r.shares}</td><td>{money(Number(r.capital)||Number(r.shares)*100)}</td><td>{r.date}</td><td><Status value={r.status}/>{r.rejectionReason&&<small>{r.rejectionReason}</small>}</td><td>{r.status==="Submitted"?<div className="em-actions-cell"><button className="em-smallbtn" data-testid={`share-request-approve-${r.id}`} onClick={()=>decideShareRequest(r,true)}>Approve &amp; issue</button><button className="em-smallbtn" data-testid={`share-request-reject-${r.id}`} onClick={()=>decideShareRequest(r,false)}>Reject</button></div>:"—"}</td></tr>)}</Table>{!records(state,"shareRequests").length&&<Empty>No additional-share requests are pending.</Empty>}</div>}
  {receiptToShow&&<SharePurchaseReceipt receipt={receiptToShow} onClose={()=>setReceiptToShow(null)}/>}
  {member&&<div className="em-modalback" onClick={()=>setMember(null)}><div className="em-modal" onClick={e=>e.stopPropagation()}><div className="em-modalhead"><h3>Member profile · {member.id}</h3><button className="em-close" onClick={()=>setMember(null)} aria-label="Close profile"><X size={16}/></button></div><div className="em-grid cols2">{Object.entries({Name:member.name,Status:member.status,FarmerID:member.farmerId||"Not linked",Mobile:mask(member.mobile),Aadhaar:mask(member.aadhaar),Address:member.address||member.village,Block:member.block,Shares:member.shares,Capital:money(Number(member.capital)||0),Folio:member.folio,Certificate:member.certificate,"Bank account":mask(member.account)}).map(([k,v])=><div className="em-field" key={k}><label>{k}</label><div className="em-readonly">{String(v||"—")}</div></div>)}</div><div className="em-actions" style={{marginTop:14}}><Button testid="profile-add-shares" kind="primary" onClick={()=>{addShares(member);setMember(null);}}>Request additional shares</Button></div></div></div>}</section>;
}

function Stat({label,value,detail}:{label:string;value:string;detail:string}){return <div className="em-stat" data-testid={`stat-${label.toLowerCase().replaceAll(" ","-")}`}><small>{label}</small><b>{value}</b><span>{detail}</span></div>}
export function mask(value:any){const v=String(value||"");return v.length>4?`${"•".repeat(Math.max(0,v.length-4))}${v.slice(-4)}`:"Not on file";}
export function Certificate({cert}:{cert:RecordRow}){const amount=Number(cert.capital)||Number(cert.shares)*100;return <div className="em-cert em-print-target"><div className="em-cert-number"><span>Certificate No. {cert.certificate||cert.id}</span><span>Folio {cert.folio}</span></div><div className="em-cert-top"><small>GREEN VALLEY FARMER PRODUCER COMPANY LIMITED</small><h2>Share Certificate</h2><div>FPC CIN: U01100OD2021PTC037821</div></div><div className="em-cert-body">This is to certify that <b>{cert.name}</b> of {cert.address||`${cert.village||"Keonjhar"}, Odisha`} is the registered holder of <b>{cert.shares} ( {words(Number(cert.shares))} ) fully paid shares</b> of Rs 100 each, amounting to <b>{money(amount)} ({words(amount)} rupees)</b>, subject to the Articles of Association of the Company.<div className="em-cert-details"><div><span>Shares</span><br/><b>{cert.shares}</b></div><div><span>Face value</span><br/><b>Rs 100</b></div><div><span>Capital paid</span><br/><b>{money(amount)}</b></div><div><span>Distinctive numbers</span><br/><b>{cert.distinctiveFrom||"—"} to {cert.distinctiveTo||"—"}</b></div><div><span>Allotment date</span><br/><b>{cert.allotted||today()}</b></div><div><span>Member / Farmer ID</span><br/><b>{cert.uniqueId} / {cert.farmerId||"—"}</b></div></div><p>Each member shall have one vote, irrespective of the number of shares held.</p></div><div className="em-cert-sign"><span>Member signature<br/>_____________________</span><span>Authorised signatory<br/>_____________________</span><span className="em-qr">QR<br/>PLACEHOLDER</span></div></div>}
export function words(value:number){if(!Number.isFinite(value))return "";const small=["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"],tens=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];const w=(n:number):string=>n<20?small[n]:n<100?`${tens[Math.floor(n/10)]}${n%10?` ${small[n%10]}`:""}`:n<1000?`${small[Math.floor(n/100)]} hundred${n%100?` ${w(n%100)}`:""}`:n<100000?`${w(Math.floor(n/1000))} thousand${n%1000?` ${w(n%1000)}`:""}`:`${w(Math.floor(n/100000))} lakh${n%100000?` ${w(n%100000)}`:""}`;return w(Math.floor(value));}

function ShareReports({state,setToast}:{state:State;setToast:(s:string)=>void}){
 const [report,setReport]=useState("Shareholder Register"),[q,setQ]=useState(""),[filter,setFilter]=useState("All");
 const names=["Shareholder Register","Share Capital Summary","Gender-wise Shareholder Report","Category-wise Member Report","Geography-wise Shareholder Report","Unique ID-wise Farmer Tracking Report"];
 const all=records(state,"shareholders"),rows=all.filter(r=>(filter==="All"||r.category===filter)&&searchText(r).includes(q.toLowerCase()));
 const totals=rows.reduce((o,r)=>({...o,count:o.count+1,shares:o.shares+Number(r.shares||0),capital:o.capital+Number(r.capital||Number(r.shares)*100)}),{count:0,shares:0,capital:0});
 const aggregate=(key:string)=>Object.entries(rows.reduce((out,r)=>{const k=String(r[key]||"Not recorded");const old=out[k]||{members:0,shares:0,capital:0};out[k]={members:old.members+1,shares:old.shares+Number(r.shares||0),capital:old.capital+Number(r.capital||Number(r.shares)*100)};return out;},{} as Record<string,{members:number;shares:number;capital:number}>)).sort((a,b)=>b[1].members-a[1].members);
 const linked=rows.filter(r=>r.farmerId).map(r=>({share:r,farmer:records(state,"farmers").find(f=>f.id===r.farmerId)}));
 const womenShares=rows.filter(r=>String(r.gender).toLowerCase()==="female").reduce((a,r)=>a+Number(r.shares||0),0);
 const bands=([["1–10",1,10],["11–25",11,25],["26–50",26,50],["51–100",51,100],["101–500",101,500]] as Array<[string,number,number]>).map(([label,min,max])=>({label,min,max,count:rows.filter(r=>Number(r.shares)>=min&&Number(r.shares)<=max).length}));
 const isCapital=report==="Share Capital Summary",isGender=report==="Gender-wise Shareholder Report",isCategory=report==="Category-wise Member Report",isGeo=report==="Geography-wise Shareholder Report",isTracking=report==="Unique ID-wise Farmer Tracking Report";
 return <section className="em"><Header kicker="Cooperative intelligence" title="Shareholder reports" description="Derived from the browser register. Report views exclude private Aadhaar, phone and bank details. Print and export are local mock actions." actions={<><Button testid="share-report-print" onClick={()=>window.print()}><Printer size={14}/> Print</Button><Button testid="share-report-export" onClick={()=>setToast("Mock report export prepared; no Excel file was created.")}><ArrowDownToLine size={14}/> Mock export</Button></>}/><div className="em-pillrow">{names.map(n=><button key={n} className={`em-pill ${report===n?"active":""}`} data-testid={`report-${n.toLowerCase().replaceAll(" ","-")}`} onClick={()=>setReport(n)}>{n}</button>)}</div><div className="em-stats"><Stat label="Members in view" value={totals.count.toLocaleString()} detail="Filtered shareholder register"/><Stat label="Paid-up capital" value={money(totals.capital)} detail="Rs 100 face value"/><Stat label="Shares issued" value={totals.shares.toLocaleString()} detail="Current holdings"/><Stat label="Farmer IDs linked" value={linked.length.toString()} detail="Unique ID tracking"/></div>
 <div className="em-panel"><div className="em-panel-head" style={{padding:"15px 15px 0"}}><div><h3>{report}</h3><p>Green Valley FPC · current persisted browser records</p></div></div><div className="em-toolbar"><div className="em-search"><Search size={14}/><input data-testid="share-report-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search report records"/></div><select className="em-select" data-testid="share-report-category-filter" value={filter} onChange={e=>setFilter(e.target.value)}>{["All","ST","SC","OBC","General"].map(x=><option key={x}>{x}</option>)}</select></div>
  {isCapital?<><div className="em-grid cols3" style={{padding:15}}><Stat label="Authorised share capital" value={money(10000000)} detail="Rs 1 crore · company demo limit"/><Stat label="Paid-up capital" value={money(totals.capital)} detail="Sum of current member holdings"/><Stat label="Shares issued" value={totals.shares.toLocaleString()} detail="Rs 100 each"/></div><Table headers={["Shareholding band","Members","Share count","Capital"]}>{bands.map(b=>{const list=rows.filter(r=>Number(r.shares)>=b.min&&Number(r.shares)<=b.max);return <tr key={b.label}><td><strong>{b.label} shares</strong></td><td>{b.count}</td><td>{list.reduce((a,r)=>a+Number(r.shares||0),0)}</td><td>{money(list.reduce((a,r)=>a+Number(r.capital||Number(r.shares)*100),0))}</td></tr>})}</Table></>
 :isGender?<Table headers={["Gender","Members","Shares","Capital","Share count %"]}>{aggregate("gender").map(([k,v])=><tr key={k}><td><strong>{k}</strong></td><td>{v.members}</td><td>{v.shares}</td><td>{money(v.capital)}</td><td>{totals.shares?`${(v.shares/totals.shares*100).toFixed(1)}%`:"0%"}</td></tr>)}<tr><td><strong>Women members' share of total issued shares</strong></td><td colSpan={3}>{womenShares.toLocaleString()} of {totals.shares.toLocaleString()} shares</td><td>{totals.shares?`${(womenShares/totals.shares*100).toFixed(1)}%`:"0%"}</td></tr></Table>
 :isCategory?<Table headers={["Social category","Members","Shares","Paid-up capital","Capital %"]}>{aggregate("category").map(([k,v])=><tr key={k}><td><strong>{k}</strong></td><td>{v.members}</td><td>{v.shares}</td><td>{money(v.capital)}</td><td>{totals.capital?`${(v.capital/totals.capital*100).toFixed(1)}%`:"0%"}</td></tr>)}</Table>
 :isGeo?<Table headers={["Block","Members","Shares","Capital"]}>{aggregate("block").map(([k,v])=><tr key={k}><td><strong>{k}</strong></td><td>{v.members}</td><td>{v.shares}</td><td>{money(v.capital)}</td></tr>)}</Table>
 :isTracking?<Table headers={["Farmer ID","Shareholder ID","Member","Farm activity","Land / village","Membership"]}>{linked.map(({share,farmer})=><tr key={share.id}><td className="em-mono">{share.farmerId}</td><td>{share.id}</td><td><strong>{share.name}</strong></td><td>{farmer?.crop||"Activity not recorded"}</td><td>{farmer?.land||share.village||"—"} · {farmer?.village||share.village||"—"}</td><td><Status value={share.status||"Active"}/></td></tr>)}</Table>
 :<Table headers={["Member ID","Name","Farmer ID","Gender","Category","Village","Block","Shares","Capital"]}>{rows.map(r=><tr key={r.id}><td className="em-mono">{r.id}</td><td><strong>{r.name}</strong></td><td>{r.farmerId||"Not linked"}</td><td>{r.gender||"—"}</td><td>{r.category||"—"}</td><td>{r.village||"—"}</td><td>{r.block||"—"}</td><td>{r.shares}</td><td>{money(Number(r.capital)||Number(r.shares)*100)}</td></tr>)}</Table>}
 {!rows.length&&<Empty/>}</div></section>;
}

function Portal({state,setState,screen,setToast,go}:{state:State;setState:Props["setState"];screen:string;setToast:(s:string)=>void;go:(s:string)=>void}){const [period,setPeriod]=useState("today");const memberId=state.memberId||"F-001",share=records(state,"shareholders").find(x=>x.id===memberId||x.farmerId===memberId)||records(state,"shareholders")[0],farmer=records(state,"farmers").find(x=>x.id===memberId),name=share?.name||farmer?.name||"Ravi Kumar",certs=(state.certificates||[]).filter(c=>c.uniqueId===share?.id),shares=Number(share?.shares||0),capital=Number(share?.capital||shares*100);const rates=(state.rateHistory||[]).filter(r=>r.kind==="produce");const selectedKey=period==="today"?"today":period==="yesterday"?"yesterday":"weekAgo";
 if(screen==="FPC")return <section className="em"><Header kicker="Member information" title="Green Valley FPC" description="A member-owned producer company serving farmers across Keonjhar, Odisha."/><div className="em-grid cols2"><div className="em-panel pad"><h3>Company details</h3><p>Green Valley Farmer Producer Company Limited</p><p>FPC CIN · U01100OD2021PTC037821</p><p>Keonjhar, Odisha · Cooperative member network</p><p>Membership principle: one member, one vote.</p></div><div className="em-panel pad"><h3>Shareholder rights</h3><p>Members participate in general meetings and elect representation in accordance with company rules.</p><p>Share capital and dividends are subject to approval and statutory requirements.</p></div></div></section>;
  if(screen==="Meetings")return <section className="em"><Header kicker="Member governance" title="Meetings" description="AGM notices and your participation record."/><div className="em-panel"><Table headers={["Meeting","Date","Venue","Notice","RSVP / proxy"]}>{[...records(state,"meetings"),{id:"MTG-2027-AGM",name:"Annual General Meeting · FY 2026–27",date:"21 Sep 2027 · 11:00 AM",venue:"Community Hall, Green Valley",status:"Upcoming"}].map(m=><tr key={m.id}><td><strong>{m.name}</strong></td><td>{m.date}</td><td>{m.venue}</td><td><Status value={m.status||"Notified"}/></td><td><button className="em-smallbtn" data-testid={`rsvp-${m.id}`} onClick={()=>{setState(s=>withRows(s,"meetingResponses",[{id:`RSVP-${Date.now()}`,meetingId:m.id,memberId:share?.id||memberId,name,status:"Attending",date:stamp()},...records(s,"meetingResponses")]));setToast("RSVP saved in this browser.");}}>RSVP attending</button><button className="em-smallbtn" data-testid={`proxy-${m.id}`} onClick={()=>{const p=prompt("Proxy representative name:");if(p?.trim()){setState(s=>withRows(s,"meetingResponses",[{id:`PRX-${Date.now()}`,meetingId:m.id,memberId:share?.id||memberId,proxy:p,status:"Proxy nominated",date:stamp()},...records(s,"meetingResponses")]));setToast("Proxy nomination saved locally.");}}}>Name proxy</button></td></tr>)}</Table></div></section>;
 if(screen==="Profile")return <section className="em"><Header kicker="Member account" title="Profile" description="Sensitive values are masked in this demo. Request a correction for staff review."/><div className="em-panel pad"><div className="em-grid cols3">{[["Name",name],["Member ID",share?.id||memberId],["Farmer ID",share?.farmerId||"Not linked"],["Mobile",mask(share?.mobile)],["Aadhaar",mask(share?.aadhaar)],["Address",share?.address||share?.village||"On file"],["Bank account",mask(share?.account)],["Language",state.language||"English"]].map(([a,b])=><div className="em-field" key={a}><label>{a}</label><div className="em-readonly">{b}</div></div>)}</div><div className="em-actions" style={{marginTop:15}}><Button testid="profile-correction" kind="primary" onClick={()=>{const detail=prompt("Describe the profile correction requested:");if(detail?.trim()){setState(s=>withRows(s,"profileCorrections",[{id:`COR-${Date.now()}`,memberId:share?.id||memberId,detail,status:"Submitted",date:stamp()},...records(s,"profileCorrections")]));setToast("Correction request sent to FPC staff.");}}}>Request profile correction</Button>{["English","Odia","Hindi"].map(l=><Button key={l} testid={`language-${l.toLowerCase()}`} kind={state.language===l?"primary":""} onClick={()=>setState(s=>({...s,language:l}))}>{l}</Button>)}</div></div></section>;
 return <section className="em"><Header kicker={`Shareholder portal · ${name}`} title={screen==="Home"?"Your membership":screen==="My shares"||screen==="My shareholding"?"My shares":"Dividend & benefits"} description="A clear view of membership, share certificates, FPC rates and participation." actions={<select className="em-select" data-testid="portal-member-picker" value={memberId} onChange={e=>setState(s=>({...s,memberId:e.target.value}))}>{records(state,"farmers").slice(0,25).map(f=><option key={f.id} value={f.id}>{f.name} · {f.id}</option>)}</select>}/><div className="em-banner"><div><span className="em-kicker" style={{color:"#d8e7d7"}}>GREEN VALLEY · KEONJHAR</span><h3>Namaskar, {name.split(" ")[0]}.</h3><p>Membership is a shared stake in a farmer-owned business. One member, one vote.</p></div><div className="em-actions"><Button testid="portal-add-shares" onClick={()=>{const amount=Number(prompt("Request additional shares (1–500 total holding):","10"));if(!Number.isInteger(amount)||amount<1){setToast("Enter a whole number of shares.");return}setState(s=>withRows(s,"shareRequests",[{id:`SRQ-${Date.now()}`,memberId:share?.id||memberId,name,shares:amount,capital:amount*100,status:"Requested",date:stamp()},...records(s,"shareRequests")]));setToast("Additional-share request sent for review.");}}>Request additional shares</Button></div></div><div className="em-stats"><Stat label="Shares held" value={shares.toLocaleString()} detail={`Member folio ${share?.folio||"—"}`}/><Stat label="Share capital" value={money(capital)} detail="Rs 100 face value per share"/><Stat label="Certificates" value={certs.length.toString()} detail="Allotment record"/><Stat label="Membership" value={share?.status||"Active"} detail="Current local profile"/></div>{screen==="Home"&&<div className="em-grid cols2"><div className="em-panel pad"><div className="em-panel-head"><div><h3>Membership at a glance</h3><p>Certificate and allotment history</p></div><button className="em-smallbtn" onClick={()=>go("My shares")}>All shares →</button></div>{certs.length?certs.map(c=><div key={c.id} className="em-inline" style={{justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #edf1eb"}}><span><strong>{c.certificate}</strong><small style={{display:"block",color:"#849087",marginTop:3}}>{c.shares} shares · allotted {c.allotted}</small></span><button className="em-smallbtn" data-testid={`portal-certificate-${c.id}`} onClick={()=>setToast("Certificate preview is available in the Certificates module.")}>View certificate</button></div>):<Empty>No certificate is associated with this member profile.</Empty>}</div><div className="em-panel pad"><div className="em-panel-head"><div><h3>FPC rates</h3><p>Indicative rates · final rate at transaction</p></div><button className="em-smallbtn" onClick={()=>go("FPC rates")}>Full board →</button></div><div className="em-pillrow">{[["today","Today"],["yesterday","Yesterday"],["weekAgo","1 week ago"]].map(([k,l])=><button key={k} className={`em-pill ${period===k?"active":""}`} data-testid={`portal-rate-${k}`} onClick={()=>setPeriod(k)}>{l}</button>)}</div>{rates.slice(0,5).map(r=><div key={r.id} className="em-inline" style={{justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #edf1eb"}}><span>{r.name}</span><strong>{money(Number(r[selectedKey]||r.today))} / {r.unit}</strong></div>)}</div></div>}
 {screen==="My shares"||screen==="My shareholding"?<div className="em-panel"><div className="em-panel-head" style={{padding:"15px 15px 0"}}><div><h3>Certificate & allotment history</h3><p>Member ID and folio remain stable across additional certificates.</p></div></div><Table headers={["Certificate","Member ID","Folio","Shares","Capital","Distinctive numbers","Allotted"]}>{certs.map(c=><tr key={c.id}><td>{c.certificate}</td><td>{share?.id}</td><td>{share?.folio}</td><td>{c.shares}</td><td>{money(Number(c.capital)||Number(c.shares)*100)}</td><td>{c.distinctiveFrom||"—"}–{c.distinctiveTo||"—"}</td><td>{c.allotted}</td></tr>)}</Table></div>:null}
 {screen==="Dividend & benefits"&&<div className="em-grid cols2"><div className="em-panel pad"><h3>Illustrative P&amp;L summary</h3><p>Member share capital · {money(capital)}</p><p>FY 2025–26 indicative patronage reference · {money(500)}</p><p>Dividend record · {money(50)}</p><div className="em-note">Any dividend or patronage distribution is not guaranteed. Figures shown are illustrative demo values and require formal approval.</div></div><div className="em-panel pad"><h3>Rates by period</h3><div className="em-pillrow">{[["today","Today"],["yesterday","Yesterday"],["weekAgo","1 week ago"]].map(([k,l])=><button key={k} className={`em-pill ${period===k?"active":""}`} onClick={()=>setPeriod(k)} data-testid={`benefit-rate-${k}`}>{l}</button>)}</div>{rates.slice(0,8).map(r=><p key={r.id}>{r.name} <strong style={{float:"right"}}>{money(Number(r[selectedKey]||r.today))}/{r.unit}</strong></p>)}</div></div>}</section>;
}

function FarmerModule({state,setState,role,screen,setToast,go,editFarmerId}:Props){
  const [q,setQ]=useState(""),[step,setStep]=useState(0);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [successFarmer,setSuccessFarmer]=useState<{id:string;name:string}|null>(null);

  const isEdit=Boolean(editFarmerId);
  const targetFarmer=isEdit?(records(state,"farmers").find(x=>x.id===editFarmerId)||records(state,"farmerApplications").find(x=>x.id===editFarmerId)):null;

  const initialForm={name:"",gender:"Female",category:"ST",mobile:"",aadhaar:"",village:"Green Valley",block:"Keonjhar Sadar",panchayat:"Sanapatna",address:"",pin:"758001",land:"2.4",landUnit:"acre",plots:"2",plotArea:"1.2",crop:"Paddy",season:"Kharif",cropArea:"1.8",livestock:"2 goats, 1 cow",allied:"Poultry",agroforestry:"Mango and neem",ntfp:"Sal leaf collection",dairy:"1 cow · 4 litres/day",bank:"",account:"",ifsc:"",consent:"yes"};
  const [f,setF]=useState<Record<string,string>>(initialForm);

  const farmers=records(state,"farmers"),drafts=records(state,"farmerDrafts"),applications=records(state,"farmerApplications"),pending=role==="FPC Admin / Manager"||role==="TSF Central Admin";
  const patch=(k:string,v:string)=>setF(x=>({...x,[k]:v}));

  useEffect(()=>{
    if(targetFarmer){
      const rawLand=String(targetFarmer.land||"2.4").trim();
      const match=rawLand.match(/^([\d.]+)\s*(acre|acres|hectare|hectares|guntha|gunthas)?/i);
      let land="2.4",landUnit="acre";
      if(match){
        land=match[1];
        let u=(match[2]||"acre").toLowerCase();
        if(u==="acres")u="acre";
        if(u==="hectares")u="hectare";
        if(u==="gunthas")u="guntha";
        landUnit=u;
      }
      setF({
        name:String(targetFarmer.name||""),
        gender:String(targetFarmer.gender||"Female"),
        category:String(targetFarmer.category||"ST"),
        mobile:String(targetFarmer.mobile||""),
        aadhaar:String(targetFarmer.aadhaar||""),
        village:String(targetFarmer.village||"Green Valley"),
        block:String(targetFarmer.block||"Keonjhar Sadar"),
        panchayat:String(targetFarmer.panchayat||"Sanapatna"),
        address:String(targetFarmer.address||""),
        pin:String(targetFarmer.pin||"758001"),
        land:targetFarmer.landArea?String(targetFarmer.landArea):land,
        landUnit:targetFarmer.landUnit||landUnit,
        plots:String(targetFarmer.plots||"1"),
        plotArea:String(targetFarmer.plotArea||"0"),
        crop:String(targetFarmer.crop||"Paddy"),
        season:String(targetFarmer.season||"Kharif"),
        cropArea:String(targetFarmer.cropArea||"0"),
        livestock:String(targetFarmer.livestock||""),
        allied:String(targetFarmer.allied||""),
        agroforestry:String(targetFarmer.agroforestry||""),
        ntfp:String(targetFarmer.ntfp||""),
        dairy:String(targetFarmer.dairy||""),
        bank:String(targetFarmer.bank||""),
        account:String(targetFarmer.account||""),
        ifsc:String(targetFarmer.ifsc||""),
        consent:"yes"
      });
    }
  },[editFarmerId]);

  const fill=()=>{setF({...f,name:"Kamala Majhi",gender:"Female",category:"ST",mobile:"9876543218",aadhaar:"491762803517",village:"Rugudi",block:"Harichandanpur",panchayat:"Rugudi",address:"Rugudi village, Harichandanpur block",pin:"758031",land:"2.4",landUnit:"acre",plots:"3",plotArea:"1.2",crop:"Paddy, Maize, Ragi",season:"Kharif",cropArea:"1.8",livestock:"2 goats, 1 indigenous cow",allied:"Backyard poultry, leaf-plate making",agroforestry:"Mango (4), neem (6), bamboo (12 clumps)",ntfp:"Sal leaves and mahua flowers",dairy:"1 cow · approximately 4 litres/day",bank:"Odisha Gramya Bank",account:"XXXXXX1234",ifsc:"IOBA0OGB001",consent:"yes"});setToast("Sample Kamala Majhi survey filled. Verify all details before submission.");};

  useEffect(()=>{
    if(isEdit)return;
    if(!f.name.trim()||!["Register farmer","Farmers","My farmers"].includes(screen))return;
    const timer=setTimeout(()=>{
      setState(st=>{
        const drafts=records(st,"farmerDrafts"),id=drafts.find(x=>x.name===f.name)?.id||`DF-${f.mobile||f.name.replaceAll(" ","-")}`,row={id,...f,status:"Draft",updated:stamp()};
        return withRows(st,"farmerDrafts",[row,...drafts.filter(x=>x.id!==id)]);
      });
    },800);
    return()=>clearTimeout(timer);
  },[f,screen,isEdit]);

  const submit=()=>{
    if(isSubmitting)return;
    const landAcres=Number(f.land)*(f.landUnit==="hectare"?2.47105:f.landUnit==="guntha"?.025:1);
    if(!f.name.trim()||!/^\d{10}$/.test(f.mobile)||!/^\d{12}$/.test(f.aadhaar)||!f.address.trim()||!f.land||Number(f.plotArea)>landAcres||Number(f.cropArea)>landAcres){
      setToast("Complete name, 10-digit mobile, 12-digit Aadhaar, address and valid plot/crop area.");
      return;
    }
    if(farmers.some(x=>String(x.mobile||"").replace(/\D/g,"")===f.mobile.replace(/\D/g,"")||String(x.aadhaar||"").replace(/\D/g,"")===f.aadhaar.replace(/\D/g,""))){
      setToast("Mobile or Aadhaar already exists in the farmer register.");
      return;
    }
    setIsSubmitting(true);
    const id=serial(farmers,"F-",3);
    const row:RecordRow={
      id,
      farmerId:id,
      ...f,
      land:`${f.land} ${f.landUnit}`,
      landArea:landAcres,
      landUnit:f.landUnit,
      cropArea:Number(f.cropArea),
      fpcId:"FPC-ODI-001",
      status:"Submitted",
      completeness:100,
      created:stamp()
    };
    setState(st=>({
      ...withRows(st,"farmerApplications",[row,...records(st,"farmerApplications")]),
      audit:audit(st,role,"submitted farmer registration","Farmers",id,null,row),
      notifications:[notice(`Farmer application ${id} submitted`),...(st.notifications||[])],
      syncQueue:role==="Field Staff"?[{id:`SYNC-${Date.now()}`,type:"Farmer registration",record:`${row.name} · ${id}`,status:st.offline?"Pending sync":"Synced",payload:row},...(st.syncQueue||[])]:st.syncQueue
    }));
    setState(st=>withRows(st,"farmerDrafts",records(st,"farmerDrafts").filter(x=>x.name!==f.name)));
    setIsSubmitting(false);
    setToast(state.offline&&role==="Field Staff"?`${id} saved offline and queued for sync`:`${id} submitted for Admin approval`);
    setSuccessFarmer({id,name:row.name as string});
  };

  const saveEdit=()=>{
    if(!targetFarmer||isSubmitting)return;
    const landAcres=Number(f.land)*(f.landUnit==="hectare"?2.47105:f.landUnit==="guntha"?.025:1);
    if(!f.name.trim()||!/^\d{10}$/.test(f.mobile)||!/^\d{12}$/.test(f.aadhaar)||!f.address.trim()||!f.land||Number(f.plotArea)>landAcres||Number(f.cropArea)>landAcres){
      setToast("Complete name, 10-digit mobile, 12-digit Aadhaar, address and valid plot/crop area.");
      return;
    }
    const otherFarmers=[...farmers,...applications].filter(x=>x.id!==targetFarmer.id);
    if(otherFarmers.some(x=>String(x.mobile||"").replace(/\D/g,"")===f.mobile.replace(/\D/g,"")||String(x.aadhaar||"").replace(/\D/g,"")===f.aadhaar.replace(/\D/g,""))){
      setToast("Mobile or Aadhaar already belongs to another farmer.");
      return;
    }
    setIsSubmitting(true);
    const updatedRow:RecordRow={
      ...targetFarmer,
      ...f,
      id:targetFarmer.id,
      farmerId:targetFarmer.farmerId||targetFarmer.id,
      land:`${f.land} ${f.landUnit}`,
      landArea:landAcres,
      landUnit:f.landUnit,
      cropArea:Number(f.cropArea),
      updated:stamp()
    };
    setState(st=>{
      const inApps=records(st,"farmerApplications").some(x=>x.id===targetFarmer.id);
      const key=inApps?"farmerApplications":"farmers";
      const oldRows=records(st,key);
      const newRows=oldRows.map(x=>x.id===targetFarmer.id?updatedRow:x);
      return {
        ...withRows(st,key,newRows),
        audit:audit(st,role,"updated farmer profile","Farmers",targetFarmer.id,targetFarmer,updatedRow),
        notifications:[notice(`Farmer ${targetFarmer.id} (${updatedRow.name}) updated`),...(st.notifications||[])]
      };
    });
    setIsSubmitting(false);
    setToast(`Farmer ${targetFarmer.id} updated successfully.`);
    go(`/farmers/${targetFarmer.id}`);
  };

  const approve=(r:RecordRow)=>{const farmer={...r,status:"Active",approved:stamp()};setState(st=>({...withRows(st,"farmers",[farmer,...records(st,"farmers")]),...withRows(st,"farmerApplications",records(st,"farmerApplications").filter(x=>x.id!==r.id)),walletBalances:{...st.walletBalances,[r.id]:0},audit:audit(st,role,"approved farmer registration","Farmers",r.id,r.status,"Active"),notifications:[notice(`${r.name} farmer account activated · wallet Rs 0`),...(st.notifications||[])]}));setToast(`${r.name} activated with a zero wallet balance.`);};
  const decline=(r:RecordRow)=>{const reason=prompt(`Reason for rejecting ${r.name}:`);if(!reason?.trim()){setToast("A rejection reason is required.");return}const rejected={...r,status:"Rejected",rejectionReason:reason};setState(st=>({...withRows(st,"farmerApplications",records(st,"farmerApplications").map(x=>x.id===r.id?rejected:x)),audit:audit(st,role,"rejected farmer application","Farmers",r.id,r.status,rejected),notifications:[notice(`${r.name} application rejected: ${reason}`),...(st.notifications||[])]}));setToast("Application rejected with reason recorded.");};
  const searchable=farmers.filter(x=>searchText(x).includes(q.toLowerCase()));

  if(["Baseline","Baseline survey","Commodity Baseline report"].includes(screen))return <Baseline {...{state,setState,role,screen,setToast}}/>;

  if(screen==="Register farmer")return <section className="em">
    <Header
      kicker={isEdit?"Field operations · update profile":"Field operations · registration"}
      title={isEdit?`Edit Farmer · ${targetFarmer?.id||editFarmerId}`:"Register farmer"}
      description={isEdit?"Update farmer baseline, landholding and KYC details. Farmer ID is permanently preserved.":"Complete the household baseline and KYC profile. Field Staff may save locally and sync later."}
      actions={
        isEdit?(
          <Button testid="farmer-cancel-edit-head" onClick={()=>go(`/farmers/${targetFarmer?.id||editFarmerId}`)}>
            <ChevronLeft size={14}/> Back to Details
          </Button>
        ):(
          role==="Field Staff"&&<span className={`em-status ${state.offline?"pending":""}`}>{state.offline?"Offline · queued":"Online · local demo"}</span>
        )
      }
    />
    <div className="em-stepbar">{["Profile & contact","Address & plots","Crops & livelihood","Bank & KYC","Review"].map((n,i)=><button key={n} className={`em-step ${step===i?"active":""}`} data-testid={`farmer-step-${i+1}`} onClick={()=>setStep(i)}>{i+1} · {n}</button>)}</div>
    <div className="em-panel pad">
      <div className="em-panel-head">
        <div>
          <h3>{["Profile & contact","Address & plots","Crops & livelihood","Bank & KYC","Review"][step]}</h3>
          <p>{isEdit?`Editing record ${targetFarmer?.id||""}`:`Draft auto-saves on this device · ${Math.min(100,Math.round(Object.values(f).filter(Boolean).length/21*100))}% form completeness`}</p>
        </div>
        {!isEdit&&<Button testid="farmer-sample" onClick={fill}>Fill sample · Kamala Majhi</Button>}
      </div>
      <div className="em-completeness"><i style={{width:`${Math.min(100,Object.values(f).filter(Boolean).length/21*100)}%`}}/></div>
      {step===0&&<div className="em-grid cols3" style={{marginTop:14}}>
        {isEdit&&<div className="em-field"><label>Farmer ID (Read-only)</label><div className="em-readonly" style={{fontFamily:"monospace",fontWeight:600}}>{targetFarmer?.id}</div></div>}
        <Field label="Farmer name" value={f.name} onChange={v=>patch("name",v)} testid="farmer-name" required/>
        <Field label="Gender" value={f.gender} onChange={v=>patch("gender",v)} options={["Female","Male","Other"]} testid="farmer-gender"/>
        <Field label="Category" value={f.category} onChange={v=>patch("category",v)} options={["ST","SC","OBC","General","Other"]} testid="farmer-category"/>
        <Field label="Mobile (10 digits)" value={f.mobile} onChange={v=>patch("mobile",v)} testid="farmer-mobile" required/>
        <Field label="Aadhaar (12 digits)" value={f.aadhaar} onChange={v=>patch("aadhaar",v)} testid="farmer-aadhaar" required/>
        <Field label="Date of birth" value={f.dob||""} onChange={v=>patch("dob",v)} type="date" testid="farmer-dob"/>
      </div>}
      {step===1&&<div className="em-grid cols3" style={{marginTop:14}}>
        <Field label="State" value="Odisha" onChange={()=>{}} options={["Odisha"]} testid="farmer-state"/>
        <Field label="District" value="Keonjhar" onChange={()=>{}} options={["Keonjhar"]} testid="farmer-district"/>
        <Field label="Block" value={f.block} onChange={v=>{const p=panchayatOptions(v)[0];patch("block",v);patch("panchayat",p);patch("village",villageOptions(p)[0]);}} options={geography.Block} testid="farmer-block"/>
        <Field label="Panchayat" value={f.panchayat} onChange={v=>{patch("panchayat",v);patch("village",villageOptions(v)[0]);}} options={panchayatOptions(f.block)} testid="farmer-panchayat"/>
        <Field label="Village" value={f.village} onChange={v=>patch("village",v)} options={villageOptions(f.panchayat)} testid="farmer-village"/>
        <Field label="PIN code" value={f.pin} onChange={v=>patch("pin",v)} testid="farmer-pin"/>
        <Field label="Full address" value={f.address} onChange={v=>patch("address",v)} testid="farmer-address" required/>
        <Field label="Number of plots" value={f.plots} onChange={v=>patch("plots",v)} type="number" testid="farmer-plot-count"/>
        <Field label="Total land holding" value={f.land} onChange={v=>patch("land",v)} type="number" testid="farmer-land"/>
        <Field label="Land unit" value={f.landUnit} onChange={v=>patch("landUnit",v)} options={["acre","hectare","guntha"]} testid="farmer-land-unit"/>
        <Field label="Largest plot area (acre)" value={f.plotArea} onChange={v=>patch("plotArea",v)} type="number" testid="farmer-plot-area"/>
        <div className="em-stat"><small>Total area in acres</small><b>{(Number(f.land||0)*(f.landUnit==="hectare"?2.47105:f.landUnit==="guntha"?.025:1)).toFixed(2)}</b><span>Converted for reporting</span></div>
      </div>}
      {step===2&&<div className="em-grid cols3" style={{marginTop:14}}>
        <Field label="Main crops" value={f.crop} onChange={v=>patch("crop",v)} testid="farmer-crops"/>
        <Field label="Season" value={f.season} onChange={v=>patch("season",v)} options={["Kharif","Rabi","Zaid","Perennial"]} testid="farmer-season"/>
        <Field label="Crop area (acres)" value={f.cropArea} onChange={v=>patch("cropArea",v)} type="number" testid="farmer-crop-area"/>
        <Field label="Livestock" value={f.livestock} onChange={v=>patch("livestock",v)} testid="farmer-livestock"/>
        <Field label="Allied activities" value={f.allied} onChange={v=>patch("allied",v)} testid="farmer-allied"/>
        <Field label="Agroforestry" value={f.agroforestry} onChange={v=>patch("agroforestry",v)} testid="farmer-agroforestry"/>
        <Field label="NTFP" value={f.ntfp} onChange={v=>patch("ntfp",v)} testid="farmer-ntfp"/>
        <Field label="Dairy" value={f.dairy} onChange={v=>patch("dairy",v)} testid="farmer-dairy"/>
        <div className="em-note">Crop area may not exceed total land holding. Values describe a demo survey and should be confirmed in the field.</div>
      </div>}
      {step===3&&<div className="em-grid cols3" style={{marginTop:14}}>
        <Field label="Bank" value={f.bank} onChange={v=>patch("bank",v)} testid="farmer-bank"/>
        <Field label="Account number" value={f.account} onChange={v=>patch("account",v)} testid="farmer-account"/>
        <Field label="IFSC" value={f.ifsc} onChange={v=>patch("ifsc",v)} testid="farmer-ifsc"/>
        <label className="em-wide em-inline"><input type="checkbox" checked={f.consent==="yes"} onChange={e=>patch("consent",e.target.checked?"yes":"no")} data-testid="farmer-declaration"/> I confirm the farmer reviewed this information and consented to its use by the cooperative.</label>
      </div>}
      {step===4&&<div className="em-grid cols3" style={{marginTop:14}}>
        {[["Farmer",f.name],["Contact",f.mobile],["Aadhaar",mask(f.aadhaar)],["Address",`${f.village}, ${f.block}`],["Land",`${f.land} ${f.landUnit}`],["Crop area",`${f.cropArea} acres · ${f.crop}`],["Livelihood",`${f.livestock}; ${f.allied}`],["Bank",f.bank],["Completeness","Ready for staff review"]].map(([k,v])=><div className="em-field" key={k}><label>{k}</label><div className="em-readonly">{v||"—"}</div></div>)}
        <div className="em-note em-wide">{isEdit?"Saving updates will immediately update this farmer profile while keeping Farmer ID intact.":"Submission is a local demo action. Admin approval creates the active farmer and a zero opening wallet balance."}</div>
      </div>}
      <div className="em-formfoot">
        <div className="em-inline">
          {!isEdit&&(
            <>
              <Button testid="farmer-save-draft" onClick={()=>{setState(st=>withRows(st,"farmerDrafts",[{id:`DF-${Date.now()}`,...f,status:"Draft",updated:stamp()},...records(st,"farmerDrafts")]));setToast("Farmer draft saved locally.");}}>Save Draft</Button>
              <span style={{fontSize:9,color:"#819085"}}>{drafts.length} saved drafts</span>
            </>
          )}
          {isEdit&&(
            <Button testid="farmer-cancel-edit" onClick={()=>go(`/farmers/${targetFarmer?.id||editFarmerId}`)}>Cancel</Button>
          )}
        </div>
        <div className="em-inline">
          {step>0&&<Button testid="farmer-back" onClick={()=>setStep(step-1)}>Back</Button>}
          {step<4?(
            <Button kind="primary" testid="farmer-continue" onClick={()=>setStep(step+1)}>Continue <ChevronRight size={14}/></Button>
          ):(
            isEdit?(
              <Button kind="primary" testid="farmer-submit" onClick={saveEdit} disabled={isSubmitting}>
                <Check size={14}/> {isSubmitting?"Saving...":"Save Changes"}
              </Button>
            ):(
              <Button kind="primary" testid="farmer-submit" onClick={submit} disabled={isSubmitting}>
                <Check size={14}/> {isSubmitting?"Submitting...":"Submit"}
              </Button>
            )
          )}
        </div>
      </div>
    </div>

    {successFarmer&&(
      <div className="em-modalback" style={{display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100}}>
        <div className="em-modal" style={{maxWidth:480,textAlign:"center",padding:"28px 24px"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:56,height:56,borderRadius:"50%",backgroundColor:"#ecfdf5",color:"#059669",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <Check size={28} strokeWidth={2.5}/>
          </div>
          <h3 style={{fontSize:20,fontWeight:700,color:"#111827",margin:"0 0 8px"}}>Farmer Registered Successfully!</h3>
          <p style={{fontSize:13,color:"#6b7280",margin:"0 0 20px"}}>The farmer registration has been completed successfully.</p>
          <div style={{backgroundColor:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:8,padding:"14px 16px",textAlign:"left",marginBottom:24,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#6b7280"}}>Farmer ID</span>
              <span className="em-mono" style={{fontWeight:600,color:"#111827"}}>{successFarmer.id}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#6b7280"}}>Farmer Name</span>
              <span style={{fontWeight:600,color:"#111827"}}>{successFarmer.name}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#6b7280"}}>Registration Status</span>
              <span className="em-status pending">Submitted for Approval</span>
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="em-btn primary" data-testid="success-modal-view-farmer" onClick={()=>{const fid=successFarmer.id;setSuccessFarmer(null);go(`/farmers/${fid}`);}}>View Farmer</button>
            <button className="em-btn" data-testid="success-modal-register-another" onClick={()=>{setSuccessFarmer(null);setF({...initialForm});setStep(0);}}>Register Another Farmer</button>
            <button className="em-btn" data-testid="success-modal-close" onClick={()=>{setSuccessFarmer(null);}}>Close</button>
          </div>
        </div>
      </div>
    )}
  </section>;

  return <section className="em">
    <Header kicker="Farmer registry · local demo" title={screen==="My farmers"?"My farmers":"Farmers"} description="Search farmer profiles, review incoming applications and manage registration records." actions={screen!=="My farmers"&&<Button kind="primary" testid="farmer-register-link" onClick={()=>go("Register farmer")}><Plus size={14}/> Register farmer</Button>}/>
    <div className="em-stats"><Stat label="Active farmers" value={farmers.length.toLocaleString()} detail="Current register"/><Stat label="Pending applications" value={applications.filter(x=>x.status==="Submitted").length.toString()} detail="Awaiting Admin review"/><Stat label="Draft registrations" value={drafts.length.toString()} detail="Saved on this browser"/><Stat label="Offline queue" value={(state.syncQueue||[]).filter(x=>x.status==="Pending sync").length.toString()} detail="Pending local sync"/></div>
    <div className="em-panel"><div className="em-toolbar"><div className="em-search"><Search size={14}/><input data-testid="farmer-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name, mobile, Aadhaar or farmer ID"/></div><Button testid="farmer-mock-export" onClick={()=>setToast("Mock farmer export prepared; no spreadsheet file was generated.")}><ArrowDownToLine size={13}/> Mock export</Button></div>
    <Table headers={["Farmer ID","Name","Village / block","Mobile","Aadhaar","Land","Crop","Status","Wallet","Actions"]}>
      {[...searchable,...(pending?applications:[])].filter(x=>searchText(x).includes(q.toLowerCase())).map(r=><tr key={`${r.id}-${r.status}`} onClick={()=>go(`/farmers/${r.id}`)} style={{cursor:"pointer"}}>
        <td className="em-mono">{r.id}</td>
        <td><strong>{r.name}</strong><small style={{display:"block",color:"#849087",marginTop:3}}>{r.category||"—"} · {r.gender||"—"}</small></td>
        <td>{r.village||"—"} / {r.block||"—"}</td>
        <td>{r.mobile}</td>
        <td>{mask(r.aadhaar)}</td>
        <td>{r.land||"—"}</td>
        <td>{r.crop||"—"}</td>
        <td><Status value={r.status||"Active"}/></td>
        <td>{r.status==="Active"?money(Number(state.walletBalances[r.id]||0)):"—"}</td>
        <td>{r.status==="Submitted"&&pending?(
          <div className="em-actions-cell" onClick={e=>e.stopPropagation()}>
            <button className="em-smallbtn" data-testid={`farmer-approve-${r.id}`} onClick={()=>approve(r)}>Approve</button>
            <button className="em-smallbtn" data-testid={`farmer-reject-${r.id}`} onClick={()=>decline(r)}>Reject</button>
          </div>
        ):(
          <button className="em-smallbtn" data-testid={`farmer-view-${r.id}`} onClick={(e)=>{e.stopPropagation();go(`/farmers/${r.id}`);}}>View</button>
        )}</td>
      </tr>)}
    </Table>
    {!searchable.length&&!applications.length&&<Empty>No farmer records match this view.</Empty>}
    </div>
  </section>;
}

function Baseline({state,setState,role,screen,setToast}:Omit<Props,"go">){const [q,setQ]=useState(""),[f,setF]=useState({farmer:"",village:"Green Valley",season:"Kharif 2026",crop:"Paddy",area:"1.2",expected:"2.8",livestock:""});const rows=records(state,"baseline");const farmerList=records(state,"farmers");const save=()=>{if(!f.farmer||Number(f.area)<=0||Number(f.expected)<0){setToast("Select farmer and enter valid area and production.");return}const id=`BL-${Date.now()}`,r={id,...f,area:Number(f.area),production:Number(f.expected),status:"Submitted",date:today(),fpcId:"FPC-ODI-001"};setState(s=>({...withRows(s,"baseline",[r,...records(s,"baseline")]),audit:audit(s,role,"submitted commodity baseline","Baseline",id,null,r),notifications:[notice(`Baseline survey ${id} submitted`),...(s.notifications||[])]}));setToast("Baseline survey saved.");};
 const filtered=rows.filter(r=>searchText(r).includes(q.toLowerCase()));if(screen==="Commodity Baseline report")return <section className="em"><Header kicker="Planning data · derived from local surveys" title="Commodity Baseline report" description="Aggregated crop area and estimated production in persisted demo records." actions={<Button testid="baseline-report-export" onClick={()=>setToast("Mock baseline export prepared.")}><ArrowDownToLine size={14}/> Mock export</Button>}/><div className="em-panel"><Table headers={["Village","Season","Commodity","Survey area","Estimated production"]}>{filtered.map(r=><tr key={r.id}><td>{r.village}</td><td>{r.season}</td><td>{r.crop}</td><td>{r.area} acres</td><td>{r.production} qtl</td></tr>)}</Table></div></section>;
 return <section className="em"><Header kicker="Field baseline · Keonjhar" title={screen==="Baseline"?"Baseline":"Baseline survey"} description="Capture crop area and household production estimates. This browser demo does not replace a verified field survey."/><div className="em-grid cols2"><div className="em-panel pad"><div className="em-panel-head"><div><h3>New survey entry</h3><p>Save a dated survey to the browser store.</p></div></div><div className="em-grid cols2"><Field label="Farmer" value={f.farmer} onChange={v=>setF({...f,farmer:v})} options={["",...farmerList.map(x=>`${x.id} · ${x.name}`)]} testid="baseline-farmer"/><Field label="Village" value={f.village} onChange={v=>setF({...f,village:v})} options={villageOptions("Sanapatna")} testid="baseline-village"/><Field label="Season" value={f.season} onChange={v=>setF({...f,season:v})} options={["Kharif 2026","Rabi 2026–27","Zaid 2027"]} testid="baseline-season"/><Field label="Commodity" value={f.crop} onChange={v=>setF({...f,crop:v})} options={["Paddy","Maize","Ragi","Arhar","Vegetables"]} testid="baseline-crop"/><Field label="Area (acre)" value={f.area} onChange={v=>setF({...f,area:v})} type="number" testid="baseline-area"/><Field label="Estimated production (qtl)" value={f.expected} onChange={v=>setF({...f,expected:v})} type="number" testid="baseline-production"/><Field label="Livestock notes" value={f.livestock} onChange={v=>setF({...f,livestock:v})} testid="baseline-livestock"/></div><div style={{marginTop:12}}><Button kind="primary" testid="baseline-save" onClick={save}>Save survey</Button></div></div><div className="em-panel"><div className="em-toolbar"><div className="em-search"><Search size={14}/><input data-testid="baseline-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter village, crop, season"/></div></div><Table headers={["Village","Season","Crop","Area","Production"]}>{filtered.map(r=><tr key={r.id}><td>{r.village}</td><td>{r.season}</td><td>{r.crop}</td><td>{r.area} acres</td><td>{r.production} qtl</td></tr>)}</Table></div></div></section>;
}

const flowSpec:Record<string,{flow:string;direction:string;stock:string;color:string;party:string;partyOptions:string[];voucher:string}>={
 "Produce Purchase":{flow:"A · Farmer → FPC",direction:"IN",stock:"Produce stock increases only after approval.",color:"green",party:"Farmer",partyOptions:[],voucher:"PUR-2026-"},
 "Input Sale":{flow:"B · FPC Store → Farmer",direction:"OUT",stock:"Input stock decreases immediately; member wallet is debited.",color:"blue",party:"Farmer",partyOptions:[],voucher:"SAL-IN-2026-"},
 "Produce Sale":{flow:"C · FPC → Buyer",direction:"OUT",stock:"Produce stock decreases only after approval.",color:"green",party:"Buyer",partyOptions:[],voucher:"SAL-2026-"},
 "Input Purchase":{flow:"D · Supplier → FPC",direction:"IN",stock:"Input stock increases only after approval.",color:"blue",party:"Supplier",partyOptions:["Kisan Agro Supply","Odisha Farm Inputs","Local supplier"],voucher:"PUR-IN-2026-"}
};
function BusinessModule({state,setState,role,screen,setToast,go}:Props){
  if(screen==="Farmer Settlement"||screen==="Bank statement matching"||screen==="Advances & Dues"||screen==="Dues")return <Settlement {...{state,setState,role,screen,setToast,go}}/>;
  const kind=flowSpec[screen]?screen:"Produce Purchase";
  const spec=flowSpec[kind];
  const [q,setQ]=useState("");
  const [form,setForm]=useState({
    party:"",
    buyerId:"",
    supplierId:"",
    commodity:"Paddy (common)",
    quantity:"1",
    unit:"kg",
    rate:"25",
    date:new Date().toISOString().slice(0,10),
    godown:"Main Godown Keonjhar",
    farmerId:"F-001",
    storeId:"STR-01",
    storeName:"Main FPC Store & Agro Centre (Keonjhar)",
    paymentMethod:"Farmer Wallet",
    walletMode:"Wallet"
  });
  const [lines,setLines]=useState<RecordRow[]>([]);
  const [walletSplit,setWalletSplit]=useState(false);
  const [receiptToShow,setReceiptToShow]=useState<RecordRow|null>(null);
  const [isSubmitting,setIsSubmitting]=useState(false);

  useEffect(()=>{
    setQ("");
    setLines([]);
    setWalletSplit(false);
    setReceiptToShow(null);
    const defaultList=kind==="Input Sale"||kind==="Input Purchase"?(state.inputCatalog||[]):records(state,"commodities");
    const firstItem=defaultList[0];
    const buyersList=records(state,"buyers");
    const suppliersList=records(state,"suppliers");
    const farmersList=records(state,"farmers");

    let initialParty="";
    let initialBuyerId="";
    let initialSupplierId="";
    let initialFarmerId=form.farmerId||"F-001";
    let initialStoreId="STR-01";
    let initialStoreName=fpcStores[0]?.name||"Main FPC Store & Agro Centre (Keonjhar)";

    if(kind==="Produce Sale"){
      const firstBuyer=buyersList[0];
      initialParty=firstBuyer?.name||"";
      initialBuyerId=firstBuyer?.id||"";
    }else if(kind==="Input Purchase"){
      const firstSupplier=suppliersList[0];
      initialParty=firstSupplier?.name||"";
      initialSupplierId=firstSupplier?.id||"";
    }else{
      const firstFarmer=farmersList.find(f=>f.id===initialFarmerId)||farmersList[0];
      initialParty=firstFarmer?.name||"";
      initialFarmerId=firstFarmer?.id||"F-001";
    }

    const defaultRate=kind==="Produce Sale"?String(firstItem?.saleRate||30):String(firstItem?.purchaseRate||firstItem?.rate||firstItem?.saleRate||25);

    setForm(p=>({
      ...p,
      party:initialParty,
      buyerId:initialBuyerId,
      supplierId:initialSupplierId,
      farmerId:initialFarmerId,
      storeId:initialStoreId,
      storeName:initialStoreName,
      paymentMethod:"Farmer Wallet",
      commodity:firstItem?.name||(kind.includes("Input")?"Paddy seed MTU-1010":"Paddy (common)"),
      rate:defaultRate,
      unit:firstItem?.baseUnit||firstItem?.unit||"kg",
      quantity:kind==="Input Sale"?"1":"100"
    }));
  },[kind]);

  const transactions=records(state,"businessTransactions"),isReview=role==="FPC Admin / Manager"||role==="Accountant / Finance Officer";
  const current=flowSpec[kind]||spec||flowSpec["Produce Purchase"];
  const commodities=records(state,"commodities"),inputItems=state.inputCatalog||[];
  const list=kind==="Input Sale"||kind==="Input Purchase"?inputItems:commodities;
  const selected=list.find(x=>x.name===form.commodity)||list[0];

  const buyers=records(state,"buyers");
  const suppliers=records(state,"suppliers");
  const farmers=records(state,"farmers");

  const selectedBuyer=kind==="Produce Sale"?(buyers.find(b=>b.id===form.buyerId||b.name===form.party)||buyers[0]):null;
  const selectedSupplier=kind==="Input Purchase"?(suppliers.find(s=>s.id===form.supplierId||s.name===form.party)||suppliers[0]):null;

  const farmerId=form.farmerId||state.memberId||"F-001";
  const farmer=farmers.find(x=>x.id===farmerId);
  const lineAmount=(Number(form.quantity)||0)*(Number(form.rate)||0);
  const unit=selected?.baseUnit||selected?.unit||form.unit;
  const set=(key:string,value:string)=>setForm(p=>({...p,[key]:value}));
  const voucherRows=[...transactions,...records(state,"purchases"),...records(state,"sales"),{id:"SAL-2026-0031"},{id:"PUR-IN-2026-0009"}];

  // Live Wallet & Cart Calculations
  const currentFarmerWallet = Number(state.walletBalances?.[farmerId] ?? 0);
  const isInputSale = kind === "Input Sale";
  const isWallet = isInputSale && (form.paymentMethod === "Farmer Wallet" || form.paymentMethod === "Wallet");

  const activeItems: RecordRow[] = lines.length > 0 ? lines : [{
    id: `LINE-${Date.now()}-0`,
    commodity: form.commodity,
    category: (selected as any)?.category || "Inputs",
    quantity: Number(form.quantity) || 1,
    unit: form.unit,
    baseQuantity: Number(form.quantity) || 1,
    baseUnit: unit,
    rate: Number(form.rate) || 0,
    amount: lineAmount
  }];

  const currentTotal = lines.length > 0
    ? lines.reduce((a, x) => a + Number(x.amount || 0), 0)
    : lineAmount;

  const hasShortfall = isWallet && currentTotal > currentFarmerWallet;
  const shortfall = Math.max(0, currentTotal - currentFarmerWallet);
  const projectedClosing = Math.max(0, currentFarmerWallet - currentTotal);

  const makeRow=(status:string)=>{
    if(!form.commodity||!Number(form.quantity)||Number(form.quantity)<=0||!Number(form.rate)||Number(form.rate)<=0){
      setToast("Choose an item and enter positive quantity and rate.");
      return null;
    }
    if(kind==="Produce Sale"&&!selectedBuyer&&!form.party){
      setToast("Please select a registered buyer from Buyer Master.");
      return null;
    }
    let kg=Number(form.quantity);
    try{
      if(unit==="kg"&&form.unit!=="kg")kg=convert(Number(form.quantity),form.unit,"kg");
      else if(form.unit!==unit)kg=convert(Number(form.quantity),form.unit,unit);
    }catch{
      setToast(`Cannot convert ${form.unit} to ${unit}. Select a compatible unit.`);
      return null;
    }

    const id=serial(voucherRows,current.voucher);
    const receiptNumber=id.startsWith("SAL-IN-")?id.replace("SAL-IN-","SAL-IN-RCP-"):id.startsWith("SAL-")?id.replace("SAL-","SAL-RCP-"):id.startsWith("PUR-")?id.replace("PUR-","PUR-RCP-"):`${id}-RCP`;

    let party="";
    if(kind==="Produce Sale"){
      party=selectedBuyer?.name||form.party||"Registered Buyer";
    }else if(kind==="Input Purchase"){
      party=selectedSupplier?.name||form.party||"Registered Supplier";
    }else{
      party=form.party||farmer?.name||"Farmer";
    }

    const newLine: RecordRow = {
      id: `LINE-${Date.now()}-${lines.length + 1}`,
      commodity: form.commodity,
      category: (selected as any)?.category || "Farm Inputs",
      quantity: Number(form.quantity),
      unit: form.unit,
      baseQuantity: kg,
      baseUnit: unit,
      rate: Number(form.rate),
      amount: lineAmount
    };
    const items=[...lines,newLine];

    return {
      id,
      voucher:id,
      receiptNumber,
      flow:kind,
      flowLabel:current.flow,
      party,
      partyType:current.party,
      farmerId:(kind==="Input Sale"||kind==="Produce Purchase")?farmerId:"",
      buyerId:kind==="Produce Sale"?(selectedBuyer?.id||form.buyerId||""):"",
      buyerGstin:kind==="Produce Sale"?(selectedBuyer?.gstin||""):"",
      buyerContact:kind==="Produce Sale"?(selectedBuyer?.contact||""):"",
      buyerMobile:kind==="Produce Sale"?(selectedBuyer?.mobile||""):"",
      buyerAddress:kind==="Produce Sale"?(selectedBuyer?.address||selectedBuyer?.location||""):"",
      buyerType:kind==="Produce Sale"?(selectedBuyer?.type||""):"",
      paymentTerms:kind==="Produce Sale"?(selectedBuyer?.paymentTerms||15):undefined,
      creditLimit:kind==="Produce Sale"?(selectedBuyer?.creditLimit||0):undefined,
      supplierId:kind==="Input Purchase"?(selectedSupplier?.id||form.supplierId||""):"",
      storeId:form.storeId,
      storeName:form.storeName,
      paymentMethod:form.paymentMethod,
      commodity:form.commodity,
      quantity:Number(form.quantity),
      unit:form.unit,
      baseQuantity:kg,
      baseUnit:unit,
      rate:Number(form.rate),
      amount:items.reduce((a,x)=>a+Number(x.amount||0),0),
      date:form.date,
      godown:form.godown,
      status,
      createdBy:role,
      created:stamp(),
      items,
      fpcId:"FPC-ODI-001"
    } as RecordRow;
  };

  const save=(status:"Draft"|"Submitted")=>{
    if(isSubmitting)return;
    setIsSubmitting(true);

    if(isInputSale&&status==="Submitted"){
      if(currentTotal<=0){
        setToast("Please add items to cart and enter positive quantities and rates.");
        setIsSubmitting(false);
        return;
      }
      if(isWallet&&hasShortfall&&!walletSplit){
        setToast(`Wallet shortfall: Available ${money(currentFarmerWallet)}, Total ${money(currentTotal)}. Choose Split Payment or change payment method.`);
        setIsSubmitting(false);
        return;
      }

      const id=serial(voucherRows,current.voucher);
      const receiptNumber=id.replace("SAL-IN-","SAL-IN-RCP-");
      const debitAmount=isWallet?Math.min(currentFarmerWallet,currentTotal):0;
      const closingBalance=isWallet?currentFarmerWallet-debitAmount:currentFarmerWallet;
      const dueAmount=isWallet&&walletSplit?shortfall:(form.paymentMethod==="Farmer Credit / Due"?currentTotal:0);

      const itemsToRecord=activeItems;

      let walletTxn: RecordRow | null = null;
      if(debitAmount>0){
        walletTxn={
          id:`TXN-${Date.now()}`,
          farmerId:form.farmerId,
          owner:farmer?.name||"Farmer",
          date:stamp(),
          type:"Store purchase",
          description:`FPC Store (${form.storeName||form.godown}) · ${itemsToRecord.map(x=>x.commodity).join(", ")}`,
          amount:debitAmount,
          direction:"Debit",
          walletEffect:-debitAmount,
          walletBalanceAfter:closingBalance,
          status:"Paid",
          reference:id,
          linkedDocument:id,
          fpcId:"FPC-ODI-001"
        };
      }

      const row: RecordRow={
        id,
        voucher:id,
        receiptNumber,
        flow:"Input Sale",
        flowLabel:current.flow,
        flowName:"Input Sale",
        party:farmer?.name||"Farmer",
        partyType:"Farmer",
        farmerId:form.farmerId,
        storeId:form.storeId,
        storeName:form.storeName,
        godown:form.godown,
        commodity:itemsToRecord.map(x=>x.commodity).join(", "),
        quantity:itemsToRecord.reduce((sum,x)=>sum+Number(x.quantity||0),0),
        unit:itemsToRecord[0]?.unit||"unit",
        rate:itemsToRecord[0]?.rate||0,
        amount:currentTotal,
        date:form.date,
        status:"Approved",
        createdBy:role,
        approvedBy:role,
        approvedAt:stamp(),
        created:stamp(),
        paymentMethod:form.paymentMethod,
        openingWalletBalance:currentFarmerWallet,
        walletDebit:debitAmount,
        closingWalletBalance:closingBalance,
        dueAmount,
        walletTxnId:walletTxn?walletTxn.id:undefined,
        receiptGeneratedAt:stamp(),
        items:itemsToRecord,
        fpcId:"FPC-ODI-001"
      };

      const nextCatalog=(state.inputCatalog||[]).map(stock=>{
        const matched=itemsToRecord.find(c=>c.commodity===stock.name);
        return matched?{...stock,stock:Math.max(0,Number(stock.stock||0)-Number(matched.quantity||0))}:stock;
      });

      const invEvents=itemsToRecord.map((c,i)=>({
        id:`MOV-${Date.now()}-${i}`,
        reference:id,
        item:c.commodity,
        itemType:"Inputs",
        direction:"OUT",
        quantity:c.quantity,
        unit:c.unit,
        date:form.date,
        status:"Posted",
        eventType:"Input Sale",
        party:farmer?.name,
        fpcId:"FPC-ODI-001"
      }));

      setState(s=>({
        ...s,
        inputCatalog:nextCatalog,
        walletBalances:isWallet?{...s.walletBalances,[form.farmerId]:closingBalance}:s.walletBalances,
        walletTransactions:walletTxn?[walletTxn,...(s.walletTransactions||[])]:s.walletTransactions,
        records:{
          ...s.records,
          businessTransactions:[row,...records(s,"businessTransactions")],
          inventoryEvents:[...invEvents,...records(s,"inventoryEvents")],
          ...(dueAmount>0?{
            farmerDues:[{
              id:`DUE-${Date.now()}`,
              farmerId:form.farmerId,
              farmer:farmer?.name,
              source:id,
              amount:dueAmount,
              status:"Open",
              date:form.date,
              fpcId:"FPC-ODI-001"
            },...records(s,"farmerDues")]
          }:{}),
          ledger:[{
            id:`LED-${Date.now()}`,
            farmer:farmer?.name,
            farmerId:form.farmerId,
            date:form.date,
            description:`Store Purchase · ${id} · ${form.storeName}`,
            debit:currentTotal,
            credit:0,
            balance:closingBalance
          },...records(s,"ledger")]
        },
        audit:audit(s,role,"recorded store purchase & debited member wallet","Input Sale",id,currentFarmerWallet,closingBalance),
        notifications:[notice(`Store purchase ${id} completed · ${money(debitAmount)} debited from ${farmer?.name}'s wallet`),...(s.notifications||[])]
      }));

      setReceiptToShow(row);
      setLines([]);
      setWalletSplit(false);
      setToast(`Store purchase ${id} completed. ${money(debitAmount)} debited from ${farmer?.name}'s wallet. New balance: ${money(closingBalance)}.`);
      setTimeout(()=>setIsSubmitting(false),300);
      return;
    }

    const row=makeRow(status);
    if(!row){setIsSubmitting(false);return;}
    setState(s=>({
      ...withRows(s,"businessTransactions",[row,...records(s,"businessTransactions")]),
      audit:audit(s,role,status==="Draft"?"saved business transaction draft":"submitted business transaction",kind,row.id,null,row),
      notifications:[notice(`${row.id} ${status.toLowerCase()} · ${kind}`),...(s.notifications||[])]
    }));
    setLines([]);
    setToast(`${row.id} ${status.toLowerCase()} and saved locally.`);
    if(status==="Submitted"){setReceiptToShow(row);}
    setTimeout(()=>setIsSubmitting(false),300);
  };

  const addLine=()=>{
    if(!form.commodity||!Number(form.quantity)||Number(form.quantity)<=0||!Number(form.rate)||Number(form.rate)<=0){
      setToast("Choose an item and enter positive quantity and rate.");
      return;
    }
    const newLine: RecordRow = {
      id: `LINE-${Date.now()}-${lines.length + 1}`,
      commodity: form.commodity,
      category: (selected as any)?.category || "Farm Inputs",
      quantity: Number(form.quantity),
      unit: form.unit,
      baseQuantity: Number(form.quantity),
      baseUnit: unit,
      rate: Number(form.rate),
      amount: lineAmount
    };
    setLines(prev => [...prev, newLine]);
    setToast(`Added ${form.commodity} (${form.quantity} ${form.unit}) to cart.`);
  };

  const approve=(row:RecordRow)=>{
    if(row.status!=="Submitted"){setToast("Only submitted transactions can be approved.");return;}
    if(row.flow==="Input Sale"){
      const balance=Number(state.walletBalances[row.farmerId]||0);
      if(row.amount>balance){
        const why=`Wallet shortfall ${money(row.amount-balance)}; available ${money(balance)}.`;
        setState(s=>({
          ...withRows(s,"businessTransactions",records(s,"businessTransactions").map(x=>x.id===row.id?{...x,status:"Rejected",rejectionReason:why}:x)),
          audit:audit(s,role,"blocked input sale for wallet shortfall","Input Sale",row.id,row.status,why),
          notifications:[notice(`${row.id} blocked: ${why}`),...(s.notifications||[])]
        }));
        setToast(why);
        return;
      }
    }
    if(row.flow==="Produce Sale"||row.flow==="Input Sale"){
      for(const item of (Array.isArray(row.items)?row.items:[row])){
        const stockRow=row.flow==="Produce Sale"?records(state,"commodities").find(x=>x.name===item.commodity):(state.inputCatalog||[]).find(x=>x.name===item.commodity);
        const hasEvents=records(state,"inventoryEvents").some(e=>e.item===item.commodity);
        const available=row.flow==="Input Sale"&&!hasEvents?(inventoryInputBase[item.commodity]?.qty??Number(stockRow?.stock||0)):Number(stockRow?.stock||0);
        const requested=Number(item.baseQuantity??item.quantity);
        if(requested>available){
          const why=`Insufficient free stock: ${available} ${item.baseUnit||item.unit||""} available; ${requested} requested for ${item.commodity}.`;
          setState(s=>({
            ...withRows(s,"businessTransactions",records(s,"businessTransactions").map(x=>x.id===row.id?{...x,status:"Rejected",rejectionReason:why}:x)),
            audit:audit(s,role,"blocked transaction for insufficient stock",row.flow,row.id,row.status,why),
            notifications:[notice(`${row.id} blocked: insufficient free stock`),...(s.notifications||[])]
          }));
          setToast(why);
          return;
        }
      }
    }

    const defaultRcp=row.id?.startsWith("SAL-IN-")?row.id.replace("SAL-IN-","SAL-IN-RCP-"):row.id?.startsWith("SAL-")?row.id.replace("SAL-","SAL-RCP-"):row.id?.startsWith("PUR-")?row.id.replace("PUR-","PUR-RCP-"):`RCP-${Date.now()}`;
    const receiptNumber=row.receiptNumber||defaultRcp;
    const updated={
      ...row,
      status:"Approved",
      approvedBy:role,
      approvedAt:stamp(),
      receiptNumber,
      receiptGeneratedAt:stamp(),
      paymentStatus:row.paymentStatus||(row.flow==="Produce Purchase"?"Pending Settlement":"Approved")
    };

    setState(st=>{
      let next={...st};
      const items=Array.isArray(row.items)?row.items:[row];
      if(row.flow==="Produce Purchase"||row.flow==="Produce Sale"){
        const sign=row.flow==="Produce Purchase"?1:-1;
        next=withRows(next,"commodities",records(next,"commodities").map(c=>{
          const delta=items.filter(x=>x.commodity===c.name).reduce((a,x)=>a+Number(x.baseQuantity??x.quantity)*sign,0);
          return delta?{...c,stock:Math.max(0,Number(c.stock||0)+delta)}:c;
        }));
        if(row.flow==="Produce Sale"){
          const saleRecord:RecordRow={
            id:row.id,
            voucher:row.id,
            buyer:row.party,
            buyerId:row.buyerId,
            commodity:row.commodity,
            quantity:Number(row.quantity),
            unit:row.unit,
            rate:Number(row.rate),
            amount:Number(row.amount),
            cost:Number(row.amount)*0.85,
            margin:Number(row.amount)*0.15,
            date:row.date,
            status:"Approved",
            receiptNumber,
            fpcId:"FPC-ODI-001"
          };
          next=withRows(next,"sales",[saleRecord,...records(next,"sales")]);
        }
      }else{
        const sign=row.flow==="Input Purchase"?1:-1;
        next={
          ...next,
          inputCatalog:(next.inputCatalog||[]).map(i=>{
            const delta=items.filter(x=>x.commodity===i.name).reduce((a,x)=>a+Number(x.baseQuantity??x.quantity)*sign,0);
            const initial=records(st,"inventoryEvents").some(e=>e.item===i.name)?Number(i.stock||0):(inventoryInputBase[i.name]?.qty??Number(i.stock||0));
            return delta?{...i,stock:initial+delta}:i;
          })
        };
      }
      if(row.flow==="Input Sale"){
        const amount=Number(row.amount),before=Number(st.walletBalances[row.farmerId]||0),after=before-amount,txn={
          id:`TXN-${Date.now()}`,
          farmerId:row.farmerId,
          owner:farmer?.name||"Farmer",
          date:stamp(),
          type:"Store purchase",
          description:`FPC Store (${row.storeName||row.godown}) · ${items.map(x=>x.commodity).join(", ")}`,
          amount,
          direction:"Debit",
          walletEffect:-amount,
          walletBalanceAfter:after,
          status:"Paid",
          reference:row.id,
          linkedDocument:row.id,
          fpcId:"FPC-ODI-001"
        };
        next={...next,walletBalances:{...st.walletBalances,[row.farmerId]:after},walletTransactions:[txn,...(st.walletTransactions||[])]};
      }
      const events=items.map((item,i)=>({
        id:`INV-${Date.now()}-${i}`,
        reference:row.id,
        item:item.commodity,
        itemType:row.flow.includes("Input")?"Inputs":"Produce",
        direction:current.direction,
        quantity:item.baseQuantity??item.quantity,
        unit:item.baseUnit??item.unit,
        date:row.date,
        status:"Posted",
        eventType:row.flow
      }));
      return {
        ...withRows(next,"businessTransactions",records(st,"businessTransactions").map(x=>x.id===row.id?updated:x)),
        ...withRows(next,"inventoryEvents",[...events,...records(next,"inventoryEvents")]),
        audit:audit(st,role,"approved transaction; matching stock flow posted",row.flow,row.id,row.status,"Approved"),
        notifications:[notice(`${row.id} approved · stock ${current.direction}`),...(st.notifications||[])]
      };
    });
    setToast(`${row.id} approved; matching inventory flow updated.`);
  };

  const rejectRow=(row:RecordRow)=>{
    const reason=prompt(`Reason for rejecting ${row.id}:`);
    if(!reason?.trim()){setToast("A rejection reason is required.");return;}
    const u={...row,status:"Rejected",rejectionReason:reason};
    setState(s=>({
      ...withRows(s,"businessTransactions",transactions.map(x=>x.id===row.id?u:x)),
      audit:audit(s,role,"rejected business transaction",row.flow,row.id,row.status,reason),
      notifications:[notice(`${row.id} rejected: ${reason}`),...(s.notifications||[])]
    }));
    setToast(`${row.id} rejected; no inventory changed.`);
  };

  if(!current)return null;
  const isFarmer=role==="Farmer";
  const activeFarmerId=form.farmerId||state.memberId||"F-001";
  const visible=transactions.filter(x=>{
    const matchKind=kind==="All"?true:x.flow===kind;
    const matchSearch=searchText(x).includes(q.toLowerCase());
    if(isFarmer&&(kind==="Produce Purchase"||kind==="All")){
      const matchesFarmer=x.farmerId===activeFarmerId||(x.party&&(x.party.includes(activeFarmerId)||x.party.includes(farmer?.name||"")));
      return matchKind&&matchSearch&&matchesFarmer;
    }
    return matchKind&&matchSearch;
  }).sort((a,b)=>String(b.created||b.date).localeCompare(String(a.created||a.date)));

  const updateCommodity=(value:string)=>{
    const item=list.find(x=>x.name===value);
    const itemRate=kind==="Produce Sale"?(item?.saleRate||item?.rate||30):(item?.rate||item?.purchaseRate||item?.saleRate||25);
    setForm(p=>({...p,commodity:value,rate:String(itemRate),unit:item?.baseUnit||item?.unit||"kg"}));
  };

  if(screen==="Farmer Settlement"||screen==="Bank statement matching"||screen==="Advances & Dues"||screen==="Dues")return <Settlement {...{state,setState,role,screen,setToast,go}}/>;

  return (
    <section className="em">
      <Header
        kicker={kind==="Input Sale"?"FPC Store Counter · Input & Equipment Sales":"Trading desk · independent flow"}
        title={kind==="Input Sale"?"Store Purchase · Input Sale":kind}
        description={kind==="Input Sale"?"Record member purchases of seeds, fertilizers, pesticides, and equipment. Debits member wallet and updates inventory instantly.":"Local-only operations demo. Drafts and approvals persist in browser storage; no accounting or banking integration is connected."}
      />
      <div className={`em-banner ${current.color==="blue"?"blue":""}`}>
        <div>
          <h3>{kind==="Input Sale"?"B · FPC Store → Farmer":current.flow} <span className="em-status">{current.direction} · {current.color==="blue"?"Inputs":"Produce"}</span></h3>
          <p>{kind==="Input Sale"?"Input stock decreases and farmer wallet is debited on submission. Full traceable ledger receipt generated.":`${current.stock} Stock posting occurs only after approval. Flow types remain isolated.`}</p>
        </div>
        <strong>{current.direction==="IN"?<ArrowDownToLine/>:<ArrowUpFromLine/>}</strong>
      </div>
      <div className="em-grid cols2">
        <div className="em-panel pad">
          <div className="em-panel-head">
            <div>
              <h3>{kind==="Input Sale"?"FPC Store Purchase Entry":`${kind} entry`}</h3>
              <p>{kind==="Input Sale"?"Select store, member, products and payment method · Multi-product cart supported.":"Voucher ID assigned on save · multiple line items supported."}</p>
            </div>
            <span className="em-mono">{kind==="Input Sale"?"Counter Sale · Instant Receipt":"Draft → Submitted → Approved"}</span>
          </div>
          <div className="em-grid cols2">
            {kind==="Input Sale"&&(
              <Field
                label="FPC Store Location"
                value={form.storeId}
                onChange={v=>{
                  const st=fpcStores.find(x=>x.id===v)||fpcStores[0];
                  setForm(p=>({...p,storeId:st.id,storeName:st.name,godown:st.name}));
                }}
                options={fpcStores.map(s=>({value:s.id,label:`${s.name} (${s.code})`}))}
                testid="business-store"
                required
              />
            )}
            {kind==="Produce Sale"?(
              <Field
                label="Buyer (Registered Business / Company)"
                value={form.buyerId||(selectedBuyer?.id||"")}
                onChange={v=>{
                  const b=buyers.find(x=>x.id===v||x.name===v);
                  if(b){
                    setForm(p=>({...p,buyerId:b.id,party:b.name}));
                  }else{
                    setForm(p=>({...p,buyerId:"",party:v}));
                  }
                }}
                options={
                  buyers.length>0
                    ?[
                        {value:"",label:"— Select Registered Buyer —"},
                        ...buyers.map(b=>({
                          value:b.id,
                          label:`${b.name} (${b.location||b.address||"Odisha"}) · GSTIN: ${b.gstin}`
                        }))
                      ]
                    :[{value:"",label:"No registered buyers found"}]
                }
                testid="business-party"
                required
              />
            ):kind==="Input Purchase"?(
              <Field
                label="Supplier (Registered Supplier)"
                value={form.supplierId||(selectedSupplier?.id||"")}
                onChange={v=>{
                  const s=suppliers.find(x=>x.id===v||x.name===v);
                  if(s){
                    setForm(p=>({...p,supplierId:s.id,party:s.name}));
                  }else{
                    setForm(p=>({...p,supplierId:"",party:v}));
                  }
                }}
                options={[
                  {value:"",label:"— Select Supplier —"},
                  ...suppliers.map(s=>({
                    value:s.id,
                    label:`${s.name} (${s.category||"Supplier"}) · GSTIN: ${s.gstin||"N/A"}`
                  }))
                ]}
                testid="business-party"
              />
            ):(
              <Field
                label={current.party}
                value={form.party}
                onChange={v=>{
                  const f=farmers.find(x=>x.name===v);
                  setForm(p=>({...p,party:v,farmerId:f?f.id:p.farmerId}));
                }}
                options={["",...farmers.slice(0,50).map(x=>x.name)]}
                testid="business-party"
              />
            )}
            {kind==="Input Sale"||kind==="Produce Purchase"?(
              <Field
                label="Farmer ID"
                value={form.farmerId}
                onChange={v=>{
                  const f=farmers.find(x=>x.id===v);
                  setForm(p=>({...p,farmerId:v,party:f?f.name:p.party}));
                }}
                options={farmers.slice(0,50).map(x=>x.id)}
                testid="business-farmer-id"
              />
            ):null}
            <Field
              label={kind.includes("Input")?"Product / Commodity":"Produce"}
              value={form.commodity}
              onChange={updateCommodity}
              options={list.map(x=>x.name)}
              testid="business-item"
            />
            <Field
              label="Quantity"
              value={form.quantity}
              onChange={v=>set("quantity",v)}
              type="number"
              testid="business-quantity"
            />
            <Field
              label="Unit of measure"
              value={form.unit}
              onChange={v=>set("unit",v)}
              options={["kg","quintal","tonne","bag","litre","nos","unit","pack","kit"]}
              testid="business-unit"
            />
            <Field
              label="Rate per unit (Rs)"
              value={form.rate}
              onChange={v=>set("rate",v)}
              type="number"
              testid="business-rate"
            />
            <Field
              label="Transaction date"
              value={form.date}
              onChange={v=>set("date",v)}
              type="date"
              testid="business-date"
            />
            {kind!=="Input Sale"&&(
              <Field
                label="Godown"
                value={form.godown}
                onChange={v=>set("godown",v)}
                options={records(state,"godowns").map(x=>x.name)}
                testid="business-godown"
              />
            )}
            {kind==="Input Sale"&&(
              <Field
                label="Payment Method"
                value={form.paymentMethod}
                onChange={v=>{
                  set("paymentMethod",v);
                  setWalletSplit(false);
                }}
                options={["Farmer Wallet","Cash","UPI / Digital","Bank Transfer","Farmer Credit / Due"]}
                testid="business-payment-method"
                required
              />
            )}
          </div>

          {/* DEDICATED FARMER WALLET CARD FOR INPUT SALE */}
          {kind==="Input Sale"&&(
            <div
              data-testid="input-sale-wallet-card"
              style={{
                background:isWallet&&hasShortfall?"#fef2f2":"#f0fdf4",
                border:isWallet&&hasShortfall?"1.5px solid #fca5a5":"1.5px solid #86efac",
                borderRadius:8,
                padding:"10px 14px",
                marginTop:12,
                fontSize:12,
                lineHeight:1.5
              }}
            >
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6,fontWeight:700,color:isWallet&&hasShortfall?"#991b1b":"#166534"}}>
                  <Wallet size={15}/>
                  <span>Farmer Wallet: {farmer?.name||"Ravi Kumar"} ({farmerId})</span>
                </div>
                <span
                  style={{
                    background:isWallet&&hasShortfall?"#fee2e2":"#dcfce7",
                    color:isWallet&&hasShortfall?"#b91c1c":"#15803d",
                    padding:"2px 8px",
                    borderRadius:4,
                    fontWeight:700,
                    fontSize:11
                  }}
                  data-testid="available-wallet-badge"
                >
                  Available Balance: {money(currentFarmerWallet)}
                </span>
              </div>
              {isWallet?(
                hasShortfall?(
                  <div style={{color:"#991b1b",marginTop:4}}>
                    <div>⚠️ <strong>Insufficient Wallet Balance!</strong> Total purchase is <strong>{money(currentTotal)}</strong>, but only <strong>{money(currentFarmerWallet)}</strong> is available in {farmer?.name}'s wallet (Shortfall: {money(shortfall)}). A wallet cannot be debited below ₹0.</div>
                    <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button
                        type="button"
                        className="em-smallbtn"
                        style={{background:"#991b1b",color:"#fff",fontWeight:700,padding:"4px 10px",borderRadius:4}}
                        onClick={()=>setWalletSplit(true)}
                        data-testid="split-payment-btn"
                      >
                        {walletSplit?"✓ Split Active: ":"Split Payment: "}Pay {money(currentFarmerWallet)} from Wallet + {money(shortfall)} as Due
                      </button>
                      <button
                        type="button"
                        className="em-smallbtn"
                        style={{background:"#f1f5f9",color:"#334155",padding:"4px 10px",borderRadius:4}}
                        onClick={()=>set("paymentMethod","Cash")}
                      >
                        Switch to Cash Payment
                      </button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",color:"#166534",marginTop:4,paddingTop:4,borderTop:"1px dashed #bbf7d0"}}>
                    <span>Opening: <strong>{money(currentFarmerWallet)}</strong></span>
                    <span>Wallet Debit: <strong style={{color:"#dc2626"}}>−{money(currentTotal)}</strong></span>
                    <span>Closing Balance: <strong style={{color:"#15803d",fontSize:13}}>{money(projectedClosing)}</strong></span>
                  </div>
                )
              ):(
                <div style={{color:"#475569"}}>
                  Selected payment method: <strong>{form.paymentMethod}</strong>. Member wallet will not be debited for this purchase.
                </div>
              )}
            </div>
          )}

          {kind==="Produce Sale"&&(
            selectedBuyer?(
              <div
                data-testid="buyer-summary-card"
                style={{
                  background:"#f8faf9",
                  border:"1px solid #d4e2d8",
                  borderRadius:8,
                  padding:"12px 14px",
                  marginTop:12,
                  fontSize:12,
                  lineHeight:1.5
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,borderBottom:"1px solid #e1ebe4",paddingBottom:6}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:13,color:"#1c3829"}}>{selectedBuyer.name}</span>
                    <span className="em-mono" style={{marginLeft:8,background:"#e5efe8",color:"#286442",padding:"1px 6px",borderRadius:4,fontSize:11,fontWeight:600}}>
                      {selectedBuyer.id}
                    </span>
                  </div>
                  <span className="em-status" style={{fontSize:10,padding:"2px 6px"}}>{selectedBuyer.type||"Registered Buyer"}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"6px 12px"}}>
                  <div><span style={{color:"#617468"}}>GSTIN:</span> <strong className="em-mono" style={{color:"#1c3829"}}>{selectedBuyer.gstin||"—"}</strong></div>
                  <div><span style={{color:"#617468"}}>Contact Person:</span> <strong style={{color:"#1c3829"}}>{selectedBuyer.contact||"—"}</strong></div>
                  <div><span style={{color:"#617468"}}>Mobile:</span> <strong style={{color:"#1c3829"}}>{selectedBuyer.mobile||"—"}</strong></div>
                  <div><span style={{color:"#617468"}}>Address / Location:</span> <strong style={{color:"#1c3829"}}>{selectedBuyer.address||selectedBuyer.location||"—"}</strong></div>
                  <div><span style={{color:"#617468"}}>Payment Terms:</span> <strong style={{color:"#1c3829"}}>{selectedBuyer.paymentTerms?`${selectedBuyer.paymentTerms} Days`:"Net 15"}</strong></div>
                  <div><span style={{color:"#617468"}}>Credit Limit:</span> <strong style={{color:"#1c3829"}}>{selectedBuyer.creditLimit?money(Number(selectedBuyer.creditLimit)):"₹0"}</strong></div>
                  <div><span style={{color:"#617468"}}>Outstanding Balance:</span> <strong style={{color:Number(selectedBuyer.openBalance||0)>0?"#b45309":"#1e40af"}}>{money(Number(selectedBuyer.openBalance||0))}</strong></div>
                  <div><span style={{color:"#617468"}}>Status:</span> <strong style={{color:selectedBuyer.status==="Active"?"#15803d":"#64748b"}}>{selectedBuyer.status||"Active"}</strong></div>
                </div>
              </div>
            ):buyers.length===0?(
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 12px",color:"#991b1b",fontSize:12,marginTop:12}}>
                ⚠️ <strong>No registered buyers found in Buyer Master.</strong> Please register buyers before submitting a produce sale.
              </div>
            ):null
          )}

          <div className="em-inline" style={{justifyContent:"space-between",marginTop:12}}>
            <span>Line item: <strong>{form.commodity}</strong> · {form.quantity} {form.unit} × {money(Number(form.rate))} = <strong>{money(lineAmount)}</strong></span>
            <Button testid="business-add-line" onClick={addLine}><Plus size={13}/> Add to cart</Button>
          </div>

          {lines.length>0&&(
            <div style={{marginTop:10,background:"#f8faf9",border:"1px solid #d9e6dc",borderRadius:6,padding:"8px 12px"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#286442",textTransform:"uppercase",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
                <span>Multi-Product Cart ({lines.length} items)</span>
                <span>Cart Total: {money(lines.reduce((sum,it)=>sum+Number(it.amount||0),0))}</span>
              </div>
              {lines.map((l,i)=>(
                <div key={`${l.commodity}-${i}`} className="em-inline" style={{justifyContent:"space-between",padding:"6px 0",borderBottom:i===lines.length-1?"none":"1px solid #edf1eb",fontSize:12}}>
                  <span><strong>{l.commodity}</strong> · {l.quantity} {l.unit} × {money(Number(l.rate))}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <strong>{money(l.amount)}</strong>
                    <button className="em-smallbtn" style={{color:"#dc2626"}} onClick={()=>setLines(lines.filter((_,j)=>j!==i))}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="em-formfoot" style={{marginTop:14}}>
            <span>Grand Total: <strong style={{fontSize:14,color:"#15803d"}}>{money(currentTotal)}</strong> ({activeItems.length} {activeItems.length===1?"item":"items"})</span>
            <div className="em-inline">
              <Button testid="business-save-draft" onClick={()=>save("Draft")}>Save draft</Button>
              <Button kind="primary" testid="business-submit" onClick={()=>save("Submitted")} disabled={isSubmitting}>
                {kind==="Input Sale"?"Submit": "Submit"}
              </Button>
            </div>
          </div>
        </div>

        <div className="em-panel pad">
          <div className="em-panel-head">
            <div>
              <h3>Flow control</h3>
              <p>{kind==="Input Sale"?"Counter sales debit farmer wallet and decrease input stock upon completion.":"Approval by Admin or Accountant posts exactly one matching inventory type."}</p>
            </div>
          </div>
          <div className="em-stats" style={{gridTemplateColumns:"repeat(2,minmax(0,1fr))"}}>
            <Stat label="Flow" value={kind.startsWith("Produce")?"Produce":"Inputs"} detail={current.flow}/>
            <Stat label="Inventory direction" value={current.direction} detail={current.stock}/>
          </div>
          <div className="em-note" style={{marginTop:12}}>
            {kind==="Produce Sale"
              ? "Produce Sale decreases inventory only after approval. The registered buyer and commercial terms will be recorded on the official Produce Sale Invoice & Receipt."
              : kind==="Input Sale"
              ? "Store Purchase debits member wallet immediately upon submission if sufficient balance exists. A detailed Store Purchase Receipt with opening and closing wallet balances is generated."
              : "Stock posting occurs only after approval. Flow types remain isolated."}
          </div>
          <p style={{fontSize:9,color:"#77867a",lineHeight:1.6}}>
            Seed trace references available in this demo include PUR-2026-0001, SAL-2026-0031, PUR-IN-2026-0009 and INV-2026-0118. These are example operational references, not bank or ledger evidence.
          </p>
        </div>
      </div>

      <div className="em-panel">
        <div className="em-toolbar">
          <div className="em-panel-head" style={{margin:0}}>
            <div>
              <h3>Transaction register</h3>
              <p>{visible.length} entries · {kind}</p>
            </div>
          </div>
          <div className="em-search">
            <Search size={14}/>
            <input data-testid="business-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search voucher, party, commodity"/>
          </div>
        </div>
        <Table headers={["Voucher","Flow","Party","Item","Quantity","Amount","Date","Status","Actions"]}>
          {visible.map(r=><tr key={r.id}>
            <td className="em-mono">{r.id}</td>
            <td>{r.flow}</td>
            <td>
              <strong>{r.party}</strong>
              {r.buyerId&&<span className="em-mono" style={{display:"block",fontSize:11,color:"#607267"}}>{r.buyerId}</span>}
              {r.farmerId&&<span className="em-mono" style={{display:"block",fontSize:11,color:"#607267"}}>{r.farmerId}</span>}
              {r.supplierId&&<span className="em-mono" style={{display:"block",fontSize:11,color:"#607267"}}>{r.supplierId}</span>}
            </td>
            <td>{r.commodity}</td>
            <td>{r.quantity} {r.unit}</td>
            <td>{money(Number(r.amount))}</td>
            <td>{r.date}</td>
            <td>
              <Status value={r.status}/>
              {r.rejectionReason&&<small style={{display:"block",color:"#ac4e42"}}>{r.rejectionReason}</small>}
            </td>
            <td>
              {r.status==="Submitted"?(
                <div className="em-actions-cell" style={{display:"flex",gap:5,alignItems:"center"}}>
                  {isReview&&<>
                    <button className="em-smallbtn" data-testid={`business-approve-${r.id}`} onClick={()=>approve(r)}>Approve</button>
                    <button className="em-smallbtn" data-testid={`business-reject-${r.id}`} onClick={()=>rejectRow(r)}>Reject</button>
                  </>}
                  <button
                    className="em-smallbtn"
                    style={{display:"inline-flex",alignItems:"center",gap:3,background:"#fff8ed",color:"#966b1f",borderRadius:4,padding:"3px 7px",fontWeight:700}}
                    data-testid={`business-receipt-${r.id}`}
                    title="View Submission Receipt"
                    onClick={()=>setReceiptToShow(r)}
                  >
                    <FileText size={11}/> Receipt
                  </button>
                </div>
              ):r.status==="Approved"?(
                <div className="em-actions-cell" style={{display:"flex",gap:5}}>
                  <button
                    className="em-smallbtn"
                    style={{display:"inline-flex",alignItems:"center",gap:3,background:"#edf5ee",color:"#286442",borderRadius:4,padding:"3px 7px",fontWeight:700}}
                    data-testid={`business-receipt-${r.id}`}
                    title={`View ${r.flow} Receipt`}
                    onClick={()=>setReceiptToShow(r)}
                  >
                    <FileText size={11}/> Receipt
                  </button>
                  <button
                    className="em-smallbtn"
                    style={{display:"inline-flex",alignItems:"center",gap:3,background:"#f5f7f5",color:"#36513f",borderRadius:4,padding:"3px 7px"}}
                    data-testid={`business-print-${r.id}`}
                    title={`Print ${r.flow} Receipt`}
                    onClick={()=>{setReceiptToShow(r);setTimeout(()=>window.print(),200);}}
                  >
                    <Printer size={11}/> Print
                  </button>
                </div>
              ):"—"}
            </td>
          </tr>)}
        </Table>
        {!visible.length&&<Empty>No {kind} transactions yet.</Empty>}
      </div>

      {receiptToShow&&(
        (receiptToShow.flow==="Input Sale"||receiptToShow.flowName==="Input Sale"||receiptToShow.id?.startsWith("SAL-IN-")||receiptToShow.id?.startsWith("INV-"))?(
          <InputSaleReceipt
            receipt={receiptToShow}
            farmer={records(state,"farmers").find(f=>f.id===receiptToShow.farmerId||(receiptToShow.party&&f.name&&receiptToShow.party.includes(f.name)))}
            onClose={()=>setReceiptToShow(null)}
          />
        ):(receiptToShow.flow==="Produce Sale"||receiptToShow.flowName==="Produce Sale"||receiptToShow.id?.startsWith("SAL-"))?(
          <ProduceSaleReceipt
            receipt={receiptToShow}
            buyer={records(state,"buyers").find(b=>b.id===receiptToShow.buyerId||b.name===receiptToShow.party)}
            onClose={()=>setReceiptToShow(null)}
          />
        ):(
          <ProducePurchaseReceipt
            receipt={receiptToShow}
            farmer={records(state,"farmers").find(f=>f.id===receiptToShow.farmerId||(receiptToShow.party&&f.name&&receiptToShow.party.includes(f.name)))}
            onClose={()=>setReceiptToShow(null)}
          />
        )
      )}
    </section>
  );
}

function Settlement({state,setState,role,screen,setToast,go}:Props){
  const [q,setQ]=useState("");
  const payments=records(state,"payments");
  const farmers=records(state,"farmers");
  const candidates=farmers.filter(f=>searchText(f).includes(q.toLowerCase()));

  const totalUnsettledDues = records(state,"purchases")
    .filter(x=>x.status!=="Paid")
    .reduce((a,x)=>a+Number(x.amount||0),0);

  const openOverview = (fId: string) => {
    if (go) {
      go(`/agri-business/farmer-settlement/${fId}`);
    } else {
      setToast(`Opening financial overview for ${fId}`);
    }
  };

  return (
    <section className="em" data-testid="farmer-settlement-screen">
      <Header
        kicker="Finance operations · accounts & settlements"
        title={screen==="Farmer Settlement"?"Farmer Settlement":"Bank statement matching"}
        description="Review outstanding farmer dues, advance recovery balances, and settlement histories. Click any farmer to view their complete financial overview."
        actions={
          <Button testid="settlement-export" onClick={()=>setToast("Settlement report exported as spreadsheet summary.")}>
            <ArrowDownToLine size={14}/> Mock export
          </Button>
        }
      />
      <div className="em-stats">
        <Stat
          label="Unsettled purchase dues"
          value={money(totalUnsettledDues)}
          detail="Derived from procurement records"
        />
        <Stat
          label="Recorded payments"
          value={payments.length.toString()}
          detail="Existing local payment rows"
        />
        <Stat
          label="Bank match preview"
          value="Not connected"
          detail="Manual demo matching only"
        />
        <Stat
          label="Unmatched rows"
          value="0"
          detail="No statement imported"
        />
      </div>
      <div className="em-panel">
        <div className="em-toolbar">
          <div className="em-search">
            <Search size={14}/>
            <input
              data-testid="settlement-search"
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Search farmer, ID or mobile"
            />
          </div>
          <Button testid="bank-preview" onClick={()=>setToast("Statement matching preview ready. This demo has no connected bank statement.")}>
            Preview matching
          </Button>
        </div>
        <Table headers={["Farmer","Farmer ID","Mobile","Outstanding due","Advance balance","Statement match","Action"]}>
          {candidates.slice(0,50).map(f=>{
            const seedPurchases = records(state,"purchases").filter(p=>p.farmerId===f.id);
            const appTxns = records(state,"businessTransactions").filter(b=>(b.flow==="Produce Purchase"||b.flowName==="Produce Purchase")&&b.farmerId===f.id&&!seedPurchases.some(p=>p.id===b.id));
            const farmerPurchases = [...seedPurchases, ...appTxns];
            const paidIds = new Set(payments.filter(p=>p.farmerId===f.id&&p.status==="Paid").map(p=>p.purchaseId));
            const due = farmerPurchases.filter(p=>p.status!=="Paid"&&!paidIds.has(p.id)&&p.status!=="Rejected").reduce((a,p)=>a+Number(p.amount||0),0);

            const advance = records(state,"advances")
              .filter(item=>item.farmerId===f.id&&Number(item.balance||0)>0)
              .reduce((sum,item)=>sum+Number(item.balance||0),0);

            return (
              <tr key={f.id}>
                <td>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "#1b5e20",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      textDecoration: "underline",
                      textUnderlineOffset: 3
                    }}
                    data-testid={`settlement-farmer-name-${f.id}`}
                    onClick={()=>openOverview(f.id)}
                    title={`View Financial Overview for ${f.name}`}
                  >
                    <strong>{f.name}</strong>
                  </button>
                </td>
                <td className="em-mono">{f.id}</td>
                <td>{f.mobile}</td>
                <td style={{fontWeight: 700, color: due > 0 ? "#b45309" : "#166534"}}>{money(due)}</td>
                <td>{money(advance)}</td>
                <td><span className="em-status pending">Not imported</span></td>
                <td>
                  <button
                    className="em-smallbtn"
                    style={{
                      background: "#edf5ee",
                      color: "#286442",
                      fontWeight: 600,
                      borderRadius: 4,
                      padding: "3px 8px"
                    }}
                    data-testid={`settlement-detail-${f.id}`}
                    onClick={()=>openOverview(f.id)}
                    title={`View financial overview for ${f.name}`}
                  >
                    View dues
                  </button>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
    </section>
  );
}

const inventoryInputBase:Record<string,{qty:number;unit:string}>={"DAP fertiliser":{qty:120,unit:"bag"},"Urea":{qty:200,unit:"bag"},"Paddy seed MTU-1010":{qty:300,unit:"kg"},"Maize hybrid seed":{qty:300,unit:"kg"},"Neem pesticide":{qty:40,unit:"litre"},"Vermicompost":{qty:60,unit:"bag"}};
function InventoryModule({state,setState,role,screen,setToast}:Omit<Props,"go">){const [tab,setTab]=useState("All summary"),[q,setQ]=useState("");const commodities=records(state,"commodities"),catalog=state.inputCatalog||[],events=records(state,"inventoryEvents"),adjustments=records(state,"adjustments"),transfers=records(state,"transfers"),isAdmin=role==="FPC Admin / Manager"||role==="Accountant / Finance Officer"||role==="Inventory / Stock Manager";
 const goods=[...commodities.map(c=>({id:c.id,name:c.name,type:"Produce",qty:Number(c.stock)||0,unit:c.baseUnit||"kg",rate:Number(c.saleRate||c.purchaseRate||0),threshold:Number(c.threshold||0)})),...catalog.map(i=>{const base=inventoryInputBase[i.name];const tracked=events.some(e=>e.item===i.name);return {id:i.id,name:i.name,type:"Inputs",qty:tracked?Number(i.stock)||0:base?.qty??(Number(i.stock)||0),unit:base?.unit||i.unit||"unit",rate:Number(i.rate||0),threshold:Number(i.lowStock||0)}})];
 const visible=goods.filter(x=>(tab==="All summary"||x.type===tab)&&`${x.name} ${x.type} ${x.id}`.toLowerCase().includes(q.toLowerCase()));const totalProduce=goods.filter(x=>x.type==="Produce").reduce((a,x)=>a+x.qty,0),totalInputs=goods.filter(x=>x.type==="Inputs").reduce((a,x)=>a+x.qty,0);
 const createAdjustment=()=>{const names=goods.map(x=>x.name),item=prompt(`Item to adjust:\n${names.join(", ")}`,names[0]);if(!item)return;const row=goods.find(x=>x.name.toLowerCase()===item.toLowerCase());if(!row){setToast("Choose an item in the inventory list.");return}const delta=Number(prompt(`Adjustment quantity in ${row.unit}. Use a negative number to reduce stock:`,"5"));if(!Number.isFinite(delta)||delta===0){setToast("Enter a non-zero adjustment quantity.");return}if(row.qty+delta<0){setToast("Adjustment blocked: free stock cannot become negative.");return}const r={id:`ADJ-${Date.now()}`,item:row.name,itemId:row.id,type:row.type,quantity:delta,unit:row.unit,reason:"Stock count correction",status:"Submitted",date:today(),createdBy:role};setState(s=>({...withRows(s,"adjustments",[r,...records(s,"adjustments")]),audit:audit(s,role,"submitted inventory adjustment","Inventory",r.id,null,r),notifications:[notice(`Inventory adjustment ${r.id} awaits approval`),...(s.notifications||[])]}));setToast(`${r.id} submitted for approval.`);};
 const adjustmentAction=(r:RecordRow,approveIt:boolean)=>{if(!approveIt){const reason=prompt("Reason for rejecting adjustment:");if(!reason?.trim()){setToast("Rejection reason required.");return}const updated={...r,status:"Rejected",rejectionReason:reason};setState(s=>({...withRows(s,"adjustments",records(s,"adjustments").map(x=>x.id===r.id?updated:x)),audit:audit(s,role,"rejected inventory adjustment","Inventory",r.id,r.status,reason),notifications:[notice(`${r.id} rejected`),...(s.notifications||[])]}));setToast("Adjustment rejected; stock unchanged.");return}const g=goods.find(x=>x.name===r.item);if(!g||g.qty+Number(r.quantity)<0){setToast("Approval blocked: insufficient free stock.");return}const updated={...r,status:"Approved",approvedBy:role,approvedAt:stamp()};setState(s=>{let next=s;if(r.type==="Produce")next=withRows(next,"commodities",records(next,"commodities").map(c=>c.name===r.item?{...c,stock:g.qty+Number(r.quantity)}:c));else next={...next,inputCatalog:(next.inputCatalog||[]).map(i=>i.name===r.item?{...i,stock:g.qty+Number(r.quantity)}:i)};const ev={id:`INV-${Date.now()}`,reference:r.id,item:r.item,itemType:r.type,direction:Number(r.quantity)>0?"IN":"OUT",quantity:Math.abs(Number(r.quantity)),unit:r.unit,date:today(),status:"Posted",eventType:"Adjustment"};return {...withRows(next,"adjustments",records(next,"adjustments").map(x=>x.id===r.id?updated:x)),...withRows(next,"inventoryEvents",[ev,...records(next,"inventoryEvents")]),audit:audit(s,role,"approved inventory adjustment","Inventory",r.id,r.status,"Approved"),notifications:[notice(`${r.id} approved · inventory updated`),...(s.notifications||[])]};});setToast(`${r.id} approved; stock quantity updated.`);};
 const createTransfer=()=>{const names=goods.map(x=>x.name),itemName=prompt(`Transfer item:\n${names.join(", ")}`,names[0]);if(!itemName)return;const item=goods.find(x=>x.name.toLowerCase()===itemName.toLowerCase());if(!item){setToast("Choose an item in inventory.");return}const qty=Number(prompt(`Quantity to transfer (${item.unit}); free stock ${item.qty}:`,"10"));if(!Number.isFinite(qty)||qty<=0||qty>item.qty){setToast("Transfer must be positive and cannot exceed free stock.");return}const row={id:`TRF-${Date.now()}`,item:item.name,itemType:item.type,quantity:qty,unit:item.unit,from:"Main Godown Keonjhar",to:"Satellite Godown Pitamahal",status:"Submitted",date:today()};setState(s=>({...withRows(s,"transfers",[row,...records(s,"transfers")]),audit:audit(s,role,"submitted stock transfer","Inventory",row.id,null,row),notifications:[notice(`Transfer ${row.id} awaits approval`),...(s.notifications||[])]}));setToast("Transfer request submitted; total stock is not changed.");};
 const transferAction=(r:RecordRow)=>{const updated={...r,status:"Approved",approvedAt:stamp()};const ev={id:`INV-${Date.now()}`,reference:r.id,item:r.item,itemType:r.itemType,direction:"TRANSFER",quantity:r.quantity,unit:r.unit,from:r.from,to:r.to,date:today(),status:"Posted",eventType:"Transfer"};setState(s=>({...withRows(s,"transfers",records(s,"transfers").map(x=>x.id===r.id?updated:x)),...withRows(s,"inventoryEvents",[ev,...records(s,"inventoryEvents")]),audit:audit(s,role,"approved stock transfer","Inventory",r.id,r.status,"Approved"),notifications:[notice(`${r.id} transfer approved`),...(s.notifications||[])]}));setToast("Transfer marked approved; total stock remains unchanged.");};
  const movementRows=[...events,...[{id:"SEED-PUR-0001",reference:"PUR-2026-0001",item:"Paddy (common)",itemType:"Produce",direction:"IN",quantity:1000,unit:"kg",date:"12 Oct 2026",status:"Posted",eventType:"Farmer purchase"},{id:"SEED-SAL-0031",reference:"SAL-2026-0031",item:"Paddy (common)",itemType:"Produce",direction:"OUT",quantity:1000,unit:"kg",date:"20 Oct 2026",status:"Posted",eventType:"Buyer sale"},{id:"SEED-PURI-0009",reference:"PUR-IN-2026-0009",item:"DAP fertiliser",itemType:"Inputs",direction:"IN",quantity:20,unit:"bag",date:"16 Oct 2026",status:"Posted",eventType:"Supplier purchase"},{id:"SEED-INV-0118",reference:"INV-2026-0118",item:"Urea",itemType:"Inputs",direction:"OUT",quantity:4,unit:"bag",date:"18 Oct 2026",status:"Posted",eventType:"Input issue"} as RecordRow]];
 const tabs=["All summary","Produce","Inputs"];return <section className="em"><Header kicker="Storekeeping · separate commodity classes" title={screen==="Stock dashboard"?"Stock dashboard":screen==="Movements"?"Stock movements":screen==="Adjustments"?"Stock adjustments":"Inventory"} description="Stock quantities remain separated by flow and item type. A transfer changes godown location, not the total. All changes are persisted in the browser demo." actions={<><Button testid="inventory-transfer" onClick={createTransfer}>Transfer stock</Button><Button kind="primary" testid="inventory-adjust" onClick={createAdjustment}><Plus size={14}/> New adjustment</Button></>}/><div className="em-stats"><Stat label="Produce on hand" value={`${totalProduce.toLocaleString()} kg`} detail="Paddy seed data includes 48,500 kg common paddy"/><Stat label="Input stock" value={totalInputs.toLocaleString()} detail="Inputs are counted in their own UoM"/><Stat label="Pending adjustments" value={adjustments.filter(x=>x.status==="Submitted").length.toString()} detail="Approval required"/><Stat label="Expiring batch alert" value="DAP · 2 batches" detail="Demo alert · verify batch register"/></div><div className="em-banner blue"><div><h3>TSF network view · read only</h3><p>Green Valley FPC · Keonjhar · shared network monitoring does not permit cross-FPC stock edits.</p></div><span className="em-status">Read only</span></div><div className="em-pillrow">{tabs.map(t=><button key={t} className={`em-pill ${tab===t?"active":""}`} data-testid={`inventory-tab-${t.toLowerCase().replaceAll(" ","-")}`} onClick={()=>setTab(t)}>{t}</button>)}</div>
 {tab==="All summary"&&<div className="em-grid cols2"><div className="em-panel pad"><div className="em-panel-head"><div><h3>Produce summary</h3><p>Quantities displayed independently from input catalog.</p></div><span className="em-status">Produce</span></div>{goods.filter(x=>x.type==="Produce").slice(0,5).map(g=><div key={g.id} className="em-inline" style={{justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #edf1eb"}}><span>{g.name}</span><strong>{g.qty.toLocaleString()} {g.unit}</strong></div>)}</div><div className="em-panel pad"><div className="em-panel-head"><div><h3>Inputs summary</h3><p>Seed baselines for key farm inputs.</p></div><span className="em-status blue">Inputs</span></div>{goods.filter(x=>x.type==="Inputs").map(g=><div key={g.id} className="em-inline" style={{justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #edf1eb"}}><span>{g.name}</span><strong>{g.qty.toLocaleString()} {g.unit}</strong></div>)}</div></div>}
 <div className="em-panel"><div className="em-toolbar"><div className="em-search"><Search size={14}/><input data-testid="inventory-search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search stock item or SKU"/></div><Button testid="inventory-print" onClick={()=>window.print()}><Printer size={13}/> Print register</Button><Button testid="inventory-export" onClick={()=>setToast("Mock inventory export prepared; no Excel file was created.")}><ArrowDownToLine size={13}/> Mock export</Button></div><Table headers={["SKU","Item","Class","On hand","UoM","Valuation","Free stock","Threshold","Status"]}>{visible.map(g=><tr key={`${g.type}-${g.id}`}><td className="em-mono">{g.id}</td><td><strong>{g.name}</strong></td><td><span className={`em-status ${g.type==="Inputs"?"blue":""}`}>{g.type}</span></td><td>{g.qty.toLocaleString()}</td><td>{g.unit}</td><td>{money(g.qty*g.rate)}</td><td>{g.qty.toLocaleString()}</td><td>{g.threshold}</td><td><Status value={g.qty<=g.threshold?"Low stock":"Available"}/></td></tr>)}</Table>{!visible.length&&<Empty>No stock items match.</Empty>}</div>
 {["Stock register","Movements"].includes(screen)&&<div className="em-panel"><div className="em-panel-head" style={{padding:"15px 15px 0"}}><div><h3>Stock movement register</h3><p>Trace references are demo examples. Stock is posted only from the matching flow.</p></div></div><Table headers={["Reference","Movement","Item","Class","Direction","Quantity","Date","Status"]}>{movementRows.filter(r=>searchText(r).includes(q.toLowerCase())).map(r=><tr key={r.id}><td className="em-mono">{r.reference}</td><td>{r.eventType}</td><td>{r.item}</td><td>{r.itemType}</td><td>{r.direction}</td><td>{r.quantity} {r.unit}</td><td>{r.date}</td><td><Status value={r.status}/></td></tr>)}</Table></div>}
 {screen==="Adjustments"&&<div className="em-panel"><div className="em-panel-head" style={{padding:"15px 15px 0"}}><div><h3>Adjustment approval queue</h3><p>Admin, Accountant or Inventory Manager approval is required before stock changes.</p></div></div><Table headers={["Adjustment","Item","Type","Delta","Reason","Date","Status","Actions"]}>{adjustments.map(r=><tr key={r.id}><td className="em-mono">{r.id}</td><td>{r.item}</td><td>{r.type}</td><td>{r.quantity} {r.unit}</td><td>{r.reason||r.rejectionReason}</td><td>{r.date}</td><td><Status value={r.status}/></td><td>{r.status==="Submitted"&&isAdmin?<div className="em-actions-cell"><button className="em-smallbtn" data-testid={`adjust-approve-${r.id}`} onClick={()=>adjustmentAction(r,true)}>Approve</button><button className="em-smallbtn" data-testid={`adjust-reject-${r.id}`} onClick={()=>adjustmentAction(r,false)}>Reject</button></div>:"—"}</td></tr>)}</Table>{!adjustments.length&&<Empty>No inventory adjustments submitted.</Empty>}</div>}
 {transfers.length>0&&<div className="em-panel"><div className="em-panel-head" style={{padding:"15px 15px 0"}}><div><h3>Godown transfers</h3><p>Transfers are location movements, not purchases or sales.</p></div></div><Table headers={["Transfer","Item","Quantity","From","To","Status","Actions"]}>{transfers.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.item}</td><td>{r.quantity} {r.unit}</td><td>{r.from}</td><td>{r.to}</td><td><Status value={r.status}/></td><td>{r.status==="Submitted"&&isAdmin?<button className="em-smallbtn" data-testid={`transfer-approve-${r.id}`} onClick={()=>transferAction(r)}>Approve</button>:"—"}</td></tr>)}</Table></div>}</section>;
}

function NetworkModule({state,setToast}:{state:State;setToast:(s:string)=>void}){
 const fpcs=records(state,"fpcs");
 return <section className="em"><Header kicker="TSF network · read only" title="FPC network view" description="Eight partner FPCs. Network status is a monitoring view; cross-FPC member and inventory data is not editable here." actions={<Button testid="network-export" onClick={()=>setToast("Network snapshot export prepared for this local demo.")}><ArrowDownToLine size={14}/> Export snapshot</Button>}/><div className="em-stats"><Stat label="Partner FPCs" value={fpcs.length.toString()} detail="Odisha and Jharkhand"/><Stat label="Gonda sync" value="12 days stale" detail="Follow-up required"/><Stat label="Green Valley journey" value="31 / 41 · 76%" detail="Live local checklist"/><Stat label="Access" value="Read only" detail="TSF Central Admin"/></div><div className="em-panel"><Table headers={["FPC","FPC ID","District","Farmers","Shareholders","Setup journey","Last sync","Status"]}>{fpcs.map(f=>{const isGonda=String(f.name).includes("Gonda"),isGreen=String(f.id)==="FPC-ODI-001";return <tr key={f.id}><td><strong>{f.name}</strong></td><td className="em-mono">{f.id}</td><td>{f.location}</td><td>{f.farmers}</td><td>{f.shareholders}</td><td>{isGreen?"31 / 41 · 76%":isGonda?"22 / 41 · 54%":"Readiness in progress"}</td><td>{isGonda?"12 days ago":"26 Oct 2026"}</td><td><Status value={isGonda?"Stale · 12 days":f.status}/></td></tr>})}</Table></div><div className="em-note">Gonda Tribal Farmers FPC has not synced for 12 days. This network table is a seeded monitoring example.</div></section>;
}
