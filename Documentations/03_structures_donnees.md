# Structures des Données (JSON)

## 1. Structure d'une Phase (Level)
```json
{
  "id": "phase_01",
  "name": "Avant la naissance",
  "background": "assets/bg_sperm.png",
  "player_sprite": "assets/sperm_idle.png",
  "enemies": ["enemy_sperm_alpha", "enemy_sperm_fast"],
  "boss": "boss_ovule",
  "duration_before_boss": 60,
  "difficulty_multiplier": 1.0,
  "upgrades_pool": ["damage_up", "fire_rate_up"]
}
```

## 2. Structure d'un Ennemi
```json
{
  "id": "enemy_sperm_alpha",
  "hp": 10,
  "speed": 50,
  "damage": 1,
  "sprite": "assets/enemy_1.png",
  "pattern": "follow_player",
  "drop_xp": 5
}
```

## 3. Structure d'une Amélioration (Upgrade)
```json
{
  "id": "fire_rate_up",
  "name": "Cadence Rapide",
  "description": "Augmente la vitesse de tir de 10%",
  "type": "stat_modifier",
  "stat": "fire_rate",
  "modifier": 0.1,
  "is_relative": true
}
```

## 4. Structure Globale du Jeu
Un fichier `game_config.json` servira de point d'entrée, listant l'ordre des phases et les variables globales (vitesse de base, portée initiale, etc.).
