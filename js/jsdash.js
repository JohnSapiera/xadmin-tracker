// js/jsintel.js - CORE INTEL with Mobile-Friendly Sounds

import SoundFX from './sound.js';
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

// ===== AUTHENTICATION FIRST =====
const currentAgent = localStorage.getItem("cia_agent") || localStorage.getItem("agent");


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
        SoundFX.success();
        authStatus.innerText = `AGENT: ${currentAgent}`;
        vAgentInput.disabled = false;
        scanStatus.innerText = "INPUT TARGET vAGENT# FOR VERIFICATION";
    } else {
        SoundFX.error();
        authStatus.innerHTML = `<span style="color:var(--red)">[ UNAUTHORIZED ]</span>`;
        scanStatus.innerHTML = "ACCESS DENIED: REDIRECTING TO DASHBOARD...";
        setTimeout(() => location.href = "dashboard.html", 3000);
    }
}

async function addLog(msg, color) {
    try {
        SoundFX.terminalUpdate();
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

// ====== MOBILE-FRIENDLY KEYPAD SOUNDS FOR vAGENT INPUT ======
let lastVAgentLength = 0;
vAgentInput.addEventListener('input', (e) => {
    const currentLength = e.target.value.length;
    if (currentLength > lastVAgentLength) {
        const lastChar = e.target.value.slice(-1);
        if (lastChar >= '0' && lastChar <= '9') {
            SoundFX.keypadTone(lastChar);
        } else if (lastChar >= 'a' && lastChar <= 'z') {
            SoundFX.beep(700, 0.05, 0.1);
        } else if (lastChar >= 'A' && lastChar <= 'Z') {
            SoundFX.beep(750, 0.05, 0.1);
        } else {
            SoundFX.beep(800, 0.03, 0.1);
        }
    } else if (currentLength < lastVAgentLength) {
        SoundFX.beep(400, 0.03, 0.08);
    }
    lastVAgentLength = currentLength;
});

// ====== MOBILE-FRIENDLY KEYPAD SOUNDS FOR EXPENSE AMOUNT ======
let lastExpenseLength = 0;
expenseInput.addEventListener('input', (e) => {
    const currentLength = e.target.value.length;
    if (currentLength > lastExpenseLength) {
        const lastChar = e.target.value.slice(-1);
        if (lastChar >= '0' && lastChar <= '9') {
            SoundFX.keypadTone(lastChar);
        } else if (lastChar === '.') {
            SoundFX.beep(900, 0.03, 0.15);
        } else {
            SoundFX.beep(600, 0.03, 0.1);
        }
    } else if (currentLength < lastExpenseLength) {
        SoundFX.beep(400, 0.03, 0.08);
    }
    lastExpenseLength = currentLength;
});

let typingTimer;
vAgentInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    const vInput = vAgentInput.value.trim();
    
    if (vInput.length === 0) {
        resetUI();
    }
    
    if (vInput.length > 0 && currentAgent) {
        scanStatus.innerHTML = `<span class="blink">[VERIFYING IDENTITY] ${vInput}...</span>`;
        typingTimer = setTimeout(() => performHierarchySearch(vInput), 800);
    } else if (vInput.length === 0) {
        scanStatus.innerText = "INPUT TARGET vAGENT# FOR VERIFICATION";
    }
});

async function performHierarchySearch(vInput) {
    SoundFX.terminalUpdate();
    try {
        const qMatch = query(collection(db, "mission_orders"), where("vAgentID", "==", vInput), where("agent", "==", currentAgent));
        const snapMatch = await getDocs(qMatch);

        if (snapMatch.empty) {
            const qGlobal = query(collection(db, "mission_orders"), where("vAgentID", "==", vInput));
            const snapGlobal = await getDocs(qGlobal);
            if (!snapGlobal.empty) {
                SoundFX.error();
                scanStatus.innerHTML = `<span style="color:var(--red)">[ACCESS DENIED] UNAUTHORIZED TARGET DETECTED</span>`;
                addLog(`SECURITY ALERT: ${currentAgent} ACCESSED FOREIGN TARGET ${vInput}`, 'var(--red)');
            } else {
                SoundFX.beep(400, 0.3, 0.2);
                scanStatus.innerHTML = `<span style="color:var(--yellow)">[ERROR] vAGENT# ${vInput} NOT FOUND</span>`;
            }
            return;
        }

        SoundFX.success();
        scanStatus.innerHTML = `<span style="color:var(--green)">[IDENTITY MATCH] RETRIEVING WEAPON SYSTEM...</span>`;
        
        deviceList.innerHTML = "";
        
        snapMatch.forEach(doc => {
            const data = doc.data();
            const btn = document.createElement('button');
            btn.className = "dev-btn";
            const deviceName = DEVICE_REGISTRY[data.weaponSystem] || `SIG: ${data.weaponSystem}`;
            btn.innerHTML = `<span style="font-size:9px; color:var(--cyan)">AUTHORIZED SYSTEM: ${data.weaponSystem}</span>
                <span style="font-weight:700">> ${deviceName}</span>
                <span style="font-size:10px; color:#5c7882; align-self:flex-end">MISSION_REF: #${data.missionID}</span>`;
            btn.onclick = () => {
                SoundFX.click();
                document.querySelectorAll('.dev-btn').forEach(x => x.classList.remove('active'));
                btn.classList.add('active');
                selectedMissionDocId = data.missionID;
                expenseModule.style.opacity = "1";
                expenseModule.style.pointerEvents = "auto";
                submitBtn.classList.add('ready');
                SoundFX.folderOpen();
                expenseInput.focus();
            };
            deviceList.appendChild(btn);
        });
    } catch (e) {
        SoundFX.error();
        scanStatus.innerHTML = `<span style="color:var(--red)">[FAILURE] SYSTEM_ACCESS_TIMED_OUT</span>`;
        console.error(e);
    }
}

submitBtn.onclick = async () => {
    SoundFX.click();
    
    const amount = parseFloat(expenseInput.value);
    if (!selectedMissionDocId || isNaN(amount) || amount <= 0) {
        SoundFX.error();
        alert("CRITICAL ERROR: DATA MISMATCH OR INVALID AMOUNT.");
        return;
    }
    
    submitBtn.innerText = "INJECTING...";
    submitBtn.disabled = true;
    
    try {
        SoundFX.terminalUpdate();
        const ref = doc(db, "mission_orders", selectedMissionDocId);
        await addLog(`OVERRIDE: ₱${amount.toFixed(2)} INJECTED TO #${selectedMissionDocId}`, 'var(--yellow)');
        await updateDoc(ref, {
            expensesBreakdown: arrayUnion({ amount: amount, timestamp: new Date().toISOString(), injectedBy: currentAgent }),
            totalExpenses: increment(amount)
        });
        
        SoundFX.success();
        alert("DATABASE OVERRIDDEN SUCCESSFULLY.");
        location.reload();
    } catch (e) {
        SoundFX.error();
        alert("CRITICAL ERROR: INJECTION FAILED");
        submitBtn.innerText = "EXECUTE OVERRIDE";
        submitBtn.disabled = false;
        console.error(e);
    }
};

// Clock update
setInterval(() => { 
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-GB'); 
}, 1000);

// Force audio activation on first click (mobile fallback)
document.body.addEventListener('click', function activateAudio() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume().then(() => {
        console.log("🔊 Audio activated for intel page");
        audioCtx.close();
    });
}, { once: true });

establishSession();
