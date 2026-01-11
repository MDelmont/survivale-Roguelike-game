/**
 * ConfigModule - Gestion de la configuration globale du projet
 */
class ConfigModule {
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
        const section = document.getElementById('configSection');
        if (!section) return;

        const phasesData = this.app.gameData.phasesFull || {};
        const menuBackground = phasesData.menu_background || '';
        const victoryBackground = phasesData.victory_background || '';

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">⚙️ Paramètres Globaux</h2>
            </div>

            <div class="editor-layout">
                <div class="editor-main" style="flex: 1;">
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Configuration de l'Interface</span>
                        </div>
                        <div class="panel-body">
                            <div class="editor-form">
                                <div class="form-section">
                                    <h3 class="form-section-title">Écrans Centraux</h3>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Fond Menu Principal</label>
                                        <div class="form-row">
                                            <select class="form-select config-bg-select" id="configMenuBackground" data-preview="menuBgPreview" style="flex: 1;">
                                                <option value="">-- Par défaut (Noir/Dégradé) --</option>
                                                ${this.app.assetScanner.getAssetPathsForSelect('fond').map(path => `<option value="${path}" ${menuBackground === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">Fond Écran Victoire</label>
                                        <div class="form-row">
                                            <select class="form-select config-bg-select" id="configVictoryBackground" data-preview="victoryBgPreview" style="flex: 1;">
                                                <option value="">-- Par défaut --</option>
                                                ${this.app.assetScanner.getAssetPathsForSelect('fond').map(path => `<option value="${path}" ${victoryBackground === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                                            </select>
                                        </div>
                                        <small class="form-help">Image affichée lors de la victoire finale.</small>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button class="btn btn-success" id="saveConfigBtn">💾 Sauvegarder les Paramètres</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="editor-preview" style="width: 300px; display: flex; flex-direction: column; gap: 20px;">
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Aperçu Menu</span>
                        </div>
                        <div class="panel-body">
                            <div id="menuBgPreview" class="preview-canvas" style="height: 150px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #1e293b;">
                                ${menuBackground ? '' : '<span style="color: var(--text-muted)">Aucun fond</span>'}
                            </div>
                        </div>
                    </div>

                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Aperçu Victoire</span>
                        </div>
                        <div class="panel-body">
                            <div id="victoryBgPreview" class="preview-canvas" style="height: 150px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #1e293b;">
                                ${victoryBackground ? '' : '<span style="color: var(--text-muted)">Par défaut</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updatePreview('configMenuBackground');
        this.updatePreview('configVictoryBackground');
    }

    /**
     * Bindings
     */
    bindEvents() {
        const selects = document.querySelectorAll('.config-bg-select');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                this.updatePreview(select.id);
            });
        });

        const saveBtn = document.getElementById('saveConfigBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfig());
        }

        // Back button
        const backBtn = document.querySelector('#configSection .back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.app.navigateTo('hub'));
        }
    }

    /**
     * Met à jour la prévisualisation pour un select spécifique
     */
    async updatePreview(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const path = select.value;
        const previewId = select.dataset.preview;
        const preview = document.getElementById(previewId);
        if (!preview) return;

        if (path) {
            const url = await this.app.assetScanner.getAssetURL(path);
            preview.style.backgroundImage = `url(${url})`;
            preview.innerHTML = '';
        } else {
            preview.style.backgroundImage = 'none';
            preview.innerHTML = `<span style="color: var(--text-muted)">${selectId.includes('Victory') ? 'Par défaut' : 'Aucun fond'}</span>`;
        }
    }

    /**
     * Sauvegarde la configuration
     */
    async saveConfig() {
        const menuBackground = document.getElementById('configMenuBackground').value;
        const victoryBackground = document.getElementById('configVictoryBackground').value;

        // Mettre à jour les données dans l'objet complet
        if (!this.app.gameData.phasesFull) {
            this.app.gameData.phasesFull = { phases: this.app.gameData.phases || [] };
        }
        this.app.gameData.phasesFull.menu_background = menuBackground;
        this.app.gameData.phasesFull.victory_background = victoryBackground;

        try {
            this.app.showNotification('Sauvegarde de la configuration...', 'info');

            // On réécrit tout le fichier phases.json
            await this.app.fileManager.writeJSON('phases.json', this.app.gameData.phasesFull);

            this.app.showNotification('Configuration sauvegardée !', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde config:', error);
            this.app.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }
}

window.ConfigModule = ConfigModule;
