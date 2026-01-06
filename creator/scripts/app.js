/**
 * App - Point d'entrée principal de Survivale Creator
 */
class App {
    constructor() {
        this.fileManager = new FileManager();
        this.assetScanner = new AssetScanner(this.fileManager);
        this.currentSection = 'hub';
        this.gameData = null;
        
        // Modules
        this.modules = {
            players: null,
            enemies: null,
            bosses: null,
            weapons: null,
            phases: null,
            transitions: null
        };

        this.init();
    }

    /**
     * Initialisation de l'application
     */
    init() {
        this.bindEvents();
        this.checkBrowserSupport();
    }

    /**
     * Vérifie le support du navigateur
     */
    checkBrowserSupport() {
        if (!this.fileManager.isSupported()) {
            this.showNotification(
                'Navigateur non supporté. Utilisez Chrome ou Edge pour accéder à toutes les fonctionnalités.',
                'warning'
            );
        }
    }

    /**
     * Bindind des événements
     */
    bindEvents() {
        // Bouton de connexion
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleConnect());
        }

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) this.navigateTo(section);
            });
        });

        // Cartes modules
        document.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (card.classList.contains('disabled')) return;
                const module = card.dataset.module;
                if (module) this.navigateTo(module);
            });
        });

        // Boutons retour
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) this.navigateTo(section);
            });
        });
    }

    /**
     * Gère la connexion au projet
     */
    async handleConnect() {
        const connectBtn = document.getElementById('connectBtn');
        const originalText = connectBtn.innerHTML;
        
        try {
            connectBtn.innerHTML = '<span class="spinner spinner-sm"></span> Connexion...';
            connectBtn.disabled = true;

            const result = await this.fileManager.connectProject();

            if (result.cancelled) {
                this.showNotification('Connexion annulée', 'info');
                return;
            }

            if (result.success) {
                await this.onProjectConnected();
            }

        } catch (error) {
            console.error('Erreur connexion:', error);
            this.showNotification(error.message, 'error');
        } finally {
            connectBtn.innerHTML = originalText;
            connectBtn.disabled = false;
        }
    }

    /**
     * Appelé quand le projet est connecté
     */
    async onProjectConnected() {
        // Mettre à jour le statut
        this.updateConnectionStatus(true);

        // Scanner les assets
        await this.assetScanner.scanAssets();

        // Charger les données
        this.gameData = await this.fileManager.loadAllData();

        // Mettre à jour l'UI
        this.updateStats();
        this.enableModuleCards();
        this.displayAssets();

        this.showNotification(
            `Projet "${this.fileManager.projectName}" connecté avec succès!`,
            'success'
        );

        console.log('Données chargées:', this.gameData);
        console.log('Assets trouvés:', this.assetScanner.getAllAssets());
    }

    /**
     * Met à jour le statut de connexion dans l'UI
     */
    updateConnectionStatus(connected) {
        const statusContainer = document.getElementById('connectionStatus');
        const dot = statusContainer.querySelector('.status-dot');
        const text = statusContainer.querySelector('.status-text');

        if (connected) {
            dot.classList.remove('disconnected');
            dot.classList.add('connected');
            text.textContent = this.fileManager.projectName;
        } else {
            dot.classList.remove('connected');
            dot.classList.add('disconnected');
            text.textContent = 'Non connecté';
        }
    }

    /**
     * Met à jour les statistiques du hub
     */
    updateStats() {
        if (!this.gameData) return;

        const stats = {
            players: Object.keys(this.gameData.players).length,
            enemies: Object.keys(this.gameData.enemies).length,
            bosses: Object.keys(this.gameData.bosses).length,
            weapons: this.gameData.weapons.length,
            phases: this.gameData.phases.length,
            assets: this.assetScanner.getAssetCount()
        };

        // Stats bar
        document.getElementById('statPlayers').textContent = stats.players;
        document.getElementById('statEnemies').textContent = stats.enemies;
        document.getElementById('statBosses').textContent = stats.bosses;
        document.getElementById('statWeapons').textContent = stats.weapons;
        document.getElementById('statPhases').textContent = stats.phases;
        document.getElementById('statAssets').textContent = stats.assets;

        // Cards
        document.getElementById('cardPlayers').textContent = stats.players;
        document.getElementById('cardEnemies').textContent = stats.enemies;
        document.getElementById('cardBosses').textContent = stats.bosses;
        document.getElementById('cardWeapons').textContent = stats.weapons;
        document.getElementById('cardPhases').textContent = stats.phases;
        document.getElementById('cardTransitions').textContent = this.gameData.transitions.length || '0';
    }

    /**
     * Active les cartes de modules
     */
    enableModuleCards() {
        document.querySelectorAll('.module-card').forEach(card => {
            card.classList.remove('disabled');
        });
    }

    /**
     * Affiche la grille d'assets
     */
    async displayAssets() {
        const assetsSection = document.getElementById('assetsSection');
        const assetsGrid = document.getElementById('assetsGrid');

        if (!assetsSection || !assetsGrid) return;

        const allAssets = this.assetScanner.getAllAssets();
        
        if (allAssets.length === 0) {
            assetsSection.style.display = 'none';
            return;
        }

        assetsSection.style.display = 'block';
        assetsGrid.innerHTML = '';

        // Afficher les 12 premiers assets
        const assetsToShow = allAssets.slice(0, 12);

        for (const asset of assetsToShow) {
            const url = await this.assetScanner.getAssetURL(asset.path);
            if (!url) continue;

            const item = document.createElement('div');
            item.className = 'asset-item';
            item.innerHTML = `
                <img src="${url}" alt="${asset.name}">
                <span>${asset.name}</span>
            `;
            assetsGrid.appendChild(item);
        }

        if (allAssets.length > 12) {
            const more = document.createElement('div');
            more.className = 'asset-item';
            more.innerHTML = `
                <div style="font-size: 2rem; color: var(--text-muted);">+${allAssets.length - 12}</div>
                <span>autres assets</span>
            `;
            assetsGrid.appendChild(more);
        }
    }

    /**
     * Navigue vers une section
     */
    navigateTo(sectionId) {
        // Masquer toutes les sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Afficher la section demandée
        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }

        // Mettre à jour la navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('active');
            }
        });
        
        // Initialiser le module correspondant
        this.initModule(sectionId);
    }
    
    /**
     * Initialise un module si nécessaire
     */
    initModule(moduleId) {
        if (!this.gameData) return;
        
        switch(moduleId) {
            case 'players':
                if (!this.modules.players) {
                    this.modules.players = new PlayersModule(this);
                }
                this.modules.players.init();
                break;
            case 'enemies':
                if (!this.modules.enemies) {
                    this.modules.enemies = new EnemiesModule(this);
                }
                this.modules.enemies.init();
                break;
            case 'bosses':
                if (!this.modules.bosses) {
                    this.modules.bosses = new BossesModule(this);
                }
                this.modules.bosses.init();
                break;
            // Les autres modules seront ajoutés plus tard
        }
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        `;

        container.appendChild(notification);

        // Auto-remove après 4 secondes
        setTimeout(() => {
            notification.classList.add('notification-exit');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
