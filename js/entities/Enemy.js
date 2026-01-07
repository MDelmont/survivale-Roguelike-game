import { Animator } from './Animator.js';
import { WeaponFactory } from '../systems/WeaponFactory.js';

/**
 * Enemy Class
 * Gère le comportement, les stats et l'affichage des ennemis.
 */
export class Enemy {
    constructor(x, y, stats, assetManager) {
        this.x = x;
        this.y = y;
        this.stats = stats || { hp: 10, speed: 100, radius: 10, color: '#f00' };
        this.radius = this.stats.radius || 15;
        this.hp = this.stats.hp || 20;
        this.speed = (this.stats.speed !== undefined) ? this.stats.speed : 100;
        this.damage = this.stats.damage || 5;
        this.xpValue = this.stats.xpValue || 10;
        this.color = this.stats.color || '#f00'; // Rouge par défaut
        this.toRemove = false;

        this.activeEffects = []; // Pour le poison, etc.
        this.originalColor = this.color;
        
        // Système d'animation data-driven
        this.visuals = stats.visuals;
        this.animator = this.visuals ? new Animator(this.visuals, assetManager) : null;
        this.velocity = { x: 0, y: 0 };
        this.angle = 0;
        this.isHurt = false;

        // Arme de l'ennemi
        this.weapon = null;
        if (this.stats.weapon_id) {
            // WeaponFactory aura besoin des données de l'arme. 
            // On s'attend à ce que l'appelant les fournisse ou qu'on y ait accès.
            // Pour l'instant, on laisse l'initialisation à Game ou une méthode dédiée.
        }
    }

    update(deltaTime, playerPos, context = {}, forceState = null) {
        const dt = deltaTime / 1000;

        // Gestion des effets (Poison, Ralentissement, etc.)
        let speedMultiplier = 1.0;
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.duration -= deltaTime;

            // Logique spécifique par type d'effet
            if (effect.type === 'poison') {
                effect.tickTimer = (effect.tickTimer || 0) + deltaTime;
                const tickRate = effect.tickRate || 500;
                if (effect.tickTimer >= tickRate) {
                    this.takeDamage(effect.damagePerTick);
                    effect.tickTimer = 0;
                }
            } else if (effect.type === 'slowing') {
                speedMultiplier = Math.min(speedMultiplier, effect.multiplier || 0.5);
            }

            if (effect.duration <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }

        // Comportement simple : foncer vers le joueur
        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.velocity.x = (dx / dist) * (this.speed * speedMultiplier);
            this.velocity.y = (dy / dist) * (this.speed * speedMultiplier);
            this.angle = Math.atan2(this.velocity.y, this.velocity.x);
            
            this.x += this.velocity.x * dt;
            this.y += this.velocity.y * dt;
        }

        // Mise à jour de l'arme
        if (this.weapon) {
            const targetDir = dist > 0 ? { dx: dx / dist, dy: dy / dist } : { dx: 1, dy: 0 };
            this.weapon.update(deltaTime, this, {
                targetDir: targetDir,
                onShoot: (x, y, dx, dy, stats) => context.onEnemyShoot(x, y, dx, dy, stats),
                enemies: [playerPos], // L'ennemi voit le joueur comme sa cible
                player: playerPos
            });
        }

        // Mise à jour de l'animateur
        if (this.animator) {
            this.animator.update(deltaTime, {
                velocity: this.velocity,
                isHurt: this.isHurt,
                forceState: forceState
            });
            this.isHurt = false;
        }

        if (this.hp <= 0) {
            this.toRemove = true;
        }
    }

    drawAuras(ctx) {
        if (this.weapon && this.weapon.type === 'area') {
            this.weapon.draw(ctx, this);
        }
    }

    draw(ctx) {
        if (this.weapon && this.weapon.type !== 'area') {
            this.weapon.draw(ctx, this);
        }

        if (this.animator) {
            this.animator.draw(ctx, this.x, this.y, this.angle);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

            // Indicateur visuel si empoisonné
            if (this.activeEffects.some(e => e.type === 'poison')) {
                ctx.fillStyle = '#0f0';
            } else if (this.activeEffects.some(e => e.type === 'slowing')) {
                ctx.fillStyle = '#0ff';
            } else {
                ctx.fillStyle = this.color;
            }

            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Barre de vie au-dessus de la tête
        if (this.hp < (this.stats.hp || 20)) {
            this.drawHealthBar(ctx);
        }
    }

    drawHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 8;

        // Fond (gris foncé)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Vie (rouge -> vert en dégradé ou couleur fixe)
        const ratio = Math.max(0, this.hp / (this.stats.hp || 20));
        ctx.fillStyle = ratio > 0.5 ? '#0f0' : (ratio > 0.25 ? '#ff0' : '#f00');
        ctx.fillRect(x, y, barWidth * ratio, barHeight);

        // Bordure
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.isHurt = true;
        
        if (!this.animator) {
            // Feedback visuel de dégâts (fallback)
            this.color = '#fff'; 
            setTimeout(() => {
                this.color = this.originalColor;
            }, 50);
        }
    }

    applyEffect(effect) {
        // Évite de cumuler le même poison, on reset juste la durée et les stats
        const existing = this.activeEffects.find(e => e.type === effect.type);
        if (existing) {
            existing.duration = Math.max(existing.duration, effect.duration);
            // On met à jour les stats au cas où l'aura est plus forte que le poison précédent
            if (effect.damagePerTick !== undefined) existing.damagePerTick = effect.damagePerTick;
            if (effect.tickRate !== undefined) existing.tickRate = effect.tickRate;
            if (effect.multiplier !== undefined) existing.multiplier = effect.multiplier;
        } else {
            this.activeEffects.push({ ...effect, tickTimer: 0 });
        }
    }
}

