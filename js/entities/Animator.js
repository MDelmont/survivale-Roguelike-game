/**
 * Animator Class
 * Gère la logique des frames et le choix de l'animation selon l'état et la direction.
 */
export class Animator {
    constructor(visuals, assetManager) {
        this.visuals = visuals;
        this.assetManager = assetManager;
        
        this.currentState = 'idle';
        this.currentDirection = 'down'; // Pour les modes 4_way/8_way
        this.currentFrameIndex = 0;
        this.timer = 0;
        
        this.width = visuals.width;
        this.height = visuals.height;
        this.displayOffset = visuals.displayOffset || { x: 0, y: 0 };
        this.angleOffset = (visuals.angleOffset || 0) * (Math.PI / 180); // Conversion en radians
        this.directionMode = visuals.directionMode || 'none'; // none, flip, rotate, 4_way, 8_way
        
        this.isHurt = false;
        this.hurtTimer = 0;
    }

    /**
     * Met à jour l'état de l'animation
     */
    update(deltaTime, stateData) {
        const { velocity, isHurt, forceState } = stateData;

        // Gestion de l'état Hurt (prioritaire)
        if (isHurt) {
            this.isHurt = true;
            this.hurtTimer = 200; // Durée fixe du flash/état hurt
        }
        
        if (this.hurtTimer > 0) {
            this.hurtTimer -= deltaTime;
            if (this.hurtTimer <= 0) this.isHurt = false;
        }

        // Choix de l'animation de base
        let newState = forceState || 'idle';
        if (!forceState) {
            if (this.isHurt && this.visuals.animations['hurt']) {
                newState = 'hurt';
            } else if (velocity && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1)) {
                newState = (this.visuals.animations['walk']) ? 'walk' : 'idle';
            }
        }

        // Fallback si l'état demandé n'existe pas du tout
        if (!this.visuals.animations[newState]) {
            newState = 'idle';
        }

        // Si l'animation change, on reset le timer
        if (newState !== this.currentState) {
            this.currentState = newState;
            this.currentFrameIndex = 0;
            this.timer = 0;
        }

        // Mise à jour de la direction pour les modes directionnels
        if (velocity) {
            this.updateDirection(velocity);
        }

        // Avancement de la frame
        const anim = this.getAnimation(this.currentState);
        if (anim && anim.frames && anim.frames.length > 0) {
            this.timer += deltaTime;
            const frameDuration = 1000 / (anim.frameRate || 10);
            
            if (this.timer >= frameDuration) {
                this.timer = 0;
                this.currentFrameIndex++;
                if (this.currentFrameIndex >= anim.frames.length) {
                    if (anim.loop !== false) {
                        this.currentFrameIndex = 0;
                    } else {
                        this.currentFrameIndex = anim.frames.length - 1;
                    }
                }
            }
        }
    }

    updateDirection(velocity) {
        if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1) return;

        if (this.directionMode === 'flip') {
            if (velocity.x < 0) this.currentDirection = 'left';
            else if (velocity.x > 0) this.currentDirection = 'right';
        } else if (this.directionMode === '4_way' || this.directionMode === 'rotate') {
            if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
                this.currentDirection = velocity.x > 0 ? 'right' : 'left';
            } else {
                this.currentDirection = velocity.y > 0 ? 'down' : 'up';
            }
        }
    }

    /**
     * Récupère la config d'animation actuelle, gère les directions si nécessaire
     */
    getAnimation(state) {
        let anim = this.visuals.animations[state];
        if (!anim) return null;

        // Si l'animation contient des clés de direction (up, down, etc.)
        if (anim[this.currentDirection]) {
            return anim[this.currentDirection];
        }

        return anim;
    }

    /**
     * Dessine la frame actuelle
     */
    draw(ctx, posX, posY, angle = 0) {
        const anim = this.getAnimation(this.currentState);
        if (!anim || !anim.frames) return;

        const imagePath = anim.frames[this.currentFrameIndex];
        const img = this.assetManager.getImage(imagePath);
        
        if (!img) return;

        // Calcul dynamique des dimensions pour garder l'aspect ratio (Bounding Box)
        let drawW = this.width;
        let drawH = this.height;

        if (drawW && drawH) {
            const imgRatio = img.width / img.height;
            const targetRatio = drawW / drawH;
            if (imgRatio > targetRatio) {
                // L'image est plus large que la zone cible, on réduit la hauteur
                drawH = drawW / imgRatio;
            } else {
                // L'image est plus haute que la zone cible, on réduit la largeur
                drawW = drawH * imgRatio;
            }
        } else if (drawW && !drawH) {
            drawH = (img.height / img.width) * drawW;
        } else if (!drawW && drawH) {
            drawW = (img.width / img.height) * drawH;
        } else if (!drawH && !drawW) {
            drawW = img.width;
            drawH = img.height;
        }

        ctx.save();
        ctx.translate(posX + this.displayOffset.x, posY + this.displayOffset.y);

        // Rotation pour le mode rotate (ex: spermatozoïde)
        if (this.directionMode === 'rotate') {
            ctx.rotate(angle + this.angleOffset);
        }

        // Flip horizontal pour le mode flip
        if (this.directionMode === 'flip' && this.currentDirection === 'left') {
            ctx.scale(-1, 1);
        }

        // Flash blanc si blessé
        if (this.isHurt && this.visuals.hitFlash) {
            ctx.filter = 'brightness(2) contrast(2) grayscale(1) invert(1)';
        }

        ctx.drawImage(
            img, 
            -drawW / 2, 
            -drawH / 2, 
            drawW, 
            drawH
        );

        ctx.restore();
    }

    /**
     * Vérifie si un point du monde (x, y) touche un pixel opaque de l'entité.
     */
    isPixelOpaque(worldX, worldY, entityX, entityY, entityAngle) {
        const anim = this.getAnimation(this.currentState);
        if (!anim || !anim.frames) return false;

        const imagePath = anim.frames[this.currentFrameIndex];
        const alphaMask = this.assetManager.getAlphaData(imagePath);
        if (!alphaMask) return true;

        const img = this.assetManager.getImage(imagePath);
        if (!img) return true;

        // 1. Translation inverse
        let localX = worldX - (entityX + this.displayOffset.x);
        let localY = worldY - (entityY + this.displayOffset.y);

        // 2. Rotation inverse
        if (this.directionMode === 'rotate') {
            const rot = -(entityAngle + this.angleOffset);
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const rx = localX * cos - localY * sin;
            const ry = localX * sin + localY * cos;
            localX = rx;
            localY = ry;
        }

        // 3. Flip inverse
        if (this.directionMode === 'flip' && this.currentDirection === 'left') {
            localX = -localX;
        }

        // 4. Mapping aux dimensions de l'image source
        let drawW = this.width;
        let drawH = this.height;

        if (drawW && !drawH) drawH = (img.height / img.width) * drawW;
        else if (!drawW && drawH) drawW = (img.width / img.height) * drawH;
        else if (!drawH && !drawW) {
            drawW = img.width;
            drawH = img.height;
        }

        const imgX = Math.floor(((localX + drawW / 2) / drawW) * alphaMask.width);
        const imgY = Math.floor(((localY + drawH / 2) / drawH) * alphaMask.height);

        if (imgX < 0 || imgX >= alphaMask.width || imgY < 0 || imgY >= alphaMask.height) {
            return false;
        }

        const alpha = alphaMask.data[imgY * alphaMask.width + imgX];
        return alpha > 10; 
    }
}

