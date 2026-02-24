const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday'
];

export const initDate = () => {
  const d = new Date();

  document.querySelector('.month').textContent = MONTHS[d.getMonth()];
  document.querySelector('.dayOfMonth').textContent = d.getDate();
  document.querySelector('.year').textContent = d.getFullYear();
  document.querySelector('.dayOfWeek').textContent = DAYS[d.getDay()];
  document.querySelector('.date').setAttribute('datetime', d.toISOString());
};
