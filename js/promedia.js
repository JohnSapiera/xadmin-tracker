// js/promedia.js - Simple Media Player for Dashboard

class SimpleMediaPlayer {
    constructor() {
        this.init();
    }
    
    init() {
        this.createPlayerUI();
        this.attachEvents();
        this.loadDefaultMusic();
    }
    
    createPlayerUI() {
        // Find profile mini
        const profileMini = document.querySelector('.profile-mini');
        if (!profileMini) {
            console.log("Profile mini not found");
            return;
        }
        
        // Check if media section already exists
        if (document.getElementById('mediaSection')) return;
        
        // Create media section AFTER profile mini
        const mediaSection = document.createElement('div');
        mediaSection.id = 'mediaSection';
        mediaSection.className = 'media-section';
        mediaSection.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
        `;
        
        // Media header (click to expand/collapse)
        const mediaHeader = document.createElement('div');
        mediaHeader.className = 'media-header';
        mediaHeader.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 15px;
            cursor: pointer;
            background: rgba(0, 243, 255, 0.05);
            border-bottom: 1px solid var(--border);
        `;
        mediaHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 16px;">🎵</span>
                <span style="color: var(--cyan); font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px;">MEDIA PLAYER</span>
                <span id="mediaStatus" style="color: #5c7882; font-size: 9px;">● READY</span>
            </div>
            <span id="mediaToggle" style="color: var(--cyan); font-size: 14px;">▼</span>
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
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <input type="text" id="mediaSearchInput" placeholder="Search song, artist, or genre..." 
                    style="flex: 1; background: #000; border: 1px solid var(--border); color: var(--green); 
                    padding: 10px; font-family: var(--font-mono); font-size: 12px; border-radius: 6px; outline: none;">
                <button id="mediaSearchBtn" 
                    style="background: var(--cyan); color: #000; padding: 8px 18px; border: none; 
                    border-radius: 6px; font-weight: bold; cursor: pointer;">
                    🔍
                </button>
            </div>
            <div class="media-player-wrapper">
                <iframe id="mediaPlayer" 
                    style="width: 100%; height: 180px; border-radius: 8px; border: none; background: #000;"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    frameborder="0"></iframe>
            </div>
        `;
        
        mediaSection.appendChild(mediaHeader);
        mediaSection.appendChild(mediaContent);
        
        // Insert media section AFTER profile mini (not before)
        profileMini.parentNode.insertBefore(mediaSection, profileMini.nextSibling);
        
        this.mediaContent = mediaContent;
        this.searchInput = mediaContent.querySelector('#mediaSearchInput');
        this.playerFrame = mediaContent.querySelector('#mediaPlayer');
        this.mediaStatus = mediaHeader.querySelector('#mediaStatus');
        this.toggleBtn = mediaHeader.querySelector('#mediaToggle');
        this.isExpanded = true;
        
        // Collapse by default on mobile
        if (window.innerWidth <= 768) {
            this.toggleCollapse();
        }
    }
    
    attachEvents() {
        // Toggle collapse
        const header = document.querySelector('.media-header');
        if (header) {
            header.addEventListener('click', () => this.toggleCollapse());
        }
        
        // Search functionality
        const searchBtn = document.getElementById('mediaSearchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchMusic());
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchMusic();
            });
        }
    }
    
    toggleCollapse() {
        if (!this.mediaContent) return;
        
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.mediaContent.style.display = 'block';
            this.toggleBtn.innerHTML = '▼';
        } else {
            this.mediaContent.style.display = 'none';
            this.toggleBtn.innerHTML = '▶';
        }
    }
    
    searchMusic() {
        if (!this.searchInput || !this.playerFrame) return;
        
        const query = this.searchInput.value.trim();
        if (!query) {
            this.updateStatus('⚠️ Enter a search term', 'var(--yellow)');
            return;
        }
        
        this.updateStatus('🔍 LOADING...', 'var(--cyan)');
        
        // YouTube search embed
        const searchUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(query)}`;
        this.playerFrame.src = searchUrl;
        
        this.updateStatus(`🎵 ${query.substring(0, 30)}`, 'var(--green)');
        
        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    loadDefaultMusic() {
        if (this.searchInput && this.playerFrame) {
            this.searchInput.value = "synthwave mix";
            this.searchMusic();
        }
    }
    
    updateStatus(message, color = '#5c7882') {
        if (this.mediaStatus) {
            this.mediaStatus.innerHTML = message;
            this.mediaStatus.style.color = color;
            setTimeout(() => {
                if (this.mediaStatus && this.mediaStatus.innerHTML === message) {
                    this.mediaStatus.style.color = '#5c7882';
                }
            }, 2000);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new SimpleMediaPlayer(), 500);
    });
} else {
    setTimeout(() => new SimpleMediaPlayer(), 500);
}
