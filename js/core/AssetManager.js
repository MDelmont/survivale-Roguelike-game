/**
 * AssetManager Class
 * Gère le chargement et le cache des images/assets.
 */
export class AssetManager {
    constructor() {
        this.images = new Map();
        this.alphaData = new Map(); // Cache des données alpha (transparence)
        this.loadingPromises = [];
    }

    /**
     * Charge une image et la met en cache.
     * @param {string} path 
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(path) {
        if (this.images.has(path)) {
            return Promise.resolve(this.images.get(path));
        }

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                this.images.set(path, img);
                resolve(img);
            };
            img.onerror = () => {
                console.error(`Impossible de charger l'image : ${path}`);
                reject(new Error(`Failed to load image at ${path}`));
            };
        });

        this.loadingPromises.push(promise);
        return promise;
    }

    /**
     * Récupère une image depuis le cache.
     */
    getImage(path) {
        return this.images.get(path);
    }

    /**
     * Vérifie si une image est chargée.
     */
    isLoaded(path) {
        const img = this.images.get(path);
        return img && img.complete;
    }

    /**
     * Génère ou récupère un masque alpha pour une image.
     */
    getAlphaData(path) {
        if (this.alphaData.has(path)) return this.alphaData.get(path);
        
        const img = this.images.get(path);
        if (!img || !img.complete) return null;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        
        // On ne stocke que la valeur alpha pour économiser de la mémoire
        const alpha = new Uint8Array(img.width * img.height);
        for (let i = 0; i < data.length; i += 4) {
            alpha[i / 4] = data[i + 3];
        }
        
        const result = {
            width: img.width,
            height: img.height,
            data: alpha
        };
        
        this.alphaData.set(path, result);
        return result;
    }

    /**
     * Attend que tous les chargements soient terminés.
     */
    async waitForAll() {
        await Promise.allSettled(this.loadingPromises);
    }
}
