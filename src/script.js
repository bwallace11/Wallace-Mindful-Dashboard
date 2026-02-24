import { initClock } from './clock.js';
import { calculateAgeOf } from './calculateAgeOf.js';
import { getDaysUntilEvent } from './daysTillEvent.js';
import { getDayStreak } from './streakOfDays.js';
import { initRain } from './rain.js';

// ── Rain ──
initRain();

// ── Clock ──
initClock();

// ── Date + Calendar ──
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
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

document.getElementById('calMonthYear').textContent =
  `${MONTHS[todayMonth].slice(0, 3)} ${todayYear}`;

const grid = document.getElementById('calGrid');

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
  const el  = document.createElement('div');
  el.className = 'cal-day';
  el.textContent = d;
  if      (d === todayDate)      el.classList.add('today');
  else if (DOT_DAYS.has(dow))    el.classList.add('dot-day');
  else if (STROKE_DAYS.has(dow)) el.classList.add('stroke-day');
  grid.appendChild(el);
}

// ── Anniversary ──
const elemAge = document.querySelector('.ageOfPerson');
const ageVal  = calculateAgeOf('2022-04-20');
elemAge.textContent = ageVal;
elemAge.setAttribute('datetime', String(ageVal));

// ── Days Until Graduation ──
document.querySelector('.daysUntilEvent').textContent = getDaysUntilEvent('2026-06-15');

// ── Days Journaled ──
document.querySelector('.streakOfDays').textContent = getDayStreak('2026-01-01');

// ────────────────────────────────────────────────
// ── Book Data ──
// ────────────────────────────────────────────────
const BOOKS = {
  'night-circus': {
    title:   'The Night Circus',
    author:  'Erin Morgenstern',
    cover:   'https://covers.openlibrary.org/b/id/8236055-L.jpg',
    summary: 'Two young magicians, Celia and Marco, are pitted against each other in a mysterious competition set within a magical black-and-white circus that appears without warning. As their rivalry deepens into romance, the stakes of the contest — and the fate of the circus and everyone in it — grow ever more dangerous.'
  },
  'atomic-habits': {
    title:   'Atomic Habits',
    author:  'James Clear',
    cover:   'https://covers.openlibrary.org/b/id/10521270-L.jpg',
    summary: 'An easy and proven way to build good habits and break bad ones. Drawing on the latest research in biology, psychology, and neuroscience, Clear explains how tiny changes can compound into remarkable results — and gives a practical framework for making good behaviors automatic.'
  },
  'dune': {
    title:   'Dune',
    author:  'Frank Herbert',
    cover:   'https://covers.openlibrary.org/b/id/8370614-L.jpg',
    summary: 'Set in the distant future, Dune follows young Paul Atreides as his family accepts stewardship of the desert planet Arrakis — the only source of the most valuable substance in the universe. A sweeping saga of politics, religion, ecology, and human survival.'
  },
  'hobbit': {
    title:   'The Hobbit',
    author:  'J.R.R. Tolkien',
    cover:   'https://covers.openlibrary.org/b/id/6979861-L.jpg',
    summary: 'Bilbo Baggins, a comfortable hobbit who has never had an adventure, is swept into an epic quest by the wizard Gandalf and a company of dwarves to reclaim the lost dwarf kingdom of Erebor — and face the terrifying dragon Smaug.'
  },
  'silent-patient': {
    title:   'The Silent Patient',
    author:  'Alex Michaelides',
    cover:   'https://covers.openlibrary.org/b/id/9272648-L.jpg',
    summary: 'Alicia Berenson, a famous painter, shoots her husband five times and then never speaks again. Theo Faber, a criminal psychotherapist, becomes obsessed with uncovering her motive — and discovers a shocking truth he never expected.'
  },
  'midnight-library': {
    title:   'The Midnight Library',
    author:  'Matt Haig',
    cover:   'https://covers.openlibrary.org/b/id/10410782-L.jpg',
    summary: 'Between life and death exists a library of infinite books, each representing a different life that could have been lived. Nora Seed finds herself there and must decide which life is truly worth living before the library disappears forever.'
  },
  'gone-girl': {
    title:   'Gone Girl',
    author:  'Gillian Flynn',
    cover:   'https://covers.openlibrary.org/b/id/8371112-L.jpg',
    summary: 'On their fifth wedding anniversary, Amy Dunne disappears. Her husband Nick becomes the prime suspect. Told through alternating unreliable perspectives, Gone Girl dissects marriage, media manipulation, and the dark psychology of two profoundly damaged people.'
  },
  'martian': {
    title:   'The Martian',
    author:  'Andy Weir',
    cover:   'https://covers.openlibrary.org/b/id/8391800-L.jpg',
    summary: 'Astronaut Mark Watney is left for dead on Mars after a storm forces his crew to evacuate. Armed with little more than his botanical knowledge, engineering ingenuity, and dark humor, he must figure out how to survive — and let NASA know he\'s still alive.'
  }
};

// Per-book saved state (ratings & links, in-memory)
const bookState = {};
Object.keys(BOOKS).forEach(k => { bookState[k] = { rating: 0, link: '' }; });

// ── Library Modal ──
document.getElementById('openLibrary').addEventListener('click', () => {
  document.getElementById('libraryModal').classList.add('active');
});
document.getElementById('libraryModal').addEventListener('click', e => {
  if (e.target === document.getElementById('libraryModal'))
    document.getElementById('libraryModal').classList.remove('active');
});

// ── Book Detail Modal ──
const detailModal    = document.getElementById('bookDetailModal');
const detailClose    = document.getElementById('bookDetailClose');
const coverEl        = document.getElementById('bookCover');
const titleEl        = document.getElementById('bookDetailTitle');
const authorEl       = document.getElementById('bookDetailAuthor');
const summaryEl      = document.getElementById('bookSummaryText');
const linkInput      = document.getElementById('bookLinkInput');
const linkOpenBtn    = document.getElementById('bookLinkOpen');
const stars          = document.querySelectorAll('.star');

let currentBook = null;

function openBookDetail(bookKey) {
  const book  = BOOKS[bookKey];
  const state = bookState[bookKey];
  if (!book) return;

  currentBook = bookKey;

  // Title & author
  titleEl.textContent  = book.title;
  authorEl.textContent = book.author;
  summaryEl.textContent = book.summary;

  // Cover — try image, fallback to emoji
  coverEl.innerHTML = '';
  if (book.cover) {
    const img = document.createElement('img');
    img.src = book.cover;
    img.alt = book.title;
    img.onerror = () => { coverEl.innerHTML = '📖'; };
    coverEl.appendChild(img);
  } else {
    coverEl.innerHTML = '📖';
  }

  // Stars
  stars.forEach(s => {
    const n = parseInt(s.dataset.star);
    s.classList.toggle('active', n <= state.rating);
  });

  // Link
  linkInput.value = state.link;

  detailModal.classList.add('active');
}

// Click book card
document.querySelectorAll('.book-card').forEach(card => {
  card.addEventListener('click', () => {
    openBookDetail(card.dataset.book);
  });
});

// Star rating
stars.forEach(star => {
  star.addEventListener('click', () => {
    const n = parseInt(star.dataset.star);
    if (currentBook) {
      bookState[currentBook].rating = n;
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= n));
    }
  });
  star.addEventListener('mouseenter', () => {
    const n = parseInt(star.dataset.star);
    stars.forEach(s => s.style.color = parseInt(s.dataset.star) <= n ? 'var(--lavender)' : '');
  });
  star.addEventListener('mouseleave', () => {
    stars.forEach(s => { s.style.color = ''; });
  });
});

// Link input save + open
linkInput.addEventListener('input', () => {
  if (currentBook) bookState[currentBook].link = linkInput.value;
});
linkOpenBtn.addEventListener('click', () => {
  const url = linkInput.value.trim();
  if (url) window.open(url.startsWith('http') ? url : 'https://' + url, '_blank');
});

// Close
detailClose.addEventListener('click', () => detailModal.classList.remove('active'));
detailModal.addEventListener('click', e => {
  if (e.target === detailModal) detailModal.classList.remove('active');
});
