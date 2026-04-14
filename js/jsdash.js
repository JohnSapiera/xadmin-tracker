// js/jsdash.js - CORE DASHBOARD (SIMPLIFIED & FIXED)

import SoundFX from './sound.js';
import { DEVICE_REGISTRY } from '../config.js';
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

// Get agent from localStorage
const currentAgent = localStorage.getItem("cia_agent") || localStorage.getItem("agent") || "AGENT_LZ";
console.log("🔐 Current Agent:", currentAgent);

// State variables
let selectedWeaponID = "";
let agentSignatures = [];
let currentMissionData = null;

// DOM Elements
const input = document.getElementById('mission-input');
const actionBtn = document.getElementById('action-btn');
const reserveBtn = document.getElementById('reserve-btn');
const statusLabel = document.getElementById('mission-status');
const terminal = document.getElementById('terminal');
const vAgentInput = document.getElementById('v-agent-input');
const modalSubmit = document.getElementById('modal-submit');
const modalClose = document.getElementById('modal-close');
const weaponList = document.getElementById('weapon-list');
const secureField = document.getElementById('secure-input-field');
const secureBtn = document.getElementById('add-secure-btn');
const modalOverlay = document.getElementById('modal-overlay');
const clockSpan = document.getElementById('clock');
const profName = document.getElementById('prof-name');
const avatarInit = document.getElementById('avatar-init');

// ====== INITIALIZATION ======
function init() {
    console.log("🚀 Dashboard initializing...");
    
    // Display agent info
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Setup terminal listener
    setupTerminalListener();
    
    // Setup event listeners
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
        await addDoc(collection(db, "terminal_logs"), { 
            agent: currentAgent, 
            message: msg, 
            color: color, 
            timestamp: serverTimestamp() 
        });
    } catch(e) { 
        console.error("Log error:", e); 
    }
}

function resetUI() {
    statusLabel.innerHTML = "";
    actionBtn.textContent = "SAVE";
    actionBtn.className = "btn btn-save";
    actionBtn.style.opacity = "1";
    actionBtn.style.pointerEvents = "auto";
    reserveBtn.classList.remove('active');
}

async function searchMission() {
    const val = input.value.trim();
    if (val.length < 4) { 
        resetUI(); 
        return; 
    }
    
    statusLabel.innerHTML = "SCANNING DATABASE...";
    const qM = query(collection(db, "mission_orders"), where("missionID", "==", val));
    const snapM = await getDocs(qM);

    if (!snapM.empty) {
        currentMissionData = snapM.docs[0].data();
        const owner = currentMissionData.agent;
        
        if (owner === currentAgent) {
            actionBtn.textContent = "RETRIEVE";
            actionBtn.className = "btn btn-retrieve";
            reserveBtn.classList.remove('active');
            statusLabel.innerHTML = `<span class="status-deployed">STATUS: YOUR MISSION</span>`;
        } else {
            statusLabel.innerHTML = `<span style="color:var(--red);">ALREADY DEPLOYED BY ${owner}</span>`;
            actionBtn.textContent = "LOCKED";
            actionBtn.className = "btn btn-locked";
            actionBtn.style.pointerEvents = "none";
            reserveBtn.classList.remove('active');
            addLog(`RESTRICTED: ${currentAgent} SCANNED ${owner}'S MISSION`, 'var(--red)');
        }
    } else {
        currentMissionData = null;
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        statusLabel.innerHTML = 'STATUS: AVAILABLE';
        reserveBtn.classList.add('active');
    }
}

function resetSecureUI() {
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
}

function renderWeapons() {
    weaponList.innerHTML = "";
    agentSignatures.forEach(sig => {
        const b = document.createElement('button');
        b.className = "weapon-btn" + (sig === selectedWeaponID ? " selected" : "");
        b.innerText = `> ${DEVICE_REGISTRY[sig] || sig}`;
        b.onclick = () => {
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            b.classList.add('selected');
            selectedWeaponID = sig;
        };
        weaponList.appendChild(b);
    });
}

async function openModal() {
    if (input.value.length < 4) return;
    
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerText = `#${input.value}`;
    
    // Get agent signatures from Firebase or use defaults
    try {
        const snap = await getDoc(doc(db, "agents", currentAgent));
        agentSignatures = snap.exists() ? snap.data().linkedSignatures || [] : Object.keys(DEVICE_REGISTRY);
    } catch(e) {
        agentSignatures = Object.keys(DEVICE_REGISTRY);
    }

    if (currentMissionData) {
        vAgentInput.value = currentMissionData.vAgentID || "";
        selectedWeaponID = currentMissionData.weaponSystem || "";
        if (currentMissionData.SecureLine) {
            secureField.value = currentMissionData.SecureLine;
            secureField.classList.add('show');
            secureBtn.style.display = 'none';
        } else { 
            resetSecureUI(); 
        }
        modalSubmit.textContent = "UPDATE";
        modalSubmit.className = "btn btn-retrieve";
    } else {
        vAgentInput.value = "";
        selectedWeaponID = "";
        resetSecureUI();
        modalSubmit.textContent = "CONFIRM";
        modalSubmit.className = "btn btn-save";
    }
    renderWeapons();
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

async function submitMission() {
    console.log("🔘 SUBMIT MISSION CALLED");
    
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    
    if (!vID || !selectedWeaponID) {
        alert("INCOMPLETE DATA");
        return;
    }
    if (sLine !== "" && !sLine.startsWith("09")) {
        alert("INVALID PHONE");
        return;
    }

    try {
        await setDoc(doc(db, "mission_orders", input.value), {
            missionID: input.value,
            agent: currentAgent,
            vAgentID: vID,
            weaponSystem: selectedWeaponID,
            SecureLine: sLine,
            status: "DEPLOYED",
            timestamp: serverTimestamp()
        }, { merge: true });
        
        addLog(`MISSION #${input.value} UPDATED BY ${currentAgent}`, 'var(--green)');
        closeModal();
        input.value = "";
        resetUI();
        alert("MISSION SAVED SUCCESSFULLY!");
    } catch(e) { 
        console.error(e); 
        alert("ERROR SUBMITTING MISSION: " + e.message);
    }
}

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    input.addEventListener('input', searchMission);
    actionBtn.onclick = openModal;
    modalClose.onclick = closeModal;
    
    // ⭐ CRITICAL FIX: Direct assignment for modal submit
    if (modalSubmit) {
        modalSubmit.onclick = submitMission;
        console.log("✅ Modal submit button attached");
    } else {
        console.log("❌ Modal submit button not found!");
    }
    
    secureBtn.onclick = () => {
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };
}

// Start the app
init();
