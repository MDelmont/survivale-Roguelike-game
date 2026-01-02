# Roadmap de Développement - Survival-Shooter

Cette roadmap détaille les étapes de développement par jalons testables. Chaque étape doit être validée avant de passer à la suivante.

## Étape 1 : Fondation et Rendu de Base
- [x] Mettre en place la structure des dossiers (`js/`, `data/`, `assets/`).
- [x] Créer le fichier `index.html` avec un `<canvas>`.
- [x] Initialiser la boucle de jeu principale (`requestAnimationFrame`) et le "Delta Time".
- [x] **Test** : Un écran noir/coloré qui affiche "FPS" dans un coin.

## Étape 2 : Le Joueur et les Entrées
- [x] Créer la classe `Player`.
- [x] Implémenter les contrôles clavier (ZQSD).
- [x] Implémenter le joystick tactile (base visuelle et logique).
- [x] **Test** : Un carré (placeholder) se déplace à l'écran via clavier et tactile.

## Étape 3 : Système de Tir Automatique
- [x] Créer la classe `Projectile`.
- [x] Logique de tir automatique à intervalle régulier.
- [x] **Test** : Le joueur tire des projectiles en continu dans une direction fixe ou vers le haut.

## Étape 4 : Les Ennemis et Collisions
- [x] Créer la classe `Enemy`.
- [x] Système de spawn simple (aléatoire autour de l'écran).
- [x] Implémenter les collisions (Cercle-Cercle ou AABB) entre Proj/Ennemi et Joueur/Ennemi.
- [x] **Test** : Des ennemis arrivent, on peut les détruire, et ils nous infligent des dégâts/mort.

## Étape 5 : XP, Loot et Level Up
- [x] Système de drop de jetons d'XP après la mort d'un ennemi.
- [x] Collecte automatique des jetons à proximité.
- [x] Barre d'XP et déclenchement du niveau supérieur.
- [x] **Test** : Monter de niveau après avoir tué assez d'ennemis.

## Étape 6 : Système d'Améliorations (Upgrades)
- [ ] Créer le menu d'upgrade qui met le jeu en pause.
- [ ] Implémenter quelques bonus de base (Vitesse, Dégâts, Cadence).
- [ ] Logique de modification des statistiques du joueur.
- [ ] **Test** : Choisir une amélioration et constater l'effet immédiat en jeu.

## Étape 7 : Moteur Data-Driven (Phases)
- [ ] Charger une phase depuis un fichier JSON (vitesse, ennemis, background).
- [ ] Gérer la transition entre le chargement et le début du jeu.
- [ ] **Test** : Le jeu charge ses paramètres depuis un fichier JSON externe.

## Étape 8 : Le Boss et Fin de Phase
- [ ] Implémenter le timer de phase (temps avant boss).
- [ ] Apparition du boss et arrêt du spawn classique.
- [ ] Condition de victoire : mort du boss -> écran de fin de phase.
- [ ] **Test** : Survivre au timer, battre le boss et voir l'écran de succès.

## Étape 9 : Menus et Interface (HUD)
- [ ] HUD complet (Santé, XP, Niveau, Timer).
- [ ] Écran titre, Écran Game Over.
- [ ] **Test** : Une boucle complète (Menu -> Jeu -> Mort/Victoire -> Menu).

## Étape 10 : Persistance et Contenu
- [ ] Sauvegarde auto de la phase débloquée dans le `localStorage`.
- [ ] Création du contenu final pour les 6 phases (Spermatozoïde -> Mariage).
- [ ] Intégration des assets visuels (si disponibles).
- [ ] **Test** : Jeu complet jouable de bout en bout.
