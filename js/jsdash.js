
        addLog(`MISSION #${input.value} UPDATED BY ${currentAgent}`, 'var(--green)');
        closeModal();
        input.value = "";
        resetUI();
    } catch(e) { 
        console.error(e);
        alert("ERROR SUBMITTING MISSION");
    }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    input.addEventListener('input', searchMission);
    actionBtn.onclick = openModal;
    modalSubmit.onclick = submitMission;
    modalClose.onclick = closeModal;
    secureBtn.onclick = () => {
        secureBtn.style.display = 'none';
        secureField.classList.add('show');
        secureField.focus();
    };
}

// ========== START APP ==========
init();
