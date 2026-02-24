export const getDaysUntilEvent = (eventDate) => {
  const now = new Date();
  const event = new Date(eventDate);

  now.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);

  const diffInTime = event.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

  return daysUntil;
};
