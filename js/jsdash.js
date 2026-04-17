// js/jsdash.js - CORE DASHBOARD

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

// ====== LOAD WEAPON SYSTEMS FROM AGENTS COLLECTION ======
async function loadAgentWeapons() {
    console.log("Loading weapon systems for agent:", currentAgent);
    try {

    // Hanapin ang agent document gamit ang agentName
        const agentQuery = query(collection(db, "agents"), where("agentName", "==", currentAgent));
        const agentSnap = await getDocs(agentQuery);
        
        if (!agentSnap.empty) {
            const agentData = agentSnap.docs[0].data();
            // Kunin ang weaponSystem array (hindi linkedSignatures)
            agentWeapons = agentData.weaponSystem || [];
            console.log("Weapon systems found:", agentWeapons);
        } else {
            console.log("Agent not found, using default weapons");
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
        
        if (agentWeapons.length === 0) {
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
    } catch (error) {
        console.error("Error loading weapons:", error);
        agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
    }
}
@@ -122,13 +133,12 @@
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWeaponID = weaponName;


// ====== BUTTON TRANSITION ======
function transitionButton(button, newText, newClass) {
    button.style.transition = 'all 0.3s ease';
    button.style.transform = 'scale(0.95)';
@@ -142,25 +152,18 @@
    }, 150);
}

function enableButtons() {
    actionBtn.disabled = false;
    actionBtn.style.opacity = "1";
    actionBtn.style.pointerEvents = "auto";
    reserveBtn.disabled = false;
    reserveBtn.style.opacity = "1";
    reserveBtn.style.pointerEvents = "auto";
    reserveBtn.style.borderColor = "#ffbd00";
    reserveBtn.style.color = "#ffbd00";
}

// ====== SEARCH MISSION ======
async function searchMission() {
    const val = input.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);

    async function searchMission() {
    const val = input.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);

    if (val.length === 0) {
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        reserveBtn.textContent = "RESERVE";
        reserveBtn.className = "btn btn-reserve";
        reserveBtn.style.borderColor = "#ffbd00";
        reserveBtn.style.color = "#ffbd00";
        statusLabel.innerHTML = "";
        return;
    }
@@ -180,19 +185,12 @@
    }

    const missionID = padMissionID(val);

     statusLabel.innerHTML = '<span class="blink">SCANNING...</span>';
     actionBtn.disabled = true;
    reserveBtn.disabled = true;

     searchTimeout = setTimeout(async () => {

         try {
            const qM = query(collection(db, "mission_orders"), where("missionID", "==", missionID));
            const snapM = await getDocs(qM);

            if (!snapM.empty) {
                currentMissionData = snapM.docs[0].data();
                const owner = currentMissionData.agent;
                const status = currentMissionData.status;

                if (status === "TERMINATED") {
                    statusLabel.innerHTML = '<span style="color:#8b0000;">STATUS: TERMINATED</span>';
                    transitionButton(actionBtn, "LOCKED", "btn-locked");
                    actionBtn.disabled = true;
                    transitionButton(reserveBtn, "VIEW", "btn-view");
                    reserveBtn.disabled = false;
                    reserveBtn.onclick = () => openViewModal(missionID);
                    addLog(`Mission ${missionID} is TERMINATED.`, '#8b0000');
                } else if (owner === currentAgent) {
                    statusLabel.innerHTML = '<span style="color:#00f3ff;">STATUS: YOUR MISSION</span>';
                    transitionButton(actionBtn, "RETRIEVE", "btn-retrieve");
                    actionBtn.disabled = false;
                    actionBtn.onclick = openRetrieveModal;
                    transitionButton(reserveBtn, "RESERVE", "btn-reserve");
                    reserveBtn.disabled = false;
                    reserveBtn.style.borderColor = "#ffbd00";
                    reserveBtn.style.color = "#ffbd00";
                    reserveBtn.onclick = () => openViewModal(missionID);

                     } else {
                    statusLabel.innerHTML = `<span style="color:#ff003c;">OWNED BY ${owner}</span>`;
                    transitionButton(actionBtn, "LOCKED", "btn-locked");
                    actionBtn.disabled = true;
                    transitionButton(reserveBtn, "VIEW", "btn-view");
                    reserveBtn.disabled = false;
                    reserveBtn.onclick = () => openViewModal(missionID);

                     }
            } else {
                currentMissionData = null;
                statusLabel.innerHTML = '<span style="color:#05ffa1;">STATUS: AVAILABLE</span>';
                transitionButton(actionBtn, "DEPLOY", "btn-save");
                actionBtn.disabled = false;
                actionBtn.onclick = openModal;
                transitionButton(reserveBtn, "RESERVE", "btn-reserve");
                reserveBtn.disabled = false;
                reserveBtn.style.borderColor = "#ffbd00";
                reserveBtn.style.color = "#ffbd00";
                reserveBtn.onclick = () => openViewModal(missionID);
                addLog(`Mission ${missionID} is AVAILABLE.`, '#05ffa1');
            }

               enableButtons();

        } catch(e) {
            console.error(e);
            statusLabel.innerHTML = '<span style="color:#ff003c;">DATABASE ERROR</span>';
            actionBtn.disabled = false;
            reserveBtn.disabled = false;
        }

          }, 300);
}

/ ====== OPEN MODAL FOR DEPLOY (SAVE) ======
async function openModal() {
    const missionID = padMissionID(input.value.trim());
    if (!missionID) return;

    async function openModal() {
    const missionID = padMissionID(input.value.trim());
    if (!missionID) return;

    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerHTML = `<span style="color:#00f3ff;">#${missionID}</span> <span style="font-size:12px; color:#5c7882;">[NEW]</span>`;

    vAgentInput.value = "";
    selectedWeaponID = "";
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
    secureBtn.innerHTML = '+ Secure Line';
    vAgentInput.disabled = false;
    secureField.disabled = false;

    await loadAgentWeapons();
    renderWeapons();

    // FORCE ENABLE DEPLOY BUTTON
    modalSubmit.disabled = false;
    modalSubmit.style.opacity = "1";
    modalSubmit.textContent = "DEPLOY";
    modalSubmit.className = "btn btn-save";

    modalSubmit.onclick = () => submitMission(missionID, false);
    }

    // ====== OPEN MODAL FOR UPDATE (RETRIEVE) ======
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
    vAgentInput.disabled = false;
    secureField.disabled = false;

    await loadAgentWeapons();
    renderWeapons(selectedWeaponID);

    modalSubmit.disabled = false;
    modalSubmit.style.opacity = "1";
    modalSubmit.textContent = "UPDATE";
    modalSubmit.className = "btn btn-retrieve";

     modalSubmit.onclick = () => submitMission(missionID, true);
}

// ====== OPEN MODAL FOR VIEW ONLY ======
async function openViewModal(missionID) {
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
    } else {
        secureField.classList.remove('show');
    }
    secureBtn.style.display = 'none';

    vAgentInput.disabled = true;
    secureField.disabled = true;

    await loadAgentWeapons();
    renderWeapons(selectedWeaponID);
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
    vAgentInput.disabled = false;
    secureField.disabled = false;
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    });
}

// ====== SECURE LINE TOGGLE ======
function toggleSecureLine() {
    if (secureField.classList.contains('show')) {
        secureField.classList.remove('show');

     secureBtn.style.display = 'block';
        secureBtn.innerHTML = '+ Secure Line';
    } else {
        secureField.classList.add('show');
        secureBtn.style.display = 'none';
        secureField.focus();
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

init();
