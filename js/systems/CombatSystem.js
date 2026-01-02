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
        return Math.sqrt(dx * dx + dy * dy) < (a.radius + b.radius);
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
