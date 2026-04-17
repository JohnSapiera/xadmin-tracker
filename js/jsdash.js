// js/jsdash.js - CORE DASHBOARD v30.5 (REFINED)

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
    onSnapshot, 
    orderBy, 
    limit 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. FIREBASE CONFIG
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

// 2. STATE VARIABLES
const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";
let selectedWeaponID = "";
let agentWeapons = [];
let currentMissionData = null;
let isMissionTerminated = false;
let searchTimeout = null;

// 3. DOM ELEMENTS
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

// --- UTILITIES ---
function padMissionID(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    return digits.padStart(5, '0');
}

function formatDate(date) {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function updateClock() {
    if (clockSpan) clockSpan.textContent = new Date().toLocaleTimeString('en-GB');
}

// --- CORE FUNCTIONS ---
async function addLog(msg, color) {
    try {
        await addDoc(collection(db, "terminal_logs"), { 
            agent: currentAgent, 
            message: msg, 
            color: color || "#5c7882", 
            timestamp: serverTimestamp() 
        });
    } catch(e) { console.error("Log error:", e); }
}

function setStatusColor(status, message) {
    let color = '#5c7882';
    if (status === 'available') color = '#05ffa1';
    if (status === 'reserve') color = '#ffbd00';
    if (status === 'terminated') color = '#8b0000';
    if (status === 'other_agent') color = '#ff003c';
    if (status === 'your_mission') color = '#00f3ff';
    statusLabel.innerHTML = `<span style="color:${color};">${message}</span>`;
}

// --- SEARCH LOGIC ---
async function performSearch(rawValue) {
    const paddedMissionID = padMissionID(rawValue);
    addLog(`Scanning mission ID: ${paddedMissionID}`);
    
    try {
        const qM = query(collection(db, "mission_orders"), where("missionID", "==", paddedMissionID));
        const snapM = await getDocs(qM);
        
        if (!snapM.empty) {
            currentMissionData = snapM.docs[0].data();
            const owner = currentMissionData.agent;
            if (currentMissionData.status === "TERMINATED") {
                isMissionTerminated = true;
                setStatusColor('terminated', 'MISSION TERMINATED');
                actionBtn.textContent = "LOCKED";
                actionBtn.disabled = true;
            } else if (owner === currentAgent) {
                setStatusColor('your_mission', 'STATUS: YOUR MISSION');
                actionBtn.textContent = "RETRIEVE";
                actionBtn.disabled = false;
            } else {
                setStatusColor('other_agent', `OWNED BY ${owner}`);
                actionBtn.textContent = "LOCKED";
                actionBtn.disabled = true;
            }
        } else {
            currentMissionData = null;
            setStatusColor('available', 'STATUS: AVAILABLE');
            actionBtn.textContent = "SAVE";
            actionBtn.disabled = false;
        }
    } catch (e) { console.error(e); }
}

async function searchMission() {
    const rawValue = input.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!rawValue) return;

    searchTimeout = setTimeout(() => performSearch(rawValue), 500);
}

// --- MODAL & WEAPON RENDER ---
async function loadAgentWeapons() {
    // Default list kung sakaling walang makuha sa DB
    agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
    renderWeapons();
}

function renderWeapons() {
    weaponList.innerHTML = "";
    agentWeapons.forEach(weaponName => {
        const btn = document.createElement('button');
        btn.className = "weapon-btn";
        btn.innerText = `> ${weaponName}`;
        if (selectedWeaponID === weaponName) btn.classList.add('selected');
        btn.onclick = () => {
            SoundFX.click();
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWeaponID = weaponName;
            updateConfirmButton();
        };
        weaponList.appendChild(btn);
    });
}

function updateConfirmButton() {
    // Kinukontrol nito ang itsura ng button
    const isValid = vAgentInput.value.trim() !== "" && selectedWeaponID !== "";
    modalSubmit.disabled = !isValid;
    modalSubmit.style.opacity = isValid ? "1" : "0.5";
}

async function openModal() {
    const rawMissionID = input.value.trim();
    if (!rawMissionID) { alert("ENTER MISSION ID"); return; }
    
    SoundFX.click();
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerText = `#${padMissionID(rawMissionID)}`;
    
    // Reset or Load Data
    vAgentInput.value = currentMissionData ? currentMissionData.vAgentID : "";
    selectedWeaponID = currentMissionData ? currentMissionData.weaponSystem : "";
    
    await loadAgentWeapons();
    
    // 🔥 FORCE ENABLE para sa iyong emergency button requirement
    modalSubmit.disabled = false;
    modalSubmit.style.opacity = "1";
    modalSubmit.style.pointerEvents = "auto";
}

function closeModal() {
    modalOverlay.style.display = 'none';
    SoundFX.click();
}

// --- SUBMIT TO FIREBASE ---
async function submitMission() {
    const missionID = padMissionID(input.value.trim());
    const vID = vAgentInput.value.trim();
    
    if (!missionID || !vID || !selectedWeaponID) {
        alert("INCOMPLETE DATA: Please check V_ID and System Link.");
        return;
    }

    try {
        const now = new Date();
        await setDoc(doc(db, "mission_orders", missionID), {
            missionID: missionID,
            agent: currentAgent,
            vAgentID: vID,
            weaponSystem: selectedWeaponID,
            SecureLine: secureField.value.trim(),
            status: "DEPLOYED",
            deploymentDate: formatDate(now),
            timestamp: serverTimestamp()
        }, { merge: true });

        SoundFX.success();
        addLog(`Mission #${missionID} DEPLOYED by ${currentAgent}`, '#05ffa1');
        alert("SUCCESS: DATA UPLOADED");
        closeModal();
        location.reload(); // Reload para malinis ang dashboard
    } catch(e) {
        alert("UPLOAD ERROR: " + e.message);
    }
}

// --- INITIALIZATION ---
function init() {
    if (!currentAgent || currentAgent === "UNKNOWN_AGENT") {
        window.location.href = "index.html";
        return;
    }
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    
    setInterval(updateClock, 1000);
    
    // Realtime Terminal Logs
    onSnapshot(query(collection(db, "terminal_logs"), orderBy("timestamp", "desc"), limit(10)), (snap) => {
        terminal.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            terminal.innerHTML += `<div class="term-line"><span style="color:${d.color}">${d.message}</span></div>`;
        });
    });

    // Event Listeners
    input.addEventListener('input', searchMission);
    actionBtn.onclick = openModal;
    modalClose.onclick = closeModal;
    vAgentInput.addEventListener('input', updateConfirmButton);
    
    secureBtn.onclick = () => {
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };

    // --- GLOBAL BINDING ---
    // Ito ang kailangan para gumana ang onclick="window.emergencyDeploy()" sa HTML
    window.emergencyDeploy = submitMission;
}

init();
