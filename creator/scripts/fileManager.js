/**
 * FileManager - Gestion de la connexion au projet via File System Access API
 */
class FileManager {
    constructor() {
        this.rootHandle = null;
        this.dataHandle = null;
        this.assetsHandle = null;
        this.isConnected = false;
        this.projectName = '';
    }

    /**
     * Vérifie si l'API File System Access est supportée
     */
    isSupported() {
        return 'showDirectoryPicker' in window;
    }

    /**
     * Demande à l'utilisateur de sélectionner le dossier du projet
     */
    async connectProject() {
        if (!this.isSupported()) {
            throw new Error('File System Access API non supportée. Utilisez Chrome ou Edge.');
        }

        try {
            // Ouvrir le sélecteur de dossier
            this.rootHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });

            this.projectName = this.rootHandle.name;

            // Vérifier que c'est bien un projet valide (contient data/)
            try {
                this.dataHandle = await this.rootHandle.getDirectoryHandle('data');
            } catch (e) {
                throw new Error('Dossier "data/" non trouvé. Sélectionnez le dossier racine du projet.');
            }

            // Essayer de trouver le dossier assets/
            try {
                this.assetsHandle = await this.rootHandle.getDirectoryHandle('assets');
            } catch (e) {
                console.warn('Dossier "assets/" non trouvé.');
                this.assetsHandle = null;
            }

            this.isConnected = true;
            return {
                success: true,
                projectName: this.projectName
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                return { success: false, cancelled: true };
            }
            throw error;
        }
    }

    /**
     * Lit un fichier JSON depuis le dossier data/
     */
    async readJSON(filename) {
        if (!this.isConnected || !this.dataHandle) {
            throw new Error('Projet non connecté');
        }

        try {
            const fileHandle = await this.dataHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const content = await file.text();
            return JSON.parse(content);
        } catch (error) {
            if (error.name === 'NotFoundError') {
                return null; // Fichier n'existe pas
            }
            throw error;
        }
    }

    /**
     * Écrit un fichier JSON dans le dossier data/
     */
    async writeJSON(filename, data) {
        if (!this.isConnected || !this.dataHandle) {
            throw new Error('Projet non connecté');
        }

        const fileHandle = await this.dataHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 4));
        await writable.close();
    }

    /**
     * Liste tous les fichiers JSON dans data/
     */
    async listDataFiles() {
        if (!this.isConnected || !this.dataHandle) {
            throw new Error('Projet non connecté');
        }

        const files = [];
        for await (const entry of this.dataHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                files.push(entry.name);
            }
        }
        return files;
    }

    /**
     * Charge tous les fichiers de données du jeu
     */
    async loadAllData() {
        const data = {
            players: null,
            enemies: null,
            bosses: null,
            weapons: null,
            phases: null,
            transitions: null
        };

        const playerData = await this.readJSON('player.json');
        data.players = playerData?.players || {};

        const enemiesData = await this.readJSON('enemies.json');
        data.enemies = enemiesData?.enemies || {};

        const bossesData = await this.readJSON('bosses.json');
        data.bosses = bossesData?.bosses || {};

        const weaponsData = await this.readJSON('weapons.json');
        data.weapons = weaponsData?.weapons || [];

        const phasesData = await this.readJSON('phases.json');
        data.phases = phasesData?.phases || [];

        const upgradesData = await this.readJSON('upgrades.json');
        data.upgrades = upgradesData?.upgrades || [];

        const transitionsData = await this.readJSON('transitions.json');
        data.transitions = transitionsData?.transitions || [];

        return data;
    }

    /**
     * Retourne l'URL d'un asset pour l'affichage
     */
    async getAssetURL(relativePath) {
        if (!this.rootHandle) return null;

        try {
            // Parcourir le chemin relatif
            const parts = relativePath.split('/').filter(p => p);
            let handle = this.rootHandle;

            for (let i = 0; i < parts.length - 1; i++) {
                handle = await handle.getDirectoryHandle(parts[i]);
            }

            const fileHandle = await handle.getFileHandle(parts[parts.length - 1]);
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
        } catch (e) {
            console.warn('Asset non trouvé:', relativePath);
            return null;
        }
    }
}

// Export global
window.FileManager = FileManager;
