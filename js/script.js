// CIA PROFILE // Intelligence dossier interface
// Firestore schema and mission termination fields are preserved.

import SoundFX from './sound.js';
import { db, INTEL_TERMS } from "./config.js";
import {
  collection, query, where, getDocs, updateDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let allMissions = [];
const currentAgent = localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";
const ITEMS_PER_PAGE = 12;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();
let masterPages = [];
let masterTotalPages = 0;
let masterCurrentPage = 0;
let currentDossierId = null;
window.currentDossierId = null;

const $ = (id) => document.getElementById(id);
const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const randomIntel = () => INTEL_TERMS[Math.floor(Math.random() * INTEL_TERMS.length)];

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  if (typeof value.toDate === "function") {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d) ? d : null;
  }
  if (typeof value === "object" && typeof value.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return isNaN(d) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

function isInSelectedMonth(date) {
  return date && date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
}

document.addEventListener("DOMContentLoaded", () => {
  $("display-agent").textContent = currentAgent;
  loadMissionData();
  $("btnBack")?.addEventListener("click", () => {
    SoundFX.click();
    $("noirOverlay").style.display = "none";
    $("memoirsOverlay").style.display = "none";
  });
});

async function loadMissionData() {
  SoundFX.terminalUpdate();
  try {
    const q = query(collection(db, "mission_orders"), where("agent", "==", currentAgent));
    const snap = await getDocs(q);
    allMissions = snap.docs.map(d => ({...d.data(), id:d.id}));
    renderFolders();
    snap.size ? SoundFX.success() : SoundFX.beep(600, .2, .2);
  } catch (error) {
    console.error("Error loading profile data:", error);
    SoundFX.error();
    $("vagentSection").innerHTML = `<div class="empty-state">Unable to retrieve dossier records. Check connection and try again.</div>`;
  }
}

// Weapon-system/device cards have been removed. Active vAgent dossiers are shown directly.
function renderFolders() {
  const host = $("vagentSection");
  const active = allMissions
    .filter(m => m.status !== "TERMINATED" && m.vAgentID !== null && m.vAgentID !== undefined && String(m.vAgentID).trim() !== "")
    .sort((a,b) => String(a.vAgentID).localeCompare(String(b.vAgentID), undefined, {numeric:true}));

  if (!active.length) {
    host.innerHTML = `<div class="empty-state"><span class="empty-icon">${icon("folder-search")}</span><b>NO ACTIVE DOSSIERS</b><span>There are no active vAgent records assigned to this profile.</span></div>`;
    return;
  }

  host.innerHTML = `
    <div class="section-heading">
      <div><span class="eyebrow">PERSONNEL ARCHIVE</span><h2>Active Dossiers</h2><p>Select a folder to inspect its operational record.</p></div>
      <span class="record-count">${String(active.length).padStart(2,"0")} RECORDS</span>
    </div>
    <div class="folder-grid">
      ${active.map((m,i) => {
        const logs = Array.isArray(m.expensesBreakdown) ? m.expensesBreakdown.length : 0;
        return `<button class="dossier-folder" type="button" data-doc-id="${escapeHTML(m.id)}">
          <span class="folder-tab"></span>
          <span class="folder-top"><span class="folder-index">${String(i+1).padStart(2,"0")}</span><span class="folder-status"><i></i> ACTIVE</span></span>
          <span class="folder-art">${icon("folder-closed")}</span>
          <span class="folder-title">vAGENT // ${escapeHTML(m.vAgentID)}</span>
          <span class="folder-meta">${logs} LOG ENTRIES <span>•</span> ${escapeHTML(m.missionID || "UNNUMBERED")}</span>
          <span class="folder-open">OPEN DOSSIER ${icon("arrow-up-right")}</span>
        </button>`;
      }).join("")}
    </div>`;

  host.querySelectorAll("[data-doc-id]").forEach(btn => {
    btn.addEventListener("click", () => window.openNoirModal(btn.dataset.docId));
  });
}

function icon(name) {
  const paths = {
    "folder-search":'<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v3"/><path d="M3 9h10"/><circle cx="16.5" cy="17" r="3.5"/><path d="m19 19.5 2 2"/>',
    "folder-closed":'<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><path d="M3 10h18"/>',
    "arrow-up-right":'<path d="M7 17 17 7M7 7h10v10"/>',
    "file-text":'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    "shield":'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
    "x":'<path d="m18 6-12 12M6 6l12 12"/>',
    "calendar":'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    "chevron-left":'<path d="m15 18-6-6 6-6"/>',
    "chevron-right":'<path d="m9 18 6-6-6-6"/>',
    "archive":'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths["file-text"]}</svg>`;
}

window.openNoirModal = (docID) => {
  const data = allMissions.find(m => m.id === docID);
  if (!data) return;
  if (data.status === "TERMINATED") {
    SoundFX.error();
    alert("This dossier has been terminated and is read-only in the archive.");
    return;
  }
  currentDossierId = docID;
  window.currentDossierId = docID;
  SoundFX.folderOpen();
  $("n-order").textContent = data.missionID || docID.substring(0,12).toUpperCase();
  $("n-vagent").textContent = data.vAgentID || "N/A";
  const expenses = Array.isArray(data.expensesBreakdown) ? [...data.expensesBreakdown] : [];
  expenses.sort((a,b) => (toDate(b.timestamp)?.getTime() || 0) - (toDate(a.timestamp)?.getTime() || 0));
  $("n-content").innerHTML = `
    <div class="dossier-meta-grid">
      <div><span>SECURE LINE</span><b>${escapeHTML(data.marker || "SECRET_LINE")}</b></div>
      <div><span>RECORD STATUS</span><b class="status-live">ACTIVE / VERIFIED</b></div>
    </div>
    <div class="document-rule"><span>OPERATIONAL ACTIVITY LOG</span><span>${expenses.length} ENTRIES</span></div>
    <div class="operation-log">
      ${expenses.length ? expenses.map(e => {
        const d = toDate(e.timestamp);
        return `<div class="operation-row"><div><span>${d ? escapeHTML(d.toLocaleDateString("en-US",{month:"short",day:"2-digit",year:"numeric"})) : "DATE UNAVAILABLE"}</span><b>${escapeHTML(e.description || randomIntel())}</b></div><strong>${peso(e.amount)}</strong></div>`;
      }).join("") : `<div class="empty-log">NO OPERATIONAL LOGS AVAILABLE</div>`}
    </div>`;
  $("n-total").textContent = peso(data.totalExpenses);
  $("noirOverlay").style.display = "flex";
};

window.closeNoir = () => {
  SoundFX.click();
  $("noirOverlay").style.display = "none";
  currentDossierId = null;
  window.currentDossierId = null;
};

window.terminateAgent = async (docID) => {
  const data = allMissions.find(m => m.id === docID);
  if (!data || data.status === "TERMINATED") return;
  const approved = confirm(`TERMINATE DOSSIER vAgent# ${data.vAgentID || "N/A"}?\n\nThis removes its vAgent assignment. The weaponSystem field and expense history will be retained in the archive.`);
  if (!approved) return;

  SoundFX.error();
  try {
    await updateDoc(doc(db, "mission_orders", docID), {
      status: "TERMINATED",
      vAgentID: null,
      terminatedAt: serverTimestamp(),
      terminatedBy: currentAgent
    });
    const index = allMissions.findIndex(m => m.id === docID);
    if (index >= 0) {
      allMissions[index] = {...allMissions[index], status:"TERMINATED", vAgentID:null};
    }
    SoundFX.success();
    closeNoir();
    renderFolders();
    alert("DOSSIER TERMINATED. Historical expense records remain available in Memoirs.");
  } catch (error) {
    console.error("Termination error:", error);
    SoundFX.error();
    alert("TERMINATION FAILED: " + error.message);
  }
};

window.flipPage = (forward) => {
  SoundFX.pageFlip();
  if (forward) {
    $("p1").classList.add("flipped");
    $("p2").style.display = "flex";
  } else {
    $("p1").classList.remove("flipped");
    setTimeout(() => $("p2").style.display = "none", 450);
  }
};

window.closeMemoirs = () => {
  SoundFX.click();
  $("memoirsOverlay").style.display = "none";
  $("p1").classList.remove("flipped");
  $("p2").style.display = "none";
  $("masterPagination")?.remove();
  $("memoirsMonthControl")?.remove();
};

window.openMemoirs = (mode = "ALL") => {
  SoundFX.folderOpen();
  $("memoirsOverlay").style.display = "flex";
  renderMasterMemoirs();
};

function collectMonthlyEntries() {
  const entries = [];
  allMissions.forEach(mission => {
    (Array.isArray(mission.expensesBreakdown) ? mission.expensesBreakdown : []).forEach(exp => {
      const date = toDate(exp.timestamp);
      if (!isInSelectedMonth(date)) return;
      entries.push({
        missionID: mission.missionID || "???",
        vAgent: mission.vAgentID ?? null,
        weaponName: mission.weaponSystem || "UNSPECIFIED",
        date,
        amount: Number(exp.amount || 0),
        description: exp.description || "Operational expense",
        terminated: mission.status === "TERMINATED"
      });
    });
  });
  return entries.sort((a,b) => b.date - a.date);
}

function renderMasterMemoirs() {
  masterCurrentPage = 0;
  $("target-name").innerHTML = `MASTER MEMOIRS <span class="document-subtitle">PERSONNEL EXPENSE ARCHIVE</span>`;
  $("flipNextBtn").style.display = "inline-flex";
  $("p1").classList.remove("flipped");
  $("p2").style.display = "none";
  buildMonthControls();
  renderMemoirsPage();
}

function buildMonthControls() {
  $("memoirsMonthControl")?.remove();
  const control = document.createElement("div");
  control.id = "memoirsMonthControl";
  control.className = "month-controls";
  const yearSet = new Set([new Date().getFullYear()]);
  allMissions.forEach(m => (Array.isArray(m.expensesBreakdown) ? m.expensesBreakdown : []).forEach(e => {
    const d = toDate(e.timestamp);
    if (d) yearSet.add(d.getFullYear());
  }));
  const years = [...yearSet].sort((a,b) => b-a);
  control.innerHTML = `
    <label>${icon("calendar")} PERIOD</label>
    <select id="memoirsMonth">${MONTHS.map((m,i)=>`<option value="${i}" ${i===selectedMonth?"selected":""}>${m.toUpperCase()}</option>`).join("")}</select>
    <select id="memoirsYear">${years.map(y=>`<option value="${y}" ${y===selectedYear?"selected":""}>${y}</option>`).join("")}</select>
    <button type="button" id="memoirsCurrent">CURRENT MONTH</button>`;
  $("target-name").parentNode.insertBefore(control, $("active-list"));
  $("memoirsMonth").addEventListener("change", e => { selectedMonth = Number(e.target.value); masterCurrentPage=0; renderMemoirsPage(); });
  $("memoirsYear").addEventListener("change", e => { selectedYear = Number(e.target.value); masterCurrentPage=0; renderMemoirsPage(); });
  $("memoirsCurrent").addEventListener("click", () => {
    const now = new Date();
    selectedMonth = now.getMonth(); selectedYear = now.getFullYear();
    $("memoirsMonth").value = selectedMonth; $("memoirsYear").value = selectedYear;
    masterCurrentPage=0; renderMemoirsPage();
  });
}

function renderMemoirsPage() {
  const entries = collectMonthlyEntries();
  const total = entries.reduce((sum,e)=>sum+e.amount,0);
  masterTotalPages = Math.max(1, Math.ceil(entries.length / ITEMS_PER_PAGE));
  masterPages = Array.from({length:masterTotalPages},(_,i)=>entries.slice(i*ITEMS_PER_PAGE,(i+1)*ITEMS_PER_PAGE));
  const pageEntries = masterPages[masterCurrentPage] || [];
  const monthLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;
  $("target-name").setAttribute("data-period", monthLabel.toUpperCase());

  $("active-list").innerHTML = pageEntries.length ? `
    <div class="memoirs-document-head"><span>DATE / REFERENCE</span><span>DESCRIPTION</span><span>AMOUNT</span></div>
    ${pageEntries.map(e=>`
      <div class="memoir-entry ${e.terminated?"is-terminated":""}">
        <div class="memoir-date"><b>${escapeHTML(e.date.toLocaleDateString("en-US",{month:"short",day:"2-digit"}))}</b><small>${escapeHTML(e.missionID)}</small></div>
        <div class="memoir-description"><b>${escapeHTML(e.description)}</b><small>${e.vAgent ? `vAgent# ${escapeHTML(e.vAgent)}` : "UNASSIGNED"} · ${e.terminated?"TERMINATED / ARCHIVED":"ACTIVE RECORD"}</small></div>
        <strong>${peso(e.amount)}</strong>
      </div>`).join("")}
    ` : `<div class="memoirs-empty">${icon("archive")}<b>NO RECORDS FOR ${monthLabel.toUpperCase()}</b><span>Choose another month to review saved historical entries.</span></div>`;

  $("total-val").innerHTML = `<div class="document-total"><span>MONTHLY TOTAL · ${monthLabel.toUpperCase()}</span><b>${peso(total)}</b></div><small class="page-counter">PAGE ${masterCurrentPage+1} OF ${masterTotalPages} · ${entries.length} ENTRIES</small>`;
  renderMemoirsSummary(entries,total,monthLabel);
  updatePagination();
}

function renderMemoirsSummary(entries,total,monthLabel) {
  const byAgent = new Map();
  entries.forEach(e=>{
    const key = e.vAgent ? `vAgent# ${e.vAgent}` : "UNASSIGNED";
    byAgent.set(key,(byAgent.get(key)||0)+e.amount);
  });
  $("weapon-system-breakdown").innerHTML = `
    <div class="summary-cover"><span>ARCHIVE SUMMARY</span><h4>${monthLabel}</h4><p>Consolidated operational expense statement</p></div>
    <div class="summary-stat"><span>TOTAL ENTRIES</span><b>${entries.length}</b></div>
    <div class="summary-stat"><span>ACTIVE RECORDS</span><b>${entries.filter(e=>!e.terminated).length}</b></div>
    <div class="summary-stat"><span>TERMINATED / ARCHIVED</span><b>${entries.filter(e=>e.terminated).length}</b></div>
    <div class="summary-breakdown"><span>PERSONNEL BREAKDOWN</span>
      ${byAgent.size ? [...byAgent.entries()].sort((a,b)=>b[1]-a[1]).map(([name,amount])=>`<div><span>${escapeHTML(name)}</span><b>${peso(amount)}</b></div>`).join("") : `<p>No personnel entries recorded.</p>`}
    </div>
    <div class="summary-grand"><span>GRAND TOTAL</span><b>${peso(total)}</b></div>`;
  $("total-val-p2").textContent = peso(total).replace("₱","");
}

function updatePagination() {
  $("masterPagination")?.remove();
  if (masterTotalPages <= 1) return;
  const nav = document.createElement("div");
  nav.id = "masterPagination";
  nav.className = "document-pagination";
  nav.innerHTML = `<button type="button" id="memoPrev" ${masterCurrentPage===0?"disabled":""}>${icon("chevron-left")} PREVIOUS</button><span>${masterCurrentPage+1} / ${masterTotalPages}</span><button type="button" id="memoNext" ${masterCurrentPage>=masterTotalPages-1?"disabled":""}>NEXT ${icon("chevron-right")}</button>`;
  $("active-list").after(nav);
  $("memoPrev").addEventListener("click",()=>{if(masterCurrentPage>0){SoundFX.click();masterCurrentPage--;renderMemoirsPage();}});
  $("memoNext").addEventListener("click",()=>{if(masterCurrentPage<masterTotalPages-1){SoundFX.click();masterCurrentPage++;renderMemoirsPage();}});
};
