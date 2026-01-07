import { Animator } from './Animator.js';

/**
 * Player Class
 * Gère l'affichage, le mouvement et les stats du joueur.
 */
export class Player {
    constructor(x, y, stats, assetManager) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.stats = {
            speed: stats.speed || 200,
            hp: stats.hp || 100,
            maxHp: stats.hp || 100,
            xp: 0,
            level: 1,
            xpNextLevel: 50,
            pickupRadius: 100,
            // Stats globales pouvant influencer les armes
            fireRateMultiplier: 1.0,
            damageMultiplier: 1.0,
            projectileBonus: 0,
            rangeMultiplier: 1.0,
            piercingBonus: 0
        };

        this.color = '#0af';
        this.originalColor = '#0af';
        this.lastShootDir = { dx: 0, dy: -1 };

        // Système d'animation data-driven
        this.visuals = stats.visuals;
        this.animator = this.visuals ? new Animator(this.visuals, assetManager) : null;
        this.velocity = { x: 0, y: 0 };
        this.isHurt = false;

        // Système d'armes (Arsenal)
        this.weapons = [];

        this.pendingUpgrade = false;
        this.pendingWeaponUpgrade = false;

        this.activeEffects = []; // Système d'états décentralisé
    }

    /**
     * Applique un effet de statut (Poison, etc.)
     */
    applyEffect(effect) {
        const existing = this.activeEffects.find(e => e.type === effect.type);
        if (existing) {
            existing.duration = Math.max(existing.duration, effect.duration);
            if (effect.damagePerTick !== undefined) existing.damagePerTick = effect.damagePerTick;
            if (effect.tickRate !== undefined) existing.tickRate = effect.tickRate;
            if (effect.multiplier !== undefined) existing.multiplier = effect.multiplier;
        } else {
            this.activeEffects.push({ ...effect, tickTimer: 0 });
        }
    }

    /**
     * Ajoute une nouvelle arme à l'arsenal ou l'ignore si déjà présente.
     */
    addWeapon(weaponInstance) {
        if (!weaponInstance) return;
        const exists = this.weapons.find(w => w.id === weaponInstance.id);
        if (!exists) {
            this.weapons.push(weaponInstance);
            console.log(`Nouvelle arme ajoutée : ${weaponInstance.name}`);
        }
    }

    addXP(amount) {
        this.stats.xp += amount;
        if (this.stats.xp >= this.stats.xpNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.stats.level++;
        this.stats.xp -= this.stats.xpNextLevel;
        this.stats.xpNextLevel = Math.floor(this.stats.xpNextLevel * 1.5);
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 20);
        this.pendingUpgrade = true;
    }

    update(deltaTime, movement, combatContext) {
        // Gestion des effets de statut
        let speedMultiplier = 1.0;
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.duration -= deltaTime;

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

        const dt = deltaTime / 1000;
        this.velocity.x = movement.dx * (this.stats.speed * speedMultiplier);
        this.velocity.y = movement.dy * (this.stats.speed * speedMultiplier);
        
        // Mise à jour de l'angle si le joueur bouge
        if (movement.dx !== 0 || movement.dy !== 0) {
            this.angle = Math.atan2(movement.dy, movement.dx);
        }
        
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        if (combatContext.targetDir) {
            this.lastShootDir = combatContext.targetDir;
            // Si on ne bouge pas, on s'oriente vers la cible de tir
            if (movement.dx === 0 && movement.dy === 0) {
                this.angle = Math.atan2(this.lastShootDir.dy, this.lastShootDir.dx);
            }
        }

        // Mise à jour de l'animateur
        if (this.animator) {
            this.animator.update(deltaTime, {
                velocity: this.velocity,
                isHurt: this.isHurt
            });
            this.isHurt = false; // Reset après lecture par l'animator
        }

        // Mise à jour de TOUTES les armes de l'arsenal
        this.weapons.forEach(w => {
            w.update(deltaTime, this, {
                ...combatContext,
                targetDir: this.lastShootDir
            });
        });
    }

    drawAuras(ctx) {
        // Dessine UNIQUEMENT les auras (couche la plus basse)
        this.weapons.filter(w => w.type === 'area').forEach(w => {
            w.draw(ctx, this);
        });
    }

    draw(ctx) {
        // Rendu visuel des armes orbitales/satellites (en dessous du joueur mais au dessus des auras)
        this.weapons.filter(w => w.type !== 'area').forEach(w => {
            w.draw(ctx, this);
        });

        if (this.animator) {
            // Rendu Data-Driven - Passage de l'angle calculé
            this.animator.draw(ctx, this.x, this.y, this.angle || 0);
        } else {
            // Rendu de secours (Fallback)
            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

            if (this.activeEffects.some(e => e.type === 'poison')) {
                ctx.fillStyle = '#0f0';
            } else if (this.activeEffects.some(e => e.type === 'slowing')) {
                ctx.fillStyle = '#0ff';
            } else {
                ctx.fillStyle = this.color;
            }

            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    }

    takeDamage(amount) {
        this.stats.hp -= amount;
        if (this.stats.hp < 0) this.stats.hp = 0;
        this.isHurt = true;
        
        // Flash rouge de secours si pas d'animator
        if (!this.animator) {
            this.color = '#f00';
            setTimeout(() => {
                this.color = this.originalColor;
            }, 100);
        }
    }
}

