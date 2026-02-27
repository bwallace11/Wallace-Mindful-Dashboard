import { initClock }        from './clock.js';
import { calculateAgeOf }   from './calculateAgeOf.js';
import { getDaysUntilEvent } from './daysTillEvent.js';
import { initRain }         from './rain.js';
import { initGlass }        from './glass.js';

/* ════════════════════════════════════════
   LOCALSTORAGE — centralised, safe
   Everything the user adds is persisted here.
════════════════════════════════════════ */
const LS = {
  get: (k, fb = null) => {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; }
    catch { return fb; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { console.warn('LS write failed:', k, e); }
  }
};

const $ = id => document.getElementById(id);

/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
const html = document.documentElement;
let theme = LS.get('pom_theme', 'dark');
html.setAttribute('data-theme', theme);

function rainLight() {
  window._rainColorLight = theme === 'light' ||
    (theme === 'system' && matchMedia('(prefers-color-scheme:light)').matches);
}
rainLight();
matchMedia('(prefers-color-scheme:light)').addEventListener('change', rainLight);

document.querySelectorAll('.theme-btn').forEach(btn => {
  if (btn.dataset.themeSet === theme) btn.classList.add('active');
  btn.addEventListener('click', () => {
    theme = btn.dataset.themeSet;
    html.setAttribute('data-theme', theme);
    LS.set('pom_theme', theme);
    rainLight();
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setTimeout(() => drawMoon($('moonCanvas'), getMoonPhase(new Date())), 60);
  });
});

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
initGlass();
initRain();
initClock();

/* ════════════════════════════════════════
   CALENDAR
════════════════════════════════════════ */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DOTS = new Set([1,2,4,5,6]);
const STRK = new Set([0,3]);

const NOW = new Date();
const TD = NOW.getDate(), TM = NOW.getMonth(), TY = NOW.getFullYear();

document.querySelector('.month').textContent      = MONTHS[TM];
document.querySelector('.dayOfMonth').textContent = TD;
document.querySelector('.year').textContent       = TY;
document.querySelector('.dayOfWeek').textContent  = DL[NOW.getDay()];
$('calMonthYear').textContent = `${MONTHS[TM].slice(0,3)} ${TY}`;

let calData = LS.get('pom_cal', {});
function dk(y,m,d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

function buildCal() {
  const g = $('calGrid'); g.innerHTML = '';
  DS.forEach(d => { const e = document.createElement('div'); e.className='cal-day-name'; e.textContent=d; g.appendChild(e); });
  const fd = new Date(TY,TM,1).getDay(), dim = new Date(TY,TM+1,0).getDate();
  for (let i=0; i<fd; i++) { const e=document.createElement('div'); e.className='cal-day empty'; g.appendChild(e); }
  for (let d=1; d<=dim; d++) {
    const dow=(fd+d-1)%7, key=dk(TY,TM,d);
    const e = document.createElement('div');
    e.className = 'cal-day'; e.textContent = d;
    if (d===TD) e.classList.add('today');
    else if (DOTS.has(dow)) e.classList.add('dot-day');
    else if (STRK.has(dow)) e.classList.add('stroke-day');
    const sv = calData[key];
    if (sv && (sv.note || sv.reminders?.length)) e.classList.add('has-note');
    e.addEventListener('click', () => openCalModal(key, d));
    g.appendChild(e);
  }
}
buildCal();

let _ckey = null;
function openCalModal(key) {
  _ckey = key;
  const [y,m,dn] = key.split('-').map(Number);
  $('calModalDate').textContent = new Date(y,m-1,dn).toLocaleDateString('en-US',
    {weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const sv = calData[key] || {note:'',reminders:[]};
  $('calNotesInput').value = sv.note || '';
  renderRem(sv.reminders || []);
  $('calModal').classList.add('open');
  setTimeout(() => $('calNotesInput').focus(), 60);
}
function renderRem(list) {
  const el = $('calRemindersList'); el.innerHTML = '';
  list.forEach((t,i) => {
    const d = document.createElement('div'); d.className='reminder-item';
    d.innerHTML = `<span class="rdot"></span><span>${t}</span>`;
    const x = document.createElement('button'); x.className='rdel'; x.textContent='×';
    x.onclick = () => { calData[_ckey].reminders.splice(i,1); LS.set('pom_cal',calData); renderRem(calData[_ckey].reminders); buildCal(); };
    d.appendChild(x); el.appendChild(d);
  });
}
$('calNotesInput').addEventListener('input', () => {
  if (!_ckey) return;
  if (!calData[_ckey]) calData[_ckey] = {note:'',reminders:[]};
  calData[_ckey].note = $('calNotesInput').value;
  LS.set('pom_cal', calData); buildCal();
});
$('calAddReminder').addEventListener('click', () => {
  const v = $('calReminderInput').value.trim(); if (!v||!_ckey) return;
  if (!calData[_ckey]) calData[_ckey] = {note:'',reminders:[]};
  calData[_ckey].reminders.push(v); LS.set('pom_cal', calData);
  $('calReminderInput').value=''; renderRem(calData[_ckey].reminders); buildCal();
});
$('calReminderInput').addEventListener('keydown', e => { if (e.key==='Enter') $('calAddReminder').click(); });
$('calModalClose').addEventListener('click', () => $('calModal').classList.remove('open'));
$('calModal').addEventListener('click', e => { if (e.target===$('calModal')) $('calModal').classList.remove('open'); });

/* ════════════════════════════════════════
   STATS
════════════════════════════════════════ */
if(document.querySelector('.daysUntilEvent')) document.querySelector('.daysUntilEvent').textContent = getDaysUntilEvent('2026-06-15');

/* ════════════════════════════════════════
   ANNIVERSARY SLIDESHOW
   Persisted: pom_anniv_photos [{dataURL}]
════════════════════════════════════════ */
let annivPhotos = LS.get('pom_anniv_photos', []);
let annivIdx    = 0;
let annivTimer  = null;

const START_DATE  = new Date('2022-04-20');
const YEARS_DIFF  = (new Date() - START_DATE) / (1000*60*60*24*365.25);
$('annivYears').textContent = YEARS_DIFF.toFixed(1);

function showSlide(idx) {
  if (!annivPhotos.length) {
    $('annivImg').classList.add('hidden');
    $('annivPlaceholder').style.display = '';
    $('annivDots').innerHTML = '';
    return;
  }
  annivIdx = (idx + annivPhotos.length) % annivPhotos.length;
  const img = $('annivImg');
  img.classList.remove('hidden');
  $('annivPlaceholder').style.display = 'none';
  img.style.opacity = '0';
  img.src = annivPhotos[annivIdx].dataURL;
  img.onload = () => { img.style.opacity = '1'; };
  $('annivDots').innerHTML = '';
  annivPhotos.forEach((_,i) => {
    const d = document.createElement('span');
    d.className = 'anniv-dot' + (i===annivIdx?' on':'');
    d.addEventListener('click', () => showSlide(i));
    $('annivDots').appendChild(d);
  });
}
function startSlide() {
  clearInterval(annivTimer);
  if (annivPhotos.length > 1) annivTimer = setInterval(() => showSlide(annivIdx+1), 4000);
}
showSlide(0); startSlide();

$('annivPrev').addEventListener('click', e => { e.stopPropagation(); showSlide(annivIdx-1); startSlide(); });
$('annivNext').addEventListener('click', e => { e.stopPropagation(); showSlide(annivIdx+1); startSlide(); });

$('annivCard').addEventListener('click', () => { if (!annivPhotos.length) $('annivUpload').click(); });

$('annivUpload').addEventListener('change', e => {
  const files = Array.from(e.target.files); if (!files.length) return;
  let done = 0;
  files.forEach(f => {
    const r = new FileReader();
    r.onload = ev => {
      annivPhotos.push({ dataURL: ev.target.result });
      done++;
      if (done === files.length) {
        LS.set('pom_anniv_photos', annivPhotos);
        showSlide(annivPhotos.length - 1);
        startSlide();
      }
    };
    r.readAsDataURL(f);
  });
  e.target.value = '';
});

/* Long-press to add more photos */
let annivHold = null;
$('annivCard').addEventListener('pointerdown', () => { annivHold = setTimeout(() => $('annivUpload').click(), 700); });
$('annivCard').addEventListener('pointerup',   () => clearTimeout(annivHold));
$('annivCard').addEventListener('pointerleave',() => clearTimeout(annivHold));

/* ════════════════════════════════════════
   GYM LOG
   Persisted: pom_gym { weekKey: { Sun:null, Mon:bool, Tue:bool, Wed:null, Thu:bool, Fri:bool, Sat:bool } }
   weekKey = ISO week start (Sunday) YYYY-MM-DD
   GYM DAYS: Mon Tue Thu Fri Sat (not Sun=0, not Wed=3)
════════════════════════════════════════ */
const GYM_DAYS = new Set([1,2,4,5,6]); // Mon,Tue,Thu,Fri,Sat
const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return d.toISOString().slice(0,10);
}

function getTodayDow() { return new Date().getDay(); }

let gymData = LS.get('pom_gym', {});

/* Auto-reset: clear weeks older than current — keep last 8 weeks */
function pruneGym() {
  const keys = Object.keys(gymData).sort();
  if (keys.length > 8) keys.slice(0, keys.length-8).forEach(k => delete gymData[k]);
  LS.set('pom_gym', gymData);
}
pruneGym();

function getThisWeek() {
  const k = getWeekKey();
  if (!gymData[k]) {
    gymData[k] = {};
    LS.set('pom_gym', gymData);
  }
  return gymData[k];
}

function buildGymWidget() {
  const week = getThisWeek();
  const todayDow = getTodayDow();
  const container = $('gymWeek');
  container.innerHTML = '';

  for (let d=0; d<7; d++) {
    const isGymDay = GYM_DAYS.has(d);
    const isToday  = d === todayDow;
    const logged   = week[d]; // true=went, false=missed, undefined=not yet

    const cell = document.createElement('div');
    cell.className = 'gym-cell';
    if (isToday) cell.classList.add('gym-today');
    if (!isGymDay) cell.classList.add('gym-rest');

    const dayLabel = document.createElement('span');
    dayLabel.className = 'gym-day-label';
    dayLabel.textContent = DAY_SHORT[d].charAt(0); // just 1 letter for widget

    const dot = document.createElement('span');
    dot.className = 'gym-dot';
    if (!isGymDay) {
      dot.textContent = '—';
      dot.classList.add('gym-dot-rest');
    } else if (logged === true) {
      dot.textContent = '✓';
      dot.classList.add('gym-dot-yes');
    } else if (logged === false) {
      dot.textContent = '✗';
      dot.classList.add('gym-dot-no');
    } else {
      dot.textContent = isGymDay ? '·' : '—';
      dot.classList.add('gym-dot-pending');
    }

    cell.appendChild(dayLabel);
    cell.appendChild(dot);
    container.appendChild(cell);
  }
}

function buildGymModal() {
  const week = getThisWeek();
  const todayDow = getTodayDow();
  const el = $('gymWeekFull');
  el.innerHTML = '';

  for (let d=0; d<7; d++) {
    const isGymDay = GYM_DAYS.has(d);
    const isToday  = d === todayDow;
    const logged   = week[d];

    const row = document.createElement('div');
    row.className = 'gym-row' + (isToday ? ' gym-row-today' : '') + (!isGymDay ? ' gym-row-rest' : '');

    const name = document.createElement('span');
    name.className = 'gym-row-name';
    name.textContent = DAY_SHORT[d];

    const status = document.createElement('span');
    status.className = 'gym-row-status';
    if (!isGymDay) {
      status.textContent = 'Rest day 😴';
      status.classList.add('gym-status-rest');
    } else if (logged === true) {
      status.textContent = '✓ Went!';
      status.classList.add('gym-status-yes');
    } else if (logged === false) {
      status.textContent = '✗ Missed';
      status.classList.add('gym-status-no');
    } else {
      status.textContent = isToday ? 'Today — did you go?' : (d < todayDow ? '— missed' : 'Upcoming');
      status.classList.add('gym-status-pending');
      if (isToday && d < todayDow) status.textContent = '— missed';
    }

    row.appendChild(name);
    row.appendChild(status);

    /* Mark missed for past gym days with no log */
    if (isGymDay && logged === undefined && d < todayDow) {
      week[d] = false;
      LS.set('pom_gym', gymData);
    }

    el.appendChild(row);
  }

  /* History */
  const hist = $('gymHistory'); hist.innerHTML = '';
  const pastKeys = Object.keys(gymData).sort().reverse().slice(1, 9);
  if (!pastKeys.length) {
    const empty = document.createElement('p');
    empty.style.cssText = 'font-size:.55rem;color:var(--txt-d);text-align:center;padding:10px 0';
    empty.textContent = 'No past weeks yet.';
    hist.appendChild(empty);
  }
  pastKeys.forEach(k => {
    const w = gymData[k];
    const went  = GYM_DAYS.size ? [1,2,4,5,6].filter(d => w[d]===true).length : 0;
    const total = 5;
    const date = new Date(k);
    const label = date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const item = document.createElement('div');
    item.className = 'gym-hist-item';
    item.innerHTML = `<span>Week of ${label}</span><span class="gym-hist-count">${went}/${total} days</span>`;
    hist.appendChild(item);
  });
}

/* Gym "I went!" button */
$('gymLogBtn').addEventListener('click', e => {
  e.stopPropagation();
  const todayDow = getTodayDow();
  if (!GYM_DAYS.has(todayDow)) {
    // Rest day — open modal to explain
    buildGymModal();
    $('gymModal').classList.add('open');
    return;
  }
  const week = getThisWeek();
  week[todayDow] = true;
  gymData[getWeekKey()] = week;
  LS.set('pom_gym', gymData);
  buildGymWidget();
  buildGymModal();
});

$('gymCard').addEventListener('click', () => {
  buildGymModal();
  $('gymModal').classList.add('open');
});

$('gymModalClose').addEventListener('click', () => $('gymModal').classList.remove('open'));
$('gymModal').addEventListener('click', e => { if (e.target===$('gymModal')) $('gymModal').classList.remove('open'); });

buildGymWidget();

/* ════════════════════════════════════════
   WATER WIDGET
   Persisted: pom_water { 'YYYY-M-D': {oz, log:[]}, goal }
   Resets daily automatically.
════════════════════════════════════════ */
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };

let waterData = LS.get('pom_water', {});
let waterGoal = waterData.goal || 64;

function getTodayWater() {
  const k = todayStr();
  if (!waterData[k]) waterData[k] = { oz: 0, log: [] };
  return waterData[k];
}

function saveWater() { LS.set('pom_water', waterData); }

function updateWaterUI() {
  const entry = getTodayWater();
  const pct   = Math.min(100, (entry.oz / waterGoal) * 100);
  $('waterOzDisplay').textContent   = entry.oz;
  $('waterGoalDisplay').textContent = waterGoal;
  $('waterMiniFill').style.width    = pct + '%';
  $('waterFill').style.height       = pct + '%';
  $('wToday').textContent = entry.oz;
  $('wGoal').textContent  = waterGoal;
  renderWaterHistory();
}

function renderWaterHistory() {
  const hist = $('waterHistory'); if (!hist) return;
  hist.innerHTML = '';
  const days = Object.keys(waterData).filter(k=>k!=='goal').sort().reverse().slice(0,14);
  days.forEach(k => {
    const entry = waterData[k]; if (!entry || !entry.oz) return;
    const row = document.createElement('div'); row.className = 'whist-item';
    const label = k === todayStr() ? 'Today' : k;
    const pct = Math.min(100, Math.round(entry.oz/waterGoal*100));
    row.innerHTML = `<strong>${label}</strong><span>${entry.oz} oz <span style="color:var(--lav)">${pct}%</span></span>`;
    hist.appendChild(row);
  });
}

function triggerDrip() {
  const drip = $('waterDrip');
  drip.classList.remove('dripping');
  void drip.offsetWidth;
  drip.classList.add('dripping');
  setTimeout(() => drip.classList.remove('dripping'), 800);
}

$('waterCard').addEventListener('click', () => { updateWaterUI(); $('waterModal').classList.add('open'); });
$('waterLogBtn').addEventListener('click', () => {
  const raw = parseFloat($('waterOzInput').value);
  if (!raw || raw <= 0) return;
  const entry = getTodayWater();
  entry.oz += raw;
  entry.log.push({ time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), oz: raw });
  saveWater(); $('waterOzInput').value=''; triggerDrip(); updateWaterUI();
});
$('waterOzInput').addEventListener('keydown', e => { if (e.key==='Enter') $('waterLogBtn').click(); });
$('waterGoalSave').addEventListener('click', () => {
  const v = parseInt($('waterGoalInput').value);
  if (v >= 16) { waterGoal=v; waterData.goal=v; saveWater(); updateWaterUI(); }
});
$('waterModalClose').addEventListener('click', () => $('waterModal').classList.remove('open'));
$('waterModal').addEventListener('click', e => { if (e.target===$('waterModal')) $('waterModal').classList.remove('open'); });
updateWaterUI();

/* ════════════════════════════════════════
   FOX
   Note: fox photos are not persisted (external API)
════════════════════════════════════════ */
async function loadFox() {
  const wrap = $('foxImgWrap');
  try {
    const r = await fetch('https://randomfox.ca/floof/');
    const d = await r.json();
    const img = document.createElement('img');
    img.src = d.image; img.alt = 'A cute fox';
    img.style.opacity='0'; img.style.transition='opacity .4s ease';
    img.onload = () => img.style.opacity='1';
    wrap.innerHTML=''; wrap.appendChild(img);
  } catch { wrap.innerHTML='<span class="fox-emoji">🦊</span>'; }
}
loadFox();
$('foxCard').addEventListener('click', loadFox);

/* ════════════════════════════════════════
   MOON
════════════════════════════════════════ */
function getMoonPhase(date) {
  const known=new Date('2000-01-06T18:14:00Z');
  const diff=(date-known)/864e5, cycle=29.53059;
  const age=((diff%cycle)+cycle)%cycle;
  const phases=[
    {name:'New Moon',       emoji:'🌑',range:[0,1.85]},
    {name:'Waxing Crescent',emoji:'🌒',range:[1.85,7.38]},
    {name:'First Quarter',  emoji:'🌓',range:[7.38,9.22]},
    {name:'Waxing Gibbous', emoji:'🌔',range:[9.22,14.77]},
    {name:'Full Moon',      emoji:'🌕',range:[14.77,16.61]},
    {name:'Waning Gibbous', emoji:'🌖',range:[16.61,22.15]},
    {name:'Last Quarter',   emoji:'🌗',range:[22.15,24]},
    {name:'Waning Crescent',emoji:'🌘',range:[24,29.53]}
  ];
  const ph=phases.find(p=>age>=p.range[0]&&age<p.range[1])||phases[0];
  const illum=age<=14.77?Math.round(age/14.77*100):Math.round((29.53-age)/14.77*100);
  let dtf=14.77-age; if(dtf<0) dtf+=29.53;
  return {...ph, age:Math.round(age), illum, daysToFull:Math.ceil(dtf)};
}

function drawMoon(canvas, phase) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,r=W/2-4;
  ctx.clearRect(0,0,W,H);
  const lt=html.getAttribute('data-theme')==='light'||
    (html.getAttribute('data-theme')==='system'&&matchMedia('(prefers-color-scheme:light)').matches);
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=lt?'#e8e0f8':'#d4caf0';ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const sc=lt?'rgba(50,15,120,.78)':'rgba(5,0,15,.9)';
  const age=phase.age;
  if(age<1||age>28){ctx.fillStyle=sc;ctx.fillRect(0,0,W,H);}
  else if(age<14.77){
    const ex=Math.cos(Math.PI*(age/14.77))*r;
    ctx.beginPath();ctx.arc(cx,cy,r,Math.PI/2,-Math.PI/2);
    ctx.bezierCurveTo(cx+ex,cy-r,cx+ex,cy+r,cx,cy+r);
    ctx.closePath();ctx.fillStyle=sc;ctx.fill();
  } else {
    const ex=Math.cos(Math.PI*((age-14.77)/14.77))*r;
    ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,Math.PI/2);
    ctx.bezierCurveTo(cx+ex,cy+r,cx+ex,cy-r,cx,cy-r);
    ctx.closePath();ctx.fillStyle=sc;ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle=lt?'rgba(109,40,217,.22)':'rgba(196,181,253,.22)';
  ctx.lineWidth=1;ctx.stroke();
}

(() => {
  const canvas=$('moonCanvas'), mn=$('moonName'), md=$('moonDetail');
  const ph=getMoonPhase(new Date());
  drawMoon(canvas,ph);
  mn.textContent=`${ph.emoji} ${ph.name}`;
  md.innerHTML=`${ph.illum}% illuminated<br>Day ${ph.age} of cycle<br>${ph.daysToFull} days to full`;
})();

/* ════════════════════════════════════════
   LIBRARY
════════════════════════════════════════ */
$('openLibrary').addEventListener('click', () => $('libraryModal').classList.add('open'));
$('libraryClose').addEventListener('click', () => $('libraryModal').classList.remove('open'));
$('libraryModal').addEventListener('click', e => { if(e.target===$('libraryModal')) $('libraryModal').classList.remove('open'); });

const BOOKS = {
  'night-circus':     {title:'The Night Circus',    author:'Erin Morgenstern', cover:'https://covers.openlibrary.org/b/id/8236055-L.jpg',   s:'Two young magicians are pitted against each other in a mysterious competition set within a magical black-and-white circus. As their rivalry deepens into romance, the stakes grow ever more dangerous.'},
  'atomic-habits':    {title:'Atomic Habits',        author:'James Clear',      cover:'https://covers.openlibrary.org/b/id/10521270-L.jpg',  s:'Clear explains how tiny changes compound into remarkable results and gives a practical framework for making good habits automatic and bad ones unattractive.'},
  'dune':             {title:'Dune',                 author:'Frank Herbert',    cover:'https://covers.openlibrary.org/b/id/8370614-L.jpg',   s:'Paul Atreides navigates political intrigue and desert survival on Arrakis, the only source of the most valuable substance in the universe.'},
  'hobbit':           {title:'The Hobbit',           author:'J.R.R. Tolkien',  cover:'https://covers.openlibrary.org/b/id/6979861-L.jpg',   s:'Bilbo Baggins is swept into an epic quest to reclaim a lost kingdom from the dragon Smaug. A timeless adventure of courage and unexpected heroism.'},
  'silent-patient':   {title:'The Silent Patient',   author:'Alex Michaelides',cover:'https://covers.openlibrary.org/b/id/9272648-L.jpg',   s:'Alicia Berenson shoots her husband and never speaks again. A psychotherapist becomes obsessed with uncovering her motive.'},
  'midnight-library': {title:'The Midnight Library', author:'Matt Haig',       cover:'https://covers.openlibrary.org/b/id/10410782-L.jpg',  s:'Between life and death exists a library of infinite books, each a different life. Nora must decide which life is truly worth living.'},
  'gone-girl':        {title:'Gone Girl',            author:'Gillian Flynn',   cover:'https://covers.openlibrary.org/b/id/8371112-L.jpg',   s:'Amy Dunne disappears on her anniversary. Unreliable narrators dissect marriage, media, and the psychology of deception.'},
  'martian':          {title:'The Martian',          author:'Andy Weir',       cover:'https://covers.openlibrary.org/b/id/8391800-L.jpg',   s:'Mark Watney is stranded alone on Mars. Armed with botany, ingenuity, and dark humor, he must survive and signal NASA.'}
};

/* Persisted: pom_books */
let bkState = LS.get('pom_books', {});
Object.keys(BOOKS).forEach(k => { if (!bkState[k]) bkState[k] = {rating:0,link:''}; });

let curBook = null;
function openBook(key) {
  const bk=BOOKS[key], st=bkState[key]; if(!bk) return;
  curBook=key;
  $('bookDetailTitle').textContent=bk.title;
  $('bookDetailAuthor').textContent=bk.author;
  $('bookSummaryText').textContent=bk.s;
  const cov=$('bookCover'); cov.innerHTML='';
  const img=new Image(); img.src=bk.cover; img.alt=bk.title;
  img.onerror=()=>{cov.innerHTML='📖';}; cov.appendChild(img);
  document.querySelectorAll('.star').forEach(s => s.classList.toggle('on', +s.dataset.star<=st.rating));
  $('bookLinkInput').value=st.link;
  $('bookDetailModal').classList.add('open');
}
document.querySelectorAll('.book-card').forEach(c => c.addEventListener('click', () => openBook(c.dataset.book)));
document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    const n=+star.dataset.star; if(!curBook) return;
    bkState[curBook].rating=n; LS.set('pom_books',bkState);
    document.querySelectorAll('.star').forEach(s=>s.classList.toggle('on',+s.dataset.star<=n));
  });
  star.addEventListener('mouseenter', () => { const n=+star.dataset.star; document.querySelectorAll('.star').forEach(s=>s.style.color=+s.dataset.star<=n?'var(--lav)':''); });
  star.addEventListener('mouseleave', () => document.querySelectorAll('.star').forEach(s=>s.style.color=''));
});
$('bookLinkInput').addEventListener('input', () => { if(curBook){bkState[curBook].link=$('bookLinkInput').value;LS.set('pom_books',bkState);} });
$('bookLinkOpen').addEventListener('click', () => { const u=$('bookLinkInput').value.trim(); if(u) window.open(u.startsWith('http')?u:'https://'+u,'_blank'); });
$('bookDetailClose').addEventListener('click', () => $('bookDetailModal').classList.remove('open'));
$('bookDetailModal').addEventListener('click', e => { if(e.target===$('bookDetailModal')) $('bookDetailModal').classList.remove('open'); });

/* ════════════════════════════════════════
   MUSIC PLAYER
   Playlist not persisted (local files = blob URLs, can't save)
════════════════════════════════════════ */
const aud=$('audioPlayer'), pBtn=$('musicPlay'), prvBtn=$('musicPrev'), nxtBtn=$('musicNext');
const volEl=$('musicVolume'), upEl=$('musicUpload');
const trkEl=$('musicTrack'), artEl=$('musicArtist'), fillEl=$('musicFill'), timeEl=$('musicTimeDisplay');
const barEl=$('musicProgressBar');
let plist=[], tidx=0;
const fmt=s=>isNaN(s)?'0:00':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

/* Persist volume */
aud.volume = LS.get('pom_vol', 0.8);
volEl.value = aud.volume;
volEl.addEventListener('input', () => { aud.volume=+volEl.value; LS.set('pom_vol',+volEl.value); });

function loadTrack(i) {
  if(!plist.length) return;
  tidx=(i+plist.length)%plist.length;
  const t=plist[tidx]; aud.src=t.url;
  trkEl.textContent=t.name; artEl.textContent=t.size?`${(t.size/1048576).toFixed(1)} MB`:'—';
  fillEl.style.width='0%'; timeEl.textContent='0:00 / 0:00';
}
function togPlay(){if(!plist.length)return;aud.paused?(aud.play(),pBtn.textContent='⏸'):(aud.pause(),pBtn.textContent='▶');}
aud.addEventListener('timeupdate',()=>{if(!aud.duration)return;fillEl.style.width=(aud.currentTime/aud.duration*100)+'%';timeEl.textContent=`${fmt(aud.currentTime)} / ${fmt(aud.duration)}`;});
aud.addEventListener('ended',()=>{loadTrack(tidx+1);aud.play();pBtn.textContent='⏸';});
barEl.addEventListener('click',e=>{if(!aud.duration)return;const r=barEl.getBoundingClientRect();aud.currentTime=(e.clientX-r.left)/r.width*aud.duration;});
pBtn.addEventListener('click',togPlay);
prvBtn.addEventListener('click',()=>{loadTrack(tidx-1);if(!aud.paused)aud.play();});
nxtBtn.addEventListener('click',()=>{loadTrack(tidx+1);if(!aud.paused)aud.play();});
upEl.addEventListener('change',e=>{
  const was=!plist.length;
  Array.from(e.target.files).forEach(f=>plist.push({name:f.name.replace(/\.[^.]+$/,''),size:f.size,url:URL.createObjectURL(f)}));
  if(was&&plist.length) loadTrack(0);
  e.target.value='';
});
