'use strict';
/* ══════════════════════════════════════════
   LIVET SOM SPEL — game.js
   ══════════════════════════════════════════ */

// ─────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────
const MONTH_DURATION   = 60000;  // 60 active seconds = 1 game month (pauses during events)
const TOTAL_MONTHS     = 12;
const TAX_RATE         = 0.30;
const STARTING_BALANCE = 2000;
const TICK_MS          = 200;

const FIXED_EXPENSES = {
  rent: 4000,
  // Food is now handled via real-time meal pings
};

const MONTH_NAMES = [
  'Januari','Februari','Mars','April','Maj','Juni',
  'Juli','Augusti','September','Oktober','November','December'
];

// 30 days × 3 meals = 90 meal pings per month
const DAYS_PER_MONTH = 30;
const DAILY_MEALS = [
  { dayOffset: 0.15, label: 'Frukost', emoji: '🥣', minCost: 18, maxCost: 42 },
  { dayOffset: 0.50, label: 'Lunch',   emoji: '🥪', minCost: 35, maxCost: 75 },
  { dayOffset: 0.85, label: 'Middag',  emoji: '🍝', minCost: 50, maxCost: 110 },
];

function buildMealSchedule() {
  const schedule = [];
  for (let day = 0; day < DAYS_PER_MONTH; day++) {
    const dayStart = day / DAYS_PER_MONTH;
    DAILY_MEALS.forEach(m => {
      schedule.push({
        atPct: dayStart + m.dayOffset / DAYS_PER_MONTH,
        label: m.label,
        emoji: m.emoji,
        minCost: m.minCost,
        maxCost: m.maxCost,
        day: day + 1,
      });
    });
  }
  return schedule;
}
const MEAL_SCHEDULE = buildMealSchedule();

// ─────────────────────────────────────────
//  JOBS (barn-vänliga termer)
// ─────────────────────────────────────────
const JOBS = [
  {
    id: 'cashier',
    emoji: '🛒',
    name: 'Butiksarbetare',
    color: '#4facfe',
    salary: 16000,
    salaryText: '16 000 kr/månad',
    periodText: 'Du får hela lönen sista dagen i månaden',
    desc: 'Du jobbar i mataffären och scannar varor i kassan. Lugnt och tryggt — men du måste vänta hela månaden på pengarna!',
    type: 'monthly',
    badges: ['Trygg lön', 'Vänta till slutet'],
    interactive: false,
  },
  {
    id: 'barista',
    emoji: '☕',
    name: 'Kaféjobbare',
    color: '#f093fb',
    salary: 14000,
    salaryText: '14 000 kr/månad',
    periodText: 'Du får lön varje vecka',
    desc: 'Du lagar kaffe och smörgåsar på ett coolt kafé. Lite lägre lön men du får pengar varje vecka — skönt!',
    type: 'weekly',
    payInterval: 15000,
    payAmount: 14000 / 4,
    badges: ['Veckopeng', 'Bra flöde'],
    interactive: false,
  },
  {
    id: 'delivery',
    emoji: '🚴',
    name: 'Matbudscyklist',
    color: '#fa709a',
    salary: 22000,
    salaryText: 'upp till 22 000 kr/månad',
    periodText: 'Du får betalt per leverans — tryck snabbt!',
    desc: 'Du cyklar runt och levererar mat till hungriga människor. Bra betalt — MEN du måste trycka snabbt när en order dyker upp!',
    type: 'delivery',
    deliveryInterval: [18000, 25000],
    deliveryAmount:   [1400, 1700, 2000, 2300, 2600],
    interactionTimeout: 8000,
    interactionEmoji: '🚴',
    interactionTitle: 'Ny leverans!',
    interactionLog:   '🚴 Leverans klar!',
    badges: ['Bra betalt', 'Tryck snabbt! 👆'],
    interactive: true,
  },
  {
    id: 'freelancer',
    emoji: '💻',
    name: 'Datanörd',
    color: '#43e97b',
    salary: 30000,
    salaryText: 'upp till 30 000 kr/månad',
    periodText: 'Du får betalt när du lämnar in ett jobb',
    desc: 'Du sitter hemma och fixar datorer och appar åt folk. Bra betalt — men du måste lämna in dina jobb i tid!',
    type: 'freelancer',
    projectInterval: [28000, 45000],
    projectAmount:   [6000, 8000, 10000, 12000, 15000],
    interactionTimeout: 12000,
    interactionEmoji: '💻',
    interactionTitle: 'Projekt klart!',
    interactionLog:   '💻 Jobb inlämnat!',
    badges: ['Stor lön', 'Hög risk! ⚡'],
    interactive: true,
  },
  {
    id: 'truck',
    emoji: '🚚',
    name: 'Lastbilschaufför',
    color: '#fd7943',
    salary: 24000,
    salaryText: '24 000 kr/månad',
    periodText: 'Du får lön varje vecka',
    desc: 'Du kör varor runt om i landet med en stor lastbil. Kul och frihet på vägarna — lönen trillar in varje vecka!',
    type: 'weekly',
    payInterval: 15000,
    payAmount: 24000 / 4,
    badges: ['Veckopeng', 'Friheten på vägen'],
    interactive: false,
  },
  {
    id: 'pilot',
    emoji: '✈️',
    name: 'Pilot',
    color: '#38b6ff',
    salary: 45000,
    salaryText: '45 000 kr/månad',
    periodText: 'Du får hela lönen sista dagen i månaden',
    desc: 'Du flyger plan till hela världen! Absolut bäst betalt — men lönen kommer bara en gång i månaden och du måste hålla koll på utgifterna!',
    type: 'monthly',
    badges: ['Högst lön! 🏆', 'Vänta till slutet'],
    interactive: false,
  },
  {
    id: 'gardener',
    emoji: '🌱',
    name: 'Trädgårdsarbetare',
    color: '#56ab2f',
    salary: 13000,
    salaryText: '13 000 kr/månad',
    periodText: 'Du får lön varje vecka',
    desc: 'Du sköter parker och trädgårdar, klipper gräs och planterar blommor. Lägst lön men lugnt och tryggt med pengarna varje vecka!',
    type: 'weekly',
    payInterval: 15000,
    payAmount: 13000 / 4,
    badges: ['Veckopeng', 'Lugnt & tryggt'],
    interactive: false,
  },
  {
    id: 'chef',
    emoji: '👨‍🍳',
    name: 'Kock',
    color: '#f7971e',
    salary: 19000,
    salaryText: 'upp till 19 000 kr/månad',
    periodText: 'Du får dricks direkt — tryck snabbt!',
    desc: 'Du lagar mat på en restaurang och gästerna älskar din mat! Lön PLUS dricks — men du måste hinna trycka när dricksen trillar in!',
    type: 'delivery',
    deliveryInterval: [14000, 22000],
    deliveryAmount:   [600, 800, 1000, 1300, 1600],
    interactionTimeout: 7000,
    interactionEmoji: '🍽️',
    interactionTitle: 'Dricks från gästen!',
    interactionLog:   '🍽️ Dricks!',
    badges: ['Dricks direkt', 'Tryck snabbt! 👆'],
    interactive: true,
  },
  {
    id: 'firefighter',
    emoji: '🚒',
    name: 'Brandman',
    color: '#e53935',
    salary: 26000,
    salaryText: 'upp till 26 000 kr/månad',
    periodText: 'Lön i månaden + bonus vid larm — svara snabbt!',
    desc: 'Du räddar liv och släcker bränder! Fast grundlön varje månad OCH bonuspengar när larmet går — men du måste svara DIREKT!',
    type: 'firefighter',
    salary: 26000,
    deliveryInterval: [20000, 35000],
    deliveryAmount:   [1000, 1500, 2000, 2500],
    interactionTimeout: 6000,
    interactionEmoji: '🚨',
    interactionTitle: 'LARM! Ryck ut!',
    interactionLog:   '🚒 Larm hanterat!',
    badges: ['Fast lön + bonus', 'Svara på larmet! 🚨'],
    interactive: true,
  },
  {
    id: 'gamer',
    emoji: '🎮',
    name: 'Proffs-Gamer',
    color: '#9b59b6',
    salary: 25000,
    salaryText: 'upp till 25 000 kr/månad',
    periodText: 'Du tjänar på donationer & turneringar — klicka snabbt!',
    desc: 'Du spelar spel på heltid och streamar live! Folk donerar pengar och du vinner turneringar — men du måste klicka DIREKT när pengarna trillar in!',
    type: 'delivery',
    deliveryInterval: [14000, 22000],
    deliveryAmount:   [500, 800, 1200, 1800, 2500],
    interactionTimeout: 7000,
    interactionEmoji: '🎮',
    interactionTitle: 'Donation från chatten!',
    interactionLog:   '🎮 Donation mottagen!',
    badges: ['Drömjobbet?', 'Klicka nu! 👆'],
    interactive: true,
  },
  {
    id: 'garbage',
    emoji: '🗑️',
    name: 'Sophämtare',
    color: '#78909c',
    salary: 18000,
    salaryText: '18 000 kr/månad',
    periodText: 'Du får lön varje vecka',
    desc: 'Du hämtar sopor tidigt på morgonen och håller stan ren. Viktigt jobb! Lönen trillar in varje vecka och det är alltid arbete.',
    type: 'weekly',
    payInterval: 15000,
    payAmount: 18000 / 4,
    badges: ['Veckopeng', 'Alltid jobb'],
    interactive: false,
  },
  {
    id: 'photographer',
    emoji: '📷',
    name: 'Fotograf',
    color: '#ff6b9d',
    salary: 20000,
    salaryText: 'upp till 20 000 kr/månad',
    periodText: 'Du får betalt per uppdrag — ta jobbet snabbt!',
    desc: 'Du fotograferar bröllop, familjer och företag. Kreativt och roligt — men uppdragen måste bokas snabbt annars går de till en annan fotograf!',
    type: 'freelancer',
    projectInterval: [22000, 38000],
    projectAmount:   [2500, 4000, 5500, 7000, 9000],
    interactionTimeout: 10000,
    interactionEmoji: '📷',
    interactionTitle: 'Nytt fotobokning!',
    interactionLog:   '📷 Fotsession klar!',
    badges: ['Kreativt jobb', 'Boka snabbt! 👆'],
    interactive: true,
  },
  {
    id: 'doctor',
    emoji: '👨‍⚕️',
    name: 'Läkare',
    color: '#00bcd4',
    salary: 65000,
    salaryText: '65 000 kr/månad',
    periodText: 'Du får hela lönen sista dagen i månaden',
    desc: 'Du räddar liv på sjukhuset varje dag! Extremt lång utbildning krävs — men lönen är en av de allra högsta. Tålamod lönar sig!',
    type: 'monthly',
    badges: ['Näst högst lön', 'Vänta till slutet'],
    interactive: false,
  },
  {
    id: 'dentist',
    emoji: '🦷',
    name: 'Tandläkare',
    color: '#26c6da',
    salary: 55000,
    salaryText: '55 000 kr/månad',
    periodText: 'Du får hela lönen sista dagen i månaden',
    desc: 'Du tar hand om folks tänder och ser till att alla ler! Hög lön och folk behöver alltid tandvård — ett tryggt val med riktigt bra betalt.',
    type: 'monthly',
    badges: ['Hög lön', 'Vänta till slutet'],
    interactive: false,
  },
  {
    id: 'taxi',
    emoji: '🚕',
    name: 'Taxichaufför',
    color: '#ffc107',
    salary: 20000,
    salaryText: 'upp till 20 000 kr/månad',
    periodText: 'Du får betalt per körning — acceptera snabbt!',
    desc: 'Du kör folk dit de ska i stan, dag och natt! Varje körning ger pengar direkt — men du måste trycka snabbt när en ny passagerare bokar!',
    type: 'delivery',
    deliveryInterval: [10000, 18000],
    deliveryAmount:   [250, 350, 450, 600, 800],
    interactionTimeout: 7000,
    interactionEmoji: '🚕',
    interactionTitle: 'Ny passagerare!',
    interactionLog:   '🚕 Körning klar!',
    badges: ['Ofta inkomst', 'Tryck snabbt! 👆'],
    interactive: true,
  },
  {
    id: 'officer',
    emoji: '🪖',
    name: 'Officer',
    color: '#546e7a',
    salary: 35000,
    salaryText: '35 000 kr/månad',
    periodText: 'Du får hela lönen sista dagen i månaden',
    desc: 'Du leder soldater och skyddar landet i militären. Hedersamt och viktigt jobb med stabil månadslön — plus fria resor och kost!',
    type: 'monthly',
    badges: ['Stabil lön', 'Vänta till slutet'],
    interactive: false,
  },
  {
    id: 'electrician',
    emoji: '⚡',
    name: 'Elektriker',
    color: '#ffeb3b',
    salary: 28000,
    salaryText: '28 000 kr/månad',
    periodText: 'Du får lön varje vecka',
    desc: 'Du installerar el och fixar kablar i hus och byggnader. Alltid massor av jobb, bra lön och veckopeng — ett av samhällets viktigaste yrken!',
    type: 'weekly',
    payInterval: 15000,
    payAmount: 28000 / 4,
    badges: ['Veckopeng', 'Alltid jobb ⚡'],
    interactive: false,
  },
  {
    id: 'police',
    emoji: '👮',
    name: 'Polis',
    color: '#1565c0',
    salary: 30000,
    salaryText: '30 000 kr/månad',
    periodText: 'Du får hela lönen sista dagen i månaden',
    desc: 'Du håller ordning och trygghet i samhället. Viktigt och spännande jobb med stabil månadslön — du är en hjälte för alla!',
    type: 'monthly',
    badges: ['Trygg lön', 'Vänta till slutet'],
    interactive: false,
  },
  {
    id: 'golfer',
    emoji: '⛳',
    name: 'Golfspelare',
    color: '#2e7d32',
    salary: 50000,
    salaryText: 'upp till 50 000 kr/månad',
    periodText: 'Du vinner pengar på turneringar — tryckt snabbt!',
    desc: 'Du spelar golf på professionell nivå och tävlar i turneringar! Kan ge massor av pengar — men också ingenting. Hög risk, hög belöning!',
    type: 'freelancer',
    projectInterval: [25000, 45000],
    projectAmount:   [1000, 5000, 12000, 25000, 50000],
    interactionTimeout: 9000,
    interactionEmoji: '⛳',
    interactionTitle: 'Turnering pågår!',
    interactionLog:   '⛳ Turnering klar!',
    badges: ['Hög risk ⚡', 'Stor vinst möjlig!'],
    interactive: true,
  },
  {
    id: 'astronaut',
    emoji: '🚀',
    name: 'Astronaut',
    color: '#0d47a1',
    salary: 80000,
    salaryText: '80 000 kr/månad',
    periodText: 'Du får hela lönen sista dagen i månaden',
    desc: 'Du åker ut i rymden och utforskar universum! Det kräver MASSOR av utbildning — men du har världens häftigaste jobb och den allra högsta lönen i spelet! 🌌',
    type: 'monthly',
    badges: ['HÖGST lön! 🏆🚀', 'Vänta till slutet'],
    interactive: false,
  },
];

// ─────────────────────────────────────────
//  GOALS
// ─────────────────────────────────────────
const GOALS = [
  { id: 'pc',       emoji: '🖥️', name: 'Gaming-PC',       amount: 15000, color: '#4facfe' },
  { id: 'phone',    emoji: '📱', name: 'Ny smartphone',    amount: 8000,  color: '#fa709a' },
  { id: 'vacation', emoji: '✈️', name: 'Semesterresa',     amount: 20000, color: '#f093fb' },
  { id: 'bike',     emoji: '🚲', name: 'Ny cykel',         amount: 5000,  color: '#43e97b' },
  { id: 'console',  emoji: '🎮', name: 'Spelkonsol',       amount: 6000,  color: '#ffd700' },
  { id: 'custom',   emoji: '⭐', name: 'Eget sparmål',     amount: null,  color: '#ff9f43' },
];

// ─────────────────────────────────────────
//  EVENTS (barn-vänliga + massor av nya!)
// ─────────────────────────────────────────
const EVENTS = [
  // ── KOMPISAR ──
  {
    id: 'bio',
    emoji: '🎬😎',
    title: 'Bio med kompisar!',
    desc: 'Dina kompisar ska gå och se den nya superhjältefilmen! Biljett + popcorn = 150 kr. Följer du med?',
    choices: [
      { text: '🍿 Ja, jag är med!',             detail: '−150 kr', effect: -150, type: 'negative', msg: 'Vilken bra film! 🎬' },
      { text: '😔 Nej, jag sparar pengarna',     detail: '±0 kr',   effect: 0,   type: 'neutral',  msg: 'Smart! Du kan se den när den kommer på streaming.' },
    ],
  },
  {
    id: 'pokemon',
    emoji: '🃏✨',
    title: 'Pokémonkort på affären!',
    desc: 'I affären finns ett nytt paket Pokémonkort för 79 kr. Kompisen hittar alltid rare-kort! Köper du?',
    choices: [
      { text: '⚡ Köp ett paket!',               detail: '−79 kr',  effect: -79,  type: 'negative', msg: 'Du fick ett Pikachu! 🎉' },
      { text: '🤩 Köp TRE paket!',               detail: '−237 kr', effect: -237, type: 'negative', msg: 'Du fick massa kort men... 237 kr är mycket!' },
      { text: '😤 Nej, jag sparar',              detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Du sparade dina pengar. Klok!' },
    ],
  },
  {
    id: 'godis',
    emoji: '🍬🍭',
    title: 'Lördagsgodis!',
    desc: 'Det är lördag och alla i klassen köper godis! Lösviktsgodis kostar ungefär 1 kr/gram.',
    choices: [
      { text: '🍬 Litet påse (100g)',             detail: '−29 kr',  effect: -29,  type: 'negative', msg: 'Mmm gott! Lagom mängd.' },
      { text: '🎃 Stor påse (300g)',              detail: '−85 kr',  effect: -85,  type: 'negative', msg: 'Mycket godis... magen är nöjd men plånboken gråter.' },
      { text: '💪 Nej, inget godis idag',         detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Dina tänder tackar dig! Och din plånbok.' },
    ],
  },
  {
    id: 'bowling',
    emoji: '🎳🎉',
    title: 'Bowling med gänget!',
    desc: 'Tre kompisar vill gå och bowla på fredag kväll. Det kostar 120 kr per person plus lite mat.',
    choices: [
      { text: '🎳 Självklart, strika!',           detail: '−180 kr', effect: -180, type: 'negative', msg: 'STRIKA! Vilken kul kväll!' },
      { text: '😅 Nej, för dyrt nu',              detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Nästa gång! Du sparar till något viktigt.' },
    ],
  },
  {
    id: 'glass',
    emoji: '🍦☀️',
    title: 'Glass i solen!',
    desc: 'Det är superjättevarmt ute och glassvagnen är här! En kula kostar 20 kr.',
    choices: [
      { text: '🍦 En kula — lagom!',              detail: '−20 kr',  effect: -20,  type: 'negative', msg: 'Mmm, jordgubbsglass! 😋' },
      { text: '🍨 Tre kulor — max!',              detail: '−55 kr',  effect: -55,  type: 'negative', msg: 'Lite dyrt men VÄRT DET!' },
      { text: '💪 Ingen glass idag',              detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Du går hem och tar ett glas vatten istället. Hälsosamt!' },
    ],
  },
  {
    id: 'skatepark',
    emoji: '🛹😎',
    title: 'Skatepark med kompisar!',
    desc: 'Kompisarna åker till skateparken! Det är gratis att åka men du vill ha en ny trick-deck för 400 kr.',
    choices: [
      { text: '🛹 Köp ny deck!',                  detail: '−400 kr', effect: -400, type: 'negative', msg: 'Snygg! Men kom ihåg att det var dyrt.' },
      { text: '😎 Åk med din gamla board',        detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Skateparken är lika rolig utan ny board!' },
    ],
  },
  {
    id: 'hamburger',
    emoji: '🍔🤩',
    title: 'Hamburgare efter skolan!',
    desc: 'Hela gänget ska till hamburgerrestaurangen efter skolan. En meny kostar 105 kr.',
    choices: [
      { text: '🍔 Japp! Dubbelburger!',           detail: '−105 kr', effect: -105, type: 'negative', msg: 'Nomnom! 🍔' },
      { text: '😌 Jag äter hemma istället',       detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Smart! Hemlagat är billigare.' },
    ],
  },
  {
    id: 'minecraft_skin',
    emoji: '⛏️💎',
    title: 'Nytt Minecraft-skin!',
    desc: 'Det finns ett coolt nytt skin i Minecraft-butiken för 50 Minecoin = ca 45 kr. Köpa?',
    choices: [
      { text: '💎 Köp skinnet!',                  detail: '−45 kr',  effect: -45,  type: 'negative', msg: 'Du ser épik ut nu! 😎' },
      { text: '🤷 Standardskin är okej',           detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Steve är en klassiker!' },
    ],
  },
  {
    id: 'roblox',
    emoji: '🎮💸',
    title: 'Robux i Roblox!',
    desc: 'Det finns ett supercoolt paket i ditt favoritspel i Roblox för 400 Robux = ca 50 kr.',
    choices: [
      { text: '🚀 Köp Robux!',                    detail: '−50 kr',  effect: -50,  type: 'negative', msg: 'Du ser grym ut i spelet!' },
      { text: '😎 Gratis-grejer räcker',           detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Spelet är kul utan köp också!' },
    ],
  },
  {
    id: 'fotboll',
    emoji: '⚽🏃',
    title: 'Fotbollsmatch!',
    desc: 'Ditt lag ska spela en viktig match! Det kostar 80 kr för buss + mat under matchen.',
    choices: [
      { text: '⚽ Självklart, vi kör!',            detail: '−80 kr',  effect: -80,  type: 'negative', msg: 'GOOOL! Bästa känslan!' },
      { text: '📺 Jag tittar hemma på TV',         detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Matchen sändes på TV! Du sparade 80 kr.' },
    ],
  },
  {
    id: 'leksaksaffar',
    emoji: '🧸🛍️',
    title: 'Leksaksaffären!',
    desc: 'Du går förbi leksaksaffären och ser ett cool LEGO-set i fönstret för 350 kr. Ingå det i din plan?',
    choices: [
      { text: '🧱 Köp LEGO-setet!',               detail: '−350 kr', effect: -350, type: 'negative', msg: 'Bygga, bygga, bygga! 🏗️' },
      { text: '📸 Ta en bild och gå vidare',       detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Du sparar och köper det när du har råd!' },
    ],
  },
  {
    id: 'nöjesfält',
    emoji: '🎡🎢',
    title: 'Nöjesfält på lördag!',
    desc: 'Familjen ska till nöjesfältet! Det kostar 250 kr extra för extra-åkningar och mat utöver biljetterna.',
    choices: [
      { text: '🎢 Ja, ALLA åkningar!',             detail: '−250 kr', effect: -250, type: 'negative', msg: 'Vilken dag! Du är trött men lycklig. 😄' },
      { text: '😊 Bara det som ingår',             detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Det ingår massor! Du sparade 250 kr.' },
    ],
  },
  // ── OVÄNTADE SAKER ──
  {
    id: 'phone_broken',
    emoji: '📱💥',
    title: 'Telefonskärmen gick sönder!',
    desc: 'Aj! Du tappade telefonen och hela skärmen sprack. Vad gör du?',
    choices: [
      { text: '🔧 Laga den på reparationsbutiken',  detail: '−2 500 kr', effect: -2500, type: 'negative' },
      { text: '📱 Köp en begagnad telefon',          detail: '−1 200 kr', effect: -1200, type: 'negative' },
      { text: '😬 Lev med den spruckna skärmen',    detail: '±0 kr',     effect: 0,    type: 'neutral',  msg: 'Lite jobbigt att se — men pengarna är kvar!' },
    ],
  },
  {
    id: 'hittade_pengar',
    emoji: '💸🍀',
    title: 'Du hittade en hundralapp!',
    desc: 'Du hittade en 100-kronorssedel på marken utanför affären. Ingen verkar äga den!',
    choices: [
      { text: '💰 Plocka upp den!', detail: '+100 kr', effect: 100, type: 'positive', msg: 'Lyckodag! 🍀' },
    ],
  },
  {
    id: 'elrakning',
    emoji: '⚡💸',
    title: 'En extra räkning kom!',
    desc: 'Det var kallt den här månaden och du glömde stänga av lamporna. Extra elräkning!',
    choices: [
      { text: '📄 Betala räkningen', detail: '−800 kr', effect: -800, type: 'negative' },
    ],
  },
  {
    id: 'bonus',
    emoji: '🌟💰',
    title: 'Du fick bonus av chefen!',
    desc: 'Chefen tycker att du jobbat superbra den här månaden. Du får en bonus!',
    choices: [
      { text: '🙏 Tack så jättemycket!', detail: '+2 000 kr', effect: 2000, type: 'positive', msg: 'Hårt arbete lönar sig! ⭐' },
    ],
  },
  {
    id: 'kompis_fodelsdag',
    emoji: '🎂🎁',
    title: 'Kompisens födelsedag!',
    desc: 'Din bästa kompis fyller år! Vad ger du i present?',
    choices: [
      { text: '🎁 Fin present från affären',        detail: '−400 kr', effect: -400, type: 'negative', msg: 'Kompisen blir jätteglad! 🥳' },
      { text: '✉️ Handgjort kort + godis',          detail: '−50 kr',  effect: -50,  type: 'neutral',  msg: 'Personligt och snällt! ❤️' },
      { text: '😬 Ingenting (lite pinsamt...)',      detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Oj... man glömde...' },
    ],
  },
  {
    id: 'streaming',
    emoji: '📺🍿',
    title: 'Streamingtjänst?',
    desc: 'En streamingtjänst erbjuder massa filmer och serier för 150 kr/månad.',
    choices: [
      { text: '✅ Skaffa den!', detail: '−150 kr/mån', effect: -150, type: 'negative', recurring: true, recurringName: '📺 Streaming', msg: 'Nu kan du se massa grejer! Läggs till som månadskostnad.' },
      { text: '❌ Nej tack',    detail: '±0 kr',       effect: 0,    type: 'neutral',  msg: 'Du kan alltid låna inloggning av en kompis!' },
    ],
  },
  {
    id: 'spelköp',
    emoji: '🎮🔥',
    title: 'Nytt spel är ute!',
    desc: 'Det är release av det nya spelet som alla pratar om. Det kostar 600 kr.',
    choices: [
      { text: '🛒 Köp direkt!',                    detail: '−600 kr', effect: -600, type: 'negative', msg: 'Äntligen! Nu spela hela natten!' },
      { text: '⏳ Vänta tills det är på rea',      detail: '±0 kr',   effect: 0,    type: 'neutral',  msg: 'Smart! Det brukar kosta hälften efter ett par månader.' },
    ],
  },
  {
    id: 'tandlakare',
    emoji: '🦷😬',
    title: 'Ont i en tand!',
    desc: 'Du har haft ont i en tand i flera dagar. Tandläkaren kostar 1 200 kr.',
    choices: [
      { text: '🦷 Gå till tandläkaren', detail: '−1 200 kr', effect: -1200, type: 'negative', msg: 'Smart! Bättre att fixa det tidigt annars kan det bli ännu dyrare.' },
      { text: '🤞 Hoppas det går över',  detail: '±0 kr',    effect: 0,    type: 'neutral',  msg: 'Riskabelt men pengarna är kvar för nu...' },
    ],
  },
  {
    id: 'aktier',
    emoji: '📈🎲',
    title: 'Kompisen tipsar om aktier!',
    desc: '"Köp aktier i det här företaget! Det kan gå upp 50%!" Men det kan också sjunka lika mycket...',
    choices: [
      { text: '🎲 Satsa 2 000 kr!', detail: 'Chans eller risk...', effect: 'gamble', gambleAmt: 2000, gambleOdds: 0.5, gambleWin: 3800, type: 'negative', msg: '...' },
      { text: '🏦 För riskigt, sparar hellre', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Tryggt val! Att spara är som att vinna.' },
    ],
  },
  {
    id: 'sparkonto',
    emoji: '🏦💡',
    title: 'Banken erbjuder sparkonto!',
    desc: 'Banken kan ge dig ränta (extra pengar!) om du sätter in minst 3 000 kr på ett sparkonto.',
    choices: [
      { text: '💰 Öppna sparkonto (3 000 kr)', detail: '→ Pengarna växer!', effect: 'savings_account', savingsAmt: 3000, type: 'neutral', msg: 'Bra! Nu växer dina pengar av sig själva! 📈' },
      { text: '🤷 Ingen tack', detail: '±0 kr', effect: 0, type: 'neutral' },
    ],
  },
  {
    id: 'kompislaan',
    emoji: '🤝💸',
    title: 'Kompisen behöver låna pengar',
    desc: 'Din kompis har slut på pengar och ber att få låna 500 kr. Han lovar betala tillbaka nästa månad.',
    choices: [
      { text: '👍 Låna ut 500 kr', detail: '−500 kr (kanske?)', effect: -500, type: 'negative', msg: 'Schysst! Hoppas du får tillbaka dem...' },
      { text: '😕 Kan inte just nu', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Dina pengar, ditt val.' },
    ],
  },
  {
    id: 'kläder',
    emoji: '👕🏷️',
    title: 'Klädrea!',
    desc: '50% rea på ett populärt klädmärke! Kläder som kostar 1 200 kr nu för 600 kr.',
    choices: [
      { text: '🛍️ Handla för 600 kr', detail: '−600 kr', effect: -600, type: 'negative', msg: 'Snyggt OCH billigt!' },
      { text: '😌 Jag har kläder redan', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du är nöjd med det du har. Klokt!' },
    ],
  },
  {
    id: 'gym',
    emoji: '💪🏋️',
    title: 'Gymkort på rea!',
    desc: 'Gymmet nära dig säljer ett gymkort billigare nu! 2 000 kr för hela året.',
    choices: [
      { text: '💪 Köp gymkort', detail: '−2 000 kr', effect: -2000, type: 'negative', msg: 'Hälsosam investering! 💪' },
      { text: '🏃 Springer utomhus gratis', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Naturen är gratis och lika bra!' },
    ],
  },
  {
    id: 'secondhand',
    emoji: '♻️👕',
    title: 'Secondhand fynd!',
    desc: 'På Blocket säljer någon en knappt använd jakka för 300 kr (kostar 2 000 kr ny). Köpa?',
    choices: [
      { text: '✅ Köp jackan!', detail: '−300 kr', effect: -300, type: 'negative', msg: 'Bra deal OCH miljösmart!' },
      { text: '❌ Nej tack', detail: '±0 kr', effect: 0, type: 'neutral' },
    ],
  },
  {
    id: 'pizza',
    emoji: '🍕😋',
    title: 'Pizza med kompisar!',
    desc: 'Kompisar vill beställa pizza och kolla film hemma. Din del: 250 kr.',
    choices: [
      { text: '🍕 Ja! Pizza!', detail: '−250 kr', effect: -250, type: 'negative', msg: 'Myskväll! 🍕' },
      { text: '🏠 Jag lagar mat hemma', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Sparade 250 kr! Du kan fika imorgon istället.' },
    ],
  },
  {
    id: 'trampolinkpark',
    emoji: '🦘🎉',
    title: 'Trampolinkpark!',
    desc: 'Det finns en trampolinkpark i stan! En timme kostar 160 kr. Kompisarna är redan på väg dit!',
    choices: [
      { text: '🦘 Hoppa med!', detail: '−160 kr', effect: -160, type: 'negative', msg: 'BOING BOING! Jättekul!' },
      { text: '😅 Hoppar över', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du sparar 160 kr. Klokt!' },
    ],
  },
  {
    id: 'slime',
    emoji: '🟢✨',
    title: 'Slime-kit på affären!',
    desc: 'Du ser ett slime-kit för 95 kr. Det verkar riktigt roligt att göra hemma!',
    choices: [
      { text: '🟢 Köp det!', detail: '−95 kr', effect: -95, type: 'negative', msg: 'Grönt, gluggigt och kul! 🎨' },
      { text: '🤷 Nej tack', detail: '±0 kr', effect: 0, type: 'neutral' },
    ],
  },
  {
    id: 'konsert',
    emoji: '🎵🎤',
    title: 'Konsert!',
    desc: 'Ditt favoritband spelar i stan! En biljett kostar 800 kr.',
    choices: [
      { text: '🎤 Ja, det är värt det!', detail: '−800 kr', effect: -800, type: 'negative', msg: 'Vilken konsert! 🎉' },
      { text: '🎧 Lyssnar hemma gratis', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du lyssnar på dem på Spotify istället.' },
    ],
  },
  {
    id: 'simhallen',
    emoji: '🏊💦',
    title: 'Simhallen!',
    desc: 'Kompisarna ska simma! Inträdet kostar 60 kr.',
    choices: [
      { text: '💦 Hoppa i!', detail: '−60 kr', effect: -60, type: 'negative', msg: 'SPLASH! Superkul 🏊' },
      { text: '😌 En annan gång', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Nästa vecka kanske!' },
    ],
  },
  {
    id: 'snacks_butiken',
    emoji: '🧃🍫',
    title: 'Snacks i affären!',
    desc: 'Du är sugen på snacks — chips, choklad och en läsk. Totalt ca 55 kr.',
    choices: [
      { text: '🍫 Köp alltihop!', detail: '−55 kr', effect: -55, type: 'negative', msg: 'Nom nom! Gott men dyrt för snacks.' },
      { text: '🍫 Bara chokladen', detail: '−20 kr', effect: -20, type: 'neutral', msg: 'Lagom! Lite gott kostar lite.' },
      { text: '💪 Inget idag', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Starkt! Du klarar dig utan.' },
    ],
  },
  {
    id: 'skolresa',
    emoji: '🚌🏛️',
    title: 'Skolresa!',
    desc: 'Klassen ska på utflykt till ett museum. Det kostar 120 kr för buss och inträde.',
    choices: [
      { text: '🏛️ Häng med!', detail: '−120 kr', effect: -120, type: 'negative', msg: 'Kul dag med klassen!' },
      { text: '😔 Jag stannar hemma', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du missar utflykten men sparar 120 kr.' },
    ],
  },
  {
    id: 'app_kop',
    emoji: '📲💳',
    title: 'Ny app med köp!',
    desc: 'En rolig app du laddat ned har ett specialerbjudande — ta bort reklam för 29 kr.',
    choices: [
      { text: '✅ Köp, slipp reklam!', detail: '−29 kr', effect: -29, type: 'negative', msg: 'Skönt utan reklam!' },
      { text: '😤 Reklam är okej', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Gratis är gratis!' },
    ],
  },
  {
    id: 'tips_kompis',
    emoji: '💡🤑',
    title: 'Kompisen gav dig ett tips!',
    desc: 'Din kompis berättar att grannens hund behöver rastvakt i helgen. De betalar 200 kr!',
    choices: [
      { text: '🐕 Självklart, jag gör det!', detail: '+200 kr', effect: 200, type: 'positive', msg: 'Ruff! 🐕 Du tjänade 200 kr på att rasta hunden.' },
      { text: '😴 Orkar inte', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du vilar dig. Pengar är pengar...' },
    ],
  },
  {
    id: 'byta_prylar',
    emoji: '🔄🎮',
    title: 'Byta prylar med kompisen!',
    desc: 'Kompisen vill byta sitt gamla spel mot ditt. Hans spel är värt 150 kr mer. Gör du affären?',
    choices: [
      { text: '🤝 Ja, bra deal!', detail: '+150 kr', effect: 150, type: 'positive', msg: 'Smart byteshandel! +150 kr i värde.' },
      { text: '🙅 Nej, jag gillar mitt', detail: '±0 kr', effect: 0, type: 'neutral' },
    ],
  },
  {
    id: 'cykel_vadar',
    emoji: '🌧️🚲',
    title: 'Det öser ner!',
    desc: 'Det regnar jättemycket. Du kan ta buss för 25 kr eller cykla och bli blöt.',
    choices: [
      { text: '🚌 Ta bussen', detail: '−25 kr', effect: -25, type: 'negative', msg: 'Torr och nöjd! Men 25 kr borta.' },
      { text: '🚲 Cykla & bli blöt', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du är blöt men har pengarna kvar!' },
    ],
  },
  {
    id: 'youtube_premium',
    emoji: '▶️✨',
    title: 'YouTube utan reklam!',
    desc: 'Du kan skaffa YouTube Premium för 79 kr/månad och slippa alla reklamer.',
    choices: [
      { text: '▶️ Skaffa Premium!', detail: '−79 kr/mån', effect: -79, type: 'negative', recurring: true, recurringName: '▶️ YouTube Premium', msg: 'Inga fler reklamer! Läggs till som månadskostnad.' },
      { text: '😤 Reklam går bra', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Spola förbi reklamen istället!' },
    ],
  },
  {
    id: 'fika_kompis',
    emoji: '🥐☕',
    title: 'Fika med kompisen!',
    desc: 'Kompisen vill ta en fika på kaféet efter skolan. En bulle + juice kostar 55 kr.',
    choices: [
      { text: '🥐 Fika!', detail: '−55 kr', effect: -55, type: 'negative', msg: 'Gott och mysigt! 🥐' },
      { text: '💧 Bara vatten, tack', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du dricker vatten gratis och sparar 55 kr!' },
    ],
  },
  {
    id: 'hittat_coupon',
    emoji: '🎟️🤩',
    title: 'Du hittade en kupong!',
    desc: 'Du hittade en kupong i en gammal jacka — 200 kr att använda i din favoritaffär!',
    choices: [
      { text: '🛍️ Använd kupongen!', detail: '+200 kr', effect: 200, type: 'positive', msg: 'Jackpot! Fri shopping för 200 kr 🎉' },
    ],
  },
  {
    id: 'tappade_pengar',
    emoji: '😱💸',
    title: 'Du tappade pengar!',
    desc: 'Du märker att 150 kr försvann ur fickan. De är borta för alltid...',
    choices: [
      { text: '😢 Okay, pech...', detail: '−150 kr', effect: -150, type: 'negative', msg: 'Läxa lärd — ha alltid plånboken i innerfickan!' },
    ],
  },
  {
    id: 'klippa_grasmat',
    emoji: '🌿💰',
    title: 'Grannen vill ha hjälp!',
    desc: 'Grannen frågar om du kan klippa gräsmattan för 150 kr. Det tar en timme.',
    choices: [
      { text: '🌿 Visst, inga problem!', detail: '+150 kr', effect: 150, type: 'positive', msg: 'Fint jobbat! 150 kr på fickan.' },
      { text: '😴 Orkar inte idag', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du vilar. Nästa gång kanske!' },
    ],
  },
  {
    id: 'spotify',
    emoji: '🎵💚',
    title: 'Spotify Student!',
    desc: 'Spotify har ett studentpris på 55 kr/mån (halva priset). Skaffa?',
    choices: [
      { text: '🎵 Ja, musiken måste till!', detail: '−55 kr/mån', effect: -55, type: 'negative', recurring: true, recurringName: '🎵 Spotify', msg: 'All musik i världen! Läggs till som månadskostnad.' },
      { text: '😎 Jag lyssnar på gratis-Spotify', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Reklam men gratis!' },
    ],
  },
  {
    id: 'fodelsedag_sjalv',
    emoji: '🎂🎉',
    title: 'Det är din födelsedag!',
    desc: 'Grattis! Du fick pengar i present av farmor och farfar!',
    choices: [
      { text: '🎂 Tack!! 🎉', detail: '+500 kr', effect: 500, type: 'positive', msg: 'Snälla farmor och farfar! +500 kr 🥳' },
    ],
  },
  {
    id: 'sald_grej',
    emoji: '📦💰',
    title: 'Du sålde en gammal grej!',
    desc: 'Du lade ut en gammal sak på Blocket och fick betalt!',
    choices: [
      { text: '💰 Bra!', detail: '+300 kr', effect: 300, type: 'positive', msg: 'Gammal grej → nya pengar! Smart.' },
    ],
  },
  {
    id: 'kino_hemma',
    emoji: '📽️🛋️',
    title: 'Hemmabiokväll!',
    desc: 'Du vill göra en riktig hemmabioupplevelse. Popcorn + läsk kostar 80 kr.',
    choices: [
      { text: '🍿 Köp godsakerna!', detail: '−80 kr', effect: -80, type: 'negative', msg: 'Perfekt filmkväll! 🎬' },
      { text: '😋 Bara film, inget godis', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Filmen är lika bra ändå!' },
    ],
  },
  {
    id: 'pokemon_rare',
    emoji: '⭐🃏',
    title: 'Rare Pokémonkort till salu!',
    desc: 'En klasskompis säljer ett sällsynt Pokémonkort för 250 kr. Det kan vara värt mer!',
    choices: [
      { text: '⭐ Köp det!', detail: '−250 kr', effect: -250, type: 'negative', msg: 'Kanske värt massor i framtiden... eller inte!' },
      { text: '🤷 Nej tack', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Spara pengarna till något säkrare!' },
    ],
  },
  {
    id: 'trasig_cykel2',
    emoji: '🚲😩',
    title: 'Punktering!',
    desc: 'Cykeldäcket gick sönder. Ett nytt däck kostar 120 kr. Annars får du gå.',
    choices: [
      { text: '🔧 Laga däcket', detail: '−120 kr', effect: -120, type: 'negative', msg: 'Bra! Nu rullar det igen.' },
      { text: '🚶 Jag går istället', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Lite längre väg men pengarna är kvar!' },
    ],
  },
  {
    id: 'vann_tavling',
    emoji: '🏆🎊',
    title: 'Du vann en tävling!',
    desc: 'Du deltog i en skoltävling och vann! Priset är ett presentkort på 400 kr.',
    choices: [
      { text: '🏆 Yeeees!', detail: '+400 kr', effect: 400, type: 'positive', msg: 'Du är grym! 🏆 +400 kr' },
    ],
  },
  {
    id: 'dyr_lunch',
    emoji: '🍱💸',
    title: 'Dyrt skolcafé!',
    desc: 'Idag är skolmaten slut. Du måste köpa lunch på cafét bredvid för 95 kr.',
    choices: [
      { text: '🍱 Köp lunch', detail: '−95 kr', effect: -95, type: 'negative', msg: 'Gott men dyrt!' },
      { text: '😤 Jag skippar lunch idag', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Du är hungrig men rik... ish.' },
    ],
  },
  {
    id: 'pengar_tillbaka',
    emoji: '💸🔄',
    title: 'Kompisen betalade tillbaka!',
    desc: 'Minns du att du lånade ut pengar? Nu betalar kompisen tillbaka 500 kr!',
    choices: [
      { text: '😊 Äntligen!', detail: '+500 kr', effect: 500, type: 'positive', msg: 'Schysst kompis! +500 kr tillbaka.' },
    ],
  },
  // ── EXTRA NYA HÄNDELSER ──
  {
    id: 'hittade_200',
    emoji: '🤑🛣️',
    title: 'Du hittade pengar på gatan!',
    desc: 'Kolla vad du hittade! En vikta 200-kronorssedel på trottoaren. Ingen är i närheten.',
    choices: [
      { text: '💰 Plocka upp!', detail: '+200 kr', effect: 200, type: 'positive', msg: 'Lyckodagen! 🍀 +200 kr!' },
    ],
  },
  {
    id: 'hjalp_granne_hund',
    emoji: '🐕🏃',
    title: 'Grannen behöver hundvakt!',
    desc: 'Grannen ska bort i helgen och behöver någon som tar hand om hunden Bella i tre dagar. Vad säger du?',
    choices: [
      { text: '🐕 Ja! Jag älskar hundar!', detail: '+450 kr', effect: 450, type: 'positive', msg: 'Bella är jättemysig! +450 kr för tre dagar. 🐾' },
      { text: '😴 Nej, för jobbigt', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Kanske nästa gång!' },
    ],
  },
  {
    id: 'musikfestival',
    emoji: '🎪🎶',
    title: 'Skolans musikfestival!',
    desc: 'Skolan anordnar en musikfestival med food trucks och livemusik. Inträde + mat = 180 kr.',
    choices: [
      { text: '🎶 Självklart, dit ska vi!', detail: '−180 kr', effect: -180, type: 'negative', msg: 'Vilken kul festival! 🎉' },
      { text: '😊 Jag lyssnar utifrån gratis', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Man hör musiken ändå! +0 kr.' },
    ],
  },
  {
    id: 'brorsan_lanar',
    emoji: '👦💸',
    title: 'Brorsan vill låna pengar!',
    desc: 'Din lillebror är sugen på glass men har inga pengar. Han tigger om 30 kr.',
    choices: [
      { text: '🍦 Okej, men bara denna gång!', detail: '−30 kr', effect: -30, type: 'negative', msg: 'Du är en snäll syskon! ❤️' },
      { text: '😅 Nej, han får klara sig', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Egna pengar, egna regler!' },
    ],
  },
  {
    id: 'fest_hemma',
    emoji: '🎉🏠',
    title: 'Fest hemma!',
    desc: 'Du ordnar en liten fest hemma med kompisarna. Snacks, läsk och spel kostar ca 300 kr.',
    choices: [
      { text: '🎉 Vi kör fest!', detail: '−300 kr', effect: -300, type: 'negative', msg: 'Bästa kvällen ever! 🎊' },
      { text: '🎮 Vi spelar spel utan snacks', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Spelen är roliga ändå! Sparade 300 kr.' },
    ],
  },
  {
    id: 'vinterjacka',
    emoji: '🧥❄️',
    title: 'Vinterjackan gick sönder!',
    desc: 'Dragkedjan på vinterjackan gick sönder mitt i kylan. Du kan laga den eller köpa ny.',
    choices: [
      { text: '🔧 Laga dragkedjan (100 kr)', detail: '−100 kr', effect: -100, type: 'negative', msg: 'Billig lösning! Bra tänkt.' },
      { text: '🧥 Köp ny jacka (1 200 kr)', detail: '−1 200 kr', effect: -1200, type: 'negative', msg: 'Snygg ny jacka! Men dyr.' },
      { text: '🥶 Använd fleecen', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Kallt men du sparar pengarna!' },
    ],
  },
  {
    id: 'tombola',
    emoji: '🎟️🏆',
    title: 'Du vann på tombolan!',
    desc: 'Skolan hade tombola och du vann ett presentkort! Tur att du köpte en lott!',
    choices: [
      { text: '🎉 Wooooo!', detail: '+300 kr', effect: 300, type: 'positive', msg: 'Grattis! +300 kr i presentkort! 🎟️' },
    ],
  },
  {
    id: 'hjalp_farmor',
    emoji: '🌸👵',
    title: 'Farmor behöver hjälp!',
    desc: 'Farmor behöver hjälp med att plantera blommor och rensa i trädgården. Jobbet tar två timmar.',
    choices: [
      { text: '🌸 Självklart! Jag hjälper farmor!', detail: '+250 kr', effect: 250, type: 'positive', msg: 'Farmor är jätteglad! Hon stoppar 250 kr i fickan på dig. ❤️' },
      { text: '😬 Nej, har andra planer', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Farmor fixar det själv.' },
    ],
  },
  {
    id: 'spelturnering',
    emoji: '🏆🎮',
    title: 'Spelturnering på fritidsgården!',
    desc: 'Det är en spelturnering på fritidsgården! Det kostar 100 kr att delta — men vinnaren får 1 000 kr!',
    choices: [
      { text: '🎮 Anmäl mig! (−100 kr)', detail: 'Chans på +1 000 kr!', effect: 'gamble', gambleAmt: 100, gambleOdds: 0.35, gambleWin: 1000, type: 'negative', msg: '...' },
      { text: '👀 Tittar på istället (gratis)', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Kul att titta! Du sparade 100 kr.' },
    ],
  },
  {
    id: 'katten_sjuk',
    emoji: '🐱💊',
    title: 'Katten mår inte bra!',
    desc: 'Din katt verkar halta och är ledsen. Veterinären kostar 900 kr men katten behöver hjälp.',
    choices: [
      { text: '🏥 Gå till veterinären', detail: '−900 kr', effect: -900, type: 'negative', msg: 'Katten är nu frisk! ❤️ Djur är ett ansvar.' },
      { text: '🤞 Hoppas det går över', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Riskabelt... men du har pengarna kvar.' },
    ],
  },
  {
    id: 'extrajobb_kvall',
    emoji: '🌙💼',
    title: 'Extra jobb en kväll!',
    desc: 'En granne behöver hjälp med att flytta möbler en fredag kväll. De betalar 500 kr!',
    choices: [
      { text: '💪 Jag tar jobbet!', detail: '+500 kr', effect: 500, type: 'positive', msg: 'Bra jobbat! 500 kr extra i fickan. 💪' },
      { text: '😴 Nej, jag är trött', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Vila är viktigt också!' },
    ],
  },
  {
    id: 'mataffar_for_mycket',
    emoji: '🛒😬',
    title: 'Du köpte för mycket!',
    desc: 'Du handlade mat utan lista och lade i massor av saker du inte behövde. 400 kr extra borta.',
    choices: [
      { text: '😬 Aj aj...', detail: '−400 kr', effect: -400, type: 'negative', msg: 'Läxa lärd: handla med lista! 📝' },
    ],
  },
  {
    id: 'kompis_bjuder_bio',
    emoji: '🎬🎁',
    title: 'Kompisen bjuder på bio!',
    desc: 'Kompisen fick presenter-pengar och vill bjuda DIG på bio! Gratis!',
    choices: [
      { text: '🍿 Tack så mycket!', detail: '±0 kr', effect: 0, type: 'positive', msg: 'Gratis bio! Vad en schysst kompis! 🎬' },
    ],
  },
  {
    id: 'kläder_nödvändigt',
    emoji: '👟🆕',
    title: 'Skorna är utslitna!',
    desc: 'Dina gymnastikskor har gått sönder och du behöver nya inför idrotten. Nya kostar 600 kr.',
    choices: [
      { text: '👟 Köp nya skor', detail: '−600 kr', effect: -600, type: 'negative', msg: 'Ibland måste man köpa det man behöver!' },
      { text: '🔧 Laga med tejp ett tag till', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Håller ett tag till med lite tejp! 😄' },
    ],
  },
  {
    id: 'fritidsgard',
    emoji: '🏓🎯',
    title: 'Fritidsgården öppnade!',
    desc: 'Fritidsgården har pingis, biljard och TV-spel — gratis! Men de säljer godis och läsk.',
    choices: [
      { text: '🏓 Åk dit + köp snacks (40 kr)', detail: '−40 kr', effect: -40, type: 'negative', msg: 'Kul kväll! Pingis-mästaren har slagit igen. 🏓' },
      { text: '🎯 Åk dit utan att köpa något', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'Gratis nöje! Bra drag.' },
      { text: '🏠 Stannar hemma', detail: '±0 kr', effect: 0, type: 'neutral', msg: 'En lugn kväll hemma.' },
    ],
  },
  {
    id: 'vann_lotteri',
    emoji: '🎰🤑',
    title: 'Du vann på skolans lotteri!',
    desc: 'Du köpte en lott för 20 kr på skolans välgörenhetsdag... och vann 1 000 kr!',
    choices: [
      { text: '🎉 JAAAAAA!', detail: '+980 kr (vinst)', effect: 980, type: 'positive', msg: 'Du vann! +980 kr netto! 🎊' },
    ],
  },
  {
    id: 'prestkort_mormor',
    emoji: '💌🎁',
    title: 'Presentkort från mormor!',
    desc: 'Mormor skickade ett presentkort på din favoritaffär — 500 kr att använda fritt!',
    choices: [
      { text: '😍 Tack mormor!', detail: '+500 kr', effect: 500, type: 'positive', msg: 'Snälla mormor! ❤️ +500 kr att shoppa för.' },
    ],
  },
];

// Tips efter varje månad
const MONTH_TIPS = [
  '💡 Om du sparar 1 000 kr/månad i 40 år med ränta kan det bli MILJONER!',
  '💡 "Betala dig själv först" — spara lite direkt när du får pengar!',
  '💡 Att laga mat hemma är mycket billigare än att alltid köpa färdig mat.',
  '💡 Tänk alltid: "Behöver jag detta, eller vill jag bara ha det?"',
  '💡 En liten buffert (extra pengar) skyddar dig om något oväntat händer.',
  '💡 Ränta på ränta — om pengar ger ränta, och räntan också ger ränta, växer det fort!',
  '💡 Skillnaden mellan att vilja ha och att behöva är nyckeln till bra ekonomi.',
  '💡 Hyran och maten kommer alltid — planera för dem!',
  '💡 Att köpa secondhand sparar pengar och är bra för miljön!',
  '💡 Spara INNAN du spenderar — inte tvärtom!',
];

const WISDOM = [
  { minSavings: 0.6, text: '🌟 Wow! Du sparade mer än hälften av allt du tjänade. Du är en riktig sparmästare! Med den disciplinen kan du köpa nästan vad som helst i framtiden.' },
  { minSavings: 0.4, text: '👍 Bra jobbat! Du sparade en stor del av dina pengar. Fortsätt så och du kommer ha massor av pengar när du behöver dem.' },
  { minSavings: 0.2, text: '📚 Du är på rätt väg! Försök spara ännu lite mer varje månad. Även 100 kr extra gör stor skillnad över tid!' },
  { minSavings: 0.05, text: '🤔 Du spenderade det mesta du tjänade. Kom ihåg: varje krona du sparar NU är värd mer än en krona du sparar om 10 år!' },
  { minSavings: -Infinity, text: '😬 Tufft år — men du lärde dig! Nu vet du vad som kostar pengar. Försök igen och sikta på att ha lite pengar kvar varje månad.' },
];

// ─────────────────────────────────────────
//  GAME STATE
// ─────────────────────────────────────────
let state = {
  profiles: {},
  activeProfileId: null,
  balance: STARTING_BALANCE,
  month: 0,
  year: 1,
  gameRunning: false,
  paused: false,
  // Monthly tracking
  mIncome: 0, mTax: 0, mNetIncome: 0,
  mFixed: 0, mEvents: 0, mRecurring: 0, mFood: 0,
  // All-time
  totalGross: 0, totalTax: 0, totalFixed: 0, totalEventCosts: 0, totalFood: 0,
  savingsAccountBalance: 0, savingsAccountInterest: 0,
  // Job
  job: null, payElapsed: 0,
  activeInteraction: null, interactionTimer: null,
  interactionScheduled: null,
  // Month timer (proper pause)
  monthElapsed: 0, monthLastTick: 0, monthTimer: null,
  // Events
  eventTimer: null, eventQueue: [], shownEventIds: [],
  recurringCosts: [],
  currentEvent: null,
  // Food pings
  foodPingsFired: [],
  // Cooking at home
  cookingAtHome: false,
  // Goal
  goal: null, goalReached: false,
  // Selection
  selectedAvatar: '😎', selectedJob: null,
  // Sound
  soundEnabled: true, musicEnabled: true,
  audioCtx: null, currentTrack: 0,
  // UI
  overviewOpen: false,
};

// ─────────────────────────────────────────
//  SOUND & MUSIC
// ─────────────────────────────────────────
// ─────────────────────────────────────────
//  MUSIC TRACKS (royalty-free, Kevin MacLeod)
// ─────────────────────────────────────────
const TRACKS = [
  { name: 'Carefree',                emoji: '😊', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3' },
  { name: 'Monkeys Spinning Monkeys', emoji: '🐒', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3' },
  { name: 'Sneaky Snitch',           emoji: '🕵️', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3' },
  { name: 'Pixelland',               emoji: '🎮', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Pixelland.mp3' },
  { name: 'Fluffing a Duck',         emoji: '🦆', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3' },
];
// Music by Kevin MacLeod (incompetech.com) — CC BY 4.0

function initAudio() {
  if (state.audioCtx) return;
  try {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    state.sfxGain  = state.audioCtx.createGain();
    state.sfxGain.connect(state.audioCtx.destination);
  } catch(e) {}
}

function playTone(freq, dur, type = 'sine', vol = 0.25, delay = 0) {
  if (!state.soundEnabled || !state.audioCtx) return;
  try {
    const ctx = state.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(state.sfxGain);
    osc.type = type; osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.05);
  } catch(e) {}
}

const SFX = {
  click:  () => playTone(660, 0.06, 'sine', 0.12),
  coin:   () => { playTone(880, 0.08); playTone(1100, 0.1, 'sine', 0.18, 0.08); },
  salary: () => { [523,659,784,1047].forEach((f,i) => playTone(f, 0.18, 'sine', 0.2, i*0.1)); },
  spend:  () => { playTone(330, 0.18, 'sawtooth', 0.15); playTone(220, 0.25, 'sawtooth', 0.1, 0.15); },
  event:  () => { playTone(660, 0.08); playTone(880, 0.15, 'sine', 0.18, 0.12); },
  alarm:  () => { [0,250,500].forEach(d => playTone(880, 0.12, 'square', 0.25, d/1000)); },
  month:  () => { [440,550,660].forEach((f,i) => playTone(f, 0.15, 'sine', 0.18, i*0.08)); },
  win:    () => { [523,659,784,1047,1319].forEach((f,i) => playTone(f, 0.22, 'sine', 0.2, i*0.11)); },
  goal:   () => { [523,659,784,1047,1319,1568].forEach((f,i) => playTone(f, 0.25, 'sine', 0.22, i*0.09)); },
  food:   () => { playTone(440, 0.06); playTone(550, 0.1, 'sine', 0.12, 0.07); },
};

function _audioEl() { return document.getElementById('bg-music'); }

function startMusic() {
  const el = _audioEl();
  if (!el) return;
  if (!state.musicEnabled || !state.soundEnabled) { el.pause(); return; }
  const track = TRACKS[state.currentTrack];
  if (!el.src || !el.src.includes(encodeURIComponent(track.name).replace(/%20/g,'%20'))) {
    el.src = track.url;
  }
  el.volume = 0.4;
  el.play().catch(() => {});
  showNowPlaying(track);
}

function stopMusic() {
  const el = _audioEl();
  if (el) el.pause();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  document.getElementById('sound-btn').textContent = state.soundEnabled ? '🔊' : '🔇';
  if (state.sfxGain) state.sfxGain.gain.value = state.soundEnabled ? 1 : 0;
  if (state.soundEnabled && state.musicEnabled) startMusic();
  else stopMusic();
}

function toggleMusic() {
  state.musicEnabled = !state.musicEnabled;
  const btn = document.getElementById('music-btn');
  btn.textContent = state.musicEnabled ? '🎵' : '🔕';
  btn.style.opacity = state.musicEnabled ? '1' : '0.5';
  if (state.musicEnabled && state.soundEnabled) startMusic();
  else stopMusic();
}

function nextTrack() {
  SFX.click();
  state.currentTrack = (state.currentTrack + 1) % TRACKS.length;
  const track = TRACKS[state.currentTrack];
  const el = _audioEl();
  if (el) {
    el.src = track.url;
    if (state.musicEnabled && state.soundEnabled) el.play().catch(() => {});
  }
  showNowPlaying(track);
}

function showNowPlaying(track) {
  let pill = document.getElementById('now-playing');
  if (!pill) return;
  pill.textContent = `${track.emoji} ${track.name}`;
  pill.classList.add('visible');
  clearTimeout(pill._timer);
  pill._timer = setTimeout(() => pill.classList.remove('visible'), 3000);
}

// ─────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────
const STORAGE_KEY = 'livet_som_spel_v2';

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
    balance: state.balance, month: state.month,
    mIncome: state.mIncome, mTax: state.mTax, mNetIncome: state.mNetIncome,
    mFixed: state.mFixed, mEvents: state.mEvents, mRecurring: state.mRecurring, mFood: state.mFood,
    totalGross: state.totalGross, totalTax: state.totalTax, totalFixed: state.totalFixed,
    totalEventCosts: state.totalEventCosts, totalFood: state.totalFood,
    savingsAccountBalance: state.savingsAccountBalance,
    savingsAccountInterest: state.savingsAccountInterest,
    jobId: state.job ? state.job.id : null,
    recurringCosts: state.recurringCosts,
    shownEventIds: state.shownEventIds,
    goal: state.goal, gameRunning: state.gameRunning,
    cookingAtHome: state.cookingAtHome, year: state.year,
  };
  saveProfiles();
}

// ─────────────────────────────────────────
//  SCREENS
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
//  PROFILES
// ─────────────────────────────────────────
function renderProfiles() {
  const list = document.getElementById('profiles-list');
  const ids  = Object.keys(state.profiles);
  if (ids.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;text-align:center;padding:0.5rem 0">Inga sparade spelare ännu!</p>';
    return;
  }
  list.innerHTML = ids.map(pid => {
    const p  = state.profiles[pid];
    const gs = p.gameState;
    const meta = gs ? `Månad ${gs.month + 1}/12 · ${fmt(gs.balance)}` : 'Nytt spel';
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
  state.profiles[pid] = { id: pid, name, avatar: state.selectedAvatar || '😎', created: Date.now(), gameState: null };
  saveProfiles();
  state.activeProfileId = pid;
  document.getElementById('player-name-input').value = '';
  showScreen('job');
}

function loadProfile(pid) {
  SFX.click();
  state.activeProfileId = pid;
  const p  = state.profiles[pid];
  const gs = p.gameState;
  if (gs && gs.gameRunning) { restoreGameState(gs); showScreen('game'); resumeGame(); }
  else if (gs && !gs.gameRunning) { restoreGameState(gs); showGameOver(); }
  else showScreen('job');
}

function deleteProfile(pid) {
  if (!confirm('Ta bort ' + state.profiles[pid].name + '?')) return;
  delete state.profiles[pid]; saveProfiles(); renderProfiles();
}

function restoreGameState(gs) {
  Object.assign(state, {
    balance: gs.balance, month: gs.month,
    mIncome: gs.mIncome||0, mTax: gs.mTax||0, mNetIncome: gs.mNetIncome||0,
    mFixed: gs.mFixed||0, mEvents: gs.mEvents||0, mRecurring: gs.mRecurring||0, mFood: gs.mFood||0,
    totalGross: gs.totalGross||0, totalTax: gs.totalTax||0, totalFixed: gs.totalFixed||0,
    totalEventCosts: gs.totalEventCosts||0, totalFood: gs.totalFood||0,
    savingsAccountBalance: gs.savingsAccountBalance||0,
    savingsAccountInterest: gs.savingsAccountInterest||0,
    job: JOBS.find(j => j.id === gs.jobId) || JOBS[0],
    recurringCosts: gs.recurringCosts||[], shownEventIds: gs.shownEventIds||[],
    goal: gs.goal||null, gameRunning: gs.gameRunning,
    cookingAtHome: gs.cookingAtHome || false, year: gs.year || 1,
  });
}

// ─────────────────────────────────────────
//  JOBS
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
      <div>${j.badges.map(b => `<span class="job-badge${b.includes('👆')||b.includes('⚡')?' interactive':''}">${b}</span>`).join('')}</div>
    </div>`).join('');
}

function selectJob(id) {
  SFX.click();
  state.selectedJob = JOBS.find(j => j.id === id);
  showScreen('goal');
}

// ─────────────────────────────────────────
//  GOALS
// ─────────────────────────────────────────
function renderGoals() {
  const grid = document.getElementById('goals-grid');
  grid.innerHTML = GOALS.map(g => `
    <div class="goal-select-card" style="--goal-color:${g.color}" onclick="selectGoal('${g.id}')">
      <span class="goal-emoji">${g.emoji}</span>
      <div class="goal-label">${g.name}</div>
      ${g.amount ? `<div class="goal-price">${fmt(g.amount)}</div>` : '<div class="goal-price">Eget</div>'}
    </div>`).join('');
  document.getElementById('custom-goal-form').style.display = 'none';
}

function selectGoal(id) {
  SFX.click();
  if (id === 'custom') { document.getElementById('custom-goal-form').style.display = 'flex'; return; }
  startGame(GOALS.find(x => x.id === id));
}

function setCustomGoal() {
  const name   = document.getElementById('custom-goal-name').value.trim();
  const amount = parseInt(document.getElementById('custom-goal-amount').value, 10);
  if (!name)   { showToast('Skriv ett namn!', 'info'); return; }
  if (!amount || amount < 500) { showToast('Ange ett belopp (minst 500 kr)!', 'info'); return; }
  startGame({ id: 'custom', emoji: '⭐', name, amount, color: '#ff9f43' });
}

// ─────────────────────────────────────────
//  GAME START / RESUME
// ─────────────────────────────────────────
function startGame(goal) {
  SFX.click();
  Object.assign(state, {
    balance: STARTING_BALANCE, month: 0, year: 1, gameRunning: true, paused: false,
    mIncome:0,mTax:0,mNetIncome:0,mFixed:0,mEvents:0,mRecurring:0,mFood:0,
    totalGross:0,totalTax:0,totalFixed:0,totalEventCosts:0,totalFood:0,
    savingsAccountBalance:0,savingsAccountInterest:0,
    job: state.selectedJob || JOBS[0],
    recurringCosts:[], shownEventIds:[], eventQueue: shuffleEvents(),
    goal, monthElapsed:0, monthLastTick: Date.now(),
    payElapsed:0, activeInteraction:null, overviewOpen:false,
    foodPingsFired:[], goalReached:false, cookingAtHome:false,
  });
  showScreen('game');
  initGameUI();
  startMonthTimer();
  scheduleNextEvent();
  if (state.job.interactive) scheduleNextInteraction();
  startMusic();
  saveCurrentGame();
}

function resumeGame() {
  state.gameRunning  = true;
  state.eventQueue   = shuffleEvents().filter(e => !state.shownEventIds.includes(e.id));
  state.monthElapsed = 0;
  state.monthLastTick = Date.now();
  state.payElapsed   = 0;
  state.activeInteraction = null;
  state.foodPingsFired = [];
  initGameUI();
  startMonthTimer();
  scheduleNextEvent();
  if (state.job.interactive) scheduleNextInteraction();
  startMusic();
}

function initGameUI() {
  const p = state.profiles[state.activeProfileId];
  document.getElementById('top-avatar').textContent = p.avatar;
  document.getElementById('top-name').textContent   = p.name;
  updateTopBar(); updateBalance(); updateJobCard();
  updateOverview(); updateGoalDisplay(); clearLog();
  buildCalendar(); updateCalendar(); updateCookingBtn();
  addLog('🎮 Spelet startar!', state.balance, true);
  addLog(`💼 Du börjar som ${state.job.name}`, 0, null);
}

// ─────────────────────────────────────────
//  MONTH TIMER (proper pause support)
// ─────────────────────────────────────────
function startMonthTimer() {
  clearTimeout(state.monthTimer);
  state.monthElapsed  = 0;
  state.monthLastTick = Date.now();
  baristaAccumulated  = 0;

  function tick() {
    if (!state.gameRunning) return;

    const now = Date.now();
    if (!state.paused) {
      state.monthElapsed  += now - state.monthLastTick;
    }
    state.monthLastTick = now;

    // Update calendar
    updateCalendar();

    // Pay progress
    if (!state.paused) updatePayProgress();

    // Food pings
    checkFoodPings();

    if (state.monthElapsed >= MONTH_DURATION) {
      endMonth();
    } else {
      state.monthTimer = setTimeout(tick, TICK_MS);
    }
  }
  state.monthTimer = setTimeout(tick, TICK_MS);
}

// ─────────────────────────────────────────
//  FOOD PINGS
// ─────────────────────────────────────────
function checkFoodPings() {
  const pct = state.monthElapsed / MONTH_DURATION;
  MEAL_SCHEDULE.forEach((meal, i) => {
    if (pct >= meal.atPct && !state.foodPingsFired.includes(i)) {
      state.foodPingsFired.push(i);
      triggerFoodPing(meal);
    }
  });
}

function triggerFoodPing(meal) {
  const rawCost = randBetween(meal.minCost, meal.maxCost);
  const cost = state.cookingAtHome ? Math.round(rawCost * 0.5) : rawCost;
  state.balance   -= cost;
  state.mFood     += cost;
  state.totalFood += cost;

  SFX.food();
  updateBalance();
  updateOverview();
  showFoodToast(meal.emoji, meal.label, cost, meal.day);

  // Log only first meal of each day (Frukost) to avoid log spam — middag always
  if (meal.label === 'Frukost') {
    addLog(`${meal.emoji} Dag ${meal.day}: Frukost`, -cost, false);
  } else if (meal.label === 'Middag') {
    addLog(`${meal.emoji} Dag ${meal.day}: Middag`, -cost, false);
  }
  // Lunch deducted silently (visible in overview)
}

function showFoodToast(_emoji, _label, _cost, _day) {
  // Food notifications removed — visible in the event log instead
}

// ─────────────────────────────────────────
//  JOB PAY PROGRESS
// ─────────────────────────────────────────
let baristaAccumulated = 0;

function updatePayProgress() {
  const j = state.job;
  if (j.type === 'monthly' || j.type === 'firefighter') {
    const pct = Math.min(state.monthElapsed / MONTH_DURATION, 1);
    const el = document.getElementById('pay-fill');
    if (el) el.style.width = (pct * 100) + '%';
    const currentDay = Math.floor(Math.min(state.monthElapsed / MONTH_DURATION, 1) * DAYS_PER_MONTH) + 1;
    const daysLeft = Math.max(0, DAYS_PER_MONTH - currentDay + 1);
    document.getElementById('game-job-pay').textContent = j.type === 'firefighter'
      ? `Grundlön om ${daysLeft} dagar + larm-bonus!`
      : `Lön om ${daysLeft} dagar`;
  }
  if (j.type === 'weekly') {
    const interval = j.payInterval;
    baristaAccumulated += TICK_MS;
    const pct = (baristaAccumulated % interval) / interval;
    const el = document.getElementById('pay-fill');
    if (el) el.style.width = (pct * 100) + '%';
    const secsLeft = Math.max(0, Math.ceil((interval - (baristaAccumulated % interval)) / 1000));
    document.getElementById('game-job-pay').textContent = `Nästa lön om ${secsLeft} sek`;
    if (baristaAccumulated >= interval) {
      baristaAccumulated = 0;
      earnIncome(j.payAmount, 'Veckopeng 💵');
    }
  }
}

// ─────────────────────────────────────────
//  INTERACTION (Delivery / Datanörd)
// ─────────────────────────────────────────
function scheduleNextInteraction() {
  clearTimeout(state.interactionScheduled);
  if (!state.gameRunning) return;
  const j = state.job;
  const range = j.deliveryInterval || j.projectInterval;
  const delay = range ? randBetween(range[0], range[1]) : 20000;
  state.interactionScheduled = setTimeout(() => {
    if (!state.gameRunning) return;
    showInteraction();
  }, delay);
}

function showInteraction() {
  const j = state.job;
  const pool = j.deliveryAmount || j.projectAmount || [1000];
  const amount = randItem(pool);
  state.activeInteraction = { amount, timeout: j.interactionTimeout };

  document.getElementById('int-emoji').textContent  = j.interactionEmoji  || '💼';
  document.getElementById('int-title').textContent  = j.interactionTitle  || 'Nytt uppdrag!';
  document.getElementById('int-amount').textContent = '+' + fmt(Math.round(amount * (1 - TAX_RATE))) + ' hem';
  document.getElementById('interaction-banner').style.display = 'block';

  SFX.alarm();

  const startT = Date.now();
  function countdown() {
    if (!state.activeInteraction) return;
    const elapsed = Date.now() - startT;
    const pct = Math.max(0, 1 - elapsed / j.interactionTimeout);
    const fill = document.getElementById('int-timer-fill');
    if (fill) fill.style.width = (pct * 100) + '%';
    if (elapsed >= j.interactionTimeout) missInteraction();
    else state.interactionTimer = setTimeout(countdown, 100);
  }
  state.interactionTimer = setTimeout(countdown, 100);
}

function acceptInteraction() {
  if (!state.activeInteraction) return;
  clearTimeout(state.interactionTimer);
  SFX.coin();
  earnIncome(state.activeInteraction.amount, state.job.interactionLog || '💼 Uppdrag klart!');
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
  const lbl = state.job.type === 'delivery' ? 'Leveransen missades! 😬' : 'Jobbet missades! 😬';
  addLog('😬 ' + lbl, 0, false);
  scheduleNextInteraction();
}

// ─────────────────────────────────────────
//  EVENTS (pause month during event)
// ─────────────────────────────────────────
function shuffleEvents() {
  return [...EVENTS].sort(() => Math.random() - 0.5);
}

function scheduleNextEvent() {
  clearTimeout(state.eventTimer);
  if (!state.gameRunning) return;
  // Events every 6-12 seconds of active time = ~5-9 events per month
  const delay = randBetween(6000, 12000);
  state.eventTimer = setTimeout(() => {
    if (!state.gameRunning || state.paused) { scheduleNextEvent(); return; }
    triggerNextEvent();
  }, delay);
}

function triggerNextEvent() {
  state.paused = true; // Pause month timer during event!

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
  state.paused = false; // Resume month timer

  if (choice.effect === 'gamble') {
    const win = Math.random() < choice.gambleOdds;
    if (win) {
      earnIncome(choice.gambleWin, 'Aktieinvestering (vinst) 📈');
      spendMoney(choice.gambleAmt, 'Aktieinvestering');
      showToast(`📈 Du vann! +${fmt(choice.gambleWin - choice.gambleAmt)}`, 'pos');
    } else {
      spendMoney(choice.gambleAmt, 'Aktieinvestering (förlust) 📉');
      showToast('📉 Du förlorade pengarna!', 'neg');
    }
  } else if (choice.effect === 'savings_account') {
    if (state.balance >= choice.savingsAmt) {
      spendMoney(choice.savingsAmt, 'Sparkonto insättning 🏦');
      state.savingsAccountBalance += choice.savingsAmt;
      showToast(`🏦 Sparkonto öppnat! ${fmt(choice.savingsAmt)} sparade.`, 'info');
    } else {
      showToast('Inte tillräckligt med pengar!', 'neg');
    }
  } else if (typeof choice.effect === 'number') {
    if (choice.effect > 0)      earnIncome(choice.effect, ev.title);
    else if (choice.effect < 0) { spendMoney(Math.abs(choice.effect), ev.title); state.mEvents += Math.abs(choice.effect); }
  }

  if (choice.recurring) {
    if (!state.recurringCosts.find(r => r.name === choice.recurringName)) {
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
  state.balance    += net;
  state.mIncome    += gross;
  state.mTax       += tax;
  state.mNetIncome += net;
  state.totalGross += gross;
  state.totalTax   += tax;
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
  if (state.balance < 0) showToast('⚠️ Du har minus! Skär ner på utgifterna!', 'neg');
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
  state.paused = false;

  SFX.month();

  // Deduct rent
  state.balance -= FIXED_EXPENSES.rent;
  state.mFixed  += FIXED_EXPENSES.rent;
  state.totalFixed += FIXED_EXPENSES.rent;

  // Recurring costs
  let recurringTotal = 0;
  state.recurringCosts.forEach(rc => { state.balance -= rc.amount; recurringTotal += rc.amount; });
  state.mRecurring = recurringTotal;

  // Monthly job salary (monthly and firefighter both get base salary at month end)
  if (state.job.type === 'monthly' || state.job.type === 'firefighter') {
    const gross = state.job.salary;
    const tax   = Math.round(gross * TAX_RATE);
    const net   = gross - tax;
    state.balance += net; state.mIncome += gross; state.mTax += tax;
    state.mNetIncome += net; state.totalGross += gross; state.totalTax += tax;
    SFX.salary();
    addLog('💰 Månadslön utbetald!', net, true);
  }

  // Savings interest (2% yearly = ~0.167% monthly)
  if (state.savingsAccountBalance > 0) {
    const interest = Math.round(state.savingsAccountBalance * 0.02 / 12);
    state.savingsAccountBalance  += interest;
    state.savingsAccountInterest += interest;
    state.balance                += interest;
    addLog('🏦 Ränta på sparkontot', interest, true);
  }

  updateBalance();
  showMonthSummary();
}

function showMonthSummary() {
  const m   = state.month + 1;
  const net = state.mNetIncome - state.mFixed - state.mRecurring - state.mFood;
  document.getElementById('sum-title').textContent = `Månad ${m} är klar! 📅`;
  document.getElementById('sum-income').textContent  = '+' + fmt(state.mNetIncome);
  document.getElementById('sum-food').textContent    = '−' + fmt(state.mFood);
  document.getElementById('sum-fixed').textContent   = '−' + fmt(state.mFixed + state.mRecurring);
  document.getElementById('sum-events').textContent  = state.mEvents > 0 ? '−' + fmt(state.mEvents) : '0 kr';
  document.getElementById('sum-events-row').style.display = state.mEvents > 0 ? 'flex' : 'none';
  const resultEl = document.getElementById('sum-result');
  resultEl.textContent = (net >= 0 ? '+' : '') + fmt(net);
  resultEl.className   = net >= 0 ? 'positive' : 'negative';
  document.getElementById('sum-total').textContent = fmt(state.balance);
  document.getElementById('sum-tip').textContent = MONTH_TIPS[Math.floor(Math.random() * MONTH_TIPS.length)];
  const isLastMonth = state.month >= TOTAL_MONTHS - 1;
  if (isLastMonth) {
    document.getElementById('sum-title').textContent = `År ${state.year} är slut! 🎊`;
    document.getElementById('sum-continue-btn').textContent = `Starta År ${state.year + 1}! →`;
  } else {
    document.getElementById('sum-continue-btn').textContent = 'Nästa månad →';
  }
  showOverlay('overlay-month');
}

function continueGame() {
  SFX.click();
  closeOverlay('overlay-month');

  // Check if goal was reached this month
  if (state.goal && state.goal.amount && state.balance >= state.goal.amount) {
    setTimeout(() => showGoalWonOverlay(), 300);
    return;
  }

  // Year rollover
  if (state.month >= TOTAL_MONTHS - 1) {
    state.year++;
    state.month = -1; // advanceMonth will increment to 0
    SFX.win();
    addLog(`🎊 År ${state.year} börjar!`, 0, null);
  }

  advanceMonth();
}

function advanceMonth() {
  state.month++;
  state.mIncome = state.mTax = state.mNetIncome = 0;
  state.mFixed  = state.mEvents = state.mRecurring = state.mFood = 0;
  state.goalReached = false;
  state.foodPingsFired = [];
  baristaAccumulated  = 0;

  updateTopBar(); updateBalance(); updateOverview();
  addLog(`📅 ${MONTH_NAMES[state.month]} börjar!`, 0, null);
  saveCurrentGame();
  startMonthTimer(); scheduleNextEvent();
  if (state.job.interactive) scheduleNextInteraction();
}

function showGoalWonOverlay() {
  stopMusic();
  clearAllTimers();
  // Big fanfare
  const fanfare = [523,659,784,1047,1319,1047,1319,1568,2093];
  fanfare.forEach((f, i) => playTone(f, 0.3, 'sine', 0.25, i * 0.12));
  burstCoins(); burstCoins(); burstCoins();

  const g = state.goal;
  document.getElementById('goal-won-pill').textContent = `${g.emoji} ${g.name} — ${fmt(g.amount)}`;
  document.getElementById('goal-won-msg').textContent =
    `Du sparade ihop till ${g.name}! Det är INTE lätt — men du klarade det! 🌟`;

  launchFireworks();
  showOverlay('overlay-goal-won');
}

function launchFireworks() {
  const container = document.getElementById('goal-won-fireworks');
  container.innerHTML = '';
  const emojis = ['🎆','🎇','✨','⭐','🌟','💥','🎊','🎉'];
  for (let i = 0; i < 24; i++) {
    const el = document.createElement('div');
    el.className = 'fw-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const angle = (i / 24) * 360;
    const dist = 80 + Math.random() * 120;
    const dx = Math.cos(angle * Math.PI / 180) * dist;
    const dy = Math.sin(angle * Math.PI / 180) * dist - 60;
    el.style.cssText = `left:50%;top:50%;--dx:${dx}px;--dy:${dy}px;animation-delay:${Math.random()*600}ms`;
    container.appendChild(el);
  }
  // Repeat fireworks
  state._fwTimer = setInterval(() => {
    if (!document.getElementById('overlay-goal-won') ||
        document.getElementById('overlay-goal-won').style.display === 'none') {
      clearInterval(state._fwTimer); return;
    }
    burstCoins();
    const f2 = [523, 784, 1047, 1319];
    f2.forEach((f, i) => playTone(f, 0.15, 'sine', 0.15, i * 0.08));
  }, 2000);
}

function goalWonContinue() {
  SFX.click();
  clearInterval(state._fwTimer);
  closeOverlay('overlay-goal-won');
  // Clear goal so it doesn't trigger again, let them play on freely
  state.goal = null;
  updateGoalDisplay();
  startMusic();
  if (state.month >= TOTAL_MONTHS - 1) {
    state.year++;
    state.month = -1;
    addLog(`🎊 År ${state.year} börjar!`, 0, null);
  }
  advanceMonth();
}

function goalWonSaveAndEnd() {
  SFX.click();
  clearInterval(state._fwTimer);
  closeOverlay('overlay-goal-won');
  state.gameRunning = false;
  saveCurrentGame();
  showToast('💾 Spelet är sparat! Bra jobbat! 🌟', 'pos');
  setTimeout(() => showScreen('profiles'), 1500);
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
        <div class="jsw-name">${j.name}${state.job.id === j.id ? ' (ditt nuvarande)' : ''}</div>
        <div class="jsw-sal">${j.salaryText}</div>
      </div>
    </div>`).join('');
  showOverlay('overlay-job-switch');
}

function switchJob(id) {
  SFX.click();
  closeOverlay('overlay-job-switch');
  const newJob = JOBS.find(j => j.id === id);
  if (!newJob || newJob.id === state.job.id) return;
  clearTimeout(state.interactionScheduled); clearTimeout(state.interactionTimer);
  document.getElementById('interaction-banner').style.display = 'none';
  state.activeInteraction = null; baristaAccumulated = 0;
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
  stopMusic();
  const totalEarned = state.totalGross * (1 - TAX_RATE);
  const savingsPct  = totalEarned > 0 ? state.balance / totalEarned : 0;

  let trophy = '🏆', title = 'Grattis! Året är slut!';
  if (state.balance < 0)      { trophy = '😬'; title = 'Tufft år...'; }
  else if (savingsPct > 0.6)  { trophy = '🥇'; title = 'Du är en sparmästare!'; }
  else if (savingsPct > 0.3)  { trophy = '🥈'; title = 'Bra jobbat!'; }

  document.getElementById('go-trophy').textContent = trophy;
  document.getElementById('go-title').textContent  = title;
  document.getElementById('go-amount').textContent = fmt(state.balance);

  let badge = '';
  if (savingsPct > 0.6)     badge = '🏅 Mäster-Sparare';
  else if (savingsPct > 0.4) badge = '⭐ Klok Ekonom';
  else if (savingsPct > 0.2) badge = '📈 På Rätt Spår';
  else if (savingsPct > 0)   badge = '💡 Börjar Förstå';
  else                       badge = '🤑 Spenderade Alltihop';

  if (state.goal && state.balance >= state.goal.amount) {
    badge = `🎯 Nådde målet: ${state.goal.name}!`;
    SFX.goal();
  }
  document.getElementById('go-badge').textContent = badge;

  const stats = [
    ['💰 Totalt tjänat (före skatt)', fmt(state.totalGross)],
    ['🏛️ Skatt du betalat till staten', fmt(state.totalTax)],
    ['💵 Pengar du fick hem', fmt(state.totalGross - state.totalTax)],
    ['🏠 Hyra betald totalt', '−' + fmt(state.totalFixed)],
    ['🍽️ Mat du ätit totalt', '−' + fmt(state.totalFood)],
    ['🎭 Roliga saker du köpte', '−' + fmt(state.totalEventCosts)],
    ...(state.savingsAccountInterest > 0 ? [['🏦 Ränta du tjänat', '+' + fmt(state.savingsAccountInterest)]] : []),
    ['📊 Din sparandeprocent', Math.round(savingsPct * 100) + '%'],
  ];
  document.getElementById('go-stats-list').innerHTML = stats.map(([k,v]) =>
    `<div class="go-stat-row"><span>${k}</span><span>${v}</span></div>`).join('');

  const wisdom = WISDOM.find(w => savingsPct >= w.minSavings) || WISDOM[WISDOM.length - 1];
  document.getElementById('go-wisdom').innerHTML = `<p>"${wisdom.text}"</p>`;
  showScreen('gameover');
  SFX.win();
}

function playAgain() {
  SFX.click();
  if (state.activeProfileId && state.profiles[state.activeProfileId]) {
    state.profiles[state.activeProfileId].gameState = null;
    saveProfiles();
  }
  state.selectedJob = null;
  showScreen('job');
}

function confirmQuit() {
  if (confirm('Avsluta? Ditt framsteg sparas!')) {
    clearAllTimers(); stopMusic();
    state.gameRunning = false;
    saveCurrentGame();
    showScreen('profiles');
  }
}

function clearAllTimers() {
  clearTimeout(state.monthTimer); clearTimeout(state.eventTimer);
  clearTimeout(state.interactionScheduled); clearTimeout(state.interactionTimer);
}

// ─────────────────────────────────────────
//  UI UPDATES
// ─────────────────────────────────────────
function updateBalance(bump = false) {
  const el = document.getElementById('balance-display');
  el.textContent = fmt(state.balance);
  if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  const net = state.mNetIncome - state.mFixed - state.mRecurring - state.mFood - state.mEvents;
  const sub = document.getElementById('balance-month-change');
  if (net !== 0) { sub.textContent = 'Denna månad: ' + (net >= 0 ? '+' : '') + fmt(net); sub.style.color = net >= 0 ? 'var(--green)' : 'var(--red)'; }
  else sub.textContent = '';
  updateGoalDisplay();
}

function updateTopBar() {
  document.getElementById('top-year').textContent  = `År ${state.year}`;
  document.getElementById('top-month').textContent = `Månad ${state.month + 1}/${TOTAL_MONTHS}`;
  const gameYear = 2024 + state.year;
  document.getElementById('month-name-display').textContent = `${MONTH_NAMES[state.month]} ${gameYear}`;
}

function buildCalendar() {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  for (let d = 1; d <= DAYS_PER_MONTH; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.id = `cal-day-${d}`;
    grid.appendChild(el);
  }
}

function updateCalendar() {
  const pct = Math.min(state.monthElapsed / MONTH_DURATION, 1);
  const currentDay = Math.floor(pct * DAYS_PER_MONTH) + 1; // 1..30

  for (let d = 1; d <= DAYS_PER_MONTH; d++) {
    const el = document.getElementById(`cal-day-${d}`);
    if (!el) continue;
    el.className = 'cal-day';
    el.textContent = '';
    if (d < currentDay) {
      el.classList.add('done');
    } else if (d === currentDay) {
      el.classList.add('today');
      el.textContent = '☀️';
    } else {
      el.textContent = d;
    }
  }

  const secsLeft = Math.max(0, Math.ceil((MONTH_DURATION - state.monthElapsed) / 1000));
  document.getElementById('month-time-display').textContent =
    state.paused ? '⏸ Pausad' : `Dag ${Math.min(currentDay, 30)}/30`;
}

function updateJobCard() {
  const j = state.job;
  document.getElementById('game-job-emoji').textContent = j.emoji;
  document.getElementById('game-job-name').textContent  = j.name;
  document.getElementById('pay-track').style.display    = j.interactive && j.type !== 'firefighter' ? 'none' : 'block';
}

function updateGoalDisplay() {
  const g = state.goal;
  const sec = document.getElementById('goal-section');
  if (!g || !g.amount) { sec.style.display = 'none'; return; }
  sec.style.display = 'flex';
  const cur = Math.max(0, Math.min(state.balance, g.amount));
  const pct = Math.min(100, Math.round(cur / g.amount * 100));

  document.getElementById('goal-emoji-display').textContent   = g.emoji;
  document.getElementById('goal-name-display').textContent    = g.name;
  document.getElementById('goal-target-display').textContent  = fmt(g.amount);
  document.getElementById('goal-current-display').textContent = fmt(cur);
  document.getElementById('goal-percent-display').textContent = pct + '%';

  // Vertical bar fill + emoji position
  document.getElementById('goal-progress-fill').style.height = pct + '%';
  const emoji = document.getElementById('goal-emoji-display');
  emoji.style.bottom = Math.max(2, pct) + '%';
}

function updateOverview() {
  document.getElementById('ov-gross').textContent      = state.mIncome > 0 ? '+' + fmt(state.mIncome) : '0 kr';
  document.getElementById('ov-tax').textContent        = state.mTax   > 0 ? '−' + fmt(state.mTax)    : '0 kr';
  document.getElementById('ov-net-income').textContent = fmt(state.mNetIncome);
  document.getElementById('ov-food').textContent       = state.mFood  > 0 ? '−' + fmt(state.mFood)   : '0 kr';

  const recurEl = document.getElementById('ov-recurring-rows');
  recurEl.innerHTML = state.recurringCosts.map(rc =>
    `<div class="ov-row negative-row"><span>${rc.name}</span><span>−${fmt(rc.amount)}</span></div>`).join('');

  const evRow = document.getElementById('ov-events-row');
  if (state.mEvents > 0) { evRow.style.display = 'flex'; document.getElementById('ov-events').textContent = '−' + fmt(state.mEvents); }
  else evRow.style.display = 'none';

  const totalOut = FIXED_EXPENSES.rent + state.mFood +
    state.recurringCosts.reduce((a, rc) => a + rc.amount, 0) + state.mEvents;
  const monthNet = state.mNetIncome - totalOut;
  const netEl = document.getElementById('ov-net');
  netEl.innerHTML = `<b>${(monthNet >= 0 ? '+' : '') + fmt(monthNet)}</b>`;
  netEl.style.color = monthNet >= 0 ? 'var(--green)' : 'var(--red)';
}

function toggleOverview(headerEl) {
  state.overviewOpen = !state.overviewOpen;
  document.getElementById('overview-body').classList.toggle('open', state.overviewOpen);
  headerEl.classList.toggle('open', state.overviewOpen);
}

// ─────────────────────────────────────────
//  LOG & TOAST
// ─────────────────────────────────────────
function addLog(desc, amount, positive) {
  const log   = document.getElementById('event-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  let amtText = '', amtClass = '';
  if (amount > 0) { amtText = '+' + fmt(amount); amtClass = 'pos'; }
  if (amount < 0) { amtText = fmt(amount);        amtClass = 'neg'; }
  entry.innerHTML = `<span class="log-desc">${desc}</span>${amtText ? `<span class="log-amt ${amtClass}">${amtText}</span>` : ''}`;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 12) log.removeChild(log.lastChild);
}

function clearLog() { document.getElementById('event-log').innerHTML = ''; }

function showToast(msg, type = 'info') {
  // Toasts suppressed during gameplay — messages go to the event log instead
  if (state.gameRunning) return;
  const old = document.querySelector('.toast:not(.food-toast)');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity 0.4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2500);
}

// ─────────────────────────────────────────
//  COINS BURST
// ─────────────────────────────────────────
function burstCoins() {
  const container = document.getElementById('coin-burst');
  ['🪙','💰','✨','⭐'].forEach((e, _) => {
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('div');
      c.className = 'burst-coin';
      c.textContent = e;
      const dx = (Math.random() - 0.5) * 200;
      const dy = -(Math.random() * 150 + 80);
      c.style.cssText = `left:${30+Math.random()*40}%;top:40%;--dx:${dx}px;--dy:${dy}px;animation-delay:${Math.random()*200}ms`;
      container.appendChild(c);
      setTimeout(() => c.remove(), 1000);
    }
  });
}

// ─────────────────────────────────────────
//  PAUSE & EXPLANATIONS
// ─────────────────────────────────────────
const EXPLANATIONS = {
  goal: {
    emoji: '🎯',
    title: 'Ditt sparmål',
    body: `<p>Det här är <b>ditt sparmål</b> — det du drömmer om att köpa!</p>
           <p>Staplarna visar hur nära du är. Ju mer du sparar varje månad, desto snabbare fyller du staplarna.</p>
           <p>💡 Hemligheten är att <b>inte spendera allt</b> du tjänar. Lite kvar varje månad räcker långt!</p>`,
  },
  job: {
    emoji: '💼',
    title: 'Ditt jobb',
    body: `<p>Jobbet avgör <b>hur mycket pengar du tjänar</b> varje månad.</p>
           <p>Men kom ihåg — du betalar alltid <b>30% i skatt</b> till staten. Skatten betalar för skolor, sjukhus och vägar!</p>
           <p>Olika jobb betalar på olika sätt: en gång i månaden, varje vecka eller per uppdrag. Välj det som passar dig!</p>`,
  },
  calendar: {
    emoji: '📅',
    title: 'Månadskalendern',
    body: `<p>Kalendern visar hur månaden går!</p>
           <p>Varje ruta är en dag. ☀️ är idag. ✓ är dagar som gått.</p>
           <p>Varje dag kostar mat pengar — frukost 🥣, lunch 🥪 och middag 🍝!</p>
           <p>💡 Tänk på att planera: om lönen inte kommer förrän sista dagen måste du ha pengar kvar till mat hela månaden!</p>`,
  },
  overview: {
    emoji: '📊',
    title: 'Månadsöversikten',
    body: `<p><b>Vad du tjänade</b> = din lön INNAN skatt (bruttolön).</p>
           <p><b>Skatt (30%)</b> = pengar som går till samhället.</p>
           <p><b>Pengar kvar efter skatt</b> = vad du faktiskt får hem (nettolön).</p>
           <p>Från det drar vi hyra, mat och saker du köpt. Det som är kvar är det du <b>sparar</b>!</p>
           <p>💡 Försök alltid ha ett <b>plus</b> på raden "Hur det gick" — det betyder att du sparar pengar!</p>`,
  },
  log: {
    emoji: '📜',
    title: 'Händelseloggen',
    body: `<p>Här ser du <b>allt som hänt med dina pengar</b>!</p>
           <p>🟢 <b>Gröna siffror</b> = pengar som kom IN på kontot. Bra!</p>
           <p>🔴 <b>Röda siffror</b> = pengar som gick UT. Tänk om det var värt det!</p>
           <p>💡 I verkligheten kan du se alla dina transaktioner i din banks app. Att ha koll kallas att <b>budgetera</b>!</p>`,
  },
};

function showCookingOverlay() {
  if (!state.gameRunning) return;
  SFX.click();
  state.paused = true;
  const indicator = document.getElementById('pause-indicator');
  const card = document.querySelector('.balance-card');
  if (indicator) indicator.style.display = 'block';
  if (card) card.classList.add('is-paused');
  updateCalendar();
  showOverlay('overlay-cooking');
}

function setCooking(val) {
  SFX.click();
  closeOverlay('overlay-cooking');
  state.cookingAtHome = val;
  state.paused = false;
  const indicator = document.getElementById('pause-indicator');
  const card = document.querySelector('.balance-card');
  if (indicator) indicator.style.display = 'none';
  if (card) card.classList.remove('is-paused');
  updateCalendar();
  updateCookingBtn();
  const msg = val
    ? '🍳 Du lagar maten själv nu! Mat kostar ~50% mindre.'
    : '🏪 Du köper färdig mat igen. Dyrare men bekvämt.';
  showToast(msg, val ? 'pos' : 'info');
  addLog(val ? '🍳 Börjar laga maten hemma' : '🏪 Köper färdig mat igen', 0, null);
  saveCurrentGame();
}

function updateCookingBtn() {
  const btn = document.getElementById('cooking-btn');
  if (!btn) return;
  if (state.cookingAtHome) {
    btn.textContent = '🍳 Lagar hemma ✓';
    btn.classList.add('active');
  } else {
    btn.textContent = '🏪 Köper mat';
    btn.classList.remove('active');
  }
}

function toggleManualPause() {
  if (!state.gameRunning) return;
  SFX.click();
  state.paused = !state.paused;
  const indicator = document.getElementById('pause-indicator');
  const card = document.querySelector('.balance-card');
  if (state.paused) {
    if (indicator) indicator.style.display = 'block';
    if (card) card.classList.add('is-paused');
  } else {
    if (indicator) indicator.style.display = 'none';
    if (card) card.classList.remove('is-paused');
  }
  updateCalendar();
}

function showExplanation(key) {
  if (!state.gameRunning) return;
  const exp = EXPLANATIONS[key];
  if (!exp) return;
  SFX.click();
  // Pause the game while reading
  state.paused = true;
  // Show pause indicator on balance card too
  const indicator = document.getElementById('pause-indicator');
  const card = document.querySelector('.balance-card');
  if (indicator) indicator.style.display = 'block';
  if (card) card.classList.add('is-paused');
  updateCalendar();
  document.getElementById('exp-emoji').textContent = exp.emoji;
  document.getElementById('exp-title').textContent = exp.title;
  document.getElementById('exp-body').innerHTML = exp.body;
  showOverlay('overlay-explain');
}

function closeExplanation() {
  SFX.click();
  closeOverlay('overlay-explain');
  state.paused = false;
  const indicator = document.getElementById('pause-indicator');
  const card = document.querySelector('.balance-card');
  if (indicator) indicator.style.display = 'none';
  if (card) card.classList.remove('is-paused');
  updateCalendar();
}

// ─────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  document.addEventListener('click', () => { initAudio(); }, { once: true });
});
