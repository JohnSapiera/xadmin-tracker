// js/jsintel.js - CORE INTEL with Sounds

import SoundFX from './sound.js';
import { DEVICE_REGISTRY } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, arrayUnion, increment, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

const vAgentInput = document.getElementById('vagent-input');
const scanStatus = document.getElementById('scan-status');
const deviceList = document.getElementById('device-list');
const authStatus = document.getElementById('auth-status');
const expenseModule = document.getElementById('expense-module');
const submitBtn = document.getElementById('submit-btn');
const expenseInput = document.getElementById('expense-input');

let selectedMissionDocId = null;
const currentAgent = localStorage.getItem("agent") || localStorage.getItem("cia_agent") || "AGENT_LZ";

function establishSession() {
    if (currentAgent) {
        SoundFX.success(); // Session established sound
        authStatus.innerText = `AGENT: ${currentAgent}`;
        vAgentInput.disabled = false;
        scanStatus.innerText = "INPUT TARGET vAGENT# FOR VERIFICATION";
    } else {
        SoundFX.error(); // Unauthorized sound
        authStatus.innerHTML = `<span style="color:var(--red)">[ UNAUTHORIZED ]</span>`;
        scanStatus.innerHTML = "ACCESS DENIED: REDIRECTING TO DASHBOARD...";
        setTimeout(() => location.href = "dashboard.html", 3000);
    }
}

async function addLog(msg, color) {
    try {
        SoundFX.terminalUpdate(); // Terminal update sound
        await addDoc(collection(db, "terminal_logs"), {
            agent: currentAgent, message: msg, color: color, timestamp: serverTimestamp()
        });
    } catch(e) { console.error("Log error:", e); }
}

function resetUI() {
    deviceList.innerHTML = "";
    expenseModule.style.opacity = "0.1";
    expenseModule.style.pointerEvents = "none";
    submitBtn.classList.remove('ready');
    selectedMissionDocId = null;
    expenseInput.value = "";
}

// Keypad sounds for vAgent input
vAgentInput.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    } else if (e.key >= 'a' && e.key <= 'z') {
        SoundFX.beep(700, 0.05, 0.1); // Letter typing sound
    }
});

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
    SoundFX.terminalUpdate(); // Scanning sound
    try {
        const qMatch = query(collection(db, "mission_orders"), where("vAgentID", "==", vInput), where("agent", "==", currentAgent));
        const snapMatch = await getDocs(qMatch);

        if (snapMatch.empty) {
            const qGlobal = query(collection(db, "mission_orders"), where("vAgentID", "==", vInput));
            const snapGlobal = await getDocs(qGlobal);
            if (!snapGlobal.empty) {
                SoundFX.error(); // Access denied sound
                scanStatus.innerHTML = `<span style="color:var(--red)">[ACCESS DENIED] UNAUTHORIZED TARGET DETECTED</span>`;
                addLog(`SECURITY ALERT: ${currentAgent} ACCESSED FOREIGN TARGET ${vInput}`, 'var(--red)');
            } else {
                SoundFX.beep(400, 0.3, 0.2); // Not found sound
                scanStatus.innerHTML = `<span style="color:var(--yellow)">[ERROR] vAGENT# ${vInput} NOT FOUND</span>`;
            }
            return;
        }

        SoundFX.success(); // Match found sound
        scanStatus.innerHTML = `<span style="color:var(--green)">[IDENTITY MATCH] RETRIEVING WEAPON SYSTEM...</span>`;
        
        snapMatch.forEach(doc => {
            const data = doc.data();
            const btn = document.createElement('button');
            btn.className = "dev-btn";
            const deviceName = DEVICE_REGISTRY[data.weaponSystem] || `SIG: ${data.weaponSystem}`;
            btn.innerHTML = `<span style="font-size:9px; color:var(--cyan)">AUTHORIZED SYSTEM: ${data.weaponSystem}</span>
                <span style="font-weight:700">> ${deviceName}</span>
                <span style="font-size:10px; color:#5c7882; align-self:flex-end">MISSION_REF: #${data.missionID}</span>`;
            btn.onclick = () => {
                SoundFX.click(); // Button click sound
                document.querySelectorAll('.dev-btn').forEach(x => x.classList.remove('active'));
                btn.classList.add('active');
                selectedMissionDocId = data.missionID;
                expenseModule.style.opacity = "1";
                expenseModule.style.pointerEvents = "auto";
                submitBtn.classList.add('ready');
                SoundFX.folderOpen(); // Weapon system selected sound
            };
            deviceList.appendChild(btn);
        });
    } catch (e) {
        SoundFX.error(); // Error sound
        scanStatus.innerHTML = `<span style="color:var(--red)">[FAILURE] SYSTEM_ACCESS_TIMED_OUT</span>`;
    }
}

submitBtn.onclick = async () => {
    SoundFX.click(); // Button click sound
    
    const amount = parseFloat(expenseInput.value);
    if (!selectedMissionDocId || isNaN(amount) || amount <= 0) {
        SoundFX.error(); // Invalid input sound
        alert("CRITICAL ERROR: DATA MISMATCH OR INVALID AMOUNT.");
        return;
    }
    
    submitBtn.innerText = "INJECTING...";
    submitBtn.disabled = true;
    
    try {
        SoundFX.terminalUpdate(); // Injection sound
        const ref = doc(db, "mission_orders", selectedMissionDocId);
        await addLog(`OVERRIDE: ₱${amount.toFixed(2)} INJECTED TO #${selectedMissionDocId}`, 'var(--yellow)');
        await updateDoc(ref, {
            expensesBreakdown: arrayUnion({ amount: amount, timestamp: new Date().toISOString(), injectedBy: currentAgent }),
            totalExpenses: increment(amount)
        });
        
        SoundFX.success(); // Success sound
        alert("DATABASE OVERRIDDEN SUCCESSFULLY.");
        location.reload();
    } catch (e) {
        SoundFX.error(); // Error sound
        alert("CRITICAL ERROR: INJECTION FAILED");
        submitBtn.innerText = "EXECUTE OVERRIDE";
        submitBtn.disabled = false;
    }
};

// Clock update
setInterval(() => { 
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-GB'); 
}, 1000);

establishSession();
