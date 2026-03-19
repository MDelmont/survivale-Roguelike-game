/**
 * PhasesModule - Éditeur de phases de jeu
 */
class PhasesModule {
    constructor(app) {
        this.app = app;
        this.currentPhaseIndex = null;
        this.currentPhase = null;
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
        const section = document.getElementById('phasesSection');
        if (!section) return;

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">📅 Éditeur de Phases</h2>
            </div>

            <div class="editor-layout">
                <!-- Liste des phases -->
                <div class="editor-sidebar panel">
                    <div class="panel-header">
                        <span class="panel-title">Phases</span>
                        <button class="btn btn-sm btn-primary" id="addPhaseBtn">+ Nouveau</button>
                    </div>
                    <div class="panel-body">
                        <div class="search-box">
                            <input type="text" class="form-input" id="phaseSearch" placeholder="🔍 Rechercher..." value="${this.searchQuery}">
                        </div>
                        <div class="items-list" id="phasesList">
                            <!-- Rempli par JS -->
                        </div>
                    </div>
                </div>

                <!-- Éditeur principal -->
                <div class="editor-main">
                    <div class="editor-content" id="phaseEditor">
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <h3 class="empty-state-title">Sélectionnez une phase</h3>
                            <p class="empty-state-desc">Choisissez une phase dans la liste ou créez-en une nouvelle</p>
                        </div>
                    </div>
                </div>

                <!-- Preview JSON -->
                <div class="editor-preview">
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Structure JSON</span>
                            <button class="btn btn-sm btn-ghost" id="togglePhaseJsonBtn">Masquer</button>
                        </div>
                        <div class="panel-body json-preview-content" id="phaseJsonPreview">
                            <pre>Sélectionnez une phase...</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadPhasesList();
    }

    /**
     * Charge la liste des phases
     */
    async loadPhasesList() {
        const list = document.getElementById('phasesList');
        if (!list || !this.app.gameData) return;

        const phases = this.app.gameData.phases;
        list.innerHTML = '';

        const filtered = phases.map((p, index) => ({ ...p, originalIndex: index }))
            .filter(p => {
                if (!this.searchQuery) return true;
                const query = this.searchQuery.toLowerCase();
                return p.name.toLowerCase().includes(query) || p.id.toString().includes(query);
            });

        for (const phase of filtered) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.index = phase.originalIndex;

            // Disable reordering if searching
            const reorderControls = !this.searchQuery ? `
                <div class="list-item-actions" style="display: flex; flex-direction: column; gap: 2px; margin-left: 10px;">
                    <button class="btn btn-sm btn-ghost move-phase-btn" data-action="-1" data-index="${phase.originalIndex}" style="padding: 0 5px; font-size: 10px; line-height: 1;" title="Monter">▲</button>
                    <button class="btn btn-sm btn-ghost move-phase-btn" data-action="1" data-index="${phase.originalIndex}" style="padding: 0 5px; font-size: 10px; line-height: 1;" title="Descendre">▼</button>
                </div>
            ` : '';

            item.innerHTML = `
                <div style="display: flex; align-items: center; width: 100%; pointer-events: none;">
                    <div class="list-item-icon">#${phase.id}</div>
                    <div class="list-item-info" style="flex: 1; min-width: 0;">
                        <div class="list-item-name text-truncate">${phase.name}</div>
                        <div class="list-item-meta">${Math.floor(phase.duration_before_boss / 60)}m ${phase.duration_before_boss % 60}s | ${phase.enemy_types?.length || 0} ennemis</div>
                    </div>
                    <div style="pointer-events: auto;">
                        ${reorderControls}
                    </div>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.move-phase-btn')) return; // Ignore clicks on buttons
                this.selectPhase(phase.originalIndex)
            });

            // Bind button events
            const btns = item.querySelectorAll('.move-phase-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(btn.dataset.index);
                    const dir = parseInt(btn.dataset.action);
                    this.movePhase(idx, dir);
                });
            });

            list.appendChild(item);
        }

        if (filtered.length === 0) {
            list.innerHTML = '<div class="empty-list-msg">Aucune phase trouvée</div>';
        }
    }

    /**
     * Sélectionne une phase
     */
    selectPhase(index) {
        this.currentPhaseIndex = index;
        this.currentPhase = JSON.parse(JSON.stringify(this.app.gameData.phases[index]));

        document.querySelectorAll('#phasesList .list-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.index) === index);
        });

        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Rendu de l'éditeur
     */
    renderEditor() {
        const editor = document.getElementById('phaseEditor');
        if (!editor || !this.currentPhase) return;

        const p = this.currentPhase;

        // Données pour les dropdowns
        const players = this.app.gameData.players || {};
        const enemiesObj = this.app.gameData.enemies || {};
        const bossesObj = this.app.gameData.bosses || {};
        const weapons = this.app.gameData.weapons || [];

        // Conversion en tableaux pour les chips
        const enemiesArr = Object.entries(enemiesObj).map(([id, data]) => ({ id, ...data }));
        const bossesArr = Object.entries(bossesObj).map(([id, data]) => ({ id, ...data }));
        const transitions = this.app.gameData.transitions || [];

        editor.innerHTML = `
            <div class="editor-form">
                <div class="form-section">
                    <h3 class="form-section-title">Informations Générales</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ID (Nombre)</label>
                            <input type="number" class="form-input" id="phaseId" value="${p.id}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nom de la Zone</label>
                            <input type="text" class="form-input" id="phaseName" value="${p.name || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Image de Fond</label>
                            <select class="form-select" id="phaseBackground">
                                <option value="">-- Par défaut --</option>
                                ${this.app.assetScanner.getAssetPathsForSelect('fond').map(path => `<option value="${path}" ${p.background_image === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Durée avant Boss (sec)</label>
                            <input type="number" class="form-input" id="phaseDuration" value="${p.duration_before_boss || 60}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Spawn Rate (ms)</label>
                            <input type="number" class="form-input" id="phaseSpawnRate" value="${p.spawn_rate || 1000}">
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 class="form-section-title">Paramètres de Difficulté (Menace)</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Multiplicateur d'Intensité (x0.5 - x3.0)</label>
                            <input type="number" step="0.1" class="form-input" id="phaseDifficultyMultiplier" value="${p.difficulty_multiplier || 1.0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Budget Initial (PM)</label>
                            <input type="number" class="form-input" id="phaseInitialThreat" value="${p.initial_threat_budget || 20}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Budget Max (PM)</label>
                            <input type="number" class="form-input" id="phaseMaxThreat" value="${p.max_threat_budget || 200}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Taux de croissance (PM/sec)</label>
                            <input type="number" step="0.1" class="form-input" id="phaseThreatGrowth" value="${p.threat_growth_rate || 0.5}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Configuration des Entités</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Joueur</label>
                            <select class="form-select" id="phasePlayer">
                                ${Object.keys(players).map(id => `<option value="${id}" ${p.player_id === id ? 'selected' : ''}>${players[id].name || id}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Boss de fin</label>
                            <select class="form-select" id="phaseBoss">
                                <option value="">-- Aucun --</option>
                                ${bossesArr.map(b => `<option value="${b.id}" ${p.boss_id === b.id ? 'selected' : ''}>${b.name || b.id}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Armes</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Arme par défaut</label>
                            <select class="form-select" id="phaseDefaultWeapon">
                                <option value="">-- Aucune --</option>
                                ${weapons.map(w => `<option value="${w.id}" ${p.default_weapon === w.id ? 'selected' : ''}>${w.name || w.id}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Taux de Drop Arme (0-1)</label>
                            <input type="number" step="0.01" min="0" max="1" class="form-input" id="phaseWeaponDropRate" value="${p.weapon_drop_rate !== undefined ? p.weapon_drop_rate : 0.25}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Armes disponibles (Loot)</label>
                        <div class="chips-container" id="availableWeaponsChips">
                            ${this.renderChips(weapons, p.available_weapons || [], 'weapon')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Améliorations disponibles (Level Up)</label>
                        <div class="chips-container" id="availableUpgradesChips">
                            ${this.renderChips(this.app.gameData.upgrades || [], p.available_upgrades || [], 'upgrade')}
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Bestiaire (Ennemis)</h3>
                    <div class="form-group">
                        <label class="form-label">Ennemis pouvant apparaître</label>
                        <div class="chips-container" id="enemyTypesChips">
                            ${this.renderChips(enemiesArr, p.enemy_types || [], 'enemy')}
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Visuels des Butins (Loots)</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Sprite XP (Orbes)</label>
                            <select class="form-select" id="phaseXpVisual">
                                <option value="">-- Cercle vert (Défaut) --</option>
                                ${this.app.assetScanner.getAssetPathsForSelect().map(path => `<option value="${path}" ${p.xp_visual === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Taille XP</label>
                            <input type="number" class="form-input" id="phaseXpSize" value="${p.xp_size || 20}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Sprite Arme (Bonus)</label>
                            <select class="form-select" id="phaseWeaponVisual">
                                <option value="">-- Étoile dorée (Défaut) --</option>
                                ${this.app.assetScanner.getAssetPathsForSelect().map(path => `<option value="${path}" ${p.weapon_visual === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Taille Arme</label>
                            <input type="number" class="form-input" id="phaseWeaponSize" value="${p.weapon_size || 30}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Séquences Narratives (Histoire)</h3>
                    <div class="form-group">
                        <label class="form-label">Intro (Avant la phase)</label>
                        <div class="form-row" style="align-items: flex-end;">
                            <div class="form-group" style="flex: 1;">
                                <select class="form-select" id="phaseTransitionIntro">
                                    <option value="">-- Aucune --</option>
                                    ${transitions.map(t => `<option value="${t.id}" ${p.transition_intro_id === t.id ? 'selected' : ''}>${t.name || t.id} (${t.pages?.length || 0} pages)</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="flex: 0 0 auto; margin-bottom: 0;">
                                <button class="btn btn-secondary edit-transition-btn" data-type="intro" ${!p.transition_intro_id ? 'disabled' : ''}>✏️ Éditer</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Outro (Après le boss)</label>
                        <div class="form-row" style="align-items: flex-end;">
                            <div class="form-group" style="flex: 1;">
                                <select class="form-select" id="phaseTransitionOutro">
                                    <option value="">-- Aucune --</option>
                                    ${transitions.map(t => `<option value="${t.id}" ${p.transition_outro_id === t.id ? 'selected' : ''}>${t.name || t.id} (${t.pages?.length || 0} pages)</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="flex: 0 0 auto; margin-bottom: 0;">
                                <button class="btn btn-secondary edit-transition-btn" data-type="outro" ${!p.transition_outro_id ? 'disabled' : ''}>✏️ Éditer</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Défaite (Mort du joueur)</label>
                        <div class="form-row" style="align-items: flex-end;">
                            <div class="form-group" style="flex: 1;">
                                <select class="form-select" id="phaseTransitionDefeat">
                                    <option value="">-- Aucune (Game Over standard) --</option>
                                    ${transitions.map(t => `<option value="${t.id}" ${p.transition_defeat_id === t.id ? 'selected' : ''}>${t.name || t.id} (${t.pages?.length || 0} pages)</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="flex: 0 0 auto; margin-bottom: 0;">
                                <button class="btn btn-secondary edit-transition-btn" data-type="defeat" ${!p.transition_defeat_id ? 'disabled' : ''}>✏️ Éditer</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-danger" id="deletePhaseBtn">🗑️ Supprimer</button>
                    <button class="btn btn-success" id="savePhaseBtn">💾 Sauvegarder</button>
                </div>
            </div>
        `;

        this.bindEditorEvents();
    }

    /**
     * Rendu des chips (multi-sélection)
     */
    renderChips(allData, selectedIds, type) {
        return allData.map(item => {
            const isSelected = selectedIds.includes(item.id);
            return `
                <div class="chip ${isSelected ? 'active' : ''}" data-id="${item.id}" data-type="${type}">
                    ${item.name || item.id}
                    <span class="chip-status">${isSelected ? '✓' : '+'}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Rendu des pages de story
     */
    renderStoryPages(pages, prefix) {
        if (!pages || pages.length === 0) return '<p class="empty-list-msg">Aucune page de narration définie.</p>';

        return pages.map((page, idx) => `
            <div class="story-page-item panel" data-index="${idx}" data-prefix="${prefix}">
                <div class="panel-header" style="padding: var(--space-xs) var(--space-sm);">
                    <span class="panel-title" style="font-size: 0.8rem;">Page ${idx + 1}</span>
                    <button class="btn btn-icon-sm remove-story-page" data-index="${idx}" data-prefix="${prefix}">✕</button>
                </div>
                <div class="panel-body" style="padding: var(--space-sm);">
                    <div class="form-group">
                        <label class="form-label">Titre</label>
                        <input type="text" class="form-input story-title" value="${page.title || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Texte</label>
                        <textarea class="form-input story-text" rows="3">${page.text || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Illustration (Image)</label>
                        <select class="form-select story-image">
                            <option value="">-- Aucune --</option>
                            ${this.app.assetScanner.getAssetPathsForSelect().map(path => `<option value="${path}" ${page.image === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Bindings
     */
    bindEvents() {
        document.getElementById('phaseSearch')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.loadPhasesList();
        });

        document.getElementById('addPhaseBtn')?.addEventListener('click', () => this.addNewPhase());
    }

    bindEditorEvents() {
        const editor = document.getElementById('phaseEditor');
        if (!editor) return;

        // Inputs -> update
        editor.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', () => this.updatePhaseFromForm());
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.addEventListener('input', () => this.updatePhaseFromForm());
            }
        });

        // Chips
        editor.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const status = chip.querySelector('.chip-status');
                if (status) status.textContent = chip.classList.contains('active') ? '✓' : '+';
                this.updatePhaseFromForm();
            });
        });

        // Story management
        document.getElementById('addStoryIntroBtn')?.addEventListener('click', () => this.addStoryPage('intro'));
        document.getElementById('addStoryOutroBtn')?.addEventListener('click', () => this.addStoryPage('outro'));

        editor.querySelectorAll('.remove-story-page').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prefix = e.target.closest('.story-page-item').dataset.prefix;
                const index = parseInt(e.target.dataset.index);
                this.removeStoryPage(prefix, index);
            });
        });

        // Actions
        document.getElementById('savePhaseBtn')?.addEventListener('click', () => this.savePhase());
        document.getElementById('deletePhaseBtn')?.addEventListener('click', () => this.deletePhase());

        // Edit transition links
        editor.querySelectorAll('.edit-transition-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                let transitionId;
                if (type === 'intro') transitionId = this.currentPhase.transition_intro_id;
                else if (type === 'outro') transitionId = this.currentPhase.transition_outro_id;
                else if (type === 'defeat') transitionId = this.currentPhase.transition_defeat_id;

                if (transitionId) {
                    // Switch to transitions module
                    this.app.navigateTo('transitions');
                    // Select the specific transition
                    const index = this.app.gameData.transitions.findIndex(t => t.id === transitionId);
                    if (index !== -1) {
                        this.app.modules.transitions.selectTransition(index);
                    }
                }
            });
        });

        // JSON toggle
        document.getElementById('togglePhaseJsonBtn')?.addEventListener('click', (e) => {
            const content = document.getElementById('phaseJsonPreview');
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
     * Mise à jour de l'objet depuis le form
     */
    updatePhaseFromForm() {
        if (!this.currentPhase) return;

        const p = this.currentPhase;
        p.id = parseInt(document.getElementById('phaseId').value);
        p.name = document.getElementById('phaseName').value;
        p.duration_before_boss = parseInt(document.getElementById('phaseDuration').value);
        p.spawn_rate = parseInt(document.getElementById('phaseSpawnRate').value);
        p.player_id = document.getElementById('phasePlayer').value;
        p.boss_id = document.getElementById('phaseBoss').value;
        p.default_weapon = document.getElementById('phaseDefaultWeapon').value;
        p.weapon_drop_rate = parseFloat(document.getElementById('phaseWeaponDropRate').value);
        if (isNaN(p.weapon_drop_rate)) p.weapon_drop_rate = 0.25;
        p.background_image = document.getElementById('phaseBackground').value;

        // Difficulté
        p.difficulty_multiplier = parseFloat(document.getElementById('phaseDifficultyMultiplier').value) || 1.0;
        p.initial_threat_budget = parseInt(document.getElementById('phaseInitialThreat').value) || 20;
        p.max_threat_budget = parseInt(document.getElementById('phaseMaxThreat').value) || 200;
        p.threat_growth_rate = parseFloat(document.getElementById('phaseThreatGrowth').value) || 0.5;
        p.xp_visual = document.getElementById('phaseXpVisual').value;
        p.xp_size = parseInt(document.getElementById('phaseXpSize').value) || 20;
        p.weapon_visual = document.getElementById('phaseWeaponVisual').value;
        p.weapon_size = parseInt(document.getElementById('phaseWeaponSize').value) || 30;
        p.transition_intro_id = document.getElementById('phaseTransitionIntro').value;
        p.transition_outro_id = document.getElementById('phaseTransitionOutro').value;

        // Chips -> Arrays
        p.enemy_types = Array.from(document.querySelectorAll('#phasesSection .chip[data-type="enemy"].active'))
            .map(c => c.dataset.id);

        p.available_weapons = Array.from(document.querySelectorAll('#phasesSection .chip[data-type="weapon"].active'))
            .map(c => c.dataset.id);

        p.available_upgrades = Array.from(document.querySelectorAll('#phasesSection .chip[data-type="upgrade"].active'))
            .map(c => c.dataset.id);

        p.transition_intro_id = document.getElementById('phaseTransitionIntro').value;
        p.transition_outro_id = document.getElementById('phaseTransitionOutro').value;
        p.transition_defeat_id = document.getElementById('phaseTransitionDefeat').value;

        // Update edit buttons state
        const introBtn = document.querySelector('.edit-transition-btn[data-type="intro"]');
        const outroBtn = document.querySelector('.edit-transition-btn[data-type="outro"]');
        const defeatBtn = document.querySelector('.edit-transition-btn[data-type="defeat"]');
        if (introBtn) introBtn.disabled = !p.transition_intro_id;
        if (outroBtn) outroBtn.disabled = !p.transition_outro_id;
        if (defeatBtn) defeatBtn.disabled = !p.transition_defeat_id;

        // Legacy compatibility: story sequences are now handled by transitions
        p.story_intro = [];
        p.story_outro = [];

        this.updateJsonPreview();
    }

    addStoryPage(prefix) {
        const key = prefix === 'intro' ? 'story_intro' : 'story_outro';
        if (!this.currentPhase[key]) this.currentPhase[key] = [];
        this.currentPhase[key].push({ title: 'Nouveau Titre', text: 'Nouveau texte...' });
        this.renderEditor();
        this.updateJsonPreview();
    }

    removeStoryPage(prefix, index) {
        const key = prefix === 'intro' ? 'story_intro' : 'story_outro';
        this.currentPhase[key].splice(index, 1);
        this.renderEditor();
        this.updateJsonPreview();
    }

    updateJsonPreview() {
        const preview = document.getElementById('phaseJsonPreview');
        if (preview && this.currentPhase) {
            preview.innerHTML = `<pre>${JSON.stringify(this.currentPhase, null, 4)}</pre>`;
        }
    }

    /**
     * CRUD
     */
    addNewPhase() {
        // Trouver le prochain ID
        const nextId = Math.max(...this.app.gameData.phases.map(p => p.id), 0) + 1;
        const newPhase = {
            id: nextId,
            name: 'Nouvelle Phase',
            duration_before_boss: 60,
            enemy_types: [],
            player_id: Object.keys(this.app.gameData.players || {})[0] || '',
            spawn_rate: 1000,
            default_weapon: this.app.gameData.weapons[0]?.id || '',
            weapon_drop_rate: 0.25,
            available_weapons: [],
            boss_id: this.app.gameData.bosses[0]?.id || '',
            background_image: '',
            xp_visual: '',
            xp_size: 20,
            weapon_visual: '',
            weapon_size: 30,
            story_intro: [],
            story_outro: []
        };

        this.app.gameData.phases.push(newPhase);
        this.currentPhaseIndex = this.app.gameData.phases.length - 1;
        this.currentPhase = JSON.parse(JSON.stringify(newPhase));

        this.loadPhasesList();
        this.selectPhase(this.currentPhaseIndex);
        this.app.showNotification('Nouvelle phase créée', 'success');
    }

    /**
     * Déplace une phase dans la liste
     */
    async movePhase(index, direction) {
        const newIndex = index + direction;
        // Vérification des bornes
        if (newIndex < 0 || newIndex >= this.app.gameData.phases.length) return;

        // Swap dans le tableau
        const temp = this.app.gameData.phases[newIndex];
        this.app.gameData.phases[newIndex] = this.app.gameData.phases[index];
        this.app.gameData.phases[index] = temp;

        // Mettre à jour la sélection si nécessaire
        if (this.currentPhaseIndex === index) {
            this.currentPhaseIndex = newIndex;
        } else if (this.currentPhaseIndex === newIndex) {
            this.currentPhaseIndex = index;
        }

        try {
            // Sauvegarde silencieuse
            this.app.gameData.phasesFull.phases = this.app.gameData.phases;
            await this.app.fileManager.writeJSON('phases.json', this.app.gameData.phasesFull);

            // Rafraîchir l'interface
            this.loadPhasesList();

            // Garder la sélection visuelle
            if (this.currentPhaseIndex !== null) {
                this.selectPhase(this.currentPhaseIndex);
            }
        } catch (error) {
            console.error('Erreur lors du déplacement:', error);
            this.app.showNotification('Erreur de sauvegarde', 'error');
        }
    }

    async deletePhase() {
        if (!this.currentPhase) return;
        if (!confirm('Supprimer cette phase définitivement ?')) return;

        try {
            this.app.gameData.phases.splice(this.currentPhaseIndex, 1);
            this.currentPhase = null;
            this.currentPhaseIndex = null;

            // Update the phases list in the full object
            this.app.gameData.phasesFull.phases = this.app.gameData.phases;
            await this.app.fileManager.writeJSON('phases.json', this.app.gameData.phasesFull);
            await this.loadPhasesList();
            this.app.updateStats();

            document.getElementById('phaseEditor').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <h3 class="empty-state-title">Phase supprimée</h3>
                </div>
            `;
            this.app.showNotification('Phase supprimée', 'info');
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.app.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
        }
    }

    async savePhase() {
        if (!this.currentPhase) return;

        try {
            this.app.gameData.phases[this.currentPhaseIndex] = JSON.parse(JSON.stringify(this.currentPhase));
            // Update the phases list in the full object
            this.app.gameData.phasesFull.phases = this.app.gameData.phases;
            await this.app.fileManager.writeJSON('phases.json', this.app.gameData.phasesFull);

            this.app.showNotification('Phase sauvegardée avec succès', 'success');
            await this.loadPhasesList();
            this.app.updateStats();

            // Garder la sélection
            document.querySelectorAll('#phasesList .list-item').forEach(item => {
                if (parseInt(item.dataset.index) === this.currentPhaseIndex) item.classList.add('active');
            });
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.app.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }
}

window.PhasesModule = PhasesModule;
