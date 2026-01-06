/**
 * EnemiesModule - Éditeur d'ennemis
 * Basé sur la documentation json_schemas.md et reference_json.md
 * 
 * Champs ennemis:
 * - name: Nom interne ou affiché
 * - hp: Points de vie
 * - speed: Vitesse de déplacement
 * - damage: Dégâts au contact
 * - xpValue: XP donnée à la mort
 * - radius: Rayon de la hitbox
 * - color: Couleur de secours (fallback)
 * - visuals: Bloc visuel de l'ennemi
 */
class EnemiesModule {
    constructor(app) {
        this.app = app;
        this.currentEnemyId = null;
        this.originalEnemyId = null;
        this.currentEnemy = null;
        this.animationInterval = null;
        this.currentFrameIndex = 0;
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
        const section = document.getElementById('enemiesSection');
        if (!section) return;

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">👾 Éditeur d'Ennemis</h2>
            </div>

            <div class="editor-layout">
                <!-- Liste des ennemis -->
                <div class="editor-sidebar panel">
                    <div class="panel-header">
                        <span class="panel-title">Ennemis</span>
                        <button class="btn btn-sm btn-primary" id="addEnemyBtn">+ Nouveau</button>
                    </div>
                    <div class="panel-body">
                        <div class="search-box">
                            <input type="text" class="form-input" id="enemySearch" placeholder="🔍 Rechercher..." value="${this.searchQuery}">
                        </div>
                        <div class="items-list" id="enemiesList">
                            <!-- Rempli par JS -->
                        </div>
                    </div>
                </div>

                <!-- Éditeur principal -->
                <div class="editor-main">
                    <div class="editor-content" id="enemyEditor">
                        <div class="empty-state">
                            <div class="empty-state-icon">👾</div>
                            <h3 class="empty-state-title">Sélectionnez un ennemi</h3>
                            <p class="empty-state-desc">Choisissez un ennemi dans la liste ou créez-en un nouveau</p>
                        </div>
                    </div>
                </div>

                <!-- Preview & JSON -->
                <div class="editor-preview">
                    <!-- Prévisualisation -->
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Prévisualisation</span>
                        </div>
                        <div class="panel-body">
                            <div class="preview-container">
                                <div class="preview-canvas" id="enemyPreviewCanvas">
                                    <span style="color: var(--text-muted)">Aucun sprite</span>
                                </div>
                                <div class="preview-controls">
                                    <div class="preview-direction-selector" style="margin-bottom: var(--space-sm);">
                                        <select class="form-select form-input-sm" id="previewDirection" title="Direction de test">
                                            <option value="down">↓ Bas</option>
                                            <option value="up">↑ Haut</option>
                                            <option value="left">← Gauche</option>
                                            <option value="right">→ Droite</option>
                                        </select>
                                    </div>
                                    <button class="btn btn-sm btn-secondary" id="playIdleBtn" disabled>▶ Idle</button>
                                    <button class="btn btn-sm btn-secondary" id="playWalkBtn" disabled>▶ Walk</button>
                                    <button class="btn btn-sm btn-danger" id="stopAnimBtn" disabled>⏹ Stop</button>
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
                        <div class="panel-body json-preview-content" id="enemyJsonPreview">
                            <pre>Sélectionnez un ennemi...</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadEnemiesList();
    }

    /**
     * Charge la liste des ennemis
     */
    async loadEnemiesList() {
        const list = document.getElementById('enemiesList');
        if (!list || !this.app.gameData) return;

        const enemies = this.app.gameData.enemies;
        list.innerHTML = '';

        // Filtrer par recherche
        const filteredEntries = Object.entries(enemies).filter(([id, enemy]) => {
            if (!this.searchQuery) return true;
            const query = this.searchQuery.toLowerCase();
            return id.toLowerCase().includes(query) || 
                   (enemy.name && enemy.name.toLowerCase().includes(query));
        });

        for (const [id, enemy] of filteredEntries) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.enemyId = id;

            // Récupérer la première frame de walk ou idle pour la prévisualisation
            const spriteUrl = await this.getEntityThumbnail(enemy);
            
            let iconHtml;
            if (spriteUrl) {
                iconHtml = `<img src="${spriteUrl}" alt="${enemy.name}" class="list-item-sprite">`;
            } else if (enemy.color) {
                iconHtml = `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${enemy.color}; border: 2px solid rgba(255,255,255,0.2);"></div>`;
            } else {
                iconHtml = '<span style="font-size: 1.5rem;">👾</span>';
            }

            item.innerHTML = `
                <div class="list-item-icon">
                    ${iconHtml}
                </div>
                <div class="list-item-info">
                    <div class="list-item-name">${enemy.name || id}</div>
                    <div class="list-item-meta">HP: ${enemy.hp} | DMG: ${enemy.damage} | SPD: ${enemy.speed}</div>
                </div>
            `;

            item.addEventListener('click', () => this.selectEnemy(id));
            list.appendChild(item);
        }

        // Message si aucun résultat
        if (filteredEntries.length === 0) {
            list.innerHTML = '<div style="padding: var(--space-md); color: var(--text-muted); text-align: center;">Aucun ennemi trouvé</div>';
        }
    }

    /**
     * Récupère l'URL du sprite de prévisualisation pour une entité
     */
    async getEntityThumbnail(entity) {
        const visuals = entity.visuals;
        if (!visuals || !visuals.animations) return null;

        const animations = visuals.animations;
        // Priorité : walk (plus commun pour les ennemis), puis idle, puis la première animation
        const animOrder = ['walk', 'idle', ...Object.keys(animations)];
        
        for (const animName of animOrder) {
            const anim = animations[animName];
            if (!anim) continue;
            
            // Gérer mode 4_way (prendre 'down' par défaut)
            if (anim.down?.frames?.length > 0) {
                return await this.app.assetScanner.getAssetURL(anim.down.frames[0]);
            } else if (anim.frames?.length > 0) {
                return await this.app.assetScanner.getAssetURL(anim.frames[0]);
            }
        }
        
        return null;
    }

    /**
     * Sélectionne un ennemi pour l'éditer
     */
    async selectEnemy(enemyId) {
        this.currentEnemyId = enemyId;
        this.originalEnemyId = enemyId;
        this.currentEnemy = JSON.parse(JSON.stringify(this.app.gameData.enemies[enemyId]));

        // Mettre à jour la sélection visuelle
        document.querySelectorAll('#enemiesList .list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.enemyId === enemyId);
        });

        // Afficher l'éditeur
        this.renderEditor();
        this.updateJsonPreview();
        await this.loadPreview();
    }

    /**
     * Rendu de l'éditeur d'ennemi
     */
    renderEditor() {
        const editor = document.getElementById('enemyEditor');
        if (!editor || !this.currentEnemy) return;

        const e = this.currentEnemy;
        const assets = this.app.assetScanner.getAssetPathsForSelect('monster');

        editor.innerHTML = `
            <div class="editor-form">
                <div class="form-section">
                    <h3 class="form-section-title">Informations de base</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ID (clé unique)</label>
                            <input type="text" class="form-input" id="enemyId" value="${this.currentEnemyId}">
                            <small style="color: var(--text-muted); font-size: 0.75rem;">Utilisé comme référence dans phases.json</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nom affiché</label>
                            <input type="text" class="form-input" id="enemyName" value="${e.name || ''}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Statistiques de Combat</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Points de vie (HP)</label>
                            <input type="number" class="form-input" id="enemyHp" value="${e.hp || 20}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Vitesse (speed)</label>
                            <input type="number" class="form-input" id="enemySpeed" value="${e.speed || 100}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dégâts (damage)</label>
                            <input type="number" class="form-input" id="enemyDamage" value="${e.damage || 5}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">XP donnée (xpValue)</label>
                            <input type="number" class="form-input" id="enemyXpValue" value="${e.xpValue || 10}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Rayon hitbox (radius)</label>
                            <input type="number" class="form-input" id="enemyRadius" value="${e.radius || 12}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Couleur fallback</label>
                            <div class="color-input-group">
                                <input type="color" class="form-color" id="enemyColorPicker" value="${e.color || '#ffffff'}">
                                <input type="text" class="form-input" id="enemyColor" value="${e.color || '#fff'}" placeholder="#ff0000">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Visuels</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="enemyVisualType">
                                <option value="sprite" ${e.visuals?.type === 'sprite' ? 'selected' : ''}>Sprite (image)</option>
                                <option value="shape" ${e.visuals?.type === 'shape' ? 'selected' : ''}>Shape (forme)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Largeur (px)</label>
                            <input type="number" class="form-input" id="enemyWidth" value="${e.visuals?.width || 48}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Hauteur (px, optionnel)</label>
                            <input type="number" class="form-input" id="enemyHeight" value="${e.visuals?.height || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Direction Mode</label>
                            <select class="form-select" id="enemyDirMode">
                                <option value="none" ${e.visuals?.directionMode === 'none' ? 'selected' : ''}>None (fixe)</option>
                                <option value="flip" ${e.visuals?.directionMode === 'flip' ? 'selected' : ''}>Flip (miroir)</option>
                                <option value="rotate" ${e.visuals?.directionMode === 'rotate' ? 'selected' : ''}>Rotate (orientation)</option>
                                <option value="4_way" ${e.visuals?.directionMode === '4_way' ? 'selected' : ''}>4 Way</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Angle Offset (°)</label>
                            <input type="number" class="form-input" id="enemyAngleOffset" value="${e.visuals?.angleOffset || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label form-check">
                                <input type="checkbox" id="enemyHitFlash" ${e.visuals?.hitFlash ? 'checked' : ''}>
                                Hit Flash (clignotement)
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Animations</h3>
                    <div id="animationsContainer">
                        ${this.renderAllAnimations(e.visuals?.animations, assets)}
                    </div>
                    <div class="add-animation-row">
                        <select class="form-select" id="newAnimSelect" style="flex: 1;">
                            ${this.getAvailableAnimationOptions(e.visuals?.animations)}
                        </select>
                        <button class="btn btn-sm btn-primary" id="addAnimationBtn">+ Ajouter Animation</button>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-danger" id="deleteEnemyBtn">🗑️ Supprimer</button>
                    <button class="btn btn-success" id="saveEnemyBtn">💾 Sauvegarder</button>
                </div>
            </div>
        `;

        this.bindEditorEvents();
    }

    /**
     * Liste des animations standards pour ennemis
     */
    getStandardAnimations() {
        return ['walk', 'idle', 'hurt', 'death', 'attack'];
    }

    /**
     * Retourne les options d'animation disponibles (non utilisées)
     */
    getAvailableAnimationOptions(existingAnims) {
        const existing = Object.keys(existingAnims || {});
        const standard = this.getStandardAnimations();
        const available = standard.filter(a => !existing.includes(a));
        
        let options = available.map(a => `<option value="${a}">${a.charAt(0).toUpperCase() + a.slice(1)}</option>`).join('');
        options += '<option value="_custom">-- Personnalisée --</option>';
        
        return options;
    }

    /**
     * Rendu de toutes les animations existantes
     */
    renderAllAnimations(animations, assets) {
        if (!animations || Object.keys(animations).length === 0) {
            return '<p style="color: var(--text-muted); font-size: 0.9rem;">Aucune animation. Ajoutez-en une ci-dessous.</p>';
        }
        
        const dirMode = this.currentEnemy?.visuals?.directionMode || 'rotate';
        
        return Object.entries(animations)
            .map(([name, data]) => this.renderAnimationEditor(name, data, assets, dirMode))
            .join('');
    }

    /**
     * Rendu d'un éditeur d'animation
     */
    renderAnimationEditor(animName, animData, assets, dirMode = 'rotate') {
        // Détecter si c'est une animation 4_way
        const is4Way = dirMode === '4_way' || (animData && (animData.up || animData.down || animData.left || animData.right));
        
        if (is4Way) {
            return this.render4WayAnimationEditor(animName, animData, assets);
        }
        
        // Mode simple
        const frames = animData?.frames || [];
        const frameRate = animData?.frameRate || 10;
        const loop = animData?.loop !== false;

        return `
            <div class="animation-editor" data-anim="${animName}">
                <div class="animation-header">
                    <h4>${animName.charAt(0).toUpperCase() + animName.slice(1)}</h4>
                    <div class="animation-header-actions">
                        <button class="btn btn-sm btn-secondary add-frame-btn" data-anim="${animName}">+ Frame</button>
                        <button class="btn btn-sm btn-danger remove-anim-btn" data-anim="${animName}" title="Supprimer animation">×</button>
                    </div>
                </div>
                <div class="animation-settings">
                    <div class="form-group" style="width: 120px;">
                        <label class="form-label">Frame Rate</label>
                        <input type="number" class="form-input anim-framerate" data-anim="${animName}" value="${frameRate}">
                    </div>
                    <label class="form-check">
                        <input type="checkbox" class="anim-loop" data-anim="${animName}" ${loop ? 'checked' : ''}>
                        Loop
                    </label>
                </div>
                <div class="frames-list" id="frames-${animName}">
                    ${frames.map((frame, idx) => this.renderFrame(animName, frame, idx, assets)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendu d'un éditeur d'animation 4_way (4 directions)
     */
    render4WayAnimationEditor(animName, animData, assets) {
        const directions = ['up', 'down', 'left', 'right'];
        
        return `
            <div class="animation-editor animation-editor-4way" data-anim="${animName}" data-mode="4way">
                <div class="animation-header">
                    <h4>${animName.charAt(0).toUpperCase() + animName.slice(1)} <span class="badge badge-primary">4-Way</span></h4>
                    <div class="animation-header-actions">
                        <button class="btn btn-sm btn-danger remove-anim-btn" data-anim="${animName}" title="Supprimer animation">×</button>
                    </div>
                </div>
                <div class="directions-grid">
                    ${directions.map(dir => this.render4WayDirection(animName, dir, animData?.[dir], assets)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendu d'une direction pour 4_way
     */
    render4WayDirection(animName, direction, dirData, assets) {
        const frames = dirData?.frames || [];
        const frameRate = dirData?.frameRate || 10;
        const loop = dirData?.loop !== false;
        const dirKey = `${animName}_${direction}`;
        
        const dirLabels = { up: '↑ Haut', down: '↓ Bas', left: '← Gauche', right: '→ Droite' };
        
        return `
            <div class="direction-section" data-anim="${animName}" data-direction="${direction}">
                <div class="direction-header">
                    <span class="direction-label">${dirLabels[direction]}</span>
                    <button class="btn btn-sm btn-secondary add-frame-btn" data-anim="${animName}" data-direction="${direction}">+ Frame</button>
                </div>
                <div class="direction-settings">
                    <div class="form-group" style="width: 80px;">
                        <label class="form-label" style="font-size: 0.7rem;">FPS</label>
                        <input type="number" class="form-input form-input-sm anim-framerate" data-anim="${animName}" data-direction="${direction}" value="${frameRate}">
                    </div>
                    <label class="form-check" style="font-size: 0.75rem;">
                        <input type="checkbox" class="anim-loop" data-anim="${animName}" data-direction="${direction}" ${loop ? 'checked' : ''}>
                        Loop
                    </label>
                </div>
                <div class="frames-list frames-list-compact" id="frames-${dirKey}">
                    ${frames.map((frame, idx) => this.renderFrame(dirKey, frame, idx, assets, direction)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Rendu d'une frame
     */
    renderFrame(animName, framePath, index, assets, direction = null) {
        const dataDir = direction ? `data-direction="${direction}"` : '';
        return `
            <div class="frame-item" data-anim="${animName}" data-index="${index}" ${dataDir}>
                <div class="frame-preview" id="frame-preview-${animName}-${index}">
                    <span>...</span>
                </div>
                <select class="form-select frame-select" data-anim="${animName}" data-index="${index}" ${dataDir}>
                    <option value="">-- Sélectionner --</option>
                    ${assets.map(a => `<option value="${a}" ${a === framePath ? 'selected' : ''}>${a.split('/').pop()}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-danger remove-frame-btn" data-anim="${animName}" data-index="${index}" ${dataDir}>✕</button>
            </div>
        `;
    }

    /**
     * Convertit la structure des animations selon le mode choisi
     */
    convertAnimationsToMode(newMode) {
        if (!this.currentEnemy?.visuals?.animations) return;
        
        const animations = this.currentEnemy.visuals.animations;
        const isNew4Way = newMode === '4_way';
        
        for (const animName in animations) {
            const data = animations[animName];
            const isCurrently4Way = !!(data.up || data.down || data.left || data.right);
            
            if (isNew4Way && !isCurrently4Way) {
                // Convert simple to 4_way
                animations[animName] = {
                    up: JSON.parse(JSON.stringify(data)),
                    down: JSON.parse(JSON.stringify(data)),
                    left: JSON.parse(JSON.stringify(data)),
                    right: JSON.parse(JSON.stringify(data))
                };
            } else if (!isNew4Way && isCurrently4Way) {
                // Convert 4_way to simple
                animations[animName] = data.down || data.up || data.left || data.right;
                if (!animations[animName]) animations[animName] = { frames: [], frameRate: 10, loop: true };
                if (!animations[animName].frames) animations[animName].frames = [];
            }
        }
    }

    /**
     * Bindind des événements de l'éditeur
     */
    bindEditorEvents() {
        // Tous les inputs -> mise à jour
        document.querySelectorAll('#enemyEditor input, #enemyEditor select').forEach(input => {
            if (input.id === 'enemyDirMode') {
                input.addEventListener('change', (e) => {
                    const newMode = e.target.value;
                    if (this.currentEnemy.visuals) {
                        this.currentEnemy.visuals.directionMode = newMode;
                    }
                    this.convertAnimationsToMode(newMode);
                    this.renderEditor();
                    this.loadPreview();
                    this.updateJsonPreview();
                });
            } else if (input.id === 'enemyColorPicker') {
                input.addEventListener('input', (e) => {
                    document.getElementById('enemyColor').value = e.target.value;
                    this.updateEnemyFromForm();
                });
            } else {
                input.addEventListener('change', () => this.updateEnemyFromForm());
                input.addEventListener('input', () => this.updateEnemyFromForm());
            }
        });

        // Ajouter frame
        document.querySelectorAll('.add-frame-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const anim = e.target.dataset.anim;
                const direction = e.target.dataset.direction || null;
                this.addFrame(anim, direction);
            });
        });

        // Supprimer frame
        document.querySelectorAll('.remove-frame-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const anim = e.target.dataset.anim;
                const index = parseInt(e.target.dataset.index);
                this.removeFrame(anim, index);
            });
        });

        // Supprimer animation
        document.querySelectorAll('.remove-anim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const anim = e.target.dataset.anim;
                this.removeAnimation(anim);
            });
        });

        // Ajouter animation
        document.getElementById('addAnimationBtn')?.addEventListener('click', () => this.addNewAnimation());

        // Sauvegarder
        document.getElementById('saveEnemyBtn')?.addEventListener('click', () => this.saveEnemy());

        // Supprimer
        document.getElementById('deleteEnemyBtn')?.addEventListener('click', () => this.deleteEnemy());

        // Charger les previews des frames
        this.loadFramePreviews();
    }

    /**
     * Met à jour l'ennemi depuis le formulaire
     */
    updateEnemyFromForm() {
        if (!this.currentEnemy) return;

        const e = this.currentEnemy;

        // ID modifiable
        const newId = document.getElementById('enemyId')?.value?.trim();
        if (newId && newId !== this.currentEnemyId) {
            this.currentEnemyId = newId;
        }

        // Infos de base
        e.name = document.getElementById('enemyName')?.value || '';
        e.hp = parseInt(document.getElementById('enemyHp')?.value) || 20;
        e.speed = parseInt(document.getElementById('enemySpeed')?.value) || 100;
        e.damage = parseInt(document.getElementById('enemyDamage')?.value) || 5;
        e.xpValue = parseInt(document.getElementById('enemyXpValue')?.value) || 10;
        e.radius = parseInt(document.getElementById('enemyRadius')?.value) || 12;
        e.color = document.getElementById('enemyColor')?.value || '#fff';

        // Visuels
        if (!e.visuals) e.visuals = {};
        e.visuals.type = document.getElementById('enemyVisualType')?.value || 'sprite';
        e.visuals.width = parseInt(document.getElementById('enemyWidth')?.value) || 48;
        
        const height = document.getElementById('enemyHeight')?.value;
        if (height) e.visuals.height = parseInt(height);
        else delete e.visuals.height;

        e.visuals.directionMode = document.getElementById('enemyDirMode')?.value || 'rotate';
        e.visuals.angleOffset = parseInt(document.getElementById('enemyAngleOffset')?.value) || 0;
        e.visuals.hitFlash = document.getElementById('enemyHitFlash')?.checked || false;

        // Animations
        if (!e.visuals.animations) e.visuals.animations = {};
        
        const dirMode = e.visuals.directionMode;
        const is4Way = dirMode === '4_way';
        
        const newAnimations = {};
        
        document.querySelectorAll('.animation-editor').forEach(editor => {
            const animName = editor.dataset.anim;
            const mode = editor.dataset.mode;
            
            if (mode === '4way' || is4Way) {
                const directions = ['up', 'down', 'left', 'right'];
                const animObj = {};
                
                directions.forEach(dir => {
                    const dirSection = editor.querySelector(`.direction-section[data-direction="${dir}"]`);
                    if (dirSection) {
                        const frames = [];
                        dirSection.querySelectorAll('.frame-select').forEach(select => {
                            if (select.value) frames.push(select.value);
                        });
                        
                        const frameRate = parseInt(dirSection.querySelector('.anim-framerate')?.value) || 10;
                        const loop = dirSection.querySelector('.anim-loop')?.checked ?? true;
                        
                        animObj[dir] = { frames, frameRate, loop };
                    }
                });
                
                if (Object.keys(animObj).length > 0) {
                    newAnimations[animName] = animObj;
                }
            } else {
                const frames = [];
                editor.querySelectorAll('.frame-select').forEach(select => {
                    if (select.value) frames.push(select.value);
                });

                const frameRate = parseInt(editor.querySelector('.anim-framerate')?.value) || 10;
                const loop = editor.querySelector('.anim-loop')?.checked ?? true;

                if (frames.length > 0 || e.visuals.animations[animName]) {
                    newAnimations[animName] = { frames, frameRate, loop };
                }
            }
        });
        e.visuals.animations = newAnimations;

        this.updateJsonPreview();
    }

    /**
     * Ajoute une nouvelle animation
     */
    addNewAnimation() {
        const select = document.getElementById('newAnimSelect');
        let animName = select?.value;
        
        if (!animName) return;
        
        if (animName === '_custom') {
            animName = prompt('Nom de l\'animation (ex: charge, explode):');
            if (!animName) return;
            animName = animName.trim().toLowerCase().replace(/\s+/g, '_');
        }
        
        if (this.currentEnemy.visuals?.animations?.[animName]) {
            this.app.showNotification(`L'animation "${animName}" existe déjà`, 'warning');
            return;
        }
        
        if (!this.currentEnemy.visuals) this.currentEnemy.visuals = {};
        if (!this.currentEnemy.visuals.animations) this.currentEnemy.visuals.animations = {};
        
        const dirMode = this.currentEnemy.visuals?.directionMode;
        
        if (dirMode === '4_way') {
            this.currentEnemy.visuals.animations[animName] = {
                up: { frames: [], frameRate: 10, loop: true },
                down: { frames: [], frameRate: 10, loop: true },
                left: { frames: [], frameRate: 10, loop: true },
                right: { frames: [], frameRate: 10, loop: true }
            };
        } else {
            this.currentEnemy.visuals.animations[animName] = {
                frames: [],
                frameRate: 10,
                loop: true
            };
        }
        
        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Supprime une animation
     */
    removeAnimation(animName) {
        if (!confirm(`Supprimer l'animation "${animName}" ?`)) return;
        
        if (this.currentEnemy.visuals?.animations?.[animName]) {
            delete this.currentEnemy.visuals.animations[animName];
        }
        
        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Ajoute une frame à une animation
     */
    addFrame(animName, direction = null) {
        let frameListId = `frames-${animName}`;
        if (direction) {
            frameListId = `frames-${animName}_${direction}`;
        }
        
        const framesList = document.getElementById(frameListId);
        if (!framesList) return;

        const assets = this.app.assetScanner.getAssetPathsForSelect('monster');
        const index = framesList.children.length;

        const frameHtml = this.renderFrame(direction ? `${animName}_${direction}` : animName, '', index, assets, direction);
        framesList.insertAdjacentHTML('beforeend', frameHtml);

        this.bindEditorEvents();
    }

    /**
     * Supprime une frame
     */
    removeFrame(animName, index) {
        const frameItem = document.querySelector(`.frame-item[data-anim="${animName}"][data-index="${index}"]`);
        if (frameItem) {
            frameItem.remove();
            this.updateEnemyFromForm();
        }
    }

    /**
     * Charge les previews des frames
     */
    async loadFramePreviews() {
        const selects = document.querySelectorAll('.frame-select');
        for (const select of selects) {
            const anim = select.dataset.anim;
            const index = select.dataset.index;
            const path = select.value;
            
            const previewEl = document.getElementById(`frame-preview-${anim}-${index}`);
            if (!previewEl) continue;

            if (path) {
                const url = await this.app.assetScanner.getAssetURL(path);
                if (url) {
                    previewEl.innerHTML = `<img src="${url}" alt="frame">`;
                }
            }
        }
    }

    /**
     * Met à jour le JSON preview
     */
    updateJsonPreview() {
        const preview = document.getElementById('enemyJsonPreview');
        if (!preview || !this.currentEnemy) return;

        const json = JSON.stringify(this.currentEnemy, null, 2);
        preview.innerHTML = `<pre>${this.syntaxHighlight(json)}</pre>`;
    }

    /**
     * Syntax highlighting pour JSON
     */
    syntaxHighlight(json) {
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    }

    /**
     * Helper pour récupérer les données d'animation selon le mode et la direction
     */
    getAnimationParams(animName) {
        if (!this.currentEnemy?.visuals?.animations) return null;
        
        const visuals = this.currentEnemy.visuals;
        const animations = visuals.animations;
        const dirMode = visuals.directionMode;
        const direction = document.getElementById('previewDirection')?.value || 'down';
        
        let animData = animations[animName];
        if (!animData) return null;
        
        // Mode 4_way : on cherche la sous-direction
        if (dirMode === '4_way' && animData[direction]) {
            animData = animData[direction];
        }
        
        const frames = animData.frames || [];
        const frameRate = animData.frameRate || 10;
        
        // Calcul de la transformation CSS
        let transform = '';
        if (dirMode === 'flip' && direction === 'left') {
            transform = 'scaleX(-1)';
        } else if (dirMode === 'rotate') {
            const angles = { right: 0, down: 90, left: 180, up: 270 };
            const angle = (angles[direction] || 0) + (visuals.angleOffset || 0);
            transform = `rotate(${angle}deg)`;
        }
        
        return { frames, frameRate, transform };
    }

    /**
     * Charge la prévisualisation
     */
    async loadPreview() {
        const canvas = document.getElementById('enemyPreviewCanvas');
        if (!canvas || !this.currentEnemy) return;

        const visuals = this.currentEnemy.visuals;
        
        // Si pas de visuels ou type shape, afficher la couleur
        if (!visuals || visuals.type === 'shape') {
            const color = this.currentEnemy.color || '#fff';
            const radius = this.currentEnemy.radius || 20;
            canvas.innerHTML = `
                <div style="width: ${radius * 2}px; height: ${radius * 2}px; background: ${color}; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);"></div>
            `;
            return;
        }

        // Utiliser getAnimationParams pour récupérer les données avec la bonne direction
        const walkParams = this.getAnimationParams('walk');
        const idleParams = this.getAnimationParams('idle');
        
        const params = (walkParams?.frames?.length > 0) ? walkParams : idleParams;

        if (params?.frames?.length > 0) {
            const url = await this.app.assetScanner.getAssetURL(params.frames[0]);
            if (url) {
                const width = visuals.width || 48;
                const height = visuals.height || width;
                canvas.innerHTML = `<img src="${url}" alt="preview" style="width: ${width}px; height: ${height}px; image-rendering: pixelated; transform: ${params.transform}">`;
                
                // Activer les contrôles d'animation
                document.getElementById('playIdleBtn').disabled = !idleParams || idleParams.frames.length === 0;
                document.getElementById('playWalkBtn').disabled = !walkParams || walkParams.frames.length === 0;
                document.getElementById('stopAnimBtn').disabled = false;
                return;
            }
        }

        // Fallback couleur
        const color = this.currentEnemy.color || '#fff';
        const radius = this.currentEnemy.radius || 20;
        canvas.innerHTML = `
            <div style="width: ${radius * 2}px; height: ${radius * 2}px; background: ${color}; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);"></div>
        `;
    }

    /**
     * Joue une animation
     */
    async playAnimation(animName) {
        this.stopAnimation();

        const params = this.getAnimationParams(animName);
        if (!params || params.frames.length === 0) return;

        const canvas = document.getElementById('enemyPreviewCanvas');
        if (!canvas) return;

        const width = this.currentEnemy.visuals?.width || 48;
        const height = this.currentEnemy.visuals?.height || width;

        // Précharger les URLs
        const urls = [];
        for (const frame of params.frames) {
            const url = await this.app.assetScanner.getAssetURL(frame);
            if (url) urls.push(url);
        }

        if (urls.length === 0) return;

        this.currentFrameIndex = 0;

        this.animationInterval = setInterval(() => {
            canvas.innerHTML = `<img src="${urls[this.currentFrameIndex]}" alt="frame" style="width: ${width}px; height: ${height}px; image-rendering: pixelated; transform: ${params.transform}">`;
            this.currentFrameIndex = (this.currentFrameIndex + 1) % urls.length;
        }, 1000 / params.frameRate);
    }

    /**
     * Arrête l'animation
     */
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        this.currentFrameIndex = 0;
    }

    /**
     * Sauvegarde l'ennemi
     */
    async saveEnemy() {
        if (!this.currentEnemy || !this.currentEnemyId) return;

        try {
            // Mettre à jour les données depuis le formulaire
            this.updateEnemyFromForm();

            // Vérifier si l'ID a changé
            if (this.originalEnemyId !== this.currentEnemyId) {
                // Supprimer l'ancien ID
                delete this.app.gameData.enemies[this.originalEnemyId];
            }

            // Ajouter/mettre à jour l'ennemi
            this.app.gameData.enemies[this.currentEnemyId] = this.currentEnemy;

            // Sauvegarder dans le fichier
            await this.app.fileManager.writeJSON('enemies.json', { enemies: this.app.gameData.enemies });

            // Mettre à jour l'ID original
            this.originalEnemyId = this.currentEnemyId;

            // Rafraîchir la liste
            this.loadEnemiesList();

            // Mettre à jour les stats
            this.app.updateStats();

            this.app.showNotification('Ennemi sauvegardé avec succès!', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.app.showNotification('Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }

    /**
     * Supprime l'ennemi
     */
    async deleteEnemy() {
        if (!this.currentEnemyId) return;

        if (!confirm(`Supprimer l'ennemi "${this.currentEnemy.name || this.currentEnemyId}" ?\nCette action est irréversible.`)) {
            return;
        }

        try {
            // Supprimer des données
            delete this.app.gameData.enemies[this.originalEnemyId];

            // Sauvegarder
            await this.app.fileManager.writeJSON('enemies.json', { enemies: this.app.gameData.enemies });

            // Reset l'éditeur
            this.currentEnemyId = null;
            this.originalEnemyId = null;
            this.currentEnemy = null;

            // Rafraîchir
            this.loadEnemiesList();
            this.app.updateStats();

            // Afficher l'état vide
            const editor = document.getElementById('enemyEditor');
            editor.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👾</div>
                    <h3 class="empty-state-title">Sélectionnez un ennemi</h3>
                    <p class="empty-state-desc">Choisissez un ennemi dans la liste ou créez-en un nouveau</p>
                </div>
            `;

            this.app.showNotification('Ennemi supprimé', 'success');
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.app.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
        }
    }

    /**
     * Ajoute un nouvel ennemi
     */
    addNewEnemy() {
        const newId = `new_enemy_${Date.now()}`;
        
        const newEnemy = {
            name: 'Nouvel Ennemi',
            hp: 20,
            speed: 100,
            damage: 5,
            xpValue: 10,
            radius: 12,
            color: '#ff5555',
            visuals: {
                type: 'sprite',
                width: 48,
                height: 48,
                directionMode: 'rotate',
                hitFlash: true,
                animations: {}
            }
        };

        // Ajouter aux données (temporaire, pas encore sauvegardé)
        this.app.gameData.enemies[newId] = newEnemy;
        
        // Sélectionner le nouvel ennemi
        this.loadEnemiesList();
        this.selectEnemy(newId);
        
        this.app.showNotification('Nouvel ennemi créé. N\'oubliez pas de le sauvegarder!', 'info');
    }

    /**
     * Bindind des événements globaux du module
     */
    bindEvents() {
        // Bouton retour
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) this.app.navigateTo(section);
            });
        });

        // Ajouter ennemi
        document.getElementById('addEnemyBtn')?.addEventListener('click', () => this.addNewEnemy());

        // Recherche
        document.getElementById('enemySearch')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.loadEnemiesList();
        });

        // Toggle JSON
        document.getElementById('toggleJsonBtn')?.addEventListener('click', (e) => {
            const content = document.getElementById('enemyJsonPreview');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                e.target.textContent = 'Masquer';
            } else {
                content.style.display = 'none';
                e.target.textContent = 'Afficher';
            }
        });

        // Boutons animation
        document.getElementById('playIdleBtn')?.addEventListener('click', () => this.playAnimation('idle'));
        document.getElementById('playWalkBtn')?.addEventListener('click', () => this.playAnimation('walk'));
        document.getElementById('stopAnimBtn')?.addEventListener('click', () => {
            this.stopAnimation();
            this.loadPreview();
        });

        // Changement de direction - recharger la preview
        document.getElementById('previewDirection')?.addEventListener('change', () => {
            this.stopAnimation();
            this.loadPreview();
        });
    }
}

// Export global
window.EnemiesModule = EnemiesModule;
