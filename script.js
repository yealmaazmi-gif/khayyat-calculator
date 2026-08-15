"use strict";

const STORAGE_KEY = "khayyatBusinessCalculatorV6";

const DEFAULT = {
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
  extraFixedCosts:[],

  fixedStaff:[],
  pieceStaff:[],

  visaCount:0,
  visaCostEach:0,
  visaCycleYears:2,

  fabricName:"",
  taqaCost:0,
  kandurasPerTaqa:0,
  fabricWastePercent:0,
  variableCosts:[
    {id:"buttons",name:"Buttons / Accessories · أزرار / إكسسوارات",amount:0},
    {id:"packaging",name:"Packaging · التغليف",amount:0}
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
  "visaCount","visaCostEach","visaCycleYears",
  "fabricName","taqaCost","kandurasPerTaqa","fabricWastePercent",
  "sellingPrice","plannedUnits","targetProfit"
];

init();

function clone(v){return JSON.parse(JSON.stringify(v))}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}
function num(v){
  if(v===null || v===undefined || v==="") return 0;
  const n=Number(v);
  return Number.isFinite(n) ? Math.max(0,n) : 0;
}
function money(v){
  const n=Number(v);
  if(!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-AE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+" AED";
}
function ceilSafe(v){return Number.isFinite(v)&&v>=0?Math.ceil(v):null}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return clone(DEFAULT);
    return normalize(JSON.parse(raw));
  }catch(e){
    return clone(DEFAULT);
  }
}
function normalize(data){
  const s={...clone(DEFAULT),...data};
  s.extraFixedCosts=Array.isArray(data.extraFixedCosts)?data.extraFixedCosts:[];
  s.fixedStaff=Array.isArray(data.fixedStaff)?data.fixedStaff:[];
  s.pieceStaff=Array.isArray(data.pieceStaff)?data.pieceStaff:[];
  s.variableCosts=Array.isArray(data.variableCosts)?data.variableCosts:clone(DEFAULT.variableCosts);
  return s;
}
function saveState(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  setSaveStatus(true);
}
function markDirty(){
  setSaveStatus(false);
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveState,300);
}
function setSaveStatus(saved){
  const strip=document.querySelector(".save-strip");
  if(strip) strip.classList.toggle("dirty",!saved);
  $("saveStatus").textContent=saved
    ? "Saved on this device · محفوظ على هذا الجهاز"
    : "Saving changes... · جاري الحفظ";
}

function init(){
  bindTabs();
  bindSimpleFields();
  bindButtons();
  bindDynamicLists();
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
      state[id]=(id==="fabricName")?el.value:num(el.value);
      markDirty();
      renderCalculated();
    };
    el.addEventListener("input",update);
    el.addEventListener("change",update);
  });
}

function bindButtons(){
  $("saveNowBtn").onclick=()=>{saveState();toast("Saved · تم الحفظ");};

  $("addFixedCostBtn").onclick=()=>{
    state.extraFixedCosts.push({id:uid(),name:"Other Fixed Cost · تكلفة ثابتة أخرى",monthly:0});
    saveState();renderDynamicLists();renderCalculated();
    toast("Fixed cost added · تمت إضافة تكلفة ثابتة");
  };

  $("addFixedStaffBtn").onclick=()=>{
    state.fixedStaff.push({id:uid(),jobTitle:"Manager · مدير",quantity:1,salaryMonthly:0});
    saveState();renderDynamicLists();renderCalculated();
    toast("Fixed staff added · تمت إضافة موظف ثابت");
  };

  $("addPieceStaffBtn").onclick=()=>{
    state.pieceStaff.push({id:uid(),jobTitle:"Tailor · خياط",quantity:1,ratePerKandura:0});
    saveState();renderDynamicLists();renderCalculated();
    toast("Per-kandura labor added · تمت إضافة عامل لكل كندورة");
  };

  $("addVariableCostBtn").onclick=()=>{
    state.variableCosts.push({id:uid(),name:"Other Variable Cost · تكلفة متغيرة أخرى",amount:0});
    saveState();renderDynamicLists();renderCalculated();
    toast("Variable cost added · تمت إضافة تكلفة متغيرة");
  };

  $("exportBtn").onclick=exportBackup;
  $("importFile").onchange=importBackup;

  $("resetBtn").onclick=()=>$("confirmModal").classList.remove("hidden");
  $("cancelReset").onclick=()=>$("confirmModal").classList.add("hidden");
  $("confirmReset").onclick=()=>{
    state=clone(DEFAULT);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    $("confirmModal").classList.add("hidden");
    renderAll();
    toast("All inputs reset · تم مسح جميع المدخلات");
  };
}

function bindDynamicLists(){
  ["extraFixedCosts","fixedStaffList","pieceStaffList","variableCostList"].forEach(id=>{
    const el=$(id);
    el.addEventListener("input",handleDynamicInput);
    el.addEventListener("change",handleDynamicInput);
    el.addEventListener("click",handleDynamicDelete);
  });
}

function handleDynamicInput(e){
  const row=e.target.closest("[data-list][data-id]");
  if(!row)return;
  const listName=row.dataset.list;
  const id=row.dataset.id;
  const list=state[listName];
  if(!Array.isArray(list))return;
  const item=list.find(x=>String(x.id)===String(id));
  if(!item)return;
  const field=e.target.dataset.field;
  if(!field)return;

  if(["monthly","quantity","salaryMonthly","ratePerKandura","amount"].includes(field)){
    item[field]=num(e.target.value);
  }else{
    item[field]=e.target.value;
  }
  markDirty();
  renderCalculated();
}

function handleDynamicDelete(e){
  const btn=e.target.closest("[data-delete]");
  if(!btn)return;
  const row=btn.closest("[data-list][data-id]");
  if(!row)return;
  const listName=row.dataset.list;
  state[listName]=state[listName].filter(x=>String(x.id)!==String(row.dataset.id));
  saveState();
  renderDynamicLists();
  renderCalculated();
}

function calc(){
  // FIXED SHOP COSTS
  const rentMonthly=num(state.annualRent)/12;
  const licenseMonthly=num(state.licenseAnnual)/12;
  const insuranceMonthly=num(state.insuranceAnnual)/12;
  const extraFixedMonthly=state.extraFixedCosts.reduce((s,x)=>s+num(x.monthly),0);

  const shopFixedMonthly =
    rentMonthly +
    num(state.electricityMonthly) +
    num(state.waterMonthly) +
    num(state.internetMonthly) +
    licenseMonthly +
    insuranceMonthly +
    num(state.marketingMonthly) +
    num(state.maintenanceMonthly) +
    num(state.otherFixedMonthly) +
    extraFixedMonthly;

  // FIXED SALARY STAFF
  const fixedSalaryMonthly=state.fixedStaff.reduce(
    (s,x)=>s+num(x.quantity)*num(x.salaryMonthly),0
  );

  // VISA PROVISION
  const visaMonthly =
    num(state.visaCycleYears)>0
      ? num(state.visaCount)*num(state.visaCostEach)/(12*num(state.visaCycleYears))
      : 0;

  const totalFixedMonthly=shopFixedMonthly+fixedSalaryMonthly+visaMonthly;

  // FABRIC
  const baseFabricPerUnit =
    num(state.kandurasPerTaqa)>0
      ? num(state.taqaCost)/num(state.kandurasPerTaqa)
      : 0;
  const fabricPerUnit=baseFabricPerUnit*(1+num(state.fabricWastePercent)/100);

  // PER-KANDURA LABOR
  const pieceLaborPerUnit=state.pieceStaff.reduce(
    (s,x)=>s+num(x.quantity)*num(x.ratePerKandura),0
  );

  // OTHER VARIABLE
  const otherVariablePerUnit=state.variableCosts.reduce(
    (s,x)=>s+num(x.amount),0
  );

  const variableCostPerUnit=fabricPerUnit+pieceLaborPerUnit+otherVariablePerUnit;

  // SALES
  const sellingPrice=num(state.sellingPrice);
  const contributionPerUnit=sellingPrice-variableCostPerUnit;

  const plannedUnits=num(state.plannedUnits);
  const fixedCostPerUnitAtPlan=plannedUnits>0?totalFixedMonthly/plannedUnits:null;
  const fullCostPerUnitAtPlan=plannedUnits>0?variableCostPerUnit+fixedCostPerUnitAtPlan:null;
  const profitPerUnitAtPlan=plannedUnits>0?sellingPrice-fullCostPerUnitAtPlan:null;

  const monthlyRevenue=plannedUnits*sellingPrice;
  const monthlyVariableCost=plannedUnits*variableCostPerUnit;
  const monthlyTotalCost=totalFixedMonthly+monthlyVariableCost;
  const monthlyNetProfit=monthlyRevenue-monthlyTotalCost;

  const breakEvenUnits=contributionPerUnit>0?totalFixedMonthly/contributionPerUnit:Infinity;
  const targetProfitUnits=contributionPerUnit>0?(totalFixedMonthly+num(state.targetProfit))/contributionPerUnit:Infinity;

  const zeroPriceAtPlanned=plannedUnits>0?variableCostPerUnit+totalFixedMonthly/plannedUnits:null;
  const targetPriceAtPlanned=plannedUnits>0?variableCostPerUnit+(totalFixedMonthly+num(state.targetProfit))/plannedUnits:null;

  return {
    rentMonthly,licenseMonthly,insuranceMonthly,extraFixedMonthly,
    shopFixedMonthly,fixedSalaryMonthly,visaMonthly,totalFixedMonthly,
    baseFabricPerUnit,fabricPerUnit,pieceLaborPerUnit,otherVariablePerUnit,variableCostPerUnit,
    sellingPrice,contributionPerUnit,plannedUnits,fixedCostPerUnitAtPlan,fullCostPerUnitAtPlan,profitPerUnitAtPlan,
    monthlyRevenue,monthlyVariableCost,monthlyTotalCost,monthlyNetProfit,
    breakEvenUnits,targetProfitUnits,zeroPriceAtPlanned,targetPriceAtPlanned
  };
}

function renderAll(){
  renderScreens();
  syncSimpleInputs();
  renderDynamicLists();
  renderCalculated();
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
  $("extraFixedCosts").innerHTML=state.extraFixedCosts.length
    ? state.extraFixedCosts.map(x=>`
      <div class="entry-row simple-row" data-list="extraFixedCosts" data-id="${x.id}">
        <label class="wide">Cost Name · اسم التكلفة
          <input data-field="name" value="${esc(x.name)}">
        </label>
        <label>Monthly Cost · التكلفة الشهرية
          <div class="money-field">
            <input data-field="monthly" type="number" min="0" step="10" value="${num(x.monthly)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No extra fixed costs added · لا توجد تكاليف ثابتة إضافية.</p>';

  $("fixedStaffList").innerHTML=state.fixedStaff.length
    ? state.fixedStaff.map(x=>`
      <div class="entry-row fixed-staff-row" data-list="fixedStaff" data-id="${x.id}">
        <label class="wide">Job Title · المسمى الوظيفي
          <input data-field="jobTitle" value="${esc(x.jobTitle)}" placeholder="Manager · مدير">
        </label>
        <label>Quantity · العدد
          <input data-field="quantity" type="number" min="0" step="1" value="${num(x.quantity)}">
        </label>
        <label>Salary / Person / Month · راتب الشخص شهرياً
          <div class="money-field">
            <input data-field="salaryMonthly" type="number" min="0" step="100" value="${num(x.salaryMonthly)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No fixed-salary staff added · لا يوجد موظفون برواتب ثابتة.</p>';

  $("pieceStaffList").innerHTML=state.pieceStaff.length
    ? state.pieceStaff.map(x=>`
      <div class="entry-row piece-row" data-list="pieceStaff" data-id="${x.id}">
        <label class="wide">Labor / Job Title · نوع العامل / المسمى
          <input data-field="jobTitle" value="${esc(x.jobTitle)}" placeholder="Tailor · خياط">
        </label>
        <label>Quantity · العدد
          <input data-field="quantity" type="number" min="0" step="1" value="${num(x.quantity)}">
        </label>
        <label>Pay / Kandura / Worker · الأجر لكل كندورة لكل عامل
          <div class="money-field">
            <input data-field="ratePerKandura" type="number" min="0" step="1" value="${num(x.ratePerKandura)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No per-kandura labor added · لا توجد عمالة محسوبة لكل كندورة.</p>';

  $("variableCostList").innerHTML=state.variableCosts.length
    ? state.variableCosts.map(x=>`
      <div class="entry-row simple-row" data-list="variableCosts" data-id="${x.id}">
        <label class="wide">Variable Cost Name · اسم التكلفة المتغيرة
          <input data-field="name" value="${esc(x.name)}">
        </label>
        <label>Cost / Kandura · التكلفة لكل كندورة
          <div class="money-field">
            <input data-field="amount" type="number" min="0" step="1" value="${num(x.amount)}">
            <span>AED</span>
          </div>
        </label>
        <button class="delete-btn" data-delete="1" title="Delete · حذف">×</button>
      </div>`).join("")
    : '<p class="helper">No variable costs added · لا توجد تكاليف متغيرة إضافية.</p>';
}

function renderCalculated(){
  const c=calc();
  renderFixed(c);
  renderStaff(c);
  renderFabric(c);
  renderSales(c);
  renderDashboard(c);
}

function renderFixed(c){
  $("fixedLiveTotal").textContent=money(c.totalFixedMonthly);

  const rows=[
    ["Rent / Month · الإيجار شهرياً",c.rentMonthly],
    ["Utilities & Phone · الخدمات والهاتف",num(state.electricityMonthly)+num(state.waterMonthly)+num(state.internetMonthly)],
    ["License + Insurance / Month · الرخصة والتأمين شهرياً",c.licenseMonthly+c.insuranceMonthly],
    ["Marketing + Maintenance · التسويق والصيانة",num(state.marketingMonthly)+num(state.maintenanceMonthly)],
    ["Other Fixed + Custom · ثابت أخرى + مخصصة",num(state.otherFixedMonthly)+c.extraFixedMonthly],
    ["Fixed Salaries · الرواتب الثابتة",c.fixedSalaryMonthly],
    ["Visa Provision · مخصص التأشيرات",c.visaMonthly]
  ];

  $("fixedBreakdown").innerHTML=rows.map(([name,v])=>
    `<div><span>${name}</span><strong>${money(v)}</strong></div>`
  ).join("");
}

function renderStaff(c){
  $("visaMonthlyLive").textContent=money(c.visaMonthly);
  $("fixedSalaryLive").textContent=money(c.fixedSalaryMonthly);
  $("visaCostLive").textContent=money(c.visaMonthly);
  $("pieceLaborLive").textContent=money(c.pieceLaborPerUnit);
}

function renderFabric(c){
  $("fabricCostLive").textContent=money(c.fabricPerUnit);
  $("laborCostLive").textContent=money(c.pieceLaborPerUnit);
  $("otherVariableLive").textContent=money(c.otherVariablePerUnit);
  $("variableCostLive").textContent=money(c.variableCostPerUnit);
}

function renderSales(c){
  $("salesContribution").textContent=money(c.contributionPerUnit);
  $("salesContribution").style.color=c.contributionPerUnit>0?"var(--green)":"var(--red)";
  $("salesBreakEven").textContent=Number.isFinite(c.breakEvenUnits)?ceilSafe(c.breakEvenUnits):"—";
  $("salesTargetUnits").textContent=Number.isFinite(c.targetProfitUnits)?ceilSafe(c.targetProfitUnits):"—";
  $("salesNetAtPlan").textContent=money(c.monthlyNetProfit);
  $("salesNetAtPlan").style.color=c.monthlyNetProfit>=0?"var(--green)":"var(--red)";
  renderScenarioTable(c);
}

function renderDashboard(c){
  $("dashFixedMonthly").textContent=money(c.totalFixedMonthly);
  $("dashVariableUnit").textContent=money(c.variableCostPerUnit);

  $("mainBreakEvenUnits").textContent=Number.isFinite(c.breakEvenUnits)?ceilSafe(c.breakEvenUnits):"—";
  $("formulaFixed").textContent=money(c.totalFixedMonthly);
  $("formulaPrice").textContent=money(c.sellingPrice);
  $("formulaVariable").textContent=money(c.variableCostPerUnit);
  $("formulaContribution").textContent=money(c.contributionPerUnit);
  $("formulaBreakEven").textContent=Number.isFinite(c.breakEvenUnits)
    ? `${ceilSafe(c.breakEvenUnits)} Kanduras / Month · كندورة / شهر`
    : "Not possible at this price · غير ممكن بهذا السعر";

  if(c.sellingPrice<=0){
    $("breakEvenExplanation").textContent="Enter the selling price per kandura. All entered costs are already included in the calculation. · أدخل سعر بيع الكندورة، وجميع التكاليف المدخلة محسوبة.";
  }else if(c.contributionPerUnit<=0){
    $("breakEvenExplanation").textContent=`Selling price ${money(c.sellingPrice)} does not cover the variable cost ${money(c.variableCostPerUnit)}. Increase the price or reduce variable cost. · سعر البيع لا يغطي التكلفة المتغيرة.`;
  }else{
    $("breakEvenExplanation").textContent=`At ${money(c.sellingPrice)} selling price, each kandura contributes ${money(c.contributionPerUnit)} toward fixed monthly costs of ${money(c.totalFixedMonthly)}. You must sell at least ${ceilSafe(c.breakEvenUnits)} kanduras per month to reach net zero. · يجب بيع ${ceilSafe(c.breakEvenUnits)} كندورة على الأقل شهرياً للوصول إلى نقطة التعادل.`;
  }
  $("dashBreakEvenUnits").textContent=Number.isFinite(c.breakEvenUnits)?ceilSafe(c.breakEvenUnits):"—";
  $("dashBreakEvenDaily").textContent=
    Number.isFinite(c.breakEvenUnits)&&num(state.workingDays)>0
      ? (c.breakEvenUnits/num(state.workingDays)).toFixed(1)
      : "—";

  $("dashSellingPrice").textContent=money(c.sellingPrice);
  $("dashContribution").textContent=money(c.contributionPerUnit);
  $("dashContribution").style.color=c.contributionPerUnit>0?"var(--green)":"var(--red)";
  $("dashPlannedUnits").textContent=Math.round(c.plannedUnits);
  $("dashFullCostUnit").textContent=c.fullCostPerUnitAtPlan===null?"—":money(c.fullCostPerUnitAtPlan);
  $("dashProfitUnit").textContent=c.profitPerUnitAtPlan===null?"—":money(c.profitPerUnitAtPlan);
  if(c.profitPerUnitAtPlan!==null) $("dashProfitUnit").style.color=c.profitPerUnitAtPlan>=0?"var(--green)":"var(--red)";
  $("dashMonthlyNet").textContent=money(c.monthlyNetProfit);
  $("dashMonthlyNet").style.color=c.monthlyNetProfit>=0?"var(--green)":"var(--red)";

  $("dashZeroUnits").textContent=Number.isFinite(c.breakEvenUnits)?ceilSafe(c.breakEvenUnits):"—";
  $("dashTargetUnits").textContent=Number.isFinite(c.targetProfitUnits)?ceilSafe(c.targetProfitUnits):"—";
  $("dashZeroPrice").textContent=c.zeroPriceAtPlanned===null?"—":money(c.zeroPriceAtPlanned);
  $("dashTargetPrice").textContent=c.targetPriceAtPlanned===null?"—":money(c.targetPriceAtPlanned);

  const badge=$("statusBadge");
  badge.className="status-badge";
  if(c.sellingPrice<=0){
    $("statusTitle").textContent="Enter a selling price · أدخل سعر البيع";
    $("statusText").textContent="All costs are calculated, but break-even needs a selling price.";
    badge.textContent="Need price · أدخل السعر";badge.classList.add("neutral");
  }else if(c.contributionPerUnit<=0){
    $("statusTitle").textContent="Selling price is too low · سعر البيع منخفض";
    $("statusText").textContent=`Variable cost is ${money(c.variableCostPerUnit)} per kandura, so there is no break-even at this price.`;
    badge.textContent="No break-even · لا يوجد تعادل";badge.classList.add("bad");
  }else{
    $("statusTitle").textContent="Model calculated · تم حساب النموذج";
    $("statusText").textContent=`At ${money(c.sellingPrice)} selling price, break-even is about ${ceilSafe(c.breakEvenUnits)} kanduras per month.`;
    badge.textContent="Calculated · محسوب";badge.classList.add("good");
  }

  const rows=[
    ["Fabric · القماش",c.fabricPerUnit],
    ["Per-Kandura Labor · عمالة لكل كندورة",c.pieceLaborPerUnit],
    ["Other Variable · تكاليف متغيرة أخرى",c.otherVariablePerUnit],
    ["Fixed Allocation at Planned Volume · حصة المصاريف الثابتة",c.fixedCostPerUnitAtPlan??0]
  ];
  const max=Math.max(...rows.map(x=>x[1]),1);
  $("unitCostBars").innerHTML=rows.map(([name,v])=>`
    <div class="bar-row">
      <div class="bar-label"><b>${name}</b><span>${money(v)}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${v/max*100}%"></div></div>
    </div>`).join("");
}

function renderScenarioTable(c){
  const base=Math.max(
    10,
    Number.isFinite(c.breakEvenUnits)?Math.ceil(c.breakEvenUnits):0,
    c.plannedUnits
  );
  const step=Math.max(10,Math.ceil(base/5/10)*10);
  const units=[];
  for(let i=-3;i<=4;i++){
    const u=Math.max(0,Math.round((base+i*step)/10)*10);
    if(!units.includes(u))units.push(u);
  }
  units.sort((a,b)=>a-b);

  $("quantityScenarioTable").innerHTML=`
    <div class="table-wrap">
      <table class="scenario-table">
        <thead><tr>
          <th>Kanduras · الكندورات</th>
          <th>Revenue · الإيراد</th>
          <th>Total Cost · إجمالي التكلفة</th>
          <th>Net Profit · صافي الربح</th>
        </tr></thead>
        <tbody>
          ${units.map(u=>{
            const revenue=u*c.sellingPrice;
            const totalCost=c.totalFixedMonthly+u*c.variableCostPerUnit;
            const net=revenue-totalCost;
            return `<tr>
              <td><b>${u}</b></td>
              <td>${money(revenue)}</td>
              <td>${money(totalCost)}</td>
              <td class="${net>=0?"profit-positive":"profit-negative"}">${money(net)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function exportBackup(){
  saveState();
  const payload={app:"Khayyat Business Calculator",version:6,exportedAt:new Date().toISOString(),state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`khayyat-v6-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast("Backup exported · تم تصدير النسخة الاحتياطية");
}

async function importBackup(e){
  const file=e.target.files?.[0];
  if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    state=normalize(parsed.state||parsed);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    renderAll();
    toast("Backup restored · تمت استعادة النسخة");
  }catch(err){
    toast("Invalid backup file · ملف النسخة غير صالح");
  }
  e.target.value="";
}

function toast(msg){
  clearTimeout(toastTimer);
  $("toast").textContent=msg;
  $("toast").classList.add("show");
  toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2300);
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(console.error));
}
