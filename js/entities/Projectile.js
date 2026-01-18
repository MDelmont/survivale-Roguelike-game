import { CombatSystem } from '../systems/CombatSystem.js';
import { Animator } from './Animator.js';

/**
 * Projectile Class
 * Gère le mouvement et ses propres conséquences d'impact.
 */
export class Projectile {
    constructor(x, y, dx, dy, stats, assetManager) {
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

        // Système d'animation data-driven
        this.visuals = stats.visuals;
        this.animator = this.visuals ? new Animator(this.visuals, assetManager) : null;
        this.velocity = { x: this.dx * this.speed, y: this.dy * this.speed };
        this.angle = Math.atan2(this.dy, this.dx);
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
            const slowMagnitude = this.stats.slowMultiplier || 0.4;
            target.applyEffect({ type: 'slowing', duration: 2000, multiplier: 1 - slowMagnitude });
        }

        // Effet d'explosion (AOE)
        if (this.isExplosive && combatContext) {
            const effects = [];

            if (this.isPoisonous) {
                effects.push({
                    type: 'poison',
                    duration: this.stats.poisonDuration || 3000,
                    damagePerTick: this.stats.poisonDamage || this.damage * 0.2,
                    tickRate: this.stats.poisonTickRate || 500
                });
            }

            if (this.stats.isSlowing) {
                const slowMagnitude = this.stats.slowMultiplier || 0.4;
                effects.push({
                    type: 'slowing',
                    duration: 2000,
                    multiplier: 1 - slowMagnitude
                });
            }

            CombatSystem.handleAOE({
                x: this.x,
                y: this.y,
                radius: this.stats.explosionRadius || 80,
                damage: this.damage * (this.stats.explosionDamageMultiplier || 0.5),
                enemies: combatContext.enemies,
                boss: combatContext.boss,
                explosions: combatContext.explosions,
                effects: effects,
                visuals: this.stats.explosionVisuals || null // Utilise les visuels d'explosion spécifiques si définis
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

        if (this.animator) {
            this.animator.update(deltaTime, {
                velocity: this.velocity
            });
        }
    }

    draw(ctx) {
        if (this.animator) {
            this.animator.draw(ctx, this.x, this.y, this.angle);
        } else {
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

