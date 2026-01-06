/**
 * WeaponsModule - Éditeur d'armes et projectiles
 * Basé sur la documentation json_schemas.md et reference_json.md
 */
class WeaponsModule {
    constructor(app) {
        this.app = app;
        this.currentWeaponIndex = null;
        this.currentWeapon = null;
        this.searchQuery = '';
    }

    /**
     * Initialise le module
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Rendu du module
     */
    render() {
        const section = document.getElementById('weaponsSection');
        if (!section) return;

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">⚔️ Éditeur d'Armes</h2>
            </div>

            <div class="editor-layout">
                <!-- Liste des armes -->
                <div class="editor-sidebar panel">
                    <div class="panel-header">
                        <span class="panel-title">Armes</span>
                        <button class="btn btn-sm btn-primary" id="addWeaponBtn">+ Nouveau</button>
                    </div>
                    <div class="panel-body">
                        <div class="search-box">
                            <input type="text" class="form-input" id="weaponSearch" placeholder="🔍 Rechercher..." value="${this.searchQuery}">
                        </div>
                        <div class="items-list" id="weaponsList">
                            <!-- Rempli par JS -->
                        </div>
                    </div>
                </div>

                <!-- Éditeur principal -->
                <div class="editor-main">
                    <div class="editor-content" id="weaponEditor">
                        <div class="empty-state">
                            <div class="empty-state-icon">⚔️</div>
                            <h3 class="empty-state-title">Sélectionnez une arme</h3>
                            <p class="empty-state-desc">Choisissez une arme dans la liste ou créez-en une nouvelle</p>
                        </div>
                    </div>
                </div>

                <!-- Preview & JSON -->
                <div class="editor-preview">
                    <!-- Prévisualisation -->
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Prévisualisation Projectile</span>
                        </div>
                        <div class="panel-body">
                            <div class="preview-container">
                                <div class="preview-canvas" id="weaponPreviewCanvas">
                                    <span style="color: var(--text-muted)">Aucun visuel</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- JSON Preview -->
                    <div class="panel" style="margin-top: var(--space-md);">
                        <div class="panel-header">
                            <span class="panel-title">JSON Preview</span>
                            <button class="btn btn-sm btn-ghost" id="toggleJsonBtn">Masquer</button>
                        </div>
                        <div class="panel-body json-preview-content" id="weaponJsonPreview">
                            <pre>Sélectionnez une arme...</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadWeaponsList();
    }

    /**
     * Charge la liste des armes
     */
    async loadWeaponsList() {
        const list = document.getElementById('weaponsList');
        if (!list || !this.app.gameData) return;

        const weapons = this.app.gameData.weapons;
        list.innerHTML = '';

        // Filtrer par recherche
        const filteredEntries = weapons.map((w, index) => ({ ...w, originalIndex: index }))
            .filter(w => {
                if (!this.searchQuery) return true;
                const query = this.searchQuery.toLowerCase();
                return w.id.toLowerCase().includes(query) || 
                       (w.name && w.name.toLowerCase().includes(query));
            });

        for (const weapon of filteredEntries) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.index = weapon.originalIndex;

            const icon = weapon.type === 'attack' ? '🔫' : (weapon.type === 'defense' ? '🛡️' : '🌀');
            
            item.innerHTML = `
                <div class="list-item-icon" style="font-size: 1.5rem;">
                    ${icon}
                </div>
                <div class="list-item-info">
                    <div class="list-item-name">${weapon.name || weapon.id}</div>
                    <div class="list-item-meta">${weapon.type.toUpperCase()} | Upgrades: ${weapon.upgrades?.length || 0}</div>
                </div>
            `;

            item.addEventListener('click', () => this.selectWeapon(weapon.originalIndex));
            list.appendChild(item);
        }

        if (filteredEntries.length === 0) {
            list.innerHTML = '<div style="padding: var(--space-md); color: var(--text-muted); text-align: center;">Aucune arme trouvée</div>';
        }
    }

    /**
     * Sélectionne une arme pour l'éditer
     */
    async selectWeapon(index) {
        this.currentWeaponIndex = index;
        this.currentWeapon = JSON.parse(JSON.stringify(this.app.gameData.weapons[index]));

        // Mettre à jour la sélection visuelle
        document.querySelectorAll('#weaponsList .list-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.index) === index);
        });

        // Afficher l'éditeur
        this.renderEditor();
        this.updateJsonPreview();
        await this.loadPreview();
    }

    /**
     * Rendu de l'éditeur d'arme
     */
    renderEditor() {
        const editor = document.getElementById('weaponEditor');
        if (!editor || !this.currentWeapon) return;

        const w = this.currentWeapon;
        const projectileAssets = this.app.assetScanner.getAssetPathsForSelect('projectile');

        editor.innerHTML = `
            <div class="editor-form">
                <div class="form-section">
                    <h3 class="form-section-title">Informations de base</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ID (clé unique)</label>
                            <input type="text" class="form-input" id="weaponId" value="${w.id}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nom affiché</label>
                            <input type="text" class="form-input" id="weaponName" value="${w.name || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="weaponType">
                                <option value="attack" ${w.type === 'attack' ? 'selected' : ''}>Attaque (Projectile)</option>
                                <option value="defense" ${w.type === 'defense' ? 'selected' : ''}>Défense (Orbite)</option>
                                <option value="aoe" ${w.type === 'aoe' ? 'selected' : ''}>AOE (Aura)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section" id="statsSection">
                    <h3 class="form-section-title">Statistiques</h3>
                    ${this.renderStatsForm(w)}
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Visuels du Projectile</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Image (Asset)</label>
                            <select class="form-select" id="weaponVisualPath">
                                <option value="">-- Aucun (Forme par défaut) --</option>
                                ${projectileAssets.map(path => `<option value="${path}" ${w.visuals?.path === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Largeur (px)</label>
                            <input type="number" class="form-input" id="weaponVisualWidth" value="${w.visuals?.width || 20}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Hauteur (px)</label>
                            <input type="number" class="form-input" id="weaponVisualHeight" value="${w.visuals?.height || 20}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label form-check">
                                <input type="checkbox" id="weaponVisualRotate" ${w.visuals?.rotateWithVelocity ? 'checked' : ''}>
                                Rotation selon vitesse
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Angle Offset (°)</label>
                            <input type="number" class="form-input" id="weaponVisualAngleOffset" value="${w.visuals?.angleOffset || 0}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header-inline">
                        <h3 class="form-section-title">Améliorations (Upgrades)</h3>
                        <button class="btn btn-sm btn-primary" id="addUpgradeBtn">+ Ajouter Upgrade</button>
                    </div>
                    <div id="upgradesContainer" class="upgrades-list">
                        ${this.renderUpgrades(w.upgrades)}
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-danger" id="deleteWeaponBtn">🗑️ Supprimer</button>
                    <button class="btn btn-success" id="saveWeaponBtn">💾 Sauvegarder</button>
                </div>
            </div>
        `;

        this.bindEditorEvents();
    }

    /**
     * Rendu des champs de stats selon le type
     */
    renderStatsForm(w) {
        const s = w.stats || {};
        
        let fields = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Dégâts</label>
                    <input type="number" class="form-input stat-input" data-stat="damage" value="${s.damage || 0}">
                </div>
        `;

        if (w.type === 'attack') {
            fields += `
                <div class="form-group">
                    <label class="form-label">Cadence (ms)</label>
                    <input type="number" class="form-input stat-input" data-stat="fireRate" value="${s.fireRate || 500}">
                </div>
                <div class="form-group">
                    <label class="form-label">Vitesse Proj.</label>
                    <input type="number" class="form-input stat-input" data-stat="projectileSpeed" value="${s.projectileSpeed || 400}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Nb Projectiles</label>
                    <input type="number" class="form-input stat-input" data-stat="projectileCount" value="${s.projectileCount || 1}">
                </div>
                <div class="form-group">
                    <label class="form-label">Perçage (piercing)</label>
                    <input type="number" class="form-input stat-input" data-stat="piercingCount" value="${s.piercingCount || 0}">
                </div>
                <div class="form-group">
                    <label class="form-label">Couleur (fallback)</label>
                    <input type="text" class="form-input stat-input" data-stat="color" value="${s.color || '#fff'}">
                </div>
            </div>`;
        } else if (w.type === 'defense') {
            fields += `
                <div class="form-group">
                    <label class="form-label">Rayon (distance)</label>
                    <input type="number" class="form-input stat-input" data-stat="radius" value="${s.radius || 60}">
                </div>
                <div class="form-group">
                    <label class="form-label">Vitesse Rotation</label>
                    <input type="number" class="form-input stat-input" data-stat="orbitSpeed" value="${s.orbitSpeed || 3}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Nombre Satellites</label>
                    <input type="number" class="form-input stat-input" data-stat="projectileCount" value="${s.projectileCount || 4}">
                </div>
                <div class="form-group">
                    <label class="form-label">Durée (fireRate ms)</label>
                    <input type="number" class="form-input stat-input" data-stat="fireRate" value="${s.fireRate || 2000}">
                </div>
                <div class="form-group"></div>
            </div>`;
        } else if (w.type === 'aoe') {
            fields += `
                <div class="form-group">
                    <label class="form-label">Portée (range)</label>
                    <input type="number" class="form-input stat-input" data-stat="range" value="${s.range || 100}">
                </div>
                <div class="form-group">
                    <label class="form-label">Multiplicateur Ralenti</label>
                    <input type="number" step="0.1" class="form-input stat-input" data-stat="slowMultiplier" value="${s.slowMultiplier || 0.6}">
                </div>
            </div>`;
        }

        // Effets communs
        fields += `
            <div class="form-row" style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px dashed rgba(255,255,255,0.1);">
                <div class="form-group">
                    <label class="form-label form-check">
                        <input type="checkbox" class="stat-input" data-stat="isPoisonous" ${s.isPoisonous ? 'checked' : ''}>
                        Poison
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label form-check">
                        <input type="checkbox" class="stat-input" data-stat="isSlowing" ${s.isSlowing ? 'checked' : ''}>
                        Ralentissement
                    </label>
                </div>
            </div>
            <div class="form-row poison-fields" style="${s.isPoisonous ? '' : 'display: none;'}">
                <div class="form-group">
                    <label class="form-label">Dégâts Poison</label>
                    <input type="number" class="form-input stat-input" data-stat="poisonDamage" value="${s.poisonDamage || 10}">
                </div>
                <div class="form-group">
                    <label class="form-label">Durée Poison (ms)</label>
                    <input type="number" class="form-input stat-input" data-stat="poisonDuration" value="${s.poisonDuration || 2000}">
                </div>
                <div class="form-group">
                    <label class="form-label">Tick Rate (ms)</label>
                    <input type="number" class="form-input stat-input" data-stat="poisonTickRate" value="${s.poisonTickRate || 500}">
                </div>
            </div>
        `;

        return fields;
    }

    /**
     * Rendu de la liste des upgrades
     */
    renderUpgrades(upgrades) {
        if (!upgrades || upgrades.length === 0) {
            return '<p class="empty-list-msg">Aucune amélioration définie.</p>';
        }

        return upgrades.map((upg, idx) => `
            <div class="upgrade-item" data-index="${idx}">
                <div class="upgrade-header">
                    <div class="form-group" style="flex: 1; margin: 0;">
                        <input type="text" class="form-input upg-name-input" placeholder="Nom de l'upgrade" value="${upg.name || ''}">
                    </div>
                    <button class="btn btn-sm btn-danger remove-upgrade-btn" data-index="${idx}">×</button>
                </div>
                <div class="upgrade-stats-grid">
                    ${this.renderUpgradeStats(upg.stats)}
                </div>
                <div class="add-stat-row">
                    <select class="form-select form-input-sm add-stat-select">
                        <option value="">+ Ajouter une stat...</option>
                        ${this.getAvailableStatsOptions()}
                    </select>
                </div>
            </div>
        `).join('');
    }

    renderUpgradeStats(stats) {
        if (!stats || Object.keys(stats).length === 0) return '';
        
        return Object.entries(stats).map(([key, val]) => `
            <div class="upg-stat-row" data-stat="${key}">
                <label>${key}</label>
                <input type="${typeof val === 'boolean' ? 'checkbox' : 'number'}" 
                       step="0.1"
                       class="form-input form-input-sm upg-stat-input" 
                       value="${val}" 
                       ${typeof val === 'boolean' && val ? 'checked' : ''}>
                <button class="btn btn-icon-sm remove-stat-btn">✕</button>
            </div>
        `).join('');
    }

    getAvailableStatsOptions() {
        const stats = [
            'damage', 'fireRate', 'projectileSpeed', 'projectileCount', 'piercingCount',
            'radius', 'orbitSpeed', 'range', 'slowMultiplier', 'isPoisonous', 
            'poisonDamage', 'poisonDuration', 'poisonTickRate', 'isSlowing'
        ];
        return stats.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    /**
     * Bindind des événements
     */
    bindEvents() {
        // Recherche
        document.getElementById('weaponSearch')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.loadWeaponsList();
        });

        // Nouveau
        document.getElementById('addWeaponBtn')?.addEventListener('click', () => this.addNewWeapon());
    }

    bindEditorEvents() {
        const editor = document.getElementById('weaponEditor');
        if (!editor) return;

        // Mise à jour sur changement
        editor.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => this.updateWeaponFromForm());
            if (input.type === 'text' || input.type === 'number') {
                input.addEventListener('input', () => this.updateWeaponFromForm());
            }
        });

        // Toggle poison fields
        editor.querySelector('[data-stat="isPoisonous"]')?.addEventListener('change', (e) => {
            editor.querySelector('.poison-fields').style.display = e.target.checked ? '' : 'none';
        });

        // Type change -> re-render stats
        document.getElementById('weaponType')?.addEventListener('change', (e) => {
            this.currentWeapon.type = e.target.value;
            this.renderEditor();
            this.updateJsonPreview();
        });

        // Upgrades
        document.getElementById('addUpgradeBtn')?.addEventListener('click', () => this.addUpgrade());
        
        editor.querySelectorAll('.remove-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.removeUpgrade(parseInt(e.target.dataset.index)));
        });

        editor.querySelectorAll('.add-stat-select').forEach(select => {
            select.addEventListener('change', (e) => {
                if (!e.target.value) return;
                const upgIdx = parseInt(e.target.closest('.upgrade-item').dataset.index);
                this.addStatToUpgrade(upgIdx, e.target.value);
            });
        });

        editor.querySelectorAll('.remove-stat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgIdx = parseInt(e.target.closest('.upgrade-item').dataset.index);
                const statKey = e.target.closest('.upg-stat-row').dataset.stat;
                this.removeStatFromUpgrade(upgIdx, statKey);
            });
        });

        // Actions globales
        document.getElementById('saveWeaponBtn')?.addEventListener('click', () => this.saveWeapon());
        document.getElementById('deleteWeaponBtn')?.addEventListener('click', () => this.deleteWeapon());
        
        // JSON toggle
        document.getElementById('toggleJsonBtn')?.addEventListener('click', (e) => {
            const content = document.getElementById('weaponJsonPreview');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                e.target.textContent = 'Masquer';
            } else {
                content.style.display = 'none';
                e.target.textContent = 'Afficher';
            }
        });
    }

    /**
     * Met à jour l'objet currentWeapon depuis le DOM
     */
    updateWeaponFromForm() {
        if (!this.currentWeapon) return;

        const w = this.currentWeapon;
        w.id = document.getElementById('weaponId').value;
        w.name = document.getElementById('weaponName').value;
        w.type = document.getElementById('weaponType').value;

        // Stats
        if (!w.stats) w.stats = {};
        document.querySelectorAll('.stat-input').forEach(input => {
            const stat = input.dataset.stat;
            if (input.type === 'checkbox') {
                w.stats[stat] = input.checked;
            } else {
                w.stats[stat] = input.value.includes('.') ? parseFloat(input.value) : parseInt(input.value);
            }
        });

        // Visuals
        if (!w.visuals) w.visuals = {};
        const path = document.getElementById('weaponVisualPath').value;
        w.visuals.path = path; // Key for the dropdown to persist selection
        w.visuals.width = parseInt(document.getElementById('weaponVisualWidth').value) || 20;
        w.visuals.height = parseInt(document.getElementById('weaponVisualHeight').value) || 20;
        w.visuals.rotateWithVelocity = document.getElementById('weaponVisualRotate').checked;
        w.visuals.angleOffset = parseInt(document.getElementById('weaponVisualAngleOffset').value) || 0;
        
        // Auto-generate animation for Animator.js compatibility
        w.visuals.directionMode = w.visuals.rotateWithVelocity ? 'rotate' : 'none';
        w.visuals.animations = {
            idle: {
                frames: path ? [path] : [],
                frameRate: 10,
                loop: true
            }
        };

        // Upgrades
        const upgradeItems = document.querySelectorAll('.upgrade-item');
        w.upgrades = Array.from(upgradeItems).map(item => {
            const name = item.querySelector('.upg-name-input').value;
            const stats = {};
            item.querySelectorAll('.upg-stat-row').forEach(row => {
                const key = row.dataset.stat;
                const input = row.querySelector('.upg-stat-input');
                if (input.type === 'checkbox') {
                    stats[key] = input.checked;
                } else {
                    stats[key] = input.value.includes('.') ? parseFloat(input.value) : parseInt(input.value);
                }
            });
            return { name, stats };
        });

        this.updateJsonPreview();
        this.loadPreview();
    }

    /**
     * Upgrades management
     */
    addUpgrade() {
        if (!this.currentWeapon.upgrades) this.currentWeapon.upgrades = [];
        this.currentWeapon.upgrades.push({ name: 'Nouvelle Amélioration', stats: {} });
        this.renderEditor();
        this.updateJsonPreview();
    }

    removeUpgrade(index) {
        this.currentWeapon.upgrades.splice(index, 1);
        this.renderEditor();
        this.updateJsonPreview();
    }

    addStatToUpgrade(upgIdx, statKey) {
        if (!this.currentWeapon.upgrades[upgIdx].stats) this.currentWeapon.upgrades[upgIdx].stats = {};
        // Valeur par défaut selon la stat
        const defaults = {
            isPoisonous: true,
            isSlowing: true,
            slowMultiplier: -0.1,
            damage: 5,
            fireRate: -50,
            projectileCount: 1,
            projectileSpeed: 50,
            range: 20,
            radius: 10
        };
        this.currentWeapon.upgrades[upgIdx].stats[statKey] = defaults[statKey] || 0;
        this.renderEditor();
        this.updateJsonPreview();
    }

    removeStatFromUpgrade(upgIdx, statKey) {
        delete this.currentWeapon.upgrades[upgIdx].stats[statKey];
        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Preview
     */
    async loadPreview() {
        const canvas = document.getElementById('weaponPreviewCanvas');
        if (!canvas || !this.currentWeapon) return;

        const visuals = this.currentWeapon.visuals;
        if (!visuals || !visuals.path) {
            const color = this.currentWeapon.stats?.color || '#fff';
            canvas.innerHTML = `<div style="width: 20px; height: 20px; background: ${color}; border-radius: 50%;"></div>`;
            return;
        }

        const url = await this.app.assetScanner.getAssetURL(visuals.path);
        if (url) {
            canvas.innerHTML = `<img src="${url}" style="width: ${visuals.width}px; height: ${visuals.height}px; transform: rotate(${visuals.angleOffset}deg)">`;
        } else {
            canvas.innerHTML = '<span style="color: var(--text-danger)">Asset non trouvé</span>';
        }
    }

    updateJsonPreview() {
        const preview = document.getElementById('weaponJsonPreview');
        if (preview && this.currentWeapon) {
            preview.innerHTML = `<pre>${JSON.stringify(this.currentWeapon, null, 4)}</pre>`;
        }
    }

    /**
     * CRUD
     */
    addNewWeapon() {
        const newId = 'new_weapon_' + Date.now().toString(36);
        const newWeapon = {
            id: newId,
            name: 'Nouvelle Arme',
            type: 'attack',
            stats: {
                damage: 10,
                fireRate: 500,
                projectileSpeed: 400,
                projectileCount: 1
            },
            upgrades: [],
            visuals: {
                path: '',
                width: 20,
                height: 20,
                rotateWithVelocity: true,
                angleOffset: 0
            }
        };

        this.app.gameData.weapons.push(newWeapon);
        this.currentWeaponIndex = this.app.gameData.weapons.length - 1;
        this.currentWeapon = JSON.parse(JSON.stringify(newWeapon));
        
        this.loadWeaponsList();
        this.selectWeapon(this.currentWeaponIndex);
        this.app.showNotification('Nouvelle arme créée', 'success');
    }

    async deleteWeapon() {
        if (!this.currentWeapon) return;

        if (!confirm('Supprimer cette arme définitivement ?')) return;

        try {
            this.app.gameData.weapons.splice(this.currentWeaponIndex, 1);
            this.currentWeapon = null;
            this.currentWeaponIndex = null;

            // Sauvegarder
            await this.app.fileManager.writeJSON('weapons.json', { weapons: this.app.gameData.weapons });

            await this.loadWeaponsList();
            this.app.updateStats();

            document.getElementById('weaponEditor').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚔️</div>
                    <h3 class="empty-state-title">Arme supprimée</h3>
                </div>
            `;
            
            this.app.showNotification('Arme supprimée', 'info');
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.app.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
        }
    }

    async saveWeapon() {
        if (!this.currentWeapon) return;

        try {
            // Mettre à jour dans les données globales
            this.app.gameData.weapons[this.currentWeaponIndex] = JSON.parse(JSON.stringify(this.currentWeapon));

            // Sauvegarder dans le fichier
            await this.app.fileManager.writeJSON('weapons.json', { weapons: this.app.gameData.weapons });

            this.app.showNotification('Arme sauvegardée avec succès', 'success');
            await this.loadWeaponsList();
            
            // Mettre à jour les stats du hub
            this.app.updateStats();

            // Garder la sélection
            const items = document.querySelectorAll('#weaponsList .list-item');
            items.forEach(item => {
                if (parseInt(item.dataset.index) === this.currentWeaponIndex) item.classList.add('active');
            });
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.app.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }
}

window.WeaponsModule = WeaponsModule;
