/**
 * LevelUpScreen
 * EVG Anthony - Survivor Edition
 * 
 * 3-card horizontal layout for upgrade selection.
 * Improved readability with larger fonts and clear hierarchy.
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

export class LevelUpScreen {
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
        const numCards = options.length || 3;

        // Cartes plus grandes pour lisibilité
        const cardWidth = 280;
        const cardHeight = 300;
        const gap = 40;

        const totalWidth = numCards * cardWidth + (numCards - 1) * gap;
        const startX = (w - totalWidth) / 2;
        const cardY = (h - cardHeight) / 2 + 30;

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
        this.drawTitle(ctx, w, h);

        // Cartes
        this.drawCards(ctx, options, layout);

        // Hint clavier
        this.drawKeyboardHint(ctx, w, h);
    }

    drawTitle(ctx, w, h) {
        const titleY = 50;
        const titleAlpha = Math.min(1, this.animationProgress * 2);

        ctx.globalAlpha = titleAlpha;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.fillStyle = Colors.WARNING;
        ctx.font = `bold 42px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 7;
        ctx.strokeText('AMÉLIORATION DISPONIBLE', w / 2, titleY);
        ctx.fillText('AMÉLIORATION DISPONIBLE', w / 2, titleY);

        ctx.restore();

        // Ligne décorative
        const lineY = titleY + 35;
        ctx.strokeStyle = Colors.WARNING;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 220, lineY);
        ctx.lineTo(w / 2 + 220, lineY);
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
            const borderColor = this.getCardColor(opt);

            this.drawSingleCard(ctx, x, animatedY, cardWidth, cardHeight, opt, isHovered, borderColor, i + 1);
        });

        ctx.globalAlpha = 1;
    }

    drawSingleCard(ctx, x, y, width, height, data, isHovered, borderColor, cardNum) {
        ctx.save();

        const padding = 22;

        // Glow au survol
        if (isHovered) {
            ctx.shadowColor = borderColor;
            ctx.shadowBlur = 30;
        }

        // Fond de carte
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        this.roundRectPath(ctx, x, y, width, height, 14);
        ctx.fill();

        // Bordure colorée
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // === TITRE (en haut, taille adaptée) ===
        const titleY = y + 50;
        ctx.fillStyle = Colors.TEXT_PRIMARY;
        let titleSize = 22;
        ctx.font = `bold ${titleSize}px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let title = data.name || 'Amélioration';
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

        // === DESCRIPTION (remplissage espace central) ===
        const descY = titleY + 45;
        ctx.fillStyle = Colors.TEXT_SECONDARY;
        ctx.font = `16px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';

        const desc = data.description || '';
        this.wrapText(ctx, desc, x + width / 2, descY, width - padding * 2, 22, 3);

        // === BADGE STAT (ajustement position) ===
        const statData = this.getStatDisplay(data);
        const isAutoPreview = typeof statData === 'object' && statData.stats;

        const badgeHeight = isAutoPreview ? 75 : 44;
        const badgeY = y + 155; // Remonté un peu pour le badge plus haut
        const badgeWidth = width - padding * 2;

        // Fond du badge
        ctx.fillStyle = this.hexToRgba(borderColor, 0.2);
        this.roundRectPath(ctx, x + padding, badgeY, badgeWidth, badgeHeight, 8);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (!isAutoPreview) {
            // Affichage classique (Upgrade ou Manuel)
            ctx.fillStyle = borderColor;
            ctx.font = `bold 18px ${Typography.FONT_MONO}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(statData, x + width / 2, badgeY + badgeHeight / 2);
        } else {
            // === MODE ERGONOMIQUE ÉPURÉ ===
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            const startX = x + padding + 15;
            const startY = badgeY + 14;

            // Type à gauche
            ctx.font = `bold 13px ${Typography.FONT_MONO}`;
            ctx.fillStyle = borderColor;
            ctx.fillText(statData.typeLabel, startX, startY);

            // Grille de stats (mini-tableau)
            const stats = statData.stats;
            const gridY = startY + 22;
            const colWidth = (badgeWidth - 30) / 2;

            stats.forEach((stat, idx) => {
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const drawX = startX + col * colWidth;
                const drawY = gridY + row * 16;

                ctx.textAlign = 'left';
                ctx.font = `10px ${Typography.FONT_PRIMARY}`;
                ctx.fillStyle = Colors.TEXT_MUTED;
                ctx.fillText(stat.label, drawX, drawY);

                ctx.textAlign = 'right';
                ctx.font = `bold 11px ${Typography.FONT_MONO}`;
                ctx.fillStyle = Colors.TEXT_PRIMARY;
                ctx.fillText(stat.value.toString(), drawX + colWidth - 5, drawY);
            });
        }

        // === IMPACT HINT (remonté un peu) ===
        const hintY = badgeY + badgeHeight + 15;
        const impactHint = this.getImpactHint(data);
        ctx.fillStyle = Colors.TEXT_MUTED;
        ctx.font = `italic 14px ${Typography.FONT_PRIMARY}`;
        ctx.fillText(`💡 ${impactHint}`, x + width / 2, hintY);

        // === NUMÉRO DE CARTE ===
        const numY = y + height + 28;
        const numSize = isHovered ? 28 : 24;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.beginPath();
        ctx.arc(x + width / 2, numY, numSize / 2 + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isHovered ? Colors.TEXT_PRIMARY : Colors.TEXT_SECONDARY;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isHovered ? Colors.TEXT_PRIMARY : Colors.TEXT_SECONDARY;
        ctx.font = `bold ${numSize * 0.7}px ${Typography.FONT_MONO}`;
        ctx.textBaseline = 'middle';
        ctx.fillText(cardNum.toString(), x + width / 2, numY);

        ctx.restore();
    }

    getStatDisplay(opt) {
        if (opt.preview) return opt.preview;

        // Si c'est un retrait d'arme (nouvelle arme)
        if (opt.type === 'weapon' && opt.weaponData) {
            const data = opt.weaponData;
            const stats = data.stats || {};
            const statEntries = [];

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

            const categoryMap = {
                'attack': 'PROJECTILE',
                'defense': 'ORBITE',
                'aoe': 'AURA'
            };

            return {
                typeLabel: categoryMap[data.type] || 'ARME',
                stats: statEntries
            };
        }

        if (opt.multiplier) {
            const percent = Math.round((opt.multiplier - 1) * 100);
            const sign = percent > 0 ? '+' : '';
            return `${sign}${percent}% ${this.getStatName(opt.stat)}`;
        } else if (opt.add) {
            return `+${opt.add} ${this.getStatName(opt.stat)}`;
        }
        return opt.statDisplay || 'BONUS';
    }

    getStatName(stat) {
        const names = {
            speed: 'VITESSE',
            damage: 'DÉGÂTS',
            fireRate: 'CADENCE',
            maxHp: 'HP MAX',
            pickupRadius: 'COLLECTE',
            projectileBonus: 'PROJECTILE',
            rangeMultiplier: 'PORTÉE',
            piercingBonus: 'PERÇANT'
        };
        return names[stat] || '';
    }

    getImpactHint(opt) {
        const hints = {
            speed: 'Mobilité & Esquive',
            damage: 'DPS Global',
            fireRate: 'Cadence de Tir',
            maxHp: 'Survie',
            pickupRadius: 'Collecte & XP',
            projectileBonus: 'Multi-Projectiles',
            rangeMultiplier: 'Zone d\'Effet',
            piercingBonus: 'Pénétration'
        };
        return hints[opt.stat] || 'Amélioration';
    }

    getCardColor(opt) {
        switch (opt.stat) {
            case 'speed':
            case 'fireRate':
                return Colors.PRIMARY;
            case 'damage':
            case 'projectileBonus':
            case 'piercingBonus':
                return Colors.DANGER;
            case 'maxHp':
                return Colors.ACCENT;
            case 'pickupRadius':
            case 'rangeMultiplier':
                return Colors.SECONDARY;
            default:
                return Colors.WARNING;
        }
    }

    drawKeyboardHint(ctx, w, h) {
        ctx.fillStyle = Colors.TEXT_MUTED;
        ctx.font = `15px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Cliquez sur une carte ou appuyez sur 1, 2, 3', w / 2, h - 30);
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
