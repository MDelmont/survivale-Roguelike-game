# Spécifications Techniques : Schémas JSON

Ce document définit tous les champs possibles pour les fichiers de configuration du jeu. Ces schémas servent de base pour le développement de l'outil **Creator**.

---

## 1. Bloc Visuel (Commun)
Utilisé par le Joueur, les Ennemis, les Boss et les Projectiles.

| Champ | Type | Valeurs / Description |
| :--- | :--- | :--- |
| `type` | String | `"sprite"` (image) ou `"shape"` (rectangle/cercle). |
| `width` | Number | Largeur d'affichage en pixels. |
| `height` | Number | Hauteur d'affichage (optionnel, conserve le ratio si omis). |
| `color` | String | Couleur (ex: `"#ff0000"`) si `type` est `"shape"`. |
| `directionMode` | String | `"none"`, `"flip"` (miroir), `"rotate"` (orientation mouvement), `"4_way"`. |
| `angleOffset` | Number | Ajustement de l'angle en degrés. |
| `hitFlash` | Boolean | Si `true`, l'entité clignote au contact. |
| `animations` | Object | Dictionnaire d'animations (voir ci-dessous). |

### Structure d'une Animation
```json
"nom_animation": {
    "frames": ["chemin/image_1.png", "chemin/image_2.png"],
    "frameRate": 10,  // Images par seconde
    "loop": true      // Rejouer en boucle
}
```
*États courants : `idle`, `walk`, `hurt`, `death`, `attack`.*

---

## 2. Joueurs (`player.json`)
Contient la liste des personnages jouables.

```json
{
  "players": {
    "nom_id": {
      "name": "Nom Affiché",
      "speed": 250,
      "hp": 100,
      "maxHp": 100,
      "fireRate": 300,
      "damage": 10,
      "projectileSpeed": 400,
      "pickupRadius": 100,
      "xpNextLevel": 50,
      "visuals": { ... Bloc Visuel ... }
    }
  }
}
```

| Champ | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Nom du personnage (ex: Anthony). |
| `speed` | Number | Vitesse de déplacement de base. |
| `hp` / `maxHp` | Number | Santé initiale et maximale. |
| `pickupRadius`| Number | Rayon d'attraction de l'XP. |
| `xpNextLevel` | Number | Seuil pour le niveau 2. |
| `visuals` | Object | Bloc visuel (animations walk/idle). |

---

## 3. Ennemis (`enemies.json`)
Configurations des monstres de base.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Nom interne ou affiché. |
| `hp` | Number | Points de vie. |
| `speed` | Number | Vitesse de déplacement. |
| `damage` | Number | Dégâts au contact. |
| `xpValue` | Number | XP donnée à la mort. |
| `radius` | Number | Rayon de la hitbox. |
| `color` | String | Couleur de secours (fallback). |
| `visuals` | Object | Bloc visuel de l'ennemi. |

---

## 4. Bosses (`bosses.json`)
Hérite des champs **Ennemis**, avec des spécificités de combat.

| Champ | Type | Valeurs / Description |
| :--- | :--- | :--- |
| `attackPattern` | String | Pattern de tir (ex: `spiral`, `circle`, `vortex`, `cross`, etc.). |
| `movePattern` | String | Type de mouvement (`constant`, `fixed`, `rush`). |
| `fireRate` | Number | Temps entre chaque salve de tir (en ms). |
| `visuals` | Object | Bloc visuel du boss. |
| `projectileVisuals`| Object | Bloc visuel des tirs du boss. |

---

## 5. Armes (`weapons.json`)
Configurations des attaques et bonus.

| Champ | Type | Valeurs / Description |
| :--- | :--- | :--- |
| `id` | String | Identifiant unique. |
| `name` | String | Nom affiché. |
| `type` | String | `"attack"` (projectile), `"defense"` (orbital), `"aoe"` (aura). |
| `stats.damage` | Number | Dégâts infligés. |
| `stats.fireRate` | Number | Cadence de tir (en ms). Plus bas = plus rapide. |
| `stats.projectileSpeed`| Number| Vitesse de la balle. |
| `stats.projectileCount`| Number| Nombre de projectiles simultanés. |
| `stats.piercingCount` | Number| Nombre d'ennemis traversés. |
| `stats.isExplosive` | Boolean | Dégâts de zone à l'impact. |
| `stats.isPoisonous` | Boolean | Dégâts sur la durée. |
| `stats.isSlowing` | Boolean | Ralentit l'ennemi. |
| `stats.radius` | Number | Rayon (pour orbital). |
| `stats.range` | Number | Portée (pour aura). |
| `visuals` | Object | Bloc visuel de l'arme/projectile. |

---

## 6. Phases (`phases.json`)
Structure du déroulement d'un niveau.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | Number | Numéro de la phase. |
| `name` | String | Nom de la phase. |
| `duration` | Number | Durée avant le boss (en ms). |
| `spawn_rate` | Number | Fréquence d'apparition des ennemis (en ms). |
| `enemy_types` | Array | Liste des IDs d'ennemis présents. |
| `player_id` | String | ID du joueur à utiliser (configuré dans `player.json`). |
| `boss_id` | String | ID du boss final. |
| `story_intro` | Array | Liste de pages de texte affichées **avant** le début de la phase. |
| `story_outro` | Array | Liste de pages de texte affichées **après** la victoire (mort du boss). |

### Structure d'une page d'histoire :
```json
{
    "title": "Le Titre de la Page",
    "text": "Le contenu narratif qui sera affiché sur l'écran.",
    "image": "assets/images/illustration.png" // Optionnel
}
```
| `default_weapon`| String | Arme de départ du joueur. |
| `available_weapons`| Array | Armes proposées en loot. |
