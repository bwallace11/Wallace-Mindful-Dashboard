const theClockApp = () => {
  const now = new Date();
  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const pad = n => String(n).padStart(2, '0');

  const hoursEl   = document.querySelector('.hours');
  const minsEl    = document.querySelector('.minutes');
  const secsEl    = document.querySelector('.seconds');
  const ampmEl    = document.querySelector('.amOrPm');
  const timeEl    = document.querySelector('.time');

  if (hoursEl)   hoursEl.textContent   = pad(h);
  if (minsEl)    minsEl.textContent    = pad(now.getMinutes());
  if (secsEl)    secsEl.textContent    = pad(now.getSeconds());
  if (ampmEl)    ampmEl.textContent    = ampm;
  if (timeEl)    timeEl.setAttribute('datetime', now.toISOString());
};

export const initClock = () => {
  theClockApp();
  setInterval(theClockApp, 1000);
};
