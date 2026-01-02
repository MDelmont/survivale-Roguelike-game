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

        if (this.currentPhase.default_weapon) {
            const weaponData = this.dataManager.getWeaponData(this.currentPhase.default_weapon);
            this.player.addWeapon(WeaponFactory.create(weaponData));
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
                if (choice.type === 'upgrade') {
                    // Amélioration d'une arme existante spécifique
                    const weapon = this.player.weapons.find(w => w.id === choice.weaponId);
                    if (weapon) weapon.upgrade();
                } else {
                    // Ajout d'une nouvelle arme à l'arsenal
                    this.player.addWeapon(WeaponFactory.create(choice));
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
                    this.spawnLoot(e.x, e.y, e.xpValue, Math.random() < 0.15 ? 'weapon' : 'xp');
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
        this.upgradeOptions = [];

        // 1. Proposer de nouvelles armes que le joueur n'a pas encore
        const availablePool = (this.currentPhase.available_weapons || [])
            .filter(id => !this.player.weapons.find(w => w.id === id))
            .map(id => this.dataManager.getWeaponData(id))
            .filter(w => w);

        // Prendre max 2 nouvelles armes aléatoires
        const newWeapons = availablePool.sort(() => 0.5 - Math.random()).slice(0, 2);
        this.upgradeOptions.push(...newWeapons);

        // 2. Proposer une amélioration pour une arme déjà possédée (si elle a encore des niveaux)
        const upgradeableWeapons = this.player.weapons.filter(w => w.level <= (w.upgrades?.length || 0));
        if (upgradeableWeapons.length > 0) {
            const weaponToUpgrade = upgradeableWeapons[Math.floor(Math.random() * upgradeableWeapons.length)];
            this.upgradeOptions.push({
                type: 'upgrade',
                weaponId: weaponToUpgrade.id,
                name: `Améliorer ${weaponToUpgrade.name}`,
                description: `Passe au niveau ${weaponToUpgrade.level + 1}`
            });
        }

        // S'assurer qu'on a au moins 2 options (cas rare où toutes les armes sont maxées)
        if (this.upgradeOptions.length < 2 && availablePool.length === 0) {
            this.upgradeOptions.push({ name: 'Bonus XP', description: 'Toutes les armes sont au maximum !', id: 'bonus_xp' });
        }

        this.state = GameState.WEAPON_MENU;
    }

    spawnBoss() {
        const bossId = this.currentPhase.boss_id;
        const bossStats = this.dataManager.getBossData(bossId);
        if (bossStats) {
            this.boss = new Boss(this.canvas.width / 2, -100, bossStats);
        } else {
            console.error(`Boss ID inconnu : ${bossId}`);
        }
    }
    spawnEnemy() {
        const type = this.currentPhase.enemy_types[Math.floor(Math.random() * this.currentPhase.enemy_types.length)];
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * this.canvas.width; y = -50; }
        else if (side === 1) { x = Math.random() * this.canvas.width; y = this.canvas.height + 50; }
        else if (side === 2) { x = -50; y = Math.random() * this.canvas.height; }
        else { x = this.canvas.width + 50; y = Math.random() * this.canvas.height; }
        const enemyData = this.dataManager.getEnemyData(type);
        if (!enemyData) {
            console.error(`Type d'ennemi inconnu : ${type}`);
            return;
        }
        this.enemies.push(new Enemy(x, y, enemyData));
    }

    spawnLoot(x, y, v, t) { this.loots.push(new Loot(x, y, v, t)); }
    spawnProjectile(x, y, dx, dy, s) { this.projectiles.push(new Projectile(x, y, dx, dy, s)); }
    spawnEnemyProjectile(x, y, dx, dy) { this.enemyProjectiles.push(new Projectile(x, y, dx, dy, { projectileSpeed: 200, damage: 10, color: '#f0f' })); }

    draw() {
        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Background Particles (Subtle Grid or Stars)
        this.drawBackground();

        if (this.state === GameState.MENU) { this.drawMenu(); return; }

        this.loots.forEach(l => l.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemyProjectiles.forEach(ep => ep.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));

        if (this.boss) this.boss.draw(this.ctx);
        if (this.player) {
            this.player.draw(this.ctx);
            // Explosions avec dégradé
            this.explosions.forEach(exp => {
                const a = exp.timer / exp.maxTimer;
                const grad = this.ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
                grad.addColorStop(0, `rgba(255, 200, 50, ${a})`);
                grad.addColorStop(0.5, `rgba(255, 50, 0, ${a * 0.5})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                this.ctx.beginPath();
                this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = grad;
                this.ctx.fill();
            });
            this.drawUI();
        }

        this.input.draw(this.ctx);

        if (this.state === GameState.UPGRADE) this.drawChoiceMenu('AMÉLIORATION DISPONIBLE !', '#0af');
        if (this.state === GameState.WEAPON_MENU) this.drawChoiceMenu('CHOISIS TON ARME !', '#ffd700', 100);
        if (this.state === GameState.VICTORY) this.drawEndScreen('VICTOIRE !', '#0f0');
        if (this.state === GameState.GAMEOVER) this.drawEndScreen('GAME OVER', '#f00');
    }

    drawBackground() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        const spacing = 100;
        for (let x = 0; x < this.canvas.width; x += spacing) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += spacing) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
        }
    }

    drawMenu() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

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

        // HUD Bottom: HP
        const hpW = 300;
        const hpH = 30;
        const hpX = this.canvas.width / 2 - hpW / 2;
        const hpY = this.canvas.height - 60;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(hpX, hpY, hpW, hpH);
        const ratio = p.stats.hp / p.stats.maxHp;
        const grad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
        grad.addColorStop(0, '#f00');
        grad.addColorStop(1, '#f55');
        ctx.fillStyle = grad;
        ctx.fillRect(hpX, hpY, hpW * ratio, hpH);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(hpX, hpY, hpW, hpH);

        // XP Top
        const xpW = this.canvas.width - 100;
        const xpH = 10;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(50, 20, xpW, xpH);
        const xpRatio = p.stats.xp / p.stats.xpNextLevel;
        ctx.fillStyle = '#0f0';
        ctx.fillRect(50, 20, xpW * xpRatio, xpH);

        // Stats & Phase
        ctx.fillStyle = 'white';
        ctx.font = '14px Inter, Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`PHASE: ${this.currentPhaseIndex + 1} - ${this.currentPhase.name}`, 50, 50);
        ctx.fillText(`KILLS: ${this.killCount}`, 50, 70);

        if (this.player.weapons.length > 0) {
            ctx.textAlign = 'right';
            this.player.weapons.forEach((w, i) => {
                ctx.fillText(`${w.name} (LVL ${w.level})`, this.canvas.width - 50, 50 + i * 20);
            });
        }
    }

    drawChoiceMenu(title, color, optionHeight = 80) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Overlay transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = color;
        ctx.font = 'bold 40px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, w / 2, 100);

        const menuWidth = 400;
        const startX = w / 2 - menuWidth / 2;
        const startY = 180;

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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = color;
        ctx.font = 'bold 80px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 50);

        ctx.fillStyle = 'white';
        ctx.font = '24px Inter, Arial';
        ctx.fillText(`KILLS: ${this.killCount}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        ctx.fillText('CLIQUE POUR RECOMMENCER', this.canvas.width / 2, this.canvas.height / 2 + 100);
    }

    updateFPS(dt) {
        this.frameCount++; this.fpsTimer += dt;
        if (this.fpsTimer >= 1000) { this.fps = this.frameCount; this.frameCount = 0; this.fpsTimer = 0; this.fpsCounter.innerText = `FPS: ${this.fps}`; }
    }
}
window.addEventListener('load', () => { new Game(); });
