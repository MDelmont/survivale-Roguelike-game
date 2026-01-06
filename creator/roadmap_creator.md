# 🗺️ ROADMAP - Creator Tool

> **Outil de gestion visuelle des fichiers JSON pour le jeu Survivale Roguelike**
> 
> Version : 1.0 | Dernière mise à jour : 2026-01-06

---

## 📋 Vue d'ensemble du projet

### Objectif
Créer une **interface web locale** permettant de gérer visuellement tous les fichiers de configuration JSON du jeu sans jamais éditer manuellement les fichiers. L'outil doit être **ergonomique**, **validant**, et afficher des **prévisualisations en temps réel**.

### Stack Technique
- **Frontend** : HTML5 + CSS3 + JavaScript Vanilla
- **Serveur** : Live Server simple (VS Code extension ou équivalent)
- **Stockage** : Lecture/écriture directe des fichiers JSON via File System Access API
- **Design** : Dark Mode moderne avec effets glassmorphism

### Fichiers JSON à gérer

| Fichier | Type de données | Structure |
|---------|-----------------|-----------|
| `data/player.json` | Joueurs/Héros | `{ "players": { "id": {...} } }` |
| `data/enemies.json` | Monstres | `{ "enemies": { "id": {...} } }` |
| `data/bosses.json` | Boss de phases | `{ "bosses": { "id": {...} } }` |
| `data/weapons.json` | Armes & projectiles | `{ "weapons": [...] }` |
| `data/phases.json` | Niveaux/Phases | `{ "phases": [...] }` |
| `data/transitions.json` | Pages narratives | `{ "transitions": [...] }` *(à créer)* |

---

## 🏗️ Architecture de l'interface

### Structure des pages

```
creator/
├── index.html          # Hub principal (accueil)
├── styles/
│   ├── main.css        # Styles globaux + design system
│   ├── components.css  # Composants réutilisables
│   └── animations.css  # Micro-animations
├── scripts/
│   ├── app.js          # Point d'entrée, navigation
│   ├── fileManager.js  # Gestion File System Access API
│   ├── dataValidator.js # Validation des données
│   ├── assetScanner.js # Scan du dossier assets/
│   ├── animationPlayer.js # Lecteur d'animations
│   └── modules/
│       ├── players.js    # Module gestion joueurs
│       ├── enemies.js    # Module gestion ennemis
│       ├── bosses.js     # Module gestion boss
│       ├── weapons.js    # Module gestion armes
│       ├── phases.js     # Module gestion phases
│       └── transitions.js # Module gestion transitions
└── roadmap_creator.md  # Ce fichier
```

### Fonctionnalités clés

| Fonctionnalité | Description |
|----------------|-------------|
| **Connexion projet** | Bouton pour sélectionner le dossier racine du jeu |
| **Asset Explorer** | Liste automatique de tous les fichiers dans `assets/` |
| **Live Preview** | Affichage en temps réel des sprites et animations |
| **Animation Player** | Lecture des animations frame par frame avec contrôles |
| **JSON Preview** | Panneau escamotable montrant le JSON de l'élément en cours d'édition |
| **Validation** | Vérification des références croisées (boss_id existe, etc.) |
| **Auto-save** | Sauvegarde automatique ou manuelle dans les fichiers JSON |

---

## 📅 Plan de développement par étapes

---

### 🔷 ÉTAPE 1 : Fondations & Connexion Projet
**Durée estimée : 1 session**

#### À développer
1. Structure de fichiers (HTML, CSS, JS de base)
2. Design system (variables CSS, couleurs, typographie)
3. Layout principal avec navigation
4. Module `fileManager.js` : connexion au projet via File System Access API
5. Scan initial des dossiers `data/` et `assets/`
6. Affichage du statut de connexion

#### Fichiers à créer/modifier
- `index.html`
- `styles/main.css`
- `scripts/app.js`
- `scripts/fileManager.js`
- `scripts/assetScanner.js`

#### ✅ Critères de validation (TERMINÉ)
- [x] L'interface s'affiche correctement avec le design dark mode
- [x] Le bouton "Connecter Projet" ouvre le sélecteur de dossier
- [x] Après connexion, le statut passe à "Connecté" avec le nom du dossier
- [x] La liste des assets (images) s'affiche dans la console ou dans l'interface
- [x] La liste des fichiers JSON existants est détectée

---

### 🔷 ÉTAPE 2 : Hub Principal & Navigation
**Durée estimée : 1 session**

#### À développer
1. Grille de cartes interactives pour accéder aux modules :
   - 🧬 Joueurs
   - 👾 Ennemis
   - 👹 Boss
   - ⚔️ Armes
   - 🌍 Phases
   - 📖 Transitions
2. Système de navigation SPA (Single Page Application)
3. Affichage des statistiques du projet (nombre d'éléments par catégorie)

#### Fichiers à créer/modifier
- `index.html` (ajout du hub)
- `styles/components.css`
- `scripts/app.js` (router SPA)

#### ✅ Critères de validation (TERMINÉ)
- [x] 6 cartes s'affichent sur le hub avec icônes et titres
- [x] Au survol, les cartes ont un effet visuel (hover)
- [x] Cliquer sur une carte affiche la section correspondante
- [x] Un bouton "Retour au Hub" permet de revenir à l'accueil
- [x] Le compteur affiche le bon nombre d'éléments (ex: "3 Boss")

---

### 🔷 ÉTAPE 3 : Module Joueurs (Player Editor)
**Durée estimée : 1-2 sessions**

#### À développer
1. Liste latérale des joueurs existants
2. Formulaire d'édition avec tous les champs :
   - Infos de base (name, speed, hp, maxHp, etc.)
   - Bloc `visuals` (type, width, height, directionMode, etc.)
   - Gestion des animations (idle, walk, hurt, etc.)
3. Sélecteur d'assets (dropdown avec les images de `assets/players/`)
4. Prévisualisation du sprite en temps réel
5. Lecteur d'animation (Play/Pause/Stop)
6. Bouton JSON Preview (panneau escamotable)
7. Boutons Ajouter / Supprimer / Sauvegarder

#### Fichiers à créer/modifier
- `scripts/modules/players.js`
- `scripts/animationPlayer.js`
- `styles/components.css`

#### ✅ Critères de validation (TERMINÉ)
- [x] La liste affiche "anthony" et "matthieu"
- [x] Sélectionner un joueur remplit le formulaire avec ses données
- [x] Modifier un champ met à jour le JSON Preview en temps réel
- [x] Le sélecteur d'assets liste bien les fichiers de `assets/players/`
- [x] Choisir une image affiche la prévisualisation
- [x] Le bouton "Play Animation" joue les frames de walk
- [x] Ajouter un nouveau joueur fonctionne
- [x] Sauvegarder écrit correctement dans `player.json`

---

### � ÉTAPE 4 : Module Ennemis (Enemy Editor) - EN COURS
**Durée estimée : 1-2 sessions**

#### À développer
1. Dupliquer la logique du Player Editor
2. Adapter pour les champs spécifiques aux ennemis :
   - hp, speed, damage, xpValue, radius, color
   - Bloc `visuals` avec animations
3. Sélecteur d'assets pour `assets/monster/`
4. Filtre/Recherche dans la liste (beaucoup d'ennemis)

#### Fichiers à créer/modifier
- `scripts/modules/enemies.js`

#### ✅ Critères de validation (TERMINÉ)
- [x] La liste affiche tous les ennemis (basic_cell, fast_cell, etc.)
- [x] La barre de recherche filtre les ennemis par nom
- [x] Modifier un ennemi met à jour le JSON Preview
- [x] Les ennemis sans `visuals` affichent leur couleur de fallback
- [x] Ajouter et supprimer un ennemi fonctionne
- [x] Sauvegarder écrit correctement dans `enemies.json`

---

### 🔷 ÉTAPE 5 : Module Boss (Boss Editor)
**Durée estimée : 1 session**

#### À développer
1. Même structure que Enemy Editor
2. Champs spécifiques aux boss :
   - `attackPattern` (dropdown avec les patterns disponibles)
   - `movePattern` (dropdown)
   - `fireRate`
   - `projectileVisuals` (bloc visuel séparé pour les tirs)
3. Prévisualisation du projectile du boss

#### Fichiers à créer/modifier
- `scripts/modules/bosses.js`

#### ✅ Critères de validation (TERMINÉ)
- [x] Les 3 boss existants s'affichent
- [x] Les dropdowns `attackPattern` et `movePattern` proposent les bonnes valeurs
- [x] On peut définir un `projectileVisuals` séparé
- [x] L'animation du boss ET du projectile peuvent être prévisualisées
- [x] Sauvegarder écrit correctement dans `bosses.json`

---

### 🔷 ÉTAPE 6 : Module Armes (Weapon Editor)
**Durée estimée : 1-2 sessions**

#### À développer
1. Liste des armes existantes
2. Formulaire adapté au type d'arme :
   - Switch dynamique selon `type` (attack, defense, aoe)
   - Afficher/masquer les champs pertinents
3. Gestion des `upgrades[]` :
   - Liste des upgrades de l'arme
   - Ajout/édition/suppression d'upgrades
   - Chaque upgrade a ses propres `stats`
4. Bloc `visuals` pour le projectile

#### Fichiers à créer/modifier
- `scripts/modules/weapons.js`

#### ✅ Critères de validation (TERMINÉ)
- [x] Toutes les armes s'affichent avec leur type
- [x] Changer le type modifie les champs visibles
- [x] Les upgrades s'affichent sous forme de liste
- [x] Ajouter une upgrade à une arme fonctionne
- [x] Modifier les stats d'une upgrade met à jour le JSON
- [x] Sauvegarder écrit correctement dans `weapons.json`

---

### 🔷 ÉTAPE 7 : Module Phases (Phase Editor) - EN COURS
**Durée estimée : 2 sessions**

#### À développer
1. Timeline visuelle des phases existantes
2. Formulaire complet :
   - Infos de base (id, name, duration_before_boss, spawn_rate)
   - `player_id` : Dropdown avec les joueurs de `player.json`
   - `enemy_types[]` : Système de chips/tags pour ajouter des ennemis
   - `boss_id` : Dropdown avec les boss de `bosses.json`
   - `default_weapon` : Dropdown avec les armes
   - `available_weapons[]` : Chips pour les armes de loot
3. Éditeur de narration :
   - `story_intro[]` : Liste de pages (title + text + image optionnelle)
   - `story_outro[]` : Idem
4. Validation croisée (vérifier que les IDs référencés existent)

#### Fichiers à créer/modifier
- `scripts/modules/phases.js`
- `scripts/dataValidator.js`

#### ✅ Critères de validation (TERMINÉ)
- [x] Les 6 phases existantes s'affichent dans l'ordre
- [x] Les dropdowns affichent les données des autres fichiers JSON (Players, Bosses, Weapons)
- [x] Le système de chips permet d'ajouter/retirer des ennemis et armes de loot
- [x] L'éditeur story_intro/outro permet d'ajouter plusieurs pages
- [ ] Un avertissement s'affiche si un ID référencé n'existe pas (À faire)
- [x] Sauvegarder écrit correctement dans `phases.json`

---

### 🔷 ÉTAPE 8 : Module Transitions (Transition Editor)
**Durée estimée : 1 session**

#### À développer
1. Créer le fichier `data/transitions.json` s'il n'existe pas
2. Éditeur de séquences narratives :
   - Liste des transitions
   - Éditeur de pages (title, text, image, background, duration, animation, music)
3. Drag & Drop pour réorganiser les pages
4. Prévisualisation de la page narrative

#### Fichiers à créer/modifier
- `scripts/modules/transitions.js`
- `data/transitions.json` (création initiale)

#### ✅ Critères de validation (À TESTER)
- [ ] Le fichier `transitions.json` est créé automatiquement s'il n'existe pas
- [ ] On peut créer une nouvelle séquence de transition
- [ ] On peut ajouter plusieurs pages à une séquence
- [ ] Le drag & drop permet de réorganiser les pages
- [ ] La prévisualisation affiche le rendu de la page
- [ ] Sauvegarder écrit correctement dans `transitions.json`

---

### 🔷 ÉTAPE 9 : Validation & Finitions
**Durée estimée : 1 session**

#### À développer
1. Système de validation global :
   - Vérifier l'intégrité de tous les fichiers JSON
   - Détecter les références cassées
   - Afficher un rapport d'erreurs
2. Améliorations UX :
   - Notifications de succès/erreur
   - Raccourcis clavier (Ctrl+S pour sauvegarder)
   - Confirmation avant suppression
3. Mode debug : Afficher les logs dans la console
4. Documentation intégrée (tooltips sur les champs)

#### Fichiers à créer/modifier
- `scripts/dataValidator.js` (compléter)
- `styles/animations.css`

#### ✅ Critères de validation (À TESTER)
- [ ] Le bouton "Valider tout" affiche un rapport complet
- [ ] Les références cassées sont signalées en rouge
- [ ] Les notifications apparaissent lors des actions
- [ ] Ctrl+S déclenche la sauvegarde
- [ ] Un dialogue de confirmation apparaît avant suppression
- [ ] Les tooltips aident à comprendre les champs

---

### 🔷 ÉTAPE 10 : Tests Finaux & Documentation
**Durée estimée : 1 session**

#### À développer
1. Tests de bout en bout (créer un ennemi → l'utiliser dans une phase → jouer)
2. Mise à jour de la documentation :
   - `specs_interface.md`
   - `json_schemas.md`
3. README pour le dossier creator
4. Nettoyage du code et commentaires

#### ✅ Critères de validation (À TESTER)
- [ ] Créer un nouvel ennemi complet avec animations
- [ ] Créer un nouveau boss avec pattern d'attaque
- [ ] Créer une nouvelle phase utilisant le nouvel ennemi et boss
- [ ] Lancer le jeu et vérifier que tout fonctionne
- [ ] La documentation est à jour

---

## 📊 Résumé des modules

| Module | Fichier JSON | Éléments clés |
|--------|--------------|---------------|
| **Players** | `player.json` | name, speed, hp, visuals, animations |
| **Enemies** | `enemies.json` | hp, damage, xpValue, radius, visuals |
| **Bosses** | `bosses.json` | attackPattern, movePattern, projectileVisuals |
| **Weapons** | `weapons.json` | type, stats, upgrades[], visuals |
| **Phases** | `phases.json` | enemy_types[], boss_id, story_intro/outro |
| **Transitions** | `transitions.json` | pages[], animation, music |

---

## 🎨 Design System

### Couleurs (Dark Mode)
```css
--bg-primary: #0d0d0d;
--bg-secondary: #1a1a2e;
--bg-card: rgba(30, 30, 50, 0.7);
--accent-primary: #6366f1;  /* Indigo */
--accent-success: #22c55e;  /* Vert */
--accent-warning: #f59e0b;  /* Orange */
--accent-danger: #ef4444;   /* Rouge */
--text-primary: #ffffff;
--text-secondary: #a1a1aa;
```

### Typographie
- **Titres** : Outfit (Google Fonts)
- **Corps** : Inter ou System UI

### Effets
- Glassmorphism : `backdrop-filter: blur(10px)`
- Bordures subtiles : `border: 1px solid rgba(255,255,255,0.1)`
- Shadows : `box-shadow: 0 4px 30px rgba(0,0,0,0.5)`
- Transitions : `transition: all 0.3s ease`

---

## 🚀 Prêt à démarrer !

**Prochaine action** : Commencer par l'**Étape 1** - Créer les fondations et le système de connexion au projet.

---

*Document créé le 2026-01-06 | Projet Survivale Roguelike Creator*
