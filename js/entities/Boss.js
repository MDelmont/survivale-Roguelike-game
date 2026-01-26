import { Enemy } from './Enemy.js';

/**
 * Boss Class
 * Hérite d'Enemy mais avec des comportements plus complexes et beaucoup plus de PV.
 */
export class Boss extends Enemy {
    constructor(x, y, stats, assetManager) {
        super(x, y, stats, assetManager);
        this.radius = stats.radius || 60;
        this.isBoss = true;
        this.shootTimer = 0;
        this.fireRate = stats.fireRate || 2000;
        this.pattern = stats.attackPattern || 'circle';
        this.movePattern = stats.movePattern || 'constant';
        this.angle = 0;
        this.time = 0;

        // Variables pour le mouvement Rush
        this.rushTimer = 0;
        this.isRushing = false;
        this.rushTarget = null;

        // Variables pour le mouvement Stalker
        this.stalkerTimer = 0;
        this.stalkerState = 'moving'; // 'moving' ou 'paused'
        this.stalkerMoveDuration = 3000; // 3 secondes de mouvement
        this.stalkerPauseDuration = 1500; // 1.5 secondes de pause

        // Phase de comportement (optionnel pour MVP)
        this.behaviorPhase = 0;
    }

    update(deltaTime, player, onShoot, forceState = null) {
        // Logique de mouvement spécifique
        this.handleMovement(deltaTime, player);

        this.time += deltaTime;

        // Logique de tir
        this.shootTimer += deltaTime;

        // Ajustement du fireRate pour les patterns continus ou rapides
        const fastPatterns = ['spiral', 'vortex', 'double_spiral', 'wave_spray', 'barrage', 'oscillator', 'web'];
        const targetRate = fastPatterns.includes(this.pattern) ? 50 : this.fireRate;

        if (this.shootTimer >= targetRate) {
            this.shootTimer = 0;
            if (onShoot) {
                this.executePattern(onShoot, player);
            }
        }

        // Mise à jour de l'arme équipée (si existante)
        if (this.weapon && player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const targetDir = dist > 0 ? { dx: dx / dist, dy: dy / dist } : { dx: 1, dy: 0 };

            this.weapon.update(deltaTime, this, {
                targetDir: targetDir,
                onShoot: (x, y, dx, dy, stats) => onShoot(x, y, dx, dy, stats),
                enemies: [player],
                player: player
            });
        }

        // Mise à jour de l'animateur (héritée d'Enemy)
        if (this.animator) {
            this.animator.update(deltaTime, {
                velocity: this.velocity,
                isHurt: this.isHurt,
                forceState: forceState
            });
            this.isHurt = false;
        }
    }

    handleMovement(deltaTime, player) {
        const dt = deltaTime / 1000;

        switch (this.movePattern) {
            case 'fixed':
                // Ne bouge pas une fois arrivé à l'écran (y=100)
                if (this.y < 100) {
                    this.velocity.y = this.speed;
                    this.y += this.velocity.y * dt;
                } else {
                    this.velocity.y = 0;
                }
                this.velocity.x = 0;
                break;

            case 'constant':
                // Suit lentement le joueur (comportement par défaut hérité)
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 5) {
                        this.velocity.x = (dx / dist) * this.speed;
                        this.velocity.y = (dy / dist) * this.speed;
                        this.x += this.velocity.x * dt;
                        this.y += this.velocity.y * dt;
                    } else {
                        this.velocity.x = 0;
                        this.velocity.y = 0;
                    }
                }
                break;

            case 'stalker':
                if (player) {
                    this.stalkerTimer += deltaTime;

                    if (this.stalkerState === 'moving') {
                        if (this.stalkerTimer >= this.stalkerMoveDuration) {
                            this.stalkerState = 'paused';
                            this.stalkerTimer = 0;
                            this.velocity.x = 0;
                            this.velocity.y = 0;
                        } else {
                            const dx = player.x - this.x;
                            const dy = player.y - this.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist > 5) {
                                this.velocity.x = (dx / dist) * this.speed;
                                this.velocity.y = (dy / dist) * this.speed;
                                this.x += this.velocity.x * dt;
                                this.y += this.velocity.y * dt;
                            } else {
                                this.velocity.x = 0;
                                this.velocity.y = 0;
                            }
                        }
                    } else if (this.stalkerState === 'paused') {
                        if (this.stalkerTimer >= this.stalkerPauseDuration) {
                            this.stalkerState = 'moving';
                            this.stalkerTimer = 0;
                        }
                        // Flottement léger pendant la pause
                        this.y += Math.sin(this.time / 500) * 0.5;
                        this.velocity.x = 0;
                        this.velocity.y = 0;
                    }
                }
                break;

            case 'rush':
                if (player) {
                    this.rushTimer += deltaTime;
                    if (!this.isRushing && this.rushTimer > 2000) {
                        // Prépare une charge
                        this.isRushing = true;
                        this.rushTimer = 0;
                        this.rushTarget = { x: player.x, y: player.y };
                    }

                    if (this.isRushing) {
                        const dx = this.rushTarget.x - this.x;
                        const dy = this.rushTarget.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const rushSpeed = this.speed * 4;

                        if (dist > 10) {
                            this.velocity.x = (dx / dist) * rushSpeed;
                            this.velocity.y = (dy / dist) * rushSpeed;
                            this.x += this.velocity.x * dt;
                            this.y += this.velocity.y * dt;
                        } else {
                            this.isRushing = false;
                            this.rushTimer = 0; // Pause après la charge
                            this.velocity.x = 0;
                            this.velocity.y = 0;
                        }
                    } else {
                        // Flotte légèrement en attendant la prochaine charge
                        // On met la vélocité à 0 pour que l'animateur joue l'animation 'idle'
                        this.velocity.x = 0;
                        this.velocity.y = 0;

                        // Petit mouvement de flottement purement positionnel (ignoré par l'animateur)
                        this.y += Math.sin(this.time / 500) * 0.5;
                    }
                }
                break;
        }
    }

    executePattern(onShoot, player) {
        const stats = this.getProjectileStats();
        switch (this.pattern) {
            case 'melee':
            case 'none':
                // Pas de tir, c'est le corps à corps qui compte
                break;
            case 'circle': this.shootCircle(onShoot, stats); break;
            case 'spiral': this.shootSpiral(onShoot, stats); break;
            case 'double_spiral': this.shootDoubleSpiral(onShoot, stats); break;
            case 'spray': this.shootSpray(onShoot, player, stats); break;
            case 'wave_spray': this.shootWaveSpray(onShoot, player, stats); break;
            case 'cross': this.shootCross(onShoot, stats); break;
            case 'vortex': this.shootVortex(onShoot, stats); break;
            case 'flower': this.shootFlower(onShoot, stats); break;
            case 'barrage': this.shootBarrage(onShoot, stats); break;
            case 'star': this.shootStar(onShoot, stats); break;
            case 'oscillator': this.shootOscillator(onShoot, stats); break;
            case 'wall': this.shootWall(onShoot, stats); break;
            case 'web': this.shootWeb(onShoot, stats); break;
            default: this.shootCircle(onShoot, stats);
        }
    }

    getProjectileStats(extraStats = {}) {
        const stats = {
            damage: this.damage,
            projectileSpeed: 200,
            radius: this.stats.projectileRadius, // Support pour le rayon personnalisé
            color: this.color || '#f00',
            ...extraStats
        };
        if (this.stats.projectileVisuals) {
            stats.visuals = this.stats.projectileVisuals;
        }
        return stats;
    }

    shootCircle(onShoot, stats) {
        const bulletCount = 12;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(angle), Math.sin(angle), stats);
        }
    }

    shootSpiral(onShoot, stats) {
        this.angle += 0.2;
        onShoot(this.x, this.y, Math.cos(this.angle), Math.sin(this.angle), stats);
        onShoot(this.x, this.y, Math.cos(this.angle + Math.PI), Math.sin(this.angle + Math.PI), stats);
    }

    shootDoubleSpiral(onShoot, stats) {
        this.angle += 0.15;
        onShoot(this.x, this.y, Math.cos(this.angle), Math.sin(this.angle), stats);
        onShoot(this.x, this.y, Math.cos(-this.angle), Math.sin(-this.angle), stats);
    }

    shootSpray(onShoot, player, stats) {
        if (!player) return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        const count = 5;
        const spread = 0.5;
        for (let i = 0; i < count; i++) {
            const a = baseAngle - spread / 2 + (i / (count - 1)) * spread;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), stats);
        }
    }

    shootWaveSpray(onShoot, player, stats) {
        if (!player) return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        const wave = Math.sin(this.time / 200) * 0.8;
        onShoot(this.x, this.y, Math.cos(baseAngle + wave), Math.sin(baseAngle + wave), stats);
    }

    shootCross(onShoot, stats) {
        const a = (Math.floor(this.time / 1000) % 2 === 0) ? 0 : Math.PI / 4;
        for (let i = 0; i < 4; i++) {
            const ang = a + (i / 4) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(ang), Math.sin(ang), stats);
        }
    }

    shootVortex(onShoot, stats) {
        const count = 3;
        this.angle += 0.5;
        for (let i = 0; i < count; i++) {
            const a = this.angle + (i / count) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { ...stats, projectileSpeed: 150 });
        }
    }

    shootFlower(onShoot, stats) {
        const petals = 8;
        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { ...stats, projectileSpeed: 200 });
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { ...stats, projectileSpeed: 350 });
        }
    }

    shootBarrage(onShoot, stats) {
        for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 300;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { ...stats, projectileSpeed: speed });
        }
    }

    shootStar(onShoot, stats) {
        const branches = 5;
        const perBranch = 4;
        for (let i = 0; i < branches; i++) {
            const baseA = (i / branches) * Math.PI * 2;
            for (let j = 0; j < perBranch; j++) {
                onShoot(this.x, this.y, Math.cos(baseA), Math.sin(baseA), { ...stats, projectileSpeed: 150 + j * 60 });
            }
        }
    }

    shootOscillator(onShoot, stats) {
        const count = 4;
        for (let i = 0; i < count; i++) {
            const baseA = (i / count) * Math.PI * 2;
            const offset = Math.sin(this.time / 500) * 0.8;
            onShoot(this.x, this.y, Math.cos(baseA + offset), Math.sin(baseA + offset), stats);
        }
    }

    shootWall(onShoot, stats) {
        const count = 12;
        const spacing = 40;
        const isVertical = (Math.floor(this.time / this.fireRate) % 2 === 0);

        for (let i = 0; i < count; i++) {
            const offset = (i - count / 2) * spacing;
            if (isVertical) {
                onShoot(this.x + offset, this.y, 0, 1, { ...stats, projectileSpeed: 180 });
            } else {
                onShoot(this.x, this.y + offset, 1, 0, { ...stats, projectileSpeed: 180 });
            }
        }
    }

    shootWeb(onShoot, stats) {
        this.angle += 0.3;
        const speed = 150 + Math.sin(this.angle * 2) * 70;
        onShoot(this.x, this.y, Math.cos(this.angle), Math.sin(this.angle), { ...stats, projectileSpeed: speed });
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
            // Cercle plus imposant (fallback)
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }

        // Barre de vie spécifique au Boss
        this.drawBossHealthBar(ctx);
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
