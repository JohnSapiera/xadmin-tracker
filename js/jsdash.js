// js/jsdash.js - CORE DASHBOARD v30.5 with Sounds

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

const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "AGENT_LZ";
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

function init() {
    SoundFX.success(); // Dashboard initialized sound
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    updateClock();
    setInterval(updateClock, 1000);
    setupTerminalListener();
    setupEventListeners();
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
        SoundFX.terminalUpdate(); // Terminal update sound
        await addDoc(collection(db, "terminal_logs"), { agent: currentAgent, message: msg, color: color, timestamp: serverTimestamp() });
    } catch(e) { console.error("Log error:", e); }
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
    if (val.length < 4) { resetUI(); return; }
    
    SoundFX.terminalUpdate(); // Scanning sound
    statusLabel.innerHTML = "SCANNING DATABASE...";
    const qM = query(collection(db, "mission_orders"), where("missionID", "==", val));
    const snapM = await getDocs(qM);

    if (!snapM.empty) {
        currentMissionData = snapM.docs[0].data();
        const owner = currentMissionData.agent;
        if (owner === currentAgent) {
            SoundFX.success(); // Your mission sound
            actionBtn.textContent = "RETRIEVE";
            actionBtn.className = "btn btn-retrieve";
            actionBtn.style.pointerEvents = "auto";
            reserveBtn.classList.remove('active');
            statusLabel.innerHTML = `<span class="status-deployed">STATUS: YOUR MISSION</span>`;
        } else {
            SoundFX.error(); // Access denied sound
            statusLabel.innerHTML = `<span style="color:var(--red);">ALREADY DEPLOYED BY ${owner}</span>`;
            actionBtn.textContent = "LOCKED";
            actionBtn.className = "btn btn-locked";
            actionBtn.style.pointerEvents = "none";
            reserveBtn.classList.remove('active');
            addLog(`RESTRICTED: ${currentAgent} SCANNED ${owner}'S MISSION`, 'var(--red)');
        }
    } else {
        SoundFX.beep(600, 0.2, 0.2); // Mission available sound
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
            SoundFX.click(); // Weapon select sound
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            b.classList.add('selected');
            selectedWeaponID = sig;
        };
        weaponList.appendChild(b);
    });
}

async function openModal() {
    if (input.value.length < 4) return;
    SoundFX.click(); // Modal open sound
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerText = `#${input.value}`;
    
    const snap = await getDoc(doc(db, "agents", currentAgent));
    agentSignatures = snap.exists() ? snap.data().linkedSignatures || [] : Object.keys(DEVICE_REGISTRY);

    if (currentMissionData) {
        vAgentInput.value = currentMissionData.vAgentID || "";
        selectedWeaponID = currentMissionData.weaponSystem || "";
        if (currentMissionData.SecureLine) {
            secureField.value = currentMissionData.SecureLine;
            secureField.classList.add('show');
            secureBtn.style.display = 'none';
        } else { resetSecureUI(); }
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
    SoundFX.click(); // Close sound
    modalOverlay.style.display = 'none';
}

async function submitMission() {
    SoundFX.click(); // Submit button sound
    
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    if (!vID || !selectedWeaponID) {
        SoundFX.error(); // Incomplete data sound
        return alert("INCOMPLETE DATA");
    }
    if (sLine !== "" && !sLine.startsWith("09")) {
        SoundFX.error(); // Invalid phone sound
        return alert("INVALID PHONE");
    }

    try {
        SoundFX.terminalUpdate(); // Saving mission sound
        await setDoc(doc(db, "mission_orders", input.value), {
            missionID: input.value,
            agent: currentAgent,
            vAgentID: vID,
            weaponSystem: selectedWeaponID,
            SecureLine: sLine,
            status: "DEPLOYED",
            timestamp: serverTimestamp()
        }, { merge: true });
        
        SoundFX.success(); // Mission saved sound
        addLog(`MISSION #${input.value} UPDATED BY ${currentAgent}`, 'var(--green)');
        closeModal();
        input.value = "";
        resetUI();
    } catch(e) { 
        SoundFX.error(); // Error sound
        console.error(e); 
        alert("ERROR SUBMITTING MISSION"); 
    }
}

// Keypad sounds for mission input
input.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    }
});

// Keypad sounds for vAgent input in modal
vAgentInput.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    } else if (e.key >= 'a' && e.key <= 'z') {
        SoundFX.beep(700, 0.05, 0.1); // Letter typing sound
    }
});

// Keypad sounds for secure field
secureField.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    }
});

function setupEventListeners() {
    input.addEventListener('input', searchMission);
    actionBtn.onclick = openModal;
    modalSubmit.onclick = submitMission;
    modalClose.onclick = closeModal;
    secureBtn.onclick = () => {
        SoundFX.click(); // Add secure line sound
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };
}

init();
