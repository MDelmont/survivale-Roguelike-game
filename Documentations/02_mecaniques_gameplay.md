# Mécaniques de Gameplay

## 1. Boucle de Jeu Principale
1. **Déplacement** : Le joueur évite les ennemis.
2. **Combat** : Le personnage tire automatiquement sur l'ennemi le plus proche ou dans la direction du mouvement (selon config).
3. **Collecte** : Les ennemis vaincus laissent des jetons d'XP.
4. **Progression** : L'accumulation d'XP déclenche une montée de niveau.
5. **Amélioration** : Le joueur choisit un bonus parmi trois options aléatoires.
6. **Boss** : Un timer indique le temps restant avant l'apparition du boss de la phase.
7. **Fin de Phase** : La phase ne se termine que lorsque le boss est vaincu. Sa défaite permet de passer à la phase suivante.

## 2. Contrôles
- **Desktop** : ZQSD ou touches fléchées pour le déplacement.
- **Mobile** : Joystick virtuel tactile sur la partie gauche/droite de l'écran.
- **Tir** : Entièrement automatique (pas de bouton de tir).

## 3. Système de Tir
- **Ciblage** : Automatique (priorité à la distance ou à la vie).
- **Projectiles** : Gérés par le moteur avec des propriétés de vitesse, dégâts, et effets (perforation, explosion).

## 4. Système d'Améliorations (Upgrades)
- Les améliorations sont cumulatives.
- Elles impactent les statistiques de base (vitesse, cadence) ou ajoutent des comportements (balles rebondissantes, bouclier).
- **Persistance** : Les bonus acquis lors d'une phase sont conservés pour les phases suivantes.

## 5. Gestion des Vagues
- Intensité croissante selon le temps écoulé dans la phase.
- Types d'ennemis variant selon la phase narrative.
