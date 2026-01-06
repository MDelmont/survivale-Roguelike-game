# Guide : Créer une Phase de Jeu de A à Z

Ce guide explique comment créer une nouvelle étape (phase) dans votre jeu, en configurant les graphismes, les monstres, les armes et le boss final.

---

## Étape 1 : Préparer les Assets (Graphismes)

Avant de toucher aux fichiers JSON, placez vos images dans le dossier `assets/`.
- **Monstres** : `assets/monster/mon_stre_v1.png`, etc.
- **Joueur** : `assets/players/perso_v1.png`
- **Armes** : `assets/projectiles/balle.png`

> **Note** : Le système d'animation gère automatiquement les suites d'images (frames) si vous en listez plusieurs.

---

## Étape 2 : Créer ou Modifier un Ennemi (`data/enemies.json`)

Chaque ennemi est défini par ses statistiques et ses visuels.

```json
"mon_nouvel_ennemi": {
    "name": "Le Gardien",
    "hp": 50,           // Points de vie
    "speed": 100,       // Vitesse de déplacement
    "damage": 10,       // Dégâts au contact
    "xpValue": 25,      // XP donnée à la mort
    "radius": 15,       // Taille de la hitbox (collision)
    "color": "#ff0000", // Couleur de secours (si image absente)
    "visuals": {
        "type": "sprite",
        "width": 48,
        "directionMode": "rotate", // 'rotate' pour les spermatozoïdes
        "hitFlash": true,
        "animations": {
            "walk": {
                "frames": ["assets/monster/gardien_1.png", "assets/monster/gardien_2.png"],
                "frameRate": 8,
                "loop": true
            }
        }
    }
}
```

---

## Étape 3 : Configurer une Arme (`data/weapons.json`)

Vous pouvez créer une arme que le joueur pourra débloquer.

```json
{
    "id": "lance_bulles",
    "name": "Lance-Bulles",
    "type": "attack",
    "stats": {
        "damage": 15,
        "fireRate": 400,
        "projectileSpeed": 500,
        "projectileCount": 1
    },
    "visuals": {
        "type": "sprite",
        "width": 16,
        "animations": {
            "idle": { "frames": ["assets/projectiles/bulle.png"], "frameRate": 1 }
        }
    }
}
```

---

## Étape 4 : Configurer le Boss (`data/bosses.json`)

Le boss final de la phase a des stats plus élevées et des patterns d'attaque.

```json
"mon_boss_final": {
    "name": "Le Roi Spermatozoïde",
    "hp": 5000,
    "speed": 60,
    "damage": 25,
    "fireRate": 1200,
    "attackPattern": "spiral", // circle, spiral, spray, wall, vortex...
    "movePattern": "rush",      // constant, fixed, rush
    "radius": 100,
    "visuals": {
        "type": "sprite",
        "width": 128,
        "directionMode": "rotate",
        "animations": {
            "walk": { "frames": ["assets/monster/boss_v1.png", "assets/monster/boss_v2.png"], "frameRate": 4 }
        }
    },
    "projectileVisuals": {      // Le visuel des tirs du boss
        "type": "sprite",
        "width": 24,
        "animations": {
            "idle": { "frames": ["assets/projectiles/boss_shot.png"], "frameRate": 1 }
        }
    }
}
```

---

## Étape 5 : Assembler la Phase (`data/phases.json`)

C'est ici que vous liez tout ensemble pour définir le déroulement de la partie.

```json
{
    "id": 2,                    // Numéro de la phase (0, 1, 2...)
    "name": "Le Canal",         // Nom affiché
    "duration": 60000,          // Durée avant le boss (en ms, ex: 60s)
    "spawn_rate": 1000,         // Un ennemi toutes les 1000ms
    "enemy_types": ["basic_cell", "mon_nouvel_ennemi"], // Ennemis qui apparaissent
    "boss_id": "mon_boss_final", // ID défini dans bosses.json
    "default_weapon": "basic_shot", // Arme de départ
    "available_weapons": ["poison_shot", "lance_bulles"] // Armes déblocables
}
```

---

## Résumé du Workflow

1. **Images** -> Les mettre dans `assets/`.
2. **Ennemis/Boss/Armes** -> Les définir dans leurs JSON respectifs avec le bloc `visuals`.
3. **Phase** -> Créer l'objet dans `phases.json` en listant les IDs créés précédemment.
4. **Test** -> Lancer le jeu, la phase commencera après la précédente !

---
*Document conçu pour le système d'animation Data-Driven v1.0*
