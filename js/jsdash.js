// js/jsdash.js - CORE DASHBOARD (SIMPLIFIED WORKING)

// js/jsdash.js - CORE DASHBOARD (FIXED)

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

// Siguraduhing hindi double-initialize
if (!window.firebaseInitialized) {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    window.firebaseInitialized = true;
    window.db = db;
}

const db = window.db;

// ========== DOM ELEMENTS ==========
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

// ========== GLOBAL STATE ==========
const currentAgent = localStorage.getItem("cia_agent") || localStorage.getItem("agent") || "UNKNOWN_AGENT";
let selectedWeaponID = "";
let agentWeapons = [];
let currentMissionData = null;
let searchTimeout = null;

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
            db.collection("terminal_logs").add({ 
                agent: currentAgent, message: msg, color: color, timestamp: firebase.firestore.FieldValue.serverTimestamp() 
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
            if (d.message.includes("OVERRIDE")) color = "#ffbd00";
            if (d.message.includes("RESTRICTED")) color = "#ff003c";
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
        
        function setButtonStyle(button, text, className, disabled = false) {
            button.textContent = text;
            button.className = `btn ${className}`;
            button.disabled = disabled;
            button.style.opacity = disabled ? "0.5" : "1";
        }

function setModalSubmitHandler(handler) {
    if (modalSubmit.clickHandler) {
        modalSubmit.removeEventListener('click', modalSubmit.clickHandler);
    }
    modalSubmit.clickHandler = handler;
    modalSubmit.addEventListener('click', modalSubmit.clickHandler);
}
        
        // ========== LOAD WEAPON SYSTEMS FROM AGENTS COLLECTION ==========
        async function loadAgentWeapons() {
            console.log("Loading weapons for agent:", currentAgent);
            try {
                const snapshot = await db.collection("agents").where("agentName", "==", currentAgent).get();
                if (!snapshot.empty) {
                    const agentData = snapshot.docs[0].data();
                    agentWeapons = agentData.weaponSystem || [];
                    console.log("Weapons loaded:", agentWeapons);
                } else {
                    console.log("Agent not found, using defaults");
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
        
        function renderWeapons(highlightWeapon = null) {
            weaponList.innerHTML = "";
            agentWeapons.forEach(weaponName => {
                const btn = document.createElement('button');
                btn.className = "weapon-btn";
                btn.innerText = `> ${weaponName}`;
                if (highlightWeapon === weaponName) {
                    btn.classList.add('selected');
                    selectedWeaponID = weaponName;
                }
                btn.onclick = () => {
                    document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedWeaponID = weaponName;
                    addButtonClickEffect(btn);
                    console.log("Weapon selected:", selectedWeaponID);
                };
                weaponList.appendChild(btn);
            });
        }
        
        function enableButtons() {
    actionBtn.disabled = false;
    actionBtn.style.opacity = "1";
    reserveBtn.disabled = false;
    reserveBtn.style.opacity = "1";
}
        
        // Function para i-reset ang UI kapag walang laman ang input
function resetUI() {
    statusLabel.innerHTML = "";
    setButtonStyle(actionBtn, "SAVE", "btn-save", false);
    setButtonStyle(reserveBtn, "RESERVE", "btn-reserve", false);
    currentMissionData = null;
    
    // I-reset ang onclick handlers
    actionBtn.onclick = null;
    reserveBtn.onclick = null;
}

// Function para mag-search ng mission
async function searchMission(missionID) {
    statusLabel.innerHTML = 'SCANNING DATABASE...';
    actionBtn.disabled = true;
    reserveBtn.disabled = true;
    
    try {
        console.log("Searching for mission ID:", missionID);
        
        const missionRef = doc(db, "mission_orders", missionID);
        const missionSnap = await getDoc(missionRef);
        
        console.log("Document exists?", missionSnap.exists());
        
        if (missionSnap.exists()) {
            const docData = missionSnap.data();
            const owner = docData.agent;
            currentMissionData = docData;
            
            if (owner === currentAgent) {
                statusLabel.innerHTML = '<span style="color:#00f3ff;">YOUR MISSION</span>';
                setButtonStyle(actionBtn, "RETRIEVE", "btn-retrieve", false);
                actionBtn.onclick = () => openRetrieveModal();
                setButtonStyle(reserveBtn, "VIEW", "btn-view", false);
                reserveBtn.onclick = () => openViewModal(missionID);
            } else {
                statusLabel.innerHTML = `<span style="color:#ff003c;">OWNED BY: ${owner}</span>`;
                setButtonStyle(actionBtn, "LOCKED", "btn-locked", true);
                setButtonStyle(reserveBtn, "VIEW", "btn-view", false);
                reserveBtn.onclick = () => openViewModal(missionID);
            }
        } else {
            currentMissionData = null;
            statusLabel.innerHTML = '<span style="color:#05ffa1;">AVAILABLE</span>';
            setButtonStyle(actionBtn, "SAVE", "btn-save", false);
            actionBtn.onclick = () => openModal();
            setButtonStyle(reserveBtn, "RESERVE", "btn-reserve", false);
            reserveBtn.onclick = () => {
                const missionID = padMissionID(input.value.trim());
                if (missionID) {
                    alert("Mission " + missionID + " is available. Click SAVE to deploy.");
                }
            };
        }
        enableButtons();
        
    } catch(e) {
    console.log(e);
    statusLabel.innerHTML = '';
    enableButtons();
}
}

// Main function para sa input changes
function onMissionInput() {
    const val = input.value.trim();
    
    if (searchTimeout) clearTimeout(searchTimeout);
    
    // Kapag walang laman ang input
    if (val.length === 0) {
        resetUI();
        return;
    }
    
    // Kapag kulang sa 4 digits
    if (val.length < 4) {
        statusLabel.innerHTML = 'ENTER 4-5 DIGITS';
        setButtonStyle(actionBtn, "SAVE", "btn-save", false);
        setButtonStyle(reserveBtn, "RESERVE", "btn-reserve", false);
        actionBtn.onclick = null;
        reserveBtn.onclick = null;
        return;
    }
    
    // Kapag tama ang digits (4-5)
    const missionID = padMissionID(val);
    
    // Mag-antay bago mag-search para hindi sa bawat letra
    searchTimeout = setTimeout(() => {
        searchMission(missionID);
    }, 400);
}

        // ========== OPEN MODAL FOR SAVE (DEPLOY) ==========
       async function openModal() {
    const missionID = padMissionID(input.value.trim());
    if (!missionID) return;
    
    addButtonClickEffect(actionBtn);
    
    document.getElementById('pop-header').innerHTML = `MISSION ${missionID}`;
    vAgentInput.value = "";
    selectedWeaponID = "";
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
    
    await loadAgentWeapons();
    renderWeapons();
    
    modalOverlay.style.display = 'flex';
    modalSubmit.textContent = "DEPLOY";
    modalSubmit.className = "btn btn-save";
    modalSubmit.disabled = false;
    modalSubmit.style.opacity = "1";
    
    // I-remove ang lumang event listener at magdagdag ng bago
    modalSubmit.removeEventListener('click', modalSubmit.clickHandler);
    modalSubmit.clickHandler = () => {
        addButtonClickEffect(modalSubmit);
        submitMission(missionID, false);
    };
    modalSubmit.addEventListener('click', modalSubmit.clickHandler);
}
        
        // ========== OPEN MODAL FOR RETRIEVE (UPDATE) ==========
        // Hanapin ito sa openRetrieveModal function
modalSubmit.onclick = () => {
    addButtonClickEffect(modalSubmit);
    submitMission(missionID, true);
};

// Palitan ng:
modalSubmit.removeEventListener('click', modalSubmit.clickHandler);
modalSubmit.clickHandler = () => {
    addButtonClickEffect(modalSubmit);
    submitMission(missionID, true);
};
modalSubmit.addEventListener('click', modalSubmit.clickHandler);
        
        // ========== OPEN MODAL FOR VIEW ONLY ==========
        async function openViewModal(missionID) {
            addButtonClickEffect(reserveBtn);
            
            const snapshot = await db.collection("mission_orders").where("missionID", "==", missionID).get();
            if (snapshot.empty) {
                alert("Mission not found");
                return;
            }
            const data = snapshot.docs[0].data();
            
            document.getElementById('pop-header').innerHTML = `MISSION ${missionID}`;
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
                btn.style.opacity = '0.6';
            });
            
            modalOverlay.style.display = 'flex';
            modalSubmit.textContent = "CLOSE";
            modalSubmit.className = "btn btn-view";
            modalSubmit.disabled = false;
            modalSubmit.onclick = closeModal;
        }
        
        // ========== SUBMIT MISSION ==========
       async function submitMission(missionID, isUpdate) {
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
        // Gamitin ang missionID bilang document name
        const missionRef = doc(db, "mission_orders", missionID);
        
        await setDoc(missionRef, {
            agent: currentAgent,
            missionID: missionID,
            vAgentID: vID,
            weaponSystem: weaponSystem,
            SecureLine: sLine || "",
            deploymentDate: deploymentDate,
            relieveDate: relieveDate,
            timestamp: serverTimestamp()
        }, { merge: true });
        
        addLog(`Mission ${missionID} ${isUpdate ? 'UPDATED' : 'DEPLOYED'} by ${currentAgent}`, '#05ffa1');
        closeModal();
        input.value = "";
        statusLabel.innerHTML = "";
        setButtonStyle(actionBtn, "SAVE", "btn-save", false);
        currentMissionData = null;
        alert(`MISSION ${isUpdate ? 'UPDATED' : 'DEPLOYED'} SUCCESSFULLY!`);
        
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
        
        // ========== INITIALIZATION ==========
        async function init() {
            profName.innerText = currentAgent;
            avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
            
            function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB');
    clockSpan.textContent = timeString;
}
updateClock();
setInterval(updateClock, 1000);
            
            setupTerminalListener();
            await loadAgentWeapons();
            
            input.addEventListener('input', searchMission);
            modalClose.onclick = closeModal;
            secureBtn.onclick = toggleSecureLine;
            
            console.log("Dashboard ready for agent:", currentAgent);
        }
        
        init();
