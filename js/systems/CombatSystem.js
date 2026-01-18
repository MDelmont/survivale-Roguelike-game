/**
 * CombatSystem 
 * Regroupe les fonctions de logique de combat partagées.
 */
export const CombatSystem = {
    /**
     * Vérifie la collision entre deux entités circulaires.
     */
    checkCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = dx * dx + dy * dy;
        const radiusSum = a.radius + b.radius;

        // Test circulaire rapide
        if (distSq >= radiusSum * radiusSum) return false;

        // Test Pixel-Perfect si configuré
        if (a.visuals?.pixelPerfect && a.animator) {
            return a.animator.isPixelOpaque(b.x, b.y, a.x, a.y, a.angle);
        }

        if (b.visuals?.pixelPerfect && b.animator) {
            return b.animator.isPixelOpaque(a.x, a.y, b.x, b.y, b.angle);
        }

        return true;
    },

    /**
     * Applique des dégâts de zone.
     * @param {Object} params { x, y, radius, damage, enemies, boss, explosions, effects, visuals }
     */
    handleAOE({ x, y, radius, damage, enemies, boss, explosions, effects, visuals }) {
        // Effet visuel
        if (explosions) {
            explosions.push({
                x, y, radius,
                timer: 300, maxTimer: 300,
                visuals: visuals // Ajout des visuels pour le rendu (sprite ou autre)
            });
        }

        const targets = boss ? [boss, ...enemies] : enemies;

        // Application des dégâts et effets aux cibles dans la zone
        targets.forEach(t => {
            if (!t) return;
            const dx = t.x - x;
            const dy = t.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius + (t.radius || 10)) {
                // Dégâts directs
                if (damage > 0) t.takeDamage(damage);

                // Application des effets supplémentaires (poison, slow, etc.)
                if (effects && t.applyEffect) {
                    effects.forEach(effect => {
                        t.applyEffect(effect);
                    });
                }
            }
        });
    }
};
