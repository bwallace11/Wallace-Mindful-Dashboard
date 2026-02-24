const theClockApp = () => {
  const now = new Date();
  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const pad = n => String(n).padStart(2, '0');

  document.querySelector('.hours').textContent = pad(h);
  document.querySelector('.minutes').textContent = pad(now.getMinutes());
  document.querySelector('.seconds').textContent = pad(now.getSeconds());
  document.querySelector('.amOrPm').textContent = ampm;
  document.querySelector('.time').setAttribute('datetime', now.toISOString());
};

export const initClock = () => {
  theClockApp();
  setInterval(theClockApp, 1000);
};
