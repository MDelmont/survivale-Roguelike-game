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
            bosses: null,
            upgrades: null,
            transitions: null
        };
    }

    /**
     * Charge tous les fichiers JSON nécessaires et pré-charge les images.
     */
    async loadAll() {
        try {
            const [playerRes, enemiesRes, phasesRes, weaponsRes, bossesRes, upgradesRes, transitionsRes] = await Promise.all([
                fetch('./data/player.json'),
                fetch('./data/enemies.json'),
                fetch('./data/phases.json'),
                fetch('./data/weapons.json'),
                fetch('./data/bosses.json'),
                fetch('./data/upgrades.json'),
                fetch('./data/transitions.json')
            ]);

            this.data.player = await playerRes.json();
            this.data.enemies = await enemiesRes.json();
            this.data.phases = await phasesRes.json();
            this.data.weapons = await weaponsRes.json();
            this.data.bosses = await bossesRes.json();
            this.data.upgrades = await upgradesRes.json();
            this.data.transitions = await transitionsRes.json();

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
        // Charger explicitement les images de fond et de story des phases
        if (this.data.phases && this.data.phases.phases) {
            this.data.phases.phases.forEach(phase => {
                if (phase.background_image) {
                    this.assetManager.loadImage(phase.background_image);
                }
                if (phase.xp_visual) {
                    this.assetManager.loadImage(phase.xp_visual);
                }
                if (phase.weapon_visual) {
                    this.assetManager.loadImage(phase.weapon_visual);
                }
                if (phase.story_intro) {
                    phase.story_intro.forEach(p => p.image && this.assetManager.loadImage(p.image));
                }
                if (phase.story_outro) {
                    phase.story_outro.forEach(p => p.image && this.assetManager.loadImage(p.image));
                }
            });
        }

        // Charger les images des transitions
        if (this.data.transitions && this.data.transitions.transitions) {
            this.data.transitions.transitions.forEach(transition => {
                transition.pages.forEach(page => {
                    if (page.image) this.assetManager.loadImage(page.image);
                    if (page.background) this.assetManager.loadImage(page.background);
                });
            });
        }

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

    getPlayerData(id) {
        if (!this.data.player) return null;
        const players = this.data.player.players || {};
        return players[id] || players['anthony'] || Object.values(players)[0] || this.data.player.baseStats;
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

    getTransitionData(id) {
        if (!this.data.transitions || !this.data.transitions.transitions) return null;
        return this.data.transitions.transitions.find(t => t.id === id);
    }
}

