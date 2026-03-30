// --- BAN SYSTEM LOGIC ---
function executeSingleBan() {
    const codeInput = document.getElementById('secretCode');
    const output = document.getElementById('banOutput');
    const targetCode = codeInput.value.trim();

    if (targetCode === "") {
        output.innerHTML += `<p class="error">> ERROR: NO SECRET CODE PROVIDED.</p>`;
        return;
    }

    // Visual feedback para sa "Processing"
    output.innerHTML += `<p class="processing">> TERMINATING ID: ${targetCode}...</p>`;
    
    // Simulate database action (Palitan mo ito ng Firebase logic mo)
    setTimeout(() => {
        // Sample: console.log(`Banned: ${targetCode}`);
        output.innerHTML += `<p class="success">> SUCCESS: ${targetCode} HAS BEEN BLACKLISTED.</p>`;
        
        // Auto-scroll to bottom
        output.scrollTop = output.scrollHeight;
        
        // Clear input
        codeInput.value = "";
    }, 800);
}

// --- CHAT SYSTEM LOGIC ---
document.getElementById('sendChat').addEventListener('click', function() {
    const chatInput = document.getElementById('chatInput');
    const chatFeed = document.getElementById('chatFeed');
    
    if (chatInput.value.trim() !== "") {
        const msg = document.createElement('div');
        msg.className = 'chat-msg user-msg';
        msg.textContent = `[OPERATOR]: ${chatInput.value}`;
        chatFeed.appendChild(msg);
        chatInput.value = "";
        chatFeed.scrollTop = chatFeed.scrollHeight;
    }
});

// Image Upload Preview logic sa chat
document.getElementById('imgUpload').addEventListener('change', function(e) {
    const chatFeed = document.getElementById('chatFeed');
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgDiv = document.createElement('div');
            imgDiv.className = 'chat-msg';
            imgDiv.innerHTML = `[ATTACHMENT]: <br><img src="${event.target.result}" style="max-width:100%; border: 1px solid #444; margin-top:5px;">`;
            chatFeed.appendChild(imgDiv);
            chatFeed.scrollTop = chatFeed.scrollHeight;
        }
        reader.readAsDataURL(file);
    }
});
