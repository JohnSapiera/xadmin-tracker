// js/promedia.js - Professional Media Player for Dashboard

class ProMediaPlayer {
    constructor() {
        this.playerContainer = null;
        this.searchInput = null;
        this.playerFrame = null;
        this.isExpanded = false;
        this.currentQuery = "cyberpunk synthwave mix";
        
        this.init();
    }
    
    init() {
        this.createPlayerUI();
        this.attachEvents();
        this.loadDefaultMusic();
    }
    
    createPlayerUI() {
        // Create media section container
        const mediaSection = document.createElement('div');
        mediaSection.id = 'mediaSection';
        mediaSection.className = 'media-section';
        mediaSection.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
            transition: all 0.3s ease;
        `;
        
        // Media header (click to expand/collapse)
        const mediaHeader = document.createElement('div');
        mediaHeader.className = 'media-header';
        mediaHeader.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 15px;
            cursor: pointer;
            background: rgba(0, 243, 255, 0.05);
            border-bottom: 1px solid var(--border);
            transition: 0.3s;
        `;
        mediaHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🎵</span>
                <span style="color: var(--cyan); font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px;">PRO MEDIA</span>
                <span id="mediaStatus" style="color: #5c7882; font-size: 9px;">● READY</span>
            </div>
            <span id="mediaToggle" style="color: var(--cyan); font-size: 16px;">▼</span>
        `;
        
        // Media content (collapsible)
        const mediaContent = document.createElement('div');
        mediaContent.id = 'mediaContent';
        mediaContent.className = 'media-content';
        mediaContent.style.cssText = `
            padding: 12px;
            display: block;
        `;
        
        mediaContent.innerHTML = `
            <div class="media-search-bar" style="display: flex; gap: 8px; margin-bottom: 12px;">
                <input type="text" id="mediaSearchInput" class="media-search-input" placeholder="Search song, artist, or genre..." 
                    style="flex: 1; background: #000; border: 1px solid var(--border); color: var(--green); 
                    padding: 10px; font-family: var(--font-mono); font-size: 12px; border-radius: 6px; outline: none;">
                <button id="mediaSearchBtn" class="media-search-btn" 
                    style="background: var(--cyan); color: #000; padding: 8px 15px; border: none; 
                    border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s;">
                    🔍 SEARCH
                </button>
            </div>
            <div class="media-quick-buttons" style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                <button data-query="cyberpunk synthwave" class="media-quick-btn">🎸 CYBERPUNK</button>
                <button data-query="lofi hip hop beats" class="media-quick-btn">🎧 LO-FI</button>
                <button data-query="synthwave 80s mix" class="media-quick-btn">📀 SYNTHWAVE</button>
                <button data-query="chill electronic music" class="media-quick-btn">🌊 CHILL</button>
            </div>
            <div class="media-player-wrapper" style="position: relative;">
                <iframe id="mediaPlayer" class="media-player" 
                    style="width: 100%; height: 180px; border-radius: 8px; border: none; background: #000;"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    frameborder="0"></iframe>
            </div>
            <div class="media-volume" style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                <span style="color: var(--cyan); font-size: 11px;">🔊</span>
                <input type="range" id="mediaVolume" min="0" max="100" value="50" 
                    style="flex: 1; height: 3px; -webkit-appearance: none; background: var(--border); border-radius: 3px;">
                <span id="volumePercent" style="color: #5c7882; font-size: 10px;">50%</span>
            </div>
        `;
        
        mediaContent.querySelectorAll('.media-quick-btn').forEach(btn => {
            btn.style.cssText = `
                background: rgba(0, 243, 255, 0.1);
                border: 1px solid var(--border);
                color: var(--cyan);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 10px;
                font-family: var(--font-mono);
                cursor: pointer;
                transition: 0.3s;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(0, 243, 255, 0.2)';
                btn.style.borderColor = 'var(--cyan)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(0, 243, 255, 0.1)';
                btn.style.borderColor = 'var(--border)';
            });
        });
        
        mediaSection.appendChild(mediaHeader);
        mediaSection.appendChild(mediaContent);
        
        // Find profile-mini and insert media section above it
        const profileMini = document.querySelector('.profile-mini');
        if (profileMini) {
            profileMini.parentNode.insertBefore(mediaSection, profileMini);
        } else {
            const main = document.querySelector('main');
            if (main) main.appendChild(mediaSection);
        }
        
        this.playerContainer = mediaSection;
        this.mediaContent = mediaContent;
        this.searchInput = mediaContent.querySelector('#mediaSearchInput');
        this.playerFrame = mediaContent.querySelector('#mediaPlayer');
        this.volumeSlider = mediaContent.querySelector('#mediaVolume');
        this.volumePercent = mediaContent.querySelector('#volumePercent');
        this.mediaStatus = mediaHeader.querySelector('#mediaStatus');
        this.toggleBtn = mediaHeader.querySelector('#mediaToggle');
        
        // Collapse by default on mobile
        if (window.innerWidth <= 768) {
            this.toggleCollapse();
        }
    }
    
    attachEvents() {
        // Toggle collapse
        this.playerContainer.querySelector('.media-header').addEventListener('click', () => {
            this.toggleCollapse();
        });
        
        // Search functionality
        const searchBtn = this.mediaContent.querySelector('#mediaSearchBtn');
        searchBtn.addEventListener('click', () => this.searchMusic());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchMusic();
        });
        
        // Quick buttons
        this.mediaContent.querySelectorAll('.media-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.getAttribute('data-query');
                this.searchInput.value = query;
                this.searchMusic();
            });
        });
        
        // Volume control (note: YouTube iframe volume cannot be controlled due to CORS)
        // This is for visual feedback only
        this.volumeSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            this.volumePercent.innerText = val + '%';
            this.updateStatus(`Volume ${val}% (control via YouTube player)`);
        });
    }
    
    toggleCollapse() {
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.mediaContent.style.display = 'block';
            this.toggleBtn.innerHTML = '▲';
        } else {
            this.mediaContent.style.display = 'none';
            this.toggleBtn.innerHTML = '▼';
        }
    }
    
    searchMusic() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.updateStatus('⚠️ Enter a search term', 'var(--yellow)');
            return;
        }
        
        this.currentQuery = query;
        this.updateStatus('🔍 LOADING...', 'var(--cyan)');
        
        // YouTube search embed
        const searchUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
        this.playerFrame.src = searchUrl;
        
        this.updateStatus(`🎵 PLAYING: ${query.substring(0, 30)}`, 'var(--green)');
        
        // Add haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    loadDefaultMusic() {
        this.searchInput.value = this.currentQuery;
        this.searchMusic();
    }
    
    updateStatus(message, color = '#5c7882') {
        if (this.mediaStatus) {
            this.mediaStatus.innerHTML = message;
            this.mediaStatus.style.color = color;
            setTimeout(() => {
                if (this.mediaStatus.innerHTML === message) {
                    this.mediaStatus.style.color = '#5c7882';
                }
            }, 2000);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new ProMediaPlayer();
    }, 500);
});
