// dbintel_script.js - CORE DASHBOARD v30.5

import { DEVICE_REGISTRY } from './config.js';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== GLOBAL STATE ==========
const currentAgent = localStorage.getItem("cia_agent") || "AGENT_LZ";
let selectedWeaponID = "";
let agentSignatures = []; 
let currentMissionData = null;

// ========== DOM ELEMENTS ==========
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

// ========== INITIALIZATION ==========
function init() {
    console.log("🚀 DASHBOARD INITIALIZED");
    console.log("Agent:", currentAgent);
    
    // Set agent info
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Setup terminal listener
    setupTerminalListener();
    
    // Setup event listeners
    setupEventListeners();
}

// ========== CLOCK ==========
function updateClock() {
    clockSpan.textContent = new Date().toLocaleTimeString('en-GB');
}

// ========== TERMINAL LOGS ==========
function setupTerminalListener() {
    onSnapshot(
        query(collection(db, "terminal_logs"), orderBy("timestamp", "desc"), limit(15)), 
        (snap) => {
            terminal.innerHTML = "";
            snap.forEach(doc => {
                const d = doc.data();
                const time = d.timestamp ? new Date(d.timestamp.seconds * 1000).toLocaleTimeString('en-GB') : "--";
                terminal.innerHTML += `<div class="term-line"><span style="color:#5c7882">[${time}]</span> <span style="color:${d.color}">${d.message}</span></div>`;
            });
        }
    );
}

// ========== ADD LOG ==========
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

// ========== RESET UI ==========
function resetUI() {
    statusLabel.innerHTML = "";
    actionBtn.textContent = "SAVE";
    actionBtn.className = "btn btn-save";
    actionBtn.style.opacity = "1";
    actionBtn.style.pointerEvents = "auto";
    reserveBtn.classList.remove('active');
}

// ========== SEARCH MISSION ==========
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
            actionBtn.style.pointerEvents = "auto";
            actionBtn.style.opacity = "1";
            reserveBtn.classList.remove('active');
            statusLabel.innerHTML = `<span class="status-deployed">STATUS: YOUR MISSION</span>`;
        } else {
            statusLabel.innerHTML = `<span style="color:var(--red);">ALREADY DEPLOYED BY ${owner}</span>`;
            actionBtn.textContent = "LOCKED";
            actionBtn.className = "btn btn-locked";
            actionBtn.style.pointerEvents = "none";
            actionBtn.style.opacity = "0.5";
            reserveBtn.classList.remove('active');
            addLog(`RESTRICTED: ${currentAgent} SCANNED ${owner}'S MISSION`, 'var(--red)');
        }
    } else {
        currentMissionData = null;
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        actionBtn.style.pointerEvents = "auto";
        actionBtn.style.opacity = "1";
        statusLabel.innerHTML = 'STATUS: AVAILABLE';
        reserveBtn.classList.add('active');
    }
}

// ========== RESET SECURE UI ==========
function resetSecureUI() {
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
}

// ========== RENDER WEAPONS ==========
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

// ========== OPEN MODAL ==========
async function openModal() {
    if (input.value.length < 4) return;
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

// ========== CLOSE MODAL ==========
function closeModal() {
    modalOverlay.style.display = 'none';
}

// ========== SUBMIT MISSION ==========
async function submitMission() {
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    
    if (!vID || !selectedWeaponID) {
        alert("INCOMPLETE DATA");
        return;
    }
    if (sLine !== "" && !sLine.startsWith("09")) {
        alert("INVALID PHONE NUMBER (must start with 09)");
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
    } catch(e) { 
        console.error(e);
        alert("ERROR SUBMITTING MISSION");
    }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    input.addEventListener('input', searchMission);
    actionBtn.onclick = openModal;
    modalSubmit.onclick = submitMission;
    modalClose.onclick = closeModal;
    secureBtn.onclick = () => {
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };
}

// ========== START APP ==========
init();

// js/intel_script.js - CORE INTEL v30.5

import { DEVICE_REGISTRY } from '../config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, arrayUnion, increment, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase Configuration
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

// DOM Elements
const vAgentInput = document.getElementById('vagent-input');
const scanStatus = document.getElementById('scan-status');
const deviceList = document.getElementById('device-list');
const authStatus = document.getElementById('auth-status');
const expenseModule = document.getElementById('expense-module');
const submitBtn = document.getElementById('submit-btn');
const expenseInput = document.getElementById('expense-input');

// State Variables
let selectedMissionDocId = null;
const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "AGENT_LZ";

// ========== INITIALIZATION ==========
function establishSession() {
    if (currentAgent) {
        authStatus.innerText = `AGENT: ${currentAgent}`;
        vAgentInput.disabled = false;
        scanStatus.innerText = "INPUT TARGET vAGENT# FOR VERIFICATION";
    } else {
        authStatus.innerHTML = `<span style="color:var(--red)">[ UNAUTHORIZED ]</span>`;
        scanStatus.innerHTML = "ACCESS DENIED: REDIRECTING TO DASHBOARD...";
        setTimeout(() => location.href = "dashboard.html", 3000);
    }
}

// ========== ADD LOG ==========
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

// ========== RESET UI ==========
function resetUI() {
    deviceList.innerHTML = "";
    expenseModule.style.opacity = "0.1";
    expenseModule.style.pointerEvents = "none";
    submitBtn.classList.remove('ready');
    selectedMissionDocId = null;
    expenseInput.value = "";
}

// ========== SEARCH vAGENT ==========
let typingTimer;

vAgentInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    const vInput = vAgentInput.value.trim();

    resetUI();

    if (vInput.length > 0 && currentAgent) {
        scanStatus.innerHTML = `<span class="blink">[VERIFYING IDENTITY] ${vInput}...</span>`;
        typingTimer = setTimeout(() => performHierarchySearch(vInput), 800);
    } else {
        scanStatus.innerText = "INPUT TARGET vAGENT# FOR VERIFICATION";
    }
});

async function performHierarchySearch(vInput) {
    try {
        const qMatch = query(
            collection(db, "mission_orders"), 
            where("vAgentID", "==", vInput),
            where("agent", "==", currentAgent)
        );

        const snapMatch = await getDocs(qMatch);

        if (snapMatch.empty) {
            const qGlobal = query(collection(db, "mission_orders"), where("vAgentID", "==", vInput));
            const snapGlobal = await getDocs(qGlobal);

            if (!snapGlobal.empty) {
                scanStatus.innerHTML = `<span style="color:var(--red)">[ACCESS DENIED] UNAUTHORIZED TARGET DETECTED</span>`;
                addLog(`SECURITY ALERT: ${currentAgent} ACCESSED FOREIGN TARGET ${vInput}`, 'var(--red)');
            } else {
                scanStatus.innerHTML = `<span style="color:var(--yellow)">[ERROR] vAGENT# ${vInput} NOT FOUND</span>`;
            }
            return;
        }

        scanStatus.innerHTML = `<span style="color:var(--green)">[IDENTITY MATCH] RETRIEVING WEAPON SYSTEM...</span>`;
        
        snapMatch.forEach(doc => {
            const data = doc.data();
            const btn = document.createElement('button');
            btn.className = "dev-btn";
            const deviceName = DEVICE_REGISTRY[data.weaponSystem] || `SIG: ${data.weaponSystem}`;

            btn.innerHTML = `
                <span style="font-size:9px; color:var(--cyan)">AUTHORIZED SYSTEM: ${data.weaponSystem}</span>
                <span style="font-weight:700">> ${deviceName}</span>
                <span style="font-size:10px; color:#5c7882; align-self:flex-end">MISSION_REF: #${data.missionID}</span>
            `;
            
            btn.onclick = () => {
                document.querySelectorAll('.dev-btn').forEach(x => x.classList.remove('active'));
                btn.classList.add('active');
                selectedMissionDocId = data.missionID; 
                expenseModule.style.opacity = "1";
                expenseModule.style.pointerEvents = "auto";
                submitBtn.classList.add('ready');
            };
            deviceList.appendChild(btn);
        });
    } catch (e) {
        console.error(e);
        scanStatus.innerHTML = `<span style="color:var(--red)">[FAILURE] SYSTEM_ACCESS_TIMED_OUT</span>`;
    }
}

// ========== EXPENSE INJECTION ==========
submitBtn.onclick = async () => {
    const amount = parseFloat(expenseInput.value);
    
    if (!selectedMissionDocId || isNaN(amount) || amount <= 0) {
        alert("CRITICAL ERROR: DATA MISMATCH OR INVALID AMOUNT.");
        return;
    }

    submitBtn.innerText = "INJECTING...";
    submitBtn.disabled = true;

    try {
        const ref = doc(db, "mission_orders", selectedMissionDocId);
        await addLog(`OVERRIDE: ₱${amount.toFixed(2)} INJECTED TO #${selectedMissionDocId}`, 'var(--yellow)');

        await updateDoc(ref, {
            expensesBreakdown: arrayUnion({ 
                amount: amount, 
                timestamp: new Date().toISOString(),
                injectedBy: currentAgent 
            }),
            totalExpenses: increment(amount)
        });
        
        alert("DATABASE OVERRIDDEN SUCCESSFULLY.");
        location.reload();
    } catch (e) { 
        console.error(e);
        alert("CRITICAL ERROR: INJECTION FAILED"); 
        submitBtn.innerText = "EXECUTE OVERRIDE";
        submitBtn.disabled = false;
    }
};

// ========== CLOCK ==========
setInterval(() => { 
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-GB'); 
}, 1000);

// ========== START ==========
establishSession();
