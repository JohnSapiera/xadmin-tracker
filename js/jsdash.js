// js/jsdash.js - CORE DASHBOARD v30.5

import SoundFX from './sound.js';
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

// ====== AGENT FROM LOCALSTORAGE ======
const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "AGENT_LZ";
console.log("🔐 Agent:", currentAgent);

// ====== STATE ======
let selectedWeaponID = "";
let agentSignatures = [];
let currentMissionData = null;
let isMissionTerminated = false;
let searchTimeout = null;

// ====== DOM ELEMENTS ======
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
const secureBtn = document.getElementById('add-secure-btn');
const weaponList = document.getElementById('weapon-list');
const clockSpan = document.getElementById('clock');
const profName = document.getElementById('prof-name');
const avatarInit = document.getElementById('avatar-init');

// ====== INIT ======
function init() {
    console.log("🚀 Dashboard initializing...");
    SoundFX.success();
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    updateClock();
    setInterval(updateClock, 1000);
    setupTerminalListener();
    setupEventListeners();
    console.log("✅ Dashboard initialized");
}

function updateClock() {
    clockSpan.textContent = new Date().toLocaleTimeString('en-GB');
}

function setupTerminalListener() {
    onSnapshot(query(collection(db, "terminal_logs"), orderBy("timestamp", "desc"), limit(15)), (snap) => {
        terminal.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            const time = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleTimeString('en-GB') : "--";
            terminal.innerHTML += `<div class="term-line"><span style="color:#5c7882">[${time}]</span> <span style="color:${d.color}">${d.message}</span></div>`;
        });
    });
}

async function addLog(msg, color) {
    try {
        SoundFX.terminalUpdate();
        await addDoc(collection(db, "terminal_logs"), { agent: currentAgent, message: msg, color: color, timestamp: serverTimestamp() });
    } catch(e) { console.error("Log error:", e); }
}

function disableAllButtons() {
    actionBtn.disabled = true;
    actionBtn.style.opacity = "0.5";
    actionBtn.style.pointerEvents = "none";
    reserveBtn.disabled = true;
    reserveBtn.style.opacity = "0.5";
    reserveBtn.style.pointerEvents = "none";
}

function enableActionButton() {
    actionBtn.disabled = false;
    actionBtn.style.opacity = "1";
    actionBtn.style.pointerEvents = "auto";
}

function enableReserveButton() {
    reserveBtn.disabled = false;
    reserveBtn.style.opacity = "1";
    reserveBtn.style.pointerEvents = "auto";
}

function resetUI() {
    statusLabel.innerHTML = "";
    actionBtn.textContent = "SAVE";
    actionBtn.className = "btn btn-save";
    enableActionButton();
    reserveBtn.classList.remove('active');
    isMissionTerminated = false;
    currentMissionData = null;
}

// ====== CHECK FORM COMPLETE (ENABLE CONFIRM BUTTON) ======
function checkFormComplete() {
    const vID = vAgentInput.value.trim();
    const hasWeapon = selectedWeaponID !== "";
    
    console.log("🔍 checkFormComplete - vID:", vID, "hasWeapon:", hasWeapon, "isTerminated:", isMissionTerminated);
    
    if (vID !== "" && hasWeapon && !isMissionTerminated) {
        modalSubmit.disabled = false;
        modalSubmit.style.opacity = "1";
        SoundFX.beep(800, 0.05, 0.1);
        console.log("✅ CONFIRM button ENABLED");
    } else {
        modalSubmit.disabled = true;
        modalSubmit.style.opacity = "0.5";
        console.log("❌ CONFIRM button DISABLED");
    }
}

// ====== PERFORM SEARCH ======
async function performSearch() {
    const val = input.value.trim();
    
    if (val.length === 0) {
        resetUI();
        return;
    }
    
    statusLabel.innerHTML = '<span class="blink">SCANNING DATABASE...</span>';
    SoundFX.terminalUpdate();
    
    try {
        const qM = query(collection(db, "mission_orders"), where("missionID", "==", val));
        const snapM = await getDocs(qM);
        
        if (!snapM.empty) {
            currentMissionData = snapM.docs[0].data();
            const owner = currentMissionData.agent;
            const status = currentMissionData.status;
            
            if (status === "TERMINATED") {
                isMissionTerminated = true;
                statusLabel.innerHTML = `<span style="color:var(--red);">⚠️ MISSION TERMINATED - ACCESS DENIED</span>`;
                actionBtn.textContent = "TERMINATED";
                actionBtn.className = "btn btn-locked";
                disableAllButtons();
                reserveBtn.classList.remove('active');
                addLog(`BLOCKED: ${currentAgent} ATTEMPTED ACCESS TO TERMINATED MISSION ${val}`, 'var(--red)');
                return;
            }
            
            isMissionTerminated = false;
            
            if (owner === currentAgent) {
                SoundFX.success();
                actionBtn.textContent = "RETRIEVE";
                actionBtn.className = "btn btn-retrieve";
                enableActionButton();
                reserveBtn.classList.remove('active');
                statusLabel.innerHTML = `<span class="status-deployed">STATUS: YOUR MISSION</span>`;
                console.log("📋 Mission found - RETRIEVE mode");
            } else {
                SoundFX.error();
                statusLabel.innerHTML = `<span style="color:var(--red);">ALREADY DEPLOYED BY ${owner}</span>`;
                actionBtn.textContent = "LOCKED";
                actionBtn.className = "btn btn-locked";
                disableAllButtons();
                reserveBtn.classList.remove('active');
                addLog(`RESTRICTED: ${currentAgent} SCANNED ${owner}'S MISSION`, 'var(--red)');
            }
        } else {
            currentMissionData = null;
            isMissionTerminated = false;
            actionBtn.textContent = "SAVE";
            actionBtn.className = "btn btn-save";
            enableActionButton();
            statusLabel.innerHTML = 'STATUS: AVAILABLE';
            reserveBtn.classList.add('active');
            enableReserveButton();
            console.log("📋 No mission found - SAVE mode");
        }
    } catch (error) {
        console.error("Search error:", error);
        statusLabel.innerHTML = '<span style="color:var(--red);">DATABASE ERROR</span>';
    }
}

// ====== SEARCH MISSION with delay for 3 digits or less ======
async function searchMission() {
    const val = input.value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }
    
    // If empty, reset immediately
    if (val.length === 0) {
        resetUI();
        return;
    }
    
    // Determine delay: 5 seconds for 3 digits or less, 300ms for 4+ digits
    const delay = val.length <= 3 ? 5000 : 300;
    
    console.log(`Search delay: ${delay}ms for ${val.length} digit(s)`);
    statusLabel.innerHTML = `<span class="blink">SCANNING IN ${delay/1000}s...</span>`;
    
    searchTimeout = setTimeout(() => {
        performSearch();
        searchTimeout = null;
    }, delay);
}

// ====== RENDER WEAPONS ======
function renderWeapons() {
    weaponList.innerHTML = "";
    if (!agentSignatures || agentSignatures.length === 0) {
        weaponList.innerHTML = '<div style="text-align:center; padding:10px; color:#5c7882;">No weapons available</div>';
        return;
    }
    
    agentSignatures.forEach(weaponName => {
        const btn = document.createElement('button');
        btn.className = "weapon-btn";
        btn.innerText = `> ${weaponName}`;
        btn.setAttribute('data-weapon-id', weaponName);
        btn.onclick = () => {
            SoundFX.click();
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWeaponID = weaponName;
            console.log("🔫 Weapon selected:", selectedWeaponID);
            checkFormComplete();
        };
        weaponList.appendChild(btn);
    });
}

// ====== OPEN MODAL ======
async function openModal() {
    console.log("📂 Opening modal...");
    
    // Check if mission is terminated
    if (isMissionTerminated) {
        SoundFX.error();
        alert("MISSION IS TERMINATED - CANNOT EDIT");
        return;
    }
    
    const missionID = input.value.trim();
    if (missionID.length === 0) {
        SoundFX.error();
        alert("ENTER MISSION ID FIRST");
        return;
    }
    
    SoundFX.click();
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerText = `#${missionID}`;
    
    // Reset form
    vAgentInput.value = "";
    selectedWeaponID = "";
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
    modalSubmit.disabled = true;
    modalSubmit.style.opacity = "0.5";
    
    // Get weapon systems from mission_orders
    try {
        const missionsSnap = await getDocs(query(
            collection(db, "mission_orders"), 
            where("agent", "==", currentAgent)
        ));
        
        const weaponSet = new Set();
        missionsSnap.forEach(doc => {
            const data = doc.data();
            if (data.weaponSystem && data.weaponSystem !== 'INIT' && data.status !== "TERMINATED") {
                weaponSet.add(data.weaponSystem);
            }
        });
        
        agentSignatures = Array.from(weaponSet).sort();
        console.log("🔫 Weapon systems found:", agentSignatures);
    } catch(e) {
        console.error("Error loading weapon systems:", e);
        agentSignatures = [];
    }
    
    // If retrieving existing mission
    if (currentMissionData && !isMissionTerminated) {
        vAgentInput.value = currentMissionData.vAgentID || "";
        selectedWeaponID = currentMissionData.weaponSystem || "";
        if (currentMissionData.SecureLine) {
            secureField.value = currentMissionData.SecureLine;
            secureField.classList.add('show');
            secureBtn.style.display = 'none';
        }
        modalSubmit.textContent = "UPDATE";
        SoundFX.folderOpen();
        console.log("📝 EDITING existing mission");
    } else {
        modalSubmit.textContent = "CONFIRM";
        console.log("📝 NEW mission");
    }
    
    renderWeapons();
    
    // Highlight selected weapon if any
    if (selectedWeaponID) {
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            if (btn.getAttribute('data-weapon-id') === selectedWeaponID) {
                btn.classList.add('selected');
            }
        });
    }
    
    checkFormComplete();
}

function closeModal() {
    console.log("📂 Closing modal");
    SoundFX.click();
    modalOverlay.style.display = 'none';
}

// ====== SUBMIT MISSION ======
async function submitMission() {
    console.log("🔘 SUBMIT MISSION CALLED");
    
    // Check if mission is terminated
    if (isMissionTerminated) {
        SoundFX.error();
        alert("MISSION IS TERMINATED - CANNOT MODIFY");
        return;
    }
    
    SoundFX.click();
    
    const missionID = input.value.trim();
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    
    if (!missionID || missionID.length === 0) {
        SoundFX.error();
        alert("INVALID MISSION ID");
        return;
    }
    if (!vID) {
        SoundFX.error();
        alert("INCOMPLETE DATA: Missing vAgent ID");
        return;
    }
    if (!selectedWeaponID) {
        SoundFX.error();
        alert("INCOMPLETE DATA: No weapon selected");
        return;
    }
    
    try {
        SoundFX.terminalUpdate();
        
        // Update or create mission_orders document
        await setDoc(doc(db, "mission_orders", missionID), {
            missionID: missionID,
            agent: currentAgent,
            vAgentID: vID,
            weaponSystem: selectedWeaponID,
            SecureLine: sLine || "",
            status: "DEPLOYED",
            timestamp: serverTimestamp()
        }, { merge: true });
        
        SoundFX.success();
        addLog(`MISSION #${missionID} ${currentMissionData ? 'UPDATED' : 'SAVED'} BY ${currentAgent}`, 'var(--green)');
        closeModal();
        input.value = "";
        resetUI();
        currentMissionData = null;
        alert("✅ MISSION SAVED SUCCESSFULLY!");
    } catch(e) {
        SoundFX.error();
        console.error(e);
        alert("ERROR: " + e.message);
    }
}

// ====== KEYPAD SOUNDS ======
input.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    }
});

vAgentInput.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    } else if (e.key >= 'a' && e.key <= 'z') {
        SoundFX.beep(700, 0.05, 0.1);
    }
});

secureField.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    }
});

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    input.addEventListener('input', searchMission);
    actionBtn.onclick = openModal;
    modalClose.onclick = closeModal;
    modalSubmit.onclick = submitMission;
    vAgentInput.addEventListener('input', checkFormComplete);
    secureBtn.onclick = () => {
        SoundFX.click();
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };
}

// Start
init();
