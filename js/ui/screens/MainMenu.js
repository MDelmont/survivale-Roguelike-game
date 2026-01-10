/**
 * MainMenu Screen
 * EVG Anthony - Survivor Edition
 * 
 * Modern, gaming-style main menu with dynamic background support.
 */

import {
    Colors,
    Typography,
    Spacing,
    Effects,
    drawGlassPanel,
    drawButton,
    drawTextWithOutline,
    easeOutQuad
} from '../UIManager.js';

export class MainMenu {
    constructor(game) {
        this.game = game;
        this.buttons = [];
        this.hoveredButton = null;
        this.animationTime = 0;
        this.titlePulse = 0;

        this.setupButtons();
    }

    reset() {
        this.animationTime = 0;
        this.titlePulse = 0;
        this.hoveredButton = null;
    }

    setupButtons() {
        this.buttons = [
            {
                id: 'new_game',
                text: 'NOUVELLE PARTIE',
                color: Colors.PRIMARY,
                y: 0.52  // Position relative (% of screen height)
            },
            {
                id: 'continue',
                text: 'CONTINUER',
                color: Colors.ACCENT,
                y: 0.62,
                condition: () => this.game.saveSystem.getProgress() > 0
            }
        ];
    }

    update(deltaTime, mouseX, mouseY) {
        this.animationTime += deltaTime;
        this.titlePulse = Math.sin(this.animationTime / 500) * 0.3 + 0.7;

        // Update hover states
        const btnW = 280;
        const btnH = 60;
        const centerX = this.game.logicalWidth / 2;

        this.hoveredButton = null;

        this.buttons.forEach(btn => {
            if (btn.condition && !btn.condition()) return;

            const btnY = this.game.logicalHeight * btn.y;
            const x = centerX - btnW / 2;
            const y = btnY - btnH / 2;

            if (mouseX >= x && mouseX <= x + btnW &&
                mouseY >= y && mouseY <= y + btnH) {
                this.hoveredButton = btn.id;
            }
        });
    }

    handleClick(mouseX, mouseY) {
        const btnW = 280;
        const btnH = 60;
        const centerX = this.game.logicalWidth / 2;

        for (const btn of this.buttons) {
            if (btn.condition && !btn.condition()) continue;

            const btnY = this.game.logicalHeight * btn.y;
            const x = centerX - btnW / 2;
            const y = btnY - btnH / 2;

            if (mouseX >= x && mouseX <= x + btnW &&
                mouseY >= y && mouseY <= y + btnH) {
                return btn.id;
            }
        }
        return null;
    }

    draw(ctx) {
        const w = this.game.logicalWidth;
        const h = this.game.logicalHeight;

        // Draw background (if no image, draw gradient)
        this.drawBackground(ctx, w, h);

        // Title section with glow effect
        this.drawTitle(ctx, w, h);

        // Buttons
        this.drawButtons(ctx, w, h);

        // Version badge
        this.drawVersionBadge(ctx, w, h);
    }

    drawBackground(ctx, w, h) {
        // Check for menu background in phase config or use default
        const bgImage = this.game.currentPhase?.menu_background;

        if (bgImage && this.game.dataManager.assetManager.isLoaded(bgImage)) {
            const img = this.game.dataManager.assetManager.getImage(bgImage);
            this.game.drawImageCover(ctx, img, w, h);

            // Dark overlay for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, w, h);
        } else {
            // Gradient background
            const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.5, '#0f0f23');
            gradient.addColorStop(1, '#05050a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // Subtle grid pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const spacing = 80;
            for (let x = 0; x < w; x += spacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y < h; y += spacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        }

        // Animated particles (subtle)
        this.drawParticles(ctx, w, h);
    }

    drawParticles(ctx, w, h) {
        const time = this.animationTime / 1000;
        const numParticles = 20;

        ctx.save();
        for (let i = 0; i < numParticles; i++) {
            const x = (Math.sin(time * 0.5 + i * 1.5) * 0.5 + 0.5) * w;
            const y = (Math.cos(time * 0.3 + i * 2) * 0.5 + 0.5) * h;
            const alpha = 0.1 + Math.sin(time + i) * 0.05;
            const size = 2 + Math.sin(time * 2 + i) * 1;

            ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawTitle(ctx, w, h) {
        const centerX = w / 2;
        const titleY = h * 0.28;
        const subtitleY = h * 0.36;

        // Main title with animated glow
        ctx.save();
        ctx.shadowColor = Colors.PRIMARY;
        ctx.shadowBlur = Effects.GLOW_LG * this.titlePulse;

        // Title background panel
        drawGlassPanel(ctx, centerX - 280, titleY - 55, 560, 120, {
            bgColor: 'rgba(15, 23, 42, 0.7)',
            borderColor: Colors.PRIMARY,
            borderWidth: 2,
            cornerRadius: Effects.BORDER_RADIUS_XL
        });

        ctx.restore();

        // Main title - style inspiré de "LA CONCEPTION"
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        ctx.font = `bold 58px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Contour noir épais
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 8;
        ctx.strokeText('EVG ANTHONY', centerX, titleY);

        // Remplissage cyan avec glow
        ctx.fillStyle = Colors.PRIMARY;
        ctx.fillText('EVG ANTHONY', centerX, titleY);

        ctx.restore();

        // Subtitle
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.font = `bold 22px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('SURVIVOR EDITION', centerX, subtitleY);

        ctx.fillStyle = Colors.SECONDARY;
        ctx.fillText('SURVIVOR EDITION', centerX, subtitleY);

        ctx.restore();

        // Decorative lines
        const lineY = subtitleY + 25;
        ctx.strokeStyle = Colors.PRIMARY;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.moveTo(centerX - 220, lineY);
        ctx.lineTo(centerX - 100, lineY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 100, lineY);
        ctx.lineTo(centerX + 220, lineY);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }

    drawButtons(ctx, w, h) {
        const btnW = 280;
        const btnH = 60;
        const centerX = w / 2;

        this.buttons.forEach(btn => {
            if (btn.condition && !btn.condition()) return;

            const btnY = h * btn.y;
            const x = centerX - btnW / 2;
            const y = btnY - btnH / 2;

            const isHovered = this.hoveredButton === btn.id;

            drawButton(ctx, x, y, btnW, btnH, btn.text, {
                color: btn.color,
                isHovered: isHovered,
                fontSize: Typography.SIZE_LG
            });
        });
    }

    drawVersionBadge(ctx, w, h) {
        const version = 'v1.0.0';
        const padding = Spacing.MD;

        ctx.save();
        ctx.fillStyle = Colors.TEXT_MUTED;
        ctx.font = `${Typography.SIZE_SM}px ${Typography.FONT_MONO}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(version, padding, h - padding);
        ctx.restore();
    }
}
