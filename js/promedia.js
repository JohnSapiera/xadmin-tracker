// js/promedia.js - YouTube Music Player (Working)

class MusicPlayer {
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
        
        if (document.getElementById('musicPlayerSection')) return;
        
        const mediaSection = document.createElement('div');
        mediaSection.id = 'musicPlayerSection';
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
            <input type="text" id="musicSearchInput" placeholder="Search song..." 
                style="flex: 1; background: #000; border: 1px solid var(--border); color: var(--green); 
                padding: 8px 12px; font-family: var(--font-mono); font-size: 11px; border-radius: 20px; outline: none;">
            <button id="searchMusicBtn" style="background: #ff003c; color: #fff; border: none; 
                padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 11px; 
                font-family: var(--font-mono); cursor: pointer;">
                🔍
            </button>
            <button id="openMusicPopupBtn" style="background: #ff003c; color: #fff; border: none; 
                padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 11px; 
                font-family: var(--font-mono); cursor: pointer;">
                🎬
            </button>
        `;
        
        const playerArea = document.createElement('div');
        playerArea.id = 'musicPlayerControls';
        playerArea.style.cssText = `
            padding: 10px 12px;
            display: none;
            border-bottom: 1px solid var(--border);
            background: rgba(255, 0, 60, 0.03);
        `;
        playerArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
                <button id="prevMusicBtn" style="background: transparent; border: none; color: var(--cyan); font-size: 16px; cursor: pointer;">⏮</button>
                <button id="playPauseMusicBtn" style="background: #ff003c; color: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 16px; cursor: pointer;">▶</button>
                <button id="nextMusicBtn" style="background: transparent; border: none; color: var(--cyan); font-size: 16px; cursor: pointer;">⏭</button>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--cyan); font-size: 10px;">🎵</span>
                <div style="flex: 1; height: 3px; background: var(--border); border-radius: 2px;">
                    <div id="progressFill" style="width: 0%; height: 100%; background: #ff003c;"></div>
                </div>
                <button id="hideMusicPlayerBtn" style="background: transparent; border: 1px solid var(--red); color: var(--red); padding: 3px 10px; border-radius: 12px; font-size: 9px; cursor: pointer;">HIDE</button>
            </div>
            <div id="nowPlayingText" style="text-align: center; margin-top: 8px; color: #ff003c; font-size: 9px; font-family: monospace;"></div>
        `;
        
        const hiddenPlayer = document.createElement('iframe');
        hiddenPlayer.id = 'hiddenMusicPlayer';
        hiddenPlayer.style.display = 'none';
        hiddenPlayer.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        
        mediaSection.appendChild(searchArea);
        mediaSection.appendChild(playerArea);
        mediaSection.appendChild(hiddenPlayer);
        
        profileMini.parentNode.insertBefore(mediaSection, profileMini.nextSibling);
        
        this.searchInput = document.getElementById('musicSearchInput');
        this.searchBtn = document.getElementById('searchMusicBtn');
        this.popupBtn = document.getElementById('openMusicPopupBtn');
        this.playerArea = document.getElementById('musicPlayerControls');
        this.playPauseBtn = document.getElementById('playPauseMusicBtn');
        this.nowPlayingText = document.getElementById('nowPlayingText');
        this.hideBtn = document.getElementById('hideMusicPlayerBtn');
        this.hiddenPlayer = document.getElementById('hiddenMusicPlayer');
        
        this.attachEvents();
    }
    
    attachEvents() {
        this.searchBtn.onclick = () => this.searchAndPlay();
        this.popupBtn.onclick = () => this.openPopup();
        this.hideBtn.onclick = () => this.hidePlayer();
        this.playPauseBtn.onclick = () => this.togglePlayPause();
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchAndPlay();
        });
    }
    
    searchAndPlay() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert("Enter a song or artist name");
            return;
        }
        
        this.nowPlayingText.innerHTML = `🔍 Searching: ${query}`;
        
        // YouTube search embed (working)
        const searchUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
        this.hiddenPlayer.src = searchUrl;
        
        this.playerArea.style.display = 'block';
        this.nowPlayingText.innerHTML = `🎵 Now Playing: ${query.substring(0, 35)}`;
        
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    togglePlayPause() {
        // Visual feedback only
        const isPlaying = this.playPauseBtn.innerHTML === '⏸';
        this.playPauseBtn.innerHTML = isPlaying ? '▶' : '⏸';
    }
    
    hidePlayer() {
        this.playerArea.style.display = 'none';
        this.nowPlayingText.innerHTML = `🎵 Music playing in background`;
    }
    
    openPopup() {
        const query = this.searchInput.value.trim() || "synthwave mix";
        
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
                        border-bottom: 2px solid #ff003c;
                        padding: 12px 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .header h3 { color: #ff003c; font-size: 14px; }
                    .close-btn {
                        background: #ff003c;
                        color: #fff;
                        border: none;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        cursor: pointer;
                    }
                    .search-area {
                        padding: 12px;
                        background: #051014;
                        display: flex;
                        gap: 8px;
                    }
                    .search-input {
                        flex: 1;
                        background: #000;
                        border: 1px solid rgba(255,0,60,0.3);
                        color: #05ffa1;
                        padding: 8px 12px;
                        font-family: monospace;
                        border-radius: 20px;
                    }
                    .search-btn {
                        background: #ff003c;
                        color: #fff;
                        border: none;
                        padding: 0 16px;
                        border-radius: 20px;
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
                    }
                    .status {
                        padding: 8px 12px;
                        background: rgba(255,0,60,0.05);
                        font-size: 10px;
                        color: #ff003c;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>🎵 MUSIC PLAYER</h3>
                    <button class="close-btn" onclick="window.close()">✕</button>
                </div>
                <div class="search-area">
                    <input type="text" id="popupSearch" class="search-input" placeholder="Search song..." value="${query}">
                    <button id="popupSearchBtn" class="search-btn">🔍</button>
                </div>
                <div class="player">
                    <iframe id="popupPlayer" src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                </div>
                <div class="status" id="popupStatus">▶ ${query}</div>
                <script>
                    const searchInput = document.getElementById('popupSearch');
                    const searchBtn = document.getElementById('popupSearchBtn');
                    const player = document.getElementById('popupPlayer');
                    const status = document.getElementById('popupStatus');
                    function searchMusic() {
                        const q = searchInput.value.trim();
                        if(q) {
                            status.innerHTML = '🔍 ' + q;
                            player.src = 'https://www.youtube.com/embed?listType=search&list=' + encodeURIComponent(q) + '&autoplay=1';
                            status.innerHTML = '▶ ' + q;
                        }
                    }
                    searchBtn.onclick = searchMusic;
                    searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') searchMusic(); });
                <\/script>
            </body>
            </html>
        `;
        
        const blob = new Blob([popupHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, 'MusicPlayer', 'width=380,height=550,scrollbars=no,resizable=yes');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => new MusicPlayer(), 500);
});
