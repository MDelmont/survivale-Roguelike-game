/**
 * Enemy Class
 * Gère le comportement, les stats et l'affichage des ennemis.
 */
export class Enemy {
    constructor(x, y, stats) {
        this.x = x;
        this.y = y;
        this.radius = stats.radius || 15;
        this.hp = stats.hp || 20;
        this.speed = stats.speed || 100;
        this.damage = stats.damage || 5;
        this.xpValue = stats.xpValue || 10;
        this.color = stats.color || '#f00'; // Rouge par défaut

        this.toRemove = false;
    }

    update(deltaTime, playerPos) {
        const dt = deltaTime / 1000;

        // Comportement simple : foncer vers le joueur
        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        if (this.hp <= 0) {
            this.toRemove = true;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Petite barre de vie au-dessus de l'ennemi (optionnel pour MVP mais aide au test)
        /*
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 10, this.y - 20, 20, 4);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - 10, this.y - 20, (this.hp / 20) * 20, 4);
        */
    }

    takeDamage(amount) {
        this.hp -= amount;
    }
}
