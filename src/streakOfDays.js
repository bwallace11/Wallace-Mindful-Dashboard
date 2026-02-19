// Function
export const getDayStreak = (startDate) => {
    // Convert start date to Date object
    const start = new Date(startDate);
  
    // Clear time portion for accurate day calculation
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    // Calculate difference in milliseconds and convert to days
    const diffInTime = today.getTime() - start.getTime();
  
    const streak = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
  
    return streak;
  };
  