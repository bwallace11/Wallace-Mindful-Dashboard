const allTheMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const allTheDays = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export const initDate = () => {
  const dateNow = new Date();

  document.querySelector(".month").textContent = allTheMonths[dateNow.getMonth()];
  document.querySelector(".dayOfMonth").textContent = dateNow.getDate();
  document.querySelector(".year").textContent = dateNow.getFullYear();
  document.querySelector(".dayOfWeek").textContent = allTheDays[dateNow.getDay()];
  document.querySelector(".date").setAttribute("datetime", dateNow);
};