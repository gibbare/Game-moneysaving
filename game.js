'use strict';
/* ══════════════════════════════════════════
   LIVET SOM SPEL — game.js
   ══════════════════════════════════════════ */

// ─────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────
const MONTH_DURATION   = 60000;  // 60 real seconds = 1 game month
const TOTAL_MONTHS     = 12;
const TAX_RATE         = 0.30;
const STARTING_BALANCE = 2000;
const TICK_MS          = 200;    // UI update interval

const FIXED_EXPENSES = {
  rent:  4000,
  food:  2500,
};

const MONTH_NAMES = [
  'Januari','Februari','Mars','April','Maj','Juni',
  'Juli','Augusti','September','Oktober','November','December'
];

const JOBS = [
  {
    id: 'cashier',
    emoji: '🛒',
    name: 'Kassörska / Kassör',
    color: '#4facfe',
    salary: 16000,
    salaryText: '16 000 kr/mån',
    periodText: 'Månadslön (i slutet av månaden)',
    desc: 'Jobbar i mataffären. Stabilt och tryggt — men du måste vänta hela månaden på lönen!',
    type: 'monthly',
    badges: ['Stabil lön', 'Ingen interaktion'],
    interactive: false,
  },
  {
    id: 'barista',
    emoji: '☕',
    name: 'Barista',
    color: '#f093fb',
    salary: 14000,
    salaryText: '14 000 kr/mån',
    periodText: 'Veckolön (var 15:e sekund)',
    desc: 'Gör kaffe och smörgåsar. Lägre lön men du får betalt varje vecka — bra för kassaflödet!',
    type: 'weekly',
    payInterval: 15000,    // 15 real seconds = 1 game week
    payAmount: 14000 / 4,  // = 3500 kr/week gross
    badges: ['Veckolön', 'Bra flöde'],
    interactive: false,
  },
  {
    id: 'delivery',
    emoji: '🚴',
    name: 'Budcyklist',
    color: '#fa709a',
    salary: 22000,
    salaryText: 'upp till 22 000 kr/mån',
    periodText: 'Per leverans — TAP för att acceptera!',
    desc: 'Cyklar mat till folk. Bra betalt PER LEVERANS men du måste trycka snabbt när en ny leverans dyker upp!',
    type: 'delivery',
    deliveryInterval: [18000, 25000], // random 18-25 seconds
    deliveryAmount:   [1400, 1700, 2000, 2300, 2600],
    interactionTimeout: 8000,
    badges: ['Högt tak', 'Interaktivt! 👆'],
    interactive: true,
  },
  {
    id: 'freelancer',
    emoji: '💻',
    name: 'Frilansare',
    color: '#43e97b',
    salary: 30000,
    salaryText: 'upp till 30 000 kr/mån',
    periodText: 'Per projekt — TAP för att lämna in!',
    desc: 'Jobbar hemifrån med datorn. Bäst betalt av alla men måste lämna in projekt i tid — annars inget betalt!',
    type: 'freelancer',
    projectInterval: [28000, 45000], // random 28-45 seconds
    projectAmount:   [6000, 8000, 10000, 12000, 15000],
    interactionTimeout: 12000,
    badges: ['Bäst lön', 'Hög risk! ⚡'],
    interactive: true,
  },
];

const GOALS = [
  { id: 'pc',       emoji: '🖥️', name: 'Gaming-PC',      amount: 15000, color: '#4facfe' },
  { id: 'phone',    emoji: '📱', name: 'Ny smartphone',   amount: 8000,  color: '#fa709a' },
  { id: 'vacation', emoji: '✈️', name: 'Semesterresa',    amount: 20000, color: '#f093fb' },
  { id: 'bike',     emoji: '🚲', name: 'Ny cykel',        amount: 5000,  color: '#43e97b' },
  { id: 'console',  emoji: '🎮', name: 'Spelkonsol',      amount: 6000,  color: '#ffd700' },
  { id: 'custom',   emoji: '⭐', name: 'Eget mål',        amount: null,  color: '#ff9f43' },
];

const EVENTS = [
  {
    id: 'phone_broken',
    emoji: '📱💥',
    title: 'Åh nej! Telefonskärmen gick sönder!',
    desc: 'Du tappade telefonen och hela skärmen sprack. Vad gör du?',
    choices: [
      { text: 'Laga skärmen', detail: '−2 500 kr', effect: -2500, type: 'negative' },
      { text: 'Köp begagnad telefon', detail: '−1 200 kr', effect: -1200, type: 'negative' },
      { text: 'Lev med sprucken skärm', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Lite jobbigt men pengarna är kvar!' },
    ],
  },
  {
    id: 'concert',
    emoji: '🎵🎤',
    title: 'Konsert med kompisar!',
    desc: 'Dina kompisar ska på konsert med ditt favoritband. Biljetten kostar 800 kr.',
    choices: [
      { text: 'Ja, det är värt det!', detail: '−800 kr', effect: -800, type: 'negative', msg: 'Vilken kväll! 🎉' },
      { text: 'Sparar pengarna', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Klok! Du kan lyssna hemma.' },
    ],
  },
  {
    id: 'sneakers',
    emoji: '👟✨',
    title: 'Rea på sneakers!',
    desc: 'Dina favoritsko är 60% rabatt! Normalt 1 500 kr, nu bara 600 kr. Köpa?',
    choices: [
      { text: 'Köp dem nu!', detail: '−600 kr', effect: -600, type: 'negative', msg: 'Snygga! Värde för pengarna.' },
      { text: 'Behöver dem inte', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du sparade 600 kr. Bra val!' },
    ],
  },
  {
    id: 'bike_repair',
    emoji: '🚲🔧',
    title: 'Cykeln är trasig!',
    desc: 'Kedjan gick av. Du behöver cykeln för att ta dig till jobbet.',
    choices: [
      { text: 'Laga på cykelverkstad', detail: '−500 kr', effect: -500, type: 'negative' },
      { text: 'Laga själv (YouTube)', detail: '−100 kr', effect: -100, type: 'neutral', msg: 'Lite krångligt men du klarade det! 💪' },
      { text: 'Ta buss istället', detail: '−300 kr', effect: -300, type: 'negative', msg: 'Dyrare i längden...' },
    ],
  },
  {
    id: 'streaming',
    emoji: '📺🍿',
    title: 'Streamingtjänst?',
    desc: 'En streamingtjänst erbjuder sig för 150 kr/mån. Alla dina kompisar har den.',
    choices: [
      { text: 'Prenumerera', detail: '−150 kr/mån framåt', effect: -150, type: 'negative', recurring: true, recurringName: '📺 Streaming', msg: 'Adderat som månadskostnad!' },
      { text: 'Nej tack', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du kan alltid dela med en kompis gratis!' },
    ],
  },
  {
    id: 'gaming',
    emoji: '🎮🔥',
    title: 'Nytt spel är ute!',
    desc: 'Alla pratar om det nya spelet som just kom. Det kostar 600 kr.',
    choices: [
      { text: 'Köp direkt!', detail: '−600 kr', effect: -600, type: 'negative', msg: 'Skul! Värt det?' },
      { text: 'Vänta på rea', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Klokt! Det brukar bli billigare.' },
    ],
  },
  {
    id: 'birthday',
    emoji: '🎂🎁',
    title: 'Kompis har födelsedag!',
    desc: 'Din bästa kompis fyller år! Vad ger du i present?',
    choices: [
      { text: 'Fin present', detail: '−400 kr', effect: -400, type: 'negative', msg: 'Kompisen blir jätteglad!' },
      { text: 'Handgjord kort + godis', detail: '−80 kr', effect: -80, type: 'neutral', msg: 'Personligt och ekonomiskt! ❤️' },
      { text: 'Ingenting (awkward...)', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Lite pinsamt...' },
    ],
  },
  {
    id: 'found_money',
    emoji: '💸🍀',
    title: 'Du hittade pengar!',
    desc: 'Du hittar en 200-kronorssedel på marken utanför affären. Ingen verkar äga den!',
    choices: [
      { text: 'Plocka upp den!', detail: '+200 kr', effect: 200, type: 'positive', msg: 'Lyckodag! 🍀' },
    ],
  },
  {
    id: 'electricity',
    emoji: '⚡💸',
    title: 'Elräkningen kom!',
    desc: 'Det var en kall månad och du hade lamporna på för länge. Extra elräkning!',
    choices: [
      { text: 'Betala räkningen', detail: '−800 kr', effect: -800, type: 'negative' },
    ],
  },
  {
    id: 'pizza',
    emoji: '🍕😋',
    title: 'Pizzakväll?',
    desc: 'Kompisar vill beställa pizza och kolla film. Din andel: 250 kr.',
    choices: [
      { text: 'Ja! Pizza!', detail: '−250 kr', effect: -250, type: 'negative', msg: 'Myskväll! 🍕' },
      { text: 'Jag lagar mat hemma', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Sparade 250 kr! Du kan fika imorgon.' },
    ],
  },
  {
    id: 'dentist',
    emoji: '🦷😬',
    title: 'Tandvärk!',
    desc: 'Du har ont i en tand i flera dagar. Tandläkaren kostar 1 200 kr.',
    choices: [
      { text: 'Gå till tandläkaren', detail: '−1 200 kr', effect: -1200, type: 'negative', msg: 'Smart! Bättre att fixa tidigt.' },
      { text: 'Hoppas det går över', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Riskabelt... men pengarna är kvar.' },
    ],
  },
  {
    id: 'bonus',
    emoji: '🌟💰',
    title: 'Du fick bonus!',
    desc: 'Chefen är jättenöjd med ditt arbete den här månaden! Du får en bonus!',
    choices: [
      { text: 'Tack så jättemycket!', detail: '+2 000 kr', effect: 2000, type: 'positive', msg: 'Hårt arbete lönar sig! ⭐' },
    ],
  },
  {
    id: 'invest',
    emoji: '📈🎲',
    title: 'Aktiechansen!',
    desc: 'Din kompis tipsar om ett litet företag. "Det kan gå upp 50%!" säger han. Lika chans att det sjunker. Satsa 2 000 kr?',
    choices: [
      { text: 'Satsa 2 000 kr!', detail: 'Chans/risk', effect: 'gamble', gambleAmt: 2000, gambleOdds: 0.5, gambleWin: 3800, type: 'negative', msg: '...' },
      { text: 'För riskigt, sparar', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Tryggt val! Spara är vinna.' },
    ],
  },
  {
    id: 'gym',
    emoji: '💪🏋️',
    title: 'Gymkort på rea!',
    desc: 'Gymmet erbjuder årskortet för 2 000 kr (normalt 3 600). Bra deal!',
    choices: [
      { text: 'Köp gymkortet', detail: '−2 000 kr', effect: -2000, type: 'negative', msg: 'Bra investering i din hälsa!' },
      { text: 'Springer utomhus gratis', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Smart! Naturen är gratis.' },
    ],
  },
  {
    id: 'second_hand',
    emoji: '👕♻️',
    title: 'Second hand fynd!',
    desc: 'Du hittar ett knappt använt märkesjacka på Blocket för 300 kr (värd 2 000). Köpa?',
    choices: [
      { text: 'Köp jackan!', detail: '−300 kr', effect: -300, type: 'negative', msg: 'Bra deal! Miljösmart dessutom.' },
      { text: 'Nej tack', detail: '±0 kr', effect: 0, type: 'neutral' },
    ],
  },
  {
    id: 'savings_tip',
    emoji: '🏦💡',
    title: 'Banken erbjuder sparkonto!',
    desc: 'Du kan öppna ett sparkonto med 2% ränta. Sätt in minst 3 000 kr för att börja tjäna ränta!',
    choices: [
      { text: 'Sätt in 3 000 kr', detail: '→ sparkonto + ränta!', effect: 'savings_account', savingsAmt: 3000, type: 'neutral', msg: 'Bra! Pengarna växer nu! 📈' },
      { text: 'Ingen tack', detail: '±0 kr', effect: 0, type: 'neutral' },
    ],
  },
  {
    id: 'friend_loan',
    emoji: '🤝💸',
    title: 'Kompisen behöver låna pengar',
    desc: 'Din kompis har kört slut på pengar och ber dig låna 500 kr. Han lovar betala tillbaka nästa månad.',
    choices: [
      { text: 'Låna ut 500 kr', detail: '−500 kr (tillfälligt?)', effect: -500, type: 'negative', msg: 'Schysst av dig! Hoppas du får tillbaka dem.' },
      { text: 'Kan inte just nu', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Dina pengar, din rätt.' },
    ],
  },
  {
    id: 'clothes_sale',
    emoji: '🛍️🏷️',
    title: 'Klädrea!',
    desc: '70% rea på ett stort klädmärke. Du hittar kläder för normalt 2 000 kr nu för bara 600 kr.',
    choices: [
      { text: 'Handla för 600 kr', detail: '−600 kr', effect: -600, type: 'negative', msg: 'Snyggt OCH prisvärt!' },
      { text: 'Behöver inga nya kläder', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du är nöjd med det du har. Klokt!' },
    ],
  },
];

// Tips shown in month summary
const MONTH_TIPS = [
  '💡 Visste du? Om du sparar 1 000 kr/mån i 40 år med 7% ränta blir det MILJONER!',
  '💡 "Pay yourself first" — spara en del av lönen DIREKT när den kommer in!',
  '💡 Att laga mat hemma sparar oftast 60-70% jämfört med att äta ute varje dag.',
  '💡 Räkna alltid netto (efter skatt) — det är det du faktiskt har kvar!',
  '💡 En nödfond på 3 månaders utgifter skyddar dig mot oväntade kostnader.',
  '💡 Compound interest = ränta på ränta. Ju tidigare du börjar spara, desto mer får du!',
  '💡 Skillnaden mellan "vill ha" och "behöver" är nyckeln till bra ekonomi.',
  '💡 Fasta utgifter (hyra, mat) kommer ALLTID. Planera för dem!',
  '💡 Att köpa second hand sparar pengar OCH är bra för miljön!',
  '💡 Spara INNAN du spenderar — inte tvärtom!',
];

// Game-over wisdom based on performance
const WISDOM = [
  { minSavings: 0.6, text: '🌟 Otroligt! Du sparade mer än 60% av det du tjänade. Du är en sparmästare! Med den disciplinen kan du nå vilka ekonomiska mål som helst i livet.' },
  { minSavings: 0.4, text: '👍 Bra jobbat! Du sparade en stor del av din inkomst. Att fortsätta med den vanan kommer göra dig ekonomiskt trygg.' },
  { minSavings: 0.2, text: '📚 Du är på rätt väg! Nästa steg är att spara ännu mer. Försök att spara 20-30% av lönen varje månad.' },
  { minSavings: 0.05, text: '🤔 Du spenderade det mesta du tjänade. Tänk på: varje krona du sparar nu är mer värd än en krona du sparar om 10 år — tack vare ränta!' },
  { minSavings: -Infinity, text: '😬 Det gick tufft ekonomiskt! Men du lärde dig vad som kostar pengar. Nu vet du bättre — försök igen och sikta på att spara lite varje månad!' },
];

// ─────────────────────────────────────────
//  GAME STATE
// ─────────────────────────────────────────
let state = {
  // Profile
  profiles: {},
  activeProfileId: null,

  // Game progress
  balance: STARTING_BALANCE,
  month: 0,            // 0..11
  gameRunning: false,
  paused: false,

  // Current month tracking
  mIncome: 0,          // gross income this month
  mTax: 0,
  mNetIncome: 0,       // net income this month
  mFixed: 0,           // rent + food
  mEvents: 0,          // event expenses this month
  mRecurring: 0,       // recurring costs this month

  // All-time
  totalGross: 0,
  totalTax: 0,
  totalFixed: 0,
  totalEventCosts: 0,
  savingsAccountBalance: 0,
  savingsAccountInterest: 0,

  // Job
  job: null,
  payTimer: null,
  payProgress: 0,
  payElapsed: 0,
  payAmount: 0,        // gross amount for next pay

  // Interaction (delivery/freelance)
  activeInteraction: null,
  interactionTimer: null,
  interactionElapsed: 0,
  interactionScheduled: null,

  // Month timer
  monthElapsed: 0,
  monthTimer: null,

  // Events
  eventTimer: null,
  eventQueue: [],
  shownEventIds: [],
  recurringCosts: [],  // [{name, amount}]

  // Goal
  goal: null,

  // UI
  soundEnabled: true,
  audioCtx: null,
  overviewOpen: false,

  // Temporary: selected avatar/job for new game
  selectedAvatar: '😎',
  selectedJob: null,
};

// ─────────────────────────────────────────
//  SOUND SYSTEM
// ─────────────────────────────────────────
function initAudio() {
  if (state.audioCtx) return;
  try {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {}
}

function playTone(freq, dur, type = 'sine', vol = 0.25, delay = 0) {
  if (!state.soundEnabled || !state.audioCtx) return;
  try {
    const ctx = state.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch(e) {}
}

const SFX = {
  click:  () => playTone(660, 0.06, 'sine', 0.15),
  coin:   () => { playTone(880, 0.08); playTone(1100, 0.1, 'sine', 0.2, 0.08); },
  salary: () => { [523,659,784,1047].forEach((f,i) => playTone(f, 0.18, 'sine', 0.22, i*0.1)); },
  spend:  () => { playTone(330, 0.18, 'sawtooth', 0.18); playTone(220, 0.25, 'sawtooth', 0.12, 0.15); },
  event:  () => { playTone(660, 0.08); playTone(880, 0.15, 'sine', 0.2, 0.12); },
  alarm:  () => { [0,250,500].forEach(d => playTone(880, 0.12, 'square', 0.3, d/1000)); },
  month:  () => { [440,550,660].forEach((f,i) => playTone(f, 0.15, 'sine', 0.2, i*0.08)); },
  win:    () => { [523,659,784,1047,1319].forEach((f,i) => playTone(f, 0.22, 'sine', 0.22, i*0.11)); },
  lose:   () => playTone(200, 0.7, 'sawtooth', 0.18),
  goal:   () => { [523,659,784,1047,1319,1568].forEach((f,i) => playTone(f, 0.25, 'sine', 0.25, i*0.09)); },
};

// ─────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────
const STORAGE_KEY = 'livet_som_spel_v1';

function saveProfiles() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profiles)); } catch(e) {}
}

function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state.profiles = JSON.parse(raw);
  } catch(e) { state.profiles = {}; }
}

function saveCurrentGame() {
  const pid = state.activeProfileId;
  if (!pid || !state.profiles[pid]) return;
  state.profiles[pid].lastSave = Date.now();
  state.profiles[pid].gameState = {
    balance: state.balance,
    month: state.month,
    mIncome: state.mIncome,
    mTax: state.mTax,
    mNetIncome: state.mNetIncome,
    mFixed: state.mFixed,
    mEvents: state.mEvents,
    mRecurring: state.mRecurring,
    totalGross: state.totalGross,
    totalTax: state.totalTax,
    totalFixed: state.totalFixed,
    totalEventCosts: state.totalEventCosts,
    savingsAccountBalance: state.savingsAccountBalance,
    savingsAccountInterest: state.savingsAccountInterest,
    jobId: state.job ? state.job.id : null,
    recurringCosts: state.recurringCosts,
    shownEventIds: state.shownEventIds,
    goal: state.goal,
    gameRunning: state.gameRunning,
  };
  saveProfiles();
}

// ─────────────────────────────────────────
//  SCREEN MANAGEMENT
// ─────────────────────────────────────────
function showScreen(id) {
  SFX.click();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');

  if (id === 'profiles') renderProfiles();
  if (id === 'job')      renderJobs();
  if (id === 'goal')     renderGoals();
}

function closeOverlay(id) {
  SFX.click();
  document.getElementById(id).style.display = 'none';
}

function showOverlay(id) {
  document.getElementById(id).style.display = 'flex';
}

// ─────────────────────────────────────────
//  PROFILE MANAGEMENT
// ─────────────────────────────────────────
function renderProfiles() {
  const list = document.getElementById('profiles-list');
  const ids = Object.keys(state.profiles);
  if (ids.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;text-align:center;padding:0.5rem 0">Inga sparade spelare ännu!</p>';
    return;
  }
  list.innerHTML = ids.map(pid => {
    const p = state.profiles[pid];
    const gs = p.gameState;
    const meta = gs
      ? `Månad ${gs.month + 1}/12 · ${fmt(gs.balance)}`
      : 'Nytt spel';
    return `<div class="profile-card" onclick="loadProfile('${pid}')">
      <div class="profile-avatar">${p.avatar}</div>
      <div class="profile-info">
        <div class="profile-name">${p.name}</div>
        <div class="profile-meta">${meta}</div>
      </div>
      <button class="profile-delete" onclick="event.stopPropagation();deleteProfile('${pid}')" title="Ta bort">🗑️</button>
    </div>`;
  }).join('');
}

function selectAvatar(el) {
  document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
  el.classList.add('selected');
  state.selectedAvatar = el.dataset.emoji;
}

function createProfile() {
  const name = document.getElementById('player-name-input').value.trim();
  if (!name) { showToast('Skriv in ditt namn!', 'info'); return; }
  const pid = 'p_' + Date.now();
  state.profiles[pid] = {
    id: pid,
    name,
    avatar: state.selectedAvatar || '😎',
    created: Date.now(),
    gameState: null,
  };
  saveProfiles();
  state.activeProfileId = pid;
  document.getElementById('player-name-input').value = '';
  showScreen('job');
}

function loadProfile(pid) {
  SFX.click();
  state.activeProfileId = pid;
  const p = state.profiles[pid];
  const gs = p.gameState;

  if (gs && gs.gameRunning) {
    // Resume game
    restoreGameState(gs);
    showScreen('game');
    resumeGame();
  } else if (gs && !gs.gameRunning) {
    // Game completed — show gameover
    restoreGameState(gs);
    showGameOver();
  } else {
    // Fresh game — pick job
    showScreen('job');
  }
}

function deleteProfile(pid) {
  if (!confirm('Ta bort ' + state.profiles[pid].name + '?')) return;
  delete state.profiles[pid];
  saveProfiles();
  renderProfiles();
}

function restoreGameState(gs) {
  Object.assign(state, {
    balance: gs.balance,
    month: gs.month,
    mIncome: gs.mIncome || 0,
    mTax: gs.mTax || 0,
    mNetIncome: gs.mNetIncome || 0,
    mFixed: gs.mFixed || 0,
    mEvents: gs.mEvents || 0,
    mRecurring: gs.mRecurring || 0,
    totalGross: gs.totalGross || 0,
    totalTax: gs.totalTax || 0,
    totalFixed: gs.totalFixed || 0,
    totalEventCosts: gs.totalEventCosts || 0,
    savingsAccountBalance: gs.savingsAccountBalance || 0,
    savingsAccountInterest: gs.savingsAccountInterest || 0,
    job: JOBS.find(j => j.id === gs.jobId) || JOBS[0],
    recurringCosts: gs.recurringCosts || [],
    shownEventIds: gs.shownEventIds || [],
    goal: gs.goal || null,
    gameRunning: gs.gameRunning,
  });
}

// ─────────────────────────────────────────
//  JOB SELECTION
// ─────────────────────────────────────────
function renderJobs() {
  const grid = document.getElementById('jobs-grid');
  grid.innerHTML = JOBS.map(j => `
    <div class="job-select-card" style="--job-color:${j.color}" onclick="selectJob('${j.id}')">
      <div class="job-card-top">
        <span class="job-card-emoji">${j.emoji}</span>
        <div>
          <div class="job-card-name">${j.name}</div>
          <div class="job-card-salary">${j.salaryText}</div>
          <div class="job-card-period">${j.periodText}</div>
        </div>
      </div>
      <p class="job-card-desc">${j.desc}</p>
      <div>
        ${j.badges.map(b => `<span class="job-badge${b.includes('👆') || b.includes('⚡') ? ' interactive' : ''}">${b}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function selectJob(id) {
  SFX.click();
  state.selectedJob = JOBS.find(j => j.id === id);
  showScreen('goal');
}

// ─────────────────────────────────────────
//  GOAL SELECTION
// ─────────────────────────────────────────
function renderGoals() {
  const grid = document.getElementById('goals-grid');
  grid.innerHTML = GOALS.map(g => `
    <div class="goal-select-card" style="--goal-color:${g.color}" onclick="selectGoal('${g.id}')">
      <span class="goal-emoji">${g.emoji}</span>
      <div class="goal-label">${g.name}</div>
      ${g.amount ? `<div class="goal-price">${fmt(g.amount)}</div>` : '<div class="goal-price">Eget</div>'}
    </div>
  `).join('');
  document.getElementById('custom-goal-form').style.display = 'none';
}

function selectGoal(id) {
  SFX.click();
  if (id === 'custom') {
    document.getElementById('custom-goal-form').style.display = 'flex';
    document.getElementById('custom-goal-name').focus();
    return;
  }
  const g = GOALS.find(x => x.id === id);
  startGame(g);
}

function setCustomGoal() {
  const name   = document.getElementById('custom-goal-name').value.trim();
  const amount = parseInt(document.getElementById('custom-goal-amount').value, 10);
  if (!name)  { showToast('Skriv ett namn!', 'info'); return; }
  if (!amount || amount < 500) { showToast('Ange ett belopp (minst 500 kr)!', 'info'); return; }
  startGame({ id: 'custom', emoji: '⭐', name, amount, color: '#ff9f43' });
}

// ─────────────────────────────────────────
//  GAME INITIALIZATION
// ─────────────────────────────────────────
function startGame(goal) {
  SFX.click();
  const p = state.profiles[state.activeProfileId];

  // Reset state for new game
  state.balance             = STARTING_BALANCE;
  state.month               = 0;
  state.gameRunning         = true;
  state.mIncome = state.mTax = state.mNetIncome = 0;
  state.mFixed = state.mEvents = state.mRecurring = 0;
  state.totalGross = state.totalTax = state.totalFixed = state.totalEventCosts = 0;
  state.savingsAccountBalance = state.savingsAccountInterest = 0;
  state.job                 = state.selectedJob || JOBS[0];
  state.recurringCosts      = [];
  state.shownEventIds       = [];
  state.eventQueue          = shuffleEvents();
  state.goal                = goal;
  state.monthElapsed        = 0;
  state.payElapsed          = 0;
  state.payProgress         = 0;
  state.activeInteraction   = null;
  state.overviewOpen        = false;

  showScreen('game');
  initGameUI();
  startMonthTimer();
  scheduleNextEvent();
  if (state.job.interactive) scheduleNextInteraction();

  saveCurrentGame();
}

function resumeGame() {
  state.gameRunning  = true;
  state.eventQueue   = shuffleEvents().filter(e => !state.shownEventIds.includes(e.id));
  state.monthElapsed = 0;
  state.payElapsed   = 0;
  state.activeInteraction = null;

  initGameUI();
  startMonthTimer();
  scheduleNextEvent();
  if (state.job.interactive) scheduleNextInteraction();
}

function initGameUI() {
  const p = state.profiles[state.activeProfileId];
  document.getElementById('top-avatar').textContent = p.avatar;
  document.getElementById('top-name').textContent   = p.name;

  updateTopBar();
  updateBalance();
  updateJobCard();
  updateOverview();
  updateGoalDisplay();
  clearLog();
  addLog('🎮 Spelet startar!', state.balance, true);
  addLog(`💼 Du börjar som ${state.job.name}`, 0, null);
}

// ─────────────────────────────────────────
//  MONTH TIMER
// ─────────────────────────────────────────
function startMonthTimer() {
  clearTimeout(state.monthTimer);
  state.monthElapsed = 0;
  const startTime = Date.now();

  function tick() {
    if (!state.gameRunning || state.paused) {
      state.monthTimer = setTimeout(tick, TICK_MS);
      return;
    }
    state.monthElapsed = Date.now() - startTime;

    const pct = Math.min(state.monthElapsed / MONTH_DURATION, 1);
    document.getElementById('month-progress-fill').style.width = (pct * 100) + '%';

    const secsLeft = Math.max(0, Math.ceil((MONTH_DURATION - state.monthElapsed) / 1000));
    document.getElementById('month-time-display').textContent = secsLeft + ' sek kvar';

    // Pay progress for timed jobs
    updatePayProgress();

    if (state.monthElapsed >= MONTH_DURATION) {
      endMonth();
    } else {
      state.monthTimer = setTimeout(tick, TICK_MS);
    }
  }
  state.monthTimer = setTimeout(tick, TICK_MS);
}

function updatePayProgress() {
  const j = state.job;
  if (j.type === 'monthly') {
    const pct = Math.min(state.monthElapsed / MONTH_DURATION, 1);
    const el = document.getElementById('pay-fill');
    if (el) el.style.width = (pct * 100) + '%';
    document.getElementById('game-job-pay').textContent =
      `Lön om ca ${Math.max(0, Math.ceil((MONTH_DURATION - state.monthElapsed)/1000))} sek`;
  }
  // Barista pay progress
  if (j.type === 'weekly') {
    const interval = j.payInterval;
    const pct = (state.payElapsed % interval) / interval;
    const el = document.getElementById('pay-fill');
    if (el) el.style.width = (pct * 100) + '%';
    const secsLeft = Math.max(0, Math.ceil((interval - (state.payElapsed % interval)) / 1000));
    document.getElementById('game-job-pay').textContent = `Nästa lön om ${secsLeft} sek`;
    state.payElapsed += TICK_MS;
    if (!state.paused) checkBaristaPay();
  }
}

let baristaAccumulated = 0;
function checkBaristaPay() {
  const j = state.job;
  if (j.type !== 'weekly') return;
  baristaAccumulated += TICK_MS;
  if (baristaAccumulated >= j.payInterval) {
    baristaAccumulated = 0;
    earnIncome(j.payAmount, 'Veckolön');
  }
}

// ─────────────────────────────────────────
//  INTERACTION SYSTEM (Delivery / Freelancer)
// ─────────────────────────────────────────
function scheduleNextInteraction() {
  clearTimeout(state.interactionScheduled);
  if (!state.gameRunning) return;

  const j = state.job;
  let delay;
  if (j.type === 'delivery') {
    delay = randBetween(j.deliveryInterval[0], j.deliveryInterval[1]);
  } else if (j.type === 'freelancer') {
    delay = randBetween(j.projectInterval[0], j.projectInterval[1]);
  } else return;

  state.interactionScheduled = setTimeout(() => {
    if (!state.gameRunning || state.paused) { scheduleNextInteraction(); return; }
    showInteraction();
  }, delay);
}

function showInteraction() {
  const j = state.job;
  let amount, title, emoji;

  if (j.type === 'delivery') {
    amount = randItem(j.deliveryAmount);
    title  = 'Ny leverans!';
    emoji  = '🚴';
  } else {
    amount = randItem(j.projectAmount);
    title  = 'Projekt klart!';
    emoji  = '💻';
  }

  state.activeInteraction = { amount, gross: amount, timeout: j.interactionTimeout };
  state.interactionElapsed = 0;

  document.getElementById('int-emoji').textContent   = emoji;
  document.getElementById('int-title').textContent   = title;
  document.getElementById('int-amount').textContent  = '+' + fmt(Math.round(amount * (1 - TAX_RATE))) + ' netto';
  document.getElementById('interaction-banner').style.display = 'block';

  SFX.alarm();

  const timeoutDur = j.interactionTimeout;
  const startT = Date.now();

  function countdown() {
    if (!state.activeInteraction) return;
    const elapsed = Date.now() - startT;
    const pct = Math.max(0, 1 - elapsed / timeoutDur);
    const fill = document.getElementById('int-timer-fill');
    if (fill) fill.style.width = (pct * 100) + '%';

    if (elapsed >= timeoutDur) {
      missInteraction();
    } else {
      state.interactionTimer = setTimeout(countdown, 100);
    }
  }
  state.interactionTimer = setTimeout(countdown, 100);
}

function acceptInteraction() {
  if (!state.activeInteraction) return;
  clearTimeout(state.interactionTimer);
  SFX.coin();

  const gross = state.activeInteraction.gross;
  earnIncome(gross, state.job.type === 'delivery' ? 'Leverans' : 'Projekt');

  state.activeInteraction = null;
  document.getElementById('interaction-banner').style.display = 'none';

  burstCoins();
  scheduleNextInteraction();
}

function missInteraction() {
  clearTimeout(state.interactionTimer);
  state.activeInteraction = null;
  document.getElementById('interaction-banner').style.display = 'none';
  SFX.spend();

  const label = state.job.type === 'delivery' ? 'Leverans missad!' : 'Projekt missad!';
  showToast('😬 ' + label, 'neg');
  addLog('😬 ' + label, 0, false);
  scheduleNextInteraction();
}

// ─────────────────────────────────────────
//  EVENT SYSTEM
// ─────────────────────────────────────────
function shuffleEvents() {
  return [...EVENTS].sort(() => Math.random() - 0.5);
}

function scheduleNextEvent() {
  clearTimeout(state.eventTimer);
  if (!state.gameRunning) return;

  // Events every 45-110 seconds (spread across 12 months = ~8-10 events total)
  const delay = randBetween(45000, 110000);
  state.eventTimer = setTimeout(() => {
    if (!state.gameRunning || state.paused) { scheduleNextEvent(); return; }
    triggerNextEvent();
  }, delay);
}

function triggerNextEvent() {
  // Pause month timer logic during event (soft pause)
  state.paused = true;

  if (state.eventQueue.length === 0) {
    state.eventQueue = shuffleEvents().filter(e => !state.shownEventIds.includes(e.id));
    if (state.eventQueue.length === 0) state.eventQueue = shuffleEvents();
  }

  const ev = state.eventQueue.shift();
  state.shownEventIds.push(ev.id);
  showEventOverlay(ev);
}

function showEventOverlay(ev) {
  SFX.event();
  document.getElementById('ev-emoji').textContent = ev.emoji;
  document.getElementById('ev-title').textContent = ev.title;
  document.getElementById('ev-desc').textContent  = ev.desc;

  const choicesEl = document.getElementById('ev-choices');
  choicesEl.innerHTML = ev.choices.map((c, i) => {
    const amtClass = c.effect > 0 ? 'pos' : (c.effect < 0 ? 'neg' : '');
    const btnClass = c.type === 'positive' ? 'positive' : (c.type === 'negative' ? 'negative' : 'neutral');
    return `<button class="ev-choice-btn ${btnClass}" onclick="handleEventChoice(${i})">
      ${c.text}
      <span class="choice-effect ${amtClass}">${c.detail}</span>
    </button>`;
  }).join('');

  showOverlay('overlay-event');
  state.currentEvent = ev;
}

function handleEventChoice(idx) {
  SFX.click();
  const ev     = state.currentEvent;
  const choice = ev.choices[idx];

  closeOverlay('overlay-event');
  state.paused = false;

  // Handle effect
  if (choice.effect === 'gamble') {
    const win = Math.random() < choice.gambleOdds;
    const result = win ? choice.gambleWin : 0;
    const net    = result - choice.gambleAmt;
    if (net > 0) {
      earnIncome(result, 'Aktieinvestering (vinst)');
      spendMoney(choice.gambleAmt, 'Investering');
      showToast(`📈 Du vann! +${fmt(result - choice.gambleAmt)} kr`, 'pos');
    } else {
      spendMoney(choice.gambleAmt, 'Investering (förlust)');
      showToast('📉 Du förlorade investeringen!', 'neg');
    }
  } else if (choice.effect === 'savings_account') {
    if (state.balance >= choice.savingsAmt) {
      spendMoney(choice.savingsAmt, 'Sparkonto insättning');
      state.savingsAccountBalance += choice.savingsAmt;
      showToast(`🏦 Sparkonto öppnat! ${fmt(choice.savingsAmt)} insatt.`, 'info');
    } else {
      showToast('Inte tillräckligt med pengar!', 'neg');
    }
  } else if (typeof choice.effect === 'number') {
    if (choice.effect > 0) {
      earnIncome(choice.effect, ev.title);
    } else if (choice.effect < 0) {
      spendMoney(Math.abs(choice.effect), ev.title);
      state.mEvents += Math.abs(choice.effect);
    }
  }

  // Recurring cost
  if (choice.recurring && choice.effect !== 0) {
    const existing = state.recurringCosts.find(r => r.name === choice.recurringName);
    if (!existing) {
      state.recurringCosts.push({ name: choice.recurringName, amount: Math.abs(choice.effect) });
    }
    updateOverview();
  }

  if (choice.msg) showToast(choice.msg, choice.effect > 0 ? 'pos' : 'info');

  scheduleNextEvent();
  saveCurrentGame();
}

// ─────────────────────────────────────────
//  ECONOMY
// ─────────────────────────────────────────
function fmt(n) {
  return Math.round(n).toLocaleString('sv-SE') + ' kr';
}

function earnIncome(gross, label) {
  const tax = Math.round(gross * TAX_RATE);
  const net = gross - tax;
  state.balance       += net;
  state.mIncome       += gross;
  state.mTax          += tax;
  state.mNetIncome    += net;
  state.totalGross    += gross;
  state.totalTax      += tax;

  SFX.coin();
  updateBalance(true);
  addLog('💰 ' + label, net, true);
  updateOverview();
  checkGoal();
  saveCurrentGame();
}

function spendMoney(amount, label) {
  state.balance -= amount;
  updateBalance(false);
  addLog('💸 ' + label, -amount, false);
  updateOverview();
  SFX.spend();

  if (state.balance < 0) {
    showToast('⚠️ Du har minus! Skär ner på utgifterna!', 'neg');
  }
}

function checkGoal() {
  if (!state.goal || !state.goal.amount || state.goalReached) return;
  if (state.balance >= state.goal.amount) {
    state.goalReached = true;
    SFX.goal();
    burstCoins();
    showToast(`🎯 MÅL NÅTT! Du har sparat till ${state.goal.name}! 🎉`, 'pos');
    addLog(`🎯 SPARMÅL NÅTT: ${state.goal.name}!`, 0, true);
  }
  updateGoalDisplay();
}

// ─────────────────────────────────────────
//  MONTH END
// ─────────────────────────────────────────
function endMonth() {
  clearTimeout(state.monthTimer);
  clearTimeout(state.eventTimer);
  clearTimeout(state.interactionScheduled);
  clearTimeout(state.interactionTimer);
  document.getElementById('interaction-banner').style.display = 'none';
  state.activeInteraction = null;

  SFX.month();

  // Deduct fixed expenses
  const rent = FIXED_EXPENSES.rent;
  const food = FIXED_EXPENSES.food;
  state.balance -= rent + food;
  state.mFixed  += rent + food;
  state.totalFixed += rent + food;

  // Deduct recurring costs
  let recurringTotal = 0;
  state.recurringCosts.forEach(rc => {
    state.balance -= rc.amount;
    recurringTotal += rc.amount;
  });
  state.mRecurring = recurringTotal;

  // Monthly job pay
  if (state.job.type === 'monthly') {
    const gross = state.job.salary;
    const tax   = Math.round(gross * TAX_RATE);
    const net   = gross - tax;
    state.balance    += net;
    state.mIncome    += gross;
    state.mTax       += tax;
    state.mNetIncome += net;
    state.totalGross += gross;
    state.totalTax   += tax;
    SFX.salary();
    addLog('💰 Månadslön!', net, true);
  }

  // Savings account interest (monthly = 2% / 12)
  if (state.savingsAccountBalance > 0) {
    const interest = Math.round(state.savingsAccountBalance * 0.02 / 12);
    state.savingsAccountBalance += interest;
    state.savingsAccountInterest += interest;
    state.balance += interest;
    addLog('🏦 Sparkonto ränta', interest, true);
  }

  updateBalance();
  showMonthSummary();
}

function showMonthSummary() {
  const m = state.month + 1;
  document.getElementById('sum-title').textContent = `Månad ${m} klar! 📅`;

  const net = state.mNetIncome - state.mFixed - state.mRecurring;
  document.getElementById('sum-income').textContent  = '+' + fmt(state.mNetIncome);
  document.getElementById('sum-fixed').textContent   = '−' + fmt(state.mFixed + state.mRecurring);
  document.getElementById('sum-events').textContent  = state.mEvents > 0 ? '−' + fmt(state.mEvents) : '0 kr';
  document.getElementById('sum-events-row').style.display = state.mEvents > 0 ? 'flex' : 'none';

  const resultEl = document.getElementById('sum-result');
  resultEl.textContent = (net >= 0 ? '+' : '') + fmt(net);
  resultEl.className   = net >= 0 ? 'positive' : 'negative';

  document.getElementById('sum-total').textContent = fmt(state.balance);

  // Tip
  const tip = MONTH_TIPS[Math.floor(Math.random() * MONTH_TIPS.length)];
  document.getElementById('sum-tip').textContent = tip;

  // Continue button label
  const isLast = state.month >= TOTAL_MONTHS - 1;
  document.getElementById('sum-continue-btn').textContent = isLast ? 'Se årsresultat! 🏆' : 'Nästa månad →';

  showOverlay('overlay-month');
}

function continueGame() {
  SFX.click();
  closeOverlay('overlay-month');

  const isLast = state.month >= TOTAL_MONTHS - 1;
  if (isLast) {
    state.gameRunning = false;
    saveCurrentGame();
    setTimeout(showGameOver, 300);
    return;
  }

  // Advance month
  state.month++;

  // Reset monthly trackers
  state.mIncome = state.mTax = state.mNetIncome = 0;
  state.mFixed  = state.mEvents = state.mRecurring = 0;
  state.goalReached = false;

  baristaAccumulated = 0;

  updateTopBar();
  updateBalance();
  updateOverview();
  addLog(`📅 ${MONTH_NAMES[state.month]} börjar!`, 0, null);

  saveCurrentGame();

  startMonthTimer();
  scheduleNextEvent();
  if (state.job.interactive) scheduleNextInteraction();
}

// ─────────────────────────────────────────
//  JOB SWITCH
// ─────────────────────────────────────────
function showJobSwitch() {
  SFX.click();
  const list = document.getElementById('job-switch-list');
  list.innerHTML = JOBS.map(j => `
    <div class="job-switch-item${state.job.id === j.id ? ' current' : ''}" onclick="switchJob('${j.id}')">
      <span class="jsw-emoji">${j.emoji}</span>
      <div class="jsw-info">
        <div class="jsw-name">${j.name}${state.job.id === j.id ? ' (nuvarande)' : ''}</div>
        <div class="jsw-sal">${j.salaryText}</div>
      </div>
    </div>
  `).join('');
  showOverlay('overlay-job-switch');
}

function switchJob(id) {
  SFX.click();
  closeOverlay('overlay-job-switch');
  const newJob = JOBS.find(j => j.id === id);
  if (!newJob || newJob.id === state.job.id) return;

  // Cancel current job timers
  clearTimeout(state.interactionScheduled);
  clearTimeout(state.interactionTimer);
  document.getElementById('interaction-banner').style.display = 'none';
  state.activeInteraction = null;
  baristaAccumulated = 0;

  state.job = newJob;
  updateJobCard();
  addLog(`💼 Bytte jobb till ${newJob.name}`, 0, null);
  showToast(`Välkommen som ${newJob.name}!`, 'info');

  if (newJob.interactive) scheduleNextInteraction();
  saveCurrentGame();
}

// ─────────────────────────────────────────
//  GAME OVER
// ─────────────────────────────────────────
function showGameOver() {
  const totalEarned  = state.totalGross * (1 - TAX_RATE);
  const savingsPct   = totalEarned > 0 ? state.balance / totalEarned : 0;

  let trophy = '🏆', title = 'Grattis! Året är slut!';
  if (state.balance < 0)    { trophy = '😬'; title = 'Tufft år...'; }
  else if (savingsPct > 0.6) { trophy = '🥇'; title = 'Du är en sparmästare!'; }
  else if (savingsPct > 0.3) { trophy = '🥈'; title = 'Bra jobbat!'; }

  document.getElementById('go-trophy').textContent = trophy;
  document.getElementById('go-title').textContent  = title;
  document.getElementById('go-amount').textContent = fmt(state.balance);

  // Badge
  let badge = '';
  if (savingsPct > 0.6)      badge = '🏅 Mäster-Sparare';
  else if (savingsPct > 0.4) badge = '⭐ Klok Ekonom';
  else if (savingsPct > 0.2) badge = '📈 På Rätt Spår';
  else if (savingsPct > 0)   badge = '💡 Börjar Förstå';
  else                       badge = '🤑 Spenderade Alltihop';

  if (state.goal && state.balance >= state.goal.amount) {
    badge = `🎯 Nådde målet: ${state.goal.name}!`;
    SFX.goal();
  }
  document.getElementById('go-badge').textContent = badge;

  // Stats
  const stats = [
    ['💰 Total bruttolön', fmt(state.totalGross)],
    ['🏛️ Skatt betald',   fmt(state.totalTax)],
    ['💵 Total nettolön',  fmt(state.totalGross - state.totalTax)],
    ['🏠 Hyra & mat',     '−' + fmt(state.totalFixed)],
    ['🎭 Händelsekostnader', '−' + fmt(state.totalEventCosts)],
    ...(state.savingsAccountInterest > 0 ? [['🏦 Ränteintäkter', '+' + fmt(state.savingsAccountInterest)]] : []),
    ['📊 Sparkvot',        Math.round(savingsPct * 100) + '%'],
  ];

  document.getElementById('go-stats-list').innerHTML = stats.map(([k,v]) => `
    <div class="go-stat-row"><span>${k}</span><span>${v}</span></div>
  `).join('');

  // Wisdom
  const wisdom = WISDOM.find(w => savingsPct >= w.minSavings) || WISDOM[WISDOM.length - 1];
  document.getElementById('go-wisdom').innerHTML = `<p>"${wisdom.text}"</p>`;

  showScreen('gameover');
  SFX.win();
}

function playAgain() {
  SFX.click();
  // Clear game state for this profile
  if (state.activeProfileId && state.profiles[state.activeProfileId]) {
    state.profiles[state.activeProfileId].gameState = null;
    saveProfiles();
  }
  state.selectedJob = null;
  showScreen('job');
}

function confirmQuit() {
  if (confirm('Avsluta spelet? Ditt framsteg sparas automatiskt.')) {
    clearAllTimers();
    state.gameRunning = false;
    saveCurrentGame();
    showScreen('profiles');
  }
}

function clearAllTimers() {
  clearTimeout(state.monthTimer);
  clearTimeout(state.eventTimer);
  clearTimeout(state.interactionScheduled);
  clearTimeout(state.interactionTimer);
}

// ─────────────────────────────────────────
//  UI UPDATES
// ─────────────────────────────────────────
function updateBalance(bump = false) {
  const el = document.getElementById('balance-display');
  el.textContent = fmt(state.balance);
  if (bump) {
    el.classList.remove('bump');
    void el.offsetWidth; // reflow
    el.classList.add('bump');
  }

  // Month change sub-label
  const net = state.mNetIncome - state.mFixed - state.mRecurring - state.mEvents;
  const sub = document.getElementById('balance-month-change');
  if (net !== 0) {
    sub.textContent = 'Denna månad: ' + (net >= 0 ? '+' : '') + fmt(net);
    sub.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
  } else {
    sub.textContent = '';
  }

  updateGoalDisplay();
}

function updateTopBar() {
  document.getElementById('top-month').textContent = `Månad ${state.month + 1}/${TOTAL_MONTHS}`;
  document.getElementById('month-name-display').textContent = `${MONTH_NAMES[state.month]} 2025`;
}

function updateJobCard() {
  const j = state.job;
  document.getElementById('game-job-emoji').textContent = j.emoji;
  document.getElementById('game-job-name').textContent  = j.name;
  document.getElementById('pay-track').style.display    = j.type !== 'delivery' && j.type !== 'freelancer' ? 'block' : 'none';
}

function updateGoalDisplay() {
  const g = state.goal;
  const sec = document.getElementById('goal-section');
  if (!g || !g.amount) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  document.getElementById('goal-emoji-display').textContent   = g.emoji;
  document.getElementById('goal-name-display').textContent    = g.name;
  document.getElementById('goal-target-display').textContent  = '/ ' + fmt(g.amount);
  const cur = Math.max(0, Math.min(state.balance, g.amount));
  const pct = Math.min(100, Math.round(cur / g.amount * 100));
  document.getElementById('goal-current-display').textContent = fmt(cur);
  document.getElementById('goal-percent-display').textContent = pct + '%';
  document.getElementById('goal-progress-fill').style.width   = pct + '%';
}

function updateOverview() {
  const gross = state.mIncome;
  const tax   = state.mTax;
  const net   = state.mNetIncome;

  document.getElementById('ov-gross').textContent      = gross > 0 ? '+' + fmt(gross) : '0 kr';
  document.getElementById('ov-tax').textContent        = tax   > 0 ? '−' + fmt(tax)   : '0 kr';
  document.getElementById('ov-net-income').textContent = fmt(net);

  // Recurring
  const recurEl = document.getElementById('ov-recurring-rows');
  recurEl.innerHTML = state.recurringCosts.map(rc =>
    `<div class="ov-row negative-row"><span>${rc.name}</span><span>−${fmt(rc.amount)}</span></div>`
  ).join('');

  // Events
  const evRow = document.getElementById('ov-events-row');
  if (state.mEvents > 0) {
    evRow.style.display = 'flex';
    document.getElementById('ov-events').textContent = '−' + fmt(state.mEvents);
  } else {
    evRow.style.display = 'none';
  }

  // Net
  const totalOut = FIXED_EXPENSES.rent + FIXED_EXPENSES.food +
    state.recurringCosts.reduce((a, rc) => a + rc.amount, 0) + state.mEvents;
  const monthNet = net - totalOut;
  const netEl = document.getElementById('ov-net');
  netEl.innerHTML = `<b>${(monthNet >= 0 ? '+' : '') + fmt(monthNet)}</b>`;
  netEl.style.color = monthNet >= 0 ? 'var(--green)' : 'var(--red)';
}

function toggleOverview(headerEl) {
  const body = document.getElementById('overview-body');
  state.overviewOpen = !state.overviewOpen;
  body.classList.toggle('open', state.overviewOpen);
  headerEl.classList.toggle('open', state.overviewOpen);
}

// ─────────────────────────────────────────
//  EVENT LOG
// ─────────────────────────────────────────
function addLog(desc, amount, positive) {
  const log = document.getElementById('event-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  let amtText = '', amtClass = '';
  if (amount > 0)  { amtText = '+' + fmt(amount); amtClass = 'pos'; }
  if (amount < 0)  { amtText = fmt(amount); amtClass = 'neg'; }

  entry.innerHTML = `<span class="log-desc">${desc}</span>
    ${amtText ? `<span class="log-amt ${amtClass}">${amtText}</span>` : ''}`;

  log.insertBefore(entry, log.firstChild);

  // Keep max 10 entries
  while (log.children.length > 10) log.removeChild(log.lastChild);
}

function clearLog() {
  document.getElementById('event-log').innerHTML = '';
}

// ─────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────
function showToast(msg, type = 'info') {
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);

  setTimeout(() => {
    t.style.transition = 'opacity 0.4s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 400);
  }, 2500);
}

// ─────────────────────────────────────────
//  COIN BURST ANIMATION
// ─────────────────────────────────────────
function burstCoins() {
  const container = document.getElementById('coin-burst');
  const coins = ['🪙','💰','✨','⭐'];
  for (let i = 0; i < 10; i++) {
    const c = document.createElement('div');
    c.className = 'burst-coin';
    c.textContent = randItem(coins);
    const dx = (Math.random() - 0.5) * 200;
    const dy = -(Math.random() * 150 + 80);
    c.style.cssText = `left:${30 + Math.random()*40}%;top:40%;--dx:${dx}px;--dy:${dy}px;animation-delay:${i*50}ms`;
    container.appendChild(c);
    setTimeout(() => c.remove(), 900);
  }
}

// ─────────────────────────────────────────
//  SOUND TOGGLE
// ─────────────────────────────────────────
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  document.getElementById('sound-btn').textContent = state.soundEnabled ? '🔊' : '🔇';
}

// ─────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────
function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  // Init audio on first interaction
  document.addEventListener('click', () => { initAudio(); }, { once: true });
});
