/**
 * UpgradesModule - Éditeur des améliorations de statistiques (upgrades)
 */
class UpgradesModule {
    constructor(app) {
        this.app = app;
        this.currentUpgradeIndex = null;
        this.currentUpgrade = null;
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
        const section = document.getElementById('upgradesSection');
        if (!section) return;

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">⚡ Éditeur d'Améliorations</h2>
            </div>

            <div class="editor-layout">
                <!-- Liste des upgrades -->
                <div class="editor-sidebar panel">
                    <div class="panel-header">
                        <span class="panel-title">Améliorations</span>
                        <button class="btn btn-sm btn-primary" id="addUpgradeBtn">+ Nouveau</button>
                    </div>
                    <div class="panel-body">
                        <div class="search-box">
                            <input type="text" class="form-input" id="upgradeSearch" placeholder="🔍 Rechercher..." value="${this.searchQuery}">
                        </div>
                        <div class="items-list" id="upgradesList">
                            <!-- Rempli par JS -->
                        </div>
                    </div>
                </div>

                <!-- Éditeur principal -->
                <div class="editor-main">
                    <div class="editor-content" id="upgradeEditor">
                        <div class="empty-state">
                            <div class="empty-state-icon">⚡</div>
                            <h3 class="empty-state-title">Sélectionnez une amélioration</h3>
                            <p class="empty-state-desc">Choisissez une amélioration dans la liste ou créez-en une nouvelle</p>
                        </div>
                    </div>
                </div>

                <!-- Preview JSON -->
                <div class="editor-preview">
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">JSON Preview</span>
                        </div>
                        <div class="panel-body json-preview-content" id="upgradeJsonPreview">
                            <pre>Sélectionnez une amélioration...</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadUpgradesList();
    }

    /**
     * Charge la liste des améliorations
     */
    loadUpgradesList() {
        const listContainer = document.getElementById('upgradesList');
        if (!listContainer) return;

        const upgrades = this.app.gameData.upgrades;
        listContainer.innerHTML = '';

        const filteredUpgrades = upgrades.filter(u =>
            u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            u.id.toLowerCase().includes(this.searchQuery.toLowerCase())
        );

        if (filteredUpgrades.length === 0) {
            listContainer.innerHTML = '<div class="empty-list">Aucun résultat</div>';
            return;
        }

        filteredUpgrades.forEach((u, index) => {
            const originalIndex = upgrades.indexOf(u);
            const item = document.createElement('div');
            item.className = `list-item ${this.currentUpgradeIndex === originalIndex ? 'active' : ''}`;
            item.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${u.name}</div>
                    <div class="item-id">${u.id}</div>
                </div>
                <div class="item-badge">${u.stat}</div>
            `;
            item.addEventListener('click', () => this.selectUpgrade(originalIndex));
            listContainer.appendChild(item);
        });
    }

    /**
     * Sélectionne une amélioration
     */
    selectUpgrade(index) {
        this.currentUpgradeIndex = index;
        this.currentUpgrade = JSON.parse(JSON.stringify(this.app.gameData.upgrades[index]));

        this.loadUpgradesList();
        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Rendu des événements
     */
    bindEvents() {
        const section = document.getElementById('upgradesSection');
        if (!section) return;

        // Recherche
        section.addEventListener('input', (e) => {
            if (e.target.id === 'upgradeSearch') {
                this.searchQuery = e.target.value;
                this.loadUpgradesList();
            }
        });

        // Ajouter
        section.addEventListener('click', (e) => {
            if (e.target.id === 'addUpgradeBtn') {
                this.addNewUpgrade();
            }
        });
    }

    /**
     * Ajoute une nouvelle amélioration
     */
    addNewUpgrade() {
        const newUpgrade = {
            id: `new_upgrade_${Date.now()}`,
            name: "Nouvelle Amélioration",
            description: "Description de l'amélioration",
            type: "stat",
            stat: "speed",
            multiplier: 1.15
        };

        this.app.gameData.upgrades.push(newUpgrade);
        this.selectUpgrade(this.app.gameData.upgrades.length - 1);
        this.app.showNotification('Amélioration ajoutée', 'success');
    }

    /**
     * Rendu de l'éditeur
     */
    renderEditor() {
        const editor = document.getElementById('upgradeEditor');
        if (!editor || !this.currentUpgrade) return;

        editor.innerHTML = `
            <div class="panel">
                <div class="panel-header">
                    <span class="panel-title">Édition : ${this.currentUpgrade.name}</span>
                    <div class="panel-actions">
                        <button class="btn btn-sm btn-danger" id="deleteUpgradeBtn">Supprimer</button>
                        <button class="btn btn-sm btn-primary" id="saveUpgradeBtn">Enregistrer tout</button>
                    </div>
                </div>
                <div class="panel-body">
                    <form id="upgradeForm" class="editor-form">
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">ID Unique</label>
                                <input type="text" class="form-input" name="id" value="${this.currentUpgrade.id}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nom</label>
                                <input type="text" class="form-input" name="name" value="${this.currentUpgrade.name}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-input" name="description" rows="2">${this.currentUpgrade.description}</textarea>
                        </div>

                        <div class="form-divider">Paramètres de Statistique</div>

                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Statistique ciblée</label>
                                <select class="form-input" name="stat">
                                    <option value="speed" ${this.currentUpgrade.stat === 'speed' ? 'selected' : ''}>Vitesse</option>
                                    <option value="damage" ${this.currentUpgrade.stat === 'damage' ? 'selected' : ''}>Dégâts</option>
                                    <option value="fireRate" ${this.currentUpgrade.stat === 'fireRate' ? 'selected' : ''}>Cadence de tir</option>
                                    <option value="maxHp" ${this.currentUpgrade.stat === 'maxHp' ? 'selected' : ''}>HP Max</option>
                                    <option value="pickupRadius" ${this.currentUpgrade.stat === 'pickupRadius' ? 'selected' : ''}>Portée collecte</option>
                                    <option value="projectileBonus" ${this.currentUpgrade.stat === 'projectileBonus' ? 'selected' : ''}>Projectiles bonus</option>
                                    <option value="rangeMultiplier" ${this.currentUpgrade.stat === 'rangeMultiplier' ? 'selected' : ''}>Portée / Taille</option>
                                    <option value="explosionRadiusMultiplier" ${this.currentUpgrade.stat === 'explosionRadiusMultiplier' ? 'selected' : ''}>Taille Explosion</option>
                                    <option value="piercingBonus" ${this.currentUpgrade.stat === 'piercingBonus' ? 'selected' : ''}>Transpercement</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Valeur (Multiplier ou Add)</label>
                                <div class="form-row">
                                    <input type="number" step="0.01" class="form-input" name="value" 
                                        value="${this.currentUpgrade.multiplier || this.currentUpgrade.add || 0}">
                                    <select class="form-input" name="valueType" style="width: 120px">
                                        <option value="multiplier" ${this.currentUpgrade.multiplier ? 'selected' : ''}>Multiplier</option>
                                        <option value="add" ${this.currentUpgrade.add ? 'selected' : ''}>Additionner</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Événements du formulaire
        const form = editor.querySelector('#upgradeForm');
        form.addEventListener('input', () => this.updateUpgradeFromForm());

        editor.querySelector('#deleteUpgradeBtn').addEventListener('click', () => this.deleteUpgrade());
        editor.querySelector('#saveUpgradeBtn').addEventListener('click', () => this.saveAll());
    }

    /**
     * Met à jour l'objet courant depuis le formulaire
     */
    updateUpgradeFromForm() {
        const form = document.getElementById('upgradeForm');
        if (!form) return;

        const formData = new FormData(form);
        const value = parseFloat(formData.get('value'));
        const valueType = formData.get('valueType');

        this.currentUpgrade.id = formData.get('id');
        this.currentUpgrade.name = formData.get('name');
        this.currentUpgrade.description = formData.get('description');
        this.currentUpgrade.stat = formData.get('stat');

        // Reset values
        delete this.currentUpgrade.multiplier;
        delete this.currentUpgrade.add;

        if (valueType === 'multiplier') {
            this.currentUpgrade.multiplier = value;
        } else {
            this.currentUpgrade.add = value;
        }

        // Mettre à jour dans la liste principale
        this.app.gameData.upgrades[this.currentUpgradeIndex] = JSON.parse(JSON.stringify(this.currentUpgrade));

        this.updateJsonPreview();
        this.loadUpgradesList();
    }

    /**
     * Supprime l'amélioration courante
     */
    deleteUpgrade() {
        if (!confirm('Voulez-vous vraiment supprimer cette amélioration ?')) return;

        this.app.gameData.upgrades.splice(this.currentUpgradeIndex, 1);
        this.currentUpgradeIndex = null;
        this.currentUpgrade = null;

        this.render();
        this.app.showNotification('Amélioration supprimée', 'warning');
    }

    /**
     * Sauvegarde tout dans le fichier JSON
     */
    async saveAll() {
        try {
            const saveBtn = document.getElementById('saveUpgradeBtn');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner spinner-sm"></span> Sauvegarde...';

            await this.app.fileManager.writeJSON('upgrades.json', {
                upgrades: this.app.gameData.upgrades
            });

            this.app.showNotification('Données sauvegardées avec succès !', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.app.showNotification('Erreur lors de la sauvegarde : ' + error.message, 'error');
        } finally {
            const saveBtn = document.getElementById('saveUpgradeBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Enregistrer tout';
            }
        }
    }

    /**
     * Met à jour la prévisualisation JSON
     */
    updateJsonPreview() {
        const preview = document.getElementById('upgradeJsonPreview');
        if (!preview || !this.currentUpgrade) return;

        preview.innerHTML = `<pre>${JSON.stringify(this.currentUpgrade, null, 4)}</pre>`;
    }
}

// Export global
window.UpgradesModule = UpgradesModule;
