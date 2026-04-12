# Cadrage Express

**Outil de cadrage de projets d'innovation assisté par IA**
Fabrique de l'Adoption Numérique (FAN) — e.SNCF Solutions

---

## Présentation

Cadrage Express est une application web monopage (SPA) permettant de cadrer rapidement un projet d'innovation numérique à partir de sources variées (audio, PDF, texte, saisie manuelle). Elle génère automatiquement trois livrables prêts à l'emploi grâce à l'API Claude d'Anthropic.

L'outil est conçu pour les équipes FAN / 574, les facilitateurs d'innovation et les porteurs de projets SNCF qui souhaitent structurer un besoin métier avant de lancer un cadrage formalisé.

---

## Fonctionnalités

### Recueil multi-source

| Source | Méthode | Description |
|--------|---------|-------------|
| Audio | Fichier MP3/WAV/M4A | Transcription + analyse par Claude |
| Audio | Dictée en direct | Web Speech API (Chrome/Edge) avec analyse progressive |
| Texte | PDF / .txt / .md | Extraction et analyse du texte |
| Texte | Coller du texte | Analyse d'un CR de réunion ou expression de besoin |
| Texte | Saisie manuelle | Remplissage direct du questionnaire avec un textarea par question, ouverture automatique des blocs |

### Questionnaire structuré

65 questions réparties en 15 blocs thématiques :
1. Demande initiale
2. Contexte et origine
3. Finalité et objectif
4. Résultats attendus
5. Périmètre et limites
6. Acteurs et parties prenantes
7. Enjeux et risques
8. Contraintes
9. Données et état des lieux
10. Solutions envisagées
11. Temporalité et jalons
12. Gouvernance
13. Communication et changement
14. Pérennité
15. Clarification transversale

### 5 agents experts virtuels

Chaque agent enrichit les livrables selon son prisme d'expertise :

| Agent | Rôle | Couleur |
|-------|------|---------|
| Économiste | Coûts, ROI, TCO, scénarios financiers | Ambre |
| Growth Analyst | KPIs, adoption, déploiement | Menthe |
| Product Strategist | MVP, discovery, priorisation | Cerulean |
| Tech Lead | Architecture, SI, faisabilité | Lavande |
| UX Designer | Parcours utilisateur, accessibilité, terrain | Ocre |

### Trois livrables générés en parallèle

1. **Synthèse structurée** — Reformulation chiffrée avec scénarios Baseline/MVP/Scale, SWOT, roadmap
2. **Maquette applicative** — Prototype HTML visuel de l'application envisagée
3. **Pré-cadrage technique** — Exigences fonctionnelles/non-fonctionnelles, architecture, RGPD, questions ouvertes

Les trois livrables respectent l'identité de marque définie dans la configuration (`design.md`) lorsqu'elle est fournie.

---

## Architecture

```
cadragexpress/
├── index.html                    # SPA unique
├── css/
│   └── style.css                 # Design system FAN (mode clair)
├── js/
│   └── app.js                    # Logique applicative
├── data/
│   └── cadrage-questions.json    # 65 questions × 15 blocs
└── assets/                       # Logos, favicons (à compléter)
```

**Stack technique :**
- Vanilla JavaScript (ES6+), aucun framework
- HTML5 + CSS3, design system FAN
- PDF.js (CDN) pour l'extraction de texte PDF
- Web Speech API pour la dictée en direct
- API Anthropic Claude (appels directs depuis le navigateur)

---

## Installation et usage

### Prérequis

- Un navigateur moderne (Chrome ou Edge recommandé)
- Une clé API Anthropic valide ([console.anthropic.com](https://console.anthropic.com))
- Serveur HTTP local pour les accès aux fichiers JSON (optionnel mais recommandé)

### Lancement

#### Option 1 — Serveur local (recommandé)

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

Ouvrir `http://localhost:8080` dans le navigateur.

#### Option 2 — Ouverture directe

Ouvrir `index.html` directement dans le navigateur.
> Le chargement du questionnaire JSON peut échouer en mode `file://` selon le navigateur.

### Configuration

1. Cliquer sur l'onglet **Config** (étape 0 du stepper) ou sur l'icône ⚙ dans la barre de navigation
2. Saisir la clé API Anthropic (`sk-ant-...`)
3. Choisir le modèle Claude (Opus 4.6 pour la meilleure qualité, Haiku 4.5 pour la rapidité)
4. Ajuster le contexte métier si nécessaire
5. Cliquer sur **Commencer le recueil →** pour passer à l'étape suivante

> **Sécurité :** la clé API est stockée uniquement en mémoire navigateur (non persistée). Elle est effacée à la fermeture de l'onglet.
> **Important :** la clé transite en HTTPS vers l'API Anthropic et reste visible dans l'onglet Réseau des DevTools du navigateur (pattern BYOK). Ne saisissez pas votre clé sur un réseau non sécurisé. L'application affiche un bandeau d'avertissement si elle est servie en HTTP hors localhost.

### Workflow type

1. **Config** — Saisir la clé API et paramétrer les agents experts (onglet 0)
2. **Charger** la source (audio, PDF, texte ou saisie manuelle) dans la colonne gauche
3. **Analyser** — Claude remplit automatiquement le questionnaire (colonne droite)
4. **Vérifier et compléter** manuellement les questions manquantes
5. **Générer** les trois livrables via le bouton en bas de la colonne gauche
6. **Consulter** chaque livrable via les tuiles Synthèse / Maquette / Pré-cadrage (colonne gauche de l'onglet Livrables)
7. **Télécharger** les fichiers HTML générés depuis la colonne gauche

---

## Modèles compatibles

| Modèle | Audio | Qualité | Vitesse |
|--------|-------|---------|---------|
| Claude Opus 4.6 | ✓ | Maximale | Lente |
| Claude Sonnet 4.6 | ✓ | Haute | Rapide |
| Claude Sonnet 4 | ✓ | Haute | Rapide |
| Claude Haiku 4.5 | ✗ | Standard | Très rapide |
| Claude Haiku 3.5 | ✗ | Standard | Très rapide |

> Les modèles Haiku ne supportent pas la transcription audio. Utiliser Sonnet ou Opus pour les sources audio.

---

## Design system

L'interface respecte la **Charte Graphique FAN** (Fabrique de l'Adoption Numérique) :

- **Mode** : Clair (outil applicatif)
- **Typographie** : Avenir / Avenir Next, graisses 300 / 400 / 500 uniquement
- **Couleur primaire** : `#001b44` (Bleu Marine profond)
- **Accent** : `#0088cc` (Cerulean SNCF)
- **Séparation** : par changement de fond (zéro bordure)
- **Animations** : sobres, 0.2s–0.4s, `ease-out`

---

## Accessibilité

Un audit RGAA 4.1 complet est disponible dans [`audit/audit-rgaa-2026-04-12.md`](audit/audit-rgaa-2026-04-12.md).

**Taux de conformité actuel (v8.2.3) : ~55 % — Partiellement conforme**  
*(était ~32 % — Non conforme en v8.2.1)*



**Corrections appliquées en v8.2.3 :**
- Labels de formulaire associés aux champs (`for=` sur les 6 labels)
- Iframes livrables titrées (`title` sur les 3 iframes)
- Élément `<main id="main-content">` et lien d'évitement « Aller au contenu principal »
- Indicateurs de focus visibles sur tous les éléments (règle `:focus-visible` globale)
- Régions ARIA live sur tous les messages dynamiques (toast, alertes, statuts génération)
- Animation `.point-vivant` respecte `prefers-reduced-motion`
- Contraste des réponses questionnaire corrigé (WCAG AA)
- Composants agents : `role="switch"`, `aria-checked`, `aria-label`, `aria-pressed` mic
- Hiérarchie des titres corrigée (H1 → H2 pour les sections principales)
- Lien externe Anthropic annonce l'ouverture dans une nouvelle fenêtre

**Non-conformités restantes (plan de remédiation P1) :**
- Stepper non conforme au pattern ARIA `tablist/tab` (nécessite refonte JS)
- Accordéon et cases à cocher non focusables au clavier (nécessite refonte JS)
- Barres de progression sans `aria-valuenow` dynamique

> Pour un déploiement dans le cadre des services numériques SNCF, la conformité RGAA AA est requise par la loi du 11 février 2005 modifiée.

---

## Sécurité

L'application utilise le modèle **BYOK** (Bring Your Own Key) : chaque utilisateur fournit sa propre clé API Anthropic, stockée uniquement en mémoire navigateur.

Un audit de sécurité complet est disponible dans [`audit/audit-securite-2026-04-12.md`](audit/audit-securite-2026-04-12.md).

**Résumé :**

| Contexte de déploiement | Recommandation |
|------------------------|---------------|
| Usage interne SNCF, réseau sécurisé, utilisateurs avertis | Acceptable |
| Intranet sans garantie réseau | Acceptable après application des correctifs Semaine 1 |
| Déploiement public ou multi-utilisateurs | Nécessite un proxy backend |
| Données confidentielles ou classifiées | Déconseillé |

**Mesures en place (v8.2.1) :**
- Bandeau ambre dans la config : rappel visibilité DevTools et risques réseau non sécurisé
- Détection HTTP automatique : bandeau rouge si l'application est servie hors HTTPS hors localhost
- Clé API jamais persistée (ni localStorage, ni sessionStorage)
- Communications Anthropic en HTTPS uniquement
- Données en mémoire uniquement, effacées à la fermeture de l'onglet

---

## Limitations connues

- **PDFs scannés** : l'extraction de texte ne fonctionne que sur les PDF avec texte natif (non-OCR)
- **Audio > 25 Mo** : refusé (limite API)
- **Haiku + audio** : incompatible, avertissement affiché
- **Mode file://** : le chargement du JSON peut être bloqué par le navigateur
- **Mobile** : responsive mais non optimisé pour les petits écrans
- **Persistance** : aucune — les données sont perdues à la fermeture de l'onglet

---

## Données personnelles et données sensibles

Un **modal d'avertissement** s'affiche automatiquement à l'ouverture de l'application (depuis v8.2.5). Il rappelle :

- **Ne pas saisir de données personnelles** (noms, matricules, coordonnées, données RH…)
- **Ne pas saisir de données à valeur** (informations confidentielles, classifiées, secrets commerciaux, données financières non publiques…)

Les textes saisis sont transmis à l'API Anthropic pour traitement. Utiliser des données anonymisées ou fictives si nécessaire.

L'utilisateur peut cocher "Ne plus afficher" pour masquer le modal lors des sessions suivantes.

---

## Mentions d'utilisation

Les contenus produits par Cadrage Express sont générés par intelligence artificielle (Claude, Anthropic) et ont une valeur **indicative**. Ils doivent être relus, validés et complétés par les experts métier et techniques concernés avant toute décision ou engagement. Ne saisissez pas d'informations personnelles sensibles ou classifiées. L'utilisation est soumise aux [conditions d'utilisation Anthropic](https://www.anthropic.com/legal/consumer-usage-policy).

---

## Contribuer

Le projet est maintenu par l'équipe FAN / 574. Pour toute suggestion ou anomalie, contacter l'équipe via les canaux habituels ou ouvrir une issue sur le dépôt interne.

---

*Cadrage Express v8.2.5 — Fabrique de l'Adoption Numérique — e.SNCF Solutions*
