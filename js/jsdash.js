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

// ====== AGENT FROM LOCALSTORAGE (dynamic, hindi hard-coded) ======
const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";
console.log("🔐 Current Agent:", currentAgent);

// ====== STATE ======
let selectedWeaponID = "";
let agentWeapons = [];
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

// ====== HELPER FUNCTIONS ======
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

// ====== INITIALIZATION ======
function init() {
    console.log("🚀 Dashboard initializing for agent:", currentAgent);
    
    // Check if agent is valid
    if (!currentAgent || currentAgent === "UNKNOWN_AGENT") {
        console.log("❌ No agent found in localStorage. Redirecting to login...");
        alert("No active session. Please login first.");
        window.location.href = "index.html";
        return;
    }
    
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    updateClock();
    setInterval(updateClock, 1000);
    setupTerminalListener();
    loadAgentWeapons();
    setupEventListeners();
    console.log("✅ Dashboard initialized for agent:", currentAgent);
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
        await addDoc(collection(db, "terminal_logs"), { 
            agent: currentAgent, 
            message: msg, 
            color: color, 
            timestamp: serverTimestamp() 
        });
    } catch(e) { console.error("Log error:", e); }
}

// ====== LOAD WEAPONS FOR CURRENT AGENT ======
async function loadAgentWeapons() {
    console.log("🔫 Loading weapons for agent:", currentAgent);
    
    try {
        const agentDoc = await getDoc(doc(db, "agents", currentAgent));
        
        if (agentDoc.exists()) {
            const agentData = agentDoc.data();
            // Get weapons from linkedSignatures
            agentWeapons = agentData.linkedSignatures || [];
            console.log("✅ Weapons loaded from agents collection:", agentWeapons);
            addLog(`Weapons loaded for agent ${currentAgent}: ${agentWeapons.length} available`, '#00f3ff');
        } else {
            console.log("⚠️ Agent document not found in 'agents' collection");
            addLog(`⚠️ Agent ${currentAgent} not found in database`, '#ffbd00');
            agentWeapons = [];
        }
    } catch (error) {
        console.error("Error loading agent weapons:", error);
        agentWeapons = [];
        addLog(`❌ Error loading weapons: ${error.message}`, '#ff003c');
    }
}

function resetUI() {
    statusLabel.innerHTML = "";
    actionBtn.textContent = "SAVE";
    actionBtn.className = "btn btn-save";
    actionBtn.disabled = false;
    actionBtn.style.opacity = "1";
    actionBtn.style.pointerEvents = "auto";
    reserveBtn.classList.remove('active');
    isMissionTerminated = false;
    currentMissionData = null;
}

// ====== CHECK FORM COMPLETE ======
function checkFormComplete() {
    const vID = vAgentInput.value.trim();
    const hasWeapon = selectedWeaponID !== "";
    
    if (vID !== "" && hasWeapon && !isMissionTerminated && agentWeapons.length > 0) {
        modalSubmit.disabled = false;
        modalSubmit.style.opacity = "1";
        SoundFX.beep(800, 0.05, 0.1);
    } else {
        modalSubmit.disabled = true;
        modalSubmit.style.opacity = "0.5";
    }
}

// ====== PERFORM SEARCH ======
async function performSearch() {
    let rawValue = input.value.trim();
    
    if (rawValue.length === 0) {
        resetUI();
        return;
    }
    
    const paddedMissionID = padMissionID(rawValue);
    console.log(`🔍 Searching for mission ID: ${paddedMissionID}`);
    
    statusLabel.innerHTML = '<span class="blink">SCANNING DATABASE...</span>';
    addLog(`Scanning mission ID: ${paddedMissionID}`, '#5c7882');
    
    try {
        const qM = query(collection(db, "mission_orders"), where("missionID", "==", paddedMissionID));
        const snapM = await getDocs(qM);
        
        if (!snapM.empty) {
            currentMissionData = snapM.docs[0].data();
            const owner = currentMissionData.agent;
            const status = currentMissionData.status;
            
            if (status === "TERMINATED") {
                isMissionTerminated = true;
                statusLabel.innerHTML = `<span style="color:var(--red);">⚠️ MISSION TERMINATED</span>`;
                actionBtn.textContent = "TERMINATED";
                actionBtn.className = "btn btn-locked";
                actionBtn.disabled = true;
                reserveBtn.classList.remove('active');
                addLog(`⚠️ MISSION ${paddedMissionID} IS TERMINATED - ACCESS DENIED`, '#ff003c');
                return;
            }
            
            isMissionTerminated = false;
            
            if (owner === currentAgent) {
                actionBtn.textContent = "RETRIEVE";
                actionBtn.className = "btn btn-retrieve";
                actionBtn.disabled = false;
                reserveBtn.classList.remove('active');
                statusLabel.innerHTML = `<span class="status-deployed">STATUS: YOUR MISSION</span>`;
                addLog(`✅ Mission ${paddedMissionID} found. Ready to RETRIEVE.`, '#05ffa1');
            } else {
                statusLabel.innerHTML = `<span style="color:var(--red);">ALREADY DEPLOYED BY ${owner}</span>`;
                actionBtn.textContent = "LOCKED";
                actionBtn.className = "btn btn-locked";
                actionBtn.disabled = true;
                reserveBtn.classList.remove('active');
                addLog(`🔒 Mission ${paddedMissionID} is DEPLOYED by ${owner}`, '#ff003c');
            }
        } else {
            currentMissionData = null;
            isMissionTerminated = false;
            actionBtn.textContent = "SAVE";
            actionBtn.className = "btn btn-save";
            actionBtn.disabled = false;
            statusLabel.innerHTML = 'STATUS: AVAILABLE';
            reserveBtn.classList.add('active');
            addLog(`📝 Mission ${paddedMissionID} is AVAILABLE. Ready to SAVE.`, '#00f3ff');
        }
    } catch (error) {
        console.error("Search error:", error);
        statusLabel.innerHTML = '<span style="color:var(--red);">DATABASE ERROR</span>';
        addLog(`❌ Database error scanning mission ${paddedMissionID}`, '#ff003c');
    }
}

// ====== SEARCH MISSION ======
async function searchMission() {
    const val = input.value.trim();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }
    
    if (val.length === 0) {
        resetUI();
        return;
    }
    
    const delay = val.length <= 3 ? 5000 : 300;
    statusLabel.innerHTML = `<span class="blink">SCANNING IN ${delay/1000}s...</span>`;
    
    searchTimeout = setTimeout(() => {
        performSearch();
        searchTimeout = null;
    }, delay);
}

// ====== RENDER WEAPONS ======
function renderWeapons() {
    weaponList.innerHTML = "";
    
    if (!agentWeapons || agentWeapons.length === 0) {
        weaponList.innerHTML = '<div style="text-align:center; padding:10px; color:#ffbd00;">⚠️ No weapons assigned to this agent. Contact administrator.</div>';
        return;
    }
    
    agentWeapons.forEach(weaponName => {
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
    if (isMissionTerminated) {
        SoundFX.error();
        alert("MISSION IS TERMINATED - CANNOT EDIT");
        return;
    }
    
    let rawMissionID = input.value.trim();
    if (rawMissionID.length === 0) {
        SoundFX.error();
        alert("ENTER MISSION ID FIRST");
        return;
    }
    
    const missionID = padMissionID(rawMissionID);
    
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
    } else {
        modalSubmit.textContent = "CONFIRM";
    }
    
    renderWeapons();
    
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
    SoundFX.click();
    modalOverlay.style.display = 'none';
}

// ====== SUBMIT MISSION ======
async function submitMission() {
    console.log("🔘 SUBMIT MISSION CALLED");
    
    if (isMissionTerminated) {
        SoundFX.error();
        alert("MISSION IS TERMINATED - CANNOT MODIFY");
        return;
    }
    
    SoundFX.click();
    
    let rawMissionID = input.value.trim();
    if (rawMissionID.length === 0) {
        SoundFX.error();
        alert("INVALID MISSION ID");
        return;
    }
    
    const missionID = padMissionID(rawMissionID);
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    
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
    
    // Calculate dates (hidden)
    const now = new Date();
    const deploymentDate = formatDate(now);
    const relieveDateObj = calculateRelieveDate(now);
    const relieveDate = formatDate(relieveDateObj);
    
    try {
        SoundFX.terminalUpdate();
        
        await setDoc(doc(db, "mission_orders", missionID), {
            missionID: missionID,
            agent: currentAgent,
            vAgentID: vID,
            weaponSystem: selectedWeaponID,
            SecureLine: sLine || "",
            status: "DEPLOYED",
            deploymentDate: deploymentDate,
            relieveDate: relieveDate,
            timestamp: serverTimestamp()
        }, { merge: true });
        
        SoundFX.success();
        addLog(`MISSION #${missionID} ${currentMissionData ? 'UPDATED' : 'SAVED'} BY ${currentAgent}`, '#05ffa1');
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

// Start the dashboard
init();
