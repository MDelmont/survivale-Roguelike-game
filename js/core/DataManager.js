import { AssetManager } from './AssetManager.js';

/**
 * DataManager Class
 * Gère le chargement et le stockage des configurations JSON, ainsi que des assets associés.
 */
export class DataManager {
    constructor() {
        this.assetManager = new AssetManager();
        this.data = {
            player: null,
            enemies: null,
            phases: null,
            weapons: null,
            bosses: null
        };
    }

    /**
     * Charge tous les fichiers JSON nécessaires et pré-charge les images.
     */
    async loadAll() {
        try {
            const [playerRes, enemiesRes, phasesRes, weaponsRes, bossesRes] = await Promise.all([
                fetch('./data/player.json'),
                fetch('./data/enemies.json'),
                fetch('./data/phases.json'),
                fetch('./data/weapons.json'),
                fetch('./data/bosses.json')
            ]);

            this.data.player = await playerRes.json();
            this.data.enemies = await enemiesRes.json();
            this.data.phases = await phasesRes.json();
            this.data.weapons = await weaponsRes.json();
            this.data.bosses = await bossesRes.json();

            // Parcourir les données pour trouver et charger tous les assets visuels
            this.preloadVisuals();
            await this.assetManager.waitForAll();

            console.log('Données et assets chargés avec succès:', this.data);
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            return false;
        }
    }

    /**
     * Parcourt récursivement les données pour trouver les chemins d'images dans les blocs "visuals"
     */
    preloadVisuals() {
        const findAndLoad = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            if (obj.animations) {
                Object.values(obj.animations).forEach(anim => {
                    if (anim.frames) {
                        anim.frames.forEach(path => this.assetManager.loadImage(path));
                    } else {
                        // Gérer les animations directionnelles (up, down...)
                        Object.values(anim).forEach(dirAnim => {
                            if (dirAnim.frames) {
                                dirAnim.frames.forEach(path => this.assetManager.loadImage(path));
                            }
                        });
                    }
                });
            }

            Object.values(obj).forEach(val => findAndLoad(val));
        };

        findAndLoad(this.data);
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

    getWeaponData(id) {
        return this.data.weapons.weapons.find(w => w.id === id);
    }

    getBossData(id) {
        return this.data.bosses.bosses[id];
    }
}

