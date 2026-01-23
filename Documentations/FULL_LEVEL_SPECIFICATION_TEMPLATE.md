# Spécification Complète : Design d'un Niveau de Jeu

Ce document est un modèle global regroupant TOUS les éléments à définir pour créer un niveau complet et fonctionnel. Utilisez ce guide pour préparer les données avant de les saisir dans le **Creator**.

---

## 1. Configuration de la Phase (Le Cœur du Niveau)
Définit les règles de base et référence les autres entités.

| Champ | Valeur / ID | Description |
| :--- | :--- | :--- |
| **ID de la Phase** | `1` | Ordre d'apparition. |
| **Nom de la Zone** | `"Nom"` | S'affiche à l'écran. |
| **Durée (sec)** | `120` | Temps avant le Boss. |
| **ID Joueur** | `anthony` | Référence au Personnage (Sec. 2). |
| **ID Boss** | `flash_boss` | Référence au Boss (Sec. 4). |
| **IDs Ennemis** | `[bille, robot]` | Liste des Monstres (Sec. 3). |
| **IDs Armes Loot** | `[laser, shield]` | Armes trouvables au sol (Sec. 5). |
| **ID Intro Story**| `intro_1` | Histoire de début (Sec. 6). |
| **ID Outro Story**| `outro_1` | Histoire de fin (Sec. 6). |

---

## 2. Personnage (Joueur)
Définit les statistiques et visuels du héros contrôlé.

| Statistique | Valeur | Description |
| :--- | :--- | :--- |
| **HP / Max HP** | `100` | Santé initiale et maximale. |
| **Vitesse** | `250` | Rapidité de mouvement. |
| **Rayon XP** | `120` | Distance d'attraction de l'XP. |
| **XP Niveau 2** | `50` | Point requis pour le 1er level up. |
| **Sprite ID** | `personnages/anthony.png` | Image de base. |
| **Animations** | `idle, walk` | Frames d'animation requises. |

---

## 3. Bestiaire (Les Monstres)
Répétez ce tableau pour chaque ennemi listé dans la Phase.

| Champ | Ennemi 1 | Ennemi 2 |
| :--- | :--- | :--- |
| **ID Technique** | `bille_mammouth` | `robot_playmo` |
| **Points de Vie** | `20` | `50` |
| **Dégâts Contact**| `10` | `25` |
| **Vitesse** | `150` | `80` |
| **XP Donnée** | `5` | `15` |
| **Rayon Hitbox** | `15` | `25` |
| **Animations** | `walk, death` | `walk, death` |

---

## 4. Le Boss (Défi Final)
Spécifications uniques pour le combat de fin de phase.

### Statistiques & Mouvement
- **HP** : `1000` (Barre de vie affichée en haut).
- **Vitesse** : `100`.
- **Pattern de Mouvement** : `constant` (suit le joueur), `fixed` (statique), `rush` (charge).

### Attaque & Projectile
- **Pattern de Tir** : `spiral`, `circle`, `vortex`, `cross`, `star`...
- **Cadence de Tir** : `800` ms (temps entre salves).
- **Visuel Projectile** : Image spécifique pour les tirs du boss.
- **Animations Boss** : `idle, walk, attack, hurt, death`.

---

## 5. Arsenal (Armes & Upgrades)
Chaque arme référence des projectiles et des améliorations.

| Paramètre | Valeur | Description |
| :--- | :--- | :--- |
| **ID Arme** | `lance_billes` | Identifiant unique. |
| **Type** | `attack` | **CRITIQUE** : Uniquement `attack` (projectile), `defense` (orbital) ou `aoe` (aura). |
| **Dégâts Base** | `15` | Puissance initiale. |
| **Auto-fire Rate**| `400ms` | Vitesse de tir (uniquement pour `attack` et `defense`). |
| **Nb Projectiles** | `1` | Nombre de balles ou satellites. |
| **Percement** | `0` | Pour `attack` : ennemis traversés. |
| **Explosif ?** | `Non` | Si Oui : inflige des dégâts de zone à l'impact. |

### Upgrades (Améliorations)
Définissez 3 à 5 niveaux pour chaque arme :
1. **Niv 2** : Dégâts +20%
2. **Niv 3** : Cadence de tir +30%
3. **Niv 4** : +1 Projectile
4. **Niv 5 (MAX)** : Mode spécial (ex: Balles rebondissantes).

---

## 6. Narration (Transitions)
Définit ce que le joueur voit entre l'action.

### Structure d'une Page de Story
Pour chaque transition (Intro/Outro), listez les pages :
- **Titre** : `"Le début de l'aventure"`
- **Texte** : `"Il était une fois..."`
- **Illustration** : Image plein écran (assets/images/story/...).
- **Musique** : Ambiance sonore (IDs : epic, sad, funny).
- **Transition** : `fade`, `slide` ou `zoom`.

---

## 7. Checklist Visuelle (Assets à créer)
Vérifiez que vous avez bien préparé les fichiers images suivants :
- [ ] Sprites Joueur (Idle / Walk)
- [ ] Sprites Monstres (Walk / Death pour chaque type)
- [ ] Sprites Boss (Complet + Projectile)
- [ ] Sprites Projectiles Armes
- [ ] Illustrations Story (Intro / Outro)
- [ ] Image de Fond de Phase (Level Background)
- [ ] Sprites Loots (Cristal XP / Icone Arme)
