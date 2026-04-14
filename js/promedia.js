// js/promedia.js - Spotify Music Player (Compact Design)

class SpotifyPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTrack = null;
        this.init();
    }
    
    init() {
        this.createMediaSection();
        this.attachEvents();
    }
    
    createMediaSection() {
        const profileMini = document.querySelector('.profile-mini');
        if (!profileMini) return;
        
        if (document.getElementById('spotifyPlayerSection')) return;
        
        const mediaSection = document.createElement('div');
        mediaSection.id = 'spotifyPlayerSection';
        mediaSection.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
        `;
        
        // Search bar area - compact buttons
        const searchArea = document.createElement('div');
        searchArea.style.cssText = `
            padding: 10px 12px;
            display: flex;
            gap: 8px;
            align-items: center;
            border-bottom: 1px solid var(--border);
        `;
        searchArea.innerHTML = `
            <input type="text" id="spotifySearchInput" placeholder="Search song..." 
                style="flex: 1; background: #000; border: 1px solid var(--border); color: var(--green); 
                padding: 8px 12px; font-family: var(--font-mono); font-size: 11px; border-radius: 6px; outline: none;">
            <button id="searchSpotifyBtn" style="background: #1DB954; color: #000; border: none; 
                padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 11px; 
                font-family: var(--font-mono); cursor: pointer; letter-spacing: 0.5px;">
                🔍
            </button>
            <button id="openSpotifyPopupBtn" style="background: #1DB954; color: #000; border: none; 
                padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 11px; 
                font-family: var(--font-mono); cursor: pointer; letter-spacing: 0.5px;">
                🎬
            </button>
        `;
        
        // Player controls area (hidden initially)
        const playerArea = document.createElement('div');
        playerArea.id = 'spotifyPlayerControls';
        playerArea.style.cssText = `
            padding: 10px 12px;
            display: none;
            border-bottom: 1px solid var(--border);
            background: rgba(29, 185, 84, 0.03);
        `;
        playerArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
                <button id="prevTrackBtn" style="background: transparent; border: none; color: var(--cyan); font-size: 16px; cursor: pointer; opacity: 0.7;">⏮</button>
                <button id="playPauseTrackBtn" style="background: #1DB954; color: #000; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 16px; cursor: pointer; font-weight: bold;">▶</button>
                <button id="nextTrackBtn" style="background: transparent; border: none; color: var(--cyan); font-size: 16px; cursor: pointer; opacity: 0.7;">⏭</button>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: var(--cyan); font-size: 10px;">🎵</span>
                <div style="flex: 1; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden;">
                    <div id="progressBarFill" style="width: 0%; height: 100%; background: #1DB954; transition: width 0.3s;"></div>
                </div>
                <button id="hidePlayerControlBtn" style="background: transparent; border: 1px solid var(--red); color: var(--red); padding: 3px 10px; border-radius: 12px; font-size: 9px; cursor: pointer; font-family: var(--font-mono);">HIDE</button>
            </div>
            <div id="nowPlayingLabel" style="text-align: center; margin-top: 8px; color: #1DB954; font-size: 9px; font-family: var(--font-mono); letter-spacing: 0.5px;"></div>
        `;
        
        // Spotify embed iframe (hidden)
        const hiddenPlayer = document.createElement('iframe');
        hiddenPlayer.id = 'spotifyHiddenPlayer';
        hiddenPlayer.style.cssText = 'display: none;';
        hiddenPlayer.allow = 'encrypted-media';
        
        mediaSection.appendChild(searchArea);
        mediaSection.appendChild(playerArea);
        mediaSection.appendChild(hiddenPlayer);
        
        profileMini.parentNode.insertBefore(mediaSection, profileMini.nextSibling);
        
        this.searchInput = document.getElementById('spotifySearchInput');
        this.searchBtn = document.getElementById('searchSpotifyBtn');
        this.popupBtn = document.getElementById('openSpotifyPopupBtn');
        this.playerArea = document.getElementById('spotifyPlayerControls');
        this.playPauseBtn = document.getElementById('playPauseTrackBtn');
        this.prevBtn = document.getElementById('prevTrackBtn');
        this.nextBtn = document.getElementById('nextTrackBtn');
        this.hideBtn = document.getElementById('hidePlayerControlBtn');
        this.nowPlayingLabel = document.getElementById('nowPlayingLabel');
        this.hiddenPlayer = document.getElementById('spotifyHiddenPlayer');
        
        this.currentQuery = "";
    }
    
    attachEvents() {
        this.searchBtn.onclick = () => this.searchAndPlay();
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchAndPlay();
        });
        
        this.popupBtn.onclick = () => this.openSpotifyPopup();
        this.playPauseBtn.onclick = () => this.togglePlayPause();
        this.hideBtn.onclick = () => this.hidePlayer();
    }
    
    searchAndPlay() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert("Enter a song or artist name");
            return;
        }
        
        this.currentQuery = query;
        this.nowPlayingLabel.innerHTML = `🔍 Searching: ${query}`;
        
        // Open Spotify search in iframe
        const spotifyUrl = `https://open.spotify.com/embed/search/${encodeURIComponent(query)}`;
        this.hiddenPlayer.src = spotifyUrl;
        
        this.playerArea.style.display = 'block';
        this.nowPlayingLabel.innerHTML = `🎵 Now: ${query.substring(0, 30)}`;
        
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    togglePlayPause() {
        // Visual toggle only (Spotify iframe controls are limited)
        this.isPlaying = !this.isPlaying;
        this.playPauseBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
    }
    
    hidePlayer() {
        this.playerArea.style.display = 'none';
        this.nowPlayingLabel.innerHTML = `🎵 Playing in background`;
        
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }
    
    openSpotifyPopup() {
        const query = this.searchInput.value.trim() || this.currentQuery || "chill vibes";
        
        const popupHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Spotify Player</title>
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
                        border-bottom: 2px solid #1DB954;
                        padding: 12px 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .header h3 { color: #1DB954; font-size: 14px; letter-spacing: 1px; }
                    .close-btn {
                        background: #ff003c;
                        color: #fff;
                        border: none;
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 14px;
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
                        border: 1px solid rgba(29,185,84,0.3);
                        color: #05ffa1;
                        padding: 8px 12px;
                        font-family: monospace;
                        font-size: 12px;
                        border-radius: 20px;
                    }
                    .search-input:focus {
                        border-color: #1DB954;
                        outline: none;
                    }
                    .search-btn {
                        background: #1DB954;
                        color: #000;
                        border: none;
                        padding: 0 16px;
                        border-radius: 20px;
                        font-weight: bold;
                        cursor: pointer;
                        font-family: monospace;
                        font-size: 11px;
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
                        padding: 8px 12px;
                        background: rgba(29,185,84,0.05);
                        font-size: 9px;
                        color: #1DB954;
                        font-family: monospace;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>🎧 SPOTIFY</h3>
                    <button class="close-btn" onclick="window.close()">✕</button>
                </div>
                <div class="search-area">
                    <input type="text" id="popupSearch" class="search-input" placeholder="Search song..." value="${query}">
                    <button id="popupSearchBtn" class="search-btn">SEARCH</button>
                </div>
                <div class="player">
                    <iframe id="popupPlayer" src="https://open.spotify.com/embed/search/${encodeURIComponent(query)}" allow="encrypted-media"></iframe>
                </div>
                <div class="status" id="popupStatus">🎵 ${query}</div>
                <script>
                    const searchInput = document.getElementById('popupSearch');
                    const searchBtn = document.getElementById('popupSearchBtn');
                    const player = document.getElementById('popupPlayer');
                    const status = document.getElementById('popupStatus');
                    
                    function searchMusic() {
                        const q = searchInput.value.trim();
                        if (q) {
                            status.innerHTML = '🔍 Searching: ' + q;
                            player.src = 'https://open.spotify.com/embed/search/' + encodeURIComponent(q);
                            status.innerHTML = '🎵 ' + q;
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
        window.open(popupUrl, 'SpotifyPlayer', 'width=380,height=550,scrollbars=no,resizable=yes');
        setTimeout(() => URL.revokeObjectURL(popupUrl), 1000);
        
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new SpotifyPlayer(), 500);
    });
} else {
    setTimeout(() => new SpotifyPlayer(), 500);
}
