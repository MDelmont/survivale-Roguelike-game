import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { Projectile } from '../entities/Projectile.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Loot } from '../entities/Loot.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { DataManager } from './DataManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { WeaponFactory } from '../systems/WeaponFactory.js';

/**
 * GameState Enum
 */
const GameState = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    UPGRADE: 'UPGRADE',
    WEAPON_MENU: 'WEAPON_MENU',
    VICTORY: 'VICTORY',
    GAMEOVER: 'GAMEOVER'
};

/**
 * Game Core Class 
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
        this.explosions = [];
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
        if (!success) return;
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
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

        if (!this.player) {
            const playerStats = this.dataManager.getPlayerData();
            this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, playerStats);
        } else {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2;
            this.player.stats.hp = this.player.stats.maxHp;
        }

        // Arme par défaut via Factory
        if (this.currentPhase.default_weapon) {
            const weaponData = this.dataManager.getWeaponData(this.currentPhase.default_weapon);
            this.player.setWeapon(WeaponFactory.create(weaponData));
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
            if (mouseY < this.canvas.height / 2 + 50) this.startNewGame();
            else this.continueGame();
        } else if (this.state === GameState.UPGRADE) {
            this.handleChoiceMenuClick(mouseX, mouseY, 80, (choice) => {
                this.upgradeSystem.applyUpgrade(this.player, choice);
                this.player.pendingUpgrade = false;
                this.state = GameState.PLAYING;
            });
        } else if (this.state === GameState.WEAPON_MENU) {
            this.handleChoiceMenuClick(mouseX, mouseY, 100, (choice) => {
                if (choice.id === 'upgrade_current') {
                    this.player.weapon.upgrade();
                } else {
                    this.player.setWeapon(WeaponFactory.create(choice));
                }
                this.player.pendingWeaponUpgrade = false;
                this.state = GameState.PLAYING;
            });
        } else if (this.state === GameState.VICTORY || this.state === GameState.GAMEOVER) {
            this.state = GameState.MENU;
        }
    }

    handleChoiceMenuClick(mouseX, mouseY, optionHeight, callback) {
        const menuWidth = 400;
        const startX = this.canvas.width / 2 - menuWidth / 2;
        const startY = 150;
        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const optY = startY + i * (optionHeight + 20);
            if (mouseX >= startX && mouseX <= startX + menuWidth && mouseY >= optY && mouseY <= optY + optionHeight) {
                callback(this.upgradeOptions[i]);
                break;
            }
        }
    }

    startNewGame() { this.player = null; this.startPhase(0); this.state = GameState.PLAYING; }
    continueGame() { this.player = null; this.startPhase(this.saveSystem.getProgress()); this.state = GameState.PLAYING; }

    loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        if (this.state === GameState.PLAYING) this.update(deltaTime);
        this.draw();
        this.updateFPS(deltaTime);
        requestAnimationFrame((time) => this.loop(time));
    }

    update(deltaTime) {
        if (!this.currentPhase || !this.player) return;

        if (this.player.pendingUpgrade) { this.openUpgradeMenu(); return; }
        if (this.player.pendingWeaponUpgrade) { this.openWeaponMenu(); return; }
        if (this.player.stats.hp <= 0) { this.state = GameState.GAMEOVER; return; }

        this.phaseTimer += deltaTime / 1000;
        if (this.phaseTimer >= this.currentPhase.duration_before_boss && !this.boss) this.spawnBoss();

        // Cible pour tir auto
        let targetDir = null;
        let potentialTargets = this.boss ? [this.boss] : this.enemies;
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
            this.explosions[i].timer -= deltaTime;
            if (this.explosions[i].timer <= 0) this.explosions.splice(i, 1);
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
        const p = this.player;
        p.x = Math.max(p.radius, Math.min(this.canvas.width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(this.canvas.height - p.radius, p.y));
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

            if (p.isOutOfBounds(this.canvas.width, this.canvas.height) || p.toRemove) this.projectiles.splice(i, 1);
        }

        // Projectiles ennemis (Simplifié pour le moment)
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const ep = this.enemyProjectiles[i];
            ep.update(deltaTime);
            if (this.player && CombatSystem.checkCollision(ep, this.player)) {
                this.player.takeDamage(ep.damage);
                ep.toRemove = true;
            }
            if (ep.isOutOfBounds(this.canvas.width, this.canvas.height) || ep.toRemove) this.enemyProjectiles.splice(i, 1);
        }

        // Loots
        for (let i = this.loots.length - 1; i >= 0; i--) {
            const l = this.loots[i];
            if (!l.isFollowing && this.player && CombatSystem.checkCollision(l, { x: this.player.x, y: this.player.y, radius: this.player.stats.pickupRadius })) l.isFollowing = true;
            l.update(deltaTime, this.player);
            if (l.toRemove) {
                if (l.type === 'xp') this.player.addXP(l.value);
                else this.player.pendingWeaponUpgrade = true;
                this.loots.splice(i, 1);
            }
        }

        // Ennemis
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(deltaTime, this.player);
            if (this.player && CombatSystem.checkCollision(this.player, e)) { this.player.takeDamage(e.damage); e.toRemove = true; }
            if (e.toRemove) {
                if (e.hp <= 0) {
                    this.killCount++;
                    this.spawnLoot(e.x, e.y, e.xpValue, Math.random() < 0.05 ? 'weapon' : 'xp');
                }
                this.enemies.splice(i, 1);
            }
        }

        // Boss
        if (this.boss) {
            this.boss.update(deltaTime, this.player, (x, y, dx, dy) => this.spawnEnemyProjectile(x, y, dx, dy));
            if (this.player && CombatSystem.checkCollision(this.player, this.boss)) this.player.takeDamage(this.boss.damage * (deltaTime / 1000));
            if (this.boss.hp <= 0) { this.killCount++; this.state = GameState.VICTORY; this.boss = null; }
        }
    }

    handleAOE(x, y, r, d) { CombatSystem.handleAOE({ x, y, radius: r, damage: d, enemies: this.enemies, boss: this.boss, explosions: this.explosions }); }
    openUpgradeMenu() { this.state = GameState.UPGRADE; this.upgradeOptions = this.upgradeSystem.getRandomOptions(3); }
    openWeaponMenu() {
        const pool = (this.currentPhase.available_weapons || []).map(id => this.dataManager.getWeaponData(id)).filter(w => w && w.id !== this.player.weapon?.id);
        this.upgradeOptions = pool.slice(0, 2);
        if (this.player.weapon && this.player.weapon.level <= this.player.weapon.upgrades.length) {
            this.upgradeOptions.push({ id: 'upgrade_current', name: `Améliorer ${this.player.weapon.name}`, description: `Niveau ${this.player.weapon.level + 1}` });
        }
    }

    spawnBoss() { const c = this.currentPhase.boss; this.boss = new Boss(this.canvas.width / 2, -100, { ...c, color: '#f0f' }); }
    spawnEnemy() {
        const type = this.currentPhase.enemy_types[Math.floor(Math.random() * this.currentPhase.enemy_types.length)];
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * this.canvas.width; y = -50; }
        else if (side === 1) { x = Math.random() * this.canvas.width; y = this.canvas.height + 50; }
        else if (side === 2) { x = -50; y = Math.random() * this.canvas.height; }
        else { x = this.canvas.width + 50; y = Math.random() * this.canvas.height; }
        this.enemies.push(new Enemy(x, y, this.dataManager.getEnemyData(type)));
    }

    spawnLoot(x, y, v, t) { this.loots.push(new Loot(x, y, v, t)); }
    spawnProjectile(x, y, dx, dy, s) { this.projectiles.push(new Projectile(x, y, dx, dy, s)); }
    spawnEnemyProjectile(x, y, dx, dy) { this.enemyProjectiles.push(new Projectile(x, y, dx, dy, { speed: 200, damage: 10, color: '#f0f' })); }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.state === GameState.MENU) { this.drawMenu(); return; }
        this.loots.forEach(l => l.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemyProjectiles.forEach(ep => ep.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        if (this.boss) this.boss.draw(this.ctx);
        if (this.player) { this.player.draw(this.ctx); this.drawUI(); }
        this.explosions.forEach(exp => {
            const a = exp.timer / exp.maxTimer;
            this.ctx.beginPath(); this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 100, 0, ${a * 0.4})`; this.ctx.fill();
            this.ctx.strokeStyle = `rgba(255, 200, 0, ${a})`; this.ctx.lineWidth = 2; this.ctx.stroke();
        });
        this.input.draw(this.ctx);
        if (this.state === GameState.UPGRADE) this.drawChoiceMenu('AMÉLIORATION !', '#0af');
        if (this.state === GameState.WEAPON_MENU) this.drawChoiceMenu('ARME !', '#ffd700', 100);
        if (this.state === GameState.VICTORY) this.drawEndScreen('PHASE TERMINÉE !', '#0f0');
        if (this.state === GameState.GAMEOVER) this.drawEndScreen('GAME OVER', '#f00');
    }

    drawMenu() { /* ... simplifiée pour gain de place ... */ }
    drawUI() { /* ... simplifiée ... */ }
    drawChoiceMenu(t, c, h) { /* ... simplifiée ... */ }
    drawEndScreen(t, c) { /* ... simplifiée ... */ }

    updateFPS(dt) {
        this.frameCount++; this.fpsTimer += dt;
        if (this.fpsTimer >= 1000) { this.fps = this.frameCount; this.frameCount = 0; this.fpsTimer = 0; this.fpsCounter.innerText = `FPS: ${this.fps}`; }
    }
}
window.addEventListener('load', () => { new Game(); });
