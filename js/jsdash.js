// js/jsdash.js - CORE DASHBOARD (SEPARATED BUTTON LOGIC)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc, 
    addDoc, 
    serverTimestamp, 
    getDoc, 
    onSnapshot, 
    orderBy, 
    limit 
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
let currentMissionStatus = null;
let currentMissionOwner = null;

console.log("Dashboard ready for agent:", currentAgent);

// ========== HELPER FUNCTIONS ==========
function padMissionID(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length >= 5) return digits.slice(0, 5);
    return digits.padStart(5, '0');
}

function formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function calculateRelieveDate(deploymentDate) {
    const relieveDate = new Date(deploymentDate);
    relieveDate.setDate(relieveDate.getDate() + 30);
    return relieveDate;
}

function addLog(msg, color) {
    const logsRef = collection(db, "terminal_logs");
    addDoc(logsRef, { 
        agent: currentAgent, 
        message: msg, 
        color: color, 
        timestamp: serverTimestamp()
    }).catch(e => console.error(e));
}

function setupTerminalListener() {
    const logsRef = collection(db, "terminal_logs");
    const q = query(logsRef, orderBy("timestamp", "desc"), limit(15));
    
    onSnapshot(q, (snap) => {
        terminal.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            const time = d.timestamp ? d.timestamp.toDate().toLocaleTimeString('en-GB') : "--";
            let color = d.color;
            if (d.message.includes("DEPLOYED")) color = "#05ffa1";
            if (d.message.includes("UPDATED")) color = "#007bff";
            if (d.message.includes("RESERVED")) color = "#ffbd00";
            if (d.message.includes("TERMINATED")) color = "#ff003c";
            terminal.innerHTML += `<div class="term-line"><span style="color:#5c7882">[${time}]</span> <span style="color:${color}">${d.message}</span></div>`;
        });
    }, (error) => {
        console.error("Terminal listener error:", error);
    });
}

function addButtonClickEffect(btn) {
    btn.classList.add('btn-click-blink');
    setTimeout(() => btn.classList.remove('btn-click-blink'), 200);
}

function setButtonStyle(button, text, className, disabled = false) {
    button.textContent = text;
    button.className = `btn ${className}`;
    button.disabled = disabled;
    button.style.opacity = disabled ? "0.5" : "1";
    button.style.pointerEvents = disabled ? "none" : "auto";
    button.style.cursor = disabled ? "default" : "pointer";
}

function closeModal() {
    modalOverlay.style.display = 'none';
    vAgentInput.disabled = false;
    secureField.disabled = false;
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    });
}

function resetUI() {
    statusLabel.innerHTML = "";
    currentMissionData = null;
    currentMissionStatus = null;
    currentMissionOwner = null;
}

// ========== LOAD WEAPON SYSTEMS ==========
async function loadAgentWeapons() {
    console.log("Loading weapons for agent:", currentAgent);
    try {
        const q = query(collection(db, "agents"), where("agentName", "==", currentAgent));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const agentData = snapshot.docs[0].data();
            agentWeapons = agentData.weaponSystem || [];
        } else {
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
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
        btn.className = "weapon-btn";
        btn.innerText = `> ${weaponName}`;
        
        if (highlightWeapon === weaponName) {
            btn.classList.add('selected');
            selectedWeaponID = weaponName;
        }
        
        if (disabled) {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
        }
        
        btn.onclick = () => {
            if (disabled) return;
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWeaponID = weaponName;
            addButtonClickEffect(btn);
        };
        weaponList.appendChild(btn);
    });
}

// ========== CHECK MISSION STATUS (SEPARATE FUNCTION) ==========
async function checkMissionStatus(missionID) {
    try {
        const missionRef = doc(db, "mission_orders", missionID);
        const missionSnap = await getDoc(missionRef);
        
        if (missionSnap.exists()) {
            const docData = missionSnap.data();
            currentMissionStatus = docData.status || "DEPLOYED";
            currentMissionOwner = docData.agent;
            currentMissionData = docData;
            return {
                exists: true,
                status: currentMissionStatus,
                owner: currentMissionOwner,
                data: docData
            };
        } else {
            currentMissionStatus = null;
            currentMissionOwner = null;
            currentMissionData = null;
            return {
                exists: false,
                status: null,
                owner: null,
                data: null
            };
        }
    } catch(e) {
        console.error("Check mission error:", e);
        return {
            exists: false,
            status: null,
            owner: null,
            data: null,
            error: e
        };
    }
}

// ========== UPDATE STATUS DISPLAY ==========
async function updateStatusDisplay(missionID) {
    const result = await checkMissionStatus(missionID);
    
    if (result.error) {
        statusLabel.innerHTML = '<span style="color:#ff003c;">CONNECTION ERROR</span>';
        return;
    }
    
    if (!result.exists) {
        statusLabel.innerHTML = '<span style="color:#05ffa1;">AVAILABLE</span>';
    } else if (result.status === "TERMINATED") {
        statusLabel.innerHTML = '<span style="color:#8b0000;">STATUS: TERMINATED</span>';
    } else if (result.status === "RESERVED" && result.owner !== currentAgent) {
        statusLabel.innerHTML = `<span style="color:#ffbd00;">RESERVED BY: ${result.owner}</span>`;
    } else if (result.status === "RESERVED" && result.owner === currentAgent) {
        statusLabel.innerHTML = '<span style="color:#ffbd00;">YOUR RESERVATION</span>';
    } else if (result.owner === currentAgent) {
        statusLabel.innerHTML = '<span style="color:#00f3ff;">YOUR MISSION</span>';
    } else {
        statusLabel.innerHTML = `<span style="color:#ff003c;">OWNED BY: ${result.owner}</span>`;
    }
}

// ========== SAVE BUTTON LOGIC (DEPLOY) ==========
async function onSaveClick() {
    const inputValue = input.value.trim();
    if (!inputValue) {
        alert("Please enter a mission ID");
        return;
    }
    
    const missionID = padMissionID(inputValue);
    if (!missionID) {
        alert("Please enter a valid 4-5 digit mission ID");
        return;
    }
    
    addButtonClickEffect(actionBtn);
    
    // Check mission status first
    const result = await checkMissionStatus(missionID);
    
    if (result.exists) {
        if (result.owner === currentAgent) {
            alert("This is already your mission. Use RETRIEVE to update.");
        } else if (result.status === "RESERVED") {
            alert(`Mission ${missionID} is RESERVED by ${result.owner}. Cannot deploy.`);
        } else if (result.status === "DEPLOYED") {
            alert(`Mission ${missionID} is already DEPLOYED by ${result.owner}.`);
        } else {
            alert(`Mission ${missionID} already exists.`);
        }
        return;
    }
    
    // Mission is AVAILABLE, open deploy modal
    openDeployModal(missionID);
}

// ========== DEPLOY MODAL ==========
async function openDeployModal(missionID) {
    popHeader.innerHTML = `${missionID}`;
    vAgentInput.value = "";
    selectedWeaponID = "";
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
    vAgentInput.disabled = false;
    secureField.disabled = false;
    
    await loadAgentWeapons();
    renderWeapons();
    
    modalOverlay.style.display = 'flex';
    modalSubmit.textContent = "DEPLOY";
    modalSubmit.className = "btn btn-save";
    modalSubmit.disabled = false;
    
    modalSubmit.onclick = null;
    modalSubmit.onclick = () => {
        addButtonClickEffect(modalSubmit);
        submitDeployMission(missionID);
    };
}

// ========== RESERVE BUTTON LOGIC ==========
async function onReserveClick() {
    const inputValue = input.value.trim();
    if (!inputValue) {
        alert("Please enter a mission ID");
        return;
    }
    
    const missionID = padMissionID(inputValue);
    if (!missionID) {
        alert("Please enter a valid 4-5 digit mission ID");
        return;
    }
    
    addButtonClickEffect(reserveBtn);
    
    const result = await checkMissionStatus(missionID);
    
    if (result.exists) {
        if (result.status === "DEPLOYED") {
            alert(`Mission ${missionID} is already DEPLOYED by ${result.owner}. Cannot reserve.`);
            return;
        }
        if (result.status === "RESERVED") {
            alert(`Mission ${missionID} is already RESERVED by ${result.owner}. Cannot reserve.`);
            return;
        }
        if (result.owner === currentAgent) {
            alert("This is already your mission.");
            return;
        }
    }
    
    const confirmReserve = confirm(`Do you want to reserve mission order #${missionID}?`);
    
    if (confirmReserve) {
        await reserveMission(missionID);
    }
}

// ========== RESERVE MISSION ==========
async function reserveMission(missionID) {
    try {
        const missionRef = doc(db, "mission_orders", missionID);
        
        await setDoc(missionRef, {
            missionID: missionID,
            agent: currentAgent,
            status: "RESERVED",
            timestamp: serverTimestamp()
        }, { merge: true });
        
        addLog(`Mission ${missionID} RESERVED by ${currentAgent}`, '#ffbd00');
        
        input.value = "";
        statusLabel.innerHTML = "";
        currentMissionData = null;
        
        alert(`Mission ${missionID} has been reserved successfully!`);
        resetUI();
        
    } catch(e) {
        console.error("Reserve error:", e);
        alert("ERROR: " + e.message);
    }
}

// ========== RETRIEVE BUTTON LOGIC ==========
async function onRetrieveClick() {
    const inputValue = input.value.trim();
    if (!inputValue) {
        alert("Please enter a mission ID");
        return;
    }
    
    const missionID = padMissionID(inputValue);
    if (!missionID) {
        alert("Please enter a valid 4-5 digit mission ID");
        return;
    }
    
    addButtonClickEffect(actionBtn);
    
    const result = await checkMissionStatus(missionID);
    
    if (!result.exists) {
        alert(`Mission ${missionID} does not exist. Use SAVE to deploy.`);
        return;
    }
    
    if (result.status === "TERMINATED") {
        alert("This mission is TERMINATED and cannot be retrieved.");
        return;
    }
    
    if (result.owner !== currentAgent) {
        alert(`Mission ${missionID} is not assigned to you. Owner: ${result.owner}`);
        return;
    }
    
    // Open retrieve modal
    openRetrieveModal(missionID, result.status);
}

// ========== RETRIEVE MODAL ==========
async function openRetrieveModal(missionID, statusType) {
    popHeader.innerHTML = `${missionID}`;
    
    vAgentInput.value = currentMissionData?.vAgentID || "";
    selectedWeaponID = currentMissionData?.weaponSystem || "";
    secureField.value = currentMissionData?.SecureLine || "";
    vAgentInput.disabled = false;
    secureField.disabled = false;
    
    if (secureField.value) {
        secureField.classList.add('show');
        secureBtn.style.display = 'none';
    } else {
        secureField.classList.remove('show');
        secureBtn.style.display = 'block';
    }
    
    await loadAgentWeapons();
    renderWeapons(selectedWeaponID);
    
    modalOverlay.style.display = 'flex';
    modalSubmit.textContent = "UPDATE";
    modalSubmit.className = "btn btn-retrieve";
    modalSubmit.disabled = false;
    
    modalSubmit.onclick = null;
    modalSubmit.onclick = () => {
        addButtonClickEffect(modalSubmit);
        submitRetrieveMission(missionID, statusType);
    };
}

// ========== SUBMIT RETRIEVE MISSION ==========
async function submitRetrieveMission(missionID, statusType) {
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    const weaponSystem = selectedWeaponID;
    
    if (!vID) {
        alert("ENTER vAGENT ID");
        return;
    }
    if (!weaponSystem) {
        alert("SELECT WEAPON SYSTEM");
        return;
    }
    
    try {
        const missionRef = doc(db, "mission_orders", missionID);
        
        const missionData = {
            missionID: missionID,
            agent: currentAgent,
            vAgentID: vID,
            weaponSystem: weaponSystem,
            SecureLine: sLine || "",
            lastRetrieved: serverTimestamp(),
            timestamp: serverTimestamp(),
            status: statusType
        };
        
        await setDoc(missionRef, missionData, { merge: true });
        
        addLog(`Mission ${missionID} UPDATED by ${currentAgent}`, '#007bff');
        
        closeModal();
        input.value = "";
        statusLabel.innerHTML = "";
        currentMissionData = null;
        
        alert(`MISSION ${missionID} UPDATED SUCCESSFULLY!`);
        resetUI();
        
    } catch(e) {
        console.error(e);
        alert("ERROR: " + e.message);
    }
}

// ========== SUBMIT DEPLOY MISSION ==========
async function submitDeployMission(missionID) {
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    const weaponSystem = selectedWeaponID;
    
    if (!vID) {
        alert("ENTER vAGENT ID");
        return;
    }
    if (!weaponSystem) {
        alert("SELECT WEAPON SYSTEM");
        return;
    }
    
    const now = new Date();
    const deploymentDate = formatDate(now);
    const relieveDate = formatDate(calculateRelieveDate(now));
    
    try {
        const missionRef = doc(db, "mission_orders", missionID);
        
        const missionData = {
            agent: currentAgent,
            missionID: missionID,
            vAgentID: vID,
            weaponSystem: weaponSystem,
            SecureLine: sLine || "",
            status: "DEPLOYED",
            deploymentDate: deploymentDate,
            relieveDate: relieveDate,
            timestamp: serverTimestamp()
        };
        
        await setDoc(missionRef, missionData, { merge: true });
        
        addLog(`Mission ${missionID} DEPLOYED by ${currentAgent}`, '#05ffa1');
        
        closeModal();
        input.value = "";
        statusLabel.innerHTML = "";
        currentMissionData = null;
        
        alert(`MISSION ${missionID} DEPLOYED SUCCESSFULLY!`);
        resetUI();
        
    } catch(e) {
        console.error(e);
        alert("ERROR: " + e.message);
    }
}

// ========== VIEW MODAL (READ ONLY) ==========
async function onViewClick() {
    const inputValue = input.value.trim();
    if (!inputValue) {
        alert("Please enter a mission ID");
        return;
    }
    
    const missionID = padMissionID(inputValue);
    if (!missionID) {
        alert("Please enter a valid 4-5 digit mission ID");
        return;
    }
    
    addButtonClickEffect(reserveBtn);
    
    const result = await checkMissionStatus(missionID);
    
    if (!result.exists) {
        alert(`Mission ${missionID} does not exist.`);
        return;
    }
    
    openViewModal(missionID, result.data);
}

async function openViewModal(missionID, data) {
    popHeader.innerHTML = `${missionID}`;
    vAgentInput.value = data.vAgentID || "";
    selectedWeaponID = data.weaponSystem || "";
    secureField.value = data.SecureLine || "";
    
    if (secureField.value) {
        secureField.classList.add('show');
    } else {
        secureField.classList.remove('show');
    }
    secureBtn.style.display = 'none';
    
    vAgentInput.disabled = true;
    secureField.disabled = true;
    
    await loadAgentWeapons();
    renderWeapons(selectedWeaponID, true);
    
    modalOverlay.style.display = 'flex';
    modalSubmit.textContent = "CLOSE";
    modalSubmit.className = "btn btn-view";
    modalSubmit.disabled = false;
    modalSubmit.onclick = closeModal;
}

function toggleSecureLine() {
    addButtonClickEffect(secureBtn);
    if (secureField.classList.contains('show')) {
        secureField.classList.remove('show');
        secureBtn.style.display = 'block';
        secureBtn.innerHTML = '+ ADD SECURE LINE';
    } else {
        secureField.classList.add('show');
        secureBtn.style.display = 'none';
        secureField.focus();
    }
}

// ========== AUTO SEARCH (DISPLAY ONLY, NO BUTTON CONTROL) ==========
let autoSearchTimeout = null;

function onMissionInput() {
    const val = input.value.trim();
    
    if (autoSearchTimeout) clearTimeout(autoSearchTimeout);
    
    if (val.length === 0) {
        statusLabel.innerHTML = "";
        return;
    }
    
    if (val.length < 4) {
        statusLabel.innerHTML = 'ENTER 4-5 DIGITS';
        return;
    }
    
    const missionID = padMissionID(val);
    autoSearchTimeout = setTimeout(() => {
        updateStatusDisplay(missionID);
    }, 400);
}

// ========== INITIALIZATION ==========
async function init() {
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    
    function updateClock() {
        const now = new Date();
        clockSpan.textContent = now.toLocaleTimeString('en-GB');
    }
    updateClock();
    setInterval(updateClock, 1000);
    
    setupTerminalListener();
    await loadAgentWeapons();
    
    // Input event - auto display only
    input.addEventListener('input', onMissionInput);
    
    // Button events - separated logic
    actionBtn.addEventListener('click', onSaveClick);
    reserveBtn.addEventListener('click', onReserveClick);
    
    modalClose.onclick = closeModal;
    secureBtn.onclick = toggleSecureLine;
    
    console.log("Dashboard ready for agent:", currentAgent);
    console.log("SAVE button will call onSaveClick");
    console.log("RESERVE button will call onReserveClick");
}

init();
