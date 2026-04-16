# Audit RGPD — CLARITY

**Date d'audit :** 2026-04-16
**Version auditée :** v8.5.0
**Périmètre :** Application SPA front-end + flux de données vers l'API Anthropic
**Référentiel :** Règlement (UE) 2016/679 (RGPD), recommandations CNIL, lignes directrices EDPB
**Responsable de traitement présumé :** SNCF / e.SNCF Solutions — Fabrique de l'Adoption Numérique
**Sous-traitant identifié :** Anthropic PBC (San Francisco, CA, USA)
**Niveau de conformité : PARTIEL** *(base solide, transferts hors UE à formaliser)*

---

## Résumé Exécutif

CLARITY traite potentiellement des données à caractère personnel via les saisies libres des utilisateurs (transcriptions audio, textes collés, questionnaire) qui sont transmises à l'API Anthropic, hébergée et traitée aux États-Unis. L'application ne collecte pas de données directement identifiantes *de sa propre initiative*, mais sa conception ne peut pas empêcher un utilisateur de saisir des données personnelles dans les champs libres.

**Points forts :**
- Architecture sans serveur propre : zéro base de données, zéro persistance côté application
- Avertissements utilisateur présents (modal d'accueil + footer)
- Données en mémoire uniquement, effacées à la fermeture de l'onglet
- Clé API non stockée de façon permanente

**Points de vigilance :**
- Transfert de données vers les USA sans formalisation contractuelle côté SNCF vérifiée
- Absence de registre de traitement documenté pour cet outil
- Aucune procédure formalisée pour l'exercice des droits des personnes
- Modal de consentement absent au premier usage (avertissement présent mais non consentement)
- Fichiers audio envoyés à Anthropic potentiellement porteurs de données biométriques (voix)

---

## 1. Cartographie des Données Traitées

### 1.1 Nature des données

| Catégorie | Type de donnée | Exemple | DCP ? | Sensible Art. 9 ? |
|-----------|---------------|---------|-------|-------------------|
| Questionnaire | Texte libre (65 questions) | Description projet, contexte métier, parties prenantes | ⚠ Si noms ou postes saisis | Non |
| Audio importé | Fichier audio (MP3/WAV/M4A) | Enregistrement d'une réunion | ⚠ Voix = donnée biométrique potentielle | ⚠ Si identification possible |
| Dictée en direct | Flux microphone en temps réel | Même que fichier audio | ⚠ Idem | ⚠ Idem |
| PDF/texte importé | Contenu textuel libre | CR de réunion, expression de besoin | ⚠ Si noms, matricules, emails présents | Non |
| Contexte métier (`cfgContext`) | Texte libre (system prompt) | Contexte organisationnel SNCF | ⚠ Si données nominatives | Non |
| JSON UX-Pilot | Export JSON (personas, user stories) | Persona "Sophie, 45 ans, chef de bord" | ⚠ Persona peut être basé sur une vraie personne | Non |
| Design.md | Charte graphique, identité visuelle | Couleurs, polices, logo | ✅ Non DCP | Non |
| Clé API | Identifiant technique Anthropic | `sk-ant-api03-...` | ✅ Non DCP (credential) | Non |
| Flag `localStorage` | Booléen de préférence UI | `clarity_welcome_v1=1` | ✅ Non DCP | Non |

**Conclusion :** L'application ne *collecte pas activement* de données à caractère personnel. Cependant, les champs libres peuvent contenir des DCP si l'utilisateur les y saisit, ce qui constitue un traitement au sens du RGPD.

---

### 1.2 Flux de données

```
Utilisateur (poste SNCF)
       │
       │  Saisie / Upload (audio, PDF, texte, JSON)
       ▼
  CLARITY (navigateur)  ←── Mémoire uniquement, session en cours
       │
       │  HTTPS — API calls (prompts + données saisies)
       ▼
  Anthropic API (USA)   ←── Traitement IA, génération livrables
       │
       │  Réponse (texte HTML)
       ▼
  CLARITY (navigateur)  ←── Affichage / Téléchargement local
       │
       │  Téléchargement (.html)
       ▼
  Poste utilisateur     ←── Données sous contrôle utilisateur
```

**Aucun serveur SNCF intermédiaire** : les données transitent directement du navigateur vers Anthropic.

---

## 2. Analyse Juridique du Traitement

### 2.1 Qualification RGPD

| Question | Réponse |
|----------|---------|
| Y a-t-il traitement de DCP ? | **Potentiellement oui** — selon le contenu saisi par l'utilisateur |
| Qui est le responsable de traitement ? | **SNCF / e.SNCF Solutions** — l'entité qui déploie et met à disposition l'outil |
| Qui est le sous-traitant ? | **Anthropic PBC** — traite les données au nom du RT pour générer les livrables |
| Traitement automatisé ? | **Oui** — les données alimentent un LLM sans intervention humaine intermédiaire |
| Profilage ou décision automatisée (Art. 22) ? | **Non** — les livrables sont informatifs, la décision reste humaine |

---

### 2.2 Base légale (Art. 6 RGPD)

| Scénario d'usage | Base légale applicable | Observation |
|-----------------|----------------------|-------------|
| Cadrage de projets internes SNCF | **Intérêt légitime (Art. 6.1.f)** ou **Exécution d'une mission (Art. 6.1.e)** | Acceptable si proportionné — à documenter dans le registre |
| Usage sur des données de tiers (employés, agents) | **Intérêt légitime** sous réserve du test de balance | Risque si données sensibles (RH, santé, etc.) |
| Fichiers audio contenant des voix identifiables | Pas de base légale évidente sans **consentement explicite (Art. 6.1.a)** des personnes enregistrées | ⚠ Point critique |

**Recommandation :** Documenter la base légale retenue dans le registre de traitement SNCF (voir §7).

---

### 2.3 Données sensibles (Art. 9 RGPD)

Les **données biométriques** (voix permettant d'identifier une personne) relèvent de l'Art. 9 RGPD et sont soumises à une interdiction de principe, avec exceptions limitées (consentement explicite, intérêt public, etc.).

L'envoi de fichiers audio contenant des voix identifiables à l'API Anthropic sans consentement explicite des personnes enregistrées constitue un traitement de données sensibles potentiellement non conforme.

**Recommandation :** Renforcer l'avertissement pour les imports audio :
```html
<!-- À ajouter avant l'upload audio -->
<div class="warn-box">
  ⚠ <strong>Données biométriques</strong> — Les fichiers audio contenant des voix
  identifiables sont des données sensibles (Art. 9 RGPD). Assurez-vous d'avoir
  obtenu le consentement des personnes enregistrées avant d'importer ce fichier.
  Les données sont transmises à Anthropic (USA).
</div>
```

---

## 3. Transferts Hors UE (Art. 44–49 RGPD)

### 3.1 Situation actuelle

Anthropic PBC est une société américaine. Les données traitées via son API sont donc transférées vers les États-Unis, pays ne bénéficiant pas d'une décision d'adéquation de la Commission européenne (les accords EU-US Data Privacy Framework ne couvrent pas nécessairement Anthropic).

| Critère | Statut |
|---------|--------|
| Décision d'adéquation UE → USA | ⚠ EU-US DPF partiel — vérifier si Anthropic est certifié |
| Clauses contractuelles types (CCT) SNCF ↔ Anthropic | ❓ À vérifier — dépend des CGU Anthropic entreprise |
| Garanties appropriées (Art. 46) | ❓ Non documentées côté SNCF |
| Dérogations Art. 49 (consentement ponctuel) | ⚠ Difficilement applicable à un outil métier récurrent |

### 3.2 Politique de données Anthropic

Selon les CGU Anthropic (à la date de cet audit) :
- Les données saisies via l'API ne sont **pas utilisées pour entraîner les modèles** par défaut (clause API)
- Rétention des données API : selon les paramètres de compte — par défaut 30 jours de logs
- Anthropic dispose de certifications SOC 2 Type II

**Recommandation :**
1. Vérifier si SNCF a souscrit un contrat Enterprise Anthropic incluant un DPA (Data Processing Agreement) conforme RGPD
2. Si non, formaliser un addendum RGPD avec Anthropic ou basculer sur un modèle hébergé en UE (ex. : Claude via AWS Europe, Mistral, etc.)
3. Documenter la dérogation Art. 49.1.a (consentement ponctuel) en dernier recours, avec information explicite à chaque session

---

## 4. Information des Personnes (Art. 13-14 RGPD)

### 4.1 Information actuelle dans l'application

| Point d'information | Présent ? | Qualité |
|--------------------|-----------|---------|
| Nature du traitement (IA générative) | ✅ Modal d'accueil + footer | Bien formulé |
| Destinataire des données (Anthropic) | ✅ Footer + modal | Présent |
| Transfert hors UE | ⚠ Implicite | Non explicitement mentionné |
| Base légale | ❌ Absent | À ajouter |
| Droits des personnes (accès, effacement, rectification) | ❌ Absent | À ajouter |
| Contact DPO / responsable traitement | ❌ Absent | À ajouter |
| Durée de conservation | ⚠ Partielle | "mémoire uniquement" mentionné — durée côté Anthropic absente |
| Données biométriques (audio) | ⚠ Avertissement générique | Avertissement spécifique requis (Art. 9) |

### 4.2 Texte footer actuel (index.html)

```
Votre clé API est stockée uniquement en mémoire locale de votre navigateur
et n'est jamais transmise à un tiers autre qu'Anthropic.
Les données saisies (transcriptions, textes, questionnaire) sont envoyées à l'API
Anthropic dans le cadre du traitement ; ne saisissez pas d'informations personnelles
sensibles ou classifiées.
```

**Appréciation :** Bon début, mais insuffisant pour satisfaire les exigences de transparence RGPD (Art. 13).

### 4.3 Notice d'information recommandée

Le footer devrait être complété ou un lien vers une notice dédiée devrait être ajouté :

```
CLARITY — Traitement des données
Responsable de traitement : SNCF / e.SNCF Solutions — FAN
Sous-traitant IA : Anthropic PBC (USA) — données traitées pour générer les livrables
Base légale : Intérêt légitime (Art. 6.1.f RGPD) — mission de cadrage de projets
Transfert hors UE : Anthropic USA — garanties : [CCT / DPF — à préciser]
Conservation : données en mémoire de session uniquement côté CLARITY ;
               politique de rétention Anthropic : [lien CGU Anthropic]
Droits : accès, rectification, effacement, opposition — contacter [dpo@sncf.fr]
```

---

## 5. Droits des Personnes (Art. 15–22 RGPD)

| Droit | Exercice possible ? | Commentaire |
|-------|-------------------|-------------|
| Accès (Art. 15) | ⚠ Limité | Les données sont en mémoire session — aucune base de données côté SNCF |
| Rectification (Art. 16) | ✅ Natif | L'utilisateur contrôle ses saisies en temps réel |
| Effacement (Art. 17) | ✅ Partiel | Bouton "Supprimer toutes les données" + fermeture d'onglet ; côté Anthropic : procédure à documenter |
| Portabilité (Art. 20) | ✅ Téléchargement | Les livrables sont téléchargeables |
| Opposition (Art. 21) | ✅ Natif | Ne pas utiliser l'outil |
| Limitation (Art. 18) | N/A | Pas de persistance côté SNCF |
| Non-profilage (Art. 22) | ✅ Respecté | Pas de décision automatisée |

**Recommandation :** Formaliser dans la notice (§4.3) le contact DPO et la procédure pour les droits vis-à-vis d'Anthropic.

---

## 6. Privacy by Design & by Default (Art. 25 RGPD)

| Principe | Statut | Détail |
|----------|--------|--------|
| Minimisation des données | ✅ Bon | Seules les données saisies sont envoyées ; pas de collecte technique additionnelle |
| Limitation de la finalité | ✅ Respecté | Données utilisées uniquement pour générer les livrables |
| Durée de conservation minimale | ✅ Session uniquement | Données effacées à la fermeture de l'onglet |
| Intégrité et confidentialité | ✅ HTTPS + TLS | Communications chiffrées avec Anthropic |
| Responsabilité | ⚠ Partiel | Registre et DPA à formaliser |
| Pas de persistance par défaut | ✅ Respecté | Aucune base de données côté SNCF |
| Minimisation technique | ⚠ Amélioration possible | Pas de contrôle empêchant la saisie de DCP — uniquement avertissement |

---

## 7. Obligations de Documentation (Art. 30 RGPD)

### 7.1 Registre de traitement

L'article 30 RGPD impose aux responsables de traitement de tenir un registre des activités de traitement. CLARITY devrait y figurer avec les informations suivantes :

| Champ Art. 30 | Contenu pour CLARITY |
|--------------|---------------------|
| Nom du traitement | Cadrage de projets d'innovation assisté par IA (CLARITY) |
| Responsable de traitement | SNCF / e.SNCF Solutions — FAN |
| Finalité | Structuration et cadrage de projets numériques |
| Catégories de personnes | Utilisateurs internes SNCF ; tiers mentionnés dans les saisies libres |
| Catégories de données | Données de projet, potentiellement DCP si saisies par l'utilisateur, données biométriques (audio) |
| Destinataires | Anthropic PBC (sous-traitant IA) |
| Transferts hors UE | USA — Anthropic — garanties : [à préciser] |
| Durée de conservation | Session navigateur uniquement (côté CLARITY) ; [durée Anthropic à préciser] |
| Mesures de sécurité | TLS, mémoire uniquement, CSP, pas de persistance locale |

**Recommandation :** Soumettre cette entrée au DPO SNCF pour intégration au registre groupe.

### 7.2 Analyse d'Impact (AIPD / DPIA) — Art. 35 RGPD

Une AIPD (Analyse d'Impact sur la Protection des Données) est **obligatoire** si le traitement présente un risque élevé. Les critères CNIL / EDPB à évaluer :

| Critère EDPB | CLARITY | Score |
|-------------|---------|-------|
| Évaluation ou notation | Non | 0 |
| Décision automatisée avec effet juridique | Non | 0 |
| Surveillance systématique | Non | 0 |
| Données sensibles (Art. 9) | ⚠ Audio potentiellement | 1 |
| Données à grande échelle | Dépend du déploiement | 0–1 |
| Croisement de données | Non | 0 |
| Personnes vulnérables | Non | 0 |
| Usage innovant / nouvelles technologies | ✅ IA générative | 1 |
| Transfert hors UE | ✅ USA | 1 |

**Score : 3–4/9** — En dessous du seuil d'obligation stricte (≥ 2 critères CNIL), mais l'usage d'une IA générative avec transfert hors UE **recommande fortement** une AIPD de précaution.

---

## 8. Sous-traitance — Anthropic (Art. 28 RGPD)

L'Art. 28 RGPD impose que le recours à un sous-traitant soit encadré par un contrat (DPA) contenant des clauses obligatoires.

### 8.1 Clauses requises Art. 28.3

| Clause | Couverte par CGU Anthropic API ? |
|--------|--------------------------------|
| Traitement uniquement sur instruction du RT | ✅ Oui (usage API) |
| Confidentialité des données | ✅ Présent dans CGU |
| Mesures de sécurité Art. 32 | ✅ SOC 2 Type II |
| Sous-sous-traitance | ⚠ À vérifier — infrastructure AWS |
| Assistance pour droits des personnes | ❓ Non explicite dans CGU standard |
| Assistance pour AIPD | ❓ Non explicite |
| Suppression/retour données en fin de contrat | ❓ Non explicite |
| Audit du sous-traitant | ❓ Non explicite |

**Recommandation :** Utiliser le [Data Processing Addendum Anthropic](https://www.anthropic.com/legal/data-processing-addendum) disponible pour les comptes enterprise. S'assurer que la SNCF l'a signé.

---

## 9. Sécurité des Données (Art. 32 RGPD)

| Mesure Art. 32 | Statut | Détail |
|----------------|--------|--------|
| Chiffrement en transit | ✅ HTTPS/TLS | `https://api.anthropic.com` en dur |
| Chiffrement au repos | ✅ N/A | Pas de stockage côté CLARITY |
| Pseudonymisation | ⚠ Encouragée | Non imposée techniquement — avertissement utilisateur |
| Confidentialité | ✅ Bonne | Pas de backend, pas de log serveur SNCF |
| Disponibilité et résilience | ✅ SaaS Anthropic | Dépend de la disponibilité d'Anthropic |
| Restauration en cas d'incident | N/A | Pas de données persistées |
| Tests de sécurité réguliers | ⚠ À planifier | Audit statique effectué ; pentest non effectué |
| Évaluation continue | ⚠ À structurer | Présent audit = premier pas |

---

## 10. Gestion des Incidents (Art. 33–34 RGPD)

En cas de violation de données impliquant CLARITY :

| Scénario | Action requise | Délai |
|----------|---------------|-------|
| Exfiltration de données via XSS (clé API volée + prompts lus) | Notification CNIL + potentiellement personnes concernées | 72h (Art. 33) |
| Compromission de la clé API Anthropic | Rotation immédiate de la clé ; évaluer si des DCP ont transité | — |
| Violation de données côté Anthropic | Anthropic notifie SNCF → SNCF notifie CNIL si DCP affectés | 72h après notification Anthropic |
| Accès non autorisé aux fichiers audio | Notification CNIL + personnes concernées (données biométriques = Art. 9) | 72h (Art. 33) + sans retard (Art. 34) |

**Recommandation :** Définir et documenter une procédure de gestion d'incident RGPD incluant les contacts Anthropic, DPO SNCF, et CNIL.

---

## 11. Recommandations Prioritaires

### Priorité 1 — Actions immédiates (< 1 semaine)

| Action | Responsable | Effort |
|--------|-------------|--------|
| Vérifier si un DPA Anthropic est signé au niveau SNCF | DPO SNCF | 1h |
| Ajouter un avertissement spécifique Art. 9 pour les imports audio | Développement | 30 min |
| Enrichir le footer / ajouter notice RGPD avec droits et contact DPO | Développement | 1h |
| Renommer le flag localStorage `ce_*` → `clarity_*` | Développement | 5 min |

### Priorité 2 — Court terme (< 1 mois)

| Action | Responsable | Effort |
|--------|-------------|--------|
| Inscrire CLARITY au registre de traitement SNCF (Art. 30) | DPO SNCF | 2h |
| Documenter la base légale retenue (intérêt légitime → test balance) | DPO SNCF | 2h |
| Documenter les garanties pour le transfert vers les USA (DPF / CCT) | DPO SNCF | 4h |
| Évaluer l'opportunité d'une AIPD de précaution | DPO SNCF | 1 jour |
| Ajouter bornes de taille sur les inputs pour limiter l'exposition de DCP | Développement | 30 min |

### Priorité 3 — Moyen terme (< 3 mois)

| Action | Responsable |
|--------|-------------|
| Intégrer un mécanisme de consentement explicite au premier lancement (au-delà du simple avertissement) | Développement + DPO |
| Étudier une alternative d'hébergement UE du modèle (Claude via AWS eu-west, Mistral, etc.) | Architecture |
| Procédure formalisée d'exercice des droits pour les personnes concernées | DPO SNCF |
| Clause RGPD dans la documentation d'onboarding utilisateurs CLARITY | Documentation |

---

## 12. Synthèse pour Décideurs

**Ce qui est bien :** CLARITY est conçu avec une architecture "privacy by default" — pas de base de données, pas de compte utilisateur, pas de tracking, données effacées à la fermeture du navigateur. Les avertissements utilisateurs sont présents et bien formulés.

**Ce qui manque côté technique (rapide) :**
- Un avertissement spécifique pour les fichiers audio (données biométriques)
- Une notice d'information complète Art. 13 avec contact DPO

**Ce qui manque côté gouvernance (décision SNCF) :**
- Inscription au registre de traitement
- Vérification / signature d'un DPA avec Anthropic
- Formalisation des garanties pour le transfert USA (DPF ou CCT)
- Décision sur l'opportunité d'une AIPD

**Verdict de déploiement :**
- Usage individuel sur réseau SNCF sécurisé : **Acceptable** avec les avertissements actuels
- Déploiement équipe / diffusion large : **Sous conditions** — registre + DPA Anthropic + notice RGPD à finaliser
- Usage avec données personnelles nominatives (noms, matricules, RH) : **À proscrire** tant que le cadre juridique n'est pas formalisé

---

*Audit réalisé par analyse statique du code source et revue des flux de données. L'audit ne constitue pas un avis juridique. Pour toute décision de déploiement, la validation du DPO SNCF est requise.*

*CLARITY v8.5.0 — Fabrique de l'Adoption Numérique — e.SNCF Solutions — 2026-04-16*
