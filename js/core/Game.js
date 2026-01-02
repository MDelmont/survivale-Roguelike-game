import { Input } from './Input.js';
import { Player } from '../entities/Player.js';
import { Projectile } from '../entities/Projectile.js';
import { Enemy } from '../entities/Enemy.js';
import { Loot } from '../entities/Loot.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { DataManager } from './DataManager.js';

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
        this.dataManager = new DataManager();

        this.player = null;
        this.projectiles = [];
        this.enemies = [];
        this.loots = [];

        this.spawnTimer = 0;
        this.currentPhaseIndex = 0;
        this.currentPhase = null;
        this.phaseTimer = 0;

        this.isPaused = false;
        this.showingUpgradeMenu = false;
        this.upgradeOptions = [];

        this.init();
    }

    async init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Charger les données avant de commencer
        const success = await this.dataManager.loadAll();
        if (!success) {
            console.error('Erreur critique: impossible de charger les données du jeu.');
            return;
        }

        this.currentPhase = this.dataManager.getPhaseData(this.currentPhaseIndex);
        const playerStats = this.dataManager.getPlayerData();

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, playerStats);

        // Gestion du clic pour le menu d'upgrade
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        requestAnimationFrame((time) => this.loop(time));
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleCanvasClick(e) {
        if (!this.showingUpgradeMenu) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const menuWidth = 400;
        const optionHeight = 80;
        const startX = this.canvas.width / 2 - menuWidth / 2;
        const startY = 150;

        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const optY = startY + i * (optionHeight + 20);
            if (mouseX >= startX && mouseX <= startX + menuWidth &&
                mouseY >= optY && mouseY <= optY + optionHeight) {
                this.selectUpgrade(this.upgradeOptions[i]);
                break;
            }
        }
    }

    selectUpgrade(upgrade) {
        this.upgradeSystem.applyUpgrade(this.player, upgrade);
        this.player.pendingUpgrade = false;
        this.showingUpgradeMenu = false;
        this.isPaused = false;
    }

    loop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.isPaused) {
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

        const movement = this.input.getMovement();

        // Mise à jour du timer de phase
        this.phaseTimer += deltaTime / 1000;

        // 1. Recherche de l'ennemi le plus proche
        let targetDir = null;
        if (this.player && this.enemies.length > 0) {
            let closestEnemy = null;
            let minDist = Infinity;

            this.enemies.forEach(e => {
                const dx = e.x - this.player.x;
                const dy = e.y - this.player.y;
                const dist = dx * dx + dy * dy;
                if (dist < minDist) {
                    minDist = dist;
                    closestEnemy = e;
                }
            });

            if (closestEnemy) {
                const dx = closestEnemy.x - this.player.x;
                const dy = closestEnemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                targetDir = { dx: dx / dist, dy: dy / dist };
            }
        }

        // 2. Mise à jour du joueur
        if (this.player) {
            this.player.update(deltaTime, movement, (x, y, dx, dy) => {
                this.spawnProjectile(x, y, dx, dy);
            }, targetDir);

            if (this.player.x < this.player.radius) this.player.x = this.player.radius;
            if (this.player.x > this.canvas.width - this.player.radius) this.player.x = this.canvas.width - this.player.radius;
            if (this.player.y < this.player.radius) this.player.y = this.player.radius;
            if (this.player.y > this.canvas.height - this.player.radius) this.player.y = this.canvas.height - this.player.radius;
        }

        // 3. Spawn des ennemis (basé sur la config de la phase)
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.currentPhase.spawn_rate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // 4. Mise à jour des projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);
            if (p.isOutOfBounds(this.canvas.width, this.canvas.height) || p.toRemove) {
                this.projectiles.splice(i, 1);
            }
        }

        // 5. Mise à jour des loots
        for (let i = this.loots.length - 1; i >= 0; i--) {
            const l = this.loots[i];
            if (!l.isFollowing && this.player) {
                const dx = this.player.x - l.x;
                const dy = this.player.y - l.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.player.stats.pickupRadius) l.isFollowing = true;
            }
            l.update(deltaTime, { x: this.player ? this.player.x : 0, y: this.player ? this.player.y : 0 });
            if (l.toRemove && this.player) {
                this.player.addXP(l.value);
                this.loots.splice(i, 1);
            }
        }

        // 6. Mise à jour des ennemis et collisions
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
                if (e.hp <= 0) this.spawnLoot(e.x, e.y, e.xpValue);
                this.enemies.splice(i, 1);
            }
        }
    }

    openUpgradeMenu() {
        this.isPaused = true;
        this.showingUpgradeMenu = true;
        this.upgradeOptions = this.upgradeSystem.getRandomOptions(3);
    }

    spawnEnemy() {
        // Choisir un type d'ennemi aléatoire parmi ceux autorisés dans la phase
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

    spawnLoot(x, y, value) {
        this.loots.push(new Loot(x, y, value));
    }

    spawnProjectile(x, y, dx, dy) {
        this.projectiles.push(new Projectile(x, y, dx, dy, {
            speed: this.player.stats.projectileSpeed,
            damage: this.player.stats.damage
        }));
    }

    checkCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (a.radius + b.radius);
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.loots.forEach(l => l.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));

        if (this.player) {
            this.player.draw(this.ctx);
            this.drawUI();
        }

        this.input.draw(this.ctx);

        if (this.showingUpgradeMenu) {
            this.drawUpgradeMenu();
        }
    }

    drawUI() {
        // Barre de vie
        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(this.canvas.width / 2 - 50, 20, 100, 10);
        this.ctx.fillStyle = '#0f0';
        const healthWidth = (this.player.stats.hp / this.player.stats.maxHp) * 100;
        this.ctx.fillRect(this.canvas.width / 2 - 50, 20, Math.max(0, healthWidth), 10);

        // Barre d'XP
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(0, 0, this.canvas.width, 5);
        this.ctx.fillStyle = '#0af';
        const xpWidth = (this.player.stats.xp / this.player.stats.xpNextLevel) * this.canvas.width;
        this.ctx.fillRect(0, 0, xpWidth, 5);

        // Timer et Phase Info
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        const remaining = Math.max(0, this.currentPhase.duration_before_boss - this.phaseTimer);
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        this.ctx.fillText(`${this.currentPhase.name} - Boss dans: ${mins}:${secs < 10 ? '0' : ''}${secs}`, this.canvas.width / 2, 45);

        // Stats
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`LVL ${this.player.stats.level}`, this.canvas.width - 10, 25);

        if (this.player.stats.hp <= 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    drawUpgradeMenu() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL UP ! Choisissez un bonus', this.canvas.width / 2, 100);
        const menuWidth = 400;
        const optionHeight = 80;
        const startX = this.canvas.width / 2 - menuWidth / 2;
        const startY = 150;
        this.upgradeOptions.forEach((opt, i) => {
            const optY = startY + i * (optionHeight + 20);
            this.ctx.fillStyle = '#222';
            this.ctx.strokeStyle = '#0af';
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(startX, optY, menuWidth, optionHeight);
            this.ctx.strokeRect(startX, optY, menuWidth, optionHeight);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(opt.name, startX + 20, optY + 30);
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#aaa';
            this.ctx.fillText(opt.description, startX + 20, optY + 55);
        });
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
