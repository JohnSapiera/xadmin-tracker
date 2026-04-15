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
        <button onclick="openMemoirs('${name}')" style="background:none; border:1px solid var(--cia-red); color:var(--cia-red); padding:10px; width:100%; cursor:pointer; font-weight: bold;">
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

// ====== MEMOIRS FUNCTIONS (ENHANCED) ======
let currentMemoirsMode = null;
let currentFilterMonth = null;
let currentDeviceExpenses = [];     // flattened list of expense entries for current device/month
let currentPage = 0;
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
  const prevBtn = document.getElementById("devicePrevBtn");
  if (prevBtn) prevBtn.remove();
};

window.openMemoirs = (mode) => {
  console.log("📚 Opening memoirs for mode:", mode);
  SoundFX.folderOpen();
  
  const overlay = document.getElementById("memoirsOverlay");
  overlay.style.display = "flex";
  
  if (mode === "ALL") {
    renderAllMemoirs();
  } else {
    currentMemoirsMode = mode;
    // Force April (month index 3) and disable month selector for now
    const FIXED_MONTH = 3; // April (0=Jan, 3=Apr)
    renderDevicePage(mode, FIXED_MONTH, 0);
  }
};

function renderAllMemoirs() {
  // Reset device-specific UI elements
  const selector = document.getElementById("deviceMonthSelector");
  if (selector) selector.remove();
  const prevBtn = document.getElementById("devicePrevBtn");
  if (prevBtn) prevBtn.remove();
  
  flipPage(false);
  
  let filtered = allMissions;
  const valid = filtered.filter((m) => (m.totalExpenses || 0) > 0);
  const withV = valid.filter((m) => m.vAgentID && m.vAgentID !== "");
  const withoutV = valid.filter((m) => !m.vAgentID);

  withV.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });
  withoutV.sort((a, b) => (b.totalExpenses || 0) - (a.totalExpenses || 0));

  const masterList = [
    ...withV.map((m) => ({ ...m, isV: true })),
    ...withoutV.map((m) => ({ ...m, isV: false })),
  ];

  let p1HTML = "";
  let p2HTML = "";
  let overallTotal = 0;

  masterList.forEach((m, index) => {
    overallTotal += m.totalExpenses || 0;
    const missionRef = m.id.substring(0, 10).toUpperCase();
    const agentName = m.agent || "UNKNOWN_OPERATIVE";

    let rowContent = "";
    const isFirstUnassigned = !m.isV && (index === 0 || masterList[index - 1].isV);
    if (isFirstUnassigned) {
      rowContent += `<div class="audit-separator">--- UNASSIGNED_RECORDS ---</div>`;
    }

    rowContent += `
      <div class="expense-row" style="padding: 8px 0;">
        <div style="flex-grow:1;">
          <div style="font-size:11px; font-weight:bold;">
            ${m.isV ? `vAgent#: <span style="color:#8b0000;">${m.vAgentID}</span>` : `AGENT: ${agentName}`}
          </div>
          ${m.isV ? `<div style="font-size:9px; opacity:0.7;">OPERATOR: ${agentName}</div>` : ""}
          <div style="font-size:8px;">MO#: ${missionRef}</div>
        </div>
        <div><b>₱${(m.totalExpenses || 0).toLocaleString()}</b></div>
      </div>`;

    if (index < 10) p1HTML += rowContent;
    else p2HTML += rowContent;
  });

  document.getElementById("active-list").innerHTML = p1HTML || "<center style='opacity:0.5;'>NO_RECORDS</center>";
  document.getElementById("target-name").innerText = "ALL";
  document.getElementById("total-val").innerText = overallTotal.toLocaleString();

  const p2Area = document.getElementById("weapon-system-breakdown");
  p2Area.innerHTML = p2HTML || "<center style='opacity:0.5;'>[ NO_OVERFLOW_DATA ]</center>";
  document.getElementById("flipNextBtn").style.display = p2HTML ? "block" : "none";
  document.getElementById("flipNextBtn").innerHTML = "[ VIEW_SUMMARY ] &gt;&gt;";
  document.getElementById("flipNextBtn").onclick = () => flipPage(true);
  document.getElementById("total-val-p2").innerText = overallTotal.toLocaleString();
}

function renderDevicePage(deviceName, monthIndex, pageNum) {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonth = monthNames[monthIndex];
  
  // Get all missions for this device
  const deviceMissions = allMissions.filter(m => 
    (DEVICE_REGISTRY[m.weaponSystem] || m.weaponSystem) === deviceName
  );
  
  // Collect all expense entries
  let allExpenses = [];
  deviceMissions.forEach(mission => {
    if (mission.expensesBreakdown && Array.isArray(mission.expensesBreakdown)) {
      mission.expensesBreakdown.forEach(exp => {
        const expDate = new Date(exp.timestamp);
        const expMonth = expDate.getMonth();
        if (expMonth === monthIndex) {
          allExpenses.push({
            vAgent: mission.vAgentID || null,
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
  
  // Flatten logs with group information
  const flattenedLogs = [];
  sortedGroups.forEach(group => {
    group.logs.sort((x, y) => y.date - x.date);
    flattenedLogs.push(...group.logs);
  });
  
  const totalExpenses = flattenedLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalPages = Math.ceil(flattenedLogs.length / ITEMS_PER_PAGE);
  const startIdx = pageNum * ITEMS_PER_PAGE;
  const pageLogs = flattenedLogs.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  
  // Build HTML with group headers for the page
  let logsHTML = '';
  let lastVAgent = null;
  pageLogs.forEach(log => {
    const currentVAgent = log.vAgent === null ? null : log.vAgent;
    if (currentVAgent !== lastVAgent) {
      if (currentVAgent === null) {
        logsHTML += `<div class="audit-separator" style="margin:15px 0 10px 0;">--- UNASSIGNED RECORDS ---</div>`;
      } else {
        const group = groups.get(currentVAgent);
        const totalAmt = group ? group.total : 0;
        logsHTML += `<div style="font-size:12px; font-weight:bold; color:#8b0000; margin-top:12px; margin-bottom:6px;">📌 vAgent# ${currentVAgent} (Total: ₱${totalAmt.toLocaleString()})</div>`;
      }
      lastVAgent = currentVAgent;
    }
    const dateStr = `${log.date.getMonth()+1}/${log.date.getDate()}`;
    logsHTML += `
      <div class="expense-row" style="padding: 6px 0; margin-left: 12px;">
        <div style="flex-grow:1;">
          <div style="font-size:10px; opacity:0.8;">${dateStr} - ${log.description}</div>
        </div>
        <div><b>₱${log.amount.toLocaleString()}</b></div>
      </div>
    `;
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
  
  // Month selector - disabled, fixed to April
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
  
  // Create pagination controls inside the active-list area or near it
  // Remove existing pagination controls first
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
      border-top: 1px solid var(--border);
    `;
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '◀ PREV';
    prevBtn.style.cssText = `
      background: ${pageNum > 0 ? '#8b0000' : '#333'};
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
    
    // Page indicator
    const pageIndicator = document.createElement('span');
    pageIndicator.innerHTML = `${pageNum + 1} / ${totalPages}`;
    pageIndicator.style.cssText = `
      color: var(--cyan);
      font-family: monospace;
      font-size: 11px;
      padding: 0 10px;
    `;
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'NEXT ▶';
    nextBtn.style.cssText = `
      background: ${pageNum < totalPages - 1 ? '#8b0000' : '#333'};
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
    
    // Insert pagination after active-list
    activeList.parentNode.insertBefore(paginationDiv, activeList.nextSibling);
  }
  
  // Hide the original flipNextBtn since we're using custom pagination
  flipNextBtn.style.display = "none";
  
  // Reset book pages (ensure page 1 visible)
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
