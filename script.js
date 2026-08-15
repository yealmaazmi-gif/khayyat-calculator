"use strict";

const STORAGE_KEY = "khayyatBusinessCalculatorV1";
const COLORS = ["#8b5e3c","#18864b","#c89b6c","#3478c9","#b7791f","#8b5cf6","#cf4545","#64748b"];

const defaults = {
  screen:"dashboard",
  annualRent:120000,
  electricityMonthly:1500,
  waterMonthly:300,
  internetMonthly:400,
  licenseAnnual:12000,
  insuranceAnnual:3000,
  marketingMonthly:1000,
  maintenanceMonthly:500,
  otherFixedMonthly:500,
  workingDays:26,

  visaCostPerEmployee:6500,
  visaCycleYears:2,

  employees:[
    {id:"manager",role:"Manager / Sales",count:1,salary:4500},
    {id:"helper",role:"Helper",count:1,salary:2500}
  ],

  customOverheads:[],

  taqaCost:1200,
  kandurasPerTaqa:10,
  fabricWastePercent:5,
  tailorLaborPerKandura:60,
  otherLaborPerKandura:0,
  accessoriesPerKandura:15,
  packagingPerKandura:5,
  otherVariablePerKandura:5,

  sellingPrice:300,
  plannedUnits:150,
  targetProfit:15000,
  scenarioStep:25
};

let state = loadState();
let toastTimer = null;

const $ = id => document.getElementById(id);

init();

function init(){
  bindTabs();
  bindInputs();
  bindDynamicButtons();
  render();
}

function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    return raw ? {...structured(defaults),...JSON.parse(raw)} : structured(defaults);
  }catch(e){
    return structured(defaults);
  }
}
function structured(v){return JSON.parse(JSON.stringify(v))}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function saveRender(){saveState();render()}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function money(v){return new Intl.NumberFormat("en-AE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v))+" AED"}
function compact(v){return new Intl.NumberFormat("en-AE",{notation:"compact",maximumFractionDigits:1}).format(num(v))}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(16).slice(2)}
function ceilSafe(v){return Number.isFinite(v)&&v>0?Math.ceil(v):0}
function pct(v){return `${num(v).toFixed(1)}%`}

function bindTabs(){
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      state.screen=btn.dataset.screen;
      saveState();
      renderScreens();
    });
  });
}

const fieldMap = {
  annualRent:"annualRent",
  quickAnnualRent:"annualRent",
  electricityMonthly:"electricityMonthly",
  waterMonthly:"waterMonthly",
  internetMonthly:"internetMonthly",
  licenseAnnual:"licenseAnnual",
  insuranceAnnual:"insuranceAnnual",
  marketingMonthly:"marketingMonthly",
  maintenanceMonthly:"maintenanceMonthly",
  otherFixedMonthly:"otherFixedMonthly",
  workingDays:"workingDays",
  visaCostPerEmployee:"visaCostPerEmployee",
  visaCycleYears:"visaCycleYears",
  taqaCost:"taqaCost",
  kandurasPerTaqa:"kandurasPerTaqa",
  fabricWastePercent:"fabricWastePercent",
  tailorLaborPerKandura:"tailorLaborPerKandura",
  otherLaborPerKandura:"otherLaborPerKandura",
  accessoriesPerKandura:"accessoriesPerKandura",
  packagingPerKandura:"packagingPerKandura",
  otherVariablePerKandura:"otherVariablePerKandura",
  sellingPrice:"sellingPrice",
  quickSellingPrice:"sellingPrice",
  plannedUnits:"plannedUnits",
  quickPlannedUnits:"plannedUnits",
  targetProfit:"targetProfit",
  quickTargetProfit:"targetProfit",
  scenarioStep:"scenarioStep"
};

function bindInputs(){
  Object.keys(fieldMap).forEach(id=>{
    const el=$(id);
    if(!el)return;
    el.addEventListener("input",()=>{
      state[fieldMap[id]]=num(el.value);
      saveRender();
    });
    el.addEventListener("change",()=>{
      state[fieldMap[id]]=num(el.value);
      saveRender();
    });
  });
}

function bindDynamicButtons(){
  $("addEmployeeBtn").onclick=()=>{
    state.employees.push({id:uid(),role:"New Employee Type",count:1,salary:2500});
    saveRender();
  };
  $("addOverheadBtn").onclick=()=>{
    state.customOverheads.push({id:uid(),name:"Other Cost",monthly:0});
    saveRender();
  };
  $("employeeList").addEventListener("input",handleEmployeeEdit);
  $("employeeList").addEventListener("click",handleEmployeeClick);
  $("customOverheadList").addEventListener("input",handleOverheadEdit);
  $("customOverheadList").addEventListener("click",handleOverheadClick);

  $("exportBtn").onclick=exportData;
  $("importFile").onchange=importData;
  $("resetBtn").onclick=()=>$("confirmModal").classList.remove("hidden");
  $("cancelReset").onclick=()=>$("confirmModal").classList.add("hidden");
  $("confirmReset").onclick=()=>{
    state=structured(defaults);
    saveState();
    $("confirmModal").classList.add("hidden");
    render();
    toast("Calculator reset.");
  };
}

function handleEmployeeEdit(e){
  const row=e.target.closest("[data-employee-id]");
  if(!row)return;
  const emp=state.employees.find(x=>x.id===row.dataset.employeeId);
  if(!emp)return;
  const field=e.target.dataset.field;
  if(field==="role")emp.role=e.target.value;
  if(field==="count")emp.count=num(e.target.value);
  if(field==="salary")emp.salary=num(e.target.value);
  saveRender();
}
function handleEmployeeClick(e){
  const btn=e.target.closest("[data-delete-employee]");
  if(!btn)return;
  state.employees=state.employees.filter(x=>x.id!==btn.dataset.deleteEmployee);
  saveRender();
}
function handleOverheadEdit(e){
  const row=e.target.closest("[data-overhead-id]");
  if(!row)return;
  const item=state.customOverheads.find(x=>x.id===row.dataset.overheadId);
  if(!item)return;
  if(e.target.dataset.field==="name")item.name=e.target.value;
  if(e.target.dataset.field==="monthly")item.monthly=num(e.target.value);
  saveRender();
}
function handleOverheadClick(e){
  const btn=e.target.closest("[data-delete-overhead]");
  if(!btn)return;
  state.customOverheads=state.customOverheads.filter(x=>x.id!==btn.dataset.deleteOverhead);
  saveRender();
}

function calc(){
  const totalEmployees=state.employees.reduce((s,e)=>s+num(e.count),0);
  const salaryMonthly=state.employees.reduce((s,e)=>s+num(e.count)*num(e.salary),0);
  const visaMonthly=state.visaCycleYears>0
    ? totalEmployees*num(state.visaCostPerEmployee)/(12*num(state.visaCycleYears))
    : 0;

  const rentMonthly=num(state.annualRent)/12;
  const licenseMonthly=num(state.licenseAnnual)/12;
  const insuranceMonthly=num(state.insuranceAnnual)/12;
  const customMonthly=state.customOverheads.reduce((s,x)=>s+num(x.monthly),0);

  const fixedMonthly =
    rentMonthly + salaryMonthly + visaMonthly +
    num(state.electricityMonthly)+num(state.waterMonthly)+num(state.internetMonthly)+
    licenseMonthly+insuranceMonthly+num(state.marketingMonthly)+
    num(state.maintenanceMonthly)+num(state.otherFixedMonthly)+customMonthly;

  const baseFabricCost = num(state.kandurasPerTaqa)>0 ? num(state.taqaCost)/num(state.kandurasPerTaqa) : 0;
  const fabricCost = baseFabricCost * (1 + num(state.fabricWastePercent)/100);

  const variablePerUnit =
    fabricCost + num(state.tailorLaborPerKandura)+num(state.otherLaborPerKandura)+
    num(state.accessoriesPerKandura)+num(state.packagingPerKandura)+num(state.otherVariablePerKandura);

  const contribution=num(state.sellingPrice)-variablePerUnit;
  const contributionMargin=num(state.sellingPrice)>0?contribution/num(state.sellingPrice)*100:0;

  const breakEven=contribution>0?fixedMonthly/contribution:Infinity;
  const targetUnits=contribution>0?(fixedMonthly+num(state.targetProfit))/contribution:Infinity;

  const units=num(state.plannedUnits);
  const revenue=units*num(state.sellingPrice);
  const totalVariable=units*variablePerUnit;
  const totalCost=fixedMonthly+totalVariable;
  const net=revenue-totalCost;

  return {
    totalEmployees,salaryMonthly,visaMonthly,rentMonthly,licenseMonthly,insuranceMonthly,customMonthly,
    fixedMonthly,baseFabricCost,fabricCost,variablePerUnit,contribution,contributionMargin,
    breakEven,targetUnits,units,revenue,totalVariable,totalCost,net
  };
}

function render(){
  renderScreens();
  syncInputs();
  renderEmployees();
  renderCustomOverheads();
  renderDashboard();
  renderKandura();
  renderScenarios();
}

function renderScreens(){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.screen===state.screen));
  $(`${state.screen}Screen`)?.classList.add("active");
}

function syncInputs(){
  Object.entries(fieldMap).forEach(([id,key])=>{
    const el=$(id);
    if(el && document.activeElement!==el) el.value=state[key];
  });
}

function renderEmployees(){
  if(!state.employees.length){
    $("employeeList").innerHTML='<div class="helper">No fixed-salary employees added.</div>';
  }else{
    $("employeeList").innerHTML=state.employees.map(e=>`
      <div class="employee-row" data-employee-id="${e.id}">
        <label class="wide">Role
          <input data-field="role" value="${escapeHtml(e.role)}">
        </label>
        <label>Count
          <input data-field="count" type="number" min="0" step="1" value="${e.count}">
        </label>
        <label>Salary / Person
          <div class="money-field"><input data-field="salary" type="number" min="0" step="100" value="${e.salary}"><span>AED</span></div>
        </label>
        <button class="icon-delete" data-delete-employee="${e.id}" title="Delete">×</button>
      </div>`).join("");
  }
  const c=calc();
  $("totalEmployees").textContent=c.totalEmployees;
  $("totalSalaryMonthly").textContent=money(c.salaryMonthly);
  $("visaMonthlyProvision").textContent=money(c.visaMonthly);
}

function renderCustomOverheads(){
  if(!state.customOverheads.length){
    $("customOverheadList").innerHTML='<p class="helper">No extra custom costs yet.</p>';
    return;
  }
  $("customOverheadList").innerHTML=state.customOverheads.map(x=>`
    <div class="cost-row" data-overhead-id="${x.id}">
      <label class="wide">Cost Name
        <input data-field="name" value="${escapeHtml(x.name)}">
      </label>
      <label>Monthly Amount
        <div class="money-field"><input data-field="monthly" type="number" min="0" step="10" value="${x.monthly}"><span>AED</span></div>
      </label>
      <button class="icon-delete" data-delete-overhead="${x.id}" title="Delete">×</button>
    </div>`).join("");
}

function renderDashboard(){
  const c=calc();
  $("monthlyFixedCost").textContent=money(c.fixedMonthly);
  $("costPerKandura").textContent=money(c.variablePerUnit);
  $("profitPerKandura").textContent=money(c.contribution);
  $("breakEvenUnits").textContent=Number.isFinite(c.breakEven)?`${ceilSafe(c.breakEven)} Kandura`:"Not possible";
  $("breakEvenDaily").textContent=Number.isFinite(c.breakEven)&&state.workingDays>0
    ? `${(c.breakEven/state.workingDays).toFixed(1)} per working day`
    : "Selling price must exceed variable cost";

  $("plannedUnitsView").textContent=Math.round(c.units);
  $("monthlyRevenue").textContent=money(c.revenue);
  $("monthlyTotalCost").textContent=money(c.totalCost);
  $("monthlyNetProfit").textContent=money(c.net);
  $("monthlyNetProfit").style.color=c.net>=0?"var(--green)":"var(--red)";

  const badge=$("statusBadge");
  badge.className="status-badge";
  if(c.contribution<=0){
    $("businessStatus").textContent="Selling price is too low";
    $("businessStatusText").textContent="Your selling price does not cover the variable cost of one kandura.";
    badge.textContent="Fix price/cost";
    badge.classList.add("bad");
  }else if(c.net>=0){
    $("businessStatus").textContent="Current plan is profitable";
    $("businessStatusText").textContent=`At ${Math.round(c.units)} kanduras per month, estimated net profit is ${money(c.net)}.`;
    badge.textContent="Profitable";
    badge.classList.add("good");
  }else{
    $("businessStatus").textContent="Current plan is below break-even";
    $("businessStatusText").textContent=`You need about ${ceilSafe(c.breakEven)} kanduras per month to reach zero profit.`;
    badge.textContent="Below break-even";
    badge.classList.add("bad");
  }

  renderProfitMeter(c);
  renderCostDonut(c);

  $("targetBreakEven").textContent=Number.isFinite(c.breakEven)?ceilSafe(c.breakEven):"—";
  $("targetProfitUnits").textContent=Number.isFinite(c.targetUnits)?ceilSafe(c.targetUnits):"—";
  $("targetDailyUnits").textContent=Number.isFinite(c.targetUnits)&&state.workingDays>0
    ? (c.targetUnits/state.workingDays).toFixed(1)
    : "—";
}

function renderProfitMeter(c){
  const target=Math.max(Math.abs(c.net),c.fixedMonthly,1);
  const width=Math.min(100,Math.abs(c.net)/target*100);
  $("profitBar").innerHTML=`
    <div class="bar-label"><b>Monthly net result</b><span class="${c.net>=0?"profit-positive":"profit-negative"}">${money(c.net)}</span></div>
    <div class="bar-track"><div class="bar-fill ${c.net>=0?"green":"red"}" style="width:${width}%"></div></div>`;
}

function renderCostDonut(c){
  const units=Math.max(0,c.units);
  const parts=[
    ["Rent",c.rentMonthly],
    ["Fixed Salaries",c.salaryMonthly],
    ["Visa Provision",c.visaMonthly],
    ["Utilities & Shop",num(state.electricityMonthly)+num(state.waterMonthly)+num(state.internetMonthly)],
    ["License / Insurance",c.licenseMonthly+c.insuranceMonthly],
    ["Other Fixed",num(state.marketingMonthly)+num(state.maintenanceMonthly)+num(state.otherFixedMonthly)+c.customMonthly],
    ["Fabric",units*c.fabricCost],
    ["Per-Kandura Labor & Extras",units*(c.variablePerUnit-c.fabricCost)]
  ].filter(x=>x[1]>0);

  const total=parts.reduce((s,x)=>s+x[1],0);
  $("donutTotal").textContent=compact(total);
  if(total<=0){
    $("costDonut").style.background="#e8e1db";
    $("costLegend").innerHTML='<p class="helper">Enter costs to see the breakdown.</p>';
    return;
  }
  let a=0;
  const segments=parts.map((x,i)=>{
    const start=a;
    a+=x[1]/total*360;
    return `${COLORS[i%COLORS.length]} ${start}deg ${a}deg`;
  });
  $("costDonut").style.background=`conic-gradient(${segments.join(",")})`;
  $("costLegend").innerHTML=parts.map((x,i)=>`
    <div class="legend-row"><span class="legend-dot" style="background:${COLORS[i%COLORS.length]}"></span><span>${escapeHtml(x[0])}</span><b>${money(x[1])}</b></div>`).join("");
}

function renderKandura(){
  const c=calc();
  $("fabricCostPerKandura").textContent=money(c.fabricCost);
  $("variableCostView").textContent=money(c.variablePerUnit);
  $("contributionView").textContent=money(c.contribution);
  $("contributionView").style.color=c.contribution>=0?"var(--green)":"var(--red)";
  $("marginPercentView").textContent=pct(c.contributionMargin);
}

function renderScenarios(){
  const c=calc();
  const step=Math.max(1,num(state.scenarioStep)||25);
  const center=Math.max(step,Math.round((Number.isFinite(c.breakEven)?c.breakEven:c.units)/step)*step);
  const units=[];
  for(let i=-3;i<=5;i++){
    const u=Math.max(0,center+i*step);
    if(!units.includes(u))units.push(u);
  }
  if(!units.includes(Math.round(c.units)))units.push(Math.round(c.units));
  units.sort((a,b)=>a-b);

  $("scenarioTable").innerHTML=`<div class="table-wrap"><table class="scenario-table">
    <thead><tr><th>Kanduras</th><th>Revenue</th><th>Variable Cost</th><th>Fixed Cost</th><th>Net Profit</th></tr></thead>
    <tbody>${units.map(u=>{
      const revenue=u*num(state.sellingPrice);
      const variable=u*c.variablePerUnit;
      const net=revenue-variable-c.fixedMonthly;
      const be=Number.isFinite(c.breakEven)&&Math.abs(u-c.breakEven)<=step/2;
      return `<tr class="${be?"break-even-row":""}">
        <td><b>${u}</b></td><td>${money(revenue)}</td><td>${money(variable)}</td><td>${money(c.fixedMonthly)}</td>
        <td class="${net>=0?"profit-positive":"profit-negative"}">${money(net)}</td></tr>`;
    }).join("")}</tbody>
  </table></div>`;

  const maxAbs=Math.max(...units.map(u=>Math.abs(u*c.contribution-c.fixedMonthly)),1);
  $("profitScenarioChart").innerHTML=`<div class="scenario-chart">${units.map(u=>{
    const net=u*c.contribution-c.fixedMonthly;
    return `<div class="chart-row"><b>${u}</b><div class="bar-track"><div class="bar-fill ${net>=0?"green":"red"}" style="width:${Math.abs(net)/maxAbs*100}%"></div></div><span class="${net>=0?"profit-positive":"profit-negative"}">${money(net)}</span></div>`;
  }).join("")}</div>`;

  const price=num(state.sellingPrice);
  const priceSteps=[-40,-20,0,20,40].map(d=>Math.max(0,price+d));
  $("priceScenarioTable").innerHTML=`<div class="table-wrap"><table class="scenario-table">
    <thead><tr><th>Selling Price</th><th>Profit / Kandura</th><th>Break-even Units</th><th>Profit at Planned Volume</th></tr></thead>
    <tbody>${priceSteps.map(p=>{
      const contribution=p-c.variablePerUnit;
      const be=contribution>0?Math.ceil(c.fixedMonthly/contribution):null;
      const net=c.units*contribution-c.fixedMonthly;
      return `<tr><td><b>${money(p)}</b></td><td class="${contribution>=0?"profit-positive":"profit-negative"}">${money(contribution)}</td><td>${be??"—"}</td><td class="${net>=0?"profit-positive":"profit-negative"}">${money(net)}</td></tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

function exportData(){
  const payload={app:"Khayyat Business Calculator",version:1,exportedAt:new Date().toISOString(),state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`khayyat-calculator-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast("Backup exported.");
}
async function importData(e){
  const file=e.target.files?.[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    const incoming=parsed.state||parsed;
    state={...structured(defaults),...incoming};
    if(!Array.isArray(state.employees))state.employees=structured(defaults.employees);
    if(!Array.isArray(state.customOverheads))state.customOverheads=[];
    saveRender();
    toast("Backup restored.");
  }catch(err){
    toast("Invalid backup file.");
  }
  e.target.value="";
}
function toast(msg){
  clearTimeout(toastTimer);
  $("toast").textContent=msg;
  $("toast").classList.add("show");
  toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2400);
}
function escapeHtml(s){
  return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./service-worker.js").catch(console.error);
  });
}
