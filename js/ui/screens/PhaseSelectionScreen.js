import {
    Colors,
    Typography,
    Spacing,
    Effects,
    drawGlassPanel,
    easeOutElastic
} from '../UIManager.js';

/**
 * PhaseSelectionScreen
 * Allows the player to choose a phase they have already reached.
 */
export class PhaseSelectionScreen {
    constructor(game) {
        this.game = game;
        this.hoveredPhase = null;
        this.scrollOffset = 0;
        this.animationProgress = 0;
        this.isAnimating = true;

        // Configuration du layout
        this.cardWidth = 300;
        this.cardHeight = 200;
        this.gap = 30;
        this.cols = 3;
    }

    reset() {
        this.animationProgress = 0;
        this.isAnimating = true;
        this.hoveredPhase = null;
    }

    update(deltaTime, mouseX, mouseY) {
        if (this.isAnimating) {
            this.animationProgress += deltaTime / 400;
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
        const phases = this.game.dataManager.data.phases?.phases || [];
        const layout = this.calculateLayout(phases.length);
        this.hoveredPhase = null;

        phases.forEach((_, i) => {
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;
            const x = layout.startX + col * (this.cardWidth + this.gap);
            const y = layout.startY + row * (this.cardHeight + this.gap);

            if (mouseX >= x && mouseX <= x + this.cardWidth &&
                mouseY >= y && mouseY <= y + this.cardHeight) {
                this.hoveredPhase = i;
            }
        });

        // Bouton retour
        const backBtn = this.getBackButtonRect();
        if (mouseX >= backBtn.x && mouseX <= backBtn.x + backBtn.w &&
            mouseY >= backBtn.y && mouseY <= backBtn.y + backBtn.h) {
            this.hoveredPhase = 'back';
        }
    }

    getBackButtonRect() {
        return {
            x: 50,
            y: 50,
            w: 150,
            h: 50
        };
    }

    handleClick(mouseX, mouseY) {
        if (this.isAnimating) return null;

        const phases = this.game.dataManager.data.phases?.phases || [];
        const unlockedProgress = this.game.saveSystem.getProgress();
        const layout = this.calculateLayout(phases.length);

        for (let i = 0; i < phases.length; i++) {
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;
            const x = layout.startX + col * (this.cardWidth + this.gap);
            const y = layout.startY + row * (this.cardHeight + this.gap);

            if (mouseX >= x && mouseX <= x + this.cardWidth &&
                mouseY >= y && mouseY <= y + this.cardHeight) {
                // On ne peut sélectionner que les phases débloquées
                if (i <= unlockedProgress) {
                    return { type: 'phase', index: i };
                }
            }
        }

        // Check back button
        const backBtn = this.getBackButtonRect();
        if (mouseX >= backBtn.x && mouseX <= backBtn.x + backBtn.w &&
            mouseY >= backBtn.y && mouseY <= backBtn.y + backBtn.h) {
            return { type: 'back' };
        }

        return null;
    }

    calculateLayout(numPhases) {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;

        const rows = Math.ceil(numPhases / this.cols);
        const totalGridWidth = this.cols * this.cardWidth + (this.cols - 1) * this.gap;
        const totalGridHeight = rows * this.cardHeight + (rows - 1) * this.gap;

        const startX = (w - totalGridWidth) / 2;
        const startY = (h - totalGridHeight) / 2 + 40;

        return { startX, startY, w, h };
    }

    draw(ctx) {
        const phases = this.game.dataManager.data.phases?.phases || [];
        const unlockedProgress = this.game.saveSystem.getProgress();
        const layout = this.calculateLayout(phases.length);

        // Fond sombre
        ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
        ctx.fillRect(0, 0, layout.w, layout.h);

        // Titre
        ctx.save();
        ctx.globalAlpha = this.animationProgress;
        ctx.fillStyle = Colors.PRIMARY;
        ctx.font = `bold 42px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.fillText('SÉLECTION DES PHASES', layout.w / 2, 80);
        ctx.restore();

        // Bouton Retour
        this.drawBackButton(ctx);

        // Grille de phases
        phases.forEach((phase, i) => {
            const row = Math.floor(i / this.cols);
            const col = i % this.cols;
            const x = layout.startX + col * (this.cardWidth + this.gap);
            const y = layout.startY + row * (this.cardHeight + this.gap);

            const isUnlocked = i <= unlockedProgress;
            const isHovered = this.hoveredPhase === i;

            this.drawPhaseCard(ctx, x, y, phase, i, isUnlocked, isHovered);
        });
    }

    drawBackButton(ctx) {
        const rect = this.getBackButtonRect();
        const isHovered = this.hoveredPhase === 'back';

        ctx.save();
        ctx.globalAlpha = this.animationProgress;

        ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
        this.roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 10);
        ctx.fill();

        ctx.strokeStyle = isHovered ? Colors.PRIMARY : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isHovered ? Colors.PRIMARY : '#fff';
        ctx.font = `bold 18px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('← RETOUR', rect.x + rect.w / 2, rect.y + rect.h / 2);

        ctx.restore();
    }

    drawPhaseCard(ctx, x, y, phase, index, isUnlocked, isHovered) {
        const progress = Math.max(0, Math.min(1, this.animationProgress * 1.5 - (index * 0.1)));
        if (progress <= 0) return;

        ctx.save();
        ctx.globalAlpha = progress;
        const animatedY = y + (1 - easeOutElastic(progress)) * 50;

        // Effet de glow au survol (seulement si débloqué)
        if (isHovered && isUnlocked) {
            ctx.shadowColor = Colors.PRIMARY;
            ctx.shadowBlur = 20;
        }

        // Fond de la carte
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        this.roundRectPath(ctx, x, y, this.cardWidth, this.cardHeight, 14);
        ctx.fill();

        // Bordure
        ctx.strokeStyle = isUnlocked ? (isHovered ? Colors.PRIMARY : 'rgba(0, 212, 255, 0.4)') : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isHovered && isUnlocked ? 3 : 2;
        ctx.stroke();

        // Image de fond (si débloqué)
        if (isUnlocked && phase.background_image) {
            const img = this.game.dataManager.assetManager.getImage(phase.background_image);
            if (img) {
                ctx.save();
                this.roundRectPath(ctx, x + 5, y + 5, this.cardWidth - 10, this.cardHeight - 10, 10);
                ctx.clip();

                // Dessiner l'image en "cover"
                const aspect = img.width / img.height;
                const targetW = this.cardWidth - 10;
                const targetH = this.cardHeight - 10;
                const targetAspect = targetW / targetH;

                let drawW, drawH, drawX, drawY;
                if (aspect > targetAspect) {
                    drawH = targetH;
                    drawW = targetH * aspect;
                    drawX = x + 5 - (drawW - targetW) / 2;
                    drawY = y + 5;
                } else {
                    drawW = targetW;
                    drawH = targetW / aspect;
                    drawX = x + 5;
                    drawY = y + 5 - (drawH - targetH) / 2;
                }

                ctx.globalAlpha = 0.6; // Légère transparence pour le texte
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
                ctx.restore();
            }
        } else {
            // Placeholder verrouillé (noir ou dégradé sombre)
            const grad = ctx.createLinearGradient(x, y, x, y + this.cardHeight);
            grad.addColorStop(0, '#020617');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            this.roundRectPath(ctx, x + 5, y + 5, this.cardWidth - 10, this.cardHeight - 10, 10);
            ctx.fill();

            // Icône de cadenas
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x + this.cardWidth / 2, y + this.cardHeight / 2 - 10);
        }

        // Overlay dégradé pour le texte
        const textGrad = ctx.createLinearGradient(x, y + this.cardHeight / 2, x, y + this.cardHeight);
        textGrad.addColorStop(0, 'transparent');
        textGrad.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = textGrad;
        this.roundRectPath(ctx, x + 5, y + this.cardHeight / 2, this.cardWidth - 10, this.cardHeight / 2 - 5, { bl: 10, br: 10, tl: 0, tr: 0 });
        ctx.fill();

        // Numéro de phase
        ctx.fillStyle = isUnlocked ? Colors.PRIMARY : Colors.TEXT_MUTED;
        ctx.font = `bold 16px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'left';
        ctx.fillText(`PHASE ${index + 1}`, x + 15, y + this.cardHeight - 40);

        // Nom de la phase
        ctx.fillStyle = isUnlocked ? '#fff' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = `bold 20px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'left';
        ctx.fillText(phase.name || 'Sans nom', x + 15, y + this.cardHeight - 15);

        ctx.restore();
    }

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
