/**
 * Weapon Base Class
 */
export class Weapon {
    constructor(id, name, stats, upgrades = []) {
        this.id = id;
        this.name = name;
        this.stats = { ...stats };
        this.upgrades = upgrades;
        this.level = 1;
        this.shotTimer = 0;
    }

    upgrade() {
        if (this.level < this.upgrades.length + 1) {
            const upgrade = this.upgrades[this.level - 1];
            if (upgrade && upgrade.stats) {
                for (const stat in upgrade.stats) {
                    const value = upgrade.stats[stat];
                    if (typeof value === 'number') {
                        this.stats[stat] = (this.stats[stat] || 0) + value;
                    } else {
                        // Pour les boeux, strings ou objets, on remplace
                        this.stats[stat] = value;
                    }
                }
            }
            this.level++;
            console.log(`${this.name} amélioré au niveau ${this.level}`);
            return true;
        }
        return false;
    }

    update(deltaTime, owner, context) {
        this.shotTimer += deltaTime;
    }

    draw(ctx, owner) { }
}

/**
 * Projectile-based Weapon
 */
export class ProjectileWeapon extends Weapon {
    constructor(id, name, stats, upgrades) {
        super(id, name, stats, upgrades);
    }

    update(deltaTime, owner, context) {
        super.update(deltaTime, owner, context);

        const fireRate = (this.stats.fireRate || 500) * (owner.stats.fireRateMultiplier || 1.0);
        if (this.shotTimer >= fireRate) {
            this.shotTimer = 0;
            if (context.onShoot && context.targetDir) {
                const count = (this.stats.projectileCount || 1) + (owner.stats.projectileBonus || 0);
                const weaponStats = {
                    ...this.stats,
                    damage: (this.stats.damage || 10) * (owner.stats.damageMultiplier || 1.0),
                    piercingCount: (this.stats.piercingCount || 0) + (owner.stats.piercingBonus || 0)
                };
                const spread = 20;
                const perpX = -context.targetDir.dy;
                const perpY = context.targetDir.dx;

                for (let i = 0; i < count; i++) {
                    const offset = (i - (count - 1) / 2) * spread;
                    context.onShoot(
                        owner.x + perpX * offset,
                        owner.y + perpY * offset,
                        context.targetDir.dx,
                        context.targetDir.dy,
                        weaponStats
                    );
                }
            }
        }
    }
}

/**
 * Orbital/Shield Weapon
 * Gère des projectiles qui tournent autour du joueur.
 */
export class OrbitalWeapon extends Weapon {
    constructor(id, name, stats, upgrades) {
        super(id, name, stats, upgrades);
        this.satellites = [];
        this.spawnTimer = 0;
        this.masterAngle = 0; // Angle commun pour tous les satellites
    }

    update(deltaTime, owner, context) {
        this.spawnTimer += deltaTime;
        const maxSatellites = (this.stats.projectileCount || 1) + (owner.stats.projectileBonus || 0);
        const spawnRate = (this.stats.fireRate || 2000) * (owner.stats.fireRateMultiplier || 1.0);

        // Apparition régulière de nouveaux satellites
        if (this.satellites.length < maxSatellites && this.spawnTimer >= spawnRate) {
            this.satellites.push({}); // Simple jeton, plus besoin d'angle individuel
            this.spawnTimer = 0;
        }

        const radius = this.stats.radius || 60;
        const orbitSpeed = this.stats.orbitSpeed || 2;
        const dt = deltaTime / 1000;

        this.masterAngle += orbitSpeed * dt; // Mise à jour de l'angle maître

        const enemies = context.enemies || [];
        const boss = context.boss;

        this.satellites.forEach((s, index) => {
            // Répartition équitable basée sur l'angle maître et l'index
            const currentAngle = this.masterAngle + (index / this.satellites.length) * Math.PI * 2;
            const sx = owner.x + Math.cos(currentAngle) * radius;
            const sy = owner.y + Math.sin(currentAngle) * radius;

            // Collision avec ennemis
            const checkCollision = (e) => {
                const dx = e.x - sx;
                const dy = e.y - sy;
                return Math.sqrt(dx * dx + dy * dy) < (10 + e.radius);
            };

            enemies.forEach(e => {
                if (checkCollision(e)) {
                    const baseDamage = (this.stats.damage || 0) * (owner.stats.damageMultiplier || 1.0);
                    const hitDamage = baseDamage * dt * 5;
                    if (hitDamage > 0) e.takeDamage(hitDamage);

                    if (this.stats.isPoisonous) {
                        e.applyEffect({
                            type: 'poison',
                            duration: this.stats.poisonDuration || 2000,
                            damagePerTick: this.stats.poisonDamage || (this.stats.damage ? this.stats.damage * 0.2 : 2),
                            tickRate: this.stats.poisonTickRate || 500
                        });
                    }
                    if (this.stats.isSlowing) {
                        e.applyEffect({
                            type: 'slowing',
                            duration: this.stats.slowDuration || 1000,
                            multiplier: this.stats.slowMultiplier || 0.5
                        });
                    }
                }
            });

            if (boss && checkCollision(boss)) {
                const bossDamage = (this.stats.damage || 0) * dt * 5;
                if (bossDamage > 0) boss.takeDamage(bossDamage);
            }
        });
    }

    draw(ctx, owner) {
        const radius = this.stats.radius || 60;
        ctx.save();
        this.satellites.forEach((s, index) => {
            const currentAngle = this.masterAngle + (index / this.satellites.length) * Math.PI * 2;
            const sx = owner.x + Math.cos(currentAngle) * radius;
            const sy = owner.y + Math.sin(currentAngle) * radius;

            ctx.beginPath();
            ctx.arc(sx, sy, 8, 0, Math.PI * 2);
            ctx.fillStyle = this.stats.isPoisonous ? '#0f0' : (this.stats.isSlowing ? '#0ff' : '#fff');
            ctx.fill();
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.stroke();
        });
        ctx.restore();
    }
}

/**
 * Area of Effect Weapon (Constant Aura)
 */
export class AreaWeapon extends Weapon {
    constructor(id, name, stats, upgrades) {
        super(id, name, stats, upgrades);
    }

    update(deltaTime, owner, context) {
        // L'aura est constante, on applique des dégâts continus
        const range = (this.stats.range || 100) * (owner.stats.rangeMultiplier || 1.0);
        const dt = deltaTime / 1000;
        const damage = (this.stats.damage || 0) * (owner.stats.damageMultiplier || 1.0) * dt;

        const enemies = context.enemies || [];
        const boss = context.boss;

        enemies.forEach(e => {
            const dx = e.x - owner.x;
            const dy = e.y - owner.y;
            if (Math.sqrt(dx * dx + dy * dy) < (range + e.radius)) {
                if (damage > 0) e.takeDamage(damage);

                if (this.stats.isSlowing) {
                    e.applyEffect({
                        type: 'slowing',
                        duration: this.stats.slowDuration || 500,
                        multiplier: this.stats.slowMultiplier || 0.5
                    });
                }
                if (this.stats.isPoisonous) {
                    e.applyEffect({
                        type: 'poison',
                        duration: this.stats.poisonDuration || 1000,
                        damagePerTick: this.stats.poisonDamage || 10,
                        tickRate: this.stats.poisonTickRate || 500
                    });
                }
            }
        });

        if (boss) {
            const dx = boss.x - owner.x;
            const dy = boss.y - owner.y;
            if (Math.sqrt(dx * dx + dy * dy) < (range + boss.radius)) {
                if (damage > 0) boss.takeDamage(damage);
            }
        }
    }

    draw(ctx, owner) {
        const range = (this.stats.range || 100) * (owner.stats.rangeMultiplier || 1.0);
        ctx.save();
        ctx.beginPath();
        ctx.arc(owner.x, owner.y, range, 0, Math.PI * 2);
        const alpha = 0.1 + Math.sin(Date.now() / 200) * 0.05;
        ctx.fillStyle = this.stats.isPoisonous ? `rgba(0, 255, 0, ${alpha})` : `rgba(0, 200, 255, ${alpha})`;
        ctx.fill();
        ctx.strokeStyle = this.stats.isPoisonous ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 200, 255, 0.3)';
        ctx.stroke();
        ctx.restore();
    }
}
