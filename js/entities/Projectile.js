/**
 * Projectile Class
 * Gère le mouvement et l'affichage des projectiles tirés.
 */
export class Projectile {
    constructor(x, y, dx, dy, stats) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.speed = stats.speed || 400;
        this.damage = stats.damage || 10;
        this.radius = 5;
        this.color = stats.color || '#ff0'; // Jaune par défaut
        this.toRemove = false;

        // Effets spéciaux
        this.isExplosive = stats.isExplosive || false;
        this.isPoisonous = stats.isPoisonous || false;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.x += this.dx * this.speed * dt;
        this.y += this.dy * this.speed * dt;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isPoisonous) {
            ctx.fillStyle = '#0f0'; // Vert pour le poison
        } else if (this.isExplosive) {
            ctx.fillStyle = '#f50'; // Rouge-orange pour explosif
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.fill();

        // Traînée ou halo selon l'effet
        if (this.isExplosive || this.isPoisonous) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    isOutOfBounds(width, height) {
        const margin = 50;
        return (
            this.x < -margin ||
            this.x > width + margin ||
            this.y < -margin ||
            this.y > height + margin
        );
    }
}
