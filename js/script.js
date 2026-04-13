// js/script.js - CIA PROFILES (same agent retrieval as dashboard)
// ========================================

import { db, DEVICE_REGISTRY, INTEL_TERMS } from "./config.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("✅ Modules loaded successfully");

// ====== GLOBAL STATE ======
let deviceData = {};
let allMissions = [];
// ⭐ SAME AS DASHBOARD
const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "AGENT_LZ";

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
  } catch (error) {
    console.error("❌ Error loading mission data:", error);
    renderDevices();
  }
}

// ====== GET NEON NUMBER ======
function getNeonNumber(index) {
  return (index % 6) + 1;
}

// ====== ASSIGN PHONE POSITION ======
function assignPhonePosition(wrapper, index, total) {
  if (index === 0) {
    wrapper.classList.add('left-phone');
  } else if (index === total - 1) {
    wrapper.classList.add('right-phone');
  } else {
    wrapper.classList.add('center-phone');
  }
}

// ====== DEVICE RENDERING (WITH 4D REALISTIC PHONES) ======
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
    const neonNumber = getNeonNumber(idx);
    const wrapper = document.createElement("div");
    wrapper.className = "phone-wrapper";
    wrapper.setAttribute("data-neon", neonNumber);
    assignPhonePosition(wrapper, idx, keys.length);
    
    wrapper.innerHTML = `
      <div class="phone-body">
        <div class="power-btn"></div>
        <div class="volume-up"></div>
        <div class="volume-down"></div>
        <div class="dynamic-island"></div>
        <div class="phone-screen">
          <div class="typing-text" align="center">WELCOME<br>NODE_${name}</div>
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
  
  element.classList.remove("lights-on");
  void element.offsetWidth;
  element.classList.add("lights-on");
  
  if ("vibrate" in navigator) {
    navigator.vibrate(50);
  }
  
  const statusLabel = element.querySelector(".status-label");
  statusLabel.innerHTML = "[ UPLINK_SYNC_DATA ]";
  statusLabel.classList.add("uplink-sync");

  setTimeout(() => {
    document.getElementById("deviceSection").style.display = "none";
    document.getElementById("vagentSection").style.display = "grid";
    document.getElementById("btnBack").style.display = "block";

    document.getElementById("memoirsBtnContainer").innerHTML = `
      <button onclick="openMemoirs('${name}')" style="background:none; border:1px solid var(--cia-red); color:var(--cia-red); padding:10px; width:100%; cursor:pointer; font-weight: bold;">[ VIEW_${name}_MEMOIRS ]</button>
    `;

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
    document.getElementById("vagentSection").style.display = "none";
    document.getElementById("deviceSection").style.display = "grid";
    btnBack.style.display = "none";
  });
}

// ====== NOIR MODAL ======
window.openNoirModal = (docID) => {
  console.log("📋 Opening noir modal for:", docID);
  const data = allMissions.find((m) => m.id === docID);
  if (!data) {
    console.error("Document not found:", docID);
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
    expHTML = sorted.map((e) => {
      const d = e.timestamp ? new Date(e.timestamp) : new Date();
      const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:6px; border-bottom: 1px dotted rgba(0,0,0,0.3); padding-bottom: 2px;">
          <span><span style="opacity:0.6;">${displayDate}</span> — ${e.description || "FIELD_OPERATION"}</span>
          <b>₱${(e.amount || 0).toLocaleString()}</b>
        </div>`;
    }).join("");
  } else {
    expHTML = "<p style='font-size:10px; opacity:0.5; text-align:center;'>[ NO_OPERATIONAL_LOGS ]</p>";
  }

  document.getElementById("n-content").innerHTML = `
    <div style="font-size:11px; margin-bottom:12px;">
      <p><b>SecureLine:</b> <span class="secure-marker">${data.marker || "SECRET_LINE"}</span></p>
    </div>
    <p style="font-size:10px; font-weight:bold; border-top:1px solid #000; padding-top:10px; margin-bottom:8px;">OPERATIONAL_LOGS:</p>
    <div style="max-height:160px; overflow-y:auto; margin-bottom:15px;">${expHTML}</div>
    <center><button class="btn-terminate" onclick="alert('Auth Required')">TERMINATE_AGENT</button></center>
  `;
  document.getElementById("n-total").innerText = `₱ ${(data.totalExpenses || 0).toLocaleString()}`;
};

window.closeNoir = () => {
  document.getElementById("noirOverlay").style.display = "none";
};

// ====== MEMOIRS FUNCTIONS ======
window.flipPage = (forward) => {
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
  document.getElementById("memoirsOverlay").style.display = "none";
};

window.openMemoirs = (mode) => {
  console.log("📚 Opening memoirs for mode:", mode);
  const overlay = document.getElementById("memoirsOverlay");
  overlay.style.display = "flex";
  flipPage(false);

  let filtered = mode === "ALL" ? allMissions : allMissions.filter(
    (m) => (DEVICE_REGISTRY[m.weaponSystem] || m.weaponSystem) === mode
  );

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

  let p1HTML = "", p2HTML = "";
  let overallTotal = 0;

  masterList.forEach((m, index) => {
    overallTotal += m.totalExpenses || 0;
    const missionRef = m.id.substring(0, 10).toUpperCase();
    const agentName = m.agent || "UNKNOWN_OPERATIVE";

    let rowContent = `
      <div class="expense-row" style="padding: 10px 0; border-bottom: 1px dashed rgba(0,0,0,0.2);">
        <div style="flex-grow: 1;">
          <div style="font-size: 11px; font-weight: bold;">
            ${m.isV ? `vAgent#: <span style="color:#8b0000;">${m.vAgentID}</span>` : `AGENT: ${agentName}`}
          </div>
          ${m.isV ? `<div style="font-size: 9px; opacity: 0.7;">OPERATOR: ${agentName}</div>` : ""}
          <div style="font-size: 8px; margin-top: 2px;">MO#: ${missionRef}</div>
        </div>
        <div style="text-align: right;">
          <b style="font-size: 14px;">₱${(m.totalExpenses || 0).toLocaleString()}</b>
        </div>
      </div>`;

    if (mode !== "ALL") {
      p1HTML += rowContent;
    } else {
      if (index < 10) p1HTML += rowContent;
      else p2HTML += rowContent;
    }
  });

  document.getElementById("active-list").innerHTML = p1HTML || "<center style='opacity:0.5;'>NO_RECORDS</center>";
  document.getElementById("target-name").innerText = mode;
  document.getElementById("total-val").innerText = overallTotal.toLocaleString();

  const p2Area = document.getElementById("weapon-system-breakdown");
  if (mode === "ALL") {
    p2Area.innerHTML = p2HTML || "<center style='margin-top:50px; opacity:0.5;'>[ NO_OVERFLOW_DATA ]</center>";
    document.getElementById("flipNextBtn").style.display = "block";
  } else {
    document.getElementById("flipNextBtn").style.display = "none";
  }
  document.getElementById("total-val-p2").innerText = overallTotal.toLocaleString();
};
