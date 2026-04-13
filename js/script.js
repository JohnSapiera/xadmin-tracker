// script.js - CIA Profiles Main Logic
import { db, DEVICE_REGISTRY, INTEL_TERMS } from "js/config.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ====== GLOBAL STATE ======
let deviceData = {};
let allMissions = [];
const currentAgent = localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("display-agent").innerText = currentAgent;
  loadMissionData();
});

// ====== DATA LOADING ======
async function loadMissionData() {
  try {
    const q = query(collection(db, "mission_orders"), where("agent", "==", currentAgent));
    const snap = await getDocs(q);
    allMissions = [];
    deviceData = {};

    snap.forEach((doc) => {
      const data = doc.data();
      const docWithID = { ...data, id: doc.id };
      allMissions.push(docWithID);

      if (data.vAgentID) {
        const deviceName = DEVICE_REGISTRY[data.weaponSystem] || data.weaponSystem;
        if (!deviceData[deviceName]) {
          deviceData[deviceName] = [];
        }
        deviceData[deviceName].push(docWithID);
      }
    });

    renderDevices();
  } catch (error) {
    console.error("Error loading mission data:", error);
    renderDevices(); // Render empty state
  }
}

// ====== DEVICE RENDERING ======
function renderDevices() {
  const grid = document.getElementById("deviceSection");
  const keys = Object.keys(deviceData);

  if (keys.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; opacity:0.5;">[ NO_ACTIVE_DATA ]</p>`;
    return;
  }

  grid.innerHTML = keys
    .map(
      (name) => `
      <div class="phone-wrapper" onclick="activateDevice('${name}', this)">
        <div class="phone-body">
          <div class="phone-screen">
            <div class="typing-text">WELCOME<br>NODE_${name}</div>
          </div>
        </div>
        <div class="status-label">[ STANDBY_LINK ]</div>
      </div>
    `,
    )
    .join("");
}

// ====== DEVICE ACTIVATION ======
window.activateDevice = (name, element) => {
  element.classList.add("lights-on");
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

    const sorted = deviceData[name].sort((a, b) => parseInt(a.vAgentID) - parseInt(b.vAgentID));
    document.getElementById("vagentSection").innerHTML =
      sorted
        .map((v) => {
          const hasHistory = v.expensesBreakdown && v.expensesBreakdown.length > 0;
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
};

// ====== NOIR MODAL (DOSSIER VIEW) ======
window.openNoirModal = (docID) => {
  const data = allMissions.find((m) => m.id === docID);
  if (!data) return;

  const overlay = document.getElementById("noirOverlay");
  overlay.style.display = "flex";

  document.getElementById("n-order").innerText = docID.substring(0, 12).toUpperCase();
  document.getElementById("n-vagent").innerText = data.vAgentID || "N/A";

  let expHTML = "";
  if (data.expensesBreakdown && Array.isArray(data.expensesBreakdown)) {
    const sorted = data.expensesBreakdown.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    expHTML = sorted
      .map((e) => {
        const d = e.timestamp ? new Date(e.timestamp) : new Date();
        const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const intelDesc = e.description || "FIELD_OPERATION";
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
    <center><button class="btn-terminate" onclick="alert('Auth Required')">TERMINATE_AGENT</button></center>
  `;
  document.getElementById("n-total").innerText = `₱ ${(data.totalExpenses || 0).toLocaleString()}`;
};

window.closeNoir = () => {
  document.getElementById("noirOverlay").style.display = "none";
};

// ====== MEMOIRS BOOK (FLIP LOGIC) ======
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

// ====== MEMOIRS RENDERING ======
window.openMemoirs = (mode) => {
  const overlay = document.getElementById("memoirsOverlay");
  overlay.style.display = "flex";
  flipPage(false);

  // Filter missions
  let filtered =
    mode === "ALL"
      ? allMissions
      : allMissions.filter((m) => (DEVICE_REGISTRY[m.weaponSystem] || m.weaponSystem) === mode);

  const valid = filtered.filter((m) => (m.totalExpenses || 0) > 0);

  // Separate vAgent and non-vAgent records
  const withV = valid.filter((m) => m.vAgentID && m.vAgentID !== "");
  const withoutV = valid.filter((m) => !m.vAgentID);

  // Sort vAgents by timestamp (newest first)
  withV.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  // Sort non-vAgents by amount (highest first)
  withoutV.sort((a, b) => (b.totalExpenses || 0) - (a.totalExpenses || 0));

  const masterList = [...withV.map((m) => ({ ...m, isV: true })), ...withoutV.map((m) => ({ ...m, isV: false }))];

  let p1HTML = "";
  let p2HTML = "";
  let overallTotal = 0;

  masterList.forEach((m, index) => {
    overallTotal += m.totalExpenses || 0;

    const missionRef = m.id.substring(0, 10).toUpperCase();
    const agentName = m.agent || "UNKNOWN_OPERATIVE";

    let rowContent = "";

    // Add separator for unassigned records
    const isFirstUnassigned = !m.isV && (index === 0 || masterList[index - 1].isV);
    if (isFirstUnassigned) {
      rowContent += `
        <div class="audit-separator" style="margin: 15px 0 10px 0; border-top: 1px solid #000;">
          --- UNASSIGNED_RECORDS ---
        </div>`;
    }

    rowContent += `
      <div class="expense-row" style="padding: 10px 0; border-bottom: 1px dashed rgba(0,0,0,0.2);">
        <div style="flex-grow: 1;">
          <div style="font-size: 11px; font-weight: bold; color: #000;">
            ${m.isV ? `vAgent#: <span style="color:#8b0000;">${m.vAgentID}</span>` : `AGENT: ${agentName}`}
          </div>
          ${m.isV ? `<div style="font-size: 9px; opacity: 0.7;">OPERATOR: ${agentName}</div>` : ""}
          <div style="font-size: 8px; color: #000; font-weight: bold; margin-top: 2px;">
            MO#: ${missionRef}
          </div>
        </div>
        <div style="text-align: right;">
          <b style="font-size: 14px; color: #000;">₱${(m.totalExpenses || 0).toLocaleString()}</b>
        </div>
      </div>`;

    // Distribute to pages
    if (mode !== "ALL") {
      p1HTML += rowContent;
    } else {
      if (index < 10) p1HTML += rowContent;
      else p2HTML += rowContent;
    }
  });

  // Update Page 1
  document.getElementById("active-list").innerHTML =
    p1HTML || "<center style='opacity:0.5; padding-top:20px;'>NO_RECORDS</center>";
  document.getElementById("target-name").innerText = mode;
  document.getElementById("total-val").innerText = overallTotal.toLocaleString();

  // Update Page 2
  const p2Area = document.getElementById("weapon-system-breakdown");
  if (mode === "ALL") {
    p2Area.innerHTML = p2HTML || `<center style="margin-top:50px; font-size:10px; opacity:0.5;">[ NO_OVERFLOW_DATA ]</center>`;
    document.getElementById("flipNextBtn").style.display = "block";
  } else {
    document.getElementById("flipNextBtn").style.display = "none";
  }

  document.getElementById("total-val-p2").innerText = overallTotal.toLocaleString();
};
