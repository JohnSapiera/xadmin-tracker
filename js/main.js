// Supabase Configuration
const SUPABASE_URL = "https://pgclrzqfpoznvrjrzced.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GhIOC2mXVo0UrhMHZX6Qww_T12tQl4s";

let supabase = null;
let enteredPin = "";
let isProcessing = false;

// DOM Elements
const typedDigits = document.getElementById('typedDigits');
const displayMessage = document.getElementById('displayMessage');
const agentPanel = document.getElementById('agentPanel');
const agentNameSpan = document.getElementById('agentName');
const devicesList = document.getElementById('devicesList');

// Signal Bar Animation - White fading effect
let signalLevel = 0;
function animateSignal() {
    const bar1 = document.getElementById('bar1');
    const bar2 = document.getElementById('bar2');
    const bar3 = document.getElementById('bar3');
    
    setInterval(() => {
        signalLevel = (signalLevel % 3) + 1;
        
        // Reset all bars
        bar1.classList.remove('active');
        bar2.classList.remove('active');
        bar3.classList.remove('active');
        
        // Animate bars based on level
        if (signalLevel === 1) {
            bar1.classList.add('active');
        } else if (signalLevel === 2) {
            bar1.classList.add('active');
            bar2.classList.add('active');
        } else if (signalLevel === 3) {
            bar1.classList.add('active');
            bar2.classList.add('active');
            bar3.classList.add('active');
        }
        
        // Add pulsing white fade effect
        setTimeout(() => {
            if (signalLevel === 3) {
                bar3.style.opacity = '0.5';
                setTimeout(() => { bar3.style.opacity = '1'; }, 200);
            }
            if (signalLevel >= 2) {
                bar2.style.opacity = '0.5';
                setTimeout(() => { bar2.style.opacity = '1'; }, 200);
            }
            bar1.style.opacity = '0.5';
            setTimeout(() => { bar1.style.opacity = '1'; }, 200);
        }, 100);
        
    }, 1800);
}

function showMessage(msg, isError = false) {
    displayMessage.innerHTML = msg;
    displayMessage.className = isError ? 'display-message error' : 'display-message success';
    setTimeout(() => {
        if (displayMessage.innerHTML === msg) {
            displayMessage.innerHTML = '';
        }
    }, 3000);
}

function updateTypedDisplay() {
    let displayText = '';
    for (let i = 0; i < enteredPin.length; i++) {
        displayText += '● ';
    }
    typedDigits.innerText = displayText;
}

function clearPin() {
    enteredPin = "";
    updateTypedDisplay();
    displayMessage.innerHTML = '';
}

function resetTerminal() {
    clearPin();
    agentPanel.classList.remove('show');
    showMessage("Terminal reset. Ready.", false);
}

async function verifyPin(pin) {
    if (isProcessing) return;
    isProcessing = true;
    
    showMessage(`Verifying key: ${pin}...`, false);
    
    try {
        const { data: agent, error } = await supabase
            .from('agents')
            .select('agent_name, secret_key, brand_name, weapon_system')
            .eq('secret_key', pin)
            .maybeSingle();
        
        if (error) {
            showMessage(`Database error: ${error.message}`, true);
            isProcessing = false;
            clearPin();
            return;
        }
        
        if (!agent) {
            showMessage("Incorrect Key", true);
            isProcessing = false;
            clearPin();
            return;
        }
        
        const agentName = agent.agent_name;
        const devices = agent.weapon_system || [];
        
        showMessage("Synchronization", false);
        
        agentNameSpan.innerText = agentName;
        devicesList.innerHTML = devices.map(d => `<span class="device-tag">📱 ${d}</span>`).join('');
        agentPanel.classList.add('show');
        
        // Store to localStorage
        localStorage.setItem("cia_agent", agentName);
        localStorage.setItem("secret_key", pin);
        localStorage.setItem("agent_devices", JSON.stringify(devices));
        localStorage.setItem("last_auth", new Date().toISOString());
        
        console.log("✅ LOGIN SUCCESS - Stored in localStorage:");
        console.log("   Agent:", agentName);
        console.log("   Secret Key:", pin);
        console.log("   Devices:", devices);
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
        
        isProcessing = false;
        
    } catch (err) {
        showMessage(`Error: ${err.message}`, true);
        isProcessing = false;
        clearPin();
    }
}

function addDigit(digit) {
    if (isProcessing) return;
    if (enteredPin.length < 4) {
        enteredPin += digit;
        updateTypedDisplay();
        
        // Add key press animation
        const btns = document.querySelectorAll('.key-circle');
        btns.forEach(btn => {
            if (btn.innerText === digit) {
                btn.style.transform = 'scale(0.92)';
                btn.style.background = '#00ff66';
                btn.style.color = '#000';
                setTimeout(() => {
                    btn.style.transform = '';
                    btn.style.background = '';
                    btn.style.color = '';
                }, 150);
            }
        });
        
        if (enteredPin.length === 4) {
            verifyPin(enteredPin);
        }
    }
}

function checkExistingSession() {
    const savedAgent = localStorage.getItem("cia_agent");
    if (savedAgent) {
        agentNameSpan.innerText = savedAgent;
        const savedDevices = localStorage.getItem("agent_devices");
        if (savedDevices) {
            const devs = JSON.parse(savedDevices);
            devicesList.innerHTML = devs.map(d => `<span class="device-tag">📱 ${d}</span>`).join('');
        }
        agentPanel.classList.add('show');
        showMessage(`Session active: ${savedAgent}`, false);
        
        // Auto redirect to dashboard
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 2000);
    }
}

// Event Listeners
document.querySelectorAll('.key-circle').forEach(btn => {
    btn.addEventListener('click', () => {
        const digit = btn.getAttribute('data-digit');
        if (digit) addDigit(digit);
    });
});

document.getElementById('clearBtn').addEventListener('click', () => {
    clearPin();
    showMessage("Cleared.", false);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    resetTerminal();
});

// Initialize
async function init() {
    // Initialize Supabase
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { error } = await supabase.from('agents').select('count', { count: 'exact', head: true });
        if (error) console.warn("Supabase connection:", error);
        else console.log("Supabase connected");
    } catch(e) {
        console.warn("Init error:", e);
    }
    
    animateSignal();
    checkExistingSession();
    updateTypedDisplay();
}

init();
