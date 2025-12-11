import { useState, useEffect } from 'react';
import { statsRepository } from '../repositories/statsRepository';
import { statsService } from '../services/statsService';

export const useChartData = (userId, selectedYear, selectedCategory, userData) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [chartLoading, setChartLoading] = useState(true);
  const [displayType, setDisplayType] = useState('no-data');
  const [meaningfulData, setMeaningfulData] = useState([]);

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
        setMeaningfulData([]);
        setDisplayType('no-data');
      } else {
        const footprints = await statsRepository.getUserStats(userId);
        const chartReady = statsService.toMonthlyChartData(footprints, category);
        
        // Filter out months with zero/no data
        const filteredData = [];
        if (chartReady.labels && chartReady.datasets?.[0]?.data) {
          chartReady.labels.forEach((label, index) => {
            const value = chartReady.datasets[0].data[index];
            if (value > 0) {
              filteredData.push({ label, value });
            }
          });
        }

        // Determine display type based on data count
        const dataPointCount = filteredData.length;
        let newDisplayType = 'no-data';
        
        if (dataPointCount === 1) {
          newDisplayType = 'single-text';
        } else if (dataPointCount === 2) {
          newDisplayType = 'double-cards';
        } else if (dataPointCount >= 3 && dataPointCount <= 6) {
          newDisplayType = 'bar-chart';
        } else if (dataPointCount > 6) {
          newDisplayType = 'line-chart';
        }

        // Create filtered chart data for bar/line charts
        const filteredChartData = {
          labels: filteredData.map(item => item.label),
          datasets: [{
            data: filteredData.map(item => Math.round(item.value))
          }]
        };

        setChartData(filteredChartData);
        setMeaningfulData(filteredData);
        setDisplayType(newDisplayType);
      }
    } catch (err) {
      console.error('Error fetching chart:', err);
      setChartData({ labels: [], datasets: [{ data: [] }] });
      setMeaningfulData([]);
      setDisplayType('no-data');
    } finally {
      setChartLoading(false);
    }
  };

  return {
    chartData,
    chartLoading,
    displayType,
    meaningfulData,
    fetchChart
  };
};