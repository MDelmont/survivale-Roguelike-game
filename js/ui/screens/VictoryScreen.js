import { Colors, Typography, Spacing, Effects } from '../UIManager.js';

/**
 * VictoryScreen Class
 * Gère l'affichage du récapitulatif de fin de partie après une victoire.
 */
export class VictoryScreen {
    constructor(game) {
        this.game = game;
        this.animationProgress = 0;
        this.isAnimating = true;
        this.stats = null;
    }

    reset() {
        this.animationProgress = 0;
        this.isAnimating = true;

        // Capturer les stats à la victoire
        if (this.game.player) {
            this.stats = {
                kills: this.game.killCount,
                level: this.game.player.stats.level,
                time: this.game.phaseTimer, // Temps de la dernière phase ou temps total ? On part sur la phase
                weapons: this.game.player.weapons.map(w => ({
                    name: w.name,
                    level: w.level,
                    id: w.id
                })),
                playerStats: {
                    damage: Math.round(this.game.player.stats.damage * 10) / 10,
                    speed: Math.round(this.game.player.stats.speed * 10) / 10,
                    hp: Math.round(this.game.player.stats.maxHp),
                    pickup: Math.round(this.game.player.stats.pickupRadius)
                },
                appliedUpgrades: this.game.player.stats.appliedUpgrades ? [...this.game.player.stats.appliedUpgrades] : []
            };
        }
    }

    update(deltaTime) {
        if (this.isAnimating) {
            this.animationProgress += deltaTime / Effects.TRANSITION_SLOW;
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
            }
        }
    }

    draw(ctx) {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;
        const alpha = Math.min(1, this.animationProgress * 1.5);

        // 1. Fond
        ctx.save();
        ctx.globalAlpha = alpha;

        const config = this.game.dataManager.data.phases;
        if (config && config.victory_background && this.game.dataManager.assetManager.isLoaded(config.victory_background)) {
            const img = this.game.dataManager.assetManager.getImage(config.victory_background);
            this.game.drawImageCover(ctx, img, w, h);

            // Overlay sombre pour la lisibilité
            ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
            ctx.fillRect(0, 0, w, h);
        } else {
            // Dégradé sombre par défaut
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#020617');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }

        // 2. Titre "VICTOIRE !"
        const titleY = 100 * this.animationProgress;
        ctx.fillStyle = Colors.ACCENT;
        ctx.shadowColor = Colors.ACCENT;
        ctx.shadowBlur = Effects.GLOW_MD;
        ctx.font = `bold 80px ${Typography.FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.fillText('VICTOIRE !', w / 2, titleY);
        ctx.shadowBlur = 0;

        if (this.animationProgress > 0.3) {
            this.drawRecap(ctx, w, h);
        }

        // 3. Bouton Rejouer
        if (this.animationProgress > 0.8) {
            const btnY = h - 100;
            ctx.fillStyle = Colors.TEXT_PRIMARY;
            ctx.font = `bold 22px ${Typography.FONT_PRIMARY}`;
            ctx.textAlign = 'center';
            ctx.fillText('CLIQUEZ POUR RECOMMENCER', w / 2, btnY);
        }

        ctx.restore();
    }

    drawRecap(ctx, w, h) {
        if (!this.stats) return;

        const padding = Spacing.XL;
        const cardAlpha = Math.max(0, (this.animationProgress - 0.3) * 1.5);
        ctx.globalAlpha = cardAlpha;

        // Layout de la grille de recap
        const margin = Spacing.XXL; // Marge plus grande sur les bords (48px)
        const colW = (w - margin * 4) / 3;
        const rowH = 400; // Hauteur légèrement augmentée
        const startY = (h - rowH) / 2 + 20; // Centrage vertical dynamique

        // --- CARTE 1 : RÉSUMÉ & STATS JOUEUR ---
        this.drawRecapCard(ctx, margin, startY, colW, rowH, 'RÉSUMÉ GÉNERAL', Colors.PRIMARY);
        const card1X = margin + 40;
        const innerW = colW - 80;

        this.drawStatLine(ctx, card1X, startY + 85, 'Ennemis vaincus', this.stats.kills, '💀', innerW);
        this.drawStatLine(ctx, card1X, startY + 125, 'Niveau final', this.stats.level, '⭐', innerW);

        ctx.fillStyle = Colors.TEXT_MUTED;
        ctx.font = `bold 13px ${Typography.FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.fillText('STATS DU PERSONNAGE', margin + colW / 2, startY + 185);

        const pStats = this.stats.playerStats;
        const statsY = startY + 225;
        this.drawStatLine(ctx, card1X, statsY, 'Dégâts', pStats.damage, '⚔️', innerW);
        this.drawStatLine(ctx, card1X, statsY + 40, 'Vitesse', pStats.speed, '🏃', innerW);
        this.drawStatLine(ctx, card1X, statsY + 80, 'Santé Max', pStats.hp, '❤️', innerW);
        this.drawStatLine(ctx, card1X, statsY + 120, 'Portée Collecte', pStats.pickup, '🧲', innerW);

        // --- CARTE 2 : ARSENAL (Armes) ---
        this.drawRecapCard(ctx, margin * 2 + colW, startY, colW, rowH, 'ARSENAL FINAL', Colors.SECONDARY);
        this.stats.weapons.forEach((weapon, i) => {
            const y = startY + 85 + i * 50;
            this.drawWeaponItem(ctx, margin * 2 + colW + 25, y, colW - 50, weapon);
        });

        // --- CARTE 3 : AMÉLIORATIONS (Stat Buffs) ---
        this.drawRecapCard(ctx, margin * 3 + colW * 2, startY, colW, rowH, 'AMÉLIORATIONS', Colors.WARNING);

        // Groupement des améliorations par nom/id
        const groupedMap = new Map();
        (this.stats.appliedUpgrades || []).forEach(upg => {
            const key = upg.id || upg.name;
            if (!groupedMap.has(key)) {
                groupedMap.set(key, { ...upg, count: 1 });
            } else {
                const existing = groupedMap.get(key);
                existing.count++;
                if (upg.add) existing.add = (existing.add || 0) + upg.add;
                if (upg.multiplier) existing.multiplier = (existing.multiplier || 1) * upg.multiplier;
            }
        });

        const groupedUpgrades = Array.from(groupedMap.values());
        const maxVisible = 6;
        const visibleUpgrades = groupedUpgrades.slice(0, maxVisible);

        if (visibleUpgrades.length === 0) {
            ctx.textAlign = 'center';
            ctx.fillStyle = Colors.TEXT_MUTED;
            ctx.font = `italic 14px ${Typography.FONT_PRIMARY}`;
            ctx.fillText('Aucune amélioration', margin * 3 + colW * 2 + colW / 2, startY + rowH / 2);
        } else {
            visibleUpgrades.forEach((upg, i) => {
                const y = startY + 85 + i * 45;
                this.drawUpgradeItem(ctx, margin * 3 + colW * 2 + 25, y, colW - 50, upg);
            });

            if (groupedUpgrades.length > maxVisible) {
                ctx.textAlign = 'center';
                ctx.fillStyle = Colors.TEXT_MUTED;
                ctx.font = `11px ${Typography.FONT_PRIMARY}`;
                ctx.fillText(`+ ${groupedUpgrades.length - maxVisible} autres types de bonus`, margin * 3 + colW * 2 + colW / 2, startY + rowH - 25);
            }
        }
    }

    drawUpgradeItem(ctx, x, y, width, upgrade) {
        const itemH = 32;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
        this.roundRectPath(ctx, x, y, width, itemH, 6);
        ctx.fill();

        ctx.textBaseline = 'middle';
        const centerY = y + itemH / 2;

        ctx.textAlign = 'left';
        ctx.font = `12px ${Typography.FONT_PRIMARY}`;
        ctx.fillStyle = Colors.TEXT_SECONDARY;
        let displayName = upgrade.name;
        if (upgrade.count > 1) displayName += ` (x${upgrade.count})`;
        ctx.fillText(displayName, x + 8, centerY);

        ctx.textAlign = 'right';
        ctx.font = `bold 12px ${Typography.FONT_MONO}`;
        ctx.fillStyle = Colors.WARNING;
        let valStr = '';
        if (upgrade.multiplier) {
            const m = Math.round(upgrade.multiplier * 100) / 100;
            valStr = `x${m}`;
        } else if (upgrade.add) {
            valStr = `+${Math.round(upgrade.add * 10) / 10}`;
        }
        ctx.fillText(valStr, x + width - 8, centerY);

        ctx.textBaseline = 'alphabetic'; // Reset
    }

    drawRecapCard(ctx, x, y, width, height, title, color) {
        // Fond
        ctx.fillStyle = Colors.GLASS_BG;
        this.roundRectPath(ctx, x, y, width, height, Effects.BORDER_RADIUS_LG);
        ctx.fill();

        // Bordure
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Header dégradé
        const grad = ctx.createLinearGradient(x, y, x, y + 40);
        grad.addColorStop(0, hexToRgba(color, 0.3));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        this.roundRectPath(ctx, x, y, width, 50, { tl: 16, tr: 16, bl: 0, br: 0 });
        ctx.fill();

        // Titre
        ctx.fillStyle = color;
        ctx.font = `bold 14px ${Typography.FONT_DISPLAY}`;
        ctx.textAlign = 'center';
        ctx.fillText(title, x + width / 2, y + 32);
    }

    drawStatLine(ctx, x, y, label, value, icon, width = 200) {
        ctx.textAlign = 'left';
        ctx.font = `14px ${Typography.FONT_PRIMARY}`;
        ctx.fillStyle = Colors.TEXT_SECONDARY;
        ctx.fillText(`${icon} ${label}`, x, y);

        ctx.textAlign = 'right';
        ctx.font = `bold 16px ${Typography.FONT_MONO}`;
        ctx.fillStyle = Colors.TEXT_PRIMARY;
        const displayValue = (value !== undefined && value !== null) ? (Math.round(value * 10) / 10).toString() : '0';
        ctx.fillText(displayValue, x + width, y);
    }


    drawWeaponItem(ctx, x, y, width, weapon) {
        const itemH = 35;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.roundRectPath(ctx, x, y, width, itemH, 6);
        ctx.fill();

        ctx.textBaseline = 'middle';
        const centerY = y + itemH / 2;

        ctx.textAlign = 'left';
        ctx.font = `bold 13px ${Typography.FONT_PRIMARY}`;
        ctx.fillStyle = Colors.TEXT_PRIMARY;
        let name = weapon.name;
        if (name.length > 22) name = name.substring(0, 20) + '...';
        ctx.fillText(name, x + 12, centerY);

        ctx.textAlign = 'right';
        ctx.font = `bold 12px ${Typography.FONT_MONO}`;
        ctx.fillStyle = Colors.PRIMARY;
        ctx.fillText(`Niv.${weapon.level}`, x + width - 12, centerY);

        ctx.textBaseline = 'alphabetic'; // Reset
    }

    // Utilitaire
    roundRectPath(ctx, x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
