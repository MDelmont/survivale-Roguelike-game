import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { Projectile } from '../entities/Projectile.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Loot } from '../entities/Loot.js';
import { Animator } from '../entities/Animator.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { DataManager } from './DataManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { WeaponFactory } from '../systems/WeaponFactory.js';

// UI Screens
import { MainMenu } from '../ui/screens/MainMenu.js';
import { LevelUpScreen } from '../ui/screens/LevelUpScreen.js';
import { WeaponMenuScreen } from '../ui/screens/WeaponMenuScreen.js';
import { VictoryScreen } from '../ui/screens/VictoryScreen.js';
import { PhaseSelectionScreen } from '../ui/screens/PhaseSelectionScreen.js';
import { BestiaryScreen } from '../ui/screens/BestiaryScreen.js';

/**
 * GameState Enum
 */
const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    UPGRADE: 'UPGRADE',
    WEAPON_MENU: 'WEAPON_MENU',
    STORY: 'STORY',
    VICTORY: 'VICTORY',
    PHASE_SELECTION: 'PHASE_SELECTION',
    BESTIARY: 'BESTIARY',
    GAMEOVER: 'GAMEOVER'
};

/**
 * Game Core Class 
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.lastTime = 0;

        this.input = new Input();
        this.upgradeSystem = new UpgradeSystem(this);
        this.saveSystem = new SaveSystem();
        this.dataManager = new DataManager();

        this.player = null;
        this.projectiles = [];
        this.enemies = [];
        this.enemyProjectiles = [];
        this.loots = [];
        this.explosions = [];
        this.boss = null;

        this.spawnTimer = 0;
        this.currentPhaseIndex = 0;
        this.currentPhase = null;
        this.phaseTimer = 0;
        this.killCount = 0;

        this.state = GameState.MENU;
        this.upgradeOptions = [];

        this.storyQueue = [];
        this.storyPageIndex = 0;
        this.onStoryComplete = null;

        // Mouse tracking for UI hover effects
        this.mouseX = 0;
        this.mouseY = 0;

        // UI Screens
        this.mainMenu = null;
        this.levelUpScreen = null;
        this.weaponMenuScreen = null;

        // Système de Résolution Logique
        this.baseWidth = 1600; // Largeur de référence fixe
        this.logicalWidth = this.baseWidth;
        this.logicalHeight = 900;
        this.scale = 1;
        this.debugMode = false;

        this.init();
    }

    async init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
        const success = await this.dataManager.loadAll();
        if (!success) return;

        // Initialize Systems with dynamic data
        this.upgradeSystem.init(this.dataManager.data.upgrades?.upgrades);

        // Initialize UI Screens
        this.mainMenu = new MainMenu(this);
        this.levelUpScreen = new LevelUpScreen(this);
        this.weaponMenuScreen = new WeaponMenuScreen(this);
        this.victoryScreen = new VictoryScreen(this);
        this.phaseSelectionScreen = new PhaseSelectionScreen(this);
        this.bestiaryScreen = new BestiaryScreen(this);

        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Mouse tracking for hover effects
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) / this.scale;
            this.mouseY = (e.clientY - rect.top) / this.scale;
        });

        // Gestion de la molette pour le scroll dans certains écrans (ex: Bestiaire)
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); // Empêcher le zoom manuel
            } else {
                if (this.state === GameState.BESTIARY && this.bestiaryScreen) {
                    this.bestiaryScreen.handleWheel(e.deltaY);
                }
            }
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                e.preventDefault();
                this.debugMode = !this.debugMode;
                console.log('Debug Mode:', this.debugMode);
            }
            if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
                e.preventDefault();
            }
        });

        requestAnimationFrame((time) => this.loop(time));
    }

    startPhase(index) {
        this.currentPhaseIndex = index;
        this.currentPhase = this.dataManager.getPhaseData(index);
        this.phaseTimer = 0;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.loots = [];
        this.explosions = [];
        this.boss = null;
        this.killCount = 0;
        this.threatBudgets = {}; // Un budget par type d'ennemi pour des jauges parallèles

        // Initialisation du budget de menace de départ
        if (this.currentPhase.initial_threat_budget && this.currentPhase.enemy_types) {
            const initialBonus = this.currentPhase.initial_threat_budget / this.currentPhase.enemy_types.length;
            this.currentPhase.enemy_types.forEach(type => {
                this.threatBudgets[type] = initialBonus;
            });
        }

        if (this.currentPhase.transition_intro_id) {
            const transition = this.dataManager.getTransitionData(this.currentPhase.transition_intro_id);
            if (transition) {
                this.openStory(transition.pages, () => {
                    this.player = null; // S'assurer que le joueur est reset
                    this.setupInitialPlayer();
                    this.state = GameState.PLAYING;
                });
                return;
            }
        }

        if (this.currentPhase.story_intro && this.currentPhase.story_intro.length > 0) {
            this.openStory(this.currentPhase.story_intro, () => {
                this.player = null;
                this.setupInitialPlayer();
                this.state = GameState.PLAYING;
            });
        } else {
            this.player = null;
            this.setupInitialPlayer();
            this.state = GameState.PLAYING;
        }

        // Enregistrement des données de phase dans le bestiaire
        if (this.currentPhase.player_id) {
            this.saveSystem.saveDiscoveredEntity('personnages', this.currentPhase.player_id);
        }
        if (this.currentPhase.xp_visual) {
            this.saveSystem.saveDiscoveredEntity('experiences', this.currentPhase.xp_visual);
        }
        if (this.currentPhase.weapon_visual) {
            this.saveSystem.saveDiscoveredEntity('experiences', this.currentPhase.weapon_visual);
        }
    }

    setupInitialPlayer() {
        if (!this.player) {
            const playerStats = this.dataManager.getPlayerData(this.currentPhase.player_id);
            this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, playerStats, this.dataManager.assetManager);
        } else {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2;
            this.player.stats.hp = this.player.stats.maxHp;
        }

        if (this.currentPhase.default_weapon) {
            const weaponData = this.dataManager.getWeaponData(this.currentPhase.default_weapon);
            this.player.addWeapon(WeaponFactory.create(weaponData, this.dataManager.assetManager));
            this.saveSystem.saveDiscoveredEntity('armes', weaponData.id);
        }
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Calcul du scale basé sur la largeur de référence
        this.scale = window.innerWidth / this.baseWidth;

        // Mise à jour des dimensions logiques (l'espace de jeu interne)
        this.logicalWidth = this.baseWidth;
        this.logicalHeight = window.innerHeight / this.scale;
    }

    requestFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Erreur lors du passage en plein écran : ${err.message}`);
            });
        }
    }

    exitFullscreen() {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
                console.warn(`Erreur lors de la sortie du plein écran : ${err.message}`);
            });
        }
    }

    handleCanvasClick(e) {
        // Force le plein écran sur n'importe quel clic pour garantir un affichage à 100%
        if (!document.fullscreenElement) {
            this.requestFullscreen();
        }

        const rect = this.canvas.getBoundingClientRect();
        // Conversion des coordonnées écran -> coordonnées logiques
        const mouseX = (e.clientX - rect.left) / this.scale;
        const mouseY = (e.clientY - rect.top) / this.scale;

        if (this.state === GameState.MENU && this.mainMenu) {
            const action = this.mainMenu.handleClick(mouseX, mouseY);
            if (action === 'new_game') {
                this.requestFullscreen();
                this.startNewGame();
                return;
            } else if (action === 'continue') {
                this.requestFullscreen();
                this.continueGame();
                return;
            } else if (action === 'select_phase') {
                this.state = GameState.PHASE_SELECTION;
                if (this.phaseSelectionScreen) this.phaseSelectionScreen.reset();
                return;
            } else if (action === 'bestiary') {
                this.state = GameState.BESTIARY;
                if (this.bestiaryScreen) this.bestiaryScreen.reset();
                return;
            }
        } else if (this.state === GameState.STORY) {
            this.nextStoryPage();
        } else if (this.state === GameState.UPGRADE && this.levelUpScreen) {
            const choice = this.levelUpScreen.handleClick(mouseX, mouseY);
            if (choice) {
                this.upgradeSystem.applyUpgrade(this.player, choice);
                this.player.pendingUpgrade = false;
                this.state = GameState.PLAYING;
            }
        } else if (this.state === GameState.WEAPON_MENU && this.weaponMenuScreen) {
            const choice = this.weaponMenuScreen.handleClick(mouseX, mouseY);
            if (choice) {
                if (choice.type === 'upgrade') {
                    const weapon = this.player.weapons.find(w => w.id === choice.weaponId);
                    if (weapon) weapon.upgrade();
                } else {
                    this.player.addWeapon(WeaponFactory.create(choice, this.dataManager.assetManager));
                    this.saveSystem.saveDiscoveredEntity('armes', choice.id);
                }
                this.player.pendingWeaponUpgrade = false;
                this.state = GameState.PLAYING;
            }
        } else if (this.state === GameState.VICTORY) {
            const nextIndex = this.currentPhaseIndex + 1;
            const phases = this.dataManager.data.phases?.phases || [];

            if (nextIndex < phases.length) {
                // Passage à la phase suivante (reset complet du joueur)
                this.player = null;
                this.startPhase(nextIndex);
            } else {
                // Fin du jeu
                this.state = GameState.MENU;
            }
        } else if (this.state === GameState.GAMEOVER) {
            // Un seul choix : retour au menu
            this.state = GameState.MENU;
            this.exitFullscreen();
        } else if (this.state === GameState.PHASE_SELECTION && this.phaseSelectionScreen) {
            const action = this.phaseSelectionScreen.handleClick(mouseX, mouseY);
            if (action) {
                if (action.type === 'phase') {
                    this.requestFullscreen();
                    this.player = null;
                    this.startPhase(action.index);
                } else if (action.type === 'back') {
                    this.state = GameState.MENU;
                }
            }
        } else if (this.state === GameState.BESTIARY && this.bestiaryScreen) {
            const action = this.bestiaryScreen.handleClick(mouseX, mouseY);
            if (action) {
                if (action === 'back') {
                    this.state = GameState.MENU;
                }
            }
        }
    }

    handleChoiceMenuClick(mouseX, mouseY, optionHeight, callback) {
        const menuWidth = 400;
        const startX = this.logicalWidth / 2 - menuWidth / 2;
        const startY = 150;
        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const optY = startY + i * (optionHeight + 20);
            if (mouseX >= startX && mouseX <= startX + menuWidth && mouseY >= optY && mouseY <= optY + optionHeight) {
                callback(this.upgradeOptions[i]);
                break;
            }
        }
    }

    startNewGame() { this.player = null; this.startPhase(0); }
    continueGame() { this.player = null; this.startPhase(this.saveSystem.getProgress()); }

    loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update UI screens based on state
        if (this.state === GameState.MENU && this.mainMenu) {
            this.mainMenu.update(deltaTime, this.mouseX, this.mouseY);
        } else if (this.state === GameState.UPGRADE && this.levelUpScreen) {
            this.levelUpScreen.update(deltaTime, this.mouseX, this.mouseY);
        } else if (this.state === GameState.WEAPON_MENU && this.weaponMenuScreen) {
            this.weaponMenuScreen.update(deltaTime, this.mouseX, this.mouseY);
        } else if (this.state === GameState.VICTORY && this.victoryScreen) {
            this.victoryScreen.update(deltaTime);
        } else if (this.state === GameState.PHASE_SELECTION && this.phaseSelectionScreen) {
            this.phaseSelectionScreen.update(deltaTime, this.mouseX, this.mouseY);
        } else if (this.state === GameState.BESTIARY && this.bestiaryScreen) {
            this.bestiaryScreen.update(deltaTime, this.mouseX, this.mouseY);
        } else if (this.state === GameState.PLAYING) {
            this.update(deltaTime);
        }

        this.draw();
        requestAnimationFrame((time) => this.loop(time));
    }

    update(deltaTime) {
        if (!this.currentPhase || !this.player) return;

        if (this.player.pendingUpgrade) { this.openUpgradeMenu(); return; }
        if (this.player.pendingWeaponUpgrade) { this.openWeaponMenu(); return; }
        if (this.player.stats.hp <= 0) {
            this.handlePlayerDeath();
            return;
        }

        this.phaseTimer += deltaTime / 1000;
        if (this.phaseTimer >= this.currentPhase.duration_before_boss && !this.boss) this.spawnBoss();

        // Cible pour tir auto
        let targetDir = null;
        let potentialTargets = this.boss ? [this.boss, ...this.enemies] : this.enemies;
        if (potentialTargets.length > 0) {
            let closest = potentialTargets[0];
            let minDist = Infinity;
            potentialTargets.forEach(e => {
                const d = Math.pow(e.x - this.player.x, 2) + Math.pow(e.y - this.player.y, 2);
                if (d < minDist) { minDist = d; closest = e; }
            });
            const dist = Math.sqrt(minDist);
            targetDir = { dx: (closest.x - this.player.x) / dist, dy: (closest.y - this.player.y) / dist };
        }

        // Joueur (Délégation de la logique de tir/arme)
        this.player.update(deltaTime, this.input.getMovement(), {
            targetDir,
            onShoot: (x, y, dx, dy, stats) => this.spawnProjectile(x, y, dx, dy, stats),
            enemies: this.enemies,
            boss: this.boss,
            handleAOE: (x, y, r, d) => this.handleAOE(x, y, r, d)
        });

        this.constrainPlayer();

        // Explosions éphémères
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.timer -= deltaTime;

            // Si l'explosion a un animateur, on le met à jour
            if (exp.visuals && !exp.animator) {
                exp.animator = new Animator(exp.visuals, this.dataManager.assetManager);
            }

            if (exp.animator) {
                exp.animator.update(deltaTime, { velocity: { x: 0, y: 0 } });
            }

            if (exp.timer <= 0) this.explosions.splice(i, 1);
        }

        // Spawns (Système de Jauges Parallèles)
        if (!this.boss && this.currentPhase.enemy_types?.length > 0) {
            const phase = this.currentPhase;
            const types = phase.enemy_types;
            const diffMult = phase.difficulty_multiplier || 1.0;
            const baseGrowth = phase.threat_growth_rate || 5.0;

            const phaseProgress = Math.min(1.0, this.phaseTimer / (phase.duration_before_boss || 60));
            const progressionBonus = baseGrowth * phaseProgress;
            const levelBonus = (this.player.stats.level - 1) * 2;
            const weaponBonus = (this.player.weapons.length - 1) * 5;

            const totalGrowthPerSec = (baseGrowth + progressionBonus + levelBonus + weaponBonus) * diffMult;
            this.lastThreatGrowth = Math.round(totalGrowthPerSec * 10) / 10;

            // On divise le gain total équitablement entre toutes les jauges actives
            const growthPerType = (totalGrowthPerSec * (deltaTime / 1000)) / types.length;

            types.forEach(type => {
                if (this.threatBudgets[type] === undefined) this.threatBudgets[type] = 0;
                this.threatBudgets[type] += growthPerType;

                // Cap de sécurité pour éviter l'accumulation infinie si on ne spawn pas
                const enemyData = this.dataManager.getEnemyData(type);
                const cost = enemyData?.threatLevel || 10;
                if (this.threatBudgets[type] > cost * 5) this.threatBudgets[type] = cost * 5;
            });

            this.trySpawnEnemy();
        }

        this.updateGameEntities(deltaTime);
    }

    constrainPlayer() {
        const p = this.player;
        p.x = Math.max(p.radius, Math.min(this.logicalWidth - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(this.logicalHeight - p.radius, p.y));
    }

    updateGameEntities(deltaTime) {
        // Projectiles joueur (Logic de collision déléguée au projectile)
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);

            const targets = this.boss ? [this.boss, ...this.enemies] : this.enemies;
            for (const t of targets) {
                if (CombatSystem.checkCollision(p, t)) {
                    p.hit(t, { enemies: this.enemies, boss: this.boss, explosions: this.explosions });
                    break;
                }
            }

            if (p.isOutOfBounds(this.logicalWidth, this.logicalHeight) || p.toRemove) this.projectiles.splice(i, 1);
        }

        // Projectiles ennemis
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const ep = this.enemyProjectiles[i];
            ep.update(deltaTime);
            if (this.player && CombatSystem.checkCollision(ep, this.player)) {
                // Utilise hit() au lieu de takeDamage() pour appliquer tous les effets (poison, slow, etc.)
                ep.hit(this.player, {
                    player: this.player,
                    enemies: [this.player], // Pour l'AOE ennemie, la cible est le joueur
                    explosions: this.explosions
                });
            }
            if (ep.isOutOfBounds(this.logicalWidth, this.logicalHeight) || ep.toRemove) this.enemyProjectiles.splice(i, 1);
        }

        // Loots
        for (let i = this.loots.length - 1; i >= 0; i--) {
            const l = this.loots[i];
            if (!l.isFollowing && this.player && CombatSystem.checkCollision(l, { x: this.player.x, y: this.player.y, radius: this.player.stats.pickupRadius })) l.isFollowing = true;
            l.update(deltaTime, this.player);
            if (l.toRemove) {
                if (l.type === 'xp') {
                    this.player.addXP(l.value);
                } else {
                    // Pour les bonus d'armes, on ne lance l'interface que s'il y a quelque chose à gagner
                    if (this.canGetWeaponReward()) {
                        this.player.pendingWeaponUpgrade = true;
                    } else {
                        // Fallback silencieux : un peu d'XP bonus si tout est déjà maxé
                        this.player.addXP(50);
                    }
                }
                this.loots.splice(i, 1);
            }
        }

        // Ennemis
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(deltaTime, this.player, {
                onEnemyShoot: (x, y, dx, dy, stats) => this.spawnEnemyProjectile(x, y, dx, dy, stats),
                logicalWidth: this.logicalWidth,
                logicalHeight: this.logicalHeight
            });
            if (this.player && CombatSystem.checkCollision(this.player, e)) {
                this.player.takeDamage(e.damage * (deltaTime / 1000));
            }
            if (e.toRemove) {
                if (e.hp <= 0) {
                    this.killCount++;
                    // Drop d'XP éclaté en plusieurs orbes pour plus de satisfaction
                    const totalXp = e.xpValue || 10;
                    const orbValue = 1; // 1 orbe pour 1 exp pour un maximum d'effet visuel
                    const numOrbs = totalXp;
                    const remainingXp = totalXp % orbValue;

                    for (let j = 0; j < numOrbs; j++) {
                        // On ajoute un petit décalage aléatoire pour que les boules ne soient pas parfaitement superposées
                        const offsetX = (Math.random() - 0.5) * 30;
                        const offsetY = (Math.random() - 0.5) * 30;
                        const value = orbValue + (j === numOrbs - 1 ? remainingXp : 0);
                        this.spawnLoot(e.x + offsetX, e.y + offsetY, value, 'xp');
                    }

                    // Chance de dropper un bonus d'arme (indépendant de l'XP)
                    const dropRate = this.currentPhase.weapon_drop_rate !== undefined ? this.currentPhase.weapon_drop_rate : 0.15;
                    if (Math.random() < dropRate && this.canGetWeaponReward()) {
                        this.spawnLoot(e.x, e.y, 1, 'weapon');
                    }
                }
                this.enemies.splice(i, 1);
            }
        }

        // Boss
        if (this.boss) {
            this.boss.update(deltaTime, this.player, (x, y, dx, dy, stats) => this.spawnEnemyProjectile(x, y, dx, dy, stats), {
                logicalWidth: this.logicalWidth,
                logicalHeight: this.logicalHeight
            });
            if (this.player && CombatSystem.checkCollision(this.player, this.boss)) this.player.takeDamage(this.boss.damage * (deltaTime / 1000));
            if (this.boss.hp <= 0) {
                this.killCount++;
                this.boss = null;
                this.handlePhaseWin();
            }
        }
    }

    handlePhaseWin() {
        // Sauvegarde de la progression
        if (this.saveSystem) {
            this.saveSystem.saveProgress(this.currentPhaseIndex + 1);
        }

        if (this.currentPhase.transition_outro_id) {
            const transition = this.dataManager.getTransitionData(this.currentPhase.transition_outro_id);
            if (transition) {
                this.openStory(transition.pages, () => {
                    this.state = GameState.VICTORY;
                    if (this.victoryScreen) this.victoryScreen.reset();
                });
                return;
            }
        }

        if (this.currentPhase.story_outro && this.currentPhase.story_outro.length > 0) {
            this.openStory(this.currentPhase.story_outro, () => {
                this.state = GameState.VICTORY;
                if (this.victoryScreen) this.victoryScreen.reset();
            });
        } else {
            this.state = GameState.VICTORY;
            if (this.victoryScreen) this.victoryScreen.reset();
        }
    }

    handleAOE(x, y, r, d) { CombatSystem.handleAOE({ x, y, radius: r, damage: d, enemies: this.enemies, boss: this.boss, explosions: this.explosions }); }

    handlePlayerDeath() {
        if (this.currentPhase && this.currentPhase.transition_defeat_id) {
            const transition = this.dataManager.getTransitionData(this.currentPhase.transition_defeat_id);
            if (transition) {
                this.openStory(transition.pages, () => {
                    this.exitFullscreen();
                    this.state = GameState.MENU;
                });
                return;
            }
        }

        // Fallback standard
        this.exitFullscreen();
        this.state = GameState.GAMEOVER;
    }

    /**
     * Vérifie si le joueur peut encore recevoir une récompense d'arme
     * (nouvelle arme ou amélioration d'une arme existante).
     */
    canGetWeaponReward() {
        if (!this.player || !this.currentPhase) return false;

        // 1. Reste-t-il des armes à découvrir ?
        const availablePool = (this.currentPhase.available_weapons || [])
            .filter(id => !this.player.weapons.find(w => w.id === id));

        if (availablePool.length > 0) return true;

        // 2. Reste-t-il des améliorations d'armes possibles ?
        const canUpgrade = this.player.weapons.some(w => w.level <= (w.upgrades?.length || 0));

        return canUpgrade;
    }

    openUpgradeMenu() {
        this.state = GameState.UPGRADE;
        this.upgradeOptions = this.upgradeSystem.getRandomOptions(3);
        if (this.levelUpScreen) this.levelUpScreen.reset();
    }
    openWeaponMenu() {
        this.upgradeOptions = [];

        // 1. Collecter toutes les options possibles (Nouvelles armes + Améliorations d'armes existantes)
        const possibleOptions = [];

        // Nouvelles armes non possédées
        const newWeaponsPool = (this.currentPhase.available_weapons || [])
            .filter(id => !this.player.weapons.find(w => w.id === id))
            .map(id => this.dataManager.getWeaponData(id))
            .filter(w => w);

        newWeaponsPool.forEach(w => possibleOptions.push({ ...w, isNewWeapon: true }));

        // Améliorations possibles pour chaque arme déjà possédée
        const upgradeableWeapons = this.player.weapons.filter(w => w.level <= (w.upgrades?.length || 0));
        upgradeableWeapons.forEach(weapon => {
            possibleOptions.push({
                type: 'upgrade',
                weaponId: weapon.id,
                name: `Améliorer ${weapon.name}`,
                description: `Passe au niveau ${weapon.level + 1}`,
                originalWeapon: weapon // Optionnel, utile pour l'affichage si besoin
            });
        });

        // 2. Mélanger et prendre jusqu'à 3 options
        this.upgradeOptions = possibleOptions
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        // Si aucune option n'est disponible (cas où tout est maxé)
        if (this.upgradeOptions.length === 0) {
            this.player.pendingWeaponUpgrade = false;
            this.state = GameState.PLAYING;
            return;
        }

        this.state = GameState.WEAPON_MENU;
        if (this.weaponMenuScreen) this.weaponMenuScreen.reset();
    }

    spawnBoss() {
        const bossId = this.currentPhase.boss_id;
        const bossStats = this.dataManager.getBossData(bossId);
        if (bossStats) {
            this.boss = new Boss(this.logicalWidth / 2, -100, bossStats, this.dataManager.assetManager);
            this.saveSystem.saveDiscoveredEntity('boss', bossId);

            // Équiper l'arme si présente sur le boss
            if (bossStats.weapon_id) {
                const weaponData = this.dataManager.data.weapons.weapons.find(w => w.id === bossStats.weapon_id);
                if (weaponData) {
                    this.boss.weapon = WeaponFactory.create(weaponData, this.dataManager.assetManager);
                }
            }
        } else {
            console.error(`Boss ID inconnu : ${bossId}`);
        }
    }
    trySpawnEnemy() {
        // On parcourt chaque budget individuel
        Object.keys(this.threatBudgets).forEach(type => {
            const enemyData = this.dataManager.getEnemyData(type);
            if (!enemyData) return;

            const cost = enemyData.threatLevel || 10;

            // On peut faire spawner plusieurs fois si on a accumulé beaucoup (ex: petits mobs)
            // Limité à 5 pour la performance
            let count = 0;
            while (this.threatBudgets[type] >= cost && count < 5) {
                this.spawnSpecificEnemy(type, enemyData);
                this.threatBudgets[type] -= cost;
                count++;
            }
        });
    }

    spawnSpecificEnemy(type, enemyData) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * this.logicalWidth; y = -50; }
        else if (side === 1) { x = Math.random() * this.logicalWidth; y = this.logicalHeight + 50; }
        else if (side === 2) { x = -50; y = Math.random() * this.logicalHeight; }
        else { x = this.logicalWidth + 50; y = Math.random() * this.logicalHeight; }

        const enemy = new Enemy(x, y, enemyData, this.dataManager.assetManager);

        // Équiper l'arme si présente
        if (enemyData.weapon_id) {
            const weaponData = this.dataManager.data.weapons.weapons.find(w => w.id === enemyData.weapon_id);
            if (weaponData) {
                enemy.weapon = WeaponFactory.create(weaponData, this.dataManager.assetManager);
                if (enemy.weapon) {
                    enemy.weapon.stats.damage = enemy.weapon.stats.damage || 5;
                }
            }
        }

        this.enemies.push(enemy);
        this.saveSystem.saveDiscoveredEntity('monstres', type);
    }

    spawnLoot(x, y, v, t) {
        let visuals = null;
        const path = (t === 'xp') ? this.currentPhase.xp_visual : this.currentPhase.weapon_visual;

        if (path) {
            const size = (t === 'xp') ? (this.currentPhase.xp_size || 20) : (this.currentPhase.weapon_size || 30);
            visuals = {
                width: size,
                height: size,
                animations: {
                    idle: {
                        frames: [path],
                        frameRate: 1,
                        loop: true
                    }
                }
            };
        }

        const loot = new Loot(x, y, v, t, this.dataManager.assetManager, visuals);
        // On ajuste le rayon de la hitbox en fonction de la taille visuelle personnalisée
        if (visuals) {
            loot.radius = visuals.width / 2;
        }
        this.loots.push(loot);
    }
    spawnProjectile(x, y, dx, dy, s) { this.projectiles.push(new Projectile(x, y, dx, dy, s, this.dataManager.assetManager)); }
    spawnEnemyProjectile(x, y, dx, dy, s = null) {
        const stats = s || { projectileSpeed: 200, damage: 10, color: '#f0f' };
        this.enemyProjectiles.push(new Projectile(x, y, dx, dy, stats, this.dataManager.assetManager));
    }

    draw() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Application de la mise à l'échelle logique
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);

        // Background Particles
        this.drawBackground();

        if (this.state === GameState.MENU && this.mainMenu) {
            this.mainMenu.draw(this.ctx);
            this.ctx.restore();
            return;
        }

        // COUCHE 1 : Les zones d'auras (Tout en dessous)
        if (this.player) this.player.drawAuras(this.ctx);
        this.enemies.forEach(e => e.drawAuras(this.ctx));
        if (this.boss) this.boss.drawAuras(this.ctx);

        // COUCHE 2 : Les butins (XP, bonus)
        this.loots.forEach(l => l.draw(this.ctx));

        // COUCHE 3 : Les projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemyProjectiles.forEach(ep => ep.draw(this.ctx));

        // COUCHE 4 : Les personnages (Sprites et corps)
        this.enemies.forEach(e => e.draw(this.ctx));
        if (this.boss) this.boss.draw(this.ctx);
        if (this.player) {
            this.player.draw(this.ctx);
            // Explosions avec dégradé ou sprite
            this.explosions.forEach(exp => {
                const progress = 1 - (exp.timer / exp.maxTimer); // 0 (start) to 1 (end)
                const growthFactor = Math.min(1, progress * 5); // Arrive à 100% de taille en 20% du temps
                const currentRadius = exp.radius * growthFactor;
                const alpha = exp.timer / exp.maxTimer;

                if (exp.animator) {
                    // Rendu via l'animateur si disponible
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    exp.animator.draw(this.ctx, exp.x, exp.y, 0, {
                        width: currentRadius * 2,
                        height: currentRadius * 2
                    });
                    this.ctx.restore();
                } else {
                    // Fallback sur le dégradé standard
                    const grad = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, currentRadius);
                    grad.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
                    grad.addColorStop(0.5, `rgba(255, 50, 0, ${alpha * 0.5})`);
                    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    this.ctx.beginPath();
                    this.ctx.arc(exp.x, exp.y, currentRadius, 0, Math.PI * 2);
                    this.ctx.fillStyle = grad;
                    this.ctx.fill();
                }
            });
            this.drawUI();
        }

        if (this.state === GameState.STORY) this.drawStory();
        if (this.state === GameState.UPGRADE && this.levelUpScreen) this.levelUpScreen.draw(this.ctx);
        if (this.state === GameState.WEAPON_MENU && this.weaponMenuScreen) this.weaponMenuScreen.draw(this.ctx);
        if (this.state === GameState.VICTORY && this.victoryScreen) this.victoryScreen.draw(this.ctx);
        if (this.state === GameState.PHASE_SELECTION && this.phaseSelectionScreen) {
            this.phaseSelectionScreen.draw(this.ctx);
            this.ctx.restore();
            return;
        }
        if (this.state === GameState.BESTIARY && this.bestiaryScreen) {
            this.bestiaryScreen.draw(this.ctx);
            this.ctx.restore();
            return;
        }

        if (this.state === GameState.GAMEOVER) {
            // On ne dessine pas le "GAME OVER" si on utilise déjà une image de défaite (normalement déjà passé au MENU)
            // Mais au cas où, on garde l'affichage standard
            this.drawEndScreen('GAME OVER', '#f00');
        }

        this.ctx.restore();

        // Le joystick utilise les coordonnées écran brutes, donc on le dessine hors du scale
        this.input.draw(this.ctx);

        if (this.debugMode) {
            this.drawDebug();
        }
    }

    drawDebug() {
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        this.ctx.lineWidth = 1;

        // Draw Player Hitbox
        if (this.player) {
            this.ctx.strokeStyle = '#0f0'; // Green for player
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw Enemy Hitboxes
        this.enemies.forEach(e => {
            // Cercle de physique (radius)
            this.ctx.strokeStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Cercle de détection (bounding radius pour pixel-perfect)
            if (e.visuals?.pixelPerfect && e.animator) {
                const broadRadius = Math.max(e.animator.width || 0, e.animator.height || 0, e.radius);
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(e.x, e.y, broadRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        });

        // Draw Boss Hitbox
        if (this.boss) {
            this.ctx.strokeStyle = '#f0f';
            this.ctx.beginPath();
            this.ctx.arc(this.boss.x, this.boss.y, this.boss.radius, 0, Math.PI * 2);
            this.ctx.stroke();

            if (this.boss.visuals?.pixelPerfect && this.boss.animator) {
                const broadRadius = Math.max(this.boss.animator.width || 0, this.boss.animator.height || 0, this.boss.radius);
                this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(this.boss.x, this.boss.y, broadRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }

        // Draw Projectile Hitboxes
        this.ctx.strokeStyle = '#ff0'; // Yellow for projectiles
        this.projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        });

        this.enemyProjectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        });

        // Debug Panel (Top Left)
        const panelX = 10;
        const panelY = 150;
        const panelW = 350;
        const typesCount = Object.keys(this.threatBudgets).length;
        const panelH = 60 + (typesCount * 25);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        this.ctx.strokeStyle = '#0f0';
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);

        this.ctx.fillStyle = '#0f0';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`DEBUG - ENNEMIS: ${this.enemies.length}`, panelX + 10, panelY + 25);
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`CROIDDANCE TOTALE: +${this.lastThreatGrowth || 0}/s`, panelX + 10, panelY + 45);

        Object.entries(this.threatBudgets).forEach(([type, budget], i) => {
            const enemyData = this.dataManager.getEnemyData(type);
            const cost = enemyData?.threatLevel || 10;
            const progress = Math.min(1, budget / cost);
            const name = enemyData?.name || type;
            const y = panelY + 70 + (i * 25);

            // Label
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`${name.substring(0, 15)}:`, panelX + 10, y);

            // Gauge bg
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(panelX + 140, y - 10, 150, 12);

            // Gauge fill
            this.ctx.fillStyle = progress >= 1 ? '#0f0' : '#0af';
            this.ctx.fillRect(panelX + 140, y - 10, 150 * progress, 12);

            // Values
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`${Math.floor(budget)}/${cost}`, panelX + 300, y);
        });

        this.ctx.restore();
    }

    drawStory() {
        const ctx = this.ctx;
        const w = this.logicalWidth;
        const h = this.logicalHeight;
        const page = this.storyQueue[this.storyPageIndex];

        // Background (page specific background)
        if (page.background && this.dataManager.assetManager.isLoaded(page.background)) {
            const bgImg = this.dataManager.assetManager.getImage(page.background);
            this.drawImageCover(ctx, bgImg, w, h);
            // Plus d'overlay sombre pour laisser l'image de fond totalement claire
        } else {
            // Fond noir total si aucune image n'est définie
            ctx.fillStyle = 'rgba(0, 0, 0, 1)';
            ctx.fillRect(0, 0, w, h);
        }

        // Illustration image (if present)
        if (page.image && this.dataManager.assetManager.isLoaded(page.image)) {
            const img = this.dataManager.assetManager.getImage(page.image);
            const scale = Math.min(w / img.width, (h * 0.4) / img.height);
            const imgW = img.width * scale;
            const imgH = img.height * scale;
            ctx.drawImage(img, w / 2 - imgW / 2, 100, imgW, imgH);
        }

        // Final prompt
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 18px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.strokeText('CLIQUE POUR CONTINUER...', w / 2, h - 50);
        ctx.fillText('CLIQUE POUR CONTINUER...', w / 2, h - 50);

        // Story content box
        if (!page.hideTitle || !page.hideText) {
            const boxW = Math.min(w * 0.8, 800);
            const boxH = 300;
            const boxX = w / 2 - boxW / 2;
            const boxY = h / 2 + 100 - boxH / 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = page.titleColor || '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // Title
            if (!page.hideTitle) {
                ctx.fillStyle = page.titleColor || '#3b82f6';
                const titleSize = page.titleSize || 32;
                ctx.font = `bold ${titleSize}px Inter, Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(page.title || 'HISTOIRE', w / 2, boxY + 60);
            }

            // Text
            if (!page.hideText) {
                ctx.fillStyle = page.textColor || 'white';
                const textSize = page.textSize || 20;
                ctx.font = `${textSize}px Inter, Arial`;
                ctx.textAlign = 'center';
                const textY = page.hideTitle ? boxY + 60 : boxY + 120;
                this.wrapText(ctx, page.text || '', w / 2, textY, boxW - 80, textSize + 10);
            }
        }
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, testY);
                line = words[n] + ' ';
                testY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, testY);
    }

    /**
     * Dessine une image pour qu'elle remplisse un rectangle sans déformation (comme object-fit: cover)
     */
    drawImageCover(ctx, img, targetW, targetH) {
        const imgW = img.width;
        const imgH = img.height;
        const targetRatio = targetW / targetH;
        const imgRatio = imgW / imgH;

        let sX, sY, sW, sH;

        if (imgRatio > targetRatio) {
            // L'image est plus large que la zone : on coupe les côtés
            sH = imgH;
            sW = imgH * targetRatio;
            sX = (imgW - sW) / 2;
            sY = 0;
        } else {
            // L'image est plus haute que la zone : on coupe le haut et le bas
            sW = imgW;
            sH = imgW / targetRatio;
            sX = 0;
            sY = (imgH - sH) / 2;
        }

        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetW, targetH);
    }

    openStory(queue, callback) {
        this.storyQueue = queue;
        this.storyPageIndex = 0;
        this.onStoryComplete = callback;
        this.state = GameState.STORY;
    }

    nextStoryPage() {
        this.storyPageIndex++;
        if (this.storyPageIndex >= this.storyQueue.length) {
            if (this.onStoryComplete) this.onStoryComplete();
        }
    }

    drawBackground() {
        // Dessiner l'image de fond si elle existe
        if (this.currentPhase && this.currentPhase.background_image) {
            const img = this.dataManager.assetManager.getImage(this.currentPhase.background_image);
            if (img) {
                // Utilisation de drawImageCover pour éviter la déformation
                this.drawImageCover(this.ctx, img, this.logicalWidth, this.logicalHeight);
                return; // On ne dessine pas la grille si on a une image de fond
            }
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        const spacing = 100;
        for (let x = 0; x < this.logicalWidth; x += spacing) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.logicalHeight); this.ctx.stroke();
        }
        for (let y = 0; y < this.logicalHeight; y += spacing) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.logicalWidth, y); this.ctx.stroke();
        }
    }

    drawMenu() {
        const ctx = this.ctx;
        const w = this.logicalWidth;
        const h = this.logicalHeight;

        // Title with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0af';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EVG ANTHONY', w / 2, h / 2 - 100);
        ctx.font = '24px Inter, Arial';
        ctx.fillText('SURVIVOR EDITION', w / 2, h / 2 - 60);
        ctx.shadowBlur = 0;

        // Buttons
        this.drawButton(w / 2, h / 2 + 50, 'NOUVELLE PARTIE', '#0af');
        if (this.saveSystem.getProgress() > 0) {
            this.drawButton(w / 2, h / 2 + 130, 'CONTINUER', '#0f0');
        }
    }

    drawButton(x, y, text, color) {
        const ctx = this.ctx;
        const bW = 250;
        const bH = 60;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x - bW / 2, y - bH / 2, bW, bH);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - bW / 2, y - bH / 2, bW, bH);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }

    drawUI() {
        const ctx = this.ctx;
        const p = this.player;
        const w = this.logicalWidth;
        const h = this.logicalHeight;

        // === XP BAR (TOP - Full width with gradient) ===
        const xpBarHeight = 16;
        const xpBarY = 15;
        const xpBarPadding = 60;
        const xpBarWidth = w - xpBarPadding * 2;
        const xpRatio = Math.min(1, p.stats.xp / p.stats.xpNextLevel);

        // XP Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.roundRect(ctx, xpBarPadding, xpBarY, xpBarWidth, xpBarHeight, 8);
        ctx.fill();

        // XP Fill with gradient
        if (xpRatio > 0) {
            const xpGrad = ctx.createLinearGradient(xpBarPadding, 0, xpBarPadding + xpBarWidth, 0);
            xpGrad.addColorStop(0, '#22C55E');
            xpGrad.addColorStop(0.5, '#16A34A');
            xpGrad.addColorStop(1, '#15803D');
            ctx.fillStyle = xpGrad;
            this.roundRect(ctx, xpBarPadding, xpBarY, xpBarWidth * xpRatio, xpBarHeight, 8);
            ctx.fill();
        }

        // XP Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, xpBarPadding, xpBarY, xpBarWidth, xpBarHeight, 8);
        ctx.stroke();

        // Level indicator
        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 14px Inter, Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`LVL ${p.stats.level}`, w - xpBarPadding + 45, xpBarY + xpBarHeight / 2);

        // === TOP LEFT: Phase Info & Boss Timer ===
        const infoY = 50;

        // Phase name with background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.roundRect(ctx, 20, infoY - 12, 280, 70, 8);
        ctx.fill();

        ctx.fillStyle = '#00D4FF';
        ctx.font = 'bold 16px Inter, Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`PHASE ${this.currentPhaseIndex + 1}`, 30, infoY);

        ctx.fillStyle = '#F8FAFC';
        ctx.font = '13px Inter, Arial';
        ctx.fillText(this.currentPhase.name || 'En cours...', 30, infoY + 20);

        // Boss timer or Kills counter
        if (this.currentPhase.duration_before_boss && !this.boss) {
            const timeLeft = Math.max(0, this.currentPhase.duration_before_boss - this.phaseTimer);
            const minutes = Math.floor(timeLeft / 60);
            const seconds = Math.floor(timeLeft % 60);
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            ctx.fillStyle = timeLeft < 30 ? '#EF4444' : '#FBBF24';
            ctx.font = 'bold 14px JetBrains Mono, monospace';
            ctx.fillText(`Boss dans ${timeStr}`, 30, infoY + 38);
        } else if (this.boss) {
            ctx.fillStyle = '#EF4444';
            ctx.font = 'bold 14px Inter, Arial';
            ctx.fillText(`👾 BOSS ACTIF!`, 30, infoY + 38);
        } else {
            ctx.fillStyle = '#94A3B8';
            ctx.font = '13px Inter, Arial';
            ctx.fillText(`💀 Kills: ${this.killCount}`, 30, infoY + 38);
        }

        // === TOP RIGHT: Weapons Panel ===
        if (this.player.weapons.length > 0) {
            const panelWidth = 220;
            const panelX = w - panelWidth - 20;
            const panelY = infoY - 12;
            const lineHeight = 22;
            const panelHeight = 30 + this.player.weapons.length * lineHeight;

            // Panel background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 8);
            ctx.fill();

            // Header
            ctx.fillStyle = '#A855F7';
            ctx.font = 'bold 12px Inter, Arial';
            ctx.textAlign = 'left';
            ctx.fillText('⚔️ ARMES', panelX + 12, panelY + 14);

            // Weapons list
            ctx.font = '13px Inter, Arial';
            this.player.weapons.forEach((weapon, i) => {
                const lineY = panelY + 32 + i * lineHeight;

                // Weapon name
                ctx.fillStyle = '#F8FAFC';
                ctx.textAlign = 'left';
                let name = weapon.name;
                if (name.length > 16) name = name.substring(0, 14) + '...';
                ctx.fillText(name, panelX + 12, lineY);

                // Level badge
                ctx.fillStyle = '#00D4FF';
                ctx.font = 'bold 11px JetBrains Mono, monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`LV.${weapon.level}`, panelX + panelWidth - 12, lineY);
                ctx.font = '13px Inter, Arial';
            });
        }

        // === BOTTOM CENTER: HP Bar ===
        const hpW = 350;
        const hpH = 28;
        const hpX = w / 2 - hpW / 2;
        const hpY = h - 55;
        const hpRatio = Math.max(0, Math.min(1, p.stats.hp / p.stats.maxHp));

        // HP Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.roundRect(ctx, hpX, hpY, hpW, hpH, 6);
        ctx.fill();

        // HP Fill with gradient (color changes based on health)
        if (hpRatio > 0) {
            const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
            if (hpRatio > 0.5) {
                hpGrad.addColorStop(0, '#22C55E');
                hpGrad.addColorStop(1, '#16A34A');
            } else if (hpRatio > 0.25) {
                hpGrad.addColorStop(0, '#FBBF24');
                hpGrad.addColorStop(1, '#F59E0B');
            } else {
                hpGrad.addColorStop(0, '#EF4444');
                hpGrad.addColorStop(1, '#DC2626');
            }
            ctx.fillStyle = hpGrad;
            this.roundRect(ctx, hpX, hpY, hpW * hpRatio, hpH, 6);
            ctx.fill();
        }

        // HP Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, hpX, hpY, hpW, hpH, 6);
        ctx.stroke();

        // HP Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.ceil(p.stats.hp)} / ${p.stats.maxHp}`, w / 2, hpY + hpH / 2);

        // Debug info (only if ?debug in URL)
        if (window.location.search.includes('debug')) {
            ctx.fillStyle = '#ff5555';
            ctx.font = '12px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            const totalAcc = Math.floor(Object.values(this.threatBudgets).reduce((a, b) => a + b, 0));
            ctx.fillText(`MENACE: ${totalAcc} PM (+${this.lastThreatGrowth || 0}/s)`, 30, h - 80);
        }
    }

    // Helper for rounded rectangles
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    drawChoiceMenu(title, color, optionHeight = 80) {
        const ctx = this.ctx;
        const w = this.logicalWidth;
        const h = this.logicalHeight;

        // Overlay transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = color;
        ctx.font = 'bold 40px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, w / 2, 100);

        const menuWidth = 400;
        const startX = w / 2 - menuWidth / 2;
        const startY = 150;

        this.upgradeOptions.forEach((opt, i) => {
            const optY = startY + i * (optionHeight + 20);

            // Background with hover logic (approximative for drawing)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(startX, optY, menuWidth, optionHeight);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, optY, menuWidth, optionHeight);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Inter, Arial';
            ctx.textAlign = 'left';
            ctx.fillText(opt.name, startX + 20, optY + 35);

            ctx.font = '14px Inter, Arial';
            ctx.fillStyle = '#ccc';
            ctx.fillText(opt.description || 'Amélioration mystérieuse...', startX + 20, optY + 60);

            if (opt.id === 'upgrade_current') {
                ctx.fillStyle = '#0f0';
                ctx.fillText('AMÉLIORATION', startX + menuWidth - 110, optY + 35);
            }
        });
    }

    drawEndScreen(text, color) {
        const ctx = this.ctx;
        const w = this.logicalWidth;
        const h = this.logicalHeight;
        const centerX = w / 2;
        const centerY = h / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, w, h);

        // Titre Game Over
        ctx.fillStyle = color;
        ctx.font = 'bold 80px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, centerX, centerY - 120);

        // Stats
        ctx.fillStyle = 'white';
        ctx.font = '24px Inter, Arial';
        ctx.fillText(`KILLS: ${this.killCount}`, centerX, centerY - 40);

        // --- Bouton unique : RETOUR AU MENU ---
        const btnW = 320;
        const btnH = 60;
        const btnX = centerX - btnW / 2;
        const btnY = centerY + 40;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        this.roundRect(ctx, btnX, btnY, btnW, btnH, 10);
        ctx.fill();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 20px Inter, Arial';
        ctx.fillText('RETOUR AU MENU', centerX, btnY + btnH / 2 + 7);
    }

}
window.addEventListener('load', () => { new Game(); });
