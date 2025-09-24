// utils/leaderboardUtils.js

export const computeWeeklyCycle = () => {
  const now = new Date();

  // Start of current week (Sunday)
  const day = now.getDay(); // Sunday=0
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);

  // End of current week (Saturday 11:59:59 PM)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  // Time left until end of current week
  const diff = end - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const timeLeft = `${days}d ${hours}h ${minutes}m`;

  return { start, end, timeLeft };
};

// Compute next cycle for Upcoming tab
export const computeNextWeeklyCycle = (currentCycleTimeLeft) => {
  const now = new Date();

  // Start of next week (next Sunday)
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 7);
  start.setHours(0, 0, 0, 0);

  // End of next week (next Saturday)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  // Use same timeLeft as current cycle
  const timeLeft = currentCycleTimeLeft;

  return { start, end, timeLeft };
};
