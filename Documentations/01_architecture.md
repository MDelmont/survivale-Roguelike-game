# Architecture Technique

## 1. Philosophie du Design
Le jeu est conçu pour être **data-driven** (piloté par les données) et **modulaire**. La séparation des responsabilités est la clé de la maintenabilité et de l'extensibilité.

## 2. Stack Technique
- **Langage** : JavaScript (ES6+)
- **Moteur de Rendu** : Canvas API (HTML5)
- **Architecture** : Modèle-Vue-Contrôleur (MVC) simplifié ou Entité-Composant-Système (ECS) léger.
- **Plateformes** : Navigateurs Web (Desktop + Mobile)
- **Gestion d'État** : State pattern natif.

## 3. Séparation des Responsabilités (SoC)

### Moteur de Jeu (Engine)
- Gestion de la boucle de jeu (`requestAnimationFrame`).
- Gestion du temps (`delta time`).
- Système de collision (AABB ou cercles).
- Gestion des entrées (Clavier, Touch/Joystick).

### Logique (Logic)
- Gestion des vagues d'ennemis.
- Logique de tir automatique.
- Montée de niveau et système d'améliorations.
- Progression entre les phases.

### Données (Data)
- Fichiers JSON de configuration.
- Paramètres des phases, ennemis, boss et améliorations.
- État persistant du joueur (statistiques).

### Rendu (Rendering)
- Dessin des sprites et effets visuels sur le Canvas.
- Interface Utilisateur (UI) : Vie, XP, menu d'améliorations.
- Optimisé pour le front-end sans dépendances lourdes.

## 4. Architecture Modulaire
L'ajout d'un nouveau niveau ou d'un nouvel ennemi ne doit nécessiter **aucune modification du code source**. Seuls les fichiers de configuration JSON doivent être édités.
