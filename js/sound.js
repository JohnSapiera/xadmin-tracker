// js/sound.js - Sound Manager with Auto Audio Activator

const SoundFX = {
  // Audio context reference
  audioContext: null,
  isAudioEnabled: false,
  
  // Initialize audio context on user interaction
  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.isAudioEnabled = true;
    console.log("🔊 Audio enabled");
  },
  
  // Play sound safely (only if audio is enabled)
  playSound(callback) {
    if (!this.isAudioEnabled) {
      console.log("Audio not enabled yet, waiting for user interaction");
      return;
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      callback();
    } else if (this.audioContext) {
      this.audioContext.resume().then(() => callback());
    }
  },
  
  // Generate beep sound
  beep(frequency = 800, duration = 0.1, volume = 0.3) {
    this.playSound(() => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + duration);
      oscillator.stop(this.audioContext.currentTime + duration);
    });
  },
  
  // Keypad tone (DTMF style)
  keypadTone(digit) {
    const frequencies = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '0': [941, 1336]
    };
    const freqs = frequencies[digit] || [800, 1200];
    
    this.playSound(() => {
      freqs.forEach(freq => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.15;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.1);
        oscillator.stop(this.audioContext.currentTime + 0.1);
      });
    });
  },
  
  // Click sound
  click() {
    this.beep(600, 0.05, 0.2);
  },
  
  // Page flip sound
  pageFlip() {
    this.playSound(() => {
      const bufferSize = 4096;
      const noiseNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      const gainNode = this.audioContext.createGain();
      
      noiseNode.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      gainNode.gain.value = 0.1;
      
      noiseNode.onaudioprocess = function(e) {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.3;
        }
      };
      
      noiseNode.addEventListener('audioprocess', () => {
        gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.15);
        setTimeout(() => {
          noiseNode.disconnect();
        }, 200);
      }, { once: true });
      
      noiseNode.onaudioprocess({});
    });
  },
  
  // Folder open sound
  folderOpen() {
    this.beep(500, 0.08, 0.15);
    setTimeout(() => this.beep(400, 0.08, 0.15), 80);
  },
  
  // Terminal update sound
  terminalUpdate() {
    this.beep(1200, 0.03, 0.1);
  },
  
  // Success sound
  success() {
    this.playSound(() => {
      const frequencies = [523, 659, 784];
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          oscillator.frequency.value = freq;
          gainNode.gain.value = 0.2;
          oscillator.start();
          gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.2);
          oscillator.stop(this.audioContext.currentTime + 0.2);
        }, index * 100);
      });
    });
  },
  
  // Error sound
  error() {
    this.playSound(() => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      oscillator.frequency.value = 300;
      gainNode.gain.value = 0.25;
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.4);
      oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.4);
      oscillator.stop(this.audioContext.currentTime + 0.4);
    });
  },
  
  // Create floating audio activator button
  createActivatorButton() {
    // Check if button already exists
    if (document.getElementById('soundActivatorBtn')) return;
    
    const btn = document.createElement('div');
    btn.id = 'soundActivatorBtn';
    btn.innerHTML = '🔇 TAP TO ENABLE SOUND';
    btn.style.position = 'fixed';
    btn.style.bottom = '80px';
    btn.style.right = '10px';
    btn.style.background = '#000';
    btn.style.border = '2px solid #ff003c';
    btn.style.color = '#ff003c';
    btn.style.padding = '8px 12px';
    btn.style.borderRadius = '20px';
    btn.style.fontSize = '10px';
    btn.style.fontFamily = 'monospace';
    btn.style.zIndex = '99999';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.boxShadow = '0 0 10px rgba(255,0,60,0.3)';
    
    btn.onclick = () => {
      this.initAudio();
      this.beep(880, 0.1, 0.3);
      btn.innerHTML = '🔊 SOUND ENABLED';
      btn.style.borderColor = '#05ffa1';
      btn.style.color = '#05ffa1';
      btn.style.boxShadow = '0 0 10px rgba(5,255,161,0.3)';
      setTimeout(() => {
        btn.style.opacity = '0.5';
        setTimeout(() => {
          btn.style.display = 'none';
        }, 2000);
      }, 1500);
    };
    
    document.body.appendChild(btn);
    
    // Also enable on any click (fallback)
    document.body.addEventListener('click', () => {
      if (!this.isAudioEnabled) {
        this.initAudio();
        this.beep(880, 0.1, 0.3);
        btn.innerHTML = '🔊 SOUND ENABLED';
        btn.style.borderColor = '#05ffa1';
        btn.style.color = '#05ffa1';
        setTimeout(() => {
          btn.style.display = 'none';
        }, 2000);
      }
    }, { once: true });
  }
};

// Auto-create activator button when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      SoundFX.createActivatorButton();
    }, 500);
  });
}

export default SoundFX;
