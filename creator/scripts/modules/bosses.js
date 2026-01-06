/**
 * BossesModule - Éditeur de Boss
 * Basé sur la documentation json_schemas.md et reference_json.md
 * 
 * Champs boss (hérite des ennemis):
 * - name: Nom du boss
 * - hp: Points de vie
 * - speed: Vitesse de déplacement
 * - damage: Dégâts au contact
 * - fireRate: Temps entre chaque salve (en ms)
 * - attackPattern: Pattern de tir (spiral, circle, spray, wall, etc.)
 * - movePattern: Type de mouvement (constant, fixed, rush)
 * - radius: Rayon de la hitbox
 * - color: Couleur de secours
 * - visuals: Bloc visuel du boss
 * - projectileVisuals: Bloc visuel des projectiles
 */
class BossesModule {
    constructor(app) {
        this.app = app;
        this.currentBossId = null;
        this.originalBossId = null;
        this.currentBoss = null;
        this.animationInterval = null;
        this.currentFrameIndex = 0;
        
        // Patterns disponibles selon la documentation
        this.attackPatterns = [
            'circle', 'spiral', 'double_spiral', 'spray', 'wave_spray', 
            'cross', 'vortex', 'flower', 'barrage', 'star', 
            'oscillator', 'wall', 'web'
        ];
        
        this.movePatterns = [
            { value: 'constant', label: 'Constant - Suit le joueur' },
            { value: 'fixed', label: 'Fixed - Reste à une position fixe' },
            { value: 'rush', label: 'Rush - Charge vers le joueur' }
        ];
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
        const section = document.getElementById('bossesSection');
        if (!section) return;

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">👹 Éditeur de Boss</h2>
            </div>

            <div class="editor-layout">
                <!-- Liste des boss -->
                <div class="editor-sidebar panel">
                    <div class="panel-header">
                        <span class="panel-title">Boss</span>
                        <button class="btn btn-sm btn-primary" id="addBossBtn">+ Nouveau</button>
                    </div>
                    <div class="panel-body">
                        <div class="items-list" id="bossesList">
                            <!-- Rempli par JS -->
                        </div>
                    </div>
                </div>

                <!-- Éditeur principal -->
                <div class="editor-main">
                    <div class="editor-content" id="bossEditor">
                        <div class="empty-state">
                            <div class="empty-state-icon">👹</div>
                            <h3 class="empty-state-title">Sélectionnez un boss</h3>
                            <p class="empty-state-desc">Choisissez un boss dans la liste ou créez-en un nouveau</p>
                        </div>
                    </div>
                </div>

                <!-- Preview & JSON -->
                <div class="editor-preview">
                    <!-- Prévisualisation Boss -->
                    <div class="panel">
                        <div class="panel-header">
                            <span class="panel-title">Prévisualisation Boss</span>
                        </div>
                        <div class="panel-body">
                            <div class="preview-container">
                                <div class="preview-canvas" id="bossPreviewCanvas">
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

                    <!-- Prévisualisation Projectile -->
                    <div class="panel" style="margin-top: var(--space-md);">
                        <div class="panel-header">
                            <span class="panel-title">Projectile</span>
                        </div>
                        <div class="panel-body">
                            <div class="preview-container-sm">
                                <div class="preview-canvas-sm" id="projectilePreviewCanvas">
                                    <span style="color: var(--text-muted); font-size: 0.8rem;">Aucun</span>
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
                        <div class="panel-body json-preview-content" id="bossJsonPreview">
                            <pre>Sélectionnez un boss...</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadBossesList();
    }

    /**
     * Charge la liste des boss
     */
    async loadBossesList() {
        const list = document.getElementById('bossesList');
        if (!list || !this.app.gameData) return;

        const bosses = this.app.gameData.bosses;
        list.innerHTML = '';

        for (const [id, boss] of Object.entries(bosses)) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.bossId = id;

            // Récupérer une image de prévisualisation
            const spriteUrl = await this.getEntityThumbnail(boss);
            
            let iconHtml;
            if (spriteUrl) {
                iconHtml = `<img src="${spriteUrl}" alt="${boss.name}" class="list-item-sprite">`;
            } else if (boss.color) {
                iconHtml = `<div style="width: 36px; height: 36px; border-radius: 50%; background: ${boss.color}; border: 3px solid rgba(255,255,255,0.3);"></div>`;
            } else {
                iconHtml = '<span style="font-size: 1.5rem;">👹</span>';
            }

            item.innerHTML = `
                <div class="list-item-icon">
                    ${iconHtml}
                </div>
                <div class="list-item-info">
                    <div class="list-item-name">${boss.name || id}</div>
                    <div class="list-item-meta">HP: ${boss.hp} | ${boss.attackPattern}</div>
                </div>
            `;

            item.addEventListener('click', () => this.selectBoss(id));
            list.appendChild(item);
        }

        if (Object.keys(bosses).length === 0) {
            list.innerHTML = '<div style="padding: var(--space-md); color: var(--text-muted); text-align: center;">Aucun boss</div>';
        }
    }

    /**
     * Récupère l'URL du sprite de prévisualisation
     */
    async getEntityThumbnail(entity) {
        const visuals = entity.visuals;
        if (!visuals || !visuals.animations) return null;

        const animations = visuals.animations;
        const animOrder = ['idle', 'walk', ...Object.keys(animations)];
        
        for (const animName of animOrder) {
            const anim = animations[animName];
            if (!anim) continue;
            
            if (anim.down?.frames?.length > 0) {
                return await this.app.assetScanner.getAssetURL(anim.down.frames[0]);
            } else if (anim.frames?.length > 0) {
                return await this.app.assetScanner.getAssetURL(anim.frames[0]);
            }
        }
        
        return null;
    }

    /**
     * Sélectionne un boss pour l'éditer
     */
    async selectBoss(bossId) {
        this.currentBossId = bossId;
        this.originalBossId = bossId;
        this.currentBoss = JSON.parse(JSON.stringify(this.app.gameData.bosses[bossId]));

        // Mettre à jour la sélection visuelle
        document.querySelectorAll('#bossesList .list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.bossId === bossId);
        });

        // Afficher l'éditeur
        this.renderEditor();
        this.updateJsonPreview();
        await this.loadPreview();
        await this.loadProjectilePreview();
    }

    /**
     * Rendu de l'éditeur de boss
     */
    renderEditor() {
        const editor = document.getElementById('bossEditor');
        if (!editor || !this.currentBoss) return;

        const b = this.currentBoss;
        const assets = this.app.assetScanner.getAssetPathsForSelect('boss');
        const projectileAssets = this.app.assetScanner.getAssetPathsForSelect('projectile');

        editor.innerHTML = `
            <div class="editor-form">
                <div class="form-section">
                    <h3 class="form-section-title">Informations de base</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ID (clé unique)</label>
                            <input type="text" class="form-input" id="bossId" value="${this.currentBossId}">
                            <small style="color: var(--text-muted); font-size: 0.75rem;">Utilisé comme référence dans phases.json</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nom affiché</label>
                            <input type="text" class="form-input" id="bossName" value="${b.name || ''}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Statistiques de Combat</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Points de vie (HP)</label>
                            <input type="number" class="form-input" id="bossHp" value="${b.hp || 2000}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Vitesse (speed)</label>
                            <input type="number" class="form-input" id="bossSpeed" value="${b.speed || 50}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dégâts (damage)</label>
                            <input type="number" class="form-input" id="bossDamage" value="${b.damage || 20}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Rayon hitbox (radius)</label>
                            <input type="number" class="form-input" id="bossRadius" value="${b.radius || 80}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Couleur fallback</label>
                            <div class="color-input-group">
                                <input type="color" class="form-color" id="bossColorPicker" value="${b.color || '#ffffff'}">
                                <input type="text" class="form-input" id="bossColor" value="${b.color || '#fff'}">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Comportement de Combat</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Pattern d'attaque</label>
                            <select class="form-select" id="bossAttackPattern">
                                ${this.attackPatterns.map(p => 
                                    `<option value="${p}" ${b.attackPattern === p ? 'selected' : ''}>${p}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Pattern de mouvement</label>
                            <select class="form-select" id="bossMovePattern">
                                ${this.movePatterns.map(p => 
                                    `<option value="${p.value}" ${b.movePattern === p.value ? 'selected' : ''}>${p.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cadence de tir (ms)</label>
                            <input type="number" class="form-input" id="bossFireRate" value="${b.fireRate || 1500}">
                            <small style="color: var(--text-muted); font-size: 0.75rem;">Temps entre chaque salve</small>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Visuels du Boss</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="bossVisualType">
                                <option value="sprite" ${b.visuals?.type === 'sprite' ? 'selected' : ''}>Sprite (image)</option>
                                <option value="shape" ${b.visuals?.type === 'shape' ? 'selected' : ''}>Shape (forme)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Largeur (px)</label>
                            <input type="number" class="form-input" id="bossWidth" value="${b.visuals?.width || 128}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Hauteur (px)</label>
                            <input type="number" class="form-input" id="bossHeight" value="${b.visuals?.height || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Direction Mode</label>
                            <select class="form-select" id="bossDirMode">
                                <option value="none" ${b.visuals?.directionMode === 'none' ? 'selected' : ''}>None (fixe)</option>
                                <option value="flip" ${b.visuals?.directionMode === 'flip' ? 'selected' : ''}>Flip (miroir)</option>
                                <option value="rotate" ${b.visuals?.directionMode === 'rotate' ? 'selected' : ''}>Rotate</option>
                                <option value="4_way" ${b.visuals?.directionMode === '4_way' ? 'selected' : ''}>4 Way</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Angle Offset (°)</label>
                            <input type="number" class="form-input" id="bossAngleOffset" value="${b.visuals?.angleOffset || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label form-check">
                                <input type="checkbox" id="bossHitFlash" ${b.visuals?.hitFlash ? 'checked' : ''}>
                                Hit Flash
                            </label>
                        </div>
                    </div>
                    
                    <h4 style="margin-top: var(--space-md); margin-bottom: var(--space-sm);">Animations du Boss</h4>
                    <div id="bossAnimationsContainer">
                        ${this.renderAllAnimations(b.visuals?.animations, assets, 'boss')}
                    </div>
                    <div class="add-animation-row">
                        <select class="form-select" id="newBossAnimSelect" style="flex: 1;">
                            ${this.getAvailableAnimationOptions(b.visuals?.animations)}
                        </select>
                        <button class="btn btn-sm btn-primary" id="addBossAnimationBtn">+ Ajouter Animation</button>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Visuels des Projectiles</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="projVisualType">
                                <option value="sprite" ${b.projectileVisuals?.type === 'sprite' ? 'selected' : ''}>Sprite</option>
                                <option value="shape" ${b.projectileVisuals?.type === 'shape' ? 'selected' : ''}>Shape</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Largeur (px)</label>
                            <input type="number" class="form-input" id="projWidth" value="${b.projectileVisuals?.width || 16}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Direction Mode</label>
                            <select class="form-select" id="projDirMode">
                                <option value="none" ${b.projectileVisuals?.directionMode === 'none' ? 'selected' : ''}>None</option>
                                <option value="rotate" ${b.projectileVisuals?.directionMode === 'rotate' ? 'selected' : ''}>Rotate</option>
                            </select>
                        </div>
                    </div>
                    
                    <h4 style="margin-top: var(--space-md); margin-bottom: var(--space-sm);">Animation du Projectile</h4>
                    <div id="projAnimationsContainer">
                        ${this.renderProjectileAnimation(b.projectileVisuals?.animations, projectileAssets)}
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-danger" id="deleteBossBtn">🗑️ Supprimer</button>
                    <button class="btn btn-success" id="saveBossBtn">💾 Sauvegarder</button>
                </div>
            </div>
        `;

        this.bindEditorEvents();
    }

    /**
     * Liste des animations standards
     */
    getStandardAnimations() {
        return ['idle', 'walk', 'attack', 'hurt', 'death'];
    }

    /**
     * Options d'animation disponibles
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
     * Rendu de toutes les animations
     */
    renderAllAnimations(animations, assets, prefix = 'boss') {
        if (!animations || Object.keys(animations).length === 0) {
            return '<p style="color: var(--text-muted); font-size: 0.9rem;">Aucune animation.</p>';
        }
        
        const dirMode = this.currentBoss?.visuals?.directionMode || 'none';
        
        return Object.entries(animations)
            .map(([name, data]) => this.renderAnimationEditor(name, data, assets, dirMode, prefix))
            .join('');
    }

    /**
     * Rendu d'un éditeur d'animation
     */
    renderAnimationEditor(animName, animData, assets, dirMode, prefix) {
        const is4Way = dirMode === '4_way' || (animData && (animData.up || animData.down));
        
        if (is4Way) {
            return this.render4WayAnimationEditor(animName, animData, assets, prefix);
        }
        
        const frames = animData?.frames || [];
        const frameRate = animData?.frameRate || 10;
        const loop = animData?.loop !== false;

        return `
            <div class="animation-editor" data-anim="${animName}" data-prefix="${prefix}">
                <div class="animation-header">
                    <h4>${animName.charAt(0).toUpperCase() + animName.slice(1)}</h4>
                    <div class="animation-header-actions">
                        <button class="btn btn-sm btn-secondary add-frame-btn" data-anim="${animName}" data-prefix="${prefix}">+ Frame</button>
                        <button class="btn btn-sm btn-danger remove-anim-btn" data-anim="${animName}" data-prefix="${prefix}">×</button>
                    </div>
                </div>
                <div class="animation-settings">
                    <div class="form-group" style="width: 100px;">
                        <label class="form-label">FPS</label>
                        <input type="number" class="form-input anim-framerate" data-anim="${animName}" data-prefix="${prefix}" value="${frameRate}">
                    </div>
                    <label class="form-check">
                        <input type="checkbox" class="anim-loop" data-anim="${animName}" data-prefix="${prefix}" ${loop ? 'checked' : ''}>
                        Loop
                    </label>
                </div>
                <div class="frames-list" id="frames-${prefix}-${animName}">
                    ${frames.map((frame, idx) => this.renderFrame(animName, frame, idx, assets, prefix)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Rendu animation 4-way
     */
    render4WayAnimationEditor(animName, animData, assets, prefix) {
        const directions = ['up', 'down', 'left', 'right'];
        
        return `
            <div class="animation-editor animation-editor-4way" data-anim="${animName}" data-prefix="${prefix}" data-mode="4way">
                <div class="animation-header">
                    <h4>${animName.charAt(0).toUpperCase() + animName.slice(1)} <span class="badge badge-primary">4-Way</span></h4>
                    <div class="animation-header-actions">
                        <button class="btn btn-sm btn-danger remove-anim-btn" data-anim="${animName}" data-prefix="${prefix}">×</button>
                    </div>
                </div>
                <div class="directions-grid">
                    ${directions.map(dir => this.render4WayDirection(animName, dir, animData?.[dir], assets, prefix)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Rendu d'une direction 4-way
     */
    render4WayDirection(animName, direction, dirData, assets, prefix) {
        const frames = dirData?.frames || [];
        const frameRate = dirData?.frameRate || 10;
        const loop = dirData?.loop !== false;
        const dirKey = `${animName}_${direction}`;
        const dirLabels = { up: '↑ Haut', down: '↓ Bas', left: '← Gauche', right: '→ Droite' };
        
        return `
            <div class="direction-section" data-anim="${animName}" data-direction="${direction}" data-prefix="${prefix}">
                <div class="direction-header">
                    <span class="direction-label">${dirLabels[direction]}</span>
                    <button class="btn btn-sm btn-secondary add-frame-btn" data-anim="${animName}" data-direction="${direction}" data-prefix="${prefix}">+ Frame</button>
                </div>
                <div class="direction-settings">
                    <div class="form-group" style="width: 70px;">
                        <label class="form-label" style="font-size: 0.7rem;">FPS</label>
                        <input type="number" class="form-input form-input-sm anim-framerate" data-anim="${animName}" data-direction="${direction}" data-prefix="${prefix}" value="${frameRate}">
                    </div>
                    <label class="form-check" style="font-size: 0.75rem;">
                        <input type="checkbox" class="anim-loop" data-anim="${animName}" data-direction="${direction}" data-prefix="${prefix}" ${loop ? 'checked' : ''}>
                        Loop
                    </label>
                </div>
                <div class="frames-list frames-list-compact" id="frames-${prefix}-${dirKey}">
                    ${frames.map((frame, idx) => this.renderFrame(dirKey, frame, idx, assets, prefix, direction)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Rendu d'une frame
     */
    renderFrame(animName, framePath, index, assets, prefix, direction = null) {
        const dataDir = direction ? `data-direction="${direction}"` : '';
        return `
            <div class="frame-item" data-anim="${animName}" data-index="${index}" data-prefix="${prefix}" ${dataDir}>
                <div class="frame-preview" id="frame-preview-${prefix}-${animName}-${index}">
                    <span>...</span>
                </div>
                <select class="form-select frame-select" data-anim="${animName}" data-index="${index}" data-prefix="${prefix}" ${dataDir}>
                    <option value="">-- Select --</option>
                    ${assets.map(a => `<option value="${a}" ${a === framePath ? 'selected' : ''}>${a.split('/').pop()}</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-danger remove-frame-btn" data-anim="${animName}" data-index="${index}" data-prefix="${prefix}" ${dataDir}>✕</button>
            </div>
        `;
    }

    /**
     * Rendu de l'animation projectile
     */
    renderProjectileAnimation(animations, assets) {
        if (!animations?.idle?.frames?.length) {
            return `
                <div class="animation-editor" data-anim="idle" data-prefix="proj">
                    <div class="animation-header">
                        <h4>Idle (par défaut)</h4>
                    </div>
                    <div class="animation-settings">
                        <div class="form-group" style="width: 100px;">
                            <label class="form-label">FPS</label>
                            <input type="number" class="form-input anim-framerate" data-anim="idle" data-prefix="proj" value="10">
                        </div>
                        <label class="form-check">
                            <input type="checkbox" class="anim-loop" data-anim="idle" data-prefix="proj" checked>
                            Loop
                        </label>
                    </div>
                    <div class="frames-list" id="frames-proj-idle"></div>
                    <button class="btn btn-sm btn-secondary add-frame-btn" data-anim="idle" data-prefix="proj" style="margin-top: var(--space-sm);">+ Ajouter Frame</button>
                </div>
            `;
        }

        const anim = animations.idle;
        const frames = anim.frames || [];
        const frameRate = anim.frameRate || 10;
        const loop = anim.loop !== false;

        return `
            <div class="animation-editor" data-anim="idle" data-prefix="proj">
                <div class="animation-header">
                    <h4>Idle</h4>
                </div>
                <div class="animation-settings">
                    <div class="form-group" style="width: 100px;">
                        <label class="form-label">FPS</label>
                        <input type="number" class="form-input anim-framerate" data-anim="idle" data-prefix="proj" value="${frameRate}">
                    </div>
                    <label class="form-check">
                        <input type="checkbox" class="anim-loop" data-anim="idle" data-prefix="proj" ${loop ? 'checked' : ''}>
                        Loop
                    </label>
                </div>
                <div class="frames-list" id="frames-proj-idle">
                    ${frames.map((frame, idx) => this.renderFrame('idle', frame, idx, assets, 'proj')).join('')}
                </div>
                <button class="btn btn-sm btn-secondary add-frame-btn" data-anim="idle" data-prefix="proj" style="margin-top: var(--space-sm);">+ Ajouter Frame</button>
            </div>
        `;
    }

    /**
     * Binding événements éditeur
     */
    bindEditorEvents() {
        // Inputs -> mise à jour
        document.querySelectorAll('#bossEditor input, #bossEditor select').forEach(input => {
            if (input.id === 'bossDirMode') {
                input.addEventListener('change', () => {
                    this.updateBossFromForm();
                    this.renderEditor();
                    this.loadPreview();
                });
            } else if (input.id === 'bossColorPicker') {
                input.addEventListener('input', (e) => {
                    document.getElementById('bossColor').value = e.target.value;
                    this.updateBossFromForm();
                });
            } else {
                input.addEventListener('change', () => this.updateBossFromForm());
                input.addEventListener('input', () => this.updateBossFromForm());
            }
        });

        // Ajouter frame
        document.querySelectorAll('.add-frame-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const anim = e.target.dataset.anim;
                const prefix = e.target.dataset.prefix;
                const direction = e.target.dataset.direction || null;
                this.addFrame(anim, prefix, direction);
            });
        });

        // Supprimer frame
        document.querySelectorAll('.remove-frame-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.remove-frame-btn');
                const anim = target.dataset.anim;
                const index = parseInt(target.dataset.index);
                const prefix = target.dataset.prefix;
                this.removeFrame(anim, index, prefix);
            });
        });

        // Supprimer animation
        document.querySelectorAll('.remove-anim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const anim = e.target.dataset.anim;
                const prefix = e.target.dataset.prefix;
                this.removeAnimation(anim, prefix);
            });
        });

        // Ajouter animation boss
        document.getElementById('addBossAnimationBtn')?.addEventListener('click', () => this.addNewAnimation('boss'));

        // Sauvegarder
        document.getElementById('saveBossBtn')?.addEventListener('click', () => this.saveBoss());

        // Supprimer
        document.getElementById('deleteBossBtn')?.addEventListener('click', () => this.deleteBoss());

        // Charger les previews
        this.loadFramePreviews();
    }

    /**
     * Met à jour le boss depuis le formulaire
     */
    updateBossFromForm() {
        if (!this.currentBoss) return;

        const b = this.currentBoss;

        // ID
        const newId = document.getElementById('bossId')?.value?.trim();
        if (newId && newId !== this.currentBossId) {
            this.currentBossId = newId;
        }

        // Base
        b.name = document.getElementById('bossName')?.value || '';
        b.hp = parseInt(document.getElementById('bossHp')?.value) || 2000;
        b.speed = parseInt(document.getElementById('bossSpeed')?.value) || 50;
        b.damage = parseInt(document.getElementById('bossDamage')?.value) || 20;
        b.radius = parseInt(document.getElementById('bossRadius')?.value) || 80;
        b.color = document.getElementById('bossColor')?.value || '#fff';

        // Combat
        b.attackPattern = document.getElementById('bossAttackPattern')?.value || 'spiral';
        b.movePattern = document.getElementById('bossMovePattern')?.value || 'constant';
        b.fireRate = parseInt(document.getElementById('bossFireRate')?.value) || 1500;

        // Visuels boss
        if (!b.visuals) b.visuals = {};
        b.visuals.type = document.getElementById('bossVisualType')?.value || 'sprite';
        b.visuals.width = parseInt(document.getElementById('bossWidth')?.value) || 128;
        const bHeight = document.getElementById('bossHeight')?.value;
        if (bHeight) b.visuals.height = parseInt(bHeight);
        else delete b.visuals.height;
        b.visuals.directionMode = document.getElementById('bossDirMode')?.value || 'none';
        b.visuals.angleOffset = parseInt(document.getElementById('bossAngleOffset')?.value) || 0;
        b.visuals.hitFlash = document.getElementById('bossHitFlash')?.checked || false;

        // Animations boss
        b.visuals.animations = this.collectAnimations('boss');

        // Projectile visuals
        if (!b.projectileVisuals) b.projectileVisuals = {};
        b.projectileVisuals.type = document.getElementById('projVisualType')?.value || 'sprite';
        b.projectileVisuals.width = parseInt(document.getElementById('projWidth')?.value) || 16;
        b.projectileVisuals.directionMode = document.getElementById('projDirMode')?.value || 'rotate';
        b.projectileVisuals.animations = this.collectAnimations('proj');

        this.updateJsonPreview();
    }

    /**
     * Collecte les animations depuis le DOM
     */
    collectAnimations(prefix) {
        const animations = {};
        const dirMode = prefix === 'boss' ? this.currentBoss?.visuals?.directionMode : 'none';
        const is4Way = dirMode === '4_way';

        document.querySelectorAll(`.animation-editor[data-prefix="${prefix}"]`).forEach(editor => {
            const animName = editor.dataset.anim;
            const mode = editor.dataset.mode;

            if (mode === '4way' || is4Way) {
                const directions = ['up', 'down', 'left', 'right'];
                const animObj = {};

                directions.forEach(dir => {
                    const dirSection = editor.querySelector(`.direction-section[data-direction="${dir}"]`);
                    if (dirSection) {
                        const frames = [];
                        dirSection.querySelectorAll('.frame-select').forEach(sel => {
                            if (sel.value) frames.push(sel.value);
                        });
                        const frameRate = parseInt(dirSection.querySelector('.anim-framerate')?.value) || 10;
                        const loop = dirSection.querySelector('.anim-loop')?.checked ?? true;
                        animObj[dir] = { frames, frameRate, loop };
                    }
                });

                if (Object.keys(animObj).length > 0) {
                    animations[animName] = animObj;
                }
            } else {
                const frames = [];
                editor.querySelectorAll('.frame-select').forEach(sel => {
                    if (sel.value) frames.push(sel.value);
                });
                const frameRate = parseInt(editor.querySelector('.anim-framerate')?.value) || 10;
                const loop = editor.querySelector('.anim-loop')?.checked ?? true;
                animations[animName] = { frames, frameRate, loop };
            }
        });

        return animations;
    }

    /**
     * Ajoute une animation
     */
    addNewAnimation(prefix) {
        const selectId = prefix === 'boss' ? 'newBossAnimSelect' : 'newProjAnimSelect';
        const select = document.getElementById(selectId);
        let animName = select?.value;

        if (!animName) return;

        if (animName === '_custom') {
            animName = prompt('Nom de l\'animation:');
            if (!animName) return;
            animName = animName.trim().toLowerCase().replace(/\s+/g, '_');
        }

        const targetVisuals = prefix === 'boss' ? this.currentBoss.visuals : this.currentBoss.projectileVisuals;
        if (!targetVisuals) return;
        if (!targetVisuals.animations) targetVisuals.animations = {};

        if (targetVisuals.animations[animName]) {
            this.app.showNotification(`Animation "${animName}" existe déjà`, 'warning');
            return;
        }

        const dirMode = prefix === 'boss' ? targetVisuals.directionMode : 'none';
        if (dirMode === '4_way') {
            targetVisuals.animations[animName] = {
                up: { frames: [], frameRate: 10, loop: true },
                down: { frames: [], frameRate: 10, loop: true },
                left: { frames: [], frameRate: 10, loop: true },
                right: { frames: [], frameRate: 10, loop: true }
            };
        } else {
            targetVisuals.animations[animName] = { frames: [], frameRate: 10, loop: true };
        }

        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Supprime une animation
     */
    removeAnimation(animName, prefix) {
        if (!confirm(`Supprimer l'animation "${animName}" ?`)) return;

        const targetVisuals = prefix === 'boss' ? this.currentBoss.visuals : this.currentBoss.projectileVisuals;
        if (targetVisuals?.animations?.[animName]) {
            delete targetVisuals.animations[animName];
        }

        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Ajoute une frame
     */
    addFrame(animName, prefix, direction = null) {
        let listId = `frames-${prefix}-${animName}`;
        if (direction) listId = `frames-${prefix}-${animName}_${direction}`;

        const list = document.getElementById(listId);
        if (!list) return;

        const assets = prefix === 'proj' 
            ? this.app.assetScanner.getAssetPathsForSelect('projectile')
            : this.app.assetScanner.getAssetPathsForSelect('boss');
        const index = list.children.length;
        const key = direction ? `${animName}_${direction}` : animName;

        const html = this.renderFrame(key, '', index, assets, prefix, direction);
        list.insertAdjacentHTML('beforeend', html);

        this.bindEditorEvents();
    }

    /**
     * Supprime une frame
     */
    removeFrame(animName, index, prefix) {
        const frame = document.querySelector(`.frame-item[data-anim="${animName}"][data-index="${index}"][data-prefix="${prefix}"]`);
        if (frame) {
            frame.remove();
            this.updateBossFromForm();
        }
    }

    /**
     * Charge les previews des frames
     */
    async loadFramePreviews() {
        const selects = document.querySelectorAll('#bossEditor .frame-select');
        for (const select of selects) {
            const anim = select.dataset.anim;
            const index = select.dataset.index;
            const prefix = select.dataset.prefix;
            const path = select.value;

            const previewEl = document.getElementById(`frame-preview-${prefix}-${anim}-${index}`);
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
     * Helper pour les animations
     */
    getAnimationParams(animName) {
        if (!this.currentBoss?.visuals?.animations) return null;

        const visuals = this.currentBoss.visuals;
        const animations = visuals.animations;
        const dirMode = visuals.directionMode;
        const direction = document.getElementById('previewDirection')?.value || 'down';

        let animData = animations[animName];
        if (!animData) return null;

        if (dirMode === '4_way' && animData[direction]) {
            animData = animData[direction];
        }

        const frames = animData.frames || [];
        const frameRate = animData.frameRate || 10;

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
     * Charge la prévisualisation du boss
     */
    async loadPreview() {
        const canvas = document.getElementById('bossPreviewCanvas');
        if (!canvas || !this.currentBoss) return;

        const visuals = this.currentBoss.visuals;

        if (!visuals || visuals.type === 'shape') {
            const color = this.currentBoss.color || '#fff';
            const radius = this.currentBoss.radius || 80;
            canvas.innerHTML = `<div style="width: ${Math.min(radius, 80)}px; height: ${Math.min(radius, 80)}px; background: ${color}; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3);"></div>`;
            return;
        }

        const walkParams = this.getAnimationParams('walk');
        const idleParams = this.getAnimationParams('idle');
        const params = (walkParams?.frames?.length > 0) ? walkParams : idleParams;

        if (params?.frames?.length > 0) {
            const url = await this.app.assetScanner.getAssetURL(params.frames[0]);
            if (url) {
                const width = Math.min(visuals.width || 128, 150);
                const height = Math.min(visuals.height || width, 150);
                canvas.innerHTML = `<img src="${url}" alt="preview" style="width: ${width}px; height: ${height}px; image-rendering: pixelated; transform: ${params.transform}">`;

                document.getElementById('playIdleBtn').disabled = !idleParams || idleParams.frames.length === 0;
                document.getElementById('playWalkBtn').disabled = !walkParams || walkParams.frames.length === 0;
                document.getElementById('stopAnimBtn').disabled = false;
                return;
            }
        }

        const color = this.currentBoss.color || '#fff';
        canvas.innerHTML = `<div style="width: 80px; height: 80px; background: ${color}; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3);"></div>`;
    }

    /**
     * Charge la prévisualisation du projectile
     */
    async loadProjectilePreview() {
        const canvas = document.getElementById('projectilePreviewCanvas');
        if (!canvas || !this.currentBoss) return;

        const projVisuals = this.currentBoss.projectileVisuals;
        if (!projVisuals?.animations?.idle?.frames?.length) {
            canvas.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">Aucun</span>';
            return;
        }

        const url = await this.app.assetScanner.getAssetURL(projVisuals.animations.idle.frames[0]);
        if (url) {
            const width = projVisuals.width || 16;
            canvas.innerHTML = `<img src="${url}" alt="projectile" style="width: ${width * 2}px; height: ${width * 2}px; image-rendering: pixelated;">`;
        }
    }

    /**
     * Joue une animation
     */
    async playAnimation(animName) {
        this.stopAnimation();

        const params = this.getAnimationParams(animName);
        if (!params || params.frames.length === 0) return;

        const canvas = document.getElementById('bossPreviewCanvas');
        if (!canvas) return;

        const width = Math.min(this.currentBoss.visuals?.width || 128, 150);
        const height = Math.min(this.currentBoss.visuals?.height || width, 150);

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
    }

    /**
     * Met à jour le JSON preview
     */
    updateJsonPreview() {
        const preview = document.getElementById('bossJsonPreview');
        if (!preview || !this.currentBoss) return;

        const json = JSON.stringify(this.currentBoss, null, 2);
        preview.innerHTML = `<pre>${this.syntaxHighlight(json)}</pre>`;
    }

    /**
     * Syntax highlighting
     */
    syntaxHighlight(json) {
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        });
    }

    /**
     * Sauvegarde le boss
     */
    async saveBoss() {
        if (!this.currentBoss || !this.currentBossId) return;

        try {
            this.updateBossFromForm();

            if (this.originalBossId !== this.currentBossId) {
                delete this.app.gameData.bosses[this.originalBossId];
            }

            this.app.gameData.bosses[this.currentBossId] = this.currentBoss;

            await this.app.fileManager.writeJSON('bosses.json', { bosses: this.app.gameData.bosses });

            this.originalBossId = this.currentBossId;
            this.loadBossesList();
            this.app.updateStats();

            this.app.showNotification('Boss sauvegardé avec succès!', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.app.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    /**
     * Supprime le boss
     */
    async deleteBoss() {
        if (!this.currentBossId) return;

        if (!confirm(`Supprimer le boss "${this.currentBoss.name || this.currentBossId}" ?`)) return;

        try {
            delete this.app.gameData.bosses[this.originalBossId];
            await this.app.fileManager.writeJSON('bosses.json', { bosses: this.app.gameData.bosses });

            this.currentBossId = null;
            this.originalBossId = null;
            this.currentBoss = null;

            this.loadBossesList();
            this.app.updateStats();

            const editor = document.getElementById('bossEditor');
            editor.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👹</div>
                    <h3 class="empty-state-title">Sélectionnez un boss</h3>
                    <p class="empty-state-desc">Choisissez un boss ou créez-en un nouveau</p>
                </div>
            `;

            this.app.showNotification('Boss supprimé', 'success');
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.app.showNotification('Erreur: ' + error.message, 'error');
        }
    }

    /**
     * Ajoute un nouveau boss
     */
    addNewBoss() {
        const newId = `new_boss_${Date.now()}`;

        const newBoss = {
            name: 'Nouveau Boss',
            hp: 2000,
            speed: 50,
            damage: 20,
            fireRate: 1500,
            attackPattern: 'spiral',
            movePattern: 'constant',
            radius: 80,
            color: '#ff3333',
            visuals: {
                type: 'sprite',
                width: 128,
                directionMode: 'none',
                hitFlash: true,
                animations: {}
            },
            projectileVisuals: {
                type: 'sprite',
                width: 16,
                directionMode: 'rotate',
                animations: {
                    idle: { frames: [], frameRate: 10, loop: true }
                }
            }
        };

        this.app.gameData.bosses[newId] = newBoss;
        this.loadBossesList();
        this.selectBoss(newId);

        this.app.showNotification('Nouveau boss créé. N\'oubliez pas de sauvegarder!', 'info');
    }

    /**
     * Binding événements globaux
     */
    bindEvents() {
        document.querySelectorAll('#bossesSection .back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.stopAnimation();
                this.app.navigateTo('hub');
            });
        });

        document.getElementById('addBossBtn')?.addEventListener('click', () => this.addNewBoss());

        document.getElementById('playIdleBtn')?.addEventListener('click', () => this.playAnimation('idle'));
        document.getElementById('playWalkBtn')?.addEventListener('click', () => this.playAnimation('walk'));
        document.getElementById('stopAnimBtn')?.addEventListener('click', () => {
            this.stopAnimation();
            this.loadPreview();
        });

        document.getElementById('previewDirection')?.addEventListener('change', () => {
            this.stopAnimation();
            this.loadPreview();
        });

        document.getElementById('toggleJsonBtn')?.addEventListener('click', (e) => {
            const content = document.getElementById('bossJsonPreview');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                e.target.textContent = 'Masquer';
            } else {
                content.style.display = 'none';
                e.target.textContent = 'Afficher';
            }
        });
    }
}

// Export global
window.BossesModule = BossesModule;
