import { useState, useEffect } from 'react';
import { statsRepository } from '../repositories/statsRepository';
import { statsService } from '../services/statsService';

export const useChartData = (userId, selectedYear, selectedCategory, userData) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    if (selectedYear && selectedCategory && userData) {
      fetchChart(selectedYear, selectedCategory);
    }
  }, [selectedYear, selectedCategory, userData]);

  const fetchChart = async (year, category) => {
    setChartLoading(true);
    try {
      if (!userData?.avatar) {
        setChartData({ labels: [], datasets: [{ data: [] }] });
      } else {
        const footprints = await statsRepository.getUserStats(userId);
        const chartReady = statsService.toMonthlyChartData(footprints, category);
        setChartData(chartReady);
      }
    } catch (err) {
      console.error('Error fetching chart:', err);
      setChartData({ labels: [], datasets: [{ data: [] }] });
    } finally {
      setChartLoading(false);
    }
  };

  return {
    chartData,
    chartLoading,
    fetchChart
  };
};