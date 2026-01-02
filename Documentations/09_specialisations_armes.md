# Système d'Armes et Spécialisations (Data-Driven)

Ce système remplace et enrichit les précédentes mécaniques de spécialisations. Il base la progression sur des armes spécifiques à chaque phase, tout en permettant une évolution via le loot rare.

## 1. Fonctionnement Global
- **Arme de Phase** : Au début de chaque phase, le joueur est équipé de l'arme "par défaut" (ex: Spermatozoïde -> Tir de base, École -> Lance-Stylos).
- **Reliques d'Arme (Loot Doré)** : Chance rare (5%) lors de la mort d'un ennemi. Ramasser le loot ouvre un menu proposant de nouvelles armes ou d'améliorer l'actuelle.

## 2. Dictionnaire des Propriétés (`weapons.json`)

Voici la liste exhaustive des paramètres configurables pour les armes et leurs upgrades.

### A. Statistiques Communes
- `id` : Identifiant unique de l'arme.
- `name` : Nom affiché dans le menu.
- `type` : Catégorie d'arme (`attack`, `defense`, `aoe`).
- `damage` : Dégâts infligés par coup/contact.
- `fireRate` : Temps en ms entre deux tirs (uniquement pour le type `attack` ou `aoe`).

### B. Spécificités du Type "Attack" (Projectiles)
- `projectileSpeed` : Vitesse de déplacement du projectile.
- `projectileCount` : Nombre de projectiles tirés simultanément (ex: 2 pour un Double Tir).
- `isExplosive` : (booléen) Si vrai, crée une explosion de zone (AOE) à l'impact.
- `isPoisonous` : (booléen) Si vrai, applique un effet de poison (DoT) aux ennemis.
- `piercingCount` : Nombre d'ennemis que le projectile peut traverser avant de disparaître.

### C. Spécificités du Type "Defense" (Bouclier/Orbital)
- `radius` : Distance entre le joueur et l'objet orbital.
- `orbitSpeed` : Vitesse de rotation autour du joueur.

### D. Spécificités du Type "AOE" (Zones d'Effet)
- `range` : Rayon de la zone d'effet (ex: ondes wifi, explosion).

## 3. Exemple de Configuration Complète

```json
{
  "id": "smartphone_wave",
  "name": "Ondes Wifi",
  "type": "aoe",
  "stats": {
    "damage": 15,
    "range": 100,
    "fireRate": 1000
  },
  "upgrades": [
    {
      "name": "Fréquence 5G",
      "stats": { "fireRate": -200, "damage": 5 }
    },
    {
      "name": "Amplificateur de Signal",
      "stats": { "range": 50 }
    }
  ]
}
```

## 4. Effets Spéciaux (États)
- **Poison** : Inflige des dégâts périodiques (Ticks) et change la couleur de l'ennemi en vert.
- **Explosion** : Inflige 50% des dégâts de base dans un rayon de 80 pixels autour du point d'impact.
