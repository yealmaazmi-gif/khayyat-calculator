"use strict";
const STORAGE_KEY="khayyatBusinessCalculatorV7";
const DEFAULT={
  screen:"dashboard",
  annualRent:0,electricityMonthly:0,waterMonthly:0,internetMonthly:0,licenseAnnual:0,insuranceAnnual:0,
  marketingMonthly:0,maintenanceMonthly:0,accountingMonthly:0,softwareMonthly:0,consumablesMonthly:0,
  staffSupportMonthly:0,otherFixedMonthly:0,workingDays:26,extraFixedCosts:[],
  fixedStaff:[],pieceStaff:[],visaCount:0,visaCostEach:0,visaCycleYears:2,
  fabrics:[
    {id:"f1",name:"Fabric 1 · قماش 1",taqaCost:0,kandurasPerTaqa:0,wastePercent:0,isMain:true},
    {id:"f2",name:"Fabric 2 · قماش 2",taqaCost:0,kandurasPerTaqa:0,wastePercent:0,isMain:false}
  ],
  variableCosts:[
    {id:"buttons",name:"Buttons / Accessories · أزرار / إكسسوارات",amount:0},
    {id:"packaging",name:"Packaging · التغليف",amount:0},
    {id:"embroidery",name:"Embroidery · التطريز",amount:0}
  ],
  paymentFeePercent:0,reworkPerKandura:0,pressingPerKandura:0,deliveryPerKandura:0,
  sellingPrice:0,plannedUnits:0,targetProfit:0,
  products:[
    {id:"shirt",category:"Shirt · قميص",name:"Shirt · قميص",sellingPrice:0,costPerUnit:0,plannedQty:0},
    {id:"shoes",category:"Shoes · أحذية",name:"Shoes · أحذية",sellingPrice:0,costPerUnit:0,plannedQty:0}
  ]
};
let state=loadState(),saveTimer=null,toastTimer=null;
const $=id=>document.getElementById(id);
const simpleFields=["annualRent","electricityMonthly","waterMonthly","internetMonthly","licenseAnnual","insuranceAnnual","marketingMonthly","maintenanceMonthly","accountingMonthly","softwareMonthly","consumablesMonthly","staffSupportMonthly","otherFixedMonthly","workingDays","visaCount","visaCostEach","visaCycleYears","paymentFeePercent","reworkPerKandura","pressingPerKandura","deliveryPerKandura","sellingPrice","plannedUnits","targetProfit"];
init();
function clone(v){return JSON.parse(JSON.stringify(v))}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}
function num(v){if(v===null||v===undefined||v==="")return 0;const n=Number(v);return Number.isFinite(n)?Math.max(0,n):0}
function money(v){const n=Number(v);return Number.isFinite(n)?new Intl.NumberFormat("en-AE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+" AED":"—"}
function ceilSafe(v){return Number.isFinite(v)&&v>=0?Math.ceil(v):null}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function loadState(){try{
  const r=localStorage.getItem(STORAGE_KEY);
  if(r)return normalize(JSON.parse(r));
  const old=localStorage.getItem("khayyatBusinessCalculatorV6");
  if(old){
    const v6=JSON.parse(old),m=clone(DEFAULT);
    ["screen","annualRent","electricityMonthly","waterMonthly","internetMonthly","licenseAnnual","insuranceAnnual","marketingMonthly","maintenanceMonthly","otherFixedMonthly","workingDays","visaCount","visaCostEach","visaCycleYears","sellingPrice","plannedUnits","targetProfit"].forEach(k=>{if(v6[k]!==undefined)m[k]=v6[k]});
    m.extraFixedCosts=Array.isArray(v6.extraFixedCosts)?v6.extraFixedCosts:[];
    m.fixedStaff=Array.isArray(v6.fixedStaff)?v6.fixedStaff:[];
    m.pieceStaff=Array.isArray(v6.pieceStaff)?v6.pieceStaff:[];
    m.variableCosts=Array.isArray(v6.variableCosts)?v6.variableCosts:clone(DEFAULT.variableCosts);
    if(v6.fabricName||v6.taqaCost||v6.kandurasPerTaqa){m.fabrics[0]={id:"f1",name:v6.fabricName||"Fabric 1 · قماش 1",taqaCost:num(v6.taqaCost),kandurasPerTaqa:num(v6.kandurasPerTaqa),wastePercent:num(v6.fabricWastePercent),isMain:true}}
    localStorage.setItem(STORAGE_KEY,JSON.stringify(m));
    return normalize(m);
  }
  return clone(DEFAULT);
}catch(e){return clone(DEFAULT)}}
function normalize(d){const s={...clone(DEFAULT),...d};["extraFixedCosts","fixedStaff","pieceStaff","fabrics","variableCosts","products"].forEach(k=>s[k]=Array.isArray(d[k])?d[k]:clone(DEFAULT[k]));if(!s.fabrics.some(f=>f.isMain)&&s.fabrics.length)s.fabrics[0].isMain=true;return s}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setSaveStatus(true)}
function markDirty(){setSaveStatus(false);clearTimeout(saveTimer);saveTimer=setTimeout(saveState,300)}
function setSaveStatus(saved){document.querySelector(".save-strip")?.classList.toggle("dirty",!saved);$("saveStatus").textContent=saved?"Saved on this device · محفوظ على هذا الجهاز":"Saving changes... · جاري الحفظ"}
function init(){bindTabs();bindSimple();bindButtons();bindDynamic();renderAll();saveState()}
function bindTabs(){document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{state.screen=b.dataset.screen;markDirty();renderScreens()})}
function bindSimple(){simpleFields.forEach(id=>{const el=$(id);if(!el)return;const fn=()=>{state[id]=num(el.value);markDirty();renderCalculated()};el.addEventListener("input",fn);el.addEventListener("change",fn)})}
function bindButtons(){
  $("saveNowBtn").onclick=()=>{saveState();toast("Saved · تم الحفظ")};
  $("addFixedCostBtn").onclick=()=>addRow("extraFixedCosts",{id:uid(),name:"Other Fixed Cost · تكلفة ثابتة أخرى",monthly:0});
  $("addFixedStaffBtn").onclick=()=>addRow("fixedStaff",{id:uid(),jobTitle:"Manager · مدير",quantity:1,salaryMonthly:0});
  $("addPieceStaffBtn").onclick=()=>addRow("pieceStaff",{id:uid(),jobTitle:"Tailor · خياط",quantity:1,ratePerKandura:0});
  $("addFabricBtn").onclick=()=>addRow("fabrics",{id:uid(),name:`Fabric ${state.fabrics.length+1} · قماش ${state.fabrics.length+1}`,taqaCost:0,kandurasPerTaqa:0,wastePercent:0,isMain:state.fabrics.length===0});
  $("addVariableCostBtn").onclick=()=>addRow("variableCosts",{id:uid(),name:"Other Variable Cost · تكلفة متغيرة أخرى",amount:0});
  $("addProductBtn").onclick=()=>addRow("products",{id:uid(),category:"Other · أخرى",name:"New Product · منتج جديد",sellingPrice:0,costPerUnit:0,plannedQty:0});
  $("exportBtn").onclick=exportBackup;$("importFile").onchange=importBackup;
  $("resetBtn").onclick=()=>$("confirmModal").classList.remove("hidden");$("cancelReset").onclick=()=>$("confirmModal").classList.add("hidden");
  $("confirmReset").onclick=()=>{state=clone(DEFAULT);localStorage.setItem(STORAGE_KEY,JSON.stringify(state));$("confirmModal").classList.add("hidden");renderAll();toast("Reset · تم المسح")};
}
function addRow(k,row){state[k].push(row);saveState();renderDynamicLists();renderCalculated()}
function bindDynamic(){["extraFixedCosts","fixedStaffList","pieceStaffList","fabricList","variableCostList","productList"].forEach(id=>{const el=$(id);el.addEventListener("input",dynamicInput);el.addEventListener("change",dynamicInput);el.addEventListener("click",dynamicClick)})}
function dynamicInput(e){const row=e.target.closest("[data-list][data-id]");if(!row)return;const list=state[row.dataset.list],item=list?.find(x=>String(x.id)===String(row.dataset.id));if(!item)return;const f=e.target.dataset.field;if(!f)return;if(f==="isMain"){if(e.target.checked)state.fabrics.forEach(x=>x.isMain=String(x.id)===String(item.id));}else if(["monthly","quantity","salaryMonthly","ratePerKandura","taqaCost","kandurasPerTaqa","wastePercent","amount","sellingPrice","costPerUnit","plannedQty"].includes(f))item[f]=num(e.target.value);else item[f]=e.target.value;markDirty();renderCalculated();if(f==="isMain")renderDynamicLists()}
function dynamicClick(e){const b=e.target.closest("[data-delete]");if(!b)return;const row=b.closest("[data-list][data-id]");if(!row)return;const k=row.dataset.list;state[k]=state[k].filter(x=>String(x.id)!==String(row.dataset.id));if(k==="fabrics"&&state.fabrics.length&&!state.fabrics.some(f=>f.isMain))state.fabrics[0].isMain=true;saveState();renderDynamicLists();renderCalculated()}
function fabricUnitCost(f){const base=num(f.kandurasPerTaqa)>0?num(f.taqaCost)/num(f.kandurasPerTaqa):0;return base*(1+num(f.wastePercent)/100)}
function mainFabric(){return state.fabrics.find(f=>f.isMain)||state.fabrics[0]||{name:"—",taqaCost:0,kandurasPerTaqa:0,wastePercent:0}}
function calc(){
  const fixedBase=num(state.annualRent)/12+num(state.electricityMonthly)+num(state.waterMonthly)+num(state.internetMonthly)+num(state.licenseAnnual)/12+num(state.insuranceAnnual)/12+num(state.marketingMonthly)+num(state.maintenanceMonthly)+num(state.accountingMonthly)+num(state.softwareMonthly)+num(state.consumablesMonthly)+num(state.staffSupportMonthly)+num(state.otherFixedMonthly)+state.extraFixedCosts.reduce((s,x)=>s+num(x.monthly),0);
  const fixedSalary=state.fixedStaff.reduce((s,x)=>s+num(x.quantity)*num(x.salaryMonthly),0);
  const visaMonthly=num(state.visaCycleYears)>0?num(state.visaCount)*num(state.visaCostEach)/(12*num(state.visaCycleYears)):0;
  const fixedMonthly=fixedBase+fixedSalary+visaMonthly;
  const mf=mainFabric(),fabricCost=fabricUnitCost(mf),laborPerUnit=state.pieceStaff.reduce((s,x)=>s+num(x.quantity)*num(x.ratePerKandura),0);
  const listedVar=state.variableCosts.reduce((s,x)=>s+num(x.amount),0),paymentFee=num(state.sellingPrice)*num(state.paymentFeePercent)/100;
  const otherVar=listedVar+num(state.reworkPerKandura)+num(state.pressingPerKandura)+num(state.deliveryPerKandura)+paymentFee;
  const kanduraVariable=fabricCost+laborPerUnit+otherVar,kanduraContribution=num(state.sellingPrice)-kanduraVariable;
  const products=state.products.map(p=>{const contributionUnit=num(p.sellingPrice)-num(p.costPerUnit),monthlyContribution=contributionUnit*num(p.plannedQty);return {...p,contributionUnit,monthlyContribution,revenue:num(p.sellingPrice)*num(p.plannedQty),cost:num(p.costPerUnit)*num(p.plannedQty)}});
  const otherContribution=products.reduce((s,p)=>s+p.monthlyContribution,0),remainingFixed=Math.max(0,fixedMonthly-otherContribution);
  const breakEvenKanduras=kanduraContribution>0?remainingFixed/kanduraContribution:Infinity,targetKanduras=kanduraContribution>0?(remainingFixed+num(state.targetProfit))/kanduraContribution:Infinity;
  const plannedK=num(state.plannedUnits),kanduraContributionMonthly=plannedK*kanduraContribution,plannedNet=kanduraContributionMonthly+otherContribution-fixedMonthly;
  return {fixedMonthly,fixedSalary,visaMonthly,mf,fabricCost,laborPerUnit,otherVar,kanduraVariable,kanduraContribution,products,otherContribution,remainingFixed,breakEvenKanduras,targetKanduras,plannedK,kanduraContributionMonthly,plannedNet};
}
function renderAll(){renderScreens();syncSimple();renderDynamicLists();renderCalculated();setSaveStatus(true)}
function renderScreens(){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.screen===state.screen));$(`${state.screen}Screen`)?.classList.add("active")}
function syncSimple(){simpleFields.forEach(id=>{const el=$(id);if(el&&document.activeElement!==el)el.value=state[id]})}
function renderDynamicLists(){
  $("extraFixedCosts").innerHTML=state.extraFixedCosts.length?state.extraFixedCosts.map(x=>`<div class="entry-row simple-row" data-list="extraFixedCosts" data-id="${x.id}"><label class="wide">Cost Name · اسم التكلفة<input data-field="name" value="${esc(x.name)}"></label><label>Monthly Cost · التكلفة الشهرية<div class="money-field"><input data-field="monthly" type="number" min="0" value="${num(x.monthly)}"><span>AED</span></div></label><button class="delete-btn" data-delete="1">×</button></div>`).join(""):'<p class="helper">No extra costs · لا توجد تكاليف إضافية.</p>';
  $("fixedStaffList").innerHTML=state.fixedStaff.length?state.fixedStaff.map(x=>`<div class="entry-row fixed-staff-row" data-list="fixedStaff" data-id="${x.id}"><label class="wide">Job Title · المسمى<input data-field="jobTitle" value="${esc(x.jobTitle)}"></label><label>Quantity · العدد<input data-field="quantity" type="number" min="0" value="${num(x.quantity)}"></label><label>Salary / Person · راتب الشخص<div class="money-field"><input data-field="salaryMonthly" type="number" min="0" value="${num(x.salaryMonthly)}"><span>AED</span></div></label><button class="delete-btn" data-delete="1">×</button></div>`).join(""):'<p class="helper">No fixed staff · لا يوجد موظفون ثابتون.</p>';
  $("pieceStaffList").innerHTML=state.pieceStaff.length?state.pieceStaff.map(x=>`<div class="entry-row piece-row" data-list="pieceStaff" data-id="${x.id}"><label class="wide">Labor Role · نوع العامل<input data-field="jobTitle" value="${esc(x.jobTitle)}"></label><label>Quantity · العدد<input data-field="quantity" type="number" min="0" value="${num(x.quantity)}"></label><label>Pay / Kandura / Worker · الأجر لكل كندورة<div class="money-field"><input data-field="ratePerKandura" type="number" min="0" value="${num(x.ratePerKandura)}"><span>AED</span></div></label><button class="delete-btn" data-delete="1">×</button></div>`).join(""):'<p class="helper">No per-kandura labor · لا توجد عمالة لكل كندورة.</p>';
  $("fabricList").innerHTML=state.fabrics.length?state.fabrics.map(f=>`<div class="entry-row fabric-row" data-list="fabrics" data-id="${f.id}"><label class="wide">Fabric / Taqa Name · اسم القماش<input data-field="name" value="${esc(f.name)}"></label><label>Taqa Cost · سعر الطاقة<div class="money-field"><input data-field="taqaCost" type="number" min="0" value="${num(f.taqaCost)}"><span>AED</span></div></label><label>Kanduras / Taqa · كندورات / طاقة<input data-field="kandurasPerTaqa" type="number" min="0" step="0.1" value="${num(f.kandurasPerTaqa)}"></label><label>Waste % · هدر %<div class="percent-field"><input data-field="wastePercent" type="number" min="0" value="${num(f.wastePercent)}"><span>%</span></div></label><label class="select-main"><input data-field="isMain" type="radio" name="mainFabric" ${f.isMain?"checked":""}>Main · أساسي</label><button class="delete-btn" data-delete="1">×</button></div>`).join(""):'<p class="helper">Add a fabric · أضف قماشاً.</p>';
  $("variableCostList").innerHTML=state.variableCosts.length?state.variableCosts.map(x=>`<div class="entry-row simple-row" data-list="variableCosts" data-id="${x.id}"><label class="wide">Variable Cost · التكلفة المتغيرة<input data-field="name" value="${esc(x.name)}"></label><label>Cost / Kandura · التكلفة للكندورة<div class="money-field"><input data-field="amount" type="number" min="0" value="${num(x.amount)}"><span>AED</span></div></label><button class="delete-btn" data-delete="1">×</button></div>`).join(""):'<p class="helper">No extra variable costs · لا توجد تكاليف متغيرة إضافية.</p>';
  $("productList").innerHTML=state.products.length?state.products.map(p=>`<div class="entry-row product-row" data-list="products" data-id="${p.id}"><label>Type · النوع<input data-field="category" value="${esc(p.category)}"></label><label class="wide">Product Name · اسم المنتج<input data-field="name" value="${esc(p.name)}"></label><label>Selling Price · سعر البيع<div class="money-field"><input data-field="sellingPrice" type="number" min="0" value="${num(p.sellingPrice)}"><span>AED</span></div></label><label>Cost / Unit · التكلفة للوحدة<div class="money-field"><input data-field="costPerUnit" type="number" min="0" value="${num(p.costPerUnit)}"><span>AED</span></div></label><label>Qty / Month · الكمية شهرياً<input data-field="plannedQty" type="number" min="0" value="${num(p.plannedQty)}"></label><button class="delete-btn" data-delete="1">×</button></div>`).join(""):'<p class="helper">No other products · لا توجد منتجات أخرى.</p>';
}
function renderCalculated(){const c=calc();
  $("fixedLiveTotal").textContent=money(c.fixedMonthly);$("visaMonthlyLive").textContent=money(c.visaMonthly);$("fixedSalaryLive").textContent=money(c.fixedSalary);$("visaCostLive").textContent=money(c.visaMonthly);$("pieceLaborLive").textContent=money(c.laborPerUnit);
  $("fabricCostLive").textContent=money(c.fabricCost);$("laborCostLive").textContent=money(c.laborPerUnit);$("otherVariableLive").textContent=money(c.otherVar);$("variableCostLive").textContent=money(c.kanduraVariable);
  $("dashFixedMonthly").textContent=money(c.fixedMonthly);$("dashVariableUnit").textContent=money(c.kanduraVariable);$("dashOtherContribution").textContent=money(c.otherContribution);
  $("mainBreakEvenUnits").textContent=Number.isFinite(c.breakEvenKanduras)?ceilSafe(c.breakEvenKanduras):"—";$("formulaFixed").textContent=money(c.fixedMonthly);$("formulaOtherContribution").textContent=money(c.otherContribution);$("formulaRemainingFixed").textContent=money(c.remainingFixed);$("formulaContribution").textContent=money(c.kanduraContribution);$("formulaBreakEven").textContent=Number.isFinite(c.breakEvenKanduras)?`${ceilSafe(c.breakEvenKanduras)} Kanduras / Month · كندورة / شهر`:"Not possible · غير ممكن";
  if(num(state.sellingPrice)<=0)$("breakEvenExplanation").textContent="Enter the Kandura selling price. All saved costs are included. · أدخل سعر بيع الكندورة.";else if(c.kanduraContribution<=0)$("breakEvenExplanation").textContent=`Variable cost is ${money(c.kanduraVariable)}; selling price does not create positive contribution. · سعر البيع لا يغطي التكلفة المتغيرة.`;else $("breakEvenExplanation").textContent=`Other products contribute ${money(c.otherContribution)} per month. Remaining fixed cost is ${money(c.remainingFixed)}. Each Kandura contributes ${money(c.kanduraContribution)}, so you need at least ${ceilSafe(c.breakEvenKanduras)} Kanduras/month for net zero. · تحتاج إلى ${ceilSafe(c.breakEvenKanduras)} كندورة شهرياً للوصول إلى التعادل.`;
  $("salesContribution").textContent=money(c.kanduraContribution);$("salesOtherContribution").textContent=money(c.otherContribution);$("salesBreakEven").textContent=Number.isFinite(c.breakEvenKanduras)?ceilSafe(c.breakEvenKanduras):"—";$("salesNetAtPlan").textContent=money(c.plannedNet);$("salesNetAtPlan").style.color=c.plannedNet>=0?"var(--green)":"var(--red)";
  renderFabricScenarios(c);renderQuantityScenario(c);renderOldDashboardFields(c);
}
function renderOldDashboardFields(c){
  const map={dashBreakEvenUnits:Number.isFinite(c.breakEvenKanduras)?ceilSafe(c.breakEvenKanduras):"—",dashBreakEvenDaily:Number.isFinite(c.breakEvenKanduras)&&num(state.workingDays)>0?(c.breakEvenKanduras/num(state.workingDays)).toFixed(1):"—",dashSellingPrice:money(state.sellingPrice),dashContribution:money(c.kanduraContribution),dashPlannedUnits:Math.round(c.plannedK),dashFullCostUnit:c.plannedK>0?money(c.kanduraVariable+c.fixedMonthly/c.plannedK):"—",dashProfitUnit:c.plannedK>0?money(num(state.sellingPrice)-(c.kanduraVariable+c.fixedMonthly/c.plannedK)):"—",dashMonthlyNet:money(c.plannedNet),dashZeroUnits:Number.isFinite(c.breakEvenKanduras)?ceilSafe(c.breakEvenKanduras):"—",dashTargetUnits:Number.isFinite(c.targetKanduras)?ceilSafe(c.targetKanduras):"—",dashZeroPrice:c.plannedK>0?money(c.kanduraVariable+c.remainingFixed/c.plannedK):"—",dashTargetPrice:c.plannedK>0?money(c.kanduraVariable+(c.remainingFixed+num(state.targetProfit))/c.plannedK):"—"};Object.entries(map).forEach(([id,v])=>{if($(id))$(id).textContent=v});
  const bars=[["Fabric · القماش",c.fabricCost],["Per-Kandura Labor · العمالة",c.laborPerUnit],["Other Variable · متغيرات أخرى",c.otherVar],["Fixed Allocation · حصة الثابت",c.plannedK>0?c.fixedMonthly/c.plannedK:0]],max=Math.max(...bars.map(x=>x[1]),1);if($("unitCostBars"))$("unitCostBars").innerHTML=bars.map(([n,v])=>`<div class="bar-row"><div class="bar-label"><b>${n}</b><span>${money(v)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div></div>`).join("");
  if($("statusTitle")){if(c.kanduraContribution<=0){$("statusTitle").textContent="Selling price is too low · سعر البيع منخفض";$("statusBadge").className="status-badge bad";$("statusBadge").textContent="No break-even · لا يوجد تعادل"}else{$("statusTitle").textContent="Model calculated · تم حساب النموذج";$("statusBadge").className="status-badge good";$("statusBadge").textContent="Calculated · محسوب"}$("statusText").textContent=$("breakEvenExplanation").textContent}
}
function renderFabricScenarios(c){if(!state.fabrics.length){$("fabricScenarioTable").innerHTML="";return}$("fabricScenarioTable").innerHTML=`<div class="table-wrap"><table class="scenario-table"><thead><tr><th>Fabric · القماش</th><th>Fabric Cost · تكلفة القماش</th><th>Variable Cost · التكلفة المتغيرة</th><th>Contribution · المساهمة</th><th>Break-even · التعادل</th></tr></thead><tbody>${state.fabrics.map(f=>{const fc=fabricUnitCost(f),variable=fc+c.laborPerUnit+c.otherVar,cont=num(state.sellingPrice)-variable,be=cont>0?c.remainingFixed/cont:Infinity;return `<tr><td><b>${esc(f.name)}${f.isMain?" ★":""}</b></td><td>${money(fc)}</td><td>${money(variable)}</td><td class="${cont>0?"profit-positive":"profit-negative"}">${money(cont)}</td><td>${Number.isFinite(be)?ceilSafe(be):"—"}</td></tr>`}).join("")}</tbody></table></div>`}
function renderQuantityScenario(c){const base=Math.max(10,Number.isFinite(c.breakEvenKanduras)?Math.ceil(c.breakEvenKanduras):0,c.plannedK),step=Math.max(10,Math.ceil(base/5/10)*10),units=[];for(let i=-3;i<=4;i++){const u=Math.max(0,Math.round((base+i*step)/10)*10);if(!units.includes(u))units.push(u)}units.sort((a,b)=>a-b);$("quantityScenarioTable").innerHTML=`<div class="table-wrap"><table class="scenario-table"><thead><tr><th>Kanduras · الكندورات</th><th>Kandura Contribution · مساهمة الكندورة</th><th>Other Products · منتجات أخرى</th><th>Fixed OPEX · المصاريف الثابتة</th><th>Net Profit · صافي الربح</th></tr></thead><tbody>${units.map(u=>{const kc=u*c.kanduraContribution,net=kc+c.otherContribution-c.fixedMonthly;return `<tr><td><b>${u}</b></td><td>${money(kc)}</td><td>${money(c.otherContribution)}</td><td>${money(c.fixedMonthly)}</td><td class="${net>=0?"profit-positive":"profit-negative"}">${money(net)}</td></tr>`}).join("")}</tbody></table></div>`}
function exportBackup(){saveState();const p={app:"Khayyat Business Calculator",version:7,exportedAt:new Date().toISOString(),state},blob=new Blob([JSON.stringify(p,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`khayyat-v7-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Backup exported · تم التصدير")}
async function importBackup(e){const f=e.target.files?.[0];if(!f)return;try{const p=JSON.parse(await f.text());state=normalize(p.state||p);localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll();toast("Backup restored · تمت الاستعادة")}catch(err){toast("Invalid backup · ملف غير صالح")}e.target.value=""}
function toast(msg){clearTimeout(toastTimer);$("toast").textContent=msg;$("toast").classList.add("show");toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2200)}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));
