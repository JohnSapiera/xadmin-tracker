// js/promedia.js - Monochrome Music Player

class MonochromePlayer {
    constructor() {
        this.init();
    }
    
    init() {
        this.createMediaSection();
        this.attachEvents();
    }
    
    createMediaSection() {
        const profileMini = document.querySelector('.profile-mini');
        if (!profileMini) return;
        
        if (document.getElementById('monochromePlayer')) return;
        
        const mediaSection = document.createElement('div');
        mediaSection.id = 'monochromePlayer';
        mediaSection.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
        `;
        
        const searchArea = document.createElement('div');
        searchArea.style.cssText = `
            padding: 10px 12px;
            display: flex;
            gap: 8px;
            align-items: center;
            border-bottom: 1px solid var(--border);
        `;
        searchArea.innerHTML = `
            <span style="color: var(--cyan); font-size: 14px;">🎵</span>
            <input type="text" id="monochromeSearch" placeholder="Search music..." 
                style="flex: 1; background: #000; border: 1px solid var(--border); color: var(--green); 
                padding: 8px 12px; font-family: var(--font-mono); font-size: 11px; border-radius: 20px; outline: none;">
            <button id="monochromeSearchBtn" style="background: #1DB954; color: #000; border: none; 
                padding: 6px 14px; border-radius: 20px; font-size: 11px; font-family: monospace; cursor: pointer;">
                🔍
            </button>
            <button id="monochromePopupBtn" style="background: #1DB954; color: #000; border: none; 
                padding: 6px 14px; border-radius: 20px; font-size: 11px; font-family: monospace; cursor: pointer;">
                🎬
            </button>
        `;
        
        const playerArea = document.createElement('div');
        playerArea.id = 'monochromeControls';
        playerArea.style.cssText = `
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(29, 185, 84, 0.03);
        `;
        playerArea.innerHTML = `
            <button id="monochromePlayBtn" style="background: #1DB954; color: #000; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 14px; cursor: pointer;">▶</button>
            <div style="flex: 1;">
                <div id="monochromeNowPlaying" style="color: #1DB954; font-size: 10px; font-family: monospace; margin-bottom: 4px;">Ready to play</div>
                <div style="height: 3px; background: var(--border); border-radius: 2px; overflow: hidden;">
                    <div id="monochromeProgress" style="width: 0%; height: 100%; background: #1DB954;"></div>
                </div>
            </div>
            <button id="monochromeHideBtn" style="background: transparent; border: 1px solid var(--red); color: var(--red); padding: 4px 10px; border-radius: 12px; font-size: 9px; cursor: pointer;">HIDE</button>
        `;
        
        const audioPlayer = document.createElement('audio');
        audioPlayer.id = 'monochromeAudio';
        audioPlayer.style.display = 'none';
        
        mediaSection.appendChild(searchArea);
        mediaSection.appendChild(playerArea);
        mediaSection.appendChild(audioPlayer);
        
        profileMini.parentNode.insertBefore(mediaSection, profileMini.nextSibling);
        
        this.searchInput = document.getElementById('monochromeSearch');
        this.searchBtn = document.getElementById('monochromeSearchBtn');
        this.popupBtn = document.getElementById('monochromePopupBtn');
        this.playBtn = document.getElementById('monochromePlayBtn');
        this.hideBtn = document.getElementById('monochromeHideBtn');
        this.nowPlaying = document.getElementById('monochromeNowPlaying');
        this.progressBar = document.getElementById('monochromeProgress');
        this.audioPlayer = document.getElementById('monochromeAudio');
        
        this.isPlaying = false;
        this.currentTrack = null;
        this.attachEvents();
    }
    
    attachEvents() {
        this.searchBtn.onclick = () => this.searchAndPlay();
        this.popupBtn.onclick = () => this.openMonochromePopup();
        this.playBtn.onclick = () => this.togglePlayPause();
        this.hideBtn.onclick = () => this.hidePlayer();
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchAndPlay();
        });
        
        this.audioPlayer.addEventListener('timeupdate', () => {
            if (this.audioPlayer.duration) {
                const percent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
                this.progressBar.style.width = percent + '%';
            }
        });
        
        this.audioPlayer.addEventListener('ended', () => {
            this.isPlaying = false;
            this.playBtn.innerHTML = '▶';
        });
    }
    
    searchAndPlay() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert("Enter a song or artist name");
            return;
        }
        
        this.nowPlaying.innerHTML = `🔍 Searching: ${query}`;
        
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
        this.nowPlaying.innerHTML = `📱 Opened in YouTube: ${query}`;
        
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    togglePlayPause() {
        if (!this.audioPlayer.src) {
            this.searchAndPlay();
            return;
        }
        
        if (this.isPlaying) {
            this.audioPlayer.pause();
            this.playBtn.innerHTML = '▶';
        } else {
            this.audioPlayer.play();
            this.playBtn.innerHTML = '⏸';
        }
        this.isPlaying = !this.isPlaying;
    }
    
    hidePlayer() {
        const controls = document.getElementById('monochromeControls');
        if (controls) controls.style.display = 'none';
        this.nowPlaying.innerHTML = `🎵 Ready`;
    }
    
    openMonochromePopup() {
        window.open('https://www.youtube.com', '_blank');
        
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new MonochromePlayer(), 500);
    });
} else {
    setTimeout(() => new MonochromePlayer(), 500);
    }
