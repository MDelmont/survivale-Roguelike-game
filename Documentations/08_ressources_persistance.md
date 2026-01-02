# Gestion des Ressources et Persistance

## 1. Chargement des Ressources (Assets)
Un système de `AssetLoader` est nécessaire pour garantir que toutes les images sont chargées avant le démarrage.
- **Preloader** : Affiche une barre de progression.
- **Cache** : Stocke les images pour un accès rapide pendant le rendu.

## 2. Persistance (LocalStorage)
Bien que le prompt suggère une progression continue, il est crucial de sauvegarder l'état.
- **Données sauvegardées** :
    - Phase maximale atteinte.
    - Améliorations acquises (si elles sont permanentes entre les runs, sinon juste entre les phases d'un même run).
    - Statistiques globales.
- **Format** : JSON sérialisé dans le `localStorage`.

## 3. Son (Audio)
Pour le MVP, un simple `AudioContext` ou l'API `Audio` HTML5 suffira pour :
- Effets de tir.
- Explosions.
- Musique de fond par phase.
- Son de montée de niveau.
