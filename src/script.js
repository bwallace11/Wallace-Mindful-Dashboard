import { initClock } from './clock.js';
import { initDate } from './date.js';
import { calculateAgeOf } from './calculateAgeOf.js';
import { getDaysUntilEvent } from './daysTillEvent.js';
import { getDayStreak } from './streakOfDays.js';
import { initRain } from './rain.js';

// Background rain
initRain();

// Clock
initClock();

// Date
initDate();

// Anniversary
const elemAge = document.querySelector('.ageOfPerson');
const ageVal = calculateAgeOf('2022-04-20');
elemAge.textContent = ageVal;
elemAge.setAttribute('datetime', ageVal);

// Days Until Graduation
const elemEvent = document.querySelector('.daysUntilEvent');
const daysVal = getDaysUntilEvent('2026-06-15');
elemEvent.textContent = daysVal;

// Days Journaled
const elemStreak = document.querySelector('.streakOfDays');
const streakVal = getDayStreak('2026-01-01');
elemStreak.textContent = streakVal;
