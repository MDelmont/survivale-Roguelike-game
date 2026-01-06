import { Animator } from './Animator.js';

/**
 * Loot Class
 * Représente un objet collectable à l'écran (XP, bonus).
 */
export class Loot {
    constructor(x, y, value, type = 'xp', assetManager = null, visuals = null) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.type = type; // 'xp' ou 'weapon'
        this.radius = type === 'xp' ? 6 : 12;
        this.toRemove = false;

        // Pour l'animation de magnétisme
        this.isFollowing = false;
        this.followSpeed = 500;

        this.color = (type === 'xp') ? '#0f0' : '#ffd700';

        // Système d'animation
        this.visuals = visuals;
        this.animator = (visuals && assetManager) ? new Animator(visuals, assetManager) : null;
    }

    update(deltaTime, playerPos) {
        if (this.isFollowing) {
            const dt = deltaTime / 1000;
            const dx = playerPos.x - this.x;
            const dy = playerPos.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                this.x += (dx / dist) * this.followSpeed * dt;
                this.y += (dy / dist) * this.followSpeed * dt;
            } else {
                this.toRemove = true; // Collecté
            }
        }

        if (this.animator) {
            this.animator.update(deltaTime, { velocity: { x: 0, y: 0 } });
        }
    }

    draw(ctx) {
        if (this.animator) {
            this.animator.draw(ctx, this.x, this.y);
        } else {
            if (this.type === 'xp') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
                // Dessin d'une étoile pour le butin rare
                this.drawStar(ctx, this.x, this.y, 5, this.radius, this.radius / 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffd700';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }
}

