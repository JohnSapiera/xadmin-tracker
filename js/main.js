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

// Signal Bar Animation
let signalLevel = 0;
function animateSignal() {
    const bar1 = document.getElementById('bar1');
    const bar2 = document.getElementById('bar2');
    const bar3 = document.getElementById('bar3');
    
    if (!bar1 || !bar2 || !bar3) return;
    
    setInterval(() => {
        signalLevel = (signalLevel % 3) + 1;
        
        // Reset all bars
        bar1.classList.remove('active');
        bar2.classList.remove('active');
        bar3.classList.remove('active');
        
        // Activate bars based on level (1 bar = pinakamahina, 3 bars = pinakamalakas)
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
    }, 2000);
}

function showMessage(msg, isError = false) {
    displayMessage.innerHTML = msg;
    displayMessage.className = isError ? 'display-message error' : 'display-message success';
    setTimeout(() => {
        if (displayMessage.innerHTML === msg && msg !== "Synchronization") {
            displayMessage.innerHTML = '';
        }
    }, 3000);
}

function updateTypedDisplay() {
    if (typedDigits) {
        let displayText = '';
        for (let i = 0; i < enteredPin.length; i++) {
            displayText += '● ';
        }
        typedDigits.innerText = displayText;
    }
    console.log("Current PIN entered:", enteredPin);
}

function clearPin() {
    enteredPin = "";
    updateTypedDisplay();
    displayMessage.innerHTML = '';
}

function resetTerminal() {
    clearPin();
    agentPanel.classList.remove('show');
    showMessage("Terminal reset.", false);
}

async function verifyPin(pin) {
    if (isProcessing) return;
    isProcessing = true;
    
    console.log("Verifying PIN with Supabase:", pin);
    showMessage(`Verifying key: ${pin}...`, false);
    
    try {
        const { data: agent, error } = await supabase
            .from('agents')
            .select('agent_name, secret_key, weapon_system')
            .eq('secret_key', pin)
            .maybeSingle();
        
        if (error) {
            console.error("Supabase error:", error);
            showMessage(`Database error: ${error.message}`, true);
            isProcessing = false;
            clearPin();
            return;
        }
        
        if (!agent) {
            console.log("No agent found for PIN:", pin);
            showMessage("Incorrect Key", true);
            isProcessing = false;
            clearPin();
            return;
        }
        
        // SUCCESS!
        const agentName = agent.agent_name;
        const devices = agent.weapon_system || [];
        
        console.log("✅ LOGIN SUCCESS:", agentName);
        showMessage("Synchronization", false);
        
        // Display agent info
        agentNameSpan.innerText = agentName;
        devicesList.innerHTML = devices.map(d => `<span class="device-tag">📱 ${d}</span>`).join('');
        agentPanel.classList.add('show');
        
        // Store to localStorage
        localStorage.setItem("cia_agent", agentName);
        localStorage.setItem("secret_key", pin);
        localStorage.setItem("agent_devices", JSON.stringify(devices));
        localStorage.setItem("last_auth", new Date().toISOString());
        
        console.log("STORED IN LOCALSTORAGE:", {
            agent: agentName,
            secret_key: pin,
            devices: devices
        });
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);
        
        isProcessing = false;
        
    } catch (err) {
        console.error("Verification error:", err);
        showMessage(`Error: ${err.message}`, true);
        isProcessing = false;
        clearPin();
    }
}

function addDigit(digit) {
    console.log("Digit pressed:", digit);
    
    if (isProcessing) return;
    if (enteredPin.length < 4) {
        enteredPin += digit;
        updateTypedDisplay();
        
        // Key press animation
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
        
        // Auto-verify on 4th digit
        if (enteredPin.length === 4) {
            verifyPin(enteredPin);
        }
    }
}

// Event Listeners
document.querySelectorAll('.key-circle').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const digit = btn.getAttribute('data-digit');
        if (digit) addDigit(digit);
    });
    
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const digit = btn.getAttribute('data-digit');
        if (digit) addDigit(digit);
    });
});

document.getElementById('clearBtn')?.addEventListener('click', () => {
    clearPin();
    showMessage("Cleared.", false);
});

document.getElementById('resetBtn')?.addEventListener('click', () => {
    resetTerminal();
});

// Initialize
async function init() {
    console.log("Initializing terminal...");
    
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client created");
        
        // Test connection
        const { error } = await supabase.from('agents').select('count', { count: 'exact', head: true });
        if (error) {
            console.warn("Supabase warning:", error.message);
        } else {
            console.log("✅ Supabase connected!");
        }
    } catch(e) {
        console.error("Init error:", e);
    }
    
    animateSignal();
    updateTypedDisplay();
    console.log("Ready. Enter 4-digit key. Test with: 4646 or 1010");
}

init();
