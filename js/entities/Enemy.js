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
        this.speed = (stats.speed !== undefined) ? stats.speed : 100;
        this.damage = stats.damage || 5;
        this.xpValue = stats.xpValue || 10;
        this.color = stats.color || '#f00'; // Rouge par défaut
        this.toRemove = false;

        this.activeEffects = []; // Pour le poison, etc.
        this.originalColor = this.color;
    }

    update(deltaTime, playerPos) {
        const dt = deltaTime / 1000;

        // Gestion des effets (Poison, Ralentissement, etc.)
        let speedMultiplier = 1.0;
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.duration -= deltaTime;

            // Logique spécifique par type d'effet
            if (effect.type === 'poison') {
                effect.tickTimer = (effect.tickTimer || 0) + deltaTime;
                const tickRate = effect.tickRate || 500;
                if (effect.tickTimer >= tickRate) {
                    this.takeDamage(effect.damagePerTick);
                    effect.tickTimer = 0;
                }
            } else if (effect.type === 'slowing') {
                speedMultiplier = Math.min(speedMultiplier, effect.multiplier || 0.5);
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
            this.x += (dx / dist) * (this.speed * speedMultiplier) * dt;
            this.y += (dy / dist) * (this.speed * speedMultiplier) * dt;
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
        } else if (this.activeEffects.some(e => e.type === 'slowing')) {
            ctx.fillStyle = '#0ff';
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Barre de vie au-dessus de la tête
        if (this.hp < (this.stats.hp || 20)) {
            this.drawHealthBar(ctx);
        }
    }

    drawHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 8;

        // Fond (gris foncé)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Vie (rouge -> vert en dégradé ou couleur fixe)
        const ratio = Math.max(0, this.hp / (this.stats.hp || 20));
        ctx.fillStyle = ratio > 0.5 ? '#0f0' : (ratio > 0.25 ? '#ff0' : '#f00');
        ctx.fillRect(x, y, barWidth * ratio, barHeight);

        // Bordure
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    takeDamage(amount) {
        this.hp -= amount;
        // Feedback visuel de dégâts
        this.color = '#fff'; // Flash blanc
        setTimeout(() => {
            this.color = this.originalColor;
        }, 50);
    }

    applyEffect(effect) {
        // Évite de cumuler le même poison, on reset juste la durée et les stats
        const existing = this.activeEffects.find(e => e.type === effect.type);
        if (existing) {
            existing.duration = Math.max(existing.duration, effect.duration);
            // On met à jour les stats au cas où l'aura est plus forte que le poison précédent
            if (effect.damagePerTick !== undefined) existing.damagePerTick = effect.damagePerTick;
            if (effect.tickRate !== undefined) existing.tickRate = effect.tickRate;
            if (effect.multiplier !== undefined) existing.multiplier = effect.multiplier;
        } else {
            this.activeEffects.push({ ...effect, tickTimer: 0 });
        }
    }
}
