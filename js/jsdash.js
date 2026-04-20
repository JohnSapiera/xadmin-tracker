// js/jsdash.js - CORE DASHBOARD SYSTEM (FINAL BUILD)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, collection, query, where, getDocs, doc, 
    setDoc, addDoc, serverTimestamp, getDoc, onSnapshot, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ========== FIREBASE CONFIGURATION ==========
const firebaseConfig = { 
    apiKey: "AIzaSyD7SFXKTIx3ocIBD9B5JfWiI_sJmZPpbAI", 
    authDomain: "my-admin-portal-12691.firebaseapp.com", 
    projectId: "my-admin-portal-12691", 
    storageBucket: "my-admin-portal-12691.firebasestorage.app", 
    messagingSenderId: "317015091563", 
    appId: "1:317015091563:web:baab5171d8e0a58acd442e" 
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== DOM ELEMENTS ==========
const input = document.getElementById('mission-input');
const actionBtn = document.getElementById('action-btn');
const reserveBtn = document.getElementById('reserve-btn');
const statusLabel = document.getElementById('mission-status');
const terminal = document.getElementById('terminal');
const modalOverlay = document.getElementById('modal-overlay');
const modalSubmit = document.getElementById('modal-submit');
const modalClose = document.getElementById('modal-close');
const vAgentInput = document.getElementById('v-agent-input');
const secureField = document.getElementById('secure-input-field');
const secureBtn = document.getElementById('add-secure-line');
const weaponList = document.getElementById('weapon-list');
const clockSpan = document.getElementById('clock');
const profName = document.getElementById('prof-name');
const avatarInit = document.getElementById('avatar-init');
const popHeader = document.getElementById('pop-header');

// ========== GLOBAL STATE ==========
const currentAgent = localStorage.getItem("cia_agent") || localStorage.getItem("agent") || "UNKNOWN_AGENT";
let selectedWeaponID = "";
let agentWeapons = [];
let currentMissionData = null;
let searchTimeout = null;

console.log("Dashboard ready for agent:", currentAgent);

// ========== HELPER FUNCTIONS ==========
const padID = (val) => val.replace(/\D/g, '').padStart(5, '0').slice(-5);
const formatDate = (d) => `${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}/${d.getFullYear()}`;
const getRelieveDate = (d) => { let r = new Date(d); r.setDate(r.getDate() + 30); return formatDate(r); };

function addLog(msg, color) {
    addDoc(collection(db, "terminal_logs"), { 
        agent: currentAgent, message: msg, color: color, timestamp: serverTimestamp() 
    });
}

// ========== SEARCH LOGIC (NEON STATUS) ==========
async function searchMission(missionID) {
    statusLabel.innerHTML = '<span style="color: #00f3ff;">SCANNING...</span>';
    actionBtn.classList.add('hidden');
    reserveBtn.classList.add('hidden');

    try {
        const docRef = doc(db, "mission_orders", missionID);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            currentMissionData = snap.data();
            const { status, agent } = currentMissionData;

            if (status === "TERMINATED") {
                statusLabel.innerHTML = '<span style="color:#ff003c; text-shadow: 0 0 8px #ff003c;">STATUS: TERMINATED</span>';
                showAction("VIEW", "btn-view", () => openViewModal(missionID, currentMissionData));
            } 
            else if (agent === currentAgent) {
                const isR = status === "RESERVED";
                statusLabel.innerHTML = `<span style="color:${isR ? '#ffbd00' : '#007bff'}; text-shadow: 0 0 8px ${isR ? '#ffbd00' : '#007bff'};">STATUS: ${status} (YOURS)</span>`;
                showAction("RETRIEVE", "btn-retrieve", () => openRetrieveModal(missionID, currentMissionData));
            } 
            else {
                statusLabel.innerHTML = `<span style="color:#ff003c;">OWNED BY: ${agent}</span>`;
                addLog(`INVALID: DEPLOY BY OTHER AGENT (${missionID})`, "#ff003c");
            }
        } else {
            currentMissionData = null;
            statusLabel.innerHTML = '<span style="color:#05ffa1; text-shadow: 0 0 8px #05ffa1;">STATUS: AVAILABLE</span>';
            showAction("SAVE", "btn-save", () => openDeployModal(missionID));
            reserveBtn.classList.remove('hidden');
            reserveBtn.onclick = () => openReserveConfirm(missionID);
        }
    } catch (e) { console.error("Search Error:", e); }
}

const showAction = (txt, cls, fn) => {
    actionBtn.textContent = txt;
    actionBtn.className = `btn ${cls}`;
    actionBtn.classList.remove('hidden');
    actionBtn.onclick = fn;
};

// ========== MODAL LOGIC (DEPLOY / RETRIEVE / VIEW) ==========
async function openDeployModal(missionID) {
    setupModal(missionID, "DEPLOY", "btn-save");
    modalSubmit.onclick = () => submitToFirebase(missionID, "DEPLOYED");
}

async function openRetrieveModal(missionID, data) {
    setupModal(missionID, "UPDATE", "btn-retrieve");
    vAgentInput.value = data.vAgentID || "";
    if (data.SecureLine && data.SecureLine !== "NONE") toggleSecure(true, data.SecureLine);
    await loadWeapons();
    renderWeapons(data.weaponSystem);
    modalSubmit.onclick = () => submitToFirebase(missionID, data.status, true);
}

function openViewModal(missionID, data) {
    setupModal(missionID, "CLOSE", "btn-view", true);
    vAgentInput.value = data.vAgentID;
    toggleSecure(true, data.SecureLine);
    loadWeapons().then(() => renderWeapons(data.weaponSystem, true));
    modalSubmit.onclick = () => { modalOverlay.style.display = 'none'; modalSubmit.classList.remove('hidden'); };
    modalSubmit.classList.add('hidden'); // Itago ang submit sa view mode
}

function setupModal(id, btnTxt, btnCls, readOnly = false) {
    popHeader.innerHTML = `${id}<div style="color:#5c7882; font-size:10px; margin-top:5px;">###</div>`;
    vAgentInput.value = ""; vAgentInput.disabled = readOnly;
    selectedWeaponID = "";
    toggleSecure(false);
    modalOverlay.style.display = 'flex';
    modalSubmit.textContent = btnTxt;
    modalSubmit.className = `btn ${btnCls}`;
    modalClose.onclick = () => modalOverlay.style.display = 'none';
    if (!readOnly) { loadWeapons().then(() => renderWeapons()); }
}

// ========== FIREBASE OPERATIONS ==========
async function submitToFirebase(missionID, status, isUpdate = false) {
    const vID = vAgentInput.value.trim();
    if (!vID || !selectedWeaponID) return alert("REQUIRED: vAGENT ID & WEAPON SYSTEM");

    const now = new Date();
    const payload = {
        vAgentID: vID,
        weaponSystem: selectedWeaponID,
        SecureLine: secureField.value.trim() || "NONE",
        status: status,
        agent: currentAgent,
        missionID: missionID,
        timestamp: serverTimestamp()
    };

    if (!isUpdate) {
        payload.deploymentDate = formatDate(now);
        payload.relieveDate = getRelieveDate(now);
    }

    try {
        await setDoc(doc(db, "mission_orders", missionID), payload, { merge: true });
        addLog(`MISSION ${missionID} ${isUpdate ? 'UPDATED' : 'DEPLOYED'}`, isUpdate ? "#007bff" : "#05ffa1");
        modalOverlay.style.display = 'none';
        resetApp();
    } catch (e) { alert("SYSTEM ERROR: " + e.message); }
}

async function openReserveConfirm(missionID) {
    if (confirm(`Do you want to RESERVE mission_order #${missionID} to our RESERVE LIST?`)) {
        try {
            await setDoc(doc(db, "mission_orders", missionID), {
                missionID: missionID, agent: currentAgent, status: "RESERVED", timestamp: serverTimestamp()
            });
            addLog(`MISSION ${missionID} RESERVED BY ${currentAgent}`, "#ffbd00");
            resetApp();
        } catch (e) { console.error(e); }
    }
}

// ========== WEAPON SYSTEM ENGINE ==========
async function loadWeapons() {
    const q = query(collection(db, "agents"), where("agentName", "==", currentAgent));
    const snap = await getDocs(q);
    agentWeapons = !snap.empty ? (snap.docs[0].data().weaponSystem || []) : ["DEFAULT_SYSTEM"];
}

function renderWeapons(highlight = null, disabled = false) {
    weaponList.innerHTML = "";
    agentWeapons.forEach(w => {
        const b = document.createElement('button');
        b.className = `weapon-btn ${w === highlight ? 'selected' : ''}`;
        if (w === highlight) selectedWeaponID = w;
        b.innerText = `> ${w}`;
        if (!disabled) {
            b.onclick = () => {
                document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
                b.classList.add('selected');
                selectedWeaponID = w;
            };
        } else { b.style.pointerEvents = "none"; b.style.opacity = "0.6"; }
        weaponList.appendChild(b);
    });
}

// ========== UI HELPERS ==========
function toggleSecure(show, val = "") {
    secureField.classList.toggle('hidden', !show);
    secureBtn.style.display = show ? 'none' : 'block';
    if (show) { secureField.value = val; secureField.focus(); }
}

function resetApp() {
    input.value = ""; statusLabel.innerHTML = "";
    actionBtn.classList.add('hidden'); reserveBtn.classList.add('hidden');
}

// ========== INITIALIZATION ==========
function init() {
    setInterval(() => { clockSpan.textContent = new Date().toLocaleTimeString('en-GB'); }, 1000);
    profName.innerText = currentAgent.toUpperCase();
    avatarInit.innerText = currentAgent[0].toUpperCase();
    
    input.addEventListener('input', () => {
        if (searchTimeout) clearTimeout(searchTimeout);
        if (input.value.length >= 4) {
            searchTimeout = setTimeout(() => searchMission(padID(input.value)), 500);
        } else { resetApp(); }
    });

    secureBtn.onclick = () => toggleSecure(true);
    
    // Live Terminal listener
    onSnapshot(query(collection(db, "terminal_logs"), orderBy("timestamp", "desc"), limit(10)), (snap) => {
        terminal.innerHTML = "";
        snap.forEach(d => {
            const data = d.data();
            const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString('en-GB') : "--:--";
            terminal.innerHTML += `<div class="term-line"><span style="color:#5c7882">[${time}]</span> <span style="color:${data.color}">${data.message}</span></div>`;
        });
    });
}

init();
