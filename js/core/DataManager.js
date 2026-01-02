/**
 * DataManager Class
 * Gère le chargement et le stockage des configurations JSON.
 */
export class DataManager {
    constructor() {
        this.data = {
            player: null,
            enemies: null,
            phases: null
        };
    }

    /**
     * Charge tous les fichiers JSON nécessaires.
     */
    async loadAll() {
        try {
            const [playerRes, enemiesRes, phasesRes] = await Promise.all([
                fetch('./data/player.json'),
                fetch('./data/enemies.json'),
                fetch('./data/phases.json')
            ]);

            this.data.player = await playerRes.json();
            this.data.enemies = await enemiesRes.json();
            this.data.phases = await phasesRes.json();

            console.log('Données chargées avec succès:', this.data);
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            return false;
        }
    }

    getPlayerData() {
        return this.data.player.baseStats;
    }

    getEnemyData(type) {
        return this.data.enemies.enemies[type || 'basic'];
    }

    getPhaseData(index) {
        return this.data.phases.phases[index] || this.data.phases.phases[0];
    }
}
