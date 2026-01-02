# Système d'Armes et Projectiles (Scalable)

Ce document décrit l'architecture décentralisée des armes et des effets de statut, permettant une scalabilité maximale.

## 1. Types d'Armes (La Forme)
Chaque arme appartient à une classe de comportement qui définit comment elle se manifeste dans le jeu.

| Type | Classe Technique | Description |
| :--- | :--- | :--- |
| **Projectile** | `ProjectileWeapon` | Tire un ou plusieurs projectiles vers l'ennemi le plus proche. |
| **Orbital** | `OrbitalWeapon` | Crée des projectiles/objets qui tournent en permanence autour du joueur. |
| **Aura** | `AreaWeapon` | Génère une zone d'effet constante ou pulsée centrée sur le joueur. |

## 2. Dictionnaire des Propriétés (`stats`)

Voici tous les réglages possibles à utiliser dans l'objet `stats` d'une arme (ou d'un upgrade).

### A. Paramètres Communs
| Propriété | Type | Description |
| :--- | :--- | :--- |
| `damage` | Nombre | Dégâts de base infligés par l'impact ou par seconde (aura). |
| `fireRate` | Nombre | Délai en ms entre deux tirs / réapparitions d'objets orbitaux. |
| `projectileCount`| Nombre | Nb de balles simultanées (Attaque) ou de billes (Défense). |
| `isPoisonous` | Booléen| Si `true`, applique un DoT (Damage over Time). |
| `poisonDamage` | Nombre | Dégâts infligés par tick de poison. |
| `poisonDuration`| Nombre | Durée totale de l'effet de poison en ms. |
| `poisonTickRate`| Nombre | Intervalle entre deux ticks de dégâts en ms (ex: 500). |
| `isSlowing` | Booléen| Si `true`, ralentit la cible. |
| `slowMultiplier` | Nombre | Puissance du ralenti (ex: `0.5` = vitesse divisée par 2). |
| `slowDuration` | Nombre | Durée de l'effet de ralentissement en ms. |

### B. Spécifiques par Type
- **Attaque (Projectile)**
    - `projectileSpeed` : Vitesse de déplacement des balles.
    - `piercingCount` : Nb d'ennemis traversés (0 = s'arrête au 1er).
    - `isExplosive` : Déclenche une déflagration de zone à l'impact.
    - `color` : Couleur hexadécimale du projectile.
- **Défense (Orbital)**
    - `radius` : Distance de rotation autour du joueur.
    - `orbitSpeed` : Vitesse de rotation (plus le chiffre est haut, plus ça tourne vite).
- **AOE (Aura)**
    - `range` : Rayon de la zone d'effet constante.

## 3. Effets et Munitions (Le Fond)
Indépendamment de son type, une arme peut porter différents effets de statut via ses projectiles ou sa zone.

### A. Types d'Effets de Statut (Status Effects)
- **Basic** : Dégâts directs à l'impact.
- **Explosion** : Déclenche une AOE (dégâts de zone) au point d'impact.
- **Poison** : Applique un DoT (Damage over Time) ; la cible devient **verte**.
- **Ralentissant** : Réduit la vitesse de déplacement de la cible (ex: glace, glue).

### B. Paramètres de Projectiles
- `projectileCount` : Nombre de balles (Tir multiple).
- `projectileSpeed` : Vitesse de déplacement.
- `piercingCount` : Nombre d'ennemis traversés avant disparition.

## 3. Évolution et Upgrades
Chaque niveau d'upgrade peut modifier indépendamment :
- **Puissance** : Dégâts de base, dégâts de poison.
- **Vitesse** : Cadence de tir (`fireRate`), vitesse d'orbite.
- **Déploiement** : Temps de réapparition des projectiles orbitaux, rayon de l'aura.
- **Durée** : Durée des effets de statut sur les cibles.

## 4. Exemple de Configuration JSON (`weapons.json`)

```json
{
  "id": "shield_orbit",
  "name": "Bouclier Orbital",
  "type": "defense",
  "stats": {
    "damage": 10,
    "radius": 60,
    "orbitSpeed": 2,
    "spawnRate": 2000
  },
  "upgrades": [
    {
      "name": "Poison Orbital",
      "stats": { "isPoisonous": true, "damagePerTick": 5 }
    }
  ]
}
```

> [!TIP]
> **Scalabilité** : Grâce à l'architecture O.O.P, un projectile de type "Poison" se comportera de la même manière qu'il soit tiré par un pistolet ou qu'il tourne autour d'Anthony dans un bouclier.
