const theClockApp = () => {
  const timeNow = new Date();

  let gotHours = timeNow.getHours();
  let gotMinutes = timeNow.getMinutes();
  let gotSeconds = timeNow.getSeconds();
  let gotAmOrPm = gotHours >= 12 ? "PM" : "AM";

  gotHours = gotHours % 12 || 12;
  gotHours = gotHours < 10 ? `0${gotHours}` : gotHours;
  gotMinutes = gotMinutes < 10 ? `0${gotMinutes}` : gotMinutes;
  gotSeconds = gotSeconds < 10 ? `0${gotSeconds}` : gotSeconds;

  document.querySelector(".hours").textContent = gotHours;
  document.querySelector(".minutes").textContent = gotMinutes;
  document.querySelector(".seconds").textContent = gotSeconds;
  document.querySelector(".amOrPm").textContent = gotAmOrPm;
  document.querySelector(".time").setAttribute("datetime", timeNow);
};

export const initClock = () => setInterval(theClockApp, 1000);