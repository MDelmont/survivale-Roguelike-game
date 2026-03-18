# 🎮 Souvenir d’Ony - Roadmap Refonte UI/UX

> **Vision** : Transformer l'interface actuelle en une UI "Jeu Vidéo Moderne" — propre, soft mais impactante, avec une excellente ergonomie.

---

## 📋 Résumé Exécutif

| Priorité | Module                             | Complexité | Impact Visuel |
| -------- | ---------------------------------- | ---------- | ------------- |
| 🔴 P0    | Design System & Composants de base | Moyenne    | ⭐⭐⭐⭐⭐    |
| 🔴 P1    | Menu Principal                     | Faible     | ⭐⭐⭐⭐⭐    |
| 🟠 P2    | Level Up Screen (3 cartes)         | Élevée     | ⭐⭐⭐⭐      |
| 🟡 P3    | Armes & Améliorations              | Élevée     | ⭐⭐⭐⭐      |
| 🟢 P4    | HUD In-Game                        | Moyenne    | ⭐⭐⭐        |

---

## 🎨 Phase 0 : Direction Artistique & Design System

### Objectif

Définir les fondations visuelles qui seront réutilisées sur toutes les interfaces.

### Palette de Couleurs Proposée

```
┌─────────────────────────────────────────────────────────────┐
│  PRIMARY        SECONDARY      ACCENT         SURFACE       │
│  #00D4FF        #A855F7        #22C55E        #0F172A       │
│  (Cyan Néon)    (Violet)       (Emeraude)     (Slate Deep)  │
├─────────────────────────────────────────────────────────────┤
│  GLASS BG       TEXT PRIMARY   TEXT MUTED     DANGER        │
│  rgba(15,23,42  #F8FAFC        #94A3B8        #EF4444       │
│  ,0.85)         (White)        (Gray)         (Red)         │
└─────────────────────────────────────────────────────────────┘
```

### Contrainte Majeure : Lisibilité sur Fond Dynamique

**Solution technique retenue :**

1. **Panneaux Glassmorphism** : `backdrop-filter: blur(12px)` + fond semi-transparent sombre
2. **Text Shadow contrasté** : Double contour (stroke + shadow) pour tous les textes critiques
3. **Bordures lumineuses** : `box-shadow` avec glow coloré pour délimiter les zones

### Typographie

| Usage         | Font             | Taille  | Poids        |
| ------------- | ---------------- | ------- | ------------ |
| Titres        | Inter / Orbitron | 32-48px | Bold 700     |
| Sous-titres   | Inter            | 20-24px | SemiBold 600 |
| Corps         | Inter            | 14-16px | Regular 400  |
| Stats/Valeurs | Mono (JetBrains) | 18-24px | Bold 700     |

### Composants de Base à Créer

#### 1. `UIButton` - Bouton Gaming Stylisé

```
┌──────────────────────────────────────┐
│  ▸  NOUVELLE PARTIE                  │  ← Icône chevron animé
│     ═══════════════                  │  ← Barre de glow animée
└──────────────────────────────────────┘
     ↑ Clip-path biseauté (coins coupés style Sci-Fi)
```

**États :**

- `idle` : Fond transparent, bordure glow subtile
- `hover` : Fond lumineux, scale 1.02, son "hover.wav"
- `pressed` : Scale 0.98, flash lumineux, son "click.wav"
- `disabled` : Opacité 50%, curseur not-allowed

#### 2. `UIPanel` - Panneau Glassmorphism

```
┌────────────────────────────────────────────────┐
│ ╔══════════════════════════════════════════╗   │
│ ║  TITRE DU PANNEAU                        ║   │ ← Header avec gradient
│ ╠══════════════════════════════════════════╣   │
│ ║                                          ║   │
│ ║       Contenu avec backdrop blur         ║   │
│ ║                                          ║   │
│ ╚══════════════════════════════════════════╝   │
└────────────────────────────────────────────────┘
```

#### 3. `UICard` - Carte d'Option (Level Up / Armes)

```
┌─────────────────────────────┐
│  [ICÔNE 64x64]              │
│  ───────────────            │
│  **Nom de l'amélioration**  │
│  Description courte...      │
│                             │
│  ┌─────────────────────┐    │
│  │ +20% DÉGÂTS         │    │ ← Badge stat highlight
│  └─────────────────────┘    │
└─────────────────────────────┘
```

---

## 🏠 Phase 1 : Refonte du Menu Principal

### État Actuel (Analyse)

```javascript
// Game.js:778-816
drawMenu() {
    // Titre simple avec shadow
    // Boutons rectangulaires basiques (fillRect + strokeRect)
}
```

### Nouveau Design Proposé

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    [FOND DYNAMIQUE / STATIQUE]                 │
│                    (Parallax optionnel)                        │
│                                                                │
│              ╔═══════════════════════════════╗                 │
│              ║                               ║                 │
│              ║      Souvenir d’Ony              ║  ← Logo animé   │
│              ║      SURVIVOR EDITION         ║                 │
│              ║                               ║                 │
│              ╚═══════════════════════════════╝                 │
│                                                                │
│                   ▸  NOUVELLE PARTIE                           │
│                   ▸  CONTINUER                                 │
│                   ▸  OPTIONS                                   │
│                                                                │
│   ┌──────┐                                    ┌──────┐         │
│   │ v1.0 │                                    │ ♪ 🔊 │         │
│   └──────┘                                    └──────┘         │
└────────────────────────────────────────────────────────────────┘
```

### Spécifications Techniques

| Fonctionnalité       | Implémentation                                       |
| -------------------- | ---------------------------------------------------- |
| Fond dynamique       | `phases.json` → `menu_background` (image ou couleur) |
| Parallax (optionnel) | Déplacement léger sur `mousemove`                    |
| Titre animé          | Glow pulsant via `shadowBlur` oscillant              |
| Boutons              | Composant `UIButton` avec sons au survol/clic        |
| Version              | Texte positionné en bas-gauche                       |
| Icônes son           | Toggle mute/unmute en bas-droite                     |

### Fichiers Impactés

- `js/core/Game.js` → `drawMenu()` (réécriture complète)
- `css/style.css` → Variables CSS si migration vers CSS pour certains overlays
- `data/config.json` (nouveau) → Paramètres du menu (background, version, etc.)

---

## ⬆️ Phase 2 : Interface Level Up (3 Cartes Horizontales)

### État Actuel (Analyse)

```javascript
// Game.js:871-912
drawChoiceMenu(title, color, optionHeight = 80) {
    // Layout vertical (flex-column)
    // Options simples : rectangle + texte
    // Pas d'icônes, stats peu lisibles
}
```

### Nouveau Layout Proposé

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         AMÉLIORATION DISPONIBLE                            │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                            │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │                  │   │                  │   │                  │        │
│  │   [ICÔNE 80px]   │   │   [ICÔNE 80px]   │   │   [ICÔNE 80px]   │        │
│  │                  │   │                  │   │                  │        │
│  │ ──────────────── │   │ ──────────────── │   │ ──────────────── │        │
│  │ **Chaussures**   │   │ **Force Nature** │   │ **Gros Coeur**   │        │
│  │ de Sport         │   │                  │   │                  │        │
│  │                  │   │                  │   │                  │        │
│  │ Augmente la      │   │ Augmente tous    │   │ Ajoute +20 HP    │        │
│  │ vitesse de       │   │ les dégâts de    │   │ max à votre      │        │
│  │ déplacement.     │   │ +20%.            │   │ joueur.          │        │
│  │                  │   │                  │   │                  │        │
│  │ ┌──────────────┐ │   │ ┌──────────────┐ │   │ ┌──────────────┐ │        │
│  │ │ +15% VITESSE │ │   │ │ +20% DÉGÂTS  │ │   │ │ +20 HP MAX   │ │        │
│  │ └──────────────┘ │   │ └──────────────┘ │   │ └──────────────┘ │        │
│  │                  │   │                  │   │                  │        │
│  │  💡 Impact:      │   │  💡 Impact:      │   │  💡 Impact:      │        │
│  │  Fuite + Dodge   │   │  DPS global      │   │  Survie          │        │
│  │                  │   │                  │   │                  │        │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
│          [1]                   [2]                    [3]                  │
│                                                                            │
│                    Appuyez sur 1, 2 ou 3 pour choisir                      │
└────────────────────────────────────────────────────────────────────────────┘
```

### Structure de Données Enrichie

```javascript
// UpgradeSystem.js - Structure améliorée
{
    id: 'speed_boost',
    name: 'Chaussures de Sport',
    description: 'Augmente la vitesse de déplacement de 15%.',
    icon: 'assets/icons/speed.png',           // NOUVEAU
    statDisplay: '+15% VITESSE',              // NOUVEAU - Valeur formatée
    category: 'mobility',                      // NOUVEAU - Pour coloration
    impactHint: 'Fuite + Esquive',            // NOUVEAU - Aide au build
    rarity: 'common'                           // NOUVEAU - common/rare/epic/legendary
}
```

### Hiérarchie Visuelle par Carte

1. **Icône** (80x80px) - En haut, bordure colorée selon rarity
2. **Nom** (Bold 20px) - Titre principal
3. **Description** (Regular 14px) - Explication textuelle
4. **Badge Stat** (Highlight box) - Valeur chiffrée claire (+20% DÉGÂTS)
5. **Impact Hint** (Italic 12px) - Aide contextuelle pour le build

### Fichiers Impactés

- `js/systems/UpgradeSystem.js` → Enrichir les données des upgrades
- `js/core/Game.js` → `drawChoiceMenu()` → Nouvelle fonction `drawLevelUpScreen()`
- `data/upgrades.json` (nouveau) → Externaliser les données d'upgrades
- `assets/icons/` (nouveau dossier) → Icônes pour chaque upgrade

---

## ⚔️ Phase 3 : Interface Armes & Améliorations

### État Actuel (Analyse)

```javascript
// Game.js:441-471
openWeaponMenu() {
    // Même layout que Level Up
    // Affiche nom + description basique
    // Pas de prévisualisation des évolutions
}
```

### Nouveau Design Proposé

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           NOUVELLE ARME DISPONIBLE                         │
│  ══════════════════════════════════════════════════════════════════════    │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [ICÔNE]  LANCE-FLAMMES                              [Lvl 1/5]      │   │
│  │           Arme de zone - Dégâts continus                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  📊 STATS ACTUELLES              🔮 ÉVOLUTION NIVEAU 2              │   │
│  │  ─────────────────               ─────────────────────              │   │
│  │  • Dégâts : 15/s                 • Dégâts : 20/s (+33%)             │   │
│  │  • Portée : 120px                • Portée : 150px (+25%)            │   │
│  │  • Cooldown : 0.5s               • Cooldown : 0.4s (-20%)           │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  📈 ARBRE D'ÉVOLUTION                                       │    │   │
│  │  │  [Lvl1] → [Lvl2] → [Lvl3] → [Lvl4] → [★ ÉVOLUTION ULTIME]  │    │   │
│  │  │     ↑ VOUS ÊTES ICI                                         │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌────────────────────────┐  ┌────────────────────────┐                    │
│  │  ▸  ACQUÉRIR ARME      │  │  ▸  PASSER             │                    │
│  └────────────────────────┘  └────────────────────────┘                    │
└────────────────────────────────────────────────────────────────────────────┘
```

### Structure de Données Enrichie pour les Armes

```javascript
// weapons.json - Structure enrichie
{
    "id": "flamethrower",
    "name": "Lance-Flammes",
    "type": "aura",
    "category": "zone_damage",
    "description": "Brûle les ennemis proches en continu.",
    "icon": "assets/weapons/flamethrower.png",
    "stats": {
        "damage": 15,
        "range": 120,
        "cooldown": 500
    },
    "upgrades": [
        {
            "level": 2,
            "preview": "+33% Dégâts, +25% Portée",
            "stats": { "damage": 20, "range": 150 }
        },
        {
            "level": 3,
            "preview": "Effet de brûlure prolongée",
            "stats": { "damage": 25, "burnDuration": 2 }
        },
        // ...
        {
            "level": 5,
            "preview": "★ INFERNO - Double portée, zone explosive",
            "ultimate": true,
            "stats": { "damage": 50, "range": 240, "explosion": true }
        }
    ]
}
```

### Composant `UIWeaponCard` - Spécifications

| Zone           | Contenu                                           |
| -------------- | ------------------------------------------------- |
| Header         | Icône + Nom + Niveau actuel (e.g. "Lvl 2/5")      |
| Stats Panel    | Colonnes comparatives (Actuel vs Prochain niveau) |
| Evolution Tree | Barre de progression visuelle avec milestones     |
| Footer         | Boutons d'action (Acquérir / Améliorer / Passer)  |

### Fichiers Impactés

- `data/weapons/weapons.json` → Enrichir avec `upgrades[]`, `icon`, `category`
- `js/core/Game.js` → Nouvelle fonction `drawWeaponMenu()`
- `js/weapons/Weapon.js` → Méthode `getUpgradePreview()`

---

## 📊 Phase 4 : HUD In-Game (Bonus)

### Améliorations Proposées

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [XP BAR FULL WIDTH - Gradient animé]                                      │
│  ══════════════════════════════════════════════════════════ Lvl 5          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PHASE 2 - La Grande Traversée                    ⚔️ Lance-Flammes Lvl 3  │
│  ⏱️ 02:45 jusqu'au Boss                           🔫 Mitrailleuse Lvl 2    │
│  💀 Kills: 142                                    ✨ Aura de Gel Lvl 1     │
│                                                                            │
│                            [ZONE DE JEU]                                   │
│                                                                            │
│                                                                            │
│                                                                            │
│                                                                            │
│                                                                            │
│                            ┌────────────────────┐                          │
│                            │ ████████████░░░░░░ │  HP 75/100               │
│                            └────────────────────┘                          │
└────────────────────────────────────────────────────────────────────────────┘
```

### Améliorations Clés

- **Barre XP** : Gradient animé + indication niveau clair
- **Timer Boss** : Compte à rebours visible avec icône
- **Liste Armes** : Affichage compact avec niveaux à droite
- **Barre HP** : Plus grande, avec effet de "damage flash"

---

## 🛠️ Architecture Technique Proposée

### Nouvelle Structure de Fichiers

```
js/
├── core/
│   └── Game.js          // Logique principale (allégée côté UI)
├── ui/
│   ├── UIManager.js     // NOUVEAU - Orchestration de tous les écrans
│   ├── components/
│   │   ├── UIButton.js  // NOUVEAU - Composant bouton réutilisable
│   │   ├── UIPanel.js   // NOUVEAU - Panneau glassmorphism
│   │   ├── UICard.js    // NOUVEAU - Carte d'option
│   │   └── UIBar.js     // NOUVEAU - Barre de progression (HP, XP)
│   └── screens/
│       ├── MainMenu.js  // NOUVEAU - Écran menu principal
│       ├── LevelUp.js   // NOUVEAU - Écran level up
│       └── WeaponMenu.js// NOUVEAU - Écran sélection arme
├── systems/
│   └── UpgradeSystem.js // Enrichi avec icônes/hints
└── ...
```

### Approche de Rendu

Le jeu utilise actuellement un **rendu 100% Canvas**. Deux approches sont possibles :

| Approche                    | Avantages                          | Inconvénients               |
| --------------------------- | ---------------------------------- | --------------------------- |
| **Canvas pur** (recommandé) | Performance, cohérence, pas de DOM | Plus de code custom         |
| **HTML/CSS overlay**        | Flexbox natif, CSS animations      | Complexité de sync, z-index |

**Recommandation** : Rester en **Canvas pur** avec une couche d'abstraction UI (`UIManager`).

---

## 📅 Planning Estimatif

| Phase                      | Durée      | Priorité |
| -------------------------- | ---------- | -------- |
| Phase 0 - Design System    | 2-3h       | P0       |
| Phase 1 - Menu Principal   | 2-3h       | P1       |
| Phase 2 - Level Up Screen  | 4-5h       | P2       |
| Phase 3 - Armes & Upgrades | 5-6h       | P3       |
| Phase 4 - HUD In-Game      | 2-3h       | P4       |
| **TOTAL**                  | **15-20h** | -        |

---

## ✅ Critères de Validation

### Par Phase

- [ ] **Phase 0** : Variables CSS définies, composants de base fonctionnels
- [ ] **Phase 1** : Menu avec fond dynamique, boutons animés avec sons
- [ ] **Phase 2** : 3 cartes horizontales, stats lisibles, descriptions contextuelles
- [ ] **Phase 3** : Prévisualisation des upgrades, arbre d'évolution visible
- [ ] **Phase 4** : HUD amélioré avec timer boss et liste armes

### Critères Globaux

- [ ] Texte lisible sur n'importe quel fond (glassmorphism validé)
- [ ] Transitions fluides entre les états (≥ 30 FPS pendant animations)
- [ ] Responsive (fonctionne sur mobile via joystick existant)
- [ ] Cohérence visuelle totale (palette + typo respectées)

---

## 🎯 Prochaines Étapes Immédiates

1. **Valider cette roadmap** avec le client
2. **Créer les assets d'icônes** (ou définir un pack iconographique)
3. **Implémenter le Design System** (Phase 0)
4. **Commencer par le Menu Principal** (quick win visuel)

---

> 📝 _Document rédigé le 10/01/2026 - Version 1.0_
>
> _Pour toute question ou ajustement, merci de commenter directement ce document._
