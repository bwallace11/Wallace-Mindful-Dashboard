export const getDayStreak = (startDate) => {
  const start = new Date(startDate);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffInTime = today.getTime() - start.getTime();
  const streak = Math.floor(diffInTime / (1000 * 60 * 60 * 24));

  return streak;
};
