/**
 * Input Class
 * Gère les entrées clavier et prépare le terrain pour le joystick.
 */
export class Input {
    constructor() {
        this.keys = {};
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Joystick Mobile & Souris
        this.touchStart = null;
        this.touchMove = null;
        this.joystickActive = false;

        // Événements Tactiles
        window.addEventListener('touchstart', (e) => {
            this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            this.touchMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            this.joystickActive = true;
        });

        window.addEventListener('touchmove', (e) => {
            if (this.joystickActive) {
                this.touchMove = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        window.addEventListener('touchend', () => {
            this.joystickActive = false;
            this.touchStart = null;
            this.touchMove = null;
        });

        // Événements Souris (pour test sur desktop ou jouabilité souris)
        window.addEventListener('mousedown', (e) => {
            // On n'active le joystick souris que si on n'est pas déjà en tactile
            if (!this.joystickActive && e.button === 0) {
                this.touchStart = { x: e.clientX, y: e.clientY };
                this.touchMove = { x: e.clientX, y: e.clientY };
                this.joystickActive = true;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.joystickActive && !('touches' in e)) { // Si c'est un vrai mousemove sans touch
                this.touchMove = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.joystickActive) {
                this.joystickActive = false;
                this.touchStart = null;
                this.touchMove = null;
            }
        });
    }

    getMovement() {
        let dx = 0;
        let dy = 0;

        // Clavier
        if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

        // Joystick
        if (this.joystickActive && this.touchStart && this.touchMove) {
            const jdx = this.touchMove.x - this.touchStart.x;
            const jdy = this.touchMove.y - this.touchStart.y;
            const dist = Math.sqrt(jdx * jdx + jdy * jdy);

            if (dist > 5) { // Deadzone
                dx = jdx / dist;
                dy = jdy / dist;
            }
        }

        // Normalisation
        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        return { dx, dy };
    }

    draw(ctx) {
        if (this.joystickActive && this.touchStart) {
            const baseX = this.touchStart.x;
            const baseY = this.touchStart.y;
            const radius = 60;

            // Base circle (outer ring)
            ctx.beginPath();
            ctx.arc(baseX, baseY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Base fill
            ctx.beginPath();
            ctx.arc(baseX, baseY, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.05)';
            ctx.fill();

            // Stick position
            const stickX = this.touchMove ? this.touchMove.x : baseX;
            const stickY = this.touchMove ? this.touchMove.y : baseY;

            const dx = stickX - baseX;
            const dy = stickY - baseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const limit = radius;

            let finalX = stickX;
            let finalY = stickY;

            if (dist > limit) {
                finalX = baseX + (dx / dist) * limit;
                finalY = baseY + (dy / dist) * limit;
            }

            // Stick inner dot with glow
            ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(finalX, finalY, 28, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
}
