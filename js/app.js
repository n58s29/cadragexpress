/* ═══════════════════════════════════════
   STATE
   ═══════════════════════════════════════ */
let curStep = 1;
let loadedFileText = '';
let loadedFileName = '';
let loadedAudioBase64 = '';
let loadedAudioMediaType = '';
let loadedAudioFileName = '';
let lastSynthHtml = '';
let lastMockHtml = '';
let lastCadrageHtml = '';
let genDone = 0;
let answeredQuestions = {};         // { "1.1": "réponse courte", ... }
let designMdContent = '';           // Contenu du design.md importé
let uxPilotData = null;             // Données normalisées de l'export UX-Pilot
const LIVE_CHUNK_SIZE = 400;        // nb de nouveaux chars avant analyse progressive
let liveLastAnalyzedLen = 0;
let liveAnalysisRunning = false;

const agentDefs = [
  {
    key: 'economist',
    label: 'Économiste',
    icon: '$',
    color: 'var(--ambre)',
    enabled: true,
    prompt: `Tu es un économiste spécialisé dans l'analyse coûts-bénéfices de projets d'innovation numérique dans le secteur ferroviaire et les grandes entreprises publiques.

TON RÔLE :
- Évaluer la viabilité économique du projet (ROI, TCO, payback period)
- Identifier les coûts cachés (maintenance, formation, conduite du changement, dette technique)
- Chiffrer les gains potentiels (productivité, réduction d'erreurs, temps économisé)
- Comparer les scénarios Baseline / MVP / Scale avec des ordres de grandeur réalistes
- Alerter sur les risques financiers et les dépendances budgétaires

CONTRAINTES SNCF :
- Budget innovation souvent contraint, besoin de quick wins pour débloquer les enveloppes
- Distinction CAPEX/OPEX importante pour la gouvernance
- Coûts internes (ETP) vs coûts externes (prestataires) à bien séparer
- Penser au coût d'opportunité : que se passe-t-il si on ne fait rien ?`
  },
  {
    key: 'growth',
    label: 'Growth Analyst',
    icon: 'G',
    color: 'var(--menthe)',
    enabled: true,
    prompt: `Tu es un Growth Analyst spécialisé dans la mesure d'impact et l'adoption des outils numériques en entreprise.

TON RÔLE :
- Définir les KPIs pertinents pour mesurer le succès du projet
- Identifier les leviers d'adoption et les freins potentiels
- Proposer une stratégie de déploiement progressive (pilote → généralisation)
- Estimer la volumétrie d'utilisateurs et les taux d'adoption réalistes
- Concevoir les mécanismes de feedback et d'itération

MÉTHODES :
- Framework AARRR adapté aux outils internes (Acquisition → Activation → Rétention → Referral → Revenue/Impact)
- Analyse des cohortes d'utilisateurs (early adopters, majorité, retardataires)
- North Star Metric : quel indicateur unique résume la valeur créée ?
- Boucles de croissance : comment chaque utilisateur satisfait en amène d'autres ?

CONTEXTE SNCF :
- Adoption souvent freinée par la multiplicité des outils existants
- Importance du terrain : les agents en gare/atelier n'ont pas les mêmes usages que les cadres
- Réseau de champions / ambassadeurs comme levier clé`
  },
  {
    key: 'product',
    label: 'Product Strategist',
    icon: 'P',
    color: 'var(--cerulean)',
    enabled: true,
    prompt: `Tu es un Product Strategist senior spécialisé dans la conception de produits numériques pour les grandes organisations.

TON RÔLE :
- Reformuler le besoin métier en vision produit claire (problem statement, value proposition)
- Prioriser les fonctionnalités avec une matrice Impact/Effort
- Définir le MVP minimal crédible vs les itérations futures
- Identifier les hypothèses critiques à valider avant développement
- Proposer un discovery plan (interviews, prototypage, tests)

FRAMEWORKS :
- Jobs-to-be-Done : quel "job" l'utilisateur essaie-t-il d'accomplir ?
- Opportunity Solution Tree : problème → opportunités → solutions → expériences
- RICE scoring pour la priorisation (Reach, Impact, Confidence, Effort)
- Build-Measure-Learn pour les itérations

POSTURE :
- Challenger le besoin : est-ce le bon problème à résoudre ?
- Penser "outcome" (résultat métier) plutôt que "output" (fonctionnalité)
- Toujours revenir à l'utilisateur final et sa douleur quotidienne`
  },
  {
    key: 'tech',
    label: 'Tech Lead',
    icon: 'T',
    color: 'var(--lavande)',
    enabled: true,
    prompt: `Tu es un Tech Lead / Architecte SI expérimenté dans les systèmes d'information ferroviaires et les grandes DSI.

TON RÔLE :
- Évaluer la faisabilité technique et proposer des architectures adaptées
- Identifier les intégrations SI nécessaires (APIs, référentiels, bases existantes)
- Estimer la complexité technique et les délais réalistes
- Alerter sur les contraintes d'infrastructure (réseau, hébergement, sécurité)
- Proposer des choix technologiques pragmatiques (build vs buy vs configure)

CONTRAINTES SNCF/DSI :
- Environnement Windows dominant, navigateur parfois restreint
- Réseau interne avec proxy, VPN, restrictions d'accès
- Hébergement : cloud SNCF (Azure), on-premise, ou SaaS homologué
- Référentiels : LDAP/AD pour l'authentification, HR pour les données agent
- RGPD et politique de données SNCF stricte
- Homologation sécurité obligatoire pour tout nouvel outil

STACK TYPIQUE SNCF :
- Frontend : React/Angular, ou Power Platform pour le low-code
- Backend : .NET, Java, Node.js selon les équipes
- Data : SQL Server, Power BI, Dataiku pour la data science
- Intégration : API Management SNCF, ESB`
  },
  {
    key: 'ux',
    label: 'UX Designer',
    icon: 'U',
    color: 'var(--ocre)',
    enabled: true,
    prompt: `Tu es un UX Designer senior spécialisé dans les outils métier et les interfaces pour les agents de terrain.

TON RÔLE :
- Identifier les parcours utilisateurs clés et les points de friction
- Proposer des principes d'interface adaptés au contexte d'usage
- Anticiper les besoins d'accessibilité (RGAA) et d'ergonomie terrain
- Définir les écrans principaux et la navigation
- Alerter sur les pièges UX classiques des outils internes

PRINCIPES :
- Mobile-first pour les agents terrain, desktop-first pour les fonctions support
- Complexité progressive : interface simple par défaut, options avancées accessibles
- Feedback immédiat : l'utilisateur doit toujours savoir où il en est
- Cohérence avec l'écosystème SNCF existant (charte, patterns connus)
- Offline-first si usage en zone blanche (ateliers, voies)

MÉTHODES :
- Personas basés sur les vrais profils agents SNCF
- User story mapping pour séquencer le développement
- Tests d'utilisabilité rapides (5 secondes, guerilla testing)
- Design system : réutiliser les composants existants avant d'en créer

CONTEXTE SNCF :
- Utilisateurs souvent non-technophiles, besoin de simplicité extrême
- Contraintes matérielles : tablettes durcies, écrans de tailles variées
- Importance de la formation et de l'onboarding intégré`
  }
];

let questionDefs = [];

const modelDefs = [
  { id: 'claude-opus-4-6',            label: 'Claude Opus 4.6',     audio: true  },
  { id: 'claude-sonnet-4-6',          label: 'Claude Sonnet 4.6',   audio: true  },
  { id: 'claude-sonnet-4-20250514',   label: 'Claude Sonnet 4',     audio: true  },
  { id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5',    audio: false },
  { id: 'claude-haiku-3-5-20241022',  label: 'Claude Haiku 3.5',    audio: false },
];

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   SÉCURITÉ — Vérification HTTPS
   ═══════════════════════════════════════ */
(function checkHttps() {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#dc2626;color:#fff;text-align:center;padding:10px 16px;font-size:13px;font-weight:600;';
    banner.innerHTML = '⚠ Cette application est servie en HTTP. Votre clé API Anthropic transitera en clair sur le réseau. Utilisez HTTPS en production.';
    document.body.prepend(banner);
  }
})();

async function init() {
  try {
    const res = await fetch('data/cadrage-questions.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    questionDefs = await res.json();
  } catch (e) {
    console.error('Impossible de charger cadrage-questions.json :', e);
    document.getElementById('qBody').innerHTML =
      `<div class="warn-box" style="margin:16px;">
        ⚠ <strong>Questionnaire non chargé</strong> — Le fichier <code>data/cadrage-questions.json</code> est inaccessible.<br>
        Lancez l'application via un serveur HTTP local :<br>
        <code style="display:block;margin-top:8px;">python -m http.server 8080</code>
        puis ouvrez <code>http://localhost:8080</code>.
      </div>`;
  }
  renderQuestionnaire();
  // Ouvre le premier bloc par défaut
  if (questionDefs.blocs && questionDefs.blocs.length > 0) toggleBloc(questionDefs.blocs[0].id);
  renderAgentGrid();
  onModelChange();
  updateCfg();
  initDragDrop();
  openWelcome();

  // Capture les rejets de Promise non gérés (erreurs silencieuses)
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason) || 'Erreur inconnue';
    appendLog(`[Rejet Promise non géré] ${msg}`, 'error');
    console.error('[CadrageExpress] unhandledrejection:', event.reason);
  });
}
init();

/* ═══════════════════════════════════════
   MODAL BIENVENUE
   ═══════════════════════════════════════ */
function openWelcome() {
  if (localStorage.getItem('ce_welcome_dismissed') === '1') return;
  const overlay = document.getElementById('welcomeOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

function closeWelcome() {
  const overlay = document.getElementById('welcomeOverlay');
  if (!overlay) return;
  const cb = document.getElementById('welcomeNePlusAfficher');
  if (cb && cb.checked) localStorage.setItem('ce_welcome_dismissed', '1');
  overlay.classList.add('hidden');
}

/* ═══════════════════════════════════════
   AGENTS
   ═══════════════════════════════════════ */
function renderAgentGrid() {
  const grid = document.getElementById('agentGrid');
  grid.innerHTML = agentDefs.map(a => `
    <div class="agent-card ${a.enabled ? 'active' : ''}" id="ac_${a.key}">
      <div class="agent-row">
        <div class="agent-icon" style="${a.enabled ? '' : 'opacity:0.4'}">${a.icon}</div>
        <div class="agent-info">
          <div class="agent-name">${a.label}</div>
          <div class="agent-role">${a.enabled ? '✓ Actif' : 'Désactivé'}</div>
        </div>
        <button class="agent-edit-btn" onclick="toggleAgentEditor('${a.key}')" aria-label="Modifier le prompt de l'agent ${a.label}"><span aria-hidden="true">✎</span></button>
        <button class="agent-toggle ${a.enabled ? 'on' : ''}" id="at_${a.key}"
          role="switch" aria-checked="${a.enabled ? 'true' : 'false'}"
          aria-label="${a.enabled ? 'Désactiver' : 'Activer'} l'agent ${a.label}"
          onclick="toggleAgent('${a.key}')"></button>
      </div>
      <div class="agent-editor" id="ae_${a.key}">
        <textarea id="ap_${a.key}" aria-label="Prompt de l'agent ${a.label}" oninput="updateAgentPrompt('${a.key}', this.value)">${esc(a.prompt)}</textarea>
      </div>
    </div>
  `).join('');
}

function toggleAgent(key) {
  const agent = agentDefs.find(a => a.key === key);
  if (!agent) return;
  agent.enabled = !agent.enabled;
  renderAgentGrid();
  updateAgentBadge();
}

function toggleAgentEditor(key) {
  const editor = document.getElementById('ae_' + key);
  if (editor) editor.classList.toggle('open');
}

function updateAgentPrompt(key, value) {
  const agent = agentDefs.find(a => a.key === key);
  if (agent) agent.prompt = value;
}

function updateAgentBadge() {
  const count = agentDefs.filter(a => a.enabled).length;
  const badge = document.getElementById('agentBadge');
  badge.textContent = count + ' / 5';
  badge.className = count > 0 ? 'badge ok' : 'badge warn';
}

function getActiveAgentsPayload() {
  const payload = {};
  agentDefs.filter(a => a.enabled).forEach(a => {
    payload[a.label] = a.prompt;
  });
  return payload;
}

/* ═══════════════════════════════════════
   MODEL SELECT
   ═══════════════════════════════════════ */
function onModelChange() {
  const sel = document.getElementById('cfgModel');
  const def = modelDefs.find(m => m.id === sel.value);
  const msg = document.getElementById('audioCompatMsg');
  if (!def) { msg.innerHTML = ''; return; }
  if (def.audio) {
    msg.innerHTML = '<span class="audio-compat-badge">🎙 Compatible audio</span>';
  } else {
    msg.innerHTML = '<span class="audio-incompat-badge">⚠ Audio non supporté avec ce modèle</span>';
  }
}

/* ═══════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════ */
function openConfig() { goStep(0); }
function closeConfig() { goStep(curStep > 0 ? curStep : 1); updateCfg(); }

function clearAllData() {
  if (!confirm('Supprimer toutes les données du projet ?\n\nCela effacera le questionnaire, les fichiers chargés et les livrables générés.\nLa configuration (clé API, modèle, agents) sera conservée.')) return;
  // Questionnaire
  answeredQuestions = {};
  renderQuestionnaire();
  updateQProgress();
  // Fichier texte / PDF
  clearFile();
  // Audio
  clearAudio();
  // Texte collé
  const pasteArea = document.getElementById('pasteArea');
  if (pasteArea) pasteArea.value = '';
  // Dictée live
  const liveTranscript = document.getElementById('liveTranscript');
  if (liveTranscript) liveTranscript.value = '';
  // UX-Pilot
  if (uxPilotData) clearUxPilot();
  // Livrables générés
  lastSynthHtml = ''; lastMockHtml = ''; lastCadrageHtml = '';
  ['synthFrame','mockFrame','cadrageFrame'].forEach(id => {
    const f = document.getElementById(id);
    if (f) { f.srcdoc = ''; f.src = ''; }
  });
  document.getElementById('genStatusCard').style.display = 'none';
  // Retour étape 1
  goStep(1);
  showToast('Données effacées');
}
function toggleKey() {
  const el = document.getElementById('cfgKey');
  el.type = el.type === 'password' ? 'text' : 'password';
}
function updateCfg() {
  const hasKey = document.getElementById('cfgKey').value.trim().length > 0;
  const dot = document.getElementById('topDot');
  const txt = document.getElementById('topStatusText');
  const warn = document.getElementById('cfgWarning');
  const agentCount = agentDefs.filter(a => a.enabled).length;
  if (hasKey) {
    dot.className = 'status-dot ok';
    txt.textContent = `API OK · ${agentCount}/5 agents`;
    warn.style.display = 'none';
  } else {
    dot.className = 'status-dot';
    txt.textContent = 'Non configuré';
    warn.style.display = 'block';
  }
  updateAgentBadge();
}

/* ═══════════════════════════════════════
   DESIGN.MD
   ═══════════════════════════════════════ */
function handleDesignFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('designMdArea').value = e.target.result;
    onDesignMdChange();
    showToast('design.md chargé');
  };
  reader.readAsText(file);
}

function onDesignMdChange() {
  designMdContent = document.getElementById('designMdArea').value;
  const hasDesign = designMdContent.trim().length > 0;
  const badge = document.getElementById('designBadge');
  const clearBtn = document.getElementById('clearDesignBtn');
  badge.style.display = hasDesign ? '' : 'none';
  badge.className = hasDesign ? 'badge ok' : 'badge';
  clearBtn.style.display = hasDesign ? '' : 'none';
}

function clearDesignMd() {
  designMdContent = '';
  document.getElementById('designMdArea').value = '';
  document.getElementById('designFilePicker').value = '';
  onDesignMdChange();
  showToast('Identité de marque effacée');
}

function onBrandNameChange() {
  const name = document.getElementById('cfgBrandName').value.trim();
  const eyebrow = document.getElementById('navEyebrow');
  const eyebrowText = document.getElementById('navEyebrowText');
  const footerText = document.getElementById('footerBrandText');
  if (name) {
    eyebrow.style.display = '';
    eyebrowText.textContent = name;
    if (footerText) footerText.textContent = name;
  } else {
    eyebrow.style.display = 'none';
    if (footerText) footerText.textContent = '';
  }
}

/* ═══════════════════════════════════════
   STEPPER
   ═══════════════════════════════════════ */
function goStep(n) {
  curStep = n;
  ['stab0','stab1','stab2'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'step-tab' + (i === n ? ' active' : (i < n ? ' done' : ''));
  });
  [0,1,2].forEach(j => {
    const p = document.getElementById('panel'+j);
    if (p) p.className = j === n ? 'panel visible' : 'panel';
  });
  if (n === 0) updateCfg();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════
   SOURCE SWITCH
   ═══════════════════════════════════════ */
const METHOD_TILE = { audio:'mtAudio', live:'mtLive', pdf:'mtPdf', paste:'mtPaste', manual:'mtManual', uxpilot:'mtUxpilot' };
const METHOD_ZONE = { audio:'zoneAudio', live:'zoneLive', pdf:'zonePdf', paste:'zonePaste', manual:'zoneManual', uxpilot:'zoneUxpilot' };

function switchMethod(m) {
  if (m === 'audio') return; // temporairement désactivé
  // Tuiles : activer/désactiver
  Object.entries(METHOD_TILE).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.className = k === m ? 'method-tile active' : 'method-tile';
  });
  // Zones : afficher / masquer
  Object.entries(METHOD_ZONE).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = k === m ? 'block' : 'none';
  });
  if (m !== 'live') stopMic();

  // Mode manuel : activer les textareas + ouvrir tous les blocs
  const qBody = document.getElementById('qBody');
  if (m === 'manual') {
    if (qBody) qBody.classList.add('manual-mode');
    expandAllBlocs();
    populateManualInputs();
  } else {
    if (qBody) qBody.classList.remove('manual-mode');
  }
}

function expandAllBlocs() {
  if (!questionDefs.blocs) return;
  questionDefs.blocs.forEach(bloc => {
    const body = document.getElementById('bbody_' + bloc.id);
    const hd   = body?.previousElementSibling;
    if (body) body.classList.add('open');
    if (hd)   hd.classList.add('open');
  });
}

function populateManualInputs() {
  Object.entries(answeredQuestions).forEach(([qid, val]) => {
    const ta = document.getElementById('qmi_' + qid.replace('.', '_'));
    if (ta && !ta.value) ta.value = val === '✓ (coché manuellement)' ? '' : val;
  });
}

function onManualInput(qid, value) {
  const v = value.trim();
  if (v) {
    answeredQuestions[qid] = v;
    _setCheckUI(qid, true, v);
  } else {
    delete answeredQuestions[qid];
    _setCheckUI(qid, false, '');
  }
  const blocId = parseInt(qid.split('.')[0]);
  updateBlocBadge(blocId);
  updateQProgress();
}

/* ═══════════════════════════════════════
   LIVE DICTATION (Web Speech API)
   ═══════════════════════════════════════ */
let recognition = null;
let liveRecording = false;
let liveTranscriptFinal = '';

function toggleMic() {
  liveRecording ? stopMic() : startMic();
}

function startMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast('⚠ Reconnaissance vocale non supportée — utilisez Chrome ou Edge.');
    return;
  }
  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'fr-FR';

  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        liveTranscriptFinal += e.results[i][0].transcript + ' ';
        document.getElementById('liveTranscript').value = liveTranscriptFinal;
        // Déclenche une analyse progressive si assez de nouveaux chars
        if (liveTranscriptFinal.length - liveLastAnalyzedLen >= LIVE_CHUNK_SIZE) {
          scheduleLiveAnalysis();
        }
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    document.getElementById('liveInterim').textContent = interim;
  };

  recognition.onerror = (e) => {
    if (e.error === 'not-allowed') {
      document.getElementById('micStatus').textContent = '⚠ Accès au microphone refusé.';
    } else {
      document.getElementById('micStatus').textContent = '⚠ Erreur : ' + e.error;
    }
    stopMic();
  };

  recognition.onend = () => {
    // Redémarre automatiquement si toujours en cours d'enregistrement
    if (liveRecording) {
      try { recognition.start(); } catch (_) {}
    }
  };

  liveRecording = true;
  recognition.start();
  const micBtnStart = document.getElementById('micBtn');
  micBtnStart.classList.add('recording');
  micBtnStart.innerHTML = '<span aria-hidden="true">⏹</span>';
  micBtnStart.setAttribute('aria-pressed', 'true');
  micBtnStart.setAttribute('aria-label', 'Arrêter la dictée');
  document.getElementById('micStatus').textContent = '🔴 Enregistrement en cours — parlez...';
}

function stopMic() {
  liveRecording = false;
  if (recognition) { try { recognition.stop(); } catch (_) {} recognition = null; }
  const btn = document.getElementById('micBtn');
  const status = document.getElementById('micStatus');
  if (!btn) return;
  btn.classList.remove('recording');
  btn.innerHTML = '<span aria-hidden="true">🎤</span>';
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Démarrer la dictée');
  status.textContent = liveTranscriptFinal
    ? '✓ Enregistrement terminé — vérifiez la transcription ci-dessous.'
    : 'Cliquez pour commencer la dictée';
  document.getElementById('liveInterim').textContent = '';
}

function clearLive() {
  stopMic();
  liveTranscriptFinal = '';
  liveLastAnalyzedLen = 0;
  document.getElementById('liveTranscript').value = '';
  document.getElementById('micStatus').textContent = 'Cliquez pour commencer la dictée';
}

async function scheduleLiveAnalysis() {
  if (liveAnalysisRunning) return;
  const apiKey = document.getElementById('cfgKey').value.trim();
  if (!apiKey) return;
  liveAnalysisRunning = true;
  liveLastAnalyzedLen = liveTranscriptFinal.length;
  try {
    const content = await callClaudeAPI(apiKey, buildCheckPrompt(liveTranscriptFinal));
    const answers = parseJsonSafe(content);
    applyAnswers(answers);
    const n = Object.keys(answeredQuestions).length;
    document.getElementById('micStatus').textContent =
      `🔴 Enregistrement... ${n} question${n > 1 ? 's' : ''} identifiée${n > 1 ? 's' : ''}`;
  } catch (_) {}
  liveAnalysisRunning = false;
  // Si du texte est arrivé pendant l'analyse, relancer
  if (liveTranscriptFinal.length - liveLastAnalyzedLen >= LIVE_CHUNK_SIZE) {
    scheduleLiveAnalysis();
  }
}

async function runAnalysisFromLive() {
  const text = document.getElementById('liveTranscript').value.trim();
  if (!text) { showToast('⚠ La transcription est vide — parlez d\'abord.'); return; }
  document.getElementById('micStatus').textContent = '🔄 Analyse finale par Claude...';
  await analyzeText(text, 'aProg', 'aProgFill', 'aStatus');
  document.getElementById('micStatus').textContent =
    `✓ Analyse terminée — ${Object.keys(answeredQuestions).length} questions identifiées`;
}

/* ═══════════════════════════════════════
   FILE HANDLING
   ═══════════════════════════════════════ */
function initDragDrop() {
  setupDropZone('pdfDropZone', f => processFile(f));
  setupDropZone('audioDropZone', f => processAudioFile(f));
  setupDropZone('uxpilotDropZone', f => processUxPilotFile(f));
}

function setupDropZone(id, handler) {
  const dz = document.getElementById(id);
  dz.addEventListener('dragenter', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragover', e => { e.preventDefault(); });
  dz.addEventListener('dragleave', () => { dz.classList.remove('dragover'); });
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handler(e.dataTransfer.files[0]);
  });
}

function handleFileSelect(input) {
  if (input.files && input.files.length > 0) processFile(input.files[0]);
}

async function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  loadedFileName = file.name;

  if (['txt','md','text'].includes(ext)) {
    loadedFileText = await file.text();
    showFileLoaded();
  } else if (ext === 'pdf') {
    setStatus('fStatus', '📖 Extraction du texte PDF...');
    try {
      loadedFileText = await extractPdfText(file);
      if (loadedFileText.trim().length < 20) {
        setStatus('fStatus', '⚠ Très peu de texte extrait. Le PDF est peut-être scanné (images).');
      }
      showFileLoaded();
    } catch (err) {
      setStatus('fStatus', '✕ Erreur lecture PDF: ' + err.message);
    }
  } else {
    setStatus('fStatus', '✕ Format non supporté: .' + ext);
  }
}

async function extractPdfText(file) {
  // Load pdf.js from CDN
  if (!window.pdfjsLib) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function showFileLoaded() {
  document.getElementById('pdfDropZone').style.display = 'none';
  document.getElementById('fileLoaded').style.display = 'flex';
  document.getElementById('loadedFileName').textContent = loadedFileName;
  const chars = loadedFileText.length;
  document.getElementById('loadedFileMeta').textContent = `${chars.toLocaleString()} caractères extraits — Prêt pour analyse`;
  document.getElementById('analyzeBtn').disabled = false;
  setStatus('fStatus', '');
}

function clearFile() {
  loadedFileText = ''; loadedFileName = '';
  document.getElementById('pdfDropZone').style.display = 'block';
  document.getElementById('fileLoaded').style.display = 'none';
  document.getElementById('analyzeBtn').disabled = true;
  setStatus('fStatus', '');
  document.getElementById('filePicker').value = '';
}

/* ═══════════════════════════════════════
   UX-PILOT JSON IMPORT
   ═══════════════════════════════════════ */

function handleUxPilotSelect(input) {
  if (input.files && input.files.length > 0) processUxPilotFile(input.files[0]);
}

async function processUxPilotFile(file) {
  if (!file.name.toLowerCase().endsWith('.json')) {
    setStatus('uxStatus', '✕ Seuls les fichiers .json sont acceptés.');
    return;
  }
  setStatus('uxStatus', '🔄 Lecture du fichier...');
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    uxPilotData = normalizeUxPilotJson(raw);
    showUxPilotSummary(file.name);
  } catch (e) {
    setStatus('uxStatus', '✕ JSON invalide : ' + e.message.substring(0, 80));
    uxPilotData = null;
  }
}

// Normalise n'importe quel export JSON UX en structure connue
function normalizeUxPilotJson(raw) {
  function pick(obj, ...keys) {
    for (const k of keys) {
      if (obj && obj[k] != null && obj[k] !== '') return obj[k];
    }
    return null;
  }
  function toArr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'object') return Object.values(v);
    return [];
  }
  // Tente de déplier un wrapper de premier niveau (ex: { "data": {...} })
  const topKeys = Object.keys(raw);
  const unwrapped = (topKeys.length === 1 && typeof raw[topKeys[0]] === 'object' && !Array.isArray(raw[topKeys[0]]))
    ? raw[topKeys[0]] : raw;

  const proj = pick(unwrapped, 'project', 'meta', 'metadata', 'info', 'project_info') || {};

  return {
    projectName: pick(unwrapped, 'name', 'title', 'project_name', 'projectName')
               || pick(proj, 'name', 'title', 'project_name') || '',
    projectDescription: pick(unwrapped, 'description', 'summary', 'overview', 'brief', 'goal')
                      || pick(proj, 'description', 'summary', 'overview', 'brief') || '',
    objectives: toArr(pick(unwrapped, 'objectives', 'goals', 'business_goals', 'project_goals', 'kpis', 'success_metrics')
              || pick(proj, 'objectives', 'goals', 'business_goals')),
    personas: toArr(pick(unwrapped, 'personas', 'users', 'user_personas', 'target_users', 'audience',
                         'user_types', 'stakeholders', 'archetypes')),
    userStories: toArr(pick(unwrapped, 'user_stories', 'userStories', 'stories', 'features',
                            'epics', 'feature_list', 'requirements_list', 'tasks')),
    userFlows: toArr(pick(unwrapped, 'user_flows', 'userFlows', 'flows', 'journeys',
                          'user_journeys', 'task_flows', 'workflows', 'scenarios')),
    screens: toArr(pick(unwrapped, 'screens', 'wireframes', 'pages', 'views', 'mockups',
                        'frames', 'artboards', 'designs', 'ui_screens', 'layouts')),
    painPoints: toArr(pick(unwrapped, 'pain_points', 'painPoints', 'problems', 'issues',
                           'challenges', 'insights', 'research_insights', 'findings',
                           'observations', 'frustrations', 'barriers')),
    requirements: toArr(pick(unwrapped, 'requirements', 'functional_requirements', 'specs',
                             'specifications', 'acceptance_criteria', 'nfr', 'must_have')),
    designSystem: pick(unwrapped, 'design_system', 'designSystem', 'design', 'styles', 'tokens', 'theme') || null,
    sitemap: toArr(pick(unwrapped, 'sitemap', 'navigation', 'structure', 'information_architecture', 'ia', 'site_map')),
    constraints: toArr(pick(unwrapped, 'constraints', 'limitations', 'technical_constraints',
                            'non_functional_requirements', 'nfr', 'technical_requirements')),
  };
}

// Extrait le texte d'une valeur (string, objet, etc.)
function extractText(obj, ...preferredKeys) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj.trim();
  if (typeof obj === 'number') return String(obj);
  const allKeys = preferredKeys.length > 0
    ? [...preferredKeys, 'title', 'name', 'label', 'text', 'description', 'value', 'content', 'summary', 'body', 'story']
    : ['title', 'name', 'label', 'text', 'description', 'value', 'content', 'summary', 'body', 'story'];
  for (const k of allKeys) {
    if (obj[k] && typeof obj[k] === 'string' && obj[k].trim()) return obj[k].trim();
  }
  const firstStr = Object.values(obj).find(v => typeof v === 'string' && v.trim());
  return firstStr ? firstStr.trim() : '';
}

// Formate une user story sous forme lisible
function formatUserStory(s) {
  if (typeof s === 'string') return s.trim();
  const who = s.as_a || s.as_an || s.role || s.user || s.actor || '';
  const what = s.i_want || s.want || s.action || s.need || s.feature || '';
  const why  = s.so_that || s.benefit || s.goal || s.reason || '';
  if (who && what) {
    return `En tant que ${who}, je veux ${what}${why ? ' afin de ' + why : ''}`;
  }
  return extractText(s, 'title', 'name', 'description', 'story', 'content', 'requirement');
}

function showUxPilotSummary(filename) {
  document.getElementById('uxpilotDropZone').style.display = 'none';
  document.getElementById('uxpilotHint').style.display = 'none';
  document.getElementById('uxpilotLoaded').style.display = 'block';
  document.getElementById('uxpilotFileName').textContent = filename;

  const d = uxPilotData;
  const chips = [
    d.projectName                 ? { label: d.projectName.substring(0, 30),     cls: '' }  : null,
    d.personas.length > 0         ? { label: d.personas.length + ' persona' + (d.personas.length > 1 ? 's' : ''),         cls: 'ok' } : null,
    d.userStories.length > 0      ? { label: d.userStories.length + ' user stor' + (d.userStories.length > 1 ? 'ies' : 'y'), cls: 'ok' } : null,
    d.screens.length > 0          ? { label: d.screens.length + ' écran' + (d.screens.length > 1 ? 's' : ''),            cls: 'ok' } : null,
    d.userFlows.length > 0        ? { label: d.userFlows.length + ' flux',                                                cls: 'ok' } : null,
    d.painPoints.length > 0       ? { label: d.painPoints.length + ' insight' + (d.painPoints.length > 1 ? 's' : ''),    cls: 'ok' } : null,
    d.requirements.length > 0     ? { label: d.requirements.length + ' exigence' + (d.requirements.length > 1 ? 's' : ''), cls: 'ok' } : null,
    d.objectives.length > 0       ? { label: d.objectives.length + ' objectif' + (d.objectives.length > 1 ? 's' : ''),   cls: 'ok' } : null,
  ].filter(Boolean);

  document.getElementById('uxpilotSummary').innerHTML = chips.map(c =>
    `<span class="uxp-chip ${c.cls}">${esc(c.label)}</span>`
  ).join('');
  setStatus('uxStatus', '');
}

function clearUxPilot() {
  uxPilotData = null;
  document.getElementById('uxpilotDropZone').style.display = 'flex';
  document.getElementById('uxpilotHint').style.display = 'block';
  document.getElementById('uxpilotLoaded').style.display = 'none';
  document.getElementById('uxpilotSummary').innerHTML = '';
  setStatus('uxStatus', '');
  document.getElementById('uxpilotPicker').value = '';
}

function applyUxPilotToQuestionnaire() {
  if (!uxPilotData) return;
  const d = uxPilotData;
  const answers = {};

  // 1.1 Demande initiale
  const proj = [d.projectName, d.projectDescription].filter(Boolean).join(' — ');
  if (proj) answers['1.1'] = proj.substring(0, 100);

  // 1.2 Livrable attendu — noms des écrans
  const screenNames = d.screens.map(s => extractText(s, 'name', 'title', 'screen_name', 'label', 'page')).filter(Boolean);
  if (screenNames.length > 0) {
    answers['1.2'] = ('Application avec : ' + screenNames.slice(0, 4).join(', ')).substring(0, 100);
  }

  // 1.3 Formulation du problème
  if (d.projectName) answers['1.3'] = d.projectName.substring(0, 100);

  // 2.1 Déclencheur — premier pain point
  const firstPain = d.painPoints.length > 0
    ? extractText(d.painPoints[0], 'description', 'insight', 'finding', 'problem', 'observation', 'challenge') : '';
  if (firstPain) answers['2.1'] = firstPain.substring(0, 100);

  // 3.1 & 4.2 Objectifs / critères de succès
  const objectives = d.objectives.map(o => extractText(o, 'title', 'description', 'goal', 'kpi')).filter(Boolean);
  if (objectives.length > 0) {
    answers['3.1'] = objectives[0].substring(0, 100);
    answers['4.2'] = objectives.slice(0, 3).join(' · ').substring(0, 100);
  }

  // 4.1 Livrables — user stories
  if (d.userStories.length > 0) {
    const stories = d.userStories.slice(0, 3).map(s => formatUserStory(s)).filter(Boolean);
    if (stories.length > 0) answers['4.1'] = stories[0].substring(0, 100);
  }

  // 6.3 Utilisateurs — personas
  const personaNames = d.personas.map(p => extractText(p, 'name', 'role', 'title', 'type', 'persona_name')).filter(Boolean);
  if (personaNames.length > 0) answers['6.3'] = personaNames.join(', ').substring(0, 100);

  // 8.4 Contraintes techniques
  if (d.constraints.length > 0) {
    const c = extractText(d.constraints[0], 'description', 'constraint', 'limitation');
    if (c) answers['8.4'] = c.substring(0, 100);
  }

  // 9.4 Écart actuel / souhaité
  if (d.painPoints.length > 1) {
    const pains = d.painPoints.slice(0, 2).map(p => extractText(p, 'description', 'insight', 'problem')).filter(Boolean);
    if (pains.length > 0) answers['9.4'] = pains.join(' / ').substring(0, 100);
  }

  // 10.1 Pistes solutions — screens + requirements
  const reqTexts = d.requirements.slice(0, 3).map(r => extractText(r, 'description', 'requirement', 'title')).filter(Boolean);
  const solutionParts = [...(screenNames.length > 0 ? ['Écrans : ' + screenNames.slice(0, 3).join(', ')] : []), ...reqTexts];
  if (solutionParts.length > 0) answers['10.1'] = solutionParts.join(' · ').substring(0, 100);

  // 11.3 Phasage — flows suggest iterative
  if (d.userFlows.length > 0) {
    const flowNames = d.userFlows.map(f => extractText(f, 'name', 'title')).filter(Boolean).slice(0, 3);
    if (flowNames.length > 0) answers['11.3'] = ('Flux : ' + flowNames.join(', ')).substring(0, 100);
  }

  const n = Object.keys(answers).length;
  applyAnswers(answers);
  showToast(`✓ ${n} question${n > 1 ? 's' : ''} pré-remplie${n > 1 ? 's' : ''} depuis UX-Pilot`);
  goStep(1);
}

// Construit le contexte UX à injecter dans le system prompt
function buildUxPilotContext() {
  if (!uxPilotData) return '';
  const d = uxPilotData;
  const lines = [];

  if (d.projectName)        lines.push('PROJET UX : ' + d.projectName);
  if (d.projectDescription) lines.push('DESCRIPTION : ' + d.projectDescription);

  if (d.objectives.length > 0) {
    lines.push('OBJECTIFS :');
    d.objectives.forEach(o => { const t = extractText(o, 'title', 'description', 'goal'); if (t) lines.push('  - ' + t); });
  }
  if (d.personas.length > 0) {
    lines.push('PERSONAS UTILISATEURS :');
    d.personas.forEach(p => {
      const name   = extractText(p, 'name', 'role', 'title', 'type', 'persona_name');
      const goals  = extractText(p, 'goals', 'needs', 'objective', 'description', 'motivation', 'bio');
      const pains  = extractText(p, 'pain_points', 'frustrations', 'challenges', 'barriers');
      let line = '  - ' + name;
      if (goals) line += ' — Objectifs : ' + goals.substring(0, 80);
      if (pains) line += ' — Douleurs : ' + pains.substring(0, 80);
      lines.push(line);
    });
  }
  if (d.userStories.length > 0) {
    lines.push('USER STORIES / FONCTIONNALITÉS :');
    d.userStories.slice(0, 25).forEach(s => { const t = formatUserStory(s); if (t) lines.push('  - ' + t); });
    if (d.userStories.length > 25) lines.push('  ... et ' + (d.userStories.length - 25) + ' autres');
  }
  if (d.screens.length > 0) {
    lines.push('ÉCRANS / WIREFRAMES :');
    d.screens.forEach(s => {
      const name = extractText(s, 'name', 'title', 'screen_name', 'label', 'page');
      const desc = extractText(s, 'description', 'purpose', 'notes', 'content', 'summary');
      const comps = Array.isArray(s.components) ? s.components.map(c => extractText(c, 'type', 'name')).filter(Boolean) : [];
      let line = '  - ' + name;
      if (desc) line += ' : ' + desc.substring(0, 80);
      if (comps.length > 0) line += ' [' + comps.slice(0, 4).join(', ') + ']';
      lines.push(line);
    });
  }
  if (d.userFlows.length > 0) {
    lines.push('FLUX UTILISATEURS :');
    d.userFlows.forEach(f => {
      const name  = extractText(f, 'name', 'title', 'flow_name', 'label');
      const steps = Array.isArray(f.steps) ? f.steps.map(s => extractText(s, 'name', 'title', 'action', 'step')).filter(Boolean) : [];
      lines.push('  - ' + name + (steps.length > 0 ? ' : ' + steps.join(' → ') : ''));
    });
  }
  if (d.painPoints.length > 0) {
    lines.push('INSIGHTS UX / POINTS DE DOULEUR :');
    d.painPoints.slice(0, 10).forEach(p => {
      const t = extractText(p, 'description', 'insight', 'finding', 'problem', 'observation', 'challenge');
      if (t) lines.push('  - ' + t);
    });
  }
  if (d.requirements.length > 0) {
    lines.push('EXIGENCES FONCTIONNELLES :');
    d.requirements.slice(0, 20).forEach(r => {
      const t = extractText(r, 'description', 'requirement', 'title', 'name', 'spec');
      if (t) lines.push('  - ' + t);
    });
  }
  if (d.constraints.length > 0) {
    lines.push('CONTRAINTES :');
    d.constraints.forEach(c => { const t = extractText(c, 'description', 'constraint'); if (t) lines.push('  - ' + t); });
  }
  if (d.sitemap.length > 0) {
    lines.push('ARCHITECTURE DE L\'INFORMATION :');
    d.sitemap.slice(0, 10).forEach(s => { const t = extractText(s, 'name', 'title', 'section'); if (t) lines.push('  - ' + t); });
  }
  return lines.join('\n');
}

// Section UX dédiée au prompt Maquette (écrans + flows à reproduire)
function buildUxMockSection() {
  if (!uxPilotData) return '';
  const d = uxPilotData;
  const parts = [];
  if (d.screens.length > 0) {
    parts.push('\nÉCRANS À REPRÉSENTER DANS LA MAQUETTE (source UX-Pilot — à reproduire fidèlement) :');
    d.screens.forEach(s => {
      const name  = extractText(s, 'name', 'title', 'screen_name', 'label', 'page');
      const desc  = extractText(s, 'description', 'purpose', 'notes', 'content', 'summary');
      const comps = Array.isArray(s.components) ? s.components.map(c => extractText(c, 'type', 'name')).filter(Boolean) : [];
      let line = '  - ' + name;
      if (desc) line += ' : ' + desc.substring(0, 100);
      if (comps.length > 0) line += ' [composants : ' + comps.slice(0, 5).join(', ') + ']';
      parts.push(line);
    });
  }
  if (d.userFlows.length > 0) {
    parts.push('\nFLUX DE NAVIGATION À ILLUSTRER :');
    d.userFlows.slice(0, 5).forEach(f => {
      const name  = extractText(f, 'name', 'title');
      const steps = Array.isArray(f.steps) ? f.steps.map(s => extractText(s, 'name', 'title', 'action', 'step')).filter(Boolean) : [];
      parts.push('  - ' + name + (steps.length > 0 ? ' : ' + steps.join(' → ') : ''));
    });
  }
  if (d.personas.length > 0) {
    parts.push('\nPERSONAS (à mentionner dans la maquette comme utilisateurs type) :');
    d.personas.forEach(p => parts.push('  - ' + extractText(p, 'name', 'role', 'title')));
  }
  return parts.join('\n');
}

/* ═══════════════════════════════════════
   AUDIO HANDLING
   ═══════════════════════════════════════ */
const AUDIO_MEDIA_TYPES = {
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
  mp4: 'audio/mp4', ogg: 'audio/ogg', webm: 'audio/webm',
  aac: 'audio/aac', flac: 'audio/flac'
};
const AUDIO_MAX_MB = 25;

function handleAudioSelect(input) {
  if (input.files && input.files.length > 0) processAudioFile(input.files[0]);
}

async function processAudioFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const mediaType = AUDIO_MEDIA_TYPES[ext];
  if (!mediaType) {
    setStatus('aStatus', '✕ Format non supporté : .' + ext); return;
  }
  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB > AUDIO_MAX_MB) {
    setStatus('aStatus', `✕ Fichier trop lourd (${sizeMB.toFixed(1)} Mo). Maximum : ${AUDIO_MAX_MB} Mo.`); return;
  }

  setStatus('aStatus', '📖 Lecture du fichier audio...');
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    loadedAudioBase64 = btoa(binary);
    loadedAudioMediaType = mediaType;
    loadedAudioFileName = file.name;
    showAudioLoaded(sizeMB);
  } catch (err) {
    setStatus('aStatus', '✕ Erreur lecture : ' + err.message);
  }
}

function showAudioLoaded(sizeMB) {
  document.getElementById('audioDropZone').style.display = 'none';
  document.getElementById('audioLoaded').style.display = 'flex';
  document.getElementById('loadedAudioName').textContent = loadedAudioFileName;
  document.getElementById('loadedAudioMeta').textContent = `${sizeMB.toFixed(2)} Mo — Prêt pour transcription`;
  document.getElementById('transcribeBtn').disabled = false;
  setStatus('aStatus', '');
}

function clearAudio() {
  loadedAudioBase64 = ''; loadedAudioMediaType = ''; loadedAudioFileName = '';
  document.getElementById('audioDropZone').style.display = 'block';
  document.getElementById('audioLoaded').style.display = 'none';
  document.getElementById('transcribeBtn').disabled = true;
  setStatus('aStatus', '');
  document.getElementById('audioPicker').value = '';
}

async function runAnalysisFromAudio() {
  if (!loadedAudioBase64) return;
  const apiKey = document.getElementById('cfgKey').value.trim();
  if (!apiKey) { openConfig(); showToast('⚠ Veuillez saisir votre clé API Anthropic.'); return; }

  if (!questionDefs.blocs || questionDefs.blocs.length === 0) {
    setStatus('aStatus', '✕ Questionnaire non chargé — lancez via un serveur HTTP local.');
    return;
  }

  const prog = document.getElementById('aProg');
  const fill = document.getElementById('aProgFill');
  prog.classList.add('active');
  fill.style.width = '10%';
  setStatus('aStatus', '📥 Chargement modèle Whisper...');

  try {
    fill.style.width = '30%';
    const transcript = await transcribeAudioWithWhisper(loadedAudioBase64, loadedAudioMediaType);

    if (!transcript) {
      setStatus('aStatus', '✕ Transcription vide — le fichier audio est peut-être silencieux ou non supporté.');
      prog.classList.remove('active'); fill.style.width = '0%';
      return;
    }

    fill.style.width = '60%';
    setStatus('aStatus', '🔍 Analyse par Claude...');
    const content = await callClaudeAPI(apiKey, buildCheckPrompt(transcript));
    const answers = parseJsonSafe(content);
    applyAnswers(answers);
    fill.style.width = '100%';
    const n = Object.keys(answers).length;
    setStatus('aStatus', `✓ ${n} question${n > 1 ? 's' : ''} identifiée${n > 1 ? 's' : ''} depuis l'audio.`);
  } catch (err) {
    setStatus('aStatus', '✕ Erreur : ' + err.message);
  }
  setTimeout(() => { prog.classList.remove('active'); fill.style.width = '0%'; }, 2000);
}

/* ═══════════════════════════════════════
   ANALYSIS (text → check questions)
   ═══════════════════════════════════════ */
async function runAnalysis() {
  if (!loadedFileText) return;
  await analyzeText(loadedFileText, 'fProg', 'fProgFill', 'fStatus');
}

async function runAnalysisFromPaste() {
  const text = document.getElementById('pasteArea').value.trim();
  if (!text) { showToast('⚠ Veuillez coller du texte avant de lancer l\'analyse.'); return; }
  await analyzeText(text, 'fProg', 'fProgFill', 'fStatus');
}

function buildCheckPrompt(text) {
  const lines = [];
  if (questionDefs.blocs) {
    questionDefs.blocs.forEach(b => b.questions.forEach(q => lines.push(`${q.id} | ${q.texte}`)));
  }
  const maxChars = 60000;
  const inputText = text.length > maxChars ? text.substring(0, maxChars) + '\n[...tronqué]' : text;
  return `Tu analyses un texte pour identifier quelles questions de cadrage y sont répondues.

QUESTIONS (format "id | texte") :
${lines.join('\n')}

TEXTE :
"""
${inputText}
"""

Réponds UNIQUEMENT avec un JSON où chaque clé est l'id de la question et la valeur est la réponse extraite (max 100 caractères). N'inclure que les questions effectivement répondues.
Exemple : {"1.1": "Automatiser les rapports mensuels", "2.1": "Suite à un audit interne"}`;
}

async function analyzeText(text, progId = 'fProg', fillId = 'fProgFill', statusId = 'fStatus') {
  const apiKey = document.getElementById('cfgKey').value.trim();
  if (!apiKey) { openConfig(); showToast('⚠ Veuillez saisir votre clé API Anthropic.'); return; }
  if (!questionDefs.blocs || questionDefs.blocs.length === 0) {
    setStatus(statusId, '✕ Questionnaire non chargé — lancez via un serveur HTTP local (voir encart ci-dessous).');
    return;
  }

  const prog = document.getElementById(progId);
  const fill = document.getElementById(fillId);
  prog.classList.add('active');
  fill.style.width = '40%';
  setStatus(statusId, '🔄 Analyse par Claude...');
  appendLog(`Analyse texte — ${text.length.toLocaleString()} caractères`);

  try {
    const content = await callClaudeAPI(apiKey, buildCheckPrompt(text));
    const answers = parseJsonSafe(content);
    applyAnswers(answers);
    fill.style.width = '100%';
    const n = Object.keys(answers).length;
    setStatus(statusId, `✓ ${n} question${n > 1 ? 's' : ''} identifiée${n > 1 ? 's' : ''}. Vérifiez et complétez manuellement.`);
    appendLog(`Analyse terminée — ${n} question(s) identifiée(s)`, 'success');
  } catch (err) {
    setStatus(statusId, '✕ Erreur: ' + err.message);
    appendLog(`Erreur analyse : ${err.message}`, 'error');
  }
  setTimeout(() => { prog.classList.remove('active'); fill.style.width = '0%'; }, 2000);
}

/* ═══════════════════════════════════════
   QUESTIONNAIRE (blocs + cases à cocher)
   ═══════════════════════════════════════ */
function renderQuestionnaire() {
  if (!questionDefs.blocs) return;
  let html = '';
  questionDefs.blocs.forEach(bloc => {
    const n = bloc.questions.length;
    html += `<div class="q-bloc" id="bloc_${bloc.id}">
      <div class="q-bloc-hd" onclick="toggleBloc(${bloc.id})">
        <span class="q-bloc-icon">${bloc.icone}</span>
        <span class="q-bloc-title">${esc(bloc.titre)}</span>
        <span class="q-bloc-badge" id="bbadge_${bloc.id}">0/${n}</span>
        <span class="q-bloc-chev">▼</span>
      </div>
      <div class="q-bloc-body" id="bbody_${bloc.id}">
        ${bloc.questions.map(q => `
          <div class="q-item" id="qitem_${q.id.replace('.','_')}">
            <div class="q-cb" id="qcb_${q.id.replace('.','_')}" onclick="toggleManualCheck('${q.id}')"></div>
            <div class="q-item-content">
              <div class="q-item-text">${esc(q.texte)}</div>
              <div class="q-item-answer" id="qans_${q.id.replace('.','_')}"></div>
              <textarea class="q-manual-input" id="qmi_${q.id.replace('.','_')}"
                placeholder="Saisissez votre réponse..."
                oninput="onManualInput('${q.id}', this.value)"></textarea>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  });
  document.getElementById('qBody').innerHTML = html;
}

function toggleBloc(id) {
  const body = document.getElementById('bbody_' + id);
  const hd   = body?.previousElementSibling;
  if (!body) return;
  body.classList.toggle('open');
  if (hd) hd.classList.toggle('open');
}

function toggleManualCheck(qid) {
  // En mode manuel, le clic sur la case focus le textarea de saisie
  const qBody = document.getElementById('qBody');
  if (qBody?.classList.contains('manual-mode')) {
    const ta = document.getElementById('qmi_' + qid.replace('.', '_'));
    if (ta) { ta.focus(); return; }
  }
  // Hors mode manuel : bascule simple cochée / décochée
  if (answeredQuestions[qid]) {
    delete answeredQuestions[qid];
    _setCheckUI(qid, false, '');
  } else {
    answeredQuestions[qid] = '✓ (coché manuellement)';
    _setCheckUI(qid, true, '✓ coché manuellement');
  }
  const blocId = parseInt(qid.split('.')[0]);
  updateBlocBadge(blocId);
  updateQProgress();
}

function applyAnswers(newAnswers) {
  Object.assign(answeredQuestions, newAnswers);
  questionDefs.blocs?.forEach(bloc => {
    let count = 0;
    bloc.questions.forEach(q => {
      if (answeredQuestions[q.id]) {
        _setCheckUI(q.id, true, answeredQuestions[q.id]);
        count++;
      }
    });
    _setBlocBadge(bloc, count);
    // Ouvre les blocs qui ont été remplis par l'IA
    if (count > 0) {
      const body = document.getElementById('bbody_' + bloc.id);
      const hd   = body?.previousElementSibling;
      if (body && !body.classList.contains('open')) {
        body.classList.add('open');
        if (hd) hd.classList.add('open');
      }
    }
  });
  updateQProgress();
}

function _setCheckUI(qid, checked, answerText) {
  const safeId = qid.replace('.', '_');
  const cb   = document.getElementById('qcb_'  + safeId);
  const ans  = document.getElementById('qans_' + safeId);
  const item = document.getElementById('qitem_'+ safeId);
  if (cb)   cb.className   = checked ? 'q-cb checked' : 'q-cb';
  if (item) item.className = checked ? 'q-item answered' : 'q-item';
  if (ans)  ans.textContent = checked ? answerText : '';
}

function _setBlocBadge(bloc, count) {
  const badge = document.getElementById('bbadge_' + bloc.id);
  if (!badge) return;
  badge.textContent = `${count}/${bloc.questions.length}`;
  badge.className = count === bloc.questions.length ? 'q-bloc-badge full'
                  : count > 0                       ? 'q-bloc-badge partial'
                  :                                   'q-bloc-badge';
}

function updateBlocBadge(blocId) {
  const bloc = questionDefs.blocs?.find(b => b.id === blocId);
  if (!bloc) return;
  const count = bloc.questions.filter(q => answeredQuestions[q.id]).length;
  _setBlocBadge(bloc, count);
}

function updateQProgress() {
  const total    = questionDefs.blocs?.reduce((s, b) => s + b.questions.length, 0) || 65;
  const answered = Object.keys(answeredQuestions).length;
  const pct      = total > 0 ? Math.round(answered / total * 100) : 0;
  const fill  = document.getElementById('qProgressFill');
  const label = document.getElementById('qProgressLabel');
  const badge = document.getElementById('qBadge');
  if (fill)  fill.style.width = pct + '%';
  if (label) label.textContent = `${answered} / ${total} (${pct}%)`;
  if (badge) {
    badge.textContent = `${answered} / ${total}`;
    badge.className   = pct === 100 ? 'badge ok' : answered > 0 ? 'badge' : 'badge';
  }
}

/* ═══════════════════════════════════════
   GENERATION
   ═══════════════════════════════════════ */
async function generateCadrage() {
  const apiKey = document.getElementById('cfgKey').value.trim();
  if (!apiKey) { openConfig(); showToast('⚠ Veuillez saisir votre clé API Anthropic.'); return; }

  const questionnaire = {};
  if (questionDefs.blocs) {
    questionDefs.blocs.forEach(bloc => {
      const blocData = {};
      bloc.questions.forEach(q => {
        if (answeredQuestions[q.id]) blocData[q.texte] = answeredQuestions[q.id];
      });
      if (Object.keys(blocData).length > 0) questionnaire[bloc.titre] = blocData;
    });
  }

  const filledCount = Object.keys(answeredQuestions).length;
  if (filledCount === 0) {
    showToast('⚠ Veuillez répondre à au moins une question avant de générer.'); return;
  }

  goStep(2);
  clearLogs();
  appendLog(`Génération lancée — ${filledCount} question(s) renseignée(s)`);
  genDone = 0;
  lastSynthHtml = ''; lastMockHtml = ''; lastCadrageHtml = '';

  document.getElementById('genStatusCard').style.display = 'block';
  document.getElementById('genStatusBadge').textContent = '0 / 3';
  document.getElementById('genStatusBadge').className = 'badge';
  setGenStatus('Synth', 'pending', '<span class="spinner"></span> Appel API...', true);
  setGenStatus('Mock', 'pending', '<span class="spinner"></span> Appel API...', true);
  setGenStatus('Cadrage', 'pending', '<span class="spinner"></span> Appel API...', true);

  writeToFrame('synthFrame', loadingPage('Synthèse'));
  writeToFrame('mockFrame', loadingPage('Maquette'));
  writeToFrame('cadrageFrame', loadingPage('Pré-cadrage'));

  const extraCtx = document.getElementById('cfgContext').value.trim();
  const activeAgents = getActiveAgentsPayload();
  const agentNames = Object.keys(activeAgents);
  const agentList = agentNames.length > 0 ? agentNames.join(', ') : 'aucun agent activé';

  const designCtx = designMdContent.trim();
  const brandName = document.getElementById('cfgBrandName').value.trim();

  const uxCtx = buildUxPilotContext();

  const systemCtx = `Tu es un collectif d'experts en cadrage de projets d'innovation (${agentList}). Tu produis des livrables de cadrage ultra-structurés.

EXPERTS MOBILISÉS :
${JSON.stringify(activeAgents, null, 2)}
${extraCtx ? '\nContexte additionnel : ' + extraCtx : ''}
${uxCtx ? '\nDONNÉES UX-PILOT (analyse UX en amont du développement — source de vérité pour la maquette et les exigences) :\n' + uxCtx : ''}

QUESTIONNAIRE :
${JSON.stringify(questionnaire)}`;

  // Launch 3 calls in parallel
  genDeliverable(apiKey, systemCtx, buildSynthPrompt(systemCtx, designCtx, brandName), 'synth', 'synthFrame', 'Synth');
  genDeliverable(apiKey, systemCtx, buildMockPrompt(systemCtx, designCtx, brandName), 'mock', 'mockFrame', 'Mock');
  genDeliverable(apiKey, systemCtx, buildCadragePrompt(systemCtx, designCtx, brandName), 'cadrage', 'cadrageFrame', 'Cadrage');
}

async function genDeliverable(apiKey, systemCtx, prompt, key, frameId, statusKey) {
  const startTime = Date.now();
  let lastUpdate = 0;
  const labels = { synth: 'Synthèse', mock: 'Maquette', cadrage: 'Pré-cadrage' };
  const label  = labels[key] || key;

  appendLog(`Démarrage livrable "${label}"`);

  try {
    const content = await callClaudeAPI(apiKey, prompt, (approxTokens) => {
      const now = Date.now();
      if (now - lastUpdate < 400) return; // throttle DOM updates to every 400ms
      lastUpdate = now;
      const secs = Math.round((now - startTime) / 1000);
      setGenStatus(statusKey, 'pending',
        `<span class="spinner"></span> ${approxTokens.toLocaleString()} tokens… (${secs}s)`, true);
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const html = cleanHtmlOutput(content);
    if (key === 'synth') lastSynthHtml = html;
    else if (key === 'mock') lastMockHtml = html;
    else lastCadrageHtml = html;

    if (html.length > 0) {
      writeToFrame(frameId, html);
      autoResizeFrame(frameId);
      const approxTokens = Math.round(content.length / 4);
      setGenStatus(statusKey, 'done', `✓ Terminé — ${approxTokens.toLocaleString()} tokens · ${elapsed}s`);
      appendLog(`"${label}" généré — ${approxTokens.toLocaleString()} tokens · ${elapsed}s`, 'success');
    } else {
      setGenStatus(statusKey, 'error', '⚠ Contenu vide');
      appendLog(`"${label}" : contenu vide reçu`, 'warn');
    }
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const msg = err.name === 'AbortError' ? 'Inactivité réseau (60s)' : err.message.substring(0, 60);
    setGenStatus(statusKey, 'error', `✕ ${msg} (${elapsed}s)`);
    writeToFrame(frameId, errorPage(err.message));
    appendLog(`Erreur "${label}" (${elapsed}s) : ${err.message.substring(0, 100)}`, 'error');
  }
  onGenPartDone();
}

function setGenStatus(key, cls, content, isHtml = false) {
  const el = document.getElementById('genStatus' + key);
  el.className = 'gi-status ' + cls;
  if (isHtml) el.innerHTML = content;
  else el.textContent = content;
}

function onGenPartDone() {
  genDone++;
  document.getElementById('genStatusBadge').textContent = genDone + ' / 3';
  if (genDone >= 3) {
    document.getElementById('genStatusBadge').className = 'badge ok';
  }
}

/* ═══════════════════════════════════════
   PROMPTS
   ═══════════════════════════════════════ */
function buildSynthPrompt(ctx, designCtx, brandName) {
  const designSection = designCtx
    ? `\n\nIDENTITÉ DE MARQUE (respecter impérativement) :\n${designCtx}`
    : '\n\n- Design sobre : fond blanc, police sans-serif, couleurs neutres (bleu #0088CE, accent #DC582A)';
  return ctx + `\n\nLIVRABLE 1 - SYNTHESE STRUCTUREE
Génère un document HTML complet et autonome (avec <style> intégré) qui reformule la demande métier.

RÈGLES :
- Très chiffré, peu de texte, phrases courtes
- Sous-titre = verbatim de la douleur métier (citation directe du demandeur)
- Sections obligatoires :
  1. BESOIN - reformulation 2-3 lignes
  2. SOLUTION ENVISAGÉE - description factuelle
  3. SCÉNARIOS CHIFFRÉS - tableau 3 colonnes Baseline / MVP / Scale avec coût, délai, gains, volumétrie
  4. SWOT - matrice Forces/Faiblesses/Opportunités/Menaces (max 10 mots chacune)
  5. ÉTAPES - roadmap 4-6 jalons avec dates indicatives
  6. CE QUE VOUS POUVEZ METTRE - moyens métier + coûts estimés par scénario

- Priorité chiffres : temps, gains, coûts, volumétrie${designSection}
- HTML complet (doctype, head, body) prêt à l'affichage

Réponds UNIQUEMENT avec le code HTML complet, sans markdown, sans \`\`\`html.`;
}

function buildMockPrompt(ctx, designCtx, brandName) {
  const appName = brandName || 'CLARITY';
  const designSection = designCtx
    ? `\nIDENTITÉ DE MARQUE (respecter impérativement pour tous les choix visuels — couleurs, typo, ton, composants) :\n${designCtx}\n`
    : `\n- Palette : fond #F0F1F4, surfaces blanches, titres bleu #0088CE, accents #DC582A, texte #3C3732\n- Police system sans-serif (Segoe UI, Arial)\n`;
  const uxSection = buildUxMockSection();
  const hasUxScreens = uxPilotData && uxPilotData.screens.length > 0;
  return ctx + `\n\nLIVRABLE 2 - MAQUETTE / PROTOTYPE VISUEL DE L'APPLICATION
À partir du besoin métier décrit dans le questionnaire${uxSection ? ' et des données UX-Pilot fournies' : ''}, génère une MAQUETTE HTML de ce à quoi l'application ou la webapp demandée POURRAIT RESSEMBLER une fois réalisée.

CE QUE TU DOIS FAIRE :
- Créer un PROTOTYPE VISUEL HAUTE FIDÉLITÉ (mockup interactif) de l'interface utilisateur
- EXIGENCE ABSOLUE DE QUALITÉ : le rendu doit être IMPRESSIONNANT — comme une démo produit devant des décideurs, pas un wireframe
- Inventer des données fictives réalistes et cohérentes pour remplir TOUS les écrans (noms, chiffres, statuts, tableaux de bord...)
${hasUxScreens ? '- PRIORITÉ ABSOLUE : représenter chaque écran identifié dans la section UX-Pilot ci-dessous, avec navigation fonctionnelle entre eux' : '- Imaginer et implémenter les écrans principaux navigables : dashboard, formulaires, listes, tableaux, indicateurs, vue détail'}
- Chaque écran doit être REMPLI de données fictives réalistes (noms, chiffres, statuts, graphiques SVG, badges, KPIs...)
${uxSection}
INTERACTIVITÉ OBLIGATOIRE (boutons fonctionnels) :
- Implémenter la navigation entre écrans en JavaScript pur (SPA-like : cacher/montrer les sections via show/hide)
- Les boutons de navigation, onglets et liens DOIVENT fonctionner et changer la vue affichée
- Les formulaires doivent avoir de vrais champs interactifs (focus, hover, inputs, selects)
- Les lignes de listes/tableaux doivent être cliquables et ouvrir une vue détail
- Ajouter des micro-interactions : hover states, transitions CSS (0.2s ease), états actifs visuels
- Au moins 2-3 modales, dropdowns ou tooltips selon le contexte métier

RÈGLES DE DESIGN (qualité premium, SaaS B2B) :
- Page HTML RESPONSIVE et autonome (doctype, head avec <style> intégré, body) — PAS de taille fixe en pixels, utiliser 100vw/100vh et media queries
- Design épuré, moderne, ultra-professionnel — qualité comparable à Notion, Linear ou un outil SaaS B2B
${designSection}- Layout CSS Grid + Flexbox : sidebar fixe (240px), header sticky (56px), zone contenu scrollable
- Ombres subtiles (box-shadow: 0 1px 3px rgba(0,0,0,0.1)), border-radius cohérents (6-8px), espacements généreux (16-24px)
- Icônes Unicode enrichies, badges colorés pour statuts, sparklines SVG pour tendances et métriques
- Typographie hiérarchique : 3 niveaux de taille minimum, poids variés (400/500/700), line-height lisible
- Couleurs sémantiques d'état : vert #22c55e succès, orange #f59e0b avertissement, rouge #ef4444 alerte, bleu info
- Footer discret : 'Maquette générée par ${appName} — Données fictives à titre illustratif'

IMPORTANT : Ce n'est PAS un résumé du cadrage. C'est un PROTOTYPE INTERACTIF qui doit donner envie de construire le vrai produit. Un décideur doit pouvoir naviguer dedans, cliquer, et comprendre immédiatement la valeur de la solution.

Réponds UNIQUEMENT avec le code HTML complet, sans markdown, sans \`\`\`html.`;
}

function buildCadragePrompt(ctx, designCtx, brandName) {
  const appName = brandName || 'CLARITY';
  const designSection = designCtx
    ? `\n\nIDENTITÉ DE MARQUE (respecter impérativement pour couleurs, typographie et ton éditorial du document) :\n${designCtx}\n`
    : `\n\n- Design sobre, lisible, imprimable : fond blanc, titres bleu #0088CE, tags orange #DC582A\n`;
  return ctx + `\n\nLIVRABLE 3 - PREMIERS ÉLÉMENTS DE CADRAGE TECHNIQUE
Ce document est un PRÉ-CAHIER DES CHARGES que la personne qui cadre le projet va CONSERVER et utiliser comme SUPPORT DE TRAVAIL pour aller ensuite échanger avec les véritables experts humains (UX designer, architecte technique, financier, juridique, etc.).

CE QUE TU DOIS PRODUIRE :
Un document HTML structuré, dense et actionnable, organisé en sections claires :

1. CONTEXTE ET PÉRIMÈTRE - Reformulation précise du besoin, Périmètre IN/OUT (tableau 2 colonnes), Utilisateurs cibles
2. EXIGENCES FONCTIONNELLES - Liste numérotée (EF-001, EF-002...) avec description, priorité (Must/Should/Could), complexité (S/M/L/XL)
3. EXIGENCES NON FONCTIONNELLES - Performance, Sécurité, Disponibilité, Accessibilité, Compatibilité
4. ARCHITECTURE ET INTÉGRATION (HYPOTHÈSES) - Type d'architecture, Intégrations SI, Contraintes techniques
5. DONNÉES ET RGPD - Types de données, Données personnelles, Conservation, Points DPO
6. QUESTIONS OUVERTES POUR LES EXPERTS - Tableau 3 colonnes : Question | Expert concerné | Criticité (au moins 8-12 questions)
7. ESTIMATION MACRO - Fourchette de charge, Planning macro, Budget indicatif

RÈGLES ÉDITORIALES :
- Ton professionnel mais direct
- Privilégier les tableaux et listes structurées
- Chaque élément incertain porte un tag visible : 'À VALIDER', 'À CONFIRMER', 'HYPOTHÈSE'
- Header : 'PREMIERS ÉLÉMENTS DE CADRAGE — [NOM DU PROJET]' + date + mention '${appName} — Document de travail'
- Footer : 'Ce document est un pré-cadrage généré par IA. Il doit être confronté aux experts métier avant toute décision.'
${designSection}
RÈGLES TECHNIQUES :
- Page HTML complète et autonome (doctype, head avec <style> intégré, body)
- Les tags 'À VALIDER' en <span> avec fond coloré selon l'identité de marque, bold

Réponds UNIQUEMENT avec le code HTML complet, sans markdown, sans \`\`\`html.`;
}

/* ═══════════════════════════════════════
   JOURNAL / LOG PANEL
   ═══════════════════════════════════════ */
let _logCount = 0;
let _logCollapsed = false;

function appendLog(msg, level = 'info') {
  _logCount++;
  const now = new Date();
  const ts = now.toTimeString().slice(0, 8);
  // Mirror systématique vers la console DevTools
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(`[CadrageExpress][${ts}] ${msg}`);
  const el = document.getElementById('logContainer');
  if (!el) return;

  // Rendre le panneau visible dès le premier log
  const card = document.getElementById('logCard');
  if (card) card.style.display = 'block';

  const colors  = { info: '#94a3b8', success: '#4ade80', warn: '#fbbf24', error: '#f87171' };
  const prefixes = { info: '   ', success: '✓  ', warn: '⚠  ', error: '✕  ' };

  const line = document.createElement('div');
  line.style.cssText = `color:${colors[level] || colors.info};white-space:pre-wrap;word-break:break-all;`;
  line.textContent = `[${ts}] ${prefixes[level] || '   '}${msg}`;
  el.appendChild(line);

  if (!_logCollapsed) el.scrollTop = el.scrollHeight;

  const countEl = document.getElementById('logCount');
  if (countEl) countEl.textContent = `(${_logCount})`;
}

function clearLogs() {
  _logCount = 0;
  const el = document.getElementById('logContainer');
  if (el) el.innerHTML = '';
  const countEl = document.getElementById('logCount');
  if (countEl) countEl.textContent = '';
}

function toggleLogPanel() {
  _logCollapsed = !_logCollapsed;
  const body    = document.getElementById('logBody');
  const chevron = document.getElementById('logChevron');
  if (body)    body.style.display = _logCollapsed ? 'none' : '';
  if (chevron) chevron.style.transform = _logCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
}

/* ═══════════════════════════════════════
   CLAUDE API
   ═══════════════════════════════════════ */
async function callClaudeAPI(apiKey, userPrompt, onProgress = null) {
  const model = document.getElementById('cfgModel').value.trim() || 'claude-sonnet-4-6';
  const maxTokens = parseInt(document.getElementById('cfgMaxTokens').value) || 8192;

  appendLog(`→ ${model} · max ${maxTokens.toLocaleString()} tokens · prompt ${Math.round(userPrompt.length / 4).toLocaleString()} tok. estimés`);

  const controller = new AbortController();

  // Timeout d'inactivité : abort si aucun token reçu pendant INACTIVITY_MS
  // (reset à chaque token → on n'arrête jamais un stream actif)
  const INACTIVITY_MS = 60_000;   // 60 s sans token = connexion morte
  const ABSOLUTE_MS   = 600_000;  // 10 min plafond absolu de sécurité
  let abortReason = 'inactivity';

  let inactivityId = setTimeout(() => { abortReason = 'inactivity'; controller.abort(); }, INACTIVITY_MS);
  const absoluteId  = setTimeout(() => { abortReason = 'absolute';  controller.abort(); }, ABSOLUTE_MS);

  const resetInactivity = () => {
    clearTimeout(inactivityId);
    inactivityId = setTimeout(() => { abortReason = 'inactivity'; controller.abort(); }, INACTIVITY_MS);
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      appendLog(`HTTP ${response.status} — ${errText.substring(0, 150)}`, 'error');
      throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
    }

    appendLog(`HTTP ${response.status} OK — streaming en cours…`, 'success');
    resetInactivity(); // premier token HTTP reçu, on repart de zéro

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let outputTokens = 0;
    let lastLogAt = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetInactivity(); // chaque chunk réseau reset le timer d'inactivité

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            fullText += evt.delta.text;
            if (onProgress) onProgress(Math.round(fullText.length / 4));
            // Log de progression toutes les 10 000 chars (~2 500 tokens)
            if (fullText.length - lastLogAt >= 10000) {
              lastLogAt = fullText.length;
              appendLog(`  streaming… ${Math.round(fullText.length / 4).toLocaleString()} tokens reçus`);
            }
          } else if (evt.type === 'message_delta' && evt.usage?.output_tokens) {
            outputTokens = evt.usage.output_tokens;
          }
        } catch { /* ignore JSON parse errors on malformed SSE events */ }
      }
    }

    if (fullText.length === 0) {
      appendLog('Réponse vide — structure inattendue', 'error');
      throw new Error('Réponse vide ou structure inattendue');
    }
    const finalTok = outputTokens > 0 ? outputTokens : Math.round(fullText.length / 4);
    appendLog(`Streaming terminé — ${finalTok.toLocaleString()} tokens output`, 'success');
    if (onProgress && outputTokens > 0) onProgress(outputTokens); // final call with real count
    return fullText;
  } catch (err) {
    if (err.name === 'AbortError') {
      const reason = abortReason === 'absolute'
        ? 'Plafond 10 min atteint'
        : 'Inactivité 60s — connexion interrompue';
      appendLog(reason, 'warn');
    } else if (err.message && !err.message.startsWith('HTTP')) {
      appendLog(`Exception réseau : ${err.message}`, 'error');
    }
    throw err;
  } finally {
    clearTimeout(inactivityId);
    clearTimeout(absoluteId);
  }
}

let _whisperPipeline = null;

async function transcribeAudioWithWhisper(audioBase64, mediaType) {
  if (!_whisperPipeline) {
    setStatus('aStatus', '📥 Chargement modèle Whisper (premier lancement ~60 Mo)...');
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    env.allowLocalModels = false;
    _whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback: (p) => {
        if (p.status === 'progress' || p.status === 'downloading') {
          setStatus('aStatus', `📥 Téléchargement modèle : ${Math.round(p.progress || 0)}%`);
        }
      }
    });
  }

  setStatus('aStatus', '🎙 Transcription en cours...');

  // Decode audio base64 → ArrayBuffer
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // Decode audio and resample to 16 kHz mono via OfflineAudioContext
  const tmpCtx = new AudioContext();
  let audioBuffer;
  try {
    audioBuffer = await tmpCtx.decodeAudioData(bytes.buffer.slice(0));
  } finally {
    tmpCtx.close();
  }

  const TARGET_RATE = 16000;
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * TARGET_RATE), TARGET_RATE);
  const src = offlineCtx.createBufferSource();
  src.buffer = audioBuffer;
  src.connect(offlineCtx.destination);
  src.start();
  const resampled = await offlineCtx.startRendering();
  const float32 = resampled.getChannelData(0);

  const result = await _whisperPipeline(float32, {
    language: 'french',
    task: 'transcribe',
    sampling_rate: TARGET_RATE,
    chunk_length_s: 30,
    stride_length_s: 5
  });

  return result.text.trim();
}

/* ═══════════════════════════════════════
   PRINT TRAME
   ═══════════════════════════════════════ */
function printTrame() {
  if (!questionDefs.blocs || questionDefs.blocs.length === 0) {
    showToast('⚠ Questionnaire non chargé — lancez via un serveur HTTP local.');
    return;
  }

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const borderColors = [
    '#4a90d9','#5cb85c','#f0ad4e','#d94a7a','#9b59b6',
    '#1abc9c','#e67e22','#3498db','#e74c3c','#2ecc71',
    '#8e44ad','#d35400','#2980b9','#c0392b','#27ae60'
  ];

  let rows = '';
  questionDefs.blocs.forEach((bloc, i) => {
    const color = borderColors[i % borderColors.length];
    const bg = color + '18';
    rows += `<div class="bloc">
      <div class="bh" style="background:${bg};border-left-color:${color};">${bloc.icone} ${bloc.id}. ${bloc.titre}</div>`;
    bloc.questions.forEach(q => {
      rows += `<div class="q"><span class="cb"></span><span class="qid">${q.id}</span><span class="qt">${q.texte}</span></div>`;
    });
    rows += `</div>`;
  });

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Trame de cadrage</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:7.5pt;color:#1a1a1a;background:#fff}
@page{size:A4 portrait;margin:10mm}
.ph{text-align:center;margin-bottom:4mm;padding-bottom:3mm;border-bottom:1.5pt solid #333}
.ph h1{font-size:11.5pt;font-weight:bold;letter-spacing:.3pt}
.ph .sub{font-size:7pt;color:#777;margin-top:1.5mm}
.cols{column-count:2;column-gap:5mm;column-rule:.5pt solid #d0d0d0}
.bloc{margin-bottom:2.5mm;break-inside:avoid}
.bh{font-weight:bold;font-size:7.5pt;padding:1mm 2mm;border-left:2.5pt solid;margin-bottom:.5mm;break-after:avoid}
.q{display:flex;align-items:flex-start;padding:.7mm 0 .7mm 1.5mm;border-bottom:.3pt dotted #ccc;break-inside:avoid;gap:1.5mm}
.cb{width:3.3mm;height:3.3mm;min-width:3.3mm;border:.7pt solid #999;display:inline-block;margin-top:.3mm;flex-shrink:0}
.qid{min-width:6mm;font-weight:bold;color:#777;font-size:6.5pt;padding-top:.2mm;white-space:nowrap;flex-shrink:0}
.qt{flex:1;line-height:1.35}
.pf{margin-top:3mm;text-align:center;font-size:6pt;color:#bbb;border-top:.5pt solid #e8e8e8;padding-top:2mm}
</style></head><body>
<div class="ph">
  <h1>🗂&nbsp; Trame de cadrage &mdash; Questions clés</h1>
  <div class="sub">65 questions &nbsp;&bull;&nbsp; 15 thèmes &nbsp;&bull;&nbsp; Imprimé le ${today} &nbsp;&bull;&nbsp; CLARITY</div>
</div>
<div class="cols">${rows}</div>
<div class="pf">CLARITY &mdash; trame de questions de cadrage métier &mdash; ${today}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) { showToast('⚠ Fenêtre bloquée — autorisez les popups pour ce site.'); return; }
  win.document.write(html);
  win.document.close();
}

/* ═══════════════════════════════════════
   UTILS
   ═══════════════════════════════════════ */
function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setStatus(id, msg) {
  document.getElementById(id).textContent = msg;
}

function parseJsonSafe(content) {
  try { return JSON.parse(content); } catch(e) {}
  // Try to extract JSON from the content
  const i = content.indexOf('{');
  const j = content.lastIndexOf('}');
  if (i !== -1 && j > i) {
    try { return JSON.parse(content.substring(i, j + 1)); } catch(e2) {}
  }
  return {};
}

function cleanHtmlOutput(content) {
  return content.replace(/^```html?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

function writeToFrame(frameId, html) {
  const iframe = document.getElementById(frameId);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

function autoResizeFrame(frameId) {
  setTimeout(() => {
    try {
      const iframe = document.getElementById(frameId);
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const h = Math.max(doc.body.scrollHeight || 0, doc.documentElement.scrollHeight || 0);
      if (h > 50) iframe.style.height = Math.min(h + 40, 2000) + 'px';
    } catch(e) {}
  }, 800);
}

function loadingPage(title) {
  return `<!DOCTYPE html><html><body style="font-family:'Avenir','Segoe UI',sans-serif;padding:60px;text-align:center;color:#9B9DA3;background:#fafbfc;">
    <div style="font-size:28px;margin-bottom:12px;">⚙</div>
    <p style="font-size:14px;font-weight:500;">Génération : ${title}</p>
    <p style="font-size:12px;">Appel API en cours, veuillez patienter...</p>
  </body></html>`;
}

function errorPage(msg) {
  return `<!DOCTYPE html><html><body style="font-family:'Avenir','Segoe UI',sans-serif;padding:40px;color:#DC582A;background:#fafbfc;">
    <h2 style="font-size:16px;">⚠ Erreur</h2>
    <p style="font-size:13px;color:#666;">${esc(msg)}</p>
  </body></html>`;
}

/* ═══════════════════════════════════════
   DELIVERABLE TABS
   ═══════════════════════════════════════ */
function switchDel(which) {
  ['Synth','Mock','Cadrage'].forEach(k => {
    const key = k.toLowerCase();
    document.getElementById('dt' + k).className = which === key ? 'del-tile active' : 'del-tile';
    document.getElementById('dp' + k).className = which === key ? 'del-pane visible' : 'del-pane';
    const dlEl = document.getElementById('dl' + k);
    if (dlEl) dlEl.style.display = which === key ? 'block' : 'none';
  });
}

/* ═══════════════════════════════════════
   DOWNLOAD
   ═══════════════════════════════════════ */
function downloadHtml(html, filename) {
  if (!html) { showToast('⚠ Aucun contenu à télécharger.'); return; }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 Fichier téléchargé');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg || '✓ OK';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
