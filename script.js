"use strict";

const STORAGE_KEY = "khayyatBusinessCalculatorV3";
const LEGACY_KEYS = ["khayyatBusinessCalculatorV1"];

const defaultState = {
  screen:"dashboard",

  annualRent:0,
  electricityMonthly:0,
  waterMonthly:0,
  internetMonthly:0,
  licenseAnnual:0,
  insuranceAnnual:0,
  marketingMonthly:0,
  maintenanceMonthly:0,
  otherFixedMonthly:0,
  workingDays:26,

  customOverheads:[],

  fixedStaff:[],
  pieceStaff:[],

  visaCount:0,
  visaCostEach:0,
  visaCycleYears:2,

  taqaCost:0,
  kandurasPerTaqa:0,
  fabricWastePercent:0,

  variableCosts:[
    {id:"accessories",name:"Buttons / Accessories",amount:0},
    {id:"packaging",name:"Packaging",amount:0}
  ],

  sellingPrice:0,
  plannedUnits:0,
  targetProfit:0
};

let state = loadState();
let saveTimer = null;
let toastTimer = null;
const $ = id => document.getElementById(id);

const simpleFields = [
  "annualRent","electricityMonthly","waterMonthly","internetMonthly","licenseAnnual","insuranceAnnual",
  "marketingMonthly","maintenanceMonthly","otherFixedMonthly","workingDays",
  "visaCount","visaCostEach","visaCycleYears","taqaCost","kandurasPerTaqa","fabricWastePercent",
  "sellingPrice","plannedUnits","targetProfit"
];

init();

function clone(v){return JSON.parse(JSON.stringify(v))}
function num(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n:0}
function money(v){return new Intl.NumberFormat("en-AE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v))+" AED"}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function ceilSafe(v){return Number.isFinite(v)&&v>0?Math.ceil(v):0}

function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw) return normalizeState(JSON.parse(raw));

    // Try to migrate basic values from older calculator version.
    for(const key of LEGACY_KEYS){
      const legacyRaw=localStorage.getItem(key);
      if(!legacyRaw) continue;
      const old=JSON.parse(legacyRaw);
      const migrated=clone(defaultState);
      [
        "screen","annualRent","electricityMonthly","waterMonthly","internetMonthly","licenseAnnual","insuranceAnnual",
        "marketingMonthly","maintenanceMonthly","otherFixedMonthly","workingDays","taqaCost","kandurasPerTaqa",
        "fabricWastePercent","sellingPrice","plannedUnits","targetProfit"
      ].forEach(k=>{if(old[k]!==undefined)migrated[k]=old[k]});

      if(Array.isArray(old.customOverheads)) migrated.customOverheads=old.customOverheads;
      if(Array.isArray(old.employees)){
        migrated.fixedStaff=old.employees.map(e=>({
          id:e.id||uid(),role:e.role||"Fixed Staff",count:num(e.count),salary:num(e.salary)
        }));
      }
      if(old.visaCostPerEmployee!==undefined) migrated.visaCostEach=num(old.visaCostPerEmployee);
      if(old.visaCycleYears!==undefined) migrated.visaCycleYears=num(old.visaCycleYears)||2;

      migrated.pieceStaff=[];
      if(num(old.tailorLaborPerKandura)>0){
        migrated.pieceStaff.push({id:uid(),role:"Tailor Labor",rate:num(old.tailorLaborPerKandura)});
      }
      if(num(old.otherLaborPerKandura)>0){
        migrated.pieceStaff.push({id:uid(),role:"Other Labor",rate:num(old.otherLaborPerKandura)});
      }

      migrated.variableCosts=[
        {id:"accessories",name:"Buttons / Accessories",amount:num(old.accessoriesPerKandura)},
        {id:"packaging",name:"Packaging",amount:num(old.packagingPerKandura)}
      ];
      if(num(old.otherVariablePerKandura)>0){
        migrated.variableCosts.push({id:uid(),name:"Other Variable Cost",amount:num(old.otherVariablePerKandura)});
      }
      localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
      return normalizeState(migrated);
    }
  }catch(e){}
  return clone(defaultState);
}

function normalizeState(data){
  const s={...clone(defaultState),...data};
  s.customOverheads=Array.isArray(data.customOverheads)?data.customOverheads:[];
  s.fixedStaff=Array.isArray(data.fixedStaff)?data.fixedStaff:[];
  s.pieceStaff=Array.isArray(data.pieceStaff)?data.pieceStaff:[];
  s.variableCosts=Array.isArray(data.variableCosts)?data.variableCosts:clone(defaultState.variableCosts);
  return s;
}
function saveState(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  setSaveStatus(true);
}
function markDirty(){
  setSaveStatus(false);
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveState,350);
}
function setSaveStatus(saved){
  const strip=document.querySelector(".save-strip");
  if(strip)strip.classList.toggle("dirty",!saved);
  if($("saveStatus"))$("saveStatus").textContent=saved?"Saved on this device":"Saving changes...";
}

function init(){
  bindTabs();
  bindSimpleFields();
  bindDynamicActions();
  renderAll();
  saveState();
}

function bindTabs(){
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      state.screen=btn.dataset.screen;
      markDirty();
      renderScreens();
    });
  });
}

function bindSimpleFields(){
  simpleFields.forEach(id=>{
    const el=$(id);
    if(!el)return;
    const update=()=>{
      state[id]=num(el.value);
      markDirty();
      renderCalculatedOnly();
    };
    el.addEventListener("input",update);
    el.addEventListener("change",update);
  });
}

function bindDynamicActions(){
  $("saveNowBtn").onclick=()=>{saveState();toast("Saved · تم الحفظ");};

  $("addOverheadBtn").onclick=()=>{
    state.customOverheads.push({id:uid(),name:"Other Fixed Cost",monthly:0});
    saveState();
    renderDynamicLists();
    renderCalculatedOnly();
    toast("Fixed cost row added · تمت إضافة تكلفة ثابتة");
  };

  $("addFixedStaffBtn").onclick=()=>{
    state.fixedStaff.push({id:uid(),role:"Fixed Staff",count:1,salary:0});
    saveState();
    renderDynamicLists();
    renderCalculatedOnly();
    toast("Fixed staff row added · تمت إضافة موظف براتب ثابت");
  };

  $("addPieceStaffBtn").onclick=()=>{
    state.pieceStaff.push({id:uid(),role:"Tailor / Labor",rate:0});
    saveState();
    renderDynamicLists();
    renderCalculatedOnly();
    toast("Per-kandura labor row added · تمت إضافة عامل لكل كندورة");
  };

  $("addVariableBtn").onclick=()=>{
    state.variableCosts.push({id:uid(),name:"Other Variable Cost",amount:0});
    saveState();
    renderDynamicLists();
    renderCalculatedOnly();
    toast("Variable cost row added · تمت إضافة تكلفة متغيرة");
  };

  $("customOverheads").addEventListener("input",dynamicInput);
  $("customOverheads").addEventListener("change",dynamicInput);
  $("customOverheads").addEventListener("click",dynamicDelete);

  $("fixedStaffList").addEventListener("input",dynamicInput);
  $("fixedStaffList").addEventListener("change",dynamicInput);
  $("fixedStaffList").addEventListener("click",dynamicDelete);

  $("pieceStaffList").addEventListener("input",dynamicInput);
  $("pieceStaffList").addEventListener("change",dynamicInput);
  $("pieceStaffList").addEventListener("click",dynamicDelete);

  $("variableCosts").addEventListener("input",dynamicInput);
  $("variableCosts").addEventListener("change",dynamicInput);
  $("variableCosts").addEventListener("click",dynamicDelete);

  $("exportBtn").onclick=exportBackup;
  $("importFile").onchange=importBackup;
  $("resetBtn").onclick=()=>$("confirmModal").classList.remove("hidden");
  $("cancelReset").onclick=()=>$("confirmModal").classList.add("hidden");
  $("confirmReset").onclick=()=>{
    state=clone(defaultState);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    $("confirmModal").classList.add("hidden");
    renderAll();
    toast("All inputs reset · تم مسح جميع المدخلات");
  };
}

function dynamicInput(e){
  const row=e.target.closest("[data-kind]");
  if(!row)return;

  const kind=row.dataset.kind;
  const id=row.dataset.id;
  const list=state[kind];
  if(!Array.isArray(list))return;

  const item=list.find(x=>String(x.id)===String(id));
  if(!item)return;

  const field=e.target.dataset.field;
  if(!field)return;

  if(["count","salary","rate","monthly","amount"].includes(field)){
    item[field]=num(e.target.value);
  }else{
    item[field]=e.target.value;
  }

  markDirty();
  renderCalculatedOnly();
}

function dynamicDelete(e){
  const btn=e.target.closest("[data-delete]");
  if(!btn)return;

  const row=btn.closest("[data-kind]");
  if(!row)return;

  const kind=row.dataset.kind;
  const id=row.dataset.id;
  if(!Array.isArray(state[kind]))return;

  state[kind]=state[kind].filter(x=>String(x.id)!==String(id));
  saveState();
  renderDynamicLists();
  renderCalculatedOnly();
  toast("Row deleted · تم حذف السطر");
}

function calc(){
  const rentMonthly=num(state.annualRent)/12;
  const licenseMonthly=num(state.licenseAnnual)/12;
  const insuranceMonthly=num(state.insuranceAnnual)/12;

  const customFixed=state.customOverheads.reduce((s,x)=>s+num(x.monthly),0);
  const fixedSalary=state.fixedStaff.reduce((s,x)=>s+num(x.count)*num(x.salary),0);

  const visaMonthly=num(state.visaCycleYears)>0
    ? num(state.visaCount)*num(state.visaCostEach)/(12*num(state.visaCycleYears))
    : 0;

  const shopFixedOther=
    num(state.electricityMonthly)+num(state.waterMonthly)+num(state.internetMonthly)+
    num(state.marketingMonthly)+num(state.maintenanceMonthly)+num(state.otherFixedMonthly)+
    rentMonthly+licenseMonthly+insuranceMonthly+customFixed;

  const fixedMonthly=shopFixedOther+fixedSalary+visaMonthly;

  const rawFabric=num(state.kandurasPerTaqa)>0 ? num(state.taqaCost)/num(state.kandurasPerTaqa) : 0;
  const fabricPerUnit=rawFabric*(1+num(state.fabricWastePercent)/100);

  const pieceLaborPerUnit=state.pieceStaff.reduce((s,x)=>s+num(x.rate),0);
  const otherVariablePerUnit=state.variableCosts.reduce((s,x)=>s+num(x.amount),0);
  const variablePerUnit=fabricPerUnit+pieceLaborPerUnit+otherVariablePerUnit;

  const sellingPrice=num(state.sellingPrice);
  const contribution=sellingPrice-variablePerUnit;

  const plannedUnits=num(state.plannedUnits);
  const fixedPerUnit=plannedUnits>0?fixedMonthly/plannedUnits:0;
  const fullCostPerUnit=plannedUnits>0?variablePerUnit+fixedPerUnit:variablePerUnit;
  const profitPerUnitAtPlan=plannedUnits>0?sellingPrice-fullCostPerUnit:0;

  const revenue=plannedUnits*sellingPrice;
  const totalVariable=plannedUnits*variablePerUnit;
  const totalCost=fixedMonthly+totalVariable;
  const net=revenue-totalCost;

  const breakEvenUnits=contribution>0?fixedMonthly/contribution:Infinity;
  const targetProfitUnits=contribution>0?(fixedMonthly+num(state.targetProfit))/contribution:Infinity;

  const zeroPriceAtPlan=plannedUnits>0?variablePerUnit+fixedMonthly/plannedUnits:0;
  const targetPriceAtPlan=plannedUnits>0?variablePerUnit+(fixedMonthly+num(state.targetProfit))/plannedUnits:0;

  return {
    rentMonthly,licenseMonthly,insuranceMonthly,customFixed,fixedSalary,visaMonthly,shopFixedOther,fixedMonthly,
    rawFabric,fabricPerUnit,pieceLaborPerUnit,otherVariablePerUnit,variablePerUnit,
    sellingPrice,contribution,plannedUnits,fixedPerUnit,fullCostPerUnit,profitPerUnitAtPlan,
    revenue,totalVariable,totalCost,net,breakEvenUnits,targetProfitUnits,zeroPriceAtPlan,targetPriceAtPlan
  };
}

function renderAll(){
  renderScreens();
  syncSimpleInputs();
  renderDynamicLists();
  renderCalculatedOnly();
  setSaveStatus(true);
}

function renderScreens(){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.screen===state.screen));
  $(`${state.screen}Screen`)?.classList.add("active");
}
function syncSimpleInputs(){
  simpleFields.forEach(id=>{
    const el=$(id);
    if(el && document.activeElement!==el) el.value=state[id];
  });
}
function renderDynamicLists(){
  $("customOverheads").innerHTML=state.customOverheads.length
    ? state.customOverheads.map(x=>`
      <div class="entry-row simple-row" data-kind="customOverheads" data-id="${x.id}">
        <label class="wide">Cost Name · اسم التكلفة
          <input data-field="name" value="${escapeHtml(x.name)}">
        </label>
        <label>Monthly Amount · المبلغ الشهري
          <div class="money-field">
            <input data-field="monthly" type="number" min="0" step="10" value="${num(x.monthly)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No custom fixed costs added · لم تتم إضافة تكاليف ثابتة إضافية.</p>';

  $("fixedStaffList").innerHTML=state.fixedStaff.length
    ? state.fixedStaff.map(x=>`
      <div class="entry-row staff-row" data-kind="fixedStaff" data-id="${x.id}">
        <label class="wide">Job Title · المسمى الوظيفي
          <input data-field="role" value="${escapeHtml(x.role)}" placeholder="e.g. Manager · مدير">
        </label>
        <label>Quantity · العدد
          <input data-field="count" type="number" min="0" step="1" value="${num(x.count)}">
        </label>
        <label>Salary / Person · راتب الشخص
          <div class="money-field">
            <input data-field="salary" type="number" min="0" step="100" value="${num(x.salary)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No fixed-salary staff added · لم تتم إضافة موظفين برواتب ثابتة.</p>';

  $("pieceStaffList").innerHTML=state.pieceStaff.length
    ? state.pieceStaff.map(x=>`
      <div class="entry-row simple-row" data-kind="pieceStaff" data-id="${x.id}">
        <label class="wide">Labor Role · نوع العامل
          <input data-field="role" value="${escapeHtml(x.role)}" placeholder="e.g. Tailor · خياط">
        </label>
        <label>Pay / Kandura · الأجر لكل كندورة
          <div class="money-field">
            <input data-field="rate" type="number" min="0" step="1" value="${num(x.rate)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No per-kandura labor added · لم تتم إضافة عمالة محسوبة لكل كندورة.</p>';

  $("variableCosts").innerHTML=state.variableCosts.length
    ? state.variableCosts.map(x=>`
      <div class="entry-row simple-row" data-kind="variableCosts" data-id="${x.id}">
        <label class="wide">Variable Cost Name · اسم التكلفة المتغيرة
          <input data-field="name" value="${escapeHtml(x.name)}">
        </label>
        <label>Cost / Kandura · تكلفة لكل كندورة
          <div class="money-field">
            <input data-field="amount" type="number" min="0" step="1" value="${num(x.amount)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No extra variable costs added · لم تتم إضافة تكاليف متغيرة إضافية.</p>';
}

function renderCalculatedOnly(){
  const c=calc();
  renderDashboard(c);
  renderStaff(c);
  renderKandura(c);
  renderTargets(c);
}

function renderDashboard(c){
  $("dashFixed").textContent=money(c.fixedMonthly);
  $("dashVariable").textContent=money(c.variablePerUnit);
  $("dashFullCost").textContent=money(c.fullCostPerUnit);
  $("dashProfitUnit").textContent=money(c.profitPerUnitAtPlan);
  $("dashProfitUnit").style.color=c.profitPerUnitAtPlan>=0?"var(--green)":"var(--red)";

  $("dashBreakEven").textContent=Number.isFinite(c.breakEvenUnits)?ceilSafe(c.breakEvenUnits):"—";
  $("dashBreakEvenDaily").textContent=Number.isFinite(c.breakEvenUnits)&&num(state.workingDays)>0?(c.breakEvenUnits/num(state.workingDays)).toFixed(1):"—";
  $("dashTargetUnits").textContent=Number.isFinite(c.targetProfitUnits)?ceilSafe(c.targetProfitUnits):"—";
  $("dashPriceNeeded").textContent=money(c.targetPriceAtPlan);

  $("dashUnits").textContent=Math.round(c.plannedUnits);
  $("dashRevenue").textContent=money(c.revenue);
  $("dashTotalVariable").textContent=money(c.totalVariable);
  $("dashFixed2").textContent=money(c.fixedMonthly);
  $("dashTotalCost").textContent=money(c.totalCost);
  $("dashNet").textContent=money(c.net);
  $("dashNet").style.color=c.net>=0?"var(--green)":"var(--red)";

  const badge=$("statusBadge");
  badge.className="status-badge";
  if(c.sellingPrice<=0){
    $("statusTitle").textContent="Enter a selling price · أدخل سعر البيع";
    $("statusText").textContent="All costs are still calculated, but break-even requires a selling price. · يتم حساب جميع التكاليف، لكن نقطة التعادل تحتاج إلى سعر بيع.";
    badge.textContent="Need price · أدخل السعر";badge.classList.add("neutral");
  }else if(c.contribution<=0){
    $("statusTitle").textContent="Selling price does not cover variable cost · سعر البيع لا يغطي التكلفة المتغيرة";
    $("statusText").textContent=`Variable cost is ${money(c.variablePerUnit)} per kandura, above or equal to the selling price.`;
    badge.textContent="No break-even · لا يوجد تعادل";badge.classList.add("bad");
  }else if(c.plannedUnits>0 && c.net>=0){
    $("statusTitle").textContent="Planned model is profitable · الخطة الحالية مربحة";
    $("statusText").textContent=`At ${Math.round(c.plannedUnits)} kanduras/month, estimated net profit is ${money(c.net)}.`;
    badge.textContent="Profitable · مربح";badge.classList.add("good");
  }else{
    $("statusTitle").textContent="Model calculated · تم حساب النموذج";
    $("statusText").textContent=`Break-even is about ${ceilSafe(c.breakEvenUnits)} kanduras per month at ${money(c.sellingPrice)} selling price.`;
    badge.textContent="Calculated · محسوب";badge.classList.add("neutral");
  }

  const rows=[
    ["Fabric · القماش",c.fabricPerUnit],
    ["Per-kandura labor · عمالة لكل كندورة",c.pieceLaborPerUnit],
    ["Other variable · تكاليف متغيرة أخرى",c.otherVariablePerUnit],
    ["Allocated fixed overhead · حصة المصاريف الثابتة",c.fixedPerUnit]
  ];
  const max=Math.max(...rows.map(x=>x[1]),1);
  $("unitCostBreakdown").innerHTML=rows.map(([name,v])=>`
    <div class="bar-row">
      <div class="bar-label"><b>${escapeHtml(name)}</b><span>${money(v)}</span></div>
      <div class="bar-track"><div class="bar-fill brown" style="width:${v/max*100}%"></div></div>
    </div>`).join("");
}

function renderStaff(c){
  $("visaProvisionView").textContent=money(c.visaMonthly);
  $("staffFixedMonthlyView").textContent=money(c.fixedSalary);
  $("staffVisaMonthlyView").textContent=money(c.visaMonthly);
  $("staffPieceUnitView").textContent=money(c.pieceLaborPerUnit);
  $("shopFixedTotal").textContent=money(c.fixedMonthly);
}

function renderKandura(c){
  $("fabricUnitView").textContent=money(c.fabricPerUnit);
  $("pieceLaborUnitView").textContent=money(c.pieceLaborPerUnit);
  $("otherVariableUnitView").textContent=money(c.otherVariablePerUnit);
  $("variableUnitView").textContent=money(c.variablePerUnit);
  $("fixedUnitView").textContent=money(c.fixedPerUnit);
  $("fullUnitView").textContent=money(c.fullCostPerUnit);
  $("sellingPriceView").textContent=money(c.sellingPrice);
  $("profitUnitView").textContent=money(c.profitPerUnitAtPlan);
  $("profitUnitView").style.color=c.profitPerUnitAtPlan>=0?"var(--green)":"var(--red)";
}

function renderTargets(c){
  $("targetSellingPrice").textContent=money(c.sellingPrice);
  $("targetContribution").textContent=money(c.contribution);
  $("targetContribution").style.color=c.contribution>0?"var(--green)":"var(--red)";
  $("targetBreakEvenUnits").textContent=Number.isFinite(c.breakEvenUnits)?ceilSafe(c.breakEvenUnits):"—";
  $("targetProfitUnits").textContent=Number.isFinite(c.targetProfitUnits)?ceilSafe(c.targetProfitUnits):"—";
  $("zeroPriceAtPlan").textContent=money(c.zeroPriceAtPlan);
  $("targetPriceAtPlan").textContent=money(c.targetPriceAtPlan);
  $("dailyBreakEvenTarget").textContent=Number.isFinite(c.breakEvenUnits)&&num(state.workingDays)>0?(c.breakEvenUnits/num(state.workingDays)).toFixed(1):"—";
  $("dailyTargetProfit").textContent=Number.isFinite(c.targetProfitUnits)&&num(state.workingDays)>0?(c.targetProfitUnits/num(state.workingDays)).toFixed(1):"—";

  renderQuantityScenarios(c);
  renderPriceScenarios(c);
}

function renderQuantityScenarios(c){
  const be=Number.isFinite(c.breakEvenUnits)?c.breakEvenUnits:0;
  const center=Math.max(num(state.plannedUnits),be,50);
  const step=Math.max(10,Math.round(center/5/10)*10||10);
  const units=[];
  for(let i=-3;i<=4;i++){
    const u=Math.max(0,Math.round((center+i*step)/10)*10);
    if(!units.includes(u))units.push(u);
  }
  units.sort((a,b)=>a-b);

  $("quantityScenarios").innerHTML=`<div class="table-wrap"><table class="scenario-table">
    <thead><tr><th>Kanduras · الكندورات</th><th>Revenue · الإيرادات</th><th>Total Variable · إجمالي المتغير</th><th>Fixed · الثابت</th><th>Net Profit · صافي الربح</th></tr></thead>
    <tbody>${units.map(u=>{
      const revenue=u*c.sellingPrice;
      const variable=u*c.variablePerUnit;
      const net=revenue-variable-c.fixedMonthly;
      return `<tr><td><b>${u}</b></td><td>${money(revenue)}</td><td>${money(variable)}</td><td>${money(c.fixedMonthly)}</td><td class="${net>=0?"profit-positive":"profit-negative"}">${money(net)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
}

function renderPriceScenarios(c){
  const price=c.sellingPrice;
  const steps=[-50,-25,0,25,50].map(d=>Math.max(0,price+d));
  $("priceScenarios").innerHTML=`<div class="table-wrap"><table class="scenario-table">
    <thead><tr><th>Price · السعر</th><th>Contribution / Unit · هامش المساهمة</th><th>Break-even Units · كمية التعادل</th><th>Net at Planned Qty · الصافي عند الكمية المخططة</th></tr></thead>
    <tbody>${steps.map(p=>{
      const contribution=p-c.variablePerUnit;
      const be=contribution>0?Math.ceil(c.fixedMonthly/contribution):null;
      const net=c.plannedUnits*contribution-c.fixedMonthly;
      return `<tr><td><b>${money(p)}</b></td><td>${money(contribution)}</td><td>${be??"—"}</td><td class="${net>=0?"profit-positive":"profit-negative"}">${money(net)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
}

function exportBackup(){
  saveState();
  const payload={app:"Khayyat Business Calculator",version:3,exportedAt:new Date().toISOString(),state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`khayyat-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast("Backup exported.");
}
async function importBackup(e){
  const f=e.target.files?.[0];if(!f)return;
  try{
    const parsed=JSON.parse(await f.text());
    state=normalizeState(parsed.state||parsed);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    renderAll();
    toast("Backup restored.");
  }catch(err){toast("Invalid backup file.");}
  e.target.value="";
}
function toast(msg){
  clearTimeout(toastTimer);
  $("toast").textContent=msg;$("toast").classList.add("show");
  toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2300);
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));
}
