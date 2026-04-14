// js/jsdash.js - CORE DASHBOARD WITH SOUNDS (COMPLETE)

import SoundFX from '../sound.js';
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

// ====== AGENT FROM LOCALSTORAGE ======
const currentAgent = localStorage.getItem("cia_agent") || localStorage.getItem("agent") || "AGENT_LZ";
console.log("Agent:", currentAgent);

// ====== STATE ======
let selectedWeaponID = "";
let agentSignatures = [];
let currentMissionData = null;

// ====== DOM ELEMENTS ======
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

// ====== INIT ======
function init() {
    SoundFX.success();
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent.charAt(0).toUpperCase();
    updateClock();
    setInterval(updateClock, 1000);
    setupTerminalListener();
    setupEventListeners();
    setupNavigationSounds();
    setupAudioActivator();
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
        SoundFX.terminalUpdate();
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

function checkFormComplete() {
    const vID = vAgentInput.value.trim();
    const hasWeapon = selectedWeaponID !== "";
    
    if (vID !== "" && hasWeapon) {
        modalSubmit.disabled = false;
        modalSubmit.style.opacity = "1";
        SoundFX.beep(800, 0.05, 0.1);
    } else {
        modalSubmit.disabled = true;
        modalSubmit.style.opacity = "0.5";
    }
}

async function searchMission() {
    const val = input.value.trim();
    if (val.length < 4) { resetUI(); return; }
    
    SoundFX.terminalUpdate();
    statusLabel.innerHTML = '<span class="blink">SCANNING DATABASE...</span>';
    const qM = query(collection(db, "mission_orders"), where("missionID", "==", val));
    const snapM = await getDocs(qM);
    
    if (!snapM.empty) {
        currentMissionData = snapM.docs[0].data();
        const owner = currentMissionData.agent;
        if (owner === currentAgent) {
            SoundFX.success();
            actionBtn.textContent = "RETRIEVE";
            actionBtn.className = "btn btn-retrieve";
            reserveBtn.classList.remove('active');
            statusLabel.innerHTML = `<span class="status-deployed">STATUS: YOUR MISSION</span>`;
        } else {
            SoundFX.error();
            statusLabel.innerHTML = `<span style="color:var(--red);">ALREADY DEPLOYED BY ${owner}</span>`;
            actionBtn.textContent = "LOCKED";
            actionBtn.className = "btn btn-locked";
            actionBtn.style.pointerEvents = "none";
            reserveBtn.classList.remove('active');
            addLog(`RESTRICTED: ${currentAgent} SCANNED ${owner}'S MISSION`, 'var(--red)');
        }
    } else {
        SoundFX.beep(600, 0.2, 0.2);
        currentMissionData = null;
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        statusLabel.innerHTML = 'STATUS: AVAILABLE';
        reserveBtn.classList.add('active');
    }
}

function renderWeapons() {
    weaponList.innerHTML = "";
    agentSignatures.forEach(sig => {
        const btn = document.createElement('button');
        btn.className = "weapon-btn";
        btn.innerText = `> ${DEVICE_REGISTRY[sig] || sig}`;
        btn.onclick = () => {
            SoundFX.click();
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWeaponID = sig;
            checkFormComplete();
        };
        weaponList.appendChild(btn);
    });
}

async function openModal() {
    if (input.value.length < 4) {
        SoundFX.error();
        alert("ENTER 4-5 DIGIT MISSION ID");
        return;
    }
    
    SoundFX.click();
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerText = `#${input.value}`;
    
    vAgentInput.value = "";
    selectedWeaponID = "";
    secureField.value = "";
    secureField.classList.remove('show');
    secureBtn.style.display = 'block';
    modalSubmit.disabled = true;
    modalSubmit.style.opacity = "0.5";
    
    try {
        const snap = await getDoc(doc(db, "agents", currentAgent));
        agentSignatures = snap.exists() ? snap.data().linkedSignatures || [] : Object.keys(DEVICE_REGISTRY);
    } catch(e) {
        agentSignatures = Object.keys(DEVICE_REGISTRY);
    }
    
    if (currentMissionData) {
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
        modalSubmit.textContent = "CONFIRM";
    }
    
    renderWeapons();
    
    if (selectedWeaponID) {
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            if (btn.innerText.includes(DEVICE_REGISTRY[selectedWeaponID] || selectedWeaponID)) {
                btn.classList.add('selected');
            }
        });
    }
    
    checkFormComplete();
}

function closeModal() {
    SoundFX.click();
    modalOverlay.style.display = 'none';
}

async function submitMission() {
    SoundFX.click();
    
    const missionID = input.value;
    const vID = vAgentInput.value.trim();
    const sLine = secureField.value.trim();
    
    if (!missionID || missionID.length < 4) {
        SoundFX.error();
        alert("INVALID MISSION ID");
        return;
    }
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
    
    try {
        SoundFX.terminalUpdate();
        await setDoc(doc(db, "mission_orders", missionID), {
            missionID: missionID,
            agent: currentAgent,
            vAgentID: vID,
            weaponSystem: selectedWeaponID,
            SecureLine: sLine || "",
            status: "DEPLOYED",
            timestamp: serverTimestamp()
        }, { merge: true });
        
        SoundFX.success();
        addLog(`MISSION #${missionID} ${currentMissionData ? 'UPDATED' : 'SAVED'} BY ${currentAgent}`, 'var(--green)');
        closeModal();
        input.value = "";
        resetUI();
        alert("✅ MISSION SAVED SUCCESSFULLY!");
    } catch(e) {
        SoundFX.error();
        console.error(e);
        alert("ERROR: " + e.message);
    }
}

// ====== KEYPAD SOUNDS ======
input.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    }
});

vAgentInput.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    } else if (e.key >= 'a' && e.key <= 'z') {
        SoundFX.beep(700, 0.05, 0.1);
    }
});

secureField.addEventListener('keypress', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        SoundFX.keypadTone(e.key);
    }
});

// ====== NAVIGATION SOUNDS ======
function setupNavigationSounds() {
    const navLinks = document.querySelectorAll('.bottom-nav a');
    navLinks.forEach(link => {
        const url = link.getAttribute('href');
        if (url && url !== '#') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Play click sound
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.15;
                
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.08);
                oscillator.stop(audioContext.currentTime + 0.08);
                
                setTimeout(() => {
                    audioContext.close();
                    window.location.href = url;
                }, 100);
            });
        }
    });
}

// ====== AUDIO ACTIVATOR ======
function setupAudioActivator() {
    let audioEnabled = false;
    document.body.addEventListener('click', function enableAudio() {
        if (!audioEnabled) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.resume().then(() => {
                console.log("🔊 Audio enabled for dashboard");
                audioContext.close();
            });
            audioEnabled = true;
        }
    }, { once: true });
}

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    input.addEventListener('input', searchMission);
    actionBtn.onclick = openModal;
    modalClose.onclick = closeModal;
    modalSubmit.onclick = submitMission;
    vAgentInput.addEventListener('input', checkFormComplete);
    secureBtn.onclick = () => {
        SoundFX.click();
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };
}

// Start
init();
