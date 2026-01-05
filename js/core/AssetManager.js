/**
 * AssetManager Class
 * Gère le chargement et le cache des images/assets.
 */
export class AssetManager {
    constructor() {
        this.images = new Map();
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
     * Attend que tous les chargements soient terminés.
     */
    async waitForAll() {
        await Promise.allSettled(this.loadingPromises);
    }
}
