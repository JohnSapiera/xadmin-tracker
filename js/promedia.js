// js/promedia.js - Eraserheads Spotify Player

class EraserheadsPlayer {
    constructor() {
        this.init();
    }
    
    init() {
        this.createPlayer();
    }
    
    createPlayer() {
        const profileMini = document.querySelector('.profile-mini');
        if (!profileMini) return;
        
        if (document.getElementById('ehPlayer')) return;
        
        const playerSection = document.createElement('div');
        playerSection.id = 'ehPlayer';
        playerSection.style.cssText = `
            background: #051014;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin: 10px 0;
            overflow: hidden;
        `;
        
        playerSection.innerHTML = `
            <div style="padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #1DB954; font-size: 14px;">🎸</span>
                    <span style="color: var(--cyan); font-size: 10px; font-family: monospace;">ERASERHEADS</span>
                </div>
                <button id="ehHideBtn" style="background: transparent; border: 1px solid var(--red); color: var(--red); padding: 3px 10px; border-radius: 12px; font-size: 9px; cursor: pointer;">HIDE</button>
            </div>
            <div id="ehContainer" style="padding: 10px;">
                <iframe style="width: 100%; height: 152px; border: none; border-radius: 8px;" 
                    allow="encrypted-media" 
                    src="https://open.spotify.com/embed/artist/3vw2QpVQ9DJtBR9jCsLpyP?utm_source=generator&theme=0">
                </iframe>
            </div>
            <div style="padding: 6px 12px; border-top: 1px solid var(--border); text-align: center;">
                <span style="color: #5c7882; font-size: 8px;">🎵 Ang Huling El Bimbo • With A Smile • Pare Ko • Magasin • Alapaap</span>
            </div>
        `;
        
        profileMini.parentNode.insertBefore(playerSection, profileMini.nextSibling);
        
        this.container = document.getElementById('ehContainer');
        this.hideBtn = document.getElementById('ehHideBtn');
        this.isVisible = true;
        
        this.hideBtn.onclick = () => this.togglePlayer();
    }
    
    togglePlayer() {
        if (this.isVisible) {
            this.container.style.display = 'none';
            this.hideBtn.innerHTML = 'SHOW';
            this.hideBtn.style.borderColor = '#1DB954';
            this.hideBtn.style.color = '#1DB954';
        } else {
            this.container.style.display = 'block';
            this.hideBtn.innerHTML = 'HIDE';
            this.hideBtn.style.borderColor = 'var(--red)';
            this.hideBtn.style.color = 'var(--red)';
        }
        this.isVisible = !this.isVisible;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => new EraserheadsPlayer(), 500);
    });
} else {
    setTimeout(() => new EraserheadsPlayer(), 500);
}
