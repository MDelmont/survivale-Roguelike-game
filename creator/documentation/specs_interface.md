# Spécifications de l'Interface : SPERMATOZOIDE CREATOR

Ce document résume les fonctionnalités et la présentation visuelle de l'outil de création avant sa mise en œuvre finale.

---

## 1. Vision Globale
L'outil est conçu pour être **Data-Driven**. L'objectif est de permettre à un utilisateur de modifier l'intégralité du jeu (stats, visuels, niveaux) sans jamais ouvrir un fichier `.js`.

**Esthétique :**
- Design **Premium Dark Mode** (Noir/Anthracite).
- Utilisation de la police **Outfit** (Moderne/Tech).
- Effets de **Glassmorphism** (transparence et flou sur les panneaux).
- Micro-animations (hover sur les cartes, transitions fluides).
- **Transparence Technique** : Panneau escamotable affichant le JSON en direct pour validation.

---

## 2. Structure des Pages

### A. Le Hub (Accueil)
- Une grille de cartes interactives menant aux sous-outils.
- Résumé de l'état du projet et accès direct à la documentation technique.

### B. Le Laboratoire d'Entités (Joueurs, Ennemis, Boss)
- **Liste latérale** : Sélection rapide entre les différents types d'entités.
- **Fenêtre de Prévisualisation** : Un canvas noir avec une grille où l'entité apparaît en temps réel.
- **Moteur d'Animation** : Boutons "Play [Walk]", "Play [Idle]" pour tester les frames chargées.
- **Sélecteur d'Assets** : Menu déroulant listant tous les fichiers du dossier `assets/` pour les assigner facilement.
- **Formulaire de Stats** : Champs numériques pour les PV, Vitesse, Dégâts, etc.

### C. La Forge d'Armes
- **Visualisation du Projectile** : Voir à quoi ressemble la balle ou l'aura en direct.
- **Gestion des Types** : Switch dynamique entre `attack` (balles), `defense` (orbitales) et `aoe` (auras).
- **Options Spéciales** : Checkboxes pour activer les effets d'explosion, de poison ou de ralentissement.

### D. L'Architecte de Phases (Niveaux)
- **Gestionnaire de Timeline** : Définir la durée du niveau.
- **Sélecteur de Héros** : Choisir quel joueur est assigné à cette phase.
- **Pool d'Ennemis** : Ajouter/Supprimer des ennemis via un système de "Chips" (étiquettes cliquables).
- **Configuration Boss** : Choisir quel boss apparaît à la fin du timer.
- **Narration & Histoire** : Éditeur de pages pour l'introduction et la conclusion de la phase (Titre + Texte).

### E. Le Studio de Transition
- **Séquenceur de Pages** : Glisser-déposer pour réorganiser l'ordre des slides.
- **Éditeur de Texte Riche** : Zone de saisie pour le titre et le corps du texte.
- **Zone de Mise en Page** : Choisir la position de l'image (gauche, droite, fond).
- **Contrôles Audio & Timing** : Assigner une musique d'ambiance et une durée de transition.
- **Aperçu Instantané** : Mode "Play" pour voir le rendu final de la séquence narrative.

---

## 3. Fonctionnalités Clés

| Fonctionnalité | Description |
| :--- | :--- |
| **Auto-Save JSON** | Sauvegarde directe dans le dossier `data/` via un serveur local Node.js. |
| **Hot Reload Friendly** | Produit des JSON propres et structurés, prêts à être consommés par le moteur du jeu. |
| **Validation visuelle** | Affiche les images réelles dès que le chemin est saisi ou sélectionné. |
| **Live JSON Preview** | Affiche en temps réel le code JSON généré pour permettre un contrôle technique direct. |
| **Asset Explorer** | Plus besoin de taper les noms de fichiers à la main (évite les erreurs de typo). |

---

## 4. Workflow Utilisateur
1. L'utilisateur ajoute ses images dans le dossier `assets/`.
2. Il ouvre le **Laboratoire** pour créer son personnage ou monstre en piochant ses images.
3. Il règle les stats et vérifie l'animation.
4. Il sauvegarde.
5. Il va dans l'**Architecte** pour intégrer sa création dans un nouveau niveau.
6. Il lance le jeu pour tester immédiatement.

---
*Ce document sert de base contractuelle avant le démarrage du codage intensif.*
