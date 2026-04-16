// js/script.js - CIA Profiles Main Logic with Sounds
// ========================================

import SoundFX from './sound.js';
import { db, INTEL_TERMS } from "./config.js";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("✅ Modules loaded successfully");

// ====== GLOBAL STATE ======
let deviceData = {};
let allMissions = [];
const currentAgent = localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";

console.log("Current Agent:", currentAgent);

// ====== HELPER: Random INTEL term ======
function getRandomIntelTerm() {
  return INTEL_TERMS[Math.floor(Math.random() * INTEL_TERMS.length)];
}

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔧 DOM Loaded - Starting initialization...");
  const displayAgent = document.getElementById("display-agent");
  if (displayAgent) {
    displayAgent.innerText = currentAgent;
  }
  loadMissionData();
});

// ====== DATA LOADING ======
async function loadMissionData() {
  console.log("📡 Loading mission data for agent:", currentAgent);
  SoundFX.terminalUpdate();
  try {
    const q = query(
      collection(db, "mission_orders"),
      where("agent", "==", currentAgent)
    );
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} missions`);

    allMissions = [];
    deviceData = {};

    snap.forEach((doc) => {
      const data = doc.data();
      const docWithID = { ...data, id: doc.id };
      allMissions.push(docWithID);

      // ✅ Skip kung walang weaponSystem
      const deviceName = data.weaponSystem;
      if (!deviceName || deviceName === "" || deviceName === "undefined" || deviceName === "null") {
        console.log("Skipping mission - no weaponSystem:", docWithID);
        return;
      }
      
      // ✅ PARA SA DEVICE GRID: Dapat may vAgentID para lumabas sa phone grid
      // Pero para sa memoirs, nasa allMissions pa rin ang lahat
      if (data.vAgentID && data.vAgentID !== "") {
        if (!deviceData[deviceName]) {
          deviceData[deviceName] = [];
        }
        deviceData[deviceName].push(docWithID);
      }
    });

    console.log("Device Data (with vAgent only):", deviceData);
    console.log("All Missions (for memoirs):", allMissions.length);
    renderDevices();
    
    if (snap.size > 0) {
      SoundFX.success();
    } else {
      SoundFX.beep(600, 0.2, 0.2);
    }
  } catch (error) {
    console.error("❌ Error loading mission data:", error);
    SoundFX.error();
    renderDevices();
  }
}


// ====== DEVICE RENDERING ======
function renderDevices() {
  const grid = document.getElementById("deviceSection");
  if (!grid) return;

  const keys = Object.keys(deviceData);
  console.log("Rendering devices:", keys);

  if (keys.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; opacity:0.5;">[ NO_ACTIVE_DATA ]</p>`;
    return;
  }

  grid.innerHTML = "";
  
  keys.forEach((name, idx) => {
    const neonNumber = (idx % 6) + 1;
    const wrapper = document.createElement("div");
    wrapper.className = "phone-wrapper";
    wrapper.setAttribute("data-neon", neonNumber);
    
    if (idx === 0) {
      wrapper.classList.add('left-phone');
    } else if (idx === keys.length - 1) {
      wrapper.classList.add('right-phone');
    } else {
      wrapper.classList.add('center-phone');
    }
    
    wrapper.innerHTML = `
      <div class="phone-body">
        <div class="power-btn"></div>
        <div class="volume-up"></div>
        <div class="volume-down"></div>
        <div class="action-btn"></div>
        <div class="phone-screen">
          <div class="typing-text">WELCOME<br>${name}</div>
        </div>
      </div>
      <div class="status-label">[ STANDBY_LINK ]</div>
    `;
    
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      activateDevice(name, wrapper);
    });
    
    grid.appendChild(wrapper);
  });
}

// ====== DEVICE ACTIVATION ======
function activateDevice(name, element) {
  console.log("🎯 Activating device:", name);
  SoundFX.success();
  
  element.classList.add("lights-on");
  const statusLabel = element.querySelector(".status-label");
  statusLabel.innerHTML = "[ UPLINK_SYNC_DATA ]";
  statusLabel.classList.add("uplink-sync");

  setTimeout(() => {
    document.getElementById("deviceSection").style.display = "none";
    document.getElementById("vagentSection").style.display = "grid";
    document.getElementById("btnBack").style.display = "block";

    const deviceMemoirsContainer = document.getElementById("deviceMemoirsContainer");
    if (deviceMemoirsContainer) {
      deviceMemoirsContainer.innerHTML = `
        <button onclick="openMemoirs('${name}')" style="background:none; border:1px solid #8b0000; color:#8b0000; padding:10px; width:100%; cursor:pointer; font-weight: bold;">
          [ VIEW_${name}_MEMOIRS ]
        </button>
      `;
    }

    const missionsForDevice = deviceData[name];
    const sorted = missionsForDevice.filter(m => m.vAgentID).sort(
      (a, b) => parseInt(a.vAgentID) - parseInt(b.vAgentID)
    );
    document.getElementById("vagentSection").innerHTML =
      sorted
        .map((v) => {
          const hasHistory =
            v.expensesBreakdown && v.expensesBreakdown.length > 0;
          return `
          <div class="folder-box ${hasHistory ? "has-expenses" : ""}" onclick="openNoirModal('${v.id}')">
            <div class="paper-sheet"></div>
            <div class="folder-main"></div>
            <div class="file-label">#${v.vAgentID}</div>
          </div>
        `;
        })
        .join("") +
      `<div class="folder-box" style="opacity:0.5;"><div class="folder-main" style="background:#999;"></div><div class="file-label">LOCKED</div></div>`;
  }, 1800);
}

// ====== BACK BUTTON ======
const btnBack = document.getElementById("btnBack");
if (btnBack) {
  btnBack.addEventListener("click", () => {
    SoundFX.click();
    document.getElementById("vagentSection").style.display = "none";
    document.getElementById("deviceSection").style.display = "grid";
    btnBack.style.display = "none";
    
    const deviceMemoirsContainer = document.getElementById("deviceMemoirsContainer");
    if (deviceMemoirsContainer) {
      deviceMemoirsContainer.innerHTML = "";
    }
  });
}

// ====== NOIR MODAL ======
window.openNoirModal = (docID) => {
  console.log("📋 Opening noir modal for:", docID);
  SoundFX.folderOpen();
  
  const data = allMissions.find((m) => m.id === docID);
  if (!data) {
    console.error("Document not found:", docID);
    SoundFX.error();
    return;
  }

  const overlay = document.getElementById("noirOverlay");
  overlay.style.display = "flex";

  document.getElementById("n-order").innerText = docID.substring(0, 12).toUpperCase();
  document.getElementById("n-vagent").innerText = data.vAgentID || "N/A";

  let expHTML = "";
  if (data.expensesBreakdown && Array.isArray(data.expensesBreakdown)) {
    const sorted = data.expensesBreakdown.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    expHTML = sorted
      .map((e) => {
        const d = e.timestamp ? new Date(e.timestamp) : new Date();
        const displayDate = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const intelDesc = e.description || getRandomIntelTerm();
        return `
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px; border-bottom: 1px dotted rgba(0,0,0,0.3); padding-bottom: 2px;">
          <span><span style="opacity:0.6;">${displayDate}</span> — ${intelDesc}</span>
          <b>₱${(e.amount || 0).toLocaleString()}</b>
        </div>`;
      })
      .join("");
  } else {
    expHTML = "<p style='font-size:10px; opacity:0.5; text-align:center;'>[ NO_OPERATIONAL_LOGS ]</p>";
  }

  document.getElementById("n-content").innerHTML = `
    <div style="font-size:11px; margin-bottom:12px;">
      <p><b>SecureLine:</b> <span class="secure-marker">${data.marker || "SECRET_LINE"}</span></p>
    </div>
    <p style="font-size:10px; font-weight:bold; border-top:1px solid #000; padding-top:10px; margin-bottom:8px; letter-spacing:1.5px;">OPERATIONAL_LOGS:</p>
    <div style="max-height:160px; overflow-y:auto; margin-bottom:15px; padding-right:5px;">${expHTML}</div>
    <center><button class="btn-terminate" onclick="terminateAgent('${docID}')">TERMINATE_AGENT</button></center>
  `;
  document.getElementById("n-total").innerText = `₱ ${(data.totalExpenses || 0).toLocaleString()}`;
};

window.closeNoir = () => {
  SoundFX.click();
  document.getElementById("noirOverlay").style.display = "none";
};

// ====== MEMOIRS FUNCTIONS ======
const ITEMS_PER_PAGE = 10;

window.flipPage = (forward) => {
  SoundFX.pageFlip();
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  if (forward) {
    p1.classList.add("flipped");
    p2.style.display = "flex";
  } else {
    p1.classList.remove("flipped");
    setTimeout(() => {
      p2.style.display = "none";
    }, 600);
  }
};

window.closeMemoirs = () => {
  SoundFX.click();
  document.getElementById("memoirsOverlay").style.display = "none";
  const selector = document.getElementById("deviceMonthSelector");
  if (selector) selector.remove();
  const masterPagination = document.getElementById("masterPagination");
  if (masterPagination) masterPagination.remove();
  const devicePagination = document.getElementById("devicePagination");
  if (devicePagination) devicePagination.remove();
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  if (p1) p1.classList.remove("flipped");
  if (p2) p2.style.display = "none";
};

window.openMemoirs = (mode) => {
  SoundFX.folderOpen();
  const overlay = document.getElementById("memoirsOverlay");
  overlay.style.display = "flex";
  if (mode === "ALL") {
    renderMasterMemoirs();
  } else {
    renderDevicePage(mode, 3, 0); // April fixed
  }
};

// ====== MASTER MEMOIRS ======
let masterCurrentPage = 0;
let masterTotalPages = 0;
let masterPages = [];

function renderMasterMemoirs() {
  masterCurrentPage = 0;
  masterPages = [];
  const FIXED_MONTH = 3; // April
  
  // Step 1: Group by weaponSystem (may laman)
  const weaponGroups = new Map();
  const noWeaponEntries = []; // Para sa mga walang weaponSystem
  
  for (const [deviceName, missions] of Object.entries(deviceData)) {
    // Skip kung invalid ang deviceName
    if (!deviceName || deviceName === "" || deviceName === "undefined" || deviceName === "null") {
      // Idagdag sa noWeaponEntries para sa hiwalay na section
      missions.forEach(mission => {
        if (mission.expensesBreakdown && Array.isArray(mission.expensesBreakdown)) {
          mission.expensesBreakdown.forEach(exp => {
            const expDate = new Date(exp.timestamp);
            if (expDate.getMonth() === FIXED_MONTH) {
              noWeaponEntries.push({
                missionID: mission.missionID || "???",
                vAgent: mission.vAgentID || null,
                date: expDate,
                amount: exp.amount,
                description: exp.description || getRandomIntelTerm(),
                originalDevice: deviceName
              });
            }
          });
        }
      });
      continue;
    }
    
    if (!weaponGroups.has(deviceName)) {
      weaponGroups.set(deviceName, { total: 0, vAgents: new Map(), unassigned: [] });
    }
    const group = weaponGroups.get(deviceName);
    
    missions.forEach(mission => {
      if (mission.expensesBreakdown && Array.isArray(mission.expensesBreakdown)) {
        mission.expensesBreakdown.forEach(exp => {
          const expDate = new Date(exp.timestamp);
          if (expDate.getMonth() === FIXED_MONTH) {
            group.total += exp.amount;
            const entry = {
              missionID: mission.missionID || "???",
              vAgent: mission.vAgentID || null,
              date: expDate,
              amount: exp.amount,
              description: exp.description || getRandomIntelTerm()
            };
            if (mission.vAgentID) {
              if (!group.vAgents.has(mission.vAgentID)) {
                group.vAgents.set(mission.vAgentID, { total: 0, logs: [] });
              }
              const vAgentData = group.vAgents.get(mission.vAgentID);
              vAgentData.total += exp.amount;
              vAgentData.logs.push(entry);
            } else {
              group.unassigned.push(entry);
            }
          }
        });
      }
    });
  }
  
  // Convert weapon groups to array and sort by total
  const weaponArray = Array.from(weaponGroups.entries()).map(([name, data]) => ({
    name,
    total: data.total,
    vAgents: Array.from(data.vAgents.entries()).map(([id, vData]) => ({
      vAgent: id,
      total: vData.total,
      logs: vData.logs.sort((a,b) => b.date - a.date)
    })).sort((a,b) => b.total - a.total),
    unassigned: data.unassigned.sort((a,b) => b.date - a.date)
  })).sort((a,b) => b.total - a.total);
  
  // Build flat items list for pagination
  let flatItems = [];
  
  // Add weapon systems (with vAgent and unassigned)
  for (const weapon of weaponArray) {
    // Weapon header
    flatItems.push({ type: 'weaponHeader', name: weapon.name, total: weapon.total });
    // Add vAgents
    for (const vAgent of weapon.vAgents) {
      flatItems.push({ type: 'vAgent', weaponName: weapon.name, vAgent: vAgent.vAgent, total: vAgent.total, logs: vAgent.logs });
    }
    // Add unassigned (walang vAgent pero may weaponSystem)
    if (weapon.unassigned.length > 0) {
      flatItems.push({ type: 'weaponUnassignedHeader', weaponName: weapon.name });
      for (const entry of weapon.unassigned) {
        flatItems.push({ type: 'unassignedEntry', ...entry });
      }
    }
  }
  
  // Add NO WEAPON SYSTEM section (kung may laman)
  if (noWeaponEntries.length > 0) {
    flatItems.push({ type: 'noWeaponHeader' });
    for (const entry of noWeaponEntries) {
      flatItems.push({ type: 'noWeaponEntry', ...entry });
    }
  }
  
  // Calculate total grand total (including unassigned and no weapon)
  const overallGrandTotal = weaponArray.reduce((sum, w) => sum + w.total, 0) + 
                            noWeaponEntries.reduce((sum, e) => sum + e.amount, 0);
  
  // Pagination: group into pages (each page can have multiple items)
  const itemsPerPage = 15; // 15 items per page (headers + entries)
  masterTotalPages = Math.ceil(flatItems.length / itemsPerPage);
  for (let i = 0; i < masterTotalPages; i++) {
    masterPages[i] = flatItems.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
  }
  
  const targetName = document.getElementById("target-name");
  const activeList = document.getElementById("active-list");
  const totalVal = document.getElementById("total-val");
  const flipNextBtn = document.getElementById("flipNextBtn");
  const p2Area = document.getElementById("weapon-system-breakdown");
  const totalValP2 = document.getElementById("total-val-p2");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  
  targetName.innerHTML = `📜 MASTER MEMOIRS <span style="font-size:9px; color:#888; margin-left:10px;">📅 APRIL 2024</span>`;
  flipNextBtn.style.display = "none";
  p2.style.display = "none";
  p1.classList.remove("flipped");
  
  function showPage(pageNum, animate = false) {
    const pageItems = masterPages[pageNum] || [];
    const isLastPage = (pageNum === masterTotalPages - 1);
    
    let html = '';
    let lastWeaponName = null;
    
    for (const item of pageItems) {
      if (item.type === 'weaponHeader') {
        html += `
          <div style="margin: 15px 0 10px 0; padding: 8px 12px; background: #2a1a1a; border-left: 5px solid #8b0000; color: #fff; font-weight: bold; font-size: 14px;">
            🔧 ${item.name} <span style="color: #8b0000; font-size: 12px;">(Total: ₱${item.total.toLocaleString()})</span>
          </div>
        `;
        lastWeaponName = item.name;
      } else if (item.type === 'vAgent') {
        html += `
          <div style="margin: 8px 0 4px 12px; font-weight: bold; color: #8b0000; font-size: 12px;">📌 vAgent# ${item.vAgent} (Total: ₱${item.total.toLocaleString()})</div>
        `;
        for (const log of item.logs) {
          const dateStr = `${log.date.getMonth()+1}/${log.date.getDate()}`;
          html += `
            <div style="display: flex; justify-content: space-between; padding: 4px 0 4px 20px; border-bottom: 1px dotted #ccc; font-size: 10px;">
              <div><span style="color:#8b0000;">MO#${log.missionID}</span> - ${dateStr} - ${log.description}</div>
              <div><b>₱${log.amount.toLocaleString()}</b></div>
            </div>
          `;
        }
      } else if (item.type === 'weaponUnassignedHeader') {
        html += `<div style="margin: 10px 0 6px 12px; color: #ffaa00; font-size: 11px; font-weight: bold;">⚠️ WITHOUT vAGENT (${item.weaponName})</div>`;
      } else if (item.type === 'unassignedEntry') {
        const dateStr = `${item.date.getMonth()+1}/${item.date.getDate()}`;
        html += `
          <div style="display: flex; justify-content: space-between; padding: 4px 0 4px 24px; border-bottom: 1px dotted #555; font-size: 10px;">
            <div><span style="color:#8b0000;">MO#${item.missionID}</span> - ${dateStr} - ${item.description}</div>
            <div><b>₱${item.amount.toLocaleString()}</b></div>
          </div>
        `;
      } else if (item.type === 'noWeaponHeader') {
        html += `
          <div style="margin: 20px 0 10px 0; padding: 8px 12px; background: #3a2a2a; border-left: 5px solid #ffaa00; color: #ffaa00; font-weight: bold; font-size: 13px;">
            ⚠️ MISSING WEAPON SYSTEM
          </div>
        `;
      } else if (item.type === 'noWeaponEntry') {
        const dateStr = `${item.date.getMonth()+1}/${item.date.getDate()}`;
        const vAgentDisplay = item.vAgent ? `vAgent# ${item.vAgent}` : "[NO vAGENT]";
        html += `
          <div style="display: flex; justify-content: space-between; padding: 4px 0 4px 12px; border-bottom: 1px dotted #555; font-size: 10px;">
            <div><span style="color:#ffaa00;">MO#${item.missionID}</span> - ${vAgentDisplay} - ${dateStr} - ${item.description}</div>
            <div><b>₱${item.amount.toLocaleString()}</b></div>
          </div>
        `;
      }
    }
    
    if (html === '') {
      html = '<center style="opacity:0.5; padding:20px;">[ NO EXPENSES FOR APRIL ]</center>';
    }
    
    // Flip animation
    if (animate) {
      activeList.style.transition = 'transform 0.4s ease-in-out';
      activeList.style.transform = 'rotateY(90deg)';
      setTimeout(() => {
        activeList.innerHTML = html;
        activeList.style.transform = 'rotateY(0deg)';
        setTimeout(() => { activeList.style.transition = ''; }, 400);
      }, 200);
    } else {
      activeList.innerHTML = html;
    }
    
    // Grand total on last page
    if (isLastPage) {
      totalVal.innerHTML = `<div style="background: #8b0000; color: #fff; padding: 10px 20px; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold;">GRAND TOTAL EXPENDITURE: ₱ ${overallGrandTotal.toLocaleString()}</div>`;
    } else {
      totalVal.innerHTML = `<span style="font-size: 12px; color: #aaa;">Page ${pageNum+1} of ${masterTotalPages} — Grand total on last page</span>`;
    }
    
    updatePagination(pageNum);
  }
  
  function updatePagination(pageNum) {
    const existing = document.getElementById("masterPagination");
    if (existing) existing.remove();
    if (masterTotalPages <= 1) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "masterPagination";
    paginationDiv.style.cssText = `display: flex; justify-content: center; gap: 20px; margin-top: 20px; padding: 12px; border-top: 1px solid #333;`;
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '◀ PREV PAGE';
    prevBtn.style.cssText = `background: ${pageNum > 0 ? '#8b0000' : '#444'}; color: white; border: none; padding: 8px 20px; border-radius: 30px; font-family: monospace; font-size: 11px; cursor: ${pageNum > 0 ? 'pointer' : 'not-allowed'};`;
    if (pageNum > 0) prevBtn.onclick = () => { SoundFX.click(); showPage(pageNum - 1, true); masterCurrentPage = pageNum - 1; };
    
    const pageInd = document.createElement('span');
    pageInd.innerHTML = `${pageNum+1} / ${masterTotalPages}`;
    pageInd.style.cssText = `color: #fff; background: #222; padding: 4px 12px; border-radius: 20px; font-family: monospace;`;
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'NEXT PAGE ▶';
    nextBtn.style.cssText = `background: ${pageNum < masterTotalPages-1 ? '#8b0000' : '#444'}; color: white; border: none; padding: 8px 20px; border-radius: 30px; font-family: monospace; font-size: 11px; cursor: ${pageNum < masterTotalPages-1 ? 'pointer' : 'not-allowed'};`;
    if (pageNum < masterTotalPages-1) nextBtn.onclick = () => { SoundFX.click(); showPage(pageNum + 1, true); masterCurrentPage = pageNum + 1; };
    
    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInd);
    paginationDiv.appendChild(nextBtn);
    activeList.parentNode.insertBefore(paginationDiv, activeList.nextSibling);
  }
  
  showPage(0, false);
}

// ====== DEVICE MEMOIRS ======
function renderDevicePage(deviceName, monthIndex, pageNum) {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  // Get all missions for this device
  const deviceMissions = allMissions.filter(m => m.weaponSystem === deviceName);
  
  let allExpenses = [];
  deviceMissions.forEach(mission => {
    if (mission.expensesBreakdown && Array.isArray(mission.expensesBreakdown)) {
      mission.expensesBreakdown.forEach(exp => {
        const expDate = new Date(exp.timestamp);
        const expMonth = expDate.getMonth();
        if (expMonth === monthIndex) {
          allExpenses.push({
            vAgent: mission.vAgentID || null,
            missionID: mission.missionID || "???",
            date: expDate,
            amount: exp.amount,
            description: exp.description || getRandomIntelTerm()
          });
        }
      });
    }
  });
  
  // Group by vAgent
  const groups = new Map();
  allExpenses.forEach(exp => {
    const key = exp.vAgent === null ? "__UNASSIGNED__" : exp.vAgent;
    if (!groups.has(key)) {
      groups.set(key, { vAgent: exp.vAgent, total: 0, logs: [] });
    }
    const group = groups.get(key);
    group.total += exp.amount;
    group.logs.push(exp);
  });
  
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    if (a.vAgent === null) return 1;
    if (b.vAgent === null) return -1;
    return b.total - a.total;
  });
  
  const flattenedLogs = [];
  sortedGroups.forEach(group => {
    group.logs.sort((x, y) => y.date - x.date);
    flattenedLogs.push(...group.logs);
  });
  
  const totalExpenses = flattenedLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalPages = Math.ceil(flattenedLogs.length / ITEMS_PER_PAGE);
  const startIdx = pageNum * ITEMS_PER_PAGE;
  const pageLogs = flattenedLogs.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  
  let logsHTML = '';
  let lastVAgent = null;
  pageLogs.forEach(log => {
    const currentVAgent = log.vAgent === null ? null : log.vAgent;
    if (currentVAgent !== lastVAgent) {
      if (currentVAgent === null) {
        logsHTML += `<div class="audit-separator" style="margin:15px 0 10px 0;">--- UNASSIGNED RECORDS (No vAgent#) ---</div>`;
      } else {
        const group = groups.get(currentVAgent);
        const totalAmt = group ? group.total : 0;
        logsHTML += `<div style="font-size:12px; font-weight:bold; color:#8b0000; margin-top:12px; margin-bottom:6px;">📌 vAgent# ${currentVAgent} (Total: ₱${totalAmt.toLocaleString()})</div>`;
      }
      lastVAgent = currentVAgent;
    }
    const dateStr = `${log.date.getMonth()+1}/${log.date.getDate()}`;
    logsHTML += `
      <div class="expense-row" style="padding: 4px 0; margin-left: 12px;">
        <div style="flex-grow:1; font-size: 10px;">
          ${log.vAgent === null ? `<span style="color:#8b0000;">MO#${log.missionID}</span> - ` : ''}${dateStr} - ${log.description}
        </div>
        <div><b>₱${log.amount.toLocaleString()}</b></div>
      </div>
    `;
  });
  
  if (pageLogs.length === 0) logsHTML = '<center style="opacity:0.5; padding:20px;">[ NO EXPENSES FOR THIS MONTH ]</center>';
  
  const targetName = document.getElementById("target-name");
  const activeList = document.getElementById("active-list");
  const totalVal = document.getElementById("total-val");
  const flipNextBtn = document.getElementById("flipNextBtn");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  
  targetName.innerHTML = `${deviceName} <span style="font-size:9px; color:#888;">(April only)</span>`;
  
  let monthSelector = document.getElementById("deviceMonthSelector");
  if (!monthSelector) {
    monthSelector = document.createElement('select');
    monthSelector.id = "deviceMonthSelector";
    monthSelector.style.cssText = `background:#222; border:1px solid #5c7882; color:#5c7882; padding:4px 8px; border-radius:4px; margin-left:10px; cursor:not-allowed; opacity:0.6;`;
    monthSelector.disabled = true;
    targetName.parentNode.insertBefore(monthSelector, targetName.nextSibling);
  }
  monthSelector.innerHTML = '';
  for (let i=0; i<monthNames.length; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = monthNames[i];
    if (i === monthIndex) opt.selected = true;
    monthSelector.appendChild(opt);
  }
  
  activeList.innerHTML = logsHTML;
  const isLastPage = (pageNum === totalPages - 1) || totalPages === 0;
  if (isLastPage) {
    totalVal.innerHTML = `<div style="background: #8b0000; color: #fff; padding: 6px 12px; border-radius: 6px; display: inline-block; font-size: 14px; font-weight: bold;">TOTAL EXPENDITURE: ₱ ${totalExpenses.toLocaleString()}</div>`;
  } else {
    totalVal.innerHTML = `<span style="font-size: 12px; color: #aaa;">Page ${pageNum+1} of ${totalPages} — Total on last page</span>`;
  }
  
  const existingPagination = document.getElementById("devicePagination");
  if (existingPagination) existingPagination.remove();
  
  if (totalPages > 1) {
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "devicePagination";
    paginationDiv.style.cssText = `display: flex; justify-content: center; gap: 15px; margin-top: 15px; padding: 10px; border-top: 1px solid #333;`;
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '◀ PREV';
    prevBtn.style.cssText = `background: ${pageNum > 0 ? '#8b0000' : '#444'}; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 10px; cursor: ${pageNum > 0 ? 'pointer' : 'not-allowed'};`;
    if (pageNum > 0) prevBtn.onclick = () => { SoundFX.click(); renderDevicePage(deviceName, monthIndex, pageNum - 1); };
    const pageInd = document.createElement('span');
    pageInd.innerHTML = `${pageNum+1} / ${totalPages}`;
    pageInd.style.cssText = `color: #fff; background: #222; padding: 2px 8px; border-radius: 12px;`;
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'NEXT ▶';
    nextBtn.style.cssText = `background: ${pageNum < totalPages-1 ? '#8b0000' : '#444'}; color: white; border: none; padding: 6px 15px; border-radius: 20px; font-size: 10px; cursor: ${pageNum < totalPages-1 ? 'pointer' : 'not-allowed'};`;
    if (pageNum < totalPages-1) nextBtn.onclick = () => { SoundFX.click(); renderDevicePage(deviceName, monthIndex, pageNum + 1); };
    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInd);
    paginationDiv.appendChild(nextBtn);
    activeList.parentNode.insertBefore(paginationDiv, activeList.nextSibling);
  }
  
  flipNextBtn.style.display = "none";
  p1.classList.remove("flipped");
  p2.style.display = "none";
}

// ====== TERMINATE AGENT ======
window.terminateAgent = async (docID) => {
  const confirmTerminate = confirm("⚠️ WARNING: This will permanently delete the mission order. Are you sure?");
  if (!confirmTerminate) return;
  const doubleConfirm = prompt("Type 'TERMINATE' to confirm:");
  if (doubleConfirm !== "TERMINATE") { alert("Aborted."); return; }
  SoundFX.error();
  try {
    await deleteDoc(doc(db, "mission_orders", docID));
    SoundFX.success();
    alert("✅ AGENT TERMINATED");
    closeNoir();
    location.reload();
  } catch (error) {
    SoundFX.error();
    alert("❌ TERMINATION FAILED: " + error.message);
  }
};
