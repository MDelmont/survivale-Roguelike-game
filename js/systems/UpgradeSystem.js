/**
 * UpgradeSystem Class
 * Gère la génération et l'application des améliorations de statistiques du joueur.
 */
export class UpgradeSystem {
    constructor() {
        // Liste des upgrades de statistiques de base
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
                description: 'Augmente les dégâts globaux de 20%.',
                type: 'stat',
                stat: 'damage',
                multiplier: 1.2
            },
            {
                id: 'fire_rate_boost',
                name: 'Caféine',
                description: 'Tire 15% plus vite (toutes armes).',
                type: 'stat',
                stat: 'fireRate',
                multiplier: 0.85
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
            },
            {
                id: 'projectile_boost',
                name: 'Munitions Doubles',
                description: 'Ajoute +1 projectile à toutes vos armes de tir.',
                type: 'stat',
                stat: 'projectileBonus',
                add: 1
            },
            {
                id: 'aura_range_boost',
                name: 'Amplificateur',
                description: 'Augmente la portée de vos auras de 20%.',
                type: 'stat',
                stat: 'rangeMultiplier',
                multiplier: 1.2
            },
            {
                id: 'piercing_boost',
                name: 'Munitions Perçantes',
                description: 'Toutes vos balles traversent +1 ennemi supplémentaire.',
                type: 'stat',
                stat: 'piercingBonus',
                add: 1
            }
        ];
    }

    /**
     * Retourne X options aléatoires pour les statistiques.
     */
    getRandomOptions(count = 3) {
        const shuffled = [...this.availableUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Applique une amélioration de statistique au joueur.
     */
    applyUpgrade(player, upgrade) {
        if (upgrade.type === 'stat') {
            if (upgrade.multiplier) {
                player.stats[upgrade.stat] *= upgrade.multiplier;
            }
            if (upgrade.add) {
                player.stats[upgrade.stat] += upgrade.add;
                if (upgrade.stat === 'maxHp') {
                    player.stats.hp += upgrade.add; // Soit soigné du montant ajouté
                }
            }
        }
        console.log(`Statistique augmentée : ${upgrade.name}`);
    }
}
