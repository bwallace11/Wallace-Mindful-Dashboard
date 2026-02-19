// Function
export const getDaysUntilEvent = (eventDate) => {
  // Create Date objects for now and the event
  const now = new Date();
  const event = new Date(eventDate);

  // Clear time portion for accurate day calculation
  now.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);

  // Calculate difference in milliseconds
  const diffInTime = event.getTime() - now.getTime();

  // Convert to days
  const daysUntil = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

  return daysUntil;
};
