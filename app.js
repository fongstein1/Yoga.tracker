"use strict";
// This is a source-controlled reimplementation, not an export of the ChatGPT Site.
// User attendance and membership details never leave this browser.
const KEY = "yogavalue.repo.v1";
const $ = (id) => document.getElementById(id);
const today = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
};
const validDate = (s) => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  return !Number.isNaN(d.getTime()) && d.getFullYear() === Number(s.slice(0,4))
    && d.getMonth()+1 === Number(s.slice(5,7)) && d.getDate() === Number(s.slice(8,10));
};
const dollars = (n) => new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(n);
const dateTitle = (s) => new Date(s+"T12:00:00").toLocaleDateString("en-CA",{year:"numeric",month:"short",day:"numeric"});
const blank = () => ({schemaVersion:1,membership:null,classes:[],dark:false});
function validate(data) {
  if (!data || typeof data !== "object" || data.schemaVersion !== 1 || !Array.isArray(data.classes) || data.classes.length > 10000) {
    throw Error("This is not a supported Yoga Value backup (schemaVersion 1).");
  }
  const m = data.membership;
  if (m !== null && m !== undefined && (!m || !Number.isFinite(m.amount) || m.amount < 0 || m.amount > 1000000
      || !["annual","monthly"].includes(m.period) || !validDate(m.start))) {
    throw Error("The membership details in this backup are invalid.");
  }
  if (data.classes.some(c => !c || !validDate(c.date) || typeof c.id !== "string" || c.id.length > 100)) {
    throw Error("The class entries in this backup are invalid.");
  }
  const ids = data.classes.map(c => c.id);
  if (new Set(ids).size !== ids.length) throw Error("This backup contains duplicate class IDs.");
  return {schemaVersion:1,membership:m||null,classes:data.classes.map(c=>({id:c.id,date:c.date})),dark:!!data.dark};
}
function load() {
  try { const raw = localStorage.getItem(KEY); return raw ? validate(JSON.parse(raw)) : blank(); }
  catch (e) { alert("Saved data could not be read. It has not been overwritten. Please inspect your browser storage or restore a backup.\n"+e.message); return null; }
}
let state = load();
function save() {
  try { localStorage.setItem(KEY,JSON.stringify(state)); }
  catch { alert("Your browser could not save the changes. Export your data and check storage permissions."); }
}
let toastId;
function notify(text) { const t=$("toast"); t.textContent=text;t.classList.add("visible");clearTimeout(toastId);toastId=setTimeout(()=>t.classList.remove("visible"),2600); }
function paidCost(through) {
  const m=state.membership;
  if (!m || through < m.start) return null;
  if (m.period==="annual") {
    const elapsed=Number(through.slice(0,4))-Number(m.start.slice(0,4));
    const anniversary=m.start.slice(5);
    const years=elapsed+(through.slice(5)>=anniversary?1:0);
    return Math.max(1,years)*m.amount;
  }
  const months=(Number(through.slice(0,4))-Number(m.start.slice(0,4)))*12
    +Number(through.slice(5,7))-Number(m.start.slice(5,7));
  return Math.max(1,months+(Number(through.slice(8))>=Number(m.start.slice(8))?1:0))*m.amount;
}
function trendSeries() {
  const dates=state.classes.map(c=>c.date).sort();
  return dates.map((date,i)=>({label:date,value:(paidCost(date)||0)/(i+1)}))
    .filter(point=>point.value>=0);
}
function drawLine(points) {
  if(!points.length)return "Log a class to see your cost per class take shape.";
  const w=440,h=200,pad=28,max=Math.max(1,...points.map(p=>p.value));
  const x=i=>pad+(w-2*pad)*(points.length===1?0.5:i/(points.length-1));
  const y=v=>h-pad-(h-2*pad)*v/max;
  const line=points.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p.value).toFixed(1)).join(" ");
  const circles=points.map((p,i)=>'<circle class="dot" cx="'+x(i).toFixed(1)+'" cy="'+y(p.value).toFixed(1)+'" r="3.5"/>').join("");
  return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Cost per class decreasing with logged classes">'
    +'<line class="gridline" x1="'+pad+'" y1="'+(h-pad)+'" x2="'+(w-pad)+'" y2="'+(h-pad)+'"/>'
    +'<path class="line" d="'+line+'"/>'+circles
    +'<text class="axis" x="'+pad+'" y="15">'+dollars(max)+'</text>'
    +'<text class="axis" x="'+pad+'" y="'+(h-5)+'">'+points.length+' class'+(points.length===1?"":"es")+'</text></svg>';
}
function drawBars() {
  const counts=new Map();
  for(const c of state.classes)counts.set(c.date.slice(0,7),(counts.get(c.date.slice(0,7))||0)+1);
  const months=[...counts].sort().slice(-8);
  if(!months.length)return "Your monthly rhythm starts with your first class.";
  const w=440,h=200,max=Math.max(1,...months.map(x=>x[1]));
  const bw=Math.min(44,(w-52)/months.length*0.58);
  const bars=months.map(([month,count],i)=>{
    const x=30+(i+0.5)*(w-40)/months.length;
    const ht=(h-64)*count/max;
    return '<rect class="bar" x="'+(x-bw/2).toFixed(1)+'" y="'+(h-35-ht).toFixed(1)+'" width="'+bw+'" height="'+ht.toFixed(1)+'" rx="5"/>'
      +'<text class="axis" text-anchor="middle" x="'+x.toFixed(1)+'" y="'+(h-12)+'">'+month.slice(5)+'</text>'
      +'<text class="axis" text-anchor="middle" x="'+x.toFixed(1)+'" y="'+(h-41-ht)+'">'+count+'</text>';
  }).join("");
  return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Monthly class count">'+bars+'</svg>';
}
function render() {
  if (!state) return;
  document.body.classList.toggle("dark",state.dark);
  $("theme-toggle").textContent=state.dark?"Light mode":"Dark mode";
  $("total-classes").textContent=String(state.classes.length);
  const month=today().slice(0,7);
  $("month-classes").textContent=String(state.classes.filter(c=>c.date.startsWith(month)).length);
  $("current-month-label").textContent=new Date().toLocaleString("en-CA",{month:"long",year:"numeric"});
  const count=state.classes.filter(c=>!state.membership || c.date>=state.membership.start).length;
  const spent=paidCost(today());
  $("cost-per-class").textContent=spent!==null&&count?dollars(spent/count):"—";
  $("cost-caption").textContent=spent===null?"Set up your membership to see the value of your practice.":count?dollars(spent)+" membership cost / "+count+" classes":"Log a class to see your cost per class.";
  $("cost-chart").innerHTML=drawLine(trendSeries());
  $("rhythm-chart").innerHTML=drawBars();
  const list=$("recent-list");list.replaceChildren();
  const recents=[...state.classes].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
  if(!recents.length){const li=document.createElement("li");li.textContent="Your mat is waiting. Classes you log will appear here.";list.append(li);}
  for(const c of recents){
    const li=document.createElement("li"),span=document.createElement("span"),button=document.createElement("button");
    span.textContent=dateTitle(c.date);button.textContent="Remove";button.type="button";button.setAttribute("aria-label","Remove class on "+dateTitle(c.date));
    button.addEventListener("click",()=>{if(confirm("Remove this class entry?")){state.classes=state.classes.filter(x=>x.id!==c.id);save();render();}});
    li.append(span,button);list.append(li);
  }
  $("membership-summary").textContent=state.membership
    ?dollars(state.membership.amount)+" per "+(state.membership.period==="annual"?"year":"month")+" · Since "+dateTitle(state.membership.start)
    :"No membership details yet.";
  $("edit-membership").textContent=state.membership?"Edit membership":"Set up membership";
}
function openMembership() {
  const m=state.membership;
  $("membership-amount").value=m?String(m.amount):"";
  $("membership-period").value=m?.period||"annual";
  $("membership-start").value=m?.start||today();
  $("membership-dialog").showModal();
}
function openClass(earlier) {
  $("class-date").value=today();
  $("class-date").max=today();
  $("class-dialog").showModal();
  if(earlier)$("class-date").focus();
}
if(state){
  $("settings-open").addEventListener("click",openMembership);
  $("edit-membership").addEventListener("click",openMembership);
  $("log-today").addEventListener("click",()=>openClass(false));
  $("log-earlier").addEventListener("click",()=>openClass(true));
  $("add-past").addEventListener("click",()=>openClass(true));
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>$(b.dataset.close).close()));
  $("theme-toggle").addEventListener("click",()=>{state.dark=!state.dark;save();render();});
  $("membership-form").addEventListener("submit",e=>{
    e.preventDefault();
    const amount=Number($("membership-amount").value),period=$("membership-period").value,start=$("membership-start").value;
    if(!Number.isFinite(amount)||amount<0||amount>1000000||!validDate(start)||start>today()){notify("Check membership details.");return;}
    state.membership={amount,period,start};save();$("membership-dialog").close();render();notify("Membership saved.");
  });
  $("class-form").addEventListener("submit",e=>{
    e.preventDefault();const date=$("class-date").value;
    if(!validDate(date)||date>today()){notify("Choose a valid past or present date.");return;}
    state.classes.push({id:typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"c-"+Date.now()+"-"+Math.random().toString(36).slice(2),date});
    save();$("class-dialog").close();render();notify("Class logged. Well done!");
  });
  $("export").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="yogavalue-backup-"+today()+".json";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);notify("Backup exported.");
  });
  $("import-file").addEventListener("change",async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>2_000_000)throw Error("Backup file is too large.");
      const parsed=validate(JSON.parse(await file.text()));
      if(!confirm("Import "+parsed.classes.length+" classes? This replaces existing data in this browser. Export a backup first."))return;
      state=parsed;save();render();notify("Backup imported.");
    }catch(err){alert("Could not import this backup: "+err.message);}
    finally{e.target.value="";}
  });
  render();
}
