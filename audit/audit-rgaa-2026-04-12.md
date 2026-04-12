# Audit RGAA — Cadrage Express

**Date d'audit :** 2026-04-12  
**Version auditée :** v8.2.1  
**Référentiel :** RGAA 4.1 (Référentiel Général d'Amélioration de l'Accessibilité)  
**Périmètre :** Application SPA front-end — [index.html](../index.html), [css/style.css](../css/style.css), [js/app.js](../js/app.js)  
**Méthode :** Analyse statique complète du code source  
**Niveau de conformité global : NON CONFORME**

---

## Résumé Exécutif

Cadrage Express présente de **nombreuses non-conformités bloquantes** au regard du RGAA 4.1. L'application est construite entièrement en JavaScript vanilla avec des composants personnalisés (accordéons, cases à cocher, onglets, toggles) qui ne respectent aucun des patterns ARIA standards. L'absence totale d'attributs ARIA (0 occurrence dans le HTML), l'absence d'élément `<main>`, la non-association des labels aux champs de formulaire, et l'absence d'indicateurs de focus sur les boutons constituent les lacunes les plus graves.

### Score global : 3,0 / 10 — Non conforme

| Thématique RGAA | Critères couverts | Conformité |
|-----------------|------------------|-----------|
| Images (1) | 1.1, 1.2, 1.3 | Partiel |
| Cadres / iframes (2) | 2.1 | Non conforme |
| Couleurs (3) | 3.1, 3.2, 3.3 | Partiel |
| Multimédia (4) | N/A | Non applicable |
| Tableaux (5) | N/A | Non applicable |
| Liens (6) | 6.1, 6.2 | Non conforme |
| Scripts (7) | 7.1, 7.3, 7.5 | Non conforme |
| Éléments obligatoires (8) | 8.1, 8.2, 8.5, 8.6 | Partiel |
| Structuration (9) | 9.1, 9.2 | Non conforme |
| Présentation (10) | 10.1, 10.7 | Non conforme |
| Formulaires (11) | 11.1, 11.2, 11.9, 11.10 | Non conforme |
| Navigation (12) | 12.7, 12.8 | Non conforme |
| Consultation (13) | 13.8 | Non conforme |

> **Points positifs :** `<html lang="fr">`, `<title>`, `<meta charset>`, `<nav>`, `<footer>`, `disabled` correctement géré sur les boutons, `type="password"` sur la clé API, `rel="noopener"` sur le lien externe.

---

## 1. Non-conformités Critiques (bloquantes)

### 1.1 Zéro attribut ARIA dans tout le HTML [CRITIQUE]

**Fichier :** [index.html](../index.html)  
**Critères RGAA :** 7.1, 7.3, 7.5, 11.2  
**Données :** `grep -c "aria-" index.html` → **0 occurrence**

L'application ne contient aucun attribut ARIA (`aria-label`, `aria-expanded`, `aria-selected`, `aria-live`, `aria-describedby`, `aria-pressed`, `aria-hidden`, `role`, etc.). Tous les composants interactifs personnalisés (accordéon, onglets, cases à cocher, toggles) sont donc invisibles ou incompréhensibles pour les technologies d'assistance (lecteurs d'écran, navigation clavier).

**Éléments manquants par composant :**

| Composant | Élément HTML | ARIA manquant |
|-----------|-------------|--------------|
| Stepper (onglets) | `<button class="step-tab">` | `role="tab"`, `aria-selected`, `role="tablist"` parent |
| Accordéon questionnaire | `<div class="q-bloc-hd" onclick>` | `role="button"`, `aria-expanded`, `tabindex="0"` |
| Case à cocher personnalisée | `<div class="q-cb" onclick>` | `role="checkbox"`, `aria-checked`, `tabindex="0"` |
| Toggle agent actif/inactif | `<button class="agent-toggle">` | `aria-pressed` ou `aria-checked`, `aria-label` |
| Bouton modifier prompt agent | `<button class="agent-edit-btn">✎` | `aria-label` (le caractère ✎ n'est pas parlant) |
| Zones de dépôt (dropzones) | `<div class="compact-drop" onclick>` | `role="button"`, `tabindex="0"`, `aria-label` |
| Progress bar | `<div class="progress-wrap">` | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| Toast de notification | `<div class="toast">` | `role="status"` ou `aria-live="polite"` |
| Messages d'état dynamiques | `<div class="status-msg">` | `aria-live="polite"` |
| Bandeau avertissement config | `<div class="warn-box">` | `role="alert"` |

---

### 1.2 Labels de formulaire non associés aux champs [CRITIQUE]

**Fichier :** [index.html](../index.html) — toutes les sections formulaire  
**Critère RGAA :** 11.1  
**Données :** `grep -c "for=" index.html` → **0 occurrence**

Aucun label n'est associé programmatiquement à son champ via l'attribut `for`. Un lecteur d'écran ne peut donc pas annoncer le libellé du champ lors de la navigation clavier entre les champs.

**Liste des champs non associés :**

| Champ | `id` | Label visible | `for=` attendu |
|-------|------|--------------|----------------|
| Clé API | `cfgKey` | `<label class="flabel">Clé API</label>` | `for="cfgKey"` |
| Modèle Claude | `cfgModel` | `<label class="flabel">Modèle</label>` | `for="cfgModel"` |
| Max tokens | `cfgMaxTokens` | `<label class="flabel">Max tokens</label>` | `for="cfgMaxTokens"` |
| Contexte métier | `cfgContext` | `<label class="flabel">Contexte métier additionnel...</label>` | `for="cfgContext"` |
| Contenu design.md | `designMdArea` | `<label class="flabel">Contenu design.md...</label>` | `for="designMdArea"` |
| Nom de marque | `cfgBrandName` | `<label class="flabel">Nom de la marque...</label>` | `for="cfgBrandName"` |

**Correction — ajouter `for` sur chaque label :**
```html
<!-- Avant -->
<label class="flabel">Clé API</label>
<input class="finput" id="cfgKey" type="password" ...>

<!-- Après -->
<label class="flabel" for="cfgKey">Clé API</label>
<input class="finput" id="cfgKey" type="password" ...>
```

---

### 1.3 Iframes sans attribut `title` [CRITIQUE]

**Fichier :** [index.html](../index.html) lignes 353, 356, 359  
**Critère RGAA :** 2.1

Les 3 iframes d'affichage des livrables n'ont aucun attribut `title`. Un lecteur d'écran ne peut pas identifier leur contenu ni leur rôle.

```html
<!-- Situation actuelle — lignes 353, 356, 359 -->
<iframe id="synthFrame"   class="output-frame" sandbox="allow-same-origin"></iframe>
<iframe id="mockFrame"    class="output-frame" sandbox="allow-same-origin"></iframe>
<iframe id="cadrageFrame" class="output-frame" sandbox="allow-same-origin"></iframe>
```

**Correction :**
```html
<iframe id="synthFrame"   class="output-frame" sandbox="" title="Synthèse structurée du cadrage"></iframe>
<iframe id="mockFrame"    class="output-frame" sandbox="" title="Maquette applicative"></iframe>
<iframe id="cadrageFrame" class="output-frame" sandbox="" title="Pré-cadrage technique"></iframe>
```

---

### 1.4 Absence d'indicateurs de focus sur les boutons [CRITIQUE]

**Fichier :** [css/style.css](../css/style.css)  
**Critère RGAA :** 10.7  
**Données :** `grep -c ":focus" css/style.css` → **2 règles** — uniquement `.finput:focus` et `.ftextarea:focus`

Aucun indicateur de focus visuel n'est défini pour les éléments interactifs principaux. Un utilisateur naviguant au clavier (Tab) ne peut pas voir quel élément est sélectionné.

**Éléments sans `:focus` visible :**
- `.btn`, `.btn.primary`, `.btn.danger`, `.btn.accent`, `.btn.sm`
- `.btn-generate`, `.btn-analyse`
- `.method-tile`, `.del-tile`
- `.step-tab`
- `.btn-config`
- `.mic-btn`
- `.agent-toggle`, `.agent-edit-btn`
- `.q-bloc-hd` (div avec onclick)
- `.q-cb` (div avec onclick)

Note : `.finput:focus` et `.ftextarea:focus` ont un indicateur personnalisé (border-bottom cerulean) qui est acceptable, mais l'`outline: none` qui l'accompagne est non conforme sans garantie de visibilité sur tous les navigateurs.

**Correction minimale — ajouter dans [css/style.css](../css/style.css) :**
```css
/* Indicateur de focus global — après le reset */
:focus-visible {
  outline: 2px solid var(--cerulean);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Retirer uniquement pour les éléments ayant leur propre focus custom */
.finput:focus-visible,
.ftextarea:focus-visible {
  outline: none; /* remplacé par border-bottom */
}
```

---

### 1.5 Éléments interactifs non natifs non accessibles au clavier [CRITIQUE]

**Fichier :** [index.html](../index.html) + [js/app.js](../js/app.js)  
**Critère RGAA :** 7.3

Plusieurs éléments interactifs sont des `<div>` avec `onclick`, qui ne reçoivent ni focus au clavier ni événement clavier par défaut.

**Éléments concernés :**

| Élément | HTML actuel | Problème |
|---------|------------|---------|
| En-tête accordéon | `<div class="q-bloc-hd" onclick="toggleBloc(...)">` | Non focusable, non activable au clavier |
| Case à cocher | `<div class="q-cb" onclick="toggleManualCheck(...)">` | Non focusable, pas de rôle |
| Zone de dépôt audio | `<div id="audioDropZone" class="compact-drop" onclick="...">` | Non focusable |
| Zone de dépôt PDF | `<div id="pdfDropZone" class="compact-drop" onclick="...">` | Non focusable |

**Correction pour les en-têtes d'accordéon (générés dans [js/app.js](../js/app.js) l. 796–797) :**
```javascript
// Avant
`<div class="q-bloc-hd" onclick="toggleBloc(${bloc.id})">`

// Après
`<div class="q-bloc-hd" role="button" tabindex="0"
  aria-expanded="false"
  onclick="toggleBloc(${bloc.id})"
  onkeydown="if(event.key==='Enter'||event.key===' '){toggleBloc(${bloc.id});event.preventDefault()}">`
```

**Correction pour les cases à cocher ([js/app.js](../js/app.js) l. 804–806) :**
```javascript
// Avant
`<div class="q-cb" id="qcb_${...}" onclick="toggleManualCheck('${q.id}')">`

// Après
`<div class="q-cb" id="qcb_${...}" role="checkbox" tabindex="0"
  aria-checked="false" aria-label="${esc(q.texte)}"
  onclick="toggleManualCheck('${q.id}')"
  onkeydown="if(event.key==='Enter'||event.key===' '){toggleManualCheck('${q.id}');event.preventDefault()}">`
```

---

### 1.6 Absence d'élément `<main>` et de lien d'évitement [CRITIQUE]

**Fichier :** [index.html](../index.html)  
**Critères RGAA :** 9.2, 12.7

- Aucun élément `<main>` n'encadre le contenu principal. La `<div class="main">` ne peut pas être reconnue comme zone principale par les technologies d'assistance.
- Aucun lien d'évitement ("Aller au contenu") n'est présent, forçant les utilisateurs clavier/lecteurs d'écran à naviguer à travers la barre de navigation et le stepper à chaque chargement.

**Correction dans [index.html](../index.html) :**
```html
<!-- Après <body> -->
<a href="#main-content" class="skip-link">Aller au contenu principal</a>

<!-- Remplacer <div class="main"> par -->
<main id="main-content" class="main">
  ...
</main>
```

**CSS pour le lien d'évitement :**
```css
.skip-link {
  position: absolute; top: -100px; left: 1rem;
  background: var(--primaire); color: #fff;
  padding: 8px 16px; border-radius: 0 0 4px 4px;
  font-size: 13px; font-weight: 500; z-index: 9999;
  text-decoration: none; transition: top 0.2s;
}
.skip-link:focus { top: 0; }
```

---

## 2. Non-conformités Majeures

### 2.1 Hiérarchie des titres incohérente [MAJEUR]

**Fichier :** [index.html](../index.html)  
**Critère RGAA :** 9.1

La page utilise un `<h1>` dans la navigation, puis passe directement aux `<h3>` dans les cartes, sans `<h2>` intermédiaire.

| Ligne | Élément | Niveau attendu |
|-------|---------|---------------|
| 15 | `<h1>Cadrage Express</h1>` (dans `<nav>`) | ✅ H1 correct |
| 144 | `<h3>Source du besoin</h3>` | ❌ Devrait être H2 |
| 277 | `<h3>Questionnaire de cadrage</h3>` | ❌ Devrait être H2 |
| 301 | `<h3>Génération en cours</h3>` | ❌ Devrait être H2 |
| 313 | `<h3>Livrables</h3>` | ❌ Devrait être H2 |

Les titres de blocs du questionnaire (générés en JS, l. 799) sont des `<span>`, non des titres HTML — ce qui empêche la navigation par titres dans les lecteurs d'écran.

**Correction :** Remplacer les `<h3>` des cards par `<h2>`, et envisager d'utiliser `<h3>` pour les titres de blocs dans le questionnaire.

---

### 2.2 Régions ARIA live absentes pour les contenus dynamiques [MAJEUR]

**Fichier :** [index.html](../index.html)  
**Critère RGAA :** 7.5

Les messages dynamiques suivants ne sont pas annoncés aux lecteurs d'écran :

| Élément | `id` | Message type | ARIA manquant |
|---------|------|-------------|--------------|
| Message d'état analyse | `aStatus`, `fStatus` | `✓ 12 questions identifiées` | `aria-live="polite"` |
| Toast de notification | `toast` | `✓ design.md chargé` | `role="status"` |
| Avertissement configuration | `cfgWarning` | `⚠ Configuration requise` | `role="alert"` |
| Statut génération | `genStatusSynth/Mock/Cadrage` | `✓ Terminé` | `aria-live="polite"` |
| Badge progression questionnaire | `qProgressLabel` | `12 / 65 (18%)` | `aria-live="polite"` |

**Corrections dans [index.html](../index.html) :**
```html
<!-- Toast -->
<div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true">✓ OK</div>

<!-- Avertissement config -->
<div id="cfgWarning" class="warn-box" role="alert" style="display:none;">...</div>

<!-- Messages d'état -->
<div class="status-msg" id="aStatus" aria-live="polite"></div>
```

---

### 2.3 Stepper non conforme au pattern ARIA tabs [MAJEUR]

**Fichier :** [index.html](../index.html) lignes 31–43  
**Critère RGAA :** 7.1

Le stepper fonctionne comme un système d'onglets mais n'implémente pas le pattern ARIA correspondant. Un lecteur d'écran ne peut pas identifier la nature de ces contrôles ni l'état actif.

```html
<!-- Situation actuelle -->
<div class="stepper">
  <button class="step-tab" id="stab0" onclick="goStep(0)">...</button>
  <span class="step-connector">›</span>
  <button class="step-tab active" id="stab1" onclick="goStep(1)">...</button>
  ...
</div>
```

**Correction :**
```html
<div class="stepper" role="tablist" aria-label="Étapes de la session de cadrage">
  <button class="step-tab" id="stab0" role="tab" aria-selected="false" aria-controls="panel0" onclick="goStep(0)">
    <span class="step-num" id="snum0" aria-hidden="true">⚙</span> Config
  </button>
  <span class="step-connector" aria-hidden="true">›</span>
  <button class="step-tab active" id="stab1" role="tab" aria-selected="true" aria-controls="panel1" onclick="goStep(1)">
    <span class="step-num" id="snum1" aria-hidden="true">1</span> Recueil
  </button>
  ...
</div>

<!-- Panels -->
<div class="panel visible" id="panel0" role="tabpanel" aria-labelledby="stab0" tabindex="0">...</div>
```

Et dans [js/app.js](../js/app.js), mettre à jour `goStep()` pour basculer `aria-selected` :
```javascript
document.getElementById('stab' + i).setAttribute('aria-selected', i === n ? 'true' : 'false');
```

---

### 2.4 Barres de progression sans ARIA [MAJEUR]

**Fichier :** [index.html](../index.html) lignes 195, 226, 280–282  
**Critère RGAA :** 7.1

Les barres de progression n'ont aucun attribut ARIA et ne communiquent aucune information d'avancement aux technologies d'assistance.

```html
<!-- Situation actuelle — ligne 195 -->
<div class="progress-wrap" id="aProg">
  <div class="progress-fill" id="aProgFill"></div>
</div>

<!-- Situation actuelle — ligne 280 -->
<div class="q-progress-wrap">
  <div class="q-progress-bar">
    <div class="q-progress-fill" id="qProgressFill"></div>
  </div>
  <div class="q-progress-label" id="qProgressLabel">0 / 65 (0%)</div>
</div>
```

**Correction :**
```html
<div class="progress-wrap" id="aProg" role="progressbar"
  aria-label="Progression de l'analyse"
  aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
  <div class="progress-fill" id="aProgFill"></div>
</div>
```

Et dans [js/app.js](../js/app.js), mettre à jour `aria-valuenow` lors du changement de `fill.style.width`.

---

### 2.5 Toggle agents sans état accessible [MAJEUR]

**Fichier :** [js/app.js](../js/app.js) lignes 222  
**Critère RGAA :** 7.1

Le bouton toggle (activé/désactivé) des agents n'expose aucun état aux technologies d'assistance. Un utilisateur de lecteur d'écran ne sait pas si l'agent est actif ou non.

```javascript
// Situation actuelle (generé par renderAgentGrid)
`<button class="agent-toggle ${a.enabled ? 'on' : ''}" id="at_${a.key}" onclick="toggleAgent('${a.key}')"></button>`
```

**Correction :**
```javascript
`<button class="agent-toggle ${a.enabled ? 'on' : ''}" id="at_${a.key}"
  role="switch"
  aria-checked="${a.enabled ? 'true' : 'false'}"
  aria-label="${a.enabled ? 'Désactiver' : 'Activer'} l'agent ${a.label}"
  onclick="toggleAgent('${a.key}')"></button>`
```

---

### 2.6 Emojis et icônes non masqués aux technologies d'assistance [MAJEUR]

**Fichiers :** [index.html](../index.html), [js/app.js](../js/app.js)  
**Critère RGAA :** 1.2

L'application utilise massivement des emojis comme icônes décoratives dans des éléments interactifs. Sans `aria-hidden="true"`, un lecteur d'écran lira l'emoji complet (ex. : "Micro", "Crayon", "Sablier rotatif de sens inverse des aiguilles d'une montre").

**Exemples critiques (emojis dans des boutons sans label textuel) :**
- `<button class="mic-btn" ...>🎤</button>` → lu "Microphone" mais le titre `title` est ignoré par certains lecteurs d'écran
- `<button class="btn sm" onclick="toggleKey()">👁</button>` → aucun label, aucun aria-label
- `<button class="btn sm danger" onclick="clearAudio()">✕</button>` → aucun label
- Icônes dans `.mt-icon`, `.dt-icon`, `.fl-icon`, etc.

**Correction — deux approches :**

Option A (icône décorative + label textuel visible) :
```html
<!-- Avant -->
<button class="btn sm" onclick="toggleKey()">👁</button>

<!-- Après — label visible accessible -->
<button class="btn sm" onclick="toggleKey()" aria-label="Afficher/masquer la clé API">
  <span aria-hidden="true">👁</span>
</button>
```

Option B (aria-label sur le bouton) :
```html
<button class="mic-btn" id="micBtn" onclick="toggleMic()" 
  aria-label="Démarrer la dictée" aria-pressed="false">
  <span aria-hidden="true">🎤</span>
</button>
```

---

### 2.7 Lien externe sans indication d'ouverture dans un nouvel onglet [MAJEUR]

**Fichier :** [index.html](../index.html) ligne 382  
**Critère RGAA :** 6.2

```html
<!-- Situation actuelle -->
<a href="https://www.anthropic.com/legal/consumer-usage-policy" target="_blank" rel="noopener">
  conditions d'utilisation d'Anthropic
</a>
```

Le lien s'ouvre dans un nouvel onglet (`target="_blank"`) sans en avertir l'utilisateur, ce qui peut désorienter les utilisateurs de lecteurs d'écran ou de navigation clavier.

**Correction :**
```html
<a href="https://www.anthropic.com/legal/consumer-usage-policy" target="_blank" rel="noopener"
  aria-label="Conditions d'utilisation d'Anthropic (nouvelle fenêtre)">
  conditions d'utilisation d'Anthropic
  <span class="sr-only">(nouvelle fenêtre)</span>
</a>
```

Et dans le CSS :
```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
```

---

### 2.8 Animation infinie sans mécanisme de pause [MAJEUR]

**Fichier :** [css/style.css](../css/style.css) lignes 91–101  
**Critère RGAA :** 13.8 (WCAG 2.2.2)

L'animation `.point-vivant` (pulse) se répète indéfiniment sans possibilité de la mettre en pause. Pour les utilisateurs sensibles aux mouvements (épilepsie photosensible, troubles vestibulaires), toute animation continue peut être gênante ou dangereuse.

```css
/* Situation actuelle */
.point-vivant {
  animation: pulse 2s ease-in-out infinite;
}
```

**Correction — respecter `prefers-reduced-motion` :**
```css
@media (prefers-reduced-motion: reduce) {
  .point-vivant {
    animation: none;
  }
  .spinner {
    animation: none;
    border-top-color: var(--cerulean);
  }
  .mic-btn.recording {
    animation: none;
  }
  * {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. Non-conformités Mineures

### 3.1 Contraste insuffisant — texte secondaire en nav [MINEURE]

**Fichier :** [css/style.css](../css/style.css) ligne 110  
**Critère RGAA :** 3.2  
**WCAG :** 1.4.3 Contraste (Niveau AA)

```css
.nav-status {
  color: rgba(255,255,255,0.45); /* ≈ #8a9db5 sur fond #001b44 */
}
```

Ratio de contraste estimé : **≈ 4,9:1** → passe AA (≥ 4,5:1 pour texte normal 11px) mais de justesse. À surveiller si la couleur de fond évolue.

**Cas plus problématique — texte indicatif de l'audio-compat-badge [MINEURE]**
```css
.audio-incompat-badge {
  color: var(--sur-surface-secondaire); /* #44474e */
  /* Sur fond --surface-haute (#dfe3e8) → ≈ 7.8:1 ✅ */
}
```

**Cas à risque — `.q-item-answer` (réponses du questionnaire) [MINEURE]**
```css
.q-item-answer {
  color: var(--menthe); /* #00b388 */
  font-size: 11px;
  /* Sur fond blanc #ffffff → ratio ≈ 4.4:1 → ÉCHEC AA pour texte 11px (< 4.5:1) */
}
```

Ce texte de 11px en `#00b388` sur fond blanc **ne passe pas le critère de contraste WCAG AA** (ratio 4,4:1 au lieu de 4,5:1 minimum). Correction : utiliser `#008f6f` (#007A5E au minimum) ou augmenter la taille de police.

---

### 3.2 Champs de fichier cachés sans label accessible [MINEURE]

**Fichier :** [index.html](../index.html) lignes 181, 212, 105  
**Critère RGAA :** 11.1

Les inputs `<input type="file">` sont cachés (`display:none`) et déclenchés par des boutons. Cette technique est acceptable si le bouton déclencheur a un label clair, mais les inputs eux-mêmes n'ont pas d'attribut `aria-label` ou `aria-labelledby`.

```html
<!-- Ligne 105 -->
<input id="designFilePicker" type="file" style="display:none" accept=".md,.txt" onchange="handleDesignFileSelect(this)" />
```

**Correction minimale :**
```html
<input id="designFilePicker" type="file" style="display:none"
  aria-label="Importer un fichier design.md"
  accept=".md,.txt" onchange="handleDesignFileSelect(this)" />
```

---

### 3.3 Textarea agents sans label accessible [MINEURE]

**Fichier :** [js/app.js](../js/app.js) ligne 225  
**Critère RGAA :** 11.1

Les textareas de prompt des agents sont générées dynamiquement sans label visible ni `aria-label` :

```javascript
`<textarea id="ap_${a.key}" oninput="updateAgentPrompt('${a.key}', this.value)">${esc(a.prompt)}</textarea>`
```

**Correction :**
```javascript
`<textarea id="ap_${a.key}"
  aria-label="Prompt de l'agent ${a.label}"
  oninput="updateAgentPrompt('${a.key}', this.value)">${esc(a.prompt)}</textarea>`
```

---

### 3.4 `<h1>` dans la navigation [MINEURE]

**Fichier :** [index.html](../index.html) ligne 15  
**Critère RGAA :** 9.1

Le `<h1>` est placé dans l'élément `<nav>`, ce qui est sémantiquement incorrect. Le titre principal de la page devrait être dans le contenu principal (`<main>`), pas dans la navigation.

**Correction :** Convertir le titre en `<nav>` en texte non-titre et ajouter un `<h1>` dans `<main>` (même si visuellement masqué pour les voyants) :
```html
<nav>
  <div class="nav-brand">
    <div class="logo-icon" aria-hidden="true">CE</div>
    <span class="nav-brand-name">Cadrage Express</span> <!-- plus de h1 ici -->
  </div>
  ...
</nav>

<main id="main-content" class="main">
  <h1 class="sr-only">Cadrage Express — Outil de cadrage de projets</h1>
  ...
</main>
```

---

### 3.5 `outline: none` sans garantie de remplacement [MINEURE]

**Fichier :** [css/style.css](../css/style.css) lignes 283–284  
**Critère RGAA :** 10.7

```css
.finput:focus, .ftextarea:focus {
  background: var(--surface-flottante);
  border-bottom-color: var(--primaire);
  outline: none; /* suppression de l'outline par défaut */
}
```

L'indicateur de focus personnalisé (border-bottom en `--primaire` = `#001b44`) est visible sur fond clair mais pourrait être insuffisant dans certains contextes (thèmes de contraste élevé, Windows High Contrast Mode).

**Recommandation :** Remplacer `outline: none` par `outline: 2px solid transparent` (garde la structure) et se fier à la bordure bottom comme indicateur, ou utiliser `:focus-visible` pour ne cibler que la navigation clavier.

---

## 4. Points Positifs (Conformités Partielles)

| Pratique | Critère RGAA | Statut | Vérification |
|----------|-------------|--------|-------------|
| `<html lang="fr">` | 8.3 | ✅ Conforme | [index.html](../index.html) l. 2 |
| `<title>Cadrage Express</title>` | 8.5 | ✅ Conforme | [index.html](../index.html) l. 6 |
| `<meta charset="UTF-8">` | 8.1 | ✅ Conforme | [index.html](../index.html) l. 4 |
| `<meta name="viewport">` | 13.9 | ✅ Conforme | [index.html](../index.html) l. 5 |
| `<nav>` sémantique | 9.2 | ✅ Conforme | [index.html](../index.html) l. 12 |
| `<footer>` sémantique | 9.2 | ✅ Conforme | [index.html](../index.html) l. 368 |
| Attribut `disabled` sur boutons | 11.9 | ✅ Conforme | `transcribeBtn`, `analyzeBtn` |
| `type="password"` sur champ clé API | 11.1 | ✅ Partiel | [index.html](../index.html) l. 57 |
| `title` sur les 6 boutons method-tile | 6.1 | ✅ Partiel | [index.html](../index.html) l. 151–169 |
| `title` sur le bouton config ⚙ | 6.1 | ✅ Partiel | [index.html](../index.html) l. 26 |
| `rel="noopener"` sur lien externe | 6.2 | ✅ Partiel | [index.html](../index.html) l. 382 |
| Alternatives textuelles pour les méthodes | 11.1 | ✅ Partiel | Labels `.mt-label` visibles |
| `display:none` pour masquer les panels | 12.8 | ✅ Conforme | Panneaux masqués correctement |
| Contraste texte corps | 3.2 | ✅ Conforme | `#181c20` sur `#f7f9ff` ≈ 16:1 |
| Libellés de formulaire visibles | 11.2 | ✅ Partiel | Labels visibles mais non associés |

---

## 5. Analyse par Thématique RGAA 4.1

| Thématique | Critères testés | Conformes | Non conformes | Taux |
|------------|----------------|-----------|--------------|------|
| 1 — Images | 1.1, 1.2, 1.3 | 0 | 3 | 0 % |
| 2 — Cadres | 2.1 | 0 | 1 | 0 % |
| 3 — Couleurs | 3.1, 3.2, 3.3 | 2 | 1 | 66 % |
| 4 — Multimédia | N/A | — | — | N/A |
| 5 — Tableaux | N/A | — | — | N/A |
| 6 — Liens | 6.1, 6.2 | 1 | 1 | 50 % |
| 7 — Scripts | 7.1, 7.3, 7.5 | 0 | 3 | 0 % |
| 8 — Éléments obligatoires | 8.1, 8.2, 8.3, 8.5, 8.6 | 4 | 1 | 80 % |
| 9 — Structuration | 9.1, 9.2 | 1 | 2 | 33 % |
| 10 — Présentation | 10.1, 10.7 | 0 | 2 | 0 % |
| 11 — Formulaires | 11.1, 11.2, 11.9, 11.10 | 1 | 3 | 25 % |
| 12 — Navigation | 12.7, 12.8 | 1 | 1 | 50 % |
| 13 — Consultation | 13.8 | 0 | 1 | 0 % |

**Taux de conformité global (critères applicables) : ≈ 32 %**

---

## 6. Plan de Remédiation Prioritaire

### Semaine 1 — Corrections rapides, impact élevé (~4h)

| Priorité | Action | Fichier | Effort |
|----------|--------|---------|--------|
| 🔴 P1 | **Associer les labels aux champs** : ajouter `for=` sur 6 labels | [index.html](../index.html) | 15 min |
| 🔴 P1 | **Ajouter `title` aux iframes** : 3 iframes sans titre | [index.html](../index.html) l. 353–359 | 5 min |
| 🔴 P1 | **Indicateur de focus global** : une règle `:focus-visible` CSS | [css/style.css](../css/style.css) | 10 min |
| 🔴 P1 | **`aria-label` sur les boutons icône-seulement** : 👁, ✕, 🔄, ✎ | [index.html](../index.html) | 20 min |
| 🔴 P1 | **`aria-live` sur les zones de statut dynamique** : `aStatus`, `fStatus`, `toast`, `cfgWarning` | [index.html](../index.html) | 20 min |
| 🔴 P1 | **`<main>` + lien d'évitement** : ajouter `<a class="skip-link">` + remplacer `.main` div | [index.html](../index.html) | 20 min |
| 🟠 P2 | **`prefers-reduced-motion`** : désactiver animations continues | [css/style.css](../css/style.css) | 15 min |
| 🟠 P2 | **H1 hors nav + corriger hiérarchie H2/H3** | [index.html](../index.html) | 30 min |
| 🟠 P2 | **Corriger contraste `.q-item-answer`** : #00b388 → #008060 | [css/style.css](../css/style.css) | 5 min |
| 🟠 P2 | **`aria-label` + `role="switch" aria-checked` sur les toggles agents** | [js/app.js](../js/app.js) l. 222 | 30 min |

### Semaines 2–3 — Composants interactifs accessibles (~8h)

| Action | Fichier | Effort |
|--------|---------|--------|
| **Accordéon questionnaire** : `role="button"`, `aria-expanded`, `tabindex="0"`, handler clavier | [js/app.js](../js/app.js) l. 796–812 | 2h |
| **Cases à cocher** : `role="checkbox"`, `aria-checked`, `tabindex="0"`, handler clavier | [js/app.js](../js/app.js) l. 804–806 | 1h |
| **Stepper/tabs ARIA** : `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"` | [index.html](../index.html) + [js/app.js](../js/app.js) | 2h |
| **Barres de progression** : `role="progressbar"`, `aria-valuenow` | [index.html](../index.html) + [js/app.js](../js/app.js) | 1h |
| **`aria-hidden="true"` sur tous les emojis décoratifs** | [index.html](../index.html) + [js/app.js](../js/app.js) | 1h |
| **Zones de dépôt** : `role="button"`, `tabindex="0"`, aria-label, handler clavier | [index.html](../index.html) | 1h |

### Mois 1 — Conformité renforcée (~12h)

| Action | Effort |
|--------|--------|
| Audit de contraste complet avec un outil dédié (Colour Contrast Analyser, axe) | 2h |
| Test avec lecteur d'écran (NVDA + Firefox, VoiceOver + Safari) | 4h |
| Migration des handlers `onclick` inline vers `addEventListener` (cohérence avec audit cyber) | 4h |
| Déclaration d'accessibilité (obligatoire pour les organismes publics) | 2h |

---

## 7. Synthèse Exécutive pour Décideurs

**Ce qui est conforme dès maintenant :** La page dispose d'une langue définie (`lang="fr"`), d'un titre, d'éléments sémantiques `<nav>` et `<footer>`, et d'un contraste de texte corps très correct. Les boutons principaux ont des états `disabled` bien gérés. Ce sont de bonnes bases.

**Ce qui bloque l'accessibilité aujourd'hui :**
1. **Navigation au clavier impossible** sur le questionnaire, les accordéons, les cases à cocher et les zones de dépôt (non focusables).
2. **Lecteur d'écran aveugle** aux changements d'état (analyse en cours, questions validées, erreurs) — aucune région `aria-live`.
3. **Formulaires de configuration inutilisables** pour un utilisateur aveugle (labels non liés aux champs).

**Ce qui se corrige en moins d'une heure :** associations `for=`, `title` sur les iframes, indicateur de focus CSS global, `aria-live` sur les zones de statut, lien d'évitement. Ces 5 actions couvrent les cas les plus bloquants avec un effort minimal.

**Contexte réglementaire :** Pour un outil déployé dans un établissement public (SNCF), la loi du 11 février 2005 (modifiée par la loi pour une République Numérique 2016) impose une accessibilité de niveau RGAA AA aux services numériques internes. Une déclaration d'accessibilité est obligatoire. Le taux de conformité actuel (~32 %) est insuffisant et expose l'organisation à un risque de non-conformité réglementaire.

---

*Audit réalisé par analyse statique complète du code source. Aucun test dynamique avec lecteur d'écran n'a été effectué — un test manuel avec NVDA/JAWS est recommandé pour compléter cet audit. Dernière révision : v8.2.1 — 2026-04-12.*
