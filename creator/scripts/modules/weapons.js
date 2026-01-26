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
        const explosionAssets = this.app.assetScanner.getAssetPathsForSelect('explosion');

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
                    <div class="form-row">
                        <div class="form-group" style="flex: 2;">
                            <label class="form-label">Description (affichée sur la carte)</label>
                            <input type="text" class="form-input" id="weaponDescription" value="${w.description || ''}" placeholder="Ex: Tire des projectiles rapides...">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Catégorie</label>
                            <input type="text" class="form-input" id="weaponCategory" value="${w.category || ''}" placeholder="Ex: projectile, aura...">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Preview Stat (Badge)</label>
                            <input type="text" class="form-input" id="weaponPreview" value="${w.preview || ''}" placeholder="Ex: Dégâts: 20">
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
                            <input type="number" class="form-input" id="weaponVisualHeight" value="${w.visuals?.height || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Direction Mode</label>
                            <select class="form-select" id="weaponDirMode">
                                <option value="none" ${w.visuals?.directionMode === 'none' ? 'selected' : ''}>None (Fixe)</option>
                                <option value="rotate" ${w.visuals?.directionMode === 'rotate' || (!w.visuals?.directionMode && w.visuals?.rotateWithVelocity) ? 'selected' : ''}>Rotate (Orienté)</option>
                                <option value="flip" ${w.visuals?.directionMode === 'flip' ? 'selected' : ''}>Flip (Miroir)</option>
                                <option value="4_way" ${w.visuals?.directionMode === '4_way' ? 'selected' : ''}>4-Way</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Angle Offset (°)</label>
                            <input type="number" class="form-input" id="weaponVisualAngleOffset" value="${w.visuals?.angleOffset || 0}">
                        </div>
                        <div class="form-group"></div>
                    </div>

                    <!-- Effets spécifiques AOE -->
                    <div id="aoeVisualEffects" style="${w.type === 'aoe' ? '' : 'display: none;'}">
                        <h4 style="margin: var(--space-md) 0 var(--space-xs); font-size: 0.9rem; color: var(--text-muted);">Effets d'Aura (AOE)</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Rotation (tours/sec)</label>
                                <input type="number" step="0.1" class="form-input" id="auraRotationSpeed" value="${w.visuals?.auraRotationSpeed || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label form-check" style="margin-top: 2rem;">
                                    <input type="checkbox" id="auraPulseAlpha" ${w.visuals?.auraPulseAlpha ? 'checked' : ''}>
                                    Clignotement (Alpha)
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label form-check" style="margin-top: 2rem;">
                                    <input type="checkbox" id="auraPulseSize" ${w.visuals?.auraPulseSize ? 'checked' : ''}>
                                    Pulsation (Taille)
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Vitesse Alpha</label>
                                <input type="number" class="form-input" id="auraAlphaSpeed" value="${w.visuals?.auraAlphaSpeed || 200}" placeholder="200=rapide">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Alpha Min (0-1)</label>
                                <input type="number" step="0.1" min="0" max="1" class="form-input" id="auraAlphaMin" value="${w.visuals?.auraAlphaMin ?? 0.2}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Alpha Max (0-1)</label>
                                <input type="number" step="0.1" min="0" max="1" class="form-input" id="auraAlphaMax" value="${w.visuals?.auraAlphaMax ?? 1.0}">
                            </div>
                            <div class="form-group"></div>
                        </div>
                    </div>
                </div>

                <div class="form-section explosion-visuals-section" style="${w.stats?.isExplosive ? '' : 'display: none;'}">
                    <h3 class="form-section-title">Visuels de l'Explosion</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Image Explosion (Asset)</label>
                            <select class="form-select" id="explosionVisualPath">
                                <option value="">-- Aucun (Dégradé par défaut) --</option>
                                ${explosionAssets.map(path => `<option value="${path}" ${w.stats?.explosionVisuals?.path === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Taille Explosion (px)</label>
                            <input type="number" class="form-input" id="explosionVisualSize" value="${w.stats?.explosionVisuals?.width || 80}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Direction Mode</label>
                            <select class="form-select" id="explosionDirMode">
                                <option value="none" ${w.stats?.explosionVisuals?.directionMode === 'none' ? 'selected' : ''}>None (Fixe)</option>
                                <option value="rotate" ${w.stats?.explosionVisuals?.directionMode === 'rotate' ? 'selected' : ''}>Rotate (Orienté)</option>
                            </select>
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
                    <label class="form-label">Rayon Hitbox</label>
                    <input type="number" class="form-input stat-input" data-stat="radius" value="${s.radius || 5}">
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
                <div class="form-group" style="flex: 2;">
                    <label class="form-label">Portée de l'Aura (range)</label>
                    <input type="number" class="form-input stat-input" data-stat="range" value="${s.range || 100}">
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
                <div class="form-group" id="slowFields" style="flex: 1; ${s.isSlowing ? '' : 'display: none;'}">
                    <label class="form-label">Puissance Ralenti (0-1)</label>
                    <input type="number" step="0.05" min="0" max="1" class="form-input stat-input" data-stat="slowMultiplier" value="${s.slowMultiplier ?? 0.4}" placeholder="0.4 = -40%">
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

            <!-- Effet d'Explosion -->
            <div class="form-row" style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px dashed rgba(255,255,255,0.1);">
                <div class="form-group">
                    <label class="form-label form-check">
                        <input type="checkbox" class="stat-input" data-stat="isExplosive" ${s.isExplosive ? 'checked' : ''}>
                        Explosif
                    </label>
                </div>
                <div class="form-group explosion-fields" style="flex: 1; ${s.isExplosive ? '' : 'display: none;'}">
                    <label class="form-label">Rayon Explosion</label>
                    <input type="number" class="form-input stat-input" data-stat="explosionRadius" value="${s.explosionRadius || 80}">
                </div>
                <div class="form-group explosion-fields" style="flex: 1; ${s.isExplosive ? '' : 'display: none;'}">
                    <label class="form-label">Multiplicateur Dégâts AOE</label>
                    <input type="number" step="0.1" class="form-input stat-input" data-stat="explosionDamageMultiplier" value="${s.explosionDamageMultiplier || 0.5}">
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
                        <label class="form-label-xs">Nom de l'amélioration</label>
                        <input type="text" class="form-input upg-name-input" placeholder="Ex: Tir Rapide" value="${upg.name || ''}">
                    </div>
                    <div class="form-group" style="flex: 1; margin: 0;">
                        <label class="form-label-xs">Texte Preview (Badge)</label>
                        <input type="text" class="form-input upg-preview-input" placeholder="Ex: Cadence +20%" value="${upg.preview || ''}">
                    </div>
                    <button class="btn btn-sm btn-danger remove-upgrade-btn" data-index="${idx}" style="align-self: flex-end;">×</button>
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
            'poisonDamage', 'poisonDuration', 'poisonTickRate', 'isSlowing',
            'isExplosive', 'explosionRadius', 'explosionDamageMultiplier',
            'auraRotationSpeed', 'auraPulseAlpha', 'auraPulseSize', 'auraAlphaSpeed',
            'auraAlphaMin', 'auraAlphaMax'
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

        // Toggle slow fields
        editor.querySelector('[data-stat="isSlowing"]')?.addEventListener('change', (e) => {
            document.getElementById('slowFields').style.display = e.target.checked ? '' : 'none';
        });

        // Toggle explosion fields
        editor.querySelector('[data-stat="isExplosive"]')?.addEventListener('change', (e) => {
            editor.querySelectorAll('.explosion-fields').forEach(f => f.style.display = e.target.checked ? '' : 'none');
            editor.querySelector('.explosion-visuals-section').style.display = e.target.checked ? '' : 'none';
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
        w.description = document.getElementById('weaponDescription').value;
        w.category = document.getElementById('weaponCategory').value;
        w.preview = document.getElementById('weaponPreview').value;

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
        const vHeight = document.getElementById('weaponVisualHeight').value;
        if (vHeight) w.visuals.height = parseInt(vHeight);
        else delete w.visuals.height;

        const dirMode = document.getElementById('weaponDirMode').value;
        w.visuals.directionMode = dirMode;
        w.visuals.rotateWithVelocity = (dirMode === 'rotate'); // Backward compatibility
        w.visuals.angleOffset = parseInt(document.getElementById('weaponVisualAngleOffset').value) || 0;

        // AOE Specific
        if (w.type === 'aoe') {
            w.visuals.auraRotationSpeed = parseFloat(document.getElementById('auraRotationSpeed').value) || 0;
            w.visuals.auraPulseAlpha = document.getElementById('auraPulseAlpha').checked;
            w.visuals.auraPulseSize = document.getElementById('auraPulseSize').checked;
            w.visuals.auraAlphaSpeed = parseInt(document.getElementById('auraAlphaSpeed').value) || 200;
            w.visuals.auraAlphaMin = parseFloat(document.getElementById('auraAlphaMin').value);
            w.visuals.auraAlphaMax = parseFloat(document.getElementById('auraAlphaMax').value);
        } else {
            delete w.visuals.auraRotationSpeed;
            delete w.visuals.auraPulseAlpha;
            delete w.visuals.auraPulseSize;
            delete w.visuals.auraAlphaSpeed;
            delete w.visuals.auraAlphaMin;
            delete w.visuals.auraAlphaMin;
            delete w.visuals.auraAlphaMax;
        }

        // Explosion Visuals
        if (w.stats.isExplosive) {
            const expPath = document.getElementById('explosionVisualPath').value;
            const expSize = parseInt(document.getElementById('explosionVisualSize').value) || 80;
            const expDirMode = document.getElementById('explosionDirMode').value;

            if (expPath) {
                w.stats.explosionVisuals = {
                    path: expPath,
                    width: expSize,
                    height: expSize,
                    directionMode: expDirMode,
                    animations: {
                        idle: {
                            frames: [expPath],
                            frameRate: 10,
                            loop: true
                        }
                    }
                };
            } else {
                delete w.stats.explosionVisuals;
            }
        } else {
            delete w.stats.explosionVisuals;
        }

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
            const preview = item.querySelector('.upg-preview-input').value;
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
            return { name, preview, stats };
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
            slowMultiplier: 0.1, // +10% de ralenti par défaut pour une upgrade
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
            const rotation = (visuals.directionMode === 'rotate' || visuals.rotateWithVelocity) ? visuals.angleOffset : 0;
            const hStyle = visuals.height ? `height: ${visuals.height}px;` : '';
            canvas.innerHTML = `<img src="${url}" style="width: ${visuals.width}px; ${hStyle} transform: rotate(${rotation}deg)">`;
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
