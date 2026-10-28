import { create } from "zustand";
import { persist as withPersistence } from "zustand/middleware";
import type { Role } from "./config";

export type RecordRow = { id: string; status?: string; fpcId?: string; [key: string]: any };
export interface DirectorRecord {
  id: string;
  srNo: number;
  dinPan: string;
  name: string;
  designation: string;
  appointmentDate: string;
  cessationDate: string;
  signatory: string;
  fpcId?: string;
}
export interface CompanyBankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: "Current" | "Savings" | "Cash Credit" | "Overdraft" | "Other";
  ifscCode: string;
  branchName: string;
  branchAddress?: string;
  isPrimary: boolean;
  status: "Active" | "Inactive";
  fpcId?: string;
  createdAt?: string;
}
export interface OfficialCompanyRegistration {
  companyName: string;
  cin: string;
  registrationNumber: string;
  rocName: string;
  dateOfIncorporation: string;
  email: string;
  registeredAddress: string;
  booksOfAccountAddress: string;
  isStockExchangeListed: boolean;
  companyCategory: string;
  companySubcategory: string;
  companyClass: string;
  activeCompliance: string;
  authorisedCapital: number;
  paidUpCapital: number;
  dateOfLastAgm: string;
  dateOfBalanceSheet: string;
  companyStatus: "Active" | "Inactive" | "Under Process";
  jurisdictionRoc: string;
  regionalDirector: string;
  mcaSourceTimestamp: string;
}

export const officialCompanyRegistration: OfficialCompanyRegistration = {
  companyName: "UAL BAHA FARMER PRODUCER COMPANY LIMITED",
  cin: "U46209JH2024PTC022984",
  registrationNumber: "022984",
  rocName: "ROC Jharkhand",
  dateOfIncorporation: "17/07/2024",
  email: "sonaramsoren267@gmail.com",
  registeredAddress: "C/O KALIRAM MARDI,H NO-01, MOHITPUR, MUNDATANDA, Munda Tand, Seraikela-kharsawan, Seraikela, Jharkhand, India, 833220",
  booksOfAccountAddress: "-",
  isStockExchangeListed: false,
  companyCategory: "Company limited by shares",
  companySubcategory: "Non-government company",
  companyClass: "Private",
  activeCompliance: "-",
  authorisedCapital: 1000000,
  paidUpCapital: 10000,
  dateOfLastAgm: "-",
  dateOfBalanceSheet: "-",
  companyStatus: "Active",
  jurisdictionRoc: "ROC Jharkhand",
  regionalDirector: "RD, Eastern Region",
  mcaSourceTimestamp: "22-07-2024 11:46:46am",
};
export type State = {
  role: Role | null; memberId: string; language: string; offline: boolean; records: Record<string, RecordRow[]>;
  walletBalances: Record<string, number>; walletTransactions: RecordRow[]; rateHistory: RecordRow[];
  inputCatalog: RecordRow[]; inputOrders: RecordRow[]; saleRequests: RecordRow[]; certificates: RecordRow[];
  audit: RecordRow[]; notifications: RecordRow[]; syncQueue: RecordRow[];
};
const fpcId = "FPC-ODI-001";
const farmerSeeds = [
  ["F-001","Ravi Kumar","Green Valley","2.0","Paddy","Verified","SH-001"],
  ["F-002","Sita Devi","Green Valley","1.5","Paddy, Vegetables","Verified","SH-002"],
  ["F-003","Mohan Munda","Pitamahal","3.2","Paddy, Maize","Verified",""],
  ["F-004","Lalita Behera","Pitamahal","0.8","Arhar","Pending","SH-003"],
  ["F-005","Gopal Sahoo","Telkoi","4.5","Paddy","Verified","SH-004"],
  ["F-006","Rukmini Majhi","Telkoi","1.2","Maize","Verified",""],
  ["F-007","Birsa Soren","Harichandanpur","2.6","Paddy, Ragi","Verified","SH-005"],
  ["F-008","Kamala Patra","Harichandanpur","1.0","Vegetables","Rejected",""],
];
const farmers = [...farmerSeeds, ...Array.from({length:92},(_,i)=>[`F-${String(i+9).padStart(3,"0")}`,i===91?"Regression test farmer":["Dilip Naik","Mina Munda","Suresh Behera","Bina Soren","Kartik Majhi"][i%5],["Green Valley","Pitamahal","Telkoi","Harichandanpur","Rugudi"][i%5],(1.1+(i%9)*.4).toFixed(1),["Paddy","Maize","Arhar","Ragi"][i%4],i%6===0?"Pending":"Verified",""])].map((x,i)=>({id:x[0],farmerId:x[0],name:x[1],village:x[2],land:`${x[3]} acres`,crop:x[4],kyc:x[5],shareholder:x[6]||"No",mobile:`9${String(700000000+i*1731).slice(0,9)}`,fpcId,status:"Active",gender:i%3===0?"Female":"Male",category:["General","OBC","SC","ST"][i%4],block:["Keonjhar Sadar","Harichandanpur","Telkoi","Patna"][i%4],district:"Keonjhar",state:"Odisha"}));
const firstShareholders = ([
  ["SH-001","F-001","Ravi Kumar",10,"SC-001","FL-001","02 Aug 2021"],
  ["SH-002","F-002","Sita Devi",25,"SC-002","FL-002","02 Aug 2021"],
  ["SH-003","F-004","Lalita Behera",5,"SC-003","FL-003","19 Nov 2021"],
  ["SH-004","F-005","Gopal Sahoo",100,"SC-004","FL-004","19 Nov 2021"],
  ["SH-005","F-007","Birsa Soren",20,"SC-005","FL-005","11 Mar 2022"],
] as Array<[string,string,string,number,string,string,string]>).map((x,i)=>({
 id:x[0],farmerId:x[1],name:x[2],shares:x[3],faceValue:100,capital:x[3]*100,
  certificate:x[4],folio:x[5],admitted:x[6],fpcId,status:"Active",
 gender:["Male","Female","Female","Male","Male"][i],category:["OBC","ST","ST","General","ST"][i],
 mobile:["98XXXX2241","97XXXX1202","96XXXX4413","91XXXX7724","90XXXX5511"][i],
 village:["Green Valley","Green Valley","Pitamahal","Telkoi","Harichandanpur"][i],
 panchayat:["Sanapatna","Sanapatna","Pitamahal","Telkoi","Harichandanpur"][i],
 block:["Keonjhar Sadar","Keonjhar Sadar","Harichandanpur","Telkoi","Harichandanpur"][i]
}));
const shareFirstNames=["Pramod","Kanchan","Dillip","Laxmi","Ramesh","Madhab","Sanjay","Pooja","Subash","Gita","Narayan","Jema","Suresh","Basanti","Kartik","Mina","Bikash","Saraswati"];
const shareLastNames=["Mohanty","Behera","Sahoo","Patra","Munda","Naik","Nayak","Majhi","Jena","Soren","Rout","Hembram"];
const categoryPlan=[...Array(13).fill("General"),...Array(11).fill("OBC"),...Array(9).fill("SC"),...Array(24).fill("ST")];
const spreadShares=(total:number,count:number)=>Array.from({length:count},(_,i)=>Math.floor(total/count)+(i<total%count?1:0));
const generatedMenShares=spreadShares(3770,35);
const generatedWomenShares=spreadShares(2270,22);
const generatedShareholders=Array.from({length:57},(_,i)=>{
 const index=i+6, male=i<35, shares=(male?generatedMenShares[i]:generatedWomenShares[i-35]);
 const first=shareFirstNames[i%shareFirstNames.length], last=shareLastNames[Math.floor(i/shareFirstNames.length)%shareLastNames.length];
 const id=`SH-${String(index).padStart(3,"0")}`, farmerId=i<25?`F-${String(i+6).padStart(3,"0")}`:"";
 const village=["Green Valley","Pitamahal","Telkoi","Harichandanpur","Rugudi"][i%5];
  return {id,farmerId,name:`${first} ${last}`,shares,faceValue:100,capital:shares*100,certificate:`SC-${String(index).padStart(3,"0")}`,folio:`FL-${String(index).padStart(3,"0")}`,admitted:["18 Jun 2022","06 Jan 2023","14 Mar 2024","09 Jul 2025"][i%4],fpcId,status:"Active",gender:male?"Male":"Female",category:categoryPlan[i],mobile:`9${String(720000000+i*2719).slice(0,9)}`,village,panchayat:["Sanapatna","Pitamahal","Telkoi","Harichandanpur"][i%4],block:["Keonjhar Sadar","Harichandanpur","Telkoi","Patna"][i%4]};
});
const shareholders=[...firstShareholders,...generatedShareholders];
const purchases: RecordRow[] = [{
 id:"PUR-2026-0001",farmer:"Ravi Kumar",farmerId:"F-001",commodity:"Paddy (common)",quantity:1000,unit:"kg",rate:25,amount:25000,date:"12 Oct 2026",payment:"Bank transfer · UTIB2026101200451",status:"Approved",fpcId
}, ...Array.from({length:39},(_,i)=>{const unit=["tonne","quintal","bag","kg"][i%4];const quantity=[2.5,18,40,750][i%4];const commodity=i<3?"Maize":["Paddy (common)","Maize","Arhar","Ragi"][i%4];const rate=commodity==="Maize"?21:[25,21,72,38][i%4];return {id:`PUR-2026-${String(i+2).padStart(4,"0")}`,farmer:farmerSeeds[(i+1)%8][1],farmerId:farmerSeeds[(i+1)%8][0],commodity,quantity,unit,rate,amount:convert(quantity,unit,"kg")*rate,date:`${String(3+(i%27)).padStart(2,"0")} ${["Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026","Sep 2026","Oct 2026"][i%12]}`,status:i<3?"Submitted":"Approved",fpcId}})];
const sales: RecordRow[] = [{
 id:"SAL-2026-0001",buyer:"Shree Balaji Rice Mills, Cuttack",commodity:"Paddy (common)",quantity:10000,unit:"kg",rate:30,amount:300000,cost:250000,margin:50000,date:"14 Oct 2026",status:"Approved",fpcId
}, ...Array.from({length:19},(_,i)=>({id:`SAL-2026-${String(i+2).padStart(4,"0")}`,buyer:["Odisha State Civil Supplies Corporation","Kisan Agro Traders, Bhubaneswar","Jagannath Flour Mills, Balasore"][i%3],commodity:["Paddy (common)","Maize","Ragi"][i%3],quantity:1500+i*325,unit:"kg",rate:[30,24.5,45][i%3],amount:45000+i*9750,cost:37500+i*8125,margin:7500+i*1625,date:`${String(2+(i%26)).padStart(2,"0")} ${["Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026","Sep 2026","Oct 2026"][i%12]}`,status:"Approved",fpcId}))];
const fpclist = [
 ["Green Valley Farmer Producer Company Ltd.","FPC-ODI-001","Keonjhar, Odisha","100","62","Active"],
 ["Kalinganagar Agri Producers Co.","FPC-ODI-002","Jajpur, Odisha","214","—","Active"],
 ["Noamundi Millet Growers FPC","FPC-JHK-001","West Singhbhum, Jharkhand","156","—","Active"],
 ["Seraikela Vegetable Growers FPC","FPC-JHK-002","Seraikela-Kharsawan, Jharkhand","88","—","Onboarding"],
 ["Gonda Tribal Farmers FPC","FPC-ODI-003","Keonjhar, Odisha","132","—","Active · 12 days overdue"],
 ["Joda Pulse Producers FPC","FPC-ODI-004","Keonjhar, Odisha","97","—","Active"],
 ["Chaibasa Organic FPC","FPC-JHK-003","West Singhbhum, Jharkhand","71","—","Inactive"],
 ["Barbil Oilseed Growers FPC","FPC-ODI-005","Keonjhar, Odisha","119","—","Compliance overdue"],
].map((x,i)=>({
 id:x[1],name:x[0],location:x[2],farmers:x[3],shareholders:x[4],status:x[5],fpcId:i===0?fpcId:x[1],
 state:i===2||i===3||i===6?"Jharkhand":"Odisha",
 district:i===1?"Jajpur":i===2||i===6?"West Singhbhum":i===3?"Seraikela-Kharsawan":"Keonjhar",
 block:i===0?"Keonjhar Sadar":i===1?"Jajpur Sadar":i===2||i===6?"Noamundi":i===3?"Seraikela":"Keonjhar Sadar",
 employeeCount:[10,14,9,3,7,8,4,8][i],directorCount:[6,9,7,5,7,6,6,8][i],
 turnover:[7180000,16240000,8260000,0,3890000,7430000,2110000,5570000][i],
  details:i===0?{
   basic:{legalName:"Green Valley Farmer Producer Company Ltd.",cin:"U01100OD2021PTC035612",pan:"AAACG1234F",tan:"BBNG01234A",gstin:"21AAACG1234F1Z5",logoName:"green-valley-mark.svg",contactEmail:"office@greenvalleyfpc.in",mobile:"9437004412"},
  licenses:[
    {id:"LIC-FSSAI-001",type:"FSSAI",name:"FSSAI",number:"21426012345678",authority:"Food Safety and Standards Authority of India",issueDate:"2021-06-14",expiryDate:"2027-06-14",status:"Valid",document:"fssai-certificate.pdf"},
    {id:"LIC-SEED-001",type:"Seed",name:"Seed License",number:"SL/KEO/2024/118",authority:"District Agriculture Office, Keonjhar",issueDate:"2024-04-01",expiryDate:"2027-03-31",status:"Valid",document:"seed-license.pdf"},
    {id:"LIC-FERT-001",type:"Fertilizer",name:"Fertilizer License",number:"FL/KEO/2023/041",authority:"District Agriculture Office, Keonjhar",issueDate:"2023-12-15",expiryDate:"2026-12-14",status:"Expiring soon",document:"fertilizer-license.pdf"},
  ],
   roc:{office:"RoC Cuttack",incorporationDate:"2021-06-14",registeredAddress:"Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha 758001",financialYearEnd:"31 March",agmDate:"2026-09-21",annualReturn:"Filed",auditStatus:"Completed",lastAgmDate:"21 Sep 2026",lastAnnualReturnDate:"20 Oct 2025",statutoryAudit:"Completed"},
   capital:{authorised:1000000,paidUp:620000,authorisedCapital:1000000,paidUpCapital:620000,faceValue:100},
   turnovers:[{year:"2023–24",amount:4150000},{year:"2024–25",amount:5820000},{year:"2025–26",amount:7180000}],
   employees:Array.from({length:10},(_,employeeIndex)=>({id:`EMP-${String(employeeIndex+1).padStart(3,"0")}`,name:["Bijay Kumar Mohanty","Anita Das","Prakash Rout","Mamata Jena","Sanjay Tudu","Pooja Nayak","Rakesh Hembram","Suman Naik","Dillip Sahoo","Laxmi Patra"][employeeIndex],designation:["CEO","Accountant","Procurement Officer","Sales Officer","Stock Manager","Data Entry Operator","Compliance Officer","Field Staff","Operations Assistant","Community Mobiliser"][employeeIndex],role:["CEO","Accountant","Procurement Officer","Sales Officer","Stock Manager","Data Entry Operator","Compliance Officer","Field Staff","Operations Assistant","Community Mobiliser"][employeeIndex],mobile:`9${String(870000000+employeeIndex*1013).slice(0,9)}`,dateOfJoining:"2022-07-01",gender:employeeIndex===3||employeeIndex===5||employeeIndex===9?"Female":"Male",employmentType:employeeIndex===7?"Part-time":"Full-time"})),
  directors:[
    {id:"BOD-001",name:"Sunita Behera",din:"01234567",designation:"Chairperson",appointmentDate:"2021-06-14",gender:"Female",category:"OBC",mobile:"9876501001",email:"sunita@greenvalleyfpc.demo",address:"Keonjhar, Odisha"},
    {id:"BOD-002",name:"Bijay Kumar Mohanty",din:"12345678",designation:"CEO",appointmentDate:"2021-06-14",gender:"Male",category:"General",mobile:"9876501002",email:"bijay@greenvalleyfpc.demo",address:"Keonjhar, Odisha"},
    {id:"BOD-003",name:"Ramesh Chandra Nayak",din:"23456781",designation:"Director",appointmentDate:"2021-06-14",gender:"Male",category:"General",mobile:"9876501003",email:"ramesh@greenvalleyfpc.demo",address:"Keonjhar, Odisha"},
    {id:"BOD-004",name:"Laxmi Patra",din:"34567812",designation:"Director",appointmentDate:"2021-06-14",gender:"Female",category:"SC",mobile:"9876501004",email:"laxmi@greenvalleyfpc.demo",address:"Keonjhar, Odisha"},
    {id:"BOD-005",name:"Dillip Sahoo",din:"45678123",designation:"Director",appointmentDate:"2021-06-14",gender:"Male",category:"OBC",mobile:"9876501005",email:"dillip@greenvalleyfpc.demo",address:"Keonjhar, Odisha"},
    {id:"BOD-006",name:"Kanchan Munda",din:"56781234",designation:"Director",appointmentDate:"2021-06-14",gender:"Female",category:"ST",mobile:"9876501006",email:"kanchan@greenvalleyfpc.demo",address:"Keonjhar, Odisha"},
  ],
   location:{address:"Village Green Valley, Keonjhar Sadar, Keonjhar, Odisha 758001",state:"Odisha",district:"Keonjhar",block:"Keonjhar Sadar",pin:"758001",latitude:"21.6289",longitude:"85.5817",activities:"Produce aggregation, Input supply, Marketing, Soil Testing",commodities:"Paddy, Maize, Arhar, Ragi",villages:"24",farmerTarget:"120"},
  activities:["Produce aggregation","Input supply","Marketing","Soil Testing"],
  admin:{name:"Bijay Kumar Mohanty",mobile:"9876544412",email:"bijay@greenvalleyfpc.demo",subUserLimit:25},
   bankAccounts:[{id:"BANK-001",bank:"State Bank of India",branch:"Keonjhar",accountNumber:"XXXXXX4821",ifsc:"SBIN0001234",type:"Current",accountType:"Current"}],
  memberStats:{womenPercent:42,scPercent:18,stPercent:42,smallMarginalPercent:76},
  onboardingDate:"14 Jun 2021",lastUpdated:"26 Oct 2026",
  }:{
   basic:{legalName:x[0],cin:"U01100OD2020PTC033871",pan:"",tan:"",gstin:""},
   capital:{paidUp:[0,1400000,980000,0,760000,550000,440000,670000][i],authorised:[2500000,2500000,1500000,1000000,1500000,1000000,1000000,2000000][i]},
   turnovers:[{year:"2023–24",amount:0},{year:"2024–25",amount:0},{year:"2025–26",amount:[0,16240000,8260000,0,3890000,7430000,2110000,5570000][i]}],
   location:{state:i===2||i===3||i===6?"Jharkhand":"Odisha",district:i===1?"Jajpur":i===2||i===6?"West Singhbhum":i===3?"Seraikela-Kharsawan":"Keonjhar",block:i===0?"Keonjhar Sadar":i===1?"Jajpur Sadar":i===2||i===6?"Noamundi":i===3?"Seraikela":"Keonjhar Sadar"}
  }
}));
const rateDefinitions=[
 ["Paddy common","Common","25","24.5","23","Grains","produce","kg"],
 ["Paddy grade A","Grade A","27","27","25.5","Grains","produce","kg"],
 ["Wheat","Common","34","33.5","32","Grains","produce","kg"],
 ["Maize","Common","21","21","20","Grains","produce","kg"],
 ["Arhar (tur)","Common","72","71","69","Pulses","produce","kg"],
 ["Ragi","Common","38","37.5","36","Grains","produce","kg"],
 ["Mustard","Common","58","58","56","Oilseeds","produce","kg"],
 ["Tomato","Common","25","28","32","Vegetables","produce","kg"],
 ["Potato","Common","18","18","17","Vegetables","produce","kg"],
 ["Onion","Common","22","21","24","Vegetables","produce","kg"],
 ["Brinjal","Common","20","22","19","Vegetables","produce","kg"],
 ["Paddy seed MTU-1010","MTU-1010","52","52","50","Seeds","input","kg"],
 ["DAP fertiliser","50 kg bag","1350","1350","1350","Fertiliser","input","bag"],
 ["Urea","45 kg bag","266.5","266.5","266.5","Fertiliser","input","bag"],
 ["Vermicompost","50 kg bag","350","350","340","Fertiliser","input","bag"],
 ["Neem pesticide","1 litre","420","420","410","Pesticide","input","litre"],
 ["Maize hybrid seed","Hybrid","310","310","300","Seeds","input","kg"],
];
const rateHistory=rateDefinitions.map(([name,grade,today,yesterday,weekAgo,category,kind,unit],index)=>({
 id:`RATE-${String(index+1).padStart(3,"0")}`,name,grade,unit,category,kind,
 today:Number(today),yesterday:Number(yesterday),weekAgo:Number(weekAgo),
 updated:"08:30 AM",updatedBy:"Prakash Rout",date:"26 Oct 2026",fpcId
}));
const inputCatalog=[
   {id:"INP-001",name:"Paddy seed MTU-1010",category:"Seeds",packSize:"Per kg",unit:"kg",rate:52,stock:775,lowStock:50,gst:0,batch:"MTU-1010-2610",expiry:"30 Jun 2027",supplier:"Utkal Agro Inputs Pvt Ltd"},
   {id:"INP-002",name:"DAP fertiliser",category:"Fertiliser",packSize:"50 kg bag",unit:"bag",rate:1350,stock:219,lowStock:20,gst:5,batch:"DAP-2610-A",expiry:"30 Sep 2027",supplier:"Utkal Agro Inputs Pvt Ltd"},
   {id:"INP-003",name:"Urea",category:"Fertiliser",packSize:"45 kg bag",unit:"bag",rate:266.5,stock:400,lowStock:25,gst:5,batch:"UREA-2610-B",expiry:"30 Sep 2027",supplier:"Utkal Agro Inputs Pvt Ltd"},
   {id:"INP-004",name:"Vermicompost",category:"Fertiliser",packSize:"50 kg bag",unit:"bag",rate:350,stock:259,lowStock:15,gst:5,batch:"VER-2610-C",expiry:"30 Apr 2027",supplier:"Utkal Agro Inputs Pvt Ltd"},
   {id:"INP-005",name:"Neem pesticide",category:"Pesticide",packSize:"1 litre",unit:"litre",rate:420,stock:140,lowStock:10,gst:18,batch:"NP-2409",expiry:"23 Nov 2026",supplier:"Utkal Agro Inputs Pvt Ltd"},
 {id:"INP-006",name:"Maize hybrid seed",category:"Seeds",packSize:"Per kg",unit:"kg",rate:310,stock:58,lowStock:10,gst:0},
].map(r=>({...r,fpcId}));
const makePastWalletRows=(farmerId:string,owner:string,prefix:number,credit:number,dates:string[])=>dates.flatMap((date,index)=>[
 {id:`TXN-2026-${String(prefix+index*2).padStart(6,"0")}`,farmerId,owner,date:`15 ${date}`,type:"Sale credit",description:"Produce sale · mixed crops",amount:credit,direction:"Credit",walletEffect:credit,walletBalanceAfter:credit,status:"Posted",reference:`SLF-2026-${String(50+index).padStart(4,"0")}`,fpcId},
 {id:`TXN-2026-${String(prefix+index*2+1).padStart(6,"0")}`,farmerId,owner,date:`18 ${date}`,type:"Input purchase",description:"Seed and fertiliser · wallet payment",amount:credit,direction:"Debit",walletEffect:-credit,walletBalanceAfter:0,status:"Posted",reference:`ORD-2026-${String(50+index).padStart(4,"0")}`,fpcId},
]);
const olderDates=["Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026","Sep 2026"];
const walletTransactions=[
 ...makePastWalletRows("F-001","Ravi Kumar",401,1800,olderDates),
 ...makePastWalletRows("F-002","Sita Devi",501,1200,olderDates),
 {id:"TXN-2026-000413",farmerId:"F-001",owner:"Ravi Kumar",date:"12 Oct 2026 · 10:20",type:"Sale credit",description:"Paddy 1,000 kg + Tomato 10 kg",amount:25300,direction:"Credit",walletEffect:25300,walletBalanceAfter:25300,status:"Credited",reference:"SLF-2026-0003",fpcId},
 {id:"TXN-2026-000414",farmerId:"F-001",owner:"Ravi Kumar",date:"12 Oct 2026 · 11:05",type:"Input purchase",description:"Urea, Neem pesticide, Paddy seed and Vermicompost",amount:3023,direction:"Debit",walletEffect:-3023,walletBalanceAfter:22277,status:"Paid",reference:"ORD-2026-0019",fpcId},
 {id:"TXN-2026-000415",farmerId:"F-001",owner:"Ravi Kumar",date:"14 Oct 2026 · 14:18",type:"Withdrawal",description:"Withdrawal to SBI account ending 4821",amount:20000,direction:"Debit",walletEffect:-20000,walletBalanceAfter:2277,status:"Paid",reference:"UTIB2026101400873",fpcId},
 {id:"TXN-2026-000416",farmerId:"F-001",owner:"Ravi Kumar",date:"20 Oct 2026 · 09:00",type:"Dividend credit",description:"FY 2025–26 · 5% on share capital",amount:50,direction:"Credit",walletEffect:0,walletBalanceAfter:2277,status:"Scheduled",reference:"DIV-2025-26-RAVI",fpcId},
 {id:"TXN-2026-000417",farmerId:"F-001",owner:"Ravi Kumar",date:"20 Oct 2026 · 09:05",type:"Patronage bonus",description:"1,000 kg paddy × Rs 0.50/kg",amount:500,direction:"Credit",walletEffect:0,walletBalanceAfter:2277,status:"Scheduled",reference:"PAT-2025-26-RAVI",fpcId},
 {id:"TXN-2026-000418",farmerId:"F-002",owner:"Sita Devi",date:"18 Oct 2026 · 09:20",type:"Sale credit",description:"Paddy 390 kg + Tomato 10 kg",amount:10000,direction:"Credit",walletEffect:10000,walletBalanceAfter:10000,status:"Credited",reference:"SLF-2026-0007",fpcId},
 {id:"TXN-2026-000419",farmerId:"F-002",owner:"Sita Devi",date:"18 Oct 2026 · 11:10",type:"Input purchase",description:"DAP, Paddy seed MTU-1010 and Vermicompost",amount:3000,direction:"Debit",walletEffect:-3000,walletBalanceAfter:7000,status:"Paid",reference:"ORD-2026-0031",fpcId},
];
const saleRequests=[
 {id:"SLF-2026-0003",farmerId:"F-001",farmer:"Ravi Kumar",date:"12 Oct 2026",status:"Credited",collectionPoint:"Main Godown Keonjhar",items:[{commodity:"Paddy common",quantity:1000,unit:"kg",rate:25,amount:25000},{commodity:"Tomato",quantity:10,unit:"kg",rate:30,amount:300}],total:25300,actualQuantity:1000,fpcId},
 {id:"SLF-2026-0007",farmerId:"F-002",farmer:"Sita Devi",date:"18 Oct 2026",status:"Credited",collectionPoint:"Satellite Godown Pitamahal",items:[{commodity:"Paddy common",quantity:390,unit:"kg",rate:25,amount:9750},{commodity:"Tomato",quantity:10,unit:"kg",rate:25,amount:250}],total:10000,actualQuantity:400,fpcId},
];
const inputOrders=[
 {id:"ORD-2026-0019",farmerId:"F-001",farmer:"Ravi Kumar",date:"12 Oct 2026",status:"Collected",paymentMode:"Wallet",total:3023,items:[{name:"Urea",quantity:2,unit:"bag",rate:266.5,amount:533},{name:"Neem pesticide",quantity:2,unit:"litre",rate:420,amount:840},{name:"Paddy seed MTU-1010",quantity:25,unit:"kg",rate:52,amount:1300},{name:"Vermicompost",quantity:1,unit:"bag",rate:350,amount:350}],fpcId},
 {id:"ORD-2026-0031",farmerId:"F-002",farmer:"Sita Devi",date:"18 Oct 2026",status:"Collected",paymentMode:"Wallet",total:3000,items:[{name:"DAP fertiliser",quantity:1,unit:"bag",rate:1350,amount:1350},{name:"Paddy seed MTU-1010",quantity:25,unit:"kg",rate:52,amount:1300},{name:"Vermicompost",quantity:1,unit:"bag",rate:350,amount:350}],fpcId},
];
const certificates=shareholders.reduce((rows,s)=>{const from=rows.length?Number(rows[rows.length-1].distinctiveTo)+1:1;rows.push({id:s.certificate,certificate:s.certificate,folio:s.folio,uniqueId:s.id,name:s.name,farmerId:s.farmerId,shares:s.shares,faceValue:100,capital:s.capital,distinctiveFrom:from,distinctiveTo:from+Number(s.shares)-1,allotted:s.admitted,status:"Issued",fpcId});return rows;},[] as RecordRow[]);
const businessSamples:RecordRow[]=[
 {id:"PUR-2026-0001",flow:"A",flowName:"Produce Purchase",party:"Ravi Kumar · F-001",item:"Paddy common",quantity:1000,unit:"kg",rate:25,amount:25000,date:"12 Oct 2026",status:"Approved",settlement:"Wallet",stockDirection:"IN",fpcId},
 {id:"INV-2026-0118",flow:"B",flowName:"Input Sale",party:"Sita Devi · F-002",item:"DAP, seed MTU-1010, Vermicompost",quantity:3,unit:"line items",rate:1000,amount:3000,date:"18 Oct 2026",status:"Approved",settlement:"Wallet",stockDirection:"OUT",fpcId},
 {id:"SAL-2026-0031",flow:"C",flowName:"Produce Sale",party:"Shree Balaji Rice Mills, Cuttack",item:"Paddy common",quantity:1000,unit:"kg",rate:30,amount:30000,date:"20 Oct 2026",status:"Approved",settlement:"15 days",stockDirection:"OUT",vehicle:"OD-09-AB-4412",cost:25000,margin:5000,fpcId},
 {id:"PUR-IN-2026-0009",flow:"D",flowName:"Input Purchase",party:"Utkal Agro Inputs Pvt Ltd, Bhubaneswar",item:"DAP, Urea, Paddy seed, Neem pesticide, Vermicompost",quantity:1100,unit:"mixed",rate:50,amount:282400,date:"10 Oct 2026",status:"Approved",settlement:"30 days",stockDirection:"IN",fpcId},
];
const generatedBusiness=Array.from({length:56},(_,i)=>{const flow=["A","B","C","D"][i%4],party=flow==="A"||flow==="B"?farmers[i%farmers.length].name:flow==="C"?"Shree Balaji Rice Mills, Cuttack":"Utkal Agro Inputs Pvt Ltd, Bhubaneswar",item=flow==="A"||flow==="C"?["Paddy common","Maize","Arhar","Ragi"][i%4]:["DAP fertiliser","Urea","Paddy seed MTU-1010","Vermicompost"][i%4],quantity=[250,500,1000,1500][i%4],rate=flow==="A"?25:flow==="C"?30:flow==="B"?350:1250,month=(i%6)+5;return {id:`${flow==="A"?"PUR":flow==="B"?"INV":flow==="C"?"SAL":"PUR-IN"}-2026-${String(i+10).padStart(4,"0")}`,flow,flowName:flow==="A"?"Produce Purchase":flow==="B"?"Input Sale":flow==="C"?"Produce Sale":"Input Purchase",party,item,quantity,unit:flow==="A"||flow==="C"?"kg":item.includes("seed")?"kg":"bag",rate,amount:quantity*rate,date:`${String(2+(i%26)).padStart(2,"0")} ${["May","Jun","Jul","Aug","Sep","Oct"][i%6]} 2026`,status:"Approved",settlement:flow==="A"||flow==="B"?"Wallet":"30 days",stockDirection:flow==="A"||flow==="D"?"IN":"OUT",fpcId};});
const buyerSeeds:RecordRow[]=[
 {id:"BUY-001",name:"Shree Balaji Rice Mills",type:"Mill",gstin:"21AAAAA0000A1Z5",pan:"AAAAA0000A",contact:"R. Mahapatra",mobile:"9437001001",address:"Cuttack, Odisha",creditLimit:500000,paymentTerms:15,status:"Active",openBalance:10000,location:"Cuttack",fpcId},
 {id:"BUY-002",name:"Odisha State Civil Supplies Corporation",type:"Government agency",gstin:"21AABCO1234A1Z1",pan:"AABCO1234A",contact:"Procurement Desk",mobile:"06742301000",address:"Bhubaneswar, Odisha",creditLimit:1000000,paymentTerms:30,status:"Active",openBalance:0,location:"Bhubaneswar",fpcId},
 {id:"BUY-003",name:"Kisan Agro Traders",type:"Trader",gstin:"21AAKFK1100B1Z8",pan:"AAKFK1100B",contact:"S. Pradhan",mobile:"9437001003",address:"Bhubaneswar, Odisha",creditLimit:250000,paymentTerms:15,status:"Active",openBalance:12500,location:"Bhubaneswar",fpcId},
 {id:"BUY-004",name:"Jagannath Flour Mills",type:"Mill",gstin:"21AABCJ0000A1Z2",pan:"AABCJ0000A",contact:"M. Sahoo",mobile:"9437001004",address:"Balasore, Odisha",creditLimit:200000,paymentTerms:30,status:"Active",openBalance:0,location:"Balasore",fpcId},
 {id:"BUY-005",name:"Keonjhar Fresh Market",type:"Retail",gstin:"21AAAFK2200C1Z4",pan:"AAAFK2200C",contact:"B. Naik",mobile:"9437001005",address:"Keonjhar, Odisha",creditLimit:75000,paymentTerms:7,status:"Active",openBalance:0,location:"Keonjhar",fpcId},
 {id:"BUY-006",name:"Eastern Grain Cooperative",type:"Government agency",gstin:"21AAEGE3300D1Z6",pan:"AAEGE3300D",contact:"P. Rout",mobile:"9437001006",address:"Jajpur, Odisha",creditLimit:300000,paymentTerms:21,status:"Active",openBalance:0,location:"Jajpur",fpcId},
];
const supplierSeeds:RecordRow[]=[
 {id:"SUP-001",name:"Utkal Agro Inputs Pvt Ltd",category:"Fertiliser",gstin:"21AABCU1234A1Z5",contact:"Anil Mishra · 06742550001",address:"Bhubaneswar, Odisha",paymentTerms:30,bankAccount:"XXXXXX7342",status:"Active",openBalance:0,location:"Bhubaneswar",fpcId},
 {id:"SUP-002",name:"Kalinga Seed Corporation",category:"Seed",gstin:"21AAACK2200B1Z4",contact:"S. Pradhan · 9437002002",address:"Cuttack, Odisha",paymentTerms:30,bankAccount:"XXXXXX1208",status:"Active",openBalance:18500,location:"Cuttack",fpcId},
 {id:"SUP-003",name:"GreenShield Crop Care",category:"Pesticide",gstin:"21AAACG3300C1Z3",contact:"M. Sahu · 9437002003",address:"Balasore, Odisha",paymentTerms:15,bankAccount:"XXXXXX4391",status:"Active",openBalance:0,location:"Balasore",fpcId},
 {id:"SUP-004",name:"Eastern Farm Equipment",category:"Equipment",gstin:"21AAEET4400D1Z2",contact:"P. Das · 9437002004",address:"Keonjhar, Odisha",paymentTerms:45,bankAccount:"XXXXXX8620",status:"Active",openBalance:0,location:"Keonjhar",fpcId},
 {id:"SUP-005",name:"Odisha Farmers Seed Works",category:"Seed",gstin:"21AAOFS5500E1Z1",contact:"L. Behera · 9437002005",address:"Jajpur, Odisha",paymentTerms:30,bankAccount:"XXXXXX3326",status:"Active",openBalance:0,location:"Jajpur",fpcId},
];
const dividendRuns:RecordRow[]=[
 {id:"DIV-RUN-2026-001",name:"FY 2025–26 dividend · 5%",period:"FY 2025–26",rate:5,status:"Submitted",submittedBy:"Anita Das",submittedAt:"26 Oct 2026 · 10:15",patronageBonus:1200,note:"Dividend is not guaranteed; declared by the general meeting",breakdown:[{member:"Ravi Kumar",memberId:"SH-001",capital:1000,rate:5,amount:50},{member:"Sita Devi",memberId:"SH-002",capital:2500,rate:5,amount:125},{member:"Lalita Behera",memberId:"SH-003",capital:500,rate:5,amount:25}],totalPayout:200,fpcId},
 {id:"DIV-RUN-2026-002",name:"FY 2025–26 patronage · Kharif",period:"FY 2025–26",rate:0,status:"Submitted",submittedBy:"Anita Das",submittedAt:"26 Oct 2026 · 10:42",patronageBonus:2400,note:"Dividend is not guaranteed; declared by the general meeting",breakdown:[{member:"Ravi Kumar",memberId:"SH-001",capital:1000,rate:0,amount:0},{member:"Sita Devi",memberId:"SH-002",capital:2500,rate:0,amount:0}],totalPayout:0,fpcId},
];
const inboxSeeds={
 inputPurchaseApprovals:[
  {id:"APR-D-001",flow:"D",flowName:"Input Purchase",party:"Utkal Agro Inputs Pvt Ltd",item:"DAP · 20 bags",items:[{name:"DAP fertiliser",quantity:20,unit:"bag"}],quantity:20,unit:"bag",amount:27000,status:"Submitted",submittedBy:"Prakash Rout",date:"26 Oct 2026",fpcId},
  {id:"APR-D-002",flow:"D",flowName:"Input Purchase",party:"Kalinga Seed Corporation",item:"MTU-1010 seed · 200 kg",items:[{name:"Paddy seed MTU-1010",quantity:200,unit:"kg"}],quantity:200,unit:"kg",amount:10400,status:"Submitted",submittedBy:"Prakash Rout",date:"26 Oct 2026",fpcId},
 ],
 inputSaleApprovals:[
  {id:"APR-B-001",flow:"B",flowName:"Input Sale",party:"Ravi Kumar · F-001",farmerId:"F-001",item:"Urea · 2 bags",items:[{name:"Urea",quantity:2,unit:"bag"}],quantity:2,unit:"bag",amount:533,status:"Submitted",submittedBy:"Mamata Jena",date:"26 Oct 2026",fpcId},
  {id:"APR-B-002",flow:"B",flowName:"Input Sale",party:"Sita Devi · F-002",farmerId:"F-002",item:"DAP · 1 bag",items:[{name:"DAP fertiliser",quantity:1,unit:"bag"}],quantity:1,unit:"bag",amount:1350,status:"Submitted",submittedBy:"Mamata Jena",date:"26 Oct 2026",fpcId},
 ],
 dividendRuns,
 farmerLinkRequests:[
  {id:"LNK-001",farmerId:"F-003",farmer:"Mohan Munda",requestingFpc:"Gonda Tribal Farmers FPC",reason:"Household cultivates leased plots in both FPC areas; wants one verified farmer record.",status:"Submitted",requestedBy:"Gonda FPC Admin",date:"25 Oct 2026",fpcId},
  {id:"LNK-002",farmerId:"F-006",farmer:"Rukmini Majhi",requestingFpc:"Joda Pulse Producers FPC",reason:"Member moved residence and requests continuity of her farmer profile.",status:"Submitted",requestedBy:"Joda FPC Admin",date:"26 Oct 2026",fpcId},
 ],
 profileChangeRequests:[
  {id:"PRO-001",name:"Ravi Kumar",recordId:"F-001",field:"Bank account",oldValue:"XXXXXX4821",newValue:"XXXXXX7342",status:"Submitted",requestedBy:"Ravi Kumar · F-001",date:"25 Oct 2026",fpcId},
  {id:"PRO-002",name:"Sita Devi",recordId:"F-002",field:"Mobile number",oldValue:"97XXXX1202",newValue:"97XXXX8844",status:"Submitted",requestedBy:"Sita Devi · F-002",date:"26 Oct 2026",fpcId},
 ],
 userChangeRequests:[
  {id:"USR-CHG-001",name:"Add user · Accounts Assistant",recordId:"USR-010",field:"New sub-user",newUserName:"Accounts Assistant",newRole:"Accountant / Finance Officer",mobile:"97XXXX0003",newValue:"Finance data entry · Anita Das",status:"Submitted",requestedBy:"Anita Das",date:"25 Oct 2026",fpcId},
  {id:"USR-CHG-002",name:"Change role · Pooja Nayak",recordId:"USR-006",field:"Role change",oldValue:"Data Entry Operator",newValue:"Procurement / Purchase Officer",status:"Submitted",requestedBy:"Bijay Kumar Mohanty",date:"26 Oct 2026",fpcId},
 ],
};
export const initialDirectors: DirectorRecord[] = [
  { id: "DIR-001", srNo: 1, dinPan: "10615206", name: "ARJUN MARDI", designation: "Director", appointmentDate: "17/07/2024", cessationDate: "-", signatory: "Yes", fpcId },
  { id: "DIR-002", srNo: 2, dinPan: "10631120", name: "SUNARAM SOREN", designation: "Director", appointmentDate: "17/07/2024", cessationDate: "-", signatory: "Yes", fpcId },
  { id: "DIR-003", srNo: 3, dinPan: "10709317", name: "DHARJASINI SINGH SARDAR", designation: "Director", appointmentDate: "17/07/2024", cessationDate: "-", signatory: "Yes", fpcId },
  { id: "DIR-004", srNo: 4, dinPan: "10709318", name: "MISHRI LAL MAHATO", designation: "Director", appointmentDate: "17/07/2024", cessationDate: "-", signatory: "Yes", fpcId },
  { id: "DIR-005", srNo: 5, dinPan: "10709319", name: "SUMAN MINZ", designation: "Director", appointmentDate: "17/07/2024", cessationDate: "-", signatory: "Yes", fpcId },
];
export interface LicenseRecord {
  id: string;
  name: string;
  number: string;
  authority: string;
  issueDate: string;
  expiry: string;
  status: "Active" | "Expiring soon" | "Expired" | "Under Renewal" | string;
  category: "Statutory" | "Operational" | "Tax & Compliance" | string;
  documentName: string;
  fpcId?: string;
}

export const initialLicences: LicenseRecord[] = [
  { id: "LIC-001", name: "Certificate of Incorporation", number: "022984 · CIN: U46209JH2024PTC022984", authority: "Ministry of Corporate Affairs, ROC Jharkhand", issueDate: "17/07/2024", expiry: "Permanent", status: "Active", category: "Statutory", documentName: "certificate-of-incorporation.pdf", fpcId },
  { id: "LIC-002", name: "Memorandum & Articles of Association (MOA/AOA)", number: "MOA-AOA/2024/022984", authority: "Ministry of Corporate Affairs, ROC Jharkhand", issueDate: "17/07/2024", expiry: "Permanent", status: "Active", category: "Statutory", documentName: "moa-aoa-registered.pdf", fpcId },
  { id: "LIC-003", name: "Permanent Account Number (PAN)", number: "AAACU0229P", authority: "Income Tax Department, Govt of India", issueDate: "17/07/2024", expiry: "Permanent", status: "Active", category: "Tax & Compliance", documentName: "pan-card.pdf", fpcId },
  { id: "LIC-004", name: "Tax Deduction and Collection Account (TAN)", number: "RCHR02298P", authority: "Income Tax Department, Govt of India", issueDate: "19/07/2024", expiry: "Permanent", status: "Active", category: "Tax & Compliance", documentName: "tan-allotment.pdf", fpcId },
  { id: "LIC-005", name: "GST Registration Certificate (Form REG-06)", number: "20AAACU0229P1Z1", authority: "Goods and Services Tax Network (GSTN)", issueDate: "22/07/2024", expiry: "Permanent", status: "Active", category: "Tax & Compliance", documentName: "gst-registration.pdf", fpcId },
  { id: "LIC-006", name: "FSSAI Central Food Business License", number: "21426012345678", authority: "Food Safety and Standards Authority of India", issueDate: "22/07/2024", expiry: "21/07/2029", status: "Active", category: "Operational", documentName: "fssai-license.pdf", fpcId },
  { id: "LIC-007", name: "Wholesale Seed Dealer License", number: "SL/SER/2024/082", authority: "District Agriculture Office, Seraikela-Kharsawan", issueDate: "01/08/2024", expiry: "31/07/2027", status: "Active", category: "Operational", documentName: "seed-license.pdf", fpcId },
  { id: "LIC-008", name: "Retail Chemical & Bio-Fertilizer License", number: "FL/SER/2024/051", authority: "District Agriculture Office, Seraikela-Kharsawan", issueDate: "01/08/2024", expiry: "31/07/2027", status: "Active", category: "Operational", documentName: "fertilizer-license.pdf", fpcId },
];

export const initialBankAccounts: CompanyBankAccount[] = [
  {
    id: "BANK-001",
    bankName: "State Bank of India",
    accountHolderName: "Green Valley Farmer Producer Company Ltd.",
    accountNumber: "389201004821",
    accountType: "Current",
    ifscCode: "SBIN0001234",
    branchName: "Keonjhar",
    branchAddress: "Main Road, Keonjhar Sadar, Dist. Keonjhar, Odisha 758001",
    isPrimary: true,
    status: "Active",
    fpcId,
    createdAt: "14 Jun 2021",
  },
];
const seed: State = {
 role:null, memberId:"F-001", language:"English", offline:false,
 walletBalances:{"F-001":2277,"F-002":7000},walletTransactions,rateHistory,inputCatalog,inputOrders,saleRequests,certificates,
 records:{
  farmers, shareholders,
  purchases, sales,
  companyDirectors: initialDirectors,
  companyBankAccounts: initialBankAccounts,
  commodities:[
   {id:"COM-01",name:"Paddy (common)",hsn:"1006",baseUnit:"kg",purchaseRate:25,saleRate:30,stock:48500,threshold:5000,fpcId},
   {id:"COM-02",name:"Paddy (grade A)",hsn:"1006",baseUnit:"kg",purchaseRate:27,saleRate:32,stock:12000,threshold:3000,fpcId},
   {id:"COM-03",name:"Maize",hsn:"1005",baseUnit:"kg",purchaseRate:21,saleRate:24.5,stock:9300,threshold:5000,fpcId},
   {id:"COM-04",name:"Arhar (pigeon pea)",hsn:"0713",baseUnit:"kg",purchaseRate:72,saleRate:80,stock:2150,threshold:2500,fpcId},
   {id:"COM-05",name:"Ragi (finger millet)",hsn:"1008",baseUnit:"kg",purchaseRate:38,saleRate:45,stock:1800,threshold:1000,fpcId},
   {id:"COM-06",name:"Mustard",hsn:"1207",baseUnit:"kg",purchaseRate:58,saleRate:64,stock:3200,threshold:1200,fpcId}],
   buyers:buyerSeeds,
  users:[
   {id:"USR-001",name:"Bijay Kumar Mohanty",role:"FPC Admin / Manager",mobile:"98XXXX4412",status:"Active",lastLogin:"Today · 09:12",fpcId},
   {id:"USR-002",name:"Anita Das",role:"Accountant / Finance Officer",mobile:"97XXXX2210",status:"Active",lastLogin:"Today · 08:42",fpcId},
   {id:"USR-003",name:"Prakash Rout",role:"Procurement / Purchase Officer",mobile:"99XXXX7781",status:"Active",lastLogin:"Today · 08:31",fpcId},
   {id:"USR-004",name:"Mamata Jena",role:"Sales / Marketing Officer",mobile:"94XXXX5503",status:"Active",lastLogin:"Yesterday · 17:40",fpcId},
   {id:"USR-005",name:"Sanjay Tudu",role:"Inventory / Stock Manager",mobile:"91XXXX6094",status:"Active",lastLogin:"Today · 07:58",fpcId},
   {id:"USR-006",name:"Pooja Nayak",role:"Data Entry Operator",mobile:"93XXXX1187",status:"Active",lastLogin:"Today · 09:02",fpcId},
   {id:"USR-007",name:"Rakesh Hembram",role:"Compliance / Documentation Officer",mobile:"98XXXX3329",status:"Active",lastLogin:"Yesterday · 16:08",fpcId},
   {id:"USR-008",name:"Suman Naik",role:"Field Staff",mobile:"90XXXX8845",status:"Active",lastLogin:"Today · 08:15",fpcId},
   {id:"USR-009",name:"Dr. Ashok Panda",role:"Director / Board Member / Auditor",mobile:"98XXXX1002",status:"Active",lastLogin:"12 Oct 2026",fpcId},
  ],
  godowns:[{id:"GOD-01",name:"Main Godown Keonjhar",capacity:"500 tonne",used:61,location:"Keonjhar"},{id:"GOD-02",name:"Satellite Godown Pitamahal",capacity:"120 tonne",used:38,location:"Pitamahal"}],
   filings:[{id:"FIL-01",name:"AGM",due:"30 Sep 2026",status:"Filed · 21 Sep 2026",adminStatus:"Approved",filedBy:"Rakesh Hembram"},{id:"FIL-02",name:"Form AOC-4",due:"20 Oct 2026",status:"Filed",adminStatus:"Pending review",filedBy:"Rakesh Hembram"},{id:"FIL-03",name:"Form MGT-7A",due:"20 Nov 2026",status:"Due soon",filedBy:""},{id:"FIL-04",name:"Income tax return ITR-6",due:"31 Oct 2026",status:"Due soon",filedBy:""},{id:"FIL-05",name:"GST GSTR-3B · September",due:"20 Oct 2026",status:"Overdue",filedBy:""},{id:"FIL-06",name:"Statutory audit report",due:"15 Dec 2026",status:"Pending",filedBy:""}],
  fpcs:fpclist,
   expenses:[{id:"EXP-01",name:"Transport",amount:115000,status:"Approved"},{id:"EXP-02",name:"Godown rent",amount:60000,status:"Approved"},{id:"EXP-03",name:"Salaries",amount:120000,status:"Approved"},{id:"EXP-04",name:"Electricity",amount:25000,status:"Approved"},{id:"EXP-009",name:"Transport expense",amount:8400,status:"Submitted",submittedBy:"Pooja Nayak",date:"26 Oct 2026",fpcId}],
  payments:[{id:"PAY-0007",farmer:"Ravi Kumar",farmerId:"F-001",purchaseId:"PUR-2026-0001",amount:25000,date:"12 Oct 2026",method:"Bank transfer",reference:"UTIB2026101200451",status:"Paid"}],
   ledger:[{id:"LED-001",farmer:"Ravi Kumar",farmerId:"F-001",date:"12 Oct 2026",description:"Paddy purchase · PUR-2026-0001",debit:0,credit:25000,balance:25000},{id:"LED-002",farmer:"Ravi Kumar",farmerId:"F-001",date:"14 Oct 2026",description:"Bank transfer · UTIB2026101200451 · PAY-0007",debit:25000,credit:0,balance:0},...Array.from({length:58},(_,i)=>({id:`LED-${String(i+3).padStart(3,"0")}`,farmer:farmerSeeds[(i+1)%8][1],farmerId:farmerSeeds[(i+1)%8][0],date:`${String(2+(i%26)).padStart(2,"0")} ${["Nov 2025","Dec 2025","Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026","Jul 2026","Aug 2026","Sep 2026","Oct 2026"][i%12]}`,description:["Produce purchase","Bank transfer payment","Input credit recovery"][i%3],debit:i%3===0?12500:0,credit:i%3===1?12500:0,balance:0}))],
   meetings:[{id:"MTG-01",name:"Annual General Meeting",date:"21 Sep 2027 · 11:00 AM",venue:"Community Hall Green Valley",status:"Upcoming",note:"Annual accounts and audit report · board representatives · season procurement"} ,{id:"MTG-02",name:"Annual General Meeting",date:"21 Sep 2026",venue:"Community Hall Green Valley",status:"Completed",note:"One member, one vote"}],
  documents:[{id:"DOC-01",name:"Company incorporation certificate",category:"Incorporation",updated:"14 Jun 2021"},{id:"DOC-02",name:"SBI bank confirmation",category:"Bank",updated:"02 Aug 2026"}],
  messages:[{id:"MSG-01",title:"Payment of Rs 25,000 credited to your account",date:"12 Oct 2026",status:"Read"},{id:"MSG-02",title:"AGM notice: 21 Sep 2026, 11:00 AM, Community Hall Green Valley",date:"10 Sep 2026",status:"Delivered"},{id:"MSG-03",title:"Your KYC is rejected: Aadhaar photo is blurred. Please re-upload",date:"08 Sep 2026",status:"Delivered"}],
  baseline:Array.from({length:100},(_,i)=>{const crop=i<55?"Paddy":i<72?"Maize":i<82?"Pulses":i<91?"Vegetables":"Millet";const totals:Record<string,number>={Paddy:118,Maize:36,Pulses:22,Vegetables:18,Millet:20};const counts:Record<string,number>={Paddy:55,Maize:17,Pulses:10,Vegetables:9,Millet:9};const area=totals[crop]/counts[crop];return {id:`BL-${String(i+1).padStart(3,"0")}`,farmerId:`F-${String(i+1).padStart(3,"0")}`,farmer:farmerSeeds[i%8][1],name:farmerSeeds[i%8][1],village:["Green Valley","Pitamahal","Telkoi","Harichandanpur","Rugudi"][i%5],block:["Keonjhar Sadar","Harichandanpur","Telkoi","Patna"][i%4],district:"Keonjhar",area,landArea:area,crop,cropArea:area,season:["Kharif","Rabi","Summer"][i%3],production:Math.round(area*18),surplusKg:Math.round(area*820),livestock:i<41,dairy:i<27,ntfp:i<33,agroforestry:i<12,gender:i%2?"Female":"Male",category:["General","OBC","SC","ST"][i%4],completeness:i<8?72:92,fpcId};}),
  businessTransactions:[...businessSamples,...generatedBusiness],
   farmerApplications:[
    {id:"F-101",farmerId:"F-101",name:"Niranjan Munda",mobile:"9876504101",village:"Pitamahal",block:"Telkoi",land:"1.4 acres",crop:"Paddy",status:"Submitted",created:"26 Oct 2026",submittedBy:"Pooja Nayak",fpcId},
    {id:"F-102",farmerId:"F-102",name:"Sabitri Soren",mobile:"9876504102",village:"Rugudi",block:"Harichandanpur",land:"0.9 acres",crop:"Maize",status:"Submitted",created:"26 Oct 2026",submittedBy:"Pooja Nayak",fpcId},
   ],
   adjustments:[{id:"ADJ-009",item:"Arhar stock adjustment",itemType:"Produce",quantity:-5,unit:"kg",reason:"Cycle count correction",status:"Submitted",date:"26 Oct 2026",createdBy:"Sanjay Tudu",fpcId}],
   ...inboxSeeds,
   deletedFarmers:[],
   multiFpcLinks:[],
   advances:[{id:"ADV-001",farmerId:"F-002",farmer:"Sita Devi",balance:0,status:"Cleared",fpcId},{id:"ADV-002",farmerId:"F-010",farmer:"Test farmer",balance:0,status:"Cleared",fpcId}],
   licenseRecords: initialLicences,
  inventoryEvents:[
   {id:"MOV-PUR-2026-0001",date:"12 Oct 2026",inventory:"Produce",item:"Paddy common",type:"Purchase in",voucher:"PUR-2026-0001",party:"Ravi Kumar",quantityIn:1000,quantityOut:0,balance:49500,unit:"kg",rate:25,value:25000,fpcId},
   {id:"MOV-SAL-2026-0031",date:"20 Oct 2026",inventory:"Produce",item:"Paddy common",type:"Sale out",voucher:"SAL-2026-0031",party:"Shree Balaji Rice Mills",quantityIn:0,quantityOut:1000,balance:48500,unit:"kg",rate:30,value:30000,fpcId},
   {id:"MOV-PUR-IN-2026-0009",date:"10 Oct 2026",inventory:"Input",item:"DAP, Urea, seed, pesticide, vermicompost",type:"Purchase in",voucher:"PUR-IN-2026-0009",party:"Utkal Agro Inputs Pvt Ltd",quantityIn:1100,quantityOut:0,balance:1725,unit:"mixed",rate:50,value:241500,fpcId},
   {id:"MOV-INV-2026-0118",date:"18 Oct 2026",inventory:"Input",item:"DAP, seed, vermicompost",type:"Sale out",voucher:"INV-2026-0118",party:"Sita Devi",quantityIn:0,quantityOut:27,balance:1698,unit:"mixed",rate:111.1,value:3000,fpcId},
  ],
  transfers:[],
  farmerDrafts:[],
  shareholderDrafts:[],
  shareHistory:shareholders.map(s=>({id:`HIST-${s.id}`,uniqueId:s.id,member:s.name,type:"Initial allotment",shares:s.shares,capital:s.capital,date:s.admitted,certificate:s.certificate,fpcId})),
   suppliers:supplierSeeds,
 },
 audit:Array.from({length:82},(_,i)=>({id:`AUD-${String(i+1).padStart(3,"0")}`,actor:["Anita Das","Pooja Nayak","Bijay Kumar Mohanty","Rakesh Hembram"][i%4],role:["Accountant / Finance Officer","Data Entry Operator","FPC Admin / Manager","Compliance / Documentation Officer"][i%4],action:["approved payment PAY-0007","edited farmer F-014 mobile","rejected purchase PUR-2026-0023: rate above limit","updated filing record"][i%4],module:["Finance","Farmers","Purchases","Compliance"][i%4],record:["PAY-0007","F-014","PUR-2026-0023","FIL-05"][i%4],oldValue:["Submitted","98XXXX1100","Submitted · Rs 84,750","Overdue"][i%4],newValue:["Approved","98XXXX4412","Rejected · rate above limit","GSTR-3B September · follow-up"][i%4],date:`${String(1+i%28).padStart(2,"0")} Oct 2026 · ${String(9+i%8).padStart(2,"0")}:${String((i*13)%60).padStart(2,"0")}`,fpcId})),
 notifications:[{id:"NT-01",title:"3 purchase entries waiting for approval",date:"Today",status:"Unread"},{id:"NT-02",title:"Stock of Arhar is below threshold",date:"Today",status:"Unread"}],
 syncQueue:[{id:"SYNC-01",type:"Farmer registration",record:"New farmer · Pitamahal",status:"Pending sync"},{id:"SYNC-02",type:"Farmer registration",record:"New farmer · Telkoi",status:"Pending sync"},{id:"SYNC-03",type:"Baseline survey",record:"Kharif 2026 · Green Valley",status:"Pending sync"},{id:"SYNC-04",type:"Gallery photo",record:"Procurement drive",status:"Pending sync"},{id:"SYNC-05",type:"Farmer registration",record:"Mobile 98XXXX1234",status:"Failed",reason:"Duplicate mobile number"}],
};
for (const rows of Object.values(seed.records)) rows.forEach(row => { if (!row.fpcId) row.fpcId = fpcId; });
seed.audit.forEach(row => { if (!row.fpcId) row.fpcId = fpcId; });
seed.notifications.forEach(row => { if (!row.fpcId) row.fpcId = fpcId; });
seed.syncQueue.forEach(row => { if (!row.fpcId) row.fpcId = fpcId; });
const STORAGE_KEY="fpc-management-demo-v2";
const freshSeed=():State=>JSON.parse(JSON.stringify(seed)) as State;
const mergeRows=(baseRows:RecordRow[]=[],savedRows:RecordRow[]=[])=>{const savedById=new Map(savedRows.map(row=>[row.id,row]));const seedIds=new Set(baseRows.map(row=>row.id));return [...baseRows.map(row=>({...row,...(savedById.get(row.id)||{})})),...savedRows.filter(row=>!seedIds.has(row.id))]};
type DemoStore = {
 state: State;
 setState: (updater: State | ((state:State)=>State)) => void;
 resetDemo: () => void;
};
export const useDemoStore=create<DemoStore>()(withPersistence(
 (set)=>({
  state:freshSeed(),
  setState:(updater)=>set(({state})=>({state:typeof updater==="function"?updater(state):updater})),
  resetDemo:()=>set({state:freshSeed()}),
 }),
  {name:STORAGE_KEY,partialize:(value)=>({state:value.state}),merge:(persisted,current)=>{
   const saved=(persisted as {state?:Partial<State>}|undefined)?.state;
   if(!saved)return current;
   const base=freshSeed(), savedRecords=saved.records||{}, records={...base.records,...savedRecords};
   for(const [key,rows] of Object.entries(base.records))records[key]=mergeRows(rows,savedRecords[key]||[]);
   const merged={...base,...saved,records};
   for(const key of ["certificates","walletTransactions","rateHistory","inputCatalog","inputOrders","saleRequests","audit","notifications","syncQueue"] as const){
    merged[key]=mergeRows(base[key] as RecordRow[],(saved[key] as RecordRow[]|undefined)||[]);
   }
   return {...current,state:merged};
  }}
));
export function money(n: number) { return `Rs ${Math.round(n).toLocaleString("en-IN")}`; }
export function convert(value:number,from:string,to:string) {
 const measures:Record<string,{factor:number;category:string}>={g:{factor:.001,category:"weight"},kg:{factor:1,category:"weight"},quintal:{factor:100,category:"weight"},tonne:{factor:1000,category:"weight"},bag:{factor:50,category:"weight"},mL:{factor:.001,category:"volume"},litre:{factor:1,category:"volume"},nos:{factor:1,category:"count"},dozen:{factor:12,category:"count"},acre:{factor:1,category:"land"},hectare:{factor:2.47105,category:"land"},guntha:{factor:.025,category:"land"},cent:{factor:.01,category:"land"}};
 if(!measures[from]||!measures[to]) throw new Error(`Unknown unit: ${!measures[from]?from:to}`);
 if(measures[from].category!==measures[to].category) throw new Error(`Cannot convert ${from} to ${to}: these units use different measurement categories.`);
 return value*measures[from].factor/measures[to].factor;
}
