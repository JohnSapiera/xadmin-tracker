// js/jsdash.js - CORE DASHBOARD v30.5 (FORCE CLICK DEPLOY BUTTON)

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

const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";
console.log("Agent:", currentAgent);

let selectedWeaponID = "";
let agentWeapons = [];
let currentMissionData = null;
let isMissionTerminated = false;
let searchTimeout = null;

// DOM Elements
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

function padMissionID(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length >= 5) return digits.slice(0, 5);
    if (digits.length <= 3) return digits.padStart(5, '0');
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

function setStatusColor(status, message) {
    let color = '';
    switch(status) {
        case 'available': color = '#05ffa1'; break;
        case 'reserve': color = '#ffbd00'; break;
        case 'terminated': color = '#8b0000'; break;
        case 'other_agent': color = '#ff003c'; break;
        case 'your_mission': color = '#00f3ff'; break;
        default: color = '#5c7882';
    }
    statusLabel.innerHTML = `<span style="color:${color};">${message}</span>`;
}

function init() {
    console.log("Dashboard initializing for agent:", currentAgent);
    if (!currentAgent || currentAgent === "UNKNOWN_AGENT") {
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
    console.log("Dashboard ready");
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
            let color = d.color;
            if (d.message.includes("DEPLOYED")) color = "#05ffa1";
            if (d.message.includes("RETRIEVED")) color = "#00f3ff";
            if (d.message.includes("OVERRIDE")) color = "#ffbd00";
            if (d.message.includes("RESTRICTED")) color = "#ff003c";
            if (d.message.includes("TERMINATED")) color = "#8b0000";
            terminal.innerHTML += `<div class="term-line"><span style="color:#5c7882">[${time}]</span> <span style="color:${color}">${d.message}</span></div>`;
        });
    });
}

async function addLog(msg, color) {
    try {
        await addDoc(collection(db, "terminal_logs"), { agent: currentAgent, message: msg, color: color, timestamp: serverTimestamp() });
    } catch(e) { console.error("Log error:", e); }
}

async function loadAgentWeapons() {
    console.log("Loading weapons for agent:", currentAgent);
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
        
        agentWeapons = Array.from(weaponSet).sort();
        if (agentWeapons.length === 0) {
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
        console.log("Weapons loaded:", agentWeapons);
    } catch (error) {
        console.error("Error loading weapons:", error);
        agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
    }
}

function resetUI() {
    actionBtn.textContent = "SAVE";
    actionBtn.className = "btn btn-save";
    actionBtn.disabled = false;
    actionBtn.style.opacity = "1";
    actionBtn.style.pointerEvents = "auto";
    actionBtn.onclick = openModal;
    reserveBtn.classList.remove('active');
    isMissionTerminated = false;
    currentMissionData = null;
}

// ====== FORCE ENABLE DEPLOY BUTTON (NO CONDITIONS) ======
function forceEnableDeployButton() {
    if (modalSubmit) {
        modalSubmit.disabled = false;
        modalSubmit.style.opacity = "1";
        modalSubmit.style.cursor = "pointer";
        console.log("🔥 DEPLOY button force enabled");
    }
}

async function promptScanConfirmation(rawValue) {
    return new Promise((resolve) => {
        const confirmScan = confirm(`Mission ID "${rawValue}" will be scanned as "${padMissionID(rawValue)}".\n\nDo you want to continue?`);
        resolve(confirmScan);
    });
}

async function performSearch(rawValue) {
    if (rawValue.length === 0) { resetUI(); return; }
    
    const paddedMissionID = padMissionID(rawValue);
    console.log("Searching for:", paddedMissionID);
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
                setStatusColor('terminated', 'MISSION TERMINATED - ACCESS DENIED');
                actionBtn.textContent = "TERMINATED";
                actionBtn.className = "btn btn-locked";
                actionBtn.disabled = true;
                actionBtn.onclick = null;
                reserveBtn.classList.remove('active');
                addLog(`Mission ${paddedMissionID} is TERMINATED. Access denied.`, '#8b0000');
                return;
            }
            
            isMissionTerminated = false;
            
            if (owner === currentAgent) {
                setStatusColor('your_mission', 'STATUS: YOUR MISSION');
                actionBtn.textContent = "RETRIEVE";
                actionBtn.className = "btn btn-retrieve";
                actionBtn.disabled = false;
                actionBtn.style.opacity = "1";
                actionBtn.onclick = openModal;
                reserveBtn.classList.remove('active');
                addLog(`Mission ${paddedMissionID} found. Ready to RETRIEVE.`, '#00f3ff');
            } else {
                setStatusColor('other_agent', `OWNED BY ${owner}`);
                actionBtn.textContent = "LOCKED";
                actionBtn.className = "btn btn-locked";
                actionBtn.disabled = true;
                actionBtn.onclick = null;
                reserveBtn.classList.remove('active');
                addLog(`Mission ${paddedMissionID} is owned by ${owner}. Access denied.`, '#ff003c');
            }
        } else {
            currentMissionData = null;
            isMissionTerminated = false;
            setStatusColor('available', 'STATUS: AVAILABLE');
            actionBtn.textContent = "SAVE";
            actionBtn.className = "btn btn-save";
            actionBtn.disabled = false;
            actionBtn.style.opacity = "1";
            actionBtn.onclick = openModal;
            reserveBtn.classList.add('active');
            addLog(`Mission ${paddedMissionID} is AVAILABLE. Ready to DEPLOY.`, '#05ffa1');
        }
    } catch (error) {
        console.error("Search error:", error);
        setStatusColor('terminated', 'DATABASE ERROR');
        addLog(`Database error scanning mission ${paddedMissionID}`, '#ff003c');
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        actionBtn.disabled = false;
        actionBtn.onclick = openModal;
    }
}

async function searchMission() {
    const rawValue = input.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (rawValue.length === 0) { resetUI(); return; }
    
    const digitCount = rawValue.length;
    
    if (digitCount >= 1 && digitCount <= 3) {
        setStatusColor('reserve', `SCAN REQUIRED: "${rawValue}" will be scanned as "${padMissionID(rawValue)}"`);
        actionBtn.textContent = "SCAN";
        actionBtn.className = "btn btn-reserve";
        actionBtn.disabled = false;
        actionBtn.onclick = async () => {
            const confirmed = await promptScanConfirmation(rawValue);
            if (confirmed) {
                await performSearch(rawValue);
            } else {
                setStatusColor('reserve', 'SCAN CANCELLED');
                resetUI();
            }
        };
        return;
    }
    
    if (digitCount >= 4) {
        setStatusColor('available', `SCANNING IN 0.3s...`);
        actionBtn.disabled = true;
        actionBtn.style.opacity = "0.5";
        
        searchTimeout = setTimeout(async () => {
            await performSearch(rawValue);
            searchTimeout = null;
        }, 300);
    }
}

function renderWeapons() {
    weaponList.innerHTML = "";
    if (!agentWeapons || agentWeapons.length === 0) {
        weaponList.innerHTML = '<div style="text-align:center; padding:10px; color:#ffbd00;">No weapons available.</div>';
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
            console.log("Weapon selected:", selectedWeaponID);
            // No need to call update function, button is already force-enabled
        };
        weaponList.appendChild(btn);
    });
}

async function openModal() {
    console.log("openModal called");
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
    
    vAgentInput.value = "";
    selectedWeaponID = "";
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
    
    // ✅ FORCE ENABLE DEPLOY BUTTON IMMEDIATELY
    forceEnableDeployButton();
    
    await loadAgentWeapons();
    
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
        modalSubmit.textContent = "DEPLOY";
    }
    
    renderWeapons();
    
    if (selectedWeaponID) {
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            if (btn.getAttribute('data-weapon-id') === selectedWeaponID) {
                btn.classList.add('selected');
            }
        });
    }
    
    // Additional safety: force enable again after a short delay
    setTimeout(forceEnableDeployButton, 200);
}

function closeModal() {
    SoundFX.click();
    modalOverlay.style.display = 'none';
}

async function submitMission() {
    console.log("SUBMIT MISSION CALLED");
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
        addLog(`Mission #${missionID} ${currentMissionData ? 'UPDATED' : 'DEPLOYED'} by ${currentAgent}`, '#05ffa1');
        closeModal();
        input.value = "";
        resetUI();
        currentMissionData = null;
        await loadAgentWeapons();
        alert(`✅ MISSION ${currentMissionData ? 'UPDATED' : 'DEPLOYED'} SUCCESSFULLY!`);
    } catch(e) {
        SoundFX.error();
        console.error(e);
        alert("ERROR: " + e.message);
    }
}

function setupEventListeners() {
    input.addEventListener('input', searchMission);
    modalClose.onclick = closeModal;
    modalSubmit.onclick = submitMission;
    // vAgent input no longer needed to enable button, but we keep for data collection
    secureBtn.onclick = () => {
        SoundFX.click();
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };
    reserveBtn.onclick = () => {
        SoundFX.click();
        alert("RESERVE function - coming soon");
    };
}

init();
