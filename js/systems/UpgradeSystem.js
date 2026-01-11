/**
 * UpgradeSystem Class
 * Gère la génération et l'application des améliorations de statistiques du joueur.
 */
export class UpgradeSystem {
    constructor(game) {
        this.game = game;
        // Liste des upgrades de statistiques de base (chargée dynamiquement)
        this.availableUpgrades = [];
    }

    /**
     * Initialise les upgrades à partir des données JSON
     */
    init(data) {
        this.availableUpgrades = data || [];
        console.log(`Système d'améliorations prêt (${this.availableUpgrades.length} options)`);
    }

    /**
     * Retourne X options aléatoires pour les statistiques.
     * Filtre les options en fonction de la phase actuelle si configuré.
     */
    getRandomOptions(count = 3) {
        let pool = this.availableUpgrades;

        // Filtrer par phase si la liste est définie
        const phaseUpgrades = this.game.currentPhase?.available_upgrades;
        if (phaseUpgrades && phaseUpgrades.length > 0) {
            pool = this.availableUpgrades.filter(u => phaseUpgrades.includes(u.id));
        }

        // Si le pool est vide après filtrage (erreur config), on revient au pool complet
        if (pool.length === 0) pool = this.availableUpgrades;

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Applique une amélioration de statistique au joueur.
     */
    applyUpgrade(player, upgrade) {
        if (upgrade.type === 'stat') {
            if (upgrade.multiplier) {
                if (upgrade.stat === 'fireRate') {
                    // Pour le fireRate (délai), on divise par le multiplicateur de fréquence
                    // Ex: x1.15 signifie "15% plus de tirs", donc on réduit le délai
                    player.stats[upgrade.stat] /= upgrade.multiplier;
                } else {
                    player.stats[upgrade.stat] *= upgrade.multiplier;
                }
            }
            if (upgrade.add) {
                player.stats[upgrade.stat] += upgrade.add;
                if (upgrade.stat === 'maxHp') {
                    player.stats.hp += upgrade.add; // Soit soigné du montant ajouté
                }
            }
            // Suivi pour le récapitulatif de fin
            if (!player.stats.appliedUpgrades) player.stats.appliedUpgrades = [];
            player.stats.appliedUpgrades.push(upgrade);
        }
        console.log(`Statistique augmentée : ${upgrade.name}`);
    }
}
