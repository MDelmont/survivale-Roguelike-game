# Catalogue des Attaques de Boss

Ce document répertorie tous les types d'attaques (`attackPattern`) disponibles pour les boss. Chaque pattern possède un comportement spécifique et peut être configuré via le paramètre `fireRate` (fréquence de tir).

## Patterns d'Attaque

| ID | Nom | Description | Intensité |
| :--- | :--- | :--- | :--- |
| `circle` | Cercle Radial | Un burst circulaire classique de 12 projectiles. | Basse |
| `spiral` | Spirale Étoilée | Une double spirale continue qui tourne autour du boss. | Haute |
| `double_spiral` | Spirale Double | Deux spirales tournant en sens opposé. Très dense. | Très Haute |
| `spray` | Éventail Ciblé | Un rideau de 5 balles orienté vers la position actuelle du joueur. | Moyenne |
| `wave_spray` | Vague Oscillante | Un tir continu qui balaie de gauche à droite. | Moyenne |
| `cross` | Croix Cardinale | Alterne entre un tir en forme de "+" et un tir en "X". | Moyenne |
| `vortex` | Vortex | 3 projectiles sortant en spirale rapide. | Haute |
| `flower` | Floraison | Onde de choc de 8 pétales avec des balles à deux vitesses différentes. | Haute |
| `barrage` | Déluge Chaotique | Rafales aléatoires dans toutes les directions à vitesses variables. | Chaos |
| `star` | Étoile Mystique | Tir en forme d'étoile à 5 branches. | Haute |
| `oscillator` | Oscillateur | 4 flux de balles qui ondulent de façon synchronisée. | Haute |
| `wall` | Muraille | Lignes de balles horizontales ou verticales balayant l'écran. | Tactique |
| `web` | Toile Arachnéenne | Spirale complexe dont la vitesse varie pour créer une "toile". | Très Haute |

## Paramètres de Configuration (JSON)

Dans `data/bosses.json`, un boss se définit ainsi :

```json
"mon_boss_id": {
    "name": "Nom du Boss",
    "hp": 2000,
    "speed": 50,
    "damage": 20,
    "fireRate": 1500,
    "attackPattern": "spiral",
    "movePattern": "constant",
    "radius": 80,
    "color": "#fff"
}
```

## Modes de Déplacement (`movePattern`)

*   `fixed`: Le boss reste immobile à sa position d'apparition.
*   `constant`: Le boss suit lentement le joueur en permanence.
*   `rush`: Le boss alterne entre des phases d'attente et des charges rapides vers le joueur.
*   `random`: Le boss se déplace vers des points aléatoires sur l'écran.
*   `orbit`: Le boss tourne autour du centre ou du joueur (à implémenter).
