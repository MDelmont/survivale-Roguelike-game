import { Enemy } from './Enemy.js';

/**
 * Boss Class
 * Hérite d'Enemy mais avec des comportements plus complexes et beaucoup plus de PV.
 */
export class Boss extends Enemy {
    constructor(x, y, stats) {
        super(x, y, stats);
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

        // Phase de comportement (optionnel pour MVP)
        this.behaviorPhase = 0;
    }

    update(deltaTime, player, onShoot) {
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
    }

    handleMovement(deltaTime, player) {
        const dt = deltaTime / 1000;

        switch (this.movePattern) {
            case 'fixed':
                // Ne bouge pas une fois arrivé à l'écran (y=100)
                if (this.y < 100) this.y += this.speed * dt;
                break;

            case 'constant':
                // Suit lentement le joueur (comportement par défaut hérité)
                if (player) {
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 5) {
                        this.x += (dx / dist) * this.speed * dt;
                        this.y += (dy / dist) * this.speed * dt;
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
                            this.x += (dx / dist) * rushSpeed * dt;
                            this.y += (dy / dist) * rushSpeed * dt;
                        } else {
                            this.isRushing = false;
                            this.rushTimer = 0; // Pause après la charge
                        }
                    } else {
                        // Flotte légèrement en attendant la prochaine charge
                        this.y += Math.sin(this.time / 500) * 0.5;
                    }
                }
                break;
        }
    }

    executePattern(onShoot, player) {
        switch (this.pattern) {
            case 'circle': this.shootCircle(onShoot); break;
            case 'spiral': this.shootSpiral(onShoot); break;
            case 'double_spiral': this.shootDoubleSpiral(onShoot); break;
            case 'spray': this.shootSpray(onShoot, player); break;
            case 'wave_spray': this.shootWaveSpray(onShoot, player); break;
            case 'cross': this.shootCross(onShoot); break;
            case 'vortex': this.shootVortex(onShoot); break;
            case 'flower': this.shootFlower(onShoot); break;
            case 'barrage': this.shootBarrage(onShoot); break;
            case 'star': this.shootStar(onShoot); break;
            case 'oscillator': this.shootOscillator(onShoot); break;
            case 'wall': this.shootWall(onShoot); break;
            case 'web': this.shootWeb(onShoot); break;
            default: this.shootCircle(onShoot);
        }
    }

    shootCircle(onShoot) {
        const bulletCount = 12;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(angle), Math.sin(angle));
        }
    }

    shootSpiral(onShoot) {
        this.angle += 0.2;
        onShoot(this.x, this.y, Math.cos(this.angle), Math.sin(this.angle));
        onShoot(this.x, this.y, Math.cos(this.angle + Math.PI), Math.sin(this.angle + Math.PI));
    }

    shootDoubleSpiral(onShoot) {
        this.angle += 0.15;
        onShoot(this.x, this.y, Math.cos(this.angle), Math.sin(this.angle));
        onShoot(this.x, this.y, Math.cos(-this.angle), Math.sin(-this.angle));
    }

    shootSpray(onShoot, player) {
        if (!player) return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        const count = 5;
        const spread = 0.5;
        for (let i = 0; i < count; i++) {
            const a = baseAngle - spread / 2 + (i / (count - 1)) * spread;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a));
        }
    }

    shootWaveSpray(onShoot, player) {
        if (!player) return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        const wave = Math.sin(this.time / 200) * 0.8;
        onShoot(this.x, this.y, Math.cos(baseAngle + wave), Math.sin(baseAngle + wave));
    }

    shootCross(onShoot) {
        const a = (Math.floor(this.time / 1000) % 2 === 0) ? 0 : Math.PI / 4;
        for (let i = 0; i < 4; i++) {
            const ang = a + (i / 4) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(ang), Math.sin(ang));
        }
    }

    shootVortex(onShoot) {
        const count = 3;
        this.angle += 0.5;
        for (let i = 0; i < count; i++) {
            const a = this.angle + (i / count) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { projectileSpeed: 150 });
        }
    }

    shootFlower(onShoot) {
        const petals = 8;
        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { projectileSpeed: 200 });
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { projectileSpeed: 350 });
        }
    }

    shootBarrage(onShoot) {
        for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 300;
            onShoot(this.x, this.y, Math.cos(a), Math.sin(a), { projectileSpeed: speed });
        }
    }

    shootStar(onShoot) {
        const branches = 5;
        const perBranch = 4;
        for (let i = 0; i < branches; i++) {
            const baseA = (i / branches) * Math.PI * 2;
            for (let j = 0; j < perBranch; j++) {
                onShoot(this.x, this.y, Math.cos(baseA), Math.sin(baseA), { projectileSpeed: 150 + j * 60 });
            }
        }
    }

    shootOscillator(onShoot) {
        const count = 4;
        for (let i = 0; i < count; i++) {
            const baseA = (i / count) * Math.PI * 2;
            const offset = Math.sin(this.time / 500) * 0.8;
            onShoot(this.x, this.y, Math.cos(baseA + offset), Math.sin(baseA + offset));
        }
    }

    shootWall(onShoot) {
        const count = 12; // Plus de projectiles pour une vraie muraille
        const spacing = 40;
        // On utilise le temps pour alterner horizontal/vertical de façon prévisible
        const isVertical = (Math.floor(this.time / this.fireRate) % 2 === 0);

        for (let i = 0; i < count; i++) {
            const offset = (i - count / 2) * spacing;
            if (isVertical) {
                // Muraille verticale qui descend
                onShoot(this.x + offset, this.y, 0, 1, { projectileSpeed: 180 });
            } else {
                // Muraille horizontale qui va vers la droite (ou la gauche si on veut varier)
                onShoot(this.x, this.y + offset, 1, 0, { projectileSpeed: 180 });
            }
        }
    }

    shootWeb(onShoot) {
        this.angle += 0.3;
        const speed = 150 + Math.sin(this.angle * 2) * 70;
        onShoot(this.x, this.y, Math.cos(this.angle), Math.sin(this.angle), { projectileSpeed: speed });
    }

    draw(ctx) {
        // Cercle plus imposant
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Barre de vie spécifique au Boss (Haut de l'écran ou au-dessus)
        this.drawBossHealthBar(ctx);

        ctx.restore();
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
