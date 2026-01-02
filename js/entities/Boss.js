import { Enemy } from './Enemy.js';

/**
 * Boss Class
 * Hérite d'Enemy mais avec des comportements plus complexes et beaucoup plus de PV.
 */
export class Boss extends Enemy {
    constructor(x, y, stats) {
        super(x, y, stats);
        this.radius = stats.radius || 60;
        this.isBoss = true;
        this.shootTimer = 0;
        this.fireRate = stats.fireRate || 2000;

        // Phase de comportement (optionnel pour MVP)
        this.behaviorPhase = 0;
    }

    update(deltaTime, playerPos, onShoot) {
        // Mouvement de base (vers le joueur mais plus lent)
        super.update(deltaTime, playerPos);

        // Tir de projectiles de boss (optionnel, mais fun)
        this.shootTimer += deltaTime;
        if (this.shootTimer >= this.fireRate) {
            this.shootTimer = 0;
            if (onShoot) {
                this.shootCircle(onShoot);
            }
        }
    }

    shootCircle(onShoot) {
        const bulletCount = 8;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            // On utilise un tag ou un type différent pour les projectiles ennemis plus tard
            // Pour l'instant on réutilise la logique spawnProjectile de Game.js mais avec une direction calculée
            onShoot(this.x, this.y, dx, dy);
        }
    }

    draw(ctx) {
        // Cercle plus imposant
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Barre de vie spécifique au Boss (Haut de l'écran ou au-dessus)
        this.drawBossHealthBar(ctx);

        ctx.restore();
    }

    drawBossHealthBar(ctx) {
        const barWidth = 300;
        const barHeight = 20;
        const x = ctx.canvas.width / 2 - barWidth / 2;
        const y = 60;

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        const healthRatio = Math.max(0, this.hp / this.stats.hp);
        ctx.fillStyle = '#f0f'; // Pourpre pour le boss
        ctx.fillRect(x, y, barWidth * healthRatio, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.stats.name, ctx.canvas.width / 2, y + 15);
    }
}
