import { CombatSystem } from '../systems/CombatSystem.js';

/**
 * Projectile Class
 * Gère le mouvement et ses propres conséquences d'impact.
 */
export class Projectile {
    constructor(x, y, dx, dy, stats) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.speed = stats.projectileSpeed || stats.speed || 400;
        this.damage = stats.damage || 10;
        this.radius = 5;
        this.color = stats.color || '#ff0';
        this.stats = stats; // Stocker les stats pour les effets étendus (slowing, etc.)
        this.toRemove = false;

        // Propriétés de combat (Scalable)
        this.isExplosive = stats.isExplosive || false;
        this.isPoisonous = stats.isPoisonous || false;
        this.piercingCount = stats.piercingCount || 0;
        this.hitTargets = new Set(); // Registre des ennemis déjà touchés
    }

    /**
     * Gère l'impact sur une cible.
     */
    hit(target, combatContext) {
        // Empêcher de toucher deux fois la même cible (Perçage)
        if (this.hitTargets.has(target)) return;
        this.hitTargets.add(target);

        // Dégâts directs
        target.takeDamage(this.damage);

        // Effet de poison
        if (this.isPoisonous && target.applyEffect) {
            target.applyEffect({
                type: 'poison',
                duration: this.stats.poisonDuration || 3000,
                damagePerTick: this.stats.poisonDamage || this.damage * 0.2,
                tickRate: this.stats.poisonTickRate || 500
            });
        }

        // Effet de ralentissement
        if (this.stats.isSlowing && target.applyEffect) {
            target.applyEffect({ type: 'slowing', duration: 2000, multiplier: this.stats.slowMultiplier || 0.5 });
        }

        // Effet d'explosion (AOE)
        if (this.isExplosive && combatContext) {
            CombatSystem.handleAOE({
                x: this.x,
                y: this.y,
                radius: 80,
                damage: this.damage * 0.5,
                enemies: combatContext.enemies,
                boss: combatContext.boss,
                explosions: combatContext.explosions
            });
        }

        // Gestion de la disparition / perçage
        if (this.piercingCount > 0) {
            this.piercingCount--;
        } else {
            this.toRemove = true;
        }
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.x += this.dx * this.speed * dt;
        this.y += this.dy * this.speed * dt;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isPoisonous) {
            ctx.fillStyle = '#0f0';
        } else if (this.isExplosive) {
            ctx.fillStyle = '#f50';
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.fill();

        if (this.isExplosive || this.isPoisonous) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    isOutOfBounds(width, height) {
        const margin = 50;
        return (
            this.x < -margin ||
            this.x > width + margin ||
            this.y < -margin ||
            this.y > height + margin
        );
    }
}
