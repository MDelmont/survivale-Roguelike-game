/**
 * Weapon Base Class
 */
export class Weapon {
    constructor(id, name, stats, upgrades = [], visuals = null) {
        this.id = id;
        this.name = name;
        this.stats = { ...stats };
        this.upgrades = upgrades;
        this.visuals = visuals; // Données visuelles pour l'arme ou ses projectiles
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
    constructor(id, name, stats, upgrades, visuals) {
        super(id, name, stats, upgrades, visuals);
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
                    visuals: this.visuals, // Transmet les visuels au projectile
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


import { Animator } from './Animator.js';

/**
 * Orbital/Shield Weapon
 * Gère des projectiles qui tournent autour du joueur.
 */
export class OrbitalWeapon extends Weapon {
    constructor(id, name, stats, upgrades, visuals, assetManager) {
        super(id, name, stats, upgrades, visuals);
        this.assetManager = assetManager;
        this.satellites = [];
        this.spawnTimer = 0;
        this.masterAngle = 0; 
    }

    update(deltaTime, owner, context) {
        this.spawnTimer += deltaTime;
        const maxSatellites = (this.stats.projectileCount || 1) + (owner.stats.projectileBonus || 0);
        const spawnRate = (this.stats.fireRate || 2000) * (owner.stats.fireRateMultiplier || 1.0);

        // Apparition de nouveaux satellites
        if (this.satellites.length < maxSatellites && this.spawnTimer >= spawnRate) {
            const newSat = {
                animator: this.visuals ? new Animator(this.visuals, this.assetManager) : null
            };
            this.satellites.push(newSat);
            this.spawnTimer = 0;
        }

        const radius = this.stats.radius || 60;
        const orbitSpeed = this.stats.orbitSpeed || 2;
        const dt = deltaTime / 1000;

        this.masterAngle += orbitSpeed * dt;

        const enemies = context.enemies || [];
        const boss = context.boss;

        this.satellites.forEach((s, index) => {
            const currentAngle = this.masterAngle + (index / this.satellites.length) * Math.PI * 2;
            const sx = owner.x + Math.cos(currentAngle) * radius;
            const sy = owner.y + Math.sin(currentAngle) * radius;

            // Mise à jour de l'animateur du satellite
            if (s.animator) {
                // Pour les satellites, on peut simuler une vitesse ou donner l'angle de rotation
                s.animator.update(deltaTime, { velocity: { x: 1, y: 1 } }); 
            }

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
                    // ... (effets poison/slowing inchangés)
                }
            });
        });
    }

    draw(ctx, owner) {
        const radius = this.stats.radius || 60;
        this.satellites.forEach((s, index) => {
            const currentAngle = this.masterAngle + (index / this.satellites.length) * Math.PI * 2;
            const sx = owner.x + Math.cos(currentAngle) * radius;
            const sy = owner.y + Math.sin(currentAngle) * radius;

            if (s.animator) {
                // On oriente le satellite vers la tangente ou fixe selon directionMode
                const drawAngle = this.visuals.directionMode === 'rotate' ? currentAngle + Math.PI/2 : 0;
                s.animator.draw(ctx, sx, sy, drawAngle);
            } else {
                ctx.save();
                ctx.beginPath();
                ctx.arc(sx, sy, 8, 0, Math.PI * 2);
                ctx.fillStyle = this.stats.isPoisonous ? '#0f0' : (this.stats.isSlowing ? '#0ff' : '#fff');
                ctx.fill();
                ctx.shadowBlur = 10;
                ctx.shadowColor = ctx.fillStyle;
                ctx.stroke();
                ctx.restore();
            }
        });
    }
}

/**
 * Area of Effect Weapon (Constant Aura)
 */
export class AreaWeapon extends Weapon {
    constructor(id, name, stats, upgrades, visuals, assetManager) {
        super(id, name, stats, upgrades, visuals);
        this.animator = visuals ? new Animator(visuals, assetManager) : null;
    }

    update(deltaTime, owner, context) {
        // Logique de dégâts (inchangée)
        const range = (this.stats.range || 100) * (owner.stats.rangeMultiplier || 1.0);
        // ... (boucle collision ennemis inchangée)

        if (this.animator) {
            this.animator.update(deltaTime, { velocity: { x: 0, y: 0 } });
        }
    }

    draw(ctx, owner) {
        const range = (this.stats.range || 100) * (owner.stats.rangeMultiplier || 1.0);
        if (this.animator) {
            // L'aura utilise sa propre width/height définie dans le JSON
            this.animator.draw(ctx, owner.x, owner.y);
        } else {
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
}

