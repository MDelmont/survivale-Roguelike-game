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
        this.type = 'projectile';
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
                    explosionRadius: (this.stats.explosionRadius || 80) * (owner.stats.explosionRadiusMultiplier || 1.0),
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
        this.type = 'orbital';
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

        const targets = [...(context.enemies || [])];
        if (context.boss) targets.push(context.boss);
        if (context.player && !targets.includes(context.player)) targets.push(context.player);

        this.satellites.forEach((s, index) => {
            const currentAngle = this.masterAngle + (index / this.satellites.length) * Math.PI * 2;
            const sx = owner.x + Math.cos(currentAngle) * radius;
            const sy = owner.y + Math.sin(currentAngle) * radius;

            // Mise à jour de l'animateur du satellite
            if (s.animator) {
                s.animator.update(deltaTime, { velocity: { x: 1, y: 1 } });
            }

            const checkCollision = (e) => {
                const dx = e.x - sx;
                const dy = e.y - sy;
                return Math.sqrt(dx * dx + dy * dy) < (10 + (e.radius || 10));
            };

            targets.forEach(t => {
                if (!t || t === owner) return;
                if (checkCollision(t)) {
                    const baseDamage = (this.stats.damage || 0) * (owner.stats.damageMultiplier || 1.0);
                    const hitDamage = baseDamage * dt * 5;
                    if (hitDamage > 0) t.takeDamage(hitDamage);

                    // Application des effets
                    if (this.stats.isPoisonous && t.applyEffect) {
                        t.applyEffect({
                            type: 'poison',
                            duration: this.stats.poisonDuration || 2000,
                            damagePerTick: this.stats.poisonDamage || 5,
                            tickRate: this.stats.poisonTickRate || 500
                        });
                    }
                    if (this.stats.isSlowing && t.applyEffect) {
                        const slowMagnitude = this.stats.slowMultiplier || 0.4;
                        t.applyEffect({
                            type: 'slowing',
                            duration: 2000,
                            multiplier: 1 - slowMagnitude
                        });
                    }
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
                const drawAngle = this.visuals.directionMode === 'rotate' ? currentAngle + Math.PI / 2 : 0;
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
        this.type = 'area';
        this.animator = visuals ? new Animator(visuals, assetManager) : null;
        this.angle = 0;
    }

    update(deltaTime, owner, context) {
        const baseRange = (this.stats.range !== undefined) ? this.stats.range : 100;
        const range = baseRange * (owner.stats.rangeMultiplier || 1.0);
        const dt = deltaTime / 1000;

        const targets = [...(context.enemies || [])];
        if (context.boss) targets.push(context.boss);
        // Si context.player est présent et n'est pas déjà dans targets (cas spécifique ennemi)
        if (context.player && !targets.includes(context.player)) targets.push(context.player);

        targets.forEach(t => {
            if (!t || t === owner) return;
            const dx = t.x - owner.x;
            const dy = t.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < range + (t.radius || 10)) {
                // Dégâts continus
                if (this.stats.damage > 0) {
                    const d = (this.stats.damage || 0) * (owner.stats.damageMultiplier || 1.0) * dt;
                    t.takeDamage(d);
                }

                // Application des effets (plus fréquents ou persistants en AOE)
                // On met une durée courte car on est dans la zone
                if (this.stats.isPoisonous && t.applyEffect) {
                    t.applyEffect({
                        type: 'poison',
                        duration: 1000,
                        damagePerTick: this.stats.poisonDamage || 5,
                        tickRate: this.stats.poisonTickRate || 500
                    });
                }
                if (this.stats.isSlowing && t.applyEffect) {
                    const slowMagnitude = this.stats.slowMultiplier || 0.4;
                    t.applyEffect({
                        type: 'slowing',
                        duration: 1000,
                        multiplier: 1 - slowMagnitude
                    });
                }
            }
        });

        if (this.animator) {
            this.animator.update(deltaTime, { velocity: { x: 0, y: 0 } });
        }

        // Mise à jour de la rotation interne si configurée
        if (this.visuals && this.visuals.auraRotationSpeed) {
            this.angle += (this.visuals.auraRotationSpeed * Math.PI * 2) * dt;
        }
    }

    draw(ctx, owner) {
        let range = (this.stats.range !== undefined ? this.stats.range : 100) * (owner.stats.rangeMultiplier || 1.0);

        // Effet de pulsation de taille (visuel uniquement)
        if (this.visuals && this.visuals.auraPulseSize) {
            range *= (0.95 + Math.sin(Date.now() / 300) * 0.05);
        }

        // On dessine l'animateur si il existe ET qu'il a des images
        let hasSprite = false;
        if (this.animator) {
            const currentAnim = this.animator.getAnimation(this.animator.currentState);
            if (currentAnim && currentAnim.frames && currentAnim.frames.length > 0) {
                hasSprite = true;
            }
        }

        if (hasSprite) {
            ctx.save();

            // Effet de clignotement / pulsation d'opacité
            if (this.visuals && this.visuals.auraPulseAlpha) {
                const speed = this.visuals.auraAlphaSpeed || 200;
                const min = this.visuals.auraAlphaMin !== undefined ? this.visuals.auraAlphaMin : 0.2;
                const max = this.visuals.auraAlphaMax !== undefined ? this.visuals.auraAlphaMax : 1.0;
                const range = max - min;
                const mid = min + range / 2;
                const amplitude = range / 2;

                ctx.globalAlpha = mid + Math.sin(Date.now() / speed) * amplitude;
            }

            // On force la taille de l'animateur pour qu'elle corresponde exactement au diamètre de la zone (range * 2)
            // On passe l'angle de rotation interne
            this.animator.draw(ctx, owner.x, owner.y, this.angle, { width: range * 2, height: range * 2 });

            ctx.restore();
        } else {
            // Dessin du cercle de secours si pas de sprite
            ctx.save();
            ctx.beginPath();
            ctx.arc(owner.x, owner.y, range, 0, Math.PI * 2);
            const alpha = 0.1 + Math.sin(Date.now() / 200) * 0.05;

            if (this.stats.isPoisonous) {
                ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            } else if (this.stats.isSlowing) {
                ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`;
                ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            }

            ctx.fill();
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
    }
}

