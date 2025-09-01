const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const statsService = {
  /**
   * Convert footprint docs into monthly chart data.
   * @param {Array} docs - footprint docs [{ id: "YYYY-MM", results: {...} }]
   * @param {string} category - optional: "Diet", "Transport", "Energy"
   */
  toMonthlyChartData(docs, category = "Total") {
    if (!docs || docs.length === 0) return { labels: [], datasets: [{ data: [] }] };

    // Sort by doc.id (YYYY-MM)
    const sorted = docs.sort((a, b) => a.id.localeCompare(b.id));

    const labels = [];
    const values = [];

    sorted.forEach(doc => {
      const { results } = doc;
      if (!results) return;

      const [, monthStr] = doc.id.split("-");
      const monthIndex = parseInt(monthStr, 10) - 1;
      labels.push(monthNames[monthIndex]);

      let value = 0;

      if (category === "Diet") value = results.dietEmissionMonthly || 0;
      else if (category === "Transport") value = results.transportEmissionMonthly || 0;
      else if (category === "Energy") value = results.electricityEmissionMonthly || 0;
      else value = results.totalMonthly || 0; // fallback to total

      values.push(value);
    });

    return { 
      labels, 
      datasets: [{ data: values }] 
    };
  }
};
