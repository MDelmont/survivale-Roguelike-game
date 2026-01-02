/**
 * Player Class
 * Gère l'affichage, le mouvement et les stats du joueur.
 */
export class Player {
    constructor(x, y, stats) {
        this.x = x;
        this.y = y;
        this.radius = 20; // Collision simple
        this.stats = {
            speed: stats.speed || 200,
            hp: stats.hp || 100,
            maxHp: stats.hp || 100,
            fireRate: stats.fireRate || 500, // ms entre les tirs
            damage: stats.damage || 10,
            projectileSpeed: stats.projectileSpeed || 400,
            xp: 0,
            level: 1,
            xpNextLevel: 50,
            pickupRadius: 100
        };

        this.shotTimer = 0;
        this.color = '#00f'; // Couleur par défaut (Bleu)
        this.originalColor = '#00f';
        this.lastShootDir = { dx: 0, dy: -1 };

        this.pendingUpgrade = false;
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

        // Soin partiel lors d'un level up
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 20);

        console.log(`Level Up! Nouveau niveau : ${this.stats.level}`);
        this.pendingUpgrade = true;
    }

    update(deltaTime, movement, onShoot, targetDir = null) {
        // deltaTime est en ms, on convertit en s pour le mouvement
        const dt = deltaTime / 1000;

        this.x += movement.dx * this.stats.speed * dt;
        this.y += movement.dy * this.stats.speed * dt;

        // Mise à jour de la dernière direction de tir si une cible est fournie
        if (targetDir) {
            this.lastShootDir = targetDir;
        }

        // Tir automatique
        this.shotTimer += deltaTime;
        if (this.shotTimer >= this.stats.fireRate) {
            this.shotTimer = 0;
            if (onShoot) {
                // Tir vers l'ennemi le plus proche ou direction par défaut
                onShoot(this.x, this.y, this.lastShootDir.dx, this.lastShootDir.dy);
            }
        }
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

        // Indicateur de tir
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.lastShootDir.dx * 25, this.lastShootDir.dy * 25);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.stroke();

        ctx.restore();
    }

    takeDamage(amount) {
        this.stats.hp -= amount;
        if (this.stats.hp < 0) this.stats.hp = 0;

        // Feedback visuel
        this.color = '#f00';
        setTimeout(() => {
            this.color = this.originalColor;
        }, 100);
    }
}
