import { initClock } from './clock.js';
import { calculateAgeOf } from './calculateAgeOf.js';
import { getDaysUntilEvent } from './daysTillEvent.js';
import { getDayStreak } from './streakOfDays.js';
import { initRain } from './rain.js';

/* ══════════════════════════════════════
   LOCALSTORAGE HELPERS
══════════════════════════════════════ */
const LS = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

/* ══════════════════════════════════════
   THEME
══════════════════════════════════════ */
const html = document.documentElement;
let currentTheme = LS.get('pom_theme', 'dark');
html.setAttribute('data-theme', currentTheme);

function updateRainColor() {
  window._rainColorLight = currentTheme === 'light' ||
    (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
}
updateRainColor();
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', updateRainColor);

document.querySelectorAll('.theme-btn').forEach(btn => {
  if (btn.dataset.themeSet === currentTheme) btn.classList.add('active');
  btn.addEventListener('click', () => {
    currentTheme = btn.dataset.themeSet;
    html.setAttribute('data-theme', currentTheme);
    LS.set('pom_theme', currentTheme);
    updateRainColor();
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
initRain();
initClock();

/* ══════════════════════════════════════
   DATE + CALENDAR
══════════════════════════════════════ */
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DOT_DAYS    = new Set([1,2,4,5,6]); // Mon Tue Thu Fri Sat
const STROKE_DAYS = new Set([0,3]);        // Sun Wed

const now        = new Date();
const todayDate  = now.getDate();
const todayMonth = now.getMonth();
const todayYear  = now.getFullYear();
const todayDow   = now.getDay();

document.querySelector('.month').textContent       = MONTHS[todayMonth];
document.querySelector('.dayOfMonth').textContent  = todayDate;
document.querySelector('.year').textContent        = todayYear;
document.querySelector('.dayOfWeek').textContent   = DAYS_LONG[todayDow];
document.getElementById('calMonthYear').textContent = `${MONTHS[todayMonth].slice(0,3)} ${todayYear}`;

let calData = LS.get('pom_cal', {});

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function buildCalendar() {
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  DAYS_SHORT.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name'; el.textContent = d; grid.appendChild(el);
  });
  const firstDow    = new Date(todayYear, todayMonth, 1).getDay();
  const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();
  for (let i = 0; i < firstDow; i++) {
    const el = document.createElement('div'); el.className = 'cal-day empty'; grid.appendChild(el);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDow + d - 1) % 7;
    const key = dateKey(todayYear, todayMonth, d);
    const el  = document.createElement('div');
    el.className = 'cal-day'; el.textContent = d; el.dataset.dateKey = key;
    if      (d === todayDate)       el.classList.add('today');
    else if (DOT_DAYS.has(dow))     el.classList.add('dot-day');
    else if (STROKE_DAYS.has(dow))  el.classList.add('stroke-day');
    const saved = calData[key];
    if (saved && (saved.note || saved.reminders?.length)) el.classList.add('has-note');
    el.addEventListener('click', () => openCalModal(key, d));
    grid.appendChild(el);
  }
}
buildCalendar();

/* ── Calendar Modal ── */
const calModal        = document.getElementById('calModal');
const calModalClose   = document.getElementById('calModalClose');
const calModalDate    = document.getElementById('calModalDate');
const calNotesInput   = document.getElementById('calNotesInput');
const calReminderInput= document.getElementById('calReminderInput');
const calAddReminderBtn=document.getElementById('calAddReminder');
const calRemindersList= document.getElementById('calRemindersList');
let activeCalKey = null;

function openCalModal(key, dayNum) {
  activeCalKey = key;
  const [y,m,d] = key.split('-').map(Number);
  calModalDate.textContent = new Date(y, m-1, d).toLocaleDateString('en-US',
    { weekday:'long', month:'long', day:'numeric', year:'numeric' });
  const saved = calData[key] || { note:'', reminders:[] };
  calNotesInput.value = saved.note || '';
  renderReminders(saved.reminders || []);
  calModal.classList.add('active');
  setTimeout(() => calNotesInput.focus(), 50);
}

function renderReminders(list) {
  calRemindersList.innerHTML = '';
  list.forEach((text, i) => {
    const item = document.createElement('div');
    item.className = 'reminder-item';
    item.innerHTML = `<span class="reminder-dot"></span><span>${text}</span>`;
    const del = document.createElement('button');
    del.className = 'reminder-del'; del.textContent = '×';
    del.addEventListener('click', () => {
      calData[activeCalKey].reminders.splice(i, 1);
      LS.set('pom_cal', calData);
      renderReminders(calData[activeCalKey].reminders); buildCalendar();
    });
    item.appendChild(del); calRemindersList.appendChild(item);
  });
}

calNotesInput.addEventListener('input', () => {
  if (!activeCalKey) return;
  if (!calData[activeCalKey]) calData[activeCalKey] = { note:'', reminders:[] };
  calData[activeCalKey].note = calNotesInput.value;
  LS.set('pom_cal', calData); buildCalendar();
});

calAddReminderBtn.addEventListener('click', () => {
  const val = calReminderInput.value.trim();
  if (!val || !activeCalKey) return;
  if (!calData[activeCalKey]) calData[activeCalKey] = { note:'', reminders:[] };
  calData[activeCalKey].reminders.push(val);
  LS.set('pom_cal', calData); calReminderInput.value = '';
  renderReminders(calData[activeCalKey].reminders); buildCalendar();
});
calReminderInput.addEventListener('keydown', e => { if (e.key === 'Enter') calAddReminderBtn.click(); });
calModalClose.addEventListener('click', () => calModal.classList.remove('active'));
calModal.addEventListener('click', e => { if (e.target === calModal) calModal.classList.remove('active'); });

/* ══════════════════════════════════════
   STATS
══════════════════════════════════════ */
const ageEl = document.querySelector('.ageOfPerson');
const ageV  = calculateAgeOf('2022-04-20');
ageEl.textContent = ageV; ageEl.setAttribute('datetime', String(ageV));

document.querySelector('.daysUntilEvent').textContent = getDaysUntilEvent('2026-06-15');
document.querySelector('.streakOfDays').textContent   = getDayStreak('2026-01-01');

/* ══════════════════════════════════════
   FOX PICTURE
══════════════════════════════════════ */
async function loadFox() {
  const wrap = document.getElementById('foxImgWrap');
  try {
    const res  = await fetch('https://randomfox.ca/floof/');
    const data = await res.json();
    const img  = document.createElement('img');
    img.src = data.image; img.alt = 'A cute fox';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';
    img.onload = () => { img.style.opacity = '1'; };
    wrap.innerHTML = ''; wrap.appendChild(img);
  } catch {
    wrap.innerHTML = '🦊';
  }
}
loadFox();
// Click card to get a new fox
document.getElementById('foxCard').addEventListener('click', loadFox);

/* ══════════════════════════════════════
   MOON PHASE
══════════════════════════════════════ */
function getMoonPhase(date) {
  // Synodic month = 29.53059 days
  // Known new moon: Jan 6 2000 18:14 UTC
  const known = new Date('2000-01-06T18:14:00Z');
  const diff  = (date - known) / (1000 * 60 * 60 * 24);
  const cycle = 29.53059;
  const age   = ((diff % cycle) + cycle) % cycle; // 0 = new, 14.77 = full

  const phases = [
    { name: 'New Moon',        emoji: '🌑', range: [0,    1.85]  },
    { name: 'Waxing Crescent', emoji: '🌒', range: [1.85, 7.38]  },
    { name: 'First Quarter',   emoji: '🌓', range: [7.38, 9.22]  },
    { name: 'Waxing Gibbous',  emoji: '🌔', range: [9.22, 14.77] },
    { name: 'Full Moon',       emoji: '🌕', range: [14.77,16.61] },
    { name: 'Waning Gibbous',  emoji: '🌖', range: [16.61,22.15] },
    { name: 'Last Quarter',    emoji: '🌗', range: [22.15,24.0]  },
    { name: 'Waning Crescent', emoji: '🌘', range: [24.0, 29.53] }
  ];

  const phase = phases.find(p => age >= p.range[0] && age < p.range[1]) || phases[0];
  const illum = age <= 14.77
    ? Math.round((age / 14.77) * 100)
    : Math.round(((29.53 - age) / 14.77) * 100);

  // Days until next full moon
  let daysToFull = 14.77 - age;
  if (daysToFull < 0) daysToFull += 29.53;

  return { ...phase, age: Math.round(age), illum, daysToFull: Math.ceil(daysToFull) };
}

function drawMoon(canvas, phase) {
  const ctx  = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w/2, cy = h/2, r = w/2 - 4;
  ctx.clearRect(0, 0, w, h);

  // Is it light or dark theme?
  const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
    (document.documentElement.getAttribute('data-theme') === 'system' &&
     window.matchMedia('(prefers-color-scheme: light)').matches);

  const moonColor   = isLight ? '#e8e0f8' : '#d4caf0';
  const shadowColor = isLight ? 'rgba(60,20,120,0.75)' : 'rgba(6,0,16,0.88)';

  // Moon base
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = moonColor; ctx.fill();

  // Shadow overlay based on age (0=new, ~15=full)
  const age = phase.age;
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();

  if (age < 1 || age > 28) {
    // New moon — almost fully dark
    ctx.fillStyle = shadowColor; ctx.fillRect(0, 0, w, h);
  } else if (age < 14.77) {
    // Waxing — shadow on left
    const ellipseX = Math.cos(Math.PI * (age / 14.77)) * r;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI/2, -Math.PI/2); // left half
    ctx.bezierCurveTo(cx + ellipseX, cy - r, cx + ellipseX, cy + r, cx, cy + r);
    ctx.closePath();
    ctx.fillStyle = shadowColor; ctx.fill();
  } else {
    // Waning — shadow on right
    const ellipseX = Math.cos(Math.PI * ((age - 14.77) / 14.77)) * r;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI/2, Math.PI/2); // right half
    ctx.bezierCurveTo(cx + ellipseX, cy + r, cx + ellipseX, cy - r, cx, cy - r);
    ctx.closePath();
    ctx.fillStyle = shadowColor; ctx.fill();
  }
  ctx.restore();

  // Rim
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = isLight ? 'rgba(124,58,237,0.25)' : 'rgba(196,181,253,0.25)';
  ctx.lineWidth = 1; ctx.stroke();
}

(function initMoon() {
  const moon    = getMoonPhase(new Date());
  const canvas  = document.getElementById('moonCanvas');
  const nameEl  = document.getElementById('moonName');
  const detailEl= document.getElementById('moonDetail');

  drawMoon(canvas, moon);
  nameEl.textContent  = `${moon.emoji} ${moon.name}`;
  detailEl.innerHTML  = `${moon.illum}% illuminated<br>Day ${moon.age} of cycle<br>${moon.daysToFull} days to full moon`;

  // Redraw moon when theme changes (colors shift)
  document.querySelectorAll('.theme-btn').forEach(btn =>
    btn.addEventListener('click', () => setTimeout(() => drawMoon(canvas, moon), 50)));
})();

/* ══════════════════════════════════════
   LIBRARY
══════════════════════════════════════ */
document.getElementById('openLibrary').addEventListener('click', () =>
  document.getElementById('libraryModal').classList.add('active'));
document.getElementById('libraryModal').addEventListener('click', e => {
  if (e.target === document.getElementById('libraryModal'))
    document.getElementById('libraryModal').classList.remove('active');
});

/* ══════════════════════════════════════
   BOOKS
══════════════════════════════════════ */
const BOOKS = {
  'night-circus':    { title:'The Night Circus',    author:'Erin Morgenstern', cover:'https://covers.openlibrary.org/b/id/8236055-L.jpg',  summary:'Two young magicians are pitted against each other in a mysterious competition set within a magical black-and-white circus. As their rivalry deepens into romance, the stakes grow ever more dangerous.' },
  'atomic-habits':   { title:'Atomic Habits',        author:'James Clear',      cover:'https://covers.openlibrary.org/b/id/10521270-L.jpg', summary:'Clear explains how tiny changes compound into remarkable results and gives a practical framework for making good behaviors automatic and bad ones unattractive.' },
  'dune':            { title:'Dune',                 author:'Frank Herbert',    cover:'https://covers.openlibrary.org/b/id/8370614-L.jpg',  summary:'Paul Atreides navigates political intrigue and desert survival on Arrakis, the only source of the most valuable substance in the universe. A sweeping saga of power, ecology and destiny.' },
  'hobbit':          { title:'The Hobbit',           author:'J.R.R. Tolkien',  cover:'https://covers.openlibrary.org/b/id/6979861-L.jpg',  summary:'Bilbo Baggins is swept into an epic quest by Gandalf and dwarves to reclaim a lost kingdom from the dragon Smaug. A timeless adventure of courage and unexpected heroism.' },
  'silent-patient':  { title:'The Silent Patient',   author:'Alex Michaelides',cover:'https://covers.openlibrary.org/b/id/9272648-L.jpg',  summary:'Alicia Berenson shoots her husband and never speaks again. Psychotherapist Theo Faber becomes obsessed with uncovering her motive — and discovers a truth he never expected.' },
  'midnight-library':{ title:'The Midnight Library', author:'Matt Haig',       cover:'https://covers.openlibrary.org/b/id/10410782-L.jpg', summary:'Between life and death exists a library of infinite books, each a different life that could have been lived. Nora Seed must decide which life is truly worth living.' },
  'gone-girl':       { title:'Gone Girl',            author:'Gillian Flynn',   cover:'https://covers.openlibrary.org/b/id/8371112-L.jpg',  summary:'Amy Dunne disappears on her fifth anniversary. Her husband becomes the prime suspect. Alternating unreliable narrators dissect marriage, media and the psychology of deception.' },
  'martian':         { title:'The Martian',          author:'Andy Weir',       cover:'https://covers.openlibrary.org/b/id/8391800-L.jpg',  summary:'Mark Watney is stranded alone on Mars. Armed with botany, ingenuity and dark humor, he must survive and signal NASA — a gripping triumph of human problem-solving.' }
};

let bookState = LS.get('pom_books', {});
Object.keys(BOOKS).forEach(k => { if (!bookState[k]) bookState[k] = { rating:0, link:'' }; });

const detailModal = document.getElementById('bookDetailModal');
const detailClose = document.getElementById('bookDetailClose');
const coverEl     = document.getElementById('bookCover');
const titleEl     = document.getElementById('bookDetailTitle');
const authorEl    = document.getElementById('bookDetailAuthor');
const summaryEl   = document.getElementById('bookSummaryText');
const linkInput   = document.getElementById('bookLinkInput');
const linkOpenBtn = document.getElementById('bookLinkOpen');
const stars       = document.querySelectorAll('.star');
let currentBook   = null;

function openBookDetail(key) {
  const book = BOOKS[key]; const state = bookState[key]; if (!book) return;
  currentBook = key;
  titleEl.textContent  = book.title;
  authorEl.textContent = book.author;
  summaryEl.textContent= book.summary;
  coverEl.innerHTML = '';
  if (book.cover) {
    const img = document.createElement('img');
    img.src = book.cover; img.alt = book.title;
    img.onerror = () => { coverEl.innerHTML = '📖'; };
    coverEl.appendChild(img);
  } else coverEl.innerHTML = '📖';
  stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= state.rating));
  linkInput.value = state.link;
  detailModal.classList.add('active');
}

document.querySelectorAll('.book-card').forEach(c => c.addEventListener('click', () => openBookDetail(c.dataset.book)));
stars.forEach(star => {
  star.addEventListener('click', () => {
    const n = parseInt(star.dataset.star); if (!currentBook) return;
    bookState[currentBook].rating = n; LS.set('pom_books', bookState);
    stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= n));
  });
  star.addEventListener('mouseenter', () => { const n = parseInt(star.dataset.star); stars.forEach(s => { s.style.color = parseInt(s.dataset.star) <= n ? 'var(--lavender)' : ''; }); });
  star.addEventListener('mouseleave', () => stars.forEach(s => { s.style.color = ''; }));
});
linkInput.addEventListener('input', () => { if (!currentBook) return; bookState[currentBook].link = linkInput.value; LS.set('pom_books', bookState); });
linkOpenBtn.addEventListener('click', () => { const u = linkInput.value.trim(); if (u) window.open(u.startsWith('http') ? u : 'https://' + u, '_blank'); });
detailClose.addEventListener('click', () => detailModal.classList.remove('active'));
detailModal.addEventListener('click', e => { if (e.target === detailModal) detailModal.classList.remove('active'); });

/* ══════════════════════════════════════
   MUSIC PLAYER
══════════════════════════════════════ */
const audio       = document.getElementById('audioPlayer');
const playBtn     = document.getElementById('musicPlay');
const prevBtn     = document.getElementById('musicPrev');
const nextBtn     = document.getElementById('musicNext');
const volSlider   = document.getElementById('musicVolume');
const uploadInput = document.getElementById('musicUpload');
const trackName   = document.getElementById('musicTrack');
const artistEl    = document.getElementById('musicArtist');
const fillBar     = document.getElementById('musicFill');
const timeDisplay = document.getElementById('musicTimeDisplay');
const progressBar = document.getElementById('musicProgressBar');

let playlist = [], trackIdx = 0;
const fmt = s => isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

function loadTrack(idx) {
  if (!playlist.length) return;
  trackIdx = (idx + playlist.length) % playlist.length;
  const t = playlist[trackIdx];
  audio.src = t.url;
  trackName.textContent = t.name;
  artistEl.textContent  = t.size ? `${(t.size/1048576).toFixed(1)} MB` : '—';
  fillBar.style.width   = '0%';
  timeDisplay.textContent = '0:00 / 0:00';
}

function togglePlay() {
  if (!playlist.length) return;
  if (audio.paused) { audio.play(); playBtn.textContent = '⏸'; }
  else { audio.pause(); playBtn.textContent = '▶'; }
}

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  fillBar.style.width = ((audio.currentTime / audio.duration) * 100) + '%';
  timeDisplay.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
});
audio.addEventListener('ended', () => { loadTrack(trackIdx + 1); audio.play(); playBtn.textContent = '⏸'; });

progressBar.addEventListener('click', e => {
  if (!audio.duration) return;
  const r = progressBar.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
});

volSlider.addEventListener('input', () => { audio.volume = parseFloat(volSlider.value); });
audio.volume = parseFloat(volSlider.value);
playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => { loadTrack(trackIdx - 1); if (!audio.paused) audio.play(); });
nextBtn.addEventListener('click', () => { loadTrack(trackIdx + 1); if (!audio.paused) audio.play(); });

uploadInput.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  const wasEmpty = !playlist.length;
  files.forEach(f => playlist.push({ name: f.name.replace(/\.[^.]+$/, ''), size: f.size, url: URL.createObjectURL(f) }));
  if (wasEmpty && playlist.length) loadTrack(0);
  e.target.value = '';
});
