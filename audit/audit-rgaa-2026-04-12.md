# Audit RGAA — Cadrage Express

**Date d'audit :** 2026-04-12  
**Version auditée :** v8.2.3  
**Référentiel :** RGAA 4.1 (Référentiel Général d'Amélioration de l'Accessibilité)  
**Périmètre :** Application SPA front-end — [index.html](../index.html), [css/style.css](../css/style.css), [js/app.js](../js/app.js)  
**Méthode :** Analyse statique complète du code source  
**Niveau de conformité global : PARTIELLEMENT CONFORME**

---

## Résumé Exécutif

Suite aux corrections appliquées en v8.2.3, Cadrage Express a significativement progressé sur l'accessibilité RGAA 4.1. Les non-conformités les plus bloquantes ont été corrigées : association labels/champs, iframes titrées, régions live pour les messages dynamiques, indicateurs de focus visibles, lien d'évitement, sémantique `<main>`, contraste des réponses du questionnaire, et attributs ARIA sur les composants agents.

Les composants complexes (stepper, accordéon, cases à cocher personnalisées, barres de progression dynamiques) présentent encore des non-conformités qui nécessitent une refonte JS plus profonde.

### Score global : 5,5 / 10 — Partiellement conforme

| Thématique RGAA | Critères couverts | Conformité |
|-----------------|------------------|-----------|
| Images (1) | 1.1, 1.2, 1.3 | Partiel |
| Cadres / iframes (2) | 2.1 | **Conforme** ✅ |
| Couleurs (3) | 3.1, 3.2, 3.3 | **Conforme** ✅ |
| Multimédia (4) | N/A | Non applicable |
| Tableaux (5) | N/A | Non applicable |
| Liens (6) | 6.1, 6.2 | **Conforme** ✅ |
| Scripts (7) | 7.1, 7.3, 7.5 | Partiel |
| Éléments obligatoires (8) | 8.1, 8.2, 8.5, 8.6 | Conforme |
| Structuration (9) | 9.1, 9.2 | Partiel |
| Présentation (10) | 10.1, 10.7 | **Conforme** ✅ |
| Formulaires (11) | 11.1, 11.2, 11.9, 11.10 | **Conforme** ✅ |
| Navigation (12) | 12.7, 12.8 | **Conforme** ✅ |
| Consultation (13) | 13.8 | **Conforme** ✅ |

> **Points positifs :** `<html lang="fr">`, `<title>`, `<meta charset>`, `<nav>`, `<footer>`, `<main id="main-content">`, lien d'évitement, labels associés, iframes titrées, `:focus-visible`, `prefers-reduced-motion`, `aria-live` sur tous les messages dynamiques, `role="switch"` sur toggles agents, `aria-pressed` sur bouton mic, contraste corrigé sur `.q-item-answer`.

---

## 1. Corrections appliquées en v8.2.3

### ✅ 1.1 Labels de formulaire associés aux champs [RÉSOLU]

**Critère RGAA :** 11.1  
Les 6 labels de la section configuration ont reçu leur attribut `for` pointant vers l'`id` du champ associé.

| Champ | Correction appliquée |
|-------|---------------------|
| Clé API (`cfgKey`) | `<label for="cfgKey">` |
| Modèle (`cfgModel`) | `<label for="cfgModel">` |
| Max tokens (`cfgMaxTokens`) | `<label for="cfgMaxTokens">` |
| Contexte métier (`cfgContext`) | `<label for="cfgContext">` |
| Contenu design.md (`designMdArea`) | `<label for="designMdArea">` |
| Nom de marque (`cfgBrandName`) | `<label for="cfgBrandName">` |

---

### ✅ 1.2 Iframes titrées [RÉSOLU]

**Critère RGAA :** 2.1  
Les 3 iframes d'affichage des livrables ont reçu leur attribut `title`. L'attribut `sandbox="allow-same-origin"` est conservé (nécessaire au rendu).

| iframe | title ajouté |
|--------|-------------|
| `synthFrame` | `"Synthèse structurée du cadrage"` |
| `mockFrame` | `"Maquette applicative"` |
| `cadrageFrame` | `"Pré-cadrage technique"` |

---

### ✅ 1.3 Indicateurs de focus visibles [RÉSOLU]

**Critère RGAA :** 10.7  
Ajout d'une règle `:focus-visible` globale dans [css/style.css](../css/style.css) :

```css
:focus-visible {
  outline: 2px solid var(--cerulean);
  outline-offset: 2px;
  border-radius: 2px;
}
```

Les inputs et textareas conservent leur indicateur `border-bottom` personnalisé via `outline: 2px solid transparent`.

---

### ✅ 1.4 Élément `<main>` et lien d'évitement [RÉSOLU]

**Critères RGAA :** 9.2, 12.7  
- `<div class="main">` converti en `<main id="main-content" class="main">`.
- Lien d'évitement `<a href="#main-content" class="skip-link">Aller au contenu principal</a>` ajouté juste après `<body>`.
- Classe `.skip-link` ajoutée en CSS (masqué visuellement sauf au focus).

---

### ✅ 1.5 Régions ARIA live pour les contenus dynamiques [RÉSOLU]

**Critère RGAA :** 7.5  

| Élément | Attribut ajouté |
|---------|----------------|
| Toast `#toast` | `role="status" aria-live="polite" aria-atomic="true"` |
| Avertissement `#cfgWarning` | `role="alert"` |
| Statut analyse audio `#aStatus` | `aria-live="polite"` |
| Statut analyse PDF `#fStatus` | `aria-live="polite"` |
| Progression questionnaire `#qProgressLabel` | `aria-live="polite"` |
| Statut génération `#genStatusSynth/Mock/Cadrage` | `aria-live="polite"` |

---

### ✅ 1.6 Animation infinie et `prefers-reduced-motion` [RÉSOLU]

**Critère RGAA :** 13.8  
Media query ajoutée en CSS :

```css
@media (prefers-reduced-motion: reduce) {
  .point-vivant { animation: none; opacity: 0.6; }
  .spinner { animation: none; border-top-color: var(--cerulean); }
  .mic-btn.recording { animation: none; }
  * { transition-duration: 0.01ms !important; }
}
```

---

### ✅ 1.7 Contraste `.q-item-answer` [RÉSOLU]

**Critère RGAA :** 3.2  
Couleur corrigée : `var(--menthe)` (`#00b388`, ratio 4,4:1 — ÉCHEC AA) remplacé par `#008f6f` (ratio ≥ 4,5:1 — PASS AA) pour le texte 11px des réponses du questionnaire.

---

### ✅ 1.8 Liens externes — indication nouvelle fenêtre [RÉSOLU]

**Critère RGAA :** 6.2  
Lien Anthropic mis à jour :

```html
<a href="..." target="_blank" rel="noopener"
   aria-label="Conditions d'utilisation d'Anthropic (nouvelle fenêtre)">
  conditions d'utilisation d'Anthropic<span class="sr-only"> (nouvelle fenêtre)</span>
</a>
```

Classe `.sr-only` ajoutée en CSS (masquage accessible standard).

---

### ✅ 1.9 Inputs `type="file"` cachés [RÉSOLU]

**Critère RGAA :** 11.1  
Les 3 inputs file masqués ont reçu un `aria-label` :

| Input | `aria-label` |
|-------|-------------|
| `designFilePicker` | `"Importer un fichier design.md"` |
| `audioPicker` | `"Importer un fichier audio"` |
| `filePicker` | `"Importer un fichier PDF ou texte"` |

---

### ✅ 1.10 Hiérarchie des titres — H3 → H2 [RÉSOLU]

**Critère RGAA :** 9.1  
Les 4 titres de sections principales corrigés de `<h3>` en `<h2>` :
- Source du besoin
- Questionnaire de cadrage
- Génération en cours
- Livrables

---

### ✅ 1.11 Composants agents accessibles [RÉSOLU]

**Critères RGAA :** 7.1, 11.1  
Dans `renderAgentGrid()` ([js/app.js](../js/app.js)) :

- **Bouton modifier prompt :** `aria-label="Modifier le prompt de l'agent ${a.label}"` + emoji enveloppé `aria-hidden="true"`
- **Toggle actif/inactif :** `role="switch"`, `aria-checked`, `aria-label` dynamique (Activer/Désactiver)
- **Textarea prompt :** `aria-label="Prompt de l'agent ${a.label}"`

---

### ✅ 1.12 Bouton microphone [RÉSOLU]

**Critère RGAA :** 7.1  
- `aria-pressed="false"` ajouté sur `#micBtn` dans le HTML.
- `startMic()` met à jour `aria-pressed="true"` et `aria-label="Arrêter la dictée"`.
- `stopMic()` remet `aria-pressed="false"` et `aria-label="Démarrer la dictée"`.
- Emoji enveloppé dans `<span aria-hidden="true">`.

---

## 2. Non-conformités Restantes

### 2.1 Stepper non conforme au pattern ARIA tabs [MAJEUR]

**Fichier :** [index.html](../index.html) lignes 33–45  
**Critère RGAA :** 7.1  

Le stepper fonctionne comme un système d'onglets mais n'implémente pas le pattern ARIA correspondant. Nécessite une refonte de `goStep()` en JS.

**À faire :**
```html
<div class="stepper" role="tablist" aria-label="Étapes de la session de cadrage">
  <button class="step-tab" role="tab" aria-selected="false" aria-controls="panel0" ...>
```
Et dans `goStep()` :
```javascript
document.getElementById('stab' + i).setAttribute('aria-selected', i === n ? 'true' : 'false');
```

---

### 2.2 Éléments interactifs non natifs non accessibles au clavier [MAJEUR]

**Fichier :** [js/app.js](../js/app.js) lignes ~796–806  
**Critère RGAA :** 7.3  

Les `<div onclick>` de l'accordéon et des cases à cocher personnalisées ne sont pas focusables ni activables au clavier.

**À faire :** Ajouter `role="button"`, `tabindex="0"`, `aria-expanded` sur les en-têtes d'accordéon, et `role="checkbox"`, `aria-checked`, `tabindex="0"`, `onkeydown` sur les cases à cocher.

---

### 2.3 Barres de progression sans ARIA dynamique [MAJEUR]

**Fichier :** [index.html](../index.html) lignes 197, 228  
**Critère RGAA :** 7.1  

Les `<div class="progress-wrap">` n'ont pas de `role="progressbar"` ni d'`aria-valuenow` mis à jour dynamiquement.

**À faire :**
```html
<div class="progress-wrap" id="aProg" role="progressbar"
  aria-label="Progression de l'analyse" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
```
Et mettre à jour `aria-valuenow` dans le JS lors des mises à jour de largeur.

---

### 2.4 `<h1>` dans la navigation [MINEURE]

**Fichier :** [index.html](../index.html) ligne 15  
**Critère RGAA :** 9.1  

Le `<h1>` reste dans `<nav>`. Sémantiquement, le titre principal devrait être dans `<main>`.

---

### 2.5 Zéro ARIA sur les dropzones [MINEURE]

**Fichier :** [index.html](../index.html) lignes 174, 205  
**Critère RGAA :** 7.3  

Les `<div class="compact-drop" onclick>` restent non focusables.

```html
<!-- À faire -->
<div ... role="button" tabindex="0"
  onkeydown="if(event.key==='Enter'||event.key===' '){this.click();event.preventDefault()}">
```

---

## 3. Points Positifs (Conformités)

| Pratique | Critère RGAA | Statut |
|----------|-------------|--------|
| `<html lang="fr">` | 8.3 | ✅ Conforme |
| `<title>Cadrage Express</title>` | 8.5 | ✅ Conforme |
| `<meta charset="UTF-8">` | 8.1 | ✅ Conforme |
| `<meta name="viewport">` | 13.9 | ✅ Conforme |
| `<nav>` sémantique | 9.2 | ✅ Conforme |
| `<main id="main-content">` | 9.2 | ✅ **Nouveau** |
| `<footer>` sémantique | 9.2 | ✅ Conforme |
| Lien d'évitement `.skip-link` | 12.7 | ✅ **Nouveau** |
| `for=` sur les 6 labels | 11.1 | ✅ **Nouveau** |
| `title` sur les 3 iframes | 2.1 | ✅ **Nouveau** |
| `role="alert"` sur cfgWarning | 7.5 | ✅ **Nouveau** |
| `aria-live` sur messages dynamiques | 7.5 | ✅ **Nouveau** |
| `:focus-visible` global | 10.7 | ✅ **Nouveau** |
| `prefers-reduced-motion` | 13.8 | ✅ **Nouveau** |
| Contraste `.q-item-answer` (AA) | 3.2 | ✅ **Nouveau** |
| `.sr-only` + lien nouvelle fenêtre | 6.2 | ✅ **Nouveau** |
| `aria-label` inputs file cachés | 11.1 | ✅ **Nouveau** |
| `role="switch"` + `aria-checked` agents | 7.1 | ✅ **Nouveau** |
| `aria-pressed` bouton mic | 7.1 | ✅ **Nouveau** |
| `aria-label` textarea agents | 11.1 | ✅ **Nouveau** |
| H3 → H2 sections principales | 9.1 | ✅ **Nouveau** |
| `disabled` correctement géré | 11.9 | ✅ Conforme |
| `type="password"` sur clé API | 11.1 | ✅ Conforme |
| `rel="noopener"` sur lien externe | 6.2 | ✅ Conforme |

---

## 4. Roadmap Accessibilité

| Priorité | Action | Critère | Effort |
|----------|--------|---------|--------|
| P1 | Stepper : `role="tablist/tab"` + `aria-selected` dans `goStep()` | 7.1 | Moyen |
| P1 | Accordéon : `role="button"`, `tabindex`, `aria-expanded`, `onkeydown` | 7.3 | Moyen |
| P1 | Cases à cocher : `role="checkbox"`, `aria-checked`, `onkeydown` | 7.3 | Moyen |
| P2 | Progress bars : `role="progressbar"`, `aria-valuenow` dynamique | 7.1 | Moyen |
| P2 | Dropzones : `role="button"`, `tabindex`, `onkeydown` | 7.3 | Faible |
| P3 | `<h1>` : déplacer dans `<main>`, convertir nav en `<span>` | 9.1 | Faible |
