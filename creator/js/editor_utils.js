const API = {
    async loadJSON(file) {
        try {
            const response = await fetch(`../${file}?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Impossible de charger ${file}`);
            return await response.json();
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async saveJSON(file, content) {
        try {
            const response = await fetch('/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, content })
            });
            const result = await response.json();
            if (result.status === 'success') {
                showToast('Sauvegardé avec succès !', 'success');
                return true;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            showToast(`Erreur: ${err.message}`, 'danger');
            return false;
        }
    },

    async listAssets() {
        try {
            const response = await fetch('/list-assets');
            return await response.json();
        } catch (err) {
            console.error(err);
            return [];
        }
    }
};

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '1rem 2rem';
    toast.style.borderRadius = '8px';
    toast.style.background = type === 'success' ? '#10b981' : (type === 'danger' ? '#ef4444' : '#3b82f6');
    toast.style.color = 'white';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '1000';
    toast.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4)';
    toast.style.transition = 'all 0.3s ease';
    toast.style.transform = 'translateY(100px)';
    
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.transform = 'translateY(0)', 10);
    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

class AnimationPreviewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.img = null;
        this.timer = null;
        this.currentFrame = 0;
        this.currentAnim = null;
        this.config = null;
    }

    setEntity(config) {
        this.config = config;
        this.update();
    }

    update() {
        if (!this.config || !this.config.visuals) return;
        const viz = this.config.visuals;
        this.container.innerHTML = '';
        if (viz.type === 'shape') {
            const shape = document.createElement('div');
            shape.style.width = (viz.width || 40) + 'px';
            shape.style.height = (viz.height || viz.width || 40) + 'px';
            shape.style.backgroundColor = viz.color || '#ff0000';
            shape.style.borderRadius = '4px';
            this.container.appendChild(shape);
        } else {
            this.img = document.createElement('img');
            this.img.style.width = (viz.width || 64) + 'px';
            if (viz.height) this.img.style.height = viz.height + 'px';
            this.container.appendChild(this.img);
            const anims = viz.animations || {};
            const firstAnim = anims.walk || anims.idle || Object.keys(anims)[0];
            if (firstAnim) this.play(firstAnim);
        }
    }

    play(animName) {
        if (!this.config.visuals.animations || !this.config.visuals.animations[animName]) return;
        clearInterval(this.timer);
        this.currentAnim = this.config.visuals.animations[animName];
        this.currentFrame = 0;
        const frames = this.currentAnim.frames || [];
        if (frames.length === 0) return;
        const updateFrame = () => {
            this.img.src = `../${frames[this.currentFrame]}`;
            this.currentFrame = (this.currentFrame + 1) % frames.length;
            if (!this.currentAnim.loop && this.currentFrame === 0) clearInterval(this.timer);
        };
        updateFrame();
        if (frames.length > 1) {
            this.timer = setInterval(updateFrame, 1000 / (this.currentAnim.frameRate || 10));
        }
    }
}
