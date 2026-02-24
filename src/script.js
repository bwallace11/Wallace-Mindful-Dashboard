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
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAYS_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// Days that get a filled dot: Mon=1, Tue=2, Thu=4, Fri=5, Sat=6
const DOT_DAYS = new Set([1, 2, 4, 5, 6]);
// Days that get a stroke: Sun=0, Wed=3
const STROKE_DAYS = new Set([0, 3]);

const now = new Date();
const todayDate  = now.getDate();
const todayMonth = now.getMonth();
const todayYear  = now.getFullYear();
const todayDow   = now.getDay(); // 0=Sun

// Written date display
document.querySelector('.month').textContent    = MONTHS[todayMonth];
document.querySelector('.dayOfMonth').textContent = todayDate;
document.querySelector('.year').textContent     = todayYear;
document.querySelector('.dayOfWeek').textContent = DAYS_LONG[todayDow];

// Month/year label
document.getElementById('calMonthYear').textContent =
  `${MONTHS[todayMonth].slice(0, 3)} ${todayYear}`;

// Build calendar
const grid = document.getElementById('calGrid');

// Day name headers
DAYS_SHORT.forEach(d => {
  const el = document.createElement('div');
  el.className = 'cal-day-name';
  el.textContent = d;
  grid.appendChild(el);
});

// First day of month & total days
const firstDow = new Date(todayYear, todayMonth, 1).getDay();
const daysInMonth = new Date(todayYear, todayMonth + 1, 0).getDate();

// Empty cells before first day
for (let i = 0; i < firstDow; i++) {
  const el = document.createElement('div');
  el.className = 'cal-day empty';
  grid.appendChild(el);
}

// Day cells
for (let d = 1; d <= daysInMonth; d++) {
  const dow = (firstDow + d - 1) % 7;
  const el = document.createElement('div');
  el.className = 'cal-day';
  el.textContent = d;

  if (d === todayDate) {
    el.classList.add('today');
  } else if (DOT_DAYS.has(dow)) {
    el.classList.add('dot-day');
  } else if (STROKE_DAYS.has(dow)) {
    el.classList.add('stroke-day');
  }

  grid.appendChild(el);
}

// ── Anniversary ──
const elemAge = document.querySelector('.ageOfPerson');
const ageVal = calculateAgeOf('2022-04-20');
elemAge.textContent = ageVal;
elemAge.setAttribute('datetime', String(ageVal));

// ── Days Until Graduation ──
const elemEvent = document.querySelector('.daysUntilEvent');
const daysVal = getDaysUntilEvent('2026-06-15');
elemEvent.textContent = daysVal;

// ── Days Journaled ──
const elemStreak = document.querySelector('.streakOfDays');
const streakVal = getDayStreak('2026-01-01');
elemStreak.textContent = streakVal;

// ── Library Modal ──
const openBtn   = document.getElementById('openLibrary');
const modal     = document.getElementById('libraryModal');

openBtn.addEventListener('click', () => modal.classList.add('active'));
modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.remove('active');
});
