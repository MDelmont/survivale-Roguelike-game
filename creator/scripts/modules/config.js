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
                                    <h3 class="form-section-title">Écran d'Accueil</h3>
                                    <div class="form-group">
                                        <label class="form-label">Image de Fond du Menu Principal</label>
                                        <div class="form-row">
                                            <select class="form-select" id="configMenuBackground" style="flex: 1;">
                                                <option value="">-- Par défaut (Noir/Dégradé) --</option>
                                                ${this.app.assetScanner.getAssetPathsForSelect('fond').map(path => `<option value="${path}" ${menuBackground === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                                            </select>
                                        </div>
                                        <small class="form-help">Cette image s'affiche derrière le titre "EVG ANTHONY" au lancement du jeu.</small>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button class="btn btn-success" id="saveConfigBtn">💾 Sauvegarder les Paramètres</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="editor-preview" style="width: 300px;">
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Aperçu du Fond</span>
                        </div>
                        <div class="panel-body">
                            <div id="menuBgPreview" class="preview-canvas" style="height: 200px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                                ${menuBackground ? '' : '<span style="color: var(--text-muted)">Aucun fond</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updatePreview(menuBackground);
    }

    /**
     * Bindings
     */
    bindEvents() {
        const select = document.getElementById('configMenuBackground');
        if (select) {
            select.addEventListener('change', (e) => {
                this.updatePreview(e.target.value);
            });
        }

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
     * Met à jour la prévisualisation
     */
    async updatePreview(path) {
        const preview = document.getElementById('menuBgPreview');
        if (!preview) return;

        if (path) {
            const url = await this.app.assetScanner.getAssetURL(path);
            preview.style.backgroundImage = `url(${url})`;
            preview.innerHTML = '';
        } else {
            preview.style.backgroundImage = 'none';
            preview.innerHTML = '<span style="color: var(--text-muted)">Aucun fond</span>';
        }
    }

    /**
     * Sauvegarde la configuration
     */
    async saveConfig() {
        const menuBackground = document.getElementById('configMenuBackground').value;

        // Mettre à jour les données dans l'objet complet
        if (!this.app.gameData.phasesFull) {
            this.app.gameData.phasesFull = { phases: this.app.gameData.phases || [] };
        }
        this.app.gameData.phasesFull.menu_background = menuBackground;

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
