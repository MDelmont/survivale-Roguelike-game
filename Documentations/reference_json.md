# Référence Complète des Champs de Données (JSON)

Ce document répertorie tous les champs utilisables dans les fichiers de configuration du jeu et les valeurs possibles pour chacun.

---

## 1. Phases de Jeu (`data/phases.json`)
Définit le déroulement d'une partie.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | Nombre | Identifiant unique de la phase (0, 1, 2...). |
| `name` | Chaîne | Nom de la zone affiché au début. |
| `duration` | Nombre | Temps avant l'apparition du boss (en millisecondes). |
| `spawn_rate` | Nombre | Intervalle entre chaque apparition d'ennemi (en ms). |
| `enemy_types` | Liste (ID) | IDs des ennemis (définis dans `enemies.json`) pouvant apparaître. |
| `boss_id` | ID | ID du boss (défini dans `bosses.json`) apparaissant à la fin. |
| `default_weapon` | ID | Arme donnée au joueur au début de cette phase. |
| `available_weapons` | Liste (ID) | IDs des armes proposées lors de la montée de niveau. |

---

## 2. Ennemis (`data/enemies.json`)
Définit les statistiques des monstres de base.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `name` | Chaîne | Nom interne/affiché de l'ennemi. |
| `hp` | Nombre | Points de vie. |
| `speed` | Nombre | Vitesse de déplacement. |
| `damage` | Nombre | Dégâts infligés au joueur au contact. |
| `xpValue` | Nombre | Gains d'expérience à la mort de l'ennemi. |
| `radius` | Nombre | Rayon de la hitbox (collision). |
| `color` | Couleur | Couleur de secours (ex: `"#ff0000"`). |
| `visuals` | Objet | Voir la section **Visuels et Animations**. |

---

## 3. Bosses (`data/bosses.json`)
Héritent des champs des ennemis, avec des options de combat supplémentaires.

| Champ | Type | Valeurs / Description |
| :--- | :--- | :--- |
| `attackPattern` | Liste | **Patterns de tir possibles** : `circle`, `spiral`, `double_spiral`, `spray`, `wave_spray`, `cross`, `vortex`, `flower`, `barrage`, `star`, `oscillator`, `wall`, `web`. |
| `movePattern` | Liste | **Types de mouvement** : <br>- `constant`: Suit le joueur.<br>- `fixed`: Reste à une position fixe.<br>- `rush`: Charge vers le joueur périodiquement. |
| `fireRate` | Nombre | Temps entre chaque pattern de tir (en ms). |
| `projectileVisuals`| Objet | Visuel spécifique pour les balles tirées par le boss. |

---

## 4. Armes et Projectiles (`data/weapons.json`)

| Champ | Type | Valeurs / Description |
| :--- | :--- | :--- |
| `type` | Liste | `attack` (Projectiles), `defense` (Orbitales), `aoe` (Aura autour du joueur). |
| `stats.damage` | Nombre | Dégâts par impact ou par seconde (aura). |
| `stats.fireRate` | Nombre | Vitesse de tir (ms). Plus bas = plus rapide. |
| `stats.projectileSpeed`| Nombre| Vitesse des projectiles. |
| `stats.projectileCount`| Nombre| Nombre de projectiles tirés simultanément. |
| `stats.piercingCount` | Nombre| Nombre d'ennemis qu'un projectile peut traverser. |
| `stats.isExplosive` | Booléen | Si `true`, explose à l'impact (dégâts de zone). |
| `stats.isPoisonous` | Booléen | Si `true`, inflige des dégâts sur la durée. |
| `stats.isSlowing` | Booléen | Si `true`, ralentit les ennemis touchés. |
| `stats.radius` | Nombre | Rayon de rotation (pour le type `defense`). |
| `stats.range` | Nombre | Rayon d'action (pour le type `aoe`). |

---

## 5. Visuels et Animations (Bloc `visuals`)
Commun à tous les éléments (Joueur, Ennemis, Boss, Projectiles).

| Champ | Type | Valeurs / Description |
| :--- | :--- | :--- |
| `type` | Liste | `sprite` (image) ou `shape` (forme simple). |
| `width` | Nombre | Largeur d'affichage (Optionnel, gère l'aspect ratio si seul). |
| `height` | Nombre | Hauteur d'affichage (Optionnel). |
| `directionMode` | Liste | **Modes d'orientation** : <br>- `none`: Fixe.<br>- `flip`: Mirroir horizontal selon la direction.<br>- `rotate`: Rotation vers la direction du mouvement.<br>- `4_way`: Utilise des animations up/down/left/right. |
| `angleOffset` | Nombre | Correction d'angle en degrés (ex: 90 si l'image pointe vers le haut). |
| `hitFlash` | Booléen | Si `true`, l'entité clignote en blanc quand elle prend des dégâts. |
| `animations` | Objet | Dictionnaire des états. États gérés : `idle`, `walk`, `hurt`, `death`, `attack`. |

### Structure d'une animation :
```json
"walk": {
    "frames": ["chemin/image1.png", "chemin/image2.png"],
    "frameRate": 10,   // Images par seconde
    "loop": true       // Recommencer l'animation à la fin
}
```

---

## 6. Joueur (`data/player.json`)
Statistiques de base au début d'une course.

| Champ | Description |
| :--- | :--- |
| `speed` | Vitesse de marche initiale. |
| `hp` / `maxHp` | Vie actuelle et vie maximale. |
| `pickupRadius` | Rayon pour attirer l'expérience au sol (magnétisme). |
| `xpNextLevel` | XP requise pour le niveau 2. |
