/**
 * SaveSystem Class
 * Gère la persistance de la progression via localStorage.
 */
export class SaveSystem {
    constructor() {
        this.SAVE_KEY = 'evg_anthony_progress';
    }

    /**
     * Sauvegarde la phase actuelle débloquée.
     */
    saveProgress(phaseIndex) {
        const currentProgress = this.getProgress();
        if (phaseIndex > currentProgress) {
            localStorage.setItem(this.SAVE_KEY, phaseIndex.toString());
            console.log(`Progression sauvegardée : Phase ${phaseIndex} débloquée.`);
        }
    }

    /**
     * Récupère la dernière phase débloquée.
     */
    getProgress() {
        const saved = localStorage.getItem(this.SAVE_KEY);
        return saved ? parseInt(saved) : 0;
    }

    /**
     * Réinitialise la progression.
     */
    resetProgress() {
        localStorage.removeItem(this.SAVE_KEY);
        // On ne reset pas le bestiaire avec la progression normale
        console.log('Progression réinitialisée.');
    }

    /**
     * Sauvegarde une entité découverte pour le bestiaire
     */
    saveDiscoveredEntity(type, id) {
        if (!id) return;
        const bestiaryKey = 'evg_anthony_bestiary_' + type;
        const currentData = this.getDiscoveredEntities(type);
        
        if (!currentData.includes(id)) {
            currentData.push(id);
            localStorage.setItem(bestiaryKey, JSON.stringify(currentData));
            console.log(`Nouvelle découverte dans le bestiaire (${type}) : ${id}`);
        }
    }

    /**
     * Récupère la liste des id découverts pour une catégorie
     */
    getDiscoveredEntities(type) {
        const bestiaryKey = 'evg_anthony_bestiary_' + type;
        const saved = localStorage.getItem(bestiaryKey);
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Vérifie si une entité a été découverte
     */
    isEntityDiscovered(type, id) {
        if (!id) return false;
        const currentData = this.getDiscoveredEntities(type);
        return currentData.includes(id);
    }
}
