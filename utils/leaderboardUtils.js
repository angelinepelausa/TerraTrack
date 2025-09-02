// utils/leaderboardUtils.js
export const computeWeeklyCycle = () => {
  const now = new Date();

  // find most recent Sunday (start of week)
  const day = now.getDay(); // Sunday=0
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0,0,0,0);

  // end of Saturday (11:59 PM)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);

  // compute time left
  const diff = end - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const timeLeft = `${days}d ${hours}h ${minutes}m`;

  return { start, end, timeLeft };
};
