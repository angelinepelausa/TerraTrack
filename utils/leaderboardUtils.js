export const computeWeeklyCycle = () => {
  const now = new Date();

  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const diff = end - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  const timeLeft = `${days}d ${hours}h ${minutes}m`;

  return { start, end, timeLeft };
};

export const computeNextWeeklyCycle = (currentCycleTimeLeft) => {
  const now = new Date();

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const timeLeft = currentCycleTimeLeft;

  return { start, end, timeLeft };
};
