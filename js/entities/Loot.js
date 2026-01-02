/**
 * Loot Class
 * Représente un objet collectable à l'écran (XP, bonus).
 */
export class Loot {
    constructor(x, y, value, type = 'xp') {
        this.x = x;
        this.y = y;
        this.value = value;
        this.type = type;
        this.radius = 6;
        this.toRemove = false;

        // Pour l'animation de magnétisme
        this.isFollowing = false;
        this.followSpeed = 500;

        this.color = (type === 'xp') ? '#0f0' : '#f0f';
    }

    update(deltaTime, playerPos) {
        if (this.isFollowing) {
            const dt = deltaTime / 1000;
            const dx = playerPos.x - this.x;
            const dy = playerPos.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                this.x += (dx / dist) * this.followSpeed * dt;
                this.y += (dy / dist) * this.followSpeed * dt;
            } else {
                this.toRemove = true; // Collecté
            }
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Petit effet de brillance
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
