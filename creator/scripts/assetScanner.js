/**
 * AssetScanner - Scan et gestion des assets du projet
 */
class AssetScanner {
    constructor(fileManager) {
        this.fileManager = fileManager;
        this.assets = {
            players: [],
            monster: [],
            boss: [],
            projectile: [],
            other: []
        };
        this.assetURLs = new Map(); // Cache des URLs d'assets
    }

    /**
     * Scanne récursivement le dossier assets/
     */
    async scanAssets() {
        if (!this.fileManager.assetsHandle) {
            console.warn('Dossier assets non disponible');
            return this.assets;
        }

        this.assets = {
            players: [],
            monster: [],
            boss: [],
            projectile: [],
            other: []
        };

        await this._scanDirectory(this.fileManager.assetsHandle, 'assets');
        return this.assets;
    }

    /**
     * Scan récursif d'un dossier
     */
    async _scanDirectory(dirHandle, path) {
        for await (const entry of dirHandle.values()) {
            const entryPath = `${path}/${entry.name}`;

            if (entry.kind === 'directory') {
                await this._scanDirectory(entry, entryPath);
            } else if (entry.kind === 'file') {
                // Vérifier si c'est une image
                const ext = entry.name.split('.').pop().toLowerCase();
                if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
                    const assetInfo = {
                        name: entry.name,
                        path: entryPath,
                        handle: entry
                    };

                    // Catégoriser selon le chemin
                    if (path.includes('players')) {
                        this.assets.players.push(assetInfo);
                    } else if (path.includes('monster')) {
                        this.assets.monster.push(assetInfo);
                    } else if (path.includes('boss')) {
                        this.assets.boss.push(assetInfo);
                    } else if (path.includes('projectile')) {
                        this.assets.projectile.push(assetInfo);
                    } else {
                        this.assets.other.push(assetInfo);
                    }
                }
            }
        }
    }

    /**
     * Obtient tous les assets à plat
     */
    getAllAssets() {
        return [
            ...this.assets.players,
            ...this.assets.monster,
            ...this.assets.boss,
            ...this.assets.projectile,
            ...this.assets.other
        ];
    }

    /**
     * Obtient le nombre total d'assets
     */
    getAssetCount() {
        return this.getAllAssets().length;
    }

    /**
     * Obtient l'URL d'un asset pour affichage
     */
    async getAssetURL(assetPath) {
        // Vérifier le cache
        if (this.assetURLs.has(assetPath)) {
            return this.assetURLs.get(assetPath);
        }

        // Chercher l'asset
        const asset = this.getAllAssets().find(a => a.path === assetPath);
        if (!asset) {
            return null;
        }

        try {
            const file = await asset.handle.getFile();
            const url = URL.createObjectURL(file);
            this.assetURLs.set(assetPath, url);
            return url;
        } catch (e) {
            console.warn('Erreur chargement asset:', assetPath, e);
            return null;
        }
    }

    /**
     * Libère les URLs créées (nettoyage mémoire)
     */
    revokeURLs() {
        for (const url of this.assetURLs.values()) {
            URL.revokeObjectURL(url);
        }
        this.assetURLs.clear();
    }

    /**
     * Obtient les assets par catégorie
     */
    getAssetsByCategory(category) {
        return this.assets[category] || [];
    }

    /**
     * Retourne la liste des chemins pour un sélecteur dropdown
     */
    getAssetPathsForSelect(category = null) {
        let assets;
        if (category) {
            assets = this.getAssetsByCategory(category);
        } else {
            assets = this.getAllAssets();
        }
        return assets.map(a => a.path);
    }
}

// Export global
window.AssetScanner = AssetScanner;
