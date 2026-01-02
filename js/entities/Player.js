/**
 * Player Class
 * Gère l'affichage, le mouvement et les stats du joueur.
 */
export class Player {
    constructor(x, y, stats) {
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
            damageMultiplier: 1.0
        };

        this.color = '#0af';
        this.originalColor = '#0af';
        this.lastShootDir = { dx: 0, dy: -1 };

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
        this.x += movement.dx * (this.stats.speed * speedMultiplier) * dt;
        this.y += movement.dy * (this.stats.speed * speedMultiplier) * dt;

        if (combatContext.targetDir) {
            this.lastShootDir = combatContext.targetDir;
        }

        // Mise à jour de TOUTES les armes de l'arsenal
        this.weapons.forEach(w => {
            w.update(deltaTime, this, {
                ...combatContext,
                targetDir: this.lastShootDir
            });
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Corps du joueur
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

        // Couleur d'état
        if (this.activeEffects.some(e => e.type === 'poison')) {
            ctx.fillStyle = '#0f0';
        } else if (this.activeEffects.some(e => e.type === 'slowing')) {
            ctx.fillStyle = '#0ff'; // Cyan pour ralentissement
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Rendu visuel de TOUTES les armes
        this.weapons.forEach(w => {
            w.draw(ctx, this);
        });
    }

    takeDamage(amount) {
        this.stats.hp -= amount;
        if (this.stats.hp < 0) this.stats.hp = 0;
        this.color = '#f00';
        setTimeout(() => {
            this.color = this.originalColor;
        }, 100);
    }
}
