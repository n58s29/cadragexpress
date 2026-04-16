# Audit Cybersécurité — CLARITY

**Date d'audit :** 2026-04-16
**Version auditée :** v8.5.0
**Périmètre :** Application SPA front-end (`index.html`, `js/app.js`, `css/style.css`)
**Méthode :** Analyse statique complète du code source + revue des correctifs depuis v8.2.5
**Référentiels :** OWASP Top 10 (2021), ASVS 4.0 (niveau L1), recommandations ANSSI pour les applications web
**Niveau de risque global : MOYEN** *(stable par rapport à v8.2.5 — une régression introduite en v8.4.1)*

---

## Résumé Exécutif

CLARITY est une SPA (Single Page Application) 100 % client sans serveur propre, communiquant directement du navigateur vers l'API Anthropic. L'architecture est volontairement légère, ce qui élimine les vulnérabilités serveur classiques mais crée des risques spécifiques côté client.

**Évolutions depuis le dernier audit (v8.2.5 → v8.5.0) :**
- ✅ Timeout adaptatif implémenté (v8.4.2) — résout la vulnérabilité §5.3
- ✅ Journal API ajouté (v8.4.0) — améliore la traçabilité des erreurs
- ✅ Streaming SSE (v8.3.1) — impact sécurité neutre
- ⚠ **RÉGRESSION** : Sandbox iframes repassé à `allow-same-origin` (v8.4.1) — recréé la vulnérabilité §3.3 corrigée en v8.2.5

### Score global : 6,5 / 10

| Catégorie | Score | Delta v8.2.5 |
|-----------|-------|-------------|
| Gestion des secrets | 4/10 | = |
| XSS / Injection | 6/10 | ▼ -1 (régression sandbox) |
| Headers de sécurité | 7/10 | = |
| Dépendances tierces | 4/10 | = |
| Données sensibles | 8/10 | = |
| Résilience / timeout | 8/10 | ▲ +3 (timeout adaptatif) |

---

## 1. Inventaire des Vulnérabilités

| Sévérité | Nb | Statut |
|----------|-----|--------|
| 🔴 CRITIQUE | 1 | Exposition clé API navigateur |
| 🟠 ÉLEVÉE | 4 | Sandbox régression, CSP `unsafe-inline`, DOMPurify absent, handlers inline |
| 🟡 MOYENNE | 5 | Visibilité clé, verbose erreurs API, validation entrées, localStorage, microphone |
| 🟢 FAIBLE | 3 | Console.error, SRI absent PDF.js, print popup `document.write` |
| ℹ INFO | 2 | Architecture BYOK, absence monitoring |

---

## 2. Vulnérabilités Critiques

### 2.1 Clé API Anthropic exposée dans le navigateur [CRITIQUE]

**Fichier :** [js/app.js](../js/app.js) — `callClaudeAPI()` (ligne ~1582)
**CVSS 3.1 indicatif :** 7.4 — Élevé
**Statut :** Inchangé depuis v8.2.1 (partiellement mitigé par avertissements UI)

**Description :**
La clé API Anthropic est envoyée dans un header HTTP depuis le navigateur. Elle est visible en clair dans l'onglet Réseau des DevTools, dans toute extension navigateur ayant accès aux requêtes, et dans tout proxy réseau intermédiaire.

```javascript
// js/app.js — callClaudeAPI()
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey,                                // Clé en clair dans les headers
    'anthropic-dangerous-direct-browser-access': 'true' // Flag d'usage dangereux explicite
  }
});
```

**Vecteurs d'attaque :**
1. DevTools ouverts → onglet Réseau → header `x-api-key` lisible en clair
2. Extension navigateur malveillante ou compromise → accès aux headers sortants
3. Injection XSS → lecture de `document.getElementById('cfgKey').value`
4. Partage d'écran pendant une démo avec DevTools ouverts
5. Proxy réseau d'entreprise loggant les headers (non-HTTPS uniquement)

**Mitigations en place (v8.2.1) :**
- ✅ Bandeau ambre dans la config : avertissement sur la visibilité DevTools
- ✅ Détection HTTP : bandeau rouge si l'app est servie sans TLS hors localhost
- ✅ README documentant la politique BYOK

**Recommandations :**

| Contexte | Recommandation |
|----------|---------------|
| Usage interne SNCF, réseau sécurisé | Acceptable avec les avertissements actuels |
| Déploiement intranet étendu | Proxy backend léger (Node/Python) — clé côté serveur |
| Déploiement public / multi-utilisateurs | **Proxy backend obligatoire avant mise en production** |

---

## 3. Vulnérabilités Élevées

### 3.1 RÉGRESSION — Sandbox iframes repassé à `allow-same-origin` [ÉLEVÉE]

**Fichier :** [index.html](../index.html) lignes 411, 414, 417
**CVSS 3.1 indicatif :** 5.9 — Moyen
**Statut :** ⚠ Régression introduite en v8.4.1 (était corrigé `sandbox=""` en v8.2.5)

**Description :**
En v8.4.1, le correctif `sandbox=""` a été annulé car il rendait `contentDocument.write()` inaccessible depuis le parent (origine opaque). L'attribut est revenu à `sandbox="allow-same-origin"`.

```html
<!-- État actuel v8.5.0 — index.html lignes 411, 414, 417 -->
<iframe id="synthFrame"   sandbox="allow-same-origin" ...></iframe>
<iframe id="mockFrame"    sandbox="allow-same-origin" ...></iframe>
<iframe id="cadrageFrame" sandbox="allow-same-origin" ...></iframe>
```

Avec `allow-same-origin`, si l'iframe contient du JavaScript injecté (via un HTML malveillant retourné par Claude ou une prompt injection), ce script peut :
- Accéder à `window.parent.document`
- Lire la valeur du champ `cfgKey` (clé API)
- Exfiltrer le contexte métier saisi dans le questionnaire
- Modifier l'interface parent

**Recommandation — Solution propre (sans régression) :**
Conserver `sandbox="allow-same-origin"` pour l'accès DOM mais intégrer DOMPurify **avant** l'écriture dans l'iframe, ce qui neutralise tout script injecté :

```javascript
// js/app.js — writeToFrame() — à modifier
function writeToFrame(frameId, html) {
  const iframe = document.getElementById(frameId);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  // Charger DOMPurify depuis assets/lib/ (hébergement local recommandé)
  const clean = DOMPurify.sanitize(html, {
    FORCE_BODY: true,
    ADD_TAGS: ['style'],
    ADD_ATTR: ['onclick', 'onchange'] // Autoriser les handlers des maquettes interactives
  });
  doc.open();
  doc.write(clean);
  doc.close();
}
```

---

### 3.2 CSP avec `unsafe-inline` — Scripts inline non contrôlés [ÉLEVÉE]

**Fichier :** [index.html](../index.html) ligne 7
**Statut :** Inchangé depuis v8.2.5

**Description :**
La CSP autorise `'unsafe-inline'` pour les scripts (`script-src 'self' 'unsafe-inline' ...`), ce qui rend la politique inefficace contre les injections XSS : tout script inline (y compris injecté) est exécuté.

```html
<!-- index.html ligne 7 -->
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com ...
```

**Cause :** 42 handlers d'événements inline dans le HTML (`onclick`, `oninput`, `onchange`).

**Recommandation — Migration vers `addEventListener()` :**
```javascript
// Avant (HTML)
// <button onclick="openConfig()">Config</button>

// Après (js/app.js — DOMContentLoaded)
document.getElementById('btnConfig')
  .addEventListener('click', openConfig);
```
Une fois les 42 handlers migrés, supprimer `'unsafe-inline'` de la CSP.

---

### 3.3 Absence de sanitisation HTML des livrables (DOMPurify) [ÉLEVÉE]

**Fichier :** [js/app.js](../js/app.js) — `writeToFrame()`
**Statut :** Inchangé depuis le premier audit

**Description :**
Le HTML généré par l'API Claude est écrit directement dans les iframes via `document.write()` sans aucune validation ou sanitisation. Un contenu Claude malformé ou issu d'une prompt injection pourrait contenir du JavaScript exécutable.

```javascript
function writeToFrame(frameId, html) {
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);  // ← HTML brut, non sanitisé
  doc.close();
}
```

**Probabilité :** Faible dans un usage normal (Claude génère du HTML légitime). Mais le risque augmente avec l'usage de données UX-Pilot importées depuis un fichier JSON externe non contrôlé, dont le contenu peut influencer les prompts.

**Recommandation :** Intégrer DOMPurify (voir §3.1).

---

### 3.4 Handlers d'événements inline — 42 occurrences [ÉLEVÉE]

**Fichier :** [index.html](../index.html)
**Statut :** Inchangé

**Description :**
L'application utilise massivement `onclick`, `oninput`, `onchange` dans le HTML, incompatibles avec une CSP stricte. Ces attributs inline étendent la surface d'attaque XSS.

**Exemples représentatifs :**
```html
<button onclick="openConfig()">
<input oninput="updateCfg()">
<input onchange="handleDesignFileSelect(this)">
```

**Plan de migration recommandé :**
1. Ajouter `id` à tous les éléments sans identifiant
2. Regrouper les `addEventListener` dans un bloc `DOMContentLoaded` en début de `app.js`
3. Supprimer `'unsafe-inline'` de la CSP une fois terminé

---

## 4. Vulnérabilités Moyennes

### 4.1 Affichage de la clé API en clair — sans avertissement [MOYENNE]

**Fichier :** [index.html](../index.html) + [js/app.js](../js/app.js) — `toggleKey()`
**Description :**
Le bouton "👁" affiche la clé en clair sans notification. Risque lors des partages d'écran ou démos.

**Recommandation :**
```javascript
function toggleKey() {
  const inp = document.getElementById('cfgKey');
  if (inp.type === 'password') {
    inp.type = 'text';
    showToast('⚠ Clé visible — masquez avant de partager votre écran', 'warn', 4000);
  } else {
    inp.type = 'password';
  }
}
```

---

### 4.2 Messages d'erreur API verbeux [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) — `callClaudeAPI()`
**Description :**
Les erreurs HTTP retournent jusqu'à 200 caractères du corps brut de la réponse Anthropic, potentiellement informatif pour un attaquant analysant les réponses d'erreur.

```javascript
throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
```

**Recommandation :**
```javascript
const HTTP_MESSAGES = {
  401: 'Clé API invalide ou expirée.',
  403: 'Accès refusé. Vérifiez les permissions de votre clé.',
  429: 'Quota API atteint. Patientez avant de réessayer.',
  500: 'Erreur interne Anthropic. Réessayez.',
  529: 'API Anthropic surchargée. Réessayez dans quelques instants.'
};
const userMsg = HTTP_MESSAGES[response.status]
  || `Erreur API (HTTP ${response.status}).`;
throw new Error(userMsg);
```

---

### 4.3 Validation des entrées utilisateur absente [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) — `runAnalysis()`, `buildCheckPrompt()`
**Description :**
Les entrées texte (questionnaire, texte collé, contexte métier, design.md) ne sont pas bornées avant envoi à l'API. Une saisie de plusieurs mégaoctets génèrerait des requêtes hors budget ou des erreurs non contrôlées.

**Recommandation :**
```javascript
const MAX_PROMPT_CHARS = 80000; // ~20k tokens

function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  return text.substring(0, MAX_PROMPT_CHARS).trim();
}
```

---

### 4.4 `localStorage` — Persistance d'un flag de préférence [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) lignes 221, 230
**Description :**
La valeur `ce_welcome_dismissed` est persistée dans le `localStorage`. Ce n'est pas un risque direct, mais :
- Le flag survivra à une rotation de clé API ou à une mise à jour des CGU
- Il constitue un indicateur d'usage de l'application sur le poste (traceable)
- Avec la clé `ce_*`, il expose l'identité de l'application

**Recommandation :**
- Clé renommée en `clarity_welcome_v1` (cohérence avec le nouveau nom)
- Ou remplacement par `sessionStorage` si la préférence ne doit pas persister entre sessions

---

### 4.5 Microphone non libéré à la fermeture de l'onglet [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) — `stopMic()`
**Description :**
Si l'utilisateur ferme l'onglet pendant une dictée active, le microphone reste alloué (indicateur actif dans le navigateur, potentielle fuite de ressource).

**Recommandation :**
```javascript
window.addEventListener('beforeunload', () => {
  if (isRecording) stopMic();
});
```

---

## 5. Vulnérabilités Faibles

### 5.1 `console.error` en production [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) ligne 190
**Description :**
```javascript
console.error('Impossible de charger cadrage-questions.json :', e);
```
Ce message révèle la structure du serveur et le chemin du fichier de données dans les DevTools.

**Recommandation :** Conditionner à un flag `DEBUG` ou supprimer.

---

### 5.2 PDF.js sans SRI (Subresource Integrity) [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) — chargement dynamique de PDF.js (cdnjs)
**Description :**
PDF.js est chargé depuis un CDN sans attribut `integrity`. En cas de compromission du CDN ou de modification de la bibliothèque, un script malveillant serait exécuté sans détection.

**Recommandation — Option A :**
```html
<script
  src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
  integrity="sha384-[GÉNÉRER_VIA_openssl_dgst_-sha384_-binary_|_base64]"
  crossorigin="anonymous">
</script>
```
**Option B (préférée) :** Héberger `pdf.min.js` dans `assets/lib/`.

---

### 5.3 Print popup — `document.write()` dans une nouvelle fenêtre [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) ligne ~1806
**Description :**
La fonction d'impression ouvre une popup et y écrit du HTML via `document.write()` sans sanitisation. Risque identique à §3.3 mais dans un contexte popup distinct.

**Recommandation :** Appliquer DOMPurify avant l'écriture.

---

## 6. Nouvelles Surfaces d'Attaque depuis v8.2.5

### 6.1 Import JSON UX-Pilot (v8.3.0)

**Fichier :** [js/app.js](../js/app.js) — `handleUxPilotFile()`, `buildUxPilotContext()`
**Description :**
L'application accepte désormais des fichiers JSON externes (exports UX-Pilot). Le parsing est effectué via `JSON.parse()` natif, ce qui est sûr contre l'injection JSON. Cependant :
- Le contenu des champs texte (personas, user stories, pain points) est injecté dans les prompts Claude sans bornage de longueur
- Un fichier JSON malveillant très volumineux pourrait générer des prompts surdimensionnés

**Recommandation :**
```javascript
// Limiter la taille du fichier JSON importé
const MAX_JSON_SIZE = 500 * 1024; // 500 KB
if (file.size > MAX_JSON_SIZE) {
  showToast('⚠ Fichier UX-Pilot trop volumineux (max 500 KB)');
  return;
}
```

### 6.2 Streaming SSE et journal API (v8.3.1 / v8.4.0)

**Fichier :** [js/app.js](../js/app.js) — `callClaudeAPI()`, `addLog()`
**Description :**
Le streaming SSE lit les chunks réseau et les affiche en temps réel. La fonction `addLog()` construit des entrées de log avec innerHTML :

```javascript
// js/app.js — addLog()
const el = document.getElementById('logContainer');
el.innerHTML = ''; // ← Reset par innerHTML (inoffensif)
```

Les messages de log eux-mêmes doivent être vérifiés pour s'assurer qu'ils utilisent `textContent` et non `innerHTML` pour les contenus variables.

**Statut :** À vérifier lors de la prochaine revue de `addLog()`.

---

## 7. Analyse OWASP Top 10 (2021)

| Catégorie OWASP | Statut v8.5.0 | Détail |
|-----------------|--------------|--------|
| A01 — Broken Access Control | N/A | Pas d'authentification — conception intentionnelle (BYOK) |
| A02 — Cryptographic Failures | ⚠ Risque | Clé API exposée navigateur ; HTTPS garanti pour Anthropic ; détection HTTP active |
| A03 — Injection | ⚠ Risque moyen | `sandbox="allow-same-origin"` (régression) + pas de DOMPurify — mitigation partielle par la CSP |
| A04 — Insecure Design | ⚠ Risque documenté | Architecture client-side secrets — acceptable usage interne averti |
| A05 — Security Misconfiguration | ⚠ Partiel | CSP présente mais affaiblie par `unsafe-inline` ; sandbox iframes régressé |
| A06 — Vulnerable Components | ⚠ Risque | PDF.js v3.11.174 (2023) sans SRI ; version potentiellement non maintenue |
| A07 — Identification Failures | N/A | Pas d'auth par conception |
| A08 — Data Integrity Failures | ⚠ Risque | Pas de SRI sur CDN ; JSON UX-Pilot non borné |
| A09 — Logging & Monitoring | ℹ Amélioré | Journal API en temps réel (v8.4.0) ; pas de monitoring centralisé |
| A10 — SSRF | N/A | Pas de backend |

---

## 8. Flux de Données — Cartographie Sécurité

| Donnée | Stockage | Transmission | Rétention | Risque |
|--------|----------|-------------|-----------|--------|
| Clé API Anthropic | Mémoire JS (variable) | HTTPS → `api.anthropic.com` | Session uniquement | ⚠ Visible DevTools |
| Réponses questionnaire | Mémoire JS | HTTPS → Anthropic (prompt) | Session uniquement | OK si données anonymisées |
| Fichiers audio (base64) | Mémoire JS | HTTPS → Anthropic | Session uniquement | Sensible si voix identifiable |
| Fichiers PDF/texte | Mémoire JS | HTTPS → Anthropic | Session uniquement | Sensible si contenu confidentiel |
| JSON UX-Pilot | Mémoire JS | HTTPS → Anthropic (prompt) | Session uniquement | Nouveau — non borné |
| Contexte métier (`cfgContext`) | Mémoire JS | HTTPS → Anthropic (system prompt) | Session uniquement | Sensible si stratégique |
| Design.md | Mémoire JS | HTTPS → Anthropic (system prompt) | Session uniquement | Généralement non sensible |
| Livrables générés | Mémoire JS | Téléchargement local uniquement | Contrôle utilisateur | OK |
| Flag `ce_welcome_dismissed` | `localStorage` | Aucune | Jusqu'à clear navigateur | Faible |

---

## 9. Points Positifs (Bonnes Pratiques Confirmées)

| Pratique | Vérification v8.5.0 |
|----------|---------------------|
| Clé API jamais persistée (localStorage/sessionStorage) | ✅ Confirmé |
| HTTPS garanti pour tous les appels Anthropic | ✅ `https://api.anthropic.com` en dur |
| `esc()` — échappement HTML utilisé dans l'UI | ✅ Présent et utilisé |
| CSP meta tag active | ✅ `connect-src`, `frame-ancestors 'none'`, `object-src 'none'` |
| `setGenStatus` → `textContent` par défaut | ✅ Confirmé |
| Détection HTTP + bandeau rouge | ✅ Actif |
| Avertissements utilisateur dans la config et le modal d'accueil | ✅ Présents |
| Timeout adaptatif (60s inactivité, plafond 10 min) | ✅ Ajouté v8.4.2 |
| `JSON.parse()` natif pour UX-Pilot (sûr contre injection JSON) | ✅ Confirmé |
| Encodage `JSON.stringify()` pour les payloads API | ✅ Confirmé |

---

## 10. Plan de Remédiation

### Priorité 1 — Actions immédiates (< 2h)

| Action | Fichier | Effort |
|--------|---------|--------|
| Intégrer DOMPurify (local ou CDN avec SRI) et sanitiser avant `writeToFrame()` | [js/app.js](../js/app.js) | 1h |
| Toast "⚠ masquez votre écran" lors de l'affichage de la clé API | [js/app.js](../js/app.js) | 15 min |
| Mapper les codes HTTP vers messages d'erreur génériques | [js/app.js](../js/app.js) | 20 min |
| `beforeunload` pour libérer le microphone | [js/app.js](../js/app.js) | 5 min |
| Renommer `ce_welcome_dismissed` → `clarity_welcome_v1` | [js/app.js](../js/app.js) | 5 min |

### Priorité 2 — Court terme (< 1 semaine)

| Action | Fichier | Effort |
|--------|---------|--------|
| Borner les inputs questionnaire et UX-Pilot avant injection dans les prompts | [js/app.js](../js/app.js) | 30 min |
| SRI sur PDF.js ou hébergement local dans `assets/lib/` | [js/app.js](../js/app.js) / [index.html](../index.html) | 30 min |
| Limiter la taille des fichiers JSON UX-Pilot importés | [js/app.js](../js/app.js) | 15 min |
| Supprimer `console.error` en production | [js/app.js](../js/app.js) | 5 min |

### Priorité 3 — Moyen terme (1 mois)

| Action | Effort |
|--------|--------|
| Migrer les 42 handlers inline → `addEventListener()` + supprimer `unsafe-inline` de la CSP | 6–8h |
| Proxy backend (si déploiement multi-utilisateurs ou public) | Sprint dédié |
| Headers serveur : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` | Config serveur |
| Audit dynamique (test d'injection, interception MITM simulée) | 1 jour |

---

## 11. Recommandations de Déploiement

| Contexte | Verdict | Conditions |
|----------|---------|-----------|
| Usage personnel — poste SNCF, réseau sécurisé | ✅ Acceptable | Avertissements actuels suffisants |
| Équipe restreinte — intranet SNCF | ✅ Acceptable | Appliquer Priorité 1 avant diffusion |
| Déploiement intranet élargi (> 50 utilisateurs) | ⚠ Sous conditions | Priorité 1 + 2 + proxy backend recommandé |
| Déploiement public ou hors réseau SNCF | ❌ Déconseillé | Proxy backend obligatoire |
| Données classifiées / sensibles DR | ❌ Interdit | Données envoyées à Anthropic (USA) |

---

## 12. Historique des Remédiations

| Version | Date | Modifications sécurité |
|---------|------|----------------------|
| v8.5.0 | 2026-04-16 | Renommage CLARITY — aucun impact sécurité |
| v8.4.2 | 2026-04-16 | ✅ Timeout adaptatif (60s inactivité + 10 min plafond) |
| v8.4.1 | 2026-04-16 | ⚠ Régression sandbox : `""` → `allow-same-origin` (nécessaire pour `contentDocument.write()`) |
| v8.4.0 | 2026-04-16 | Journal API — logs `innerHTML` à surveiller |
| v8.3.1 | — | Streaming SSE — impact sécurité neutre |
| v8.3.0 | — | Import JSON UX-Pilot — nouvelle surface (fichiers externes) |
| v8.2.5 | 2026-04-15 | ✅ CSP meta tag ; ✅ Sandbox `allow-same-origin` → `""` (annulé v8.4.1) ; ✅ `textContent` dans setGenStatus ; ✅ `alert()` → `showToast()` |
| v8.2.1 | 2026-04-12 | ✅ Bandeau ambre clé API ; ✅ Détection HTTP |

---

*Audit réalisé par analyse statique complète du code source. Aucun test dynamique (pentest, fuzzing, interception réseau) n'a été effectué. Pour un déploiement élargi, un test dynamique est recommandé.*

*CLARITY v8.5.0 — Fabrique de l'Adoption Numérique — e.SNCF Solutions*
