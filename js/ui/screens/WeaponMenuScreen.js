/**
 * WeaponMenuScreen
 * EVG Anthony - Survivor Edition
 * 
 * Weapon selection screen with improved readability.
 * Larger fonts and better visual hierarchy.
 */

import {
    Colors,
    Typography,
    Spacing,
    Effects,
    drawGlassPanel,
    drawTextWithOutline,
    easeOutElastic
} from '../UIManager.js';

export class WeaponMenuScreen {
    constructor(game) {
        this.game = game;
        this.hoveredCard = null;
        this.animationProgress = 0;
        this.isAnimating = true;
    }

    reset() {
        this.animationProgress = 0;
        this.isAnimating = true;
        this.hoveredCard = null;
    }

    update(deltaTime, mouseX, mouseY) {
        if (this.isAnimating) {
            this.animationProgress += deltaTime / 350;
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
            }
        }
        if (!this.isAnimating) {
            this.updateHover(mouseX, mouseY);
        }
    }

    updateHover(mouseX, mouseY) {
        const options = this.game.upgradeOptions;
        if (!options || options.length === 0) return;

        const layout = this.calculateLayout();
        this.hoveredCard = null;

        options.forEach((opt, i) => {
            const x = layout.startX + i * (layout.cardWidth + layout.gap);
            const y = layout.cardY;

            if (mouseX >= x && mouseX <= x + layout.cardWidth &&
                mouseY >= y && mouseY <= y + layout.cardHeight) {
                this.hoveredCard = i;
            }
        });
    }

    handleClick(mouseX, mouseY) {
        if (this.isAnimating) return null;

        const options = this.game.upgradeOptions;
        if (!options || options.length === 0) return null;

        const layout = this.calculateLayout();

        for (let i = 0; i < options.length; i++) {
            const x = layout.startX + i * (layout.cardWidth + layout.gap);
            const y = layout.cardY;

            if (mouseX >= x && mouseX <= x + layout.cardWidth &&
                mouseY >= y && mouseY <= y + layout.cardHeight) {
                return options[i];
            }
        }
        return null;
    }

    calculateLayout() {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;
        const options = this.game.upgradeOptions || [];
        const numCards = Math.max(options.length, 1);

        // Cartes plus grandes pour meilleure lisibilité
        const cardWidth = 290;
        const cardHeight = 320;
        const gap = 40;

        const totalWidth = numCards * cardWidth + (numCards - 1) * gap;
        const startX = (w - totalWidth) / 2;
        const cardY = (h - cardHeight) / 2 + 25;

        return { cardWidth, cardHeight, gap, startX, cardY, w, h, numCards };
    }

    draw(ctx) {
        const options = this.game.upgradeOptions;
        if (!options || options.length === 0) return;

        const layout = this.calculateLayout();
        const { w, h } = layout;

        // Overlay sombre
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        // Titre
        this.drawTitle(ctx, w);

        // Cartes
        this.drawCards(ctx, options, layout);

        // Hint
        this.drawKeyboardHint(ctx, w, h);
    }

    drawTitle(ctx, w) {
        const titleY = 50;
        const titleAlpha = Math.min(1, this.animationProgress * 2);

        ctx.globalAlpha = titleAlpha;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = Colors.PRIMARY;
        ctx.font = `bold 42px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.strokeText('NOUVELLE ARME', w / 2, titleY);
        ctx.fillText('NOUVELLE ARME', w / 2, titleY);

        ctx.restore();

        // Ligne décorative
        const lineY = titleY + 35;
        ctx.strokeStyle = Colors.PRIMARY;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 150, lineY);
        ctx.lineTo(w / 2 + 150, lineY);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }

    drawCards(ctx, options, layout) {
        const { cardWidth, cardHeight, gap, startX, cardY } = layout;

        options.forEach((opt, i) => {
            const cardDelay = i * 0.12;
            const cardProgress = Math.max(0, Math.min(1, (this.animationProgress - cardDelay) / 0.6));
            const animatedY = cardY + (1 - easeOutElastic(cardProgress)) * 80;

            ctx.globalAlpha = cardProgress;

            const x = startX + i * (cardWidth + gap);
            const isHovered = this.hoveredCard === i;
            const isUpgrade = opt.type === 'upgrade';
            const borderColor = isUpgrade ? Colors.ACCENT : Colors.PRIMARY;

            this.drawSingleCard(ctx, x, animatedY, cardWidth, cardHeight, opt, isHovered, borderColor, isUpgrade, i + 1);
        });

        ctx.globalAlpha = 1;
    }

    drawSingleCard(ctx, x, y, width, height, data, isHovered, borderColor, isUpgrade, cardNum) {
        ctx.save();

        const padding = 22;

        // === BADGE AU-DESSUS DE LA CARTE ===
        const badgeY = y - 20;
        const badgeText = isUpgrade ? '⬆ AMÉLIORATION' : '★ NOUVEAU';

        ctx.font = `bold 13px ${Typography.FONT_PRIMARY}`;
        const badgeWidth = ctx.measureText(badgeText).width + 24;

        ctx.fillStyle = this.hexToRgba(borderColor, 0.3);
        this.roundRectPath(ctx, x + width / 2 - badgeWidth / 2, badgeY - 12, badgeWidth, 26, 13);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = borderColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, x + width / 2, badgeY + 1);

        // === CARTE ===
        if (isHovered) {
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = 30;
        }

        // Fond de carte
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        this.roundRectPath(ctx, x, y, width, height, 14);
        ctx.fill();

        // Bordure
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // === TITRE (plus gros, taille adaptée) ===
        const titleY = y + 45;
        ctx.fillStyle = Colors.TEXT_PRIMARY;
        let titleSize = 22;
        ctx.font = `bold ${titleSize}px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';

        let title = data.name || 'Arme';
        const maxTitleWidth = width - padding * 2;

        // Réduction dynamique si trop long avant de tronquer
        while (ctx.measureText(title).width > maxTitleWidth && titleSize > 16) {
            titleSize--;
            ctx.font = `bold ${titleSize}px ${Typography.FONT_PRIMARY}`;
        }

        if (ctx.measureText(title).width > maxTitleWidth) {
            while (ctx.measureText(title + '...').width > maxTitleWidth && title.length > 0) {
                title = title.slice(0, -1);
            }
            title += '...';
        }
        ctx.fillText(title, x + width / 2, titleY);

        // === DESCRIPTION (plus lisible, descendue un peu) ===
        const descY = titleY + 40;
        ctx.fillStyle = Colors.TEXT_SECONDARY;
        ctx.font = `16px ${Typography.FONT_PRIMARY}`;

        const desc = data.description || 'Pas de description disponible.';
        this.wrapText(ctx, desc, x + width / 2, descY, width - padding * 2, 22, 3);

        // === STATS (remontées pour combler l'espace) ===
        const statsLineY = y + 185;

        if (isUpgrade) {
            const upgradeInfo = this.getUpgradeInfo(data);
            ctx.fillStyle = Colors.ACCENT;
            ctx.font = `bold 18px ${Typography.FONT_MONO}`;
            ctx.textAlign = 'left';
            ctx.fillText(upgradeInfo, x + padding, statsLineY);
        } else {
            const previewData = this.getWeaponPreview(data);

            if (typeof previewData === 'string') {
                ctx.fillStyle = Colors.PRIMARY;
                ctx.font = `bold 18px ${Typography.FONT_MONO}`;
                ctx.textAlign = 'left';
                ctx.fillText(previewData, x + padding, statsLineY);
            } else {
                // === Ergonomie : Type à gauche ===
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.font = `bold 13px ${Typography.FONT_MONO}`;
                ctx.fillStyle = Colors.PRIMARY;
                ctx.fillText(previewData.typeLabel, x + padding + 10, statsLineY - 10);

                // === Stats en grille (mini-tableau) ===
                const stats = previewData.stats;
                const gridY = statsLineY + 12;
                const colWidth = (width - padding * 2) / 2;

                stats.forEach((stat, idx) => {
                    const col = idx % 2;
                    const row = Math.floor(idx / 2);
                    const drawX = x + padding + col * colWidth + (col === 0 ? 10 : 0);
                    const drawY = gridY + row * 16;

                    ctx.textAlign = 'left';
                    ctx.font = `10px ${Typography.FONT_PRIMARY}`;
                    ctx.fillStyle = Colors.TEXT_MUTED;
                    ctx.fillText(stat.label, drawX, drawY);

                    ctx.textAlign = 'right';
                    ctx.font = `bold 11px ${Typography.FONT_MONO}`;
                    ctx.fillStyle = Colors.TEXT_PRIMARY;
                    ctx.fillText(stat.value.toString(), drawX + colWidth - 20, drawY);
                });
            }
        }

        // === SCHÉMA D'ÉVOLUTION (plus gros nœuds, descendu au fond) ===
        if (isUpgrade) {
            this.drawEvolutionNodes(ctx, x, y + height - 85, width, data, borderColor);
        }

        // === NUMÉRO DE CARTE ===
        const numY = y + height + 28;
        const numSize = isHovered ? 28 : 24;

        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.beginPath();
        ctx.arc(x + width / 2, numY, numSize / 2 + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isHovered ? Colors.TEXT_PRIMARY : borderColor;
        ctx.font = `bold ${numSize * 0.7}px ${Typography.FONT_MONO}`;
        ctx.textBaseline = 'middle';
        ctx.fillText(cardNum.toString(), x + width / 2, numY);

        ctx.restore();
    }

    getUpgradeInfo(data) {
        const weaponId = data.weaponId;
        const playerWeapon = this.game.player?.weapons?.find(w => w.id === weaponId);

        if (playerWeapon && playerWeapon.upgrades && playerWeapon.upgrades[playerWeapon.level - 1]) {
            const nextUpgrade = playerWeapon.upgrades[playerWeapon.level - 1];
            if (nextUpgrade.preview) {
                return nextUpgrade.preview;
            }
            const stats = nextUpgrade.stats || {};
            let parts = [];
            if (stats.damage) parts.push(`DMG +${stats.damage}`);
            if (stats.fireRate) parts.push(`CD ${stats.fireRate}ms`);
            if (stats.range) parts.push(`RNG +${stats.range}`);
            if (stats.projectileCount) parts.push(`+${stats.projectileCount} proj`);
            if (stats.isPoisonous) parts.push('Poison');
            if (stats.isSlowing) parts.push('Ralentit');
            return parts.join(', ') || 'Amélioration';
        }
        return 'Niveau suivant';
    }

    getWeaponPreview(data) {
        if (data.preview) return data.preview;

        const stats = data.stats || {};
        const statEntries = [];

        // Catégorie
        const categoryMap = {
            'attack': 'PROJECTILE',
            'defense': 'ORBITE',
            'aoe': 'AURA'
        };
        const typeLabel = categoryMap[data.type] || 'ARME';

        if (data.type === 'attack') {
            if (stats.damage !== undefined) statEntries.push({ label: 'DMG', value: stats.damage });
            if (stats.fireRate) statEntries.push({ label: 'CD', value: stats.fireRate + 'ms' });
            if (stats.projectileSpeed) statEntries.push({ label: 'SPD', value: stats.projectileSpeed });
            if (stats.projectileCount > 1) statEntries.push({ label: 'QTY', value: 'x' + stats.projectileCount });
            if (stats.piercingCount > 0) statEntries.push({ label: 'PIERCE', value: stats.piercingCount });
        } else if (data.type === 'defense') {
            if (stats.damage !== undefined) statEntries.push({ label: 'DMG', value: stats.damage });
            if (stats.radius) statEntries.push({ label: 'RAD', value: stats.radius });
            if (stats.orbitSpeed) statEntries.push({ label: 'ROT', value: stats.orbitSpeed });
            if (stats.projectileCount) statEntries.push({ label: 'QTY', value: 'x' + stats.projectileCount });
            if (stats.fireRate) statEntries.push({ label: 'DUR', value: stats.fireRate + 'ms' });
        } else if (data.type === 'aoe') {
            if (stats.isPoisonous) statEntries.push({ label: 'POISON', value: stats.poisonDamage || 0 });
            else if (stats.damage) statEntries.push({ label: 'DMG', value: stats.damage });

            if (stats.range) statEntries.push({ label: 'RNG', value: stats.range });
            if (stats.slowMultiplier !== undefined && stats.slowMultiplier < 1) {
                const slowPct = Math.round((1 - stats.slowMultiplier) * 100);
                statEntries.push({ label: 'SLOW', value: '-' + slowPct + '%' });
            }
        }

        return {
            typeLabel: typeLabel,
            stats: statEntries
        };
    }

    drawEvolutionNodes(ctx, x, y, width, data, borderColor) {
        const padding = 24;
        const nodeAreaWidth = width - padding * 2;

        const weaponId = data.weaponId;
        const playerWeapon = this.game.player?.weapons?.find(w => w.id === weaponId);
        const currentLevel = playerWeapon?.level || 1;
        const maxLevel = Math.min((playerWeapon?.upgrades?.length || 2) + 1, 5);

        // Nœuds plus gros
        const nodeRadius = 14;
        const nodeSpacing = nodeAreaWidth / (maxLevel + 1);
        const nodeY = y + 20;

        for (let i = 1; i <= maxLevel; i++) {
            const nodeX = x + padding + nodeSpacing * i;

            // Ligne de connexion
            if (i < maxLevel) {
                ctx.strokeStyle = i < currentLevel ? Colors.ACCENT : 'rgba(255,255,255,0.25)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(nodeX + nodeRadius, nodeY);
                ctx.lineTo(nodeX + nodeSpacing - nodeRadius, nodeY);
                ctx.stroke();
            }

            // Cercle du nœud
            if (i < currentLevel) {
                ctx.fillStyle = Colors.ACCENT;
            } else if (i === currentLevel) {
                ctx.fillStyle = borderColor;
            } else if (i === currentLevel + 1) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            }

            ctx.beginPath();
            ctx.arc(nodeX, nodeY, nodeRadius, 0, Math.PI * 2);
            ctx.fill();

            if (i === currentLevel + 1) {
                ctx.stroke();
            }

            // Numéro (plus lisible)
            ctx.fillStyle = (i <= currentLevel || i === currentLevel + 1) ? '#fff' : Colors.TEXT_MUTED;
            ctx.font = `bold 13px ${Typography.FONT_MONO}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), nodeX, nodeY);
        }
    }

    drawKeyboardHint(ctx, w, h) {
        ctx.fillStyle = Colors.TEXT_MUTED;
        ctx.font = `15px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Cliquez sur une carte pour choisir', w / 2, h - 28);
    }

    // === UTILITAIRES ===

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

    wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
        const words = text.split(' ');
        let line = '';
        let lineCount = 0;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && n > 0) {
                lineCount++;
                if (lineCount >= maxLines) {
                    line = line.trim();
                    if (line.length > 3) line = line.slice(0, -3) + '...';
                    ctx.fillText(line, x, y);
                    return;
                }
                ctx.fillText(line.trim(), x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, y);
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
