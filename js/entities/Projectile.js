/**
 * Projectile Class
 * Gère le mouvement et l'affichage des balles.
 */
export class Projectile {
    constructor(x, y, dx, dy, stats) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;

        this.speed = stats.speed || 400;
        this.damage = stats.damage || 10;
        this.radius = stats.radius || 5;
        this.color = stats.color || '#ff0'; // Jaune par défaut

        this.toRemove = false;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        this.x += this.dx * this.speed * dt;
        this.y += this.dy * this.speed * dt;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    isOutOfBounds(width, height) {
        return (
            this.x < -this.radius ||
            this.x > width + this.radius ||
            this.y < -this.radius ||
            this.y > height + this.radius
        );
    }
}
