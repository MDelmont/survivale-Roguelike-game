# Script IA : Assistant de Création de Personnage (Joueur)

Ce document contient un prompt structuré à copier-coller dans une IA (comme Claude ou ChatGPT) pour générer des spécifications de nouveaux personnages parfaitement compatibles avec le moteur du jeu.

---

## Le Prompt à copier :

 **Rôle :** Tu es un Game Designer expert en Roguelikes (type Vampire Survivors).
 
 **Objectif :** Créer une spécification technique détaillée pour un nouveau personnage joueur basé sur un concept ludique.
 
 **Instructions :**
 Propose un personnage en respectant strictement les paramètres techniques suivants :
 
 ### 1. Statistiques de Base (Équilibre)
 Donne des valeurs numériques cohérentes avec ces bases :
 - **speed** (vitesse) : Base 250. (Moins = lourd, Plus = agile).
 - **hp / maxHp** : Base 100.
 - **fireRate** (ms) : Base 300. (Plus petit = tire plus vite).
 - **damage** : Base 10.
 - **projectileSpeed** : Base 400.
 - **pickupRadius** : Base 100. (Rayon d'attraction XP).
 - **xpNextLevel** : Base 50. (Points requis pour le niv 2).
 
 ### 2. Configuration Visuelle (Visuals)
 Définis le style visuel :
 - **type** : Toujours "sprite".
 - **width / height** : Taille d'affichage en pixels (ex: 64x64).
 - **directionMode** : Choisir entre "none" (fixe), "flip" (miroir), "rotate" (suit le mouvement) ou "4_way" (nécessite 4 sets d'animations).
 - **hitFlash** : Toujours true (pour le feedback visuel).
 
 ### 3. Système d'Animations
 Liste les frames nécessaires pour les états : `idle`, `walk`, `hurt`, `death`, `attack`.
 Précise si c'est une animation simple ou 4-way directionnelle.
 
 ---
 **CONCEPT DU PERSONNAGE :**
 [DÉCRIS ICI TON IDÉE : ex: Un chevalier en armure lourde, un mage rapide, etc.]
 
 ---
 **FORMAT DE RÉPONSE ATTENDU :**
 1. Nom et Lore court.
 2. Tableau des Statistiques.
 3. Description visuelle et Mode de direction recommandé.
 4. Liste des assets à créer (frames d'animations).
 5. Bloc JSON final prêt pour l'intégration.

---

## Conseils d'utilisation :

1. **Cohérence Narrative :** Si vous créez un personnage basé sur une anecdote (ex: "Anthony enfant au judo"), demandez à l'IA d'adapter les stats : haute vitesse mais HP faibles pour un enfant.
2. **Mode de Direction :** 
    - Utilisez **flip** pour des personnages vus de côté (style 2D classique).
    - Utilisez **rotate** pour des personnages vus de dessus qui "s'orientent" vers leur cible.
    - Utilisez **4_way** pour un style RPG plus traditionnel (nécessite plus de travail graphique).
3. **JSON :** L'IA générera un bloc JSON propre. Vous pourrez directement comparer les valeurs avec l'éditeur **Creator**.

---

## Exemple de résultat attendu (JSON)
```json
{
  "name": "Anthony Judo",
  "speed": 280,
  "hp": 80,
  "maxHp": 80,
  "fireRate": 400,
  "damage": 25,
  "projectileSpeed": 200,
  "pickupRadius": 130,
  "xpNextLevel": 45,
  "visuals": {
    "type": "sprite",
    "width": 64,
    "directionMode": "flip",
    "hitFlash": true,
    "animations": {
      "idle": { "frames": ["players/judo_idle.png"], "frameRate": 10, "loop": true },
      "walk": { "frames": ["players/judo_walk1.png", "players/judo_walk2.png"], "frameRate": 12, "loop": true }
    }
  }
}
```
