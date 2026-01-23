# Document de Design : Création d'une Phase de Jeu

Ce document définit tous les paramètres nécessaires pour concevoir et configurer une nouvelle phase dans le moteur de jeu. Il sert de guide pour remplir les informations dans l'outil **Creator**.

---

## 1. Informations Générales
Configuration de base de l'environnement et de la durée.

| Champ | Description | Exemple / Valeurs |
| :--- | :--- | :--- |
| **ID** | Identifiant numérique unique de la phase (ordre de progression). | `1`, `2`, `3`... |
| **Nom de la Zone** | Nom affiché de l'environnement ou du niveau. | `"Le Berceau d'Alexandre"`, `"Forêt d'Ychoux"` |
| **Image de Fond** | Chemin de l'asset utilisé pour le décor. | `assets/images/backgrounds/forest.png` |
| **Durée avant Boss** | Temps (en secondes) pendant lequel les vagues d'ennemis apparaissent. | `60`, `120`, `300` |
| **Spawn Rate** | Fréquence de base d'apparition des ennemis (en millisecondes). | `1000` (1 ennemi/sec) |

---

## 2. Système de Menace & Difficulté
Paramètres régulant l'intensité du combat au fil du temps.

| Champ | Description | Recommandation |
| :--- | :--- | :--- |
| **Multiplicateur d'Intensité** | Facteur multiplicateur pour la difficulté globale. | `1.0` (standard), `2.0` (difficile) |
| **Budget Initial (PM)** | Points de Menace (PM) disponibles au début de la phase. | `20` |
| **Budget Max (PM)** | Plafond de Points de Menace simultanés. | `200` |
| **Taux de croissance** | Vitesse à laquelle le budget de menace augmente (PM/sec). | `0.5` |

---

## 3. Entités & Configuration de Combat
Définition des acteurs présents dans la phase.

- **Joueur (`player_id`)** : L'ID du personnage sélectionnable (ex: `anthony`, `melodie`).
- **Boss de Fin (`boss_id`)** : L'ID du boss qui apparaît à la fin du chrono (ex: `flash_colley`).
- **Bestiaire (`enemy_types`)** : Liste des IDs des ennemis autorisés à apparaître comme mobs de base (ex: `bille_mammouth`, `playmobil_noir`).

---

## 4. Équipement & Butins (Loots)
Gestion de la progression de la puissance du joueur.

### Armes & Upgrades
- **Arme par défaut** : L'arme avec laquelle le joueur commence la phase (ex: `lance_billes`).
- **Taux de Drop Arme** : Probabilité (0 à 1) qu'un ennemi lâche une nouvelle arme. (Défaut: `0.25`).
- **Armes disponibles** : Liste des armes pouvant être trouvées au sol pendant la phase.
- **Améliorations disponibles** : Liste des upgrades proposés lors du passage de niveau (Level Up).

### Visuels des Butins
- **XP (Expérience)** : Sprite et taille (px) pour les orbes d'expérience.
- **Bonus Arme** : Sprite et taille (px) pour les objets de drop d'arme.

---

## 5. Narration & Transitions
Séquences d'histoire liées au déroulement de la phase.

### Transitions Disponibles
- **Intro** : Avant le début de la phase.
- **Outro** : Après la défaite du boss.
- **Défaite** : Mort du joueur.

### Paramètres d'une Page narrative
Chaque transition est composée d'une ou plusieurs pages avec les champs suivants :

| Champ | Description | Options / Unités |
| :--- | :--- | :--- |
| **Titre** | Texte principal affiché en haut. | Possibilité de masquer. |
| **Texte** | Le contenu narratif central. | Supporte plusieurs lignes. |
| **Illustration** | Image affichée au centre de l'écran. | Sélection depuis `assets/`. |
| **Fond (Background)** | Image ou couleur de fond de la page. | `assets/backgrounds/` |
| **Musique** | Ambiance sonore associée. | ID de la musique |
| **Durée** | Temps d'affichage automatique. | millisecondes (ex: `5000`) |
| **Animation** | Type d'entrée de la page. | `fade`, `slide`, `zoom`, `none` |
| **Styles** | Personnalisation visuelle. | Taille et couleur (Titre/Texte). |

---

## 6. Exemple de Structure JSON (Interne)
```json
{
  "id": 1,
  "name": "Installation de la Menace",
  "duration_before_boss": 60,
  "spawn_rate": 1000,
  "player_id": "anthony",
  "boss_id": "flash_dog",
  "enemy_types": ["bille", "robot"],
  "available_weapons": ["gun_lvl1", "shield"],
  "background_image": "assets/fonds/chambre.png",
  "transition_intro_id": "intro_naissance",
  "transition_outro_id": "outro_flash",
  "difficulty_multiplier": 1.2,
  "initial_threat_budget": 25,
  "max_threat_budget": 250,
  "threat_growth_rate": 0.8
}
```
