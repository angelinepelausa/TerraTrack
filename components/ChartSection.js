import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

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
        <BarChart
          data={chartData}
          width={width * 0.9}
          height={160}
          fromZero
          showValuesOnTopOfBars
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={styles.chartStyle}
          verticalLabelRotation={0}
          yLabelsOffset={10}
        />
      ) : (
        <Text style={styles.noDataText}>No data available</Text>
      )}
    </View>
  );
};

const YearDropdown = ({ selectedYear, years, dropdownOpen, setDropdownOpen, setSelectedYear }) => (
  <View style={styles.dropdownWrapperLeft}>
    <TouchableOpacity
      style={styles.dropdownButtonSmall}
      onPress={() => setDropdownOpen({ year: !dropdownOpen, category: false })}
    >
      <Text style={styles.dropdownButtonTextSmall}>{selectedYear}</Text>
    </TouchableOpacity>
    {dropdownOpen && (
      <View style={styles.dropdownOverlayFull}>
        {years.map(y => (
          <TouchableOpacity
            key={y}
            style={[styles.optionFull, { backgroundColor: selectedYear === y ? '#709775' : 'transparent' }]}
            onPress={() => { setSelectedYear(y); setDropdownOpen({}); }}
          >
            <Text style={{ color: selectedYear === y ? '#fff' : '#ccc' }}>{y}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const CategoryDropdown = ({ selectedCategory, categories, dropdownOpen, setDropdownOpen, setSelectedCategory }) => (
  <View style={styles.dropdownWrapperRight}>
    <TouchableOpacity
      style={styles.dropdownButtonSmall}
      onPress={() => setDropdownOpen({ year: false, category: !dropdownOpen })}
    >
      <Text style={styles.dropdownButtonTextSmall}>{selectedCategory}</Text>
    </TouchableOpacity>
    {dropdownOpen && (
      <View style={styles.dropdownOverlayFull}>
        {categories.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.optionFull, { backgroundColor: selectedCategory === c ? '#709775' : 'transparent' }]}
            onPress={() => { setSelectedCategory(c); setDropdownOpen({}); }}
          >
            <Text style={{ color: selectedCategory === c ? '#fff' : '#ccc' }}>{c}</Text>
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
  style: { borderRadius: 16 }
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
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#709775',
    fontWeight: '700',
    fontSize: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1
  },
  dropdownWrapperLeft: {
    marginRight: 8
  },
  dropdownWrapperRight: {
    marginLeft: 8
  },
  dropdownButtonSmall: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButtonTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  dropdownOverlayFull: {
    position: 'absolute',
    top: 35,
    width: '200%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  optionFull: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 8
  },
  noDataText: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 12
  }
};