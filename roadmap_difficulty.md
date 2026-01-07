# 🗺️ Roadmap : Implémentation de la Difficulté Dynamique

Ce document définit les étapes pour passer d'un spawn fixe à un système de difficulté adaptatif et intelligent.

## Phase 1 : Préparation des Données (Data Layer)
*L'objectif est d'ajouter les outils de mesure de la menace.*

- [ ] **Enrichissement des Ennemis** : Ajouter un champ `threatLevel` (numérique) dans `enemies.json` pour chaque type de mob.
- [ ] **Mise à jour du Schéma des Phases** : Ajouter les paramètres de budget (`initial_budget`, `max_budget`, `growth_rate`) et le `difficulty_multiplier` (ex: 1.0 par défaut).
- [ ] **Intégration Creator (Ennemis)** : Ajouter l'input "Niveau de Menace / Coût" dans l'éditeur d'ennemis.
- [ ] **Intégration Creator (Phases)** : Ajouter une section "Paramètres de Difficulté" dans l'éditeur de phases.

## Phase 2 : Le Cœur du Spawn (Logique de Jeu)
*Refonte de la manière dont les ennemis apparaissent dans Game.js.*

- [ ] **Algorithme de Budget** :
    - Remplacer `this.spawnTimer` par `this.threatBudget`.
    - Implémenter l'accumulation de points par seconde.
    - Créer la logique de sélection aléatoire pondérée (choisir un ennemi que le budget peut "payer").
- [ ] **Scaling Temporel** : Faire en sorte que le taux de gain de budget augmente linéairement avec `phaseTimer`, multiplié par le `difficulty_multiplier` de la phase.
- [ ] **Scaling de Puissance** : Injecter un bonus de budget basé sur `player.stats.level` et le nombre d'armes actives.

## Phase 3 : Rythme et Événements (Game Design)
*Rendre les parties moins monotones avec des variations de rythme.*

- [ ] **Vagues de Choc (Waves)** : Implémenter des pics de budget temporaires configurés dans la phase (ex: "Horde à 2 minutes").
- [ ] **Détection de Calme** : Si le nombre d'ennemis à l'écran est < X, boosters temporairement le budget pour éviter les moments de vide.
- [ ] **Limites de Sécurité** : Ajouter un `maxEnemies` global pour éviter que le jeu ne rame si le budget devient trop massif.

## Phase 4 : Équilibrage et Visualisation (Polissage)
*Donner des outils au créateur pour tester ses réglages.*

- [ ] **Graphique de Prédiction (Creator)** : Afficher une petite courbe visuelle du budget de menace sur la durée de la phase.
- [ ] **Mode Debug (Jeu)** : Afficher le budget actuel et le taux de gain en haut de l'écran (optionnel, pour les tests).
- [ ] **Affinage des Stats** : Passer en revue tous les monstres actuels pour leur donner un coût cohérent par rapport à leurs HP/Dégâts.

---
## Prochaine étape immédiate :
> **Modifier `enemies.json` et le module `enemies.js` du Creator pour intégrer le `threatLevel`.**
