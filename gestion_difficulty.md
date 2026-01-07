# Gestion de la Difficulté Dynamique

Ce document détaille la stratégie proposée pour gérer et équilibrer la difficulté de manière progressive et adaptative dans **EVG Anthony Survivor**.

## 1. Le Système de "Budget de Menace" (Threat Budget)

Au lieu d'utiliser un taux d'apparition (`spawn_rate`) fixe, le serveur de jeu (ou la boucle principale) devrait utiliser un système de budget :

- **Accumulation** : Toutes les secondes, le jeu génère des "Points de Menace" (PM).
- **Dépense** : Le jeu pioche dans la liste des ennemis autorisés pour la phase et "achète" des monstres avec son budget accumulé.
- **Réserve** : Si le budget est trop bas pour l'ennemi le moins cher, il attend le tick suivant.

## 2. Score de Difficulté par Ennemi (`threatLevel`)

Chaque ennemi dans `enemies.json` possède un coût. L'unité de référence est **10 PM** pour l'ennemi le plus faible.

| Type d'Ennemi | Coût Recommandé | Explication |
| :--- | :--- | :--- |
| **Faible** | 10 | Unité de base, apparaît par packs. |
| **Moyen** | 25 | Demande 2-3 tirs pour mourir. |
| **Fort** | 50 | Nécessite une attention particulière. |
| **Elite** | 100+ | Unité rare et très dangereuse. |

## 3. Formule d'Accumulation Harmonisée (PM/sec)

Le jeu calcule chaque seconde combien de points il ajoute au budget. La formule est conçue pour être prévisible et corrélée à la durée de la phase :

`Gain_Total = (Croissance_Base + Progression_Phase + Puissance_Joueur) * Multiplicateur_Phase`

- **Croissance_Base** (Réglable par phase) : Le socle minimal (ex: 20 PM/sec = 2 ennemis/sec).
- **Progression_Phase** (Automatique) : Augmente de 0 à `Croissance_Base` en fonction du temps écoulé dans la phase (0% -> 100% de la barre de temps).
- **Puissance_Joueur** (Automatique) :
    - +2 PM/sec par Niveau du joueur au-dessus du lvl 1.
    - +5 PM/sec par Arme supplémentaire possédée (au-delà de la 1ère).
- **Multiplicateur_Phase** (Réglable par phase) : Facteur global d'intensité (X1.0 par défaut).

### Exemple concret :
Une phase de 60s réglée sur **20 PM/sec** avec un multiplicateur de **1.0** :
- **À 0s** : ~20 PM/sec (2 ennemis/sec).
- **À 30s (lvl 5, 2 armes)** : (20 + 10 + 8 + 5) = ~43 PM/sec.
- **À 60s (juste avant le boss)** : L'intensité aura environ doublé par rapport au départ.

## 4. Paramétrage des Phases

Nous devrions enrichir `phases.json` avec des paramètres de difficulté :

```json
{
  "id": 1,
  "difficulty_settings": {
    "initial_budget_rate": 20,
    "max_budget_rate": 150,
    "growth_type": "exponential",
    "player_power_influence": 0.5,
    "spawn_waves": [
      { "time": 30, "multiplier": 2.0, "duration": 5 },
      { "time": 60, "multiplier": 3.0, "duration": 10 }
    ]
  }
}
```

## 5. Spécificités des Mobs et IA

La difficulté ne vient pas que du nombre, mais de la **combinaison** des types :

1. **Synergie Chaos** : Mélanger des `Tank` (qui bloquent les projectiles) avec des `Fast` (qui contournent) et des `Ranged` (qui tirent de loin).
2. **Contrôle de Zone** : Utiliser des ennemis avec des auras de ralentissement pour forcer le joueur à rester dans une zone dangereuse.
3. **Comportement de Meute** : Certains ennemis pourraient avoir une vitesse augmentée s'ils sont proches d'autres ennemis du même type.

## 6. Prochaines Étapes pour le Creator

Pour permettre de régler tout cela facilement :

1. **Module Ennemis** : Ajouter un champ "Threat Level" (Coût de spawn).
2. **Module Phases** : Remplacer le `spawn_rate` simple par un éditeur de "Courbe de Difficulté" (Graphique ou paramètres Min/Max/Vitesse).
3. **Simulateur** : Ajouter un petit estimateur dans le Creator qui indique si la phase semble "Facile", "Normale" ou "Impossible" en calculant le DPS théorique nécessaire.

---
*Ce document sert de base de réflexion avant l'implémentation technique des nouveaux algorithmes de spawn.*
