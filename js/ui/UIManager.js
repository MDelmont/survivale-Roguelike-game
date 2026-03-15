/**
 * UIManager - Design System & UI Orchestration
 * EVG Anthony - Survivor Edition
 * 
 * Manages all UI rendering, theming, and component coordination.
 */

// ============================================
// DESIGN TOKENS - Color Palette
// ============================================
export const Colors = {
    // Primary Colors
    PRIMARY: '#00D4FF',      // Cyan Néon
    SECONDARY: '#A855F7',    // Violet
    ACCENT: '#22C55E',       // Emeraude
    DANGER: '#EF4444',       // Red
    WARNING: '#FBBF24',      // Amber

    // Surfaces
    SURFACE_DARK: '#0F172A',
    SURFACE_DARKER: '#020617',
    GLASS_BG: 'rgba(15, 23, 42, 0.85)',
    GLASS_BG_LIGHT: 'rgba(30, 41, 59, 0.75)',

    // Text
    TEXT_PRIMARY: '#F8FAFC',
    TEXT_SECONDARY: '#94A3B8',
    TEXT_MUTED: '#64748B',

    // Rarity Colors
    RARITY_COMMON: '#9CA3AF',
    RARITY_RARE: '#3B82F6',
    RARITY_EPIC: '#A855F7',
    RARITY_LEGENDARY: '#F59E0B',

    // Gradients (start, end)
    GRADIENT_PRIMARY: ['#00D4FF', '#0EA5E9'],
    GRADIENT_XP: ['#22C55E', '#16A34A'],
    GRADIENT_HP: ['#EF4444', '#DC2626'],
    GRADIENT_GOLD: ['#FBBF24', '#F59E0B'],
};

// ============================================
// DESIGN TOKENS - Typography
// ============================================
export const Typography = {
    FONT_PRIMARY: "'Inter', 'Segoe UI', system-ui, sans-serif",
    FONT_DISPLAY: "'Orbitron', 'Inter', sans-serif",
    FONT_MONO: "'JetBrains Mono', 'Consolas', monospace",

    // Sizes
    SIZE_XS: 12,
    SIZE_SM: 14,
    SIZE_BASE: 16,
    SIZE_LG: 20,
    SIZE_XL: 24,
    SIZE_2XL: 32,
    SIZE_3XL: 40,
    SIZE_4XL: 48,
    SIZE_5XL: 60,
};

// ============================================
// DESIGN TOKENS - Spacing & Layout
// ============================================
export const Spacing = {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
};

// ============================================
// DESIGN TOKENS - Effects
// ============================================
export const Effects = {
    BLUR_SM: 8,
    BLUR_MD: 12,
    BLUR_LG: 20,

    GLOW_SM: 10,
    GLOW_MD: 20,
    GLOW_LG: 40,

    BORDER_RADIUS_SM: 4,
    BORDER_RADIUS_MD: 8,
    BORDER_RADIUS_LG: 16,
    BORDER_RADIUS_XL: 24,

    TRANSITION_FAST: 150,
    TRANSITION_NORMAL: 300,
    TRANSITION_SLOW: 500,
};

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Draw a glassmorphism panel
 */
export function drawGlassPanel(ctx, x, y, width, height, options = {}) {
    const {
        bgColor = Colors.GLASS_BG,
        borderColor = Colors.PRIMARY,
        borderWidth = 2,
        cornerRadius = Effects.BORDER_RADIUS_LG,
        glowColor = null,
        glowIntensity = Effects.GLOW_MD
    } = options;

    ctx.save();

    // Glow effect
    if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowIntensity;
    }

    // Background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    roundRect(ctx, x, y, width, height, cornerRadius);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    ctx.restore();
}

/**
 * Draw a styled button with gaming aesthetics
 */
export function drawButton(ctx, x, y, width, height, text, options = {}) {
    const {
        color = Colors.PRIMARY,
        textColor = Colors.TEXT_PRIMARY,
        isHovered = false,
        isPressed = false,
        fontSize = Typography.SIZE_LG,
        icon = null
    } = options;

    ctx.save();

    const scale = isPressed ? 0.98 : (isHovered ? 1.02 : 1);
    const actualWidth = width * scale;
    const actualHeight = height * scale;
    const actualX = x - (actualWidth - width) / 2;
    const actualY = y - (actualHeight - height) / 2;

    // Glow on hover
    if (isHovered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = Effects.GLOW_MD;
    }

    // Background
    ctx.fillStyle = isHovered ? Colors.GLASS_BG_LIGHT : Colors.GLASS_BG;
    ctx.beginPath();
    roundRect(ctx, actualX, actualY, actualWidth, actualHeight, Effects.BORDER_RADIUS_MD);
    ctx.fill();

    // Border with gradient-like effect
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.stroke();

    // Bottom accent line
    ctx.beginPath();
    ctx.moveTo(actualX + 20, actualY + actualHeight - 8);
    ctx.lineTo(actualX + actualWidth - 20, actualY + actualHeight - 8);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = isHovered ? 1 : 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Chevron icon
    const chevronX = actualX + 20;
    const chevronY = actualY + actualHeight / 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(chevronX, chevronY - 6);
    ctx.lineTo(chevronX + 8, chevronY);
    ctx.lineTo(chevronX, chevronY + 6);
    ctx.fill();

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px ${Typography.FONT_PRIMARY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, actualX + actualWidth / 2 + 10, actualY + actualHeight / 2);

    ctx.restore();
}

/**
 * Draw an upgrade/weapon card
 */
export function drawCard(ctx, x, y, width, height, data, options = {}) {
    const {
        isHovered = false,
        isSelected = false,
        borderColor = Colors.PRIMARY,
        showStats = true
    } = options;

    ctx.save();

    // Card glow on hover
    if (isHovered) {
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = Effects.GLOW_LG;
    }

    // Card background
    ctx.fillStyle = isSelected ? Colors.GLASS_BG_LIGHT : Colors.GLASS_BG;
    ctx.beginPath();
    roundRect(ctx, x, y, width, height, Effects.BORDER_RADIUS_LG);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.stroke();

    // Content rendering
    const padding = Spacing.LG;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = width - padding * 2;

    // Icon placeholder (circle with first letter)
    const iconSize = 64;
    const iconX = x + width / 2;
    const iconY = contentY + iconSize / 2 + 10;

    ctx.fillStyle = Colors.GLASS_BG_LIGHT;
    ctx.beginPath();
    ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon letter
    ctx.fillStyle = borderColor;
    ctx.font = `bold ${Typography.SIZE_2XL}px ${Typography.FONT_PRIMARY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const iconLetter = data.name ? data.name.charAt(0).toUpperCase() : '?';
    ctx.fillText(iconLetter, iconX, iconY);

    // Title
    const titleY = iconY + iconSize / 2 + Spacing.LG;
    ctx.fillStyle = Colors.TEXT_PRIMARY;
    ctx.font = `bold ${Typography.SIZE_LG}px ${Typography.FONT_PRIMARY}`;
    ctx.textAlign = 'center';
    ctx.fillText(data.name || 'Unknown', x + width / 2, titleY);

    // Description
    const descY = titleY + Spacing.LG;
    ctx.fillStyle = Colors.TEXT_SECONDARY;
    ctx.font = `${Typography.SIZE_SM}px ${Typography.FONT_PRIMARY}`;
    wrapText(ctx, data.description || '', x + width / 2, descY, contentWidth - 20, 18);

    // Stat badge
    if (showStats && data.statDisplay) {
        const badgeY = y + height - 60;
        const badgeHeight = 32;
        const badgeWidth = contentWidth - 20;

        ctx.fillStyle = hexToRgba(borderColor, 0.2);
        ctx.beginPath();
        roundRect(ctx, contentX + 10, badgeY, badgeWidth, badgeHeight, Effects.BORDER_RADIUS_SM);
        ctx.fill();

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = borderColor;
        ctx.font = `bold ${Typography.SIZE_BASE}px ${Typography.FONT_MONO}`;
        ctx.textAlign = 'center';
        ctx.fillText(data.statDisplay, x + width / 2, badgeY + badgeHeight / 2 + 1);
    }

    // Impact hint
    if (data.impactHint) {
        ctx.fillStyle = Colors.TEXT_MUTED;
        ctx.font = `italic ${Typography.SIZE_XS}px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'center';
        ctx.fillText(`💡 ${data.impactHint}`, x + width / 2, y + height - 20);
    }

    ctx.restore();
}

/**
 * Draw a progress bar (HP, XP, etc.)
 */
export function drawProgressBar(ctx, x, y, width, height, progress, options = {}) {
    const {
        backgroundColor = 'rgba(0, 0, 0, 0.5)',
        gradientColors = Colors.GRADIENT_HP,
        borderColor = Colors.TEXT_PRIMARY,
        showBorder = true,
        animated = false,
        label = null
    } = options;

    ctx.save();

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    roundRect(ctx, x, y, width, height, Effects.BORDER_RADIUS_SM);
    ctx.fill();

    // Progress fill with gradient
    const fillWidth = Math.max(0, Math.min(1, progress)) * width;
    if (fillWidth > 0) {
        const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(1, gradientColors[1]);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundRect(ctx, x, y, fillWidth, height, Effects.BORDER_RADIUS_SM);
        ctx.fill();
    }

    // Border
    if (showBorder) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        roundRect(ctx, x, y, width, height, Effects.BORDER_RADIUS_SM);
        ctx.stroke();
    }

    // Label
    if (label) {
        ctx.fillStyle = Colors.TEXT_PRIMARY;
        ctx.font = `bold ${Typography.SIZE_SM}px ${Typography.FONT_PRIMARY}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + width + 10, y + height / 2);
    }

    ctx.restore();
}

/**
 * Draw text with outline for readability on any background
 */
export function drawTextWithOutline(ctx, text, x, y, options = {}) {
    const {
        font = `bold ${Typography.SIZE_LG}px ${Typography.FONT_PRIMARY}`,
        fillColor = Colors.TEXT_PRIMARY,
        strokeColor = 'rgba(0, 0, 0, 0.8)',
        strokeWidth = 3,
        textAlign = 'center',
        textBaseline = 'middle'
    } = options;

    ctx.save();
    ctx.font = font;
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;

    // Stroke (outline)
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.strokeText(text, x, y);

    // Fill
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);

    ctx.restore();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Draw a rounded rectangle path
 */
export function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
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

/**
 * Wrap text to fit within maxWidth
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, testY);
            line = words[n] + ' ';
            testY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, testY);
    return testY;
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get rarity color from rarity name
 */
export function getRarityColor(rarity) {
    switch (rarity) {
        case 'legendary': return Colors.RARITY_LEGENDARY;
        case 'epic': return Colors.RARITY_EPIC;
        case 'rare': return Colors.RARITY_RARE;
        default: return Colors.RARITY_COMMON;
    }
}

/**
 * Easing function for smooth animations
 */
export function easeOutQuad(t) {
    return t * (2 - t);
}

/**
 * Easing function for elastic effects
 */
export function easeOutElastic(t) {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}
