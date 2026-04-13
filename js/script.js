// js/script.js
// CIA Profiles Main Logic
// ========================================

// ⭐ IMPORT FROM SAME FOLDER (js/)
import { db, DEVICE_REGISTRY, INTEL_TERMS } from "./config.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("✅ Modules loaded successfully");
console.log("DB:", db);
console.log("DEVICE_REGISTRY:", DEVICE_REGISTRY);

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
    renderDevices(); // Render empty state
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
    `
    )
    .join("");
}

// ====== DEVICE ACTIVATION ======
window.activateDevice = (name, element) => {
  console.log("🎯 Activating device:", name);
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
};

// ====== NOIR MODAL (DOSSIER VIEW) ======
window.openNoirModal = (docID) => {
  console.log("📋 Opening noir modal for:", docID);
  const data = allMissions.find((m) => m.id === docID);
  if (!data) {
    console.error("Document not found:", docID);
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
    <center><button class="btn-terminate" onclick="alert('Auth Required')">TERMINATE_AGENT</button></center>
  `;
  document.getElementById("n-total").innerText = `₱ ${(
    data.totalExpenses || 0
  ).toLocaleString()}`;
};

window.closeNoir = () => {
  console.log("🔐 Closing noir modal");
  document.getElementById("noirOverlay").style.display = "none";
};

// ====== MEMOIRS BOOK (FLIP LOGIC) ======
window.flipPage = (forward) => {
  console.log("📖 Flipping page:", forward ? "forward" : "backward");
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
  document.getElementById("memoirsOverlay").style.display = "none";
};

// ====== MEMOIRS RENDERING ======
window.openMemoirs = (mode) => {
  console.log("📚 Opening memoirs for mode:", mode);
  const overlay = document.getElementById("memoirsOverlay");
  overlay.style.display = "flex";
  flipPage(false);

  // Filter missions
  let filtered =
    mode === "ALL"
      ? allMissions
      : allMissions.filter(
          (m) =>
            (DEVICE_REGISTRY[m.weaponSystem] || m.weaponSystem) === mode
        );

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

    // Add separator for unassigned records
    const isFirstUnassigned =
      !m.isV && (index === 0 || masterList[index - 1].isV);
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
            ${
              m.isV
                ? `vAgent#: <span style="color:#8b0000;">${m.vAgentID}</span>`
                : `AGENT: ${agentName}`
            }
          </div>
          ${
            m.isV
              ? `<div style="font-size: 9px; opacity: 0.7;">OPERATOR: ${agentName}</div>`
              : ""
          }
          <div style="font-size: 8px; color: #000; font-weight: bold; margin-top: 2px;">
            MO#: ${missionRef}
          </div>
        </div>
        <div style="text-align: right;">
          <b style="font-size: 14px; color: #000;">₱${(
            m.totalExpenses || 0
          ).toLocaleString()}</b>
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
    p1HTML ||
    "<center style='opacity:0.5; padding-top:20px;'>NO_RECORDS</center>";
  document.getElementById("target-name").innerText = mode;
  document.getElementById("total-val").innerText = overallTotal.toLocaleString();

  // Update Page 2
  const p2Area = document.getElementById("weapon-system-breakdown");
  if (mode === "ALL") {
    p2Area.innerHTML =
      p2HTML ||
      `<center style="margin-top:50px; font-size:10px; opacity:0.5;">[ NO_OVERFLOW_DATA ]</center>`;
    document.getElementById("flipNextBtn").style.display = "block";
  } else {
    document.getElementById("flipNextBtn").style.display = "none";
  }

  document.getElementById("total-val-p2").innerText =
    overallTotal.toLocaleString();

  console.log("✅ Memoirs rendered successfully");
};

/* ====== 4D REALISTIC PHONE STYLES ====== */

.phone-wrapper {
  perspective: 1200px !important;
  transform-style: preserve-3d !important;
}

.phone-body {
  width: 120px !important;
  height: 240px !important;
  background: linear-gradient(145deg, #1a1f28, #0a0e15) !important;
  border-radius: 32px !important;
  position: relative !important;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
  cursor: pointer !important;
}

/* NEON COLORS */
.phone-wrapper[data-neon="1"] .phone-body { box-shadow: 0 0 15px #00f3ff, inset 0 0 8px rgba(0,243,255,0.5) !important; }
.phone-wrapper[data-neon="2"] .phone-body { box-shadow: 0 0 15px #ff00ff, inset 0 0 8px rgba(255,0,255,0.5) !important; }
.phone-wrapper[data-neon="3"] .phone-body { box-shadow: 0 0 15px #00ff88, inset 0 0 8px rgba(0,255,136,0.5) !important; }
.phone-wrapper[data-neon="4"] .phone-body { box-shadow: 0 0 15px #ff6600, inset 0 0 8px rgba(255,102,0,0.5) !important; }
.phone-wrapper[data-neon="5"] .phone-body { box-shadow: 0 0 15px #ff0066, inset 0 0 8px rgba(255,0,102,0.5) !important; }
.phone-wrapper[data-neon="6"] .phone-body { box-shadow: 0 0 15px #ffff00, inset 0 0 8px rgba(255,255,0,0.5) !important; }

/* HOVER EFFECTS */
.phone-wrapper.left-phone .phone-body:hover {
  transform: rotateY(-15deg) rotateX(5deg) translateX(15px) translateZ(20px) !important;
}

.phone-wrapper.right-phone .phone-body:hover {
  transform: rotateY(15deg) rotateX(5deg) translateX(-15px) translateZ(20px) !important;
}

.phone-wrapper.center-phone .phone-body:hover {
  transform: rotateX(5deg) translateZ(30px) !important;
}

/* 4K BOOT ANIMATION */
.phone-wrapper.lights-on .phone-body {
  animation: phoneBoot 0.8s ease-out forwards !important;
}

@keyframes phoneBoot {
  0% { transform: scale(0.95); filter: brightness(0.3) blur(2px); }
  20% { transform: scale(1.02); filter: brightness(1.5); box-shadow: 0 0 30px cyan; }
  100% { transform: scale(1); filter: brightness(1); }
}

/* SIDE BUTTONS */
.phone-body .power-btn {
  position: absolute; right: -3px; top: 80px;
  width: 5px; height: 35px;
  background: linear-gradient(90deg, #4a5058, #2a2f35);
  border-radius: 3px;
}

.phone-body .volume-up, .phone-body .volume-down {
  position: absolute; left: -3px;
  width: 5px;
  background: linear-gradient(90deg, #4a5058, #2a2f35);
  border-radius: 3px;
}
.phone-body .volume-up { top: 60px; height: 28px; }
.phone-body .volume-down { top: 98px; height: 28px; }

/* DYNAMIC ISLAND */
.phone-body .dynamic-island {
  position: absolute; top: 12px; left: 50%;
  transform: translateX(-50%);
  width: 90px; height: 26px;
  background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
  border-radius: 20px;
  z-index: 10;
}

.phone-body .dynamic-island::before {
  content: ''; position: absolute; top: 6px; right: 10px;
  width: 8px; height: 8px;
  background: radial-gradient(circle, #1a3a5c, #0a1a2c);
  border-radius: 50%;
}

/* PHONE SCREEN */
.phone-screen {
  position: absolute; top: 48px; left: 6px; right: 6px; bottom: 6px;
  background: #000;
  border-radius: 24px;
  overflow: hidden;
}

/* GLASS REFLECTION */
.phone-body::before {
  content: ''; position: absolute; top: 5%; left: 5%;
  width: 90%; height: 20%;
  background: radial-gradient(ellipse at top, rgba(255,255,255,0.15), transparent);
  border-radius: 20px;
  pointer-events: none;
    }
