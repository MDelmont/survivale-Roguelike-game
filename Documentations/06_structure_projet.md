# Structure du Projet

L'arborescence doit refléter la séparation stricte entre le moteur, les données et le rendu.

```text
/
├── index.html              # Point d'entrée principal
├── assets/                 # Images, sons, polices
│   ├── sprites/
│   ├── backgrounds/
│   └── sounds/
├── data/                   # Fichiers de configuration JSON
│   ├── game_config.json
│   ├── phases/
│   ├── enemies/
│   └── upgrades/
├── js/                     # Code source JavaScript
│   ├── core/               # Moteur de jeu (Engine)
│   │   ├── Game.js         # Boucle principale
│   │   ├── Engine.js       # Physique, collisions
│   │   └── Input.js        # Clavier et Joystick
│   ├── entities/           # Logique des entités
│   │   ├── Entity.js
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   └── Projectile.js
│   ├── systems/            # Systèmes transversaux
│   │   ├── WaveManager.js
│   │   ├── UpgradeSystem.js
│   │   └── LevelManager.js
│   └── ui/                 # Rendu de l'interface
│       ├── HUD.js
│       └── Menu.js
├── css/                    # Styles (notamment pour l'UI HTML)
│   └── style.css
└── documentations/         # Ce dossier actuel
```
