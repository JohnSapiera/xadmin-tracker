// js/jsdash.js - CORE DASHBOARD

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
    addDoc(collection(db, "terminal_logs"), { 
        agent: currentAgent, message: msg, color: color, timestamp: serverTimestamp() 
    }).catch(e => console.error(e));
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

async function loadAgentWeapons() {
    try {
        const agentDoc = await getDoc(doc(db, "agents", currentAgent));
        if (agentDoc.exists()) {
            agentWeapons = agentDoc.data().linkedSignatures || [];
        }
        if (agentWeapons.length === 0) {
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
    } catch (error) {
        agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
    }
}

function renderWeapons(highlightWeapon = null) {
    weaponList.innerHTML = "";
    agentWeapons.forEach(weaponName => {
        const btn = document.createElement('button');
        btn.className = "weapon-btn";
        btn.innerText = `> ${weaponName}`;
        btn.setAttribute('data-weapon-id', weaponName);
        if (highlightWeapon === weaponName) {
            btn.classList.add('selected');
            selectedWeaponID = weaponName;
        }
        btn.onclick = () => {
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWeaponID = weaponName;
            SoundFX.click();
        };
        weaponList.appendChild(btn);
    });
}

// ====== SEARCH MISSION ======
async function searchMission() {
    const val = input.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (val.length === 0) {
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        reserveBtn.textContent = "RESERVE";
        reserveBtn.className = "btn btn-reserve";
        statusLabel.innerHTML = "";
        return;
    }
    
    if (val.length < 4) {
        statusLabel.innerHTML = 'Enter 4-5 digits';
        return;
    }
    
    const missionID = padMissionID(val);
    statusLabel.innerHTML = 'SCANNING...';
    
    try {
        const qM = query(collection(db, "mission_orders"), where("missionID", "==", missionID));
        const snapM = await getDocs(qM);
        
        if (!snapM.empty) {
            currentMissionData = snapM.docs[0].data();
            const owner = currentMissionData.agent;
            const status = currentMissionData.status;
            
            if (status === "TERMINATED") {
                statusLabel.innerHTML = 'STATUS: TERMINATED';
                actionBtn.textContent = "LOCKED";
                actionBtn.className = "btn btn-locked";
                actionBtn.disabled = true;
                reserveBtn.textContent = "VIEW";
                reserveBtn.className = "btn btn-view";
                reserveBtn.disabled = false;
                addLog(`Mission ${missionID} is TERMINATED.`, '#8b0000');
                return;
            }
            
            if (owner === currentAgent) {
                statusLabel.innerHTML = 'STATUS: YOUR MISSION';
                actionBtn.textContent = "RETRIEVE";
                actionBtn.className = "btn btn-retrieve";
                actionBtn.disabled = false;
                reserveBtn.textContent = "RESERVE";
                reserveBtn.className = "btn btn-reserve";
                addLog(`Mission ${missionID} found. Ready to RETRIEVE.`, '#00f3ff');
            } else {
                statusLabel.innerHTML = `OWNED BY ${owner}`;
                actionBtn.textContent = "LOCKED";
                actionBtn.className = "btn btn-locked";
                actionBtn.disabled = true;
                reserveBtn.textContent = "VIEW";
                reserveBtn.className = "btn btn-view";
                reserveBtn.disabled = false;
                addLog(`Mission ${missionID} is owned by ${owner}.`, '#ff003c');
                return;
            }
        } else {
            currentMissionData = null;
            statusLabel.innerHTML = 'STATUS: AVAILABLE';
            actionBtn.textContent = "DEPLOY";
            actionBtn.className = "btn btn-save";
            actionBtn.disabled = false;
            reserveBtn.textContent = "RESERVE";
            reserveBtn.className = "btn btn-reserve";
            addLog(`Mission ${missionID} is AVAILABLE.`, '#05ffa1');
        }
        
        actionBtn.onclick = openModal;
        reserveBtn.onclick = () => openReserveModal(missionID);
        
    } catch(e) {
        console.error(e);
        statusLabel.innerHTML = 'ERROR';
    }
}

// ====== OPEN MODAL FOR SAVE/DEPLOY ======
async function openModal() {
    const missionID = padMissionID(input.value.trim());
    if (!missionID) return;
    
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerHTML = `<span style="color:#00f3ff;">#${missionID}</span> <span style="font-size:12px; color:#5c7882;">[NEW]</span>`;
    
    // Reset form
    vAgentInput.value = "";
    selectedWeaponID = "";
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
    secureBtn.innerHTML = '+ Secure Line';
    
    await loadAgentWeapons();
    renderWeapons();
    
    modalSubmit.textContent = "DEPLOY";
    modalSubmit.className = "btn btn-save";
    modalSubmit.disabled = false;
    modalSubmit.style.opacity = "1";
    
    // Store current mission ID for submit
    modalSubmit.onclick = () => submitMission(missionID, false);
}

// ====== OPEN MODAL FOR RETRIEVE/UPDATE ======
async function openRetrieveModal() {
    if (!currentMissionData) return;
    
    const missionID = currentMissionData.missionID;
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerHTML = `<span style="color:#00f3ff;">#${missionID}</span> <span style="font-size:12px; color:#5c7882;">[UPDATE]</span>`;
    
    vAgentInput.value = currentMissionData.vAgentID || "";
    selectedWeaponID = currentMissionData.weaponSystem || "";
    secureField.value = currentMissionData.SecureLine || "";
    if (secureField.value) {
        secureField.classList.add('show');
        secureBtn.style.display = 'none';
    } else {
        secureField.classList.remove('show');
        secureBtn.style.display = 'block';
    }
    secureBtn.innerHTML = '+ Secure Line';
    
    await loadAgentWeapons();
    renderWeapons(selectedWeaponID);
    
    modalSubmit.textContent = "UPDATE";
    modalSubmit.className = "btn btn-retrieve";
    modalSubmit.disabled = false;
    modalSubmit.style.opacity = "1";
    
    modalSubmit.onclick = () => submitMission(missionID, true);
}

// ====== OPEN MODAL FOR VIEW ONLY (RESERVE/VIEW) ======
async function openReserveModal(missionID) {
    if (!missionID) {
        const val = input.value.trim();
        if (val.length < 4) {
            alert("Enter valid mission ID");
            return;
        }
        missionID = padMissionID(val);
    }
    
    // Fetch mission data
    const qM = query(collection(db, "mission_orders"), where("missionID", "==", missionID));
    const snapM = await getDocs(qM);
    if (snapM.empty) {
        alert("Mission not found");
        return;
    }
    const data = snapM.docs[0].data();
    
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerHTML = `<span style="color:#ff003c;">#${missionID}</span> <span style="font-size:12px; color:#5c7882;">[VIEW ONLY]</span>`;
    
    vAgentInput.value = data.vAgentID || "";
    selectedWeaponID = data.weaponSystem || "";
    secureField.value = data.SecureLine || "";
    if (secureField.value) {
        secureField.classList.add('show');
        secureBtn.style.display = 'none';
    } else {
        secureField.classList.remove('show');
        secureBtn.style.display = 'block';
    }
    secureBtn.innerHTML = '+ Secure Line';
    
    // Disable editing for view mode
    vAgentInput.disabled = true;
    secureField.disabled = true;
    secureBtn.style.display = 'none';
    
    await loadAgentWeapons();
    renderWeapons(selectedWeaponID);
    // Disable weapon selection in view mode
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.7';
    });
    
    modalSubmit.textContent = "CLOSE";
    modalSubmit.className = "btn btn-view";
    modalSubmit.disabled = false;
    modalSubmit.onclick = closeModal;
}

// ====== SUBMIT MISSION ======
async function submitMission(missionID, isUpdate) {
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    
    if (!vID) {
        alert("Enter vAgent ID");
        return;
    }
    if (!selectedWeaponID) {
        alert("Select a weapon system");
        return;
    }
    
    const now = new Date();
    const deploymentDate = formatDate(now);
    const relieveDate = formatDate(calculateRelieveDate(now));
    
    try {
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
        
        addLog(`Mission #${missionID} ${isUpdate ? 'UPDATED' : 'DEPLOYED'} by ${currentAgent}`, '#05ffa1');
        closeModal();
        input.value = "";
        statusLabel.innerHTML = "";
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        currentMissionData = null;
        alert(`✅ MISSION ${isUpdate ? 'UPDATED' : 'DEPLOYED'} SUCCESSFULLY!`);
        
        // Re-enable view mode elements
        vAgentInput.disabled = false;
        secureField.disabled = false;
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        });
        
    } catch(e) {
        console.error(e);
        alert("ERROR: " + e.message);
    }
}

function closeModal() {
    modalOverlay.style.display = 'none';
    // Re-enable view mode elements
    vAgentInput.disabled = false;
    secureField.disabled = false;
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    });
}

// ====== SECURE LINE TOGGLE ======
function toggleSecureLine() {
    const wrapper = document.querySelector('.secure-line-wrapper');
    const field = secureField;
    const btn = secureBtn;
    
    if (field.classList.contains('show')) {
        field.classList.remove('show');
        btn.style.display = 'block';
        btn.innerHTML = '+ Secure Line';
    } else {
        field.classList.add('show');
        btn.style.display = 'none';
        field.focus();
    }
}

// ====== INIT ======
function init() {
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    updateClock();
    setInterval(updateClock, 1000);
    setupTerminalListener();
    loadAgentWeapons();
    
    input.addEventListener('input', searchMission);
    modalClose.onclick = closeModal;
    secureBtn.onclick = toggleSecureLine;
    
    console.log("Dashboard ready");
}

function updateClock() {
    clockSpan.textContent = new Date().toLocaleTimeString('en-GB');
}

// Override action button onclick based on mode
setInterval(() => {
    if (actionBtn.textContent === "RETRIEVE" && actionBtn.onclick !== openRetrieveModal) {
        actionBtn.onclick = openRetrieveModal;
    } else if (actionBtn.textContent === "DEPLOY" && actionBtn.onclick !== openModal) {
        actionBtn.onclick = openModal;
    } else if (actionBtn.textContent === "SAVE" && actionBtn.onclick !== openModal) {
        actionBtn.onclick = openModal;
    }
}, 100);

init();
