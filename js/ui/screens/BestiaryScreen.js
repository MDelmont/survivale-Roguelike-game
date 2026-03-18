/**
 * BestiaryScreen
 * Souvenir d’Ony - Survivor Edition
 *
 * Affiche les entités rencontrées dans le jeu, classées par phase.
 */
import {
    Colors,
    Typography,
    Spacing,
    Effects,
    drawButton,
    drawGlassPanel,
    drawTextWithOutline,
    roundRect
} from '../UIManager.js';

export class BestiaryScreen {
    constructor(game) {
        this.game = game;
        this.tabs = [
            { id: 'monstres', name: 'Monstres' },
            { id: 'boss', name: 'Boss' },
            { id: 'armes', name: 'Armes/Proj.' },
            { id: 'experiences', name: 'Ramassables' },
            { id: 'personnages', name: 'Personnages' },
            { id: 'transitions', name: 'Cinématiques' }
        ];
        this.currentTab = 'monstres';
        
        this.viewingTransition = null; // Transition data being viewed
        this.viewingPageIdx = 0; // Current page in the viewer

        this.backBtn = {
            id: 'back',
            text: 'RETOUR',
            color: Colors.SECONDARY,
            x: 0, 
            y: 0, 
            w: 160, 
            h: 50
        };

        this.hoveredBtn = null;
        this.hoveredItem = null;
        this.hoveredPhase = null;

        // Configuration pour la grille
        this.scrollOffset = 0;
        this.animationTime = 0;

        // Pré-traitement des données
        this.categorizedData = this.buildDataStructure();
    }

    reset() {
        this.hoveredBtn = null;
        this.hoveredItem = null;
        this.hoveredPhase = null;
        this.scrollOffset = 0;
        this.currentTab = 'monstres';
        this.viewingTransition = null;
        this.viewingPageIdx = 0;
        this.categorizedData = this.buildDataStructure(); // Recharge pour intégrer les dernières découvertes
    }

    /**
     * Construit une structure de données:
     * { [tabId]: [ { phaseIndex, phaseName, items: [ { id, data, discovered } ] } ] }
     */
    buildDataStructure() {
        const structure = {};
        this.tabs.forEach(t => structure[t.id] = []);

        const currentProgress = this.game.saveSystem.getProgress();
        const phases = this.game.dataManager.data.phases?.phases || [];
        const transitionsData = this.game.dataManager.data.transitions?.transitions || [];

        // Remplir la structure phase par phase
        phases.forEach((phase, index) => {
            const phaseName = phase.name || `Phase ${index + 1}`;
            // Une phase est considérée comme "découverte" si on y est déjà allé
            const isPhaseReached = index < currentProgress || (index === 0);

            const monstreItems = [];
            const bossItems = [];
            const armeItems = [];
            const expItems = [];
            const persoItems = [];
            const transitionItems = [];

            // 1. Monstres
            if (phase.enemy_types) {
                const discoveredMonstres = this.game.saveSystem.getDiscoveredEntities('monstres');
                phase.enemy_types.forEach(enemyId => {
                    const data = this.game.dataManager.getEnemyData(enemyId);
                    if (data) monstreItems.push({ id: enemyId, data, discovered: discoveredMonstres.includes(enemyId) || isPhaseReached });
                });
            }

            // 2. Boss
            if (phase.boss_id) {
                const discoveredBoss = this.game.saveSystem.getDiscoveredEntities('boss');
                const data = this.game.dataManager.getBossData(phase.boss_id);
                // Si on a dépassé cette phase, le boss a forcément été vu
                const isDiscoveredBoss = discoveredBoss.includes(phase.boss_id) || index < currentProgress; 
                if (data) bossItems.push({ id: phase.boss_id, data, discovered: isDiscoveredBoss });
            }

            // 3. Armes / Projectiles
            if (phase.available_weapons) {
                const discoveredArmes = this.game.saveSystem.getDiscoveredEntities('armes');
                phase.available_weapons.forEach(weaponId => {
                    const data = this.game.dataManager.getWeaponData(weaponId);
                    if (data) armeItems.push({ id: weaponId, data, discovered: discoveredArmes.includes(weaponId) });
                });
            }
            if (phase.default_weapon && !armeItems.find(a => a.id === phase.default_weapon)) {
                const discoveredArmes = this.game.saveSystem.getDiscoveredEntities('armes');
                const data = this.game.dataManager.getWeaponData(phase.default_weapon);
                if (data) armeItems.push({ id: phase.default_weapon, data, discovered: discoveredArmes.includes(phase.default_weapon) || isPhaseReached });
            }

            // 4. Ramassables (XP + Coffres)
            const discoveredExp = this.game.saveSystem.getDiscoveredEntities('experiences');
            if (phase.xp_visual) {
                expItems.push({ 
                    id: phase.xp_visual, 
                    data: { visuals: { path: phase.xp_visual, width: phase.xp_size || 20, height: phase.xp_size || 20 }, name: "Orbe d'XP" }, 
                    discovered: discoveredExp.includes(phase.xp_visual) || isPhaseReached 
                });
            }
            if (phase.weapon_visual) {
                expItems.push({ 
                    id: phase.weapon_visual, 
                    data: { visuals: { path: phase.weapon_visual, width: phase.weapon_size || 30, height: phase.weapon_size || 30 }, name: "Boîte d'Arme" }, 
                    discovered: discoveredExp.includes(phase.weapon_visual) || isPhaseReached 
                });
            }

            // 5. Transitions
            const addTrans = (tid, label) => {
                if (!tid) return;
                const trans = transitionsData.find(t => t.id === tid);
                if (trans) {
                    const isDiscovered = this.game.saveSystem.isEntityDiscovered('transitions', tid);
                    transitionItems.push({
                        id: tid,
                        label: label,
                        data: trans,
                        discovered: isDiscovered
                    });
                }
            };
            addTrans(phase.transition_intro_id, "Intro");
            addTrans(phase.transition_outro_id, "Victoire");
            addTrans(phase.transition_defeat_id, "Défaite");

            // 6. Personnages
            if (phase.player_id) {
                const discoveredPerso = this.game.saveSystem.getDiscoveredEntities('personnages');
                const data = this.game.dataManager.getPlayerData(phase.player_id);
                if (data) persoItems.push({ id: phase.player_id, data, discovered: discoveredPerso.includes(phase.player_id) || isPhaseReached });
            }

            // --- Enregistrement dans la structure ---
            if (monstreItems.length > 0) structure['monstres'].push({ phaseIndex: index, phaseName, items: monstreItems });
            if (bossItems.length > 0) structure['boss'].push({ phaseIndex: index, phaseName, items: bossItems });
            if (armeItems.length > 0) structure['armes'].push({ phaseIndex: index, phaseName, items: armeItems });
            if (expItems.length > 0) structure['experiences'].push({ phaseIndex: index, phaseName, items: expItems });
            if (persoItems.length > 0) structure['personnages'].push({ phaseIndex: index, phaseName, items: persoItems });
            if (transitionItems.length > 0) structure['transitions'].push({ phaseIndex: index, phaseName, items: transitionItems });
        });

        return structure;
    }

    update(deltaTime, mouseX, mouseY) {
        this.animationTime += deltaTime;

        // Si on visionne une cinématique, on ignore le reste
        if (this.viewingTransition) {
            this.hoveredBtn = null;
            // Next button
            if (this.isPointInRect(mouseX, mouseY, this.game.logicalWidth / 2 - 130, this.game.logicalHeight - 90, 260, 60)) {
                this.hoveredBtn = 'viewer_next';
            }
            // Close button (X) top right
            if (this.isPointInRect(mouseX, mouseY, this.game.logicalWidth - 80, 30, 50, 50)) {
                this.hoveredBtn = 'viewer_close';
            }
            return;
        }

        this.hoveredBtn = null;
        this.hoveredItem = null;
        this.hoveredPhase = null;

        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;

        // Bouton retour
        this.backBtn.x = 40;
        this.backBtn.y = h - 90;
        if (this.isPointInRect(mouseX, mouseY, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h)) {
            this.hoveredBtn = this.backBtn.id;
        }

        // Tabs
        const tabW = 200;
        const totalTabsW = this.tabs.length * (tabW + 10) - 10;
        let startX = w / 2 - totalTabsW / 2;
        const tabY = 100;

        for (const tab of this.tabs) {
            if (this.isPointInRect(mouseX, mouseY, startX, tabY - 25, tabW, 50)) {
                this.hoveredBtn = 'tab_' + tab.id;
            }
            startX += tabW + 10;
        }

        // --- Grille d'objets (Hover info) ---
        const phasesList = this.categorizedData[this.currentTab] || [];
        let contentY = 180 + this.scrollOffset;
        const padding = 40;
        const itemSize = 140;
        const itemSizeHeight = this.currentTab === 'monstres' || this.currentTab === 'boss' || this.currentTab === 'armes' ? 180 : 160;
        const spacingX = 25;
        const spacingY = 35;

        for (const phaseData of phasesList) {
            contentY += 60; // Titre
            let currentX = padding;

            for (const item of phaseData.items) {
                if (currentX + itemSize > w - padding) {
                    currentX = padding;
                    contentY += itemSizeHeight + spacingY;
                }

                if (this.isPointInRect(mouseX, mouseY, currentX, contentY, itemSize, itemSizeHeight)) {
                    // Vérifier que l'item n'est pas "clipsé" (entre 150 et h-100)
                    if (contentY >= 140 && contentY + itemSizeHeight <= h - 90) {
                        this.hoveredItem = `${phaseData.phaseIndex}|${item.id}`;
                    }
                }
                currentX += itemSize + spacingX;
            }
            contentY += itemSizeHeight + 60; // Espace avant la phase suivante
        }
    }

    handleClick(mouseX, mouseY) {
        if (this.viewingTransition) {
            if (this.hoveredBtn === 'viewer_next') {
                this.viewingPageIdx++;
                if (this.viewingPageIdx >= this.viewingTransition.pages.length) {
                    this.viewingTransition = null;
                }
            } else if (this.hoveredBtn === 'viewer_close') {
                this.viewingTransition = null;
            }
            return null;
        }

        if (this.hoveredBtn === 'back') return 'back';

        if (this.hoveredBtn && this.hoveredBtn.startsWith('tab_')) {
            this.currentTab = this.hoveredBtn.substring(4);
            this.scrollOffset = 0; // reset scroll
            return null;
        }

        if (this.hoveredItem && this.currentTab === 'transitions') {
            const separatorIdx = this.hoveredItem.indexOf('|');
            const pIdx = this.hoveredItem.substring(0, separatorIdx);
            const tId = this.hoveredItem.substring(separatorIdx + 1);
            
            const phase = this.categorizedData['transitions'].find(p => p.phaseIndex == pIdx);
            const item = phase.items.find(i => i.id == tId);
            if (item && item.discovered) {
                this.viewingTransition = item.data;
                this.viewingPageIdx = 0;
            }
        }

        return null; 
    }

    handleWheel(deltaY) {
        const scrollSpeed = 40;
        this.scrollOffset -= Math.sign(deltaY) * scrollSpeed;
        
        if (this.scrollOffset > 0) {
            this.scrollOffset = 0;
        }

        const phasesList = this.categorizedData[this.currentTab] || [];
        const w = this.game.logicalWidth;
        const padding = 40;
        const itemSize = 140;
        const itemSizeHeight = this.currentTab === 'monstres' || this.currentTab === 'boss' || this.currentTab === 'armes' ? 180 : 160;
        const spacingX = 25;
        const spacingY = 35;

        let totalHeight = 180;
        for (const phaseData of phasesList) {
            totalHeight += 60;
            let currentX = padding;
            let rows = 1;
            for (const item of phaseData.items) {
                if (currentX + itemSize > w - padding) {
                    currentX = padding;
                    rows++;
                }
                currentX += itemSize + spacingX;
            }
            totalHeight += rows * (itemSizeHeight + spacingY);
            totalHeight += 60;
        }

        const maxScroll = Math.min(0, -(totalHeight - this.game.logicalHeight + 100));
        if (this.scrollOffset < maxScroll) {
            this.scrollOffset = maxScroll;
        }
    }

    isPointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    draw(ctx) {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;

        ctx.fillStyle = Colors.SURFACE_DARKER;
        ctx.fillRect(0, 0, w, h);

        const gradient = ctx.createRadialGradient(w/2, h/2, 100, w/2, h/2, w);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        drawTextWithOutline(ctx, 'LE BESTIAIRE', w / 2, 50, {
            font: `bold 48px ${Typography.FONT_DISPLAY}`,
            fillColor: Colors.PRIMARY,
            strokeColor: '#000',
            strokeWidth: 6
        });

        if (this.viewingTransition) {
            this.drawViewer(ctx);
        } else {
            this.drawTabs(ctx);
            this.drawContent(ctx);
        }

        drawButton(ctx, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h, this.backBtn.text, {
            color: this.backBtn.color,
            isHovered: this.hoveredBtn === this.backBtn.id
        });
    }

    drawViewer(ctx) {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;
        const page = this.viewingTransition.pages[this.viewingPageIdx];

        if (page.background && this.game.dataManager.assetManager.isLoaded(page.background)) {
            const bgImg = this.game.dataManager.assetManager.getImage(page.background);
            this.game.drawImageCover(ctx, bgImg, w, h);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
        }

        if (page.image && this.game.dataManager.assetManager.isLoaded(page.image)) {
            const img = this.game.dataManager.assetManager.getImage(page.image);
            const scale = Math.min(w / img.width, (h * 0.4) / img.height);
            const imgW = img.width * scale;
            const imgH = img.height * scale;
            ctx.drawImage(img, w / 2 - imgW / 2, 100, imgW, imgH);
        }

        if (!page.hideTitle || !page.hideText) {
            const boxW = Math.min(w * 0.8, 800);
            const boxH = 300;
            const boxX = w / 2 - boxW / 2;
            const boxY = h / 2 + 100 - boxH / 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = page.titleColor || '#3b82f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            if (!page.hideTitle) {
                ctx.fillStyle = page.titleColor || '#3b82f6';
                ctx.font = `bold ${page.titleSize || 28}px Orbitron, sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(page.title || "...", w / 2, boxY + 50);
            }

            if (!page.hideText) {
                ctx.fillStyle = page.textColor || '#fff';
                ctx.font = `${page.textSize || 18}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                this.game.wrapText(ctx, page.text || "", w / 2, boxY + 100, boxW - 60, 24);
            }
        }

        const btnW = 260;
        const btnH = 60;
        const btnX = w / 2 - btnW / 2;
        const btnY = h - 90;
        const isHovered = this.hoveredBtn === 'viewer_next';

        ctx.save();
        ctx.shadowColor = 'rgba(0, 212, 255, 0.6)';
        ctx.shadowBlur = isHovered ? 30 : 20;
        ctx.fillStyle = isHovered ? 'rgba(0, 212, 255, 0.25)' : 'rgba(0, 212, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 12);
        ctx.fill();
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const isLast = (this.viewingPageIdx >= this.viewingTransition.pages.length - 1);
        const btnLabel = isLast ? 'FERMER' : 'SUIVANT ▶';
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 22px Orbitron, Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btnLabel, w / 2, btnY + btnH / 2);
        ctx.restore();

        // Close Button (X)
        const closeHovered = this.hoveredBtn === 'viewer_close';
        ctx.save();
        ctx.translate(w - 70, 40);
        ctx.fillStyle = closeHovered ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = closeHovered ? '#ff4444' : '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(ctx, 0, 0, 50, 50, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = closeHovered ? '#ff4444' : '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(15, 15); ctx.lineTo(35, 35);
        ctx.moveTo(35, 15); ctx.lineTo(15, 35);
        ctx.stroke();
        ctx.restore();
    }

    drawTabs(ctx) {
        const w = this.game.logicalWidth;
        const tabW = 200;
        const tabH = 50;
        const spacing = 10;
        const totalW = this.tabs.length * (tabW + spacing) - spacing;
        let startX = w / 2 - totalW / 2;
        const startY = 100;

        for (const tab of this.tabs) {
            const isSelected = this.currentTab === tab.id;
            const isHovered = this.hoveredBtn === 'tab_' + tab.id;
            
            ctx.fillStyle = isSelected ? Colors.PRIMARY : (isHovered ? Colors.GLASS_BG_LIGHT : Colors.GLASS_BG);
            ctx.beginPath();
            roundRect(ctx, startX, startY - tabH/2, tabW, tabH, { tl: 10, tr: 10, br: 0, bl: 0 });
            ctx.fill();

            if (isSelected) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.fillStyle = isSelected ? '#000' : Colors.TEXT_PRIMARY;
            ctx.font = `bold 20px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.name, startX + tabW/2, startY);

            startX += tabW + spacing;
        }

        ctx.strokeStyle = Colors.PRIMARY;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w / 2 - totalW / 2, startY + tabH/2);
        ctx.lineTo(w / 2 + totalW / 2, startY + tabH/2);
        ctx.stroke();
    }

    drawContent(ctx) {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;
        let contentY = 180 + this.scrollOffset;
        const padding = 40;
        
        const phasesList = this.categorizedData[this.currentTab] || [];

        if (phasesList.length === 0) {
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = `24px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.fillText("Aucune donnée disponible pour cette catégorie.", w / 2, h / 2);
            return;
        }

        // --- Clipping Area for scroll contents ---
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 150, w, h - 250); // Area between title/tabs and back button
        ctx.clip();

        const itemSize = 140;
        const itemSizeHeight = this.currentTab === 'monstres' || this.currentTab === 'boss' || this.currentTab === 'armes' ? 180 : 160;
        const spacingX = 25;
        const spacingY = 35;

        for (const phaseData of phasesList) {
            ctx.fillStyle = Colors.TEXT_PRIMARY;
            ctx.font = `bold 26px ${Typography.FONT_DISPLAY}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(phaseData.phaseName.toUpperCase(), padding, contentY);
            
            ctx.strokeStyle = Colors.PRIMARY;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(padding, contentY + 35);
            ctx.lineTo(w - padding, contentY + 35);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            contentY += 60;

            let currentX = padding;
            for (const item of phaseData.items) {
                if (currentX + itemSize > w - padding) {
                    currentX = padding;
                    contentY += itemSizeHeight + spacingY;
                }

                const itemIdStr = `${phaseData.phaseIndex}|${item.id}`;
                const isHovered = this.hoveredItem === itemIdStr;
                this.drawEntityCard(ctx, currentX, contentY, itemSize, itemSizeHeight, item, isHovered);
                
                currentX += itemSize + spacingX;
            }
            contentY += itemSizeHeight + 60;
        }

        ctx.restore(); // End clipping
    }

    drawTransitionCard(ctx, x, y, size, sizeHeight, item, isHovered) {
        const isDiscovered = item.discovered;
        let borderColor = Colors.TEXT_MUTED;
        if (isDiscovered) borderColor = isHovered ? Colors.ACCENT : Colors.PRIMARY;

        if (isHovered && isDiscovered) {
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = Effects.GLOW_SM;
        }

        drawGlassPanel(ctx, x, y, size, sizeHeight, {
            bgColor: isDiscovered ? (isHovered ? Colors.GLASS_BG_LIGHT : Colors.GLASS_BG) : 'rgba(0,0,0,0.6)',
            borderColor: borderColor,
            borderWidth: isHovered && isDiscovered ? 3 : 2,
            cornerRadius: Effects.BORDER_RADIUS_MD
        });
        
        ctx.shadowBlur = 0;

        const centerX = x + size / 2;
        const centerY = y + size / 2;

        if (!item.discovered) {
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = `bold 16px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('???', centerX, centerY - 10);
            ctx.font = `12px ${Typography.FONT_PRIMARY}`;
            ctx.fillText('Cinématique verrouillée', centerX, centerY + 15);
        } else {
            const bgPath = item.data.pages?.[0]?.background;
            if (bgPath && this.game.dataManager.assetManager.isLoaded(bgPath)) {
                const img = this.game.dataManager.assetManager.getImage(bgPath);
                ctx.save();
                ctx.translate(x + 5, y + 5);
                ctx.beginPath();
                roundRect(ctx, 0, 0, size - 10, sizeHeight - 10, 8);
                ctx.clip();
                this.game.drawImageCover(ctx, img, size - 10, sizeHeight - 10);
                ctx.restore();
                
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(x + 5, y + sizeHeight - 40, size - 10, 35);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Inter, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.label || "Page", x + size / 2, y + sizeHeight - 15);
            } else {
                ctx.fillStyle = Colors.PRIMARY;
                ctx.font = 'bold 30px Orbitron';
                ctx.textAlign = 'center';
                ctx.fillText("▶", centerX, centerY);
            }
        }
    }

    drawEntityCard(ctx, x, y, size, sizeHeight, item, isHovered) {
        if (this.currentTab === 'transitions') {
            this.drawTransitionCard(ctx, x, y, size, sizeHeight, item, isHovered);
            return;
        }

        const isDiscovered = item.discovered;
        const centerX = x + size / 2;
        const centerY = y + size / 2;

        let borderColor = Colors.TEXT_MUTED;
        if (isDiscovered) borderColor = isHovered ? Colors.ACCENT : Colors.PRIMARY;

        if (isHovered && isDiscovered) {
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = Effects.GLOW_SM;
        }

        drawGlassPanel(ctx, x, y, size, sizeHeight, {
            bgColor: isDiscovered ? (isHovered ? Colors.GLASS_BG_LIGHT : Colors.GLASS_BG) : 'rgba(0,0,0,0.6)',
            borderColor: borderColor,
            borderWidth: isHovered && isDiscovered ? 3 : 2,
            cornerRadius: Effects.BORDER_RADIUS_MD
        });
        ctx.shadowBlur = 0;

        if (!isDiscovered) {
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = `bold 16px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('???', centerX, centerY - 10);
            ctx.font = `12px ${Typography.FONT_PRIMARY}`;
            ctx.fillText('Non découvert', centerX, centerY + 15);
        } else {
            const v = item.data.visuals || item.data.sprite;
            let imgPath = null;
            let allFrames = [];
            
            const extractFrames = (obj) => {
                if (!obj || typeof obj !== 'object') return;
                if (Array.isArray(obj.frames)) {
                    allFrames.push(...obj.frames);
                } else if (Array.isArray(obj)) {
                    obj.forEach(it => {
                        if (typeof it === 'string' && (it.includes('.png') || it.includes('.jpg'))) {
                            allFrames.push(it);
                        } else {
                            extractFrames(it);
                        }
                    });
                } else {
                    Object.values(obj).forEach(val => extractFrames(val));
                }
            };

            if (v && v.animations) {
                extractFrames(v.animations);
            } else if (v && v.path) {
                allFrames = [v.path];
            } else if (v && typeof v === 'string') {
                allFrames = [v];
            }
            
            allFrames = [...new Set(allFrames)];

            if (allFrames.length > 0) {
                let frameIndex = Math.floor(this.animationTime / 400) % allFrames.length;
                imgPath = allFrames[frameIndex];
            }

            if (imgPath && this.game.dataManager.assetManager.isLoaded(imgPath)) {
                const img = this.game.dataManager.assetManager.getImage(imgPath);
                const maxDim = size - 30;
                let drawW = img.width || (v?.width || 50);
                let drawH = img.height || (v?.height || drawW);

                if (drawW > maxDim || drawH > maxDim) {
                    const ratio = Math.min(maxDim / drawW, maxDim / drawH);
                    drawW *= ratio;
                    drawH *= ratio;
                }

                ctx.save();
                ctx.translate(centerX, centerY - 15);
                if (v && v.angleOffset) {
                    ctx.rotate(-v.angleOffset * Math.PI / 180);
                }
                ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                ctx.restore();
            }

            ctx.fillStyle = Colors.TEXT_PRIMARY;
            ctx.font = `bold 14px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const name = item.data.name || item.id;
            const displayTitle = name.length > 15 ? name.substring(0, 13) + "..." : name;
            ctx.fillText(displayTitle, centerX, y + sizeHeight - 40);
            
            if (this.currentTab === 'monstres' || this.currentTab === 'boss') {
                ctx.fillStyle = '#f55';
                ctx.font = `11px ${Typography.FONT_MONO}`;
                ctx.fillText(`PV: ${item.data.hp || '?'} | DMG: ${item.data.damage || '?'}`, centerX, y + sizeHeight - 20);
            } else if (this.currentTab === 'armes') {
                ctx.fillStyle = Colors.TEXT_SECONDARY;
                ctx.font = `11px ${Typography.FONT_MONO}`;
                ctx.fillText(`DMG: ${item.data.stats?.damage || '?'} | SPD: ${item.data.stats?.fireRate || '?'}`, centerX, y + sizeHeight - 20);
            }
        }
    }
}
