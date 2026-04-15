// js/script.js - CIA Profiles Main Logic with Sounds
// ========================================

import SoundFX from './sound.js';
import { db, DEVICE_REGISTRY, INTEL_TERMS } from "./config.js";
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

      if (data.vAgentID) {
        const deviceName =
          DEVICE_REGISTRY[data.weaponSystem] || data.weaponSystem;
        if (!deviceData[deviceName]) {
          deviceData[deviceName] = [];
        }
        deviceData[deviceName].push(docWithID);
      }
    });

    console.log("Device Data:", deviceData);
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

    const sorted = deviceData[name].sort(
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

  document.getElementById("n-order").innerText = docID
    .substring(0, 12)
    .toUpperCase();
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
        const intelDesc = e.description || "FIELD_OPERATION";
        return `
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px; border-bottom: 1px dotted rgba(0,0,0,0.3); padding-bottom: 2px;">
          <span><span style="opacity:0.6;">${displayDate}</span> — ${intelDesc}</span>
          <b>₱${(e.amount || 0).toLocaleString()}</b>
        </div>`;
      })
      .join("");
  } else {
    expHTML =
      "<p style='font-size:10px; opacity:0.5; text-align:center;'>[ NO_OPERATIONAL_LOGS ]</p>";
  }

  document.getElementById("n-content").innerHTML = `
    <div style="font-size:11px; margin-bottom:12px;">
      <p><b>SecureLine:</b> <span class="secure-marker">${
        data.marker || "SECRET_LINE"
      }</span></p>
    </div>
    <p style="font-size:10px; font-weight:bold; border-top:1px solid #000; padding-top:10px; margin-bottom:8px; letter-spacing:1.5px;">OPERATIONAL_LOGS:</p>
    <div style="max-height:160px; overflow-y:auto; margin-bottom:15px; padding-right:5px;">${expHTML}</div>
    <center><button class="btn-terminate" onclick="terminateAgent('${docID}')">TERMINATE_AGENT</button></center>
  `;
  document.getElementById("n-total").innerText = `₱ ${(
    data.totalExpenses || 0
  ).toLocaleString()}`;
};

window.closeNoir = () => {
  console.log("🔐 Closing noir modal");
  SoundFX.click();
  document.getElementById("noirOverlay").style.display = "none";
};

// ====== MEMOIRS FUNCTIONS ======
let currentMemoirsMode = null;
let currentFilterMonth = null;
const ITEMS_PER_PAGE = 10;

window.flipPage = (forward) => {
  console.log("📖 Flipping page:", forward ? "forward" : "backward");
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
  console.log("📚 Closing memoirs");
  SoundFX.click();
  document.getElementById("memoirsOverlay").style.display = "none";
  const selector = document.getElementById("deviceMonthSelector");
  if (selector) selector.remove();
  const masterPagination = document.getElementById("masterPagination");
  if (masterPagination) masterPagination.remove();
  const devicePagination = document.getElementById("devicePagination");
  if (devicePagination) devicePagination.remove();
  // Reset flip state
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  if (p1) p1.classList.remove("flipped");
  if (p2) p2.style.display = "none";
};

window.openMemoirs = (mode) => {
  console.log("📚 Opening memoirs for mode:", mode);
  SoundFX.folderOpen();
  
  const overlay = document.getElementById("memoirsOverlay");
  overlay.style.display = "flex";
  
  if (mode === "ALL") {
    renderMasterMemoirs();
  } else {
    currentMemoirsMode = mode;
    const FIXED_MONTH = 3; // April
    renderDevicePage(mode, FIXED_MONTH, 0);
  }
};

// ====== MASTER MEMOIRS (UNIQUE, WITH FLIP ANIMATION) ======
let masterCurrentPage = 0;
let masterTotalPages = 0;
let masterDevicesList = [];

function renderMasterMemoirs() {
  // Reset to first page
  masterCurrentPage = 0;
  
  // Prepare data: collect all devices with their April expenses
  masterDevicesList = [];
  for (const [deviceName, missions] of Object.entries(deviceData)) {
    let totalExpenses = 0;
    let expenseEntries = [];
    
    missions.forEach(mission => {
      if (mission.expensesBreakdown && Array.isArray(mission.expensesBreakdown)) {
        mission.expensesBreakdown.forEach(exp => {
          const expDate = new Date(exp.timestamp);
          const expMonth = expDate.getMonth();
          if (expMonth === 3) { // April only
            totalExpenses += exp.amount;
            expenseEntries.push({
              missionID: mission.missionID || "???",
              vAgent: mission.vAgentID || null,
              date: expDate,
              amount: exp.amount,
              description: exp.description || "FIELD_OPERATION"
            });
          }
        });
      }
    });
    
    if (expenseEntries.length > 0) {
      masterDevicesList.push({
        name: deviceName,
        total: totalExpenses,
        expenses: expenseEntries.sort((a, b) => b.date - a.date)
      });
    }
  }
  
  // Sort by total expenses (highest first)
  masterDevicesList.sort((a, b) => b.total - a.total);
  masterTotalPages = Math.ceil(masterDevicesList.length / ITEMS_PER_PAGE);
  
  // Get DOM elements
  const targetName = document.getElementById("target-name");
  const activeList = document.getElementById("active-list");
  const totalVal = document.getElementById("total-val");
  const flipNextBtn = document.getElementById("flipNextBtn");
  const p2Area = document.getElementById("weapon-system-breakdown");
  const totalValP2 = document.getElementById("total-val-p2");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  
  // Set title (no cyan)
  targetName.innerHTML = `📜 MASTER MEMOIRS <span style="font-size:9px; color:#888; margin-left:10px;">📅 APRIL 2024</span>`;
  
  // Hide original flip button
  flipNextBtn.style.display = "none";
  p2.style.display = "none";
  p1.classList.remove("flipped");
  
  function showPage(pageNum, animate = false) {
    const start = pageNum * ITEMS_PER_PAGE;
    const pageDevices = masterDevicesList.slice(start, start + ITEMS_PER_PAGE);
    const overallGrandTotal = masterDevicesList.reduce((sum, d) => sum + d.total, 0);
    const isLastPage = (pageNum === masterTotalPages - 1) || masterTotalPages === 0;
    
    let devicesHTML = '';
    pageDevices.forEach(device => {
      const assignedExpenses = device.expenses.filter(exp => exp.vAgent !== null);
      const unassignedExpenses = device.expenses.filter(exp => exp.vAgent === null);
      
      devicesHTML += `
        <div style="margin-bottom: 25px; border-left: 3px solid #8b0000; padding-left: 12px; background: rgba(0,0,0,0.2); border-radius: 0 8px 8px 0;">
          <div style="font-size: 14px; font-weight: bold; color: #fff; margin-bottom: 8px; padding-top: 6px;">
            🔧 ${device.name} <span style="color: #8b0000; font-size: 12px;">(Total: ₱${device.total.toLocaleString()})</span>
          </div>
      `;
      
      if (assignedExpenses.length > 0) {
        devicesHTML += `<div style="margin-left: 8px; margin-bottom: 6px;"><span style="color:#aaa; font-size:10px;">▶ WITH vAGENT</span></div>`;
        assignedExpenses.forEach(exp => {
          const dateStr = `${exp.date.getMonth()+1}/${exp.date.getDate()}`;
          devicesHTML += `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; margin-left: 12px; border-bottom: 1px dotted #333;">
              <div style="flex-grow:1; font-size: 11px;">
                <span style="color:#8b0000;">MO#${exp.missionID}</span> - <span style="color:#8b0000;">vAgent# ${exp.vAgent}</span> - ${dateStr} - ${exp.description}
              </div>
              <div style="font-weight: bold; color: #fff;">₱${exp.amount.toLocaleString()}</div>
            </div>
          `;
        });
      }
      
      if (unassignedExpenses.length > 0) {
        devicesHTML += `<div style="margin-left: 8px; margin-top: 8px; margin-bottom: 6px;"><span style="color:#aaa; font-size:10px;">⚠️ WITHOUT vAGENT</span></div>`;
        unassignedExpenses.forEach(exp => {
          const dateStr = `${exp.date.getMonth()+1}/${exp.date.getDate()}`;
          devicesHTML += `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; margin-left: 12px; border-bottom: 1px dotted #333;">
              <div style="flex-grow:1; font-size: 11px;">
                <span style="color:#8b0000;">MO#${exp.missionID}</span> - <span style="color:#aaa;">[NO vAGENT]</span> - ${dateStr} - ${exp.description}
              </div>
              <div style="font-weight: bold; color: #fff;">₱${exp.amount.toLocaleString()}</div>
            </div>
          `;
        });
      }
      
      devicesHTML += `</div>`;
    });
    
    if (pageDevices.length === 0) {
      devicesHTML = '<center style="opacity:0.5; padding:20px;">[ NO EXPENSES FOR APRIL ]</center>';
    }
    
    // Flip animation
    if (animate) {
      activeList.style.transition = 'transform 0.4s ease-in-out';
      activeList.style.transform = 'rotateY(90deg)';
      setTimeout(() => {
        activeList.innerHTML = devicesHTML;
        activeList.style.transform = 'rotateY(0deg)';
        setTimeout(() => {
          activeList.style.transition = '';
        }, 400);
      }, 200);
    } else {
      activeList.innerHTML = devicesHTML;
    }
    
    // Total display (no emoji, no cyan)
    if (isLastPage) {
      totalVal.innerHTML = `<div style="background: #8b0000; color: #fff; padding: 8px 16px; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">TOTAL EXPENDITURE: ₱ ${overallGrandTotal.toLocaleString()}</div>`;
    } else {
      totalVal.innerHTML = `<span style="font-size: 12px; color: #aaa;">Page ${pageNum+1} of ${masterTotalPages} — Total expenditure on last page</span>`;
    }
    
    updatePaginationControls(pageNum);
  }
  
  function updatePaginationControls(pageNum) {
    const existingPag = document.getElementById("masterPagination");
    if (existingPag) existingPag.remove();
    
    if (masterTotalPages <= 1) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "masterPagination";
    paginationDiv.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 20px;
      padding: 12px;
      border-top: 1px solid #333;
    `;
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '◀ PREV PAGE';
    prevBtn.style.cssText = `
      background: ${pageNum > 0 ? '#8b0000' : '#444'};
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 30px;
      font-family: monospace;
      font-size: 11px;
      cursor: ${pageNum > 0 ? 'pointer' : 'not-allowed'};
      opacity: ${pageNum > 0 ? '1' : '0.5'};
      transition: 0.2s;
    `;
    if (pageNum > 0) {
      prevBtn.onclick = () => {
        SoundFX.click();
        masterCurrentPage--;
        showPage(masterCurrentPage, true);
      };
    }
    
    const pageIndicator = document.createElement('span');
    pageIndicator.innerHTML = `${pageNum+1} / ${masterTotalPages}`;
    pageIndicator.style.cssText = `
      color: #fff;
      font-family: monospace;
      font-size: 13px;
      background: #222;
      padding: 4px 12px;
      border-radius: 20px;
    `;
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'NEXT PAGE ▶';
    nextBtn.style.cssText = `
      background: ${pageNum < masterTotalPages-1 ? '#8b0000' : '#444'};
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 30px;
      font-family: monospace;
      font-size: 11px;
      cursor: ${pageNum < masterTotalPages-1 ? 'pointer' : 'not-allowed'};
      opacity: ${pageNum < masterTotalPages-1 ? '1' : '0.5'};
      transition: 0.2s;
    `;
    if (pageNum < masterTotalPages-1) {
      nextBtn.onclick = () => {
        SoundFX.click();
        masterCurrentPage++;
        showPage(masterCurrentPage, true);
      };
    }
    
    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageIndicator);
    paginationDiv.appendChild(nextBtn);
    activeList.parentNode.insertBefore(paginationDiv, activeList.nextSibling);
  }
  
  showPage(0, false);
}

// ====== DEVICE MEMOIRS (SINGLE DEVICE) ======
function renderDevicePage(deviceName, monthIndex, pageNum) {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  // Get all missions for this device
  const deviceMissions = allMissions.filter(m => 
    (DEVICE_REGISTRY[m.weaponSystem] || m.weaponSystem) === deviceName
  );
  
  // Collect all expense entries with missionID
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
            description: exp.description || "FIELD_OPERATION",
            injectedBy: exp.injectedBy
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
  
  // Sort groups: assigned vAgents by total descending, then unassigned at the end
  const sortedGroups = Array.from(groups.values()).sort((a, b) => {
    if (a.vAgent === null) return 1;
    if (b.vAgent === null) return -1;
    return b.total - a.total;
  });
  
  // Flatten logs
  const flattenedLogs = [];
  sortedGroups.forEach(group => {
    group.logs.sort((x, y) => y.date - x.date);
    flattenedLogs.push(...group.logs);
  });
  
  const totalExpenses = flattenedLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalPages = Math.ceil(flattenedLogs.length / ITEMS_PER_PAGE);
  const startIdx = pageNum * ITEMS_PER_PAGE;
  const pageLogs = flattenedLogs.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  
  // Build HTML
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
    
    if (log.vAgent === null) {
      logsHTML += `
        <div class="expense-row" style="padding: 6px 0; margin-left: 12px;">
          <div style="flex-grow:1;">
            <div style="font-size:10px;"><span style="color:#8b0000;">MO#${log.missionID}</span> - ${dateStr} - ${log.description}</div>
          </div>
          <div><b>₱${log.amount.toLocaleString()}</b></div>
        </div>
      `;
    } else {
      logsHTML += `
        <div class="expense-row" style="padding: 6px 0; margin-left: 12px;">
          <div style="flex-grow:1;">
            <div style="font-size:10px; opacity:0.8;">${dateStr} - ${log.description}</div>
          </div>
          <div><b>₱${log.amount.toLocaleString()}</b></div>
        </div>
      `;
    }
  });
  
  if (pageLogs.length === 0) {
    logsHTML = '<center style="opacity:0.5; padding:20px;">[ NO EXPENSES FOR THIS MONTH ]</center>';
  }
  
  // Update DOM
  const targetName = document.getElementById("target-name");
  const activeList = document.getElementById("active-list");
  const totalVal = document.getElementById("total-val");
  const flipNextBtn = document.getElementById("flipNextBtn");
  const p2Area = document.getElementById("weapon-system-breakdown");
  const totalValP2 = document.getElementById("total-val-p2");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  
  targetName.innerHTML = `${deviceName} <span style="font-size:9px; color:#5c7882;">(April only)</span>`;
  
  // Month selector - disabled
  let monthSelector = document.getElementById("deviceMonthSelector");
  if (!monthSelector) {
    monthSelector = document.createElement('select');
    monthSelector.id = "deviceMonthSelector";
    monthSelector.style.cssText = `
      background: #222;
      border: 1px solid #5c7882;
      color: #5c7882;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 10px;
      margin-left: 10px;
      cursor: not-allowed;
      opacity: 0.6;
    `;
    monthSelector.disabled = true;
    targetName.parentNode.insertBefore(monthSelector, targetName.nextSibling);
  }
  monthSelector.innerHTML = '';
  for (let i = 0; i < monthNames.length; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = monthNames[i];
    if (i === monthIndex) option.selected = true;
    monthSelector.appendChild(option);
  }
  
  activeList.innerHTML = logsHTML;
  
  // Show total only on last page
  const isLastPage = (pageNum === totalPages - 1) || totalPages === 0;
  if (isLastPage) {
    totalVal.innerHTML = `<span style="font-size:16px;">₱ ${totalExpenses.toLocaleString()}</span>`;
  } else {
    totalVal.innerHTML = `<span style="font-size:12px; opacity:0.7;">(Total on last page)</span>`;
  }
  
  // Pagination controls
  const existingPagination = document.getElementById("devicePagination");
  if (existingPagination) existingPagination.remove();
  
  if (totalPages > 1) {
    const paginationDiv = document.createElement('div');
    paginationDiv.id = "devicePagination";
    paginationDiv.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-top: 15px;
      padding: 10px;
      border-top: 1px solid #333;
    `;
    
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '◀ PREV';
    prevBtn.style.cssText = `
      background: ${pageNum > 0 ? '#8b0000' : '#444'};
      color: #fff;
      border: none;
      padding: 6px 15px;
      border-radius: 20px;
      font-family: monospace;
      font-size: 10px;
      cursor: ${pageNum > 0 ? 'pointer' : 'not-allowed'};
      opacity: ${pageNum > 0 ? '1' : '0.5'};
    `;
    if (pageNum > 0) {
      prevBtn.onclick = () => {
        SoundFX.click();
        renderDevicePage(deviceName, monthIndex, pageNum - 1);
      };
    }
    
    const pageIndicator = document.createElement('span');
    pageIndicator.innerHTML = `${pageNum + 1} / ${totalPages}`;
    pageIndicator.style.cssText = `
      color: #fff;
      font-family: monospace;
      font-size: 11px;
      padding: 0 10px;
    `;
    
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'NEXT ▶';
    nextBtn.style.cssText = `
      background: ${pageNum < totalPages - 1 ? '#8b0000' : '#444'};
      color: #fff;
      border: none;
      padding: 6px 15px;
      border-radius: 20px;
      font-family: monospace;
      font-size: 10px;
      cursor: ${pageNum < totalPages - 1 ? 'pointer' : 'not-allowed'};
      opacity: ${pageNum < totalPages - 1 ? '1' : '0.5'};
    `;
    if (pageNum < totalPages - 1) {
      nextBtn.onclick = () => {
        SoundFX.click();
        renderDevicePage(deviceName, monthIndex, pageNum + 1);
      };
    }
    
    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageIndicator);
    paginationDiv.appendChild(nextBtn);
    activeList.parentNode.insertBefore(paginationDiv, activeList.nextSibling);
  }
  
  flipNextBtn.style.display = "none";
  p1.classList.remove("flipped");
  p2.style.display = "none";
  p2Area.innerHTML = '';
  totalValP2.innerText = '';
}

// ====== TERMINATE AGENT ======
window.terminateAgent = async (docID) => {
    console.log("🔫 Terminating agent for mission:", docID);
    
    const confirmTerminate = confirm("⚠️ WARNING: This will permanently delete the mission order.\n\nAre you sure you want to TERMINATE this agent?");
    if (!confirmTerminate) {
        console.log("Termination cancelled");
        return;
    }
    
    const doubleConfirm = prompt("FINAL WARNING: This action cannot be undone!\n\nType 'TERMINATE' to confirm:");
    if (doubleConfirm !== "TERMINATE") {
        alert("Termination aborted.");
        return;
    }
    
    SoundFX.error();
    
    try {
        await deleteDoc(doc(db, "mission_orders", docID));
        console.log("✅ Mission terminated successfully:", docID);
        SoundFX.success();
        alert("✅ AGENT TERMINATED SUCCESSFULLY");
        closeNoir();
        location.reload();
    } catch (error) {
        console.error("❌ Termination failed:", error);
        SoundFX.error();
        alert("❌ TERMINATION FAILED: " + error.message);
    }
};
