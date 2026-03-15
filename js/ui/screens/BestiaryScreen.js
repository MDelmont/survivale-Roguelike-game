/**
 * BestiaryScreen
 * EVG Anthony - Survivor Edition
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
    drawTextWithOutline
} from '../UIManager.js';

export class BestiaryScreen {
    constructor(game) {
        this.game = game;
        this.tabs = [
            { id: 'monstres', name: 'Monstres' },
            { id: 'boss', name: 'Boss' },
            { id: 'armes', name: 'Armes/Proj.' },
            { id: 'experiences', name: 'Ramassables' },
            { id: 'personnages', name: 'Personnages' }
        ];
        this.currentTab = 'monstres';

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

        // Remplir la structure phase par phase
        phases.forEach((phase, index) => {
            const phaseName = phase.name || `Phase ${index + 1}`;
            // Une phase est considérée comme "découverte" si on y est déjà allé
            // progress = 1 signifie qu'on a fini/atteint la phase 1 (index 0)
            const isPhaseReached = index < currentProgress || (index === 0);

            const monstreItems = [];
            const bossItems = [];
            const armeItems = [];
            const expItems = [];
            const persoItems = [];

            // Monstres
            if (phase.enemy_types) {
                const discoveredMonstres = this.game.saveSystem.getDiscoveredEntities('monstres');
                phase.enemy_types.forEach(enemyId => {
                    const data = this.game.dataManager.getEnemyData(enemyId);
                    if (data) monstreItems.push({ id: enemyId, data, discovered: discoveredMonstres.includes(enemyId) });
                });
            }

            // Boss
            if (phase.boss_id) {
                const discoveredBoss = this.game.saveSystem.getDiscoveredEntities('boss');
                const data = this.game.dataManager.getBossData(phase.boss_id);
                // Si on a dépassé cette phase, le boss a forcément été vu
                const isDiscoveredBoss = discoveredBoss.includes(phase.boss_id) || index < currentProgress; 
                if (data) bossItems.push({ id: phase.boss_id, data, discovered: isDiscoveredBoss });
            }

            // Armes
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
                // L'arme par défaut est débloquée si la phase est atteinte
                const isDiscoveredWeapon = discoveredArmes.includes(phase.default_weapon) || isPhaseReached;
                if (data) armeItems.push({ id: phase.default_weapon, data, discovered: isDiscoveredWeapon });
            }

            // Ramassables (XP + Coffres d'armes)
            const discoveredExp = this.game.saveSystem.getDiscoveredEntities('experiences');
            if (phase.xp_visual) {
                expItems.push({ 
                    id: phase.xp_visual, 
                    data: { visuals: { path: phase.xp_visual, width: phase.xp_size || 30, height: phase.xp_size || 30 }, name: "Orbe d'XP" }, 
                    discovered: discoveredExp.includes(phase.xp_visual) || isPhaseReached
                });
            }
            if (phase.weapon_visual) {
                expItems.push({ 
                    id: phase.weapon_visual, 
                    data: { visuals: { path: phase.weapon_visual, width: phase.weapon_size || 40, height: phase.weapon_size || 40 }, name: "Boîte d'Arme" }, 
                    discovered: discoveredExp.includes(phase.weapon_visual) || isPhaseReached
                });
            }

            // Perso
            if (phase.player_id) {
                const discoveredPerso = this.game.saveSystem.getDiscoveredEntities('personnages');
                const data = this.game.dataManager.getPlayerData(phase.player_id);
                if (data) persoItems.push({ id: phase.player_id, data, discovered: discoveredPerso.includes(phase.player_id) || isPhaseReached });
            }

            if (monstreItems.length > 0) structure['monstres'].push({ phaseIndex: index, phaseName, items: monstreItems });
            if (bossItems.length > 0) structure['boss'].push({ phaseIndex: index, phaseName, items: bossItems });
            if (armeItems.length > 0) structure['armes'].push({ phaseIndex: index, phaseName, items: armeItems });
            if (expItems.length > 0) structure['experiences'].push({ phaseIndex: index, phaseName, items: expItems });
            if (persoItems.length > 0) structure['personnages'].push({ phaseIndex: index, phaseName, items: persoItems });
        });

        // Add Projectiles global fallback tab or integrate them into armes? The user said "monstre, projectile, personnage, boss, experience, arme."
        // Let's add projectiles into 'armes' for now as they are closely linked.

        return structure;
    }

    update(deltaTime, mouseX, mouseY) {
        this.animationTime += deltaTime;

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
        // On duplique la logique de positionnement pour trouver ce qu'on survole
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
                    this.hoveredItem = phaseData.phaseIndex + '_' + item.id;
                }
                currentX += itemSize + spacingX;
            }
            contentY += itemSizeHeight + 60; // Espace avant la phase suivante
        }
    }

    handleClick(mouseX, mouseY) {
        if (this.hoveredBtn === 'back') return 'back';

        if (this.hoveredBtn && this.hoveredBtn.startsWith('tab_')) {
            this.currentTab = this.hoveredBtn.substring(4);
            this.scrollOffset = 0; // reset scroll
            return null;
        }

        return null; // Pas d'action au clic sur un item pour l'instant
    }

    handleWheel(deltaY) {
        const scrollSpeed = 40;
        this.scrollOffset -= Math.sign(deltaY) * scrollSpeed;
        
        // Limite supérieure (ne pas scroller plus haut que le top)
        if (this.scrollOffset > 0) {
            this.scrollOffset = 0;
        }

        // Limite inférieure grossière (on calcule la hauteur totale du contenu actuel)
        const phasesList = this.categorizedData[this.currentTab] || [];
        const w = this.game.logicalWidth;
        const padding = 40;
        const itemSize = 140;
        const itemSizeHeight = this.currentTab === 'monstres' || this.currentTab === 'boss' || this.currentTab === 'armes' ? 180 : 160;
        const spacingX = 25;
        const spacingY = 35;

        let totalHeight = 180; // Margin top (titles, tabs)
        for (const phaseData of phasesList) {
            totalHeight += 60; // Titre de phase
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
            totalHeight += 60; // Espace inter-phase
        }

        const maxScroll = Math.min(0, -(totalHeight - this.game.logicalHeight + 100)); // +100 for bottom padding
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

        // Fond assombri de base
        ctx.fillStyle = Colors.SURFACE_DARKER;
        ctx.fillRect(0, 0, w, h);

        // Pattern optionnel (scanline ou radial gradient bg)
        const gradient = ctx.createRadialGradient(w/2, h/2, 100, w/2, h/2, w);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Titre
        drawTextWithOutline(ctx, 'LE BESTIAIRE', w / 2, 50, {
            font: `bold 48px ${Typography.FONT_DISPLAY}`,
            fillColor: Colors.PRIMARY,
            strokeColor: '#000',
            strokeWidth: 6
        });

        // Tabs
        this.drawTabs(ctx);

        // Contenu
        this.drawContent(ctx);

        // Bouton Retour
        drawButton(ctx, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h, this.backBtn.text, {
            color: this.backBtn.color,
            isHovered: this.hoveredBtn === this.backBtn.id
        });
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
            ctx.roundRect(startX, startY - tabH/2, tabW, tabH, [10, 10, 0, 0]);
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

        // Ligne séparatrice
        ctx.strokeStyle = Colors.PRIMARY;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w / 2 - totalW / 2, startY + tabH/2);
        ctx.lineTo(w / 2 + totalW / 2, startY + tabH/2);
        ctx.stroke();
    }

    drawContent(ctx) {
        const w = this.game.logicalWidth;
        let contentY = 180 + this.scrollOffset;
        const padding = 40;
        const maxW = w - padding * 2;
        
        const phasesList = this.categorizedData[this.currentTab] || [];

        if (phasesList.length === 0) {
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = `24px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.fillText("Aucune donnée disponible pour cette catégorie.", w / 2, h / 2);
            return;
        }

        const itemSize = 140;
        const itemSizeHeight = this.currentTab === 'monstres' || this.currentTab === 'boss' || this.currentTab === 'armes' ? 180 : 160;
        const spacingX = 25;
        const spacingY = 35;

        for (const phaseData of phasesList) {
            // Titre de Phase
            ctx.fillStyle = Colors.TEXT_PRIMARY;
            ctx.font = `bold 26px ${Typography.FONT_DISPLAY}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(phaseData.phaseName.toUpperCase(), padding, contentY);
            
            // Ligne fine sous le nom de phase
            ctx.strokeStyle = Colors.PRIMARY;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(padding, contentY + 35);
            ctx.lineTo(w - padding, contentY + 35);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            contentY += 60;

            let currentX = padding;
            // Objets dans cette phase
            for (const item of phaseData.items) {
                // Retour à la ligne si plus de place
                if (currentX + itemSize > w - padding) {
                    currentX = padding;
                    contentY += itemSizeHeight + spacingY;
                }

                const itemIdStr = phaseData.phaseIndex + '_' + item.id;
                const isHovered = this.hoveredItem === itemIdStr;
                this.drawEntityCard(ctx, currentX, contentY, itemSize, itemSizeHeight, item, isHovered);
                
                currentX += itemSize + spacingX;
            }

            contentY += itemSizeHeight + 60; // Espace avant la phase suivante
        }
    }

    drawEntityCard(ctx, x, y, size, sizeHeight, item, isHovered) {
        // Fond
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
            // Affichage "Verrouillé"
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = `bold 16px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('???', centerX, centerY - 10);
            ctx.font = `12px ${Typography.FONT_PRIMARY}`;
            ctx.fillText('Non découvert', centerX, centerY + 15);
        } else {
            // Rendu de l'asset
            const v = item.data.visuals || item.data.sprite;
            let imgPath = null;

            // Extraire toutes les frames possibles pour montrer "tous les angles" (animations)
            let allFrames = [];
            
            const extractFrames = (obj) => {
                if (!obj || typeof obj !== 'object') return;
                if (Array.isArray(obj.frames)) {
                    allFrames.push(...obj.frames);
                } else if (Array.isArray(obj)) {
                    // Check if it's an array of strings (path)
                    obj.forEach(item => {
                        if (typeof item === 'string' && (item.includes('.png') || item.includes('.jpg'))) {
                            allFrames.push(item);
                        } else {
                            extractFrames(item);
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
            
            // Remove duplicates
            allFrames = [...new Set(allFrames)];

            if (allFrames.length > 0) {
                // Cycle through frames every 400ms
                let frameIndex = Math.floor(this.animationTime / 400) % allFrames.length;
                imgPath = allFrames[frameIndex];
            }

            if (imgPath && this.game.dataManager.assetManager.isLoaded(imgPath)) {
                const img = this.game.dataManager.assetManager.getImage(imgPath);
                
                // Calcul du scale pour faire tenir l'image sans déformer (respect de l'aspect ratio)
                const maxDim = size - 30;
                let drawW = img.width;
                let drawH = img.height;

                // Fallback si l'image native n'est pas chargée correctement mais on a les confs
                if (!drawW || drawW === 0) {
                    drawW = (v && v.width) ? v.width : 50;
                    drawH = (v && v.height) ? v.height : drawW;
                }

                if (drawW > maxDim || drawH > maxDim) {
                    const ratio = Math.min(maxDim / drawW, maxDim / drawH);
                    drawW *= ratio;
                    drawH *= ratio;
                }

                ctx.save();
                ctx.translate(centerX, centerY - 15);

                // Si l'ennemi a un angleOffset utilisé pour être couché de base, on le redresse
                if (v && v.angleOffset) {
                    ctx.rotate(-v.angleOffset * Math.PI / 180);
                }

                ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                ctx.restore();
            }

            // Nom de l'entité
            ctx.fillStyle = Colors.TEXT_PRIMARY;
            ctx.font = `bold 14px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const name = item.data.name || item.id;
            // Shorten name if too long
            const displayTitle = name.length > 15 ? name.substring(0, 13) + "..." : name;
            ctx.fillText(displayTitle, centerX, y + sizeHeight - 40);
            
            // Stats rapides si c'est un monstre
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
