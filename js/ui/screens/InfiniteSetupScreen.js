import {
    Colors,
    Typography,
    drawGlassPanel,
    easeOutElastic
} from '../UIManager.js';

export class InfiniteSetupScreen {
    constructor(game) {
        this.game = game;
        this.players = [];
        this.weapons = [];
        
        this.currentPlayerIndex = 0;
        this.selectedWeapons = new Set();
        this.difficulty = 'medium'; // simple, medium, extreme

        this.difficulties = [
            { id: 'simple', label: 'SIMPLE', multiplier: 1, color: Colors.SUCCESS || '#10B981' },
            { id: 'medium', label: 'MEDIUM', multiplier: 2, color: Colors.WARNING || '#F59E0B' },
            { id: 'extreme', label: 'EXTRÊME', multiplier: 3, color: Colors.DANGER || '#EF4444' }
        ];

        this.hoveredItem = null;
        this.hoveredWeaponParam = null; // To display weapon description

        // Scrolling
        this.weaponScrollY = 0;
        this.maxWeaponScroll = 0; // calculated in getLayout

        // Animation
        this.animationProgress = 0;
        this.isAnimating = true;

        this.initData();
    }

    initData() {
        const playerData = this.game.dataManager.data.player?.players;
        const phaseData = this.game.dataManager.data.phases?.phases;
        
        // Build the player list based on the heroes available in the story mode (phases)
        this.players = [];
        if (playerData && phaseData) {
            // We want to link each player to their default weapon from the phase
            const uniqueHeroes = new Set();
            phaseData.forEach(phase => {
                if (phase.player_id && playerData[phase.player_id] && !uniqueHeroes.has(phase.player_id)) {
                    uniqueHeroes.add(phase.player_id);
                    const p = playerData[phase.player_id];
                    let default_weapon = phase.default_weapon;
                    
                    // Determine the visual path
                    let visualPath = null;
                    if (p.visuals?.animations?.idle?.frames) {
                        visualPath = p.visuals.animations.idle.frames[0];
                    } else if (p.visuals?.animations?.idle?.down?.frames) {
                        visualPath = p.visuals.animations.idle.down.frames[0];
                    } else if (p.visuals?.animations?.idle?.right?.frames) {
                        visualPath = p.visuals.animations.idle.right.frames[0];
                    }

                    this.players.push({
                        id: phase.player_id,
                        name: p.name || phase.player_id,
                        default_weapon: default_weapon,
                        phase_name: phase.name,
                        visualPath: visualPath,
                        background_image: phase.background_image,
                        ...p
                    });
                }
            });
        }

        const weaponData = this.game.dataManager.data.weapons?.weapons;
        if (weaponData) {
            this.weapons = weaponData.sort((a,b) => a.name.localeCompare(b.name));
        }
    }

    reset() {
        this.animationProgress = 0;
        this.isAnimating = true;
        this.selectedWeapons.clear();
        this.hoveredItem = null;
        this.hoveredWeaponParam = null;
    }

    handleWheel(deltaY) {
        const layout = this.getLayout();
        const visibleHeight = layout.pnlArsenal.h - 90;
        const maxScroll = Math.max(0, this.maxWeaponScroll - visibleHeight);
        this.weaponScrollY -= deltaY;
        this.weaponScrollY = Math.max(-maxScroll, Math.min(0, this.weaponScrollY));
    }

    update(deltaTime, mouseX, mouseY) {
        if (this.isAnimating) {
            this.animationProgress += deltaTime / 400;
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
            }
        }

        this.hoveredItem = null;
        this.hoveredWeaponParam = null;

        const layout = this.getLayout();

        // Check Back Button
        if (this.isInside(mouseX, mouseY, layout.backBtn)) this.hoveredItem = 'back';
        
        // Check Start Button
        if (this.isInside(mouseX, mouseY, layout.pnlStart)) this.hoveredItem = 'start';

        // Check Player Nav
        if (this.isInside(mouseX, mouseY, layout.playerPrev)) this.hoveredItem = 'playerPrev';
        if (this.isInside(mouseX, mouseY, layout.playerNext)) this.hoveredItem = 'playerNext';

        // Base weapon hover
        const player = this.players[this.currentPlayerIndex];
        if (this.isInside(mouseX, mouseY, layout.baseWeaponInfoBtn)) {
            this.hoveredItem = 'baseWeaponInfo';
            const wp = this.game.dataManager.data.weapons?.weapons?.find(w => w.id === player?.default_weapon);
            if (wp) this.hoveredWeaponParam = wp;
        } else if (this.isInside(mouseX, mouseY, layout.baseWeaponRect)) {
            this.hoveredItem = 'baseWeaponRow';
            const wp = this.game.dataManager.data.weapons?.weapons?.find(w => w.id === player?.default_weapon);
            if (wp) this.hoveredWeaponParam = wp;
        }

        // Check Difficulties
        layout.diffRects.forEach(dr => {
            if (this.isInside(mouseX, mouseY, dr.rect)) this.hoveredItem = 'diff_' + dr.id;
        });

        // Check Weapons
        if (this.isInside(mouseX, mouseY, { x: layout.pnlArsenal.x, y: layout.pnlArsenal.y + 80, w: layout.pnlArsenal.w, h: layout.pnlArsenal.h - 90 })) {
            layout.weaponRects.forEach(wr => {
                // Info icon hover
                if (this.isInside(mouseX, mouseY, wr.infoRect)) {
                    this.hoveredItem = 'info_' + wr.weapon.id;
                    this.hoveredWeaponParam = wr.weapon;
                } else if (this.isInside(mouseX, mouseY, wr.rect)) {
                    // Row hover
                    this.hoveredItem = 'weapon_' + wr.weapon.id;
                    this.hoveredWeaponParam = wr.weapon; // Also populate the detailed side
                }
            });
        }
    }

    handleClick(mouseX, mouseY) {
        if (this.isAnimating) return null;

        switch (this.hoveredItem) {
            case 'back':
                return { action: 'back' };
            
            case 'start':
                if (this.selectedWeapons.size === 5) {
                    const player = this.players[this.currentPlayerIndex];
                    return {
                        action: 'start',
                        config: {
                            playerId: player.id,
                            weapons: Array.from(this.selectedWeapons),
                            difficulty: this.difficulty,
                            background_image: player.background_image
                        }
                    };
                }
                break;

            case 'playerPrev':
                this.currentPlayerIndex = (this.currentPlayerIndex - 1 + this.players.length) % this.players.length;
                this._validateSelection();
                break;

            case 'playerNext':
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
                this._validateSelection();
                break;
        }

        if (this.hoveredItem?.startsWith('diff_')) {
            this.difficulty = this.hoveredItem.split('_')[1];
        }

        if (this.hoveredItem?.startsWith('weapon_')) {
            const wid = this.hoveredItem.substring(7); // "weapon_".length
            if (this.selectedWeapons.has(wid)) {
                this.selectedWeapons.delete(wid);
            } else {
                // If 5 are already selected, we unselect the oldest one
                if (this.selectedWeapons.size >= 5) {
                    const oldest = Array.from(this.selectedWeapons)[0];
                    this.selectedWeapons.delete(oldest);
                }
                this.selectedWeapons.add(wid);
            }
        }

        return null;
    }

    _validateSelection() {
        const player = this.players[this.currentPlayerIndex];
        // Ensure base weapon is not in selection queue when shifting characters
        if (player && player.default_weapon && this.selectedWeapons.has(player.default_weapon)) {
            this.selectedWeapons.delete(player.default_weapon);
        }
    }

    isInside(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    getLayout() {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;

        const startY = 120;
        const totalHeight = h - startY - 40;

        // X Positions
        const gap = 25;
        const col1X = 50;
        const col1W = 350;
        const col2X = col1X + col1W + gap;
        const col2W = 600;
        const col3X = col2X + col2W + gap;
        const col3W = w - col3X - 50; // 50px right margin

        // Pannels
        const pnlHero = { x: col1X, y: startY, w: col1W, h: 420 };
        const pnlDiff = { x: col1X, y: pnlHero.y + pnlHero.h + gap, w: col1W, h: totalHeight - pnlHero.h - gap };
        const pnlArsenal = { x: col2X, y: startY, w: col2W, h: totalHeight };
        const pnlDetails = { x: col3X, y: startY, w: col3W, h: totalHeight - 110 };
        const pnlStart = { x: col3X, y: pnlDetails.y + pnlDetails.h + gap, w: col3W, h: totalHeight - pnlDetails.h - gap };

        const backBtn = { x: 50, y: 30, w: 120, h: 40 };

        // Hero Content
        const playerAreaY = pnlHero.y + 40;
        const playerPrev = { x: pnlHero.x + 20, y: playerAreaY + 120 - 20, w: 40, h: 40 };
        const playerNext = { x: pnlHero.x + pnlHero.w - 60, y: playerAreaY + 120 - 20, w: 40, h: 40 };

        // Hero Base Weapon Info
        const baseWeaponRect = { x: pnlHero.x + 20, y: pnlHero.y + pnlHero.h - 90, w: pnlHero.w - 40, h: 70 };
        const baseWeaponInfoBtn = { x: baseWeaponRect.x + baseWeaponRect.w - 40, y: baseWeaponRect.y + 15, w: 30, h: 30 };

        // Diff Content
        const diffAreaY = pnlDiff.y + 40;
        const diffRects = this.difficulties.map((diff, i) => ({
            id: diff.id,
            rect: { x: pnlDiff.x + 20, y: diffAreaY + 30 + i * 50, w: pnlDiff.w - 40, h: 40 }
        }));

        // Arsenal List (1 column now)
        const weaponH = 50;
        const weaponGap = 10;
        const contentStartY = pnlArsenal.y + 80;

        const player = this.players[this.currentPlayerIndex];
        const baseWpId = player?.default_weapon;
        const filteredWeapons = this.weapons.filter(wp => wp.id !== baseWpId);

        const weaponRects = filteredWeapons.map((wp, i) => {
            const y = contentStartY + i * (weaponH + weaponGap) + this.weaponScrollY;
            const x = pnlArsenal.x + 20;
            const wRow = pnlArsenal.w - 40;
            // Info button rect at the right of the listing
            const infoRect = { x: x + wRow - 40, y: y + 10, w: 30, h: 30 };
            return {
                weapon: wp,
                rect: { x, y, w: wRow, h: weaponH },
                infoRect
            };
        });
        
        this.maxWeaponScroll = filteredWeapons.length * (weaponH + weaponGap);

        return { pnlHero, pnlDiff, pnlArsenal, pnlDetails, pnlStart, backBtn, playerPrev, playerNext, playerAreaY, diffAreaY, diffRects, weaponRects, baseWeaponRect, baseWeaponInfoBtn };
    }

    draw(ctx) {
        const layout = this.getLayout();

        const player = this.players[this.currentPlayerIndex];
        if (player && player.background_image) {
            const bgImg = this.game.dataManager.assetManager.getImage(player.background_image);
            if (bgImg) {
                this.game.drawImageCover(ctx, bgImg, this.game.logicalWidth, this.game.logicalHeight);
                ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
                ctx.fillRect(0, 0, this.game.logicalWidth, this.game.logicalHeight);
            } else {
                ctx.fillStyle = 'rgba(2, 6, 23, 1)';
                ctx.fillRect(0, 0, this.game.logicalWidth, this.game.logicalHeight);
            }
        } else {
            ctx.fillStyle = 'rgba(2, 6, 23, 1)';
            ctx.fillRect(0, 0, this.game.logicalWidth, this.game.logicalHeight);
        }

        ctx.save();
        ctx.globalAlpha = this.animationProgress;

        // Title
        ctx.fillStyle = Colors.PRIMARY;
        ctx.font = `bold 36px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.fillText('CONFIGURATION MODE INFINI', this.game.logicalWidth / 2, 60);

        this.drawBackButton(ctx, layout.backBtn);

        // Panels
        drawGlassPanel(ctx, layout.pnlHero.x, layout.pnlHero.y, layout.pnlHero.w, layout.pnlHero.h);
        drawGlassPanel(ctx, layout.pnlDiff.x, layout.pnlDiff.y, layout.pnlDiff.w, layout.pnlDiff.h);
        drawGlassPanel(ctx, layout.pnlArsenal.x, layout.pnlArsenal.y, layout.pnlArsenal.w, layout.pnlArsenal.h);
        drawGlassPanel(ctx, layout.pnlDetails.x, layout.pnlDetails.y, layout.pnlDetails.w, layout.pnlDetails.h);

        this.drawHeroPanel(ctx, layout);
        this.drawDiffPanel(ctx, layout);
        this.drawArsenalPanel(ctx, layout);
        this.drawDetailsPanel(ctx, layout);
        this.drawStartPanel(ctx, layout);

        ctx.restore();
    }

    drawBackButton(ctx, rect) {
        const isHovered = this.hoveredItem === 'back';
        ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        this.roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 5);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold 16px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← RETOUR', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }

    drawHeroPanel(ctx, layout) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold 22px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.fillText('HÉROS / PHASE', layout.pnlHero.x + layout.pnlHero.w / 2, layout.playerAreaY);

        const player = this.players[this.currentPlayerIndex];
        if (player) {
            const cx = layout.pnlHero.x + layout.pnlHero.w / 2;
            const cy = layout.playerAreaY + 120;
            
            // Draw player visual
            const baseVisual = player.visualPath ? this.game.dataManager.assetManager.getImage(player.visualPath) : null;
            if (baseVisual) {
                const s = 120 / Math.max(baseVisual.width, baseVisual.height);
                ctx.drawImage(baseVisual, cx - (baseVisual.width*s)/2, cy - (baseVisual.height*s)/2 - 20, baseVisual.width*s, baseVisual.height*s);
            } else {
                ctx.fillStyle = player.color || '#fff';
                ctx.beginPath();
                ctx.arc(cx, cy - 20, 40, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = Colors.PRIMARY;
            ctx.font = `bold 26px ${Typography.FONT_PRIMARY}`;
            ctx.fillText(player.name || player.id, cx, cy + 60);

            if (player.phase_name) {
                ctx.fillStyle = '#aaa';
                ctx.font = `italic 14px ${Typography.FONT_PRIMARY}`;
                ctx.fillText(`(Phase: ${player.phase_name})`, cx, cy + 85);
            }

            // Stats
            ctx.fillStyle = '#fff';
            ctx.font = `14px ${Typography.FONT_PRIMARY}`;
            const stats1 = `PV: ${player.maxHp || player.hp || '-'}  •  Vitesse: ${player.speed || '-'}`;
            ctx.fillText(stats1, cx, cy + 110);

            // Base Weapon
            ctx.fillStyle = '#aaa';
            ctx.font = `14px ${Typography.FONT_PRIMARY}`;
            ctx.fillText('ARME DE BASE', cx, layout.baseWeaponRect.y - 10);

            const isHovered = this.hoveredItem === 'baseWeaponRow';
            const isInfoHovered = this.hoveredItem === 'baseWeaponInfo';

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.roundRectPath(ctx, layout.baseWeaponRect.x, layout.baseWeaponRect.y, layout.baseWeaponRect.w, layout.baseWeaponRect.h, 5);
            ctx.fill();
            ctx.strokeStyle = isHovered ? Colors.PRIMARY : 'rgba(255,255,255,0.1)';
            ctx.stroke();

            const baseWpId = player.default_weapon;
            const baseWpData = this.game.dataManager.data.weapons?.weapons?.find(w => w.id === baseWpId);
            
            ctx.fillStyle = '#fff';
            ctx.font = `bold 16px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'left';
            ctx.fillText(baseWpData ? baseWpData.name : baseWpId, layout.baseWeaponRect.x + 20, layout.baseWeaponRect.y + 35);

            // Info button
            ctx.fillStyle = isInfoHovered ? Colors.PRIMARY : 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(layout.baseWeaponInfoBtn.x + 15, layout.baseWeaponInfoBtn.y + 15, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold 14px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.fillText('i', layout.baseWeaponInfoBtn.x + 15, layout.baseWeaponInfoBtn.y + 20);
        }

        // Arrows
        this.drawArrowBtn(ctx, layout.playerPrev, '<', this.hoveredItem === 'playerPrev');
        this.drawArrowBtn(ctx, layout.playerNext, '>', this.hoveredItem === 'playerNext');
    }

    drawDiffPanel(ctx, layout) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold 22px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.fillText('DIFFICULTÉ', layout.pnlDiff.x + layout.pnlDiff.w / 2, layout.diffAreaY);

        layout.diffRects.forEach(dr => {
            const isHovered = this.hoveredItem === 'diff_' + dr.id;
            const isSelected = this.difficulty === dr.id;
            const diffData = this.difficulties.find(d => d.id === dr.id);

            ctx.fillStyle = isSelected ? diffData.color : (isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)');
            this.roundRectPath(ctx, dr.rect.x, dr.rect.y, dr.rect.w, dr.rect.h, 5);
            ctx.fill();

            if (isSelected) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.fillStyle = isSelected ? '#fff' : diffData.color;
            ctx.font = `bold 18px ${Typography.FONT_PRIMARY}`;
            ctx.fillText(diffData.label + ` (Score x${diffData.multiplier})`, dr.rect.x + dr.rect.w / 2, dr.rect.y + dr.rect.h / 2);
        });
    }

    drawArsenalPanel(ctx, layout) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold 24px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'left';
        ctx.fillText(`ARSENAL (${this.selectedWeapons.size}/5)`, layout.pnlArsenal.x + 20, layout.pnlArsenal.y + 40);
        ctx.font = `14px ${Typography.FONT_PRIMARY}`;
        ctx.fillStyle = Colors.TEXT_MUTED;
        ctx.fillText('Cochez vos armes secondaires', layout.pnlArsenal.x + 20, layout.pnlArsenal.y + 65);

        // Clip area for weapons list
        ctx.save();
        ctx.beginPath();
        ctx.rect(layout.pnlArsenal.x, layout.pnlArsenal.y + 80, layout.pnlArsenal.w, layout.pnlArsenal.h - 90);
        ctx.clip();

        layout.weaponRects.forEach(wr => {
            const isSelected = this.selectedWeapons.has(wr.weapon.id);
            const isHovered = this.hoveredItem === 'weapon_' + wr.weapon.id;
            const isInfoHovered = this.hoveredItem === 'info_' + wr.weapon.id;
            
            // Row background
            ctx.fillStyle = isSelected ? 'rgba(16, 185, 129, 0.2)' : (isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)');
            this.roundRectPath(ctx, wr.rect.x, wr.rect.y, wr.rect.w, wr.rect.h, 5);
            ctx.fill();
            
            ctx.strokeStyle = isSelected ? Colors.SUCCESS : (isHovered ? Colors.PRIMARY : 'rgba(255,255,255,0.1)');
            ctx.lineWidth = 1;
            ctx.stroke();

            // Checkbox visual (left side)
            ctx.strokeStyle = isSelected ? Colors.SUCCESS : 'rgba(255,255,255,0.5)';
            ctx.fillStyle = isSelected ? Colors.SUCCESS : 'transparent';
            this.roundRectPath(ctx, wr.rect.x + 15, wr.rect.y + 15, 20, 20, 3);
            ctx.fill();
            ctx.stroke();
            if (isSelected) {
                ctx.fillStyle = '#111';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('✓', wr.rect.x + 25, wr.rect.y + 30);
            }

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = `bold 18px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'left';
            let name = wr.weapon.name || wr.weapon.id;
            ctx.fillText(name, wr.rect.x + 50, wr.rect.y + 32);

            // Info button
            ctx.fillStyle = isInfoHovered ? Colors.PRIMARY : 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(wr.infoRect.x + 15, wr.infoRect.y + 15, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold 14px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.fillText('i', wr.infoRect.x + 15, wr.infoRect.y + 20);
        });

        // Scrollbar track
        const visibleHeight = layout.pnlArsenal.h - 90;
        if (this.maxWeaponScroll > visibleHeight) {
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            const trackX = layout.pnlArsenal.x + layout.pnlArsenal.w - 10;
            const trackY = layout.pnlArsenal.y + 80;
            const trackH = visibleHeight;
            this.roundRectPath(ctx, trackX, trackY, 6, trackH, 3);
            ctx.fill();
            
            // Thumb
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            const contentHeight = this.maxWeaponScroll;
            const thumbH = Math.max(20, (visibleHeight / contentHeight) * visibleHeight);
            const scrollRatio = Math.abs(this.weaponScrollY) / (contentHeight - visibleHeight + 30);
            const thumbY = trackY + scrollRatio * (trackH - thumbH);
            this.roundRectPath(ctx, trackX, thumbY, 6, thumbH, 3);
            ctx.fill();
        }

        ctx.restore(); // Restore clip
    }

    drawDetailsPanel(ctx, layout) {
        const px = layout.pnlDetails.x;
        const py = layout.pnlDetails.y;
        
        ctx.fillStyle = '#fff';
        ctx.font = `bold 24px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'left';
        ctx.fillText('DÉTAILS DE L\'ARME', px + 20, py + 40);
        
        const wp = this.hoveredWeaponParam;
        
        if (!wp) {
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = `italic 16px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.fillText('Survolez une arme pour voir ses détails', px + layout.pnlDetails.w / 2, py + layout.pnlDetails.h / 2);
            return;
        }
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 20, py + 60);
        ctx.lineTo(px + layout.pnlDetails.w - 20, py + 60);
        ctx.stroke();

        // Build arrays for dynamic rendering
        const effects = [];
        if (wp.stats?.isPoisonous) effects.push('Poison');
        if (wp.stats?.isSlowing) effects.push('Ralentissement');
        if (wp.stats?.isExplosive) effects.push('Explosif');
        
        const hasEffects = effects.length > 0;
        const hasUpgrades = wp.upgrades && wp.upgrades.length > 0;
        const upgradesCount = hasUpgrades ? wp.upgrades.length : 0;
        
        // Header
        ctx.fillStyle = Colors.PRIMARY;
        ctx.font = `bold 24px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'left';
        ctx.fillText(wp.name || wp.id, px + 20, py + 100);
        ctx.fillStyle = '#ccc';
        ctx.font = `italic 16px ${Typography.FONT_PRIMARY}`;
        ctx.fillText(wp.type || 'Standard', px + 20, py + 125);

        // Stats
        ctx.fillStyle = '#fff';
        ctx.font = `16px ${Typography.FONT_PRIMARY}`;
        const dmg = wp.stats?.damage || 'N/A';
        const cadence = wp.stats?.fireRate ? (wp.stats.fireRate / 1000).toFixed(2) + 's' : 'N/A';
        const speed = wp.stats?.projectileSpeed || 'N/A';
        ctx.fillText(`⚔ Dégâts: ${dmg}`, px + 20, py + 160);
        ctx.fillText(`⏱ Cadence: ${cadence}`, px + 20, py + 185);
        ctx.fillText(`🏹 Vitesse proj.: ${speed}`, px + 20, py + 210);

        // Desc
        ctx.fillStyle = '#aaa';
        ctx.font = `14px ${Typography.FONT_PRIMARY}`;
        this.wrapText(ctx, wp.description || "Aucune description", px + 20, py + 245, layout.pnlDetails.w - 40, 20);

        let currentY = py + 290;
        
        // Effects
        if (hasEffects) {
            ctx.fillStyle = Colors.WARNING || '#F59E0B';
            ctx.font = `bold 14px ${Typography.FONT_PRIMARY}`;
            ctx.fillText('Effets: ' + effects.join(', '), px + 20, currentY);
            currentY += 40;
        }

        if (hasUpgrades) {
            ctx.fillStyle = Colors.SUCCESS || '#10B981';
            ctx.font = `bold 16px ${Typography.FONT_PRIMARY}`;
            ctx.fillText(`Améliorations (${upgradesCount}) :`, px + 20, currentY);
            currentY += 30;
            
            ctx.fillStyle = '#ddd';
            ctx.font = `14px ${Typography.FONT_PRIMARY}`;
            wp.upgrades.forEach(upg => {
                const previewText = upg.preview ? ` - ${upg.preview}` : '';
                ctx.fillText(`• ${upg.name}${previewText}`, px + 30, currentY);
                currentY += 22;
            });
        }
    }

    drawStartPanel(ctx, layout) {
        const startHover = this.hoveredItem === 'start';
        const startDisabled = this.selectedWeapons.size < 5;
        
        ctx.fillStyle = startDisabled ? 'rgba(50,50,50,0.8)' : (startHover ? Colors.SUCCESS : 'rgba(16, 185, 129, 0.8)');
        this.roundRectPath(ctx, layout.pnlStart.x, layout.pnlStart.y, layout.pnlStart.w, layout.pnlStart.h, 8);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = `bold 28px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.fillText(startDisabled ? `SÉLECTIONNEZ 5 ARMES` : 'LANCER LA PARTIE', layout.pnlStart.x + layout.pnlStart.w / 2, layout.pnlStart.y + layout.pnlStart.h / 2 + 10);
    }

    // Wrap text utility
    wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }

    drawArrowBtn(ctx, rect, text, isHover) {
        ctx.fillStyle = isHover ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
        this.roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `bold 20px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, rect.x + rect.w/2, rect.y + rect.h/2);
    }

    roundRectPath(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
