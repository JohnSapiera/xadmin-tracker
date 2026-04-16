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

// ====== DATA LOADING (includes all missions) ======
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

      // ✅ Diretso na ang weaponSystem (readable name na)
      const deviceName = data.weaponSystem;
      if (!deviceData[deviceName]) {
        deviceData[deviceName] = [];
      }
      deviceData[deviceName].push(docWithID);
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

// ====== NOIR MODAL (vAgent Dossier) ======
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

// ====== MASTER MEMOIRS (remastered) ======
let masterCurrentPage = 0;
let masterPages = [];
let masterTotalPages = 0;

function renderMasterMemoirs() {
  masterCurrentPage = 0;
  masterPages = [];
  
  // Group expenses by weapon system (device name)
  const weaponGroups = new Map();
  
  for (const [deviceName, missions] of Object.entries(deviceData)) {
    if (!weaponGroups.has(deviceName)) {
      weaponGroups.set(deviceName, { total: 0, vAgents: new Map(), unassigned: [] });
    }
    const group = weaponGroups.get(deviceName);
    
    missions.forEach(mission => {
      if (mission.expensesBreakdown && Array.isArray(mission.expensesBreakdown)) {
        mission.expensesBreakdown.forEach(exp => {
          const expDate = new Date(exp.timestamp);
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
        });
      }
    });
  }
  
  // Convert to array and sort
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
  
  // Build pages (simplified for brevity - keep existing logic but remove DEVICE_REGISTRY)
  // ... (rest of master memoirs logic remains the same)
  
  // For brevity, I'll show the key fix - the rest of your master memoirs code can stay
  // Just remove any DEVICE_REGISTRY references
}

// ====== DEVICE MEMOIRS ======
function renderDevicePage(deviceName, monthIndex, pageNum) {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  // ✅ Diretso na, hindi na gumagamit ng DEVICE_REGISTRY
  const deviceMissions = allMissions.filter(m => m.weaponSystem === deviceName);
  
  // ... rest of the function remains the same
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
