/**
 * Enemy Class
 * Gère le comportement, les stats et l'affichage des ennemis.
 */
export class Enemy {
    constructor(x, y, stats) {
        this.x = x;
        this.y = y;
        this.stats = stats;
        this.radius = stats.radius || 15;
        this.hp = stats.hp || 20;
        this.speed = stats.speed || 100;
        this.damage = stats.damage || 5;
        this.xpValue = stats.xpValue || 10;
        this.color = stats.color || '#f00'; // Rouge par défaut
        this.toRemove = false;

        this.activeEffects = []; // Pour le poison, etc.
    }

    update(deltaTime, playerPos) {
        const dt = deltaTime / 1000;

        // Gestion des effets (Poison)
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.duration -= deltaTime;

            if (effect.type === 'poison') {
                effect.timer += deltaTime;
                if (effect.timer >= 500) { // Un "tick" toutes les 0.5s
                    this.takeDamage(effect.damagePerTick);
                    effect.timer = 0;
                }
            }

            if (effect.duration <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }

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

        // Indicateur visuel si empoisonné
        if (this.activeEffects.some(e => e.type === 'poison')) {
            ctx.fillStyle = '#0f0';
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    takeDamage(amount) {
        this.hp -= amount;
    }

    applyEffect(effect) {
        // Évite de cumuler le même poison, on reset juste la durée
        const existing = this.activeEffects.find(e => e.type === effect.type);
        if (existing) {
            existing.duration = effect.duration;
        } else {
            this.activeEffects.push({ ...effect, timer: 0 });
        }
    }
}
