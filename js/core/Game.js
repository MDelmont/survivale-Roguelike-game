import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { Projectile } from '../entities/Projectile.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Loot } from '../entities/Loot.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { DataManager } from './DataManager.js';

/**
 * GameState Enum
 */
const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    UPGRADE: 'UPGRADE',
    WEAPON_MENU: 'WEAPON_MENU', // Nouveau menu de choix d'arme
    VICTORY: 'VICTORY',
    GAMEOVER: 'GAMEOVER'
};

/**
 * Game Core Class 
 * Gère la boucle principale et l'initialisation du canvas.
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.fpsCounter = document.getElementById('fps-counter');

        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;

        this.input = new Input();
        this.upgradeSystem = new UpgradeSystem();
        this.saveSystem = new SaveSystem();
        this.dataManager = new DataManager();

        this.player = null;
        this.projectiles = [];
        this.enemies = [];
        this.enemyProjectiles = [];
        this.loots = [];
        this.boss = null;

        this.spawnTimer = 0;
        this.currentPhaseIndex = 0;
        this.currentPhase = null;
        this.phaseTimer = 0;
        this.killCount = 0;

        this.state = GameState.MENU;
        this.upgradeOptions = [];

        this.init();
    }

    async init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        const success = await this.dataManager.loadAll();
        if (!success) {
            console.error('Erreur critique: impossible de charger les données du jeu.');
            return;
        }

        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        requestAnimationFrame((time) => this.loop(time));
    }

    startNewGame() {
        this.player = null;
        this.currentPhaseIndex = 0;
        this.killCount = 0;
        this.startPhase(0);
        this.state = GameState.PLAYING;
    }

    continueGame() {
        this.player = null;
        this.killCount = 0;
        const progress = this.saveSystem.getProgress();
        this.startPhase(progress);
        this.state = GameState.PLAYING;
    }

    startPhase(index) {
        this.currentPhaseIndex = index;
        this.currentPhase = this.dataManager.getPhaseData(index);
        this.phaseTimer = 0;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.loots = [];
        this.boss = null;

        if (!this.player) {
            const playerStats = this.dataManager.getPlayerData();
            this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, playerStats);
        } else {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2;
            this.player.stats.hp = this.player.stats.maxHp;
        }

        // Arme par défaut pour la phase
        if (this.currentPhase.default_weapon) {
            const weaponData = this.dataManager.getWeaponData(this.currentPhase.default_weapon);
            if (weaponData) this.player.setWeapon(weaponData);
        }
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.state === GameState.MENU) {
            if (mouseX >= this.canvas.width / 2 - 120 && mouseX <= this.canvas.width / 2 + 120 &&
                mouseY >= this.canvas.height / 2 - 20 && mouseY <= this.canvas.height / 2 + 40) {
                this.startNewGame();
            }
            const progress = this.saveSystem.getProgress();
            if (progress > 0) {
                if (mouseX >= this.canvas.width / 2 - 120 && mouseX <= this.canvas.width / 2 + 120 &&
                    mouseY >= this.canvas.height / 2 + 60 && mouseY <= this.canvas.height / 2 + 120) {
                    this.continueGame();
                }
            }
        } else if (this.state === GameState.UPGRADE) {
            this.handleChoiceMenuClick(mouseX, mouseY, 80, (choice) => {
                this.upgradeSystem.applyUpgrade(this.player, choice);
                this.player.pendingUpgrade = false;
                this.state = GameState.PLAYING;
            });
        } else if (this.state === GameState.WEAPON_MENU) {
            this.handleChoiceMenuClick(mouseX, mouseY, 100, (choice) => {
                if (choice.id === 'upgrade_current') {
                    this.player.upgradeWeapon();
                } else {
                    const weaponData = this.dataManager.getWeaponData(choice.id);
                    if (weaponData) this.player.setWeapon(weaponData);
                }
                this.player.pendingWeaponUpgrade = false;
                this.state = GameState.PLAYING;
            });
        } else if (this.state === GameState.VICTORY) {
            this.saveSystem.saveProgress(this.currentPhaseIndex + 1);
            if (this.currentPhaseIndex + 1 < this.dataManager.data.phases.phases.length) {
                this.startPhase(this.currentPhaseIndex + 1);
                this.state = GameState.PLAYING;
            } else {
                this.state = GameState.MENU;
            }
        } else if (this.state === GameState.GAMEOVER) {
            this.state = GameState.MENU;
        }
    }

    handleChoiceMenuClick(mouseX, mouseY, optionHeight, callback) {
        const menuWidth = 400;
        const startX = this.canvas.width / 2 - menuWidth / 2;
        const startY = 150;

        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const optY = startY + i * (optionHeight + 20);
            if (mouseX >= startX && mouseX <= startX + menuWidth &&
                mouseY >= optY && mouseY <= optY + optionHeight) {
                callback(this.upgradeOptions[i]);
                break;
            }
        }
    }

    loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === GameState.PLAYING) {
            this.update(deltaTime);
        }

        this.draw();
        this.updateFPS(deltaTime);

        requestAnimationFrame((time) => this.loop(time));
    }

    update(deltaTime) {
        if (!this.currentPhase) return;

        if (this.player && this.player.pendingUpgrade) {
            this.openUpgradeMenu();
            return;
        }

        if (this.player && this.player.pendingWeaponUpgrade) {
            this.openWeaponMenu();
            return;
        }

        if (this.player && this.player.stats.hp <= 0) {
            this.state = GameState.GAMEOVER;
            return;
        }

        const movement = this.input.getMovement();
        this.phaseTimer += deltaTime / 1000;

        if (this.phaseTimer >= this.currentPhase.duration_before_boss && !this.boss) {
            this.spawnBoss();
        }

        // Cible pour tir auto
        let targetDir = null;
        if (this.player) {
            let potentialTargets = this.boss ? [this.boss] : this.enemies;
            if (potentialTargets.length > 0) {
                let closest = null;
                let minDist = Infinity;
                potentialTargets.forEach(e => {
                    const dx = e.x - this.player.x;
                    const dy = e.y - this.player.y;
                    const dist = dx * dx + dy * dy;
                    if (dist < minDist) { minDist = dist; closest = e; }
                });
                if (closest) {
                    const dx = closest.x - this.player.x;
                    const dy = closest.y - this.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    targetDir = { dx: dx / dist, dy: dy / dist };
                }
            }
        }

        // Joueur
        if (this.player) {
            this.player.update(deltaTime, movement, (x, y, dx, dy, ws) => {
                this.spawnProjectile(x, y, dx, dy, ws);
            }, targetDir);

            this.constrainPlayer();

            // Logique de bouclier (Défense)
            if (this.player.currentWeapon && this.player.currentWeapon.type === 'defense') {
                const radius = this.player.weaponStats.radius || 60;
                const time = Date.now() / 1000;
                const angle = time * (this.player.weaponStats.orbitSpeed || 2);
                const shieldX = this.player.x + Math.cos(angle) * radius;
                const shieldY = this.player.y + Math.sin(angle) * radius;

                // Collision bouclier-ennemis
                this.enemies.forEach(e => {
                    const dx = e.x - shieldX;
                    const dy = e.y - shieldY;
                    if (Math.sqrt(dx * dx + dy * dy) < (15 + e.radius)) {
                        e.takeDamage(this.player.weaponStats.damage || 5);
                    }
                });
            }
        }

        // Spawns
        if (!this.boss) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.currentPhase.spawn_rate) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }

        this.updateGameEntities(deltaTime);
    }

    constrainPlayer() {
        if (this.player.x < this.player.radius) this.player.x = this.player.radius;
        if (this.player.x > this.canvas.width - this.player.radius) this.player.x = this.canvas.width - this.player.radius;
        if (this.player.y < this.player.radius) this.player.y = this.player.radius;
        if (this.player.y > this.canvas.height - this.player.radius) this.player.y = this.canvas.height - this.player.radius;
    }

    updateGameEntities(deltaTime) {
        // Projectiles joueur
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);
            if (p.isOutOfBounds(this.canvas.width, this.canvas.height) || p.toRemove) {
                this.projectiles.splice(i, 1);
            }
        }

        // Projectiles ennemis
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const ep = this.enemyProjectiles[i];
            ep.update(deltaTime);
            if (this.player && this.checkCollision(ep, this.player)) {
                this.player.takeDamage(10);
                ep.toRemove = true;
            }
            if (ep.isOutOfBounds(this.canvas.width, this.canvas.height) || ep.toRemove) {
                this.enemyProjectiles.splice(i, 1);
            }
        }

        // Loots
        for (let i = this.loots.length - 1; i >= 0; i--) {
            const l = this.loots[i];
            if (!l.isFollowing && this.player) {
                const dx = this.player.x - l.x;
                const dy = this.player.y - l.y;
                if (Math.sqrt(dx * dx + dy * dy) < this.player.stats.pickupRadius) l.isFollowing = true;
            }
            l.update(deltaTime, { x: this.player ? this.player.x : 0, y: this.player ? this.player.y : 0 });
            if (l.toRemove && this.player) {
                if (l.type === 'xp') {
                    this.player.addXP(l.value);
                } else if (l.type === 'weapon') {
                    this.player.pendingWeaponUpgrade = true;
                }
                this.loots.splice(i, 1);
            }
        }

        // Ennemis
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(deltaTime, { x: this.player ? this.player.x : 0, y: this.player ? this.player.y : 0 });

            if (this.player && this.checkCollision(this.player, e)) {
                this.player.takeDamage(e.damage);
                e.toRemove = true;
            }

            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const p = this.projectiles[j];
                if (this.checkCollision(p, e)) {
                    e.takeDamage(p.damage);
                    p.toRemove = true;
                }
            }

            if (e.toRemove) {
                if (e.hp <= 0) {
                    this.killCount++;
                    const isRare = Math.random() < 0.05; // 5% chance pour tester
                    this.spawnLoot(e.x, e.y, e.xpValue, isRare ? 'weapon' : 'xp');
                }
                this.enemies.splice(i, 1);
            }
        }

        // Boss
        if (this.boss) {
            this.updateBoss(deltaTime);
        }
    }

    updateBoss(deltaTime) {
        this.boss.update(deltaTime, { x: this.player ? this.player.x : 0, y: this.player ? this.player.y : 0 }, (x, y, dx, dy) => {
            this.spawnEnemyProjectile(x, y, dx, dy);
        });

        if (this.player && this.checkCollision(this.player, this.boss)) {
            this.player.takeDamage(this.boss.damage * (deltaTime / 1000));
        }

        for (let j = this.projectiles.length - 1; j >= 0; j--) {
            const p = this.projectiles[j];
            if (this.checkCollision(p, this.boss)) {
                this.boss.takeDamage(p.damage);
                p.toRemove = true;
            }
        }

        if (this.boss.hp <= 0) {
            this.killCount++;
            this.state = GameState.VICTORY;
            this.boss = null;
        }
    }

    openUpgradeMenu() {
        this.state = GameState.UPGRADE;
        this.upgradeOptions = this.upgradeSystem.getRandomOptions(3);
    }

    openWeaponMenu() {
        this.state = GameState.WEAPON_MENU;
        // Options : Armes dispo dans la phase + "Améliorer arme actuelle"
        const phaseWeapons = this.currentPhase.available_weapons || [];
        const options = phaseWeapons
            .map(id => this.dataManager.getWeaponData(id))
            .filter(w => w && w.id !== this.player.currentWeapon?.id)
            .slice(0, 2);

        // On ajoute toujours l'option d'amélioration si possible
        if (this.player.currentWeapon && this.player.weaponLevel < this.player.currentWeapon.upgrades.length + 1) {
            options.push({
                id: 'upgrade_current',
                name: `Améliorer ${this.player.currentWeapon.name}`,
                description: `Passe au niveau ${this.player.weaponLevel + 1}`
            });
        }

        this.upgradeOptions = options;
    }

    spawnBoss() {
        this.enemies = [];
        const config = this.currentPhase.boss;
        config.color = '#f0f';
        this.boss = new Boss(this.canvas.width / 2, -100, config);
    }

    spawnEnemy() {
        const types = this.currentPhase.enemy_types;
        const randomType = types[Math.floor(Math.random() * types.length)];
        const enemyConfig = this.dataManager.getEnemyData(randomType);
        let x, y;
        const side = Math.floor(Math.random() * 4);
        const margin = 50;
        if (side === 0) { x = Math.random() * this.canvas.width; y = -margin; }
        else if (side === 1) { x = Math.random() * this.canvas.width; y = this.canvas.height + margin; }
        else if (side === 2) { x = -margin; y = Math.random() * this.canvas.height; }
        else { x = this.canvas.width + margin; y = Math.random() * this.canvas.height; }
        this.enemies.push(new Enemy(x, y, enemyConfig));
    }

    spawnLoot(x, y, value, type = 'xp') {
        this.loots.push(new Loot(x, y, value, type));
    }

    spawnProjectile(x, y, dx, dy, stats) {
        this.projectiles.push(new Projectile(x, y, dx, dy, stats));
    }

    spawnEnemyProjectile(x, y, dx, dy) {
        const p = new Projectile(x, y, dx, dy, { speed: 200, damage: 10 });
        p.color = '#f0f';
        this.enemyProjectiles.push(p);
    }

    checkCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy) < (a.radius + b.radius);
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === GameState.MENU) {
            this.drawMenu();
            return;
        }

        this.loots.forEach(l => l.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemyProjectiles.forEach(ep => ep.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        if (this.boss) this.boss.draw(this.ctx);

        if (this.player) {
            this.player.draw(this.ctx);
            this.drawUI();
        }

        this.input.draw(this.ctx);

        if (this.state === GameState.UPGRADE) this.drawUpgradeMenu();
        if (this.state === GameState.WEAPON_MENU) this.drawWeaponMenu();
        if (this.state === GameState.VICTORY) this.drawVictoryScreen();
        if (this.state === GameState.GAMEOVER) this.drawGameOver();
    }

    drawMenu() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('EVG ANTHONY', this.canvas.width / 2, this.canvas.height / 2 - 120);
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('Prêt pour la grande aventure ?', this.canvas.width / 2, this.canvas.height / 2 - 70);

        this.ctx.fillStyle = '#0af';
        this.ctx.fillRect(this.canvas.width / 2 - 120, this.canvas.height / 2 - 20, 240, 60);
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('NOUVELLE VIE', this.canvas.width / 2, this.canvas.height / 2 + 18);

        const progress = this.saveSystem.getProgress();
        if (progress > 0) {
            this.ctx.fillStyle = '#f0a';
            this.ctx.fillRect(this.canvas.width / 2 - 120, this.canvas.height / 2 + 60, 240, 60);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(`CONTINUER P.${progress + 1}`, this.canvas.width / 2, this.canvas.height / 2 + 98);
        }
    }

    drawUI() {
        const hw = 200;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.canvas.width / 2 - hw / 2, 25, hw, 15);
        this.ctx.fillStyle = '#f00';
        const healthWidth = (this.player.stats.hp / this.player.stats.maxHp) * hw;
        this.ctx.fillRect(this.canvas.width / 2 - hw / 2, 25, Math.max(0, healthWidth), 15);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(this.canvas.width / 2 - hw / 2, 25, hw, 15);

        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, 10);
        this.ctx.fillStyle = '#0af';
        const xpWidth = (this.player.stats.xp / this.player.stats.xpNextLevel) * this.canvas.width;
        this.ctx.fillRect(0, 0, xpWidth, 10);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        const remaining = Math.max(0, this.currentPhase.duration_before_boss - this.phaseTimer);
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        const timerText = this.boss ? "BOSS EN COURS !" : `BOSS DANS: ${mins}:${secs < 10 ? '0' : ''}${secs}`;
        this.ctx.fillText(`${this.currentPhase.name.toUpperCase()} | ${this.player.currentWeapon?.name || 'Pas d\'arme'} Lvl.${this.player.weaponLevel}`, this.canvas.width / 2, 60);
        this.ctx.fillText(timerText, this.canvas.width / 2, 80);

        this.ctx.textAlign = 'left';
        this.ctx.fillText(`NIVEAU: ${this.player.stats.level}`, 20, 30);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`KILLS: ${this.killCount}`, this.canvas.width - 20, 30);
    }

    drawUpgradeMenu() {
        this.drawChoiceMenu('AMÉLIORATION DISPONIBLE !', '#0af');
    }

    drawWeaponMenu() {
        this.drawChoiceMenu('CADEAU D\'ARME !', '#ffd700', 100);
    }

    drawChoiceMenu(title, color, optionHeight = 80) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.canvas.width / 2, 100);

        const menuWidth = 400;
        const startX = this.canvas.width / 2 - menuWidth / 2;
        const startY = 150;

        this.upgradeOptions.forEach((opt, i) => {
            const optY = startY + i * (optionHeight + 20);
            this.ctx.fillStyle = '#222';
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.fillRect(startX, optY, menuWidth, optionHeight);
            this.ctx.strokeRect(startX, optY, menuWidth, optionHeight);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(opt.name, startX + 20, optY + 35);
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#aaa';
            this.ctx.fillText(opt.description || 'Amélioration de niveau', startX + 20, optY + 65);
        });
    }

    drawVictoryScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0f0';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PHASE TERMINÉE !', this.canvas.width / 2, this.canvas.height / 2 - 50);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Cliquez pour continuer l\'aventure', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Tu as survécu assez longtemps pour faire ${this.killCount} victimes.`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Cliquez pour revenir au menu', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    updateFPS(deltaTime) {
        this.frameCount++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
            this.fpsCounter.innerText = `FPS: ${this.fps}`;
        }
    }
}

window.addEventListener('load', () => { new Game(); });
