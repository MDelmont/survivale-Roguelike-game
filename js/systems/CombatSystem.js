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
     * @param {Object} params { x, y, radius, damage, enemies, boss, explosions }
     */
    handleAOE({ x, y, radius, damage, enemies, boss, explosions }) {
        // Effet visuel
        if (explosions) {
            explosions.push({ x, y, radius, timer: 300, maxTimer: 300 });
        }

        // Dégâts aux ennemis
        enemies.forEach(e => {
            const dx = e.x - x;
            const dy = e.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + e.radius) {
                e.takeDamage(damage);
            }
        });

        // Dégâts au boss
        if (boss) {
            const dx = boss.x - x;
            const dy = boss.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius + boss.radius) {
                boss.takeDamage(damage);
            }
        }
    }
};
