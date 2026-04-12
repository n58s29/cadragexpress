# Audit de Sécurité — Cadrage Express

**Date :** 2026-04-12  
**Version auditée :** v8.2  
**Périmètre :** Application SPA front-end uniquement (aucun backend)  
**Niveau de risque global : MOYEN-ÉLEVÉ**

---

## Résumé Exécutif

Cadrage Express est une application web 100% client (Single Page Application) sans serveur propre. Elle communique directement du navigateur vers l'API Anthropic. L'application présente de **bonnes pratiques de base** mais comporte des **lacunes significatives** dans la configuration de sécurité, notamment l'exposition de la clé API depuis le navigateur et l'absence de headers de sécurité.

### Score global : 5,5 / 10

| Catégorie | Évaluation |
|-----------|-----------|
| Gestion des secrets | Insuffisant (clé API exposée côté client) |
| XSS / Injection | Risque modéré (iframes non restreintes) |
| Headers de sécurité | Absent (CSP, X-Frame-Options, HSTS) |
| Dépendances tierces | Risque (PDF.js sans contrôle d'intégrité) |
| Données sensibles | Acceptable (tout en mémoire, jamais persisté) |
| Architecture | Risqué pour un déploiement public |

---

## 1. Inventaire des Vulnérabilités

### Répartition par sévérité

| Sévérité | Nombre | Catégories |
|----------|--------|-----------|
| **CRITIQUE** | 1 | Exposition clé API depuis le navigateur |
| **ÉLEVÉE** | 4 | Injection HTML dans iframes, CSP absente, sandbox iframe insuffisant, handlers inline |
| **MOYENNE** | 5 | Visibilité mot de passe, HTTPS non vérifié, X-Frame-Options absent, fuites d'erreurs, validation des entrées |
| **FAIBLE** | 4 | Logs console, alert() navigateur, absence de timeout API, micro non libéré |
| **INFO** | 4 | Flux de données, versions dépendances, CORS, architecture |

---

## 2. Vulnérabilités Critiques

### 2.1 Clé API Anthropic exposée dans le navigateur [CRITIQUE]

**Fichiers :** [js/app.js](../js/app.js) lignes 1084–1099, 1118–1142  
**Catégorie :** Exposition de credentials

**Description :**  
La clé API Anthropic est envoyée directement depuis le navigateur vers `api.anthropic.com` dans un header HTTP. Bien qu'Anthropic autorise explicitement cet usage via le header `anthropic-dangerous-direct-browser-access: true`, cela expose la clé à plusieurs vecteurs d'attaque.

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,  // Clé visible dans les DevTools Network
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  ...
});
```

**Vecteurs d'attaque :**
- Clé visible dans l'onglet Réseau des DevTools du navigateur
- Interception possible sur réseau non sécurisé (Wi-Fi public, proxy)
- Toute injection XSS peut accéder à la clé en mémoire
- Extension de navigateur malveillante peut lire les headers des requêtes

**Recommandations :**
1. **(Idéal)** Implémenter un proxy backend : `Navigateur → Proxy authentifié → API Anthropic`. La clé n'est jamais côté client.
2. **(Minimum)** Ajouter un avertissement visible lors de la configuration de la clé API.
3. Documenter clairement les risques dans le README pour les déployeurs.

---

## 3. Vulnérabilités Élevées

### 3.1 Injection HTML non sanitisée dans les iframes [ÉLEVÉE]

**Fichier :** [js/app.js](../js/app.js) lignes 1182–1188  
**Catégorie :** XSS / Injection de code

**Description :**  
Le HTML généré par l'API Claude est écrit directement dans des iframes via `document.write()` sans sanitisation :

```javascript
function writeToFrame(frameId, html) {
  const iframe = document.getElementById(frameId);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);  // HTML brut non sanitisé depuis l'API
  doc.close();
}
```

L'iframe utilise `sandbox="allow-same-origin"`, ce qui permet l'exécution de scripts et l'accès au contexte parent. Si la réponse de Claude contenait du JavaScript malveillant (prompt injection, compromission de l'API), il serait exécuté.

**Recommandations :**
1. Changer l'attribut sandbox : `sandbox=""` (le plus restrictif possible)
2. Ajouter DOMPurify pour sanitiser le HTML avant injection :
   ```javascript
   const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
   doc.write(clean);
   ```
3. Mettre en liste blanche les balises HTML autorisées dans les livrables.

---

### 3.2 Absence de Content Security Policy (CSP) [ÉLEVÉE]

**Fichier :** [index.html](../index.html)  
**Catégorie :** Configuration de sécurité

**Description :**  
Aucune directive CSP n'est définie (ni meta tag, ni header HTTP). Cela autorise l'exécution de tout script inline, le chargement de ressources depuis n'importe quelle origine, et l'exfiltration de données vers des domaines arbitraires.

**Recommandation — Ajouter dans `<head>` de [index.html](../index.html) :**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' https://api.anthropic.com https://cdnjs.cloudflare.com;
  frame-src 'self';
  form-action 'self';
  base-uri 'self';
  frame-ancestors 'none'
">
```

> Note : `'unsafe-inline'` reste nécessaire pour les styles des livrables générés. Les handlers inline (42 occurrences) nécessiteront une migration pour passer à un CSP strict.

---

### 3.3 Sandbox iframe insuffisant [ÉLEVÉE]

**Fichier :** [index.html](../index.html) lignes 350, 353, 356  
**Catégorie :** Isolation de contenu

**Description :**  
Les iframes d'affichage des livrables utilisent `sandbox="allow-same-origin"`. Cette valeur permet à l'iframe d'accéder à `window.parent`, au localStorage, et de contourner les restrictions sandboxées en cas d'injection de script.

**Situation actuelle :**
```html
<iframe id="synthFrame" class="output-frame" sandbox="allow-same-origin"></iframe>
```

**Recommandation :**
```html
<iframe id="synthFrame" class="output-frame" sandbox=""></iframe>
```

Le contenu est uniquement affiché (pas de formulaires, pas de navigation), `sandbox=""` est suffisant et beaucoup plus sûr.

---

### 3.4 Handlers d'événements inline (42 occurrences) [ÉLEVÉE]

**Fichier :** [index.html](../index.html) — 42 occurrences  
**Catégorie :** Architecture sécurité / CSP

**Description :**  
L'application utilise massivement les attributs `onclick`, `oninput`, `onchange` dans le HTML. Ces handlers inline sont incompatibles avec une CSP stricte (`script-src 'self'` sans `'unsafe-inline'`) et augmentent la surface d'attaque XSS.

**Exemples :**
- Ligne 26 : `onclick="openConfig()"`
- Ligne 57 : `oninput="updateCfg()"`
- Ligne 102 : `onchange="handleDesignFileSelect(this)"`

**Recommandation :**  
Migrer vers `addEventListener()` dans [js/app.js](../js/app.js) :
```javascript
// Avant (HTML inline)
// <button onclick="openConfig()">

// Après (JS séparé)
document.getElementById('btnConfig').addEventListener('click', openConfig);
```

---

## 4. Vulnérabilités Moyennes

### 4.1 Visibilité de la clé API (toggle mot de passe) [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) — fonction `toggleKey()`  
**Description :** Le bouton "👁" permet d'afficher la clé en clair, risquant une capture d'écran accidentelle ou lors d'un partage d'écran.  
**Recommandation :** Ajouter un avertissement visuel (`⚠ Masquez la clé avant de partager votre écran`) lors de l'affichage.

---

### 4.2 Absence de vérification HTTPS [MOYENNE]

**Description :** L'application peut être servie en HTTP, exposant la clé API en transit.  
**Recommandation :** Ajouter au démarrage dans [js/app.js](../js/app.js) :
```javascript
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  alert('⚠ Cette application doit être servie en HTTPS. Votre clé API est en risque !');
}
```

---

### 4.3 Absence de protection anti-clickjacking [MOYENNE]

**Description :** Sans header `X-Frame-Options: DENY`, l'application peut être chargée dans une iframe malveillante.  
**Recommandation :** Si déployé avec un serveur, ajouter :
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

---

### 4.4 Messages d'erreur API trop verbeux [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) lignes 1103, 1146  
**Description :** Les erreurs de l'API Anthropic sont partiellement affichées telles quelles à l'utilisateur, pouvant révéler des informations internes.  
**Recommandation :** Mapper les codes HTTP vers des messages génériques :
```javascript
const errMessages = {
  401: 'Clé API invalide ou expirée.',
  429: 'Limite de débit API atteinte. Veuillez patienter.',
  500: 'Erreur interne de l\'API. Réessayez.',
};
```

---

### 4.5 Absence de validation des entrées utilisateur [MOYENNE]

**Fichier :** [js/app.js](../js/app.js) lignes 814–849  
**Description :** Les réponses au questionnaire ne sont pas bornées en longueur avant envoi à l'API, ce qui pourrait engendrer des requêtes démesurées.  
**Recommandation :**
```javascript
function validateAnswer(text) {
  if (typeof text !== 'string') return null;
  return text.substring(0, 5000).trim();
}
```

---

## 5. Vulnérabilités Faibles

### 5.1 Console.error en production [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) ligne 177  
**Description :** `console.error()` peut exposer des chemins de fichiers ou des traces d'appel dans les DevTools.  
**Recommandation :** Supprimer ou conditionner les logs en production.

---

### 5.2 Utilisation de `alert()` navigateur [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) — 8 occurrences (lignes 422, 515, 675, 724, 751, 897, 912, 1233)  
**Description :** Les `alert()` bloquent le thread et peuvent être supprimés par des scripts malveillants.  
**Recommandation :** Remplacer par les notifications toast déjà implémentées dans l'application.

---

### 5.3 Absence de timeout sur les requêtes API [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) lignes 1084, 1118  
**Description :** Aucun timeout n'est configuré sur les `fetch()`. L'utilisateur peut attendre indéfiniment.  
**Recommandation :**
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
const response = await fetch(url, { signal: controller.signal, ... });
clearTimeout(timeout);
```

---

### 5.4 Microphone non libéré à la fermeture [FAIBLE]

**Fichier :** [js/app.js](../js/app.js) lignes 415–482  
**Description :** L'autorisation microphone n'est pas explicitement révoquée à la fermeture de l'onglet.  
**Recommandation :**
```javascript
window.addEventListener('beforeunload', stopMic);
```

---

## 6. Points Positifs (Bonnes Pratiques)

| Pratique | Statut |
|----------|--------|
| Clé API jamais persistée (localStorage/sessionStorage) | Confirmé — aucune occurrence |
| Données en mémoire uniquement, clears à la fermeture | Confirmé par code |
| HTTPS utilisé pour toutes les communications Anthropic | Confirmé |
| Fonction `esc()` pour l'échappement HTML dans l'UI | Présente et utilisée |
| Avertissements RGPD/CGU dans le footer | Présent |
| Pas de backend = pas de vulnérabilités serveur | Architecture confirmée |
| Encodage JSON correct pour les payloads API | `JSON.stringify()` utilisé |

---

## 7. Dépendance Externe Identifiée

| Bibliothèque | Version | Source | Contrôle d'intégrité |
|-------------|---------|--------|----------------------|
| PDF.js | 3.11.174 | cdnjs.cloudflare.com | **Absent** (pas de SRI) |

**Recommandation — Ajouter les attributs SRI :**
```javascript
// Remplacer le chargement dynamique par une balise script avec integrity
<script 
  src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
  integrity="sha384-[HASH]"
  crossorigin="anonymous">
</script>
```

Ou héberger PDF.js localement dans `assets/`.

---

## 8. Analyse OWASP Top 10 (2021)

| Catégorie OWASP | Statut | Notes |
|-----------------|--------|-------|
| A01 — Broken Access Control | N/A | Pas d'authentification (conception) |
| A02 — Cryptographic Failures | Risque | Clé API exposée côté navigateur, HTTPS sinon OK |
| A03 — Injection | Risque moyen | Injection HTML dans iframes non sanitisée |
| A04 — Insecure Design | Risque | Architecture client-side secrets |
| A05 — Security Misconfiguration | Risque élevé | CSP absente, sandbox insuffisant |
| A06 — Vulnerable Components | Risque | PDF.js sans SRI |
| A07 — Identification Failures | N/A | Pas d'auth par conception |
| A08 — Data Integrity Failures | Risque moyen | Pas de vérification intégrité des scripts CDN |
| A09 — Logging & Monitoring | Faible | Uniquement console.error |
| A10 — SSRF | N/A | Pas de backend |

---

## 9. Flux de Données et Données Sensibles

| Donnée | Stockage | Transmission | Rétention | Évaluation |
|--------|----------|-------------|-----------|-----------|
| Clé API Anthropic | Mémoire JS | HTTPS → Anthropic | Session | Risque acceptable si HTTPS garanti |
| Réponses questionnaire | Mémoire JS | HTTPS → Anthropic (via Claude) | Session | OK — informer l'utilisateur |
| Fichiers audio/PDF uploadés | Mémoire (base64) | HTTPS → Anthropic | Session | Avertir : données envoyées à tiers |
| Livrables générés | Mémoire | Téléchargement local | Contrôle utilisateur | OK |

> **RGPD :** Tout contenu envoyé à l'API Anthropic est soumis aux [conditions d'utilisation Anthropic](https://www.anthropic.com/legal/consumer-usage-policy). Les données potentiellement personnelles (noms de projets, participants, contexte métier) doivent faire l'objet d'un avertissement explicite.

---

## 10. Plan de Remédiation Prioritaire

### Semaine 1 — Actions immédiates

- [ ] **Restreindre le sandbox des iframes** : `sandbox="allow-same-origin"` → `sandbox=""`
- [ ] **Ajouter la CSP** : meta tag dans `<head>` de [index.html](../index.html)
- [ ] **Ajouter vérification HTTPS** : alerte au démarrage si HTTP en production
- [ ] **Sanitiser les messages d'erreur API** : mapper les codes vers messages génériques

### Semaines 2–3 — Court terme

- [ ] **SRI sur PDF.js** : ajouter attribut `integrity` ou héberger localement
- [ ] **Migrer les handlers inline** : `onclick` → `addEventListener()` pour compatibilité CSP stricte
- [ ] **Ajouter timeout sur les requêtes API** : `AbortController` 30s
- [ ] **Supprimer les `alert()`** : remplacer par notifications toast

### Mois 1 — Moyen terme

- [ ] **Proxy backend** : si déploiement multi-utilisateurs, ne jamais exposer la clé côté client
- [ ] **Headers serveur** : `X-Frame-Options`, `X-Content-Type-Options`, `HSTS` si déploiement HTTP
- [ ] **DOMPurify** : intégrer la bibliothèque de sanitisation HTML

---

## 11. Recommandation de Déploiement

| Contexte | Recommandation |
|----------|---------------|
| Usage interne SNCF sur réseau sécurisé par des utilisateurs avertis | Acceptable avec mesures immédiates |
| Déploiement public ou multi-utilisateurs | Nécessite un proxy backend avant mise en production |
| Traitement de données confidentielles ou classifiées | Déconseillé dans l'état actuel |

---

*Audit réalisé par analyse statique complète du code source. Aucun test dynamique (pentest) n'a été effectué.*
