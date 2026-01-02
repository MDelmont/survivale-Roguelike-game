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
        console.log('Progression réinitialisée.');
    }
}
