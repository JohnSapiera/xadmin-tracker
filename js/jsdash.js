// js/jsdash.js - CORE DASHBOARD (FINAL)

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
const saveBtn = document.getElementById('save-btn');
const reserveBtn = document.getElementById('reserve-btn');
const retrieveBtn = document.getElementById('retrieve-btn');
const viewBtn = document.getElementById('view-btn');
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

function closeModal() {
    modalOverlay.style.display = 'none';
    vAgentInput.disabled = false;
    secureField.disabled = false;
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    });
}

// ========== BUTTON VISIBILITY CONTROL ==========
function hideAllButtons() {
    saveBtn.style.display = 'none';
    reserveBtn.style.display = 'none';
    retrieveBtn.style.display = 'none';
    viewBtn.style.display = 'none';
}

function showButtonsByStatus(status, owner) {
    hideAllButtons();
    
    if (status === "AVAILABLE") {
        saveBtn.style.display = 'flex';
        reserveBtn.style.display = 'flex';
    } 
    else if (status === "RESERVED" && owner === currentAgent) {
        retrieveBtn.style.display = 'flex';
    }
    else if (status === "RESERVED" && owner !== currentAgent) {
        viewBtn.style.display = 'flex';
    }
    else if (status === "DEPLOYED" && owner === currentAgent) {
        retrieveBtn.style.display = 'flex';
        viewBtn.style.display = 'flex';
    }
    else if (status === "DEPLOYED" && owner !== currentAgent) {
        viewBtn.style.display = 'flex';
    }
    else if (status === "TERMINATED") {
        viewBtn.style.display = 'flex';
    }
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

// ========== CHECK MISSION STATUS ==========
async function checkMissionStatus(missionID) {
    try {
        const missionRef = doc(db, "mission_orders", missionID);
        const missionSnap = await getDoc(missionRef);
        
        if (missionSnap.exists()) {
            const docData = missionSnap.data();
            currentMissionData = docData;
            return {
                exists: true,
                status: docData.status || "DEPLOYED",
                owner: docData.agent,
                data: docData
            };
        } else {
            currentMissionData = null;
            return {
                exists: false,
                status: "AVAILABLE",
                owner: null,
                data: null
            };
        }
    } catch(e) {
        console.error("Check mission error:", e);
        return {
            exists: false,
            status: "ERROR",
            owner: null,
            data: null,
            error: true
        };
    }
}

// ========== UPDATE STATUS DISPLAY AND BUTTONS ==========
async function updateStatusAndButtons(missionID) {
    const result = await checkMissionStatus(missionID);
    
    if (result.error) {
        statusLabel.innerHTML = '<span style="color:#ff003c;">CONNECTION ERROR</span>';
        hideAllButtons();
        return;
    }
    
    if (!result.exists) {
        statusLabel.innerHTML = '<span style="color:#05ffa1;">AVAILABLE</span>';
        showButtonsByStatus("AVAILABLE", null);
    } else if (result.status === "TERMINATED") {
        statusLabel.innerHTML = '<span style="color:#8b0000;">STATUS: TERMINATED</span>';
        showButtonsByStatus("TERMINATED", result.owner);
    } else if (result.status === "RESERVED" && result.owner !== currentAgent) {
        statusLabel.innerHTML = `<span style="color:#ffbd00;">RESERVED BY: ${result.owner}</span>`;
        showButtonsByStatus("RESERVED", result.owner);
    } else if (result.status === "RESERVED" && result.owner === currentAgent) {
        statusLabel.innerHTML = '<span style="color:#ffbd00;">YOUR RESERVATION</span>';
        showButtonsByStatus("RESERVED", result.owner);
    } else if (result.owner === currentAgent) {
        statusLabel.innerHTML = '<span style="color:#00f3ff;">YOUR MISSION</span>';
        showButtonsByStatus("DEPLOYED", result.owner);
    } else {
        statusLabel.innerHTML = `<span style="color:#ff003c;">OWNED BY: ${result.owner}</span>`;
        showButtonsByStatus("DEPLOYED", result.owner);
    }
}

// ========== SAVE BUTTON (DEPLOY NEW MISSION) ==========
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
    
    addButtonClickEffect(saveBtn);
    
    const result = await checkMissionStatus(missionID);
    
    if (result.exists) {
        alert(`Mission ${missionID} already exists. Owner: ${result.owner}`);
        await updateStatusAndButtons(missionID);
        return;
    }
    
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

// ========== RESERVE BUTTON ==========
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
        alert(`Mission ${missionID} already exists. Cannot reserve. Owner: ${result.owner}`);
        await updateStatusAndButtons(missionID);
        return;
    }
    
    const confirmReserve = confirm(`Do you want to reserve mission order #${missionID}?`);
    
    if (confirmReserve) {
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
            hideAllButtons();
            
            alert(`Mission ${missionID} has been reserved successfully!`);
            
        } catch(e) {
            console.error("Reserve error:", e);
            alert("ERROR: " + e.message);
        }
    }
}

// ========== RETRIEVE BUTTON ==========
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
    
    addButtonClickEffect(retrieveBtn);
    
    const result = await checkMissionStatus(missionID);
    
    if (!result.exists) {
        alert(`Mission ${missionID} does not exist. Use SAVE to deploy.`);
        await updateStatusAndButtons(missionID);
        return;
    }
    
    if (result.status === "TERMINATED") {
        alert("This mission is TERMINATED and cannot be retrieved.");
        await updateStatusAndButtons(missionID);
        return;
    }
    
    if (result.owner !== currentAgent) {
        alert(`Mission ${missionID} is not assigned to you. Owner: ${result.owner}`);
        await updateStatusAndButtons(missionID);
        return;
    }
    
    popHeader.innerHTML = `${missionID}`;
    vAgentInput.value = result.data.vAgentID || "";
    selectedWeaponID = result.data.weaponSystem || "";
    secureField.value = result.data.SecureLine || "";
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
        submitRetrieveMission(missionID, result.status);
    };
}

// ========== VIEW BUTTON ==========
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
    
    addButtonClickEffect(viewBtn);
    
    const result = await checkMissionStatus(missionID);
    
    if (!result.exists) {
        alert(`Mission ${missionID} does not exist.`);
        return;
    }
    
    popHeader.innerHTML = `${missionID}`;
    vAgentInput.value = result.data.vAgentID || "";
    selectedWeaponID = result.data.weaponSystem || "";
    secureField.value = result.data.SecureLine || "";
    
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
        hideAllButtons();
        
        alert(`MISSION ${missionID} DEPLOYED SUCCESSFULLY!`);
        
    } catch(e) {
        console.error(e);
        alert("ERROR: " + e.message);
    }
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
        hideAllButtons();
        
        alert(`MISSION ${missionID} UPDATED SUCCESSFULLY!`);
        
    } catch(e) {
        console.error(e);
        alert("ERROR: " + e.message);
    }
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

// ========== AUTO SEARCH ==========
let autoSearchTimeout = null;

function onMissionInput() {
    const val = input.value.trim();
    
    if (autoSearchTimeout) clearTimeout(autoSearchTimeout);
    
    if (val.length === 0) {
        statusLabel.innerHTML = "";
        hideAllButtons();
        return;
    }
    
    if (val.length < 4) {
        statusLabel.innerHTML = 'ENTER 4-5 DIGITS';
        hideAllButtons();
        return;
    }
    
    const missionID = padMissionID(val);
    autoSearchTimeout = setTimeout(() => {
        updateStatusAndButtons(missionID);
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
    
    input.addEventListener('input', onMissionInput);
    
    saveBtn.addEventListener('click', onSaveClick);
    reserveBtn.addEventListener('click', onReserveClick);
    retrieveBtn.addEventListener('click', onRetrieveClick);
    viewBtn.addEventListener('click', onViewClick);
    
    modalClose.onclick = closeModal;
    secureBtn.onclick = toggleSecureLine;
    
    hideAllButtons();
    
    console.log("Dashboard ready for agent:", currentAgent);
}

init();
