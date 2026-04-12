# Changelog — Cadrage Express

Toutes les modifications notables sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [8.2.3] — 2026-04-12

### Ajouté — Audit RGAA + Remédiation accessibilité (phase 1)

**Audit RGAA 4.1 :**
- Ajout de `audit/audit-rgaa-2026-04-12.md` : audit d'accessibilité complet (RGAA 4.1) par analyse statique du code source, mis à jour post-corrections v8.2.3
- **Taux de conformité initial : ~32 % — Non conforme** → **~55 % — Partiellement conforme après corrections**

**Corrections accessibilité appliquées (index.html) :**
- Ajout du lien d'évitement `<a href="#main-content" class="skip-link">Aller au contenu principal</a>` [RGAA 12.7]
- `<div class="main">` converti en `<main id="main-content" class="main">` [RGAA 9.2]
- Attribut `for` ajouté sur les 6 labels de la section configuration (`cfgKey`, `cfgModel`, `cfgMaxTokens`, `cfgContext`, `designMdArea`, `cfgBrandName`) [RGAA 11.1]
- `title` ajouté sur les 3 iframes livrables (`synthFrame`, `mockFrame`, `cadrageFrame`) — `sandbox` inchangé [RGAA 2.1]
- `role="alert"` sur `#cfgWarning` [RGAA 7.5]
- `aria-live="polite"` sur `#aStatus`, `#fStatus`, `#qProgressLabel`, `#genStatusSynth/Mock/Cadrage` [RGAA 7.5]
- `role="status" aria-live="polite" aria-atomic="true"` sur `#toast` [RGAA 7.5]
- `<h3>` → `<h2>` pour les 4 sections principales (Source du besoin, Questionnaire, Génération, Livrables) [RGAA 9.1]
- `aria-label` + `<span class="sr-only"> (nouvelle fenêtre)</span>` sur le lien Anthropic [RGAA 6.2]
- `aria-label` sur les 3 inputs `type="file"` masqués [RGAA 11.1]
- `aria-pressed="false"` et `aria-label` sur le bouton microphone [RGAA 7.1]

**Corrections accessibilité appliquées (css/style.css) :**
- Règle `:focus-visible` globale (`outline: 2px solid var(--cerulean)`) [RGAA 10.7]
- `outline: none` remplacé par `outline: 2px solid transparent` sur les inputs/textareas [RGAA 10.7]
- `.sr-only` (masquage accessible) et `.skip-link` ajoutés [RGAA 12.7, 6.2]
- `@media (prefers-reduced-motion: reduce)` : désactivation de `.point-vivant`, `.spinner`, `.mic-btn.recording` et réduction des transitions [RGAA 13.8]
- Correction de contraste `.q-item-answer` : `#00b388` → `#008f6f` (ratio ≥ 4,5:1 — WCAG AA pour texte 11px) [RGAA 3.2]

**Corrections accessibilité appliquées (js/app.js) :**
- `renderAgentGrid()` : `role="switch"`, `aria-checked`, `aria-label` dynamique sur les toggles agents [RGAA 7.1]
- `renderAgentGrid()` : `aria-label="Modifier le prompt de l'agent…"` sur le bouton ✎, emoji enveloppé `aria-hidden="true"` [RGAA 7.1]
- `renderAgentGrid()` : `aria-label="Prompt de l'agent…"` sur les textareas de prompt [RGAA 11.1]
- `startMic()` / `stopMic()` : mise à jour dynamique de `aria-pressed` et `aria-label` sur `#micBtn` [RGAA 7.1]

---

## [8.2.2] — 2026-04-12

### Modifié — Audit cybersécurité refait intégralement

- Réécriture complète de `audit/audit-securite-2026-04-12.md` sur la base d'une analyse statique exhaustive du code v8.2.1
- **Nouvelle vulnérabilité identifiée** — §3.5 [ÉLEVÉE] : `setGenStatus` utilise `innerHTML` pour afficher des fragments d'erreurs API, vecteur potentiel d'injection HTML en cas de MITM (correction : remplacer par `textContent`)
- Score global actualisé : **5,5 → 6,0 / 10** (gain pour les deux correctifs v8.2.1 confirmés par vérification du code)
- Confirmation des lignes exactes pour chaque vulnérabilité (index.html l. 353/356/359 sandbox, app.js l. 990 innerHTML, l. 1114/1157 verbosité erreurs, 8 `alert()` localisés)
- Nouveau §13 — Synthèse exécutive pour décideurs : ce qui est bien, ce qui se corrige en < 1 h, ce qui nécessite une décision d'architecture
- README mis à jour : ajout d'une section **Sécurité** avec tableau de recommandations par contexte de déploiement et lien vers le rapport d'audit

---

## [8.2.1] — 2026-04-12

### Ajouté — Audit sécurité + renforcement BYOK

**Audit de sécurité :**
- Ajout du dossier `audit/` avec le rapport d'audit cybersécurité complet (`audit-securite-2026-04-12.md`) : 12 vulnérabilités identifiées et classifiées (CVSS), recommandations, plan de remédiation et conformité OWASP Top 10

**Sécurité — Gestion de la clé API (BYOK) :**
- Avertissement visible dans le panneau de configuration : bandeau ambre expliquant la visibilité de la clé dans les DevTools et déconseillant les réseaux non sécurisés
- Détection automatique HTTP : bandeau rouge fixe affiché au chargement si l'application est servie en HTTP hors `localhost` / `127.0.0.1`
- README mis à jour avec les précautions d'usage réseau

---

## [8.2.0] — 2026-04-12

### Modifié — Page Livrables redessinée + correctif design system pré-cadrage

**Page Livrables — cohérence visuelle avec Recueil :**
- Nouveau layout `step2-grid` en 2 colonnes (même structure que Step 1) : colonne gauche sticky (statut + sélecteur + actions), colonne droite = iframe pleine hauteur
- Remplacement des anciens onglets `.del-tab` par des tuiles verticales `.del-tile` (même style que les method tiles du Recueil)
- Bouton "Télécharger" en `.btn-analyse` pleine largeur, cohérent avec le reste de l'interface
- Bouton "Régénérer" en `.btn-generate` cerulean avec ombre
- Iframe livrables en pleine hauteur viewport (`calc(100vh - 160px)`) au lieu de `min-height: 450px`
- Suppression du `.output-bar` et du `.nav-row` de l'étape 2, remplacés par la structure colonne gauche

**Correctif — Design system ignoré par le pré-cadrage technique :**
- `buildCadragePrompt` recevait `designCtx` et `brandName` en paramètres mais ne les utilisait pas : couleurs et style hardcodés (`#0088CE`, `#DC582A`)
- Le design system fourni par l'utilisateur (`design.md`) est désormais injecté dans le prompt du pré-cadrage, au même titre que la synthèse et la maquette
- Le "v7" hardcodé dans le header du document généré est remplacé par le nom de marque configuré (ou "Cadrage Express" par défaut)

---

## [8.1.0] — 2026-04-11

### Modifié — Refonte UX écran d'accueil + Config inline

**Layout Step 1 — 2 colonnes :**
- Nouveau layout `grid` côte à côte : colonne gauche Source (sticky), colonne droite Questionnaire
- Fin du scroll vertical entre la source et le questionnaire ; les deux zones sont visibles simultanément

**Navigation source simplifiée :**
- Suppression de la navigation à deux niveaux (Audio / Texte → sous-options)
- Remplacement par 5 tuiles directes en une seule rangée : Fichier audio · Dictée live · PDF/Fichier · Coller texte · Manuel
- `switchMethod()` simplifié (suppression de `switchSourceGroup`, `METHOD_GROUP`, `METHOD_SUB`)

**Zones de dépôt :**
- Remplacement des grandes dropzones (48 px de padding) par des zones compactes (`compact-drop`) : icône + texte sur une ligne

**Boutons d'action :**
- `.btn-analyse` : bouton pleine largeur, 14 px, avec état `disabled` visible
- `.btn-generate` : CTA "Générer les livrables →" en cerulean avec ombre portée, clairement distinct

**Questionnaire :**
- Premier bloc ouvert automatiquement au chargement
- Les blocs remplis par l'IA s'ouvrent automatiquement après analyse (plus besoin de tout déplier manuellement)

**Config — Step 0 :**
- La configuration quitte le tiroir latéral (overlay) et devient un panneau inline accessible via l'onglet **⚙ Config** dans le stepper
- Le stepper passe de 2 à 3 onglets : `⚙ Config › 1 Recueil › 2 Livrables`
- Bouton "Commencer le recueil →" en bas de la config pour enchaîner vers l'étape 1
- Le bouton ⚙ de la nav redirige vers `goStep(0)` (plus d'overlay)

**Version et mentions légales :**
- Suppression du numéro de version dans le titre de l'onglet navigateur et la barre de navigation
- Ajout d'un **footer permanent** en bas de page : version `v8.0`, mentions d'utilisation IA (nature indicative des livrables, clé API en mémoire locale uniquement, données envoyées à Anthropic, lien CGU Anthropic)

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
