# Spécification Niveau : Flash & Le Monde Playmobil

Ce document détaille tous les paramètres techniques pour le niveau inspiré de l'incident avec Flash, traité sous l'angle de la thérapie par le jeu (Playmobil).

---

## 1. Configuration de la Phase
| Champ | Valeur / ID | Description |
| :--- | :--- | :--- |
| **ID de la Phase** | `3` | Phase de transition post-traumatique. |
| **Nom de la Zone** | `"Le Monde de Plastique"` | Un environnement de chambre d'enfant géante. |
| **Durée (sec)** | `180` | Temps de "digestion" de l'événement. |
| **ID Joueur** | `anthony_playmo` | Version rigide et articulée d'Anthony. |
| **ID Boss** | `flash_playmo_boss` | Le Colley version jouet disproportionné. |
| **IDs Ennemis** | `[chien_playmo, seringue_geante, parent_fige]` | Monstres symboliques. |
| **IDs Armes Loot** | `[epee_plastique, bouclier_puzzle]` | Équipement de jeu. |
| **ID Intro Story**| `flashback_flash_1` | Récit de la morsure et du choc. |
| **ID Outro Story**| `cloture_flash_1` | Résolution et fin de la peur. |
| **Fond (Canvas)** | `assets/images/backgrounds/playmo_room.png` | Sol en moquette bleue avec plots. |

---

## 2. Personnage : Anthony (Playmobil)
*Un personnage aux mouvements saccadés mais extrêmement robuste.*

| Statistique | Valeur | Description |
| :--- | :--- | :--- |
| **HP / Max HP** | `150` | Plus résistant que la version normale. |
| **Vitesse** | `180` | **Pénalité** : Déplacement lent et rigide. |
| **Rayon XP** | `100` | Attraction standard. |
| **XP Niveau 2** | `40` | Montée en puissance rapide. |
| **Sprite ID** | `players/anthony_playmo.png` | Mains en "U", jambes droites. |
| **Animations** | `idle, walk_rigid` | Pas de flexion des genoux. |

---

## 3. Bestiaire (Les Monstres Playmo)

| Champ | Chien Anguleux | Seringue Géante | Parent Figé |
| :--- | :--- | :--- | :--- |
| **ID Technique** | `chien_playmo` | `seringue_geante` | `parent_fige` |
| **Points de Vie** | `30` | `15` | `200` |
| **Dégâts Contact**| `5` | `15` | `1` (Obstacle) |
| **Vitesse** | `220` | `300` (Rush) | `20` |
| **XP Donnée** | `10` | `20` | `15` |
| **Comportement** | Erratique, mâchoires cliquetantes. | Apparaît en piqué. | Se déplace très peu, bloque le passage. |
| **Animations** | `walk, death_burst` | `fly, sting` | `static_hover` |

---

## 4. Boss Final : Flash (Version Playmobil)
*Le boss ne meurt pas, il est "rangé" ou "apaisé".*

- **HP** : `1500` (Barre de vie à vider pour déclencher la phase de reconstruction).
- **Vitesse** : `120` (Attaques prévisibles et cycliques).
- **Pattern de Tir** : `circle_snap` (Salves de balles en plastique qui s'arrêtent net).
- **Attaque Spéciale** : "Le Gel" - Flash se fige, devient invincible, et des pièces de Playmobil tombent du ciel.
- **Projectiles** : `assets/images/projectiles/plastic_ball.png`.
- **Mécanique Unique** : Le boss perd de la défense à chaque fois que le joueur ramasse une "Pièce de Scène" (Chien, Enfant, Hôpital) tombée lors du combat.

---

## 5. Arsenal & Équipement

| Arme | ID | Type | Effet Spécial |
| :--- | :--- | :--- | :--- |
| **Arme de Départ**| `billes_plastique` | `attack` | Projectiles multiples à courte portée. |
| **Loot Optionnel** | `puzzle_orbital` | `defense` | 4 pièces de puzzle gravitant autour du joueur. |
| **Loot Optionnel** | `calme_aura` | `aoe` | Aura bleue qui ralentit (`isSlowing`) les ennemis proches. |

### Upgrades (Billes en Plastique)
1. **Niv 2** : Dégâts +20%.
2. **Niv 3** : +1 Projectile (Tir triple).
3. **Niv 4** : Cadence de tir +30% (`fireRate` réduit).
4. **Niv 5** : "Explosion de Joie" (`isExplosive`) - Les billes éclatent en confettis.

---

## 6. Narration (Transitions)

### Intro : Le Souvenir de Flash
- **Page 1** : (Titre: Août 1996) "Un soir d'orage à Ychoux..."
- **Page 2** : (Image: Flash_attack.png) "L'accident. 13 points de suture. Le monde s'arrête."
- **Page 3** : "Mais ce n'est qu'un mauvais souvenir qu'on va réorganiser ensemble."

### Outro : La Peur Apprivoisée
- **Page 1** : "Flash est redevenu un simple jouet. Il n'a plus de dents, juste du plastique."
- **Page 2** : (Image: anthony_dog_beach.png) "Une semaine plus tard sur la plage, tu cours vers un berger allemand."
- **Page 3** : "La cicatrice reste, mais la peur s'est envolée."

---

## 7. Checklist Visuelle (Assets à créer)

### Personnages & Monstres
- [ ] `anthony_playmo` (Idle, Walk) - Style jaune/bleu plastique.
- [ ] `chien_playmo` (Walk, Death) - Colley aux formes cubiques.
- [ ] `seringue_geante` (Attack) - Transparente avec du liquide fluo.
- [ ] `parents_playmo` (Static) - Jean-Claude et Maman en figurines.

### Environnement & UI
- [ ] `playmo_room_bg` - Sol moquette, murs avec plinthes géantes.
- [ ] `scenery_pieces` - Icônes (Maison, Chien, Petit Garçon) pour le boss.
- [ ] `plastic_projectiles` - Petites billes colorées.
- [ ] `story_flashback_1` - Illustration de l'accident (style doux/symbolique).
- [ ] `story_beach_1` - Illustration finale sur la plage d'Arcachon.
