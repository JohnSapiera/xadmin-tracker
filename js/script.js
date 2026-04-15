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

    // Device-specific memoirs button
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
    
    // Clear device memoirs button
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
  // Remove temporary month selector if exists
  const selector = document.getElementById("deviceMonthSelector");
  if (selector) selector.remove();
};

window.openMemoirs = (mode) => {
  console.log("📚 Opening memoirs for mode:", mode);
  SoundFX.folderOpen();
  
  const overlay = document.getElementById("memoirsOverlay");
  overlay.style.display = "flex";
  
  if (mode === "ALL") {
    // Original ALL memoirs (no month filter)
    renderAllMemoirs();
  } else {
    // Device-specific memoirs with month filter
    currentMemoirsMode = mode;
    const currentMonth = new Date().getMonth(); // 0=Jan, 3=April
    renderDeviceMemoirs(mode, currentMonth);
  }
};

function renderAllMemoirs() {
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
  document.getElementById("total-val-p2").innerText = overallTotal.toLocaleString();
}

function renderDeviceMemoirs(deviceName, monthIndex) {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonth = monthNames[monthIndex];
  
  // Get missions for this device
  const deviceMissions = allMissions.filter(m => 
    (DEVICE_REGISTRY[m.weaponSystem] || m.weaponSystem) === deviceName
  );
  
  // Collect all expense entries with their vAgentID and date
  let allExpenses = [];
  deviceMissions.forEach(mission => {
    if (mission.expensesBreakdown && Array.isArray(mission.expensesBreakdown)) {
      mission.expensesBreakdown.forEach(exp => {
        const expDate = new Date(exp.timestamp);
        const expMonth = expDate.getMonth();
        if (expMonth === monthIndex) {
          allExpenses.push({
            vAgent: mission.vAgentID,
            date: expDate,
            amount: exp.amount,
            description: exp.description || "FIELD_OPERATION",
            injectedBy: exp.injectedBy
          });
        }
      });
    }
  });
  
  // Sort by date (newest first)
  allExpenses.sort((a, b) => b.date - a.date);
  
  // Calculate total
  const total = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Get DOM elements
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");
  const activeList = document.getElementById("active-list");
  const targetName = document.getElementById("target-name");
  const totalVal = document.getElementById("total-val");
  const flipBtn = document.getElementById("flipNextBtn");
  const p2Area = document.getElementById("weapon-system-breakdown");
  const totalValP2 = document.getElementById("total-val-p2");
  
  // Set title
  targetName.innerHTML = `${deviceName} <span style="font-size:8px; margin-left:10px;">MONTH: ${currentMonth}</span>`;
  
  // Create or update month selector
  let monthSelector = document.getElementById("deviceMonthSelector");
  if (!monthSelector) {
    monthSelector = document.createElement('div');
    monthSelector.id = "deviceMonthSelector";
    monthSelector.style.cssText = 'display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; justify-content: center;';
    targetName.parentNode.insertBefore(monthSelector, targetName.nextSibling);
  }
  monthSelector.innerHTML = '';
  for (let i = 0; i < monthNames.length; i++) {
    const btn = document.createElement('button');
    btn.innerText = monthNames[i];
    btn.style.cssText = `
      background: ${i === monthIndex ? '#8b0000' : 'transparent'};
      border: 1px solid #8b0000;
      color: ${i === monthIndex ? '#fff' : '#8b0000'};
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      cursor: pointer;
      font-family: monospace;
    `;
    btn.onclick = (function(m) { return function() { renderDeviceMemoirs(deviceName, m); }; })(i);
    monthSelector.appendChild(btn);
  }
  
  // Build expense list HTML
  let expensesHTML = '';
  if (allExpenses.length === 0) {
    expensesHTML = '<center style="opacity:0.5; padding:20px;">[ NO EXPENSES FOR THIS MONTH ]</center>';
  } else {
    allExpenses.forEach(exp => {
      const dateStr = `${exp.date.getMonth()+1}/${exp.date.getDate()}`;
      expensesHTML += `
        <div class="expense-row" style="padding: 8px 0;">
          <div style="flex-grow:1;">
            <div style="font-size:11px; font-weight:bold;">vAgent#: <span style="color:#8b0000;">${exp.vAgent}</span></div>
            <div style="font-size:9px; opacity:0.7;">${dateStr} - ${exp.description}</div>
          </div>
          <div><b>₱${exp.amount.toLocaleString()}</b></div>
        </div>
      `;
    });
  }
  
  // Pagination (10 items per page)
  const pageSize = 10;
  const hasMore = allExpenses.length > pageSize;
  let p1HTML = expensesHTML;
  let p2HTML = '';
  
  if (hasMore) {
    p1HTML = allExpenses.slice(0, pageSize).map(exp => {
      const dateStr = `${exp.date.getMonth()+1}/${exp.date.getDate()}`;
      return `
        <div class="expense-row" style="padding: 8px 0;">
          <div style="flex-grow:1;">
            <div style="font-size:11px; font-weight:bold;">vAgent#: <span style="color:#8b0000;">${exp.vAgent}</span></div>
            <div style="font-size:9px; opacity:0.7;">${dateStr} - ${exp.description}</div>
          </div>
          <div><b>₱${exp.amount.toLocaleString()}</b></div>
        </div>
      `;
    }).join('');
    p2HTML = allExpenses.slice(pageSize).map(exp => {
      const dateStr = `${exp.date.getMonth()+1}/${exp.date.getDate()}`;
      return `
        <div class="expense-row" style="padding: 8px 0;">
          <div style="flex-grow:1;">
            <div style="font-size:11px; font-weight:bold;">vAgent#: <span style="color:#8b0000;">${exp.vAgent}</span></div>
            <div style="font-size:9px; opacity:0.7;">${dateStr} - ${exp.description}</div>
          </div>
          <div><b>₱${exp.amount.toLocaleString()}</b></div>
        </div>
      `;
    }).join('');
  }
  
  activeList.innerHTML = p1HTML;
  totalVal.innerText = total.toLocaleString();
  
  if (hasMore) {
    p2Area.innerHTML = p2HTML;
    flipBtn.style.display = "block";
    totalValP2.innerText = total.toLocaleString();
  } else {
    flipBtn.style.display = "none";
    p2Area.innerHTML = '';
  }
  
  // Ensure page 1 is visible and page 2 hidden if not flipped
  p1.classList.remove("flipped");
  p2.style.display = "none";
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
