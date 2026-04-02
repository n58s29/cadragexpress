# Cadrage Express v7

Outil de cadrage de projets d'innovation assisté par IA (Claude / Anthropic), conçu pour la SNCF — Direction Innovation.

## Fonctionnalités

- Analyse automatique d'un PDF, fichier texte ou audio pour remplir le questionnaire de cadrage
- Dictée en direct (Web Speech API) avec transcription temps réel
- Questionnaire systémique en 7 dimensions
- Génération de 3 livrables par des agents experts virtuels : Synthèse, Maquette applicative, Pré-cadrage technique
- Export HTML des livrables

## Structure

```
cadrage-express/
├── index.html                  # Interface principale
├── css/
│   └── style.css               # Styles (thème sombre)
├── js/
│   └── app.js                  # Logique applicative
├── data/
│   └── cadrage-questions.json  # Définition des 7 questions de cadrage
├── assets/
│   └── (logo, favicons...)
└── README.md
```

## Utilisation

Servir le dossier via un serveur HTTP local (requis pour le chargement du JSON et les appels API) :

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Puis ouvrir `http://localhost:8080` dans Chrome ou Edge.

Configurer votre clé API Anthropic via le panneau ⚙ Configuration.

## Prérequis

- Clé API Anthropic (BYOK — stockée uniquement en mémoire navigateur)
- Chrome ou Edge (pour la dictée en direct et la reconnaissance vocale)
