import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// --- CONSTANTS ---
const TRANSPORT_EMISSION_FACTORS = {
  'Diesel Car': 0.157,
  'Hybrid Car': 0.1078,
  'Electric Car': 0,
  'Gasoline Car': 0.235,
  'Motorbike': 0.11337,
  'Train': 0.91,
  'Bus': 0.10144,
  'Jeepney': 0.02766,
  'Tricycle': 0.03779,
};

const FREQUENCY_VALUES = {
  'Daily': 30,
  '4-5 Times a week': 25,
  'Once a week': 4,
  'Rarely (2-3x a month)': 3
};

const DISTANCE_VALUES = {
  '1-5 KM': 5,
  '5-10 KM': 10,
  '10-20 KM': 20,
  '20-30 KM': 30,
  'More than 30 KM': 40
};

const DIET_VALUES = {
  '1–10 meals/month': 10,
  '11–20 meals/month': 15,
  '21–40 meals/month': 30,
  '41–60 meals/month': 50,
  '61–90 meals/month': 70
};

// Emissions per meal (kg CO₂ per meal)
const MEAL_EMISSIONS = {
  meat: 7.8,
  dairy: 1.425,
  fish: 2.68
};

// Electricity constants
const GRID_EMISSION_FACTOR = 0.7288; // kg CO₂/kWh

// --- MAIN CALCULATION ---
export const calculateCarbonFootprint = (answers) => {
  let transportEmissionMonthly = 0;

  // Public transportation
  if (answers.publicTransportType) {
    answers.publicTransportType.forEach((type) => {
      const freqKey = `publicTransportFrequency_${type}`;
      const distKey = `publicTransportDistance_${type}`;
      const frequency = FREQUENCY_VALUES[answers[freqKey]] || 0;
      const distance = DISTANCE_VALUES[answers[distKey]] || 0;
      transportEmissionMonthly += frequency * distance * TRANSPORT_EMISSION_FACTORS[type];
    });
  }

  // Private vehicles
  if (answers.vehicleType) {
    answers.vehicleType.forEach((vehicle) => {
      const freqKey = `vehicleFrequency_${vehicle}`;
      const distKey = `vehicleDistance_${vehicle}`;
      const frequency = FREQUENCY_VALUES[answers[freqKey]] || 0;
      const distance = DISTANCE_VALUES[answers[distKey]] || 0;
      transportEmissionMonthly += frequency * distance * TRANSPORT_EMISSION_FACTORS[vehicle];
    });
  }

  // Electricity
  const householdSize = parseFloat(answers.householdSize) || 0;
  const electricityRate = parseFloat(answers.electricityRate) || 0;
  const electricityBill = parseFloat(answers.electricityBill) || 0;

  const monthlyKWh = electricityBill / electricityRate;
  const electricityEmissionMonthly = (monthlyKWh * GRID_EMISSION_FACTOR) / householdSize;

  // Diet
  const meatMeals = DIET_VALUES[answers.meatMeals] || 0;
  const dairyMeals = DIET_VALUES[answers.dairyMeals] || 0;
  const fishMeals = DIET_VALUES[answers.fishMeals] || 0;

  const dietEmissionMonthly =
    (meatMeals * MEAL_EMISSIONS.meat) +
    (dairyMeals * MEAL_EMISSIONS.dairy) +
    (fishMeals * MEAL_EMISSIONS.fish);

  // Totals
  const totalMonthly = transportEmissionMonthly + electricityEmissionMonthly + dietEmissionMonthly;

  return {
    // Monthly
    transportEmissionMonthly: parseFloat(transportEmissionMonthly.toFixed(2)),
    electricityEmissionMonthly: parseFloat(electricityEmissionMonthly.toFixed(2)),
    dietEmissionMonthly: parseFloat(dietEmissionMonthly.toFixed(2)),
    totalMonthly: parseFloat(totalMonthly.toFixed(2)),

    // Annual
    transportEmissionAnnual: parseFloat((transportEmissionMonthly * 12).toFixed(2)),
    electricityEmissionAnnual: parseFloat((electricityEmissionMonthly * 12).toFixed(2)),
    dietEmissionAnnual: parseFloat((dietEmissionMonthly * 12).toFixed(2)),
    totalAnnual: parseFloat((totalMonthly * 12).toFixed(2))
  };
};

// --- SAVE TO FIRESTORE ---
export const saveCarbonFootprint = async (answers) => {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('User not authenticated');

    const results = calculateCarbonFootprint(answers);

    const date = new Date();
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('footprints')
      .doc(monthKey)
      .set({
        answers,
        results,
        createdAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    return results;
  } catch (error) {
    console.error('Error saving carbon footprint:', error);
    throw error;
  }
};
