// js/jsdash.js - SUPABASE DASHBOARD (CONVERTED FROM FIREBASE)

const SUPABASE_URL = "https://pgclrzqfpoznvrjrzced.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GhIOC2mXVo0UrhMHZX6Qww_T12tQl4s";

let supabase = null;
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

// Get current agent from localStorage (from login)
const currentAgent = localStorage.getItem("cia_agent") || "UNKNOWN_AGENT";
console.log("Agent:", currentAgent);

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

async function addLog(msg, color) {
    console.log(`[LOG] ${msg}`);
    // Optional: Save to Supabase logs table if exists
}

async function setupTerminalListener() {
    // Simplified for now - you can implement Supabase logs later
}

// ====== LOAD WEAPON SYSTEMS FROM SUPABASE AGENTS ======
async function loadAgentWeapons() {
    console.log("Loading weapon systems for agent:", currentAgent);
    
    if (!supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    
    try {
        // Query Supabase agents table using agent_name (lowercase with underscore)
        const { data: agents, error } = await supabase
            .from('agents')
            .select('agent_name, weapon_system')
            .eq('agent_name', currentAgent);
        
        if (error) {
            console.error("Supabase error:", error);
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        } else if (agents && agents.length > 0) {
            // Kunin ang weapon_system array (devices)
            agentWeapons = agents[0].weapon_system || [];
            console.log("Weapon systems found:", agentWeapons);
        } else {
            console.log("Agent not found, using default weapons");
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
        
        if (agentWeapons.length === 0) {
            agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        }
        
        renderWeapons();
        
    } catch (error) {
        console.error("Error loading weapons:", error);
        agentWeapons = ["REDMI NOTE 14 PRO", "REALME 8 PRO", "TECHNO CAMON 40 PRO 5G", "REDMI NOTE 12"];
        renderWeapons();
    }
}

function renderWeapons(selected = "") {
    if (!weaponList) return;
    
    weaponList.innerHTML = "";
    agentWeapons.forEach(weapon => {
        const btn = document.createElement('button');
        btn.className = `weapon-btn ${selected === weapon ? 'selected' : ''}`;
        btn.innerText = weapon;
        btn.onclick = () => {
            document.querySelectorAll('.weapon-btn').forEach(x => x.classList.remove('selected'));
            btn.classList.add('selected');
            selectedWeaponID = weapon;
        };
        weaponList.appendChild(btn);
    });
    
    if (selected) {
        selectedWeaponID = selected;
    }
}

function transitionButton(button, newText, newClass) {
    button.style.transition = 'all 0.3s ease';
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.textContent = newText;
        button.className = `btn ${newClass}`;
        button.style.transform = 'scale(1)';
    }, 150);
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
        reserveBtn.style.borderColor = "#ffbd00";
        reserveBtn.style.color = "#ffbd00";
        statusLabel.innerHTML = "";
        return;
    }
    
    const missionID = padMissionID(val);
    if (missionID.length !== 5) {
        statusLabel.innerHTML = '<span style="color:#ff003c;">INVALID ID (5 digits required)</span>';
        return;
    }
    
    statusLabel.innerHTML = '<span class="blink">SCANNING...</span>';
    actionBtn.disabled = true;
    reserveBtn.disabled = true;
    
    searchTimeout = setTimeout(async () => {
        try {
            // Query Supabase mission_orders table
            const { data: missions, error } = await supabase
                .from('mission_orders')
                .select('*')
                .eq('missionID', missionID)
                .maybeSingle();
            
            if (error) throw error;
            
            if (missions) {
                currentMissionData = missions;
                const owner = missions.agent;
                const status = missions.status;
                
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
            
            actionBtn.disabled = false;
            reserveBtn.disabled = false;
            
        } catch(e) {
            console.error(e);
            statusLabel.innerHTML = '<span style="color:#ff003c;">DATABASE ERROR</span>';
            actionBtn.disabled = false;
            reserveBtn.disabled = false;
        }
    }, 300);
}

// ====== OPEN MODAL FOR DEPLOY ======
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
    
    modalSubmit.disabled = false;
    modalSubmit.style.opacity = "1";
    modalSubmit.textContent = "DEPLOY";
    modalSubmit.className = "btn btn-save";
    modalSubmit.onclick = () => submitMission(missionID, false);
}

// ====== OPEN MODAL FOR UPDATE ======
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
    const { data: mission, error } = await supabase
        .from('mission_orders')
        .select('*')
        .eq('missionID', missionID)
        .maybeSingle();
    
    if (error || !mission) {
        alert("Mission not found");
        return;
    }
    
    modalOverlay.style.display = 'flex';
    document.getElementById('pop-header').innerHTML = `<span style="color:#ff003c;">#${missionID}</span> <span style="font-size:12px; color:#5c7882;">[VIEW ONLY]</span>`;
    
    vAgentInput.value = mission.vAgentID || "";
    selectedWeaponID = mission.weaponSystem || "";
    secureField.value = mission.SecureLine || "";
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

// ====== SUBMIT MISSION TO SUPABASE ======
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
        const { error } = await supabase
            .from('mission_orders')
            .upsert({
                missionID: missionID,
                agent: currentAgent,
                vAgentID: vID,
                weaponSystem: selectedWeaponID,
                SecureLine: sLine || "",
                status: "DEPLOYED",
                deploymentDate: deploymentDate,
                relieveDate: relieveDate,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        addLog(`Mission #${missionID} ${isUpdate ? 'UPDATED' : 'DEPLOYED'} by ${currentAgent}`, '#05ffa1');
        closeModal();
        input.value = "";
        statusLabel.innerHTML = "";
        actionBtn.textContent = "SAVE";
        actionBtn.className = "btn btn-save";
        currentMissionData = null;
        alert(`✅ MISSION ${isUpdate ? 'UPDATED' : 'DEPLOYED'} SUCCESSFULLY!`);
        
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
async function init() {
    // Initialize Supabase client
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase initialized for dashboard");
    
    profName.innerText = currentAgent;
    avatarInit.innerText = currentAgent ? currentAgent.charAt(0).toUpperCase() : "?";
    updateClock();
    setInterval(updateClock, 1000);
    await loadAgentWeapons();
    
    input.addEventListener('input', searchMission);
    if (modalClose) modalClose.onclick = closeModal;
    if (secureBtn) secureBtn.onclick = toggleSecureLine;
    
    console.log("Dashboard ready with Supabase");
}

function updateClock() {
    if (clockSpan) {
        clockSpan.textContent = new Date().toLocaleTimeString('en-GB');
    }
}

// Start only if we're on dashboard page
if (document.getElementById('mission-input')) {
    init();
}
