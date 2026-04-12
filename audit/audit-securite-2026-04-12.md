# Audit de Sécurité — Cadrage Express

**Date d'audit :** 2026-04-12  
**Dernière mise à jour :** 2026-04-12 (v8.2.1 — audit intégral refait)  
**Version auditée :** v8.2.1  
**Périmètre :** Application SPA front-end uniquement (aucun backend)  
**Méthode :** Analyse statique complète du code source (`index.html`, `js/app.js`)  
**Niveau de risque global : MOYEN-ÉLEVÉ**

---

## Résumé Exécutif

Cadrage Express est une application web 100 % client (Single Page Application) sans serveur propre. Elle communique directement du navigateur vers l'API Anthropic. L'application présente de **bonnes pratiques de base** (pas de persistance de la clé API, échappement HTML via `esc()`, données en mémoire uniquement) mais conserve des **lacunes significatives** dans la configuration de sécurité, notamment l'exposition de la clé API côté navigateur et l'absence de Content Security Policy.

### Score global : 6,0 / 10 *(+0,5 par rapport à v8.2)*

| Catégorie | Évaluation | Statut v8.2.1 |
|-----------|-----------|--------------|
| Gestion des secrets | Insuffisant (clé API exposée côté client) | Partiellement traité — avertissement UI + détection HTTP ajoutés |
| XSS / Injection | Risque modéré (iframes non restreintes, innerHTML partiel) | Non traité |
| Headers de sécurité | Absent (CSP, X-Frame-Options, HSTS) | Non traité |
| Dépendances tierces | Risque (PDF.js sans contrôle d'intégrité) | Non traité |
| Données sensibles | Acceptable (tout en mémoire, jamais persisté) | Inchangé — OK |
| Architecture | Risqué pour un déploiement public | Inchangé |

---

## 1. Inventaire des Vulnérabilités

### Répartition par sévérité

| Sévérité | Nombre | Catégories | Traité en v8.2.1 |
|----------|--------|-----------|-----------------|
| **CRITIQUE** | 1 | Exposition clé API depuis le navigateur | Partiellement (avertissement UI + détection HTTP) |
| **ÉLEVÉE** | 5 | Injection HTML dans iframes, CSP absente, sandbox iframe insuffisant, handlers inline, innerHTML non sécurisé dans setGenStatus | Non |
| **MOYENNE** | 4 | Visibilité mot de passe, X-Frame-Options absent, fuites d'erreurs API, validation des entrées | Non |
| **FAIBLE** | 4 | Logs console, alert() navigateur, absence de timeout API, micro non libéré | Non |
| **INFO** | 4 | Flux de données, versions dépendances, CORS, architecture | Non |

> **v8.2.1 — 2 items traités :**
> - ✅ Bandeau ambre dans la config clé API ([index.html](../index.html) l. 60–63)
> - ✅ Détection HTTP au démarrage avec bandeau rouge ([js/app.js](../js/app.js) l. 173–180)

---

## 2. Vulnérabilités Critiques

### 2.1 Clé API Anthropic exposée dans le navigateur [CRITIQUE]

**Fichiers :** [js/app.js](../js/app.js) lignes 1092–1124 (`callClaudeAPI`), 1126–1166 (`callClaudeAPIWithAudio`)  
**Catégorie :** Exposition de credentials  
**CVSS 3.1 (indicatif) :** 7.4 — Élevé

**Description :**  
La clé API Anthropic est envoyée directement depuis le navigateur vers `api.anthropic.com` dans un header HTTP. Anthropic autorise cet usage via le header `anthropic-dangerous-direct-browser-access: true`, mais ce flag signale explicitement que l'usage est non sécurisé.

```javascript
// js/app.js — lignes 1096–1111 (callClaudeAPI)
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,                              // Clé visible dans l'onglet Réseau des DevTools
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'  // Flag d'accès dangereux explicite
  },
  ...
});
```

Même code présent dans `callClaudeAPIWithAudio` (l. 1130–1154).

**Vecteurs d'attaque :**
1. Clé visible en clair dans l'onglet Réseau des DevTools (aucun contrôle possible)
2. Interception possible si HTTP (réseau Wi-Fi public, proxy MITM) — partiellement mitigé par la détection HTTP v8.2.1
3. Toute injection XSS peut lire la valeur du champ `cfgKey` via `document.getElementById('cfgKey').value`
4. Extension de navigateur malveillante peut lire les headers des requêtes sortantes
5. Partage d'écran accidentel via DevTools ouverts

**Statut v8.2.1 — Partiellement traité :**
- ✅ Bandeau ambre dans le panneau de configuration ([index.html](../index.html) l. 60–63) : avertissement sur la visibilité DevTools et les réseaux non sécurisés
- ✅ Détection HTTP au démarrage ([js/app.js](../js/app.js) l. 173–180) : bandeau rouge fixe si l'application est servie en HTTP hors `localhost`/`127.0.0.1`
- ✅ README mis à jour avec les précautions d'usage
- ⏳ Proxy backend non implémenté — reste la recommandation principale pour un déploiement multi-utilisateurs

**Recommandations :**
1. **(Idéal — déploiement public)** Implémenter un proxy backend léger : `Navigateur → Proxy authentifié → API Anthropic`. La clé est stockée côté serveur, jamais transmise au client.
2. **(Minimum — usage interne)** Statut v8.2.1 est acceptable si le contexte est : réseau SNCF sécurisé, utilisateurs avertis, pas de données classifiées.
3. Documenter la politique de rotation de la clé API en cas de compromission suspectée.

---

## 3. Vulnérabilités Élevées

### 3.1 Injection HTML non sanitisée dans les iframes [ÉLEVÉE]

**Fichier :** [js/app.js](../js/app.js) lignes 1194–1200  
**Catégorie :** XSS / Injection de code  
**CVSS 3.1 (indicatif) :** 6.1 — Moyen-Élevé

**Description :**  
Le HTML généré par l'API Claude est écrit directement dans les iframes via `document.write()` sans aucune sanitisation :

```javascript
// js/app.js — lignes 1194–1200
function writeToFrame(frameId, html) {
  const iframe = document.getElementById(frameId);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);   // HTML brut provenant de l'API — aucune sanitisation
  doc.close();
}
```

Les 3 iframes dans [index.html](../index.html) (l. 353, 356, 359) utilisent `sandbox="allow-same-origin"`, ce qui **permet** à l'iframe d'accéder à `window.parent`, au localStorage, et d'exécuter des scripts. Si la réponse Claude contenait du JavaScript malveillant (prompt injection, compromission API), il serait exécuté dans le contexte de la page principale.

**Recommandations :**
1. **Changer l'attribut sandbox** : `sandbox="allow-same-origin"` → `sandbox=""` (action immédiate, aucun impact fonctionnel car les livrables sont uniquement affichés)
2. **Ajouter DOMPurify** pour sanitiser le HTML avant injection :
   ```javascript
   const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
   doc.write(clean);
   ```
3. Si `sandbox=""` casse l'affichage (styles), envisager `sandbox="allow-popups"` uniquement.

---

### 3.2 Absence de Content Security Policy (CSP) [ÉLEVÉE]

**Fichier :** [index.html](../index.html)  
**Catégorie :** Configuration de sécurité  
**CVSS 3.1 (indicatif) :** 6.5 — Moyen-Élevé

**Description :**  
Aucune directive CSP n'est définie ni en meta tag ni en header HTTP. Cela autorise :
- L'exécution de tout script inline (y compris injecté)
- Le chargement de ressources depuis n'importe quelle origine
- L'exfiltration de données vers des domaines arbitraires en cas d'injection

**Recommandation — Ajouter dans `<head>` de [index.html](../index.html) :**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://api.anthropic.com https://cdnjs.cloudflare.com;
  frame-src 'blob:' 'self';
  form-action 'self';
  base-uri 'self';
  frame-ancestors 'none'
">
```

> **Note :** `'unsafe-inline'` reste nécessaire pour les styles des livrables générés. Les 42 handlers inline (§3.4) nécessiteront une migration vers `addEventListener()` pour éliminer `'unsafe-inline'` des scripts.

---

### 3.3 Sandbox iframe insuffisant [ÉLEVÉE]

**Fichier :** [index.html](../index.html) lignes 353, 356, 359  
**Catégorie :** Isolation de contenu  
**CVSS 3.1 (indicatif) :** 5.9 — Moyen

**Description :**  
Les 3 iframes d'affichage des livrables utilisent `sandbox="allow-same-origin"`. Cette valeur autorise l'iframe à accéder à `window.parent`, au `localStorage`, et à bypasser les restrictions sandboxées en cas d'injection de script.

```html
<!-- index.html — lignes 353, 356, 359 (non modifié depuis v8.0) -->
<iframe id="synthFrame"   class="output-frame" sandbox="allow-same-origin"></iframe>
<iframe id="mockFrame"    class="output-frame" sandbox="allow-same-origin"></iframe>
<iframe id="cadrageFrame" class="output-frame" sandbox="allow-same-origin"></iframe>
```

**Recommandation — Correction immédiate :**
```html
<iframe id="synthFrame"   class="output-frame" sandbox=""></iframe>
<iframe id="mockFrame"    class="output-frame" sandbox=""></iframe>
<iframe id="cadrageFrame" class="output-frame" sandbox=""></iframe>
```

Le contenu est uniquement affiché (pas de formulaires, pas de navigation requise), `sandbox=""` est suffisant et beaucoup plus sûr. La fonction `autoResizeFrame` (l. 1202–1211) accède à `iframe.contentDocument` — elle cessera de fonctionner si `sandbox=""` est utilisé sans `allow-same-origin` ; mais cette limitation est acceptable car la hauteur fixe CSS est gérée via `calc(100vh - 160px)`.

---

### 3.4 Handlers d'événements inline — 42 occurrences [ÉLEVÉE]

**Fichier :** [index.html](../index.html) — 42 occurrences  
**Catégorie :** Architecture sécurité / CSP

**Description :**  
L'application utilise massivement les attributs `onclick`, `oninput`, `onchange` dans le HTML. Ces handlers inline sont incompatibles avec une CSP stricte (`script-src 'self'` sans `'unsafe-inline'`) et augmentent la surface d'attaque XSS.

**Exemples :**
- L. 26 : `onclick="openConfig()"`
- L. 57 : `oninput="updateCfg()"`
- L. 102 : `onchange="handleDesignFileSelect(this)"`
- L. 150–170 : 5 boutons method-tile avec `onclick="switchMethod(...)"`
- L. 198, 229, 268, 344 : boutons d'analyse/génération avec `onclick`

**Recommandation :**  
Migrer vers `addEventListener()` dans [js/app.js](../js/app.js) :
```javascript
// Avant (HTML inline)
// <button onclick="openConfig()">

// Après (JS séparé)
document.getElementById('btnConfig').addEventListener('click', openConfig);
```

---

### 3.5 innerHTML non sécurisé dans setGenStatus [ÉLEVÉE — NOUVEAU]

**Fichier :** [js/app.js](../js/app.js) lignes 987–991  
**Catégorie :** XSS via message d'erreur API

**Description :**  
La fonction `setGenStatus` injecte un message via `innerHTML` :

```javascript
// js/app.js — lignes 987–991
function setGenStatus(key, cls, html) {
  const el = document.getElementById('genStatus' + key);
  el.className = 'gi-status ' + cls;
  el.innerHTML = html;   // Peut contenir une portion d'err.message
}
```

En cas d'erreur API, l'appelant passe :
```javascript
setGenStatus(statusKey, 'error', '✕ ' + err.message.substring(0, 60));
```

Or `err.message` est construit à partir de la réponse HTTP brute : `HTTP ${response.status}: ${errText.substring(0, 200)}`. Si l'API renvoyait une réponse d'erreur contenant du HTML (ex. : compromission du DNS, proxy malveillant, MITM sur HTTP), les 60 premiers caractères pourraient inclure des balises `<script>` ou `<img onerror=...>`.

**Recommandation :**
```javascript
function setGenStatus(key, cls, text) {
  const el = document.getElementById('genStatus' + key);
  el.className = 'gi-status ' + cls;
  el.textContent = text;   // textContent, pas innerHTML
}
```

---

## 4. Vulnérabilités Moyennes

### 4.1 Visibilité de la clé API (toggle mot de passe) [MOYENNE]

**Fichier :** [index.html](../index.html) l. 57 ; [js/app.js](../js/app.js) — fonction `toggleKey()`  
**Description :**  
Le bouton "👁" affiche la clé API en clair. Risque de capture d'écran accidentelle ou lors d'un partage d'écran ou d'une démonstration.

**Recommandation :**  
Ajouter un avertissement visuel lors de l'affichage de la clé (ex. : toast ou bandeau temporaire : *"⚠ Masquez la clé avant de partager votre écran"*).

---

### 4.2 Absence de protection anti-clickjacking [MOYENNE]

**Description :**  
Sans header `X-Frame-Options: DENY` ou directive CSP `frame-ancestors 'none'`, l'application peut être chargée dans une iframe malveillante et faire l'objet d'une attaque clickjacking.

**Recommandation :**  
- Si déployé avec un serveur : ajouter `X-Frame-Options: DENY` et `X-Content-Type-Options: nosniff` aux headers de réponse.
- Via meta tag CSP (partiel) : `frame-ancestors 'none'` dans la directive CSP (§3.2).

---

### 4.3 Messages d'erreur API trop verbeux [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) lignes 1113–1116, 1156–1159  
**Description :**  
Les erreurs de l'API Anthropic incluent jusqu'à 200 caractères du corps de réponse HTTP brut, potentiellement révélateur d'informations internes (structure de l'API, codes internes Anthropic, etc.) :

```javascript
// js/app.js — ligne 1114–1116
if (!response.ok) {
  const errText = await response.text();
  throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
}
```

Ce message est ensuite affiché dans le DOM via `setGenStatus` (§3.5) et dans `errorPage()`. La fonction `errorPage` protège via `esc(msg)`, mais `setGenStatus` utilise `innerHTML` sans échappement.

**Recommandation :**  
Mapper les codes HTTP vers des messages génériques côté client :
```javascript
const HTTP_ERR = {
  401: 'Clé API invalide ou expirée.',
  429: 'Limite de débit API atteinte. Veuillez patienter.',
  500: 'Erreur interne de l\'API. Réessayez.',
};

function apiErrMsg(status) {
  return HTTP_ERR[status] || `Erreur API (HTTP ${status}). Vérifiez votre clé et réessayez.`;
}
```

---

### 4.4 Absence de validation des entrées utilisateur [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) — fonctions `runAnalysis()`, `runAnalysisFromPaste()`  
**Description :**  
Les réponses au questionnaire et les textes collés ne sont pas bornés en longueur avant envoi à l'API. Une saisie anormalement longue pourrait générer des requêtes hors budget ou déclencher des erreurs API difficiles à interpréter.

**Recommandation :**
```javascript
function validateInput(text, maxLen = 50000) {
  if (typeof text !== 'string') return '';
  return text.substring(0, maxLen).trim();
}
```

---

## 5. Vulnérabilités Faibles

### 5.1 Console.error en production [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) ligne 189  
**Description :**  
`console.error('Impossible de charger cadrage-questions.json :', e)` expose un chemin de fichier et une trace d'erreur dans les DevTools, fournissant des informations sur la structure du serveur.  
**Recommandation :** Supprimer ou conditionner à un flag de développement.

---

### 5.2 Utilisation de `alert()` navigateur — 8 occurrences [FAIBLE]

**Fichier :** [js/app.js](../js/app.js)

| Ligne | Message |
|-------|---------|
| 434 | `La reconnaissance vocale n'est pas supportée par ce navigateur.` |
| 527 | `La transcription est vide. Parlez d'abord !` |
| 687 | `Veuillez saisir votre clé API Anthropic.` |
| 736 | `Veuillez coller du texte avant de lancer l'analyse.` |
| 763 | `Veuillez saisir votre clé API Anthropic.` |
| 909 | `Veuillez saisir votre clé API Anthropic.` |
| 924 | `Veuillez répondre à au moins une question avant de générer.` |
| 1245 | `Aucun contenu à télécharger.` |

**Description :** Les `alert()` bloquent le thread principal et peuvent être supprimés ou détournés par des scripts tiers. Le système de toast `showToast()` est déjà implémenté dans l'application.  
**Recommandation :** Remplacer tous les `alert()` par `showToast()` (avec une variante d'erreur si besoin).

---

### 5.3 Absence de timeout sur les requêtes API [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) lignes 1092, 1126  
**Description :**  
Aucun `AbortController` ni timeout n'est configuré sur les `fetch()`. L'utilisateur peut attendre indéfiniment si l'API ne répond pas.

**Recommandation :**
```javascript
async function callClaudeAPI(apiKey, userPrompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000); // 30s
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      signal: controller.signal,
      ...
    });
    clearTimeout(timer);
    ...
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Délai d\'attente dépassé (30 s).');
    throw err;
  }
}
```

---

### 5.4 Microphone non libéré à la fermeture de l'onglet [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) lignes 482–494 (`stopMic`)  
**Description :**  
La fonction `stopMic()` est appelée explicitement par l'utilisateur, mais aucun handler `beforeunload` ne garantit l'arrêt de l'enregistrement si l'onglet est fermé pendant une dictée.  
**Recommandation :**
```javascript
window.addEventListener('beforeunload', stopMic);
```

---

## 6. Points Positifs (Bonnes Pratiques Confirmées)

| Pratique | Statut | Vérification |
|----------|--------|-------------|
| Clé API jamais persistée (localStorage/sessionStorage) | ✅ Confirmé | Aucune occurrence `localStorage.setItem` avec la clé |
| Données en mémoire uniquement, clears à la fermeture | ✅ Confirmé | Variables globales JS, aucune persistance |
| HTTPS utilisé pour toutes les communications Anthropic | ✅ Confirmé | URL `https://api.anthropic.com` en dur |
| Fonction `esc()` pour l'échappement HTML dans l'UI | ✅ Présente et utilisée | L. 1171–1173 ; utilisée dans `renderQuestionnaire`, `renderAgents`, `errorPage` |
| Avertissements RGPD/CGU dans le footer | ✅ Présent | [index.html](../index.html) l. 373–384 |
| Pas de backend = pas de vulnérabilités serveur | ✅ Architecture confirmée | SPA pure |
| Encodage JSON correct pour les payloads API | ✅ Confirmé | `JSON.stringify()` utilisé systématiquement |
| Avertissement ambre clé API dans la config | ✅ Ajouté v8.2.1 | [index.html](../index.html) l. 60–63 |
| Détection HTTP + bandeau rouge | ✅ Ajouté v8.2.1 | [js/app.js](../js/app.js) l. 173–180 |
| Erreurs dans `errorPage` correctement échappées | ✅ Confirmé | `esc(msg)` l. 1224 |

---

## 7. Dépendances Externes

| Bibliothèque | Version | Source | Contrôle d'intégrité |
|-------------|---------|--------|----------------------|
| PDF.js | 3.11.174 | cdnjs.cloudflare.com | **Absent** (pas de SRI hash) |

**Risque :** Si le CDN est compromis ou si une attaque de type supply-chain cible cette version, un script malveillant serait chargé et exécuté dans l'application sans aucun contrôle.

**Recommandation — Option A (SRI hash) :**
```javascript
// Remplacer le chargement dynamique de PDF.js par une balise script avec integrity
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
  integrity="sha384-[HASH_À_GÉNÉRER]"
  crossorigin="anonymous">
</script>
```

**Recommandation — Option B (hébergement local, plus sûr) :**  
Copier `pdf.min.js` dans `assets/lib/` et le référencer localement.

---

## 8. Analyse OWASP Top 10 (2021)

| Catégorie OWASP | Statut | Notes |
|-----------------|--------|-------|
| A01 — Broken Access Control | N/A | Pas d'authentification (conception intentionnelle) |
| A02 — Cryptographic Failures | ⚠ Risque | Clé API exposée côté navigateur ; HTTPS garanti pour les appels Anthropic ; détection HTTP ajoutée v8.2.1 |
| A03 — Injection | ⚠ Risque moyen | Injection HTML dans iframes via `doc.write()` non sanitisé ; `innerHTML` dans `setGenStatus` |
| A04 — Insecure Design | ⚠ Risque | Architecture client-side secrets — acceptable pour usage interne averti |
| A05 — Security Misconfiguration | ⚠ Risque élevé | CSP absente ; sandbox iframe insuffisant (`allow-same-origin`) |
| A06 — Vulnerable Components | ⚠ Risque | PDF.js sans SRI ; version 3.11.174 datée (2023) |
| A07 — Identification Failures | N/A | Pas d'auth par conception |
| A08 — Data Integrity Failures | ⚠ Risque moyen | Pas de vérification d'intégrité sur les scripts CDN |
| A09 — Logging & Monitoring | ℹ Faible | Uniquement `console.error` ; pas de monitoring applicatif |
| A10 — SSRF | N/A | Pas de backend |

---

## 9. Flux de Données et Données Sensibles

| Donnée | Stockage | Transmission | Rétention | Évaluation |
|--------|----------|-------------|-----------|-----------|
| Clé API Anthropic | Variable JS en mémoire | HTTPS → api.anthropic.com | Durée de la session | Risque acceptable si HTTPS garanti et réseau sécurisé |
| Réponses questionnaire | Variables JS en mémoire | HTTPS → Anthropic (via prompts Claude) | Durée de la session | OK — footer informe l'utilisateur |
| Fichiers audio/PDF uploadés | Mémoire (base64) | HTTPS → Anthropic | Durée de la session | Avertir : données envoyées à un tiers américain |
| Livrables générés | Variables JS en mémoire | Téléchargement local uniquement | Contrôle utilisateur | OK |
| Contexte métier additionnel | Variable JS en mémoire | HTTPS → Anthropic (prompt système) | Durée de la session | Sensible si données stratégiques — avertir |
| Design.md importé | Variable JS en mémoire | HTTPS → Anthropic (prompt système) | Durée de la session | Généralement non sensible |

> **RGPD :** Tout contenu envoyé à l'API Anthropic est soumis aux [conditions d'utilisation Anthropic](https://www.anthropic.com/legal/consumer-usage-policy) et traité aux États-Unis. Les données potentiellement personnelles ou sensibles (noms de projets, participants, contexte métier SNCF) doivent faire l'objet d'un avertissement explicite avant utilisation. Le footer actuel est une bonne base mais pourrait être renforcé par un modal de consentement au premier lancement.

---

## 10. Plan de Remédiation Prioritaire

### Semaine 1 — Actions immédiates (coût faible, impact élevé)

| Priorité | Action | Fichier | Effort |
|----------|--------|---------|--------|
| 🔴 P1 | **Restreindre le sandbox des iframes** : `sandbox="allow-same-origin"` → `sandbox=""` | [index.html](../index.html) l. 353, 356, 359 | 5 min |
| 🔴 P1 | **Corriger `setGenStatus`** : `innerHTML` → `textContent` | [js/app.js](../js/app.js) l. 990 | 2 min |
| 🔴 P1 | **Ajouter la CSP** : meta tag dans `<head>` de [index.html](../index.html) | [index.html](../index.html) | 15 min |
| 🟠 P2 | **Sanitiser les messages d'erreur API** : mapper codes HTTP → messages génériques | [js/app.js](../js/app.js) l. 1114, 1157 | 20 min |
| 🟠 P2 | **Ajouter timeout API** : `AbortController` 30s sur `callClaudeAPI` et `callClaudeAPIWithAudio` | [js/app.js](../js/app.js) l. 1092, 1126 | 30 min |
| ✅ Fait | Avertissement ambre clé API dans config | [index.html](../index.html) l. 60–63 | — |
| ✅ Fait | Détection HTTP + bandeau rouge | [js/app.js](../js/app.js) l. 173–180 | — |

### Semaines 2–3 — Court terme

| Action | Fichier | Effort |
|--------|---------|--------|
| **SRI sur PDF.js** : ajouter attribut `integrity` ou héberger localement dans `assets/lib/` | [js/app.js](../js/app.js) | 1h |
| **Remplacer les 8 `alert()`** par `showToast()` | [js/app.js](../js/app.js) l. 434, 527, 687, 736, 763, 909, 924, 1245 | 1h |
| **Ajouter `beforeunload` pour le microphone** | [js/app.js](../js/app.js) | 5 min |
| **Supprimer `console.error` en production** | [js/app.js](../js/app.js) l. 189 | 5 min |
| **Avertissement toggle clé** : toast lors de l'affichage de la clé en clair | [js/app.js](../js/app.js) | 10 min |

### Mois 1 — Moyen terme

| Action | Effort |
|--------|--------|
| **Migrer les 42 handlers inline** vers `addEventListener()` pour compatibilité CSP stricte | 4–6h |
| **Intégrer DOMPurify** pour la sanitisation HTML des livrables dans les iframes | 2h |
| **Proxy backend** : si déploiement multi-utilisateurs ou public, protéger la clé API côté serveur | Sprint dédié |
| **Headers serveur** : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `HSTS` | Config serveur |

---

## 11. Recommandations de Déploiement

| Contexte | Recommandation |
|----------|---------------|
| Usage interne SNCF sur réseau sécurisé, utilisateurs avertis | **Acceptable** avec les actions Semaine 1 appliquées |
| Déploiement intranet SNCF sans réseau sécurisé garanti | Acceptable après Semaines 2–3 + proxy recommandé |
| Déploiement public ou multi-utilisateurs non contrôlés | **Nécessite un proxy backend** avant mise en production |
| Traitement de données confidentielles ou classifiées | **Déconseillé** dans l'état actuel — données envoyées à Anthropic (USA) |

---

## 12. Historique des Remédiations

| Version | Date | Modifications sécurité |
|---------|------|----------------------|
| v8.2.1 | 2026-04-12 | ✅ Avertissement ambre clé API dans config ([index.html](../index.html) l. 60–63) ; ✅ Détection HTTP + bandeau rouge au chargement ([js/app.js](../js/app.js) l. 173–180) ; ✅ README mis à jour |
| v8.2.0 | 2026-04-12 | Aucune modification sécurité — refonte UX Livrables uniquement |
| v8.1.0 | 2026-04-11 | Aucune modification sécurité — refonte UX Recueil + Config inline |
| v8.0.0 | 2026-04-05 | Aucune modification sécurité — refonte design system FAN |

---

## 13. Synthèse Exécutive pour Décideurs

**Ce qui est bien :** L'application ne stocke rien de sensible sur le poste (ni clé API, ni données projet). Tout est en mémoire et s'efface à la fermeture de l'onglet. Les communications avec Anthropic sont en HTTPS. Le footer informe correctement les utilisateurs sur la nature de l'outil et des données transmises.

**Ce qui doit être corrigé en priorité (< 1h de travail) :**
1. Restreindre le sandbox des iframes (3 lignes à changer)
2. Corriger l'injection HTML dans les statuts d'erreur (1 mot-clé à changer : `innerHTML` → `textContent`)
3. Ajouter la Content Security Policy (1 meta tag)

**Ce qui est acceptable pour un usage interne SNCF :** Le modèle BYOK (Bring Your Own Key) où chaque utilisateur fournit sa propre clé API est un risque connu et documenté, acceptable si les utilisateurs sont informés (ce qui est désormais le cas avec les bandeaux v8.2.1) et si l'application est servie en HTTPS sur réseau interne sécurisé.

**Ce qui nécessite une décision d'architecture :** Si l'outil est étendu à des utilisateurs non-techniques ou déployé publiquement, un proxy backend est indispensable pour ne plus exposer les clés API dans le navigateur.

---

*Audit réalisé par analyse statique complète du code source ([index.html](../index.html), [js/app.js](../js/app.js)). Aucun test dynamique (pentest) n'a été effectué. Dernière révision : v8.2.1 — 2026-04-12.*
