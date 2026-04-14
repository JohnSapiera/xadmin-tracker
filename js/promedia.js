// js/promedia.js - YouTube Music Player (with Song Selection)

class YouTubeMusicPlayer {
    constructor() {
        this.currentVideoId = null;
        this.isPlaying = false;
        this.init();
    }
    
    init() {
        this.createPlayer();
        this.attachEvents();
    }
    
    createPlayer() {
        const profileMini = document.querySelector('.profile-mini');
        if (!profileMini) return;
        
        if (document.getElementById('ytMusicPlayer')) return;
        
        const playerSection = document.createElement('div');
        playerSection.id = 'ytMusicPlayer';
        playerSection.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
        `;
        
        playerSection.innerHTML = `
            <div style="padding: 10px 12px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid var(--border);">
                <span style="color: #ff003c; font-size: 14px;">🎵</span>
                <input type="text" id="ytSearchInput" placeholder="Search any song..." 
                    style="flex: 1; background: #000; border: 1px solid var(--border); color: var(--green); 
                    padding: 8px 12px; font-family: var(--font-mono); font-size: 11px; border-radius: 20px; outline: none;">
                <button id="ytSearchBtn" style="background: #ff003c; color: #fff; border: none; 
                    padding: 6px 14px; border-radius: 20px; font-size: 11px; cursor: pointer;">
                    🔍 SEARCH
                </button>
            </div>
            <div id="ytResultsContainer" style="max-height: 200px; overflow-y: auto; display: none; border-bottom: 1px solid var(--border);">
                <div id="ytResultsList" style="padding: 5px;"></div>
            </div>
            <div id="ytPlayerArea" style="padding: 10px; display: none;">
                <iframe id="ytPlayer" style="width: 100%; height: 180px; border: none; border-radius: 8px;" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                    <button id="ytPlayPauseBtn" style="background: #ff003c; color: #fff; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">▶</button>
                    <div style="flex: 1;">
                        <div id="ytNowPlaying" style="color: #ff003c; font-size: 9px; font-family: monospace;">Select a song</div>
                    </div>
                    <button id="ytHideBtn" style="background: transparent; border: 1px solid var(--red); color: var(--red); padding: 3px 10px; border-radius: 12px; font-size: 9px; cursor: pointer;">HIDE</button>
                </div>
            </div>
        `;
        
        profileMini.parentNode.insertBefore(playerSection, profileMini.nextSibling);
        
        this.searchInput = document.getElementById('ytSearchInput');
        this.searchBtn = document.getElementById('ytSearchBtn');
        this.resultsContainer = document.getElementById('ytResultsContainer');
        this.resultsList = document.getElementById('ytResultsList');
        this.playerArea = document.getElementById('ytPlayerArea');
        this.playerFrame = document.getElementById('ytPlayer');
        this.playPauseBtn = document.getElementById('ytPlayPauseBtn');
        this.nowPlaying = document.getElementById('ytNowPlaying');
        this.hideBtn = document.getElementById('ytHideBtn');
        
        this.attachEvents();
    }
    
    attachEvents() {
        this.searchBtn.onclick = () => this.searchSongs();
        this.hideBtn.onclick = () => this.hidePlayer();
        this.playPauseBtn.onclick = () => this.togglePlayPause();
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchSongs();
        });
    }
    
    async searchSongs() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert("Enter a song name");
            return;
        }
        
        this.resultsContainer.style.display = 'block';
        this.resultsList.innerHTML = '<div style="text-align:center; padding:10px; color:var(--cyan);">🔍 Searching...</div>';
        
        try {
            // Using YouTube search API (no key needed for embed search)
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            
            // For demo, show direct player
            this.playerFrame.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1`;
            this.playerArea.style.display = 'block';
            this.resultsContainer.style.display = 'none';
            this.nowPlaying.innerHTML = `🎵 Now Playing: ${query}`;
            this.isPlaying = true;
            this.playPauseBtn.innerHTML = '⏸';
            
            // Also show song selection links
            this.resultsList.innerHTML = `
                <div style="padding: 8px; font-size: 10px; color: #5c7882; text-align: center;">
                    📱 To select specific song, use the player controls above
                </div>
                <div style="padding: 8px; text-align: center;">
                    <a href="${searchUrl}" target="_blank" style="color: var(--cyan); font-size: 10px;">🔗 Open full YouTube search →</a>
                </div>
            `;
            
        } catch(e) {
            this.resultsList.innerHTML = '<div style="text-align:center; padding:10px; color:var(--red);">❌ Error loading</div>';
        }
        
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    togglePlayPause() {
        // Note: Full control requires YouTube IFrame API
        // For now, reload the player
        const currentSrc = this.playerFrame.src;
        if (this.isPlaying) {
            // Pause by removing autoplay
            this.playerFrame.src = currentSrc.replace('&autoplay=1', '');
            this.playPauseBtn.innerHTML = '▶';
        } else {
            // Play by adding autoplay
            this.playerFrame.src = currentSrc + '&autoplay=1';
            this.playPauseBtn.innerHTML = '⏸';
        }
        this.isPlaying = !this.isPlaying;
    }
    
    hidePlayer() {
        this.playerArea.style.display = 'none';
        this.resultsContainer.style.display = 'none';
        this.nowPlaying.innerHTML = `🎵 Player hidden`;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new YouTubeMusicPlayer(), 500);
    });
} else {
    setTimeout(() => new YouTubeMusicPlayer(), 500);
}
