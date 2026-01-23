/**
 * PlayersModule - Éditeur de joueurs
 */
class PlayersModule {
    constructor(app) {
        this.app = app;
        this.currentPlayerId = null;
        this.originalPlayerId = null; // Pour détecter le changement d'ID
        this.currentPlayer = null;
        this.animationInterval = null;
        this.currentFrameIndex = 0;
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
        const section = document.getElementById('playersSection');
        if (!section) return;

        section.innerHTML = `
            <div class="section-header">
                <button class="btn btn-ghost back-btn" data-section="hub">
                    <span>←</span> Retour au Hub
                </button>
                <h2 class="section-title">🧬 Éditeur de Joueurs</h2>
            </div>

            <div class="editor-layout">
                <!-- Liste des joueurs -->
                <div class="editor-sidebar panel">
                    <div class="panel-header">
                        <span class="panel-title">Joueurs</span>
                        <button class="btn btn-sm btn-primary" id="addPlayerBtn">+ Nouveau</button>
                    </div>
                    <div class="panel-body">
                        <div class="items-list" id="playersList">
                            <!-- Rempli par JS -->
                        </div>
                    </div>
                </div>

                <!-- Éditeur principal -->
                <div class="editor-main">
                    <div class="editor-content" id="playerEditor">
                        <div class="empty-state">
                            <div class="empty-state-icon">🧬</div>
                            <h3 class="empty-state-title">Sélectionnez un joueur</h3>
                            <p class="empty-state-desc">Choisissez un joueur dans la liste ou créez-en un nouveau</p>
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
                                <div class="preview-canvas" id="playerPreviewCanvas">
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
                        <div class="panel-body json-preview-content" id="playerJsonPreview">
                            <pre>Sélectionnez un joueur...</pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadPlayersList();
    }

    /**
     * Charge la liste des joueurs
     */
    async loadPlayersList() {
        const list = document.getElementById('playersList');
        if (!list || !this.app.gameData) return;

        const players = this.app.gameData.players;
        list.innerHTML = '';

        for (const [id, player] of Object.entries(players)) {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.playerId = id;

            // Récupérer la première frame de idle ou walk pour la prévisualisation
            const spriteUrl = await this.getEntityThumbnail(player);

            const iconHtml = spriteUrl
                ? `<img src="${spriteUrl}" alt="${player.name}" class="list-item-sprite">`
                : '<span style="font-size: 1.5rem;">🧬</span>';

            item.innerHTML = `
                <div class="list-item-icon">
                    ${iconHtml}
                </div>
                <div class="list-item-info">
                    <div class="list-item-name">${player.name || id}</div>
                    <div class="list-item-meta">HP: ${player.hp} | Speed: ${player.speed}</div>
                </div>
            `;

            item.addEventListener('click', () => this.selectPlayer(id));
            list.appendChild(item);
        }
    }

    /**
     * Récupère l'URL du sprite de prévisualisation pour une entité
     */
    async getEntityThumbnail(entity) {
        const visuals = entity.visuals;
        if (!visuals || !visuals.animations) return null;

        const animations = visuals.animations;
        // Priorité : idle, puis walk, puis la première animation disponible
        const animOrder = ['idle', 'walk', ...Object.keys(animations)];

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
     * Sélectionne un joueur pour l'éditer
     */
    async selectPlayer(playerId) {
        this.currentPlayerId = playerId;
        this.originalPlayerId = playerId; // Sauvegarder l'ID original
        this.currentPlayer = JSON.parse(JSON.stringify(this.app.gameData.players[playerId]));

        // Mettre à jour la sélection visuelle
        document.querySelectorAll('#playersList .list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.playerId === playerId);
        });

        // Afficher l'éditeur
        this.renderEditor();
        this.updateJsonPreview();
        await this.loadPreview();
    }

    /**
     * Rendu de l'éditeur de joueur
     */
    renderEditor() {
        const editor = document.getElementById('playerEditor');
        if (!editor || !this.currentPlayer) return;

        const p = this.currentPlayer;
        const assets = this.app.assetScanner.getAssetPathsForSelect('players');

        editor.innerHTML = `
            <div class="editor-form">
                <div class="form-section">
                    <h3 class="form-section-title">Informations de base</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ID (clé unique)</label>
                            <input type="text" class="form-input" id="playerId" value="${this.currentPlayerId}">
                            <small style="color: var(--text-muted); font-size: 0.75rem;">Utilisé comme référence dans phases.json</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nom affiché</label>
                            <input type="text" class="form-input" id="playerName" value="${p.name || ''}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Statistiques</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Vitesse (speed)</label>
                            <input type="number" class="form-input" id="playerSpeed" value="${p.speed || 250}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Points de vie (hp)</label>
                            <input type="number" class="form-input" id="playerHp" value="${p.hp || 100}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">HP Maximum</label>
                            <input type="number" class="form-input" id="playerMaxHp" value="${p.maxHp || 100}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Cadence de tir (ms)</label>
                            <input type="number" class="form-input" id="playerFireRate" value="${p.fireRate || 300}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dégâts</label>
                            <input type="number" class="form-input" id="playerDamage" value="${p.damage || 10}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Vitesse projectile</label>
                            <input type="number" class="form-input" id="playerProjSpeed" value="${p.projectileSpeed || 400}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Rayon de pickup XP</label>
                            <input type="number" class="form-input" id="playerPickupRadius" value="${p.pickupRadius || 100}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">XP pour niveau 2</label>
                            <input type="number" class="form-input" id="playerXpNext" value="${p.xpNextLevel || 50}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Visuels</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="playerVisualType">
                                <option value="sprite" ${p.visuals?.type === 'sprite' ? 'selected' : ''}>Sprite (image)</option>
                                <option value="shape" ${p.visuals?.type === 'shape' ? 'selected' : ''}>Shape (forme)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Largeur (px, optionnel)</label>
                            <input type="number" class="form-input" id="playerWidth" value="${p.visuals?.width || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Hauteur (px, optionnel)</label>
                            <input type="number" class="form-input" id="playerHeight" value="${p.visuals?.height || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Direction Mode</label>
                            <select class="form-select" id="playerDirMode">
                                <option value="none" ${p.visuals?.directionMode === 'none' ? 'selected' : ''}>None (fixe)</option>
                                <option value="flip" ${p.visuals?.directionMode === 'flip' ? 'selected' : ''}>Flip (miroir)</option>
                                <option value="rotate" ${p.visuals?.directionMode === 'rotate' ? 'selected' : ''}>Rotate (orientation)</option>
                                <option value="4_way" ${p.visuals?.directionMode === '4_way' ? 'selected' : ''}>4 Way</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Angle Offset (°)</label>
                            <input type="number" class="form-input" id="playerAngleOffset" value="${p.visuals?.angleOffset || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label form-check">
                                <input type="checkbox" id="playerHitFlash" ${p.visuals?.hitFlash ? 'checked' : ''}>
                                Hit Flash (clignotement)
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Animations</h3>
                    <div id="animationsContainer">
                        ${this.renderAllAnimations(p.visuals?.animations, assets)}
                    </div>
                    <div class="add-animation-row">
                        <select class="form-select" id="newAnimSelect" style="flex: 1;">
                            ${this.getAvailableAnimationOptions(p.visuals?.animations)}
                        </select>
                        <button class="btn btn-sm btn-primary" id="addAnimationBtn">+ Ajouter Animation</button>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-danger" id="deletePlayerBtn">🗑️ Supprimer</button>
                    <button class="btn btn-success" id="savePlayerBtn">💾 Sauvegarder</button>
                </div>
            </div>
        `;

        this.bindEditorEvents();
    }

    /**
     * Liste des animations standards
     */
    getStandardAnimations() {
        return ['idle', 'walk', 'hurt', 'death', 'attack'];
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

        const dirMode = this.currentPlayer?.visuals?.directionMode || 'rotate';

        return Object.entries(animations)
            .map(([name, data]) => this.renderAnimationEditor(name, data, assets, dirMode))
            .join('');
    }

    /**
     * Rendu d'un éditeur d'animation
     */
    renderAnimationEditor(animName, animData, assets, dirMode = 'rotate') {
        // Détecter si c'est une animation 4_way (contient up/down/left/right)
        const is4Way = dirMode === '4_way' || (animData && (animData.up || animData.down || animData.left || animData.right));

        if (is4Way) {
            return this.render4WayAnimationEditor(animName, animData, assets);
        }

        // Mode simple (rotate, flip, none)
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
        if (!this.currentPlayer?.visuals?.animations) return;

        const animations = this.currentPlayer.visuals.animations;
        const isNew4Way = newMode === '4_way';

        for (const animName in animations) {
            const data = animations[animName];
            const isCurrently4Way = !!(data.up || data.down || data.left || data.right);

            if (isNew4Way && !isCurrently4Way) {
                // Convert simple to 4_way (on duplique pour aider l'utilisateur)
                animations[animName] = {
                    up: JSON.parse(JSON.stringify(data)),
                    down: JSON.parse(JSON.stringify(data)),
                    left: JSON.parse(JSON.stringify(data)),
                    right: JSON.parse(JSON.stringify(data))
                };
            } else if (!isNew4Way && isCurrently4Way) {
                // Convert 4_way to simple (on garde le 'down' par défaut ou le premier trouvé)
                animations[animName] = data.down || data.up || data.left || data.right;
                // S'assurer que les propriétés de base sont là
                if (!animations[animName]) animations[animName] = { frames: [], frameRate: 10, loop: true };
                if (!animations[animName].frames) animations[animName].frames = [];
            }
        }
    }

    /**
     * Bindind des événements de l'éditeur
     */
    bindEditorEvents() {
        const editor = document.getElementById('playerEditor');
        if (!editor) return;

        // Une seule fois : delegation pour les boutons dynamiques
        if (!editor.dataset.delegated) {
            editor.addEventListener('click', (e) => {
                const target = e.target;

                // Ajouter frame
                if (target.classList.contains('add-frame-btn')) {
                    const anim = target.dataset.anim;
                    const direction = target.dataset.direction || null;
                    this.addFrame(anim, direction);
                }

                // Supprimer frame
                if (target.classList.contains('remove-frame-btn')) {
                    const anim = target.dataset.anim;
                    const index = parseInt(target.dataset.index);
                    this.removeFrame(anim, index);
                }

                // Supprimer animation
                if (target.classList.contains('remove-anim-btn')) {
                    const anim = target.dataset.anim;
                    this.removeAnimation(anim);
                }
            });

            editor.dataset.delegated = 'true';
        }

        // Tous les inputs -> mise à jour
        editor.querySelectorAll('input, select').forEach(input => {
            // Éviter les doubles bindings sur les inputs statiques
            if (input.dataset.bound) return;

            if (input.id === 'playerDirMode') {
                input.addEventListener('change', (e) => {
                    const newMode = e.target.value;
                    if (this.currentPlayer.visuals) {
                        this.currentPlayer.visuals.directionMode = newMode;
                    }
                    this.convertAnimationsToMode(newMode);
                    this.renderEditor();
                    this.loadPreview();
                    this.updateJsonPreview();
                });
            } else {
                input.addEventListener('change', () => this.updatePlayerFromForm());
                input.addEventListener('input', () => this.updatePlayerFromForm());
            }

            input.dataset.bound = 'true';
        });

        // Ajouter animation (bouton unique hors delegation interieure si necessaire, mais ici on peut l'isoler)
        const addAnimBtn = document.getElementById('addAnimationBtn');
        if (addAnimBtn && !addAnimBtn.dataset.bound) {
            addAnimBtn.addEventListener('click', () => this.addNewAnimation());
            addAnimBtn.dataset.bound = 'true';
        }

        // Sauvegarder
        const saveBtn = document.getElementById('savePlayerBtn');
        if (saveBtn && !saveBtn.dataset.bound) {
            saveBtn.addEventListener('click', () => this.savePlayer());
            saveBtn.dataset.bound = 'true';
        }

        // Supprimer
        const deleteBtn = document.getElementById('deletePlayerBtn');
        if (deleteBtn && !deleteBtn.dataset.bound) {
            deleteBtn.addEventListener('click', () => this.deletePlayer());
            deleteBtn.dataset.bound = 'true';
        }

        // Charger les previews des frames
        this.loadFramePreviews();
    }

    /**
     * Met à jour le joueur depuis le formulaire
     */
    updatePlayerFromForm() {
        if (!this.currentPlayer) return;

        const p = this.currentPlayer;

        // ID modifiable
        const newId = document.getElementById('playerId')?.value?.trim();
        if (newId && newId !== this.currentPlayerId) {
            this.currentPlayerId = newId;
        }

        // Infos de base
        p.name = document.getElementById('playerName')?.value || '';
        p.speed = parseInt(document.getElementById('playerSpeed')?.value) || 250;
        p.hp = parseInt(document.getElementById('playerHp')?.value) || 100;
        p.maxHp = parseInt(document.getElementById('playerMaxHp')?.value) || 100;
        p.fireRate = parseInt(document.getElementById('playerFireRate')?.value) || 300;
        p.damage = parseInt(document.getElementById('playerDamage')?.value) || 10;
        p.projectileSpeed = parseInt(document.getElementById('playerProjSpeed')?.value) || 400;
        p.pickupRadius = parseInt(document.getElementById('playerPickupRadius')?.value) || 100;
        p.xpNextLevel = parseInt(document.getElementById('playerXpNext')?.value) || 50;

        // Visuels
        if (!p.visuals) p.visuals = {};
        p.visuals.type = document.getElementById('playerVisualType')?.value || 'sprite';

        const width = document.getElementById('playerWidth')?.value;
        if (width) p.visuals.width = parseInt(width);
        else delete p.visuals.width;

        const height = document.getElementById('playerHeight')?.value;
        if (height) p.visuals.height = parseInt(height);
        else delete p.visuals.height;

        p.visuals.directionMode = document.getElementById('playerDirMode')?.value || 'rotate';
        p.visuals.angleOffset = parseInt(document.getElementById('playerAngleOffset')?.value) || 0;
        p.visuals.hitFlash = document.getElementById('playerHitFlash')?.checked || false;

        // Animations - collecter toutes les animations visibles
        if (!p.visuals.animations) p.visuals.animations = {};

        const dirMode = p.visuals.directionMode;
        const is4Way = dirMode === '4_way';

        // Réinitialiser et reconstruire depuis le DOM
        const newAnimations = {};

        document.querySelectorAll('.animation-editor').forEach(editor => {
            const animName = editor.dataset.anim;
            const mode = editor.dataset.mode;

            if (mode === '4way' || is4Way) {
                // Mode 4_way - collecter par direction
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
                // Mode simple
                const frames = [];
                editor.querySelectorAll('.frame-select').forEach(select => {
                    if (select.value) frames.push(select.value);
                });

                const frameRate = parseInt(editor.querySelector('.anim-framerate')?.value) || 10;
                const loop = editor.querySelector('.anim-loop')?.checked ?? true;

                if (frames.length > 0 || p.visuals.animations[animName]) {
                    newAnimations[animName] = { frames, frameRate, loop };
                }
            }
        });
        p.visuals.animations = newAnimations;

        this.updateJsonPreview();
        this.loadPreview();
    }

    /**
     * Ajoute une nouvelle animation
     */
    addNewAnimation() {
        const select = document.getElementById('newAnimSelect');
        let animName = select?.value;

        if (!animName) return;

        if (animName === '_custom') {
            animName = prompt('Nom de l\'animation (ex: jump, special):');
            if (!animName) return;
            animName = animName.trim().toLowerCase().replace(/\s+/g, '_');
        }

        // Vérifier si elle existe déjà
        if (this.currentPlayer.visuals?.animations?.[animName]) {
            this.app.showNotification(`L'animation "${animName}" existe déjà`, 'warning');
            return;
        }

        // Ajouter l'animation vide
        if (!this.currentPlayer.visuals) this.currentPlayer.visuals = {};
        if (!this.currentPlayer.visuals.animations) this.currentPlayer.visuals.animations = {};

        const dirMode = this.currentPlayer.visuals?.directionMode;

        if (dirMode === '4_way') {
            // Structure 4_way
            this.currentPlayer.visuals.animations[animName] = {
                up: { frames: [], frameRate: 10, loop: true },
                down: { frames: [], frameRate: 10, loop: true },
                left: { frames: [], frameRate: 10, loop: true },
                right: { frames: [], frameRate: 10, loop: true }
            };
        } else {
            // Structure simple
            this.currentPlayer.visuals.animations[animName] = {
                frames: [],
                frameRate: 10,
                loop: true
            };
        }

        // Re-render l'éditeur
        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Supprime une animation
     */
    removeAnimation(animName) {
        if (!confirm(`Supprimer l'animation "${animName}" ?`)) return;

        if (this.currentPlayer.visuals?.animations?.[animName]) {
            delete this.currentPlayer.visuals.animations[animName];
        }

        // Re-render l'éditeur
        this.renderEditor();
        this.updateJsonPreview();
    }

    /**
     * Ajoute une frame à une animation
     */
    addFrame(animName, direction = null) {
        // Pour les animations 4_way, le animName contient animName_direction
        let frameListId = `frames-${animName}`;
        if (direction) {
            frameListId = `frames-${animName}_${direction}`;
        }

        const framesList = document.getElementById(frameListId);
        if (!framesList) return;

        const assets = this.app.assetScanner.getAssetPathsForSelect('players');
        const index = framesList.children.length;

        const frameHtml = this.renderFrame(direction ? `${animName}_${direction}` : animName, '', index, assets, direction);
        framesList.insertAdjacentHTML('beforeend', frameHtml);

        // On ne re-bind plus tout, la delegation s'en charge pour les clics
        // Mais on doit quand meme s'assurer que les nouveaux selects sont bindés pour le changement
        this.bindEditorEvents();
    }

    /**
     * Supprime une frame
     */
    removeFrame(animName, index) {
        const frameItem = document.querySelector(`.frame-item[data-anim="${animName}"][data-index="${index}"]`);
        if (frameItem) {
            frameItem.remove();
            this.updatePlayerFromForm();
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
        const preview = document.getElementById('playerJsonPreview');
        if (!preview || !this.currentPlayer) return;

        const json = JSON.stringify(this.currentPlayer, null, 2);
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
        if (!this.currentPlayer?.visuals?.animations) return null;

        const visuals = this.currentPlayer.visuals;
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
            if (visuals.angleOffset) transform += ` rotate(${visuals.angleOffset}deg)`;
        } else if (dirMode === 'rotate') {
            const angles = { right: 0, down: 90, left: 180, up: 270 };
            const angle = (angles[direction] || 0) + (visuals.angleOffset || 0);
            transform = `rotate(${angle}deg)`;
        } else if (visuals.angleOffset) {
            transform = `rotate(${visuals.angleOffset}deg)`;
        }

        return { frames, frameRate, transform };
    }

    /**
     * Charge la prévisualisation
     */
    async loadPreview() {
        const canvas = document.getElementById('playerPreviewCanvas');
        if (!canvas) return;

        const walkParams = this.getAnimationParams('walk');
        const idleParams = this.getAnimationParams('idle');

        const params = (walkParams?.frames?.length > 0) ? walkParams : idleParams;

        if (params?.frames?.length > 0) {
            const url = await this.app.assetScanner.getAssetURL(params.frames[0]);
            if (url) {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    let drawW = this.currentPlayer.visuals.width;
                    let drawH = this.currentPlayer.visuals.height;
                    const imgRatio = img.width / img.height;

                    // Calcul de la taille de prévisualisation cohérente
                    if (drawW && drawH) {
                        // On garde les deux si spécifiés
                    } else if (drawW) {
                        drawH = drawW / imgRatio;
                    } else if (drawH) {
                        drawW = drawH * imgRatio;
                    } else {
                        drawW = img.width;
                        drawH = img.height;
                    }

                    // On borne pour la prévisualisation
                    const maxPreview = 150;
                    if (drawW > maxPreview || drawH > maxPreview) {
                        const ratio = Math.min(maxPreview / drawW, maxPreview / drawH);
                        drawW *= ratio;
                        drawH *= ratio;
                    }

                    canvas.innerHTML = `<img src="${url}" alt="preview" style="width: ${drawW}px; height: ${drawH}px; transform: ${params.transform}; image-rendering: pixelated;">`;
                };
            }
        } else {
            canvas.innerHTML = `<span style="color: var(--text-muted)">Aucun sprite</span>`;
        }

        // Activer les boutons
        document.getElementById('playIdleBtn').disabled = !idleParams || idleParams.frames.length === 0;
        document.getElementById('playWalkBtn').disabled = !walkParams || walkParams.frames.length === 0;
        document.getElementById('stopAnimBtn').disabled = false;
    }

    /**
     * Joue une animation
     */
    async playAnimation(animName) {
        this.stopAnimation();

        const params = this.getAnimationParams(animName);
        if (!params || params.frames.length === 0) return;

        // Précharger les URLs
        const urls = [];
        for (const frame of params.frames) {
            const url = await this.app.assetScanner.getAssetURL(frame);
            if (url) urls.push(url);
        }

        if (urls.length === 0) return;

        this.currentFrameIndex = 0;
        const canvas = document.getElementById('playerPreviewCanvas');

        // Charger la première image pour avoir le ratio
        const img = new Image();
        img.src = urls[0];
        img.onload = () => {
            let drawW = this.currentPlayer.visuals.width;
            let drawH = this.currentPlayer.visuals.height;
            const imgRatio = img.width / img.height;

            if (drawW && drawH) { }
            else if (drawW) drawH = drawW / imgRatio;
            else if (drawH) drawW = drawH * imgRatio;
            else { drawW = img.width; drawH = img.height; }

            const maxPreview = 150;
            if (drawW > maxPreview || drawH > maxPreview) {
                const ratio = Math.min(maxPreview / drawW, maxPreview / drawH);
                drawW *= ratio;
                drawH *= ratio;
            }

            this.animationInterval = setInterval(() => {
                canvas.innerHTML = `<img src="${urls[this.currentFrameIndex]}" alt="frame" style="width: ${drawW}px; height: ${drawH}px; transform: ${params.transform}; image-rendering: pixelated;">`;
                this.currentFrameIndex = (this.currentFrameIndex + 1) % urls.length;
            }, 1000 / params.frameRate);
        };
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
     * Sauvegarde le joueur
     */
    async savePlayer() {
        if (!this.currentPlayerId || !this.currentPlayer) return;

        try {
            // Vérifier si l'ID a changé
            const idChanged = this.originalPlayerId && this.originalPlayerId !== this.currentPlayerId;

            // Vérifier que le nouvel ID n'existe pas déjà (sauf si c'est le même)
            if (idChanged && this.app.gameData.players[this.currentPlayerId]) {
                this.app.showNotification(`L'ID "${this.currentPlayerId}" existe déjà!`, 'error');
                return;
            }

            // Si l'ID a changé, supprimer l'ancien
            if (idChanged) {
                delete this.app.gameData.players[this.originalPlayerId];
            }

            // Mettre à jour les données en mémoire
            this.app.gameData.players[this.currentPlayerId] = this.currentPlayer;

            // Sauvegarder dans le fichier
            await this.app.fileManager.writeJSON('player.json', {
                players: this.app.gameData.players
            });

            // Mettre à jour l'ID original
            this.originalPlayerId = this.currentPlayerId;

            this.app.showNotification('Joueur sauvegardé avec succès!', 'success');
            this.loadPlayersList();

        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.app.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    /**
     * Supprime le joueur
     */
    async deletePlayer() {
        if (!this.currentPlayerId) return;

        if (!confirm(`Supprimer le joueur "${this.currentPlayer?.name || this.currentPlayerId}" ?`)) {
            return;
        }

        try {
            delete this.app.gameData.players[this.currentPlayerId];

            await this.app.fileManager.writeJSON('player.json', {
                players: this.app.gameData.players
            });

            this.app.showNotification('Joueur supprimé', 'success');
            this.currentPlayerId = null;
            this.currentPlayer = null;
            this.render();
            this.app.updateStats();

        } catch (error) {
            console.error('Erreur suppression:', error);
            this.app.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    /**
     * Ajoute un nouveau joueur
     */
    async addNewPlayer() {
        const id = `player_${Date.now()}`;
        const newPlayer = {
            name: 'Nouveau Joueur',
            speed: 250,
            hp: 100,
            maxHp: 100,
            fireRate: 300,
            damage: 10,
            projectileSpeed: 400,
            pickupRadius: 100,
            xpNextLevel: 50,
            visuals: {
                type: 'sprite',
                width: 64,
                directionMode: 'rotate',
                hitFlash: true,
                animations: {
                    idle: { frames: [], frameRate: 1 },
                    walk: { frames: [], frameRate: 10, loop: true }
                }
            }
        };

        this.app.gameData.players[id] = newPlayer;
        this.loadPlayersList();
        this.selectPlayer(id);
        this.app.updateStats();
    }

    /**
     * Bindind des événements globaux du module
     */
    bindEvents() {
        // Bouton retour
        document.querySelector('#playersSection .back-btn')?.addEventListener('click', (e) => {
            this.stopAnimation();
            this.app.navigateTo('hub');
        });

        // Bouton ajouter
        document.getElementById('addPlayerBtn')?.addEventListener('click', () => this.addNewPlayer());

        // Boutons animation
        document.getElementById('playIdleBtn')?.addEventListener('click', () => this.playAnimation('idle'));
        document.getElementById('playWalkBtn')?.addEventListener('click', () => this.playAnimation('walk'));
        document.getElementById('stopAnimBtn')?.addEventListener('click', () => this.stopAnimation());

        // Direction preview
        document.getElementById('previewDirection')?.addEventListener('change', () => {
            this.loadPreview();
        });

        // Toggle JSON
        document.getElementById('toggleJsonBtn')?.addEventListener('click', () => {
            const content = document.getElementById('playerJsonPreview');
            const btn = document.getElementById('toggleJsonBtn');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                btn.textContent = 'Masquer';
            } else {
                content.style.display = 'none';
                btn.textContent = 'Afficher';
            }
        });
    }
}

// Export global
window.PlayersModule = PlayersModule;
