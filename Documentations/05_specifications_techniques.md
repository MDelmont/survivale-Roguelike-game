# Spécifications Techniques

## 1. Statistiques du Personnage (Player Stats)
- `hp` (Points de vie) : Quantité de dégâts que le joueur peut subir avant de mourir.
- `speed` (Vitesse) : Vitesse de déplacement en pixels/seconde.
- `damage` (Dégâts) : Dégâts infligés par chaque projectile.
- `fire_rate` (Cadence) : Temps entre deux tirs (en secondes).
- `range` (Portée) : Distance maximale à laquelle les balles sont actives.
- `projectile_speed` : Vitesse de déplacement des balles.
- `projectile_count` : Nombre de projectiles tirés simultanément.
- `pickup_radius` : Zone de collecte des jetons d'XP.

## 2. Statistiques des Ennemis (Enemy Stats)
- `hp` : Santé de l'ennemi.
- `speed` : Vitesse de déplacement vers le joueur.
- `damage_collision` : Dégâts infligés au joueur au contact.
- `attack_pattern` : `follow`, `orbit`, `dash`, etc.
- `xp_value` : Quantité d'XP donnée à la mort.

## 3. Gestion de l'État (State Management)
L'état global sera stocké dans un objet central `GameState` comprenant :
- Les stats courantes du joueur (modifiées par les upgrades).
- Le chronomètre de la phase.
- La liste des entités actives (joueur, ennemis, balles, loot).
- Les données de la phase actuelle chargées depuis le JSON.

## 4. Rendu (Rendering)
- Utilisation de `ctx.drawImage()` pour les sprites (placeholders PNG/SVG).
- Utilisation de `ctx.strokeRect()` ou `ctx.arc()` pour les debug/placeholders simples.
- UI dessinée sur un layer séparé ou en haut de la pile de rendu Canvas.

## 5. Performance
- Recyclage d'objets (Object Pooling) pour les projectiles et les ennemis afin d'éviter le Garbage Collection fréquent sur mobile.
- Support des résolutions d'écran dynamiques (Canvas scaling).
