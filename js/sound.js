// js/sound.js - Sound Manager (No external files needed)

const SoundFX = {
  // Generate beep sound
  beep(frequency = 800, duration = 0.1, volume = 0.3) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
    
    setTimeout(() => audioContext.close(), duration * 1000);
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
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    freqs.forEach(freq => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.15;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
      oscillator.stop(audioContext.currentTime + 0.1);
    });
    
    setTimeout(() => audioContext.close(), 150);
  },
  
  // Click sound
  click() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 600;
    gainNode.gain.value = 0.2;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.05);
    oscillator.stop(audioContext.currentTime + 0.05);
    
    setTimeout(() => audioContext.close(), 100);
  },
  
  // Page flip sound
  pageFlip() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = 4096;
    const noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    const gainNode = audioContext.createGain();
    
    noiseNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.1;
    
    noiseNode.onaudioprocess = function(e) {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3;
      }
    };
    
    noiseNode.addEventListener('audioprocess', () => {
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.15);
      setTimeout(() => {
        noiseNode.disconnect();
        audioContext.close();
      }, 200);
    }, { once: true });
    
    noiseNode.onaudioprocess({});
  },
  
  // Folder open sound
  folderOpen() {
    this.beep(500, 0.08, 0.15);
    setTimeout(() => this.beep(400, 0.08, 0.15), 80);
  },
  
  // Terminal update sound
  terminalUpdate() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 1200;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.03);
    oscillator.stop(audioContext.currentTime + 0.03);
    
    setTimeout(() => audioContext.close(), 100);
  },
  
  // Success sound
  success() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const frequencies = [523, 659, 784];
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.2;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.2);
        oscillator.stop(audioContext.currentTime + 0.2);
      }, index * 100);
    });
    setTimeout(() => audioContext.close(), 500);
  },
  
  // Error sound
  error() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 300;
    gainNode.gain.value = 0.25;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.4);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.4);
    oscillator.stop(audioContext.currentTime + 0.4);
    
    setTimeout(() => audioContext.close(), 500);
  },
  
  // Enable audio on first user interaction
  enable() {
    this.beep(800, 0.05, 0.05);
    console.log("🔊 Audio enabled");
  }
};

// Auto-enable on first click anywhere
let audioEnabled = false;
document.body.addEventListener('click', () => {
  if (!audioEnabled) {
    SoundFX.enable();
    audioEnabled = true;
  }
}, { once: true });

export default SoundFX;
