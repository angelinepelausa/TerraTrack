import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export const ChartSection = ({
  chartData,
  chartLoading,
  selectedYear,
  selectedCategory,
  years,
  categories,
  dropdownOpen,
  setDropdownOpen,
  setSelectedYear,
  setSelectedCategory
}) => {
  // Compute chart width to fit all data
  const barCount = chartData.labels?.length || 0;
  const minBarWidth = 35;
  const maxBarWidth = 60;
  const availableWidth = width * 0.85;
  const calculatedWidth = Math.max(availableWidth, barCount * minBarWidth);
  const chartWidth = Math.min(calculatedWidth, barCount * maxBarWidth);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Carbon Footprint Tracker</Text>
        <View style={styles.dropdownRow}>
          <YearDropdown
            selectedYear={selectedYear}
            years={years}
            dropdownOpen={dropdownOpen.year}
            setDropdownOpen={setDropdownOpen}
            setSelectedYear={setSelectedYear}
          />
          <CategoryDropdown
            selectedCategory={selectedCategory}
            categories={categories}
            dropdownOpen={dropdownOpen.category}
            setDropdownOpen={setDropdownOpen}
            setSelectedCategory={setSelectedCategory}
          />
        </View>
      </View>

      {chartLoading ? (
        <ActivityIndicator size="small" color="#709775" style={{ marginTop: 20 }} />
      ) : chartData.labels.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={200}
            fromZero
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chartStyle}
            verticalLabelRotation={barCount > 6 ? -45 : 0}
            yLabelsOffset={10}
            withVerticalLabels={true}
            segments={4}
            yAxisLabel=""
            bezier
            withDots={true}
            withInnerLines={true}
            withOuterLines={true}
          />
        </View>
      ) : (
        <Text style={styles.noDataText}>No data available</Text>
      )}
    </View>
  );
};

const YearDropdown = ({ selectedYear, years, dropdownOpen, setDropdownOpen, setSelectedYear }) => (
  <View style={styles.dropdownWrapper}>
    <TouchableOpacity
      style={styles.dropdownButton}
      onPress={() => setDropdownOpen({ year: !dropdownOpen, category: false })}
    >
      <Text style={styles.dropdownButtonText}>{selectedYear}</Text>
    </TouchableOpacity>
    {dropdownOpen && (
      <View style={styles.dropdownOverlay}>
        {years.map(y => (
          <TouchableOpacity
            key={y}
            style={[styles.option, { backgroundColor: selectedYear === y ? '#709775' : 'transparent' }]}
            onPress={() => { setSelectedYear(y); setDropdownOpen({}); }}
          >
            <Text style={{ color: selectedYear === y ? '#fff' : '#ccc', fontSize: 12 }}>{y}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const CategoryDropdown = ({ selectedCategory, categories, dropdownOpen, setDropdownOpen, setSelectedCategory }) => (
  <View style={styles.dropdownWrapper}>
    <TouchableOpacity
      style={styles.dropdownButton}
      onPress={() => setDropdownOpen({ year: false, category: !dropdownOpen })}
    >
      <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
    </TouchableOpacity>
    {dropdownOpen && (
      <View style={styles.dropdownOverlay}>
        {categories.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.option, { backgroundColor: selectedCategory === c ? '#709775' : 'transparent' }]}
            onPress={() => { setSelectedCategory(c); setDropdownOpen({}); }}
          >
            <Text style={{ color: selectedCategory === c ? '#fff' : '#ccc', fontSize: 12 }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const chartConfig = {
  backgroundColor: '#1c1c1c',
  backgroundGradientFrom: '#1c1c1c',
  backgroundGradientTo: '#1c1c1c',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(112, 151, 117, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: { 
    borderRadius: 16,
  },
  propsForLabels: {
    fontSize: 10,
  },
  propsForVerticalLabels: {
    dx: -5,
  },
  strokeWidth: 3,
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: "#709775",
    fill: "#1c1c1c"
  }
};

const styles = {
  section: {
    width: '90%',
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#709775',
    fontWeight: '700',
    fontSize: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
  },
  dropdownWrapper: {
    marginLeft: 8,
  },
  dropdownButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 35,
    right: 0,
    minWidth: 100,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingVertical: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 8,
  },
  noDataText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  }
};