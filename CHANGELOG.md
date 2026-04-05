# Changelog — Cadrage Express

Toutes les modifications notables sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [8.0.0] — 2026-04-05

### Modifié — Refonte design system FAN

Refonte visuelle complète de l'interface pour respecter la **Charte Graphique FAN** (Fabrique de l'Adoption Numérique).

**Design system :**
- Passage du mode sombre (fond `#00205b`) au **mode clair** (fond `#f7f9ff`) — conformité outil applicatif
- Variables CSS migrées vers le vocabulaire FAN : `--primaire`, `--surface`, `--surface-basse`, `--surface-flottante`, etc.
- Typographie : respect strict de la règle des trois graisses Avenir (300 / 400 / 500), zéro `font-weight` supérieur à 500
- **Règle Zéro Bordure** : suppression de tous les `border: 1px solid` de séparation — transitions tonales par changement de fond uniquement
- Arrondis : `0.25rem` sur les éléments structurels, `0.375rem` réservé aux boutons
- Ombres : `box-shadow` teintées marine (`rgba(0, 26, 66, 0.06)`) — rejet des ombres noires Material Design
- Animations : sobriété renforcée, `ease-out` uniquement, zéro glow/halo

**Composants mis à jour :**
- Nav : fond `--primaire` (#001b44) avec backdrop-filter, ajout de l'eyebrow "point vivant" FAN
- Stepper : fond `--surface-flottante` avec ombre ambiante (remplace le fond sombre)
- Cartes : `--surface-flottante` sur fond `--surface-basse`, coins `0.25rem`
- Boutons : primaire `--primaire`, accent `--cerulean`, danger avec transparence `--ocre`
- Formulaires : style "underline" (fond `--surface-haute`, bordure-bottom au focus)
- Zones de dépôt : fond `--surface-basse`, bordure pointillée `--surface-haute`
- Sélecteur de source : bouton actif `--primaire` (fond sombre sur clair)
- Questionnaire : alternance de lignes par fond (`--surface-flottante` / `--surface-basse`)
- Onglets livrables : style soulignement, actif `--primaire`
- Panneau config : fond `--surface-flottante`, header `--surface-basse`
- Toast : fond `--primaire`
- Agents : fond `--surface-basse`, actif `rgba(menthe, 0.06)`
- Scrollbar : stylée avec les variables surface

**HTML :**
- Ajout de l'eyebrow FAN dans la nav (point vivant + libellé)
- Ajout du footer branding FAN avec filet tricolore
- Mise à jour du titre en `v8`
- Suppression des émojis dans les titres de section (ton éditorial FAN)
- Libellés revus selon les conventions FAN (vouvoiement, infinitif, sans exclamation)

**Documentation :**
- README.md entièrement réécrit (architecture, workflow, design system, limitations)
- CHANGELOG.md créé

---

## [7.0.0] — 2026-04-03

### Ajouté
- Bouton "Supprimer toutes les données" dans le panneau configuration
- Réinitialisation du questionnaire, des fichiers chargés et des livrables générés en un clic
- Conservation de la configuration API et des agents lors de la réinitialisation

---

## [6.0.0] — 2026-04-02

### Ajouté — Refonte questionnaire + analyse auto
- Questionnaire systémique étendu à **65 questions** réparties en **15 blocs thématiques**
- Sélecteur de source en deux niveaux (Audio / Texte puis sous-méthodes)
- Analyse automatique : Claude extrait les réponses et coche les questions correspondantes
- Indicateur de progression par bloc + progression globale

### Modifié
- Restructuration complète du dépôt : `css/`, `js/`, `data/`, `assets/`
- Questions déplacées dans `data/cadrage-questions.json`

---

## [5.0.0] — 2026-04-02

### Ajouté — Dictée en direct
- Intégration Web Speech API pour la transcription en temps réel
- Analyse progressive toutes les 400 nouveaux caractères
- Édition de la transcription avant analyse finale

---

## [4.0.0] — 2026-04-02

### Ajouté — Import audio
- Support des formats MP3, WAV, M4A, OGG, WEBM (max 25 Mo)
- Transcription et analyse simultanée via Claude avec encodage base64
- Indicateur de compatibilité audio par modèle (Haiku non compatible)

---

## [3.0.0] — 2026-04-02

### Modifié
- Remplacement de l'input texte libre du modèle par un `<select` avec les modèles disponibles
- Correction de l'affichage du select sur Windows
- Séparation `index.html` → `html` + `css/style.css` + `js/app.js`

---

## [2.0.0] — 2026-03-05

### Ajouté
- Système d'agents experts virtuels (Économiste, Growth, Product, Tech, UX)
- Génération parallèle de 3 livrables HTML
- Panneau de configuration API (clé, modèle, contexte métier, agents)
- Export téléchargeable des livrables

---

## [1.0.0] — 2026-03-05

### Initial
- Première version fonctionnelle
- Saisie manuelle + analyse texte collé
- Questionnaire simplifié
- Génération d'une synthèse unique par Claude

---

*Cadrage Express — Fabrique de l'Adoption Numérique — e.SNCF Solutions*
