// js/promedia.js - Full Music Player with Pop-up

class MusicPlayer {
    constructor() {
        this.currentVideoId = null;
        this.isPlaying = false;
        this.isPopupOpen = false;
        this.popupWindow = null;
        this.playerVisible = false;
        this.init();
    }
    
    init() {
        this.createMediaSection();
        this.attachEvents();
    }
    
    createMediaSection() {
        const profileMini = document.querySelector('.profile-mini');
        if (!profileMini) return;
        
        if (document.getElementById('musicPlayerSection')) return;
        
        // Main media section
        const mediaSection = document.createElement('div');
        mediaSection.id = 'musicPlayerSection';
        mediaSection.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
        `;
        
        // Search bar area
        const searchArea = document.createElement('div');
        searchArea.style.cssText = `
            padding: 12px;
            display: flex;
            gap: 8px;
            border-bottom: 1px solid var(--border);
        `;
        searchArea.innerHTML = `
            <input type="text" id="musicSearchInput" placeholder="Search song, artist, or genre..." 
                style="flex: 1; background: #000; border: 1px solid var(--border); color: var(--green); 
                padding: 10px; font-family: var(--font-mono); font-size: 12px; border-radius: 6px; outline: none;">
            <button id="searchMusicBtn" style="background: var(--cyan); color: #000; border: none; 
                padding: 0 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                🔍 SEARCH
            </button>
            <button id="openPopupBtn" style="background: #1DB954; color: #000; border: none; 
                padding: 0 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                🎬 POPUP
            </button>
        `;
        
        // Player controls area (hidden initially)
        const playerArea = document.createElement('div');
        playerArea.id = 'playerControlsArea';
        playerArea.style.cssText = `
            padding: 12px;
            display: none;
            border-bottom: 1px solid var(--border);
            background: rgba(0, 243, 255, 0.03);
        `;
        playerArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                <button id="prevBtn" style="background: transparent; border: none; color: var(--cyan); font-size: 20px; cursor: pointer;">⏮</button>
                <button id="playPauseBtn" style="background: var(--cyan); color: #000; border: none; width: 50px; height: 50px; border-radius: 50%; font-size: 20px; cursor: pointer; font-weight: bold;">▶</button>
                <button id="nextBtn" style="background: transparent; border: none; color: var(--cyan); font-size: 20px; cursor: pointer;">⏭</button>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: var(--cyan); font-size: 11px;">🎵</span>
                <div style="flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden;">
                    <div id="progressBar" style="width: 0%; height: 100%; background: var(--cyan); transition: width 0.3s;"></div>
                </div>
                <span id="timeDisplay" style="color: #5c7882; font-size: 10px;">0:00 / 0:00</span>
                <button id="hidePlayerBtn" style="background: transparent; border: 1px solid var(--red); color: var(--red); padding: 4px 10px; border-radius: 4px; font-size: 10px; cursor: pointer;">HIDE</button>
            </div>
            <div id="nowPlayingText" style="text-align: center; margin-top: 8px; color: var(--green); font-size: 10px; font-family: monospace;"></div>
        `;
        
        // Hidden iframe for YouTube playback
        const hiddenPlayer = document.createElement('iframe');
        hiddenPlayer.id = 'hiddenYouTubePlayer';
        hiddenPlayer.style.cssText = 'display: none;';
        hiddenPlayer.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        
        mediaSection.appendChild(searchArea);
        mediaSection.appendChild(playerArea);
        mediaSection.appendChild(hiddenPlayer);
        
        // Insert after profile mini
        profileMini.parentNode.insertBefore(mediaSection, profileMini.nextSibling);
        
        this.searchInput = document.getElementById('musicSearchInput');
        this.searchBtn = document.getElementById('searchMusicBtn');
        this.popupBtn = document.getElementById('openPopupBtn');
        this.playerArea = document.getElementById('playerControlsArea');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.hideBtn = document.getElementById('hidePlayerBtn');
        this.progressBar = document.getElementById('progressBar');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.nowPlayingText = document.getElementById('nowPlayingText');
        this.hiddenPlayer = document.getElementById('hiddenYouTubePlayer');
        
        this.currentQuery = "";
        this.playlist = [];
        this.currentIndex = 0;
    }
    
    attachEvents() {
        this.searchBtn.onclick = () => this.searchAndPlay();
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchAndPlay();
        });
        
        this.popupBtn.onclick = () => this.openPopup();
        this.playPauseBtn.onclick = () => this.togglePlayPause();
        this.hideBtn.onclick = () => this.hidePlayer();
        
        // Listen for video events
        this.hiddenPlayer.addEventListener('load', () => this.updatePlayerState());
    }
    
    searchAndPlay() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert("Enter a song or artist name");
            return;
        }
        
        this.currentQuery = query;
        this.nowPlayingText.innerHTML = `🔍 Searching: ${query}...`;
        
        // Use YouTube iframe API to search and play
        const searchUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
        this.hiddenPlayer.src = searchUrl;
        
        // Show player area
        this.playerArea.style.display = 'block';
        this.playerVisible = true;
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = '⏸';
        
        this.nowPlayingText.innerHTML = `🎵 Now Playing: ${query}`;
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    togglePlayPause() {
        // Simulate play/pause (YouTube iframe control is limited due to CORS)
        // This is a visual toggle only
        this.isPlaying = !this.isPlaying;
        this.playPauseBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
        
        if (this.isPlaying) {
            this.nowPlayingText.style.opacity = '1';
        } else {
            this.nowPlayingText.style.opacity = '0.5';
        }
    }
    
    hidePlayer() {
        this.playerArea.style.display = 'none';
        this.playerVisible = false;
        
        // Music continues playing in background
        this.nowPlayingText.innerHTML = `🎵 Music playing in background`;
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }
    
    openPopup() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.focus();
            return;
        }
        
        const currentSong = this.searchInput.value.trim() || this.currentQuery || "synthwave mix";
        
        const popupHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Music Player</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background: #01080b;
                        font-family: 'Share Tech Mono', monospace;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .header {
                        background: #000;
                        border-bottom: 2px solid #00f3ff;
                        padding: 12px 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .header h3 { color: #00f3ff; font-size: 14px; }
                    .close-btn {
                        background: #ff003c;
                        color: #fff;
                        border: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    .search-area {
                        padding: 15px;
                        background: #051014;
                        display: flex;
                        gap: 10px;
                    }
                    .search-input {
                        flex: 1;
                        background: #000;
                        border: 1px solid rgba(0,243,255,0.2);
                        color: #05ffa1;
                        padding: 10px;
                        font-family: monospace;
                        border-radius: 6px;
                    }
                    .search-btn {
                        background: #00f3ff;
                        color: #000;
                        border: none;
                        padding: 0 20px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                    }
                    .player {
                        flex: 1;
                        padding: 10px;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 8px;
                    }
                    .status {
                        padding: 8px 15px;
                        background: rgba(0,243,255,0.05);
                        font-size: 10px;
                        color: #5c7882;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>🎵 MUSIC PLAYER</h3>
                    <button class="close-btn" onclick="window.close()">✕</button>
                </div>
                <div class="search-area">
                    <input type="text" id="popupSearch" class="search-input" placeholder="Search song..." value="${currentSong}">
                    <button id="popupSearchBtn" class="search-btn">🔍</button>
                </div>
                <div class="player">
                    <iframe id="popupPlayer" src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(currentSong)}&autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                </div>
                <div class="status" id="popupStatus">▶ PLAYING: ${currentSong}</div>
                <script>
                    const searchInput = document.getElementById('popupSearch');
                    const searchBtn = document.getElementById('popupSearchBtn');
                    const player = document.getElementById('popupPlayer');
                    const status = document.getElementById('popupStatus');
                    
                    function searchMusic() {
                        const query = searchInput.value.trim();
                        if (query) {
                            status.innerHTML = '🔍 LOADING: ' + query;
                            player.src = 'https://www.youtube.com/embed?listType=search&list=' + encodeURIComponent(query) + '&autoplay=1';
                            status.innerHTML = '▶ PLAYING: ' + query;
                        }
                    }
                    
                    searchBtn.onclick = searchMusic;
                    searchInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') searchMusic();
                    });
                <\/script>
            </body>
            </html>
        `;
        
        const blob = new Blob([popupHTML], { type: 'text/html' });
        const popupUrl = URL.createObjectURL(blob);
        
        this.popupWindow = window.open(popupUrl, 'MusicPlayer', 'width=400,height=600,scrollbars=no,resizable=yes');
        this.isPopupOpen = true;
        
        setTimeout(() => URL.revokeObjectURL(popupUrl), 1000);
        
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    updatePlayerState() {
        // Progress bar simulation (YouTube iframe API limited)
        let progress = 0;
        const interval = setInterval(() => {
            if (this.isPlaying && progress < 100) {
                progress += 1;
                this.progressBar.style.width = progress + '%';
            } else if (!this.isPlaying) {
                // pause
            } else if (progress >= 100) {
                clearInterval(interval);
                progress = 0;
                this.progressBar.style.width = '0%';
            }
        }, 1000);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new MusicPlayer(), 500);
    });
} else {
    setTimeout(() => new MusicPlayer(), 500);
}
