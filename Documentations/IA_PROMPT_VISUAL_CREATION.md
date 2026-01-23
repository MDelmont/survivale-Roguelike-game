# Script IA : Génération Visuelle par Position (Frame par Frame)

L'IA ayant du mal à générer 12 images cohérentes d'un coup, nous allons procéder **image par image**.

## Étape 0 : Image de Référence (Maître)
Utilise le prompt de l'étape 1 (Design de Base) pour obtenir ton image de référence de face. **Toutes les étapes suivantes doivent être faites en joignant cette image de référence.**

---

## Étape 1 : Vues de FACE (Bas)
*Utilise ces prompts un par un.*

- **FACE - Repos (Idle) :**
> Reprends exactement le personnage en référence. Vue de FACE, debout au repos, bras le long du corps. Personnage seul centré sur fond blanc uni. Style 2D propre, symétrie parfaite.

- **FACE - Marche 1 (Jambe Gauche en avant) :**
> Reprends exactement le personnage en référence. Vue de FACE, en position de marche. La jambe gauche est levée/en avant, le bras droit est légèrement avancé. Personnage seul centré sur fond blanc uni. Style 2D propre.

- **FACE - Marche 2 (Jambe Droite en avant) :**
> Reprends exactement le personnage en référence. Vue de FACE, en position de marche. La jambe droite est levée/en avant, le bras gauche est légèrement avancé. Personnage seul centré sur fond blanc uni. Style 2D propre.

---

## Étape 2 : Vues de DOS (Haut)
*Utilise ces prompts un par un.*

- **DOS - Repos (Idle) :**
> Reprends exactement le personnage en référence. Vue de DOS, debout au repos. On ne voit pas le visage, seulement l'arrière de la tête et de la tenue. Personnage seul centré sur fond blanc uni. Style 2D propre.

- **DOS - Marche 1 (Jambe Gauche en avant) :**
> Reprends exactement le personnage en référence. Vue de DOS, en position de marche. Jambe gauche avancée. Personnage seul centré sur fond blanc uni. Style 2D propre.

- **DOS - Marche 2 (Jambe Droite en avant) :**
> Reprends exactement le personnage en référence. Vue de DOS, en position de marche. Jambe droite avancée. Personnage seul centré sur fond blanc uni. Style 2D propre.

---

## Étape 3 : Vues de PROFIL GAUCHE
*Utilise ces prompts un par un.*

- **PROFIL GAUCHE - Repos (Idle) :**
> Reprends exactement le personnage en référence. Vue de PROFIL GAUCHE (tourné vers la gauche). Debout au repos. Personnage seul centré sur fond blanc uni. Style 2D propre.

- **PROFIL GAUCHE - Marche 1 (Jambe Gauche en avant) :**
> Reprends exactement le personnage en référence. Vue de PROFIL GAUCHE, en position de marche. Jambe gauche en avant. Personnage seul centré sur fond blanc uni. Style 2D propre.

- **PROFIL GAUCHE - Marche 2 (Jambe Droite en avant) :**
> Reprends exactement le personnage en référence. Vue de PROFIL GAUCHE, en position de marche. Jambe droite en avant. Personnage seul centré sur fond blanc uni. Style 2D propre.

---

## Étape 4 : Vues de PROFIL DROIT
*Utilise ces prompts un par un.*

- **PROFIL DROIT - Repos (Idle) :**
> Reprends exactement le personnage en référence. Vue de PROFIL DROIT (tourné vers la droite). Debout au repos. Personnage seul centré sur fond blanc uni. Style 2D propre.

- **PROFIL DROIT - Marche 1 (Jambe Gauche en avant) :**
> Reprends exactement le personnage en référence. Vue de PROFIL DROIT, en position de marche. Jambe gauche en avant. Personnage seul centré sur fond blanc uni. Style 2D propre.

- **PROFIL DROIT - Marche 2 (Jambe Droite en avant) :**
> Reprends exactement le personnage en référence. Vue de PROFIL DROIT, en position de marche. Jambe droite en avant. Personnage seul centré sur fond blanc uni. Style 2D propre.

---

## Rappel pour la cohérence :
1. **Joindre l'image maître** à chaque nouveau prompt.
2. Demander à l'IA de "maintenir strictement les couleurs et les détails de la tenue" si elle commence à dériver.
3. Une fois les 12 images obtenues, détoure-les (fond transparent) et nomme-les clairement (ex: `walk_up_1.png`, `idle_down.png`).
