# Système d'Animation Data-Driven

Ce document définit le fonctionnement du système d'animation universel pour le jeu. Ce système permet de piloter l'apparence visuelle des entités (Joueur, Ennemis, Boss, Projectiles) entièrement via les fichiers JSON sans modifier le code JavaScript.

## 1. Structure JSON des Visuels

Chaque entité doit posséder un bloc `visuals` dans son fichier de données respectif.

```json
"visuals": {
    "type": "sprite",           // 'sprite' (image) ou 'shape' (géométrique)
    "width": 32,                // Optionnel : Largeur d'affichage. Si omis, calculée via l'aspect ratio
    "height": 32,               // Optionnel : Hauteur d'affichage. Si omis, calculée via l'aspect ratio
                                // Si les deux sont omis, taille originale de l'image
    "displayOffset": {          // Centrage visuel (optionnel)
        "x": 0, 
        "y": 0 
    },
    "directionMode": "flip",    // "none", "flip", "rotate", "4_way", "8_way"
    "hitFlash": true,           // Active le flash blanc lors des dégâts
    "animations": {
        "idle": {
            "frames": ["assets/units/player_idle_01.png", "assets/units/player_idle_02.png"],
            "frameRate": 8,
            "loop": true
        },
        "walk": {
            "frames": ["assets/units/player_walk_01.png", "assets/units/player_walk_02.png"],
            "frameRate": 12,
            "loop": true
        },
        "hurt": {
            "frames": ["assets/units/player_hurt.png"],
            "frameRate": 1,
            "loop": false,
            "duration": 200 // Durée forcée de l'état "blessé"
        }
    }
}
```

## 2. Modes de Direction (`directionMode`)

Le moteur adapte le rendu selon la nature de l'entité :

| Mode | Logique | Usage Idéal |
| :--- | :--- | :--- |
| **`none`** | L'image reste fixe quelle que soit la direction. | Aura, Flaque, Cercle. |
| **`flip`** | L'image est inversée horizontalement si `velocity.x < 0`. | Personnage de profil (type Platformer). |
| **`rotate`** | L'image subit une rotation (Canvas rotate) vers l'angle du mouvement. | **Spermatozoïde**, Flèches, Projectiles. |
| **`4_way`** | Cherche des sous-animations `up`, `down`, `left`, `right`. | RPG 2D (Top-down traditionnel). |
| **`8_way`** | Idem 4_way + diagonales (`up_left`, etc.). | Action Game fluide. |

## 3. Gestion des États d'Animation

Le code JavaScript doit envoyer l'un des états suivants à l' `Animator` :

- **`idle`** : Quand l'entité ne bouge pas.
- **`walk`** : Quand l'entité a une vitesse non nulle.
- **`hurt`** : Activé pendant une courte durée après `takeDamage()`.
- **`attack`** : Déclenché lors d'un tir ou d'une action.
- **`death`** : Joué avant la suppression de l'entité.

## 4. Pipeline Technique

1. **Chargement** : Le `DataManager` repère tous les chemins d'images dans les JSON et les pré-charge via un `ImageCache`.
2. **Assignation** : Chaque instance d'entité (`Player`, `Enemy`) instancie un composant `Animator`.
3. **Mise à jour** : A chaque `update()`, l'entité donne son état et sa direction à l' `Animator`.
4. **Rendu** : La méthode `draw()` de l'entité délègue l'affichage au `Renderer` qui applique les transformations (rotation, flip, flash) définies par le JSON.

## 5. Mode Fallback (Sécurité)

Si le champ `visuals` est absent ou si le `type` est `shape`, le moteur utilise les propriétés `color` et `radius` d'origine pour dessiner un cercle. Cela assure que le jeu reste jouable même si les assets graphiques ne sont pas encore prêts.
