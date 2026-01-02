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
            fireRate: stats.fireRate || 500,
            damage: stats.damage || 10,
            projectileSpeed: stats.projectileSpeed || 400,
            xp: 0,
            level: 1,
            xpNextLevel: 50,
            pickupRadius: 100
        };

        this.shotTimer = 0;
        this.color = '#0af';
        this.originalColor = '#0af';
        this.lastShootDir = { dx: 0, dy: -1 };

        // Système d'armes
        this.currentWeapon = null;
        this.weaponLevel = 1;
        this.weaponStats = {}; // Fusion de stats de base de l'arme + bonus de niveau

        this.pendingUpgrade = false;
        this.pendingWeaponUpgrade = false;
    }

    setWeapon(weaponData) {
        this.currentWeapon = weaponData;
        this.weaponLevel = 1;
        this.updateWeaponStats();
    }

    updateWeaponStats() {
        if (!this.currentWeapon) return;

        // On repart des stats de base
        const newStats = { ...this.currentWeapon.stats };

        // On applique les upgrades accumulées jusqu'au niveau actuel
        for (let i = 0; i < this.weaponLevel - 1; i++) {
            const upgrade = this.currentWeapon.upgrades[i];
            if (upgrade && upgrade.stats) {
                for (const stat in upgrade.stats) {
                    if (stat === 'fireRate' || stat === 'damage' || stat === 'projectileSpeed' || stat === 'projectileCount') {
                        newStats[stat] = (newStats[stat] || 0) + upgrade.stats[stat];
                    }
                }
            }
        }
        this.weaponStats = newStats;
    }

    upgradeWeapon() {
        if (!this.currentWeapon) return;
        if (this.weaponLevel < this.currentWeapon.upgrades.length + 1) {
            this.weaponLevel++;
            this.updateWeaponStats();
            console.log(`Arme améliorée niveau ${this.weaponLevel} : ${this.currentWeapon.name}`);
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

    update(deltaTime, movement, onShoot, targetDir = null) {
        const dt = deltaTime / 1000;
        this.x += movement.dx * this.stats.speed * dt;
        this.y += movement.dy * this.stats.speed * dt;

        if (targetDir) {
            this.lastShootDir = targetDir;
        }

        // Tir automatique basé sur l'arme équipée
        if (this.currentWeapon && this.currentWeapon.type === 'attack') {
            const fireInterval = this.weaponStats.fireRate || this.stats.fireRate;
            this.shotTimer += deltaTime;

            if (this.shotTimer >= fireInterval) {
                this.shotTimer = 0;
                if (onShoot) {
                    const count = this.weaponStats.projectileCount || 1;
                    if (count > 1) {
                        const spread = 20;
                        const perpX = -this.lastShootDir.dy;
                        const perpY = this.lastShootDir.dx;
                        for (let i = 0; i < count; i++) {
                            const offset = (i - (count - 1) / 2) * spread;
                            onShoot(
                                this.x + perpX * offset,
                                this.y + perpY * offset,
                                this.lastShootDir.dx,
                                this.lastShootDir.dy,
                                this.weaponStats
                            );
                        }
                    } else {
                        onShoot(this.x, this.y, this.lastShootDir.dx, this.lastShootDir.dy, this.weaponStats);
                    }
                }
            }
        }

        // Gestion des autres types d'armes (Bouclier, AOE) à venir dans Game.js/update
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Corps du joueur
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rendu visuel spécifique à l'arme (Bouclier)
        if (this.currentWeapon && this.currentWeapon.type === 'defense') {
            const radius = this.weaponStats.radius || 60;
            const orbitSpeed = this.weaponStats.orbitSpeed || 2;
            const time = Date.now() / 1000;
            const angle = time * orbitSpeed;

            ctx.beginPath();
            ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }

        ctx.restore();
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
