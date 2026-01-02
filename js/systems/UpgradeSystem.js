/**
 * UpgradeSystem Class
 * Gère la génération et l'application des améliorations du joueur.
 */
export class UpgradeSystem {
    constructor() {
        // Liste des upgrades disponibles pour le MVP
        this.availableUpgrades = [
            {
                id: 'speed_boost',
                name: 'Chaussures de Sport',
                description: 'Augmente la vitesse de déplacement de 15%.',
                type: 'stat',
                stat: 'speed',
                multiplier: 1.15
            },
            {
                id: 'damage_boost',
                name: 'Force de la Nature',
                description: 'Augmente les dégâts de 20%.',
                type: 'stat',
                stat: 'damage',
                multiplier: 1.2
            },
            {
                id: 'fire_rate_boost',
                name: 'Caféine',
                description: 'Tire 15% plus vite.',
                type: 'stat',
                stat: 'fireRate',
                multiplier: 0.85 // Temps entre tirs réduit
            },
            {
                id: 'max_hp_boost',
                name: 'Gros Coeur',
                description: 'Augmente les HP max de 20.',
                type: 'stat',
                stat: 'maxHp',
                add: 20
            },
            {
                id: 'pickup_range_boost',
                name: 'Aimant',
                description: 'Augmente la portée de collecte de 30%.',
                type: 'stat',
                stat: 'pickupRadius',
                multiplier: 1.3
            }
        ];
    }

    /**
     * Retourne 3 options aléatoires pour le menu d'upgrade.
     */
    getRandomOptions(count = 3) {
        const shuffled = [...this.availableUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Applique une upgrade au joueur.
     */
    applyUpgrade(player, upgrade) {
        if (upgrade.type === 'stat') {
            if (upgrade.multiplier) {
                player.stats[upgrade.stat] *= upgrade.multiplier;
            }
            if (upgrade.add) {
                player.stats[upgrade.stat] += upgrade.add;
                // Si on augmente les HP max, on soigne du même montant
                if (upgrade.stat === 'maxHp') {
                    player.stats.hp += upgrade.add;
                }
            }
        }
        console.log(`Upgrade appliquée : ${upgrade.name}`);
    }
}
