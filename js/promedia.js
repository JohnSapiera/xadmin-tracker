// js/promedia.js - Pop-up YouTube Media Player

class PopupMediaPlayer {
    constructor() {
        this.popupWindow = null;
        this.init();
    }
    
    init() {
        this.createMediaButton();
        this.attachEvents();
    }
    
    createMediaButton() {
        // Find profile mini
        const profileMini = document.querySelector('.profile-mini');
        if (!profileMini) return;
        
        // Check if media button already exists
        if (document.getElementById('mediaButtonContainer')) return;
        
        // Create media button container AFTER profile mini
        const mediaContainer = document.createElement('div');
        mediaContainer.id = 'mediaButtonContainer';
        mediaContainer.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            padding: 10px 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        mediaContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🎵</span>
                <span style="color: var(--cyan); font-family: var(--font-mono); font-size: 11px;">YOUTUBE MUSIC</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="openMediaPopupBtn" style="background: var(--cyan); color: #000; border: none; padding: 6px 12px; border-radius: 6px; font-family: monospace; font-weight: bold; cursor: pointer;">
                    🎬 OPEN
                </button>
            </div>
        `;
        
        // Insert after profile mini
        profileMini.parentNode.insertBefore(mediaContainer, profileMini.nextSibling);
        
        this.mediaContainer = mediaContainer;
        this.openBtn = document.getElementById('openMediaPopupBtn');
    }
    
    attachEvents() {
        if (this.openBtn) {
            this.openBtn.onclick = () => this.openPopupPlayer();
        }
    }
    
    openPopupPlayer() {
        // Create popup HTML
        const popupHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
                <title>YouTube Music Player</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        background: #01080b;
                        font-family: 'Share Tech Mono', monospace;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .popup-header {
                        background: #000;
                        border-bottom: 2px solid #00f3ff;
                        padding: 12px 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .popup-header h3 {
                        color: #00f3ff;
                        font-size: 14px;
                        letter-spacing: 2px;
                    }
                    .close-popup {
                        background: #ff003c;
                        color: #fff;
                        border: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        font-size: 18px;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .search-section {
                        padding: 15px;
                        background: #051014;
                        border-bottom: 1px solid rgba(0,243,255,0.2);
                        display: flex;
                        gap: 10px;
                    }
                    .search-input {
                        flex: 1;
                        background: #000;
                        border: 1px solid rgba(0,243,255,0.2);
                        color: #05ffa1;
                        padding: 12px;
                        font-family: monospace;
                        font-size: 14px;
                        border-radius: 6px;
                        outline: none;
                    }
                    .search-input:focus {
                        border-color: #00f3ff;
                    }
                    .search-btn {
                        background: #00f3ff;
                        color: #000;
                        border: none;
                        padding: 0 20px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        font-family: monospace;
                    }
                    .player-container {
                        flex: 1;
                        padding: 10px;
                        background: #000;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 8px;
                    }
                    .status-bar {
                        padding: 8px 15px;
                        background: rgba(0,243,255,0.05);
                        border-top: 1px solid rgba(0,243,255,0.2);
                        font-size: 10px;
                        color: #5c7882;
                        font-family: monospace;
                        display: flex;
                        justify-content: space-between;
                    }
                    .hide-btn {
                        background: #222;
                        border: 1px solid #ff003c;
                        color: #ff003c;
                        padding: 5px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: monospace;
                        font-size: 10px;
                    }
                    .hide-btn:hover {
                        background: #ff003c;
                        color: #fff;
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="popup-header">
                    <h3>🎵 YOUTUBE MUSIC PLAYER</h3>
                    <button class="close-popup" id="closePopupBtn">✕</button>
                </div>
                <div class="search-section">
                    <input type="text" id="searchInput" class="search-input" placeholder="Search song, artist, or genre..." autofocus>
                    <button id="searchBtn" class="search-btn">🔍 SEARCH</button>
                </div>
                <div class="player-container">
                    <iframe id="youtubePlayer" src="https://www.youtube.com/embed?listType=search&list=synthwave%20mix" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                </div>
                <div class="status-bar">
                    <span id="nowPlaying">● READY</span>
                    <button id="hidePopupBtn" class="hide-btn">🔽 HIDE</button>
                </div>
                
                <script>
                    const searchInput = document.getElementById('searchInput');
                    const searchBtn = document.getElementById('searchBtn');
                    const youtubePlayer = document.getElementById('youtubePlayer');
                    const nowPlaying = document.getElementById('nowPlaying');
                    const closeBtn = document.getElementById('closePopupBtn');
                    const hideBtn = document.getElementById('hidePopupBtn');
                    
                    function searchMusic() {
                        const query = searchInput.value.trim();
                        if (query) {
                            nowPlaying.innerHTML = '🔍 LOADING...';
                            nowPlaying.style.color = '#00f3ff';
                            const searchUrl = 'https://www.youtube.com/embed?listType=search&list=' + encodeURIComponent(query);
                            youtubePlayer.src = searchUrl;
                            nowPlaying.innerHTML = '🎵 ' + query.substring(0, 40);
                            setTimeout(() => {
                                nowPlaying.style.color = '#5c7882';
                            }, 2000);
                        }
                    }
                    
                    searchBtn.onclick = searchMusic;
                    searchInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') searchMusic();
                    });
                    
                    closeBtn.onclick = () => window.close();
                    hideBtn.onclick = () => window.close();
                    
                    // Auto-focus on search input
                    setTimeout(() => searchInput.focus(), 100);
                <\/script>
            </body>
            </html>
        `;
        
        // Create blob URL for popup
        const blob = new Blob([popupHTML], { type: 'text/html' });
        const popupUrl = URL.createObjectURL(blob);
        
        // Open popup window
        const width = 400;
        const height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        this.popupWindow = window.open(popupUrl, 'YouTubePlayer', `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=yes`);
        
        // Clean up blob URL after popup loads
        if (this.popupWindow) {
            setTimeout(() => URL.revokeObjectURL(popupUrl), 1000);
        }
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new PopupMediaPlayer(), 500);
    });
} else {
    setTimeout(() => new PopupMediaPlayer(), 500);
}
