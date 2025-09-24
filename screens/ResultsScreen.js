// screens/ResultsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const PH_AVERAGE = 2.9; // tonnes annual average
const MAX_BAR_HEIGHT = vScale(210); // instead of SCREEN_HEIGHT * 0.25

const ResultsScreen = ({ route, navigation }) => {
  const { results, compareWithLastMonth } = route.params;

  // Convert kilograms → tonnes
  const totalAnnualTonnes = results.totalAnnual / 1000;
  const transportTonnes = results.transportEmissionAnnual / 1000;
  const electricityTonnes = results.electricityEmissionAnnual / 1000;
  const dietTonnes = results.dietEmissionAnnual / 1000;

  // Decide comparison value (last month OR PH average)
// Decide comparison value
// If compareWithLastMonth exists, use it
// Otherwise, fallback to PH_AVERAGE
const comparisonValue = compareWithLastMonth && compareWithLastMonth.totalAnnual
  ? compareWithLastMonth.totalAnnual / 1000
  : PH_AVERAGE;

const comparisonLabel = compareWithLastMonth && compareWithLastMonth.totalAnnual
  ? 'Last Month'
  : 'Philippines Average';

  // Find largest footprint value for scaling
  const maxValue = Math.max(totalAnnualTonnes, comparisonValue);

  // Scale function to keep bars proportional
  const scaleHeight = (value) => (value / maxValue) * MAX_BAR_HEIGHT;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Carbon Footprint</Text>
      <Text style={styles.subtitle}>
        {compareWithLastMonth
          ? 'See how you compare with last month!'
          : 'See how you compare with the Philippine average!'}
      </Text>

      {/* Chart container */}
      <View style={styles.chartContainer}>
        {/* Your Carbon Footprint Bar */}
        <View style={styles.barWrapper}>
          <View style={[styles.bar, { height: scaleHeight(totalAnnualTonnes) }]}>
            {/* Transport Section */}
            <View style={[styles.section, { flex: transportTonnes, backgroundColor: '#264d36' }]}>
              <Text style={styles.segmentLabel}>Transport</Text>
            </View>

            {/* Electricity Section */}
            <View style={[styles.section, { flex: electricityTonnes, backgroundColor: '#4d6b54' }]}>
              <Text style={styles.segmentLabel}>Electricity</Text>
            </View>

            {/* Diet Section */}
            <View style={[styles.section, { flex: dietTonnes, backgroundColor: '#709775' }]}>
              <Text style={styles.segmentLabel}>Diet</Text>
            </View>
          </View>

          <Text style={styles.barLabel}>{totalAnnualTonnes.toFixed(2)} Tonnes</Text>
          <Text style={styles.xLabel}>Your Carbon Footprint</Text>
        </View>

        {/* Comparison Bar */}
        <View style={styles.barWrapper}>
          <View style={{ alignItems: 'center' }}>
            {!compareWithLastMonth && (
              <Image
                source={require('../assets/images/bear.png')}
                style={styles.bearImage}
                resizeMode="contain"
              />
            )}
            <View
              style={[
                styles.bar,
                {
                  height: scaleHeight(comparisonValue),
                  backgroundColor: '#709775',
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel}>{comparisonValue.toFixed(2)} Tonnes</Text>
          <Text style={styles.xLabel}>{comparisonLabel}</Text>
        </View>
      </View>

      {/* Info */}
      <Text style={styles.info}>
        {compareWithLastMonth
          ? 'Track your progress month by month with TerraTrack.'
          : 'Find out how to maximize your environmental impact with TerraTrack’s features.'}
      </Text>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => navigation.navigate('HomeScreen')}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ResultsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    padding: scale(20),
    alignItems: 'center',
  },
  title: {
    fontFamily: 'DMSans-Bold',
    fontSize: scale(24),
    color: '#709775',
    marginTop: vScale(80),
    marginBottom: vScale(10),
  },
  subtitle: {
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(13),
    marginBottom: vScale(30),
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: vScale(30),
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: scale(80),
    flexDirection: 'column',
    justifyContent: 'flex-start',
    borderRadius: 6,
    overflow: 'hidden',
  },
  section: {
    width: '100%',
  },
  barLabel: {
    color: '#fff',
    marginTop: vScale(5),
    fontFamily: 'DMSans-Bold',
    fontSize: scale(11),
  },
  xLabel: {
    color: '#ccc',
    fontSize: scale(10),
    textAlign: 'center',
    width: scale(70),
    fontFamily: 'DMSans-Medium',
  },
  bearImage: {
    marginBottom: vScale(-15),
    width: scale(120),
    height: vScale(120),
  },
  info: {
    color: '#ccc',
    fontSize: scale(12),
    textAlign: 'center',
    marginBottom: vScale(40),
    marginTop: vScale(20),
    paddingHorizontal: scale(20),
    fontFamily: 'DMSans-Bold',
  },
  continueButton: {
    backgroundColor: '#415D43',
    paddingVertical: vScale(12),
    paddingHorizontal: scale(80),
    borderRadius: 30,
  },
  continueText: {
    color: '#fff',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(14),
  },
  segmentLabel: {
    color: '#fff',
    fontSize: scale(9),
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    width: '100%',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -6 }],
  },
});
