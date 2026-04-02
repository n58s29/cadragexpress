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
async function init() {
  try {
    const res = await fetch('data/cadrage-questions.json');
    questionDefs = await res.json();
  } catch (e) {
    console.error('Impossible de charger cadrage-questions.json :', e);
  }
  renderQuestionnaire();
  renderAgentGrid();
  onModelChange();
  updateCfg();
  initDragDrop();
}
init();

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
        <button class="agent-edit-btn" onclick="toggleAgentEditor('${a.key}')">✎</button>
        <button class="agent-toggle ${a.enabled ? 'on' : ''}" id="at_${a.key}" onclick="toggleAgent('${a.key}')"></button>
      </div>
      <div class="agent-editor" id="ae_${a.key}">
        <textarea id="ap_${a.key}" oninput="updateAgentPrompt('${a.key}', this.value)">${esc(a.prompt)}</textarea>
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
function openConfig() { document.getElementById('configOverlay').classList.add('open'); }
function closeConfig() { document.getElementById('configOverlay').classList.remove('open'); updateCfg(); }
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
   STEPPER
   ═══════════════════════════════════════ */
function goStep(n) {
  curStep = n;
  ['stab1','stab2'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.className = 'step-tab' + (i+1 === n ? ' active' : (i+1 < n ? ' done' : ''));
  });
  [1,2].forEach(j => {
    document.getElementById('panel'+j).className = j === n ? 'panel visible' : 'panel';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════
   METHOD SWITCH
   ═══════════════════════════════════════ */
function switchMethod(m) {
  ['pdf','audio','paste','manual','live'].forEach(id => {
    document.getElementById('mb' + id.charAt(0).toUpperCase() + id.slice(1)).className =
      m === id ? 'method-btn active' : 'method-btn';
    document.getElementById('zone' + id.charAt(0).toUpperCase() + id.slice(1)).style.display =
      m === id ? 'block' : 'none';
  });
  if (m !== 'live') stopMic();
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
    alert('La reconnaissance vocale n\'est pas supportée par ce navigateur.\nUtilisez Chrome ou Edge.');
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
  document.getElementById('micBtn').classList.add('recording');
  document.getElementById('micBtn').textContent = '⏹';
  document.getElementById('micStatus').textContent = '🔴 Enregistrement en cours — parlez...';
}

function stopMic() {
  liveRecording = false;
  if (recognition) { try { recognition.stop(); } catch (_) {} recognition = null; }
  const btn = document.getElementById('micBtn');
  const status = document.getElementById('micStatus');
  if (!btn) return;
  btn.classList.remove('recording');
  btn.textContent = '🎤';
  status.textContent = liveTranscriptFinal
    ? '✓ Enregistrement terminé — vérifiez la transcription ci-dessous.'
    : 'Cliquez pour commencer la dictée';
  document.getElementById('liveInterim').textContent = '';
}

function clearLive() {
  stopMic();
  liveTranscriptFinal = '';
  document.getElementById('liveTranscript').value = '';
  document.getElementById('micStatus').textContent = 'Cliquez pour commencer la dictée';
}

function runAnalysisFromLive() {
  const text = document.getElementById('liveTranscript').value.trim();
  if (!text) { alert('La transcription est vide. Parlez d\'abord !'); return; }
  // Bascule vers zonePaste pour réutiliser le flux d'analyse et la barre de progression
  switchMethod('paste');
  document.getElementById('pasteArea').value = text;
  runAnalysisFromPaste();
}

/* ═══════════════════════════════════════
   FILE HANDLING
   ═══════════════════════════════════════ */
function initDragDrop() {
  setupDropZone('pdfDropZone', f => processFile(f));
  setupDropZone('audioDropZone', f => processAudioFile(f));
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
  if (!apiKey) { openConfig(); alert('Veuillez saisir votre clé API Anthropic.'); return; }

  const prog = document.getElementById('aProg');
  const fill = document.getElementById('aProgFill');
  prog.classList.add('active');
  fill.style.width = '30%';
  setStatus('aStatus', '🎙 Transcription et analyse par Claude...');

  const prompt = `Tu es un expert en cadrage de projets d'innovation.
Voici un enregistrement audio (réunion, entretien métier ou expression de besoin).

Transcris l'audio puis extrais les informations pour remplir le questionnaire de cadrage.
Réponds UNIQUEMENT en JSON strict avec ces 7 clés.
Pour chaque clé, donne le texte extrait ou une chaîne vide si l'information est absente :
{"q1_projet":"","q2_contexte":"","q3_finalite":"","q4_resultats":"","q5_acteurs":"","q6_reseau":"","q7_enjeux":""}`;

  try {
    fill.style.width = '60%';
    const content = await callClaudeAPIWithAudio(apiKey, loadedAudioBase64, loadedAudioMediaType, prompt);
    const extracted = parseJsonSafe(content);

    const mapping = {
      q1: extracted.q1_projet || '',
      q2: extracted.q2_contexte || '',
      q3: extracted.q3_finalite || '',
      q4: extracted.q4_resultats || '',
      q5: extracted.q5_acteurs || '',
      q6: extracted.q6_reseau || '',
      q7: extracted.q7_enjeux || ''
    };

    for (const [id, val] of Object.entries(mapping)) {
      const el = document.getElementById(id);
      if (el) {
        el.value = val;
        el.className = el.className.replace(/ ?missing/g, '').replace(/ ?filled/g, '');
        if (val.trim()) el.classList.add('filled');
        else el.classList.add('missing');
      }
      const num = document.getElementById('qn_' + id);
      if (num) num.className = val.trim() ? 'qnum filled' : 'qnum warn';
    }

    questionDefs.forEach(q => {
      const qb = document.getElementById('qb_' + q.id);
      if (qb) qb.classList.add('open');
    });

    updateQBadge();
    fill.style.width = '100%';
    setStatus('aStatus', '✓ Questionnaire rempli depuis l\'audio. Vérifiez les champs en orange.');
  } catch (err) {
    setStatus('aStatus', '✕ Erreur : ' + err.message);
  }
  setTimeout(() => { prog.classList.remove('active'); fill.style.width = '0%'; }, 2000);
}

/* ═══════════════════════════════════════
   ANALYSIS (fill questionnaire from text)
   ═══════════════════════════════════════ */
async function runAnalysis() {
  if (!loadedFileText) return;
  await analyzeText(loadedFileText);
}

async function runAnalysisFromPaste() {
  const text = document.getElementById('pasteArea').value.trim();
  if (!text) { alert('Veuillez coller du texte avant de lancer l\'analyse.'); return; }
  await analyzeText(text);
}

async function analyzeText(text) {
  const apiKey = document.getElementById('cfgKey').value.trim();
  if (!apiKey) { openConfig(); alert('Veuillez saisir votre clé API Anthropic.'); return; }

  const prog = document.getElementById('fProg');
  const fill = document.getElementById('fProgFill');
  prog.classList.add('active');
  fill.style.width = '40%';
  setStatus('fStatus', '🔄 Analyse du texte par Claude...');

  // Truncate very long texts
  const maxChars = 80000;
  const inputText = text.length > maxChars ? text.substring(0, maxChars) + '\n[... texte tronqué]' : text;

  const prompt = `Tu es un expert en cadrage de projets d'innovation.
Voici la transcription / le compte-rendu d'un entretien métier :

"""${inputText}"""

Extrais les informations pour remplir le questionnaire de cadrage.
Réponds UNIQUEMENT en JSON strict avec ces 7 clés.
Pour chaque clé, donne le texte extrait ou une chaîne vide si l'information est absente :
{"q1_projet":"","q2_contexte":"","q3_finalite":"","q4_resultats":"","q5_acteurs":"","q6_reseau":"","q7_enjeux":""}`;

  try {
    const content = await callClaudeAPI(apiKey, prompt);
    const extracted = parseJsonSafe(content);

    const mapping = {
      q1: extracted.q1_projet || '',
      q2: extracted.q2_contexte || '',
      q3: extracted.q3_finalite || '',
      q4: extracted.q4_resultats || '',
      q5: extracted.q5_acteurs || '',
      q6: extracted.q6_reseau || '',
      q7: extracted.q7_enjeux || ''
    };

    for (const [id, val] of Object.entries(mapping)) {
      const el = document.getElementById(id);
      if (el) {
        el.value = val;
        el.className = el.className.replace(/ ?missing/g, '').replace(/ ?filled/g, '');
        if (val.trim()) el.classList.add('filled');
        else el.classList.add('missing');
      }
      const num = document.getElementById('qn_' + id);
      if (num) num.className = val.trim() ? 'qnum filled' : 'qnum warn';
    }

    // Open all questions
    questionDefs.forEach(q => {
      const qb = document.getElementById('qb_' + q.id);
      if (qb) qb.classList.add('open');
    });

    updateQBadge();
    fill.style.width = '100%';
    setStatus('fStatus', '✓ Questionnaire rempli. Vérifiez les champs en orange (informations absentes).');
  } catch (err) {
    setStatus('fStatus', '✕ Erreur: ' + err.message);
  }
  setTimeout(() => { prog.classList.remove('active'); fill.style.width = '0%'; }, 2000);
}

/* ═══════════════════════════════════════
   QUESTIONNAIRE
   ═══════════════════════════════════════ */
function renderQuestionnaire() {
  let html = '';
  questionDefs.forEach((q, i) => {
    const field = q.tag === 'textarea'
      ? `<textarea class="ftextarea" id="${q.id}" placeholder="${esc(q.ph)}" oninput="onQInput('${q.id}')"></textarea>`
      : `<input class="finput" id="${q.id}" placeholder="${esc(q.ph)}" oninput="onQInput('${q.id}')"/>`;

    html += `<div class="qs">
      <div class="qh" onclick="toggleQ('${q.id}')">
        <span class="qnum" id="qn_${q.id}">${i+1}</span>
        <div><div class="qtitle">${esc(q.title)}</div><div class="qsub">${esc(q.sub)}</div></div>
        <span class="qchev" id="qc_${q.id}">▼</span>
      </div>
      <div class="qbody" id="qb_${q.id}">
        <div class="fgroup">${field}<div class="fhint">${esc(q.hint)}</div></div>
      </div>
    </div>`;
  });
  document.getElementById('qBody').innerHTML = html;
}

function toggleQ(id) {
  const body = document.getElementById('qb_' + id);
  const chev = document.getElementById('qc_' + id);
  if (!body) return;
  body.classList.toggle('open');
  if (chev) chev.textContent = body.classList.contains('open') ? '▲' : '▼';
}

function onQInput(id) {
  const el = document.getElementById(id);
  const num = document.getElementById('qn_' + id);
  if (!el) return;
  el.classList.remove('missing', 'filled');
  if (el.value.trim()) el.classList.add('filled');
  if (num) num.className = el.value.trim() ? 'qnum filled' : 'qnum';
  updateQBadge();
}

function updateQBadge() {
  let count = 0;
  questionDefs.forEach(q => {
    const el = document.getElementById(q.id);
    if (el && el.value.trim()) count++;
  });
  const b = document.getElementById('qBadge');
  b.textContent = count + ' / 7';
  b.className = count === 7 ? 'badge ok' : 'badge';
}

/* ═══════════════════════════════════════
   GENERATION
   ═══════════════════════════════════════ */
async function generateCadrage() {
  const apiKey = document.getElementById('cfgKey').value.trim();
  if (!apiKey) { openConfig(); alert('Veuillez saisir votre clé API Anthropic.'); return; }

  const questionnaire = {};
  questionDefs.forEach(q => {
    const el = document.getElementById(q.id);
    questionnaire[q.id] = el ? el.value.trim() : '';
  });

  const filledCount = Object.values(questionnaire).filter(v => v).length;
  if (filledCount === 0) {
    alert('Veuillez remplir au moins une question avant de générer.'); return;
  }

  goStep(2);
  genDone = 0;
  lastSynthHtml = ''; lastMockHtml = ''; lastCadrageHtml = '';

  document.getElementById('genStatusCard').style.display = 'block';
  document.getElementById('genStatusBadge').textContent = '0 / 3';
  document.getElementById('genStatusBadge').className = 'badge';
  setGenStatus('Synth', 'pending', '<span class="spinner"></span> Appel API...');
  setGenStatus('Mock', 'pending', '<span class="spinner"></span> Appel API...');
  setGenStatus('Cadrage', 'pending', '<span class="spinner"></span> Appel API...');

  writeToFrame('synthFrame', loadingPage('Synthèse'));
  writeToFrame('mockFrame', loadingPage('Maquette'));
  writeToFrame('cadrageFrame', loadingPage('Pré-cadrage'));

  const extraCtx = document.getElementById('cfgContext').value.trim();
  const activeAgents = getActiveAgentsPayload();
  const agentNames = Object.keys(activeAgents);
  const agentList = agentNames.length > 0 ? agentNames.join(', ') : 'aucun agent activé';

  const systemCtx = `Tu es un collectif d'experts en cadrage de projets d'innovation (${agentList}). Tu produis des livrables de cadrage ultra-structurés pour la SNCF / Fabrique de l'Adoption Numérique (FAN / 574).

EXPERTS MOBILISÉS :
${JSON.stringify(activeAgents, null, 2)}
${extraCtx ? '\nContexte additionnel : ' + extraCtx : ''}

QUESTIONNAIRE :
${JSON.stringify(questionnaire)}`;

  // Launch 3 calls in parallel
  genDeliverable(apiKey, systemCtx, buildSynthPrompt(systemCtx), 'synth', 'synthFrame', 'Synth');
  genDeliverable(apiKey, systemCtx, buildMockPrompt(systemCtx), 'mock', 'mockFrame', 'Mock');
  genDeliverable(apiKey, systemCtx, buildCadragePrompt(systemCtx), 'cadrage', 'cadrageFrame', 'Cadrage');
}

async function genDeliverable(apiKey, systemCtx, prompt, key, frameId, statusKey) {
  try {
    const content = await callClaudeAPI(apiKey, prompt);
    const html = cleanHtmlOutput(content);
    if (key === 'synth') lastSynthHtml = html;
    else if (key === 'mock') lastMockHtml = html;
    else lastCadrageHtml = html;

    if (html.length > 0) {
      writeToFrame(frameId, html);
      autoResizeFrame(frameId);
      setGenStatus(statusKey, 'done', `✓ Terminé (${html.length.toLocaleString()} car.)`);
    } else {
      setGenStatus(statusKey, 'error', '⚠ Contenu vide');
    }
  } catch (err) {
    setGenStatus(statusKey, 'error', '✕ ' + err.message.substring(0, 60));
    writeToFrame(frameId, errorPage(err.message));
  }
  onGenPartDone();
}

function setGenStatus(key, cls, html) {
  const el = document.getElementById('genStatus' + key);
  el.className = 'gi-status ' + cls;
  el.innerHTML = html;
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
function buildSynthPrompt(ctx) {
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

- Priorité chiffres : temps, gains, coûts, volumétrie
- Design sobre : fond blanc, police sans-serif, couleurs SNCF (bleu #0088CE, accent #DC582A)
- HTML complet (doctype, head, body) prêt à l'affichage

Réponds UNIQUEMENT avec le code HTML complet, sans markdown, sans \`\`\`html.`;
}

function buildMockPrompt(ctx) {
  return ctx + `\n\nLIVRABLE 2 - MAQUETTE / PROTOTYPE VISUEL DE L'APPLICATION
À partir du besoin métier décrit dans le questionnaire, imagine et génère une MAQUETTE HTML de ce à quoi l'application ou la webapp demandée POURRAIT RESSEMBLER une fois réalisée.

CE QUE TU DOIS FAIRE :
- Créer un PROTOTYPE VISUEL (mockup) de l'interface utilisateur de la solution envisagée
- C'est une maquette statique : elle n'a PAS besoin d'être fonctionnelle, elle doit MONTRER à quoi ça ressemblerait
- Inventer des données fictives réalistes pour remplir les écrans (noms, chiffres, statuts, tableaux de bord...)
- Imaginer les écrans principaux : dashboard, formulaires, listes, tableaux, indicateurs, navigation
- Donner une impression crédible et professionnelle de l'outil fini

RÈGLES TECHNIQUES :
- Page HTML complète et autonome (doctype, head avec <style> intégré, body)
- Design sobre, moderne, professionnel - comme une vraie webapp d'entreprise
- Palette : fond #F0F1F4, surfaces blanches, titres bleu SNCF #0088CE, accents #DC582A, texte #3C3732
- Police system sans-serif (Segoe UI, Arial)
- Utiliser flexbox/grid pour une mise en page réaliste (sidebar, header, cards, tables...)
- Icônes Unicode pour illustrer la navigation et les sections
- Barre de navigation en haut ou sidebar avec le nom du projet
- Footer discret : 'Maquette générée par Cadrage Express v7 — Prototype non fonctionnel'

IMPORTANT : Ce n'est PAS un résumé du cadrage. C'est un APERÇU VISUEL de l'application métier que le demandeur souhaite obtenir.

Réponds UNIQUEMENT avec le code HTML complet, sans markdown, sans \`\`\`html.`;
}

function buildCadragePrompt(ctx) {
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
- Chaque élément incertain porte un tag visible en orange : 'À VALIDER', 'À CONFIRMER', 'HYPOTHÈSE'
- Header : 'PREMIERS ÉLÉMENTS DE CADRAGE — [NOM DU PROJET]' + date + mention 'Cadrage Express v7 — Document de travail'
- Footer : 'Ce document est un pré-cadrage généré par IA. Il doit être confronté aux experts métier avant toute décision.'

RÈGLES TECHNIQUES :
- Page HTML complète et autonome
- Design sobre, lisible, imprimable : fond blanc, titres bleu SNCF #0088CE, tags orange #DC582A
- Les tags 'À VALIDER' en <span> avec fond orange clair et texte #DC582A, bold

Réponds UNIQUEMENT avec le code HTML complet, sans markdown, sans \`\`\`html.`;
}

/* ═══════════════════════════════════════
   CLAUDE API
   ═══════════════════════════════════════ */
async function callClaudeAPI(apiKey, userPrompt) {
  const model = document.getElementById('cfgModel').value.trim() || 'claude-sonnet-4-20250514';
  const maxTokens = parseInt(document.getElementById('cfgMaxTokens').value) || 8192;

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
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();

  if (data.content && data.content.length > 0) {
    return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  throw new Error('Réponse vide ou structure inattendue');
}

async function callClaudeAPIWithAudio(apiKey, audioBase64, mediaType, textPrompt) {
  const model = document.getElementById('cfgModel').value.trim() || 'claude-sonnet-4-20250514';
  const maxTokens = parseInt(document.getElementById('cfgMaxTokens').value) || 8192;

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
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: mediaType, data: audioBase64 }
            },
            { type: 'text', text: textPrompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  if (data.content && data.content.length > 0) {
    return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  throw new Error('Réponse vide ou structure inattendue');
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
    document.getElementById('dt' + k).className = which === key ? 'del-tab active' : 'del-tab';
    document.getElementById('dp' + k).className = which === key ? 'del-pane visible' : 'del-pane';
  });
}

/* ═══════════════════════════════════════
   DOWNLOAD
   ═══════════════════════════════════════ */
function downloadHtml(html, filename) {
  if (!html) { alert('Aucun contenu à télécharger.'); return; }
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
