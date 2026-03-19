/**
 * InfiniteModule - Gestion du mode Infini
 */
class InfiniteModule {
    constructor(app) {
        this.app = app;
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
        const section = document.getElementById('infiniteSection');
        if (!section) return;

        const phasesData = this.app.gameData.phasesFull || {};
        const config = phasesData.infinite_mode || {
            enemy_types: [],
            available_weapons: [],
            available_upgrades: [],
            background_image: '',
            xp_visual: '',
            weapon_visual: '',
            spawn_rate: 1000,
            initial_threat_budget: 20,
            max_threat_budget: 200,
            threat_growth_rate: 0.5,
            acceleration_rate: 0,
            difficulties: {
                simple: { stat_multiplier: 0.8, score_multiplier: 1, spawn_rate_multiplier: 1.2, initial_threat_multiplier: 0.8, max_threat_multiplier: 0.8 },
                medium: { stat_multiplier: 1.0, score_multiplier: 2, spawn_rate_multiplier: 1.0, initial_threat_multiplier: 1.0, max_threat_multiplier: 1.0 },
                extreme: { stat_multiplier: 1.5, score_multiplier: 3, spawn_rate_multiplier: 0.7, initial_threat_multiplier: 1.5, max_threat_multiplier: 1.5 }
            }
        };

        const allUpgrades = this.app.gameData.upgrades || [];
        const xpAssets = this.app.assetScanner.getAssetPathsForSelect('experiences');

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">♾️ Configuration du Mode Infini</h2>
            </div>

            <div class="editor-layout full-width">
                <div class="editor-main">
                    <div class="editor-form">
                        <!-- Configuration Générale -->
                        <div class="form-section">
                            <h3 class="form-section-title">🌍 Configuration Générale</h3>
                                <div class="form-group">
                                    <label class="form-label">Intervalle d'apparition de base (ms)</label>
                                    <input type="number" class="form-input" id="infiniteSpawnRate" value="${config.spawn_rate || 1000}">
                                </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Budget Initial (PM)</label>
                                    <input type="number" class="form-input" id="infiniteInitialThreat" value="${config.initial_threat_budget || 20}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Budget Max (PM)</label>
                                    <input type="number" class="form-input" id="infiniteMaxThreat" value="${config.max_threat_budget || 200}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Taux de croissance (PM/sec)</label>
                                    <input type="number" step="0.1" class="form-input" id="infiniteThreatGrowth" value="${config.threat_growth_rate || 0.5}">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Accélération (stats % / min) <span class="info-icon" data-tooltip="Augmente les PV/Dégâts des ennemis chaque minute après que le budget max a été atteint.">ⓘ</span></label>
                                    <input type="number" step="1" class="form-input" id="infiniteAcceleration" value="${config.acceleration_rate || 0}">
                                </div>
                            </div>
                        </div>

                        <!-- Paramètres de Difficulté -->
                        <div class="form-section">
                            <h3 class="form-section-title">⚖️ Paramètres de Difficulté</h3>
                            <div class="form-row">
                                <div class="panel" style="flex: 1;">
                                    <div class="panel-header" style="background-color: rgba(34, 197, 94, 0.1);">
                                        <span class="panel-title" style="color:#22c55e;">Simple</span>
                                    </div>
                                    <div class="panel-body">
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Stats <span class="info-icon" data-tooltip="Multiplie les PV, dégâts et vitesse des ennemis.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffSimpleStat" value="${config.difficulties?.simple?.stat_multiplier || 0.8}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Score <span class="info-icon" data-tooltip="Multiplicateur de points gagnés.">ⓘ</span></label>
                                            <input type="number" step="1" class="form-input" id="diffSimpleScore" value="${config.difficulties?.simple?.score_multiplier || 1}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur d'Intervalle <span class="info-icon" data-tooltip="Multiplie le délai d'apparition (> 1 ralentit, < 1 accélère).">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffSimpleSpawn" value="${config.difficulties?.simple?.spawn_rate_multiplier || 1.2}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Budget Initial <span class="info-icon" data-tooltip="Multiplie le budget de menace au démarrage.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffSimpleBudgetInit" value="${config.difficulties?.simple?.initial_threat_multiplier || 0.8}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Budget Max <span class="info-icon" data-tooltip="Multiplie la limite maximale du budget de menace.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffSimpleBudgetMax" value="${config.difficulties?.simple?.max_threat_multiplier || 0.8}">
                                        </div>
                                    </div>
                                </div>
                                <div class="panel" style="flex: 1;">
                                    <div class="panel-header" style="background-color: rgba(234, 179, 8, 0.1);">
                                        <span class="panel-title" style="color:#eab308;">Moyen</span>
                                    </div>
                                    <div class="panel-body">
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Stats <span class="info-icon" data-tooltip="Multiplie les PV, dégâts et vitesse des ennemis.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffMediumStat" value="${config.difficulties?.medium?.stat_multiplier || 1.0}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Score <span class="info-icon" data-tooltip="Multiplicateur de points gagnés.">ⓘ</span></label>
                                            <input type="number" step="1" class="form-input" id="diffMediumScore" value="${config.difficulties?.medium?.score_multiplier || 2}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur d'Intervalle <span class="info-icon" data-tooltip="Multiplie le délai d'apparition (> 1 ralentit, < 1 accélère).">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffMediumSpawn" value="${config.difficulties?.medium?.spawn_rate_multiplier || 1.0}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Budget Initial <span class="info-icon" data-tooltip="Multiplie le budget de menace au démarrage.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffMediumBudgetInit" value="${config.difficulties?.medium?.initial_threat_multiplier || 1.0}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Budget Max <span class="info-icon" data-tooltip="Multiplie la limite maximale du budget de menace.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffMediumBudgetMax" value="${config.difficulties?.medium?.max_threat_multiplier || 1.0}">
                                        </div>
                                    </div>
                                </div>
                                <div class="panel" style="flex: 1;">
                                    <div class="panel-header" style="background-color: rgba(239, 68, 68, 0.1);">
                                        <span class="panel-title" style="color:#ef4444;">Extrême</span>
                                    </div>
                                    <div class="panel-body">
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Stats <span class="info-icon" data-tooltip="Multiplie les PV, dégâts et vitesse des ennemis.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffExtremeStat" value="${config.difficulties?.extreme?.stat_multiplier || 1.5}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Score <span class="info-icon" data-tooltip="Multiplicateur de points gagnés.">ⓘ</span></label>
                                            <input type="number" step="1" class="form-input" id="diffExtremeScore" value="${config.difficulties?.extreme?.score_multiplier || 3}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur d'Intervalle <span class="info-icon" data-tooltip="Multiplie le délai d'apparition (> 1 ralentit, < 1 accélère).">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffExtremeSpawn" value="${config.difficulties?.extreme?.spawn_rate_multiplier || 0.7}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Budget Initial <span class="info-icon" data-tooltip="Multiplie le budget de menace au démarrage.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffExtremeBudgetInit" value="${config.difficulties?.extreme?.initial_threat_multiplier || 1.5}">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Multiplicateur de Budget Max <span class="info-icon" data-tooltip="Multiplie la limite maximale du budget de menace.">ⓘ</span></label>
                                            <input type="number" step="0.1" class="form-input" id="diffExtremeBudgetMax" value="${config.difficulties?.extreme?.max_threat_multiplier || 1.5}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pool de Contenu -->
                        <div class="form-section">
                            <h3 class="form-section-title">📦 Pool de Contenu</h3>
                            <div class="form-group">
                                <label class="form-label">Améliorations disponibles (Montée de niveau)</label>
                                <div class="chips-container" id="infiniteUpgradesChips">
                                    ${this.renderChips(allUpgrades, config.available_upgrades || [], 'upgrade')}
                                </div>
                            </div>
                        </div>

                        <!-- Visuels des Butins -->
                        <div class="form-section">
                            <h3 class="form-section-title">💎 Visuels des Butins</h3>
                                <div class="form-group">
                                    <label class="form-label">Sprite XP (Orbes)</label>
                                    <select class="form-select" id="infiniteXpVisual">
                                        <option value="">-- Par défaut --</option>
                                        ${xpAssets.map(path => `<option value="${path}" ${config.xp_visual === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                                    </select>
                                </div>
                        </div>

                        <div class="form-actions">
                            <button class="btn btn-success" id="saveInfiniteBtn">💾 Sauvegarder la Config Infinie</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
     * Bindings
     */
    bindEvents() {
        const saveBtn = document.getElementById('saveInfiniteBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfig());
        }

        const backBtn = document.querySelector('#infiniteSection .back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.app.navigateTo('hub'));
        }

        // Chips placement
        document.querySelectorAll('#infiniteSection .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const status = chip.querySelector('.chip-status');
                if (status) status.textContent = chip.classList.contains('active') ? '✓' : '+';
            });
        });
    }

    /**
     * Exécute et construit la config
     */
    getConfigFromForm() {
        const upgradeIds = Array.from(document.querySelectorAll('#infiniteSection .chip[data-type="upgrade"].active'))
            .map(c => c.dataset.id);

        return {
            spawn_rate: parseInt(document.getElementById('infiniteSpawnRate').value) || 1000,
            initial_threat_budget: parseInt(document.getElementById('infiniteInitialThreat').value) || 20,
            max_threat_budget: parseInt(document.getElementById('infiniteMaxThreat').value) || 200,
            threat_growth_rate: parseFloat(document.getElementById('infiniteThreatGrowth').value) || 0.5,
            acceleration_rate: parseInt(document.getElementById('infiniteAcceleration').value) || 0,
            xp_visual: document.getElementById('infiniteXpVisual').value,
            available_upgrades: upgradeIds,
            difficulties: {
                simple: { 
                    stat_multiplier: parseFloat(document.getElementById('diffSimpleStat').value) || 0.8,
                    score_multiplier: parseInt(document.getElementById('diffSimpleScore').value) || 1,
                    spawn_rate_multiplier: parseFloat(document.getElementById('diffSimpleSpawn').value) || 1.2,
                    initial_threat_multiplier: parseFloat(document.getElementById('diffSimpleBudgetInit').value) || 0.8,
                    max_threat_multiplier: parseFloat(document.getElementById('diffSimpleBudgetMax').value) || 0.8
                },
                medium: { 
                    stat_multiplier: parseFloat(document.getElementById('diffMediumStat').value) || 1.0,
                    score_multiplier: parseInt(document.getElementById('diffMediumScore').value) || 2,
                    spawn_rate_multiplier: parseFloat(document.getElementById('diffMediumSpawn').value) || 1.0,
                    initial_threat_multiplier: parseFloat(document.getElementById('diffMediumBudgetInit').value) || 1.0,
                    max_threat_multiplier: parseFloat(document.getElementById('diffMediumBudgetMax').value) || 1.0
                },
                extreme: { 
                    stat_multiplier: parseFloat(document.getElementById('diffExtremeStat').value) || 1.5,
                    score_multiplier: parseInt(document.getElementById('diffExtremeScore').value) || 3,
                    spawn_rate_multiplier: parseFloat(document.getElementById('diffExtremeSpawn').value) || 0.7,
                    initial_threat_multiplier: parseFloat(document.getElementById('diffExtremeBudgetInit').value) || 1.5,
                    max_threat_multiplier: parseFloat(document.getElementById('diffExtremeBudgetMax').value) || 1.5
                }
            }
        };
    }

    /**
     * Sauvegarde la configuration
     */
    async saveConfig() {
        const newConfig = this.getConfigFromForm();

        if (!this.app.gameData.phasesFull) {
            this.app.gameData.phasesFull = { phases: this.app.gameData.phases || [] };
        }
        this.app.gameData.phasesFull.infinite_mode = newConfig;

        try {
            this.app.showNotification('Sauvegarde de la configuration infinie...', 'info');
            await this.app.fileManager.writeJSON('phases.json', this.app.gameData.phasesFull);
            this.app.showNotification('Configuration infinie sauvegardée !', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde infinite:', error);
            this.app.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }
}

window.InfiniteModule = InfiniteModule;
