// js/jsdash.js - CORE DASHBOARD SYSTEM (APPLIED LOGIC)

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
    }).catch(e => console.error(e));
}

function hideAllButtons() {
    actionBtn.classList.add('hidden');
    reserveBtn.classList.add('hidden');
}

function showActionButton(text, className, onClickHandler) {
    actionBtn.textContent = text;
    actionBtn.className = `btn ${className}`;
    actionBtn.classList.remove('hidden');
    actionBtn.onclick = onClickHandler;
}

function showReserveButton(onClickHandler) {
    reserveBtn.classList.remove('hidden');
    reserveBtn.onclick = onClickHandler;
}

// ========== SEARCH LOGIC (NEON STATUS) ==========
async function searchMission(missionID) {
    statusLabel.innerHTML = '<span style="color: #00f3ff;">SCANNING...</span>';
    hideAllButtons();

    try {
        const docRef = doc(db, "mission_orders", missionID);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            currentMissionData = snap.data();
            const { status, agent } = currentMissionData;

            if (status === "TERMINATED") {
                statusLabel.innerHTML = '<span style="color:#ff003c; text-shadow: 0 0 8px #ff003c;">STATUS: TERMINATED</span>';
                showActionButton("VIEW", "btn-view", () => openViewModal(missionID, currentMissionData));
            } 
            else if (agent === currentAgent) {
                const isReserved = status === "RESERVED";
                statusLabel.innerHTML = `<span style="color:${isReserved ? '#ffbd00' : '#007bff'}; text-shadow: 0 0 8px ${isReserved ? '#ffbd00' : '#007bff'};">STATUS: ${status} (YOURS)</span>`;
                showActionButton("RETRIEVE", "btn-retrieve", () => openRetrieveModal(missionID, currentMissionData));
            } 
            else {
                statusLabel.innerHTML = `<span style="color:#ff003c;">OWNED BY: ${agent}</span>`;
                addLog(`ACCESS DENIED: Mission ${missionID} owned by ${agent}`, "#ff003c");
                hideAllButtons();
            }
        } else {
            currentMissionData = null;
            statusLabel.innerHTML = '<span style="color:#05ffa1; text-shadow: 0 0 8px #05ffa1;">STATUS: AVAILABLE</span>';
            showActionButton("SAVE", "btn-save", () => openDeployModal(missionID));
            showReserveButton(() => openReserveConfirm(missionID));
        }
    } catch (e) { 
        console.error("Search Error:", e);
        statusLabel.innerHTML = '<span style="color:#ff003c;">CONNECTION ERROR</span>';
    }
}

// ========== MODAL LOGIC (DEPLOY / RETRIEVE / VIEW) ==========
async function openDeployModal(missionID) {
    setupModal(missionID, "DEPLOY", "btn-save", false);
    modalSubmit.onclick = () => submitToFirebase(missionID, "DEPLOYED", false);
}

async function openRetrieveModal(missionID, data) {
    setupModal(missionID, "UPDATE", "btn-retrieve", false);
    vAgentInput.value = data.vAgentID || "";
    if (data.SecureLine && data.SecureLine !== "NONE" && data.SecureLine !== "") {
        toggleSecureField(true, data.SecureLine);
    }
    await loadWeapons();
    renderWeapons(data.weaponSystem, false);
    modalSubmit.onclick = () => submitToFirebase(missionID, data.status, true);
}

function openViewModal(missionID, data) {
    setupModal(missionID, "CLOSE", "btn-view", true);
    vAgentInput.value = data.vAgentID || "";
    if (data.SecureLine && data.SecureLine !== "NONE" && data.SecureLine !== "") {
        toggleSecureField(true, data.SecureLine);
    }
    loadWeapons().then(() => renderWeapons(data.weaponSystem, true));
    modalSubmit.onclick = () => {
        modalOverlay.style.display = 'none';
        resetModalFields();
    };
    modalSubmit.classList.add('hidden');
}

function setupModal(missionID, buttonText, buttonClass, readOnly = false) {
    popHeader.innerHTML = `${missionID}<div style="color:#5c7882; font-size:10px; margin-top:5px;">###</div>`;
    vAgentInput.value = "";
    vAgentInput.disabled = readOnly;
    selectedWeaponID = "";
    toggleSecureField(false);
    secureField.disabled = readOnly;
    modalOverlay.style.display = 'flex';
    modalSubmit.textContent = buttonText;
    modalSubmit.className = `btn ${buttonClass}`;
    modalSubmit.classList.remove('hidden');
    modalClose.onclick = () => {
        modalOverlay.style.display = 'none';
        resetModalFields();
    };
    if (!readOnly) {
        loadWeapons().then(() => renderWeapons(null, false));
    }
}

function resetModalFields() {
    vAgentInput.disabled = false;
    secureField.disabled = false;
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
}

// ========== FIREBASE OPERATIONS ==========
async function submitToFirebase(missionID, status, isUpdate = false) {
    const vID = vAgentInput.value.trim();
    if (!vID) {
        alert("REQUIRED: vAGENT ID");
        return;
    }
    if (!selectedWeaponID) {
        alert("REQUIRED: WEAPON SYSTEM");
        return;
    }

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
        addLog(`MISSION ${missionID} ${isUpdate ? 'UPDATED' : 'DEPLOYED'} by ${currentAgent}`, isUpdate ? "#007bff" : "#05ffa1");
        modalOverlay.style.display = 'none';
        resetApp();
        alert(`MISSION ${missionID} ${isUpdate ? 'UPDATED' : 'DEPLOYED'} SUCCESSFULLY!`);
    } catch (e) { 
        console.error(e);
        alert("SYSTEM ERROR: " + e.message); 
    }
}

async function openReserveConfirm(missionID) {
    if (confirm(`Do you want to RESERVE mission order #${missionID} to your RESERVE LIST?`)) {
        try {
            await setDoc(doc(db, "mission_orders", missionID), {
                missionID: missionID, 
                agent: currentAgent, 
                status: "RESERVED", 
                timestamp: serverTimestamp()
            });
            addLog(`MISSION ${missionID} RESERVED by ${currentAgent}`, "#ffbd00");
            alert(`Mission ${missionID} has been reserved successfully!`);
            resetApp();
        } catch (e) { 
            console.error(e);
            alert("RESERVE ERROR: " + e.message);
        }
    }
}

// ========== WEAPON SYSTEM ENGINE ==========
async function loadWeapons() {
    try {
        const q = query(collection(db, "agents"), where("agentName", "==", currentAgent));
        const snap = await getDocs(q);
        agentWeapons = !snap.empty ? (snap.docs[0].data().weaponSystem || []) : ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        if (agentWeapons.length === 0) {
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
    } catch(e) {
        console.error(e);
        agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
    }
}

function renderWeapons(highlightWeapon = null, disabled = false) {
    weaponList.innerHTML = "";
    agentWeapons.forEach(weaponName => {
        const btn = document.createElement('button');
        btn.className = `weapon-btn ${weaponName === highlightWeapon ? 'selected' : ''}`;
        if (weaponName === highlightWeapon) {
            selectedWeaponID = weaponName;
        }
        btn.innerText = `> ${weaponName}`;
        
        if (disabled) {
            btn.style.pointerEvents = "none";
            btn.style.opacity = "0.6";
        } else {
            btn.onclick = () => {
                document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
                btn.classList.add('selected');
                selectedWeaponID = weaponName;
            };
        }
        weaponList.appendChild(btn);
    });
}

// ========== UI HELPERS ==========
function toggleSecureField(show, value = "") {
    if (show) {
        secureField.classList.add('show');
        secureBtn.style.display = 'none';
        secureField.value = value;
    } else {
        secureField.classList.remove('show');
        secureBtn.style.display = 'block';
        secureField.value = "";
    }
}

function resetApp() {
    input.value = "";
    statusLabel.innerHTML = "";
    hideAllButtons();
    currentMissionData = null;
}

// ========== AUTO SEARCH ==========
function onMissionInput() {
    const val = input.value.trim();
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    if (val.length === 0) {
        resetApp();
        return;
    }
    
    if (val.length < 4) {
        statusLabel.innerHTML = '<span style="color:#ffbd00;">ENTER 4-5 DIGITS</span>';
        hideAllButtons();
        return;
    }
    
    const missionID = padID(val);
    searchTimeout = setTimeout(() => {
        searchMission(missionID);
    }, 500);
}

// ========== TERMINAL LISTENER ==========
function setupTerminalListener() {
    const q = query(collection(db, "terminal_logs"), orderBy("timestamp", "desc"), limit(10));
    onSnapshot(q, (snap) => {
        terminal.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            const time = data.timestamp ? data.timestamp.toDate().toLocaleTimeString('en-GB') : "--:--";
            let color = data.color;
            if (data.message.includes("DEPLOYED")) color = "#05ffa1";
            if (data.message.includes("UPDATED")) color = "#007bff";
            if (data.message.includes("RESERVED")) color = "#ffbd00";
            if (data.message.includes("DENIED")) color = "#ff003c";
            terminal.innerHTML += `<div class="term-line"><span style="color:#5c7882">[${time}]</span> <span style="color:${color}">${data.message}</span></div>`;
        });
    }, (error) => {
        console.error("Terminal error:", error);
    });
}

// ========== INITIALIZATION ==========
async function init() {
    profName.innerText = currentAgent.toUpperCase();
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    
    setInterval(() => { 
        clockSpan.textContent = new Date().toLocaleTimeString('en-GB'); 
    }, 1000);
    
    setupTerminalListener();
    await loadWeapons();
    
    input.addEventListener('input', onMissionInput);
    secureBtn.onclick = () => toggleSecureField(true);
    
    hideAllButtons();
    
    console.log("Dashboard ready for agent:", currentAgent);
}

init();
