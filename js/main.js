// Supabase Configuration
const SUPABASE_URL = "https://pgclrzqfpoznvrjrzced.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GhIOC2mXVo0UrhMHZX6Qww_T12tQl4s";

let supabase = null;
let deviceFingerprint = "";
let enteredPin = "";
let isProcessing = false;

// DOM Elements
const fingerprintText = document.getElementById('fingerprintText');
const typedLine = document.getElementById('typedLine');
const displayMessage = document.getElementById('displayMessage');
const agentPanel = document.getElementById('agentPanel');
const agentNameSpan = document.getElementById('agentName');
const devicesList = document.getElementById('devicesList');

// Signal bars animation
let signalLevel = 1;
function animateSignal() {
    const bar1 = document.getElementById('bar1');
    const bar2 = document.getElementById('bar2');
    const bar3 = document.getElementById('bar3');
    
    setInterval(() => {
        signalLevel = (signalLevel % 3) + 1;
        bar1.classList.remove('active');
        bar2.classList.remove('active');
        bar3.classList.remove('active');
        
        if (signalLevel >= 1) bar1.classList.add('active');
        if (signalLevel >= 2) bar2.classList.add('active');
        if (signalLevel >= 3) bar3.classList.add('active');
    }, 1500);
}

function updateDisplayMessage(msg, isError = false, isSuccess = false) {
    displayMessage.innerHTML = msg;
    displayMessage.classList.remove('error', 'success');
    if (isError) displayMessage.classList.add('error');
    if (isSuccess) displayMessage.classList.add('success');
    
    setTimeout(() => {
        if (displayMessage.innerHTML === msg) {
            displayMessage.innerHTML = '';
        }
    }, 2000);
}

function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const debugInfo = gl ? gl.getExtension('WEBGL_debug_renderer_info') : null;
    const gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "CRYPTO";
    let hash = 0;
    const raw = gpu + window.screen.width + window.screen.height + navigator.platform;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    return "DEV-" + Math.abs(hash).toString(16).toUpperCase().slice(0, 10);
}

function updateTypedWithDots() {
    let dots = '';
    for (let i = 0; i < enteredPin.length; i++) {
        dots += '● ';
    }
    typedLine.innerHTML = '> Enter your 4 Digit Key.. ' + dots;
    if (enteredPin.length === 0) {
        typedLine.innerHTML = '> Enter your 4 Digit Key.. ';
    }
}

function clearPin() {
    enteredPin = "";
    updateTypedWithDots();
    displayMessage.innerHTML = '';
}

function resetTerminal() {
    clearPin();
    agentPanel.classList.remove('show');
    updateDisplayMessage("Terminal reset.", false);
    typedLine.style.borderRight = '2px solid #00ff66';
}

async function verifyPin(pin) {
    if (isProcessing) return;
    isProcessing = true;
    typedLine.style.borderRight = 'none';
    
    try {
        const { data: agent, error } = await supabase
            .from('agents')
            .select('agent_name, secret_key, brand_name, weapon_system')
            .eq('secret_key', pin)
            .maybeSingle();
        
        if (error) {
            updateDisplayMessage(`DB Error: ${error.message}`, true);
            typedLine.style.borderRight = '2px solid #00ff66';
            isProcessing = false;
            clearPin();
            return;
        }
        
        if (!agent) {
            updateDisplayMessage("Incorrect Key", true);
            typedLine.style.borderRight = '2px solid #ff4444';
            setTimeout(() => {
                typedLine.style.borderRight = '2px solid #00ff66';
            }, 500);
            isProcessing = false;
            clearPin();
            return;
        }
        
        // Success
        updateDisplayMessage("Synchronization", false, true);
        typedLine.style.borderRight = '2px solid #00ff66';
        
        const agentName = agent.agent_name;
        const devices = agent.weapon_system || [];
        
        agentNameSpan.innerText = agentName;
        devicesList.innerHTML = devices.map(d => `<span class="device-tag">📱 ${d}</span>`).join('');
        agentPanel.classList.add('show');
        
        localStorage.setItem("cia_agent", agentName);
        localStorage.setItem("secret_key", pin);
        localStorage.setItem("device_fingerprint", deviceFingerprint);
        localStorage.setItem("agent_devices", JSON.stringify(devices));
        localStorage.setItem("last_auth", new Date().toISOString());
        
        console.log("✅ STORED IN LOCAL DATABASE:");
        console.log("   AGENT:", agentName);
        console.log("   SECRET KEY:", pin);
        console.log("   DEVICE FINGERPRINT:", deviceFingerprint);
        console.log("   DEVICES:", devices);
        
        isProcessing = false;
        
    } catch (err) {
        updateDisplayMessage(`Error: ${err.message}`, true);
        isProcessing = false;
        clearPin();
    }
}

function addDigit(digit) {
    if (isProcessing) return;
    if (enteredPin.length < 4) {
        enteredPin += digit;
        updateTypedWithDots();
        
        if (enteredPin.length === 4) {
            verifyPin(enteredPin);
        }
    }
}

function restoreSession() {
    const savedAgent = localStorage.getItem("cia_agent");
    if (savedAgent) {
        agentNameSpan.innerText = savedAgent;
        const savedDevices = localStorage.getItem("agent_devices");
        if (savedDevices) {
            const devs = JSON.parse(savedDevices);
            devicesList.innerHTML = devs.map(d => `<span class="device-tag">📱 ${d}</span>`).join('');
        }
        agentPanel.classList.add('show');
        updateDisplayMessage(`Session restored: ${savedAgent}`, false, true);
    }
}

// Event Listeners for keypad
document.querySelectorAll('.key-circle').forEach(btn => {
    btn.addEventListener('click', () => {
        const digit = btn.getAttribute('data-digit');
        if (digit) addDigit(digit);
    });
});

document.getElementById('clearBtn').addEventListener('click', () => {
    clearPin();
    updateDisplayMessage("Cleared.", false);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    resetTerminal();
});

async function init() {
    deviceFingerprint = generateFingerprint();
    fingerprintText.innerText = deviceFingerprint;
    
    animateSignal();
    
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { error } = await supabase.from('agents').select('count', { count: 'exact', head: true });
        if (error) console.warn("DB check:", error);
    } catch(e) {
        console.warn("Init error:", e);
    }
    
    restoreSession();
    typedLine.style.borderRight = '2px solid #00ff66';
}

// Start the application
init();
