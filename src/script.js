import { initClock } from './clock.js';
import { calculateAgeOf } from './calculateAgeOf.js';
import { getDaysUntilEvent } from './daysTillEvent.js';
import { getDayStreak } from './streakOfDays.js';
import { initRain } from './rain.js';

/* ════════════════════════════════════════
   LOCALSTORAGE HELPERS
════════════════════════════════════════ */
const LS = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
};

/* ════════════════════════════════════════
   THEME
════════════════════════════════════════ */
const html = document.documentElement;
let currentTheme = LS.get('pom_theme', 'dark');
html.setAttribute('data-theme', currentTheme);

document.querySelectorAll('.theme-btn').forEach(btn => {
  const t = btn.dataset.themeSet;
  if (t === currentTheme) btn.classList.add('active');
  btn.addEventListener('click', () => {
    currentTheme = t;
    html.setAttribute('data-theme', t);
    LS.set('pom_theme', t);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Update rain color
    updateRainColor();
  });
});

function updateRainColor() {
  const light = currentTheme === 'light' ||
    (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
  window._rainColorLight = light;
}
updateRainColor();
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', updateRainColor);

/* ════════════════════════════════════════
   RAIN
════════════════════════════════════════ */
initRain();

/* ════════════════════════════════════════
   CLOCK
════════════════════════════════════════ */
initClock();

/* ════════════════════════════════════════
   DATE + CALENDAR
════════════════════════════════════════ */
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DOT_DAYS    = new Set([1, 2, 4, 5, 6]); // Mon Tue Thu Fri Sat
const STROKE_DAYS = new Set([0, 3]);            // Sun Wed

const now        = new Date();
const todayDate  = now.getDate();
const todayMonth = now.getMonth();
const todayYear  = now.getFullYear();
const todayDow   = now.getDay();

document.querySelector('.month').textContent      = MONTHS[todayMonth];
document.querySelector('.dayOfMonth').textContent = todayDate;
document.querySelector('.year').textContent       = todayYear;
document.querySelector('.dayOfWeek').textContent  = DAYS_LONG[todayDow];
document.getElementById('calMonthYear').textContent = `${MONTHS[todayMonth].slice(0, 3)} ${todayYear}`;

// Load saved calendar data
let calData = LS.get('pom_cal', {}); // { "YYYY-MM-DD": { note: "", reminders: [] } }

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function buildCalendar() {
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  DAYS_SHORT.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDow    = new Date(todayYear, todayMonth, 1).getDay();
  const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();

  for (let i = 0; i < firstDow; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = (firstDow + d - 1) % 7;
    const key = dateKey(todayYear, todayMonth, d);
    const el  = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    el.dataset.dateKey = key;
    el.dataset.dayNum  = d;

    if (d === todayDate)       el.classList.add('today');
    else if (DOT_DAYS.has(dow))    el.classList.add('dot-day');
    else if (STROKE_DAYS.has(dow)) el.classList.add('stroke-day');

    // Has saved content?
    const saved = calData[key];
    if (saved && (saved.note || (saved.reminders && saved.reminders.length)))
      el.classList.add('has-note');

    el.addEventListener('click', () => openCalModal(key, d));
    grid.appendChild(el);
  }
}
buildCalendar();

/* ════════════════════════════════════════
   CALENDAR NOTES MODAL
════════════════════════════════════════ */
const calModal       = document.getElementById('calModal');
const calModalClose  = document.getElementById('calModalClose');
const calModalDate   = document.getElementById('calModalDate');
const calNotesInput  = document.getElementById('calNotesInput');
const calReminderInput = document.getElementById('calReminderInput');
const calAddReminder = document.getElementById('calAddReminder');
const calRemindersList = document.getElementById('calRemindersList');
let activeCalKey = null;

function openCalModal(key, dayNum) {
  activeCalKey = key;
  const parts = key.split('-');
  const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
  calModalDate.textContent = dateObj.toLocaleDateString('en-US',
    { weekday:'long', month:'long', day:'numeric', year:'numeric' });

  const saved = calData[key] || { note: '', reminders: [] };
  calNotesInput.value = saved.note || '';
  renderReminders(saved.reminders || []);
  calModal.classList.add('active');
  calNotesInput.focus();
}

function renderReminders(list) {
  calRemindersList.innerHTML = '';
  list.forEach((text, i) => {
    const item = document.createElement('div');
    item.className = 'reminder-item';
    item.innerHTML = `<span class="reminder-dot"></span><span>${text}</span>`;
    const del = document.createElement('button');
    del.className = 'reminder-del';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Remove reminder');
    del.addEventListener('click', () => {
      const d = calData[activeCalKey];
      if (d) { d.reminders.splice(i, 1); LS.set('pom_cal', calData); }
      renderReminders(calData[activeCalKey]?.reminders || []);
      buildCalendar();
    });
    item.appendChild(del);
    calRemindersList.appendChild(item);
  });
}

function saveCalNote() {
  if (!activeCalKey) return;
  if (!calData[activeCalKey]) calData[activeCalKey] = { note:'', reminders:[] };
  calData[activeCalKey].note = calNotesInput.value;
  LS.set('pom_cal', calData);
  buildCalendar();
}

calNotesInput.addEventListener('input', saveCalNote);

calAddReminder.addEventListener('click', () => {
  const val = calReminderInput.value.trim();
  if (!val || !activeCalKey) return;
  if (!calData[activeCalKey]) calData[activeCalKey] = { note:'', reminders:[] };
  calData[activeCalKey].reminders.push(val);
  LS.set('pom_cal', calData);
  calReminderInput.value = '';
  renderReminders(calData[activeCalKey].reminders);
  buildCalendar();
});

calReminderInput.addEventListener('keydown', e => { if (e.key === 'Enter') calAddReminder.click(); });

calModalClose.addEventListener('click', () => calModal.classList.remove('active'));
calModal.addEventListener('click', e => { if (e.target === calModal) calModal.classList.remove('active'); });

/* ════════════════════════════════════════
   STATS
════════════════════════════════════════ */
const elemAge = document.querySelector('.ageOfPerson');
const ageVal  = calculateAgeOf('2022-04-20');
elemAge.textContent = ageVal;
elemAge.setAttribute('datetime', String(ageVal));

document.querySelector('.daysUntilEvent').textContent = getDaysUntilEvent('2026-06-15');
document.querySelector('.streakOfDays').textContent   = getDayStreak('2026-01-01');

/* ════════════════════════════════════════
   LIBRARY MODAL
════════════════════════════════════════ */
document.getElementById('openLibrary').addEventListener('click', () =>
  document.getElementById('libraryModal').classList.add('active'));
document.getElementById('libraryModal').addEventListener('click', e => {
  if (e.target === document.getElementById('libraryModal'))
    document.getElementById('libraryModal').classList.remove('active');
});

/* ════════════════════════════════════════
   BOOK DATA
════════════════════════════════════════ */
const BOOKS = {
  'night-circus':    { title:'The Night Circus',     author:'Erin Morgenstern', cover:'https://covers.openlibrary.org/b/id/8236055-L.jpg', summary:'Two young magicians, Celia and Marco, are pitted against each other in a mysterious competition set within a magical black-and-white circus that appears without warning. As their rivalry deepens into romance, the stakes grow ever more dangerous.' },
  'atomic-habits':   { title:'Atomic Habits',         author:'James Clear',       cover:'https://covers.openlibrary.org/b/id/10521270-L.jpg', summary:'An easy and proven way to build good habits and break bad ones. Clear explains how tiny changes compound into remarkable results and gives a practical framework for making good behaviors automatic.' },
  'dune':            { title:'Dune',                  author:'Frank Herbert',     cover:'https://covers.openlibrary.org/b/id/8370614-L.jpg', summary:'Set in the distant future, Dune follows Paul Atreides as his family accepts stewardship of Arrakis — the only source of the most valuable substance in the universe. A saga of politics, religion, ecology, and human survival.' },
  'hobbit':          { title:'The Hobbit',            author:'J.R.R. Tolkien',   cover:'https://covers.openlibrary.org/b/id/6979861-L.jpg', summary:'Bilbo Baggins, a comfortable hobbit, is swept into an epic quest by Gandalf and a company of dwarves to reclaim the lost dwarf kingdom of Erebor and face the dragon Smaug.' },
  'silent-patient':  { title:'The Silent Patient',    author:'Alex Michaelides', cover:'https://covers.openlibrary.org/b/id/9272648-L.jpg', summary:'Alicia Berenson shoots her husband and never speaks again. Psychotherapist Theo Faber becomes obsessed with uncovering her motive — and discovers a shocking truth he never expected.' },
  'midnight-library':{ title:'The Midnight Library',  author:'Matt Haig',        cover:'https://covers.openlibrary.org/b/id/10410782-L.jpg', summary:'Between life and death exists a library with infinite books, each a different life that could have been lived. Nora Seed must decide which life is truly worth living before the library disappears.' },
  'gone-girl':       { title:'Gone Girl',             author:'Gillian Flynn',    cover:'https://covers.openlibrary.org/b/id/8371112-L.jpg', summary:'On their fifth anniversary Amy Dunne disappears. Her husband Nick becomes the prime suspect. Alternating unreliable narrators dissect marriage, media, and the psychology of two damaged people.' },
  'martian':         { title:'The Martian',           author:'Andy Weir',        cover:'https://covers.openlibrary.org/b/id/8391800-L.jpg', summary:'Astronaut Mark Watney is left for dead on Mars. Armed with botanical knowledge, ingenuity, and dark humor, he must figure out how to survive — and let NASA know he\'s still alive.' }
};

// Load saved book state
let bookState = LS.get('pom_books', {});
Object.keys(BOOKS).forEach(k => {
  if (!bookState[k]) bookState[k] = { rating: 0, link: '' };
});

/* ── Book Detail Modal ── */
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
  const book  = BOOKS[key];
  const state = bookState[key];
  if (!book) return;
  currentBook = key;

  titleEl.textContent  = book.title;
  authorEl.textContent = book.author;
  summaryEl.textContent = book.summary;

  coverEl.innerHTML = '';
  if (book.cover) {
    const img = document.createElement('img');
    img.src = book.cover;
    img.alt = book.title;
    img.onerror = () => { coverEl.innerHTML = '📖'; };
    coverEl.appendChild(img);
  } else { coverEl.innerHTML = '📖'; }

  stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= state.rating));
  linkInput.value = state.link;
  detailModal.classList.add('active');
}

document.querySelectorAll('.book-card').forEach(card =>
  card.addEventListener('click', () => openBookDetail(card.dataset.book)));

stars.forEach(star => {
  star.addEventListener('click', () => {
    const n = parseInt(star.dataset.star);
    if (!currentBook) return;
    bookState[currentBook].rating = n;
    LS.set('pom_books', bookState);
    stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= n));
  });
  star.addEventListener('mouseenter', () => {
    const n = parseInt(star.dataset.star);
    stars.forEach(s => { s.style.color = parseInt(s.dataset.star) <= n ? 'var(--lavender)' : ''; });
  });
  star.addEventListener('mouseleave', () => stars.forEach(s => { s.style.color = ''; }));
});

linkInput.addEventListener('input', () => {
  if (!currentBook) return;
  bookState[currentBook].link = linkInput.value;
  LS.set('pom_books', bookState);
});
linkOpenBtn.addEventListener('click', () => {
  const url = linkInput.value.trim();
  if (url) window.open(url.startsWith('http') ? url : 'https://' + url, '_blank');
});
detailClose.addEventListener('click', () => detailModal.classList.remove('active'));
detailModal.addEventListener('click', e => { if (e.target === detailModal) detailModal.classList.remove('active'); });

/* ════════════════════════════════════════
   MUSIC PLAYER
════════════════════════════════════════ */
const audio        = document.getElementById('audioPlayer');
const playBtn      = document.getElementById('musicPlay');
const prevBtn      = document.getElementById('musicPrev');
const nextBtn      = document.getElementById('musicNext');
const volSlider    = document.getElementById('musicVolume');
const uploadInput  = document.getElementById('musicUpload');
const trackName    = document.getElementById('musicTrack');
const artistEl     = document.getElementById('musicArtist');
const fillBar      = document.getElementById('musicFill');
const timeDisplay  = document.getElementById('musicTimeDisplay');
const progressBar  = document.querySelector('.music-progress-bar');

let playlist = [];
let trackIdx = 0;

function fmt(s) {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s/60);
  const sec = String(Math.floor(s%60)).padStart(2,'0');
  return `${m}:${sec}`;
}

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
  const pct = (audio.currentTime / audio.duration) * 100;
  fillBar.style.width = pct + '%';
  timeDisplay.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
});

audio.addEventListener('ended', () => { loadTrack(trackIdx + 1); audio.play(); playBtn.textContent = '⏸'; });

progressBar.addEventListener('click', e => {
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  audio.currentTime = ratio * audio.duration;
});

volSlider.addEventListener('input', () => { audio.volume = parseFloat(volSlider.value); });
audio.volume = parseFloat(volSlider.value);

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => { loadTrack(trackIdx - 1); if (!audio.paused) audio.play(); });
nextBtn.addEventListener('click', () => { loadTrack(trackIdx + 1); if (!audio.paused) audio.play(); });

uploadInput.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  const wasEmpty = playlist.length === 0;
  files.forEach(f => {
    playlist.push({ name: f.name.replace(/\.[^.]+$/, ''), size: f.size, url: URL.createObjectURL(f) });
  });
  if (wasEmpty && playlist.length) {
    loadTrack(0);
  }
  e.target.value = '';
});
