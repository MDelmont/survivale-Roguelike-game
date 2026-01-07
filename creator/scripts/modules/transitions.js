/**
 * TransitionsModule - Éditeur de séquences narratives et transitions
 */
class TransitionsModule {
    constructor(app) {
        this.app = app;
        this.currentTransitionIndex = null;
        this.currentTransition = null;
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
        const section = document.getElementById('transitionsSection');
        if (!section) return;

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">📖 Éditeur de Transitions</h2>
            </div>

            <div class="editor-layout">
                <!-- Liste des transitions -->
                <div class="editor-sidebar panel">
                    <div class="panel-header">
                        <span class="panel-title">Transitions</span>
                        <button class="btn btn-sm btn-primary" id="addTransitionBtn">+ Nouveau</button>
                    </div>
                    <div class="panel-body">
                        <div class="search-box">
                            <input type="text" class="form-input" id="transitionSearch" placeholder="🔍 Rechercher..." value="${this.searchQuery}">
                        </div>
                        <div class="items-list" id="transitionsList">
                            <!-- Rempli par JS -->
                        </div>
                    </div>
                </div>

                <!-- Éditeur principal -->
                <div class="editor-main">
                    <div class="editor-content" id="transitionEditor">
                        <div class="empty-state">
                            <div class="empty-state-icon">📖</div>
                            <h3 class="empty-state-title">Sélectionnez une séquence</h3>
                            <p class="empty-state-desc">Choisissez une séquence narrative dans la liste ou créez-en une nouvelle</p>
                        </div>
                    </div>
                </div>

                <!-- Preview JSON -->
                <div class="editor-preview">
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Structure JSON</span>
                            <button class="btn btn-sm btn-ghost" id="toggleTransitionJsonBtn">Masquer</button>
                        </div>
                        <div class="panel-body json-preview-content" id="transitionJsonPreview">
                            <pre>Sélectionnez une séquence...</pre>
                        </div>
                    </div>

                    <!-- Live Preview Panel -->
                    <div class="panel" style="margin-top: var(--space-md);">
                        <div class="panel-header">
                            <span class="panel-title">Prévisualisation</span>
                        </div>
                        <div class="panel-body transition-preview-box" id="transitionPreview">
                            <p class="empty-list-msg">Sélectionnez une page pour prévisualiser</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadTransitionsList();
    }

    /**
     * Charge la liste des transitions
     */
    async loadTransitionsList() {
        const list = document.getElementById('transitionsList');
        if (!list || !this.app.gameData) return;

        const transitions = this.app.gameData.transitions || [];
        list.innerHTML = '';

        const filtered = transitions.map((t, index) => ({ ...t, originalIndex: index }))
            .filter(t => {
                if (!this.searchQuery) return true;
                const query = this.searchQuery.toLowerCase();
                return (t.name || '').toLowerCase().includes(query) || (t.id || '').toLowerCase().includes(query);
            });

        for (const trans of filtered) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.index = trans.originalIndex;
            item.innerHTML = `
                <div class="list-item-icon">📖</div>
                <div class="list-item-info">
                    <div class="list-item-name">${trans.name || trans.id}</div>
                    <div class="list-item-meta">${trans.pages?.length || 0} pages</div>
                </div>
            `;
            item.addEventListener('click', () => this.selectTransition(trans.originalIndex));
            list.appendChild(item);
        }

        if (filtered.length === 0) {
            list.innerHTML = '<div class="empty-list-msg">Aucune séquence trouvée</div>';
        }
    }

    /**
     * Sélectionne une transition
     */
    selectTransition(index) {
        this.currentTransitionIndex = index;
        this.currentTransition = JSON.parse(JSON.stringify(this.app.gameData.transitions[index]));

        document.querySelectorAll('#transitionsList .list-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.index) === index);
        });

        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Rendu de l'éditeur
     */
    renderEditor() {
        const editor = document.getElementById('transitionEditor');
        if (!editor || !this.currentTransition) return;

        const t = this.currentTransition;

        editor.innerHTML = `
            <div class="editor-form">
                <div class="form-section">
                    <h3 class="form-section-title">Configuration Séquence</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ID Technique</label>
                            <input type="text" class="form-input" id="transId" value="${t.id || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nom Public</label>
                            <input type="text" class="form-input" id="transName" value="${t.name || ''}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header-inline">
                        <h3 class="form-section-title">Pages de la Séquence</h3>
                        <button class="btn btn-sm btn-secondary" id="addPageBtn">+ Ajouter Page</button>
                    </div>
                    <div id="pagesContainer" class="story-pages-list">
                        ${this.renderTransitionPages(t.pages)}
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-danger" id="deleteTransitionBtn">🗑️ Supprimer</button>
                    <button class="btn btn-success" id="saveTransitionBtn">💾 Sauvegarder</button>
                </div>
            </div>
        `;

        this.bindEditorEvents();
    }

    /**
     * Rendu des pages de transition
     */
    renderTransitionPages(pages) {
        if (!pages || pages.length === 0) return '<p class="empty-list-msg">Aucune page de transition définie.</p>';

        return pages.map((page, idx) => `
            <div class="story-page-item panel transition-page-item" data-index="${idx}">
                <div class="panel-header" style="padding: var(--space-xs) var(--space-sm);">
                    <div style="display: flex; align-items: center; gap: var(--space-sm);">
                        <div class="page-order-btns">
                            <button class="btn-order move-page-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
                            <button class="btn-order move-page-down" data-index="${idx}" ${idx === pages.length - 1 ? 'disabled' : ''}>▼</button>
                        </div>
                        <span class="panel-title" style="font-size: 0.8rem;">Page ${idx + 1}</span>
                    </div>
                    <button class="btn btn-icon-sm remove-page" data-index="${idx}">✕</button>
                </div>
                <div class="panel-body" style="padding: var(--space-sm);">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" style="display: flex; justify-content: space-between;">
                                Titre 
                                <label style="font-weight: normal; font-size: 0.7rem; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                                    <input type="checkbox" class="hide-title" ${page.hideTitle ? 'checked' : ''}> Masquer
                                </label>
                            </label>
                            <input type="text" class="form-input page-title" value="${page.title || ''}">
                        </div>
                        <div class="form-group" style="flex: 0 0 100px;">
                            <label class="form-label">Taille Titre</label>
                            <input type="number" class="form-input page-title-size" value="${page.titleSize || 24}" placeholder="px">
                        </div>
                        <div class="form-group" style="flex: 0 0 60px;">
                            <label class="form-label">Couleur</label>
                            <input type="color" class="form-input page-title-color" value="${page.titleColor || '#6366f1'}" style="padding: 2px; height: 38px;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="display: flex; justify-content: space-between;">
                            Texte
                            <label style="font-weight: normal; font-size: 0.7rem; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                                <input type="checkbox" class="hide-text" ${page.hideText ? 'checked' : ''}> Masquer
                            </label>
                        </label>
                        <textarea class="form-input page-text" rows="3">${page.text || ''}</textarea>
                        <div class="form-row" style="margin-top: var(--space-xs);">
                            <div class="form-group">
                                <label class="form-label">Taille Texte</label>
                                <input type="number" class="form-input page-text-size" value="${page.textSize || 16}" placeholder="px">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Couleur Texte</label>
                                <input type="color" class="form-input page-text-color" value="${page.textColor || '#ffffff'}" style="padding: 2px; height: 38px;">
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Musique</label>
                            <input type="text" class="form-input page-music" value="${page.music || ''}" placeholder="ex: theme_epic">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Durée (ms)</label>
                            <input type="number" class="form-input page-duration" value="${page.duration || 5000}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Illustration</label>
                            <select class="form-select page-image">
                                <option value="">-- Aucune --</option>
                                ${this.app.assetScanner.getAssetPathsForSelect().map(path => `<option value="${path}" ${page.image === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fond (Background)</label>
                            <select class="form-select page-bg">
                                <option value="">-- Par défaut --</option>
                                ${this.app.assetScanner.getAssetPathsForSelect('fond').map(path => `<option value="${path}" ${page.background === path ? 'selected' : ''}>${path.split('/').pop()}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Animation d'entrée</label>
                        <select class="form-select page-animation">
                            <option value="fade" ${page.animation === 'fade' ? 'selected' : ''}>Fondue (Fade)</option>
                            <option value="slide" ${page.animation === 'slide' ? 'selected' : ''}>Glissement (Slide)</option>
                            <option value="zoom" ${page.animation === 'zoom' ? 'selected' : ''}>Zoom</option>
                            <option value="none" ${page.animation === 'none' ? 'selected' : ''}>Aucune</option>
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
        document.getElementById('transitionSearch')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.loadTransitionsList();
        });

        document.getElementById('addTransitionBtn')?.addEventListener('click', () => this.addNewTransition());
    }

    bindEditorEvents() {
        const editor = document.getElementById('transitionEditor');
        if (!editor) return;

        // Inputs -> update
        editor.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', () => this.updateTransitionFromForm());
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.addEventListener('input', () => this.updateTransitionFromForm());
            }
        });

        // Page management
        document.getElementById('addPageBtn')?.addEventListener('click', () => this.addPage());

        editor.querySelectorAll('.remove-page').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removePage(index);
            });
        });

        // Reordering
        editor.querySelectorAll('.move-page-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.movePage(index, -1);
            });
        });

        editor.querySelectorAll('.move-page-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.movePage(index, 1);
            });
        });

        // Live Preview on click
        editor.querySelectorAll('.transition-page-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'TEXTAREA') {
                    const index = parseInt(item.dataset.index);
                    this.previewPage(index);
                }
            });
        });

        // Actions
        document.getElementById('saveTransitionBtn')?.addEventListener('click', () => this.saveTransition());
        document.getElementById('deleteTransitionBtn')?.addEventListener('click', () => this.deleteTransition());

        // JSON toggle
        document.getElementById('toggleTransitionJsonBtn')?.addEventListener('click', (e) => {
            const content = document.getElementById('transitionJsonPreview');
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
    updateTransitionFromForm() {
        if (!this.currentTransition) return;

        const t = this.currentTransition;
        t.id = document.getElementById('transId').value;
        t.name = document.getElementById('transName').value;

        // Pages
        t.pages = Array.from(document.querySelectorAll('.transition-page-item'))
            .map(item => ({
                title: item.querySelector('.page-title').value,
                titleSize: parseInt(item.querySelector('.page-title-size').value),
                titleColor: item.querySelector('.page-title-color').value,
                hideTitle: item.querySelector('.hide-title').checked,
                text: item.querySelector('.page-text').value,
                textSize: parseInt(item.querySelector('.page-text-size').value),
                textColor: item.querySelector('.page-text-color').value,
                hideText: item.querySelector('.hide-text').checked,
                image: item.querySelector('.page-image').value,
                background: item.querySelector('.page-bg').value,
                duration: parseInt(item.querySelector('.page-duration').value),
                music: item.querySelector('.page-music').value,
                animation: item.querySelector('.page-animation').value
            }));

        this.updateJsonPreview();
    }

    addPage() {
        if (!this.currentTransition.pages) this.currentTransition.pages = [];
        this.currentTransition.pages.push({ 
            title: 'Nouveau Titre', 
            titleSize: 24,
            titleColor: '#6366f1',
            hideTitle: false,
            text: 'Nouveau texte...',
            textSize: 16,
            textColor: '#ffffff',
            hideText: false,
            duration: 5000,
            animation: 'fade'
        });
        this.renderEditor();
        this.updateJsonPreview();
    }

    removePage(index) {
        this.currentTransition.pages.splice(index, 1);
        this.renderEditor();
        this.updateJsonPreview();
    }

    movePage(index, direction) {
        const pages = this.currentTransition.pages;
        const newIndex = index + direction;
        
        if (newIndex >= 0 && newIndex < pages.length) {
            const temp = pages[index];
            pages[index] = pages[newIndex];
            pages[newIndex] = temp;
            this.renderEditor();
            this.updateJsonPreview();
        }
    }

    async previewPage(index) {
        const page = this.currentTransition.pages[index];
        const previewBox = document.getElementById('transitionPreview');
        if (!previewBox || !page) return;

        let imgURL = '';
        if (page.image) {
            imgURL = await this.app.assetScanner.getAssetURL(page.image);
        }

        let bgURL = '';
        if (page.background) {
            bgURL = await this.app.assetScanner.getAssetURL(page.background);
        }

        previewBox.innerHTML = `
            <div class="transition-preview-render" style="background-image: ${bgURL ? `url(${bgURL})` : 'none'};">
                ${imgURL ? `<img src="${imgURL}" class="preview-story-img">` : ''}
                <div class="preview-story-content" style="${(page.hideTitle && page.hideText) ? 'display: none;' : ''}">
                    <h4 class="preview-story-title" style="font-size: ${page.titleSize || 24}px; color: ${page.titleColor || '#6366f1'}; ${page.hideTitle ? 'display: none;' : ''}">${page.title || ''}</h4>
                    <p class="preview-story-text" style="font-size: ${page.textSize || 16}px; color: ${page.textColor || '#ffffff'}; ${page.hideText ? 'display: none;' : ''}">${page.text || ''}</p>
                </div>
                <div class="preview-story-meta">
                    <span>⏱ ${page.duration}ms</span>
                    <span>🎵 ${page.music || 'Aucune'}</span>
                    <span>✨ ${page.animation}</span>
                </div>
            </div>
        `;
    }

    updateJsonPreview() {
        const preview = document.getElementById('transitionJsonPreview');
        if (preview && this.currentTransition) {
            preview.innerHTML = `<pre>${JSON.stringify(this.currentTransition, null, 4)}</pre>`;
        }
    }

    /**
     * CRUD
     */
    addNewTransition() {
        const newTrans = {
            id: 'transition_' + Date.now(),
            name: 'Nouvelle Transition',
            pages: []
        };

        this.app.gameData.transitions.push(newTrans);
        this.currentTransitionIndex = this.app.gameData.transitions.length - 1;
        this.currentTransition = JSON.parse(JSON.stringify(newTrans));
        
        this.loadTransitionsList();
        this.selectTransition(this.currentTransitionIndex);
        this.app.showNotification('Nouvelle transition créée', 'success');
    }

    async deleteTransition() {
        if (!this.currentTransition) return;
        if (!confirm('Supprimer cette transition définitivement ?')) return;

        try {
            this.app.gameData.transitions.splice(this.currentTransitionIndex, 1);
            this.currentTransition = null;
            this.currentTransitionIndex = null;

            await this.app.fileManager.writeJSON('transitions.json', { transitions: this.app.gameData.transitions });
            await this.loadTransitionsList();
            this.app.updateStats();

            document.getElementById('transitionEditor').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📖</div>
                    <h3 class="empty-state-title">Transition supprimée</h3>
                </div>
            `;
            this.app.showNotification('Transition supprimée', 'info');
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.app.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
        }
    }

    async saveTransition() {
        if (!this.currentTransition) return;

        try {
            this.app.gameData.transitions[this.currentTransitionIndex] = JSON.parse(JSON.stringify(this.currentTransition));
            await this.app.fileManager.writeJSON('transitions.json', { transitions: this.app.gameData.transitions });
            
            this.app.showNotification('Transition sauvegardée avec succès', 'success');
            await this.loadTransitionsList();
            this.app.updateStats();

            // Garder la sélection
            document.querySelectorAll('#transitionsList .list-item').forEach(item => {
                if (parseInt(item.dataset.index) === this.currentTransitionIndex) item.classList.add('active');
            });
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.app.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }
}

window.TransitionsModule = TransitionsModule;
